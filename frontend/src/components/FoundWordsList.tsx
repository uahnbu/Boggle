import React from 'react';
import { Award, Sparkles } from 'lucide-react';

interface FoundWordsListProps {
  words: string[];
}

export const FoundWordsList: React.FC<FoundWordsListProps> = ({ words }) => {
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 shadow-md border border-purple-100 flex flex-col h-full max-h-[380px]">
      <div className="flex items-center justify-between pb-3 border-b border-purple-100 mb-3">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-orange-500" />
          <h3 className="font-boggle font-black text-base text-slate-800">Your Words</h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 font-black rounded-full bg-gradient-to-r from-orange-100 to-purple-100 text-purple-950 border border-purple-200">
          {words.length}
        </span>
      </div>

      {words.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs py-8 text-center space-y-1">
          <Sparkles className="w-6 h-6 text-purple-200" />
          <span className="font-bold text-slate-500">No words found yet</span>
          <span className="text-slate-400">Swipe letters on the grid to score!</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {words.map((word, idx) => (
            <div
              key={`${word}-${idx}`}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-50/50 hover:bg-purple-100/60 transition text-sm font-bold text-slate-800 border border-purple-50"
            >
              <span className="font-boggle tracking-wider text-purple-950">{word}</span>
              <span className="text-xs text-orange-600 font-extrabold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                {word.length} letters
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
