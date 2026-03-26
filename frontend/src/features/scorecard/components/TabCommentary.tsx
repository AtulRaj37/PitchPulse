import React from 'react';
import { MessageSquareText } from 'lucide-react';
import clsx from 'clsx';

interface TabCommentaryProps {
  matchData: any;
}

export function TabCommentary({ matchData }: TabCommentaryProps) {
  const events = matchData?.events 
    ? [...matchData.events]
        .filter((e: any) => {
          if (['RUN_SCORED', 'BATSMAN_OUT', 'BOUNDARY_SCORED', 'SIX_SCORED'].includes(e.eventType)) return false;
          
          if (e.eventType === 'BALL_BOWLED' && e.payload?.runs === 0) {
            const hasWicket = matchData.events.some((sibling: any) => 
              sibling.eventType === 'WICKET_FELL' &&
              Number(sibling.overNumber) === Number(e.overNumber) &&
              Number(sibling.ballNumber) === Number(e.ballNumber)
            );
            if (hasWicket) return false;
          }
          
          return true;
        })
        .sort((a: any, b: any) => b.sequenceNumber - a.sequenceNumber) 
    : [];

  if (events.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-[#0a0f1c]/50">
        <MessageSquareText className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs">No commentary available</p>
        <p className="text-zinc-600 text-xs mt-1">Match events haven't started yet.</p>
      </div>
    );
  }

  const renderEventLabel = (payload: any, type: string) => {
    if (type === 'WICKET_FELL') return { label: 'W', color: 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' };
    if (type === 'BALL_BOWLED' && payload.runs === 4) return { label: '4', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' };
    if (type === 'BALL_BOWLED' && payload.runs === 6) return { label: '6', color: 'bg-emerald-400 text-black shadow-[0_0_15px_rgba(52,211,153,0.4)]' };
    if (type === 'WIDE_BALL') return { label: 'WD', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/50' };
    if (type === 'NO_BALL') return { label: 'NB', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/50' };
    if (type === 'BYE') return { label: 'B', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/50' };
    if (type === 'LEG_BYE') return { label: 'LB', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/50' };
    if (type === 'BALL_BOWLED' && payload.runs === 0) return { label: '0', color: 'bg-zinc-800 text-zinc-400 border border-zinc-700' };
    
    // Default Run
    return { label: payload.runs?.toString() || '-', color: 'bg-zinc-800 text-zinc-200 border border-zinc-700' };
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const getCommentaryText = (e: any) => {
    if (e.eventType === 'OVER_COMPLETED') return <span className="text-amber-500 font-bold tracking-wide">{e.overNumber !== undefined ? `${getOrdinal(e.overNumber + 1)} over completed.` : 'End of Over.'}</span>;
    if (e.eventType === 'WICKET_FELL') {
      const mode = (e.payload.wicketType || e.payload.dismissalMode || 'Out').replace(/_/g, ' ');
      return <span className="text-rose-200 font-bold">WICKET! ({mode}) The bowler strikes.</span>;
    }
    if (e.eventType === 'MATCH_STARTED') return <span className="text-emerald-400 font-bold">Let's Play! The match has officially begun.</span>;
    if (e.eventType === 'INNINGS_COMPLETED') return <span className="text-amber-400 font-bold">Innings comes to a close.</span>;
    
    if (e.eventType === 'BALL_BOWLED') {
      if (e.payload.runs === 4) return <span className="text-emerald-400">Smash! That's a boundary. Four runs.</span>;
      if (e.payload.runs === 6) return <span className="text-emerald-400 font-black tracking-wide">HUGE! That's out of the park for a SIX.</span>;
      if (e.payload.runs === 0) return <span className="text-zinc-400">Dot ball. Nicely bowled.</span>;
      return <span className="text-zinc-300">{e.payload.runs} run{e.payload.runs > 1 ? 's' : ''} pushed into the gap.</span>;
    }
    
    if (['WIDE_BALL', 'NO_BALL', 'BYE', 'LEG_BYE'].includes(e.eventType)) {
       return <span className="text-blue-300">Extra delivered: {e.eventType.replace('_BALL', '').replace('_', ' ')}</span>;
    }
    
    return <span className="text-zinc-500 text-xs italic">System Record: {e.eventType}</span>;
  };

  return (
    <div className="bg-[#0e1424]/50 border border-white/5 rounded-2xl p-4 md:p-6 shadow-xl animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
        <MessageSquareText className="w-5 h-5 text-cyan-500" />
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Ball by Ball Commentary</h3>
      </div>
      
      <div className="flex flex-col gap-5">
        {events.map((e: any, idx: number) => {
          
          const isSystem = ['MATCH_STARTED', 'INNINGS_COMPLETED', 'INNINGS_STARTED', 'MATCH_COMPLETED', 'OVER_COMPLETED'].includes(e.eventType);
          
          if (isSystem) {
             return (
               <div key={e.id} className={clsx("flex gap-4 items-center pl-6 py-2 border-l-2", e.eventType === 'OVER_COMPLETED' ? "border-amber-500/30" : "border-emerald-500/30")}>
                 <div className={clsx("w-2 h-2 rounded-full", e.eventType === 'OVER_COMPLETED' ? "bg-amber-500" : "bg-emerald-500")}></div>
                 <div className="font-bold text-sm tracking-widest uppercase text-emerald-400/80">{getCommentaryText(e)}</div>
               </div>
             );
          }

          const { label, color } = renderEventLabel(e.payload, e.eventType);

          return (
            <div key={e.id} className="flex gap-4 items-start group">
              <div className={clsx(
                "w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-black font-clash text-lg shadow-sm transition-transform group-hover:scale-105", 
                color
              )}>
                {label}
              </div>
              <div className="pt-1 border-b border-white/[0.02] pb-4 flex-1">
                <div className="text-[10px] font-bold text-zinc-500 tracking-wider mb-1">
                  {e.overNumber !== undefined && e.ballNumber !== undefined && e.ballNumber >= 0
                    ? `OVER ${e.overNumber}.${e.ballNumber + 1}` 
                    : `EVENT ${e.sequenceNumber}`}
                </div>
                <div className="text-sm md:text-base leading-relaxed">{getCommentaryText(e)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
