import React from 'react';
import { Trophy, Circle } from 'lucide-react';
import clsx from 'clsx';

interface ScorecardHeaderProps {
  team1: any;
  team2: any;
  team1Innings?: any;
  team2Innings?: any;
  venue: string;
  matchDate: string;
  status: string;
  matchData?: any;
}

export function ScorecardHeader({ team1, team2, team1Innings, team2Innings, venue, matchDate, status, matchData }: ScorecardHeaderProps) {
  
  const getTossString = () => {
    if (!matchData?.tossWinnerId || !matchData?.tossDecision) return null;
    const winnerName = matchData.tossWinnerId === team1.id ? team1.name : team2.name;
    const decision = matchData.tossDecision === 'BAT' ? 'bat' : 'field';
    return `Toss: ${winnerName} opt to ${decision}`;
  };

  const getResultString = () => {
    // If complete or abandoned
    if (status === 'COMPLETED') {
        const t1Score = team1Innings?.totalRuns || 0;
        const t2Score = team2Innings?.totalRuns || 0;
        if (t1Score > t2Score) return `${team1.name} won by ${t1Score - t2Score} runs`;
        if (t2Score > t1Score) return `${team2.name} won by ${10 - (team2Innings?.totalWickets || 0)} wickets`;
        return 'Match Tied';
    }
    if (status === 'ABANDONED') return 'Match Abandoned';
    return null;
  };

  return (
    <div className="mb-6 bg-[#0a0f1c] border border-white/10 rounded-2xl p-4 md:p-6 relative overflow-hidden flex flex-col gap-3 shadow-2xl">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-[50%] h-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

      {/* Top Meta Strip */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] md:text-xs tracking-wider">
        <span className="font-bold text-emerald-400 uppercase">PITCHPULSE SERIES</span>
        <span className="text-zinc-600 hidden md:inline">•</span>
        <span className="text-emerald-500/70">{venue}</span>
        <span className="text-zinc-600">•</span>
        <span className="text-zinc-400">Limited Overs, <span className="font-bold text-zinc-300">{matchData?.overs || 10} Ov.</span></span>
        <span className="text-zinc-600">•</span>
        <span className="text-zinc-500">{matchDate}</span>
        
        {status === 'LIVE' && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-black text-red-500 tracking-widest uppercase">LIVE</span>
          </div>
        )}
      </div>

      {/* Toss Strip */}
      {getTossString() && (
        <div className="text-xs text-zinc-500 tracking-wide">
          {getTossString()}
        </div>
      )}

      {/* Main Team Scores Section */}
      <div className="flex flex-col gap-3 mt-2 border-t border-b border-white/5 py-4 relative z-10">
        
        {/* TEAM 1 ROW */}
        <div className="flex justify-between items-center group">
          <div className="text-sm md:text-base font-black font-clash tracking-wide uppercase text-white group-hover:text-emerald-400 transition-colors">
            {team1.name}
          </div>
          <div className="flex items-baseline gap-2 text-right">
            {team1Innings ? (
               <>
                 <span className="text-2xl md:text-3xl font-black font-clash text-white">
                   {team1Innings.totalRuns}<span className="text-lg md:text-xl text-zinc-500">/{team1Innings.totalWickets}</span>
                 </span>
                 <span className="text-[10px] md:text-xs text-zinc-500 font-jetbrains w-16 text-left">
                   ({Math.floor(team1Innings.overs)}.{Math.round((team1Innings.overs % 1) * 10)} Ov)
                 </span>
               </>
            ) : (
                <span className="text-sm font-bold text-zinc-600">Yet to bat</span>
            )}
          </div>
        </div>

        {/* TEAM 2 ROW */}
        <div className="flex justify-between items-center group">
          <div className="text-sm md:text-base font-black font-clash tracking-wide uppercase text-zinc-300 group-hover:text-cyan-400 transition-colors">
            {team2.name}
          </div>
          <div className="flex items-baseline gap-2 text-right">
            {team2Innings ? (
               <>
                 <span className="text-2xl md:text-3xl font-black font-clash text-zinc-300">
                   {team2Innings.totalRuns}<span className="text-lg md:text-xl text-zinc-600">/{team2Innings.totalWickets}</span>
                 </span>
                 <span className="text-[10px] md:text-xs text-zinc-500 font-jetbrains w-16 text-left">
                   ({Math.floor(team2Innings.overs)}.{Math.round((team2Innings.overs % 1) * 10)} Ov)
                 </span>
               </>
            ) : (
                <span className="text-sm font-bold text-zinc-600">Yet to bat</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Result Footer */}
      {(getResultString() || (status === 'LIVE' && team2Innings)) && (
        <div className="text-sm font-bold text-zinc-400 tracking-wide pt-1 flex items-center gap-2">
            {getResultString() || `Target: ${team1Innings?.totalRuns ? team1Innings.totalRuns + 1 : '-'}`}
        </div>
      )}

    </div>
  );
}
