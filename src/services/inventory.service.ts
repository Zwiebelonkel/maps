import { Injectable } from '@angular/core';
import { ShopItem } from '../app/config/game.config';

export interface InventoryStack {
  item: ShopItem;
  count: number;
}

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

  remove(itemId: string) {
    const index = this.items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.save();
    }
  }

  getAll(): ShopItem[] {
    return this.items;
  }

  getBombStacks(): InventoryStack[] {
    const map = new Map<string, InventoryStack>();
    for (const item of this.items.filter(i => i.bombRadius != null)) {
      if (map.has(item.id)) {
        map.get(item.id)!.count++;
      } else {
        map.set(item.id, { item, count: 1 });
      }
    }
    return Array.from(map.values());
  }

  clear() {
    this.items = [];
    this.save();
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
}
