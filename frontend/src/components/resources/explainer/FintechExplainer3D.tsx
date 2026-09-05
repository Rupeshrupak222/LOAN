'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { FINTECH_CONCEPTS, FintechConcept } from '../data/resourcesData';
import { SplitTextEmergence3D } from '../motion/SplitTextEmergence3D';
import { ResourceEmergence3D } from '../motion/ResourceEmergence3D';

export const FintechExplainer3D: React.FC = () => {
  const [activeConceptId, setActiveConceptId] = useState<string>(FINTECH_CONCEPTS[0].id);

  const currentConcept =
    FINTECH_CONCEPTS.find((c) => c.id === activeConceptId) || FINTECH_CONCEPTS[0];

  return (
    <section className="relative py-20 sm:py-28 bg-white border-b border-slate-200/80 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        
        {/* Dual-Phrase "Text From Nowhere" Headline */}
        <div className="mb-14">
          <SplitTextEmergence3D
            eyebrow="EXPLAIN IT SIMPLY // SECTION 05"
            phrase1="COMPLEX FINANCE."
            phrase2="CLEAR EXPLANATIONS."
            description="Demystifying core financial rails into deterministic, step-by-step invariant stages."
            align="center"
          />
        </div>

        <ResourceEmergence3D initialZ={-900} rotateX={14} duration={1.1}>
          
          {/* Concept Selector Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
            {FINTECH_CONCEPTS.map((concept) => (
              <button
                key={concept.id}
                onClick={() => setActiveConceptId(concept.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeConceptId === concept.id
                    ? 'bg-[#071A33] text-white shadow-lg shadow-slate-900/20 ring-2 ring-[#155EEF]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {concept.name}
              </button>
            ))}
          </div>

          {/* Interactive Flow Visualizer Canvas */}
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-sm text-left">
            
            {/* Active Concept Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-[#155EEF] uppercase tracking-wider">
                  {currentConcept.category}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#071A33] tracking-tight mt-1">
                  {currentConcept.name} — {currentConcept.tagline}
                </h3>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>ACTIVE PIPELINE</span>
              </div>
            </div>

            {/* 5-Step Connected Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 my-10 relative">
              {currentConcept.steps.map((step, idx) => (
                <div
                  key={step.number}
                  className="relative p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between group hover:border-[#155EEF] hover:shadow-md transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono pb-3 border-b border-slate-100">
                      <span className="font-bold text-[#155EEF]">{step.number}</span>
                      <span className="text-slate-400">STAGE</span>
                    </div>

                    <h4 className="text-sm font-black text-[#071A33] mt-3 mb-2 font-mono tracking-tight">
                      {step.stage}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Technical Invariant Tag */}
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] font-mono text-[#155EEF] font-bold">
                    ✓ {step.technicalInvariant}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Invariant Callout */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-blue-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm text-slate-700 font-medium">
                  {currentConcept.summary}
                </p>
              </div>

              <span className="hidden sm:inline-block text-xs font-mono text-slate-400 whitespace-nowrap">
                ACID // DETERMINISTIC
              </span>
            </div>

          </div>

        </ResourceEmergence3D>
      </div>
    </section>
  );
};
