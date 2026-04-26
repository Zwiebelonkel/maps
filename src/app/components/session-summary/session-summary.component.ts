import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionStats, SessionService } from '../../../services/session.service';

@Component({
  selector: 'app-session-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-summary.component.html',
  styleUrls: ['./session-summary.component.scss'],
})
export class SessionSummaryComponent {
  @Input() stats: SessionStats | null = null;
  @Input() mapImageUrl: string | null = null;
  @Output() close = new EventEmitter<void>();
  isOpen = true;
  isClosing = false;
  private touchStartY = 0;
  private touchCurrentY = 0;
  private isDraggingHeader = false;

  constructor(public sessionService: SessionService) {}

  async shareRouteScreenshot() {
    if (!this.mapImageUrl) return;

    const filename = `route-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;

    try {
      const response = await fetch(this.mapImageUrl);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'Meine Session-Route',
          text: 'Route-Screenshot aus meiner Session',
          files: [file],
        });
        return;
      }

      this.downloadMapImage(filename);
    } catch {
      this.downloadMapImage(filename);
    }
  }

  private downloadMapImage(filename: string) {
    if (!this.mapImageUrl) return;
    const link = document.createElement('a');
    link.href = this.mapImageUrl;
    link.download = filename;
    link.click();
  }

  closeWithAnimation() {
    if (this.isClosing) return;

    this.isClosing = true;

    setTimeout(() => {
      this.isOpen = false;
      this.isClosing = false;
      this.close.emit();
    }, 320);
  }

  onHeaderTouchStart(e: TouchEvent) {
    this.touchStartY = e.touches[0].clientY;
    this.isDraggingHeader = true;
  }

  onHeaderTouchMove(e: TouchEvent) {
    if (!this.isDraggingHeader) return;
    this.touchCurrentY = e.touches[0].clientY;
  }

  onHeaderTouchEnd() {
    if (!this.isDraggingHeader) return;
    const diff = this.touchCurrentY - this.touchStartY;
    if (diff > 80) this.closeWithAnimation();
    this.touchStartY = 0;
    this.touchCurrentY = 0;
    this.isDraggingHeader = false;
  }
}
