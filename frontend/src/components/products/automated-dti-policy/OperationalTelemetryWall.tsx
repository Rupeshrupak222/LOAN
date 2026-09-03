'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Terminal } from 'lucide-react';

export const OperationalTelemetryWall: React.FC = () => {
  const [counts, setCounts] = useState({
    policyChecks: 124,
    dtiEvaluations: 86,
    reviewStates: 12,
    policyVersion: 2,
  });

  // Slow continuous increment of industrial telemetry counters
  useEffect(() => {
    const interval = setInterval(() => {
      setCounts((prev) => ({
        ...prev,
        policyChecks: prev.policyChecks + 1,
        dtiEvaluations: prev.dtiEvaluations + (Math.random() > 0.3 ? 1 : 0),
        reviewStates: prev.reviewStates + (Math.random() > 0.8 ? 1 : 0),
      }));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="section-telemetry-wall"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-[#071A33] text-white overflow-hidden border-b border-slate-800 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-[1400px] mx-auto space-y-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800 text-left">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>INDUSTRIAL READOUT WALL // TELEMETRY</span>
            </span>

            <h2
              className="text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase"
              style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
            >
              OPERATIONAL VISIBILITY.
            </h2>
          </div>

          <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            SIMULATED DEMONSTRATION VALUES • SUB-SECOND INDUSTRIAL DISPATCH
          </div>
        </div>

        {/* ── 4 LARGE MECHANICAL INSTRUMENT READOUT PANELS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {/* Readout 1: Policy Checks */}
          <div className="p-8 bg-[#0A1628] border-2 border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
              <span>METRIC 01</span>
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
            </div>

            <div
              className="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none"
              style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
            >
              {counts.policyChecks}
            </div>

            <div className="pt-3 border-t border-slate-800 text-xs font-mono text-cyan-300 font-bold uppercase">
              POLICY CHECKS EXECUTED
            </div>
          </div>

          {/* Readout 2: DTI Evaluations */}
          <div className="p-8 bg-[#0A1628] border-2 border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
              <span>METRIC 02</span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            </div>

            <div
              className="text-5xl sm:text-7xl font-black text-emerald-400 tracking-tighter leading-none"
              style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
            >
              {counts.dtiEvaluations}
            </div>

            <div className="pt-3 border-t border-slate-800 text-xs font-mono text-slate-300 font-bold uppercase">
              DTI EVALUATIONS CLEARED
            </div>
          </div>

          {/* Readout 3: Review States */}
          <div className="p-8 bg-[#0A1628] border-2 border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
              <span>METRIC 03</span>
              <span className="w-2 h-2 bg-amber-400 rounded-full" />
            </div>

            <div
              className="text-5xl sm:text-7xl font-black text-amber-400 tracking-tighter leading-none"
              style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
            >
              {counts.reviewStates}
            </div>

            <div className="pt-3 border-t border-slate-800 text-xs font-mono text-slate-300 font-bold uppercase">
              REVIEW STATES ROUTED
            </div>
          </div>

          {/* Readout 4: Policy Version */}
          <div className="p-8 bg-[#0A1628] border-2 border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
              <span>METRIC 04</span>
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
            </div>

            <div
              className="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none"
              style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
            >
              0{counts.policyVersion}
            </div>

            <div className="pt-3 border-t border-slate-800 text-xs font-mono text-slate-300 font-bold uppercase">
              ACTIVE POLICY VERSION
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
