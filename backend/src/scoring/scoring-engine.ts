import { Board, BoardWordInfo, Player, PlayerRoundResult, RoundResults, WordScoreDetail, WordSubmission } from '../../../shared/types/game';
import { calculateWordScore } from '../../../shared/validation/scoring';
import { SolverResult } from '../../../shared/solver/board-solver';
import { DictionaryService } from '../dictionary/dictionary-service';

export function calculateRoundResults(
  roomCode: string,
  board: Board,
  playersMap: Map<string, Player>,
  submissions: WordSubmission[],
  solverResult: SolverResult,
  dictionaryService: DictionaryService,
  startedAt: number,
  endedAt: number
): RoundResults {
  const players = Array.from(playersMap.values());
  const totalPlayers = Math.max(players.length, 1);

  // Group submissions by word -> Set of playerIds
  const wordFinders = new Map<string, Set<string>>();
  for (const sub of submissions) {
    const w = sub.word.toUpperCase();
    if (!wordFinders.has(w)) {
      wordFinders.set(w, new Set());
    }
    wordFinders.get(w)!.add(sub.playerId);
  }

  // Calculate score detail for each found word
  const wordDetailsMap = new Map<string, WordScoreDetail>();
  for (const [word, findersSet] of wordFinders.entries()) {
    const finders = Array.from(findersSet);
    const k = finders.length;
    const l = word.length; // letter length
    const points = calculateWordScore(l, totalPlayers, k);
    const meta = dictionaryService.getMetadata(word);
    const wordPath = solverResult.words.get(word) || submissions.find(s => s.word.toUpperCase() === word)?.path;

    wordDetailsMap.set(word, {
      word,
      letterCount: l,
      finders,
      findersCount: k,
      pointsPerFinder: points,
      isUnique: k === 1,
      isAll: k === totalPlayers,
      definition: meta?.def || undefined,
      tier: meta?.tier || undefined,
      path: wordPath,
    });
  }

  // Calculate result for each player
  const playerResults: PlayerRoundResult[] = [];

  for (const player of players) {
    const playerSubmissions = submissions.filter(s => s.playerId === player.id);
    const playerWords = Array.from(new Set(playerSubmissions.map(s => s.word.toUpperCase())));

    let totalScore = 0;
    let uniqueWordsCount = 0;
    let sharedWordsCount = 0;
    let longestWord = '';
    const details: WordScoreDetail[] = [];

    for (const w of playerWords) {
      const detail = wordDetailsMap.get(w);
      if (detail) {
        totalScore += detail.pointsPerFinder;
        if (detail.isUnique) {
          uniqueWordsCount++;
        } else {
          sharedWordsCount++;
        }
        if (w.length > longestWord.length) {
          longestWord = w;
        }
        details.push(detail);
      }
    }

    // Sort player's word details by points descending, then length descending
    details.sort((a, b) => b.pointsPerFinder - a.pointsPerFinder || b.letterCount - a.letterCount);

    playerResults.push({
      playerId: player.id,
      username: player.username,
      avatar: player.avatar,
      color: player.color,
      totalScore,
      wordsFound: playerWords.length,
      uniqueWordsCount,
      sharedWordsCount,
      longestWord,
      wordDetails: details,
      rank: 1, // Will be assigned below
    });
  }

  // Sort players by totalScore descending (tiebreak: wordsFound, longestWord length)
  playerResults.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.wordsFound !== a.wordsFound) return b.wordsFound - a.wordsFound;
    return b.longestWord.length - a.longestWord.length;
  });

  // Assign ranks
  for (let i = 0; i < playerResults.length; i++) {
    playerResults[i].rank = i + 1;
  }

  // Build all board words info for the reveal explorer
  const allBoardWords: BoardWordInfo[] = [];
  const playerById = new Map(players.map(p => [p.id, p]));

  for (const [w] of solverResult.words.entries()) {
    const findersSet = wordFinders.get(w);
    const finderNames = findersSet
      ? Array.from(findersSet).map(id => playerById.get(id)?.username || 'Unknown')
      : [];
    const meta = dictionaryService.getMetadata(w);

    allBoardWords.push({
      word: w,
      length: w.length,
      finders: finderNames,
      def: meta?.def,
      tier: meta?.tier,
      path: solverResult.words.get(w),
    });
  }

  // Sort board words: longest words first, then alphabetically
  allBoardWords.sort((a, b) => b.length - a.length || a.word.localeCompare(b.word));

  return {
    roomCode,
    board,
    totalPossibleWords: solverResult.stats.totalWords,
    allBoardWords,
    playerResults,
    startedAt,
    endedAt,
  };
}
