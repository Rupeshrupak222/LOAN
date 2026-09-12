'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  Calendar,
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  CreditCard,
  Building2,
  DollarSign,
  Send,
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import type { CollectionCaseDetail as CollectionCaseDetailType } from './types';
import { ContactActivityModal } from './ContactActivityModal';
import { PtpModal } from './PtpModal';
import { FollowUpModal } from './FollowUpModal';
import { EscalationModal } from './EscalationModal';
import { SettlementRequestModal } from './SettlementRequestModal';
import { WriteOffRequestModal } from './WriteOffRequestModal';
import { AssignmentModal } from './AssignmentModal';

interface CollectionCaseDetailProps {
  caseData: CollectionCaseDetailType;
}

export function CollectionCaseDetail({ caseData }: CollectionCaseDetailProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TIMELINE' | 'PTPS' | 'FOLLOWUPS' | 'SETTLEMENTS'>('OVERVIEW');
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [ptpModalOpen, setPtpModalOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [escalationModalOpen, setEscalationModalOpen] = useState(false);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [writeOffModalOpen, setWriteOffModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);

  const getPriorityBadge = (priority: string, score: number) => {
    switch (priority) {
      case 'CRITICAL':
        return <Badge variant="danger">CRITICAL ({score})</Badge>;
      case 'HIGH':
        return <Badge variant="warning">HIGH ({score})</Badge>;
      case 'MEDIUM':
        return <Badge variant="info">MEDIUM ({score})</Badge>;
      default:
        return <Badge variant="default">LOW ({score})</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Docket Card */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-2xl p-6 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xl font-bold text-slate-100">{caseData.caseNo}</span>
              <Badge variant={caseData.status === 'RESOLVED' || caseData.status === 'CLOSED' ? 'success' : 'danger'}>
                {caseData.status}
              </Badge>
              {getPriorityBadge(caseData.priority, caseData.priorityScore)}
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800">
                DPD {caseData.dpd} • Bucket {caseData.agingBucket}
              </span>
            </div>
            <div className="text-slate-300 font-medium text-sm mt-1">
              Customer: <span className="text-white font-semibold">{caseData.customer.firstName} {caseData.customer.lastName}</span> ({caseData.customer.customerCode}) • Mobile: {caseData.customer.mobile}
            </div>
            <div className="text-slate-400 text-xs mt-0.5">
              Loan Account: <Link href={`/loans`} className="text-blue-400 hover:underline font-mono">{caseData.loan.loanNo}</Link> • Product: {caseData.loan.product?.name || 'Retail Loan'}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => setActivityModalOpen(true)}>
              <PhoneCall className="h-3.5 w-3.5 mr-1.5" /> Log Activity
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setPtpModalOpen(true)}>
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-amber-400" /> Record PTP
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setFollowUpModalOpen(true)}>
              <Clock className="h-3.5 w-3.5 mr-1.5 text-blue-400" /> Follow-Up
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setAssignmentModalOpen(true)}>
              <UserCheck className="h-3.5 w-3.5 mr-1.5 text-purple-400" /> Assign
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEscalationModalOpen(true)}>
              <ShieldAlert className="h-3.5 w-3.5 mr-1.5 text-rose-400" /> Escalate
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setSettlementModalOpen(true)}>
              <DollarSign className="h-3.5 w-3.5 mr-1.5 text-amber-400" /> Settlement
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setWriteOffModalOpen(true)}>
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-rose-500" /> Write-Off
            </Button>
          </div>
        </div>

        {/* Strategy Alert Banner */}
        <div className="mt-4 rounded-lg bg-blue-950/40 border border-blue-800/60 p-3 flex items-start gap-3">
          <div className="p-1.5 rounded-md bg-blue-900/60 text-blue-300 shrink-0">
            <Send className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-blue-200">
              Recommended Collection Strategy: {caseData.strategyPhase}
            </div>
            <div className="text-xs text-blue-300/80 mt-0.5">
              {caseData.recommendedAction}
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        {[
          { id: 'OVERVIEW', label: 'Financial Overview' },
          { id: 'TIMELINE', label: `Activity Timeline (${caseData.activities.length})` },
          { id: 'PTPS', label: `Promises to Pay (${caseData.promises.length})` },
          { id: 'FOLLOWUPS', label: `Follow-Ups & Escalations (${caseData.followUps.length + caseData.escalations.length})` },
          { id: 'SETTLEMENTS', label: `Settlements & Write-offs (${caseData.settlements.length + caseData.writeOffs.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'py-2 px-1 border-b-2 text-xs font-semibold transition-all',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Repayment Schedule */}
            <Card className="border-slate-800 bg-slate-900 p-5">
              <h4 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-400" /> Overdue & Delinquent Installments
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-950/40 text-slate-400">
                    <tr>
                      <th className="py-2 px-3 text-left">EMI #</th>
                      <th className="py-2 px-3 text-left">Due Date</th>
                      <th className="py-2 px-3 text-right">Principal</th>
                      <th className="py-2 px-3 text-right">Interest</th>
                      <th className="py-2 px-3 text-right">Total Due</th>
                      <th className="py-2 px-3 text-right">Paid</th>
                      <th className="py-2 px-3 text-right">Outstanding</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {caseData.loan.schedule.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-mono">{item.emiNumber}</td>
                        <td className="py-2 px-3">{formatDate(item.dueDate)}</td>
                        <td className="py-2 px-3 text-right">₹{Number(item.principal).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right">₹{Number(item.interest).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-semibold">₹{Number(item.totalDue).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-emerald-400">₹{Number(item.paidAmount).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-rose-400 font-bold">₹{Number(item.outstanding).toLocaleString()}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-bold',
                            item.status === 'PAID' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                          )}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Contactability & Signals */}
          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900 p-5 space-y-3">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-emerald-400" /> Contactability Signals
              </h4>
              <div className="text-xs space-y-2 text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Last Contact Date</span>
                  <span>{caseData.contactability.lastContactDate ? formatDate(caseData.contactability.lastContactDate) : 'Never'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Contact Attempts</span>
                  <span className="font-semibold">{caseData.contactability.totalContactAttempts}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Successful Contacts</span>
                  <span className="text-emerald-400 font-semibold">{caseData.contactability.successfulContactsCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Failed / Unreachable</span>
                  <span className="text-rose-400 font-semibold">{caseData.contactability.failedContactsCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Broken PTPs</span>
                  <span className={cn('font-bold', caseData.contactability.brokenPtpCount > 0 ? 'text-rose-400' : 'text-slate-300')}>
                    {caseData.contactability.brokenPtpCount}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Preferred Time</span>
                  <span>{caseData.contactability.preferredContactTime}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Activity Timeline */}
      {activeTab === 'TIMELINE' && (
        <Card className="border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-bold text-slate-100">Interaction Log</h4>
            <Button size="sm" variant="primary" onClick={() => setActivityModalOpen(true)}>
              + Log Interaction
            </Button>
          </div>
          <div className="space-y-3">
            {caseData.activities.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No contact interactions logged yet.</p>
            ) : (
              caseData.activities.map((act) => (
                <div key={act.id} className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-xs">
                  <div className="flex justify-between items-center text-slate-400 mb-1">
                    <span className="font-semibold text-slate-200">
                      [{act.activityType}] — <span className="text-blue-400">{act.outcome}</span>
                    </span>
                    <span>{formatDate(act.createdAt)} by {act.performedBy}</span>
                  </div>
                  <p className="text-slate-300 mt-1">{act.notes}</p>
                  {act.nextFollowUpDate && (
                    <div className="text-[11px] text-amber-400 mt-1.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Next Follow-up: {formatDate(act.nextFollowUpDate)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 3: PTPs */}
      {activeTab === 'PTPS' && (
        <Card className="border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-bold text-slate-100">Promises to Pay (PTP) History</h4>
            <Button size="sm" variant="primary" onClick={() => setPtpModalOpen(true)}>
              + Record New PTP
            </Button>
          </div>
          <div className="space-y-3">
            {caseData.promises.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No promises to pay recorded.</p>
            ) : (
              caseData.promises.map((ptp) => (
                <div key={ptp.id} className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-xs flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-emerald-400">
                      ₹{Number(ptp.promisedAmount).toLocaleString()}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Promised Date: <span className="text-slate-200">{formatDate(ptp.promisedDate)}</span> via {ptp.paymentMode}
                    </div>
                    <div className="text-slate-500 text-[10px]">
                      Recorded by: {ptp.recordedBy} on {formatDate(ptp.createdAt)}
                    </div>
                  </div>
                  <div>
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-bold',
                      ptp.status === 'KEPT' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      ptp.status === 'BROKEN' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      'bg-amber-950 text-amber-400 border border-amber-800'
                    )}>
                      {ptp.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 4: FollowUps & Escalations */}
      {activeTab === 'FOLLOWUPS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-800 bg-slate-900 p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" /> Scheduled Follow-Up Tasks
            </h4>
            <div className="space-y-2">
              {caseData.followUps.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No scheduled follow-up tasks.</p>
              ) : (
                caseData.followUps.map((flw) => (
                  <div key={flw.id} className="p-3 rounded-md border border-slate-800 bg-slate-950 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-200">{flw.actionTitle}</span>
                      <Badge variant={flw.status === 'COMPLETED' ? 'success' : 'info'}>{flw.status}</Badge>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1">Due: {formatDate(flw.dueDate)}</div>
                    {flw.notes && <p className="text-slate-500 text-[11px] mt-1">{flw.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900 p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" /> Case Escalations
            </h4>
            <div className="space-y-2">
              {caseData.escalations.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No supervisory escalations recorded.</p>
              ) : (
                caseData.escalations.map((esc) => (
                  <div key={esc.id} className="p-3 rounded-md border border-slate-800 bg-slate-950 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-rose-400">{esc.toTier}</span>
                      <Badge variant="warning">{esc.status}</Badge>
                    </div>
                    <p className="text-slate-300 mt-1">Trigger: {esc.triggerReason}</p>
                    <div className="text-slate-500 text-[10px] mt-1">{formatDate(esc.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: Settlements & Write-offs */}
      {activeTab === 'SETTLEMENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-800 bg-slate-900 p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-400" /> Settlements (OTS)
            </h4>
            <div className="space-y-2">
              {caseData.settlements.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No settlement proposals on file.</p>
              ) : (
                caseData.settlements.map((s) => (
                  <div key={s.id} className="p-3 rounded-md border border-slate-800 bg-slate-950 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-400">₹{s.proposedSettlementAmount.toLocaleString()}</span>
                      <Badge variant={s.status === 'SETTLED' ? 'success' : 'warning'}>{s.status}</Badge>
                    </div>
                    <p className="text-slate-300 mt-1">Discount: {s.discountPct}% (Waiver: ₹{s.proposedWaiverAmount.toLocaleString()})</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Reason: {s.reason}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900 p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" /> Write-Off Requests
            </h4>
            <div className="space-y-2">
              {caseData.writeOffs.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No bad debt write-off records.</p>
              ) : (
                caseData.writeOffs.map((w) => (
                  <div key={w.id} className="p-3 rounded-md border border-slate-800 bg-slate-950 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-rose-400">₹{w.totalWriteOffAmount.toLocaleString()}</span>
                      <Badge variant={w.status === 'APPROVED' ? 'danger' : 'info'}>{w.status}</Badge>
                    </div>
                    <p className="text-slate-300 mt-1">Reason: {w.reason}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Action Modals */}
      <ContactActivityModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        caseItem={caseData}
      />
      <PtpModal
        isOpen={ptpModalOpen}
        onClose={() => setPtpModalOpen(false)}
        caseItem={caseData}
      />
      <FollowUpModal
        isOpen={followUpModalOpen}
        onClose={() => setFollowUpModalOpen(false)}
        caseItem={caseData}
      />
      <EscalationModal
        isOpen={escalationModalOpen}
        onClose={() => setEscalationModalOpen(false)}
        caseItem={caseData}
      />
      <SettlementRequestModal
        isOpen={settlementModalOpen}
        onClose={() => setSettlementModalOpen(false)}
        caseItem={caseData}
      />
      <WriteOffRequestModal
        isOpen={writeOffModalOpen}
        onClose={() => setWriteOffModalOpen(false)}
        caseItem={caseData}
      />
      <AssignmentModal
        isOpen={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
        caseItem={caseData}
      />
    </div>
  );
}
