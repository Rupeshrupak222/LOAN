'use client';

import React from 'react';
import { Cpu, ShieldCheck, Scale, Zap, CheckCircle2 } from 'lucide-react';

export const BuiltForScaleGrid: React.FC = () => {
  const PILLARS = [
    {
      icon: Cpu,
      title: 'AI-Native Audit Core',
      desc: 'Built with intelligent event-stream agents and automated parity reconcilers that monitor for data mutations and schema drift 24/7 across banking and lending rails.',
    },
    {
      icon: ShieldCheck,
      title: 'Unified & Comprehensive Stack',
      desc: 'Streamline audit operations by consolidating event trails across card management, UPI autopay, bureau checks, and core loan servicing into one cohesive, append-only stratum.',
    },
    {
      icon: Scale,
      title: 'Future-Ready & Court Compliant',
      desc: 'Stay ahead of financial regulations with automated Section 65B certificates, FIPS 140-2 Level 3 HSM signing, and immutable WORM hardware object locking.',
    },
    {
      icon: Zap,
      title: 'Sub-Second Forensic GTM',
      desc: 'Pre-integrated compliance schemas, high-throughput gRPC buses, and sub-millisecond query indices allow your risk team to clear central bank inspections in record time.',
    },
  ];

  return (
    <section
      id="built-for-scale-grid"
      className="py-16 sm:py-24 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] border-b border-slate-200"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-[1400px] mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#155EEF] border border-blue-200 rounded-full text-xs font-semibold tracking-wide">
            <span>FINANCIAL INFRASTRUCTURE ADVANTAGE</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-extrabold text-[#071A33] tracking-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Built for Speed, Scale, & Intelligence
          </h2>

          <p className="text-base text-slate-600 font-sans">
            Engineered from first principles for Tier-1 banks, NBFCs, and financial platforms requiring zero-compromise regulatory fidelity.
          </p>
        </div>

        {/* ── 4-QUADRANT GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PILLARS.map((p) => {
            const Icon = p.icon;

            return (
              <div
                key={p.title}
                className="p-8 sm:p-10 bg-[#F8FAFC] border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-4 text-left flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#155EEF]">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3
                    className="text-xl sm:text-2xl font-bold text-[#071A33] tracking-tight"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {p.title}
                  </h3>

                  <p className="text-sm text-slate-600 font-sans leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 text-xs font-semibold text-[#155EEF] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Enterprise SLA Guaranteed</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
