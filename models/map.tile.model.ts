// models/map-tile.model.ts

export interface MapTile {
  lat: number;
  lng: number;
  explored: boolean;
  exploredAt?: Date;
}

export interface GridCoordinate {
  gridX: number;
  gridY: number;
}

export interface PlayerProgress {
  totalCoins: number;
  exploredTiles: Map<string, MapTile>;
  currentRadiusLevel: number;
  totalTilesExplored: number;
}

export interface RadiusUpgrade {
  level: number;
  radius: number; // in Metern
  cost: number; // Coins
  description: string;
}

export const GAME_CONFIG = {
  TILE_SIZE: 25, // 25 Meter pro Kachel
  COINS_PER_TILE: 10, // Coins pro aufgedeckter Kachel
  BASE_RADIUS: 50, // Startradius in Metern

  RADIUS_UPGRADES: [
    { level: 1, radius: 50, cost: 0, description: "Start" },
    { level: 2, radius: 75, cost: 500, description: "Explorer" },
    { level: 3, radius: 100, cost: 1500, description: "Adventurer" },
    { level: 4, radius: 150, cost: 5000, description: "Pathfinder" },
    { level: 5, radius: 200, cost: 15000, description: "Master Explorer" },
    { level: 6, radius: 300, cost: 50000, description: "Legend" },
  ] as RadiusUpgrade[],
};
