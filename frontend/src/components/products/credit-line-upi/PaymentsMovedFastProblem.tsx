'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ArrowRight, Zap, XCircle } from 'lucide-react';

export const PaymentsMovedFastProblem: React.FC = () => {
  const [activeStepTraditional, setActiveStepTraditional] = useState(2);
  const [activeStepUpi, setActiveStepUpi] = useState(2);

  const TRADITIONAL_STEPS = [
    { num: '01', title: 'Application', desc: 'Separate loan forms, document uploads, and identity scans.', latency: '15-45 mins', friction: 'High Drop-off' },
    { num: '02', title: 'Verification', desc: 'Manual underwriting queues, bureau pulls, and employer checks.', latency: '4-24 hours', friction: 'Delayed' },
    { num: '03', title: 'Approval', desc: 'Sanction letter issued; bank account disbursement waiting period.', latency: '1-2 days', friction: 'Disconnected' },
    { num: '04', title: 'Disbursement', desc: 'Funds land in generic savings account, separated from checkout.', latency: '4 hours', friction: 'Off-rail' },
    { num: '05', title: 'Payment', desc: 'Customer must now remember to use disbursal at point of sale.', latency: 'Post-facto', friction: 'Lost Intent' },
  ];

  const UPI_STEPS = [
    { num: '01', title: 'Pre-Approved Limit', desc: 'Credit line sanctioned once and provisioned as an active payment instrument.', latency: 'Instant' },
    { num: '02', title: 'Select in UPI App', desc: 'Linked directly inside the customer’s existing UPI payment app.', latency: '0 friction' },
    { num: '03', title: 'One-Tap Pay', desc: 'UPI PIN authorized at the exact moment of merchant purchase.', latency: '< 400ms' },
    { num: '04', title: 'Ledger Recorded', desc: 'Real-time drawdown recorded on Adyapan core with instant merchant settlement.', latency: 'Sub-second' },
    { num: '05', title: 'Continuous Line', desc: 'Limit automatically restores as repayments clear, ready for next payment.', latency: 'Perpetual' },
  ];

  return (
    <section
      id="section-problem"
      className="relative py-24 sm:py-32 px-4 sm:px-8 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-[180px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <span>THE ARCHITECTURAL SHIFT</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#071A33] tracking-tight uppercase leading-[1.04]"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            PAYMENTS MOVED FAST. <br />
            <span className="text-slate-400">CREDIT DIDN’T.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Traditional credit journeys often sit outside the payment experience. Credit Line on UPI brings the borrowing instrument directly to the moment of purchase.
          </p>
        </div>

        {/* ── SPLIT-SCREEN COMPARISON ENGINE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* LEFT: Traditional Fragmented Credit Flow */}
          <div className="lg:col-span-6 p-8 sm:p-10 rounded-3xl bg-[#F8FAFC] border border-slate-200 shadow-sm space-y-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-mono font-bold text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>DISCONNECTED SYSTEM</span>
                  </span>
                  <h3 className="text-xl font-black text-[#071A33] uppercase mt-1">
                    Traditional Credit
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[10px] font-mono font-bold text-rose-600">
                  Multiple Days / High Friction
                </span>
              </div>

              {/* Fragmented Stepped Rail */}
              <div className="mt-8 space-y-3">
                {TRADITIONAL_STEPS.map((step, idx) => {
                  const isSelected = activeStepTraditional === idx;
                  return (
                    <div
                      key={step.num}
                      onClick={() => setActiveStepTraditional(idx)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-rose-300 shadow-md ring-2 ring-rose-400/20'
                          : 'bg-white/60 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {step.num}
                          </span>
                          <span className="text-sm font-bold text-slate-800">
                            {step.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {step.friction}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span>{step.desc}</span>
                          <span className="font-mono text-slate-400 shrink-0 ml-3">
                            ⏱ {step.latency}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Traditional Summary Footer */}
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs text-rose-800 flex items-center gap-3 mt-4">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Customer leaves checkout to apply $\rightarrow$ high abandonment rate at counter.</span>
            </div>
          </div>

          {/* RIGHT: Unbroken Continuous UPI Rail */}
          <div className="lg:col-span-6 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#071A33] to-[#0B1A2F] text-white shadow-xl space-y-8 flex flex-col justify-between relative overflow-hidden">
            {/* Background Ambient Radial Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#155EEF]/20 rounded-full blur-[140px] pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between pb-6 border-b border-slate-700/60">
                <div>
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>UNIFIED FINANCIAL RAIL</span>
                  </span>
                  <h3 className="text-xl font-black text-white uppercase mt-1">
                    Credit Line on UPI
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-[10px] font-mono font-bold text-cyan-300">
                  Sub-Second / Zero App-Switch
                </span>
              </div>

              {/* Continuous Connected Rail */}
              <div className="mt-8 space-y-3 relative">
                {/* Vertical Blue Laser Connector */}
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-cyan-400 via-[#155EEF] to-cyan-400 opacity-40 pointer-events-none hidden sm:block" />

                {UPI_STEPS.map((step, idx) => {
                  const isSelected = activeStepUpi === idx;
                  return (
                    <div
                      key={step.num}
                      onClick={() => setActiveStepUpi(idx)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative z-10 ${
                        isSelected
                          ? 'bg-[#0E2442] border-[#155EEF] shadow-lg shadow-blue-500/25 ring-2 ring-cyan-400/30'
                          : 'bg-[#0A1628]/80 border-slate-700/80 hover:bg-[#0E2442]/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-[10px] font-mono text-cyan-300 font-bold">
                            {step.num}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {step.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400 bg-blue-900/40 px-2 py-0.5 rounded border border-cyan-400/30">
                          {step.latency}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-xs text-slate-300">
                          {step.desc}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* UPI Rail Summary Footer */}
            <div className="p-4 rounded-xl bg-blue-500/15 border border-blue-400/30 text-xs text-cyan-200 flex items-center gap-3 mt-4 relative z-10">
              <Zap className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Credit is selected inside the familiar UPI QR scan journey without leaving checkout.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
