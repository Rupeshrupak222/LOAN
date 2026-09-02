'use client';

import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Lock,
  Building2,
  Clock,
} from 'lucide-react';

interface Stage {
  id: number;
  name: string;
  badge: string;
  headline: string;
  description: string;
  telemetry: string;
}

const PAYMENT_STAGES: Stage[] = [
  {
    id: 1,
    name: '1. Ingest & Payee Verification',
    badge: 'Stage 01 / 05',
    headline: 'Instant Name Match via NPCI VPA / Penny Drop',
    description: 'Beneficiary account details and VPA handles are verified in sub-second roundtrip before scheduling execution.',
    telemetry: 'Penny Verification: VALIDATED',
  },
  {
    id: 2,
    name: '2. Multi-Sign Governance Check',
    badge: 'Stage 02 / 05',
    headline: 'Automated Dual-Authorization Policy Evaluation',
    description: 'Payments exceeding preset corporate thresholds automatically route to appointed finance leads for biometric sign-off.',
    telemetry: 'Threshold Rule: DUAL_SIGN_MATCH',
  },
  {
    id: 3,
    name: '3. Atomic Ledger Lock',
    badge: 'Stage 03 / 05',
    headline: 'PostgreSQL Double-Entry Debit Isolation',
    description: 'Operating current account debited with zero float risk while funds transition into settlement escrow.',
    telemetry: 'Idempotency Lock: COMMITTED',
  },
  {
    id: 4,
    name: '4. Multi-Bank Switch Routing',
    badge: 'Stage 04 / 05',
    headline: 'Active-Active IMPS / RTGS / UPI Gateway Fallover',
    description: 'Optimal clearing rail chosen dynamically based on payout amount, banking switch health, and SLA uptime.',
    telemetry: 'Switch Route: NPCI_DIRECT_SWITCH',
  },
  {
    id: 5,
    name: '5. Instant Webhook & Reconciliation',
    badge: 'Stage 05 / 05',
    headline: 'Real-Time ERP Ledger Sync with Tally / Zoho',
    description: 'Transaction UTR confirmed, webhook dispatched, and invoice marked paid across enterprise accounting systems.',
    telemetry: 'ERP Synchronization: 100% IN-SYNC',
  },
];

export const PaymentPathOrchestrator: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const current = PAYMENT_STAGES[activeStep];

  return (
    <section className="relative py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Zap className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>PAYMENT ORCHESTRATION PIPELINE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
          Every Payment Has a Deterministic Path
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Trace a single corporate disbursement from payee verification and dual authorization to switch clearing and automated ERP sync.
        </p>
      </div>

      {/* Progress Path Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8 max-w-5xl mx-auto">
        {PAYMENT_STAGES.map((st, idx) => {
          const isSelected = activeStep === idx;
          return (
            <button
              key={st.id}
              onClick={() => setActiveStep(idx)}
              className={`p-3 rounded-2xl text-left border transition-all text-xs font-mono font-bold cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-lg shadow-[#155EEF]/20 scale-105'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="block text-[9px] uppercase opacity-75">Step 0{idx + 1}</span>
              <span className="truncate block mt-1 font-bold">{st.name.split('. ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Stage Visual Card */}
      <div className="rounded-3xl border border-slate-800 bg-[#071A33] text-white p-6 sm:p-10 max-w-4xl mx-auto text-left shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {current.badge}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-2">{current.headline}</h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20">
            {current.telemetry}
          </span>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{current.description}</p>

        {/* Navigation controls */}
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : prev))}
            disabled={activeStep === 0}
            className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            ← Previous Step
          </button>

          <button
            onClick={() => setActiveStep((prev) => (prev < PAYMENT_STAGES.length - 1 ? prev + 1 : prev))}
            disabled={activeStep === PAYMENT_STAGES.length - 1}
            className="px-6 py-2 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white text-xs font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next Orchestration Step →
          </button>
        </div>
      </div>
    </section>
  );
};
