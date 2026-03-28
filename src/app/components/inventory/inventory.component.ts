import { Component, Output, EventEmitter } from '@angular/core';
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

  constructor(public inventoryService: InventoryService) {}

  onActivate(item: ShopItem, index: number) {
    this.inventoryService.remove(index);
    this.activateBomb.emit(item);
    this.close.emit();
  }
}
