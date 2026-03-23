import { Injectable } from '@angular/core';
import { GAME_CONFIG, ShopItem } from '../app/config/game.config';
import { OUTFITS } from '../app/config/player.config';
import { PlayerService } from './player.service';

export type LootType = 'coins' | 'bomb' | 'upgrade' | 'trophy' | 'outfit';

export interface LootResult {
  type: LootType;
  amount?: number;
  item?: ShopItem;
  label: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

@Injectable({ providedIn: 'root' })
export class LootService {
  private pityCounter = 0;

  constructor(private playerService: PlayerService) {}

  private getBomb(): ShopItem {
    return (
      GAME_CONFIG.SHOP_ITEMS.find((i) => i.id === 'bomb_small') ||
      GAME_CONFIG.SHOP_ITEMS[0]
    );
  }

  rollLoot(): LootResult | null {
    // Basis 1% — skaliert mit Outfit-Loot-Multiplier (z.B. Magier: 1.25 → 1.25%)
    const chance = 0.01 * this.playerService.getLootMultiplier();
    if (Math.random() > chance) return null;

    this.pityCounter++;

    // Pity bei 100 → garantiert Legendary
    if (this.pityCounter >= 100) {
      this.pityCounter = 0;
      return { type: 'trophy', label: '🏆 LEGENDARY!', rarity: 'legendary' };
    }

    const rand = Math.random();

    // 2% → Legendary
    if (rand < 0.02) {
      this.pityCounter = 0;
      return { type: 'trophy', label: '🏆 LEGENDARY!', rarity: 'legendary' };
    }

    // Outfit zuerst prüfen (10%) — war vorher nach bomb, wurde nie getroffen
    if (rand < 0.1) {
      const unlockedIds = this.playerService.unlocked;
      // Nur noch nicht freigeschaltete Outfits droppen
      const available = OUTFITS.filter((o) => !unlockedIds.includes(o.id));
      if (available.length > 0) {
        const randomOutfit =
          available[Math.floor(Math.random() * available.length)];
        return {
          type: 'outfit',
          label: `${randomOutfit.icon} ${randomOutfit.name} gefunden!`,
          rarity: 'epic',
          item: randomOutfit as any,
        };
      }
    }

    // 7% → Upgrade
    if (rand < 0.17) {
      return { type: 'upgrade', label: '⚡ POWER BOOST!', rarity: 'rare' };
    }

    // 22% → Bombe
    if (rand < 0.39) {
      return {
        type: 'bomb',
        item: this.getBomb(),
        label: '💣 BOOM!',
        rarity: 'rare',
      };
    }

    // Rest → Coins
    return {
      type: 'coins',
      amount: GAME_CONFIG.COINS_PER_TILE,
      label: `+${GAME_CONFIG.COINS_PER_TILE} Coins`,
      rarity: 'common',
    };
  }
}
