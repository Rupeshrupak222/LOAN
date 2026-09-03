'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Lock,
  Layers,
  Sparkles,
  ChevronDown,
  Building2,
  Eye,
} from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const DigitalDocumentHero: React.FC = () => {
  const docWrapperRef = useRef<HTMLDivElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const layer3Ref = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isExploded, setIsExploded] = useState(false);

  // 3D gyroscopic tilt bounded to max 6–8 degrees
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
      docWrapperRef.current.style.transform = `perspective(1200px) rotateX(${g.rx.toFixed(
        2
      )}deg) rotateY(${g.ry.toFixed(2)}deg)`;
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
    g.targetRy = Math.max(-8, Math.min(8, normX * 8));
    g.targetRx = Math.max(-8, Math.min(8, -normY * 8));

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

  const showLayers = isHovered || isExploded;

  return (
    <ScrollStage3D
      id="section-hero-digilocker"
      pin={false}
      perspective={1500}
      className="min-h-[96vh] flex flex-col justify-between pt-24 sm:pt-28 pb-12 px-4 sm:px-8 lg:px-12 bg-[#FFFFFF] text-[#071A33] border-b border-slate-200 select-none relative overflow-hidden"
    >
      {/* ── 3D Cryptographic Identity Atmosphere & Isometric Floor Grid ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Isometric Perspective Floor Grid */}
        <div
          className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[1850px] h-[920px] opacity-35"
          style={{
            transform: 'perspective(850px) rotateX(62deg) translateZ(-40px)',
            backgroundImage: `
              linear-gradient(to right, rgba(16, 185, 129, 0.28) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(14, 165, 233, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '46px 46px',
            maskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
          }}
        />

        {/* Volumetric Glowing Cones */}
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[650px] h-[500px] bg-gradient-to-br from-emerald-400/18 via-teal-500/12 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-10 right-1/4 w-[600px] h-[500px] bg-gradient-to-bl from-blue-600/15 via-indigo-500/10 to-transparent blur-[130px] rounded-full" />

        {/* Floating 3D Telemetry Badges */}
        <div className="hidden xl:flex items-center gap-2 absolute top-28 right-16 px-3.5 py-1.5 rounded-full bg-white/90 border border-emerald-200 shadow-md text-emerald-800 text-[10px] font-mono font-bold tracking-wider uppercase animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>UIDAI_EKYC // 256-BIT_XML_VERIFIED</span>
        </div>

        <div className="hidden xl:flex items-center gap-2 absolute bottom-24 left-16 px-3.5 py-1.5 rounded-full bg-white/90 border border-blue-200 shadow-md text-blue-800 text-[10px] font-mono font-bold tracking-wider uppercase">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#155EEF]" />
          </span>
          <span>DIGITAL_ISSUER // STATUTORY_TRUST</span>
        </div>
      </div>

      {/* ── Main Editorial Hero Split (58% Text / 42% 3D Document) ── */}
      <div className="max-w-[1400px] mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center my-auto py-8">
        {/* Left Column: 3D Layered Text Emergence */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Layer 1: Eyebrow (Z: -500px) */}
          <div
            data-depth-z="-500"
            data-rotate-x="20"
            data-offset-y="30"
            data-scale="0.85"
            data-blur="5"
            className="flex flex-wrap items-center gap-3"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-mono font-bold tracking-wider uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>DIGITAL KYC INFRASTRUCTURE</span>
            </div>

            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#155EEF] text-[11px] font-mono font-bold tracking-wide uppercase border border-blue-200">
              DIGILOCKER e-KYC
            </span>
          </div>

          {/* Layer 2: Line 1 (Z: -700px, rotX: 30deg) */}
          <div
            data-depth-z="-700"
            data-rotate-x="30"
            data-offset-y="60"
            data-scale="0.75"
            data-blur="8"
            data-stagger="0.15"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black text-[#071A33] tracking-tight leading-[1.02] uppercase font-sans">
              VERIFY IDENTITY.
            </h1>
          </div>

          {/* Layer 3: Line 2 (Z: -1000px, rotX: 38deg) */}
          <div
            data-depth-z="-1000"
            data-rotate-x="38"
            data-offset-y="90"
            data-scale="0.65"
            data-blur="12"
            data-stagger="0.3"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight leading-[1.02] uppercase font-sans">
              <span className="bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-[#0A2540] bg-clip-text text-transparent block mt-1">
                WITHOUT THE PAPER TRAIL.
              </span>
            </h1>
          </div>

          {/* Layer 4: Description (Z: -650px) */}
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

          {/* Layer 5: CTAs (Z: -450px) */}
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
              onClick={() => setIsExploded((prev) => !prev)}
              className={`px-6 py-3.5 rounded-xl font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-xs flex items-center gap-2 cursor-pointer border ${
                isExploded
                  ? 'bg-blue-50 border-[#155EEF] text-[#155EEF]'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4 text-[#155EEF]" />
              <span>{isExploded ? 'COLLAPSE 3D LAYERS' : 'EXPLODE 3D LAYERS'}</span>
            </button>
          </div>

          {/* Attribution Note */}
          <div className="pt-3 border-t border-slate-200/80 flex items-center gap-3 text-xs text-slate-500 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>
              Supports consent-based digital document access via DigiLocker ecosystem standards under MeitY guidelines.
            </span>
          </div>
        </div>

        {/* ── Right Column: 3D Digital Document with 3 Separating Physical Layers ── */}
        <div
          data-depth-z="-900"
          data-rotate-x="18"
          data-rotate-y="16"
          data-scale="0.75"
          data-offset-y="70"
          data-blur="10"
          data-stagger="0.35"
          className="lg:col-span-5 flex items-center justify-center relative min-h-[500px]"
        >
          {/* Master 3D Perspective Frame */}
          <div
            ref={docWrapperRef}
            onPointerMove={handlePointerMove}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={handlePointerLeave}
            className="relative w-full max-w-[430px] transition-transform duration-200 cursor-pointer"
            style={{
              transformStyle: 'preserve-3d',
              perspective: '1200px',
            }}
          >
            {/* ── LAYER 1 (BASE): DOCUMENT SHEET ── */}
            <div
              ref={layer1Ref}
              className="relative rounded-2xl bg-white border border-slate-200/90 p-7 shadow-2xl transition-all duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: showLayers
                  ? 'translateZ(0px) rotateX(4deg) scale(0.98)'
                  : 'translateZ(0px) rotateX(0deg) scale(1)',
                boxShadow: showLayers
                  ? '0 35px 70px -15px rgba(7,26,51,0.22), 0 0 0 1px rgba(21,94,239,0.3)'
                  : '0 20px 45px -10px rgba(7,26,51,0.12), 0 0 0 1px rgba(226,232,240,0.8)',
              }}
            >
              {/* Header */}
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

                <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>AVAILABLE</span>
                </div>
              </div>

              {/* Document Body */}
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

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] font-medium">Digital Issuer Signature Verified</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">256-BIT</span>
              </div>
            </div>

            {/* ── LAYER 2 (MIDDLE): SEPARATING SOURCE & ISSUER PLATE ── */}
            <div
              ref={layer2Ref}
              className={`absolute inset-x-2 top-0 p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl pointer-events-none border border-blue-400/40 transition-all duration-500 ${
                showLayers
                  ? 'opacity-100'
                  : 'opacity-0 translate-y-0 scale-95'
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: showLayers
                  ? 'translateZ(75px) translateY(-32px) rotateX(6deg)'
                  : 'translateZ(0px) translateY(0px)',
              }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-blue-400/40 text-[10px] font-mono">
                <span className="flex items-center gap-1.5 font-bold text-cyan-200">
                  <Building2 className="w-3.5 h-3.5" />
                  LAYER 02: SOURCE
                </span>
                <span className="text-blue-200">ACCREDITED ISSUER</span>
              </div>
              <div className="pt-3 text-left space-y-1">
                <p className="text-xs font-bold font-sans">
                  Digital Repository Attestation
                </p>
                <p className="text-[11px] text-blue-100 font-sans">
                  Origin certificate verified against statutory public key infrastructure.
                </p>
              </div>
            </div>

            {/* ── LAYER 3 (TOP): SEPARATING VERIFICATION & CONSENT PLATE ── */}
            <div
              ref={layer3Ref}
              className={`absolute inset-x-4 -top-3 p-5 rounded-2xl bg-slate-900 text-white shadow-2xl pointer-events-none border border-emerald-500/50 transition-all duration-500 ${
                showLayers
                  ? 'opacity-100'
                  : 'opacity-0 translate-y-0 scale-95'
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: showLayers
                  ? 'translateZ(145px) translateY(-64px) rotateX(10deg)'
                  : 'translateZ(0px) translateY(0px)',
              }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] font-mono">
                <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  LAYER 03: VERIFICATION
                </span>
                <span className="text-slate-400">CONSENT ACTIVE</span>
              </div>
              <div className="pt-3 text-left space-y-1">
                <p className="text-xs font-bold font-sans text-emerald-300">
                  Verified Schema Integrity
                </p>
                <p className="text-[11px] text-slate-300 font-sans">
                  Explicit consent confirmed · Instant loan onboarding compliance pass.
                </p>
              </div>
            </div>

            {/* Hover / Explode Status Pill */}
            <div className="pt-3 text-center">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                <Eye className="w-3 h-3 text-[#155EEF]" />
                {showLayers ? '3D MULTI-LAYER DECOMPOSITION EXPANDED' : 'HOVER OR CLICK "EXPLODE 3D LAYERS" TO INSPECT'}
              </span>
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
