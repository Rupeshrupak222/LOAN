'use client';

import React, { useState } from 'react';
import {
  Search,
  Sliders,
  FileCheck,
  ShieldCheck,
  Award,
  Key,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   CurvedMilestoneJourney — "6-STAGE ARCHITECTURAL PATHWAY"
   ─────────────────────────────────────────────────────────────
   ▸ 01 Explore (Property shortlist & valuation check)
   ▸ 02 Plan (Tenure & down payment structuring)
   ▸ 03 Apply (Instant paperless e-application)
   ▸ 04 Verify (Automated DigiLocker title & income check)
   ▸ 05 Review (Sanction letter & RERA agreement)
   ▸ 06 Move Forward (Registry disbursal & keys)
   ══════════════════════════════════════════════════════════════ */

interface Milestone {
  num: string;
  title: string;
  action: string;
  duration: string;
  icon: React.ElementType;
}

const MILESTONES: Milestone[] = [
  {
    num: '01',
    title: 'Explore & Discover',
    action: 'Select property, estimate market valuation, and verify legal RERA project status.',
    duration: 'Instant Online',
    icon: Search,
  },
  {
    num: '02',
    title: 'Plan Structure',
    action: 'Simulate tenure horizons (15-30 years) and choose optimal down payment ratios.',
    duration: 'Interactive 3D Tool',
    icon: Sliders,
  },
  {
    num: '03',
    title: 'Digital Application',
    action: 'Submit applicant profile, co-borrower details, and property survey documents.',
    duration: '10-Minute e-Form',
    icon: FileCheck,
  },
  {
    num: '04',
    title: 'Instant e-KYC & Title',
    action: 'Automated DigiLocker Aadhaar/PAN validation and technical legal title vetting.',
    duration: '24-48 Hours Automated',
    icon: ShieldCheck,
  },
  {
    num: '05',
    title: 'Formal Sanction Review',
    action: 'Receive digital Sanction Letter detailing interest rate, tenure, and repayment terms.',
    duration: 'Same-Day Issuance',
    icon: Award,
  },
  {
    num: '06',
    title: 'Disbursal & Key Handover',
    action: 'Electronic fund transfer directly to seller/builder at registry and keys handed over.',
    duration: 'Registry Day T+0',
    icon: Key,
  },
];

export const CurvedMilestoneJourney: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const current = MILESTONES[activeIdx];
  const Icon = current.icon;

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>MORTGAGE LIFECYCLE MILESTONES</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          A Clear Path from First Plan to Front Door
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Navigate the 6 transparent milestones of home financing with zero paperwork friction and full digital tracking.
        </p>
      </div>

      {/* 6 Curved Pathway Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10 max-w-[1400px] mx-auto text-left">
        {MILESTONES.map((ms, idx) => {
          const isSelected = activeIdx === idx;
          const MsIcon = ms.icon;

          return (
            <button
              key={ms.num}
              onClick={() => setActiveIdx(idx)}
              className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-lg shadow-[#155EEF]/20 scale-105'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono font-bold uppercase ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  Step {ms.num}
                </span>
                <MsIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <h4 className="text-xs font-bold leading-tight truncate">{ms.title}</h4>
            </button>
          );
        })}
      </div>

      {/* Active Milestone Display Panel */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#071A33] to-[#155EEF] text-white flex items-center justify-center font-bold">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">MILESTONE {current.num} OF 06</span>
              <h3 className="text-2xl font-black text-[#071A33]">{current.title}</h3>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200 self-start sm:self-auto">
            {current.duration}
          </span>
        </div>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          {current.action}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Real-time SMS & WhatsApp milestone alerts at every stage.</span>
          </div>
          <span className="text-slate-600 font-bold">100% Transparent Amortization Schedules</span>
        </div>
      </div>
    </section>
  );
};
