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
    description: 'Real-time cricket scoring with instant updates. Track every run, wicket, and over with precision.',
  },
  {
    icon: Users,
    title: 'Tournament Management',
    description: 'Create leagues, generate fixtures, track points tables, and manage knockout stages effortlessly.',
  },
  {
    icon: Zap,
    title: 'Live Spectator Mode',
    description: 'Share matches publicly with real-time score updates via WebSocket. Perfect for distant fans.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Visualize performance with run rate graphs, partnership charts, and wagon wheels.',
  },
  {
    icon: Smartphone,
    title: 'Offline Scoring',
    description: 'Score matches without internet. Sync automatically when you\'re back online.',
  },
  {
    icon: Trophy,
    title: 'Statistics & Leaderboards',
    description: 'Track player careers, generate leaderboards, and celebrate top performers.',
  },
  {
    icon: Shield,
    title: 'Dispute Resolution',
    description: 'Built-in flagging system for scoring disputes with full event history.',
  },
  {
    icon: Globe,
    title: 'QR Code Sharing',
    description: 'Generate QR codes for instant match joining. No account required for viewers.',
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
      if (frameIndex === lastRenderedFrame) return;
      lastRenderedFrame = frameIndex;

      const img = images[frameIndex];
      if (img && imageStatus[frameIndex] && img.complete) {
        ctx.drawImage(img, dimensions.offsetX, dimensions.offsetY, dimensions.drawWidth, dimensions.drawHeight);
      } else {
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, dimensions.vw, dimensions.vh);
      }
    };

    let loadedCount = 0;
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      const paddedIndex = i.toString().padStart(4, '0');
      img.src = `/frames/frame_${paddedIndex}.webp`;
      img.onload = () => {
        imageStatus[i - 1] = true;
        loadedCount++;
        if (loadedCount === 1) {
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
          scrub: 0.2,
          onUpdate: (self) => {
            const frameIndex = Math.floor(self.progress * (FRAME_COUNT - 1));
            renderCanvas(frameIndex);

            if (self.progress > 0.05) {
              gsap.to(navbarRef.current, { backgroundColor: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', duration: 0.2 });
            } else {
              gsap.to(navbarRef.current, { backgroundColor: 'rgba(5,5,5,0)', backdropFilter: 'blur(0px)', borderBottom: '1px solid rgba(255,255,255,0)', duration: 0.2 });
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

      {/* SLEEK TOP NAVBAR */}
      <nav
        ref={navbarRef}
        className="fixed top-0 left-0 w-full z-50 transition-all duration-300 pointer-events-auto"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <div className="font-black font-clash text-2xl tracking-tighter">
            Pitch<span className="text-emerald-500">Pulse</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/login" className="text-xs uppercase tracking-widest font-bold text-zinc-400 hover:text-white transition-colors hidden sm:block">Log In</Link>
            <Link href="/register" className="relative group">
              <span className="absolute inset-0 bg-white opacity-20 group-hover:opacity-40 blur-md transition-opacity rounded-full"></span>
              <span className="relative text-xs uppercase tracking-widest font-bold bg-white text-black px-6 py-3 rounded-full hover:bg-zinc-200 transition-colors inline-block">Start Free</span>
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

            <h1 className="relative flex items-center justify-center leading-none">
              <span className="text-7xl md:text-8xl lg:text-[10rem] font-black font-clash uppercase tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                PITCH
              </span>
              <span className="text-7xl md:text-8xl lg:text-[10rem] font-black font-clash uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-cyan-500 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)] saturate-150">
                PULSE
              </span>
            </h1>

            <div className="relative mt-4 flex items-center gap-4">
              <div className="h-[1px] w-12 md:w-24 bg-gradient-to-r from-transparent to-white/40 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              <p className="text-[10px] md:text-sm font-black tracking-[0.4em] uppercase text-zinc-300 drop-shadow-md">
                The Immutable Street Ledger
              </p>
              <div className="h-[1px] w-12 md:w-24 bg-gradient-to-l from-transparent to-white/40 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            </div>

            <div className="mt-12 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/90 mix-blend-screen leading-none">Live Scoring Engine Active</span>
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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-400 text-sm font-bold tracking-widest uppercase">Now in Public Beta</span>
                </motion.div>

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
                    <div className="order-1 lg:order-2 text-6xl font-black text-zinc-100 w-16 text-center font-clash">
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
                className="shrink-0 relative w-[280px] sm:w-[320px] lg:w-[350px] z-10"
              >
                <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full"></div>
                <img
                  src="/iphone.png"
                  alt="PitchPulse App Screen"
                  className="w-full h-auto object-contain relative z-10 filter drop-shadow-[0_40px_80px_rgba(0,0,0,0.3)] hover:scale-[1.02] transition-transform duration-700"
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
                    <div className="text-6xl font-black text-zinc-100 w-16 text-center font-clash">
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
        <section className="py-32 bg-[#050505] border-t border-white/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-emerald-500 font-bold mb-4 tracking-[0.2em] uppercase text-xs block">
                The Community
              </span>
              <h2 className="text-4xl sm:text-6xl font-black font-clash text-white mb-6 uppercase tracking-tight">
                Loved by Organizers
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="p-10 rounded-3xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex gap-1 mb-8">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                    ))}
                  </div>
                  <p className="text-zinc-300 font-medium mb-10 leading-relaxed text-lg">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="text-white font-bold">{testimonial.name}</div>
                      <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <div className="relative bg-[#050505] min-h-[50vh] flex flex-col items-center justify-center text-center px-6 pb-32 pt-16 border-t border-white/5">
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black font-clash uppercase text-white mb-10 tracking-tighter drop-shadow-xl">
            Ignite your <br className="hidden md:block" />tournament
          </h2>

          <Link href="/register">
            <button className="group relative inline-flex items-center justify-center gap-3 bg-white text-[#050505] px-10 py-5 rounded-full font-black text-base uppercase tracking-widest transition-transform hover:scale-[1.02] active:scale-95">
              <span className="absolute inset-0 rounded-full bg-white blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></span>
              <span className="relative">Deploy Engine</span>
              <ChevronRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>

          <p className="mt-12 text-zinc-600 font-bold tracking-[0.3em] uppercase text-[10px]">
            PitchPulse &copy; 2026. Built by Atul Raj.
          </p>
        </div>

      </div>
    </div>
  );
}
