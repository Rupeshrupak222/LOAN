'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  TrendingUp,
  CreditCard,
  Building2,
  Clock,
} from 'lucide-react';
import { MagneticButton } from './MagneticButton';
import { AdyapanFinancialCore } from './AdyapanFinancialCore';
import { useMouseParallax } from './hooks/useMouseParallax';

export const CinematicHero: React.FC = () => {
  const mouseCoords = useMouseParallax(0.06);
  const [sequenceStage, setSequenceStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setSequenceStage(1), 100);  // Depth mesh & core point
    const t2 = setTimeout(() => setSequenceStage(2), 350);  // Financial path expands & 3D Core activates
    const t3 = setTimeout(() => setSequenceStage(3), 700);  // Headline word-by-word reveal
    const t4 = setTimeout(() => setSequenceStage(4), 1050); // Subtitle & CTAs slide in
    const t5 = setTimeout(() => setSequenceStage(5), 1400); // Floating telemetry cards appear

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  const words = ['Your', 'next', 'move', 'deserves', 'better', 'financing.'];

  // Parallax transforms based on depth layers
  const bgTransform = `translate3d(${mouseCoords.x * 4}px, ${mouseCoords.y * 4}px, 0)`;
  const coreTransform = `translate3d(${mouseCoords.x * 16}px, ${mouseCoords.y * 16}px, 0)`;
  const cardTransform = `translate3d(${mouseCoords.x * 22}px, ${mouseCoords.y * 22}px, 0)`;

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-between overflow-hidden pt-28 pb-16 bg-gradient-to-b from-[#FFFFFF] via-[#EAF4FF]/40 to-[#FFFFFF] text-[#071A33]">
      {/* Background Depth Mesh & Soft Ice-Blue Atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden transition-transform duration-700 ease-out"
        style={{ transform: bgTransform }}
      >
        {/* Soft Radial Ambient Lighting */}
        <div
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[550px] rounded-full blur-[140px] transition-all duration-1000 ${
            sequenceStage >= 1 ? 'opacity-50 scale-100' : 'opacity-0 scale-50'
          }`}
          style={{ background: 'radial-gradient(circle, #EAF4FF 0%, rgba(78, 168, 255, 0.15) 50%, transparent 75%)' }}
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(to right, #071A33 1px, transparent 1px), linear-gradient(to bottom, #071A33 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Word-by-Word Manifesto & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Top Pill */}
            <div
              className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-[#D3E5FA] shadow-xs mb-8 transition-all duration-700 ${
                sequenceStage >= 1
                  ? 'opacity-100 translate-y-0 blur-0'
                  : 'opacity-0 translate-y-4 blur-sm'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#155EEF]" />
                <span className="absolute w-5 h-5 rounded-full bg-[#155EEF] animate-ping opacity-60" />
              </div>
              <span className="text-xs font-mono tracking-[0.2em] text-[#071A33] uppercase font-bold">
                ADYAPAN 2.0 : FINANCIAL MOMENTUM
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-xs font-bold text-[#155EEF] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#155EEF] animate-pulse" />
                Live Sanctions Active
              </span>
            </div>

            {/* Headline Word-by-Word Cinematic Reveal */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#071A33] leading-[1.08] mb-6">
              {words.map((word, idx) => {
                const isHighlight = word.toLowerCase().includes('better') || word.toLowerCase().includes('financing.');
                return (
                  <span
                    key={idx}
                    className={`inline-block mr-3 transition-all duration-700 ${
                      sequenceStage >= 3
                        ? 'opacity-100 translate-y-0 filter-none'
                        : 'opacity-0 translate-y-6 blur-md'
                    }`}
                    style={{
                      transitionDelay: `${idx * 100}ms`,
                    }}
                  >
                    {isHighlight ? (
                      <span className="text-[#155EEF] font-black">
                        {word}
                      </span>
                    ) : (
                      word
                    )}
                  </span>
                );
              })}
            </h1>

            {/* Supporting Text Reveal */}
            <p
              className={`text-lg sm:text-xl text-[#526071] max-w-xl font-normal leading-relaxed mb-10 transition-all duration-700 ${
                sequenceStage >= 4
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
            >
              Simple, transparent and flexible loans designed around the things that matter to you. From merchant scaling to education and life milestones.
            </p>

            {/* Magnetic CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto transition-all duration-700 ${
                sequenceStage >= 4
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
            >
              <MagneticButton
                href="#selector"
                variant="primary"
                className="w-full sm:w-auto px-8 py-4 text-base font-bold"
              >
                <span>Check Eligibility</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </MagneticButton>

              <MagneticButton
                href="#calculator"
                variant="secondary"
                className="w-full sm:w-auto px-8 py-4 text-base font-bold"
              >
                <span>Explore Loans</span>
              </MagneticButton>
            </div>
          </div>

          {/* Right Column: 3D Glass Financial Sphere Canvas with Parallax */}
          <div
            className={`lg:col-span-5 relative flex items-center justify-center transition-all duration-1000 ${
              sequenceStage >= 2
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-75'
            }`}
            style={{ transform: coreTransform }}
          >
            {/* Custom 3D Financial Sphere Canvas */}
            <AdyapanFinancialCore
              mouseCoords={mouseCoords}
              className="w-full max-w-[480px] aspect-square"
            />

            {/* Floating Telemetry Info Card 01 */}
            <div
              className={`absolute -top-4 -right-2 p-4 rounded-2xl bg-white border border-[#D3E5FA] shadow-md transition-all duration-700 hidden sm:flex items-center gap-3 ${
                sequenceStage >= 5
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-4'
              }`}
              style={{ transform: cardTransform }}
            >
              <div className="w-10 h-10 rounded-xl bg-[#EAF4FF] flex items-center justify-center text-[#155EEF] font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-mono text-[#526071] uppercase font-bold">Average Disbursal</div>
                <div className="text-sm font-bold text-[#071A33]">90 Seconds flat</div>
              </div>
            </div>

            {/* Floating Telemetry Info Card 02 */}
            <div
              className={`absolute -bottom-4 -left-2 p-4 rounded-2xl bg-white border border-[#D3E5FA] shadow-md transition-all duration-700 hidden sm:flex items-center gap-3 ${
                sequenceStage >= 5
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
              style={{ transform: cardTransform }}
            >
              <div className="w-10 h-10 rounded-xl bg-[#EAF4FF] flex items-center justify-center text-[#155EEF] font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-mono text-[#526071] uppercase font-bold">Institutional Trust</div>
                <div className="text-sm font-bold text-[#071A33]">100% RBI NBFC Network</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Downward Scroll Indicator */}
      <div className="relative z-10 flex justify-center mt-6">
        <a
          href="#selector"
          className="p-2.5 rounded-full bg-white shadow-xs hover:shadow-sm border border-[#D3E5FA] text-[#526071] hover:text-[#071A33] transition-all animate-bounce"
          aria-label="Scroll to Loan Selection"
        >
          <ChevronDown className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
};
