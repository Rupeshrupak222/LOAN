'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import {
  Zap,
  Shield,
  Lock,
  ArrowRight,
  FileText,
  Clock,
  Users,
  Check,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   Adyapan Master Hero Section — 100% Full-Bleed Edge-to-Edge Canvas
   - Zero side gaps / margins on any screen resolution
   - Full viewport background and fluid edge-to-edge composition
   ══════════════════════════════════════════════════════════════ */
export const Hero3DVisual: React.FC = () => {
  const [loanAmount, setLoanAmount] = useState<number>(200000);
  const heroRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const pathGlowRef = useRef<SVGPathElement>(null);
  const shieldRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);
  const airplaneRef = useRef<HTMLDivElement>(null);

  const formatINR = useCallback((val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  }, []);

  const handleScrollToLaunchpad = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById('launchpad') || document.getElementById('apply');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /* ── GSAP Choreography: Path Draw + Timed Airplane Flight + Float ── */
  useEffect(() => {
    if (!heroRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (prefersReduced) return;

      // 1. Initial State for Airplane
      if (airplaneRef.current) {
        gsap.set(airplaneRef.current, {
          opacity: 0,
          x: -45,
          y: 45,
          scale: 0.5,
          rotate: -15,
        });
      }

      // 2. Elements entrance animation
      const animElements = heroRef.current!.querySelectorAll('[data-hero-anim]');
      gsap.fromTo(
        animElements,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.05,
          ease: 'power3.out',
          delay: 0.1,
        }
      );

      // 3. Main Ribbon Path Draw-on (Duration: 2.6s)
      if (pathRef.current) {
        const len = pathRef.current.getTotalLength();
        gsap.set([pathRef.current, pathGlowRef.current], {
          strokeDasharray: len,
          strokeDashoffset: len,
        });

        gsap.to(pathRef.current, {
          strokeDashoffset: 0,
          duration: 2.6,
          ease: 'power2.inOut',
          delay: 0.3,
        });

        if (pathGlowRef.current) {
          gsap.to(pathGlowRef.current, {
            strokeDashoffset: 0,
            duration: 2.6,
            ease: 'power2.inOut',
            delay: 0.4,
          });
        }
      }

      // 4. Paper Airplane Flies in when blue path reaches Step 5 (~t = 1.95s)
      if (airplaneRef.current) {
        gsap.to(airplaneRef.current, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          rotate: 0,
          duration: 1.0,
          ease: 'power2.out',
          delay: 1.95,
          onComplete: () => {
            gsap.to(airplaneRef.current, {
              x: '+=6',
              y: '-=7',
              rotation: 4,
              duration: 3.4,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            });
          },
        });
      }

      // 5. In-Place Subtle Floating Physics
      if (shieldRef.current) {
        gsap.to(shieldRef.current, {
          y: -5,
          duration: 3.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
      if (stampRef.current) {
        gsap.to(stampRef.current, {
          y: -4,
          duration: 3.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 0.4,
        });
      }
      if (clockRef.current) {
        gsap.to(clockRef.current, {
          y: -3,
          rotation: 2,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 0.2,
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  /* ── Master S-Curve Ribbon Path ── */
  const journeyRibbonPath = 'M 40,470 C 70,545 140,585 210,590 C 300,595 340,570 420,555 C 510,530 550,540 610,550 C 690,565 750,605 820,620 C 900,640 960,520 1025,385 C 1070,290 1095,275 1135,290 C 1180,315 1215,420 1255,510 C 1285,590 1335,550 1370,460 L 1400,380';

  return (
    <section
      ref={heroRef}
      className="relative w-full bg-[#F4F9FF] text-[#071A33] overflow-hidden select-none pt-28 pb-16 lg:py-0"
      id="hero"
    >
      {/* ═══════════════════════════════════════════════
          FULL-BLEED BACKGROUND ACROSS 100% OF VIEWPORT
         ═══════════════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* 1. Luminous Ambient Gradient Base */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 15%, #FFFFFF 0%, #F1F7FE 40%, #EAF3FD 80%, #F4F8FE 100%)',
          }}
        />

        {/* 2. Soft Ambient Cyan & Royal Blue Radial Glows */}
        <div className="absolute top-12 left-0 w-[45vw] h-[550px] bg-gradient-to-br from-blue-100/50 via-sky-50/40 to-transparent rounded-full blur-3xl opacity-80" />
        <div className="absolute top-8 right-0 w-[50vw] h-[600px] bg-gradient-to-bl from-blue-200/40 via-cyan-100/35 to-transparent rounded-full blur-3xl opacity-80" />
        <div className="absolute bottom-6 left-1/4 w-[60vw] h-[320px] bg-gradient-to-t from-blue-100/40 to-transparent rounded-full blur-2xl opacity-70" />

        {/* 3. Tech Constellation Network Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-45" viewBox="0 0 1440 980" preserveAspectRatio="none" fill="none">
          <g stroke="#93C5FD" strokeWidth="0.8" strokeDasharray="3 6" opacity="0.6">
            <line x1="50" y1="180" x2="340" y2="180" />
            <line x1="340" y1="180" x2="480" y2="280" />
            <line x1="480" y1="280" x2="680" y2="240" />
            <line x1="680" y1="240" x2="920" y2="280" />
            <line x1="920" y1="280" x2="1140" y2="180" />
            <line x1="1140" y1="180" x2="1400" y2="220" />
            <line x1="200" y1="360" x2="480" y2="360" />
            <line x1="720" y1="360" x2="980" y2="360" />
            <line x1="980" y1="360" x2="1320" y2="480" />
          </g>

          <g fill="#3B82F6" opacity="0.5">
            <circle cx="50" cy="180" r="2.5" />
            <circle cx="340" cy="180" r="3" />
            <circle cx="480" cy="280" r="2.5" />
            <circle cx="680" cy="240" r="3" />
            <circle cx="920" cy="280" r="3" />
            <circle cx="1140" cy="180" r="3.5" />
            <circle cx="1400" cy="220" r="3" />
            <circle cx="200" cy="360" r="2.5" />
            <circle cx="480" cy="360" r="2.5" />
            <circle cx="720" cy="360" r="3" />
            <circle cx="980" cy="360" r="3.5" />
            <circle cx="1320" cy="480" r="3" />
          </g>

          {/* Floating Mail outline near Step 1 */}
          <g transform="translate(310, 210) rotate(-12)" stroke="#93C5FD" strokeWidth="1.2" fill="rgba(239, 246, 255, 0.4)" opacity="0.6">
            <rect x="0" y="0" width="28" height="20" rx="3" />
            <path d="M 0,0 L 14,12 L 28,0" />
          </g>

          {/* Floating Rupee Token (₹) on Right Edge */}
          <g transform="translate(1360, 440)" opacity="0.65">
            <circle cx="24" cy="24" r="24" fill="rgba(219, 234, 254, 0.4)" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="24" y="32" fill="#2563EB" fontSize="22" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">₹</text>
          </g>
        </svg>

        {/* 4. Panoramic Cyber City Skyline (Reaches to the right edge) */}
        <div className="absolute right-0 top-[200px] w-[50vw] max-w-[750px] h-[550px] opacity-[0.24] pointer-events-none">
          <svg viewBox="0 0 640 520" fill="none" className="w-full h-full">
            <defs>
              <linearGradient id="cityTowerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <rect x="40" y="260" width="48" height="260" fill="url(#cityTowerGrad)" rx="2" />
            <rect x="98" y="170" width="42" height="350" fill="url(#cityTowerGrad)" rx="2" />
            <rect x="150" y="280" width="52" height="240" fill="url(#cityTowerGrad)" rx="2" />
            <rect x="212" y="120" width="46" height="400" fill="url(#cityTowerGrad)" rx="2" />
            <rect x="268" y="200" width="65" height="320" fill="url(#cityTowerGrad)" rx="2" />
            <rect x="345" y="250" width="38" height="270" fill="url(#cityTowerGrad)" rx="2" />
            <rect x="395" y="140" width="52" height="380" fill="url(#cityTowerGrad)" rx="2" />
            <rect x="458" y="210" width="44" height="310" fill="url(#cityTowerGrad)" rx="2" />
            <rect x="512" y="290" width="52" height="230" fill="url(#cityTowerGrad)" rx="2" />
            <rect x="575" y="170" width="55" height="350" fill="url(#cityTowerGrad)" rx="2" />
            
            <line x1="119" y1="170" x2="119" y2="110" stroke="#3B82F6" strokeWidth="1.5" />
            <line x1="235" y1="120" x2="235" y2="60" stroke="#3B82F6" strokeWidth="1.5" />
            <line x1="421" y1="140" x2="421" y2="80" stroke="#3B82F6" strokeWidth="1.5" />
            <circle cx="235" cy="58" r="3" fill="#3B82F6" />
            <circle cx="421" cy="78" r="3" fill="#3B82F6" />
            
            <g stroke="#93C5FD" strokeWidth="0.8" opacity="0.5">
              <line x1="216" y1="160" x2="254" y2="160" />
              <line x1="216" y1="200" x2="254" y2="200" />
              <line x1="216" y1="240" x2="254" y2="240" />
              <line x1="399" y1="180" x2="443" y2="180" />
              <line x1="399" y1="220" x2="443" y2="220" />
              <line x1="399" y1="260" x2="443" y2="260" />
            </g>

            <path d="M 0,420 Q 200,380 400,340 T 640,240" stroke="#60A5FA" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          DESKTOP MASTER CANVAS (≥ 1024px)
          Edge-to-Edge 100% Full-Width Composition
         ═══════════════════════════════════════════════ */}
      <div className="hidden lg:block relative w-full h-[980px] max-w-[1920px] mx-auto px-4 xl:px-8">

        {/* ── 3D Tech Podiums (Positioned relative to full-width canvas) ── */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Glowing 3D Tech Podium under Step 3 (Shield) */}
          <div className="absolute left-1/2 -translate-x-[70px] top-[565px] w-[250px] height-[90px]">
            <svg viewBox="0 0 250 90" fill="none" className="w-full h-full">
              <ellipse cx="125" cy="45" rx="110" ry="32" fill="rgba(37, 99, 235, 0.08)" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="4 3" />
              <ellipse cx="125" cy="42" rx="90" ry="24" fill="url(#podiumGrad)" stroke="#93C5FD" strokeWidth="1.5" />
              <ellipse cx="125" cy="40" rx="65" ry="16" fill="rgba(255, 255, 255, 0.85)" stroke="#3B82F6" strokeWidth="1" />
              <defs>
                <linearGradient id="podiumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0.7" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Glowing 3D Tech Podium under Step 5 (Phone on Right) */}
          <div className="absolute right-[1%]" style={{ top: '380px', width: '245px', height: '85px' }}>
            <svg viewBox="0 0 245 85" fill="none" className="w-full h-full">
              <ellipse cx="122" cy="42" rx="105" ry="30" fill="rgba(37, 99, 235, 0.10)" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="4 3" />
              <ellipse cx="122" cy="40" rx="85" ry="22" fill="url(#podiumGrad)" stroke="#93C5FD" strokeWidth="1.5" />
              <ellipse cx="122" cy="38" rx="60" ry="15" fill="rgba(255, 255, 255, 0.9)" stroke="#3B82F6" strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* ── SVG Master Journey Line (Continuous Glowing Blue Ribbon) ── */}
        <div className="absolute inset-0 pointer-events-none z-[5]">
          <svg
            viewBox="0 0 1440 980"
            fill="none"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="journeyBlueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.85" />
                <stop offset="25%" stopColor="#1D4ED8" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="75%" stopColor="#1D4ED8" />
                <stop offset="100%" stopColor="#1E40AF" />
              </linearGradient>
              <filter id="ribbonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feFlood floodColor="#2563EB" floodOpacity="0.25" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Soft Ambient Shadow Ribbon */}
            <path
              d={journeyRibbonPath}
              stroke="rgba(37, 99, 235, 0.14)"
              strokeWidth="16"
              strokeLinecap="round"
              fill="none"
              transform="translate(0, 8)"
            />

            {/* Main Glowing Blue Journey Path */}
            <path
              ref={pathRef}
              d={journeyRibbonPath}
              stroke="url(#journeyBlueGrad)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#ribbonGlow)"
            />

            {/* Specular White Highlight line */}
            <path
              ref={pathGlowRef}
              d={journeyRibbonPath}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>


        {/* ════════════════════════════════════════════════════════
            CENTER TOP: Master Headline & Value Badges
           ════════════════════════════════════════════════════════ */}
        <div
          className="absolute z-20 left-1/2 -translate-x-1/2 text-center"
          style={{ top: '75px', width: '680px' }}
          data-hero-anim
        >
          {/* Cursive Tagline */}
          <p className="font-handwriting text-[32px] text-[#1D4ED8] font-bold tracking-wide -rotate-1 mb-1">
            Urgent need?
          </p>

          {/* Main Title */}
          <h1 className="text-[44px] xl:text-[54px] font-black text-[#071A33] tracking-tight leading-[1.12] font-jakarta">
            Adyapan is here<br />
            for your{' '}
            <span className="relative inline-block text-[#1D4ED8]">
              next move.
              {/* Double Blue Brush Underline */}
              <svg
                className="absolute -bottom-2.5 left-0 w-full overflow-visible"
                height="14"
                viewBox="0 0 200 14"
                fill="none"
              >
                <path d="M 2,7 Q 100,1 198,7" stroke="#1D4ED8" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 14,11 Q 108,5 186,11" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
              </svg>
            </span>
          </h1>

          {/* 3 Core Trust Badges in a Row */}
          <div className="flex items-center justify-center gap-7 pt-5 text-[14px] font-bold text-slate-700">
            <div className="flex items-center gap-2 hover:text-[#1D4ED8] transition-colors cursor-default">
              <div className="w-7 h-7 rounded-full border border-blue-200 flex items-center justify-center bg-white/90 text-[#1D4ED8] shadow-xs">
                <Zap size={14} className="fill-[#1D4ED8]" />
              </div>
              <span>Instant Money</span>
            </div>
            <div className="flex items-center gap-2 hover:text-[#1D4ED8] transition-colors cursor-default">
              <div className="w-7 h-7 rounded-full border border-blue-200 flex items-center justify-center bg-white/90 text-[#1D4ED8] shadow-xs">
                <Shield size={14} />
              </div>
              <span>Zero Paperwork</span>
            </div>
            <div className="flex items-center gap-2 hover:text-[#1D4ED8] transition-colors cursor-default">
              <div className="w-7 h-7 rounded-full border border-blue-200 flex items-center justify-center bg-white/90 text-[#1D4ED8] shadow-xs">
                <Lock size={14} />
              </div>
              <span>100% Secure</span>
            </div>
          </div>
        </div>


        {/* ════════════════════════════════════════════════════════
            STEP 1: The Moment You Need Money (Top-Left)
           ════════════════════════════════════════════════════════ */}
        <div
          className="absolute z-10"
          style={{ left: '2%', top: '85px', width: '310px' }}
          data-hero-anim
        >
          <div className="mb-2">
            <h3 className="text-base leading-tight">
              <span className="font-handwriting text-[22px] text-[#1D4ED8] font-bold">1. </span>
              <span className="font-serif-italic text-[18px] text-[#1D4ED8]">The Moment</span>
            </h3>
            <p className="font-bold text-[#071A33] text-[17px] font-jakarta leading-tight">You Need Money</p>
            <p className="text-[12px] text-slate-500 max-w-[210px] mt-1 leading-relaxed">
              Unexpected expenses can come anytime. We understand.
            </p>
          </div>

          <div
            className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-100 group transition-transform duration-300 hover:scale-[1.02]"
            style={{ width: '300px', height: '220px' }}
          >
            <img
              src="/fintech/step1-stressed-bills.jpg"
              alt="Person needing financial support"
              className="w-full h-full object-cover"
              loading="eager"
            />
            {/* Bill Chips */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
              <span className="bg-white/95 backdrop-blur-md text-slate-800 px-2 py-0.5 rounded-md text-[10px] font-extrabold border border-slate-200/80 shadow-xs">
                Medical Bills
              </span>
              <span className="bg-white/95 backdrop-blur-md text-slate-800 px-2 py-0.5 rounded-md text-[10px] font-extrabold border border-slate-200/80 shadow-xs">
                School Fees
              </span>
              <span className="bg-white/95 backdrop-blur-md text-slate-800 px-2 py-0.5 rounded-md text-[10px] font-extrabold border border-slate-200/80 shadow-xs">
                Travel Plans
              </span>
            </div>
          </div>
        </div>


        {/* ════════════════════════════════════════════════════════
            STEP 2: Apply in Minutes (Bottom-Left + 3D Phone Mockup)
           ════════════════════════════════════════════════════════ */}
        {/* Step 2 Text & Clock */}
        <div
          className="absolute z-10"
          style={{ left: '3%', top: '600px', width: '220px' }}
          data-hero-anim
        >
          <h3 className="text-base leading-tight mb-1">
            <span className="font-handwriting text-[22px] text-[#1D4ED8] font-bold">2. </span>
            <span className="font-serif-italic text-[18px] text-[#1D4ED8]">Apply in Minutes</span>
          </h3>
          <p className="text-[12px] text-slate-500 leading-relaxed">
            Simple application.<br />No unnecessary paperwork.
          </p>

          {/* Clock Doodle with In-Place Float */}
          <div ref={clockRef} className="mt-4">
            <svg width="50" height="50" viewBox="0 0 100 100" fill="none" className="text-[#1D4ED8]">
              <circle cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="3" strokeDasharray="5 3" opacity="0.75" />
              <path d="M 50,50 L 50,26" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 50,50 L 66,50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="50" cy="50" r="3.5" fill="currentColor" />
              <path d="M 18,32 L 10,26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <path d="M 22,22 L 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <path d="M 32,16 L 28,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            </svg>
          </div>
        </div>

        {/* Step 2 Phone Mockup with 3D Hover Perspective */}
        <div
          className="absolute z-20"
          style={{
            left: '17%',
            top: '420px',
            width: '185px',
            height: '370px',
          }}
          data-hero-anim
        >
          <div
            className="w-full h-full bg-[#0F172A] rounded-[36px] p-[5px] shadow-2xl phone-shadow-3d border-[3px] border-slate-700/80 transition-transform duration-300 hover:scale-[1.03] hover:-rotate-1"
            style={{
              transform: 'perspective(1000px) rotateY(-6deg) rotateX(2deg)',
            }}
          >
            <div className="w-full h-full bg-white rounded-[30px] overflow-hidden flex flex-col relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70px] h-[18px] bg-[#0F172A] rounded-b-xl z-10" />

              <div className="flex flex-col h-full pt-7 pb-4 px-3">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-2.5">
                  <div className="w-4 h-4 bg-[#1D4ED8] rounded-sm flex items-center justify-center text-white text-[8px] font-black">
                    A
                  </div>
                  <span className="font-black text-[11px] text-[#071A33] font-jakarta">Adyapan</span>
                </div>

                <div className="text-center my-auto space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Amount
                  </span>
                  <h4 className="text-[21px] font-black text-[#071A33] font-jakarta tracking-tight">
                    {formatINR(loanAmount)}
                  </h4>

                  <div className="px-1 space-y-1">
                    <input
                      type="range"
                      min={10000}
                      max={500000}
                      step={5000}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#1D4ED8]"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-slate-400">
                      <span>₹10K</span>
                      <span>₹5L</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleScrollToLaunchpad}
                  className="w-full py-2 rounded-full text-[11px] font-black bg-[#1D4ED8] text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition-all mt-auto cursor-pointer"
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* ════════════════════════════════════════════════════════
            STEP 3: Quick Verification (Center Left)
           ════════════════════════════════════════════════════════ */}
        <div
          className="absolute z-15 text-center"
          style={{ left: '33%', top: '410px', width: '200px' }}
          data-hero-anim
        >
          <h3 className="font-handwriting text-[23px] text-[#1D4ED8] font-bold mb-0.5">
            3. Quick Verification
          </h3>
          <p className="text-[12px] text-slate-500 max-w-[190px] mx-auto leading-relaxed mb-3">
            We verify digitally in the fastest way possible.
          </p>

          <div
            ref={shieldRef}
            className="w-[145px] h-[145px] mx-auto relative group transition-transform duration-300 hover:scale-105"
          >
            <img
              src="/fintech/step3-silver-shield.jpg"
              alt="Digital security verification shield"
              className="w-full h-full object-contain drop-shadow-xl"
              loading="lazy"
            />
          </div>
        </div>


        {/* ════════════════════════════════════════════════════════
            STEP 4: Instant Approval (Center Right)
           ════════════════════════════════════════════════════════ */}
        <div
          className="absolute z-15 text-center"
          style={{ left: '49%', top: '410px', width: '210px' }}
          data-hero-anim
        >
          <h3 className="font-handwriting text-[23px] text-[#1D4ED8] font-bold mb-0.5">
            4. Instant Approval
          </h3>
          <p className="text-[12px] text-slate-500 max-w-[200px] mx-auto leading-relaxed mb-3">
            Get approved instantly without long waiting or follow-ups.
          </p>

          <div
            ref={stampRef}
            className="w-[155px] h-[140px] mx-auto relative group transition-transform duration-300 hover:scale-105"
          >
            <img
              src="/fintech/step4-approved-stamp.jpg"
              alt="Official approved stamp"
              className="w-full h-full object-contain drop-shadow-xl"
              loading="lazy"
            />
          </div>
        </div>


        {/* ════════════════════════════════════════════════════════
            STEP 5: Money in Your Account (Top-Right)
           ════════════════════════════════════════════════════════ */}
        <div
          className="absolute z-10 text-right"
          style={{ right: '16%', top: '80px', width: '240px' }}
          data-hero-anim
        >
          <h3 className="text-base leading-tight mb-1">
            <span className="font-handwriting text-[22px] text-[#1D4ED8] font-bold">5. </span>
            <span className="font-serif-italic text-[18px] text-[#1D4ED8]">Money in Your Account</span>
          </h3>
          <p className="text-[12px] text-slate-500 max-w-[190px] ml-auto leading-relaxed">
            The money reaches your account instantly.
          </p>
        </div>

        {/* Step 5 Classical Bank Building (Background) */}
        <div
          className="absolute z-[8] opacity-35 rounded-2xl overflow-hidden pointer-events-none"
          style={{ right: '12%', top: '210px', width: '135px', height: '125px' }}
        >
          <img
            src="/fintech/step5-bank-building.jpg"
            alt="Bank building architecture"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Step 5 Phone Mockup (Amount Received ₹2,00,000) */}
        <div
          className="absolute z-20"
          style={{
            right: '3%',
            top: '110px',
            width: '165px',
            height: '320px',
          }}
          data-hero-anim
        >
          <div
            className="w-full h-full bg-[#0F172A] rounded-[34px] p-[5px] shadow-2xl phone-shadow-3d border-[3px] border-slate-700/80 transition-transform duration-300 hover:scale-[1.03] hover:rotate-1"
            style={{
              transform: 'perspective(1000px) rotateY(6deg) rotateX(2deg)',
            }}
          >
            <div className="w-full h-full bg-white rounded-[28px] overflow-hidden flex flex-col relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60px] h-[16px] bg-[#0F172A] rounded-b-xl z-10" />

              <div className="flex flex-col h-full pt-7 pb-3 px-3 text-center">
                <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 border-b border-slate-100 pb-1 mb-auto">
                  <span>10:28</span>
                  <span>5G 100%</span>
                </div>

                <div className="my-auto space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 block">
                    Amount Received
                  </span>
                  <h4 className="text-[19px] font-black text-[#071A33] font-jakarta tracking-tight">
                    ₹2,00,000
                  </h4>
                  <div className="w-10 h-10 bg-[#1D4ED8] rounded-full mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-500/30 ring-[3px] ring-blue-100">
                    <Check size={20} strokeWidth={3.5} />
                  </div>
                </div>

                <div className="text-[8px] text-slate-400 font-semibold border-t border-slate-100 pt-1 mt-auto">
                  Instant Bank Transfer
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5 Paper Airplane with Timed Flight Animation */}
        <div
          ref={airplaneRef}
          className="absolute z-15 pointer-events-none"
          style={{ right: '1.5%', top: '75px' }}
        >
          <svg width="68" height="68" viewBox="0 0 100 100" fill="none" className="text-[#1D4ED8]">
            <path d="M 12,78 Q 36,70 52,48" stroke="currentColor" strokeWidth="2.2" strokeDasharray="4 3" strokeLinecap="round" opacity="0.65" />
            <path d="M 52,45 L 90,16 L 66,58 L 52,45 Z" fill="rgba(29, 78, 216, 0.1)" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
        </div>


        {/* ════════════════════════════════════════════════════════
            STEP 6: Move Forward (Bottom-Right)
           ════════════════════════════════════════════════════════ */}
        <div
          className="absolute z-10 text-right"
          style={{ right: '22%', top: '500px', width: '230px' }}
          data-hero-anim
        >
          <h3 className="text-base leading-tight mb-1">
            <span className="font-handwriting text-[23px] text-[#1D4ED8] font-bold">6. </span>
            <span className="font-serif-italic text-[19px] text-[#1D4ED8]">Move Forward</span>
          </h3>
          <p className="text-[12.5px] text-slate-500 max-w-[210px] ml-auto leading-relaxed font-medium">
            Solve today&apos;s problems.<br />Focus on your dreams.<br />We&apos;ll be with you.
          </p>
        </div>

        {/* Celebrating Man Photo & Ascending Growth Arrow */}
        <div
          className="absolute z-10"
          style={{ right: '2%', top: '530px', width: '275px' }}
          data-hero-anim
        >
          <div className="relative">
            {/* Upward Ascending Blue Growth Arrow */}
            <svg
              className="absolute -top-14 right-0 w-[95%] h-[130%] pointer-events-none -z-10"
              viewBox="0 0 300 250"
              fill="none"
            >
              <path
                d="M 20,220 L 265,35"
                stroke="#1D4ED8"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <polygon points="270,26 280,50 255,42" fill="#1D4ED8" />
            </svg>

            {/* Celebrating Man Photo matching master reference */}
            <div
              className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-100 ml-auto group transition-transform duration-300 hover:scale-[1.02]"
              style={{ width: '265px', height: '215px' }}
            >
              <img
                src="/fintech/step6-celebrating-man.jpg"
                alt="Customer celebrating financial milestone"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>


        {/* ════════════════════════════════════════════════════════
            BOTTOM PROMISE CARD (Center Floating Banner)
           ════════════════════════════════════════════════════════ */}
        <div
          className="absolute z-30 left-1/2 -translate-x-1/2"
          style={{ bottom: '25px', width: '780px', maxWidth: '92vw' }}
          data-hero-anim
        >
          <div className="bg-gradient-to-r from-blue-50/95 via-sky-50/90 to-blue-50/95 border border-blue-200/80 rounded-2xl px-7 py-4 shadow-xl shadow-blue-500/8 backdrop-blur-md">
            {/* Top Row: Tagline + Promise Headline + CTA Button */}
            <div className="flex items-center justify-between gap-4 border-b border-blue-100/90 pb-3">
              <div>
                <span className="text-[12px] font-bold text-[#1D4ED8] block">
                  Urgent money. Instant solution.
                </span>
                <h3 className="text-[19px] font-bold text-[#071A33] font-jakarta leading-tight">
                  That&apos;s the{' '}
                  <span className="text-[#1D4ED8] font-black">Adyapan Promise.</span>
                </h3>
              </div>

              <Link
                href="#launchpad"
                onClick={handleScrollToLaunchpad}
                className="px-6 py-2.5 rounded-full text-[13px] font-extrabold bg-[#1D4ED8] hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Check Eligibility
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* Bottom Row: 4 Feature Value Pills */}
            <div className="flex items-center justify-between gap-3 pt-2.5 text-[12px] font-bold text-slate-600">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-[#1D4ED8] fill-[#1D4ED8]" />
                <span>Instant Disbursal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText size={14} className="text-[#1D4ED8]" />
                <span>Minimal Documents</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-[#1D4ED8]" />
                <span>Flexible Repayment</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-[#1D4ED8]" />
                <span>Trusted by 50K+ Customers</span>
              </div>
            </div>
          </div>
        </div>

      </div>
      {/* ═══ END DESKTOP MASTER CANVAS ═══ */}


      {/* ═══════════════════════════════════════════════
          MOBILE & TABLET VIEW (< 1024px)
          Vertical structured story journey
         ═══════════════════════════════════════════════ */}
      <div className="lg:hidden relative px-5 sm:px-8 space-y-10 max-w-lg mx-auto">
        {/* Headline */}
        <div className="text-center space-y-2">
          <p className="font-handwriting text-2xl text-[#1D4ED8] font-bold -rotate-1">Urgent need?</p>
          <h1 className="text-3xl sm:text-4xl font-black text-[#071A33] tracking-tight leading-tight font-jakarta">
            Adyapan is here<br />for your{' '}
            <span className="relative inline-block text-[#1D4ED8]">
              next move.
              <svg className="absolute -bottom-1.5 left-0 w-full" height="10" viewBox="0 0 200 10" fill="none">
                <path d="M 2,5 Q 100,1 198,5" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <div className="flex flex-wrap justify-center gap-4 pt-3 text-[13px] font-bold text-slate-700">
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-[#1D4ED8] fill-[#1D4ED8]" />
              <span>Instant Money</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-[#1D4ED8]" />
              <span>Zero Paperwork</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock size={14} className="text-[#1D4ED8]" />
              <span>100% Secure</span>
            </div>
          </div>
        </div>

        {/* Steps 1-6 */}
        <div className="space-y-8">
          {/* Step 1 */}
          <div className="space-y-2">
            <h3 className="font-handwriting text-xl text-[#1D4ED8] font-bold">1. The Moment You Need Money</h3>
            <p className="text-sm text-slate-500">Unexpected expenses can come anytime. We understand.</p>
            <div className="rounded-2xl overflow-hidden shadow-md">
              <img src="/fintech/step1-stressed-bills.jpg" alt="Urgent need" className="w-full h-[180px] object-cover" loading="lazy" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <h3 className="font-handwriting text-xl text-[#1D4ED8] font-bold">2. Apply in Minutes</h3>
            <p className="text-sm text-slate-500">Simple application. No unnecessary paperwork.</p>
            <div className="bg-[#0F172A] rounded-[28px] p-[5px] w-[200px] h-[370px] mx-auto shadow-xl phone-shadow-3d">
              <div className="w-full h-full bg-white rounded-[24px] overflow-hidden flex flex-col pt-6 pb-4 px-3 text-center">
                <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5 mb-2">
                  <div className="w-3.5 h-3.5 bg-[#1D4ED8] rounded text-white text-[7px] font-black flex items-center justify-center">A</div>
                  <span className="font-bold text-[10px]">Adyapan</span>
                </div>
                <div className="my-auto space-y-2">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase block">Amount</span>
                  <h4 className="text-xl font-black font-jakarta">{formatINR(loanAmount)}</h4>
                  <input
                    type="range"
                    min={10000}
                    max={500000}
                    step={5000}
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#1D4ED8]"
                  />
                  <div className="flex justify-between text-[8px] font-bold text-slate-400">
                    <span>₹10K</span>
                    <span>₹5L</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleScrollToLaunchpad}
                  className="w-full py-2 rounded-full text-[10px] font-extrabold bg-[#1D4ED8] text-white mt-auto cursor-pointer"
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-2 text-center">
            <h3 className="font-handwriting text-xl text-[#1D4ED8] font-bold">3. Quick Verification</h3>
            <p className="text-sm text-slate-500">We verify digitally in the fastest way possible.</p>
            <div className="w-32 h-32 mx-auto">
              <img src="/fintech/step3-silver-shield.jpg" alt="Verification" className="w-full h-full object-contain" loading="lazy" />
            </div>
          </div>

          {/* Step 4 */}
          <div className="space-y-2 text-center">
            <h3 className="font-handwriting text-xl text-[#1D4ED8] font-bold">4. Instant Approval</h3>
            <p className="text-sm text-slate-500">Get approved instantly without long waiting or follow-ups.</p>
            <div className="w-36 h-32 mx-auto">
              <img src="/fintech/step4-approved-stamp.jpg" alt="Approval" className="w-full h-full object-contain" loading="lazy" />
            </div>
          </div>

          {/* Step 5 */}
          <div className="space-y-2 text-center">
            <h3 className="font-handwriting text-xl text-[#1D4ED8] font-bold">5. Money in Your Account</h3>
            <p className="text-sm text-slate-500">The money reaches your account instantly.</p>
            <div className="bg-[#0F172A] rounded-[28px] p-[5px] w-[180px] h-[330px] mx-auto shadow-xl phone-shadow-3d">
              <div className="w-full h-full bg-white rounded-[24px] overflow-hidden flex flex-col pt-6 pb-3 px-3 text-center">
                <div className="flex justify-between text-[7px] font-bold text-slate-400 border-b border-slate-100 pb-1 mb-auto">
                  <span>10:28</span>
                  <span>5G</span>
                </div>
                <div className="my-auto space-y-2">
                  <span className="text-[9px] font-semibold text-slate-500">Amount Received</span>
                  <h4 className="text-lg font-black font-jakarta">₹2,00,000</h4>
                  <div className="w-10 h-10 bg-[#1D4ED8] rounded-full mx-auto flex items-center justify-center text-white shadow-lg ring-2 ring-blue-100">
                    <Check size={20} strokeWidth={3} />
                  </div>
                </div>
                <div className="text-[7px] text-slate-400 font-semibold border-t border-slate-100 pt-1 mt-auto">
                  Instant Transfer
                </div>
              </div>
            </div>
          </div>

          {/* Step 6 */}
          <div className="space-y-2">
            <h3 className="font-handwriting text-xl text-[#1D4ED8] font-bold">6. Move Forward</h3>
            <p className="text-sm text-slate-500">Solve today&apos;s problems. Focus on your dreams. We&apos;ll be with you.</p>
            <div className="rounded-2xl overflow-hidden shadow-md">
              <img src="/fintech/step6-celebrating-man.jpg" alt="Success" className="w-full h-[180px] object-cover" loading="lazy" />
            </div>
          </div>
        </div>

        {/* Promise Card (Mobile) */}
        <div className="bg-blue-50/90 border border-blue-200/80 rounded-2xl p-5 shadow-lg text-center space-y-3">
          <div>
            <span className="text-[12px] font-semibold text-[#1D4ED8]">Urgent money. Instant solution.</span>
            <h3 className="text-lg font-bold text-[#071A33] font-jakarta">
              That&apos;s the <span className="text-[#1D4ED8] font-black">Adyapan Promise.</span>
            </h3>
          </div>
          <Link
            href="#launchpad"
            onClick={handleScrollToLaunchpad}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-extrabold bg-[#1D4ED8] text-white shadow-lg cursor-pointer"
          >
            Check Eligibility <ArrowRight size={14} />
          </Link>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-600 pt-1">
            <span className="flex items-center gap-1">
              <Zap size={12} className="text-[#1D4ED8] fill-[#1D4ED8]" />
              Instant Disbursal
            </span>
            <span className="flex items-center gap-1">
              <FileText size={12} className="text-[#1D4ED8]" />
              Minimal Documents
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-[#1D4ED8]" />
              Flexible Repayment
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} className="text-[#1D4ED8]" />
              50K+ Customers
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero3DVisual;
