import { Injectable } from '@angular/core';
import { OUTFITS, Outfit } from '../app/config/player.config';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private STORAGE_KEY = 'player_data';
  unlocked: string[] = ['default'];
  equipped: string = 'default';

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
    this.equipped = id;
    this.save();
  }

  getEquippedIcon(): string {
    return OUTFITS.find((o) => o.id === this.equipped)?.icon || '🙂';
  }

  getEquippedOutfit(): Outfit | undefined {
    return OUTFITS.find((o) => o.id === this.equipped);
  }

  // Multiplikatoren — 1.0 = kein Bonus
  getCoinMultiplier(): number {
    const outfit = this.getEquippedOutfit();
    if (outfit?.effect.type === 'coins') return 1 + outfit.effect.value;
    return 1;
  }

  getRadiusMultiplier(): number {
    const outfit = this.getEquippedOutfit();
    if (outfit?.effect.type === 'radius') return 1 + outfit.effect.value;
    return 1;
  }

  getLootMultiplier(): number {
    const outfit = this.getEquippedOutfit();
    if (outfit?.effect.type === 'loot') return 1 + outfit.effect.value;
    return 1;
  }

  getClickMultiplier(): number {
    const outfit = this.getEquippedOutfit();
    if (outfit?.effect.type === 'click') return 1 + outfit.effect.value;
    return 1;
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

  private load() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return;
    const parsed = JSON.parse(data);
    this.unlocked = parsed.unlocked || ['default'];
    this.equipped = parsed.equipped || 'default';
  }
}
