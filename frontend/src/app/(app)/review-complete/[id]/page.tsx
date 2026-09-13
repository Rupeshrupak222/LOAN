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
  Layers,
  Lock,
  FileUp,
  AlertCircle,
  Upload,
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
import { PendingWorkWarningModal, PendingWorkItem } from '@/components/PendingWorkWarningModal';

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
  const [forwardToFinanceModalOpen, setForwardToFinanceModalOpen] = useState(false);

  // Loan Officer Submission Modal State
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitReason, setSubmitReason] = useState('Borrower intake & KYC documents completed. Submitted for credit appraisal.');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // KYC Verification Modal State (Credit Analyst / Underwriter / Staff)
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycStatusInput, setKycStatusInput] = useState('VERIFIED');
  const [riskCategoryInput, setRiskCategoryInput] = useState('LOW');
  const [kycRemarks, setKycRemarks] = useState('');

  // Pending Work Warning Modal State
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningSourceDept, setWarningSourceDept] = useState('');
  const [warningTargetDept, setWarningTargetDept] = useState('');
  const [pendingWorkList, setPendingWorkList] = useState<PendingWorkItem[]>([]);
  const [onWarningConfirmAction, setOnWarningConfirmAction] = useState<(() => Promise<void>) | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['application', params.id],
    queryFn: async () => (await api.get(`/applications/${params.id}`)).data.data,
  });

  // Missing documents direct upload state
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState<number>(Date.now());

  const handleUploadDocument = async (category: string, documentType: string, file: File) => {
    const custId = data?.customer?.id || data?.customerId;
    if (!custId) {
      toast.error('Customer ID not found for document upload.');
      return;
    }
    setUploadingDocId(category);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('customerId', custId);
      if (data.id) formData.append('applicationId', data.id);
      formData.append('category', category);
      formData.append('documentType', documentType);

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`${file.name} uploaded successfully!`);
      queryClient.invalidateQueries({ queryKey: ['application', params.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['customer', custId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err: any) {
      toast.error(apiErrorMessage(err), { title: 'Upload Failed' });
    } finally {
      setUploadingDocId(null);
      setFileInputKey(Date.now());
    }
  };

  // Forward to Credit Analyst Mutation (Loan Officer)
  const submitToCreditAnalystMutation = useMutation({
    mutationFn: async () =>
      api.post(`/applications/${params.id}/transition`, {
        toStatus: 'SUBMITTED',
        reason: submitReason.trim() || 'Submitted to Credit Analyst by Loan Officer',
      }),
    onSuccess: () => {
      toast.success('Application submitted to Credit Analyst queue.');
      queryClient.invalidateQueries({ queryKey: ['application', params.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSubmitModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Submission Notice' });
    },
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
      toast.success(`Application and documents successfully forwarded to Finance Officer for disbursement.`);
      queryClient.invalidateQueries({ queryKey: ['application', params.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['disbursements-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-disbursements-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      setDecisionModalOpen(false);
      setForwardToFinanceModalOpen(false);
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

  const isLoanOfficer = user?.roles?.includes('LOAN_OFFICER');
  const isCreditAnalyst = user?.roles?.includes('CREDIT_ANALYST');
  const isUnderwriter = user?.roles?.includes('UNDERWRITER');
  const isSuperAdmin = user?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN'].includes(r));
  const isAdmin = isSuperAdmin;
  const isBranchManager = user?.roles?.includes('BRANCH_MANAGER');
  const isBranchManagerOnly = Boolean(isBranchManager && !isSuperAdmin && !isUnderwriter);

  // Segregation of Duties: Loan Officer is strictly restricted from credit appraisal tools & decisions
  const isOnlyLoanOfficer = Boolean(isLoanOfficer && !isCreditAnalyst && !isUnderwriter && !isSuperAdmin);

  const isCreditAnalystOrHigher = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'COMPANY_ADMIN'].includes(r)
  );

  // Extract consolidated documents
  const customerDocs = Array.isArray(customer?.documents) ? customer.documents : [];
  const appDocs = Array.isArray(data?.documents) ? data.documents : [];
  const documentsMap = new Map<string, any>();
  customerDocs.forEach((d: any) => documentsMap.set(d.id, d));
  appDocs.forEach((d: any) => documentsMap.set(d.id, d));
  const documents = Array.from(documentsMap.values());

  // 5 Mandatory Document Verification Checks
  const hasIdentity = documents.some((d) =>
    ['IDENTITY_PROOF', 'IDENTITY', 'PAN_CARD', 'AADHAAR'].includes(d.category) ||
    ['PAN_CARD', 'AADHAAR', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE'].includes(d.documentType || '')
  );
  const hasPhoto = documents.some((d) =>
    ['APPLICANT_PHOTO', 'PHOTO'].includes(d.category) ||
    ['CUSTOMER_SELFIE_PHOTO', 'APPLICANT_PHOTO', 'PHOTO'].includes(d.documentType || '')
  );
  const hasAddress = documents.some((d) =>
    ['ADDRESS_PROOF', 'UTILITY_BILL'].includes(d.category) ||
    ['ADDRESS_PROOF', 'ELECTRICITY_BILL', 'PASSPORT', 'VOTER_ID', 'RENTAL_AGREEMENT', 'Aadhar_CARD'].includes(d.documentType || '')
  );
  const hasIncome = documents.some((d) =>
    ['INCOME_PROOF', 'FINANCIAL'].includes(d.category) ||
    ['SALARY_SLIP', 'ITR', 'FORM_16', 'PAYSLIP'].includes(d.documentType || '')
  );
  const hasBank = documents.some((d) =>
    ['BANK_STATEMENT'].includes(d.category) ||
    ['BANK_STATEMENT', 'BANK_PASSBOOK'].includes(d.documentType || '')
  );

  // Calculate borrower age
  const calculateAge = (dobString?: string | null): number | null => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const borrowerAge = calculateAge(customer?.dateOfBirth);
  const minPolicyAge = product?.eligibilityRules?.minAge || 21;
  const maxPolicyAge = product?.eligibilityRules?.maxAge || 60;

  let ageError: string | null = null;
  if (borrowerAge === null) {
    ageError = 'Date of birth is missing or unverified on borrower profile';
  } else if (borrowerAge < minPolicyAge) {
    ageError = `Borrower age (${borrowerAge} yrs) is below policy minimum (${minPolicyAge} yrs)`;
  } else if (borrowerAge > maxPolicyAge) {
    ageError = `Borrower age (${borrowerAge} yrs) exceeds policy maximum (${maxPolicyAge} yrs)`;
  }
  const isAgeValid = ageError === null;

  const mandatoryChecklist = [
    {
      id: 'IDENTITY_PROOF',
      category: 'IDENTITY_PROOF',
      defaultDocType: 'PAN_CARD',
      title: 'Identity Proof',
      desc: 'PAN Card / Aadhaar Card',
      uploaded: hasIdentity,
      doc: documents.find((d) =>
        ['IDENTITY_PROOF', 'IDENTITY', 'PAN_CARD', 'AADHAAR'].includes(d.category) ||
        ['PAN_CARD', 'AADHAAR', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE'].includes(d.documentType || '')
      ),
    },
    {
      id: 'APPLICANT_PHOTO',
      category: 'APPLICANT_PHOTO',
      defaultDocType: 'CUSTOMER_SELFIE_PHOTO',
      title: 'Applicant Photo',
      desc: 'Applicant Photograph / Selfie with clear face',
      uploaded: hasPhoto,
      doc: documents.find((d) =>
        ['APPLICANT_PHOTO', 'PHOTO'].includes(d.category) ||
        ['CUSTOMER_SELFIE_PHOTO', 'APPLICANT_PHOTO', 'PHOTO'].includes(d.documentType || '')
      ),
    },
    {
      id: 'ADDRESS_PROOF',
      category: 'ADDRESS_PROOF',
      defaultDocType: 'ELECTRICITY_BILL',
      title: 'Address Proof',
      desc: 'Utility / Electricity Bill / Passport / Rental Agreement',
      uploaded: hasAddress,
      doc: documents.find((d) =>
        ['ADDRESS_PROOF', 'UTILITY_BILL'].includes(d.category) ||
        ['ADDRESS_PROOF', 'ELECTRICITY_BILL', 'PASSPORT', 'VOTER_ID', 'RENTAL_AGREEMENT', 'Aadhar_CARD'].includes(d.documentType || '')
      ),
    },
    {
      id: 'INCOME_PROOF',
      category: 'INCOME_PROOF',
      defaultDocType: 'SALARY_SLIP',
      title: 'Income Proof',
      desc: 'Salary Slip / 3 Months Pay Slips / Form 16 / ITR',
      uploaded: hasIncome,
      doc: documents.find((d) =>
        ['INCOME_PROOF', 'FINANCIAL'].includes(d.category) ||
        ['SALARY_SLIP', 'ITR', 'FORM_16', 'PAYSLIP'].includes(d.documentType || '')
      ),
    },
    {
      id: 'BANK_STATEMENT',
      category: 'BANK_STATEMENT',
      defaultDocType: 'BANK_STATEMENT',
      title: 'Bank Statement',
      desc: 'Latest 6 Months Bank Statement / Passbook',
      uploaded: hasBank,
      doc: documents.find((d) =>
        ['BANK_STATEMENT'].includes(d.category) ||
        ['BANK_STATEMENT', 'BANK_PASSBOOK'].includes(d.documentType || '')
      ),
    },
  ];

  const missingMandatoryDocs = mandatoryChecklist.filter((m) => !m.uploaded);
  const isReturned = data.underwriting?.decision === 'SEND_BACK';
  const hasDeficiencies = isReturned ? (missingMandatoryDocs.length > 0 || !isAgeValid) : false;

  const hasCreditScore = Boolean(
    data.riskAssessment &&
    data.riskAssessment.score !== null &&
    data.riskAssessment.score !== undefined
  );

  const isForwardedToUnderwriting = ['UNDERWRITING', 'APPROVED', 'REJECTED', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(data.status);

  const canLoanOfficerSubmit =
    isLoanOfficer &&
    ['DRAFT'].includes(data.status);

  const canLoanOfficerReForward =
    (isLoanOfficer || isCreditAnalystOrHigher) &&
    ['SUBMITTED', 'CREDIT_ASSESSMENT', 'UNDER_REVIEW'].includes(data.status);

  const canAssessCredit = !isOnlyLoanOfficer && user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER'].includes(r)
  );

  const canForwardToUnderwriting =
    !isCreditAnalyst &&
    !isOnlyLoanOfficer &&
    !isUnderwriter &&
    ['DRAFT', 'SUBMITTED', 'KYC_VERIFIED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT'].includes(data.status);

  const canReject =
    !isCreditAnalyst &&
    !isOnlyLoanOfficer &&
    !['REJECTED', 'DISBURSED', 'CANCELLED'].includes(data.status);

  const canMakeUnderwritingDecision =
    (user?.roles?.some((r: string) => ['UNDERWRITER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r))) &&
    !isBranchManagerOnly &&
    ['UNDERWRITING', 'CREDIT_ASSESSMENT', 'UNDER_REVIEW'].includes(data.status);

  const checkPendingWorkAndForward = (
    sourceDept: string,
    targetDept: string,
    onProceedDirectly: () => void,
    onAutoResolve: () => Promise<void>
  ) => {
    const items: PendingWorkItem[] = [];

    // ── 1. KYC Verification ──────────────────────────────────────────────
    const isKycDone = data?.customer?.kycStatus === 'VERIFIED';
    items.push({
      id: 'kyc',
      title: 'Borrower KYC Verification',
      description: isKycDone
        ? 'Customer KYC status is VERIFIED'
        : 'Customer KYC status is pending — must be set to VERIFIED before forwarding',
      category: 'KYC',
      isDone: isKycDone,
    });

    // ── 2. Document Verification (each doc listed individually) ──────────
    const docs = data?.customer?.documents || [];
    const unverifiedDocs = docs.filter((d: any) => !d.verified && d.status !== 'VERIFIED');
    const verifiedDocs = docs.filter((d: any) => d.verified || d.status === 'VERIFIED');

    if (docs.length === 0) {
      items.push({
        id: 'docs-missing',
        title: 'No Documents Uploaded',
        description: 'At least one verified identity document is required before forwarding',
        category: 'DOCUMENTS',
        isDone: false,
      });
    } else if (unverifiedDocs.length === 0) {
      items.push({
        id: 'docs',
        title: `All Documents Verified (${verifiedDocs.length}/${docs.length})`,
        description: `${docs.length} uploaded document(s) are fully verified and ready for handoff`,
        category: 'DOCUMENTS',
        isDone: true,
      });
    } else {
      // List each unverified document individually
      unverifiedDocs.forEach((d: any, i: number) => {
        const docLabel = d.documentType || d.category || d.fileName || `Document #${i + 1}`;
        items.push({
          id: `doc-${d.id || i}`,
          title: `Unverified: ${docLabel}`,
          description: `File: ${d.fileName || 'N/A'} — Status: ${d.status || 'PENDING'}. Must be verified by staff before forwarding.`,
          category: 'DOCUMENTS',
          isDone: false,
        });
      });
      // Show already-verified docs as done items
      verifiedDocs.forEach((d: any, i: number) => {
        const docLabel = d.documentType || d.category || d.fileName || `Document #${i + 1}`;
        items.push({
          id: `doc-verified-${d.id || i}`,
          title: `Verified: ${docLabel}`,
          description: `File: ${d.fileName || 'N/A'} — Verified by ${d.verifiedBy || 'Staff'}`,
          category: 'DOCUMENTS',
          isDone: true,
        });
      });
    }

    // ── 3. Risk Score & Recommendation (for underwriting/finance steps) ──
    if (targetDept.includes('Underwriting') || targetDept.includes('Finance')) {
      const hasRisk = Boolean(
        data?.riskAssessment &&
        data?.riskAssessment.score !== null &&
        data?.riskAssessment.score !== undefined
      );
      items.push({
        id: 'risk',
        title: 'Credit Risk Scoring Assessment',
        description: hasRisk
          ? `Risk score evaluated: ${data.riskAssessment.score}/100 (${data.riskAssessment.category || 'LOW'} Risk)`
          : '4-Pillar Credit Risk Score has not been evaluated — run evaluation first',
        category: 'RISK_SCORE',
        isDone: hasRisk,
      });

      const recommendationRecord = data?.eligibility?.factors?.recommendation;
      const hasRecommendation = Boolean(recommendationRecord?.recommendation);
      items.push({
        id: 'recommendation',
        title: 'Credit Analyst Recommendation Rationale',
        description: hasRecommendation
          ? `Recommendation recorded: ${recommendationRecord.recommendation}`
          : 'Credit Analyst recommendation rationale not yet recorded',
        category: 'RECOMMENDATION',
        isDone: hasRecommendation,
      });
    }

    const hasAnyPending = items.some((i) => !i.isDone);
    // Documents pending = hard block, no auto-resolve allowed
    const hasDocsPending = unverifiedDocs.length > 0 || docs.length === 0;

    if (hasAnyPending) {
      setPendingWorkList(items);
      setWarningSourceDept(sourceDept);
      setWarningTargetDept(targetDept);
      // If documents are pending, the "complete and forward" button is disabled —
      // user must manually go verify documents first (backend will also hard-block).
      // If only non-doc items are pending, allow the auto-resolve path.
      setOnWarningConfirmAction(
        hasDocsPending
          ? null  // disables the auto-forward button in modal
          : () => onAutoResolve
      );
      setWarningModalOpen(true);
    } else {
      onProceedDirectly();
    }
  };


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        breadcrumb="Lending / Applications / Review"
        title={`Application #${data.applicationNo || 'N/A'}`}
        subtitle={`Submitted on ${data.createdAt ? formatDate(data.createdAt) : 'N/A'} · Loan Product: ${product.name || 'General Loan'}`}
        action={
          <div className="flex items-center gap-2">
            <Badge status={data.status} />
            {(customer.id || data.customerId) && (
              <Link href={`/customers/${customer.id || data.customerId}`}>
                <Button size="sm" variant="secondary" className="gap-1.5 font-semibold text-xs cursor-pointer">
                  <User className="w-3.5 h-3.5 text-brand-600" /> Borrower 360
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* Returned for Corrections Actionable Alert & Resolution Panel */}
      {isReturned && (
        <div className={cn(
          'p-5 rounded-2xl border space-y-4 shadow-sm animate-in fade-in transition-all',
          hasDeficiencies
            ? 'border-amber-300 bg-amber-50/90 dark:bg-amber-950/40 dark:border-amber-800/60'
            : 'border-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/40 dark:border-emerald-800/60'
        )}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={cn(
                'p-2 rounded-xl shrink-0',
                hasDeficiencies
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
              )}>
                {hasDeficiencies ? <RotateCcw className="w-5 h-5 text-amber-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={cn(
                    'text-sm font-bold',
                    hasDeficiencies ? 'text-amber-950 dark:text-amber-200' : 'text-emerald-950 dark:text-emerald-200'
                  )}>
                    Application Returned by Credit Analyst for Corrections
                  </h4>
                  <span className={cn(
                    'px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight',
                    hasDeficiencies
                      ? 'bg-amber-200 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200'
                      : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-200'
                  )}>
                    {hasDeficiencies
                      ? `${missingMandatoryDocs.length} Missing Mandatory Document(s)`
                      : 'All Deficiencies Resolved'}
                  </span>
                </div>
                <p className="text-xs text-amber-900/90 dark:text-amber-300 mt-1 leading-relaxed bg-amber-100/60 dark:bg-amber-900/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/40">
                  <span className="font-semibold">Credit Analyst Return Note:</span> {data.underwriting?.reason || 'Proposal has pending mandatory documents or borrower criteria discrepancies.'}
                </p>
              </div>
            </div>

            {/* Action Button: Resend to Credit Analyst */}
            {isOnlyLoanOfficer && canLoanOfficerReForward && (
              <div className="flex flex-col items-end gap-1.5 shrink-0 w-full sm:w-auto">
                <Button
                  size="sm"
                  disabled={hasDeficiencies}
                  onClick={() => {
                    if (hasDeficiencies) {
                      toast.warning(`Cannot resend: Upload missing documents first (${missingMandatoryDocs.map((m) => m.title).join(', ')}).`);
                      return;
                    }
                    setSubmitReason('All missing mandatory documents uploaded and verified by Loan Officer. Resubmitted for credit assessment.');
                    setSubmitModalOpen(true);
                  }}
                  className={cn(
                    'gap-1.5 font-semibold text-xs shadow-sm cursor-pointer shrink-0 w-full sm:w-auto justify-center transition-all',
                    hasDeficiencies
                      ? 'opacity-50 cursor-not-allowed bg-slate-400 hover:bg-slate-400 dark:bg-slate-700 text-slate-100'
                      : 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-md animate-pulse'
                  )}
                  title={
                    hasDeficiencies
                      ? `Upload all missing mandatory documents to enable resending`
                      : 'Resend proposal to Credit Analyst queue'
                  }
                >
                  {hasDeficiencies ? <Lock className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  {hasDeficiencies ? 'Resend to Credit Analyst (Locked)' : 'Resend to Credit Analyst →'}
                </Button>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 text-right">
                  {hasDeficiencies
                    ? `Upload all missing documents below to unlock`
                    : `All required documents present. Click to resend.`}
                </span>
              </div>
            )}
          </div>

          {/* Age Deficiency Alert if present */}
          {!isAgeValid && (
            <div className="p-3 rounded-xl bg-rose-100/80 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span><strong>Borrower Age Issue:</strong> {ageError} (Borrower DOB: {customer.dateOfBirth ? formatDate(customer.dateOfBirth) : 'Missing'})</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setKycStatusInput(customer.kycStatus || 'VERIFIED');
                  setRiskCategoryInput(customer.riskCategory || 'LOW');
                  setKycRemarks('');
                  setKycModalOpen(true);
                }}
                className="text-xs shrink-0 cursor-pointer border-rose-300 text-rose-700 hover:bg-rose-50"
              >
                <UserCheck className="w-3 h-3" /> Rectify KYC / DOB
              </Button>
            </div>
          )}

          {/* Mandatory Documents Checklist & Direct Upload Action Grid */}
          <div className="pt-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-brand-600" />
              Mandatory Documents Checklist ({5 - missingMandatoryDocs.length} of 5 Ready)
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {mandatoryChecklist.map((item) => {
                const isUploading = uploadingDocId === item.category;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition-all',
                      item.uploaded
                        ? 'bg-white/80 dark:bg-slate-900/80 border-emerald-300 dark:border-emerald-800/60'
                        : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/50'
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {item.title}
                        </span>
                        {item.uploaded ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Uploaded
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-900 flex items-center gap-1 shrink-0">
                            <XCircle className="w-3 h-3 text-rose-600" /> Missing
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.desc}
                      </p>
                      {item.uploaded && item.doc && (
                        <p className="text-[10px] font-mono text-slate-400 truncate">
                          📄 {item.doc.fileName || item.doc.storageKey || 'Document on file'}
                        </p>
                      )}
                    </div>

                    {/* Upload / Replace Action Button */}
                    <div className="pt-1 flex items-center gap-2">
                      <label
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs select-none',
                          isUploading
                            ? 'bg-slate-200 text-slate-500 cursor-wait dark:bg-slate-800 dark:text-slate-400'
                            : item.uploaded
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-[#2563EB] hover:bg-blue-700 text-white'
                        )}
                      >
                        {isUploading ? (
                          <>
                            <Spinner size="sm" /> Uploading...
                          </>
                        ) : item.uploaded ? (
                          <>
                            <FileUp className="w-3 h-3 text-slate-500" /> Replace Document
                          </>
                        ) : (
                          <>
                            <FileUp className="w-3 h-3 text-white" /> + Upload {item.title}
                          </>
                        )}
                        <input
                          key={`${fileInputKey}-${item.id}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={isUploading}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadDocument(item.category, item.defaultDocType, file);
                            }
                          }}
                        />
                      </label>
                      {item.uploaded && item.doc?.storageKey && (
                        <a
                          href={item.doc.storageKey}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200"
                          title="View document"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Prominent Action & Workflow Control Bar (Always visible outside) */}
      <div className={cn(
        'p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs transition-colors',
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      )}>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500">Proposal Controls:</span>
          <Badge status={data.status} />
          {!isOnlyLoanOfficer && (
            hasCreditScore ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Credit Risk Score: {data.riskAssessment.score}/100 ({data.riskAssessment?.category || 'LOW'} Risk)
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Credit Risk Score Pending
              </span>
            )
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Credit Assessment Link (Credit Analysts / Staff only) */}
          {canAssessCredit && (
            <Link href={`/credit-assessment?applicationId=${data.id}`}>
              <Button size="sm" className="gap-1.5 text-xs font-semibold bg-[#2563EB] hover:bg-blue-700 text-white shadow-sm cursor-pointer">
                <Calculator className="w-3.5 h-3.5" /> Open Credit Assessment
              </Button>
            </Link>
          )}

          {/* Button 1: Forward / Re-Forward to Underwriting (Credit Analysts only) */}
          {canForwardToUnderwriting && (
            <Button
              size="sm"
              onClick={() => {
                const source = 'Credit Assessment Desk';
                const target = 'Underwriting Queue';
                checkPendingWorkAndForward(
                  source,
                  target,
                  () => {
                    setForwardReason(
                      isForwardedToUnderwriting
                        ? 'Application re-forwarded to Underwriting queue for re-appraisal'
                        : 'Credit assessment verified & recommended for underwriting sanction'
                    );
                    setForwardModalOpen(true);
                  },
                  async () => {
                    if (customer?.id) {
                      await api.patch(`/customers/${customer.id}/kyc`, { kycStatus: 'VERIFIED' }).catch(() => null);
                    }
                    await api.post(`/risk/evaluate/${params.id}`).catch(() => null);
                    await api.post(`/credit-assessment/${params.id}/recommendation`, {
                      recommendation: 'RECOMMEND',
                      notes: 'Auto-verified compliance & credit score evaluated for department handoff.',
                    }).catch(() => null);
                    await forwardMutation.mutateAsync();
                  }
                );
              }}
              className="gap-1.5 font-semibold text-xs shadow-sm cursor-pointer transition-all bg-[#2563EB] hover:bg-blue-700 text-white"
              title={
                isForwardedToUnderwriting
                  ? 'Proposal already forwarded. Click to re-forward / resend.'
                  : 'Forward proposal to Underwriting queue'
              }
            >
              {isForwardedToUnderwriting ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" /> Re-Forward to Underwriter
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Forward to Underwriter
                </>
              )}
            </Button>
          )}

          {/* Button 2: Reject Application (Credit Analysts only) */}
          {canReject && !['APPROVED', 'UNDERWRITING'].includes(data.status) && (
            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => {
                setRejectReason('');
                setRejectModalOpen(true);
              }}
              className="gap-1.5 font-semibold text-xs cursor-pointer border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
              title="Reject this loan application proposal"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-500" /> Reject Application
            </Button>
          )}

          {/* Loan Officer Forward / Resend Button */}
          {isOnlyLoanOfficer && (
            canLoanOfficerSubmit ? (
              <Button
                size="sm"
                onClick={() => {
                  checkPendingWorkAndForward(
                    'Loan Officer Intake',
                    'Credit Assessment Desk',
                    () => {
                      setSubmitReason('Initial completed intake submitted for credit appraisal');
                      setSubmitModalOpen(true);
                    },
                    async () => {
                      await submitToCreditAnalystMutation.mutateAsync();
                    }
                  );
                }}
                className="gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Forward to Credit Analyst
              </Button>
            ) : canLoanOfficerReForward ? (
              <Button
                size="sm"
                variant={hasDeficiencies ? 'outline' : 'secondary'}
                disabled={hasDeficiencies}
                onClick={() => {
                  if (hasDeficiencies) {
                    toast.warning(
                      `Cannot resend: Upload missing mandatory documents first (${missingMandatoryDocs.map((m) => m.title).join(', ')}).`
                    );
                    return;
                  }
                  checkPendingWorkAndForward(
                    'Loan Officer Intake',
                    'Credit Assessment Desk',
                    () => {
                      setSubmitReason(
                        isReturned
                          ? 'All missing mandatory documents uploaded and verified by Loan Officer. Resubmitted for credit assessment.'
                          : 'Application re-forwarded to Credit Analyst queue for re-evaluation'
                      );
                      setSubmitModalOpen(true);
                    },
                    async () => {
                      await submitToCreditAnalystMutation.mutateAsync();
                    }
                  );
                }}
                className={cn(
                  'gap-1.5 font-semibold text-xs shadow-xs transition-all',
                  hasDeficiencies
                    ? 'opacity-60 cursor-not-allowed border-slate-300 text-slate-400 dark:border-slate-700 dark:text-slate-500'
                    : 'text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 cursor-pointer'
                )}
                title={
                  hasDeficiencies
                    ? `Locked: Upload missing mandatory documents first (${missingMandatoryDocs.map((m) => m.title).join(', ')})`
                    : 'Resend proposal to Credit Analyst queue'
                }
              >
                {hasDeficiencies ? <Lock className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Resend to Credit Analyst {hasDeficiencies && '(Locked)'}
              </Button>
            ) : null
          )}

          {/* Direct Underwriter Decision Actions & Forward to Finance Officer */}
          {(isUnderwriter || isSuperAdmin || isAdmin || canMakeUnderwritingDecision || data.status === 'UNDERWRITING') && data.status !== 'APPROVED' && data.status !== 'REJECTED' && (
            <Button
              size="sm"
              onClick={() => {
                const source = 'Underwriting Queue';
                const target = 'Finance / Disbursal Desk';
                checkPendingWorkAndForward(
                  source,
                  target,
                  () => {
                    setDecision('APPROVE');
                    setReason('Sanctioned by Underwriter and forwarded to Finance Officer for disbursement.');
                    setConditions('');
                    setForwardToFinanceModalOpen(true);
                  },
                  async () => {
                    if (customer?.id) {
                      await api.patch(`/customers/${customer.id}/kyc`, { kycStatus: 'VERIFIED' }).catch(() => null);
                    }
                    setDecision('APPROVE');
                    setReason('Sanctioned by Underwriter and forwarded to Finance Officer for disbursement.');
                    await decisionMutation.mutateAsync();
                    toast.success('All pending work completed! Customer document forwarded to Finance Officer.');
                  }
                );
              }}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm cursor-pointer"
              title="Sanction loan proposal and forward documents to Finance Officer for disbursal"
            >
              <Send className="w-3.5 h-3.5" /> Forward to Finance Officer
            </Button>
          )}

          {canMakeUnderwritingDecision && (
            <>
              <Button
                size="sm"
                onClick={() => setUwWizardOpen(true)}
                className="gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold shadow-sm cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Step-by-Step Verification Desk →
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
                <XCircle className="w-3.5 h-3.5 text-rose-500" /> Reject Loan
              </Button>
            </>
          )}

          {/* Underwriter Modify */}
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
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> Modify Decision
            </Button>
          )}

          {/* Proceed to Payout */}
          {user?.roles?.some((r: string) => ['SUPER_ADMIN', 'FINANCE_OFFICER'].includes(r)) &&
            data.status === 'APPROVED' && (
              <Link href="/disbursements">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                  Proceed to Payout →
                </Button>
              </Link>
            )}
        </div>
      </div>

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
        {!isOnlyLoanOfficer && canAssessCredit ? (
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

      {/* Main Application Details & Intelligence Sections */}
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

        {/* FOR LOAN OFFICER: Show strictly Proposal Intake Details & Lifecycle Audit Trail */}
        {isOnlyLoanOfficer ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-[#2B3566]">
                <div>
                  <h3 className="text-sm font-bold">Proposal Intake Details</h3>
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

              {canLoanOfficerSubmit && (
                <div className="mt-4 rounded-xl bg-blue-50/60 dark:bg-[#1E2445] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-blue-100 dark:border-blue-900/30">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Ready for Credit Assessment?</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Forward this proposal to the Credit Analyst desk for appraisal and eligibility verification.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSubmitReason('Initial completed intake submitted for credit appraisal');
                      setSubmitModalOpen(true);
                    }}
                    className="gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shrink-0 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Forward to Credit Analyst
                  </Button>
                </div>
              )}

              {canLoanOfficerReForward && (
                <div className="mt-4 rounded-xl bg-blue-50/60 dark:bg-[#1E2445] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-blue-100 dark:border-blue-900/30">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Re-Forward Application Proposal?</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {hasDeficiencies
                        ? `Application was returned by Credit Analyst. Please upload missing mandatory documents (${missingMandatoryDocs.map((m) => m.title).join(', ')}) to unlock resubmission.`
                        : 'Proposal is in Credit Appraisal workflow. All documents verified. You can re-forward it to the analyst desk.'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={hasDeficiencies ? 'outline' : 'secondary'}
                    disabled={hasDeficiencies}
                    onClick={() => {
                      if (hasDeficiencies) {
                        toast.warning(`Upload missing mandatory documents first.`);
                        return;
                      }
                      setSubmitReason(
                        isReturned
                          ? 'All missing mandatory documents uploaded and verified by Loan Officer. Resubmitted for credit assessment.'
                          : 'Application re-forwarded to Credit Analyst queue for re-evaluation'
                      );
                      setSubmitModalOpen(true);
                    }}
                    className={cn(
                      'gap-1.5 font-semibold text-xs shrink-0 shadow-sm transition-all',
                      hasDeficiencies
                        ? 'opacity-60 cursor-not-allowed border-slate-300 text-slate-400 dark:border-slate-700 dark:text-slate-500'
                        : 'text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 cursor-pointer'
                    )}
                    title={hasDeficiencies ? 'Upload missing mandatory documents first' : 'Resend to Credit Analyst'}
                  >
                    {hasDeficiencies ? <Lock className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    Resend to Credit Analyst {hasDeficiencies && '(Locked)'}
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
        ) : (
          /* FOR CREDIT ANALYST, UNDERWRITER & STAFF: Full Credit Appraisal and Intelligence Suite */
          <>
            {/* Credit Appraisal & Assessment Results Summary */}
            <div id="credit-appraisal-summary" className="scroll-mt-20">
              <Card className="p-5 space-y-4 border-2 border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/30 to-slate-50/50 dark:from-indigo-950/20 dark:to-slate-900/40">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100 dark:border-indigo-900/40">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        Credit Appraisal & Assessment Results Summary
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Consolidated FOIR capacity, eligibility verdict, 4-pillar risk scoring, and credit analyst recommendations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={data.status} />
                    <Link href="/underwriting">
                      <Button size="sm" variant="secondary" className="gap-1.5 text-xs font-semibold">
                        <Calculator className="w-3.5 h-3.5 text-indigo-600" /> Open Assessment Desk
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px]">Eligibility Engine:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {data.eligibility?.result || 'PENDING'}
                    </p>
                    <p className="text-[10px] text-slate-400">Policy rules evaluated</p>
                  </div>

                  <div className={cn(
                    "p-3 rounded-xl border space-y-1",
                    hasCreditScore
                      ? "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800"
                      : "bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
                  )}>
                    <span className="text-slate-400 text-[11px]">4-Pillar Risk Score:</span>
                    <p className={cn(
                      "font-bold text-sm",
                      hasCreditScore ? "text-slate-800 dark:text-slate-100" : "text-amber-600 dark:text-amber-400"
                    )}>
                      {hasCreditScore ? `${data.riskAssessment.score}/100` : 'NOT EVALUATED'}
                    </p>
                    <p className={cn(
                      "text-[10px] font-semibold",
                      hasCreditScore ? "text-emerald-600" : "text-amber-600"
                    )}>
                      {hasCreditScore ? `${data.riskAssessment?.category || customer?.riskCategory || 'LOW'} Risk Tier` : 'Required for Underwriter'}
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px]">Borrower KYC Status:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {customer.kycStatus || 'NOT_STARTED'}
                    </p>
                    <p className="text-[10px] text-slate-400">Identity & documents check</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px]">Credit Recommendation:</span>
                    <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      {(data.eligibility?.factors as any)?.recommendation?.recommendation || 'PENDING'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {(data.eligibility?.factors as any)?.recommendation?.notes || 'Awaiting recommendation'}
                    </p>
                  </div>
                </div>

                {/* Recommendation Notes Display */}
                {(data.eligibility?.factors as any)?.recommendation?.notes && (
                  <div className="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      Credit Analyst Assessment Rationale & Stipulations:
                    </span>
                    <p className="text-xs italic">
                      &ldquo;{(data.eligibility?.factors as any).recommendation.notes}&rdquo;
                    </p>
                    {(data.eligibility?.factors as any).recommendation.conditions && (
                      <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 pt-1">
                        Sanction Conditions: {(data.eligibility?.factors as any).recommendation.conditions}
                      </p>
                    )}
                  </div>
                )}

                {/* Forward to Underwriter Section / Blocker Alert */}
                {!hasCreditScore ? (
                  <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <p className="font-bold text-amber-800 dark:text-amber-200">
                          Credit Risk Score Evaluation Pending
                        </p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300">
                          Proposal cannot be forwarded to Underwriting until the 4-pillar credit risk score is evaluated.
                        </p>
                      </div>
                    </div>
                    <Link href="/underwriting">
                      <Button size="sm" className="gap-1.5 font-semibold text-xs bg-amber-600 hover:bg-amber-700 text-white shrink-0">
                        <Calculator className="w-3.5 h-3.5" /> Run Credit Score in Desk →
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-slate-700 dark:text-slate-200">
                        {isForwardedToUnderwriting ? 'Proposal in Underwriting Workflow' : 'Credit Assessment Complete — Ready for Underwriter'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isForwardedToUnderwriting
                          ? 'Proposal has been forwarded. You can re-forward if updated or decline if invalid.'
                          : 'All credit scores and recommendations are recorded. Forward proposal to Underwriting committee or reject.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canReject && !['APPROVED', 'UNDERWRITING'].includes(data.status) && (
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => {
                            setRejectReason('');
                            setRejectModalOpen(true);
                          }}
                          className="gap-1.5 font-semibold text-xs border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-500" /> Reject Application
                        </Button>
                      )}
                      {canForwardToUnderwriting && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setForwardReason(
                              isForwardedToUnderwriting
                                ? 'Application re-forwarded to Underwriting queue for re-appraisal'
                                : 'Credit assessment verified & recommended for underwriting sanction'
                            );
                            setForwardModalOpen(true);
                          }}
                          className="gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-sm cursor-pointer shrink-0"
                        >
                          {isForwardedToUnderwriting ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" /> Re-Forward to Underwriter
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" /> Forward to Underwriter
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </div>

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
          </>
        )}
      </div>

      {/* MODAL 0: FORWARD TO CREDIT ANALYST MODAL (LOAN OFFICER) */}
      {submitModalOpen && (
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
                  <h3 className="font-bold text-base">
                    {data.status === 'DRAFT' ? 'Forward to Credit Analyst' : 'Re-Forward to Credit Analyst'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {data.status === 'DRAFT'
                      ? 'Submit completed intake for credit appraisal'
                      : 'Re-submit application to Credit Analyst queue'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSubmitModalOpen(false)}
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
                  Intake & Field Verification Note *
                </label>
                <textarea
                  rows={3}
                  value={submitReason}
                  onChange={(e) => setSubmitReason(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border p-3 text-xs focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-white' : 'border-slate-300 bg-white text-slate-900'
                  )}
                  placeholder="Enter notes for Credit Analyst..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#2B3566]">
                <Button variant="ghost" onClick={() => setSubmitModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!submitReason.trim() || submitToCreditAnalystMutation.isPending}
                  onClick={() => submitToCreditAnalystMutation.mutate()}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold gap-1.5"
                >
                  {data.status === 'DRAFT' ? <Send className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  {submitToCreditAnalystMutation.isPending
                    ? 'Submitting...'
                    : data.status === 'DRAFT'
                    ? 'Confirm & Forward to Credit Analyst'
                    : 'Confirm & Re-Forward to Credit Analyst'}
                </Button>
              </div>
            </div>
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

      {/* MODAL 5: FORWARD TO FINANCE OFFICER MODAL */}
      {forwardToFinanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border shadow-2xl p-6 relative transition-all',
              isDark ? 'bg-[#171B36] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B3566]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Forward to Finance Officer</h3>
                  <p className="text-xs text-slate-400">Sanction proposal & transfer dossier to Finance Officer for disbursement</p>
                </div>
              </div>
              <button
                onClick={() => setForwardToFinanceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-[#1E2445] text-xs space-y-1 border border-emerald-200/60 dark:border-emerald-900/40">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Application: <span className="font-mono font-bold text-emerald-600">#{data.applicationNo}</span>
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Borrower: <span className="font-bold">{customer.firstName} {customer.lastName}</span> ({customer.customerCode})
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Loan Amount: <span className="font-bold text-emerald-600">₹{Number(data.requestedAmount).toLocaleString('en-IN')}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Sanction & Forwarding Note *
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border p-2.5 text-xs focus:border-emerald-600 focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-white' : 'border-slate-300 bg-white text-slate-900'
                  )}
                  placeholder="e.g. Underwriting audit passed. KYC & banking details verified. Forwarding proposal to Finance Officer for disbursal."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Approval Conditions (Optional)
                </label>
                <Input
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="e.g. Require original salary slips prior to final transfer"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#2B3566]">
                <Button variant="ghost" onClick={() => setForwardToFinanceModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={decisionMutation.isPending || !reason.trim()}
                  onClick={() => {
                    setDecision('APPROVE');
                    decisionMutation.mutate();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  {decisionMutation.isPending ? 'Forwarding...' : 'Confirm & Forward to Finance Officer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Work Warning Modal */}
      <PendingWorkWarningModal
        isOpen={warningModalOpen}
        onClose={() => setWarningModalOpen(false)}
        applicationId={params.id}
        applicationNo={data?.applicationNo || 'N/A'}
        customerName={`${data?.customer?.firstName || ''} ${data?.customer?.lastName || ''}`.trim() || 'Borrower'}
        customerCode={data?.customer?.customerCode}
        sourceDepartment={warningSourceDept}
        targetDepartment={warningTargetDept}
        pendingItems={pendingWorkList}
        onCompleteAndForward={onWarningConfirmAction}
        onManualFix={() => {
          const custId = customer?.id || data?.customerId;
          if (custId) {
            router.push(`/customers/${custId}?tab=documents`);
          } else {
            toast.info('Please review and verify all borrower documents before forwarding.');
          }
        }}
      />
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
