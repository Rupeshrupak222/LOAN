'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Briefcase,
  Laptop,
  Store,
  CheckCircle2,
  ArrowRight,
  Zap,
  ShieldCheck,
  Clock,
  Banknote,
  FileCheck,
} from 'lucide-react';
import { TiltCard } from './TiltCard';
import { Button } from './ui';

const PERSONAS = [
  {
    id: 'students',
    label: 'Students & Freshers',
    icon: GraduationCap,
    limit: '₹ 500 to ₹ 20,000',
    tagline: 'Pocket money, exam fees & sudden cash emergencies.',
    approvalTime: '60 Seconds',
    interestRate: 'From 0% / 3-Month Split',
    docsRequired: ['College ID / Admission Letter', 'Aadhaar Card', 'PAN Card / Form 60'],
    perks: [
      'No previous credit history or CIBIL required',
      'Direct transfer to Google Pay / PhonePe / Paytm',
      'Build your credit score early for future home & auto loans',
    ],
    accentColor: 'from-pink-500 to-rose-600',
    badgeColor: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    glowColor: 'bg-rose-500/20',
    popular: false,
  },
  {
    id: 'salaried',
    label: 'Salaried Professionals',
    icon: Briefcase,
    limit: '₹ 10,000 to ₹ 5,00,000',
    tagline: 'Month-end cash crunch, travel, medical & lifestyle upgrades.',
    approvalTime: '90 Seconds',
    interestRate: 'Low Flat APR or Split in 3',
    docsRequired: ['Last 3 Months Bank Statement', 'PAN Card & Aadhaar', 'Salary Slip / Work Email'],
    perks: [
      'Instant sanction without tedious branch visits',
      'Split in 3 months with absolutely 0% markup',
      'Tenures up to 24 months with 0 penalty foreclosure',
    ],
    accentColor: 'from-brand-600 to-indigo-600',
    badgeColor: 'bg-brand-50 text-brand-700 ring-brand-600/20',
    glowColor: 'bg-brand-500/20',
    popular: true,
  },
  {
    id: 'freelancers',
    label: 'Gig Workers & Creators',
    icon: Laptop,
    limit: '₹ 5,000 to ₹ 2,50,000',
    tagline: 'Bridge invoice delays, buy gear & manage irregular income.',
    approvalTime: '2 Minutes',
    interestRate: 'Flexi Cash Line',
    docsRequired: ['UPI / Bank Inflow History', 'PAN & Aadhaar Card', 'Client Invoices / Platform Profile'],
    perks: [
      'Pay interest only on the amount you withdraw',
      'Revolving credit line that refills as you repay',
      'Multi-UPI payout options 24x7 including Sundays',
    ],
    accentColor: 'from-purple-600 to-violet-700',
    badgeColor: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    glowColor: 'bg-purple-500/20',
    popular: false,
  },
  {
    id: 'msme',
    label: 'Small Business & MSMEs',
    icon: Store,
    limit: '₹ 50,000 to ₹ 15,00,000',
    tagline: 'Inventory purchase, supplier payouts & seasonal working capital.',
    approvalTime: '5 Minutes',
    interestRate: 'Competitive Business Rates',
    docsRequired: ['GSTIN / Udyam Registration', '12 Months Bank Statement', 'Business PAN Card'],
    perks: [
      'Collateral-free unsecured business credit line',
      'High disbursal limits with customized daily/weekly flexi-EMIs',
      'Dedicated relationship manager and 24x7 merchant support',
    ],
    accentColor: 'from-emerald-600 to-teal-700',
    badgeColor: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    glowColor: 'bg-emerald-500/20',
    popular: false,
  },
];

export function PersonaCreditSwitcher() {
  const [activePersonaId, setActivePersonaId] = useState('salaried');
  const current = PERSONAS.find((p) => p.id === activePersonaId) || PERSONAS[1];
  const CurrentIcon = current.icon;

  return (
    <div className="relative mx-auto max-w-[1536px] px-4 sm:px-8 lg:px-12 xl:px-16 py-20">
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-brand-700 ring-1 ring-inset ring-brand-600/20">
          <Zap className="h-3.5 w-3.5 fill-brand-600 text-brand-600" /> Tailored For Everyone
        </span>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Credit Made For <span className="bg-brand-gradient bg-clip-text text-transparent">Your Exact Need</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-600">
          Whether you are a student, salaried professional, freelancer, or small merchant, we have customized instant credit solutions ready for you.
        </p>
      </div>

      {/* Persona Selection Tabs */}
      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PERSONAS.map((persona) => {
          const Icon = persona.icon;
          const isActive = activePersonaId === persona.id;
          return (
            <button
              key={persona.id}
              onClick={() => setActivePersonaId(persona.id)}
              className={`relative flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-all duration-300 ${
                isActive
                  ? 'border-brand-600 bg-white shadow-card ring-2 ring-brand-500/20 scale-102'
                  : 'border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                  isActive
                    ? 'bg-gradient-to-br ' + persona.accentColor + ' text-white shadow-md'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{persona.label}</p>
                <p className="text-[11px] font-bold text-brand-600 mt-0.5">{persona.limit}</p>
              </div>
              {persona.popular && (
                <span className="absolute -top-2.5 right-3 rounded-full bg-brand-600 px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-sm">
                  Most Popular
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Detailed Persona 3D Card Display */}
      <div className="mt-8">
        <TiltCard
          maxTilt={5}
          perspective={1200}
          scale={1.01}
          glare={true}
          glareOpacity={0.2}
        >
          <div className="rounded-[3rem] border border-slate-200/80 bg-white p-8 sm:p-14 shadow-card backdrop-blur-xl">
            <div className="grid gap-10 lg:grid-cols-12 items-center">
              {/* Left Details (7 cols) */}
              <div className="lg:col-span-7">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${current.accentColor} text-white shadow-md`}
                  >
                    <CurrentIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold ring-1 ring-inset ${current.badgeColor}`}
                    >
                      {current.label} Credit Line
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
                      Sanctioned Limit: {current.limit}
                    </h3>
                  </div>
                </div>

                <p className="mt-4 text-base text-slate-600 leading-relaxed font-medium">
                  {current.tagline}
                </p>

                {/* Key Benefits */}
                <div className="mt-6 space-y-3">
                  {current.perks.map((perk) => (
                    <div key={perk} className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link href={`/apply?purpose=${encodeURIComponent(current.label)}`}>
                    <Button className="px-8 py-4 text-base font-extrabold shadow-glow">
                      Apply as {current.label} <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <span className="text-xs font-bold text-slate-500">
                    ⚡ Instant disbursal to any bank / UPI
                  </span>
                </div>
              </div>

              {/* Right Fast Specs HUD (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Bespoke FinTech Digital Credit Pass */}
                <div
                  className={`relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br ${current.accentColor} p-6 text-white shadow-xl`}
                >
                  {/* Subtle Grid Overlay & Ambient Glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
                  <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/20 blur-2xl pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                          <CurrentIcon className="h-4 w-4 text-white" />
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                          {current.label} Pass
                        </span>
                      </div>
                      <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-[11px] font-extrabold text-emerald-200 border border-emerald-400/30">
                        ⚡ 90s Sanction
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                          Pre-Approved Credit Range
                        </p>
                        <p className="text-2xl font-black text-white tracking-tight mt-0.5">
                          {current.limit}
                        </p>
                      </div>

                      {/* Gold Chip Graphic */}
                      <div className="h-8 w-11 rounded-lg bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-400 p-1.5 shadow-sm border border-amber-200/60">
                        <div className="h-full w-full rounded border border-amber-500/30 grid grid-cols-2 gap-0.5 opacity-60">
                          <div className="border-r border-amber-500/40" />
                          <div className="border-l border-amber-500/40" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-[11px] font-semibold text-white/80">
                      <span>e-KYC & UIDAI Instant Match</span>
                      <span className="text-white font-mono font-extrabold">NPCI 24x7 Rail</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2.25rem] border border-slate-200 bg-slate-900 p-6 text-white shadow-xl">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-brand-400">
                    Application Blueprint
                  </p>

                  <div className="mt-4 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                      <span className="flex items-center gap-2 text-xs font-medium text-slate-400">
                        <Clock className="h-4 w-4 text-emerald-400" /> Disbursal Speed
                      </span>
                      <span className="text-sm font-extrabold text-white">{current.approvalTime}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                      <span className="flex items-center gap-2 text-xs font-medium text-slate-400">
                        <Banknote className="h-4 w-4 text-amber-400" /> Pricing Structure
                      </span>
                      <span className="text-sm font-extrabold text-white">{current.interestRate}</span>
                    </div>

                    <div>
                      <p className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2.5">
                        <FileCheck className="h-4 w-4 text-brand-400" /> Minimum Documents
                      </p>
                      <div className="space-y-1.5 pl-6">
                        {current.docsRequired.map((doc) => (
                          <p key={doc} className="text-xs font-semibold text-slate-200">
                            • {doc}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl bg-white/10 p-3.5 text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>100% Digital • Zero Physical Documentation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
