import React, { useState } from 'react';
import {
  CreditCard,
  Building,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useInitiateMandate, useVerifyMandate } from '../hooks/useBorrower';

interface MandateSetupViewProps {
  applicationId: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  } | null;
  onMandateCompleted?: () => void;
}

export const MandateSetupView: React.FC<MandateSetupViewProps> = ({
  applicationId,
  bankAccount,
  onMandateCompleted,
}) => {
  const [mandateId, setMandateId] = useState<string | null>(null);
  const [isMandateActive, setIsMandateActive] = useState(false);

  const initiateMandateMutation = useInitiateMandate();
  const verifyMandateMutation = useVerifyMandate();

  const handleInitiate = () => {
    initiateMandateMutation.mutate(
      { applicationId },
      {
        onSuccess: (data) => {
          setMandateId(data?.mandateId || `mand-enach-${Date.now()}`);
        },
      }
    );
  };

  const handleVerify = () => {
    const id = mandateId || `mand-enach-${Date.now()}`;
    verifyMandateMutation.mutate(id, {
      onSuccess: () => {
        setIsMandateActive(true);
        onMandateCompleted?.();
      },
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4" />
            <span>Repayment Automation</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            eNACH / NPCI Auto-Debit Mandate Setup
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automate monthly EMI deductions securely via NPCI National Automated Clearing House
          </p>
        </div>

        {isMandateActive && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>MANDATE ACTIVE</span>
          </span>
        )}
      </div>

      {/* Bank Account Details Grid */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Designated Bank</span>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{bankAccount?.bankName || 'HDFC Bank Ltd.'}</span>
          </div>
        </div>

        <div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Account Number</span>
          <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
            {bankAccount?.accountNumber ? `•••• •••• ${bankAccount.accountNumber.slice(-4)}` : '•••• •••• 9812'}
          </div>
        </div>

        <div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">IFSC Code</span>
          <div className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
            {bankAccount?.ifscCode || 'HDFC0001234'}
          </div>
        </div>
      </div>

      {/* Mandate Actions */}
      <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">eNACH Mandate Status</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isMandateActive
              ? 'eNACH auto-debit active with designated bank. Ready for loan payout.'
              : mandateId
              ? 'Mandate session registered with NPCI gateway. Complete authentication below.'
              : 'Register auto-debit mandate for designated repayment account.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isMandateActive && !mandateId && (
            <button
              onClick={handleInitiate}
              disabled={initiateMandateMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>{initiateMandateMutation.isPending ? 'Registering Mandate...' : 'Register eNACH Mandate'}</span>
            </button>
          )}

          {!isMandateActive && mandateId && (
            <button
              onClick={handleVerify}
              disabled={verifyMandateMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{verifyMandateMutation.isPending ? 'Verifying Mandate...' : 'Verify & Activate eNACH'}</span>
            </button>
          )}

          {isMandateActive && (
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready for Immediate Disbursement</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
