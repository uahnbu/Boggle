import React from 'react';
import { Player } from '@shared/types/game';
import { Crown, WifiOff } from 'lucide-react';

interface PlayerListProps {
  players: Record<string, Player>;
  currentPlayerId: string | null;
  myWordsCount?: number;
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentPlayerId, myWordsCount }) => {
  const playerArray = Object.values(players);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 py-2">
      {playerArray.map((p) => {
        const isMe = p.id === currentPlayerId;
        const wordsCount = isMe && myWordsCount !== undefined
          ? Math.max(p.foundWordsCount || 0, myWordsCount)
          : (p.foundWordsCount || 0);

        return (
          <div
            key={p.id}
            className={`
              flex items-center space-x-3 px-4 py-2 rounded-2xl border transition-all duration-200
              ${
                isMe
                  ? 'bg-white shadow-md border-orange-400 ring-2 ring-orange-400/30 scale-105'
                  : 'bg-white/90 shadow-sm border-purple-100 hover:bg-white'
              }
              ${!p.isConnected ? 'opacity-50' : ''}
            `}
          >
            {/* Enlarged Avatar with Custom Signature Color */}
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-md font-bold relative transition-transform hover:scale-110 flex-shrink-0"
              style={{ backgroundColor: p.color || '#FF7A00' }}
            >
              <span>{p.avatar || '🦊'}</span>
              {p.isHost && (
                <Crown className="w-5 h-5 text-amber-500 absolute -top-2 -right-2 fill-amber-400 stroke-amber-600 drop-shadow-md" />
              )}
            </div>

            {/* Name & Dynamic Words Count */}
            <div className="flex flex-col text-left">
              <span className="text-sm font-boggle font-black text-slate-800 leading-tight flex items-center space-x-1.5">
                <span>{p.username}</span>
                {isMe && <span className="text-[11px] text-orange-600 font-black uppercase tracking-wider">(You)</span>}
              </span>
              <div className="flex items-center space-x-1 mt-1">
                <span className="text-xs font-black text-purple-950 bg-gradient-to-r from-orange-100 to-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200 shadow-sm">
                  {wordsCount} {wordsCount === 1 ? 'word' : 'words'}
                </span>
              </div>
            </div>

            {/* Offline badge */}
            {!p.isConnected && (
              <span title="Disconnected">
                <WifiOff className="w-4 h-4 text-slate-400" />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
