import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopItem } from '../../config/game.config';

export interface BlackMarketOffer {
  item: ShopItem;
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

  @Output() close = new EventEmitter<void>();
  @Output() purchase = new EventEmitter<BlackMarketOffer>();

  canAfford(price: number): boolean {
    return this.totalCoins >= price;
  }

  onClose() {
    this.close.emit();
  }

  onPurchase(offer: BlackMarketOffer) {
    if (!this.canAfford(offer.price)) return;
    this.purchase.emit(offer);
  }
}
