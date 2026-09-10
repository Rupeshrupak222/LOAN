'use client';

import React from 'react';
import {
  Sparkles,
  Check,
  ShieldCheck,
  TrendingUp,
  Activity,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';

interface AiRiskAssessmentCardProps {
  creditScore?: number;
  riskLevel?: string;
  confidenceScore?: number;
}

export const AiRiskAssessmentCard: React.FC<AiRiskAssessmentCardProps> = ({
  creditScore = 785,
  riskLevel = 'LOW RISK',
  confidenceScore = 96,
}) => {
  const verificationChecks = [
    {
      title: 'Identity Match',
      desc: '100% biometric & demographic alignment with UIDAI repository.',
    },
    {
      title: 'Document Authenticity',
      desc: 'Cryptographic XML PKI signatures confirmed; zero tamper flags.',
    },
    {
      title: 'Data Consistency',
      desc: 'Name, DOB, and PAN-Aadhaar linkage validated across databases.',
    },
    {
      title: 'Source Validation',
      desc: 'Direct root-level government switch verification (UIDAI/NSDL).',
    },
  ];

  return (
    <div className="w-full rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#155EEF] shadow-xs">
            <Sparkles className="w-5 h-5 text-[#155EEF]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#071A33] tracking-tight">
              AI Risk & Eligibility Assessment
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Real-time underwriting intelligence derived from verified DigiLocker data.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Activity className="w-3.5 h-3.5" />
          <span>Underwriting Pre-Scored</span>
        </div>
      </div>

      {/* 3 Main Visual Indicator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Credit Score */}
        <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Credit Score
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Prime Tier
            </span>
          </div>

          <div>
            <p className="text-3xl sm:text-4xl font-black text-[#071A33] font-mono tracking-tight">
              {creditScore}
            </p>
            {/* Score Visual Bar (300 to 900 scale) */}
            <div className="mt-2.5 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-[#155EEF] to-emerald-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, ((creditScore - 300) / 600) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>300</span>
              <span className="text-slate-600 font-bold">Excellent (750+)</span>
              <span>900</span>
            </div>
          </div>
        </div>

        {/* 2. Risk Level */}
        <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Risk Level
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>Approved Tier</span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight">
                {riskLevel}
              </p>
            </div>

            {/* Segmented Risk Gauge */}
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <div className="h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
              <div className="h-2 rounded-full bg-slate-200" />
              <div className="h-2 rounded-full bg-slate-200" />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span className="text-emerald-700 font-bold">Low Risk</span>
              <span>Moderate</span>
              <span>High</span>
            </div>
          </div>
        </div>

        {/* 3. Verification Confidence */}
        <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Verification Confidence
            </span>
            <span className="text-[10px] font-mono text-[#155EEF] font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              High Confidence
            </span>
          </div>

          <div>
            <p className="text-3xl sm:text-4xl font-black text-[#071A33] font-mono tracking-tight">
              {confidenceScore}%
            </p>

            <div className="mt-2.5 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-[#155EEF] rounded-full"
                style={{ width: `${confidenceScore}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              Sub-second neural match against biometric photo
            </p>
          </div>
        </div>
      </div>

      {/* 4 Verification Checks Grid */}
      <div className="pt-2 space-y-3">
        <span className="text-xs font-bold text-[#071A33] uppercase tracking-wider font-mono">
          Automated Compliance Checks
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {verificationChecks.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white border border-slate-200/80 flex items-start gap-3 shadow-2xs"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-[#071A33]">{item.title}</h4>
                <p className="text-[11px] text-slate-500 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
