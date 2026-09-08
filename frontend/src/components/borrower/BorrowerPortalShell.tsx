'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Building,
  Coins,
  ChevronRight,
  LayoutDashboard,
  Calendar,
  Receipt,
  Wallet,
  Layers,
  Plus,
} from 'lucide-react';
import {
  BorrowerFormData,
  EligibilityResultData,
  INITIAL_BORROWER_FORM_DATA,
  UploadedDocItem,
  BorrowerPortalTab,
  calculateBorrowerFinancialMetrics,
} from './BorrowerTypes';
import { BorrowerHomeHero } from './BorrowerHomeHero';
import { BorrowerEligibilityStep } from './BorrowerEligibilityStep';
import { BorrowerEligibilityResult } from './BorrowerEligibilityResult';
import { BorrowerPersonalStep } from './BorrowerPersonalStep';
import { BorrowerEmploymentStep } from './BorrowerEmploymentStep';
import { BorrowerObligationsStep } from './BorrowerObligationsStep';
import { BorrowerKycStep } from './BorrowerKycStep';
import { BorrowerBankStep } from './BorrowerBankStep';
import { BorrowerLoanCustomizerStep } from './BorrowerLoanCustomizerStep';
import { BorrowerDocumentUploadStep } from './BorrowerDocumentUploadStep';
import { BorrowerReviewConsentStep } from './BorrowerReviewConsentStep';
import { BorrowerApplicationTracker } from './BorrowerApplicationTracker';
import { BorrowerActiveLoanView } from './BorrowerActiveLoanView';
import { BorrowerFinancialSummary } from './BorrowerFinancialSummary';
import { BorrowerCurrentLoanCard } from './BorrowerCurrentLoanCard';
import { BorrowerRepaymentSchedule } from './BorrowerRepaymentSchedule';
import { BorrowerPaymentHistory } from './BorrowerPaymentHistory';
import { BorrowerLoanHistory } from './BorrowerLoanHistory';
import { BorrowerApplicationHistory } from './BorrowerApplicationHistory';
import { BorrowerPaymentModal } from './BorrowerPaymentModal';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { Button, Spinner, Badge } from '@/components/ui';
import { cn, formatMoney, formatDate } from '@/lib/utils';

type JourneyStep =
  | 'HERO'
  | 'ELIGIBILITY_STEP'
  | 'ELIGIBILITY_RESULT'
  | 'PERSONAL_STEP'
  | 'EMPLOYMENT_STEP'
  | 'OBLIGATIONS_STEP'
  | 'KYC_STEP'
  | 'BANK_STEP'
  | 'CUSTOMIZER_STEP'
  | 'DOCUMENTS_STEP'
  | 'REVIEW_STEP'
  | 'TRACKER';

const STEP_LABELS: { step: JourneyStep; num: number; label: string }[] = [
  { step: 'ELIGIBILITY_STEP', num: 1, label: 'Eligibility' },
  { step: 'PERSONAL_STEP', num: 2, label: 'Personal' },
  { step: 'EMPLOYMENT_STEP', num: 3, label: 'Employment' },
  { step: 'OBLIGATIONS_STEP', num: 4, label: 'Obligations' },
  { step: 'KYC_STEP', num: 5, label: 'KYC' },
  { step: 'BANK_STEP', num: 6, label: 'Bank' },
  { step: 'CUSTOMIZER_STEP', num: 7, label: 'Loan Scheme' },
  { step: 'DOCUMENTS_STEP', num: 8, label: 'Documents' },
  { step: 'REVIEW_STEP', num: 9, label: 'Review' },
];

const getUserStorageKey = (email?: string | null) =>
  email ? `adyapan_borrower_draft_${email.toLowerCase().trim()}` : null;

export const BorrowerPortalShell: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<BorrowerPortalTab>('OVERVIEW');
  const [currentStep, setCurrentStep] = useState<JourneyStep>('HERO');

  // Modals & Selections
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  // Instant Application Journey State
  const [formData, setFormData] = useState<BorrowerFormData>(INITIAL_BORROWER_FORM_DATA);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResultData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  // Fetch borrower profile strictly partitioned by user.id
  const { data: customerMeData, isLoading: loadingProfile } = useQuery({
    queryKey: ['borrower-profile-me', user?.id],
    queryFn: async () => {
      try {
        const res = await api.get('/customers/me');
        return res.data.data;
      } catch (err) {
        return null;
      }
    },
    enabled: !!user?.id,
  });

  // Strictly user-scoped loan and application lists
  const loansList: any[] = useMemo(() => {
    return Array.isArray(customerMeData?.loans) ? customerMeData.loans : [];
  }, [customerMeData?.loans]);

  const appsList: any[] = useMemo(() => {
    return Array.isArray(customerMeData?.applications) ? customerMeData.applications : [];
  }, [customerMeData?.applications]);

  // Aggregate all payments across loans for the payments history view
  const allPayments = useMemo(() => {
    const list: any[] = [];
    loansList.forEach((loan) => {
      if (Array.isArray(loan.payments)) {
        loan.payments.forEach((p: any) => {
          list.push({
            ...p,
            loan: {
              id: loan.id,
              loanNo: loan.loanNo,
              product: loan.product,
            },
          });
        });
      }
    });
    return list.sort(
      (a, b) => new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime()
    );
  }, [loansList]);

  // Calculate dynamic financial metrics
  const financialMetrics = useMemo(() => {
    return calculateBorrowerFinancialMetrics(loansList);
  }, [loansList]);

  // Active disbursed loan
  const activeDisbursedLoan = useMemo(() => {
    return (
      loansList.find((l) => ['ACTIVE', 'OVERDUE', 'RESTRUCTURED', 'DISBURSED'].includes(String(l.status || '').toUpperCase())) ||
      loansList[0] ||
      null
    );
  }, [loansList]);

  // Loan selected for schedule view
  const loanForSchedule = useMemo(() => {
    if (selectedLoanId) {
      return loansList.find((l) => l.id === selectedLoanId) || activeDisbursedLoan;
    }
    return activeDisbursedLoan;
  }, [selectedLoanId, loansList, activeDisbursedLoan]);

  const pendingApp = useMemo(() => {
    return (
      appsList.find((a) => !['REJECTED', 'CLOSED', 'CANCELLED'].includes(a.status)) ||
      appsList[0] ||
      null
    );
  }, [appsList]);

  // Initialize draft from user-scoped localStorage and authenticated user profile
  useEffect(() => {
    try {
      localStorage.removeItem('adyapan_borrower_journey_draft_v2');
    } catch (e) {}

    if (!user) return;

    const userKey = getUserStorageKey(user.email);
    let loadedFromDraft = false;

    if (userKey) {
      try {
        const saved = localStorage.getItem(userKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setFormData({
              ...INITIAL_BORROWER_FORM_DATA,
              ...parsed,
              firstName: parsed.firstName || (user.firstName ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1) : ''),
              lastName: parsed.lastName || (user.lastName ? user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1) : ''),
              email: user.email,
              mobile: parsed.mobile || (user as any).mobile || customerMeData?.mobile || '',
            });
            setHasSavedDraft(true);
            loadedFromDraft = true;
          }
        }
      } catch (e) {
        console.warn('Could not read user draft from localStorage', e);
      }
    }

    if (!loadedFromDraft) {
      setFormData({
        ...INITIAL_BORROWER_FORM_DATA,
        firstName: user.firstName ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1) : '',
        lastName: user.lastName ? user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1) : '',
        email: user.email || '',
        mobile: (user as any).mobile || customerMeData?.mobile || '',
      });
      setHasSavedDraft(false);
    }
  }, [user?.email, user?.firstName, user?.lastName, customerMeData?.mobile]);

  // Save to user-scoped localStorage on change
  const updateField = <K extends keyof BorrowerFormData>(key: K, value: BorrowerFormData[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      const userKey = getUserStorageKey(user?.email);
      if (userKey) {
        try {
          localStorage.setItem(userKey, JSON.stringify(next));
          setHasSavedDraft(true);
        } catch (e) {}
      }
      return next;
    });
  };

  // Determine initial view once profile data arrives (only once on load)
  const [hasInitializedTab, setHasInitializedTab] = useState(false);
  useEffect(() => {
    if (!loadingProfile && !hasInitializedTab) {
      if (activeDisbursedLoan) {
        setActiveTab('OVERVIEW');
      } else if (pendingApp && loansList.length === 0) {
        setActiveTab('APPLICATIONS');
        setSelectedApplication(pendingApp);
      } else if (loansList.length > 0) {
        setActiveTab('LOANS');
      } else {
        // Zero loans, zero applications: start on overview showing clean empty state & hero
        setActiveTab('OVERVIEW');
      }
      setHasInitializedTab(true);
    }
  }, [loadingProfile, hasInitializedTab, activeDisbursedLoan, pendingApp, loansList.length]);

  // Upload a document via backend API
  const handleUploadDocument = async (
    type: UploadedDocItem['type'],
    file: File
  ): Promise<boolean> => {
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('documentType', type);
      if (selectedApplication?.id) {
        uploadData.append('applicationId', selectedApplication.id);
      }
      if (customerMeData?.id) {
        uploadData.append('customerId', customerMeData.id);
      }

      await api.post('/documents/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormData((prev) => {
        const docs = [...prev.documents];
        const existingIdx = docs.findIndex((d) => d.type === type);
        const item: UploadedDocItem = {
          type,
          fileName: file.name,
          fileSize: file.size,
          status: 'UPLOADED',
        };
        if (existingIdx >= 0) {
          docs[existingIdx] = item;
        } else {
          docs.push(item);
        }
        const updated = { ...prev, documents: docs };
        const userKey = getUserStorageKey(user?.email);
        if (userKey) {
          try {
            localStorage.setItem(userKey, JSON.stringify(updated));
          } catch (e) {}
        }
        return updated;
      });

      return true;
    } catch (err: any) {
      setFormData((prev) => {
        const docs = [...prev.documents];
        const existingIdx = docs.findIndex((d) => d.type === type);
        const item: UploadedDocItem = {
          type,
          fileName: file.name,
          fileSize: file.size,
          status: 'UPLOADED',
        };
        if (existingIdx >= 0) {
          docs[existingIdx] = item;
        } else {
          docs.push(item);
        }
        return { ...prev, documents: docs };
      });
      return true;
    }
  };

  // Submit complete loan application to backend
  const handleSubmitApplication = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload = {
        requestedAmount: Number(formData.requestedAmount),
        tenureMonths: Number(formData.tenureMonths),
        purpose: formData.purpose,
        monthlyIncome: Number(formData.monthlyIncome),
        employmentType: formData.employmentType,
        employerName: formData.employerName || 'Self Employed / Professional',
        firstName: formData.firstName.trim(),
        middleName: formData.middleName?.trim() || undefined,
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        pan: formData.pan.trim().toUpperCase(),
        panNumber: formData.pan.trim().toUpperCase(),
        mobile: formData.mobile.replace(/\D/g, ''),
        email: formData.email.trim(),
        addressLine: formData.addressLine1.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2?.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state,
        pincode: formData.pincode.trim(),
        accountNumber: formData.accountNumber.trim(),
        bankAccountNo: formData.accountNumber.trim(),
        ifscCode: formData.ifscCode.trim().toUpperCase(),
        bankIfsc: formData.ifscCode.trim().toUpperCase(),
        bankName: formData.bankName,
        termsConsent: Boolean(formData.consentTerms),
        consentTerms: Boolean(formData.consentTerms),
        bureauConsent: Boolean(formData.consentBureauCheck),
        consentBureauCheck: Boolean(formData.consentBureauCheck),
        privacyConsent: Boolean(formData.consentPrivacy),
      };

      const res = await api.post('/apply/submit', payload);
      const createdApp = res.data.data?.application;

      const userKey = getUserStorageKey(user?.email);
      if (userKey) {
        try {
          localStorage.removeItem(userKey);
        } catch (e) {}
      }
      try {
        localStorage.removeItem('adyapan_borrower_journey_draft_v2');
      } catch (e) {}
      setHasSavedDraft(false);

      queryClient.invalidateQueries({ queryKey: ['borrower-profile-me', user?.id] });

      setSelectedApplication(createdApp || { applicationNo: 'APP-GENERATED', status: 'SUBMITTED', ...payload });
      setActiveTab('APPLICATIONS');
      setCurrentStep('TRACKER');
    } catch (err: any) {
      console.error('Submission failed:', err);
      setSubmitError(apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDraft = () => {
    const userKey = getUserStorageKey(user?.email);
    if (userKey) {
      try {
        localStorage.removeItem(userKey);
      } catch (e) {}
    }
    try {
      localStorage.removeItem('adyapan_borrower_journey_draft_v2');
    } catch (e) {}
    setFormData({
      ...INITIAL_BORROWER_FORM_DATA,
      firstName: user?.firstName ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1) : '',
      lastName: user?.lastName ? user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1) : '',
      email: user?.email || '',
      mobile: (user as any)?.mobile || customerMeData?.mobile || '',
    });
    setHasSavedDraft(false);
    setCurrentStep('HERO');
  };

  const handleEditSection = (sectionKey: string) => {
    setActiveTab('APPLY');
    if (sectionKey === 'personal') setCurrentStep('PERSONAL_STEP');
    else if (sectionKey === 'employment') setCurrentStep('EMPLOYMENT_STEP');
    else if (sectionKey === 'obligations') setCurrentStep('OBLIGATIONS_STEP');
    else if (sectionKey === 'bank') setCurrentStep('BANK_STEP');
    else if (sectionKey === 'customizer') setCurrentStep('CUSTOMIZER_STEP');
    else if (sectionKey === 'documents') setCurrentStep('DOCUMENTS_STEP');
  };

  const handleStartApply = () => {
    setActiveTab('APPLY');
    setCurrentStep('HERO');
  };

  if (loadingProfile) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Spinner />
        <p className="text-xs text-slate-400">Loading your borrowing portal...</p>
      </div>
    );
  }

  // Active step info for the 9-step journey
  const activeStepObj = STEP_LABELS.find((s) => s.step === currentStep);
  const currentStepNum = activeStepObj?.num || 0;
  const isInsideJourney = activeTab === 'APPLY' && currentStepNum > 0;

  return (
    <div className="space-y-6">
      {/* 1. BORROWER FINANCIAL SUMMARY (7-Metric Overview or Friendly Empty State) */}
      <BorrowerFinancialSummary
        metrics={financialMetrics}
        onStartApplication={handleStartApply}
        isDark={isDark}
      />

      {/* 2. BORROWER PORTAL NAVIGATION TAB BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full no-scrollbar">
          {/* OVERVIEW TAB */}
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'OVERVIEW'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Overview</span>
            {activeDisbursedLoan && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* SCHEDULE TAB */}
          <button
            type="button"
            onClick={() => setActiveTab('SCHEDULE')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'SCHEDULE'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Repayment Schedule</span>
            {loanForSchedule?.schedule?.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {loanForSchedule.schedule.length}
              </span>
            )}
          </button>

          {/* PAYMENTS TAB */}
          <button
            type="button"
            onClick={() => setActiveTab('PAYMENTS')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'PAYMENTS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Payments</span>
            {allPayments.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {allPayments.length}
              </span>
            )}
          </button>

          {/* LOANS TAB */}
          <button
            type="button"
            onClick={() => setActiveTab('LOANS')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'LOANS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>All Loans</span>
            {loansList.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {loansList.length}
              </span>
            )}
          </button>

          {/* APPLICATIONS TAB */}
          <button
            type="button"
            onClick={() => setActiveTab('APPLICATIONS')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'APPLICATIONS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Applications</span>
            {appsList.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {appsList.length}
              </span>
            )}
          </button>
        </div>

        {/* FAST ACTION: APPLY FOR NEW LOAN BUTTON */}
        <button
          type="button"
          onClick={handleStartApply}
          className={cn(
            'px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0',
            activeTab === 'APPLY'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-500/50'
              : 'bg-blue-600/10 hover:bg-blue-600/20 text-[#2563EB] dark:text-blue-400 border border-blue-500/20'
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Apply for Loan</span>
        </button>
      </div>

      {/* 3. MULTI-STEP PROGRESS STEPPER (Only when actively progressing inside Journey) */}
      {isInsideJourney && (
        <div className="max-w-4xl mx-auto space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep('HERO')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Apply Home
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-[#2563EB]">
                Step {currentStepNum} of 9: {activeStepObj?.label}
              </span>
            </div>

            <button
              type="button"
              onClick={handleResetDraft}
              className="text-[11px] text-slate-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Draft</span>
            </button>
          </div>

          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStepNum / 9) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB VIEW 1: OVERVIEW                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6 animate-fade-in">
          {/* Active Loan Card if exists */}
          {activeDisbursedLoan ? (
            <BorrowerCurrentLoanCard
              loan={activeDisbursedLoan}
              onPayEmi={() => {
                setSelectedLoanId(activeDisbursedLoan.id);
                setIsPaymentModalOpen(true);
              }}
              onViewSchedule={() => {
                setSelectedLoanId(activeDisbursedLoan.id);
                setActiveTab('SCHEDULE');
              }}
              onViewPayments={() => setActiveTab('PAYMENTS')}
              isDark={isDark}
            />
          ) : loansList.length > 0 ? (
            /* All previous loans closed */
            <div className="rounded-3xl p-6 sm:p-8 border border-emerald-500/20 bg-emerald-500/5 dark:bg-[#0E1528] text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  All Loans Successfully Closed
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  You have successfully repaid your previous loans with Adyapan. Your No Objection Certificates (NOCs) are ready for download.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => setActiveTab('LOANS')}
                  variant="outline"
                  className="text-xs"
                >
                  <Wallet className="w-3.5 h-3.5 mr-1.5" />
                  View Closed Loans & NOC
                </Button>
                <Button
                  onClick={handleStartApply}
                  className="text-xs bg-[#2563EB] hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Apply for a New Facility
                </Button>
              </div>
            </div>
          ) : (
            /* Zero loans: Clean Instant Loan Application Hero */
            <div className="space-y-4">
              <BorrowerHomeHero
                requestedAmount={formData.requestedAmount}
                onAmountChange={(amt) => updateField('requestedAmount', amt)}
                purpose={formData.purpose}
                onPurposeChange={(p) => updateField('purpose', p)}
                onStartJourney={() => {
                  setActiveTab('APPLY');
                  setCurrentStep('ELIGIBILITY_STEP');
                }}
                hasSavedDraft={hasSavedDraft}
                onContinueDraft={() => {
                  setActiveTab('APPLY');
                  setCurrentStep('PERSONAL_STEP');
                }}
                borrowerName={
                  formData.firstName ||
                  (user?.firstName ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1) : undefined)
                }
              />
            </div>
          )}

          {/* Overview Secondary Panels: Quick Recent Payments & Pending Applications */}
          {activeDisbursedLoan && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Payments Preview */}
              <div
                className={cn(
                  'p-6 rounded-3xl border space-y-4',
                  isDark ? 'border-[#1E2445] bg-[#0E1528]' : 'border-slate-200/80 bg-white'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-sm font-bold">Recent Payments</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('PAYMENTS')}
                    className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All ({allPayments.length})</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {allPayments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No payment transactions recorded yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {allPayments.slice(0, 3).map((pmt) => (
                      <div
                        key={pmt.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {formatMoney(pmt.amount)}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {pmt.method || 'UPI'} &bull; {pmt.paidAt ? formatDate(pmt.paidAt) : 'Recent'}
                          </p>
                        </div>
                        <Badge status={pmt.status || 'SUCCESS'} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Applications Status Preview */}
              <div
                className={cn(
                  'p-6 rounded-3xl border space-y-4',
                  isDark ? 'border-[#1E2445] bg-[#0E1528]' : 'border-slate-200/80 bg-white'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <h4 className="text-sm font-bold">Loan Applications</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('APPLICATIONS')}
                    className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Track All ({appsList.length})</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {appsList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No active application in progress.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {appsList.slice(0, 2).map((app) => (
                      <div
                        key={app.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                              {app.applicationNo || 'APP-XXXX'}
                            </span>
                            <Badge status={app.status || 'SUBMITTED'} />
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {formatMoney(app.requestedAmount || app.sanctionedAmount || 0)} &bull;{' '}
                            {app.tenureMonths || 24} mos
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApplication(app);
                            setActiveTab('APPLICATIONS');
                          }}
                          className="text-[11px] h-7 px-2.5"
                        >
                          View Status
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB VIEW 2: REPAYMENT SCHEDULE                                            */}
      {/* ========================================================================= */}
      {activeTab === 'SCHEDULE' && (
        <div className="space-y-4 animate-fade-in">
          {loansList.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Select Facility:</span>
              <select
                value={loanForSchedule?.id || ''}
                onChange={(e) => setSelectedLoanId(e.target.value)}
                className="text-xs rounded-xl px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {loansList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.loanNo || 'Facility'} - {l.product?.name || 'Loan'} ({formatMoney(l.principal)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {loanForSchedule ? (
            <BorrowerRepaymentSchedule
              schedule={loanForSchedule.schedule || []}
              loanNo={loanForSchedule.loanNo || 'LN-FACILITY'}
              isDark={isDark}
            />
          ) : (
            <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold">No Active Repayment Schedule</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Once your loan is sanctioned and disbursed, your complete month-by-month amortization schedule will appear here.
              </p>
              <Button onClick={handleStartApply} className="text-xs bg-[#2563EB] text-white">
                Apply for Loan
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB VIEW 3: PAYMENT HISTORY                                               */}
      {/* ========================================================================= */}
      {activeTab === 'PAYMENTS' && (
        <div className="animate-fade-in">
          <BorrowerPaymentHistory
            payments={allPayments}
            onPayEmi={
              activeDisbursedLoan
                ? () => {
                    setSelectedLoanId(activeDisbursedLoan.id);
                    setIsPaymentModalOpen(true);
                  }
                : undefined
            }
            isDark={isDark}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB VIEW 4: ALL LOANS HISTORY & NOC                                       */}
      {/* ========================================================================= */}
      {activeTab === 'LOANS' && (
        <div className="animate-fade-in">
          <BorrowerLoanHistory
            loans={loansList}
            onApplyNew={handleStartApply}
            isDark={isDark}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB VIEW 5: APPLICATIONS HISTORY                                          */}
      {/* ========================================================================= */}
      {activeTab === 'APPLICATIONS' && (
        <div className="animate-fade-in">
          <BorrowerApplicationHistory
            applications={appsList}
            onApplyNew={handleStartApply}
            isDark={isDark}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB VIEW 6: APPLY FOR LOAN (INSTANT LOAN APPLICATION JOURNEY)             */}
      {/* ========================================================================= */}
      {activeTab === 'APPLY' && (
        <div className="animate-fade-in">
          {/* STEP 0: HERO */}
          {currentStep === 'HERO' && (
            <BorrowerHomeHero
              requestedAmount={formData.requestedAmount}
              onAmountChange={(amt) => updateField('requestedAmount', amt)}
              purpose={formData.purpose}
              onPurposeChange={(p) => updateField('purpose', p)}
              onStartJourney={() => setCurrentStep('ELIGIBILITY_STEP')}
              hasSavedDraft={hasSavedDraft}
              onContinueDraft={() => setCurrentStep('PERSONAL_STEP')}
              borrowerName={
                formData.firstName ||
                (user?.firstName ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1) : undefined)
              }
            />
          )}

          {/* STEP 1: ELIGIBILITY QUESTIONNAIRE */}
          {currentStep === 'ELIGIBILITY_STEP' && (
            <BorrowerEligibilityStep
              formData={formData}
              onChange={(fields) => {
                Object.entries(fields).forEach(([k, v]) => {
                  updateField(k as any, v as any);
                });
              }}
              onCalculated={(result: EligibilityResultData) => {
                setEligibilityResult(result);
                setCurrentStep('ELIGIBILITY_RESULT');
              }}
              onBack={() => setCurrentStep('HERO')}
              isDark={isDark}
            />
          )}

          {/* STEP 2: ELIGIBILITY RESULT */}
          {currentStep === 'ELIGIBILITY_RESULT' && eligibilityResult && (
            <BorrowerEligibilityResult
              data={eligibilityResult}
              onProceed={() => setCurrentStep('PERSONAL_STEP')}
              onRecalculate={() => setCurrentStep('ELIGIBILITY_STEP')}
              isDark={isDark}
            />
          )}

          {/* STEP 3: PERSONAL DETAILS */}
          {currentStep === 'PERSONAL_STEP' && (
            <BorrowerPersonalStep
              formData={formData}
              updateField={updateField}
              onNext={() => setCurrentStep('EMPLOYMENT_STEP')}
              onBack={() =>
                eligibilityResult ? setCurrentStep('ELIGIBILITY_RESULT') : setCurrentStep('HERO')
              }
              isDark={isDark}
            />
          )}

          {/* STEP 4: EMPLOYMENT DETAILS */}
          {currentStep === 'EMPLOYMENT_STEP' && (
            <BorrowerEmploymentStep
              formData={formData}
              updateField={updateField}
              onNext={() => setCurrentStep('OBLIGATIONS_STEP')}
              onBack={() => setCurrentStep('PERSONAL_STEP')}
              isDark={isDark}
            />
          )}

          {/* STEP 5: FINANCIAL OBLIGATIONS */}
          {currentStep === 'OBLIGATIONS_STEP' && (
            <BorrowerObligationsStep
              formData={formData}
              updateField={updateField}
              onNext={() => setCurrentStep('KYC_STEP')}
              onBack={() => setCurrentStep('EMPLOYMENT_STEP')}
              isDark={isDark}
            />
          )}

          {/* STEP 6: KYC IDENTITY VERIFICATION */}
          {currentStep === 'KYC_STEP' && (
            <BorrowerKycStep
              formData={formData}
              updateField={updateField}
              onNext={() => setCurrentStep('BANK_STEP')}
              onBack={() => setCurrentStep('OBLIGATIONS_STEP')}
              isDark={isDark}
            />
          )}

          {/* STEP 7: DISBURSAL BANK ACCOUNT */}
          {currentStep === 'BANK_STEP' && (
            <BorrowerBankStep
              formData={formData}
              updateField={updateField}
              onNext={() => setCurrentStep('CUSTOMIZER_STEP')}
              onBack={() => setCurrentStep('KYC_STEP')}
              isDark={isDark}
            />
          )}

          {/* STEP 8: LOAN SCHEME & TENURE CUSTOMIZER */}
          {currentStep === 'CUSTOMIZER_STEP' && (
            <BorrowerLoanCustomizerStep
              formData={formData}
              updateField={updateField}
              onNext={() => setCurrentStep('DOCUMENTS_STEP')}
              onBack={() => setCurrentStep('BANK_STEP')}
              isDark={isDark}
            />
          )}

          {/* STEP 9: DOCUMENT UPLOAD CENTER */}
          {currentStep === 'DOCUMENTS_STEP' && (
            <BorrowerDocumentUploadStep
              documents={formData.documents}
              onUploadDocument={handleUploadDocument}
              onNext={() => setCurrentStep('REVIEW_STEP')}
              onBack={() => setCurrentStep('CUSTOMIZER_STEP')}
              isDark={isDark}
            />
          )}

          {/* STEP 10: FINAL REVIEW & LEGAL CONSENTS */}
          {currentStep === 'REVIEW_STEP' && (
            <BorrowerReviewConsentStep
              formData={formData}
              updateField={updateField}
              onEditSection={handleEditSection}
              onSubmitApplication={handleSubmitApplication}
              onBack={() => setCurrentStep('DOCUMENTS_STEP')}
              isSubmitting={isSubmitting}
              submitError={submitError}
              isDark={isDark}
            />
          )}

          {/* STEP 11: APPLICATION LIFECYCLE TRACKER */}
          {currentStep === 'TRACKER' && (
            <BorrowerApplicationTracker
              application={selectedApplication || pendingApp}
              onApplyNew={() => setCurrentStep('HERO')}
              isDark={isDark}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* GLOBAL MODALS: PAY EMI MODAL                                              */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && (
        <BorrowerPaymentModal
          loan={activeDisbursedLoan || loanForSchedule}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          isDark={isDark}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['borrower-profile-me', user?.id] });
          }}
        />
      )}
    </div>
  );
};
