import React, { useState, useEffect, useRef } from 'react';
import { Board, Coordinate } from '@shared/types/game';
import { RotateCcw, X, BookOpen } from 'lucide-react';
import { sound } from '../audio/sound';

export interface BoardPathViewerProps {
  board: Board;
  path?: Coordinate[];
  word: string;
  points?: number;
  definition?: string;
  tier?: string;
  finders?: string[];
  isUnique?: boolean;
  onClose?: () => void;
  compact?: boolean;
}

export const BoardPathViewer: React.FC<BoardPathViewerProps> = ({
  board,
  path = [],
  word,
  points,
  definition,
  tier,
  finders,
  isUnique,
  onClose,
  compact = false,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const size = board.length;

  // Animate the swipe path sequence letter-by-letter
  const runLetterByLetterAnimation = () => {
    if (!path || path.length === 0) {
      setActiveStep(0);
      return;
    }

    setActiveStep(1);
    sound.playTilePop(0);

    let step = 1;
    // Faster playback if compact mode (score race track)
    const stepInterval = compact ? 120 : 180;

    const interval = setInterval(() => {
      step++;
      if (step <= path.length) {
        setActiveStep(step);
        sound.playTilePop(Math.min(step - 1, 7));
      } else {
        clearInterval(interval);
      }
    }, stepInterval);

    return interval;
  };

  // Automatically start sequential letter-by-letter animation on path or word change
  useEffect(() => {
    const timer = runLetterByLetterAnimation();
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [path, word, compact]);

  // Map of tile keys to path step indices for visible path (up to activeStep)
  const pathStepMap = new Map<string, number>();
  path.slice(0, activeStep).forEach((coord, index) => {
    pathStepMap.set(`${coord.row}-${coord.col}`, index);
  });

  const gridColsClass =
    {
      4: 'grid-cols-4 max-w-[240px]',
      5: 'grid-cols-5 max-w-[270px]',
      6: 'grid-cols-6 max-w-[300px]',
      7: 'grid-cols-7 max-w-[330px]',
      8: 'grid-cols-8 max-w-[350px]',
    }[size] || 'grid-cols-5 max-w-[270px]';

  // Compute SVG trail coordinates for path up to activeStep
  const visiblePath = path.slice(0, activeStep);
  const bubbles: { x: number; y: number; r: number }[] = [];

  if (visiblePath.length > 0 && boardRef.current) {
    for (const c of visiblePath) {
      const tileEl = boardRef.current.querySelector<HTMLElement>(`[data-path-coord="${c.row}-${c.col}"]`);
      if (tileEl) {
        if (tileEl.offsetParent === boardRef.current) {
          const radius = tileEl.offsetWidth / 2;
          bubbles.push({
            x: tileEl.offsetLeft + radius,
            y: tileEl.offsetTop + radius,
            r: radius,
          });
        } else {
          const boardRect = boardRef.current.getBoundingClientRect();
          const tileRect = tileEl.getBoundingClientRect();
          const radius = tileRect.width / 2;
          const borderLeft = boardRef.current.clientLeft || 0;
          const borderTop = boardRef.current.clientTop || 0;
          bubbles.push({
            x: tileRect.left + radius - (boardRect.left + borderLeft),
            y: tileRect.top + radius - (boardRect.top + borderTop),
            r: radius,
          });
        }
      }
    }
  }

  return (
    <div
      className={`flex flex-col items-center bg-white/95 backdrop-blur-md rounded-3xl p-3 sm:p-4 shadow-2xl border border-purple-100 ${
        compact ? 'max-w-xs' : 'max-w-md'
      } mx-auto relative`}
    >
      {/* 1. LETTER BOARD DIRECTLY ON TOP (NO BUTTONS OR TAGS ABOVE TO PREVENT JUMPING) */}
      <div className="relative w-full flex items-center justify-center mb-2.5">
        <div
          ref={boardRef}
          className={`relative grid ${gridColsClass} gap-1.5 sm:gap-2 p-2 w-full bg-gradient-to-br from-purple-100/70 via-orange-50/50 to-purple-200/60 rounded-3xl shadow-inner border-2 border-white select-none`}
        >
          {/* Animated Connecting Gooey Blob Trail */}
          <svg
            className="absolute inset-0 pointer-events-none z-10 w-full h-full overflow-visible"
            style={{ filter: 'drop-shadow(0 0 8px rgba(255, 46, 147, 0.6))' }}
          >
            <defs>
              <filter id="viewerGoo" colorInterpolationFilters="sRGB">
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                <feColorMatrix
                  in="blur"
                  mode="matrix"
                  values="1 0 0 0 0  
                          0 1 0 0 0  
                          0 0 1 0 0  
                          0 0 0 22 -8"
                  result="goo"
                />
                <feComposite in="SourceGraphic" in2="goo" operator="atop" />
              </filter>

              <linearGradient id="viewerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF7A00" />
                <stop offset="50%" stopColor="#FF2E93" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>

            {bubbles.length > 0 && (
              <g filter="url(#viewerGoo)">
                {bubbles.map((b, i) => {
                  if (i === 0) return null;
                  const prev = bubbles[i - 1];
                  return (
                    <line
                      key={`v-bridge-${i}`}
                      x1={prev.x}
                      y1={prev.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="url(#viewerGradient)"
                      strokeWidth={b.r * 1.3}
                      strokeLinecap="round"
                    />
                  );
                })}
                {bubbles.map((b, i) => (
                  <circle
                    key={`v-circle-${i}`}
                    cx={b.x}
                    cy={b.y}
                    r={b.r * 0.95}
                    fill="url(#viewerGradient)"
                  />
                ))}
              </g>
            )}
          </svg>

          {/* Tiles as Circular Bubbles without Cluttering Number Badges */}
          {board.map((row, r) =>
            row.map((letter, c) => {
              const key = `${r}-${c}`;
              const stepIndex = pathStepMap.has(key) ? pathStepMap.get(key)! : null;
              const isSelected = stepIndex !== null;

              return (
                <div
                  key={key}
                  data-path-coord={`${r}-${c}`}
                  className={`
                    relative flex items-center justify-center rounded-full aspect-square w-full font-boggle font-black
                    transition-all duration-150 select-none
                    ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#FF6B00] via-[#FF2E93] to-[#8B5CF6] text-white shadow-md ring-2 ring-white scale-105 z-20'
                        : 'bg-white/80 text-slate-500 border border-purple-100/60 opacity-60'
                    }
                  `}
                >
                  {/* Subtle bubble shine */}
                  <span
                    className={`absolute top-1 left-1.5 w-1/3 h-1/4 rounded-full pointer-events-none ${
                      isSelected ? 'bg-white/40' : 'bg-white/60'
                    }`}
                  />
                  <span className="text-sm sm:text-base leading-none relative z-10 drop-shadow-sm">
                    {letter}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. ALL DETAILS, TAGS, AND BUTTONS PUT UNDER THE BOARD */}
      <div className="w-full flex items-center justify-between pt-1 border-t border-purple-100/80">
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="font-boggle font-black text-xl sm:text-2xl tracking-wider bg-gradient-to-r from-orange-600 via-pink-600 to-purple-700 bg-clip-text text-transparent">
            {word}
          </span>
          {points !== undefined && (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-gradient-to-r from-orange-100 to-purple-100 text-purple-950 border border-purple-200">
              +{points} pts
            </span>
          )}
          {isUnique && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-rose-100 text-rose-800 border border-rose-300">
              ⭐ UNIQUE
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <button
            onClick={() => runLetterByLetterAnimation()}
            className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition"
            title="Replay letter swipe"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
              title="Close viewer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Word Details & Finders */}
      <div className="w-full text-left space-y-1 mt-2 text-xs">
        {finders && finders.length > 0 && (
          <div className="text-purple-900 font-bold flex items-center space-x-1">
            <span className="text-slate-400 font-semibold">Found by:</span>
            <span>{finders.join(', ')}</span>
          </div>
        )}
        {definition && (
          <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 text-slate-700">
            <div className="flex items-center space-x-1.5 font-extrabold text-purple-950 mb-0.5">
              <BookOpen className="w-3.5 h-3.5 text-orange-500" />
              <span>Definition {tier ? `(Tier ${tier})` : ''}:</span>
            </div>
            <p className="text-[11px] leading-relaxed">{definition}</p>
          </div>
        )}
      </div>
    </div>
  );
};
