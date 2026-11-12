import React from 'react';
import { Coordinate } from '@shared/types/game';

interface SwipeTrailProps {
  path: Coordinate[];
  boardRef: React.RefObject<HTMLDivElement>;
  currentPointer: { x: number; y: number } | null;
}

export const SwipeTrail: React.FC<SwipeTrailProps> = ({ path, boardRef, currentPointer }) => {
  if (path.length === 0 || !boardRef.current) return null;

  const boardRect = boardRef.current.getBoundingClientRect();

  // Calculate center and radius of each selected tile bubble
  const bubbles: { x: number; y: number; r: number }[] = [];
  for (const c of path) {
    const tileEl = boardRef.current.querySelector(`[data-tile-coord="${c.row}-${c.col}"]`);
    if (tileEl) {
      const rect = tileEl.getBoundingClientRect();
      const radius = rect.width / 2;
      bubbles.push({
        x: rect.left + radius - boardRect.left,
        y: rect.top + radius - boardRect.top,
        r: radius,
      });
    }
  }

  if (bubbles.length === 0) return null;

  const defaultRadius = bubbles[0].r || 28;
  const bridgeWidth = Math.max(20, defaultRadius * 1.3);

  // Pointer position relative to board
  const pointerRel = currentPointer
    ? {
        x: currentPointer.x - boardRect.left,
        y: currentPointer.y - boardRect.top,
      }
    : null;

  // Build crisp center spline path
  let splineD = `M ${bubbles[0].x} ${bubbles[0].y}`;
  for (let i = 1; i < bubbles.length; i++) {
    splineD += ` L ${bubbles[i].x} ${bubbles[i].y}`;
  }

  const lastBubble = bubbles[bubbles.length - 1];

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10 w-full h-full overflow-visible"
      style={{ filter: 'drop-shadow(0 0 12px rgba(255, 46, 147, 0.6))' }}
    >
      <defs>
        {/* SVG Gooey / Metaball Filter: Blurs overlapping shapes then clamps alpha threshold */}
        <filter id="metaball-goo" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  
                    0 1 0 0 0  
                    0 0 1 0 0  
                    0 0 0 24 -9"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>

        <linearGradient id="blobTrailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7A00" />
          <stop offset="50%" stopColor="#FF2E93" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        <linearGradient id="spineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="50%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>

      {/* 1. LIQUID GOOEY BLOB LAYER (Metaball Merging of selected bubbles) */}
      <g filter="url(#metaball-goo)">
        {/* Liquid capsule bridges between consecutive bubble centers */}
        {bubbles.map((b, i) => {
          if (i === 0) return null;
          const prev = bubbles[i - 1];
          return (
            <line
              key={`bridge-${i}`}
              x1={prev.x}
              y1={prev.y}
              x2={b.x}
              y2={b.y}
              stroke="url(#blobTrailGradient)"
              strokeWidth={bridgeWidth}
              strokeLinecap="round"
            />
          );
        })}

        {/* Circular liquid bodies centered in each selected bubble */}
        {bubbles.map((b, i) => (
          <circle
            key={`bubble-${i}`}
            cx={b.x}
            cy={b.y}
            r={b.r * 0.96}
            fill="url(#blobTrailGradient)"
          />
        ))}

        {/* Elastic liquid tentacle stretching to live pointer / touch finger */}
        {pointerRel && lastBubble && (
          <>
            <line
              x1={lastBubble.x}
              y1={lastBubble.y}
              x2={pointerRel.x}
              y2={pointerRel.y}
              stroke="url(#blobTrailGradient)"
              strokeWidth={bridgeWidth * 0.65}
              strokeLinecap="round"
            />
            <circle
              cx={pointerRel.x}
              cy={pointerRel.y}
              r={defaultRadius * 0.42}
              fill="url(#blobTrailGradient)"
            />
          </>
        )}
      </g>

      {/* 2. BRIGHT NEON CORE SPINE */}
      {bubbles.length > 1 && (
        <path
          d={splineD}
          fill="none"
          stroke="url(#spineGradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-75"
        />
      )}

      {/* Elastic pointer line indicator */}
      {pointerRel && lastBubble && (
        <line
          x1={lastBubble.x}
          y1={lastBubble.y}
          x2={pointerRel.x}
          y2={pointerRel.y}
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinecap="round"
          className="opacity-60"
        />
      )}
    </svg>
  );
};
