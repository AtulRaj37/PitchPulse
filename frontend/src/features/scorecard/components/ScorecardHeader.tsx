import React from 'react';
import { Trophy } from 'lucide-react';

interface ScorecardHeaderProps {
  team1: any;
  team2: any;
  team1Innings?: any;
  team2Innings?: any;
  venue: string;
  matchDate: string;
  status: string;
}

export function ScorecardHeader({ team1, team2, team1Innings, team2Innings, venue, matchDate, status }: ScorecardHeaderProps) {
  return (
    <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
      
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <Trophy className="w-4 h-4 text-emerald-400" />
        <span className="text-emerald-400 font-bold tracking-wide text-sm">{status}</span>
        <span className="ml-auto text-xs font-bold text-zinc-500 uppercase tracking-widest">{venue} • {matchDate}</span>
      </div>

      <div className="flex justify-between items-end border-b border-white/5 pb-4 mb-4 relative z-10">
        <div className="flex-1">
          <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">{team1.shortName || team1.name}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black font-clash text-white">{team1Innings?.totalRuns ?? '-'}</span>
            <span className="text-xl text-zinc-500 font-bold">/{team1Innings?.totalWickets ?? '-'}</span>
          </div>
          <div className="text-zinc-500 text-xs font-bold font-jetbrains mt-1">
            {team1Innings ? `${Math.floor(team1Innings.overs)}.${Math.round((team1Innings.overs % 1) * 10)} Overs` : 'Yet to bat'}
          </div>
        </div>
        
        <div className="text-center px-4 mb-2">
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/5">VS</span>
        </div>

        <div className="text-right flex-1">
          <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">{team2.shortName || team2.name}</div>
          <div className="flex items-baseline gap-2 justify-end">
            <span className="text-4xl font-black font-clash text-zinc-300">{team2Innings?.totalRuns ?? '-'}</span>
            <span className="text-xl text-zinc-600 font-bold">/{team2Innings?.totalWickets ?? '-'}</span>
          </div>
          <div className="text-zinc-500 text-xs font-bold font-jetbrains mt-1">
            {team2Innings ? `${Math.floor(team2Innings.overs)}.${Math.round((team2Innings.overs % 1) * 10)} Overs` : 'Yet to bat'}
          </div>
        </div>
      </div>
      
      {/* Target Info (Optional) */}
      {team2Innings && team1Innings && status !== 'COMPLETED' && (
        <div className="text-center text-xs font-bold text-cyan-400 tracking-widest uppercase bg-cyan-500/10 py-2 rounded-lg border border-cyan-500/20">
          Target: {team1Innings.totalRuns + 1}
        </div>
      )}
    </div>
  );
}
