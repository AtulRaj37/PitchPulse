'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Smartphone, Globe, Activity, Moon, Sun, ToggleLeft, ToggleRight, Save, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/features/auth/auth.store';
import { useSettingsStore, SettingsState } from '@/features/settings/settings.store';
import { toast } from 'sonner';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Smartphone },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'match-defaults', label: 'Match Defaults', icon: Activity },
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
    toast.success('Profile settings updated successfully!');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl md:text-5xl font-black font-clash text-white mb-2 tracking-tight">Settings</h1>
          <p className="text-emerald-500 font-bold uppercase tracking-widest text-xs">Manage your PitchPulse experience</p>
        </div>
        <button 
          onClick={handleSaveProfile}
          className="flex items-center gap-2 bg-emerald-500 text-zinc-950 px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] w-fit"
        >
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mt-4">
        
        {/* Sidebar Tabs */}
        <div className="lg:w-64 shrink-0 flex flex-col gap-2">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all relative overflow-hidden group text-left",
                  isActive ? "text-white bg-[#0a0f1c] border border-white/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-settings-tab" 
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-600 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={18} className={clsx("relative z-10 transition-colors", isActive ? "text-emerald-400" : "text-zinc-600 group-hover:text-zinc-400")} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#0a0f1c]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-10 shadow-2xl min-h-[600px]">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-10">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-800 flex items-center justify-center font-black text-3xl text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] border-4 border-[#0a0e1a]">
                      {profileName.charAt(0) || user?.name?.charAt(0) || 'U'}
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-zinc-800 border-2 border-[#0a0e1a] flex items-center justify-center hover:bg-zinc-700 transition-colors text-white">
                      <User size={14} />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">{profileName || user?.name || 'Scorer Profile'}</h3>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-1">{user?.role || 'PLAYER'}</p>
                    <button className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4">Change Avatar</button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Display Name</label>
                    <input 
                      type="text" 
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Email Address</label>
                    <input type="email" defaultValue={user?.email || 'user@pitchpulse.io'} disabled className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-zinc-500 focus:outline-none transition-all font-medium cursor-not-allowed" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Bio</label>
                    <textarea 
                      rows={3} 
                      value={profileBio} 
                      onChange={(e) => setProfileBio(e.target.value)}
                      placeholder="Tell the community about yourself..." 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PREFERENCES TAB */}
            {activeTab === 'preferences' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-black text-white mb-2">App Preferences</h2>
                  <p className="text-zinc-500 text-sm">Customize how PitchPulse looks and feels.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400">
                        {settings.darkMode ? <Moon size={18} /> : <Sun size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-white">Dark Mode</p>
                        <p className="text-xs text-zinc-500">Enable cinematic dark UI (recommended).</p>
                      </div>
                    </div>
                    <button onClick={() => handleToggle('darkMode')}>
                      {settings.darkMode ? <ToggleRight size={36} className="text-emerald-500" /> : <ToggleLeft size={36} className="text-zinc-600" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400">
                        <Globe size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white">Language / Region</p>
                        <p className="text-xs text-zinc-500">Set the default locale for dates and times.</p>
                      </div>
                    </div>
                    <select 
                      value={settings.language} 
                      onChange={(e) => {
                        settings.setSetting('language', e.target.value);
                        toast.success(`Language set to ${e.target.value}`);
                      }}
                      className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option>English (US)</option>
                      <option>English (UK)</option>
                      <option>Hindi</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-black text-white mb-2">Alerts & Notifications</h2>
                  <p className="text-zinc-500 text-sm">Control what information hits your device.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="font-bold text-white">Push Notifications</p>
                      <p className="text-xs text-zinc-500">Live alerts for Wickets, Match Starts, and results.</p>
                    </div>
                    <button onClick={() => handleToggle('pushNotifications')}>
                      {settings.pushNotifications ? <ToggleRight size={36} className="text-emerald-500" /> : <ToggleLeft size={36} className="text-zinc-600" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="font-bold text-white">Email Match Summaries</p>
                      <p className="text-xs text-zinc-500">Receive an aesthetic scorecard to your email after every game.</p>
                    </div>
                    <button onClick={() => handleToggle('emailSummaries')}>
                      {settings.emailSummaries ? <ToggleRight size={36} className="text-emerald-500" /> : <ToggleLeft size={36} className="text-zinc-600" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MATCH DEFAULTS TAB */}
            {activeTab === 'match-defaults' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-black text-white mb-2">Scoring Defaults</h2>
                  <p className="text-zinc-500 text-sm">Pre-configure your Match Creation settings.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Default Overs</label>
                    <input 
                      type="number" 
                      value={settings.defaultOvers} 
                      onChange={(e) => settings.setSetting('defaultOvers', parseInt(e.target.value) || 5)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Default Squad Size</label>
                    <input 
                      type="number" 
                      value={settings.defaultSquadSize} 
                      onChange={(e) => settings.setSetting('defaultSquadSize', parseInt(e.target.value) || 11)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium" 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="font-bold text-white">Cinematic Sound Effects</p>
                    <p className="text-xs text-zinc-500">Play impact sounds when scoring Boundaries or Wickets.</p>
                  </div>
                  <button onClick={() => handleToggle('soundEffects')}>
                    {settings.soundEffects ? <ToggleRight size={36} className="text-emerald-500" /> : <ToggleLeft size={36} className="text-zinc-600" />}
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-black text-white mb-2">Security & Privacy</h2>
                  <p className="text-zinc-500 text-sm">Protect your account and control visibility.</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="font-bold text-white">Public Profile</p>
                    <p className="text-xs text-zinc-500">Allow other players to search for your profile and view stats.</p>
                  </div>
                  <button onClick={() => handleToggle('publicProfile')}>
                    {settings.publicProfile ? <ToggleRight size={36} className="text-emerald-500" /> : <ToggleLeft size={36} className="text-zinc-600" />}
                  </button>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Danger Zone</h3>
                  <button className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-3 rounded-lg font-bold text-sm w-full md:w-auto hover:bg-red-500 hover:text-white transition-colors">
                    Delete Account Permanently
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </div>

      </div>
    </div>
  );
}
