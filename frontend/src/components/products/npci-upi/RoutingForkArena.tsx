'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Building,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   RoutingForkArena — "THE RIGHT PAYMENT TAKES THE RIGHT PATH"
   ─────────────────────────────────────────────────────────────
   ▸ Dynamic 3-Way Network Routing Fork:
     - Router Node analyzes Issuer Bank Health
     - Routes packet through Bank A, Bank B, or Bank C
     - Dynamic auto-failover and least-latency pathing
   ══════════════════════════════════════════════════════════════ */

interface BankRoute {
  id: string;
  name: string;
  code: string;
  successRate: string;
  latency: string;
  status: string;
  selectedByDefault?: boolean;
}

const BANK_ROUTES: BankRoute[] = [
  { id: 'bank-a', name: 'Primary Rail (HDFC Bank)', code: 'HDFC0001', successRate: '99.98%', latency: '38ms', status: 'Optimal Path', selectedByDefault: true },
  { id: 'bank-b', name: 'Secondary Rail (ICICI Bank)', code: 'ICIC0002', successRate: '99.95%', latency: '45ms', status: 'Active Standby' },
  { id: 'bank-c', name: 'Tertiary Rail (Axis Bank)', code: 'UTIB0003', successRate: '99.92%', latency: '52ms', status: 'Active Standby' },
];

export const RoutingForkArena: React.FC = () => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('bank-a');
  const current = BANK_ROUTES.find((r) => r.id === selectedRouteId) || BANK_ROUTES[0];

  return (
    <section id="routing-arena" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Cpu className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>DYNAMIC ROUTING ENGINE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          The Right Payment Takes the Right Path
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Adyapan’s algorithmic router continuously probes bank switchboards, steering transactions along the lowest-latency and highest-uptime path.
        </p>
      </div>

      {/* 3 Bank Route Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-[1400px] mx-auto text-left">
        {BANK_ROUTES.map((route) => {
          const isSelected = selectedRouteId === route.id;

          return (
            <button
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={`p-6 rounded-3xl border transition-all text-left group cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-xl shadow-blue-500/20 scale-102 ring-2 ring-[#155EEF]/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-mono font-bold uppercase ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  {route.code}
                </span>
                <span className={`text-xs font-mono font-bold ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                  {route.successRate}
                </span>
              </div>
              <h3 className="text-lg font-bold">{route.name}</h3>
              <p className={`text-xs mt-1 font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                Switchboard Latency: {route.latency}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Selected Routing Telemetry Display */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#071A33] to-[#155EEF] text-white flex items-center justify-center font-bold shadow-xs">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">{current.code} · ROUTING CHANNEL</span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#071A33]">{current.name}</h3>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
            {current.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Clearing Success Rate</span>
            <span className="text-lg font-black text-emerald-600 block">{current.successRate}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Round-Trip Latency</span>
            <span className="text-lg font-black text-[#155EEF] block">{current.latency}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Failover Resilience</span>
            <span className="text-lg font-black text-[#071A33] block">Sub-10ms Auto-Switch</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pt-3 border-t border-slate-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>If any bank rail exhibits degradation, the engine reroutes packets instantly without user disruption.</span>
        </div>
      </div>
    </section>
  );
};
