'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MatchService } from '@/services/api/match.service';
import { TeamService } from '@/services/api/team.service';
import { TournamentService } from '@/services/api/tournament.service';
import { Play, Trophy, Users, Calendar, ChevronRight, Trash2, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import clsx from 'clsx';
import { LoadingLayer } from '@/components/ui/LoadingLayer';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'LIVE' | 'ONGOING' | 'COMPLETED' | 'DRAFT' | 'TOURNAMENTS'>('LIVE');

  const { data: matches = [], isLoading: isLoadingMatches } = useQuery({ queryKey: ['matches'], queryFn: () => MatchService.getMatches() });
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery({ queryKey: ['teams'], queryFn: () => TeamService.getTeams() });
  const { data: tournaments = [], isLoading: isLoadingTournaments } = useQuery({ queryKey: ['tournaments'], queryFn: () => TournamentService.getTournaments() });

  const isLoading = isLoadingMatches || isLoadingTeams || isLoadingTournaments;
  
  const liveMatches = matches.filter((m: any) => m.status === 'LIVE');
  const ongoingMatches = matches.filter((m: any) => m.status === 'INNINGS_BREAK');
  const completedMatches = matches.filter((m: any) => ['COMPLETED', 'ABANDONED'].includes(m.status));
  const draftMatches = matches.filter((m: any) => m.status === 'CREATED');

  const heroMatch = liveMatches[0] || ongoingMatches[0] || completedMatches[0];

  const handleDeleteMatch = async (e: any, id: string, isDraft: boolean = true) => {
    e.stopPropagation();
    if (!confirm(isDraft ? 'Are you sure you want to delete this draft match?' : 'Are you sure you want to abandon/delete this match?')) return;
    try {
      await MatchService.deleteMatch(id);
      toast.success(isDraft ? 'Draft match deleted' : 'Match removed');
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    } catch {
      toast.error('Failed to delete match');
    }
  };

  if (isLoading) return <LoadingLayer />;

  const tabs = [
    { id: 'LIVE', label: 'Live', count: liveMatches.length },
    { id: 'ONGOING', label: 'Ongoing', count: ongoingMatches.length },
    { id: 'COMPLETED', label: 'Completed', count: completedMatches.length },
    { id: 'DRAFT', label: 'Drafts', count: draftMatches.length },
    { id: 'TOURNAMENTS', label: 'Tournaments', count: tournaments.length },
  ];

  const activeMatchesList = 
    activeTab === 'LIVE' ? liveMatches : 
    activeTab === 'ONGOING' ? ongoingMatches : 
    activeTab === 'COMPLETED' ? completedMatches : draftMatches;

  return (
    <div className="pb-32 w-full max-w-[1400px] mx-auto overflow-hidden">
      
      {/* 1. CINEMATIC COMMAND CENTER (Header & Actions) */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="pt-12 px-8 md:px-16 flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
        <div>
          <h1 className="text-6xl md:text-8xl font-black font-clash text-white tracking-tighter uppercase mb-2">
            Match <span className="text-emerald-500 italic drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]">Center</span>
          </h1>
          <p className="text-zinc-500 font-bold tracking-widest uppercase text-sm flex items-center gap-4">
            <span>Operating at Peak Efficiency</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </p>
        </div>

        {/* Floating Action Strip */}
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/matches/create" className="group flex items-center gap-3 text-white hover:text-emerald-400 transition-colors">
            <span className="text-sm font-black uppercase tracking-widest">Start Match</span>
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all group-hover:scale-110">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </Link>
          <div className="w-[1px] h-8 bg-white/10"></div>
          <Link href="/tournaments/create" className="group flex items-center gap-3 text-zinc-400 hover:text-white transition-colors">
            <span className="text-xs font-bold uppercase tracking-widest">New Tournament</span>
            <Trophy className="w-4 h-4" />
          </Link>
          <Link href="/teams/create" className="group flex items-center gap-3 text-zinc-400 hover:text-white transition-colors">
            <span className="text-xs font-bold uppercase tracking-widest">New Squad</span>
            <Users className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* 2. HERO MATCH (Organic Edge-to-Edge) */}
      {heroMatch && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full mb-20 px-4 md:px-8">
          <div className="absolute inset-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-emerald-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />
          
          <div 
            className="w-full bg-gradient-to-b from-white/[0.03] to-transparent p-8 md:p-16 rounded-[3rem] border border-white/5 cursor-pointer group hover:bg-white/[0.04] transition-colors relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12"
            onClick={() => router.push(`/match/${heroMatch.id}/${heroMatch.status === 'COMPLETED' ? 'scorecard' : 'score'}`)}
          >
            {/* Status Indicator */}
            <div className="absolute top-8 left-8 md:left-12 flex items-center gap-3">
              <div className={clsx("w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]", heroMatch.status === 'LIVE' ? "bg-red-500 text-red-500 animate-pulse" : "bg-emerald-500 text-emerald-500")} />
              <span className="font-bold uppercase tracking-widest text-[#888] text-xs">
                {heroMatch.status === 'LIVE' ? 'Live Event Broadcast' : heroMatch.status.replace('_', ' ')}
              </span>
            </div>

            <div className="flex flex-col items-center lg:items-start w-full lg:w-3/5 mt-8 lg:mt-0">
              <div className="flex items-center justify-center lg:justify-start w-full gap-4 md:gap-8 lg:gap-14">
                {/* Team 1 */}
                <div className="text-center lg:text-right">
                  <h2 className="text-5xl md:text-7xl font-black font-clash text-white tracking-tighter group-hover:text-emerald-400 transition-colors uppercase">
                    {heroMatch.team1.shortName || heroMatch.team1.name.slice(0, 3)}
                  </h2>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs md:text-sm mt-2">{heroMatch.team1.name}</p>
                </div>

                <div className="text-2xl md:text-3xl font-black text-zinc-700 italic font-clash">VS</div>

                {/* Team 2 */}
                <div className="text-center lg:text-left">
                  <h2 className="text-5xl md:text-7xl font-black font-clash text-white tracking-tighter group-hover:text-cyan-400 transition-colors uppercase">
                    {heroMatch.team2.shortName || heroMatch.team2.name.slice(0, 3)}
                  </h2>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs md:text-sm mt-2">{heroMatch.team2.name}</p>
                </div>
              </div>
            </div>

            {/* Score Simulation (Typography Focus) */}
            <div className="flex flex-col items-center lg:items-end w-full lg:w-2/5 md:pr-4">
              <div className="text-right">
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-1 block">Live Prediction Engine</span>
                <div className="text-5xl md:text-7xl font-black font-clash text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  7.2 <span className="text-2xl text-zinc-400 uppercase tracking-widest">CRR</span>
                </div>
              </div>
              <div className="mt-8 flex items-center justify-end w-full">
                <div className="px-6 py-3 rounded-full bg-white/5 font-bold uppercase tracking-wide text-white text-xs hover:bg-white/10 transition-colors flex items-center gap-2">
                  {heroMatch.status === 'COMPLETED' ? 'View Final Intel' : 'Enter Control Room'}
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. BORDERLESS TYPOGRAPHY STATS */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="px-8 md:px-16 flex flex-wrap justify-between items-center mb-24 gap-10">
        {[
          { label: 'Active Games', value: matches.length, color: 'text-white' },
          { label: 'Reg. Squads', value: teams.length, color: 'text-zinc-300' },
          { label: 'Tournaments', value: tournaments.length, color: 'text-zinc-400' },
          { label: 'Total Players', value: teams.reduce((acc: number, t: any) => acc + (t.players?.length || 0), 0), color: 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]' },
        ].map((stat, i) => (
          <div key={i} className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className={`text-4xl md:text-6xl font-black font-clash tracking-tighter ${stat.color}`}>{stat.value}</span>
              <span className="text-zinc-600 text-[10px] uppercase font-bold tracking-[0.2em] mt-1">{stat.label}</span>
            </div>
            {i !== 3 && <div className="hidden md:block w-[1px] h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent ml-8"></div>}
          </div>
        ))}
      </motion.div>

      {/* 4. SLEEK EDITORIAL TABS */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="px-4 md:px-8 mb-10 overflow-x-auto no-scrollbar">
        <div className="flex items-end gap-10 md:gap-16 border-b border-white/5 pb-4 px-4 min-w-max">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="relative group pb-2"
            >
              <div className="flex items-end gap-3">
                <span className={clsx(
                  "text-2xl md:text-4xl font-black font-clash uppercase tracking-tighter transition-colors",
                  activeTab === tab.id ? "text-white" : "text-zinc-700 group-hover:text-zinc-500"
                )}>
                  {tab.label}
                </span>
                <span className={clsx(
                  "text-sm font-black transition-colors mb-1",
                  activeTab === tab.id ? "text-emerald-500" : "text-zinc-700"
                )}>
                  {String(tab.count).padStart(2, '0')}
                </span>
              </div>
              {activeTab === tab.id && (
                <motion.div layoutId="editorialTab" className="absolute -bottom-4 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* 5. HOVER-REVEAL LIST LAYOUT */}
      <div className="px-4 md:px-8 min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'TOURNAMENTS' ? (
            tournaments.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32 text-center">
                <h3 className="text-4xl font-clash font-black text-zinc-700 uppercase tracking-tighter mb-4">Radio Silence</h3>
                <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">No active tournaments intercepted.</p>
              </motion.div>
            ) : (
              <div className="flex flex-col">
                {tournaments.map((tournament: any) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    key={tournament.id} 
                    className="group border-b border-white/5 py-8 px-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:bg-white/[0.02] transition-colors relative overflow-hidden"
                    onClick={() => router.push(`/tournaments/${tournament.id}`)}
                  >
                    <div className="flex items-center gap-8 md:gap-16 z-10 w-full md:w-auto">
                      <div className="hidden md:flex text-zinc-800 font-clash font-black text-4xl group-hover:text-emerald-500/20 transition-colors">
                        T
                      </div>
                      <div>
                        <h3 className="text-2xl md:text-3xl font-black font-clash text-white uppercase tracking-tighter group-hover:text-emerald-400 transition-colors">
                          {tournament.name}
                        </h3>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-3">
                          <span className={clsx("px-2 py-0.5 rounded text-[9px] border", tournament.status === 'LIVE' ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : "border-zinc-700 text-zinc-400 bg-zinc-800")}>
                            {tournament.status || 'DRAFT'}
                          </span>
                          {tournament.format} • {tournament.overs} Overs
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-6 z-10 w-full md:w-auto mt-4 md:mt-0">
                      <div className="flex -space-x-3">
                        {[1, 2, 3].map((_, idx) => (
                          <div key={idx} className="w-8 h-8 rounded-full bg-zinc-900 border border-[#050505] shadow flex items-center justify-center text-[10px] font-black text-zinc-600">
                            ?
                          </div>
                        ))}
                      </div>
                      <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 group-hover:border-emerald-500 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all bg-[#050505]">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : activeMatchesList.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32 text-center">
              <h3 className="text-4xl font-clash font-black text-zinc-700 uppercase tracking-tighter mb-4">No Signals Detected</h3>
              <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">The {activeTab.toLowerCase()} radar is clear.</p>
            </motion.div>
          ) : (
            <div className="flex flex-col">
              {activeMatchesList.map((match: any) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }}
                  key={match.id} 
                  className="group border-b border-white/5 py-8 px-4 md:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 cursor-pointer hover:bg-white/[0.02] transition-colors relative overflow-hidden"
                  onClick={() => router.push(`/match/${match.id}/${match.status === 'COMPLETED' ? 'scorecard' : 'score'}`)}
                >
                  <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500 scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)]" />
                  
                  {/* Match Info Column */}
                  <div className="flex flex-col w-full lg:w-1/4 z-10">
                    <span className="text-zinc-600 font-bold uppercase tracking-widest text-[10px] mb-2">{new Date(match.startTime).toLocaleDateString()} • {match.format}</span>
                    <span className="text-emerald-400/0 font-clash font-black text-xl uppercase tracking-tighter group-hover:text-emerald-400 transition-colors">Enter Protocol</span>
                  </div>

                  {/* Battle Line */}
                  <div className="flex items-center justify-between w-full lg:w-2/4 z-10 gap-4">
                    <div className="flex flex-col items-start min-w-[100px]">
                      <span className="text-2xl md:text-3xl font-black font-clash text-white uppercase tracking-tighter truncate max-w-[150px] md:max-w-[200px]">{match.team1.name}</span>
                      <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{match.team1.shortName || 'T1'}</span>
                    </div>
                    
                    <span className="text-4xl font-black font-clash text-zinc-800 group-hover:text-white transition-colors">/</span>

                    <div className="flex flex-col items-end min-w-[100px]">
                      <span className="text-2xl md:text-3xl font-black font-clash text-white uppercase tracking-tighter truncate max-w-[150px] md:max-w-[200px]">{match.team2.name}</span>
                      <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{match.team2.shortName || 'T2'}</span>
                    </div>
                  </div>

                  {/* Action Column */}
                  <div className="flex items-center justify-end w-full lg:w-1/4 z-10 gap-4 mt-4 lg:mt-0">
                    <button 
                      onClick={(e) => handleDeleteMatch(e, match.id, match.status === 'CREATED')} 
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-600 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 group-hover:border-emerald-500 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all bg-[#050505] shadow-[0_0_15px_transparent] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]">
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

