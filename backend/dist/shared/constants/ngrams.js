"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMART_SEEDS = exports.COMMON_BEGINNINGS = exports.COMMON_ENDINGS = exports.COMMON_TRIGRAMS = exports.VOWEL_COMBINATIONS = exports.COMMON_BIGRAMS = void 0;
// Common English patterns to intelligently seed into board paths
exports.COMMON_BIGRAMS = [
    'TH', 'HE', 'IN', 'ER', 'AN', 'RE', 'ON', 'AT', 'EN', 'ND',
    'ST', 'ED', 'ES', 'OR', 'TE', 'OF', 'IS', 'IT', 'AL', 'AR'
];
exports.VOWEL_COMBINATIONS = [
    'EA', 'OU', 'AI', 'IE', 'OO', 'EE', 'OA', 'AU', 'OI', 'UE'
];
exports.COMMON_TRIGRAMS = [
    'ENT', 'THE', 'AND', 'ING', 'ION', 'ANT', 'EST', 'AIN', 'FOR', 'ALL',
    'TER', 'RES', 'VER', 'ITH', 'NOT', 'CON', 'DIS', 'PRO', 'COM'
];
exports.COMMON_ENDINGS = [
    'ING', 'TION', 'ED', 'ER', 'LY', 'MENT', 'NESS', 'ABLE', 'OUS'
];
exports.COMMON_BEGINNINGS = [
    'PRE', 'CON', 'DIS', 'RE', 'UN', 'SUB', 'INT', 'EXT', 'TRI'
];
// All candidate n-grams combined for smart board generator
exports.SMART_SEEDS = [
    ...exports.COMMON_BIGRAMS,
    ...exports.VOWEL_COMBINATIONS,
    ...exports.COMMON_TRIGRAMS,
    ...exports.COMMON_ENDINGS,
    ...exports.COMMON_BEGINNINGS,
];
