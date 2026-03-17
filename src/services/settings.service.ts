import { Injectable } from '@angular/core';

export interface GameSettings {
  maxRenderTiles: number;
  volume: number;
  powerSave: boolean;
  darkMap: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private settings: GameSettings = {
    maxRenderTiles: 2000,
    volume: 0.5,
    powerSave: false,
    darkMap: true,
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
      try {
        const parsed = JSON.parse(saved);
        // darkMap mit Default absichern falls alter Save ohne darkMap
        this.settings = { ...this.settings, ...parsed };
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }

  reset() {
    this.settings = {
      maxRenderTiles: 2000,
      volume: 0.5,
      powerSave: false,
      darkMap: true,
    };
    this.update(this.settings);
  }
}
