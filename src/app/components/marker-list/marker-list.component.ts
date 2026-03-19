import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkerService } from '../../../services/marker.service';
import { UserMarker } from '../../../../models/user-marker.model';

@Component({
  selector: 'app-marker-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './marker-list.component.html',
  styleUrls: ['./marker-list.component.scss'],
})
export class MarkerListComponent {
  @Output() close = new EventEmitter<void>();

  isOpen = true;
  isClosing = false;

  private touchStartY = 0;
  private touchCurrentY = 0;
  private isDraggingHeader = false;

  constructor(public markerService: MarkerService) {}

  closeWithAnimation() {
    if (this.isClosing) return;

    this.isClosing = true;

    setTimeout(() => {
      this.isOpen = false;
      this.isClosing = false;
      this.close.emit();
    }, 320);
  }

  delete(marker: UserMarker) {
    this.markerService.removeMarker(marker.id);
  }

  // Swipe Down
  onHeaderTouchStart(e: TouchEvent) {
    this.touchStartY = e.touches[0].clientY;
    this.touchCurrentY = this.touchStartY;
    this.isDraggingHeader = true;
  }

  onHeaderTouchMove(e: TouchEvent) {
    if (!this.isDraggingHeader) return;
    this.touchCurrentY = e.touches[0].clientY;
  }

  onHeaderTouchEnd() {
    if (!this.isDraggingHeader) return;

    const diff = this.touchCurrentY - this.touchStartY;

    if (diff > 80) {
      this.closeWithAnimation();
    }

    this.isDraggingHeader = false;
  }
}