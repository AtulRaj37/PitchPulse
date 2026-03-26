'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useScorerStore } from '@/features/scorer/scorer.store';
import { MatchService } from '@/services/api/match.service';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';

// New Modular UI Components
import { MatchScoreHeader } from '@/features/scorer/components/MatchScoreHeader';
import { BatsmanBowlerPanel } from '@/features/scorer/components/BatsmanBowlerPanel';
import { OverTimeline } from '@/features/scorer/components/OverTimeline';
import { ScoreActionPad } from '@/features/scorer/components/ScoreActionPad';
import { ScorerControlBar } from '@/features/scorer/components/ScorerControlBar';

export default function MatchScorerPage() {
  const { id } = useParams();
  const matchId = Array.isArray(id) ? id[0] : id;
  
  const { 
    score, 
    strikerId,
    nonStrikerId,
    bowlerId,
    innings,
    target,
    events,
    gullyRules,
    setMatchId, 
    setPlayers,
    setBowler,
    setStriker,
    scoreRuns, 
    markWicket, 
    undo,
    endInnings,
    initializeFromEvents
  } = useScorerStore();

  const [lastAction, setLastAction] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Modal State
  const [selectedStriker, setSelectedStriker] = useState('');
  const [selectedNonStriker, setSelectedNonStriker] = useState('');
  const [selectedBowler, setSelectedBowler] = useState('');

  // Sync Modal local state with store
  useEffect(() => {
    setSelectedStriker(strikerId || '');
    setSelectedNonStriker(nonStrikerId || '');
    setSelectedBowler(bowlerId || '');
  }, [strikerId, nonStrikerId, bowlerId]);

  // Initialize Match Store & Fetch Roster
  useEffect(() => {
    if (matchId) {
      setMatchId(matchId);
      MatchService.getMatchById(matchId)
        .then(data => {
          setMatchData(data);
          
          // PHASE 17 REHYDRATION
          initializeFromEvents(data);
          localStorage.setItem('pitchpulse_last_match', matchId);
          
          setLoading(false);
        })
        .catch(err => {
          toast.error('Failed to load match details');
          setLoading(false);
        });
    }
  }, [matchId, setMatchId, initializeFromEvents]);

  // Keyboard Shortcuts (1, 2, 4, 6, W, Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (isPaused) return;

      const key = e.key.toUpperCase();
      
      if (key === 'Z') {
        if (events.length > 0) {
          undo();
          toast.info('Reverted last delivery');
        } else {
          toast.error('Nothing to undo');
        }
      } else if (['0', '1', '2', '3', '4', '5', '6'].includes(key)) {
        scoreRuns(parseInt(key));
        triggerActionAnim(key);
      } else if (key === 'W') {
        markWicket();
        triggerActionAnim('OUT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scoreRuns, markWicket, undo, events, isPaused]);

  // Temporary action flash
  const triggerActionAnim = (action: string) => {
    setLastAction(action);
    setTimeout(() => setLastAction(null), 1000);
  };

  const handleScoreBtn = (num: number) => {
    if (!handleScoreActionCheck()) return;
    scoreRuns(num);
    const label = num === 4 || num === 6 ? `${num}` : `${num} RUN${num !== 1 ? 'S' : ''}`;
    triggerActionAnim(label);
  };

  const handleWicketBtn = () => {
    if (!handleScoreActionCheck()) return;
    markWicket();
    triggerActionAnim('OUT');
  };

  const currentOverTimeline = score.timeline;

  // TWO DISTINCT UI STATES FOR ASSIGNMENTS:
  // 1. INITIAL SETUP: Complete blank slate
  const isInitialSetup = !loading && matchData && events.length === 0 && (!strikerId || !nonStrikerId || !bowlerId);
  // 2. ONGOING MATCH ASSIGNMENT: Batsman out, over ended, or both simultaneously
  const needsPlayerAssignment = !isInitialSetup && !loading && matchData && (!strikerId || !nonStrikerId || !bowlerId);

  // Find previous bowler to prevent consecutive overs
  const previousBowlerId = [...events].reverse().find(e => e.bowlerId)?.bowlerId || null;

  const handleScoreActionCheck = () => {
    if (isPaused) return false;
    if (!strikerId || !nonStrikerId || !bowlerId) {
      toast.error('Please assign all active players on the left panel to proceed');
      return false;
    }
    if (strikerId === nonStrikerId) {
      toast.error('Striker and Non-Striker cannot be the same');
      return false;
    }
    return true;
  };


  const getPlayerName = (pId: string | null) => {
    if (!pId || !matchData) return 'Select Player...';
    const all = [...(matchData.team1?.players || []), ...(matchData.team2?.players || [])];
    return all.find(p => p.id === pId)?.name || 'Unknown';
  };

  const battingTeam = matchData?.team1;
  const bowlingTeam = matchData?.team2;

  // Determine which players are already out so they cannot return to bat
  const dismissedPlayerIds = new Set(
    events
      .filter(e => e.type === 'WICKET')
      .map(e => e.batsmanId)
      .filter(Boolean)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-emerald-500 font-bold uppercase tracking-widest text-xs animate-pulse">Rehydrating Match State...</p>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Activity size={32} />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Match Unavailable</h2>
        <p className="text-zinc-500 mb-6 max-w-sm mx-auto">This match may have been deleted or the connection was lost. Return to the dashboard.</p>
        <Link href="/dashboard">
          <button className="bg-emerald-500 text-zinc-950 px-6 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors">
            Back to Dashboard
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20 max-w-5xl mx-auto w-full relative">
      
      {/* Cinematic Action Flash Overlay */}
      <AnimatePresence>
        {lastAction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.2, filter: 'blur(15px)' }}
            transition={{ type: "spring", damping: 15, stiffness: 250 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            />
            <h1 className={clsx(
              "text-[120px] sm:text-[200px] font-black font-clash italic leading-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative z-10 text-transparent bg-clip-text bg-gradient-to-br text-center",
              lastAction === 'OUT' ? "from-red-400 to-rose-700" :
              ['4', '6'].includes(lastAction) ? "from-emerald-300 to-teal-600" :
              "from-white to-zinc-500"
            )}>
              {lastAction}
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 0. Top Navigation Bar */}
      <div className="flex items-center justify-between w-full mb-2">
        <Link href="/dashboard">
          <button className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors group text-xs sm:text-sm font-bold uppercase tracking-widest bg-zinc-900/50 hover:bg-emerald-500/10 px-4 py-2 rounded-xl border border-zinc-800 hover:border-emerald-500/50 backdrop-blur-sm">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Command Center
          </button>
        </Link>
      </div>

      {/* 1. Header Area */}
      <MatchScoreHeader 
        battingTeamName={battingTeam?.name || 'Waiting...'}
        bowlingTeamName={bowlingTeam?.name || 'Waiting...'}
        battingTeamScore={{ runs: score.runs, wickets: score.wickets, overs: score.overs, balls: score.balls }}
        target={target}
        innings={innings}
        totalOvers={matchData.overs}
        status={isPaused ? 'PAUSED' : matchData.status}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full relative z-10">
        {/* Left Column: Player Context */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <BatsmanBowlerPanel 
            striker={{ 
              id: strikerId, 
              name: getPlayerName(strikerId), 
              runs: score.strikerRuns, 
              balls: score.strikerBalls,
              fours: score.striker4s,
              sixes: score.striker6s
            }}
            nonStriker={{ 
              id: nonStrikerId, 
              name: getPlayerName(nonStrikerId), 
              runs: score.nonStrikerRuns, 
              balls: score.nonStrikerBalls,
              fours: score.nonStriker4s,
              sixes: score.nonStriker6s
            }}
            bowler={{ 
              id: bowlerId, 
              name: getPlayerName(bowlerId), 
              overs: Math.floor(score.bowlerBalls / 6), 
              balls: score.bowlerBalls % 6, 
              maidens: score.bowlerMaidens,
              runs: score.bowlerRuns, 
              wickets: score.bowlerWickets 
            }}
          />

          {/* Premium Player Assigment Hub */}
          {(needsPlayerAssignment || isInitialSetup) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-950/80 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)] relative overflow-hidden"
            >
              {/* Alert Glow */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                  <Activity size={20} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-amber-500 font-display font-black uppercase tracking-widest text-lg leading-none">Action Required</h3>
                  <p className="text-zinc-400 text-xs font-bold">{isInitialSetup ? "Select opening players to start the match." : "Assign new players to resume scoring."}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-8">
                
                {/* STRIKER CHIPS */}
                {(!strikerId) && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2 bg-zinc-900 border border-zinc-800 w-fit px-3 py-1.5 rounded-lg shadow-sm">
                       Select Striker
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {battingTeam?.players?.filter((p: any) => !dismissedPlayerIds.has(p.id) && p.id !== nonStrikerId).map((p: any) => (
                        <button 
                          key={p.id}
                          onClick={() => setStriker(p.id)}
                          className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-zinc-300 py-3 px-3 rounded-xl text-sm font-bold transition-all text-left flex items-center gap-3 group overflow-hidden relative shadow-sm"
                        >
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-colors z-10">{p.name.slice(0,2).toUpperCase()}</div>
                          <span className="truncate z-10 group-hover:text-white transition-colors">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* NON-STRIKER CHIPS */}
                {(!nonStrikerId) && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2 bg-zinc-900 border border-zinc-800 w-fit px-3 py-1.5 rounded-lg shadow-sm">
                       Select Non-Striker
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {battingTeam?.players?.filter((p: any) => !dismissedPlayerIds.has(p.id) && p.id !== strikerId).map((p: any) => (
                        <button 
                          key={p.id}
                          onClick={() => setPlayers(strikerId, p.id, bowlerId)}
                          className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-zinc-300 py-3 px-3 rounded-xl text-sm font-bold transition-all text-left flex items-center gap-3 group overflow-hidden relative shadow-sm"
                        >
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-colors z-10">{p.name.slice(0,2).toUpperCase()}</div>
                          <span className="truncate z-10 group-hover:text-white transition-colors">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* BOWLER CHIPS */}
                {(!bowlerId) && (
                  <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 w-fit px-3 py-1.5 rounded-lg shadow-sm">
                       Select New Bowler
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {bowlingTeam?.players?.filter((p: any) => p.id !== previousBowlerId).map((p: any) => (
                        <button 
                          key={p.id}
                          onClick={() => setBowler(p.id)}
                          className="bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 hover:bg-blue-500/10 text-zinc-300 py-3 px-3 rounded-xl text-sm font-bold transition-all text-left flex items-center gap-3 group overflow-hidden relative shadow-sm"
                        >
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white group-hover:bg-blue-500 group-hover:text-white transition-colors z-10">{p.name.slice(0,2).toUpperCase()}</div>
                          <span className="truncate z-10 group-hover:text-white transition-colors">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Actions & Timeline */}
        <div className="lg:col-span-7 flex flex-col gap-6 relative">
          
          <AnimatePresence>
            {isPaused && (
              <motion.div 
                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl bg-[#0e1424]/60 border border-white/10"
              >
                <div className="bg-[#1a2333] p-8 rounded-2xl border border-white/10 flex flex-col items-center shadow-2xl">
                  <Activity className="w-12 h-12 text-zinc-500 mb-4 animate-pulse" />
                  <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">Match Paused</h2>
                  <p className="text-zinc-500 text-sm mb-6 max-w-[200px] text-center">
                    Scoring actions are locked until the match is resumed.
                  </p>
                  <button 
                    onClick={() => setIsPaused(false)}
                    className="w-full bg-emerald-500 text-zinc-950 font-black uppercase tracking-widest py-3 rounded-xl hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                  >
                    Resume Match
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={clsx("flex flex-col gap-6 transition-all duration-300", isPaused && "opacity-50 pointer-events-none")}>
            <OverTimeline timeline={currentOverTimeline} />
            
            <ScoreActionPad 
              gullyRules={gullyRules}
              onScore={(runs, extras) => {
                if (!handleScoreActionCheck()) return;
                scoreRuns(runs, extras);
              }} 
              onWicket={() => {
                if (!handleScoreActionCheck()) return;
                markWicket();
              }} 
            />
            
            <ScorerControlBar 
              onUndo={() => {
                if (events.length > 0) {
                  undo();
                  toast.info('Reverted last delivery');
                } else {
                  toast.error('Nothing to undo');
                }
              }}
              onEndInnings={() => {
                endInnings();
                toast.success('Innings Ended');
              }}
              onPause={() => setIsPaused(true)}
              innings={innings}
            />
          </div>
          
          <div className="flex justify-center mt-2">
            <Link href={`/match/${matchId}/scorecard`} className="w-full">
               <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#151a28] border border-white/5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors font-bold uppercase tracking-widest text-sm shadow-md">
                 <Activity size={16} />
                 View Full Scorecard & Commentary
               </button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
