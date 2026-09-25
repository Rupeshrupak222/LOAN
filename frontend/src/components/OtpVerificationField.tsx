'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  KeyRound,
  Edit2,
} from 'lucide-react';
import { Button, Input, Spinner } from '@/components/ui';
import { otpApi } from '@/lib/otpApi';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';

interface OtpVerificationFieldProps {
  type: 'MOBILE' | 'EMAIL';
  label: string;
  subLabel?: string;
  value: string;
  onChange: (value: string) => void;
  isVerified: boolean;
  onVerificationChange: (verified: boolean) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  inputRef?: React.Ref<HTMLInputElement>;
  className?: string;
}

export const OtpVerificationField: React.FC<OtpVerificationFieldProps> = ({
  type,
  label,
  subLabel,
  value,
  onChange,
  isVerified,
  onVerificationChange,
  required = true,
  error,
  disabled = false,
  placeholder,
  maxLength,
  inputRef,
  className,
}) => {
  const toast = useToast();
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [debugOtpHint, setDebugOtpHint] = useState<string | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const internalInputRef = useRef<HTMLInputElement>(null);

  // Focus and select the main input field
  const focusMainInput = () => {
    setTimeout(() => {
      if (inputRef && typeof inputRef === 'object' && 'current' in inputRef && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      } else if (internalInputRef.current) {
        internalInputRef.current.focus();
        internalInputRef.current.select();
      }
    }, 50);
  };

  // Reset verification & OTP state to change number/email
  const handleChangeTarget = () => {
    onVerificationChange(false);
    setIsOtpSent(false);
    setOtpCode('');
    setOtpError(null);
    setDebugOtpHint(null);
    focusMainInput();
  };

  // Countdown timer for resend cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const isValidFormat =
    type === 'MOBILE'
      ? /^[6-9]\d{9}$/.test(value.trim().replace(/\D/g, ''))
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  // Handle Send / Resend OTP
  const handleSendOtp = async () => {
    if (!isValidFormat) {
      toast.error(
        type === 'MOBILE'
          ? 'Please enter a valid 10-digit mobile number'
          : 'Please enter a valid email address'
      );
      return;
    }

    setIsSending(true);
    setOtpError(null);
    try {
      const res = await otpApi.send(value.trim(), type, 'BORROWER_VERIFICATION');
      setIsOtpSent(true);
      setCooldown(res.cooldownSeconds || 30);
      if (res.debugOtp) {
        setDebugOtpHint(res.debugOtp);
      }
      toast.success(res.message || `OTP sent to your ${type === 'MOBILE' ? 'mobile' : 'email'}!`);
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 150);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send OTP. Please try again.';
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setOtpError('Please enter the full 6-digit OTP code');
      return;
    }

    setIsVerifying(true);
    setOtpError(null);
    try {
      const res = await otpApi.verify(value.trim(), type, otpCode.trim());
      if (res.verified) {
        onVerificationChange(true);
        setIsOtpSent(false);
        setOtpCode('');
        setDebugOtpHint(null);
        toast.success(res.message || `${type === 'MOBILE' ? 'Mobile number' : 'Email'} verified successfully!`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error?.message || err?.message || 'Invalid or expired OTP. Please try again.';
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  // Allow user to reset verification if they modify their input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isVerified) {
      onVerificationChange(false);
      setIsOtpSent(false);
      setOtpCode('');
    }
    onChange(e.target.value);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label Row */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
          {isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Verified ✓
            </span>
          )}
        </label>
        {subLabel && <span className="text-[10px] text-slate-400">{subLabel}</span>}
      </div>

      {/* Main Input + Action Buttons Container */}
      <div className="relative flex items-center">
        {type === 'MOBILE' && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 border-r border-slate-200 dark:border-slate-700 pr-2 pointer-events-none z-10">
            +91
          </span>
        )}
        {type === 'EMAIL' && (
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
        )}

        <Input
          ref={inputRef || internalInputRef}
          type={type === 'MOBILE' ? 'tel' : 'email'}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder || (type === 'MOBILE' ? '9876543210' : 'name@example.com')}
          maxLength={maxLength}
          disabled={disabled || isVerified}
          className={cn(
            type === 'MOBILE' ? 'pl-14' : 'pl-9',
            isVerified ? 'pr-36' : 'pr-28',
            'font-medium tracking-wide h-10 transition-all',
            isVerified && 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200',
            error && !isVerified && 'border-rose-500 ring-1 ring-rose-500'
          )}
        />

        {/* Right Action Button Inside Input */}
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isVerified ? (
            <button
              type="button"
              onClick={handleChangeTarget}
              title={`Change ${type === 'MOBILE' ? 'Mobile Number' : 'Email Address'}`}
              className="px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Edit2 className="h-3 w-3" />
              <span>Change {type === 'MOBILE' ? 'Number' : 'Email'}</span>
            </button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant={isOtpSent ? 'outline' : 'primary'}
              onClick={handleSendOtp}
              disabled={!isValidFormat || isSending || cooldown > 0 || disabled}
              className={cn(
                'h-7 px-2.5 text-[11px] font-bold rounded-lg transition-all',
                isOtpSent
                  ? 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-2xs'
              )}
            >
              {isSending ? (
                <Spinner size="sm" />
              ) : cooldown > 0 ? (
                `Resend (${cooldown}s)`
              ) : isOtpSent ? (
                'Resend OTP'
              ) : (
                <>
                  <Send className="h-2.5 w-2.5 mr-1" />
                  Send OTP
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Field Level Error Message */}
      {error && !isVerified && (
        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}

      {/* Inline OTP Verification Expansion Box */}
      {isOtpSent && !isVerified && (
        <div className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/70 dark:bg-sky-950/40 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-sky-900 dark:text-sky-200">
              <KeyRound className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>
                Enter OTP sent to <strong className="font-bold">{type === 'MOBILE' ? `+91 ${value}` : value}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleChangeTarget}
              className="text-[11px] font-bold text-sky-700 dark:text-sky-300 hover:underline flex items-center gap-1"
            >
              <Edit2 className="h-2.5 w-2.5" />
              Change {type === 'MOBILE' ? 'Number' : 'Email'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                ref={otpInputRef}
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  setOtpError(null);
                  setOtpCode(e.target.value.replace(/\D/g, ''));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleVerifyOtp();
                  }
                }}
                placeholder="6-digit OTP (e.g. 482910)"
                className="h-9 font-mono tracking-widest text-center text-sm font-bold bg-white dark:bg-[#1E2445] border-sky-300 dark:border-sky-700"
              />
            </div>

            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={handleVerifyOtp}
              disabled={otpCode.length < 4 || isVerifying}
              className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs"
            >
              {isVerifying ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  Verify OTP
                </>
              )}
            </Button>
          </div>

          {/* OTP Error Message */}
          {otpError && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/50 p-2 rounded-lg border border-rose-200 dark:border-rose-900">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
              {otpError}
            </p>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-sky-200/60 dark:border-sky-800/40">
            <div className="flex items-center gap-1">
              <span>Wrong {type === 'MOBILE' ? 'number' : 'email'}?</span>
              <button
                type="button"
                onClick={handleChangeTarget}
                className="font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Change {type === 'MOBILE' ? 'mobile number' : 'email'}
              </button>
            </div>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={cooldown > 0 || isSending}
              className={cn(
                'font-bold transition flex items-center gap-1',
                cooldown > 0
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-sky-600 dark:text-sky-400 hover:underline cursor-pointer'
              )}
            >
              <RotateCcw className="h-3 w-3" />
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
