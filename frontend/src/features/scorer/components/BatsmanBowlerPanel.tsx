import clsx from 'clsx';
import { motion } from 'framer-motion';

// Types for the panel
export interface BatsmanData {
  id: string | null;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
}

export interface BowlerData {
  id: string | null;
  name: string;
  overs: number;
  balls: number; // 0-5
  maidens: number;
  runs: number;
  wickets: number;
}

interface BatsmanBowlerPanelProps {
  striker: BatsmanData;
  nonStriker: BatsmanData;
  bowler: BowlerData;
}

export function BatsmanBowlerPanel({ striker, nonStriker, bowler }: BatsmanBowlerPanelProps) {
  
  // Calculate Strike Rates
  const getSR = (runs: number, balls: number) => {
    if (balls === 0) return '0.0';
    return ((runs / balls) * 100).toFixed(1);
  };

  // Calculate Economy
  const getEcon = (runs: number, overs: number, balls: number) => {
    const totalBalls = (overs * 6) + balls;
    if (totalBalls === 0) return '0.0';
    return (runs / (totalBalls / 6)).toFixed(1);
  };

  const bowlerOvers = `${bowler.overs}.${bowler.balls}`;
  
  // Partnership Calculation
  const totalPartnerRuns = striker.runs + nonStriker.runs;
  const strikerPct = totalPartnerRuns === 0 ? 50 : (striker.runs / totalPartnerRuns) * 100;
  const nonStrikerPct = totalPartnerRuns === 0 ? 50 : 100 - strikerPct;

  const renderBatsmanRow = (bat: BatsmanData, isStriker: boolean) => (
    <div className={clsx(
      "grid grid-cols-12 gap-2 py-3.5 px-4 sm:px-6 items-center text-[13px] sm:text-sm font-medium transition-colors relative",
      isStriker ? "bg-primary-500/[0.08]" : "hover:bg-white/[0.02]"
    )}>
      {/* Animated Striker Background Glow */}
      {isStriker && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent pointer-events-none" />
      )}
      
      <div className="col-span-5 flex items-center gap-3 overflow-hidden relative z-10">
        {isStriker ? (
          <div className="relative flex items-center justify-center shrink-0">
            <span className="w-2 h-2 rounded-full border-2 border-primary-400 bg-primary-500 z-10" />
            <span className="absolute w-4 h-4 rounded-full bg-primary-500/40 animate-ping" />
          </div>
        ) : (
          <div className="w-2 h-2 shrink-0" />
        )}
        <span className={clsx(
          "truncate font-black tracking-tight",
          isStriker ? "text-primary-400" : "text-zinc-300"
        )}>
          {bat.name || 'Select Striker...'}
          {isStriker && <span className="ml-2 text-[10px] text-primary-500/50 uppercase italic font-bold">*</span>}
        </span>
      </div>
      
      <div className="col-span-7 grid grid-cols-5 gap-1 text-right relative z-10 font-jetbrains">
        <div className="text-white font-black text-base">{bat.runs}</div>
        <div className="text-zinc-400 font-medium">{bat.balls}</div>
        <div className="text-zinc-500">{bat.fours}</div>
        <div className="text-zinc-500">{bat.sixes}</div>
        <div className="text-primary-500/80 font-bold">{getSR(bat.runs, bat.balls)}</div>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      {/* Batting Table */}
      <div className="bg-zinc-950/80 backdrop-blur-xl rounded-[1.25rem] border border-zinc-800/50 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-32 bg-primary-500/10 blur-3xl pointer-events-none" />
        
        <div className="bg-white/[0.02] px-4 sm:px-6 py-3 border-b border-zinc-800 grid grid-cols-12 gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500">
          <div className="col-span-5">BATTER</div>
          <div className="col-span-7 grid grid-cols-5 gap-1 text-right">
            <div className="text-zinc-300">R</div>
            <div>B</div>
            <div>4s</div>
            <div>6s</div>
            <div>SR</div>
          </div>
        </div>
        
        <div className="flex flex-col divide-y divide-zinc-800/50 relative z-10">
          {renderBatsmanRow(striker, true)}
          {renderBatsmanRow(nonStriker, false)}
        </div>

        {/* Partnership Bar */}
        {(striker.id || nonStriker.id) && (
          <div className="bg-black/40 px-6 py-3 border-t border-zinc-800/50">
            <div className="flex justify-between items-center mb-1.5 text-[10px] font-bold uppercase tracking-widest">
              <span className="text-primary-500">{striker.runs}</span>
              <span className="text-zinc-500">Current Partnership ({totalPartnerRuns})</span>
              <span className="text-zinc-400">{nonStriker.runs}</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
              <motion.div 
                className="h-full bg-primary-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] rounded-l-full"
                animate={{ width: `${strikerPct}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              />
              <motion.div 
                className="h-full bg-zinc-400 rounded-r-full"
                animate={{ width: `${nonStrikerPct}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bowling Table */}
      <div className="bg-zinc-950/80 backdrop-blur-xl rounded-[1.25rem] border border-zinc-800/50 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-32 bg-accent-500/10 blur-3xl pointer-events-none" />
        
        <div className="bg-white/[0.02] px-4 sm:px-6 py-3 border-b border-zinc-800 grid grid-cols-12 gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500">
          <div className="col-span-5">BOWLER</div>
          <div className="col-span-7 grid grid-cols-5 gap-1 text-right">
            <div>O</div>
            <div>M</div>
            <div>R</div>
            <div className="text-red-400">W</div>
            <div>ECO</div>
          </div>
        </div>
        
        <div className="grid grid-cols-12 gap-2 py-4 px-4 sm:px-6 items-center text-[13px] sm:text-sm font-medium hover:bg-white/[0.02] transition-colors relative z-10">
          <div className="col-span-5 flex items-center gap-3 overflow-hidden">
            <div className="w-2 h-2 rounded-full border-2 border-accent-400 bg-accent-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] shrink-0" />
            <span className="truncate font-black tracking-tight text-accent-400">
              {bowler.name || 'Select Bowler...'}
            </span>
          </div>
          
          <div className="col-span-7 grid grid-cols-5 gap-1 text-right font-jetbrains">
            <div className="text-zinc-300 font-bold">{bowlerOvers}</div>
            <div className="text-zinc-500">{bowler.maidens}</div>
            <div className="text-white font-medium">{bowler.runs}</div>
            <div className="text-red-400 font-black text-base">{bowler.wickets}</div>
            <div className="text-accent-400/80 font-bold">{getEcon(bowler.runs, bowler.overs, bowler.balls)}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
