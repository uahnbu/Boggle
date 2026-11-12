import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './database/db';
import { DictionaryService } from './dictionary/dictionary-service';
import { RoomManager } from './rooms/room-manager';
import { setupSocketHandlers } from './websocket/socket-handler';
import { createApiRouter } from './api/routes';
import { ClientToServerEvents, ServerToClientEvents } from '../../shared/types/events';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  console.log('==================================================');
  console.log('    WORD RUSH / MULTIPLAYER BOGGLE SERVER         ');
  console.log('==================================================');

  // 1. Initialize SQLite Database
  initDatabase();

  // 2. Initialize Curated Dictionary
  const dictionary = DictionaryService.getInstance();

  // 3. Setup Express App
  const app = express();
  app.use(cors({ origin: '*' }));
  app.use(express.json());

  const server = http.createServer(app);

  // 4. Setup Socket.IO
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // 5. Setup Room Manager & WebSockets
  const roomManager = new RoomManager(io, dictionary);
  setupSocketHandlers(io, roomManager);

  // 6. Setup REST API
  app.use('/api', createApiRouter(roomManager, dictionary));

  // 7. Serve Frontend Production Build if present
  const frontendDist = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
  if (fs.existsSync(frontendDist)) {
    console.log(`[Server] Serving static frontend build from ${frontendDist}`);
    app.use(express.static(frontendDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return next();
      }
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  // 8. Start HTTP & WebSocket Server
  server.listen(PORT, HOST, () => {
    console.log(`[Server] Listening on http://${HOST}:${PORT}`);
    console.log(`[Server] Ready for real-time multiplayer connections!`);
  });
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal bootstrap error:', err);
  process.exit(1);
});
