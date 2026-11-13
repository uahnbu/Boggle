import React from 'react';

interface TileProps {
  letter: string;
  row: number;
  col: number;
  isSelected: boolean;
  orderIndex: number | null;
  isGhostHinted?: boolean;
  onPointerDown: (row: number, col: number, e: React.PointerEvent) => void;
}

export const Tile: React.FC<TileProps> = React.memo(({
  letter,
  row,
  col,
  isSelected,
  orderIndex: _orderIndex,
  isGhostHinted = false,
  onPointerDown,
}) => {
  const isQu = letter.toUpperCase() === 'QU';

  return (
    <div
      data-tile-coord={`${row}-${col}`}
      onPointerDown={(e) => onPointerDown(row, col, e)}
      style={{ touchAction: 'none' }}
      className={`
        relative flex items-center justify-center rounded-full cursor-pointer select-none
        transition-all duration-150 transform active:scale-95
        aspect-square w-full font-boggle font-black
        ${
          isSelected
            ? 'bg-gradient-to-br from-[#FF6B00] via-[#FF2E93] to-[#8B5CF6] text-white shadow-xl scale-105 z-20 ring-4 ring-white/90 shadow-orange-500/50'
            : isGhostHinted
            ? 'bg-slate-100 text-slate-900 shadow-md ring-4 ring-slate-400/90 border border-slate-300 scale-[1.02] z-10'
            : 'bg-white/95 text-slate-800 shadow-md hover:scale-[1.03] ring-2 ring-purple-100/70 border border-white/80 hover:ring-orange-300'
        }
      `}
    >
      {/* Specular 3D Bubble Reflection Highlight */}
      <span
        className={`
          absolute top-1.5 left-2.5 w-1/3 h-1/4 rounded-full pointer-events-none transition-opacity
          ${isSelected ? 'bg-white/40 blur-[0.5px]' : 'bg-white/70 blur-[0.5px]'}
        `}
      />

      {/* Bubble Inner Bottom Glow */}
      <span
        className={`
          absolute bottom-1 right-2 w-1/4 h-1/5 rounded-full pointer-events-none transition-opacity
          ${isSelected ? 'bg-purple-900/20' : 'bg-purple-200/40'}
        `}
      />

      {/* Tile Letter */}
      <div className="flex flex-col items-center justify-center leading-none pointer-events-none relative z-10">
        <span
          className={`
            tracking-tight select-none
            ${letter.length > 1 ? 'text-lg sm:text-2xl md:text-3xl' : 'text-2xl sm:text-4xl md:text-5xl'}
            ${isSelected ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]' : 'text-slate-800'}
          `}
        >
          {letter}
        </span>
        {isQu && (
          <span
            className={`text-[8px] sm:text-[10px] sm:text-xs font-black uppercase tracking-wider mt-0.5 ${
              isSelected ? 'text-amber-200' : 'text-orange-500'
            }`}
          >
            2 letters
          </span>
        )}
      </div>
    </div>
  );
});

Tile.displayName = 'Tile';
