'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { TournamentService } from '@/services/api/tournament.service';
import { LoadingLayer } from '@/components/ui/LoadingLayer';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Plus, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

export default function TournamentsPage() {
  const router = useRouter();
  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => TournamentService.getTournaments()
  });

  if (isLoading) return <LoadingLayer />;

  return (
    <div className="pb-32 w-full max-w-[1400px] mx-auto overflow-hidden">
      
      {/* CINEMATIC TOURNAMENTS HEADER */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="pt-12 px-8 md:px-16 flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
        <div>
          <h1 className="text-6xl md:text-8xl font-black font-clash text-white tracking-tighter uppercase mb-2">
            Tourna<span className="text-amber-500 italic drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">ments</span>
          </h1>
          <p className="text-zinc-500 font-bold tracking-widest uppercase text-sm">
            Organize and track your cricket competitions.
          </p>
        </div>

        <div className="flex w-full md:w-auto">
          <Link href="/tournaments/create" className="w-full">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white text-zinc-950 px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-amber-400 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} /> New Tournament
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* TOURNAMENTS LIST */}
      <div className="px-4 md:px-8">
        <AnimatePresence mode="wait">
          {tournaments.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-32 text-center">
              <h3 className="text-4xl font-clash font-black text-zinc-700 uppercase tracking-tighter mb-4">No active tournaments</h3>
              <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Group matches together and generate automated points tables.</p>
              <Link href="/tournaments/create" className="mt-8">
                <button className="bg-amber-500 text-zinc-950 px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all flex items-center gap-2">
                  Launch Foundation
                </button>
              </Link>
            </motion.div>
          ) : (
            <div className="flex flex-col">
              {tournaments.map((t, idx) => (
                <motion.div 
                  key={t.id}
                  onClick={() => router.push(`/tournaments/${t.id}`)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, ease: 'easeOut' }}
                  className="group border-b border-white/5 py-8 px-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:bg-white/[0.03] transition-colors relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 w-1 h-full bg-amber-500 scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)]" />

                  <div className="flex items-center gap-6 md:gap-10 w-full md:w-auto z-10">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-[#050505] rounded-2xl flex items-center justify-center border border-zinc-800 shadow-inner group-hover:border-amber-500/50 transition-colors">
                      <Trophy className="w-8 h-8 md:w-10 md:h-10 text-zinc-700 group-hover:text-amber-500 transition-colors" />
                    </div>
                    
                    <div>
                      <h3 className="text-2xl md:text-4xl font-black font-clash text-white tracking-tighter group-hover:text-amber-400 transition-colors uppercase">
                        {t.name}
                      </h3>
                      <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-2 flex items-center gap-3">
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[9px] border",
                          t.status === 'ACTIVE' || t.status === 'UPCOMING' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        )}>
                          {t.status}
                        </span>
                        {t.format} • {t.overs} Overs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end w-full md:w-auto z-10 gap-6 mt-4 md:mt-0">
                    <div className="flex flex-col text-right">
                      <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Configuration</span>
                      <span className="text-lg font-black font-clash text-zinc-300">
                        {t.overs} Ov / {t.format}
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 group-hover:border-amber-500 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition-all bg-[#050505] shadow-[0_0_15px_transparent] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] shrink-0">
                      <ArrowUpRight className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                    </div>
                  </div>

                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
