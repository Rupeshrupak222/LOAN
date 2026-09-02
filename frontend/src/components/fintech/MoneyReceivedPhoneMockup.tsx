'use client';

import React from 'react';
import { Check } from 'lucide-react';

export const MoneyReceivedPhoneMockup: React.FC = () => {
  return (
    <div className="relative group select-none">
      {/* Hand-drawn Paper Airplane Doodle above the phone */}
      <div className="absolute -top-10 -right-8 z-20 pointer-events-none hidden sm:block">
        <svg width="72" height="72" viewBox="0 0 100 100" fill="none" className="text-blue-600">
          <path
            d="M 10,70 Q 35,65 50,45"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            strokeLinecap="round"
          />
          <path
            d="M 52,42 L 90,14 L 62,60 L 52,42 Z"
            fill="rgba(37, 99, 235, 0.08)"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <path
            d="M 52,42 L 72,36 L 62,60"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Classic Bank Building in Background */}
      <div className="absolute -left-16 top-6 w-36 h-36 opacity-35 dark:opacity-20 pointer-events-none rounded-2xl overflow-hidden -z-10 blur-[0.6px]">
        <img
          src="/fintech/step5-bank-building.jpg"
          alt="Bank Partner Infrastructure"
          className="w-full h-full object-cover rounded-xl"
        />
      </div>

      {/* 3D Realistic Smartphone Mockup */}
      <div
        className="w-[190px] sm:w-[210px] h-[390px] bg-slate-900 rounded-[38px] p-3 shadow-2xl relative transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1 phone-shadow-3d border-[5px] border-slate-800"
        style={{
          transform: 'perspective(1200px) rotateY(10deg) rotateX(4deg) rotateZ(3deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="absolute inset-0 rounded-[34px] border border-white/20 pointer-events-none" />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-black rounded-full z-30" />

        <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[28px] overflow-hidden flex flex-col justify-between pt-7 pb-6 px-3.5 relative text-center">
          <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-white/35 to-transparent pointer-events-none z-10" />

          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-1 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span>10:28</span>
            <span>5G 100%</span>
          </div>

          <div className="my-auto space-y-4">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Amount Received
            </span>

            <h4 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white font-jakarta tracking-tight">
              ₹2,00,000
            </h4>

            {/* Glowing Big Blue Checkmark Badge */}
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-sky-500 rounded-full mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-500/40 ring-4 ring-blue-100 dark:ring-blue-900/40">
              <Check size={28} strokeWidth={3.5} />
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/40 inline-block">
              <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">
                ✓ Disbursal Completed
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800 pt-2">
            Instant IMPS Transfer
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyReceivedPhoneMockup;
