import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../services/settings.service';
import { SoundService } from '../../../services/sound.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  isOpen = false;
  isClosing = false;
  @Output() gameReset = new EventEmitter<void>();
  @Output() darkMapChanged = new EventEmitter<boolean>();
  @Output() centerRequested = new EventEmitter<void>();
  @Output() visibilityChanged = new EventEmitter<boolean>();
  private touchStartY = 0;
  private touchCurrentY = 0;
  private isDraggingHeader = false;

  get maxRenderTiles() {
    return this.settings.snapshot.maxRenderTiles;
  }

  constructor(
    public settings: SettingsService,
    private sound: SoundService,
  ) {}

  toggle() {
    if (this.isOpen) this.closeWithAnimation();
    else {
      this.isOpen = true;
      this.visibilityChanged.emit(true);
    }
  }

  closeWithAnimation() {
    this.sound.play('button', 0.5);
    this.isClosing = true;
    this.visibilityChanged.emit(true);
    setTimeout(() => {
      this.isClosing = false;
      this.isOpen = false;
      this.visibilityChanged.emit(false);
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

  updateMaxRenderTiles(val: number) {
    this.settings.update({ maxRenderTiles: val });
  }

  toggleDarkMap() {
    this.sound.play('button', 0.5);
    const newVal = !this.settings.snapshot.darkMap;
    this.settings.update({ darkMap: newVal });
    this.darkMapChanged.emit(newVal);
  }

  centerMap() {
    this.sound.play('button', 0.5);
    this.centerRequested.emit();
    this.closeWithAnimation();
  }

  reset() {
    this.sound.play('button', 0.5);
    this.settings.reset();
  }

  resetGame() {
    if (confirm('Möchtest du wirklich deinen gesamten Fortschritt löschen?')) {
      this.sound.play('button', 0.5);
      this.gameReset.emit();
      this.closeWithAnimation();
    }
  }
}
