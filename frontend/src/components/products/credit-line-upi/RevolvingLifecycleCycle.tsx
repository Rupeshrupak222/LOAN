'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

export const RevolvingLifecycleCycle: React.FC = () => {
  const STAGES = [
    { percent: 72, label: 'INITIAL STANDBY', action: 'DRAW', desc: 'Customer begins with ₹36,000 available on a ₹50,000 line.' },
    { percent: 58, label: 'SPEND AT RETAIL', action: 'SPEND', desc: '₹7,000 spent on merchant QR checkout. Balance drops to 58%.' },
    { percent: 41, label: 'ONLINE CHECKOUT', action: 'BALANCE REDUCES', desc: 'Further ₹8,500 drawdown for travel booking. Balance reflects 41%.' },
    { percent: 63, label: 'SALARY REPAYMENT', action: 'REPAY', desc: '₹11,000 auto-repaid via UPI mandate. Balance replenishes to 63%.' },
    { percent: 82, label: 'FULL REPLENISHMENT', action: 'BALANCE RESTORES', desc: 'Final repayment completes. Limit ready for continuous draw again.' },
  ];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % STAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentStage = STAGES[currentIdx];

  return (
    <section
      id="section-lifecycle"
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#EEF4FB] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Keylight ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-blue-500/5 rounded-full blur-[200px]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-16 relative z-10 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <RefreshCw className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>PERPETUAL CREDIT BALANCE</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#071A33] tracking-tight uppercase leading-[1.04]"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            USE IT. REPAY IT. <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
              USE IT AGAIN.
            </span>
          </h2>

          <div className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            SIMULATED CREDIT-LINE LIFECYCLE
          </div>
        </div>

        {/* ── THE LARGE ROTATING LIFECYCLE INSTRUMENT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left / Center: Monumental Gauge Dial */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-white border border-slate-200 shadow-2xl flex flex-col items-center justify-center p-8">
              {/* SVG Dynamic Circular Arc */}
              <svg className="absolute inset-4 w-[calc(100%-32px)] h-[calc(100%-32px)] -rotate-90 pointer-events-none" viewBox="0 0 360 360">
                <circle
                  cx="180"
                  cy="180"
                  r="150"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="12"
                  strokeDasharray="4 6"
                />
                <circle
                  cx="180"
                  cy="180"
                  r="150"
                  fill="none"
                  stroke="url(#lifeGrad)"
                  strokeWidth="14"
                  strokeDasharray={2 * Math.PI * 150}
                  strokeDashoffset={2 * Math.PI * 150 * (1 - currentStage.percent / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="lifeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00E5FF" />
                    <stop offset="100%" stopColor="#155EEF" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center Core Figure */}
              <div
                className="text-6xl sm:text-7xl font-black text-[#071A33] tracking-tight leading-none"
                style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
              >
                {currentStage.percent}%
              </div>

              <div className="text-xs font-mono font-bold text-[#155EEF] uppercase tracking-widest mt-2">
                AVAILABLE CAPACITY
              </div>

              <div className="mt-3 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-mono text-slate-600 font-semibold uppercase">
                PHASE: {currentStage.action}
              </div>
            </div>
          </div>

          {/* Right: Lifecycle Sequence Timeline */}
          <div className="lg:col-span-6 space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                LIFECYCLE PROGRESSION STAGES
              </span>
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-xs font-mono text-[#155EEF] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Play className={`w-3.5 h-3.5 ${isPlaying ? 'rotate-90' : ''}`} />
                <span>{isPlaying ? 'PAUSE ROTATION' : 'RESUME ROTATION'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {STAGES.map((stg, idx) => {
                const isCurrent = currentIdx === idx;
                return (
                  <div
                    key={stg.label}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentIdx(idx);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-white border-[#155EEF] shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white/60 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-slate-100 font-mono text-xs font-bold flex items-center justify-center text-[#071A33]">
                          {stg.percent}%
                        </span>
                        <div>
                          <div className="text-xs font-mono font-bold uppercase text-[#155EEF]">
                            {stg.action}
                          </div>
                          <div className="text-sm font-bold text-slate-900">
                            {stg.label}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        STAGE 0{idx + 1}
                      </span>
                    </div>

                    {isCurrent && (
                      <p className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                        {stg.desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
