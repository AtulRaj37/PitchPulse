import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlayerSelectionModalProps {
  isOpen: boolean;
  type: 'STRIKER' | 'NON_STRIKER' | 'BOWLER' | null;
  players: any[];
  onSelect: (playerId: string) => void;
  onCancel?: () => void;
  canCancel?: boolean;
}

export function PlayerSelectionModal({
  isOpen,
  type,
  players,
  onSelect,
  onCancel,
  canCancel = false
}: PlayerSelectionModalProps) {
  
  const getHeaderInfo = () => {
    switch (type) {
      case 'STRIKER': return { title: 'Select Striker', icon: <img src="/icons/batsman.png" className="w-5 h-5 object-contain opacity-80" alt="Bat" /> };
      case 'NON_STRIKER': return { title: 'Select Non-Striker', icon: <img src="/icons/batsman.png" className="w-5 h-5 object-contain opacity-80" alt="Bat" /> };
      case 'BOWLER': return { title: 'Select Bowler', icon: <img src="/icons/bowler.png" className="w-5 h-5 object-contain opacity-80" alt="Ball" /> };
      default: return null;
    }
  };

  const getThemeClass = (role: string | null) => {
    if (role === 'BOWLER') {
      return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', hoverBorder: 'hover:border-blue-500/50', hoverBg: 'hover:bg-blue-500/10', groupHoverBg: 'group-hover:bg-blue-500' };
    }
    return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hoverBorder: 'hover:border-emerald-500/50', hoverBg: 'hover:bg-emerald-500/10', groupHoverBg: 'group-hover:bg-emerald-500' };
  };

  const info = getHeaderInfo();
  const theme = getThemeClass(type);

  return (
    <AnimatePresence>
      {isOpen && info && (
        <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-[#050505]/95 backdrop-blur-md pb-0 md:p-4">
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="w-full max-w-md bg-zinc-950 border-t md:border border-zinc-800 rounded-t-3xl md:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className={`p-6 pb-4 border-b border-zinc-800 shrink-0 relative overflow-hidden`}>
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className={`w-10 h-10 rounded-full ${theme.bg} flex items-center justify-center border ${theme.border} mb-3`}>
                {info.icon}
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">{info.title}</h2>
              <p className="text-zinc-400 text-sm mt-1">Tap a player to assign them directly to the active match state.</p>
            </div>

            {/* Player Grid */}
            <div className="p-6 overflow-y-auto w-full max-h-full no-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                {players.map((p: any) => (
                  <button 
                    key={p.id}
                    onClick={() => onSelect(p.id)}
                    className={`bg-zinc-900 border border-zinc-800 ${theme.hoverBorder} ${theme.hoverBg} text-zinc-300 py-3 px-3 rounded-xl text-sm font-bold transition-all text-left flex items-center gap-3 group overflow-hidden relative shadow-sm`}
                  >
                    <div className={`w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 ${theme.groupHoverBg} transition-colors z-10`}>
                      <img src={type === 'BOWLER' ? "/icons/bowler.png" : "/icons/batsman.png"} alt="Icon" className="w-4 h-4 object-contain opacity-60 group-hover:opacity-100 group-hover:brightness-0 group-hover:invert" />
                    </div>
                    <span className="truncate z-10 group-hover:text-white transition-colors">{p.name}</span>
                  </button>
                ))}
                {players.length === 0 && (
                   <div className="col-span-2 text-center py-6 text-zinc-500 font-medium bg-zinc-900/50 rounded-xl border border-zinc-800 border-dashed">
                     No eligible players available.
                   </div>
                )}
              </div>
            </div>

            {/* Action Controls */}
            {canCancel && onCancel && (
              <div className="px-6 pb-8 pt-2 shrink-0 bg-zinc-950">
                <button 
                  onClick={onCancel}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-zinc-800 hover:text-white transition-colors text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
