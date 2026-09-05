'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Scale,
  Building,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  Flame,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { Card, KpiCard, Button, Badge, Spinner } from '@/components/ui';

interface ComplianceRule {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  evidenceRequirement: string;
  responsibleRole: string;
  escalationBehavior: string;
}

interface ComplianceException {
  id: string;
  tenantId: string;
  ruleId: string;
  ruleName: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'UNDER_REVIEW' | 'REMEDIATED' | 'ACCEPTED_RISK' | 'ESCALATED';
  entityType: string;
  entityId: string;
  finding: string;
  evidenceReferences: Array<{ type: string; id: string; description?: string }>;
  assignedToRole: string;
  remediationPlan?: string;
  remediationNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

interface ComplianceOverview {
  tenantId: string;
  complianceScore: number;
  overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT';
  activeRulesCount: number;
  openExceptionsCount: number;
  criticalExceptionsCount: number;
  overdueRemediationCount: number;
  categoryScores: Record<string, { score: number; status: string; activeExceptions: number }>;
  recentExceptions: ComplianceException[];
  lastEvaluatedAt: string;
}

export default function CompliancePage() {
  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const toast = useToast();

  // State
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EXCEPTIONS' | 'RULES' | 'SANDBOX'>('OVERVIEW');
  const [selectedException, setSelectedException] = useState<ComplianceException | null>(null);
  const [remediationNotes, setRemediationNotes] = useState('');
  const [targetTransitionStatus, setTargetTransitionStatus] = useState<string>('UNDER_REVIEW');

  // Sandbox State
  const [sandboxAmount, setSandboxAmount] = useState(600000);
  const [sandboxKyc, setSandboxKyc] = useState(true);
  const [sandboxPan, setSandboxPan] = useState(true);
  const [sandboxKfs, setSandboxKfs] = useState(true);
  const [sandboxBankValid, setSandboxBankValid] = useState(true);
  const [sandboxApproversCount, setSandboxApproversCount] = useState(2);
  const [sandboxIncomeDocs, setSandboxIncomeDocs] = useState(true);
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  // 1. Fetch Current Tenant
  const { data: currentTenant } = useQuery({
    queryKey: ['tenant-current'],
    queryFn: async () => (await api.get('/tenants/current')).data.data,
  });

  // 2. Fetch Compliance Overview
  const {
    data: overview,
    isLoading: overviewLoading,
    refetch: refetchOverview,
    isFetching,
  } = useQuery<ComplianceOverview>({
    queryKey: ['compliance-overview', currentTenant?.id],
    queryFn: async () => (await api.get('/compliance/overview')).data.data,
  });

  // 3. Fetch Rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery<ComplianceRule[]>({
    queryKey: ['compliance-rules', currentTenant?.id],
    queryFn: async () => (await api.get('/compliance/rules')).data.data || [],
  });

  // 4. Fetch Exceptions
  const { data: exceptions = [], isLoading: exceptionsLoading, refetch: refetchExceptions } = useQuery<
    ComplianceException[]
  >({
    queryKey: ['compliance-exceptions', currentTenant?.id],
    queryFn: async () => (await api.get('/compliance/exceptions')).data.data || [],
  });

  // Exception Transition Mutation
  const transitionMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const res = await api.post(`/compliance/exceptions/${id}/transition`, {
        status,
        remediationNotes: notes,
        remediationPlan: notes,
      });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-exceptions'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-overview'] });
      setSelectedException(null);
      setRemediationNotes('');
      toast.success('Exception Transitioned', 'Compliance exception status updated.');
    },
    onError: (err: any) => {
      toast.error('Transition Failed', apiErrorMessage(err));
    },
  });

  // Sandbox Evaluation Mutation
  const evaluateSandboxMutation = useMutation({
    mutationFn: async () => {
      const approverRoles = sandboxApproversCount >= 2 ? ['LOAN_OFFICER', 'UNDERWRITER'] : ['LOAN_OFFICER'];
      const res = await api.post('/compliance/evaluate/application', {
        id: `SANDBOX-APP-${Date.now().toString().slice(-4)}`,
        requestedAmount: Number(sandboxAmount),
        kycVerified: sandboxKyc,
        panVerified: sandboxPan,
        kfsConsented: sandboxKfs,
        bankAccountValidated: sandboxBankValid,
        hasIncomeDocuments: sandboxIncomeDocs,
        distinctApproverRoles: approverRoles,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setSandboxResult(data);
      queryClient.invalidateQueries({ queryKey: ['compliance-exceptions'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-overview'] });
      toast.success('Evaluation Complete', 'Regulatory rule audit passed.');
    },
    onError: (err: any) => {
      toast.error('Evaluation Failed', apiErrorMessage(err));
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Governance / Compliance"
        title="Regulatory & Compliance Control Center"
        subtitle="Institutional compliance policy controls, deterministic evaluation engines, evidence traceability, and exception lifecycles"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                refetchOverview();
                refetchExceptions();
              }}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Scope Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1528] border border-slate-200 dark:border-[#1E2445]">
        <div className="flex items-center gap-2.5">
          <Building className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Institutional Compliance Scope: <span>{currentTenant?.name || 'Adyapan Prime Lending'}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Policy Jurisdiction: RBI Digital Lending Guidelines & Lender Operating Mandate
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5',
              overview?.overallStatus === 'COMPLIANT'
                ? 'bg-emerald-100 text-emerald-800'
                : overview?.overallStatus === 'PARTIALLY_COMPLIANT'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            )}
          >
            {overview?.overallStatus === 'COMPLIANT' ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            Status: {overview?.overallStatus || 'CALCULATING'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1E2445] pb-2">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
            activeTab === 'OVERVIEW'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          Compliance Overview
        </button>
        <button
          onClick={() => setActiveTab('EXCEPTIONS')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'EXCEPTIONS'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          Active Exceptions
          {overview?.openExceptionsCount ? (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full">
              {overview.openExceptionsCount}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab('RULES')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
            activeTab === 'RULES'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          Policy Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('SANDBOX')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1',
            activeTab === 'SANDBOX'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          Evaluation Sandbox
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Overall Compliance Score"
              value={overview ? `${overview.complianceScore}%` : '100%'}
              hint="Deterministic Rule Pass Rate"
              icon={ShieldCheck}
              trend={overview && overview.complianceScore === 100 ? 'Compliant' : 'Remediation Needed'}
              trendPositive={overview ? overview.complianceScore >= 80 : true}
            />
            <KpiCard
              title="Active Institutional Rules"
              value={`${overview?.activeRulesCount || rules.length} Controls`}
              hint="Configured Policy Constraints"
              icon={FileCheck}
            />
            <KpiCard
              title="Open Policy Exceptions"
              value={`${overview?.openExceptionsCount || 0} Open`}
              hint="Requires Remediation"
              icon={AlertTriangle}
              trend={overview?.openExceptionsCount === 0 ? 'Clear' : 'Action Required'}
              trendPositive={overview?.openExceptionsCount === 0}
            />
            <KpiCard
              title="Critical Policy Gaps"
              value={`${overview?.criticalExceptionsCount || 0} Critical`}
              hint="Blocks Sanction / Disbursal"
              icon={Flame}
              trend={overview?.criticalExceptionsCount === 0 ? 'Optimal' : 'Immediate Blocker'}
              trendPositive={overview?.criticalExceptionsCount === 0}
            />
          </div>

          {/* Category Scoreboard */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Regulatory Category Scoreboard
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {overview?.categoryScores &&
                Object.entries(overview.categoryScores).map(([cat, val]) => (
                  <Card key={cat} className="p-3.5 space-y-2 border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {cat.replace(/_/g, ' ')}
                      </span>
                      <Badge
                        variant={val.score === 100 ? 'success' : val.score >= 70 ? 'warning' : 'danger'}
                        className="text-[10px]"
                      >
                        {val.score}%
                      </Badge>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          val.score === 100 ? 'bg-emerald-500' : val.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                        )}
                        style={{ width: `${val.score}%` }}
                      />
                    </div>

                    <p className="text-[10px] text-slate-400">
                      {val.activeExceptions === 0 ? 'Zero active exceptions' : `${val.activeExceptions} active exception(s)`}
                    </p>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXCEPTIONS */}
      {activeTab === 'EXCEPTIONS' && (
        <div className="space-y-4">
          <Card className="p-4 space-y-3 border">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Tracked Compliance Exceptions
                </h3>
                <p className="text-xs text-slate-400">
                  Manage policy violations, missing KYC/consent, and segregation of duties remediation
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {exceptions.length} Total Records
              </span>
            </div>

            {exceptionsLoading ? (
              <div className="p-8 text-center">
                <Spinner />
              </div>
            ) : exceptions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active compliance exceptions found. All application evaluations are compliant.
              </div>
            ) : (
              <div className="space-y-2.5">
                {exceptions.map((exc) => (
                  <div
                    key={exc.id}
                    className={cn(
                      'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border text-xs transition-all',
                      exc.status === 'REMEDIATED' || exc.status === 'ACCEPTED_RISK'
                        ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60'
                        : exc.severity === 'CRITICAL'
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                        : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full font-bold text-[10px]',
                            exc.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          )}
                        >
                          {exc.severity}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">[{exc.ruleId}]</span>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{exc.ruleName}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">{exc.finding}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span>Entity: {exc.entityType} #{exc.entityId}</span>
                        <span>Assigned Role: {exc.assignedToRole}</span>
                        <span>Status: <strong className="text-slate-700 dark:text-slate-300">{exc.status}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedException(exc);
                          setTargetTransitionStatus(
                            exc.status === 'OPEN'
                              ? 'UNDER_REVIEW'
                              : exc.status === 'UNDER_REVIEW'
                              ? 'RESOLVED'
                              : 'CLOSED'
                          );
                        }}
                        className="text-[11px] h-7 cursor-pointer"
                      >
                        Remediate / Transition
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: RULES DIRECTORY */}
      {activeTab === 'RULES' && (
        <Card className="p-4 space-y-3 border">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-blue-600" />
                Institutional Compliance Policy Directory
              </h3>
              <p className="text-xs text-slate-400">
                Deterministic rules enforced across credit evaluation, loan sanction, and disbursements
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {rules.length} Configured Rules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {rule.id}
                    </span>
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded text-[10px] font-bold',
                        rule.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      )}
                    >
                      {rule.severity}
                    </span>
                  </div>
                  <Badge variant={rule.status === 'ACTIVE' ? 'success' : 'default'} className="text-[10px]">
                    {rule.status}
                  </Badge>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-white">{rule.name}</h4>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">{rule.description}</p>

                <div className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-[10px] space-y-1 font-mono text-slate-500">
                  <div>Evidence: {rule.evidenceRequirement}</div>
                  <div>Escalation: {rule.escalationBehavior}</div>
                  <div>Responsible: {rule.responsibleRole}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: SANDBOX */}
      {activeTab === 'SANDBOX' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5 space-y-4 border">
            <div className="border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="h-4 w-4 text-purple-600" />
                Compliance Evaluation Simulator
              </h3>
              <p className="text-xs text-slate-400">
                Test deterministic rule evaluation against simulated application parameters
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Requested Loan Amount (₹)
                </label>
                <input
                  type="number"
                  value={sandboxAmount}
                  onChange={(e) => setSandboxAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sandboxPan}
                    onChange={(e) => setSandboxPan(e.target.checked)}
                    className="rounded"
                  />
                  <span>PAN Verified (NSDL Match)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sandboxKyc}
                    onChange={(e) => setSandboxKyc(e.target.checked)}
                    className="rounded"
                  />
                  <span>KYC Verified (Digilocker)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sandboxKfs}
                    onChange={(e) => setSandboxKfs(e.target.checked)}
                    className="rounded"
                  />
                  <span>KFS Consented & Signed</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sandboxBankValid}
                    onChange={(e) => setSandboxBankValid(e.target.checked)}
                    className="rounded"
                  />
                  <span>Penny-Drop Bank Validated</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sandboxIncomeDocs}
                    onChange={(e) => setSandboxIncomeDocs(e.target.checked)}
                    className="rounded"
                  />
                  <span>Income Proof / Bank Stmt Uploaded</span>
                </label>
              </div>

              <div className="pt-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Distinct Staff Approvers (Dual Signoff SoD)
                </label>
                <select
                  value={sandboxApproversCount}
                  onChange={(e) => setSandboxApproversCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                >
                  <option value={1}>1 Approver (Single Underwriter)</option>
                  <option value={2}>2 Distinct Approvers (Maker-Checker)</option>
                </select>
              </div>

              <Button
                variant="primary"
                size="sm"
                disabled={evaluateSandboxMutation.isPending}
                onClick={() => evaluateSandboxMutation.mutate()}
                className="w-full mt-4 cursor-pointer"
              >
                {evaluateSandboxMutation.isPending ? 'Evaluating...' : 'Run Compliance Evaluation'}
              </Button>
            </div>
          </Card>

          {/* Sandbox Results Output */}
          <Card className="p-5 space-y-4 border">
            <div className="border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Evaluation Output & Findings
              </h3>
              <p className="text-xs text-slate-400">Deterministic rule outcome report</p>
            </div>

            {!sandboxResult ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Click &quot;Run Compliance Evaluation&quot; to execute deterministic rule analysis.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <div>
                    <span className="text-slate-500 text-[11px]">Calculated Compliance Score</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {sandboxResult.complianceScore}%
                    </div>
                  </div>
                  <Badge
                    variant={
                      sandboxResult.overallStatus === 'COMPLIANT'
                        ? 'success'
                        : sandboxResult.overallStatus === 'PARTIALLY_COMPLIANT'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {sandboxResult.overallStatus}
                  </Badge>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {sandboxResult.evaluations?.map((ev: any) => (
                    <div
                      key={ev.ruleId}
                      className={cn(
                        'p-2.5 rounded-lg border text-[11px]',
                        ev.status === 'COMPLIANT'
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                          : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                      )}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>[{ev.ruleId}] {ev.ruleName}</span>
                        <span>{ev.status}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">{ev.finding}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* REMEDIATION & TRANSITION MODAL */}
      {selectedException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Remediate Exception #{selectedException.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedException(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">
                  [{selectedException.ruleId}] {selectedException.ruleName}
                </div>
                <p className="text-slate-600 dark:text-slate-400">{selectedException.finding}</p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Current Status: {selectedException.status}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Exception Status
                </label>
                <select
                  value={targetTransitionStatus}
                  onChange={(e) => setTargetTransitionStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                >
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="REMEDIATION_REQUIRED">REMEDIATION_REQUIRED</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remediation Notes / Action Plan
                </label>
                <textarea
                  rows={3}
                  value={remediationNotes}
                  onChange={(e) => setRemediationNotes(e.target.value)}
                  placeholder="Enter corrective action details (e.g., Digilocker XML re-uploaded and validated)..."
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedException(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={transitionMutation.isPending}
                onClick={() =>
                  transitionMutation.mutate({
                    id: selectedException.id,
                    status: targetTransitionStatus,
                    notes: remediationNotes,
                  })
                }
              >
                {transitionMutation.isPending ? 'Saving...' : 'Apply Transition'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
