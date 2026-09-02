'use client';

import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Activity,
  Compass,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   InvisibleRoutingCorridor — "THE INVISIBLE CORRIDOR"
   ─────────────────────────────────────────────────────────────
   ▸ 3D Financial Infrastructure Tunnel:
     - Optical financial fiber corridor
     - Sub-second packet routing between clearinghouses
     - Zero intermediary hops
   ══════════════════════════════════════════════════════════════ */

interface CorridorFeature {
  id: string;
  name: string;
  metric: string;
  description: string;
}

const CORRIDOR_FEATURES: CorridorFeature[] = [
  { id: 'zero-hop', name: 'Zero-Intermediary Hop', metric: 'Direct STP', description: 'Eliminates cascading correspondent bank fees and unnecessary manual settlement delays.' },
  { id: 'gpi-tracking', name: 'SWIFT GPI Instant Tracking', metric: 'Real-Time UETR', description: 'Borrowers and enterprises track wire progress in real time across international switchboards.' },
  { id: 'sanctions', name: 'Automated AML/Sanctions Check', metric: '< 20ms Verification', description: 'Continuous screening against international watchlists ensures 100% regulatory compliance.' },
];

export const InvisibleRoutingCorridor: React.FC = () => {
  const [activeFeatureIdx, setActiveFeatureIdx] = useState<number>(0);
  const current = CORRIDOR_FEATURES[activeFeatureIdx];

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Layers className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>FINANCIAL INFRASTRUCTURE TUNNEL</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          The Invisible Corridor
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          High-throughput optical tunnels bypass traditional correspondent hops, routing transaction payloads directly from source clearinghouse to destination RTGS ledger.
        </p>
      </div>

      {/* 3 Infrastructure Corridor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1400px] mx-auto text-left">
        {CORRIDOR_FEATURES.map((feat, idx) => {
          const isSelected = activeFeatureIdx === idx;

          return (
            <div
              key={feat.id}
              onClick={() => setActiveFeatureIdx(idx)}
              className={`p-7 sm:p-8 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
                isSelected
                  ? 'bg-[#071A33] text-white border-blue-500/60 shadow-2xl scale-102 ring-2 ring-[#155EEF]/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full ${
                    isSelected ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {feat.metric}
                  </span>
                  <span className={`text-xs font-mono font-bold ${isSelected ? 'text-emerald-400' : 'text-[#155EEF]'}`}>
                    0{idx + 1}
                  </span>
                </div>

                <h3 className={`text-xl font-black ${isSelected ? 'text-white' : 'text-[#071A33]'}`}>
                  {feat.name}
                </h3>
                <p className={`text-xs leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {feat.description}
                </p>
              </div>

              <div className={`p-4 rounded-2xl font-mono text-xs flex justify-between items-center ${
                isSelected ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-100'
              }`}>
                <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>Corridor Status</span>
                <span className={`font-bold ${isSelected ? 'text-emerald-400' : 'text-[#155EEF]'}`}>Operational</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
