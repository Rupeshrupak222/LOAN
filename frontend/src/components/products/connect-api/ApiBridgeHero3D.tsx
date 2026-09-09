'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Cpu,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Lock,
  Globe,
  Smartphone,
  Server,
  Building2,
  CheckCircle2,
  Sparkles,
  Sliders,
  RotateCw,
  FolderTree,
  FileCode,
  Activity,
} from 'lucide-react';

interface AppNode {
  id: string;
  name: string;
  type: string;
  icon: React.ElementType;
}

interface ServiceNode {
  id: string;
  name: string;
  category: string;
  icon: React.ElementType;
}

const APPS: AppNode[] = [
  { id: 'web', name: 'Web Portal', type: 'React / Next.js', icon: Globe },
  { id: 'mobile', name: 'Mobile App', type: 'iOS & Android SDK', icon: Smartphone },
  { id: 'partner', name: 'Partner API', type: 'B2B Client Gateway', icon: Server },
  { id: 'erp', name: 'Corporate ERP', type: 'Tally / SAP Webhook', icon: Building2 },
];

const SERVICES: ServiceNode[] = [
  { id: 'accounts', name: 'Core Accounts', category: 'Deposit Ledger', icon: Building2 },
  { id: 'payments', name: 'Payments Rail', category: 'UPI & IMPS Switch', icon: Zap },
  { id: 'lending', name: 'Lending Engine', category: 'Disbursal Engine', icon: Layers },
  { id: 'cards', name: 'Card Tokenizer', category: 'DPAN Management', icon: Lock },
];

export const ApiBridgeHero3D: React.FC = () => {
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [activePacketIndex, setActivePacketIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<HTMLDivElement>(null);

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

    if (bridgeRef.current) {
      bridgeRef.current.style.transform = `perspective(1400px) rotateX(${g.rx.toFixed(
        2
      )}deg) rotateY(${g.ry.toFixed(2)}deg)`;
    }

    const isSettled = !g.isHovered && Math.abs(g.rx) < 0.02 && Math.abs(g.ry) < 0.02;

    if (!isSettled) {
      g.rafId = requestAnimationFrame(updateParallax);
    } else {
      g.rx = 0;
      g.ry = 0;
      if (bridgeRef.current) {
        bridgeRef.current.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg)';
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

  // Simulated moving packet stream
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePacketIndex((prev) => (prev + 1) % 4);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full min-h-[92vh] pt-10 sm:pt-14 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#EFF6FF]"
    >
      {/* ── UNIQUE 3D CYBERNETIC FIBER-OPTIC MESH BACKGROUND ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Isometric Cybernetic Horizon Grid */}
        <div
          className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[1800px] h-[950px] opacity-35"
          style={{
            transform: 'perspective(850px) rotateX(62deg) translateZ(-30px)',
            backgroundImage: `
              linear-gradient(to right, rgba(2, 132, 199, 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(2, 132, 199, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 80%)',
          }}
        />

        {/* Ambient Pulsing Fiber Optic Cones */}
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[650px] h-[650px] bg-gradient-to-br from-cyan-500/15 via-blue-600/10 to-transparent blur-[130px] rounded-full animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute top-20 right-1/3 translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-500/15 via-teal-400/10 to-transparent blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '9s' }} />

        {/* Floating 3D Protocol Telemetry Chips */}
        <div className="absolute top-32 left-[8%] px-3 py-1.5 rounded-lg bg-white/85 border border-cyan-300/80 backdrop-blur-md shadow-md text-[10px] font-mono text-cyan-800 font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '5.5s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
          <span>gRPC_STREAM // 48,200 REQ/SEC</span>
        </div>

        <div className="absolute top-48 right-[10%] px-3 py-1.5 rounded-lg bg-white/85 border border-blue-300/80 backdrop-blur-md shadow-md text-[10px] font-mono text-[#155EEF] font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '7.5s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>mTLS_ENCRYPTION // FIPS_140_ACTIVE</span>
        </div>

        {/* Floating isometric data nodes */}
        <div className="absolute bottom-28 left-[12%] w-5 h-5 rounded border border-cyan-400/60 rotate-12 animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-36 right-[14%] w-7 h-7 rounded border border-indigo-400/50 rotate-45 animate-spin" style={{ animationDuration: '24s' }} />
      </div>

      {/* ── Top Narrative Eyebrow ── */}
      <div className="relative z-10 max-w-4xl mx-auto space-y-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/90 text-xs font-bold font-mono text-[#155EEF] shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#155EEF] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#155EEF]" />
          </span>
          <span>ADYAPAN FINANCIAL ARCHITECTURE · CONNECT API GATEWAY</span>
        </div>

        {/* ── Massive Headline ── */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#071A33] leading-[1.08]">
          CONNECT EVERYTHING.{' '}
          <span className="bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-indigo-700 bg-clip-text text-transparent">
            CONTROL THE FLOW.
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
          One unified, high-throughput integration layer connecting applications, partner ecosystems, and financial core services through resilient gRPC and REST interfaces.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsGatewayOpen(!isGatewayOpen)}
            className="px-6 py-3.5 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-xl shadow-[#155EEF]/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <FolderTree className="w-4 h-4" />
            <span>{isGatewayOpen ? 'Close Gateway Layer View' : 'Open the Gateway (Inspect Internal Layers)'}</span>
          </button>
          <a
            href="#journey"
            className="px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#071A33] font-bold text-xs border border-slate-300 shadow-sm transition-all hover:scale-105"
          >
            Trace a Request Journey →
          </a>
        </div>
      </div>

      {/* ── Central 3D API Bridge Canvas ── */}
      <div className="relative z-20 w-full max-w-[1400px] mt-12 flex items-center justify-center">
        {/* Ambient Bridge Shadow */}
        <div className="absolute w-full h-[380px] rounded-3xl bg-[#071A33]/15 blur-3xl translate-y-12 pointer-events-none" />

        {/* ── 3D Spatial Bridge ── */}
        <div
          ref={bridgeRef}
          className="relative w-full rounded-3xl border border-slate-300/80 bg-white/95 backdrop-blur-xl p-6 sm:p-10 shadow-2xl transition-transform duration-200 select-none"
          style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
        >
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-200">
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#071A33] text-white flex items-center justify-center font-bold font-mono text-sm">
                API
              </div>
              <div>
                <span className="text-sm font-black text-[#071A33]">CONNECT GATEWAY TOPOLOGY</span>
                <p className="text-[10px] font-mono text-slate-400">gRPC Protobuf & REST OpenAPI 3.0 Mesh</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>SUB-10MS MEDIAN INGRESS</span>
            </div>
          </div>

          {/* ── 3-Column Bridge Canvas (Ingress → Gateway → Egress) ── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Column: Applications Ingress */}
            <div className="md:col-span-3 space-y-2.5 text-left">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Client Ingress
              </span>
              {APPS.map((app, idx) => {
                const Icon = app.icon;
                const isActive = activePacketIndex === idx;
                return (
                  <div
                    key={app.id}
                    className={`p-3 rounded-2xl border transition-all text-xs font-mono flex items-center justify-between ${
                      isActive
                        ? 'bg-blue-50 border-[#155EEF] text-[#155EEF] shadow-md scale-105 ring-1 ring-[#155EEF]/30'
                        : 'bg-slate-50/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="font-bold">{app.name}</span>
                    </div>
                    <span className="text-[9px] text-slate-400">{app.type}</span>
                  </div>
                );
              })}
            </div>

            {/* Middle Column: Central 3D Gateway Node / Internal Stack */}
            <div className="md:col-span-6 flex flex-col items-center justify-center relative p-4">
              {!isGatewayOpen ? (
                /* Closed Gateway Capsule */
                <div
                  onClick={() => setIsGatewayOpen(true)}
                  className="w-full rounded-3xl bg-gradient-to-tr from-[#071A33] via-[#0F294D] to-[#155EEF] p-6 text-white text-center shadow-2xl cursor-pointer hover:scale-105 transition-all duration-300 border border-blue-400/40 relative group"
                  style={{ transform: 'translateZ(30px)' }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/10 mx-auto flex items-center justify-center text-blue-300 mb-3 border border-white/20 group-hover:bg-[#155EEF] group-hover:text-white transition-colors">
                    <Cpu className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-blue-200 font-bold uppercase">
                    CENTRAL INTEGRATION NODE
                  </span>
                  <h3 className="text-xl font-black mt-1">ADYAPAN API GATEWAY</h3>
                  <p className="text-xs text-slate-300 mt-2">Click to inspect 5 internal processing layers</p>

                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-mono text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>mTLS & TOKEN BUCKET ACTIVE</span>
                  </div>
                </div>
              ) : (
                /* Expanded 5-Layer Stack */
                <div className="w-full space-y-2 text-left font-mono text-xs animate-fade-in" style={{ transform: 'translateZ(40px)' }}>
                  <div className="flex justify-between items-center pb-1 mb-1 border-b border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Internal Gateway Layers</span>
                    <button
                      onClick={() => setIsGatewayOpen(false)}
                      className="text-[10px] text-[#155EEF] font-bold hover:underline cursor-pointer"
                    >
                      Collapse Stack ✕
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#071A33] text-white border border-blue-500/40 flex items-center justify-between">
                    <span className="text-blue-300 font-bold">L1 · mTLS & Signature Auth</span>
                    <span className="text-[9px] text-emerald-400">HMAC-SHA256 Valid</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#071A33] text-white border border-blue-500/40 flex items-center justify-between">
                    <span className="text-blue-300 font-bold">L2 · Schema Validation</span>
                    <span className="text-[9px] text-emerald-400">JSON Schema 2020-12</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#071A33] text-white border border-blue-500/40 flex items-center justify-between">
                    <span className="text-blue-300 font-bold">L3 · Idempotency & Rate Limit</span>
                    <span className="text-[9px] text-emerald-400">Redis Distributed Lock</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#071A33] text-white border border-blue-500/40 flex items-center justify-between">
                    <span className="text-blue-300 font-bold">L4 · Payload Transformation</span>
                    <span className="text-[9px] text-emerald-400">Protobuf Wire Protocol</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#071A33] text-white border border-blue-500/40 flex items-center justify-between">
                    <span className="text-blue-300 font-bold">L5 · Response & Telemetry</span>
                    <span className="text-[9px] text-emerald-400">200 OK (8ms Commit)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Financial Services Egress */}
            <div className="md:col-span-3 space-y-2.5 text-left">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Core Service Egress
              </span>
              {SERVICES.map((serv, idx) => {
                const Icon = serv.icon;
                const isActive = activePacketIndex === idx;
                return (
                  <div
                    key={serv.id}
                    className={`p-3 rounded-2xl border transition-all text-xs font-mono flex items-center justify-between ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-md scale-105 ring-1 ring-emerald-400/30'
                        : 'bg-slate-50/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-[#155EEF]" />
                      <span className="font-bold">{serv.name}</span>
                    </div>
                    <span className="text-[9px] text-slate-400">{serv.category}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Simulated Live API Call Ticker ── */}
      <div className="relative z-20 mt-6 max-w-2xl mx-auto w-full p-3 rounded-2xl bg-white border border-slate-200/90 shadow-md flex items-center justify-between font-mono text-xs text-left">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-bold text-[#071A33]">SIMULATED API CALL:</span>
          <span className="font-black text-[#155EEF]">POST /v1/payments/disburse</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[10px]">LATENCY:</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            8ms · 200 OK
          </span>
        </div>
      </div>
      <p className="text-[10px] font-mono text-slate-400 mt-2">
        * Simulated live API traffic demonstration for architectural visualization.
      </p>
    </section>
  );
};
