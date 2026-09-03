'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Share2,
  Cpu,
  ArrowRight,
  Activity,
  Zap,
  Layers,
  ShieldCheck,
  Building,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   NetworkMapHero3D — "THE PAYMENT NETWORK IN MOTION"
   ─────────────────────────────────────────────────────────────
   ▸ Full-Width Living Digital Payment Network Map.
   ▸ Nodes:
     - Customer Terminal (Initiator)
     - Adyapan Core Routing Gateway
     - Remitter Bank Core
     - NPCI UPI Switch Switchboard
     - Beneficiary Settlement Clearing
   ▸ Moving structured transaction data packets.
   ▸ Localized pointer response (smooth lerp inertia).
   ══════════════════════════════════════════════════════════════ */

interface NetworkNode {
  id: string;
  name: string;
  role: string;
  latency: string;
  status: string;
  icon: React.ElementType;
}

const NETWORK_NODES: NetworkNode[] = [
  { id: 'customer', name: 'Customer Initiator', role: 'Payment Intent & 2FA', latency: '42ms', status: 'Active', icon: CreditCard },
  { id: 'gateway', name: 'Adyapan Switch Router', role: 'Sub-second Protocol Translation', latency: '12ms', status: 'Optimal', icon: Cpu },
  { id: 'remitter', name: 'Remitter Bank Core', role: 'Account Balance Hold', latency: '68ms', status: 'Verified', icon: Building },
  { id: 'npci', name: 'NPCI UPI Central Rail', role: 'Interbank Settlement Switch', latency: '85ms', status: 'Cleared', icon: Share2 },
];

export const NetworkMapHero3D: React.FC = () => {
  const [activeNodeId, setActiveNodeId] = useState<string>('gateway');
  const [isAssembled, setIsAssembled] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Smooth Camera Physics
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

    if (mapRef.current) {
      mapRef.current.style.transform = `perspective(1400px) rotateX(${c.rx.toFixed(
        2
      )}deg) rotateY(${c.ry.toFixed(2)}deg)`;
    }

    const isSettled = !c.isHovered && Math.abs(c.rx) < 0.02 && Math.abs(c.ry) < 0.02;

    if (!isSettled) {
      c.rafId = requestAnimationFrame(updateCameraPhysics);
    } else {
      c.rx = 0;
      c.ry = 0;
      if (mapRef.current) {
        mapRef.current.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg)';
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

  // Entrance assembly sequence
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAssembled(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const selectedNode = NETWORK_NODES.find((n) => n.id === activeNodeId) || NETWORK_NODES[1];

  return (
    <section
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full min-h-[92vh] pt-10 sm:pt-14 pb-16 px-4 sm:px-8 lg:px-12 flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#EFF6FF]"
    >
      {/* ── UNIQUE 3D INTERBANK SWITCHBOARD GRID BACKGROUND ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Isometric Interbank Switch Grid */}
        <div
          className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[1850px] h-[920px] opacity-35"
          style={{
            transform: 'perspective(850px) rotateX(62deg) translateZ(-40px)',
            backgroundImage: `
              linear-gradient(to right, rgba(2, 132, 199, 0.28) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(21, 94, 239, 0.22) 1px, transparent 1px)
            `,
            backgroundSize: '46px 46px',
            maskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
          }}
        />

        {/* Interbank Routing Flares */}
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[550px] bg-gradient-to-br from-cyan-500/18 via-blue-500/12 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-10 right-1/3 translate-x-1/2 w-[650px] h-[550px] bg-gradient-to-bl from-indigo-500/16 via-teal-300/12 to-transparent blur-[130px] rounded-full" />

        {/* Floating 3D Interbank Telemetry Badges */}
        <div className="absolute top-32 left-[8%] px-3 py-1.5 rounded-lg bg-white/85 border border-cyan-200 backdrop-blur-md shadow-md text-[10px] font-mono text-cyan-800 font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '6s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
          <span>NPCI_CENTRAL_SWITCH // SUB_10MS</span>
        </div>

        <div className="absolute top-44 right-[8%] px-3 py-1.5 rounded-lg bg-white/85 border border-blue-200 backdrop-blur-md shadow-md text-[10px] font-mono text-[#155EEF] font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '7s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>INTERBANK_CLEARING // 99.999%_UPTIME</span>
        </div>

        {/* Floating Switch Nodes */}
        <div className="absolute bottom-28 left-[14%] w-8 h-8 rounded-full border border-cyan-400/50 flex items-center justify-center text-[10px] font-mono text-cyan-700 animate-pulse">
          ⚡
        </div>
        <div className="absolute bottom-36 right-[15%] w-7 h-7 border border-blue-400/50 rotate-45 animate-spin" style={{ animationDuration: '18s' }} />
      </div>

      {/* ── Top Architectural Eyebrow ── */}
      <div className="relative z-10 max-w-5xl mx-auto space-y-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold font-mono text-[#155EEF] shadow-xs">
          <Share2 className="w-4 h-4 text-[#155EEF]" />
          <span>NPCI UPI NETWORK · LIVING PAYMENT INFRASTRUCTURE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-emerald-700 font-bold">Direct UPI Auto-Debit & NACH</span>
        </div>

        {/* ── Main Headline ── */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#071A33] leading-[1.08]">
          EVERY PAYMENT{' '}
          <span className="bg-gradient-to-r from-[#155EEF] via-blue-600 to-indigo-700 bg-clip-text text-transparent">
            HAS A PATH.
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Connect digital payments into an intelligent financial network that moves seamlessly from intent to authorization, interbank routing, and sub-second settlement.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#routing-arena"
            className="px-7 py-3.5 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-xl shadow-[#155EEF]/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>Explore the Payment Flow</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#auto-debit"
            className="px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#071A33] font-bold text-xs border border-slate-300 shadow-sm transition-all hover:scale-105"
          >
            See Auto-Debit Orbit →
          </a>
        </div>
      </div>

      {/* ── Central 3D Living Payment Map Arena ── */}
      <div className="relative z-20 w-full max-w-[1400px] mt-12 flex items-center justify-center">
        {/* Soft Shadow Base */}
        <div className="absolute w-full h-[400px] rounded-3xl bg-[#071A33]/12 blur-3xl translate-y-12 pointer-events-none" />

        {/* ── 3D Network Map Container ── */}
        <div
          ref={mapRef}
          className={`relative w-full rounded-3xl border border-slate-300/90 bg-white/95 backdrop-blur-xl p-6 sm:p-10 shadow-2xl transition-all duration-700 select-none ${
            isAssembled ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-6'
          }`}
          style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
        >
          {/* Header Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-200">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#071A33] to-[#155EEF] text-white flex items-center justify-center font-bold shadow-sm">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-black text-[#071A33] uppercase">NPCI UPI LIVE NETWORK MAP</span>
                <p className="text-[10px] font-mono text-slate-400">Interbank Mesh Topology · Sub-Second Packet Switching</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#155EEF] bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>NETWORK STATUS: 99.99% CLEARING UPTIME</span>
            </div>
          </div>

          {/* ── 2-Column Grid: Left Living Network Graph + Right Active Node Telemetry ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Spatial 3D Network Topology Deck */}
            <div className="lg:col-span-7 relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#071A33] via-[#0A2244] to-[#0F2F59] text-white shadow-xl overflow-hidden min-h-[380px] flex flex-col justify-between">
              {/* Network Grid Matrix */}
              <div className="absolute inset-0 bg-[radial-gradient(#1E40AF_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

              {/* Glowing Moving Payment Stream SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-blue-400/40 fill-none" strokeWidth="2.5" strokeDasharray="8 6">
                <path d="M 80 180 L 240 180 L 380 100 L 540 180" className="animate-[pulse_3s_ease-in-out_infinite]" />
                <path d="M 240 180 L 380 260 L 540 180" />
              </svg>

              {/* 4 Interactive Network Nodes */}
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                {NETWORK_NODES.map((node) => {
                  const isSelected = activeNodeId === node.id;
                  const NodeIcon = node.icon;

                  return (
                    <button
                      key={node.id}
                      onClick={() => setActiveNodeId(node.id)}
                      className={`p-3.5 rounded-2xl border transition-all text-left group relative ${
                        isSelected
                          ? 'bg-[#155EEF] border-blue-400 shadow-lg shadow-[#155EEF]/40 scale-105'
                          : 'bg-white/10 hover:bg-white/15 border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <NodeIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-300'}`} />
                        <span className={`text-[9px] font-mono font-bold ${isSelected ? 'text-blue-100' : 'text-emerald-400'}`}>
                          {node.latency}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold block truncate">{node.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5 truncate">{node.role}</span>
                    </button>
                  );
                })}
              </div>

              {/* Center 3D Isometric Representation */}
              <div className="relative z-10 my-8 py-6 flex items-center justify-center gap-6 sm:gap-10">
                {/* 1. Customer Terminal */}
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-900/80 border border-blue-400/40 flex items-center justify-center shadow-lg">
                    <CreditCard className="w-6 h-6 text-blue-300" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 mt-2">Payer Terminal</span>
                </div>

                <div className="h-0.5 w-12 sm:w-20 bg-gradient-to-r from-blue-400 to-emerald-400 relative">
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>

                {/* 2. Main Central Gateway Router */}
                <div className="flex flex-col items-center scale-110">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#155EEF] to-indigo-500 border-2 border-white/60 flex flex-col items-center justify-center shadow-2xl shadow-blue-500/40 p-2">
                    <Cpu className="w-9 h-9 text-white" />
                  </div>
                  <span className="text-xs font-black text-white font-mono mt-2">ADYAPAN ROUTER</span>
                  <span className="text-[9px] font-mono text-emerald-300">12ms Routing Engine</span>
                </div>

                <div className="h-0.5 w-12 sm:w-20 bg-gradient-to-r from-emerald-400 to-teal-400 relative">
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-teal-300 animate-ping" />
                </div>

                {/* 3. NPCI / Bank Switch */}
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-teal-900/80 border border-teal-400/40 flex items-center justify-center shadow-lg">
                    <Building className="w-6 h-6 text-teal-300" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 mt-2">NPCI Rail</span>
                </div>
              </div>

              {/* Bottom Telemetry Ticker */}
              <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>TRANSACTION PROTOCOL:</span>
                </span>
                <span className="font-bold text-emerald-300">NPCI Unified Payments Interface 2.0 (Direct)</span>
              </div>
            </div>

            {/* Right: Active Node Telemetry Deck */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col justify-between text-left space-y-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-blue-600 uppercase px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
                    NETWORK NODE INSPECTION
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {selectedNode.status}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-[#071A33] tracking-tight">{selectedNode.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  High-speed interbank payment packet validation ensuring real-time settlement without drops or transaction latency spikes.
                </p>
              </div>

              {/* Telemetry Metrics Panel */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 font-mono">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Node Latency</span>
                  <span className="text-lg font-black text-[#071A33] mt-0.5 block">{selectedNode.latency}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Operational Role</span>
                  <span className="text-xs font-bold text-[#155EEF] mt-1 block truncate">{selectedNode.role}</span>
                </div>
              </div>

              {/* Action Link to Routing Arena */}
              <div className="pt-2">
                <a
                  href="#routing-arena"
                  className="w-full py-3.5 rounded-2xl bg-[#071A33] hover:bg-[#0D2447] text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Explore Network Routing</span>
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
