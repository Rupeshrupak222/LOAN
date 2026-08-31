'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Compass,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { DirectionId, DIRECTIONS } from './directionData';

interface Props {
  activeDirection: DirectionId;
  onSelectDirection: (id: DirectionId) => void;
}

export const DirectionHero: React.FC<Props> = ({
  activeDirection,
  onSelectDirection,
}) => {
  const current = DIRECTIONS[activeDirection];
  const [hoveredDirection, setHoveredDirection] = useState<DirectionId | null>(null);

  const activeData = hoveredDirection ? DIRECTIONS[hoveredDirection] : current;

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-between overflow-hidden pt-28 pb-16 bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#ffffff] text-slate-900">
      {/* Soft Ambient Mesh Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] rounded-full blur-[140px] transition-all duration-1000 opacity-20"
          style={{ backgroundColor: activeData.accentHex }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-0 w-[450px] h-[450px] bg-teal-500/10 rounded-full blur-[120px]" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center text-center">
        {/* Chapter 01 Pill */}
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm backdrop-blur-xl mb-8 animate-fade-up">
          <div className="relative flex items-center justify-center">
            <span
              className="w-2.5 h-2.5 rounded-full transition-colors duration-500"
              style={{ backgroundColor: current.accentHex }}
            />
            <span
              className="absolute w-5 h-5 rounded-full animate-ping opacity-75 transition-colors duration-500"
              style={{ backgroundColor: current.accentHex }}
            />
          </div>
          <span className="text-xs font-mono tracking-[0.2em] text-slate-700 uppercase font-bold">
            CHAPTER 01 : YOUR NEXT MOVE
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sanctions Active
          </span>
        </div>

        {/* Main Manifesto Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 max-w-5xl leading-[1.08] mb-6">
          Every goal has a next move.{' '}
          <span
            className="block text-transparent bg-clip-text transition-all duration-700"
            style={{
              backgroundImage: `linear-gradient(135deg, ${activeData.accentHex} 0%, #4f46e5 50%, #0d9488 100%)`,
            }}
          >
            Give yours the right direction.
          </span>
        </h1>

        {/* Narrative Subtitle */}
        <p className="text-lg sm:text-xl text-slate-600 max-w-3xl font-medium leading-relaxed mb-10">
          You don’t just need a loan. You need momentum. Choose what you are building, and Adyapan routes institutional credit directly to your ambition in 90 seconds.
        </p>

        {/* Sketched Hero Story Artwork Banner */}
        <div className="w-full max-w-4xl mb-12 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 bg-white group relative">
          <div className="relative aspect-[16/9] w-full max-h-[380px]">
            <img
              src="/images/hero_journey_sketch.jpg"
              alt="Ambition Unleashed - Indian strivers on the glowing journey path"
              className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
            />
            {/* Soft bottom gradient overlay for caption */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-6 sm:p-8 text-left text-white">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-300 mb-1 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>The Story of Moving Forward</span>
              </div>
              <p className="text-sm sm:text-base font-semibold max-w-2xl text-slate-100">
                120,000+ ambitious creators, students, shop owners & families turning their next move into reality with zero-friction digital credit.
              </p>
            </div>
          </div>
        </div>

        {/* The 5-Branch Direction Weaver HUD */}
        <div className="w-full max-w-5xl my-2">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center justify-center gap-2 font-bold">
            <Compass className="w-4 h-4 text-indigo-600 animate-spin" style={{ animationDuration: '14s' }} />
            <span>Select Your Direction — The Whole Page Adapts</span>
          </div>

          {/* Interactive Direction Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {(Object.keys(DIRECTIONS) as DirectionId[]).map((key) => {
              const item = DIRECTIONS[key];
              const Icon = item.icon;
              const isSelected = activeDirection === key;

              return (
                <button
                  key={key}
                  onClick={() => onSelectDirection(key)}
                  onMouseEnter={() => setHoveredDirection(key)}
                  onMouseLeave={() => setHoveredDirection(null)}
                  className={`group relative p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 flex flex-col justify-between border overflow-hidden shadow-sm hover:shadow-md ${
                    isSelected
                      ? 'bg-white border-2 shadow-xl scale-[1.03]'
                      : 'bg-white/80 border-slate-200/90 hover:bg-white hover:border-slate-300'
                  }`}
                  style={{
                    borderColor: isSelected ? item.accentHex : undefined,
                  }}
                >
                  {/* Subtle directional background glow */}
                  <div
                    className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl transition-opacity duration-300 ${
                      isSelected ? 'opacity-30' : 'opacity-0 group-hover:opacity-15'
                    }`}
                    style={{ backgroundColor: item.accentHex }}
                  />

                  {/* Icon & Active Indicator */}
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                      style={{
                        backgroundColor: isSelected ? item.accentHex : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#475569',
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {isSelected && (
                      <span className="flex h-2 w-2 relative">
                        <span
                          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                          style={{ backgroundColor: item.accentHex }}
                        />
                        <span
                          className="relative inline-flex rounded-full h-2 w-2"
                          style={{ backgroundColor: item.accentHex }}
                        />
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="relative z-10">
                    <div
                      className={`text-xs font-black tracking-wider font-mono uppercase mb-1 transition-colors ${
                        isSelected ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 font-medium">
                      {item.shortTitle}
                    </div>
                  </div>

                  {/* Bottom selection accent strip */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 transition-all duration-300 ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                    }`}
                    style={{ backgroundColor: item.accentHex }}
                  />
                </button>
              );
            })}
          </div>

          {/* Active Direction Live Telemetry Banner */}
          <div className="mt-6 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-card flex flex-col md:flex-row items-center justify-between gap-5 text-left">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-white shadow-md"
                style={{ backgroundColor: current.accentHex }}
              >
                <current.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase">
                    ACTIVE PATHWAY:
                  </span>
                  <span
                    className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: current.accentHex }}
                  >
                    {current.label}
                  </span>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {current.speedBadge}
                  </span>
                </div>
                <p className="text-sm text-slate-700 mt-1.5 font-medium">
                  {current.tagline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
              <a
                href="#simulator"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 text-white shadow-lg hover:brightness-105 active:scale-95"
                style={{
                  backgroundColor: current.accentHex,
                  boxShadow: `0 8px 24px -4px ${current.accentHex}66`,
                }}
              >
                Simulate Your Move
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#branches"
                className="inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                View Hand-Drawn Blueprint
              </a>
            </div>
          </div>
        </div>

        {/* Narrative Flow Stepper */}
        <div className="mt-8 flex items-center justify-center gap-2 sm:gap-4 text-xs font-mono text-slate-500 flex-wrap font-semibold">
          <span className="text-slate-900 font-bold">1. Choose Goal</span>
          <span className="text-slate-300">→</span>
          <span className="text-indigo-600 font-bold">2. Pick Direction</span>
          <span className="text-slate-300">→</span>
          <span className="text-indigo-600 font-bold">3. Auto Financial Path</span>
          <span className="text-slate-300">→</span>
          <span className="text-emerald-600 font-bold">4. Move Forward</span>
        </div>
      </div>

      {/* Trust & Key Stats Strip */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-12 pt-8 border-t border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">₹2,400 Cr+</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Disbursed with Zero Friction</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">90 Seconds</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Application to Bank Account</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="text-2xl sm:text-3xl font-black text-indigo-600 tracking-tight">₹0 Hidden</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Absolute Fee Transparency</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">100% RBI Network</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Regulated NBFC Capital Ally</div>
          </div>
        </div>
      </div>

      {/* Downward indicator */}
      <div className="relative z-10 flex justify-center mt-6">
        <a
          href="#branches"
          className="p-2.5 rounded-full bg-white shadow-sm hover:shadow-md border border-slate-200 text-slate-600 hover:text-slate-900 transition-all animate-bounce"
          aria-label="Scroll to Branch Exploration"
        >
          <ChevronDown className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
};
