'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Activity, Eye, CheckCircle2, ShieldAlert } from 'lucide-react';

export const RiskControlShield: React.FC = () => {
  const [activeCheckIdx, setActiveCheckIdx] = useState(0);

  const CHECKS = [
    { id: 'risk', name: 'RISK CHECK', sub: 'Anomaly & Velocity Scoring', metric: '0.02ms EVALUATION', desc: 'Monitors rapid velocity bursts and geo-distance mismatches across multiple UPI transactions.' },
    { id: 'limit', name: 'LIMIT CHECK', sub: 'Available Capacity Validation', metric: 'REAL-TIME BALANCE OK', desc: 'Verifies active line balance to ensure draw does not exceed pre-approved credit parameters.' },
    { id: 'txn', name: 'TRANSACTION CHECK', sub: 'Merchant Category Code (MCC)', metric: 'PERMITTED CATEGORY', desc: 'Filters restricted merchant codes and enforces product-configured category exclusions.' },
    { id: 'policy', name: 'POLICY CHECK', sub: 'Lender Rulebook Compliance', metric: 'INSTITUTIONAL RULES MET', desc: 'Validates bank policy constraints, cooling periods, and statutory repayment guidelines.' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCheckIdx((prev) => (prev + 1) % CHECKS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [CHECKS.length]);

  return (
    <section
      id="section-risk-control"
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-gradient-to-b from-[#060F1E] to-[#071A33] text-white overflow-hidden border-b border-slate-800 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-blue-500/10 rounded-full blur-[200px]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-16 relative z-10 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>INSTITUTIONAL RISK & GOVERNANCE</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase leading-[1.04]"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            CREDIT SHOULD MOVE FAST. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-[#155EEF] bg-clip-text text-transparent">
              CONTROL SHOULD MOVE FASTER.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-normal leading-relaxed">
            Four simulated guardrails evaluate every transaction packet before credit drawdown authorization.
          </p>
        </div>

        {/* ── THE TRANSPARENT CIRCULAR SHIELD MECHANISM ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: 3D Transparent Security Shield Visualization */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full border-2 border-cyan-400/30 bg-blue-950/30 shadow-[0_0_50px_rgba(0,210,255,0.15)] flex flex-col items-center justify-center p-6 relative overflow-hidden backdrop-blur-md">
              {/* Rotating Concentric Protection Radar Ring */}
              <div className="absolute inset-4 rounded-full border border-dashed border-cyan-400/40 animate-[spin_30s_linear_infinite]" />
              <div className="absolute inset-10 rounded-full border border-blue-500/30 animate-[spin_20s_linear_infinite_reverse]" />

              {/* Core Shield Emblem */}
              <div className="w-20 h-20 rounded-2xl bg-[#0E2442] border border-cyan-400/60 shadow-xl flex items-center justify-center text-cyan-300 mb-3">
                <ShieldCheck className="w-10 h-10" />
              </div>

              <div className="text-sm font-mono font-bold uppercase tracking-widest text-cyan-300">
                ACTIVE SHIELD GATEWAY
              </div>

              <div className="text-xs font-mono text-slate-400 mt-1">
                STATUS: ENFORCING CONTROLS
              </div>

              {/* Simulated Flow Stages */}
              <div className="mt-4 flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                <span className="text-white font-bold">TXN</span>
                <span>→</span>
                <span className="text-cyan-400 font-bold">CHECK</span>
                <span>→</span>
                <span className="text-emerald-400 font-bold">DECISION</span>
                <span>→</span>
                <span className="text-white font-bold">AUTH</span>
              </div>
            </div>
          </div>

          {/* Right: 4 Security Check Tripwires */}
          <div className="lg:col-span-6 space-y-3 text-left">
            {CHECKS.map((chk, idx) => {
              const isCurrent = activeCheckIdx === idx;
              return (
                <div
                  key={chk.id}
                  onClick={() => setActiveCheckIdx(idx)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#0E2442] border-cyan-400 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/30'
                      : 'bg-[#0A1628]/80 border-slate-800 hover:bg-[#0E2442]/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isCurrent ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-mono font-bold text-cyan-300">
                          {chk.name}
                        </div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {chk.sub}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800 font-bold">
                      {chk.metric}
                    </span>
                  </div>

                  {isCurrent && (
                    <p className="mt-3 pt-2.5 border-t border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                      {chk.desc}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
