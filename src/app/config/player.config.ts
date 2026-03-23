export type OutfitEffectType = 'coins' | 'radius' | 'loot' | 'click';

export interface OutfitEffect {
  type: OutfitEffectType;
  value: number;
  label: string;
  icon: string;
}

export interface Outfit {
  id: string;
  icon: string; // bleibt für UI im Player-Menu
  name: string;
  description: string;
  effect: OutfitEffect;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const OUTFITS: Outfit[] = [
  {
    id: 'default',
    icon: '🎒',
    name: 'Rucksack',
    description: 'Standard-Ausrüstung für jeden Entdecker.',
    rarity: 'common',
    effect: { type: 'coins', value: 0, label: 'Kein Bonus', icon: '➖' },
  },
  {
    id: 'ninja',
    icon: '👟',
    name: 'Laufschuhe',
    description: 'Schneller unterwegs, größerer Radius.',
    rarity: 'rare',
    effect: { type: 'radius', value: 0.1, label: '+10% Radius', icon: '📡' },
  },
  {
    id: 'robot',
    icon: '🔭',
    name: 'Fernglas',
    description: 'Sieh weiter, entdecke mehr.',
    rarity: 'rare',
    effect: { type: 'coins', value: 0.15, label: '+15% Coins', icon: '🪙' },
  },
  {
    id: 'ghost',
    icon: '🧲',
    name: 'Loot-Magnet',
    description: 'Zieht Schätze magisch an.',
    rarity: 'rare',
    effect: { type: 'loot', value: 0.1, label: '+10% Loot-Chance', icon: '🎲' },
  },
  {
    id: 'alien',
    icon: '🛸',
    name: 'Drohne',
    description: 'Scannt aus der Luft einen riesigen Bereich.',
    rarity: 'epic',
    effect: { type: 'radius', value: 0.2, label: '+20% Radius', icon: '📡' },
  },
  {
    id: 'king',
    icon: '💰',
    name: 'Geldbeutel',
    description: 'Maximale Coin-Ausbeute.',
    rarity: 'epic',
    effect: { type: 'coins', value: 0.25, label: '+25% Coins', icon: '🪙' },
  },
  {
    id: 'wizard',
    icon: '🔮',
    name: 'Kristallkugel',
    description: 'Sieht verborgene Schätze voraus.',
    rarity: 'epic',
    effect: {
      type: 'loot',
      value: 0.25,
      label: '+25% Loot-Chance',
      icon: '🎲',
    },
  },
  {
    id: 'clown',
    icon: '🪙',
    name: 'Münzhandschuh',
    description: 'Jeder Tipp bringt mehr.',
    rarity: 'common',
    effect: {
      type: 'click',
      value: 0.2,
      label: '+20% Klick-Coins',
      icon: '👆',
    },
  },
  {
    id: 'skull',
    icon: '⚡',
    name: 'Energiehandschuh',
    description: 'Doppelte Kraft beim Tippen.',
    rarity: 'rare',
    effect: {
      type: 'click',
      value: 0.5,
      label: '+50% Klick-Coins',
      icon: '👆',
    },
  },
  {
    id: 'fire',
    icon: '👑',
    name: 'Goldene Krone',
    description: 'Legendäre Coin-Ausbeute.',
    rarity: 'legendary',
    effect: { type: 'coins', value: 0.5, label: '+50% Coins', icon: '🪙' },
  },
];

export const RARITY_COLORS: Record<string, string> = {
  common: '#aaaaaa',
  rare: '#4da3ff',
  epic: '#c084fc',
  legendary: '#f97316',
};
