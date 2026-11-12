# Word Rush — Multiplayer Boggle Online Game

A modern, colorful, real-time multiplayer word game inspired by Boggle and Wordament. Built with **React**, **TypeScript**, **Node.js**, **Socket.IO**, and **SQLite**, powered by an **intelligent letter-combination board generator** and a **curated English academic vocabulary dictionary**.

---

## 🌟 Key Highlights & Features

1. **Configurable Grid Dimensions**:
   - Play on **4×4 (16 tiles)**, **5×5 (25 tiles)**, **6×6 (36 tiles)**, **7×7 (49 tiles)**, or **8×8 (64 tiles)** boards.
   - Dynamic, responsive grid layout that adapts to desktops, tablets, and smartphones.

2. **Adjustable Round Timers**:
   - Customizable round durations from **3 minutes to 10 minutes** (with a quick 1-minute test mode available in lobby settings).
   - Server-authoritative timer synchronized via WebSockets with real-time audio and visual tension cues.

3. **8-Direction Swiping Mechanics**:
   - Construct words by dragging/swiping through adjacent tiles: **Up, Down, Left, Right, and all 4 Diagonals** (↖, ↑, ↗, ←, →, ↙, ↓, ↘).
   - Dynamic Glowing SVG connection trail that follows your finger or cursor in real-time.
   - Smart backtracking: swipe backward to undo the last tile!
   - Tile reuse prevention (each tile can only be visited once per word).
   - Instant client-side Trie lookup: provides sub-millisecond feedback on whether the current path forms a valid word or prefix.

4. **"QU" Tile Support**:
   - Occupies a single cell on the board, but represents two letters (**QU**).
   - Properly contributes two letters to word length and scoring (e.g. `QUIET`, `QUEEN`, `QUICK`).

5. **Intelligent English Board Generator & Automated Solver**:
   - Does **not** generate frustrating random letters.
   - Seeds common English n-grams and word groups directly into connected grid paths:
     - Bigrams & Vowel groups: `TH`, `HE`, `IN`, `ER`, `AN`, `EA`, `OU`, `AI`, `IE`, `OO`, etc.
     - Trigrams & Affixes: `ENT`, `EAS`, `ANT`, `AIN`, `ING`, `TION`, `CON`, `DIS`, `PRE`, etc.
   - Fills remaining tiles with weighted English letter distributions and maintains healthy vowel ratios (30–45%).
   - Integrated Trie-based DFS solver measures candidate boards against target word densities before publishing.

6. **Curated English Vocabulary (IELTS 8.0–9.0 & Educated English)**:
   - Whitelist of **43,326 curated English words** (3 to 16 letters) derived from English frequency corpora, Academic Word Lists (AWL), and Webster's dictionary.
   - Contains rich vocabulary: `HOUSE`, `JOURNEY`, `AMBIGUOUS`, `RESILIENT`, `METICULOUS`, `HYPOTHESIS`, `PARADIGM`, `EMPIRICAL`, `MELANCHOLY`, `ELOQUENT`, `SERENITY`, `STRATEGY`.
   - **Strictly excludes Scrabble junk and obscure non-words**: words like `BAIYUN`, `BIONDI`, `DEVENS`, `DITTON`, `DITTOS`, `EMCEED`, `LOTTOS` are explicitly blacklisted.
   - Word definitions and tier levels (A = Everyday, B = Intermediate, C = Advanced/Academic) viewable in the post-game learning explorer.

7. **Multiplayer Rarity Scoring System**:
   - Designed to reward finding words that other players missed!
   - Generalized Formula:
     $$\text{Score} = \lfloor L \times \frac{N}{K} \rfloor$$
     - $N$ = total players in round.
     - $K$ = distinct players who discovered this word.
     - $L$ = letters in word ($QU$ tile counts as 2 letters).
   - **Unique word bonus**: If only 1 player found a word ($K=1$), it earns **$N \times L$ points**!
   - **Shared word**: If all players found a word ($K=N$), it earns **$1 \times L$ points**.

8. **Juicy & Playful Aesthetics**:
   - Modern pastel & candy palette: *Sunshine*, *Coral*, *Mint*, *Sky*, *Lavender*, and *Cream*.
   - Synthesized Web Audio API sound effects (marimba pop with ascending pitch per letter, sparkling chimes on success, gentle buzz on duplicate).
   - Confetti bursts on round completion with victory podium and detailed word breakdowns.

---

## 📁 Project Architecture

```
Boggle/
├── backend/
│   ├── src/
│   │   ├── server.ts               # Express HTTP + Socket.IO server + static bundle host
│   │   ├── database/db.ts          # Native SQLite persistence (rooms, games, submissions)
│   │   ├── dictionary/             # Dictionary service & Trie loader
│   │   ├── rooms/room-manager.ts   # Room lifecycle, player sessions, timer ticker
│   │   ├── scoring/scoring-engine.ts # Multiplayer rarity calculation engine
│   │   ├── websocket/socket-handler.ts # Real-time event dispatchers
│   │   └── api/routes.ts           # REST API endpoints (/api/health, /api/dictionary)
│   ├── test_multiplayer.ts         # Automated 2-player simulation test
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/             # Board, Tile, SwipeTrail, Header, Lobby, ResultsModal
│   │   ├── hooks/                  # useSocket, useSwipe, useDictionary
│   │   ├── audio/sound.ts          # Web Audio synthesized sound generator
│   │   ├── App.tsx                 # Main application view & routing
│   │   └── main.tsx
│   ├── dist/                       # Production frontend bundle
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── shared/
│   ├── types/game.ts               # TypeScript data models (Board, Player, Results)
│   ├── types/events.ts             # Socket.IO type-safe client/server events
│   ├── constants/letters.ts        # Letter weights and avatar palettes
│   ├── constants/ngrams.ts         # Common English bigrams/trigrams
│   ├── constants/config.ts         # Grid configurations & word density targets
│   ├── solver/trie.ts              # High-performance Trie implementation
│   ├── solver/board-solver.ts      # Automated DFS board solver
│   ├── solver/board-generator.ts   # Intelligent connected n-gram board generator
│   └── validation/path-validator.ts# 8-direction path and bounds validation
│
├── dictionary/
│   ├── words.json                  # 43,326 curated uppercase English words
│   ├── exclusions.json             # Explicit blacklist of obscure/junk words
│   ├── metadata.json               # Word tiers, lengths, frequency ranks, definitions
│   └── build_dictionary.py         # Curation and generation script
│
├── nginx/
│   └── default.conf                # Reverse proxy config with WebSocket upgrade & SSL
│
├── test_solver.ts                  # Engine verification across 4x4 to 8x8 boards
├── docker-compose.yml              # Production container orchestration
├── Dockerfile                      # Multi-stage production build
├── .env.example
├── package.json                    # Root workspace runner
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: v20 or v24+
- **Python**: 3.10+ (optional, for dictionary rebuilding)

### 1. Run the Game Server Directly
From the root directory:
```bash
npm start
```
The server will start listening on **`http://localhost:3000`** (and `http://0.0.0.0:3000`). It automatically hosts both the backend WebSockets, REST APIs, and the built static frontend application!

Open your browser at:
```
http://localhost:3000
```

### 2. Run with Live Hot-Reloading (Frontend + Backend Development)
If you want to modify React frontend code with instant Vite HMR:
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```
Open **`http://localhost:5173`**. Vite will proxy API and WebSocket connections to `localhost:3000`.

---

## 🌐 Hosting & Exposing to External Players

### Option A: Local Network / Wi-Fi Access (Zero Tools Needed)
Since the server binds to `0.0.0.0:3000`, any computer, phone, or tablet connected to your local network / Wi-Fi can play directly:
1. Find your local IP address:
   - On Windows: Run `ipconfig` (e.g. `192.168.1.50`).
2. Have your friends open on their phone or laptop:
   ```
   http://192.168.1.50:3000
   ```
3. Share the room code or click the **"Copy Invite Link"** button in the lobby!

### Option B: Reverse Proxy with Nginx
An optimized Nginx configuration is provided in `nginx/default.conf`.
It enables:
- WebSocket upgrade proxying (`Upgrade $http_upgrade`, `Connection "upgrade"`).
- Gzip compression for static assets and dictionary payloads.
- Security headers and low-latency socket timeouts.

To deploy with Nginx:
```nginx
# Include nginx/default.conf in your /etc/nginx/sites-available/
# Point proxy_pass to http://127.0.0.1:3000
sudo nginx -t && sudo systemctl reload nginx
```

### Option C: Instant Public Access via Cloudflare Tunnel or ngrok
If you want to invite friends over the internet without configuring router port-forwarding:

**Using Cloudflare Tunnel (Free, fast, SSL included):**
```bash
cloudflared tunnel --url http://localhost:3000
```
This gives you an instant `https://*.trycloudflare.com` URL that anyone can join from anywhere with low latency!

**Using ngrok:**
```bash
ngrok http 3000
```

### Option D: Docker Compose Deployment
To run containerized in Docker:
```bash
docker compose up --build -d
```
This starts both the Node application container and the Nginx reverse proxy on port 80/443.

---

## 🧪 Automated Testing Suite

To verify all game mechanics, dictionary validity, board generation across all 5 grid sizes, 8-directional swipe validation, and multiplayer scoring:

```bash
npm run test
```

This runs:
1. `test:solver`:
   - Validates that high-level vocabulary words (`RESILIENT`, `METICULOUS`, `HYPOTHESIS`) are accepted.
   - Validates that obscure non-words (`BAIYUN`, `BIONDI`, `DEVENS`, `LOTTOS`) are rejected.
   - Generates boards for 4×4, 5×5, 6×6, 7×7, and 8×8 grids and verifies word targets.
   - Tests 8-directional movement, diagonal adjacency, jump rejection, and `QU` 2-letter calculation.
   - Verifies scoring rarity arithmetic.
2. `test:multiplayer`:
   - Simulates two live players (Alice and Bob) connecting via real WebSockets.
   - Creates a room, joins, synchronizes board generation.
   - Submits unique words and shared words.
   - Verifies authoritative server scoring: unique words receive $N \times L$ points, shared words receive $1 \times L$ points.

---

## 📖 Updating the Dictionary & Exclusions

The game dictionary is stored in `dictionary/`:
- **`dictionary/words.json`**: The whitelist of all accepted words in uppercase.
- **`dictionary/exclusions.json`**: The list of blacklisted non-words and obscure abbreviations.
- **`dictionary/metadata.json`**: Definitions and vocabulary tier ranks.

To add custom words or edit exclusions, edit `dictionary/build_dictionary.py` and run:
```bash
python dictionary/build_dictionary.py
```
Restart the server to load the updated dictionary snapshot into memory.

---

## 📜 License
MIT License. Built for word enthusiasts who love genuine English vocabulary!
