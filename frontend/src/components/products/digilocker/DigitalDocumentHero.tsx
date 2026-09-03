'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Lock,
  Eye,
  Layers,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const DigitalDocumentHero: React.FC = () => {
  const docWrapperRef = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  // 3D gyroscopic tilt (strictly bounded to max 5–7 degrees)
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

    if (docWrapperRef.current) {
      docWrapperRef.current.style.transform = `perspective(1000px) rotateX(${g.rx.toFixed(
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
    if (!docWrapperRef.current) return;
    const rect = docWrapperRef.current.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    const g = gyro.current;
    // Strictly bounded to max 6 degrees
    g.targetRy = Math.max(-6, Math.min(6, normX * 6));
    g.targetRx = Math.max(-6, Math.min(6, -normY * 6));

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
      id="section-hero-digilocker"
      pin={false}
      perspective={1500}
      className="min-h-[96vh] flex flex-col justify-between pt-24 sm:pt-28 pb-12 px-4 sm:px-8 lg:px-12 bg-[#FFFFFF] text-[#071A33] border-b border-slate-200 select-none relative overflow-hidden"
    >
      {/* ── Subdued Editorial Background Grid Lines ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Fine Technical Document Grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(to right, #071A33 1px, transparent 1px), linear-gradient(to bottom, #071A33 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Subtle Ambient Radial Cones */}
        <div className="absolute top-10 right-1/4 w-[600px] h-[500px] bg-gradient-to-bl from-blue-100/50 via-slate-50/30 to-transparent blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[500px] h-[400px] bg-gradient-to-tr from-slate-100/60 via-blue-50/20 to-transparent blur-[110px] rounded-full pointer-events-none" />
      </div>

      {/* ── Main Editorial Hero Split (58% Narrative / 42% 3D Document) ── */}
      <div className="max-w-[1400px] mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center my-auto py-8">
        {/* Left Column (58%): Editorial Typography & Direct Value Prop */}
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
              <span>DIGITAL KYC INFRASTRUCTURE</span>
            </div>

            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-mono font-bold tracking-wide uppercase border border-slate-200">
              DIGILOCKER e-KYC
            </span>
          </div>

          {/* Primary Editorial Headline: VERIFY IDENTITY. WITHOUT THE PAPER TRAIL. */}
          <div
            data-depth-z="-700"
            data-rotate-x="30"
            data-offset-y="60"
            data-scale="0.75"
            data-blur="8"
            data-stagger="0.15"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-black text-[#071A33] tracking-tight leading-[1.02] uppercase font-sans">
              VERIFY IDENTITY.
            </h1>
          </div>

          <div
            data-depth-z="-1000"
            data-rotate-x="38"
            data-offset-y="90"
            data-scale="0.65"
            data-blur="12"
            data-stagger="0.3"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-black tracking-tight leading-[1.02] uppercase font-sans">
              <span className="bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-[#0A2540] bg-clip-text text-transparent block mt-1">
                WITHOUT THE PAPER TRAIL.
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
              Bring trusted digital documents into verification workflows with a consent-driven experience. Access authentic records directly through supported digital issuer channels without manual paper handling.
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
              onClick={() => scrollToSection('section-flow')}
              className="px-7 py-3.5 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs font-mono tracking-wider uppercase shadow-md shadow-[#155EEF]/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2.5 cursor-pointer"
            >
              <span>EXPLORE VERIFICATION</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('section-before-after')}
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>VIEW THE FLOW</span>
            </button>
          </div>

          {/* Government Initiative Attribution Note */}
          <div className="pt-3 border-t border-slate-200/80 flex items-center gap-3 text-xs text-slate-500 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>
              Supports consent-based digital document access via DigiLocker ecosystem standards under MeitY guidelines.
            </span>
          </div>
        </div>

        {/* ── Right Column (42%): Clean 3D Abstract Digital Document ── */}
        <div
          data-depth-z="-900"
          data-rotate-x="18"
          data-rotate-y="16"
          data-scale="0.75"
          data-offset-y="70"
          data-blur="10"
          data-stagger="0.35"
          className="lg:col-span-5 flex items-center justify-center relative min-h-[460px]"
        >
          {/* 3D Document Sheet Frame */}
          <div
            ref={docWrapperRef}
            onPointerMove={handlePointerMove}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={handlePointerLeave}
            className="relative w-full max-w-[420px] rounded-2xl bg-white border border-slate-200/90 p-7 shadow-2xl transition-all duration-300 cursor-pointer"
            style={{
              transformStyle: 'preserve-3d',
              willChange: 'transform',
              boxShadow: isHovered
                ? '0 30px 60px -12px rgba(7,26,51,0.18), 0 0 0 1px rgba(21,94,239,0.25)'
                : '0 20px 45px -10px rgba(7,26,51,0.12), 0 0 0 1px rgba(226,232,240,0.8)',
              transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
            }}
          >
            {/* Top Sheet Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#155EEF]" />
                </div>
                <div>
                  <span className="text-[11px] font-mono font-bold text-[#071A33] uppercase tracking-wider block">
                    IDENTITY DOCUMENT
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                    DEMONSTRATION DATA
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>AVAILABLE</span>
              </div>
            </div>

            {/* Document Body Demonstration Fields */}
            <div className="py-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1 text-left">
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                  SUBJECT NAME (FICTIONAL)
                </span>
                <p className="text-sm font-bold text-[#071A33] font-sans">
                  DEMO USER
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1 text-left">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                    DOCUMENT TYPE
                  </span>
                  <p className="text-xs font-bold text-slate-800 font-sans">
                    VERIFIED DOCUMENT
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1 text-left">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                    REFERENCE ID
                  </span>
                  <p className="text-xs font-mono font-bold text-[#155EEF]">
                    DEMO-48291
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Security Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-medium">Digital Issuer Signature Verified</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">256-BIT</span>
            </div>

            {/* ── Hover Overlay: Sliding Verification Confirmation Layer ── */}
            <div
              className={`absolute inset-x-4 -top-3 p-4 rounded-xl bg-slate-900 text-white shadow-2xl transition-all duration-300 pointer-events-none border border-slate-700 ${
                isHovered
                  ? 'opacity-100 -translate-y-8 scale-100'
                  : 'opacity-0 translate-y-0 scale-95'
              }`}
              style={{ transform: isHovered ? 'translateY(-34px) translateZ(40px)' : 'translateY(0)' }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  CONSENT GRANTED
                </span>
                <span className="text-slate-400">DIGITAL ISSUER OK</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 font-sans text-left">
                Document ready for verification in accordance with user authorization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Cue */}
      <div className="max-w-[1400px] mx-auto w-full pt-6 pb-2 text-center border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#155EEF] animate-pulse" />
          <span>SCROLL DOWN TO ADVANCE 3D VERIFICATION STAGES</span>
        </div>
        <ChevronDown className="w-4 h-4 text-[#155EEF] animate-bounce" />
      </div>
    </ScrollStage3D>
  );
};
