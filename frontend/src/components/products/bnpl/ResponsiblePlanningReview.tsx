'use client';

import React from 'react';
import {
  ShieldCheck,
  Calendar,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   ResponsiblePlanningReview — "KNOW THE PLAN BEFORE YOU CONFIRM"
   ─────────────────────────────────────────────────────────────
   ▸ Transparent Responsible Lending Breakdown:
     - Clear due dates
     - Zero hidden compound interest
     - On-time bureau reporting
   ══════════════════════════════════════════════════════════════ */

export const ResponsiblePlanningReview: React.FC = () => {
  return (
    <section id="responsible-review" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>RESPONSIBLE BNPL ARCHITECTURE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Know the Plan Before You Confirm
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Adyapan BNPL is engineered as a structured planning tool, never a debt trap. Every fee, date, and deduction is transparently presented upfront.
        </p>
      </div>

      {/* 3 Transparent Tenet Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1400px] mx-auto text-left">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#155EEF] flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#071A33]">Exact Fixed Due Dates</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Installments occur exactly on Day 30 and Day 60. Reminders are dispatched via SMS and WhatsApp 5 days in advance so you never encounter surprises.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#071A33]">Zero Compound Penalties</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            There is zero compounding interest. If an installment ever fails due to insufficient balance, we pause the account without escalating fees.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#071A33]">Credit Bureau Building</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            On-time repayments are reported to CIBIL and Experian, helping younger consumers and digital shoppers build positive formal credit histories.
          </p>
        </div>
      </div>
    </section>
  );
};
