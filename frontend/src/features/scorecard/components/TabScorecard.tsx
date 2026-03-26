import React from 'react';

interface TabScorecardProps {
  inning: any;
}

export function TabScorecard({ inning }: TabScorecardProps) {
  if (!inning) return <div className="p-8 text-center text-zinc-500">No data available yet</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Batting Table */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 ml-2 border-l-2 border-emerald-500 pl-2">Batting</h2>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
          <div className="grid grid-cols-12 text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-[#0e1424] px-4 py-3 border-b border-white/5">
            <div className="col-span-5">Batsman</div>
            <div className="col-span-2 text-right">R</div>
            <div className="col-span-1 text-right">B</div>
            <div className="col-span-1 text-right">4s</div>
            <div className="col-span-1 text-right">6s</div>
            <div className="col-span-2 text-right">SR</div>
          </div>
          
          <div className="divide-y divide-white/5 bg-[#050505]/40 backdrop-blur-sm">
            {inning.battingStats?.length > 0 ? inning.battingStats.map((batter: any, idx: number) => {
              const sr = batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(1) : "0.0";
              const isOut = batter.dismissalType || (batter.isOut && !batter.isNotOut);
              
              return (
                <div key={idx} className="grid grid-cols-12 items-center px-4 py-3 hover:bg-white/[0.04] transition-colors group">
                  <div className="col-span-5 pr-2">
                    <div className="text-sm border-l-2 border-transparent group-hover:border-emerald-500 pl-2 -ml-2 transition-all">
                      <span className="font-bold text-white mr-2">{batter.player?.name}</span>
                      {!isOut && batter.balls > 0 && <span className="text-emerald-500 text-xs">*</span>}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 truncate pl-2">
                      {isOut ? (batter.dismissalType || 'Out') : 'not out'}
                    </div>
                  </div>
                  <div className="col-span-2 text-right font-black text-rose-100/90 text-[15px]">{batter.runs}</div>
                  <div className="col-span-1 text-right text-zinc-400 font-medium text-xs">{batter.balls}</div>
                  <div className="col-span-1 text-right text-zinc-500 font-medium text-xs">{batter.fours}</div>
                  <div className="col-span-1 text-right text-zinc-500 font-medium text-xs">{batter.sixes}</div>
                  <div className="col-span-2 text-right text-zinc-500 font-jetbrains text-[10px]">{sr}</div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-zinc-600 font-medium text-sm">No batting records for this innings.</div>
            )}
          </div>
          
          {/* Extras & Total Row */}
          <div className="border-t-2 border-white/10 bg-[#0e1424]">
            <div className="px-4 py-3 flex justify-between items-center border-b border-white/5">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Extras</span>
              <span className="font-bold text-zinc-300">0 <span className="text-[10px] text-zinc-500 font-normal">(b 0, lb 0, w 0, nb 0, p 0)</span></span>
            </div>
            <div className="px-4 py-3 flex justify-between items-center">
              <span className="text-xs font-black text-white uppercase tracking-widest">Total</span>
              <span className="font-black text-emerald-400 text-lg">
                {inning.totalRuns}/{inning.totalWickets} 
                <span className="text-xs text-zinc-500 font-normal ml-2">({Math.floor(inning.overs)}.{Math.round((inning.overs % 1) * 10)} Overs, RR: {(inning.totalRuns / Math.max(1, inning.overs)).toFixed(2)})</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fall of Wickets (Static for now, could be dynamic later) */}
      <div className="px-4 py-3 bg-[#0a0f1c] rounded-xl border border-white/5">
         <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mr-4">Fall of Wickets</span>
         <span className="text-xs text-zinc-400 leading-relaxed italic">Detailed timeline not available for this match.</span>
      </div>

      {/* Bowling Table */}
      <div className="mt-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 ml-2 border-l-2 border-amber-500 pl-2">Bowling</h2>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
          <div className="grid grid-cols-12 text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-[#0e1424] px-4 py-3 border-b border-white/5">
            <div className="col-span-4">Bowler</div>
            <div className="col-span-2 text-right">O</div>
            <div className="col-span-2 text-right">M</div>
            <div className="col-span-2 text-right">R</div>
            <div className="col-span-1 text-right">W</div>
            <div className="col-span-1 text-right">ECO</div>
          </div>
          
          <div className="divide-y divide-white/5 bg-[#050505]/40 backdrop-blur-sm">
            {inning.bowlingStats?.length > 0 ? inning.bowlingStats.map((bowler: any, idx: number) => {
              return (
                <div key={idx} className="grid grid-cols-12 items-center px-4 py-3 hover:bg-white/[0.04] transition-colors group">
                  <div className="col-span-4 text-sm font-bold text-white truncate pr-2 border-l-2 border-transparent group-hover:border-amber-500 pl-2 -ml-2 transition-all">
                    {bowler.player?.name}
                  </div>
                  <div className="col-span-2 text-right text-zinc-300 font-medium font-jetbrains text-xs">{bowler.overs}</div>
                  <div className="col-span-2 text-right text-zinc-500 font-medium text-xs">{bowler.maidens}</div>
                  <div className="col-span-2 text-right text-rose-100/90 font-medium text-[15px]">{bowler.runs}</div>
                  <div className="col-span-1 text-right text-amber-400 font-black text-sm">{bowler.wickets}</div>
                  <div className="col-span-1 text-right text-zinc-500 font-jetbrains text-[10px]">
                    {bowler.economy > 0 ? bowler.economy.toFixed(1) : '0.0'}
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-zinc-600 font-medium text-sm">No bowling records for this innings.</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
