'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, User, TrendingUp } from 'lucide-react';

export const LendingSolutionsHero3D: React.FC = () => {
  return (
    <div className="relative w-full h-[460px] sm:h-[500px] flex items-center justify-center select-none overflow-visible">
      {/* Background Soft Ambient Light (Preserved Adyapan Blue) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-blue-100/60 blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/4 right-1/4 w-52 h-52 rounded-full bg-indigo-100/40 blur-2xl pointer-events-none -z-10" />

      {/* ── Main Isometric Composition ── */}
      <div className="relative w-full max-w-[520px] h-full flex items-center justify-center">
        {/* ── 1. Central 3D Neoclassical Bank Building ── */}
        <div className="relative z-10 -ml-16 sm:-ml-20 -mt-8 sm:-mt-10 transition-transform duration-500 hover:scale-105">
          <svg
            width="280"
            height="230"
            viewBox="0 0 280 230"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-2xl filter"
          >
            <defs>
              <linearGradient id="roofG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#EBF0FE" />
                <stop offset="100%" stopColor="#B9CBFB" />
              </linearGradient>
              <linearGradient id="roofSideG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4F75F2" />
                <stop offset="100%" stopColor="#1E37AE" />
              </linearGradient>
              <linearGradient id="pillarG" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="70%" stopColor="#F1F5F9" />
                <stop offset="100%" stopColor="#CBD5E1" />
              </linearGradient>
              <linearGradient id="baseG" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>
              <linearGradient id="doorG" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#155EEF" />
                <stop offset="100%" stopColor="#1E338A" />
              </linearGradient>
            </defs>

            {/* Roof Top Triangular Front Pediment */}
            <polygon points="140,20 40,80 240,80" fill="url(#roofG)" stroke="#CBD5E1" strokeWidth="1" />
            <polygon points="140,20 240,80 260,70 160,10" fill="url(#roofSideG)" opacity="0.85" />

            {/* Entablature Header Bar */}
            <rect x="35" y="80" width="210" height="16" rx="3" fill="url(#baseG)" stroke="#CBD5E1" strokeWidth="1" />
            <polygon points="245,80 265,70 265,86 245,96" fill="#1E37AE" opacity="0.7" />

            {/* 4 Architectural Neoclassical Columns */}
            {/* Column 1 */}
            <rect x="52" y="96" width="22" height="85" rx="3" fill="url(#pillarG)" stroke="#CBD5E1" strokeWidth="0.8" />
            {/* Column 2 */}
            <rect x="100" y="96" width="22" height="85" rx="3" fill="url(#pillarG)" stroke="#CBD5E1" strokeWidth="0.8" />
            {/* Column 3 */}
            <rect x="156" y="96" width="22" height="85" rx="3" fill="url(#pillarG)" stroke="#CBD5E1" strokeWidth="0.8" />
            {/* Column 4 */}
            <rect x="204" y="96" width="22" height="85" rx="3" fill="url(#pillarG)" stroke="#CBD5E1" strokeWidth="0.8" />

            {/* Central Arch Door */}
            <path d="M 125 181 L 125 130 Q 139 116 153 130 L 153 181 Z" fill="url(#doorG)" opacity="0.9" />

            {/* Stepped Podium Base Level 1 */}
            <rect x="25" y="181" width="230" height="14" rx="2" fill="url(#baseG)" stroke="#CBD5E1" strokeWidth="1" />
            <polygon points="255,181 270,172 270,186 255,195" fill="#1E37AE" opacity="0.6" />

            {/* Stepped Podium Base Level 2 */}
            <rect x="15" y="195" width="250" height="16" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
            <polygon points="265,195 280,186 280,202 265,211" fill="#1E37AE" opacity="0.5" />
          </svg>
        </div>

        {/* ── 2. Floating 3D Donut Chart (Left of Bank) ── */}
        <div className="absolute left-0 sm:left-2 top-28 sm:top-24 z-20 animate-floating">
          <div className="relative w-16 sm:w-20 h-16 sm:h-20 drop-shadow-xl">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-45">
              <circle cx="50" cy="50" r="38" stroke="#E2E8F0" strokeWidth="18" fill="none" />
              <circle
                cx="50"
                cy="50"
                r="38"
                stroke="#155EEF"
                strokeWidth="18"
                strokeDasharray="238"
                strokeDashoffset="70"
                strokeLinecap="round"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                stroke="#38BDF8"
                strokeWidth="18"
                strokeDasharray="238"
                strokeDashoffset="190"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* ── 3. Floating User Avatar Card (Bottom-Left) ── */}
        <div className="absolute left-24 sm:left-28 bottom-12 sm:bottom-14 z-20 animate-floating-delayed">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white border border-slate-200/90 shadow-lg flex items-center justify-center text-[#155EEF]">
            <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center">
              <User className="w-4 h-4 text-[#155EEF]" />
            </div>
          </div>
        </div>

        {/* ── 4. Main Floating Loan Application Approval Card (Right Foreground) ── */}
        <div className="absolute right-0 sm:-right-4 top-10 sm:top-8 z-30 w-[240px] sm:w-[270px] rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200/90 p-4 sm:p-5 shadow-2xl animate-floating-alt transition-transform hover:scale-105">
          {/* Card Top: Title & Approved Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <p className="text-[11px] font-bold text-slate-800 tracking-tight">Loan Application</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600">Approved</span>
              </div>
            </div>

            {/* Circular Green Checkmark Button */}
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Amount Display */}
          <div className="py-3">
            <p className="text-xl sm:text-2xl font-black text-[#071A33] tracking-tight font-mono">
              ₹ 25,00,000
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Loan Amount
            </p>
          </div>

          {/* Metrics Rows */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[11px] font-medium">Risk Score</span>
              <span className="font-mono font-bold text-slate-800 text-[11px]">720</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[11px] font-medium">Confidence</span>
              <span className="font-bold text-emerald-600 text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                High
              </span>
            </div>
          </div>
        </div>

        {/* ── 5. Floating 3D Blue Security Shield (Top-Right) ── */}
        <div className="absolute right-4 sm:right-6 -top-2 sm:top-0 z-40 animate-floating">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50/90 border border-blue-200/80 shadow-lg flex items-center justify-center text-[#155EEF] backdrop-blur-sm">
            <ShieldCheck className="w-5 h-5 text-[#155EEF]" />
          </div>
        </div>

        {/* ── 6. Floating 3D Bar Chart Card (Bottom-Right) ── */}
        <div className="absolute right-6 sm:right-8 -bottom-4 sm:-bottom-2 z-30 animate-floating-delayed">
          <div className="p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl flex items-end gap-1.5 h-16 w-20 justify-center">
            <div className="w-2.5 h-6 rounded-t-sm bg-blue-200" />
            <div className="w-2.5 h-9 rounded-t-sm bg-blue-400" />
            <div className="w-2.5 h-12 rounded-t-sm bg-[#155EEF]" />
          </div>
        </div>
      </div>
    </div>
  );
};
