'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  UserCheck,
  RotateCcw,
  Percent,
  Calculator,
  Sliders,
  Sparkles,
  FileCheck,
  Layers,
  ChevronRight,
  Receipt,
  Info,
  ArrowRight,
  ArrowLeft,
  Building,
  Scale,
  Lock,
} from 'lucide-react';
import {
  useApprovalTask,
  useSubmitApprovalAction,
  useApplicationApprovalHistory,
} from '../hooks/useApprovalMatrix';
import { ApprovalTask, ApprovalActionType } from '../types';
import { usePermission } from '@/lib/permissions';
import { formatMoney, formatDateTime, cn } from '@/lib/utils';
import { Spinner } from '@/components/ui';

interface Props {
  taskId: string;
}

export const ApprovalDetailView: React.FC<Props> = ({ taskId }) => {
  const router = useRouter();
  const { data: task, isLoading, refetch } = useApprovalTask(taskId);
  const { data: history = [] } = useApplicationApprovalHistory(task?.applicationId);
  const actionMutation = useSubmitApprovalAction();

  // Action Modal State
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ApprovalActionType>('APPROVE');
  const [actionReason, setActionReason] = useState('STANDARD_POLICY_APPROVAL');
  const [actionComments, setActionComments] = useState('');
  const [sendBackTarget, setSendBackTarget] = useState('CREDIT_ASSESSMENT');

  const canApprove = usePermission('approval.approve');
  const canReject = usePermission('approval.reject');
  const canSendBack = usePermission('approval.send_back');
  const canEscalate = usePermission('approval.escalate');

  if (isLoading) {
    return (
      <div className="p-16 text-center flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="text-xs text-slate-400 mt-3">Loading proposal approval details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-white">Approval Task Not Found</h3>
        <p className="text-xs text-slate-500">The requested approval task could not be located or has expired.</p>
        <button
          onClick={() => router.push('/approval-queue')}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700"
        >
          Back to Approval Queue
        </button>
      </div>
    );
  }

  const isFinalized = ['APPROVED', 'REJECTED', 'SENT_BACK'].includes(task.status);

  const handleOpenAction = (act: ApprovalActionType) => {
    setSelectedAction(act);
    if (act === 'APPROVE') setActionReason('SANCTION_TERMS_SATISFIED');
    else if (act === 'REJECT') setActionReason('CREDIT_RISK_DEFECT');
    else if (act === 'SEND_BACK') setActionReason('INSUFFICIENT_DOCUMENTATION');
    else if (act === 'ESCALATE') setActionReason('AMOUNT_OR_POLICY_EXCEPTION');
    setIsActionModalOpen(true);
  };

  const handleExecuteAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionComments.trim()) {
      alert('Mandatory comments are required to commit an approval authority action.');
      return;
    }

    actionMutation.mutate(
      {
        taskId: task.id,
        dto: {
          action: selectedAction,
          reason: actionReason,
          comments: actionComments,
          sendBackTargetStage: selectedAction === 'SEND_BACK' ? sendBackTarget : undefined,
        },
      },
      {
        onSuccess: () => {
          setIsActionModalOpen(false);
          refetch();
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Back Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/approval-queue')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Approval Authority Queue
        </button>

        <span className="text-xs font-mono text-slate-500">Task ID: {task.id}</span>
      </div>

      {/* 1. Step-By-Step Workflow State Stepper (Section 25) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-400">
            Approval Lifecycle Progression
          </span>
          <span className="text-indigo-400 font-mono">Stage Gate: {task.levelName}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
          {/* Step 1: Origination & KYC */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-emerald-500/30 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">1. Intake & KYC</span>
              <span className="text-[10px] text-emerald-400 font-medium">Completed & Verified</span>
            </div>
          </div>

          {/* Step 2: BRE Engine */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-emerald-500/30 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">2. BRE Underwriting</span>
              <span className="text-[10px] text-emerald-400 font-medium">Verdict: {task.breDecision}</span>
            </div>
          </div>

          {/* Step 3: Current Authority Review */}
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              isFinalized
                ? 'bg-slate-950/60 border-emerald-500/30'
                : 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/40'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] font-black text-white shrink-0 mt-0.5">
              3
            </div>
            <div>
              <span className="font-bold text-white block">3. Level {task.level} Sanction</span>
              <span className="text-[10px] text-indigo-300 font-medium">
                {isFinalized ? task.status : 'Awaiting Your Decision'}
              </span>
            </div>
          </div>

          {/* Step 4: Final Payout */}
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 opacity-60 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-400 block">4. Finance Payout</span>
              <span className="text-[10px] text-slate-500">Locked until approvals pass</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Application Details + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Proposal & Credit Summary (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Header Proposal Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {task.applicationNo}
                </span>
                <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
                  {task.customerName}
                </h2>
                <p className="text-xs text-slate-400">Product: {task.productCode}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Requested Loan Facility
                </span>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {formatMoney(task.amount)}
                </div>
              </div>
            </div>

            {/* Financial & Risk Metrics Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Max Eligible</span>
                <span className="font-bold font-mono text-indigo-300">{formatMoney(task.eligibleAmount)}</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Risk Grade</span>
                <span className="font-bold text-white">Grade {task.riskGrade}</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">BRE Decision</span>
                <span
                  className={`font-bold ${
                    task.breDecision === 'APPROVE'
                      ? 'text-emerald-400'
                      : task.breDecision === 'REFER'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {task.breDecision}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Assigned Level</span>
                <span className="font-bold text-purple-300">Level {task.level}</span>
              </div>
            </div>
          </div>

          {/* Historical Approval Timeline */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Sanction Audit History ({history.length})
            </h3>

            {history.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No prior approval actions recorded for this application.
              </div>
            ) : (
              <div className="space-y-2.5">
                {history.map((h, i) => (
                  <div key={h.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            h.action === 'APPROVE'
                              ? 'bg-emerald-400'
                              : h.action === 'REJECT'
                              ? 'bg-rose-400'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span className="font-bold text-white">{h.actionByName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({h.actionByRole})</span>
                      </div>
                      <span className="font-bold text-indigo-300">{h.action}</span>
                    </div>
                    {h.comments && <p className="text-[11px] text-slate-300 italic">{h.comments}</p>}
                    <span className="text-[10px] text-slate-500 block">{formatDateTime(h.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Action Decision Desk (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <UserCheck className="w-4 h-4" />
              Sanction Action Desk
            </span>

            {isFinalized ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white">Action Finalized</h4>
                <p className="text-slate-400 text-[11px]">
                  This task was marked <strong className="text-white">{task.status}</strong> by {task.actionByName} at{' '}
                  {formatDateTime(task.actionAt || task.updatedAt)}.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Select your authoritative decision for this loan proposal within your delegated authority limit:
                </p>

                {canApprove && (
                  <button
                    onClick={() => handleOpenAction('APPROVE')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Sanction
                  </button>
                )}

                {canSendBack && (
                  <button
                    onClick={() => handleOpenAction('SEND_BACK')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition-all active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Send Back For Clarification
                  </button>
                )}

                {canEscalate && (
                  <button
                    onClick={() => handleOpenAction('ESCALATE')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-all active:scale-95"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Escalate to Higher Authority
                  </button>
                )}

                {canReject && (
                  <button
                    onClick={() => handleOpenAction('REJECT')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-all active:scale-95"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline Proposal
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decision Execution Modal */}
      {isActionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <h3 className="text-base font-bold">
              Commit Action: {selectedAction}
            </h3>

            <form onSubmit={handleExecuteAction} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Reason Code</label>
                <input
                  type="text"
                  required
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              {selectedAction === 'SEND_BACK' && (
                <div>
                  <label className="block text-slate-400 mb-1">Send Back Target Stage</label>
                  <select
                    value={sendBackTarget}
                    onChange={(e) => setSendBackTarget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="CREDIT_ASSESSMENT">Credit Assessment</option>
                    <option value="KYC_PENDING">KYC Verification</option>
                    <option value="DRAFT">Loan Officer Intake</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">
                  Mandatory Underwriting Comments & Justification
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionComments}
                  onChange={(e) => setActionComments(e.target.value)}
                  placeholder="State clear reasons for your approval/rejection decision..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                >
                  {actionMutation.isPending ? 'Committing...' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
