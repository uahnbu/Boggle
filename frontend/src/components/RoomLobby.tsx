import React, { useState } from 'react';
import { GridSize, Player, RoomSettings } from '@shared/types/game';
import { Copy, Check, Play, Settings, Users, Sparkles, Palette, Crown } from 'lucide-react';
import { ANIMAL_AVATARS, AVATAR_COLORS } from '@shared/constants/letters';

interface RoomLobbyProps {
  roomCode: string;
  players: Record<string, Player>;
  hostId: string;
  currentPlayerId: string | null;
  settings: RoomSettings;
  isHost: boolean;
  onUpdateSettings: (settings: Partial<RoomSettings>) => void;
  onToggleReady: (isReady: boolean) => void;
  onUpdateProfile?: (avatar?: string, color?: string) => void;
  onStartGame: () => void;
  countdown: number | null;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  roomCode,
  players,
  hostId,
  currentPlayerId,
  settings,
  isHost,
  onUpdateSettings,
  onToggleReady,
  onUpdateProfile,
  onStartGame,
  countdown,
}) => {
  const [copied, setCopied] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const playerList = Object.values(players);
  const myPlayer = currentPlayerId ? players[currentPlayerId] : null;

  const copyLink = () => {
    const url = `${window.location.origin}?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gridSizes: GridSize[] = [4, 5, 6, 7, 8];
  const durations = [
    { label: '1 min (test)', sec: 60 },
    { label: '3 min', sec: 180 },
    { label: '5 min', sec: 300 },
    { label: '7 min', sec: 420 },
    { label: '10 min', sec: 600 },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Starting countdown overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
          <span className="font-boggle text-lg uppercase tracking-widest text-orange-300 mb-2">Round starting in</span>
          <span className="font-boggle font-black text-8xl sm:text-9xl text-amber-300 animate-ping">
            {countdown}
          </span>
        </div>
      )}

      {/* Lobby Header Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-100 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-orange-400/15 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/15 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none" />

        <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-gradient-to-r from-orange-100 to-purple-100 text-purple-900 border border-purple-200 rounded-full text-xs font-extrabold mb-3 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>Game Lobby</span>
        </div>

        <h1 className="font-boggle font-black text-3xl sm:text-4xl tracking-tight bg-gradient-to-r from-orange-600 via-pink-600 to-purple-700 bg-clip-text text-transparent">
          Ready for Word Rush!
        </h1>
        <p className="text-slate-600 text-sm mt-1 max-w-md mx-auto font-medium">
          Swipe letters in 8 directions to find words. Unique words score big!
        </p>

        {/* Room Code & Copy Link */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="flex items-center space-x-2 bg-purple-50/80 border border-purple-200 px-4 py-2.5 rounded-2xl">
            <span className="text-xs uppercase text-purple-500 font-extrabold">Room Code:</span>
            <span className="font-boggle font-extrabold text-xl text-purple-950 tracking-wider">
              {roomCode}
            </span>
          </div>

          <button
            onClick={copyLink}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-900 to-slate-900 hover:from-purple-950 hover:to-black text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-md transition active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-300" />}
            <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>
        </div>
      </div>

      {/* Room Configuration (Host Only / View for guests) */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-purple-100 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-purple-100">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-orange-500" />
            <h2 className="font-boggle font-extrabold text-lg text-slate-800">Round Settings</h2>
          </div>
          {!isHost && (
            <span className="text-xs text-purple-600 font-medium italic">Host configures settings</span>
          )}
        </div>

        {/* Grid Size Selection */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
            Grid Size
          </label>
          <div className="grid grid-cols-5 gap-2">
            {gridSizes.map((size) => {
              const isSelected = settings.gridSize === size;
              return (
                <button
                  key={size}
                  disabled={!isHost}
                  onClick={() => onUpdateSettings({ gridSize: size })}
                  className={`
                    py-3 rounded-2xl font-boggle font-bold text-center transition-all flex flex-col items-center justify-center
                    ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md scale-105 ring-2 ring-orange-400/40'
                        : isHost
                        ? 'bg-purple-50/60 hover:bg-purple-100 text-slate-700 border border-purple-100'
                        : 'bg-purple-50/40 text-slate-400 border border-purple-50 cursor-not-allowed'
                    }
                  `}
                >
                  <span className="text-lg leading-tight">{size}×{size}</span>
                  <span className="text-[10px] opacity-80">{size * size} tiles</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Round Duration Selection */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
            Round Duration
          </label>
          <div className="flex flex-wrap gap-2">
            {durations.map((d) => {
              const isSelected = settings.durationSeconds === d.sec;
              return (
                <button
                  key={d.sec}
                  disabled={!isHost}
                  onClick={() => onUpdateSettings({ durationSeconds: d.sec })}
                  className={`
                    px-4 py-2 rounded-xl text-xs font-extrabold transition-all
                    ${
                      isSelected
                        ? 'bg-purple-900 text-white shadow-sm ring-2 ring-purple-400'
                        : isHost
                        ? 'bg-purple-50 hover:bg-purple-100 text-slate-700 border border-purple-100'
                        : 'bg-purple-50/40 text-slate-400 border border-purple-50 cursor-not-allowed'
                    }
                  `}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Minimum Word Length Selection */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
            Minimum Word Length
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { len: 3, label: '3+ letters', sub: 'Standard' },
              { len: 4, label: '4+ letters', sub: 'Challenge' },
              { len: 5, label: '5+ letters', sub: 'Master' },
            ].map(({ len, label, sub }) => {
              const isSelected = (settings.minWordLength || 3) === len;
              return (
                <button
                  key={len}
                  disabled={!isHost}
                  onClick={() => onUpdateSettings({ minWordLength: len })}
                  className={`
                    py-2.5 px-3 rounded-2xl font-boggle font-bold text-center transition-all flex flex-col items-center justify-center
                    ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md scale-105 ring-2 ring-orange-400/40'
                        : isHost
                        ? 'bg-purple-50/60 hover:bg-purple-100 text-slate-700 border border-purple-100'
                        : 'bg-purple-50/40 text-slate-400 border border-purple-50 cursor-not-allowed'
                    }
                  `}
                >
                  <span className="text-sm font-extrabold">{label}</span>
                  <span className="text-[10px] opacity-80">{sub}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Players Lobby List */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-purple-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-purple-100">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h2 className="font-boggle font-extrabold text-lg text-slate-800">
              Players ({playerList.length} / 8)
            </h2>
          </div>
          {myPlayer && (
            <button
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="text-xs font-extrabold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{showAvatarPicker ? 'Done Changing' : 'Change Avatar'}</span>
            </button>
          )}
        </div>

        {/* Inline Avatar & Color Picker for Current Player */}
        {showAvatarPicker && myPlayer && (
          <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-3 animate-fadeIn">
            <div className="text-xs font-extrabold text-purple-900">
              Pick your signature animal & color:
            </div>
            {/* Animals Grid */}
            <div className="grid grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-purple-100">
              {ANIMAL_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onUpdateProfile?.(emoji, myPlayer.color)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl transition ${
                    myPlayer.avatar === emoji ? 'bg-orange-100 ring-2 ring-orange-500 scale-110' : 'hover:bg-slate-50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {/* Colors Swatches */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onUpdateProfile?.(myPlayer.avatar, c)}
                  className={`w-7 h-7 rounded-full flex-shrink-0 transition-transform ${
                    myPlayer.color === c ? 'ring-4 ring-purple-600 ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {playerList.map((p) => {
            const isMe = p.id === currentPlayerId;
            return (
              <div
                key={p.id}
                className={`
                  flex items-center justify-between p-3.5 rounded-2xl border transition-all
                  ${isMe ? 'border-orange-400 bg-orange-50/30 ring-2 ring-orange-400/25' : 'border-purple-100 bg-white/70'}
                `}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-sm relative"
                    style={{ backgroundColor: p.color || '#FF7A00' }}
                  >
                    <span>{p.avatar || '🦊'}</span>
                    {p.isHost && (
                      <Crown className="w-4 h-4 text-amber-500 fill-amber-400 stroke-amber-600 absolute -top-1.5 -right-1.5 drop-shadow" />
                    )}
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-slate-800 flex items-center space-x-1">
                      <span>{p.username}</span>
                      {isMe && <span className="text-xs text-orange-600 font-black">(You)</span>}
                    </span>
                    <span className="text-xs text-purple-600 font-semibold">
                      {p.isHost ? 'Host' : p.isReady ? 'Ready' : 'Waiting'}
                    </span>
                  </div>
                </div>

                {p.isHost ? (
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 font-extrabold text-xs rounded-full border border-amber-200">
                    Host 👑
                  </span>
                ) : (
                  <span
                    className={`px-3 py-1 text-xs font-extrabold rounded-full ${
                      p.isReady ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {p.isReady ? 'Ready ✓' : 'Not Ready'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Start Game & Ready Controls */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
          {!isHost && myPlayer && (
            <button
              onClick={() => onToggleReady(!myPlayer.isReady)}
              className={`
                w-full sm:w-auto px-7 py-3.5 rounded-2xl font-boggle font-extrabold text-sm transition-all
                ${
                  myPlayer.isReady
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md'
                }
              `}
            >
              {myPlayer.isReady ? 'Cancel Ready' : 'I Am Ready! ✓'}
            </button>
          )}

          {isHost && (
            <button
              onClick={onStartGame}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-boggle font-black text-base shadow-xl shadow-orange-500/25 transition active:scale-95"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Start Game Round</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
