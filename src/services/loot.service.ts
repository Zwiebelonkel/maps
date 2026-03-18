import { Injectable } from '@angular/core';
import { GAME_CONFIG, ShopItem } from '../app/config/game.config';

export type LootType = 'coins' | 'bomb' | 'upgrade' | 'trophy';

export interface LootResult {
  type: LootType;
  amount?: number;
  item?: ShopItem;
  label: string;
  rarity: 'common' | 'rare' | 'epic';
}

@Injectable({
  providedIn: 'root',
})
export class LootService {
  private pityCounter = 0;

  private getBomb(): ShopItem {
    return (
      GAME_CONFIG.SHOP_ITEMS.find((i) => i.id === 'bomb_small') ||
      GAME_CONFIG.SHOP_ITEMS[0]
    );
  }

  rollLoot(): LootResult | null {
    // 🎲 5% Trigger Chance
    if (Math.random() > 0.01) return null;

    this.pityCounter++;

    // 🧠 Pity System
    if (this.pityCounter > 100) {
      this.pityCounter = 0;
      return {
        type: 'trophy',
        label: '🏆 LEGENDARY!',
        rarity: 'epic',
      };
    }

    const rand = Math.random();

    if (rand < 0.02) {
      this.pityCounter = 0;
      return {
        type: 'trophy',
        label: '🏆 LEGENDARY!',
        rarity: 'epic',
      };
    }

    if (rand < 0.07) {
      return {
        type: 'upgrade',
        label: '⚡ POWER BOOST!',
        rarity: 'rare',
      };
    }

    if (rand < 0.22) {
      return {
        type: 'bomb',
        item: this.getBomb(),
        label: '💣 BOOM!',
        rarity: 'rare',
      };
    }

    return {
      type: 'coins',
      amount: GAME_CONFIG.COINS_PER_TILE,
      label: `+${GAME_CONFIG.COINS_PER_TILE} Coins`,
      rarity: 'common',
    };
  }
}
