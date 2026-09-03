'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Activity,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   AutoDebitOrbit — "A PAYMENT THAT REMEMBERS THE PLAN"
   ────────────────────────────────════──────────────────────────
   ▸ Circular Calendar Orbit representing UPI AutoPay / e-Mandates:
     - Step 1: Pre-Debit SMS Notification (T-24h)
     - Step 2: Auto-Debit Execution (Day 0)
     - Step 3: Core Ledger Balance Clearance
     - Step 4: Recurring Mandate Cycle Renewal
   ▸ Labeled as "Illustrative conceptual flow"
   ══════════════════════════════════════════════════════════════ */

interface OrbitPoint {
  id: string;
  step: string;
  title: string;
  description: string;
  timing: string;
}

const ORBIT_POINTS: OrbitPoint[] = [
  { id: 'schedule', step: '01', title: 'Schedule & Mandate Registration', description: 'One-time customer authorization for recurring loan EMIs, subscriptions, or utility payments.', timing: 'Setup Phase' },
  { id: 'notify', step: '02', title: 'Pre-Debit Notification (T-24h)', description: 'Automated SMS/WhatsApp reminder sent 24 hours prior to debit, ensuring customer awareness.', timing: '24 Hours Prior' },
  { id: 'debit', step: '03', title: 'Sub-Second Auto-Debit', description: 'Direct interbank clearance without requiring manual OTP input on scheduled payment date.', timing: 'Due Date T+0' },
  { id: 'renew', step: '04', title: 'Mandate Status Synchronization', description: 'Real-time reconciliation with NPCI UPI AutoPay register and borrower credit profile.', timing: 'Immediate' },
];

export const AutoDebitOrbit: React.FC = () => {
  const [activeOrbitIdx, setActiveOrbitIdx] = useState<number>(2);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveOrbitIdx((p) => (p + 1) % ORBIT_POINTS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const current = ORBIT_POINTS[activeOrbitIdx];

  return (
    <section id="auto-debit" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Calendar className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>RECURRING AUTOPAY ORBIT</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          A Payment That Remembers the Plan
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Direct UPI Auto-Debit automates recurring installments seamlessly. Set up once, receive transparent 24h pre-debit notices, and maintain clean repayment records.
        </p>
      </div>

      {/* Main Orbit Arena */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">UPI AUTOPAY ENGINE</span>
            <h3 className="text-2xl font-black text-[#071A33] mt-1">{current.title}</h3>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200 self-start sm:self-auto">
            {current.timing}
          </span>
        </div>

        {/* 4 Orbit Step Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ORBIT_POINTS.map((pt, idx) => {
            const isSelected = activeOrbitIdx === idx;

            return (
              <div
                key={pt.id}
                onClick={() => setActiveOrbitIdx(idx)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-[#155EEF] text-white border-blue-400 shadow-xl scale-102 ring-2 ring-[#155EEF]/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold uppercase ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                    Orbit Point {pt.step}
                  </span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                </div>
                <h4 className="text-sm font-bold">{pt.title}</h4>
                <p className={`text-xs leading-relaxed ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                  {pt.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Borrowers can revoke or pause mandates directly from their UPI app anytime.</span>
          </div>
          <span className="text-[#155EEF] font-bold">100% NPCI e-Mandate Compliant</span>
        </div>
      </div>
    </section>
  );
};
