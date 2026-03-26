'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, Loader2, Activity, List, MessageSquareText, TrendingUp } from 'lucide-react';
import { apiClient } from '@/services/api/api.client';
import clsx from 'clsx';
import { socketService } from '@/services/socket.service';

// Modular Components
import { ScorecardHeader } from '@/features/scorecard/components/ScorecardHeader';
import { TabSummary } from '@/features/scorecard/components/TabSummary';
import { TabScorecard } from '@/features/scorecard/components/TabScorecard';
import { TabCommentary } from '@/features/scorecard/components/TabCommentary';
import { TabAnalysis } from '@/features/scorecard/components/TabAnalysis';

type TabView = 'SUMMARY' | 'SCORECARD' | 'COMMENTARY' | 'ANALYSIS';

export default function ScorecardPage() {
  const { id } = useParams();
  const matchId = Array.isArray(id) ? id[0] : id;
  
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(true);
  
  // State for Navigation and Interactivity
  const [activeTab, setActiveTab] = useState<TabView>('SUMMARY');
  const [activeInningsIndex, setActiveInningsIndex] = useState(0);

  useEffect(() => {
    const fetchScorecard = async () => {
      try {
        const res = await apiClient.get(`/matches/${matchId}`);
        if (res.data?.data) {
          setMatchData(res.data.data);
          
          // If match is active and has innings, default to the latest innings
          if (res.data.data.innings && res.data.data.innings.length > 0) {
            setActiveInningsIndex(res.data.data.innings.length - 1);
          }
        }
      } catch (err) {
        console.error('Failed to load scorecard', err);
      } finally {
        setLoading(false);
      }
    };
    if (matchId) fetchScorecard();

    // Setup Live Updates
    socketService.connect();
    socketService.joinMatch(matchId as string);

    const unsubScore = socketService.subscribeToScoreUpdates(() => {
      setSocketConnected(true);
      fetchScorecard();
    });

    const interval = setInterval(async () => {
      if (!socketConnected) {
        fetchScorecard();
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      unsubScore();
      socketService.leaveMatch(matchId as string);
    };
  }, [matchId, socketConnected]);

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
        <h1 className="text-xl font-bold font-clash">Scorecard Not Found</h1>
        <Link href="/dashboard" className="text-emerald-500 mt-4 hover:underline font-bold text-sm tracking-widest uppercase">Return to Dashboard</Link>
      </div>
    );
  }

  const { team1, team2, innings, venue, startTime, status } = matchData;
  const matchDate = new Date(startTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  
  // Aggregate match summary totals
  const team1Innings = innings?.find((i: any) => i.battingTeamId === team1.id);
  const team2Innings = innings?.find((i: any) => i.battingTeamId === team2.id);

  // Active Tab resolution
  const activeInning = innings && innings.length > 0 ? innings[activeInningsIndex] : null;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col max-w-4xl mx-auto border-x border-white/5 relative selection:bg-emerald-500/30">
      
      {/* HEADER */}
      <header className="px-6 py-4 flex items-center gap-4 border-b border-white/10 bg-white/[0.02] sticky top-0 z-50 backdrop-blur-md">
        <Link href={`/match/${matchId}/score`}>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
            <ChevronLeft className="w-5 h-5 text-zinc-300" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-black font-clash uppercase tracking-tight">Match Center</h1>
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded inline-block mt-0.5">{status}</p>
        </div>
      </header>

      {/* MATCH SUMMARY (Always Visible Top Section) */}
      <div className="p-4 md:p-6 pb-2">
        <ScorecardHeader 
          team1={team1} 
          team2={team2} 
          team1Innings={team1Innings} 
          team2Innings={team2Innings} 
          venue={venue || 'PitchPulse Arena'} 
          matchDate={matchDate} 
          status={status} 
        />
      </div>

      {/* MASTER SCENE TABS */}
      <div className="px-4 md:px-6 border-b border-white/10 sticky top-[73px] z-40 bg-[#050505]/95 backdrop-blur-xl">
        <div className="flex gap-6 overflow-x-auto scrollbar-hide pt-2">
          
          <button 
            onClick={() => setActiveTab('SUMMARY')}
            className={clsx(
              "flex items-center gap-2 pb-4 pt-2 font-bold uppercase tracking-widest text-xs transition-colors whitespace-nowrap border-b-2",
              activeTab === 'SUMMARY' ? 'text-emerald-400 border-emerald-400' : 'text-zinc-500 border-transparent hover:text-white'
            )}
          >
            <Activity className="w-4 h-4" /> Info
          </button>
          
          <button 
            onClick={() => setActiveTab('SCORECARD')}
            className={clsx(
              "flex items-center gap-2 pb-4 pt-2 font-bold uppercase tracking-widest text-xs transition-colors whitespace-nowrap border-b-2",
              activeTab === 'SCORECARD' ? 'text-emerald-400 border-emerald-400' : 'text-zinc-500 border-transparent hover:text-white'
            )}
          >
            <List className="w-4 h-4" /> Scorecard
          </button>
          
          <button 
            onClick={() => setActiveTab('COMMENTARY')}
            className={clsx(
              "flex items-center gap-2 pb-4 pt-2 font-bold uppercase tracking-widest text-xs transition-colors whitespace-nowrap border-b-2",
              activeTab === 'COMMENTARY' ? 'text-emerald-400 border-emerald-400' : 'text-zinc-500 border-transparent hover:text-white'
            )}
          >
            <MessageSquareText className="w-4 h-4" /> Commentary
          </button>
          
          <button 
            onClick={() => setActiveTab('ANALYSIS')}
            className={clsx(
              "flex items-center gap-2 pb-4 pt-2 font-bold uppercase tracking-widest text-xs transition-colors whitespace-nowrap border-b-2",
              activeTab === 'ANALYSIS' ? 'text-emerald-400 border-emerald-400' : 'text-zinc-500 border-transparent hover:text-white'
            )}
          >
            <TrendingUp className="w-4 h-4" /> Analysis
          </button>

        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="p-4 md:p-6 mb-12">
        
        {/* INNINGS TABS (Only shown for Summary and Scorecard) */}
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
                    activeInningsIndex === idx 
                      ? 'bg-[#151a28] text-white border-white/20 shadow-md transform scale-[1.02]' 
                      : 'bg-[#0a0f1c] text-zinc-500 border-white/5 hover:bg-white/5 hover:text-zinc-300'
                  )}
                >
                  {innTeam.shortName || innTeam.name} INN
                </button>
              );
            })}
          </div>
        )}

        {/* Dynamic View Resolution */}
        {activeTab === 'SUMMARY' && <TabSummary inning={activeInning} />}
        {activeTab === 'SCORECARD' && <TabScorecard inning={activeInning} />}
        {activeTab === 'COMMENTARY' && <TabCommentary matchData={matchData} />}
        {activeTab === 'ANALYSIS' && <TabAnalysis matchData={matchData} />}

      </div>
    </div>
  );
}
