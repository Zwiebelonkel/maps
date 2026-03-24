import { Injectable } from '@angular/core';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private sounds: Map<string, HTMLAudioElement[]> = new Map();
  private poolSize = 3;

  constructor(private settings: SettingsService) {
    this.preload('button', 'assets/audio/button.aac');
    this.preload('levelup', 'assets/audio/levelup.aac');
  }

  private preload(key: string, src: string) {
    const pool: HTMLAudioElement[] = [];
    for (let i = 0; i < this.poolSize; i++) {
      const audio = new Audio(src);
      audio.preload = 'auto';
      pool.push(audio);
    }
    this.sounds.set(key, pool);
  }

  play(key: string, volume = 1.0) {
    if (this.settings.snapshot.muted) return;
    const pool = this.sounds.get(key);
    if (!pool) return;
    const vol = volume * this.settings.snapshot.soundVolume;
    const audio = pool.find((a) => a.paused || a.ended) ?? pool[0];
    audio.currentTime = 0;
    audio.volume = Math.min(1, Math.max(0, vol));
    audio.play().catch(() => {});
  }

  // Spätere Sounds nachladen wenn Dateien da sind
  register(key: string, src: string) {
    this.preload(key, src);
  }
}
