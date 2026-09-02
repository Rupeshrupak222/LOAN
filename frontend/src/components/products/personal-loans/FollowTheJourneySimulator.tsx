'use client';

import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Building2,
  CreditCard,
  DollarSign,
} from 'lucide-react';

interface Stage {
  id: number;
  name: string;
  badge: string;
  headline: string;
  description: string;
  simulatedData: string;
}

const STAGES: Stage[] = [
  {
    id: 1,
    name: '1. Application Ingest',
    badge: 'Stage 01 / 05',
    headline: 'Instant Identity Fetch via Digilocker Consent',
    description: 'Borrower inputs mobile number and provides instant consent. Basic KYC credentials verified digitally in seconds.',
    simulatedData: 'Identity: Aadhaar e-KYC VERIFIED',
  },
  {
    id: 2,
    name: '2. Penny Drop Verification',
    badge: 'Stage 02 / 05',
    headline: 'Sub-Second Bank Account Name Match',
    description: 'A ₹1 penny drop validates the beneficiary account name directly against NPCI switch records with zero human intervention.',
    simulatedData: 'Bank Match: 100% Account Holder Name Match',
  },
  {
    id: 3,
    name: '3. Credit Decision Core',
    badge: 'Stage 03 / 05',
    headline: 'Instant Underwriting & Risk Evaluation',
    description: 'Adyapan decisioning rules evaluate bureau tradelines and cash flow stability to approve tailored loan terms.',
    simulatedData: 'Offer Generated: ₹25,000 @ Optimal Rate',
  },
  {
    id: 4,
    name: '4. Digital e-Mandate',
    badge: 'Stage 04 / 05',
    headline: 'NPCI e-NACH Autopay Setup',
    description: 'Borrower authorizes seamless monthly repayments using debit card or NetBanking authentication.',
    simulatedData: 'e-Mandate: Autopay Mandate REGISTERED',
  },
  {
    id: 5,
    name: '5. Direct Disbursal',
    badge: 'Stage 05 / 05',
    headline: 'Sub-Second IMPS Disbursal to Bank Account',
    description: 'Capital released from lender escrow and deposited into borrower savings account with instant SMS confirmation.',
    simulatedData: 'Disbursal: ₹25,000 CREDITED (UTR: ADY984120)',
  },
];

export const FollowTheJourneySimulator: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const current = STAGES[activeStep];

  return (
    <section id="journey-sim" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Zap className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>FOLLOW THE MONEY</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Trace the Capital from Application to Bank Credit
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Experience a simulated loan disbursement of ₹25,000 through the 5-stage automated lending lifecycle.
        </p>
      </div>

      {/* Progress Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8 max-w-[1400px] mx-auto">
        {STAGES.map((st, idx) => {
          const isSelected = activeStep === idx;
          return (
            <button
              key={st.id}
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-2xl text-left border transition-all text-xs font-mono font-bold cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-lg shadow-[#155EEF]/20 scale-105'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="block text-[9px] uppercase opacity-75">Step 0{idx + 1}</span>
              <span className="truncate block mt-1 font-bold text-sm">{st.name.split('. ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Main Visual Arena */}
      <div className="rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {current.badge}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-2">{current.headline}</h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20">
            {current.simulatedData}
          </span>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{current.description}</p>

        {/* Navigation Buttons */}
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : prev))}
            disabled={activeStep === 0}
            className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            ← Previous Stage
          </button>

          <button
            onClick={() => setActiveStep((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev))}
            disabled={activeStep === STAGES.length - 1}
            className="px-6 py-2 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white text-xs font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next Lifecycle Stage →
          </button>
        </div>
      </div>
    </section>
  );
};
