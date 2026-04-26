import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appDragModal]',
  standalone: true,
})
export class DragModalDirective implements AfterViewInit, OnDestroy {
  @Input('appDragModal') dragHandle?: HTMLElement | null;
  @Input() dragDismissDistance = 115;
  @Input() dragDismissVelocity = 0.75;
  @Input() dragDismissAnimationMs = 220;
  @Input() dragMaxUp = 28;
  @Input() dragDisabled = false;
  @Output() dragDismiss = new EventEmitter<void>();

  private cleanup: Array<() => void> = [];
  private isDragging = false;
  private startY = 0;
  private currentY = 0;
  private startTime = 0;
  private pointerId: number | null = null;

  private readonly onWindowPointerMove = (event: PointerEvent) => {
    this.onPointerMove(event);
  };

  private readonly onWindowPointerUp = (event: PointerEvent) => {
    this.onPointerEnd(event);
  };

  private readonly onWindowPointerCancel = (event: PointerEvent) => {
    this.onPointerCancel(event);
  };

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private zone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const handle = this.dragHandle ?? this.elementRef.nativeElement;
      const onPointerDown = (event: PointerEvent) => {
        this.onPointerDown(event);
      };

      handle.addEventListener('pointerdown', onPointerDown, {
        passive: false,
      });

      this.cleanup.push(() => {
        handle.removeEventListener('pointerdown', onPointerDown);
      });
    });
  }

  ngOnDestroy(): void {
    this.cleanup.forEach((fn) => fn());
    this.removeWindowListeners();
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.dragDisabled) return;
    if (!event.isPrimary) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const modal = this.elementRef.nativeElement;
    this.isDragging = true;
    this.pointerId = event.pointerId;
    this.startY = event.clientY;
    this.currentY = 0;
    this.startTime = performance.now();

    modal.classList.remove('is-drag-resetting', 'is-drag-dismissing');
    modal.classList.add('is-dragging');
    modal.style.setProperty('--drag-y', '0px');
    modal.style.setProperty('--drag-progress', '0');

    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // ignored
    }

    this.addWindowListeners();
    event.preventDefault();
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.isDragging) return;
    if (this.pointerId !== event.pointerId) return;

    const rawDeltaY = event.clientY - this.startY;
    let nextY = rawDeltaY;

    if (rawDeltaY < 0) {
      nextY = Math.max(rawDeltaY * 0.22, -this.dragMaxUp);
    }

    this.currentY = nextY;

    const progress = Math.min(Math.max(nextY / this.dragDismissDistance, 0), 1);
    const modal = this.elementRef.nativeElement;

    modal.style.setProperty('--drag-y', `${nextY}px`);
    modal.style.setProperty('--drag-progress', `${progress}`);
    this.setOverlayOpacity(progress);

    event.preventDefault();
  }

  private onPointerEnd(event: PointerEvent): void {
    if (!this.isDragging) return;
    if (this.pointerId !== event.pointerId) return;

    const elapsed = Math.max(performance.now() - this.startTime, 1);
    const velocity = this.currentY / elapsed;

    const shouldDismiss =
      this.currentY > this.dragDismissDistance ||
      (this.currentY > 45 && velocity > this.dragDismissVelocity);

    this.endDragState();

    if (shouldDismiss) {
      this.dismissModal();
    } else {
      this.resetModal();
    }

    event.preventDefault();
  }

  private onPointerCancel(event: PointerEvent): void {
    if (!this.isDragging) return;
    if (this.pointerId !== event.pointerId) return;

    this.endDragState();
    this.resetModal();
  }

  private addWindowListeners(): void {
    window.addEventListener('pointermove', this.onWindowPointerMove, {
      passive: false,
    });
    window.addEventListener('pointerup', this.onWindowPointerUp);
    window.addEventListener('pointercancel', this.onWindowPointerCancel);
  }

  private removeWindowListeners(): void {
    window.removeEventListener('pointermove', this.onWindowPointerMove);
    window.removeEventListener('pointerup', this.onWindowPointerUp);
    window.removeEventListener('pointercancel', this.onWindowPointerCancel);
  }

  private endDragState(): void {
    this.isDragging = false;
    this.pointerId = null;

    const modal = this.elementRef.nativeElement;
    modal.classList.remove('is-dragging');

    this.removeWindowListeners();
  }

  private resetModal(): void {
    const modal = this.elementRef.nativeElement;
    modal.classList.add('is-drag-resetting');
    modal.style.setProperty('--drag-y', '0px');
    modal.style.setProperty('--drag-progress', '0');
    this.resetOverlayOpacity();

    window.setTimeout(() => {
      modal.classList.remove('is-drag-resetting');
    }, 240);
  }

  private dismissModal(): void {
    const modal = this.elementRef.nativeElement;
    modal.classList.add('is-drag-dismissing');
    modal.style.setProperty('--drag-y', '110vh');
    modal.style.setProperty('--drag-progress', '1');
    this.fadeOverlayOut();

    window.setTimeout(() => {
      this.zone.run(() => {
        this.dragDismiss.emit();
      });
    }, this.dragDismissAnimationMs);
  }

  private setOverlayOpacity(progress: number): void {
    const overlay = this.elementRef.nativeElement.parentElement;
    if (!overlay) return;

    const opacity = 1 - progress * 0.45;
    overlay.style.opacity = `${opacity}`;
  }

  private resetOverlayOpacity(): void {
    const overlay = this.elementRef.nativeElement.parentElement;
    if (!overlay) return;

    overlay.style.opacity = '';
  }

  private fadeOverlayOut(): void {
    const overlay = this.elementRef.nativeElement.parentElement;
    if (!overlay) return;

    overlay.style.opacity = '0';
  }
}
