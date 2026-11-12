import React from 'react';
import { CheckCircle2, AlertCircle, Sparkles, BookA, RotateCcw, XCircle } from 'lucide-react';

export interface LastPlayedWordInfo {
  word: string;
  valid: boolean;
  reason?: string;
  timestamp: number;
}

interface WordPreviewProps {
  currentWord: string;
  isValidWord: boolean;
  isValidPrefix: boolean;
  minWordLength: number;
  totalPlayers: number;
  lastPlayedWord?: LastPlayedWordInfo | null;
}

export const WordPreview: React.FC<WordPreviewProps> = ({
  currentWord,
  isValidWord,
  isValidPrefix,
  minWordLength,
  totalPlayers,
  lastPlayedWord,
}) => {
  // If not actively swiping, show last played word result + min length badge
  if (!currentWord) {
    const isDuplicate = lastPlayedWord?.reason?.toLowerCase().includes('already');

    return (
      <div className="h-16 flex items-center justify-between px-4 sm:px-5 bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-purple-100 mx-auto w-full max-w-lg transition-all">
        {lastPlayedWord ? (
          <div className="flex items-center space-x-2 animate-fadeIn overflow-hidden">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Last:
            </span>
            <span className="font-boggle font-black text-lg sm:text-xl text-purple-950 tracking-wider truncate">
              {lastPlayedWord.word}
            </span>

            {lastPlayedWord.valid ? (
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Accepted!</span>
              </span>
            ) : isDuplicate ? (
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Already found!</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span className="truncate max-w-[130px] sm:max-w-none">
                  {lastPlayedWord.reason || 'Invalid word'}
                </span>
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-500 font-bold text-xs sm:text-sm tracking-wide">
            Swipe in 8 directions across letters
          </span>
        )}

        <div className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-orange-100 to-purple-100 text-purple-950 border border-purple-200 rounded-full text-xs font-black shadow-sm flex-shrink-0 ml-2">
          <BookA className="w-3.5 h-3.5 text-orange-500" />
          <span>Min {minWordLength}L</span>
        </div>
      </div>
    );
  }

  const length = currentWord.length;
  const isTooShort = length < minWordLength;

  const minPoints = length; // if everyone finds it
  const maxPoints = length * Math.max(totalPlayers, 1); // if only you find it

  return (
    <div className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-purple-100 mx-auto w-full max-w-lg transition-all">
      {/* Formed Word String & Minimum Indicator */}
      <div className="flex items-center space-x-2">
        <span className="font-boggle font-black text-2xl sm:text-3xl tracking-wider bg-gradient-to-r from-orange-600 via-pink-600 to-purple-700 bg-clip-text text-transparent">
          {currentWord}
        </span>
        <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-purple-100 text-purple-900 border border-purple-200">
          {length}L
        </span>
        <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-50 text-orange-700 border border-orange-200">
          min {minWordLength}
        </span>
      </div>

      {/* Validation status badge */}
      <div className="flex items-center space-x-2">
        {isValidWord && (
          <div className="flex items-center space-x-1.5 px-3.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-black shadow-sm animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Valid ({minPoints}–{maxPoints} pts)</span>
          </div>
        )}

        {!isValidWord && isValidPrefix && !isTooShort && (
          <div className="flex items-center space-x-1 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-extrabold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Keep swiping...</span>
          </div>
        )}

        {isTooShort && (
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-orange-100 text-orange-900 border border-orange-300 rounded-full text-xs font-black">
            <BookA className="w-3.5 h-3.5 text-orange-600" />
            <span>Need {minWordLength}+ letters</span>
          </div>
        )}

        {!isValidWord && !isValidPrefix && !isTooShort && (
          <div className="flex items-center space-x-1 px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Not in dictionary</span>
          </div>
        )}
      </div>
    </div>
  );
};
