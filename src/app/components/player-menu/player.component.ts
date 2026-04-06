import {
  Component,
  Output,
  EventEmitter,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayerService } from '../../../services/player.service';
import { NotificationService } from '../../../services/notification.service';
import { OUTFITS, Outfit } from '../../config/player.config';
import { SoundService } from '../../../services/sound.service';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PlayerComponent {
  @Output() close = new EventEmitter<void>();

  outfits = OUTFITS;
  isOpen = true;
  isClosing = false;

  selectedOutfit: Outfit | null = null;

  // ── FILTER ─────────────────────────────
  filters = {
    rarity: 'all',
    unlocked: 'all',
    category: 'all',
  };

  private touchStartY = 0;
  private touchCurrentY = 0;
  private isDraggingHeader = false;

  // Map für Performance
  private outfitMap = new Map(OUTFITS.map(o => [o.id, o]));

  constructor(
    public player: PlayerService,
    public notification: NotificationService,
    private sound: SoundService,
  ) {}

  // ── FILTER LOGIK ───────────────────────
  get filteredOutfits(): Outfit[] {
    return this.outfits.filter(o => {
      if (this.filters.rarity !== 'all' && o.rarity !== this.filters.rarity) {
        return false;
      }

      if (this.filters.unlocked === 'unlocked' && !this.isUnlocked(o.id)) {
        return false;
      }
      if (this.filters.unlocked === 'locked' && this.isUnlocked(o.id)) {
        return false;
      }

      if (
        this.filters.category !== 'all' &&
        o.effect.type !== this.filters.category
      ) {
        return false;
      }

      return true;
    });
  }

  closeWithAnimation() {
    this.sound.play('button', 0.5);
    this.isClosing = true;
    setTimeout(() => {
      this.isClosing = false;
      this.isOpen = false;
      this.close.emit();
    }, 320);
  }

  isUnlocked(id: string) {
    return this.player.unlocked.includes(id);
  }

  getOutfit(id: string): Outfit | undefined {
    return this.outfitMap.get(id);
  }

  equip(outfit: Outfit) {
    if (!this.isUnlocked(outfit.id)) return;

    this.sound.play('button', 0.5);
    this.player.equip(outfit.id);
    this.notification.markAsSeen(outfit.id)
  }

  unequip(id: string) {
    this.sound.play('button', 0.5);
    this.player.unequip(id);
  }

  // ── TOUCH DRAG ─────────────────────────
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