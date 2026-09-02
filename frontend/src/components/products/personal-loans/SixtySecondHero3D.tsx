'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  UserCheck,
  Building2,
  Lock,
  DollarSign,
  Layers,
  ChevronRight,
} from 'lucide-react';

type StageId = 'need' | 'apply' | 'verify' | 'decide' | 'disburse';

interface StageMeta {
  id: StageId;
  stepNum: string;
  label: string;
  headline: string;
  telemetry: string;
  simulatedTime: string;
  description: string;
}

const STAGES: StageMeta[] = [
  {
    id: 'need',
    stepNum: '01',
    label: 'NEED',
    headline: 'Identify Financial Requirement',
    telemetry: 'Trigger: User selects required capital',
    simulatedTime: '00:00s',
    description: 'Select desired loan amount from ₹10,000 to ₹5,00,000 tailored to your personal life milestone.',
  },
  {
    id: 'apply',
    stepNum: '02',
    label: 'APPLY',
    headline: 'Minimal Digital Application',
    telemetry: 'Ingress: Aadhaar / PAN instant fetch',
    simulatedTime: '00:15s',
    description: 'Zero physical paperwork. Basic identity attributes retrieved seamlessly via secure consent protocols.',
  },
  {
    id: 'verify',
    stepNum: '03',
    label: 'VERIFY',
    headline: 'Instant KYC & Account Aggregator',
    telemetry: 'Verification: Income & Penny Drop OK',
    simulatedTime: '00:30s',
    description: 'Automated bank statement analysis and penny drop verification confirm bank account ownership instantly.',
  },
  {
    id: 'decide',
    stepNum: '04',
    label: 'DECIDE',
    headline: 'Algorithmic Credit Scoring',
    telemetry: 'Decision Core: Risk Policy Evaluated',
    simulatedTime: '00:45s',
    description: 'Proprietary credit intelligence engine evaluates debt-to-income ratios and generates an immediate offer.',
  },
  {
    id: 'disburse',
    stepNum: '05',
    label: 'DISBURSE',
    headline: 'Sub-Second IMPS Disbursal',
    telemetry: 'Settlement: Direct Bank Credit Committed',
    simulatedTime: '00:60s',
    description: 'Approved capital transferred directly to your bank account via instant IMPS clearing rails.',
  },
];

export const SixtySecondHero3D: React.FC = () => {
  const [activeStage, setActiveStage] = useState<StageId>('verify');
  const [isAssembled, setIsAssembled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);

  // 3D Parallax Gyro Physics
  const gyro = useRef({
    rx: 0,
    ry: 0,
    targetRx: 0,
    targetRy: 0,
    isHovered: false,
    rafId: 0,
  });

  const updateParallax = useCallback(() => {
    const g = gyro.current;
    const factor = g.isHovered ? 0.1 : 0.05;

    g.rx += (g.targetRx - g.rx) * factor;
    g.ry += (g.targetRy - g.ry) * factor;

    if (clockRef.current) {
      clockRef.current.style.transform = `perspective(1400px) rotateX(${g.rx.toFixed(
        2
      )}deg) rotateY(${g.ry.toFixed(2)}deg)`;
    }

    const isSettled = !g.isHovered && Math.abs(g.rx) < 0.02 && Math.abs(g.ry) < 0.02;

    if (!isSettled) {
      g.rafId = requestAnimationFrame(updateParallax);
    } else {
      g.rx = 0;
      g.ry = 0;
      if (clockRef.current) {
        clockRef.current.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg)';
      }
      g.rafId = 0;
    }
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    const g = gyro.current;
    g.isHovered = true;
    g.targetRy = normX * 8; // Max 8deg horizontal
    g.targetRx = -normY * 6; // Max 6deg vertical

    if (!g.rafId) {
      g.rafId = requestAnimationFrame(updateParallax);
    }
  };

  const handlePointerLeave = () => {
    const g = gyro.current;
    g.isHovered = false;
    g.targetRx = 0;
    g.targetRy = 0;
  };

  // Entrance assembly animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAssembled(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const currentMeta = STAGES.find((s) => s.id === activeStage) || STAGES[2];

  return (
    <section
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full min-h-[92vh] pt-10 sm:pt-14 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#EFF6FF]"
    >
      {/* Ambient background grid & lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[500px] bg-gradient-to-tr from-blue-400/20 via-indigo-500/15 to-teal-400/10 blur-[140px] rounded-full pointer-events-none" />

      {/* ── Top Narrative Eyebrow ── */}
      <div className="relative z-10 max-w-4xl mx-auto space-y-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/90 text-xs font-bold font-mono text-[#155EEF] shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#155EEF] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#155EEF]" />
          </span>
          <span>ADYAPAN FINANCIAL ARCHITECTURE · PERSONAL LENDING ENGINE</span>
        </div>

        {/* ── Massive Headline ── */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#071A33] leading-[1.08]">
          WHEN YOU NEED IT,{' '}
          <span className="bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-indigo-700 bg-clip-text text-transparent">
            THE JOURNEY SHOULD MOVE.
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
          An intuitive, paperless lending experience designed to transition smoothly from application and algorithmic scoring to instant disbursal with radical clarity.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#journey-sim"
            className="px-6 py-3.5 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-xl shadow-[#155EEF]/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>Follow the 60-Second Flow</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#calculator"
            className="px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#071A33] font-bold text-xs border border-slate-300 shadow-sm transition-all hover:scale-105"
          >
            Calculate Amount & Tenure →
          </a>
        </div>
      </div>

      {/* ── Central 3D "60-Second" Engine Mechanism Canvas ── */}
      <div className="relative z-20 w-full max-w-5xl mt-12 flex items-center justify-center">
        {/* Ambient Mechanism Shadow */}
        <div className="absolute w-full h-[400px] rounded-3xl bg-[#071A33]/15 blur-3xl translate-y-12 pointer-events-none" />

        {/* ── 3D Time & Lending Mechanism Container ── */}
        <div
          ref={clockRef}
          className={`relative w-full rounded-3xl border border-slate-300/80 bg-white/95 backdrop-blur-xl p-6 sm:p-9 shadow-2xl transition-all duration-700 select-none ${
            isAssembled ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-6'
          }`}
          style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
        >
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-200">
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#071A33] text-white flex items-center justify-center font-bold font-mono text-sm shadow-sm">
                60s
              </div>
              <div>
                <span className="text-sm font-black text-[#071A33]">THE 60-SECOND LENDING TIME MECHANISM</span>
                <p className="text-[10px] font-mono text-slate-400">Target Digital Journey Simulation</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#155EEF] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-[#155EEF] animate-ping" />
              <span>STAGE: {currentMeta.label} ({currentMeta.simulatedTime})</span>
            </div>
          </div>

          {/* ── 3D Spatial Layout: Left 60 Monument + Right Journey Card ── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left Column: The 3D Dimensional "60" Time Dial */}
            <div className="md:col-span-6 flex flex-col items-center justify-center p-6 relative">
              {/* Outer Rotating Time Ring */}
              <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 border-dashed border-blue-200/90 flex items-center justify-center relative animate-[spin_60s_linear_infinite]">
                <div className="absolute top-0 w-3.5 h-3.5 rounded-full bg-[#155EEF] shadow-lg shadow-[#155EEF]/50 -translate-y-1/2" />
                <div className="absolute bottom-0 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md translate-y-1/2" />
              </div>

              {/* Inner 3D "60" Capsule */}
              <div
                className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-tr from-[#071A33] via-[#0F294D] to-[#155EEF] text-white flex flex-col items-center justify-center shadow-2xl border-4 border-white/40 group cursor-pointer transition-transform hover:scale-105"
                style={{ transform: 'translateZ(35px)' }}
              >
                <span className="text-[10px] font-mono font-bold tracking-widest text-blue-300 uppercase">
                  TARGET TIMEFRAME
                </span>
                <span className="text-6xl sm:text-7xl font-black font-mono tracking-tighter leading-none my-1 bg-gradient-to-b from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
                  60
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-300 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> SECONDS FLOW
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Stage Stepper & Readout */}
            <div className="md:col-span-6 space-y-4 text-left font-mono">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Interactive Journey Progression
              </span>

              {/* 5-Stage Stepper Buttons */}
              <div className="grid grid-cols-5 gap-1.5">
                {STAGES.map((st) => {
                  const isSelected = activeStage === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setActiveStage(st.id)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-md scale-105'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <span className="text-[9px] font-bold block opacity-75">{st.stepNum}</span>
                      <span className="text-[10px] font-black truncate block">{st.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Stage Detail Card */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2.5 shadow-xl">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-xs">
                  <span className="text-blue-300 font-bold">{currentMeta.stepNum} · {currentMeta.headline}</span>
                  <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {currentMeta.simulatedTime}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {currentMeta.description}
                </p>

                <div className="pt-2 flex justify-between items-center text-[10px] text-slate-400">
                  <span>{currentMeta.telemetry}</span>
                  <span className="text-emerald-400 font-bold">STATE READY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Simulated Journey Notice Strip ── */}
      <div className="relative z-20 mt-6 max-w-2xl mx-auto w-full p-3 rounded-2xl bg-white border border-slate-200/90 shadow-md flex items-center justify-between font-mono text-xs text-left">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-bold text-[#071A33]">SIMULATED JOURNEY:</span>
          <span className="font-black text-[#155EEF]">NEED → APPLY → VERIFY → DECIDE → DISBURSE</span>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#155EEF] border border-blue-200">
          DEMO EXPERIENCE
        </span>
      </div>
      <p className="text-[10px] font-mono text-slate-400 mt-2">
        * Illustrative target workflow demonstration. Actual lending outcomes depend on partner underwriting criteria.
      </p>
    </section>
  );
};
