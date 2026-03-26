'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TournamentService } from '@/services/api/tournament.service';
import { TeamService } from '@/services/api/team.service';
import { MatchService } from '@/services/api/match.service';
import { useState } from 'react';
import { Trophy, Calendar, Users, List, Plus, Loader2, Play, Settings, X, Edit3, Trash2, ChevronRight } from 'lucide-react';
import { LoadingLayer } from '@/components/ui/LoadingLayer';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'TEAMS' | 'MATCHES' | 'POINTS_TABLE'>('TEAMS');
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFixturesModalOpen, setIsFixturesModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [manualTeam1Id, setManualTeam1Id] = useState('');
  const [manualTeam2Id, setManualTeam2Id] = useState('');

  // Fetch Tournament
  const { data: tournament, isLoading: isLoadingTournament } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => TournamentService.getTournamentById(id as string),
  });

  // Fetch Available Teams
  const { data: allTeams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => TeamService.getTeams(),
  });

  // Fetch Points Table
  const { data: pointsTable = [], isLoading: isLoadingPoints } = useQuery({
    queryKey: ['tournament-points', id],
    queryFn: () => TournamentService.getPointsTable(id as string),
    enabled: activeTab === 'POINTS_TABLE',
  });

  // Fetch Matches for this tournament
  const { data: matches = [], isLoading: isLoadingMatches } = useQuery({
    queryKey: ['matches', { tournamentId: id }],
    queryFn: () => MatchService.getMatches({ tournamentId: id as string } as any),
  });

  // Add Team Mutation
  const addTeamMutation = useMutation({
    mutationFn: (teamId: string) => TournamentService.addTeamToTournament(id as string, teamId),
    onSuccess: () => {
      toast.success('Team added to tournament!');
      setIsAddingTeam(false);
      setSelectedTeamId('');
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
    },
    onError: () => toast.error('Failed to add team'),
  });

  // Generate Fixtures Mutation
  const generateFixturesMutation = useMutation({
    mutationFn: (format: 'round-robin' | 'knockout') => TournamentService.generateFixtures(id as string, format),
    onSuccess: () => {
      toast.success('Fixtures generated successfully!');
      setIsFixturesModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: () => toast.error('Failed to generate fixtures (need at least 2 teams)'),
  });

  // Add Manual Fixture Mutation
  const addFixtureMutation = useMutation({
    mutationFn: () => TournamentService.addFixture(id as string, manualTeam1Id, manualTeam2Id),
    onSuccess: () => {
      toast.success('Fixture added successfully!');
      setManualTeam1Id('');
      setManualTeam2Id('');
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
    },
    onError: () => toast.error('Failed to add fixture'),
  });

  // Update Tournament Mutation
  const updateTournamentMutation = useMutation({
    mutationFn: (data: any) => TournamentService.updateTournament(id as string, data),
    onSuccess: () => {
      toast.success('Tournament updated successfully!');
      setIsSettingsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
    onError: () => toast.error('Failed to update tournament'),
  });

  // Delete Tournament Mutation
  const deleteTournamentMutation = useMutation({
    mutationFn: () => TournamentService.deleteTournament(id as string),
    onSuccess: () => {
      toast.success('Tournament deleted successfully!');
      router.push('/tournaments');
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
    onError: () => toast.error('Failed to delete tournament'),
  });

  if (isLoadingTournament) return <LoadingLayer />;
  if (!tournament) return <div className="p-20 text-center font-display text-white">Tournament not found</div>;

  const tournamentTeams = tournament.teams || [];
  const participatingTeamIds = tournamentTeams.map((t: any) => t.teamId);
  const availableTeamsToAdd = allTeams.filter((t: any) => !participatingTeamIds.includes(t.id));

  const tournamentMatchesList = matches.filter((m: any) => m.tournamentId === id);
  const tbdFixtures = (tournament.fixtures || []).filter((f: any) => f.status === 'TBD' && !f.matchId);

  return (
    <div className="space-y-8 pb-32 max-w-7xl mx-auto px-4 md:px-8 mt-6">
      {/* 1. HERO HEADER */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full rounded-[3rem] overflow-hidden bg-[#050505] border border-white/5 shadow-2xl mb-10">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-zinc-950/50 to-zinc-900/80 z-0 pointer-events-none" />
        
        {/* Glow Effects */}
        <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] bg-amber-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[400px] h-[400px] bg-amber-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 p-10 md:p-16 flex flex-col md:flex-row gap-10 justify-between items-start md:items-end">
          <div className="flex flex-col gap-6 w-full md:w-auto">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 backdrop-blur-md border border-amber-500/30 flex items-center justify-center shadow-inner text-amber-500">
                <Trophy size={32} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase bg-amber-500 text-zinc-950 w-fit shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                  {tournament.status || 'DRAFT'}
                </span>
                <p className="text-zinc-400 font-bold flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] font-mono">
                  <Calendar size={12} /> {new Date(tournament.startDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black font-clash text-white tracking-tighter uppercase leading-none drop-shadow-2xl">
              {tournament.name.split(' ').map((word: string, i: number, arr: string[]) => 
                i === arr.length - 1 ? (
                  <span key={i} className="text-amber-500 italic pr-2 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">{word}</span>
                ) : (
                  <span key={i} className="pr-4">{word}</span>
                )
              )}
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-6 w-full md:w-auto">
            <div className="flex gap-8 bg-zinc-950/50 backdrop-blur-xl rounded-2xl p-6 border border-white/5">
              <div className="flex flex-col text-left">
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Format</span>
                <span className="text-2xl font-black font-display text-white tracking-tight">{tournament.format}</span>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="flex flex-col text-left">
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Overs</span>
                <span className="text-2xl font-black font-display text-white tracking-tight">{tournament.overs}</span>
              </div>
            </div>
            
            <button onClick={() => { setEditForm({ name: tournament.name, format: tournament.format, overs: tournament.overs, status: tournament.status }); setIsSettingsOpen(true); }} className="px-8 py-5 h-full rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 bg-white text-zinc-950 hover:bg-amber-400 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all shrink-0">
               <Settings size={16} /> Manage
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. TABBED NAVIGATION */}
      <div className="flex space-x-2 border-b border-zinc-800 pb-2">
        {(['TEAMS', 'MATCHES', 'POINTS_TABLE'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-6 py-3 font-bold text-sm uppercase tracking-widest transition-all rounded-t-xl relative overflow-hidden",
              activeTab === tab ? "text-amber-500 bg-amber-500/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            )}
          >
            {tab.replace('_', ' ')}
            {activeTab === tab && <motion.div layoutId="tourneyTab" className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />}
          </button>
        ))}
      </div>

      {/* 3. TAB CONTENT */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          
          {/* TEAMS TAB */}
          {activeTab === 'TEAMS' && (
            <motion.div key="teams" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white font-display">Participating Teams ({tournamentTeams.length})</h3>
                <button onClick={() => setIsAddingTeam(!isAddingTeam)} className="btn-primary flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-amber-500 text-white border-none rounded-xl text-sm font-bold uppercase tracking-wide">
                  <Plus size={16} /> Add Team
                </button>
              </div>

              {isAddingTeam && (
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 mb-6 flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">Select Team to Add</label>
                    <select 
                      value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
                    >
                      <option value="">-- Choose Team --</option>
                      {availableTeamsToAdd.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.shortName || t.name.slice(0,3).toUpperCase()})</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    disabled={!selectedTeamId || addTeamMutation.isPending}
                    onClick={() => addTeamMutation.mutate(selectedTeamId)}
                    className="btn-primary px-8 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl whitespace-nowrap disabled:opacity-50"
                  >
                    {addTeamMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Selection'}
                  </button>
                </div>
              )}

              {tournamentTeams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50 border-dashed">
                  <Users size={48} className="text-zinc-700 mb-4" />
                  <p className="text-zinc-500 font-bold text-lg">No teams added yet.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {tournamentTeams.map((tt: any) => (
                    <div 
                      key={tt.id} 
                      onClick={() => router.push(`/teams/${tt.team.id}`)}
                      className="flex items-center justify-between group py-5 border-b border-white/5 transition-colors hover:bg-white/[0.02] last:border-0 px-2 lg:-mx-4 lg:px-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl font-black text-white shadow-inner shrink-0 relative">
                          {tt.team.shortName || tt.team.name.slice(0, 3).toUpperCase()}
                        </div>
                        <div className="flex flex-col justify-center">
                          <h4 className="font-black font-display tracking-tight text-white text-2xl uppercase group-hover:text-amber-500 transition-colors">{tt.team.name}</h4>
                        </div>
                      </div>
                      
                      <div className="hidden md:flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-amber-500/50 text-xs font-bold uppercase tracking-widest">View Roster</span>
                         <ChevronRight size={16} className="text-amber-500 ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* MATCHES/FIXTURES TAB */}
          {activeTab === 'MATCHES' && (
            <motion.div key="matches" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white font-display">Tournament Matches</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsFixturesModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-white border-none rounded-xl text-sm font-bold uppercase tracking-wide transition-colors"
                  >
                    <Settings size={16} /> Manage Fixtures
                  </button>
                  <button onClick={() => router.push(`/matches/create?tournamentId=${id}`)} className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-400 text-zinc-950 border-none rounded-xl text-sm font-bold uppercase tracking-wide transition-colors">
                    <Plus size={16} /> New Match
                  </button>
                </div>
              </div>

              {isLoadingMatches ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-amber-500" /></div>
              ) : (tournamentMatchesList.length === 0 && tbdFixtures.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50 border-dashed">
                  <Calendar size={48} className="text-zinc-700 mb-4" />
                  <p className="text-zinc-500 font-bold text-lg">No matches scheduled.</p>
                  <button onClick={() => setIsFixturesModalOpen(true)} className="mt-4 px-6 py-2 bg-zinc-800 text-white hover:bg-zinc-700 rounded-xl font-bold text-sm tracking-widest uppercase transition-colors">Auto-Generate Fixtures</button>
                </div>
              ) : (
                <div className="flex flex-col space-y-3">
                  {/* Actual Matches */}
                  {tournamentMatchesList.map((match: any) => (
                    <div key={match.id} onClick={() => router.push(`/match/${match.id}/${match.status === 'COMPLETED' ? 'scorecard' : 'score'}`)} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-zinc-950/40 hover:bg-zinc-900/80 border border-zinc-800/50 rounded-2xl group transition-all cursor-pointer hover:border-amber-500/30 overflow-hidden relative">
                      {/* Left: Date/Status */}
                      <div className="flex flex-row md:flex-col justify-between md:justify-center gap-2 md:w-32 shrink-0 md:border-r border-white/5 md:pr-4 mb-4 md:mb-0">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{new Date(match.startTime).toLocaleDateString()}</span>
                        <span className={clsx("px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border inline-block w-fit text-center", match.status === 'LIVE' ? "bg-red-500/20 text-red-500 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse" : "bg-zinc-900 text-zinc-400 border-zinc-800")}>
                          {match.status}
                        </span>
                      </div>
                      
                      {/* Center: Teams */}
                      <div className="flex-1 flex items-center justify-center gap-4 md:gap-8 px-2 md:px-4">
                        <div className="flex items-center gap-4 text-right w-1/2 justify-end">
                          <span className="text-sm sm:text-lg font-black font-display text-white uppercase tracking-wider truncate group-hover:text-amber-100 transition-colors">{match.team1?.name}</span>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs sm:text-sm text-zinc-300 shrink-0 shadow-inner group-hover:border-amber-500/30 group-hover:text-amber-500 transition-colors">{match.team1?.shortName || match.team1?.name.slice(0,3)}</div>
                        </div>
                        <span className="font-display font-black text-zinc-700 text-lg sm:text-xl tracking-tighter italic shrink-0 group-hover:text-amber-500/50 transition-colors">VS</span>
                        <div className="flex items-center gap-4 text-left w-1/2 justify-start">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs sm:text-sm text-zinc-300 shrink-0 shadow-inner group-hover:border-amber-500/30 group-hover:text-amber-500 transition-colors">{match.team2?.shortName || match.team2?.name.slice(0,3)}</div>
                          <span className="text-sm sm:text-lg font-black font-display text-white uppercase tracking-wider truncate group-hover:text-amber-100 transition-colors">{match.team2?.name}</span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="mt-4 md:mt-0 md:w-32 shrink-0 md:border-l border-white/5 md:pl-4 flex items-center justify-end">
                        {match.status === 'CREATED' ? (
                           <button onClick={(e) => { e.stopPropagation(); router.push(`/match/${match.id}/score`); }} className="w-full md:w-auto p-3 md:p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-zinc-950 transition-colors rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)] gap-2">
                             <Play size={14} fill="currentColor" /> <span className="md:hidden text-xs font-bold uppercase">Start</span>
                           </button>
                        ) : (
                           <div className="w-full md:w-auto p-3 md:p-0 flex justify-center text-zinc-600 group-hover:text-amber-500 transition-colors group-hover:translate-x-1">
                             <ChevronRight size={20} />
                           </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* TBD Fixtures mapped nicely alongside matches */}
                  {tbdFixtures.map((fix: any) => (
                    <div key={fix.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-zinc-950/20 border border-zinc-800/50 border-dashed rounded-2xl group transition-all opacity-80 hover:opacity-100">
                      {/* Left */}
                      <div className="flex flex-row md:flex-col justify-between md:justify-center gap-2 md:w-32 shrink-0 md:border-r border-white/5 md:pr-4 mb-4 md:mb-0">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Match {fix.matchNumber} {fix.round > 1 && `| Rd ${fix.round}`}</span>
                        <span className="px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border bg-zinc-900 text-zinc-500 border-zinc-800 border-dashed text-center w-fit">
                          FIXTURE (TBD)
                        </span>
                      </div>

                      {/* Center */}
                      <div className="flex-1 flex items-center justify-center gap-4 md:gap-8 px-2 md:px-4 grayscale">
                        <div className="flex items-center gap-4 text-right w-1/2 justify-end">
                          <span className="text-sm sm:text-lg font-black font-display text-zinc-400 uppercase tracking-wider truncate">{fix.team1?.name || 'To Be Announced'}</span>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-900 border border-zinc-800 border-dashed flex items-center justify-center font-bold text-xs text-zinc-500 shrink-0">{fix.team1?.shortName || fix.team1?.name?.slice(0,3) || 'TBA'}</div>
                        </div>
                        <span className="font-display font-black text-zinc-800 text-lg sm:text-xl tracking-tighter italic shrink-0">VS</span>
                        <div className="flex items-center gap-4 text-left w-1/2 justify-start">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-900 border border-zinc-800 border-dashed flex items-center justify-center font-bold text-xs text-zinc-500 shrink-0">{fix.team2?.shortName || fix.team2?.name?.slice(0,3) || 'TBA'}</div>
                          <span className="text-sm sm:text-lg font-black font-display text-zinc-400 uppercase tracking-wider truncate">{fix.team2?.name || 'To Be Announced'}</span>
                        </div>
                      </div>

                      {/* Right */}
                      <div className="mt-4 md:mt-0 md:w-32 shrink-0 md:border-l border-white/5 md:pl-4 flex items-center justify-end">
                        <button onClick={(e) => { e.stopPropagation(); router.push(`/matches/create?tournamentId=${id}&team1Id=${fix.team1Id}&team2Id=${fix.team2Id}`); }} className="w-full md:w-auto py-2 px-3 bg-zinc-800/50 hover:bg-amber-500 hover:text-zinc-950 transition-colors rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 text-zinc-400">
                          <Play size={10} fill="currentColor" /> Initialize
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* POINTS TABLE TAB */}
          {activeTab === 'POINTS_TABLE' && (
            <motion.div key="points" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="bg-zinc-950 overflow-hidden shadow-2xl">
                <div className="bg-zinc-950 p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white font-display uppercase tracking-wider">Tournament Standings</h3>
                  <div className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black tracking-widest uppercase rounded">Auto-Updating</div>
                </div>
                {isLoadingPoints ? (
                  <div className="flex justify-center p-20"><Loader2 className="animate-spin text-amber-500" /></div>
                ) : pointsTable.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-center px-4">
                    <Trophy size={64} className="text-zinc-800 mb-6" />
                    <p className="font-display font-black text-3xl text-zinc-500 uppercase tracking-tighter mb-2">Standings Unavailable</p>
                    <p className="text-zinc-500 text-sm font-medium tracking-wide">Add teams and wait for matches to complete to generate rankings.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-4">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b border-white/5 bg-zinc-900/50">
                          <th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-widest w-16 text-center">Pos</th>
                          <th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-widest">Team Name</th>
                          <th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-widest text-center w-16">P</th>
                          <th className="p-5 text-xs font-bold text-emerald-500 uppercase tracking-widest text-center w-16">W</th>
                          <th className="p-5 text-xs font-bold text-red-500 uppercase tracking-widest text-center w-16">L</th>
                          <th className="p-5 text-xs font-bold text-zinc-500 uppercase tracking-widest text-center w-20">NRR</th>
                          <th className="p-5 text-xs font-black text-amber-500 uppercase tracking-widest text-center w-20 border-l border-white/5">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {pointsTable.map((row: any, index: number) => (
                          <tr key={row.teamId} className="hover:bg-zinc-900/80 transition-colors group">
                            <td className="p-5 text-zinc-500 font-black font-display text-2xl text-center group-hover:text-amber-500 transition-colors">{index + 1}</td>
                            <td className="p-5 text-white font-black font-display text-xl uppercase tracking-wider">{row.teamName}</td>
                            <td className="p-5 text-zinc-400 text-center font-bold text-lg">{row.played}</td>
                            <td className="p-5 text-emerald-400 text-center font-bold text-lg">{row.won}</td>
                            <td className="p-5 text-red-400 text-center font-bold text-lg">{row.lost}</td>
                            <td className="p-5 text-zinc-400 text-center font-mono font-bold tracking-tighter text-sm">{row.netRunRate > 0 ? `+${row.netRunRate.toFixed(3)}` : row.netRunRate.toFixed(3)}</td>
                            <td className="p-5 font-black text-center text-3xl font-display text-amber-500 border-l border-white/5 bg-amber-500/5">{row.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-xl font-black font-display text-white flex items-center gap-2"><Settings size={20} className="text-amber-500" /> Tournament Settings</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-500 hover:text-white p-1 bg-zinc-800/50 hover:bg-zinc-700 rounded-full transition-colors"><X size={20} /></button>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wide">Tournament Name</label>
                  <input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wide">Format</label>
                    <select value={editForm.format || ''} onChange={(e) => setEditForm({...editForm, format: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50">
                      <option value="T20">T20</option>
                      <option value="ODI">ODI</option>
                      <option value="TEST">TEST</option>
                      <option value="T10">T10</option>
                      <option value="CUSTOM">CUSTOM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wide">Overs</label>
                    <input type="number" value={editForm.overs || ''} onChange={(e) => setEditForm({...editForm, overs: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wide">Status</label>
                  <select value={editForm.status || ''} onChange={(e) => setEditForm({...editForm, status: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50">
                    <option value="DRAFT">DRAFT</option>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>
              
              <div className="p-6 bg-zinc-950/50 border-t border-zinc-800 flex justify-between items-center">
                <button 
                  onClick={() => {
                     if(window.confirm('Are you absolutely sure you want to permanently delete this tournament and all its data? This cannot be undone.')) {
                        deleteTournamentMutation.mutate();
                     }
                  }} 
                  disabled={deleteTournamentMutation.isPending}
                  className="px-4 py-2 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl text-sm font-bold uppercase tracking-wide flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {deleteTournamentMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
                </button>
                <div className="flex gap-3">
                   <button onClick={() => setIsSettingsOpen(false)} className="px-5 py-2 text-zinc-400 hover:text-white font-bold text-sm tracking-wide transition-colors">Cancel</button>
                   <button 
                     onClick={() => updateTournamentMutation.mutate(editForm)}
                     disabled={updateTournamentMutation.isPending}
                     className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-sm font-bold uppercase tracking-wide flex items-center gap-2 disabled:opacity-50 transition-colors"
                   >
                     {updateTournamentMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Edit3 size={16} />} Save Changes
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FIXTURES MODAL */}
      <AnimatePresence>
        {isFixturesModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop Blur Layer */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#050505] border border-white/10 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] relative z-10">
              
              {/* Subtle Header Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-amber-500/20 blur-[80px] rounded-full pointer-events-none" />

              <div className="p-8 md:p-10 relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-black font-clash text-white flex items-center gap-3 tracking-tighter uppercase mb-2">
                       <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                         <List size={22} /> 
                       </div>
                       Manage Fixtures
                    </h2>
                    <p className="text-zinc-400 text-xs font-medium leading-relaxed max-w-sm">Automatically generate a schedule for participating teams. Generating new fixtures will overwrite unplayed matches.</p>
                  </div>
                  <button onClick={() => setIsFixturesModalOpen(false)} className="text-zinc-500 hover:text-white p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex shrink-0">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <button 
                    disabled={tournamentTeams.length < 2 || generateFixturesMutation.isPending}
                    onClick={() => generateFixturesMutation.mutate('round-robin')}
                    className="w-full bg-zinc-950/50 border border-white/5 hover:bg-zinc-900 hover:border-amber-500/30 p-5 rounded-2xl flex items-center justify-between transition-all group disabled:opacity-50 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 w-1 h-full bg-amber-500 scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-300" />
                    <div className="text-left pl-2">
                       <h4 className="text-white font-black font-display text-lg uppercase tracking-wider mb-0.5 group-hover:text-amber-500 transition-colors">Round-Robin Format</h4>
                       <p className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase">Every team plays every other team.</p>
                    </div>
                    {generateFixturesMutation.isPending && generateFixturesMutation.variables === 'round-robin' ? <Loader2 className="animate-spin text-amber-500" /> : <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-zinc-600 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors"><Play size={14} className="ml-0.5" /></div>}
                  </button>

                  <button 
                    disabled={tournamentTeams.length < 2 || generateFixturesMutation.isPending}
                    onClick={() => generateFixturesMutation.mutate('knockout')}
                    className="w-full bg-zinc-950/50 border border-white/5 hover:bg-zinc-900 hover:border-amber-500/30 p-5 rounded-2xl flex items-center justify-between transition-all group disabled:opacity-50 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 w-1 h-full bg-amber-500 scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-300" />
                    <div className="text-left pl-2">
                       <h4 className="text-white font-black font-display text-lg uppercase tracking-wider mb-0.5 group-hover:text-amber-500 transition-colors">Knockout Format</h4>
                       <p className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase">Single-elimination bracket.</p>
                    </div>
                    {generateFixturesMutation.isPending && generateFixturesMutation.variables === 'knockout' ? <Loader2 className="animate-spin text-amber-500" /> : <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-zinc-600 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors"><Play size={14} className="ml-0.5" /></div>}
                  </button>
                </div>
                
                <div className="mt-8 pt-8 border-t border-white/5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-4">Or Create Manually:</p>
                  <div className="bg-zinc-950/50 p-5 rounded-2xl border border-white/5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <select value={manualTeam1Id} onChange={(e) => setManualTeam1Id(e.target.value)} className="w-full bg-[#050505] border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm font-bold tracking-wide focus:outline-none focus:border-amber-500/50 transition-colors">
                        <option value="" disabled>Select Team 1</option>
                        {tournamentTeams.map((t: any) => (
                          <option key={t.team.id} value={t.team.id} disabled={t.team.id === manualTeam2Id}>{t.team.name}</option>
                        ))}
                      </select>
                      <select value={manualTeam2Id} onChange={(e) => setManualTeam2Id(e.target.value)} className="w-full bg-[#050505] border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm font-bold tracking-wide focus:outline-none focus:border-amber-500/50 transition-colors">
                        <option value="" disabled>Select Team 2</option>
                        {tournamentTeams.map((t: any) => (
                          <option key={t.team.id} value={t.team.id} disabled={t.team.id === manualTeam1Id}>{t.team.name}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      disabled={!manualTeam1Id || !manualTeam2Id || addFixtureMutation.isPending}
                      onClick={() => addFixtureMutation.mutate()}
                      className="w-full bg-white hover:bg-amber-400 text-zinc-950 rounded-xl py-3.5 text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] mt-2"
                    >
                      {addFixtureMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create Matchup
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
