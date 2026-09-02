'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface InteractivePhoneMockupProps {
  initialAmount?: number;
}

export const InteractivePhoneMockup: React.FC<InteractivePhoneMockupProps> = ({
  initialAmount = 200000,
}) => {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [isApplied, setIsApplied] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleApply = () => {
    setIsApplied(true);
    setTimeout(() => setIsApplied(false), 2000);
  };

  return (
    <div className="relative group select-none">
      {/* Hand-drawn Doodle Clock on Left */}
      <div className="absolute -left-12 -bottom-2 z-20 pointer-events-none hidden sm:block">
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none" className="text-blue-600">
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeDasharray="4 2"
            className="opacity-90"
          />
          <path
            d="M 50,50 L 50,26 M 50,50 L 68,50"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="50" cy="50" r="4" fill="currentColor" />
          <path d="M 50,14 L 50,18 M 86,50 L 82,50 M 50,86 L 50,82 M 14,50 L 18,50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 12,24 L 20,28 M 20,18 L 16,28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 82,78 L 90,82 M 88,72 L 84,84" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* 3D Realistic Angled Phone Container */}
      <div
        className="w-[240px] sm:w-[260px] h-[480px] bg-slate-900 rounded-[44px] p-3.5 shadow-2xl relative transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-1 phone-shadow-3d border-[6px] border-slate-800"
        style={{
          transform: 'perspective(1200px) rotateY(-8deg) rotateX(6deg) rotateZ(-4deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="absolute inset-0 rounded-[38px] border border-white/20 pointer-events-none" />

        {/* Dynamic Island Notch */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 flex items-center justify-end px-2">
          <div className="w-2 h-2 rounded-full bg-slate-800 border border-slate-700" />
        </div>

        {/* Screen Content */}
        <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[32px] overflow-hidden flex flex-col justify-between pt-7 pb-6 px-4 relative">
          <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-b from-white/40 to-transparent pointer-events-none z-10" />

          {/* Top Brand Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-black shadow-xs">
                A
              </div>
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white font-jakarta">
                Adyapan
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-slate-400">Live</span>
            </div>
          </div>

          {/* Main App Body */}
          <div className="my-auto space-y-5 text-center">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Amount
              </p>
              <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1 font-jakarta">
                {formatCurrency(amount)}
              </h4>
            </div>

            {/* Slider Control */}
            <div className="space-y-2 px-1">
              <input
                type="range"
                min={10000}
                max={500000}
                step={5000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all"
              />
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>₹10k</span>
                <span className="text-blue-600 font-semibold">avg</span>
                <span>₹5L</span>
              </div>
            </div>

            {/* Tenure & Rate */}
            <div className="grid grid-cols-2 gap-1.5 text-left pt-1">
              <div className="bg-blue-50/80 dark:bg-blue-950/40 p-2 rounded-xl border border-blue-100/80 dark:border-blue-900/30">
                <span className="text-[9px] text-slate-500 font-medium block">Tenure</span>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">12 - 36 Mo</span>
              </div>
              <div className="bg-blue-50/80 dark:bg-blue-950/40 p-2 rounded-xl border border-blue-100/80 dark:border-blue-900/30">
                <span className="text-[9px] text-slate-500 font-medium block">Interest</span>
                <span className="text-[11px] font-bold text-emerald-600">From 1.1%</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div>
            <button
              onClick={handleApply}
              className={`w-full py-3 rounded-full text-xs font-extrabold tracking-wide uppercase shadow-lg shadow-blue-600/30 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                isApplied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-600/50 active:scale-95'
              }`}
            >
              {isApplied ? (
                <>
                  <Sparkles size={13} />
                  Processing...
                </>
              ) : (
                'Apply Now'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractivePhoneMockup;
