'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  Lock,
  FileCheck,
  Clock,
  X,
  UserCheck,
  AlertCircle,
  Eye,
  FileText,
  ExternalLink,
  Info,
  DollarSign,
  TrendingDown,
  CreditCard,
  XCircle,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { Badge, Button, Card } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';

export const BRANCH_MANAGER_LIMIT = 500000; // ₹5,00,000 Delegated Authority Limit

interface BranchManagerReviewSectionProps {
  applicationId: string;
  applicationNo?: string;
  requestedAmount: number;
  currentStatus: string;
  customer: any;
  product: any;
  eligibility: any;
  riskAssessment: any;
  approvals?: any[];
  documents?: any[];
  onDecisionSubmitted?: () => void;
}

export function BranchManagerReviewSection({
  applicationId,
  applicationNo,
  requestedAmount,
  currentStatus,
  customer,
  product,
  eligibility,
  riskAssessment,
  approvals = [],
  documents = [],
  onDecisionSubmitted,
}: BranchManagerReviewSectionProps) {
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeModal, setActiveModal] = useState<'APPROVE' | 'SEND_BACK' | 'ESCALATE' | null>(null);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [remarks, setRemarks] = useState('');

  const numRequestedAmount = Number(requestedAmount || 0);
  const isWithinLimit = numRequestedAmount <= BRANCH_MANAGER_LIMIT;
  const hasCreditAssessment = !!eligibility;
  const isAssessmentEligible = eligibility?.result === 'ELIGIBLE';

  const terminalStages = ['APPROVED', 'REJECTED', 'DISBURSED', 'CANCELLED'];
  const isTerminal = terminalStages.includes(currentStatus);
  const previousStageCompleted = !['DRAFT', 'SUBMITTED', 'CANCELLED', 'REJECTED'].includes(currentStatus);
  const canApprove = isWithinLimit && hasCreditAssessment && previousStageCompleted && !isTerminal;

  // Calculate FOIR / DTI
  const monthlyIncome = Number(customer?.monthlyIncome || 0);
  const existingDebt = Number(customer?.existingObligations || 0);
  const foirPct = monthlyIncome > 0 ? Math.round((existingDebt / monthlyIncome) * 100) : null;
  const repaymentCapacity = monthlyIncome > existingDebt ? monthlyIncome - existingDebt : 0;

  // Customer documents
  const customerDocs = (documents && documents.length > 0)
    ? documents
    : (customer?.documents && customer.documents.length > 0)
    ? customer.documents
    : [];

  // Check if BM already recorded an approval or escalation on this application
  const existingBmApproval = approvals.find(
    (app: any) => app.approverRole === 'BRANCH_MANAGER'
  );
  const isAlreadyReviewed = !!existingBmApproval && ['APPROVED', 'ESCALATED', 'SENT_BACK'].includes(existingBmApproval.status);

  const decisionMutation = useMutation({
    mutationFn: async ({ decision, remarks }: { decision: 'APPROVE' | 'SEND_BACK' | 'ESCALATE'; remarks: string }) => {
      const payload: any = {
        decision,
        remarks: remarks.trim(),
      };
      if (decision === 'APPROVE') {
        payload.delegatedAuthorityAmount = BRANCH_MANAGER_LIMIT;
      }
      return (await api.post(`/branch-manager/applications/${applicationId}/decision`, payload)).data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Branch decision recorded and forwarded to Underwriter successfully.');
      setActiveModal(null);
      setRemarks('');
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['branch-manager-queue'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      if (onDecisionSubmitted) onDecisionSubmitted();
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Branch Management Action Notice' });
    },
  });

  const handleOpenModal = (type: 'APPROVE' | 'SEND_BACK' | 'ESCALATE') => {
    if (isTerminal) {
      toast.error(`Application is in terminal '${currentStatus}' state and cannot receive branch management review actions.`);
      return;
    }
    if (isAlreadyReviewed) {
      toast.error('A Branch Manager review decision has already been recorded for this application.');
      return;
    }
    if (type === 'APPROVE') {
      if (!isWithinLimit) {
        toast.error(`Approval limit exceeded: Requested loan ${formatMoney(numRequestedAmount)} exceeds your ₹5,00,000 limit. Please escalate to Underwriter.`);
        return;
      }
      if (!hasCreditAssessment) {
        toast.error('Credit Analyst assessment must be completed before Branch Manager approval can be recorded.');
        return;
      }
      if (!previousStageCompleted) {
        toast.error('Prerequisite Credit Assessment stage has not been completed yet.');
        return;
      }
    }
    setRemarks('');
    setActiveModal(type);
  };

  const handleConfirmDecision = () => {
    if (!activeModal) return;
    if (remarks.trim().length < 10) {
      toast.error('Please enter a detailed rationale (minimum 10 characters).');
      return;
    }
    decisionMutation.mutate({ decision: activeModal, remarks });
  };

  return (
    <Card className="space-y-5 border-2 border-[#2563EB]/30 shadow-sm relative overflow-hidden">
      {/* Decorative Brand Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2563EB] via-indigo-500 to-blue-600" />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 border-slate-100 dark:border-[#2B3566]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Branch Manager Review & Approval Desk
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2563EB] text-white">
                FIRST-LEVEL MANAGEMENT APPROVAL
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Management review of Credit Analyst recommendations within configured delegated authority
            </p>
          </div>
        </div>

        {/* Delegated Limit Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">BM Delegated Limit:</span>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1E2445] text-[#2563EB] dark:text-blue-400 border border-slate-200 dark:border-[#2B3566]">
            {formatMoney(BRANCH_MANAGER_LIMIT)} (₹5 Lakhs)
          </span>
        </div>
      </div>

      {/* Delegated Authority Policy Banner */}
      <div
        className={cn(
          'rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs',
          isWithinLimit
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200'
            : 'bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200'
        )}
      >
        <div className="flex items-center gap-2.5">
          {isWithinLimit ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <div>
            <p className="font-bold text-sm">
              {isWithinLimit
                ? 'Proposal Within Delegated Approval Limit'
                : 'Loan amount exceeds your delegated approval limit.'}
            </p>
            <p className="mt-0.5 opacity-90">
              {isWithinLimit
                ? `Requested loan of ${formatMoney(numRequestedAmount)} is within your ₹5,00,000 threshold. Branch-level approval is authorized.`
                : `Requested loan of ${formatMoney(numRequestedAmount)} exceeds your ₹5,00,000 threshold. Branch Manager approval is not allowed. Please use [Escalate to Underwriter].`}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {isWithinLimit ? (
            <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-600 text-white shadow-xs">
              Eligible for BM Approval
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-amber-600 text-white shadow-xs">
              Escalation Required
            </span>
          )}
        </div>
      </div>

      {/* 1. Credit Analyst Completed Assessment Inspection (Read-Only) */}
      <div className="rounded-xl border p-4 bg-slate-50/70 dark:bg-[#1E2445]/40 border-slate-200 dark:border-[#2B3566] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#2563EB]" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Credit Analyst Assessment Report
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-[#171B36] text-slate-600 dark:text-slate-300">
              READ-ONLY INSPECTION
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasCreditAssessment ? (
              <Badge
                status={
                  isAssessmentEligible
                    ? 'APPROVED'
                    : eligibility?.result === 'NOT_ELIGIBLE'
                    ? 'REJECTED'
                    : 'UNDER_REVIEW'
                }
              />
            ) : (
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Pending Credit Analyst Assessment
              </span>
            )}
          </div>
        </div>

        {hasCreditAssessment ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
            {/* 1. Eligibility */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#171B36] border border-slate-200 dark:border-[#2B3566]">
              <span className="text-slate-400 text-[11px] block">Eligibility Result</span>
              <span
                className={cn(
                  'font-bold text-sm block mt-0.5',
                  isAssessmentEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {eligibility.result}
              </span>
            </div>

            {/* 2. Credit Score & Risk Category */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#171B36] border border-slate-200 dark:border-[#2B3566]">
              <span className="text-slate-400 text-[11px] block">Credit Score & Risk Level</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-sm text-blue-600">
                  {riskAssessment ? `${riskAssessment.score} pts` : 'Bureau Checked'}
                </span>
                {riskAssessment?.category && <Badge status={riskAssessment.category} />}
              </div>
            </div>

            {/* 3. FOIR / DTI */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#171B36] border border-slate-200 dark:border-[#2B3566]">
              <span className="text-slate-400 text-[11px] block">FOIR / DTI Ratio</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white block mt-0.5">
                {foirPct !== null ? `${foirPct}%` : 'Evaluated'}
                {foirPct !== null && (
                  <span className={cn('text-[10px] ml-1.5 font-normal', foirPct <= 50 ? 'text-emerald-600' : 'text-amber-600')}>
                    ({foirPct <= 50 ? 'Within ≤50% Policy' : 'Elevated'})
                  </span>
                )}
              </span>
            </div>

            {/* 4. Repayment Capacity */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#171B36] border border-slate-200 dark:border-[#2B3566]">
              <span className="text-slate-400 text-[11px] block">Monthly Net Surplus</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white block mt-0.5">
                {formatMoney(repaymentCapacity)}
              </span>
            </div>

            {/* 5. Income & Obligations breakdown */}
            <div className="sm:col-span-2 lg:col-span-2 p-3 rounded-xl bg-white dark:bg-[#171B36] border border-slate-200 dark:border-[#2B3566] space-y-1">
              <span className="text-slate-400 text-[11px] block font-semibold">Financial Obligations Baseline:</span>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Monthly Income:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatMoney(monthlyIncome)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Existing Liabilities:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatMoney(existingDebt)}</span>
              </div>
            </div>

            {/* 6. Analyst Recommendation */}
            <div className="sm:col-span-2 lg:col-span-2 p-3 rounded-xl bg-white dark:bg-[#171B36] border border-slate-200 dark:border-[#2B3566] space-y-1">
              <span className="text-slate-400 text-[11px] block font-semibold">Credit Analyst Recommendation:</span>
              <p className="font-bold text-purple-600 dark:text-purple-400">
                {eligibility.recommendation || (isAssessmentEligible ? 'Recommended for Sanction' : 'Declined')}
              </p>
              {eligibility.notes && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  "{eligibility.notes}"
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
            <p className="font-semibold">Notice: Credit Assessment Required</p>
            <p className="text-[11px] mt-0.5">
              The Credit Analyst has not completed eligibility evaluation for this proposal. Branch Manager review and approval requires a completed credit report.
            </p>
          </div>
        )}
      </div>

      {/* 2. Terminal State / Closed Review Banner */}
      {isTerminal && (
        <div
          className={cn(
            'rounded-xl border p-4 text-xs flex items-start gap-3',
            currentStatus === 'APPROVED' || currentStatus === 'DISBURSED'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
              : currentStatus === 'REJECTED'
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          )}
        >
          <div
            className={cn(
              'p-2 rounded-lg shrink-0 mt-0.5',
              currentStatus === 'APPROVED' || currentStatus === 'DISBURSED'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : currentStatus === 'REJECTED'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-slate-500/10 text-slate-500'
            )}
          >
            {currentStatus === 'APPROVED' || currentStatus === 'DISBURSED' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : currentStatus === 'REJECTED' ? (
              <XCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <p
              className={cn(
                'font-bold text-sm',
                currentStatus === 'APPROVED' || currentStatus === 'DISBURSED'
                  ? 'text-emerald-800 dark:text-emerald-300'
                  : currentStatus === 'REJECTED'
                  ? 'text-rose-800 dark:text-rose-300'
                  : 'text-slate-800 dark:text-slate-200'
              )}
            >
              {currentStatus === 'APPROVED'
                ? 'Application Sanctioned & Approved (Terminal State)'
                : currentStatus === 'DISBURSED'
                ? 'Loan Disbursed (Terminal State)'
                : currentStatus === 'REJECTED'
                ? 'Application Rejected (Terminal State)'
                : 'Application Cancelled (Terminal State)'}
            </p>
            <p className="text-slate-600 dark:text-slate-400 mt-0.5">
              {currentStatus === 'APPROVED'
                ? "This loan proposal has completed underwriter evaluation and has been approved / sanctioned. Branch management review actions are concluded and closed."
                : currentStatus === 'DISBURSED'
                ? "This loan has already been disbursed. Branch management review actions are closed."
                : currentStatus === 'REJECTED'
                ? "This application was declined. Branch management review actions are closed."
                : "This application was cancelled."}
            </p>
          </div>
        </div>
      )}

      {/* 3. Prior Branch Management Decision Audit Record (if any) */}
      {existingBmApproval && (
        <div className="rounded-xl border p-3.5 bg-blue-50/50 dark:bg-[#1E2445]/30 border-blue-100 dark:border-[#2B3566] text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-[#2563EB]">
              {existingBmApproval.status === 'APPROVED' ? '✓ Branch Approved & Sent to Underwriter:' : 'Prior Management Action:'}
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              {existingBmApproval.createdAt ? formatDate(existingBmApproval.createdAt) : ''}
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-200">
            {existingBmApproval.status === 'APPROVED'
              ? 'Proposal approved within delegated limit and sent to Underwriting queue for final sanction.'
              : existingBmApproval.status === 'ESCALATED'
              ? 'Proposal escalated to Underwriter for senior review.'
              : `Recorded as ${existingBmApproval.status} by Branch Manager.`}
          </p>
          {existingBmApproval.decisionReason && (
            <p className="italic text-slate-500 mt-1">"{existingBmApproval.decisionReason}"</p>
          )}
        </div>
      )}

      {/* 4. Action Buttons Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-[#2B3566]">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Branch Management Review Actions</p>
          <p className="text-[11px]">
            {isTerminal
              ? `Application is in '${currentStatus}' status. Review actions are closed.`
              : isAlreadyReviewed
              ? 'Management review decision has already been submitted for this proposal.'
              : 'Management approval within limit, correction routing, or underwriting escalation.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Action 1: View Documents */}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setDocumentsModalOpen(true)}
            className="text-xs gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#2B3566]"
          >
            <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
            View Documents ({customerDocs.length})
          </Button>

          {/* Action 2: Send Back for Correction */}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleOpenModal('SEND_BACK')}
            disabled={isTerminal || isAlreadyReviewed}
            className={cn(
              'text-xs gap-1.5 border-slate-200 dark:border-[#2B3566]',
              isTerminal || isAlreadyReviewed
                ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500'
                : 'cursor-pointer text-slate-700 dark:text-slate-200'
            )}
            title={
              isTerminal
                ? `Application is in terminal '${currentStatus}' status. Review actions are closed.`
                : isAlreadyReviewed
                ? 'Branch Manager decision already recorded'
                : 'Send back for correction'
            }
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
            Send Back
          </Button>

          {/* Action 3: Escalate to Underwriter / Higher Authority */}
          <Button
            size="sm"
            onClick={() => handleOpenModal('ESCALATE')}
            disabled={isTerminal || isAlreadyReviewed}
            className={cn(
              'text-xs gap-1.5 font-semibold shadow-sm',
              isTerminal || isAlreadyReviewed
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
            )}
            title={
              isTerminal
                ? `Application is in terminal '${currentStatus}' status. Review actions are closed.`
                : isAlreadyReviewed
                ? 'Branch Manager decision already recorded'
                : 'Escalate to Underwriter / Higher Authority'
            }
          >
            <Send className="w-3.5 h-3.5" />
            Escalate to Underwriter / Higher Authority
          </Button>

          {/* Action 4: Approval Status Indicator if Limit Exceeded */}
          {!isWithinLimit && !isTerminal && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-3 h-3" />
              Approval limit exceeded
            </span>
          )}

          {/* Action 5: Approve (Within Delegated Limit) Button */}
          <Button
            size="sm"
            onClick={() => handleOpenModal('APPROVE')}
            disabled={!canApprove || isAlreadyReviewed}
            className={cn(
              'text-xs gap-1.5 font-bold shadow-sm transition-all',
              canApprove && !isAlreadyReviewed
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
            )}
            title={
              isTerminal
                ? `Application is in terminal '${currentStatus}' status. Review actions are closed.`
                : isAlreadyReviewed
                ? 'Branch Manager decision already recorded'
                : !isWithinLimit
                ? `Approval limit exceeded (${formatMoney(numRequestedAmount)} > ${formatMoney(BRANCH_MANAGER_LIMIT)})`
                : !hasCreditAssessment
                ? 'Credit Analyst assessment must be completed before approval'
                : !previousStageCompleted
                ? 'Prerequisite stage incomplete'
                : 'Approve proposal within delegated limit'
            }
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isTerminal
              ? `Approved (${currentStatus})`
              : isAlreadyReviewed
              ? 'Reviewed'
              : !isWithinLimit
              ? 'Approve (Limit Exceeded)'
              : !hasCreditAssessment
              ? 'Approve (Assessment Required)'
              : 'Approve'}
          </Button>
        </div>
      </div>

      {/* MODAL 1: VIEW CUSTOMER DOCUMENTS (READ-ONLY PREVIEW) */}
      {documentsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-2xl rounded-2xl border shadow-2xl p-6 relative transition-all max-h-[85vh] flex flex-col',
              isDark ? 'bg-[#171B36] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B3566] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Submitted Customer Documents</h3>
                  <p className="text-xs text-slate-400">
                    Read-only preview of borrower KYC and income proofs for Application #{applicationNo || applicationId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDocumentsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-only Governance Notice */}
            <div className="my-3 p-2.5 rounded-xl bg-blue-50/60 dark:bg-[#1E2445] border border-blue-100 dark:border-[#2B3566] text-xs flex items-center gap-2 text-slate-600 dark:text-slate-300 shrink-0">
              <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>
                Branch Managers can preview submitted documents for review. Editing, replacing, or deleting documents is prohibited.
              </span>
            </div>

            {/* Documents List */}
            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1 text-xs">
              {customerDocs.length > 0 ? (
                customerDocs.map((doc: any) => (
                  <div
                    key={doc.id}
                    className={cn(
                      'p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors',
                      isDark ? 'bg-[#1E2445]/50 border-[#2B3566]' : 'bg-slate-50 border-slate-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {doc.documentType?.replace(/_/g, ' ') || 'Document'}
                          </span>
                          <Badge status={doc.status || 'VERIFIED'} />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {doc.fileName || 'Uploaded file'} · Uploaded {doc.createdAt ? formatDate(doc.createdAt) : 'Recently'}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {doc.fileUrl ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open Document</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">File on secure vault</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <FileText className="w-8 h-8 mx-auto opacity-40 mb-2" />
                  <p className="font-semibold">No customer documents uploaded yet.</p>
                  <p className="text-[11px]">Documents will appear here once submitted by borrower or loan officer.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-[#2B3566] flex justify-end shrink-0">
              <Button size="sm" variant="secondary" onClick={() => setDocumentsModalOpen(false)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BRANCH MANAGER DECISION CONFIRMATION (APPROVE / SEND BACK / ESCALATE) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border shadow-2xl p-6 relative transition-all',
              isDark ? 'bg-[#171B36] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B3566]">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'p-2 rounded-xl',
                    activeModal === 'APPROVE'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : activeModal === 'SEND_BACK'
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'bg-purple-500/10 text-purple-600'
                  )}
                >
                  {activeModal === 'APPROVE' && <CheckCircle2 className="w-5 h-5" />}
                  {activeModal === 'SEND_BACK' && <RotateCcw className="w-5 h-5" />}
                  {activeModal === 'ESCALATE' && <Send className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {activeModal === 'APPROVE' && 'Record Branch-Level Approval'}
                    {activeModal === 'SEND_BACK' && 'Send Back for Correction'}
                    {activeModal === 'ESCALATE' && 'Escalate to Underwriter'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeModal === 'APPROVE' && 'Approved within ₹5,00,000 delegated authority limit'}
                    {activeModal === 'SEND_BACK' && 'Return proposal for missing documents or corrections'}
                    {activeModal === 'ESCALATE' && 'Escalate to Underwriter for final sanction / policy exception'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 pt-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Application:</span>
                  <span className="font-mono font-bold text-[#2563EB]">{applicationNo || applicationId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Borrower:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {customer?.firstName} {customer?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Requested Amount:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatMoney(numRequestedAmount)}
                  </span>
                </div>
                {activeModal === 'APPROVE' && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold pt-1 border-t border-slate-200 dark:border-[#2B3566]">
                    <span>Delegated Limit:</span>
                    <span>≤ {formatMoney(BRANCH_MANAGER_LIMIT)} (Approved Within Limit)</span>
                  </div>
                )}
              </div>

              {activeModal === 'APPROVE' && (
                <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                  This records first-level branch management approval within delegated limit (₹5,00,000) and forwards the proposal to the Underwriter for final credit underwriting and sanction.
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {activeModal === 'APPROVE' && 'Manager Approval Remarks / Notes *'}
                  {activeModal === 'SEND_BACK' && 'Correction Reason / Missing Information *'}
                  {activeModal === 'ESCALATE' && 'Escalation Reason / Underwriting Brief *'}
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    activeModal === 'APPROVE'
                      ? 'e.g. Reviewed Credit Analyst assessment. Application meets branch-level approval criteria within ₹5L delegated limit.'
                      : activeModal === 'SEND_BACK'
                      ? 'e.g. Missing bank statements or salary slip clarification required. Please correct and resubmit.'
                      : 'e.g. Loan amount exceeds ₹5L delegated limit (Requested: ₹8L). Escalated to Underwriter for final underwriting review.'
                  }
                  className={cn(
                    'w-full rounded-xl border p-3 text-xs focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-white' : 'border-slate-300 bg-white text-slate-900'
                  )}
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Minimum 10 characters required for audit trail.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#2B3566]">
                <Button variant="ghost" onClick={() => setActiveModal(null)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  disabled={remarks.trim().length < 10 || decisionMutation.isPending}
                  onClick={handleConfirmDecision}
                  className={cn(
                    'text-xs font-semibold text-white',
                    activeModal === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : activeModal === 'SEND_BACK'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  )}
                >
                  {decisionMutation.isPending
                    ? 'Submitting...'
                    : activeModal === 'APPROVE'
                    ? 'Confirm Branch Approval'
                    : activeModal === 'SEND_BACK'
                    ? 'Confirm Send Back'
                    : 'Confirm Escalation'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
