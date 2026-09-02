'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Lock,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface Stage {
  id: number;
  name: string;
  badge: string;
  headline: string;
  description: string;
  details: string[];
}

const LIFECYCLE_STAGES: Stage[] = [
  {
    id: 1,
    name: '1. Instant Provisioning',
    badge: 'Stage 01 / 06',
    headline: 'Sub-2s Virtual PAN & DPAN Token Generation',
    description: 'Instant programmatic creation of virtual card credentials and direct push provisioning to Apple Pay & Google Wallet.',
    details: ['Zero Physical Latency', 'Instant In-App Card Activation', 'Custom Brand Virtual Skin'],
  },
  {
    id: 2,
    name: '2. PIN & 2FA Setup',
    badge: 'Stage 02 / 06',
    headline: 'Secure PIN Setting & Biometric Authentication',
    description: 'Cardholder sets encrypted 4-digit PIN via secure HSM iframe with mandatory Aadhaar / PAN OTP validation.',
    details: ['HSM-Encrypted Pin Block (ISO 9564)', 'Biometric Device Fingerprinting', 'Aadhaar 2FA Authentication'],
  },
  {
    id: 3,
    name: '3. Active Multi-Rail Spending',
    badge: 'Stage 03 / 06',
    headline: 'Universal Contactless, POS, and E-Com Ingestion',
    description: 'Card operates continuously across merchant categories with real-time double-entry ledger settlement.',
    details: ['Sub-400ms Switch Auth', 'Real-Time Webhook Dispatches', 'Instant Balance Synchronization'],
  },
  {
    id: 4,
    name: '4. Dynamic Lock & Controls',
    badge: 'Stage 04 / 06',
    headline: '1-Tap Temporary Card Freezing from Mobile App',
    description: 'If a customer misplaces their card, they can instantly freeze all outbound transactions without canceling the card.',
    details: ['Instant Sub-200ms Network Freeze', 'No Replacement Fee Penalty', 'Subscriptions Kept Intact (Configurable)'],
  },
  {
    id: 5,
    name: '5. Instant Reactivation',
    badge: 'Stage 05 / 06',
    headline: '1-Tap Unlock with Biometric Verification',
    description: 'Cardholder safely unfreezes the card via FaceID or fingerprint authentication, restoring all payment channels.',
    details: ['Zero Bank Branch Visits', 'Biometric Authorization', 'Immediate Switch Sync'],
  },
  {
    id: 6,
    name: '6. Zero-Downtime Renewal',
    badge: 'Stage 06 / 06',
    headline: 'Automated Account Updater & Seamless Rollover',
    description: 'Prior to expiration, replacement credentials are auto-issued and subscription tokens updated seamlessly via Visa VAU / Mastercard ABU.',
    details: ['No Recurring Subscription Drops', 'Pre-Expiration Physical Shipping', 'Continuous DPAN Token Life'],
  },
];

export const CardLifecycleJourney: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const current = LIFECYCLE_STAGES[activeStep];

  return (
    <section className="relative py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <RotateCcw className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>END-TO-END CARD LIFECYCLE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
          From Instant Issuance to Automated Renewal
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Explore how Adyapan manages the complete card lifecycle through programmatic API webhooks and zero-friction mobile controls.
        </p>
      </div>

      {/* Progress Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-8 max-w-5xl mx-auto">
        {LIFECYCLE_STAGES.map((st, idx) => {
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
              <span className="block text-[9px] uppercase opacity-75">Stage 0{idx + 1}</span>
              <span className="truncate block mt-1 font-bold">{st.name.split('. ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Main Lifecycle Stage Card */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-6 sm:p-10 max-w-4xl mx-auto text-left shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200">
              {current.badge}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#071A33] mt-2">{current.headline}</h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-md">
            State: {current.name}
          </span>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">{current.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {current.details.map((dt, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-2 text-xs font-mono text-[#071A33]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{dt}</span>
            </div>
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : prev))}
            disabled={activeStep === 0}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous Stage
          </button>

          <button
            onClick={() => setActiveStep((prev) => (prev < LIFECYCLE_STAGES.length - 1 ? prev + 1 : prev))}
            disabled={activeStep === LIFECYCLE_STAGES.length - 1}
            className="px-6 py-2 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white text-xs font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next Lifecycle Stage →
          </button>
        </div>
      </div>
    </section>
  );
};
