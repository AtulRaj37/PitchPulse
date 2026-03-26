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
    <div className="min-h-screen bg-zinc-950 flex font-sans text-zinc-100 relative selection:bg-primary-500/30">
      {/* Global Ambient Glow using Zinc/Emerald */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[0] overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-primary-500/10 rounded-full blur-[150px] transform -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-500/5 rounded-full blur-[150px] transform translate-y-1/4 -translate-x-1/4" />
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
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
            className={clsx(
              "fixed md:sticky top-0 md:top-4 h-screen md:h-[calc(100vh-32px)] w-[280px] md:ml-4 bg-[#050505]/90 backdrop-blur-3xl md:rounded-[2rem] border-r md:border border-white/5 flex flex-col z-40 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden",
              isMobileMenuOpen ? "left-0" : "-left-[300px] md:left-0"
            )}
          >
            {/* Sidebar Inner Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

            {/* Logo */}
            <div className="px-8 pt-10 pb-8 flex items-center relative z-10 w-full text-center">
              <Link href="/dashboard" className="block w-full transition-transform hover:scale-105 group relative">
                <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/20 blur-[30px] rounded-full transition-all duration-700" />
                <img 
                  src="/icons/full-logo.png" 
                  alt="PitchPulse" 
                  className="w-36 h-auto object-contain mx-auto relative z-10 drop-shadow-2xl"
                />
              </Link>
            </div>
            
            {/* Quick Action CTA */}
            <div className="px-6 mb-12 relative z-10 w-full">
              <Link href="/matches/create" onClick={() => setIsMobileMenuOpen(false)} className="group block w-full relative outline-none">
                 <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none" />
                 <button className="relative w-full flex items-center justify-between p-4 bg-zinc-950 border border-emerald-500/30 rounded-2xl transition-all duration-300 group-hover:border-emerald-400 group-hover:bg-[#050505] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_20px_rgba(16,185,129,0.2)]">
                   <span className="font-black font-clash tracking-widest text-[#f5f5f5] uppercase group-hover:text-emerald-400 transition-colors drop-shadow-sm">Start Match</span>
                   <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-400 group-hover:text-zinc-950 group-hover:rotate-90 group-hover:scale-110 transition-all duration-500 shadow-inner">
                     <Plus size={16} strokeWidth={3} />
                   </div>
                 </button>
              </Link>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-8 space-y-3 relative z-10 overflow-y-auto no-scrollbar">
              <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-6 pl-2">Platform</h4>
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link href={item.href} key={item.name} onClick={() => setIsMobileMenuOpen(false)} className="block relative focus:outline-none group">
                    <div className="flex items-center">
                      {/* Animated Hover Line */}
                      <div className={clsx(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-500 ease-[cubic-bezier(0.87,0,0.13,1)]",
                        isActive ? "h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "h-0 bg-emerald-400 group-hover:h-2/3 opacity-0 group-hover:opacity-100"
                      )} />
                      
                      <div className={clsx(
                        "flex items-center gap-4 transition-all duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] w-full py-3",
                        isActive ? "pl-5 text-white" : "pl-3 text-zinc-500 group-hover:pl-5 group-hover:text-white"
                      )}>
                        <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={clsx(
                          "transition-all duration-500 shrink-0", 
                          isActive ? "text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] scale-110" : "group-hover:text-emerald-400 group-hover:scale-110"
                        )} />
                        <span className="font-black font-display text-sm uppercase tracking-[0.15em] transition-colors duration-300 drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis">
                          {item.name}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Premium User Profile Card */}
            <div className="p-6 mt-auto relative z-10 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent pt-12">
              <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)} className="block outline-none group">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/50 border border-white/5 transition-all cursor-pointer shadow-xl relative overflow-hidden backdrop-blur-2xl group-hover:border-emerald-500/20 group-hover:bg-emerald-950/10">
                  {/* Sweep Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                  
                  <div className="flex items-center gap-4 relative z-10 w-full min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-black text-xl text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] group-hover:scale-105 transition-all duration-300 border border-emerald-300/30">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </div>
                    
                    <div className="min-w-0 flex-1 flex flex-col justify-center overflow-hidden">
                      <p className="text-sm font-black font-clash tracking-widest text-[#f5f5f5] uppercase group-hover:text-emerald-400 transition-colors drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis">{user?.name || 'User Profile'}</p>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        logout();
                        router.push('/login');
                      }}
                      className="text-zinc-600 hover:text-red-400 p-2.5 rounded-xl hover:bg-red-500/10 transition-colors relative z-20 shrink-0 ml-1 group/btn"
                      title="Sign Out"
                    >
                      <LogOut size={18} className="transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      
      {/* Main Content Area with Page Transitions */}
      <main className="flex-1 min-w-0 bg-transparent relative w-full overflow-x-hidden flex flex-col items-center">
        {/* Subtle top boundary light */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 pointer-events-none z-20 hidden md:block" />
        
        <div className="w-full max-w-[1600px] flex-1 flex flex-col relative z-10">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 15, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-1 w-full min-h-screen"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
