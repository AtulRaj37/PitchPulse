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
      
      {/* 1. HEADER & ACTIONS */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="pt-6 md:pt-8 px-4 md:px-8 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-6 md:mb-8">
        <div>
          <h1 className="text-4xl md:text-6xl font-black font-clash text-white tracking-tighter uppercase mb-1">
            Match <span className="text-emerald-500 italic drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Center</span>
          </h1>
          <p className="text-zinc-500 font-bold tracking-widest uppercase text-[10px] md:text-[11px] flex items-center gap-2.5">
            <span>Real-time match tracking</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </p>
        </div>

        {/* Floating Action Strip */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2 md:mt-0">
          <Link href="/matches/create" className="group flex items-center gap-2 text-white hover:text-emerald-400 transition-colors bg-white/5 md:bg-transparent px-3 py-1.5 md:p-0 rounded-full md:rounded-none border border-white/10 md:border-transparent">
            <span className="text-[11px] md:text-[13px] font-black uppercase tracking-widest">Start Match</span>
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-emerald-500 md:bg-white/5 md:border border-white/10 flex items-center justify-center md:group-hover:bg-emerald-500/20 md:group-hover:border-emerald-500/40 transition-all md:group-hover:scale-105">
              <Play className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current ml-0.5 text-black md:text-white" />
            </div>
          </Link>
          <div className="hidden md:block w-[1px] h-6 bg-white/10"></div>
          <Link href="/tournaments/create" className="group flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 md:bg-transparent px-3 py-1.5 md:p-0 rounded-full md:rounded-none border border-zinc-800 md:border-transparent">
            <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">New Tournament</span>
          </Link>
          <Link href="/teams/create" className="group flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 md:bg-transparent px-3 py-1.5 md:p-0 rounded-full md:rounded-none border border-zinc-800 md:border-transparent">
            <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">New Squad</span>
          </Link>
        </div>
      </motion.div>

      {/* 2. HERO MATCH (Organic Edge-to-Edge) */}
      {heroMatch && (() => {
        const activeInnings = heroMatch.innings?.[heroMatch.innings?.length - 1];
        const runs = activeInnings?.totalRuns ?? 0;
        const wickets = activeInnings?.totalWickets ?? 0;
        const overs = activeInnings?.overs ?? 0;
        const runRate = activeInnings?.runRate ?? 0;
        const battingTeamId = activeInnings?.battingTeamId;
        const isTeam1Batting = battingTeamId === heroMatch.team1.id;
        const isTeam2Batting = battingTeamId === heroMatch.team2.id;
        const target = heroMatch.currentSnapshot?.target;

        return (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full mb-12 px-4 md:px-8">
            <div className="absolute inset-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-emerald-500/10 blur-[80px] rounded-full pointer-events-none -z-10" />
            
            <div 
              className="w-full bg-[#050505] bg-gradient-to-br from-white/[0.03] to-transparent p-5 md:p-8 rounded-[2rem] border border-white/10 cursor-pointer group hover:bg-white/[0.04] hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-between shadow-lg"
              onClick={() => router.push(`/match/${heroMatch.id}/${heroMatch.status === 'COMPLETED' ? 'scorecard' : 'score'}`)}
            >
              {/* Status Indicator */}
              <div className="absolute top-4 left-4 md:top-6 md:left-8 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                <div className={clsx("w-2 h-2 rounded-full", heroMatch.status === 'LIVE' ? "bg-red-500 shadow-[0_0_5px_currentColor] animate-pulse" : "bg-emerald-500")} />
                <span className="font-bold uppercase tracking-widest text-white/70 text-[10px]">
                  {heroMatch.status === 'LIVE' ? 'Live Broadcast' : heroMatch.status.replace('_', ' ')}
                </span>
                {heroMatch.innings?.length > 0 && (
                  <>
                    <span className="w-1 h-1 bg-white/20 rounded-full mx-1"></span>
                    <span className="font-bold uppercase tracking-widest text-emerald-400 text-[10px]">
                      INN {heroMatch.innings.length}
                    </span>
                  </>
                )}
              </div>

              {/* Action Button (Top Right) */}
              <div className="absolute top-4 right-4 md:top-6 md:right-8 flex items-center">
                <div className="h-8 px-4 md:h-9 md:px-5 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 group-hover:border-emerald-500/50 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all bg-white/5 backdrop-blur-md gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
                    {heroMatch.status === 'COMPLETED' ? 'Match Summary' : 'Control Room'}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
                </div>
              </div>

              {/* Central Content */}
              <div className="w-full flex flex-col items-center mt-8 md:mt-6">
                
                {/* Team Matchup */}
                <div className="flex items-center justify-center w-full gap-5 md:gap-10 overflow-visible">
                  {/* Team 1 */}
                  <div className="text-right flex flex-col items-end w-2/5 overflow-visible">
                    <h2 className={clsx("text-4xl md:text-5xl font-black font-clash tracking-tighter transition-colors uppercase pr-1", isTeam1Batting ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "text-white group-hover:text-zinc-300")}>
                      {heroMatch.team1.shortName || heroMatch.team1.name.slice(0, 3)}
                    </h2>
                    <p className="text-zinc-500 font-bold uppercase tracking-wider text-[9px] md:text-[11px] mt-1 truncate w-full max-w-[120px] md:max-w-none">{heroMatch.team1.name}</p>
                    {isTeam1Batting && (
                      <span className="mt-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider">
                        Batting
                      </span>
                    )}
                  </div>

                  {/* VS Connector */}
                  <div className="flex flex-col items-center justify-center w-auto shrink-0 -translate-y-2 md:-translate-y-3">
                    <span className="text-xl md:text-2xl font-black text-zinc-700 italic font-clash">VS</span>
                  </div>

                  {/* Team 2 */}
                  <div className="text-left flex flex-col items-start w-2/5 overflow-visible">
                    <h2 className={clsx("text-4xl md:text-5xl font-black font-clash tracking-tighter transition-colors uppercase pl-1", isTeam2Batting ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "text-white group-hover:text-zinc-300")}>
                      {heroMatch.team2.shortName || heroMatch.team2.name.slice(0, 3)}
                    </h2>
                    <p className="text-zinc-500 font-bold uppercase tracking-wider text-[9px] md:text-[11px] mt-1 truncate w-full max-w-[120px] md:max-w-none">{heroMatch.team2.name}</p>
                    {isTeam2Batting && (
                      <span className="mt-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider">
                        Batting
                      </span>
                    )}
                  </div>
                </div>

                {/* Score Console */}
                {(activeInnings || heroMatch.status === 'LIVE' || heroMatch.status === 'INNINGS_BREAK' || heroMatch.status === 'COMPLETED') && (
                  <div className="mt-8 w-full max-w-sm bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 md:p-5 flex items-center justify-between group-hover:border-emerald-500/20 transition-all">
                    
                    {/* Score */}
                    <div className="flex flex-col flex-1 pl-3 md:pl-5">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mb-1">Total Score</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl md:text-4xl font-black font-clash text-white tracking-tighter">
                          {runs}<span className="text-xl md:text-2xl text-zinc-500">/{wickets}</span>
                        </span>
                      </div>
                    </div>

                    <div className="w-[1px] h-10 bg-white/10 mx-3"></div>

                    {/* Overs */}
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mb-1">Overs</span>
                      <span className="text-xl md:text-2xl font-black font-clash text-white">
                        {overs.toFixed(1)} <span className="text-[11px] text-zinc-500 uppercase">/ {heroMatch.overs}</span>
                      </span>
                    </div>

                    <div className="w-[1px] h-10 bg-white/10 mx-3 hidden sm:block"></div>

                    {/* Stats Box */}
                    <div className="flex flex-col items-end flex-1 pr-3 md:pr-5">
                      {target ? (
                        <>
                          <span className="text-emerald-500/70 font-bold uppercase tracking-widest text-[9px] mb-1">Target</span>
                          <span className="text-xl md:text-2xl font-black font-clash text-emerald-400">{target}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mb-1">Run Rate</span>
                          <span className="text-xl md:text-2xl font-black font-clash text-cyan-400">{runRate.toFixed(1)}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* 3. RESPONSIVE STATS GRID */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="px-4 md:px-8 grid grid-cols-2 lg:flex lg:justify-between items-start lg:items-center mb-8 md:mb-14 gap-3 lg:gap-10 border-t border-white/5 pt-6 md:pt-10">
        {[
          { label: 'Matches', value: completedMatches.length, color: 'text-white' },
          { label: 'Squads', value: teams.length, color: 'text-zinc-300' },
          { label: 'Tournaments', value: tournaments.length, color: 'text-zinc-400' },
          { label: 'Total Players', value: teams.reduce((acc: number, t: any) => acc + (t.players?.length || 0), 0), color: 'text-emerald-400' },
        ].map((stat, i) => (
          <div key={i} className="flex items-center lg:gap-8 justify-start bg-zinc-900/40 lg:bg-transparent p-4 lg:p-0 rounded-2xl border border-white/5 lg:border-transparent">
            <div className="flex flex-col">
              <span className={`text-4xl md:text-5xl font-black font-clash tracking-tighter ${stat.color}`}>{stat.value}</span>
              <span className="text-zinc-500 lg:text-zinc-600 text-[10px] uppercase font-bold tracking-widest mt-1">{stat.label}</span>
            </div>
            {i !== 3 && <div className="hidden lg:block w-[1px] h-10 bg-white/5 ml-8"></div>}
          </div>
        ))}
      </motion.div>

      {/* 4. SLEEK EDITORIAL TABS */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="px-4 md:px-8 mb-6 md:mb-8 overflow-x-auto no-scrollbar w-full">
        <div className="flex items-end gap-5 md:gap-10 border-b border-white/5 pb-2 min-w-max">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="relative group pb-2 shrink-0"
            >
              <div className="flex items-end gap-1.5 md:gap-2.5">
                <span className={clsx(
                  "text-base md:text-2xl font-black font-clash uppercase tracking-tighter transition-colors",
                  activeTab === tab.id ? "text-white" : "text-zinc-700 group-hover:text-zinc-500"
                )}>
                  {tab.label}
                </span>
                <span className={clsx(
                  "text-[10px] md:text-sm font-black transition-colors mb-0.5",
                  activeTab === tab.id ? "text-emerald-500" : "text-zinc-700"
                )}>
                  {String(tab.count).padStart(2, '0')}
                </span>
              </div>
              {activeTab === tab.id && (
                <motion.div layoutId="editorialTab" className="absolute -bottom-2 md:-bottom-[9px] left-0 w-full h-[2px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
                <h3 className="text-2xl md:text-3xl font-clash font-black text-zinc-700 uppercase tracking-tighter mb-2">Radio Silence</h3>
                <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No active tournaments found.</p>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-3">
                {tournaments.map((tournament: any) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    key={tournament.id} 
                    className="group border border-white/5 bg-zinc-900/20 py-4 px-5 md:px-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 cursor-pointer hover:bg-white/[0.03] transition-colors relative overflow-hidden"
                    onClick={() => router.push(`/tournaments/${tournament.id}`)}
                  >
                    <div className="flex items-center gap-4 md:gap-6 z-10 w-full md:w-auto">
                      <div className="hidden md:flex items-center justify-center w-12 h-12 rounded border border-white/5 text-zinc-800 font-clash font-black text-2xl group-hover:border-emerald-500/20 group-hover:text-emerald-500/40 transition-colors">
                        T
                      </div>
                      <div>
                        <h3 className="text-lg md:text-2xl font-black font-clash text-white uppercase tracking-tighter group-hover:text-emerald-400 transition-colors truncate w-full max-w-[180px] md:max-w-none">
                          {tournament.name}
                        </h3>
                        <p className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] md:text-[11px] mt-1.5 flex items-center gap-2.5">
                          <span className={clsx("px-2 py-0.5 rounded-sm text-[9px] border", tournament.status === 'LIVE' ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : "border-zinc-700 text-zinc-400 bg-zinc-800")}>
                            {tournament.status || 'DRAFT'}
                          </span>
                          {tournament.format} • {tournament.overs} Overs
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-5 z-10 w-full md:w-auto">
                      <div className="flex -space-x-2.5">
                        {[1, 2, 3].map((_, idx) => (
                          <div key={idx} className="w-8 h-8 rounded-full bg-zinc-900 border border-[#050505] shadow flex items-center justify-center text-[10px] font-black text-zinc-600">
                            ?
                          </div>
                        ))}
                      </div>
                      <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 group-hover:border-emerald-500 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all bg-[#050505]">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : activeMatchesList.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
              <h3 className="text-2xl md:text-3xl font-clash font-black text-zinc-700 uppercase tracking-tighter mb-2">No Matches Found</h3>
              <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">The {activeTab.toLowerCase()} category is empty.</p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeMatchesList.map((match: any) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }}
                  key={match.id} 
                  className="group border border-white/5 bg-zinc-900/20 py-5 px-5 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-5 cursor-pointer hover:bg-white/[0.03] transition-colors relative overflow-hidden rounded-2xl"
                  onClick={() => router.push(`/match/${match.id}/${match.status === 'COMPLETED' ? 'scorecard' : 'score'}`)}
                >
                  <div className="absolute left-0 top-0 w-1.5 h-full bg-emerald-500 scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-300 ease-[cubic-bezier(0.87,0,0.13,1)]" />
                  
                  {/* Match Info Column */}
                  <div className="flex flex-col w-full md:w-1/4 z-10 pl-3">
                    <span className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mb-1.5">{new Date(match.startTime).toLocaleDateString()} • {match.format}</span>
                    <span className="text-emerald-400/0 font-clash font-black text-xs md:text-sm uppercase tracking-tighter group-hover:text-emerald-400 transition-colors">View Match</span>
                  </div>

                  {/* Battle Line (Mobile Stack / Desktop Split) */}
                  <div className="flex flex-col md:flex-row md:items-center justify-start w-full md:w-2/4 z-10 gap-1.5 md:gap-6 my-3 md:my-0 border-l-[3px] md:border-l-0 border-emerald-500/20 pl-3 md:pl-0 ml-1 md:ml-0">
                    <div className="flex items-center md:flex-col md:items-end gap-2.5 md:gap-0.5 w-full md:w-auto">
                      <span className="text-base md:text-xl font-black font-clash text-white uppercase tracking-tighter w-10 md:w-auto text-left md:text-right">{match.team1.shortName || match.team1.name.slice(0,3)}</span>
                      <span className="text-zinc-400 md:text-zinc-500 font-bold uppercase tracking-widest text-[10px] truncate max-w-[200px] md:max-w-none">{match.team1.name}</span>
                    </div>
                    
                    <span className="hidden md:block text-2xl font-black font-clash text-zinc-700 -translate-y-1.5 shrink-0">/</span>

                    <div className="flex items-center md:flex-col md:items-start gap-2.5 md:gap-0.5 w-full md:w-auto">
                      <span className="text-base md:text-xl font-black font-clash text-white uppercase tracking-tighter w-10 md:w-auto text-left">{match.team2.shortName || match.team2.name.slice(0,3)}</span>
                      <span className="text-zinc-400 md:text-zinc-500 font-bold uppercase tracking-widest text-[10px] truncate max-w-[200px] md:max-w-none">{match.team2.name}</span>
                    </div>
                  </div>

                  {/* Action Column */}
                  <div className="flex items-center justify-end w-full md:w-1/4 z-10 gap-3">
                    <button 
                      onClick={(e) => handleDeleteMatch(e, match.id, match.status === 'CREATED')} 
                      className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-600 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-zinc-500 group-hover:border-emerald-500 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all bg-[#050505] shadow-[0_0_15px_transparent] group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
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
