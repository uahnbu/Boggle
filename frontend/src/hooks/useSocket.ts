import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Board, Coordinate, Player, RoomSettings, RoomStatus, RoundResults } from '@shared/types/game';
import { ClientToServerEvents, ServerToClientEvents } from '@shared/types/events';
import { sound } from '../audio/sound';

export interface FeedItem {
  id: string;
  username: string;
  avatar?: string;
  letterCount: number;
  timestamp: number;
}

export function useSocket() {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(() => localStorage.getItem('word_rush_room') || null);
  const [playerId, setPlayerId] = useState<string | null>(() => localStorage.getItem('word_rush_player_id') || null);
  const [username, setUsername] = useState<string>(() => localStorage.getItem('word_rush_username') || '');

  const [roomStatus, setRoomStatus] = useState<RoomStatus>('LOBBY');
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [hostId, setHostId] = useState<string>('');
  const [settings, setSettings] = useState<RoomSettings>({
    gridSize: 5,
    durationSeconds: 300,
    minWordLength: 3,
  });
  const [board, setBoard] = useState<Board | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [feedEvents, setFeedEvents] = useState<FeedItem[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResults | null>(null);
  const [ghostHint, setGhostHint] = useState<{ wordLength: number; hintLetters: string; path: Coordinate[]; timestamp: number } | null>(null);
  const [raceSpeed, setRaceSpeedState] = useState<1 | 2 | 4>(2);
  const ghostHintTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected to server, id:', socket.id);

      // Attempt session recovery
      const savedRoom = localStorage.getItem('word_rush_room');
      const savedPlayerId = localStorage.getItem('word_rush_player_id');
      if (savedRoom && savedPlayerId) {
        socket.emit('player:reconnect', { roomCode: savedRoom, playerId: savedPlayerId }, (res) => {
          if (!res.success) {
            localStorage.removeItem('word_rush_room');
            setRoomCode(null);
          }
        });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket] Disconnected from server');
    });

    socket.on('room:state', (data) => {
      setRoomCode(data.roomCode);
      setHostId(data.hostId);
      setPlayers(data.players);
      setSettings(data.settings);
      setRoomStatus(data.status);
      if (data.board) setBoard(data.board);
      if (data.remainingSeconds !== undefined) setRemainingSeconds(data.remainingSeconds);
      if (data.currentGhostHint !== undefined) {
        setGhostHint(data.currentGhostHint);
      }
      if (data.status === 'ENDED' || data.status === 'LOBBY') {
        setGhostHint(null);
      }
    });

    socket.on('game:starting', ({ countdown }) => {
      setCountdown(countdown);
      sound.playCountdown(countdown === 1);
    });

    socket.on('game:started', (data) => {
      setCountdown(null);
      setBoard(data.board);
      setRemainingSeconds(data.durationSeconds);
      setRoomStatus('PLAYING');
      setFoundWords([]);
      setFeedEvents([]);
      setRoundResults(null);
      setPlayers((prev) => {
        const next: Record<string, Player> = {};
        for (const [id, p] of Object.entries(prev)) {
          next[id] = { ...p, foundWordsCount: 0, score: 0 };
        }
        return next;
      });
      sound.playCountdown(true);
    });

    socket.on('game:tick', ({ remainingSeconds }) => {
      setRemainingSeconds(remainingSeconds);
      if (remainingSeconds <= 5 && remainingSeconds > 0) {
        sound.playCountdown(false);
      }
    });

    socket.on('player:feed_event', (event) => {
      // 1. Play unique animal sound for this player's avatar to all connected players
      if (event.avatar) {
        sound.playAnimalSound(event.avatar);
      } else {
        sound.playAnimalSound('🦊');
      }

      // 2. Play unique fanfare when someone gets a 6+ letter word
      if (event.letterCount >= 6) {
        sound.playEpicWordFanfare();
      }

      setFeedEvents((prev) => [
        {
          id: `${event.playerId}-${event.timestamp}-${Math.random()}`,
          username: event.username,
          avatar: event.avatar,
          letterCount: event.letterCount,
          timestamp: event.timestamp,
        },
        ...prev.slice(0, 19),
      ]);
    });

    socket.on('player:word_count_update', ({ playerId, foundWordsCount }) => {
      setPlayers((prev) => {
        if (!prev[playerId]) return prev;
        return {
          ...prev,
          [playerId]: {
            ...prev[playerId],
            foundWordsCount,
          },
        };
      });
    });

    socket.on('game:ended', ({ results }) => {
      setRoomStatus('ENDED');
      setRoundResults(results);
      setGhostHint(null);
    });

    socket.on('game:ghost_hint', (data) => {
      // Keep ghost hint active until replaced by next hint or round ends
      setGhostHint(data);
    });

    socket.on('room:race_speed_updated', ({ speed }) => {
      setRaceSpeedState(speed);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback((name: string, avatar?: string, color?: string, newSettings?: Partial<RoomSettings>) => {
    if (!socketRef.current) return;
    setUsername(name);
    localStorage.setItem('word_rush_username', name);
    if (avatar) localStorage.setItem('word_rush_avatar', avatar);
    if (color) localStorage.setItem('word_rush_color', color);

    socketRef.current.emit('room:create', { username: name, avatar, color, settings: newSettings }, (res) => {
      if (res.success && res.roomCode && res.playerId) {
        setRoomCode(res.roomCode);
        setPlayerId(res.playerId);
        localStorage.setItem('word_rush_room', res.roomCode);
        localStorage.setItem('word_rush_player_id', res.playerId);
      }
    });
  }, []);

  const joinRoom = useCallback((code: string, name: string, avatar?: string, color?: string, callback?: (err?: string) => void) => {
    if (!socketRef.current) return;
    setUsername(name);
    localStorage.setItem('word_rush_username', name);
    if (avatar) localStorage.setItem('word_rush_avatar', avatar);
    if (color) localStorage.setItem('word_rush_color', color);

    socketRef.current.emit('room:join', { roomCode: code.toUpperCase(), username: name, avatar, color }, (res) => {
      if (res.success && res.playerId) {
        setRoomCode(code.toUpperCase());
        setPlayerId(res.playerId);
        localStorage.setItem('word_rush_room', code.toUpperCase());
        localStorage.setItem('word_rush_player_id', res.playerId);
        callback?.();
      } else {
        callback?.(res.error || 'Failed to join room');
      }
    });
  }, []);

  const updateProfile = useCallback((avatar?: string, color?: string) => {
    if (!socketRef.current) return;
    if (avatar) localStorage.setItem('word_rush_avatar', avatar);
    if (color) localStorage.setItem('word_rush_color', color);
    socketRef.current.emit('player:update_profile', { avatar, color });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<RoomSettings>) => {
    socketRef.current?.emit('room:update_settings', { settings: newSettings });
  }, []);

  const toggleReady = useCallback((isReady: boolean) => {
    socketRef.current?.emit('player:ready', { isReady });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit('game:start');
  }, []);

  const submitWord = useCallback((word: string, path: Coordinate[], onFeedback?: (valid: boolean, reason?: string, word?: string) => void) => {
    if (!socketRef.current) return;
    const submittedWord = word.toUpperCase().trim();
    socketRef.current.emit('word:submit', { word: submittedWord, path }, (res) => {
      const finalWord = res.word || submittedWord;
      if (res.valid) {
        sound.playWordAccepted();
        setFoundWords((prev) => (prev.includes(finalWord) ? prev : [finalWord, ...prev]));
        if (playerId) {
          setPlayers((prev) => {
            if (!prev[playerId]) return prev;
            return {
              ...prev,
              [playerId]: {
                ...prev[playerId],
                foundWordsCount: (prev[playerId].foundWordsCount || 0) + 1,
              },
            };
          });
        }
        onFeedback?.(true, undefined, finalWord);
      } else {
        const isDuplicate = res.reason?.toLowerCase().includes('already');
        if (isDuplicate) {
          sound.playWordDuplicate();
        } else {
          sound.playWordRejected();
        }
        onFeedback?.(false, res.reason, finalWord);
      }
    });
  }, [playerId]);

  const playAgain = useCallback(() => {
    socketRef.current?.emit('game:play_again');
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('room:leave');
    localStorage.removeItem('word_rush_room');
    setRoomCode(null);
    setBoard(null);
    setRoomStatus('LOBBY');
    setFoundWords([]);
    setRoundResults(null);
    setGhostHint(null);
  }, []);

  const setRaceSpeed = useCallback((speed: 1 | 2 | 4) => {
    setRaceSpeedState(speed);
    socketRef.current?.emit('room:set_race_speed', { speed });
  }, []);

  const isHost = playerId ? hostId === playerId : false;
  const myPlayer = playerId ? players[playerId] : undefined;

  return {
    isConnected,
    roomCode,
    playerId,
    username,
    isHost,
    myPlayer,
    roomStatus,
    players,
    settings,
    board,
    remainingSeconds,
    countdown,
    foundWords,
    feedEvents,
    roundResults,
    ghostHint,
    raceSpeed,
    setRaceSpeed,
    createRoom,
    joinRoom,
    updateProfile,
    updateSettings,
    toggleReady,
    startGame,
    submitWord,
    playAgain,
    leaveRoom,
  };
}
