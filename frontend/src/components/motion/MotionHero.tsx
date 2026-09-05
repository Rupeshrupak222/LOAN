'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  Zap,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  Users,
  Star,
  Landmark,
  Award,
  ChevronDown,
  TrendingUp,
} from 'lucide-react';
import { MagneticButton } from '../fintech/MagneticButton';

export const MotionHero: React.FC = () => {
  const [loanAmount, setLoanAmount] = useState(200000);

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const promiseCardRef = useRef<HTMLDivElement>(null);
  const statsBarRef = useRef<HTMLDivElement>(null);
  const svgLineRef = useRef<SVGPathElement>(null);

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  useEffect(() => {
    if (!sectionRef.current) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1. Header fade down
      if (headerRef.current) {
        const els = headerRef.current.querySelectorAll('[data-hero-el]');
        gsap.set(els, { opacity: 0, y: 20 });
        tl.to(els, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 }, 0.1);
      }

      // 2. Animated blue connecting energy path
      if (svgLineRef.current) {
        const length = svgLineRef.current.getTotalLength();
        gsap.set(svgLineRef.current, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
        tl.to(svgLineRef.current, {
          strokeDashoffset: 0,
          duration: 1.8,
          ease: 'power2.inOut',
        }, 0.2);
      }

      // 3. Staggered reveal for all 6 stations
      const stations = sectionRef.current?.querySelectorAll('[data-station]');
      if (stations && stations.length > 0) {
        gsap.set(stations, { opacity: 0, scale: 0.94, y: 25 });
        tl.to(stations, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.12,
          ease: 'back.out(1.2)',
        }, 0.4);
      }

      // 4. Promise Card
      if (promiseCardRef.current) {
        gsap.set(promiseCardRef.current, { opacity: 0, y: 25 });
        tl.to(promiseCardRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.7,
        }, 0.9);
      }

      // 5. Stats Bar
      if (statsBarRef.current) {
        gsap.set(statsBarRef.current, { opacity: 0, y: 20 });
        tl.to(statsBarRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.7,
        }, 1.1);
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col justify-between overflow-hidden pt-28 pb-8 bg-[#FFFFFF] text-[#071A33]"
    >
      {/* Background blueprint subtle grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(to right, #071A33 1px, transparent 1px), linear-gradient(to bottom, #071A33 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto">
        {/* ========================================================================= */}
        {/* HERO TOP CENTER HEADLINE */}
        {/* ========================================================================= */}
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <div
            data-hero-el
            className="text-lg sm:text-2xl font-serif italic text-[#155EEF] font-bold tracking-tight mb-1"
          >
            Urgent need?
          </div>

          <h1
            data-hero-el
            className="text-3xl sm:text-5xl lg:text-[56px] font-black tracking-tight text-[#071A33] leading-[1.1] mb-4"
          >
            Adyapan is here{' '}
            <span className="block sm:inline">
              for your{' '}
              <span className="relative inline-block text-[#155EEF]">
                next move.
                {/* Hand-drawn curved underline */}
                <svg
                  className="absolute -bottom-2 left-0 w-full overflow-visible pointer-events-none"
                  viewBox="0 0 240 16"
                  fill="none"
                >
                  <path
                    d="M3 10C55 2 150 1 237 8C165 12 75 14 10 12"
                    stroke="#155EEF"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </span>
          </h1>

          {/* 3 Key Trust Pills */}
          <div
            data-hero-el
            className="flex items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-bold text-[#071A33] flex-wrap mt-4"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#155EEF] fill-[#155EEF]" />
              <span>Instant Money</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#155EEF]" />
              <span>Zero Paperwork</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#155EEF]" />
              <span>100% Secure</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6-STAGE NARRATIVE CANVAS WITH CONNECTING BLUE ENERGY CURVE */}
        {/* ========================================================================= */}
        <div className="relative w-full min-h-[560px] my-2">
          {/* Background Connecting Curved Blue Path SVG */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block z-0 overflow-visible"
            viewBox="0 0 1340 560"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              ref={svgLineRef}
              d="M 60 270 C 130 300, 180 280, 240 370 C 310 460, 390 410, 480 370 C 580 320, 680 430, 770 380 C 860 330, 940 180, 1020 220 C 1110 260, 1200 350, 1280 330"
              stroke="#155EEF"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-y-10 gap-x-6 items-start relative z-10">
            {/* ------------------------------------------------------------- */}
            {/* STAGE 1: THE MOMENT YOU NEED MONEY (Top Left, cols 1-4) */}
            {/* ------------------------------------------------------------- */}
            <div data-station className="lg:col-span-4 flex flex-col items-start text-left">
              <div className="mb-2">
                <span className="font-serif italic font-bold text-sm sm:text-base text-[#155EEF] block">
                  1. The Moment
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#071A33] tracking-tight">
                  You Need Money
                </h3>
                <p className="text-xs text-[#526071] leading-relaxed max-w-[240px] mt-0.5">
                  Unexpected expenses can come anytime. We understand.
                </p>
              </div>

              {/* Realistic Stressed Borrower Photo */}
              <div className="relative w-full max-w-[310px] rounded-3xl overflow-hidden shadow-lg border border-[#D3E5FA] bg-white group hover:shadow-xl transition-all duration-300">
                <div className="aspect-[4/3] w-full overflow-hidden relative">
                  <img
                    src="/images/hero_stressed_man.jpg"
                    alt="Borrower managing unexpected expenses"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Floating Bill Tags */}
                  <div className="absolute bottom-2 left-2 flex gap-1.5 flex-wrap">
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/95 text-red-600 shadow-xs border border-red-200">
                      Medical Bills
                    </span>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/95 text-amber-600 shadow-xs border border-amber-200">
                      School Fees
                    </span>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/95 text-blue-600 shadow-xs border border-blue-200">
                      Travel Plans
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* STAGE 2: APPLY IN MINUTES (Bottom Left, cols 1-3 offset or cols 5-7) */}
            {/* ------------------------------------------------------------- */}
            <div data-station className="lg:col-span-3 flex flex-col items-start text-left lg:mt-24">
              <div className="mb-2">
                <h3 className="font-serif italic font-bold text-sm sm:text-base text-[#155EEF]">
                  2. Apply in Minutes
                </h3>
                <p className="text-xs text-[#526071] leading-relaxed max-w-[200px]">
                  Simple application. No unnecessary paperwork.
                </p>
              </div>

              {/* Realistic 3D Tilted Interactive Phone Mockup */}
              <div className="relative w-full max-w-[220px] rounded-[32px] p-3 bg-white border-2 border-slate-900 shadow-2xl overflow-hidden group hover:scale-105 transition-transform duration-300">
                {/* Speaker Notch */}
                <div className="w-14 h-3 bg-slate-900 rounded-full mx-auto mb-3" />

                <div className="text-left space-y-2.5 px-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-[#155EEF] text-white flex items-center justify-center text-[9px] font-black">
                      A
                    </div>
                    <span className="text-xs font-black text-[#071A33] tracking-wide">
                      Adyapan
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="text-[10px] text-[#526071] font-bold uppercase">
                      Amount
                    </div>
                    <div className="text-base sm:text-lg font-black font-mono text-[#071A33]">
                      {formatINR(loanAmount)}
                    </div>
                    <input
                      type="range"
                      min={10000}
                      max={500000}
                      step={5000}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF] mt-2"
                    />
                    <div className="flex justify-between text-[8px] font-mono text-[#526071] mt-1 font-semibold">
                      <span>₹10K</span>
                      <span>₹5L</span>
                    </div>
                  </div>

                  <a
                    href="#calculator"
                    className="w-full py-2 rounded-xl bg-[#155EEF] text-white text-xs font-bold text-center block shadow-md hover:bg-[#104ec8] transition-colors"
                  >
                    Apply Now
                  </a>
                </div>

                {/* Hand-drawn Sketch Clock */}
                <div className="absolute -bottom-2 -left-2 w-10 h-10 rounded-full border border-dashed border-[#155EEF] flex items-center justify-center bg-white/90 text-[#155EEF]">
                  <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '12s' }} />
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* STAGE 3: QUICK VERIFICATION (Center, cols 8-9) */}
            {/* ------------------------------------------------------------- */}
            <div data-station className="lg:col-span-2 flex flex-col items-center text-center lg:mt-32">
              <div className="mb-2">
                <h3 className="font-serif italic font-bold text-sm sm:text-base text-[#155EEF]">
                  3. Quick Verification
                </h3>
                <p className="text-xs text-[#526071] leading-relaxed max-w-[170px]">
                  We verify digitally in the fastest way possible.
                </p>
              </div>

              {/* 3D Metallic Shield with Glowing Checkmark */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center group hover:scale-110 transition-transform duration-300">
                <img
                  src="/images/hero_3d_shield.jpg"
                  alt="Quick Digital Verification Shield"
                  className="w-full h-full object-contain rounded-2xl filter drop-shadow-lg"
                />
                {/* Floating ID badge */}
                <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-white border border-[#D3E5FA] flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-[#155EEF]" />
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* STAGE 4: INSTANT APPROVAL (Center-Right, cols 10-12) */}
            {/* ------------------------------------------------------------- */}
            <div data-station className="lg:col-span-3 flex flex-col items-center text-center lg:mt-28">
              <div className="mb-2">
                <h3 className="font-serif italic font-bold text-sm sm:text-base text-[#155EEF]">
                  4. Instant Approval
                </h3>
                <p className="text-xs text-[#526071] leading-relaxed max-w-[190px]">
                  Get approved instantly without long waiting or follow-ups.
                </p>
              </div>

              {/* 3D Wooden Stamp & Stamped APPROVED Impression */}
              <div className="relative flex flex-col items-center group cursor-pointer">
                {/* Wooden Stamp Asset Render */}
                <div className="w-16 h-20 relative flex flex-col items-center transform group-hover:-translate-y-1 transition-transform">
                  {/* Stamp Wooden Knob */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-b from-amber-700 via-amber-800 to-amber-950 shadow-md border border-amber-600" />
                  {/* Brass Neck */}
                  <div className="w-4 h-5 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 rounded-xs shadow-xs" />
                  {/* Wooden Base Base */}
                  <div className="w-16 h-5 rounded-md bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 border border-amber-600 shadow-md" />
                </div>

                {/* Stamped APPROVED Box */}
                <div className="mt-1 px-4 py-1.5 rounded-lg border-2 border-dashed border-[#155EEF] bg-[#EAF4FF] transform -rotate-3 group-hover:rotate-0 transition-transform shadow-xs">
                  <span className="font-mono text-sm sm:text-base font-black tracking-widest text-[#155EEF] uppercase">
                    APPROVED
                  </span>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* STAGE 5: MONEY IN YOUR ACCOUNT (Top Right, cols 9-12 top) */}
            {/* ------------------------------------------------------------- */}
            <div data-station className="lg:col-span-6 flex flex-col items-end text-right lg:-mt-64">
              <div className="mb-2">
                <span className="font-serif italic font-bold text-sm sm:text-base text-[#155EEF] block">
                  5. Money in Your Account
                </span>
                <p className="text-xs text-[#526071] leading-relaxed max-w-[200px] mt-0.5">
                  The money reaches your account instantly.
                </p>
              </div>

              {/* Phone Mockup with Disbursed Confirmation */}
              <div className="relative flex items-center gap-4">
                {/* Hand-drawn Paper Plane */}
                <div className="text-[#155EEF] animate-bounce transform -rotate-12">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#155EEF" strokeWidth="1.8">
                    <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Phone Card */}
                <div className="relative w-full max-w-[190px] rounded-[30px] p-3 bg-white border-2 border-slate-900 shadow-2xl text-center group hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-2.5 bg-slate-900 rounded-full mx-auto mb-3" />
                  <div className="space-y-1.5 py-1">
                    <div className="text-[10px] font-mono text-[#526071] uppercase font-bold">
                      Amount Received
                    </div>
                    <div className="text-base sm:text-lg font-black font-mono text-[#071A33]">
                      {formatINR(loanAmount)}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#155EEF] text-white flex items-center justify-center mx-auto shadow-md">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Classical Bank Building Sketch in background */}
                <div className="hidden sm:block opacity-40 text-slate-400">
                  <Landmark className="w-16 h-16" />
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* STAGE 6: MOVE FORWARD (Bottom Right, cols 7-12) */}
            {/* ------------------------------------------------------------- */}
            <div data-station className="lg:col-span-6 flex flex-col items-end text-right lg:-mt-20">
              <div className="mb-2">
                <h3 className="font-serif italic font-bold text-sm sm:text-base text-[#155EEF]">
                  6. Move Forward
                </h3>
                <p className="text-xs text-[#526071] leading-relaxed max-w-[240px]">
                  Solve today&apos;s problems. Focus on your dreams. We&apos;ll be with you.
                </p>
              </div>

              {/* Realistic Celebrating Happy Borrower Photo */}
              <div className="relative w-full max-w-[320px] rounded-3xl overflow-hidden shadow-lg border border-[#D3E5FA] bg-white group hover:shadow-xl transition-all duration-300">
                <div className="aspect-[4/3] w-full overflow-hidden relative">
                  <img
                    src="/images/hero_happy_man.jpg"
                    alt="Happy borrower moving forward with capital"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Upward Growth Arrow Badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-mono font-bold shadow-md">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Next Move Won</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTER PROMISE CARD BANNER */}
        {/* ========================================================================= */}
        <div ref={promiseCardRef} className="max-w-4xl mx-auto my-6 sm:my-8">
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-[#EAF4FF] via-[#F4F8FF] to-[#EAF4FF] border border-[#D3E5FA] shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <span className="text-xs font-mono text-[#526071] font-bold block">
                  Urgent money. Instant solution.
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#071A33] tracking-tight">
                  That’s the <span className="text-[#155EEF]">Adyapan Promise.</span>
                </h3>
              </div>

              <MagneticButton
                href="/apply"
                variant="primary"
                className="px-8 py-3.5 text-sm font-bold shadow-md shadow-[#155EEF]/20 whitespace-nowrap"
              >
                <span>Check Eligibility</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </MagneticButton>
            </div>

            {/* 4 Feature Trust Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-[#D3E5FA] text-xs font-bold text-[#071A33]">
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <Zap className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>Instant Disbursal</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <FileText className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>Minimal Documents</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <RefreshCw className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>Flexible Repayment</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <Users className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>Trusted by 50K+ Customers</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM SOCIAL PROOF & REGULATORY TRUST STRIP */}
        {/* ========================================================================= */}
        <div
          ref={statsBarRef}
          className="pt-6 border-t border-[#D3E5FA] flex flex-col lg:flex-row items-center justify-between gap-6 text-left"
        >
          {/* Avatar stack & customers */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2 overflow-hidden">
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                src="/images/study_sketch.jpg"
                alt="User"
              />
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                src="/images/business_sketch.jpg"
                alt="User"
              />
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                src="/images/home_sketch.jpg"
                alt="User"
              />
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                src="/images/emergency_sketch.jpg"
                alt="User"
              />
            </div>
            <div>
              <div className="text-xs text-[#526071] font-medium">Trusted by</div>
              <div className="text-sm font-black text-[#071A33]">50,000+ Happy Customers</div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-8 text-center sm:text-left flex-wrap justify-center">
            <div>
              <div className="text-sm sm:text-base font-black text-[#071A33] flex items-center gap-1">
                <span>4.8/5</span>
                <div className="flex text-amber-400">
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                  <Star className="w-3 h-3 fill-current" />
                </div>
              </div>
              <div className="text-[10px] text-[#526071] font-semibold">Customer Rating</div>
            </div>

            <div className="h-6 w-px bg-[#D3E5FA] hidden sm:block" />

            <div>
              <div className="text-sm sm:text-base font-black text-[#071A33] font-mono">
                ₹250Cr+
              </div>
              <div className="text-[10px] text-[#526071] font-semibold">Loans Disbursed</div>
            </div>

            <div className="h-6 w-px bg-[#D3E5FA] hidden sm:block" />

            <div>
              <div className="text-sm sm:text-base font-black text-emerald-600 font-mono">
                100%
              </div>
              <div className="text-[10px] text-[#526071] font-semibold">Secure & Safe</div>
            </div>
          </div>

          {/* Institutional Compliance Badges */}
          <div className="flex items-center gap-4 text-xs font-bold text-[#071A33] flex-wrap justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D3E5FA] shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#155EEF]" />
              <span className="text-[11px]">Bank Level Security</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D3E5FA] shadow-2xs">
              <Landmark className="w-4 h-4 text-[#155EEF]" />
              <span className="text-[11px]">RBI Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D3E5FA] shadow-2xs">
              <Award className="w-4 h-4 text-[#155EEF]" />
              <span className="text-[11px]">ISO Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Downward indicator */}
      <div className="relative z-10 flex justify-center mt-4">
        <a
          href="#story-scene"
          className="p-2 rounded-full bg-white shadow-xs hover:shadow-sm border border-[#D3E5FA] text-[#526071] hover:text-[#071A33] transition-all animate-bounce"
          aria-label="Scroll to Story"
        >
          <ChevronDown className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
};
