import React from 'react';
import { Trophy, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

interface TeamProps {
  id?: string;
  name: string;
  shortName?: string;
}

interface BracketMatchProps {
  id: string;
  matchNumber: number;
  round: number;
  team1?: TeamProps;
  team2?: TeamProps;
  status: string;
  winnerId?: string;
  isCompleted: boolean;
  score1?: string;
  score2?: string;
}

interface KnockoutBracketProps {
  matches: BracketMatchProps[];
}

export const KnockoutBracket: React.FC<KnockoutBracketProps> = ({ matches }) => {
  const router = useRouter();
  
  // Group matches by round
  const roundsMap = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, BracketMatchProps[]>);

  const rounds = Object.keys(roundsMap).map(Number).sort((a, b) => a - b);
  
  if (rounds.length === 0) return (
    <div className="p-10 text-center text-zinc-500 font-bold uppercase tracking-widest border border-dashed border-zinc-800 rounded-3xl">
      Not enough data to orchestrate bracket.
    </div>
  );

  const getRoundName = (roundIndex: number, totalRounds: number) => {
    if (roundIndex === totalRounds) return 'Final';
    if (roundIndex === totalRounds - 1) return 'Semi-Finals';
    if (roundIndex === totalRounds - 2) return 'Quarter-Finals';
    return `Round ${roundIndex}`;
  };

  return (
    <div className="w-full overflow-x-auto py-10 hide-scrollbar cursor-grab active:cursor-grabbing">
      <div className="min-w-max flex gap-12 md:gap-20 justify-start px-4">
        
        {rounds.map((roundNum, index) => {
          const roundMatches = roundsMap[roundNum];
          const isFinal = index === rounds.length - 1;
          
          return (
            <div key={roundNum} className="flex flex-col relative w-64 shrink-0">
               {/* Round Header */}
               <div className="text-center mb-8">
                 <h4 className="text-amber-500 font-black uppercase tracking-[0.2em] text-sm drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                   {getRoundName(roundNum, rounds.length)}
                 </h4>
               </div>

               {/* Matches Pillar */}
               <div className="flex flex-col flex-1 justify-around gap-12">
                 {roundMatches.map((match, matchIdx) => {
                   
                   const t1Winner = match.isCompleted && match.winnerId === match.team1?.id;
                   const t2Winner = match.isCompleted && match.winnerId === match.team2?.id;

                   return (
                     <div key={match.id} className="relative group">
                       
                       {/* SVG Connectors to Next Round */}
                       {!isFinal && (
                         <svg className="absolute top-1/2 left-full w-12 md:w-20 h-[calc(100%+3rem)] -z-10 pointer-events-none" style={{ overflow: 'visible' }}>
                           {matchIdx % 2 === 0 ? (
                             // Connects downwards to next round's incoming slot
                             <path d="M 0 0 h 20 v 50 h 20" fill="none" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                           ) : (
                             // Connects upwards to next round's incoming slot
                             <path d="M 0 0 h 20 v -50 h 20" fill="none" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                           )}
                         </svg>
                       )}

                       {/* Match Card */}
                       <div 
                         onClick={() => router.push(match.status === 'TBD' ? '#' : `/match/${match.id}/scorecard`)}
                         className={clsx(
                           "bg-zinc-950 border rounded-2xl p-3 shadow-xl transition-all",
                           match.status === 'LIVE' ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900',
                           isFinal && match.isCompleted ? 'border-amber-500/50 ring-2 ring-amber-500/20' : ''
                         )}
                       >
                         {/* Header */}
                         <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-[9px] font-black text-zinc-500 tracking-[0.2em] uppercase">M{match.matchNumber}</span>
                            <span className={clsx("text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded", match.status === 'LIVE' ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-zinc-900 text-zinc-400')}>
                              {match.status}
                            </span>
                         </div>

                         {/* Teams */}
                         <div className="flex flex-col gap-1.5">
                           
                           {/* Team 1 */}
                           <div className={clsx("flex items-center justify-between p-2 rounded-xl border border-transparent transition-colors", t1Winner ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#0a0a0a]')}>
                             <div className="flex items-center gap-2">
                               <div className={clsx("w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-black", t1Winner ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400')}>
                                 {match.team1?.shortName || match.team1?.name?.slice(0,3) || 'TBA'}
                               </div>
                               <span className={clsx("text-xs font-bold truncate max-w-[100px]", t1Winner ? 'text-white' : 'text-zinc-400')}>
                                 {match.team1?.name || 'TBA'}
                               </span>
                             </div>
                             {match.score1 && <span className={clsx("text-xs font-black", t1Winner ? 'text-amber-500' : 'text-zinc-500')}>{match.score1}</span>}
                           </div>

                           {/* Team 2 */}
                           <div className={clsx("flex items-center justify-between p-2 rounded-xl border border-transparent transition-colors", t2Winner ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#0a0a0a]')}>
                             <div className="flex items-center gap-2">
                               <div className={clsx("w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-black", t2Winner ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400')}>
                                 {match.team2?.shortName || match.team2?.name?.slice(0,3) || 'TBA'}
                               </div>
                               <span className={clsx("text-xs font-bold truncate max-w-[100px]", t2Winner ? 'text-white' : 'text-zinc-400')}>
                                 {match.team2?.name || 'TBA'}
                               </span>
                             </div>
                             {match.score2 && <span className={clsx("text-xs font-black", t2Winner ? 'text-amber-500' : 'text-zinc-500')}>{match.score2}</span>}
                           </div>

                         </div>
                         
                         {isFinal && match.isCompleted && (
                           <div className="absolute -top-4 -right-4 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] rotate-12 z-20">
                             <Trophy size={20} fill="currentColor" />
                           </div>
                         )}

                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          );
        })}

      </div>
    </div>
  );
};
