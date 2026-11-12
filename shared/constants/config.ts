import { GridSize } from '../types/game';

export interface GridConfig {
  size: GridSize;
  minTargetWords: number;
  maxTargetWords: number;
  seedNgramsCount: number;
}

export const GRID_CONFIGS: Record<GridSize, GridConfig> = {
  4: { size: 4, minTargetWords: 30, maxTargetWords: 120, seedNgramsCount: 3 },
  5: { size: 5, minTargetWords: 80, maxTargetWords: 220, seedNgramsCount: 5 },
  6: { size: 6, minTargetWords: 150, maxTargetWords: 350, seedNgramsCount: 8 },
  7: { size: 7, minTargetWords: 250, maxTargetWords: 500, seedNgramsCount: 11 },
  8: { size: 8, minTargetWords: 350, maxTargetWords: 750, seedNgramsCount: 15 },
};

export const DEFAULT_ROUND_DURATION = 300; // 5 minutes in seconds
export const MIN_ROUND_DURATION = 60;      // 1 minute (for fast games)
export const MAX_ROUND_DURATION = 600;     // 10 minutes
export const DEFAULT_GRID_SIZE: GridSize = 5;
export const DEFAULT_MIN_WORD_LENGTH = 3;
