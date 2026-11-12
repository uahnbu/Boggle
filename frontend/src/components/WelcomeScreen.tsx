import React, { useState, useEffect } from 'react';
import { Sparkles, Play, LogIn, Compass, Palette } from 'lucide-react';
import { ANIMAL_AVATARS, AVATAR_COLORS } from '@shared/constants/letters';

interface WelcomeScreenProps {
  onCreateRoom: (username: string, avatar: string, color: string) => void;
  onJoinRoom: (roomCode: string, username: string, avatar: string, color: string, onError: (err: string) => void) => void;
  initialRoomCode?: string | null;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  initialRoomCode,
}) => {
  const [username, setUsername] = useState(() => localStorage.getItem('word_rush_username') || '');
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [selectedAvatar, setSelectedAvatar] = useState(() => localStorage.getItem('word_rush_avatar') || '🦊');
  const [selectedColor, setSelectedColor] = useState(() => localStorage.getItem('word_rush_color') || AVATAR_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode.toUpperCase());
    }
  }, [initialRoomCode]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please choose a username');
      return;
    }
    setError(null);
    onCreateRoom(username.trim(), selectedAvatar, selectedColor);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please choose a username');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    setError(null);
    onJoinRoom(roomCode.trim().toUpperCase(), username.trim(), selectedAvatar, selectedColor, (err) => {
      setError(err);
    });
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-100 space-y-6 text-center relative overflow-hidden">
        
        {/* Playful Orange & Purple Background Glows */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-orange-400/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-purple-500/15 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

        {/* Logo / Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-gradient-to-r from-orange-100 to-purple-100 text-purple-900 border border-purple-200 rounded-full text-xs font-extrabold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>Real-time Multiplayer Boggle</span>
        </div>

        <div>
          <h1 className="font-boggle font-black text-4xl sm:text-5xl tracking-tight bg-gradient-to-r from-orange-600 via-pink-600 to-purple-700 bg-clip-text text-transparent">
            Word Rush
          </h1>
          <p className="text-slate-600 text-sm mt-1.5 font-medium">
            Swipe letters in 8 directions to discover words together!
          </p>
        </div>

        {/* Error notice */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-fadeIn">
            {error}
          </div>
        )}

        {/* Avatar Live Preview */}
        <div className="flex items-center justify-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl shadow-md border-4 border-white ring-4 ring-orange-200/50 transition-transform duration-200 hover:scale-105"
            style={{ backgroundColor: selectedColor }}
          >
            <span>{selectedAvatar}</span>
          </div>
        </div>

        {/* Player Info Form */}
        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Your Nickname
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. WordMaster"
              maxLength={15}
              className="w-full px-4 py-3 rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-orange-400 font-bold text-slate-800 placeholder-slate-400 bg-white shadow-sm"
            />
          </div>

          {/* 32 Animal Avatars Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                Choose Animal Avatar ({ANIMAL_AVATARS.length} Available)
              </label>
              <span className="text-xs font-bold text-purple-600">Selected: {selectedAvatar}</span>
            </div>
            <div className="grid grid-cols-8 gap-1.5 p-2 bg-purple-50/50 rounded-2xl border border-purple-100 max-h-48 overflow-y-auto">
              {ANIMAL_AVATARS.map((emoji) => {
                const isSelected = selectedAvatar === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`
                      w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-2xl sm:text-3xl transition-transform
                      ${
                        isSelected
                          ? 'bg-white shadow-md ring-2 ring-orange-500 scale-110'
                          : 'hover:bg-white/70 hover:scale-105'
                      }
                    `}
                    title={`Select ${emoji}`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Palette Selector */}
          <div>
            <div className="flex items-center space-x-1.5 mb-1.5">
              <Palette className="w-3.5 h-3.5 text-orange-500" />
              <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                Badge Color
              </label>
            </div>
            <div className="flex items-center justify-between gap-1 p-2 bg-purple-50/50 rounded-2xl border border-purple-100 overflow-x-auto">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`
                    w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 transition-transform shadow-sm
                    ${selectedColor === c ? 'ring-4 ring-purple-600 ring-offset-2 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}
                  `}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Create room */}
          <button
            onClick={handleCreate}
            className="w-full py-4 rounded-2xl font-boggle font-black text-lg bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg shadow-orange-500/25 transition active:scale-95 flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Create New Room</span>
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-purple-200"></div>
            <span className="flex-shrink mx-4 text-xs font-bold uppercase text-purple-400">or join a friend</span>
            <div className="flex-grow border-t border-purple-200"></div>
          </div>

          {/* Join with room code */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ROOM-CODE"
              className="w-full px-4 py-3 rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 font-boggle font-bold text-center tracking-wider uppercase text-slate-800 placeholder-slate-400 bg-white"
            />
            <button
              onClick={handleJoin}
              className="px-7 py-3 rounded-2xl font-boggle font-bold text-sm bg-purple-900 hover:bg-purple-950 text-white transition active:scale-95 flex items-center space-x-1.5 shadow-md flex-shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span>Join</span>
            </button>
          </div>
        </div>

        {/* Mini rules breakdown */}
        <div className="bg-purple-50/60 rounded-2xl p-3.5 text-xs text-purple-900 space-y-1 text-left border border-purple-100">
          <div className="flex items-center space-x-1.5 font-bold text-purple-950">
            <Compass className="w-3.5 h-3.5 text-orange-500" />
            <span>How to play:</span>
          </div>
          <p>• Swipe 8 directions: up, down, left, right, and 4 diagonals.</p>
          <p>• <strong>QU</strong> is a single tile counting as 2 letters.</p>
          <p>• Unique words scored by only <strong>1 player</strong> get multiplied points!</p>
        </div>
      </div>
    </div>
  );
};
