'use client';

import { useState, useEffect } from 'react';
import { TeamService } from '@/services/api/team.service';
import { MatchService } from '@/services/api/match.service';
import { apiClient } from '@/services/api/api.client';
import { useSettingsStore } from '@/features/settings/settings.store';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, Loader2, Trophy, ShieldAlert, CheckCircle2, Play, Zap, Swords, Settings2, Coins, ArrowRightLeft, X, Search, Plus, MapPin, UserSquare2 } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import { toast } from 'sonner';

interface Team { id: string; name: string; shortName?: string; players?: { id: string; name: string; role: string }[]; }

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
  
  // Selection Modal State
  const [selectingTeamFor, setSelectingTeamFor] = useState<'TEAM1' | 'TEAM2' | null>(null);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // Squad Player Search States
  const [team1PlayerSearch, setTeam1PlayerSearch] = useState('');
  const [team2PlayerSearch, setTeam2PlayerSearch] = useState('');

  // Form State: Squads
  const [team1XI, setTeam1XI] = useState<string[]>([]);
  const [team1Captain, setTeam1Captain] = useState<string | null>(null);
  const [team1Vc, setTeam1Vc] = useState<string | null>(null);
  const [team1Wk, setTeam1Wk] = useState<string | null>(null);

  const [team2XI, setTeam2XI] = useState<string[]>([]);
  const [team2Captain, setTeam2Captain] = useState<string | null>(null);
  const [team2Vc, setTeam2Vc] = useState<string | null>(null);
  const [team2Wk, setTeam2Wk] = useState<string | null>(null);

  const settings = useSettingsStore();

  // Form State: Match Type & Settings
  const [matchType, setMatchType] = useState<'QUICK' | 'GULLY' | 'PROFESSIONAL'>('QUICK');
  const [matchSubtype, setMatchSubtype] = useState('LIMITED OVERS');
  const [overs, setOvers] = useState<number | string>(settings.defaultOvers);
  const [oversPerBowler, setOversPerBowler] = useState<number | string>(Math.ceil(settings.defaultOvers / 5));
  const [playersPerTeam, setPlayersPerTeam] = useState<number | string>(settings.defaultSquadSize);

  const [cityTown, setCityTown] = useState('');
  const [groundName, setGroundName] = useState('');
  const [matchDateTime, setMatchDateTime] = useState(new Date().toISOString().slice(0, 16));

  // Form State: PowerPlay Config
  const [showPowerPlayConfig, setShowPowerPlayConfig] = useState(false);
  const [powerPlays, setPowerPlays] = useState<{start: number | '', end: number | ''}[]>([{ start: 1, end: 6 }]);

  // Form State: Advanced Pitch, Ball, Officials
  const [pitchType, setPitchType] = useState('TURF');
  const [ballType, setBallType] = useState('TENNIS');
  const [officials, setOfficials] = useState<string[]>([]);

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
      setOvers(5);
      setPlayersPerTeam(11);
      setCityTown('Street');
      setGroundName('');
    } else if (matchType === 'GULLY') {
      setOvers(10);
      setPlayersPerTeam(8);
      setCityTown('Local');
      setGroundName('Gully Ground');
    } else if (matchType === 'PROFESSIONAL') {
      setOvers(20);
      setOversPerBowler(4);
      setPlayersPerTeam(11);
      setCityTown('');
      setGroundName('');
    }
  }, [matchType]);

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!team1Id) return setError('Please select Team A');
      const pCount = typeof playersPerTeam === 'number' ? playersPerTeam : parseInt(String(playersPerTeam)) || 11;
      if (team1XI.length === 0 || team1XI.length > pCount) return setError(`${team1Name} must select between 1 and ${pCount} players for the Playing XI.`);
      if (!team1Captain) return setError(`Please declare Captain for ${team1Name}.`);
      if (team1XI.length > 1 && !team1Vc) return setError(`Please declare Vice Captain for ${team1Name}.`);
      if (!team1Wk) return setError(`Please declare Wicket-Keeper for ${team1Name}.`);
      setStep(3);
    } else if (step === 3) {
      if (!team2Id) return setError('Please select Team B');
      if (team1Id === team2Id) return setError('A team cannot play against itself');
      const pCount = typeof playersPerTeam === 'number' ? playersPerTeam : parseInt(String(playersPerTeam)) || 11;
      if (team2XI.length === 0 || team2XI.length > pCount) return setError(`${team2Name} must select between 1 and ${pCount} players for the Playing XI.`);
      if (!team2Captain) return setError(`Please declare Captain for ${team2Name}.`);
      if (team2XI.length > 1 && !team2Vc) return setError(`Please declare Vice Captain for ${team2Name}.`);
      if (!team2Wk) return setError(`Please declare Wicket-Keeper for ${team2Name}.`);
      setStep(4);
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

      const combinedVenue = [groundName, cityTown].filter(Boolean).join(', ');

      const payload = {
        team1Id,
        team2: team2Id,
        format: matchType === 'QUICK' || matchType === 'GULLY' ? 'CUSTOM' : matchSubtype.toUpperCase().replace(' ', '_'),
        matchType: matchType === 'PROFESSIONAL' ? 'CUSTOM' : matchType,
        pitchType,
        ballType,
        overs: typeof overs === 'number' ? overs : (parseInt(String(overs)) || 5),
        venue: combinedVenue || 'Local Ground',
        gullyRules: matchType === 'GULLY' ? finalGullyRules : undefined,
        powerPlays: showPowerPlayConfig && powerPlays.length > 0 ? powerPlays : undefined,
        startTime: new Date(matchDateTime).toISOString()
      };

      const data = await MatchService.createMatch(payload);
      const newMatchId = data.id || data.match?.id;

      if (!newMatchId) {
        throw new Error('Match ID missing from response');
      }

      // 2. Patch Playing XI
      await MatchService.updateMatch(newMatchId, {
        team1PlayingXI: team1XI,
        team2PlayingXI: team2XI
      });

      // 2.5 Update Squad Roles via Teams API
      await Promise.allSettled([
        apiClient.patch(`/teams/${team1Id}/squad`, {
          playerIds: team1XI,
          roles: {
            captainId: team1Captain,
            viceCaptainId: team1Vc,
            wicketKeeperId: team1Wk
          }
        }),
        apiClient.patch(`/teams/${team2Id}/squad`, {
          playerIds: team2XI,
          roles: {
            captainId: team2Captain,
            viceCaptainId: team2Vc,
            wicketKeeperId: team2Wk
          }
        })
      ]);

      // 3. Dispatch Match Toss Command
      await MatchService.recordToss(newMatchId, tossWinnerId, tossDecision);

      // 4. Set match to LIVE instantly so it shows in the active dashboard
      await MatchService.updateMatch(newMatchId, {
        status: 'LIVE'
      });

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
    <div className="py-4 md:py-6 w-full max-w-[1000px] mx-auto relative px-2 sm:px-4 flex flex-col min-h-[calc(100vh-8rem)]">

      {/* CINEMATIC HEADER */}
      <div className="mb-3 sm:mb-6 w-full flex flex-col md:flex-row md:items-end justify-between gap-2 sm:gap-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-emerald-400 font-bold uppercase tracking-widest text-xs mb-3 transition-colors group">
            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all">
              <ArrowLeft size={14} />
            </div>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-clash text-white tracking-tighter uppercase mb-1">
            Create <span className="text-emerald-500 italic drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]">Match</span>
          </h1>
          <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs md:text-sm">
            Setup squads, rules and the toss.
          </p>
        </motion.div>

        {/* 4-Step Progress Tracker */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 md:gap-3">
          {[
            { num: 1, label: 'Rules' },
            { num: 2, label: 'Squad A' },
            { num: 3, label: 'Squad B' },
            { num: 4, label: 'Toss' }
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div className={clsx(
                "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black text-sm md:text-lg transition-all duration-500 border-2",
                step === s.num ? "bg-emerald-500 text-zinc-950 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110" :
                  step > s.num ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-zinc-900 border-zinc-800 text-zinc-600"
              )}>
                {step > s.num ? <CheckCircle2 size={20} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> : s.num}
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
        <div className="bg-[#0a0a0a]/90 backdrop-blur-3xl p-3 sm:p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-white/5 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] flex-1 flex flex-col overflow-visible overflow-y-auto custom-scrollbar">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="flex-1 relative z-10">
            <AnimatePresence mode="wait">

              {/* STEP 1: SETTINGS & MATCH RULES */}
              {step === 1 && (
                <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-xl sm:text-2xl font-black font-clash text-white uppercase tracking-tighter flex items-center gap-3 mb-4 md:mb-8">
                    <Settings2 className="text-emerald-500" size={20} /> Match Details
                  </h2>

                  <div className="space-y-3 sm:space-y-6 md:space-y-10">
                    {/* Match Type Cards */}
                    <div className="grid md:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
                      <div
                        onClick={() => setMatchType('QUICK')}
                        className={clsx(
                          "cursor-pointer p-2.5 sm:p-4 md:p-6 rounded-xl md:rounded-3xl border-2 transition-all duration-300 flex flex-row md:flex-col items-center text-left md:text-center gap-3 md:gap-4 group",
                          matchType === 'QUICK' ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] md:scale-105" : "bg-zinc-900/50 border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                        )}
                      >
                        <div className={clsx("w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full flex items-center justify-center transition-colors duration-300", matchType === 'QUICK' ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-500 group-hover:bg-emerald-500/20 group-hover:text-emerald-400")}>
                          <Zap size={20} className={matchType === 'QUICK' ? "fill-zinc-950" : ""} />
                        </div>
                        <div className="flex-1 md:w-full">
                          <h3 className={clsx("font-black font-clash text-lg md:text-xl uppercase tracking-tighter mb-0.5 md:mb-1 transition-colors", matchType === 'QUICK' ? "text-emerald-400" : "text-white")}>Quick</h3>
                          <p className="text-[10px] md:text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Instant Play</p>
                        </div>
                      </div>

                      <div
                        onClick={() => setMatchType('GULLY')}
                        className={clsx(
                          "cursor-pointer p-2.5 sm:p-4 md:p-6 rounded-xl md:rounded-3xl border-2 transition-all duration-300 flex flex-row md:flex-col items-center text-left md:text-center gap-3 md:gap-4 group",
                          matchType === 'GULLY' ? "bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] md:scale-105" : "bg-zinc-900/50 border-zinc-800 hover:border-amber-500/50 hover:bg-amber-500/5"
                        )}
                      >
                        <div className={clsx("w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full flex items-center justify-center transition-colors duration-300", matchType === 'GULLY' ? "bg-amber-500 text-amber-950" : "bg-zinc-800 text-zinc-500 group-hover:bg-amber-500/20 group-hover:text-amber-400")}>
                          <Swords size={20} />
                        </div>
                        <div className="flex-1 md:w-full">
                          <h3 className={clsx("font-black font-clash text-lg md:text-xl uppercase tracking-tighter mb-0.5 md:mb-1 transition-colors", matchType === 'GULLY' ? "text-amber-400" : "text-white")}>Gully Cricket</h3>
                          <p className="text-[10px] md:text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Street Rules</p>
                        </div>
                      </div>

                      <div
                        onClick={() => setMatchType('PROFESSIONAL')}
                        className={clsx(
                          "cursor-pointer p-2.5 sm:p-4 md:p-6 rounded-xl md:rounded-3xl border-2 transition-all duration-300 flex flex-row md:flex-col items-center text-left md:text-center gap-3 md:gap-4 group",
                          matchType === 'PROFESSIONAL' ? "bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)] md:scale-105" : "bg-zinc-900/50 border-zinc-800 hover:border-blue-500/50 hover:bg-blue-500/5"
                        )}
                      >
                        <div className={clsx("w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full flex items-center justify-center transition-colors duration-300", matchType === 'PROFESSIONAL' ? "bg-blue-500 text-blue-950" : "bg-zinc-800 text-zinc-500 group-hover:bg-blue-500/20 group-hover:text-blue-400")}>
                          <Settings2 size={20} />
                        </div>
                        <div className="flex-1 md:w-full">
                          <h3 className={clsx("font-black font-clash text-lg md:text-xl uppercase tracking-tighter mb-0.5 md:mb-1 transition-colors", matchType === 'PROFESSIONAL' ? "text-blue-400" : "text-white")}>Professional</h3>
                          <p className="text-[10px] md:text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Standard T20/ODI</p>
                        </div>
                      </div>
                    </div>

                    {/* Configuration Area */}
                    <div className="bg-zinc-900/30 rounded-2xl md:rounded-[2rem] p-3 sm:p-6 border border-white/5 shadow-inner min-h-[80px] md:min-h-[160px]">
                      <AnimatePresence mode="wait">
                        {matchType === 'QUICK' && (
                          <motion.div key="quick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-0 h-full flex flex-col justify-center">
                            <p className="text-zinc-400 text-[9px] md:text-xs font-bold uppercase tracking-widest mb-2 md:mb-4">Default settings for Quick Match</p>
                            <div className="flex justify-center gap-6 sm:gap-12">
                              <div>
                                <div className="text-3xl md:text-5xl font-black font-clash text-white">{settings.defaultOvers}</div>
                                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5 md:mt-1">Overs</div>
                              </div>
                              <div className="w-px bg-zinc-800" />
                              <div>
                                <div className="text-3xl md:text-5xl font-black font-clash text-white">{settings.defaultSquadSize}</div>
                                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5 md:mt-1">Players</div>
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

                        {matchType === 'PROFESSIONAL' && (
                          <motion.div key="professional" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 pt-2">
                            {/* Match Type Sub-selector */}
                            <div>
                              <label className="text-xs font-bold text-zinc-400 mb-3 block">Match Type</label>
                              <div className="flex flex-wrap gap-2">
                                {['LIMITED OVERS', 'TEST MATCH', 'THE HUNDRED', 'PAIR CRICKET', 'BOX CRICKET'].map(type => (
                                  <button
                                    key={type}
                                    onClick={() => setMatchSubtype(type)}
                                    className={clsx(
                                      "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                                      matchSubtype === type
                                        ? "bg-zinc-200 text-zinc-900 border-zinc-200 shadow-md"
                                        : "bg-zinc-800/50 text-zinc-400 border-zinc-800 hover:border-zinc-600"
                                    )}
                                  >
                                    {type}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 sm:gap-8">
                              <div>
                                <label className="text-[10px] text-zinc-400 mb-1 block">No. of Overs <span className="text-red-500">*</span></label>
                                <input type="number" min="1" value={overs} onChange={e => setOvers(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-emerald-500 pb-2 text-white outline-none transition-all font-medium text-base !bg-transparent" />
                              </div>
                              <div>
                                <label className="text-[10px] text-zinc-400 mb-1 block">Overs per Bowler</label>
                                <input type="number" min="1" value={oversPerBowler} onChange={e => setOversPerBowler(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-emerald-500 pb-2 text-white outline-none transition-all font-medium text-base !bg-transparent" />
                              </div>
                            </div>

                            {/* Power Play Configuration Section */}
                            <div>
                              <div 
                                className="flex justify-between items-center bg-zinc-900/50 p-3 mt-4 sm:mt-2 rounded-xl border border-white/5 cursor-pointer hover:border-emerald-500/30 transition-colors" 
                                onClick={() => setShowPowerPlayConfig(!showPowerPlayConfig)}
                              >
                                <div>
                                  <label className="text-[10px] sm:text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-0.5 cursor-pointer">Power Play Segments</label>
                                  <div className="text-[11px] text-zinc-500 font-medium">
                                    {powerPlays.length > 0 
                                      ? powerPlays.map((pp, i) => `P${i+1}: ${pp.start || '?'}-${pp.end || '?'}`).join('  |  ') 
                                      : 'No Power Plays configured.'}
                                  </div>
                                </div>
                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                  {showPowerPlayConfig ? 'Close ▼' : 'Edit ►'}
                                </div>
                              </div>

                              <AnimatePresence>
                                {showPowerPlayConfig && (
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                    <div className="col-span-1 sm:col-span-2 bg-black/40 rounded-xl p-4 border border-zinc-800/50 mt-2 shadow-inner">
                                      <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5"><Zap size={14} /> Configure Segments</h4>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setPowerPlays([...powerPlays, {start: '', end: ''}]); }} className="text-[9px] font-bold text-zinc-400 hover:text-white uppercase transition-colors">+ Add Segment</button>
                                      </div>
                                      <div className="space-y-2">
                                        {powerPlays.map((pp, idx) => (
                                          <div key={idx} className="flex gap-2 sm:gap-4 items-center">
                                            <span className="text-[10px] text-zinc-600 font-bold w-4 text-left">P{idx + 1}</span>
                                            <input 
                                              type="number" min="1" placeholder="Start" 
                                              value={pp.start} 
                                              onChange={(e) => {
                                                const newPp = [...powerPlays];
                                                newPp[idx].start = e.target.value === '' ? '' : parseInt(e.target.value);
                                                setPowerPlays(newPp);
                                              }} 
                                              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-2 py-2 text-white text-xs text-center focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-700" 
                                            />
                                            <span className="text-[10px] text-zinc-600 font-bold">-</span>
                                            <input 
                                              type="number" min="1" placeholder="End" 
                                              value={pp.end} 
                                              onChange={(e) => {
                                                const newPp = [...powerPlays];
                                                newPp[idx].end = e.target.value === '' ? '' : parseInt(e.target.value);
                                                setPowerPlays(newPp);
                                              }} 
                                              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-2 py-2 text-white text-xs text-center focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-700" 
                                            />
                                            <button type="button" onClick={() => {
                                              const newPp = [...powerPlays];
                                              newPp.splice(idx, 1);
                                              setPowerPlays(newPp);
                                            }} className="text-red-500 hover:text-red-400 p-2 bg-red-500/10 hover:bg-red-500/20 rounded transition-all">
                                              <X size={12} />
                                            </button>
                                          </div>
                                        ))}
                                        {powerPlays.length === 0 && <p className="text-[10px] text-zinc-500 italic text-center py-2">No power play segments defined.</p>}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <div>
                              <label className="text-[10px] text-zinc-400 mb-1 block">City / Town <span className="text-red-500">*</span></label>
                              <input type="text" value={cityTown} onChange={e => setCityTown(e.target.value)} className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-emerald-500 pb-2 text-white outline-none transition-all text-base !bg-transparent" />
                            </div>

                            <div>
                              <label className="text-[10px] text-zinc-400 mb-1 block">Ground <span className="text-red-500">*</span></label>
                              <input type="text" value={groundName} onChange={e => setGroundName(e.target.value)} className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-emerald-500 pb-2 text-white outline-none transition-all text-base !bg-transparent" />
                            </div>

                            <div>
                              <label className="text-[10px] text-zinc-400 mb-1 block">Date & Time</label>
                              <input type="datetime-local" value={matchDateTime} onChange={e => setMatchDateTime(e.target.value)} className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-emerald-500 pb-2 text-white outline-none transition-all text-base [color-scheme:dark] !bg-transparent" />
                            </div>

                            {/* Ball Type */}
                            <div className="pt-2">
                              <label className="text-xs font-bold text-zinc-400 mb-3 block">Ball Type <span className="text-red-500">*</span></label>
                              <div className="flex gap-4">
                                {['TENNIS', 'LEATHER', 'OTHER'].map(bType => (
                                  <div key={bType} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setBallType(bType)}>
                                    <div className={clsx(
                                      "w-12 h-12 rounded-full flex items-center justify-center border transition-all",
                                      ballType === bType ? "bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-zinc-900 border-zinc-800 group-hover:border-zinc-700"
                                    )}>
                                      {ballType === bType ? (
                                        <CheckCircle2 className="text-white w-6 h-6" />
                                      ) : (
                                        <div className={clsx("w-6 h-6 rounded-full border border-black/20 shadow-inner", bType === 'TENNIS' ? 'bg-[#cce525]' : bType === 'LEATHER' ? 'bg-[#c83232]' : 'bg-zinc-600')} />
                                      )}
                                    </div>
                                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest">{bType}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Pitch Type */}
                            <div className="pt-2">
                              <label className="text-xs font-bold text-zinc-400 mb-3 block">Pitch Type</label>
                              <div className="flex flex-wrap gap-2">
                                {['ROUGH', 'CEMENT', 'TURF', 'ASTROTURF', 'MATTING'].map(pType => (
                                  <button
                                    key={pType}
                                    onClick={() => setPitchType(pType)}
                                    className={clsx(
                                      "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                                      pitchType === pType
                                        ? "bg-emerald-500 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                        : "bg-zinc-800/50 text-zinc-400 border-zinc-800 hover:border-zinc-600"
                                    )}
                                  >
                                    {pType}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Match Officials */}
                            <div className="pt-2">
                              <label className="text-xs font-bold text-zinc-400 mb-3 block">Match Officials</label>
                              <div className="flex gap-4">
                                {['Umpires', 'Scorers', 'Others'].map(official => (
                                  <div key={official} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setOfficials(prev => prev.includes(official) ? prev.filter(o => o !== official) : [...prev, official])}>
                                    <div className={clsx(
                                      "w-12 h-12 rounded-full flex items-center justify-center border transition-all",
                                      officials.includes(official) ? "bg-zinc-200 border-zinc-200 text-zinc-950" : "bg-zinc-900 border-zinc-800 text-zinc-500 group-hover:border-zinc-700"
                                    )}>
                                      <ShieldAlert className="w-5 h-5 text-current opacity-80" />
                                    </div>
                                    <span className="text-[10px] text-zinc-400">{official}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: SQUAD A */}
              {step === 2 && (
                <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full max-w-2xl mx-auto w-full">
                  <div className="flex items-center justify-between mb-3 md:mb-6 flex-wrap gap-2 md:gap-4">
                    <h2 className="text-lg md:text-2xl font-black font-clash text-emerald-500 uppercase tracking-tighter flex items-center gap-2 md:gap-3">
                      <ShieldAlert className="w-5 h-5 md:w-6 md:h-6" /> Team 1 Selection
                    </h2>
                    {team1Id && (
                      <button onClick={() => setSelectingTeamFor('TEAM1')} className="text-[9px] md:text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 md:px-3 md:py-1.5 rounded flex items-center gap-1.5 md:gap-2 hover:bg-emerald-500/20 transition-colors uppercase tracking-widest">
                        <ArrowRightLeft className="w-3 h-3 md:w-4 md:h-4" /> Change Squad
                      </button>
                    )}
                  </div>

                  {!team1Id ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 md:py-20 mt-4 sm:mt-8 w-full">
                      <div className="flex flex-col items-center gap-3 md:gap-4">
                        <div 
                          className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-zinc-900 border-2 border-zinc-700 hover:border-emerald-500 hover:text-emerald-500 text-zinc-500 flex items-center justify-center cursor-pointer hover:scale-105 transition-all border-dashed"
                          onClick={() => setSelectingTeamFor('TEAM1')}
                        >
                          <Plus className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 stroke-[1.5]" />
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest">Select Team A</span>
                      </div>
                      <p className="text-zinc-500 text-xs md:text-sm text-center max-w-xs font-medium mt-6">Search and deploy a registered squad from your database.</p>
                      {teams.length === 0 && (
                        <Link href="/teams" className="mt-4 text-emerald-500 font-bold text-xs hover:underline uppercase tracking-widest">Or Create a New Squad First</Link>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col flex-1 min-h-[400px]">
                      {/* Team Header */}
                      <div className="flex items-center gap-2 md:gap-4 bg-zinc-900/40 p-2 md:p-4 rounded-xl md:rounded-2xl border border-white/5 mb-2 md:mb-4">
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black font-clash text-sm md:text-xl text-white shadow-inner bg-[#111622] border-2 border-emerald-500">
                          {team1Short}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm md:text-xl font-black text-white uppercase tracking-wider truncate pb-0">{team1Name}</h3>
                          <div className="h-1 md:h-1.5 w-full bg-zinc-800 rounded-full mt-1 overflow-hidden">
                             <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(team1XI.length / (typeof playersPerTeam === 'number' ? playersPerTeam : parseInt(String(playersPerTeam)) || 11)) * 100}%` }} />
                          </div>
                          <p className="text-zinc-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1"><span className="text-emerald-500">{team1XI.length}/{playersPerTeam}</span> Players Selected</p>
                        </div>
                      </div>

                      {/* Search Bar for Players */}
                      <div className="relative mb-2 md:mb-4">
                        <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-500 pointer-events-none" />
                        <input 
                          type="text"
                          placeholder="Search roster by name or role..."
                          value={team1PlayerSearch}
                          onChange={e => setTeam1PlayerSearch(e.target.value)}
                          className="w-full bg-[#0a0a0a] text-white font-bold placeholder:font-normal placeholder:text-zinc-600 rounded-lg md:rounded-xl pl-9 md:pl-10 pr-3 md:pr-4 py-2.5 md:py-3.5 outline-none focus:ring-2 focus:ring-emerald-500/30 border border-white/5 transition-all text-[11px] md:text-sm"
                        />
                      </div>

                      <div className="bg-zinc-900/30 p-1 md:p-3 rounded-xl md:rounded-2xl flex-1 border border-white/5 space-y-1.5 md:space-y-2 overflow-y-auto custom-scrollbar max-h-[45vh] overscroll-contain" data-lenis-prevent="true">
                        {team1?.players && team1.players.length > 0 ? team1.players
                          .filter((p: any) => p.name.toLowerCase().includes(team1PlayerSearch.toLowerCase()) || p.role.toLowerCase().includes(team1PlayerSearch.toLowerCase()))
                          .map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setTeam1XI(prev =>
                                prev.includes(p.id)
                                  ? prev.filter(id => id !== p.id)
                                  : prev.length < (typeof playersPerTeam === 'number' ? playersPerTeam : parseInt(String(playersPerTeam)) || 11) ? [...prev, p.id] : prev
                              );
                            }}
                            className={clsx(
                              "w-full text-left p-2 md:p-4 rounded-lg md:rounded-xl transition-all border group relative focus:outline-none focus:border-emerald-500/50 block scale-100 active:scale-[0.98]",
                              team1XI.includes(p.id) ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm" : "bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-black/80"
                            )}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="font-bold text-[11px] md:text-sm flex flex-col sm:flex-row sm:items-center sm:gap-2 truncate leading-tight">{p.name} <span className="text-[8px] md:text-[9px] text-zinc-600 font-medium uppercase tracking-widest mt-[1px] sm:mt-0 bg-white/5 px-1.5 md:px-2 py-[2px] md:py-0.5 rounded-full inline-block w-fit">{p.role === 'BATSMAN' ? '🏏 BAT' : p.role === 'BOWLER' ? '⚾ BOWL' : '🔥 ALL'}</span></span>
                              {team1XI.includes(p.id) && <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] ml-1.5 shrink-0" />}
                            </div>

                            {/* Role Selectors */}
                            {team1XI.includes(p.id) && (
                              <div className="mt-1.5 md:mt-3 flex flex-wrap gap-1.5 md:gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    if (team1Vc === p.id) setTeam1Vc(null);
                                    setTeam1Captain(team1Captain === p.id ? null : p.id);
                                  }}
                                  className={clsx("text-[8px] md:text-[9px] px-1.5 py-0.5 md:px-2 md:py-1 rounded font-black tracking-widest uppercase transition-colors border", team1Captain === p.id ? "bg-emerald-500 text-zinc-950 border-emerald-500" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-emerald-500 focus:border-emerald-500")}
                                >
                                  (C) Captain
                                </button>
                                <button
                                  onClick={() => {
                                    if (team1Captain === p.id) setTeam1Captain(null);
                                    setTeam1Vc(team1Vc === p.id ? null : p.id);
                                  }}
                                  className={clsx("text-[8px] md:text-[9px] px-1.5 py-0.5 md:px-2 md:py-1 rounded font-black tracking-widest uppercase transition-colors border", team1Vc === p.id ? "bg-emerald-500 text-zinc-950 border-emerald-500" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-emerald-500 focus:border-emerald-500")}
                                >
                                  (VC) Vice-Capt
                                </button>
                                <button
                                  onClick={() => {
                                    setTeam1Wk(team1Wk === p.id ? null : p.id);
                                  }}
                                  className={clsx("text-[8px] md:text-[9px] px-1.5 py-0.5 md:px-2 md:py-1 rounded font-black tracking-widest uppercase transition-colors border", team1Wk === p.id ? "bg-amber-500 text-amber-950 border-amber-500" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-amber-500 focus:border-amber-500")}
                                >
                                  (WK) Keeper
                                </button>
                              </div>
                            )}
                          </button>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                             <Search size={24} className="text-zinc-600 mb-2" />
                             <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">No players matching criteria.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 3: SQUAD B */}
              {step === 3 && (
                <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full max-w-2xl mx-auto w-full">
                  <div className="flex items-center justify-between mb-3 md:mb-6 flex-wrap gap-2 md:gap-4">
                    <h2 className="text-lg md:text-2xl font-black font-clash text-blue-500 uppercase tracking-tighter flex items-center gap-2 md:gap-3">
                      <ShieldAlert className="w-5 h-5 md:w-6 md:h-6" /> Team 2 Selection
                    </h2>
                    {team2Id && (
                      <button onClick={() => setSelectingTeamFor('TEAM2')} className="text-[9px] md:text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 md:px-3 md:py-1.5 rounded flex items-center gap-1.5 md:gap-2 hover:bg-blue-500/20 transition-colors uppercase tracking-widest">
                        <ArrowRightLeft className="w-3 h-3 md:w-4 md:h-4" /> Change Squad
                      </button>
                    )}
                  </div>

                  {!team2Id ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 md:py-20 mt-4 sm:mt-8 w-full">
                      <div className="flex flex-col items-center gap-3 md:gap-4">
                        <div 
                          className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-zinc-900 border-2 border-zinc-700 hover:border-blue-500 hover:text-blue-500 text-zinc-500 flex items-center justify-center cursor-pointer hover:scale-105 transition-all border-dashed"
                          onClick={() => setSelectingTeamFor('TEAM2')}
                        >
                          <Plus className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 stroke-[1.5]" />
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest">Select Team B</span>
                      </div>
                      <p className="text-zinc-500 text-xs md:text-sm text-center max-w-xs font-medium mt-6">Search and deploy the opponent squad from the database.</p>
                      {teams.length === 0 && (
                        <Link href="/teams" className="mt-4 text-blue-500 font-bold text-xs hover:underline uppercase tracking-widest">Or Create a New Squad First</Link>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col flex-1 min-h-[400px]">
                      {/* Team Header */}
                      <div className="flex items-center gap-2 md:gap-4 bg-zinc-900/40 p-2 md:p-4 rounded-xl md:rounded-2xl border border-white/5 mb-2 md:mb-4">
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black font-clash text-sm md:text-xl text-white shadow-inner bg-[#111622] border-2 border-blue-500">
                          {team2Short}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm md:text-xl font-black text-white uppercase tracking-wider truncate pb-0">{team2Name}</h3>
                          <div className="h-1 md:h-1.5 w-full bg-zinc-800 rounded-full mt-1 overflow-hidden">
                             <div className="h-full bg-blue-500 transition-all" style={{ width: `${(team2XI.length / (typeof playersPerTeam === 'number' ? playersPerTeam : parseInt(String(playersPerTeam)) || 11)) * 100}%` }} />
                          </div>
                          <p className="text-zinc-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1"><span className="text-blue-500">{team2XI.length}/{playersPerTeam}</span> Players Selected</p>
                        </div>
                      </div>

                      {/* Search Bar for Players */}
                      <div className="relative mb-2 md:mb-4">
                        <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-500 pointer-events-none" />
                        <input 
                          type="text"
                          placeholder="Search roster by name or role..."
                          value={team2PlayerSearch}
                          onChange={e => setTeam2PlayerSearch(e.target.value)}
                          className="w-full bg-[#0a0a0a] text-white font-bold placeholder:font-normal placeholder:text-zinc-600 rounded-lg md:rounded-xl pl-9 md:pl-10 pr-3 md:pr-4 py-2.5 md:py-3.5 outline-none focus:ring-2 focus:ring-blue-500/30 border border-white/5 transition-all text-[11px] md:text-sm"
                        />
                      </div>

                      <div className="bg-zinc-900/30 p-1 md:p-3 rounded-xl md:rounded-2xl flex-1 border border-white/5 space-y-1.5 md:space-y-2 overflow-y-auto custom-scrollbar max-h-[45vh] overscroll-contain" data-lenis-prevent="true">
                        {team2?.players && team2.players.length > 0 ? team2.players
                          .filter((p: any) => p.name.toLowerCase().includes(team2PlayerSearch.toLowerCase()) || p.role.toLowerCase().includes(team2PlayerSearch.toLowerCase()))
                          .map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setTeam2XI(prev =>
                                prev.includes(p.id)
                                  ? prev.filter(id => id !== p.id)
                                  : prev.length < (typeof playersPerTeam === 'number' ? playersPerTeam : parseInt(String(playersPerTeam)) || 11) ? [...prev, p.id] : prev
                              );
                            }}
                            className={clsx(
                              "w-full text-left p-2 md:p-4 rounded-lg md:rounded-xl transition-all border group relative focus:outline-none focus:border-blue-500/50 block scale-100 active:scale-[0.98]",
                              team2XI.includes(p.id) ? "bg-blue-500/10 border-blue-500 text-blue-400 shadow-sm" : "bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-black/80"
                            )}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="font-bold text-[11px] md:text-sm flex flex-col sm:flex-row sm:items-center sm:gap-2 truncate leading-tight">{p.name} <span className="text-[8px] md:text-[9px] text-zinc-600 font-medium uppercase tracking-widest mt-[1px] sm:mt-0 bg-white/5 px-1.5 md:px-2 py-[2px] md:py-0.5 rounded-full inline-block w-fit">{p.role === 'BATSMAN' ? '🏏 BAT' : p.role === 'BOWLER' ? '⚾ BOWL' : '🔥 ALL'}</span></span>
                              {team2XI.includes(p.id) && <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] ml-1.5 shrink-0" />}
                            </div>

                            {/* Role Selectors */}
                            {team2XI.includes(p.id) && (
                              <div className="mt-1.5 md:mt-3 flex flex-wrap gap-1.5 md:gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    if (team2Vc === p.id) setTeam2Vc(null);
                                    setTeam2Captain(team2Captain === p.id ? null : p.id);
                                  }}
                                  className={clsx("text-[8px] md:text-[9px] px-1.5 py-0.5 md:px-2 md:py-1 rounded font-black tracking-widest uppercase transition-colors border", team2Captain === p.id ? "bg-blue-500 text-zinc-950 border-blue-500" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-blue-500 focus:border-blue-500")}
                                >
                                  (C) Captain
                                </button>
                                <button
                                  onClick={() => {
                                    if (team2Captain === p.id) setTeam2Captain(null);
                                    setTeam2Vc(team2Vc === p.id ? null : p.id);
                                  }}
                                  className={clsx("text-[8px] md:text-[9px] px-1.5 py-0.5 md:px-2 md:py-1 rounded font-black tracking-widest uppercase transition-colors border", team2Vc === p.id ? "bg-blue-500 text-zinc-950 border-blue-500" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-blue-500 focus:border-blue-500")}
                                >
                                  (VC) Vice-Capt
                                </button>
                                <button
                                  onClick={() => {
                                    setTeam2Wk(team2Wk === p.id ? null : p.id);
                                  }}
                                  className={clsx("text-[8px] md:text-[9px] px-1.5 py-0.5 md:px-2 md:py-1 rounded font-black tracking-widest uppercase transition-colors border", team2Wk === p.id ? "bg-amber-500 text-amber-950 border-amber-500" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-amber-500 focus:border-amber-500")}
                                >
                                  (WK) Keeper
                                </button>
                              </div>
                            )}
                          </button>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                             <Search size={24} className="text-zinc-600 mb-2" />
                             <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">No players matching criteria.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 4: THE TOSS */}
              {step === 4 && (
                <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col justify-center max-w-2xl mx-auto">

                  <div className="text-center mb-4 md:mb-8 relative z-10 w-full mt-2">
                    <div className="w-12 h-12 md:w-20 md:h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mx-auto flex items-center justify-center mb-2 md:mb-4 shadow-[0_0_40px_rgba(245,158,11,0.4)]">
                      <Coins className="text-amber-950 w-6 h-6 md:w-10 md:h-10" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black font-clash text-white tracking-tighter uppercase mb-1 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">The Coin Toss</h2>
                  </div>

                  <div className="bg-zinc-950/80 backdrop-blur-3xl border border-zinc-800 rounded-2xl md:rounded-[2.5rem] p-3 md:p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden w-full max-w-[95%] mx-auto">
                    <div className={clsx("absolute top-0 w-full h-1/2 opacity-20 blur-[100px] transition-colors duration-1000", tossWinnerId ? (tossDecision === 'BAT' ? "bg-blue-500" : tossDecision === 'BOWL' ? "bg-emerald-500" : "bg-amber-500") : "bg-zinc-700")} />

                    <div className="relative z-10 space-y-3 md:space-y-6">
                      <div className="space-y-2 md:space-y-4">
                        <div className="grid grid-cols-2 gap-2 md:gap-6">
                          <button
                            onClick={() => setTossWinnerId(team1Id)}
                            className={clsx(
                              "relative py-3 px-2 md:py-6 md:px-4 rounded-xl md:rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center gap-2 md:gap-3 group overflow-hidden",
                              tossWinnerId === team1Id
                                ? "border-amber-500 bg-amber-500/10 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)] scale-[1.02] md:scale-105"
                                : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
                            )}
                          >
                            {tossWinnerId === team1Id && <motion.div layoutId="tossWinner" className="absolute inset-0 bg-amber-500/10" />}
                            <div className={clsx("w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center font-black text-sm md:text-xl font-clash", tossWinnerId === team1Id ? "bg-amber-500 text-amber-950" : "bg-zinc-800 text-white")}>
                              {team1Short}
                            </div>
                            <span className="font-bold text-center z-10 text-[11px] sm:text-xs md:text-base leading-tight mt-1">{team1Name}</span>
                          </button>

                          <button
                            onClick={() => setTossWinnerId(team2Id)}
                            className={clsx(
                              "relative py-3 px-2 md:py-6 md:px-4 rounded-xl md:rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center gap-2 md:gap-3 group overflow-hidden",
                              tossWinnerId === team2Id
                                ? "border-amber-500 bg-amber-500/10 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)] scale-[1.02] md:scale-105"
                                : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
                            )}
                          >
                            {tossWinnerId === team2Id && <motion.div layoutId="tossWinner" className="absolute inset-0 bg-amber-500/10" />}
                            <div className={clsx("w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center font-black text-sm md:text-xl font-clash", tossWinnerId === team2Id ? "bg-amber-500 text-amber-950" : "bg-zinc-800 text-white")}>
                              {team2Short}
                            </div>
                            <span className="font-bold text-center z-10 text-[11px] sm:text-xs md:text-base leading-tight mt-1">{team2Name}</span>
                          </button>
                        </div>
                      </div>

                      <div className={clsx("transition-all duration-700 space-y-3 md:space-y-6 pt-1 md:pt-2", !tossWinnerId ? "opacity-30 pointer-events-none blur-sm" : "opacity-100 blur-0")}>
                        <div className="flex items-center justify-center gap-2 md:gap-6 px-4">
                          <div className="h-[1px] md:h-[2px] w-full bg-gradient-to-r from-transparent to-zinc-800" />
                          <label className="text-[8px] md:text-[10px] whitespace-nowrap font-black text-zinc-500 uppercase tracking-[0.2em]">
                            {tossWinnerId ? <><span className="text-amber-400 mr-1 md:mr-2">{tossWinnerId === team1Id ? team1Short : team2Short}</span>ELECTED TO</> : "ELECTED TO"}
                          </label>
                          <div className="h-[1px] md:h-[2px] w-full bg-gradient-to-l from-transparent to-zinc-800" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 md:gap-6">
                          <button
                            onClick={() => setTossDecision('BAT')}
                            className={clsx(
                              "relative flex flex-col items-center justify-center gap-1.5 md:gap-3 py-3 md:py-6 rounded-xl md:rounded-[2rem] border-2 transition-all duration-300",
                              tossDecision === 'BAT' ? "border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.3)] scale-[1.02] md:scale-105" : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/icons/bat.png" alt="Bat" className={clsx("w-7 h-7 md:w-12 md:h-12 transition-all object-contain", tossDecision === 'BAT' ? "drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] scale-110 opacity-100" : "opacity-50 grayscale hover:grayscale-0 hover:opacity-80")} />
                            <span className="font-black font-clash text-sm md:text-2xl uppercase tracking-widest leading-none mt-1">Bat</span>
                          </button>
                          <button
                            onClick={() => setTossDecision('BOWL')}
                            className={clsx(
                              "relative flex flex-col items-center justify-center gap-1.5 md:gap-3 py-3 md:py-6 rounded-xl md:rounded-[2rem] border-2 transition-all duration-300",
                              tossDecision === 'BOWL' ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-[1.02] md:scale-105" : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/icons/ball.png" alt="Ball" className={clsx("w-7 h-7 md:w-12 md:h-12 transition-all object-contain", tossDecision === 'BOWL' ? "drop-shadow-[0_0_15px_rgba(16,185,129,0.6)] scale-110 opacity-100" : "opacity-50 grayscale hover:grayscale-0 hover:opacity-80")} />
                            <span className="font-black font-clash text-sm md:text-2xl uppercase tracking-widest leading-none mt-1">Bowl</span>
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

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-white text-zinc-950 px-6 py-3.5 md:px-10 md:py-5 rounded-full font-black uppercase tracking-widest text-[10px] md:text-sm flex items-center gap-2 md:gap-3 hover:bg-zinc-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  Verify <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="bg-emerald-500 text-zinc-950 px-8 py-3.5 md:px-12 md:py-5 rounded-full font-black uppercase tracking-widest text-[10px] md:text-sm flex items-center gap-2 md:gap-3 hover:bg-emerald-400 transition-all hover:scale-105 disabled:opacity-50 shadow-[0_0_40px_rgba(16,185,129,0.4)] relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                  {isSubmitting ? <><Loader2 className="w-4 h-4 md:w-6 md:h-6 animate-spin relative z-10" /> <span className="relative z-10 block translate-y-px">Simulating...</span></> : <><Play className="w-4 h-4 md:w-6 md:h-6 fill-zinc-950 relative z-10" /> <span className="relative z-10 block translate-y-px">Start Match</span></>}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Team Selection Full-Screen Modal */}
      <AnimatePresence>
        {selectingTeamFor && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center gap-2 md:gap-4 px-3 md:px-4 py-3 md:py-6 bg-zinc-900/50 border-b border-white/5 shadow-xl">
              <button 
                onClick={() => {
                  setSelectingTeamFor(null);
                  setTeamSearchQuery('');
                }} 
                className="p-1 md:p-2 -ml-1 md:-ml-2 rounded-full hover:bg-white/10 transition-colors"
                title="Close Modal"
              >
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </button>
              <h2 className="text-lg md:text-2xl font-black font-clash text-white uppercase tracking-tighter">
                Select {selectingTeamFor === 'TEAM1' ? 'Team A' : 'Team B'}
              </h2>
            </div>
            
            {/* Search Bar */}
            <div className="p-3 md:p-4 border-b border-white/5 bg-zinc-900/30">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-zinc-500 pointer-events-none" />
                <input 
                  type="text"
                  placeholder="Quick Search..."
                  value={teamSearchQuery}
                  onChange={e => setTeamSearchQuery(e.target.value)}
                  className="w-full bg-white text-zinc-900 font-bold placeholder:font-normal placeholder:text-zinc-500 rounded-lg md:rounded-xl pl-9 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-4 outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all border border-transparent shadow-inner text-sm md:text-base"
                />
              </div>
            </div>

            {/* List Array */}
            <div className="flex-1 overflow-y-auto px-3 md:px-4 py-3 md:py-8 custom-scrollbar space-y-1.5 md:space-y-2 bg-[#0a0a0a] max-w-4xl mx-auto w-full">
              {teams
                .filter(t => t.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) || (t.shortName && t.shortName.toLowerCase().includes(teamSearchQuery.toLowerCase())))
                .filter(t => selectingTeamFor === 'TEAM1' ? t.id !== team2Id : t.id !== team1Id) // Exclude opponent
                .map(team => (
                <button 
                  key={team.id}
                  onClick={() => {
                    if (selectingTeamFor === 'TEAM1') setTeam1Id(team.id);
                    else setTeam2Id(team.id);
                    setSelectingTeamFor(null);
                    setTeamSearchQuery('');
                  }}
                  className="w-full bg-zinc-900/40 rounded-lg md:rounded-xl p-2 md:p-3 flex items-center justify-between text-left hover:bg-zinc-800 transition-colors active:scale-95 duration-150 group border border-white/5 hover:border-white/10 focus:border-emerald-500 outline-none hover:shadow-lg"
                >
                  <div className="flex items-center gap-2 md:gap-4 overflow-hidden flex-1 min-w-0">
                    <div className="w-8 h-8 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black font-clash tracking-tighter text-[11px] md:text-xl text-white shadow-inner shrink-0 bg-[#111622] border-[1px] md:border-[1.5px] border-emerald-500/30 group-hover:border-emerald-500 transition-colors">
                      {team.shortName || team.name.substring(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h4 className="text-white font-black uppercase tracking-wide md:tracking-wider text-xs md:text-base group-hover:text-emerald-400 transition-colors truncate w-full text-left">{team.name}</h4>
                      <div className="flex flex-wrap items-center gap-x-1.5 md:gap-x-4 gap-y-[2px] md:gap-y-1 mt-0.5 md:mt-1 text-zinc-500 text-[8px] md:text-xs font-medium">
                        <span className="flex items-center gap-1 md:gap-1.5 bg-black/40 px-1.5 md:px-2 py-[2px] md:py-0.5 rounded-full whitespace-nowrap"><MapPin className="w-2.5 h-2.5 md:w-3 md:h-3" /> Local Stadium</span>
                        <span className="flex items-center gap-1 md:gap-1.5 bg-black/40 px-1.5 md:px-2 py-[2px] md:py-0.5 rounded-full whitespace-nowrap truncate"><UserSquare2 className="w-2.5 h-2.5 md:w-3 md:h-3" /> Capt: {team.players?.find(p => p.role === 'C')?.name || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Plus size={20} />
                  </div>
                </button>
              ))}
              
              {teams.filter(t => t.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) && (selectingTeamFor === 'TEAM1' ? t.id !== team2Id : t.id !== team1Id)).length === 0 && (
                 <div className="text-center py-20 md:py-32 flex flex-col items-center">
                   <Search className="w-10 h-10 md:w-12 md:h-12 text-zinc-800 mb-3 md:mb-4" />
                   <p className="text-zinc-600 font-bold tracking-widest uppercase text-xs md:text-sm">No Squads match criteria</p>
                 </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
