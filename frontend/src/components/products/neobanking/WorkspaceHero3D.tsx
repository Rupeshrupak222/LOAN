'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Building2,
  CreditCard,
  Zap,
  ShieldCheck,
  Users,
  Activity,
  CheckCircle2,
  Lock,
  Sparkles,
  Sliders,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RotateCw,
} from 'lucide-react';

type ModuleType = 'accounts' | 'cashflow' | 'payments' | 'insights';

export const WorkspaceHero3D: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>('cashflow');
  const [isAssembled, setIsAssembled] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

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

    if (workspaceRef.current) {
      workspaceRef.current.style.transform = `perspective(1400px) rotateX(${g.rx.toFixed(
        2
      )}deg) rotateY(${g.ry.toFixed(2)}deg)`;
    }

    const isSettled = !g.isHovered && Math.abs(g.rx) < 0.02 && Math.abs(g.ry) < 0.02;

    if (!isSettled) {
      g.rafId = requestAnimationFrame(updateParallax);
    } else {
      g.rx = 0;
      g.ry = 0;
      if (workspaceRef.current) {
        workspaceRef.current.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg)';
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
    g.targetRy = normX * 8; // Max 8deg horizontal tilt
    g.targetRx = -normY * 6; // Max 6deg vertical tilt

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

  // Self-assembling sequence on entrance
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
      className="relative w-full min-h-[92vh] pt-10 sm:pt-14 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#EFF6FF]"
    >
      {/* Background ambient lighting and grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[500px] bg-gradient-to-tr from-blue-400/20 via-indigo-500/15 to-teal-400/10 blur-[140px] rounded-full pointer-events-none" />

      {/* ── Top Narrative Eyebrow ── */}
      <div className="relative z-10 max-w-4xl mx-auto space-y-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/90 text-xs font-bold font-mono text-[#155EEF] shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#155EEF] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#155EEF]" />
          </span>
          <span>ADYAPAN FINANCIAL ARCHITECTURE · SME FINANCIAL COMMAND CENTER</span>
        </div>

        {/* ── Massive Headline ── */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#071A33] leading-[1.08]">
          YOUR FINANCIAL WORLD,{' '}
          <span className="bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-indigo-700 bg-clip-text text-transparent">
            ONE INTELLIGENT WORKSPACE.
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
          A unified, multi-entity digital operating command center for managing accounts, vendor disbursements, automated tax vaults, real-time cash flow, and team authorizations.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#cash-river"
            className="px-6 py-3.5 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-xl shadow-[#155EEF]/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>Explore Cash Flow River</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#controls"
            className="px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#071A33] font-bold text-xs border border-slate-300 shadow-sm transition-all hover:scale-105"
          >
            Configure Business Controls →
          </a>
        </div>
      </div>

      {/* ── Central 3D Spatial Financial Command Center Canvas ── */}
      <div className="relative z-20 w-full max-w-[1400px] mt-12 flex items-center justify-center">
        {/* Workspace Ambient Shadow */}
        <div className="absolute w-full h-[400px] rounded-3xl bg-[#071A33]/15 blur-3xl translate-y-12 pointer-events-none" />

        {/* ── 3D Floating Command Center Workspace ── */}
        <div
          ref={workspaceRef}
          className={`relative w-full rounded-3xl border border-slate-300/80 bg-white/95 backdrop-blur-xl p-6 sm:p-10 shadow-2xl transition-all duration-700 select-none ${
            isAssembled ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-6'
          }`}
          style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
        >
          {/* Top Command Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-200">
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#071A33] text-white flex items-center justify-center font-bold font-mono text-sm shadow-sm">
                A
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-[#071A33]">ADYAPAN COMMAND CENTER</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    LIVE SYSTEM READY
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400">Enterprise Tenant: TechSphere India Pvt Ltd</p>
              </div>
            </div>

            {/* Quick module focus tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 self-start sm:self-auto text-xs font-mono">
              <button
                onClick={() => setActiveModule('accounts')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeModule === 'accounts' ? 'bg-white text-[#155EEF] shadow-xs' : 'text-slate-500 hover:text-[#071A33]'
                }`}
              >
                Accounts
              </button>
              <button
                onClick={() => setActiveModule('cashflow')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeModule === 'cashflow' ? 'bg-white text-[#155EEF] shadow-xs' : 'text-slate-500 hover:text-[#071A33]'
                }`}
              >
                Cash Flow
              </button>
              <button
                onClick={() => setActiveModule('payments')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeModule === 'payments' ? 'bg-white text-[#155EEF] shadow-xs' : 'text-slate-500 hover:text-[#071A33]'
                }`}
              >
                Payments
              </button>
              <button
                onClick={() => setActiveModule('insights')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeModule === 'insights' ? 'bg-white text-[#155EEF] shadow-xs' : 'text-slate-500 hover:text-[#071A33]'
                }`}
              >
                Signals
              </button>
            </div>
          </div>

          {/* ── 4-Quadrant Spatial Workspace Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-left">
            {/* ── Q1: Multi-Entity Accounts Vault ── */}
            <div
              onClick={() => setActiveModule('accounts')}
              className={`md:col-span-6 p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 ${
                activeModule === 'accounts'
                  ? 'bg-gradient-to-tr from-[#071A33] via-[#0F294D] to-[#155EEF] text-white border-[#155EEF] shadow-xl ring-2 ring-[#155EEF]/30 scale-[1.02]'
                  : 'bg-slate-50/80 text-[#071A33] border-slate-200 hover:border-blue-300 hover:bg-white'
              }`}
              style={{ transform: activeModule === 'accounts' ? 'translateZ(25px)' : 'translateZ(0px)' }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Building2 className={`w-4 h-4 ${activeModule === 'accounts' ? 'text-blue-300' : 'text-[#155EEF]'}`} />
                  <span className="text-xs font-mono font-bold uppercase">Accounts Vault</span>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                    activeModule === 'accounts' ? 'bg-white/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  3 Vaults Active
                </span>
              </div>

              <div>
                <p className="text-[10px] uppercase font-mono opacity-75">Operating Balance</p>
                <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight mt-0.5">₹48,92,410.00</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/30 text-[11px] font-mono">
                <div>
                  <span className="opacity-75 block text-[9px]">Tax / GST Vault</span>
                  <span className="font-bold">₹12,40,000.00</span>
                </div>
                <div>
                  <span className="opacity-75 block text-[9px]">Disbursal Escrow</span>
                  <span className="font-bold">₹35,00,000.00</span>
                </div>
              </div>
            </div>

            {/* ── Q2: Real-Time Cash Flow Matrix ── */}
            <div
              onClick={() => setActiveModule('cashflow')}
              className={`md:col-span-6 p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 ${
                activeModule === 'cashflow'
                  ? 'bg-gradient-to-tr from-[#071A33] via-[#0F294D] to-[#155EEF] text-white border-[#155EEF] shadow-xl ring-2 ring-[#155EEF]/30 scale-[1.02]'
                  : 'bg-slate-50/80 text-[#071A33] border-slate-200 hover:border-blue-300 hover:bg-white'
              }`}
              style={{ transform: activeModule === 'cashflow' ? 'translateZ(25px)' : 'translateZ(0px)' }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity className={`w-4 h-4 ${activeModule === 'cashflow' ? 'text-blue-300' : 'text-[#155EEF]'}`} />
                  <span className="text-xs font-mono font-bold uppercase">Cash Flow Velocity</span>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                    activeModule === 'cashflow' ? 'bg-white/10 text-blue-200' : 'bg-blue-50 text-[#155EEF]'
                  }`}
                >
                  Net +₹29,300
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-black/10 border border-white/10">
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold font-mono">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Inflow Today</span>
                  </div>
                  <p className="text-lg font-black font-mono mt-1">+₹48,500.00</p>
                </div>
                <div className="p-3 rounded-xl bg-black/10 border border-white/10">
                  <div className="flex items-center gap-1 text-[10px] text-rose-400 font-bold font-mono">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Outflow Today</span>
                  </div>
                  <p className="text-lg font-black font-mono mt-1">-₹19,200.00</p>
                </div>
              </div>

              <div className="text-[10px] font-mono opacity-75">
                <span>Working Capital Runway: </span>
                <span className="font-bold">14.8 Months (Optimized)</span>
              </div>
            </div>

            {/* ── Q3: Omni-Channel Payments Switch ── */}
            <div
              onClick={() => setActiveModule('payments')}
              className={`md:col-span-6 p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 ${
                activeModule === 'payments'
                  ? 'bg-gradient-to-tr from-[#071A33] via-[#0F294D] to-[#155EEF] text-white border-[#155EEF] shadow-xl ring-2 ring-[#155EEF]/30 scale-[1.02]'
                  : 'bg-slate-50/80 text-[#071A33] border-slate-200 hover:border-blue-300 hover:bg-white'
              }`}
              style={{ transform: activeModule === 'payments' ? 'translateZ(25px)' : 'translateZ(0px)' }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${activeModule === 'payments' ? 'text-blue-300' : 'text-[#155EEF]'}`} />
                  <span className="text-xs font-mono font-bold uppercase">Payments Switch</span>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                    activeModule === 'payments' ? 'bg-white/10 text-amber-300' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  4 Approvals Pending
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between items-center p-2 rounded-lg bg-black/10">
                  <span className="text-[11px]">Vendor Payout #9412</span>
                  <span className="font-bold text-emerald-400">₹85,000 (IMPS)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-black/10">
                  <span className="text-[11px]">Payroll Batch Q3</span>
                  <span className="font-bold text-blue-300">₹14,50,000 (Scheduled)</span>
                </div>
              </div>

              <div className="text-[10px] font-mono opacity-75">
                <span>Direct Rail: </span>
                <span className="font-bold">NPCI UPI 2.0 / RTGS Active-Active</span>
              </div>
            </div>

            {/* ── Q4: Autonomous Financial Intelligence ── */}
            <div
              onClick={() => setActiveModule('insights')}
              className={`md:col-span-6 p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 ${
                activeModule === 'insights'
                  ? 'bg-gradient-to-tr from-[#071A33] via-[#0F294D] to-[#155EEF] text-white border-[#155EEF] shadow-xl ring-2 ring-[#155EEF]/30 scale-[1.02]'
                  : 'bg-slate-50/80 text-[#071A33] border-slate-200 hover:border-blue-300 hover:bg-white'
              }`}
              style={{ transform: activeModule === 'insights' ? 'translateZ(25px)' : 'translateZ(0px)' }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${activeModule === 'insights' ? 'text-blue-300' : 'text-[#155EEF]'}`} />
                  <span className="text-xs font-mono font-bold uppercase">Financial Signals</span>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                    activeModule === 'insights' ? 'bg-white/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  AI Assistant
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-black/10 border border-white/10">
                  <p className="text-[10px] text-emerald-400 font-bold">AUTOMATED TAX SWEEP</p>
                  <p className="text-[11px] opacity-90 mt-0.5">18% GST auto-allocated from invoice #819 to reserve vault.</p>
                </div>
              </div>

              <div className="text-[10px] font-mono opacity-75 flex justify-between">
                <span>Tally ERP Sync: Verified</span>
                <span className="text-emerald-300 font-bold">100% In-Sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-[10px] font-mono text-slate-400 mt-4">
        * Interactive financial command workspace simulation. Hover or click modules to focus.
      </p>
    </section>
  );
};
