'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2, Activity, List, MessageSquareText, TrendingUp, Share2, Star, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api/api.client';
import clsx from 'clsx';
import { socketService } from '@/services/socket.service';

// Modular Components
import { ScorecardHeader } from '@/features/scorecard/components/ScorecardHeader';
import { TabSummary } from '@/features/scorecard/components/TabSummary';
import { TabScorecard } from '@/features/scorecard/components/TabScorecard';
import { TabCommentary } from '@/features/scorecard/components/TabCommentary';
import { TabAnalysis } from '@/features/scorecard/components/TabAnalysis';
import { TabHeroes } from '@/features/scorecard/components/TabHeroes';

type TabView = 'SUMMARY' | 'SCORECARD' | 'COMMENTARY' | 'ANALYSIS' | 'HEROES';

export default function LiveFanPage() {
  const { id } = useParams();
  const matchId = Array.isArray(id) ? id[0] : id;
  
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // State for Navigation and Interactivity
  const [activeTab, setActiveTab] = useState<TabView>('SUMMARY');
  const [activeInningsIndex, setActiveInningsIndex] = useState(0);

  useEffect(() => {
    const fetchScorecard = async () => {
      try {
        const res = await apiClient.get(`/matches/${matchId}`);
        if (res.data?.data) {
          setMatchData(res.data.data);
          
          if (res.data.data.innings && res.data.data.innings.length > 0) {
            setActiveInningsIndex(res.data.data.innings.length - 1);
          }
        }
      } catch (err) {
        console.error('Failed to load live scorecard', err);
      } finally {
        setLoading(false);
      }
    };
    if (matchId) fetchScorecard();

    // Setup Live Updates via existing Socket.io
    socketService.connect();
    socketService.joinMatch(matchId as string);

    const unsubScore = socketService.subscribeToScoreUpdates(() => {
      setSocketConnected(true);
      fetchScorecard();
    });

    const interval = setInterval(async () => {
      fetchScorecard(); // Polling fallback
    }, 15000);

    return () => {
      clearInterval(interval);
      unsubScore();
      socketService.leaveMatch(matchId as string);
    };
  }, [matchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold font-clash">Live Feed Not Found</h1>
        <p className="text-zinc-500 text-sm mt-2">The match URL may be invalid.</p>
      </div>
    );
  }

  const { team1, team2, innings, venue, startTime, status } = matchData;
  const matchDate = new Date(startTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  
  const team1Innings = innings?.find((i: any) => i.battingTeamId === team1.id);
  const team2Innings = innings?.find((i: any) => i.battingTeamId === team2.id);
  const activeInning = innings && innings.length > 0 ? innings[activeInningsIndex] : null;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col max-w-7xl mx-auto border-x border-white/5 relative selection:bg-emerald-500/30">
      
      {/* PUBLIC HEADER */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-white/[0.02] sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-900 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
             <span className="font-black font-clash text-lg">P</span>
          </div>
          <div>
            <h1 className="text-xl font-black font-clash uppercase tracking-tight flex items-center gap-2">
               PitchPulse <span className="text-emerald-500">Live</span>
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              {status === 'LIVE' ? (
                 <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    Broadcast Active
                 </span>
              ) : (
                 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                    {status}
                 </span>
              )}
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: 'PitchPulse Match Scorecard', text: `Live score for ${team1?.name || 'Team 1'} vs ${team2?.name || 'Team 2'}`, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Live broadcast link copied!');
            }
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors shadow-lg"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </header>

      {/* TWO COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-8 items-start relative">
        
        <div className="lg:col-span-2 flex flex-col border-b lg:border-r border-white/5 pb-12 lg:pb-0 min-h-screen">
          
          <div className="p-4 md:p-6 pb-2">
            <ScorecardHeader 
              team1={team1} 
              team2={team2} 
              team1Innings={team1Innings} 
              team2Innings={team2Innings} 
              venue={venue || 'PitchPulse Arena'} 
              matchDate={matchDate} 
              status={status} 
              matchData={matchData}
            />
          </div>

          <div className="px-4 md:px-6 border-b border-white/10 sticky top-[73px] z-40 bg-[#050505]/95 backdrop-blur-xl">
            <div className="flex gap-6 overflow-x-auto scrollbar-hide pt-2">
              <button onClick={() => setActiveTab('SUMMARY')} className={clsx("flex items-center gap-2 pb-4 pt-2 font-bold uppercase tracking-widest text-xs transition-colors whitespace-nowrap border-b-2", activeTab === 'SUMMARY' ? 'text-emerald-400 border-emerald-400' : 'text-zinc-500 border-transparent hover:text-white')}><Activity className="w-4 h-4" /> Summary</button>
              <button onClick={() => setActiveTab('SCORECARD')} className={clsx("flex items-center gap-2 pb-4 pt-2 font-bold uppercase tracking-widest text-xs transition-colors whitespace-nowrap border-b-2", activeTab === 'SCORECARD' ? 'text-emerald-400 border-emerald-400' : 'text-zinc-500 border-transparent hover:text-white')}><List className="w-4 h-4" /> Scorecard</button>
              <button onClick={() => setActiveTab('COMMENTARY')} className={clsx("flex items-center gap-2 pb-4 pt-2 font-bold uppercase tracking-widest text-xs transition-colors whitespace-nowrap border-b-2", activeTab === 'COMMENTARY' ? 'text-emerald-400 border-emerald-400' : 'text-zinc-500 border-transparent hover:text-white')}><MessageSquareText className="w-4 h-4" /> Commentary</button>
              <button onClick={() => setActiveTab('ANALYSIS')} className={clsx("flex items-center gap-2 pb-4 pt-2 font-bold uppercase tracking-widest text-xs transition-colors whitespace-nowrap border-b-2", activeTab === 'ANALYSIS' ? 'text-emerald-400 border-emerald-400' : 'text-zinc-500 border-transparent hover:text-white')}><TrendingUp className="w-4 h-4" /> Analysis</button>
              <button onClick={() => setActiveTab('HEROES')} className={clsx("flex items-center gap-2 pb-4 pt-2 font-bold uppercase tracking-widest text-xs transition-colors whitespace-nowrap border-b-2", activeTab === 'HEROES' ? 'text-emerald-400 border-emerald-400' : 'text-zinc-500 border-transparent hover:text-white')}><Star className="w-4 h-4" /> Heroes</button>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {(activeTab === 'SUMMARY' || activeTab === 'SCORECARD') && innings && innings.length > 0 && (
              <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
                {innings.map((inn: any, idx: number) => {
                  const innTeam = inn.battingTeamId === team1.id ? team1 : team2;
                  return (
                    <button 
                      key={idx}
                      onClick={() => setActiveInningsIndex(idx)}
                      className={clsx(
                        "flex-1 min-w-[120px] py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] md:text-xs transition-all border",
                        activeInningsIndex === idx ? 'bg-[#151a28] text-white border-white/20 shadow-md transform scale-[1.02]' : 'bg-[#0a0f1c] text-zinc-500 border-white/5 hover:bg-white/5 hover:text-zinc-300'
                      )}
                    >
                      {innTeam.shortName || innTeam.name} INN
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'SUMMARY' && <TabSummary inning={activeInning} />}
            {activeTab === 'SCORECARD' && <TabScorecard inning={activeInning} matchData={matchData} />}
            {activeTab === 'COMMENTARY' && <TabCommentary matchData={matchData} />}
            {activeTab === 'ANALYSIS' && <TabAnalysis matchData={matchData} />}
            {activeTab === 'HEROES' && <TabHeroes matchData={matchData} />}
          </div>
        </div>

        <div className="hidden lg:flex flex-col gap-6 p-6 sticky top-[73px] self-start max-h-[calc(100vh-73px)] overflow-y-auto w-full">
            <div className="bg-[#0a0f1c] border border-white/5 rounded-2xl p-6 flex flex-col gap-6 shadow-xl">
                <h3 className="text-sm font-black uppercase tracking-widest text-white border-b border-white/10 pb-4 flex items-center gap-2">
                   <Radio className="w-4 h-4 text-emerald-500" /> Match Info
                </h3>
                
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tournament / Series</span>
                  <span className="text-xs font-bold text-emerald-400 uppercase">{matchData.tournament?.name || `PITCHPULSE SERIES ${new Date(matchDate).getFullYear()}`}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Location</span>
                  <span className="text-sm font-bold text-zinc-300">{venue || 'Local Pitch'}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Toss</span>
                  <span className="text-sm font-bold text-zinc-300">
                     {matchData?.tossWinnerId === team1.id ? team1.name : team2.name} elected to {matchData?.tossDecision === 'BAT' ? 'Bat' : 'Bowl'}
                  </span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
