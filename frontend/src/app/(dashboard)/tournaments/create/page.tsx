'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api/api.client';
import { toast } from 'sonner';

export default function CreateTournamentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    format: 'T20',
    overs: 20 as number | string
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Tournament name is required');
      return;
    }

    setIsLoading(true);
    try {
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + 30); // Default to a 30-day tournament

      await apiClient.post('/tournaments', {
        ...formData,
        overs: parseInt(String(formData.overs)) || 20,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        maxTeams: 16,
      });
      toast.success('Tournament created successfully!');
      router.push('/tournaments');
    } catch (error: any) {
      console.error('Failed to create tournament', error);
      const errData = error.response?.data;
      if (errData?.errors && Array.isArray(errData.errors) && errData.errors.length > 0) {
        toast.error(errData.errors[0].message);
      } else {
        const msg = errData?.error?.message || errData?.message || 'Failed to create tournament.';
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-32 w-full max-w-[1000px] mx-auto relative">
      
      {/* CINEMATIC HEADER */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="pt-8 px-4 md:px-8 mb-10">
        <h1 className="text-5xl md:text-7xl font-black font-clash text-white tracking-tighter uppercase mb-2">
          Create <span className="text-amber-500 italic drop-shadow-[0_0_30px_rgba(245,158,11,0.4)]">Tournament</span>
        </h1>
        <p className="text-zinc-500 font-bold tracking-widest uppercase text-sm">
          Establish the parameters for your new competitive series.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 md:px-8"
      >
        <div className="bg-[#0a0a0a]/90 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-white/5 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {/* Ambient Form Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10 w-full">
            {/* NAME */}
            <div className="group">
              <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">Tournament Name *</label>
              <input
                type="text"
                required
                minLength={3}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-xl md:text-2xl font-bold px-6 py-4 rounded-2xl focus:outline-none focus:border-amber-500/50 focus:bg-amber-500/5 transition-all placeholder:text-zinc-700 shadow-inner"
                placeholder="Enter tournament name"
              />
            </div>

            {/* DESCRIPTION */}
            <div className="group">
              <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-300 text-lg px-6 py-5 focus:outline-none focus:border-amber-500/50 focus:bg-amber-500/5 transition-all min-h-[120px] resize-none shadow-inner placeholder:text-zinc-700"
                placeholder="Brief description or rules..."
              />
            </div>

            {/* FORMAT & OVERS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="group">
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">Match Format</label>
                <div className="relative">
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="w-full appearance-none bg-zinc-900/50 border border-zinc-800 text-white rounded-2xl px-6 py-4 focus:outline-none focus:border-amber-500/50 focus:bg-amber-500/5 transition-all text-lg font-bold uppercase tracking-wide cursor-pointer shadow-inner"
                  >
                    <option value="T20">T20 (Standard)</option>
                    <option value="T10">T10 (Blitz)</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                  <div className="absolute top-1/2 right-6 -translate-y-1/2 pointer-events-none text-amber-500 text-lg">
                    ▼
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">Overs per Innings</label>
                <input
                  type="number"
                  value={formData.overs}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, overs: val === '' ? '' : parseInt(val) || '' });
                  }}
                  min="1"
                  max="50"
                  className="w-full bg-zinc-900/50 border border-zinc-800 text-white rounded-2xl px-6 py-4 focus:outline-none focus:border-amber-500/50 focus:bg-amber-500/5 transition-all text-lg font-bold uppercase tracking-wide shadow-inner"
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 text-zinc-950 px-8 py-5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group/btn relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out"></div>
                {isLoading ? <Loader2 size={24} className="animate-spin relative z-10" /> : <Trophy size={24} className="relative z-10" />}
                <span className="relative z-10 block translate-y-px">{isLoading ? 'Creating Tournament...' : 'Launch Tournament'}</span>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
