'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowUpRight, ArrowDownLeft, RotateCcw, CheckCircle2 } from 'lucide-react';

export const RevolvingCreditInstrument: React.FC = () => {
  const INITIAL_LIMIT = 60000;
  const [balance, setBalance] = useState(60000);
  const [used, setUsed] = useState(0);
  const [actionLog, setActionLog] = useState<string>('READY • LINE FULLY PROVISIONED');
  const [animatingStage, setAnimatingStage] = useState<'idle' | 'drawing' | 'paying' | 'repaying'>('idle');
  const [rotationDegree, setRotationDegree] = useState(0);

  // Slow continuous rotation of the surrounding financial orbit
  useEffect(() => {
    let animId: number;
    const rotate = () => {
      setRotationDegree((prev) => (prev + 0.1) % 360);
      animId = requestAnimationFrame(rotate);
    };
    animId = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleDraw = () => {
    if (balance < 5000 || animatingStage !== 'idle') return;
    setAnimatingStage('drawing');
    setActionLog('DRAWING ₹5,000 FROM ACTIVE CREDIT LIMIT...');

    setTimeout(() => {
      setBalance((prev) => prev - 5000);
      setUsed((prev) => prev + 5000);
      setAnimatingStage('idle');
      setActionLog('DRAW COMPLETED • AVAILABLE CREDIT REDUCED BY ₹5,000');
    }, 600);
  };

  const handlePay = () => {
    if (balance < 3500 || animatingStage !== 'idle') return;
    setAnimatingStage('paying');
    setActionLog('PAYING ₹3,500 MERCHANT TRANSACTION OVER UPI...');

    setTimeout(() => {
      setBalance((prev) => prev - 3500);
      setUsed((prev) => prev + 3500);
      setAnimatingStage('idle');
      setActionLog('PAYMENT SETTLED • ₹3,500 DISPATCHED TO MERCHANT');
    }, 600);
  };

  const handleRepay = () => {
    if (used === 0 || animatingStage !== 'idle') return;
    setAnimatingStage('repaying');
    setActionLog(`CLEARING ₹${used.toLocaleString('en-IN')} REPAYMENT ON THE LINE...`);

    setTimeout(() => {
      setBalance(INITIAL_LIMIT);
      setUsed(0);
      setAnimatingStage('idle');
      setActionLog('REPAYMENT PROCESSED • 100% LINE REPLENISHED & READY');
    }, 600);
  };

  const handleReset = () => {
    setBalance(INITIAL_LIMIT);
    setUsed(0);
    setAnimatingStage('idle');
    setActionLog('CREDIT INSTRUMENT RESET TO INITIAL STATE');
  };

  const percentAvailable = Math.round((balance / INITIAL_LIMIT) * 100);
  const radius = 180;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (percentAvailable / 100) * circumference;

  return (
    <section
      id="section-credit-line"
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-gradient-to-b from-[#F8FAFC] via-white to-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-blue-500/5 rounded-full blur-[200px]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-16 relative z-10 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <RefreshCw className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>REVOLVING CREDIT ARCHITECTURE</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#071A33] tracking-tight uppercase leading-[1.04]"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            ONE LINE. <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
              NOT ONE-TIME CREDIT.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-normal leading-relaxed">
            A revolving credit line provides an active limit that customers draw against when needed and replenish through repayment.
          </p>
        </div>

        {/* ── THE HUGE REVOLVING CIRCULAR INSTRUMENT ── */}
        <div className="flex flex-col items-center justify-center pt-4">
          <div className="relative w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] flex items-center justify-center">
            {/* Outer Slow-Rotating Quad-Stage Ring */}
            <div
              className="absolute inset-0 rounded-full border border-slate-300/80 pointer-events-none transition-transform duration-75"
              style={{ transform: `rotate(${rotationDegree}deg)` }}
            >
              {/* Four Quadrant Anchors */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold tracking-widest text-[#155EEF] bg-white px-2 py-0.5 rounded shadow-xs border border-blue-100">
                1. AVAILABLE
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold tracking-widest text-amber-600 bg-white px-2 py-0.5 rounded shadow-xs border border-amber-100">
                2. USED
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold tracking-widest text-emerald-600 bg-white px-2 py-0.5 rounded shadow-xs border border-emerald-100">
                3. REPAID
              </div>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold tracking-widest text-cyan-600 bg-white px-2 py-0.5 rounded shadow-xs border border-cyan-100">
                4. READY AGAIN
              </div>
            </div>

            {/* SVG Arc Gauge */}
            <svg className="w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 420 420">
              <circle
                cx="210"
                cy="210"
                r={radius}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="16"
                strokeDasharray="6 8"
              />
              <circle
                cx="210"
                cy="210"
                r={radius}
                fill="none"
                stroke="url(#revolveGrad)"
                strokeWidth="16"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="revolveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00E5FF" />
                  <stop offset="50%" stopColor="#155EEF" />
                  <stop offset="100%" stopColor="#071A33" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center Core Floating Glass Platter */}
            <div className="absolute w-[240px] sm:w-[300px] h-[240px] sm:h-[300px] rounded-full bg-white/95 border border-slate-200/90 shadow-2xl flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#155EEF] mb-1">
                AVAILABLE LIMIT
              </span>

              <div
                className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight leading-none my-1"
                style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
              >
                ₹{balance.toLocaleString('en-IN')}
              </div>

              <div className="text-xs font-mono text-slate-500 mt-2">
                <span>TOTAL: ₹{INITIAL_LIMIT.toLocaleString('en-IN')}</span>
              </div>

              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#155EEF] text-xs font-mono font-bold">
                <span>{percentAvailable}% CAPACITY</span>
              </div>
            </div>
          </div>

          {/* ── 4 PHYSICAL TACTILE CONTROLS ── */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-xl">
            {/* 1. DRAW Button */}
            <button
              type="button"
              onClick={handleDraw}
              disabled={balance < 5000 || animatingStage !== 'idle'}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4 text-cyan-400" />
              <span>DRAW ₹5,000</span>
            </button>

            {/* 2. PAY Button */}
            <button
              type="button"
              onClick={handlePay}
              disabled={balance < 3500 || animatingStage !== 'idle'}
              className="px-6 py-3 rounded-xl bg-[#155EEF] hover:bg-[#004EEB] text-white font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-white" />
              <span>PAY ₹3,500</span>
            </button>

            {/* 3. REPAY Button */}
            <button
              type="button"
              onClick={handleRepay}
              disabled={used === 0 || animatingStage !== 'idle'}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-white" />
              <span>REPAY ₹{used.toLocaleString('en-IN')}</span>
            </button>

            {/* 4. RESET Button */}
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>RESET</span>
            </button>
          </div>

          {/* Action Log / Status Bar */}
          <div className="mt-6 flex items-center gap-2 text-xs font-mono text-slate-600 bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold uppercase tracking-wider">{actionLog}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
