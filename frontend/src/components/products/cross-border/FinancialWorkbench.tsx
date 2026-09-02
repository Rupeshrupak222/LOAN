'use client';

import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  Scale,
  FileText,
  Lock,
  CheckCircle2,
  Zap,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   FinancialWorkbench — "THE FINANCIAL WORKBENCH"
   ─────────────────────────────────────────────────────────────
   ▸ Tactile desktop instrument panel with 4 interactive tools:
     - Tool 1: FX Dial Calibrator
     - Tool 2: Amount Cylinder Adjuster
     - Tool 3: Settlement Status Marker
     - Tool 4: Cryptographic Reference Key
   ══════════════════════════════════════════════════════════════ */

interface WorkbenchTool {
  id: string;
  name: string;
  category: string;
  metric: string;
  description: string;
  icon: React.ElementType;
}

const TOOLS: WorkbenchTool[] = [
  { id: 'fx-dial', name: 'FX Dial Calibrator', category: 'Precision Rate Tool', metric: '0.7890 USD/GBP', description: 'Simulates interbank spot quote updates with real-time liquidity depth indicators.', icon: RotateCcw },
  { id: 'cylinder', name: 'Amount Cylinder', category: 'Capital Meter', metric: '$10,000.00 USD', description: 'Dual-geared mechanical cylinder allowing micro-adjustments to transfer principal.', icon: Sliders },
  { id: 'balance', name: 'Equilibrium Scale', category: 'Precision Gauge', metric: '100% Zero-Slippage', description: 'Verifies bilateral debit and credit equality across both jurisdictions.', icon: Scale },
  { id: 'lock', name: 'Settlement Marker', category: 'Security Seal', metric: 'Atomic RTGS Lock', description: 'Engages irrevocable central bank ledger clearing with tamper-evident audit keys.', icon: Lock },
];

export const FinancialWorkbench: React.FC = () => {
  const [activeToolId, setActiveToolId] = useState<string>('fx-dial');
  const current = TOOLS.find((t) => t.id === activeToolId) || TOOLS[0];
  const Icon = current.icon;

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Sliders className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>TACTILE INSTRUMENT DESK</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          The Financial Workbench
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Operate the mechanical instruments that power cross-border currency conversion, volume calibration, and ledger finality.
        </p>
      </div>

      {/* 4 Instrument Selector Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 max-w-[1400px] mx-auto text-left">
        {TOOLS.map((t) => {
          const isSelected = activeToolId === t.id;
          const ToolIcon = t.icon;

          return (
            <button
              key={t.id}
              onClick={() => setActiveToolId(t.id)}
              className={`p-6 rounded-3xl border transition-all text-left group cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-xl shadow-blue-500/20 scale-102 ring-2 ring-[#155EEF]/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-mono font-bold uppercase ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  {t.category}
                </span>
                <ToolIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#155EEF]'}`} />
              </div>
              <h3 className="text-lg font-bold">{t.name}</h3>
              <p className={`text-xs mt-1 font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                {t.metric}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Tool Display Panel */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#071A33] to-[#155EEF] text-white flex items-center justify-center font-bold">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">INSTRUMENT CALIBRATION · {current.category}</span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#071A33]">{current.name}</h3>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200 self-start sm:self-auto">
            {current.metric}
          </span>
        </div>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          {current.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
            <span className="text-slate-400">Operational Standard</span>
            <span className="font-bold text-[#071A33]">SWIFT ISO 20022 STP</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
            <span className="text-slate-400">Calibration State</span>
            <span className="font-bold text-emerald-600">Active & Verified</span>
          </div>
        </div>
      </div>
    </section>
  );
};
