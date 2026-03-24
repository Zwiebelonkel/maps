import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProgressionService {
  private STORAGE_KEY = 'progression';

  xp = 0;
  level = 1;
  lootboxes = 0;

  constructor() {
    this.load();
  }

  addXP(amount: number): boolean {
    this.xp += amount;
    const required = this.getRequiredXP();
    if (this.xp >= required) {
      this.xp -= required;
      this.level++;
      this.lootboxes++;
      this.save();
      return true; // Level Up
    }
    this.save();
    return false;
  }

  getRequiredXP(): number {
    return Math.floor(100 * Math.pow(this.level, 1.2));
  }

  useLootbox(): boolean {
    if (this.lootboxes <= 0) return false;
    this.lootboxes--;
    this.save();
    return true;
  }

  private save() {
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify({
        xp: this.xp,
        level: this.level,
        lootboxes: this.lootboxes,
      }),
    );
  }

  private load() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return;

    const parsed = JSON.parse(data);
    this.xp = parsed.xp || 0;
    this.level = parsed.level || 1;
    this.lootboxes = parsed.lootboxes || 0;
  }
}
