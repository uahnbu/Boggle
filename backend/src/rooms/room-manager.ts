import { Board, Coordinate, GridSize, Player, RoomSettings, RoomStatus, RoundResults, WordSubmission } from '../../../shared/types/game';
import { AVATAR_COLORS, ANIMAL_AVATARS } from '../../../shared/constants/letters';
import { DEFAULT_GRID_SIZE, DEFAULT_MIN_WORD_LENGTH, DEFAULT_ROUND_DURATION } from '../../../shared/constants/config';
import { generateSmartBoard } from '../../../shared/solver/board-generator';
import { SolverResult } from '../../../shared/solver/board-solver';
import { validateBoardPath } from '../../../shared/validation/path-validator';
import { DictionaryService } from '../dictionary/dictionary-service';
import { calculateRoundResults } from '../scoring/scoring-engine';
import { getDatabase } from '../database/db';
import { Server, Socket } from 'socket.io';

const AVATAR_EMOJIS = ANIMAL_AVATARS;

export class GameRoom {
  public code: string;
  public hostId: string;
  public settings: RoomSettings;
  public status: RoomStatus = 'LOBBY';
  public players: Map<string, Player> = new Map();
  public socketToPlayer: Map<string, string> = new Map(); // socketId -> playerId
  public playerSockets: Map<string, string> = new Map();  // playerId -> socketId

  public board?: Board;
  public solverResult?: SolverResult;
  public submissions: WordSubmission[] = [];
  public playerWordSets: Map<string, Set<string>> = new Map(); // playerId -> Set<word>
  public roundStartTime?: number;
  public roundEndTime?: number;
  public timerInterval?: NodeJS.Timeout;
  public countdownTimeout?: NodeJS.Timeout;
  public ghostHintInterval?: NodeJS.Timeout;
  public firstGhostTimeout?: NodeJS.Timeout;
  public ghostHintIndex: number = 0;
  public hintedWords: Set<string> = new Set();
  public currentGhostHint: {
    wordLength: number;
    hintLetters: string;
    path: Coordinate[];
    timestamp: number;
  } | null = null;

  private dictionary: DictionaryService;
  private io: Server;
  private gameId?: string;

  constructor(code: string, hostPlayer: Player, io: Server, dictionary: DictionaryService) {
    this.code = code;
    this.hostId = hostPlayer.id;
    this.io = io;
    this.dictionary = dictionary;
    this.settings = {
      gridSize: DEFAULT_GRID_SIZE,
      durationSeconds: DEFAULT_ROUND_DURATION,
      minWordLength: DEFAULT_MIN_WORD_LENGTH,
    };
    this.addPlayer(hostPlayer);

    // Persist room in SQLite
    try {
      const db = getDatabase();
      db.prepare(`
        INSERT OR REPLACE INTO rooms (id, room_code, host_user_id, grid_size, duration_seconds, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(code, code, hostPlayer.id, this.settings.gridSize, this.settings.durationSeconds, 'LOBBY', Date.now());
    } catch (e) {
      console.error('[GameRoom] DB insert error:', e);
    }
  }

  public addPlayer(player: Player): void {
    this.players.set(player.id, player);
    if (!this.playerWordSets.has(player.id)) {
      this.playerWordSets.set(player.id, new Set());
    }

    // Persist user in DB
    try {
      const db = getDatabase();
      db.prepare(`
        INSERT OR REPLACE INTO users (id, username, avatar, created_at)
        VALUES (?, ?, ?, ?)
      `).run(player.id, player.username, player.avatar, Date.now());
    } catch (e) {
      console.error('[GameRoom] DB user error:', e);
    }
  }

  public removeSocket(socketId: string): void {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return;

    this.socketToPlayer.delete(socketId);
    const player = this.players.get(playerId);

    if (player) {
      if (this.status === 'PLAYING') {
        // Mark as disconnected during round so they can reconnect
        player.isConnected = false;
        this.broadcastState();
      } else {
        // In lobby or ended, remove player completely
        this.players.delete(playerId);
        this.playerSockets.delete(playerId);

        // If host left, transfer host privileges to next player
        if (this.hostId === playerId && this.players.size > 0) {
          const nextHost = this.players.values().next().value;
          if (nextHost) {
            this.hostId = nextHost.id;
            nextHost.isHost = true;
          }
        }
        this.broadcastState();
      }
    }
  }

  public bindSocket(socket: Socket, playerId: string): void {
    this.socketToPlayer.set(socket.id, playerId);
    this.playerSockets.set(playerId, socket.id);
    const player = this.players.get(playerId);
    if (player) {
      player.isConnected = true;
    }
    socket.join(this.code);
  }

  public updateSettings(newSettings: Partial<RoomSettings>): void {
    if (this.status !== 'LOBBY') return;
    this.settings = { ...this.settings, ...newSettings };
    this.broadcastState();
  }

  public setPlayerReady(playerId: string, isReady: boolean): void {
    const player = this.players.get(playerId);
    if (player) {
      player.isReady = isReady;
      this.broadcastState();
    }
  }

  public updatePlayerProfile(playerId: string, avatar?: string, color?: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    if (avatar) player.avatar = avatar;
    if (color) player.color = color;
    this.broadcastState();
  }

  public startGame(): boolean {
    if (this.status !== 'LOBBY') return false;

    this.status = 'STARTING';
    this.broadcastState();

    // 3-second starting countdown
    let countdown = 3;
    this.io.to(this.code).emit('game:starting', { countdown });

    const countdownTimer = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        this.io.to(this.code).emit('game:starting', { countdown });
      } else {
        clearInterval(countdownTimer);
        this.beginRound();
      }
    }, 1000);

    return true;
  }

  private beginRound(): void {
    console.log(`[GameRoom ${this.code}] Generating smart board for size ${this.settings.gridSize}x${this.settings.gridSize}...`);
    
    // Generate smart board using intelligent n-grams & trie solver
    const generated = generateSmartBoard(this.settings.gridSize, this.dictionary.getTrie(), this.settings.minWordLength);
    this.board = generated.board;
    this.solverResult = generated.solver;

    this.status = 'PLAYING';
    this.submissions = [];
    this.playerWordSets.clear();
    for (const player of this.players.values()) {
      player.foundWordsCount = 0;
      player.score = 0;
      this.playerWordSets.set(player.id, new Set());
    }

    const now = Date.now();
    this.roundStartTime = now;
    this.roundEndTime = now + (this.settings.durationSeconds * 1000);
    this.gameId = `game-${this.code}-${now}`;

    // Persist game in SQLite
    try {
      const db = getDatabase();
      db.prepare(`
        INSERT INTO games (id, room_id, board_data, dictionary_version, started_at, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(this.gameId, this.code, JSON.stringify(this.board), this.dictionary.version, now, 'ACTIVE');

      for (const p of this.players.values()) {
        db.prepare(`
          INSERT INTO game_players (game_id, user_id, score, joined_at)
          VALUES (?, ?, ?, ?)
        `).run(this.gameId, p.id, 0, now);
      }
    } catch (e) {
      console.error('[GameRoom] DB game insert error:', e);
    }

    // Broadcast round start to all players
    this.io.to(this.code).emit('game:started', {
      board: this.board,
      durationSeconds: this.settings.durationSeconds,
      endTime: this.roundEndTime,
      settings: this.settings,
    });

    // Start server-authoritative timer ticker
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      const remainingMs = (this.roundEndTime || 0) - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      this.io.to(this.code).emit('game:tick', { remainingSeconds: remainingSec });

      if (remainingSec <= 0) {
        this.endRound();
      }
    }, 1000);

    // Clear previous ghost hint timers and records
    if (this.ghostHintInterval) clearInterval(this.ghostHintInterval);
    if (this.firstGhostTimeout) clearTimeout(this.firstGhostTimeout);
    this.hintedWords.clear();
    this.currentGhostHint = null;

    // Filter candidate words for ghost hint (at least minWordLength letters, sorted longest first)
    const minHintLength = Math.max(4, this.settings.minWordLength);
    const candidateWords = Array.from(this.solverResult.words.entries())
      .filter(([w]) => w.length >= minHintLength)
      .sort((a, b) => b[0].length - a[0].length);

    const emitNextGhostHint = () => {
      if (this.status !== 'PLAYING' || !this.board || candidateWords.length === 0) {
        if (this.ghostHintInterval) clearInterval(this.ghostHintInterval);
        return;
      }

      // Find the next longest word that hasn't been hinted yet
      const nextWordEntry = candidateWords.find(([w]) => !this.hintedWords.has(w));
      if (!nextWordEntry) {
        console.log(`[GameRoom ${this.code}] All ${candidateWords.length} candidate words have been hinted this round.`);
        return;
      }

      const [word, fullPath] = nextWordEntry;
      this.hintedWords.add(word);

      const halfLen = Math.ceil(fullPath.length / 2);
      const hintPath = fullPath.slice(0, halfLen);

      console.log(`[GameRoom ${this.code}] Emitting non-repeating ghost hint for ${word.length}-letter word "${word}": ${word.slice(0, halfLen)}...`);
      const hintData = {
        wordLength: word.length,
        hintLetters: word.slice(0, halfLen),
        path: hintPath,
        timestamp: Date.now(),
      };
      this.currentGhostHint = hintData;
      this.io.to(this.code).emit('game:ghost_hint', hintData);
    };

    // Emit initial ghost hint early (after 10s of round start)
    this.firstGhostTimeout = setTimeout(() => {
      emitNextGhostHint();
    }, 10000);

    // After every 30 seconds thereafter, show next non-repeating ghost trail hint
    this.ghostHintInterval = setInterval(() => {
      emitNextGhostHint();
    }, 30000);
  }

  public setRaceSpeed(speed: 1 | 2 | 4): void {
    this.io.to(this.code).emit('room:race_speed_updated', { speed });
  }

  public submitWord(playerId: string, word: string, path: Coordinate[]): { valid: boolean; word: string; reason?: string; letterCount?: number } {
    if (this.status !== 'PLAYING' || !this.board) {
      return { valid: false, word, reason: 'Round is not currently active' };
    }

    const player = this.players.get(playerId);
    if (!player) {
      return { valid: false, word, reason: 'Player not recognized' };
    }

    const upperWord = word.toUpperCase().trim();

    // 1. Minimum word length check
    if (upperWord.length < this.settings.minWordLength) {
      return { valid: false, word: upperWord, reason: `Word must be at least ${this.settings.minWordLength} letters long` };
    }

    // 2. Duplicate submission check
    const wordSet = this.playerWordSets.get(playerId) || new Set();
    if (wordSet.has(upperWord)) {
      return { valid: false, word: upperWord, reason: 'You already submitted this word!' };
    }

    // 3. Board path validation (ensures 8 directions, continuous, no tile reuse)
    const pathValidation = validateBoardPath(this.board, path, upperWord);
    if (!pathValidation.valid) {
      return { valid: false, word: upperWord, reason: pathValidation.error || 'Invalid board path' };
    }

    // 4. Curated dictionary check
    if (!this.dictionary.hasWord(upperWord)) {
      return { valid: false, word: upperWord, reason: 'Not in curated dictionary' };
    }

    // Valid submission!
    wordSet.add(upperWord);
    this.playerWordSets.set(playerId, wordSet);

    const submission: WordSubmission = {
      word: upperWord,
      path,
      playerId,
      timestamp: Date.now(),
      letterCount: pathValidation.letterLength || upperWord.length,
    };
    this.submissions.push(submission);
    player.foundWordsCount = wordSet.size;

    // Persist submission in DB
    try {
      const db = getDatabase();
      db.prepare(`
        INSERT OR IGNORE INTO word_submissions (id, game_id, user_id, word, letter_count, tile_path, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        `sub-${this.gameId}-${playerId}-${upperWord}`,
        this.gameId!,
        playerId,
        upperWord,
        submission.letterCount,
        JSON.stringify(path),
        submission.timestamp
      );
    } catch (e) {
      console.error('[GameRoom] DB submission insert error:', e);
    }

    // Broadcast feed event to other players without spoiling the word
    this.io.to(this.code).emit('player:feed_event', {
      playerId: player.id,
      username: player.username,
      avatar: player.avatar,
      letterCount: submission.letterCount,
      timestamp: Date.now(),
    });

    // Broadcast live word count update to all players
    this.io.to(this.code).emit('player:word_count_update', {
      playerId: player.id,
      foundWordsCount: player.foundWordsCount,
    });

    return {
      valid: true,
      word: upperWord,
      letterCount: submission.letterCount,
    };
  }

  public endRound(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
    if (this.ghostHintInterval) {
      clearInterval(this.ghostHintInterval);
      this.ghostHintInterval = undefined;
    }
    if (this.firstGhostTimeout) {
      clearTimeout(this.firstGhostTimeout);
      this.firstGhostTimeout = undefined;
    }
    this.currentGhostHint = null;

    if (this.status !== 'PLAYING') return;

    this.status = 'ENDED';
    const now = Date.now();

    console.log(`[GameRoom ${this.code}] Round ended. Calculating results for ${this.players.size} players and ${this.submissions.length} submissions...`);

    const results = calculateRoundResults(
      this.code,
      this.board!,
      this.players,
      this.submissions,
      this.solverResult!,
      this.dictionary,
      this.roundStartTime || now,
      now
    );

    // Update player scores
    for (const pr of results.playerResults) {
      const p = this.players.get(pr.playerId);
      if (p) {
        p.score = pr.totalScore;
      }

      // Persist results in DB
      try {
        const db = getDatabase();
        db.prepare(`
          INSERT OR REPLACE INTO game_results (game_id, user_id, total_score, rank, unique_words_count, shared_words_count, longest_word)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(this.gameId!, pr.playerId, pr.totalScore, pr.rank, pr.uniqueWordsCount, pr.sharedWordsCount, pr.longestWord);

        db.prepare(`
          UPDATE games SET ended_at = ?, status = 'COMPLETED' WHERE id = ?
        `).run(now, this.gameId!);
      } catch (e) {
        console.error('[GameRoom] DB result insert error:', e);
      }
    }

    // Broadcast game results
    this.io.to(this.code).emit('game:ended', { results });
    this.broadcastState();
  }

  public playAgain(): void {
    if (this.status !== 'ENDED') return;
    if (this.ghostHintInterval) {
      clearInterval(this.ghostHintInterval);
      this.ghostHintInterval = undefined;
    }
    if (this.firstGhostTimeout) {
      clearTimeout(this.firstGhostTimeout);
      this.firstGhostTimeout = undefined;
    }
    this.currentGhostHint = null;
    this.hintedWords.clear();
    this.status = 'LOBBY';
    this.board = undefined;
    this.solverResult = undefined;
    this.submissions = [];
    this.playerWordSets.clear();
    for (const player of this.players.values()) {
      player.isReady = false;
      player.score = 0;
      player.foundWordsCount = 0;
    }
    this.broadcastState();
  }

  public broadcastState(): void {
    const remainingMs = this.roundEndTime ? Math.max(0, this.roundEndTime - Date.now()) : 0;
    const remainingSeconds = Math.ceil(remainingMs / 1000);

    const playersRecord: Record<string, Player> = {};
    for (const [id, player] of this.players.entries()) {
      playersRecord[id] = player;
    }

    this.io.to(this.code).emit('room:state', {
      roomCode: this.code,
      hostId: this.hostId,
      players: playersRecord,
      settings: this.settings,
      status: this.status,
      board: this.board,
      remainingSeconds,
      currentGhostHint: this.status === 'PLAYING' ? this.currentGhostHint : null,
    });
  }
}

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private io: Server;
  private dictionary: DictionaryService;

  constructor(io: Server, dictionary: DictionaryService) {
    this.io = io;
    this.dictionary = dictionary;
  }

  public generateRoomCode(): string {
    const prefixes = ['RUSH', 'WORD', 'PLAY', 'FIND', 'SPELL', 'GAME'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const code = `${prefix}-${num}`;
    return this.rooms.has(code) ? this.generateRoomCode() : code;
  }

  public createRoom(
    username: string,
    avatar?: string,
    color?: string,
    settings?: Partial<RoomSettings>
  ): { room: GameRoom; player: Player } {
    const code = this.generateRoomCode();
    const playerId = `usr-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const randomAvatar = avatar || AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];
    const randomColor = color || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const hostPlayer: Player = {
      id: playerId,
      username: username.trim() || 'Host',
      avatar: randomAvatar,
      color: randomColor,
      isHost: true,
      isReady: true,
      isConnected: true,
      score: 0,
      foundWordsCount: 0,
    };

    const room = new GameRoom(code, hostPlayer, this.io, this.dictionary);
    if (settings) {
      room.updateSettings(settings);
    }
    this.rooms.set(code, room);
    console.log(`[RoomManager] Created room ${code} by ${username}`);
    return { room, player: hostPlayer };
  }

  public getRoom(code: string): GameRoom | undefined {
    return this.rooms.get(code.toUpperCase().trim());
  }

  public joinRoom(
    code: string,
    username: string,
    avatar?: string,
    color?: string
  ): { success: boolean; room?: GameRoom; player?: Player; error?: string } {
    const room = this.getRoom(code);
    if (!room) {
      return { success: false, error: 'Room not found. Please check room code.' };
    }

    if (room.status === 'PLAYING') {
      return { success: false, error: 'A round is currently in progress. Please wait for it to finish.' };
    }

    if (room.players.size >= 8) {
      return { success: false, error: 'Room is full (maximum 8 players).' };
    }

    const playerId = `usr-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const randomAvatar = avatar || AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];
    const randomColor = color || AVATAR_COLORS[room.players.size % AVATAR_COLORS.length];

    const newPlayer: Player = {
      id: playerId,
      username: username.trim() || `Player ${room.players.size + 1}`,
      avatar: randomAvatar,
      color: randomColor,
      isHost: false,
      isReady: false,
      isConnected: true,
      score: 0,
      foundWordsCount: 0,
    };

    room.addPlayer(newPlayer);
    return { success: true, room, player: newPlayer };
  }

  public removeSocketFromAll(socketId: string): void {
    for (const [code, room] of this.rooms.entries()) {
      room.removeSocket(socketId);
      if (room.players.size === 0) {
        console.log(`[RoomManager] Room ${code} is empty, cleaning up.`);
        this.rooms.delete(code);
      }
    }
  }
}
