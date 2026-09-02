'use client';

import React, { useState } from 'react';
import {
  User,
  Briefcase,
  GraduationCap,
  HeartPulse,
  ArrowRight,
  Zap,
  Check,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { TiltCard3D } from './TiltCard3D';

export type GoalType = 'personal' | 'business' | 'education' | 'medical';

interface GoalConfig {
  id: GoalType;
  title: string;
  badge: string;
  tagline: string;
  icon: React.ElementType;
  themeHex: string;
  glowColor: string;
  defaultAmount: number;
  amountRange: string;
  interestRate: string;
  tenureRange: string;
  speed: string;
  imageSrc: string;
  features: string[];
  story: {
    hero: string;
    persona: string;
    location: string;
    quote: string;
    amount: string;
    impact: string;
  };
}

const GOALS: Record<GoalType, GoalConfig> = {
  personal: {
    id: 'personal',
    title: 'Personal',
    badge: 'Lifestyle & Flexibility',
    tagline: 'Home improvements, travel expeditions, gadgets or rental deposits with 0% split options.',
    icon: User,
    themeHex: '#155EEF',
    glowColor: 'rgba(21, 94, 239, 0.12)',
    defaultAmount: 150000,
    amountRange: '₹25,000 to ₹5,00,000',
    interestRate: 'from 10.5% p.a.',
    tenureRange: '3 to 24 Months',
    speed: '⚡ 90s Instant UPI Disbursal',
    imageSrc: '/images/home_sketch.jpg',
    features: [
      'Split in 3 months @ 0% extra interest option',
      'No physical home visits or paperwork hassle',
      'Zero early prepayment foreclosure fees',
      'Direct payout to Google Pay or PhonePe',
    ],
    story: {
      hero: 'The moment keys met the lock.',
      persona: 'Sneha & Rohan Kulkarni',
      location: 'Baner, Pune',
      quote: 'We needed ₹2 Lakhs for modular kitchen cabinets. Adyapan allowed us to split the repayment in 3 interest-free tranches.',
      amount: '₹2,00,000',
      impact: 'Saved ₹18,400 in interest charges',
    },
  },
  business: {
    id: 'business',
    title: 'Business',
    badge: 'Merchant & SME Capital',
    tagline: 'Working capital, commercial inventory, POS hardware and equipment scaling without pledge.',
    icon: Briefcase,
    themeHex: '#155EEF',
    glowColor: 'rgba(21, 94, 239, 0.12)',
    defaultAmount: 500000,
    amountRange: '₹1,00,000 to ₹25,00,000',
    interestRate: 'from 11.25% p.a.',
    tenureRange: '6 to 36 Months',
    speed: '⚡ 4-Hour Express Sanction',
    imageSrc: '/images/business_sketch.jpg',
    features: [
      'Revolving line: Pay interest only on what you withdraw',
      'Instant GST and Current Account digital consent',
      'Top-up limits dynamically as you settle invoices',
      '₹0 prepayment penalty after first 30 days',
    ],
    story: {
      hero: 'The moment before the second kitchen opened.',
      persona: 'Aarav Mehta',
      location: 'Indiranagar, Bengaluru',
      quote: 'We had corporate orders booked but lacked ₹3.5L for blast chillers. Adyapan disbursed before our Monday morning rush.',
      amount: '₹3,50,000',
      impact: '+140% Monthly Revenue Growth',
    },
  },
  education: {
    id: 'education',
    title: 'Education',
    badge: 'Degrees & AI Upskilling',
    tagline: 'Pay semester tuition, global certification bootcamps, or entrance fees on student-friendly terms.',
    icon: GraduationCap,
    themeHex: '#155EEF',
    glowColor: 'rgba(21, 94, 239, 0.12)',
    defaultAmount: 120000,
    amountRange: '₹30,000 to ₹10,00,000',
    interestRate: 'from 9.75% p.a.',
    tenureRange: '6 to 24 Months',
    speed: '⚡ 60-Second Student Sanction',
    imageSrc: '/images/study_sketch.jpg',
    features: [
      'Subsidized 9.75% starting rate for accredited technical programs',
      'Moratorium option: Interest-only while completing coursework',
      'Direct institutional fee transfer with instant receipt',
      'Co-borrower flexibility (Parents, Self or Siblings)',
    ],
    story: {
      hero: 'The moment before the admission deadline.',
      persona: 'Devika Nair',
      location: 'HSR Layout, Bengaluru',
      quote: 'Getting into the Advanced AI Fellowship required tuition within 48 hours. Adyapan approved my profile with zero collateral.',
      amount: '₹1,20,000',
      impact: 'Promoted to Senior AI Engineer (+85% CTC)',
    },
  },
  medical: {
    id: 'medical',
    title: 'Medical',
    badge: 'Urgent Care & Safety Net',
    tagline: 'When life happens fast, money moves faster. Zero-friction hospital admission & diagnostic funding.',
    icon: HeartPulse,
    themeHex: '#155EEF',
    glowColor: 'rgba(21, 94, 239, 0.12)',
    defaultAmount: 80000,
    amountRange: '₹15,000 to ₹5,00,000',
    interestRate: 'from 11.0% p.a.',
    tenureRange: '3 to 18 Months',
    speed: '⚡ 90-Second 24/7 Automated Rail',
    imageSrc: '/images/emergency_sketch.jpg',
    features: [
      '24/7 automated disbursement — works at 2 AM and on bank holidays',
      'Direct instant UPI payout to hospital desk or family account',
      '100% paperless Aadhaar DigiLocker verification in 45 seconds',
      '30-day grace period on verified medical emergencies',
    ],
    story: {
      hero: 'The moment everything got back on track.',
      persona: 'Vikram Joshi',
      location: 'Cyber City, Gurugram',
      quote: 'My father needed unexpected cardiac diagnostics at 2 AM. In 90 seconds, ₹75,000 landed directly in my Google Pay.',
      amount: '₹75,000',
      impact: 'Emergency admission cleared in 84s',
    },
  },
};

interface Props {
  selectedGoal: GoalType;
  onSelectGoal: (goal: GoalType) => void;
}

export const GoalSelectorMatrix: React.FC<Props> = ({ selectedGoal, onSelectGoal }) => {
  const current = GOALS[selectedGoal];

  return (
    <section id="selector" className="relative py-28 bg-[#FFFFFF] text-[#071A33] overflow-hidden border-t border-[#D3E5FA]/60">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EAF4FF] border border-[#D3E5FA] text-xs font-mono text-[#155EEF] uppercase tracking-widest mb-4 font-bold">
            <span>CHAPTER 02 : CHOOSE YOUR MOVE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#071A33] mb-4">
            What are you moving forward with?
          </h2>
          <p className="text-[#526071] text-base sm:text-lg font-medium">
            Financing engineered around your specific intent, not arbitrary bank rules. Select your pathway below.
          </p>
        </div>

        {/* 4 Large Interactive 3D Tilt Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {(Object.keys(GOALS) as GoalType[]).map((key) => {
            const item = GOALS[key];
            const isSelected = selectedGoal === key;
            const Icon = item.icon;

            return (
              <TiltCard3D
                key={key}
                maxTilt={5}
                glowColor={item.glowColor}
                isActive={isSelected}
                onClick={() => onSelectGoal(key)}
                className={`cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? 'scale-[1.02] z-20 shadow-md'
                    : 'scale-100 opacity-90 hover:opacity-100'
                }`}
              >
                <div
                  className={`p-6 rounded-2xl border h-full flex flex-col justify-between transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#EAF4FF] border-[#155EEF] shadow-sm'
                      : 'bg-white border-[#D3E5FA] hover:border-[#155EEF]/50 hover:bg-[#EAF4FF]/30'
                  }`}
                >
                  {/* Top Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[#155EEF] text-white' : 'bg-[#EAF4FF] text-[#155EEF]'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    {isSelected ? (
                      <span className="text-xs font-mono font-bold text-[#155EEF] bg-white px-2.5 py-0.5 rounded-full border border-[#155EEF]/30">
                        Selected
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-[#526071]">Select →</span>
                    )}
                  </div>

                  {/* Title & Tagline */}
                  <div>
                    <h3 className="text-xl font-bold text-[#071A33] mb-1">{item.title}</h3>
                    <p className="text-xs text-[#526071] leading-relaxed font-medium line-clamp-2 mb-4">
                      {item.tagline}
                    </p>
                  </div>

                  {/* Bottom Stats Pill */}
                  <div className="pt-4 border-t border-[#D3E5FA] flex items-center justify-between text-xs">
                    <span className="font-mono text-[#526071] font-semibold">{item.interestRate}</span>
                    <span
                      className={`font-bold text-xs ${
                        isSelected ? 'text-[#155EEF]' : 'text-[#526071]'
                      }`}
                    >
                      {item.amountRange.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </TiltCard3D>
            );
          })}
        </div>

        {/* Expanded Dynamic Details Container */}
        <div className="rounded-3xl bg-white border border-[#D3E5FA] p-6 sm:p-10 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Hand-Drawn Sketched Visual */}
            <div className="lg:col-span-5">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-sm border border-[#D3E5FA] relative group bg-white">
                <img
                  src={current.imageSrc}
                  alt={current.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full text-white bg-[#155EEF] shadow-xs">
                    {current.badge}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Engineered Specs & Real Story */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#155EEF] font-bold mb-2">
                  <Zap className="w-4 h-4" />
                  <span>{current.speed}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-[#071A33] mb-2">
                  {current.title} Financing Framework
                </h3>
                <p className="text-[#526071] text-sm leading-relaxed mb-6 font-medium">
                  {current.tagline}
                </p>

                {/* Features list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {current.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#071A33] font-medium">
                      <div className="w-4 h-4 rounded-full bg-[#EAF4FF] text-[#155EEF] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Real story quote */}
                <div className="p-4 rounded-2xl bg-[#EAF4FF]/50 border border-[#D3E5FA] text-xs">
                  <div className="text-[#526071] italic mb-2">
                    &ldquo;{current.story.quote}&rdquo;
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#071A33] font-semibold">
                    <span>— {current.story.persona} ({current.story.location})</span>
                    <span className="text-[#155EEF] font-bold">{current.story.impact}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-[#D3E5FA] flex items-center justify-between flex-wrap gap-4">
                <div>
                  <span className="text-xs font-mono text-[#526071] block font-medium">Sanction Range</span>
                  <span className="text-lg font-black text-[#071A33] font-mono">{current.amountRange}</span>
                </div>

                <a
                  href="#calculator"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#155EEF] hover:bg-[#104ec8] transition-all shadow-md shadow-[#155EEF]/20"
                >
                  Configure {current.title} Amount
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
