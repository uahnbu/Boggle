import React, { useEffect, useState, useRef } from 'react';

interface MouseAvatarProps {
  avatar?: string;
  color?: string;
  isSwiping?: boolean;
}

export const MouseAvatar: React.FC<MouseAvatarProps> = ({
  avatar = '🦊',
  color = '#FF7A00',
  isSwiping = false,
}) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const isTouchRef = useRef(false);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      isTouchRef.current = e.pointerType === 'touch';
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };

    const handlePointerLeave = () => {
      setVisible(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('pointercancel', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('pointercancel', handlePointerLeave);
    };
  }, []);

  if (!pos || !visible) return null;

  // On touch screens, float above the finger so finger doesn't block letter view;
  // On desktop mouse, float nicely near the cursor arrow
  const offsetX = isTouchRef.current ? 0 : 16;
  const offsetY = isTouchRef.current ? -46 : 16;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-transform duration-75 ease-out select-none"
      style={{
        left: `${pos.x + offsetX}px`,
        top: `${pos.y + offsetY}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className={`
          flex items-center justify-center rounded-2xl shadow-xl border-2 border-white backdrop-blur-md transition-all duration-150
          ${isSwiping ? 'w-11 h-11 text-2xl ring-4 ring-orange-400 scale-125 animate-pulse shadow-orange-500/50' : 'w-8 h-8 text-lg hover:scale-110 shadow-purple-900/25'}
        `}
        style={{
          backgroundColor: color,
        }}
      >
        <span className="drop-shadow-sm leading-none">{avatar}</span>
      </div>
    </div>
  );
};
