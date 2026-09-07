'use client';

import React from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Coins,
  TrendingUp,
  FileCheck,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import { LOAN_PURPOSES } from './BorrowerTypes';

interface Props {
  requestedAmount: number;
  onAmountChange: (amount: number) => void;
  purpose: string;
  onPurposeChange: (purpose: string) => void;
  onStartJourney: () => void;
  hasSavedDraft?: boolean;
  onContinueDraft?: () => void;
  borrowerName?: string;
}

const PRESET_AMOUNTS = [50000, 100000, 200000, 300000, 500000, 1000000];

export const BorrowerHomeHero: React.FC<Props> = ({
  requestedAmount,
  onAmountChange,
  purpose,
  onPurposeChange,
  onStartJourney,
  hasSavedDraft,
  onContinueDraft,
  borrowerName,
}) => {
  // Approximate standard personal loan rate for live preview
  const estimatedEmi = Math.round(
    (requestedAmount * (12.5 / 12 / 100) * Math.pow(1 + 12.5 / 12 / 100, 24)) /
      (Math.pow(1 + 12.5 / 12 / 100, 24) - 1)
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1528] via-[#0F1E38] to-[#152747] p-6 sm:p-10 text-white shadow-xl border border-blue-900/40">
        {/* Glow ambients */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/10 text-blue-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Instant Digital Lending Platform · 100% Paperless</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {borrowerName ? `Welcome, ${borrowerName}! How much do you need today?` : 'How much loan do you need today?'}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-normal leading-relaxed">
            Check your pre-approved eligibility, customize tenure, upload required documents, and receive direct
            bank disbursement in under 90 seconds.
          </p>

          {/* Loan Purpose Pills */}
          <div className="pt-2 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Select Loan Purpose:
            </p>
            <div className="flex flex-wrap gap-2">
              {LOAN_PURPOSES.map((p) => {
                const active = purpose === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onPurposeChange(p.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      active
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Interactive Loan Amount Customizer Box */}
        <div className="relative z-10 mt-8 rounded-2xl bg-white/10 backdrop-blur-md p-5 sm:p-6 border border-white/15 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Desired Loan Amount
              </span>
              <p className="text-3xl sm:text-4xl font-extrabold text-white mt-0.5 tracking-tight">
                {formatMoney(requestedAmount)}
              </p>
            </div>

            <div className="rounded-xl bg-white/10 px-4 py-2.5 border border-white/10 sm:text-right">
              <span className="text-[11px] font-mono text-slate-300 block">Est. Monthly EMI (24 Mos)</span>
              <span className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
                {formatMoney(estimatedEmi)}
                <span className="text-xs text-slate-300 font-normal"> /mo</span>
              </span>
            </div>
          </div>

          {/* Amount Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min={25000}
              max={1000000}
              step={5000}
              value={requestedAmount}
              onChange={(e) => onAmountChange(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>₹25,000 (Min)</span>
              <span>₹5,00,000</span>
              <span>₹10,00,000 (Max)</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Presets:</span>
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => onAmountChange(amt)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                  requestedAmount === amt
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-white/5 text-slate-300 hover:bg-white/15'
                }`}
              >
                ₹{(amt / 1000).toFixed(0)}k
              </button>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onStartJourney}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Check My Eligibility →</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            {hasSavedDraft && onContinueDraft && (
              <button
                type="button"
                onClick={onContinueDraft}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all cursor-pointer border border-white/20"
              >
                Continue Saved Application
              </button>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/10 pt-5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>RBI Compliant & Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Eligibility in 30 Seconds</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Zero Pre-Payment Charges</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Transparent Rates</span>
          </div>
        </div>
      </div>

      {/* Clear 5-Step Visual Roadmap */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-[#2B3566] dark:bg-[#0E1528] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Your Loan Application Roadmap
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Complete the steps in under 5 minutes to submit your loan file for underwriting
            </p>
          </div>
          <span className="hidden sm:inline text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900">
            5 Simple Steps
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {[
            { step: '01', title: 'Check Eligibility', desc: 'Instant calculation based on income & DTI' },
            { step: '02', title: 'Personal Details', desc: 'Verified name, PAN, and address proof' },
            { step: '03', title: 'Income & KYC', desc: 'Employment records & identity check' },
            { step: '04', title: 'Choose Loan & Bank', desc: 'Select scheme, tenure & disbursal account' },
            { step: '05', title: 'Submit & Track', desc: 'Immediate application ID & live review queue' },
          ].map((s, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200/70 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#060F1B]/40 relative group hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block mb-1">
                STEP {s.step}
              </span>
              <p className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                {s.title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
