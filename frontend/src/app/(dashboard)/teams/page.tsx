'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { TeamService } from '@/services/api/team.service';
import { LoadingLayer } from '@/components/ui/LoadingLayer';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, MapPin, Plus, ArrowUpRight, Search, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await TeamService.getTeams();
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

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    return teams.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.shortName && t.shortName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [teams, searchQuery]);

  if (isLoading) return <LoadingLayer />;

  return (
    <div className="pb-32 w-full max-w-[1400px] mx-auto overflow-hidden">
      
      {/* CINEMATIC SQUADS HEADER */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="pt-12 px-8 md:px-16 flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
        <div>
          <h1 className="text-6xl md:text-8xl font-black font-clash text-white tracking-tighter uppercase mb-2">
            Team <span className="text-emerald-500 italic drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]">Rosters</span>
          </h1>
          <p className="text-zinc-500 font-bold tracking-widest uppercase text-sm">
            Manage your franchise, roster players, and track historical metrics.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {teams.length > 0 && (
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search size={16} className="text-zinc-500" />
              </div>
              <input 
                type="text" 
                placeholder="Locate Franchise..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-b border-white/10 text-white pl-12 pr-4 py-3 text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-700"
              />
            </div>
          )}
          <Link href="/teams/create" className="w-full sm:w-auto">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white text-zinc-950 px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-emerald-400 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Expand League
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* SQUADS LIST */}
      <div className="px-4 md:px-8">
        <AnimatePresence mode="wait">
          {teams.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-32 text-center">
               <h3 className="text-4xl font-clash font-black text-zinc-700 uppercase tracking-tighter mb-4">No Squads Assembled</h3>
              <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Your franchise is currently empty. Build your first team.</p>
              <Link href="/teams/create" className="mt-8">
                <button className="bg-emerald-500 text-zinc-950 px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2">
                  Draft First Team
                </button>
              </Link>
            </motion.div>
          ) : filteredTeams.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 text-center">
              <Search size={48} className="text-zinc-800 mb-6" />
              <h3 className="text-2xl font-black font-clash text-zinc-500 mb-2 uppercase tracking-wide">Signal Lost</h3>
              <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">No franchise matches "{searchQuery}"</p>
            </motion.div>
          ) : (
            <div className="flex flex-col">
              {filteredTeams.map((team, idx) => (
                <motion.div 
                  key={team.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  onClick={() => window.location.href = `/teams/${team.id}`}
                  className="group border-b border-white/5 py-6 px-4 md:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 cursor-pointer hover:bg-white/[0.03] transition-colors relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500 scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)]" />

                  <div className="flex items-center gap-6 md:gap-10 w-full lg:w-1/3 z-10">
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt={team.name} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover bg-zinc-950 border border-zinc-800 shadow-inner group-hover:border-emerald-500/50 transition-colors" />
                    ) : (
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-[#050505] rounded-2xl flex items-center justify-center border border-zinc-800 font-clash text-3xl font-black text-zinc-700 shadow-inner group-hover:border-emerald-500/30 group-hover:text-emerald-500 transition-colors">
                        {team.shortName || team.name.slice(0, 3).toUpperCase()}
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-2xl md:text-4xl font-black font-clash text-white tracking-tighter group-hover:text-emerald-400 transition-colors uppercase">
                        {team.name}
                      </h3>
                      <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-1">
                        {team.shortName || 'FRANCHISE'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full lg:w-1/3 z-10 border-t border-zinc-800 pt-4 lg:pt-0 lg:border-t-0">
                    <div className="flex flex-col">
                      <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Roster Size</span>
                      <span className="text-2xl font-black font-clash text-white flex items-center gap-2">
                        {String(team.players?.length || 0).padStart(2, '0')}
                        <Users className="w-4 h-4 text-emerald-500" />
                      </span>
                    </div>

                    {team.homeGround && (
                      <div className="flex flex-col items-end lg:items-start">
                        <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Home Ground</span>
                        <span className="text-lg font-black font-clash text-zinc-300 flex items-center gap-2 truncate max-w-[150px]">
                          <MapPin className="w-4 h-4 text-emerald-500" />
                          {team.homeGround}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end w-full lg:w-1/3 z-10 gap-6 mt-4 lg:mt-0 pb-2 lg:pb-0">
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 group-hover:border-emerald-500 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all bg-[#050505] shadow-[0_0_15px_transparent] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0">
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
