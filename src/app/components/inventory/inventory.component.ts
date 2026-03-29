import { Component, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../../services/inventory.service';
import { ShopItem } from '../../config/game.config';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
})
export class InventoryComponent {
  @Output() close = new EventEmitter<void>();
  @Output() activateBomb = new EventEmitter<ShopItem>();

  isOpen = true;
  isClosing = false;

  private touchStartY = 0;
  private touchCurrentY = 0;

  constructor(public inventoryService: InventoryService) {}

  closeWithAnimation() {
    this.isClosing = true;
    setTimeout(() => this.close.emit(), 320);
  }

  onActivate(item: ShopItem) {
  this.inventoryService.remove(item.id);
  this.activateBomb.emit(item);
  this.closeWithAnimation();
}
}

  onHeaderTouchStart(e: TouchEvent) {
    this.touchStartY = e.touches[0].clientY;
  }

  onHeaderTouchMove(e: TouchEvent) {
    this.touchCurrentY = e.touches[0].clientY;
  }

  onHeaderTouchEnd() {
    if (this.touchCurrentY - this.touchStartY > 60) {
      this.closeWithAnimation();
    }
  }
}
