export interface RadiusUpgrade {
  level: number;
  radius: number;
  cost: number;
  description: string;
}

export const GAME_CONFIG = {
  TILE_SIZE: 12,
  COINS_PER_TILE: 1,
  BASE_RADIUS: 20,

  MAX_TILES_RENDER: 2000,
  MIN_GPS_MOVEMENT: 4,
  MAX_ACCEPTED_ACCURACY: 40,

  FOG_OPACITY: 0.92,

  RADIUS_UPGRADES: [
    { level: 1, radius: 20, cost: 0, description: 'Beginner' },
    { level: 2, radius: 25, cost: 120, description: 'Explorer' },
    { level: 3, radius: 30, cost: 260, description: 'Adventurer' },
    { level: 4, radius: 35, cost: 450, description: 'Pathfinder' },
    { level: 5, radius: 42, cost: 750, description: 'Scout' },
    { level: 6, radius: 50, cost: 1100, description: 'Urban Explorer' },
    { level: 7, radius: 60, cost: 1700, description: 'Regional Explorer' },
    { level: 8, radius: 75, cost: 2600, description: 'Legendary Explorer' },
  ] as RadiusUpgrade[],
};
