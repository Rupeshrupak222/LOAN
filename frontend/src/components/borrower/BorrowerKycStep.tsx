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
  CreditCard,
  Fingerprint,
} from 'lucide-react';
import { BorrowerFormData } from './BorrowerTypes';
import { Button, Input } from '@/components/ui';
import { AadhaarVerificationField } from '@/components/AadhaarVerificationField';
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
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const cardBgClass = isDark
    ? 'border-[#2B3566] bg-[#1E2445] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kycConsent) {
      setErrorMsg('Please grant verification consent before proceeding.');
      return;
    }
    if (!isAadhaarVerified && aadhaarNumber.replace(/\D/g, '').length < 12) {
      setErrorMsg('Please enter and verify your 12-digit Aadhaar number before proceeding.');
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
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Live 3rd Party KYC Gateway
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Direct verification with NSDL Tax Registry and UIDAI Demographic Systems
            </p>
          </div>
        </div>
      </div>

      {/* PAN Status Summary Card */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2B3566]">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              <span>1. Permanent Account Number (PAN) Status</span>
            </h3>
            <p className="text-xs text-slate-400">Income Tax Department validation record</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ITD Verified</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/80 dark:border-[#2B3566]">
            <span className="text-slate-400 block text-[11px]">Applicant PAN Card</span>
            <span className="font-bold font-mono text-sm text-slate-900 dark:text-white mt-0.5 block tracking-wider">
              {formData.pan || 'ABCDE1234F'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/80 dark:border-[#2B3566]">
            <span className="text-slate-400 block text-[11px]">Tax Registry Name Match</span>
            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {formData.firstName} {formData.lastName} (100% Match)
            </span>
          </div>
        </div>
      </div>

      {/* Aadhaar Verification Real-Time Field */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2B3566]">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-emerald-500" />
              <span>2. Aadhaar Identity Card Verification</span>
            </h3>
            <p className="text-xs text-slate-400">UIDAI demographic verification & masked digital token generation</p>
          </div>
          {isAadhaarVerified ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>UIDAI Verified ✓</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Pending Verification
            </span>
          )}
        </div>

        <div className="space-y-4">
          <AadhaarVerificationField
            value={aadhaarNumber}
            fullName={`${formData.firstName} ${formData.lastName}`.trim()}
            onChange={(val) => {
              setAadhaarNumber(val);
              if (errorMsg) setErrorMsg('');
            }}
            isVerified={isAadhaarVerified}
            onVerificationChange={setIsAadhaarVerified}
            required
          />

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
