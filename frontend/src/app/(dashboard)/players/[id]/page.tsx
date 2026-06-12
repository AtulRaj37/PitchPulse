'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api/api.client';
import { LoadingLayer } from '@/components/ui/LoadingLayer';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Sword, Shield, Activity, Target, Trophy, Award, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, Legend } from 'recharts';

const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#8b5cf6'];

export default function PlayerProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [player, setPlayer] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlayerDetails = async () => {
      try {
        const [playerRes, statsRes, matchesRes] = await Promise.all([
          apiClient.get(`/players/${params.id}`),
          apiClient.get(`/players/${params.id}/stats`),
          apiClient.get(`/players/${params.id}/matches?limit=50`)
        ]);
        setPlayer(playerRes.data?.data || playerRes.data);
        setStats(statsRes.data?.data || null);
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

  // Extract Career from Stats Endpoint
  const career = stats?.career || { runs: 0, ballsFaced: 0, fours: 0, sixes: 0, wickets: 0, runsConceded: 0, ballsBowled: 0, maidenOvers: 0 };
  const recentBatting = stats?.recentBatting || [];
  const recentBowling = stats?.recentBowling || [];
  const shotDistribution = stats?.shotDistribution || [];
  const dismissalTypes = stats?.dismissalTypes || [];

  const strikeRate = career.ballsFaced > 0 ? ((career.runs / career.ballsFaced) * 100).toFixed(1) : '0.0';
  const economyRate = career.ballsBowled > 0 ? (career.runsConceded / (career.ballsBowled / 6)).toFixed(2) : '0.00';
  const normalizedOvers = Math.floor(career.ballsBowled / 6) + ((career.ballsBowled % 6) / 10);
  
  // Highlighting 50s/100s via BattingStats array for accurate history processing
  const battingStats = player.BattingStats || [];
  const fifties = battingStats.filter((s: any) => s.runs >= 50 && s.runs < 100).length;
  const centuries = battingStats.filter((s: any) => s.runs >= 100).length;
  const highestScore = battingStats.length > 0 ? Math.max(...battingStats.map((s: any) => s.runs)) : 0;

  // Best Bowling
  const bowlingStats = player.BowlingStats || [];
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
                <div className="text-3xl font-black text-emerald-400">{career.runs}</div>
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
                <div className="text-2xl font-black text-zinc-300">{career.fours} / {career.sixes}</div>
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
                <div className="text-3xl font-black text-emerald-400">{career.wickets}</div>
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
                <div className="text-2xl font-black text-amber-500">{career.maidenOvers}</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Advanced Player Stats (Scores & Forms) */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar Heatmap */}
        {shotDistribution.length > 0 && (
           <div className="space-y-4">
               <h3 className="font-clash font-black text-2xl text-white flex items-center gap-3">
                 <Target size={24} className="text-emerald-500" /> Shot Area Heatmap
               </h3>
               <div className="glass-premium p-6 rounded-[2rem] border border-white/5 h-72 flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                   <RadarChart cx="50%" cy="50%" outerRadius="80%" data={shotDistribution}>
                     <PolarGrid stroke="#ffffff20" />
                     <PolarAngleAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold' }} />
                     <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                     <Radar name="Runs" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0a0f1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#10b981', fontWeight: 'black' }}
                     />
                   </RadarChart>
                 </ResponsiveContainer>
               </div>
           </div>
        )}

        {/* Wicket Breakdown PieChart */}
        {dismissalTypes.length > 0 && (
           <div className="space-y-4">
               <h3 className="font-clash font-black text-2xl text-white flex items-center gap-3">
                 <Shield size={24} className="text-amber-500" /> Dismissal Analysis
               </h3>
               <div className="glass-premium p-6 rounded-[2rem] border border-white/5 h-72 flex flex-col items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={dismissalTypes}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                       stroke="none"
                     >
                       {dismissalTypes.map((entry: any, index: number) => (
                         <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0a0f1c', border: '1px solid #272f40', borderRadius: '12px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#fff' }}
                     />
                     <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}/>
                   </PieChart>
                 </ResponsiveContainer>
               </div>
           </div>
        )}
      </div>

      {/* Recent Form Graphs */}
      {recentBatting.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-clash font-black text-2xl text-white flex items-center gap-3">
            <TrendingUp size={24} className="text-emerald-500" /> Recent Batting Form
          </h3>
          <div className="glass-premium p-6 rounded-[2rem] border border-white/5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentBatting.slice().reverse()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="matchName" tickFormatter={(v) => v.substring(0, 10) + '...'} stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0f1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                  itemStyle={{ color: '#10b981', fontWeight: 'black' }}
                />
                <Area type="monotone" dataKey="runs" name="Runs Scored" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRuns)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {recentBowling.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-clash font-black text-2xl text-white flex items-center gap-3">
            <TrendingUp size={24} className="text-blue-400" /> Recent Bowling Form
          </h3>
          <div className="glass-premium p-6 rounded-[2rem] border border-white/5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentBowling.slice().reverse()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="matchName" tickFormatter={(v) => v.substring(0, 10) + '...'} stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0f1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                  itemStyle={{ color: '#60a5fa', fontWeight: 'black' }}
                />
                <Area type="step" dataKey="wickets" name="Wickets Taken" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#colorWickets)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
