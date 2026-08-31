'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
} from 'lucide-react';
import { TiltCard3D } from '../fintech/TiltCard3D';

export type GoalType = 'personal' | 'business' | 'education' | 'medical';

interface GoalConfig {
  id: GoalType;
  title: string;
  badge: string;
  tagline: string;
  icon: React.ElementType;
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
    amountRange: '₹25,000 to ₹5,00,000',
    interestRate: 'from 10.5% p.a.',
    tenureRange: '3 to 24 Months',
    speed: '⚡ 90s Instant UPI Disbursal',
    imageSrc: '/images/pathway_personal.jpg',
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
    amountRange: '₹1,00,000 to ₹25,00,000',
    interestRate: 'from 11.25% p.a.',
    tenureRange: '6 to 36 Months',
    speed: '⚡ 4-Hour Express Sanction',
    imageSrc: '/images/pathway_business.jpg',
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
    amountRange: '₹30,000 to ₹10,00,000',
    interestRate: 'from 9.75% p.a.',
    tenureRange: '6 to 24 Months',
    speed: '⚡ 60-Second Student Sanction',
    imageSrc: '/images/pathway_education.jpg',
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
    amountRange: '₹15,000 to ₹5,00,000',
    interestRate: 'from 11.0% p.a.',
    tenureRange: '3 to 18 Months',
    speed: '⚡ 90-Second 24/7 Automated Rail',
    imageSrc: '/images/pathway_medical.jpg',
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

export const MotionGoalSelector: React.FC<Props> = ({ selectedGoal, onSelectGoal }) => {
  const current = GOALS[selectedGoal];
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const detailContentRef = useRef<HTMLDivElement>(null);

  // Section entrance animation
  useEffect(() => {
    if (!sectionRef.current) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      // Header: staggered line reveal (each line drops independently)
      if (headerRef.current) {
        const lines = headerRef.current.querySelectorAll('[data-reveal-line]');
        gsap.set(lines, { opacity: 0, y: 40, rotateX: 12, transformOrigin: 'top center' });

        ScrollTrigger.create({
          trigger: headerRef.current,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            gsap.to(lines, {
              opacity: 1, y: 0, rotateX: 0,
              duration: 0.8, stagger: 0.15, ease: 'power3.out',
            });
          },
        });
      }

      // Cards: emerge from depth with slight random rotation
      if (cardsRef.current) {
        const cards = cardsRef.current.querySelectorAll('[data-goal-card]');
        cards.forEach((card, i) => {
          const rotations = [-3, 2, -2, 3];
          gsap.set(card, {
            opacity: 0, scale: 0.85, y: 50,
            rotateZ: rotations[i] || 0,
            filter: 'blur(6px)',
          });
        });

        ScrollTrigger.create({
          trigger: cardsRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(cards, {
              opacity: 1, scale: 1, y: 0, rotateZ: 0, filter: 'blur(0px)',
              duration: 0.8, stagger: 0.1, ease: 'back.out(1.3)',
            });
          },
        });
      }

      // Detail panel
      if (detailRef.current) {
        gsap.set(detailRef.current, { opacity: 0, y: 40, scale: 0.96 });

        ScrollTrigger.create({
          trigger: detailRef.current,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            gsap.to(detailRef.current, {
              opacity: 1, y: 0, scale: 1,
              duration: 0.85, ease: 'power3.out',
            });
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Category switch with EXIT → TRANSITION → ENTER
  const handleGoalSwitch = (goal: GoalType) => {
    if (goal === selectedGoal) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      onSelectGoal(goal);
      return;
    }

    if (detailContentRef.current) {
      gsap.to(detailContentRef.current, {
        opacity: 0, y: -20, filter: 'blur(3px)',
        duration: 0.22, ease: 'power2.in',
        onComplete: () => {
          onSelectGoal(goal);
          if (detailContentRef.current) {
            gsap.fromTo(
              detailContentRef.current,
              { opacity: 0, y: 24, filter: 'blur(3px)' },
              { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.4, ease: 'power3.out' }
            );
          }
        },
      });
    } else {
      onSelectGoal(goal);
    }
  };

  return (
    <section
      id="selector"
      ref={sectionRef}
      className="relative py-24 bg-[#FFFFFF] text-[#071A33] overflow-hidden border-t border-[#D3E5FA]"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-14">
          <div data-reveal-line className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EAF4FF] border border-[#D3E5FA] text-xs font-mono text-[#155EEF] uppercase tracking-widest mb-3 font-bold">
            <span>CHAPTER 02 : CHOOSE YOUR MOVE</span>
          </div>

          <h2 data-reveal-line className="text-3xl sm:text-5xl font-black tracking-tight text-[#071A33] mb-3">
            What are you moving forward with?
          </h2>

          <p data-reveal-line className="text-[#526071] text-base sm:text-lg font-medium">
            Financing engineered around your specific intent, not arbitrary bank rules. Select your pathway below.
          </p>
        </div>

        {/* 4 Interactive Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {(Object.keys(GOALS) as GoalType[]).map((key, idx) => {
            const item = GOALS[key];
            const isSelected = selectedGoal === key;
            const Icon = item.icon;

            return (
              <div
                key={key}
                data-goal-card
                onClick={() => handleGoalSwitch(key)}
                className={`cursor-pointer transition-all duration-400 ${
                  isSelected ? 'scale-[1.03] z-10' : 'hover:scale-[1.01]'
                }`}
                style={{
                  // Non-selected cards compress backward
                  transform: !isSelected && selectedGoal !== key ? undefined : undefined,
                  opacity: !isSelected ? 0.85 : 1,
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <TiltCard3D maxTilt={5} isActive={isSelected} className="h-full">
                  <div
                    className={`p-6 rounded-2xl border h-full flex flex-col justify-between transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#EAF4FF] border-[#155EEF] shadow-sm ring-2 ring-[#155EEF]'
                        : 'bg-white border-[#D3E5FA] hover:border-[#155EEF]/50 hover:bg-[#EAF4FF]/25'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isSelected
                            ? 'bg-[#155EEF] text-white shadow-xs scale-110'
                            : 'bg-[#EAF4FF] text-[#155EEF]'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      {isSelected ? (
                        <span className="text-xs font-mono font-bold text-[#155EEF] bg-white px-2.5 py-0.5 rounded-full border border-[#155EEF]/30">
                          ● Active Path
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

                    {/* Bottom Stats */}
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
              </div>
            );
          })}
        </div>

        {/* Dynamic Details */}
        <div ref={detailRef}>
          <div className="rounded-3xl bg-white border border-[#D3E5FA] p-6 sm:p-10 shadow-lg min-h-[380px]">
            <div ref={detailContentRef} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full">
              {/* Left: Sketched Artwork */}
              <div className="lg:col-span-5">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-sm border border-[#D3E5FA] relative group bg-white">
                  <img
                    src={current.imageSrc}
                    alt={current.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full text-white bg-[#155EEF] shadow-xs">
                      {current.badge}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Specs & Real Impact */}
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
                    {current.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-[#071A33] font-medium">
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
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#155EEF] hover:bg-[#104ec8] transition-all shadow-md shadow-[#155EEF]/20 active:scale-95"
                  >
                    Configure {current.title} Amount
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
