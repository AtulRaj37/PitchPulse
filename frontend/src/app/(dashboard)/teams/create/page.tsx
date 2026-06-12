'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, Loader2, ArrowLeft, Upload, X } from 'lucide-react';
import { apiClient } from '@/services/api/api.client';
import { toast } from 'sonner';

export default function CreateTeamPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    homeGround: '',
    logoUrl: ''
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Team name is required');
      return;
    }

    // Sanitize payload to remove empty strings (prevent Zod validation failures on optional fields)
    const payload: any = { name: formData.name };
    if (formData.shortName.trim()) payload.shortName = formData.shortName.trim();
    if (formData.homeGround.trim()) payload.homeGround = formData.homeGround.trim();
    if (formData.logoUrl.trim()) payload.logoUrl = formData.logoUrl.trim();

    setIsLoading(true);
    try {
      await apiClient.post('/teams', payload);
      toast.success('Team created successfully!');
      router.push('/teams');
    } catch (error: any) {
      console.error('Failed to create team', error);
      const msg = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to create team.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 sm:px-6 mt-10">
      {/* Clean Vercel-Style Header */}
      <header className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-emerald-400 font-bold uppercase tracking-widest text-xs mb-3 transition-colors group">
          <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all">
            <ArrowLeft size={14} />
          </div>
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-semibold text-white tracking-tight leading-tight">Create New Team</h1>
        <p className="text-zinc-400 mt-2 text-sm max-w-lg">
          Register a new team to manage players, matches, and view statistics.
        </p>
      </header>

      {/* Clean SaaS Dashboard Form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-sm"
      >
        <form onSubmit={handleSubmit}>
          
          <div className="p-8 space-y-8">
            {/* Field: Team Logo Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
              <div className="relative group">
                {formData.logoUrl ? (
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-zinc-900 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={formData.logoUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-400 transition-colors z-20"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/10 hover:border-emerald-500/40 bg-zinc-950 flex flex-col items-center justify-center transition-colors">
                    <Upload size={20} className="text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mt-2 group-hover:text-emerald-500/80 transition-colors">Select Logo</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  title="Upload Team Logo"
                />
              </div>
              
              <div className="flex flex-col text-center sm:text-left">
                <span className="text-sm font-semibold text-white">Squad Logo</span>
                <span className="text-xs text-zinc-500 mt-1 max-w-xs leading-normal">
                  Upload an image from your device (Max 2MB). Ideal dimensions: square or rounded ratios.
                </span>
              </div>
            </div>

            {/* Field: Team Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Team Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#111] border border-white/10 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-white text-sm rounded-lg px-4 py-3 transition-colors placeholder:text-zinc-600 outline-none"
                placeholder="Enter team name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Field: Short Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Short Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value.toUpperCase() })}
                    className="w-full bg-[#111] border border-white/10 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-white text-sm rounded-lg pl-4 pr-12 py-3 transition-colors placeholder:text-zinc-600 outline-none uppercase font-semibold"
                    placeholder="RCB"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 bg-[#1a1a1a] px-1.5 py-0.5 rounded">
                    {formData.shortName.length}/4
                  </div>
                </div>
              </div>

              {/* Field: Home Ground */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Home Ground
                </label>
                <input
                  type="text"
                  value={formData.homeGround}
                  onChange={(e) => setFormData({ ...formData, homeGround: e.target.value })}
                  className="w-full bg-[#111] border border-white/10 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-white text-sm rounded-lg px-4 py-3 transition-colors placeholder:text-zinc-600 outline-none"
                  placeholder="Enter home ground"
                />
              </div>
            </div>
          </div>

          {/* Footer Action Area */}
          <div className="bg-[#111] border-t border-white/10 p-6 flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-medium hidden sm:inline-block">
              Teams can be modified or deleted later in settings.
            </span>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Users size={16} />
              )}
              {isLoading ? 'Creating...' : 'Register Team'}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
