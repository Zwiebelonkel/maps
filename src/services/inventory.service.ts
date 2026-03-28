import { Injectable } from '@angular/core';
import { ShopItem } from '../app/config/game.config';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private items: ShopItem[] = [];

  constructor() {
    this.load();
  }

  add(item: ShopItem) {
    this.items.push(item);
    this.save();
  }

  remove(index: number) {
    this.items.splice(index, 1);
    this.save();
  }

  getAll(): ShopItem[] {
    return this.items;
  }

  getBombs(): ShopItem[] {
    return this.items.filter(i => i.bombRadius != null);
  }

  private save() {
    localStorage.setItem('inventory', JSON.stringify(this.items));
  }

  private load() {
    try {
      const saved = localStorage.getItem('inventory');
      this.items = saved ? JSON.parse(saved) : [];
    } catch {
      this.items = [];
    }
  }

  clear() {
    this.items = [];
    this.save();
  }
}
