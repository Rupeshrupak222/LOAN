'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, Check, Lock, Sparkles } from 'lucide-react';

interface VerifiedKycHeaderProps {
  applicantName?: string;
  verificationId?: string;
}

export const VerifiedKycHeader: React.FC<VerifiedKycHeaderProps> = ({
  applicantName = 'Verified Applicant',
  verificationId = 'DL-KYC-94821',
}) => {
  return (
    <div className="w-full rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Side: Logo, Title, Subtitle, Message */}
        <div className="space-y-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#155EEF] shadow-xs">
              <ShieldCheck className="w-6 h-6 text-[#155EEF]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-[#071A33] tracking-tight">
                  DigiLocker e-KYC
                </h1>
                <span className="text-[10px] font-bold font-mono text-[#155EEF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase">
                  OFFICIAL REPO
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Enterprise Loan Applicant Verification
              </p>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
            Your identity and required documents have been securely verified through government-certified DigiLocker repositories.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500 pt-1">
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <Lock className="w-3.5 h-3.5 text-[#155EEF]" />
              <span>Token: {verificationId}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span>Source: MeitY / UIDAI / NSDL</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-600 font-bold">Tamper-Proof PKI Signed</span>
          </div>
        </div>

        {/* Right Side: Prominent Status & 100% Verified Pill */}
        <div className="flex sm:flex-row lg:flex-col items-start lg:items-end justify-between sm:justify-start lg:justify-center gap-4 bg-slate-50/80 lg:bg-transparent p-4 sm:p-5 lg:p-0 rounded-2xl border border-slate-100 lg:border-none">
          {/* Prominent Status Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-xs">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span>Verification Complete</span>
          </div>

          {/* Clean 100% Verified Visual Indicator */}
          <div className="flex items-center gap-3 lg:text-right">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-[#071A33] font-mono leading-none">
                100%
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mt-1">
                Verified
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
