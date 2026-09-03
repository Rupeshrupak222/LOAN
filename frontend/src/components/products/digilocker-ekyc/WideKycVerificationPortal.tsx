'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  User,
  CreditCard,
  FileText,
  Cloud,
  Lock,
  ArrowRight,
  RefreshCw,
  Zap,
  Check,
  Fingerprint,
  Car,
  Landmark,
} from 'lucide-react';

interface WideKycVerificationPortalProps {
  onStartVerification?: () => void;
  isExternalTriggering?: boolean;
}

export const WideKycVerificationPortal: React.FC<WideKycVerificationPortalProps> = ({
  onStartVerification,
  isExternalTriggering,
}) => {
  // Verification lifecycle: 'idle' | 'consent' | 'fetching' | 'matching' | 'completed'
  const [stage, setStage] = useState<'idle' | 'consent' | 'fetching' | 'matching' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);

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

  const workflowSteps = [
    { id: 'consent', num: '1', label: 'Customer', sub: 'OTP Consent', icon: User },
    { id: 'fetching', num: '2', label: 'DigiLocker', sub: 'Signed XML', icon: Cloud },
    { id: 'matching', num: '3', label: 'Document Verification', sub: 'AI 3D Match', icon: FileText },
    { id: 'completed', num: '4', label: 'KYC Completed', sub: '100% Certified', icon: ShieldCheck },
  ];

  const isCurrentOrPast = (stepId: string) => {
    const order = ['consent', 'fetching', 'matching', 'completed'];
    const currentIdx = stage === 'idle' ? -1 : order.indexOf(stage);
    const stepIdx = order.indexOf(stepId);
    return stepIdx <= currentIdx;
  };

  const documents = [
    {
      id: 'aadhaar',
      name: 'Aadhaar Card',
      issuer: 'UIDAI',
      icon: Fingerprint,
      verified: stage === 'completed' || stage === 'matching',
      fetching: stage === 'fetching',
    },
    {
      id: 'pan',
      name: 'PAN Card',
      issuer: 'NSDL',
      icon: CreditCard,
      verified: stage === 'completed' || stage === 'matching',
      fetching: stage === 'fetching',
    },
    {
      id: 'dl',
      name: 'Driving Licence',
      issuer: 'MoRTH',
      icon: Car,
      verified: stage === 'completed',
      fetching: stage === 'fetching' || stage === 'matching',
    },
    {
      id: 'bank',
      name: 'Bank Account',
      issuer: 'NPCI / AA',
      icon: Landmark,
      verified: stage === 'completed',
      fetching: stage === 'matching',
    },
  ];

  return (
    <div
      id="kyc-dashboard-visual"
      className="w-full rounded-3xl bg-[#051326] border border-blue-900/50 shadow-2xl shadow-blue-950/70 p-6 sm:p-8 space-y-6 text-white transition-all text-left relative overflow-hidden"
    >
      {/* ── Background Subtle Ambient Blue Glow ── */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-600/10 blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-indigo-600/10 blur-[90px] pointer-events-none" />

      {/* ── Top Header Row ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-blue-900/50 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-[#3B82F6] shadow-xs">
            <ShieldCheck className="w-6 h-6 text-[#3B82F6]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                DigiLocker e-KYC
              </h3>
              <span className="text-[10px] font-bold font-mono text-[#3B82F6] bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-400/30 uppercase">
                OFFICIAL REPO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Enterprise Loan Applicant Verification Portal
            </p>
          </div>
        </div>

        {/* Dynamic Verification Ready Pill */}
        <div>
          {stage === 'idle' && (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Verification Ready</span>
            </span>
          )}
          {(stage === 'consent' || stage === 'fetching' || stage === 'matching') && (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#3B82F6] bg-blue-500/15 border border-blue-400/30 shadow-xs">
              <RefreshCw className="w-3.5 h-3.5 text-[#3B82F6] animate-spin" />
              <span>
                {stage === 'consent' && 'Awaiting OTP Consent...'}
                {stage === 'fetching' && 'Fetching Signed XML...'}
                {stage === 'matching' && 'Matching Biometrics...'}
              </span>
            </span>
          )}
          {stage === 'completed' && (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>KYC Certified & Validated</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Progress Bar ── */}
      {stage !== 'idle' && (
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden -mt-2 relative z-10">
          <div
            className="h-full bg-gradient-to-r from-[#155EEF] via-[#3B82F6] to-emerald-400 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* ── Middle Row: Two Dark Glass Panels (Pipeline with Symbols + Status) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
        {/* Left: Verification Pipeline Box */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#0B1E38]/85 border border-blue-500/25 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              VERIFICATION PIPELINE
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {stage === 'completed' ? '4 / 4 Complete' : stage === 'idle' ? 'Ready to Start' : 'Processing...'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 relative">
            {workflowSteps.map((step) => {
              const active = isCurrentOrPast(step.id);
              const isCurrent = stage === step.id;
              const StepIcon = step.icon;

              return (
                <div key={step.id} className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all ${
                        active
                          ? isCurrent
                            ? 'bg-[#155EEF] text-white ring-4 ring-blue-400/30 shadow-lg scale-105'
                            : 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-blue-500/15 border border-blue-400/30 text-[#3B82F6] shadow-xs'
                      }`}
                    >
                      {active && !isCurrent ? (
                        <Check className="w-5 h-5 stroke-[3] text-white" />
                      ) : (
                        <StepIcon className={`w-5 h-5 ${active ? 'text-white' : 'text-[#3B82F6]'}`} />
                      )}
                    </div>

                    {/* Step Number Tag Badge */}
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#071A33] border border-blue-400/30 text-[9px] font-mono font-bold text-slate-300 flex items-center justify-center shadow-xs">
                      {step.num}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-bold mt-2 leading-tight ${
                      active ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    {step.sub}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Status & Protocol Box */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#0B1E38]/85 border border-blue-500/25 backdrop-blur-md flex flex-col justify-between">
          <div className="grid grid-cols-3 gap-3 text-left divide-x divide-blue-900/50 my-auto">
            <div className="pr-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                VERIFICATION STATUS
              </span>
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    stage === 'completed' ? 'bg-emerald-400' : stage === 'idle' ? 'bg-blue-400' : 'bg-amber-400 animate-ping'
                  }`}
                />
                <span className="text-xs font-bold text-white truncate">
                  {stage === 'completed' ? 'Verified' : stage === 'idle' ? 'Ready to Verify' : 'Verifying...'}
                </span>
              </div>
            </div>

            <div className="px-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                DIRECT SOURCE
              </span>
              <p className="mt-2 text-xs font-bold text-white font-mono truncate">
                DigiLocker / MeitY
              </p>
            </div>

            <div className="pl-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                SECURITY PROTOCOL
              </span>
              <div className="mt-2 flex items-center gap-1 text-slate-200">
                <Lock className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
                <span className="text-xs font-bold text-white font-mono">256-Bit PKI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Document Sources Row ── */}
      <div className="space-y-3 pt-2 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            DOCUMENT SOURCES (GOVERNMENT VERIFIED)
          </span>
          <span className="text-xs text-slate-400 font-medium font-mono">
            Auto-Fetch & Direct Decrypt
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {documents.map((doc) => {
            const Icon = doc.icon;
            return (
              <div
                key={doc.id}
                className="p-4 rounded-2xl border border-blue-500/20 bg-[#0B1E38]/70 hover:border-blue-400/40 hover:bg-[#0B1E38]/90 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      doc.verified
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : doc.fetching
                        ? 'bg-blue-500/20 text-[#3B82F6] border border-blue-400/30 animate-pulse'
                        : 'bg-blue-500/15 text-[#3B82F6] border border-blue-400/25'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{doc.name}</h4>
                    <p className="text-[10px] font-mono font-medium text-slate-400">{doc.issuer}</p>
                  </div>
                </div>

                {/* Status Pill */}
                <div>
                  {doc.verified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Verified</span>
                    </span>
                  ) : doc.fetching ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3B82F6] bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-400/30">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>Syncing</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-[#3B82F6] bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                      Ready
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Interactive Action Bar ── */}
      <div className="pt-2 relative z-10">
        {stage === 'idle' ? (
          <button
            onClick={handleStart}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#155EEF] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-lg shadow-[#155EEF]/30 hover:shadow-xl hover:shadow-[#155EEF]/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Zap className="w-4 h-4" />
            <span>Verify Documents via DigiLocker →</span>
          </button>
        ) : stage === 'completed' ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/applications/new"
              className="flex-1 py-3 px-5 rounded-2xl bg-[#155EEF] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Loan Origination</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleReset}
              className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
              <span>Reset Demo</span>
            </button>
          </div>
        ) : (
          <button
            disabled
            className="w-full py-3.5 px-5 rounded-2xl bg-blue-900/40 text-blue-300 border border-blue-500/30 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4 animate-spin text-[#3B82F6]" />
            <span>Verifying Government Documents ({progress}%)...</span>
          </button>
        )}
      </div>

      {/* Security footnote */}
      <div className="pt-3 border-t border-blue-900/50 flex items-center justify-between text-[11px] font-mono text-slate-400 relative z-10">
        <span className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Security: 256-Bit SSL Encrypted · UIDAI & NSDL Compliant · Zero Paper Storage</span>
        </span>
        <span className="text-[#3B82F6] font-bold">Government Certified</span>
      </div>
    </div>
  );
};
