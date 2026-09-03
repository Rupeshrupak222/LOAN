'use client';

import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Zap, RefreshCw, Layers } from 'lucide-react';
import { CreditCore3D } from './CreditCore3D';

export const CreditLineHeroCore: React.FC = () => {
  const TOTAL_LIMIT = 50000;
  const [availableCredit, setAvailableCredit] = useState(50000);
  const [usedCredit, setUsedCredit] = useState(0);
  const [selectedDrawAmount, setSelectedDrawAmount] = useState(2500);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isRepaying, setIsRepaying] = useState(false);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);

  const handleUseCredit = () => {
    if (isAuthorizing || isRepaying || availableCredit < selectedDrawAmount) return;

    setIsAuthorizing(true);
    setLastActionStatus(`AUTHORIZING ₹${selectedDrawAmount.toLocaleString('en-IN')} DRAWDOWN...`);

    setTimeout(() => {
      setAvailableCredit((prev) => prev - selectedDrawAmount);
      setUsedCredit((prev) => prev + selectedDrawAmount);
      setIsAuthorizing(false);
      setLastActionStatus(`PAYMENT AUTHORIZED • ₹${selectedDrawAmount.toLocaleString('en-IN')} ROUTED VIA UPI`);
    }, 600);
  };

  const handleRepay = () => {
    if (isAuthorizing || isRepaying || usedCredit === 0) return;

    setIsRepaying(true);
    setLastActionStatus(`PROCESSING REPAYMENT OF ₹${usedCredit.toLocaleString('en-IN')}...`);

    setTimeout(() => {
      setAvailableCredit(TOTAL_LIMIT);
      setUsedCredit(0);
      setIsRepaying(false);
      setLastActionStatus(`REPAYMENT CONFIRMED • ₹${TOTAL_LIMIT.toLocaleString('en-IN')} FULLY RESTORED`);
    }, 600);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="section-hero-credit-core"
      className="relative min-h-[92vh] flex items-center justify-center py-20 sm:py-28 px-4 sm:px-8 bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#EEF4FB] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── UNIQUE 3D NPCI REVOLVING CREDIT AURA BACKGROUND ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Isometric Revolving Grid */}
        <div
          className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[1850px] h-[920px] opacity-35"
          style={{
            transform: 'perspective(850px) rotateX(62deg) translateZ(-40px)',
            backgroundImage: `
              linear-gradient(to right, rgba(0, 210, 255, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(21, 94, 239, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '46px 46px',
            maskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
          }}
        />

        {/* Volumetric UPI Energy Glows */}
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[550px] bg-gradient-to-br from-cyan-400/18 via-blue-600/12 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-10 right-1/3 translate-x-1/2 w-[650px] h-[550px] bg-gradient-to-bl from-indigo-500/16 via-teal-400/10 to-transparent blur-[130px] rounded-full" />

        {/* Floating 3D UPI Credit Line Telemetry */}
        <div className="absolute top-32 left-[8%] px-3 py-1.5 rounded-lg bg-white/85 border border-cyan-200 backdrop-blur-md shadow-md text-[10px] font-mono text-cyan-800 font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '6s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
          <span>NPCI_CREDIT_LINE // LINKED_TO_VPA</span>
        </div>

        <div className="absolute top-44 right-[8%] px-3 py-1.5 rounded-lg bg-white/85 border border-blue-200 backdrop-blur-md shadow-md text-[10px] font-mono text-[#155EEF] font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '7s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>DRAWDOWN_SETTLEMENT // SUB_500MS</span>
        </div>

        {/* Floating UPI revolving credit halo rings */}
        <div className="absolute bottom-28 left-[14%] w-8 h-8 rounded-full border-2 border-cyan-400/50 rotate-45 animate-pulse" />
        <div className="absolute bottom-36 right-[15%] w-7 h-7 rounded border border-blue-400/50 rotate-12 animate-spin" style={{ animationDuration: '20s' }} />
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* ── Left Column: Editorial Fintech Narrative ── */}
        <div className="lg:col-span-6 space-y-8 text-left">
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <Layers className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>CREDIT INFRASTRUCTURE / UPI</span>
          </div>

          {/* Monumental Headline */}
          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-black text-[#071A33] tracking-tight leading-[0.98] uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            CREDIT, <br />
            WHERE PAYMENTS <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#00D2FF] bg-clip-text text-transparent">
              ALREADY HAPPEN.
            </span>
          </h1>

          {/* Supporting Narrative */}
          <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed">
            Bring pre-approved, revolving credit directly into the payment journeys customers already use.
          </p>

          {/* Secondary Four-Beat Cadence */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-700 tracking-wider font-semibold">
            <span className="bg-slate-100 px-3 py-1 rounded-md border border-slate-200 text-[#071A33]">
              DRAW
            </span>
            <span className="text-[#155EEF]">→</span>
            <span className="bg-slate-100 px-3 py-1 rounded-md border border-slate-200 text-[#071A33]">
              PAY
            </span>
            <span className="text-[#155EEF]">→</span>
            <span className="bg-slate-100 px-3 py-1 rounded-md border border-slate-200 text-[#071A33]">
              REPAY
            </span>
            <span className="text-[#155EEF]">→</span>
            <span className="bg-blue-50 px-3 py-1 rounded-md border border-blue-200 text-[#155EEF] font-bold">
              REUSE
            </span>
          </div>

          {/* Interactive Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              type="button"
              onClick={() => scrollToSection('section-credit-line')}
              className="px-8 py-4 rounded-xl bg-[#155EEF] hover:bg-[#004EEB] text-white font-bold text-xs font-mono tracking-widest uppercase shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>EXPLORE THE CREDIT LINE</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('section-rail-journey')}
              className="px-8 py-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs font-mono tracking-widest uppercase transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>VIEW PAYMENT FLOW</span>
            </button>
          </div>

          {/* Operational Micro-Bar */}
          <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-6 text-[11px] font-mono text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero Merchant Friction</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#155EEF]" />
              <span>Sub-Second Routing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-cyan-600" />
              <span>Revolving Balance</span>
            </div>
          </div>
        </div>

        {/* ── Right Column: 3D Credit Core + Interactive Simulation Desk ── */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
          {/* The 3D Precision Credit Core Instrument */}
          <CreditCore3D
            availableAmount={availableCredit}
            totalLimit={TOTAL_LIMIT}
            usedAmount={usedCredit}
            isAuthorizing={isAuthorizing}
            isRepaying={isRepaying}
            size={440}
            interactiveTilt={true}
          />

          {/* ── Interactive Simulation Controls Bar ── */}
          <div className="mt-8 w-full max-w-md p-5 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>INTERACTIVE DEMO BENCH</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Simulate UPI Draw & Repay
              </span>
            </div>

            {/* Select Drawdown Amount */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 shrink-0">Draw:</span>
              {[1000, 2500, 5000, 10000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSelectedDrawAmount(amt)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    selectedDrawAmount === amt
                      ? 'bg-blue-50 border border-[#155EEF] text-[#155EEF]'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            {/* Execution Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleUseCredit}
                disabled={isAuthorizing || isRepaying || availableCredit < selectedDrawAmount}
                className="py-3 px-4 rounded-xl bg-[#071A33] hover:bg-black text-white font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>⚡ USE CREDIT</span>
              </button>

              <button
                type="button"
                onClick={handleRepay}
                disabled={isAuthorizing || isRepaying || usedCredit === 0}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>✓ REPAY ({usedCredit > 0 ? `₹${usedCredit.toLocaleString('en-IN')}` : '0'})</span>
              </button>
            </div>

            {/* Live Telemetry Feedback Line */}
            {lastActionStatus && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center text-[10px] font-mono text-slate-700 font-bold transition-all">
                {lastActionStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
