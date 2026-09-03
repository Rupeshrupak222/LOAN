'use client';

import React from 'react';
import { Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const KycSecurityBar: React.FC = () => {
  return (
    <div className="w-full py-4 px-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-3 text-left">
      <div className="flex items-center gap-2 text-slate-700 font-bold">
        <Lock className="w-4 h-4 text-[#155EEF]" />
        <span>Secure Verification</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="text-slate-300">•</span>
          <span>DigiLocker / MeitY</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-slate-300">•</span>
          <span>256-Bit Encryption</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-slate-300">•</span>
          <span className="text-emerald-700 font-semibold">Government Verified</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-slate-300">•</span>
          <span>Zero Paper Storage</span>
        </span>
      </div>
    </div>
  );
};
