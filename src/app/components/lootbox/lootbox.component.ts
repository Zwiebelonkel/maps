import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OUTFITS, Outfit } from '../../config/player.config';
import { PlayerService } from '../../../services/player.service';
import { ProgressionService } from '../../../services/progression.service';
import { SoundService } from '../../../services/sound.service';

const RARITY_WEIGHTS = {
  common: 60,
  rare: 25,
  epic: 12,
  legendary: 2.8,
  exotic: 0.19,
  mythic: 0.01, // 💀 EXTREM SELTEN (~1 in 10.000 Rolls)
};

const DUPLICATE_COINS: Record<string, number> = {
  common: 50,
  rare: 200,
  epic: 750,
  legendary: 3000,
  exotic: 10000,
  mythic: 100000, // 💎 fühlt sich richtig fett an
};

@Component({
  selector: 'app-lootbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lootbox.component.html',
  styleUrls: ['./lootbox.component.scss'],
})
export class LootboxComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() coinsEarned = new EventEmitter<number>();

  isOpen = false;
  isClosing = false;
  state: 'idle' | 'opening' | 'revealed' = 'idle';
  reward: Outfit | null = null;
  isDuplicate = false;
  duplicateCoins = 0;

  private touchStartY = 0;
  private touchCurrentY = 0;
  private isDraggingHeader = false;

  constructor(
    public player: PlayerService,
    public progression: ProgressionService,
    private sound: SoundService,
  ) {}

  ngOnInit() {
    setTimeout(() => (this.isOpen = true), 10);
  }

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
    if (diff > 80) this.closeWithAnimation();
    this.touchStartY = 0;
    this.touchCurrentY = 0;
    this.isDraggingHeader = false;
  }

  openBox() {
    if (this.state !== 'idle') return;
    if (!this.progression.useLootbox()) return;
    this.sound.play('lootbox');
    this.state = 'opening';

    setTimeout(() => {
      this.reward = this.rollWeighted();
      this.isDuplicate = this.player.unlocked.includes(this.reward.id);

      if (this.isDuplicate) {
        this.duplicateCoins = DUPLICATE_COINS[this.reward.rarity];
        this.coinsEarned.emit(this.duplicateCoins);
        this.sound.play('purchase', 0.7);
      } else {
        this.player.unlock(this.reward.id);
        this.sound.play('reward');
      }

      this.state = 'revealed';
    }, 1200);
  }

  private rollWeighted(): Outfit {
    const totalWeight = Object.values(RARITY_WEIGHTS).reduce(
      (a, b) => a + b,
      0,
    );
    let roll = Math.random() * totalWeight;

    let targetRarity: string = 'common';
    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
      roll -= weight;
      if (roll <= 0) {
        targetRarity = rarity;
        break;
      }
    }

    const pool = OUTFITS.filter((o) => o.rarity === targetRarity);
    // Fallback falls keine Outfits dieser Rarität
    if (!pool.length)
      return OUTFITS[Math.floor(Math.random() * OUTFITS.length)];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  resetState() {
    this.sound.play('button', 0.5);
    this.state = 'idle';
    this.reward = null;
    this.isDuplicate = false;
    this.duplicateCoins = 0;
  }
}
