import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RoomManager } from './src/rooms/room-manager';
import { DictionaryService } from './src/dictionary/dictionary-service';
import { setupSocketHandlers } from './src/websocket/socket-handler';
import { initDatabase } from './src/database/db';
import { Board, RoundResults } from '../shared/types/game';

async function runMultiplayerTest() {
  console.log('--- STARTING MULTIPLAYER INTEGRATION TEST ---');

  // 1. Initialize Test DB and Server
  initDatabase(':memory:');
  const dict = DictionaryService.getInstance();
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  const roomManager = new RoomManager(io, dict);
  setupSocketHandlers(io, roomManager);

  await new Promise<void>((resolve) => server.listen(3099, '127.0.0.1', () => resolve()));
  console.log('1. Test server listening on http://127.0.0.1:3099');

  // 2. Connect Alice
  const aliceSocket: ClientSocketType = ClientSocket('http://127.0.0.1:3099', { transports: ['websocket'] });
  await new Promise<void>((resolve) => aliceSocket.on('connect', () => resolve()));
  console.log('2. Alice connected to server');

  // 3. Alice creates room
  let roomCode = '';
  let aliceId = '';
  await new Promise<void>((resolve) => {
    aliceSocket.emit('room:create', { username: 'Alice', settings: { gridSize: 5, durationSeconds: 60, minWordLength: 3 } }, (res: any) => {
      roomCode = res.roomCode;
      aliceId = res.playerId;
      console.log(`3. Alice created room: ${roomCode}`);
      resolve();
    });
  });

  // 4. Connect Bob
  const bobSocket: ClientSocketType = ClientSocket('http://127.0.0.1:3099', { transports: ['websocket'] });
  await new Promise<void>((resolve) => bobSocket.on('connect', () => resolve()));
  console.log('4. Bob connected to server');

  // 5. Bob joins room
  let bobId = '';
  await new Promise<void>((resolve) => {
    bobSocket.emit('room:join', { roomCode, username: 'Bob' }, (res: any) => {
      bobId = res.playerId;
      console.log(`5. Bob joined room: ${roomCode}`);
      resolve();
    });
  });

  // 6. Alice starts the game
  const room = roomManager.getRoom(roomCode)!;
  let aliceBoard: Board | null = null;
  let bobBoard: Board | null = null;

  const gameStartedPromise = Promise.all([
    new Promise<void>((resolve) => {
      aliceSocket.on('game:started', (data: any) => {
        aliceBoard = data.board;
        resolve();
      });
    }),
    new Promise<void>((resolve) => {
      bobSocket.on('game:started', (data: any) => {
        bobBoard = data.board;
        resolve();
      });
    }),
  ]);

  console.log('6. Alice triggering game start...');
  aliceSocket.emit('game:start');

  await gameStartedPromise;
  console.log('7. Both players received synchronized game:started event');

  // Check boards match
  const boardMatch = JSON.stringify(aliceBoard) === JSON.stringify(bobBoard);
  console.log(`   Board synchronization check: ${boardMatch ? 'PERFECT MATCH ✓' : 'FAILED ✗'}`);

  // 8. Find valid words on the board from room.solverResult
  const solverWords = Array.from(room.solverResult!.words.entries());
  console.log(`   Total valid words on board: ${solverWords.length}`);
  if (solverWords.length < 3) {
    throw new Error('Not enough words on generated board for testing');
  }

  const [wordA, pathA] = solverWords[0]; // Alice unique word
  const [wordB, pathB] = solverWords[1]; // Bob unique word
  const [wordShared, pathShared] = solverWords[2]; // Shared word by both

  console.log(`   Word 1 (Alice unique): ${wordA} (${wordA.length} letters)`);
  console.log(`   Word 2 (Bob unique):   ${wordB} (${wordB.length} letters)`);
  console.log(`   Word 3 (Shared by both): ${wordShared} (${wordShared.length} letters)`);

  // Alice submits Word 1
  await new Promise<void>((resolve) => {
    aliceSocket.emit('word:submit', { word: wordA, path: pathA }, (res: any) => {
      console.log(`8. Alice submitted '${wordA}': valid = ${res.valid}`);
      resolve();
    });
  });

  // Bob submits Word 2
  await new Promise<void>((resolve) => {
    bobSocket.emit('word:submit', { word: wordB, path: pathB }, (res: any) => {
      console.log(`9. Bob submitted '${wordB}': valid = ${res.valid}`);
      resolve();
    });
  });

  // Both submit Word 3
  await new Promise<void>((resolve) => {
    aliceSocket.emit('word:submit', { word: wordShared, path: pathShared }, (res: any) => {
      console.log(`10. Alice submitted shared '${wordShared}': valid = ${res.valid}`);
      resolve();
    });
  });

  await new Promise<void>((resolve) => {
    bobSocket.emit('word:submit', { word: wordShared, path: pathShared }, (res: any) => {
      console.log(`11. Bob submitted shared '${wordShared}': valid = ${res.valid}`);
      resolve();
    });
  });

  // 9. End round and inspect results
  const resultsPromise = new Promise<RoundResults>((resolve) => {
    aliceSocket.on('game:ended', ({ results }: any) => {
      resolve(results);
    });
  });

  console.log('12. Ending round to calculate multiplayer scores...');
  room.endRound();

  const results = await resultsPromise;
  console.log('\n--- MULTIPLAYER RESULTS VERIFICATION ---');
  console.log(`Total players ranked: ${results.playerResults.length}`);

  for (const pr of results.playerResults) {
    console.log(`\nPlayer ${pr.username} (Rank #${pr.rank}):`);
    console.log(`  Total Score: ${pr.totalScore}`);
    console.log(`  Words Found: ${pr.wordsFound}`);
    console.log(`  Unique Words: ${pr.uniqueWordsCount}`);
    console.log(`  Shared Words: ${pr.sharedWordsCount}`);
    for (const wd of pr.wordDetails) {
      console.log(`    - ${wd.word}: ${wd.pointsPerFinder} pts (finders: ${wd.findersCount}, unique=${wd.isUnique}, shared=${wd.isAll})`);
    }
  }

  // Verification checks:
  // N = 2 players
  // WordA: L = len(A), K = 1 -> Score = L * 2 / 1 = 2L
  // WordB: L = len(B), K = 1 -> Score = L * 2 / 1 = 2L
  // WordShared: L = len(Shared), K = 2 -> Score = L * 2 / 2 = 1L
  const aliceRes = results.playerResults.find((p) => p.username === 'Alice')!;
  const bobRes = results.playerResults.find((p) => p.username === 'Bob')!;

  const expectedAliceScore = (wordA.length * 2) + (wordShared.length * 1);
  const expectedBobScore = (wordB.length * 2) + (wordShared.length * 1);

  console.log(`\nAlice Score Check: Actual = ${aliceRes.totalScore}, Expected = ${expectedAliceScore} (${aliceRes.totalScore === expectedAliceScore ? 'MATCH ✓' : 'FAIL ✗'})`);
  console.log(`Bob Score Check:   Actual = ${bobRes.totalScore}, Expected = ${expectedBobScore} (${bobRes.totalScore === expectedBobScore ? 'MATCH ✓' : 'FAIL ✗'})`);

  if (aliceRes.totalScore !== expectedAliceScore || bobRes.totalScore !== expectedBobScore) {
    throw new Error('Scoring verification failed!');
  }

  // Clean up
  aliceSocket.disconnect();
  bobSocket.disconnect();
  server.close();
  console.log('\n--- ALL MULTIPLAYER TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

runMultiplayerTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
