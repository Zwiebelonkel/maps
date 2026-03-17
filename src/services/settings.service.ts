import { Injectable } from '@angular/core';

export interface GameSettings {
  maxRenderTiles: number;
  volume: number;
  powerSave: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private settings: GameSettings = {
    maxRenderTiles: 2000,
    volume: 0.5,
    powerSave: false,
  };

  constructor() {
    this.load();
  }

  get snapshot() {
    return this.settings;
  }

  update(partial: Partial<GameSettings>) {
    this.settings = { ...this.settings, ...partial };
    localStorage.setItem('game_settings', JSON.stringify(this.settings));
  }

  private load() {
    const saved = localStorage.getItem('game_settings');
    if (saved) {
      this.settings = JSON.parse(saved);
    }
  }

  reset() {
    this.settings = {
      maxRenderTiles: 2000,
      volume: 0.5,
      powerSave: false,
    };
    this.update(this.settings);
  }
}
