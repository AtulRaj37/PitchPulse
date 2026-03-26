'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MoreVertical, Undo2, RotateCcw } from 'lucide-react';
import Link from 'next/link';

// Helper for over math
const formatOvers = (totalBalls: number) => {
  const completeOvers = Math.floor(totalBalls / 6);
  const legalBalls = totalBalls % 6;
  return `${completeOvers}.${legalBalls}`;
};

export default function LiveScorerPage({ params }: { params: { id: string } }) {
  // --- MOCK REAL-TIME MATCH STATE ---
  const [teamBatting, setTeamBatting] = useState("Mumbai Warriors");
  const [teamBowling, setTeamBowling] = useState("Delhi Dynamite");
  
  // Match Totals
  const [runs, setRuns] = useState(142);
  const [wickets, setWickets] = useState(4);
  const [balls, setBalls] = useState(75); // 12.3 overs
  
  // Players
  const [striker, setStriker] = useState({ name: 'Rohit Verma', runs: 67, balls: 42, fours: 4, sixes: 2 });
  const [nonStriker, setNonStriker] = useState({ name: 'Suresh Kumar', runs: 23, balls: 18, fours: 3, sixes: 1 });
  const [bowler, setBowler] = useState({ name: 'Ashwin Hassan', balls: 27, runs: 32, wkts: 2 });
  
  // Context
  const [recentBalls, setRecentBalls] = useState(['1', '1', 'W', '4', '0', '1']);
  const [isStrikerTurn, setIsStrikerTurn] = useState(true);

  // Derived Calculations
  const oversFormatted = formatOvers(balls);
  const runRate = balls === 0 ? "0.00" : (runs / (balls / 6)).toFixed(2);
  
  const activeBatsman = isStrikerTurn ? striker : nonStriker;
  const passiveBatsman = isStrikerTurn ? nonStriker : striker;

  const strikerSR = striker.balls === 0 ? "0.0" : ((striker.runs / striker.balls) * 100).toFixed(1);
  const nonStrikerSR = nonStriker.balls === 0 ? "0.0" : ((nonStriker.runs / nonStriker.balls) * 100).toFixed(1);
  
  const bowlerOvers = formatOvers(bowler.balls);
  const economy = bowler.balls === 0 ? "0.0" : (bowler.runs / (bowler.balls / 6)).toFixed(1);

  // --- SCORING LOGIC ---
  const handleBall = (runsScored: number, isWicket: boolean = false, isExtra: boolean = false, extraType: string = "") => {
    // 1. Update Match Totals
    setRuns(prev => prev + runsScored);
    
    let isLegalDelivery = true;
    if (extraType === 'WD' || extraType === 'NB') {
      isLegalDelivery = false;
    }

    if (isLegalDelivery) {
      setBalls(prev => prev + 1);
    }
    
    if (isWicket) {
      setWickets(prev => prev + 1);
    }

    // 2. Update Bowler
    setBowler(prev => ({
      ...prev,
      balls: isLegalDelivery ? prev.balls + 1 : prev.balls,
      runs: prev.runs + runsScored,
      wkts: isWicket ? prev.wkts + 1 : prev.wkts
    }));

    // 3. Update Striker
    if (!isExtra || extraType === 'NB') {
      const runCredit = isExtra ? runsScored - 1 : runsScored; // If No Ball + 1 run from bat = 1 to batsman
      if (isStrikerTurn) {
        setStriker(prev => ({
          ...prev,
          runs: prev.runs + runCredit,
          balls: isLegalDelivery || extraType === 'NB' ? prev.balls + 1 : prev.balls,
          fours: runCredit === 4 ? prev.fours + 1 : prev.fours,
          sixes: runCredit === 6 ? prev.sixes + 1 : prev.sixes
        }));
      } else {
        setNonStriker(prev => ({
          ...prev,
          runs: prev.runs + runCredit,
          balls: isLegalDelivery || extraType === 'NB' ? prev.balls + 1 : prev.balls,
          fours: runCredit === 4 ? prev.fours + 1 : prev.fours,
          sixes: runCredit === 6 ? prev.sixes + 1 : prev.sixes
        }));
      }
    }

    // 4. Update Recent Balls Widget
    let ballLabel = runsScored.toString();
    if (isWicket) ballLabel = 'W';
    if (extraType) ballLabel = `${runsScored}${extraType}`;
    
    setRecentBalls(prev => {
      const newRecent = [...prev, ballLabel];
      if (newRecent.length > 6) newRecent.shift();
      return newRecent;
    });

    // 5. Rotate Strike (Odd runs)
    if (runsScored % 2 !== 0 && !isWicket) {
      setIsStrikerTurn(!isStrikerTurn);
    }

    // 6. Over change logic (Rotate strike at end of over)
    if (isLegalDelivery && (balls + 1) % 6 === 0) {
      setIsStrikerTurn(current => !current); // Swaps again since odd runs already swapped them, effectively handling over-change rotations
      // In a real app we'd prompt for a new bowler here.
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col max-w-lg mx-auto border-x border-white/5 relative shadow-2xl overflow-hidden">
      
      {/* HEADER */}
      <header className="px-4 py-4 flex items-center justify-between border-b border-white/10 bg-white/[0.02]">
        <Link href={`/match/${params.id}/scorecard`}>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
        </Link>
        <div className="text-center">
          <h1 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Match {params.id.slice(0, 4)} Score</h1>
          <div className="text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            LIVE
          </div>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      {/* CORE MATCH DISPLAY HUD */}
      <div className="p-4 flex flex-col flex-1 pb-40">
        
        {/* TOP SCORE DISPLAY */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{teamBatting}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black font-clash">{runs}</span>
                <span className="text-2xl text-zinc-500 font-bold">/{wickets}</span>
              </div>
            </div>
            <div className="text-right pb-1">
              <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Overs</div>
              <div className="text-3xl font-black font-jetbrains text-emerald-400">{oversFormatted}</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm font-medium pt-4 border-t border-white/5">
            <div className="text-zinc-400">Run Rate: <span className="text-white font-bold">{runRate}</span></div>
            <div className="text-zinc-400">Target: <span className="text-white font-bold">-</span></div>
          </div>
        </div>

        {/* BATSMAN STATS */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-12 text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 px-2">
            <div className="col-span-6">Batsman</div>
            <div className="col-span-2 text-right">R</div>
            <div className="col-span-2 text-right">B</div>
            <div className="col-span-2 text-right">SR</div>
          </div>
          
          {/* Striker */}
          <div className={`grid grid-cols-12 items-center px-2 py-3 rounded-xl mb-1 ${isStrikerTurn ? 'bg-emerald-500/10 border border-emerald-500/20' : ''}`}>
            <div className="col-span-6 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isStrikerTurn ? 'bg-emerald-500' : 'bg-transparent'}`}></span>
              <span className={`text-sm font-bold truncate ${isStrikerTurn ? 'text-white' : 'text-zinc-400'}`}>{striker.name}</span>
            </div>
            <div className="col-span-2 text-right font-black text-rose-100">{striker.runs}</div>
            <div className="col-span-2 text-right text-zinc-400 font-medium font-jetbrains">{striker.balls}</div>
            <div className="col-span-2 text-right text-zinc-400 font-medium font-jetbrains">{strikerSR}</div>
          </div>
          
          {/* Non-Striker */}
          <div className={`grid grid-cols-12 items-center px-2 py-3 rounded-xl ${!isStrikerTurn ? 'bg-emerald-500/10 border border-emerald-500/20' : ''}`}>
            <div className="col-span-6 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${!isStrikerTurn ? 'bg-emerald-500' : 'bg-transparent'}`}></span>
              <span className={`text-sm font-bold truncate ${!isStrikerTurn ? 'text-white' : 'text-zinc-400'}`}>{nonStriker.name}</span>
            </div>
            <div className="col-span-2 text-right font-black text-rose-100">{nonStriker.runs}</div>
            <div className="col-span-2 text-right text-zinc-400 font-medium font-jetbrains">{nonStriker.balls}</div>
            <div className="col-span-2 text-right text-zinc-400 font-medium font-jetbrains">{nonStrikerSR}</div>
          </div>
        </div>

        {/* BOWLER STATS */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-12 text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 px-2">
            <div className="col-span-6">Bowler</div>
            <div className="col-span-2 text-right">O</div>
            <div className="col-span-2 text-right">R</div>
            <div className="col-span-2 text-right">W</div>
          </div>
          
          <div className="grid grid-cols-12 items-center px-2 py-3">
            <div className="col-span-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span className="text-sm font-bold text-white truncate">{bowler.name}</span>
            </div>
            <div className="col-span-2 text-right text-zinc-300 font-medium font-jetbrains">{bowlerOvers}</div>
            <div className="col-span-2 text-right text-zinc-300 font-medium font-jetbrains">{bowler.runs}</div>
            <div className="col-span-2 text-right text-rose-400 font-black">{bowler.wkts}</div>
          </div>
          <div className="px-2 pt-2 border-t border-white/5 flex justify-between text-xs text-zinc-500 font-medium uppercase tracking-widest">
            <span>Economy</span>
            <span className="text-zinc-300 font-jetbrains">{economy}</span>
          </div>
        </div>

        {/* RECENT BALLS (TIMELINE) */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">This Over</div>
          <div className="flex gap-2">
            <AnimatePresence>
              {recentBalls.map((ball, i) => (
                <motion.div
                  key={`${i}-${ball}`}
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-inner ${
                    ball === 'W' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    ball === '4' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                    ball === '6' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                    'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  {ball}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* UMPIRE ACTION PAD (PINNED TO BOTTOM) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-[#0a0a0a] border-t border-white/10 p-4 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-50">
        
        {/* Controls */}
        <div className="flex justify-between items-center mb-4 px-2">
          <button className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold">
            <Undo2 className="w-4 h-4" />
            Undo
          </button>
          <button className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold">
            <RotateCcw className="w-4 h-4" />
            Swap Strike
          </button>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map(num => (
            <button key={num} onClick={() => handleBall(num)} className="h-14 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-xl font-black text-xl text-white active:scale-95 transition-all">
              {num}
            </button>
          ))}
          <button onClick={() => handleBall(4)} className="h-14 col-span-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl font-black text-2xl text-cyan-400 active:scale-95 transition-all">
            4
          </button>
          <button onClick={() => handleBall(6)} className="h-14 col-span-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl font-black text-2xl text-purple-400 active:scale-95 transition-all">
            6
          </button>
          
          {/* Extras */}
          <button onClick={() => handleBall(1, false, true, "WD")} className="h-12 bg-white/5 hover:bg-white/10 rounded-lg font-bold text-sm text-zinc-300 active:scale-95 transition-all">Wide</button>
          <button onClick={() => handleBall(1, false, true, "NB")} className="h-12 bg-white/5 hover:bg-white/10 rounded-lg font-bold text-sm text-zinc-300 active:scale-95 transition-all">No Ball</button>
          <button onClick={() => handleBall(0, false, true, "B")} className="h-12 bg-white/5 hover:bg-white/10 rounded-lg font-bold text-sm text-zinc-300 active:scale-95 transition-all">Bye</button>
          <button onClick={() => handleBall(0, false, true, "LB")} className="h-12 bg-white/5 hover:bg-white/10 rounded-lg font-bold text-sm text-zinc-300 active:scale-95 transition-all">Leg Bye</button>

          {/* Wicket */}
          <button onClick={() => handleBall(0, true)} className="h-14 col-span-4 bg-rose-500 text-white rounded-xl font-black text-lg shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:bg-rose-400 active:scale-95 transition-all">
            WICKET
          </button>
        </div>
      </div>

    </div>
  );
}
