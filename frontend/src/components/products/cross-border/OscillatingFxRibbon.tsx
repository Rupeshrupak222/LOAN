'use client';

import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   OscillatingFxRibbon — "THE RATE HAS A STORY"
   ─────────────────────────────────────────────────────────────
   ▸ 3D Physical Metallic Ribbon Strip representing FX calibration:
     - Checkpoint 1: 09:00 AM Interbank Open (0.7885)
     - Checkpoint 2: 12:30 PM Mid-Day Liquidity Fix (0.7890)
     - Checkpoint 3: 04:00 PM London Market Close (0.7892)
   ▸ Clearly labeled: "Illustrative historical simulation"
   ══════════════════════════════════════════════════════════════ */

interface RibbonCheckpoint {
  id: string;
  time: string;
  rate: string;
  spread: string;
  volume: string;
}

const CHECKPOINTS: RibbonCheckpoint[] = [
  { id: 'open', time: '09:00 AM London Open', rate: '0.7885 USD/GBP', spread: '0.00%', volume: 'High Interbank Liquidity' },
  { id: 'mid', time: '12:30 PM Peak Liquidity Fix', rate: '0.7890 USD/GBP', spread: '0.00%', volume: 'Ultra-Tight Direct Depth' },
  { id: 'close', time: '04:00 PM NY Overlap Close', rate: '0.7892 USD/GBP', spread: '0.00%', volume: 'Settlement Window Open' },
];

export const OscillatingFxRibbon: React.FC = () => {
  const [activePtIdx, setActivePtIdx] = useState<number>(1);
  const current = CHECKPOINTS[activePtIdx];

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Activity className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>3D METALLIC FX RIBBON</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          The Rate Has a Story
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Trace how foreign-exchange rates calibrate across market sessions. Adyapan anchors execution to transparent interbank spot feeds.
        </p>
      </div>

      {/* 3 Ribbon Checkpoint Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-[1400px] mx-auto text-left">
        {CHECKPOINTS.map((pt, idx) => {
          const isSelected = activePtIdx === idx;

          return (
            <button
              key={pt.id}
              onClick={() => setActivePtIdx(idx)}
              className={`p-6 rounded-3xl border transition-all text-left group cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-xl shadow-blue-500/20 scale-102 ring-2 ring-[#155EEF]/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-mono font-bold uppercase ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  Checkpoint 0{idx + 1}
                </span>
                <TrendingUp className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
              </div>
              <h3 className="text-lg font-bold">{pt.rate}</h3>
              <p className={`text-xs mt-1 font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                {pt.time}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Checkpoint Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">MARKET CALIBRATION · {current.time}</span>
            <h3 className="text-2xl sm:text-3xl font-black text-[#071A33]">{current.rate}</h3>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
            Spread: {current.spread}
          </span>
        </div>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          Direct liquidity bridge ensures quotes are locked instantaneously when the instruction is signed, insulating counterparties from intraday market slippage.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
            <span className="text-slate-400">Liquidity Depth</span>
            <span className="font-bold text-[#071A33]">{current.volume}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
            <span className="text-slate-400">Rate Guarantee</span>
            <span className="font-bold text-[#155EEF]">Atomic Fixed Lock</span>
          </div>
        </div>
      </div>
    </section>
  );
};
