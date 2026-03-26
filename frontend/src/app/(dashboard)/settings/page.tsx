'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, Smartphone, Globe, Activity, Moon, Sun, ToggleLeft, ToggleRight, Save, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/features/auth/auth.store';
import { useSettingsStore, SettingsState } from '@/features/settings/settings.store';
import { toast } from 'sonner';

const TABS = [
  { id: 'profile', label: 'Identity', icon: User },
  { id: 'preferences', label: 'Display', icon: Smartphone },
  { id: 'notifications', label: 'Alerts', icon: Bell },
  { id: 'match-defaults', label: 'Engine', icon: Activity },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const settings = useSettingsStore();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Mock State (To simulate API Save)
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileBio, setProfileBio] = useState('');

  const handleToggle = (key: keyof Omit<SettingsState, 'setSetting'>) => {
    const newValue = !settings[key];
    settings.setSetting(key, newValue);
    toast.success(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${newValue ? 'Enabled' : 'Disabled'}`);
  };

  const handleSaveProfile = () => {
    toast.success('System configuration updated successfully.');
  };

  return (
    <div className="pb-32 w-full max-w-[1400px] mx-auto overflow-hidden">
      
      {/* CINEMATIC SETTINGS HEADER */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="pt-12 px-8 md:px-16 flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
        <div>
          <h1 className="text-6xl md:text-8xl font-black font-clash text-white tracking-tighter uppercase mb-2">
            System <span className="text-emerald-500 italic drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]">Config</span>
          </h1>
          <p className="text-zinc-500 font-bold tracking-widest uppercase text-sm">
            Manage your interface, identity, and engine defaults.
          </p>
        </div>

        <div className="flex w-full md:w-auto">
          <motion.button 
            onClick={handleSaveProfile}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white text-zinc-950 px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-emerald-400 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
          >
            <Save size={16} /> Save Changes
          </motion.button>
        </div>
      </motion.div>

      {/* SLEEK HORIZONTAL TABS */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="px-4 md:px-16 mb-16 overflow-x-auto no-scrollbar">
        <div className="flex items-end gap-10 md:gap-16 border-b border-white/5 pb-4 px-4 min-w-max">
          {TABS.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative group pb-2"
            >
              <div className="flex items-center gap-3">
                <tab.icon className={clsx("w-5 h-5 transition-colors", activeTab === tab.id ? "text-emerald-500" : "text-zinc-700")} />
                <span className={clsx(
                  "text-2xl md:text-3xl font-black font-clash uppercase tracking-tighter transition-colors",
                  activeTab === tab.id ? "text-white" : "text-zinc-700 group-hover:text-zinc-500"
                )}>
                  {tab.label}
                </span>
              </div>
              {activeTab === tab.id && (
                <motion.div layoutId="settingsTab" className="absolute -bottom-4 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* CONTENT AREA (BORDERLESS) */}
      <div className="px-8 md:px-20 min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl"
          >
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-16">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                  <div className="relative group cursor-pointer">
                    <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-[#050505] to-zinc-900 flex items-center justify-center font-clash font-black text-5xl text-emerald-400 border border-zinc-800 shadow-[0_0_30px_rgba(16,185,129,0.1)] group-hover:border-emerald-500/50 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] transition-all">
                      {profileName.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                      <User size={18} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-4xl md:text-5xl font-black font-clash text-white tracking-tighter uppercase mb-2">{profileName || user?.name || 'Scorer Profile'}</h3>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs flex items-center gap-3">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px]">{user?.role || 'SYSTEM ADMIN'}</span>
                      ID: {user?.id?.slice(0,8) || 'USR-001'}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
                  <div className="space-y-4 group">
                    <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Display Name</label>
                    <input 
                      type="text" 
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)} 
                      className="w-full bg-transparent border-b border-white/10 pb-4 text-2xl font-black font-clash text-white tracking-wide uppercase focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-800" 
                      placeholder="ENTER NAME"
                    />
                  </div>
                  <div className="space-y-4 group opacity-50 cursor-not-allowed">
                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Email Address (Locked)</label>
                    <input 
                      type="email" 
                      defaultValue={user?.email || 'user@pitchpulse.io'} 
                      disabled 
                      className="w-full bg-transparent border-b border-white/5 pb-4 text-xl font-bold font-clash text-zinc-500 tracking-wide focus:outline-none transition-colors" 
                    />
                  </div>
                  <div className="space-y-4 md:col-span-2 group">
                    <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Biography / Tagline</label>
                    <textarea 
                      rows={2} 
                      value={profileBio} 
                      onChange={(e) => setProfileBio(e.target.value)}
                      placeholder="TELL THE COMMUNITY ABOUT YOURSELF..." 
                      className="w-full bg-transparent border-b border-white/10 pb-4 text-xl font-bold font-clash text-white tracking-wide uppercase focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-800 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PREFERENCES TAB */}
            {activeTab === 'preferences' && (
              <div className="space-y-12">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 border-b border-white/5 group hover:bg-white/[0.01] transition-colors -mx-8 px-8">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black font-clash text-white tracking-tighter uppercase mb-2 group-hover:text-emerald-400 transition-colors">Cinematic Mode</span>
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Enable deep dark UI surfaces (Recommended)</span>
                  </div>
                  <button onClick={() => handleToggle('darkMode')} className="transition-transform hover:scale-105">
                    {settings.darkMode ? <ToggleRight size={48} className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" /> : <ToggleLeft size={48} className="text-zinc-700" />}
                  </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 border-b border-white/5 group hover:bg-white/[0.01] transition-colors -mx-8 px-8">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black font-clash text-white tracking-tighter uppercase mb-2 group-hover:text-emerald-400 transition-colors">Locale Engine</span>
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Set system-wide date and time representation</span>
                  </div>
                  <select 
                    value={settings.language} 
                    onChange={(e) => {
                      settings.setSetting('language', e.target.value);
                      toast.success(`Language set to ${e.target.value}`);
                    }}
                    className="bg-transparent border-b border-emerald-500/30 pb-2 text-xl font-black font-clash text-emerald-400 uppercase tracking-wide focus:outline-none cursor-pointer"
                  >
                    <option className="bg-black">English (US)</option>
                    <option className="bg-black">English (UK)</option>
                    <option className="bg-black">Hindi</option>
                  </select>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 border-b border-white/5 group hover:bg-white/[0.01] transition-colors -mx-8 px-8">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black font-clash text-white tracking-tighter uppercase mb-2 group-hover:text-emerald-400 transition-colors">Push Notifications</span>
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Real-time alerts for match events, wickets, and starts</span>
                  </div>
                  <button onClick={() => handleToggle('pushNotifications')} className="transition-transform hover:scale-105">
                    {settings.pushNotifications ? <ToggleRight size={48} className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" /> : <ToggleLeft size={48} className="text-zinc-700" />}
                  </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 border-b border-white/5 group hover:bg-white/[0.01] transition-colors -mx-8 px-8">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black font-clash text-white tracking-tighter uppercase mb-2 group-hover:text-emerald-400 transition-colors">Email Summaries</span>
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Detailed aesthetic scorecards delivered to your inbox</span>
                  </div>
                  <button onClick={() => handleToggle('emailSummaries')} className="transition-transform hover:scale-105">
                    {settings.emailSummaries ? <ToggleRight size={48} className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" /> : <ToggleLeft size={48} className="text-zinc-700" />}
                  </button>
                </div>
              </div>
            )}

            {/* MATCH DEFAULTS TAB */}
            {activeTab === 'match-defaults' && (
              <div className="space-y-16">
                <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
                  <div className="space-y-4 group">
                    <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Base Overs Configuration</label>
                    <input 
                      type="number" 
                      value={settings.defaultOvers} 
                      onChange={(e) => settings.setSetting('defaultOvers', parseInt(e.target.value) || 5)}
                      className="w-full bg-transparent border-b border-white/10 pb-4 text-4xl font-black font-clash text-white tracking-wide focus:outline-none focus:border-emerald-500 transition-colors" 
                    />
                  </div>
                  <div className="space-y-4 group">
                    <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Roster Size Limit</label>
                    <input 
                      type="number" 
                      value={settings.defaultSquadSize} 
                      onChange={(e) => settings.setSetting('defaultSquadSize', parseInt(e.target.value) || 11)}
                      className="w-full bg-transparent border-b border-white/10 pb-4 text-4xl font-black font-clash text-white tracking-wide focus:outline-none focus:border-emerald-500 transition-colors" 
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 border-b border-white/5 group hover:bg-white/[0.01] transition-colors -mx-8 px-8">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black font-clash text-white tracking-tighter uppercase mb-2 group-hover:text-emerald-400 transition-colors">Haptic & Audio Engine</span>
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Impact sounds for boundaries, wickets, and milestones</span>
                  </div>
                  <button onClick={() => handleToggle('soundEffects')} className="transition-transform hover:scale-105">
                    {settings.soundEffects ? <ToggleRight size={48} className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" /> : <ToggleLeft size={48} className="text-zinc-700" />}
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 border-b border-white/5 group hover:bg-white/[0.01] transition-colors -mx-8 px-8">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black font-clash text-white tracking-tighter uppercase mb-2 group-hover:text-emerald-400 transition-colors">Global Visibility</span>
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Allow platform discovery and stats sharing</span>
                  </div>
                  <button onClick={() => handleToggle('publicProfile')} className="transition-transform hover:scale-105">
                    {settings.publicProfile ? <ToggleRight size={48} className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" /> : <ToggleLeft size={48} className="text-zinc-700" />}
                  </button>
                </div>

                <div className="pt-10">
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] block mb-6">Danger Protocol</span>
                  <button className="flex items-center gap-3 text-red-500 border border-red-500/20 px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all">
                    Initiate Account Deletion <LogOut size={16} />
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
