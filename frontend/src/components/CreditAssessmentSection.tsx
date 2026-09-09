'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Calculator,
  UserCheck,
  FileCheck,
  Send,
  Sparkles,
  TrendingUp,
  Clock,
  RotateCcw,
  IndianRupee,
  Layers,
  FileText,
  ExternalLink,
  ChevronRight,
  Info,
  Building,
  Briefcase,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { Card, Button, Badge, Input, Spinner } from '@/components/ui';

interface Props {
  applicationId: string;
  applicationNo: string;
  currentStatus: string;
  customer: any;
  product: any;
  isCreditAnalyst: boolean;
  onDecisionSubmitted?: () => void;
}

type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function CreditAssessmentSection({
  applicationId,
  applicationNo,
  currentStatus,
  customer,
  product,
  isCreditAnalyst,
  onDecisionSubmitted,
}: Props) {
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch full financial capacity & step data
  const {
    data: capacity,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['credit-capacity', applicationId],
    queryFn: async () => {
      const res = await api.get(`/credit/applications/${applicationId}/capacity`);
      return res.data?.data;
    },
    enabled: !!applicationId,
  });

  // Selected Active Step in Stepper (defaults to current workflow step from capacity)
  const [activeStep, setActiveStep] = useState<StepNumber>(1);

  // Step 2 State (KYC Verification)
  const [kycRemarks, setKycRemarks] = useState('');

  // Step 3 State (Document Verification)
  const [docRemarksMap, setDocRemarksMap] = useState<Record<string, string>>({});

  // Step 4 State (Financial Eligibility)
  const [verifiedIncomeInput, setVerifiedIncomeInput] = useState<number | string>('');
  const [financialRemarks, setFinancialRemarks] = useState('');

  // Step 5 State (Credit Risk Assessment)
  const [riskGradeInput, setRiskGradeInput] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [riskRemarks, setRiskRemarks] = useState('');

  // Step 6 State (Analyst Decision)
  const [decision, setDecision] = useState<
    'ELIGIBLE' | 'NOT_ELIGIBLE' | 'FURTHER_REVIEW' | 'REQUEST_ADDITIONAL_DOCS'
  >('ELIGIBLE');
  const [rejectionReasonPreset, setRejectionReasonPreset] = useState('FOIR exceeds policy limit');
  const [rejectionReasonCustom, setRejectionReasonCustom] = useState('');
  const [riskConcern, setRiskConcern] = useState('');
  const [requiredAction, setRequiredAction] = useState('');
  const [requestedDocs, setRequestedDocs] = useState('');
  const [decisionReason, setDecisionReason] = useState('');

  // Synchronize state when capacity is loaded
  useEffect(() => {
    if (capacity) {
      const serverStep = (capacity.workflowStep?.currentStep || 1) as StepNumber;
      setActiveStep(serverStep);

      if (verifiedIncomeInput === '') {
        setVerifiedIncomeInput(capacity.verifiedMonthlyIncome || capacity.declaredMonthlyIncome || '');
      }

      if (capacity.riskSummary?.category) {
        setRiskGradeInput(capacity.riskSummary.category);
      } else if (capacity.riskCategory) {
        setRiskGradeInput(capacity.riskCategory as any);
      }

      if (capacity.previousDecision?.reason && !decisionReason) {
        setDecisionReason(capacity.previousDecision.reason);
      }
      if (capacity.previousDecision?.result) {
        setDecision(capacity.previousDecision.result as any);
      }
    }
  }, [capacity]);

  const workflow = capacity?.workflowStep || {
    currentStep: 1,
    step1Complete: false,
    step2Complete: false,
    step3Complete: false,
    step4Complete: false,
    step5Complete: false,
    step6Complete: false,
    step7Complete: false,
  };

  // Helper to check if a step is unlocked
  const isStepUnlocked = (step: StepNumber): boolean => {
    if (step === 1) return true;
    if (step === 2) return workflow.step1Complete;
    if (step === 3) return workflow.step1Complete && workflow.step2Complete;
    if (step === 4) return workflow.step1Complete && workflow.step2Complete && workflow.step3Complete;
    if (step === 5) return workflow.step1Complete && workflow.step2Complete && workflow.step3Complete && workflow.step4Complete;
    if (step === 6) return workflow.step1Complete && workflow.step2Complete && workflow.step3Complete && workflow.step4Complete && workflow.step5Complete;
    if (step === 7) return workflow.step6Complete;
    return false;
  };

  // ---------------------------------------------------------------------------
  // MUTATIONS FOR EACH STEP
  // ---------------------------------------------------------------------------

  // Step 1: Start Credit Assessment
  const startAssessmentMutation = useMutation({
    mutationFn: async () => api.post(`/credit/applications/${applicationId}/start-assessment`),
    onSuccess: () => {
      toast.success('Credit Assessment initiated successfully.');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['credit-queue'] });
      setActiveStep(2);
    },
    onError: (err: any) => toast.error(apiErrorMessage(err)),
  });

  // Step 2: Verify KYC
  const verifyKycMutation = useMutation({
    mutationFn: async (status: 'VERIFIED' | 'FAILED' | 'PENDING') =>
      api.post(`/credit/applications/${applicationId}/verify-kyc`, {
        kycStatus: status,
        riskCategory: riskGradeInput,
        remarks: kycRemarks || undefined,
      }),
    onSuccess: (_, status) => {
      if (status === 'VERIFIED') {
        toast.success('Borrower KYC compliance verified. Unlocked Step 3: Document Verification.');
        setActiveStep(3);
      } else if (status === 'FAILED') {
        toast.error('Borrower KYC marked as FAILED. Progression blocked.');
      } else {
        toast.warning('Borrower KYC marked as PENDING. Complete KYC before proceeding.');
      }
      refetch();
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['credit-queue'] });
    },
    onError: (err: any) => toast.error(apiErrorMessage(err)),
  });

  // Step 3: Verify Document
  const verifyDocMutation = useMutation({
    mutationFn: async ({ documentId, status }: { documentId: string; status: 'VERIFIED' | 'REJECTED' | 'PENDING' }) =>
      api.post(`/credit/applications/${applicationId}/verify-document`, {
        documentId,
        status,
        remarks: docRemarksMap[documentId] || undefined,
      }),
    onSuccess: (_, variables) => {
      toast.success(`Document marked as ${variables.status}.`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
    },
    onError: (err: any) => toast.error(apiErrorMessage(err)),
  });

  // Step 3: Batch Verify All Documents
  const batchVerifyDocsMutation = useMutation({
    mutationFn: async () => {
      const allDocIds: string[] = [];
      capacity?.documentChecklist?.forEach((cat: any) => {
        cat.documents?.forEach((d: any) => allDocIds.push(d.id));
      });
      if (allDocIds.length === 0) throw new Error('No uploaded documents available to verify.');
      return api.post(`/credit/applications/${applicationId}/batch-verify-documents`, {
        documentIds: allDocIds,
        status: 'VERIFIED',
        remarks: 'All mandatory compliance documents verified by Credit Analyst',
      });
    },
    onSuccess: () => {
      toast.success('All documents verified successfully. Step 4 is now unlocked.');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      setActiveStep(4);
    },
    onError: (err: any) => toast.error(apiErrorMessage(err)),
  });

  // Step 4: Evaluate Financial Eligibility
  const evaluateFinancialsMutation = useMutation({
    mutationFn: async () =>
      api.post(`/credit/applications/${applicationId}/evaluate-financials`, {
        verifiedIncome: Number(verifiedIncomeInput) || undefined,
        remarks: financialRemarks || undefined,
      }),
    onSuccess: (res) => {
      const d = res.data?.data;
      toast.success(`Financial eligibility check evaluated: ${d?.result || 'COMPLETED'}`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      setActiveStep(5);
    },
    onError: (err: any) => toast.error(apiErrorMessage(err)),
  });

  // Step 5: Record Risk Assessment
  const recordRiskMutation = useMutation({
    mutationFn: async () =>
      api.post(`/credit/applications/${applicationId}/evaluate-risk`, {
        riskGrade: riskGradeInput,
        remarks: riskRemarks || undefined,
      }),
    onSuccess: (res) => {
      const d = res.data?.data;
      toast.success(`4-Pillar Risk Engine computed score: ${d?.score}/100 (${d?.category})`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      setActiveStep(6);
    },
    onError: (err: any) => toast.error(apiErrorMessage(err)),
  });

  // Step 6 & 7: Submit Decision & Forward to Underwriter
  const submitDecisionMutation = useMutation({
    mutationFn: async () => {
      if (!decisionReason.trim() || decisionReason.trim().length < 10) {
        throw new Error('A detailed decision justification is mandatory (at least 10 characters).');
      }

      const fullRejectionReason =
        decision === 'NOT_ELIGIBLE'
          ? rejectionReasonCustom.trim() || rejectionReasonPreset
          : undefined;

      return api.post(`/credit/applications/${applicationId}/decision`, {
        decision,
        reason: decisionReason.trim(),
        rejectionReason: fullRejectionReason,
        riskConcern: decision === 'FURTHER_REVIEW' ? riskConcern.trim() : undefined,
        requiredAction: decision === 'FURTHER_REVIEW' ? requiredAction.trim() : undefined,
        requestedDocuments:
          decision === 'FURTHER_REVIEW' || decision === 'REQUEST_ADDITIONAL_DOCS'
            ? requestedDocs.trim()
            : undefined,
        verifiedIncome: Number(verifiedIncomeInput) || undefined,
        riskGrade: riskGradeInput,
        analystRemarks: decisionReason.trim(),
      });
    },
    onSuccess: () => {
      if (decision === 'ELIGIBLE') {
        toast.success('Proposal recommended as ELIGIBLE and forwarded to Underwriting Queue.');
      } else if (decision === 'NOT_ELIGIBLE') {
        toast.warning('Credit assessment recorded as NOT ELIGIBLE.');
      } else {
        toast.info('Application marked for FURTHER REVIEW & sent to Loan Officer.');
      }
      refetch();
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['credit-queue'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      setActiveStep(7);
      if (onDecisionSubmitted) onDecisionSubmitted();
    },
    onError: (err: any) => toast.error(apiErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <Card className="p-8 text-center space-y-3">
        <div className="flex justify-center">
          <Spinner size="md" />
        </div>
        <p className="text-xs text-slate-400">Loading Credit Analyst Sequential Workspace...</p>
      </Card>
    );
  }

  const custDetails = capacity?.customerDetails || {
    name: `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'Borrower',
    customerCode: customer?.customerCode || '-',
    dateOfBirth: customer?.dateOfBirth ? String(customer.dateOfBirth).split('T')[0] : null,
    age: null,
    mobile: customer?.mobile || '-',
    email: customer?.email || '-',
    address: customer?.addressLine || '-',
    kycStatus: customer?.kycStatus || 'NOT_STARTED',
  };

  const docChecklist = capacity?.documentChecklist || [];
  const docSummary = capacity?.documentSummary || {
    allMandatoryVerified: false,
    hasMissing: true,
    hasRejected: false,
    verifiedCount: 0,
    totalMandatory: 5,
  };

  const finEligibility = capacity?.financialEligibility || {
    isEligible: false,
    foir: 0,
    dti: 0,
    maxAllowedFoir: 50,
    minRequiredIncome: 25000,
    reason: 'Evaluation pending',
    policyPassed: false,
    proposedEmi: capacity?.proposedEmi || 0,
    totalObligations: capacity?.totalMonthlyObligations || 0,
    netDisposableIncome: capacity?.netDisposableIncome || 0,
  };

  const riskSummary = capacity?.riskSummary || {
    score: null,
    category: null,
    factors: null,
    recommendation: null,
  };

  const previousDecision = capacity?.previousDecision;

  // Step definitions for top progress stepper
  const stepsList: { num: StepNumber; title: string; subtitle: string; isComplete: boolean }[] = [
    { num: 1, title: 'Application', subtitle: 'Proposals Inflow', isComplete: workflow.step1Complete },
    { num: 2, title: 'KYC Verification', subtitle: 'Identity & Address', isComplete: workflow.step2Complete },
    { num: 3, title: 'Document Checklist', subtitle: '5 Mandatory Categories', isComplete: workflow.step3Complete },
    { num: 4, title: 'Financial Eligibility', subtitle: 'FOIR, DTI & Policy', isComplete: workflow.step4Complete },
    { num: 5, title: 'Credit Risk', subtitle: '4-Pillar Model', isComplete: workflow.step5Complete },
    { num: 6, title: 'Analyst Decision', subtitle: 'Recommendation', isComplete: workflow.step6Complete },
    { num: 7, title: 'Underwriter Handover', subtitle: 'Sanction Queue', isComplete: workflow.step7Complete },
  ];

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* TOP PROGRESS INDICATOR (7-STEP SEQUENTIAL WORKFLOW)                       */}
      {/* ========================================================================= */}
      <Card className="p-4 sm:p-5 border-2 border-blue-500/20 dark:border-blue-500/30 overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#2B3566]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#2563EB] animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Credit Analyst Step-by-Step Assessment Workflow
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Step {activeStep} of 7
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict sequential compliance: complete each required checkpoint to unlock subsequent risk and sanction stages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Workflow Status:
            </span>
            <Badge status={capacity?.currentLifecycleStatus || currentStatus} />
          </div>
        </div>

        {/* Progress Bar & Stepper Tabs */}
        <div className="pt-4 overflow-x-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 min-w-[720px]">
            {stepsList.map((step) => {
              const isCurrent = activeStep === step.num;
              const unlocked = isStepUnlocked(step.num);

              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => {
                    if (unlocked) {
                      setActiveStep(step.num);
                    } else {
                      toast.warning(
                        `Step ${step.num} (${step.title}) is locked. Complete previous required checkpoints first.`
                      );
                    }
                  }}
                  className={cn(
                    'p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer',
                    isCurrent
                      ? 'border-[#2563EB] bg-blue-50/80 dark:bg-[#1E2445] dark:border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-sm'
                      : step.isComplete
                      ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800/40 hover:border-emerald-300'
                      : unlocked
                      ? 'border-slate-200 dark:border-[#2B3566] hover:border-slate-300 bg-white dark:bg-[#16203D]'
                      : 'border-slate-200/50 dark:border-[#2B3566]/40 opacity-60 bg-slate-50 dark:bg-[#16203D]/40 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                        step.isComplete
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-[#2563EB] text-white'
                          : unlocked
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      )}
                    >
                      {step.isComplete ? '✓' : step.num}
                    </span>

                    {step.isComplete ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : isCurrent ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA]">
                        Active
                      </span>
                    ) : !unlocked ? (
                      <Lock className="h-3 w-3 text-slate-400" />
                    ) : null}
                  </div>

                  <div>
                    <p
                      className={cn(
                        'text-xs font-bold truncate',
                        isCurrent
                          ? 'text-[#2563EB] dark:text-[#60A5FA]'
                          : step.isComplete
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-700 dark:text-slate-300'
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{step.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* STEP 1: APPLICATION RECEIVED                                               */}
      {/* ========================================================================= */}
      {activeStep === 1 && (
        <Card className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#2B3566]">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#2563EB]" /> Step 1: Application Received & Verification Intake
              </h4>
              <p className="text-xs text-slate-400">
                Review incoming proposal details and initiate the formal credit assessment ledger.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Application No: <strong className="text-[#2563EB]">{applicationNo}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-100 dark:border-[#2B3566]">
              <span className="text-slate-400 block text-[11px]">Borrower Name</span>
              <strong className="text-slate-900 dark:text-white text-sm">{custDetails.name}</strong>
              <span className="text-[11px] text-slate-400 block font-mono mt-0.5">{custDetails.customerCode}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-100 dark:border-[#2B3566]">
              <span className="text-slate-400 block text-[11px]">Requested Sanction</span>
              <strong className="text-slate-900 dark:text-white text-sm">
                {formatMoney(capacity?.requestedLoanAmount || 0)}
              </strong>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {capacity?.tenureMonths || 12} Months @ {capacity?.interestRatePct || 14.5}% p.a.
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-100 dark:border-[#2B3566]">
              <span className="text-slate-400 block text-[11px]">Loan Product</span>
              <strong className="text-slate-900 dark:text-white text-sm">{product?.name || 'Standard Loan'}</strong>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {product?.interestMethod || 'REDUCING'} Balance
              </span>
            </div>
          </div>

          {/* Action Box */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 dark:border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-blue-900 dark:text-blue-300">
                {workflow.step1Complete
                  ? '✓ Application has been taken into Credit Assessment'
                  : 'Action Required: Start Credit Assessment'}
              </p>
              <p className="text-[11px] text-blue-700/80 dark:text-blue-300/70 mt-0.5">
                {workflow.step1Complete
                  ? 'Proposal is in active review. Proceed to Step 2 to verify borrower KYC compliance.'
                  : 'Initiating moves the status from SUBMITTED to CREDIT_ASSESSMENT and unlocks KYC verification.'}
              </p>
            </div>

            {workflow.step1Complete ? (
              <Button
                size="sm"
                onClick={() => setActiveStep(2)}
                className="bg-[#2563EB] hover:bg-blue-700 text-white gap-1.5 shrink-0"
              >
                <span>Proceed to Step 2: KYC Verification</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={startAssessmentMutation.isPending}
                onClick={() => startAssessmentMutation.mutate()}
                className="bg-[#2563EB] hover:bg-blue-700 text-white gap-1.5 shrink-0"
              >
                {startAssessmentMutation.isPending ? <Spinner size="sm" /> : <PlayIcon className="h-4 w-4" />}
                <span>Start Credit Assessment →</span>
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: KYC & CUSTOMER VERIFICATION                                       */}
      {/* ========================================================================= */}
      {activeStep === 2 && (
        <Card className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#2B3566]">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[#2563EB]" /> Step 2: KYC & Borrower Identity Verification
              </h4>
              <p className="text-xs text-slate-400">
                Verify customer identity, age policy, address, and mandatory KYC compliance records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">KYC Status:</span>
              <Badge status={custDetails.kycStatus} />
            </div>
          </div>

          {/* Customer Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-100 dark:border-[#2B3566]">
              <span className="text-slate-400 text-[11px] block">Customer Name</span>
              <strong className="text-slate-900 dark:text-white text-sm">{custDetails.name}</strong>
              <span className="text-[10px] text-slate-400 block font-mono mt-0.5">ID: {custDetails.customerCode}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-100 dark:border-[#2B3566]">
              <span className="text-slate-400 text-[11px] block">Date of Birth & Age</span>
              <strong className="text-slate-900 dark:text-white text-sm">
                {custDetails.dateOfBirth || 'Not Recorded'}
              </strong>
              <span className="text-[11px] block mt-0.5">
                {custDetails.age != null ? (
                  custDetails.age >= 21 && custDetails.age <= 60 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {custDetails.age} years (Policy Passed: 21-60 yrs)
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      {custDetails.age} years (Outside allowed 21-60 range)
                    </span>
                  )
                ) : (
                  <span className="text-amber-500 font-semibold">Age unverified</span>
                )}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-100 dark:border-[#2B3566]">
              <span className="text-slate-400 text-[11px] block">Contact Details</span>
              <strong className="text-slate-900 dark:text-white text-xs block">{custDetails.mobile}</strong>
              <span className="text-slate-500 text-[11px] block truncate mt-0.5">{custDetails.email || 'No email'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-100 dark:border-[#2B3566]">
              <span className="text-slate-400 text-[11px] block">Address</span>
              <p className="text-slate-700 dark:text-slate-200 text-[11px] leading-tight mt-0.5 line-clamp-2">
                {custDetails.address || 'Address unrecorded'}
              </p>
            </div>
          </div>

          {/* Business Logic Alert Banner */}
          {custDetails.kycStatus === 'VERIFIED' ? (
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/20 dark:border-emerald-800/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    KYC Compliance Fully Verified
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Borrower identity and residence have been officially validated. You can proceed to Document Checklist.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setActiveStep(3)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0"
              >
                <span>Proceed to Step 3: Documents</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : custDetails.kycStatus === 'REJECTED' ? (
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/70 dark:bg-rose-950/20 dark:border-rose-800/40 flex items-center gap-2.5">
              <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-rose-900 dark:text-rose-300">
                  KYC Verification Failed (Application Progression Blocked)
                </p>
                <p className="text-[11px] text-rose-700 dark:text-rose-400">
                  The applicant failed KYC compliance checks. Under institutional policy, an application with FAILED KYC cannot proceed to financial eligibility or loan sanction.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-800/40 flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  KYC Verification Pending (Required Action)
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  KYC is currently pending. Only when KYC is officially marked as <strong>VERIFIED</strong> can you proceed to Document Verification and Financial Eligibility.
                </p>
              </div>
            </div>
          )}

          {/* Verification Action Box */}
          {isCreditAnalyst && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#16203D]/60 space-y-3">
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Credit Analyst KYC Action:
              </h5>

              <Input
                placeholder="Optional verification remarks or KYC reference identifier..."
                value={kycRemarks}
                onChange={(e) => setKycRemarks(e.target.value)}
              />

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  disabled={verifyKycMutation.isPending}
                  onClick={() => verifyKycMutation.mutate('VERIFIED')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>[Verify KYC] → KYC VERIFIED</span>
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  disabled={verifyKycMutation.isPending}
                  onClick={() => verifyKycMutation.mutate('PENDING')}
                  className="gap-1.5 font-semibold text-amber-600 dark:text-amber-400"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Mark as KYC PENDING</span>
                </Button>

                <Button
                  size="sm"
                  variant="danger"
                  disabled={verifyKycMutation.isPending}
                  onClick={() => verifyKycMutation.mutate('FAILED')}
                  className="gap-1.5 font-semibold"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Mark as KYC FAILED</span>
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: DOCUMENT VERIFICATION CHECKLIST                                    */}
      {/* ========================================================================= */}
      {activeStep === 3 && (
        <Card className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#2B3566]">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-[#2563EB]" /> Step 3: Document Verification Checklist
              </h4>
              <p className="text-xs text-slate-400">
                Verify all mandatory compliance documents: Identity, Address, Income, Bank Statement, and Employment proof.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-bold border',
                  docSummary.allMandatoryVerified
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                    : docSummary.hasRejected
                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                )}
              >
                {docSummary.verifiedCount} / {docSummary.totalMandatory} Mandatory Verified
              </span>
            </div>
          </div>

          {/* Business Logic Alert */}
          {docSummary.hasMissing && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                <strong>DOCUMENTS_PENDING:</strong> One or more mandatory documents are missing. You cannot proceed to financial eligibility until all mandatory documents are uploaded and verified.
              </span>
            </div>
          )}

          {docSummary.hasRejected && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>
                <strong>DOCUMENT_VERIFICATION_FAILED:</strong> A mandatory document was rejected by the credit analyst. Rectification or re-upload is required.
              </span>
            </div>
          )}

          {/* Checklist Categories */}
          <div className="space-y-3">
            {docChecklist.map((item: any) => {
              const hasDocs = item.documents?.length > 0;
              const isVerified = item.status === 'VERIFIED';
              const isRejected = item.status === 'REJECTED';

              return (
                <div
                  key={item.category}
                  className={cn(
                    'p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3',
                    isVerified
                      ? 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/15 dark:border-emerald-800/40'
                      : isRejected
                      ? 'border-rose-200 bg-rose-50/40 dark:bg-rose-950/15 dark:border-rose-800/40'
                      : item.uploaded
                      ? 'border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-800/30'
                      : 'border-slate-200 bg-slate-50/60 dark:bg-[#1E2445]/40 dark:border-[#2B3566]'
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.label}
                      </span>
                      {item.mandatory && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          Mandatory
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                          isVerified
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300'
                            : item.uploaded
                            ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.description}</p>

                    {/* Attached files summary */}
                    {hasDocs ? (
                      <div className="pt-1 flex flex-wrap gap-2 text-[11px]">
                        {item.documents.map((doc: any) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-1.5 px-2 py-1 rounded bg-white dark:bg-[#16203D] border border-slate-200 dark:border-[#2B3566]"
                          >
                            <FileText className="h-3 w-3 text-slate-400" />
                            <span className="font-mono text-slate-700 dark:text-slate-200">{doc.fileName}</span>
                            {doc.storageKey && (
                              <a
                                href={doc.storageKey}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 ml-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold pt-0.5">
                        No document uploaded for this category
                      </p>
                    )}

                    {item.remarks && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 italic">
                        Remarks: {item.remarks}
                      </p>
                    )}
                  </div>

                  {/* Document Actions */}
                  {isCreditAnalyst && hasDocs && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        disabled={isVerified || verifyDocMutation.isPending}
                        onClick={() =>
                          verifyDocMutation.mutate({
                            documentId: item.documents[0].id,
                            status: 'VERIFIED',
                          })
                        }
                        className={cn(
                          'text-xs font-semibold gap-1',
                          isVerified ? 'bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        )}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{isVerified ? 'Verified' : 'Verify'}</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isRejected || verifyDocMutation.isPending}
                        onClick={() => {
                          const reason = prompt('Enter rejection reason for this document:');
                          if (reason) {
                            setDocRemarksMap((prev) => ({ ...prev, [item.documents[0].id]: reason }));
                            verifyDocMutation.mutate({
                              documentId: item.documents[0].id,
                              status: 'REJECTED',
                            });
                          }
                        }}
                        className="text-xs font-semibold text-rose-600 dark:text-rose-400"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Step 3 Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#2B3566]">
            {isCreditAnalyst && (
              <Button
                size="sm"
                variant="secondary"
                disabled={batchVerifyDocsMutation.isPending}
                onClick={() => batchVerifyDocsMutation.mutate()}
                className="gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Verify All Uploaded Documents</span>
              </Button>
            )}

            <Button
              size="sm"
              disabled={!docSummary.allMandatoryVerified}
              onClick={() => setActiveStep(4)}
              className={cn(
                'gap-1.5 text-xs font-bold text-white ml-auto',
                docSummary.allMandatoryVerified ? 'bg-[#2563EB] hover:bg-blue-700' : 'bg-slate-400 cursor-not-allowed'
              )}
            >
              <span>Proceed to Step 4: Financial Eligibility</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: FINANCIAL ELIGIBILITY CHECK                                       */}
      {/* ========================================================================= */}
      {activeStep === 4 && (
        <Card className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#2B3566]">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="h-4 w-4 text-[#2563EB]" /> Step 4: Financial Eligibility & Repayment Capacity Check
              </h4>
              <p className="text-xs text-slate-400">
                Automated debt service verification, DTI/FOIR calculations, and policy limit comparison.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5',
                  finEligibility.policyPassed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                )}
              >
                {finEligibility.policyPassed ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>✓ Financially Eligible</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                    <span>✕ Financially Not Eligible</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-100 dark:border-[#2B3566]">
              <span className="text-[11px] text-slate-400 block">Declared Income</span>
              <strong className="text-xs text-slate-900 dark:text-white block mt-0.5">
                {formatMoney(capacity?.declaredMonthlyIncome || 0)}
              </strong>
              <span className="text-[10px] text-slate-400">per month</span>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
              <span className="text-[11px] text-blue-700 dark:text-blue-300 block font-semibold">
                Verified Income
              </span>
              <strong className="text-xs text-blue-900 dark:text-blue-200 block mt-0.5">
                {formatMoney(Number(verifiedIncomeInput) || capacity?.verifiedMonthlyIncome || 0)}
              </strong>
              <span className="text-[10px] text-blue-500">Analyst verified</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-100 dark:border-[#2B3566]">
              <span className="text-[11px] text-slate-400 block">Existing EMI</span>
              <strong className="text-xs text-slate-900 dark:text-white block mt-0.5">
                {formatMoney(capacity?.existingMonthlyObligations || 0)}
              </strong>
              <span className="text-[10px] text-slate-400">External debt</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-100 dark:border-[#2B3566]">
              <span className="text-[11px] text-slate-400 block">Proposed New EMI</span>
              <strong className="text-xs text-slate-900 dark:text-white block mt-0.5">
                {formatMoney(capacity?.proposedEmi || 0)}
              </strong>
              <span className="text-[10px] text-slate-400">12 mos @ 14.5%</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-100 dark:border-[#2B3566]">
              <span className="text-[11px] text-slate-400 block">Total Obligations</span>
              <strong className="text-xs text-slate-900 dark:text-white block mt-0.5">
                {formatMoney(capacity?.totalMonthlyObligations || 0)}
              </strong>
              <span className="text-[10px] text-slate-400">Existing + Proposed</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block font-semibold">
                Disposable Income
              </span>
              <strong className="text-xs text-emerald-900 dark:text-emerald-200 block mt-0.5">
                {formatMoney(capacity?.netDisposableIncome || 0)}
              </strong>
              <span className="text-[10px] text-emerald-500">Net cash buffer</span>
            </div>
          </div>

          {/* FOIR, DTI & Policy Verification Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* FOIR Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-white dark:bg-[#1E2445] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Fixed Obligation to Income (FOIR)
                </span>
                <span
                  className={cn(
                    'text-xs font-bold',
                    finEligibility.foir <= finEligibility.maxAllowedFoir ? 'text-emerald-600' : 'text-rose-600'
                  )}
                >
                  {finEligibility.foir}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    finEligibility.foir <= 45
                      ? 'bg-emerald-500'
                      : finEligibility.foir <= 50
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  )}
                  style={{ width: `${Math.min(finEligibility.foir, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Policy Limit: <strong>&le; {finEligibility.maxAllowedFoir}%</strong>
              </p>
            </div>

            {/* DTI Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-white dark:bg-[#1E2445] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Debt-to-Income (DTI)
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{finEligibility.dti}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min(finEligibility.dti, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">Existing debt / monthly verified gross</p>
            </div>

            {/* Bureau Score */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-white dark:bg-[#1E2445] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Credit Bureau Score
                </span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {capacity?.creditScore} ({capacity?.creditRating})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  style={{ width: `${Math.min(((capacity?.creditScore || 600) / 900) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">CIBIL Bureau Gateway (Verified Feed)</p>
            </div>
          </div>

          {/* Explanatory Policy Banner */}
          <div
            className={cn(
              'p-3.5 rounded-xl border flex items-start gap-2.5',
              finEligibility.policyPassed
                ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40'
                : 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/40'
            )}
          >
            {finEligibility.policyPassed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
            )}
            <div>
              <p
                className={cn(
                  'text-xs font-bold',
                  finEligibility.policyPassed ? 'text-emerald-900 dark:text-emerald-300' : 'text-rose-900 dark:text-rose-300'
                )}
              >
                {finEligibility.policyPassed ? 'Financial Eligibility Criteria Passed' : 'Financial Criteria Not Met'}
              </p>
              <p
                className={cn(
                  'text-xs mt-0.5 leading-relaxed',
                  finEligibility.policyPassed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                )}
              >
                {finEligibility.reason}
              </p>
            </div>
          </div>

          {/* Action to confirm and advance */}
          {isCreditAnalyst && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#2B3566]">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                  Adjust Verified Monthly Income:
                </label>
                <div className="w-36">
                  <Input
                    type="number"
                    value={verifiedIncomeInput}
                    onChange={(e) => setVerifiedIncomeInput(e.target.value)}
                  />
                </div>
              </div>

              <Button
                size="sm"
                disabled={evaluateFinancialsMutation.isPending}
                onClick={() => evaluateFinancialsMutation.mutate()}
                className="bg-[#2563EB] hover:bg-blue-700 text-white gap-1.5 font-bold shrink-0"
              >
                {evaluateFinancialsMutation.isPending ? <Spinner size="sm" /> : <Calculator className="h-4 w-4" />}
                <span>Confirm Financial Check & Proceed to Step 5 →</span>
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: CREDIT RISK ASSESSMENT (4-PILLAR MODEL)                            */}
      {/* ========================================================================= */}
      {activeStep === 5 && (
        <Card className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#2B3566]">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#2563EB]" /> Step 5: Institutional 4-Pillar Credit Risk Assessment
              </h4>
              <p className="text-xs text-slate-400">
                Institutional risk scoring model: FOIR 30%, Credit Bureau 25%, Vintage 25%, and Document Completeness 20%.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Assessed Risk Tier:</span>
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold border',
                  riskGradeInput === 'LOW'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                    : riskGradeInput === 'MEDIUM'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                )}
              >
                {riskSummary.score != null ? `${riskSummary.score}/100 ` : ''}({riskGradeInput} RISK)
              </span>
            </div>
          </div>

          {/* 4 Pillars Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Pillar 1 */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#1E2445] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  1. Debt Service / FOIR
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Weight: 30%
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {finEligibility.foir <= 45 ? '90' : '65'}
                </span>
                <span className="text-[10px] text-slate-400">/ 100</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Calculated FOIR is {finEligibility.foir}%. Debt burden is well-structured.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#1E2445] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  2. Credit & Bureau History
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Weight: 25%
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {capacity?.creditScore ? (capacity.creditScore >= 750 ? '90' : '70') : '80'}
                </span>
                <span className="text-[10px] text-slate-400">/ 100</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Score: {capacity?.creditScore} ({capacity?.creditRating}). Clean repayment track record.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#1E2445] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  3. Employment & Vintage
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Weight: 25%
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-slate-900 dark:text-white">85</span>
                <span className="text-[10px] text-slate-400">/ 100</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {capacity?.employmentType || 'Salaried'} vintage verified at {capacity?.employerName || 'Employer'}.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#1E2445] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  4. Document Completeness
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Weight: 20%
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {docSummary.allMandatoryVerified ? '100' : '60'}
                </span>
                <span className="text-[10px] text-slate-400">/ 100</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {docSummary.verifiedCount}/{docSummary.totalMandatory} mandatory compliance documents verified.
              </p>
            </div>
          </div>

          {/* Risk Grade Toggle & Remarks */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/40 dark:bg-[#16203D]/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Assign Institutional Credit Risk Tier:
              </span>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200 dark:bg-[#1E2445] text-xs font-bold">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setRiskGradeInput(grade)}
                    className={cn(
                      'px-3 py-1 rounded-lg transition-all cursor-pointer',
                      riskGradeInput === grade
                        ? grade === 'LOW'
                          ? 'bg-emerald-600 text-white'
                          : grade === 'MEDIUM'
                          ? 'bg-amber-600 text-white'
                          : 'bg-rose-600 text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            <Input
              placeholder="Credit risk synthesis notes, compensating factors, or transaction observations..."
              value={riskRemarks}
              onChange={(e) => setRiskRemarks(e.target.value)}
            />
          </div>

          {/* Advance Action */}
          {isCreditAnalyst && (
            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-[#2B3566]">
              <Button
                size="sm"
                disabled={recordRiskMutation.isPending}
                onClick={() => recordRiskMutation.mutate()}
                className="bg-[#2563EB] hover:bg-blue-700 text-white gap-1.5 font-bold"
              >
                {recordRiskMutation.isPending ? <Spinner size="sm" /> : <ShieldCheck className="h-4 w-4" />}
                <span>Record Risk Assessment & Unlock Step 6: Decision →</span>
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: CREDIT ANALYST DECISION                                           */}
      {/* ========================================================================= */}
      {activeStep === 6 && (
        <Card className="space-y-4 animate-in fade-in border-2 border-[#2563EB]/40 dark:border-[#2563EB]/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#2B3566]">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="h-4 w-4 text-[#2563EB]" /> Step 6: Credit Analyst Assessment Decision
              </h4>
              <p className="text-xs text-slate-400">
                Formulate official recommendation for Underwriting Committee review.
              </p>
            </div>

            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Analyst Authority Only (No Final Approval)
            </span>
          </div>

          {/* Mandatory Rule Notice */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-300 flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            <span>
              <strong>CRITICAL POLICY RULE:</strong> The Credit Analyst does <strong>NOT</strong> issue final loan approval. Your responsibility is KYC verification, document check, financial eligibility, and credit recommendation. Final loan sanction belongs to the Underwriter and Branch Manager.
            </span>
          </div>

          {/* Recommendation Options Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Recommendation:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Option 1: ELIGIBLE */}
              <button
                type="button"
                onClick={() => {
                  setDecision('ELIGIBLE');
                  setDecisionReason(
                    'Applicant satisfies all institutional lending policies, FOIR limits, and document verification. Recommend proposal for Underwriting sanction.'
                  );
                }}
                className={cn(
                  'p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer',
                  decision === 'ELIGIBLE'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-white dark:border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-[#2B3566] hover:border-emerald-300 bg-white dark:bg-[#1E2445]'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full mt-0.5 shrink-0',
                    decision === 'ELIGIBLE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">1. ELIGIBLE — FORWARD TO UNDERWRITER</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Adequate debt-service capacity. Recommend formal sanction to Underwriting committee.
                  </p>
                </div>
              </button>

              {/* Option 2: NOT ELIGIBLE */}
              <button
                type="button"
                onClick={() => {
                  setDecision('NOT_ELIGIBLE');
                  setDecisionReason(
                    'Application fails credit criteria due to excess financial obligations relative to verified income.'
                  );
                }}
                className={cn(
                  'p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer',
                  decision === 'NOT_ELIGIBLE'
                    ? 'border-rose-600 bg-rose-50 text-rose-950 dark:bg-rose-950/50 dark:text-white dark:border-rose-500 shadow-sm ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-[#2B3566] hover:border-rose-300 bg-white dark:bg-[#1E2445]'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full mt-0.5 shrink-0',
                    decision === 'NOT_ELIGIBLE' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'
                  )}
                >
                  <XCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">2. NOT ELIGIBLE</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    FOIR exceeds policy limit or criteria failed. Application does NOT forward to Underwriter.
                  </p>
                </div>
              </button>

              {/* Option 3: FURTHER REVIEW */}
              <button
                type="button"
                onClick={() => {
                  setDecision('FURTHER_REVIEW');
                  setDecisionReason(
                    'Conflicting or borderline profile information requires clarification and supplementary review.'
                  );
                }}
                className={cn(
                  'p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer',
                  decision === 'FURTHER_REVIEW'
                    ? 'border-amber-600 bg-amber-50 text-amber-950 dark:bg-amber-950/50 dark:text-white dark:border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-[#2B3566] hover:border-amber-300 bg-white dark:bg-[#1E2445]'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full mt-0.5 shrink-0',
                    decision === 'FURTHER_REVIEW' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-400'
                  )}
                >
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">3. FURTHER REVIEW</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Send back to Loan Officer for clarification, field inquiry, or borrower correction.
                  </p>
                </div>
              </button>

              {/* Option 4: REQUEST ADDITIONAL DOCUMENTS */}
              <button
                type="button"
                onClick={() => {
                  setDecision('REQUEST_ADDITIONAL_DOCS');
                  setDecisionReason(
                    'Supplementary income or employment proof is mandatory before a final credit decision can be finalized.'
                  );
                }}
                className={cn(
                  'p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer',
                  decision === 'REQUEST_ADDITIONAL_DOCS'
                    ? 'border-purple-600 bg-purple-50 text-purple-950 dark:bg-purple-950/50 dark:text-white dark:border-purple-500 shadow-sm ring-2 ring-purple-500/20'
                    : 'border-slate-200 dark:border-[#2B3566] hover:border-purple-300 bg-white dark:bg-[#1E2445]'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full mt-0.5 shrink-0',
                    decision === 'REQUEST_ADDITIONAL_DOCS' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'
                  )}
                >
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">4. REQUEST ADDITIONAL DOCUMENTS</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Request specific additional documents from borrower prior to sanction.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Input for NOT ELIGIBLE */}
          {decision === 'NOT_ELIGIBLE' && (
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-800/40 space-y-2">
              <label className="text-xs font-bold text-rose-900 dark:text-rose-300">
                Primary Policy Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <select
                value={rejectionReasonPreset}
                onChange={(e) => setRejectionReasonPreset(e.target.value)}
                className="w-full text-xs rounded-xl border p-2 bg-white dark:bg-[#1E2445] text-slate-900 dark:text-white border-slate-200 dark:border-[#2B3566]"
              >
                <option value="FOIR exceeds policy limit">FOIR exceeds policy limit</option>
                <option value="Insufficient verified income">Insufficient verified income</option>
                <option value="Poor credit history">Poor credit history / Bureau DPD</option>
                <option value="Employment criteria not met">Employment / Vintage criteria not met</option>
                <option value="Required document not verified">Required document not verified</option>
                <option value="Other policy criteria failed">Other institutional policy criteria failed</option>
              </select>
            </div>
          )}

          {/* Conditional Inputs for FURTHER REVIEW or REQUEST ADDITIONAL DOCS */}
          {(decision === 'FURTHER_REVIEW' || decision === 'REQUEST_ADDITIONAL_DOCS') && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-800/40 space-y-2.5">
              <div>
                <label className="text-xs font-bold text-amber-900 dark:text-amber-300 block mb-1">
                  Specific Documents or Actions Requested from Loan Officer
                </label>
                <Input
                  placeholder="e.g. Latest 3 months salary slip, Form 16, Bank statement clarification..."
                  value={requestedDocs}
                  onChange={(e) => setRequestedDocs(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Mandatory Decision Remarks Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Credit Assessment Justification & Audit Remarks <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">Mandatory (minimum 10 characters)</span>
            </div>
            <textarea
              rows={3}
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              placeholder="State the detailed financial evaluation rationale, credit findings, and justification for this decision..."
              className={cn(
                'w-full text-xs rounded-xl border p-3 shadow-2xs focus:border-blue-500 focus:outline-none',
                isDark ? 'bg-[#1E2445] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-800'
              )}
            />
          </div>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#2B3566]">
            <p className="text-[11px] text-slate-400">
              {decision === 'ELIGIBLE'
                ? 'On submission, application will transition to UNDERWRITING and appear in Underwriter queue.'
                : decision === 'NOT_ELIGIBLE'
                ? 'On submission, application will be marked NOT ELIGIBLE without forwarding to Underwriting.'
                : 'Application will be sent back to Loan Officer for required document resubmission.'}
            </p>

            <Button
              disabled={
                submitDecisionMutation.isPending || !decisionReason.trim() || decisionReason.trim().length < 10
              }
              onClick={() => submitDecisionMutation.mutate()}
              className={cn(
                'gap-2 font-bold text-white shadow-sm cursor-pointer shrink-0',
                decision === 'ELIGIBLE'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : decision === 'NOT_ELIGIBLE'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              )}
            >
              {submitDecisionMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  <span>Submitting Decision...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>
                    Submit [
                    {decision === 'ELIGIBLE'
                      ? 'ELIGIBLE — FORWARD TO UNDERWRITER'
                      : decision === 'NOT_ELIGIBLE'
                      ? 'NOT ELIGIBLE'
                      : 'FURTHER REVIEW'}
                    ]
                  </span>
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 7: FORWARD TO UNDERWRITER (COMPLETED STATE & AUDIT LEDGER)            */}
      {/* ========================================================================= */}
      {activeStep === 7 && (
        <Card className="space-y-4 animate-in fade-in border-2 border-emerald-500/30 dark:border-emerald-500/40">
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 7 Complete: Forwarded to Underwriting & Credit Audit Recorded
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                The credit assessment workflow for proposal #{applicationNo} has been completed successfully.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Application status has moved to <strong>UNDERWRITING</strong>. It has been transferred from your pending queue into the Underwriter and Branch Manager sanction queue.
              </p>
            </div>
          </div>

          {/* Audit Ledger Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-100 dark:border-[#2B3566]">
              <span className="text-slate-400 block text-[11px]">KYC Verification</span>
              <strong className="text-emerald-600 dark:text-emerald-400 block mt-0.5">✓ KYC VERIFIED</strong>
              <span className="text-[10px] text-slate-400">Identity & Address verified</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-100 dark:border-[#2B3566]">
              <span className="text-slate-400 block text-[11px]">Document Verification</span>
              <strong className="text-emerald-600 dark:text-emerald-400 block mt-0.5">✓ 5/5 VERIFIED</strong>
              <span className="text-[10px] text-slate-400">All mandatory documents verified</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-100 dark:border-[#2B3566]">
              <span className="text-slate-400 block text-[11px]">Financial Capacity</span>
              <strong className="text-emerald-600 dark:text-emerald-400 block mt-0.5">
                FOIR: {finEligibility.foir}%
              </strong>
              <span className="text-[10px] text-slate-400">
                Disposable: {formatMoney(finEligibility.netDisposableIncome)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-100 dark:border-[#2B3566]">
              <span className="text-slate-400 block text-[11px]">Credit Risk Tier</span>
              <strong className="text-[#2563EB] dark:text-[#60A5FA] block mt-0.5">
                {riskSummary.score != null ? `${riskSummary.score}/100 ` : ''}({riskGradeInput})
              </strong>
              <span className="text-[10px] text-slate-400">Bureau Score: {capacity?.creditScore}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#16203D] text-xs">
            <span className="text-slate-400 block text-[11px] font-semibold">Credit Analyst Remarks Recorded:</span>
            <p className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
              {previousDecision?.reason || decisionReason}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#2B3566]">
            <Link href="/credit-assessment">
              <Button size="sm" variant="secondary" className="text-xs">
                ← Back to Credit Assessment Desk
              </Button>
            </Link>
            <Link href="/underwriting">
              <Button size="sm" className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs">
                View Underwriting Queue →
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function PlayIcon(props: any) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
    </svg>
  );
}
