'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Compass,
  Home,
  Layers,
  ArrowRight,
  Maximize2,
  Sparkles,
  Zap,
  Activity,
  ShieldCheck,
  Building,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   ArchitecturalHero3D — "THE HOME TAKES SHAPE"
   ─────────────────────────────────────────────────────────────
   ▸ Architectural Blueprint Drawing & 3D Spatial Floor Plan.
   ▸ Visual components:
     - Architectural grid & dimension guides.
     - Self-constructing floor plan with Living, Dining, Master Suite, Kitchen.
     - Window light zones & illuminated perimeter walls.
     - Blue financial planning stream moving through the rooms.
   ▸ Camera-like pointer response (smooth lerp inertia).
   ▸ One-time sequential assembly on entrance.
   ══════════════════════════════════════════════════════════════ */

interface RoomMetric {
  id: string;
  name: string;
  dimension: string;
  area: string;
  zone: string;
}

const ROOM_SPECS: RoomMetric[] = [
  { id: 'living', name: 'Great Room & Balcony', dimension: '22′ × 16′', area: '352 sq ft', zone: 'Zone A · Social' },
  { id: 'master', name: 'Master Suite & Bath', dimension: '18′ × 14′', area: '252 sq ft', zone: 'Zone B · Private' },
  { id: 'kitchen', name: 'Chef’s Kitchen & Island', dimension: '14′ × 12′', area: '168 sq ft', zone: 'Zone C · Culinary' },
  { id: 'study', name: 'Architectural Studio', dimension: '12′ × 10′', area: '120 sq ft', zone: 'Zone D · Focus' },
];

export const ArchitecturalHero3D: React.FC = () => {
  const [activeRoom, setActiveRoom] = useState<string>('living');
  const [drawProgress, setDrawProgress] = useState<number>(0);
  const [isConstructed, setIsConstructed] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const blueprintRef = useRef<HTMLDivElement>(null);

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

    if (blueprintRef.current) {
      blueprintRef.current.style.transform = `perspective(1400px) rotateX(${c.rx.toFixed(
        2
      )}deg) rotateY(${c.ry.toFixed(2)}deg)`;
    }

    const isSettled = !c.isHovered && Math.abs(c.rx) < 0.02 && Math.abs(c.ry) < 0.02;

    if (!isSettled) {
      c.rafId = requestAnimationFrame(updateCameraPhysics);
    } else {
      c.rx = 0;
      c.ry = 0;
      if (blueprintRef.current) {
        blueprintRef.current.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg)';
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
    c.targetRy = normX * 6.5; // max 6.5deg horizontal
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

  // Sequential Blueprint Drawing on Entrance
  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame += 1;
      setDrawProgress(Math.min(frame * 10, 100));
      if (frame >= 10) {
        setIsConstructed(true);
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const currentRoom = ROOM_SPECS.find((r) => r.id === activeRoom) || ROOM_SPECS[0];

  return (
    <section
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full min-h-[92vh] pt-10 sm:pt-14 pb-16 px-4 sm:px-8 lg:px-12 flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#EFF6FF]"
    >
      {/* ── UNIQUE 3D ARCHITECTURAL BLUEPRINT MATRIX BACKGROUND ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Isometric Blueprint Grid */}
        <div
          className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[1850px] h-[920px] opacity-35"
          style={{
            transform: 'perspective(850px) rotateX(62deg) translateZ(-40px)',
            backgroundImage: `
              linear-gradient(to right, rgba(14, 165, 233, 0.28) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(59, 130, 246, 0.22) 1px, transparent 1px)
            `,
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
          }}
        />

        {/* Volumetric Blueprint Sky Glows */}
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[550px] bg-gradient-to-br from-sky-400/20 via-blue-500/12 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-10 right-1/3 translate-x-1/2 w-[650px] h-[550px] bg-gradient-to-bl from-indigo-400/18 via-teal-300/12 to-transparent blur-[130px] rounded-full" />

        {/* Floating 3D Cadastral Property Badges */}
        <div className="absolute top-32 left-[8%] px-3 py-1.5 rounded-lg bg-white/85 border border-sky-200 backdrop-blur-md shadow-md text-[10px] font-mono text-sky-800 font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '6s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>PROPERTY_EVALUATION // 80% LTV</span>
        </div>

        <div className="absolute top-44 right-[8%] px-3 py-1.5 rounded-lg bg-white/85 border border-blue-200 backdrop-blur-md shadow-md text-[10px] font-mono text-[#155EEF] font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '7s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>TENURE_MAX // 30-YEAR_AMORTIZATION</span>
        </div>

        {/* Floating Blueprint Dimension Wireframes */}
        <div className="absolute bottom-28 left-[13%] w-10 h-10 border border-sky-400/50 rotate-45 animate-pulse" />
        <div className="absolute bottom-36 right-[15%] w-8 h-8 border border-blue-400/40 -rotate-12 animate-spin" style={{ animationDuration: '22s' }} />
      </div>

      {/* ── Top Architectural Eyebrow ── */}
      <div className="relative z-10 max-w-5xl mx-auto space-y-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold font-mono text-[#155EEF] shadow-xs">
          <Compass className="w-4 h-4 text-[#155EEF]" />
          <span>HOME MORTGAGES · ARCHITECTURAL FINANCING SUITE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-emerald-700 font-bold">Rates from 8.5%*</span>
        </div>

        {/* ── Main Headline ── */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#071A33] leading-[1.08]">
          YOUR FUTURE HOME{' '}
          <span className="bg-gradient-to-r from-[#155EEF] via-blue-600 to-indigo-700 bg-clip-text text-transparent">
            STARTS AS A PLAN.
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Turn the home you imagine into a structured financing journey — with a mortgage designed around long-term affordability, transparent amortizations, and flexible 30-year tenures.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#financial-blueprint"
            className="px-7 py-3.5 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-xl shadow-[#155EEF]/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>Explore Your Home Plan</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#tenure-tower"
            className="px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#071A33] font-bold text-xs border border-slate-300 shadow-sm transition-all hover:scale-105"
          >
            Calculate Structured EMI →
          </a>
        </div>

        <p className="text-[11px] font-mono text-slate-400 max-w-xl mx-auto">
          *Illustrative rate: 8.5% p.a. Subject to credit assessment, property valuation, and loan sanction terms.
        </p>
      </div>

      {/* ── 3D Architectural Blueprint Spatial Arena ── */}
      <div className="relative z-20 w-full max-w-[1400px] mt-12 flex items-center justify-center">
        {/* Soft Platform Foundation Glow */}
        <div className="absolute w-full h-[420px] rounded-3xl bg-[#071A33]/12 blur-3xl translate-y-12 pointer-events-none" />

        {/* ── Blueprint Model Canvas ── */}
        <div
          ref={blueprintRef}
          className={`relative w-full rounded-3xl border border-slate-300/90 bg-white/95 backdrop-blur-xl p-6 sm:p-10 shadow-2xl transition-all duration-700 select-none ${
            isConstructed ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-6'
          }`}
          style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
        >
          {/* Top Blueprint Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-200">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#071A33] to-[#155EEF] text-white flex items-center justify-center font-bold shadow-sm">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-black text-[#071A33] uppercase">ARCHITECTURAL FLOOR PLAN & MORTGAGE MATRIX</span>
                <p className="text-[10px] font-mono text-slate-400">Scale: 1:50 · Blueprint Drawing Engine: Active</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#155EEF] bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>BLUEPRINT SYNTHESIS: {drawProgress}%</span>
            </div>
          </div>

          {/* ── 2-Column Grid: Left Self-Drawing Blueprint Matrix + Right Room Telemetry ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Spatial 3D Floor Plan Deck */}
            <div className="lg:col-span-7 relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#071A33] via-[#0A2244] to-[#0F2F59] text-white shadow-xl overflow-hidden min-h-[390px] flex flex-col justify-between">
              {/* Blueprint Grid Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E3A8A_1px,transparent_1px),linear-gradient(to_bottom,#1E3A8A_1px,transparent_1px)] bg-[size:24px_24px] opacity-25 pointer-events-none" />

              {/* Connecting Financial Pathway SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-blue-400/40 fill-none" strokeWidth="2.5" strokeDasharray="8 6">
                <path d="M 80 120 L 260 120 L 260 260 L 520 260" className="animate-[pulse_3s_ease-in-out_infinite]" />
              </svg>

              {/* 4 Interactive Room Modules on Blueprint */}
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                {ROOM_SPECS.map((room) => {
                  const isSelected = activeRoom === room.id;
                  return (
                    <button
                      key={room.id}
                      onClick={() => setActiveRoom(room.id)}
                      className={`p-3.5 rounded-2xl border transition-all text-left group relative ${
                        isSelected
                          ? 'bg-[#155EEF] border-blue-400 shadow-lg shadow-[#155EEF]/40 scale-105'
                          : 'bg-white/10 hover:bg-white/15 border-white/10 text-slate-300'
                      }`}
                    >
                      <span className="text-[9px] font-mono font-bold text-blue-200 block truncate">{room.zone}</span>
                      <span className="text-xs font-bold block text-white mt-1">{room.name}</span>
                      <span className="text-[10px] font-mono text-emerald-300 block mt-0.5">{room.dimension}</span>
                    </button>
                  );
                })}
              </div>

              {/* Center Spatial Architectural Visualization */}
              <div className="relative z-10 my-8 py-4 flex items-center justify-center gap-6 sm:gap-10">
                {/* Structural Foundation */}
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-900/80 border border-blue-400/40 flex items-center justify-center shadow-lg">
                    <Layers className="w-6 h-6 text-blue-300" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 mt-2">Foundation</span>
                </div>

                <div className="h-0.5 w-12 sm:w-20 bg-gradient-to-r from-blue-400 to-emerald-400 relative">
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>

                {/* Main Architectural Living Space */}
                <div className="flex flex-col items-center scale-110">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#155EEF] to-indigo-500 border-2 border-white/60 flex flex-col items-center justify-center shadow-2xl shadow-blue-500/40 p-2">
                    <Home className="w-9 h-9 text-white" />
                  </div>
                  <span className="text-xs font-black text-white font-mono mt-2">{currentRoom.name}</span>
                  <span className="text-[9px] font-mono text-emerald-300">{currentRoom.area}</span>
                </div>

                <div className="h-0.5 w-12 sm:w-20 bg-gradient-to-r from-emerald-400 to-teal-400 relative">
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-teal-300 animate-ping" />
                </div>

                {/* Long-Term Ownership */}
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-teal-900/80 border border-teal-400/40 flex items-center justify-center shadow-lg">
                    <Building className="w-6 h-6 text-teal-300" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 mt-2">30-Yr Asset</span>
                </div>
              </div>

              {/* Bottom Blueprint Telemetry Status */}
              <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>STRUCTURE:</span>
                </span>
                <span className="font-bold text-emerald-300">Reinforced RERA Compliant · Clean Clear Title</span>
              </div>
            </div>

            {/* Right Column: Room Dimensions & Financial Coupling */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col justify-between text-left space-y-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-blue-600 uppercase px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
                    ROOM BLUEPRINT
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Active Inspection
                  </span>
                </div>

                <h3 className="text-2xl font-black text-[#071A33] tracking-tight">{currentRoom.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Every square foot of your home plan correlates to a structured financing schedule designed for minimal monthly stress and maximum equity appreciation.
                </p>
              </div>

              {/* Dimensions Panel */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 font-mono">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Spatial Bounds</span>
                  <span className="text-lg font-black text-[#071A33] mt-0.5 block">{currentRoom.dimension}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Floor Coverage</span>
                  <span className="text-lg font-black text-[#155EEF] mt-0.5 block">{currentRoom.area}</span>
                </div>
              </div>

              {/* Action Link to Financial Blueprint */}
              <div className="pt-2">
                <a
                  href="#financial-blueprint"
                  className="w-full py-3.5 rounded-2xl bg-[#071A33] hover:bg-[#0D2447] text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Attach Financing to Blueprint</span>
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
