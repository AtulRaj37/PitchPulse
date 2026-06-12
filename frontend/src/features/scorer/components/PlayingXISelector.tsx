import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, CheckCircle2, Loader2, Users } from 'lucide-react';
import clsx from 'clsx';

interface Player {
  id: string;
  name: string;
  role: string;
}

interface TeamData {
  name: string;
  players: Player[];
}

interface PlayingXISelectorProps {
  matchData: {
    team1: TeamData;
    team2: TeamData;
    team1PlayingXI?: string[];
    team2PlayingXI?: string[];
  };
  onComplete: (team1XI: string[], team2XI: string[]) => Promise<void>;
}

export function PlayingXISelector({ matchData, onComplete }: PlayingXISelectorProps) {
  const [team1Selected, setTeam1Selected] = useState<Set<string>>(new Set(matchData.team1PlayingXI || []));
  const [team2Selected, setTeam2Selected] = useState<Set<string>>(new Set(matchData.team2PlayingXI || []));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePlayer = (team: 1 | 2, playerId: string) => {
    if (team === 1) {
      const next = new Set(team1Selected);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      setTeam1Selected(next);
    } else {
      const next = new Set(team2Selected);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      setTeam2Selected(next);
    }
  };

  const handleSave = async () => {
    if (team1Selected.size < 2 || team2Selected.size < 2) {
      return;
    }
    setIsSubmitting(true);
    await onComplete(Array.from(team1Selected), Array.from(team2Selected));
    setIsSubmitting(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'BATSMAN': return '🏏';
      case 'BOWLER': return '⚾';
      case 'ALL_ROUNDER': return '⚡';
      case 'WICKET_KEEPER': return '🧤';
      case 'WICKET_KEEPER_BATSMAN': return '🧤🏏';
      default: return '👤';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-6 md:p-10 max-w-5xl w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Users size={32} />
          </div>
          <h2 className="text-3xl md:text-5xl font-black font-clash text-white tracking-tighter uppercase mb-2">Select Playing Squads</h2>
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Lock in the active roster before the first ball</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-10">
          {/* TEAM 1 */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-xl font-black font-clash text-white uppercase flex items-center gap-3">
                <Shield className="text-amber-500" size={24} /> 
                {matchData.team1.name}
              </h3>
              <span className={clsx("text-sm font-bold tracking-widest px-3 py-1 rounded-full border", team1Selected.size >= 2 ? "bg-amber-500/10 text-amber-500 border-amber-500/30" : "bg-red-500/10 text-red-500 border-red-500/30")}>
                {team1Selected.size} Selected
              </span>
            </div>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {matchData.team1.players.map(p => {
                const isSelected = team1Selected.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlayer(1, p.id)}
                    className={clsx(
                      "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group text-left",
                      isSelected ? "bg-amber-500/10 border-amber-500/50 shadow-inner" : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={clsx("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", isSelected ? "border-amber-500 bg-amber-500 text-amber-950" : "border-zinc-600")}>
                        {isSelected && <CheckCircle2 size={16} />}
                      </div>
                      <div>
                        <div className={clsx("font-bold text-base transition-colors", isSelected ? "text-amber-400" : "text-zinc-300 group-hover:text-white")}>{p.name}</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{p.role.replace('_', ' ')}</div>
                      </div>
                    </div>
                    <div className="text-xl opacity-60 grayscale group-hover:grayscale-0">{getRoleIcon(p.role)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TEAM 2 */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-xl font-black font-clash text-white uppercase flex items-center gap-3">
                <Shield className="text-blue-500" size={24} /> 
                {matchData.team2.name}
              </h3>
              <span className={clsx("text-sm font-bold tracking-widest px-3 py-1 rounded-full border", team2Selected.size >= 2 ? "bg-blue-500/10 text-blue-500 border-blue-500/30" : "bg-red-500/10 text-red-500 border-red-500/30")}>
                {team2Selected.size} Selected
              </span>
            </div>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {matchData.team2.players.map(p => {
                const isSelected = team2Selected.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlayer(2, p.id)}
                    className={clsx(
                      "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group text-left",
                      isSelected ? "bg-blue-500/10 border-blue-500/50 shadow-inner" : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={clsx("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", isSelected ? "border-blue-500 bg-blue-500 text-blue-950" : "border-zinc-600")}>
                        {isSelected && <CheckCircle2 size={16} />}
                      </div>
                      <div>
                        <div className={clsx("font-bold text-base transition-colors", isSelected ? "text-blue-400" : "text-zinc-300 group-hover:text-white")}>{p.name}</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{p.role.replace('_', ' ')}</div>
                      </div>
                    </div>
                    <div className="text-xl opacity-60 grayscale group-hover:grayscale-0">{getRoleIcon(p.role)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-center border-t border-zinc-800 pt-8 mt-4">
          <button
            onClick={handleSave}
            disabled={isSubmitting || team1Selected.size < 2 || team2Selected.size < 2}
            className="w-full max-w-sm bg-emerald-500 text-zinc-950 py-5 rounded-full font-black text-lg uppercase tracking-widest hover:bg-emerald-400 hover:scale-105 transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 flex items-center justify-center gap-3"
          >
            {isSubmitting ? <><Loader2 className="animate-spin" size={24} /> PREPARING SQUADS...</> : 'LOCK PLAYING XI'}
          </button>
        </div>
        
        {(team1Selected.size < 2 || team2Selected.size < 2) && (
          <p className="text-center text-red-500 text-xs font-bold mt-4 uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldAlert size={14} /> MUST SELECT AT LEAST 2 PLAYERS PER TEAM
          </p>
        )}
      </motion.div>
    </div>
  );
}
