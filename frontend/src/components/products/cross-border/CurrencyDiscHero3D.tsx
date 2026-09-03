'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sliders,
  Sparkles,
  Layers,
  CircleDot,
  CheckCircle2,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   CurrencyDiscHero3D — "THE CURRENCY TRANSFORMATION"
   ─────────────────────────────────────────────────────────────
   ▸ Central 3D Physical Currency Disc (USD)
   ▸ 3 Precision Mechanical Rings:
     - Outer Ring: Capital Amount Mechanism
     - Middle Ring: Interbank FX Dial
     - Inner Ring: Settlement Lock Core
   ▸ Camera-like pointer response (smooth lerp inertia).
   ══════════════════════════════════════════════════════════════ */

export const CurrencyDiscHero3D: React.FC = () => {
  const [isAssembled, setIsAssembled] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);

  // Smooth Architectural Camera Tilt Physics
  const camera = useRef({
    rx: 0,
    ry: 0,
    targetRx: 0,
    targetRy: 0,
    isHovered: false,
    rafId: 0,
  });

  const updateCameraPhysics = useCallback(() => {
    const c = camera.current;
    const factor = c.isHovered ? 0.08 : 0.04;

    c.rx += (c.targetRx - c.rx) * factor;
    c.ry += (c.targetRy - c.ry) * factor;

    if (discRef.current) {
      discRef.current.style.transform = `perspective(1400px) rotateX(${c.rx.toFixed(
        2
      )}deg) rotateY(${c.ry.toFixed(2)}deg)`;
    }

    const isSettled = !c.isHovered && Math.abs(c.rx) < 0.02 && Math.abs(c.ry) < 0.02;

    if (!isSettled) {
      c.rafId = requestAnimationFrame(updateCameraPhysics);
    } else {
      c.rx = 0;
      c.ry = 0;
      if (discRef.current) {
        discRef.current.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg)';
      }
      c.rafId = 0;
    }
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    const c = camera.current;
    c.isHovered = true;
    c.targetRy = normX * 7.5; // max 7.5deg horizontal
    c.targetRx = -normY * 5.0; // max 5.0deg vertical

    if (!c.rafId) {
      c.rafId = requestAnimationFrame(updateCameraPhysics);
    }
  };

  const handlePointerLeave = () => {
    const c = camera.current;
    c.isHovered = false;
    c.targetRx = 0;
    c.targetRy = 0;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAssembled(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full min-h-[92vh] pt-10 sm:pt-14 pb-16 px-4 sm:px-8 lg:px-12 flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#EFF6FF]"
    >
      {/* ── UNIQUE 3D GLOBAL CORRIDOR VORTEX BACKGROUND ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Isometric Global Corridor Grid */}
        <div
          className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[1850px] h-[920px] opacity-35"
          style={{
            transform: 'perspective(850px) rotateX(62deg) translateZ(-40px)',
            backgroundImage: `
              linear-gradient(to right, rgba(99, 102, 241, 0.28) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(14, 165, 233, 0.22) 1px, transparent 1px)
            `,
            backgroundSize: '46px 46px',
            maskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
          }}
        />

        {/* Global Vortex Flares */}
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[550px] bg-gradient-to-br from-indigo-500/18 via-blue-500/12 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-10 right-1/3 translate-x-1/2 w-[650px] h-[550px] bg-gradient-to-bl from-teal-400/18 via-sky-300/12 to-transparent blur-[130px] rounded-full" />

        {/* Floating 3D SWIFT Telemetry Badges */}
        <div className="absolute top-32 left-[8%] px-3 py-1.5 rounded-lg bg-white/85 border border-indigo-200 backdrop-blur-md shadow-md text-[10px] font-mono text-indigo-800 font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '6s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span>SWIFT_GPI_TRACKING // REALTIME_UETR</span>
        </div>

        <div className="absolute top-44 right-[8%] px-3 py-1.5 rounded-lg bg-white/85 border border-teal-200 backdrop-blur-md shadow-md text-[10px] font-mono text-teal-800 font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '7s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>FX_CORRIDOR_SETTLEMENT // SUB_10MIN</span>
        </div>

        {/* Floating Global ISO Currency Beacons */}
        <div className="absolute bottom-28 left-[14%] w-8 h-8 rounded-full border border-indigo-400/50 flex items-center justify-center text-[10px] font-bold text-indigo-600 animate-pulse">
          $
        </div>
        <div className="absolute bottom-36 right-[15%] w-8 h-8 rounded-full border border-teal-400/50 flex items-center justify-center text-[10px] font-bold text-teal-600 animate-spin" style={{ animationDuration: '16s' }}>
          €
        </div>
      </div>

      {/* ── Top Architectural Eyebrow ── */}
      <div className="relative z-10 max-w-5xl mx-auto space-y-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold font-mono text-[#155EEF] shadow-xs">
          <RotateCcw className="w-4 h-4 text-[#155EEF]" />
          <span>CROSS-BORDER WIRE · CURRENCY TRANSFORMATION ENGINE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-emerald-700 font-bold">SWIFT & FX Settlement</span>
        </div>

        {/* ── Main Headline ── */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#071A33] leading-[1.08]">
          MONEY CHANGES.{' '}
          <span className="bg-gradient-to-r from-[#155EEF] via-blue-600 to-indigo-700 bg-clip-text text-transparent">
            VALUE MOVES.
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Transform a cross-border payment through synchronized currency conversion, institutional exchange dials, and atomic settlement precision.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#amount-odometer"
            className="px-7 py-3.5 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-xl shadow-[#155EEF]/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>Explore the Transfer</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#fx-chamber"
            className="px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#071A33] font-bold text-xs border border-slate-300 shadow-sm transition-all hover:scale-105"
          >
            See FX Flow →
          </a>
        </div>

        <p className="text-[11px] font-mono text-slate-400 max-w-xl mx-auto">
          *Illustrative SWIFT/FX settlement journey. Multi-currency clearing subject to central bank correspondent networks.
        </p>
      </div>

      {/* ── Central 3D Physical Currency Machine Arena ── */}
      <div className="relative z-20 w-full max-w-[1400px] mt-12 flex items-center justify-center">
        {/* Soft Shadow Base */}
        <div className="absolute w-full h-[400px] rounded-3xl bg-[#071A33]/12 blur-3xl translate-y-12 pointer-events-none" />

        {/* ── 3D Precision Machine Disc ── */}
        <div
          ref={discRef}
          className={`relative w-full rounded-3xl border border-slate-300/90 bg-white/95 backdrop-blur-xl p-6 sm:p-10 shadow-2xl transition-all duration-700 select-none ${
            isAssembled ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-6'
          }`}
          style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
        >
          {/* Header Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-200">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#071A33] to-[#155EEF] text-white flex items-center justify-center font-bold shadow-sm">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-black text-[#071A33] uppercase">CURRENCY TRANSFORMATION INSTRUMENT</span>
                <p className="text-[10px] font-mono text-slate-400">Triple Mechanical Rings: Amount · FX Rate · Settlement Core</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#155EEF] bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>INSTRUMENT STATUS: CALIBRATED (USD ➔ GBP)</span>
            </div>
          </div>

          {/* ── 3-Ring Visual Mechanical Deck ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Ring 1: Amount Ring */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#071A33] to-[#0D2447] text-white border border-slate-700 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">
                  RING 01 · AMOUNT DISC
                </span>
                <span className="text-xs font-mono font-bold text-blue-300">USD Origin</span>
              </div>

              <div>
                <span className="text-3xl font-black text-white font-mono block">$10,000.00</span>
                <span className="text-xs text-slate-300 mt-1 block">Origination Capital Value</span>
              </div>

              <div className="pt-3 border-t border-white/10 text-xs font-mono text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Currency Code:</span>
                  <span className="text-white font-bold">USD (840)</span>
                </div>
                <div className="flex justify-between">
                  <span>Precision Rating:</span>
                  <span className="text-emerald-400 font-bold">Atomic 2-Decimal</span>
                </div>
              </div>
            </div>

            {/* Ring 2: FX Conversion Dial */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200 uppercase">
                  RING 02 · FX DIAL
                </span>
                <span className="text-xs font-mono font-bold text-[#155EEF]">Interbank Rate</span>
              </div>

              <div>
                <span className="text-3xl font-black text-[#071A33] font-mono block">0.7890</span>
                <span className="text-xs text-slate-500 mt-1 block">USD to GBP Spot Mid-Market</span>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs font-mono text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Treasury Spread:</span>
                  <span className="text-emerald-600 font-bold">0.00% Zero-Markup</span>
                </div>
                <div className="flex justify-between">
                  <span>Lock Latency:</span>
                  <span className="text-slate-800 font-bold">Sub-50ms</span>
                </div>
              </div>
            </div>

            {/* Ring 3: Settlement Core */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  RING 03 · SETTLEMENT CORE
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600">GBP Output</span>
              </div>

              <div>
                <span className="text-3xl font-black text-[#071A33] font-mono block">£7,890.00</span>
                <span className="text-xs text-slate-500 mt-1 block">Credited to Beneficiary</span>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs font-mono text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Settlement Finality:</span>
                  <span className="text-emerald-600 font-bold">Irrevocable RTGS</span>
                </div>
                <div className="flex justify-between">
                  <span>Clearing Standard:</span>
                  <span className="text-[#071A33] font-bold">ISO 20022 STP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
