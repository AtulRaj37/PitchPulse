import React from 'react';

interface TabScorecardProps {
  inning: any;
  matchData?: any;
}

export function TabScorecard({ inning, matchData }: TabScorecardProps) {
  if (!inning) return <div className="p-8 text-center text-zinc-500">No data available yet</div>;

  // Derive "Yet to Bat" by checking squad players who do not have a batting stats record
  const teamId = inning.battingTeamId;
  const team = matchData?.team1.id === teamId ? matchData.team1 : matchData?.team2;
  const battedPlayerIds = inning.battingStats?.map((b: any) => b.playerId) || [];
  const yetToBat = team?.players?.filter((p: any) => !battedPlayerIds.includes(p.id)) || [];

  // Sort Fall of Wickets
  const fowList = inning.battingStats?.filter((b: any) => b.isOut || b.dismissalType).sort((a: any, b: any) => a.position - b.position) || [];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Batting Section */}
      <div className="bg-[#0a0f1c] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-black text-white">{team?.name || 'Batting Team'}</h3>
          <span className="text-sm font-black text-white">{inning.totalRuns}/{inning.totalWickets} <span className="text-xs font-bold text-zinc-500 font-jetbrains">({Math.floor(inning.overs)}.{Math.round((inning.overs % 1) * 10)} Ov)</span></span>
        </div>
        
        <div className="flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_40px_40px_40px_60px_40px] gap-2 px-6 py-3 bg-[#0d1326] text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5">
            <div>Batters</div>
            <div className="text-right"></div>
            <div className="text-right">R</div>
            <div className="text-right">B</div>
            <div className="text-right">4s</div>
            <div className="text-right">6s</div>
            <div className="text-right">SR</div>
          </div>
          
          {/* Rows */}
          {inning.battingStats?.map((batter: any, idx: number) => {
            const sr = batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(2) : "0.00";
            const isOut = batter.dismissalType || (batter.isOut && !batter.isNotOut);
            
            return (
              <div 
                key={idx} 
                className="grid grid-cols-[1fr_80px_40px_40px_40px_60px_40px] gap-2 px-6 py-4 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors group animate-in fade-in slide-in-from-left-2 duration-500 fill-mode-both"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="font-bold text-sm text-emerald-50 transition-colors group-hover:text-emerald-400">
                  {batter.player?.name} {!isOut && batter.balls > 0 && '*'}
                </div>
                <div className="text-[10px] md:text-xs text-zinc-500 text-right truncate pl-2">
                  {isOut ? (batter.dismissalType || 'Out') : 'not out'}
                </div>
                <div className="text-right font-black text-white text-[15px]">{batter.runs}</div>
                <div className="text-right text-zinc-400 font-medium text-xs">{batter.balls}</div>
                <div className="text-right text-zinc-500 font-medium text-xs">{batter.fours}</div>
                <div className="text-right text-zinc-500 font-medium text-xs">{batter.sixes}</div>
                <div className="text-right text-zinc-500 font-medium text-xs font-jetbrains">{sr}</div>
              </div>
            );
          })}
          
          {/* Extras Row */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
            <div className="font-black text-xs md:text-sm text-white uppercase tracking-wider">Extras</div>
            <div className="text-[10px] md:text-xs text-zinc-500 font-jetbrains">(nb {inning.extrasDetails?.nb || 0}, w {inning.extrasDetails?.wd || 0}, b {inning.extrasDetails?.b || 0}, lb {inning.extrasDetails?.lb || 0})</div>
            <div className="font-black text-emerald-400 text-base">{inning.extras || 0}</div>
          </div>
          
          {/* Total Row */}
          <div className="flex justify-between items-center px-6 py-4 bg-white/[0.02] border-b border-white/5">
            <div className="font-black text-sm text-white uppercase tracking-wider">Total</div>
            <div className="font-black text-white text-lg">{inning.totalRuns}/{inning.totalWickets} <span className="text-xs text-zinc-500 font-jetbrains font-normal ml-2">({Math.floor(inning.overs)}.{Math.round((inning.overs % 1) * 10)} Overs, RR: {(inning.totalRuns / Math.max(1, inning.overs)).toFixed(2)})</span></div>
          </div>
          
          {/* Yet to Bat */}
          {yetToBat.length > 0 && (
            <div className="px-6 py-4 border-b border-white/5 text-xs text-zinc-400 leading-relaxed">
              <span className="font-bold text-white uppercase tracking-widest mr-2">Yet to Bat:</span>
              {yetToBat.map((p: any) => p.name).join(', ')}
            </div>
          )}
          
          {/* Fall of Wickets */}
          {fowList.length > 0 && (
            <div className="px-6 py-4 border-b border-white/5 text-xs text-zinc-400 leading-relaxed bg-black/20">
              <span className="font-bold text-white uppercase tracking-widest mr-2">Fall of Wickets:</span>
              {fowList.map((batter: any, idx: number) => `${inning.totalRuns}-${idx + 1} (${batter.player?.name})`).join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Bowling Section */}
      <div className="bg-[#0a0f1c] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-[1fr_30px_30px_30px_30px_30px_30px_30px_30px_30px_40px] gap-2 px-6 py-3 bg-[#0d1326] text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 overflow-x-auto">
            <div className="min-w-[100px]">Bowlers</div>
            <div className="text-right">O</div>
            <div className="text-right">M</div>
            <div className="text-right">R</div>
            <div className="text-right">W</div>
            <div className="text-right">0s</div>
            <div className="text-right">4s</div>
            <div className="text-right">6s</div>
            <div className="text-right">WD</div>
            <div className="text-right">NB</div>
            <div className="text-right">ECO</div>
          </div>
          
          {/* Rows */}
          <div className="overflow-x-auto">
            {inning.bowlingStats?.map((bowler: any, idx: number) => {
              const eco = bowler.overs > 0 ? (bowler.runs / bowler.overs).toFixed(2) : "0.00";
              return (
                <div 
                  key={idx} 
                  className="grid grid-cols-[1fr_30px_30px_30px_30px_30px_30px_30px_30px_30px_40px] gap-2 px-6 py-4 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors group min-w-[600px] md:min-w-full animate-in fade-in slide-in-from-left-2 duration-500 fill-mode-both"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="font-bold text-sm text-cyan-50 truncate transition-colors group-hover:text-cyan-400">
                    {bowler.player?.name}
                  </div>
                  <div className="text-right text-white font-medium text-xs font-jetbrains">{bowler.overs}</div>
                  <div className="text-right text-zinc-500 font-medium text-xs">{bowler.maidens || 0}</div>
                  <div className="text-right text-white font-medium text-[15px]">{bowler.runs}</div>
                  <div className="text-right text-cyan-400 font-black text-sm">{bowler.wickets}</div>
                  <div className="text-right text-zinc-600 font-medium text-xs">{bowler.dots || 0}</div>
                  <div className="text-right text-zinc-500 font-medium text-xs">{bowler.fours || 0}</div>
                  <div className="text-right text-zinc-500 font-medium text-xs">{bowler.sixes || 0}</div>
                  <div className="text-right text-zinc-600 font-medium text-xs">{bowler.wides || 0}</div>
                  <div className="text-right text-zinc-600 font-medium text-xs">{bowler.noBalls || 0}</div>
                  <div className="text-right text-zinc-400 font-medium text-xs font-jetbrains">{eco}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
