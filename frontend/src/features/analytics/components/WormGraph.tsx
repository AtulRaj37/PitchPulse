import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { motion } from 'framer-motion';

export interface WormDataPoint {
  over: number;
  team1Runs: number;
  team1Wickets: number;
  team2Runs?: number;
  team2Wickets?: number;
  isWicketTeam1?: boolean;
  isWicketTeam2?: boolean;
}

interface WormGraphProps {
  data: WormDataPoint[];
  team1Name: string;
  team2Name?: string;
  team1Color?: string;
  team2Color?: string;
}

const CustomTooltip = ({ active, payload, label, team1Name, team2Name }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as WormDataPoint;
    return (
      <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 p-4 rounded-xl shadow-2xl min-w-[150px]">
        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-2 border-b border-zinc-800 pb-2">After Over {label}</p>
        
        <div className="flex justify-between items-center gap-4 mb-1">
          <span className="text-xs font-bold text-zinc-300">{team1Name}</span>
          <span className="font-black text-amber-500">{data.team1Runs}/{data.team1Wickets}</span>
        </div>
        
        {data.team2Runs !== undefined && (
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs font-bold text-zinc-300">{team2Name || 'Team 2'}</span>
            <span className="font-black text-blue-500">{data.team2Runs}/{data.team2Wickets}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Custom dot to highlight wickets on the line graph
const CustomizedDot = (props: any) => {
  const { cx, cy, payload, dataKey } = props;
  
  if (dataKey === 'team1Runs' && payload.isWicketTeam1) {
    return <circle cx={cx} cy={cy} r={4} fill="#ef4444" stroke="#fff" strokeWidth={1.5} />;
  }
  if (dataKey === 'team2Runs' && payload.isWicketTeam2) {
    return <circle cx={cx} cy={cy} r={4} fill="#ef4444" stroke="#fff" strokeWidth={1.5} />;
  }
  
  return null;
};

export function WormGraph({ data, team1Name, team2Name, team1Color = '#f59e0b', team2Color = '#3b82f6' }: WormGraphProps) {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest text-xs">No Data Available</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="w-full h-full min-h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
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
            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            content={<CustomTooltip team1Name={team1Name} team2Name={team2Name} />} 
          />
          
          {/* Team 1 Line */}
          <Line 
            type="monotone" 
            dataKey="team1Runs" 
            stroke={team1Color} 
            strokeWidth={3}
            dot={<CustomizedDot />}
            activeDot={{ r: 6, fill: team1Color, stroke: '#fff', strokeWidth: 2 }}
            isAnimationActive={true}
          />
          
          {/* Team 2 Line (If 2nd innings) */}
          {data[0]?.team2Runs !== undefined && (
            <Line 
              type="monotone" 
              dataKey="team2Runs" 
              stroke={team2Color} 
              strokeWidth={3}
              dot={<CustomizedDot />}
              activeDot={{ r: 6, fill: team2Color, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={true}
            />
          )}

        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team1Color }} />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{team1Name}</span>
        </div>
        {team2Name && data[0]?.team2Runs !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team2Color }} />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{team2Name}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
