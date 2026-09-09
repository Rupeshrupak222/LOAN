'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Coins,
  Building,
  Wallet,
  AlertCircle,
  XCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';

interface Props {
  applications: any[];
  onApplyNew?: () => void;
  isDark: boolean;
}

const LIFECYCLE_STAGES = [
  { key: 'SUBMITTED', title: '1. Application Submitted', icon: FileText },
  { key: 'KYC_EVALUATION', title: '2. KYC & Document Verification', icon: ShieldCheck },
  { key: 'CREDIT_ASSESSMENT', title: '3. Credit Risk & Capacity Appraisal', icon: Coins },
  { key: 'UNDERWRITING', title: '4. Sanction & Underwriting', icon: Building },
  { key: 'DISBURSED', title: '5. Funds Disbursed to Bank', icon: Wallet },
];

export const BorrowerApplicationHistory: React.FC<Props> = ({
  applications,
  onApplyNew,
  isDark,
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const cardBgClass = isDark
    ? 'border-[#1E2445] bg-[#0E1528] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  const rows = Array.isArray(applications) ? applications : [];

  // Default selected application to the first one or active one
  const selectedApp =
    rows.find((a) => a.id === selectedAppId) ||
    rows.find((a) => !['REJECTED', 'CLOSED', 'CANCELLED'].includes(a.status)) ||
    rows[0];

  const getStageStatus = (appStatus: string, stageKey: string): 'COMPLETED' | 'IN_PROGRESS' | 'QUEUED' => {
    const status = (appStatus || 'SUBMITTED').toUpperCase();
    const isRejected = status === 'REJECTED';
    const isDisbursed = status === 'DISBURSED';
    const isApproved = ['APPROVED', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(status);
    const isUnderwriting = ['UNDERWRITING'].includes(status) || isApproved;
    const isCreditAssessment = ['CREDIT_ASSESSMENT'].includes(status) || isUnderwriting;
    const isKycEvaluation = ['UNDER_REVIEW', 'KYC_VERIFIED'].includes(status) || isCreditAssessment;

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
    <div className={cn('p-6 sm:p-8 rounded-3xl border space-y-6 animate-fade-in', cardBgClass)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold tracking-tight">Loan Application Requests</h3>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
              {rows.length} Total Requests
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete record of all loan facility applications submitted for underwriting review.
          </p>
        </div>

        {onApplyNew && (
          <Button
            type="button"
            size="sm"
            onClick={onApplyNew}
            className="bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Apply for Another Facility</span>
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
            <FileText className="h-6 w-6" />
          </div>
          <p className="text-xs text-slate-400">You haven&apos;t submitted any loan applications yet.</p>
          {onApplyNew && (
            <Button
              type="button"
              size="sm"
              onClick={onApplyNew}
              className="bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold mt-2"
            >
              Start Instant Application →
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Application Live Timeline if selectedApp exists */}
          {selectedApp && (
            <div className="p-5 sm:p-6 rounded-2xl border border-blue-500/30 bg-blue-950/15 dark:bg-[#091526] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    Application #{selectedApp.applicationNo}
                  </span>
                  <Badge status={selectedApp.status} />
                </div>

                <span className="text-xs text-slate-400">
                  Requested: {formatDate(selectedApp.createdAt)}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 text-xs border-y border-slate-200 dark:border-blue-900/30 py-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Facility</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedApp.product?.name || selectedApp.product || 'Personal Loan'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Requested Amount</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatMoney(Number(selectedApp.requestedAmount || 0))}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tenure</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedApp.tenureMonths || 24} Months
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Purpose</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {selectedApp.purpose || 'Personal'}
                  </span>
                </div>
              </div>

              {/* 5-Stage Visual Stepper */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Application Underwriting Timeline:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                  {LIFECYCLE_STAGES.map((stage) => {
                    const stageStatus = getStageStatus(selectedApp.status, stage.key);
                    const Icon = stage.icon;

                    return (
                      <div
                        key={stage.key}
                        className={cn(
                          'p-3 rounded-xl border flex sm:flex-col items-center justify-between sm:justify-center gap-2 text-center transition-all',
                          stageStatus === 'COMPLETED'
                            ? 'border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                            : stageStatus === 'IN_PROGRESS'
                            ? 'border-blue-500/40 bg-blue-50/40 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300 font-bold animate-pulse'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-400 opacity-60'
                        )}
                      >
                        <div
                          className={cn(
                            'h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                            stageStatus === 'COMPLETED'
                              ? 'bg-emerald-500 text-white'
                              : stageStatus === 'IN_PROGRESS'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          )}
                        >
                          {stageStatus === 'COMPLETED' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-[11px] leading-tight font-medium">{stage.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* List of All Past Applications */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              All Submitted Loan Requests
            </h4>

            <div className="space-y-2.5">
              {rows.map((app) => {
                const isCurrent = app.id === selectedApp?.id;

                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={cn(
                      'p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer',
                      isCurrent
                        ? 'border-blue-500/60 bg-blue-50/30 dark:bg-blue-950/20 ring-1 ring-blue-500/30'
                        : 'border-slate-200 dark:border-[#1E2445] hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                            {app.applicationNo}
                          </span>
                          <Badge status={app.status} />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {app.product?.name || app.product || 'Personal Loan'} • Applied on{' '}
                          {formatDate(app.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs ml-auto sm:ml-0">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatMoney(Number(app.requestedAmount || 0))}
                      </span>
                      <span className="text-slate-400">({app.tenureMonths || 24} mos)</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold p-1 h-auto"
                      >
                        <span>{isCurrent ? 'Viewing' : 'Inspect'} →</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
