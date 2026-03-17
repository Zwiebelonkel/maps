export interface RadiusUpgrade {
  level: number;
  radius: number;
  cost: number;
  description: string;
}

export interface ClickUpgrade {
  level: number;
  coinsPerClick: number;
  cost: number;
  description: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  type: 'bomb';
  bombRadius?: number;
}

export const GAME_CONFIG = {
  TILE_SIZE: 12,
  COINS_PER_TILE: 1,
  BASE_RADIUS: 20,
  MAX_TILES_RENDER: 20000,
  MIN_GPS_MOVEMENT: 4,
  MAX_ACCEPTED_ACCURACY: 40,
  FOG_OPACITY: 0.96,
  RADIUS_GROWTH: 5,
  BASE_UPGRADE_COST: 120,
  COST_MULTIPLIER: 1.35,

  CLICK_UPGRADES: [
    { level: 1, coinsPerClick: 0.05, cost: 0, description: 'Finger Tipper' },
    { level: 2, coinsPerClick: 0.1, cost: 80, description: 'Coin Clicker' },
    { level: 3, coinsPerClick: 0.25, cost: 200, description: 'Quick Hands' },
    { level: 4, coinsPerClick: 0.5, cost: 450, description: 'Speed Tapper' },
    { level: 5, coinsPerClick: 1.0, cost: 900, description: 'Pro Clicker' },
    { level: 6, coinsPerClick: 2.0, cost: 1800, description: 'Coin Machine' },
    { level: 7, coinsPerClick: 5.0, cost: 4000, description: 'Golden Touch' },
  ] as ClickUpgrade[],

  SHOP_ITEMS: [
    {
      id: 'bomb_small',
      name: 'Kleine Bombe',
      description: 'Legt einen Bereich von 50m frei',
      cost: 300,
      icon: '💣',
      type: 'bomb',
      bombRadius: 50,
    },
    {
      id: 'bomb_medium',
      name: 'Große Bombe',
      description: 'Legt einen Bereich von 100m frei',
      cost: 800,
      icon: '💥',
      type: 'bomb',
      bombRadius: 100,
    },
    {
      id: 'bomb_mega',
      name: 'Mega Bombe',
      description: 'Legt einen Bereich von 200m frei',
      cost: 2000,
      icon: '☢️',
      type: 'bomb',
      bombRadius: 200,
    },
  ] as ShopItem[],
};
