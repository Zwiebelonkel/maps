import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressionService } from '../../../services/progression.service';
import { SoundService } from '../../../services/sound.service';

@Component({
  selector: 'app-burger-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './burger-menu.component.html',
  styleUrls: ['./burger-menu.component.scss'],
})
export class BurgerMenuComponent {
  @Output() close = new EventEmitter<void>();
  @Output() toggleSession = new EventEmitter<void>();
  @Output() openSettings = new EventEmitter<void>();
  @Output() openMarkers = new EventEmitter<void>();
  @Output() openPlayer = new EventEmitter<void>();
  @Output() openLootbox = new EventEmitter<void>();

  constructor(
    public progression: ProgressionService,
    private sound: SoundService,
  ) {}

  get lootboxes() {
    return this.progression.lootboxes;
  }

  isOpen = true;
  isClosing = false;

  private touchStartY = 0;
  private touchCurrentY = 0;
  private isDraggingHeader = false;

  closeWithAnimation() {
    if (this.isClosing) return;
    this.sound.play('button', 0.5);
    this.isClosing = true;
    setTimeout(() => {
      this.isOpen = false;
      this.isClosing = false;
      this.close.emit();
    }, 320);
  }

  onPlayer() {
    this.openPlayer.emit();
    this.closeWithAnimation();
  }

  onLootbox() {
    this.openLootbox.emit();
    this.close.emit();
  }

  onSession() {
    this.toggleSession.emit();
    this.closeWithAnimation();
  }

  onSettings() {
    this.openSettings.emit();
    this.closeWithAnimation();
  }

  onMarkers() {
    this.openMarkers.emit();
    this.closeWithAnimation();
  }

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

    this.touchStartY = 0;
    this.touchCurrentY = 0;
    this.isDraggingHeader = false;
  }
}
