import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/room-manager';
import { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types/events';

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomManager: RoomManager
) {
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Create a new room
    socket.on('room:create', ({ username, avatar, color, settings }, callback) => {
      try {
        const { room, player } = roomManager.createRoom(username, avatar, color, settings);
        room.bindSocket(socket, player.id);
        room.broadcastState();

        if (typeof callback === 'function') {
          callback({ success: true, roomCode: room.code, playerId: player.id });
        }
      } catch (err: any) {
        console.error('[Socket] room:create error:', err);
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message || 'Failed to create room' });
        }
      }
    });

    // Join an existing room
    socket.on('room:join', ({ roomCode, username, avatar, color }, callback) => {
      try {
        const res = roomManager.joinRoom(roomCode, username, avatar, color);
        if (!res.success || !res.room || !res.player) {
          if (typeof callback === 'function') {
            callback({ success: false, error: res.error || 'Failed to join room' });
          }
          return;
        }

        res.room.bindSocket(socket, res.player.id);
        res.room.broadcastState();

        if (typeof callback === 'function') {
          callback({ success: true, playerId: res.player.id });
        }
      } catch (err: any) {
        console.error('[Socket] room:join error:', err);
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message || 'Failed to join room' });
        }
      }
    });

    // Update room settings (host only)
    socket.on('room:update_settings', ({ settings }) => {
      for (const room of (socket as any).rooms) {
        const r = roomManager.getRoom(room);
        if (r) {
          const playerId = r.socketToPlayer.get(socket.id);
          if (playerId === r.hostId) {
            r.updateSettings(settings);
          }
          break;
        }
      }
    });

    // Player toggles ready state
    socket.on('player:ready', ({ isReady }) => {
      for (const room of (socket as any).rooms) {
        const r = roomManager.getRoom(room);
        if (r) {
          const playerId = r.socketToPlayer.get(socket.id);
          if (playerId) {
            r.setPlayerReady(playerId, isReady);
          }
          break;
        }
      }
    });

    // Player updates avatar or color
    socket.on('player:update_profile', ({ avatar, color }) => {
      for (const room of (socket as any).rooms) {
        const r = roomManager.getRoom(room);
        if (r) {
          const playerId = r.socketToPlayer.get(socket.id);
          if (playerId) {
            r.updatePlayerProfile(playerId, avatar, color);
          }
          break;
        }
      }
    });

    // Start game (host only)
    socket.on('game:start', () => {
      for (const room of (socket as any).rooms) {
        const r = roomManager.getRoom(room);
        if (r) {
          const playerId = r.socketToPlayer.get(socket.id);
          if (playerId === r.hostId) {
            r.startGame();
          }
          break;
        }
      }
    });

    // Submit word
    socket.on('word:submit', ({ word, path }, callback) => {
      for (const room of (socket as any).rooms) {
        const r = roomManager.getRoom(room);
        if (r) {
          const playerId = r.socketToPlayer.get(socket.id);
          if (playerId) {
            const res = r.submitWord(playerId, word, path);
            if (typeof callback === 'function') {
              callback(res);
            }
          }
          break;
        }
      }
    });

    // Host triggers play again
    socket.on('game:play_again', () => {
      for (const room of (socket as any).rooms) {
        const r = roomManager.getRoom(room);
        if (r) {
          const playerId = r.socketToPlayer.get(socket.id);
          if (playerId === r.hostId) {
            r.playAgain();
          }
          break;
        }
      }
    });

    // Reconnection
    socket.on('player:reconnect', ({ roomCode, playerId }, callback) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) {
        if (typeof callback === 'function') callback({ success: false, error: 'Room not found' });
        return;
      }

      const player = room.players.get(playerId);
      if (!player) {
        if (typeof callback === 'function') callback({ success: false, error: 'Player session expired' });
        return;
      }

      room.bindSocket(socket, playerId);
      room.broadcastState();
      if (typeof callback === 'function') callback({ success: true });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      roomManager.removeSocketFromAll(socket.id);
    });
  });
}
