'use client';

import React, { useState } from 'react';
import { TrendingUp, Sparkles, Award, ShieldCheck, Zap, ArrowRight, Check } from 'lucide-react';
import { TiltCard } from './TiltCard';

const TIERS = [
  {
    step: 1,
    repayments: '1 On-Time Repayment',
    limit: '₹ 25,000',
    title: 'Starter Line',
    badge: 'Level 1',
    perks: ['Instant UPI Transfer', '90s Paperless KYC', 'Zero Card Fees'],
    color: 'from-slate-700 to-slate-900',
  },
  {
    step: 2,
    repayments: '3 On-Time Repayments',
    limit: '₹ 1,00,000',
    title: 'Silver Booster',
    badge: 'Level 2',
    perks: ['Split in 3 Months @ 0%', 'Auto-Approval Engine', '+15 CIBIL Score Boost'],
    color: 'from-indigo-900 to-slate-900',
  },
  {
    step: 3,
    repayments: '6 On-Time Repayments',
    limit: '₹ 5,00,000',
    title: 'Gold Power Line',
    badge: 'Level 3 • Popular',
    perks: ['Zero Processing Fees', 'Flexi 24-Month Tenures', 'Instant Cash to Any Bank'],
    color: 'from-amber-900 via-slate-900 to-slate-950',
  },
  {
    step: 4,
    repayments: '12 On-Time Repayments',
    limit: '₹ 15,00,000',
    title: 'Platinum Superpower',
    badge: 'Level 4 • Elite',
    perks: ['Lowest Market APR', 'Dedicated RM Support', 'Custom Merchant Credit'],
    color: 'from-purple-950 via-slate-900 to-indigo-950',
  },
];

export function LimitBooster() {
  const [selectedStep, setSelectedStep] = useState(2);
  const currentTier = TIERS[selectedStep];

  return (
    <div className="relative mx-auto max-w-[1536px] px-4 sm:px-8 lg:px-12 xl:px-16 py-20">
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Automatic Limit Upgrades
        </span>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
          The More You Use, <span className="bg-brand-gradient bg-clip-text text-transparent">The More You Unlock</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-600">
          Every on-time repayment automatically multiplies your credit limit. No requests, no waiting.
        </p>
      </div>

      {/* Interactive Step Slider Bar */}
      <div className="mt-12 mx-auto max-w-6xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TIERS.map((tier, idx) => {
            const isActive = selectedStep === idx;
            return (
              <button
                key={tier.title}
                onClick={() => setSelectedStep(idx)}
                className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 ${
                  isActive
                    ? 'border-brand-600 bg-white shadow-card ring-2 ring-brand-500/20 scale-102'
                    : 'border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-[10px] font-extrabold text-brand-600 uppercase tracking-wider">
                    {tier.badge}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <p className="mt-2 text-xl font-black text-slate-950">{tier.limit}</p>
                <p className="text-[11px] font-medium text-slate-500">{tier.repayments}</p>
              </button>
            );
          })}
        </div>

        {/* 3D Tier Display Showcase */}
        <div className="mt-8">
          <TiltCard
            maxTilt={6}
            perspective={1200}
            scale={1.01}
            glare={true}
            glareOpacity={0.2}
          >
            <div
              className={`relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-gradient-to-br ${currentTier.color} p-8 sm:p-12 text-white shadow-2xl transition-all duration-500`}
            >
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div>
                  <span className="rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-accent-300">
                    {currentTier.badge}
                  </span>
                  <h3 className="mt-4 text-3xl sm:text-4xl font-black text-white">{currentTier.title}</h3>
                  <p className="mt-1 text-base text-slate-300">
                    Approved Limit Unlocked: <span className="font-extrabold text-white text-2xl text-glow">{currentTier.limit}</span>
                  </p>
                  <p className="mt-2 text-xs text-slate-400">Triggered after {currentTier.repayments}</p>
                </div>

                {/* Perks Checklist */}
                <div className="space-y-3 rounded-2xl bg-white/5 p-6 backdrop-blur-xl border border-white/10 min-w-[280px]">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Unlocked Privileges</p>
                  {currentTier.perks.map((perk) => (
                    <div key={perk} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-200">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>
    </div>
  );
}
