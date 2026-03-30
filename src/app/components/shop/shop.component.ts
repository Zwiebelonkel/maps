import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  GAME_CONFIG,
  RadiusUpgrade,
  ClickUpgrade,
  ShopItem,
} from '../../config/game.config';
import { SoundService } from '../../../services/sound.service';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
})
export class ShopComponent {
  @Input() isOpen = false;
  @Input() totalCoins = 0;
  @Input() currentLevel = 1;
  @Input() currentClickLevel = 1;
  @Output() close = new EventEmitter<void>();
  @Output() purchaseUpgrade = new EventEmitter<RadiusUpgrade>();
  @Output() purchaseClickUpgrade = new EventEmitter<ClickUpgrade>();
@Output() purchaseLootbox = new EventEmitter<void>();
  @Output() purchaseItem = new EventEmitter<ShopItem>();
  @Output() unlockAllOutfits = new EventEmitter<void>();

  adminCode = '';
  codeMessage = '';
  activeTab: 'radius' | 'click' | 'items' = 'radius';
  isClosing = false;

  private touchStartY = 0;
  private touchCurrentY = 0;
  private isDraggingHeader = false;

  constructor(private sound: SoundService) {}

  // ── Getters ─────────────────────────────────────────────────

  get currentUpgrade(): RadiusUpgrade {
    return {
      level: this.currentLevel,
      radius:
        GAME_CONFIG.BASE_RADIUS + this.currentLevel * GAME_CONFIG.RADIUS_GROWTH,
      cost: 0,
      description: 'Explorer ' + this.currentLevel,
    };
  }

  get currentClickUpgrade(): ClickUpgrade {
    return (
      GAME_CONFIG.CLICK_UPGRADES.find(
        (u) => u.level === this.currentClickLevel,
      ) || GAME_CONFIG.CLICK_UPGRADES[0]
    );
  }

  get nextUpgrades(): RadiusUpgrade[] {
    const upgrades: RadiusUpgrade[] = [];
    for (let i = 1; i <= 5; i++) {
      const level = this.currentLevel + i;
      upgrades.push({
        level,
        radius: GAME_CONFIG.BASE_RADIUS + level * GAME_CONFIG.RADIUS_GROWTH,
        cost: Math.floor(
          GAME_CONFIG.BASE_UPGRADE_COST *
            Math.pow(level, GAME_CONFIG.COST_MULTIPLIER),
        ),
        description: 'Explorer ' + level,
      });
    }
    return upgrades;
  }

  get nextClickUpgrades(): ClickUpgrade[] {
    return GAME_CONFIG.CLICK_UPGRADES.filter(
      (u) => u.level > this.currentClickLevel,
    );
  }

  get shopItems(): ShopItem[] {
    return GAME_CONFIG.SHOP_ITEMS;
  }

  // ── Affordability ────────────────────────────────────────────

  canAfford(cost: number): boolean {
    return this.totalCoins >= cost;
  }

  getProgress(current: number, required: number): number {
    if (current >= required) return 100;
    return (current / required) * 100;
  }

  // ── Close & Swipe ────────────────────────────────────────────

  onClose() {
    this.close.emit();
  }

  closeWithAnimation() {
  if (this.isClosing) return; // ← verhindert Doppel-Calls
  this.sound.play('button', 0.5);
  this.isClosing = true;
  setTimeout(() => {
    this.isClosing = false;
    this.close.emit(); // direkt emit, nicht onClose()
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

  // ── Tab ─────────────────────────────────────────────────────

  setTab(tab: 'radius' | 'click' | 'items') {
    this.sound.play('button', 0.3);
    this.activeTab = tab;
  }

  // ── Purchases ────────────────────────────────────────────────

  onPurchase(upgrade: RadiusUpgrade) {
    if (this.canAfford(upgrade.cost)) {
      this.sound.play('purchase', 0.7);
      this.purchaseUpgrade.emit(upgrade);
    }
  }

onPurchaseLootbox() {
  if (this.canAfford(5000)) {
    this.sound.play('purchase', 0.7);
    this.purchaseLootbox.emit();
  }
}

  onPurchaseClick(upgrade: ClickUpgrade) {
    if (this.canAfford(upgrade.cost)) {
      this.sound.play('purchase', 0.7);
      this.purchaseClickUpgrade.emit(upgrade);
    }
  }

  onPurchaseItem(item: ShopItem) {
    if (this.canAfford(item.cost)) {
      this.sound.play('purchase', 0.7);
      this.purchaseItem.emit(item);
    }
  }

  // ── Admin Code ───────────────────────────────────────────────

  redeemCode() {
  const code = this.adminCode.trim().toLowerCase();

  if (code === '1906-money') {
    this.purchaseUpgrade.emit({
      level: -1,
      radius: 0,
      cost: -10000000,
      description: 'ADMIN_COINS',
    });
    this.codeMessage = '💰 10.000.000 Coins erhalten!';

  } else if (code === '1906-reset-money') {
    this.purchaseUpgrade.emit({
      level: -1,
      radius: 0,
      cost: 9999999999,
      description: 'ADMIN_RESET_MONEY',
    });
    this.codeMessage = '🔄 Geld wurde zurückgesetzt!';

  } else if (code === '1906-outfits') {
    this.unlockAllOutfits.emit();
    this.codeMessage = '🎒 Alle Ausrüstungen freigeschaltet!';

  } else if (code === '1906-bomb') {
    this.addItem.emit({ id: 'bomb_ultra', amount: 5 });
    this.codeMessage = '💣 5 Ultra Bomben erhalten!';

  } else if (code === '1906-radius') {
    this.purchaseUpgrade.emit({
      level: -1,
      radius: 50,
      cost: 0,
      description: 'ADMIN_RADIUS',
    });
    this.codeMessage = '📡 Radius +50!';

  } else if (code === '1906-luck') {
    this.luckBoost.emit(300); // 5 Minuten Luck Boost
    this.codeMessage = '🍀 Luck Boost für 5 Minuten aktiviert!';

  } else if (code === '1906-xp') {
    this.addXP.emit(5000);
    this.codeMessage = '⭐ 5000 XP erhalten!';

  } else if (code === '1906-lootbox') {
    this.addLootbox.emit(3);
    this.codeMessage = '🎁 3 Lootboxen erhalten!';

  } else if (code === '1906-godmode') {
    this.toggleGodMode.emit();
    this.codeMessage = '👑 Godmode aktiviert!';

  } else if (code === '1906-clear') {
    this.clearFog.emit();
    this.codeMessage = '🌫️ Karte komplett aufgedeckt!';

  } else if (code === '1906-speed') {
    this.speedBoost.emit(300);
    this.codeMessage = '⚡ Speed Boost für 5 Minuten!';

  } else {
    this.codeMessage = '❌ Falscher Code';
  }

  this.adminCode = '';
}
}
