import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { BorrowerFormData } from './BorrowerTypes';
import { Button } from '@/components/ui';
import { BankVerificationField } from '@/components/BankVerificationField';
import { cn } from '@/lib/utils';

interface Props {
  formData: BorrowerFormData;
  updateField: <K extends keyof BorrowerFormData>(key: K, value: BorrowerFormData[K]) => void;
  onNext: () => void;
  onBack: () => void;
  isDark: boolean;
}

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCT_REGEX = /^[0-9]{8,20}$/;

export const BorrowerBankStep: React.FC<Props> = ({
  formData,
  updateField,
  onNext,
  onBack,
  isDark,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isBankVerified, setIsBankVerified] = useState(false);

  const cardBgClass = isDark
    ? 'border-[#2B3566] bg-[#1E2445] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  const defaultHolderName =
    formData.accountHolderName ||
    `${formData.firstName} ${formData.lastName}`.trim() ||
    'Rahul Sharma';

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    const holder = (formData.accountHolderName || defaultHolderName).trim();
    if (!holder) errs.accountHolderName = 'Account holder name is required';

    const cleanAcct = formData.accountNumber.trim();
    if (!cleanAcct || !ACCT_REGEX.test(cleanAcct)) {
      errs.accountNumber = 'Valid account number (8-20 digits) is required';
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
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">Step 6: Bank Account for Loan Disbursal</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Live NPCI Penny Drop
              </span>
            </div>
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
          Account Beneficiary Details & NPCI Verification
        </h3>

        <BankVerificationField
          accountNumber={formData.accountNumber}
          confirmAccountNumber={formData.confirmAccountNumber}
          ifscCode={formData.ifscCode}
          bankName={formData.bankName}
          accountHolderName={formData.accountHolderName || defaultHolderName}
          onAccountNumberChange={(val) => {
            updateField('accountNumber', val);
            if (errors.accountNumber) setErrors((prev) => ({ ...prev, accountNumber: '' }));
          }}
          onConfirmAccountNumberChange={(val) => {
            updateField('confirmAccountNumber', val);
            if (errors.confirmAccountNumber) setErrors((prev) => ({ ...prev, confirmAccountNumber: '' }));
          }}
          onIfscChange={(val) => {
            updateField('ifscCode', val);
            if (errors.ifscCode) setErrors((prev) => ({ ...prev, ifscCode: '' }));
          }}
          onBankNameChange={(val) => {
            updateField('bankName', val);
            if (errors.bankName) setErrors((prev) => ({ ...prev, bankName: '' }));
          }}
          onAccountHolderNameChange={(val) => {
            updateField('accountHolderName', val);
            if (errors.accountHolderName) setErrors((prev) => ({ ...prev, accountHolderName: '' }));
          }}
          isVerified={isBankVerified}
          onVerificationChange={setIsBankVerified}
          errors={errors}
        />
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
