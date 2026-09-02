'use client';

import React, { useState } from 'react';
import {
  Layers,
  Activity,
  CheckCircle2,
  Zap,
  Building,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   NachPulseGrid — "NACH BATCH CLEARING PULSE GRID"
   ─────────────────────────────────────────────────────────────
   ▸ High-volume batch settlement for institutional loans:
     - 1. Scheduled (Mandate database queue)
     - 2. Instruction (NPCI NACH file generation)
     - 3. Processing (Interbank clearinghouse netting)
     - 4. Settlement (Core treasury ledger credit)
   ══════════════════════════════════════════════════════════════ */

interface BatchPhase {
  id: string;
  step: string;
  name: string;
  action: string;
  volumeMetric: string;
  clearingWindow: string;
}

const BATCH_PHASES: BatchPhase[] = [
  { id: 'scheduled', step: '01', name: 'Batch File Aggregation', action: 'Daily loan EMI dues aggregated into standardized NPCI NACH XML files.', volumeMetric: 'Up to 50,000 mandates / batch', clearingWindow: 'T-1 Nightly Run' },
  { id: 'instruction', step: '02', name: 'NPCI Switch Ingress', action: 'Batch instructions transmitted via encrypted direct link to NPCI NACH clearinghouse.', volumeMetric: 'ISO 20022 Direct STP', clearingWindow: 'Session 1 (08:00 AM)' },
  { id: 'processing', step: '03', name: 'Interbank Multilateral Netting', action: 'Clearinghouse computes net interbank obligations across 100+ sponsor banks.', volumeMetric: 'Automated Net Settlement', clearingWindow: 'Session 2 (11:30 AM)' },
  { id: 'settlement', step: '04', name: 'LMS Treasury Finality', action: 'Success and return response files ingested back into Adyapan LMS core ledger.', volumeMetric: '100% Reconciliation Precision', clearingWindow: 'Same-Day (T+0 Finality)' },
];

export const NachPulseGrid: React.FC = () => {
  const [activePhaseId, setActivePhaseId] = useState<string>('instruction');
  const current = BATCH_PHASES.find((p) => p.id === activePhaseId) || BATCH_PHASES[1];

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Layers className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>INSTITUTIONAL BATCH SETTLEMENT</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          NACH High-Volume Pulse Grid
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          For institutional loan portfolios and large-scale recurring disbursements, National Automated Clearing House (NACH) delivers high-throughput batch clearing.
        </p>
      </div>

      {/* 4 Batch Phases */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 max-w-[1400px] mx-auto text-left">
        {BATCH_PHASES.map((phase) => {
          const isSelected = activePhaseId === phase.id;

          return (
            <button
              key={phase.id}
              onClick={() => setActivePhaseId(phase.id)}
              className={`p-6 rounded-3xl border transition-all text-left group cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-xl shadow-blue-500/20 scale-102 ring-2 ring-[#155EEF]/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-mono font-bold uppercase ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  Phase {phase.step}
                </span>
                <Activity className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#155EEF]'}`} />
              </div>
              <h3 className="text-base font-bold">{phase.name}</h3>
              <p className={`text-xs mt-1 font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                {phase.clearingWindow}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Active Phase Arena */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">PHASE {current.step} · BATCH TELEMETRY</span>
            <h3 className="text-2xl sm:text-3xl font-black text-[#071A33]">{current.name}</h3>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200 self-start sm:self-auto">
            {current.clearingWindow}
          </span>
        </div>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          {current.action}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
            <span className="text-slate-400">Throughput Scale</span>
            <span className="font-bold text-[#071A33]">{current.volumeMetric}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
            <span className="text-slate-400">Reconciliation Speed</span>
            <span className="font-bold text-[#155EEF]">Automated LMS Match</span>
          </div>
        </div>
      </div>
    </section>
  );
};
