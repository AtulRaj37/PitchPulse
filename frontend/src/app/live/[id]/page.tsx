'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { socketService } from '@/services/socket.service';
import { apiClient } from '@/services/api/api.client';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ShieldAlert, Radio, Activity, Target } from 'lucide-react';
import clsx from 'clsx';

interface Commentary { id: string; ballNumber: number; text: string; type: string; }

export default function LiveScoreboardPage() {
  const { id } = useParams();
  const matchId = Array.isArray(id) ? id[0] : id;

  const [score, setScore] = useState({ 
    runs: 0, wickets: 0, overs: 0, balls: 0,
    strikerRuns: 0, strikerBalls: 0, 
    nonStrikerRuns: 0, nonStrikerBalls: 0,
    bowlerRuns: 0, bowlerWickets: 0, bowlerBalls: 0,
    timeline: [] as string[]
  });
  
  const [commentaries, setCommentaries] = useState<Commentary[]>([]);
  const [isWicketFlashing, setIsWicketFlashing] = useState(false);
  const [boundaryGlow, setBoundaryGlow] = useState(false);
  const [socketConnected, setSocketConnected] = useState(true);
  
  const scoreRef = useRef(score);
  const runDisplayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // 1. Initial State Load
    const fetchInitial = async () => {
      try {
        const res = await apiClient.get(`/matches/${matchId}`);
        if (res.data?.data) {
           // Mapping API structure to state. Adjust paths based on actual API payload.
           const match = res.data.data;
           const s = match.score || { runs: 0, wickets: 0, overs: 0, balls: 0, timeline: [] };
           setScore(prev => ({ ...prev, ...s }));
           scoreRef.current = { ...scoreRef.current, ...s };
        }
      } catch (err) {
        console.error('Failed to fetch initial score');
      }
    };
    fetchInitial();

    // 2. Connect and join match room
    socketService.connect();
    socketService.joinMatch(matchId as string);

    // 3. Fallback Polling (Every 10s if socket drops)
    const interval = setInterval(async () => {
      if (!socketConnected) {
        fetchInitial();
      }
    }, 10000);

    // 4. Subscriptions
    const unsubScore = socketService.subscribeToScoreUpdates((data: any) => {
      setSocketConnected(true);
      
      // Wicket flash
      if (data.wickets > scoreRef.current.wickets) {
        setIsWicketFlashing(true);
        setTimeout(() => setIsWicketFlashing(false), 2500);
      }
      
      // Boundary glow
      const runsDiff = data.runs - scoreRef.current.runs;
      if (runsDiff === 4 || runsDiff === 6) {
        setBoundaryGlow(true);
        setTimeout(() => setBoundaryGlow(false), 3000);
      }
      
      // GSAP Count up effect for runs
      if (data.runs > scoreRef.current.runs && runDisplayRef.current) {
        const obj = { val: scoreRef.current.runs };
        gsap.to(obj, {
          val: data.runs,
          duration: 1.5,
          ease: "expo.out",
          onUpdate: () => {
            if (runDisplayRef.current) {
              runDisplayRef.current.innerText = Math.round(obj.val).toString();
            }
          }
        });
      }

      setScore(prev => ({ ...prev, ...data }));
      scoreRef.current = { ...scoreRef.current, ...data };
    });

    const unsubCommentary = socketService.subscribeToCommentary((data: any) => {
      setCommentaries(prev => [{
        id: Math.random().toString(),
        ballNumber: data.ballNumber || 0,
        text: data.text || 'Action occurred',
        type: data.type || 'NORMAL'
      }, ...prev].slice(0, 5));
    });

    return () => {
      clearInterval(interval);
      unsubScore();
      unsubCommentary();
      socketService.leaveMatch(matchId as string);
    };
  }, [matchId, socketConnected]);

  const currentRunRate = (score.runs / Math.max(1, (score.overs + score.balls / 6))).toFixed(2);

  return (
    <div className="min-h-screen bg-zinc-950 font-inter text-zinc-100 p-4 md:p-8 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Dynamic Background Studio Effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:64px_64px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/50 to-zinc-950" />
      
      <motion.div 
        animate={{ scale: boundaryGlow ? 1.2 : 1, opacity: boundaryGlow ? 0.3 : 0.05 }}
        transition={{ duration: 0.5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500 rounded-full blur-[150px] pointer-events-none"
      />

      {/* Wicket Flash Overlay */}
      <AnimatePresence>
        {isWicketFlashing && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-red-600/40 z-50 pointer-events-none flex items-center justify-center mix-blend-overlay"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1.2, opacity: 0.9, y: 0 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
            >
              <div className="text-[15rem] font-black font-clash text-red-500 tracking-tighter drop-shadow-[0_0_100px_rgba(239,68,68,0.8)]">WICKET</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-6xl space-y-6">
        
        {/* MATCH HEADER RIBBON */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800 rounded-2xl px-6 md:px-10 py-4 md:py-5 shadow-2xl"
        >
          <div className="flex items-center gap-4">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-red-900"></span>
            </span>
            <span className="font-bold tracking-[0.2em] text-red-500 text-lg">LIVE</span>
          </div>
          <div className="font-bold text-zinc-400 tracking-[0.2em] uppercase text-sm md:text-base">PitchPulse Broadcast</div>
          <div className="flex items-center gap-2">
            {!socketConnected && <span className="text-yellow-500 text-xs font-bold uppercase tracking-widest animate-pulse">Polling API...</span>}
          </div>
        </motion.div>

        {/* MAIN BROADCAST CARD */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
          className={clsx(
            "bg-zinc-900/80 backdrop-blur-3xl border border-zinc-800 rounded-[2.5rem] p-8 md:p-14 relative shadow-2xl overflow-hidden transition-all duration-1000",
            boundaryGlow ? "border-emerald-500/50 shadow-[0_0_100px_rgba(16,185,129,0.15)]" : "shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          )}
        >
          {/* Internal Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-stretch justify-between gap-12">
            
            {/* Center: Massive Score Display */}
            <div className="flex-1 text-center flex flex-col justify-center border-r-0 md:border-r border-zinc-800 pr-0 md:pr-12">
              <h1 className="text-2xl md:text-3xl font-black font-clash text-zinc-400 mb-6 tracking-widest uppercase">
                Batting Team
              </h1>
              
              <div className="flex justify-center items-end gap-2 mb-6">
                <span 
                  ref={runDisplayRef}
                  className={clsx(
                    "text-[8rem] md:text-[14rem] font-black font-jetbrains tabular-nums leading-[0.8] tracking-tighter transition-colors duration-500",
                    boundaryGlow ? "text-emerald-400" : "text-white"
                  )}
                >
                  {score.runs}
                </span>
                <span className="text-6xl md:text-[8rem] font-black font-jetbrains text-red-500 tabular-nums leading-[0.8]">
                  <span className="text-zinc-600 mr-2">/</span>{score.wickets}
                </span>
              </div>

              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="bg-zinc-950/80 px-8 py-4 rounded-2xl border border-zinc-800/80 flex items-center gap-4">
                  <span className="text-zinc-500 font-bold tracking-widest text-sm uppercase">Overs</span>
                  <span className="text-4xl font-black font-jetbrains text-zinc-100">{score.overs}.{score.balls}</span>
                </div>
                <div className="bg-zinc-950/80 px-8 py-4 rounded-2xl border border-zinc-800/80 flex items-center gap-4">
                  <span className="text-zinc-500 font-bold tracking-widest text-sm uppercase">CRR</span>
                  <span className="text-4xl font-black font-jetbrains text-emerald-400">{currentRunRate}</span>
                </div>
              </div>
            </div>

            {/* Right Side: Player Stats */}
            <div className="flex-[0.7] flex flex-col justify-between gap-8 pl-0 md:pl-12 w-full">
              {/* Batters */}
              <div className="space-y-4">
                <h3 className="text-zinc-500 font-bold tracking-widest text-xs uppercase flex items-center gap-2 mb-4">
                  <Target size={14} className="text-emerald-500" /> At The Crease
                </h3>
                
                <div className="bg-zinc-950/80 p-5 rounded-2xl border border-emerald-500/30 relative">
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  <div className="flex justify-between items-center ml-4">
                    <span className="font-black text-white text-xl">Striker</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-jetbrains font-black text-4xl text-emerald-400">{score.strikerRuns || 0}</span>
                      <span className="text-zinc-500 font-bold tracking-widest">({score.strikerBalls || 0})</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800">
                  <div className="flex justify-between items-center ml-2">
                    <span className="font-black text-zinc-400 text-lg">Non-Striker</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-jetbrains font-black text-2xl text-zinc-300">{score.nonStrikerRuns || 0}</span>
                      <span className="text-zinc-600 font-bold tracking-widest">({score.nonStrikerBalls || 0})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bowler */}
              <div>
                <h3 className="text-zinc-500 font-bold tracking-widest text-xs uppercase flex items-center gap-2 mb-4">
                  <Activity size={14} className="text-blue-500" /> Bowling
                </h3>
                <div className="bg-blue-500/5 p-5 rounded-2xl border border-blue-500/20">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-zinc-300 text-lg">Current Bowler</span>
                    <div className="flex items-center gap-2 font-jetbrains font-black text-3xl tabular-nums">
                      <span className="text-white">{score.bowlerWickets || 0}</span>
                      <span className="text-blue-500">-</span>
                      <span className="text-white">{score.bowlerRuns || 0}</span>
                      <span className="text-zinc-600 text-sm tracking-widest ml-2">
                        ({Math.floor((score.bowlerBalls || 0) / 6)}.{(score.bowlerBalls || 0) % 6})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Ribbon (Bottom edge of broadcast card) */}
          <div className="mt-12 pt-8 border-t border-zinc-800/50">
            <h3 className="text-zinc-500 font-bold tracking-widest text-xs uppercase mb-4 text-center">Current Over Timeline</h3>
            <div className="flex justify-center gap-4">
              {(!score.timeline || score.timeline.length === 0) ? (
                <div className="text-zinc-600 font-medium italic text-sm">Waiting for delivery...</div>
              ) : (
                <AnimatePresence>
                  {score.timeline.map((event, idx) => {
                    const isLast = idx === score.timeline.length - 1;
                    const isWicket = String(event).includes('W');
                    const isBoundary = String(event) === '4' || String(event) === '6';
                    
                    return (
                      <motion.div
                        key={`${score.overs}-${score.balls}-${idx}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={clsx(
                          "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black text-lg md:text-xl transition-shadow border-2",
                          isWicket ? "bg-red-500/20 text-red-500 border-red-500/50" :
                          isBoundary ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" :
                          "bg-zinc-800 text-zinc-200 border-zinc-700",
                          isLast && "ring-4 ring-offset-4 ring-offset-zinc-900 shadow-xl",
                          isLast && isWicket ? "ring-red-500/50" :
                          isLast && isBoundary ? "ring-emerald-500/50" :
                          isLast ? "ring-white/30" : ""
                        )}
                      >
                        {event}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>

        {/* EXTERNAL COMMENTARY TICKER */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-xl flex items-center gap-6 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0 border-r border-zinc-800 pr-6">
            <Radio size={16} className="text-emerald-500" />
            <span className="font-bold tracking-widest text-xs uppercase text-zinc-400">Commentary</span>
          </div>
          
          <div className="relative h-6 flex-1 overflow-hidden mask-right">
            <AnimatePresence mode="popLayout">
              {commentaries.length > 0 ? (
                <motion.div
                  key={commentaries[0].id}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  className="absolute inset-0 flex items-center gap-3 whitespace-nowrap"
                >
                  <span className="text-zinc-500 font-jetbrains text-xs font-bold bg-zinc-950 px-2 py-1 rounded">
                    {commentaries[0].ballNumber ? `${Math.floor(commentaries[0].ballNumber/6)}.${commentaries[0].ballNumber%6}` : '-'}
                  </span>
                  <span className={clsx(
                    "font-medium",
                    commentaries[0].type === 'WICKET' ? "text-red-400 font-bold" :
                    commentaries[0].type === 'BOUNDARY' ? "text-emerald-400 font-bold" : "text-zinc-300"
                  )}>
                    {commentaries[0].text}
                  </span>
                </motion.div>
              ) : (
                <div className="text-zinc-600 text-sm font-medium italic flex items-center h-full">
                  Waiting for live updates...
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Global utility CSS for mask */}
      <style dangerouslySetInnerHTML={{__html: `
        .mask-right {
          -webkit-mask-image: linear-gradient(to right, black 80%, transparent 100%);
          mask-image: linear-gradient(to right, black 80%, transparent 100%);
        }
      `}} />
    </div>
  );
}
