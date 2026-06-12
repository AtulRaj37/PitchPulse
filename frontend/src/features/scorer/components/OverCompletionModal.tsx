import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, UserCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { OverTimeline } from './OverTimeline'; // Reusing your existing visual timeline

interface Player {
  id: string;
  name: string;
}

interface OverCompletionModalProps {
  overNumber: number;
  timeline: string[];
  previousBowlerName: string;
  nextBowlerCandidates: Player[];
  onSelectNextBowler: (bowlerId: string) => void;
  onCancel: () => void;
}

export function OverCompletionModal({ overNumber, timeline, previousBowlerName, nextBowlerCandidates, onSelectNextBowler, onCancel }: OverCompletionModalProps) {
  const [selectedBowlerId, setSelectedBowlerId] = useState<string | undefined>();
  
  // Quick summation
  let totalRuns = 0;
  let wickets = 0;
  timeline.forEach(t => {
    if (t === 'W') wickets++;
    else if (t.includes('Wd') || t.includes('Nb')) totalRuns += (parseInt(t) || 1);
    else if (t.includes('B') || t.includes('Lb')) totalRuns += parseInt(t);
    else totalRuns += parseInt(t) || 0;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-zinc-950 border border-emerald-900/40 rounded-[2.5rem] p-6 lg:p-10 max-w-2xl w-full flex flex-col items-center text-center relative overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.1)]"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-600 via-teal-400 to-emerald-600" />

        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
          <CheckCircle2 size={32} />
        </div>

        <h2 className="text-3xl md:text-5xl font-black font-clash text-white tracking-widest uppercase mb-2">END OF OVER {overNumber}</h2>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-8">Completed by <span className="text-zinc-300">{previousBowlerName}</span></p>

        {/* Recap Dashboard Fragment */}
        <div className="w-full bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800/50 mb-10">
          <div className="flex gap-4 justify-around mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Runs Scored</p>
              <p className="text-4xl font-black text-white">{totalRuns}</p>
            </div>
            <div className="w-px bg-zinc-800" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Wickets</p>
              <p className={clsx("text-4xl font-black", wickets > 0 ? "text-red-500" : "text-white")}>{wickets}</p>
            </div>
          </div>
          
          <div className="flex justify-center border-t border-zinc-800 pt-6">
            <OverTimeline timeline={timeline} />
          </div>
        </div>

        {/* Next Assignment */}
        <div className="w-full text-left">
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2 px-2">
            <UserCircle2 size={14} className="text-blue-500" />
            SELECT BOWLER FOR OVER {overNumber + 1}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {nextBowlerCandidates.map(p => (
              <button 
                key={p.id}
                onClick={() => setSelectedBowlerId(p.id)}
                className={clsx(
                  "py-4 px-3 rounded-xl text-sm font-bold transition-all border text-left flex items-center gap-3",
                  selectedBowlerId === p.id 
                    ? "bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                    : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                )}
              >
                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-xs text-white z-10", selectedBowlerId === p.id ? "bg-blue-500" : "bg-zinc-800")}>
                  {p.name.slice(0,2).toUpperCase()}
                </div>
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="w-full flex justify-end gap-3 mt-10">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-full font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
          >
            Assign Later
          </button>
          <button
            onClick={() => selectedBowlerId && onSelectNextBowler(selectedBowlerId)}
            disabled={!selectedBowlerId}
            className="px-8 py-3 w-full sm:w-auto min-w-[200px] rounded-full bg-emerald-500 text-black font-black uppercase tracking-widest hover:scale-105 transition-all outline-none border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none"
          >
            Start Over {overNumber + 1}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
