'use client';

import React, { useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle2, User, Zap, Heart } from 'lucide-react';
import { TiltCard } from './TiltCard';

const TESTIMONIALS = [
  {
    quote:
      'I needed ₹35,000 urgently for an unexpected hospital bill at 11 PM. I signed up, scanned my Aadhaar, and the money was in my Google Pay account in literally under 2 minutes. Slice-like speed, zero judgment, and crystal clear repayment terms!',
    author: 'Aakash Mehra',
    role: 'Product Designer',
    city: 'Bengaluru',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    metrics: { stat: '1.4 Min', label: 'Disbursal to UPI' },
    rating: 5,
    tag: '⚡ Instant Emergency Cash',
  },
  {
    quote:
      'As a freelance developer, traditional banks kept rejecting my loan requests due to lack of standard salary slips. Adyapan verified my bank statement automatically, gave me an instant ₹1.5 Lakh limit, and let me split my new MacBook cost in 3 no-cost installments.',
    author: 'Sneha Kulkarni',
    role: 'Fullstack Freelancer',
    city: 'Pune',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    metrics: { stat: '₹1.5 Lakh', label: 'Approved Limit' },
    rating: 5,
    tag: '💻 No-Salary Slip Friction',
  },
  {
    quote:
      'What I love most is the complete transparency. No shady processing fees deducted upfront, no spam calls, and no penalty when I paid off my loan 2 months early. This is how modern lending in India should always work.',
    author: 'Tanmay Saxena',
    role: 'Digital Marketer & Creator',
    city: 'New Delhi',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    metrics: { stat: '₹0', label: 'Hidden Charges' },
    rating: 5,
    tag: '✨ 100% Transparent',
  },
];

export function TestimonialSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => {
    setCurrentIndex((c) => (c === 0 ? TESTIMONIALS.length - 1 : c - 1));
  };

  const next = () => {
    setCurrentIndex((c) => (c === TESTIMONIALS.length - 1 ? 0 : c + 1));
  };

  const current = TESTIMONIALS[currentIndex];

  return (
    <div className="relative mx-auto max-w-[1536px] px-4 sm:px-8 lg:px-12 xl:px-16 py-20">
      {/* Glow Blur */}
      <div className="absolute right-10 top-1/2 -z-10 h-80 w-80 -translate-y-1/2 rounded-full bg-brand-500/10 blur-3xl" />

      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-pink-700 ring-1 ring-inset ring-pink-600/20">
          <Heart className="h-3.5 w-3.5 fill-pink-500 text-pink-500" /> Loved by 120,000+ Borrowers
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Real Stories. <span className="bg-brand-gradient bg-clip-text text-transparent">Instant Relief.</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-600">
          See why young professionals, freelancers, and businesses trust Adyapan for their credit needs.
        </p>
      </div>

      {/* Testimonial 3D Card */}
      <div className="mt-12 mx-auto max-w-5xl">
        <TiltCard
          maxTilt={8}
          perspective={1200}
          scale={1.01}
          glare={true}
          glareOpacity={0.2}
          className="w-full"
        >
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white p-8 sm:p-12 shadow-card">
            <Quote className="absolute right-8 top-8 h-28 w-28 text-slate-100 -z-0 pointer-events-none" />

            <div className="relative z-10">
              {/* Stars & Category Tag */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-600/20">
                  {current.tag}
                </span>
              </div>

              {/* Quote Body */}
              <blockquote className="mt-6 text-lg sm:text-2xl font-semibold leading-relaxed text-slate-800">
                “{current.quote}”
              </blockquote>

              {/* Author & Metric Highlights */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-6 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-4">
                  <img
                    src={current.avatar}
                    alt={current.author}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-500/30 shadow-md"
                  />
                  <div>
                    <p className="text-lg font-extrabold text-slate-900">{current.author}</p>
                    <p className="text-sm font-medium text-slate-500">
                      {current.role} • <span className="font-semibold text-slate-700">{current.city}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-brand-50 px-4 py-2.5 ring-1 ring-brand-600/20">
                  <p className="text-2xl font-black text-brand-700">{current.metrics.stat}</p>
                  <p className="text-xs font-bold text-slate-600">{current.metrics.label}</p>
                </div>
              </div>
            </div>
          </div>
        </TiltCard>

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={prev}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2.5 rounded-full transition-all duration-200 ${
                  currentIndex === i ? 'w-8 bg-brand-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
