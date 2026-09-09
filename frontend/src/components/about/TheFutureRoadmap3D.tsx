'use client';

import React from 'react';
import { Compass, CheckCircle2, ArrowRight, Sparkles, Orbit } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';
import { SketchFutureHorizon } from './sketches/SketchFutureHorizon';

export const TheFutureRoadmap3D: React.FC = () => {
  const horizons = [
    {
      label: 'HORIZON 01 // FOUNDATION',
      title: 'WHAT EXISTS',
      state: 'STABLE CORE',
      desc: 'Proven digital origination engines, 100% paperless DigiLocker e-KYC attestation, and automated debt-to-income calibration rules.',
      highlight: 'Production Validated',
      depthZ: -750,
      rotX: 18,
    },
    {
      label: 'HORIZON 02 // PLATFORM',
      title: 'WHAT WE BUILD',
      state: 'SCALING NOW',
      desc: 'Sub-millisecond core banking ledgers, modular Connect API gateways, and dynamic 4G IoT soundbox acoustic payment rails across India.',
      highlight: 'Active Deployment',
      depthZ: -1050,
      rotX: 14,
    },
    {
      label: 'HORIZON 03 // VISION',
      title: "WHAT'S NEXT",
      state: 'FORWARD HORIZON',
      desc: 'Seamless contextual credit lines on UPI payment journeys, predictive financial wellness telemetry, and autonomous regulatory reporting.',
      highlight: 'Forward Roadmap',
      depthZ: -1350,
      rotX: 10,
    },
  ];

  return (
    <ScrollStage3D
      id="about-future"
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
            <span>SECTION 09 // FORWARD PERSPECTIVE</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              WE'RE STILL{' '}
              <span className="text-[#155EEF] block">BUILDING.</span>
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
              India’s financial landscape is evolving at unprecedented speed. We build with long-term perspective—ensuring our infrastructure remains adaptable, scalable, and resilient for decades to come.
            </p>
          </div>
        </div>

        {/* ── 3-Horizon Forward Perspective Path ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {horizons.map((h, idx) => (
            <div
              key={idx}
              data-depth-z={h.depthZ.toString()}
              data-rotate-x={h.rotX.toString()}
              data-scale="0.78"
              data-offset-y="70"
              data-blur="8"
              data-stagger={(idx * 0.18).toFixed(2)}
              className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-[#155EEF] transition-all space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    {h.label}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#155EEF] text-[10px] font-mono font-bold">
                    {h.state}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-[#071A33] font-sans">
                  {h.title}
                </h3>

                <p className="text-xs text-slate-600 font-sans leading-relaxed">
                  {h.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-[#155EEF] font-bold">
                <span>{h.highlight}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>

        {/* ── Sketch 08: The Horizon Envelope Blueprint ── */}
        <div
          data-depth-z="-950"
          data-rotate-x="18"
          data-scale="0.82"
          data-offset-y="50"
          data-blur="8"
          data-stagger="0.4"
        >
          <SketchFutureHorizon />
        </div>
      </div>
    </ScrollStage3D>
  );
};
