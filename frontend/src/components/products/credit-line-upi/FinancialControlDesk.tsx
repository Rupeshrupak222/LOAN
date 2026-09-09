'use client';

import React, { useState } from 'react';
import { Sliders, RefreshCw, ArrowUpRight, ArrowDownLeft, ShieldCheck, Activity, Terminal } from 'lucide-react';

export const FinancialControlDesk: React.FC = () => {
  const [totalLimit, setTotalLimit] = useState(50000);
  const [utilized, setUtilized] = useState(18500);
  const [txnCount, setTxnCount] = useState(3);
  const [consoleLog, setConsoleLog] = useState('CONSOLE INITIALIZED • TELEMETRY OK');

  const available = Math.max(0, totalLimit - utilized);

  const handleDraw = () => {
    if (available < 2000) return;
    setUtilized((prev) => prev + 2000);
    setTxnCount((prev) => prev + 1);
    setConsoleLog(`[EXEC] DRAW ₹2,000 APPROVED -> NEW AVAIL ₹${(available - 2000).toLocaleString('en-IN')}`);
  };

  const handleRepay = () => {
    if (utilized < 5000) {
      setUtilized(0);
      setConsoleLog(`[EXEC] REPAY ALL BALANCE -> LINE FULLY RESTORED`);
    } else {
      setUtilized((prev) => prev - 5000);
      setConsoleLog(`[EXEC] REPAY ₹5,000 CONFIRMED -> UTILIZED NOW ₹${(utilized - 5000).toLocaleString('en-IN')}`);
    }
  };

  const handleIncreaseLimit = () => {
    setTotalLimit((prev) => prev + 10000);
    setConsoleLog(`[POLICY] ENHANCED CREDIT LIMIT BY +₹10,000 -> TOTAL ₹${(totalLimit + 10000).toLocaleString('en-IN')}`);
  };

  return (
    <section
      id="section-control-desk"
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-[180px]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-16 relative z-10 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <Sliders className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>OPERATIONAL TELEMETRY</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#071A33] tracking-tight uppercase leading-[1.04]"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            FINANCIAL <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
              CONTROL DESK.
            </span>
          </h2>

          <div className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            ALL VALUES ARE DEMONSTRATION VALUES
          </div>
        </div>

        {/* ── THE PHYSICAL OPERATIONS CONSOLE ── */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0B1528] border border-slate-800 text-white shadow-2xl relative overflow-hidden text-left space-y-8">
          {/* Top Console Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                LIVE INSTRUMENT TELEMETRY
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <span>STATUS: <strong className="text-emerald-400">ACTIVE</strong></span>
              <span>•</span>
              <span>BILLING: <strong className="text-cyan-400">SIMULATED 30-DAY</strong></span>
            </div>
          </div>

          {/* 4 Core Quantitative Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#071A33] border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                SANCTIONED LIMIT
              </div>
              <div
                className="text-2xl sm:text-3xl font-black text-white"
                style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
              >
                ₹{totalLimit.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] font-mono text-slate-500">MAX POOL</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#071A33] border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                UTILIZED AMOUNT
              </div>
              <div
                className="text-2xl sm:text-3xl font-black text-amber-400"
                style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
              >
                ₹{utilized.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] font-mono text-amber-500">DRAWN OVER UPI</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#071A33] border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                AVAILABLE BALANCE
              </div>
              <div
                className="text-2xl sm:text-3xl font-black text-cyan-300"
                style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
              >
                ₹{available.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] font-mono text-cyan-400">READY FOR CHECKOUT</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#071A33] border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                ACTIVE DRAWS
              </div>
              <div
                className="text-2xl sm:text-3xl font-black text-white"
                style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
              >
                0{txnCount}
              </div>
              <div className="text-[10px] font-mono text-emerald-400">NORMAL VELOCITY</div>
            </div>
          </div>

          {/* Interactive Operator Bench Actions */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDraw}
              disabled={available < 2000}
              className="px-6 py-3 rounded-xl bg-[#155EEF] hover:bg-blue-600 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
            >
              <ArrowDownLeft className="w-4 h-4 text-cyan-300" />
              <span>Simulate Draw ₹2,000</span>
            </button>

            <button
              type="button"
              onClick={handleRepay}
              disabled={utilized === 0}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <RefreshCw className="w-4 h-4 text-white" />
              <span>Simulate Repay ₹5,000</span>
            </button>

            <button
              type="button"
              onClick={handleIncreaseLimit}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs uppercase tracking-wider transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
              <span>Adjust Limit (+₹10K)</span>
            </button>
          </div>

          {/* Real-time System Console Feed */}
          <div className="p-4 rounded-xl bg-black/60 border border-slate-800 font-mono text-xs text-cyan-400 flex items-center gap-3">
            <Terminal className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="truncate">{consoleLog}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
