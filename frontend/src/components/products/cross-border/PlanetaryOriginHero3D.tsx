'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Globe,
  ArrowRight,
  ShieldCheck,
  Compass,
  Activity,
  Layers,
  Sparkles,
  Zap,
  Building,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   PlanetaryOriginHero3D — "THE WORLD IS THE INTERFACE"
   ─────────────────────────────────────────────────────────────
   ▸ Stylized architectural 3D planetary environment.
   ▸ Latitude/Longitude grid, continental geometry, and glowing
     cross-border financial corridor (New York ➔ London).
   ▸ Structured 3D Transaction Capsule.
   ▸ Camera-like pointer response (smooth lerp inertia).
   ══════════════════════════════════════════════════════════════ */

export const PlanetaryOriginHero3D: React.FC = () => {
  const [isAssembled, setIsAssembled] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<HTMLDivElement>(null);

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

    if (globeRef.current) {
      globeRef.current.style.transform = `perspective(1400px) rotateX(${c.rx.toFixed(
        2
      )}deg) rotateY(${c.ry.toFixed(2)}deg)`;
    }

    const isSettled = !c.isHovered && Math.abs(c.rx) < 0.02 && Math.abs(c.ry) < 0.02;

    if (!isSettled) {
      c.rafId = requestAnimationFrame(updateCameraPhysics);
    } else {
      c.rx = 0;
      c.ry = 0;
      if (globeRef.current) {
        globeRef.current.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg)';
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

  // Entrance assembly sequence
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
      {/* Globe Coordinate Grid Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(#93C5FD_1px,transparent_1px)] [background-size:28px_28px] opacity-35 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-gradient-to-tr from-blue-300/20 via-sky-400/15 to-indigo-400/10 blur-[160px] rounded-full pointer-events-none" />

      {/* ── Top Architectural Eyebrow ── */}
      <div className="relative z-10 max-w-5xl mx-auto space-y-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold font-mono text-[#155EEF] shadow-xs">
          <Globe className="w-4 h-4 text-[#155EEF]" />
          <span>CROSS-BORDER WIRE · GLOBAL FINANCIAL INFRASTRUCTURE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-emerald-700 font-bold">SWIFT / FX Settlement</span>
        </div>

        {/* ── Main Headline ── */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#071A33] leading-[1.08]">
          MONEY DOESN’T STOP{' '}
          <span className="bg-gradient-to-r from-[#155EEF] via-blue-600 to-indigo-700 bg-clip-text text-transparent">
            AT THE BORDER.
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Move a cross-border payment through a connected planetary journey of ISO 20022 routing, automated foreign-exchange conversion, and sub-second treasury settlement.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#origin-capsule"
            className="px-7 py-3.5 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-xl shadow-[#155EEF]/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>Explore the Global Journey</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#currency-chamber"
            className="px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#071A33] font-bold text-xs border border-slate-300 shadow-sm transition-all hover:scale-105"
          >
            Inspect FX Chamber →
          </a>
        </div>

        <p className="text-[11px] font-mono text-slate-400 max-w-xl mx-auto">
          *Illustrative SWIFT/FX settlement journey. Multi-currency clearing subject to central bank correspondent networks.
        </p>
      </div>

      {/* ── Central 3D Planetary Corridor Showcase Arena ── */}
      <div className="relative z-20 w-full max-w-[1400px] mt-12 flex items-center justify-center">
        {/* Soft Shadow Base */}
        <div className="absolute w-full h-[400px] rounded-3xl bg-[#071A33]/12 blur-3xl translate-y-12 pointer-events-none" />

        {/* ── 3D Globe Model Container ── */}
        <div
          ref={globeRef}
          className={`relative w-full rounded-3xl border border-slate-300/90 bg-white/95 backdrop-blur-xl p-6 sm:p-10 shadow-2xl transition-all duration-700 select-none ${
            isAssembled ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-6'
          }`}
          style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
        >
          {/* Header Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-200">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#071A33] to-[#155EEF] text-white flex items-center justify-center font-bold shadow-sm">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-black text-[#071A33] uppercase">TRANSATLANTIC SETTLEMENT CORRIDOR</span>
                <p className="text-[10px] font-mono text-slate-400">Route: New York (USD) ➔ London (GBP) · Protocol: ISO 20022</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#155EEF] bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>CLEARING STATUS: DIRECT STP CORRIDOR</span>
            </div>
          </div>

          {/* ── 2-Column Grid: Left Globe Flight Arc + Right Transaction Capsule Telemetry ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Spatial Planetary Arc Deck */}
            <div className="lg:col-span-7 relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#071A33] via-[#0A2244] to-[#0F2F59] text-white shadow-xl overflow-hidden min-h-[380px] flex flex-col justify-between">
              {/* Latitude/Longitude Mesh */}
              <div className="absolute inset-0 bg-[radial-gradient(#1E40AF_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

              {/* Parabolic Flight Arc SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-blue-400/40 fill-none" strokeWidth="2.5" strokeDasharray="8 6">
                <path d="M 100 240 Q 320 60 540 240" className="animate-[pulse_3s_ease-in-out_infinite]" />
              </svg>

              {/* 2 Geographic Anchor Terminals */}
              <div className="relative z-10 flex items-center justify-between text-left">
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
                  <span className="text-[10px] font-mono font-bold text-blue-300 block">ORIGIN NODE</span>
                  <span className="text-sm font-bold text-white block">New York (NYC)</span>
                  <span className="text-[10px] font-mono text-emerald-300 block">USD 10,000</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 text-right">
                  <span className="text-[10px] font-mono font-bold text-blue-300 block">DESTINATION NODE</span>
                  <span className="text-sm font-bold text-white block">London (LHR)</span>
                  <span className="text-[10px] font-mono text-emerald-300 block">GBP 7,890*</span>
                </div>
              </div>

              {/* Center 3D Isometric Representation */}
              <div className="relative z-10 my-8 py-6 flex items-center justify-center gap-6 sm:gap-10">
                {/* US Federal Reserve Fedwire Node */}
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-900/80 border border-blue-400/40 flex items-center justify-center shadow-lg">
                    <Building className="w-6 h-6 text-blue-300" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 mt-2">US Fedwire</span>
                </div>

                <div className="h-0.5 w-12 sm:w-20 bg-gradient-to-r from-blue-400 to-emerald-400 relative">
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>

                {/* Main Central FX & SWIFT Router */}
                <div className="flex flex-col items-center scale-110">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#155EEF] to-indigo-500 border-2 border-white/60 flex flex-col items-center justify-center shadow-2xl shadow-blue-500/40 p-2">
                    <Globe className="w-9 h-9 text-white" />
                  </div>
                  <span className="text-xs font-black text-white font-mono mt-2">ADYAPAN WIRE</span>
                  <span className="text-[9px] font-mono text-emerald-300">Direct STP Routing</span>
                </div>

                <div className="h-0.5 w-12 sm:w-20 bg-gradient-to-r from-emerald-400 to-teal-400 relative">
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-teal-300 animate-ping" />
                </div>

                {/* UK CHAPS / Clearing House */}
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-teal-900/80 border border-teal-400/40 flex items-center justify-center shadow-lg">
                    <Building className="w-6 h-6 text-teal-300" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 mt-2">UK CHAPS</span>
                </div>
              </div>

              {/* Bottom Telemetry Ticker */}
              <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>TRANSMISSION:</span>
                </span>
                <span className="font-bold text-emerald-300">pacs.008.001.08 Credit Transfer Envelope</span>
              </div>
            </div>

            {/* Right: Active Transaction Capsule Telemetry Deck */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col justify-between text-left space-y-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-blue-600 uppercase px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
                    TRANSACTION CAPSULE
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Active Flight
                  </span>
                </div>

                <h3 className="text-2xl font-black text-[#071A33] tracking-tight">Structured Wire Payload</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  End-to-end atomic payload containing verified UETR tracking keys, multi-currency routing instructions, and sanctions pre-clearance tokens.
                </p>
              </div>

              {/* Structured Metrics Panel */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 font-mono">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Origination</span>
                  <span className="text-lg font-black text-[#071A33] mt-0.5 block">USD 10,000</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Estimated Payout</span>
                  <span className="text-lg font-black text-[#155EEF] mt-0.5 block">GBP 7,890*</span>
                </div>
              </div>

              {/* Action Link to Origin Capsule Scene */}
              <div className="pt-2">
                <a
                  href="#origin-capsule"
                  className="w-full py-3.5 rounded-2xl bg-[#071A33] hover:bg-[#0D2447] text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Inspect Capsule at Origin</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
