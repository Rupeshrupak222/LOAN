'use client';

import React, { useState } from 'react';
import { Cpu, ShieldCheck, CheckCircle2, Zap, ArrowRight } from 'lucide-react';

interface DecisionFactor {
  id: string;
  name: string;
  weight: string;
  status: string;
  metric: string;
}

const FACTORS: DecisionFactor[] = [
  { id: 'bureau', name: 'Credit Bureau History', weight: '35% Weight', status: 'Optimal (750+ CIBIL)', metric: 'Tradeline Stability' },
  { id: 'income', name: 'Banking Cash Flow', weight: '30% Weight', status: 'Recurring Inflow Verified', metric: 'AA Account Aggregator' },
  { id: 'dti', name: 'Debt-to-Income (DTI)', weight: '20% Weight', status: 'Healthy (<35% Ratio)', metric: 'Obligation Check' },
  { id: 'kyc', name: 'Identity & Fraud Shield', weight: '15% Weight', status: 'Zero Flags Detected', metric: 'Digilocker & Face Match' },
];

export const LendingDecisionCore: React.FC = () => {
  const [activeFactor, setActiveFactor] = useState<string>('bureau');

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Cpu className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>ALGORITHMIC UNDERWRITING</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Intelligent Real-Time Decision Core
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Multi-dimensional risk scoring evaluating banking cash flows, credit tradelines, and identity integrity in sub-second algorithmic evaluation.
        </p>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1400px] mx-auto text-left">
        {FACTORS.map((f) => {
          const isSelected = activeFactor === f.id;
          return (
            <div
              key={f.id}
              onClick={() => setActiveFactor(f.id)}
              className={`p-7 rounded-3xl border transition-all duration-300 cursor-pointer space-y-4 shadow-sm ${
                isSelected
                  ? 'bg-gradient-to-tr from-[#071A33] via-[#0F294D] to-[#155EEF] text-white border-[#155EEF] shadow-xl ring-2 ring-[#155EEF]/30 scale-[1.02]'
                  : 'bg-white text-[#071A33] border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    isSelected ? 'bg-white/10 text-blue-300 border-white/20' : 'bg-blue-50 text-[#155EEF] border-blue-200'
                  }`}
                >
                  {f.weight}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">PASSED</span>
              </div>

              <div>
                <h3 className="text-lg font-black">{f.name}</h3>
                <p className={`text-xs mt-1 font-mono ${isSelected ? 'text-emerald-300' : 'text-emerald-700 font-bold'}`}>
                  {f.status}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/30 text-[10px] font-mono opacity-80 flex justify-between">
                <span>Evaluation Channel:</span>
                <span className="font-bold">{f.metric}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
