'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api/api.client';
import { LoadingLayer } from '@/components/ui/LoadingLayer';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Plus, Trash2, Shield, Sword, UserMinus, ArrowLeft, Edit2, Check, X, TrendingUp, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function TeamDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [teamMatches, setTeamMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'ROSTER' | 'ANALYTICS'>('ROSTER');

  // Edit Team State
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editedTeam, setEditedTeam] = useState({ name: '', shortName: '', homeGround: '', logoUrl: '' });
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);

  // Add Player Form State
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', role: 'BATSMAN', battingStyle: 'RIGHT_HANDED', bowlingStyle: 'RIGHT_ARM_FAST', jerseyNumber: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  const fetchTeamAndMatches = async () => {
    try {
      const [teamRes, matchesRes] = await Promise.all([
        apiClient.get(`/teams/${params.id}`),
        apiClient.get(`/matches?teamId=${params.id}&limit=50`)
      ]);
      const t = teamRes.data?.data || teamRes.data;
      setTeam(t);
      setEditedTeam({ name: t.name, shortName: t.shortName || '', homeGround: t.homeGround || '', logoUrl: t.logoUrl || '' });
      
      const m = matchesRes.data?.data || [];
      setTeamMatches(m);
    } catch (error) {
      console.error('Failed to fetch team details:', error);
      toast.error('Failed to load team details');
      router.push('/teams');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamAndMatches();
  }, [params.id]);

  const handleUpdateTeam = async () => {
    if (!editedTeam.name.trim()) {
      toast.error('Team name cannot be empty');
      return;
    }
    setIsUpdatingTeam(true);
    try {
      await apiClient.patch(`/teams/${params.id}`, {
        name: editedTeam.name.trim(),
        shortName: editedTeam.shortName.trim() || undefined,
        homeGround: editedTeam.homeGround.trim() || undefined,
        logoUrl: editedTeam.logoUrl.trim() || undefined
      });
      toast.success('Team updated successfully');
      setIsEditingTeam(false);
      fetchTeamAndMatches();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update team');
    } finally {
      setIsUpdatingTeam(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm(`Are you sure you want to completely delete "${team.name}"? This action cannot be undone.`)) return;
    
    setIsDeletingTeam(true);
    try {
      await apiClient.delete(`/teams/${params.id}`);
      toast.success(`${team.name} has been deleted`);
      router.push('/teams');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete team');
      setIsDeletingTeam(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayer.name.trim()) {
      toast.error('Player name is required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: newPlayer.name.trim(),
        role: newPlayer.role,
        battingStyle: newPlayer.battingStyle,
        teamId: params.id
      };

      if (newPlayer.jerseyNumber) {
        payload.jerseyNumber = parseInt(newPlayer.jerseyNumber);
      }

      if (newPlayer.role === 'BOWLER' || newPlayer.role === 'ALL_ROUNDER') {
        payload.bowlingStyle = newPlayer.bowlingStyle;
      }

      await apiClient.post('/players', payload);
      toast.success('Player added successfully');
      setNewPlayer({ name: '', role: 'BATSMAN', battingStyle: 'RIGHT_HANDED', bowlingStyle: 'RIGHT_ARM_FAST', jerseyNumber: '' });
      setIsAddingPlayer(false);
      fetchTeamAndMatches(); // Refresh roster
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add player');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to remove ${playerName} from the squad?`)) return;
    
    try {
      await apiClient.delete(`/teams/${params.id}/players/${playerId}`);
      toast.success(`${playerName} removed from squad`);
      fetchTeamAndMatches(); // Refresh roster
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove player');
    }
  };

  const handleAssignRole = async (playerId: string, roleType: 'CAPTAIN' | 'VICE_CAPTAIN') => {
    try {
      const payload: any = {};
      
      // Exclusive Toggle logic: Only one Captain and one Vice Captain
      if (roleType === 'CAPTAIN') {
        const isAlreadyCaptain = team.captainId === playerId;
        payload.captainId = isAlreadyCaptain ? null : playerId;
        // If promoting to Captain, automatically remove them from VC if they were VC
        if (!isAlreadyCaptain && team.viceCaptainId === playerId) {
          payload.viceCaptainId = null;
        }
      } else {
        const isAlreadyVC = team.viceCaptainId === playerId;
        payload.viceCaptainId = isAlreadyVC ? null : playerId;
        // If promoting to VC, automatically remove them from Captain if they were Captain
        if (!isAlreadyVC && team.captainId === playerId) {
          payload.captainId = null;
        }
      }

      await apiClient.patch(`/teams/${params.id}`, payload);
      toast.success(`Leadership updated successfully`);
      fetchTeamAndMatches();
    } catch (error: any) {
      toast.error('Failed to assign leadership role');
    }
  };

  if (isLoading) return <LoadingLayer />;
  if (!team) return <div className="p-8 text-center text-zinc-400">Team not found.</div>;

  const players = team.players || [];
  const totalMatches = teamMatches.length;
  const completedMatches = teamMatches.filter(m => m.status === 'COMPLETED');

  // Optgroup styles specifically for Windows/Chrome native select dropdowns
  const selectOptGroupStyle = "bg-zinc-900 text-emerald-400 font-black";
  const selectOptionStyle = "bg-zinc-900 text-white font-medium";

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link href="/teams" className="text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <span className="text-sm font-bold text-emerald-500 tracking-widest uppercase">Team Profile</span>
      </div>
      
      <header className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-6 pb-6 border-b border-zinc-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 flex-1">
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} className="w-20 h-20 bg-zinc-900 rounded-3xl object-cover border border-zinc-800 shadow-[0_0_30px_rgba(16,185,129,0.1)] shrink-0" />
          ) : (
            <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex shrink-0 items-center justify-center border border-zinc-800 text-3xl font-black text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              {team.shortName || team.name.slice(0, 3).toUpperCase()}
            </div>
          )}
          
          <div className="flex-1 w-full max-w-2xl">
            {isEditingTeam ? (
              <div className="space-y-3 w-full">
                <input 
                  type="text" 
                  value={editedTeam.name}
                  onChange={e => setEditedTeam({...editedTeam, name: e.target.value})}
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2 text-xl font-bold font-clash text-white focus:outline-none focus:border-emerald-500/50"
                  placeholder="Enter Team Name"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    value={editedTeam.shortName}
                    onChange={e => setEditedTeam({...editedTeam, shortName: e.target.value})}
                    className="w-full sm:w-1/4 bg-zinc-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    placeholder="Short Name"
                  />
                  <input 
                    type="text" 
                    value={editedTeam.homeGround}
                    onChange={e => setEditedTeam({...editedTeam, homeGround: e.target.value})}
                    className="w-full sm:w-2/4 bg-zinc-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    placeholder="Home Ground Location"
                  />
                  <input 
                    type="text" 
                    value={editedTeam.logoUrl}
                    onChange={e => setEditedTeam({...editedTeam, logoUrl: e.target.value})}
                    className="w-full sm:w-1/4 bg-zinc-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    placeholder="External Logo URL"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl md:text-5xl font-black font-clash text-white mb-2 truncate max-w-lg">{team.name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-zinc-400">
                  <span className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-white/5">
                    <Users size={16} className="text-emerald-500" /> {players.length} Players
                  </span>
                  {team.homeGround && (
                    <span className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-white/5">
                      <MapPin size={16} className="text-emerald-500" /> {team.homeGround}
                    </span>
                  )}
                  {team.shortName && (
                    <span className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-white/5 font-bold tracking-widest uppercase">
                      {team.shortName}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 mt-4 xl:mt-0 lg:ml-auto shrink-0">
          {isEditingTeam ? (
            <>
              <button 
                onClick={handleUpdateTeam}
                disabled={isUpdatingTeam}
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Check size={18} /> {isUpdatingTeam ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={() => setIsEditingTeam(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <X size={18} /> Cancel
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsEditingTeam(true)}
                className="bg-zinc-800/50 border border-white/5 hover:bg-white/10 text-zinc-300 font-bold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Edit2 size={16} /> Edit
              </button>
              <button 
                onClick={handleDeleteTeam}
                disabled={isDeletingTeam}
                className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 font-bold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </button>
              <button 
                onClick={() => {
                  setActiveTab('ROSTER');
                  setIsAddingPlayer(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Add Player
              </button>
            </>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2">
        <button 
          onClick={() => setActiveTab('ROSTER')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors border ${activeTab === 'ROSTER' ? 'bg-white text-zinc-950 border-white' : 'bg-zinc-900/50 text-zinc-400 border-white/5 hover:bg-white/5'}`}
        >
          Squad Roster
        </button>
        <button 
          onClick={() => setActiveTab('ANALYTICS')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-colors border ${activeTab === 'ANALYTICS' ? 'bg-emerald-500 text-zinc-950 border-emerald-500' : 'bg-zinc-900/50 text-zinc-400 border-white/5 hover:bg-white/5'}`}
        >
          <TrendingUp size={16} /> Analytics
        </button>
      </div>

      {activeTab === 'ROSTER' ? (
        <div className="space-y-6">
          {/* Add Player Form (Conditional) */}
          <AnimatePresence>
            {isAddingPlayer && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'visible' }}
                className="glass-premium p-6 rounded-[2rem] border border-emerald-500/20"
                onSubmit={handleAddPlayer}
              >
                <div className="grid md:grid-cols-6 gap-4 items-end">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Player Name</label>
                    <input 
                      type="text" 
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                      placeholder="Enter full name"
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Jersey</label>
                    <input 
                      type="number" 
                      value={newPlayer.jerseyNumber}
                      onChange={(e) => setNewPlayer({...newPlayer, jerseyNumber: e.target.value})}
                      placeholder="Num"
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Role</label>
                    <select 
                      value={newPlayer.role}
                      onChange={(e) => setNewPlayer({...newPlayer, role: e.target.value})}
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium appearance-none"
                    >
                      <option className={selectOptionStyle} value="BATSMAN">Batsman</option>
                      <option className={selectOptionStyle} value="BOWLER">Bowler</option>
                      <option className={selectOptionStyle} value="ALL_ROUNDER">All-Rounder</option>
                      <option className={selectOptionStyle} value="WICKET_KEEPER">Wicket Keeper</option>
                      <option className={selectOptionStyle} value="WICKET_KEEPER_BATSMAN">WK Batsman</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Batting</label>
                    <select 
                      value={newPlayer.battingStyle}
                      onChange={(e) => setNewPlayer({...newPlayer, battingStyle: e.target.value})}
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium appearance-none"
                    >
                      <option className={selectOptionStyle} value="RIGHT_HANDED">Right Hand</option>
                      <option className={selectOptionStyle} value="LEFT_HANDED">Left Hand</option>
                    </select>
                  </div>

                  {(newPlayer.role === 'BOWLER' || newPlayer.role === 'ALL_ROUNDER') && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider pl-1">Bowling Style</label>
                      <select 
                        value={newPlayer.bowlingStyle}
                        onChange={(e) => setNewPlayer({...newPlayer, bowlingStyle: e.target.value})}
                        className="w-full bg-emerald-900/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium appearance-none"
                      >
                        <optgroup className={selectOptGroupStyle} label="Fast / Pace">
                          <option className={selectOptionStyle} value="RIGHT_ARM_FAST">Right Arm Fast</option>
                          <option className={selectOptionStyle} value="RIGHT_ARM_MEDIUM_FAST">Right Arm Medium Fast</option>
                          <option className={selectOptionStyle} value="RIGHT_ARM_MEDIUM">Right Arm Medium</option>
                          <option className={selectOptionStyle} value="LEFT_ARM_FAST">Left Arm Fast</option>
                          <option className={selectOptionStyle} value="LEFT_ARM_MEDIUM_FAST">Left Arm Medium Fast</option>
                        </optgroup>
                        <optgroup className={selectOptGroupStyle} label="Spin">
                          <option className={selectOptionStyle} value="RIGHT_ARM_OFF_SPIN">Right Arm Off Spin</option>
                          <option className={selectOptionStyle} value="RIGHT_ARM_LEG_SPIN">Right Arm Leg Spin</option>
                          <option className={selectOptionStyle} value="LEFT_ARM_SPIN">Left Arm Spin</option>
                          <option className={selectOptionStyle} value="CHINAMAN">Chinaman</option>
                          <option className={selectOptionStyle} value="GOOGLY">Googly</option>
                        </optgroup>
                      </select>
                    </div>
                  )}

                  <div className={`flex gap-3 md:col-span-1 ${(newPlayer.role === 'BOWLER' || newPlayer.role === 'ALL_ROUNDER') ? 'md:col-start-6' : ''}`}>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-emerald-500 text-zinc-950 font-bold py-3 rounded-xl hover:bg-emerald-400 transition-colors"
                    >
                      {isSubmitting ? '...' : 'Save'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsAddingPlayer(false)}
                      className="px-4 bg-zinc-800 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Players List */}
          {players.length === 0 ? (
            <div className="glass-premium rounded-[2rem] p-12 text-center border-dashed border-white/10">
              <Shield size={48} className="mx-auto text-zinc-800 mb-4" />
              <h3 className="text-xl font-bold text-zinc-400 mb-2">Empty Roster</h3>
              <p className="text-zinc-600">This team currently has no players registered.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player: any, idx: number) => {
                const isCaptain = team.captainId === player.id;
                const isViceCaptain = team.viceCaptainId === player.id;

                return (
                  <motion.div 
                    key={player.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`glass-premium p-5 rounded-2xl flex items-center justify-between group border transition-all ${isCaptain ? 'border-amber-500/30 bg-amber-500/5' : isViceCaptain ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 hover:border-white/10'}`}
                  >
                    <div className="flex items-center gap-4 w-full pr-2">
                      <div className="relative shrink-0">
                        {player.avatarUrl ? (
                          <img src={player.avatarUrl} alt={player.name} className="w-12 h-12 rounded-full object-cover border border-zinc-800" />
                        ) : (
                          <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 text-emerald-500 font-black">
                            {player.name.charAt(0)}
                          </div>
                        )}
                        {player.jerseyNumber && (
                          <div className="absolute -bottom-1 -right-1 bg-white text-zinc-950 text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0B0F1A]">
                            {player.jerseyNumber}
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center gap-2">
                          <Link href={`/players/${player.id}`} className="hover:underline">
                            <h4 className="text-lg font-bold text-white leading-tight truncate">{player.name}</h4>
                          </Link>
                          {isCaptain && <span className="bg-amber-500 text-amber-950 text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest shrink-0">C</span>}
                          {isViceCaptain && <span className="bg-emerald-500 text-emerald-950 text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest shrink-0">VC</span>}
                        </div>
                        <span className="text-xs font-medium text-zinc-500 flex items-center gap-1 mt-1 truncate">
                          {player.role === 'BATSMAN' && <Sword size={12} className="text-blue-400 shrink-0" />}
                          {(player.role === 'BOWLER' || player.role === 'ALL_ROUNDER') && <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />}
                          {player.role.replace(/_/g, ' ')} 
                          {player.battingStyle ? ` - ${player.battingStyle.replace('_HANDED', 'H')}` : ''}
                          {player.bowlingStyle ? ` (${player.bowlingStyle.replace(/_ARM_|_/g, ' ')})` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all pl-2">
                      <button 
                        onClick={() => handleAssignRole(player.id, 'CAPTAIN')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isCaptain ? 'bg-amber-500 text-amber-950' : 'bg-zinc-800/80 text-zinc-500 hover:bg-amber-500/20 hover:text-amber-400'}`}
                        title={isCaptain ? "Remove Captain" : "Make Captain"}
                      >
                        <span className="font-black text-[10px]">C</span>
                      </button>
                      <button 
                        onClick={() => handleAssignRole(player.id, 'VICE_CAPTAIN')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isViceCaptain ? 'bg-emerald-500 text-emerald-950' : 'bg-zinc-800/80 text-zinc-500 hover:bg-emerald-500/20 hover:text-emerald-400'}`}
                        title={isViceCaptain ? "Remove Vice Captain" : "Make Vice Captain"}
                      >
                        <span className="font-black text-[10px]">VC</span>
                      </button>
                      <button 
                        onClick={() => handleRemovePlayer(player.id, player.name)}
                        className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all ml-1"
                        title="Remove Player"
                      >
                        <UserMinus size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-premium p-6 rounded-3xl border border-white/5 md:col-span-3">
            <h3 className="font-clash font-black text-2xl mb-6">Historical Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Total Matches</div>
                <div className="text-4xl font-black text-white">{totalMatches}</div>
              </div>
              <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Completed</div>
                <div className="text-4xl font-black text-emerald-400">{completedMatches.length}</div>
              </div>
              <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 md:col-span-2 flex flex-col items-center justify-center text-center">
                <HelpCircle className="w-8 h-8 text-zinc-600 mb-2" />
                <p className="text-sm font-medium text-zinc-500">More Deep Win/Loss and Net Run Rate Analytics will populate here as more historical Match Data Scorecards are completed and closed.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
