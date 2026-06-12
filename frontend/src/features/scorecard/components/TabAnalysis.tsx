import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Users } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { ManhattanChart, ManhattanDataPoint } from '../../analytics/components/ManhattanChart';
import { WormGraph, WormDataPoint } from '../../analytics/components/WormGraph';
import { PartnershipChart } from '../../analytics/components/PartnershipChart';
import { calculatePartnerships } from '../utils/partnership-calculator';

interface TabAnalysisProps {
  matchData: any;
}

const PIE_COLORS_RUNS = ['#52525b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
const PIE_COLORS_WICKETS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#8b5cf6'];

export function TabAnalysis({ matchData }: TabAnalysisProps) {
  const { team1, team2, events } = matchData || {};

  const { wormData, manhattanData1, manhattanData2, runData, wicketData, partnerships } = useMemo(() => {
    if (!events || !Array.isArray(events)) return { wormData: [], manhattanData1: [], manhattanData2: [], runData: [], wicketData: [], partnerships: [] };

    let currentInnings = 1;
    let t1Cumulative = 0;
    let t2Cumulative = 0;
    let t1Wickets = 0;
    let t2Wickets = 0;

    let battingFirstId = team1?.id;
    if (matchData?.toss) {
      const toss = matchData.toss;
      battingFirstId = toss.decision === 'BAT' ? toss.winnerId : (toss.winnerId === team1?.id ? team2?.id : team1?.id);
    }
    const t1IsBattingFirst = battingFirstId === team1?.id;

    const wDataMap: Record<number, WormDataPoint> = {};
    const mDataMap1: Record<number, ManhattanDataPoint> = {};
    const mDataMap2: Record<number, ManhattanDataPoint> = {};
    
    const runTypes = { "0s": 0, "1s": 0, "2s": 0, "3s": 0, "4s": 0, "6s": 0 };
    const wicketTypes = { "Caught": 0, "Bowled": 0, "LBW": 0, "Run Out": 0, "Stumped": 0, "Other": 0 };

    events.forEach(ev => {
      if (ev.eventType === 'INNINGS_STARTED') {
        currentInnings = ev.payload?.inningsNumber || currentInnings;
      }
      
      const isScoringEvent = ['RUN_SCORED', 'WIDE_BALL', 'NO_BALL', 'BYE', 'LEG_BYE', 'WICKET_FELL'].includes(ev.eventType);
      
      if (isScoringEvent) {
        const runs = (ev.payload?.runs || 0) + (ev.payload?.extraRuns || 0);
        const isWicket = ev.eventType === 'WICKET_FELL';
        const overIdx = ev.overNumber || 0;
        const displayOver = overIdx + 1;

        // Initialize maps
        if (!wDataMap[displayOver]) {
          wDataMap[displayOver] = { 
            over: displayOver, team1Runs: t1Cumulative, team1Wickets: t1Wickets,
            team2Runs: currentInnings === 2 ? t2Cumulative : undefined,
            team2Wickets: currentInnings === 2 ? t2Wickets : undefined,
          };
        }
        if (!mDataMap1[displayOver]) mDataMap1[displayOver] = { over: displayOver, runs: 0, wickets: 0 };
        if (!mDataMap2[displayOver]) mDataMap2[displayOver] = { over: displayOver, runs: 0, wickets: 0 };

        // Process Runs & Wickets
        const isTeam1Batting = (currentInnings === 1 && t1IsBattingFirst) || (currentInnings === 2 && !t1IsBattingFirst);
        
        if (isTeam1Batting) {
          t1Cumulative += runs;
          if (isWicket) t1Wickets++;
          
          mDataMap1[displayOver].runs += runs;
          if (isWicket) mDataMap1[displayOver].wickets++;
          
          wDataMap[displayOver].team1Runs = t1Cumulative;
          wDataMap[displayOver].team1Wickets = t1Wickets;
          if (isWicket) wDataMap[displayOver].isWicketTeam1 = true;
          
        } else {
          t2Cumulative += runs;
          if (isWicket) t2Wickets++;
          
          mDataMap2[displayOver].runs += runs;
          if (isWicket) mDataMap2[displayOver].wickets++;
          
          wDataMap[displayOver].team2Runs = t2Cumulative;
          wDataMap[displayOver].team2Wickets = t2Wickets;
          if (isWicket) wDataMap[displayOver].isWicketTeam2 = true;
        }

        // Run Breakdown
        if (ev.eventType === 'BALL_BOWLED' && !isWicket) {
           const r = ev.payload?.runs || 0;
           if (r === 0) runTypes["0s"]++;
           else if (r === 1) runTypes["1s"]++;
           else if (r === 2) runTypes["2s"]++;
           else if (r === 3) runTypes["3s"]++;
           else if (r === 4) runTypes["4s"]++;
           else if (r === 6) runTypes["6s"]++;
        }
        
        // Wicket Breakdown
        if (isWicket) {
           const mode = (ev.payload?.wicketType || ev.payload?.dismissalMode || 'OTHER').toUpperCase();
           if (mode.includes('CAUGHT')) wicketTypes["Caught"]++;
           else if (mode.includes('BOWLED')) wicketTypes["Bowled"]++;
           else if (mode.includes('LBW')) wicketTypes["LBW"]++;
           else if (mode.includes('RUN_OUT')) wicketTypes["Run Out"]++;
           else if (mode.includes('STUMPED')) wicketTypes["Stumped"]++;
           else wicketTypes["Other"]++;
        }
      }
    });

    const wData = Object.values(wDataMap).sort((a, b) => a.over - b.over);
    const mData1 = Object.values(mDataMap1).sort((a, b) => a.over - b.over);
    const mData2 = Object.values(mDataMap2).sort((a, b) => a.over - b.over);

    const rData = Object.entries(runTypes).filter(([_,v]) => v > 0).map(([name,value]) => ({ name, value }));
    const wkData = Object.entries(wicketTypes).filter(([_,v]) => v > 0).map(([name,value]) => ({ name, value }));

    const parts = calculatePartnerships(events);

    return { wormData: wData, manhattanData1: mData1, manhattanData2: mData2, runData: rData, wicketData: wkData, partnerships: parts };
  }, [events, team1, team2, matchData]);

  const t1Color = "#10b981"; // Emerald
  const t2Color = "#3b82f6"; // Blue
  const t1Name = team1?.shortName || team1?.name || 'Team 1';
  const t2Name = team2?.shortName || team2?.name || 'Team 2';

  if (!wormData || wormData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#0e1424]/80 backdrop-blur-md rounded-2xl border border-white/5">
        <TrendingUp className="text-zinc-600 mb-4 w-10 h-10" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Waiting for first over completion</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Run Rate Worm Chart */}
      <div className="bg-[#0e1424]/80 backdrop-blur-md border border-white/5 p-4 md:p-6 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center gap-2 mb-6 ml-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">Run Rate Progression (Worm)</h3>
        </div>
        <div className="h-[300px] w-full -max-w-full">
           <WormGraph data={wormData} team1Name={t1Name} team2Name={t2Name} team1Color={t1Color} team2Color={t2Color} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manhattan Graph - Team 1 */}
        <div className="bg-[#0e1424]/80 backdrop-blur-md border border-white/5 p-4 md:p-6 rounded-2xl shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 mb-6 ml-2">
            <BarChart3 className="w-5 h-5" style={{ color: t1Color }} />
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">{t1Name} Manhattan</h3>
          </div>
          <div className="h-[250px] w-full">
            <ManhattanChart data={manhattanData1} teamColor={t1Color} />
          </div>
        </div>

        {/* Manhattan Graph - Team 2 */}
        {manhattanData2.length > 0 && manhattanData2.some(d => d.runs > 0 || d.wickets > 0) && (
          <div className="bg-[#0e1424]/80 backdrop-blur-md border border-white/5 p-4 md:p-6 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center gap-2 mb-6 ml-2">
              <BarChart3 className="w-5 h-5" style={{ color: t2Color }} />
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">{t2Name} Manhattan</h3>
            </div>
            <div className="h-[250px] w-full">
              <ManhattanChart data={manhattanData2} teamColor={t2Color} />
            </div>
          </div>
        )}
      </div>

      {/* Partnership Partnerships */}
      <div className="bg-[#0e1424]/80 backdrop-blur-md border border-white/5 p-4 md:p-6 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center gap-2 mb-6 ml-2">
          <Users className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">Partnership Contributions</h3>
        </div>
        <div className="h-[350px] w-full">
          <PartnershipChart data={partnerships} />
        </div>
      </div>

      {/* Pie Charts Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Run Breakdown */}
        {runData.length > 0 && (
          <div className="bg-[#0e1424]/80 backdrop-blur-md border border-white/5 p-4 md:p-6 rounded-2xl shadow-xl overflow-hidden flex flex-col items-center">
             <div className="flex items-center gap-2 mb-2 w-full ml-2">
               <PieChartIcon className="w-5 h-5 text-cyan-400" />
               <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">Run Breakdown</h3>
             </div>
             <div className="w-full h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={runData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {runData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={PIE_COLORS_RUNS[index % PIE_COLORS_RUNS.length]} />
                     ))}
                   </Pie>
                   <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0f1c', border: '1px solid #272f40', borderRadius: '12px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#fff' }}
                   />
                   <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}/>
                 </PieChart>
               </ResponsiveContainer>
             </div>
          </div>
        )}

        {/* Wicket Breakdown */}
        {wicketData.length > 0 && (
          <div className="bg-[#0e1424]/80 backdrop-blur-md border border-white/5 p-4 md:p-6 rounded-2xl shadow-xl overflow-hidden flex flex-col items-center">
             <div className="flex items-center gap-2 mb-2 w-full ml-2">
               <PieChartIcon className="w-5 h-5 text-rose-400" />
               <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">Wicket Types</h3>
             </div>
             <div className="w-full h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={wicketData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {wicketData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={PIE_COLORS_WICKETS[index % PIE_COLORS_WICKETS.length]} />
                     ))}
                   </Pie>
                   <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0f1c', border: '1px solid #272f40', borderRadius: '12px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#fff' }}
                   />
                   <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}/>
                 </PieChart>
               </ResponsiveContainer>
             </div>
          </div>
        )}
      </div>

    </div>
  );
}
