'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  Lock,
  Building2,
  CheckCircle2,
  Sparkles,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { DirectionId, DIRECTIONS } from './directionData';

interface Props {
  activeDirection: DirectionId;
}

const ROUTING_STEPS = [
  {
    step: '01',
    title: 'Goal Vectoring',
    subtitle: 'Underwriting by intent',
    desc: 'Our engine evaluates your specific goal (e.g. inventory vs tuition vs medical) instead of relying solely on old rigid credit score models.',
    icon: Cpu,
    telemetry: 'Speed: 240ms',
  },
  {
    step: '02',
    title: 'Multi-NBFC Liquidity Routing',
    subtitle: 'Best rate matching',
    desc: 'Instantly matches with our RBI-registered institutional partner network (Meridian, Northbank, Finroot) to secure the lowest APR.',
    icon: Building2,
    telemetry: '6 Regulated Partners',
  },
  {
    step: '03',
    title: 'Consent-Based Data Sync',
    subtitle: 'Zero paper, 100% DigiLocker',
    desc: 'RBI Account Aggregator & DigiLocker fetch necessary bank statement records in 30 seconds with 256-bit AES encryption.',
    icon: Database,
    telemetry: '100% Encrypted',
  },
  {
    step: '04',
    title: 'Instant UPI Disbursal',
    subtitle: 'Funds in hand in 90 seconds',
    desc: 'Direct auto-credit to PhonePe, Google Pay, or your primary bank account with instant automated repayment mandate setup.',
    icon: Zap,
    telemetry: 'Avg 88.4s Disbursed',
  },
];

const NBFC_PARTNERS = [
  { name: 'Meridian NBFC', reg: 'RBI Reg: N-07.00842', specialty: 'Retail & Emergency Lines' },
  { name: 'Northbank Capital', reg: 'RBI Reg: B-14.02194', specialty: 'Education & Prime Borrowers' },
  { name: 'Finroot Credit', reg: 'RBI Reg: N-13.00651', specialty: 'SME & Merchant Growth' },
  { name: 'PayArc Ventures', reg: 'NPCI UPI Network Ally', specialty: 'Instant 24/7 UPI Mandates' },
];

export const AdyapanRoutingEngine: React.FC<Props> = ({ activeDirection }) => {
  const current = DIRECTIONS[activeDirection];
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="relative py-24 bg-[#f8fafc] text-slate-900 overflow-hidden">
      {/* Dynamic ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[160px] opacity-10 transition-all duration-700"
          style={{ backgroundColor: current.accentHex }}
        />
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Chapter 03 Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-mono text-indigo-700 uppercase tracking-widest mb-4 font-bold">
            <span>CHAPTER 03 : THE FINANCIAL ENGINE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
            You choose a direction.{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: `linear-gradient(135deg, ${current.accentHex} 0%, #4f46e5 100%)`,
              }}
            >
              Adyapan finds the optimal path.
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium">
            Behind every transaction is a real-time automated routing engine connecting your goal with RBI-regulated capital pools in seconds.
          </p>
        </div>

        {/* 4-Step Interactive Pipeline Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {ROUTING_STEPS.map((item, idx) => {
            const Icon = item.icon;
            const isCurrent = activeStep === idx;

            return (
              <div
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`relative cursor-pointer p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between shadow-sm ${
                  isCurrent
                    ? 'bg-white border-2 shadow-xl scale-[1.02]'
                    : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300'
                }`}
                style={{
                  borderColor: isCurrent ? current.accentHex : undefined,
                }}
              >
                {/* Step pill */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-xs font-mono font-bold px-2.5 py-1 rounded-full text-white"
                    style={{
                      backgroundColor: isCurrent ? current.accentHex : '#94a3b8',
                    }}
                  >
                    STEP {item.step}
                  </span>
                  <span className="text-xs font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {item.telemetry}
                  </span>
                </div>

                {/* Icon & Title */}
                <div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors"
                    style={{
                      backgroundColor: isCurrent ? current.accentHex : '#f1f5f9',
                      color: isCurrent ? '#ffffff' : '#475569',
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-indigo-600 font-bold mb-2">
                    {item.subtitle}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>

                {/* Bottom line indicator */}
                <div
                  className={`mt-4 pt-3 border-t border-slate-100 text-xs font-mono transition-colors font-bold ${
                    isCurrent ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                >
                  {isCurrent ? '● Active in Pipeline' : 'Click to inspect node'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Regulated Partner Network */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-card">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">
                  Institutional Capital & Compliance Network
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                Direct RBI NBFC Capital Integration
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All 6 Nodes Operational</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {NBFC_PARTNERS.map((partner, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors"
              >
                <div className="font-bold text-slate-900 text-sm">{partner.name}</div>
                <div className="text-[11px] font-mono text-indigo-600 font-bold mt-0.5">
                  {partner.reg}
                </div>
                <div className="text-xs text-slate-600 mt-2 font-medium">
                  {partner.specialty}
                </div>
              </div>
            ))}
          </div>

          {/* Compliance & Zero Hidden Fees Manifesto */}
          <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-700 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Key Fact Statement (KFS) provided before loan execution</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>₹0 Prepayment / Foreclosure penalty on standard products</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>No spam calls, no unsolicited data broker sharing</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
