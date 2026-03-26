export default function DashboardLoading() {
  return (
    <div className="w-full h-[80vh] flex flex-col items-center justify-center p-8">
      {/* Gamified Pulse Ring */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-t-2 border-primary-500 animate-spin opacity-80" style={{ animationDuration: '1.2s' }}></div>
        {/* Inner Ring */}
        <div className="absolute inset-2 rounded-full border-b-2 border-accent-500 animate-spin opacity-60" style={{ animationDuration: '0.8s', animationDirection: 'reverse' }}></div>
        {/* Center Core */}
        <div className="w-4 h-4 rounded-full bg-primary-500 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.8)]"></div>
      </div>
      
      {/* Loading Text */}
      <div className="mt-8 flex flex-col items-center">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-300 mb-2">Loading PitchPulse</h2>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
