'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Coins,
  Wallet,
  ArrowRight,
  AlertTriangle,
  XCircle,
  PhoneCall,
  Download,
  Building,
  Calendar,
  Sparkles,
  Plus,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { cn, formatMoney, formatDate } from '@/lib/utils';

interface Props {
  application: any;
  onApplyNew?: () => void;
  isDark: boolean;
}

const LIFECYCLE_STAGES = [
  {
    key: 'SUBMITTED',
    title: '1. Application Submitted',
    subtext: 'Received in Central Registry',
    icon: FileText,
  },
  {
    key: 'KYC_EVALUATION',
    title: '2. KYC & Document Verification',
    subtext: 'PAN, Aadhaar & Income proofs',
    icon: ShieldCheck,
  },
  {
    key: 'CREDIT_ASSESSMENT',
    title: '3. Credit Risk & DTI Appraisal',
    subtext: 'Analyst policy & capacity checks',
    icon: Coins,
  },
  {
    key: 'UNDERWRITING',
    title: '4. Sanction & Underwriting',
    subtext: 'Credit committee approval',
    icon: Building,
  },
  {
    key: 'DISBURSED',
    title: '5. Funds Disbursed',
    subtext: 'Direct credit to bank account',
    icon: Wallet,
  },
];

export const BorrowerApplicationTracker: React.FC<Props> = ({
  application,
  onApplyNew,
  isDark,
}) => {
  const cardBgClass = isDark
    ? 'border-[#2B3566] bg-[#1E2445] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  const status = application?.status || 'SUBMITTED';
  const isRejected = status === 'REJECTED';
  const isDisbursed = status === 'DISBURSED';
  const isApproved = ['APPROVED', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(status);
  const isUnderwriting = ['UNDERWRITING'].includes(status) || isApproved;
  const isCreditAssessment = ['CREDIT_ASSESSMENT'].includes(status) || isUnderwriting;
  const isKycEvaluation = ['UNDER_REVIEW'].includes(status) || isCreditAssessment;

  const getStageStatus = (stageKey: string): 'COMPLETED' | 'IN_PROGRESS' | 'QUEUED' => {
    if (isRejected) return 'QUEUED';
    if (stageKey === 'SUBMITTED') return 'COMPLETED';
    if (stageKey === 'KYC_EVALUATION') {
      if (isCreditAssessment) return 'COMPLETED';
      if (isKycEvaluation) return 'IN_PROGRESS';
      return 'QUEUED';
    }
    if (stageKey === 'CREDIT_ASSESSMENT') {
      if (isUnderwriting) return 'COMPLETED';
      if (isCreditAssessment) return 'IN_PROGRESS';
      return 'QUEUED';
    }
    if (stageKey === 'UNDERWRITING') {
      if (isApproved) return 'COMPLETED';
      if (isUnderwriting) return 'IN_PROGRESS';
      return 'QUEUED';
    }
    if (stageKey === 'DISBURSED') {
      if (isDisbursed) return 'COMPLETED';
      if (status === 'READY_FOR_DISBURSEMENT') return 'IN_PROGRESS';
      return 'QUEUED';
    }
    return 'QUEUED';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Application Summary Hero */}
      <div
        className={cn(
          'p-6 sm:p-8 rounded-3xl border relative overflow-hidden',
          isDisbursed
            ? 'bg-gradient-to-br from-emerald-950/40 via-[#0C2219] to-[#061811] border-emerald-500/40'
            : isRejected
            ? 'bg-gradient-to-br from-rose-950/40 via-[#270E16] to-[#18060B] border-rose-500/40'
            : 'bg-gradient-to-br from-blue-950/40 via-[#0F1E3A] to-[#0A162B] border-blue-500/30'
        )}
      >
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/10 text-white border border-white/20">
                {application?.applicationNo || 'APP-PENDING'}
              </span>
              <Badge status={status} />
            </div>

            <div className="text-xs text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Applied: {application?.createdAt ? formatDate(application.createdAt) : 'Today'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {application?.product?.name || application?.productName || 'Personal Loan Facility'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {isDisbursed
                  ? 'Your sanctioned loan amount has been credited to your bank account.'
                  : isApproved
                  ? 'Your loan has been officially sanctioned and is queued for electronic disbursement.'
                  : isRejected
                  ? 'Your loan application was not approved during underwriting review.'
                  : 'Your application is progressing smoothly through our multi-tier underwriting committee.'}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs text-slate-400 block font-medium">Sanction Request</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                {formatMoney(application?.requestedAmount || 0)}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                for {application?.tenureMonths || 24} Months
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Stage Live Lifecycle Stepper */}
      <div className={cn('p-6 sm:p-8 rounded-3xl border space-y-6', cardBgClass)}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>Application Underwriting Lifecycle</span>
          </h3>
          <span className="text-xs font-semibold text-slate-400">Real-time Stage Progress</span>
        </div>

        {/* Stepper items */}
        <div className="space-y-4">
          {LIFECYCLE_STAGES.map((stage, idx) => {
            const stageStatus = getStageStatus(stage.key);
            const Icon = stage.icon;

            return (
              <div
                key={stage.key}
                className={cn(
                  'p-4 rounded-2xl border transition-all flex items-center justify-between gap-4',
                  stageStatus === 'COMPLETED'
                    ? 'border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/15'
                    : stageStatus === 'IN_PROGRESS'
                    ? 'border-blue-500/40 bg-blue-50/30 dark:bg-blue-950/20 ring-1 ring-blue-500/20'
                    : 'border-slate-200/60 dark:border-[#2B3566]/60 opacity-60'
                )}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs',
                      stageStatus === 'COMPLETED'
                        ? 'bg-emerald-500 text-white'
                        : stageStatus === 'IN_PROGRESS'
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    )}
                  >
                    {stageStatus === 'COMPLETED' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {stage.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">{stage.subtext}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {stageStatus === 'COMPLETED' && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </span>
                  )}
                  {stageStatus === 'IN_PROGRESS' && (
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 animate-pulse">
                      In Review...
                    </span>
                  )}
                  {stageStatus === 'QUEUED' && (
                    <span className="text-[11px] text-slate-400">Next in Queue</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disbursal Destination Bank Verification Card */}
      <div className={cn('p-6 rounded-3xl border space-y-3', cardBgClass)}>
        <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-500" />
          <span>Registered Disbursal Account</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/60 dark:border-[#2B3566]">
            <span className="text-slate-400 block text-[11px]">Bank Name</span>
            <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
              {application?.customer?.bankName || 'State Bank of India'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/60 dark:border-[#2B3566]">
            <span className="text-slate-400 block text-[11px]">Account Number</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
              {application?.customer?.bankAccountNo
                ? `•••• •••• ${application.customer.bankAccountNo.slice(-4)}`
                : 'Verified on File'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/60 dark:border-[#2B3566]">
            <span className="text-slate-400 block text-[11px]">IFSC Code</span>
            <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {application?.customer?.bankIfsc || 'SBIN0001234'}
            </span>
          </div>
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {onApplyNew && (
          <Button
            type="button"
            variant="outline"
            onClick={onApplyNew}
            className="text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Apply for Another Facility</span>
          </Button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <Link href="/loans">
            <Button size="sm" variant="secondary" className="text-xs">
              View All Loan Accounts →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
