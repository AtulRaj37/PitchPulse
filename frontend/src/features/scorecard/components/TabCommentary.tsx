import React from 'react';
import { MessageSquareText } from 'lucide-react';
import clsx from 'clsx';

interface TabCommentaryProps {
  matchData: any;
}

export function TabCommentary({ matchData }: TabCommentaryProps) {
  const allEvents = matchData?.events 
    ? [...matchData.events]
        .filter((e: any) => {
          if (['RUN_SCORED', 'BATSMAN_OUT', 'BOUNDARY_SCORED', 'SIX_SCORED'].includes(e.eventType)) return false;
          
          if (e.eventType === 'BALL_BOWLED' && e.payload?.runs === 0) {
            const hasWicket = matchData.events.some((sibling: any) => 
              sibling.eventType === 'WICKET_FELL' &&
              Number(sibling.overNumber) === Number(e.overNumber) &&
              Number(sibling.ballNumber) === Number(e.ballNumber)
            );
            if (hasWicket) return false;
          }
          
          return true;
        })
        .sort((a: any, b: any) => b.sequenceNumber - a.sequenceNumber) 
    : [];

  if (allEvents.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-[#0a0f1c]/50">
        <MessageSquareText className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs">No commentary available</p>
        <p className="text-zinc-600 text-xs mt-1">Match events haven&apos;t started yet.</p>
      </div>
    );
  }

  // Chunk events into Over Blocks
  const blocks: { type: 'OVER' | 'SYSTEM', overNumber?: number, events: any[] }[] = [];
  let currentOverBlock: { type: 'OVER', overNumber: number, events: any[] } | null = null;

  allEvents.forEach((e: any) => {
    if (e.overNumber !== undefined && e.overNumber !== null) {
      if (!currentOverBlock || currentOverBlock.overNumber !== e.overNumber) {
        currentOverBlock = { type: 'OVER', overNumber: e.overNumber, events: [] };
        blocks.push(currentOverBlock);
      }
      currentOverBlock.events.push(e);
    } else {
      currentOverBlock = null; 
      blocks.push({ type: 'SYSTEM', events: [e] });
    }
  });

  const renderEventLabel = (payload: any, type: string) => {
    if (type === 'WICKET_FELL') return { label: 'W', color: 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-red-400' };
    if (type === 'BALL_BOWLED' && payload.runs === 4) return { label: '4', color: 'bg-[#1a2f24] text-emerald-400 border border-emerald-500' };
    if (type === 'BALL_BOWLED' && payload.runs === 6) return { label: '6', color: 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(52,211,153,0.5)] border border-emerald-400 font-black' };
    if (type === 'WIDE_BALL') return { label: 'WD', color: 'bg-[#152336] text-blue-400 border border-blue-500' };
    if (type === 'NO_BALL') return { label: 'NB', color: 'bg-[#152336] text-blue-400 border border-blue-500' };
    if (type === 'BYE') return { label: 'B', color: 'bg-[#152336] text-blue-400 border border-blue-500' };
    if (type === 'LEG_BYE') return { label: 'LB', color: 'bg-[#152336] text-blue-400 border border-blue-500' };
    if (type === 'BALL_BOWLED' && payload.runs === 0) return { label: '0', color: 'bg-[#1a1a1a] text-zinc-400 border border-zinc-600' };
    
    // Default Run
    return { label: payload.runs?.toString() || '-', color: 'bg-[#1c2230] text-zinc-200 border border-zinc-600' };
  };

  const getCommentaryText = (e: any) => {
    if (e.eventType === 'OVER_COMPLETED') return <span className="text-amber-500 font-bold tracking-wide">End of Over {e.overNumber !== undefined ? e.overNumber + 1 : ''}</span>;
    if (e.eventType === 'MATCH_STARTED') return <span className="text-emerald-400 font-bold">Play! The match begins.</span>;
    if (e.eventType === 'INNINGS_COMPLETED') return <span className="text-amber-400 font-bold">Innings Break.</span>;
    
    // Fallbacks
    const runs = e.payload?.runs || 0;
    const rawShotArea = e.payload?.shotArea;
    const rawShotType = e.payload?.shotType;
    const shotArea = rawShotArea ? rawShotArea.replace(/_/g, ' ').toLowerCase() : '';
    const shotType = rawShotType ? rawShotType.replace(/_/g, ' ').toLowerCase() : '';

    if (e.eventType === 'WICKET_FELL') {
      const mode = (e.payload.wicketType || e.payload.dismissalMode || 'Out').replace(/_/g, ' ');
      let detail = 'The bowler strikes!';
      if (mode.includes('BOWLED')) detail = 'Cleaned him up! What a spectacular delivery.';
      if (mode.includes('CAUGHT')) detail = 'Splendid catch taken! The batsman has to walk back.';
      if (mode.includes('LBW')) detail = 'Trapped right in front! The umpire raises the finger.';
      if (mode.includes('RUN OUT')) detail = 'Direct hit? Yes, he is short of his crease! Brilliant fielding.';
      if (mode.includes('STUMPED')) detail = 'Lightning fast glovework by the keeper, he is gone.';
      return <span><strong className="text-red-400 text-base">WICKET!</strong> ({mode}) {detail}</span>;
    }
    
    if (e.eventType === 'BALL_BOWLED') {
      const isBoundaryArea = shotArea ? ` towards ${shotArea}` : '';
      const executedShot = shotType ? ` plays a gorgeous ${shotType}` : ' hits it';

      if (runs === 4) {
        if (shotType === 'cover drive' || shotType === 'straight drive') {
           return <span><strong className="text-emerald-400">FOUR!</strong> Glorious {shotType}{isBoundaryArea}, pierced the gap to perfection!</span>;
        } else if (shotType === 'pull' || shotType === 'hook') {
           return <span><strong className="text-emerald-400">FOUR!</strong> Authoritative {shotType}{isBoundaryArea}, crunched away to the boundary!</span>;
        } else if (shotType === 'reverse sweep' || shotType === 'scoop' || shotType === 'upper cut') {
           return <span><strong className="text-emerald-400">FOUR!</strong> Cheeky! Fantastic {shotType} past the keeper for a boundary!</span>;
        }
        return <span><strong className="text-emerald-400">FOUR!</strong> The batsman{executedShot}{isBoundaryArea}, beating the fielder to the ropes!</span>;
      }
      
      if (runs === 6) {
        if (shotType === 'lofted shot' || shotType === 'helicopter') {
           return <span><strong className="text-emerald-400">SIX!</strong> Absolute maximum! A stunning {shotType} that lands rows back{isBoundaryArea}!</span>;
        } else if (shotType === 'pull' || shotType === 'hook' || shotType === 'slog sweep') {
           return <span><strong className="text-emerald-400">SIX!</strong> Dispatched! What a mighty {shotType} into the stands{isBoundaryArea}!</span>;
        }
        return <span><strong className="text-emerald-400">SIX!</strong> Massive hit! Smashed{isBoundaryArea} for a huge maximum!</span>;
      }
      
      if (runs === 0) {
         if (shotType === 'leave') return <span className="text-zinc-400">Well left by the batsman. Good leave outside off.</span>;
         if (shotType === 'defence' || shotType === 'solid defence') return <span className="text-zinc-400">Solid forward defence, played right off the middle of the bat.</span>;
         if (shotType && shotArea) return <span className="text-zinc-400">Plays a {shotType} towards {shotArea}, but finds the fielder perfectly. No run.</span>;
         if (shotType) return <span className="text-zinc-400">Attempts a {shotType}, but hits it straight to the fielder.</span>;
         if (shotArea) return <span className="text-zinc-400">Pushed to {shotArea}, but there&apos;s no run on offer.</span>;
         return <span className="text-zinc-400">Dot ball. Played straight to the fielder.</span>;
      }

      if (runs === 1) {
         if (shotType && shotArea) return <span>Good cricket. Plays a {shotType} down to {shotArea} and rotates the strike.</span>;
         if (shotArea) return <span>Tapped towards {shotArea} for a quick single.</span>;
         return <span>The batters scramble for a quick single.</span>;
      }

      if (runs === 2) {
         if (shotType && shotArea) return <span>Excellent running! Plays a {shotType} into the gap at {shotArea} and they come back for two.</span>;
         if (shotArea) return <span>Worked away beautifully to {shotArea}, they push hard and complete two runs.</span>;
         return <span>Good running between the wickets, they come back for 2.</span>;
      }

      if (runs === 3) {
         if (shotType && shotArea) return <span>Brilliant {shotType} down to {shotArea}, fielder gives chase and cuts it off just inside the ropes. Three runs taken.</span>;
         return <span>Great effort in the deep saves a certain boundary! The batters run 3.</span>;
      }
      
      return <span>The batters scramble for {runs} runs{shotArea ? ` working it to ${shotArea}` : ''}.</span>;
    }
    
    if (['WIDE_BALL', 'NO_BALL', 'BYE', 'LEG_BYE'].includes(e.eventType)) {
       const extraRuns = e.payload?.extraRuns || e.payload?.runs || 1;
       const extraLabel = e.eventType === 'WIDE_BALL' ? 'Wide' : e.eventType === 'NO_BALL' ? 'No Ball' : e.eventType === 'BYE' ? 'Bye' : 'Leg Bye';
       return <span className="text-blue-300 italic">Extras! Umpire signals {extraLabel}. Team gets {extraRuns} run{extraRuns > 1 ? 's' : ''}.</span>;
    }
    
    return <span className="text-zinc-500 text-xs italic">System Update: {e.eventType}</span>;
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 ml-2">
        <MessageSquareText className="w-4 h-4 text-cyan-500" />
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Ball by Ball Commentary</h3>
      </div>
      
      <div className="flex flex-col gap-6">
        {blocks.map((block, bIdx) => {
           
           if (block.type === 'SYSTEM') {
             return (
               <div key={`sys-${bIdx}`} className="flex flex-col gap-2">
                 {block.events.map(e => (
                   <div key={e.id} className="bg-[#0a0f1c] border border-emerald-500/20 px-6 py-4 rounded-xl flex items-center justify-center text-center">
                     <div className="font-bold text-sm tracking-widest uppercase text-emerald-400">{getCommentaryText(e)}</div>
                   </div>
                 ))}
               </div>
             );
           }

           // Over Block Data
           const runsThisOver = block.events.reduce((sum: number, ev: any) => sum + (ev.payload?.runs || 0) + (['WIDE_BALL', 'NO_BALL'].includes(ev.eventType) ? 1 : 0), 0);
           const wicketsThisOver = block.events.filter(ev => ev.eventType === 'WICKET_FELL').length;
           
           // Create a compact "ball string" for the header e.g. "4 1 W 0 6 1"
           const ballLabels = block.events.slice().reverse().filter(e => e.eventType !== 'OVER_COMPLETED').map(e => renderEventLabel(e.payload, e.eventType).label);
           
           return (
             <div key={`over-${block.overNumber}-${bIdx}`} className="bg-[#0a0f1c] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                
                {/* OVER SUMMARY HEADER */}
                <div className="bg-[#0d1326] border-b border-white/5 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                     <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Over</span>
                       <span className="text-lg font-black font-clash text-white">{block.overNumber !== undefined ? block.overNumber + 1 : '-'}</span>
                     </div>
                     <div className="h-8 w-px bg-white/10 hidden md:block"></div>
                     <div className="flex flex-col hidden md:flex">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Runs</span>
                       <span className="text-sm font-bold text-zinc-300">{runsThisOver}</span>
                     </div>
                     <div className="flex flex-col hidden md:flex">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Wickets</span>
                       <span className="text-sm font-bold text-red-400">{wicketsThisOver}</span>
                     </div>
                   </div>

                   <div className="flex gap-1.5 ml-auto">
                     {ballLabels.map((bl, i) => (
                       <span key={i} className="text-xs font-bold text-zinc-400">{bl}</span>
                     ))}
                   </div>
                </div>

                {/* OVER EVENTS THREAD */}
                <div className="flex flex-col">
                  {block.events.map(e => {
                    if (e.eventType === 'OVER_COMPLETED') return null; // Skip rendering internal over_completed in the thread since header handles it
                    
                    const { label, color } = renderEventLabel(e.payload, e.eventType);
                    
                    return (
                      <div key={e.id} className="flex gap-4 items-start px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group">
                        
                        {/* Ball Number */}
                        <div className="w-8 pt-1 text-xs font-bold font-jetbrains text-zinc-500 text-right shrink-0">
                          {e.overNumber !== undefined && e.ballNumber !== undefined ? `${e.overNumber}.${e.ballNumber + 1}` : '-'}
                        </div>

                        {/* Ball Icon */}
                        <div className={clsx(
                          "w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center font-black font-clash text-sm md:text-lg shadow-sm transition-transform group-hover:scale-105", 
                          color
                        )}>
                          {label}
                        </div>
                        
                        {/* Commentary Text */}
                        <div className="pt-0.5 md:pt-1 flex-1 leading-relaxed text-sm md:text-base text-zinc-300">
                          {getCommentaryText(e)}
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
}
