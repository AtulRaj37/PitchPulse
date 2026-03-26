import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface TabAnalysisProps {
  matchData: any;
}

const PIE_COLORS_RUNS = ['#52525b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
const PIE_COLORS_WICKETS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#8b5cf6'];

export function TabAnalysis({ matchData }: TabAnalysisProps) {
  const { team1, team2, events } = matchData || {};

  const { chartData, runData, wicketData } = useMemo(() => {
    if (!events || !Array.isArray(events)) return { chartData: [], runData: [], wicketData: [] };

    let currentInnings = 1;
    let t1Cumulative = 0;
    let t2Cumulative = 0;

    let t1Name = team1?.shortName || team1?.name || 'T1';
    let t2Name = team2?.shortName || team2?.name || 'T2';

    // Toss Logic
    let battingFirstId = team1?.id;
    if (matchData?.toss) {
      const toss = matchData.toss;
      battingFirstId = toss.decision === 'BAT' ? toss.winnerId : (toss.winnerId === team1?.id ? team2?.id : team1?.id);
    }
    const t1IsBattingFirst = battingFirstId === team1?.id;

    const data: Record<number, any> = {};
    
    const runTypes = { "0s": 0, "1s": 0, "2s": 0, "3s": 0, "4s": 0, "6s": 0 };
    const wicketTypes = { "Caught": 0, "Bowled": 0, "LBW": 0, "Run Out": 0, "Stumped": 0, "Other": 0 };

    events.forEach(ev => {
      // Innings tracking
      if (ev.eventType === 'INNINGS_STARTED') {
        currentInnings = ev.payload?.inningsNumber || currentInnings;
      }
      
      // Pie Chart Metrics Extraction
      if (ev.eventType === 'BALL_BOWLED') {
         const r = ev.payload?.runs || 0;
         if (r === 0) runTypes["0s"]++;
         else if (r === 1) runTypes["1s"]++;
         else if (r === 2) runTypes["2s"]++;
         else if (r === 3) runTypes["3s"]++;
         else if (r === 4) runTypes["4s"]++;
         else if (r === 6) runTypes["6s"]++;
      }
      
      if (ev.eventType === 'WICKET_FELL') {
         const mode = (ev.payload?.wicketType || ev.payload?.dismissalMode || 'OTHER').toUpperCase();
         if (mode.includes('CAUGHT')) wicketTypes["Caught"]++;
         else if (mode.includes('BOWLED')) wicketTypes["Bowled"]++;
         else if (mode.includes('LBW')) wicketTypes["LBW"]++;
         else if (mode.includes('RUN_OUT')) wicketTypes["Run Out"]++;
         else if (mode.includes('STUMPED')) wicketTypes["Stumped"]++;
         else wicketTypes["Other"]++;
      }

      // Worm/Manhattan Metrics Extraction
      const isScoringEvent = ['RUN_SCORED', 'WIDE_BALL', 'NO_BALL', 'BYE', 'LEG_BYE', 'WICKET_FELL'].includes(ev.eventType);
      if (isScoringEvent) {
        const runs = (ev.payload?.runs || 0) + (ev.payload?.extraRuns || 0);
        const overIdx = ev.overNumber || 0;
        const displayOver = overIdx + 1;

        if (!data[displayOver]) {
          data[displayOver] = { 
            over: displayOver,
            [`${t1Name} Total`]: t1Cumulative,
            [`${t1Name} Runs`]: 0,
            [`${t2Name} Total`]: t2Cumulative,
            [`${t2Name} Runs`]: 0
          };
        }
        
        if ((currentInnings === 1 && t1IsBattingFirst) || (currentInnings === 2 && !t1IsBattingFirst)) {
          t1Cumulative += runs;
          data[displayOver][`${t1Name} Runs`] += runs;
          data[displayOver][`${t1Name} Total`] = t1Cumulative;
        } else {
          t2Cumulative += runs;
          data[displayOver][`${t2Name} Runs`] += runs;
          data[displayOver][`${t2Name} Total`] = t2Cumulative;
        }
      }
    });

    const maxOver = Math.max(0, ...Object.keys(data).map(Number));
    for (let i = 1; i <= maxOver; i++) {
       if (!data[i]) {
         data[i] = {
           over: i,
           [`${t1Name} Total`]: data[i-1]?.[`${t1Name} Total`] || 0,
           [`${t1Name} Runs`]: 0,
           [`${t2Name} Total`]: data[i-1]?.[`${t2Name} Total`] || 0,
           [`${t2Name} Runs`]: 0,
         };
       }
    }

    const cData = Object.values(data).sort((a: any, b: any) => a.over - b.over);
    const rData = Object.entries(runTypes).filter(([_,v]) => v > 0).map(([name,value]) => ({ name, value }));
    const wData = Object.entries(wicketTypes).filter(([_,v]) => v > 0).map(([name,value]) => ({ name, value }));

    return { chartData: cData, runData: rData, wicketData: wData };
  }, [events, team1, team2, matchData]);

  const t1Color = "#10b981"; // Emerald
  const t2Color = "#3b82f6"; // Blue
  const t1Name = team1?.shortName || team1?.name || 'Team 1';
  const t2Name = team2?.shortName || team2?.name || 'Team 2';

  if (!chartData || chartData.length === 0) {
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
        <div className="h-[300px] w-full -ml-4 md:ml-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#272f40" vertical={false} />
              <XAxis dataKey="over" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Ov ${val}`} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0f1c', border: '1px solid #272f40', borderRadius: '12px', padding: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                itemStyle={{ fontWeight: 'bold' }}
                labelStyle={{ color: '#a1a1aa', marginBottom: '4px', fontWeight: 'bold' }}
                formatter={(value: any, name: any) => [value, name]}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey={`${t1Name} Total`} stroke={t1Color} strokeWidth={4} activeDot={{ r: 8, stroke: '#0a0f1c', strokeWidth: 2 }} dot={false} strokeLinecap="round" />
              <Line type="monotone" dataKey={`${t2Name} Total`} stroke={t2Color} strokeWidth={4} activeDot={{ r: 8, stroke: '#0a0f1c', strokeWidth: 2 }} dot={false} strokeLinecap="round" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Manhattan Graph */}
      <div className="bg-[#0e1424]/80 backdrop-blur-md border border-white/5 p-4 md:p-6 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center gap-2 mb-6 ml-2">
          <BarChart3 className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">Runs per Over (Manhattan)</h3>
        </div>
        <div className="h-[250px] w-full -ml-4 md:ml-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#272f40" vertical={false} />
              <XAxis dataKey="over" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: '#ffffff05' }}
                contentStyle={{ backgroundColor: '#0a0f1c', border: '1px solid #272f40', borderRadius: '12px', padding: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                itemStyle={{ fontWeight: 'bold' }}
                labelStyle={{ color: '#a1a1aa', marginBottom: '4px', fontWeight: 'bold' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
              <Bar dataKey={`${t1Name} Runs`} fill={t1Color} radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey={`${t2Name} Runs`} fill={t2Color} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
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
