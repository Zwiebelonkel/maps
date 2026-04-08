import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AscensionService {
  private ascensionPoints = 0;
  private ascensionLevel = 1;

  private readonly BASE_POINTS = 10; // Punkte für Level 1

  constructor() {
    this.load();
  }

  // ── Punkte hinzufügen ─────────────────────────────
  addPoints(amount: number) {
    this.ascensionPoints += amount;

    let needed = this.getPointsNeeded();

    while (this.ascensionPoints >= needed) {
      this.ascensionPoints -= needed;
      this.ascensionLevel++;
      needed = this.getPointsNeeded();
    }

    this.save();
  }

  // ── Punkte pro Item (rarity) ──────────────────────
  getPointsForRarity(rarity: string): number {
    switch (rarity) {
      case 'common': return 1;
      case 'rare': return 2;
      case 'epic': return 4;
      case 'legendary': return 7;
      case 'mythic': return 10;
      default: return 1;
    }
  }

  // ── benötigte Punkte pro Level ────────────────────
  getPointsNeeded(): number {
    return this.BASE_POINTS + (this.ascensionLevel - 1) * 5;
  }

  // ── Global Multiplier ─────────────────────────────
  getGlobalMultiplier(): number {
    return 1 + this.ascensionLevel * 0.05; // +5% pro Level
  }

  // ── Getter ────────────────────────────────────────
  get level() {
    return this.ascensionLevel;
  }

  get points() {
    return this.ascensionPoints;
  }

  // ── Storage ───────────────────────────────────────
  private save() {
    localStorage.setItem('ascension', JSON.stringify({
      level: this.ascensionLevel,
      points: this.ascensionPoints
    }));
  }

  private load() {
    const data = localStorage.getItem('ascension');
    if (data) {
      const parsed = JSON.parse(data);
      this.ascensionLevel = parsed.level ?? 1;
      this.ascensionPoints = parsed.points ?? 0;
    }
  }
}