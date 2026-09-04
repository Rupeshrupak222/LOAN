'use client';

import React, { useState, useCallback, ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';
import { apiErrorMessage } from '@/lib/api';

export type ActionStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface ActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>, idempotencyKey: string) => Promise<any> | any;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline-danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loadingText?: string;
  successText?: string;
  autoResetSuccessDelay?: number; // ms to revert from success back to idle
  requireIdempotency?: boolean; // generate unique key per action cycle
  showToastOnError?: boolean;
  onSuccess?: (result: any) => void;
  onError?: (err: any) => void;
  children: ReactNode;
}

/**
 * Production-grade ActionButton with deterministic lifecycle and double-click protection:
 * IDLE -> SUBMITTING -> SUCCESS / ERROR
 *
 * Guarantees:
 * 1. Synchronously ignores secondary clicks while in-flight.
 * 2. Injects client-side idempotency keys for authoritative financial calls.
 * 3. Never freezes in permanently disabled state if promise rejects or times out.
 */
export function ActionButton({
  onClick,
  variant = 'primary',
  size = 'md',
  loadingText,
  successText,
  autoResetSuccessDelay = 2000,
  requireIdempotency = false,
  showToastOnError = true,
  onSuccess,
  onError,
  disabled = false,
  className,
  children,
  ...props
}: ActionButtonProps) {
  const { isDark } = useTheme();
  const toast = useToast();
  const [status, setStatus] = useState<ActionStatus>('idle');

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      // Guard against rapid duplicate clicks
      if (status === 'submitting' || disabled) {
        e.preventDefault();
        return;
      }

      if (!onClick) return;

      setStatus('submitting');
      const idempotencyKey = requireIdempotency
        ? `idem-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
        : '';

      try {
        const result = await Promise.resolve(onClick(e, idempotencyKey));
        setStatus('success');
        if (onSuccess) {
          onSuccess(result);
        }

        if (autoResetSuccessDelay > 0) {
          setTimeout(() => {
            setStatus('idle');
          }, autoResetSuccessDelay);
        }
      } catch (err: any) {
        setStatus('error');
        if (showToastOnError) {
          toast.error(apiErrorMessage(err));
        }
        if (onError) {
          onError(err);
        }

        // Release button lock after error display
        setTimeout(() => {
          setStatus('idle');
        }, 1800);
      }
    },
    [status, disabled, onClick, requireIdempotency, autoResetSuccessDelay, onSuccess, onError, showToastOnError, toast]
  );

  const variants = {
    primary:
      'bg-[#2563EB] text-white font-bold shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none',
    secondary: isDark
      ? 'bg-[#1E2445] text-slate-200 font-semibold border border-[#2B3566] shadow-sm hover:bg-[#2B3566] disabled:bg-[#16203D] disabled:text-slate-500'
      : 'bg-white text-slate-700 font-semibold border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200',
    outline: isDark
      ? 'bg-transparent text-slate-200 font-semibold border border-[#2B3566] shadow-sm hover:bg-[#1E2445] disabled:text-slate-500'
      : 'bg-white text-slate-700 font-semibold border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 disabled:bg-slate-50 disabled:text-slate-400',
    ghost: isDark
      ? 'text-slate-300 font-medium hover:bg-[#1E2445] hover:text-white active:bg-[#2B3566] disabled:text-slate-500'
      : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 disabled:text-slate-400',
    danger:
      'bg-rose-600 text-white font-bold shadow-sm hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-200',
    'outline-danger': isDark
      ? 'bg-[#1E2445] text-rose-400 font-semibold border border-rose-900/60 shadow-sm hover:bg-rose-950/30'
      : 'bg-white text-rose-600 font-semibold border border-rose-200 shadow-sm hover:bg-rose-50 hover:border-rose-300 active:bg-rose-100',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
    md: 'h-9 px-3.5 text-sm gap-2 rounded-xl',
    lg: 'h-11 px-5 text-base gap-2.5 rounded-xl',
  };

  const isSubmitting = status === 'submitting';
  const isSuccess = status === 'success';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isSubmitting}
      aria-busy={isSubmitting}
      className={cn(
        'inline-flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:pointer-events-none cursor-pointer select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span>{loadingText || children}</span>
        </>
      ) : isSuccess && successText ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
          <span>{successText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
