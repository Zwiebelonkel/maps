import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  GAME_CONFIG,
  RadiusUpgrade,
  ClickUpgrade,
  ShopItem,
} from '../app/config/game.config';

export interface UpgradeState {
  currentRadiusLevel: number;
  currentClickLevel: number;
  coinsPerClick: number;
  currentRadius: number;
}

@Injectable({ providedIn: 'root' })
export class UpgradeService {
  private state = new BehaviorSubject<UpgradeState>({
    currentRadiusLevel: 1,
    currentClickLevel: 1,
    coinsPerClick: GAME_CONFIG.CLICK_UPGRADES[0].coinsPerClick,
    currentRadius: GAME_CONFIG.BASE_RADIUS + GAME_CONFIG.RADIUS_GROWTH,
  });

  state$ = this.state.asObservable();

  get snapshot(): UpgradeState {
    return this.state.value;
  }

  // ── Radius ──────────────────────────────────────────

  getNextRadiusUpgrades(count = 5): RadiusUpgrade[] {
    const current = this.snapshot.currentRadiusLevel;
    return Array.from({ length: count }, (_, i) => {
      const level = current + i + 1;
      return {
        level,
        radius: GAME_CONFIG.BASE_RADIUS + level * GAME_CONFIG.RADIUS_GROWTH,
        cost: Math.floor(
          GAME_CONFIG.BASE_UPGRADE_COST *
            Math.pow(level, GAME_CONFIG.COST_MULTIPLIER),
        ),
        description: 'Explorer ' + level,
      };
    });
  }

  getCurrentRadiusUpgrade(): RadiusUpgrade {
    const level = this.snapshot.currentRadiusLevel;
    return {
      level,
      radius: GAME_CONFIG.BASE_RADIUS + level * GAME_CONFIG.RADIUS_GROWTH,
      cost: 0,
      description: 'Explorer ' + level,
    };
  }

  applyRadiusUpgrade(upgrade: RadiusUpgrade): void {
    this.state.next({
      ...this.snapshot,
      currentRadiusLevel: upgrade.level,
      currentRadius: upgrade.radius,
    });
  }

  // ── Click ────────────────────────────────────────────

  getNextClickUpgrades(): ClickUpgrade[] {
    return GAME_CONFIG.CLICK_UPGRADES.filter(
      (u) => u.level > this.snapshot.currentClickLevel,
    );
  }

  getCurrentClickUpgrade(): ClickUpgrade {
    return (
      GAME_CONFIG.CLICK_UPGRADES.find(
        (u) => u.level === this.snapshot.currentClickLevel,
      ) || GAME_CONFIG.CLICK_UPGRADES[0]
    );
  }

  applyClickUpgrade(upgrade: ClickUpgrade): void {
    this.state.next({
      ...this.snapshot,
      currentClickLevel: upgrade.level,
      coinsPerClick: upgrade.coinsPerClick,
    });
  }

  // ── Items ────────────────────────────────────────────

  getShopItems(): ShopItem[] {
    return GAME_CONFIG.SHOP_ITEMS;
  }

  // ── Persistence ──────────────────────────────────────

  serialize(): object {
    return {
      currentRadiusLevel: this.snapshot.currentRadiusLevel,
      currentClickLevel: this.snapshot.currentClickLevel,
      coinsPerClick: this.snapshot.coinsPerClick,
    };
  }

  deserialize(data: any): void {
    const radiusLevel = data.currentRadiusLevel || 1;
    const clickLevel = data.currentClickLevel || 1;
    const clickUpgrade =
      GAME_CONFIG.CLICK_UPGRADES.find((u) => u.level === clickLevel) ||
      GAME_CONFIG.CLICK_UPGRADES[0];

    this.state.next({
      currentRadiusLevel: radiusLevel,
      currentClickLevel: clickLevel,
      coinsPerClick: data.coinsPerClick || clickUpgrade.coinsPerClick,
      currentRadius:
        GAME_CONFIG.BASE_RADIUS + radiusLevel * GAME_CONFIG.RADIUS_GROWTH,
    });
  }

  reset(): void {
    this.state.next({
      currentRadiusLevel: 1,
      currentClickLevel: 1,
      coinsPerClick: GAME_CONFIG.CLICK_UPGRADES[0].coinsPerClick,
      currentRadius: GAME_CONFIG.BASE_RADIUS + GAME_CONFIG.RADIUS_GROWTH,
    });
  }
}
