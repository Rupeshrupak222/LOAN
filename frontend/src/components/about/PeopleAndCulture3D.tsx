'use client';

import React from 'react';
import { Search, Crosshair, Users2, Heart, Hammer, ArrowRight } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const PeopleAndCulture3D: React.FC = () => {
  const principles = [
    {
      word: 'CURIOUS',
      meaning: 'Questioning Friction',
      desc: 'We refuse to accept that financial processes must be tedious simply because "that is how banking has always been done."',
      icon: Search,
      depthZ: -750,
      rotX: 18,
      stagger: 0.1,
    },
    {
      word: 'PRECISE',
      meaning: 'Mathematical Rigor',
      desc: 'Financial ledgers do not allow for approximations. Every transaction, decimal, and audit log must balance to absolute zero.',
      icon: Crosshair,
      depthZ: -950,
      rotX: 14,
      stagger: 0.2,
    },
    {
      word: 'COLLABORATIVE',
      meaning: 'Ecosystem First',
      desc: 'We engineer in deep alignment with regulated NBFC partners, national payment switches, and statutory compliance bodies.',
      icon: Users2,
      depthZ: -1150,
      rotX: 10,
      stagger: 0.3,
    },
    {
      word: 'CUSTOMER-FOCUSED',
      meaning: 'Human Empathy',
      desc: 'We remember that at the receiving end of every API response is a real person seeking dignity, clarity, and speed.',
      icon: Heart,
      depthZ: -1350,
      rotX: 8,
      stagger: 0.4,
    },
    {
      word: 'ALWAYS BUILDING',
      meaning: 'Relentless Craft',
      desc: 'Software is never truly finished. We continuously profile, calibrate, and elevate the reliability of our financial rails.',
      icon: Hammer,
      depthZ: -1550,
      rotX: 6,
      stagger: 0.5,
    },
  ];

  return (
    <ScrollStage3D
      id="about-people"
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
            <span>SECTION 04 // BUILDERS & CULTURE</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              TECHNOLOGY IS{' '}
              <span className="text-[#155EEF] block">BUILT BY PEOPLE.</span>
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
              Algorithms do not understand financial stress; human engineers do. The culture that creates Adyapan is grounded in precision, humility, and an unrelenting passion for financial craft.
            </p>
          </div>
        </div>

        {/* ── 5 Conceptual Culture Plates with Abstract Typographic Silhouettes ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                data-depth-z={p.depthZ.toString()}
                data-rotate-x={p.rotX.toString()}
                data-scale="0.78"
                data-offset-y="70"
                data-blur="8"
                data-stagger={p.stagger.toString()}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 hover:bg-white hover:border-[#155EEF] transition-all flex flex-col justify-between space-y-6 shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      0{idx + 1}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#155EEF] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-[#071A33] font-sans tracking-tight">
                    {p.word}
                  </h3>

                  <span className="text-[11px] font-mono font-bold text-[#155EEF] uppercase block">
                    {p.meaning}
                  </span>

                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 text-[10px] font-mono text-slate-400 font-bold uppercase">
                  <span>CULTURE CODE // 0{idx + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollStage3D>
  );
};
