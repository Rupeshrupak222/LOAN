'use client';

import React, { useState } from 'react';
import { Scan, ShieldCheck, Play, CheckCircle2 } from 'lucide-react';

export const BureauXRayScanningChamber: React.FC = () => {
  const [activeSignal, setActiveSignal] = useState<number | null>(null);
  const [isLaserSweeping, setIsLaserSweeping] = useState(false);

  const SIGNALS = [
    { name: 'CREDIT HISTORY', metric: '48M UNBROKEN RECORD', spec: 'Longevity of open tradelines and historical settlement compliance.' },
    { name: 'EXISTING EXPOSURE', metric: '₹3.4L ACTIVE CAPACITY', spec: 'Aggregate revolving and term exposure across multi-institutional credit sources.' },
    { name: 'REPAYMENT SIGNAL', metric: '0 OVERDUE CYCLES (36M)', spec: 'Discipline indicator verifying absence of 30+ day delinquency instances.' },
    { name: 'RECENT ACTIVITY', metric: '0 HARD INQUIRIES (90D)', spec: 'Velocity check guarding against sudden multi-lender credit shopping.' },
    { name: 'ACCOUNT OBLIGATION', metric: '2 ACTIVE TERM EMIS', spec: 'Scheduled installment commitments extracted directly from bureau files.' },
  ];

  const triggerLaserSweep = () => {
    setIsLaserSweeping(true);
    setTimeout(() => setIsLaserSweeping(false), 2000);
  };

  return (
    <section
      id="section-bureau-xray"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-[#060F1E] text-white overflow-hidden border-b border-slate-800 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800 text-left">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <Scan className="w-3.5 h-3.5 text-cyan-400" />
              <span>BUREAU X-RAY DIAGNOSTIC FILM</span>
            </span>

            <h2
              className="text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase"
              style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
            >
              THE BUREAU SIGNAL <br />
              <span className="text-cyan-400">IS ONLY ONE LAYER.</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={triggerLaserSweep}
            disabled={isLaserSweeping}
            className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-400/20"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isLaserSweeping ? 'LASER SWEEPING...' : 'SWEEP X-RAY BEAM'}</span>
          </button>
        </div>

        {/* ── THE DARK X-RAY SCANNING FILM CHASSIS ── */}
        <div className="p-8 sm:p-12 bg-[#0A1628] border border-slate-800 shadow-2xl relative overflow-hidden space-y-4">
          {/* Active Moving Laser Sweep Beam */}
          {isLaserSweeping && (
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-cyan-400 shadow-[0_0_24px_#22d3ee] animate-[scanLaser_2s_ease-in-out_infinite] pointer-events-none z-30" />
          )}

          {SIGNALS.map((sig, idx) => {
            const isHovered = activeSignal === idx;

            return (
              <div
                key={sig.name}
                onMouseEnter={() => setActiveSignal(idx)}
                onMouseLeave={() => setActiveSignal(null)}
                className={`p-5 border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isHovered
                    ? 'bg-[#0E2442] border-cyan-400 text-white shadow-xl translate-x-2'
                    : 'bg-[#071A33]/80 border-slate-800 text-slate-300 hover:bg-[#0E2442]/60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono font-bold text-slate-500">
                    SCAN / 0{idx + 1}
                  </span>
                  <div className="text-base font-black uppercase text-white">
                    {sig.name}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-8">
                  <div className="text-sm font-mono font-bold text-cyan-300">
                    {sig.metric}
                  </div>
                  <div className="text-xs text-slate-400 max-w-xs">
                    {sig.spec}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
