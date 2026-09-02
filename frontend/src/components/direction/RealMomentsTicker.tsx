'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  MapPin,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { DirectionId, DIRECTIONS } from './directionData';

interface Props {
  activeDirection: DirectionId;
}

const REAL_STORIES = [
  {
    name: 'Aarav Mehta',
    city: 'Bengaluru, Karnataka',
    category: 'Business & Merchant',
    directionId: 'business',
    imageSrc: '/images/business_sketch.jpg',
    amount: '₹3,50,000',
    timeToDisburse: '88 Seconds',
    rating: 5,
    quote:
      'We had a massive corporate catering order for 600 people on Monday morning. Needed quick capital for industrial chillers and fresh supplies on Friday night. Adyapan disbursed in under 2 minutes.',
    result: 'Tripled monthly catering pipeline',
  },
  {
    name: 'Devika Nair',
    city: 'HSR Layout, Bengaluru',
    category: 'Study & Upskilling',
    directionId: 'study',
    imageSrc: '/images/study_sketch.jpg',
    amount: '₹1,20,000',
    timeToDisburse: '64 Seconds',
    rating: 5,
    quote:
      'The deadline for my AI Fellowship enrollment was midnight. Traditional student loans asked for parents’ 3-year ITRs. Adyapan verified my DigiLocker and paid the institute instantly.',
    result: 'Promoted to Senior AI Engineer',
  },
  {
    name: 'Sneha & Rohan Kulkarni',
    city: 'Pune, Maharashtra',
    category: 'Home Improvement',
    directionId: 'home',
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
    directionId: 'emergency',
    imageSrc: '/images/emergency_sketch.jpg',
    amount: '₹75,000',
    timeToDisburse: '84 Seconds',
    rating: 5,
    quote:
      'When you are at the hospital admissions desk at 2 AM, you do not have time for paperwork. Adyapan transferred straight into my Google Pay in 84 seconds. Truly life-saving.',
    result: 'Admission cleared immediately',
  },
  {
    name: 'Tanya Sengupta',
    city: 'Bandra West, Mumbai',
    category: 'Make Something Happen',
    directionId: 'create',
    imageSrc: '/images/create_sketch.jpg',
    amount: '₹90,000',
    timeToDisburse: '72 Seconds',
    rating: 5,
    quote:
      'Secured a documentary shoot in Spiti Valley but needed specialized cinema gear and winter drone batteries. Adyapan’s flexible repayment tenure gave me complete freedom.',
    result: 'Docuseries picked up by major OTT',
  },
];

const RECENT_PULSES = [
  { city: 'Bengaluru', amount: '₹1,50,000', purpose: 'Education Tech Bootcamp', time: '18s ago' },
  { city: 'Mumbai', amount: '₹4,00,000', purpose: 'Merchant Retail Inventory', time: '42s ago' },
  { city: 'Pune', amount: '₹85,000', purpose: 'Modular Kitchen Upgrade', time: '1m ago' },
  { city: 'Gurugram', amount: '₹60,000', purpose: 'Emergency Medical Buffer', time: '2m ago' },
  { city: 'Hyderabad', amount: '₹2,20,000', purpose: 'B2B Client Invoice Bridging', time: '3m ago' },
];

export const RealMomentsTicker: React.FC<Props> = ({ activeDirection }) => {
  const current = DIRECTIONS[activeDirection];
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);

  const prevStory = () => {
    setActiveStoryIdx((prev) => (prev === 0 ? REAL_STORIES.length - 1 : prev - 1));
  };

  const nextStory = () => {
    setActiveStoryIdx((prev) => (prev === REAL_STORIES.length - 1 ? 0 : prev + 1));
  };

  const story = REAL_STORIES[activeStoryIdx];

  return (
    <section className="relative py-24 bg-[#ffffff] text-slate-900 overflow-hidden border-t border-slate-200/80">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[160px] opacity-10 transition-all duration-700"
          style={{ backgroundColor: current.accentHex }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-mono text-indigo-700 uppercase tracking-widest mb-4 font-bold">
            <span>CHAPTER 06 : INDIA IN MOTION</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
            Real people.{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: `linear-gradient(135deg, ${current.accentHex} 0%, #4f46e5 100%)`,
              }}
            >
              Real destinations reached.
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium">
            Over 120,000 ambitious individuals, entrepreneurs, and families across India give their money the right direction every single day.
          </p>
        </div>

        {/* Live Momentum Disbursement Ticker */}
        <div className="mb-12 p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span>LIVE DISBURSEMENTS</span>
            </div>

            {RECENT_PULSES.map((pulse, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 flex-shrink-0 shadow-xs"
              >
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-bold text-slate-900">{pulse.city}</span>
                <span className="font-mono text-emerald-600 font-bold">{pulse.amount}</span>
                <span className="text-slate-500 font-medium">({pulse.purpose})</span>
                <span className="text-[10px] font-mono text-slate-400 font-semibold">• {pulse.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Big Spotlight Story Card with Sketched Visual */}
        <div className="rounded-3xl bg-slate-50 border border-slate-200 p-6 sm:p-10 shadow-card relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Sketched Visual */}
            <div className="lg:col-span-4">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white">
                <img
                  src={story.imageSrc}
                  alt={story.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Middle & Right: Story Content */}
            <div className="lg:col-span-8 flex flex-col justify-between h-full space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex text-amber-500 gap-1">
                    {[...Array(story.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs font-mono text-slate-500 font-bold">
                    Verified Borrower Story
                  </span>
                </div>

                <blockquote className="text-lg sm:text-xl font-medium text-slate-800 leading-relaxed mb-6 italic">
                  &ldquo;{story.quote}&rdquo;
                </blockquote>

                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <div className="font-bold text-slate-900 text-base">
                      {story.name}
                    </div>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      {story.city}
                    </div>
                  </div>

                  <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                  <div>
                    <div className="text-xs font-mono text-slate-500 uppercase font-bold">
                      Disbursal Speed
                    </div>
                    <div className="text-sm font-bold text-emerald-700 font-mono">
                      ⚡ {story.timeToDisburse}
                    </div>
                  </div>

                  <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                  <div>
                    <div className="text-xs font-mono text-slate-500 uppercase font-bold">
                      Impact
                    </div>
                    <div className="text-sm font-bold text-indigo-700">
                      {story.result}
                    </div>
                  </div>
                </div>
              </div>

              {/* Slider Controls & Funded Amount */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 flex-wrap gap-4">
                <div>
                  <span className="text-xs font-mono text-slate-500 uppercase font-bold block">
                    Funded Amount:
                  </span>
                  <span
                    className="text-2xl font-black font-mono"
                    style={{ color: current.accentHex }}
                  >
                    {story.amount}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={prevStory}
                    className="p-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors shadow-xs"
                    aria-label="Previous Story"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-mono text-slate-500 font-bold">
                    {activeStoryIdx + 1} / {REAL_STORIES.length}
                  </span>
                  <button
                    onClick={nextStory}
                    className="p-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors shadow-xs"
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
