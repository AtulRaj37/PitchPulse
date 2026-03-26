import clsx from 'clsx';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Plus } from 'lucide-react';

interface ScoreActionPadProps {
  onScore: (runs: number, extras?: { isWide?: boolean, isNoBall?: boolean, isBye?: boolean, isLegBye?: boolean }) => void;
  onWicket: () => void;
}

export function ScoreActionPad({ onScore, onWicket }: ScoreActionPadProps) {
  const [activeExtra, setActiveExtra] = useState<'WD' | 'NB' | 'B' | 'LB' | null>(null);

  const handleRunClick = (runs: number) => {
    if (activeExtra) {
      const extraOpts = {
        isWide: activeExtra === 'WD',
        isNoBall: activeExtra === 'NB',
        isBye: activeExtra === 'B',
        isLegBye: activeExtra === 'LB'
      };
      
      // If Wide, runs are additional to the wide run
      onScore(runs, extraOpts);
      setActiveExtra(null); // Reset after action
    } else {
      onScore(runs);
    }
  };

  const toggleExtra = (type: 'WD' | 'NB' | 'B' | 'LB') => {
    if (activeExtra === type) {
      // If toggling off, just record 0 extra runs immediately for Wide/NoBall
      if (type === 'WD') onScore(0, { isWide: true });
      if (type === 'NB') onScore(0, { isNoBall: true });
      setActiveExtra(null);
    } else {
      setActiveExtra(type);
    }
  };

  // Generic Button Component
  const ActionBtn = ({ label, runs, colorClass, onClick, active }: { label: string, runs?: number, colorClass: string, onClick: () => void, active?: boolean }) => (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={clsx(
        "relative overflow-hidden flex flex-col items-center justify-center py-5 sm:py-6 rounded-2xl font-black font-clash tracking-tight text-2xl sm:text-3xl transition-all shadow-xl group",
        colorClass,
        active ? "ring-4 ring-white shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-105 z-10" : ""
      )}
    >
      <span className="relative z-10 drop-shadow-md">{label}</span>
      {active && (
        <span className="absolute bottom-1.5 text-[9px] uppercase tracking-widest font-bold text-white/90 z-10 font-inter bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">Add Runs</span>
      )}
      
      {/* Glassmorphic Shine */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      
      {/* Volumetric shadow for depth */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
    </motion.button>
  );

  return (
    <div className="bg-[#0e1424]/80 backdrop-blur-xl rounded-[1.5rem] border border-white/5 p-5 sm:p-7 shadow-2xl w-full relative overflow-hidden">
      
      {/* Background glow for the panel itself */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="mb-5 flex items-center justify-between relative z-10">
         <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Record Action</h3>
         <AnimatePresence>
           {activeExtra && (
             <motion.span 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.8 }}
               className="text-[10px] font-bold text-white bg-blue-500 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse uppercase tracking-widest"
             >
               Select {activeExtra} Runs...
             </motion.span>
           )}
         </AnimatePresence>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-4 gap-3 sm:gap-4 relative z-10">
        
        {/* Row 1: 0, 1, 2, 3 */}
        <ActionBtn label="0" onClick={() => handleRunClick(0)} colorClass="bg-gradient-to-br from-zinc-700 to-zinc-800 text-white hover:border-white/20 border border-white/5" />
        <ActionBtn label="1" onClick={() => handleRunClick(1)} colorClass="bg-gradient-to-br from-zinc-600 to-zinc-700 text-white hover:border-white/30 border border-white/10" />
        <ActionBtn label="2" onClick={() => handleRunClick(2)} colorClass="bg-gradient-to-br from-zinc-500 to-zinc-600 text-white hover:border-white/40 border border-white/15" />
        <ActionBtn label="3" onClick={() => handleRunClick(3)} colorClass="bg-gradient-to-br from-zinc-500 to-zinc-600 text-white hover:border-white/40 border border-white/15" />

        {/* Row 2: 4, 6, Wicket, Extras (rowspan) */}
        <ActionBtn label="4" onClick={() => handleRunClick(4)} colorClass="bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.5)] border border-emerald-400/40" />
        <ActionBtn label="6" onClick={() => handleRunClick(6)} colorClass="bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-[0_10px_40px_rgba(16,185,129,0.5)] hover:shadow-[0_15px_50px_rgba(16,185,129,0.7)] border border-emerald-300/50 text-4xl sm:text-5xl" />
        
        {/* Wicket spans 2 cols */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onWicket}
          className="col-span-2 relative overflow-hidden flex flex-col items-center justify-center gap-1.5 py-5 sm:py-6 rounded-2xl font-black font-clash tracking-widest text-2xl sm:text-3xl transition-all shadow-[0_15px_40px_rgba(239,68,68,0.4)] hover:shadow-[0_20px_50px_rgba(239,68,68,0.6)] bg-gradient-to-br from-red-500 via-red-600 to-rose-800 text-white border border-red-400/50 group"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
          
          <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 relative z-10 drop-shadow-lg" />
          <span className="relative z-10 drop-shadow-md">OUT</span>
        </motion.button>
      </div>

      {/* Extras Row */}
      <div className="grid grid-cols-4 gap-3 sm:gap-4 mt-3 sm:mt-4 relative z-10">
        <ActionBtn label="WD" onClick={() => toggleExtra('WD')} active={activeExtra === 'WD'} colorClass="bg-gradient-to-br from-blue-800/80 to-blue-900/80 text-blue-200 hover:text-white hover:from-blue-700/90 hover:to-blue-800/90 border border-blue-500/30 text-lg sm:text-2xl shadow-[0_5px_20px_rgba(59,130,246,0.15)]" />
        <ActionBtn label="NB" onClick={() => toggleExtra('NB')} active={activeExtra === 'NB'} colorClass="bg-gradient-to-br from-blue-800/80 to-blue-900/80 text-blue-200 hover:text-white hover:from-blue-700/90 hover:to-blue-800/90 border border-blue-500/30 text-lg sm:text-2xl shadow-[0_5px_20px_rgba(59,130,246,0.15)]" />
        <ActionBtn label="B" onClick={() => toggleExtra('B')} active={activeExtra === 'B'} colorClass="bg-gradient-to-br from-indigo-800/80 to-indigo-900/80 text-indigo-200 hover:text-white hover:from-indigo-700/90 hover:to-indigo-800/90 border border-indigo-500/30 text-lg sm:text-2xl shadow-[0_5px_20px_rgba(99,102,241,0.15)]" />
        <ActionBtn label="LB" onClick={() => toggleExtra('LB')} active={activeExtra === 'LB'} colorClass="bg-gradient-to-br from-indigo-800/80 to-indigo-900/80 text-indigo-200 hover:text-white hover:from-indigo-700/90 hover:to-indigo-800/90 border border-indigo-500/30 text-lg sm:text-2xl shadow-[0_5px_20px_rgba(99,102,241,0.15)]" />
      </div>
      
      {/* 5 Run Edge Case (Overthrows) */}
      <div className="mt-5 flex justify-center relative z-10">
        <button 
          onClick={() => handleRunClick(5)} 
          className="group text-[10px] sm:text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest px-5 py-2 rounded-full bg-white/[0.02] border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
          <span>Award 5 Runs (Overthrow)</span>
        </button>
      </div>
    </div>
  );
}
