'use client';

import React, { useState } from 'react';
import { ShoppingBag, Coffee, Plane, Globe, Zap, ShoppingCart, CheckCircle2 } from 'lucide-react';

export const EverydayMomentsShowcase: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const SCENARIOS = [
    {
      id: 'retail',
      icon: ShoppingBag,
      title: 'Retail Store QR',
      subtitle: 'Counter Point-of-Sale Scan',
      typicalSpend: '₹2,400',
      timing: '< 350ms',
      desc: 'Customer scans dynamic merchant QR standee. Selects pre-approved credit line in their UPI app, enters PIN, and departs with purchase immediately.',
      badge: 'OFFLINE COUNTER',
    },
    {
      id: 'dining',
      icon: Coffee,
      title: 'Dining & Cafes',
      subtitle: 'Instant Merchant Settlement',
      typicalSpend: '₹850',
      timing: '< 300ms',
      desc: 'Quick bill payment via Soundbox QR. Merchant receives immediate audio confirmation while credit line tracks the micro-drawdown in real time.',
      badge: 'F&B QUICK PAY',
    },
    {
      id: 'travel',
      icon: Plane,
      title: 'Travel & Mobility',
      subtitle: 'Ticket & Hotel Booking',
      typicalSpend: '₹14,500',
      timing: '< 450ms',
      desc: 'Higher-ticket flight or rail checkout via UPI collect or intent. Available line absorbs the larger draw without personal loan paperwork.',
      badge: 'TRAVEL CHECKOUT',
    },
    {
      id: 'online',
      icon: Globe,
      title: 'Digital E-Commerce',
      subtitle: 'In-App Payment Gateway',
      typicalSpend: '₹3,200',
      timing: '< 380ms',
      desc: 'Standard checkout screen on modern e-commerce apps. UPI credit line selected as payment method, eliminating card entry and OTP delays.',
      badge: 'IN-APP INTENT',
    },
    {
      id: 'utilities',
      icon: Zap,
      title: 'Bills & Utilities',
      subtitle: 'Recurring Mandate Debits',
      typicalSpend: '₹1,900',
      timing: 'Automated',
      desc: 'Monthly electricity, broadband, or mobile bills routed via UPI AutoPay against the credit line, preventing service disruptions.',
      badge: 'UPI AUTOPAY',
    },
    {
      id: 'grocery',
      icon: ShoppingCart,
      title: 'Daily Groceries',
      subtitle: 'Frequent Micro-Transactions',
      typicalSpend: '₹450',
      timing: '< 280ms',
      desc: 'High-frequency neighborhood supermarket payments. Aggregated into a single billing cycle statement instead of multiple bank debits.',
      badge: 'MICRO-CHECKOUT',
    },
  ];

  const currentScenario = SCENARIOS[selectedIdx];
  const Icon = currentScenario.icon;

  return (
    <section
      id="section-moments"
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-[180px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-16 relative z-10 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <span>OMNICHANNEL PAYMENT SCENARIOS</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#071A33] tracking-tight uppercase leading-[1.04]"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            ONE CREDIT LINE. <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
              MULTIPLE PAYMENT MOMENTS.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-normal leading-relaxed">
            The underlying credit line remains constant. The payment context adapts seamlessly.
          </p>
        </div>

        {/* ── SCENARIO SELECTOR CAROUSEL CHIPS ── */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
          {SCENARIOS.map((sc, idx) => {
            const isSelected = selectedIdx === idx;
            const ScIcon = sc.icon;

            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`px-4 py-2.5 rounded-full border text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#071A33] text-white border-[#071A33] shadow-md ring-2 ring-blue-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ScIcon className="w-3.5 h-3.5" />
                <span>{sc.title}</span>
              </button>
            );
          })}
        </div>

        {/* ── ACTIVE SCENE INSPECTION CARD ── */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#F8FAFC] border border-slate-200 shadow-md max-w-4xl mx-auto text-left relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Scenario Icon & Core Specs */}
            <div className="md:col-span-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#155EEF]">
                <Icon className="w-8 h-8" />
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded bg-blue-100 text-[#155EEF] font-mono text-[10px] font-bold uppercase">
                  {currentScenario.badge}
                </span>
                <h3 className="text-xl font-black text-[#071A33] uppercase mt-2">
                  {currentScenario.title}
                </h3>
                <div className="text-xs font-mono text-slate-500">
                  {currentScenario.subtitle}
                </div>
              </div>
            </div>

            {/* Description & Metrics */}
            <div className="md:col-span-8 space-y-6">
              <p className="text-sm text-slate-700 leading-relaxed">
                {currentScenario.desc}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                    TYPICAL TICKET SIZE
                  </div>
                  <div className="text-lg font-black font-mono text-[#071A33] mt-0.5">
                    {currentScenario.typicalSpend}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                    AUTHORIZATION SPEED
                  </div>
                  <div className="text-lg font-black font-mono text-emerald-600 mt-0.5">
                    {currentScenario.timing}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
