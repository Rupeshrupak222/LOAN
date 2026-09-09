'use client';

import React from 'react';
import { BarChart3, ShieldCheck, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const RiskLandscape3D: React.FC = () => {
  const riskDimensions = [
    {
      dim: 'STABILITY',
      score: '92/100',
      status: 'HIGH RESILIENCE',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      detail: 'Consistent monthly earnings with minimal variance over 24 months.',
      depthZ: -800,
      rotX: 18,
      stagger: 0.1,
    },
    {
      dim: 'CAPACITY',
      score: '84/100',
      status: 'STRONG BUFFER',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      detail: 'Disposable income comfortably covers target loan installments with a 44% cushion.',
      depthZ: -1050,
      rotX: 14,
      stagger: 0.25,
    },
    {
      dim: 'OBLIGATION',
      score: '78/100',
      status: 'CONTROLLED LEVERAGE',
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      detail: 'Existing commitments are under 30% of verifiable cashflow; no unsecured clustering.',
      depthZ: -1250,
      rotX: 10,
      stagger: 0.4,
    },
    {
      dim: 'BEHAVIOUR',
      score: '88/100',
      status: 'DISCIPLINED CADENCE',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      detail: 'Prompt settlement history across utility and credit card auto-debits.',
      depthZ: -1450,
      rotX: 8,
      stagger: 0.55,
    },
  ];

  return (
    <ScrollStage3D
      id="scorecard-risk-landscape"
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
            <span>STAGE 05 // MULTI-FACETED RISK LANDSCAPE</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              SEE THE{' '}
              <span className="text-[#155EEF] block">SHAPE OF RISK.</span>
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
              Risk is not a flat label of high, medium, or low. It is a multi-dimensional geometry. An applicant might have moderate obligations but exceptional cashflow stability.
            </p>
          </div>
        </div>

        {/* 4 Risk Dimension Plates with 3D Elevation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {riskDimensions.map((rd, idx) => (
            <div
              key={idx}
              data-depth-z={rd.depthZ.toString()}
              data-rotate-x={rd.rotX.toString()}
              data-scale="0.76"
              data-offset-y="75"
              data-blur="10"
              data-stagger={rd.stagger.toString()}
              className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-[#155EEF] transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-mono font-black text-slate-400">
                    VECTOR 0{idx + 1}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${rd.color}`}>
                    {rd.status}
                  </span>
                </div>

                <h3 className="text-lg font-black text-[#071A33] font-sans">
                  {rd.dim}
                </h3>

                <div className="text-2xl font-black font-mono text-[#155EEF]">
                  {rd.score}
                </div>

                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  {rd.detail}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>CONFIDENCE: HIGH</span>
                <span>ILLUSTRATIVE VIEW</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollStage3D>
  );
};
