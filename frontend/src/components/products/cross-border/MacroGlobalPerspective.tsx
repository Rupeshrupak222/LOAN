'use client';

import React from 'react';
import {
  Globe,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   MacroGlobalPerspective — "GLOBAL PERSPECTIVE"
   ─────────────────────────────────────────────────────────────
   ▸ Macro camera pull-back showing interconnected global rails:
     - Corridor 1: New York (USD) ➔ London (GBP)
     - Corridor 2: Dubai (AED) ➔ Mumbai (INR)
     - Corridor 3: Singapore (SGD) ➔ Tokyo (JPY)
     - Corridor 4: Frankfurt (EUR) ➔ New York (USD)
   ▸ Labeled as "ILLUSTRATIVE GLOBAL PAYMENT FLOWS"
   ══════════════════════════════════════════════════════════════ */

interface GlobalCorridor {
  name: string;
  currencies: string;
  clearingRail: string;
  latency: string;
}

const GLOBAL_CORRIDORS: GlobalCorridor[] = [
  { name: 'Transatlantic Corridor', currencies: 'USD ➔ GBP / EUR', clearingRail: 'Fedwire / CHAPS / TARGET2', latency: '< 600ms' },
  { name: 'Gulf–South Asia Rail', currencies: 'AED ➔ INR', clearingRail: 'CBOE / NPCI UPI Linkage', latency: '< 450ms' },
  { name: 'Asia-Pacific Financial Mesh', currencies: 'SGD ➔ JPY / AUD', clearingRail: 'MAS Fast / BOJ-NET', latency: '< 520ms' },
  { name: 'Euro-American High-Speed', currencies: 'EUR ➔ USD', clearingRail: 'EBA Clearing / FedNow', latency: '< 480ms' },
];

export const MacroGlobalPerspective: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      <div className="rounded-3xl border border-slate-800 bg-[#071A33] text-white p-8 sm:p-14 max-w-[1400px] mx-auto text-left shadow-2xl relative overflow-hidden space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono text-blue-300 bg-blue-900/40 border border-blue-700 mb-2">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>MACRO MULTI-CORRIDOR TOPOLOGY</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">Global Financial Perspective</h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-800 self-start sm:self-auto">
            ILLUSTRATIVE GLOBAL PAYMENT FLOWS
          </span>
        </div>

        {/* 4 Global Corridors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          {GLOBAL_CORRIDORS.map((c, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] text-blue-400 font-bold uppercase block">{c.name}</span>
              <span className="text-sm font-bold text-white block">{c.currencies}</span>
              <p className="text-[10px] text-slate-400">{c.clearingRail}</p>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-400">
                <span>Speed:</span>
                <span className="text-emerald-400 font-bold">{c.latency}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Adyapan’s multi-currency treasury engine powers direct connectivity across major global currency corridors.</span>
          </div>
          <span className="text-blue-300 font-bold">24/7 Continuous Clearing</span>
        </div>
      </div>
    </section>
  );
};
