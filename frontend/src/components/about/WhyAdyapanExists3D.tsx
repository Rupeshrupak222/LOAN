'use client';

import React from 'react';
import { Users, HeartHandshake, Landmark, Cpu, ArrowRight } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';
import { SketchBeginning } from './sketches/SketchBeginning';

export const WhyAdyapanExists3D: React.FC = () => {
  const layers = [
    {
      num: '01',
      title: 'PEOPLE',
      tag: 'REAL HUMAN MOMENTS',
      desc: 'Behind every loan application is a student preparing for university, an entrepreneur expanding inventory, or a family buying their first home.',
      icon: Users,
      depthZ: -700,
      rotX: 18,
      rotY: -12,
      stagger: 0.1,
    },
    {
      num: '02',
      title: 'NEEDS',
      tag: 'FINANCIAL ACCESSIBILITY',
      desc: 'Real life does not pause for bureaucratic paperwork, opaque interest schedules, or weeks of manual branch verification.',
      icon: HeartHandshake,
      depthZ: -1000,
      rotX: -14,
      rotY: 10,
      stagger: 0.25,
    },
    {
      num: '03',
      title: 'FINANCE',
      tag: 'RESPONSIBLE CAPITAL',
      desc: 'Partnering with RBI-registered institutional lenders to ensure transparent terms, fair pricing, and strict adherence to lending guidelines.',
      icon: Landmark,
      depthZ: -1300,
      rotX: 16,
      rotY: -8,
      stagger: 0.4,
    },
    {
      num: '04',
      title: 'TECHNOLOGY',
      tag: 'INTELLIGENT RAILS',
      desc: 'Synchronizing digital identity, automated underwriting, and instant core banking rails into a fluid, sub-minute origination experience.',
      icon: Cpu,
      depthZ: -900,
      rotX: 10,
      rotY: 12,
      stagger: 0.55,
    },
  ];

  return (
    <ScrollStage3D
      id="about-why-exists"
      perspective={1600}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-slate-50/70 border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto space-y-16 text-left">
        {/* Header Block Emerging from Depth */}
        <div className="max-w-3xl space-y-4">
          <div
            data-depth-z="-450"
            data-rotate-x="18"
            data-offset-y="30"
            data-scale="0.9"
            data-blur="4"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs"
          >
            <span>SECTION 01 // PURPOSE & PHILOSOPHY</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              FINANCIAL TECHNOLOGY{' '}
              <span className="text-[#155EEF] block">SHOULD MOVE WITH PEOPLE.</span>
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
              Financial services should not feel like an obstacle course. Adyapan was created to eliminate the friction that sits between an individual’s ambition and the institutional capital that powers it.
            </p>
          </div>
        </div>

        {/* ── 4 Physical Layers Emerging from Deep 3D Space ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {layers.map((layer, idx) => {
            const Icon = layer.icon;
            return (
              <div
                key={idx}
                data-depth-z={layer.depthZ.toString()}
                data-rotate-x={layer.rotX.toString()}
                data-rotate-y={layer.rotY.toString()}
                data-scale="0.75"
                data-offset-y="75"
                data-blur="10"
                data-stagger={layer.stagger.toString()}
                className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-[#155EEF] transition-all space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-mono font-black text-[#155EEF]">
                      LAYER {layer.num}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#155EEF] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    {layer.tag}
                  </span>

                  <h3 className="text-xl font-black text-[#071A33] font-sans">
                    {layer.title}
                  </h3>

                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    {layer.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono font-bold text-slate-400">
                  <span>DIMENSION 0{idx + 1} OF 04</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Sketch 01: The Beginning Architectural Blueprint ── */}
        <div
          data-depth-z="-950"
          data-rotate-x="20"
          data-scale="0.82"
          data-offset-y="50"
          data-blur="8"
          data-stagger="0.35"
        >
          <SketchBeginning />
        </div>

        {/* Final Alignment Message */}
        <div
          data-depth-z="-750"
          data-rotate-x="18"
          data-scale="0.85"
          data-offset-y="40"
          data-blur="6"
          data-stagger="0.45"
          className="p-7 rounded-2xl bg-white border border-slate-200/90 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-sans text-slate-600"
        >
          <div className="space-y-1">
            <span className="font-bold font-mono text-[#071A33] uppercase block text-sm">
              ONE CONNECTED FINANCIAL JOURNEY.
            </span>
            <p>
              When people, real needs, responsible capital, and intelligent technology are synchronized into a single unified architecture, financial access becomes natural, transparent, and empowering.
            </p>
          </div>

          <span className="shrink-0 px-3.5 py-2 rounded-xl bg-blue-50 font-mono text-xs font-bold text-[#155EEF] border border-blue-200">
            ALIGNMENT COMPLETED
          </span>
        </div>
      </div>
    </ScrollStage3D>
  );
};
