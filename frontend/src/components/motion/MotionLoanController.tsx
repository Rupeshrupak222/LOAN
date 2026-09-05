'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useSpring } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Zap,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  DollarSign,
  TrendingDown,
  Info,
} from 'lucide-react';
import { GoalType } from './MotionGoalSelector';

interface Props {
  selectedGoal: GoalType;
}

const PRESET_AMOUNTS = [50000, 100000, 250000, 500000, 1000000, 2000000];

export const MotionLoanController: React.FC<Props> = ({ selectedGoal }) => {
  const [amount, setAmount] = useState(250000);
  const [tenure, setTenure] = useState(12);
  const [mode, setMode] = useState<'emi' | 'split3'>('emi');
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Rates based on selected goal
  const interestRate =
    selectedGoal === 'education'
      ? 9.75
      : selectedGoal === 'personal'
      ? 10.5
      : selectedGoal === 'medical'
      ? 11.0
      : 11.25;

  const isSplit3 = mode === 'split3';
  const effectiveTenure = isSplit3 ? 3 : tenure;
  const annualRate = isSplit3 ? 0 : interestRate;
  const monthlyRate = annualRate / 12 / 100;

  let emi = 0;
  let totalInterest = 0;
  let totalRepayment = amount;

  if (isSplit3) {
    emi = Math.round(amount / 3);
    totalInterest = 0;
    totalRepayment = amount;
  } else {
    if (monthlyRate > 0) {
      emi = Math.round(
        (amount * monthlyRate * Math.pow(1 + monthlyRate, effectiveTenure)) /
          (Math.pow(1 + monthlyRate, effectiveTenure) - 1)
      );
      totalRepayment = emi * effectiveTenure;
      totalInterest = Math.max(0, totalRepayment - amount);
    } else {
      emi = Math.round(amount / effectiveTenure);
      totalRepayment = amount;
      totalInterest = 0;
    }
  }

  const processingFee = isSplit3 ? 0 : Math.round(amount * 0.0099);
  const principalPercent = totalRepayment > 0 ? (amount / totalRepayment) * 100 : 100;
  const interestPercent = totalRepayment > 0 ? (totalInterest / totalRepayment) * 100 : 0;

  // Spring animation for amount display scaling
  const amountScale = useSpring(1, { stiffness: 300, damping: 20 });

  const handleAmountChange = (val: number) => {
    setAmount(val);
    amountScale.set(1.04);
    setTimeout(() => amountScale.set(1), 150);
  };

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  // Section entrance with unique left/right split reveal
  useEffect(() => {
    if (!sectionRef.current) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      // Header: fade up
      if (headerRef.current) {
        const headerEls = headerRef.current.querySelectorAll('[data-reveal]');
        gsap.set(headerEls, { opacity: 0, y: 36 });
        ScrollTrigger.create({
          trigger: headerRef.current,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            gsap.to(headerEls, {
              opacity: 1, y: 0,
              duration: 0.8, stagger: 0.12, ease: 'power3.out',
            });
          },
        });
      }

      // Toggle: enters from center with scale
      if (toggleRef.current) {
        gsap.set(toggleRef.current, { opacity: 0, scale: 0.9 });
        ScrollTrigger.create({
          trigger: toggleRef.current,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            gsap.to(toggleRef.current, {
              opacity: 1, scale: 1,
              duration: 0.6, ease: 'back.out(2)',
            });
          },
        });
      }

      // Left panel: slides from left with blur
      if (leftPanelRef.current) {
        gsap.set(leftPanelRef.current, { opacity: 0, x: -60, filter: 'blur(8px)' });
        ScrollTrigger.create({
          trigger: leftPanelRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(leftPanelRef.current, {
              opacity: 1, x: 0, filter: 'blur(0px)',
              duration: 0.9, ease: 'power3.out',
            });
          },
        });
      }

      // Right panel: slides from right with blur
      if (rightPanelRef.current) {
        gsap.set(rightPanelRef.current, { opacity: 0, x: 60, filter: 'blur(8px)' });
        ScrollTrigger.create({
          trigger: rightPanelRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(rightPanelRef.current, {
              opacity: 1, x: 0, filter: 'blur(0px)',
              duration: 0.9, ease: 'power3.out', delay: 0.12,
            });
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="calculator"
      ref={sectionRef}
      className="relative py-28 bg-gradient-to-b from-[#EAF4FF]/50 via-[#FFFFFF] to-[#EAF4FF]/30 text-[#071A33] overflow-hidden border-t border-[#D3E5FA]/60"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-16">
          <div data-reveal className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#D3E5FA] text-xs font-mono text-[#155EEF] uppercase tracking-widest mb-4 font-bold shadow-2xs">
            <span>CHAPTER 03 : TACTILE LOAN CONTROL</span>
          </div>

          <h2 data-reveal className="text-3xl sm:text-5xl font-black tracking-tight text-[#071A33] mb-4">
            Make the numbers fit your life.
          </h2>

          <p data-reveal className="text-[#526071] text-base sm:text-lg font-medium">
            Drag the controller. Feel the immediate financial impact. Toggle between transparent multi-month EMIs and our 0% 3-month split.
          </p>
        </div>

        {/* Mode Selector Toggle */}
        <div ref={toggleRef} className="flex items-center justify-center mb-12">
          <div className="inline-flex p-1.5 rounded-2xl bg-white border border-[#D3E5FA] shadow-xs">
            <button
              onClick={() => setMode('emi')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                !isSplit3
                  ? 'bg-[#155EEF] text-white shadow-sm'
                  : 'text-[#526071] hover:text-[#071A33]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Flexible Monthly EMI</span>
            </button>
            <button
              onClick={() => setMode('split3')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                isSplit3
                  ? 'bg-[#155EEF] text-white shadow-sm'
                  : 'text-[#526071] hover:text-[#071A33]'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Split in 3 Months (0% Interest)</span>
            </button>
          </div>
        </div>

        {/* Large Tactile Controller & Real-Time Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Physical Sliders & Quick Presets */}
          <div className="lg:col-span-7">
            <div ref={leftPanelRef} className="h-full rounded-3xl bg-white border border-[#D3E5FA] p-6 sm:p-10 flex flex-col justify-between shadow-md">
              <div>
                {/* Giant Numerical Display with Spring Scaling */}
                <div className="mb-8">
                  <div className="text-xs font-mono uppercase tracking-widest text-[#526071] mb-2 font-semibold">
                    Select Loan Amount
                  </div>
                  <motion.div
                    style={{ scale: amountScale }}
                    className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-[#071A33] origin-left"
                  >
                    {formatINR(amount)}
                  </motion.div>
                </div>

                {/* Slider 1: Amount */}
                <div className="mb-6">
                  <input
                    type="range"
                    min={25000}
                    max={2500000}
                    step={5000}
                    value={amount}
                    onChange={(e) => handleAmountChange(Number(e.target.value))}
                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
                  />
                  <div className="flex justify-between text-xs font-mono text-[#526071] mt-2 font-semibold">
                    <span>Min: ₹25,000</span>
                    <span>Max: ₹25,00,000</span>
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex items-center gap-2 flex-wrap mb-8">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleAmountChange(preset)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all duration-150 active:scale-95 cursor-pointer ${
                        amount === preset
                          ? 'bg-[#155EEF] border-[#155EEF] text-white shadow-xs'
                          : 'bg-white border-[#D3E5FA] text-[#071A33] hover:bg-[#EAF4FF]'
                      }`}
                    >
                      {formatINR(preset)}
                    </button>
                  ))}
                </div>

                {/* Slider 2: Tenure */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#526071] font-semibold">
                      Repayment Tenure
                    </span>
                    <span className="text-xl font-bold font-mono text-[#155EEF]">
                      {effectiveTenure} Months
                    </span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={36}
                    step={1}
                    value={effectiveTenure}
                    disabled={isSplit3}
                    onChange={(e) => setTenure(Number(e.target.value))}
                    className={`w-full h-3 rounded-lg appearance-none cursor-pointer ${
                      isSplit3
                        ? 'bg-slate-100 opacity-50 cursor-not-allowed'
                        : 'bg-slate-200 accent-[#155EEF]'
                    }`}
                  />
                  <div className="flex justify-between text-xs font-mono text-[#526071] mt-2 font-semibold">
                    <span>3 Months</span>
                    {isSplit3 && (
                      <span className="text-[#155EEF] font-bold">
                        Fixed 3-Month 0% Split
                      </span>
                    )}
                    <span>36 Months</span>
                  </div>
                </div>
              </div>

              {/* Micro FAQ Trust Pill */}
              <div className="pt-6 border-t border-[#D3E5FA] flex items-center justify-between text-xs text-[#526071] font-medium">
                <span className="flex items-center gap-1.5 text-[#155EEF] font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  Zero prepayment foreclosure fees
                </span>
                <span>Calculated on reducing monthly balance</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Breakdown & Monthly Impact */}
          <div className="lg:col-span-5">
            <div ref={rightPanelRef} className="h-full rounded-3xl bg-white border border-[#D3E5FA] p-6 sm:p-10 flex flex-col justify-between shadow-md relative overflow-hidden">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-[#526071] font-bold mb-1">
                  MONTHLY COMMITMENT
                </div>
                <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-[#155EEF] mb-6">
                  {formatINR(emi)}
                  <span className="text-sm font-bold text-[#526071] ml-2 font-sans">
                    / month
                  </span>
                </div>

                {/* Visual Split Bar with Spring Motion */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-mono text-[#526071] font-bold mb-2">
                    <span>Principal ({principalPercent.toFixed(0)}%)</span>
                    <span>Interest ({interestPercent.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden flex border border-[#D3E5FA]">
                    <motion.div
                      className="h-full bg-[#155EEF]"
                      animate={{ width: `${principalPercent}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                    <motion.div
                      className="h-full bg-[#4EA8FF]"
                      animate={{ width: `${interestPercent}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Breakdown Details */}
                <div className="space-y-3 p-5 rounded-2xl bg-[#EAF4FF]/40 border border-[#D3E5FA] text-xs font-medium">
                  <div className="flex justify-between text-[#526071]">
                    <span>Sanctioned Principal:</span>
                    <span className="font-bold text-[#071A33] font-mono text-sm">{formatINR(amount)}</span>
                  </div>
                  <div className="flex justify-between text-[#526071]">
                    <span>Total Interest:</span>
                    <span className="font-bold text-[#071A33] font-mono text-sm">
                      {isSplit3 ? '₹0 (0% Interest)' : formatINR(totalInterest)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#526071]">
                    <span>Processing Fee:</span>
                    <span className="font-bold text-[#155EEF] font-mono text-sm">
                      {isSplit3 ? '₹0 (Waived)' : formatINR(processingFee)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-[#D3E5FA] flex justify-between text-[#071A33] font-bold">
                    <span>Total Repayment:</span>
                    <span className="font-black text-[#071A33] font-mono text-base">
                      {formatINR(totalRepayment + processingFee)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct CTA */}
              <div className="mt-8">
                <Link
                  href={`/applications/new?amount=${amount}&tenure=${effectiveTenure}&purpose=${selectedGoal}`}
                  className="w-full inline-flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-sm text-white bg-[#155EEF] hover:bg-[#104ec8] active:scale-95 transition-all shadow-md shadow-[#155EEF]/20"
                >
                  Lock this Path for {selectedGoal.toUpperCase()}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="text-[11px] text-center text-[#526071] mt-2 font-mono font-medium">
                  ⚡ 90-Sec Paperless Approval • Zero Impact on CIBIL Score
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
