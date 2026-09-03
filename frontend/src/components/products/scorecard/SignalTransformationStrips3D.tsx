'use client';

import React from 'react';
import { Layers, ArrowRight, Check, Activity, BarChart2 } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const SignalTransformationStrips3D: React.FC = () => {
  const signalStrips = [
    {
      name: 'INCOME HISTORY',
      raw: '360 Raw Ingress Credits · ₹4.8M Aggregate',
      normalized: 'Recurring Salary Sweep · Clean Monthly Cadence',
      insight: '₹1.45L Net Reliable Capacity (+8.4% Resilience)',
      confidence: '99.2%',
      depthZ: -800,
      rotX: 18,
      stagger: 0.1,
    },
    {
      name: 'CREDIT BEHAVIOUR',
      raw: 'Multi-Tradeline Bureau Feed · 8 Institutional Trades',
      normalized: '0 Delinquency Across 76 Months · Prime Vintage',
      insight: 'Exemplary Repayment Discipline · Zero Default Likelihood',
      confidence: '98.8%',
      depthZ: -1000,
      rotX: 14,
      stagger: 0.25,
    },
    {
      name: 'MONTHLY OBLIGATIONS',
      raw: 'ACH Debit Outflows · 14 Regular Payment Rails',
      normalized: 'Fixed EMI Isolation · ₹37,700 Structured Burden',
      insight: '26% Fixed DTI Ratio · 44% Available Buffer Margin',
      confidence: '99.5%',
      depthZ: -1200,
      rotX: 10,
      stagger: 0.4,
    },
    {
      name: 'PAYMENT PATTERNS',
      raw: 'Daily Merchant POS & UPI Event Stream',
      normalized: 'Consistent Balance Retention · No Shock Depletion',
      insight: '2.8 Months Liquidity Buffer · High Resilience Tier',
      confidence: '97.9%',
      depthZ: -1400,
      rotX: 8,
      stagger: 0.55,
    },
  ];

  return (
    <ScrollStage3D
      id="scorecard-signals"
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
            <span>STAGE 03 // SIGNAL TRANSFORMATION PIPELINE</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              FROM RAW SIGNALS{' '}
              <span className="text-[#155EEF] block">TO LENDING INSIGHT.</span>
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
              No generic black-box AI guessing. Raw transactional records pass through our structured normalization engine, transforming messy data into clear, explainable underwriting indicators.
            </p>
          </div>
        </div>

        {/* ── 4 Layered Financial Signal Strips Moving Through Precision Frame ── */}
        <div className="space-y-4">
          {signalStrips.map((strip, idx) => (
            <div
              key={idx}
              data-depth-z={strip.depthZ.toString()}
              data-rotate-x={strip.rotX.toString()}
              data-scale="0.8"
              data-offset-y="60"
              data-blur="8"
              data-stagger={strip.stagger.toString()}
              className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-[#155EEF] transition-all grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Column 1: Signal Label */}
              <div className="lg:col-span-3 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  SIGNAL LAYER 0{idx + 1}
                </span>
                <h3 className="text-base font-black text-[#071A33] font-sans">
                  {strip.name}
                </h3>
              </div>

              {/* Column 2: Raw vs Normalized Signal */}
              <div className="lg:col-span-5 space-y-2 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
                  <span className="text-[9px] text-slate-400 uppercase block">RAW TELEMETRY:</span>
                  <span className="text-[11px] font-medium">{strip.raw}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-[#155EEF]">
                  <span className="text-[9px] text-blue-500 uppercase block">NORMALIZED STRUCTURE:</span>
                  <span className="text-[11px] font-bold">{strip.normalized}</span>
                </div>
              </div>

              {/* Column 3: Underwriting Insight Result */}
              <div className="lg:col-span-4 p-4 rounded-xl bg-[#071A33] text-white space-y-1 font-mono text-xs">
                <div className="flex items-center justify-between text-[9px] text-cyan-400">
                  <span>UNDERWRITING INSIGHT</span>
                  <span>CONFIDENCE {strip.confidence}</span>
                </div>
                <p className="text-xs font-bold text-white font-sans leading-snug">
                  {strip.insight}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollStage3D>
  );
};
