'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Play,
  RotateCcw,
  ShieldCheck,
  Zap,
  Lock,
  Database,
  RefreshCw,
  Cpu,
  FileCheck,
} from 'lucide-react';

interface TxStage {
  id: number;
  name: string;
  sub: string;
  badge: string;
  node: string;
  description: string;
  stateDiff: {
    accountDebit: string;
    accountCredit: string;
    ledgerBalance: string;
    auditStatus: string;
    lockState: string;
  };
}

const TX_STAGES: TxStage[] = [
  {
    id: 1,
    name: '1. INITIATED',
    sub: 'API Ingest & Payload Validation',
    badge: 'Step 01 / 06',
    node: 'mTLS Edge Gateway',
    description:
      'Corporate disbursal API payload received with signed HMAC-SHA256 headers. Idempotency key locked to prevent double-drawdown.',
    stateDiff: {
      accountDebit: 'Pending Hold ₹18,750.00',
      accountCredit: 'Unallocated',
      ledgerBalance: '₹48,92,410.00 (Locked)',
      auditStatus: 'INGEST_REGISTERED',
      lockState: 'IDEMPOTENCY_ACQUIRED',
    },
  },
  {
    id: 2,
    name: '2. VALIDATED',
    sub: 'Balance & Anti-Overdraft Policy Check',
    badge: 'Step 02 / 06',
    node: 'Policy & DTI Rule Engine',
    description:
      'Real-time verification confirms corporate account has sufficient unencumbered reserve balance and satisfies regulatory limit bounds.',
    stateDiff: {
      accountDebit: 'Verified Solvency ₹18,750.00',
      accountCredit: 'Beneficiary Active',
      ledgerBalance: 'Available ₹48,73,660.00',
      auditStatus: 'POLICY_PASSED',
      lockState: 'ACID_BALANCE_RESERVED',
    },
  },
  {
    id: 3,
    name: '3. RECORDED',
    sub: 'Double-Entry Journal Commits',
    badge: 'Step 03 / 06',
    node: 'Double-Entry Postgres Ledger',
    description:
      'Atomic double-entry transaction created. Asset and liability accounts mutated simultaneously in exact NUMERIC(14,2) decimal precision.',
    stateDiff: {
      accountDebit: 'DEBIT: Corporate Reserve ₹18,750.00',
      accountCredit: 'CREDIT: Settlement Clearing ₹18,750.00',
      ledgerBalance: 'Journal Entry #8912 COMMITTED',
      auditStatus: 'SHA-256_HASH_LINKED',
      lockState: 'ATOMIC_COMMIT_OK',
    },
  },
  {
    id: 4,
    name: '4. ROUTED',
    sub: 'Payment Gateway Switch Routing',
    badge: 'Step 04 / 06',
    node: 'NPCI / IMPS Multi-Bank Switch',
    description:
      'Payment instruction dispatched to primary bank clearing switch. Automatic fallback routing active for sub-second switch turnaround.',
    stateDiff: {
      accountDebit: 'Settlement Escrow debited',
      accountCredit: 'Dispatched to NPCI Switch',
      ledgerBalance: 'In-Flight Routing',
      auditStatus: 'SWITCH_ACK_RECEIVED',
      lockState: 'SUB-SECOND_ROUTED',
    },
  },
  {
    id: 5,
    name: '5. SETTLED',
    sub: 'Beneficiary Bank Credit Confirmation',
    badge: 'Step 05 / 06',
    node: 'Core Clearing Rail',
    description:
      'Beneficiary bank node confirms instantaneous credit. Webhook confirmation callback dispatched to originating enterprise system.',
    stateDiff: {
      accountDebit: 'Settled Final ₹18,750.00',
      accountCredit: 'Credited to Beneficiary VPA/Account',
      ledgerBalance: 'Reconciled Zero Float',
      auditStatus: 'DELIVERED_SUCCESS',
      lockState: 'FINAL_COMMIT_LOCKED',
    },
  },
  {
    id: 6,
    name: '6. RECONCILED',
    sub: 'Day-End Audit Trail & WORM Storage',
    badge: 'Step 06 / 06',
    node: 'Immutable Compliance Vault',
    description:
      'Day-end trial balance matched. Event cryptographic hash committed to 7-year WORM compliance store for regulatory inspection.',
    stateDiff: {
      accountDebit: 'Trial Balance In-Sync',
      accountCredit: 'Reconciliation Match 100%',
      ledgerBalance: 'Trial Balance Invariant Verified',
      auditStatus: 'WORM_VAULT_SEALED',
      lockState: 'COMPLIANCE_ARCHIVED',
    },
  },
];

export const FollowTransactionEngine: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const stage = TX_STAGES[currentStep];

  const handleNext = () => {
    setCurrentStep((prev) => (prev < TX_STAGES.length - 1 ? prev + 1 : prev));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleReset = () => {
    setCurrentStep(0);
  };

  return (
    <section id="follow-tx" className="relative py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Zap className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>INTERACTIVE STEP-THROUGH JOURNEY</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
          Trace a Single Transaction Through the Core
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Experience what happens inside the Adyapan Core Banking Engine when a corporate disbursement of <span className="font-bold text-[#155EEF]">₹18,750.00</span> is executed.
        </p>
      </div>

      {/* Progress Step Bar */}
      <div className="grid grid-cols-6 gap-2 mb-8 max-w-4xl mx-auto">
        {TX_STAGES.map((s, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={`p-2.5 rounded-xl text-left border transition-all text-xs font-mono font-bold cursor-pointer ${
                isCurrent
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-lg shadow-[#155EEF]/20 scale-105'
                  : isDone
                  ? 'bg-blue-50 text-[#155EEF] border-blue-200'
                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="block text-[9px] uppercase tracking-wider opacity-80">Stage 0{idx + 1}</span>
              <span className="truncate block font-bold mt-0.5">{s.name.split('. ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Stage Viewer Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch max-w-5xl mx-auto">
        {/* Left Column: Stage Explanation & Action Controls */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col justify-between text-left shadow-sm space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200">
                {stage.badge}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                Node: {stage.node}
              </span>
            </div>

            <h3 className="text-2xl font-black text-[#071A33]">{stage.name}</h3>
            <p className="text-xs font-bold text-[#155EEF] font-mono">{stage.sub}</p>

            <p className="text-sm text-slate-600 leading-relaxed">{stage.description}</p>
          </div>

          {/* Interactive Navigation Controls */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={handleReset}
                className="p-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all"
                title="Reset Simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleNext}
              disabled={currentStep === TX_STAGES.length - 1}
              className="px-6 py-2.5 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-md shadow-[#155EEF]/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span>{currentStep === TX_STAGES.length - 1 ? 'Transaction Completed' : 'Next Step →'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Real-Time State Diff & Ledger Commits */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-[#071A33] text-white p-6 sm:p-8 flex flex-col justify-between text-left shadow-2xl font-mono text-xs space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-slate-300">CORE LEDGER STATE DIFF</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {stage.stateDiff.lockState}
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold">DEBIT JOURNAL ENTRY</p>
                <p className="text-emerald-400 font-bold mt-0.5 text-xs">{stage.stateDiff.accountDebit}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold">CREDIT JOURNAL ENTRY</p>
                <p className="text-blue-400 font-bold mt-0.5 text-xs">{stage.stateDiff.accountCredit}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold">LEDGER BALANCE SNAPSHOT</p>
                <p className="text-slate-200 font-bold mt-0.5 text-xs">{stage.stateDiff.ledgerBalance}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold">AUDIT TRAIL HASH STATUS</p>
                <p className="text-[#155EEF] font-bold mt-0.5 text-xs">{stage.stateDiff.auditStatus}</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span>Precision: NUMERIC(14,2) Exact</span>
            <span className="text-emerald-400 font-bold">Invariant Match Verified</span>
          </div>
        </div>
      </div>
    </section>
  );
};
