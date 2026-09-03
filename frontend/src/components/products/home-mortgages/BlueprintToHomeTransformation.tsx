'use client';

import React, { useState } from 'react';
import {
  Compass,
  FileText,
  Key,
  Home,
  Heart,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   BlueprintToHomeTransformation — "FROM BLUEPRINT TO HOME"
   ─────────────────────────────────────────────────────────────
   ▸ The emotional transition:
     1. Empty Space (The vision)
     2. Home Blueprint (Architectural precision)
     3. Financial Structure (Mortgage alignment)
     4. Key Handover (Registry & Possession)
     5. Living Home (Where life happens)
   ══════════════════════════════════════════════════════════════ */

interface StoryPhase {
  step: string;
  name: string;
  subtitle: string;
  quote: string;
  icon: React.ElementType;
}

const PHASES: StoryPhase[] = [
  {
    step: '01',
    name: 'The Vision & Space',
    subtitle: 'Imagining what comes next',
    quote: 'Every home begins with an idea of safety, belonging, and a space where your family can thrive.',
    icon: Compass,
  },
  {
    step: '02',
    name: 'The Architectural Plan',
    subtitle: 'Structuring the layout',
    quote: 'Turning aspirations into precise floor plans, dimensions, and natural daylight zones.',
    icon: FileText,
  },
  {
    step: '03',
    name: 'The Financing Alignment',
    subtitle: 'Long-tenure affordability',
    quote: 'Aligning mortgage payments with your household cash flow so financial peace is built into every month.',
    icon: Sparkles,
  },
  {
    step: '04',
    name: 'The Key Handover',
    subtitle: 'Possession & Registration',
    quote: 'The milestone moment where deeds are signed, keys are delivered, and ownership becomes real.',
    icon: Key,
  },
  {
    step: '05',
    name: 'The Living Home',
    subtitle: 'Where memories unfold',
    quote: 'Because a mortgage isn’t just a financial product. It’s a plan for where life happens next.',
    icon: Home,
  },
];

export const BlueprintToHomeTransformation: React.FC = () => {
  const [activePhaseIdx, setActivePhaseIdx] = useState<number>(4);
  const current = PHASES[activePhaseIdx];
  const Icon = current.icon;

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Heart className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>HUMAN MILESTONE TRANSFORMATION</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          From a Plan on Paper to a Place That Feels Like Yours
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Because a mortgage isn’t just a financial contract. It’s the structured bridge connecting your current ambition to your future home.
        </p>
      </div>

      {/* 5 Milestone Step Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8 max-w-[1400px] mx-auto text-left">
        {PHASES.map((ph, idx) => {
          const isSelected = activePhaseIdx === idx;
          const PhIcon = ph.icon;

          return (
            <button
              key={ph.step}
              onClick={() => setActivePhaseIdx(idx)}
              className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-lg shadow-[#155EEF]/20 scale-105'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono font-bold uppercase ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  Phase {ph.step}
                </span>
                <PhIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <h4 className="text-xs font-bold truncate">{ph.name}</h4>
            </button>
          );
        })}
      </div>

      {/* Main Narrative Display Card */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/50 p-8 sm:p-14 max-w-[1400px] mx-auto text-left shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#071A33] text-white flex items-center justify-center font-bold shadow-md">
            <Icon className="w-7 h-7 text-blue-300" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-[#155EEF] uppercase">PHASE {current.step} · {current.subtitle}</span>
            <h3 className="text-2xl sm:text-3xl font-black text-[#071A33]">{current.name}</h3>
          </div>
        </div>

        <p className="text-lg sm:text-xl text-slate-700 font-medium italic leading-relaxed border-l-4 border-[#155EEF] pl-5 py-1">
          "{current.quote}"
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 text-xs font-mono text-slate-500">
          <span>End-to-End DigiLocker e-Sign · Clear Legal Title Verification</span>
          <span className="font-bold text-[#155EEF]">Adyapan Sovereign Mortgage Standards</span>
        </div>
      </div>
    </section>
  );
};
