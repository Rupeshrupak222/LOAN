'use client';

import React, { useState } from 'react';
import { Minimize2, Zap, ShieldCheck, Sparkles, Lock, CheckCircle2 } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const HowWeThinkPrinciples3D: React.FC = () => {
  const [activePrinciple, setActivePrinciple] = useState(0);

  const principles = [
    {
      id: 0,
      name: 'SIMPLICITY',
      action: 'Remove Unnecessary Complexity.',
      desc: 'Financial infrastructure is inherently complex, but user journeys must never be. We strip away redundant paperwork, confusing terms, and nested forms to build intuitive clarity.',
      icon: Minimize2,
      depthZ: -750,
      rotX: 18,
      stagger: 0.1,
    },
    {
      id: 1,
      name: 'SPEED',
      action: 'Move at the Speed of Life.',
      desc: 'When an emergency strikes or an opportunity arises, days of waiting are intolerable. Our pipelines execute identity attestation and credit decisioning in sub-second intervals.',
      icon: Zap,
      depthZ: -950,
      rotX: 14,
      stagger: 0.2,
    },
    {
      id: 2,
      name: 'TRUST',
      action: 'Treat Every Interaction with Care.',
      desc: 'Trust is not bought through marketing slogans; it is earned through 100% mathematical consistency, zero hidden charges, and transparent loan terms.',
      icon: ShieldCheck,
      depthZ: -1150,
      rotX: 10,
      stagger: 0.3,
    },
    {
      id: 3,
      name: 'INTELLIGENCE',
      action: 'Make Decisions Clear & Explainable.',
      desc: 'We reject opaque black-box scoring. Our multi-pillar models turn disparate account signals into human-understandable underwriting reasons.',
      icon: Sparkles,
      depthZ: -1350,
      rotX: 8,
      stagger: 0.4,
    },
    {
      id: 4,
      name: 'RESPONSIBILITY',
      action: 'Engineer for Maximum Resilience.',
      desc: 'Security is not an afterthought. We implement append-only audit ledgers, zero-trust cryptographic boundaries, and strict regulatory alignment by default.',
      icon: Lock,
      depthZ: -1550,
      rotX: 6,
      stagger: 0.5,
    },
  ];

  return (
    <ScrollStage3D
      id="about-principles"
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
            <span>SECTION 05 // OPERATIONAL VALUES</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              THE WAY WE BUILD{' '}
              <span className="text-[#155EEF] block">MATTERS.</span>
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
              Great financial technology is not accidental. It is governed by deliberate architectural principles that guide every API schema, user interaction, and compliance review.
            </p>
          </div>
        </div>

        {/* ── 5 Interactive Principle Planes with 3D Depth ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Principle Tabs */}
          <div className="lg:col-span-5 space-y-3">
            {principles.map((p) => {
              const Icon = p.icon;
              const isActive = activePrinciple === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePrinciple(p.id)}
                  className={`w-full p-4.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-white border-[#155EEF] shadow-md shadow-[#155EEF]/10 text-[#155EEF]'
                      : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-[#155EEF] text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold block">
                        0{p.id + 1} // {p.name}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 font-sans">
                        {p.action}
                      </span>
                    </div>
                  </div>
                  {isActive && <CheckCircle2 className="w-4 h-4 text-[#155EEF]" />}
                </button>
              );
            })}
          </div>

          {/* Right Column: Active Principle Focus Frame (Emerges from Z: -1000px) */}
          <div
            data-depth-z="-1000"
            data-rotate-x="20"
            data-scale="0.8"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.3"
            className="lg:col-span-7 p-8 sm:p-10 rounded-3xl bg-[#071A33] text-white shadow-xl space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 font-mono text-xs">
              <span className="text-cyan-400 font-bold uppercase tracking-wider">
                ACTIVE PRINCIPLE CODEX
              </span>
              <span className="text-slate-400">
                0{activePrinciple + 1} OF 05
              </span>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-mono text-cyan-300 font-bold uppercase tracking-wider block">
                {principles[activePrinciple].name}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black font-sans text-white">
                {principles[activePrinciple].action}
              </h3>
              <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed pt-2">
                {principles[activePrinciple].desc}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>ARCHITECTURAL MANDATE</span>
              <span className="text-emerald-400 font-bold">✓ VERIFIED BY DESIGN</span>
            </div>
          </div>
        </div>
      </div>
    </ScrollStage3D>
  );
};
