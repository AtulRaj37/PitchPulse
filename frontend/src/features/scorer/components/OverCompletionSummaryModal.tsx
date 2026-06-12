import React from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import clsx from 'clsx';

export interface OverBallStat {
  label: string;
  isBoundary: boolean;
  isWicket: boolean;
  isExtra: boolean;
  extraType?: string;
}

export interface OverCompletionSummaryModalProps {
  overNumber: number;
  bowlerName: string;
  balls: OverBallStat[];
  runsThisOver: number;
  wicketsThisOver: number;
  extrasThisOver: number;
  teamScore: string;
  striker: { name: string; runs: number; balls: number };
  nonStriker: { name: string; runs: number; balls: number };
  bowlerStats: { overs: number; maidens: number; runs: number; wickets: number; balls: number };
  onStartNextOver: () => void;
  onContinueThisOver: () => void;
}

export function OverCompletionSummaryModal({
  overNumber,
  bowlerName,
  balls,
  runsThisOver,
  wicketsThisOver,
  extrasThisOver,
  teamScore,
  striker,
  nonStriker,
  bowlerStats,
  onStartNextOver,
  onContinueThisOver
}: OverCompletionSummaryModalProps) {
  
  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center items-center bg-black/95 backdrop-blur-2xl md:p-8 pb-0">
      
      {/* Cinematic Modal Container */}
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        className="w-full max-w-[95vw] md:max-w-5xl bg-[#030303] border-t md:border border-white/10 rounded-t-[2.5rem] md:rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] pb-safe relative flex flex-col"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-1/2 h-40 bg-emerald-500/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] pointer-events-none" />

        {/* =========================================
            HEADER & TIMELINE ROW (Top Bar)
        ========================================= */}
        <div className="w-full flex items-stretch border-b border-white/10 relative z-10 flex-col md:flex-row">
          
          {/* Title Area */}
          <div className="p-6 md:p-8 md:w-1/3 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/10 bg-white/5 md:bg-transparent">
            <h2 className="text-4xl md:text-5xl font-black font-clash text-white uppercase tracking-tighter mb-1">
              Over <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">{overNumber}</span>
            </h2>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] md:text-[11px] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Over Summary
            </p>
          </div>

          {/* Timeline Area */}
          <div className="p-6 md:p-8 flex-1 flex flex-col justify-center bg-[#050505]">
            <span className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mb-3 hidden md:block">Delivery Timeline</span>
            <div className="flex flex-wrap items-center gap-2.5 md:gap-4">
              {balls.map((b, idx) => (
                 <div key={idx} className="relative flex flex-col items-center">
                    <div 
                      className={clsx(
                        "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black font-clash text-lg md:text-2xl shadow-[0_0_15px_transparent] transition-all",
                        b.isWicket ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]" :
                        b.isBoundary ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]" :
                        b.isExtra ? (b.extraType === 'WD' ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400" : "bg-white/10 border border-white/20 text-white") :
                        "bg-zinc-900 border border-white/10 text-white"
                      )}
                    >
                      {b.isWicket ? 'W' : b.label}
                    </div>
                    {b.isExtra && b.extraType && (
                       <span className="absolute -bottom-5 text-[9px] md:text-[10px] font-black text-emerald-400 uppercase tracking-widest">{b.extraType}</span>
                    )}
                 </div>
              ))}
              {balls.length > 0 && balls.length < 6 && (
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-dashed border-white/10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse" />
                </div>
              )}
              {balls.length === 0 && (
                 <span className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Awaiting First Delivery</span>
              )}
            </div>
          </div>
        </div>

        {/* =========================================
            DATA GRID (Main Content)
        ========================================= */}
        <div className="w-full flex flex-col lg:flex-row relative z-10">
          
          {/* LEFT: Core Metrics */}
          <div className="lg:w-1/3 p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 md:gap-6 mb-8 lg:mb-0">
              
              {/* Massive Runs Box */}
              <div className="col-span-2 bg-[#0a0a0a] border border-white/10 rounded-[1.5rem] p-6 flex items-end justify-between overflow-hidden relative group">
                <div className="w-32 h-32 absolute -right-10 -bottom-10 bg-white/5 rounded-full blur-[20px] group-hover:bg-emerald-500/10 transition-colors" />
                <div className="flex flex-col relative z-10">
                  <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] md:text-[11px] mb-1">Runs Scored</span>
                  <span className="text-6xl md:text-8xl font-black font-clash text-white tracking-tighter leading-none">{runsThisOver}</span>
                </div>
              </div>

              {/* Smaller Metrics */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-[1rem] p-4 flex flex-col items-center justify-center">
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mb-1">Wickets</span>
                <span className={clsx("text-3xl md:text-4xl font-black font-clash", wicketsThisOver > 0 ? "text-red-500" : "text-white")}>{wicketsThisOver}</span>
              </div>
              <div className="bg-[#0a0a0a] border border-white/10 rounded-[1rem] p-4 flex flex-col items-center justify-center">
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mb-1">Extras</span>
                <span className="text-3xl md:text-4xl font-black font-clash text-zinc-300">{extrasThisOver}</span>
              </div>

            </div>

            {/* Total Team Score Overlay */}
            <div className="hidden lg:flex flex-col mt-8 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-[1rem]">
              <span className="text-emerald-500/70 font-bold uppercase tracking-widest text-[10px] mb-1">Total Score Update</span>
              <span className="text-4xl font-black font-clash text-emerald-400 tracking-tighter">{teamScore}</span>
            </div>
          </div>

          {/* RIGHT: Player Terminal */}
          <div className="lg:w-2/3 p-6 md:p-8 flex flex-col justify-between bg-[#050505]">
            <span className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mb-4">Live Player Stats</span>
            
            <div className="flex flex-col gap-3">
              {/* Striker Panel */}
              <div className="flex justify-between items-center px-6 py-5 bg-[#0a0a0a] border border-white/5 hover:border-emerald-500/30 transition-colors rounded-2xl relative overflow-hidden group">
                 <div className="absolute left-0 top-0 w-1.5 h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                 <div className="flex items-center gap-4 pl-3">
                    <span className="font-clash font-black text-xs text-emerald-500">P1</span>
                    <span className="font-black font-clash text-white uppercase tracking-tight text-xl md:text-2xl">{striker.name}</span>
                 </div>
                 <span className="text-2xl md:text-3xl font-black font-clash text-white">{striker.runs}<span className="text-sm text-zinc-500 ml-1.5 font-sans font-bold">({striker.balls})</span></span>
              </div>
              
              {/* Non-Striker Panel */}
              <div className="flex justify-between items-center px-6 py-5 bg-[#0a0a0a] border border-white/5 hover:border-white/20 transition-colors rounded-2xl relative group">
                 <div className="absolute left-0 top-0 w-[2px] h-full bg-white/20" />
                 <div className="flex items-center gap-4 pl-3">
                    <span className="font-clash font-black text-xs text-zinc-600">P2</span>
                    <span className="font-black font-clash text-zinc-400 uppercase tracking-tight text-xl md:text-2xl">{nonStriker.name}</span>
                 </div>
                 <span className="text-2xl md:text-3xl font-black font-clash text-zinc-400">{nonStriker.runs}<span className="text-sm text-zinc-600 ml-1.5 font-sans font-bold">({nonStriker.balls})</span></span>
              </div>

              {/* Bowler Details Panel */}
              <div className="flex justify-between items-center px-6 py-5 bg-red-500/5 border border-red-500/10 rounded-2xl relative mt-4">
                 <div className="absolute right-0 top-0 w-32 h-full bg-red-500/5 blur-[20px]" />
                 <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 z-10 w-full justify-between">
                    <div className="flex items-center gap-4">
                      <span className="font-clash font-black text-xs text-red-500">BOWLER</span>
                      <span className="font-black font-clash text-white uppercase tracking-tight text-lg md:text-xl">{bowlerName}</span>
                    </div>
                    
                    <div className="flex items-center gap-6 mt-3 md:mt-0 bg-[#030303] md:bg-transparent px-4 py-2 border border-white/5 md:border-none md:p-0 rounded-lg">
                      <div className="flex flex-col md:items-center">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Overs</span>
                        <span className="text-lg font-black font-clash text-white">{Math.floor(bowlerStats.balls / 6)}.{bowlerStats.balls % 6}</span>
                      </div>
                      <div className="w-[1px] h-6 bg-white/10" />
                      <div className="flex flex-col md:items-center">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Maidens</span>
                        <span className="text-lg font-black font-clash text-white">{bowlerStats.maidens}</span>
                      </div>
                      <div className="w-[1px] h-6 bg-white/10" />
                      <div className="flex flex-col md:items-center">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Runs</span>
                        <span className="text-lg font-black font-clash text-red-400">{bowlerStats.runs}</span>
                      </div>
                      <div className="w-[1px] h-6 bg-white/10" />
                      <div className="flex flex-col md:items-center">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Wickets</span>
                        <span className="text-lg font-black font-clash text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">{bowlerStats.wickets}</span>
                      </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Action Bar (Bottom Right) */}
            <div className="flex flex-col md:flex-row items-center gap-4 mt-8 pt-6 border-t border-white/10 w-full relative z-10">
              <button 
                onClick={onStartNextOver}
                className="w-full md:w-2/3 bg-emerald-500 text-black font-black font-clash uppercase tracking-widest text-sm md:text-lg py-5 px-6 rounded-[1rem] hover:bg-emerald-400 transition-all hover:scale-[1.01] shadow-[0_0_30px_rgba(16,185,129,0.2)] flex justify-between items-center group"
              >
                <span>Start Next Over</span>
                <span className="text-black/50 group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button 
                onClick={onContinueThisOver}
                className="w-full md:w-1/3 bg-transparent text-zinc-500 border border-white/10 font-bold uppercase tracking-widest py-5 px-6 rounded-[1rem] hover:text-white hover:bg-white/5 hover:border-white/20 transition-all text-[10px] md:text-xs"
              >
                Cancel / Edit
              </button>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
