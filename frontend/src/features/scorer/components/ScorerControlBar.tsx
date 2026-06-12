import { Undo2, History, PauseCircle, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ScorerControlBarProps {
  onUndo: () => void;
  onAudit: () => void;
  onEndInnings: () => void;
  onPause: () => void;
  innings: number;
}

export function ScorerControlBar({ onUndo, onAudit, onEndInnings, onPause, innings }: ScorerControlBarProps) {
  return (
    <div className={clsx("grid gap-2 w-full", innings === 1 ? "grid-cols-4" : "grid-cols-3")}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onUndo}
        className="flex flex-col items-center justify-center gap-1 md:gap-1.5 bg-[#0e1424]/80 backdrop-blur-md border border-white/5 py-2.5 md:py-4 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-bold transition-all shadow-lg"
      >
        <Undo2 size={18} />
        <span className="text-[9px] uppercase tracking-widest">Undo</span>
      </motion.button>
      
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onAudit}
        className="flex flex-col items-center justify-center gap-1 md:gap-1.5 bg-red-500/10 backdrop-blur-md border border-red-500/20 py-2.5 md:py-4 rounded-xl text-red-500 hover:text-red-400 hover:bg-red-500/20 font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]"
      >
        <ShieldAlert size={18} />
        <span className="text-[9px] uppercase tracking-widest">Audit</span>
      </motion.button>
      
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onPause}
        className="flex flex-col items-center justify-center gap-1 md:gap-1.5 bg-[#0e1424]/80 backdrop-blur-md border border-white/5 py-2.5 md:py-4 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-bold transition-all shadow-lg"
      >
        <PauseCircle size={18} />
        <span className="text-[9px] uppercase tracking-widest">Pause</span>
      </motion.button>

      {innings === 1 && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (confirm('Are you sure you want to end the 1st innings?')) {
              onEndInnings();
            }
          }}
          className="flex flex-col items-center justify-center gap-1 md:gap-1.5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold transition-all py-2.5 md:py-4 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-400/30 text-center px-1"
        >
          <History size={18} />
          <span className="text-[9px] uppercase tracking-widest leading-tight">Match<br/>Break</span>
        </motion.button>
      )}
    </div>
  );
}
