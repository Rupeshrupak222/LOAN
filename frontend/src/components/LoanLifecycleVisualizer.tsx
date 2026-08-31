'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  Zap,
  Banknote,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  CreditCard,
  FileCheck2,
  Sparkles,
  Smartphone,
  ScanFace,
  Wifi,
  Battery,
  Award,
  CircleDot,
} from 'lucide-react';
import { TiltCard } from './TiltCard';

const STEPS = [
  {
    id: 1,
    icon: UserCheck,
    title: '90s Paperless KYC',
    subtitle: 'Aadhaar + Selfie. Done.',
    description:
      'No physical paperwork or branch visits. Instant Aadhaar OTP verification, PAN validation, and biometric liveness check in 90 seconds.',
    metrics: [
      { label: 'KYC Speed', value: '90 Seconds' },
      { label: 'Approval Rate', value: '99.2%' },
      { label: 'Verification', value: '100% Digital' },
    ],
    screenType: 'kyc',
    applicant: 'Rohan Sharma',
  },
  {
    id: 2,
    icon: Sparkles,
    title: 'Instant Credit Sanction',
    subtitle: 'Real-time AI limit decisioning',
    description:
      'Our credit engine evaluates your profile instantly and sanctions credit limits up to ₹15,00,000 with transparent interest rates and zero surprise charges.',
    metrics: [
      { label: 'Decision Time', value: '< 2.5s' },
      { label: 'Credit Line Max', value: '₹ 15 Lakhs' },
      { label: 'Intro APR', value: '0% Extra Promo' },
    ],
    screenType: 'underwriting',
    applicant: 'Rohan Sharma',
  },
  {
    id: 3,
    icon: Zap,
    title: '1-Tap Cash to Bank',
    subtitle: 'Money in your bank in seconds',
    description:
      'Enter the amount you need and tap withdraw. Funds are transferred directly to your bank account via instant IMPS or UPI rails.',
    metrics: [
      { label: 'Transfer Speed', value: '1.2 Seconds' },
      { label: 'Transfer Mode', value: 'IMPS / UPI 24x7' },
      { label: 'Hidden Charges', value: '₹ 0' },
    ],
    screenType: 'disbursement',
    applicant: 'Rohan Sharma',
  },
  {
    id: 4,
    icon: Clock,
    title: 'Auto-Debit & Chill',
    subtitle: 'Hassle-free automated repayments',
    description:
      'Set up 1-click eNACH auto-debit or pay via UPI anytime. Enjoy friendly reminders, zero penalty on early payments, and continuous credit limit upgrades.',
    metrics: [
      { label: 'Payment Options', value: 'UPI / eNACH / Card' },
      { label: 'Limit Upgrades', value: 'Every 3 Months' },
      { label: 'Late Fee Trap', value: '₹ 0' },
    ],
    screenType: 'collections',
    applicant: 'Rohan Sharma',
  },
];

export function LoanLifecycleVisualizer() {
  const [activeStepId, setActiveStepId] = useState(1);
  const activeStep = STEPS.find((s) => s.id === activeStepId) || STEPS[0];

  return (
    <div className="relative mx-auto max-w-[1536px] px-4 sm:px-8 lg:px-12 xl:px-16 py-20">
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-accent-700 ring-1 ring-inset ring-accent-600/20">
          <Smartphone className="h-3.5 w-3.5 text-accent-600" /> Seamless 4-Step Experience
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          From selfie to cash in <span className="bg-brand-gradient bg-clip-text text-transparent">90 seconds</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-600">
          No standing in queues. No printouts. No waiting days for credit approvals.
        </p>
      </div>

      {/* Step Pills */}
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => {
          const isActive = step.id === activeStepId;
          const Icon = step.icon;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStepId(step.id)}
              className={`group relative flex flex-col items-start rounded-3xl border p-6 text-left transition-all duration-200 ${
                isActive
                  ? 'border-brand-600 bg-white shadow-card ring-2 ring-brand-500/30 scale-102'
                  : 'border-slate-200/80 bg-white/70 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                    isActive
                      ? 'bg-brand-gradient text-white shadow-glow'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-extrabold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
                  Step 0{step.id}
                </span>
              </div>
              <p className="mt-4 font-bold text-base text-slate-900">{step.title}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{step.subtitle}</p>

              {isActive && (
                <div className="absolute -bottom-1 left-1/2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-brand-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Interactive Bespoke FinTech Device Visualizer Container */}
      <div className="mt-10 grid items-center gap-8 rounded-[3rem] border border-white/20 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-12 text-white shadow-2xl lg:grid-cols-12">
        {/* Left Information (5 cols) */}
        <div className="lg:col-span-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/20 px-3.5 py-1 text-xs font-bold text-brand-300 ring-1 ring-brand-500/30">
            Phase 0{activeStep.id} • Live Visualizer
          </span>
          <h3 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            {activeStep.title}
          </h3>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-300">
            {activeStep.description}
          </p>

          {/* Quick Metrics */}
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
            {activeStep.metrics.map((m) => (
              <div key={m.label} className="rounded-2xl bg-white/5 p-3.5 backdrop-blur">
                <p className="text-[11px] font-semibold text-slate-400">{m.label}</p>
                <p className="mt-1 text-sm sm:text-base font-extrabold text-white">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Cutting-Edge FinTech Mobile Interface (7 cols) */}
        <div className="lg:col-span-7">
          <TiltCard
            maxTilt={6}
            perspective={1200}
            scale={1.01}
            glare={true}
            glareOpacity={0.25}
            className="w-full"
          >
            {/* FinTech Device Frame */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-slate-950 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
              {/* Dynamic Island & Device Status Bar */}
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <span className="text-xs font-mono font-bold text-slate-400">09:41</span>

                {/* Centered Dynamic Pill */}
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-[11px] font-bold text-emerald-300 ring-1 ring-white/15">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {activeStep.id === 1 && 'Biometric KYC Engine'}
                    {activeStep.id === 2 && 'AI Credit Decisioning'}
                    {activeStep.id === 3 && 'NPCI IMPS Rail Active'}
                    {activeStep.id === 4 && 'Auto-Debit Smart Vault'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  <Wifi className="h-3.5 w-3.5" />
                  <Battery className="h-4 w-4" />
                </div>
              </div>

              {/* STAGE-SPECIFIC INTERACTIVE UI SCREENS */}
              <div className="mt-6">
                {/* 1. KYC Screen */}
                {activeStep.id === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-500/20 to-purple-500/20 p-4 border border-brand-500/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-glow">
                          <ScanFace className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-white">Biometric Face Match</p>
                          <p className="text-xs text-emerald-400 font-semibold">99.8% Liveness Match Verified</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                        PASSED
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs text-slate-400">Aadhaar e-KYC</p>
                        <p className="mt-1 font-bold text-white text-sm">UIDAI Authenticated ✓</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs text-slate-400">PAN Database</p>
                        <p className="mt-1 font-bold text-white text-sm">Instant Match ✓</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-500/15 p-3.5 text-xs text-emerald-300 border border-emerald-500/25 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Zero Paperwork • Identity 100% verified in 42 seconds</span>
                    </div>
                  </div>
                )}

                {/* 2. Underwriting Screen */}
                {activeStep.id === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-500/20 to-teal-500/20 p-5 border border-white/15">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Approved Credit Limit</p>
                        <p className="text-3xl font-black text-white mt-1 text-glow">₹ 2,50,000</p>
                        <p className="text-xs text-accent-300 font-semibold mt-1">@ 0% Interest on 3-Month Splits</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-300">
                          CIBIL 790 Prime
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">Low Risk Tier</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs text-slate-400">Decision Speed</p>
                        <p className="mt-1 font-bold text-white text-sm">1.8 Seconds AI Engine</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs text-slate-400">Pre-closure Fee</p>
                        <p className="mt-1 font-bold text-emerald-400 text-sm">₹0 (Zero Charges)</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-brand-500/15 p-3.5 text-xs text-brand-300 border border-brand-500/25 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-brand-400 shrink-0" />
                      <span>Instant Sanction Letter generated and ready to disburse</span>
                    </div>
                  </div>
                )}

                {/* 3. Disbursement Screen */}
                {activeStep.id === 3 && (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-5 border border-white/15">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">Beneficiary Account</span>
                        <span className="text-xs font-bold text-emerald-400">IMPS Success (1.2s)</span>
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <div>
                          <p className="text-2xl font-black text-white">₹ 50,000.00</p>
                          <p className="text-xs text-slate-400 mt-0.5">HDFC Bank •••• 4821</p>
                        </div>
                        <span className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-extrabold text-slate-950">
                          CREDITED ✓
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs text-slate-400">Bank UTR Ref</p>
                        <p className="mt-1 font-mono font-bold text-slate-200 text-xs">HDFC98234821</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs text-slate-400">Transfer Rail</p>
                        <p className="mt-1 font-bold text-white text-sm">NPCI 24x7 IMPS</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-500/15 p-3.5 text-xs text-emerald-300 border border-emerald-500/25 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-emerald-400 shrink-0 fill-emerald-400" />
                      <span>Funds immediately available to spend via UPI or ATM withdrawal</span>
                    </div>
                  </div>
                )}

                {/* 4. Collections Screen */}
                {activeStep.id === 4 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-purple-500/20 to-brand-500/20 p-5 border border-white/15">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Upcoming Installment</p>
                        <p className="text-2xl font-black text-white mt-1">₹ 8,333 / month</p>
                        <p className="text-xs text-slate-400 mt-1">Auto-Debit on 05th via eNACH</p>
                      </div>
                      <div className="text-right">
                        <span className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-extrabold text-brand-300">
                          e-Mandate Active
                        </span>
                        <p className="text-[10px] text-emerald-400 font-bold mt-1.5">+25 CIBIL Score Gain</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs text-slate-400">Early Pay Option</p>
                        <p className="mt-1 font-bold text-white text-sm">1-Tap (₹0 Penalty)</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs text-slate-400">Reward Cashback</p>
                        <p className="mt-1 font-bold text-amber-400 text-sm">₹250 Unlocked 🎁</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-brand-500/15 p-3.5 text-xs text-brand-300 border border-brand-500/25 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-brand-400 shrink-0" />
                      <span>Friendly reminders & zero late fee traps on automated schedule</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TiltCard>
        </div>
      </div>
    </div>
  );
}
