'use client';

import { useState, useEffect } from 'react';
import { TeamService } from '@/services/api/team.service';
import { MatchService } from '@/services/api/match.service';
import { useSettingsStore } from '@/features/settings/settings.store';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, Loader2, Trophy, ShieldAlert, CheckCircle2, Play, Zap, Swords, Settings2, Coins, ArrowRightLeft } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import { toast } from 'sonner';

interface Team { id: string; name: string; shortName?: string; }

export default function CreateMatchPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isFetchingTeams, setIsFetchingTeams] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State: Teams
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');

  const settings = useSettingsStore();

  // Form State: Match Type & Settings
  const [matchType, setMatchType] = useState<'QUICK' | 'GULLY' | 'CUSTOM'>('QUICK');
  const [overs, setOvers] = useState<number | string>(settings.defaultOvers);
  const [playersPerTeam, setPlayersPerTeam] = useState<number | string>(settings.defaultSquadSize);
  const [venue, setVenue] = useState('');

  // Form State: Toss
  const [tossWinnerId, setTossWinnerId] = useState('');
  const [tossDecision, setTossDecision] = useState<'BAT' | 'BOWL' | ''>('');

  // Form State: Gully Rules
  const [gullyRules, setGullyRules] = useState<Record<string, boolean | number>>({
    lastManBatting: false,
    oneTipOneHand: false,
    sixIsOut: false,
    wideReball: true,
    noBallFreeHit: true,
    trialBall: false,
    noOverthrows: false,
    lbwDisabled: false,
  });
  const [ballMissOutActive, setBallMissOutActive] = useState(false);
  const [ballMissOutValue, setBallMissOutValue] = useState<number | ''>(3);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await TeamService.getTeams();
        setTeams(data);
      } catch (err) {
        console.error('Failed to fetch teams', err);
        setError('Failed to load registered teams. Please refresh the page.');
        toast.error('Failed to load registered teams.');
      } finally {
        setIsFetchingTeams(false);
      }
    };
    fetchTeams();
  }, []);

  // Sync settings when matchType changes
  useEffect(() => {
    if (matchType === 'QUICK') {
      setOvers(settings.defaultOvers);
      setPlayersPerTeam(settings.defaultSquadSize);
      setVenue('Street');
    } else if (matchType === 'GULLY') {
      setOvers(settings.defaultOvers * 2);
      setPlayersPerTeam(8);
      setVenue('Local Ground');
    } else if (matchType === 'CUSTOM') {
      setOvers(20);
      setPlayersPerTeam(11);
      setVenue('');
    }
  }, [matchType, settings.defaultOvers, settings.defaultSquadSize]);

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!team1Id) return setError('Please select Team 1');
      if (!team2Id) return setError('Please select Team 2');
      if (team1Id === team2Id) return setError('A team cannot play against itself');
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const toggleRule = (rule: keyof typeof gullyRules) => {
    setGullyRules(prev => ({ ...prev, [rule]: !prev[rule] }));
  };

  const handleCreate = async () => {
    if (!tossWinnerId) return setError('Please select who won the toss.');
    if (!tossDecision) return setError('Please select whether they chose to Bat or Bowl.');

    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Create the Match
      const finalGullyRules = {
        ...gullyRules,
        ...(ballMissOutActive && ballMissOutValue !== '' ? { ballMissOut: Number(ballMissOutValue) } : {})
      };

      const payload = {
        team1Id,
        team2: team2Id,
        format: matchType === 'QUICK' || matchType === 'GULLY' ? 'CUSTOM' : matchType,
        overs: typeof overs === 'number' ? overs : (parseInt(overs) || 5),
        venue: venue || 'Local Ground',
        gullyRules: matchType === 'GULLY' ? finalGullyRules : undefined,
        startTime: new Date().toISOString()
      };

      const data = await MatchService.createMatch(payload);
      const newMatchId = data.id || data.match?.id;

      if (!newMatchId) {
        throw new Error('Match ID missing from response');
      }

      // 2. Dispatch Match Toss Command
      await MatchService.recordToss(newMatchId, tossWinnerId, tossDecision);

      toast.success('Match created and Toss decided successfully!');
      router.push(`/match/${newMatchId}/score`);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create match';
      setError(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  // Helper resolving selected team names
  const team1 = teams.find(t => t.id === team1Id);
  const team2 = teams.find(t => t.id === team2Id);
  const team1Name = team1?.name || 'Team 1';
  const team2Name = team2?.name || 'Team 2';
  const team1Short = team1?.shortName || team1Name.substring(0, 3).toUpperCase();
  const team2Short = team2?.shortName || team2Name.substring(0, 3).toUpperCase();

  return (
    <div className="py-4 md:py-6 w-full max-w-[1000px] mx-auto relative px-4 flex flex-col min-h-[calc(100vh-8rem)]">
      
      {/* CINEMATIC HEADER */}
      <div className="mb-6 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-emerald-400 font-bold uppercase tracking-widest text-xs mb-3 transition-colors group">
            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all">
              <ArrowLeft size={14} />
            </div>
            Back to Command Center
          </Link>
          <h1 className="text-4xl md:text-5xl font-black font-clash text-white tracking-tighter uppercase mb-1">
            Create <span className="text-emerald-500 italic drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]">Match</span>
          </h1>
          <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs md:text-sm">
            Setup squads, rules and the toss.
          </p>
        </motion.div>

        {/* 3-Step Progress Tracker */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 md:gap-3">
          {[
            { num: 1, label: 'Teams' },
            { num: 2, label: 'Settings' },
            { num: 3, label: 'Toss' }
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div className={clsx(
                "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black text-base md:text-lg transition-all duration-500 border-2",
                step === s.num ? "bg-emerald-500 text-zinc-950 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110" :
                  step > s.num ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-zinc-900 border-zinc-800 text-zinc-600"
              )}>
                {step > s.num ? <CheckCircle2 size={20} className="md:w-6 md:h-6" /> : s.num}
              </div>
              <span className={clsx("text-[8px] md:text-[9px] font-bold uppercase tracking-widest mt-1.5 md:mt-2", step >= s.num ? "text-zinc-300" : "text-zinc-600")}>
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 flex flex-col"
      >
        <div className="bg-[#0a0a0a]/90 backdrop-blur-3xl p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-white/5 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] flex-1 flex flex-col overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="flex-1 relative z-10">
            <AnimatePresence mode="wait">

              {/* STEP 1: TEAMS */}
              {step === 1 && (
                <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-2xl font-black font-clash text-white uppercase tracking-tighter flex items-center gap-3 mb-8">
                    <Trophy className="text-emerald-500" size={24} /> Select Squads
                  </h2>

                  {isFetchingTeams ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>
                  ) : teams.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800">
                      <p className="text-zinc-400 mb-6 font-bold uppercase tracking-widest text-sm">No Signal from Base</p>
                      <Link href="/teams">
                        <button className="bg-emerald-500 text-zinc-950 px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]">Create First Squad</button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-8 max-w-2xl mx-auto mt-10">
                      <div className="group">
                        <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest group-focus-within:text-emerald-500 transition-colors">Team 1 Designation</label>
                        <div className="relative">
                          <select
                            value={team1Id}
                            onChange={e => setTeam1Id(e.target.value)}
                            className="w-full appearance-none bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-5 text-white font-bold text-xl uppercase tracking-wide focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all shadow-inner cursor-pointer"
                          >
                            <option value="" className="bg-zinc-900">-- SELECT TEAM 1 --</option>
                            {teams.map(t => <option key={t.id} value={t.id} disabled={t.id === team2Id} className="bg-zinc-900 text-white">{t.name}</option>)}
                          </select>
                          <div className="absolute top-1/2 right-6 -translate-y-1/2 pointer-events-none text-emerald-500 text-xl font-bold">▼</div>
                        </div>
                      </div>

                      <div className="relative flex items-center justify-center py-4">
                        <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
                        <div className="relative bg-[#0a0a0a] px-6 text-2xl font-black font-clash text-emerald-500 border border-zinc-800 rounded-full py-2">VS</div>
                      </div>

                      <div className="group">
                        <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest group-focus-within:text-emerald-500 transition-colors">Team 2 Designation</label>
                        <div className="relative">
                          <select
                            value={team2Id}
                            onChange={e => setTeam2Id(e.target.value)}
                            className="w-full appearance-none bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-5 text-white font-bold text-xl uppercase tracking-wide focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all shadow-inner cursor-pointer"
                          >
                            <option value="" className="bg-zinc-900">-- SELECT TEAM 2 --</option>
                            {teams.map(t => <option key={t.id} value={t.id} disabled={t.id === team1Id} className="bg-zinc-900 text-white">{t.name}</option>)}
                          </select>
                          <div className="absolute top-1/2 right-6 -translate-y-1/2 pointer-events-none text-emerald-500 text-xl font-bold">▼</div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 2: SETTINGS & START */}
              {step === 2 && (
                <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-2xl font-black font-clash text-white uppercase tracking-tighter flex items-center gap-3 mb-8">
                    <Settings2 className="text-emerald-500" size={24} /> Match Protocol
                  </h2>

                  <div className="space-y-10">
                    {/* Match Type Cards */}
                    <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                      <div
                        onClick={() => setMatchType('QUICK')}
                        className={clsx(
                          "cursor-pointer p-5 md:p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-3 group",
                          matchType === 'QUICK' ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] scale-105" : "bg-zinc-900/50 border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                        )}
                      >
                        <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300", matchType === 'QUICK' ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-500 group-hover:bg-emerald-500/20 group-hover:text-emerald-400")}>
                          <Zap size={24} className={matchType === 'QUICK' ? "fill-zinc-950" : ""} />
                        </div>
                        <div>
                          <h3 className={clsx("font-black font-clash text-xl uppercase tracking-tighter mb-1 transition-colors", matchType === 'QUICK' ? "text-emerald-400" : "text-white")}>Quick</h3>
                          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Instant Play</p>
                        </div>
                      </div>

                      <div
                        onClick={() => setMatchType('GULLY')}
                        className={clsx(
                          "cursor-pointer p-5 md:p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-3 group",
                          matchType === 'GULLY' ? "bg-amber-500/10 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)] scale-105" : "bg-zinc-900/50 border-zinc-800 hover:border-amber-500/50 hover:bg-amber-500/5"
                        )}
                      >
                        <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300", matchType === 'GULLY' ? "bg-amber-500 text-amber-950" : "bg-zinc-800 text-zinc-500 group-hover:bg-amber-500/20 group-hover:text-amber-400")}>
                          <Swords size={24} />
                        </div>
                        <div>
                          <h3 className={clsx("font-black font-clash text-xl uppercase tracking-tighter mb-1 transition-colors", matchType === 'GULLY' ? "text-amber-400" : "text-white")}>Gully Cricket</h3>
                          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Street Rules</p>
                        </div>
                      </div>

                      <div
                        onClick={() => setMatchType('CUSTOM')}
                        className={clsx(
                          "cursor-pointer p-5 md:p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-3 group",
                          matchType === 'CUSTOM' ? "bg-blue-500/10 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)] scale-105" : "bg-zinc-900/50 border-zinc-800 hover:border-blue-500/50 hover:bg-blue-500/5"
                        )}
                      >
                        <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300", matchType === 'CUSTOM' ? "bg-blue-500 text-blue-950" : "bg-zinc-800 text-zinc-500 group-hover:bg-blue-500/20 group-hover:text-blue-400")}>
                          <Settings2 size={24} />
                        </div>
                        <div>
                          <h3 className={clsx("font-black font-clash text-xl uppercase tracking-tighter mb-1 transition-colors", matchType === 'CUSTOM' ? "text-blue-400" : "text-white")}>Professional</h3>
                          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Standard T20/ODI</p>
                        </div>
                      </div>
                    </div>

                    {/* Configuration Area */}
                    <div className="bg-zinc-900/30 rounded-[2rem] p-6 border border-white/5 shadow-inner min-h-[160px]">
                      <AnimatePresence mode="wait">
                        {matchType === 'QUICK' && (
                          <motion.div key="quick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-2 h-full flex flex-col justify-center">
                            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">Default settings for Quick Match</p>
                            <div className="flex justify-center gap-12">
                              <div>
                                <div className="text-4xl md:text-5xl font-black font-clash text-white">{settings.defaultOvers}</div>
                                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Overs</div>
                              </div>
                              <div className="w-px bg-zinc-800" />
                              <div>
                                <div className="text-4xl md:text-5xl font-black font-clash text-white">{settings.defaultSquadSize}</div>
                                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Players</div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {matchType === 'GULLY' && (
                          <motion.div key="gully" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 md:gap-8">
                              <div>
                                <label className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Overs Limit</label>
                                <input type="number" min="1" value={overs} onChange={e => setOvers(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all font-black text-xl text-center" />
                              </div>
                              <div>
                                <label className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Squad Capacity</label>
                                <input type="number" min="1" value={playersPerTeam} onChange={e => setPlayersPerTeam(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all font-black text-xl text-center" />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 block">Gully Rules</label>
                              <div className="grid sm:grid-cols-2 gap-4">
                                <RuleToggle label="Last Man Batting" active={!!gullyRules.lastManBatting} onClick={() => toggleRule('lastManBatting')} />
                                <RuleToggle label="One Tip / One Hand" active={!!gullyRules.oneTipOneHand} onClick={() => toggleRule('oneTipOneHand')} />
                                <RuleToggle label="Direct 6 = OUT" active={!!gullyRules.sixIsOut} onClick={() => toggleRule('sixIsOut')} />
                                <RuleToggle label="Wide = Re-ball + Run" active={!!gullyRules.wideReball} onClick={() => toggleRule('wideReball')} />
                                <RuleToggle label="No Ball = Free Hit" active={!!gullyRules.noBallFreeHit} onClick={() => toggleRule('noBallFreeHit')} />
                                <RuleToggle label="First Ball = Trial" active={!!gullyRules.trialBall} onClick={() => toggleRule('trialBall')} />
                                <RuleToggle label="No Overthrows" active={!!gullyRules.noOverthrows} onClick={() => toggleRule('noOverthrows')} />
                                <RuleToggle label="LBW Disabled" active={!!gullyRules.lbwDisabled} onClick={() => toggleRule('lbwDisabled')} />
                                <EditableRuleToggle 
                                  value={ballMissOutValue} 
                                  active={ballMissOutActive} 
                                  onClick={() => {
                                    if (!ballMissOutActive && ballMissOutValue === '') setBallMissOutValue(3);
                                    setBallMissOutActive(!ballMissOutActive);
                                  }} 
                                  onChange={(val) => setBallMissOutValue(val)} 
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {matchType === 'CUSTOM' && (
                          <motion.div key="custom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                              <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Match Overs</label>
                                <input type="number" min="1" value={overs} onChange={e => setOvers(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-zinc-950/50 border-2 border-zinc-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-black text-2xl text-center" />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Players per Squad</label>
                                <input type="number" min="1" value={playersPerTeam} onChange={e => setPlayersPerTeam(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-zinc-950/50 border-2 border-zinc-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-black text-2xl text-center" />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Venue Designation</label>
                              <input type="text" placeholder="ENTER VENUE" value={venue} onChange={e => setVenue(e.target.value)} className="w-full bg-zinc-950/50 border-2 border-zinc-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all text-xl font-bold uppercase tracking-wider placeholder:text-zinc-700" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: THE TOSS */}
              {step === 3 && (
                <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col justify-center max-w-2xl mx-auto">
                  
                  <div className="text-center mb-6 md:mb-8 relative z-10">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mx-auto flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(245,158,11,0.4)]">
                      <Coins className="text-amber-950 w-8 h-8 md:w-10 md:h-10" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black font-clash text-white tracking-tighter uppercase mb-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">The Coin Toss</h2>
                  </div>

                  <div className="bg-zinc-950/80 backdrop-blur-3xl border border-zinc-800 rounded-3xl md:rounded-[2.5rem] p-4 md:p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className={clsx("absolute top-0 w-full h-1/2 opacity-20 blur-[100px] transition-colors duration-1000", tossWinnerId ? (tossDecision === 'BAT' ? "bg-blue-500" : tossDecision === 'BOWL' ? "bg-emerald-500" : "bg-amber-500") : "bg-zinc-700")} />

                    <div className="relative z-10 space-y-4 md:space-y-6">
                      <div className="space-y-3 md:space-y-4">
                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                          <button
                            onClick={() => setTossWinnerId(team1Id)}
                            className={clsx(
                              "relative py-5 px-3 md:py-6 md:px-4 rounded-2xl md:rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center gap-3 group overflow-hidden",
                              tossWinnerId === team1Id
                                ? "border-amber-500 bg-amber-500/10 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)] scale-105"
                                : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
                            )}
                          >
                            {tossWinnerId === team1Id && <motion.div layoutId="tossWinner" className="absolute inset-0 bg-amber-500/10" />}
                            <div className={clsx("w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center font-black text-lg md:text-xl font-clash", tossWinnerId === team1Id ? "bg-amber-500 text-amber-950" : "bg-zinc-800 text-white")}>
                              {team1Short}
                            </div>
                            <span className="font-bold text-center z-10 text-sm md:text-base">{team1Name}</span>
                          </button>

                          <button
                            onClick={() => setTossWinnerId(team2Id)}
                            className={clsx(
                              "relative py-5 px-3 md:py-6 md:px-4 rounded-2xl md:rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center gap-3 group overflow-hidden",
                              tossWinnerId === team2Id
                                ? "border-amber-500 bg-amber-500/10 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)] scale-105"
                                : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
                            )}
                          >
                            {tossWinnerId === team2Id && <motion.div layoutId="tossWinner" className="absolute inset-0 bg-amber-500/10" />}
                            <div className={clsx("w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center font-black text-lg md:text-xl font-clash", tossWinnerId === team2Id ? "bg-amber-500 text-amber-950" : "bg-zinc-800 text-white")}>
                              {team2Short}
                            </div>
                            <span className="font-bold text-center z-10 text-sm md:text-base">{team2Name}</span>
                          </button>
                        </div>
                      </div>

                      <div className={clsx("transition-all duration-700 space-y-4 md:space-y-6", !tossWinnerId ? "opacity-30 pointer-events-none blur-sm" : "opacity-100 blur-0")}>
                        <div className="flex items-center justify-center gap-3 md:gap-6">
                          <div className="h-[2px] w-full bg-gradient-to-r from-transparent to-zinc-800" />
                          <label className="text-[9px] md:text-[10px] whitespace-nowrap font-black text-zinc-500 uppercase tracking-[0.2em]">
                            {tossWinnerId ? <><span className="text-amber-400 mr-2">{tossWinnerId === team1Id ? team1Name : team2Name}</span>ELECTED TO</> : "ELECTED TO"}
                          </label>
                          <div className="h-[2px] w-full bg-gradient-to-l from-transparent to-zinc-800" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                          <button
                            onClick={() => setTossDecision('BAT')}
                            className={clsx(
                              "relative flex flex-col items-center gap-3 py-5 px-4 md:py-6 rounded-2xl md:rounded-[2rem] border-2 transition-all duration-300",
                              tossDecision === 'BAT' ? "border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.3)] scale-105" : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/icons/bat.png" alt="Bat" className={clsx("w-10 h-10 md:w-12 md:h-12 transition-all object-contain", tossDecision === 'BAT' ? "drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] scale-110 opacity-100" : "opacity-50 grayscale hover:grayscale-0 hover:opacity-80")} />
                            <span className="font-black font-clash text-xl md:text-2xl uppercase tracking-widest">Bat</span>
                          </button>
                          <button
                            onClick={() => setTossDecision('BOWL')}
                            className={clsx(
                              "relative flex flex-col items-center gap-3 py-5 px-4 md:py-6 rounded-2xl md:rounded-[2rem] border-2 transition-all duration-300",
                              tossDecision === 'BOWL' ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-105" : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/icons/ball.png" alt="Ball" className={clsx("w-10 h-10 md:w-12 md:h-12 transition-all object-contain", tossDecision === 'BOWL' ? "drop-shadow-[0_0_15px_rgba(16,185,129,0.6)] scale-110 opacity-100" : "opacity-50 grayscale hover:grayscale-0 hover:opacity-80")} />
                            <span className="font-black font-clash text-xl md:text-2xl uppercase tracking-widest">Bowl</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="pt-6 md:pt-8 mt-auto border-t border-white/5 relative z-20">
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 md:mb-6 p-3 md:p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center gap-2 md:gap-3 text-red-500 font-bold shadow-lg">
                <ShieldAlert size={18} className="md:w-5 md:h-5" />
                <p className="text-xs md:text-sm tracking-wide">{error}</p>
              </motion.div>
            )}

            <div className="flex justify-between items-center">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  disabled={isSubmitting}
                  className="px-6 py-3 md:px-8 md:py-4 font-bold uppercase tracking-widest text-[10px] md:text-xs text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
                >
                  Return
                </button>
              ) : <div></div>}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-white text-zinc-950 px-10 py-5 rounded-full font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-zinc-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  Verify <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="bg-emerald-500 text-zinc-950 px-12 py-5 rounded-full font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-emerald-400 transition-all hover:scale-105 disabled:opacity-50 shadow-[0_0_40px_rgba(16,185,129,0.4)] relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                  {isSubmitting ? <><Loader2 size={24} className="animate-spin relative z-10" /> <span className="relative z-10 block translate-y-px">Preparing Simulator...</span></> : <><Play size={24} className="fill-zinc-950 relative z-10" /> <span className="relative z-10 block translate-y-px">Start Match</span></>}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function RuleToggle({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex items-center justify-between px-3 py-2 md:py-2.5 rounded-lg border text-xs font-bold transition-all text-left",
        active ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "bg-[#111622] border-white/5 text-zinc-400 hover:border-white/10 hover:text-white"
      )}
    >
      {label}
      <div className={clsx("w-3.5 h-3.5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ml-2 transition-colors", active ? "border-amber-400" : "border-zinc-600")}>
        {active && <div className="w-[6px] h-[6px] rounded-full bg-amber-400" />}
      </div>
    </button>
  );
}

function EditableRuleToggle({ 
  value, 
  active, 
  onClick, 
  onChange 
}: { 
  value: number | '', 
  active: boolean, 
  onClick: () => void,
  onChange: (val: number | '') => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex items-center justify-between px-3 py-2 md:py-2.5 rounded-lg border text-xs font-bold transition-all text-left",
        active ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "bg-[#111622] border-white/5 text-zinc-400 hover:border-white/10 hover:text-white"
      )}
    >
      <div className="flex items-center gap-1.5" onClick={e => active && e.stopPropagation()}>
        <input 
          type="number"
          min="1"
          max="10"
          value={value}
          onChange={e => onChange(e.target.value === '' ? '' : parseInt(e.target.value))}
          disabled={!active}
          className={clsx(
            "w-8 text-center bg-transparent border-b outline-none transition-colors",
            active ? "border-amber-400 text-amber-400" : "border-zinc-700 text-zinc-400"
          )}
          placeholder="n"
        />
        <span>Misses = OUT</span>
      </div>
      <div className={clsx("w-3.5 h-3.5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ml-2 transition-colors", active ? "border-amber-400" : "border-zinc-600")}>
        {active && <div className="w-[6px] h-[6px] rounded-full bg-amber-400" />}
      </div>
    </button>
  );
}
