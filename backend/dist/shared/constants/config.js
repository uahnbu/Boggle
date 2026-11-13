"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MIN_WORD_LENGTH = exports.DEFAULT_GRID_SIZE = exports.MAX_ROUND_DURATION = exports.MIN_ROUND_DURATION = exports.DEFAULT_ROUND_DURATION = exports.GRID_CONFIGS = void 0;
exports.GRID_CONFIGS = {
    4: { size: 4, minTargetWords: 30, maxTargetWords: 120, seedNgramsCount: 3 },
    5: { size: 5, minTargetWords: 80, maxTargetWords: 220, seedNgramsCount: 5 },
    6: { size: 6, minTargetWords: 150, maxTargetWords: 350, seedNgramsCount: 8 },
    7: { size: 7, minTargetWords: 250, maxTargetWords: 500, seedNgramsCount: 11 },
    8: { size: 8, minTargetWords: 350, maxTargetWords: 750, seedNgramsCount: 15 },
};
exports.DEFAULT_ROUND_DURATION = 300; // 5 minutes in seconds
exports.MIN_ROUND_DURATION = 60; // 1 minute (for fast games)
exports.MAX_ROUND_DURATION = 600; // 10 minutes
exports.DEFAULT_GRID_SIZE = 5;
exports.DEFAULT_MIN_WORD_LENGTH = 3;
