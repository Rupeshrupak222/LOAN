'use client';

import React, { useState } from 'react';
import { Sliders, ShieldCheck, AlertCircle } from 'lucide-react';

export const HorizontalThresholdInstrument: React.FC = () => {
  const [simulatedDti, setSimulatedDti] = useState(33.75);
  const POLICY_CEILING = 40.0;

  const isWithinPolicy = simulatedDti <= POLICY_CEILING;

  return (
    <section
      id="section-threshold"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-5xl mx-auto space-y-16 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white text-xs font-mono font-bold uppercase tracking-widest">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>POLICY BENCHMARKING APERTURE</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            POLICY IS WHERE <br />
            <span className="text-[#155EEF]">THE NUMBER GETS MEANING.</span>
          </h2>

          <div className="inline-block px-3 py-1 bg-slate-200 text-slate-700 text-[10px] font-mono uppercase tracking-widest">
            ILLUSTRATIVE POLICY THRESHOLD • DEMONSTRATION PURPOSES ONLY
          </div>
        </div>

        {/* ── HUGE HORIZONTAL MEASURING INSTRUMENT ── */}
        <div className="p-8 sm:p-14 bg-white border-2 border-slate-300 shadow-xl relative space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                INSTITUTIONAL RISK CEILING
              </span>
              <div className="text-lg font-black text-[#071A33]">
                Standard Personal Lending Boundary: {POLICY_CEILING}%
              </div>
            </div>

            <div
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
                isWithinPolicy
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-amber-50 text-amber-700 border border-amber-300'
              }`}
            >
              {isWithinPolicy ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>STATUS: WITHIN POLICY</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>STATUS: POLICY REVIEW REQUIRED</span>
                </>
              )}
            </div>
          </div>

          {/* Precision Scale Bar (0% to 60%) */}
          <div className="space-y-4 py-6">
            <div className="relative w-full h-8 bg-slate-100 border border-slate-300 flex items-center">
              {/* Safe Zone (0% to 40%) */}
              <div
                className="h-full bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border-r-2 border-slate-900 flex items-center justify-start pl-3 text-[10px] font-mono font-bold text-[#155EEF]"
                style={{ width: `${(POLICY_CEILING / 60) * 100}%` }}
              >
                AUTOMATED CLEARING ZONE (≤ 40%)
              </div>

              {/* Review Zone (40% to 60%) */}
              <div
                className="h-full bg-amber-500/10 flex items-center justify-start pl-3 text-[10px] font-mono font-bold text-amber-700"
                style={{ width: `${((60 - POLICY_CEILING) / 60) * 100}%` }}
              >
                REVIEW ZONE (&gt; 40%)
              </div>

              {/* Dynamic DTI Marker Pin */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 z-20 flex flex-col items-center"
                style={{ left: `${Math.min(100, Math.max(0, (simulatedDti / 60) * 100))}%` }}
              >
                <div className="px-2.5 py-1 bg-slate-950 text-white font-mono text-xs font-bold shadow-lg">
                  {simulatedDti}%
                </div>
                <div className="w-0.5 h-12 bg-slate-950" />
              </div>
            </div>

            {/* Scale Calibration Ticks */}
            <div className="flex justify-between text-xs font-mono text-slate-500 pt-2 px-1">
              <span>0%</span>
              <span>10%</span>
              <span>20%</span>
              <span>30%</span>
              <span className="font-bold text-slate-900 underline">40% (THRESHOLD)</span>
              <span>50%</span>
              <span>60%</span>
            </div>
          </div>

          {/* Test Slider */}
          <div className="pt-6 border-t border-slate-200 max-w-md mx-auto space-y-2 text-left">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-500">Test Simulated DTI:</span>
              <span className="font-black text-slate-900">{simulatedDti}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="58"
              step="0.25"
              value={simulatedDti}
              onChange={(e) => setSimulatedDti(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-none appearance-none cursor-pointer accent-slate-900"
              aria-label="Test Simulated DTI value"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
