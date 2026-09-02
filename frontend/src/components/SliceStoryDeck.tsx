'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Gift,
  ChevronRight,
} from 'lucide-react';
import { Button } from './ui';

const STORIES = [
  {
    id: 1,
    tab: 'Instant 90s Cash',
    title: 'Instant cash in 90 seconds',
    tagline: 'No branch visits. No paperwork. Direct to your UPI or bank account.',
    bgImage: 'https://res.cloudinary.com/slicepay/image/upload/f_auto,c_limit,w_1920,q_auto/v1772173096/website/slice-bank/desktop-sparks-bg.webp',
    gradient: 'from-[#2b0844]/90 via-[#450177]/80 to-[#120024]/90',
    accentColor: '#d946ef',
    stat: '90s Disbursal',
    badge: '⚡ UPI Instant Rails',
    perk: '₹0 Processing Fee',
    highlight: 'Instant transfer to Google Pay, PhonePe, Paytm, or any bank account 24x7.',
  },
  {
    id: 2,
    tab: 'Split in 3 (0%)',
    title: 'Split into 3. Pay 0% extra.',
    tagline: 'Why pay monthly interest? Split your total amount across 3 months at 0% markup.',
    bgImage: 'https://res.cloudinary.com/slicepay/image/upload/f_auto,c_limit,w_1920,q_auto/v1771864263/website/slice-bank/desktop-slice-in-3-bg.webp',
    gradient: 'from-[#0b1f3a]/90 via-[#1e1b4b]/80 to-[#041c2c]/90',
    accentColor: '#2dd4bf',
    stat: '0% Interest',
    badge: '✨ Pure Flexibility',
    perk: '3 Equal Slices',
    highlight: 'Zero foreclosure charges and absolute freedom to prepay anytime at ₹0 penalty.',
  },
  {
    id: 3,
    tab: 'Cashback & Sparks',
    title: 'Instant rewards on every spend',
    tagline: 'Get new deals and real cashback on your favorite brands, straight to your wallet.',
    bgImage: 'https://res.cloudinary.com/slicepay/image/upload/f_auto,c_limit,w_1920,q_auto/v1772173096/website/slice-bank/desktop-rewards-bg.webp',
    gradient: 'from-[#1a0b2e]/90 via-[#311042]/80 to-[#0d0417]/90',
    accentColor: '#f59e0b',
    stat: 'Up to 3% Back',
    badge: '🎁 Weekly Sparks',
    perk: 'Direct to Bank',
    highlight: 'Unlock exclusive merchant discounts, credit score boosts, and instant cashback drops.',
  },
];

export function SliceStoryDeck() {
  const [activeStory, setActiveStory] = useState(0);
  const [progress, setProgress] = useState(0);

  // Smooth story auto-rotation timer
  useEffect(() => {
    const duration = 6000; // 6s per story
    const interval = 50; // update every 50ms
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStory((curr) => (curr + 1) % STORIES.length);
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [activeStory]);

  const current = STORIES[activeStory];

  const handleTabClick = (index: number) => {
    setActiveStory(index);
    setProgress(0);
  };

  return (
    <div className="relative mx-auto max-w-[1536px] px-4 sm:px-8 lg:px-12 xl:px-16 py-16">
      {/* Slice-style Story Canvas Frame */}
      <div
        className={`relative overflow-hidden rounded-[3rem] bg-gradient-to-br ${current.gradient} p-8 sm:p-16 text-white shadow-2xl transition-all duration-700 min-h-[520px] sm:min-h-[580px] flex flex-col justify-between border border-white/15`}
      >
        {/* Real High-Res Slice Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={current.bgImage}
            alt={current.title}
            className="h-full w-full object-cover object-center transition-opacity duration-1000 opacity-45 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/50" />
        </div>

        {/* Dynamic Fluid Glow Mesh */}
        <div
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full blur-3xl opacity-40 pointer-events-none transition-colors duration-1000"
          style={{ backgroundColor: current.accentColor }}
        />
        <div
          className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full blur-3xl opacity-40 pointer-events-none transition-colors duration-1000"
          style={{ backgroundColor: current.accentColor }}
        />

        {/* Top Story Content */}
        <div className="relative z-10 grid gap-10 lg:grid-cols-12 items-center">
          {/* Left Hero Text (8 cols) */}
          <div className="lg:col-span-8">
            <span
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest ring-1 ring-white/20 backdrop-blur-xl"
              style={{ color: current.accentColor }}
            >
              {current.badge}
            </span>

            <h2 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.08] animate-fade-up">
              {current.title}
            </h2>

            <p className="mt-5 max-w-2xl text-base sm:text-xl font-medium leading-relaxed text-white/80 animate-fade-up">
              {current.tagline}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/login">
                <Button className="px-8 py-4 text-base font-extrabold shadow-glow bg-white text-slate-950 hover:bg-slate-100">
                  Claim Your Line <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <span className="text-xs font-semibold text-white/60">
                {current.highlight}
              </span>
            </div>
          </div>

          {/* Right Frosted Glass Stat Card (4 cols) */}
          <div className="lg:col-span-4">
            <div className="rounded-[2.25rem] border border-white/20 bg-white/10 p-8 backdrop-blur-2xl shadow-2xl animate-fade-up">
              <p className="text-xs font-extrabold uppercase tracking-widest text-white/60">
                Core Feature Highlight
              </p>
              <p
                className="mt-3 text-4xl sm:text-5xl font-black text-white"
                style={{ color: current.accentColor }}
              >
                {current.stat}
              </p>
              <p className="mt-2 text-sm font-semibold text-white/90">
                {current.perk}
              </p>

              <div className="mt-6 border-t border-white/15 pt-5 space-y-2 text-xs text-white/70">
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>100% RBI Compliant NBFC Core</span>
                </p>
                <p className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span>Real-time NPCI Settlement</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Story Switcher Tabs with Animated Progress Bars */}
        <div className="relative z-10 mt-12 grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
          {STORIES.map((story, idx) => {
            const isCurrent = activeStory === idx;
            return (
              <button
                key={story.id}
                onClick={() => handleTabClick(idx)}
                className="flex flex-col items-start gap-2 text-left focus:outline-none group"
              >
                <span
                  className={`text-xs sm:text-sm font-extrabold tracking-wide transition-colors ${
                    isCurrent ? 'text-white' : 'text-white/40 group-hover:text-white/70'
                  }`}
                >
                  {story.tab}
                </span>

                {/* Progress Bar Track */}
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-75"
                    style={{
                      width: isCurrent ? `${progress}%` : activeStory > idx ? '100%' : '0%',
                      backgroundColor: isCurrent ? current.accentColor : '#ffffff',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
