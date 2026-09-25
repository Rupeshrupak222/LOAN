'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Building2, CheckCircle2, AlertCircle, Edit2, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import { Button, Input, Spinner } from '@/components/ui';
import { kycApi, BankVerifyResult, IfscLookupResult } from '@/lib/kycApi';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';

interface BankVerificationFieldProps {
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  bankName: string;
  accountHolderName: string;
  onAccountNumberChange: (val: string) => void;
  onConfirmAccountNumberChange: (val: string) => void;
  onIfscChange: (val: string) => void;
  onBankNameChange: (val: string) => void;
  onAccountHolderNameChange: (val: string) => void;
  isVerified: boolean;
  onVerificationChange: (verified: boolean, result?: BankVerifyResult) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  className?: string;
}

export const BankVerificationField: React.FC<BankVerificationFieldProps> = ({
  accountNumber,
  confirmAccountNumber,
  ifscCode,
  bankName,
  accountHolderName,
  onAccountNumberChange,
  onConfirmAccountNumberChange,
  onIfscChange,
  onBankNameChange,
  onAccountHolderNameChange,
  isVerified,
  onVerificationChange,
  errors = {},
  disabled = false,
  className,
}) => {
  const toast = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLookingUpIfsc, setIsLookingUpIfsc] = useState(false);
  const [ifscDetails, setIfscDetails] = useState<IfscLookupResult | null>(null);
  const [bankResult, setBankResult] = useState<BankVerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const acctRef = useRef<HTMLInputElement>(null);

  const cleanIfsc = ifscCode.trim().toUpperCase();
  const isIfscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc);
  const isAcctValid = /^\d{8,20}$/.test(accountNumber.trim());
  const doAcctsMatch = accountNumber.trim() === confirmAccountNumber.trim();

  // Auto lookup IFSC when 11 chars are typed
  useEffect(() => {
    if (isIfscValid && (!ifscDetails || ifscDetails.ifsc !== cleanIfsc)) {
      setIsLookingUpIfsc(true);
      kycApi
        .lookupIfsc(cleanIfsc)
        .then((data) => {
          setIfscDetails(data);
          if (data.bankName && (!bankName || bankName === 'State Bank of India')) {
            onBankNameChange(data.bankName);
          }
        })
        .catch(() => {})
        .finally(() => setIsLookingUpIfsc(false));
    }
  }, [cleanIfsc, isIfscValid]);

  const handleVerifyBank = async () => {
    if (!isAcctValid) {
      toast.error('Please enter a valid bank account number (8-20 digits)');
      return;
    }
    if (!doAcctsMatch) {
      toast.error('Account numbers do not match');
      return;
    }
    if (!isIfscValid) {
      toast.error('Please enter a valid 11-digit IFSC code');
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    try {
      const res = await kycApi.verifyBankAccount(accountNumber, cleanIfsc, accountHolderName);
      if (res.isAccountValid) {
        setBankResult(res);
        onVerificationChange(true, res);
        if (res.bankName) {
          onBankNameChange(res.bankName);
        }
        toast.success(`Bank Account verified via NPCI Penny Drop! Beneficiary: ${res.nameAtBank}`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Bank verification failed.';
      setVerifyError(msg);
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChangeBank = () => {
    onVerificationChange(false);
    setBankResult(null);
    setVerifyError(null);
    setTimeout(() => {
      acctRef.current?.focus();
      acctRef.current?.select();
    }, 50);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Account Beneficiary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Account Holder Name (As per Bank Records) *
          </label>
          <Input
            type="text"
            value={accountHolderName}
            onChange={(e) => {
              if (isVerified) onVerificationChange(false);
              onAccountHolderNameChange(e.target.value);
            }}
            disabled={disabled || isVerified}
            className="text-xs font-medium"
            placeholder="Rahul Sharma"
          />
          {errors.accountHolderName && (
            <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.accountHolderName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
            <span>IFSC Code (11 alphanumeric characters) *</span>
            {isIfscValid && (
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Validated
              </span>
            )}
          </label>
          <div className="relative">
            <Input
              type="text"
              maxLength={11}
              placeholder="e.g. SBIN0001234"
              value={ifscCode}
              onChange={(e) => {
                if (isVerified) onVerificationChange(false);
                onIfscChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
              }}
              disabled={disabled || isVerified}
              className="text-xs font-mono uppercase tracking-wider h-10"
            />
            {isLookingUpIfsc && (
              <span className="absolute right-3 top-3">
                <Spinner size="sm" />
              </span>
            )}
          </div>
          {ifscDetails && (
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 shrink-0" />
              <span>
                {ifscDetails.bankName} • {ifscDetails.branchName}, {ifscDetails.city}
              </span>
            </p>
          )}
          {errors.ifscCode && (
            <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.ifscCode}
            </p>
          )}
        </div>
      </div>

      {/* Account Number Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Bank Account Number *
          </label>
          <Input
            ref={acctRef}
            type={isVerified ? 'text' : 'password'}
            placeholder="e.g. 10029384756"
            value={isVerified ? `XXXXXXXX${accountNumber.slice(-4)}` : accountNumber}
            onChange={(e) => {
              if (isVerified) onVerificationChange(false);
              onAccountNumberChange(e.target.value.replace(/\D/g, ''));
            }}
            disabled={disabled || isVerified}
            className="text-xs font-mono tracking-wider h-10"
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
            value={isVerified ? `XXXXXXXX${accountNumber.slice(-4)}` : confirmAccountNumber}
            onChange={(e) => {
              if (isVerified) onVerificationChange(false);
              onConfirmAccountNumberChange(e.target.value.replace(/\D/g, ''));
            }}
            disabled={disabled || isVerified}
            className="text-xs font-mono tracking-wider h-10"
          />
          {errors.confirmAccountNumber && (
            <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.confirmAccountNumber}
            </p>
          )}
        </div>
      </div>

      {/* Action Verification Button / Banner */}
      <div className="pt-1">
        {isVerified ? (
          <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/30 flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-emerald-950 dark:text-emerald-200 block text-xs">
                  NPCI Penny Drop Verified ✓ (₹1.00 Test Success)
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block">
                  Beneficiary: {bankResult?.nameAtBank || accountHolderName} • {bankResult?.bankName || bankName}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleChangeBank}
              className="px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 transition shadow-2xs"
            >
              <Edit2 className="h-3 w-3" />
              <span>Change Bank</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#060F1B]/60">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Verify account ownership via instant ₹1.00 NPCI Penny Drop</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={handleVerifyBank}
              disabled={!isAcctValid || !doAcctsMatch || !isIfscValid || isVerifying || disabled}
              className="h-8 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs"
            >
              {isVerifying ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  Verify Bank Account (Penny Drop)
                </>
              )}
            </Button>
          </div>
        )}

        {verifyError && !isVerified && (
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-2">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {verifyError}
          </p>
        )}
      </div>
    </div>
  );
};
