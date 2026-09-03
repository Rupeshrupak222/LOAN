'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Lock,
  Cpu,
  Layers,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   PaymentStreamFlow — "5-STAGE CONTINUOUS PAYMENT STREAM"
   ─────────────────────────────────────────────────────────────
   ▸ Stages:
     1. INITIATE (VPA Intent creation)
     2. AUTHORIZE (UPI PIN & 2FA Auth)
     3. PROCESS (Core Banking Ledger Match)
     4. CONFIRM (NPCI Switch Receipt)
     5. SETTLE (Instant RTGS/IMPS Disbursal)
   ▸ Flowing animated telemetry packet.
   ══════════════════════════════════════════════════════════════ */

interface StreamStage {
  id: string;
  stageNum: string;
  name: string;
  action: string;
  latencyBudget: string;
  protocol: string;
}

const STREAM_STAGES: StreamStage[] = [
  { id: 'initiate', stageNum: '01', name: 'Initiate Intent', action: 'Customer scans QR or approves intent request on device.', latencyBudget: '15ms', protocol: 'JSON-RPC over TLS 1.3' },
  { id: 'authorize', stageNum: '02', name: 'Cryptographic 2FA', action: 'Encrypted MPIN verified against Issuer Bank HSM module.', latencyBudget: '40ms', protocol: 'Hardware Security Module' },
  { id: 'process', stageNum: '03', name: 'Interbank Match', action: 'NPCI UPI switch synchronizes remitter debit and beneficiary credit.', latencyBudget: '28ms', protocol: 'ISO 20022 Financial Messaging' },
  { id: 'confirm', stageNum: '04', name: 'Switch Confirmation', action: 'Digital receipt generated with unique NPCI Reference Number (RRN).', latencyBudget: '12ms', protocol: 'Signed Receipt Envelope' },
  { id: 'settle', stageNum: '05', name: 'Immediate Settlement', action: 'Final funds credited to merchant account with 100% clearing finality.', latencyBudget: '10ms', protocol: 'Sub-second Finality (T+0)' },
];

export const PaymentStreamFlow: React.FC = () => {
  const [activeStageIdx, setActiveStageIdx] = useState<number>(2);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStageIdx((prev) => (prev + 1) % STREAM_STAGES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const current = STREAM_STAGES[activeStageIdx];

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Activity className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>REAL-TIME TRANSACTION PIPELINE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          The 5-Stage Payment Stream
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Trace how a single UPI transaction moves end-to-end through cryptographic authentication, interbank processing, and final clearing in under 120 milliseconds.
        </p>
      </div>

      {/* 5 Continuous Flow Stages */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10 max-w-[1400px] mx-auto text-left">
        {STREAM_STAGES.map((st, idx) => {
          const isSelected = activeStageIdx === idx;

          return (
            <button
              key={st.id}
              onClick={() => setActiveStageIdx(idx)}
              className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-lg shadow-[#155EEF]/20 scale-105'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono font-bold uppercase ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  Stage {st.stageNum}
                </span>
                <span className={`text-[9px] font-mono font-bold ${isSelected ? 'text-emerald-300' : 'text-[#155EEF]'}`}>
                  {st.latencyBudget}
                </span>
              </div>
              <h4 className="text-xs font-bold truncate">{st.name}</h4>
            </button>
          );
        })}
      </div>

      {/* Main Active Stage Display Panel */}
      <div className="rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">PIPELINE EXECUTION · STAGE {current.stageNum}</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">{current.name}</h3>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 self-start sm:self-auto">
            Latency Target: {current.latencyBudget}
          </span>
        </div>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
          {current.action}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs pt-2">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Security Standard</span>
            <span className="font-bold text-emerald-400">{current.protocol}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Execution Status</span>
            <span className="font-bold text-blue-300">Synchronous Zero-Buffer</span>
          </div>
        </div>
      </div>
    </section>
  );
};
