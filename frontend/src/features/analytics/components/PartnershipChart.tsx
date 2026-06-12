import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { motion } from 'framer-motion';

export interface PartnershipDataPoint {
  id: string; // e.g. "K. Kohli & MS Dhoni"
  player1Name: string;
  player2Name: string;
  player1Runs: number;
  player2Runs: number;
  extras: number;
  totalRuns: number;
  balls: number;
  isActive: boolean;
}

interface PartnershipChartProps {
  data: PartnershipDataPoint[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as PartnershipDataPoint;
    return (
      <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 p-4 rounded-xl shadow-2xl min-w-[200px]">
        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-800 pb-2 mb-2">
          {data.isActive ? '🏏 Active Partnership' : 'Partnership'}
        </p>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-white font-black text-2xl">{data.totalRuns} <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Runs</span></span>
          <span className="text-zinc-400 text-xs font-bold">{data.balls} Balls</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-300 font-bold">{data.player1Name}</span>
            <span className="text-emerald-500 font-black">{data.player1Runs}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-300 font-bold">{data.player2Name}</span>
            <span className="text-amber-500 font-black">{data.player2Runs}</span>
          </div>
          {data.extras > 0 && (
            <div className="flex justify-between items-center pt-1 border-t border-zinc-800/50 mt-1">
              <span className="text-[10px] text-zinc-500 tracking-widest uppercase font-bold">Extras</span>
              <span className="text-zinc-400 font-black text-xs">{data.extras}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function PartnershipChart({ data }: PartnershipChartProps) {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest text-xs">No Data Available</div>;
  }

  // Calculate generic domains
  const maxRuns = Math.max(...data.map(d => d.totalRuns), 10);
  const yDomain = [0, Math.ceil(maxRuns / 10) * 10];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="w-full h-full min-h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
          barSize={24}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
          <XAxis 
            type="number"
            domain={yDomain}
            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} 
            tickLine={false}
            axisLine={{ stroke: '#27272a' }}
          />
          <YAxis 
            dataKey="id" 
            type="category"
            tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold' }} 
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: '#27272a', opacity: 0.4 }} 
          />
          
          <Bar dataKey="player1Runs" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]}>
            {data.map((entry, index) => (
               <Cell key={`p1-${index}`} fillOpacity={entry.isActive ? 1 : 0.6} />
            ))}
          </Bar>
          <Bar dataKey="player2Runs" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]}>
             {data.map((entry, index) => (
               <Cell key={`p2-${index}`} fillOpacity={entry.isActive ? 1 : 0.6} />
            ))}
          </Bar>
          <Bar dataKey="extras" stackId="a" fill="#71717a" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
               <Cell key={`ex-${index}`} fillOpacity={entry.isActive ? 0.8 : 0.4} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
