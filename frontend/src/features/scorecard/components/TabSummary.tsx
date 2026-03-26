import React from 'react';
import { Award, FileText } from 'lucide-react';

interface TabSummaryProps {
  inning: any;
}

export function TabSummary({ inning }: TabSummaryProps) {
  if (!inning) return <div className="p-8 text-center text-zinc-500">No data available yet</div>;

  // Sorting Top 3
  const batters = [...(inning.battingStats || [])].sort((a, b) => b.runs - a.runs).slice(0, 3);
  const bowlers = [...(inning.bowlingStats || [])].sort((a, b) => {
    if (b.wickets !== a.wickets) return b.wickets - a.wickets;
    return a.runs - b.runs;
  }).slice(0, 3);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Best Performances Container */}
      <div className="bg-[#0a0f1c] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 flex items-center gap-2 border-b border-white/5 bg-white/[0.02]">
          <Award className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Best Performances</h3>
        </div>
        
        {/* Batters Section */}
        <div className="flex flex-col">
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_40px_40px_40px_40px_60px] md:grid-cols-[1fr_60px_60px_60px_60px_80px] gap-2 px-6 py-3 bg-[#0d1326] text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5">
            <div>Batters</div>
            <div className="text-right">R</div>
            <div className="text-right hidden sm:block">B</div>
            <div className="text-right sm:hidden">B</div>
            <div className="text-right">4s</div>
            <div className="text-right">6s</div>
            <div className="text-right">SR</div>
          </div>
          
          {/* Batter Rows */}
          {batters.length > 0 ? batters.map((b, i) => (
             <div key={i} className="grid grid-cols-[1fr_40px_40px_40px_40px_60px] md:grid-cols-[1fr_60px_60px_60px_60px_80px] gap-2 px-6 py-4 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors group">
               <div className="font-bold text-xs md:text-sm text-emerald-50 truncate transition-colors group-hover:text-emerald-400">
                 {b.player?.name}
               </div>
               <div className="text-right font-black text-white">{b.runs}</div>
               <div className="text-right text-zinc-400">{b.balls}</div>
               <div className="text-right text-zinc-400">{b.fours}</div>
               <div className="text-right text-zinc-400">{b.sixes}</div>
               <div className="text-right text-zinc-400">{b.balls > 0 ? ((b.runs/b.balls)*100).toFixed(2) : '0.00'}</div>
             </div>
          )) : (
            <div className="px-6 py-4 text-zinc-600 text-sm italic border-b border-white/5">No batting performances yet.</div>
          )}
        </div>

        {/* Bowlers Section */}
        <div className="flex flex-col">
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_40px_40px_40px_40px_60px] md:grid-cols-[1fr_60px_60px_60px_60px_80px] gap-2 px-6 py-3 bg-[#0d1326] text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5">
            <div>Bowlers</div>
            <div className="text-right">O</div>
            <div className="text-right">M</div>
            <div className="text-right">R</div>
            <div className="text-right">W</div>
            <div className="text-right">Eco</div>
          </div>
          
          {/* Bowler Rows */}
          {bowlers.length > 0 ? bowlers.map((b, i) => (
             <div key={i} className="grid grid-cols-[1fr_40px_40px_40px_40px_60px] md:grid-cols-[1fr_60px_60px_60px_60px_80px] gap-2 px-6 py-4 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors group last:border-b-0">
               <div className="font-bold text-xs md:text-sm text-zinc-300 truncate transition-colors group-hover:text-cyan-400">
                 {b.player?.name}
               </div>
               <div className="text-right text-zinc-400">{b.overs}</div>
               <div className="text-right text-zinc-400">{b.maidens || 0}</div>
               <div className="text-right text-zinc-400">{b.runs}</div>
               <div className="text-right font-black text-white">{b.wickets}</div>
               <div className="text-right text-zinc-400">{b.overs > 0 ? (b.runs / b.overs).toFixed(2) : '0.00'}</div>
             </div>
          )) : (
            <div className="px-6 py-4 text-zinc-600 text-sm italic">No bowling performances yet.</div>
          )}
        </div>
      </div>

      {/* Match Notes Container */}
      <div className="bg-[#0a0f1c] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 flex items-center gap-2 border-b border-white/5 bg-white/[0.02]">
          <FileText className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Match Notes</h3>
        </div>
        
        <div className="flex flex-col">
           {/* Static Mock Notes for now to mimic CricHeroes structure, this can be hydrated via match.events later */}
           <div className="px-6 py-4 border-b border-white/5 text-sm text-zinc-400 hover:text-white transition-colors hover:bg-white/[0.02]">
               Innings Started
           </div>
           
           {inning.totalRuns >= 50 && (
             <div className="px-6 py-4 border-b border-white/5 text-sm text-zinc-400 hover:text-white transition-colors hover:bg-white/[0.02]">
                 50 runs in {Math.floor(inning.overs)}.{Math.round((inning.overs % 1) * 10)} overs, Extras {inning.extras}
             </div>
           )}

           {inning.totalRuns >= 100 && (
             <div className="px-6 py-4 border-b border-white/5 text-sm text-zinc-400 hover:text-white transition-colors hover:bg-white/[0.02]">
                 100 runs in {Math.floor(inning.overs)}.{Math.round((inning.overs % 1) * 10)} overs, Extras {inning.extras}
             </div>
           )}
           
           {batters.map(b => {
               if (b.runs >= 50) return (
                 <div key={b.id} className="px-6 py-4 border-b border-white/5 text-sm text-zinc-400 hover:text-white transition-colors hover:bg-white/[0.02]">
                     {b.player?.name}: {b.runs} off {b.balls} balls ({b.fours} X 4, {b.sixes} X 6)
                 </div>
               );
               return null;
           })}

           {inning.status === 'COMPLETED' && (
             <div className="px-6 py-4 text-sm text-zinc-400 hover:text-white transition-colors hover:bg-white/[0.02]">
                 Innings Ended: {inning.totalRuns}/{inning.totalWickets}
             </div>
           )}
           
           {!inning.totalRuns && (
             <div className="px-6 py-4 text-sm text-zinc-600 italic">No significant events recorded yet.</div>
           )}
        </div>
      </div>

    </div>
  );
}
