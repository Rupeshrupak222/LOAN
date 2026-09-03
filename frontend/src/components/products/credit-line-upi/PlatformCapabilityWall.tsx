'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Zap,
  ArrowDownLeft,
  Calculator,
  RefreshCw,
  ShieldCheck,
  Activity,
  FileCheck,
  Code2,
  GitBranch,
  BarChart3,
  Users,
  CheckCircle2,
} from 'lucide-react';

export const PlatformCapabilityWall: React.FC = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const CAPABILITIES = [
    { num: '01', title: 'Credit Line Management', tag: 'CORE CLM', icon: CreditCard, desc: 'Real-time available balance maintenance, multi-currency credit ledgers, and credit limit adjustment.' },
    { num: '02', title: 'UPI Payment Integration', tag: 'RAIL SWITCH', icon: Zap, desc: 'Native protocol translation between standard UPI 2.0 checkout flows and revolving credit drawdowns.' },
    { num: '03', title: 'Drawdown Management', tag: 'DISBURSAL', icon: ArrowDownLeft, desc: 'Instant micro-drawdown authorization at merchant point of sale without manual loan agreements.' },
    { num: '04', title: 'Billing & Interest Computation', tag: 'ENGINE', icon: Calculator, desc: 'Daily pro-rata interest calculation only on utilized funds; configurable billing cycle statements.' },
    { num: '05', title: 'Repayment Processing', tag: 'CLEARING', icon: RefreshCw, desc: 'Automated UPI e-mandates, partial repayments, and instant restoration of active line capacity.' },
    { num: '06', title: 'Risk & Fraud Controls', tag: 'SECURITY', icon: ShieldCheck, desc: 'Dynamic merchant category code limits, anomaly velocity tripwires, and device fingerprint validation.' },
    { num: '07', title: 'Transaction Monitoring', tag: 'TELEMETRY', icon: Activity, desc: 'Sub-second transaction tracing, live throughput telemetry, and merchant settlement status.' },
    { num: '08', title: 'Reconciliation', tag: 'SETTLEMENT', icon: FileCheck, desc: 'Three-way automated ledger matching between lending bank, payment switch, and merchant accounts.' },
    { num: '09', title: 'API Integration', tag: 'GATEWAYS', icon: Code2, desc: 'Institutional REST and gRPC interfaces for financial institutions and acquiring partner platforms.' },
    { num: '10', title: 'Lifecycle Management', tag: 'SERVICING', icon: GitBranch, desc: 'Full credit lifecycle management from limit enhancement to temporary suspension and renewal.' },
    { num: '11', title: 'Reporting & Analytics', tag: 'INSIGHTS', icon: BarChart3, desc: 'Portfolio drawdown analytics, NPA migration warnings, utilization metrics, and cohort reporting.' },
    { num: '12', title: 'Partner Enablement', tag: 'ECOSYSTEM', icon: Users, desc: 'Multi-tenant architecture allowing banks, fintechs, and acquiring merchants to co-brand the rail.' },
  ];

  return (
    <section
      id="section-capability-wall"
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-[#071A33] text-white overflow-hidden border-b border-slate-800 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[550px] bg-blue-500/10 rounded-full blur-[220px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <span>PLATFORM CAPABILITY MATRIX</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase leading-[1.04]"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            ENGINEERED TO RUN <br />
            <span className="bg-gradient-to-r from-cyan-400 via-[#155EEF] to-blue-400 bg-clip-text text-transparent">
              AT INSTITUTIONAL SCALE.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-normal leading-relaxed">
            A unified suite of 12 financial infrastructure capabilities purpose-built for revolving credit over UPI.
          </p>
        </div>

        {/* ── THE 12-CELL SPATIAL CAPABILITY WALL ── */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          style={{ perspective: '1200px' }}
        >
          {CAPABILITIES.map((cap, idx) => {
            const isHovered = hoveredIdx === idx;
            const Icon = cap.icon;

            return (
              <div
                key={cap.num}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[220px] relative overflow-hidden cursor-pointer ${
                  isHovered
                    ? 'bg-[#0E2442] border-cyan-400 shadow-xl shadow-blue-500/25 ring-2 ring-cyan-400/40 -translate-y-2'
                    : 'bg-[#0A1628]/80 border-slate-800 hover:border-slate-700'
                }`}
                style={{
                  transform: isHovered ? 'translateZ(24px)' : 'translateZ(0px)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Connecting Laser Beam Line when hovered */}
                {isHovered && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-[#155EEF] shadow-[0_0_12px_#22d3ee]" />
                )}

                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {cap.num}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
                      {cap.tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        isHovered ? 'bg-[#155EEF] text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-base font-bold text-white leading-snug">
                      {cap.title}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {cap.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
