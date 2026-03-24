import { Injectable } from '@angular/core';

export interface GameSettings {
  maxRenderTiles: number;
  soundVolume: number;
  muted: boolean;
  powerSave: boolean;
  darkMap: boolean;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settings: GameSettings = {
    maxRenderTiles: 2000,
    soundVolume: 0.8,
    muted: false,
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
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }

  reset() {
    this.settings = {
      maxRenderTiles: 2000,
      soundVolume: 0.8,
      muted: false,
      powerSave: false,
      darkMap: true,
    };
    this.update(this.settings);
  }
}
