'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TeamService } from '@/services/api/team.service';
import { LoadingLayer } from '@/components/ui/LoadingLayer';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, MapPin, Plus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await TeamService.getTeams();
        // TeamService returns { data, meta } typically
        setTeams((response as any).data || response);
      } catch (error) {
        console.error('Failed to load teams:', error);
        toast.error('Failed to load teams');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (isLoading) return <LoadingLayer />;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 pb-6 border-b border-zinc-900/50">
        <div>
          <h1 className="text-3xl md:text-4xl font-black font-clash text-white mb-2 tracking-tight">Teams</h1>
          <p className="text-zinc-400 font-medium">Manage your squads and track team performance.</p>
        </div>
        <Link href="/teams/create">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 border border-emerald-400/20"
          >
            <Plus size={18} className="text-white" />
            Create Team
          </motion.button>
        </Link>
      </header>

      <AnimatePresence mode="wait">
        {teams.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center bg-zinc-900/20 border border-dashed border-zinc-800/50 rounded-[2rem] flex flex-col items-center justify-center py-20 px-6 relative overflow-hidden">
            <div className="text-zinc-700 mb-5 flex items-center justify-center p-4 rounded-full bg-zinc-900">
              <Users size={32} />
            </div>
            <h3 className="text-xl font-black text-zinc-300 mb-2 tracking-wide">No teams yet</h3>
            <p className="text-zinc-500 text-sm font-medium max-w-[280px] mb-8 leading-relaxed">Create your first team to start managing players and entering tournaments.</p>
            <Link href="/teams/create">
              <button className="bg-emerald-500 text-zinc-950 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2">
                Create Team
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team, idx) => (
              <motion.div 
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, ease: 'easeOut' }}
                className="glass-premium rounded-[2rem] p-6 border border-white/5 hover:border-white/10 transition-all group flex flex-col"
              >
                  <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 text-xl font-black text-emerald-400">
                    {team.shortName || team.name.slice(0, 3).toUpperCase()}
                  </div>
                
                <h3 className="text-xl font-black font-clash text-white mb-2 truncate">{team.name}</h3>
                
                <div className="flex items-center gap-4 mb-6 text-sm text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Users size={16} className="text-emerald-500/70" />
                    <span className="font-medium text-white">{team.players?.length || 0}</span> players
                  </div>
                  {team.homeGround && (
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin size={16} className="text-emerald-500/70" /> 
                      <span className="truncate">{team.homeGround}</span>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-white/5">
                  <Link href={`/teams/${team.id}`} className="w-full">
                    <button className="w-full py-2.5 bg-zinc-800/50 hover:bg-emerald-500/10 text-zinc-300 hover:text-emerald-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-emerald-500/20">
                      View Team <ArrowRight size={16} />
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
