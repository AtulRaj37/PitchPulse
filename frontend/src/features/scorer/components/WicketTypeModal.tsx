import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, X, Navigation, UserCircle2 } from 'lucide-react';
import clsx from 'clsx';

export type WicketType = 
  | 'BOWLED' | 'CAUGHT' | 'LBW' | 'RUN_OUT' 
  | 'STUMPED' | 'HIT_WICKET' | 'RETIRED_HURT' 
  | 'OBSTRUCTING_FIELD' | 'TIMED_OUT';

export type DismissalMode = 'BATSMAN_OUT' | 'NON_STRIKER_OUT';

interface Player {
  id: string;
  name: string;
}

interface WicketTypeModalProps {
  onSave: (data: { wicketType: WicketType; dismissalMode: DismissalMode; fielderId?: string }) => void;
  onCancel: () => void;
  fieldingTeamPlayers: Player[];
  strikerName: string;
  nonStrikerName: string;
}

const WICKET_TYPES: { id: WicketType; label: string; requiresFielder: boolean }[] = [
  { id: 'BOWLED', label: 'Bowled', requiresFielder: false },
  { id: 'CAUGHT', label: 'Caught', requiresFielder: true },
  { id: 'LBW', label: 'LBW', requiresFielder: false },
  { id: 'RUN_OUT', label: 'Run Out', requiresFielder: true },
  { id: 'STUMPED', label: 'Stumped', requiresFielder: true },
  { id: 'HIT_WICKET', label: 'Hit Wicket', requiresFielder: false },
  { id: 'RETIRED_HURT', label: 'Retired Hurt', requiresFielder: false },
];

export function WicketTypeModal({ onSave, onCancel, fieldingTeamPlayers, strikerName, nonStrikerName }: WicketTypeModalProps) {
  const [wicketType, setWicketType] = useState<WicketType>('BOWLED');
  const [dismissalMode, setDismissalMode] = useState<DismissalMode>('BATSMAN_OUT');
  const [fielderId, setFielderId] = useState<string | undefined>();
  
  const selectedTypeObj = WICKET_TYPES.find(w => w.id === wicketType);
  const requiresFielder = selectedTypeObj?.requiresFielder || false;

  const handleSave = () => {
    if (requiresFielder && !fielderId) return; // Prevent saving if missing required data
    onSave({ wicketType, dismissalMode, fielderId });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 pb-0">
      <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-[#050505] border border-red-900/50 sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(220,38,38,0.15)] relative overflow-hidden flex flex-col h-[90dvh] sm:h-auto sm:max-h-[85vh] w-full max-w-4xl"
      >
        {/* Glow Header */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-rose-400 to-red-600" />
        
        <div className="flex justify-between items-center p-5 lg:px-8 lg:py-6 shrink-0 border-b border-red-900/30 relative z-20 bg-black/40">
          <div>
            <h2 className="text-2xl md:text-3xl font-black font-clash text-white uppercase flex items-center gap-3">
              <ShieldAlert className="text-red-500 w-8 h-8" />
              Wicket Details
            </h2>
            <p className="text-red-400/80 font-bold uppercase tracking-widest text-xs mt-1">Record the exact method of dismissal</p>
          </div>
          <button onClick={onCancel} className="p-3 bg-zinc-900 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 min-h-0 w-full flex flex-col overflow-y-auto custom-scrollbar bg-[#050505] p-5 pb-12 lg:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Left Col: Wicket Type & Angles */}
            <div className="flex flex-col gap-6">
              
              <div className="bg-red-950/20 rounded-2xl p-5 border border-red-900/30">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                  <ShieldAlert size={14} className="text-red-500" />
                  Method of Dismissal
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {WICKET_TYPES.map(wt => (
                    <button
                      key={wt.id}
                      onClick={() => setWicketType(wt.id)}
                      className={clsx(
                        "py-3 rounded-lg font-bold text-xs transition-all border uppercase tracking-widest w-full text-center",
                        wicketType === wt.id
                          ? "bg-red-500/20 border-red-500 text-red-500 shadow-inner"
                          : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                      )}
                    >
                      {wt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Eliminated Bowler Angle UI Element - Moved to Start of Over */}

            </div>

            {/* Right Col: Targets & Fielders */}
            <div className="flex flex-col gap-6">
              
              <div className="bg-zinc-900/40 rounded-2xl p-5 border border-white/5">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                  <UserCircle2 size={14} className="text-purple-400" />
                  Who is Out?
                </h3>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setDismissalMode('BATSMAN_OUT')}
                    className={clsx(
                      "flex items-center justify-between p-4 rounded-xl border transition-all text-left group",
                      dismissalMode === 'BATSMAN_OUT' 
                        ? "bg-purple-500/10 border-purple-500 shadow-inner" 
                        : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800"
                    )}
                  >
                    <div>
                      <div className={clsx("font-bold text-lg", dismissalMode === 'BATSMAN_OUT' ? "text-purple-400" : "text-white")}>{strikerName}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Striker</div>
                    </div>
                    {dismissalMode === 'BATSMAN_OUT' && <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />}
                  </button>

                  <button
                    onClick={() => setDismissalMode('NON_STRIKER_OUT')}
                    disabled={wicketType !== 'RUN_OUT' && wicketType !== 'OBSTRUCTING_FIELD' && wicketType !== 'RETIRED_HURT'}
                    className={clsx(
                      "flex items-center justify-between p-4 rounded-xl border transition-all text-left group disabled:opacity-30 disabled:grayscale cursor-pointer disabled:cursor-not-allowed",
                      dismissalMode === 'NON_STRIKER_OUT' 
                        ? "bg-purple-500/10 border-purple-500 shadow-inner" 
                        : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800"
                    )}
                  >
                    <div>
                      <div className={clsx("font-bold text-lg", dismissalMode === 'NON_STRIKER_OUT' ? "text-purple-400" : "text-white")}>{nonStrikerName}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Non-Striker</div>
                    </div>
                    {dismissalMode === 'NON_STRIKER_OUT' && <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />}
                  </button>
                </div>
              </div>

              {/* Fielder Dropdown */}
              {requiresFielder && (
                <div className="bg-amber-950/20 rounded-2xl p-5 border border-amber-900/30">
                   <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                     <UserCircle2 size={14} className="text-amber-500" />
                     Involved Fielder <span className="text-red-500 ml-1">*</span>
                   </h3>
                   <div className="relative">
                     <select 
                       value={fielderId || ''} 
                       onChange={e => setFielderId(e.target.value)} 
                       className="w-full appearance-none bg-zinc-950/80 border-2 border-zinc-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-amber-500 transition-all font-bold text-base cursor-pointer shadow-inner"
                     >
                       <option value="" disabled>Select the Fielder...</option>
                       {fieldingTeamPlayers.map(p => (
                         <option key={p.id} value={p.id}>{p.name}</option>
                       ))}
                     </select>
                     <div className="absolute top-1/2 right-5 -translate-y-1/2 pointer-events-none text-amber-500 text-sm font-bold">▼</div>
                   </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 flex items-center justify-between lg:justify-end gap-3 w-full border-t border-red-900/30 py-4 px-5 lg:px-8 bg-zinc-950 relative z-20 pb-safe pb-8 sm:pb-4 mt-auto">
          <button
            onClick={onCancel}
            className="flex-1 lg:flex-none px-6 py-3 rounded-xl text-xs lg:text-sm font-black uppercase tracking-widest text-[#a1a1aa] hover:text-white hover:bg-zinc-900 transition-colors border border-transparent hover:border-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={requiresFielder && !fielderId}
            className="flex-1 lg:flex-none px-8 py-3 rounded-xl text-xs lg:text-sm bg-gradient-to-r from-red-600 to-red-500 text-white font-black uppercase tracking-widest shadow-[0_5px_15px_rgba(220,38,38,0.3)] hover:scale-[1.02] active:scale-95 transition-all outline-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Confirm Wicket
          </button>
        </div>
      </motion.div>
    </div>
  );
}
