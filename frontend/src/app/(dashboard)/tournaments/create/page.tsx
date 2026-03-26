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
    overs: 20
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Tournament name is required');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/tournaments', {
        ...formData,
        startDate: new Date().toISOString()
      });
      toast.success('Tournament created successfully!');
      router.push('/tournaments');
    } catch (error: any) {
      console.error('Failed to create tournament', error);
      const msg = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to create tournament. Please log out and back in.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <header className="pb-6 border-b border-zinc-900">
        <h1 className="text-3xl font-black font-clash text-white mb-2">Create Tournament</h1>
        <p className="text-zinc-400">Start a new series or competition.</p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-premium p-8 rounded-[2rem] border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-bold text-zinc-300 mb-2 uppercase tracking-wider">Tournament Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-900/50 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium"
              placeholder="Enter tournament name"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-300 mb-2 uppercase tracking-wider">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-zinc-900/50 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium min-h-[100px]"
              placeholder="Short description of the tournament..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-zinc-300 mb-2 uppercase tracking-wider">Format</label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium"
              >
                <option value="T20">T20</option>
                <option value="T10">T10</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-300 mb-2 uppercase tracking-wider">Overs per Innings</label>
              <input
                type="number"
                value={formData.overs}
                onChange={(e) => setFormData({ ...formData, overs: parseInt(e.target.value) || 20 })}
                min="1"
                max="50"
                className="w-full bg-zinc-900/50 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-400 text-white font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Trophy size={20} />}
            {isLoading ? 'Creating Tournament...' : 'Start Tournament'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
