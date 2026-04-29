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
  currentCritChanceLevel: number;
  currentCritMultiplierLevel: number;
  coinsPerClick: number;
  currentRadius: number;
  critChance: number;
  critMultiplier: number;
}

@Injectable({ providedIn: 'root' })
export class UpgradeService {
  private state = new BehaviorSubject<UpgradeState>({
    currentRadiusLevel: 1,
    currentClickLevel: 1,
    currentCritChanceLevel: 1,
    currentCritMultiplierLevel: 1,
    coinsPerClick: GAME_CONFIG.CLICK_UPGRADES[0].coinsPerClick,
    currentRadius: GAME_CONFIG.BASE_RADIUS + GAME_CONFIG.RADIUS_GROWTH,
    critChance: 0,
    critMultiplier: 1,
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

  // ── Critical ──────────────────────────────────────────

  private readonly maxCritChanceLevel = 397;
  private readonly critChancePerLevel = 0.0025;
  private readonly critMultiplierPerLevel = 0.1;

  getNextCritChanceLevel(): number | null {
    const nextLevel = this.snapshot.currentCritChanceLevel + 1;
    return nextLevel <= this.maxCritChanceLevel ? nextLevel : null;
  }

  getCritChanceCost(level: number): number {
    return Math.floor(180 * Math.pow(level, 1.45));
  }

  applyCritChanceUpgrade(): void {
    const nextLevel = this.getNextCritChanceLevel();
    if (!nextLevel) return;
    this.state.next({
      ...this.snapshot,
      currentCritChanceLevel: nextLevel,
      critChance: (nextLevel - 1) * this.critChancePerLevel,
    });
  }

  getNextCritMultiplierLevel(): number {
    return this.snapshot.currentCritMultiplierLevel + 1;
  }

  getCritMultiplierCost(level: number): number {
    return Math.floor(350 * Math.pow(level, 1.5));
  }

  applyCritMultiplierUpgrade(): void {
    const nextLevel = this.getNextCritMultiplierLevel();
    this.state.next({
      ...this.snapshot,
      currentCritMultiplierLevel: nextLevel,
      critMultiplier: 1 + (nextLevel - 1) * this.critMultiplierPerLevel,
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
      currentCritChanceLevel: this.snapshot.currentCritChanceLevel,
      currentCritMultiplierLevel: this.snapshot.currentCritMultiplierLevel,
      coinsPerClick: this.snapshot.coinsPerClick,
      critChance: this.snapshot.critChance,
      critMultiplier: this.snapshot.critMultiplier,
    };
  }

  deserialize(data: any): void {
    const radiusLevel = data.currentRadiusLevel || 1;
    const clickLevel = data.currentClickLevel || 1;
    const clickUpgrade =
      GAME_CONFIG.CLICK_UPGRADES.find((u) => u.level === clickLevel) ||
      GAME_CONFIG.CLICK_UPGRADES[0];

    const critChanceLevel = Math.min(
      data.currentCritChanceLevel || 1,
      this.maxCritChanceLevel,
    );
    const critMultiplierLevel = Math.max(data.currentCritMultiplierLevel || 1, 1);

    this.state.next({
      currentRadiusLevel: radiusLevel,
      currentClickLevel: clickLevel,
      currentCritChanceLevel: critChanceLevel,
      currentCritMultiplierLevel: critMultiplierLevel,
      coinsPerClick: data.coinsPerClick || clickUpgrade.coinsPerClick,
      currentRadius:
        GAME_CONFIG.BASE_RADIUS + radiusLevel * GAME_CONFIG.RADIUS_GROWTH,
      critChance: Math.min(
        data.critChance ?? (critChanceLevel - 1) * this.critChancePerLevel,
        1,
      ),
      critMultiplier: Math.max(
        data.critMultiplier ?? 1 + (critMultiplierLevel - 1) * this.critMultiplierPerLevel,
        1,
      ),
    });
  }

  reset(): void {
    this.state.next({
      currentRadiusLevel: 1,
      currentClickLevel: 1,
      currentCritChanceLevel: 1,
      currentCritMultiplierLevel: 1,
      coinsPerClick: GAME_CONFIG.CLICK_UPGRADES[0].coinsPerClick,
      currentRadius: GAME_CONFIG.BASE_RADIUS + GAME_CONFIG.RADIUS_GROWTH,
      critChance: 0,
      critMultiplier: 1,
    });
  }
}
