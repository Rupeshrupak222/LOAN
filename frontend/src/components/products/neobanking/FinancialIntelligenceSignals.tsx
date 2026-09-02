'use client';

import React, { useState } from 'react';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface SignalPoint {
  id: string;
  month: string;
  inflow: string;
  burn: string;
  runway: string;
  highlight: string;
}

const SIGNALS: SignalPoint[] = [
  { id: '1', month: 'Month 01 (Apr)', inflow: '₹34.2L', burn: '₹18.4L', runway: '16.2 Mo', highlight: 'Positive Working Capital' },
  { id: '2', month: 'Month 02 (May)', inflow: '₹41.8L', burn: '₹19.1L', runway: '15.8 Mo', highlight: 'SaaS Expansion Lift' },
  { id: '3', month: 'Month 03 (Jun)', inflow: '₹48.9L', burn: '₹21.4L', runway: '14.8 Mo', highlight: 'Optimal Tax Reserve' },
  { id: '4', month: 'Month 04 (Jul Proj)', inflow: '₹56.0L', burn: '₹22.0L', runway: '15.1 Mo', highlight: 'Projected Net Gain' },
];

export const FinancialIntelligenceSignals: React.FC = () => {
  const [selectedPoint, setSelectedPoint] = useState<SignalPoint>(SIGNALS[2]);

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>AUTONOMOUS TREASURY SIGNALS</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          See the Financial Signal, Not Just Numbers
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Interactive treasury intelligence analyzing operating cash velocity, seasonal burn rates, and automated working capital runway forecasting.
        </p>
      </div>

      {/* Spatial Graph Arena */}
      <div className="rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-12 max-w-[1400px] mx-auto shadow-2xl relative overflow-hidden text-left space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">Interactive Timeline</span>
            <h3 className="text-xl sm:text-2xl font-black text-white">4-Month Liquidity & Runway Trajectory</h3>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Selected: {selectedPoint.month}
          </span>
        </div>

        {/* Interactive Point Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SIGNALS.map((s) => {
            const isSelected = selectedPoint.id === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setSelectedPoint(s)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer font-mono text-xs ${
                  isSelected
                    ? 'bg-gradient-to-tr from-[#0F294D] to-[#155EEF] border-[#155EEF] shadow-lg scale-105'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <p className="text-[10px] text-slate-400 font-bold">{s.month}</p>
                <p className="text-base font-black text-white mt-1">{s.inflow}</p>
                <p className="text-[10px] text-emerald-300 mt-0.5">{s.highlight}</p>
              </div>
            );
          })}
        </div>

        {/* Detailed Signal Readout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <p className="text-slate-400 text-[10px]">MONTHLY CASH INFLOW</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{selectedPoint.inflow}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <p className="text-slate-400 text-[10px]">OPERATIONAL BURN</p>
            <p className="text-xl font-bold text-rose-400 mt-1">{selectedPoint.burn}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <p className="text-slate-400 text-[10px]">ESTIMATED RUNWAY</p>
            <p className="text-xl font-bold text-blue-300 mt-1">{selectedPoint.runway}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
