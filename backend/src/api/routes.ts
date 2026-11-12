import { Router } from 'express';
import { RoomManager } from '../rooms/room-manager';
import { DictionaryService } from '../dictionary/dictionary-service';
import { getDatabase } from '../database/db';

export function createApiRouter(roomManager: RoomManager, dictionary: DictionaryService): Router {
  const router = Router();

  // Health check
  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now(),
      dictionaryVersion: dictionary.version,
    });
  });

  // Check room status
  router.get('/rooms/:code', (req, res) => {
    const room = roomManager.getRoom(req.params.code);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    return res.json({
      code: room.code,
      status: room.status,
      playerCount: room.players.size,
      settings: room.settings,
    });
  });

  // Query word metadata & definition
  router.get('/dictionary/word/:word', (req, res) => {
    const word = req.params.word.toUpperCase();
    const meta = dictionary.getMetadata(word);
    const isValid = dictionary.hasWord(word);

    res.json({
      word,
      isValid,
      metadata: meta || null,
    });
  });

  // Serve words array for client-side validation & instant feedback
  router.get('/dictionary/words', (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h
    res.json(dictionary.getWordList());
  });

  // Stats from SQLite database
  router.get('/stats', (req, res) => {
    try {
      const db = getDatabase();
      const roomsCount = db.prepare('SELECT count(*) as count FROM rooms').get() as { count: number };
      const gamesCount = db.prepare('SELECT count(*) as count FROM games').get() as { count: number };
      const subsCount = db.prepare('SELECT count(*) as count FROM word_submissions').get() as { count: number };

      res.json({
        totalRoomsCreated: roomsCount.count,
        totalGamesPlayed: gamesCount.count,
        totalWordsSubmitted: subsCount.count,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
