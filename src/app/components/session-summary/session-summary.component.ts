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
