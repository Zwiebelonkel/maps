  import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Outfit, RARITY_COLORS } from '../../config/player.config';

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

  isClosing = false;

  private touchStartY = 0;
  private touchCurrentY = 0;
  private isDraggingHeader = false;

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

  onPurchase(offer: BlackMarketOffer): void {
    if (!this.canAfford(offer.price) || this.isUnlocked(offer.outfit.id)) return;

    this.purchase.emit(offer);
  }

  onHeaderTouchStart(e: TouchEvent): void {
    this.touchStartY = e.touches[0].clientY;
    this.touchCurrentY = this.touchStartY;
    this.isDraggingHeader = true;
  }

  onHeaderTouchMove(e: TouchEvent): void {
    if (!this.isDraggingHeader) return;

    this.touchCurrentY = e.touches[0].clientY;
  }

  onHeaderTouchEnd(): void {
    if (!this.isDraggingHeader) return;

    const diff = this.touchCurrentY - this.touchStartY;

    if (diff > 80) {
      this.closeWithAnimation();
    }

    this.touchStartY = 0;
    this.touchCurrentY = 0;
    this.isDraggingHeader = false;
  }

  onHeaderTouchCancel(): void {
    this.touchStartY = 0;
    this.touchCurrentY = 0;
    this.isDraggingHeader = false;
  }
}