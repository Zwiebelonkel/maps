// services/game.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  MapTile,
  PlayerProgress,
  GridCoordinate,
  GAME_CONFIG,
  RadiusUpgrade,
} from '../../models/map.tile.model';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly STORAGE_KEY = 'map_explorer_progress';

  private progressSubject = new BehaviorSubject<PlayerProgress>({
    totalCoins: 0,
    exploredTiles: new Map<string, MapTile>(),
    currentRadiusLevel: 1,
    totalTilesExplored: 0,
  });

  public progress$: Observable<PlayerProgress> =
    this.progressSubject.asObservable();

  constructor() {
    this.loadProgress();
  }

  /**
   * Konvertiert GPS-Koordinaten in Grid-Koordinaten
   */
  latLngToGrid(lat: number, lng: number): GridCoordinate {
    const gridX = Math.floor(lng / (GAME_CONFIG.TILE_SIZE / 111320)); // ca. 111320 meter pro Längengrad am Äquator
    const gridY = Math.floor(lat / (GAME_CONFIG.TILE_SIZE / 110540)); // ca. 110540 meter pro Breitengrad
    return { gridX, gridY };
  }

  /**
   * Erstellt einen eindeutigen Schlüssel für eine Kachel
   */
  getTileKey(gridX: number, gridY: number): string {
    return `${gridX},${gridY}`;
  }

  /**
   * Prüft ob eine Kachel bereits erkundet wurde
   */
  isTileExplored(lat: number, lng: number): boolean {
    const grid = this.latLngToGrid(lat, lng);
    const key = this.getTileKey(grid.gridX, grid.gridY);
    return this.progressSubject.value.exploredTiles.has(key);
  }

  /**
   * Erkundet neue Kacheln im aktuellen Radius
   */
  exploreTiles(centerLat: number, centerLng: number): number {
    const currentProgress = this.progressSubject.value;
    const radius = this.getCurrentRadius();

    let newTilesCount = 0;
    const exploredTiles = new Map(currentProgress.exploredTiles);

    // Berechne wie viele Kacheln im Radius sind
    const tilesInRadius = Math.ceil(radius / GAME_CONFIG.TILE_SIZE);
    const centerGrid = this.latLngToGrid(centerLat, centerLng);

    // Prüfe alle Kacheln im Radius
    for (let x = -tilesInRadius; x <= tilesInRadius; x++) {
      for (let y = -tilesInRadius; y <= tilesInRadius; y++) {
        const gridX = centerGrid.gridX + x;
        const gridY = centerGrid.gridY + y;
        const key = this.getTileKey(gridX, gridY);

        // Prüfe ob Kachel tatsächlich im Kreis-Radius liegt
        const tileLat = gridY * (GAME_CONFIG.TILE_SIZE / 110540);
        const tileLng = gridX * (GAME_CONFIG.TILE_SIZE / 111320);
        const distance = this.calculateDistance(
          centerLat,
          centerLng,
          tileLat,
          tileLng,
        );

        if (distance <= radius && !exploredTiles.has(key)) {
          exploredTiles.set(key, {
            lat: tileLat,
            lng: tileLng,
            explored: true,
            exploredAt: new Date(),
          });
          newTilesCount++;
        }
      }
    }

    // Update Progress
    if (newTilesCount > 0) {
      const coinsEarned = newTilesCount * GAME_CONFIG.COINS_PER_TILE;

      const updatedProgress: PlayerProgress = {
        ...currentProgress,
        totalCoins: currentProgress.totalCoins + coinsEarned,
        exploredTiles,
        totalTilesExplored: exploredTiles.size,
      };

      this.progressSubject.next(updatedProgress);
      this.saveProgress();
    }

    return newTilesCount;
  }

  /**
   * Berechnet Distanz zwischen zwei GPS-Punkten (Haversine-Formel)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371000; // Erdradius in Metern
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Gibt den aktuellen Radius zurück
   */
  getCurrentRadius(): number {
    const level = this.progressSubject.value.currentRadiusLevel;
    const upgrade = GAME_CONFIG.RADIUS_UPGRADES.find(
      (u: any) => u.level === level,
    );
    return upgrade?.radius || GAME_CONFIG.BASE_RADIUS;
  }

  /**
   * Gibt das nächste verfügbare Upgrade zurück
   */
  getNextUpgrade(): RadiusUpgrade | null {
    const currentLevel = this.progressSubject.value.currentRadiusLevel;
    return (
      GAME_CONFIG.RADIUS_UPGRADES.find(
        (u: any) => u.level === currentLevel + 1,
      ) || null
    );
  }

  /**
   * Kauft ein Radius-Upgrade
   */
  purchaseUpgrade(): boolean {
    const currentProgress = this.progressSubject.value;
    const nextUpgrade = this.getNextUpgrade();

    if (!nextUpgrade || currentProgress.totalCoins < nextUpgrade.cost) {
      return false;
    }

    const updatedProgress: PlayerProgress = {
      ...currentProgress,
      totalCoins: currentProgress.totalCoins - nextUpgrade.cost,
      currentRadiusLevel: nextUpgrade.level,
    };

    this.progressSubject.next(updatedProgress);
    this.saveProgress();
    return true;
  }

  /**
   * Speichert den Fortschritt im LocalStorage
   */
  private saveProgress(): void {
    const progress = this.progressSubject.value;
    const serializable = {
      totalCoins: progress.totalCoins,
      exploredTiles: Array.from(progress.exploredTiles.entries()),
      currentRadiusLevel: progress.currentRadiusLevel,
      totalTilesExplored: progress.totalTilesExplored,
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializable));
  }

  /**
   * Lädt den Fortschritt aus dem LocalStorage
   */
  private loadProgress(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const progress: PlayerProgress = {
          totalCoins: parsed.totalCoins,
          exploredTiles: new Map(parsed.exploredTiles),
          currentRadiusLevel: parsed.currentRadiusLevel,
          totalTilesExplored: parsed.totalTilesExplored,
        };
        this.progressSubject.next(progress);
      } catch (e) {
        console.error('Error loading progress:', e);
      }
    }
  }

  /**
   * Reset des Spielfortschritts (für Testing)
   */
  resetProgress(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.progressSubject.next({
      totalCoins: 0,
      exploredTiles: new Map<string, MapTile>(),
      currentRadiusLevel: 1,
      totalTilesExplored: 0,
    });
  }

  /**
   * Gibt alle erkundeten Kacheln zurück
   */
  getExploredTiles(): MapTile[] {
    return Array.from(this.progressSubject.value.exploredTiles.values());
  }
}
