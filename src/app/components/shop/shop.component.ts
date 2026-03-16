import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface RadiusUpgrade {
  level: number;
  radius: number;
  cost: number;
  description: string;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule],
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
}
