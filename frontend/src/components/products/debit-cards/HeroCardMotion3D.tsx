'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  RotateCw,
  Wifi,
  Eye,
  EyeOff,
} from 'lucide-react';

type CardState = 'ready' | 'authenticating' | 'paying' | 'approved';

export const HeroCardMotion3D: React.FC = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardState, setCardState] = useState<CardState>('ready');
  const [showSensitive, setShowSensitive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  // 3D Tilt Physics (Damped Inertia for mouse tracking)
  const gyro = useRef({
    rx: 0,
    ry: 0,
    targetRx: 0,
    targetRy: 0,
    glareX: 50,
    glareY: 50,
    isHovered: false,
    rafId: 0,
  });

  const updateTilt = useCallback(() => {
    const g = gyro.current;
    const factor = g.isHovered ? 0.12 : 0.06;

    g.rx += (g.targetRx - g.rx) * factor;
    g.ry += (g.targetRy - g.ry) * factor;

    if (tiltRef.current) {
      tiltRef.current.style.transform = `rotateX(${g.rx.toFixed(2)}deg) rotateY(${g.ry.toFixed(2)}deg)`;
    }

    if (glareRef.current) {
      glareRef.current.style.background = `radial-gradient(circle at ${g.glareX.toFixed(
        1
      )}% ${g.glareY.toFixed(1)}%, rgba(255, 255, 255, 0.4) 0%, rgba(21, 94, 239, 0.15) 40%, transparent 70%)`;
    }

    const isSettled =
      !g.isHovered && Math.abs(g.rx) < 0.02 && Math.abs(g.ry) < 0.02;

    if (!isSettled) {
      g.rafId = requestAnimationFrame(updateTilt);
    } else {
      g.rx = 0;
      g.ry = 0;
      if (tiltRef.current) {
        tiltRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
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
    g.targetRy = normX * 10; // Max 10deg subtle tilt
    g.targetRx = -normY * 8;
    g.glareX = ((e.clientX - rect.left) / rect.width) * 100;
    g.glareY = ((e.clientY - rect.top) / rect.height) * 100;

    if (!g.rafId) {
      g.rafId = requestAnimationFrame(updateTilt);
    }
  };

  const handlePointerLeave = () => {
    const g = gyro.current;
    g.isHovered = false;
    g.targetRx = 0;
    g.targetRy = 0;
  };

  // Card Boundary Hover Handlers
  const handleCardMouseEnter = () => {
    setIsFlipped(true);
  };

  const handleCardMouseLeave = () => {
    setIsFlipped(false);
  };

  const handleCardClick = () => {
    setIsFlipped((prev) => !prev);
  };

  const triggerStateSimulation = (state: CardState) => {
    setCardState(state);
    if (state === 'paying') {
      setTimeout(() => setCardState('approved'), 1200);
      setTimeout(() => setCardState('ready'), 3400);
    }
  };

  return (
    <section
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full min-h-[88vh] pt-10 sm:pt-14 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#EFF6FF]"
    >
      {/* ── UNIQUE 3D HOLOGRAPHIC CARD LAB BACKGROUND ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Holographic Iridescent Perspective Grid */}
        <div
          className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[1800px] h-[900px] opacity-30"
          style={{
            transform: 'perspective(850px) rotateX(60deg) translateZ(-35px)',
            backgroundImage: `
              linear-gradient(to right, rgba(99, 102, 241, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(16, 185, 129, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
          }}
        />

        {/* Concentric Contactless NFC Radar Waves */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-blue-300/30 animate-ping pointer-events-none" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full border border-dashed border-indigo-300/25 pointer-events-none" />

        {/* Multi-tier Foil Glow Cones */}
        <div className="absolute top-10 left-1/4 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-tr from-indigo-500/18 via-purple-400/12 to-transparent blur-[130px] rounded-full" />
        <div className="absolute top-10 right-1/4 translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-bl from-teal-400/18 via-blue-500/12 to-transparent blur-[130px] rounded-full" />

        {/* Floating 3D Card Security Badges */}
        <div className="absolute top-32 left-[9%] px-3 py-1.5 rounded-lg bg-white/85 border border-indigo-200 backdrop-blur-md shadow-md text-[10px] font-mono text-indigo-700 font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '6s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>EMV_3DS_v2.3 // ZERO_FRAUD</span>
        </div>

        <div className="absolute top-44 right-[9%] px-3 py-1.5 rounded-lg bg-white/85 border border-teal-200 backdrop-blur-md shadow-md text-[10px] font-mono text-teal-800 font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '7s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>APPLE_PAY_TOKEN // ACTIVE</span>
        </div>

        {/* Floating Chip Wireframe accents */}
        <div className="absolute bottom-28 left-[14%] w-6 h-6 border-2 border-indigo-400/40 rounded-sm rotate-12 animate-pulse" />
        <div className="absolute bottom-36 right-[16%] w-7 h-7 border border-teal-400/50 rounded-sm -rotate-12 animate-spin" style={{ animationDuration: '20s' }} />
      </div>

      {/* ── Top Narrative Eyebrow ── */}
      <div className="relative z-10 max-w-4xl mx-auto space-y-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/90 text-xs font-bold font-mono text-[#155EEF] shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#155EEF] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#155EEF]" />
          </span>
          <span>ADYAPAN FINANCIAL ARCHITECTURE · PROGRAMMABLE CARD ISSUANCE</span>
        </div>

        {/* ── Massive Headline ── */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#071A33] leading-[1.08]">
          THE CARD IN{' '}
          <span className="bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-indigo-700 bg-clip-text text-transparent">
            MOTION.
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
          One intelligent card experience. Instant virtual provisioning, dynamic category-level spend controls, Apple Pay tokenization, and sub-400ms POS authorizations.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={handleCardClick}
            className="px-6 py-3.5 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-xl shadow-[#155EEF]/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            <span>{isFlipped ? 'Turn to Front View' : 'Turn to Back View (or Hover Card)'}</span>
          </button>
          <a
            href="#controls"
            className="px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#071A33] font-bold text-xs border border-slate-300 shadow-sm transition-all hover:scale-105"
          >
            Explore Card Rules & Limits →
          </a>
        </div>
      </div>

      {/* ── Central 3D Physical Card Canvas ── */}
      <div className="relative z-20 w-full max-w-lg h-[340px] sm:h-[380px] mt-10 flex items-center justify-center">
        {/* Ambient Card Shadow Layer */}
        <div className="absolute w-[360px] sm:w-[420px] h-[220px] sm:h-[260px] rounded-3xl bg-[#071A33]/20 blur-2xl translate-y-12 pointer-events-none" />

        {/* ── Outer Stationary Boundary Wrapper (Hover Boundary Target) ── */}
        <div
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
          onClick={handleCardClick}
          className="relative w-[340px] sm:w-[420px] h-[215px] sm:h-[265px] select-none cursor-pointer"
          style={{ perspective: '1200px' }}
          title="Move cursor onto card to turn to back · Move cursor outside to turn to front"
        >
          {/* ── Tilt & Glare Sub-Layer (Responds to mouse movement) ── */}
          <div
            ref={tiltRef}
            className="w-full h-full"
            style={{
              transformStyle: 'preserve-3d',
              willChange: 'transform',
            }}
          >
            {/* ── 3D Flipper Layer (RotateY 0deg -> 180deg) ── */}
            <div
              className="relative w-full h-full rounded-3xl shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Specular Glare Layer */}
              <div
                ref={glareRef}
                className="absolute inset-0 rounded-3xl pointer-events-none z-30 transition-opacity duration-150 mix-blend-overlay opacity-75"
              />

              {/* ════ FRONT CARD SURFACE ════ */}
              <div
                className="absolute inset-0 rounded-3xl p-6 sm:p-7 bg-gradient-to-tr from-[#071A33] via-[#0F294D] to-[#155EEF] text-white border border-blue-400/30 flex flex-col justify-between shadow-2xl overflow-hidden"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(0deg)',
                }}
              >
                {/* Top row: Brand & NFC Contactless */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-xs font-mono font-black tracking-widest text-blue-200">ADYAPAN PLATINUM</span>
                  </div>
                  <Wifi className="w-5 h-5 text-blue-300 -rotate-90" />
                </div>

                {/* Middle row: Metallic EMV Chip & State Aura */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-amber-300 via-amber-200 to-amber-500 border border-amber-600/60 flex items-center justify-center p-1 shadow-inner relative overflow-hidden">
                    <div className="w-full h-full border border-amber-800/40 rounded flex flex-col justify-between p-0.5">
                      <div className="h-[1px] bg-amber-800/30 w-full" />
                      <div className="h-[1px] bg-amber-800/30 w-full" />
                    </div>
                  </div>

                  {cardState === 'authenticating' && (
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-400/40 animate-pulse">
                      3DS 2.0 AUTHENTICATING...
                    </span>
                  )}
                  {cardState === 'approved' && (
                    <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/40 animate-bounce">
                      ✓ TRANSACTION APPROVED
                    </span>
                  )}
                </div>

                {/* Bottom row: Card Number, Expiry, Cardholder */}
                <div className="space-y-2 text-left">
                  <p className="font-mono text-base sm:text-lg tracking-[0.2em] font-bold text-slate-100">
                    {showSensitive ? '4532 8912 0419 9812' : '4532 •••• •••• 9812'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[8px] uppercase">Cardholder</span>
                      <span className="font-bold">ADYAPAN ENTERPRISE</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[8px] uppercase">Valid Thru</span>
                      <span className="font-bold">09/29</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black tracking-wider text-blue-200">RuPay / Visa</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ════ BACK CARD SURFACE ════ */}
              <div
                className="absolute inset-0 rounded-3xl p-6 sm:p-7 bg-gradient-to-tr from-[#0B1528] via-[#071A33] to-[#0A2540] text-white border border-slate-700 flex flex-col justify-between shadow-2xl overflow-hidden"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                {/* Magnetic Stripe */}
                <div className="-mx-7 -mt-2 h-11 bg-slate-950 border-y border-slate-800" />

                {/* Signature Strip & CVV */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 uppercase">
                    <span>Authorized Signature</span>
                    <span>Security Code (CVV)</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-100 rounded-lg p-2 text-[#071A33]">
                    <span className="font-serif italic text-xs tracking-wider opacity-60">Adyapan Verified</span>
                    <span className="font-mono font-bold text-xs bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                      {showSensitive ? '492' : '•••'}
                    </span>
                  </div>
                </div>

                {/* Regulatory & Hotline Text */}
                <div className="text-[8px] text-slate-400 text-left leading-tight font-mono space-y-1">
                  <p>Issued by Adyapan Partner Bank under license from RuPay / Visa Inc. Subject to cardholder terms.</p>
                  <div className="flex justify-between text-slate-300 pt-1">
                    <span>24/7 Hotline: 1800-ADYAPAN</span>
                    <span className="text-emerald-400 font-bold">PCI-DSS L1 Compliant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive Card State Trigger Chips ── */}
      <div className="relative z-20 mt-6 flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
        <span className="text-xs font-mono font-bold text-slate-400 mr-2">Simulate State:</span>
        <button
          onClick={() => triggerStateSimulation('ready')}
          className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer ${
            cardState === 'ready' ? 'bg-[#155EEF] text-white border-[#155EEF]' : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          Normal Float
        </button>
        <button
          onClick={() => triggerStateSimulation('authenticating')}
          className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer ${
            cardState === 'authenticating' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          3DS Auth
        </button>
        <button
          onClick={() => triggerStateSimulation('paying')}
          className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer ${
            cardState === 'paying' || cardState === 'approved' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          Tap-To-Pay (₹2,450)
        </button>
        <button
          onClick={() => setShowSensitive(!showSensitive)}
          className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 cursor-pointer transition-all"
        >
          {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showSensitive ? 'Hide PAN/CVV' : 'Reveal Demo PAN'}</span>
        </button>
      </div>
      <p className="text-[10px] font-mono text-slate-400 mt-2">
        * Move cursor onto card to turn to back view · Move cursor outside to return to front view.
      </p>
    </section>
  );
};
