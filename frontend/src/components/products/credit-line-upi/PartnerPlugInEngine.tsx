'use client';

import React, { useState } from 'react';
import { Cpu, Building2, Smartphone, Store, Database, BarChart3, CheckCircle2, Cable } from 'lucide-react';

export const PartnerPlugInEngine: React.FC = () => {
  const [activeModule, setActiveModule] = useState<string | null>('bank');

  const PLUGINS = [
    {
      id: 'bank',
      title: 'BANK & NBFC LENDERS',
      tag: 'CAPITAL PROVIDER',
      icon: Building2,
      role: 'Underwrites and sanctions the credit line limit. Funds transactions and earns daily pro-rata interest while retaining regulatory ownership.',
      apis: ['/v2/credit-line/sanction', '/v2/credit-line/limit-update', '/v2/lender/disbursal-feed'],
    },
    {
      id: 'fintech',
      title: 'FINTECH & CO-BRAND APPS',
      tag: 'CONSUMER INTERFACE',
      icon: Smartphone,
      role: 'Embeds pre-approved credit lines directly into branded consumer applications. Retains customer relationship with customized loyalty overlays.',
      apis: ['/v1/customer/eligibility', '/v1/account/bind-vpa', '/v1/credit/statement'],
    },
    {
      id: 'upi',
      title: 'UPI PAYMENT APPS',
      tag: 'PAYMENT SWITCH',
      icon: Cable,
      role: 'Routes standard QR scan and online checkout transactions into the Adyapan credit adapter via standard NPCI 2.0 specification.',
      apis: ['/v2/upi/auth-drawdown', '/v2/upi/mandate-create', '/v2/upi/reversal'],
    },
    {
      id: 'merchant',
      title: 'ACQUIRING MERCHANTS',
      tag: 'ACCEPTANCE POINT',
      icon: Store,
      role: 'Accepts credit line payments seamlessly using standard Bharat QR standees and Soundbox devices. Zero special merchant software needed.',
      apis: ['/v1/merchant/notification', '/v1/settlement/t0-credit'],
    },
    {
      id: 'lms',
      title: 'CORE LENDING SYSTEM (LMS)',
      tag: 'BOOKKEEPING & GL',
      icon: Database,
      role: 'Synchronizes every micro-drawdown with institutional general ledger accounts, automated NPA bucketing, and accounting books.',
      apis: ['/v3/gl/drawdown-post', '/v3/gl/repay-match', '/v3/regulatory/export'],
    },
    {
      id: 'analytics',
      title: 'PORTFOLIO ANALYTICS',
      tag: 'RISK INTELLIGENCE',
      icon: BarChart3,
      role: 'Aggregates real-time drawdown velocity, cohort repayment trends, and utilization rates into executive dashboards.',
      apis: ['/v1/telemetry/draw-velocity', '/v1/analytics/npa-early-warning'],
    },
  ];

  const currentPlugin = PLUGINS.find((p) => p.id === activeModule) || PLUGINS[0];

  return (
    <section
      id="section-partner-infrastructure"
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-gradient-to-b from-[#F8FAFC] via-white to-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-blue-500/5 rounded-full blur-[200px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-16 relative z-10 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <Cpu className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>MODULAR PLUG-IN INFRASTRUCTURE</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#071A33] tracking-tight uppercase leading-[1.04]"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            CONNECT CREDIT TO <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
              THE EXPERIENCE YOU OWN.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Adyapan acts as the central credit engine. Financial partners plug in via standardized protocol adapters.
          </p>
        </div>

        {/* ── CENTRAL ENGINE & DOCKED PLUG-IN MODULES ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: 6 Modular Plug-In Cards Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {PLUGINS.map((pl) => {
              const isSelected = activeModule === pl.id;
              const PlIcon = pl.icon;

              return (
                <div
                  key={pl.id}
                  onClick={() => setActiveModule(pl.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[140px] relative overflow-hidden ${
                    isSelected
                      ? 'bg-white border-[#155EEF] shadow-lg shadow-blue-500/15 ring-2 ring-blue-500/20'
                      : 'bg-white/70 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">
                      {pl.tag}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-[#155EEF] text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <PlIcon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-sm font-bold text-[#071A33] uppercase leading-snug">
                      {pl.title}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{isSelected ? 'DOCKED & ACTIVE' : 'CLICK TO INSPECT'}</span>
                    <span>→</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Central Engine Hub Display & Selected Module Specs */}
          <div className="lg:col-span-5 p-8 rounded-3xl bg-[#071A33] text-white shadow-xl text-left space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300">
                  CENTRAL ADYAPAN ADAPTER
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                ACTIVE BUS
              </span>
            </div>

            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase font-bold">
                {currentPlugin.tag}
              </span>
              <h3 className="text-xl font-black text-white uppercase mt-1">
                {currentPlugin.title}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentPlugin.role}
            </p>

            {/* Standardized Endpoints */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                INTEGRATED INTERFACE ENDPOINTS
              </span>
              {currentPlugin.apis.map((api, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-[#0E2442] border border-slate-700/80 font-mono text-[11px] text-cyan-300 flex items-center gap-2"
                >
                  <span className="text-slate-500 font-bold">GET/POST</span>
                  <span>{api}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
