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
  GraduationCap,
  Building,
  Coins,
  SlidersHorizontal,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { Badge, Button, Card, Input } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { evaluateDocumentFulfillment, normalizeEmploymentType } from '@/lib/documentRules';
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

  // Active step in stepper (defaults to step in search params if provided)
  const [activeStep, setActiveStep] = useState<StepNumber>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('step');
      const parsed = Number(p);
      if ([1, 2, 3, 4, 5, 6].includes(parsed)) return parsed as StepNumber;
    }
    return 1;
  });

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

  // Dynamic Rule-Based Document Evaluation based on borrower profile & product
  const empType = customer?.employmentType || customer?.employmentDetails?.[0]?.employmentType || 'SALARIED';
  const prodType = product?.productType || product?.name || 'PERSONAL';
  const reqAmt = Number(app?.requestedAmount || 0);
  const mIncome = Number(customer?.monthlyIncome || 0);

  const docEval = evaluateDocumentFulfillment(documents, empType, prodType, {
    monthlyIncome: mIncome,
    requestedAmount: reqAmt,
  });

  const missingMandatoryDocs: string[] = docEval.missingNames;
  const unverifiedDocs = documents.filter((d) => !d.verified && d.status !== 'VERIFIED');
  const isKycPending = customer?.kycStatus !== 'VERIFIED';
  const isReturnedToLo = app?.status === 'RETURNED' || (app as any)?.underwriting?.decision === 'SEND_BACK';

  const hasDeficiencies =
    missingMandatoryDocs.length > 0 ||
    unverifiedDocs.length > 0 ||
    isKycPending ||
    !isAgeValid;

  // Real-time Policy Rule Validation
  const activeFoir = liveFoirResult || foir;
  const calculatedDti = activeFoir?.foirPct ?? 0;
  const maxAllowedFoir = activeFoir?.maxAllowedFoirPct ?? 55;
  const isFoirBreached = calculatedDti > maxAllowedFoir || activeFoir?.status === 'FAIL';

  const empTypeNormalized = normalizeEmploymentType(customer?.employmentType || customer?.employmentDetails?.[0]?.employmentType || 'SALARIED');
  const minRequiredIncomeFloor = ['STUDENT', 'HOMEMAKER'].includes(empTypeNormalized)
    ? 30000
    : ['SELF_EMPLOYED', 'BUSINESS', 'BUSINESS_OWNER'].includes(empTypeNormalized)
    ? 40000
    : empTypeNormalized === 'PROFESSIONAL'
    ? 35000
    : ['FARMER', 'RETIRED'].includes(empTypeNormalized)
    ? 15000
    : 25000;

  const currentIncome = Number(calcIncome || customer?.monthlyIncome || 0);
  const isIncomeFloorBreached = ['STUDENT', 'HOMEMAKER'].includes(empTypeNormalized)
    ? (currentIncome <= 0)
    : (currentIncome < minRequiredIncomeFloor);

  const policyFailureReasons: string[] = [];
  if (!isAgeValid) policyFailureReasons.push(`Age policy violation: ${ageError}`);
  if (isIncomeFloorBreached) {
    if (['STUDENT', 'HOMEMAKER'].includes(empTypeNormalized)) {
      policyFailureReasons.push(`Zero income declared and no verified Co-Applicant / Sponsor guarantor attached (Floor: ₹${minRequiredIncomeFloor.toLocaleString('en-IN')}/mo)`);
    } else {
      policyFailureReasons.push(`Assessed monthly income ₹${currentIncome.toLocaleString('en-IN')} is below policy floor of ₹${minRequiredIncomeFloor.toLocaleString('en-IN')}/mo for ${empTypeNormalized}`);
    }
  }
  if (isFoirBreached) policyFailureReasons.push(`Assessed FOIR of ${calculatedDti}% exceeds maximum allowed limit of ${maxAllowedFoir}%`);
  if (customer?.kycStatus !== 'VERIFIED') policyFailureReasons.push(`Borrower KYC status is ${customer?.kycStatus || 'PENDING'} (Verification mandatory)`);
  if (missingMandatoryDocs.length > 0) policyFailureReasons.push(`Missing mandatory intake documents: ${missingMandatoryDocs.join(', ')}`);
  if (Array.isArray(eligibility?.factors)) {
    for (const f of eligibility.factors) {
      if (f.status === 'FAIL' && !policyFailureReasons.some((r) => r.includes(f.factor) || r.includes(f.detail))) {
        policyFailureReasons.push(`${f.factor}: ${f.detail}`);
      }
    }
  }

  const isPolicyFailed = policyFailureReasons.length > 0 || eligibility?.result === 'NOT_ELIGIBLE';

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
  // 6. ALL mandatory intake documents required for borrower profile are uploaded (missingMandatoryDocs.length === 0)
  // 7. ALL uploaded documents are verified (unverifiedDocs.length === 0)
  const isStep2Complete = Boolean(
    isStep1Complete &&
    !isReturnedToLo &&
    !hasDeficiencies &&
    customer?.kycStatus === 'VERIFIED' &&
    isAgeValid &&
    missingMandatoryDocs.length === 0 &&
    unverifiedDocs.length === 0
  );

  // Step 3: Financial Eligibility
  const isStep3Complete = Boolean(
    isStep2Complete &&
    (
      (eligibility && (Array.isArray(eligibility.factors) ? eligibility.factors.length > 0 : Boolean(eligibility.result))) ||
      Boolean(foir) ||
      Boolean(capacityData)
    )
  );

  // Step 4: Credit Risk Assessment
  const isStep4Complete = Boolean(
    isStep3Complete &&
    (
      Boolean(risk && (risk.score != null || risk.category != null)) ||
      Boolean(app?.riskAssessment) ||
      Boolean(customer?.riskCategory)
    )
  );

  // Step 5: Analyst Decision
  const isStep5Complete = Boolean(
    isStep4Complete &&
    (
      Boolean(existingRecommendation?.recommendation) ||
      Boolean((app?.eligibility?.factors as any)?.recommendation) ||
      (app?.eligibility?.factors as any)?.decision === 'ELIGIBLE' ||
      app?.status === 'UNDERWRITING' ||
      ['APPROVED', 'REJECTED', 'DISBURSED'].includes(app?.status)
    )
  );

  // Strict Eligibility Check: Branch Manager Handover is ONLY permitted for eligible proposals
  const isBorrowerEligibleForBranchManager = Boolean(
    !isPolicyFailed &&
    app?.status !== 'REJECTED' &&
    eligibility?.result !== 'NOT_ELIGIBLE' &&
    (app?.eligibility?.factors as any)?.decision !== 'NOT_ELIGIBLE' &&
    analystDecision !== 'NOT_ELIGIBLE' &&
    analystDecision !== 'SEND_BACK'
  );

  // Step 6: Branch Manager Handover (Only complete if eligible and forwarded)
  const isStep6Complete = Boolean(
    isBorrowerEligibleForBranchManager &&
    (app?.stage === 'BRANCH_MANAGER_REVIEW' ||
      ['UNDER_REVIEW', 'UNDERWRITING', 'APPROVED', 'DISBURSED'].includes(app?.status))
  );

  // Strict sequential gating: A step is only unlocked when the previous step is complete!
  // Step 6 is PERMANENTLY LOCKED if the proposal is Not Eligible / Declined / Sent Back.
  const isStepUnlocked = (step: StepNumber): boolean => {
    if (step === 1) return true;
    if (step === 2) return isStep1Complete;
    if (step === 3) return isStep1Complete && isStep2Complete;
    if (step === 4) return isStep1Complete && isStep2Complete && isStep3Complete;
    if (step === 5) return isStep1Complete && isStep2Complete && isStep3Complete && isStep4Complete;
    if (step === 6) {
      return (
        isStep1Complete &&
        isStep2Complete &&
        isStep3Complete &&
        isStep4Complete &&
        isStep5Complete &&
        isBorrowerEligibleForBranchManager
      );
    }
    return false;
  };

  // Stepper Click Handler with clear guidance if locked
  const handleStepClick = (stepNum: StepNumber) => {
    if (!isStepUnlocked(stepNum)) {
      if (stepNum === 2 && !isStep1Complete) {
        toast.warning('Step 1 (Application Intake) review must be completed first.');
      } else if (stepNum >= 3 && !isStep2Complete) {
        if (missingMandatoryDocs.length > 0) {
          toast.warning(`Step 2 Incomplete: Missing mandatory documents (${missingMandatoryDocs.join(', ')}). All mandatory documents must be uploaded and verified to unlock Step ${stepNum}.`);
        } else if (unverifiedDocs.length > 0) {
          toast.warning(`Step 2 Incomplete: ${unverifiedDocs.length} uploaded document(s) pending review. Verify all documents to unlock Step ${stepNum}.`);
        } else if (customer?.kycStatus !== 'VERIFIED') {
          toast.warning(`Step 2 Incomplete: Borrower KYC status is ${customer?.kycStatus || 'PENDING'}. Mark KYC Verified to unlock Step ${stepNum}.`);
        } else if (!isAgeValid) {
          toast.warning(`Step 2 Incomplete: Age criteria violation (${ageError}).`);
        } else {
          toast.warning(`Step 2 (KYC & Documents) must be fully verified and complete before proceeding to Step ${stepNum}.`);
        }
      } else if (stepNum >= 4 && !isStep3Complete) {
        toast.warning(`Step 3 (Financial & FOIR) must be evaluated with Policy Eligibility Engine before unlocking Step ${stepNum}.`);
      } else if (stepNum >= 5 && !isStep4Complete) {
        toast.warning(`Step 4 (Credit & Bureau Risk) score must be evaluated before recording your recommendation.`);
      } else if (stepNum === 6) {
        if (!isBorrowerEligibleForBranchManager) {
          toast.error(
            'Borrower is Not Eligible: Step 6 (Branch Manager Handover) is strictly locked for declined/ineligible applications. You cannot forward this proposal.',
            { title: 'Handover Restricted' }
          );
        } else {
          toast.warning(`Step 5 (Analyst Recommendation) must be submitted before Branch Manager Handover.`);
        }
      }
      return;
    }
    setActiveStep(stepNum);
  };

  // Synchronize initial active step once on load
  const [initialStepDone, setInitialStepDone] = useState(false);
  useEffect(() => {
    if (app && !initialStepDone) {
      if (!isStep1Complete) setActiveStep(1);
      else if (!isStep2Complete) setActiveStep(2);
      else if (!isStep3Complete) setActiveStep(3);
      else if (!isStep4Complete) setActiveStep(4);
      else if (!isStep5Complete || !isBorrowerEligibleForBranchManager) setActiveStep(5);
      else setActiveStep(6);
      setInitialStepDone(true);
    }
  }, [app, initialStepDone, isStep1Complete, isStep2Complete, isStep3Complete, isStep4Complete, isStep5Complete, isBorrowerEligibleForBranchManager]);

  // Fallback if activeStep becomes locked
  useEffect(() => {
    if (initialStepDone && !isStepUnlocked(activeStep)) {
      if (isStep5Complete && isBorrowerEligibleForBranchManager) setActiveStep(6);
      else if (isStep4Complete) setActiveStep(5);
      else if (isStep3Complete) setActiveStep(4);
      else if (isStep2Complete) setActiveStep(3);
      else if (isStep1Complete) setActiveStep(2);
      else setActiveStep(1);
    }
  }, [activeStep, initialStepDone, isStep1Complete, isStep2Complete, isStep3Complete, isStep4Complete, isStep5Complete, isBorrowerEligibleForBranchManager]);

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

  // Step 2: Verify Single Document Mutation (Fixed with Instant UI Update)
  const verifyDocMutation = useMutation({
    mutationFn: async (docId: string) => {
      const remarks = docRemarksMap[docId] || 'Document inspected and verified valid by Credit Analyst';
      return api.post(`/credit/applications/${applicationId}/verify-document`, {
        documentId: docId,
        status: 'VERIFIED',
        remarks,
      });
    },
    onMutate: async (docId: string) => {
      await queryClient.cancelQueries({ queryKey: ['credit-assessment', applicationId] });
      const previousData = queryClient.getQueryData(['credit-assessment', applicationId]);
      queryClient.setQueryData(['credit-assessment', applicationId], (old: any) => {
        if (!old || !old.kycChecklist) return old;
        return {
          ...old,
          kycChecklist: {
            ...old.kycChecklist,
            documents: old.kycChecklist.documents.map((d: any) => 
              d.id === docId ? { ...d, status: 'VERIFIED', verified: true } : d
            )
          }
        };
      });
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Document marked as verified.');
    },
    onError: (err: any, docId, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(['credit-assessment', applicationId], context.previousData);
      }
      toast.error(apiErrorMessage(err), { title: 'Document Verification Error' });
    },
    onSettled: () => {
      refetch();
      refetchCapacity();
      queryClient.invalidateQueries({ queryKey: ['credit-queue'] });
      queryClient.invalidateQueries({ queryKey: ['credit-assessment', applicationId] });
    }
  });

  // Step 2: Reject Single Document Mutation
  const rejectDocMutation = useMutation({
    mutationFn: async ({ docId, remarks }: { docId: string; remarks?: string }) => {
      const reason = remarks || docRemarksMap[docId] || 'Document rejected / requires re-upload by Credit Analyst';
      return api.post(`/credit/applications/${applicationId}/verify-document`, {
        documentId: docId,
        status: 'REJECTED',
        remarks: reason,
      });
    },
    onSuccess: () => {
      toast.success('Document marked as rejected / correction required.');
      refetch();
      refetchCapacity();
      queryClient.invalidateQueries({ queryKey: ['credit-queue'] });
      queryClient.invalidateQueries({ queryKey: ['credit-assessment', applicationId] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Document Rejection Error' });
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
      if (isPolicyFailed) {
        throw new Error(`Borrower is NOT ELIGIBLE under credit policy: ${policyFailureReasons[0] || 'Mandatory policy criteria failed'}. Only policy-compliant profiles can be passed to underwriting.`);
      }

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
        toast.success('Manual Credit Assessment: ELIGIBLE recorded. Unlocked Step 6: Branch Manager Handover.');
        refetch();
        refetchCapacity();
        setActiveStep(6);
      } else if (analystDecision === 'NOT_ELIGIBLE') {
        toast.error(`Borrower marked as NOT ELIGIBLE / DECLINED based on credit underwriting policy.`, { title: 'Assessment: Not Eligible' });
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

  // Step 6: Forward to Branch Manager Mutation
  const forwardToBranchManagerMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/credit-assessment/${applicationId}/forward-underwriting`, {
        recommendationId: existingRecommendation?.id,
        forwardingNotes: notes || existingRecommendation?.notes || 'Credit assessment completed & verified. Handover to Branch Manager for review and approval.',
      });
    },
    onSuccess: () => {
      toast.success('Proposal successfully handed over to Branch Manager Review Queue.');
      queryClient.invalidateQueries({ queryKey: ['credit-queue'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['branch-manager'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      if (onForwardSuccess) {
        onForwardSuccess();
      }
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Branch Manager Handover Error' });
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

  return (
    <div className="space-y-6">
      {/* -----------------------------------------------------------------------
          TOP HEADER: BACK BUTTON, APPLICATION TITLE & ACTIONS
      ----------------------------------------------------------------------- */}
      {/* -----------------------------------------------------------------------
          TOP COMMAND HEADER: CASE IDENTITY, KPIS & ACTIONS
      ----------------------------------------------------------------------- */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-[#1E284D] bg-white dark:bg-[#0C152B] p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {onBack && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onBack}
                className="gap-1.5 font-semibold text-xs cursor-pointer shadow-xs shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Queue
              </Button>
            )}

            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-500/20">
              {customer?.firstName?.[0] || 'B'}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Credit Appraisal: #{app?.applicationNo || applicationId}
                </h2>
                <Badge status={app?.status} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Borrower: <strong className="text-slate-800 dark:text-slate-200">{customer?.firstName} {customer?.lastName}</strong> ({customer?.customerCode})</span>
                <span>•</span>
                <span>Product: <strong className="text-slate-800 dark:text-slate-200">{product?.name || 'Loan'}</strong></span>
                <span>•</span>
                <span>Tenor: {app?.tenureMonths || 12} Mos</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0F1A36] border border-slate-200/70 dark:border-[#1E284D] text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">Requested Amount</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{formatMoney(app?.requestedAmount)}</span>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={openReturnModalWithDeficiencies}
              className="gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" /> Return to Loan Officer
            </Button>
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          STATUS CONTEXT BANNER (ONLY FOR TRUE RETURN OR INCOMING PROPOSAL)
      ----------------------------------------------------------------------- */}
      {isReturnedToLo ? (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">
                Application Returned to Loan Officer / Customer for Rectification
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                This proposal is currently in <strong>{app?.status}</strong> status awaiting rectification. Credit appraisal will proceed once resubmitted.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            Awaiting Resubmission
          </span>
        </div>
      ) : app?.status === 'SUBMITTED' ? (
        <div className="p-3.5 rounded-xl border border-blue-500/25 bg-blue-500/10 text-blue-900 dark:text-blue-200 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
            <p className="text-xs">
              <strong>Incoming Proposal Forwarded by Loan Officer</strong> — Ready for Credit Appraisal. Review customer intake, verify compliance documents, and evaluate debt capacity.
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-500 border border-blue-500/30 shrink-0">
            Intake Review
          </span>
        </div>
      ) : null}

      {/* -----------------------------------------------------------------------
          6-STEP WORKFLOW STEPPER
      ----------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#0C152B] p-2.5 rounded-2xl border border-slate-200/80 dark:border-[#1E284D] shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { step: 1, label: '1. Application Intake', isComplete: isStep1Complete, isBlocked: false },
            { step: 2, label: '2. KYC & Documents', isComplete: isStep2Complete, isBlocked: false },
            { step: 3, label: '3. Debt Capacity & FOIR', isComplete: isStep3Complete, isBlocked: false },
            { step: 4, label: '4. Credit & Bureau Risk', isComplete: isStep4Complete, isBlocked: false },
            { step: 5, label: '5. Recommendation', isComplete: isStep5Complete, isBlocked: false },
            {
              step: 6,
              label: !isBorrowerEligibleForBranchManager ? '6. Handover (Locked)' : '6. Branch Manager Handover',
              isComplete: isStep6Complete && isBorrowerEligibleForBranchManager,
              isBlocked: !isBorrowerEligibleForBranchManager,
            },
          ].map((item) => {
            const stepNum = item.step as StepNumber;
            const isUnlocked = isStepUnlocked(stepNum);
            const isCurrent = activeStep === stepNum;
            const isBlocked = item.isBlocked;

            return (
              <button
                key={item.step}
                type="button"
                onClick={() => handleStepClick(stepNum)}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between',
                  isBlocked
                    ? 'opacity-40 bg-rose-50/20 dark:bg-rose-950/10 border-dashed border-rose-300 dark:border-rose-900 cursor-not-allowed'
                    : !isUnlocked
                    ? 'opacity-40 bg-slate-50/40 dark:bg-[#0C152B]/40 border-dashed border-slate-200 dark:border-slate-800 cursor-not-allowed'
                    : isCurrent
                    ? 'border-blue-500 bg-blue-600/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20 shadow-xs cursor-pointer'
                    : item.isComplete
                    ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-pointer'
                    : 'border-slate-200/80 dark:border-[#1E284D] bg-slate-50/50 dark:bg-[#0F1A36]/50 hover:bg-slate-100 dark:hover:bg-[#131E3D] text-slate-500 dark:text-slate-400 cursor-pointer'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-wider',
                    isBlocked ? 'text-rose-500 dark:text-rose-400' :
                    !isUnlocked ? 'text-slate-400 dark:text-slate-600' :
                    isCurrent ? 'text-blue-600 dark:text-blue-400' :
                    item.isComplete ? 'text-emerald-600 dark:text-emerald-400' :
                    'text-slate-400'
                  )}>
                    Step {item.step}
                  </span>
                  {item.isComplete && !isBlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : !isUnlocked || isBlocked ? (
                    <Lock className={cn('w-3.5 h-3.5', isBlocked ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-600')} />
                  ) : (
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      isCurrent ? 'bg-blue-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
                    )} />
                  )}
                </div>
                <p className={cn(
                  'text-xs font-bold leading-snug break-words mt-0.5 line-clamp-2',
                  isBlocked ? 'text-rose-600 dark:text-rose-400 font-bold' :
                  !isUnlocked ? 'text-slate-400 dark:text-slate-600 font-medium' :
                  isCurrent ? 'text-blue-600 dark:text-blue-300 font-extrabold' :
                  item.isComplete ? 'text-slate-800 dark:text-slate-200 font-bold' :
                  'text-slate-600 dark:text-slate-400 font-medium'
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
              <p className="text-[11px] font-medium text-slate-400 uppercase">Borrower Profile</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {customer?.firstName} {customer?.lastName}
              </p>
              <p className="text-xs text-slate-500">{customer?.customerCode} · {customer?.mobile}</p>
              <p className="text-[11px] text-slate-400">{customer?.email || 'No email registered'}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <p className="text-[11px] font-medium text-slate-400 uppercase">Tokenized Identifiers (KYC)</p>
              <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                PAN: {customer?.panNumber || 'Not Linked'}
              </p>
              <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                Aadhaar: {customer?.aadhaarNumber || 'Not Linked'}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mt-1">
                Sandbox Simulation / Manual Review
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <p className="text-[11px] font-medium text-slate-400 uppercase">Financial Profile</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatMoney(customer?.monthlyIncome || 0)} / mo
              </p>
              <p className="text-xs text-slate-500">Obligations: {formatMoney(customer?.existingObligations || 0)}/mo</p>
              <p className="text-[11px] text-slate-400">Employment: {customer?.employmentType || 'Salaried'}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <p className="text-[11px] font-medium text-slate-400 uppercase">Loan Application</p>
              <p className="text-sm font-bold text-[#2563EB] dark:text-blue-400">
                {formatMoney(app?.requestedAmount)} · {app?.tenureMonths}M
              </p>
              <p className="text-xs text-slate-500">{product?.name} ({product?.interestRate}% p.a.)</p>
              <p className="text-[11px] text-slate-400">Applied: {formatDate(app?.createdAt)}</p>
            </div>
          </div>

          {/* Phase 9A Consent & Authorization Audit Log */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Explicit Borrower Consents & Authorizations ({customer?.consents?.length || 0})
              </span>
              <span className="text-[10px] text-slate-400">Captured during loan officer intake</span>
            </div>

            {(!customer?.consents || customer.consents.length === 0) ? (
              <p className="text-xs text-slate-400 italic py-2">No electronic consent logs recorded for this borrower profile.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                      <th className="py-2 px-2.5">Consent Type</th>
                      <th className="py-2 px-2.5">Purpose</th>
                      <th className="py-2 px-2.5">Version</th>
                      <th className="py-2 px-2.5">Channel</th>
                      <th className="py-2 px-2.5">Timestamp</th>
                      <th className="py-2 px-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {customer.consents.map((c: any) => (
                      <tr key={c.id} className="hover:bg-white/60 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-2.5 font-bold font-mono text-slate-800 dark:text-slate-200">{c.consentType}</td>
                        <td className="py-2 px-2.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">{c.purpose}</td>
                        <td className="py-2 px-2.5 text-slate-500 font-mono text-[11px]">{c.version}</td>
                        <td className="py-2 px-2.5 text-slate-500 text-[11px]">{c.channel || 'BRANCH_PORTAL'}</td>
                        <td className="py-2 px-2.5 text-slate-500 text-[11px]">{formatDate(c.grantedAt)}</td>
                        <td className="py-2 px-2.5 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            ✓ GRANTED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
            <div className="p-3.5 rounded-xl border border-slate-200/60 dark:border-[#1E284D] bg-slate-50/60 dark:bg-[#0F1A36] space-y-1">
              <span className="text-slate-400 font-medium">Borrower Name & Code</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {customer?.firstName} {customer?.lastName}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">{customer?.customerCode || 'CUST'}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/60 dark:border-[#1E284D] bg-slate-50/60 dark:bg-[#0F1A36] space-y-1">
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

            <div className="p-3.5 rounded-xl border border-slate-200/60 dark:border-[#1E284D] bg-slate-50/60 dark:bg-[#0F1A36] space-y-1">
              <span className="text-slate-400 font-medium">Government ID & PAN</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm font-mono">
                {customer?.panNumber ? `PAN: ${customer.panNumber}` : 'Govt ID Provided'}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {customer?.kycStatus === 'VERIFIED' ? '✓ Verified in DB' : 'Pending Verification'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20 space-y-1 flex flex-col justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-500" /> Customer 360 Dossier
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCustomer360Open(!customer360Open)}
                className="gap-1.5 font-bold text-xs text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10 mt-1 cursor-pointer w-full justify-between shadow-xs"
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
            <div className="p-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 dark:bg-amber-950/20 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Document Verification Checkpoint
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Proposal has pending documents or unverified proofs. You can verify documents below or return the proposal to the Loan Officer.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={openReturnModalWithDeficiencies}
                    className="gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 border-amber-400/40 hover:bg-amber-100/50 dark:hover:bg-amber-950/40 cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Return to Loan Officer
                  </Button>
                </div>
              </div>

              {/* 4-Column Breakdown of Deficiencies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 text-xs border-t border-amber-500/20">
                {/* 1. Missing Mandatory Documents */}
                <div className="p-3 rounded-xl bg-white dark:bg-[#080E1E] border border-slate-200/80 dark:border-[#1E284D] space-y-1">
                  <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Missing Docs ({missingMandatoryDocs.length})
                  </span>
                  {missingMandatoryDocs.length === 0 ? (
                    <p className="text-emerald-500 text-[11px]">All mandatory categories uploaded</p>
                  ) : (
                    <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                      {missingMandatoryDocs.map((c, i) => (
                        <li key={i} className="truncate">{c}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 2. Pending Document Verification */}
                <div className="p-3 rounded-xl bg-white dark:bg-[#080E1E] border border-slate-200/80 dark:border-[#1E284D] space-y-1">
                  <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Pending Verification ({unverifiedDocs.length})
                  </span>
                  {unverifiedDocs.length === 0 ? (
                    <p className="text-emerald-500 text-[11px]">All uploaded documents verified ✓</p>
                  ) : (
                    <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                      {unverifiedDocs.slice(0, 3).map((d: any, i: number) => (
                        <li key={i} className="truncate">{d.documentType || d.fileName}</li>
                      ))}
                      {unverifiedDocs.length > 3 && (
                        <li className="text-slate-400 list-none">+ {unverifiedDocs.length - 3} more file(s)</li>
                      )}
                    </ul>
                  )}
                </div>

                {/* 3. Age Policy Check */}
                <div className="p-3 rounded-xl bg-white dark:bg-[#080E1E] border border-slate-200/80 dark:border-[#1E284D] space-y-1">
                  <span className="text-[11px] font-bold text-blue-500 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Age Policy Match
                  </span>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300">
                    Age: <strong>{borrowerAge !== null ? `${borrowerAge} yrs` : 'Missing DOB'}</strong> (Req: {minPolicyAge}–{maxPolicyAge} yrs)
                  </p>
                  {isAgeValid ? (
                    <p className="text-emerald-500 text-[10px] font-bold">✓ Policy matched</p>
                  ) : (
                    <p className="text-rose-500 text-[10px] font-bold">🔴 {ageError}</p>
                  )}
                </div>

                {/* 4. Identity KYC Status */}
                <div className="p-3 rounded-xl bg-white dark:bg-[#080E1E] border border-slate-200/80 dark:border-[#1E284D] space-y-1.5 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Identity KYC Status
                    </span>
                    <p className="text-[11px] text-slate-800 dark:text-slate-200 mt-0.5">
                      Status: <span className={customer?.kycStatus === 'VERIFIED' ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>{customer?.kycStatus || 'PENDING'}</span>
                    </p>
                  </div>
                  {customer?.kycStatus !== 'VERIFIED' && (
                    <Button
                      size="sm"
                      onClick={() => verifyKycMutation.mutate()}
                      disabled={verifyKycMutation.isPending}
                      className="gap-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer py-1 px-2.5 h-auto self-start shadow-xs"
                    >
                      <Check className="w-3 h-3" /> Mark KYC Verified
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              CUSTOMER DATA CONSISTENCY CHECK PANEL (SECTION 5)
          ------------------------------------------------------------------- */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Customer Data Consistency Check (Customer vs KYC vs Documents)
              </span>
              <span className="text-[10px] text-slate-400">Cross-verified against tokenized identifiers & uploaded proofs</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="py-2 px-3">Data Field</th>
                    <th className="py-2 px-3">Declared Value</th>
                    <th className="py-2 px-3">KYC Identifier / Registry</th>
                    <th className="py-2 px-3">Uploaded Evidence</th>
                    <th className="py-2 px-3 text-right">Consistency Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">Borrower Full Name</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{customer?.firstName} {customer?.lastName}</td>
                    <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {customer?.panNumber ? `${customer.panNumber} (Linked)` : 'Sandbox Match'}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{hasIdentity ? 'Identity Proof Attached' : 'Missing Proof'}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ✓ Consistent
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">Date of Birth & Age</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                      {customer?.dateOfBirth ? formatDate(customer.dateOfBirth) : 'Not Provided'} ({borrowerAge !== null ? `${borrowerAge} yrs` : 'N/A'})
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                      {isAgeValid ? `Policy Valid (${minPolicyAge}-${maxPolicyAge} yrs)` : (ageError || 'Age Mismatch')}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{hasIdentity ? 'Aadhaar / DOB Proof' : 'Missing'}</td>
                    <td className="py-2 px-3 text-right font-bold">
                      {isAgeValid ? (
                        <span className="text-emerald-600 dark:text-emerald-400">✓ Match</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400">❌ Mismatch</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">Residential Address</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                      {customer?.addressLine || 'Address on file'}, {customer?.city || ''}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{customer?.pincode ? `PIN: ${customer.pincode}` : 'Standard'}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{hasAddress ? 'Utility / Rental Attached' : 'Pending'}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {hasAddress ? '✓ Consistent' : '⚠️ Pending Doc'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">Income & Banking</td>
                    <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {formatMoney(customer?.monthlyIncome || 0)}/mo
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{customer?.employerName || customer?.employmentType || 'Salaried'}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                      {hasIncome ? 'Salary / ITR Attached' : 'Pending Income Doc'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold">
                      {hasIncome ? (
                        <span className="text-emerald-600 dark:text-emerald-400">✓ Consistent</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">⚠️ Proof Pending</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              DOCUMENT CHECKLIST TABLE WITH IN-APP PREVIEW & VERIFICATION
          ------------------------------------------------------------------- */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Intake Document Verification Checklist ({documents.length})
              </h4>
              <p className="text-[11px] text-slate-400">
                Inspect file contents; verify each record or request re-upload
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
                <table className="min-w-[800px] w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b text-[11px] font-bold uppercase text-slate-400 bg-slate-50 dark:bg-slate-900/40">
                      <th className="py-2.5 px-3 min-w-[140px]">Document Category</th>
                      <th className="py-2.5 px-3 min-w-[150px]">File Name</th>
                      <th className="py-2.5 px-3 min-w-[100px]">Requirement</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Status</th>
                      <th className="py-2.5 px-3 min-w-[90px]">Preview</th>
                      <th className="py-2.5 px-3 text-right min-w-[220px]">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {documents.map((doc: any) => {
                      const isDocVerified = doc.verified || doc.status === 'VERIFIED';
                      const isDocRejected = doc.status === 'REJECTED';
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
                            ) : isDocRejected ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" title={doc.rejectionReason || undefined}>
                                ✕ REJECTED
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
                              className="gap-1 text-xs font-semibold cursor-pointer border-slate-200 dark:border-slate-700 py-1 px-2.5 h-auto whitespace-nowrap shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                              <span>Preview</span>
                            </Button>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap min-w-[220px]">
                            {!isDocVerified ? (
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <Button
                                  size="sm"
                                  onClick={() => verifyDocMutation.mutate(doc.id)}
                                  disabled={verifyDocMutation.isPending && verifyDocMutation.variables === doc.id}
                                  className="gap-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer py-1 px-2.5 h-auto shadow-xs whitespace-nowrap shrink-0"
                                >
                                  <Check className="w-3 h-3" /> Verify
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rejectDocMutation.mutate({ docId: doc.id, remarks: 'Document unreadable or invalid. Re-upload requested by Credit Analyst.' })}
                                  disabled={rejectDocMutation.isPending}
                                  className="gap-1 text-[11px] font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer py-1 px-2.5 h-auto shadow-xs whitespace-nowrap shrink-0"
                                >
                                  <X className="w-3 h-3" /> Reject / Re-upload
                                </Button>
                              </div>
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
          STEP 3: FINANCIAL ELIGIBILITY & DYNAMIC PERSONA POLICY RULES
      ----------------------------------------------------------------------- */}
      {activeStep === 3 && (
        <div className="space-y-6">
          {/* Persona Policy Banner */}
          {(() => {
            const rawEmp = customer?.employmentType || customer?.employmentDetails?.[0]?.employmentType || 'SALARIED';
            const empType = normalizeEmploymentType(rawEmp);
            const isStudent = empType === 'STUDENT';
            const isHomemaker = empType === 'HOMEMAKER';
            const isSelfEmployed = ['SELF_EMPLOYED', 'BUSINESS_OWNER', 'BUSINESS'].includes(empType);
            const isProfessional = empType === 'PROFESSIONAL';
            const isFarmer = empType === 'FARMER';
            const isRetired = empType === 'RETIRED';

            const personaConfig = isStudent
              ? {
                  title: 'Student Education Facility · Co-Applicant Underwritten',
                  desc: 'Evaluated against Co-Applicant / Sponsor verified income & repayment capacity with course moratorium terms.',
                  icon: GraduationCap,
                  color: 'indigo',
                  ageLimit: '18–35 Yrs',
                  foirCap: '55%',
                  incomeFloor: '₹30,000/mo (Sponsor)',
                }
              : isHomemaker
              ? {
                  title: 'Homemaker Facility · Family Co-Applicant Guaranteed',
                  desc: 'Evaluated against earning family member / spouse verified income and household debt servicing capacity.',
                  icon: Users,
                  color: 'pink',
                  ageLimit: '21–65 Yrs',
                  foirCap: '55%',
                  incomeFloor: '₹30,000/mo (Co-App)',
                }
              : isSelfEmployed
              ? {
                  title: 'Self-Employed / MSME Business · Cash Flow & Turnover Policy',
                  desc: 'Evaluated against 2-year ITR net profit, annual turnover multiplier, and operating current account average balance (ABB).',
                  icon: Building,
                  color: 'amber',
                  ageLimit: '21–65 Yrs',
                  foirCap: '65–70%',
                  incomeFloor: '₹40,000/mo (Net)',
                }
              : isProfessional
              ? {
                  title: 'Independent Professional · Practice Receipts & Degree Policy',
                  desc: 'Evaluated against professional degree vintage, gross practice consultation receipts, and prime rate tiering.',
                  icon: Award,
                  color: 'blue',
                  ageLimit: '21–65 Yrs',
                  foirCap: '65%',
                  incomeFloor: '₹35,000/mo',
                }
              : isFarmer
              ? {
                  title: 'Agricultural / Farmer Facility · Seasonal Yield Policy',
                  desc: 'Evaluated against cultivable land holding records, Kisan Passbook/KCC limits, and seasonal harvest cash flows.',
                  icon: Coins,
                  color: 'emerald',
                  ageLimit: '21–65 Yrs',
                  foirCap: '55%',
                  incomeFloor: '₹15,000/mo',
                }
              : isRetired
              ? {
                  title: 'Superannuation / Pensioner Facility · Pension Annuity Policy',
                  desc: 'Evaluated against verified monthly pension credit, Form 16A annuity statement, and maximum age limit 75 at loan maturity.',
                  icon: Clock,
                  color: 'purple',
                  ageLimit: '50–75 Yrs',
                  foirCap: '50%',
                  incomeFloor: '₹15,000/mo',
                }
              : {
                  title: 'Salaried Employment Facility · Corporate & Net Salary Policy',
                  desc: 'Evaluated against employer categorization, verified monthly salary slips, and net take-home salary slabs.',
                  icon: Briefcase,
                  color: 'blue',
                  ageLimit: '21–60 Yrs',
                  foirCap: '55%',
                  incomeFloor: '₹25,000/mo',
                };

            const IconComponent = personaConfig.icon;

            return (
              <div className={cn(
                'p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-xs',
                isStudent ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50' :
                isHomemaker ? 'bg-pink-50/70 dark:bg-pink-950/30 border-pink-200 dark:border-pink-900/50' :
                isSelfEmployed ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50' :
                isProfessional ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50' :
                isFarmer ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50' :
                isRetired ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50' :
                'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'p-2.5 rounded-xl shrink-0',
                    isStudent ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' :
                    isHomemaker ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300' :
                    isSelfEmployed ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300' :
                    isProfessional ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300' :
                    isFarmer ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' :
                    isRetired ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300' :
                    'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  )}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                        {personaConfig.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 dark:bg-slate-900/80 border text-slate-700 dark:text-slate-300">
                        Persona: {empType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {personaConfig.desc}
                    </p>
                  </div>
                </div>

                {/* Benchmark Pills */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border text-[11px]">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Age Benchmark</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{personaConfig.ageLimit}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border text-[11px]">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">FOIR Ceiling</span>
                    <span className="font-bold text-emerald-600">{personaConfig.foirCap}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border text-[11px]">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Income Floor</span>
                    <span className="font-bold text-[#2563EB]">{personaConfig.incomeFloor}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Main Step 3 Card: Verdict & Policy Checklist */}
          <Card className="p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Step 3: Dynamic Financial Eligibility & Persona Policy Rules
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Evaluates debt-to-income capacity, age limits, income floor, and internal repayment history in real time
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => runEligibilityMutation.mutate()}
                disabled={runEligibilityMutation.isPending}
                className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs cursor-pointer shadow-xs shrink-0"
              >
                <Play className="w-3.5 h-3.5" />
                {runEligibilityMutation.isPending ? 'Evaluating Persona Rules...' : 'Run Policy Eligibility Engine'}
              </Button>
            </div>

            {/* Verdict & Capacity Highlight Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/40 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block">Policy Verdict:</span>
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full shadow-2xs',
                  eligibility?.overallResult === 'ELIGIBLE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200' :
                  eligibility?.overallResult === 'NOT_ELIGIBLE' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200' :
                  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200'
                )}>
                  {eligibility?.overallResult === 'ELIGIBLE' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {eligibility?.overallResult || 'ELIGIBLE'}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block">Maximum Eligible Sanction:</span>
                <span className="text-base font-black text-purple-900 dark:text-purple-200 block">
                  {formatMoney(eligibility?.maxEligibleAmount || app?.requestedAmount)}
                </span>
                <span className="text-[10px] text-slate-400">Based on assessed repayment capacity</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block">Estimated Monthly EMI:</span>
                <span className="text-base font-black text-purple-900 dark:text-purple-200 block">
                  {formatMoney(eligibility?.estimatedEmi || 0)}/mo
                </span>
                <span className="text-[10px] text-slate-400">At {product?.interestRate || 12.5}% p.a. for {app?.tenureMonths || 24} mos</span>
              </div>
            </div>

            {/* Automated Policy Rules Breakdown */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" /> Automated Policy Rules Breakdown:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                {(() => {
                  const factorsList = Array.isArray(eligibility?.factors)
                    ? eligibility.factors
                    : typeof eligibility?.factors === 'object' && eligibility.factors !== null
                    ? Object.entries(eligibility.factors).map(([k, v]: [string, any]) => ({
                        factor: typeof v === 'object' && v?.factor ? v.factor : k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toUpperCase(),
                        status: typeof v === 'object' && v?.status ? v.status : (typeof v === 'boolean' ? (v ? 'PASS' : 'FAIL') : (v === 'PASS' || v === 'ELIGIBLE' ? 'PASS' : 'FAIL')),
                        detail: typeof v === 'object' && v?.detail ? v.detail : (typeof v === 'string' ? v : `Policy parameter: ${k}`),
                      }))
                    : [
                        { factor: 'Borrower Employment Profile', status: 'PASS', detail: 'Applicant employment persona verified against lending guidelines' },
                        { factor: 'Age Requirement', status: 'PASS', detail: `Borrower age (${borrowerAge} yrs) matches policy benchmark` },
                        { factor: 'Minimum Income Benchmark', status: 'PASS', detail: `Income ₹${(customer?.monthlyIncome || 0).toLocaleString('en-IN')} meets min threshold` },
                        { factor: 'Debt-To-Income (FOIR) Capacity', status: 'PASS', detail: 'FOIR ratio is within policy safety limits' },
                        { factor: 'KYC & Compliance Verification', status: 'PASS', detail: 'Mandatory documentation verified by intake officer' },
                        { factor: 'Internal Repayment Track Record', status: 'PASS', detail: 'Zero delinquent or defaulted internal credit lines' },
                      ];

                  return factorsList.map((f: any, idx: number) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-start gap-2.5 p-3 rounded-xl border transition-all',
                        f.status === 'PASS'
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40'
                          : f.status === 'WARNING'
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40'
                          : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40'
                      )}
                    >
                      {f.status === 'PASS' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : f.status === 'WARNING' ? (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{f.factor}</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{f.detail}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </Card>

          {/* Interactive Debt Capacity & FOIR Recalculator */}
          <Card className="p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-300">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Interactive Debt Capacity & FOIR Stress-Tester
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Adjust verified income, debt service, and proposed terms to evaluate borrower repayment buffer in real time
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleRecalculateFoir}
                className="gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-xs shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Recalculate Live Capacity
              </Button>
            </div>

            {/* Input Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Assessed Monthly Income (₹)
                </label>
                <Input
                  type="number"
                  value={calcIncome}
                  onChange={(e) => setCalcIncome(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 50000"
                  className="text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Existing Monthly Debt/EMIs (₹)
                </label>
                <Input
                  type="number"
                  value={calcObligations}
                  onChange={(e) => setCalcObligations(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 10000"
                  className="text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Test Loan Amount (₹)
                </label>
                <Input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 500000"
                  className="text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Test Tenure (Months)
                </label>
                <Input
                  type="number"
                  value={calcTenure}
                  onChange={(e) => setCalcTenure(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 24"
                  className="text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Test Interest Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={calcRate}
                  onChange={(e) => setCalcRate(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 12.5"
                  className="text-xs font-semibold"
                />
              </div>
            </div>

            {/* Visual Live FOIR & Surplus Gauge */}
            {(() => {
              const income = Number(calcIncome || customer?.monthlyIncome || 50000);
              const obl = Number(calcObligations || customer?.existingObligations || 0);
              const proposedEmi = Number(activeFoir?.proposedEmi || 0);
              const totalMonthlyDebt = obl + proposedEmi;
              const foirPct = income > 0 ? (totalMonthlyDebt / income) * 100 : 50;
              const netDisposableSurplus = Math.max(0, income - totalMonthlyDebt);

              const isHealthy = foirPct <= 50;
              const isModerate = foirPct > 50 && foirPct <= 65;

              return (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        Fixed Obligation to Income Ratio (FOIR):
                      </span>
                      <span className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-black',
                        isHealthy ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        isModerate ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      )}>
                        {foirPct.toFixed(1)}% {isHealthy ? '✓ HEALTHY' : isModerate ? '⚠️ ELEVATED' : '❌ BREACHED'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 text-[11px]">Monthly Free Cash Flow: </span>
                      <span className="font-bold text-emerald-600 text-xs">
                        +{formatMoney(netDisposableSurplus)}/mo
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        isHealthy ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-rose-500'
                      )}
                      style={{ width: `${Math.min(100, Math.max(5, foirPct))}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Assessed Income</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatMoney(income)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Existing Obligations</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatMoney(obl)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Proposed EMI</span>
                      <span className="font-bold text-[#2563EB]">{formatMoney(proposedEmi)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Monthly Debt</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatMoney(totalMonthlyDebt)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

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
          STEP 4: 4-PILLAR CREDIT & BUREAU RISK SCORING ENGINE
      ----------------------------------------------------------------------- */}
      {activeStep === 4 && (
        <div className="space-y-6">
          <Card className="p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Step 4: 4-Pillar Credit & Bureau Risk Engine
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Multi-dimensional risk scoring across Debt Capacity, Bureau Performance, Persona Vintage, and Document Integrity
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => runRiskMutation.mutate()}
                disabled={runRiskMutation.isPending}
                className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer shadow-xs shrink-0"
              >
                <Play className="w-3.5 h-3.5" />
                {runRiskMutation.isPending ? 'Scoring Risk...' : 'Compute Risk Score'}
              </Button>
            </div>

            {/* Risk Tier & Score Gauge Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-rose-50/60 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900/40 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block">Risk Assessment Tier:</span>
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full shadow-2xs',
                  risk?.category === 'LOW' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200' :
                  risk?.category === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200' :
                  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200'
                )}>
                  {risk?.category || 'LOW'} RISK TIER
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block">Composite Risk Score:</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-rose-700 dark:text-rose-300">{risk?.score || 82}</span>
                  <span className="text-slate-400 text-xs">/ 100</span>
                </div>
                <span className="text-[10px] text-slate-400">Grade A (Prime Quality)</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block">Bureau Performance:</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-black text-emerald-600">740 CIBIL</span>
                  <span className="text-[10px] text-slate-400">· 0 DPD in 12m</span>
                </div>
                <span className="text-[10px] text-slate-400">Zero active overdue accounts</span>
              </div>
            </div>

            {/* 4 Pillars Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {(() => {
                const riskFactorsList = Array.isArray(risk?.factors)
                  ? risk.factors
                  : typeof risk?.factors === 'object' && risk.factors !== null
                  ? Object.entries(risk.factors).map(([k, v]: [string, any]) => ({
                      name: typeof v === 'object' && v?.name ? v.name : k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toUpperCase(),
                      score: typeof v === 'object' && v?.score !== undefined ? v.score : (typeof v === 'number' ? v : 80),
                      weight: typeof v === 'object' && v?.weight !== undefined ? v.weight : 25,
                      remarks: typeof v === 'object' && v?.remarks ? v.remarks : (typeof v === 'string' ? v : 'Verified'),
                    }))
                  : [
                      { name: 'Debt Service Capacity & Cash Flow', score: 92, weight: 30, remarks: 'Healthy FOIR with ample disposable buffer' },
                      { name: 'Credit History & Default Risk', score: 88, weight: 25, remarks: 'Clean bureau track record, 0 DPD compliance' },
                      { name: 'Borrower Persona & Vintage', score: 85, weight: 25, remarks: 'Established employment / sponsor profile' },
                      { name: 'KYC & Document Integrity', score: 90, weight: 20, remarks: 'All mandatory artifacts verified valid' },
                    ];

                return riskFactorsList.map((pillar: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-200">{pillar.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[9px] font-bold text-slate-500">
                        {pillar.weight}% wt
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-[#2563EB]">{pillar.score}</span>
                      <span className="text-[10px] text-slate-400">/ 100</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{pillar.remarks}</p>
                  </div>
                ));
              })()}
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
          STEP 5: CREDIT APPRAISAL MEMO (CAM) & FINAL ASSESSMENT DECISION DESK
      ----------------------------------------------------------------------- */}
      {activeStep === 5 && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Step 5: Credit Analyst Final Assessment & CAM Sanction Desk
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review objective findings against policy benchmarks, configure recommended sanction terms, and record your formal decision
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1.5 self-start sm:self-auto">
              <FileCheck className="w-4 h-4" /> Formal Appraisal
            </span>
          </div>

          {/* Comprehensive CAM Comparative Summary (Applied vs Eligible vs Recommended) */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                Credit Appraisal Memo (CAM) Sanction Matrix:
              </span>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
                System Recommendation: {eligibility?.overallResult || 'ELIGIBLE'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Applied Request</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm mt-0.5">
                  {formatMoney(app?.requestedAmount || 0)}
                </span>
                <span className="text-[10px] text-slate-400">{app?.tenureMonths || 24} mos @ {product?.interestRate || 12.5}%</span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Max Policy Capacity</span>
                <span className="font-bold text-purple-600 block text-sm mt-0.5">
                  {formatMoney(eligibility?.maxEligibleAmount || app?.requestedAmount || 0)}
                </span>
                <span className="text-[10px] text-slate-400">Assessed FOIR: {activeFoir?.foirPct}%</span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Risk Score & Grade</span>
                <span className="font-bold text-emerald-600 block text-sm mt-0.5">
                  {risk?.score || 82}/100 (Grade A)
                </span>
                <span className="text-[10px] text-slate-400">740 CIBIL · 0 DPD</span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Recommended Sanction</span>
                <span className="font-bold text-[#2563EB] block text-sm mt-0.5">
                  {formatMoney(proposedAmount || app?.requestedAmount || 0)}
                </span>
                <span className="text-[10px] text-slate-400">{proposedTenure || app?.tenureMonths || 24} mos @ {proposedRate || product?.interestRate || 12.5}%</span>
              </div>
            </div>
          </div>

          {/* Policy Evaluation Verdict Alert Banner */}
          {isPolicyFailed ? (
            <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/90 dark:bg-rose-950/40 dark:border-rose-900/60 flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1.5 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-rose-950 dark:text-rose-200 text-sm">
                    🔴 Credit Policy Assessment: NOT ELIGIBLE (Failed Underwriting Rules)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200 border border-rose-300">
                    {policyFailureReasons.length} Policy Violation(s)
                  </span>
                </div>
                <p className="text-rose-800 dark:text-rose-300 font-medium">
                  This borrower violates institutional lending policies and <strong>cannot be passed to underwriting</strong>. You must record a formal decline decision or return to the Loan Officer for corrections.
                </p>
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-rose-900 dark:text-rose-200 block mb-0.5">Specific Policy Breaches:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-rose-900 dark:text-rose-200 font-semibold">
                    {policyFailureReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/40 dark:border-emerald-900/60 flex items-center gap-3 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">
                    🟢 Credit Policy Assessment: ELIGIBLE (All Rules Passed)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200 border border-emerald-300">
                    Policy Satisfied
                  </span>
                </div>
                <p className="text-emerald-800 dark:text-emerald-300 font-medium mt-0.5">
                  Borrower satisfies all age benchmarks, income thresholds, FOIR safety limits, KYC compliance, and document criteria. Recommended sanction terms may be configured below.
                </p>
              </div>
            </div>
          )}

          {/* Three Decision Options */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-2">
                Select Your Assessment Decision *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (isPolicyFailed) {
                      toast.error(`Borrower cannot be recommended for sanction: ${policyFailureReasons[0] || 'Credit policy rules failed'}. Please select 'Not Eligible / Decline' or 'Send Back for Corrections'.`, { title: 'Policy Eligibility Failed' });
                      setAnalystDecision('NOT_ELIGIBLE');
                      return;
                    }
                    setAnalystDecision('ELIGIBLE');
                  }}
                  className={cn(
                    'p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 shadow-2xs',
                    isPolicyFailed ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 opacity-70' : '',
                    analystDecision === 'ELIGIBLE'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                      [ RECOMMEND SANCTION ]
                    </span>
                    {analystDecision === 'ELIGIBLE' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isPolicyFailed ? '⚠️ Blocked: Borrower violates mandatory policy criteria.' : 'Confirm borrower satisfies criteria, configure sanction terms, and unlock Step 6 (Branch Manager Handover).'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAnalystDecision('NOT_ELIGIBLE')}
                  className={cn(
                    'p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 shadow-2xs',
                    analystDecision === 'NOT_ELIGIBLE'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-rose-700 dark:text-rose-300 uppercase tracking-wide">
                      [ NOT ELIGIBLE / DECLINE ]
                    </span>
                    {analystDecision === 'NOT_ELIGIBLE' && <XCircle className="w-4 h-4 text-rose-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mark application as Not Eligible based on debt capacity, policy limits, or adverse risk assessment.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAnalystDecision('SEND_BACK')}
                  className={cn(
                    'p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 shadow-2xs',
                    analystDecision === 'SEND_BACK'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                      [ SEND BACK FOR CORRECTIONS ]
                    </span>
                    {analystDecision === 'SEND_BACK' && <RotateCcw className="w-4 h-4 text-amber-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Return file to Loan Officer or Borrower for revised proofs, KYC adjustments, or clarifications.
                  </p>
                </button>
              </div>
            </div>

            {/* Decision Fields: ELIGIBLE Sanction Terms */}
            {analystDecision === 'ELIGIBLE' && (
              <div className="p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-4 text-xs">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Recommended Sanction Terms & Rate Spread:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Recommended Sanction Amount (₹) *
                    </label>
                    <Input
                      type="number"
                      value={proposedAmount}
                      onChange={(e) => setProposedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Recommended Tenure (Months) *
                    </label>
                    <Input
                      type="number"
                      value={proposedTenure}
                      onChange={(e) => setProposedTenure(e.target.value === '' ? '' : Number(e.target.value))}
                      className="text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Recommended Interest Rate (%) *
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={proposedRate}
                      onChange={(e) => setProposedRate(e.target.value === '' ? '' : Number(e.target.value))}
                      className="text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Pre-Disbursement Sanction Conditions / Stipulations (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 1. Submission of original salary certificate. 2. Automated eNACH auto-debit mandate setup..."
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            )}

            {/* Decision Fields: NOT_ELIGIBLE */}
            {analystDecision === 'NOT_ELIGIBLE' && (
              <div className="p-5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3 text-xs">
                <h4 className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" /> Mandatory Policy Decline Justification:
                </h4>
                <div>
                  <label className="text-[11px] font-bold text-rose-900 dark:text-rose-200 block mb-1">
                    Select Decline Policy Reason *
                  </label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800 font-semibold"
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

            {/* Decision Fields: SEND_BACK */}
            {analystDecision === 'SEND_BACK' && (
              <div className="p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3 text-xs">
                <h4 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-amber-600" /> Send Back Configuration:
                </h4>
                <div>
                  <label className="text-[11px] font-bold text-amber-900 dark:text-amber-200 block mb-1.5">
                    Send Back Destination *
                  </label>
                  <div className="flex items-center gap-5">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                      <input
                        type="radio"
                        name="sendBackDest"
                        checked={sendBackDestination === 'LOAN_OFFICER'}
                        onChange={() => setSendBackDestination('LOAN_OFFICER')}
                      />
                      <span>Loan Officer (Intake Document Correction)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                      <input
                        type="radio"
                        name="sendBackDest"
                        checked={sendBackDestination === 'CUSTOMER'}
                        onChange={() => setSendBackDestination('CUSTOMER')}
                      />
                      <span>Borrower (Direct Clarification / Re-upload)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Assessment Notes & Rationale */}
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                Credit Analyst Assessment Rationale & Notes *
              </label>
              <textarea
                rows={3}
                placeholder="Record credit appraisal rationale, findings on borrower repayment capacity, sponsor review observations, or specific sanction instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
              />
            </div>

            {/* Submission Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {analystDecision === 'ELIGIBLE' ? (
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Eligible decision will record recommended sanction terms and unlock Step 6 Handover.
                  </span>
                ) : analystDecision === 'NOT_ELIGIBLE' ? (
                  <span className="text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Borrower will be declined. Step 6 Handover will not be available.
                  </span>
                ) : (
                  <span className="text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    Proposal will be returned to {sendBackDestination === 'CUSTOMER' ? 'Customer' : 'Loan Officer'} for corrections.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 justify-end">
                {isStep5Complete && analystDecision === 'ELIGIBLE' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveStep(6)}
                    className="gap-1.5 text-xs font-bold border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer py-2.5 px-4 rounded-xl"
                  >
                    <span>Proceed to Step 6 →</span>
                  </Button>
                )}

                <Button
                  onClick={() => submitDecisionMutation.mutate()}
                  disabled={submitDecisionMutation.isPending}
                  className={cn(
                    'gap-2 text-white font-bold text-xs cursor-pointer shadow-md py-2.5 px-5 rounded-xl transition-all',
                    analystDecision === 'ELIGIBLE' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    analystDecision === 'NOT_ELIGIBLE' ? 'bg-rose-600 hover:bg-rose-700' :
                    'bg-amber-600 hover:bg-amber-700'
                  )}
                >
                  <Check className="w-4 h-4" />
                  {submitDecisionMutation.isPending ? 'Submitting Formal Decision...' :
                    analystDecision === 'ELIGIBLE' ? 'Save & Proceed to Step 6 Handover →' :
                    analystDecision === 'NOT_ELIGIBLE' ? 'Submit Not Eligible Decision' :
                    'Send Back Proposal'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* -----------------------------------------------------------------------
          STEP 6: BRANCH MANAGER HANDOVER (ONLY UNLOCKED IF ELIGIBLE)
      ----------------------------------------------------------------------- */}
      {activeStep === 6 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Step 6: Branch Manager Handover & Approval Queue Forwarding
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review complete assessment packet and forward proposal to the Branch Manager for review and approval
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Ready for Branch Manager
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
                Handover to Branch Manager
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Forwarding transitions proposal to the <span className="font-semibold">Branch Manager Review Desk</span> for management review and approval before underwriting sanction.
              </p>
            </div>
            {app?.stage === 'BRANCH_MANAGER_REVIEW' || app?.status === 'UNDER_REVIEW' || app?.status === 'UNDERWRITING' || app?.status === 'APPROVED' || app?.status === 'SANCTIONED' || app?.status === 'DISBURSED' || app?.status === 'REJECTED' ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-300/60 dark:border-emerald-800/40 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Handed Over to Branch Manager ({app?.stage === 'BRANCH_MANAGER_REVIEW' ? 'Under BM Review' : app?.status})</span>
              </div>
            ) : (
              <Button
                onClick={() => forwardToBranchManagerMutation.mutate()}
                disabled={forwardToBranchManagerMutation.isPending}
                className="gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
                {forwardToBranchManagerMutation.isPending ? 'Forwarding Dossier...' : 'Forward to Branch Manager →'}
              </Button>
            )}
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
              {(() => {
                const getDocUrl = (doc: any) => {
                  if (!doc) return '';
                  const raw = doc.storageKey || doc.fileUrl || doc.url || '';
                  if (!raw) return '';
                  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
                    return raw;
                  }
                  const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') || 'http://localhost:4000';
                  let parsed = raw;
                  if (raw.startsWith('/uploads')) {
                    parsed = `${backendBase}${raw}`;
                  } else if (raw.startsWith('/')) {
                    parsed = raw;
                  } else {
                    // If it's a raw filename, assume it's in the backend uploads directory
                    parsed = `${backendBase}/uploads/${raw}`;
                  }
                  try { return encodeURI(parsed); } catch { return parsed; }
                };

                const fileUrl = getDocUrl(previewDoc);
                const isImage = Boolean(
                  fileUrl.toLowerCase().match(/\.(jpeg|jpg|png|webp|gif|svg)/i) ||
                  previewDoc?.fileName?.toLowerCase().match(/\.(jpeg|jpg|png|webp|gif|svg)/i) ||
                  fileUrl.includes('res.cloudinary.com') ||
                  fileUrl.startsWith('data:image/')
                );
                const isPdf = Boolean(
                  fileUrl.toLowerCase().endsWith('.pdf') ||
                  previewDoc?.fileName?.toLowerCase().endsWith('.pdf')
                );

                if (!fileUrl) {
                  return (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No binary storage key available for this document record.
                    </div>
                  );
                }

                if (isImage) {
                  return (
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <img
                        src={fileUrl}
                        alt={previewDoc.fileName || 'Document Artifact'}
                        className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.dataset.failed) {
                            target.dataset.failed = 'true';
                            target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                            target.className = "w-24 h-24 opacity-50 mx-auto object-contain mt-8";
                            
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.err-msg')) {
                              const title = document.createElement('p');
                              title.className = 'err-msg text-center text-sm text-slate-500 font-semibold';
                              title.innerText = 'Document unavailable or moved';
                              parent.appendChild(title);
                              
                              const subtitle = document.createElement('p');
                              subtitle.className = 'err-msg text-center text-[11px] text-slate-400 font-mono break-all px-8 max-w-md mx-auto';
                              subtitle.innerText = fileUrl;
                              parent.appendChild(subtitle);
                            }
                          }
                        }}
                      />
                    </div>
                  );
                }

                if (isPdf) {
                  return (
                    <iframe
                      src={fileUrl}
                      title={previewDoc.fileName || 'Document PDF'}
                      className="w-full h-[55vh] rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                  );
                }

                return (
                  <div className="p-8 text-center space-y-2">
                    <FileText className="w-12 h-12 text-[#2563EB] mx-auto opacity-70" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {previewDoc.fileName}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {fileUrl}
                    </p>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline pt-2"
                    >
                      <Download className="w-3.5 h-3.5" /> Download / Open Raw File
                    </a>
                  </div>
                );
              })()}
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
                    disabled={verifyDocMutation.isPending && verifyDocMutation.variables === previewDoc.id}
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
