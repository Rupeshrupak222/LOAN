'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Compass,
  FileCheck,
  Calculator,
  ShieldCheck,
  Rocket,
  ArrowRight,
  Zap,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const SCENES = [
  {
    id: 1,
    title: 'Tell us what you need.',
    tag: 'STAGE 01 / INTENT',
    subtitle: 'From restaurant inventories to tech fellowships',
    desc: 'Whether scaling a restaurant cloud kitchen, paying semester tuition, or renovating your family home, your intent drives our underwriting. No tedious paperwork or branch visits.',
    icon: Compass,
    metric: 'Instant Digital Intent Check',
    imageSrc: '/images/business_sketch.jpg',
    story: '"We needed ₹3.5L for blast chillers before our Monday morning rush. Adyapan understood our business immediately."',
    persona: 'Aarav Mehta • Indiranagar, Bengaluru',
    highlight: '4-Hour Sanction',
  },
  {
    id: 2,
    title: 'Choose your path & terms.',
    tag: 'STAGE 02 / STRUCTURE',
    subtitle: 'Flexible tenures or 0% interest 3-month split',
    desc: 'Select tailored terms from 3 to 36 months, or choose our flagship 0% interest 3-month split option. Every term is crystal clear before you commit.',
    icon: FileCheck,
    metric: '0% Split or Flexible Monthly EMI',
    imageSrc: '/images/home_sketch.jpg',
    story: '"We split our rental deposit and modular kitchen across 3 interest-free payments without touching our emergency savings."',
    persona: 'Sneha & Rohan Kulkarni • Baner, Pune',
    highlight: '₹0 Hidden Foreclosure',
  },
  {
    id: 3,
    title: 'Understand your numbers.',
    tag: 'STAGE 03 / TRANSPARENCY',
    subtitle: '100% reducing balance math with zero fine print',
    desc: 'Every single rupee is accounted for in real-time. Zero hidden processing deductions, zero prepayment penalties, and no unexpected compounding.',
    icon: Calculator,
    metric: 'Reducing Balance Calculation',
    imageSrc: '/images/study_sketch.jpg',
    story: '"Adyapan displayed the exact monthly commitment and processing fee upfront. Zero surprise charges."',
    persona: 'Devika Nair • HSR Layout, Bengaluru',
    highlight: '100% Fee Transparency',
  },
  {
    id: 4,
    title: 'Instant e-KYC & Underwriting in 60s.',
    tag: 'STAGE 04 / VERIFICATION',
    subtitle: 'Direct DigiLocker & Account Aggregator consent',
    desc: 'Zero photocopies. Instant Aadhaar & PAN verification with bank-grade 256-bit encryption. Check your pre-approved limit without impacting your CIBIL credit score.',
    icon: ShieldCheck,
    metric: 'Zero Impact on Credit Score',
    imageSrc: '/images/emergency_sketch.jpg',
    story: '"At 2 AM when my father needed medical tests, DigiLocker verified my profile in 45 seconds."',
    persona: 'Vikram Joshi • Cyber City, Gurugram',
    highlight: '256-Bit SSL Encrypted',
  },
  {
    id: 5,
    title: 'Move forward with capital in 90s.',
    tag: 'STAGE 05 / MOMENTUM',
    subtitle: 'Direct UPI & Bank Rail settlement',
    desc: 'Approved funds transfer straight into your Google Pay, PhonePe, or Primary Bank Account in 90 seconds flat. Turn your ambitious plans into immediate reality.',
    icon: Rocket,
    metric: '⚡ 90s Instant UPI Disbursal',
    imageSrc: '/images/hero_journey_sketch.jpg',
    story: '"From application to money in our account, it took less than 2 minutes total. Truly transformative."',
    persona: 'Tanya Sengupta • Mumbai, Maharashtra',
    highlight: 'Instant Bank Credit',
  },
];

export const StoryRoadmapArc: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const storyCardRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentScene = SCENES[activeIdx];
  const Icon = currentScene.icon;

  // Section entrance animation
  useEffect(() => {
    if (!sectionRef.current) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      // Header: horizontal clip-path wipe left → right
      if (headerRef.current) {
        const headerEls = headerRef.current.querySelectorAll('[data-reveal]');
        gsap.set(headerEls, { opacity: 0, y: 36, filter: 'blur(6px)' });

        ScrollTrigger.create({
          trigger: headerRef.current,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            gsap.to(headerEls, {
              opacity: 1, y: 0, filter: 'blur(0px)',
              duration: 0.8, stagger: 0.12, ease: 'power3.out',
            });
          },
        });
      }

      // Tabs: stagger from depth with blur
      if (tabsRef.current) {
        const tabs = tabsRef.current.querySelectorAll('[data-tab]');
        gsap.set(tabs, { opacity: 0, scale: 0.88, y: 30, filter: 'blur(8px)' });

        ScrollTrigger.create({
          trigger: tabsRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(tabs, {
              opacity: 1, scale: 1, y: 0, filter: 'blur(0px)',
              duration: 0.75, stagger: 0.08, ease: 'back.out(1.4)',
            });
          },
        });
      }

      // Story card: horizontal split-open from center (clip-path)
      if (storyCardRef.current) {
        gsap.set(storyCardRef.current, {
          opacity: 0, scale: 0.94, y: 40,
        });

        ScrollTrigger.create({
          trigger: storyCardRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(storyCardRef.current, {
              opacity: 1, scale: 1, y: 0,
              duration: 0.9, ease: 'power3.out',
            });
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Tab switch transition
  const handleTabSwitch = (idx: number) => {
    if (idx === activeIdx || !contentRef.current) {
      setActiveIdx(idx);
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setActiveIdx(idx);
      return;
    }

    // EXIT current content
    gsap.to(contentRef.current, {
      opacity: 0,
      x: idx > activeIdx ? -30 : 30,
      filter: 'blur(4px)',
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        setActiveIdx(idx);
        // ENTER new content
        if (contentRef.current) {
          gsap.fromTo(
            contentRef.current,
            { opacity: 0, x: idx > activeIdx ? 30 : -30, filter: 'blur(4px)' },
            { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.4, ease: 'power3.out' }
          );
        }
      },
    });
  };

  return (
    <section
      id="story-scene"
      ref={sectionRef}
      className="relative py-24 bg-[#FFFFFF] text-[#071A33] overflow-hidden border-t border-[#D3E5FA]"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-14">
          <div data-reveal className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EAF4FF] border border-[#D3E5FA] text-xs font-mono text-[#155EEF] uppercase tracking-widest mb-3 font-bold">
            <span>CHAPTER 01 : HOW YOUR MONEY MOVES</span>
          </div>

          <h2 data-reveal className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight mb-3">
            The narrative of your next move.
          </h2>

          <p data-reveal className="text-[#526071] text-base sm:text-lg font-medium">
            From the first spark of intent to money in your account in under 3 minutes. Experience each stage of the journey below.
          </p>
        </div>

        {/* 5-Step Interactive Milestone Selector Tabs */}
        <div ref={tabsRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          {SCENES.map((scene, idx) => {
            const isSelected = activeIdx === idx;

            return (
              <button
                key={scene.id}
                data-tab
                onClick={() => handleTabSwitch(idx)}
                className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#EAF4FF] border-[#155EEF] shadow-sm scale-102 ring-2 ring-[#155EEF]'
                    : 'bg-white border-[#D3E5FA] hover:border-[#155EEF]/50 hover:bg-[#EAF4FF]/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs transition-transform ${
                      isSelected ? 'bg-[#155EEF] text-white scale-110' : 'bg-[#EAF4FF] text-[#155EEF]'
                    }`}
                  >
                    0{scene.id}
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-white text-[#155EEF]' : 'text-[#526071]'
                    }`}
                  >
                    {isSelected ? '● Active' : 'View'}
                  </span>
                </div>
                <div className="font-bold text-sm text-[#071A33] line-clamp-1">{scene.title}</div>
                <div className="text-[11px] text-[#526071] font-medium mt-0.5">{scene.highlight}</div>
              </button>
            );
          })}
        </div>

        {/* Progress bar beneath tabs */}
        <div className="relative h-1 rounded-full bg-[#D3E5FA]/50 mb-10 overflow-hidden">
          <div
            ref={progressRef}
            className="absolute top-0 left-0 h-full rounded-full bg-[#155EEF] transition-all duration-500 ease-out"
            style={{ width: `${((activeIdx + 1) / SCENES.length) * 100}%` }}
          />
        </div>

        {/* Rich Interactive Story Card */}
        <div ref={storyCardRef}>
          <div className="rounded-3xl bg-white border border-[#D3E5FA] p-6 sm:p-10 shadow-lg min-h-[400px]">
            <div ref={contentRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left: Sketched Artwork & Borrower Story */}
              <div className="lg:col-span-5">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-sm border border-[#D3E5FA] relative group bg-white mb-4">
                  <img
                    src={currentScene.imageSrc}
                    alt={currentScene.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full text-white bg-[#155EEF] shadow-xs">
                      {currentScene.tag}
                    </span>
                  </div>
                </div>

                {/* Borrower Persona Quote */}
                <div className="p-4 rounded-2xl bg-[#EAF4FF]/50 border border-[#D3E5FA] text-xs">
                  <div className="text-[#526071] italic mb-1.5 font-medium">
                    {currentScene.story}
                  </div>
                  <div className="font-mono text-[11px] text-[#071A33] font-bold">
                    — {currentScene.persona}
                  </div>
                </div>
              </div>

              {/* Right: Narrative Stage Details */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#155EEF] font-bold mb-2">
                    <Icon className="w-4 h-4" />
                    <span>{currentScene.metric}</span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-black text-[#071A33] tracking-tight mb-1">
                    {currentScene.title}
                  </h3>

                  <div className="text-sm font-semibold text-[#155EEF] mb-4">
                    {currentScene.subtitle}
                  </div>

                  <p className="text-[#526071] text-base leading-relaxed font-normal mb-6">
                    {currentScene.desc}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#D3E5FA]">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#071A33]">
                      <CheckCircle2 className="w-4 h-4 text-[#155EEF]" />
                      <span>100% RBI Compliant Underwriting</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#071A33]">
                      <CheckCircle2 className="w-4 h-4 text-[#155EEF]" />
                      <span>Direct NPCI & e-NACH Rail</span>
                    </div>
                  </div>
                </div>

                {/* Navigation CTA */}
                <div className="pt-6 border-t border-[#D3E5FA] flex items-center justify-between flex-wrap gap-4">
                  <div className="text-xs font-mono text-[#526071]">
                    Stage <strong className="text-[#071A33] font-bold">0{activeIdx + 1}</strong> of <strong className="text-[#071A33] font-bold">05</strong>
                  </div>

                  <div className="flex items-center gap-3">
                    {activeIdx > 0 && (
                      <button
                        onClick={() => handleTabSwitch(activeIdx - 1)}
                        className="px-4 py-2 rounded-xl border border-[#D3E5FA] text-xs font-bold text-[#071A33] hover:bg-[#EAF4FF] transition-colors cursor-pointer"
                      >
                        ← Previous
                      </button>
                    )}
                    {activeIdx < SCENES.length - 1 ? (
                      <button
                        onClick={() => handleTabSwitch(activeIdx + 1)}
                        className="px-5 py-2 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>Next: {SCENES[activeIdx + 1].tag.split(' / ')[1]}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <a
                        href="#selector"
                        className="px-5 py-2 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                      >
                        <span>Choose Your Move →</span>
                      </a>
                    )}
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
