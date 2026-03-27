'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api/api.client';
import { LoadingLayer } from '@/components/ui/LoadingLayer';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Sword, Shield, Activity, Target, Trophy, Award, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PlayerProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [player, setPlayer] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlayerDetails = async () => {
      try {
        const [playerRes, matchesRes] = await Promise.all([
          apiClient.get(`/players/${params.id}`),
          apiClient.get(`/players/${params.id}/matches?limit=50`)
        ]);
        setPlayer(playerRes.data?.data || playerRes.data);
        setMatches(matchesRes.data?.data || []);
      } catch (error) {
        console.error('Failed to fetch player details:', error);
        toast.error('Failed to load player profile');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerDetails();
  }, [params.id, router]);

  if (isLoading) return <LoadingLayer />;
  if (!player) return <div className="p-8 text-center text-zinc-400">Player not found.</div>;

  // Process Batting Stats
  const battingStats = player.BattingStats || [];
  const totalRuns = battingStats.reduce((sum: number, stat: any) => sum + stat.runs, 0);
  const totalBalls = battingStats.reduce((sum: number, stat: any) => sum + stat.balls, 0);
  const fours = battingStats.reduce((sum: number, stat: any) => sum + stat.fours, 0);
  const sixes = battingStats.reduce((sum: number, stat: any) => sum + stat.sixes, 0);
  const strikeRate = totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(1) : '0.0';
  const highestScore = battingStats.length > 0 ? Math.max(...battingStats.map((s: any) => s.runs)) : 0;
  
  // Highlighting 50s and 100s
  const fifties = battingStats.filter((s: any) => s.runs >= 50 && s.runs < 100).length;
  const centuries = battingStats.filter((s: any) => s.runs >= 100).length;

  // Process Bowling Stats
  const bowlingStats = player.BowlingStats || [];
  const totalWickets = bowlingStats.reduce((sum: number, stat: any) => sum + stat.wickets, 0);
  const totalMaidens = bowlingStats.reduce((sum: number, stat: any) => sum + stat.maidens, 0);
  const totalRunsConceded = bowlingStats.reduce((sum: number, stat: any) => sum + (stat.runs || 0), 0);
  
  // Calculate total overs from overs float (e.g., 2.3 overs => 2 overs + 3 balls)
  let totalBallsBowled = 0;
  bowlingStats.forEach((stat: any) => {
    const fullOvers = Math.floor(stat.overs);
    const remainderBalls = Math.round((stat.overs - fullOvers) * 10);
    totalBallsBowled += (fullOvers * 6) + remainderBalls;
  });
  const normalizedOvers = Math.floor(totalBallsBowled / 6) + (totalBallsBowled % 6) / 10;
  
  const economyRate = normalizedOvers > 0 ? (totalRunsConceded / (totalBallsBowled / 6)).toFixed(2) : '0.00';
  
  // Best Bowling Figures
  let bestBowling = { wickets: 0, runs: 0 };
  bowlingStats.forEach((stat: any) => {
    if (stat.wickets > bestBowling.wickets || (stat.wickets === bestBowling.wickets && (stat.runs || 0) < bestBowling.runs)) {
      bestBowling = { wickets: stat.wickets, runs: stat.runs || 0 };
    }
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => router.back()} className="text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <span className="text-sm font-bold text-emerald-500 tracking-widest uppercase">Player Profile</span>
      </div>

      <header className="glass-premium p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative shrink-0">
            {player.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={player.avatarUrl} alt={player.name} className="w-32 h-32 rounded-3xl object-cover border-2 border-zinc-800 shadow-[0_0_30px_rgba(16,185,129,0.15)]" />
            ) : (
              <div className="w-32 h-32 bg-zinc-900 rounded-3xl flex items-center justify-center border-2 border-zinc-800 text-5xl font-black text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                {player.name.charAt(0)}
              </div>
            )}
            {player.jerseyNumber && (
              <div className="absolute -bottom-3 -right-3 bg-white text-zinc-950 text-xl font-black w-10 h-10 flex items-center justify-center rounded-full border-[3px] border-[#0B0F1A] shadow-lg">
                {player.jerseyNumber}
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-4 pt-2">
            <div>
              <h1 className="text-4xl md:text-5xl font-black font-clash text-white mb-2">{player.name}</h1>
              {player.team && (
                <Link href={`/teams/${player.team.id}`} className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-sm font-bold hover:bg-emerald-500/20 transition-colors">
                  <Shield size={14} />
                  {player.team.name}
                </Link>
              )}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="flex items-center gap-1.5 bg-zinc-900/80 px-4 py-2 rounded-xl border border-white/5 text-sm font-bold text-white tracking-wide">
                <User size={16} className="text-zinc-400" />
                {player.role.replace(/_/g, ' ')}
              </span>
              
              {player.battingStyle && (
                <span className="flex items-center gap-1.5 bg-zinc-900/80 px-4 py-2 rounded-xl border border-white/5 text-sm font-bold text-white tracking-wide">
                  <Sword size={16} className="text-blue-400" />
                  {player.battingStyle.replace('_HANDED', ' HANDED')}
                </span>
              )}
              
              {player.bowlingStyle && (
                <span className="flex items-center gap-1.5 bg-zinc-900/80 px-4 py-2 rounded-xl border border-white/5 text-sm font-bold text-white tracking-wide">
                  <Target size={16} className="text-red-400" />
                  {player.bowlingStyle.replace(/_ARM_|_/g, ' ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Analytics Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Batting Analytics */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Sword className="text-blue-400" size={20} />
            <h3 className="font-clash font-black text-xl text-white">Career Batting</h3>
          </div>
          <div className="glass-premium p-6 rounded-[2rem] border border-white/5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Innings</div>
                <div className="text-3xl font-black text-white">{battingStats.length}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Runs</div>
                <div className="text-3xl font-black text-emerald-400">{totalRuns}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Highest</div>
                <div className="text-3xl font-black text-white">{highestScore}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Strike Rate</div>
                <div className="text-2xl font-black text-white">{strikeRate}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Boundaries (4s/6s)</div>
                <div className="text-2xl font-black text-zinc-300">{fours} / {sixes}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Milestones (50s/100s)</div>
                <div className="text-2xl font-black text-amber-400 flex items-center gap-2">
                  {fifties} <span className="text-zinc-500 text-sm">/</span> {centuries}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bowling Analytics */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Target className="text-red-400" size={20} />
            <h3 className="font-clash font-black text-xl text-white">Career Bowling</h3>
          </div>
          <div className="glass-premium p-6 rounded-[2rem] border border-white/5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Innings</div>
                <div className="text-3xl font-black text-white">{bowlingStats.length}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Wickets</div>
                <div className="text-3xl font-black text-emerald-400">{totalWickets}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Best Figures</div>
                <div className="text-3xl font-black text-white">{bestBowling.wickets}/{bestBowling.runs}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Economy</div>
                <div className="text-2xl font-black text-white">{economyRate}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Overs</div>
                <div className="text-2xl font-black text-zinc-300">{normalizedOvers}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Maidens</div>
                <div className="text-2xl font-black text-amber-500">{totalMaidens}</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Matches Timeline */}
      <div className="space-y-6">
        <h3 className="font-clash font-black text-2xl text-white flex items-center gap-3">
          <Activity size={24} className="text-emerald-500" /> Match History
        </h3>

        {matches.length === 0 ? (
          <div className="glass-premium p-8 rounded-3xl text-center border-dashed border-white/10">
            <p className="text-zinc-500 font-medium">No recorded matches for this player yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {matches.map((match: any, idx: number) => {
              // Check if we have personal stats for this match
              const myBatting = battingStats.find((s: any) => s.matchId === match.id);
              const myBowling = bowlingStats.find((s: any) => s.matchId === match.id);

              return (
                <div key={match.id} className="glass-premium p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <Link href={`/match/${match.id}/scorecard`} className="text-emerald-400 font-bold hover:underline text-sm truncate pr-4">
                      {match.team1?.shortName || match.team1?.name} vs {match.team2?.shortName || match.team2?.name}
                    </Link>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-900 border border-white/5 px-2 py-1 rounded-md text-zinc-400 shrink-0">
                      {new Date(match.startTime || match.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 divide-x divide-zinc-800/50">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1"><Sword size={10} /> Batting</div>
                      {myBatting ? (
                        <div>
                          <span className="text-lg font-black text-white">{myBatting.runs}</span>
                          <span className="text-xs text-zinc-400 ml-1">({myBatting.balls})</span>
                          {myBatting.dismissalType && <span className="block text-[10px] text-red-400 mt-0.5">{myBatting.dismissalType}</span>}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600">DNB</span>
                      )}
                    </div>
                    
                    <div className="space-y-1 pl-4">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1"><Target size={10} /> Bowling</div>
                      {myBowling ? (
                        <div>
                          <span className="text-lg font-black text-white">{myBowling.wickets}/{myBowling.runs || 0}</span>
                          <span className="text-xs text-zinc-400 ml-1">({myBowling.overs} ov)</span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600">DNB</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
