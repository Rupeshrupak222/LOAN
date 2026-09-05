'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  Search,
  FileText,
  Bookmark,
  Layers,
  CheckCircle2,
  TrendingUp,
  Cpu,
  ChevronRight,
  Compass,
} from 'lucide-react';

export const ResourceDeskHero3D: React.FC = () => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ x: -y * 8, y: x * 10 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative pt-24 pb-20 sm:pt-32 sm:pb-28 overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9]/60 to-white"
    >
      {/* Background Architectural Grid & Caliper Blueprint Lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.045]"
        style={{
          backgroundImage:
            'radial-gradient(#155EEF 1.5px, transparent 1.5px), linear-gradient(to right, #0F172A 1px, transparent 1px), linear-gradient(to bottom, #0F172A 1px, transparent 1px)',
          backgroundSize: '40px 40px, 120px 120px, 120px 120px',
        }}
      />

      {/* Atmospheric Soft Gradient Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-indigo-400/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* ── LEFT COLUMN: Editorial Typography & CTAs ── */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-left">
            
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest text-[#155EEF] bg-blue-50 border border-blue-200/80 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#155EEF] animate-pulse" />
              <span>ADYAPAN RESOURCES // THE INTELLIGENCE HUB</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-black text-[#071A33] tracking-tight leading-[1.06] font-sans">
              IDEAS FOR THE{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#155EEF] via-[#2E90FA] to-[#004EEB]">
                FINANCIAL SYSTEMS
              </span>{' '}
              BEING BUILT NEXT.
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-xl font-normal">
              Explore insights, explainers and practical perspectives across lending, banking, payments, risk and financial technology.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#resource-stream"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-[#155EEF] hover:bg-[#004EEB] transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>Explore Insights</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                href="/products/core-banking-engine"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-xs hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Explore Products</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 max-w-md">
              <div>
                <div className="text-xl sm:text-2xl font-black text-[#071A33] font-mono">24+</div>
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Deep Research</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-[#155EEF] font-mono">6 Pillars</div>
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Fintech Disciplines</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">100%</div>
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Open Architecture</div>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN: 3D "RESOURCE DESK" Visual ── */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div
              className="relative w-full max-w-[540px] h-[480px] sm:h-[520px] transition-transform duration-300 ease-out"
              style={{
                perspective: '1400px',
                transformStyle: 'preserve-3d',
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              }}
            >
              {/* Desk Base Ambient Shadow */}
              <div className="absolute inset-x-8 bottom-4 h-24 bg-slate-900/10 rounded-full blur-2xl transform translate-z-[-80px]" />

              {/* SHEET 03 (Deepest Background Layer) */}
              <div
                className="absolute top-4 left-6 right-6 h-[420px] rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-md p-6 transform translate-z-[-40px] rotate-[-4deg] opacity-70 transition-transform duration-500"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-100 pb-3">
                  <span>REF: ARCH-KNOWLEDGE-BASE // VOL 03</span>
                  <span className="text-blue-500">ACID PARITY</span>
                </div>
                <div className="space-y-3 mt-4">
                  <div className="h-3 w-3/4 bg-slate-200/70 rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                  <div className="h-3 w-2/3 bg-slate-100 rounded" />
                </div>
              </div>

              {/* SHEET 02 (Middle Layer: Architectural Diagram Sheet) */}
              <div
                className="absolute top-8 left-4 right-8 h-[430px] rounded-2xl bg-white/90 backdrop-blur-md border border-blue-100 shadow-lg p-6 transform translate-z-[0px] rotate-[2.5deg] opacity-90 transition-transform duration-500"
              >
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#155EEF] border-b border-blue-50 pb-3">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>LEDGER STREAM // EVENT LOG</span>
                  </span>
                  <span className="text-slate-400">P. 18</span>
                </div>

                {/* Technical Linework Diagram */}
                <div className="my-6 p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-2">
                    <span>STATE: INGESTION</span>
                    <span>→</span>
                    <span className="text-emerald-600 font-bold">PARITY 100%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-mono">
                    <div className="p-2 rounded bg-white border border-slate-200 text-slate-700">TX.INIT</div>
                    <div className="p-2 rounded bg-blue-50 border border-blue-200 text-[#155EEF] font-bold">AUDIT</div>
                    <div className="p-2 rounded bg-white border border-slate-200 text-slate-700">JOURNAL</div>
                    <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">SETTLED</div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="h-2.5 w-5/6 bg-slate-200/80 rounded" />
                  <div className="h-2.5 w-4/6 bg-slate-100 rounded" />
                </div>
              </div>

              {/* SHEET 01 (Foremost Active Research Dossier) */}
              <div
                className="absolute top-12 left-2 right-2 h-[440px] rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-7 transform translate-z-[45px] hover:translate-z-[60px] transition-all duration-300 flex flex-col justify-between"
              >
                {/* Header with Reading Indicator and Bookmark */}
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-[#155EEF] border border-blue-200">
                        FEATURED DOSSIER
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">5 MIN READ</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-xs text-amber-500 font-mono">
                      <Bookmark className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span className="text-[11px] font-bold text-slate-700">SAVED</span>
                    </div>
                  </div>

                  {/* Dossier Content */}
                  <div className="mt-5 space-y-3 text-left">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      FINANCIAL ARCHITECTURE REPORT // 2026
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-[#071A33] tracking-tight leading-snug">
                      Autonomous Credit Decisioning &amp; Real-Time Cashflow Verification
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      How modern digital lenders bypass stale bureau snapshots by connecting directly to Account Aggregator and GST telemetry rails.
                    </p>
                  </div>

                  {/* Micro Data Annotations */}
                  <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500">Underwriting Invariant:</span>
                      <span className="font-bold text-[#155EEF]">&lt; 30s Turnaround</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#155EEF] h-1.5 rounded-full w-4/5 animate-pulse" />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Verification: AA + GST</span>
                      <span className="text-emerald-600 font-bold">100% Cryptographic</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Author Stamp */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#155EEF]/10 flex items-center justify-center text-[#155EEF] font-mono text-xs font-bold">
                      AD
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#071A33]">Adyapan Research Lab</div>
                      <div className="text-[10px] text-slate-400 font-mono">Credit Systems Group</div>
                    </div>
                  </div>

                  <a
                    href="#featured-insight"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#155EEF] hover:text-[#004EEB] group"
                  >
                    <span>Read Paper</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>

              </div>

              {/* Floating Spatial Badge 01: Multi-Tenant Core */}
              <div
                className="absolute -top-3 -right-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xl text-slate-700 text-xs font-mono font-bold flex items-center gap-2 transform translate-z-[75px] hover:translate-z-[90px] transition-transform pointer-events-none"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>LEDGER: SYNCED</span>
              </div>

              {/* Floating Spatial Badge 02: Verification Proof */}
              <div
                className="absolute -bottom-2 -left-2 px-3.5 py-1.5 rounded-xl bg-[#071A33] text-white text-xs font-mono font-bold flex items-center gap-2 shadow-2xl transform translate-z-[65px] hover:translate-z-[80px] transition-transform pointer-events-none"
              >
                <Sparkles className="w-3 h-3 text-[#155EEF]" />
                <span>OPEN_ARCHITECTURE // 2026</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
