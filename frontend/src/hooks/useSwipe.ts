import { useState, useRef, useCallback, useEffect } from 'react';
import { Board, Coordinate } from '@shared/types/game';
import { sound } from '../audio/sound';

export interface UseSwipeOptions {
  board: Board | null;
  onSubmit: (word: string, path: Coordinate[]) => void;
  disabled?: boolean;
}

interface BubbleHitbox {
  row: number;
  col: number;
  centerX: number;
  centerY: number;
  radius: number;
}

export function useSwipe({ board, onSubmit, disabled }: UseSwipeOptions) {
  const [path, setPath] = useState<Coordinate[]>([]);
  const [isSwiping, setIsSwiping] = useState(false);
  const [currentPointer, setCurrentPointer] = useState<{ x: number; y: number } | null>(null);

  const pathRef = useRef<Coordinate[]>([]);
  pathRef.current = path;

  const isSwipingRef = useRef(false);
  const bubbleHitboxesRef = useRef<Map<string, BubbleHitbox>>(new Map());

  // Cache circular bubble centers and radii (carving out the four invisible corners)
  const cacheBubbleHitboxes = useCallback(() => {
    if (!board) return;
    const hitboxes = new Map<string, BubbleHitbox>();
    const size = board.length;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const el = document.querySelector(`[data-tile-coord="${r}-${c}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          const radius = (Math.min(rect.width, rect.height) / 2) * 0.92;
          hitboxes.set(`${r}-${c}`, {
            row: r,
            col: c,
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2,
            radius,
          });
        }
      }
    }
    bubbleHitboxesRef.current = hitboxes;
  }, [board]);

  const getCurrentWord = useCallback(
    (currentCoords: Coordinate[]): string => {
      if (!board) return '';
      return currentCoords.map((c) => board[c.row][c.col]).join('');
    },
    [board]
  );

  const handlePointerDown = useCallback(
    (row: number, col: number, e: React.PointerEvent) => {
      if (disabled || !board) return;
      if (e.button !== undefined && e.button !== 0) return;

      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Safe catch
      }

      cacheBubbleHitboxes();
      isSwipingRef.current = true;
      setIsSwiping(true);
      setCurrentPointer({ x: e.clientX, y: e.clientY });

      const newPath = [{ row, col }];
      setPath(newPath);
      sound.playTilePop(0);
    },
    [board, disabled, cacheBubbleHitboxes]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      if (!isSwipingRef.current || disabled || !board) return;

      const px = e.clientX;
      const py = e.clientY;
      setCurrentPointer({ x: px, y: py });

      const currentPath = pathRef.current;
      if (currentPath.length === 0) return;

      const lastTile = currentPath[currentPath.length - 1];
      const hitboxes = bubbleHitboxesRef.current;
      const lastCenter = hitboxes.get(`${lastTile.row}-${lastTile.col}`);
      if (!lastCenter) return;

      const distToLast = Math.hypot(px - lastCenter.centerX, py - lastCenter.centerY);

      // 1. Backtracking check (Hysteresis deadzone: pointer must move decisively into previous bubble)
      if (currentPath.length > 1) {
        const secondToLast = currentPath[currentPath.length - 2];
        const secondCenter = hitboxes.get(`${secondToLast.row}-${secondToLast.col}`);
        if (secondCenter) {
          const distToSecond = Math.hypot(px - secondCenter.centerX, py - secondCenter.centerY);
          if (distToSecond <= secondCenter.radius * 0.85 && distToSecond < distToLast - 10) {
            const newPath = currentPath.slice(0, currentPath.length - 1);
            setPath(newPath);
            sound.playTilePop(newPath.length - 1);
            return;
          }
        }
      }

      // 2. 8-Direction Bubble Selection with Carved Invisible Corners
      const rows = board.length;
      const cols = board[0].length;
      let bestCandidate: BubbleHitbox | null = null;
      let minCandidateDist = Infinity;

      const dxFromLast = px - lastCenter.centerX;
      const dyFromLast = py - lastCenter.centerY;
      const isDiagonalIntent = Math.abs(dxFromLast) > 10 && Math.abs(dyFromLast) > 10;

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = lastTile.row + dr;
          const nc = lastTile.col + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

          // No tile reuse in same word
          if (currentPath.some((c) => c.row === nr && c.col === nc)) continue;

          const cand = hitboxes.get(`${nr}-${nc}`);
          if (!cand) continue;

          const distToCand = Math.hypot(px - cand.centerX, py - cand.centerY);
          const isDiagonalTile = dr !== 0 && dc !== 0;

          // Pure Circular Hitbox (4 invisible corners carved out so diagonal passages are open!)
          // If diagonal intent is detected, diagonal neighbors receive a capture radius boost
          const effectiveRadius = isDiagonalTile && isDiagonalIntent
            ? cand.radius * 1.15
            : cand.radius * 0.95;

          const insideCircularBubble = distToCand <= effectiveRadius;

          if (insideCircularBubble && distToCand < minCandidateDist) {
            minCandidateDist = distToCand;
            bestCandidate = cand;
          }
        }
      }

      // If pointer entered an adjacent bubble and is closer to it than the previous bubble:
      if (bestCandidate && minCandidateDist < distToLast) {
        const newPath = [...currentPath, { row: bestCandidate.row, col: bestCandidate.col }];
        setPath(newPath);
        sound.playTilePop(newPath.length - 1);
      }
    },
    [disabled, board]
  );

  const handlePointerUp = useCallback(
    (e?: React.PointerEvent | PointerEvent) => {
      if (!isSwipingRef.current) return;

      if (e && (e as any).pointerId) {
        try {
          ((e as any).target as HTMLElement).releasePointerCapture((e as any).pointerId);
        } catch {
          // Safe catch
        }
      }

      isSwipingRef.current = false;
      setIsSwiping(false);
      setCurrentPointer(null);

      const finalPath = pathRef.current;
      if (finalPath.length > 0) {
        const word = getCurrentWord(finalPath);
        if (word.length >= 2) {
          onSubmit(word, finalPath);
        }
      }

      setPath([]);
    },
    [getCurrentWord, onSubmit]
  );

  const cancelSwipe = useCallback(() => {
    isSwipingRef.current = false;
    setIsSwiping(false);
    setCurrentPointer(null);
    setPath([]);
  }, []);

  // Global window listeners for smooth mobile web and desktop dragging
  useEffect(() => {
    const onWindowPointerMove = (e: PointerEvent) => {
      if (isSwipingRef.current) {
        handlePointerMove(e);
      }
    };
    const onWindowPointerUp = (e: PointerEvent) => {
      if (isSwipingRef.current) {
        handlePointerUp(e);
      }
    };

    window.addEventListener('pointermove', onWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return {
    path,
    currentWord: getCurrentWord(path),
    isSwiping,
    currentPointer,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    cancelSwipe,
  };
}
