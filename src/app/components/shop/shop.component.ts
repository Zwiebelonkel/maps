import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface RadiusUpgrade {
  level: number;
  radius: number;
  cost: number;
  description: string;
}

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
  @Input() availableUpgrades: RadiusUpgrade[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() purchaseUpgrade = new EventEmitter<RadiusUpgrade>();
  adminCode = '';
  codeMessage = '';

  get currentUpgrade(): RadiusUpgrade | undefined {
    return this.availableUpgrades.find((u) => u.level === this.currentLevel);
  }

  get nextUpgrades(): RadiusUpgrade[] {
    return this.availableUpgrades.filter((u) => u.level > this.currentLevel);
  }

  canAfford(upgrade: RadiusUpgrade): boolean {
    return this.totalCoins >= upgrade.cost;
  }

  onClose() {
    this.close.emit();
  }

  onPurchase(upgrade: RadiusUpgrade) {
    if (this.canAfford(upgrade)) {
      this.purchaseUpgrade.emit(upgrade);
    }
  }

  getProgressToNextLevel(upgrade: RadiusUpgrade): number {
    if (this.totalCoins >= upgrade.cost) return 100;
    return (this.totalCoins / upgrade.cost) * 100;
  }

  redeemCode() {
    if (this.adminCode === '1906') {
      this.purchaseUpgrade.emit({
        level: -1,
        radius: 0,
        cost: -10000000,
        description: 'ADMIN_COINS',
      });

      this.codeMessage = '💰 10.000.000 Coins erhalten!';
      this.adminCode = '';
    } else {
      this.codeMessage = '❌ Falscher Code';
    }
  }
}
