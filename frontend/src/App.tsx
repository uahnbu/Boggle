import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import { useSwipe } from './hooks/useSwipe';
import { useDictionary } from './hooks/useDictionary';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { WordPreview, LastPlayedWordInfo } from './components/WordPreview';
import { PlayerList } from './components/PlayerList';
import { FoundWordsList } from './components/FoundWordsList';
import { LiveFeed } from './components/LiveFeed';
import { RoomLobby } from './components/RoomLobby';
import { ResultsModal } from './components/ResultsModal';
import { WelcomeScreen } from './components/WelcomeScreen';

export const App: React.FC = () => {
  const socket = useSocket();
  const dictionary = useDictionary();
  const [initialRoomParam, setInitialRoomParam] = useState<string | null>(null);
  const [lastPlayedWord, setLastPlayedWord] = useState<LastPlayedWordInfo | null>(null);

  // Check URL query parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setInitialRoomParam(roomParam.toUpperCase());
    }
  }, []);

  // Clear last played word when a new round starts
  useEffect(() => {
    if (socket.roomStatus === 'STARTING' || socket.roomStatus === 'LOBBY') {
      setLastPlayedWord(null);
    }
  }, [socket.roomStatus]);

  const handleWordSubmitted = useCallback(
    (word: string, tilePath: any[]) => {
      socket.submitWord(word, tilePath, (valid, reason, finalWord) => {
        const playedWord = finalWord || word;
        setLastPlayedWord({
          word: playedWord,
          valid,
          reason,
          timestamp: Date.now(),
        });
      });
    },
    [socket]
  );

  // Set up swipe handler
  const {
    path,
    currentWord,
    currentPointer,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useSwipe({
    board: socket.board,
    disabled: socket.roomStatus !== 'PLAYING',
    onSubmit: handleWordSubmitted,
  });

  // Client-side instant feedback
  const isValidWord = dictionary.hasWord(currentWord);
  const isValidPrefix = dictionary.hasPrefix(currentWord);

  // 1. If not in a room, render Welcome / Create / Join screen
  if (!socket.roomCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FF6B00] via-[#FF2E93] to-[#7928CA] flex flex-col justify-center">
        <WelcomeScreen
          onCreateRoom={(username, avatar, color) => socket.createRoom(username, avatar, color)}
          onJoinRoom={(code, username, avatar, color, onError) =>
            socket.joinRoom(code, username, avatar, color, (err) => {
              if (err) onError(err);
            })
          }
          initialRoomCode={initialRoomParam}
        />
      </div>
    );
  }

  const isGameActive = socket.roomStatus === 'PLAYING';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF6B00] via-[#FF2E93] to-[#7928CA] flex flex-col justify-between">
      {/* Top Application Header */}
      <Header
        roomCode={socket.roomCode}
        remainingSeconds={socket.remainingSeconds}
        totalWordsFound={socket.foundWords.length}
        onLeaveRoom={socket.leaveRoom}
        isGameActive={isGameActive}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col justify-center">
        {/* LOBBY / PRE-ROUND SCREEN */}
        {socket.roomStatus === 'LOBBY' || socket.roomStatus === 'STARTING' ? (
          <RoomLobby
            roomCode={socket.roomCode}
            players={socket.players}
            hostId={socket.roomCode}
            currentPlayerId={socket.playerId}
            settings={socket.settings}
            isHost={socket.isHost}
            onUpdateSettings={socket.updateSettings}
            onToggleReady={socket.toggleReady}
            onUpdateProfile={socket.updateProfile}
            onStartGame={socket.startGame}
            countdown={socket.countdown}
          />
        ) : null}

        {/* ACTIVE GAME ROUND SCREEN */}
        {socket.roomStatus === 'PLAYING' && socket.board ? (
          <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
            {/* Center: Word Preview & Responsive Letter Grid */}
            <div className="flex-1 w-full max-w-xl flex flex-col items-center space-y-3">
              {/* Connected Players Status Bar */}
              <PlayerList
                players={socket.players}
                currentPlayerId={socket.playerId}
                myWordsCount={socket.foundWords.length}
              />

              {/* Real-time Word Preview Badge */}
              <WordPreview
                currentWord={currentWord}
                isValidWord={isValidWord}
                isValidPrefix={isValidPrefix}
                minWordLength={socket.settings.minWordLength}
                totalPlayers={Object.keys(socket.players).length}
                lastPlayedWord={lastPlayedWord}
              />

              {/* The Interactive Boggle Grid with 30s Ghost Hint Trail */}
              <Board
                board={socket.board}
                path={path}
                currentPointer={currentPointer}
                ghostHint={socket.ghostHint}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />

              {/* Live Multiplayer Discoveries Toast */}
              <LiveFeed events={socket.feedEvents} />
            </div>

            {/* Right Sidebar: Found Words List */}
            <div className="w-full lg:w-72 xl:w-80">
              <FoundWordsList words={socket.foundWords} />
            </div>
          </div>
        ) : null}

        {/* RESULTS SCREEN (ROUND COMPLETED) */}
        {socket.roomStatus === 'ENDED' && socket.roundResults && (
          <ResultsModal
            results={socket.roundResults}
            currentPlayerId={socket.playerId}
            isHost={socket.isHost}
            raceSpeed={socket.raceSpeed}
            onSetRaceSpeed={socket.setRaceSpeed}
            onPlayAgain={socket.playAgain}
            onLeaveRoom={socket.leaveRoom}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-2.5 text-center text-xs text-white/90 font-medium drop-shadow border-t border-white/20">
        <span>Multiplayer Word Rush • Curated Academic English Dictionary • 8-Direction Bubble Swipe</span>
      </footer>
    </div>
  );
};
