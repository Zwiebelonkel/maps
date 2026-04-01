import { Injectable } from '@angular/core';
import { OUTFITS, Outfit } from '../app/config/player.config';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private STORAGE_KEY = 'player_data';
  unlocked: string[] = ['default'];
  equipped: string[] = ['default']; // ← Array statt string

  constructor() {
    this.load();
  }

  unlock(id: string) {
    if (!this.unlocked.includes(id)) {
      this.unlocked.push(id);
      this.save();
    }
  }

  equip(id: string) {
    if (this.equipped.includes(id)) {
      // Bereits ausgerüstet → ausziehen (außer es ist das letzte)
      if (this.equipped.length > 1) {
        this.equipped = this.equipped.filter((e) => e !== id);
      }
    } else if (this.equipped.length < 2) {
      // Slot frei → hinzufügen
      this.equipped.push(id);
    } else {
      // Beide Slots voll → ältesten ersetzen
      this.equipped = [this.equipped[1], id];
    }
    this.save();
  }

  isEquipped(id: string): boolean {
    return this.equipped.includes(id);
  }

  getEquippedOutfits(): Outfit[] {
    return this.equipped
      .map((id) => OUTFITS.find((o) => o.id === id))
      .filter((o): o is Outfit => !!o);
  }

  // Multiplier summieren beide Slots
  getCoinMultiplier(): number {
    return (
      1 +
      this.getEquippedOutfits()
        .filter((o) => o.effect.type === 'coins')
        .reduce((sum, o) => sum + o.effect.value, 0)
    );
  }

  getRadiusMultiplier(): number {
    return (
      1 +
      this.getEquippedOutfits()
        .filter((o) => o.effect.type === 'radius')
        .reduce((sum, o) => sum + o.effect.value, 0)
    );
  }

  getLootMultiplier(): number {
    return (
      1 +
      this.getEquippedOutfits()
        .filter((o) => o.effect.type === 'loot')
        .reduce((sum, o) => sum + o.effect.value, 0)
    );
  }

  getClickMultiplier(): number {
    return (
      1 +
      this.getEquippedOutfits()
        .filter((o) => o.effect.type === 'click')
        .reduce((sum, o) => sum + o.effect.value, 0)
    );
  }

  getXPMultiplier(): number {
    return (
      1 +
      this.getEquippedOutfits()
        .filter((o) => o.effect.type === 'xp')
        .reduce((sum, o) => sum + o.effect.value, 0)
    );
  }

hasAutoClicker(): boolean {
  return this.getEquippedOutfits().some(o => o.id === 'auto_clicker');
}

  private save() {
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify({
        unlocked: this.unlocked,
        equipped: this.equipped,
      }),
    );
  }

reset() {
  this.unlocked = ['default'];
  this.equipped = ['default'];
  this.save();
}

  private load() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return;
    const parsed = JSON.parse(data);
    this.unlocked = parsed.unlocked || ['default'];
    // Migration: alter String-Wert → Array
    const eq = parsed.equipped;
    this.equipped = Array.isArray(eq) ? eq : [eq || 'default'];
  }
}
