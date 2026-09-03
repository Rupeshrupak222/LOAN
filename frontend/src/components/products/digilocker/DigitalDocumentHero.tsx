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
  KeyRound,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const DigitalDocumentHero: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const docWrapperRef = useRef<HTMLDivElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const layer3Ref = useRef<HTMLDivElement>(null);
  const headlineOriginalRef = useRef<HTMLDivElement>(null);
  const headlineTransformedRef = useRef<HTMLDivElement>(null);
  const scrollTriggerAreaRef = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

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

    if (docWrapperRef.current && scrollProgress < 0.05) {
      docWrapperRef.current.style.transform = `perspective(1200px) rotateX(${g.rx.toFixed(
        2
      )}deg) rotateY(${g.ry.toFixed(2)}deg) translateZ(0)`;
    }

    if (Math.abs(g.rx - g.targetRx) > 0.02 || Math.abs(g.ry - g.targetRy) > 0.02) {
      g.rafId = requestAnimationFrame(updateTilt);
    } else {
      g.rafId = 0;
    }
  }, [scrollProgress]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!docWrapperRef.current || scrollProgress > 0.1) return;
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

  // Scroll 3D Layer Separation and Headline Transformation
  useEffect(() => {
    if (!containerRef.current || !scrollTriggerAreaRef.current) return;

    const ctx = gsap.context(() => {
      // Pin and scrub through the 3D layer separation
      ScrollTrigger.create({
        trigger: scrollTriggerAreaRef.current,
        start: 'top top',
        end: '+=100%',
        pin: true,
        scrub: 1,
        onUpdate: (self) => {
          const p = self.progress;
          setScrollProgress(p);

          // 1. Move doc toward center and tilt into 3D isometric plane
          if (docWrapperRef.current) {
            const rotX = 14 * p;
            const rotY = -12 * p;
            const transY = -40 * p;
            const scale = 1 + 0.05 * p;

            docWrapperRef.current.style.transform = `perspective(1200px) rotateX(${rotX.toFixed(
              2
            )}deg) rotateY(${rotY.toFixed(2)}deg) translateY(${transY.toFixed(1)}px) scale(${scale.toFixed(3)})`;
          }

          // 2. Separate Layer 2 (Source Layer - Middle)
          if (layer2Ref.current) {
            const z2 = 70 * p;
            const y2 = -35 * p;
            const op2 = Math.min(1, p * 2);
            layer2Ref.current.style.transform = `translateZ(${z2.toFixed(1)}px) translateY(${y2.toFixed(1)}px)`;
            layer2Ref.current.style.opacity = op2.toString();
          }

          // 3. Separate Layer 3 (Verification Layer - Top)
          if (layer3Ref.current) {
            const z3 = 140 * p;
            const y3 = -70 * p;
            const op3 = Math.min(1, p * 2.2);
            layer3Ref.current.style.transform = `translateZ(${z3.toFixed(1)}px) translateY(${y3.toFixed(1)}px)`;
            layer3Ref.current.style.opacity = op3.toString();
          }

          // 4. Headline Crossfade Transition
          if (headlineOriginalRef.current && headlineTransformedRef.current) {
            if (p > 0.4) {
              const fadeP = Math.min(1, (p - 0.4) / 0.3);
              headlineOriginalRef.current.style.opacity = (1 - fadeP).toString();
              headlineTransformedRef.current.style.opacity = fadeP.toString();
            } else {
              headlineOriginalRef.current.style.opacity = '1';
              headlineTransformedRef.current.style.opacity = '0';
            }
          }

          // 5. Clean exit fadeout before leaving
          if (heroContentRef.current) {
            if (p > 0.85) {
              const exitP = (p - 0.85) / 0.15;
              heroContentRef.current.style.opacity = (1 - exitP).toString();
              heroContentRef.current.style.transform = `scale(${(1 - exitP * 0.08).toFixed(3)})`;
            } else {
              heroContentRef.current.style.opacity = '1';
              heroContentRef.current.style.transform = 'scale(1)';
            }
          }
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      ref={containerRef}
      id="section-hero-digilocker"
      className="relative w-full bg-[#FFFFFF] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
    >
      {/* ScrollTrigger Pinned Area */}
      <div
        ref={scrollTriggerAreaRef}
        className="relative w-full min-h-screen flex flex-col justify-between pt-24 sm:pt-28 pb-12 px-4 sm:px-8 lg:px-12"
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

          {/* Soft Ambient Depth Glows */}
          <div className="absolute top-10 right-1/4 w-[650px] h-[550px] bg-gradient-to-bl from-blue-100/60 via-slate-50/40 to-transparent blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-[500px] h-[450px] bg-gradient-to-tr from-slate-100/80 via-blue-50/30 to-transparent blur-[120px] rounded-full pointer-events-none" />
        </div>

        {/* ── Main Editorial Hero Split Content ── */}
        <div
          ref={heroContentRef}
          className="max-w-[1400px] mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center my-auto py-6"
        >
          {/* ── Left Column (58%): Dynamic Headline Transition ── */}
          <div className="lg:col-span-7 space-y-6 text-left relative min-h-[320px] flex flex-col justify-center">
            {/* Eyebrow Label with Technical Mark */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#155EEF] animate-pulse" />
                <span>DIGITAL KYC INFRASTRUCTURE</span>
              </div>

              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-mono font-bold tracking-wide uppercase border border-slate-200">
                DIGILOCKER e-KYC
              </span>
            </div>

            {/* Original Headline (Fades out during scroll down) */}
            <div
              ref={headlineOriginalRef}
              className="space-y-6 transition-opacity duration-200"
            >
              <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black text-[#071A33] tracking-tight leading-[1.02] uppercase font-sans">
                VERIFY IDENTITY.{' '}
                <span className="bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-[#0A2540] bg-clip-text text-transparent block mt-1">
                  WITHOUT THE PAPER TRAIL.
                </span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl font-sans">
                Bring trusted digital documents into verification workflows with a consent-driven experience. Access authentic records directly through supported digital issuer channels without manual paper handling.
              </p>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2 font-sans">
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
            </div>

            {/* Transformed Headline (Fades in when scrolling down into 3D separation) */}
            <div
              ref={headlineTransformedRef}
              className="space-y-4 absolute top-12 left-0 right-0 pointer-events-none opacity-0 transition-opacity duration-200"
            >
              <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-black text-[#071A33] tracking-tight leading-[1.05] uppercase font-sans">
                ONE DOCUMENT.{' '}
                <span className="bg-gradient-to-r from-[#155EEF] to-emerald-600 bg-clip-text text-transparent block mt-1">
                  A CLEARER VERIFICATION JOURNEY.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl font-sans">
                Observe how the digital record separates into verifiable elements: authentic issuer credential, tamper-evident payload, and user authorization consent.
              </p>

              <div className="flex items-center gap-3 pt-2 text-xs font-mono font-bold text-[#155EEF]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>3D ATOMIC DECOMPOSITION ACTIVE</span>
              </div>
            </div>
          </div>

          {/* ── Right Column (42%): 3D Digital Document with 3 Separating Layers ── */}
          <div className="lg:col-span-5 flex items-center justify-center relative min-h-[460px]">
            {/* 3D Document Master Frame */}
            <div
              ref={docWrapperRef}
              onPointerMove={handlePointerMove}
              onPointerEnter={() => setIsHovered(true)}
              onPointerLeave={handlePointerLeave}
              className="relative w-full max-w-[420px] transition-transform duration-100"
              style={{
                transformStyle: 'preserve-3d',
                willChange: 'transform',
              }}
            >
              {/* ── LAYER 1 (BASE): DOCUMENT SHEET ── */}
              <div
                ref={layer1Ref}
                className="relative rounded-2xl bg-white border border-slate-200/90 p-7 shadow-2xl transition-all duration-300"
                style={{
                  transformStyle: 'preserve-3d',
                  boxShadow: isHovered
                    ? '0 30px 60px -12px rgba(7,26,51,0.18), 0 0 0 1px rgba(21,94,239,0.25)'
                    : '0 20px 45px -10px rgba(7,26,51,0.12), 0 0 0 1px rgba(226,232,240,0.8)',
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
                className="absolute inset-x-2 top-0 p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl pointer-events-none border border-blue-400/40 opacity-0"
                style={{
                  transformStyle: 'preserve-3d',
                  willChange: 'transform, opacity',
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
                className="absolute inset-x-4 -top-4 p-5 rounded-2xl bg-slate-900 text-white shadow-2xl pointer-events-none border border-emerald-500/50 opacity-0"
                style={{
                  transformStyle: 'preserve-3d',
                  willChange: 'transform, opacity',
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
            </div>
          </div>
        </div>

        {/* ── Bottom Scroll Direction Indicator ── */}
        <div className="max-w-[1400px] mx-auto w-full pt-4 text-center border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#155EEF] animate-pulse" />
            <span>SCROLL DOWN FOR 3D LAYER DECOMPOSITION</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-bold">
              {scrollProgress < 0.1
                ? '01 / DOCUMENT LOCKED'
                : scrollProgress < 0.8
                ? '02 / 3-LAYER SEPARATION'
                : '03 / ADVANCING TO FLOW'}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#155EEF] transition-transform duration-300 ${
                scrollProgress > 0.5 ? 'rotate-180 text-emerald-600' : 'animate-bounce'
              }`}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
