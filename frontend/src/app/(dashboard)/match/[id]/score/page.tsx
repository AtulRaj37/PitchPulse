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
import { PlayingXISelector } from '@/features/scorer/components/PlayingXISelector';
import { ShotSelectionModal } from '@/features/scorer/components/ShotSelectionModal';
import { WicketTypeModal } from '@/features/scorer/components/WicketTypeModal';
import { OverCompletionSummaryModal } from '@/features/scorer/components/OverCompletionSummaryModal';
import { BowlerAngleModal } from '@/features/scorer/components/BowlerAngleModal';
import { TimelineAuditManager } from '@/features/scorer/components/TimelineAuditManager';
import { PlayerSelectionModal } from '@/features/scorer/components/PlayerSelectionModal';

export default function MatchScorerPage() {
  const { id } = useParams();
  const matchId = Array.isArray(id) ? id[0] : id;
  
  const { 
    score, 
    strikerId,
    nonStrikerId,
    bowlerId,
    bowlerAngle,
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
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Advanced Scoring Modals Intents
  const [scoreIntent, setScoreIntent] = useState<{ runs: number, extras?: any } | null>(null);
  const [wicketIntent, setWicketIntent] = useState<boolean>(false);
  const [intentBowlerId, setIntentBowlerId] = useState<string | null>(null);
  const [dismissedOverEnd, setDismissedOverEnd] = useState<number | null>(null);

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

  const handleScoreBtn = (runs: number, extras?: any) => {
    if (!handleScoreActionCheck()) return;
    setScoreIntent({ runs, extras });
  };

  const executeScoreRuns = (data?: { shotArea?: any; shotType?: any; bowlerAngle?: any }) => {
    if (!scoreIntent) return;
    scoreRuns(scoreIntent.runs, { ...scoreIntent.extras, ...data });
    const num = scoreIntent.runs;
    const label = num === 4 || num === 6 ? `${num}` : `${num} RUN${num !== 1 ? 'S' : ''}`;
    triggerActionAnim(label);
    setScoreIntent(null);
  };

  const handleWicketBtn = () => {
    if (!handleScoreActionCheck()) return;
    setWicketIntent(true);
  };

  const executeWicket = (data: { wicketType: any; dismissalMode: any; fielderId?: string }) => {
    markWicket(data);
    triggerActionAnim('OUT');
    setWicketIntent(false);
  };

  const currentOverTimeline = score.timeline;

  // TWO DISTINCT UI STATES FOR ASSIGNMENTS:
  // 1. INITIAL SETUP: Complete blank slate
  const isInitialSetup = !loading && matchData && events.length === 0 && (!strikerId || !nonStrikerId || !bowlerId);
  
  // Find previous bowler to prevent consecutive overs
  const previousBowlerId = [...events].reverse().find(e => e.bowlerId)?.bowlerId || null;

  // 2. OVER COMPLETION MODAL: Over ended, need new Bowler
  const isOverCompletion = !loading && matchData && !isInitialSetup && !bowlerId && strikerId && nonStrikerId && score.overs > 0 && score.balls === 0 && dismissedOverEnd !== score.overs;

  // 3. ONGOING MATCH ASSIGNMENT: Batsman out, over ended (and dismissed modal), or both simultaneously
  const needsPlayerAssignment = !isInitialSetup && !loading && matchData && (!strikerId || !nonStrikerId || !bowlerId) && !isOverCompletion;

  // --- OVER COMPLETION SUMMARY AGGREGATOR ---
  const summaryBalls: any[] = [];
  let prevRuns = 0, prevWickets = 0, prevBalls = 0, prevMaidens = 0;
  let overRuns = 0, overWickets = 0, overExtras = 0;

  if (isOverCompletion) {
    const targetOver = score.overs - 1; 
    
    events.forEach(e => {
       const isExtras = !!(e.isWide || e.isNoBall || e.isBye || e.isLegBye);
       const isLegByeOrBye = e.isBye || e.isLegBye;
       const extraRun = (e.isWide || e.isNoBall) ? 1 : 0;
       const legal = !(e.isWide || e.isNoBall);

       if (e.bowlerId === previousBowlerId) {
          const runsConceded = (isLegByeOrBye ? 0 : e.value) + extraRun;
          prevRuns += runsConceded;
          if (e.type === 'WICKET') prevWickets += 1;
          if (legal) prevBalls += 1;
       }

       if (e.over === targetOver) {
          overRuns += (e.value + extraRun);
          if (e.type === 'WICKET') overWickets += 1;
          if (isExtras) overExtras += (extraRun || e.value);

          let label = e.value.toString();
          if (e.type === 'WICKET') label = 'W';
          if (e.isWide) label = `${e.value > 0 ? e.value : ''}Wd`;
          if (e.isNoBall) label = `${e.value > 0 ? e.value : ''}Nb`;
          if (e.isBye) label = `${e.value}B`;
          if (e.isLegBye) label = `${e.value}Lb`;

          summaryBalls.push({
            label,
            isWicket: e.type === 'WICKET',
            isBoundary: e.value === 4 || e.value === 6,
            isExtra: isExtras,
            extraType: isExtras ? (e.isWide ? 'WD' : e.isNoBall ? 'NB' : e.isBye ? 'B' : 'LB') : undefined
          });
       }
    });
    prevMaidens = Math.floor(prevBalls / 6) && prevRuns === 0 ? 1 : 0; 
  }

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

  const isFirstInnings = innings === 1;
  const battingTeam = isFirstInnings ? matchData?.team1 : matchData?.team2;
  const bowlingTeam = isFirstInnings ? matchData?.team2 : matchData?.team1;
  
  const battingXI = new Set(isFirstInnings ? (matchData?.team1PlayingXI || []) : (matchData?.team2PlayingXI || []));
  const bowlingXI = new Set(isFirstInnings ? (matchData?.team2PlayingXI || []) : (matchData?.team1PlayingXI || []));

  // Determine which players are already out so they cannot return to bat
  const dismissedPlayerIds = new Set(
    events
      .filter(e => e.type === 'WICKET')
      .map(e => e.batsmanId)
      .filter(Boolean)
  );

  const handlePlayingXISave = async (team1XI: string[], team2XI: string[]) => {
    try {
      await MatchService.updateMatch(matchId, { 
        team1PlayingXI: team1XI, 
        team2PlayingXI: team2XI 
      });
      setMatchData((prev: any) => ({
        ...prev,
        team1PlayingXI: team1XI,
        team2PlayingXI: team2XI
      }));
      toast.success('Playing XI locked successfully');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to lock Playing XI');
    }
  };

  const needsSquadSelection = !loading && matchData && (!matchData.team1PlayingXI || matchData.team1PlayingXI.length === 0 || !matchData.team2PlayingXI || matchData.team2PlayingXI.length === 0);

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

  if (needsSquadSelection) {
    return <PlayingXISelector matchData={matchData} onComplete={handlePlayingXISave} />;
  }

  return (
    <div className="flex flex-col w-full relative min-h-screen">
      
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

      <AnimatePresence>
        {scoreIntent && (
          <ShotSelectionModal 
            runsScored={scoreIntent.runs}
            strikerName={getPlayerName(strikerId)}
            onSave={executeScoreRuns}
            onCancel={() => setScoreIntent(null)}
          />
        )}
        {wicketIntent && (
          <WicketTypeModal
            strikerName={getPlayerName(strikerId)}
            nonStrikerName={getPlayerName(nonStrikerId)}
            fieldingTeamPlayers={bowlingTeam?.players || []}
            onSave={executeWicket}
            onCancel={() => setWicketIntent(false)}
          />
        )}

        {intentBowlerId && (
          <BowlerAngleModal
            bowlerName={getPlayerName(intentBowlerId)}
            onSave={(angle) => {
              setBowler(intentBowlerId, angle);
              setIntentBowlerId(null);
              if (isOverCompletion) setDismissedOverEnd(score.overs);
            }}
          />
        )}
      </AnimatePresence>

      {/* 0. Top Navigation Bar overlays the Header */}
      <div className="absolute top-4 left-4 md:top-5 md:left-5 z-[50] flex items-center justify-between pointer-events-auto">
        <Link href="/dashboard">
          <button className="flex items-center justify-center gap-1.5 text-zinc-300 hover:text-white transition-colors group text-[10px] font-black uppercase tracking-[0.15em] bg-[#0a0f1a]/80 hover:bg-[#0f172a] w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2.5 rounded-xl border border-white/10 backdrop-blur-xl shadow-xl">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden md:inline">Back</span>
          </button>
        </Link>
      </div>

      {/* 1. Header Area aligned perfectly to Desktop Grid Width */}
      <div className="w-full max-w-[1200px] mx-auto mb-0 md:mb-8 px-0 md:px-8 xl:px-0">
        <MatchScoreHeader 
          battingTeamName={battingTeam?.name || 'Waiting...'}
          bowlingTeamName={bowlingTeam?.name || 'Waiting...'}
          battingTeamScore={{ runs: score.runs, wickets: score.wickets, overs: score.overs, balls: score.balls }}
          target={target}
          innings={innings}
          totalOvers={matchData.overs}
          status={isPaused ? 'PAUSED' : matchData.status}
          tossWinnerName={matchData.toss?.winnerTeamId === matchData.team1Id ? matchData.team1?.name : matchData.team2?.name}
          tossDecision={matchData.toss?.decision}
          isFreeHit={score.isFreeHit}
        />
      </div>

      {/* 2. Main Content Grid - Centralized and elegant on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-10 max-w-[1200px] mx-auto w-full relative z-10 px-0 md:px-8 xl:px-0">
        {/* Left Column: Player Context */}
        <div className="lg:col-span-5 flex flex-col gap-0 lg:gap-6">
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
            timeline={currentOverTimeline}
          />
          
          {/* Desktop Only: Shift Timeline to Left Column to balance heights and fix gap */}
          <div className="hidden lg:block">
            <OverTimeline timeline={currentOverTimeline} />
          </div>
        </div>

        {/* Right Column: Scoring Interface */}
        <div className="lg:col-span-7 flex flex-col gap-0 md:gap-4 relative pt-0">
          
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

          <div className={clsx("flex flex-col gap-0 md:gap-3 transition-all duration-300", isPaused && "opacity-50 pointer-events-none")}>
            
            {/* Mobile Command Pad (Inline Flow) */}
            <div className="w-full flex flex-col shadow-none md:gap-3 pb-2 md:pb-0 bg-transparent rounded-none mt-0 relative overflow-hidden">
              
              <div className="relative z-10">
                <ScoreActionPad 
                gullyRules={gullyRules}
                onScore={handleScoreBtn} 
                onWicket={handleWicketBtn} 
              />
            
              <div className="bg-[#050505] md:bg-transparent border-t-0 md:border-none p-1 md:p-0 mt-0 md:mt-0 rounded-none flex justify-center">
                <ScorerControlBar 
                  onUndo={() => {
                    if (events.length > 0) {
                      undo();
                      toast.info('Reverted last delivery');
                    } else {
                      toast.error('Nothing to undo');
                    }
                  }}
                  onAudit={() => setIsAuditModalOpen(true)}
                  onEndInnings={() => {
                    endInnings();
                    toast.success('Innings Ended');
                  }}
                  onPause={() => setIsPaused(true)}
                  innings={innings}
                />
              </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2 mt-1 md:gap-4 md:mt-0 pb-6 md:pb-0">
            <Link href={`/match/${matchId}/scorecard`} className="w-full">
               <button className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#151a28] border-y border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors font-bold uppercase tracking-widest text-xs shadow-md">
                 <Activity size={16} />
                 View Full Scorecard & Commentary
               </button>
            </Link>
          </div>

        </div>
      </div>
      
      {isOverCompletion && (
        <OverCompletionSummaryModal
          overNumber={score.overs}
          bowlerName={getPlayerName(previousBowlerId)}
          balls={summaryBalls}
          runsThisOver={overRuns}
          wicketsThisOver={overWickets}
          extrasThisOver={overExtras}
          teamScore={`${score.runs}/${score.wickets}`}
          striker={{ name: getPlayerName(strikerId), runs: score.strikerRuns, balls: score.strikerBalls }}
          nonStriker={{ name: getPlayerName(nonStrikerId), runs: score.nonStrikerRuns, balls: score.nonStrikerBalls }}
          bowlerStats={{ overs: Math.floor(prevBalls/6), maidens: prevMaidens, runs: prevRuns, wickets: prevWickets, balls: prevBalls }}
          onStartNextOver={() => setDismissedOverEnd(score.overs)}
          onContinueThisOver={() => setDismissedOverEnd(score.overs)}
        />
      )}

      {isAuditModalOpen && (
        <TimelineAuditManager 
          matchId={matchId as string}
          onClose={() => setIsAuditModalOpen(false)}
        />
      )}

      {/* Dynamic Player Selection UI */}
      <PlayerSelectionModal
        isOpen={(needsPlayerAssignment || isInitialSetup) && !intentBowlerId}
        type={!strikerId ? 'STRIKER' : (!nonStrikerId ? 'NON_STRIKER' : (!bowlerId ? 'BOWLER' : null))}
        players={
          !strikerId ? (battingTeam?.players?.filter((p: any) => battingXI.has(p.id) && !dismissedPlayerIds.has(p.id) && p.id !== nonStrikerId) || []) :
          !nonStrikerId ? (battingTeam?.players?.filter((p: any) => battingXI.has(p.id) && !dismissedPlayerIds.has(p.id) && p.id !== strikerId) || []) :
          !bowlerId ? (bowlingTeam?.players?.filter((p: any) => bowlingXI.has(p.id) && p.id !== previousBowlerId) || []) : []
        }
        onSelect={(id) => {
          if (!strikerId) setStriker(id);
          else if (!nonStrikerId) setPlayers(strikerId || '', id, bowlerId, bowlerAngle);
          else if (!bowlerId) setIntentBowlerId(id);
        }}
      />

      {/* Sequential Bowler Angle UI */}
      <AnimatePresence>
        {intentBowlerId && (
          <BowlerAngleModal
            bowlerName={getPlayerName(intentBowlerId)}
            onSave={(angle) => {
              setBowler(intentBowlerId, angle);
              setIntentBowlerId(null);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
