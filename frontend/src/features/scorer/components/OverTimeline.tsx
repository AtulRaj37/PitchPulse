import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface OverTimelineProps {
  timeline: string[];
}

export function OverTimeline({ timeline }: OverTimelineProps) {
  
  const getEventStyle = (event: string) => {
    if (event === 'W' || event.includes('W')) return "bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-[0_5px_15px_rgba(239,68,68,0.4)] border border-red-400/50"; // Wicket
    if (event === '4') return "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_5px_15px_rgba(59,130,246,0.4)] border border-blue-400/50"; // 4s
    if (event === '6') return "bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-[0_5px_15px_rgba(217,70,239,0.4)] border border-fuchsia-400/50 text-base sm:text-lg"; // 6s
    if (event.includes('Wd') || event.includes('Nb') || event.includes('B') || event.includes('Lb')) return "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_5px_15px_rgba(245,158,11,0.4)] border border-amber-400/50"; // Extras
    if (event === '0') return "bg-white/5 text-zinc-400 border border-white/20 border-dashed"; // Dot
    return "bg-gradient-to-br from-zinc-700 to-zinc-800 text-white border border-white/10 shadow-md"; // Regular Run
  };

  return (
    <div className="bg-[#0e1424]/80 backdrop-blur-xl rounded-[1.5rem] border border-white/5 px-6 py-5 w-full shadow-2xl relative overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-2xl pointer-events-none rounded-full" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">This Over</h3>
        <span className="text-[10px] bg-white/[0.05] border border-white/10 px-2.5 py-1 rounded text-zinc-400 font-bold uppercase tracking-widest">{timeline.length} Ball{timeline.length !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar min-h-[50px] relative z-10">
        <AnimatePresence mode="popLayout">
          {timeline.map((event, idx) => (
            <motion.div
              key={`${idx}-${event}`}
              initial={{ scale: 0, opacity: 0, x: -20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              layout
              className={clsx(
                "h-10 min-w-[40px] flex items-center justify-center rounded-full text-sm font-black font-clash px-2 shrink-0 transition-all",
                getEventStyle(event),
                idx === timeline.length - 1 ? "ring-[3px] ring-white/30 ring-offset-[3px] ring-offset-[#0e1424] scale-110 ml-2 mr-1" : ""
              )}
            >
              {event}
            </motion.div>
          ))}
          {timeline.length === 0 && (
            <motion.span 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-xs font-medium text-zinc-500 italic tracking-wider flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500/50 animate-ping" />
              Ready for the first ball...
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
