export type GridSize = 4 | 5 | 6 | 7 | 8;

export interface Coordinate {
  row: number;
  col: number;
}

export type Board = string[][];

export interface Player {
  id: string;
  username: string;
  avatar: string;
  color: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  score: number;
  foundWordsCount: number;
}

export type RoomStatus = 'LOBBY' | 'STARTING' | 'PLAYING' | 'ENDED';

export interface RoomSettings {
  gridSize: GridSize;
  durationSeconds: number; // e.g. 180 to 600
  minWordLength: number;   // default 3
}

export interface WordSubmission {
  word: string;
  path: Coordinate[];
  playerId: string;
  timestamp: number;
  letterCount: number;
}

export interface WordScoreDetail {
  word: string;
  letterCount: number;
  finders: string[]; // player IDs
  findersCount: number;
  pointsPerFinder: number;
  isUnique: boolean; // only 1 player found it
  isAll: boolean;    // all players found it
  definition?: string;
  tier?: 'A' | 'B' | 'C' | 'D';
  path?: Coordinate[];
}

export interface PlayerRoundResult {
  playerId: string;
  username: string;
  avatar: string;
  color: string;
  totalScore: number;
  wordsFound: number;
  uniqueWordsCount: number;
  sharedWordsCount: number;
  longestWord: string;
  wordDetails: WordScoreDetail[];
  rank: number;
}

export interface BoardWordInfo {
  word: string;
  length: number;
  finders: string[]; // usernames of players who found it
  def?: string;
  tier?: string;
  path?: Coordinate[];
}

export interface RoundResults {
  roomCode: string;
  board: Board;
  totalPossibleWords: number;
  allBoardWords: BoardWordInfo[];
  playerResults: PlayerRoundResult[];
  startedAt: number;
  endedAt: number;
}

export interface BoardStats {
  totalWords: number;
  byLength: Record<number, number>;
  longestWord: string;
  difficulty: 'Relaxed' | 'Balanced' | 'Challenging' | 'Master';
  quCount: number;
}
