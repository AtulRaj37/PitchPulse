'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/auth.store';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Activity, Users, Settings, LogOut, Menu, X, Plus, Crown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { name: 'Match Center', href: '/dashboard', icon: Activity },
  { name: 'Tournaments', href: '/tournaments', icon: Trophy },
  { name: 'Squads', href: '/teams', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, logout, user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#050505] flex font-inter text-zinc-100 relative selection:bg-emerald-500/30">
      {/* Global Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[150px] transform -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] transform translate-y-1/4 -translate-x-1/4" />
      </div>

      {/* Mobile Toggle */}
      <button 
        className="md:hidden fixed top-5 right-5 z-50 p-2.5 bg-[#0a0f1a]/80 backdrop-blur-xl border border-white/10 rounded-xl text-zinc-300 shadow-xl"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Premium Sidebar */}
      <AnimatePresence>
        {(isMobileMenuOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && (
          <motion.aside 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
            className={clsx(
              "fixed md:sticky top-0 h-screen w-[260px] bg-[#0a0e1a]/80 backdrop-blur-2xl border-r border-white/5 flex flex-col z-40 shadow-[10px_0_30px_rgba(0,0,0,0.5)] overflow-hidden",
              isMobileMenuOpen ? "left-0" : "-left-72 md:left-0"
            )}
          >
            {/* Sidebar Inner Ambient Glow */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

            {/* Logo */}
            <div className="px-7 pt-8 pb-10 flex items-center relative z-10 w-full">
              <Link href="/dashboard" className="block w-full transition-transform hover:scale-[1.02]">
                <img 
                  src="/icons/full-logo.png" 
                  alt="PitchPulse" 
                  className="w-32 h-auto object-contain drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] mx-auto"
                />
              </Link>
            </div>
            
            {/* Quick Action CTA */}
            <div className="px-5 mb-8 relative z-10">
              <Link href="/matches/create" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-400 p-[1px] rounded-xl transition-all duration-300 shadow-[0_5px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:-translate-y-0.5">
                  <div className="bg-[#0a0e1a]/90 backdrop-blur-xl w-full h-full rounded-xl flex items-center justify-center gap-2 py-3 px-4 transition-all duration-300 group-hover:bg-transparent">
                    <Plus size={18} className="text-emerald-400 group-hover:text-zinc-950 transition-colors" />
                    <span className="font-bold text-sm text-emerald-400 group-hover:text-zinc-950 transition-colors tracking-wide">Start Match</span>
                  </div>
                </button>
              </Link>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-4 space-y-2 relative z-10 overflow-y-auto no-scrollbar">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 pl-3 mb-3">Main Menu</h4>
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link href={item.href} key={item.name} onClick={() => setIsMobileMenuOpen(false)} className="block relative focus:outline-none">
                    <div className={clsx(
                      "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group font-bold text-sm relative overflow-hidden",
                      isActive ? "text-white" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]"
                    )}>
                      {isActive && (
                        <motion.div 
                          layoutId="active-nav-bg"
                          className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent border-l-4 border-emerald-400 rounded-r-xl"
                          transition={{ type: "spring", stiffness: 250, damping: 25 }}
                        />
                      )}
                      <item.icon size={18} className={clsx(
                        "relative z-10 transition-colors duration-200", 
                        isActive ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "text-zinc-600 group-hover:text-zinc-400"
                      )} />
                      <span className="relative z-10">{item.name}</span>
                      
                      {isActive && <ChevronRight size={14} className="ml-auto relative z-10 text-emerald-500/50" />}
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Premium User Profile Card */}
            <div className="p-5 mt-auto relative z-10 bg-gradient-to-t from-black/40 to-transparent">
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-700 flex items-center justify-center font-black text-sm text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-shadow">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0a0e1a]"></div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-zinc-100 truncate">{user?.name || 'User Profile'}</p>
                  <p className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">{user?.role || 'PLAYER'}</p>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="flex items-center justify-center gap-2 py-2.5 w-full rounded-xl transition-all duration-300 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 font-bold text-xs uppercase tracking-widest"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-transparent relative z-10 w-full overflow-x-hidden">
        {/* Subtle top boundary light */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 pointer-events-none" />
        
        <div className="w-full max-w-[1600px] mx-auto min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
