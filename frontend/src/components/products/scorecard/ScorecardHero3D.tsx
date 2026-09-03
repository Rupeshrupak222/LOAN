'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Activity,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const ScorecardHero3D: React.FC = () => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 3D gyroscopic tilt strictly bounded to 5–7 degrees
  const gyro = useRef({
    rx: 0,
    ry: 0,
    targetRx: 0,
    targetRy: 0,
    rafId: 0,
  });

  const updateTilt = useCallback(() => {
    const g = gyro.current;
    g.rx += (g.targetRx - g.rx) * 0.08;
    g.ry += (g.targetRy - g.ry) * 0.08;

    if (sheetRef.current) {
      sheetRef.current.style.transform = `perspective(1200px) rotateX(${g.rx.toFixed(
        2
      )}deg) rotateY(${g.ry.toFixed(2)}deg) translateZ(0)`;
    }

    if (Math.abs(g.rx - g.targetRx) > 0.02 || Math.abs(g.ry - g.targetRy) > 0.02) {
      g.rafId = requestAnimationFrame(updateTilt);
    } else {
      g.rafId = 0;
    }
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sheetRef.current) return;
    const rect = sheetRef.current.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    const g = gyro.current;
    g.targetRy = Math.max(-7, Math.min(7, normX * 7));
    g.targetRx = Math.max(-7, Math.min(7, -normY * 7));

    if (!g.rafId) {
      g.rafId = requestAnimationFrame(updateTilt);
    }
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    const g = gyro.current;
    g.targetRx = 0;
    g.targetRy = 0;
    if (!g.rafId) {
      g.rafId = requestAnimationFrame(updateTilt);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <ScrollStage3D
      id="scorecard-hero"
      isHero={true}
      pin={false}
      perspective={1500}
      className="min-h-[96vh] flex flex-col justify-between pt-24 sm:pt-28 pb-12 px-4 sm:px-8 lg:px-12 bg-[#FFFFFF] text-[#071A33] border-b border-slate-200 select-none relative overflow-hidden"
    >
      {/* ── Subdued Financial Blueprint Grid Lines & Precision Cones ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(to right, #071A33 1px, transparent 1px), linear-gradient(to bottom, #071A33 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-10 right-1/4 w-[650px] h-[550px] bg-gradient-to-bl from-blue-100/60 via-slate-50/40 to-transparent blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[500px] h-[450px] bg-gradient-to-tr from-slate-100/80 via-blue-50/30 to-transparent blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* ── Main Editorial Split (58% Typography / 42% The Financial Portrait) ── */}
      <div className="max-w-[1400px] mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center my-auto py-8">
        {/* Left Column: Editorial Value Prop */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Eyebrow Pill */}
          <div
            data-depth-z="-500"
            data-rotate-x="20"
            data-offset-y="30"
            data-scale="0.85"
            data-blur="5"
            className="flex flex-wrap items-center gap-3"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#155EEF] animate-pulse" />
              <span>4-PILLAR RISK ENGINE</span>
            </div>

            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-mono font-bold tracking-wide uppercase border border-slate-200">
              AI UNDERWRITING SCORECARD
            </span>
          </div>

          {/* Headline Line 1: READ THE */}
          <div
            data-depth-z="-700"
            data-rotate-x="30"
            data-offset-y="60"
            data-scale="0.75"
            data-blur="8"
            data-stagger="0.15"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-[70px] font-black text-[#071A33] tracking-tight leading-[1.02] uppercase font-sans">
              READ THE
            </h1>
          </div>

          {/* Headline Line 2: FINANCIAL PICTURE. */}
          <div
            data-depth-z="-1000"
            data-rotate-x="38"
            data-offset-y="90"
            data-scale="0.65"
            data-blur="12"
            data-stagger="0.3"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-[70px] font-black tracking-tight leading-[1.02] uppercase font-sans">
              <span className="bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-[#0A2540] bg-clip-text text-transparent block mt-1">
                FINANCIAL PICTURE.
              </span>
            </h1>
          </div>

          {/* Supporting Statement */}
          <div
            data-depth-z="-650"
            data-rotate-y="-8"
            data-offset-y="40"
            data-scale="0.82"
            data-blur="6"
            data-stagger="0.45"
          >
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl font-sans">
              Turn multiple financial signals into a structured underwriting view. Evaluate income stability, credit vintage, debt obligations, and cashflow behaviour in a unified multi-dimensional framework.
            </p>
          </div>

          {/* Action CTAs */}
          <div
            data-depth-z="-450"
            data-rotate-x="15"
            data-offset-y="30"
            data-scale="0.85"
            data-blur="4"
            data-stagger="0.6"
            className="flex flex-wrap items-center gap-4 pt-2 font-sans"
          >
            <button
              type="button"
              onClick={() => scrollToSection('scorecard-four-pillars')}
              className="px-7 py-3.5 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs font-mono tracking-wider uppercase shadow-md shadow-[#155EEF]/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2.5 cursor-pointer"
            >
              <span>EXPLORE THE SCORECARD</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('scorecard-interactive-demo')}
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>SEE HOW IT WORKS</span>
            </button>
          </div>

          {/* Architectural Statement */}
          <div className="pt-3 border-t border-slate-200/80 flex items-center gap-3 text-xs text-slate-500 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>
              A lending decision should not be based on one number. Structured decision context over reductive single-metric scoring.
            </span>
          </div>
        </div>

        {/* ── Right Column: THE FINANCIAL PORTRAIT (3D Vertical Profile Sheet) ── */}
        <div
          data-depth-z="-900"
          data-rotate-x="18"
          data-rotate-y="16"
          data-scale="0.75"
          data-offset-y="70"
          data-blur="10"
          data-stagger="0.35"
          className="lg:col-span-5 flex items-center justify-center relative min-h-[480px]"
        >
          {/* 3D Financial Portrait Master Frame */}
          <div
            ref={sheetRef}
            onPointerMove={handlePointerMove}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={handlePointerLeave}
            className="relative w-full max-w-[420px] rounded-2xl bg-white border border-slate-200/90 p-7 shadow-2xl transition-all duration-300 cursor-pointer text-left"
            style={{
              transformStyle: 'preserve-3d',
              willChange: 'transform',
              boxShadow: isHovered
                ? '0 30px 60px -12px rgba(7,26,51,0.18), 0 0 0 1px rgba(21,94,239,0.25)'
                : '0 20px 45px -10px rgba(7,26,51,0.12), 0 0 0 1px rgba(226,232,240,0.8)',
              transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
            }}
          >
            {/* Header Lockup */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#155EEF]" />
                </div>
                <div>
                  <span className="text-[11px] font-mono font-bold text-[#071A33] uppercase tracking-wider block">
                    THE FINANCIAL PORTRAIT
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                    ILLUSTRATIVE EVALUATION MATRIX
                  </span>
                </div>
              </div>

              <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>CALIBRATED</span>
              </div>
            </div>

            {/* Central Score Indicator Ring */}
            <div className="py-5 text-center space-y-2 border-b border-slate-100">
              <div className="inline-flex flex-col items-center justify-center w-24 h-24 rounded-full bg-slate-50 border border-slate-200 shadow-inner">
                <span className="text-3xl font-black font-mono text-[#155EEF]">814</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">TIER A PRIME</span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                COMPOSITE UNDERWRITING SCORE
              </p>
            </div>

            {/* 4 Physical Layer Signals: Income, Credit, Obligations, Behaviour */}
            <div className="py-4 space-y-2.5 font-mono text-xs">
              {/* Layer 1: Income */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-bold text-[#071A33] text-[11px]">01. INCOME STABILITY</span>
                </div>
                <span className="text-emerald-700 font-bold text-[10px]">₹1.45L / MO · STABLE</span>
              </div>

              {/* Layer 2: Credit */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-bold text-[#071A33] text-[11px]">02. CREDIT PROFILE</span>
                </div>
                <span className="text-emerald-700 font-bold text-[10px]">76 MO VINTAGE · 0 DPD</span>
              </div>

              {/* Layer 3: Obligations */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-bold text-[#071A33] text-[11px]">03. DEBT OBLIGATIONS</span>
                </div>
                <span className="text-blue-700 font-bold text-[10px]">26% DTI · OPTIMAL</span>
              </div>

              {/* Layer 4: Behaviour */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                  <span className="font-bold text-[#071A33] text-[11px]">04. CASHFLOW BEHAVIOUR</span>
                </div>
                <span className="text-emerald-700 font-bold text-[10px]">HIGH RESILIENCE</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans">
              <span className="text-[11px]">Decision: Pre-Approved Context</span>
              <span className="text-[10px] font-mono text-slate-400">DEMO PROFILE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Scroll Cue */}
      <div className="max-w-[1400px] mx-auto w-full pt-6 pb-2 text-center border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#155EEF] animate-pulse" />
          <span>SCROLL DOWN TO ADVANCE UNDERWRITING DIMENSIONS</span>
        </div>
        <ChevronDown className="w-4 h-4 text-[#155EEF] animate-bounce" />
      </div>
    </ScrollStage3D>
  );
};
