'use client';

import React, { useState, useRef, useCallback } from 'react';
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
  Sliders,
  Check,
} from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const DigitalDocumentHero: React.FC = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [explosionFactor, setExplosionFactor] = useState(1); // Default to clearly exploded (1.0 = 100% exploded)
  const [activeLayer, setActiveLayer] = useState<'all' | 'layer1' | 'layer2' | 'layer3'>('all');

  // Smooth 3D tilt
  const [tilt, setTilt] = useState({ rx: 12, ry: -14 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    setTilt({
      rx: 12 - y * 10,
      ry: -14 + x * 12,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 12, ry: -14 });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <ScrollStage3D
      id="section-hero-digilocker"
      pin={false}
      perspective={1600}
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
        <div className="hidden xl:flex items-center gap-2 absolute top-28 right-16 px-3.5 py-1.5 rounded-full bg-white/95 border border-emerald-200 shadow-md text-emerald-800 text-[10px] font-mono font-bold tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>UIDAI_EKYC // 256-BIT_XML_VERIFIED</span>
        </div>

        <div className="hidden xl:flex items-center gap-2 absolute bottom-24 left-16 px-3.5 py-1.5 rounded-full bg-white/95 border border-blue-200 shadow-md text-blue-800 text-[10px] font-mono font-bold tracking-wider uppercase">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#155EEF]" />
          </span>
          <span>DIGITAL_ISSUER // STATUTORY_TRUST</span>
        </div>
      </div>

      {/* ── Main Editorial Hero Split (54% Text / 46% Clear 3D Exploded Visual) ── */}
      <div className="max-w-[1400px] mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center my-auto py-6">
        {/* Left Column: 3D Layered Text Emergence */}
        <div className="lg:col-span-6 space-y-6 text-left">
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
            <h1 className="text-4xl sm:text-6xl lg:text-[66px] font-black text-[#071A33] tracking-tight leading-[1.02] uppercase font-sans">
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
            <h1 className="text-4xl sm:text-6xl lg:text-[66px] font-black tracking-tight leading-[1.02] uppercase font-sans">
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

          {/* Layer 5: CTAs & Explode Slider (Z: -450px) */}
          <div
            data-depth-z="-450"
            data-rotate-x="15"
            data-offset-y="30"
            data-scale="0.85"
            data-blur="4"
            data-stagger="0.6"
            className="space-y-4 pt-1 font-sans"
          >
            <div className="flex flex-wrap items-center gap-4">
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
                onClick={() => setExplosionFactor((prev) => (prev > 0.5 ? 0 : 1))}
                className={`px-6 py-3.5 rounded-xl font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-xs flex items-center gap-2 cursor-pointer border ${
                  explosionFactor > 0.5
                    ? 'bg-blue-50 border-[#155EEF] text-[#155EEF]'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <Layers className="w-4 h-4 text-[#155EEF]" />
                <span>{explosionFactor > 0.5 ? 'COLLAPSE 3D STACK' : 'EXPLODE 3D STACK'}</span>
              </button>
            </div>

            {/* Exploded Separation Controller */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 max-w-md space-y-2 text-left">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#155EEF]" />
                  <span>3D AXIAL DECOMPOSITION:</span>
                </span>
                <span className="text-[#155EEF]">
                  {Math.round(explosionFactor * 100)}% SEPARATION
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={explosionFactor}
                onChange={(e) => setExplosionFactor(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
              />
            </div>
          </div>

          {/* Attribution Note */}
          <div className="pt-2 border-t border-slate-200/80 flex items-center gap-3 text-xs text-slate-500 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>
              Supports consent-based digital document access via DigiLocker ecosystem standards under MeitY guidelines.
            </span>
          </div>
        </div>

        {/* ── Right Column: CRYSTAL CLEAR 3D EXPLODED ARCHITECTURE STAGE ── */}
        <div
          data-depth-z="-900"
          data-rotate-x="18"
          data-rotate-y="16"
          data-scale="0.75"
          data-offset-y="70"
          data-blur="10"
          data-stagger="0.35"
          className="lg:col-span-6 flex items-center justify-center relative min-h-[620px] py-4"
        >
          {/* Master 3D Perspective Stage Container with Gyroscopic Hover Response */}
          <div
            ref={stageRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            className="relative w-full max-w-[480px] h-[580px] flex flex-col justify-between items-center transition-transform duration-300 select-none"
            style={{
              perspective: '1500px',
              transformStyle: 'preserve-3d',
              transform: `perspective(1500px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            }}
          >
            {/* ── 3D Guide Connecting Line (Visual Axle) ── */}
            {explosionFactor > 0.2 && (
              <div
                className="absolute left-8 top-12 bottom-12 w-0.5 border-l-2 border-dashed border-blue-400/40 pointer-events-none transition-opacity duration-300"
                style={{
                  transform: 'translateZ(40px)',
                  opacity: explosionFactor * 0.8,
                }}
              />
            )}

            {/* ── LAYER 3 (TOP): VERIFICATION & CONSENT PROTOCOL ── */}
            <div
              onClick={() => setActiveLayer(activeLayer === 'layer3' ? 'all' : 'layer3')}
              className={`w-full max-w-[440px] rounded-2xl bg-slate-900 text-white p-5 border transition-all duration-500 cursor-pointer text-left ${
                activeLayer === 'layer3' || activeLayer === 'all'
                  ? 'border-emerald-400 shadow-2xl shadow-emerald-500/20'
                  : 'border-slate-800 opacity-60'
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: `translate3d(${explosionFactor * 25}px, ${
                  (1 - explosionFactor) * 160
                }px, ${explosionFactor * 140}px)`,
                zIndex: 30,
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] font-mono">
                <span className="flex items-center gap-2 font-black text-emerald-400 tracking-wider uppercase">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  LAYER 03: VERIFICATION
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px]">
                  CONSENT ACTIVE · 100% PASS
                </span>
              </div>

              <div className="pt-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white font-sans">
                    Cryptographic Schema Validation
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    AXIAL Z: +140mm
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Explicit customer consent token committed. SHA-256 certificate signature verified against statutory public keys.
                </p>
              </div>
            </div>

            {/* ── LAYER 2 (MIDDLE): ACCREDITED ISSUER & DIGITAL REPOSITORY ── */}
            <div
              onClick={() => setActiveLayer(activeLayer === 'layer2' ? 'all' : 'layer2')}
              className={`w-full max-w-[440px] rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white p-5 border transition-all duration-500 cursor-pointer text-left ${
                activeLayer === 'layer2' || activeLayer === 'all'
                  ? 'border-cyan-300 shadow-2xl shadow-blue-600/30'
                  : 'border-blue-900 opacity-60'
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: `translate3d(${explosionFactor * 12}px, ${
                  (1 - explosionFactor) * 80
                }px, ${explosionFactor * 70}px)`,
                zIndex: 20,
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-blue-400/30 text-[11px] font-mono">
                <span className="flex items-center gap-2 font-black text-cyan-200 tracking-wider uppercase">
                  <Building2 className="w-4 h-4 text-cyan-300" />
                  LAYER 02: SOURCE & ISSUER
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-cyan-100 font-bold text-[10px]">
                  ACCREDITED REPOSITORY
                </span>
              </div>

              <div className="pt-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white font-sans">
                    Digital Issuer Attestation
                  </h4>
                  <span className="text-[10px] font-mono text-cyan-200">
                    AXIAL Z: +70mm
                  </span>
                </div>
                <p className="text-xs text-blue-100 font-sans leading-relaxed">
                  Direct XML payload retrieval from certified government and institutional issuers. Tamper-evident origin seal intact.
                </p>
              </div>
            </div>

            {/* ── LAYER 1 (BASE): THE STRUCTURED IDENTITY DOCUMENT SHEET ── */}
            <div
              onClick={() => setActiveLayer(activeLayer === 'layer1' ? 'all' : 'layer1')}
              className={`w-full max-w-[440px] rounded-2xl bg-white text-[#071A33] p-6 border transition-all duration-500 cursor-pointer text-left shadow-2xl ${
                activeLayer === 'layer1' || activeLayer === 'all'
                  ? 'border-blue-300 ring-2 ring-blue-500/10'
                  : 'border-slate-200 opacity-60'
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: `translate3d(0px, 0px, 0px)`,
                zIndex: 10,
              }}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#155EEF]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[#071A33] uppercase tracking-wider block">
                      LAYER 01: DOCUMENT BASE
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                      STRUCTURED RECORD PAYLOAD
                    </span>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>AVAILABLE</span>
                </div>
              </div>

              {/* Document Fields */}
              <div className="py-4 space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                    SUBJECT NAME (FICTIONAL)
                  </span>
                  <p className="text-sm font-bold text-[#071A33] font-sans">
                    DEMO USER
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                      DOCUMENT TYPE
                    </span>
                    <p className="text-xs font-bold text-slate-800 font-sans">
                      VERIFIED XML
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                      REFERENCE ID
                    </span>
                    <p className="text-xs font-mono font-bold text-[#155EEF]">
                      DEMO-48291
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] font-medium">Digital Issuer Signature Verified</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">256-BIT</span>
              </div>
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
