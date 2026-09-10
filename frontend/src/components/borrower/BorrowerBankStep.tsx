'use client';

import React, { useState } from 'react';
import {
  Building2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Lock,
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

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCT_REGEX = /^[0-9]{9,18}$/;

const POPULAR_BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'IndusInd Bank',
  'Federal Bank',
  'IDFC FIRST Bank',
];

export const BorrowerBankStep: React.FC<Props> = ({
  formData,
  updateField,
  onNext,
  onBack,
  isDark,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cardBgClass = isDark
    ? 'border-[#2B3566] bg-[#1E2445] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  const defaultHolderName =
    formData.accountHolderName ||
    `${formData.firstName} ${formData.lastName}`.trim() ||
    'Rahul Sharma';

  const isIfscValid = IFSC_REGEX.test(formData.ifscCode.trim().toUpperCase());

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    const holder = (formData.accountHolderName || defaultHolderName).trim();
    if (!holder) errs.accountHolderName = 'Account holder name is required';

    if (!formData.bankName.trim()) errs.bankName = 'Bank name is required';

    const cleanAcct = formData.accountNumber.trim();
    if (!cleanAcct || !ACCT_REGEX.test(cleanAcct)) {
      errs.accountNumber = 'Valid account number (9-18 digits) is required';
    }

    if (formData.confirmAccountNumber.trim() !== cleanAcct) {
      errs.confirmAccountNumber = 'Account numbers do not match';
    }

    const cleanIfsc = formData.ifscCode.trim().toUpperCase();
    if (!cleanIfsc || !IFSC_REGEX.test(cleanIfsc)) {
      errs.ifscCode = 'Valid 11-character IFSC code is required (e.g. SBIN0001234)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountHolderName) {
      updateField('accountHolderName', defaultHolderName);
    }
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Step Header */}
      <div className={cn('p-6 rounded-3xl border space-y-2', cardBgClass)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Step 6: Bank Account for Loan Disbursal</h2>
            <p className="text-xs text-slate-400">
              Provide your primary bank account for instant loan crediting and automated repayment setup
            </p>
          </div>
        </div>
      </div>

      {/* Disbursal Information Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-emerald-800 dark:text-emerald-300">
            Direct Electronic Fund Transfer (NEFT / RTGS)
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
            Your approved funds will be credited directly to this account upon sanction approval. The bank account must belong to you as the primary borrower.
          </p>
        </div>
      </div>

      {/* Bank Form Fields */}
      <div className={cn('p-6 rounded-3xl border space-y-5', cardBgClass)}>
        <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300">
          Account Beneficiary Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Account Holder Name (As per Bank Records) *
            </label>
            <Input
              type="text"
              value={formData.accountHolderName || defaultHolderName}
              onChange={(e) => {
                updateField('accountHolderName', e.target.value);
                if (errors.accountHolderName) setErrors((prev) => ({ ...prev, accountHolderName: '' }));
              }}
              className="text-xs font-medium"
            />
            {errors.accountHolderName && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.accountHolderName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Bank Name *
            </label>
            <select
              value={formData.bankName}
              onChange={(e) => {
                updateField('bankName', e.target.value);
                if (errors.bankName) setErrors((prev) => ({ ...prev, bankName: '' }));
              }}
              className={cn(
                'w-full h-10 rounded-xl border px-3 text-xs font-medium focus:outline-none focus:border-[#2563EB]',
                isDark
                  ? 'border-[#2B3566] bg-[#060F1B] text-slate-200'
                  : 'border-slate-200 bg-white text-slate-800'
              )}
            >
              {POPULAR_BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
              <option value="Other Commercial / Regional Bank">Other Commercial / Regional Bank</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Account Type *
            </label>
            <select
              value={formData.accountType}
              onChange={(e) => updateField('accountType', e.target.value as any)}
              className={cn(
                'w-full h-10 rounded-xl border px-3 text-xs font-medium focus:outline-none focus:border-[#2563EB]',
                isDark
                  ? 'border-[#2B3566] bg-[#060F1B] text-slate-200'
                  : 'border-slate-200 bg-white text-slate-800'
              )}
            >
              <option value="SAVINGS">Savings Account</option>
              <option value="CURRENT">Current Account</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Bank Account Number *
            </label>
            <Input
              type="password"
              placeholder="e.g. 10029384756"
              value={formData.accountNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                updateField('accountNumber', val);
                if (errors.accountNumber) setErrors((prev) => ({ ...prev, accountNumber: '' }));
              }}
              className="text-xs font-mono tracking-wider"
            />
            {errors.accountNumber && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.accountNumber}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Confirm Account Number *
            </label>
            <Input
              type="text"
              placeholder="Re-enter account number"
              value={formData.confirmAccountNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                updateField('confirmAccountNumber', val);
                if (errors.confirmAccountNumber)
                  setErrors((prev) => ({ ...prev, confirmAccountNumber: '' }));
              }}
              className="text-xs font-mono tracking-wider"
            />
            {errors.confirmAccountNumber && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.confirmAccountNumber}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
            <span>IFSC Code (11 alphanumeric characters) *</span>
            {isIfscValid && (
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> IFSC Format Validated
              </span>
            )}
          </label>
          <div className="relative max-w-sm">
            <Input
              type="text"
              maxLength={11}
              placeholder="e.g. SBIN0001234"
              value={formData.ifscCode}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                updateField('ifscCode', val);
                if (errors.ifscCode) setErrors((prev) => ({ ...prev, ifscCode: '' }));
              }}
              className="text-xs font-mono uppercase tracking-wider"
            />
          </div>
          {errors.ifscCode && (
            <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.ifscCode}
            </p>
          )}
          <p className="text-[11px] text-slate-400 mt-1">
            Example: <span className="font-mono">SBIN0001234</span>, <span className="font-mono">HDFC0000060</span>, <span className="font-mono">ICIC0000001</span>
          </p>
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
          <span>Back: KYC Identity</span>
        </Button>

        <Button
          type="submit"
          className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-8 py-3 rounded-xl shadow-md flex items-center gap-2"
        >
          <span>Next: Loan Scheme & Tenure</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};
