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
  const [gullyRules, setGullyRules] = useState({
    lastManBatting: false,
    oneTipOneHand: false,
    sixIsOut: false,
    wideReball: true,
    noBallFreeHit: true,
  });

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
      const payload = {
        team1Id,
        team2: team2Id,
        format: matchType === 'QUICK' || matchType === 'GULLY' ? 'CUSTOM' : matchType,
        overs: typeof overs === 'number' ? overs : (parseInt(overs) || 5),
        venue: venue || 'Local Ground',
        gullyRules: matchType === 'GULLY' ? gullyRules : undefined,
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
  const team1Name = teams.find(t => t.id === team1Id)?.name || 'Team 1';
  const team2Name = teams.find(t => t.id === team2Id)?.name || 'Team 2';

  return (
    <div className="max-w-3xl mx-auto pb-4 pt-4 px-4 flex flex-col justify-center min-h-[calc(100vh-2rem)]">
      {/* Header & Back Button */}
      <div className="flex items-center gap-4 mb-4">
        <Link href="/dashboard" className="p-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-black font-clash text-white">Create New Match</h1>
          <p className="text-emerald-500 text-[10px] md:text-xs font-bold tracking-wider uppercase mt-0.5">Setup squads, rules and the toss.</p>
        </div>
      </div>

      {/* 3-Step Progress Tracker */}
      <div className="flex items-center mb-6 max-w-sm mx-auto w-full">
        {[
          { num: 1, label: 'Teams' },
          { num: 2, label: 'Settings' },
          { num: 3, label: 'Toss' }
        ].map((s, i) => (
          <div key={s.num} className="flex flex-col items-center flex-1 relative z-10 w-1/3">
            <div className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 border-2",
              step === s.num ? "bg-emerald-500 text-zinc-950 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" :
                step > s.num ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-zinc-900 text-zinc-600 border-zinc-800"
            )}>
              {step > s.num ? <CheckCircle2 size={20} /> : s.num}
            </div>
            <span className={clsx("text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-2 absolute -bottom-6 w-max", step >= s.num ? "text-zinc-300" : "text-zinc-600")}>
              {s.label}
            </span>
          </div>
        ))}
        {/* Progress Line */}
        <div className="absolute left-[15%] right-[15%] h-[2px] -z-10 bg-zinc-800 mt-[-20px]">
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }} />
        </div>
      </div>

      {/* Main Form Area */}
      <div className="glass-premium rounded-[2rem] p-5 md:p-6 relative overflow-hidden mt-6 border border-white/5 shadow-2xl">
        <AnimatePresence mode="wait">

          {/* STEP 1: TEAMS */}
          {step === 1 && (
            <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="text-emerald-500" size={18} /> Select Squads
              </h2>

              {isFetchingTeams ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
              ) : teams.length === 0 ? (
                <div className="text-center py-10 bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
                  <p className="text-zinc-400 mb-4">You have no registered teams.</p>
                  <Link href="/teams">
                    <button className="text-emerald-400 font-medium hover:text-emerald-300 underline">Create your first team</button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider pl-1">Team 1 (Host)</label>
                    <select
                      value={team1Id}
                      onChange={e => setTeam1Id(e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium appearance-none hover:border-white/20 shadow-inner"
                    >
                      <option className="bg-zinc-900 text-white" value="">-- Select Team 1 --</option>
                      {teams.map(t => <option className="bg-zinc-900 text-white" key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>

                  <div className="relative py-4 flex items-center justify-center">
                    <div className="absolute inset-x-0 h-[1px] bg-zinc-800/50"></div>
                    <div className="relative bg-[#0c101a] px-4 text-xs font-black italic text-zinc-500 border border-zinc-800/50 rounded-full py-1">VS</div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider pl-1">Team 2 (Challenger)</label>
                    <select
                      value={team2Id}
                      onChange={e => setTeam2Id(e.target.value)}
                      className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium appearance-none hover:border-white/20 shadow-inner"
                    >
                      <option className="bg-zinc-900 text-white" value="">-- Select Team 2 --</option>
                      {teams.map(t => <option className="bg-zinc-900 text-white" key={t.id} value={t.id} disabled={t.id === team1Id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: SETTINGS & START */}
          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Settings2 className="text-emerald-500" size={18} /> Match Type & Rules
              </h2>

              <div className="space-y-4">
                {/* Match Type Cards */}
                <div className="grid md:grid-cols-3 gap-3">
                  {/* Quick Match Card */}
                  <div 
                    onClick={() => setMatchType('QUICK')}
                    className={clsx(
                      "cursor-pointer p-4 rounded-xl border transition-all duration-300 flex flex-col items-center text-center gap-2",
                      matchType === 'QUICK' ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-[1.02]" : "bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/[0.02]"
                    )}
                  >
                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center mb-1", matchType === 'QUICK' ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-400")}>
                      <Zap size={20} className={matchType === 'QUICK' ? "fill-zinc-950" : ""} />
                    </div>
                    <div>
                      <h3 className={clsx("font-black font-clash text-base leading-none mb-1", matchType === 'QUICK' ? "text-emerald-400" : "text-white")}>Quick Match</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Default Rules</p>
                    </div>
                  </div>

                  {/* Gully Match Card */}
                  <div 
                    onClick={() => setMatchType('GULLY')}
                    className={clsx(
                      "cursor-pointer p-4 rounded-xl border transition-all duration-300 flex flex-col items-center text-center gap-2",
                      matchType === 'GULLY' ? "bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] scale-[1.02]" : "bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/[0.02]"
                    )}
                  >
                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center mb-1", matchType === 'GULLY' ? "bg-amber-500 text-amber-950" : "bg-zinc-800 text-zinc-400")}>
                      <Swords size={20} />
                    </div>
                    <div>
                      <h3 className={clsx("font-black font-clash text-base leading-none mb-1", matchType === 'GULLY' ? "text-amber-400" : "text-white")}>Gully Match</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Custom Rules</p>
                    </div>
                  </div>

                  {/* Custom Match Card */}
                  <div 
                    onClick={() => setMatchType('CUSTOM')}
                    className={clsx(
                      "cursor-pointer p-4 rounded-xl border transition-all duration-300 flex flex-col items-center text-center gap-2",
                      matchType === 'CUSTOM' ? "bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-[1.02]" : "bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/[0.02]"
                    )}
                  >
                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center mb-1", matchType === 'CUSTOM' ? "bg-blue-500 text-blue-950" : "bg-zinc-800 text-zinc-400")}>
                      <Settings2 size={20} />
                    </div>
                    <div>
                      <h3 className={clsx("font-black font-clash text-base leading-none mb-1", matchType === 'CUSTOM' ? "text-blue-400" : "text-white")}>Custom</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Pro Setup</p>
                    </div>
                  </div>
                </div>

                {/* Configuration Area */}
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <AnimatePresence mode="wait">
                    
                    {matchType === 'QUICK' && (
                      <motion.div key="quick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-2">
                        <p className="text-zinc-400 text-sm font-medium">Auto configured for a fast start.</p>
                        <div className="flex justify-center gap-6 mt-4">
                          <div className="font-black text-xl text-white">5 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Overs</span></div>
                          <div className="w-px h-10 bg-white/10" />
                          <div className="font-black text-xl text-white">6 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Players</span></div>
                        </div>
                      </motion.div>
                    )}

                    {matchType === 'GULLY' && (
                      <motion.div key="gully" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1 space-y-1 block">Overs</label>
                            <input type="number" min="1" value={overs} onChange={e => setOvers(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-all font-black text-lg text-center" />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1 space-y-1 block">Squad Size</label>
                            <input type="number" min="1" value={playersPerTeam} onChange={e => setPlayersPerTeam(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-all font-black text-lg text-center" />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1 mb-2 block">Gully Rules</label>
                          <div className="grid sm:grid-cols-2 gap-2">
                            <RuleToggle label="Last Man Batting" active={gullyRules.lastManBatting} onClick={() => toggleRule('lastManBatting')} />
                            <RuleToggle label="One Tip / One Hand Catch" active={gullyRules.oneTipOneHand} onClick={() => toggleRule('oneTipOneHand')} />
                            <RuleToggle label="Direct 6 = OUT" active={gullyRules.sixIsOut} onClick={() => toggleRule('sixIsOut')} />
                            <RuleToggle label="Wide = Re-ball + Run" active={gullyRules.wideReball} onClick={() => toggleRule('wideReball')} />
                            <RuleToggle label="No Ball = Free Hit" active={gullyRules.noBallFreeHit} onClick={() => toggleRule('noBallFreeHit')} />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {matchType === 'CUSTOM' && (
                      <motion.div key="custom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Overs</label>
                            <input type="number" min="1" value={overs} onChange={e => setOvers(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Players / Team</label>
                            <input type="number" min="1" value={playersPerTeam} onChange={e => setPlayersPerTeam(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Venue Location</label>
                          <input type="text" placeholder="Enter venue name" value={venue} onChange={e => setVenue(e.target.value)} className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium" />
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
            <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Coins className="text-emerald-500" size={18} /> The Coin Toss
              </h2>

              <div className="bg-[#0a0e1a]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-inner space-y-8">
                {/* 1. Who Won? */}
                <div>
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest block mb-4 text-center">Who won the Toss?</label>
                  <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                    <button 
                      onClick={() => setTossWinnerId(team1Id)}
                      className={clsx(
                        "py-4 px-4 rounded-xl border-2 transition-all duration-300 font-bold text-sm",
                        tossWinnerId === team1Id ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                      )}
                    >
                      {team1Name}
                    </button>
                    <button 
                      onClick={() => setTossWinnerId(team2Id)}
                      className={clsx(
                        "py-4 px-4 rounded-xl border-2 transition-all duration-300 font-bold text-sm",
                        tossWinnerId === team2Id ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                      )}
                    >
                      {team2Name}
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

                {/* 2. Decision */}
                <div className={clsx("transition-opacity duration-500", !tossWinnerId ? "opacity-30 pointer-events-none" : "opacity-100")}>
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest block mb-4 text-center">Elected To...</label>
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <button 
                      onClick={() => setTossDecision('BAT')}
                      className={clsx(
                        "flex flex-col items-center gap-2 py-4 px-4 rounded-xl border-2 transition-all duration-300",
                        tossDecision === 'BAT' ? "border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]" : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                      )}
                    >
                      <Zap size={24} className={tossDecision === 'BAT' ? "fill-blue-500" : ""} />
                      <span className="font-black tracking-widest text-sm uppercase">BAT</span>
                    </button>
                    <button 
                      onClick={() => setTossDecision('BOWL')}
                      className={clsx(
                        "flex flex-col items-center gap-2 py-4 px-4 rounded-xl border-2 transition-all duration-300",
                        tossDecision === 'BOWL' ? "border-rose-500 bg-rose-500/10 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]" : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                      )}
                    >
                      <ArrowRightLeft size={24} className={tossDecision === 'BOWL' ? "stroke-[3px]" : ""} />
                      <span className="font-black tracking-widest text-sm uppercase">BOWL</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-500 font-semibold shadow-lg shadow-red-500/10">
          <ShieldAlert size={18} className="shrink-0 mt-0.5" />
          <p className="font-medium text-xs tracking-wide">{error}</p>
        </motion.div>
      )}

      {/* Footer Navigation */}
      <div className="mt-6 flex justify-between items-center px-1">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            disabled={isSubmitting}
            className="px-6 py-3 font-bold text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Back
          </button>
        ) : <div></div>}

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="bg-zinc-100 text-zinc-900 px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-white transition-colors shadow-lg"
          >
            Next Step <ChevronRight size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 border border-emerald-400/20 px-8 py-3.5 rounded-xl font-black text-lg flex items-center gap-2 hover:from-emerald-400 hover:to-teal-300 transition-all duration-300 ease-expo hover:-translate-y-1 disabled:opacity-50 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]"
          >
            {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> Preparing Pitch...</> : <><Play size={20} className="fill-zinc-950" /> Start Match</>}
          </button>
        )}
      </div>

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
