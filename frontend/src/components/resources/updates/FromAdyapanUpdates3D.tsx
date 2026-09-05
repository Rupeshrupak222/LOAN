'use client';

import React from 'react';
import {
  Sparkles,
  GitCommit,
  CheckCircle2,
  Calendar,
  Terminal,
} from 'lucide-react';
import { SYSTEM_UPDATES } from '../data/resourcesData';
import { ResourceEmergence3D } from '../motion/ResourceEmergence3D';

export const FromAdyapanUpdates3D: React.FC = () => {
  return (
    <section className="relative py-20 sm:py-28 bg-white border-b border-slate-200/80 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        <ResourceEmergence3D initialZ={-900} rotateX={14} duration={1.1}>
          
          {/* Section Heading */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-[#155EEF] bg-blue-50 border border-blue-200/80">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PLATFORM CHANGELOG // SECTION 09</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight font-sans">
              FROM ADYAPAN
            </h2>

            <p className="text-base sm:text-lg text-slate-600 font-normal">
              Verified platform releases, architecture upgrades, and technical security certifications.
            </p>
          </div>

          {/* Timeline List */}
          <div
            className="max-w-4xl mx-auto space-y-6 text-left"
            style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
          >
            {SYSTEM_UPDATES.map((update, idx) => (
              <div
                key={update.version}
                data-resource-card
                className="group relative p-6 sm:p-8 rounded-3xl bg-slate-50/70 border border-slate-200 hover:border-[#155EEF] hover:bg-white transition-all duration-300 shadow-xs hover:shadow-xl"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full font-bold bg-[#071A33] text-white">
                      {update.version}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-[#155EEF] border border-blue-200">
                      {update.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{update.date}</span>
                  </div>
                </div>

                <div className="my-4 space-y-2">
                  <h3 className="text-xl font-black text-[#071A33] tracking-tight group-hover:text-[#155EEF] transition-colors">
                    {update.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {update.description}
                  </p>
                </div>

                {/* Invariants Verified */}
                <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-600">
                  <span className="text-slate-400 font-bold">VERIFIED INVARIANTS:</span>
                  {update.invariantsVerified.map((inv, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{inv}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </ResourceEmergence3D>
      </div>
    </section>
  );
};
