'use client';

import React, { useState } from 'react';
import { Layers } from 'lucide-react';

export const LayeredTypographicStatement: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<number | null>(null);

  const SHEETS = [
    { word: 'INCOME', tag: '01 / GROSS MONTHLY BASELINE', value: '₹80,000 / mo', desc: 'Verified earnings and continuous cash inflows across primary accounts.' },
    { word: 'OBLIGATIONS', tag: '02 / CONSOLIDATED RECURRING DEBT', value: '₹18,000 / mo', desc: 'Pre-existing consumer loans, credit card installments, and statutory liabilities.' },
    { word: 'EXPOSURE', tag: '03 / SYSTEM-WIDE CREDIT LIMIT', value: '₹3,40,000 Pool', desc: 'Aggregate credit capacity sanctioned across institutional lenders.' },
    { word: 'DTI', tag: '04 / ARITHMETIC RATIO', value: '33.75% Calculated', desc: 'The mathematical proportion of recurring monthly debt relative to gross income.' },
    { word: 'POLICY', tag: '05 / INSTITUTIONAL DECISION CEILING', value: '40.0% Bound', desc: 'Underwriting threshold rules determining automated approval or manual review.' },
  ];

  return (
    <section
      id="section-layered-statement"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Technical Calibration Margins ── */}
      <div className="max-w-[1400px] mx-auto space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#155EEF]" />
              <span>TRANSPARENT DIAGNOSTIC LAYERS</span>
            </span>

            <h2
              className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
              style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
            >
              ONE NUMBER. <br />
              <span className="text-slate-400">MANY FINANCIAL SIGNALS.</span>
            </h2>
          </div>

          <p className="text-xs sm:text-sm font-mono text-slate-500 max-w-sm">
            Hover over any layer to isolate and inspect the underlying financial telemetry.
          </p>
        </div>

        {/* ── 5 HORIZONTAL SLIDING SHEETS COMPOSITION ── */}
        <div className="space-y-3">
          {SHEETS.map((sh, idx) => {
            const isHovered = activeLayer === idx;

            return (
              <div
                key={sh.word}
                onMouseEnter={() => setActiveLayer(idx)}
                onMouseLeave={() => setActiveLayer(null)}
                className={`p-6 sm:p-8 border transition-all duration-300 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isHovered
                    ? 'bg-[#071A33] text-white border-[#071A33] shadow-2xl translate-x-3'
                    : 'bg-[#F8FAFC] text-[#071A33] border-slate-200 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-baseline gap-6">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    LAYER 0{idx + 1}
                  </span>

                  <h3
                    className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none uppercase"
                    style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
                  >
                    {sh.word}
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6 lg:gap-12 pt-2 lg:pt-0">
                  <div className="space-y-0.5 text-left sm:text-right">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">
                      {sh.tag}
                    </div>
                    <div className={`text-base font-black font-mono ${isHovered ? 'text-cyan-300' : 'text-[#155EEF]'}`}>
                      {sh.value}
                    </div>
                  </div>

                  <p className={`text-xs max-w-xs leading-relaxed ${isHovered ? 'text-slate-300' : 'text-slate-500'}`}>
                    {sh.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
