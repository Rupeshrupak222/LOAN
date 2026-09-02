'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  BadgePercent,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { TiltCard } from './TiltCard';
import { Button } from './ui';

const PRESETS = [
  { label: 'Pocket Cash', amount: 15000, tenure: 3, rate: 0, tag: '0% Interest Split' },
  { label: 'Quick Need', amount: 50000, tenure: 6, rate: 10.5, tag: 'Most Popular' },
  { label: 'Flexi Credit', amount: 200000, tenure: 12, rate: 11.5, tag: 'Low Monthly EMI' },
  { label: 'Power Capital', amount: 1000000, tenure: 36, rate: 12.0, tag: 'High Limit' },
];

export function EmiCalculator() {
  const [amount, setAmount] = useState(50000);
  const [tenureMonths, setTenureMonths] = useState(6);
  const [interestRate, setInterestRate] = useState(10.5);
  const [isSplitIn3, setIsSplitIn3] = useState(false);

  // Toggle 3-month no-cost split
  const handleSplitMode = (active: boolean) => {
    setIsSplitIn3(active);
    if (active) {
      setTenureMonths(3);
      setInterestRate(0);
    } else {
      setInterestRate(10.5);
      setTenureMonths(6);
    }
  };

  const handlePresetSelect = (p: typeof PRESETS[0]) => {
    setAmount(p.amount);
    setTenureMonths(p.tenure);
    setInterestRate(p.rate);
    setIsSplitIn3(p.rate === 0);
  };

  // Precise Calculation
  const { monthlyEmi, totalInterest, totalPayment, principalShare, interestShare } = useMemo(() => {
    const p = amount;
    const r = interestRate / 12 / 100;
    const n = tenureMonths;

    let emi = 0;
    if (r === 0 || isSplitIn3) {
      emi = p / n;
    } else {
      emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const totalPay = emi * n;
    const totalInt = totalPay - p;

    const pShare = Math.round((p / totalPay) * 100) || 100;
    const iShare = 100 - pShare;

    return {
      monthlyEmi: Math.round(emi),
      totalInterest: Math.max(0, Math.round(totalInt)),
      totalPayment: Math.round(totalPay),
      principalShare: pShare,
      interestShare: iShare,
    };
  }, [amount, interestRate, tenureMonths, isSplitIn3]);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const circumference = 251.3;
  const principalStroke = (principalShare / 100) * circumference;
  const interestStroke = (interestShare / 100) * circumference;

  return (
    <div className="relative mx-auto max-w-[1536px] px-4 sm:px-8 lg:px-12 xl:px-16 py-20">
      {/* Glow Blur */}
      <div className="absolute left-1/2 top-10 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />

      {/* Slice/mPokket Style Header */}
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-brand-700 ring-1 ring-inset ring-brand-600/20">
          <Zap className="h-3.5 w-3.5 fill-brand-600 text-brand-600" /> Instant Cash Simulator
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          How much cash do you need <span className="bg-brand-gradient bg-clip-text text-transparent">today?</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-600">
          Slide your amount. Choose your repayment plan. Get instant funds credited to your bank account in 90 seconds with zero paperwork.
        </p>
      </div>

      {/* Preset Quick Tabs */}
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {PRESETS.map((p) => {
          const active = amount === p.amount && tenureMonths === p.tenure;
          return (
            <button
              key={p.label}
              onClick={() => handlePresetSelect(p)}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition-all duration-200 ${
                active
                  ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/25 scale-105 ring-2 ring-brand-500'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>{p.label} ({p.amount >= 100000 ? `₹${p.amount / 100000}L` : `₹${p.amount / 1000}K`})</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {p.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* Calculator Main Grid */}
      <div className="mt-10 grid gap-8 lg:grid-cols-12 items-center">
        {/* Left Slider Controls (7 cols) */}
        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white/95 p-6 sm:p-10 shadow-soft backdrop-blur-xl lg:col-span-7">
          {/* Amount Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900">Transfer Amount to Bank</label>
              <span className="rounded-xl bg-brand-50 px-4 py-1.5 text-xl font-extrabold text-brand-700 ring-1 ring-brand-600/20">
                {formatINR(amount)}
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={1500000}
              step={5000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-brand-600 focus:outline-none"
            />
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>₹5,000 (Min)</span>
              <span>₹5 Lakhs</span>
              <span>₹15 Lakhs (Max)</span>
            </div>
          </div>

          <div className="my-8 border-t border-slate-100" />

          {/* Tenure Selection Mode */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900">Choose Repayment Plan</label>
              <span className="text-xs font-bold text-brand-600">
                {tenureMonths} Months ({isSplitIn3 ? '3-Split 0% Extra' : `${interestRate}% p.a.`})
              </span>
            </div>

            {/* Quick Tenure Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { months: 3, label: '3 Months', sub: '0% Interest Split' },
                { months: 6, label: '6 Months', sub: 'Easy EMI' },
                { months: 12, label: '12 Months', sub: 'Pocket Friendly' },
                { months: 24, label: '24 Months', sub: 'Flexi Duration' },
              ].map((t) => {
                const isSelected = tenureMonths === t.months;
                return (
                  <button
                    key={t.months}
                    onClick={() => {
                      setTenureMonths(t.months);
                      if (t.months === 3) {
                        setIsSplitIn3(true);
                        setInterestRate(0);
                      } else {
                        setIsSplitIn3(false);
                        setInterestRate(10.5);
                      }
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl p-3 text-center transition-all ${
                      isSelected
                        ? 'border-2 border-brand-600 bg-brand-50/70 text-brand-900 shadow-sm'
                        : 'border border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-extrabold">{t.label}</span>
                    <span className="text-[10px] font-medium text-slate-500">{t.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slice-style No Hidden Fees Guarantee */}
          <div className="mt-8 rounded-2xl bg-emerald-50/80 p-4 ring-1 ring-emerald-600/20">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="text-xs text-emerald-900">
                <p className="font-bold">Zero Hidden Asterisks & Prepayment Penalties</p>
                <p className="text-emerald-700">Prepay or foreclose your loan anytime at ₹0 extra fee. No surprise charges ever.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 3D Result Card (5 cols) */}
        <div className="lg:col-span-5">
          <TiltCard
            maxTilt={12}
            perspective={1200}
            scale={1.02}
            glare={true}
            glareOpacity={0.35}
            className="w-full"
          >
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-7 sm:p-9 text-white shadow-2xl">
              {/* Background ambient glow */}
              <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-brand-500/30 blur-2xl" />
              <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-accent-500/30 blur-2xl" />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Monthly Auto-Debit
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/20 px-3 py-1 text-xs font-extrabold text-brand-300 ring-1 ring-brand-400/30">
                    <Sparkles className="h-3.5 w-3.5" /> Instant Sanction
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-4xl sm:text-5xl font-black tracking-tight text-white text-glow">
                    {formatINR(monthlyEmi)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    for {tenureMonths} monthly installments
                  </p>
                </div>

                {/* Breakdown Details */}
                <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cash Transferred to Bank</span>
                    <span className="font-bold text-white">{formatINR(amount)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Interest Payable</span>
                    <span className="font-bold text-emerald-400">
                      {totalInterest === 0 ? '₹0 (Zero Extra)' : formatINR(totalInterest)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Processing & Setup Fee</span>
                    <span className="font-bold text-emerald-400">₹0 (Free Promo)</span>
                  </div>

                  <div className="border-t border-white/10 pt-3 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-300">Total Amount Repaid</span>
                    <span className="font-extrabold text-white">{formatINR(totalPayment)}</span>
                  </div>
                </div>

                {/* Instant Action CTA */}
                <div className="mt-6">
                  <Link href="/login" className="block w-full">
                    <Button className="w-full py-4 text-base font-extrabold shadow-glow hover:scale-105 active:scale-95 transition-transform">
                      Get Cash in 90 Seconds <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <p className="mt-3 text-center text-[11px] font-medium text-slate-400">
                    ⚡ Instant disbursal via IMPS / UPI • No bank visits needed
                  </p>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>
    </div>
  );
}
