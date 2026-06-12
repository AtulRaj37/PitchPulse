import clsx from 'clsx';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Plus } from 'lucide-react';

interface ScoreActionPadProps {
  gullyRules?: Record<string, boolean | number> | null;
  onScore: (runs: number, extras?: { isWide?: boolean, isNoBall?: boolean, isBye?: boolean, isLegBye?: boolean }) => void;
  onWicket: () => void;
  onUndo?: () => void;
}

export function ScoreActionPad({ gullyRules, onScore, onWicket, onUndo }: ScoreActionPadProps) {
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
  const ActionBtn = ({ label, subLabel, runs, colorClass, onClick, active, className }: { label: string, subLabel?: string, runs?: number, colorClass: string, onClick: () => void, active?: boolean, className?: string }) => (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={clsx(
        "relative overflow-hidden flex flex-col items-center justify-center py-4 rounded-[1.25rem] shrink-0 transition-all group font-black font-clash tracking-tight ring-1 ring-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.2)] shadow-black/50 block",
        active ? "ring-inset ring-2 ring-white shadow-[inset_0_0_20px_rgba(255,255,255,0.4)] z-10" : "",
        colorClass,
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      <span className="relative z-10 drop-shadow-md">{label}</span>
      {subLabel && (
        <span className="relative z-10 text-[9px] uppercase tracking-widest text-white/70 mt-1 font-bold">{subLabel}</span>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </motion.button>
  );

  return (
    <div className="w-full relative px-1 md:px-0">
      <div className="grid grid-cols-4 relative z-10 w-full gap-2 sm:gap-2.5">
        {/* ROW 1: Singles */}
        <ActionBtn label="0" onClick={() => handleRunClick(0)} colorClass="bg-gradient-to-b from-[#2a303c] to-[#12161f] text-white" className="h-[3.5rem] md:h-[5.5rem] lg:h-[7.5rem] text-[22px] md:text-[26px] font-sans" />
        <ActionBtn label="1" onClick={() => handleRunClick(1)} colorClass="bg-gradient-to-b from-[#2a303c] to-[#12161f] text-white" className="h-[3.5rem] md:h-[5.5rem] lg:h-[7.5rem] text-[22px] md:text-[26px] font-sans" />
        <ActionBtn label="2" onClick={() => handleRunClick(2)} colorClass="bg-gradient-to-b from-[#2a303c] to-[#12161f] text-white" className="h-[3.5rem] md:h-[5.5rem] lg:h-[7.5rem] text-[22px] md:text-[26px] font-sans" />
        <ActionBtn label="3" onClick={() => handleRunClick(3)} colorClass="bg-gradient-to-b from-[#2a303c] to-[#12161f] text-white" className="h-[3.5rem] md:h-[5.5rem] lg:h-[7.5rem] text-[22px] md:text-[26px] font-sans" />

        {/* ROW 2: Boundaries & Out */}
        <ActionBtn label="4" subLabel="FOUR" onClick={() => handleRunClick(4)} colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] ring-emerald-500/50" className="h-[3.5rem] md:h-[5.5rem] lg:h-[7.5rem] text-[22px] md:text-[26px] font-sans" />
        <ActionBtn label="6" subLabel="SIX" onClick={() => handleRunClick(6)} colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] ring-emerald-500/50" className="h-[3.5rem] md:h-[5.5rem] lg:h-[7.5rem] text-[22px] md:text-[26px] font-sans" />
        
        <div className="flex flex-col w-full h-[3.5rem] md:h-[5.5rem] lg:h-[7.5rem] gap-2 sm:gap-2.5">
           <button onClick={() => handleRunClick(5)} className="flex-1 rounded-[8px] sm:rounded-xl ring-1 ring-white/10 shadow-lg bg-gradient-to-b from-[#2a303c] to-[#12161f] text-white font-sans text-xs w-full transition-colors active:scale-95">5</button>
           <button onClick={() => handleRunClick(7)} className="flex-1 rounded-[8px] sm:rounded-xl ring-1 ring-white/10 shadow-lg bg-gradient-to-b from-[#2a303c] to-[#12161f] text-white font-sans text-xs w-full transition-colors active:scale-95">7</button>
        </div>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onWicket}
          className="relative flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-red-500 to-red-700 rounded-[1.25rem] shadow-[0_8px_25px_rgba(239,68,68,0.4)] text-white w-full border border-red-400 overflow-hidden group h-[3.5rem] md:h-[5.5rem] lg:h-[7.5rem]"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.3),transparent)] -translate-x-[150%] animate-[shimmer_2s_infinite]" />
          <img src="/icons/wicket.png" alt="Wicket" className="w-4 h-4 sm:w-6 sm:h-6 object-contain opacity-90 drop-shadow-md brightness-0 invert" />
          <span className="font-sans font-black tracking-widest text-[12px] sm:text-[15px] drop-shadow-md leading-none">OUT</span>
        </motion.button>

        {/* ROW 3: Extras */}
        <ActionBtn label="WIDE" onClick={() => toggleExtra('WD')} active={activeExtra === 'WD'} colorClass="bg-gradient-to-br from-blue-700 to-indigo-900 text-white shadow-[0_8px_20px_rgba(29,78,216,0.25)] ring-blue-500/30" className="h-[4.25rem] md:h-[6rem] lg:h-[8.5rem] text-[13px] md:text-[15px] font-sans font-black tracking-widest" />
        <ActionBtn label="NO BALL" onClick={() => toggleExtra('NB')} active={activeExtra === 'NB'} colorClass="bg-gradient-to-br from-blue-700 to-indigo-900 text-white shadow-[0_8px_20px_rgba(29,78,216,0.25)] ring-blue-500/30" className="h-[4.25rem] md:h-[6rem] lg:h-[8.5rem] text-[11px] md:text-[13px] font-sans font-black tracking-widest leading-tight px-2 text-center" />
        <ActionBtn label="BYES" onClick={() => toggleExtra('B')} active={activeExtra === 'B'} colorClass="bg-gradient-to-br from-blue-700 to-indigo-900 text-white shadow-[0_8px_20px_rgba(29,78,216,0.25)] ring-blue-500/30" className="h-[4.25rem] md:h-[6rem] lg:h-[8.5rem] text-[13px] md:text-[15px] font-sans font-black tracking-widest" />
        <ActionBtn label="LEG BYE" onClick={() => toggleExtra('LB')} active={activeExtra === 'LB'} colorClass="bg-gradient-to-br from-blue-700 to-indigo-900 text-white shadow-[0_8px_20px_rgba(29,78,216,0.25)] ring-blue-500/30" className="h-[4.25rem] md:h-[6rem] lg:h-[8.5rem] text-[11px] md:text-[13px] font-sans font-black tracking-widest leading-tight text-center" />
      </div>
    </div>
  );
}
