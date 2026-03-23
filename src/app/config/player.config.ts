export type OutfitEffectType = 'coins' | 'radius' | 'loot' | 'click';

export interface OutfitEffect {
  type: OutfitEffectType;
  value: number; // z.B. 0.05 = +5%
  label: string; // z.B. "+5% Coins"
  icon: string;
}

export interface Outfit {
  id: string;
  icon: string;
  name: string;
  description: string;
  effect: OutfitEffect;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const OUTFITS: Outfit[] = [
  {
    id: 'default',
    icon: '🙂',
    name: 'Standard',
    description: 'Ein gewöhnlicher Entdecker.',
    rarity: 'common',
    effect: { type: 'coins', value: 0, label: 'Kein Bonus', icon: '➖' },
  },
  {
    id: 'ninja',
    icon: '🥷',
    name: 'Ninja',
    description: 'Lautlos, schnell, effizient.',
    rarity: 'rare',
    effect: { type: 'radius', value: 0.1, label: '+10% Radius', icon: '📡' },
  },
  {
    id: 'robot',
    icon: '🤖',
    name: 'Roboter',
    description: 'Optimiert für maximale Coin-Ausbeute.',
    rarity: 'rare',
    effect: { type: 'coins', value: 0.15, label: '+15% Coins', icon: '🪙' },
  },
  {
    id: 'ghost',
    icon: '👻',
    name: 'Geist',
    description: 'Gleitet durch Bereiche und findet verborgene Schätze.',
    rarity: 'rare',
    effect: { type: 'loot', value: 0.1, label: '+10% Loot-Chance', icon: '🎲' },
  },
  {
    id: 'alien',
    icon: '👽',
    name: 'Alien',
    description: 'Fortschrittliche Technologie aus einer anderen Welt.',
    rarity: 'epic',
    effect: { type: 'radius', value: 0.2, label: '+20% Radius', icon: '📡' },
  },
  {
    id: 'king',
    icon: '🤴',
    name: 'König',
    description: 'Alles gehört dem König — auch die Coins.',
    rarity: 'epic',
    effect: { type: 'coins', value: 0.25, label: '+25% Coins', icon: '🪙' },
  },
  {
    id: 'wizard',
    icon: '🧙',
    name: 'Magier',
    description: 'Beschwört Loot aus dem Nichts.',
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
    icon: '🤡',
    name: 'Clown',
    description: 'Unberechenbar. Aber irgendwie effektiv beim Tippen.',
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
    icon: '💀',
    name: 'Totenkopf',
    description: 'Furchteinflößend. Doppelte Klick-Power.',
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
    icon: '🔥',
    name: 'Flamme',
    description: 'Alles brennt — auch die Coins regnen.',
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
