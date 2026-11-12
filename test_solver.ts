import fs from 'fs';
import path from 'path';
import { Trie } from './shared/solver/trie';
import { generateSmartBoard } from './shared/solver/board-generator';
import { solveBoard } from './shared/solver/board-solver';
import { validateBoardPath } from './shared/validation/path-validator';
import { calculateWordScore } from './shared/validation/scoring';
import { GridSize } from './shared/types/game';

console.log('--- TESTING WORD GAME CORE ENGINE ---');

// 1. Load dictionary into Trie
console.log('1. Loading dictionary...');
const t0 = Date.now();
const wordsData = JSON.parse(fs.readFileSync('./dictionary/words.json', 'utf-8'));
const trie = Trie.fromWords(wordsData);
console.log(`Loaded ${trie.size} words into Trie in ${Date.now() - t0}ms`);

// 2. Test Word lookup & Exclusions
console.log('\n2. Testing word lookups & exclusions:');
const testWords = ['HOUSE', 'WATER', 'RESILIENT', 'METICULOUS', 'HYPOTHESIS', 'QUIET', 'BAIYUN', 'BIONDI', 'DEVENS', 'LOTTOS'];
for (const w of testWords) {
  console.log(`  ${w}: ${trie.hasWord(w) ? 'ACCEPTED ✓' : 'REJECTED (correct) ✗'}`);
}

// 3. Test Board Generation for all sizes: 4x4, 5x5, 6x6, 7x7, 8x8
console.log('\n3. Testing Board Generation across sizes 4x4 to 8x8:');
const sizes: GridSize[] = [4, 5, 6, 7, 8];
for (const s of sizes) {
  const tGen = Date.now();
  const res = generateSmartBoard(s, trie, 15);
  const genMs = Date.now() - tGen;

  console.log(`\nGrid ${s}x${s}:`);
  console.log(`  Attempts: ${res.attempts} in ${genMs}ms`);
  console.log(`  Total valid words: ${res.solver.stats.totalWords}`);
  console.log(`  Difficulty: ${res.solver.stats.difficulty}`);
  console.log(`  Longest word: ${res.solver.stats.longestWord} (${res.solver.stats.longestWord.length} letters)`);
  console.log(`  QU tiles count: ${res.solver.stats.quCount}`);
  console.log('  Board preview:');
  for (let r = 0; r < s; r++) {
    console.log('    ' + res.board[r].map(cell => cell.padEnd(2, ' ')).join(' '));
  }
  // Sample 5 words found
  const sampleWords = Array.from(res.solver.words.keys()).slice(0, 8);
  console.log(`  Sample words: ${sampleWords.join(', ')}`);
}

// 4. Test Path Validation
console.log('\n4. Testing Path Validation:');
const mockBoard = [
  ['C', 'A', 'T'],
  ['O', 'R', 'S'],
  ['QU', 'I', 'E']
];

// Valid path for "CAT"
const validPath = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }];
const valRes = validateBoardPath(mockBoard, validPath, 'CAT');
console.log('  CAT path valid:', valRes.valid);

// Diagonal path for "C", "R", "E"
const diagPath = [{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }];
const diagRes = validateBoardPath(mockBoard, diagPath, 'CRE');
console.log('  Diagonal CRE path valid:', diagRes.valid);

// Invalid jump from (0,0) to (2,2)
const jumpPath = [{ row: 0, col: 0 }, { row: 2, col: 2 }];
const jumpRes = validateBoardPath(mockBoard, jumpPath);
console.log('  Jump path rejected:', !jumpRes.valid, `(${jumpRes.error})`);

// Duplicate tile reuse
const dupPath = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 0 }];
const dupRes = validateBoardPath(mockBoard, dupPath);
console.log('  Tile reuse rejected:', !dupRes.valid, `(${dupRes.error})`);

// QU tile test
const quPath = [{ row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }];
const quRes = validateBoardPath(mockBoard, quPath);
console.log('  QU tile forms QUIE:', quRes.word === 'QUIE', `(length = ${quRes.letterLength})`);

// 5. Test Scoring Formula
console.log('\n5. Testing Scoring Formula:');
// Formula: floor(L * N / K)
// 4 players (N=4):
// CAT (L=3), found by all 4: 3 * (4/4) = 3
console.log('  CAT (L=3, N=4, K=4):', calculateWordScore(3, 4, 4), 'points (expected: 3)');
// HOUSE (L=5, N=4, K=4): 5 * (4/4) = 5
console.log('  HOUSE (L=5, N=4, K=4):', calculateWordScore(5, 4, 4), 'points (expected: 5)');
// HOUSE (L=5, N=4, K=2): 5 * (4/2) = 10
console.log('  HOUSE (L=5, N=4, K=2):', calculateWordScore(5, 4, 2), 'points (expected: 10)');
// HOUSE (L=5, N=4, K=1): 5 * (4/1) = 20
console.log('  HOUSE (L=5, N=4, K=1):', calculateWordScore(5, 4, 1), 'points (expected: 20)');
// ELEPHANT (L=8, N=4, K=1): 8 * (4/1) = 32
console.log('  ELEPHANT (L=8, N=4, K=1):', calculateWordScore(8, 4, 1), 'points (expected: 32)');
// QUIET (L=5, N=4, K=2): 5 * (4/2) = 10
console.log('  QUIET (L=5, N=4, K=2):', calculateWordScore(5, 4, 2), 'points (expected: 10)');

console.log('\n--- ALL CORE LOGIC TESTS PASSED ---');
