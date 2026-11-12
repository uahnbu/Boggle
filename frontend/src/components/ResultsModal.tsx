import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RoundResults, Coordinate } from '@shared/types/game';
import { Trophy, Medal, RotateCcw, Play, Pause, FastForward, Flag, Users, Eye } from 'lucide-react';
import { sound } from '../audio/sound';
import { BoardPathViewer } from './BoardPathViewer';

interface ResultsModalProps {
  results: RoundResults;
  currentPlayerId: string | null;
  isHost: boolean;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
}

interface RaceStep {
  word: string;
  letterCount: number;
  finderPlayerId: string;
  finderName: string;
  avatar: string;
  color: string;
  points: number;
  isUnique: boolean;
  isAll: boolean;
  findersCount: number;
  path?: Coordinate[];
  definition?: string;
  tier?: string;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  results,
  currentPlayerId,
  isHost,
  onPlayAgain,
  onLeaveRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'race' | 'leaderboard' | 'playerWords' | 'allBoard'>('race');
  const [boardSearch, setBoardSearch] = useState('');
  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState<string>(
    currentPlayerId || results.playerResults[0]?.playerId || ''
  );

  // --- ANIMATED RACE STATE ---
  const [raceStepIndex, setRaceStepIndex] = useState(0);
  const [isPlayingRace, setIsPlayingRace] = useState(true);
  const [raceSpeed, setRaceSpeed] = useState<1 | 2 | 4>(1);
  const [raceScores, setRaceScores] = useState<Record<string, number>>({});
  const [raceWordsCount, setRaceWordsCount] = useState<Record<string, number>>({});
  const [currentRaceEvent, setCurrentRaceEvent] = useState<RaceStep | null>(null);
  const raceTimerRef = useRef<any>(null);
  const hasFiredRaceFinishConfetti = useRef(false);

  // Modal Word Viewer for inspect/board words
  const [selectedWordForViewer, setSelectedWordForViewer] = useState<{
    word: string;
    path?: Coordinate[];
    definition?: string;
    tier?: string;
    points?: number;
    finders?: string[];
    isUnique?: boolean;
  } | null>(null);

  // Compile all word steps in sequential order for the race
  const [raceSteps, setRaceSteps] = useState<RaceStep[]>([]);

  useEffect(() => {
    // Collect all word submissions from all players
    const steps: RaceStep[] = [];
    for (const pr of results.playerResults) {
      for (const w of pr.wordDetails) {
        steps.push({
          word: w.word,
          letterCount: w.letterCount,
          finderPlayerId: pr.playerId,
          finderName: pr.username,
          avatar: pr.avatar,
          color: pr.color,
          points: w.pointsPerFinder,
          isUnique: w.isUnique,
          isAll: w.isAll,
          findersCount: w.findersCount,
          path: w.path,
          definition: w.definition,
          tier: w.tier,
        });
      }
    }

    // SEQUENCE REQUIREMENT:
    // "Show similar words first (words that more people played), then show unique words per person."
    steps.sort((a, b) => {
      const aShared = a.findersCount > 1;
      const bShared = b.findersCount > 1;

      // 1. Shared words come before unique words
      if (aShared && !bShared) return -1;
      if (!aShared && bShared) return 1;

      // 2. Among shared words: higher findersCount first, then alphabetical
      if (aShared && bShared) {
        if (b.findersCount !== a.findersCount) {
          return b.findersCount - a.findersCount;
        }
        return a.word.localeCompare(b.word);
      }

      // 3. Among unique words: sort by points ascending to build dramatic climax
      return a.points - b.points || a.word.localeCompare(b.word);
    });

    setRaceSteps(steps);

    // Initial race scores & word counts at 0
    const initialScores: Record<string, number> = {};
    const initialWords: Record<string, number> = {};
    for (const p of results.playerResults) {
      initialScores[p.playerId] = 0;
      initialWords[p.playerId] = 0;
    }
    setRaceScores(initialScores);
    setRaceWordsCount(initialWords);
    hasFiredRaceFinishConfetti.current = false;

    // Fire gentle initial victory confetti (lightweight, single burst)
    try {
      confetti({
        particleCount: 25,
        spread: 55,
        ticks: 65,
        origin: { y: 0.6 },
        disableForReducedMotion: true,
        colors: ['#FF7A00', '#8B5CF6', '#FFA040', '#A855F7'],
      });
    } catch {}

    return () => {
      try {
        confetti.reset();
      } catch {}
    };
  }, [results]);

  const isRaceFinished = raceStepIndex >= raceSteps.length;

  // Race playback loop with adjustable speed
  useEffect(() => {
    if (!isPlayingRace || raceSteps.length === 0) return;

    if (raceStepIndex >= raceSteps.length) {
      setIsPlayingRace(false);
      if (!hasFiredRaceFinishConfetti.current) {
        hasFiredRaceFinishConfetti.current = true;
        try {
          confetti({
            particleCount: 35,
            spread: 60,
            ticks: 80,
            origin: { y: 0.5 },
            disableForReducedMotion: true,
            colors: ['#FF7A00', '#8B5CF6', '#FFA040', '#A855F7'],
          });
        } catch {}
      }
      return;
    }

    const delay = raceSpeed === 4 ? 140 : raceSpeed === 2 ? 340 : 700;

    raceTimerRef.current = setTimeout(() => {
      const step = raceSteps[raceStepIndex];
      setCurrentRaceEvent(step);

      // Increment score & word count for this player
      setRaceScores((prev) => ({
        ...prev,
        [step.finderPlayerId]: (prev[step.finderPlayerId] || 0) + step.points,
      }));
      setRaceWordsCount((prev) => ({
        ...prev,
        [step.finderPlayerId]: (prev[step.finderPlayerId] || 0) + 1,
      }));

      // Play sound per step
      sound.playTilePop(Math.min(step.letterCount, 7));

      setRaceStepIndex((prev) => prev + 1);
    }, delay);

    return () => {
      if (raceTimerRef.current) clearTimeout(raceTimerRef.current);
    };
  }, [isPlayingRace, raceStepIndex, raceSteps, raceSpeed]);

  const skipRace = () => {
    setIsPlayingRace(false);
    if (raceTimerRef.current) clearTimeout(raceTimerRef.current);
    const finalScores: Record<string, number> = {};
    const finalWords: Record<string, number> = {};
    for (const p of results.playerResults) {
      finalScores[p.playerId] = p.totalScore;
      finalWords[p.playerId] = p.wordsFound;
    }
    setRaceScores(finalScores);
    setRaceWordsCount(finalWords);
    setRaceStepIndex(raceSteps.length);
    setActiveTab('leaderboard');
  };

  const restartRace = () => {
    if (raceTimerRef.current) clearTimeout(raceTimerRef.current);
    hasFiredRaceFinishConfetti.current = false;
    const initialScores: Record<string, number> = {};
    const initialWords: Record<string, number> = {};
    for (const p of results.playerResults) {
      initialScores[p.playerId] = 0;
      initialWords[p.playerId] = 0;
    }
    setRaceScores(initialScores);
    setRaceWordsCount(initialWords);
    setRaceStepIndex(0);
    setCurrentRaceEvent(null);
    setIsPlayingRace(true);
    setActiveTab('race');
  };

  const winner = results.playerResults[0];
  const maxScore = Math.max(...results.playerResults.map((p) => p.totalScore), 1);

  // Selected player for inspecting words
  const inspectedPlayer =
    results.playerResults.find((p) => p.playerId === selectedPlayerFilter) || results.playerResults[0];

  // Filter board words
  const filteredBoardWords = results.allBoardWords.filter((bw) =>
    bw.word.toLowerCase().includes(boardSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-purple-950/50 backdrop-blur-md z-40 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Clicked Word Path Viewer Dialog */}
      {selectedWordForViewer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
          <div className="w-full max-w-sm">
            <BoardPathViewer
              board={results.board}
              path={selectedWordForViewer.path}
              word={selectedWordForViewer.word}
              points={selectedWordForViewer.points}
              definition={selectedWordForViewer.definition}
              tier={selectedWordForViewer.tier}
              finders={selectedWordForViewer.finders}
              isUnique={selectedWordForViewer.isUnique}
              onClose={() => setSelectedWordForViewer(null)}
            />
          </div>
        </div>
      )}

      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-purple-100 w-full max-w-4xl my-auto overflow-hidden flex flex-col max-h-[94vh]">
        {/* Results Header: DO NOT show winner until all words are shown! */}
        <div className="bg-gradient-to-r from-orange-100/70 via-purple-100/60 to-pink-100/50 p-4 sm:p-6 text-center border-b border-purple-100 relative">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-white/90 rounded-full text-xs font-black text-purple-900 border border-purple-200 shadow-sm mb-1.5">
            <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>
              {isRaceFinished
                ? 'Round Completed • Final Standings'
                : `Scoring Race in Progress (${raceStepIndex} / ${raceSteps.length})`}
            </span>
          </div>

          <h2 className="font-boggle font-black text-2xl sm:text-4xl tracking-tight bg-gradient-to-r from-orange-600 via-amber-600 to-purple-700 bg-clip-text text-transparent">
            {isRaceFinished
              ? winner
                ? `🏆 ${winner.username} Wins!`
                : 'Game Over!'
              : '🏁 Who Will Win the Race?'}
          </h2>
          {!isRaceFinished && (
            <p className="text-xs text-purple-800 font-bold mt-1">
              Shared words revealed first, then unique words decide the champion!
            </p>
          )}

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
            <button
              onClick={() => setActiveTab('race')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 ${
                activeTab === 'race'
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md'
                  : 'bg-white/80 text-slate-700 hover:bg-white border border-purple-100'
              }`}
            >
              <Flag className="w-3.5 h-3.5 text-orange-200" />
              <span>🏁 Word Race</span>
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition ${
                activeTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md'
                  : 'bg-white/80 text-slate-700 hover:bg-white border border-purple-100'
              }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('playerWords')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 ${
                activeTab === 'playerWords'
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md'
                  : 'bg-white/80 text-slate-700 hover:bg-white border border-purple-100'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Inspect Players' Words</span>
            </button>
            <button
              onClick={() => setActiveTab('allBoard')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition ${
                activeTab === 'allBoard'
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md'
                  : 'bg-white/80 text-slate-700 hover:bg-white border border-purple-100'
              }`}
            >
              All Board Words ({results.totalPossibleWords})
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
          {/* TAB 1: ANIMATED WORD RACE TRACK WITH BOARD SWIPE MIMIC */}
          {activeTab === 'race' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Current Word Callout Banner & Controls */}
              <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-center sm:text-left min-h-[72px]">
                {currentRaceEvent ? (
                  <div className="flex items-center space-x-3 animate-fadeIn">
                    <span className="text-3xl sm:text-4xl">{currentRaceEvent.avatar}</span>
                    <div>
                      <div className="text-xs font-extrabold text-slate-500">
                        <strong className="text-purple-950">{currentRaceEvent.finderName}</strong> played:
                      </div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-boggle font-black text-2xl sm:text-3xl text-orange-600 tracking-wider">
                          {currentRaceEvent.word}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-gradient-to-r from-orange-100 to-purple-100 text-purple-950 border border-purple-200">
                          +{currentRaceEvent.points} pts
                        </span>
                        {currentRaceEvent.isUnique && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            ⭐ UNIQUE BONUS!
                          </span>
                        )}
                        {!currentRaceEvent.isUnique && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-900">
                            Shared ({currentRaceEvent.findersCount} finders)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-extrabold text-purple-900">
                    {isRaceFinished ? 'Race completed!' : 'Get ready for the word race!'}
                  </div>
                )}

                {/* Race Controls: Play/Pause, Speed 1x/2x/4x, Replay, Skip */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {/* Speed Selector */}
                  <div className="flex items-center space-x-1 bg-white border border-purple-200 rounded-xl p-0.5 shadow-sm">
                    {([1, 2, 4] as const).map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setRaceSpeed(spd)}
                        className={`px-2 py-1 rounded-lg text-xs font-black transition ${
                          raceSpeed === spd
                            ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title={`${spd}x Speed`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setIsPlayingRace(!isPlayingRace)}
                    className="p-2 rounded-xl bg-white border border-purple-200 text-purple-900 hover:bg-purple-50 shadow-sm"
                    title={isPlayingRace ? 'Pause' : 'Play'}
                  >
                    {isPlayingRace ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-purple-900" />}
                  </button>
                  <button
                    onClick={skipRace}
                    className="px-3 py-2 rounded-xl bg-white border border-purple-200 text-xs font-black text-purple-900 hover:bg-purple-50 shadow-sm flex items-center space-x-1"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>Skip</span>
                  </button>
                  <button
                    onClick={restartRace}
                    className="p-2 rounded-xl bg-white border border-purple-200 text-purple-900 hover:bg-purple-50 shadow-sm"
                    title="Replay Race"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Race Layout: Mini Board Swipe Mimic + Player Tracks */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                {/* Left/Center: Player Racing Tracks */}
                <div className="lg:col-span-2 space-y-3">
                  {results.playerResults.map((pr) => {
                    const score = raceScores[pr.playerId] || 0;
                    const wordsCount = raceWordsCount[pr.playerId] || 0;
                    const progressPct = Math.min(100, Math.round((score / maxScore) * 100));
                    const isCurrent = currentRaceEvent?.finderPlayerId === pr.playerId;

                    return (
                      <div
                        key={pr.playerId}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'border-orange-400 bg-orange-50/40 ring-2 ring-orange-400/30 shadow-md scale-[1.01]'
                            : 'border-purple-100 bg-white/90 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{pr.avatar}</span>
                            <span className="text-sm font-extrabold text-slate-800">{pr.username}</span>
                            {pr.playerId === currentPlayerId && (
                              <span className="text-[10px] text-orange-600 font-black uppercase">(You)</span>
                            )}
                          </div>
                          {/* Score and Word Count both displayed and incrementing live */}
                          <div className="flex items-center space-x-2 font-boggle">
                            <span className="font-black text-lg text-slate-900">{score} pts</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-black bg-purple-100 text-purple-950 border border-purple-200">
                              {wordsCount} {wordsCount === 1 ? 'word' : 'words'}
                            </span>
                          </div>
                        </div>

                        {/* Race Track Bar */}
                        <div className="relative w-full h-4 bg-purple-50 rounded-full overflow-hidden border border-purple-200">
                          <div
                            className="h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                            style={{
                              width: `${Math.max(progressPct, 4)}%`,
                              backgroundColor: pr.color || '#FF7A00',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Board Swipe Playback Mimic */}
                <div className="w-full flex flex-col items-center">
                  {currentRaceEvent && (
                    <div className="w-full">
                      <div className="text-xs font-extrabold text-purple-950 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Board Swipe Mimic:</span>
                        <span className="text-orange-600 font-black">{currentRaceEvent.word}</span>
                      </div>
                      <BoardPathViewer
                        board={results.board}
                        path={currentRaceEvent.path}
                        word={currentRaceEvent.word}
                        points={currentRaceEvent.points}
                        definition={currentRaceEvent.definition}
                        isUnique={currentRaceEvent.isUnique}
                        compact
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINAL LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-3">
              {results.playerResults.map((pr) => {
                const isMe = pr.playerId === currentPlayerId;
                const medalColor =
                  pr.rank === 1
                    ? 'text-amber-500 bg-amber-50 border-amber-300'
                    : pr.rank === 2
                    ? 'text-slate-400 bg-slate-50 border-slate-300'
                    : pr.rank === 3
                    ? 'text-amber-700 bg-amber-50/50 border-amber-200'
                    : 'text-purple-600 bg-purple-50 border-purple-100';

                return (
                  <div
                    key={pr.playerId}
                    className={`
                      flex items-center justify-between p-4 rounded-2xl border transition-all
                      ${isMe ? 'border-orange-400 bg-orange-50/20 ring-2 ring-orange-400/20' : 'border-purple-100 bg-white/90 shadow-sm'}
                    `}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-boggle font-black text-lg border ${medalColor}`}>
                        {pr.rank <= 3 ? <Medal className="w-6 h-6" /> : pr.rank}
                      </div>

                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                        style={{ backgroundColor: pr.color || '#FF7A00' }}
                      >
                        {pr.avatar || '🦊'}
                      </div>

                      <div>
                        <div className="font-extrabold text-slate-800 text-base flex items-center space-x-1.5">
                          <span>{pr.username}</span>
                          {isMe && <span className="text-xs text-orange-600 font-black uppercase">(You)</span>}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-bold">{pr.wordsFound} words</span>
                          <span>•</span>
                          <span className="text-orange-600 font-extrabold">{pr.uniqueWordsCount} unique</span>
                          {pr.longestWord && (
                            <>
                              <span>•</span>
                              <span>Longest: <strong>{pr.longestWord}</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-boggle font-black text-2xl text-purple-950">
                        {pr.totalScore}
                      </div>
                      <span className="text-[10px] text-purple-600 uppercase font-black tracking-wider">
                        points
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: SEE WHAT OTHER PLAYERS PLAYED (CLICK WORD TO MIMIC SWIPE ON BOARD) */}
          {activeTab === 'playerWords' && (
            <div className="space-y-4">
              {/* Player Selector Pills */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-purple-100">
                <span className="text-xs font-black text-purple-950 uppercase tracking-wider mr-1">
                  View Player:
                </span>
                {results.playerResults.map((p) => {
                  const isSelected = p.playerId === selectedPlayerFilter;
                  return (
                    <button
                      key={p.playerId}
                      onClick={() => setSelectedPlayerFilter(p.playerId)}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                        isSelected
                          ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md'
                          : 'bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-100'
                      }`}
                    >
                      <span>{p.avatar}</span>
                      <span>{p.username}</span>
                      <span className="opacity-80">({p.wordsFound})</span>
                    </button>
                  );
                })}
              </div>

              {/* Inspected Player Words List */}
              {inspectedPlayer && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-boggle font-black text-base text-purple-950">
                      Words found by {inspectedPlayer.username} (click any word to view swipe path):
                    </h3>
                    <span className="text-xs text-purple-600 font-bold">
                      {inspectedPlayer.wordsFound} words • {inspectedPlayer.uniqueWordsCount} unique
                    </span>
                  </div>

                  {inspectedPlayer.wordDetails.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">
                      {inspectedPlayer.username} did not find any words this round.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
                      {inspectedPlayer.wordDetails.map((w) => (
                        <div
                          key={w.word}
                          onClick={() =>
                            setSelectedWordForViewer({
                              word: w.word,
                              path: w.path,
                              definition: w.definition,
                              tier: w.tier,
                              points: w.pointsPerFinder,
                              finders: [inspectedPlayer.username],
                              isUnique: w.isUnique,
                            })
                          }
                          className="flex items-center justify-between p-3 rounded-2xl border border-purple-100 bg-purple-50/40 hover:bg-white hover:shadow-md cursor-pointer transition group"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-boggle font-black text-base text-purple-950 group-hover:text-orange-600 transition">
                                {w.word}
                              </span>
                              {w.isUnique && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-rose-100 text-rose-800 border border-rose-200">
                                  UNIQUE!
                                </span>
                              )}
                              {w.isAll && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800">
                                  Shared
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 font-medium flex items-center space-x-1 mt-0.5">
                              <span>{w.letterCount} letters • {w.findersCount} finders</span>
                              <Eye className="w-3.5 h-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition" />
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="font-boggle font-black text-lg text-orange-600">
                              +{w.pointsPerFinder}
                            </span>
                            <span className="text-[10px] block text-slate-400 uppercase font-black">pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ALL BOARD WORDS (CLICK ANY WORD TO MIMIC SWIPE ON BOARD) */}
          {activeTab === 'allBoard' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Search and click any word to see its swipe path..."
                  value={boardSearch}
                  onChange={(e) => setBoardSearch(e.target.value)}
                  className="w-full px-4 py-2 text-xs rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                />
                <span className="text-xs text-purple-600 font-black whitespace-nowrap">
                  Showing {filteredBoardWords.length} words
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
                {filteredBoardWords.map((bw) => {
                  const wasFound = bw.finders.length > 0;
                  return (
                    <div
                      key={bw.word}
                      onClick={() =>
                        setSelectedWordForViewer({
                          word: bw.word,
                          path: bw.path,
                          definition: bw.def,
                          tier: bw.tier,
                          finders: bw.finders,
                          isUnique: bw.finders.length === 1,
                        })
                      }
                      className={`
                        p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between group
                        ${
                          wasFound
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold hover:shadow-sm'
                            : 'bg-white/80 border-purple-100 text-slate-700 hover:bg-white hover:shadow-sm'
                        }
                      `}
                    >
                      <div>
                        <div className="font-boggle text-sm font-black tracking-wide group-hover:text-orange-600 transition">
                          {bw.word}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {bw.length} letters
                          {wasFound && (
                            <span className="ml-1 text-emerald-700 font-extrabold">
                              • Found by {bw.finders.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-purple-50/50 border-t border-purple-100 p-4 sm:p-5 flex items-center justify-between">
          <button
            onClick={onLeaveRoom}
            className="px-4 py-2.5 rounded-xl text-xs font-black text-slate-500 hover:bg-purple-100 transition"
          >
            Leave Room
          </button>

          {isHost ? (
            <button
              onClick={onPlayAgain}
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-7 py-3 rounded-2xl font-boggle font-bold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Next Round</span>
            </button>
          ) : (
            <span className="text-xs text-purple-600 font-bold italic">
              Waiting for host to start next round...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
