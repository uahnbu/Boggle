"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateWordScore = calculateWordScore;
exports.getWordLetterLength = getWordLetterLength;
/**
 * Calculate the points for a word based on multiplayer rarity formula:
 * Score = floor(L * (N / K))
 *
 * Where:
 * - N = total number of players in the round
 * - K = number of distinct players who found this word
 * - L = number of letters in the word (QU counts as 2 letters)
 */
function calculateWordScore(letterLength, totalPlayers, findersCount) {
    if (totalPlayers <= 0 || findersCount <= 0)
        return 0;
    // Single player mode fallback: 1 point per letter
    if (totalPlayers === 1) {
        return letterLength;
    }
    // Cap finders count at total players
    const k = Math.min(findersCount, totalPlayers);
    // Formula: floor(L * (N / K))
    return Math.floor(letterLength * (totalPlayers / k));
}
/**
 * Helper to compute effective letter length for scoring
 */
function getWordLetterLength(word) {
    return word.toUpperCase().length;
}
