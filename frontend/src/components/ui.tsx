'use client';

import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, isValidElement } from 'react';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline-danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}) {
  const { isDark } = useTheme();

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

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:pointer-events-none cursor-pointer select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const { isDark } = useTheme();

  return (
    <input
      className={cn(
        'h-9 w-full rounded-xl border px-3 text-sm shadow-sm transition-colors focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 disabled:cursor-not-allowed',
        isDark
          ? 'border-[#2B3566] bg-[#1E2445] text-slate-100 placeholder:text-slate-500 disabled:bg-[#16203D] disabled:text-slate-500'
          : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500',
        className
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  children,
  noPadding = false,
}: {
  className?: string;
  children: ReactNode;
  noPadding?: boolean;
}) {
  const { isDark } = useTheme();

  return (
    <div
      className={cn(
        'rounded-2xl border transition-shadow',
        isDark
          ? 'border-[#2B3566] bg-[#1E2445] text-slate-100 shadow-none'
          : 'border-slate-200/80 bg-white text-slate-900 shadow-card',
        noPadding ? '' : 'p-5',
        className
      )}
    >
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  title,
  value,
  hint,
  subtext,
  icon: IconOrElement,
  trend,
  trendPositive,
  variant = 'default',
}: {
  label?: string;
  title?: string;
  value: string;
  hint?: string;
  subtext?: string;
  icon?: any;
  trend?: string;
  trendPositive?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const { isDark } = useTheme();
  const displayLabel = title || label || '';
  const displayHint = subtext || hint;

  const iconBg = {
    default: isDark ? 'bg-[#060F1B] text-[#60A5FA]' : 'bg-slate-100 text-slate-600',
    success: isDark ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-emerald-50 text-emerald-600',
    warning: isDark ? 'bg-amber-950/40 text-amber-400' : 'bg-amber-50 text-amber-600',
    danger: isDark ? 'bg-rose-950/40 text-rose-400' : 'bg-rose-50 text-rose-600',
  }[variant];

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between hover:shadow-card-hover transition-all">
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <p className={cn("text-[11px] font-bold uppercase tracking-wider truncate", isDark ? "text-slate-400" : "text-slate-500")}>
            {displayLabel}
          </p>
          <p className={cn("mt-1.5 text-xl sm:text-2xl font-bold tracking-tight truncate", isDark ? "text-white" : "text-slate-900")} title={value}>
            {value}
          </p>
        </div>
        {IconOrElement && (
          <div className={cn("flex h-9 w-9 flex-none items-center justify-center rounded-xl shrink-0", iconBg)}>
            {isValidElement(IconOrElement) ? (
              IconOrElement
            ) : (
              (() => {
                const Comp = IconOrElement;
                return <Comp className="h-4 w-4" />;
              })()
            )}
          </div>
        )}
      </div>

      {(displayHint || trend) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center font-bold text-[11px] px-1.5 py-0.5 rounded',
                trendPositive !== false
                  ? (isDark ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-emerald-50 text-emerald-700')
                  : (isDark ? 'bg-rose-950/40 text-rose-400' : 'bg-rose-50 text-rose-700')
              )}
            >
              {trend}
            </span>
          )}
          {displayHint && <span className={cn("truncate", isDark ? "text-slate-400" : "text-slate-500")}>{displayHint}</span>}
        </div>
      )}
    </Card>
  );
}

const badgeLightStyles: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  KYC_VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',

  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200/80',
  DISBURSED: 'bg-blue-50 text-blue-700 border-blue-200/80',
  READY_FOR_DISBURSEMENT: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  RESTRUCTURED: 'bg-purple-50 text-purple-700 border-purple-200/80',
  default: 'bg-slate-100 text-slate-600 border-slate-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200/80',

  KYC_PENDING: 'bg-amber-50 text-amber-700 border-amber-200/80',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200/80',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200/80',
  UNDERWRITING: 'bg-amber-50 text-amber-700 border-amber-200/80',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200/80',
  DUE: 'bg-amber-50 text-amber-700 border-amber-200/80',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/80',

  OVERDUE: 'bg-rose-50 text-rose-700 border-rose-200/80',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200/80',
  BLOCKED: 'bg-rose-50 text-rose-700 border-rose-200/80',
  HIGH: 'bg-rose-50 text-rose-700 border-rose-200/80',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200/80',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/80',

  CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
  SETTLED: 'bg-purple-50 text-purple-700 border-purple-200/80',
  INACTIVE: 'bg-slate-100 text-slate-500 border-slate-200',
};

const badgeDarkStyles: Record<string, string> = {
  ACTIVE: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
  KYC_VERIFIED: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
  VERIFIED: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
  APPROVED: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
  PAID: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
  SUCCESS: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
  LOW: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
  success: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',

  DRAFT: 'bg-[#16203D] text-slate-400 border-[#2B3566]',
  SUBMITTED: 'bg-[#2563EB]/15 text-[#60A5FA] border-[#2563EB]/30',
  DISBURSED: 'bg-[#2563EB]/15 text-[#60A5FA] border-[#2563EB]/30',
  READY_FOR_DISBURSEMENT: 'bg-indigo-950/40 text-indigo-300 border-indigo-800/40',
  RESTRUCTURED: 'bg-purple-950/40 text-purple-300 border-purple-800/40',
  default: 'bg-[#16203D] text-slate-400 border-[#2B3566]',
  info: 'bg-[#2563EB]/15 text-[#60A5FA] border-[#2563EB]/30',

  KYC_PENDING: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
  PENDING: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
  UNDER_REVIEW: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
  UNDERWRITING: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
  MEDIUM: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
  DUE: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
  warning: 'bg-amber-950/40 text-amber-300 border-amber-800/40',

  OVERDUE: 'bg-rose-950/40 text-rose-400 border-rose-800/40',
  REJECTED: 'bg-rose-950/40 text-rose-400 border-rose-800/40',
  BLOCKED: 'bg-rose-950/40 text-rose-400 border-rose-800/40',
  HIGH: 'bg-rose-950/40 text-rose-400 border-rose-800/40',
  FAILED: 'bg-rose-950/40 text-rose-400 border-rose-800/40',
  danger: 'bg-rose-950/40 text-rose-400 border-rose-800/40',

  CLOSED: 'bg-[#16203D] text-slate-300 border-[#2B3566]',
  SETTLED: 'bg-purple-950/40 text-purple-300 border-purple-800/40',
  INACTIVE: 'bg-[#16203D] text-slate-400 border-[#2B3566]',
};

export function Badge({
  status,
  variant,
  children,
  className,
}: {
  status?: string | null;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children?: ReactNode;
  className?: string;
}) {
  const { isDark } = useTheme();

  const key = status || variant || 'default';
  const styles = isDark ? badgeDarkStyles : badgeLightStyles;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold border',
        styles[key] ?? (isDark ? 'bg-[#16203D] text-slate-300 border-[#2B3566]' : 'bg-slate-100 text-slate-600 border-slate-200'),
        className
      )}
    >
      {children || (status ? status.replace(/_/g, ' ') : '')}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const { isDark } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className={cn(
        "mb-3 flex h-10 w-10 items-center justify-center rounded-xl",
        isDark ? "bg-[#16203D] text-slate-400" : "bg-slate-100 text-slate-400"
      )}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M3 7h18M3 12h18M3 17h12" strokeLinecap="round" />
        </svg>
      </div>
      <p className={cn("text-sm font-bold", isDark ? "text-slate-100" : "text-slate-800")}>{title}</p>
      {description && <p className={cn("mt-1 text-xs max-w-sm", isDark ? "text-slate-400" : "text-slate-500")}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
  };
  return (
    <div className="flex items-center justify-center py-12">
      <div className={cn('animate-spin rounded-full border-slate-200 border-t-blue-600', sizeMap[size])} />
    </div>
  );
}
