"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBoardPath = validateBoardPath;
exports.areAdjacent = areAdjacent;
/**
 * Validates that a path on the board is valid:
 * 1. Coordinates are within board boundaries.
 * 2. Each step is an adjacent move in one of the 8 directions (up, down, left, right, 4 diagonals).
 * 3. No tile is used more than once.
 * 4. Path is continuous.
 * 5. Reconstructed word matches expected word if provided.
 */
function validateBoardPath(board, path, expectedWord) {
    if (!board || board.length === 0) {
        return { valid: false, error: 'Board is empty or missing' };
    }
    const rows = board.length;
    const cols = board[0].length;
    if (!path || path.length === 0) {
        return { valid: false, error: 'Path is empty' };
    }
    const visited = new Set();
    const letters = [];
    for (let i = 0; i < path.length; i++) {
        const { row, col } = path[i];
        // Bounds check
        if (row < 0 || row >= rows || col < 0 || col >= cols) {
            return { valid: false, error: `Coordinate (${row}, ${col}) is out of bounds` };
        }
        // Duplicate tile check
        const key = `${row},${col}`;
        if (visited.has(key)) {
            return { valid: false, error: `Tile at (${row}, ${col}) used multiple times` };
        }
        visited.add(key);
        // Adjacency check with previous tile
        if (i > 0) {
            const prev = path[i - 1];
            const dRow = Math.abs(row - prev.row);
            const dCol = Math.abs(col - prev.col);
            // Must be adjacent in 8 directions (dRow <= 1, dCol <= 1, not both 0)
            if (dRow > 1 || dCol > 1 || (dRow === 0 && dCol === 0)) {
                return { valid: false, error: `Non-adjacent jump between (${prev.row}, ${prev.col}) and (${row}, ${col})` };
            }
        }
        const tileLetter = board[row][col].toUpperCase();
        letters.push(tileLetter);
    }
    const reconstructedWord = letters.join('');
    const letterLength = reconstructedWord.length;
    if (expectedWord) {
        const normalizedExpected = expectedWord.toUpperCase().trim();
        if (reconstructedWord !== normalizedExpected) {
            return {
                valid: false,
                error: `Path forms '${reconstructedWord}', but expected '${normalizedExpected}'`,
                word: reconstructedWord,
                letterLength,
            };
        }
    }
    return {
        valid: true,
        word: reconstructedWord,
        letterLength,
    };
}
/**
 * Checks if two coordinates are adjacent in any of the 8 directions
 */
function areAdjacent(c1, c2) {
    const dRow = Math.abs(c1.row - c2.row);
    const dCol = Math.abs(c1.col - c2.col);
    return (dRow <= 1 && dCol <= 1) && !(dRow === 0 && dCol === 0);
}
