import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

export interface ManhattanDataPoint {
  over: number;
  runs: number;
  wickets: number;
}

interface ManhattanChartProps {
  data: ManhattanDataPoint[];
  teamColor?: string; // e.g. '#10b981'
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ManhattanDataPoint;
    return (
      <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 p-3 rounded-xl shadow-2xl">
        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">Over {label}</p>
        <p className="text-white font-black text-lg">{data.runs} Runs</p>
        {data.wickets > 0 && <p className="text-red-500 font-bold text-xs mt-1">{data.wickets} Wicket{data.wickets > 1 ? 's' : ''}</p>}
      </div>
    );
  }
  return null;
};

export function ManhattanChart({ data, teamColor = '#10b981' }: ManhattanChartProps) {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest text-xs">No Data Available</div>;
  }

  // Find max runs to scale Y axis comfortably
  const maxRuns = Math.max(...data.map(d => d.runs), 10);
  const yDomain = [0, Math.ceil(maxRuns / 5) * 5];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="w-full h-full min-h-[250px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis 
            dataKey="over" 
            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} 
            tickLine={false}
            axisLine={{ stroke: '#27272a' }}
            dy={10}
          />
          <YAxis 
            domain={yDomain}
            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: '#27272a', opacity: 0.4 }} 
          />
          <Bar dataKey="runs" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.wickets > 0 ? '#ef4444' : teamColor} 
                opacity={entry.runs === 0 && entry.wickets === 0 ? 0.2 : 0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
