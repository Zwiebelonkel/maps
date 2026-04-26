import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Outfit } from '../../config/player.config';

export interface BlackMarketOffer {
  outfit: Outfit;
  price: number;
}

@Component({
  selector: 'app-black-market',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './black-market.component.html',
  styleUrls: ['./black-market.component.scss'],
})
export class BlackMarketComponent {
  @Input() isOpen = false;
  @Input() totalCoins = 0;
  @Input() offers: BlackMarketOffer[] = [];
  @Input() unlockedOutfitIds: string[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() purchase = new EventEmitter<BlackMarketOffer>();

  canAfford(price: number): boolean {
    return this.totalCoins >= price;
  }

  isUnlocked(outfitId: string): boolean {
    return this.unlockedOutfitIds.includes(outfitId);
  }

  onClose() {
    this.close.emit();
  }

  onPurchase(offer: BlackMarketOffer) {
    if (!this.canAfford(offer.price) || this.isUnlocked(offer.outfit.id)) return;
    this.purchase.emit(offer);
  }
}
