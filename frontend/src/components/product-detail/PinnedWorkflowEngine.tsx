'use client';

import React from 'react';
import { ProductWorkflowStep } from '@/lib/productData';
import { ArrowRight, CheckCircle2, Cpu } from 'lucide-react';

interface PinnedWorkflowEngineProps {
  title: string;
  subtitle: string;
  steps: ProductWorkflowStep[];
}

export const PinnedWorkflowEngine: React.FC<PinnedWorkflowEngineProps> = ({
  title,
  subtitle,
  steps,
}) => {
  return (
    <section className="relative py-16 sm:py-24 bg-slate-900 text-white rounded-3xl overflow-hidden border border-slate-800 my-16">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#155EEF]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono text-[#7e9ef7] bg-blue-950/80 border border-blue-800">
            <Cpu className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>TRANSACTION & LIFECYCLE PIPELINE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Step Sequence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative rounded-2xl bg-slate-800/80 border border-slate-700/80 p-5 flex flex-col justify-between transition-all duration-300 hover:border-[#155EEF] hover:bg-slate-800 hover:-translate-y-1 shadow-lg group"
            >
              {/* Step number badge & connector */}
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-xl bg-[#155EEF] text-white font-mono font-black text-xs flex items-center justify-center shadow-md">
                  {step.step}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                  {step.techNode}
                </span>
              </div>

              {/* Title & description */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Sub-indicator */}
              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Protocol Node</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
