'use client';

import React from 'react';
import { ArrowRight, Clock, ShieldCheck, KeyRound, Rocket } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const WhatHappensNextPipeline: React.FC = () => {
  const stages = [
    {
      step: '01',
      title: 'Architectural Briefing in 15 Mins',
      desc: 'Our solutions engineering lead analyzes your volume band, license tier, and current core systems to prepare a bespoke integration blueprint.',
      icon: Clock,
      depthZ: -850,
      rotX: 18,
      stagger: 0.1,
    },
    {
      step: '02',
      title: 'Mutual NDA & Regulatory Scope',
      desc: 'Standardized institutional confidentiality agreements and statutory data protection protocols executed within 2 business hours.',
      icon: ShieldCheck,
      depthZ: -1050,
      rotX: 14,
      stagger: 0.25,
    },
    {
      step: '03',
      title: 'Sandbox & Tenant Provisioning',
      desc: 'Immediate staging environment credentials generated with mock bureau databases, UPI switches, and automated DTI test harness.',
      icon: KeyRound,
      depthZ: -1250,
      rotX: 10,
      stagger: 0.4,
    },
    {
      step: '04',
      title: 'Production Pilot & Disbursal Flow',
      desc: 'Controlled pilot disbursals go live with active-active redundant switchboards and dedicated 24/7 technical oversight.',
      icon: Rocket,
      depthZ: -1450,
      rotX: 8,
      stagger: 0.55,
    },
  ];

  return (
    <ScrollStage3D
      id="what-happens-next"
      perspective={1600}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-slate-50/70 border-b border-slate-200 text-[#071A33] select-none"
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
            <span>STAGE 06 // ONBOARDING MILESTONES</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              CLEAR MILESTONES.{' '}
              <span className="text-[#155EEF] block">IMMEDIATE VELOCITY.</span>
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
              No protracted bureaucratic delay. We operate on predictable, rapid delivery phases designed to move financial institutions from initial contact to live test disbursals in days.
            </p>
          </div>
        </div>

        {/* 4 Numbered Stages Arriving Sequentially */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stages.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={idx}
                data-depth-z={st.depthZ.toString()}
                data-rotate-x={st.rotX.toString()}
                data-scale="0.76"
                data-offset-y="75"
                data-blur="10"
                data-stagger={st.stagger.toString()}
                className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-[#155EEF] transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-sm font-mono font-black text-[#155EEF]">
                      STAGE {st.step}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#155EEF] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-black text-[#071A33] font-sans">
                    {st.title}
                  </h3>

                  <p className="text-xs text-slate-500 font-sans leading-relaxed">
                    {st.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-600">
                  <span>✓ GUARANTEED SLA</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollStage3D>
  );
};
