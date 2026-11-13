import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Coordinate } from '@shared/types/game';

interface SwipeTrailProps {
  path: Coordinate[];
  boardRef: React.RefObject<HTMLDivElement>;
  currentPointer: { x: number; y: number } | null;
  ghostPath?: Coordinate[];
}

export const SwipeTrail: React.FC<SwipeTrailProps> = ({
  path,
  boardRef,
  currentPointer,
  ghostPath = [],
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [, setResizeTick] = useState(0);

  // Re-measure tile positions on window resize or container resize
  useEffect(() => {
    const handleResize = () => setResizeTick((t) => t + 1);
    window.addEventListener('resize', handleResize);

    let ro: ResizeObserver | null = null;
    if (boardRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => setResizeTick((t) => t + 1));
      ro.observe(boardRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (ro) ro.disconnect();
    };
  }, [boardRef]);

  // Helper to calculate the pixel-perfect center and radius of any letter tile bubble
  const getTileCenter = useCallback(
    (row: number, col: number): { x: number; y: number; r: number } | null => {
      if (!boardRef.current) return null;
      const tileEl = boardRef.current.querySelector<HTMLElement>(`[data-tile-coord="${row}-${col}"]`);
      if (!tileEl) return null;

      // 1. If direct child of relative board container, offsetLeft/Top are exact padding-box coords (matches SVG inset-0)
      if (tileEl.offsetParent === boardRef.current) {
        const radius = tileEl.offsetWidth / 2;
        return {
          x: tileEl.offsetLeft + radius,
          y: tileEl.offsetTop + radius,
          r: radius,
        };
      }

      // 2. Measure relative to the SVG element's own bounding client rect to eliminate any container border offset
      if (svgRef.current) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const tileRect = tileEl.getBoundingClientRect();
        const radius = tileRect.width / 2;
        return {
          x: tileRect.left + radius - svgRect.left,
          y: tileRect.top + radius - svgRect.top,
          r: radius,
        };
      }

      // 3. Fallback subtracting border offset
      const boardRect = boardRef.current.getBoundingClientRect();
      const tileRect = tileEl.getBoundingClientRect();
      const radius = tileRect.width / 2;
      const borderLeft = boardRef.current.clientLeft || 0;
      const borderTop = boardRef.current.clientTop || 0;
      return {
        x: tileRect.left + radius - (boardRect.left + borderLeft),
        y: tileRect.top + radius - (boardRect.top + borderTop),
        r: radius,
      };
    },
    [boardRef]
  );

  if (!boardRef.current) return null;

  // 1. Calculate center and radius of each selected tile bubble in active swipe
  const bubbles: { x: number; y: number; r: number }[] = [];
  for (const c of path) {
    const center = getTileCenter(c.row, c.col);
    if (center) {
      bubbles.push(center);
    }
  }

  // 2. Calculate center and radius of ghost hint trail if active and not swiping
  const ghostBubbles: { x: number; y: number; r: number }[] = [];
  if (path.length === 0 && ghostPath && ghostPath.length > 0) {
    for (const c of ghostPath) {
      const center = getTileCenter(c.row, c.col);
      if (center) {
        ghostBubbles.push(center);
      }
    }
  }

  if (bubbles.length === 0 && ghostBubbles.length === 0) return null;

  const defaultRadius = bubbles[0]?.r || ghostBubbles[0]?.r || 28;
  const bridgeWidth = Math.max(20, defaultRadius * 1.3);

  // Pointer position relative to SVG / board padding box
  let pointerRel: { x: number; y: number } | null = null;
  if (currentPointer) {
    if (svgRef.current) {
      const svgRect = svgRef.current.getBoundingClientRect();
      pointerRel = {
        x: currentPointer.x - svgRect.left,
        y: currentPointer.y - svgRect.top,
      };
    } else {
      const boardRect = boardRef.current.getBoundingClientRect();
      const borderLeft = boardRef.current.clientLeft || 0;
      const borderTop = boardRef.current.clientTop || 0;
      pointerRel = {
        x: currentPointer.x - (boardRect.left + borderLeft),
        y: currentPointer.y - (boardRect.top + borderTop),
      };
    }
  }

  // Build active spline path
  let splineD = '';
  if (bubbles.length > 0) {
    splineD = `M ${bubbles[0].x} ${bubbles[0].y}`;
    for (let i = 1; i < bubbles.length; i++) {
      splineD += ` L ${bubbles[i].x} ${bubbles[i].y}`;
    }
  }

  // Build ghost spline path
  let ghostD = '';
  if (ghostBubbles.length > 0) {
    ghostD = `M ${ghostBubbles[0].x} ${ghostBubbles[0].y}`;
    for (let i = 1; i < ghostBubbles.length; i++) {
      ghostD += ` L ${ghostBubbles[i].x} ${ghostBubbles[i].y}`;
    }
  }

  const lastBubble = bubbles[bubbles.length - 1];

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full overflow-visible"
      style={{ filter: bubbles.length > 0 ? 'drop-shadow(0 0 12px rgba(255, 46, 147, 0.6))' : undefined }}
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

        <linearGradient id="ghostGrayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>

      {/* GHOST TRAIL HINT LAYER: Mimic swipe in gray color letter-by-letter */}
      {ghostBubbles.length > 0 && bubbles.length === 0 && (
        <g className="transition-opacity duration-200">
          {/* Smooth gray liquid bridge connector between consecutive hinted letters */}
          {ghostBubbles.map((gb, i) => {
            if (i === 0) return null;
            const prev = ghostBubbles[i - 1];
            return (
              <line
                key={`ghost-bridge-${i}`}
                x1={prev.x}
                y1={prev.y}
                x2={gb.x}
                y2={gb.y}
                stroke="#94A3B8"
                strokeWidth={Math.max(14, gb.r * 0.75)}
                strokeLinecap="round"
                className="opacity-60"
                style={{ filter: 'drop-shadow(0 0 6px rgba(148, 163, 184, 0.5))' }}
              />
            );
          })}

          {/* Smooth gray center dashed path along the spine */}
          {ghostD && (
            <path
              d={ghostD}
              fill="none"
              stroke="#F8FAFC"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6 4"
              className="opacity-90"
              style={{ filter: 'drop-shadow(0 0 4px rgba(148, 163, 184, 0.7))' }}
            />
          )}

          {/* Ghost bubble circles: Exact concentric circles around each letter bubble */}
          {ghostBubbles.map((gb, i) => {
            const isTip = i === ghostBubbles.length - 1;
            return (
              <g key={`ghost-b-${i}`}>
                {/* Circle contour hugging the bubble perfectly */}
                <circle
                  cx={gb.x}
                  cy={gb.y}
                  r={gb.r}
                  fill="rgba(148, 163, 184, 0.16)"
                  stroke="#94A3B8"
                  strokeWidth="3.5"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(148, 163, 184, 0.4))' }}
                />

                {/* Origin indicator on 1st tile */}
                {i === 0 && (
                  <circle
                    cx={gb.x}
                    cy={gb.y}
                    r="5"
                    fill="#F1F5F9"
                    stroke="#64748B"
                    strokeWidth="2"
                  />
                )}

                {/* Leading tip touch point on current active letter */}
                {isTip && (
                  <g>
                    <circle
                      cx={gb.x}
                      cy={gb.y}
                      r="10"
                      fill="#FFFFFF"
                      stroke="#64748B"
                      strokeWidth="2.5"
                      style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.95))' }}
                    />
                    <circle
                      cx={gb.x}
                      cy={gb.y}
                      r="4"
                      fill="#94A3B8"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* ACTIVE SWIPE METABALL LAYER */}
      {bubbles.length > 0 && (
        <>
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
                  r={defaultRadius * 0.45}
                  fill="url(#blobTrailGradient)"
                />
              </>
            )}
          </g>

          {/* Golden/White Glowing Spinal Chord on Active Path */}
          {splineD && (
            <path
              d={splineD}
              fill="none"
              stroke="url(#spineGradient)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-90"
              style={{ filter: 'drop-shadow(0 0 6px #FFF)' }}
            />
          )}

          {/* Active pointer stretching spine connector */}
          {pointerRel && lastBubble && (
            <line
              x1={lastBubble.x}
              y1={lastBubble.y}
              x2={pointerRel.x}
              y2={pointerRel.y}
              stroke="url(#spineGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              className="opacity-80"
              style={{ filter: 'drop-shadow(0 0 5px #FFF)' }}
            />
          )}
        </>
      )}
    </svg>
  );
};
