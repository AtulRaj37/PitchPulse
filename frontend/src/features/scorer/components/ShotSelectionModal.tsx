import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, X } from 'lucide-react';
import clsx from 'clsx';

export type ShotArea = 
  | 'LONG_ON' | 'LONG_OFF' | 'EXTRA_COVER' | 'COVER' | 'POINT'
  | 'THIRD_MAN' | 'FINE_LEG' | 'SQUARE_LEG' | 'MID_WICKET' | 'STRAIGHT';

export type ShotType =
  | 'DRIVE' | 'COVER_DRIVE' | 'STRAIGHT_DRIVE' | 'CUT' | 'LATE_CUT'
  | 'PULL' | 'HOOK' | 'SWEEP' | 'SLOG_SWEEP' | 'REVERSE_SWEEP'
  | 'FLICK' | 'GLANCE' | 'LOFTED_SHOT' | 'HELICOPTER' 
  | 'PUNCH' | 'UPPER_CUT' | 'SCOOP' | 'DEFENCE' | 'LEAVE';

interface ShotSelectionModalProps {
  onSave: (data: { shotArea?: ShotArea; shotType?: ShotType }) => void;
  onCancel: () => void;
  runsScored: number;
  strikerName?: string;
}

const WAGON_WHEEL_ZONES: { id: ShotArea; label: string; start: number; end: number }[] = [
  { id: 'THIRD_MAN', label: 'Third Man', start: 315, end: 360 },
  { id: 'FINE_LEG', label: 'Deep Fine Leg', start: 0, end: 45 },
  { id: 'SQUARE_LEG', label: 'Deep Square Leg', start: 45, end: 90 },
  { id: 'MID_WICKET', label: 'Deep Mid Wicket', start: 90, end: 135 },
  { id: 'LONG_ON', label: 'Long On', start: 135, end: 180 },
  { id: 'LONG_OFF', label: 'Long Off', start: 180, end: 225 },
  { id: 'COVER', label: 'Deep Cover', start: 225, end: 270 },
  { id: 'POINT', label: 'Deep Point', start: 270, end: 315 }
];

const SHOT_GROUPS: { category: string; shots: { id: ShotType; label: string }[] }[] = [
  {
    category: "Attacking & Fast",
    shots: [
      { id: 'COVER_DRIVE', label: 'Cover Drive' },
      { id: 'STRAIGHT_DRIVE', label: 'Straight Drive' },
      { id: 'CUT', label: 'Square Cut' },
      { id: 'LATE_CUT', label: 'Late Cut' },
      { id: 'PULL', label: 'Pull Short' },
      { id: 'HOOK', label: 'Hook Shot' },
      { id: 'SWEEP', label: 'Sweep' },
    ]
  },
  {
    category: "Lofted & Power",
    shots: [
      { id: 'LOFTED_SHOT', label: 'Lofted Drive' },
      { id: 'SLOG_SWEEP', label: 'Slog Sweep' },
      { id: 'HELICOPTER', label: 'Helicopter' },
      { id: 'REVERSE_SWEEP', label: 'Reverse Sweep' },
      { id: 'UPPER_CUT', label: 'Upper Cut' },
      { id: 'SCOOP', label: 'Ramp / Scoop' },
    ]
  },
  {
    category: "Defensive & Technical",
    shots: [
      { id: 'DEFENCE', label: 'Solid Defence' },
      { id: 'PUNCH', label: 'Backfoot Punch' },
      { id: 'GLANCE', label: 'Leg Glance' },
      { id: 'FLICK', label: 'Flick' },
      { id: 'DRIVE', label: 'Standard Drive' },
      { id: 'LEAVE', label: 'Leave' },
    ]
  }
];

const getWedgePath = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
  const startRad = (startAngle - 90) * Math.PI / 180.0;
  const endRad = (endAngle - 90) * Math.PI / 180.0;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
};

const getCentroid = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
  const midAngle = startAngle + (endAngle - startAngle) / 2;
  const midRad = (midAngle - 90) * Math.PI / 180.0;
  return {
    x: cx + r * Math.cos(midRad),
    y: cy + r * Math.sin(midRad)
  };
};

export function ShotSelectionModal({ onSave, onCancel, runsScored, strikerName }: ShotSelectionModalProps) {
  const [shotArea, setShotArea] = useState<ShotArea | undefined>();
  const [shotType, setShotType] = useState<ShotType | undefined>();
  const [clickLine, setClickLine] = useState<{x2: number, y2: number} | null>(null);
  const [step, setStep] = useState<'area' | 'type'>('area');
  
  const handleSave = () => {
    onSave({ shotArea, shotType });
  };

  const handleWedgeSelect = (zoneId: ShotArea, c: {x: number, y: number}) => {
    if (shotArea === zoneId) {
       setShotArea(undefined);
       setClickLine(null);
    } else {
       setShotArea(zoneId);
       setClickLine({ x2: c.x, y2: c.y });
       setTimeout(() => setStep('type'), 300);
    }
  };

  const selectedZoneLabel = WAGON_WHEEL_ZONES.find(z => z.id === shotArea)?.label || '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 lg:backdrop-blur-md p-0 lg:p-6">
      <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-[#050505] lg:border border-white/10 flex flex-col sm:rounded-[2.5rem] rounded-t-[2rem] shadow-2xl relative overflow-hidden h-[95vh] lg:h-[85vh] w-full lg:max-w-[1280px]"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#10b981] via-[#059669] to-[#10b981] z-20" />
        
        {/* Strict Header */}
        <div className="flex justify-between items-center p-5 lg:px-8 lg:py-6 shrink-0 border-b border-white/5 relative z-20 bg-black/40">
          <div>
            <h2 className="text-xl lg:text-2xl font-black font-sans text-white uppercase flex items-center gap-2 tracking-tight">
              <Target className="text-emerald-500" size={24} />
              Delivery Details
            </h2>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">
              Runs Scored: <span className="text-emerald-400 font-black text-[12px]">{runsScored}</span>
            </p>
          </div>
          <button onClick={onCancel} className="p-3 bg-zinc-900/80 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-white/5 shadow-xl">
            <X size={20} />
          </button>
        </div>

        {/* Strict Body: Dual Pane without Scrolling on Desktop */}
        <div className="flex-1 min-h-0 w-full flex flex-col lg:grid lg:grid-cols-[45%_55%] overflow-y-auto lg:overflow-hidden bg-[#050505]">
            
            {/* LEFT PANE: Wagon Wheel */}
            <div className={clsx(
              "min-h-[350px] lg:h-full bg-gradient-to-b from-[#0a0f1a] to-[#05080f] py-4 lg:py-0 border-b lg:border-b-0 lg:border-r border-emerald-500/10 relative items-center justify-center shadow-[inset_0_0_50px_rgba(16,185,129,0.02)]",
              step === 'area' ? 'flex' : 'hidden lg:flex'
            )}>
              <h3 className="absolute top-4 lg:top-6 left-4 lg:left-8 text-[10px] lg:text-xs font-black uppercase tracking-widest text-emerald-500/60 font-sans leading-tight z-20 pointer-events-none">
                STRIKER <span className="text-white ml-2">{strikerName || 'Batsman'}</span>
                <span className="text-emerald-400 text-lg lg:text-xl drop-shadow-md mt-1 block">
                  {selectedZoneLabel || 'Select Area'}
                </span>
              </h3>

              {/* Perfectly contained, guaranteed no-clip SVG wrapper */}
              <div className="relative w-full h-[90%] max-w-[400px] lg:max-w-full aspect-square flex items-center justify-center p-4">
                <svg viewBox="0 0 400 400" className="w-full h-full max-h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] filter brightness-[1.1] contrast-[1.1]" style={{ maxHeight: '100%' }}>
                  <defs>
                    <radialGradient id="grassGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#065f46" />
                      <stop offset="60%" stopColor="#064e3b" />
                      <stop offset="100%" stopColor="#022c22" />
                    </radialGradient>
                    <radialGradient id="activeWedgeGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(52, 211, 153, 0.7)" />
                      <stop offset="100%" stopColor="rgba(16, 185, 129, 0.2)" />
                    </radialGradient>
                    <filter id="outerNeon" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComponentTransfer in="blur" result="glow">
                        <feFuncA type="linear" slope="1.5" />
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <circle cx="200" cy="200" r="190" fill="url(#grassGradient)" stroke="#34d399" strokeWidth="4" filter="url(#outerNeon)" />
                  <circle cx="200" cy="200" r="185" fill="none" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4,8" />
                  <circle cx="200" cy="200" r="115" fill="none" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1.5" strokeDasharray="3,4" />
                  <circle cx="200" cy="200" r="60" fill="none" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.5" strokeDasharray="2,3" />

                  {/* Laser effect */}
                  {clickLine && (
                    <g>
                      <motion.line 
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: "easeOut" }}
                        x1="200" y1="190" x2={clickLine.x2} y2={clickLine.y2} stroke="#fbbf24" strokeWidth="7" strokeLinecap="round" strokeOpacity="0.6" filter="url(#outerNeon)"
                      />
                      <motion.line 
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: "easeOut" }}
                        x1="200" y1="190" x2={clickLine.x2} y2={clickLine.y2} stroke="#ffffff" strokeWidth="2" strokeLinecap="round" className="drop-shadow-lg"
                      />
                    </g>
                  )}

                  {/* Wedges */}
                  {WAGON_WHEEL_ZONES.map((zone) => {
                    const isActive = shotArea === zone.id;
                    const c = getCentroid(200, 200, 140, zone.start, zone.end);
                    return (
                      <g key={zone.id}>
                        <path 
                          d={getWedgePath(200, 200, 190, zone.start, zone.end)}
                          fill={isActive ? 'url(#activeWedgeGlow)' : 'transparent'}
                          stroke={isActive ? '#6ee7b7' : 'rgba(255,255,255,0.25)'}
                          strokeWidth={isActive ? '3' : '2'}
                          className="cursor-pointer transition-all duration-300 hover:fill-emerald-500/40"
                          onClick={() => handleWedgeSelect(zone.id, c)}
                        />
                        <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="middle" fill={isActive ? '#ffffff' : '#e5e7eb'} fontSize={isActive ? "15" : "12"} fontWeight="900" fontFamily="sans-serif" style={{ pointerEvents: 'none', transition: 'all 0.3s ease' }} className="uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          {zone.label.replace('Deep ', '')}
                        </text>
                      </g>
                    );
                  })}

                  <line x1="10" y1="200" x2="390" y2="200" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="2.5" strokeDasharray="8,4" />
                  <text x="60" y="193" textAnchor="middle" fill="#ffffff" fillOpacity="0.3" fontSize="22" fontWeight="900" fontFamily="sans-serif" letterSpacing="4" style={{textShadow: '0px 2px 10px rgba(0,0,0,0.8)'}}>OFF</text>
                  <text x="340" y="193" textAnchor="middle" fill="#ffffff" fillOpacity="0.3" fontSize="22" fontWeight="900" fontFamily="sans-serif" letterSpacing="4" style={{textShadow: '0px 2px 10px rgba(0,0,0,0.8)'}}>LEG</text>

                  <rect x="187" y="160" width="26" height="80" fill="#d97706" rx="3" fillOpacity="0.9" stroke="#f59e0b" strokeWidth="1" />
                  <rect x="187" y="175" width="26" height="2" fill="#ffffff" fillOpacity="0.6" />
                  <rect x="187" y="223" width="26" height="2" fill="#ffffff" fillOpacity="0.6" />
                  <g transform="translate(200, 190)">
                     <circle cx="0" cy="5" r="9" fill="#000" opacity="0.6" filter="blur(2px)" />
                     <circle cx="0" cy="0" r="6.5" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                     <rect x="-11" y="-3.5" width="22" height="7" rx="3.5" fill="#f8fafc" />
                     <rect x="-1" y="4" width="5" height="24" rx="1.5" fill="#fbbf24" transform="rotate(-30)" stroke="#b45309" strokeWidth="1" />
                  </g>
                </svg>
              </div>
            </div>

            {/* RIGHT PANE: Ultra-Premium Pill Tags & Neon Broadcast Energy */}
            <div className={clsx(
              "flex-1 lg:h-full lg:overflow-visible px-3 py-4 lg:px-12 lg:py-10 bg-[#050505] flex-col justify-start lg:justify-center relative overflow-y-auto lg:overflow-hidden",
              step === 'type' ? 'flex' : 'hidden lg:flex'
            )}>
              
              {/* Back button for mobile */}
              <button 
                onClick={() => setStep('area')} 
                className="lg:hidden flex items-center justify-center w-max gap-1.5 text-emerald-400 font-bold uppercase tracking-widest text-[9px] mb-3 self-start px-3 py-1.5 bg-emerald-500/10 rounded-full hover:bg-emerald-500/20 active:scale-95 transition-all"
              >
                ← Back to Wagon Wheel
              </button>

              {/* Subtle Ambient Emerald Glow bleeding from the left */}
              <div className="absolute top-1/2 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

              <div className="flex flex-col gap-3 lg:gap-8 w-full max-w-3xl mx-auto xl:mr-auto justify-center relative z-10">
                
                {SHOT_GROUPS.map((group, gIdx) => (
                  <motion.div 
                    key={gIdx} 
                    className="w-full"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gIdx * 0.1, duration: 0.4 }}
                  >
                    {/* Header with Neon Energy Line */}
                    <div className="flex items-center gap-2 mb-2 lg:mb-5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"></div>
                      <h4 className="text-[9px] lg:text-[11px] font-black uppercase tracking-widest text-[#f4f4f5] drop-shadow-sm flex-shrink-0">
                        {group.category}
                      </h4>
                      <div className="h-px bg-gradient-to-r from-emerald-500/50 via-emerald-500/10 to-transparent flex-1"></div>
                    </div>
                    
                    {/* Pill-Shaped Music/Sports Style Tags */}
                    <div className="flex flex-wrap gap-1.5 lg:gap-3">
                      {group.shots.map(st => {
                        const isActive = shotType === st.id;
                        return (
                          <button
                            key={st.id}
                            onClick={() => setShotType(isActive ? undefined : st.id)}
                            className={clsx(
                              "px-2.5 py-1.5 lg:px-5 lg:py-2.5 rounded-full border transition-all duration-300 outline-none flex items-center justify-center relative overflow-hidden group",
                              isActive
                                ? "bg-gradient-to-br from-emerald-500 to-emerald-400 border-transparent shadow-[0_5px_20px_rgba(16,185,129,0.35)] scale-[1.05]"
                                : "bg-[#0a0f1a] border-white/10 hover:bg-[#121926] hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] active:scale-95"
                            )}
                          >
                            {/* Active 3D Metallic Specular Highlight */}
                            {isActive && <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none"></div>}
                            
                            {/* Inactive Hover Inner Shine */}
                            {!isActive && <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>}

                            <span className={clsx(
                              "font-black uppercase tracking-widest text-[9px] lg:text-[10px] transition-colors relative z-10",
                              isActive ? "text-[#050505]" : "text-zinc-300 group-hover:text-white"
                            )}>
                              {st.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setShotType(undefined)}
                  className={clsx(
                    "w-max self-start mt-2 lg:mt-6 px-4 py-1.5 lg:px-6 lg:py-2.5 rounded-full font-black uppercase tracking-widest text-[9px] lg:text-[10px] text-center border transition-all duration-300 flex items-center gap-1.5 lg:gap-2",
                    !shotType && shotArea
                      ? "bg-zinc-800 border-zinc-600 text-white shadow-[0_5px_15px_rgba(0,0,0,0.5)] scale-[1.02]"
                      : "bg-transparent border-dashed border-white/20 text-zinc-500 hover:text-zinc-300 hover:border-white/40 hover:bg-white/5"
                  )}
                >
                  <X className={clsx("w-3 h-3 lg:w-3.5 lg:h-3.5", !shotType && shotArea ? "text-emerald-400" : "text-zinc-500")} />
                  None of the Above
                </motion.button>
              </div>
            </div>
        </div>

        {/* Strict Footer: Never overlaps, permanently anchored at the bottom edge */}
        <div className="shrink-0 flex items-center justify-between lg:justify-end gap-3 w-full border-t border-white/5 py-4 px-5 lg:px-8 bg-black/40 relative z-20">
          <button
            onClick={onCancel}
            className="flex-1 lg:flex-none px-6 py-3 rounded-xl text-xs lg:text-sm font-black uppercase tracking-widest text-[#a1a1aa] hover:text-white hover:bg-zinc-900 transition-colors border border-transparent hover:border-white/5"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            className="flex-1 lg:flex-none px-8 py-3 rounded-xl text-xs lg:text-sm bg-gradient-to-r from-emerald-500 to-emerald-400 text-[#050505] font-black uppercase tracking-widest shadow-[0_5px_15px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-95 transition-all outline-none flex items-center gap-2"
          >
            Save Delivery
          </button>
        </div>
        
      </motion.div>
    </div>
  );
}
