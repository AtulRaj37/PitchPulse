import React, { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
export type BowlerAngle = 'OVER_THE_WICKET' | 'ROUND_THE_WICKET' | 'BETWEEN_THE_WICKET';

interface BowlerAngleModalProps {
  onSave: (angle: BowlerAngle) => void;
  bowlerName: string;
}

export function BowlerAngleModal({ onSave, bowlerName }: BowlerAngleModalProps) {
  const [angle, setAngle] = useState<BowlerAngle>('OVER_THE_WICKET');

  const AngleOption = ({ type, label, activeColor }: { type: BowlerAngle; label: string; activeColor: string }) => {
    const isSelected = angle === type;
    return (
      <button
        onClick={() => setAngle(type)}
        className={clsx(
          "w-full p-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all border outline-none flex justify-between items-center group overflow-hidden relative",
          isSelected 
            ? `bg-${activeColor}-500/10 border-${activeColor}-500/50 text-${activeColor}-400 shadow-[0_0_20px_rgba(var(--${activeColor}-rgb),0.15)]` 
            : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
        )}
      >
        <div className="flex gap-3 items-center z-10 relative">
          <div className={clsx("w-8 h-8 rounded-full border flex items-center justify-center transition-colors", isSelected ? `border-${activeColor}-500/50 bg-${activeColor}-500/20` : "border-white/10 bg-black/20")}>
            <div className="flex gap-[2px] items-end">
              <div className={clsx("w-[2px] h-3 rounded-sm transition-colors", isSelected && type === 'OVER_THE_WICKET' ? `bg-${activeColor}-400` : "bg-zinc-500")} />
              <div className={clsx("w-[2px] h-4 rounded-sm transition-colors", isSelected && type === 'BETWEEN_THE_WICKET' ? `bg-${activeColor}-400` : "bg-zinc-500")} />
              <div className={clsx("w-[2px] h-3 rounded-sm transition-colors", isSelected && type === 'ROUND_THE_WICKET' ? `bg-${activeColor}-400` : "bg-zinc-500")} />
            </div>
          </div>
          <span>{label}</span>
        </div>
        
        {isSelected && (
          <motion.div 
            layoutId="activeAngleIndicator"
            className={clsx("w-3 h-3 rounded-full relative z-10", `bg-${activeColor}-500`)} 
          />
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Background Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-[#0e1424] border border-white/10 rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl relative overflow-hidden flex flex-col z-10"
      >
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50 blur-sm" />
        
        <div className="text-center mb-8 relative">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/50 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <img 
              src="/icons/ball.png" 
              alt="Ball" 
              className="w-8 h-8 object-contain [filter:brightness(0)_saturate(100%)_invert(80%)_sepia(45%)_saturate(444%)_hue-rotate(100deg)_brightness(102%)_contrast(98%)] drop-shadow-md" 
            />
          </div>
          <h2 className="text-2xl font-black font-clash text-white uppercase tracking-tighter drop-shadow-sm">
            Select Angle
          </h2>
          <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 bg-emerald-500/10 inline-block px-3 py-1 rounded-full border border-emerald-500/20">
            Bowler: <span className="text-white">{bowlerName}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          <AngleOption type="OVER_THE_WICKET" label="Over The Wicket" activeColor="emerald" />
          <AngleOption type="BETWEEN_THE_WICKET" label="Between The Wicket" activeColor="emerald" />
          <AngleOption type="ROUND_THE_WICKET" label="Round The Wicket" activeColor="emerald" />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onSave(angle)}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-black uppercase tracking-widest hover:from-emerald-400 hover:to-teal-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
        >
          Confirm Details
        </motion.button>
      </motion.div>
    </div>
  );
}
