import clsx from 'clsx';
import { motion } from 'framer-motion';

interface MatchScoreHeaderProps {
  battingTeamName: string;
  bowlingTeamName: string;
  battingTeamScore: { runs: number; wickets: number; overs: number; balls: number };
  target?: number | null;
  innings: number;
  totalOvers: number;
  status: 'CREATED' | 'LIVE' | 'INNINGS_BREAK' | 'COMPLETED' | 'ABANDONED' | 'PAUSED';
}

const getInitials = (name: string) => {
  if (!name) return 'TM';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.substring(0, 3).toUpperCase();
  return words.map(w => w[0]).join('').substring(0, 3).toUpperCase();
};

export function MatchScoreHeader({
  battingTeamName,
  bowlingTeamName,
  battingTeamScore,
  target,
  innings,
  totalOvers,
  status
}: MatchScoreHeaderProps) {
  const { runs, wickets, overs, balls } = battingTeamScore;
  
  // Calculate Run Rate
  const totalBallsBowled = overs * 6 + balls;
  const currentRR = totalBallsBowled > 0 ? (runs / (totalBallsBowled / 6)).toFixed(1) : '0.0';
  
  // Calculate Projected Score
  const projectedScore = Math.floor(parseFloat(currentRR) * totalOvers);

  // Calculate Required Run Rate if target exists
  let reqRR: string | null = null;
  let runsNeeded: number | null = null;
  let ballsRemaining: number | null = null;
  
  if (target && innings === 2) {
    ballsRemaining = (totalOvers * 6) - totalBallsBowled;
    runsNeeded = target - runs;
    if (ballsRemaining > 0) {
      reqRR = Math.max(0, runsNeeded / (ballsRemaining / 6)).toFixed(1);
    } else {
      reqRR = '0.0';
    }
  }

  // Format overs cleanly
  const oversFormatted = `${overs}.${balls}`;

  const renderStatusBadge = () => {
    switch(status) {
      case 'LIVE':
        return (
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.4)] relative">
            <span className="w-2 h-2 rounded-full bg-red-500 absolute left-3 animate-ping opacity-75"></span>
            <span className="w-2 h-2 rounded-full bg-red-500 relative z-10"></span>
            <span className="text-red-400 font-black uppercase tracking-widest text-[10px]">LIVE</span>
          </div>
        );
      case 'PAUSED':
        return <div className="bg-amber-500/20 border border-amber-500/40 text-amber-400 px-3 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(245,158,11,0.2)]">PAUSED</div>;
      case 'INNINGS_BREAK':
        return <div className="bg-blue-500/20 border border-blue-500/40 text-blue-400 px-3 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(59,130,246,0.2)]">INNINGS BREAK</div>;
      case 'COMPLETED':
        return <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(16,185,129,0.2)]">COMPLETED</div>;
      case 'ABANDONED':
        return <div className="bg-zinc-500/20 border border-zinc-500/40 text-zinc-400 px-3 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px]">ABANDONED</div>;
      default:
        return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden bg-[#0e1424]/90 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
    >
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />
      
      {/* Top Banner: Teams & Avatars */}
      <div className="flex justify-between items-center px-6 sm:px-8 py-4 bg-white/[0.03] border-b border-white/5 relative z-10 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          
          {/* Batting Team (Left) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-700 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-300/30 shrink-0">
              <span className="text-[12px] font-black text-white tracking-widest">{getInitials(battingTeamName)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black tracking-tight text-sm sm:text-base uppercase drop-shadow-md">{battingTeamName}</span>
              <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase mt-0.5">Batting</span>
            </div>
          </div>

          <div className="flex items-center justify-center sm:hidden w-full">
             <span className="text-zinc-600 font-black text-xs italic uppercase">V/S</span>
          </div>

          {/* Bowling Team (Right) */}
          <div className="flex items-center gap-3 sm:flex-row-reverse text-left sm:text-right">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-800 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-400/20 opacity-90 shrink-0">
              <span className="text-[12px] font-black text-white tracking-widest">{getInitials(bowlingTeamName)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-300 font-bold tracking-tight text-sm sm:text-base uppercase">{bowlingTeamName}</span>
              <span className="text-[10px] text-blue-400/80 font-bold tracking-widest uppercase mt-0.5">Bowling</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Score Area */}
      <div className="px-6 sm:px-10 py-8 flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
        
        {/* Left: Score */}
        <div className="flex flex-col items-start gap-1">
          {renderStatusBadge()}
          <div className="flex items-baseline gap-3 mt-3">
            <h1 className="text-7xl sm:text-8xl font-black font-clash text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 tracking-tighter drop-shadow-2xl">
              {runs}<span className="text-zinc-500 text-5xl sm:text-6xl">/{wickets}</span>
            </h1>
            <span className="text-2xl sm:text-3xl font-bold text-zinc-500 tracking-tight">({oversFormatted})</span>
          </div>
        </div>

        {/* Right: Advanced Metrics */}
        <div className="flex flex-wrap md:flex-col gap-3 md:gap-3 items-start md:items-end p-5 md:p-0 bg-black/20 md:bg-transparent rounded-2xl md:rounded-none border border-white/5 md:border-none w-full md:w-auto">
          
          {/* CRR */}
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10 w-full md:w-auto justify-between md:justify-start shadow-inner">
            <span className="text-[11px] text-zinc-400 uppercase font-black tracking-widest">Curr. RR</span>
            <span className="text-lg font-black text-white font-jetbrains">{currentRR}</span>
          </div>
          
          {/* Innings 1: Projected Score */}
          {innings === 1 && (
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10 w-full md:w-auto justify-between md:justify-start shadow-inner">
              <span className="text-[11px] text-zinc-400 uppercase font-black tracking-widest">Proj. Score ({totalOvers}O)</span>
              <span className="text-lg font-black text-emerald-400 font-jetbrains">{projectedScore}</span>
            </div>
          )}

          {/* Innings 2: Required Runs / Target */}
          {innings === 2 && reqRR !== null && runsNeeded !== null && ballsRemaining !== null && (
            <>
              <div className="flex items-center gap-3 bg-emerald-500/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-emerald-500/30 w-full md:w-auto justify-between md:justify-start shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <span className="text-[11px] text-emerald-500/90 uppercase font-black tracking-widest">Req. RR</span>
                <span className="text-lg font-black text-emerald-400 font-jetbrains">{reqRR}</span>
              </div>
              <div className="w-full text-left md:text-right mt-1">
                <span className="text-xs font-bold font-jetbrains text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg inline-block border border-emerald-500/20">
                  {battingTeamName} needs {runsNeeded} runs from {ballsRemaining} balls
                </span>
              </div>
            </>
          )}

        </div>
      </div>
    </motion.div>
  );
}
