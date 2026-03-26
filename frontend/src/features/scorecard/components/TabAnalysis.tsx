import React, { useMemo } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface TabAnalysisProps {
  matchData: any;
}

export function TabAnalysis({ matchData }: TabAnalysisProps) {
  const { team1, team2, events } = matchData || {};

  const chartData = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];

    let currentInnings = 1;
    let t1Cumulative = 0;
    let t2Cumulative = 0;
    let t1OverRuns = 0;
    let t2OverRuns = 0;

    let t1Name = team1?.shortName || team1?.name || 'T1';
    let t2Name = team2?.shortName || team2?.name || 'T2';

    // Figure out tossing logic -> who is batting first
    let battingFirstId = team1?.id;
    if (matchData?.toss) {
      const toss = matchData.toss;
      battingFirstId = toss.decision === 'BAT' ? toss.winnerId : (toss.winnerId === team1?.id ? team2?.id : team1?.id);
    }
    const t1IsBattingFirst = battingFirstId === team1?.id;

    const data: Record<number, any> = {};

    events.forEach(ev => {
      if (ev.eventType === 'INNINGS_STARTED') {
        currentInnings = ev.payload?.inningsNumber || currentInnings;
      }
      
      const isScoringEvent = ['RUN_SCORED', 'WIDE_BALL', 'NO_BALL', 'BYE', 'LEG_BYE', 'WICKET_FELL'].includes(ev.eventType);
      
      if (isScoringEvent) {
        const runs = (ev.payload?.runs || 0) + (ev.payload?.extraRuns || 0);
        const overIdx = ev.overNumber || 0;
        const displayOver = overIdx + 1;

        if (!data[displayOver]) {
          // Initialize over data with previous cumulatives
          data[displayOver] = { 
            over: displayOver,
            [`${t1Name} Total`]: t1Cumulative,
            [`${t1Name} Runs`]: 0,
            [`${t2Name} Total`]: t2Cumulative,
            [`${t2Name} Runs`]: 0
          };
        }
        
        // Assign to logical team based on innings
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

    // Ensure empty overs between wickets or skipped overs are filled
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

    return Object.values(data).sort((a: any, b: any) => a.over - b.over);
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
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
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
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #272f40', borderRadius: '12px', padding: '12px' }}
                itemStyle={{ fontWeight: 'bold' }}
                labelStyle={{ color: '#a1a1aa', marginBottom: '4px', fontWeight: 'bold' }}
                formatter={(value: any, name: any) => [value, name]}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey={`${t1Name} Total`} stroke={t1Color} strokeWidth={4} activeDot={{ r: 8 }} dot={false} strokeLinecap="round" />
              <Line type="monotone" dataKey={`${t2Name} Total`} stroke={t2Color} strokeWidth={4} activeDot={{ r: 8 }} dot={false} strokeLinecap="round" />
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
                cursor={{ fill: '#ffffff0a' }}
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #272f40', borderRadius: '12px', padding: '12px' }}
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

    </div>
  );
}
