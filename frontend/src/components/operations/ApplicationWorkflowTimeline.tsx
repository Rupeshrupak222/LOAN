'use client';

import React from 'react';
import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';

interface Props {
  currentStage: string;
  status: string;
}

const STAGES = [
  { key: 'LEAD', label: 'Lead' },
  { key: 'APPLICATION_STARTED', label: 'Started' },
  { key: 'APPLICATION_SUBMITTED', label: 'Submitted' },
  { key: 'DOCUMENT_VERIFICATION', label: 'Docs Review' },
  { key: 'CREDIT_ASSESSMENT', label: 'Credit Desk' },
  { key: 'UNDERWRITING', label: 'Underwriting' },
  { key: 'APPROVAL', label: 'Approval' },
  { key: 'SANCTION', label: 'Sanction' },
  { key: 'DISBURSEMENT', label: 'Disbursement' },
  { key: 'DISBURSED', label: 'Disbursed' },
  { key: 'ACTIVE', label: 'Active Loan' },
];

export function ApplicationWorkflowTimeline({ currentStage, status }: Props) {
  const isTerminalReject = status === 'REJECTED' || currentStage === 'REJECTED';
  const isTerminalCancel = status === 'CANCELLED' || currentStage === 'CANCELLED';

  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Application Lifecycle & Workflow Progress
        </h4>
        <div className="flex items-center gap-2">
          {isTerminalReject && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-500/10 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/40">
              <XCircle className="h-3 w-3" /> Application Rejected
            </span>
          )}
          {isTerminalCancel && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-500/10 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
              <XCircle className="h-3 w-3" /> Application Cancelled
            </span>
          )}
        </div>
      </div>

      {/* Horizontal step bar */}
      <div className="relative flex items-center justify-between overflow-x-auto pb-2 custom-scrollbar">
        {STAGES.map((stage, idx) => {
          const isCompleted = currentIndex > idx;
          const isCurrent = currentIndex === idx;

          return (
            <div key={stage.key} className="flex flex-col items-center min-w-[75px] relative z-10">
              {/* Connector line */}
              {idx < STAGES.length - 1 && (
                <div
                  className={`absolute top-3.5 left-1/2 w-full h-0.5 -z-10 ${
                    currentIndex > idx
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}

              {/* Node Icon */}
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isCurrent
                    ? 'bg-white dark:bg-slate-900 border-2 border-blue-600 text-blue-600 dark:text-blue-400 ring-4 ring-blue-500/15 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCurrent ? (
                  <Clock className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-2 w-2 fill-current" />
                )}
              </div>

              {/* Label */}
              <span
                className={`mt-2 text-[10px] font-semibold text-center whitespace-nowrap ${
                  isCurrent
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : isCompleted
                    ? 'text-slate-800 dark:text-slate-200'
                    : 'text-slate-400'
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
