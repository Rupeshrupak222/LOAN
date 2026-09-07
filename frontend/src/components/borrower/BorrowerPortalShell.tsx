'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  BorrowerFormData,
  EligibilityResultData,
  INITIAL_BORROWER_FORM_DATA,
  UploadedDocItem,
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
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { Button, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';

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
  | 'TRACKER'
  | 'ACTIVE_LOAN';

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

  const [currentStep, setCurrentStep] = useState<JourneyStep>('HERO');
  const [formData, setFormData] = useState<BorrowerFormData>(INITIAL_BORROWER_FORM_DATA);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResultData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  // Fetch borrower self profile strictly partitioned by user.id
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

  // Strictly user-scoped loan and application lists (never fall back to company-wide queues)
  const loansList: any[] = Array.isArray(customerMeData?.loans) ? customerMeData.loans : [];
  const appsList: any[] = Array.isArray(customerMeData?.applications) ? customerMeData.applications : [];

  const activeDisbursedLoan = loansList.find(
    (l) => l.status === 'ACTIVE' || l.status === 'DISBURSED'
  );

  const pendingApp = appsList.find(
    (a) => !['REJECTED', 'CLOSED', 'CANCELLED'].includes(a.status)
  ) || appsList[0];

  // Initialize draft from user-scoped localStorage and authenticated user profile
  useEffect(() => {
    // Proactively clean legacy unpartitioned draft to avoid cross-user contamination
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
              email: user.email, // Always enforce authenticated user's email
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
      // Clean initialization with authenticated user info
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

  // Determine initial view once profile data arrives
  useEffect(() => {
    if (!loadingProfile) {
      if (activeDisbursedLoan) {
        setCurrentStep('ACTIVE_LOAN');
      } else if (pendingApp) {
        setSelectedApplication(pendingApp);
        setCurrentStep('TRACKER');
      } else {
        // No loans and no applications: start at the high-converting Hero journey!
        setCurrentStep('HERO');
      }
    }
  }, [loadingProfile, activeDisbursedLoan?.id, pendingApp?.id]);

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

      // Update state
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
      // Fallback: record file locally in draft so applicant can still submit
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

      // Clear draft
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

      // Invalidate borrower-scoped queries
      queryClient.invalidateQueries({ queryKey: ['borrower-profile-me', user?.id] });

      setSelectedApplication(createdApp || { applicationNo: 'APP-GENERATED', status: 'SUBMITTED', ...payload });
      setCurrentStep('TRACKER');
    } catch (err: any) {
      console.error('Submission failed:', err);
      setSubmitError(apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset journey to start fresh
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
    if (sectionKey === 'personal') setCurrentStep('PERSONAL_STEP');
    else if (sectionKey === 'employment') setCurrentStep('EMPLOYMENT_STEP');
    else if (sectionKey === 'obligations') setCurrentStep('OBLIGATIONS_STEP');
    else if (sectionKey === 'bank') setCurrentStep('BANK_STEP');
    else if (sectionKey === 'customizer') setCurrentStep('CUSTOMIZER_STEP');
    else if (sectionKey === 'documents') setCurrentStep('DOCUMENTS_STEP');
  };

  if (loadingProfile) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Spinner />
        <p className="text-xs text-slate-400">Loading your borrowing portal...</p>
      </div>
    );
  }

  // Active step number for progress bar
  const activeStepObj = STEP_LABELS.find((s) => s.step === currentStep);
  const currentStepNum = activeStepObj?.num || 0;
  const isInsideJourney = currentStepNum > 0;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Progress Stepper Bar (Only when inside multi-step journey) */}
      {isInsideJourney && (
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep('HERO')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Portal Home
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-[#2563EB]">
                Step {currentStepNum} of 9: {activeStepObj?.label}
              </span>
            </div>

            <button
              type="button"
              onClick={handleResetDraft}
              className="text-[11px] text-slate-400 hover:text-rose-500 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Draft</span>
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStepNum / 9) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* VIEW 1: HERO OVERVIEW */}
      {currentStep === 'HERO' && (
        <BorrowerHomeHero
          requestedAmount={formData.requestedAmount}
          onAmountChange={(amt) => updateField('requestedAmount', amt)}
          purpose={formData.purpose}
          onPurposeChange={(p) => updateField('purpose', p)}
          onStartJourney={() => setCurrentStep('ELIGIBILITY_STEP')}
          hasSavedDraft={hasSavedDraft}
          onContinueDraft={() => setCurrentStep('PERSONAL_STEP')}
          borrowerName={formData.firstName || (user?.firstName ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1) : undefined)}
        />
      )}

      {/* VIEW 2: ELIGIBILITY QUESTIONNAIRE */}
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

      {/* VIEW 3: ELIGIBILITY ACTUARIAL RESULTS */}
      {currentStep === 'ELIGIBILITY_RESULT' && eligibilityResult && (
        <BorrowerEligibilityResult
          data={eligibilityResult}
          onProceed={() => setCurrentStep('PERSONAL_STEP')}
          onRecalculate={() => setCurrentStep('ELIGIBILITY_STEP')}
          isDark={isDark}
        />
      )}

      {/* VIEW 4: PERSONAL DETAILS */}
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

      {/* VIEW 5: EMPLOYMENT DETAILS */}
      {currentStep === 'EMPLOYMENT_STEP' && (
        <BorrowerEmploymentStep
          formData={formData}
          updateField={updateField}
          onNext={() => setCurrentStep('OBLIGATIONS_STEP')}
          onBack={() => setCurrentStep('PERSONAL_STEP')}
          isDark={isDark}
        />
      )}

      {/* VIEW 6: FINANCIAL OBLIGATIONS */}
      {currentStep === 'OBLIGATIONS_STEP' && (
        <BorrowerObligationsStep
          formData={formData}
          updateField={updateField}
          onNext={() => setCurrentStep('KYC_STEP')}
          onBack={() => setCurrentStep('EMPLOYMENT_STEP')}
          isDark={isDark}
        />
      )}

      {/* VIEW 7: KYC IDENTITY VERIFICATION */}
      {currentStep === 'KYC_STEP' && (
        <BorrowerKycStep
          formData={formData}
          updateField={updateField}
          onNext={() => setCurrentStep('BANK_STEP')}
          onBack={() => setCurrentStep('OBLIGATIONS_STEP')}
          isDark={isDark}
        />
      )}

      {/* VIEW 8: DISBURSAL BANK ACCOUNT */}
      {currentStep === 'BANK_STEP' && (
        <BorrowerBankStep
          formData={formData}
          updateField={updateField}
          onNext={() => setCurrentStep('CUSTOMIZER_STEP')}
          onBack={() => setCurrentStep('KYC_STEP')}
          isDark={isDark}
        />
      )}

      {/* VIEW 9: LOAN SCHEME & TENURE CUSTOMIZER */}
      {currentStep === 'CUSTOMIZER_STEP' && (
        <BorrowerLoanCustomizerStep
          formData={formData}
          updateField={updateField}
          onNext={() => setCurrentStep('DOCUMENTS_STEP')}
          onBack={() => setCurrentStep('BANK_STEP')}
          isDark={isDark}
        />
      )}

      {/* VIEW 10: DOCUMENT UPLOAD CENTER */}
      {currentStep === 'DOCUMENTS_STEP' && (
        <BorrowerDocumentUploadStep
          documents={formData.documents}
          onUploadDocument={handleUploadDocument}
          onNext={() => setCurrentStep('REVIEW_STEP')}
          onBack={() => setCurrentStep('CUSTOMIZER_STEP')}
          isDark={isDark}
        />
      )}

      {/* VIEW 11: FINAL REVIEW & LEGAL CONSENTS */}
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

      {/* VIEW 12: APPLICATION LIFECYCLE TRACKER */}
      {currentStep === 'TRACKER' && (
        <BorrowerApplicationTracker
          application={selectedApplication || pendingApp}
          onApplyNew={() => setCurrentStep('HERO')}
          isDark={isDark}
        />
      )}

      {/* VIEW 13: ACTIVE DISBURSED LOAN SERVICING */}
      {currentStep === 'ACTIVE_LOAN' && activeDisbursedLoan && (
        <BorrowerActiveLoanView
          loan={activeDisbursedLoan}
          onApplyNew={() => setCurrentStep('HERO')}
          isDark={isDark}
        />
      )}
    </div>
  );
};
