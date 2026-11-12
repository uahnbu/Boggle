export const LETTER_WEIGHTS: Record<string, number> = {
  E: 12.7,
  T: 9.1,
  A: 8.2,
  O: 7.5,
  I: 7.0,
  N: 6.7,
  S: 6.3,
  H: 6.1,
  R: 6.0,
  D: 4.3,
  L: 4.0,
  C: 2.8,
  U: 2.8,
  M: 2.4,
  W: 2.4,
  F: 2.2,
  G: 2.0,
  Y: 2.0,
  P: 1.9,
  B: 1.5,
  V: 1.0,
  K: 0.8,
  J: 0.20,
  X: 0.20,
  QU: 0.35, // Boosted slightly so fun QU words like QUEEN, QUICK, QUIET can appear
  Z: 0.15,
};

export const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

// Expanded Animal Avatars Selection
export const ANIMAL_AVATARS = [
  '🦊', '🐼', '🦁', '🐨', '🐯', '🐸', '🦉', '🦄',
  '🐙', '🐬', '🐧', '🐵', '🐺', '🐰', '🐻', '🐘',
  '🦒', '🦔', '🦩', '🦋', '🦚', '🐲', '🦖', '🐳',
  '🦦', '🦭', '🐝', '🦅', '🐆', '🦝', '🦓', '🦘'
];

// Playful Orange-Purple gradient theme palette for avatars and badges
export const AVATAR_COLORS = [
  '#FF7A00', // Electric Orange
  '#8B5CF6', // Vivid Purple
  '#FF5E00', // Deep Orange
  '#7C3AED', // Royal Violet
  '#FFA040', // Coral Amber
  '#A855F7', // Bright Lavender
  '#EC4899', // Pink Punch
  '#6366F1', // Indigo
  '#F59E0B', // Golden Sun
  '#06B6D4', // Cyan Wave
];
