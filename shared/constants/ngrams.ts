// Common English patterns to intelligently seed into board paths
export const COMMON_BIGRAMS = [
  'TH', 'HE', 'IN', 'ER', 'AN', 'RE', 'ON', 'AT', 'EN', 'ND',
  'ST', 'ED', 'ES', 'OR', 'TE', 'OF', 'IS', 'IT', 'AL', 'AR'
];

export const VOWEL_COMBINATIONS = [
  'EA', 'OU', 'AI', 'IE', 'OO', 'EE', 'OA', 'AU', 'OI', 'UE'
];

export const COMMON_TRIGRAMS = [
  'ENT', 'THE', 'AND', 'ING', 'ION', 'ANT', 'EST', 'AIN', 'FOR', 'ALL',
  'TER', 'RES', 'VER', 'ITH', 'NOT', 'CON', 'DIS', 'PRO', 'COM'
];

export const COMMON_ENDINGS = [
  'ING', 'TION', 'ED', 'ER', 'LY', 'MENT', 'NESS', 'ABLE', 'OUS'
];

export const COMMON_BEGINNINGS = [
  'PRE', 'CON', 'DIS', 'RE', 'UN', 'SUB', 'INT', 'EXT', 'TRI'
];

// All candidate n-grams combined for smart board generator
export const SMART_SEEDS = [
  ...COMMON_BIGRAMS,
  ...VOWEL_COMBINATIONS,
  ...COMMON_TRIGRAMS,
  ...COMMON_ENDINGS,
  ...COMMON_BEGINNINGS,
];
