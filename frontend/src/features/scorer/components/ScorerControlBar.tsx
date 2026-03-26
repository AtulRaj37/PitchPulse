import { Undo2, History, PauseCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScorerControlBarProps {
  onUndo: () => void;
  onEndInnings: () => void;
  onPause: () => void;
  innings: number;
}

export function ScorerControlBar({ onUndo, onEndInnings, onPause, innings }: ScorerControlBarProps) {
  return (
    <div className="flex gap-3 w-full">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onUndo}
        className="flex-1 flex items-center justify-center gap-2 bg-[#0e1424]/80 backdrop-blur-md border border-white/5 py-3.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-bold text-sm transition-all uppercase tracking-widest shadow-lg"
      >
        <Undo2 className="w-4 h-4" />
        <span>Undo</span>
      </motion.button>
      
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onPause}
        className="flex-1 flex items-center justify-center gap-2 bg-[#0e1424]/80 backdrop-blur-md border border-white/5 py-3.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-bold text-sm transition-all uppercase tracking-widest shadow-lg"
      >
        <PauseCircle className="w-4 h-4" />
        <span>Pause</span>
      </motion.button>

      {innings === 1 && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (confirm('Are you sure you want to end the 1st innings?')) {
              onEndInnings();
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm transition-all uppercase tracking-widest py-3.5 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-blue-400/20"
        >
          <History className="w-4 h-4" />
          <span>Innings Break</span>
        </motion.button>
      )}
    </div>
  );
}
