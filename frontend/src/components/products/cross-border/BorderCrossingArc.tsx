'use client';

import React, { useState } from 'react';
import {
  Globe,
  ArrowRight,
  ShieldCheck,
  Compass,
  CheckCircle2,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   BorderCrossingArc — "THEN THE MONEY CROSSES A BORDER."
   ─────────────────────────────────────────────────────────────
   ▸ 3D Atmospheric Flight Arc:
     - Stage 1: US Jurisdiction Exit (Fedwire Departure)
     - Stage 2: Mid-Atlantic Neutral Airspace Corridor
     - Stage 3: UK Jurisdiction Ingress (Bank of England / CHAPS)
   ══════════════════════════════════════════════════════════════ */

interface CorridorStage {
  id: string;
  stageNum: string;
  name: string;
  territory: string;
  status: string;
  speed: string;
  description: string;
}

const CORRIDOR_STAGES: CorridorStage[] = [
  { id: 'us-exit', stageNum: '01', name: 'US Jurisdiction Exit', territory: 'Federal Reserve Wire Network', status: 'Debited & Cleared', speed: '350ms', description: 'Funds successfully debited from originator account with instant US Fedwire acknowledgment.' },
  { id: 'international', stageNum: '02', name: 'Transatlantic Neutral Corridor', territory: 'SWIFT GPI High-Speed Mesh', status: 'In-Transit Encrypted', speed: '480ms', description: 'Transaction travels across international correspondent banking rails with end-to-end cryptographic tracking.' },
  { id: 'uk-ingress', stageNum: '03', name: 'UK Jurisdiction Ingress', territory: 'Bank of England RTGS', status: 'Ingested & Parsed', speed: '210ms', description: 'Arrives at London clearing center, ready for real-time foreign-exchange conversion and local deposit.' },
];

export const BorderCrossingArc: React.FC = () => {
  const [activeStageId, setActiveStageId] = useState<string>('international');
  const current = CORRIDOR_STAGES.find((s) => s.id === activeStageId) || CORRIDOR_STAGES[1];

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Globe className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>TRANS-JURISDICTIONAL FLIGHT ARC</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Then the Money Crosses a Border
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          As the capsule ascends into the international financial corridor, origin sovereign controls transition smoothly into destination settlement protocols.
        </p>
      </div>

      {/* 3 Corridor Arc Stage Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-[1400px] mx-auto text-left">
        {CORRIDOR_STAGES.map((st) => {
          const isSelected = activeStageId === st.id;

          return (
            <button
              key={st.id}
              onClick={() => setActiveStageId(st.id)}
              className={`p-6 rounded-3xl border transition-all text-left group cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-xl shadow-blue-500/20 scale-102 ring-2 ring-[#155EEF]/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-mono font-bold uppercase ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  Stage {st.stageNum}
                </span>
                <span className={`text-xs font-mono font-bold ${isSelected ? 'text-emerald-300' : 'text-[#155EEF]'}`}>
                  {st.speed}
                </span>
              </div>
              <h3 className="text-lg font-bold">{st.name}</h3>
              <p className={`text-xs mt-1 font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                {st.territory}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Selected Stage Presentation */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">JURISDICTION TELEMETRY · {current.territory}</span>
            <h3 className="text-2xl sm:text-3xl font-black text-[#071A33]">{current.name}</h3>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200 self-start sm:self-auto">
            {current.status}
          </span>
        </div>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          {current.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
            <span className="text-slate-400">Transit Duration</span>
            <span className="font-bold text-[#071A33]">{current.speed}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
            <span className="text-slate-400">Security Guarantee</span>
            <span className="font-bold text-[#155EEF]">256-Bit TLS 1.3 Transport</span>
          </div>
        </div>
      </div>
    </section>
  );
};
