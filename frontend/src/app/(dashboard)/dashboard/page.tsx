'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MatchService } from '@/services/api/match.service';
import { TeamService } from '@/services/api/team.service';
import { TournamentService } from '@/services/api/tournament.service';
import { Play, Trophy, Users, Calendar, ChevronRight, CheckCircle2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import clsx from 'clsx';
import { LoadingLayer } from '@/components/ui/LoadingLayer';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: matches = [], isLoading: isLoadingMatches } = useQuery({ queryKey: ['matches'], queryFn: () => MatchService.getMatches() });
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery({ queryKey: ['teams'], queryFn: () => TeamService.getTeams() });
  const { data: tournaments = [], isLoading: isLoadingTournaments } = useQuery({ queryKey: ['tournaments'], queryFn: () => TournamentService.getTournaments() });

  const isLoading = isLoadingMatches || isLoadingTeams || isLoadingTournaments;
  
  const liveMatches = matches.filter((m: any) => m.status === 'LIVE');
  const ongoingMatches = matches.filter((m: any) => m.status === 'INNINGS_BREAK');
  const completedMatches = matches.filter((m: any) => ['COMPLETED', 'ABANDONED'].includes(m.status)).slice(0, 5);
  const draftMatches = matches.filter((m: any) => m.status === 'CREATED');


  const handleDeleteMatch = async (e: any, id: string, isDraft: boolean = true) => {
    e.preventDefault();
    if (!confirm(isDraft ? 'Are you sure you want to delete this draft match?' : 'Are you sure you want to abandon/delete this live match?')) return;
    try {
      await MatchService.deleteMatch(id);
      toast.success(isDraft ? 'Draft match deleted' : 'Match removed');
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    } catch {
      toast.error('Failed to delete match');
    }
  };

  if (isLoading) return <LoadingLayer />;

  return (
    <div className="space-y-12 pb-24 max-w-7xl mx-auto">
      {/* 1. Header Section & 2. Quick Actions */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5 relative">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 -z-10" />
        <div>
          <h1 className="text-4xl font-black font-clash text-white tracking-tight mb-2">
            Welcome back, Organizer
          </h1>
          <p className="text-zinc-400 font-medium">
            You have <span className="text-emerald-400 font-bold">{liveMatches.length} live matches</span> and <span className="text-amber-400 font-bold">{tournaments.length} active tournaments</span>.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/matches/create">
            <button className="bg-emerald-500 text-zinc-950 font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-400 transition-colors flex items-center gap-2">
              <Play size={16} className="fill-zinc-950" /> New Match
            </button>
          </Link>
          <Link href="/teams/create">
            <button className="glass-premium text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-2 border border-white/10">
              <Users size={16} /> Team
            </button>
          </Link>
          <Link href="/tournaments/create">
            <button className="glass-premium text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-2 border border-white/10">
              <Trophy size={16} /> Tournament
            </button>
          </Link>
        </div>
      </header>

      {/* 3. Active Match Highlight */}
      {(liveMatches.length > 0 || ongoingMatches.length > 0) && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Live Matches</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[...liveMatches, ...ongoingMatches].map((match: any) => (
              <div key={match.id} className={clsx(
                "glass-premium border rounded-3xl p-6 md:p-8 relative overflow-hidden group transition-all shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
                match.status === 'LIVE' ? "border-red-500/20 hover:border-red-500/40" : "border-emerald-500/20 hover:border-emerald-500/40"
              )}>
                <div className={clsx(
                  "absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r",
                  match.status === 'LIVE' ? "from-red-600 to-rose-400" : "from-emerald-600 to-teal-400"
                )} />
                <div className="flex justify-between items-center mb-8">
                  <span className={clsx(
                    "text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border flex items-center gap-2",
                    match.status === 'LIVE' 
                      ? "text-red-400 bg-red-500/10 border-red-500/20" 
                      : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  )}>
                    {match.status === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                    {match.status === 'LIVE' ? 'LIVE NOW' : 'INNINGS BREAK'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleDeleteMatch(e, match.id, false)}
                      className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors z-10"
                      title="Delete / Abandon Match"
                    >
                      <Trash2 size={16} />
                    </button>
                    <Link href={`/match/${match.id}/score`} className="text-xs font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider bg-zinc-900/50 px-3 py-1.5 rounded-lg z-10 relative">
                      {match.status === 'LIVE' ? 'Continue' : 'Resume Match'} <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
                <div className="flex justify-between items-center relative">
                  <div className="text-center flex-1">
                    <h3 className="text-2xl md:text-3xl font-black font-clash text-white mb-2 truncate max-w-[120px] mx-auto" title={match.team1.name}>
                      {match.team1.shortName || match.team1.name}
                    </h3>
                  </div>
                  <div className="text-sm font-black text-zinc-800 px-4 italic">VS</div>
                  <div className="text-center flex-1">
                    <h3 className="text-2xl md:text-3xl font-black font-clash text-white mb-2 truncate max-w-[120px] mx-auto" title={match.team2.name}>
                        {match.team2.shortName || match.team2.name}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* 4. Recent Matches (List Format) */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6 font-clash tracking-wide">Recent Matches</h2>
            {completedMatches.length === 0 ? (
              <EmptyState icon={<Calendar size={32} />} title="No recent matches" message="Completed matches and results will appear directly in this list." action="/matches/create" actionText="Start Match" />
            ) : (
              <div className="bg-zinc-900/40 rounded-3xl border border-white/5 divide-y divide-white/5 overflow-hidden">
                {completedMatches.map((match: any) => (
                  <div key={match.id} className="p-5 hover:bg-white/[0.02] transition-colors flex md:items-center justify-between flex-col md:flex-row gap-4 group">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-950 flex flex-col items-center justify-center border border-white/5 shadow-inner">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{match.format}</span>
                      </div>
                      <div>
                        <h4 className="text-white font-black text-lg leading-tight mb-1 truncate max-w-[200px] md:max-w-md">{match.team1.name} <span className="text-zinc-600 font-normal mx-2 italic">vs</span> {match.team2.name}</h4>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{new Date(match.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {match.venue || 'TBA'}</p>
                      </div>
                    </div>
                    <div className="text-left md:text-right flex flex-col md:items-end gap-3 mt-4 md:mt-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-400 border border-zinc-700/50 w-fit">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        {match.status}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link href={`/match/${match.id}/scorecard`}>
                          <button className="text-[10px] font-black tracking-widest uppercase text-cyan-400 hover:text-cyan-300">View Scorecard</button>
                        </Link>
                        <button
                          onClick={(e) => handleDeleteMatch(e, match.id, false)}
                          title="Delete Match"
                          className="p-1.5 text-zinc-600 hover:text-red-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-red-500/30 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 4.5 Draft Matches */}
          {draftMatches.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-6 font-clash tracking-wide">Draft Matches</h2>
              <div className="bg-amber-900/10 rounded-3xl border border-amber-500/20 divide-y divide-amber-500/10 overflow-hidden">
                {draftMatches.map((match: any) => (
                  <div key={match.id} className="p-5 hover:bg-amber-500/5 transition-colors flex md:items-center justify-between flex-col md:flex-row gap-4 group">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex flex-col items-center justify-center border border-amber-500/30">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">DR</span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-md leading-tight mb-1 truncate">{match.team1.name} vs {match.team2.name}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                      <Link href={`/match/${match.id}/score`}>
                        <button className="text-[10px] font-black tracking-widest uppercase bg-amber-500/10 px-3 py-2 rounded-lg text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1">Start Match <ChevronRight size={14}/></button>
                      </Link>
                      <button 
                        onClick={(e) => handleDeleteMatch(e, match.id, true)} 
                        title="Delete Match"
                        className="p-2 text-zinc-500 hover:text-red-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-red-500/30 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-10">
          {/* 5. Teams Overview */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white font-clash tracking-wide">My Teams</h2>
              <Link href="/teams" className="text-xs font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest">View All</Link>
            </div>
            {teams.length === 0 ? (
              <EmptyState icon={<Users size={24} />} title="No teams" message="Create a team to manage players." action="/teams/create" actionText="New Team" minimal />
            ) : (
              <div className="space-y-3">
                {teams.slice(0, 4).map((team: any) => (
                  <Link key={team.id} href={`/teams/${team.id}`}>
                    <div className="bg-zinc-900/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center hover:bg-zinc-800/50 hover:border-emerald-500/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center font-black text-sm text-zinc-300 shadow-inner">
                          {team.shortName || team.name.slice(0,2).toUpperCase()}
                        </div>
                        <span className="font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">{team.name}</span>
                      </div>
                      <ChevronRight size={16} className="text-zinc-700 group-hover:text-emerald-400 transform group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* 6. Tournament Overview */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white font-clash tracking-wide">Series & Cups</h2>
              <Link href="/tournaments" className="text-xs font-black text-amber-400 hover:text-amber-300 uppercase tracking-widest">View All</Link>
            </div>
            {tournaments.length === 0 ? (
              <EmptyState icon={<Trophy size={24} />} title="No tournaments" message="Organize your first series today." action="/tournaments/create" actionText="New Series" minimal />
            ) : (
              <div className="space-y-3">
                {tournaments.slice(0, 3).map((tourney: any) => (
                  <Link key={tourney.id} href={`/tournaments/${tourney.id}`}>
                    <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5 flex justify-between items-center hover:bg-zinc-800/50 hover:border-amber-500/30 transition-all group">
                      <div>
                        <h4 className="font-black text-zinc-200 group-hover:text-amber-400 transition-colors mb-1.5">{tourney.name}</h4>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{tourney.status}</span>
                      </div>
                      <ChevronRight size={16} className="text-zinc-700 group-hover:text-amber-400 transform group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, message, action, actionText, minimal = false }: any) {
  return (
    <div className={clsx(
      "text-center bg-zinc-900/20 border border-dashed border-zinc-800/50 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden",
      minimal ? "p-8" : "py-20 px-6"
    )}>
      <div className={clsx("text-zinc-700 mb-5 flex items-center justify-center p-4 rounded-full bg-zinc-900", minimal ? "scale-75 mb-3" : "scale-100")}>
        {icon}
      </div>
      <h3 className="text-lg font-black text-zinc-300 mb-2 tracking-wide">{title}</h3>
      <p className="text-zinc-500 text-sm font-medium max-w-[240px] mb-8 leading-relaxed">{message}</p>
      <Link href={action}>
        <button className="bg-emerald-500 text-zinc-950 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2">
          {actionText} <ChevronRight size={16} />
        </button>
      </Link>
    </div>
  );
}
