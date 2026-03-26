import React from 'react';
import { Trophy, Star, Target, Shield } from 'lucide-react';

interface TabHeroesProps {
  matchData: any;
}

export function TabHeroes({ matchData }: TabHeroesProps) {
  const { innings } = matchData || {};

  if (!innings || innings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#0e1424]/80 backdrop-blur-md rounded-2xl border border-white/5">
        <Star className="text-zinc-600 mb-4 w-10 h-10" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Heroes will be revealed soon</p>
      </div>
    );
  }

  // Aggregate all players
  let allBatters: any[] = [];
  let allBowlers: any[] = [];

  innings.forEach((inning: any) => {
    if (inning.battingStats) allBatters.push(...inning.battingStats);
    if (inning.bowlingStats) allBowlers.push(...inning.bowlingStats);
  });

  // Calculate MVP
  const playerScores = new Map<string, { player: any, points: number, runs: number, wickets: number }>();
  
  allBatters.forEach(b => {
      const pid = b.playerId;
      if (!playerScores.has(pid)) playerScores.set(pid, { player: b.player, points: 0, runs: 0, wickets: 0 });
      const current = playerScores.get(pid)!;
      current.runs += b.runs;
      current.points += b.runs; // 1 pt per run
      current.points += b.sixes * 2; // bonus for sixes
      current.points += b.fours * 1; // bonus for fours
      playerScores.set(pid, current);
  });

  allBowlers.forEach(b => {
      const pid = b.playerId;
      if (!playerScores.has(pid)) playerScores.set(pid, { player: b.player, points: 0, runs: 0, wickets: 0 });
      const current = playerScores.get(pid)!;
      current.wickets += b.wickets;
      current.points += (b.wickets * 25); // 25 pts per wicket
      current.points += (b.maidens * 10); // 10 pts per maiden
      if (b.wickets >= 3) current.points += 20; // 3-fer bonus
      playerScores.set(pid, current);
  });

  const playersArr = Array.from(playerScores.values()).filter(p => p.player);
  
  const mvp = [...playersArr].sort((a, b) => b.points - a.points)[0];
  const bestBatter = [...allBatters].sort((a, b) => b.runs - a.runs)[0];
  const bestBowler = [...allBowlers].sort((a, b) => {
      if (b.wickets !== a.wickets) return b.wickets - a.wickets;
      return a.runs - b.runs; // Tiebreaker: fewer runs conceded
  })[0];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Player of the Match Ribbon */}
      {mvp && (
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 via-[#0a0f1c] to-[#0a0f1c] border border-amber-500/30 rounded-2xl p-6 shadow-2xl group">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/10 blur-[50px] rounded-full group-hover:bg-amber-500/20 transition-colors pointer-events-none"></div>
           <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-6 relative z-10">
              
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 p-1 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                    <div className="w-full h-full bg-[#0a0f1c] rounded-full flex items-center justify-center">
                       <Trophy className="w-8 h-8 text-amber-500" />
                    </div>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-widest text-amber-500 mb-1">Player of the Match</span>
                    <span className="text-2xl md:text-3xl font-black font-clash text-white tracking-wide">{mvp.player?.name}</span>
                    <span className="text-sm font-bold text-zinc-400 mt-1">{mvp.points} Impact Points</span>
                 </div>
              </div>

              <div className="flex gap-4 bg-black/40 p-4 rounded-xl border border-white/5 w-full md:w-auto">
                 <div className="flex flex-col items-center px-4">
                    <span className="text-2xl font-black text-amber-400">{mvp.runs}</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Runs</span>
                 </div>
                 <div className="w-px bg-white/10"></div>
                 <div className="flex flex-col items-center px-4">
                    <span className="text-2xl font-black text-amber-400">{mvp.wickets}</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Wickets</span>
                 </div>
              </div>

           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        
        {/* Best Batter */}
        {bestBatter && (
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-[#0a0f1c] border border-emerald-500/20 rounded-2xl p-6 shadow-xl group">
             <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full group-hover:bg-emerald-500/20 transition-colors pointer-events-none"></div>
             
             <div className="flex items-center gap-2 mb-6">
                <Star className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Best Batter</span>
             </div>

             <div className="flex justify-between items-end relative z-10 border-b border-white/5 pb-6">
                <div className="flex flex-col">
                   <span className="text-xl font-black font-clash text-white">{bestBatter.player?.name}</span>
                   <span className="text-xs font-bold text-zinc-500 mt-1 uppercase tracking-widest">Strike Rate: {bestBatter.balls > 0 ? ((bestBatter.runs/bestBatter.balls)*100).toFixed(1) : 0}</span>
                </div>
                <div className="flex items-baseline gap-1">
                   <span className="text-4xl font-black text-emerald-400">{bestBatter.runs}</span>
                   <span className="text-sm font-bold text-zinc-500">({bestBatter.balls})</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Boundaries</span>
                   <span className="text-lg font-bold text-zinc-300">{bestBatter.fours} x 4s</span>
                </div>
                <div className="flex flex-col text-right">
                   <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Maximums</span>
                   <span className="text-lg font-bold text-zinc-300">{bestBatter.sixes} x 6s</span>
                </div>
             </div>
          </div>
        )}

        {/* Best Bowler */}
        {bestBowler && (
          <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500/10 to-[#0a0f1c] border border-cyan-500/20 rounded-2xl p-6 shadow-xl group">
             <div className="absolute -left-8 -top-8 w-32 h-32 bg-cyan-500/10 blur-[40px] rounded-full group-hover:bg-cyan-500/20 transition-colors pointer-events-none"></div>
             
             <div className="flex items-center gap-2 mb-6 relative z-10">
                <Target className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-black uppercase tracking-widest text-cyan-400">Best Bowler</span>
             </div>

             <div className="flex justify-between items-end relative z-10 border-b border-white/5 pb-6">
                <div className="flex flex-col">
                   <span className="text-xl font-black font-clash text-white">{bestBowler.player?.name}</span>
                   <span className="text-xs font-bold text-zinc-500 mt-1 uppercase tracking-widest">Economy: {bestBowler.overs > 0 ? (bestBowler.runs/bestBowler.overs).toFixed(1) : 0}</span>
                </div>
                <div className="flex items-baseline gap-1">
                   <span className="text-4xl font-black text-cyan-400">{bestBowler.wickets}</span>
                   <span className="text-sm font-bold text-zinc-500">- {bestBowler.runs}</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Overs</span>
                   <span className="text-lg font-bold text-zinc-300">{bestBowler.overs}</span>
                </div>
                <div className="flex flex-col text-right">
                   <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Maidens</span>
                   <span className="text-lg font-bold text-zinc-300">{bestBowler.maidens || 0}</span>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
