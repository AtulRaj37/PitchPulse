import React from 'react';
import { Award, Target } from 'lucide-react';

interface TabSummaryProps {
  inning: any;
}

export function TabSummary({ inning }: TabSummaryProps) {
  if (!inning) return <div className="p-8 text-center text-zinc-500">No data available yet</div>;

  // Sorting
  const batters = [...(inning.battingStats || [])].sort((a, b) => b.runs - a.runs).slice(0, 3);
  const bowlers = [...(inning.bowlingStats || [])].sort((a, b) => {
    if (b.wickets !== a.wickets) return b.wickets - a.wickets;
    return a.runs - b.runs;
  }).slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
      
      {/* Top Batters */}
      <div className="bg-[#0e1424]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
          <Award className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Top Performers: Batting</h3>
        </div>
        
        <div className="flex flex-col gap-4">
          {batters.length > 0 ? batters.map((b, i) => (
             <div key={i} className="flex justify-between items-center group">
               <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-[10px] group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                   {i + 1}
                 </div>
                 <div>
                   <div className="font-bold text-sm text-white">{b.player?.name}</div>
                   <div className="text-[10px] text-zinc-500 tracking-wider">SR: {b.balls ? ((b.runs/b.balls)*100).toFixed(1) : 0}</div>
                 </div>
               </div>
               <div className="text-right">
                 <span className="font-black text-lg text-emerald-400">{b.runs}</span>
                 <span className="text-zinc-500 text-xs ml-1">({b.balls})</span>
               </div>
             </div>
          )) : (
            <div className="text-zinc-600 text-sm italic">No batting performances recorded yet.</div>
          )}
        </div>
      </div>

      {/* Top Bowlers */}
      <div className="bg-[#0e1424]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
          <Target className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Top Performers: Bowling</h3>
        </div>
        
        <div className="flex flex-col gap-4">
          {bowlers.length > 0 ? bowlers.map((b, i) => (
             <div key={i} className="flex justify-between items-center group">
               <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-[10px] group-hover:bg-amber-500 group-hover:text-white transition-colors">
                   {i + 1}
                 </div>
                 <div>
                   <div className="font-bold text-sm text-white">{b.player?.name}</div>
                   <div className="text-[10px] text-zinc-500 tracking-wider">ECO: {b.economy?.toFixed(1) || 0}</div>
                 </div>
               </div>
               <div className="text-right">
                 <span className="font-black text-lg text-amber-400">{b.wickets}</span>
                 <span className="text-zinc-500 text-sm mx-1">-</span>
                 <span className="font-bold text-rose-100 text-sm">{b.runs}</span>
                 <span className="text-zinc-600 text-[10px] ml-1">({b.overs})</span>
               </div>
             </div>
          )) : (
            <div className="text-zinc-600 text-sm italic">No bowling performances recorded yet.</div>
          )}
        </div>
      </div>

    </div>
  );
}
