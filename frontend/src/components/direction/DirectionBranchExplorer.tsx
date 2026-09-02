'use client';

import React from 'react';
import Image from 'next/image';
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Quote,
  ShieldCheck,
  Zap,
  TrendingUp,
  CreditCard,
  Building,
  UserCheck,
  Check,
  AlertCircle,
} from 'lucide-react';
import { DirectionId, DIRECTIONS } from './directionData';

interface Props {
  activeDirection: DirectionId;
  onSelectDirection: (id: DirectionId) => void;
}

export const DirectionBranchExplorer: React.FC<Props> = ({
  activeDirection,
  onSelectDirection,
}) => {
  const current = DIRECTIONS[activeDirection];

  return (
    <section id="branches" className="relative py-24 bg-[#ffffff] text-slate-900 overflow-hidden">
      {/* Background subtle color wash */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-40 right-10 w-[600px] h-[600px] rounded-full blur-[160px] opacity-15 transition-all duration-700"
          style={{ backgroundColor: current.accentHex }}
        />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-mono text-indigo-700 uppercase tracking-widest mb-4 font-bold">
            <span>CHAPTER 02 : THE FORK IN THE ROAD</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
            The loan isn’t the hero.{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: `linear-gradient(135deg, ${current.accentHex} 0%, #4f46e5 100%)`,
              }}
            >
              Your ambition is.
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium">
            Traditional lenders force everyone into the same rigid box. Adyapan adapts its underwriting, speed, and tenure to the exact nature of your next move.
          </p>
        </div>

        {/* Direction Selector Tabs */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-12">
          {(Object.keys(DIRECTIONS) as DirectionId[]).map((key) => {
            const item = DIRECTIONS[key];
            const isSelected = activeDirection === key;
            const Icon = item.icon;

            return (
              <button
                key={key}
                onClick={() => onSelectDirection(key)}
                className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 border ${
                  isSelected
                    ? 'text-white border-transparent shadow-xl scale-105'
                    : 'text-slate-600 bg-slate-50 border-slate-200 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300'
                }`}
                style={{
                  backgroundColor: isSelected ? current.accentHex : undefined,
                  boxShadow: isSelected ? `0 10px 24px -4px ${current.accentHex}77` : undefined,
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Direction Spotlight Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Hand-Drawn Sketched Artwork & Real Narrative Card */}
          <div className="lg:col-span-6 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-card flex flex-col justify-between overflow-hidden group">
            {/* Sketched Artwork Image */}
            <div className="relative aspect-[4/3] w-full max-h-[340px] overflow-hidden bg-white border-b border-slate-200">
              <img
                src={current.imageSrc}
                alt={`${current.label} sketched illustration`}
                className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4">
                <span
                  className="text-xs font-mono font-bold px-3 py-1 rounded-full text-white shadow-md"
                  style={{ backgroundColor: current.accentHex }}
                >
                  {current.label}
                </span>
              </div>
              <div className="absolute bottom-4 right-4">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/95 text-emerald-700 shadow-md border border-slate-200">
                  {current.story.impactMetric}
                </span>
              </div>
            </div>

            {/* Content body below sketch */}
            <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
              <div>
                <div className="text-xs font-mono tracking-widest text-indigo-600 uppercase font-bold mb-2">
                  &ldquo;{current.story.hero}&rdquo;
                </div>
                <blockquote className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed italic mb-6">
                  &ldquo;{current.story.personaQuote}&rdquo;
                </blockquote>
              </div>

              {/* Persona Details & Funded Amount */}
              <div className="pt-5 border-t border-slate-200 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="font-bold text-slate-900 text-base">
                    {current.story.personaName}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {current.story.personaRole} • {current.story.personaLocation}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-slate-500 uppercase font-bold">
                    Funded Amount
                  </div>
                  <div
                    className="text-xl font-black font-mono"
                    style={{ color: current.accentHex }}
                  >
                    {current.story.amountFunded}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Engineered Specifically for This Direction */}
          <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 flex flex-col justify-between shadow-card">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">
                  Engineered Financial Blueprint
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                {current.shortTitle}
              </h3>
              <p className="text-slate-600 text-sm font-medium mb-6 leading-relaxed">
                {current.tagline}
              </p>

              {/* Key Features list */}
              <div className="space-y-3 mb-6">
                {current.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${current.accentHex}20`, color: current.accentHex }}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Recommended Scenarios */}
              <div className="mb-6">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold mb-2">
                  Common Milestones Funded:
                </div>
                <div className="flex flex-wrap gap-2">
                  {current.recommendedFor.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-semibold"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick action linking to simulator */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between flex-wrap gap-4">
              <div>
                <span className="text-xs text-slate-500 block font-medium">Starting Interest Rate</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  from {current.interestRate}% p.a.
                </span>
              </div>

              <a
                href="#simulator"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 hover:brightness-105 active:scale-95 shadow-md"
                style={{
                  backgroundColor: current.accentHex,
                  boxShadow: `0 8px 20px -4px ${current.accentHex}66`,
                }}
              >
                Customize Terms for {current.label.split(' ')[0]}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
