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

BASE_RADIUS: 20,
RADIUS_GROWTH: 5,
BASE_UPGRADE_COST: 120,
COST_MULTIPLIER: 1.35,
};
