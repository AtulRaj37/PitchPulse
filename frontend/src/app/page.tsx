'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { motion } from 'framer-motion';
import {
  Activity,
  Users,
  Trophy,
  Zap,
  Shield,
  Smartphone,
  BarChart3,
  Globe,
  ChevronRight,
  Star,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/layout/footer';

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 240;

const scrambleText = (element: HTMLElement, finalTxt: string, duration: number = 1000) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let start = Date.now();

  const tick = () => {
    let now = Date.now();
    let progress = Math.min((now - start) / duration, 1);

    let result = '';
    for (let i = 0; i < finalTxt.length; i++) {
      if (finalTxt[i] === ' ') {
        result += ' ';
      } else if (progress > i / finalTxt.length) {
        result += finalTxt[i];
      } else {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    element.innerText = result;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.innerText = finalTxt;
    }
  };
  requestAnimationFrame(tick);
};

// --- PREVIOUS PAGE CONTENT ---
const features = [
  {
    icon: Activity,
    title: 'Ball-by-Ball Scoring',
    description: 'Tap to score every delivery — runs, extras, wickets, and shot types — all captured with precision in real time.',
  },
  {
    icon: Users,
    title: 'Tournament Engine',
    description: 'Set up leagues, round-robins, or knockouts in minutes. Automatic fixtures, points tables, and standings.',
  },
  {
    icon: Zap,
    title: 'Live Spectator Mode',
    description: 'Share a live link or QR code. Fans see ball-by-ball updates instantly via WebSocket — zero delay.',
  },
  {
    icon: BarChart3,
    title: 'Wagon Wheel & Analytics',
    description: 'Shot maps, run-rate graphs, partnership breakdowns, and bowler economy — all generated automatically.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Design',
    description: 'Built for the field. Score matches on any phone with a buttery-smooth, native-app experience.',
  },
  {
    icon: Trophy,
    title: 'Player Profiles & Stats',
    description: 'Career batting averages, strike rates, bowling figures, and head-to-head records for every player.',
  },
  {
    icon: Shield,
    title: 'Undo & Audit Trail',
    description: 'Made a mistake? Undo any delivery. Full event-sourced history means every action is traceable.',
  },
  {
    icon: Globe,
    title: 'Instant Match Sharing',
    description: 'Generate a QR code or shareable link. Viewers can follow the match live — no account needed.',
  },
];

const testimonials = [
  {
    name: 'Rajesh Kumar',
    role: 'Club Organizer',
    avatar: 'RK',
    content: 'PitchPulse transformed how we manage our weekend cricket league. The real-time scoring keeps everyone engaged.',
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'Tournament Director',
    avatar: 'PS',
    content: 'The tournament management features saved us countless hours. Fixtures, points tables, all automated!',
    rating: 5,
  },
  {
    name: 'Amit Patel',
    role: 'Local Coach',
    avatar: 'AP',
    content: 'Offline scoring was a game-changer for matches in areas with poor network coverage.',
    rating: 5,
  },
];

export default function HybridLandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navbarRef = useRef<HTMLElement>(null);

  const hookRef = useRef<HTMLDivElement>(null);
  const disputeRef = useRef<HTMLDivElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const stackRef1 = useRef<HTMLSpanElement>(null);
  const stackRef2 = useRef<HTMLSpanElement>(null);
  const stackRef3 = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // 1. Initializing Lenis with optimized settings
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.2
    });

    lenis.on('scroll', ScrollTrigger.update);

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const images: HTMLImageElement[] = [];
    const imageStatus: boolean[] = [];
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    // Canvas Performance Optimization variables 
    let lastRenderedFrame = -1;
    let dimensions = { drawWidth: 0, drawHeight: 0, offsetX: 0, offsetY: 0, vw: 0, vh: 0 };

    const calculateDimensions = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      canvas.width = vw;
      canvas.height = vh;
      dimensions.vw = vw;
      dimensions.vh = vh;

      const sampleImg = images.find(img => img && img.complete && img.naturalHeight !== 0);
      if (sampleImg) {
        const imgRatio = sampleImg.width / sampleImg.height;
        const canvasRatio = vw / vh;
        if (imgRatio > canvasRatio) {
          dimensions.drawWidth = vh * imgRatio;
          dimensions.drawHeight = vh;
          dimensions.offsetX = (vw - dimensions.drawWidth) / 2;
          dimensions.offsetY = 0;
        } else {
          dimensions.drawWidth = vw;
          dimensions.drawHeight = vw / imgRatio;
          dimensions.offsetX = 0;
          dimensions.offsetY = (vh - dimensions.drawHeight) / 2;
        }
      }
      const current = lastRenderedFrame === -1 ? 0 : lastRenderedFrame;
      lastRenderedFrame = -1;
      renderCanvas(current);
    };

    const renderCanvas = (frameIndex: number) => {
      // Prevents black flickering during fast scrolls
      let renderIndex = frameIndex;
      while (renderIndex >= 0 && (!imageStatus[renderIndex] || !images[renderIndex].complete)) {
        renderIndex--;
      }

      if (renderIndex === lastRenderedFrame) return;
      lastRenderedFrame = renderIndex;

      if (renderIndex >= 0) {
        const img = images[renderIndex];
        ctx.drawImage(img, dimensions.offsetX, dimensions.offsetY, dimensions.drawWidth, dimensions.drawHeight);
      } else {
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, dimensions.vw, dimensions.vh);
      }
    };

    let loadedCount = 0;
    // Invisible canvas setup to force GPU hardware decoding off the scroll thread
    let preloadCanvas: HTMLCanvasElement | null = null;
    let preloadCtx: CanvasRenderingContext2D | null = null;
    if (typeof window !== 'undefined') {
      preloadCanvas = document.createElement('canvas');
      preloadCanvas.width = 1;
      preloadCanvas.height = 1;
      preloadCtx = preloadCanvas.getContext('2d', { alpha: false, willReadFrequently: true });
    }

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      const paddedIndex = i.toString().padStart(4, '0');
      img.src = `/frames/frame_${paddedIndex}.webp`;
      img.onload = () => {
        // Force the browser to silently decompress the massive WebP image right now
        // instead of doing it later when the user actually scrolls to it
        if (preloadCtx) {
          preloadCtx.drawImage(img, 0, 0, 1, 1);
        }
        
        imageStatus[i - 1] = true;
        loadedCount++;
        // If this is the very first image to load OR it is the specific first frame, calculate dimensions
        if (loadedCount === 1 || i === 1) {
          calculateDimensions();
        }
      };
      img.onerror = () => { imageStatus[i - 1] = false; };
      images.push(img);
    }

    const ctx_gsap = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=2500',
          pin: true,
          scrub: 0.2, // Restored the original 0.2 scrub for perfect Lenis compatibility
          onUpdate: (self) => {
            const frameIndex = Math.floor(self.progress * (FRAME_COUNT - 1));
            renderCanvas(frameIndex);

            if (self.progress > 0.05) {
              gsap.to(navbarRef.current, { 
                backgroundColor: 'rgba(5,5,5,0.6)', 
                backdropFilter: 'blur(24px)', 
                borderColor: 'rgba(255,255,255,0.08)', 
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
                y: 0,
                duration: 0.4,
                ease: "power2.out"
              });
            } else {
              gsap.to(navbarRef.current, { 
                backgroundColor: 'rgba(5,5,5,0)', 
                backdropFilter: 'blur(0px)', 
                borderColor: 'rgba(255,255,255,0)', 
                boxShadow: '0 0px 0px rgba(0,0,0,0)',
                y: 10,
                duration: 0.4,
                ease: "power2.out"
              });
            }
          }
        }
      });

      tl.to(hookRef.current, { opacity: 1, scale: 1, duration: 1, ease: 'power4.out' }, 0);
      tl.to(hookRef.current, { opacity: 0, scale: 1.05, filter: 'blur(10px)', duration: 1, ease: 'power2.in' }, 2);

      tl.fromTo(disputeRef.current,
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 1.5, ease: 'power3.out' },
        3
      );
      tl.to(disputeRef.current, { opacity: 0, x: -50, filter: 'blur(10px)', duration: 1 }, 5);

      tl.fromTo(archRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 1.5, ease: 'power3.out',
          onStart: () => {
            if (stackRef1.current && stackRef2.current && stackRef3.current) {
              scrambleText(stackRef1.current, 'NEXT.JS', 800);
              setTimeout(() => scrambleText(stackRef2.current!, 'FASTIFY', 800), 100);
              setTimeout(() => scrambleText(stackRef3.current!, 'POSTGRESQL', 800), 200);
            }
          }
        },
        6
      );
      tl.to(archRef.current, { opacity: 0, duration: 1 }, 8);
    }, containerRef);

    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);

    return () => {
      lenis.destroy();
      ctx_gsap.revert();
      ScrollTrigger.getAll().forEach(t => t.kill());
      window.removeEventListener('resize', calculateDimensions);
    };
  }, []);

  return (
    <div className="bg-[#050505] min-h-screen text-white font-inter overflow-hidden relative selection:bg-emerald-500/30">

      {/* NOISE GRAIN */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.04] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
      />

      {/* PREMIUM FLOATING PILL NAVBAR */}
      <nav
        ref={navbarRef}
        className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 transition-all pointer-events-auto rounded-full border border-transparent translate-y-[10px]"
      >
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="hover:scale-[1.02] transition-transform flex items-center gap-2 sm:gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/icons/logo-only.png" 
              alt="PitchPulse Logo" 
              className="h-6 sm:h-8 md:h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/icons/text-only.png" 
              alt="PitchPulse" 
              className="h-3 sm:h-4 md:h-6 w-auto object-contain"
            />
          </Link>
          
          <div className="hidden lg:flex items-center gap-10 text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-400">
            <button onClick={() => window.scrollTo({ top: window.innerHeight * 1.5, behavior: 'smooth' })} className="hover:text-emerald-400 transition-colors relative group">
              Features
              <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-emerald-400 transition-all group-hover:w-full"></span>
            </button>
            <button onClick={() => window.scrollTo({ top: window.innerHeight * 2.5, behavior: 'smooth' })} className="hover:text-emerald-400 transition-colors relative group">
              Ecosystem
              <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-emerald-400 transition-all group-hover:w-full"></span>
            </button>
            <button onClick={() => window.scrollTo({ top: window.innerHeight * 3.2, behavior: 'smooth' })} className="hover:text-emerald-400 transition-colors relative group">
              Community
              <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-emerald-400 transition-all group-hover:w-full"></span>
            </button>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="text-xs uppercase tracking-widest font-bold text-zinc-400 hover:text-white transition-colors hidden sm:block relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-white after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-right hover:after:origin-left">
              Log In
            </Link>
            <Link href="/register" className="relative group shrink-0">
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-500 opacity-20 group-hover:opacity-60 blur-md transition-opacity rounded-full"></span>
              <span className="relative flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs uppercase tracking-widest font-bold bg-white text-black px-4 py-2 sm:px-6 sm:py-2.5 rounded-full hover:bg-zinc-100 transition-colors">
                Start Free
                <ChevronRight className="w-3 sm:w-3.5 h-3 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* -----------------------------
          HERO 3D CINEMATIC CANVAS 
          ----------------------------- */}
      <div ref={containerRef} className="relative w-full h-screen bg-[#050505]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/60 z-10" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-l from-[#050505]/40 via-transparent to-[#050505]/40 z-10" />

        <div ref={hookRef} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 opacity-0 scale-95">
          <div className="relative flex flex-col items-center">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

            <h1 className="relative flex flex-col md:flex-row items-center justify-center leading-none mt-4 md:mt-0 z-10">
              <span 
                className="relative text-7xl sm:text-8xl md:text-[8rem] lg:text-[12rem] font-normal uppercase tracking-tighter text-white drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]"
                style={{ fontFamily: 'var(--font-sprintura), sans-serif', textShadow: '0 0 40px rgba(255,255,255,0.2)' }}
              >
                PITCH
              </span>
              <span 
                className="relative text-7xl sm:text-8xl md:text-[8rem] lg:text-[12rem] font-normal uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] saturate-200 mt-2 md:mt-0 md:-ml-4 lg:-ml-8"
                style={{ fontFamily: 'var(--font-sprintura), sans-serif', filter: 'drop-shadow(0px 0px 25px rgba(16, 185, 129, 0.3))' }}
              >
                PULSE
              </span>
            </h1>

            <div className="relative mt-6 md:mt-2 flex items-center gap-4 z-10">
              <div className="h-[2px] w-16 md:w-32 bg-gradient-to-r from-transparent via-emerald-500/50 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.8)] rounded-full" />
              <p className="text-[10px] md:text-sm font-black tracking-[0.5em] uppercase text-zinc-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                The Immutable Street Ledger
              </p>
              <div className="h-[2px] w-16 md:w-32 bg-gradient-to-l from-transparent via-cyan-500/50 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] rounded-full" />
            </div>

          </div>
        </div>

        <div ref={disputeRef} className="absolute inset-y-0 left-0 w-full md:w-1/2 flex items-center px-6 md:px-16 lg:px-24 pointer-events-none z-20 opacity-0">
          <div className="relative">
            <div className="absolute -inset-10 bg-rose-500/10 blur-3xl rounded-full" />
            <h2 className="relative text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 font-clash leading-tight drop-shadow-xl">
              Umpire&apos;s Call Reversed? <br /><span className="text-rose-500">No Problem.</span>
            </h2>
            <p className="relative text-zinc-300 text-sm md:text-base leading-relaxed font-medium max-w-sm drop-shadow-md border-l-2 border-rose-500/30 pl-4 py-1">
              Standard scoring apps fail on the turf. PitchPulse allows you to safely pause, reverse, and replay any ball without corrupting the match state.
            </p>
          </div>
        </div>

        <div ref={archRef} className="absolute bottom-[10vh] left-0 w-full flex justify-center px-6 pointer-events-none z-20 opacity-0">
          <div className="flex flex-col items-center">
            <h2 className="text-xs md:text-sm font-bold text-zinc-500 mb-6 tracking-[0.2em] uppercase">
              Event Sourcing Architecture for the Turf
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-lg">
              <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 px-6 py-3 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                <span ref={stackRef1} className="text-sm md:text-base font-black font-jetbrains tracking-wider text-white">------</span>
              </div>
              <div className="backdrop-blur-xl bg-emerald-500/[0.05] border border-emerald-500/20 px-6 py-3 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <span ref={stackRef2} className="text-sm md:text-base font-black font-jetbrains tracking-wider text-emerald-400">-------</span>
              </div>
              <div className="backdrop-blur-xl bg-cyan-500/[0.05] border border-cyan-500/20 px-6 py-3 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                <span ref={stackRef3} className="text-sm md:text-base font-black font-jetbrains tracking-wider text-cyan-400">----------</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* -----------------------------
          APP FEATURES (STANDARD SCROLL)
          ----------------------------- */}
      <div className="relative z-30 bg-[#050505]">

        {/* ADDED INFO HERO SECTION */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#050505] border-t border-white/5 pt-10 pb-20">
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-zinc-950 to-[#050505]" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl mix-blend-screen" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl mix-blend-screen" />

          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              <div className="text-center lg:text-left">


                <motion.h2
                  initial={{ y: 40, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-black font-clash tracking-tight mb-6 text-white"
                >
                  Score Cricket
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">Like a Pro</span>
                </motion.h2>

                <motion.p
                  initial={{ y: 40, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 mb-10 font-medium leading-relaxed"
                >
                  The ultimate hyper-local cricket scoring platform. Ball-by-ball updates,
                  tournament management, and live spectator mode — all in one place.
                </motion.p>

                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                >
                  <Link href="/register">
                    <Button size="xl" className="w-full sm:w-auto gap-2 text-base font-bold rounded-xl px-8 h-14 bg-emerald-500 hover:bg-emerald-400 text-black border-none transition-transform hover:scale-[1.02]">
                      Start Scoring Free
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/live/demo">
                    <Button variant="outline" size="xl" className="w-full sm:w-auto gap-2 text-base font-bold rounded-xl px-8 h-14 border-white/20 text-white hover:bg-white/5 transition-colors">
                      <Play className="w-5 h-5 fill-white" />
                      Watch Demo
                    </Button>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="mt-12 flex items-center gap-6 justify-center lg:justify-start"
                >
                  <div className="flex -space-x-3">
                    {['JK', 'VS', 'AK', 'PM'].map((initials, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-black text-white border-2 border-[#050505] shadow-lg"
                      >
                        {initials}
                      </div>
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="text-white font-black">500+ Teams</div>
                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Already scoring</div>
                  </div>
                </motion.div>
              </div>

              {/* Right Visual Dashboard Simulation */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                className="relative hidden lg:block"
              >
                <div className="relative w-full aspect-square max-w-lg mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl opacity-50" />

                  <div className="absolute inset-8 rounded-3xl bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 p-6 shadow-2xl">
                    <div className="bg-white/5 rounded-2xl p-6 mb-4 border border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <span className="flex items-center gap-1.5 bg-rose-500/10 text-rose-500 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border border-rose-500/20">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                          </span>
                          LIVE
                        </span>
                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">T20 • Over 12.3</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1.5">Mumbai Warriors</div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black font-clash text-white">142</span>
                            <span className="text-zinc-500 font-bold text-lg">/4</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1.5">Delhi Dynamite</div>
                          <div className="text-xl font-bold text-emerald-400 font-jetbrains mt-3">RR: 8.5</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <span className="text-emerald-400 text-sm font-black">RV</span>
                          </div>
                          <div>
                            <div className="text-white text-sm font-bold">Rohit Verma *</div>
                            <div className="text-zinc-500 text-xs tracking-widest uppercase font-bold mt-0.5">Striker</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 font-black text-xl">67</div>
                          <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">42b (6×4, 2×6)</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center">
                            <span className="text-zinc-400 text-sm font-black">SK</span>
                          </div>
                          <div>
                            <div className="text-zinc-300 text-sm font-bold">Suresh Kumar</div>
                            <div className="text-zinc-500 text-xs tracking-widest uppercase font-bold mt-0.5">Non-Striker</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-zinc-300 font-black text-xl">23</div>
                          <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">18b (3×4, 1×6)</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <span className="text-amber-400 text-sm font-black">AH</span>
                          </div>
                          <div>
                            <div className="text-white text-sm font-bold">Ashwin Hassan</div>
                            <div className="text-zinc-500 text-xs tracking-widest uppercase font-bold mt-0.5">Bowler</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-amber-400 font-black text-lg">4.3-0-32-2</div>
                          <div className="text-zinc-500 text-[10px] tracking-widest uppercase font-bold mt-0.5">Econ: 7.1</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-between gap-1">
                      {['0', '1', 'W', '4', '2', '1', '6'].map((run, i) => (
                        <div
                          key={i}
                          className={`flex-1 aspect-square rounded-xl flex items-center justify-center text-xs font-black ${run === 'W'
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : run === '4'
                                ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                                : run === '6'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : 'bg-white/5 text-zinc-400 border border-white/5'
                            }`}
                        >
                          {run}
                        </div>
                      ))}
                    </div>
                  </div>

                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] border-4 border-[#050505] z-20"
                  >
                    <Trophy className="w-7 h-7 text-[#050505] fill-[#050505]" />
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}
                    className="absolute -bottom-6 -left-6 w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)] border-4 border-[#050505] z-20"
                  >
                    <Star className="w-9 h-9 text-[#050505] fill-[#050505]" />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="py-24 border-y border-white/5 bg-white/[0.01]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-x divide-white/5">
              <div className="text-center">
                <div className="text-5xl font-black text-white mb-2 font-clash tracking-tight">10K+</div>
                <div className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Matches Scored</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black text-white mb-2 font-clash tracking-tight">500+</div>
                <div className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black text-white mb-2 font-clash tracking-tight">50+</div>
                <div className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Tournaments</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black text-emerald-400 mb-2 font-clash tracking-tight drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">LIVE</div>
                <div className="text-zinc-500 font-bold uppercase tracking-widest text-xs">0-Delay Sync</div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid & iPhone */}
        <section className="py-32 bg-white text-zinc-950">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center mb-24">
              <h2 className="text-5xl sm:text-7xl font-black font-clash uppercase tracking-tighter text-black">
                Why Pitch<span className="text-emerald-500">Pulse</span>?
              </h2>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-20">
              <div className="flex-1 flex flex-col gap-12 w-full lg:mb-0 mb-10">
                {features.slice(0, 4).map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col lg:flex-row lg:justify-end items-center lg:items-start gap-6"
                  >
                    <div className="order-2 lg:order-1 text-center lg:text-right">
                      <h3 className="text-xl font-black text-black mb-2 uppercase tracking-wide">{feature.title}</h3>
                      <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-sm">{feature.description}</p>
                    </div>
                    <div className="order-1 lg:order-2 text-7xl font-black w-20 text-center font-clash text-zinc-200">
                      {`0${index + 1}`}
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="shrink-0 relative w-[280px] sm:w-[320px] lg:w-[350px] z-10 group/phone"
              >
                <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full"></div>
                
                {/* Primary Image - phone1.png (visible by default, hidden on hover) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/phone1.png"
                  alt="PitchPulse App - Home Screen"
                  className="w-full h-auto object-contain relative z-10 filter drop-shadow-[0_40px_80px_rgba(0,0,0,0.3)] block group-hover/phone:hidden"
                />
                
                {/* Hover Image - phone2.png (hidden by default, shown on hover) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/phone2.png"
                  alt="PitchPulse App - Scoring Screen"
                  className="w-full h-auto object-contain relative z-10 filter drop-shadow-[0_40px_80px_rgba(0,0,0,0.3)] hidden group-hover/phone:block"
                />
              </motion.div>

              <div className="flex-1 flex flex-col gap-12 w-full mt-10 lg:mt-0">
                {features.slice(4, 8).map((feature, index) => (
                  <motion.div
                    key={index + 4}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col lg:flex-row items-center lg:items-start gap-6"
                  >
                    <div className="text-7xl font-black w-20 text-center font-clash text-zinc-200">
                      {`0${index + 5}`}
                    </div>
                    <div className="text-center lg:text-left">
                      <h3 className="text-xl font-black text-black mb-2 uppercase tracking-wide">{feature.title}</h3>
                      <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-sm">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-32 bg-[#050505] border-t border-white/5 relative overflow-hidden">
          {/* Background ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-emerald-500/5 blur-[200px] rounded-full pointer-events-none" />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-emerald-500 font-bold mb-4 tracking-[0.3em] uppercase text-[10px] block">
                Trusted by Organizers
              </span>
              <h2 className="text-4xl sm:text-6xl font-black font-clash text-white mb-6 uppercase tracking-tight">
                Voices from the <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">Field</span>
              </h2>
              <p className="text-zinc-500 font-medium text-base max-w-md mx-auto">
                See what cricket organizers across the country are saying about PitchPulse.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="relative p-8 lg:p-10 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-emerald-500/30 transition-all duration-500 group"
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="relative z-10">
                    {/* Quote mark */}
                    <div className="text-5xl font-black text-emerald-500/20 leading-none mb-4 font-serif">&ldquo;</div>
                    
                    <div className="flex gap-1 mb-6">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                      ))}
                    </div>
                    
                    <p className="text-zinc-300 font-medium mb-8 leading-relaxed text-base lg:text-lg">
                      {testimonial.content}
                    </p>
                    
                    <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-black text-sm text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">{testimonial.name}</div>
                        <div className="text-emerald-500/70 text-xs font-bold uppercase tracking-wider">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Premium Footer */}
        <footer className="relative bg-[#020202] border-t border-white/5 pt-32 pb-12 overflow-hidden">
          {/* Subtle glowing ambient background effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-gradient-to-b from-emerald-500/10 to-transparent blur-[120px] pointer-events-none -z-10 text-[#020202]" />

          <div className="container mx-auto px-6 lg:px-10 max-w-7xl">
            {/* Grand CTA Banner */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-center justify-between p-12 lg:p-16 rounded-[2.5rem] bg-gradient-to-br from-[#0a0f1a] to-[#050a12] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden mb-24 group"
            >
              {/* Animated gradient border glow */}
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-xl pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              
              {/* Decorative cricket ball */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -right-10 -top-10 w-40 h-40 rounded-full border-2 border-dashed border-emerald-500/10 hidden lg:block"
              />
              
              <div className="relative z-10 md:w-1/2 text-center md:text-left mb-10 md:mb-0">
                <span className="text-emerald-500 font-bold tracking-[0.3em] uppercase text-[10px] mb-4 block">Ready to play?</span>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black font-clash text-white tracking-tighter leading-[1.1]">
                  Every ball <br className="hidden lg:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">counts.</span>
                </h2>
                <p className="mt-6 text-zinc-400 font-medium text-base lg:text-lg leading-relaxed max-w-md mx-auto md:mx-0">
                  Start scoring your next match with PitchPulse — the most advanced cricket scoring engine built for the gully.
                </p>
              </div>
              <div className="relative z-10 md:w-1/2 flex justify-center md:justify-end">
                <Link href="/register">
                  <button className="group/btn relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-400 to-emerald-500 text-[#050505] px-8 py-4 md:px-12 md:py-5 rounded-full font-black text-sm lg:text-base uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-95 shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]">
                    <span className="relative">Start Scoring Now</span>
                    <ChevronRight className="relative w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform" />
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* Structured Links Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-24">
              <div className="lg:pr-8">
                <Link href="/" className="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/logo-only.png" alt="PitchPulse" className="h-8 w-auto object-contain drop-shadow-xl" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/text-only.png" alt="PitchPulse" className="h-5 w-auto object-contain" />
                </Link>
                <p className="text-zinc-500 text-sm leading-loose font-medium mb-8">
                  Built for the gully. Powered by precision. The cricket scoring platform that takes your local tournament to the next level.
                </p>
                <div className="flex items-center gap-4">
                  <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all">
                    <Activity size={18} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all">
                    <Globe size={18} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all">
                    <Users size={18} />
                  </a>
                </div>
              </div>

              <div>
                <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8">Platform</h4>
                <ul className="space-y-4">
                  <li><Link href="/dashboard" className="text-zinc-400 hover:text-emerald-400 text-sm font-medium transition-colors">Match Center</Link></li>
                  <li><Link href="/tournaments" className="text-zinc-400 hover:text-emerald-400 text-sm font-medium transition-colors">Tournament Engine</Link></li>
                  <li><a href="#" className="text-zinc-400 hover:text-emerald-400 text-sm font-medium transition-colors">Live Spectator</a></li>
                  <li><Link href="/teams" className="text-zinc-400 hover:text-emerald-400 text-sm font-medium transition-colors">Squad Manager</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8">Product</h4>
                <ul className="space-y-4">
                  <li><a href="#" className="text-zinc-400 hover:text-emerald-400 text-sm font-medium transition-colors">Wagon Wheel</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-emerald-400 text-sm font-medium transition-colors">Shot Selection</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-emerald-400 text-sm font-medium transition-colors">Commentary Feed</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-emerald-400 text-sm font-medium transition-colors">Player Analytics</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8">Developer</h4>
                <ul className="space-y-4">
                  <li><a href="#" className="text-zinc-400 hover:text-emerald-400 text-sm font-medium transition-colors">API Reference</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-emerald-400 text-sm font-medium transition-colors">Event Sourcing</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-emerald-400 text-sm font-medium transition-colors">WebSocket Docs</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-emerald-400 text-sm font-medium transition-colors">Open Source</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Signature Line */}
            <div className="pt-8 flex flex-col md:flex-row items-center justify-between border-t border-white/10">
              <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px] mb-4 md:mb-0">
                &copy; {new Date().getFullYear()} PitchPulse. All rights reserved.
              </p>
              <p className="text-zinc-500 font-medium text-xs flex items-center gap-1.5">
                Engineered with precision by <span className="text-emerald-400 font-bold tracking-wide uppercase px-1">Atul Raj</span>
              </p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
