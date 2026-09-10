'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  ShieldCheck,
  Calculator,
  UserCheck,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Send,
  User,
  Info,
  TrendingUp,
  Award,
  Layers,
  FileText,
  Percent,
  Check,
  RefreshCw,
  Play,
  Sliders,
  Sparkles,
  Zap,
  Lock,
  Unlock,
  RotateCcw,
  IndianRupee,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  X,
  Eye,
  Download,
  Users,
  Briefcase,
  Building2,
  MapPin,
  CreditCard,
  Phone,
  Mail,
  Upload,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { Badge, Button, Card, Input } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { CreditIntelligenceCard } from '@/components/CreditIntelligenceCard';
import { DecisionSimulatorCard } from '@/components/DecisionSimulatorCard';

interface CreditAssessmentWorkspaceProps {
  applicationId: string;
  onForwardSuccess?: () => void;
  onBack?: () => void;
}

// 6 Strictly Sequential Appraisal Steps (KYC and Document Verification are merged into Step 2)
type StepNumber = 1 | 2 | 3 | 4 | 5 | 6;

export function CreditAssessmentWorkspace({
  applicationId,
  onForwardSuccess,
  onBack,
}: CreditAssessmentWorkspaceProps) {
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Active step in stepper
  const [activeStep, setActiveStep] = useState<StepNumber>(1);

  // Return to Loan Officer Modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('Address Proof is missing/unverified');
  const [returnNote, setReturnNote] = useState('');
  const [returnDestination, setReturnDestination] = useState<'LOAN_OFFICER' | 'CUSTOMER'>('LOAN_OFFICER');

  // Customer 360 In-Page Panel Toggle (No new tab)
  const [customer360Open, setCustomer360Open] = useState(false);

  // Document In-App Preview Modal State (No new tab)
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Step 2 KYC State
  const [kycRemarks, setKycRemarks] = useState('');

  // Step 2 Document Remarks Map
  const [docRemarksMap, setDocRemarksMap] = useState<Record<string, string>>({});

  // Step 3 Debt Capacity & FOIR Recalculator State
  const [calcIncome, setCalcIncome] = useState<number | ''>('');
  const [calcObligations, setCalcObligations] = useState<number | ''>('');
  const [calcAmount, setCalcAmount] = useState<number | ''>('');
  const [calcTenure, setCalcTenure] = useState<number | ''>('');
  const [calcRate, setCalcRate] = useState<number | ''>('');
  const [liveFoirResult, setLiveFoirResult] = useState<{
    proposedEmi: number;
    totalObligations: number;
    foirPct: number;
    status: 'PASS' | 'REVIEW' | 'FAIL';
  } | null>(null);

  // Step 5 Analyst Decision Form State
  const [analystDecision, setAnalystDecision] = useState<'ELIGIBLE' | 'NOT_ELIGIBLE' | 'SEND_BACK'>('ELIGIBLE');
  const [proposedAmount, setProposedAmount] = useState<number | ''>('');
  const [proposedTenure, setProposedTenure] = useState<number | ''>('');
  const [proposedRate, setProposedRate] = useState<number | ''>('');
  const [conditions, setConditions] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Repayment capacity is insufficient based on verified income and existing obligations');
  const [sendBackDestination, setSendBackDestination] = useState<'LOAN_OFFICER' | 'CUSTOMER'>('LOAN_OFFICER');

  // 1. Fetch Assessment Detail & Checklist
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['credit-assessment', applicationId],
    queryFn: async () => {
      const res = await api.get(`/credit-assessment/${applicationId}`);
      return res.data?.data;
    },
    enabled: Boolean(applicationId),
  });

  // 2. Also fetch Capacity & Step summary for strict verification checkpoints
  const { data: capacityData, refetch: refetchCapacity } = useQuery({
    queryKey: ['credit-capacity', applicationId],
    queryFn: async () => {
      try {
        const res = await api.get(`/credit/applications/${applicationId}/capacity`);
        return res.data?.data;
      } catch {
        return null;
      }
    },
    enabled: Boolean(applicationId),
  });

  const app = data?.application;
  const customer = data?.customer;
  const product = data?.product;
  const kycChecklist = data?.kycChecklist;
  const foir = data?.foirAnalysis;
  const eligibility = data?.eligibility;
  const risk = data?.riskAnalysis;
  const existingRecommendation = data?.recommendation;

  // Documents list
  const documents = (kycChecklist?.documents || []) as any[];
  const verifiedDocCount = documents.filter((d) => d.verified || d.status === 'VERIFIED').length;

  // Categorize documents
  const hasIdentity = documents.some((d) =>
    ['IDENTITY_PROOF', 'PAN_CARD', 'AADHAAR'].includes(d.category) ||
    ['PAN_CARD', 'AADHAAR', 'PASSPORT', 'VOTER_ID', 'Aadhar_CARD'].includes(d.documentType || '')
  );
  const hasPhoto = documents.some((d) =>
    ['APPLICANT_PHOTO', 'PHOTO'].includes(d.category) ||
    ['CUSTOMER_SELFIE_PHOTO', 'APPLICANT_PHOTO'].includes(d.documentType || '')
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
    ageError = `Borrower age (${borrowerAge} yrs) is below minimum required age (${minPolicyAge} yrs)`;
  } else if (borrowerAge > maxPolicyAge) {
    ageError = `Borrower age (${borrowerAge} yrs) exceeds maximum allowable age (${maxPolicyAge} yrs)`;
  }

  const isAgeValid = ageError === null;

  const missingMandatoryDocs: string[] = [];
  if (!hasIdentity) missingMandatoryDocs.push('Identity Proof (PAN Card / Aadhaar)');
  if (!hasPhoto) missingMandatoryDocs.push('Applicant Photo / Selfie');
  if (!hasAddress) missingMandatoryDocs.push('Address Proof (Electricity Bill / Passport / Rental Agreement)');
  if (!hasIncome) missingMandatoryDocs.push('Income Proof (Salary Slip / 3 Months Pay slips / ITR)');
  if (!hasBank) missingMandatoryDocs.push('Bank Statement (Latest 6 Months)');

  const unverifiedDocs = documents.filter((d) => !d.verified && d.status !== 'VERIFIED');
  const isKycPending = customer?.kycStatus !== 'VERIFIED';
  const isReturnedToLo = app?.status === 'SUBMITTED' || (app as any)?.underwriting?.decision === 'SEND_BACK';

  const hasDeficiencies =
    missingMandatoryDocs.length > 0 ||
    unverifiedDocs.length > 0 ||
    isKycPending ||
    !isAgeValid ||
    documents.length < 5;

  // Sync initial calculator values when data loads

  useEffect(() => {
    if (customer && app && product) {
      const inc = Number(customer.monthlyIncome || 0);
      const obl = Number(customer.existingObligations || 0);
      const amt = Number(app.requestedAmount || 0);
      const ten = Number(app.tenureMonths || 12);
      const r = Number(product.interestRate || 14.5);

      setCalcIncome(inc);
      setCalcObligations(obl);
      setCalcAmount(amt);
      setCalcTenure(ten);
      setCalcRate(r);
      setProposedAmount(amt);
      setProposedTenure(ten);
      setProposedRate(r);
    }
    if (existingRecommendation) {
      if (existingRecommendation.recommendation) {
        const rec = existingRecommendation.recommendation;
        if (rec === 'RECOMMEND' || rec === 'ELIGIBLE') setAnalystDecision('ELIGIBLE');
        else if (rec === 'REJECT' || rec === 'NOT_ELIGIBLE') setAnalystDecision('NOT_ELIGIBLE');
        else if (rec === 'SEND_BACK' || rec === 'FURTHER_REVIEW') setAnalystDecision('SEND_BACK');
      }
      if (existingRecommendation.proposedAmount) setProposedAmount(existingRecommendation.proposedAmount);
      if (existingRecommendation.proposedTenure) setProposedTenure(existingRecommendation.proposedTenure);
      if (existingRecommendation.conditions) setConditions(existingRecommendation.conditions);
      if (existingRecommendation.notes) setNotes(existingRecommendation.notes);
    }
  }, [customer, app, product, existingRecommendation]);

  // ---------------------------------------------------------------------------
  // STEP COMPLETION & UNLOCK DETERMINATION (Strict Sequential Hierarchy)
  // ---------------------------------------------------------------------------
  const isStep1Complete = Boolean(
    app && !['DRAFT'].includes(app.status)
  );

  // Step 2: KYC & Document Verification is strictly complete ONLY WHEN:
  // 1. Step 1 is complete
  // 2. Proposal is NOT in returned-to-LO state
  // 3. ZERO deficiencies exist (!hasDeficiencies)
  // 4. KYC status is VERIFIED
  // 5. Borrower age matches product policy criteria (minAge - maxAge)
  // 6. ALL 5 mandatory intake documents are uploaded (missingMandatoryDocs.length === 0, documents.length >= 5)
  // 7. ALL uploaded documents are verified (unverifiedDocs.length === 0)
  const isStep2Complete = Boolean(
    isStep1Complete &&
    !isReturnedToLo &&
    !hasDeficiencies &&
    customer?.kycStatus === 'VERIFIED' &&
    isAgeValid &&
    documents.length >= 5 &&
    missingMandatoryDocs.length === 0 &&
    unverifiedDocs.length === 0
  );

  // Step 3: Financial Eligibility
  const isStep3Complete = Boolean(
    isStep2Complete && eligibility && eligibility.factors && eligibility.factors.length > 0
  );

  // Step 4: Credit Risk Assessment
  const isStep4Complete = Boolean(
    isStep3Complete && risk && risk.score != null
  );

  // Step 5: Analyst Decision
  const isStep5Complete = Boolean(
    isStep4Complete &&
    (existingRecommendation?.recommendation === 'RECOMMEND' ||
      (app?.eligibility?.factors as any)?.decision === 'ELIGIBLE' ||
      app?.status === 'UNDERWRITING')
  );

  // Step 6: Underwriter Handover
  const isStep6Complete = Boolean(
    app?.status === 'UNDERWRITING' || ['APPROVED', 'REJECTED', 'DISBURSED'].includes(app?.status)
  );

  // Check if a step is unlocked - Strict sequential gating: Steps 3-6 require Step 2 100% complete
  const isStepUnlocked = (step: StepNumber): boolean => {
    if (step === 1) return true;
    if (step === 2) return isStep1Complete;
    if (step === 3) return isStep1Complete && isStep2Complete;
    if (step === 4) return isStep1Complete && isStep2Complete && isStep3Complete;
    if (step === 5) return isStep1Complete && isStep2Complete && isStep3Complete && isStep4Complete;
    if (step === 6) return isStep1Complete && isStep2Complete && isStep3Complete && isStep4Complete && isStep5Complete;
    return false;
  };

  // Stepper Click Interceptor with user-friendly error notices
  const handleStepClick = (stepNum: StepNumber) => {
    if (!isStepUnlocked(stepNum)) {
      if (!isStep1Complete) {
        toast.warning('Please initiate Step 1 proposal appraisal before assessing documents.');
      } else if (!isStep2Complete) {
        if (isReturnedToLo) {
          toast.error('Assessment Blocked: Application is currently returned to Loan Officer / Customer for rectification.');
        } else if (ageError) {
          toast.error(`Assessment Blocked: Age policy violation (${ageError}). Proposal must be returned to Loan Officer.`);
        } else if (missingMandatoryDocs.length > 0) {
          toast.error(`Assessment Blocked: Missing mandatory intake documents (${missingMandatoryDocs.join(', ')}). Proposal must be returned to Loan Officer / Customer.`);
        } else if (unverifiedDocs.length > 0) {
          toast.error(`Assessment Blocked: ${unverifiedDocs.length} uploaded document(s) pending inspection & verification.`);
        } else {
          toast.error('Assessment Blocked: All KYC compliance criteria and mandatory documents must be complete & verified.');
        }
      } else {
        toast.warning(`Please complete Step ${stepNum - 1} before proceeding to Step ${stepNum}.`);
      }
      return;
    }
    setActiveStep(stepNum);
  };

  // Synchronize active step on load: STRICT gating - never bypass an incomplete step!
  useEffect(() => {
    if (app) {
      if (!isStep1Complete) setActiveStep(1);
      else if (!isStep2Complete) setActiveStep(2); // If Step 2 has deficiencies, STAY ON STEP 2!
      else if (!isStep3Complete) setActiveStep(3);
      else if (!isStep4Complete) setActiveStep(4);
      else if (!isStep5Complete) setActiveStep(5);
      else setActiveStep(6);
    }
  }, [isStep1Complete, isStep2Complete, isStep3Complete, isStep4Complete, isStep5Complete]);

  // ---------------------------------------------------------------------------
  // MUTATIONS
  // ---------------------------------------------------------------------------

  // Step 1: Start Credit Assessment Mutation
  const startAssessmentMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/credit/applications/${applicationId}/start-assessment`);
    },
    onSuccess: () => {
      toast.success('Credit Assessment initiated. Step 2 (KYC & Document Verification) unlocked.');
      refetch();
      refetchCapacity();
      queryClient.invalidateQueries({ queryKey: ['credit-queue'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setActiveStep(2);
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Failed to Start Assessment' });
    },
  });

  // Step 2: Verify KYC Mutation
  const verifyKycMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/credit/applications/${applicationId}/verify-kyc`, {
        kycStatus: 'VERIFIED',
        remarks: kycRemarks || 'KYC verified by Credit Analyst via government database matching',
      });
    },
    onSuccess: () => {
      toast.success('KYC verified successfully.');
      refetch();
      refetchCapacity();
      queryClient.invalidateQueries({ queryKey: ['credit-queue'] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'KYC Verification Error' });
    },
  });

  // Step 2: Verify Single Document Mutation
  const verifyDocMutation = useMutation({
    mutationFn: async (docId: string) => {
      const remarks = docRemarksMap[docId] || 'Document inspected and verified valid by Credit Analyst';
      return api.post(`/credit/applications/${applicationId}/verify-document`, {
        documentId: docId,
        status: 'VERIFIED',
        remarks,
      });
    },
    onSuccess: () => {
      toast.success('Document marked as verified.');
      refetch();
      refetchCapacity();
      queryClient.invalidateQueries({ queryKey: ['credit-queue'] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Document Verification Error' });
    },
  });

  // Step 2: Batch Verify All Uploaded Documents
  const batchVerifyMutation = useMutation({
    mutationFn: async () => {
      const docIds = documents.map((d) => d.id);
      if (docIds.length === 0) throw new Error('No uploaded documents available to verify.');
      return api.post(`/credit/applications/${applicationId}/batch-verify-documents`, {
        documentIds: docIds,
        status: 'VERIFIED',
        remarks: 'Batch verified all mandatory borrower documentation by Credit Analyst',
      });
    },
    onSuccess: () => {
      toast.success('All uploaded documents verified successfully.');
      refetch();
      refetchCapacity();
      queryClient.invalidateQueries({ queryKey: ['credit-queue'] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Batch Verification Error' });
    },
  });

  // Step 3: Run Policy Eligibility Engine
  const runEligibilityMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/eligibility/evaluate/${applicationId}`);
      return res.data?.data;
    },
    onSuccess: (result) => {
      toast.success(`Policy Eligibility Engine completed: ${result?.result || 'Evaluated'}`);
      refetch();
      refetchCapacity();
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Eligibility Engine Notice' });
    },
  });

  // Step 3: Interactive FOIR Recalculator

  const handleRecalculateFoir = () => {
    const inc = Number(calcIncome || 0);
    const obl = Number(calcObligations || 0);
    const p = Number(calcAmount || 0);
    const n = Number(calcTenure || 12);
    const r = Number(calcRate || 14.5) / 12 / 100;

    let emi = 0;
    if (r > 0 && n > 0 && p > 0) {
      emi = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    } else if (n > 0) {
      emi = Math.round(p / n);
    }

    const totalObl = obl + emi;
    const foirPct = inc > 0 ? Math.round((totalObl / inc) * 10000) / 100 : 100;

    const maxAllowed = foir?.maxAllowedFoirPct || 55;
    let status: 'PASS' | 'REVIEW' | 'FAIL' = 'PASS';
    if (foirPct > maxAllowed) status = 'FAIL';
    else if (foirPct > maxAllowed - 10) status = 'REVIEW';

    setLiveFoirResult({
      proposedEmi: emi,
      totalObligations: totalObl,
      foirPct,
      status,
    });

    toast.success(`Debt Capacity & FOIR recalculated: ${foirPct}% (${status})`);
  };

  // Step 4: Run 4-Pillar Risk Scoring Engine
  const runRiskMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/risk/evaluate/${applicationId}`);
      return res.data?.data;
    },
    onSuccess: (result) => {
      toast.success(`4-Pillar Risk Score evaluated: ${result?.score}/100 (${result?.category} Risk)`);
      refetch();
      refetchCapacity();
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Risk Engine Notice' });
    },
  });

  // Step 5: Submit Credit Analyst Manual Assessment Decision
  const submitDecisionMutation = useMutation({
    mutationFn: async () => {
      if (analystDecision === 'NOT_ELIGIBLE') {
        if (!rejectionReason || rejectionReason.trim().length < 5) {
          throw new Error('A policy rejection reason is mandatory when marking a borrower as Not Eligible.');
        }
        if (!notes || notes.trim().length < 5) {
          throw new Error('Please enter assessment justification notes (minimum 5 characters).');
        }
        return api.post(`/credit/applications/${applicationId}/decision`, {
          decision: 'NOT_ELIGIBLE',
          reason: notes.trim(),
          rejectionReason: rejectionReason.trim(),
        });
      }

      if (analystDecision === 'SEND_BACK') {
        if (!notes || notes.trim().length < 5) {
          throw new Error('A correction note/instruction is mandatory when sending back an application.');
        }
        return api.post(`/credit/applications/${applicationId}/return-to-loan-officer`, {
          reason: rejectionReason || 'Clarification / additional documents requested',
          note: notes.trim(),
          destination: sendBackDestination,
        });
      }

      // ELIGIBLE path
      return api.post(`/credit-assessment/${applicationId}/recommendation`, {
        recommendation: 'RECOMMEND',
        proposedAmount: Number(proposedAmount || app?.requestedAmount),
        proposedTenureMonths: Number(proposedTenure || app?.tenureMonths),
        proposedInterestRate: Number(proposedRate || product?.interestRate),
        conditions: conditions.trim() || undefined,
        notes: notes.trim(),
      });
    },
    onSuccess: () => {
      if (analystDecision === 'ELIGIBLE') {
        toast.success('Manual Credit Assessment: ELIGIBLE recorded. Unlocked Step 6: Underwriter Handover.');
        refetch();
        refetchCapacity();
        setActiveStep(6);
      } else if (analystDecision === 'NOT_ELIGIBLE') {
        toast.success('Manual Credit Assessment: NOT ELIGIBLE recorded. Application status updated.');
        refetch();
        refetchCapacity();
        queryClient.invalidateQueries({ queryKey: ['credit-queue'] });
      } else {
        toast.success(`Application sent back to ${sendBackDestination === 'CUSTOMER' ? 'Customer' : 'Loan Officer'} for correction.`);
        refetch();
        refetchCapacity();
        queryClient.invalidateQueries({ queryKey: ['credit-queue'] });
        if (onBack) onBack();
      }
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Assessment Submission Notice' });
    },
  });

  // Step 6: Forward to Underwriter Mutation
  const forwardToUnderwritingMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/credit-assessment/${applicationId}/forward-underwriting`, {
        recommendationId: existingRecommendation?.id,
        forwardingNotes: notes || existingRecommendation?.notes || 'Credit assessment completed & verified. Handover to Underwriter for sanction.',
      });
    },
    onSuccess: () => {
      toast.success('Proposal successfully handed over to Underwriting Queue.');
      queryClient.invalidateQueries({ queryKey: ['credit-queue'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      if (onForwardSuccess) {
        onForwardSuccess();
      }
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Underwriter Handover Error' });
    },
  });

  // Return to Loan Officer Mutation (From Modal)
  const returnToLoMutation = useMutation({
    mutationFn: async () => {
      if (!returnNote.trim()) throw new Error('Please enter specific deficiency notes for the Loan Officer.');
      return api.post(`/credit/applications/${applicationId}/return-to-loan-officer`, {
        reason: returnReason,
        note: returnNote.trim(),
        destination: returnDestination,
      });
    },
    onSuccess: () => {
      toast.success(`Application returned to ${returnDestination === 'CUSTOMER' ? 'Customer' : 'Loan Officer'}.`);
      setReturnModalOpen(false);
      refetch();
      refetchCapacity();
      queryClient.invalidateQueries({ queryKey: ['credit-queue'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      if (onBack) onBack();
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Return Proposal Notice' });
    },
  });

  // Helper to open the Return to LO modal prefilled with missing items
  const openReturnModalWithDeficiencies = () => {
    const summaryList: string[] = [];
    if (ageError) summaryList.push(`Age: ${ageError}`);
    if (missingMandatoryDocs.length > 0) summaryList.push(`Missing: ${missingMandatoryDocs.join(', ')}`);
    if (isKycPending) summaryList.push('KYC Compliance Pending');
    if (unverifiedDocs.length > 0) summaryList.push(`Unverified Uploads: ${unverifiedDocs.map((d: any) => d.documentType || d.fileName).join(', ')}`);

    const summaryMissing = summaryList.join(' | ');

    setReturnReason(
      ageError
        ? `Age policy discrepancy: ${ageError}`
        : missingMandatoryDocs.length > 0
        ? `Missing Mandatory Documents: ${missingMandatoryDocs.slice(0, 2).join(', ')}`
        : 'KYC & Document Verification Deficiencies'
    );
    setReturnNote(
      `Credit assessment is strictly paused due to KYC/intake deficiencies: ${summaryMissing}. Please collect and upload missing documents or rectify borrower details and resubmit the application.`
    );
    setReturnDestination('LOAN_OFFICER');
    setReturnModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="p-12 text-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#2563EB]" />
        <p className="text-xs text-slate-500 font-medium">
          Loading Credit Assessment Workspace & Document Checklist...
        </p>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Failed to Load Assessment Dossier
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {apiErrorMessage(error)}
        </p>
        {onBack && (
          <Button size="sm" variant="secondary" onClick={onBack} className="mt-2 text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Assessment Queue
          </Button>
        )}
      </Card>
    );
  }

  const activeFoir = liveFoirResult || foir;

  return (
    <div className="space-y-6">
      {/* -----------------------------------------------------------------------
          TOP HEADER: BACK BUTTON, APPLICATION TITLE & ACTIONS
      ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onBack}
              className="gap-1.5 font-semibold text-xs cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessment Queue
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Credit Assessment: #{app?.applicationNo || applicationId}
              </h2>
              <Badge status={app?.status} />
            </div>
            <p className="text-xs text-slate-400">
              Borrower: <span className="font-semibold text-slate-700 dark:text-slate-200">{customer?.firstName} {customer?.lastName}</span> ({customer?.customerCode}) · Product: {product?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={openReturnModalWithDeficiencies}
            className="gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Return to Loan Officer
          </Button>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          APPLICATION RETURNED / DEFICIENCY PAUSED BANNER
      ----------------------------------------------------------------------- */}
      {isReturnedToLo && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/90 dark:bg-amber-950/40 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                Application Returned to Loan Officer / Customer for Rectification
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                This proposal is currently in <strong>{app?.status}</strong> status. Credit appraisal is strictly paused awaiting Loan Officer or Customer to complete missing intake documents or criteria and resubmit the application.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-900 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 shrink-0">
            WAITING FOR RESUBMISSION
          </span>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          6-STEP STRICT SEQUENTIAL TRACKER / STEPPER
      ----------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#1E2445] p-3 rounded-2xl border border-slate-200 dark:border-[#2B3566] shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { step: 1, label: 'Application', isComplete: isStep1Complete },
            { step: 2, label: 'KYC & Documents', isComplete: isStep2Complete },
            { step: 3, label: 'Financial Eligibility', isComplete: isStep3Complete },
            { step: 4, label: 'Credit Risk', isComplete: isStep4Complete },
            { step: 5, label: 'Analyst Decision', isComplete: isStep5Complete },
            { step: 6, label: 'Underwriter Handover', isComplete: isStep6Complete },
          ].map((item) => {
            const stepNum = item.step as StepNumber;
            const unlocked = isStepUnlocked(stepNum);
            const isCurrent = activeStep === stepNum;

            return (
              <button
                key={item.step}
                type="button"
                onClick={() => handleStepClick(stepNum)}
                title={
                  unlocked
                    ? item.label
                    : !isStep2Complete
                    ? 'Locked: Step 2 KYC, age verification, and all 5 mandatory intake documents must be verified first'
                    : `Locked: Step ${item.step - 1} must be completed first`
                }
                className={cn(
                  'p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between',
                  unlocked ? 'cursor-pointer' : 'opacity-50 bg-slate-50/50 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 cursor-not-allowed',
                  isCurrent
                    ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20 bg-blue-50/40 dark:bg-blue-950/20'
                    : item.isComplete
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Step {item.step}
                  </span>
                  {item.isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : unlocked ? (
                    <Unlock className="w-3.5 h-3.5 text-blue-500" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <p className={cn(
                  'text-xs font-bold truncate leading-tight',
                  isCurrent ? 'text-[#2563EB] dark:text-blue-400' :
                  item.isComplete ? 'text-slate-800 dark:text-slate-200' :
                  'text-slate-500'
                )}>
                  {item.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          STEP 1: APPLICATION REVIEW & START ASSESSMENT
      ----------------------------------------------------------------------- */}
      {activeStep === 1 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Step 1: Application Intake & Proposal Review
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review borrower details, requested loan terms, and initiate formal credit appraisal
              </p>
            </div>
            {isStep1Complete && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Assessment Initiated
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <p className="text-[11px] font-medium text-slate-400 uppercase">Borrower</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {customer?.firstName} {customer?.lastName}
              </p>
              <p className="text-xs text-slate-500">{customer?.customerCode} · {customer?.mobile}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <p className="text-[11px] font-medium text-slate-400 uppercase">Loan Product</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {product?.name} ({product?.code})
              </p>
              <p className="text-xs text-slate-500">Interest Rate: {product?.interestRate}% p.a.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <p className="text-[11px] font-medium text-slate-400 uppercase">Requested Loan</p>
              <p className="text-sm font-bold text-[#2563EB] dark:text-blue-400">
                {formatMoney(app?.requestedAmount)}
              </p>
              <p className="text-xs text-slate-500">Tenure: {app?.tenureMonths} Months</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <p className="text-[11px] font-medium text-slate-400 uppercase">Purpose</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {app?.purpose || 'Business / Personal Expansion'}
              </p>
              <p className="text-xs text-slate-500">Submitted: {formatDate(app?.createdAt)}</p>
            </div>
          </div>

          {!isStep1Complete ? (
            <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/70 dark:bg-blue-950/20 dark:border-blue-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-200">
                  Ready to start Credit Assessment?
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Starting credit assessment records this proposal in the credit pool and unlocks Step 2: KYC & Document Verification.
                </p>
              </div>
              <Button
                onClick={() => startAssessmentMutation.mutate()}
                disabled={startAssessmentMutation.isPending}
                className="gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shrink-0 cursor-pointer shadow-sm"
              >
                <Play className="w-4 h-4" />
                {startAssessmentMutation.isPending ? 'Starting Assessment...' : 'Start Credit Assessment'}
              </Button>
            </div>
          ) : (
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setActiveStep(2)}
                className="gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-sm"
              >
                Proceed to Step 2: KYC & Documents <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* -----------------------------------------------------------------------
          STEP 2: MERGED KYC & DOCUMENT VERIFICATION (MANDATORY APPRAISAL GATE)
      ----------------------------------------------------------------------- */}
      {activeStep === 2 && (
        <Card className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-5 h-5 text-[#2563EB]" />
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Step 2: KYC & Mandatory Document Verification
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verify customer identity compliance, inspect Customer 360 profile, and verify all intake documents
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                'px-3 py-1 rounded-full text-xs font-bold border',
                customer?.kycStatus === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
              )}>
                KYC: {customer?.kycStatus || 'PENDING'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2563EB] border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900">
                Docs: {verifiedDocCount}/{documents.length} Verified
              </span>
              {documents.length > 0 && unverifiedDocs.length > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => batchVerifyMutation.mutate()}
                  disabled={batchVerifyMutation.isPending}
                  className="gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Batch Verify All Docs
                </Button>
              )}
            </div>
          </div>

          {/* Customer Summary & Customer 360 Toggle (INLINE - NO NEW TAB) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-1">
              <span className="text-slate-400 font-medium">Borrower Name & Code</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {customer?.firstName} {customer?.lastName}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">{customer?.customerCode || 'CUST'}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-1">
              <span className="text-slate-400 font-medium">Date of Birth & Age</span>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {customer?.dateOfBirth ? formatDate(customer.dateOfBirth) : 'Not Provided'}
                </p>
                {borrowerAge !== null && (
                  <span className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold',
                    isAgeValid
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  )}>
                    {borrowerAge} yrs ({isAgeValid ? 'Eligible' : 'Mismatch'})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Policy: {minPolicyAge}–{maxPolicyAge} yrs · Gender: {customer?.gender || 'N/A'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-1">
              <span className="text-slate-400 font-medium">Government ID & PAN</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm font-mono">
                {customer?.panNumber ? `PAN: ${customer.panNumber}` : 'Govt ID Provided'}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold">
                {customer?.kycStatus === 'VERIFIED' ? '✓ Verified in DB' : 'Pending Verification'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 space-y-1 flex flex-col justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#2563EB]" /> Customer 360 Dossier
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCustomer360Open(!customer360Open)}
                className="gap-1.5 font-bold text-xs text-[#2563EB] border-blue-300 dark:border-blue-800 hover:bg-blue-100/60 mt-1 cursor-pointer w-full justify-between shadow-xs"
              >
                <span>{customer360Open ? 'Hide Customer 360' : 'Open Customer 360'}</span>
                {customer360Open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              INLINE CUSTOMER 360 PROFILE (OPENS IN-PLACE, NO NEW TAB)
          ------------------------------------------------------------------- */}
          {customer360Open && (
            <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-b from-blue-50/70 to-slate-50/50 dark:from-blue-950/30 dark:to-slate-900/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
              <div className="flex items-center justify-between border-b pb-3 border-blue-200/60 dark:border-blue-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {customer?.firstName?.[0] || 'C'}{customer?.lastName?.[0] || ''}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Customer 360 Profile: {customer?.firstName} {customer?.lastName}
                      </h4>
                      <span className="text-xs font-mono font-bold text-[#2563EB] bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                        {customer?.customerCode || 'CUST-360'}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {customer?.kycStatus || 'KYC PENDING'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Onboarded: {formatDate(customer?.createdAt)} · Mobile: {customer?.mobile || 'N/A'} · Email: {customer?.email || 'N/A'}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCustomer360Open(false)}
                  className="gap-1 text-xs font-semibold cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" /> Collapse 360 Dossier
                </Button>
              </div>

              {/* 4-Column Detailed Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Col 1: Personal & Demographics */}
                <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs border-b pb-1.5 border-slate-100 dark:border-slate-800">
                    <User className="w-3.5 h-3.5 text-[#2563EB]" /> Personal & Identity
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Full Legal Name:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{customer?.firstName} {customer?.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date of Birth:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{customer?.dateOfBirth ? formatDate(customer.dateOfBirth) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gender:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{customer?.gender || 'Not Specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">PAN Card:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{customer?.panNumber || 'Not Uploaded'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Aadhaar ID:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {customer?.aadhaarNumber ? `•••• •••• ${customer.aadhaarNumber.slice(-4)}` : 'On Record'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Col 2: Contact & Residential Details */}
                <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs border-b pb-1.5 border-slate-100 dark:border-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-[#2563EB]" /> Contact & Residence
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mobile Phone:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{customer?.mobile || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email Address:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">{customer?.email || 'N/A'}</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-slate-400 block text-[10px]">Residential Address:</span>
                      <p className="font-medium text-slate-700 dark:text-slate-300 leading-tight mt-0.5">
                        {customer?.addressLine || 'Address on file'}, {customer?.city || ''}, {customer?.state || ''} {customer?.pincode || ''}
                      </p>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">Residence Type:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{customer?.residenceType || 'Self-Owned'}</span>
                    </div>
                  </div>
                </div>

                {/* Col 3: Employment & Income Capacity */}
                <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs border-b pb-1.5 border-slate-100 dark:border-slate-800">
                    <Briefcase className="w-3.5 h-3.5 text-[#2563EB]" /> Employment & Income
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Occupation Type:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{customer?.occupationType || 'Salaried / Professional'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Employer / Firm:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">{customer?.employerName || 'Enterprise'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Verified Income:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(customer?.monthlyIncome || 0)}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Existing EMIs:</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{formatMoney(customer?.existingObligations || 0)}/mo</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold">Net Disposable:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatMoney(Math.max(0, Number(customer?.monthlyIncome || 0) - Number(customer?.existingObligations || 0)))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Col 4: Banking & Credit History */}
                <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs border-b pb-1.5 border-slate-100 dark:border-slate-800">
                    <Building2 className="w-3.5 h-3.5 text-[#2563EB]" /> Banking & Risk Status
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Risk Category:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{customer?.riskCategory || 'LOW'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Customer UUID:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[110px]">{customer?.id?.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Attached Docs:</span>
                      <span className="font-bold text-[#2563EB]">{documents.length} Uploaded</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Compliance Gate:</span>
                      <span className="font-bold text-emerald-600">{customer?.kycStatus === 'VERIFIED' ? 'Passed ✓' : 'Pending'}</span>
                    </div>
                    <div className="pt-1 text-[10px] text-slate-400">
                      Primary Branch: {customer?.branchId || app?.branchId || 'HO'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              DEFICIENCY & PENDING REQUIREMENTS ALERT (WITH RETURN TO LO BUTTON)
          ------------------------------------------------------------------- */}
          {hasDeficiencies && (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-900/50 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                      Mandatory KYC & Document Deficiencies Detected
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                      The proposal has incomplete verification or missing intake documents. Complete verification or return the proposal to the Loan Officer.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={openReturnModalWithDeficiencies}
                    className="gap-1.5 text-xs font-semibold text-amber-950 dark:text-amber-100 border border-amber-400 bg-amber-300 hover:bg-amber-400 dark:bg-amber-900/60 dark:hover:bg-amber-900/80 dark:border-amber-700 cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Return to Loan Officer
                  </Button>
                </div>
              </div>

              {/* 4-Column Breakdown of Deficiencies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 text-xs border-t border-amber-200 dark:border-amber-900/40">
                {/* 1. Missing Mandatory Documents */}
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/50 border border-amber-200 dark:border-amber-900/30 space-y-1">
                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Missing Mandatory Docs ({missingMandatoryDocs.length})
                  </span>
                  {missingMandatoryDocs.length === 0 ? (
                    <p className="text-emerald-600 dark:text-emerald-400 text-[11px]">All mandatory categories uploaded</p>
                  ) : (
                    <ul className="list-disc list-inside text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5">
                      {missingMandatoryDocs.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 2. Pending Document Verification */}
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/50 border border-amber-200 dark:border-amber-900/30 space-y-1">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Pending Verification ({unverifiedDocs.length})
                  </span>
                  {unverifiedDocs.length === 0 ? (
                    <p className="text-emerald-600 dark:text-emerald-400 text-[11px]">All uploaded documents verified</p>
                  ) : (
                    <ul className="list-disc list-inside text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5">
                      {unverifiedDocs.slice(0, 4).map((d: any, i: number) => (
                        <li key={i}>{d.documentType || d.fileName}</li>
                      ))}
                      {unverifiedDocs.length > 4 && (
                        <li className="text-slate-400">+ {unverifiedDocs.length - 4} more</li>
                      )}
                    </ul>
                  )}
                </div>

                {/* 3. Age Policy Check */}
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/50 border border-amber-200 dark:border-amber-900/30 space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#2563EB]" /> Age Policy Match
                  </span>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300">
                    Age: <strong>{borrowerAge !== null ? `${borrowerAge} yrs` : 'Missing DOB'}</strong> (Req: {minPolicyAge}–{maxPolicyAge} yrs)
                  </p>
                  {isAgeValid ? (
                    <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">✓ Age criteria matched</p>
                  ) : (
                    <p className="text-rose-600 dark:text-rose-400 text-[10px] font-bold">🔴 {ageError}</p>
                  )}
                </div>

                {/* 4. KYC Verification Action */}
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/50 border border-amber-200 dark:border-amber-900/30 space-y-1.5 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-blue-500" /> Identity KYC Status
                    </span>
                    <p className="text-[11px] mt-0.5">
                      Status: <strong className={customer?.kycStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600'}>{customer?.kycStatus || 'PENDING'}</strong>
                    </p>
                  </div>
                  {customer?.kycStatus !== 'VERIFIED' && (
                    <Button
                      size="sm"
                      onClick={() => verifyKycMutation.mutate()}
                      disabled={verifyKycMutation.isPending}
                      className="gap-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer py-1 px-2.5 h-auto self-start"
                    >
                      <Check className="w-3 h-3" /> Mark KYC Verified
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              DOCUMENT CHECKLIST TABLE WITH IN-APP PREVIEW & VERIFICATION
          ------------------------------------------------------------------- */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Intake Document Verification Checklist ({documents.length})
              </h4>
              <p className="text-[11px] text-slate-400">
                Click Preview to inspect file content; verify each record or batch verify
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              {documents.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p>No documents uploaded for this borrower.</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={openReturnModalWithDeficiencies}
                    className="text-xs font-semibold text-amber-800 border-amber-300"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Return to Loan Officer to Upload Documents
                  </Button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b text-[11px] font-bold uppercase text-slate-400 bg-slate-50 dark:bg-slate-900/40">
                      <th className="py-2.5 px-3">Document Category</th>
                      <th className="py-2.5 px-3">File Name</th>
                      <th className="py-2.5 px-3">Requirement</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Preview</th>
                      <th className="py-2.5 px-3 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {documents.map((doc: any) => {
                      const isDocVerified = doc.verified || doc.status === 'VERIFIED';
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {doc.documentType || doc.category || 'General Document'}
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                            {doc.fileName || 'document'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
                              MANDATORY
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {isDocVerified ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                ✓ VERIFIED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                ⚠ PENDING REVIEW
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setPreviewDoc(doc)}
                              className="gap-1 text-xs font-semibold cursor-pointer border-slate-200 dark:border-slate-700 py-1 px-2.5 h-auto"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                              <span>Preview</span>
                            </Button>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {!isDocVerified ? (
                              <Button
                                size="sm"
                                onClick={() => verifyDocMutation.mutate(doc.id)}
                                disabled={verifyDocMutation.isPending}
                                className="gap-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer py-1 px-2.5 h-auto shadow-xs"
                              >
                                <Check className="w-3 h-3" /> Verify Document
                              </Button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Inspected & Verified
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Completion Gate Banner: STRICT BEHAVIOR */}
          {isStep2Complete ? (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/20 dark:border-emerald-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold">
                  All KYC compliance criteria, age policy verification ({borrowerAge} yrs), and all 5 mandatory intake documents are fully verified. Proceed to Step 3: Financial Eligibility.
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => setActiveStep(3)}
                className="gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-sm shrink-0"
              >
                Proceed to Step 3: Financial Eligibility <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/90 dark:bg-rose-950/40 dark:border-rose-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-rose-950 dark:text-rose-200 font-bold">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span className="text-sm">🔴 STRICT GOVERNANCE GATE: Credit Assessment Strictly Paused</span>
                </div>
                <div className="text-xs text-rose-800 dark:text-rose-300 space-y-1 font-medium">
                  {ageError && (
                    <p className="flex items-center gap-1.5 text-rose-900 dark:text-rose-200 font-bold">
                      <span>❌ Age Policy Violation:</span> {ageError} (Policy requires {minPolicyAge}–{maxPolicyAge} yrs)
                    </p>
                  )}
                  {missingMandatoryDocs.length > 0 && (
                    <p className="flex items-center gap-1.5 text-rose-900 dark:text-rose-200 font-bold">
                      <span>❌ Missing Mandatory Documents ({missingMandatoryDocs.length}):</span> {missingMandatoryDocs.join(', ')}
                    </p>
                  )}
                  {unverifiedDocs.length > 0 && (
                    <p className="flex items-center gap-1.5 text-rose-900 dark:text-rose-200 font-bold">
                      <span>⚠️ Pending Document Reviews ({unverifiedDocs.length}):</span> Uploaded documents must be inspected and verified
                    </p>
                  )}
                  {isKycPending && (
                    <p className="flex items-center gap-1.5 text-rose-900 dark:text-rose-200 font-bold">
                      <span>⚠️ Identity KYC Incomplete:</span> Customer KYC status is currently {customer?.kycStatus || 'PENDING'}
                    </p>
                  )}
                  {isReturnedToLo && (
                    <p className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold">
                      <span>⚠️ Returned to Loan Officer:</span> Waiting for Loan Officer / Customer to rectify deficiencies and resubmit
                    </p>
                  )}
                  <p className="text-[11px] text-rose-700 dark:text-rose-400 pt-0.5">
                    This application <strong>cannot proceed to Step 3 (Financial Eligibility)</strong> until all mandatory documents and criteria are satisfied. Return this proposal to the Loan Officer or Customer for rectification.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  disabled={true}
                  className="text-xs font-semibold bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed opacity-75"
                  title="Cannot proceed while mandatory deficiencies exist"
                >
                  <Lock className="w-3.5 h-3.5 mr-1" /> Step 3 Locked
                </Button>
                <Button
                  size="sm"
                  onClick={openReturnModalWithDeficiencies}
                  className="gap-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-sm shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Return to Loan Officer / Customer
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* -----------------------------------------------------------------------
          STEP 3: FINANCIAL ELIGIBILITY (TEST 1 POLICY ENGINE & TEST 3 FOIR)
      ----------------------------------------------------------------------- */}
      {activeStep === 3 && (
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Step 3: Financial Eligibility & Policy Rules
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Run policy rules engine, recalculate live FOIR & debt-service ratios, and verify repayment capacity
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => runEligibilityMutation.mutate()}
                disabled={runEligibilityMutation.isPending}
                className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                {runEligibilityMutation.isPending ? 'Evaluating Policy...' : 'Run Policy Eligibility Engine'}
              </Button>
            </div>

            {/* Verdict Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-900 dark:text-purple-200">Policy Verdict:</span>
                <span className={cn(
                  'px-2.5 py-0.5 text-xs font-bold rounded-full',
                  eligibility?.overallResult === 'ELIGIBLE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                  eligibility?.overallResult === 'NOT_ELIGIBLE' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                )}>
                  {eligibility?.overallResult || 'ELIGIBLE'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span>Max Eligible: <strong className="text-purple-900 dark:text-purple-200">{formatMoney(eligibility?.maxEligibleAmount || app?.requestedAmount)}</strong></span>
                <span>Est. EMI: <strong className="text-purple-900 dark:text-purple-200">{formatMoney(eligibility?.estimatedEmi || 0)}/mo</strong></span>
              </div>
            </div>

            {/* Rules Breakdown Checklist */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                Automated Policy Rules Breakdown:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {(eligibility?.factors || [
                  { factor: 'Age Requirement', status: 'PASS', detail: 'Applicant meets age criteria (21-60)' },
                  { factor: 'Minimum Monthly Income', status: 'PASS', detail: `Income ₹${customer?.monthlyIncome || 0} meets min threshold` },
                  { factor: 'Debt-To-Income (DTI) Ratio', status: 'PASS', detail: `DTI ratio is within limits` },
                  { factor: 'KYC & Document Completeness', status: 'PASS', detail: 'Mandatory documentation verified' },
                ]).map((f: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    {f.status === 'PASS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{f.factor}</span>
                      <p className="text-[11px] text-slate-500">{f.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Interactive FOIR Recalculator */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#2563EB]" />
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Interactive Debt Capacity & FOIR Recalculator
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Adjust verified parameters to stress-test borrower repayment capacity in real time
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleRecalculateFoir}
                className="gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Recalculate Live Capacity
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Monthly Income (₹)</label>
                <Input
                  type="number"
                  value={calcIncome}
                  onChange={(e) => setCalcIncome(e.target.value === '' ? '' : Number(e.target.value))}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Existing EMIs (₹)</label>
                <Input
                  type="number"
                  value={calcObligations}
                  onChange={(e) => setCalcObligations(e.target.value === '' ? '' : Number(e.target.value))}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Loan Amount (₹)</label>
                <Input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tenure (Months)</label>
                <Input
                  type="number"
                  value={calcTenure}
                  onChange={(e) => setCalcTenure(e.target.value === '' ? '' : Number(e.target.value))}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Interest Rate (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={calcRate}
                  onChange={(e) => setCalcRate(e.target.value === '' ? '' : Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Recalculation Results */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Proposed Monthly EMI:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatMoney(activeFoir?.proposedEmi || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Total Monthly Debt Service:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatMoney(activeFoir?.totalObligations || activeFoir?.totalMonthlyObligations || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Debt-to-Income (FOIR):</span>
                <span className={cn(
                  'font-bold text-sm',
                  activeFoir?.status === 'PASS' ? 'text-emerald-600' :
                  activeFoir?.status === 'REVIEW' ? 'text-amber-600' : 'text-red-600'
                )}>
                  {activeFoir?.foirPct}% (Institution Cap: {foir?.maxAllowedFoirPct || 55}%)
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setActiveStep(4)}
                className="gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-sm"
              >
                Proceed to Step 4: Credit Risk <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          STEP 4: CREDIT RISK ASSESSMENT (TEST 4: 4-PILLAR RISK SCORING)
      ----------------------------------------------------------------------- */}
      {activeStep === 4 && (
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Step 4: 4-Pillar Credit Risk Scoring Engine
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Calculate multidimensional risk across Capacity, Bureau History, Employment Vintage, and Document Completeness
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => runRiskMutation.mutate()}
                disabled={runRiskMutation.isPending}
                className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                {runRiskMutation.isPending ? 'Scoring Risk...' : 'Compute Risk Score'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-lg text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-rose-900 dark:text-rose-200">Risk Assessment Tier:</span>
                <span className={cn(
                  'px-2.5 py-0.5 text-xs font-bold rounded-full',
                  risk?.category === 'LOW' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                  risk?.category === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                )}>
                  {risk?.category || 'LOW'} RISK
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-rose-700 dark:text-rose-300">{risk?.score || 78}</span>
                <span className="text-slate-400 text-[10px]">/ 100</span>
              </div>
            </div>

            {/* 4 Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {(risk?.factors || [
                { name: 'Employment Vintage & Stability', score: 80, weight: 25, remarks: 'Verified experience' },
                { name: 'Debt Service Capacity & Cash Flow', score: 95, weight: 30, remarks: 'Healthy FOIR' },
                { name: 'KYC & Document Completeness', score: 85, weight: 20, remarks: 'Compliance satisfied' },
                { name: 'Credit History & Default Risk', score: 90, weight: 25, remarks: 'Clean track record' },
              ]).map((pillar: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{pillar.name}</span>
                    <span className="text-slate-400">{pillar.weight}% wt</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-[#2563EB]">{pillar.score}</span>
                    <span className="text-[10px] text-slate-400">/ 100</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{pillar.remarks}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setActiveStep(5)}
                className="gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-sm"
              >
                Proceed to Step 5: Analyst Decision <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* AI Intelligence & What-if simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <CreditIntelligenceCard applicationId={applicationId} applicationNo={app?.applicationNo} />
            {product && (
              <DecisionSimulatorCard
                applicationId={applicationId}
                applicationNo={app?.applicationNo}
                baseAmount={Number(app?.requestedAmount || 500000)}
                baseTenure={Number(app?.tenureMonths || 36)}
                baseRate={Number(product?.interestRate || 14.5)}
                baseIncome={Number(customer?.monthlyIncome || 0)}
                baseObligations={Number(customer?.existingObligations || 0)}
              />
            )}
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          STEP 5: CREDIT ANALYST FINAL MANUAL ASSESSMENT DECISION
      ----------------------------------------------------------------------- */}
      {activeStep === 5 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Step 5: Credit Analyst Final Assessment Decision
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review objective automated engine results, then manually record your official credit decision
              </p>
            </div>
          </div>

          {/* Comprehensive Objective Summary (System Recommendation vs Manual Decision) */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                System Assessment Summary (Objective Findings):
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
                System Recommendation: {eligibility?.overallResult || 'ELIGIBLE'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/50">
                <span className="text-slate-400 block text-[11px]">KYC Status</span>
                <span className="font-bold text-emerald-600">✓ VERIFIED</span>
              </div>
              <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/50">
                <span className="text-slate-400 block text-[11px]">Documents</span>
                <span className="font-bold text-emerald-600">✓ Mandatory Verified</span>
              </div>
              <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/50">
                <span className="text-slate-400 block text-[11px]">Calculated FOIR</span>
                <span className="font-bold">{activeFoir?.foirPct}%</span>
              </div>
              <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/50">
                <span className="text-slate-400 block text-[11px]">Risk Grade</span>
                <span className="font-bold">{risk?.score || 78}/100 ({risk?.category || 'LOW'})</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Notice: The automated findings above serve as decision assistance. The Credit Analyst must exercise independent judgment and record the formal assessment below.
            </p>
          </div>

          {/* Three Decision Options */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-2">
                Select Your Assessment Decision *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAnalystDecision('ELIGIBLE')}
                  className={cn(
                    'p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1',
                    analystDecision === 'ELIGIBLE'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">[ ELIGIBLE ]</span>
                    {analystDecision === 'ELIGIBLE' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Confirm borrower meets eligibility criteria and unlock Step 6 (Underwriter Handover).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAnalystDecision('NOT_ELIGIBLE')}
                  className={cn(
                    'p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1',
                    analystDecision === 'NOT_ELIGIBLE'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-300">[ NOT ELIGIBLE ]</span>
                    {analystDecision === 'NOT_ELIGIBLE' && <XCircle className="w-4 h-4 text-rose-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Mark borrower as Not Eligible based on credit assessment policy criteria.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAnalystDecision('SEND_BACK')}
                  className={cn(
                    'p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1',
                    analystDecision === 'SEND_BACK'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">[ SEND BACK ]</span>
                    {analystDecision === 'SEND_BACK' && <RotateCcw className="w-4 h-4 text-amber-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Send file back to Loan Officer or Customer for additional documents or clarifications.
                  </p>
                </button>
              </div>
            </div>

            {/* Decision Fields based on selection */}
            {analystDecision === 'ELIGIBLE' && (
              <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Recommended Sanction Amount (₹) *
                    </label>
                    <Input
                      type="number"
                      value={proposedAmount}
                      onChange={(e) => setProposedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Recommended Tenure (Months) *
                    </label>
                    <Input
                      type="number"
                      value={proposedTenure}
                      onChange={(e) => setProposedTenure(e.target.value === '' ? '' : Number(e.target.value))}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Recommended Interest Rate (%) *
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={proposedRate}
                      onChange={(e) => setProposedRate(e.target.value === '' ? '' : Number(e.target.value))}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Assessment Stipulations / Conditions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Subject to submission of original salary certificate before disbursement..."
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            )}

            {analystDecision === 'NOT_ELIGIBLE' && (
              <div className="p-4 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-rose-900 dark:text-rose-200 block mb-1">
                    Mandatory Policy Rejection Reason *
                  </label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800 font-medium"
                  >
                    <option value="Repayment capacity is insufficient based on verified income and existing obligations">
                      Repayment capacity is insufficient based on verified income and existing obligations (FOIR breached)
                    </option>
                    <option value="Borrower age or employment vintage does not satisfy product minimum policy">
                      Borrower age or employment vintage does not satisfy product minimum policy
                    </option>
                    <option value="Adverse internal credit risk score or past default track record">
                      Adverse internal credit risk score or past default track record
                    </option>
                    <option value="Unsatisfactory debt service ratio exceeding maximum institutional limits">
                      Unsatisfactory debt service ratio exceeding maximum institutional limits
                    </option>
                  </select>
                </div>
              </div>
            )}

            {analystDecision === 'SEND_BACK' && (
              <div className="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 block mb-1">
                    Send Back Destination *
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="sendBackDest"
                        checked={sendBackDestination === 'LOAN_OFFICER'}
                        onChange={() => setSendBackDestination('LOAN_OFFICER')}
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Loan Officer (Intake correction)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="sendBackDest"
                        checked={sendBackDestination === 'CUSTOMER'}
                        onChange={() => setSendBackDestination('CUSTOMER')}
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Borrower (Direct clarification)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Assessment Notes & Rationale */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                Assessment Justification & Notes *
              </label>
              <textarea
                rows={3}
                placeholder="Enter credit appraisal rationale, findings on income, risk observations, or instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
              />
            </div>

            {/* Submission Action */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => submitDecisionMutation.mutate()}
                disabled={submitDecisionMutation.isPending}
                className={cn(
                  'gap-2 text-white font-semibold text-xs cursor-pointer shadow-sm',
                  analystDecision === 'ELIGIBLE' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  analystDecision === 'NOT_ELIGIBLE' ? 'bg-rose-600 hover:bg-rose-700' :
                  'bg-amber-600 hover:bg-amber-700'
                )}
              >
                <Check className="w-4 h-4" />
                {submitDecisionMutation.isPending ? 'Submitting Decision...' :
                  analystDecision === 'ELIGIBLE' ? 'Save Eligible Assessment & Unlock Handover' :
                  analystDecision === 'NOT_ELIGIBLE' ? 'Submit Not Eligible Decision' :
                  'Send Back Proposal'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* -----------------------------------------------------------------------
          STEP 6: UNDERWRITER HANDOVER (ONLY UNLOCKED IF ELIGIBLE)
      ----------------------------------------------------------------------- */}
      {activeStep === 6 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Step 6: Underwriter Handover & Sanction Queue Forwarding
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review complete assessment packet and forward proposal to the Underwriter for sanction decision
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Ready for Underwriter
            </span>
          </div>

          {/* Dossier Summary Box */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
              Completed Credit Assessment Dossier
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Analyst Decision</span>
                <span className="font-bold text-emerald-600">✓ ELIGIBLE</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Recommended Sanction</span>
                <span className="font-bold text-[#2563EB]">
                  {formatMoney(existingRecommendation?.proposedAmount || proposedAmount || app?.requestedAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Tenure / Rate</span>
                <span className="font-bold">
                  {existingRecommendation?.proposedTenureMonths || proposedTenure || app?.tenureMonths} Months @ {existingRecommendation?.proposedInterestRate || proposedRate || product?.interestRate}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Assessed Risk</span>
                <span className="font-bold text-emerald-600">
                  {risk?.score || 78}/100 ({risk?.category || 'LOW'})
                </span>
              </div>
            </div>

            {existingRecommendation?.notes && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">Analyst Notes:</span>
                <p className="text-slate-700 dark:text-slate-300 italic">{existingRecommendation.notes}</p>
              </div>
            )}
          </div>

          {/* Forward Handover Action */}
          <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 dark:border-blue-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-blue-950 dark:text-blue-200">
                Handover to Underwriting Authority
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Forwarding transitions proposal status to <span className="font-semibold">UNDERWRITING</span> and assigns the dossier to the Sanction Committee for final sanction.
              </p>
            </div>
            <Button
              onClick={() => forwardToUnderwritingMutation.mutate()}
              disabled={forwardToUnderwritingMutation.isPending || app?.status === 'UNDERWRITING'}
              className="gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4" />
              {app?.status === 'UNDERWRITING' ? 'Already Forwarded to Underwriter' :
               forwardToUnderwritingMutation.isPending ? 'Forwarding Dossier...' :
               'Forward to Underwriter →'}
            </Button>
          </div>
        </Card>
      )}

      {/* -----------------------------------------------------------------------
          DOCUMENT IN-APP PREVIEW MODAL (IN-APP VIEWING - NO NEW TAB)
      ----------------------------------------------------------------------- */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E2445] rounded-2xl border border-slate-200 dark:border-[#2B3566] p-5 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#2563EB]" />
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Document Inspection: {previewDoc.documentType || previewDoc.category || 'Intake Document'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {previewDoc.fileName || 'document'} · Status: {previewDoc.verified || previewDoc.status === 'VERIFIED' ? '✓ Verified' : 'Pending Review'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Content Area */}
            <div className="flex-1 overflow-auto max-h-[58vh] bg-slate-100 dark:bg-slate-900/70 rounded-xl p-3 flex items-center justify-center min-h-[250px]">
              {previewDoc.storageKey ? (
                previewDoc.storageKey.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/) ||
                previewDoc.storageKey.includes('/customer_photos/') ||
                previewDoc.storageKey.includes('/kyc_documents/') ||
                previewDoc.storageKey.startsWith('https://res.cloudinary.com') ? (
                  <img
                    src={previewDoc.storageKey}
                    alt={previewDoc.fileName}
                    className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                ) : previewDoc.storageKey.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewDoc.storageKey}
                    title={previewDoc.fileName}
                    className="w-full h-[55vh] rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="p-8 text-center space-y-2">
                    <FileText className="w-12 h-12 text-[#2563EB] mx-auto opacity-70" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {previewDoc.fileName}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Storage: {previewDoc.storageKey}
                    </p>
                    <a
                      href={previewDoc.storageKey}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline pt-2"
                    >
                      <Download className="w-3.5 h-3.5" /> Download / Open Raw File
                    </a>
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No binary storage key available for this document record.
                </div>
              )}
            </div>

            {/* Verification & Remarks in Preview */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
                <Input
                  placeholder="Analyst verification remarks (optional)..."
                  value={docRemarksMap[previewDoc.id] || ''}
                  onChange={(e) =>
                    setDocRemarksMap((prev) => ({ ...prev, [previewDoc.id]: e.target.value }))
                  }
                  className="text-xs py-1.5 h-8"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                {!(previewDoc.verified || previewDoc.status === 'VERIFIED') ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      verifyDocMutation.mutate(previewDoc.id);
                      setPreviewDoc({ ...previewDoc, verified: true, status: 'VERIFIED' });
                    }}
                    disabled={verifyDocMutation.isPending}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {verifyDocMutation.isPending ? 'Verifying...' : 'Verify This Document'}
                  </Button>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Document Verified
                  </span>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPreviewDoc(null)}
                  className="text-xs font-semibold"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          RETURN TO LOAN OFFICER MODAL
      ----------------------------------------------------------------------- */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E2445] rounded-2xl border border-slate-200 dark:border-[#2B3566] p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Return Application to Loan Officer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Returning this proposal will move status back to <span className="font-semibold text-slate-700 dark:text-slate-300">SUBMITTED</span> and notify the Loan Officer to upload missing documents or rectify borrower details.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Return Destination *
              </label>
              <div className="flex items-center gap-4 text-xs pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="modalReturnDest"
                    checked={returnDestination === 'LOAN_OFFICER'}
                    onChange={() => setReturnDestination('LOAN_OFFICER')}
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Loan Officer (Intake Desk)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="modalReturnDest"
                    checked={returnDestination === 'CUSTOMER'}
                    onChange={() => setReturnDestination('CUSTOMER')}
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Borrower / Customer (Direct re-upload)</span>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Primary Deficiency Reason *
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className={cn(
                  'w-full px-3 py-2 text-xs rounded-lg border font-medium bg-white dark:bg-slate-900',
                  isDark ? 'border-slate-700 text-slate-100' : 'border-slate-300 text-slate-800'
                )}
              >
                <option value="Missing mandatory income proof (Salary Slips / ITR)">Missing mandatory income proof (Salary Slips / ITR)</option>
                <option value="Missing mandatory bank statement (Latest 6 Months)">Missing mandatory bank statement (Latest 6 Months)</option>
                <option value="Borrower age does not match product eligibility policy">Borrower age does not match product eligibility policy</option>
                <option value="Address Proof is missing/unverified">Address Proof is missing/unverified</option>
                <option value="Income statement / Salary slips unreadable or incomplete">Income statement / Salary slips unreadable or incomplete</option>
                <option value="Bank statement missing last 6 months transactions">Bank statement missing last 6 months transactions</option>
                <option value="Aadhaar / Government identity document requires re-upload">Aadhaar / Government identity document requires re-upload</option>
                <option value="Borrower contact / employment details mismatch">Borrower contact / employment details mismatch</option>
                <option value="Other documentation rectification required">Other documentation rectification required</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Detailed Note for {returnDestination === 'CUSTOMER' ? 'Customer' : 'Loan Officer'} *
              </label>
              <textarea
                rows={3}
                placeholder="Explain clearly what document is missing or what correction is required..."
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                className={cn(
                  'w-full px-3 py-2 text-xs rounded-lg border font-normal',
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setReturnModalOpen(false)}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => returnToLoMutation.mutate()}
                disabled={returnToLoMutation.isPending}
                className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
              >
                {returnToLoMutation.isPending ? 'Returning...' : returnDestination === 'CUSTOMER' ? 'Confirm Return to Customer' : 'Confirm Return to Loan Officer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
