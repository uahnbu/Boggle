import { Board, GridSize } from '../types/game';
import { GRID_CONFIGS } from '../constants/config';
import { LETTER_WEIGHTS, VOWELS } from '../constants/letters';
import { SMART_SEEDS } from '../constants/ngrams';
import { Trie } from './trie';
import { solveBoard, SolverResult } from './board-solver';

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

// Compute cumulative distribution for weighted letter sampling
const letters: string[] = Object.keys(LETTER_WEIGHTS);
const weights: number[] = Object.values(LETTER_WEIGHTS);
const totalWeight = weights.reduce((sum, w) => sum + w, 0);

function getRandomWeightedLetter(): string {
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < letters.length; i++) {
    if (rand < weights[i]) {
      return letters[i];
    }
    rand -= weights[i];
  }
  return 'E';
}

function getRandomVowel(): string {
  const vowelList = ['A', 'E', 'I', 'O', 'U'];
  return vowelList[Math.floor(Math.random() * vowelList.length)];
}

export interface GeneratedBoardResult {
  board: Board;
  solver: SolverResult;
  attempts: number;
}

/**
 * Intelligent board generator:
 * 1. Seeds common English n-grams (ENT, EAS, TH, IN, QU, etc.) into connected paths.
 * 2. Fills remaining tiles with weighted distribution + vowel balancing.
 * 3. Uses Trie DFS solver to verify word targets.
 * 4. Retries if word target is not met, picking the best candidate.
 */
export function generateSmartBoard(
  size: GridSize,
  trie: Trie,
  minWordLength: number = 3,
  maxAttempts: number = 20
): GeneratedBoardResult {
  const config = GRID_CONFIGS[size];
  let bestBoard: Board | null = null;
  let bestSolver: SolverResult | null = null;
  let bestDistance = Infinity;

  const targetMid = (config.minTargetWords + config.maxTargetWords) / 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const board: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

    // 1. Place intelligent seed patterns into connected paths
    const seedCount = config.seedNgramsCount;
    for (let s = 0; s < seedCount; s++) {
      const seed = SMART_SEEDS[Math.floor(Math.random() * SMART_SEEDS.length)];
      
      // Find a random starting empty cell
      const emptyCells: [number, number][] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (board[r][c] === null) emptyCells.push([r, c]);
        }
      }
      if (emptyCells.length === 0) break;

      const [startR, startC] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      let currR = startR;
      let currC = startC;
      
      // Trace path for seed characters
      let pathValid = true;
      const seedChars = seed.split('');
      const pathCells: [number, number][] = [[currR, currC]];

      for (let ci = 1; ci < seedChars.length; ci++) {
        // Find adjacent empty neighbors
        const neighbors: [number, number][] = [];
        for (const [dr, dc] of DIRECTIONS) {
          const nr = currR + dr;
          const nc = currC + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === null && !pathCells.some(([pr, pc]) => pr === nr && pc === nc)) {
            neighbors.push([nr, nc]);
          }
        }

        if (neighbors.length === 0) {
          pathValid = false;
          break;
        }

        const [nextR, nextC] = neighbors[Math.floor(Math.random() * neighbors.length)];
        pathCells.push([nextR, nextC]);
        currR = nextR;
        currC = nextC;
      }

      if (pathValid) {
        for (let i = 0; i < seedChars.length; i++) {
          board[pathCells[i][0]][pathCells[i][1]] = seedChars[i];
        }
      }
    }

    // 2. Fill remaining empty tiles with weighted random letters
    let totalCells = size * size;
    let vowelCount = 0;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === null) {
          board[r][c] = getRandomWeightedLetter();
        }
        if (VOWELS.has(board[r][c]!)) {
          vowelCount++;
        }
      }
    }

    // Ensure vowel ratio is between 30% and 45%
    const minVowels = Math.floor(totalCells * 0.30);
    while (vowelCount < minVowels) {
      const randR = Math.floor(Math.random() * size);
      const randC = Math.floor(Math.random() * size);
      if (!VOWELS.has(board[randR][randC]!)) {
        board[randR][randC] = getRandomVowel();
        vowelCount++;
      }
    }

    const finalBoard = board as Board;

    // 3. Solve board and check word targets
    const solver = solveBoard(finalBoard, trie, minWordLength);
    const wordCount = solver.stats.totalWords;

    // Check if within target range and has reasonable length distribution
    const hasLongWord = Object.keys(solver.stats.byLength).some(len => Number(len) >= 5);
    
    if (wordCount >= config.minTargetWords && wordCount <= config.maxTargetWords && hasLongWord) {
      return {
        board: finalBoard,
        solver,
        attempts: attempt,
      };
    }

    // Track best candidate
    const dist = Math.abs(wordCount - targetMid);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestBoard = finalBoard;
      bestSolver = solver;
    }
  }

  // Fallback to best found
  return {
    board: bestBoard!,
    solver: bestSolver!,
    attempts: maxAttempts,
  };
}
