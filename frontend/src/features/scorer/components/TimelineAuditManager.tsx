import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { History, X, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api/api.client';
import { toast } from 'sonner';
import clsx from 'clsx';
import { useScorerStore } from '@/features/scorer/scorer.store';
import { MatchService } from '@/services/api/match.service';

interface TimelineAuditManagerProps {
  onClose: () => void;
  matchId: string;
}

export function TimelineAuditManager({ onClose, matchId }: TimelineAuditManagerProps) {
  const { events, initializeFromEvents } = useScorerStore();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Group events into over chunks for better readability or just descending array
  // We'll show the raw array descending so the latest is at top
  const sortedEvents = [...events].reverse() as any[];

  const getEventName = (type: string) => {
    switch (type) {
      case 'MATCH_STARTED': return 'Match Start';
      case 'INNINGS_STARTED': return 'Innings Start';
      case 'BALL_BOWLED': return 'Legal Delivery';
      case 'WIDE_BALL': return 'Wide Ball';
      case 'NO_BALL': return 'No Ball';
      case 'BYE': return 'Bye';
      case 'LEG_BYE': return 'Leg Bye';
      case 'WICKET_FELL': return 'Wicket';
      case 'RUN_SCORED': return 'Runs Scored';
      default: return type.replace(/_/g, ' ');
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm("WARNING: Deleting an event from the middle of the timeline will trigger a full chronological replay. Are you absolutely sure?")) {
      return;
    }

    setIsDeleting(eventId);
    try {
      // Execute retroactive delete via new Command capability
      await apiClient.delete(`/commands/match/${matchId}/events/${eventId}`);
      toast.success("Timeline event scrubbed and Match State replayed.");
      
      // Force refresh match data to sync store
      const updatedMatch = await MatchService.getMatchById(matchId);
      initializeFromEvents(updatedMatch);
      
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Audit operation failed");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-2xl p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-950 border border-red-500/20 rounded-[2rem] w-full max-w-4xl max-h-[85vh] flex flex-col shadow-[0_0_100px_rgba(239,68,68,0.1)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />
        
        {/* Header */}
        <div className="p-6 md:p-8 flex justify-between items-start shrink-0 border-b border-white/5 relative z-10 bg-zinc-950">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-inner">
               <History size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black font-clash text-white tracking-wider flex items-center gap-2">
                Timeline Audit
                <span className="bg-red-500/20 text-red-500 text-[9px] px-2 py-0.5 rounded font-black tracking-widest uppercase">Admin</span>
              </h2>
              <p className="text-zinc-500 text-xs font-bold font-sans">Raw chronological event ledger. Retroactive mutations will trigger engine replays.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Security Warning */}
        <div className="mx-6 md:mx-8 mt-6 bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 shrink-0">
           <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={18} />
           <div>
              <span className="text-red-400 font-bold block text-sm tracking-wide uppercase mb-1">Architectural Integrity Warning</span>
              <span className="text-zinc-400 text-xs leading-relaxed block">
                Performing a Soft Delete interrupts the immutable event stream. The Event Sourcing engine will incinerate cached Match Snapshots and execute a complete deterministic replay from Event Zero to reconstruct current reality.
              </span>
           </div>
        </div>

        {/* Ledger */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-3 custom-scrollbar">
          {sortedEvents.map((event, index) => {
            const isDeletingThis = isDeleting === event.id;
            
            return (
              <div 
                key={event.id}
                className={clsx(
                  "p-4 rounded-xl border flex items-center justify-between transition-all group",
                  isDeletingThis ? "bg-red-500/10 border-red-500/50 grayscale" : "bg-black/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                )}
              >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-zinc-950 flex flex-col items-center justify-center border border-zinc-800 shrink-0">
                       <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{event.overNumber || 0}.{event.ballNumber || 0}</span>
                    </div>
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className={clsx(
                             "text-xs font-black uppercase tracking-widest",
                             (event.type || event.eventType) === 'WICKET_FELL' ? 'text-red-400' : (event.type || event.eventType)?.includes('RUN') ? 'text-amber-400' : 'text-zinc-300'
                          )}>
                             {getEventName(event.type || event.eventType || 'UNKNOWN')}
                          </span>
                          <span className="text-[8px] text-zinc-600 uppercase font-mono tracking-widest">({event.id.slice(0, 8)})</span>
                       </div>
                       
                       <p className="text-zinc-500 text-xs max-w-lg truncate">
                         {event.payload ? JSON.stringify(event.payload).replace(/[{}"\\]/g, ' ') : 'System Event'}
                       </p>
                    </div>
                 </div>

                 <button 
                   disabled={isDeleting !== null}
                   onClick={() => handleDelete(event.id)}
                   className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all text-zinc-600 border-transparent hover:border-red-500 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                   title="Soft Delete Event"
                 >
                   {isDeletingThis ? <Loader2 size={16} className="animate-spin text-red-500" /> : <Trash2 size={16} />}
                 </button>
              </div>
            );
          })}
          
          {sortedEvents.length === 0 && (
             <div className="text-center py-20 text-zinc-600 font-bold tracking-widest uppercase">
                Event ledger is completely empty.
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
