import React from 'react';
import {
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  FileText,
  ShieldCheck,
  Award,
  CreditCard,
  Building,
  ArrowRight,
} from 'lucide-react';

export type StageGateStatus = 'COMPLETED' | 'CURRENT' | 'LOCKED';

export interface StageGateStep {
  id: string;
  number: number;
  label: string;
  description: string;
  status: StageGateStatus;
  actionText?: string;
}

interface StageGatedJourneyProps {
  currentStage: string;
  onActionClick?: (stepId: string) => void;
}

export const StageGatedJourney: React.FC<StageGatedJourneyProps> = ({
  currentStage,
  onActionClick,
}) => {
  // Determine statuses based on current application stage
  const getStepStatus = (stepOrder: number): StageGateStatus => {
    const stageMap: Record<string, number> = {
      DRAFT: 1,
      SUBMITTED: 2,
      KYC_PENDING: 2,
      KYC_VERIFIED: 3,
      UNDER_REVIEW: 3,
      CREDIT_ASSESSMENT: 3,
      UNDERWRITING: 3,
      APPROVED: 4,
      OFFER_READY: 4,
      OFFER_ACCEPTED: 5,
      AGREEMENT_PENDING: 5,
      MANDATE_PENDING: 6,
      READY_FOR_DISBURSEMENT: 7,
      DISBURSED: 8,
    };

    const currentOrder = stageMap[currentStage] || 1;

    if (stepOrder < currentOrder) return 'COMPLETED';
    if (stepOrder === currentOrder) return 'CURRENT';
    return 'LOCKED';
  };

  const steps: StageGateStep[] = [
    {
      id: 'APPLICATION',
      number: 1,
      label: 'Application',
      description: 'Profile & Loan Customization',
      status: getStepStatus(1),
      actionText: 'Edit Application',
    },
    {
      id: 'KYC',
      number: 2,
      label: 'eKYC & Identity',
      description: 'PAN & Aadhaar Verification',
      status: getStepStatus(2),
      actionText: 'Complete KYC',
    },
    {
      id: 'DECISION',
      number: 3,
      label: 'Credit Review',
      description: 'Automated BRE & Underwriting',
      status: getStepStatus(3),
      actionText: 'Track Status',
    },
    {
      id: 'OFFER',
      number: 4,
      label: 'Offer & KFS',
      description: 'Review Terms & Statutory KFS',
      status: getStepStatus(4),
      actionText: 'Review Offer',
    },
    {
      id: 'AGREEMENT',
      number: 5,
      label: 'Digital Agreement',
      description: 'Electronic Signature (eSign)',
      status: getStepStatus(5),
      actionText: 'Sign Agreement',
    },
    {
      id: 'MANDATE',
      number: 6,
      label: 'eNACH Mandate',
      description: 'Repayment Auto-Debit Setup',
      status: getStepStatus(6),
      actionText: 'Set up Mandate',
    },
    {
      id: 'DISBURSEMENT',
      number: 7,
      label: 'Disbursement',
      description: 'Direct Bank Transfer',
      status: getStepStatus(7),
      actionText: 'View Payout',
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span>Digital Loan Journey Progress</span>
          </h3>
          <p className="text-xs text-slate-400">Stage-gated process ensuring regulatory compliance and seamless fulfillment</p>
        </div>
      </div>

      {/* Progress Stepper Bar */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {steps.map((step, idx) => {
          const isCompleted = step.status === 'COMPLETED';
          const isCurrent = step.status === 'CURRENT';
          const isLocked = step.status === 'LOCKED';

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                isCurrent
                  ? 'bg-blue-950/40 border-blue-500/50 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30'
                  : isCompleted
                  ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/20 border-slate-900 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isCurrent
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.number}
                  </span>

                  {isCompleted && (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      ✓ Done
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1 animate-pulse">
                      ● Active
                    </span>
                  )}
                  {isLocked && (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>

                <h4
                  className={`text-xs font-bold leading-tight ${
                    isCurrent ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">
                  {step.description}
                </p>
              </div>

              {isCurrent && onActionClick && step.actionText && (
                <button
                  onClick={() => onActionClick(step.id)}
                  className="mt-3 w-full py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1 shadow-md transition-all"
                >
                  <span>{step.actionText}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
