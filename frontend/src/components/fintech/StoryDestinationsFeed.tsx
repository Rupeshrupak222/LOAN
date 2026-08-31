'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Sparkles,
} from 'lucide-react';

const REAL_STORIES = [
  {
    name: 'Aarav Mehta',
    city: 'Bengaluru, Karnataka',
    category: 'Business & Merchant',
    imageSrc: '/images/business_sketch.jpg',
    amount: '₹3,50,000',
    timeToDisburse: '88 Seconds',
    rating: 5,
    quote:
      'We had a corporate catering order for 600 people on Monday. Needed quick capital for industrial chillers on Friday night. Adyapan disbursed in under 2 minutes.',
    result: 'Tripled monthly catering pipeline',
  },
  {
    name: 'Devika Nair',
    city: 'HSR Layout, Bengaluru',
    category: 'Study & Upskilling',
    imageSrc: '/images/study_sketch.jpg',
    amount: '₹1,20,000',
    timeToDisburse: '64 Seconds',
    rating: 5,
    quote:
      'The deadline for my AI Fellowship enrollment was midnight. Traditional student loans asked for parents\' 3-year ITRs. Adyapan verified my DigiLocker and paid the institute instantly.',
    result: 'Promoted to Senior AI Engineer',
  },
  {
    name: 'Sneha & Rohan Kulkarni',
    city: 'Pune, Maharashtra',
    category: 'Home Improvement',
    imageSrc: '/images/home_sketch.jpg',
    amount: '₹2,00,000',
    timeToDisburse: '95 Seconds',
    rating: 5,
    quote:
      'Our new rental apartment in Baner required a sudden security deposit plus modular cabinets. We split the entire amount into 3 interest-free payments without touching our emergency FD.',
    result: 'Moved in 2 weeks ahead of schedule',
  },
  {
    name: 'Vikram Joshi',
    city: 'Cyber City, Gurugram',
    category: 'Medical Emergency',
    imageSrc: '/images/emergency_sketch.jpg',
    amount: '₹75,000',
    timeToDisburse: '84 Seconds',
    rating: 5,
    quote:
      'When you are at the hospital admissions desk at 2 AM, you do not have time for paperwork. Adyapan transferred straight into my Google Pay in 84 seconds. Truly life-saving.',
    result: 'Admission cleared immediately',
  },
];

const RECENT_PULSES = [
  { city: 'Bengaluru', amount: '₹1,50,000', purpose: 'Education Tech Bootcamp', time: '18s ago' },
  { city: 'Mumbai', amount: '₹4,00,000', purpose: 'Merchant Retail Inventory', time: '42s ago' },
  { city: 'Pune', amount: '₹85,000', purpose: 'Modular Kitchen Upgrade', time: '1m ago' },
  { city: 'Gurugram', amount: '₹60,000', purpose: 'Emergency Medical Buffer', time: '2m ago' },
  { city: 'Hyderabad', amount: '₹2,20,000', purpose: 'B2B Client Invoice Bridging', time: '3m ago' },
];

export const StoryDestinationsFeed: React.FC = () => {
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const storyCardRef = useRef<HTMLDivElement>(null);
  const storyContentRef = useRef<HTMLDivElement>(null);

  const prevStory = () => {
    const newIdx = activeStoryIdx === 0 ? REAL_STORIES.length - 1 : activeStoryIdx - 1;
    animateStorySwitch(newIdx, 'prev');
  };

  const nextStory = () => {
    const newIdx = activeStoryIdx === REAL_STORIES.length - 1 ? 0 : activeStoryIdx + 1;
    animateStorySwitch(newIdx, 'next');
  };

  const animateStorySwitch = (newIdx: number, direction: 'next' | 'prev') => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setActiveStoryIdx(newIdx);
      return;
    }

    if (storyContentRef.current) {
      const exitX = direction === 'next' ? -30 : 30;
      const enterX = direction === 'next' ? 30 : -30;

      gsap.to(storyContentRef.current, {
        opacity: 0, x: exitX,
        duration: 0.2, ease: 'power2.in',
        onComplete: () => {
          setActiveStoryIdx(newIdx);
          if (storyContentRef.current) {
            gsap.fromTo(
              storyContentRef.current,
              { opacity: 0, x: enterX },
              { opacity: 1, x: 0, duration: 0.35, ease: 'power3.out' }
            );
          }
        },
      });
    } else {
      setActiveStoryIdx(newIdx);
    }
  };

  const story = REAL_STORIES[activeStoryIdx];

  useEffect(() => {
    if (!sectionRef.current) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      // Header fade up
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

      // Ticker: slides in from right
      if (tickerRef.current) {
        gsap.set(tickerRef.current, { opacity: 0, x: 80 });
        ScrollTrigger.create({
          trigger: tickerRef.current,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            gsap.to(tickerRef.current, {
              opacity: 1, x: 0,
              duration: 0.9, ease: 'power3.out',
            });
          },
        });
      }

      // Story card: diagonal clip-path reveal
      if (storyCardRef.current) {
        gsap.set(storyCardRef.current, { opacity: 0, y: 50, scale: 0.96 });
        ScrollTrigger.create({
          trigger: storyCardRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(storyCardRef.current, {
              opacity: 1, y: 0, scale: 1,
              duration: 0.9, ease: 'power3.out',
            });
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-28 bg-[#EAF4FF]/50 text-[#071A33] overflow-hidden border-t border-[#D3E5FA]/60"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-14">
          <div data-reveal className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#D3E5FA] text-xs font-mono text-[#155EEF] uppercase tracking-widest mb-4 font-bold shadow-2xs">
            <span>CHAPTER 06 : INDIA IN MOTION</span>
          </div>

          <h2 data-reveal className="text-3xl sm:text-5xl font-black tracking-tight text-[#071A33] mb-4">
            Real people.{' '}
            <span className="text-[#155EEF]">
              Real destinations reached.
            </span>
          </h2>

          <p data-reveal className="text-[#526071] text-base sm:text-lg font-medium">
            Over 120,000 ambitious individuals, entrepreneurs, and families across India give their money the right direction every single day.
          </p>
        </div>

        {/* Live Momentum Disbursement Ticker — Auto-scrolling marquee */}
        <div ref={tickerRef} className="mb-12 p-3 sm:p-4 rounded-2xl bg-white border border-[#D3E5FA] overflow-hidden shadow-xs">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#EAF4FF] border border-[#D3E5FA] text-[#155EEF] text-xs font-mono font-bold flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#155EEF] animate-ping" />
              <span>LIVE DISBURSEMENTS</span>
            </div>

            <div className="overflow-hidden flex-1 relative">
              <div className="flex items-center gap-3 animate-marquee whitespace-nowrap">
                {/* Double the items for seamless loop */}
                {[...RECENT_PULSES, ...RECENT_PULSES].map((pulse, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-[#526071] bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 flex-shrink-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#155EEF]" />
                    <span className="font-bold text-[#071A33]">{pulse.city}</span>
                    <span className="font-mono text-[#155EEF] font-bold">{pulse.amount}</span>
                    <span className="text-[#526071] font-medium">({pulse.purpose})</span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">• {pulse.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Big Spotlight Story Card */}
        <div ref={storyCardRef} className="rounded-3xl bg-white border border-[#D3E5FA] p-6 sm:p-10 shadow-md relative overflow-hidden">
          <div ref={storyContentRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Sketched Visual */}
            <div className="lg:col-span-4">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-sm border border-[#D3E5FA] bg-white">
                <img
                  src={story.imageSrc}
                  alt={story.name}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>

            {/* Middle & Right: Story Content */}
            <div className="lg:col-span-8 flex flex-col justify-between h-full space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex text-[#F5B942] gap-1">
                    {[...Array(story.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs font-mono text-[#526071] font-bold">
                    Verified Borrower Story
                  </span>
                </div>

                <blockquote className="text-lg sm:text-2xl font-medium text-[#071A33] leading-relaxed mb-6 italic">
                  &ldquo;{story.quote}&rdquo;
                </blockquote>

                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <div className="font-bold text-[#071A33] text-base">
                      {story.name}
                    </div>
                    <div className="text-xs text-[#526071] font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#155EEF]" />
                      {story.city}
                    </div>
                  </div>

                  <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                  <div>
                    <div className="text-xs font-mono text-[#526071] uppercase font-bold">
                      Disbursal Speed
                    </div>
                    <div className="text-sm font-bold text-[#155EEF] font-mono">
                      ⚡ {story.timeToDisburse}
                    </div>
                  </div>

                  <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                  <div>
                    <div className="text-xs font-mono text-[#526071] uppercase font-bold">
                      Impact
                    </div>
                    <div className="text-sm font-bold text-[#071A33]">
                      {story.result}
                    </div>
                  </div>
                </div>
              </div>

              {/* Slider Controls & Funded Amount */}
              <div className="flex items-center justify-between pt-4 border-t border-[#D3E5FA] flex-wrap gap-4">
                <div>
                  <span className="text-xs font-mono text-[#526071] uppercase font-bold block">
                    Sanctioned Line:
                  </span>
                  <span className="text-2xl font-black font-mono text-[#155EEF]">
                    {story.amount}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={prevStory}
                    className="p-3 rounded-xl bg-[#EAF4FF] hover:bg-[#D3E5FA] border border-[#D3E5FA] text-[#071A33] transition-colors cursor-pointer active:scale-95"
                    aria-label="Previous Story"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-mono text-[#526071] font-bold">
                    {activeStoryIdx + 1} / {REAL_STORIES.length}
                  </span>
                  <button
                    onClick={nextStory}
                    className="p-3 rounded-xl bg-[#EAF4FF] hover:bg-[#D3E5FA] border border-[#D3E5FA] text-[#071A33] transition-colors cursor-pointer active:scale-95"
                    aria-label="Next Story"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
