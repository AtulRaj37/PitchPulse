'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/auth.store';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
    } catch {}
  };

  return (
    <div className="flex min-h-screen w-full bg-app font-inter overflow-hidden">
      
      {/* LEFT PANE - LOGIN FORM */}
      <div className="w-full lg:w-[480px] xl:w-[500px] bg-[#0e1424]/95 backdrop-blur-2xl flex flex-col min-h-screen shrink-0 relative z-20 border-r border-white/5 lg:shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        
        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-14 py-12 relative z-10">
          
          {/* Subtle top glow */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>

          {/* Mobile title/logo area */}
          <div className="lg:hidden mb-10 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */ }
            <img src="/icons/full-logo.png" alt="PitchPulse" className="h-10 w-auto object-contain drop-shadow-lg" />
          </div>

          <h2 className="text-2xl text-white text-center mb-10 font-bold font-clash tracking-wide">Log in to continue</h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="relative">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/30 transition-all duration-300 ease-expo font-medium placeholder:text-zinc-600 hover:border-white/20 shadow-inner"
                placeholder="Enter your email"
              />
            </div>

            <div className="relative mt-2">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2 block">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/30 transition-all duration-300 ease-expo font-medium tracking-widest placeholder:tracking-normal placeholder:text-zinc-600 hover:border-white/20 shadow-inner"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 bottom-3.5 text-zinc-500 hover:text-cyan-400 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <div className="text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-sm font-medium mt-2 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                {error}
              </div>
            )}

            <div className="flex items-center justify-center my-4 opacity-50">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="px-4 text-[11px] font-bold text-zinc-500 tracking-wider">SECURE LOGIN</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-bold py-4 rounded-xl transition-all duration-300 ease-expo flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:from-sky-400 hover:to-cyan-300 active:scale-95 disabled:opacity-50 mt-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-xs mt-10 leading-relaxed">
            By signing in, you agree to our <br className="hidden sm:block"/>
            <Link href="#" className="font-semibold text-cyan-400 hover:underline">Terms of Service</Link> and{' '}
            <Link href="#" className="font-semibold text-cyan-400 hover:underline">Privacy Policy</Link>.
          </p>
        </div>

        {/* Bottom Footer Area */}
        <div className="px-8 sm:px-12 lg:px-14 pb-8 pt-6 border-t border-white/5 bg-[#0a0f1c]/50 backdrop-blur-md">
          <p className="text-sm text-zinc-400 font-medium text-center">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-cyan-400 font-bold hover:text-cyan-300 hover:underline ml-1 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT PANE - GRAPHIC BANNER */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center bg-app overflow-hidden">
        
        {/* Radial Ambient Backlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Top Logo */}
        <div className="absolute top-10 flex flex-col items-center justify-center w-full z-10 gap-2">
           {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/full-logo.png" alt="PitchPulse" className="h-12 lg:h-14 w-auto object-contain drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]" />
          <p className="text-cyan-400/90 text-[15px] font-medium italic mt-1 font-clash">Your cricket matters</p>
        </div>

        {/* Center Typography */}
        <div className="flex flex-col items-center justify-center -mt-16 mr-24 z-10 relative">
          <h2 className="text-zinc-500 text-[70px] lg:text-[80px] xl:text-[90px] leading-[1.1] font-normal tracking-tight">WORLD&apos;S</h2>
          <h1 className="text-white text-[95px] lg:text-[110px] xl:text-[130px] leading-[0.9] font-black tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] font-clash">LARGEST</h1>
          <div className="bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-2 mt-4 -rotate-2 shadow-[0_0_40px_rgba(16,185,129,0.3)] rounded-xl">
            <span className="text-white text-[90px] lg:text-[100px] xl:text-[120px] leading-[0.9] font-black tracking-tighter">CRICKET</span>
          </div>
          <h2 className="text-zinc-400 text-[60px] lg:text-[70px] xl:text-[80px] leading-[1.1] font-bold tracking-tight mt-8">NETWORK</h2>
          
          <div className="flex items-center gap-4 mt-12 p-3 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 px-6 py-3 shadow-[0_0_20px_rgba(6,182,212,0.4)] rounded-2xl">
              <span className="text-white text-[45px] lg:text-[50px] font-black leading-none tracking-tight">5M+</span>
            </div>
            <span className="text-zinc-300 text-[35px] lg:text-[40px] font-bold tracking-tight px-4 font-clash">CRICKETERS</span>
          </div>
        </div>
        
        {/* Floating iPhone */}
        <div className="absolute right-4 xl:right-8 top-[45%] -translate-y-1/2 w-[35%] max-w-[380px] z-10 drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/iphone.png" 
            alt="PitchPulse App Demo" 
            className="w-full h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
}
