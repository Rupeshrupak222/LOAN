'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  Layers,
  BarChart3,
  ShieldCheck,
  Store,
  Truck,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   BusinessGrowthHero3D — "THE BUSINESS GROWTH ENGINE"
   ─────────────────────────────────────────────────────────────
   ▸ Wide cinematic 3D spatial miniature business world.
   ▸ Visual components: Storefront, Warehouse, Inventory Boxes,
     Live Orders Stream, Cash Flow Rivers, Growth Indicator Poles.
   ▸ Pointer parallax & spatial depth shifts (lerp inertia).
   ▸ One-time sequential assembly animation on entrance.
   ▸ Zero ghosting / clean unmount.
   ══════════════════════════════════════════════════════════════ */

interface NodeMetric {
  id: string;
  name: string;
  value: string;
  change: string;
  status: string;
  icon: React.ElementType;
}

const NODES: NodeMetric[] = [
  { id: 'inventory', name: 'Inventory Stock', value: '₹4,85,000', change: '+28%', status: 'Optimal', icon: Package },
  { id: 'orders', name: 'Order Velocity', value: '142 orders/day', change: '+44%', status: 'Surging', icon: ShoppingCart },
  { id: 'revenue', name: 'Monthly Inflow', value: '₹18,50,000', change: '+35%', status: 'Healthy', icon: DollarSign },
  { id: 'expansion', name: 'Capital Available', value: '₹12,00,000', change: 'Instant Line', status: 'Active', icon: TrendingUp },
];

export const BusinessGrowthHero3D: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string>('orders');
  const [isAssembled, setIsAssembled] = useState<boolean>(false);
  const [pulseTick, setPulseTick] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const ecosystemRef = useRef<HTMLDivElement>(null);

  // Smooth Pointer Parallax Physics
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
    const factor = g.isHovered ? 0.08 : 0.04;

    g.rx += (g.targetRx - g.rx) * factor;
    g.ry += (g.targetRy - g.ry) * factor;

    if (ecosystemRef.current) {
      ecosystemRef.current.style.transform = `perspective(1400px) rotateX(${g.rx.toFixed(
        2
      )}deg) rotateY(${g.ry.toFixed(2)}deg)`;
    }

    const isSettled = !g.isHovered && Math.abs(g.rx) < 0.02 && Math.abs(g.ry) < 0.02;

    if (!isSettled) {
      g.rafId = requestAnimationFrame(updateParallax);
    } else {
      g.rx = 0;
      g.ry = 0;
      if (ecosystemRef.current) {
        ecosystemRef.current.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg)';
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
    g.targetRy = normX * 7.5; // max 7.5deg horizontal
    g.targetRx = -normY * 5.5; // max 5.5deg vertical

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

  // Entrance assembly sequence
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAssembled(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Periodic visual pulse on nodes
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseTick((p) => (p + 1) % 4);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const selectedData = NODES.find((n) => n.id === activeNode) || NODES[1];

  return (
    <section
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full min-h-[92vh] pt-10 sm:pt-14 pb-16 px-4 sm:px-8 lg:px-12 flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#EFF6FF]"
    >
      {/* ── UNIQUE 3D COMMERCIAL CAPITAL SKYLINE BACKGROUND ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Isometric Commercial Growth Grid */}
        <div
          className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[1850px] h-[920px] opacity-35"
          style={{
            transform: 'perspective(850px) rotateX(62deg) translateZ(-40px)',
            backgroundImage: `
              linear-gradient(to right, rgba(16, 185, 129, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(21, 94, 239, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
          }}
        />

        {/* Commercial Volumetric Glows */}
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[550px] bg-gradient-to-br from-emerald-500/18 via-teal-400/12 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-10 right-1/3 translate-x-1/2 w-[650px] h-[550px] bg-gradient-to-bl from-blue-600/18 via-indigo-500/12 to-transparent blur-[130px] rounded-full" />

        {/* Floating 3D Enterprise Growth Telemetry */}
        <div className="absolute top-32 left-[8%] px-3 py-1.5 rounded-lg bg-white/85 border border-emerald-200 backdrop-blur-md shadow-md text-[10px] font-mono text-emerald-800 font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '6s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>REVOLVING_LINE // UP_TO_₹5_CRORE</span>
        </div>

        <div className="absolute top-44 right-[8%] px-3 py-1.5 rounded-lg bg-white/85 border border-blue-200 backdrop-blur-md shadow-md text-[10px] font-mono text-[#155EEF] font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '7.5s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>GST_FLOW_DISCOUNTING // ACTIVE</span>
        </div>

        {/* Floating isometric growth pillar lines */}
        <div className="absolute bottom-28 left-[13%] w-7 h-12 border-t-2 border-l-2 border-emerald-400/50 -skew-x-12 opacity-60" />
        <div className="absolute bottom-36 right-[15%] w-8 h-14 border-t-2 border-r-2 border-blue-400/50 skew-x-12 opacity-60" />
      </div>

      {/* ── Top Narrative Eyebrow ── */}
      <div className="relative z-10 max-w-5xl mx-auto space-y-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold font-mono text-[#155EEF] shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#155EEF] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#155EEF]" />
          </span>
          <span>ADYAPAN FINANCIAL ARCHITECTURE · BUSINESS GROWTH ENGINE</span>
        </div>

        {/* ── Headline ── */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#071A33] leading-[1.08]">
          CAPITAL THAT MOVES WITH{' '}
          <span className="bg-gradient-to-r from-[#155EEF] via-blue-600 to-indigo-700 bg-clip-text text-transparent">
            YOUR BUSINESS.
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Flexible working capital and revolving credit lines designed to help growing enterprises bridge inventory cycles, fulfill bulk purchase surges, and unlock continuous momentum.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#supply-stream"
            className="px-7 py-3.5 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-xl shadow-[#155EEF]/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>Explore Growth Ecosystem</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#credit-control"
            className="px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#071A33] font-bold text-xs border border-slate-300 shadow-sm transition-all hover:scale-105"
          >
            Simulate Credit Line →
          </a>
        </div>
      </div>

      {/* ── Central 3D Spatial Business Growth Ecosystem Canvas ── */}
      <div className="relative z-20 w-full max-w-[1400px] mt-12 flex items-center justify-center">
        {/* Ambient Soft Platform Shadow */}
        <div className="absolute w-full h-[400px] rounded-3xl bg-[#071A33]/15 blur-3xl translate-y-12 pointer-events-none" />

        {/* ── 3D Miniature Business World Container ── */}
        <div
          ref={ecosystemRef}
          className={`relative w-full rounded-3xl border border-slate-300/80 bg-white/95 backdrop-blur-xl p-6 sm:p-10 shadow-2xl transition-all duration-700 select-none ${
            isAssembled ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-6'
          }`}
          style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
        >
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-200">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#071A33] to-[#155EEF] text-white flex items-center justify-center font-bold shadow-sm">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-black text-[#071A33]">SME REVOLVING BUSINESS GROWTH ECOSYSTEM</span>
                <p className="text-[10px] font-mono text-slate-400">Interactive Spatial Simulation (Illustrative Model)</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#155EEF] bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>STAGE: REVOLVING CAPITAL CYCLE · ACTIVE</span>
            </div>
          </div>

          {/* ── 3D Spatial Arena: Left Miniature Business Matrix + Right Telemetry Deck ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Spatial 3D Business Growth World */}
            <div className="lg:col-span-7 relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#071A33] via-[#0A2244] to-[#0F2F59] text-white shadow-xl overflow-hidden min-h-[380px] flex flex-col justify-between">
              {/* Background isometric grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#1E40AF_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

              {/* Spatial Connecting Flow Lines (SVG) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-blue-400/30 fill-none" strokeWidth="2" strokeDasharray="6 6">
                <path d="M 120 180 Q 240 100 360 180 T 600 180" className="animate-[pulse_3s_ease-in-out_infinite]" />
                <path d="M 240 100 L 240 280" />
                <path d="M 360 180 L 480 280" />
              </svg>

              {/* 4 Spatial Interactive Business Nodes */}
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                {NODES.map((node, idx) => {
                  const Icon = node.icon;
                  const isSelected = activeNode === node.id;
                  const isPulsing = pulseTick === idx;

                  return (
                    <button
                      key={node.id}
                      onClick={() => setActiveNode(node.id)}
                      className={`p-3.5 rounded-2xl border transition-all text-left group relative ${
                        isSelected
                          ? 'bg-[#155EEF] border-blue-400 shadow-lg shadow-[#155EEF]/40 scale-105'
                          : 'bg-white/10 hover:bg-white/15 border-white/10 text-slate-300'
                      }`}
                      style={{ transform: isSelected ? 'translateZ(20px)' : 'none' }}
                    >
                      {isPulsing && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-300'}`} />
                        <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-blue-100' : 'text-emerald-400'}`}>
                          {node.change}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold block truncate">{node.name}</span>
                      <span className="text-xs font-mono font-extrabold block text-white mt-0.5">{node.value}</span>
                    </button>
                  );
                })}
              </div>

              {/* Center 3D Isometric Representation of Enterprise Growth */}
              <div className="relative z-10 my-8 py-6 flex items-center justify-center gap-6 sm:gap-10">
                {/* 1. Supplier Node */}
                <div className="flex flex-col items-center group cursor-pointer" onClick={() => setActiveNode('inventory')}>
                  <div className="w-14 h-14 rounded-2xl bg-blue-900/80 border border-blue-400/40 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                    <Package className="w-6 h-6 text-blue-300" />
                  </div>
                  <span className="text-[10px] font-mono font-bold mt-2 text-slate-300">Raw Stock</span>
                </div>

                <div className="h-0.5 w-10 sm:w-16 bg-gradient-to-r from-blue-400 to-emerald-400 relative">
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>

                {/* 2. Main Central Business Hub */}
                <div className="flex flex-col items-center scale-110">
                  <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-[#155EEF] to-indigo-500 border-2 border-white/60 flex flex-col items-center justify-center shadow-2xl shadow-blue-500/40 p-2">
                    <Store className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-xs font-black mt-2 text-white font-mono">ADYAPAN CORE</span>
                  <span className="text-[9px] font-mono text-emerald-300">Active Capital Link</span>
                </div>

                <div className="h-0.5 w-10 sm:w-16 bg-gradient-to-r from-emerald-400 to-teal-400 relative">
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-teal-300 animate-ping" />
                </div>

                {/* 3. Customer Delivery & Expansion Node */}
                <div className="flex flex-col items-center group cursor-pointer" onClick={() => setActiveNode('expansion')}>
                  <div className="w-14 h-14 rounded-2xl bg-teal-900/80 border border-teal-400/40 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                    <Truck className="w-6 h-6 text-teal-300" />
                  </div>
                  <span className="text-[10px] font-mono font-bold mt-2 text-slate-300">Fulfillment</span>
                </div>
              </div>

              {/* Bottom Real-Time Capital River Ticker */}
              <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WORKING CAPITAL CYCLE:</span>
                </span>
                <span className="font-bold text-emerald-300">32-Day Cash Conversion (Continuous)</span>
              </div>
            </div>

            {/* Right Column: Active Node Telemetry & Growth Engine Inspection */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col justify-between text-left space-y-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-blue-600 uppercase px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
                    ECOSYSTEM METRIC
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {selectedData.status}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-[#071A33] tracking-tight">{selectedData.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Real-time operational liquidity allowing your enterprise to purchase bulk stock at discounted supplier rates without stalling cash flow.
                </p>
              </div>

              {/* Dimensional Metrics Panel */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 font-mono">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Simulated Volume</span>
                  <span className="text-lg font-black text-[#071A33] mt-0.5 block">{selectedData.value}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Growth Velocity</span>
                  <span className="text-lg font-black text-[#155EEF] mt-0.5 block">{selectedData.change}</span>
                </div>
              </div>

              {/* Action Link to Control Arena */}
              <div className="pt-2">
                <a
                  href="#growth-expander"
                  className="w-full py-3.5 rounded-2xl bg-[#071A33] hover:bg-[#0D2447] text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Simulate Growth Expansion</span>
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
