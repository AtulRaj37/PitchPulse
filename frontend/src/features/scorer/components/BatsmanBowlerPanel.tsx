import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useScorerStore } from '@/features/scorer/scorer.store';

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
  timeline?: string[];
}

export function BatsmanBowlerPanel({ striker, nonStriker, bowler, timeline = [] }: BatsmanBowlerPanelProps) {
  const bowlerAngle = useScorerStore(state => state.bowlerAngle);
  const setBowler = useScorerStore(state => state.setBowler);
  
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
      "grid grid-cols-12 gap-2 py-4 lg:py-6 px-4 sm:px-6 items-center text-[13px] sm:text-sm font-medium transition-colors relative",
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
      className="flex flex-col gap-0 md:gap-3"
    >
      {/* =========================================================================
          MOBILE-ONLY: PRECISE TARGET REPLICA (PITCHPULSE DARK THEME)
      ========================================================================== */}
      <div className="flex flex-col md:hidden w-full bg-[#111820]/95 backdrop-blur-xl border-t border-white/5 opacity-100 z-20">
        
        {/* Batsman Strip (Horizontal Split) */}
        <div className="grid grid-cols-2 divide-x divide-white/5 border-b border-white/5">
          {/* Striker */}
          <div className="px-4 py-2 relative flex flex-col justify-center bg-white/[0.01]">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-orange-500/50" />
            <div className="flex items-center gap-2 mb-1">
               {/* Premium Orange Bat Icon */}
               <div className="w-5 h-5 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                  <img src="/icons/bat.png" alt="Bat" className="w-3.5 h-3.5 object-contain [filter:brightness(0)_saturate(100%)_invert(63%)_sepia(57%)_saturate(5734%)_hue-rotate(352deg)_brightness(102%)_contrast(105%)]" />
               </div>
              <span className="truncate text-sm font-bold text-white tracking-wide">{striker.name || 'Striker'}</span>
            </div>
            <div className="flex items-baseline pl-7">
              <span className="text-zinc-300 font-medium text-sm leading-none">{striker.runs}({striker.balls})</span>
            </div>
          </div>
          
          {/* Non-Striker */}
          <div className="px-4 py-2 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
               {/* Grayscale Bat Icon */}
               <div className="w-5 h-5 rounded-full bg-zinc-700/20 flex items-center justify-center shrink-0">
                  <img src="/icons/bat.png" alt="Bat" className="w-3.5 h-3.5 object-contain grayscale opacity-60" />
               </div>
              <span className="truncate text-sm font-medium text-zinc-300 tracking-wide">{nonStriker.name || 'Non-Striker'}</span>
            </div>
            <div className="flex items-baseline pl-7">
              <span className="text-zinc-500 font-medium text-sm leading-none">{nonStriker.runs}({nonStriker.balls})</span>
            </div>
          </div>
        </div>

        {/* Bowler Strip */}
        <div className="flex flex-col bg-[#141d26]">
          {/* Bowler Name & Stats Row */}
          <div className="px-4 py-2 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
               <div className="w-5 h-5 rounded-full bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.3)] flex items-center justify-center shrink-0">
                  <img src="/icons/ball.png" alt="Ball" className="w-3.5 h-3.5 object-contain [filter:brightness(0)_saturate(100%)_invert(60%)_sepia(50%)_saturate(4000%)_hue-rotate(200deg)_brightness(100%)_contrast(100%)]" />
               </div>
              <span className="truncate font-black text-blue-400 tracking-wide text-sm drop-shadow-sm">{bowler.name || 'Bowler'}</span>
            </div>
            <div className="font-sans font-black text-white text-sm tracking-widest drop-shadow-lg">
              {bowler.overs}-{bowler.maidens}-{bowler.runs}-<span className="text-red-400">{bowler.wickets}</span>
            </div>
          </div>
          
          {/* Inline Mobile Timeline */}
          <div className="px-4 py-1.5 bg-black/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-h-[40px]">
            {timeline.length > 0 ? timeline.map((event, idx) => (
              <div 
                key={`${idx}-${event}`} 
                className={clsx(
                  "w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-black font-clash shrink-0 border",
                  event === 'W' || event.includes('W') ? "bg-red-500 text-white border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]" :
                  event === '4' ? "bg-blue-500 text-white border-blue-400" :
                  event === '6' ? "bg-fuchsia-500 text-white border-fuchsia-400" :
                  event.includes('Wd') || event.includes('Nb') || event.includes('B') || event.includes('Lb') ? "bg-amber-500 text-white border-amber-400" :
                  event === '0' ? "bg-transparent text-zinc-400 border-zinc-600 border-dashed" :
                  "bg-zinc-800 text-white border-zinc-600"
                )}
              >
                {event}
              </div>
            )) : (
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">Ready for first ball...</span>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP-ONLY: DETAILED TABLES
      ========================================================================== */}
      
      {/* Batting Table */}
      <div className="hidden md:block bg-zinc-950/80 backdrop-blur-xl rounded-[1.25rem] border border-zinc-800/50 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-32 bg-primary-500/10 blur-3xl pointer-events-none" />
        
        <div className="bg-white/[0.02] px-6 py-3 border-b border-zinc-800 grid grid-cols-12 gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-500">
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
      <div className="hidden md:block bg-[#0e1424]/80 backdrop-blur-xl rounded-[1.25rem] border border-blue-500/20 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.1)] relative">
        <div className="absolute top-0 right-0 w-64 h-32 bg-blue-500/10 blur-3xl pointer-events-none" />
        
        <div className="bg-white/[0.02] px-6 py-3 border-b border-blue-500/10 grid grid-cols-12 gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-500">
          <div className="col-span-5">BOWLER</div>
          <div className="col-span-7 grid grid-cols-5 gap-1 text-right">
            <div>O</div>
            <div>M</div>
            <div>R</div>
            <div className="text-red-400">W</div>
            <div>ECO</div>
          </div>
        </div>
        
        <div className="grid grid-cols-12 gap-2 py-4 lg:py-[1.375rem] px-6 items-center text-sm font-medium hover:bg-white/[0.02] transition-colors relative z-10 bg-blue-500/[0.03]">
          <div className="col-span-5 flex items-center gap-3 overflow-hidden">
            <div className="w-2 h-2 rounded-full border-2 border-blue-400 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] shrink-0" />
            <span className="truncate font-black tracking-tight text-blue-400">
              {bowler.name || 'Select Bowler...'}
            </span>
          </div>
          
          <div className="col-span-7 grid grid-cols-5 gap-1 text-right font-jetbrains">
            <div className="text-white font-bold">{bowlerOvers}</div>
            <div className="text-zinc-400">{bowler.maidens}</div>
            <div className="text-white font-medium">{bowler.runs}</div>
            <div className="text-red-500 font-black text-base">{bowler.wickets}</div>
            <div className="text-blue-400 font-bold">{getEcon(bowler.runs, bowler.overs, bowler.balls)}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
