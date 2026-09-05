'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Headphones,
  CheckCircle2,
  Lock,
  Smartphone,
} from 'lucide-react';
import { TiltCard } from './TiltCard';
import { Button } from './ui';

export function SliceGrowWealth() {
  const [balance, setBalance] = useState(250000);

  // Daily interest formula at 7.5% per annum
  const annualRate = 7.5;
  const annualInterest = Math.round(balance * (annualRate / 100));
  const dailyInterest = (annualInterest / 365).toFixed(2);
  const monthlyInterest = Math.round(annualInterest / 12);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="relative mx-auto max-w-[1536px] px-4 sm:px-8 lg:px-12 xl:px-16 py-20">
      <div className="grid gap-8 lg:grid-cols-12 items-center">
        {/* Left Rich Showcase (6 cols) */}
        <div className="lg:col-span-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#450177] ring-1 ring-inset ring-[#450177]/20">
            <Sparkles className="h-3.5 w-3.5 text-[#450177]" /> Daily Wealth Growth
          </span>

          <h2 className="mt-4 text-4xl sm:text-6xl font-black tracking-tight text-slate-950 leading-[1.08]">
            Grow your money. <br />
            <span className="bg-brand-gradient bg-clip-text text-transparent">Daily interest credited.</span>
          </h2>

          <p className="mt-5 text-base sm:text-xl font-medium leading-relaxed text-slate-600">
            No waiting till month-end. Earn up to <span className="font-extrabold text-slate-900">7.5% p.a.</span> interest calculated daily and deposited straight into your account every morning at 8 AM.
          </p>

          {/* Key Advantages */}
          <div className="mt-8 space-y-3.5">
            <div className="flex items-center gap-3 text-sm sm:text-base font-bold text-slate-800">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span>Zero minimum balance requirement • ₹0 penalty</span>
            </div>

            <div className="flex items-center gap-3 text-sm sm:text-base font-bold text-slate-800">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span>RBI DICGC Insurance coverage up to ₹5,00,000</span>
            </div>

            <div className="flex items-center gap-3 text-sm sm:text-base font-bold text-slate-800">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span>1-Tap Instant sweep out to any UPI anytime</span>
            </div>
          </div>
        </div>

        {/* Right Live Daily Interest Simulator (6 cols) */}
        <div className="lg:col-span-6">
          <TiltCard
            maxTilt={6}
            perspective={1200}
            scale={1.01}
            glare={true}
            glareOpacity={0.25}
          >
            <div className="rounded-[3rem] border border-white/20 bg-gradient-to-br from-[#120024] via-[#2c0847] to-[#0d0118] p-8 sm:p-12 text-white shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-widest text-purple-300">
                  Daily Earnings Calculator
                </span>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                  7.5% Repo-Linked APR
                </span>
              </div>

              {/* Balance Slider */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Your Average Balance</span>
                  <span className="text-2xl font-black text-white">{formatINR(balance)}</span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={2500000}
                  step={10000}
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value))}
                  className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-purple-400 focus:outline-none"
                />
              </div>

              {/* Earnings HUD */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-300">Every Morning At 8 AM</p>
                  <p className="mt-2 text-3xl font-black text-emerald-400">+₹{dailyInterest}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Daily Cash Credit</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-300">Annual Growth</p>
                  <p className="mt-2 text-3xl font-black text-white">{formatINR(annualInterest)}</p>
                  <p className="mt-1 text-[11px] text-slate-400">~{formatINR(monthlyInterest)} per month</p>
                </div>
              </div>

              <div className="mt-8">
                <Link href="/apply?purpose=Wealth+Account" className="block w-full">
                  <Button className="w-full py-4 text-base font-extrabold bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 text-white shadow-glow hover:brightness-110">
                    Open Your Wealth Account in 90s <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>
    </div>
  );
}
