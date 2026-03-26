'use client';

import { motion } from 'framer-motion';

export function LoadingLayer() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="space-y-10 w-full"
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 pb-6 border-b border-zinc-900/50">
        <div className="space-y-3">
          <div className="h-10 w-48 bg-zinc-900/50 rounded-lg animate-pulse"></div>
          <div className="h-4 w-72 bg-zinc-900/30 rounded-md animate-pulse"></div>
        </div>
        <div className="h-12 w-32 bg-emerald-500/10 rounded-xl animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-zinc-900/40 rounded-[2rem] animate-pulse border border-white/5"></div>
        ))}
      </div>
      
      <div className="space-y-4">
        <div className="h-6 w-40 bg-zinc-900/50 rounded-md animate-pulse mb-6"></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-zinc-900/40 rounded-[2rem] animate-pulse border border-white/5"></div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
