import { Board, Coordinate, GridSize, Player, RoomSettings, RoomStatus, RoundResults } from './game';

export interface ClientToServerEvents {
  'room:create': (data: { username: string; avatar?: string; color?: string; settings?: Partial<RoomSettings> }, callback: (response: { success: boolean; roomCode?: string; playerId?: string; error?: string }) => void) => void;
  'room:join': (data: { roomCode: string; username: string; avatar?: string; color?: string }, callback: (response: { success: boolean; playerId?: string; error?: string }) => void) => void;
  'room:leave': () => void;
  'room:update_settings': (data: { settings: Partial<RoomSettings> }) => void;
  'player:ready': (data: { isReady: boolean }) => void;
  'game:start': () => void;
  'word:submit': (data: { word: string; path: Coordinate[] }, callback: (response: { valid: boolean; word: string; reason?: string; letterCount?: number }) => void) => void;
  'player:update_profile': (data: { avatar?: string; color?: string }) => void;
  'player:reconnect': (data: { roomCode: string; playerId: string }, callback: (response: { success: boolean; error?: string }) => void) => void;
  'game:play_again': () => void;
}

export interface ServerToClientEvents {
  'room:state': (data: {
    roomCode: string;
    hostId: string;
    players: Record<string, Player>;
    settings: RoomSettings;
    status: RoomStatus;
    board?: Board;
    remainingSeconds?: number;
  }) => void;
  'room:error': (data: { message: string }) => void;
  'game:starting': (data: { countdown: number }) => void;
  'game:started': (data: {
    board: Board;
    durationSeconds: number;
    endTime: number;
    settings: RoomSettings;
  }) => void;
  'game:tick': (data: { remainingSeconds: number }) => void;
  'word:accepted': (data: {
    word: string;
    letterCount: number;
    totalFoundCount: number;
  }) => void;
  'word:rejected': (data: {
    word: string;
    reason: string;
  }) => void;
  'player:feed_event': (data: {
    playerId: string;
    username: string;
    avatar?: string;
    letterCount: number;
    timestamp: number;
  }) => void;
  'player:word_count_update': (data: {
    playerId: string;
    foundWordsCount: number;
  }) => void;
  'game:ended': (data: { results: RoundResults }) => void;
}
