import React from 'react';
import { FeedItem } from '../hooks/useSocket';
import { Flame, Sparkles, Crown } from 'lucide-react';

interface LiveFeedProps {
  events: FeedItem[];
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ events }) => {
  if (events.length === 0) return null;

  return (
    <div className="flex flex-col items-center space-y-2 w-full max-w-xl mt-2">
      {events.slice(0, 3).map((ev, index) => {
        const isLongWord = ev.letterCount >= 6 && ev.letterCount < 8;
        const isEpicWord = ev.letterCount >= 8;

        return (
          <div
            key={ev.id}
            className={`
              flex items-center space-x-3 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-300
              ${
                isEpicWord
                  ? 'bg-gradient-to-r from-orange-600 via-pink-600 to-purple-700 text-white border-amber-300 ring-4 ring-amber-400/40 scale-105 animate-bounce shadow-orange-500/30'
                  : isLongWord
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white border-orange-300 ring-2 ring-orange-400/40 scale-102 shadow-orange-500/20'
                  : 'bg-white/95 text-slate-800 border-purple-200 shadow-purple-900/5'
              }
              ${index === 0 ? 'opacity-100' : index === 1 ? 'opacity-85' : 'opacity-65'}
            `}
          >
            {isEpicWord ? (
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 fill-amber-300 animate-pulse flex-shrink-0" />
            ) : isLongWord ? (
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 fill-amber-300 animate-pulse flex-shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0" />
            )}

            <div className="text-base sm:text-lg md:text-xl font-boggle font-bold tracking-wide flex items-center flex-wrap gap-1.5">
              <span className={isEpicWord || isLongWord ? 'text-white font-black underline underline-offset-2' : 'text-purple-950 font-black'}>
                {ev.username}
              </span>
              <span className={isEpicWord || isLongWord ? 'text-white/90' : 'text-slate-600'}>
                found a
              </span>
              <span
                className={`px-3 py-0.5 rounded-xl text-base sm:text-lg md:text-xl font-black tracking-wider uppercase shadow-sm ${
                  isEpicWord
                    ? 'bg-amber-400 text-purple-950 ring-2 ring-white/60 animate-pulse'
                    : isLongWord
                    ? 'bg-amber-400 text-orange-950'
                    : 'bg-purple-100 text-purple-900 border border-purple-200'
                }`}
              >
                {ev.letterCount}-LETTER
              </span>
              <span className={isEpicWord || isLongWord ? 'text-white/90' : 'text-slate-600'}>
                word!
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
