'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Workflow,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  ArrowRight,
  Sliders,
  Sparkles,
  RefreshCw,
  Play,
  Layers,
  FileCheck,
  Building2,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, KpiCard, Button, Badge, Spinner } from '@/components/ui';
import { formatMoney, formatDateTime, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

interface StageGateCriteria {
  field: string;
  operator: string;
  value: any;
  description: string;
}

interface AutomatedTriggerAction {
  type: string;
  description: string;
}

interface BranchRule {
  conditionName: string;
  criteria: StageGateCriteria[];
  routeToStageCode: string;
  requiresDualApproval?: boolean;
}

interface WorkflowStage {
  id: string;
  sequence: number;
  code: string;
  name: string;
  description: string;
  assigneeRole: string;
  slaHours: number;
  entryCriteria: StageGateCriteria[];
  mandatoryGates: StageGateCriteria[];
  automatedTriggers: AutomatedTriggerAction[];
  branchRules: BranchRule[];
}

interface WorkflowDefinition {
  id: string;
  tenantId: string;
  type: string;
  code: string;
  name: string;
  description: string;
  version: number;
  status: string;
  stages: WorkflowStage[];
}

export default function WorkflowStudioPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedType, setSelectedType] = useState<'LOAN_ORIGINATION' | 'HARDSHIP_RESTRUCTURING'>('LOAN_ORIGINATION');
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | null>(null);

  // Simulator State
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [candidatePayload, setCandidatePayload] = useState({
    applicationId: 'APPL-SIM-8821',
    cibilScore: 785,
    fraudScore: 12,
    loanAmount: 450000,
    employmentType: 'SALARIED',
    ekycVerified: true,
    panValidated: true,
    bankStatementAnalyzed: true,
    sanctionAgreementSigned: true,
    enachActive: true,
    committeeApprovalsCount: 2,
  });
  const [simSelectedStageCode, setSimSelectedStageCode] = useState('BUREAU_FRAUD_ASSESSMENT');
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);

  // 1. Fetch Workflows List
  const { data: workflows = [], isLoading, refetch, isFetching } = useQuery<WorkflowDefinition[]>({
    queryKey: ['workflows-list'],
    queryFn: async () => (await api.get('/workflows')).data.data,
  });

  const activeWorkflow = workflows.find((w) => w.type === selectedType) || workflows[0];

  // Evaluate Transition Mutation
  const evaluateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/workflows/evaluate-transition', {
        workflowType: selectedType,
        currentStageCode: simSelectedStageCode,
        candidatePayload,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setEvaluationResult(data);
    },
    onError: (err: any) => {
      alert(`Simulation failed: ${apiErrorMessage(err)}`);
    },
  });

  const totalGates = activeWorkflow?.stages.reduce((acc, s) => acc + s.mandatoryGates.length, 0) || 0;
  const totalBranches = activeWorkflow?.stages.reduce((acc, s) => acc + s.branchRules.length, 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Enterprise / Governance"
        title="Dynamic Workflow Studio"
        subtitle="Visual pipeline orchestration, mandatory verification gates, fast-track branching, dual committee routing, and automated triggers"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEvaluationResult(null);
                setSimulatorOpen(true);
              }}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" />
              Transition Simulator
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Pipelines"
          value={`${workflows.length} Workflows`}
          hint="Dynamic State Engine"
          icon={Workflow}
        />
        <KpiCard
          title="Pipeline Stages"
          value={`${activeWorkflow?.stages.length || 0} Stages`}
          hint={`Workflow: ${activeWorkflow?.code || 'None'}`}
          icon={Layers}
          trend="Versioned"
          trendPositive={true}
        />
        <KpiCard
          title="Verification Gates"
          value={`${totalGates} Active Gates`}
          hint="Statutory & Underwriting Rules"
          icon={ShieldCheck}
        />
        <KpiCard
          title="Dynamic Branch Rules"
          value={`${totalBranches} Decision Routes`}
          hint="Fast-Track & Committee"
          icon={GitBranch}
        />
      </div>

      {/* Workflow Selector Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#1E2445] text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setSelectedType('LOAN_ORIGINATION');
            setSelectedStage(null);
          }}
          className={cn(
            'px-4 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer',
            selectedType === 'LOAN_ORIGINATION'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <Workflow className="h-4 w-4" />
          Digital Loan Origination Pipeline (6 Stages)
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedType('HARDSHIP_RESTRUCTURING');
            setSelectedStage(null);
          }}
          className={cn(
            'px-4 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer',
            selectedType === 'HARDSHIP_RESTRUCTURING'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <Sliders className="h-4 w-4" />
          Hardship Restructuring Pipeline (4 Stages)
        </button>
      </div>

      {/* VISUAL PIPELINE STAGE DIAGRAM */}
      <Card className="p-4 space-y-4 border">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Workflow className="h-4 w-4 text-blue-600" />
              {activeWorkflow?.name}
            </h3>
            <p className="text-xs text-slate-400">{activeWorkflow?.description}</p>
          </div>
          <Badge variant="success" className="text-[10px] font-mono">v{activeWorkflow?.version}.0 ACTIVE</Badge>
        </div>

        {isLoading ? (
          <div className="p-8 text-center"><Spinner /></div>
        ) : (
          <div className="space-y-4">
            {/* Horizontal Stage Stepper */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {activeWorkflow?.stages.map((stage) => {
                const isSelected = selectedStage?.id === stage.id;
                return (
                  <button
                    type="button"
                    key={stage.id}
                    onClick={() => setSelectedStage(stage)}
                    className={cn(
                      'p-3 rounded-xl border text-left space-y-2 transition-all cursor-pointer relative',
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30'
                        : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-[#1E2445] hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        #{stage.sequence}
                      </span>
                      <span className="flex items-center gap-0.5 text-slate-400 font-mono">
                        <Clock className="h-3 w-3" />
                        {stage.slaHours}h
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                        {stage.name}
                      </h4>
                      <div className="font-mono text-[9px] text-slate-400 truncate">{stage.code}</div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[9px]">
                      <Badge variant="default" className="text-[8px] px-1 py-0">{stage.assigneeRole}</Badge>
                      {stage.branchRules.length > 0 && (
                        <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-0.5">
                          <GitBranch className="h-2.5 w-2.5" />
                          {stage.branchRules.length}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* STAGE DETAIL INSPECTOR */}
            {selectedStage && (
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/10 space-y-3 text-xs animate-fade-in">
                <div className="flex items-center justify-between border-b pb-2 border-blue-200 dark:border-blue-900/40">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                      Stage #{selectedStage.sequence}: {selectedStage.name} ({selectedStage.code})
                    </span>
                    <Badge variant="info" className="text-[10px]">Assignee: {selectedStage.assigneeRole}</Badge>
                    <Badge variant="default" className="text-[10px]">SLA: {selectedStage.slaHours} Hours</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStage(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-[11px]">{selectedStage.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {/* Mandatory Verification Gates */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <h5 className="font-bold text-slate-900 dark:text-white text-[11px] flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Mandatory Verification Gates ({selectedStage.mandatoryGates.length})
                    </h5>
                    {selectedStage.mandatoryGates.length === 0 ? (
                      <p className="text-slate-400 text-[10px]">No gate barriers for this entry stage.</p>
                    ) : (
                      <div className="space-y-1">
                        {selectedStage.mandatoryGates.map((gate, i) => (
                          <div key={i} className="text-[10px] font-mono p-1 bg-slate-50 dark:bg-slate-800 rounded">
                            <strong className="text-blue-600">{gate.field}</strong> {gate.operator} {String(gate.value)}
                            <span className="block text-[9px] text-slate-400">{gate.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Conditional Branching Rules */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <h5 className="font-bold text-slate-900 dark:text-white text-[11px] flex items-center gap-1">
                      <GitBranch className="h-3.5 w-3.5 text-purple-600" />
                      Conditional Decision Routes ({selectedStage.branchRules.length})
                    </h5>
                    {selectedStage.branchRules.length === 0 ? (
                      <p className="text-slate-400 text-[10px]">Sequential forward transition only.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedStage.branchRules.map((rule, i) => (
                          <div key={i} className="text-[10px] p-1.5 bg-purple-50 dark:bg-purple-950/30 rounded border border-purple-200 dark:border-purple-900 space-y-0.5">
                            <strong className="text-purple-700 dark:text-purple-300 block">{rule.conditionName}</strong>
                            <div className="font-mono text-[9px] text-slate-500">
                              ↳ Route to: <strong className="text-purple-600">{rule.routeToStageCode}</strong>
                            </div>
                            {rule.requiresDualApproval && (
                              <Badge variant="danger" className="text-[8px] px-1">Requires Dual Committee Approval</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Automated Trigger Actions */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <h5 className="font-bold text-slate-900 dark:text-white text-[11px] flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-amber-600" />
                      Automated Triggers ({selectedStage.automatedTriggers.length})
                    </h5>
                    {selectedStage.automatedTriggers.length === 0 ? (
                      <p className="text-slate-400 text-[10px]">No automated background webhooks.</p>
                    ) : (
                      <div className="space-y-1">
                        {selectedStage.automatedTriggers.map((trig, i) => (
                          <div key={i} className="text-[10px] p-1 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
                            ⚡ {trig.description}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* INTERACTIVE TRANSITION SIMULATOR MODAL */}
      {simulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Play className="h-4 w-4 text-blue-600" />
                  Live Workflow Transition Simulator & Gate Inspector
                </h3>
                <p className="text-xs text-slate-400">
                  Simulate stage transitions with candidate applicant telemetry
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSimulatorOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Evaluating From Stage</label>
                  <select
                    value={simSelectedStageCode}
                    onChange={(e) => setSimSelectedStageCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                  >
                    {activeWorkflow?.stages.map((s) => (
                      <option key={s.code} value={s.code}>
                        #{s.sequence} {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">CIBIL Bureau Score</label>
                  <input
                    type="number"
                    value={candidatePayload.cibilScore}
                    onChange={(e) => setCandidatePayload({ ...candidatePayload, cibilScore: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Requested Loan Amount (₹)</label>
                  <input
                    type="number"
                    value={candidatePayload.loanAmount}
                    onChange={(e) => setCandidatePayload({ ...candidatePayload, loanAmount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Fraud Risk Score (0-100)</label>
                  <input
                    type="number"
                    value={candidatePayload.fraudScore}
                    onChange={(e) => setCandidatePayload({ ...candidatePayload, fraudScore: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Employment Type</label>
                  <select
                    value={candidatePayload.employmentType}
                    onChange={(e) => setCandidatePayload({ ...candidatePayload, employmentType: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                  >
                    <option value="SALARIED">SALARIED</option>
                    <option value="SELF_EMPLOYED_BUSINESS">SELF_EMPLOYED_BUSINESS</option>
                  </select>
                </div>
              </div>

              {/* SIMULATION RESULTS VIEW */}
              {evaluationResult && (
                <div className={cn(
                  'p-4 rounded-xl border space-y-2.5 animate-fade-in',
                  evaluationResult.allowed
                    ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      {evaluationResult.allowed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                      )}
                      <span className={evaluationResult.allowed ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}>
                        {evaluationResult.allowed ? 'STAGE TRANSITION PERMITTED' : 'STAGE TRANSITION BLOCKED BY GATE'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {evaluationResult.requiresDualApproval && (
                        <Badge variant="danger" className="text-[10px]">Dual Approval Required</Badge>
                      )}
                      <Badge variant={evaluationResult.allowed ? 'success' : 'danger'} className="text-[10px]">
                        Target: {evaluationResult.targetStageCode}
                      </Badge>
                    </div>
                  </div>

                  {evaluationResult.evaluatedBranch && (
                    <div className="text-[11px] p-2 bg-purple-50 dark:bg-purple-950/40 rounded border border-purple-200 text-purple-900 dark:text-purple-300 font-mono">
                      ⚡ Dynamic Branch Triggered: <strong>{evaluationResult.evaluatedBranch}</strong>
                    </div>
                  )}

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Verification Gate Checks:</span>
                    {evaluationResult.gateCheckResults.map((gate: any, i: number) => (
                      <div key={i} className="text-[11px] font-mono flex items-center justify-between p-1 bg-white dark:bg-slate-900 rounded">
                        <span>{gate.criteria}</span>
                        {gate.passed ? (
                          <span className="text-emerald-600 font-bold">✓ PASSED</span>
                        ) : (
                          <span className="text-rose-600 font-bold">✗ {gate.reason}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1E2445]">
              <Button variant="secondary" size="sm" onClick={() => setSimulatorOpen(false)}>
                Close Simulator
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={evaluateMutation.isPending}
                onClick={() => evaluateMutation.mutate()}
                className="text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {evaluateMutation.isPending ? 'Evaluating...' : 'Run Live Evaluation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
