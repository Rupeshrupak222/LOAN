'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  Sliders,
  Split,
  FileCheck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   ContinuousPurchaseJourney — "6-STAGE CHECKOUT JOURNEY"
   ─────────────────────────────────────────────────────────────
   ▸ 01 Shop (Merchant catalog browse)
   ▸ 02 Select (Pick Adyapan 3-Part Pay at checkout)
   ▸ 03 Split (Review 3 equal ₹0-interest installments)
   ▸ 04 Confirm (2FA mobile OTP mandate approval)
   ▸ 05 Pay (1/3 upfront capture & instant dispatch)
   ▸ 06 Complete (60-day final settlement)
   ══════════════════════════════════════════════════════════════ */

interface JourneyStep {
  num: string;
  name: string;
  subtitle: string;
  action: string;
  telemetry: string;
  icon: React.ElementType;
}

const STEPS: JourneyStep[] = [
  {
    num: '01',
    name: 'Shop at Partner Store',
    subtitle: 'Browse & Add to Cart',
    action: 'Select desired electronics, fashion, or travel tickets across 12,000+ participating merchant portals.',
    telemetry: 'Cart Value: ₹3,000 to ₹60,000',
    icon: ShoppingBag,
  },
  {
    num: '02',
    name: 'Choose Adyapan Split',
    subtitle: 'Select Payment Method',
    action: 'Select "Pay in 3 @ 0%" on the checkout gateway payment options deck.',
    telemetry: 'Instant Eligibility Engine (sub-second)',
    icon: Sliders,
  },
  {
    num: '03',
    name: 'Review 3-Part Plan',
    subtitle: 'Zero Hidden Fees Check',
    action: 'Inspect exact installment amounts and due dates (Today, Day 30, Day 60) with 0% APR guarantee.',
    telemetry: 'Transparent Breakdown: ₹0 Markup',
    icon: Split,
  },
  {
    num: '04',
    name: 'Instant e-Mandate 2FA',
    subtitle: 'Mobile Auth Confirmation',
    action: 'Confirm your phone number and approve the UPI AutoPay e-mandate via your preferred UPI app.',
    telemetry: 'NPCI Tokenized 256-Bit Security',
    icon: FileCheck,
  },
  {
    num: '05',
    name: 'First 1/3 Capture',
    subtitle: 'Instant Merchant Dispatch',
    action: 'Your first installment processes immediately. Merchant is notified and ships the order today.',
    telemetry: 'Order Dispatched · Tracking Active',
    icon: CreditCard,
  },
  {
    num: '06',
    name: '60-Day Settlement',
    subtitle: 'Purchase 100% Complete',
    action: 'Installments 2 and 3 debit automatically on Day 30 and Day 60. Clean closure recorded.',
    telemetry: 'Positive CIBIL Record Logged',
    icon: CheckCircle2,
  },
];

export const ContinuousPurchaseJourney: React.FC = () => {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const current = STEPS[activeStepIdx];
  const Icon = current.icon;

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>CHECKOUT TO COMPLETION</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          The Continuous Purchase Journey
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Trace how an ordinary ecommerce checkout transforms into a frictionless, 3-part split payment.
        </p>
      </div>

      {/* 6 Step Interactive Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 max-w-[1400px] mx-auto text-left">
        {STEPS.map((st, idx) => {
          const isSelected = activeStepIdx === idx;
          const StIcon = st.icon;

          return (
            <button
              key={st.num}
              onClick={() => setActiveStepIdx(idx)}
              className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-lg shadow-[#155EEF]/20 scale-105'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono font-bold uppercase ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  Step {st.num}
                </span>
                <StIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <h4 className="text-xs font-bold truncate">{st.name}</h4>
            </button>
          );
        })}
      </div>

      {/* Main Selected Step Display Arena */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#071A33] to-[#155EEF] text-white flex items-center justify-center font-bold">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">STEP {current.num} · {current.subtitle}</span>
              <h3 className="text-2xl font-black text-[#071A33]">{current.name}</h3>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200 self-start sm:self-auto">
            {current.telemetry}
          </span>
        </div>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          {current.action}
        </p>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pt-3 border-t border-slate-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Automated clearing · Real-time SMS and WhatsApp notifications.</span>
        </div>
      </div>
    </section>
  );
};
