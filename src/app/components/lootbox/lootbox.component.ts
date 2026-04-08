import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OUTFITS, Outfit } from '../../config/player.config';
import { PlayerService } from '../../../services/player.service';
import { ProgressionService } from '../../../services/progression.service';
import { SoundService } from '../../../services/sound.service';
import { NotificationService } from '../../../services/notification.service';
import { AscensionService } from '../../../services/ascension.service';

const RARITY_WEIGHTS = {
  common: 60,
  rare: 25,
  epic: 12,
  legendary: 2.8,
  exotic: 0.19,
  mythic: 0.01,
};

const DUPLICATE_COINS: Record<string, number> = {
  common: 50,
  rare: 200,
  epic: 750,
  legendary: 3000,
  exotic: 10000,
  mythic: 100000,
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

  // 🔥 PITY SYSTEM
  private pityCounter = 0;
  private readonly PITY_THRESHOLD = 10;

  private touchStartY = 0;
  private touchCurrentY = 0;
  private isDraggingHeader = false;

  constructor(
    public player: PlayerService,
    public progression: ProgressionService,
    private sound: SoundService,
    private notification: NotificationService,
    private ascensionService: AscensionService,
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

  // ── Touch ─────────────────────────

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

  // ── OPEN BOX ─────────────────────

  openBox() {
    if (this.state !== 'idle') return;
    if (!this.progression.useLootbox()) return;

    this.sound.play('lootbox');
    this.state = 'opening';

    setTimeout(() => {
      this.reward = this.rollWeighted();

      // 🔥 PITY LOGIK
      if (this.isBadDrop(this.reward.rarity)) {
        this.pityCounter++;
      } else {
        this.pityCounter = 0;
      }

      if (this.pityCounter >= this.PITY_THRESHOLD) {
        this.reward = this.rollGuaranteedEpic();
        this.pityCounter = 0;
        this.sound.play('legendary'); // optional extra feel
      }

      this.isDuplicate = this.player.unlocked.includes(this.reward.id);

      if (this.isDuplicate) {
        this.duplicateCoins = DUPLICATE_COINS[this.reward.rarity];
        this.coinsEarned.emit(this.duplicateCoins);

        // 🔥 ASCENSION POINTS (DUPLICATE BONUS optional stärker)
        const points = this.ascensionService.getPointsForRarity(
          this.reward.rarity,
        );
        this.ascensionService.addPoints(points);

        this.sound.play('purchase', 0.7);
      } else {
        this.player.unlock(this.reward.id);
        this.notification.addNewOutfit(this.reward.id);

        // 🔥 ASCENSION POINTS (neues Item)
        const points = this.ascensionService.getPointsForRarity(
          this.reward.rarity,
        );
        this.ascensionService.addPoints(points);

        this.sound.play('reward');
      }

      this.state = 'revealed';
    }, 1200);
  }

  // ── WEIGHTED ROLL + MULTIPLIER ─────────────────────

  private rollWeighted(): Outfit {
    const multiplier = this.player.getLootMultiplier() + 0.25; // 🔥 Lootbox leicht besser

    const weights = {
      common: RARITY_WEIGHTS.common / multiplier,
      rare: RARITY_WEIGHTS.rare,
      epic: RARITY_WEIGHTS.epic * multiplier,
      legendary: RARITY_WEIGHTS.legendary * multiplier * 1.3,
      exotic: RARITY_WEIGHTS.exotic * multiplier * 1.6,
      mythic: RARITY_WEIGHTS.mythic * multiplier * 2,
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;

    let targetRarity: string = 'common';

    for (const [rarity, weight] of Object.entries(weights)) {
      roll -= weight;
      if (roll <= 0) {
        targetRarity = rarity;
        break;
      }
    }

    const unlocked = this.player.unlocked;

    let pool = OUTFITS.filter(
      (o) => o.rarity === targetRarity && !unlocked.includes(o.id),
    );

    if (!pool.length) {
      pool = OUTFITS.filter((o) => o.rarity === targetRarity);
    }

    if (!pool.length) {
      return OUTFITS[Math.floor(Math.random() * OUTFITS.length)];
    }

    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ── HELPERS ─────────────────────

  private isBadDrop(rarity: string): boolean {
    return rarity === 'common' || rarity === 'rare';
  }

  private rollGuaranteedEpic(): Outfit {
    const unlocked = this.player.unlocked;

    let pool = OUTFITS.filter(
      (o) =>
        (o.rarity === 'epic' ||
          o.rarity === 'legendary' ||
          o.rarity === 'exotic' ||
          o.rarity === 'mythic') &&
        !unlocked.includes(o.id),
    );

    if (!pool.length) {
      pool = OUTFITS.filter(
        (o) =>
          o.rarity === 'epic' ||
          o.rarity === 'legendary' ||
          o.rarity === 'exotic' ||
          o.rarity === 'mythic',
      );
    }

    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ── RESET ─────────────────────

  resetState() {
    this.sound.play('button', 0.5);
    this.state = 'idle';
    this.reward = null;
    this.isDuplicate = false;
    this.duplicateCoins = 0;
  }
}
