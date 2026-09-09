'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  CreditCard,
  Building2,
  UserCheck,
  Lock,
  ArrowRight,
  RefreshCw,
  Zap,
  Check,
  AlertCircle,
  QrCode,
  Fingerprint,
  Camera,
  ExternalLink,
} from 'lucide-react';

interface KycVerificationDashboardProps {
  onStartVerification?: () => void;
  isExternalTriggering?: boolean;
}

export const KycVerificationDashboard: React.FC<KycVerificationDashboardProps> = ({
  onStartVerification,
  isExternalTriggering,
}) => {
  // Verification lifecycle: 'idle' | 'consent' | 'fetching' | 'matching' | 'completed'
  const [stage, setStage] = useState<'idle' | 'consent' | 'fetching' | 'matching' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);
  const [activeDoc, setActiveDoc] = useState<'aadhaar' | 'pan' | 'dl' | 'bank'>('aadhaar');

  // Trigger from outside or inside
  const handleStart = () => {
    if (stage !== 'idle' && stage !== 'completed') return;
    setStage('consent');
    setProgress(15);

    setTimeout(() => {
      setStage('fetching');
      setProgress(45);
    }, 1200);

    setTimeout(() => {
      setStage('matching');
      setProgress(80);
    }, 2600);

    setTimeout(() => {
      setStage('completed');
      setProgress(100);
    }, 4000);
  };

  const handleReset = () => {
    setStage('idle');
    setProgress(0);
  };

  useEffect(() => {
    if (isExternalTriggering && stage === 'idle') {
      handleStart();
    }
  }, [isExternalTriggering]);

  const documents = [
    {
      id: 'aadhaar',
      name: 'Aadhaar Card',
      issuer: 'UIDAI',
      number: 'XXXX-XXXX-8921',
      icon: UserCheck,
      verified: stage === 'completed' || stage === 'matching',
      fetching: stage === 'fetching',
      desc: 'Cryptographic XML Identity & Photo',
    },
    {
      id: 'pan',
      name: 'PAN Card',
      issuer: 'NSDL',
      number: 'ABCDE1234F',
      icon: CreditCard,
      verified: stage === 'completed' || stage === 'matching',
      fetching: stage === 'fetching',
      desc: 'Real-time Tax ID & Name Match',
    },
    {
      id: 'dl',
      name: 'Driving Licence',
      issuer: 'MoRTH',
      number: 'DL-04202300918',
      icon: FileText,
      verified: stage === 'completed',
      fetching: stage === 'fetching' || stage === 'matching',
      desc: 'National Transport Registry Match',
    },
    {
      id: 'bank',
      name: 'Bank Account',
      issuer: 'NPCI / AA',
      number: 'A/C •••• 4912',
      icon: Building2,
      verified: stage === 'completed',
      fetching: stage === 'matching',
      desc: 'Penny-Drop Account Holder Match',
    },
  ];

  const workflowSteps = [
    { id: 'consent', label: 'Customer', sub: 'OTP Consent' },
    { id: 'fetching', label: 'DigiLocker', sub: 'Signed XML' },
    { id: 'matching', label: 'Document Verification', sub: 'AI 3D Match' },
    { id: 'completed', label: 'KYC Completed', sub: '100% Certified' },
  ];

  const isCurrentOrPast = (stepId: string) => {
    const order = ['consent', 'fetching', 'matching', 'completed'];
    const currentIdx = stage === 'idle' ? -1 : order.indexOf(stage);
    const stepIdx = order.indexOf(stepId);
    return stepIdx <= currentIdx;
  };

  return (
    <div
      id="kyc-dashboard-visual"
      className="relative w-full rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 sm:p-8 text-slate-800 transition-all"
      style={{
        boxShadow: '0 20px 50px -12px rgba(21, 94, 239, 0.12), 0 4px 16px rgba(15, 23, 42, 0.06)',
      }}
    >
      {/* Decorative Brand Glow Accents (Preserved Adyapan Blue) */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-blue-100/50 blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-indigo-100/40 blur-3xl pointer-events-none -z-10" />

      {/* ── Dashboard Top Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#155EEF] shadow-xs">
            <ShieldCheck className="w-5 h-5 text-[#155EEF]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#071A33] tracking-tight">DigiLocker e-KYC</h3>
              <span className="text-[10px] font-bold font-mono text-[#155EEF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                OFFICIAL REPO
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Enterprise Loan Applicant Verification Portal</p>
          </div>
        </div>

        {/* Dynamic Verification Ready Pill */}
        <div className="flex items-center gap-2">
          {stage === 'idle' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Verification Ready</span>
            </span>
          )}
          {(stage === 'consent' || stage === 'fetching' || stage === 'matching') && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#155EEF] bg-blue-50 border border-blue-200 shadow-xs">
              <RefreshCw className="w-3 h-3 text-[#155EEF] animate-spin" />
              <span>
                {stage === 'consent' && 'Awaiting Consent...'}
                {stage === 'fetching' && 'Fetching XML Data...'}
                {stage === 'matching' && 'Matching Biometrics...'}
              </span>
            </span>
          )}
          {stage === 'completed' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>KYC Certified & Validated</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Progress Bar (When Active) ── */}
      <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-emerald-500 transition-all duration-700 ease-out"
          style={{ width: `${stage === 'idle' ? 0 : progress}%` }}
        />
      </div>

      {/* ── Connected Verification Flow ── */}
      <div className="my-5 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Verification Pipeline
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {stage === 'completed' ? '4 / 4 Complete' : stage === 'idle' ? 'Ready to Start' : 'Processing...'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 relative">
          {workflowSteps.map((step, idx) => {
            const active = isCurrentOrPast(step.id);
            const isCurrent = stage === step.id;
            return (
              <div key={step.id} className="relative flex flex-col items-center text-center">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    active
                      ? isCurrent
                        ? 'bg-[#155EEF] text-white ring-4 ring-blue-100 shadow-md scale-105'
                        : 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-400'
                  }`}
                >
                  {active && !isCurrent ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-bold mt-2 leading-tight ${
                    active ? 'text-[#071A33]' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[9px] text-slate-500 hidden sm:block mt-0.5 font-medium">
                  {step.sub}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Document Sources Grid ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#071A33] uppercase tracking-wider font-mono">
            Document Sources (Government Verified)
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Auto-Fetch & Direct Decrypt</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {documents.map((doc) => {
            const Icon = doc.icon;
            const isSelected = activeDoc === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setActiveDoc(doc.id as any)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                  isSelected
                    ? 'border-[#155EEF] bg-blue-50/40 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        doc.verified
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : doc.fetching
                          ? 'bg-blue-50 text-[#155EEF] border border-blue-200 animate-pulse'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#071A33]">{doc.name}</h4>
                      <p className="text-[10px] font-mono font-bold text-slate-500">{doc.issuer}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {doc.verified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    ) : doc.fetching ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#155EEF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        <span>Syncing</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        Ready
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-600 font-bold">{doc.number}</span>
                  <span className="text-[9px] text-slate-400 truncate max-w-[120px]">{doc.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Status & Security Metadata Card ── */}
      <div className="mt-4 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80">
        <div className="grid grid-cols-3 gap-3 text-left divide-x divide-slate-200/80">
          <div className="pr-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
              Verification Status
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  stage === 'completed' ? 'bg-emerald-500' : stage === 'idle' ? 'bg-blue-500' : 'bg-amber-500 animate-ping'
                }`}
              />
              <span className="text-xs font-bold text-[#071A33]">
                {stage === 'completed' ? 'Fully Certified' : stage === 'idle' ? 'Ready to Verify' : 'Verifying...'}
              </span>
            </div>
          </div>

          <div className="px-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
              Direct Source
            </span>
            <p className="mt-1 text-xs font-bold text-[#071A33] font-mono truncate">
              DigiLocker / MeitY
            </p>
          </div>

          <div className="pl-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
              Security Protocol
            </span>
            <div className="mt-1 flex items-center gap-1 text-slate-700">
              <Lock className="w-3 h-3 text-[#155EEF]" />
              <span className="text-xs font-bold text-[#071A33] font-mono">256-Bit PKI</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Trigger Bar ── */}
      <div className="mt-5 space-y-2">
        {stage === 'idle' ? (
          <button
            onClick={handleStart}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-sm shadow-lg shadow-[#155EEF]/25 hover:shadow-xl hover:shadow-[#155EEF]/35 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Zap className="w-4 h-4" />
            <span>Verify Documents via DigiLocker →</span>
          </button>
        ) : stage === 'completed' ? (
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/applications/new"
              className="flex-1 py-3 px-4 rounded-2xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Loan Origination</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleReset}
              className="py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Demo</span>
            </button>
          </div>
        ) : (
          <button
            disabled
            className="w-full py-3.5 px-5 rounded-2xl bg-blue-100 text-[#155EEF] font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4 animate-spin text-[#155EEF]" />
            <span>Verifying Government Documents ({progress}%)...</span>
          </button>
        )}
      </div>

      {/* Security footnote */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>UIDAI & NSDL Compliant · Zero Paper Storage</span>
        </span>
        <span className="text-[#155EEF] font-bold">Government Certified</span>
      </div>
    </div>
  );
};
