"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_1 = require("./database/db");
const dictionary_service_1 = require("./dictionary/dictionary-service");
const room_manager_1 = require("./rooms/room-manager");
const socket_handler_1 = require("./websocket/socket-handler");
const routes_1 = require("./api/routes");
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
async function bootstrap() {
    console.log('==================================================');
    console.log('    WORD RUSH / MULTIPLAYER BOGGLE SERVER         ');
    console.log('==================================================');
    // 1. Initialize SQLite Database
    (0, db_1.initDatabase)();
    // 2. Initialize Curated Dictionary
    const dictionary = dictionary_service_1.DictionaryService.getInstance();
    // 3. Setup Express App
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({ origin: '*' }));
    app.use(express_1.default.json());
    const server = http_1.default.createServer(app);
    // 4. Setup Socket.IO
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
        pingInterval: 10000,
        pingTimeout: 5000,
    });
    // 5. Setup Room Manager & WebSockets
    const roomManager = new room_manager_1.RoomManager(io, dictionary);
    (0, socket_handler_1.setupSocketHandlers)(io, roomManager);
    // 6. Setup REST API
    app.use('/api', (0, routes_1.createApiRouter)(roomManager, dictionary));
    // 7. Serve Frontend Production Build if present
    const frontendDist = path_1.default.resolve(__dirname, '..', '..', 'frontend', 'dist');
    if (fs_1.default.existsSync(frontendDist)) {
        console.log(`[Server] Serving static frontend build from ${frontendDist}`);
        app.use(express_1.default.static(frontendDist));
        app.get('*', (req, res, next) => {
            if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
                return next();
            }
            res.sendFile(path_1.default.join(frontendDist, 'index.html'));
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
