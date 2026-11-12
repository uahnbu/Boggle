import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Flame, Zap, Crown } from 'lucide-react';

export interface CelebrationEvent {
  id: string;
  type: 'long-word' | 'streak';
  word?: string;
  length?: number;
  streakCount?: number;
}

interface CelebrationOverlayProps {
  event: CelebrationEvent | null;
  onClear: () => void;
}

const MASCOTS = [
  { emoji: '🦊', name: 'Rusty', msg: 'Sensational finding!' },
  { emoji: '🐼', name: 'Bambam', msg: 'You are on fire!' },
  { emoji: '🦁', name: 'Leo', msg: 'Vocabulary champion!' },
  { emoji: '🦄', name: 'Sparkle', msg: 'Pure linguistic magic!' },
  { emoji: '🦉', name: 'Barnaby', msg: 'Brilliant observation!' },
  { emoji: '🐯', name: 'Stripes', msg: 'Fierce word power!' },
];

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({ event, onClear }) => {
  const [visible, setVisible] = useState(false);
  const [currentMascot, setCurrentMascot] = useState(MASCOTS[0]);
  const lastConfettiTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!event) {
      setVisible(false);
      return;
    }

    setVisible(true);
    // Pick random mascot
    const rand = MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
    setCurrentMascot(rand);

    // Only fire super-lightweight confetti for rare feats (8+ letter words or 4+ streaks)
    // AND throttle so it cannot fire more often than every 10 seconds!
    const isEpicFeat = (event.type === 'long-word' && (event.length || 0) >= 8) || (Boolean(event.streakCount && event.streakCount >= 4));
    const now = Date.now();
    if (isEpicFeat && now - lastConfettiTimeRef.current >= 10000) {
      lastConfettiTimeRef.current = now;
      try {
        confetti({
          particleCount: 16,
          spread: 45,
          ticks: 60,
          origin: { y: 0.4 },
          disableForReducedMotion: true,
          colors: ['#FF7A00', '#8B5CF6', '#FFA040', '#A855F7'],
        });
      } catch {}
    }

    const timer = setTimeout(() => {
      setVisible(false);
      onClear();
    }, 2200);

    return () => clearTimeout(timer);
  }, [event, onClear]);

  if (!visible || !event) return null;

  let title = 'Awesome!';
  let icon = <Sparkles className="w-5 h-5 text-amber-400" />;
  let badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';

  if (event.type === 'streak') {
    icon = <Flame className="w-5 h-5 text-rose-500 animate-pulse fill-rose-500" />;
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
    if (event.streakCount === 2) title = '2x Streak! Keep Going!';
    else if (event.streakCount === 3) title = '🔥 3x COMBO ON FIRE!';
    else title = '⚡ UNSTOPPABLE BLITZ!';
  } else if (event.type === 'long-word') {
    if ((event.length || 0) >= 8) {
      icon = <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />;
      title = '👑 GENIUS 8+ LETTERS!';
      badgeColor = 'bg-amber-100 text-amber-900 border-amber-400';
    } else if ((event.length || 0) >= 7) {
      icon = <Zap className="w-5 h-5 text-yellow-500 fill-yellow-400" />;
      title = '🌟 7-LETTER MASTERPIECE!';
      badgeColor = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    } else if ((event.length || 0) >= 6) {
      title = '✨ EXCELLENT 6 LETTERS!';
      badgeColor = 'bg-mint-light/40 text-mint-dark border-mint';
    } else {
      title = 'GREAT 5-LETTER WORD!';
      badgeColor = 'bg-sky-light/40 text-sky-dark border-sky';
    }
  }

  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center animate-bounce">
      {/* Toast Badge */}
      <div className={`flex items-center space-x-2 px-5 py-2.5 rounded-full border shadow-xl backdrop-blur-md bg-white/95 ${badgeColor}`}>
        {icon}
        <span className="font-boggle font-extrabold text-base sm:text-lg tracking-wide">
          {title}
        </span>
        {event.word && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-white font-bold uppercase tracking-wider ml-1">
            {event.word}
          </span>
        )}
      </div>

      {/* Animated Mascot Popup */}
      <div className="mt-2 flex items-center space-x-3 bg-white/95 px-4 py-2 rounded-2xl shadow-lg border border-slate-100 animate-fadeIn">
        <span className="text-3xl animate-spin-slow">{currentMascot.emoji}</span>
        <div className="text-left">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {currentMascot.name}
          </div>
          <div className="text-xs font-extrabold text-slate-800">
            {currentMascot.msg}
          </div>
        </div>
      </div>
    </div>
  );
};
