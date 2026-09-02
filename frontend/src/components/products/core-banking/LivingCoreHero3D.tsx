'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Zap,
  Shield,
  Layers,
  Database,
  Lock,
  ArrowRight,
  TrendingUp,
  Cpu,
  Activity,
  CheckCircle2,
  RefreshCw,
  Building2,
  CreditCard,
  Globe,
  Sparkles,
  Info,
} from 'lucide-react';

interface CoreNode {
  id: string;
  name: string;
  category: string;
  angle: number; // in degrees
  distance: number; // distance from center in px
  icon: React.ElementType;
  color: string;
  details: {
    title: string;
    description: string;
    points: string[];
    metric: string;
  };
}

const CORE_NODES: CoreNode[] = [
  {
    id: 'accounts',
    name: 'Accounts',
    category: 'Deposit & Balances',
    angle: 0,
    distance: 190,
    icon: Building2,
    color: '#155EEF',
    details: {
      title: 'Real-Time Account Lifecycle',
      description: 'Multi-tenant account provisioning with dynamic balance validation and zero-drift state tracking.',
      points: ['Customer & Corporate Balances', 'Multi-Currency Account Vaults', 'Automated Interest Accrual'],
      metric: 'Sub-5ms Balance Ingest',
    },
  },
  {
    id: 'ledger',
    name: 'Ledger Engine',
    category: 'Double-Entry Core',
    angle: 60,
    distance: 210,
    icon: Database,
    color: '#0284C7',
    details: {
      title: 'ACID Double-Entry Ledger',
      description: 'Strict double-entry journal operations with guaranteed balanced debit and credit entries.',
      points: ['NUMERIC(14,2) Exact Decimal Math', 'Zero Float Calculation Drift', 'Append-Only Mutation Log'],
      metric: '100% Invariant Match',
    },
  },
  {
    id: 'transactions',
    name: 'Transactions',
    category: 'Atomic Routing',
    angle: 120,
    distance: 195,
    icon: Zap,
    color: '#10B981',
    details: {
      title: 'High-Throughput Atomic Commits',
      description: 'Sub-10ms transactional commit latency with distributed idempotency locks.',
      points: ['Idempotency Request Locks', 'Real-Time DTI Policy Check', 'Rollback Safety on Failure'],
      metric: '< 8ms p99 Latency',
    },
  },
  {
    id: 'payments',
    name: 'Payments',
    category: 'Multi-Rail Gateway',
    angle: 180,
    distance: 200,
    icon: CreditCard,
    color: '#6366F1',
    details: {
      title: 'Omni-Channel Payment Orchestration',
      description: 'Direct switch integration for IMPS, NEFT, RTGS, and NPCI UPI clearing.',
      points: ['Multi-Bank Routing Failover', 'Instant T+0 Disbursal Rail', 'Real-Time Webhook Callbacks'],
      metric: '99.98% Gateway Uptime',
    },
  },
  {
    id: 'settlement',
    name: 'Settlement',
    category: 'Clearing & EOD',
    angle: 240,
    distance: 210,
    icon: RefreshCw,
    color: '#8B5CF6',
    details: {
      title: 'Automated Day-End Settlement',
      description: 'Continuous net settlement and automated day-end batch balancing with partner banks.',
      points: ['Multi-Party Gross Settlement', 'Automated Day-End EOD Batch', 'Dispute & Reversal Workflows'],
      metric: 'Zero Manual Reconciliation',
    },
  },
  {
    id: 'reporting',
    name: 'Reporting',
    category: 'Regulatory Audit',
    angle: 300,
    distance: 195,
    icon: Shield,
    color: '#0D9488',
    details: {
      title: 'Compliance & Auditability',
      description: 'SHA-256 cryptographically chained event ledgers formatted for RBI regulatory inspection.',
      points: ['Automated Trial Balance Sheets', '7-Year WORM Storage Log', 'Instant Regulatory Exports'],
      metric: 'Inspection Ready 24/7',
    },
  },
];

export const LivingCoreHero3D: React.FC = () => {
  const [activeNode, setActiveNode] = useState<CoreNode | null>(null);
  const [liveTxStep, setLiveTxStep] = useState(0); // 0 to 3: Account -> Ledger -> Payment -> Settlement
  const [rotationAngle, setRotationAngle] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const coreVisualRef = useRef<HTMLDivElement>(null);

  // 3D gyroscopic tilt state
  const gyro = useRef({
    rx: 0,
    ry: 0,
    tx: 0,
    ty: 0,
    targetRx: 0,
    targetRy: 0,
    isHovered: false,
    rafId: 0,
  });

  const updateGyro = useCallback(() => {
    const g = gyro.current;
    const factor = g.isHovered ? 0.08 : 0.05;
    g.rx += (g.targetRx - g.rx) * factor;
    g.ry += (g.targetRy - g.ry) * factor;

    if (coreVisualRef.current) {
      coreVisualRef.current.style.transform = `perspective(1200px) rotateX(${g.rx.toFixed(
        2
      )}deg) rotateY(${g.ry.toFixed(2)}deg)`;
    }

    if (g.isHovered || Math.abs(g.rx) > 0.02 || Math.abs(g.ry) > 0.02) {
      g.rafId = requestAnimationFrame(updateGyro);
    } else {
      g.rx = 0;
      g.ry = 0;
      if (coreVisualRef.current) {
        coreVisualRef.current.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
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
    g.targetRy = normX * 6; // Max 6 deg tilt
    g.targetRx = -normY * 5;

    if (!g.rafId) {
      g.rafId = requestAnimationFrame(updateGyro);
    }
  };

  const handlePointerLeave = () => {
    const g = gyro.current;
    g.isHovered = false;
    g.targetRx = 0;
    g.targetRy = 0;
  };

  // Continuous subtle orbital rotation & live simulated transaction particle pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationAngle((prev) => (prev + 0.3) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const txTimer = setInterval(() => {
      setLiveTxStep((prev) => (prev + 1) % 4);
    }, 2200);
    return () => clearInterval(txTimer);
  }, []);

  const txStages = ['ACCOUNT VALIDATED', 'LEDGER JOURNALED', 'PAYMENT ROUTED', 'SETTLEMENT COMMITTED'];
  const txAmounts = ['₹42,500.00', '₹18,200.00', '₹1,50,000.00', '₹8,750.00'];

  return (
    <section
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full min-h-[92vh] pt-28 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#EFF6FF]"
    >
      {/* Background ambient radial lighting and mesh grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-400/15 via-indigo-500/10 to-teal-400/10 blur-[130px] rounded-full pointer-events-none" />

      {/* ── Top Narrative Eyebrow ── */}
      <div className="relative z-10 max-w-4xl mx-auto space-y-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/90 text-xs font-bold font-mono text-[#155EEF] shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#155EEF] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#155EEF]" />
          </span>
          <span>ADYAPAN FINANCIAL ARCHITECTURE · CORE BANKING INFRASTRUCTURE</span>
        </div>

        {/* ── Massive Flagship Headline ── */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#071A33] leading-[1.08]">
          THE ENGINE BEHIND EVERY{' '}
          <span className="bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-indigo-700 bg-clip-text text-transparent">
            FINANCIAL MOVE.
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
          One intelligent, multi-tenant financial core for accounts, double-entry ledgers, transactions, and settlement — engineered to keep every balance synchronized in real-time.
        </p>

        {/* Quick Action Navigation Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#live-stream"
            className="px-6 py-3.5 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-xl shadow-[#155EEF]/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>Inspect Live Ledger Engine</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#follow-tx"
            className="px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#071A33] font-bold text-xs border border-slate-300 shadow-sm transition-all hover:scale-105"
          >
            Trace a Sample Transaction →
          </a>
        </div>
      </div>

      {/* ── Central Living 3D Financial Core Visualization ── */}
      <div
        ref={coreVisualRef}
        className="relative z-20 w-full max-w-5xl h-[540px] sm:h-[600px] mt-10 flex items-center justify-center transition-transform duration-200"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        {/* Orbital Distance Rings */}
        <div className="absolute w-[400px] h-[400px] rounded-full border border-blue-200/80 animate-pulse pointer-events-none" />
        <div className="absolute w-[500px] h-[500px] rounded-full border border-dashed border-indigo-200/60 pointer-events-none" />
        <div className="absolute w-[600px] h-[600px] rounded-full border border-slate-200/50 pointer-events-none hidden sm:block" />

        {/* ── Central Pulsing Engine Core (The Digital Heart) ── */}
        <div
          className="relative z-30 w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-tr from-[#071A33] via-[#0F294D] to-[#155EEF] p-1.5 shadow-[0_0_60px_rgba(21,94,239,0.35)] flex flex-col items-center justify-center text-white cursor-pointer transition-transform duration-300 hover:scale-105 group"
          style={{ transform: 'translateZ(30px)' }}
        >
          {/* Inner glowing pulse ring */}
          <div className="absolute inset-2 rounded-full border border-blue-400/30 animate-spin" style={{ animationDuration: '20s' }} />

          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-300 mb-2 shadow-inner border border-white/20 group-hover:bg-[#155EEF] group-hover:text-white transition-colors">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>

          <span className="text-[10px] font-mono tracking-widest text-blue-300 uppercase font-bold">ADYAPAN CORE</span>
          <span className="text-sm sm:text-base font-black tracking-tight text-white mt-0.5">ENGINE V3</span>

          <div className="mt-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[9px] font-mono font-bold text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>ACID SYNCHRONIZED</span>
          </div>
        </div>

        {/* ── Orbiting Satellite Nodes ── */}
        {CORE_NODES.map((node) => {
          const rad = (node.angle * Math.PI) / 180;
          // Responsive radius scaling
          const r = node.distance;
          const x = Math.cos(rad) * r;
          const y = Math.sin(rad) * r;
          const Icon = node.icon;
          const isSelected = activeNode?.id === node.id;

          return (
            <div
              key={node.id}
              onClick={() => setActiveNode(isSelected ? null : node)}
              onMouseEnter={() => setActiveNode(node)}
              className="absolute z-40 transition-all duration-300 cursor-pointer group/node"
              style={{
                transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 20px)`,
              }}
            >
              {/* Radial connecting laser line to center */}
              <svg
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-visible -z-10"
                style={{ width: `${r * 2}px`, height: `${r * 2}px` }}
              >
                <line
                  x1={r}
                  y1={r}
                  x2={r - x}
                  y2={r - y}
                  stroke={isSelected ? '#155EEF' : '#CBD5E1'}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeDasharray={isSelected ? 'none' : '4 4'}
                  opacity={isSelected ? 1 : 0.6}
                />
              </svg>

              {/* Node Card Button */}
              <div
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all duration-300 shadow-md ${
                  isSelected
                    ? 'bg-[#071A33] text-white border-[#155EEF] scale-110 shadow-xl shadow-[#155EEF]/20 ring-2 ring-[#155EEF]/30'
                    : 'bg-white/95 text-[#071A33] border-slate-200 hover:border-blue-400 hover:shadow-lg hover:scale-105'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: isSelected ? '#155EEF' : '#EAF4FF',
                    color: isSelected ? '#FFFFFF' : '#155EEF',
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold leading-tight">{node.name}</p>
                  <p className="text-[9px] font-mono text-slate-400">{node.category}</p>
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Active Node Floating Inspection Tooltip Panel ── */}
        {activeNode && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-[340px] sm:w-[420px] rounded-2xl bg-[#071A33]/98 text-white p-5 border border-blue-500/40 shadow-2xl backdrop-blur-2xl text-left animate-fade-up"
            style={{ transform: 'translate3d(-50%, 0, 50px)' }}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#155EEF] animate-pulse" />
                <span className="text-[10px] font-mono uppercase text-blue-300 font-bold">{activeNode.category}</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {activeNode.details.metric}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white mb-1">{activeNode.details.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">{activeNode.details.description}</p>

            <div className="space-y-1 pt-2 border-t border-slate-800">
              {activeNode.details.points.map((pt, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300">
                  <CheckCircle2 className="w-3 h-3 text-[#155EEF] shrink-0" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Live Simulated Transaction Ticker Strip ── */}
      <div className="relative z-20 mt-6 max-w-2xl mx-auto w-full p-3 rounded-2xl bg-white border border-slate-200/90 shadow-md flex items-center justify-between font-mono text-xs text-left">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-bold text-[#071A33]">SIMULATED TX #84721:</span>
          <span className="font-black text-[#155EEF]">{txAmounts[liveTxStep]}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[10px]">STAGE:</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#155EEF] border border-blue-200">
            {txStages[liveTxStep]}
          </span>
        </div>
      </div>
      <p className="text-[10px] font-mono text-slate-400 mt-2">
        * Simulated live activity for architecture demonstration purposes.
      </p>
    </section>
  );
};
