export type OutfitEffectType = 'coins' | 'radius' | 'loot' | 'click' | 'xp';

export interface OutfitEffect {
  type: OutfitEffectType;
  value: number;
  label: string;
  icon: string;
}

export interface Outfit {
  id: string;
  icon: string;
  name: string;
  description: string;
  effect: OutfitEffect;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exotic';
}

export const OUTFITS: Outfit[] = [
  // ── COMMON ─────────────────────────────────────────────────
  {
    id: 'default',
    icon: '🎒',
    name: 'Rucksack',
    description: 'Standard-Ausrüstung für jeden Entdecker.',
    rarity: 'common',
    effect: { type: 'coins', value: 0, label: 'Kein Bonus', icon: '➖' },
  },
  {
    id: 'coin_glove',
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
    id: 'notebook',
    icon: '📓',
    name: 'Notizbuch',
    description: 'Dokumentiere alles – lerne schneller.',
    rarity: 'common',
    effect: { type: 'xp', value: 0.1, label: '+10% XP', icon: '⭐' },
  },
  {
    id: 'compass',
    icon: '🧭',
    name: 'Kompass',
    description: 'Nie die Richtung verlieren.',
    rarity: 'common',
    effect: { type: 'radius', value: 0.05, label: '+5% Radius', icon: '📡' },
  },
  {
    id: 'flashlight',
    icon: '🔦',
    name: 'Taschenlampe',
    description: 'Leuchte weiter in die Dunkelheit.',
    rarity: 'common',
    effect: { type: 'radius', value: 0.08, label: '+8% Radius', icon: '📡' },
  },
  {
    id: 'lucky_coin',
    icon: '🍀',
    name: 'Glücksklee',
    description: 'Ein kleines Quäntchen Glück.',
    rarity: 'common',
    effect: { type: 'loot', value: 0.08, label: '+8% Loot-Chance', icon: '🎲' },
  },
  {
    id: 'sneakers',
    icon: '👟',
    name: 'Laufschuhe',
    description: 'Schneller unterwegs, größerer Radius.',
    rarity: 'common',
    effect: { type: 'radius', value: 0.1, label: '+10% Radius', icon: '📡' },
  },
  {
    id: 'piggybank',
    icon: '🐷',
    name: 'Sparschwein',
    description: 'Jeden Coin aufsammeln.',
    rarity: 'common',
    effect: { type: 'coins', value: 0.1, label: '+10% Coins', icon: '🪙' },
  },
  {
    id: 'pencil',
    icon: '✏️',
    name: 'Bleistift',
    description: 'Kleine Notizen, große Erkenntnisse.',
    rarity: 'common',
    effect: { type: 'xp', value: 0.12, label: '+12% XP', icon: '⭐' },
  },
  {
    id: 'map_pin',
    icon: '📌',
    name: 'Stecknadel',
    description: 'Markiere jeden wichtigen Punkt.',
    rarity: 'common',
    effect: { type: 'coins', value: 0.08, label: '+8% Coins', icon: '🪙' },
  },

  // ── RARE ───────────────────────────────────────────────────
  {
    id: 'binoculars',
    icon: '🔭',
    name: 'Fernglas',
    description: 'Sieh weiter, entdecke mehr.',
    rarity: 'rare',
    effect: { type: 'coins', value: 0.15, label: '+15% Coins', icon: '🪙' },
  },
  {
    id: 'magnet',
    icon: '🧲',
    name: 'Loot-Magnet',
    description: 'Zieht Schätze magisch an.',
    rarity: 'rare',
    effect: { type: 'loot', value: 0.1, label: '+10% Loot-Chance', icon: '🎲' },
  },
  {
    id: 'energy_glove',
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
    id: 'scholar',
    icon: '🎓',
    name: 'Studentenmütze',
    description: 'Lerne aus jeder Erkundung.',
    rarity: 'rare',
    effect: { type: 'xp', value: 0.2, label: '+20% XP', icon: '⭐' },
  },
  {
    id: 'treasure_map',
    icon: '🗺️',
    name: 'Schatzkarte',
    description: 'Folge dem X zum Reichtum.',
    rarity: 'rare',
    effect: {
      type: 'loot',
      value: 0.15,
      label: '+15% Loot-Chance',
      icon: '🎲',
    },
  },
  {
    id: 'hiking_boots',
    icon: '🥾',
    name: 'Wanderstiefel',
    description: 'Unwegsames Gelände kein Problem.',
    rarity: 'rare',
    effect: { type: 'radius', value: 0.15, label: '+15% Radius', icon: '📡' },
  },
  {
    id: 'detective',
    icon: '🔍',
    name: 'Lupe',
    description: 'Kein Detail entgeht dir.',
    rarity: 'rare',
    effect: { type: 'xp', value: 0.25, label: '+25% XP', icon: '⭐' },
  },
  {
    id: 'briefcase',
    icon: '💼',
    name: 'Aktentasche',
    description: 'Professionelle Coin-Verwaltung.',
    rarity: 'rare',
    effect: { type: 'coins', value: 0.2, label: '+20% Coins', icon: '🪙' },
  },
  {
    id: 'stopwatch',
    icon: '⏱️',
    name: 'Stoppuhr',
    description: 'Effizienz ist alles.',
    rarity: 'rare',
    effect: {
      type: 'click',
      value: 0.35,
      label: '+35% Klick-Coins',
      icon: '👆',
    },
  },
  {
    id: 'radio',
    icon: '📻',
    name: 'Funkgerät',
    description: 'Koordiniere dich für größere Reichweite.',
    rarity: 'rare',
    effect: { type: 'radius', value: 0.18, label: '+18% Radius', icon: '📡' },
  },
  {
    id: 'journal',
    icon: '📖',
    name: 'Forschungstagebuch',
    description: 'Jede Entdeckung hinterlässt Spuren.',
    rarity: 'rare',
    effect: { type: 'xp', value: 0.22, label: '+22% XP', icon: '⭐' },
  },
  {
    id: 'four_leaf',
    icon: '🌿',
    name: 'Glückspflanze',
    description: 'Seltene Funde häufen sich.',
    rarity: 'rare',
    effect: { type: 'loot', value: 0.2, label: '+20% Loot-Chance', icon: '🎲' },
  },

  // ── EPIC ───────────────────────────────────────────────────
  {
    id: 'drone',
    icon: '🛸',
    name: 'Drohne',
    description: 'Scannt aus der Luft einen riesigen Bereich.',
    rarity: 'epic',
    effect: { type: 'radius', value: 0.2, label: '+20% Radius', icon: '📡' },
  },
  {
    id: 'moneybag',
    icon: '💰',
    name: 'Geldbeutel',
    description: 'Maximale Coin-Ausbeute.',
    rarity: 'epic',
    effect: { type: 'coins', value: 0.25, label: '+25% Coins', icon: '🪙' },
  },
  {
    id: 'crystal_ball',
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
    id: 'professor',
    icon: '🧪',
    name: 'Professorflask',
    description: 'Wissenschaftliche Methoden verdoppeln das Lernen.',
    rarity: 'epic',
    effect: { type: 'xp', value: 0.35, label: '+35% XP', icon: '⭐' },
  },
  {
    id: 'satellite',
    icon: '🛰️',
    name: 'Satellit',
    description: 'Globale Reichweite.',
    rarity: 'epic',
    effect: { type: 'radius', value: 0.3, label: '+30% Radius', icon: '📡' },
  },
  {
    id: 'diamond_pick',
    icon: '⛏️',
    name: 'Diamantspitzhacke',
    description: 'Hau mehr raus aus jedem Klick.',
    rarity: 'epic',
    effect: {
      type: 'click',
      value: 0.75,
      label: '+75% Klick-Coins',
      icon: '👆',
    },
  },
  {
    id: 'ancient_map',
    icon: '📜',
    name: 'Alte Karte',
    description: 'Uraltes Wissen beschleunigt dein Wachstum.',
    rarity: 'epic',
    effect: { type: 'xp', value: 0.4, label: '+40% XP', icon: '⭐' },
  },
  {
    id: 'treasure_chest',
    icon: '🧳',
    name: 'Expeditionskoffer',
    description: 'Alles für die große Entdeckung.',
    rarity: 'epic',
    effect: { type: 'coins', value: 0.3, label: '+30% Coins', icon: '🪙' },
  },
  {
    id: 'owl',
    icon: '🦉',
    name: 'Eule der Weisheit',
    description: 'Nachtaktiv und stets lernbereit.',
    rarity: 'epic',
    effect: { type: 'xp', value: 0.45, label: '+45% XP', icon: '⭐' },
  },
  {
    id: 'radar',
    icon: '📡',
    name: 'Radaranlage',
    description: 'Nichts entgeht diesem Sensor.',
    rarity: 'epic',
    effect: {
      type: 'loot',
      value: 0.35,
      label: '+35% Loot-Chance',
      icon: '🎲',
    },
  },
  {
    id: 'jetpack',
    icon: '🚀',
    name: 'Jetpack',
    description: 'Raketenantrieb für maximale Reichweite.',
    rarity: 'epic',
    effect: { type: 'radius', value: 0.35, label: '+35% Radius', icon: '📡' },
  },
  {
    id: 'hacker',
    icon: '💻',
    name: 'Laptop',
    description: 'Code schreiben = XP verdienen.',
    rarity: 'epic',
    effect: { type: 'xp', value: 0.38, label: '+38% XP', icon: '⭐' },
  },

  // ── LEGENDARY ──────────────────────────────────────────────
  {
    id: 'golden_crown',
    icon: '👑',
    name: 'Goldene Krone',
    description: 'Legendäre Coin-Ausbeute.',
    rarity: 'legendary',
    effect: { type: 'coins', value: 0.5, label: '+50% Coins', icon: '🪙' },
  },
  {
    id: 'dragon',
    icon: '🐉',
    name: 'Drachenschuppe',
    description: 'Uralte Macht verleiht gigantische Reichweite.',
    rarity: 'legendary',
    effect: { type: 'radius', value: 0.5, label: '+50% Radius', icon: '📡' },
  },
  {
    id: 'philosophers_stone',
    icon: '💎',
    name: 'Stein der Weisen',
    description: 'Verwandelt Erfahrung in pures Gold.',
    rarity: 'legendary',
    effect: { type: 'xp', value: 0.6, label: '+60% XP', icon: '⭐' },
  },
  {
    id: 'infinity_gauntlet',
    icon: '🌌',
    name: 'Galaxishandschuh',
    description: 'Unendliche Macht beim Tippen.',
    rarity: 'legendary',
    effect: {
      type: 'click',
      value: 1.0,
      label: '+100% Klick-Coins',
      icon: '👆',
    },
  },
  {
    id: 'holy_grail',
    icon: '🏆',
    name: 'Heiliger Gral',
    description: 'Der ultimative Schatzfinder.',
    rarity: 'legendary',
    effect: { type: 'loot', value: 0.5, label: '+50% Loot-Chance', icon: '🎲' },
  },
  {
    id: 'ancient_tome',
    icon: '📚',
    name: 'Uraltes Buch',
    description: 'Jahrtausende gesammeltes Wissen.',
    rarity: 'legendary',
    effect: { type: 'xp', value: 0.75, label: '+75% XP', icon: '⭐' },
  },
  {
    id: 'phoenix_feather',
    icon: '🔥',
    name: 'Phönixfeder',
    description: 'Steig aus der Asche und lerne doppelt.',
    rarity: 'legendary',
    effect: { type: 'xp', value: 0.65, label: '+65% XP', icon: '⭐' },
  },
  {
    id: 'black_hole',
    icon: '🌑',
    name: 'Schwarzes Loch',
    description: 'Saugt alle Coins aus der Umgebung.',
    rarity: 'legendary',
    effect: { type: 'coins', value: 0.75, label: '+75% Coins', icon: '🪙' },
  },
{
  id: 'auto_clicker',
  icon: '🤖',
  name: 'Auto-Clicker Bot',
  description: 'Klickt automatisch jede Sekunde für dich.',
  rarity: 'exotic', // 👉 oder 'exotic' wenn du erweitern willst
  effect: {
    type: 'click',
    value: 0, // wird nicht genutzt
    label: 'Auto Click jede Sekunde',
    icon: '⚡',
  },
}
];

export const RARITY_COLORS: Record<string, string> = {
  common: '#aaaaaa',
  rare: '#4da3ff',
  epic: '#c084fc',
  legendary: '#f97316',
  exotic: '#ff3b3b', // 🔴 rot statt pink
};
