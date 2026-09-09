'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Calculator,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Send,
  Building,
  User,
  ArrowRight,
  RotateCcw,
  X,
  FileCheck,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, KpiCard, Spinner, Button, Input } from '@/components/ui';
import { DetailPageSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { CreditIntelligenceCard } from '@/components/CreditIntelligenceCard';
import { UnderwritingIntelligenceCard } from '@/components/UnderwritingIntelligenceCard';
import { FraudIntelligenceCard } from '@/components/FraudIntelligenceCard';
import { BankStatementIntelligenceCard } from '@/components/BankStatementIntelligenceCard';
import { AdvancedDecisionIntelligenceCard } from '@/components/AdvancedDecisionIntelligenceCard';
import { EarlyWarningWidget } from '@/components/EarlyWarningWidget';
import { DecisionSimulatorCard } from '@/components/DecisionSimulatorCard';
import { UnderwritingVerificationWizard } from '@/components/UnderwritingVerificationWizard';
import { CreditAssessmentSection } from '@/components/CreditAssessmentSection';
import { BranchManagerReviewSection } from '@/components/BranchManagerReviewSection';

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [uwWizardOpen, setUwWizardOpen] = useState(false);

  // Modals state
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decision, setDecision] = useState<'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'SEND_BACK' | 'REJECT'>('APPROVE');
  const [reason, setReason] = useState('');
  const [conditions, setConditions] = useState('');

  // Credit Analyst Action Modals
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardReason, setForwardReason] = useState('Credit assessment verified & recommended for underwriting sanction');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // KYC Verification Modal State (Credit Analyst / Underwriter / Staff)
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycStatusInput, setKycStatusInput] = useState('VERIFIED');
  const [riskCategoryInput, setRiskCategoryInput] = useState('LOW');
  const [kycRemarks, setKycRemarks] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['application', params.id],
    queryFn: async () => (await api.get(`/applications/${params.id}`)).data.data,
  });

  // Borrower KYC Update Mutation
  const kycUpdateMutation = useMutation({
    mutationFn: async () => {
      const custId = data?.customerId || data?.customer?.id;
      if (!custId) throw new Error('Customer ID not found for KYC update');
      return api.patch(`/customers/${custId}/kyc`, {
        kycStatus: kycStatusInput,
        riskCategory: riskCategoryInput,
        remarks: kycRemarks || undefined,
      });
    },
    onSuccess: () => {
      toast.success(`Borrower KYC compliance status updated to ${kycStatusInput}.`);
      queryClient.invalidateQueries({ queryKey: ['application', params.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['customer', data?.customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setKycModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'KYC Update Notice' });
    },
  });

  // Evaluate Eligibility
  const eligibilityMutation = useMutation({
    mutationFn: async () => api.post(`/eligibility/evaluate/${params.id}`),
    onSuccess: () => {
      toast.success('Eligibility check evaluated successfully.');
      queryClient.invalidateQueries({ queryKey: ['application', params.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Eligibility Check Notice' });
    },
  });

  // Evaluate Risk
  const riskMutation = useMutation({
    mutationFn: async () => api.post(`/risk/evaluate/${params.id}`),
    onSuccess: () => {
      toast.success('4-Pillar Risk Engine evaluated successfully.');
      queryClient.invalidateQueries({ queryKey: ['application', params.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Risk Evaluation Notice' });
    },
  });

  // Forward to Underwriting Mutation
  const forwardMutation = useMutation({
    mutationFn: async () =>
      api.post(`/applications/${params.id}/transition`, {
        toStatus: 'UNDERWRITING',
        reason: forwardReason.trim() || 'Forwarded to Underwriting by Credit Analyst',
      }),
    onSuccess: () => {
      toast.success('Application forwarded to Underwriting queue.');
      queryClient.invalidateQueries({ queryKey: ['application', params.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-underwriting-queue'] });
      setForwardModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Forward Transition Notice' });
    },
  });

  // Direct Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: async () =>
      api.post(`/applications/${params.id}/transition`, {
        toStatus: 'REJECTED',
        reason: rejectReason.trim() || 'Application rejected by Credit Analyst',
      }),
    onSuccess: () => {
      toast.warning('Application marked as REJECTED.');
      queryClient.invalidateQueries({ queryKey: ['application', params.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-underwriting-queue'] });
      setRejectModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Reject Transition Notice' });
    },
  });

  // Submit Final Underwriting Decision (Approve/Reject/Send Back)
  const decisionMutation = useMutation({
    mutationFn: async () =>
      api.post(`/underwriting/${params.id}/decision`, {
        decision,
        reason,
        conditions: conditions || undefined,
      }),
    onSuccess: () => {
      toast.success(`Underwriting decision '${decision}' recorded successfully.`);
      queryClient.invalidateQueries({ queryKey: ['application', params.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['disbursements-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-disbursements-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      setDecisionModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Underwriting Decision Notice' });
    },
  });

  if (isLoading) return <DetailPageSkeleton />;
  if (isError || !data) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-slate-700 font-semibold">Application record not found or could not be loaded.</p>
        <p className="text-xs text-slate-400">{error ? apiErrorMessage(error) : 'Check application ID or permissions'}</p>
        <Link href="/applications">
          <Button size="sm" variant="secondary">Back to Applications Queue</Button>
        </Link>
      </div>
    );
  }

  const customer = data.customer || {};
  const product = data.product || {};
  const eligibility = data.eligibility;
  const riskAssessment = data.riskAssessment;

  const isLoanOfficer = Boolean(user?.roles?.includes('LOAN_OFFICER'));
  const isBranchManager = Boolean(user?.roles?.includes('BRANCH_MANAGER'));
  const isCreditAnalyst = Boolean(user?.roles?.includes('CREDIT_ANALYST'));
  const isUnderwriter = Boolean(user?.roles?.includes('UNDERWRITER'));
  const isAdmin = Boolean(user?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN'].includes(r)));

  const isBranchManagerOnly = isBranchManager && !isCreditAnalyst && !isUnderwriter && !isAdmin;

  const isStaff = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'LOAN_OFFICER'].includes(r)
  );

  const canLoanOfficerSubmit =
    isLoanOfficer &&
    !isBranchManagerOnly &&
    ['DRAFT', 'KYC_PENDING', 'KYC_VERIFIED'].includes(data.status);

  const canAssessCredit = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST'].includes(r)
  );

  const canForwardToUnderwriting =
    isCreditAnalyst &&
    !isBranchManagerOnly &&
    ['DRAFT', 'SUBMITTED', 'KYC_VERIFIED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT'].includes(data.status);

  const canReject =
    (isUnderwriter || isAdmin) &&
    !isBranchManagerOnly &&
    ['DRAFT', 'SUBMITTED', 'KYC_PENDING', 'KYC_VERIFIED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING'].includes(data.status);

  const canMakeUnderwritingDecision =
    (user?.roles?.some((r: string) => ['UNDERWRITER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r))) &&
    !isBranchManagerOnly &&
    ['UNDERWRITING', 'CREDIT_ASSESSMENT', 'UNDER_REVIEW'].includes(data.status);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        breadcrumb="Lending / Applications / Review"
        title={`Application #${data.applicationNo || 'N/A'}`}
        subtitle={`Submitted on ${data.createdAt ? formatDate(data.createdAt) : 'N/A'} · Loan Product: ${product.name || 'General Loan'}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge status={data.status} />

            {/* 0. Submit to Credit Analyst Button (Loan Officer) */}
            {canLoanOfficerSubmit && (
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await api.post(`/applications/${data.id}/transition`, {
                      toStatus: 'SUBMITTED',
                      reason: 'Originated and submitted by Loan Officer for Credit Analyst review.',
                    });
                    toast.success('Application submitted to Credit Analyst queue.');
                    queryClient.invalidateQueries({ queryKey: ['application', params.id] });
                    queryClient.invalidateQueries({ queryKey: ['applications'] });
                  } catch (err: any) {
                    toast.error(apiErrorMessage(err));
                  }
                }}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Submit to Credit Analyst
              </Button>
            )}

            {/* 1. Forward to Underwriting Button (Credit Analyst / Staff) */}
            {canForwardToUnderwriting && (
              <Button
                size="sm"
                onClick={() => setForwardModalOpen(true)}
                className="gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Forward to Underwriting
              </Button>
            )}

            {/* 2. Direct Underwriter Decision Actions (Step-by-Step Verification & Decision) */}
            {canMakeUnderwritingDecision && (
              <>
                <Button
                  size="sm"
                  onClick={() => setUwWizardOpen(true)}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Step-by-Step Verification Desk →
                </Button>

                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => {
                    setDecision('REJECT');
                    setReason('');
                    setConditions('');
                    setDecisionModalOpen(true);
                  }}
                  className="gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  Reject Loan
                </Button>
              </>
            )}

            {/* 3. If already Approved/Rejected, allow Underwriter to Modify */}
            {['APPROVED', 'REJECTED'].includes(data.status) && canMakeUnderwritingDecision && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setDecision(data.status === 'APPROVED' ? 'APPROVE' : 'REJECT');
                  setReason(data.underwriting?.reason || '');
                  setConditions('');
                  setDecisionModalOpen(true);
                }}
                className="gap-1.5 text-xs cursor-pointer flex items-center"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                Modify Decision
              </Button>
            )}

            {/* 4. Proceed to Payout (Finance Officer / Admin ONLY — NEVER Branch Manager) */}
            {user?.roles?.some((r: string) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER'].includes(r)) &&
              !user?.roles?.includes('BRANCH_MANAGER') &&
              data.status === 'APPROVED' && (
                <Link href="/disbursements">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                    Proceed to Payout →
                  </Button>
                </Link>
              )}
          </div>
        }
      />

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Requested Sanction"
          value={formatMoney(data.requestedAmount || 0)}
          hint={`${data.tenureMonths || 0} Months tenure`}
          icon={<Calculator className="h-4 w-4" />}
        />
        <KpiCard
          label="Borrower"
          value={`${customer.firstName || 'Borrower'} ${customer.lastName || ''}`}
          hint={`ID: ${customer.customerCode || 'N/A'}`}
          icon={<User className="h-4 w-4" />}
        />
        {canAssessCredit || isBranchManager ? (
          <>
            <KpiCard
              label="Eligibility Assessment"
              value={eligibility?.result || 'NOT ASSESSED'}
              hint={eligibility ? 'Policy criteria evaluated' : 'Pending engine run'}
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            />
            <KpiCard
              label="Credit Risk Score"
              value={riskAssessment ? `${riskAssessment.score}/100` : 'PENDING'}
              hint={riskAssessment?.category ? `${riskAssessment.category} Risk` : 'Awaiting credit scoring'}
              icon={<ShieldCheck className="h-4 w-4 text-brand-700" />}
            />
          </>
        ) : (
          <>
            <KpiCard
              label="Application Status"
              value={data.status || 'DRAFT'}
              hint="Workflow status"
              icon={<Clock className="h-4 w-4 text-brand-500" />}
            />
            <KpiCard
              label="Loan Product"
              value={product.name || 'General Loan'}
              hint={`${product.interestRate || '14.5'}% p.a. • ${product.interestMethod || 'REDUCING'}`}
              icon={<Building className="h-4 w-4 text-emerald-600" />}
            />
          </>
        )}
      </div>

      {isBranchManagerOnly ? (
        <div className="space-y-6">
          {/* Top Row: Borrower Profile & Loan Product Terms (Side-by-side) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Borrower Profile Card (Read-Only for Branch Manager) */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Borrower Profile</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1E2445] text-slate-500">
                  READ-ONLY INSPECTION
                </span>
              </div>
              <dl className="divide-y divide-slate-100 text-xs dark:divide-[#2B3566]">
                <Row label="Customer ID" value={<span className="font-mono font-bold text-blue-600">{customer.customerCode}</span>} />
                <Row label="Borrower Name" value={`${customer.firstName || ''} ${customer.lastName || ''}`} />
                <Row label="Mobile" value={customer.mobile} />
                <Row label="Email" value={customer.email || '-'} />
                <Row label="Monthly Income" value={customer.monthlyIncome ? formatMoney(customer.monthlyIncome) : '-'} />
                <Row label="Existing Debt" value={customer.existingObligations ? formatMoney(customer.existingObligations) : '₹0.00'} />
                <Row label="KYC Status" value={<Badge status={customer.kycStatus || 'NOT_STARTED'} />} />
                <Row label="Risk Category" value={<Badge status={customer.riskCategory || 'PENDING'} />} />
              </dl>
              <div className="pt-2">
                <Link href={`/customers/${customer.id}`}>
                  <Button size="sm" variant="ghost" className="w-full text-xs">View Customer 360 →</Button>
                </Link>
              </div>
            </Card>

            {/* Loan Product Terms Card */}
            <Card className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Loan Product Terms</h3>
              <dl className="divide-y divide-slate-100 text-xs dark:divide-[#2B3566]">
                <Row label="Product Name" value={product.name || 'General Loan'} />
                <Row label="Product Code" value={<span className="font-mono">{product.code || '-'}</span>} />
                <Row label="Interest Rate" value={`${product.interestRate || '14.5'}% p.a.`} />
                <Row label="Tenure Boundaries" value={`${product.minTenureMonths || 6} - ${product.maxTenureMonths || 60} mos`} />
                <Row label="Method" value={product.interestMethod || 'REDUCING'} />
                <Row label="Processing Fee" value={`${product.processingFeePct || 0}%`} />
                <Row label="Purpose" value={data.purpose || 'General Financing'} />
              </dl>
            </Card>
          </div>

          {/* Branch Manager Review Cockpit */}
          <BranchManagerReviewSection
            applicationId={params.id}
            applicationNo={data.applicationNo}
            requestedAmount={Number(data.requestedAmount || 0)}
            currentStatus={data.status}
            customer={customer}
            product={product}
            eligibility={eligibility}
            riskAssessment={riskAssessment}
            approvals={data.approvals || []}
            documents={data.documents || customer?.documents || []}
            onDecisionSubmitted={() => {
              queryClient.invalidateQueries({ queryKey: ['application', params.id] });
              queryClient.invalidateQueries({ queryKey: ['applications'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
              queryClient.invalidateQueries({ queryKey: ['branch-manager-queue'] });
            }}
          />

          {/* Lifecycle Audit Trail */}
          <Card className="space-y-3">
            <h3 className="text-sm font-bold">Lifecycle Audit Trail</h3>
            <div className="divide-y divide-slate-100 text-xs dark:divide-[#2B3566]">
              {Array.isArray(data.statusHistory) && data.statusHistory.length > 0 ? (
                data.statusHistory.map((h: any) => (
                  <div key={h.id} className="py-2.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge status={h.toStatus} />
                        <span className="text-slate-400">by {h.changedBy || 'System Engine'}</span>
                      </div>
                      {h.reason && <p className="text-slate-600 dark:text-slate-300 italic">{h.reason}</p>}
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {h.createdAt ? formatDate(h.createdAt) : ''}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 py-3 text-center text-xs">No status change history recorded.</p>
              )}
            </div>
          </Card>
        </div>
      ) : canAssessCredit ? (
        <div className="space-y-6">
          {/* Top Row: Borrower Profile & Loan Product Terms (Side-by-side) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Borrower Profile Card */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Borrower Profile</h3>
                <button
                  onClick={() => {
                    setKycStatusInput(customer.kycStatus || 'VERIFIED');
                    setRiskCategoryInput(customer.riskCategory || 'LOW');
                    setKycRemarks('');
                    setKycModalOpen(true);
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Update KYC
                </button>
              </div>
              <dl className="divide-y divide-slate-100 text-xs dark:divide-[#2B3566]">
                <Row label="Customer ID" value={<span className="font-mono font-bold text-blue-600">{customer.customerCode}</span>} />
                <Row label="Mobile" value={customer.mobile} />
                <Row label="Email" value={customer.email || '-'} />
                <Row label="Monthly Income" value={customer.monthlyIncome ? formatMoney(customer.monthlyIncome) : '-'} />
                <Row label="Existing Debt" value={customer.existingObligations ? formatMoney(customer.existingObligations) : '₹0.00'} />
                <Row label="KYC Status" value={<Badge status={customer.kycStatus || 'NOT_STARTED'} />} />
                <Row label="Risk Category" value={<Badge status={customer.riskCategory || 'PENDING'} />} />
              </dl>
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setKycStatusInput(customer.kycStatus || 'VERIFIED');
                    setRiskCategoryInput(customer.riskCategory || 'LOW');
                    setKycRemarks('');
                    setKycModalOpen(true);
                  }}
                  className="flex-1 text-xs gap-1.5 cursor-pointer text-blue-600 dark:text-blue-400 font-semibold"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Verify / Update KYC
                </Button>
                <Link href={`/customers/${customer.id}`} className="flex-1">
                  <Button size="sm" variant="ghost" className="w-full text-xs">View Customer 360 →</Button>
                </Link>
              </div>
            </Card>

            {/* Loan Product Terms Card */}
            <Card className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Loan Product Terms</h3>
              <dl className="divide-y divide-slate-100 text-xs dark:divide-[#2B3566]">
                <Row label="Product Name" value={product.name || 'General Loan'} />
                <Row label="Product Code" value={<span className="font-mono">{product.code || '-'}</span>} />
                <Row label="Interest Rate" value={`${product.interestRate || '14.5'}% p.a.`} />
                <Row label="Tenure Boundaries" value={`${product.minTenureMonths || 6} - ${product.maxTenureMonths || 60} mos`} />
                <Row label="Method" value={product.interestMethod || 'REDUCING'} />
                <Row label="Processing Fee" value={`${product.processingFeePct || 0}%`} />
                <Row label="Purpose" value={data.purpose || 'General Financing'} />
              </dl>
            </Card>
          </div>

          {/* Branch Manager Review & First-Level Approval Cockpit */}
          {(isBranchManager || isAdmin) && (
            <BranchManagerReviewSection
              applicationId={params.id}
              applicationNo={data.applicationNo}
              requestedAmount={Number(data.requestedAmount || 0)}
              currentStatus={data.status}
              customer={customer}
              product={product}
              eligibility={eligibility}
              riskAssessment={riskAssessment}
              approvals={data.approvals || []}
              documents={data.documents || customer?.documents || []}
              onDecisionSubmitted={() => {
                queryClient.invalidateQueries({ queryKey: ['application', params.id] });
                queryClient.invalidateQueries({ queryKey: ['applications'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
                queryClient.invalidateQueries({ queryKey: ['branch-manager-queue'] });
              }}
            />
          )}

          {/* Credit Analyst Repayment Capacity & Assessment Cockpit */}
          <CreditAssessmentSection
            applicationId={params.id}
            applicationNo={data.applicationNo}
            currentStatus={data.status}
            customer={customer}
            product={product}
            isCreditAnalyst={isCreditAnalyst || isAdmin}
            onDecisionSubmitted={() => {
              queryClient.invalidateQueries({ queryKey: ['application', params.id] });
              queryClient.invalidateQueries({ queryKey: ['applications'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
              queryClient.invalidateQueries({ queryKey: ['branch-manager-queue'] });
            }}
          />

          {/* Active Early Warning Surveillance Banner (Full Width) */}
          <EarlyWarningWidget applicationId={params.id} customerId={data?.customerId} />

          {/* Advanced Decision Intelligence Cockpit (Full Width) */}
          <AdvancedDecisionIntelligenceCard applicationId={params.id} applicationNo={data.applicationNo} />

          {/* Balanced 2-Column Grid for Credit & Underwriting Intelligence Engines */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
            {/* Left Column: Credit Intelligence, Eligibility Rule Engine & Simulator */}
            <div className="space-y-6">
              {/* AI Credit Intelligence & Decision Support Card */}
              <CreditIntelligenceCard applicationId={params.id} applicationNo={data.applicationNo} />

              {/* 1. Rule-Based Eligibility Engine Card */}
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">Rule-Based Eligibility Engine</h3>
                    <p className="text-xs text-slate-400">Automated policy checks: Age, DTI, Income threshold, and Bureau history</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={eligibilityMutation.isPending}
                    onClick={() => eligibilityMutation.mutate()}
                    className="cursor-pointer text-xs"
                  >
                    {eligibilityMutation.isPending ? 'Evaluating...' : eligibility ? 'Re-Run Eligibility' : 'Run Eligibility Check'}
                  </Button>
                </div>

                {eligibility ? (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">ENGINE RESULT:</span>
                      <Badge status={eligibility.result} />
                    </div>

                    <div className="space-y-2">
                      {Array.isArray(eligibility.factors) &&
                        eligibility.factors.map((f: any, idx: number) => (
                          <div
                            key={idx}
                            className={cn(
                              'flex items-start gap-3 rounded-xl border p-3 text-xs',
                              f.status === 'PASS'
                                ? 'border-emerald-200 bg-emerald-50/50 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300'
                                : f.status === 'WARNING'
                                ? 'border-amber-200 bg-amber-50/50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300'
                                : 'border-rose-200 bg-rose-50/50 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300'
                            )}
                          >
                            {f.status === 'PASS' && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />}
                            {f.status === 'WARNING' && <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />}
                            {f.status === 'FAIL' && <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />}
                            <div>
                              <p className="font-bold">{f.factor}</p>
                              <p className="text-slate-600 dark:text-slate-300 mt-0.5">{f.detail}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 dark:border-[#2B3566]">
                    Click &quot;Run Eligibility Check&quot; to execute automated policy criteria against borrower attributes.
                  </div>
                )}
              </Card>

              {/* Decision Simulator & What-If Credit Modeler */}
              {product && (
                <DecisionSimulatorCard
                  applicationId={params.id}
                  applicationNo={data.applicationNo}
                  baseAmount={Number(data.requestedAmount)}
                  baseTenure={data.tenureMonths}
                  baseRate={Number(product.interestRate)}
                  baseIncome={Number(data.customer?.monthlyIncome || 0)}
                  baseObligations={Number(data.customer?.existingObligations || 0)}
                />
              )}

              {/* AI Bank Statement Intelligence Card */}
              {data?.customerId && (
                <BankStatementIntelligenceCard customerId={data.customerId} applicationId={params.id} />
              )}
            </div>

            {/* Right Column: Underwriting Briefing, 4-Pillar Scoring, Fraud Intelligence & Audit Trail */}
            <div className="space-y-6">
              {/* AI Underwriting Decision Support Briefing */}
              <UnderwritingIntelligenceCard applicationId={params.id} applicationNo={data.applicationNo} />

              {/* 2. 4-Pillar Credit Risk Scoring Engine */}
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">4-Pillar Credit Risk Scoring Model</h3>
                    <p className="text-xs text-slate-400">Vintage (25%), DTI Capacity (30%), Document KYC (20%), and Bureau Performance (25%)</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={riskMutation.isPending}
                    onClick={() => riskMutation.mutate()}
                    className="cursor-pointer text-xs"
                  >
                    {riskMutation.isPending ? 'Calculating...' : riskAssessment ? 'Re-Score Risk' : 'Calculate Risk Score'}
                  </Button>
                </div>

                {riskAssessment ? (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-[#2563EB]">{riskAssessment.score}</span>
                        <span className="text-xs font-semibold text-slate-400">/ 100</span>
                      </div>
                      <Badge status={riskAssessment.category} />
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {Array.isArray(riskAssessment.factors) &&
                        riskAssessment.factors.map((rf: any, idx: number) => (
                          <div key={idx} className="rounded-xl border border-slate-100 p-3 text-xs dark:border-[#2B3566] dark:bg-[#1E2445]/50">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-700 dark:text-slate-200">{rf.name}</span>
                              <span className="font-mono font-bold text-blue-600">{rf.score} pts</span>
                            </div>
                            <p className="text-[11px] text-slate-400">{rf.remarks}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 dark:border-[#2B3566]">
                    Click &quot;Calculate Risk Score&quot; to generate automated score and risk tier categorization.
                  </div>
                )}
              </Card>

              {/* AI Fraud & Anomaly Intelligence Card */}
              <FraudIntelligenceCard applicationId={params.id} applicationNo={data.applicationNo} />

              {/* 3. Status History Inspection Trail */}
              <Card className="space-y-3">
                <h3 className="text-sm font-bold">Lifecycle Audit Trail</h3>
                <div className="divide-y divide-slate-100 text-xs dark:divide-[#2B3566]">
                  {Array.isArray(data.statusHistory) && data.statusHistory.length > 0 ? (
                    data.statusHistory.map((h: any) => (
                      <div key={h.id} className="py-2.5 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Badge status={h.toStatus} />
                            <span className="text-slate-400">by {h.changedBy || 'System Engine'}</span>
                          </div>
                          {h.reason && <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">{h.reason}</p>}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{formatDate(h.createdAt)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-2">No lifecycle events recorded yet.</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* Proposal Intake Overview & Origination Layout for Loan Officers */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
          {/* Left Column: Borrower Profile & Loan Product Terms */}
          <div className="space-y-6">
            <Card className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Borrower Profile</h3>
              <dl className="divide-y divide-slate-100 text-xs dark:divide-[#2B3566]">
                <Row label="Customer ID" value={<span className="font-mono font-bold text-blue-600">{customer.customerCode}</span>} />
                <Row label="Mobile" value={customer.mobile} />
                <Row label="Email" value={customer.email || '-'} />
                <Row label="Monthly Income" value={customer.monthlyIncome ? formatMoney(customer.monthlyIncome) : '-'} />
                <Row label="Existing Debt" value={customer.existingObligations ? formatMoney(customer.existingObligations) : '₹0.00'} />
                <Row label="KYC Status" value={<Badge status={customer.kycStatus || 'NOT_STARTED'} />} />
                <Row label="Risk Category" value={<Badge status={customer.riskCategory || 'PENDING'} />} />
              </dl>
              <div className="pt-2">
                <Link href={`/customers/${customer.id}`}>
                  <Button size="sm" variant="ghost" className="w-full text-xs">View Customer 360 →</Button>
                </Link>
              </div>
            </Card>

            <Card className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Loan Product Terms</h3>
              <dl className="divide-y divide-slate-100 text-xs dark:divide-[#2B3566]">
                <Row label="Product Name" value={product.name || 'General Loan'} />
                <Row label="Product Code" value={<span className="font-mono">{product.code || '-'}</span>} />
                <Row label="Interest Rate" value={`${product.interestRate || '14.5'}% p.a.`} />
                <Row label="Tenure Boundaries" value={`${product.minTenureMonths || 6} - ${product.maxTenureMonths || 60} mos`} />
                <Row label="Method" value={product.interestMethod || 'REDUCING'} />
                <Row label="Processing Fee" value={`${product.processingFeePct || 0}%`} />
              </dl>
            </Card>
          </div>

          {/* Right Column: Proposal Intake Summary & Lifecycle Audit Trail */}
          <div className="space-y-6">
            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-[#2B3566]">
                <div>
                  <h3 className="text-sm font-bold">Proposal Intake Overview</h3>
                  <p className="text-xs text-slate-400">Origination submission details and branch processing notes</p>
                </div>
                <Badge status={data.status} />
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs divide-y sm:divide-y-0 divide-slate-100 dark:divide-[#2B3566]">
                <Row label="Application No" value={<span className="font-mono font-bold text-blue-600">{data.applicationNo}</span>} />
                <Row label="Submitted Date" value={data.createdAt ? formatDate(data.createdAt) : '-'} />
                <Row label="Requested Amount" value={<span className="font-bold text-emerald-600">{formatMoney(data.requestedAmount || 0)}</span>} />
                <Row label="Requested Tenure" value={`${data.tenureMonths || '-'} Months`} />
                <Row label="Branch" value={data.branch?.name || customer.branch?.name || 'Main Branch'} />
                <Row label="Purpose" value={data.purpose || 'General Financing'} />
              </dl>

              {canForwardToUnderwriting && (
                <div className="mt-4 rounded-xl bg-blue-50/60 dark:bg-[#1E2445] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-blue-100 dark:border-blue-900/30">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Ready for Credit Underwriting?</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Forward this proposal to the Underwriting desk for policy evaluation and risk assessment.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setForwardModalOpen(true)}
                    className="gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shrink-0 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Forward to Underwriting
                  </Button>
                </div>
              )}
            </Card>

            <Card className="space-y-3">
              <h3 className="text-sm font-bold">Lifecycle Audit Trail</h3>
              <div className="divide-y divide-slate-100 text-xs dark:divide-[#2B3566]">
                {Array.isArray(data.statusHistory) && data.statusHistory.length > 0 ? (
                  data.statusHistory.map((h: any) => (
                    <div key={h.id} className="py-2.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge status={h.toStatus} />
                          <span className="text-slate-400">by {h.changedBy || 'System Engine'}</span>
                        </div>
                        {h.reason && <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">{h.reason}</p>}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">{formatDate(h.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-2">No lifecycle events recorded yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* MODAL 1: FORWARD TO UNDERWRITING MODAL */}
      {forwardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border shadow-2xl p-6 relative transition-all',
              isDark ? 'bg-[#171B36] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B3566]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Forward to Underwriting</h3>
                  <p className="text-xs text-slate-400">Submit application to Underwriting Queue</p>
                </div>
              </div>
              <button
                onClick={() => setForwardModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-[#1E2445] text-xs space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Application: <span className="font-mono text-blue-600 font-bold">{data.applicationNo}</span>
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Borrower: {customer.firstName} {customer.lastName} ({formatMoney(data.requestedAmount)})
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Credit Analyst Assessment Note / Recommendation *
                </label>
                <textarea
                  rows={3}
                  value={forwardReason}
                  onChange={(e) => setForwardReason(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border p-3 text-xs focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-white' : 'border-slate-300 bg-white text-slate-900'
                  )}
                  placeholder="Enter notes for Underwriter..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#2B3566]">
                <Button variant="ghost" onClick={() => setForwardModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!forwardReason.trim() || forwardMutation.isPending}
                  onClick={() => forwardMutation.mutate()}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {forwardMutation.isPending ? 'Submitting...' : 'Confirm & Forward'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT APPLICATION MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border shadow-2xl p-6 relative transition-all',
              isDark ? 'bg-[#171B36] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B3566]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Reject Loan Application</h3>
                  <p className="text-xs text-slate-400">Record formal decline rationale</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 text-xs text-rose-700 dark:text-rose-300">
                This action will mark Application <span className="font-bold font-mono">{data.applicationNo}</span> as REJECTED and notify the borrower.
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Rejection Reason / Decline Rationale *
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border p-3 text-xs focus:border-rose-500 focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-white' : 'border-slate-300 bg-white text-slate-900'
                  )}
                  placeholder="e.g. Inadequate debt service capacity (DTI > 55%), KYC discrepancy..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#2B3566]">
                <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  disabled={!rejectReason.trim() || rejectMutation.isPending}
                  onClick={() => rejectMutation.mutate()}
                  className="font-semibold gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: UNDERWRITING SANCTION DECISION MODAL */}
      {decisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-lg rounded-2xl border shadow-2xl p-6 relative transition-all',
              isDark ? 'bg-[#171B36] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B3566]">
              <div>
                <h3 className="font-bold text-base">Underwriting Decision Desk</h3>
                <p className="text-xs text-slate-400">Record final credit sanction or rejection</p>
              </div>
              <button
                onClick={() => setDecisionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Decision Outcome *
                </label>
                <select
                  className={cn(
                    'h-9 w-full rounded-xl border px-3 text-sm shadow-sm transition-colors focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                  )}
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as any)}
                >
                  <option value="APPROVE">APPROVE (Sanction Loan)</option>
                  <option value="APPROVE_WITH_CONDITIONS">APPROVE WITH CONDITIONS</option>
                  <option value="SEND_BACK">SEND BACK (Request Documents / Info)</option>
                  <option value="REJECT">REJECT (Decline Application)</option>
                </select>
              </div>

              {decision === 'APPROVE_WITH_CONDITIONS' && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Conditions Required
                  </label>
                  <Input
                    placeholder="e.g. Requires co-applicant guarantee, PDC cheques"
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Rationale / Remarks *
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed credit assessment remarks..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border p-3 text-xs focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-white' : 'border-slate-300 bg-white text-slate-900'
                  )}
                  required
                />
              </div>

              {decisionMutation.isError && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 text-xs">
                  {apiErrorMessage(decisionMutation.error)}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#2B3566]">
                <Button variant="ghost" onClick={() => setDecisionModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!reason.trim() || decisionMutation.isPending}
                  onClick={() => decisionMutation.mutate()}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold"
                >
                  {decisionMutation.isPending ? 'Recording...' : 'Commit Decision'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Underwriter Step-by-Step Verification Wizard */}
      {(isUnderwriter || isAdmin) && (
        <UnderwritingVerificationWizard
          application={data}
          isOpen={uwWizardOpen}
          onClose={() => setUwWizardOpen(false)}
        />
      )}

      {/* MODAL 4: KYC VERIFICATION & COMPLIANCE MODAL */}
      {kycModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border shadow-2xl p-6 relative transition-all',
              isDark ? 'bg-[#171B36] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B3566]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Update KYC Compliance</h3>
                  <p className="text-xs text-slate-400">Set identity verification state & risk tier</p>
                </div>
              </div>
              <button
                onClick={() => setKycModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-[#1E2445] text-xs space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Borrower: <span className="font-bold">{customer.firstName} {customer.lastName}</span>
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Customer ID: <span className="font-mono font-bold text-blue-600">{customer.customerCode}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  KYC Verification Status *
                </label>
                <select
                  value={kycStatusInput}
                  onChange={(e) => setKycStatusInput(e.target.value)}
                  className={cn(
                    'h-9 w-full rounded-xl border px-3 text-sm shadow-sm transition-colors focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                  )}
                >
                  <option value="VERIFIED">VERIFIED (Identity & Address Authenticated)</option>
                  <option value="PENDING">PENDING (Awaiting Review)</option>
                  <option value="SUBMITTED">SUBMITTED (Documents Uploaded)</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW (In Process)</option>
                  <option value="REJECTED">REJECTED (Declined / Invalid)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Risk Category Tier
                </label>
                <select
                  value={riskCategoryInput}
                  onChange={(e) => setRiskCategoryInput(e.target.value)}
                  className={cn(
                    'h-9 w-full rounded-xl border px-3 text-sm shadow-sm transition-colors focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                  )}
                >
                  <option value="LOW">LOW Risk Profile</option>
                  <option value="MEDIUM">MEDIUM Risk Profile</option>
                  <option value="HIGH">HIGH Risk Profile</option>
                  <option value="CRITICAL">CRITICAL Risk Profile</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Verification Remarks & Notes
                </label>
                <textarea
                  rows={2}
                  value={kycRemarks}
                  onChange={(e) => setKycRemarks(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-white' : 'border-slate-300 bg-white text-slate-900'
                  )}
                  placeholder="e.g. Aadhaar & PAN verified via official portal, address proofs matched."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#2B3566]">
                <Button variant="ghost" onClick={() => setKycModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={kycUpdateMutation.isPending}
                  onClick={() => kycUpdateMutation.mutate()}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  {kycUpdateMutation.isPending ? 'Updating...' : 'Save & Sync KYC'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-2 min-w-0">
      <dt className="text-slate-500 font-medium shrink-0">{label}</dt>
      <dd className="text-right font-medium text-slate-900 dark:text-slate-200 min-w-0 break-words">{value ?? '-'}</dd>
    </div>
  );
}
