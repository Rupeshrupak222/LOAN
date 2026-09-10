'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  FileCheck,
  Smartphone,
  Eye,
  KeyRound,
} from 'lucide-react';
import { BorrowerFormData } from './BorrowerTypes';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Props {
  formData: BorrowerFormData;
  updateField: <K extends keyof BorrowerFormData>(key: K, value: BorrowerFormData[K]) => void;
  onNext: () => void;
  onBack: () => void;
  isDark: boolean;
}

export const BorrowerKycStep: React.FC<Props> = ({
  formData,
  updateField,
  onNext,
  onBack,
  isDark,
}) => {
  const [aadhaarLast4, setAadhaarLast4] = useState('8921');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const cardBgClass = isDark
    ? 'border-[#2B3566] bg-[#1E2445] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  const handleSimulateVerify = () => {
    if (!formData.kycConsent) {
      setErrorMsg('Please accept the identity verification consent to proceed.');
      return;
    }
    setErrorMsg('');
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 800);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kycConsent) {
      setErrorMsg('Please grant verification consent before proceeding.');
      return;
    }
    onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Step Header */}
      <div className={cn('p-6 rounded-3xl border space-y-2', cardBgClass)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">Step 5: KYC & Identity Verification</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Sandbox Demo Simulation
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Instant digital verification simulation with transparent sandbox labeling
            </p>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300">
          Verification Pathway
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => updateField('kycMode', 'SIMULATED_DEMO')}
            className={cn(
              'p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-32',
              formData.kycMode === 'SIMULATED_DEMO'
                ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                : isDark
                ? 'border-[#2B3566] bg-[#060F1B]/60 text-slate-400 hover:border-slate-700'
                : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Instant Digital KYC (Demo)</span>
              </span>
              {formData.kycMode === 'SIMULATED_DEMO' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive sandbox verification that simulates instant PAN-Aadhaar verification in seconds.
            </p>
          </button>

          <button
            type="button"
            onClick={() => updateField('kycMode', 'MANUAL_UPLOAD')}
            className={cn(
              'p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-32',
              formData.kycMode === 'MANUAL_UPLOAD'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                : isDark
                ? 'border-[#2B3566] bg-[#060F1B]/60 text-slate-400 hover:border-slate-700'
                : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-500" />
                <span>Manual Document Verification</span>
              </span>
              {formData.kycMode === 'MANUAL_UPLOAD' && (
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload physical scanned copies of government ID for manual review by our loan underwriting team.
            </p>
          </button>
        </div>
      </div>

      {/* PAN Verification Card */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2B3566]">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300">
              1. Permanent Account Number (PAN) Status
            </h3>
            <p className="text-xs text-slate-400">Income Tax Department validation status</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Format Validated</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/80 dark:border-[#2B3566]">
            <span className="text-slate-400 block text-[11px]">Applicant Legal PAN</span>
            <span className="font-bold font-mono text-sm text-slate-900 dark:text-white mt-0.5 block tracking-wider">
              {formData.pan || 'ABCDE1234F'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/80 dark:border-[#2B3566]">
            <span className="text-slate-400 block text-[11px]">ITD Tax Registry Name Match</span>
            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {formData.firstName} {formData.lastName} (100% Match)
            </span>
          </div>
        </div>
      </div>

      {/* Aadhaar Verification Sandbox Simulation */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2B3566]">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300">
              2. Aadhaar Identity Card Verification
            </h3>
            <p className="text-xs text-slate-400">UIDAI demographic verification simulation</p>
          </div>
          {isVerified ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified (Sandbox)</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Pending OTP
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Masked Aadhaar Number
              </label>
              <div className="relative">
                <Input
                  type="text"
                  disabled
                  value={`XXXX  XXXX  ${aadhaarLast4}`}
                  className="font-mono text-xs tracking-widest bg-slate-100 dark:bg-slate-800"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Linked Mobile Number
              </label>
              <Input
                type="text"
                disabled
                value={`+91  ******${formData.mobile ? formData.mobile.slice(-4) : '3210'}`}
                className="font-mono text-xs bg-slate-100 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Legal Consent Checkbox */}
          <div className="p-3.5 rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20">
            <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={formData.kycConsent}
                onChange={(e) => {
                  updateField('kycConsent', e.target.checked);
                  if (e.target.checked) setErrorMsg('');
                }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-500"
              />
              <span>
                <strong>Identity Verification Consent:</strong> I voluntarily consent to Adyapan LMS verifying my identity credentials and generating a digital verification token solely for the purpose of credit evaluation and KYC compliance.
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isVerified && (
            <Button
              type="button"
              onClick={handleSimulateVerify}
              disabled={isVerifying}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2"
            >
              {isVerifying ? 'Verifying Sandbox ID...' : 'Complete Simulated Verification'}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="text-xs flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back: Obligations</span>
        </Button>

        <Button
          type="submit"
          className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-8 py-3 rounded-xl shadow-md flex items-center gap-2"
        >
          <span>Next: Bank Account for Disbursal</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};
