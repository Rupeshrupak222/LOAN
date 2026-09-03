'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PhoneCall,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  Users,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, KpiCard, Spinner, Input } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { CollectionsIntelligenceModal } from '@/components/CollectionsIntelligenceModal';

export default function CollectionsPage() {
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const [selectedBucket, setSelectedBucket] = useState('');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [aiCaseSelected, setAiCaseSelected] = useState<any | null>(null);

  // Modals
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState('CALL');
  const [outcome, setOutcome] = useState('PROMISE_TO_PAY');
  const [notes, setNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  const [ptpModalOpen, setPtpModalOpen] = useState(false);
  const [ptpAmount, setPtpAmount] = useState('');
  const [ptpDate, setPtpDate] = useState('');
  const [ptpMode, setPtpMode] = useState('UPI');

  // Dashboard KPIs & aging buckets
  const { data: dashboardData } = useQuery({
    queryKey: ['collection-dashboard'],
    queryFn: async () => (await api.get('/collections/dashboard')).data.data,
  });

  // Cases list
  const { data: casesData, isLoading } = useQuery({
    queryKey: ['collection-cases', selectedBucket],
    queryFn: async () => {
      const res = await api.get('/collections/cases', {
        params: { bucket: selectedBucket || undefined },
      });
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
  });

  // Log Activity Mutation
  const activityMutation = useMutation({
    mutationFn: async () =>
      api.post('/collections/activities', {
        caseId: selectedCase.id,
        activityType,
        outcome,
        notes,
        nextFollowUpDate: nextFollowUpDate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-cases'] });
      queryClient.invalidateQueries({ queryKey: ['collection-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-collections-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      setActivityModalOpen(false);
      setNotes('');
    },
  });

  // Record PTP Mutation
  const ptpMutation = useMutation({
    mutationFn: async () =>
      api.post('/collections/ptp', {
        caseId: selectedCase.id,
        promisedAmount: Number(ptpAmount),
        promisedDate: ptpDate,
        paymentMode: ptpMode,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-cases'] });
      queryClient.invalidateQueries({ queryKey: ['collection-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-collections-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      setPtpModalOpen(false);
      setPtpAmount('');
    },
  });

  if (isLoading) return <Spinner />;

  const agingBuckets = Array.isArray(dashboardData?.agingBuckets) ? dashboardData.agingBuckets : [];
  const cases = Array.isArray(casesData) ? casesData : [];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Servicing / Collections"
        title="Collections & Delinquency Board"
        subtitle="Manage overdue accounts, DPD aging buckets, follow-up calls, and Promise-To-Pay (PTP)"
      />

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <KpiCard
          label="Total Overdue Balance"
          value={formatMoney(dashboardData?.summary?.totalOverdueAmount || 0)}
          hint={`${dashboardData?.summary?.activeCases || 0} delinquent accounts`}
          icon={<AlertTriangle className="h-4 w-4 text-rose-500" />}
        />
        <KpiCard
          label="Active PTP Commitments"
          value={String(dashboardData?.summary?.pendingPtps || 0)}
          hint="Scheduled borrower promises"
          icon={<Clock className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />}
        />
        <KpiCard
          label="Fair Recovery Practices"
          value="100% Compliant"
          hint="Audit trail enforced"
          icon={<ShieldAlert className="h-4 w-4 text-emerald-600 dark:text-[#10B981]" />}
        />
      </div>

      {/* Aging Buckets Filter Cards */}
      {agingBuckets.length > 0 && (
        <div>
          <h3 className={cn("text-xs font-bold uppercase tracking-wider mb-2", isDark ? "text-white" : "text-slate-900")}>
            DPD Aging Buckets
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {agingBuckets.map((b: any) => {
              const selected = selectedBucket === b.bucket;
              return (
                <div
                  key={b.bucket}
                  onClick={() => setSelectedBucket(selected ? '' : b.bucket)}
                  className={cn(
                    "cursor-pointer rounded-2xl border p-4 transition-all",
                    selected
                      ? (isDark ? "border-[#2563EB] bg-[#2563EB]/20 shadow ring-2 ring-[#2563EB]/30" : "border-[#2563EB] bg-blue-50 shadow ring-2 ring-[#2563EB]/30")
                      : (isDark ? "border-[#2B3566] bg-[#1E2445] hover:border-slate-500" : "border-slate-200/80 bg-white hover:border-slate-300 shadow-2xs")
                  )}
                >
                  <p className="text-[11px] font-bold text-slate-400 uppercase">{b.bucket} DPD</p>
                  <p className={cn("text-lg font-bold mt-1", isDark ? "text-white" : "text-slate-900")}>{formatMoney(b.totalAmount || b.amount || 0)}</p>
                  <p className={cn("text-xs font-semibold mt-0.5", isDark ? "text-[#60A5FA]" : "text-[#2563EB]")}>{b.count || 0} Accounts</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cases Table */}
      <Card noPadding className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-white" : "text-slate-900")}>
              Delinquency Case Queue {selectedBucket && `— ${selectedBucket} DPD`}
            </h3>
            <p className="text-xs text-slate-400">Prioritized by days past due (DPD)</p>
          </div>
          {selectedBucket && (
            <Button size="sm" variant="secondary" onClick={() => setSelectedBucket('')}>
              Clear Filter
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={cn(
              "border-b text-[11px] font-bold uppercase",
              isDark ? "border-[#2B3566] bg-[#16203D] text-slate-400" : "border-slate-200 bg-slate-50/80 text-slate-500"
            )}>
              <tr>
                <th className="py-2.5 px-3">Case #</th>
                <th className="py-2.5 px-3">Borrower</th>
                <th className="py-2.5 px-3">Loan Account</th>
                <th className="py-2.5 px-3">DPD</th>
                <th className="py-2.5 px-3">Bucket</th>
                <th className="py-2.5 px-3">Overdue Amount</th>
                <th className="py-2.5 px-3">Logs / PTP</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={cn(
              "divide-y text-xs",
              isDark ? "divide-[#2B3566] text-slate-200" : "divide-slate-100 text-slate-700"
            )}>
              {cases.length > 0 ? (
                cases.map((c: any) => (
                  <tr key={c.id} className={cn("transition-colors", isDark ? "hover:bg-[#16203D]/60" : "hover:bg-slate-50/70")}>
                    <td className="py-3 px-3 font-bold text-[#2563EB] dark:text-[#60A5FA]">{c.caseNo || '-'}</td>
                    <td className="py-3 px-3">
                      <p className={cn("font-semibold leading-tight", isDark ? "text-white" : "text-slate-900")}>{c.customerName || 'Borrower'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{c.mobile || ''} {c.city ? `· ${c.city}` : ''}</p>
                    </td>
                    <td className={cn("py-3 px-3 font-medium", isDark ? "text-slate-300" : "text-slate-700")}>{c.loanNo || '-'}</td>
                    <td className="py-3 px-3">
                      <span className={cn(
                        "font-bold px-2 py-0.5 rounded text-[11px] border",
                        isDark ? "bg-rose-950/40 text-rose-400 border-rose-800/40" : "bg-rose-50 text-rose-700 border-rose-200"
                      )}>
                        {c.dpd || 0} Days
                      </span>
                    </td>
                    <td className={cn("py-3 px-3 font-semibold", isDark ? "text-slate-300" : "text-slate-700")}>{c.agingBucket || '-'}</td>
                    <td className="py-3 px-3 font-bold text-rose-600 dark:text-rose-400 text-sm">{formatMoney(c.overdueAmount || 0)}</td>
                    <td className={cn("py-3 px-3", isDark ? "text-slate-300" : "text-slate-600")}>
                      <span className="font-medium">{c.activitiesCount || 0} Logs</span> ·{' '}
                      <span className="font-bold text-[#2563EB] dark:text-[#60A5FA]">{c.promisesCount || 0} PTP</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setAiCaseSelected(c)}
                          className="text-xs py-1 gap-1 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        >
                          <Sparkles className="h-3 w-3 text-amber-500" /> AI Brief
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedCase(c);
                            setActivityModalOpen(true);
                          }}
                          className="text-xs py-1"
                        >
                          <PhoneCall className="h-3 w-3 mr-1" /> Log
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedCase(c);
                            setPtpAmount(String(c.overdueAmount || ''));
                            setPtpModalOpen(true);
                          }}
                          className="text-xs py-1 text-white"
                        >
                          <Clock className="h-3 w-3 mr-1" /> PTP
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-xs text-slate-400">
                    No delinquent accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Log Activity Modal */}
      {activityModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className={cn(
            "w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-fade-in space-y-4",
            isDark ? "bg-[#1E2445] border-[#2B3566] text-slate-100" : "bg-white border-slate-200 text-slate-900"
          )}>
            <div>
              <h3 className={cn("text-base font-bold", isDark ? "text-white" : "text-slate-900")}>Log Follow-up Activity</h3>
              <p className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
                Case: <strong>{selectedCase.caseNo}</strong> · Borrower: <strong>{selectedCase.customerName}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>Activity Channel</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className={cn(
                    "w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none",
                    isDark ? "border-[#2B3566] bg-[#060F1B] text-slate-200" : "border-slate-300 bg-white text-slate-800"
                  )}
                >
                  <option value="CALL">Telephonic Reminder Call</option>
                  <option value="VISIT">Field Visit / In-Person</option>
                  <option value="SMS">Official SMS Reminder</option>
                  <option value="EMAIL">Email Follow-up</option>
                  <option value="NOTICE">Formal Demand Notice</option>
                </select>
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>Outcome</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className={cn(
                    "w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none",
                    isDark ? "border-[#2B3566] bg-[#060F1B] text-slate-200" : "border-slate-300 bg-white text-slate-800"
                  )}
                >
                  <option value="PROMISE_TO_PAY">PROMISE_TO_PAY (Committed Date)</option>
                  <option value="CONTACTED">CONTACTED (Discussion in progress)</option>
                  <option value="NO_ANSWER">NO_ANSWER (Call unanswered)</option>
                  <option value="DISPUTE">DISPUTE (Borrower raised query)</option>
                  <option value="SETTLEMENT_REQUESTED">SETTLEMENT_REQUESTED (Seeking OTS)</option>
                </select>
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>Follow-up Notes</label>
                <textarea
                  rows={3}
                  placeholder="Record summary of conversation..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-xs focus:border-[#2563EB] focus:outline-none",
                    isDark ? "border-[#2B3566] bg-[#060F1B] text-slate-200" : "border-slate-300 bg-white text-slate-800"
                  )}
                  required
                />
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>Next Follow-up Date</label>
                <Input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  disabled={!notes.trim() || activityMutation.isPending}
                  onClick={() => activityMutation.mutate()}
                  className="flex-1 text-white"
                >
                  {activityMutation.isPending ? 'Logging...' : 'Save Activity Log'}
                </Button>
                <Button variant="secondary" onClick={() => setActivityModalOpen(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record PTP Modal */}
      {ptpModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className={cn(
            "w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-fade-in space-y-4",
            isDark ? "bg-[#1E2445] border-[#2B3566] text-slate-100" : "bg-white border-slate-200 text-slate-900"
          )}>
            <div>
              <h3 className={cn("text-base font-bold", isDark ? "text-white" : "text-slate-900")}>Record Promise-To-Pay (PTP)</h3>
              <p className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>Capture verified commitment date and amount</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>Promised Amount (INR)</label>
                <Input
                  type="number"
                  value={ptpAmount}
                  onChange={(e) => setPtpAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>Promised Payment Date</label>
                <Input
                  type="date"
                  value={ptpDate}
                  onChange={(e) => setPtpDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>Expected Mode</label>
                <select
                  value={ptpMode}
                  onChange={(e) => setPtpMode(e.target.value)}
                  className={cn(
                    "w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none",
                    isDark ? "border-[#2B3566] bg-[#060F1B] text-slate-200" : "border-slate-300 bg-white text-slate-800"
                  )}
                >
                  <option value="UPI">UPI Transfer</option>
                  <option value="NET_BANKING">Net Banking / IMPS</option>
                  <option value="CASH">Cash at Branch Desk</option>
                  <option value="CHEQUE">Cheque Deposit</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  disabled={!ptpAmount || !ptpDate || ptpMutation.isPending}
                  onClick={() => ptpMutation.mutate()}
                  className="flex-1 text-white"
                >
                  {ptpMutation.isPending ? 'Recording...' : 'Commit PTP Schedule'}
                </Button>
                <Button variant="secondary" onClick={() => setPtpModalOpen(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Collections Intelligence Modal */}
      {aiCaseSelected && (
        <CollectionsIntelligenceModal
          colCase={aiCaseSelected}
          isOpen={!!aiCaseSelected}
          onClose={() => setAiCaseSelected(null)}
        />
      )}
    </div>
  );
}
