'use client';

import React from 'react';
import { Lightbulb, Wrench, Network, Compass, ArrowRight } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';
import { SketchJourneyLine } from './sketches/SketchJourneyLine';

export const AdyapanEvolution3D: React.FC = () => {
  const evolutionSteps = [
    {
      num: '01',
      stage: 'THE IDEA',
      title: 'A Question of Friction',
      desc: 'Why should credit origination take days of branch visits and physical paperwork when technology can securely verify identity and cashflow in seconds?',
      icon: Lightbulb,
      depthZ: -750,
      rotX: 18,
      stagger: 0.1,
    },
    {
      num: '02',
      stage: 'THE PRODUCT',
      title: 'Engineered Precision',
      desc: 'We built purpose-driven financial microservices: automated DTI calibration, DigiLocker e-KYC attestation, and immutable WORM audit ledgers.',
      icon: Wrench,
      depthZ: -1000,
      rotX: 14,
      stagger: 0.25,
    },
    {
      num: '03',
      stage: 'THE PLATFORM',
      title: 'Unified Architecture',
      desc: 'Connecting retail lending, SME business lines, core banking engines, and NPCI payment rails into one resilient, modular financial operating system.',
      icon: Network,
      depthZ: -1250,
      rotX: 10,
      stagger: 0.4,
    },
    {
      num: '04',
      stage: 'THE FUTURE',
      title: 'Everyday Mobility',
      desc: 'Engineering the next generation of contextual, instant, and transparent financial mobility so institutions can serve borrowers with unmatched dignity and speed.',
      icon: Compass,
      depthZ: -1450,
      rotX: 8,
      stagger: 0.55,
    },
  ];

  return (
    <ScrollStage3D
      id="about-evolution"
      perspective={1600}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-white border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto space-y-16 text-left">
        {/* Header Block */}
        <div className="max-w-3xl space-y-4">
          <div
            data-depth-z="-450"
            data-rotate-x="18"
            data-offset-y="30"
            data-scale="0.9"
            data-blur="4"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase"
          >
            <span>SECTION 02 // PRESENT-FOCUSED TRAJECTORY</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              WHERE WE STARTED.{' '}
              <span className="text-[#155EEF] block">WHERE WE'RE GOING.</span>
            </h2>
          </div>

          <div
            data-depth-z="-600"
            data-rotate-y="-8"
            data-offset-y="40"
            data-blur="6"
            data-stagger="0.2"
          >
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
              We focus on the continuous evolution of our technology stack. From a single automated underwriting calculation to an enterprise lending fabric spanning modern banking rails.
            </p>
          </div>
        </div>

        {/* ── 4-Stage Visual Evolution Across 3D Depth ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {evolutionSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                data-depth-z={step.depthZ.toString()}
                data-rotate-x={step.rotX.toString()}
                data-scale="0.76"
                data-offset-y="75"
                data-blur="10"
                data-stagger={step.stagger.toString()}
                className="p-7 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-xs hover:bg-white hover:border-[#155EEF] transition-all flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-mono font-bold text-[#155EEF]">
                      PHASE {step.num}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#155EEF] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    {step.stage}
                  </span>

                  <h3 className="text-lg font-black text-[#071A33] font-sans">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-400 font-bold">
                  <span>STEP 0{idx + 1} OF 04</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Sketch 02: Continuous Hand-Drawn Journey Line ── */}
        <div
          data-depth-z="-950"
          data-rotate-x="18"
          data-scale="0.82"
          data-offset-y="50"
          data-blur="8"
          data-stagger="0.4"
        >
          <SketchJourneyLine />
        </div>
      </div>
    </ScrollStage3D>
  );
};
