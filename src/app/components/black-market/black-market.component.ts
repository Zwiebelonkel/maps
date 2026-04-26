import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DragModalDirective } from '../../directives/drag-modal.directive';
import { Outfit, RARITY_COLORS } from '../../config/player.config';

export interface BlackMarketOffer {
  outfit: Outfit;
  price: number;
}

@Component({
  selector: 'app-black-market',
  standalone: true,
  imports: [CommonModule, DragModalDirective],
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

  isClosing = false;
  rarityColors = RARITY_COLORS;

  canAfford(price: number): boolean {
    return this.totalCoins >= price;
  }

  isUnlocked(outfitId: string): boolean {
    return this.unlockedOutfitIds.includes(outfitId);
  }

  getRarityColor(rarity: string): string {
    return this.rarityColors[rarity?.toLowerCase()] ?? '#ffffff';
  }

  onClose(): void {
    this.closeWithAnimation();
  }

  onOverlayClick(): void {
    this.closeWithAnimation();
  }

  closeWithAnimation(): void {
    if (this.isClosing) return;

    this.isClosing = true;

    setTimeout(() => {
      this.isClosing = false;
      this.close.emit();
    }, 320);
  }

  onDraggedDismissed(): void {
    this.isClosing = false;
    this.close.emit();
  }

  onPurchase(offer: BlackMarketOffer): void {
    if (!this.canAfford(offer.price) || this.isUnlocked(offer.outfit.id)) return;

    this.purchase.emit(offer);
  }
}
