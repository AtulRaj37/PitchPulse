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
  tossWinnerName?: string;
  tossDecision?: string;
  isFreeHit?: boolean;
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
  status,
  tossWinnerName,
  tossDecision,
  isFreeHit
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
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.4)] relative">
              <span className="w-2 h-2 rounded-full bg-red-500 absolute left-3 animate-ping opacity-75"></span>
              <span className="w-2 h-2 rounded-full bg-red-500 relative z-10"></span>
              <span className="text-red-400 font-black uppercase tracking-widest text-[10px]">LIVE</span>
            </div>
            {isFreeHit && (
              <div className="bg-purple-500/20 border border-purple-500/50 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse">
                 <span className="text-purple-400 font-black uppercase tracking-widest text-[10px]">FREE HIT</span>
              </div>
            )}
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
      className="relative overflow-hidden bg-transparent pt-8 pb-3 md:pt-16 md:pb-14 shadow-2xl mx-auto w-full md:rounded-[2rem] md:border md:border-white/5 md:bg-[#0e1424]/40"
    >
      {/* Premium Cinematic Stadium Background Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-[center_top_10%] md:bg-center bg-no-repeat z-0 pointer-events-none opacity-[0.65] blur-[1px] scale-[1.35] md:scale-100 saturate-150 contrast-[1.15] brightness-90 transition-all duration-500" 
        style={{ backgroundImage: `url('/pitch.jpg')` }}
      />
      
      {/* Seamless Distributed Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F19]/80 via-[#0B0F19]/50 to-[#050505] md:to-[#0e1424]/90 z-0 pointer-events-none" />
      
      {/* Main Score Area exactly matching Screenshot 2 Structure */}
      <div className="flex flex-col items-center justify-center text-center relative z-10 pt-4 md:pt-6">
        
        {status === 'INNINGS_BREAK' ? (
          <div className="py-4 mt-2">
            <h2 className="text-4xl font-black text-blue-500 uppercase">Innings Break</h2>
            <div className="text-zinc-300 text-sm mt-2">Target: {runs + 1} • Req RR: {((runs + 1) / totalOvers).toFixed(1)}</div>
          </div>
        ) : status === 'COMPLETED' ? (
          <div className="py-4 mt-2">
            <h2 className="text-4xl font-black text-emerald-500 uppercase">Match Completed</h2>
            <div className="text-zinc-300 text-sm mt-2">Final Score: {runs}/{wickets}</div>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-center gap-1">
              <h1 className="text-5xl md:text-[64px] font-light text-white leading-none font-sans tracking-tight">
                {runs}/{wickets}
              </h1>
              <span className="text-xl font-light text-white/70 ml-1">
                ({oversFormatted} / {totalOvers})
              </span>
            </div>
            
            <div className="mt-4 flex flex-col items-center gap-1">
              {renderStatusBadge()}
              <span className="text-sm font-normal text-white/80 font-serif">
                {tossWinnerName || battingTeamName} won the toss and elected to {tossDecision === 'FIELD' ? 'field' : 'bat'}
              </span>
              
              {/* Optional Required Run Rate display beautifully placed */}
              {innings === 2 && reqRR !== null && runsNeeded !== null && ballsRemaining !== null && (
                 <span className="text-[10px] md:text-[11px] font-bold tracking-widest text-blue-400 mt-1 md:mt-2 border border-blue-500/20 px-2.5 py-1 rounded bg-blue-500/5">
                   NEED {runsNeeded} FROM {ballsRemaining} • REQ RR: {reqRR}
                 </span>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
