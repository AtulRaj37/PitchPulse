'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { TournamentService } from '@/services/api/tournament.service';
import { LoadingLayer } from '@/components/ui/LoadingLayer';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Calendar, Plus } from 'lucide-react';
import clsx from 'clsx';

export default function TournamentsPage() {
  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => TournamentService.getTournaments()
  });

  if (isLoading) return <LoadingLayer />;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 pb-6 border-b border-zinc-900/50">
        <div>
          <h1 className="text-3xl md:text-4xl font-black font-clash text-white mb-2 tracking-tight">Tournaments</h1>
          <p className="text-zinc-400 font-medium">Organize and track entire series and competitions.</p>
        </div>
        <Link href="/tournaments/create">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-orange-400 text-white font-bold px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2 border border-amber-400/20"
          >
            <Plus size={18} className="text-white" />
            Create Tournament
          </motion.button>
        </Link>
      </header>

      <AnimatePresence mode="wait">
        {tournaments.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center bg-zinc-900/20 border border-dashed border-zinc-800/50 rounded-[2rem] flex flex-col items-center justify-center py-20 px-6 relative overflow-hidden">
            <div className="text-zinc-700 mb-5 flex items-center justify-center p-4 rounded-full bg-zinc-900">
              <Trophy size={32} />
            </div>
            <h3 className="text-xl font-black text-zinc-300 mb-2 tracking-wide">No active tournaments</h3>
            <p className="text-zinc-500 text-sm font-medium max-w-[280px] mb-8 leading-relaxed">Group matches together and generate automated points tables by launching a series.</p>
            <Link href="/tournaments/create">
              <button className="bg-amber-500 text-zinc-950 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2">
                Create Tournament
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t, idx) => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, ease: 'easeOut' }}
                className="glass-premium rounded-[2rem] p-6 border border-white/5 hover:border-white/10 transition-all group flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 text-amber-500">
                    <Trophy size={20} />
                  </div>
                  <span className={clsx(
                    "text-[10px] font-bold px-2.5 py-1 rounded-lg border tracking-widest uppercase",
                    t.status === 'ACTIVE' || t.status === 'UPCOMING' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  )}>
                    {t.status}
                  </span>
                </div>
                
                <h3 className="text-xl font-black font-clash text-white mb-2 line-clamp-2 leading-tight">{t.name}</h3>
                
                <div className="mt-auto pt-6 flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Format</span>
                    <span className="text-sm font-bold text-zinc-300">{t.format}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Overs</span>
                    <span className="text-sm font-bold text-zinc-300">{t.overs}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
