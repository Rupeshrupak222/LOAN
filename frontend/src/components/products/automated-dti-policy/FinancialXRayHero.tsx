'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Scan, ShieldCheck, Zap, Activity } from 'lucide-react';

export const FinancialXRayHero: React.FC = () => {
  const [scanPercent, setScanPercent] = useState(65);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pointer horizontal tracker across the diagnostic interface
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isAutoScanning || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const pct = Math.round((x / rect.width) * 100);
    setScanPercent(pct);
  };

  const runAutomatedScan = () => {
    setIsAutoScanning(true);
    setScanPercent(5);
    let curr = 5;
    const interval = setInterval(() => {
      curr += 2;
      if (curr >= 100) {
        setScanPercent(100);
        setIsAutoScanning(false);
        clearInterval(interval);
      } else {
        setScanPercent(curr);
      }
    }, 20);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="section-hero-xray"
      className="relative min-h-[95vh] flex flex-col justify-between py-16 sm:py-24 px-4 sm:px-8 lg:px-12 bg-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── UNIQUE 3D FINANCIAL X-RAY VOLUMETRIC FIELD BACKGROUND ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Isometric Diagnostic X-Ray Floor Grid */}
        <div
          className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[1850px] h-[920px] opacity-35"
          style={{
            transform: 'perspective(850px) rotateX(62deg) translateZ(-40px)',
            backgroundImage: `
              linear-gradient(to right, rgba(6, 182, 212, 0.28) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(21, 94, 239, 0.22) 1px, transparent 1px)
            `,
            backgroundSize: '46px 46px',
            maskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
          }}
        />

        {/* Volumetric Diagnostic X-Ray Glows */}
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[550px] bg-gradient-to-br from-cyan-400/18 via-blue-600/12 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-10 right-1/3 translate-x-1/2 w-[650px] h-[550px] bg-gradient-to-bl from-slate-900/15 via-cyan-500/10 to-transparent blur-[130px] rounded-full" />

        {/* Floating 3D Diagnostic Telemetry Badges */}
        <div className="absolute top-32 left-[8%] px-3 py-1.5 rounded-lg bg-white/85 border border-cyan-300 backdrop-blur-md shadow-md text-[10px] font-mono text-cyan-900 font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '6s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
          <span>BUREAU_DATA_APERTURE // REALTIME_V3</span>
        </div>

        <div className="absolute top-44 right-[8%] px-3 py-1.5 rounded-lg bg-white/85 border border-blue-300 backdrop-blur-md shadow-md text-[10px] font-mono text-[#155EEF] font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '7s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>MAX_OBLIGATION_RATIO // &lt;40%_CAP</span>
        </div>

        {/* Floating X-Ray reticle crosshairs */}
        <div className="absolute bottom-28 left-[14%] w-8 h-8 border border-cyan-500/40 rounded-full flex items-center justify-center text-[10px] font-mono text-cyan-600 animate-pulse">
          +
        </div>
        <div className="absolute bottom-36 right-[15%] w-7 h-7 border border-blue-500/40 rotate-45 animate-spin" style={{ animationDuration: '24s' }} />
      </div>

      {/* Top Editorial Header Bar */}
      <div className="max-w-[1400px] mx-auto w-full relative z-10 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-6 border-b border-slate-200">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-slate-900 text-white text-[11px] font-mono font-bold tracking-widest uppercase">
              <Scan className="w-3.5 h-3.5 text-cyan-400" />
              <span>AUTOMATED DTI POLICY // DIAGNOSTIC SPEC</span>
            </div>

            {/* Asymmetrical Huge Editorial Typography */}
            <h1
              className="text-4xl sm:text-6xl md:text-8xl font-black text-[#071A33] tracking-tighter leading-[0.92] uppercase"
              style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
            >
              SEE THE <br />
              <span className="text-[#155EEF]">FINANCIAL</span> <br />
              PICTURE.
            </h1>
          </div>

          <div className="max-w-md space-y-6 text-left">
            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              Turn income, obligations and bureau signals into configurable policy checks for modern lending journeys.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={runAutomatedScan}
                className="px-6 py-3.5 rounded-none bg-[#071A33] hover:bg-black text-white font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Scan className="w-4 h-4 text-cyan-400" />
                <span>RUN A POLICY SCAN</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('section-technical-strips')}
                className="px-6 py-3.5 rounded-none bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>EXPLORE THE RULES</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── FULL-WIDTH HORIZONTAL FINANCIAL X-RAY MONITOR ── */}
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          className="relative w-full rounded-2xl bg-[#071A33] text-white border border-slate-800 shadow-2xl p-6 sm:p-10 overflow-hidden cursor-crosshair min-h-[420px] flex flex-col justify-between"
        >
          {/* Top Monitor Status Line */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-white font-bold tracking-widest uppercase">
                DIAGNOSTIC APERTURE: {scanPercent}% REVEALED
              </span>
            </div>

            <div className="flex items-center gap-4 text-[10px] tracking-wider uppercase">
              <span>SCANNER: {isAutoScanning ? 'SWEEPING...' : 'CURSOR CONTROLLED'}</span>
              <span>•</span>
              <span className="text-cyan-300">ILLUSTRATIVE POLICY SCAN</span>
            </div>
          </div>

          {/* Precision Vertical Millimeter Ruler at bottom */}
          <div className="absolute top-16 bottom-16 left-0 w-8 border-r border-slate-800/80 flex flex-col justify-between py-4 text-[8px] font-mono text-slate-600 select-none hidden sm:flex">
            <span>00</span>
            <span>20</span>
            <span>40</span>
            <span>60</span>
            <span>80</span>
            <span>100</span>
          </div>

          {/* ── The 5 Horizontal Financial Data Apertures ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:pl-10 relative z-10 py-6">
            {/* Aperture 1: Income */}
            <div
              className={`p-5 rounded-xl border transition-all duration-200 ${
                scanPercent >= 20
                  ? 'bg-[#0E2442] border-cyan-400/80 shadow-lg'
                  : 'bg-[#0A1628]/40 border-slate-800 opacity-40'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                01 / MONTHLY INCOME
              </div>
              <div
                className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight"
                style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
              >
                {scanPercent >= 20 ? '₹80,000' : '████████'}
              </div>
              <div className="text-[10px] font-mono text-cyan-300 mt-2">
                {scanPercent >= 20 ? '✓ Verified Gross Credits' : 'Scanned Field Pending'}
              </div>
            </div>

            {/* Aperture 2: Obligations */}
            <div
              className={`p-5 rounded-xl border transition-all duration-200 ${
                scanPercent >= 40
                  ? 'bg-[#0E2442] border-cyan-400/80 shadow-lg'
                  : 'bg-[#0A1628]/40 border-slate-800 opacity-40'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                02 / EXISTING OBLIGATIONS
              </div>
              <div
                className="text-2xl sm:text-3xl font-black text-amber-400 mt-2 tracking-tight"
                style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
              >
                {scanPercent >= 40 ? '₹18,000' : '████████'}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-2">
                {scanPercent >= 40 ? '2 Active Tradeline EMIs' : 'Scanned Field Pending'}
              </div>
            </div>

            {/* Aperture 3: Proposed Payment */}
            <div
              className={`p-5 rounded-xl border transition-all duration-200 ${
                scanPercent >= 60
                  ? 'bg-[#0E2442] border-cyan-400/80 shadow-lg'
                  : 'bg-[#0A1628]/40 border-slate-800 opacity-40'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                03 / PROPOSED PAYMENT
              </div>
              <div
                className="text-2xl sm:text-3xl font-black text-cyan-300 mt-2 tracking-tight"
                style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
              >
                {scanPercent >= 60 ? '₹9,000' : '████████'}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-2">
                {scanPercent >= 60 ? 'Requested Facility EMI' : 'Scanned Field Pending'}
              </div>
            </div>

            {/* Aperture 4: Calculated DTI */}
            <div
              className={`p-5 rounded-xl border transition-all duration-200 ${
                scanPercent >= 80
                  ? 'bg-[#0E2442] border-emerald-400/80 shadow-lg ring-1 ring-emerald-400/30'
                  : 'bg-[#0A1628]/40 border-slate-800 opacity-40'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                04 / CALCULATED DTI
              </div>
              <div
                className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 tracking-tight"
                style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
              >
                {scanPercent >= 80 ? '33.75%' : '█████'}
              </div>
              <div className="text-[10px] font-mono text-emerald-400 mt-2">
                {scanPercent >= 80 ? '₹27,000 / ₹80,000' : 'Awaiting Calculation'}
              </div>
            </div>

            {/* Aperture 5: Policy Outcome */}
            <div
              className={`p-5 rounded-xl border transition-all duration-200 ${
                scanPercent >= 95
                  ? 'bg-emerald-950/50 border-emerald-400 text-white'
                  : 'bg-[#0A1628]/40 border-slate-800 opacity-40'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                05 / POLICY STATUS
              </div>
              <div
                className="text-xl sm:text-2xl font-black text-white mt-2 leading-tight uppercase"
                style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
              >
                {scanPercent >= 95 ? 'WITHIN LIMIT' : '██████'}
              </div>
              <div className="text-[10px] font-mono text-emerald-400 mt-2">
                {scanPercent >= 95 ? 'CEILING: 40% (PASS)' : 'Pending Evaluation'}
              </div>
            </div>
          </div>

          {/* ── Active Vertical Cyan Laser Scan Line (Tracks pointer horizontally) ── */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_24px_#22d3ee] pointer-events-none transition-all duration-75"
            style={{ left: `${scanPercent}%` }}
          >
            <div className="absolute top-4 -translate-x-1/2 px-2 py-0.5 rounded bg-cyan-400 text-slate-950 font-mono text-[9px] font-bold">
              SCANNER
            </div>
          </div>

          {/* Bottom Monitor Diagnostic Telemetry */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono text-slate-500">
            <span>COORDINATES: X-RAY CHANNEL / 48-BIT DEPTH</span>
            <span>GLIDE MOUSE HORIZONTALLY TO ADJUST SCAN APERTURE</span>
            <span>ADYAPAN / DTI POLICY</span>
          </div>
        </div>
      </div>
    </section>
  );
};
