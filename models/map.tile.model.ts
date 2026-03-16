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
  radius: number; // Meter
  cost: number; // Coins
  description: string;
}

export const GAME_CONFIG = {

  // kleinere Tiles = präzisere Exploration
  TILE_SIZE: 12,

  // Coins stark genervt
  COINS_PER_TILE: 1,

  // kleiner Startbereich
  BASE_RADIUS: 20,

  // Fog Stärke
  FOG_OPACITY: 0.92,

  // Renderlimit für Performance
  MAX_TILES_RENDER: 2000,

  RADIUS_UPGRADES: [

    {
      level: 1,
      radius: 20,
      cost: 0,
      description: "Beginner Explorer"
    },

    {
      level: 2,
      radius: 25,
      cost: 120,
      description: "Street Walker"
    },

    {
      level: 3,
      radius: 30,
      cost: 260,
      description: "Neighborhood Explorer"
    },

    {
      level: 4,
      radius: 35,
      cost: 450,
      description: "District Scout"
    },

    {
      level: 5,
      radius: 42,
      cost: 750,
      description: "City Adventurer"
    },

    {
      level: 6,
      radius: 50,
      cost: 1100,
      description: "Urban Pathfinder"
    },

    {
      level: 7,
      radius: 60,
      cost: 1700,
      description: "Regional Explorer"
    },

    {
      level: 8,
      radius: 75,
      cost: 2600,
      description: "Legendary Explorer"
    }

  ] as RadiusUpgrade[]

};