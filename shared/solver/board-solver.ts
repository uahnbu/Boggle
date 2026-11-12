import { Board, BoardStats, Coordinate } from '../types/game';
import { Trie, TrieNode } from './trie';

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

export interface SolverResult {
  words: Map<string, Coordinate[]>;
  stats: BoardStats;
}

export function solveBoard(board: Board, trie: Trie, minLength: number = 3): SolverResult {
  const rows = board.length;
  const cols = board[0].length;
  const foundWords = new Map<string, Coordinate[]>();
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));

  let quTileCount = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].toUpperCase() === 'QU') {
        quTileCount++;
      }
    }
  }

  function dfs(
    r: number,
    c: number,
    currentNode: TrieNode,
    currentPath: Coordinate[],
    currentWord: string
  ) {
    const tile = board[r][c].toUpperCase();
    
    // Check if tile characters match trie
    let nextNode: TrieNode | null = currentNode;
    for (let i = 0; i < tile.length; i++) {
      const char = tile[i];
      if (!nextNode.children[char]) {
        return; // Dead end in dictionary
      }
      nextNode = nextNode.children[char];
    }

    const wordWithTile = currentWord + tile;
    const newPath = [...currentPath, { row: r, col: c }];

    // If it's a valid complete word and meets min length
    if (nextNode.isWord && wordWithTile.length >= minLength) {
      if (!foundWords.has(wordWithTile)) {
        foundWords.set(wordWithTile, newPath);
      }
    }

    // Recurse into neighbors
    visited[r][c] = true;
    for (const [dr, dc] of DIRECTIONS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
        dfs(nr, nc, nextNode, newPath, wordWithTile);
      }
    }
    visited[r][c] = false;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dfs(r, c, trie.root, [], '');
    }
  }

  // Calculate statistics
  const byLength: Record<number, number> = {};
  let longestWord = '';

  for (const word of foundWords.keys()) {
    const len = word.length;
    byLength[len] = (byLength[len] || 0) + 1;
    if (len > longestWord.length) {
      longestWord = word;
    }
  }

  const total = foundWords.size;
  let difficulty: BoardStats['difficulty'] = 'Balanced';
  if (total < 50) difficulty = 'Challenging';
  else if (total < 120) difficulty = 'Balanced';
  else if (total < 250) difficulty = 'Relaxed';
  else difficulty = 'Master';

  return {
    words: foundWords,
    stats: {
      totalWords: total,
      byLength,
      longestWord,
      difficulty,
      quCount: quTileCount,
    },
  };
}
