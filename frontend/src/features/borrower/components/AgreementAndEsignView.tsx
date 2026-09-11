import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Download,
} from 'lucide-react';
import { useGenerateAgreement, useInitiateESign, useCompleteESign } from '../hooks/useBorrower';

interface AgreementAndEsignViewProps {
  applicationId: string;
  onEsignCompleted?: () => void;
}

export const AgreementAndEsignView: React.FC<AgreementAndEsignViewProps> = ({
  applicationId,
  onEsignCompleted,
}) => {
  const [agreementGenerated, setAgreementGenerated] = useState(false);
  const [esignSessionId, setEsignSessionId] = useState<string | null>(null);
  const [isSigned, setIsSigned] = useState(false);

  const generateAgreementMutation = useGenerateAgreement();
  const initiateESignMutation = useInitiateESign();
  const completeESignMutation = useCompleteESign();

  const handleGenerateAndInitiate = () => {
    generateAgreementMutation.mutate(applicationId, {
      onSuccess: () => {
        setAgreementGenerated(true);
        initiateESignMutation.mutate(
          { applicationId, provider: 'AADHAAR_ESIGN' },
          {
            onSuccess: (data) => {
              setEsignSessionId(data?.sessionId || `sess-esign-${Date.now()}`);
            },
          }
        );
      },
    });
  };

  const handleCompleteESign = () => {
    const sessionId = esignSessionId || `sess-esign-${Date.now()}`;
    completeESignMutation.mutate(sessionId, {
      onSuccess: () => {
        setIsSigned(true);
        onEsignCompleted?.();
      },
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Digital Contract Execution</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Digital Loan Agreement & Electronic Signature (eSign)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Legally binding digital contract under the Information Technology Act 2000
          </p>
        </div>

        {isSigned && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>AGREEMENT EXECUTED</span>
          </span>
        )}
      </div>

      {/* Contract Viewer Container */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs text-slate-300 leading-relaxed max-h-80 overflow-y-auto scrollbar-thin">
        <div className="text-center font-bold text-white uppercase text-sm border-b border-slate-800 pb-2">
          MASTER DIGITAL LOAN AGREEMENT
        </div>
        <p>
          This Loan Agreement is executed on this date between the Lender and the Borrower as identified in the Loan Sanction Letter.
        </p>
        <p className="text-slate-400">
          1. <strong className="text-slate-200">SANCTION & REPAYMENT</strong>: The Borrower agrees to repay the Principal together with Interest accrued at the reducing rate specified in the Key Fact Statement (KFS) in regular Equated Monthly Installments (EMIs).
        </p>
        <p className="text-slate-400">
          2. <strong className="text-slate-200">AUTO-DEBIT MANDATE</strong>: The Borrower authorizes the Lender to debit the designated bank account via eNACH / NPCI Mandate on each monthly due date.
        </p>
        <p className="text-slate-400">
          3. <strong className="text-slate-200">COOLING-OFF PERIOD</strong>: The Borrower is entitled to a 3-day statutory cooling-off period from the date of execution to exit the loan by repaying principal without penalty.
        </p>
        <p className="text-slate-400">
          4. <strong className="text-slate-200">STATUTORY RECOVERY CODE</strong>: The Lender strictly adheres to RBI Fair Practices Code for loan recovery and borrower communication.
        </p>
      </div>

      {/* eSign Action Controls */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Electronic Signature Verification</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {isSigned
              ? 'Aadhaar eSign completed with cryptographic timestamp and audit signature.'
              : esignSessionId
              ? 'Aadhaar eSign session active. Click below to complete verification.'
              : 'Generate the digital agreement and initiate OTP/eSign.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isSigned && !esignSessionId && (
            <button
              onClick={handleGenerateAndInitiate}
              disabled={generateAgreementMutation.isPending || initiateESignMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>
                {generateAgreementMutation.isPending ? 'Generating Agreement...' : 'Generate & Initiate eSign'}
              </span>
            </button>
          )}

          {!isSigned && esignSessionId && (
            <button
              onClick={handleCompleteESign}
              disabled={completeESignMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{completeESignMutation.isPending ? 'Signing Contract...' : 'Complete Aadhaar eSign'}</span>
            </button>
          )}

          {isSigned && (
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready for eNACH Mandate Setup</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
