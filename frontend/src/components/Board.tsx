import React, { useRef, useState, useEffect } from 'react';
import { Board as BoardType, Coordinate } from '@shared/types/game';
import { Tile } from './Tile';
import { SwipeTrail } from './SwipeTrail';

interface GhostHint {
  wordLength: number;
  hintLetters: string;
  path: Coordinate[];
  timestamp: number;
}

interface BoardProps {
  board: BoardType;
  path: Coordinate[];
  currentPointer: { x: number; y: number } | null;
  ghostHint?: GhostHint | null;
  onPointerDown: (row: number, col: number, e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  disabled?: boolean;
}

export const Board: React.FC<BoardProps> = ({
  board,
  path,
  currentPointer,
  ghostHint,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  disabled: _disabled,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const size = board.length;

  // Step for letter-by-letter swiping mimic
  const [ghostStep, setGhostStep] = useState<number>(1);

  // Reset ghost step whenever the hinted word changes
  useEffect(() => {
    setGhostStep(1);
  }, [ghostHint?.path]);

  // Animate ghost swipe letter-by-letter in a loop until a new hint is announced
  useEffect(() => {
    if (!ghostHint?.path || ghostHint.path.length === 0 || path.length > 0) return;

    const maxSteps = ghostHint.path.length;
    let timer: ReturnType<typeof setTimeout>;

    if (ghostStep < maxSteps) {
      // Advance to next letter in the swipe
      timer = setTimeout(() => {
        setGhostStep((prev) => prev + 1);
      }, 420);
    } else {
      // Hold full hinted path for a moment, then loop back to step 1
      timer = setTimeout(() => {
        setGhostStep(1);
      }, 1400);
    }

    return () => clearTimeout(timer);
  }, [ghostHint?.path, ghostStep, path.length]);

  const visibleGhostPath =
    path.length === 0 && ghostHint?.path ? ghostHint.path.slice(0, ghostStep) : [];

  const ghostCoordSet = new Set<string>();
  visibleGhostPath.forEach((c) => {
    ghostCoordSet.add(`${c.row}-${c.col}`);
  });

  const selectedMap = new Map<string, number>();
  path.forEach((c, index) => {
    selectedMap.set(`${c.row}-${c.col}`, index);
  });

  const gridColsClass =
    {
      4: 'grid-cols-4 max-w-[340px] sm:max-w-[420px]',
      5: 'grid-cols-5 max-w-[360px] sm:max-w-[480px]',
      6: 'grid-cols-6 max-w-[380px] sm:max-w-[530px]',
      7: 'grid-cols-7 max-w-[390px] sm:max-w-[570px]',
      8: 'grid-cols-8 max-w-[410px] sm:max-w-[610px]',
    }[size] || 'grid-cols-5 max-w-[480px]';

  const gapClass =
    size >= 7
      ? 'gap-1.5 sm:gap-2 p-2 sm:p-3'
      : size === 6
      ? 'gap-2 sm:gap-2.5 p-2.5 sm:p-3.5'
      : 'gap-2.5 sm:gap-3.5 p-3 sm:p-4';

  return (
    <div className="relative w-full flex flex-col items-center justify-center my-auto py-1 sm:py-2">
      <div
        ref={boardRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: 'none' }}
        className={`
          board-container relative grid ${gridColsClass} ${gapClass}
          w-full bg-white/20 backdrop-blur-md rounded-3xl shadow-2xl shadow-purple-950/20 border-4 border-white/60
          touch-none select-none overflow-visible
        `}
      >
        {/* Glowing Liquid Blob Merging Path & Ghost Trail Hint */}
        <SwipeTrail
          path={path}
          boardRef={boardRef}
          currentPointer={currentPointer}
          ghostPath={visibleGhostPath}
        />

        {/* Circular Letter Bubbles */}
        {board.map((row, r) =>
          row.map((letter, c) => {
            const key = `${r}-${c}`;
            const orderIndex = selectedMap.has(key) ? selectedMap.get(key)! : null;
            const isSelected = orderIndex !== null;
            const isGhostHinted = ghostCoordSet.has(key);

            return (
              <Tile
                key={key}
                letter={letter}
                row={r}
                col={c}
                isSelected={isSelected}
                orderIndex={orderIndex}
                isGhostHinted={isGhostHinted}
                onPointerDown={onPointerDown}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
