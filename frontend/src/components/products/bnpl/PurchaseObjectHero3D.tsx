'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Split,
  Calendar,
  Layers,
  Zap,
  CheckCircle2,
  Package,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   PurchaseObjectHero3D — "THE PURCHASE SPLITS ITSELF"
   ─────────────────────────────────────────────────────────────
   ▸ Central 3D Physical Purchase Object floating in clean space.
   ▸ Orbiting 3-Part payment telemetry:
     - Part 1: Today (1/3)
     - Part 2: Month 2 (1/3)
     - Part 3: Month 3 (1/3)
   ▸ Camera-like pointer response (smooth lerp inertia).
   ▸ One-time sequential assembly on entrance.
   ══════════════════════════════════════════════════════════════ */

export const PurchaseObjectHero3D: React.FC = () => {
  const [splitProgress, setSplitProgress] = useState<number>(0);
  const [isAssembled, setIsAssembled] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const objectRef = useRef<HTMLDivElement>(null);

  // Smooth Camera Tilt Physics
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

    if (objectRef.current) {
      objectRef.current.style.transform = `perspective(1400px) rotateX(${c.rx.toFixed(
        2
      )}deg) rotateY(${c.ry.toFixed(2)}deg)`;
    }

    const isSettled = !c.isHovered && Math.abs(c.rx) < 0.02 && Math.abs(c.ry) < 0.02;

    if (!isSettled) {
      c.rafId = requestAnimationFrame(updateCameraPhysics);
    } else {
      c.rx = 0;
      c.ry = 0;
      if (objectRef.current) {
        objectRef.current.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg)';
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
    c.targetRy = normX * 7.0; // max 7.0deg horizontal
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

  // Sequential assembly on entrance
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAssembled(true);
      setSplitProgress(100);
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
      {/* ── UNIQUE 3D SPLIT-PAY OPTICAL PRISM BACKGROUND ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Isometric 3D Prism Grid */}
        <div
          className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[1850px] h-[920px] opacity-35"
          style={{
            transform: 'perspective(850px) rotateX(62deg) translateZ(-40px)',
            backgroundImage: `
              linear-gradient(to right, rgba(99, 102, 241, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(16, 185, 129, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '46px 46px',
            maskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
          }}
        />

        {/* Volumetric Split Aura Flares */}
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[550px] bg-gradient-to-br from-purple-500/16 via-blue-500/12 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-10 right-1/3 translate-x-1/2 w-[650px] h-[550px] bg-gradient-to-bl from-emerald-400/16 via-teal-300/12 to-transparent blur-[130px] rounded-full" />

        {/* Floating 3D Installment Prism Badges */}
        <div className="absolute top-32 left-[8%] px-3 py-1.5 rounded-lg bg-white/85 border border-purple-200 backdrop-blur-md shadow-md text-[10px] font-mono text-purple-800 font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '6s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span>3_MONTH_EQUAL_SPLIT // 0%_APR</span>
        </div>

        <div className="absolute top-44 right-[8%] px-3 py-1.5 rounded-lg bg-white/85 border border-emerald-200 backdrop-blur-md shadow-md text-[10px] font-mono text-emerald-800 font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '7s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>ZERO_MARKUP // NO_HIDDEN_FEES</span>
        </div>

        {/* Floating Split Slice Prisms */}
        <div className="absolute bottom-28 left-[14%] w-8 h-8 border border-purple-400/50 rotate-12 animate-pulse" />
        <div className="absolute bottom-36 right-[15%] w-7 h-7 border border-emerald-400/50 -rotate-45 animate-spin" style={{ animationDuration: '18s' }} />
      </div>

      {/* ── Top Narrative Eyebrow ── */}
      <div className="relative z-10 max-w-5xl mx-auto space-y-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold font-mono text-[#155EEF] shadow-xs">
          <Split className="w-4 h-4 text-[#155EEF]" />
          <span>BNPL · 0% FOR 3 MONTHS*</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-emerald-700 font-bold">Split Checkout Payments</span>
        </div>

        {/* ── Main Headline ── */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#071A33] leading-[1.08]">
          BUY NOW.{' '}
          <span className="bg-gradient-to-r from-[#155EEF] via-blue-600 to-indigo-700 bg-clip-text text-transparent">
            LET THE PAYMENT CATCH UP.
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Split an eligible purchase into three equal, interest-free installments over 90 days. Zero hidden markups, zero compounding stress, 100% transparent.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#checkout-splitter"
            className="px-7 py-3.5 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-xl shadow-[#155EEF]/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>Explore 3-Part Split</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#responsible-review"
            className="px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#071A33] font-bold text-xs border border-slate-300 shadow-sm transition-all hover:scale-105"
          >
            Review Payment Schedule →
          </a>
        </div>

        <p className="text-[11px] font-mono text-slate-400 max-w-xl mx-auto">
          *0% for 3 months on eligible merchant checkouts. Subject to identity verification and credit approval terms.
        </p>
      </div>

      {/* ── Central 3D Purchase Object Showcase Arena ── */}
      <div className="relative z-20 w-full max-w-[1400px] mt-12 flex items-center justify-center">
        {/* Soft Shadow Base */}
        <div className="absolute w-full h-[400px] rounded-3xl bg-[#071A33]/12 blur-3xl translate-y-12 pointer-events-none" />

        {/* ── 3D Physical Purchase Container ── */}
        <div
          ref={objectRef}
          className={`relative w-full rounded-3xl border border-slate-300/90 bg-white/95 backdrop-blur-xl p-6 sm:p-10 shadow-2xl transition-all duration-700 select-none ${
            isAssembled ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-6'
          }`}
          style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
        >
          {/* Header Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-200">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#071A33] to-[#155EEF] text-white flex items-center justify-center font-bold shadow-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-black text-[#071A33] uppercase">THE 3-PART PURCHASE SPLIT ENGINE</span>
                <p className="text-[10px] font-mono text-slate-400">Digital Cart Checkpoint · Instant 3-Way Division</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#155EEF] bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>SPLIT STATUS: READY AT CHECKOUT</span>
            </div>
          </div>

          {/* ── 3-Block Physical Separation Deck ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Part 1: Today */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#071A33] to-[#0D2447] text-white border border-slate-700 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase">
                  PART 01 · DUE TODAY
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">1/3 Split</span>
              </div>

              <div>
                <span className="text-3xl font-black text-white font-mono block">₹4,000</span>
                <span className="text-xs text-slate-300 mt-1 block">Paid upfront at merchant checkout</span>
              </div>

              <div className="pt-3 border-t border-white/10 text-xs font-mono text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Down Payment:</span>
                  <span className="text-white font-bold">33.33%</span>
                </div>
                <div className="flex justify-between">
                  <span>Merchant Dispatch:</span>
                  <span className="text-emerald-400 font-bold">Instant T+0</span>
                </div>
              </div>
            </div>

            {/* Part 2: Month 2 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200 uppercase">
                  PART 02 · IN 30 DAYS
                </span>
                <span className="text-xs font-mono font-bold text-[#155EEF]">2/3 Split</span>
              </div>

              <div>
                <span className="text-3xl font-black text-[#071A33] font-mono block">₹4,000</span>
                <span className="text-xs text-slate-500 mt-1 block">Auto-debited on Day 30</span>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs font-mono text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Interest Charged:</span>
                  <span className="text-emerald-600 font-bold">₹0.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Auto-Debit:</span>
                  <span className="text-slate-800 font-bold">NPCI e-Mandate</span>
                </div>
              </div>
            </div>

            {/* Part 3: Month 3 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200 uppercase">
                  PART 03 · IN 60 DAYS
                </span>
                <span className="text-xs font-mono font-bold text-[#155EEF]">3/3 Split</span>
              </div>

              <div>
                <span className="text-3xl font-black text-[#071A33] font-mono block">₹4,000</span>
                <span className="text-xs text-slate-500 mt-1 block">Final payment on Day 60</span>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs font-mono text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Purchase State:</span>
                  <span className="text-emerald-600 font-bold">100% Complete</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Paid:</span>
                  <span className="text-[#071A33] font-bold">₹12,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
