'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  Layers,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   MechanicalSettlementLock — "SETTLEMENT LOCK"
   ─────────────────────────────────────────────────────────────
   ▸ Precision Mechanical Locking Sequence:
     - 1. ALIGN (Correspondent ledger accounts synchronize)
     - 2. VERIFY (Zero-spread rate & sanctions cleared)
     - 3. SETTLE (Irrevocable RTGS locking click)
   ══════════════════════════════════════════════════════════════ */

interface LockStage {
  id: string;
  step: string;
  name: string;
  action: string;
  status: string;
}

const LOCK_STAGES: LockStage[] = [
  { id: 'align', step: '01', name: 'Ledger Alignment', action: 'Central bank bilateral accounts align to exact debit/credit values.', status: 'Aligned' },
  { id: 'verify', step: '02', name: 'Sanctions & Rate Lock', action: 'Continuous AML screening and mid-market quote validation locked.', status: 'Verified' },
  { id: 'settle', step: '03', name: 'Atomic Settlement Click', action: 'Irrevocable clearinghouse finality achieved with zero counterparty risk.', status: 'Locked' },
];

export const MechanicalSettlementLock: React.FC = () => {
  const [activeStageIdx, setActiveStageIdx] = useState<number>(2);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStageIdx((p) => (p + 1) % LOCK_STAGES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const current = LOCK_STAGES[activeStageIdx];

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      <div className="rounded-3xl border border-slate-800 bg-[#071A33] text-white p-8 sm:p-14 max-w-[1400px] mx-auto text-left shadow-2xl relative overflow-hidden space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono text-blue-300 bg-blue-900/40 border border-blue-700 mb-2">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>MECHANICAL LOCKING CHAMBER</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">The Settlement Lock Mechanism</h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-800 self-start sm:self-auto">
            IRREVOCABLE RTGS CLEARANCE
          </span>
        </div>

        {/* 3 Step Lock Stages */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          {LOCK_STAGES.map((st, idx) => {
            const isSelected = activeStageIdx === idx;

            return (
              <div
                key={st.id}
                onClick={() => setActiveStageIdx(idx)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'bg-[#155EEF] text-white border-blue-400 shadow-xl scale-102 ring-2 ring-[#155EEF]/20'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                    Stage {st.step}
                  </span>
                  <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-emerald-300' : 'text-emerald-400'}`} />
                </div>
                <h4 className="text-sm font-bold text-white">{st.name}</h4>
                <p className={`text-[11px] leading-relaxed ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {st.action}
                </p>
              </div>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Once the mechanical lock triggers, settlement finality is instantaneous and immutable.</span>
          </div>
          <span className="text-blue-300 font-bold">100% Finality</span>
        </div>
      </div>
    </section>
  );
};
