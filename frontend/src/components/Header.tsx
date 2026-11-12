import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, Timer, LogOut } from 'lucide-react';
import { sound } from '../audio/sound';

interface HeaderProps {
  roomCode: string;
  remainingSeconds: number;
  totalWordsFound: number;
  onLeaveRoom: () => void;
  isGameActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  remainingSeconds,
  totalWordsFound,
  onLeaveRoom,
  isGameActive,
}) => {
  const [isMuted, setIsMuted] = useState(sound.isMuted);
  const [copied, setCopied] = useState(false);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const copyInvite = () => {
    const url = `${window.location.origin}?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const isLowTime = remainingSeconds <= 30 && isGameActive;
  const isUrgent = remainingSeconds <= 10 && isGameActive;

  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-purple-100 py-2.5 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Brand & Room Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-purple-600 flex items-center justify-center font-boggle font-black text-white text-2xl shadow-md shadow-orange-500/20">
            W
          </div>
          <span className="font-boggle font-black text-xl tracking-tight hidden sm:inline bg-gradient-to-r from-orange-600 via-pink-600 to-purple-700 bg-clip-text text-transparent">
            Word Rush
          </span>
        </div>

        {/* Room Code Badge */}
        <button
          onClick={copyInvite}
          className="flex items-center space-x-1.5 px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-extrabold rounded-full transition shadow-sm"
          title="Click to copy invite link"
        >
          <span>{roomCode}</span>
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
        </button>
      </div>

      {/* Synchronized Round Timer */}
      {isGameActive && (
        <div
          className={`
            flex items-center space-x-2 px-4 py-1.5 rounded-2xl font-boggle font-black text-xl sm:text-2xl transition-all duration-300 shadow-md
            ${
              isUrgent
                ? 'bg-gradient-to-r from-rose-600 to-orange-600 text-white animate-pulse ring-4 ring-orange-300'
                : isLowTime
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white ring-2 ring-orange-300'
                : 'bg-gradient-to-r from-purple-950 to-slate-900 text-white'
            }
          `}
        >
          <Timer className="w-5 h-5 sm:w-6 sm:h-6" />
          <span>{formattedTime}</span>
        </div>
      )}

      {/* Words counter & Action controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {isGameActive && (
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-orange-100 to-purple-100 text-purple-950 border border-purple-200 rounded-full text-xs font-black shadow-sm">
            <span>{totalWordsFound} {totalWordsFound === 1 ? 'word' : 'words'}</span>
          </div>
        )}

        <button
          onClick={toggleSound}
          className="p-2 rounded-xl text-purple-700 hover:bg-purple-50 transition"
          aria-label="Toggle Sound"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5 text-orange-500" />}
        </button>

        <button
          onClick={onLeaveRoom}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
          title="Leave Room"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
