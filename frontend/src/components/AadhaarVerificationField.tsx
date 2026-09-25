'use client';

import React, { useState, useRef } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Edit2, Sparkles, Fingerprint, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button, Input, Spinner } from '@/components/ui';
import { kycApi, AadhaarVerifyResult } from '@/lib/kycApi';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';

interface AadhaarVerificationFieldProps {
  value: string;
  fullName?: string;
  onChange: (value: string) => void;
  isVerified: boolean;
  onVerificationChange: (verified: boolean, result?: AadhaarVerifyResult) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const AadhaarVerificationField: React.FC<AadhaarVerificationFieldProps> = ({
  value,
  fullName,
  onChange,
  isVerified,
  onVerificationChange,
  required = true,
  error,
  disabled = false,
  className,
}) => {
  const toast = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [aadhaarResult, setAadhaarResult] = useState<AadhaarVerifyResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cleanDigits = value.replace(/\D/g, '').slice(0, 12);
  const isValidFormat = cleanDigits.length === 12;
  const hasRequiredIdentity = Boolean(fullName && fullName.trim().length >= 2);

  // Format 12-digit into 4-4-4 groups
  const formattedDisplay = cleanDigits.replace(/(\d{4})(?=\d)/g, '$1 ');

  const handleVerifyAadhaar = async () => {
    if (!isValidFormat) {
      toast.error('Please enter a full 12-digit Aadhaar number');
      return;
    }

    if (!hasRequiredIdentity) {
      toast.error('Enter borrower identity details (First Name & Last Name) before Aadhaar verification.');
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    try {
      const res = await kycApi.verifyAadhaar(cleanDigits, fullName);
      if (res.verified && res.status === 'VERIFIED') {
        setAadhaarResult(res);
        onVerificationChange(true, res);
        const isSbx = res.providerMetadata?.isSandbox ?? true;
        toast.success(
          isSbx
            ? `Aadhaar ending in ${res.aadhaarLast4} validated in sandbox simulation environment.`
            : `Aadhaar ending in ${res.aadhaarLast4} verified against authoritative provider.`
        );
      } else {
        const failureReason = res.message || 'Aadhaar verification failed. Identity name does not match registered record.';
        setVerifyError(failureReason);
        onVerificationChange(false);
        toast.error(failureReason);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to verify Aadhaar.';
      setVerifyError(msg);
      onVerificationChange(false);
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChangeAadhaar = () => {
    onVerificationChange(false);
    setAadhaarResult(null);
    setVerifyError(null);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const isSandbox = aadhaarResult?.providerMetadata?.isSandbox ?? true;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label Row */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Fingerprint className="h-3.5 w-3.5 text-emerald-500" />
          <span>Aadhaar Identity Number (12 Digits)</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
          {isVerified && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border',
                isSandbox
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
              )}
            >
              <CheckCircle2 className="h-3 w-3" />
              {isSandbox ? 'SANDBOX VALIDATED' : 'LIVE VERIFIED'}
            </span>
          )}
        </label>
        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
          {isValidFormat && !isVerified && (
            <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              AADHAAR FORMAT VALID
            </span>
          )}
          <span>KYC Adapter</span>
          {isSandbox && <span className="text-[9px] px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded font-mono">SANDBOX</span>}
        </div>
      </div>

      {/* Input + Action Button */}
      <div className="relative flex items-center">
        <Input
          ref={inputRef}
          type="text"
          maxLength={14} // 12 digits + 2 spaces
          value={isVerified ? `XXXX XXXX ${cleanDigits.slice(-4)}` : formattedDisplay}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
            if (isVerified) {
              onVerificationChange(false);
              setAadhaarResult(null);
            }
            setVerifyError(null);
            onChange(raw);
          }}
          placeholder="5432 1098 7654"
          disabled={disabled || isVerified}
          className={cn(
            'font-mono tracking-widest text-xs font-bold h-10 pr-40',
            isVerified && (isSandbox ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-200' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'),
            error && !isVerified && 'border-rose-500 ring-1 ring-rose-500'
          )}
        />

        {/* Right Action Button Inside Input */}
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isVerified ? (
            <button
              type="button"
              onClick={handleChangeAadhaar}
              title="Change Aadhaar Number"
              className="px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Edit2 className="h-3 w-3" />
              <span>Change Aadhaar</span>
            </button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={handleVerifyAadhaar}
              disabled={!isValidFormat || !hasRequiredIdentity || isVerifying || disabled}
              title={!hasRequiredIdentity ? "Enter the borrower's required identity details (First Name & Last Name) before Aadhaar verification." : undefined}
              className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-lg shadow-2xs transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Validate Aadhaar
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Identity Prerequisite Requirement Hint */}
      {!isVerified && !hasRequiredIdentity && isValidFormat && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-1 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg border border-amber-200/80 dark:border-amber-800/80">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>Enter the borrower's required identity details (First Name & Last Name) before Aadhaar verification.</span>
        </p>
      )}

      {/* Field Error / Verification Failed */}
      {(error || verifyError) && !isVerified && (
        <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1.5 mt-1">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-rose-600" />
          <span>VERIFICATION FAILED: {error || verifyError}</span>
        </div>
      )}

      {/* Verified Details Card */}
      {isVerified && aadhaarResult && (
        <div
          className={cn(
            'p-3 rounded-xl border text-xs flex items-center justify-between animate-in fade-in duration-200',
            isSandbox
              ? 'border-amber-200 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/30'
              : 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/30'
          )}
        >
          <div className="flex items-start gap-2">
            <Sparkles
              className={cn(
                'h-4 w-4 shrink-0 mt-0.5',
                isSandbox ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              )}
            />
            <div className="space-y-0.5">
              <span
                className={cn(
                  'font-bold text-[11px] block',
                  isSandbox ? 'text-amber-950 dark:text-amber-200' : 'text-emerald-950 dark:text-emerald-200'
                )}
              >
                {isSandbox ? 'SANDBOX VALIDATED' : 'LIVE VERIFIED'}: {aadhaarResult.maskedAadhaar} ({aadhaarResult.name})
              </span>
              <p
                className={cn(
                  'text-[10px]',
                  isSandbox ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-400'
                )}
              >
                Demographic Profile: Validated • Gender: {aadhaarResult.gender}
              </p>
              {isSandbox && (
                <p className="text-[9px] font-medium text-amber-700 dark:text-amber-400">
                  ⚠ Sandbox validation — not live identity verification.
                </p>
              )}
            </div>
          </div>
          <span
            className={cn(
              'text-[9px] font-mono font-semibold px-2 py-0.5 rounded border',
              isSandbox
                ? 'text-amber-800 dark:text-amber-300 bg-white/80 dark:bg-amber-900/60 border-amber-200 dark:border-amber-700'
                : 'text-emerald-600 dark:text-emerald-400 bg-white/80 dark:bg-emerald-900/60 border-emerald-200 dark:border-emerald-700'
            )}
          >
            {aadhaarResult.providerReference}
          </span>
        </div>
      )}
    </div>
  );
};
