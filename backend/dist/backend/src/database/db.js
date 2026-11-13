"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
exports.getDatabase = getDatabase;
const node_sqlite_1 = require("node:sqlite");
const path_1 = __importDefault(require("path"));
// Database instance
let db;
function initDatabase(dbPath) {
    if (db)
        return db;
    const defaultPath = path_1.default.resolve(process.cwd(), 'game_data.sqlite');
    const filePath = dbPath || defaultPath;
    console.log(`[Database] Initializing SQLite database at: ${filePath}`);
    db = new node_sqlite_1.DatabaseSync(filePath);
    // Enable WAL mode for high concurrency & performance
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
    // Create core schema based on GDD Section 11
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      avatar TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      room_code TEXT UNIQUE NOT NULL,
      host_user_id TEXT NOT NULL,
      grid_size INTEGER NOT NULL,
      duration_seconds INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      board_data TEXT NOT NULL,
      dictionary_version TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      status TEXT NOT NULL,
      FOREIGN KEY(room_id) REFERENCES rooms(id)
    );

    CREATE TABLE IF NOT EXISTS game_players (
      game_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      joined_at INTEGER NOT NULL,
      PRIMARY KEY(game_id, user_id),
      FOREIGN KEY(game_id) REFERENCES games(id)
    );

    CREATE TABLE IF NOT EXISTS word_submissions (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      word TEXT NOT NULL,
      letter_count INTEGER NOT NULL,
      tile_path TEXT NOT NULL,
      submitted_at INTEGER NOT NULL,
      UNIQUE(game_id, user_id, word),
      FOREIGN KEY(game_id) REFERENCES games(id)
    );

    CREATE TABLE IF NOT EXISTS game_results (
      game_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      total_score INTEGER NOT NULL,
      rank INTEGER NOT NULL,
      unique_words_count INTEGER NOT NULL,
      shared_words_count INTEGER NOT NULL,
      longest_word TEXT,
      PRIMARY KEY(game_id, user_id),
      FOREIGN KEY(game_id) REFERENCES games(id)
    );
  `);
    console.log('[Database] Schema migrations applied successfully.');
    return db;
}
function getDatabase() {
    if (!db) {
        return initDatabase();
    }
    return db;
}
