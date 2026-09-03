'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Layers, ArrowRight, Play, RotateCcw, ShieldCheck, Database, CheckCircle2 } from 'lucide-react';

export const FinancialRailJourney: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutomatedRunning, setIsAutomatedRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  const CHAMBERS = [
    {
      num: '01',
      title: 'CREDIT ENABLED',
      badge: 'BANK SANCTION',
      metric: '₹50,000 APPROVED',
      desc: 'A pre-approved credit line becomes available on the core lending engine, pre-underwritten and ready for immediate linking.',
      status: 'LINE PROVISIONED',
    },
    {
      num: '02',
      title: 'CREDIT LINKED',
      badge: 'UPI ONBOARDING',
      metric: 'VPA BINDING OK',
      desc: 'The credit account is securely linked to the customer’s supported UPI payment application via standard account-binding protocols.',
      status: 'DEVICE TOKENIZED',
    },
    {
      num: '03',
      title: 'PAYMENT INITIATED',
      badge: 'SCAN & SELECT',
      metric: 'QR INTENT DETECTED',
      desc: 'At checkout, the customer scans any standard merchant QR or selects online checkout, choosing the Credit Line as the funding source.',
      status: 'SOURCE: ADYAPAN CREDIT',
    },
    {
      num: '04',
      title: 'TRANSACTION ROUTED',
      badge: 'SWITCH CLEARING',
      metric: 'SUB-SECOND (<380ms)',
      desc: 'The payment packet moves through NPCI / UPI switches into Adyapan’s real-time risk engine, checking policy and authorizing the draw.',
      status: 'AUTHENTICATED',
    },
    {
      num: '05',
      title: 'CREDIT UPDATED',
      badge: 'CORE LEDGER',
      metric: 'LINE: ₹47,500 AVAILABLE',
      desc: 'The available credit line immediately updates. The drawdown is recorded, merchant receives instant credit, and billing cycle begins.',
      status: 'LEDGER COMMITTED',
    },
    {
      num: '06',
      title: 'REPAYMENT',
      badge: 'REPLENISHMENT',
      metric: '100% LIMIT RESTORED',
      desc: 'Customer repays via standard UPI auto-debit or on-demand payment, fully restoring available credit for subsequent transactions.',
      status: 'REVOLVING & READY',
    },
  ];

  const clearTimers = () => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
  };

  const handleRunSimulation = () => {
    if (isAutomatedRunning) return;
    clearTimers();
    setIsAutomatedRunning(true);
    setActiveStep(0);

    for (let i = 1; i < CHAMBERS.length; i++) {
      const t = setTimeout(() => {
        setActiveStep(i);
        if (i === CHAMBERS.length - 1) {
          setIsAutomatedRunning(false);
        }
      }, i * 1100);
      timerRef.current.push(t);
    }
  };

  const handleReset = () => {
    clearTimers();
    setIsAutomatedRunning(false);
    setActiveStep(0);
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const currentChamber = CHAMBERS[activeStep];

  return (
    <section
      id="section-rail-journey"
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-[#071A33] text-white overflow-hidden border-b border-slate-800 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── High-Contrast Studio Keylight ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/10 rounded-full blur-[220px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>FINANCIAL RAIL EXECUTION</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase leading-[1.04]"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            FROM CREDIT LINE <br />
            <span className="bg-gradient-to-r from-cyan-400 via-[#155EEF] to-blue-400 bg-clip-text text-transparent">
              TO PAYMENT.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-normal leading-relaxed">
            Follow the sub-second journey of a transaction through six precision chambers on the Adyapan credit infrastructure.
          </p>

          {/* Simulation Controls */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isAutomatedRunning}
              className="px-6 py-2.5 rounded-full bg-[#155EEF] hover:bg-blue-600 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isAutomatedRunning ? 'ROUTING PACKET...' : 'RUN FULL JOURNEY'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold text-xs uppercase tracking-wider transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>
          </div>
        </div>

        {/* ── THE PHYSICAL FINANCIAL RAIL CHASSIS ── */}
        <div className="space-y-8">
          {/* Horizontal Rail Chambers Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CHAMBERS.map((ch, idx) => {
              const isCurrent = activeStep === idx;
              const isPast = activeStep > idx;

              return (
                <div
                  key={ch.num}
                  onClick={() => {
                    clearTimers();
                    setIsAutomatedRunning(false);
                    setActiveStep(idx);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[140px] relative overflow-hidden ${
                    isCurrent
                      ? 'bg-[#0E2442] border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg shadow-blue-500/25'
                      : isPast
                      ? 'bg-[#0A1628] border-emerald-500/40 text-slate-300'
                      : 'bg-[#0A1628]/60 border-slate-800 text-slate-400 hover:bg-[#0E2442]/50'
                  }`}
                >
                  {/* Step Progress Topline */}
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-slate-400">CHAMBER {ch.num}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCurrent
                          ? 'bg-cyan-400 animate-ping'
                          : isPast
                          ? 'bg-emerald-400'
                          : 'bg-slate-700'
                      }`}
                    />
                  </div>

                  {/* Title & Badge */}
                  <div className="py-2">
                    <div className="text-xs font-mono font-bold uppercase text-slate-400">
                      {ch.badge}
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5 leading-snug">
                      {ch.title}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="pt-2 border-t border-slate-800 text-[9px] font-mono flex items-center justify-between">
                    <span className={isCurrent ? 'text-cyan-300 font-bold' : isPast ? 'text-emerald-400' : 'text-slate-500'}>
                      {isPast ? 'COMPLETED' : isCurrent ? 'ACTIVE' : 'STANDBY'}
                    </span>
                    <span className="text-slate-500">→</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── ACTIVE CHAMBER INSPECTION PLATFORM ── */}
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#0A1628] to-[#06101E] border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Chamber Details */}
              <div className="lg:col-span-8 space-y-4 text-left">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-cyan-300 font-mono text-xs font-bold uppercase">
                    CHAMBER {currentChamber.num} • {currentChamber.badge}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{currentChamber.status}</span>
                  </span>
                </div>

                <h3
                  className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight"
                  style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
                >
                  {currentChamber.title}
                </h3>

                <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-normal leading-relaxed">
                  {currentChamber.desc}
                </p>
              </div>

              {/* Chamber Live Metrics Box */}
              <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0E2442]/80 border border-slate-700/80 space-y-3 text-left">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                  TELEMETRY READOUT
                </span>

                <div className="text-xl font-black font-mono text-cyan-300">
                  {currentChamber.metric}
                </div>

                <div className="text-xs font-mono text-slate-400 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                  <span>LATENCY BUDGET:</span>
                  <span className="text-white font-bold">&lt; 400ms SLA</span>
                </div>

                <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
                  <span>INFRASTRUCTURE:</span>
                  <span className="text-emerald-400 font-bold">ADYAPAN CORE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
