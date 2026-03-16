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

  // Schutz gegen mehrfaches Explorieren durch GPS-Jitter
  private lastExploreCenter: { lat: number; lng: number } | null = null;
  private readonly MIN_REEXPLORE_DISTANCE = 5; // Meter

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
   * Öffentlicher Zugriff auf aktuellen Progress
   */
  get progress(): PlayerProgress {
    return this.progressSubject.value;
  }

  /**
   * Konvertiert GPS-Koordinaten in stabile Grid-Koordinaten.
   * Wichtig: metersPerLng hängt von der aktuellen Breite ab.
   */
  latLngToGrid(lat: number, lng: number): GridCoordinate {
    const metersPerLat = 111320;
    const metersPerLng = 111320 * Math.cos(this.toRad(lat));

    const xMeters = lng * metersPerLng;
    const yMeters = lat * metersPerLat;

    const gridX = Math.floor(xMeters / GAME_CONFIG.TILE_SIZE);
    const gridY = Math.floor(yMeters / GAME_CONFIG.TILE_SIZE);

    return { gridX, gridY };
  }

  /**
   * Wandelt eine Grid-Kachel wieder in das Zentrum der Kachel um.
   * Das ist wichtig, damit Distanzprüfungen stabil sind.
   */
  gridToTileCenter(gridX: number, gridY: number, referenceLat: number): {
    lat: number;
    lng: number;
  } {
    const metersPerLat = 111320;
    const metersPerLng = 111320 * Math.cos(this.toRad(referenceLat));

    const centerXMeters = (gridX + 0.5) * GAME_CONFIG.TILE_SIZE;
    const centerYMeters = (gridY + 0.5) * GAME_CONFIG.TILE_SIZE;

    const lng = centerXMeters / metersPerLng;
    const lat = centerYMeters / metersPerLat;

    return { lat, lng };
  }

  /**
   * Eindeutiger Tile-Key
   */
  getTileKey(gridX: number, gridY: number): string {
    return `${gridX},${gridY}`;
  }

  /**
   * Prüft ob eine Tile bereits erkundet ist
   */
  isTileExplored(lat: number, lng: number): boolean {
    const grid = this.latLngToGrid(lat, lng);
    const key = this.getTileKey(grid.gridX, grid.gridY);
    return this.progress.exploredTiles.has(key);
  }

  /**
   * Erkundet neue Tiles im Radius.
   * Schutz gegen GPS-Jitter und mehrfaches Triggern am selben Ort eingebaut.
   */
  exploreTiles(centerLat: number, centerLng: number): number {
    const currentProgress = this.progress;
    const radius = this.getCurrentRadius();

    // GPS-Jitter-Schutz:
    // Wenn die letzte Exploration fast am selben Punkt war, nichts machen.
    if (this.lastExploreCenter) {
      const distanceSinceLastExplore = this.calculateDistance(
        this.lastExploreCenter.lat,
        this.lastExploreCenter.lng,
        centerLat,
        centerLng,
      );

      if (distanceSinceLastExplore < this.MIN_REEXPLORE_DISTANCE) {
        return 0;
      }
    }

    const exploredTiles = new Map(currentProgress.exploredTiles);
    let newTilesCount = 0;

    // Approximation für Grid-Suche
    const tilesInRadius = Math.ceil(radius / GAME_CONFIG.TILE_SIZE);
    const centerGrid = this.latLngToGrid(centerLat, centerLng);

    for (let x = -tilesInRadius; x <= tilesInRadius; x++) {
      for (let y = -tilesInRadius; y <= tilesInRadius; y++) {
        const gridX = centerGrid.gridX + x;
        const gridY = centerGrid.gridY + y;
        const key = this.getTileKey(gridX, gridY);

        // Bereits erkundet -> sofort überspringen
        if (exploredTiles.has(key)) {
          continue;
        }

        // Immer das Tile-Zentrum prüfen, nicht die Ecke
        const tileCenter = this.gridToTileCenter(gridX, gridY, centerLat);

        const distance = this.calculateDistance(
          centerLat,
          centerLng,
          tileCenter.lat,
          tileCenter.lng,
        );

        if (distance <= radius) {
          exploredTiles.set(key, {
            lat: tileCenter.lat,
            lng: tileCenter.lng,
            explored: true,
            exploredAt: new Date(),
          });
          newTilesCount++;
        }
      }
    }

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
      this.lastExploreCenter = { lat: centerLat, lng: centerLng };
    }

    return newTilesCount;
  }

  /**
   * Berechnet Distanz zwischen zwei GPS-Punkten
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371000;
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
   * Aktueller Radius
   */
  getCurrentRadius(): number {
    const level = this.progress.currentRadiusLevel;
    const upgrade = GAME_CONFIG.RADIUS_UPGRADES.find(
      (u: RadiusUpgrade) => u.level === level,
    );
    return upgrade?.radius || GAME_CONFIG.BASE_RADIUS;
  }

  /**
   * Nächstes Upgrade
   */
  getNextUpgrade(): RadiusUpgrade | null {
    const currentLevel = this.progress.currentRadiusLevel;
    return (
      GAME_CONFIG.RADIUS_UPGRADES.find(
        (u: RadiusUpgrade) => u.level === currentLevel + 1,
      ) || null
    );
  }

  /**
   * Upgrade kaufen
   */
  purchaseUpgrade(): boolean {
    const currentProgress = this.progress;
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
   * Fortschritt speichern
   */
  private saveProgress(): void {
    const progress = this.progress;
    const serializable = {
      totalCoins: progress.totalCoins,
      exploredTiles: Array.from(progress.exploredTiles.entries()),
      currentRadiusLevel: progress.currentRadiusLevel,
      totalTilesExplored: progress.totalTilesExplored,
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializable));
  }

  /**
   * Fortschritt laden
   */
  private loadProgress(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const progress: PlayerProgress = {
          totalCoins: parsed.totalCoins ?? 0,
          exploredTiles: new Map<string, MapTile>(parsed.exploredTiles ?? []),
          currentRadiusLevel: parsed.currentRadiusLevel ?? 1,
          totalTilesExplored: parsed.totalTilesExplored ?? 0,
        };
        this.progressSubject.next(progress);
      } catch (e) {
        console.error('Error loading progress:', e);
      }
    }
  }

  /**
   * Reset für Testing
   */
  resetProgress(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.lastExploreCenter = null;

    this.progressSubject.next({
      totalCoins: 0,
      exploredTiles: new Map<string, MapTile>(),
      currentRadiusLevel: 1,
      totalTilesExplored: 0,
    });
  }

  /**
   * Alle erkundeten Tiles
   */
  getExploredTiles(): MapTile[] {
    return Array.from(this.progress.exploredTiles.values());
  }
}