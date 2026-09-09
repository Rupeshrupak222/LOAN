'use client';

import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Edit3,
  User,
  Briefcase,
  Building2,
  Coins,
  ShieldCheck,
  Lock,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { BorrowerFormData } from './BorrowerTypes';
import { Button } from '@/components/ui';
import { cn, formatMoney } from '@/lib/utils';

interface Props {
  formData: BorrowerFormData;
  updateField: <K extends keyof BorrowerFormData>(key: K, value: BorrowerFormData[K]) => void;
  onEditSection: (sectionKey: string) => void;
  onSubmitApplication: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  submitError?: string | null;
  isDark: boolean;
}

export const BorrowerReviewConsentStep: React.FC<Props> = ({
  formData,
  updateField,
  onEditSection,
  onSubmitApplication,
  onBack,
  isSubmitting,
  submitError,
  isDark,
}) => {
  const [consentError, setConsentError] = useState<string | null>(null);

  const cardBgClass = isDark
    ? 'border-[#2B3566] bg-[#1E2445] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  const allConsentsAccepted =
    formData.consentTerms && formData.consentPrivacy && formData.consentBureauCheck;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allConsentsAccepted) {
      setConsentError('Please accept all three mandatory legal consents to submit your application.');
      return;
    }
    setConsentError(null);
    onSubmitApplication();
  };

  const uploadedDocs = formData.documents.filter(
    (d) => d.status === 'UPLOADED' || d.status === 'VERIFIED'
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Step Header */}
      <div className={cn('p-6 rounded-3xl border space-y-2', cardBgClass)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Step 9: Final Review & Legal Consents</h2>
            <p className="text-xs text-slate-400">
              Review all application data carefully before submitting for underwriting and credit sanction
            </p>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Summary Section 1: Loan & Financial Parameters */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2B3566]">
          <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
            <Coins className="w-4 h-4 text-blue-500" />
            <span>Loan Facility & Repayment Structure</span>
          </h3>
          <button
            type="button"
            onClick={() => onEditSection('customizer')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/60 dark:border-[#2B3566]">
            <span className="text-slate-400 block text-[11px]">Requested Principal</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 block font-mono">
              {formatMoney(formData.requestedAmount)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/60 dark:border-[#2B3566]">
            <span className="text-slate-400 block text-[11px]">Loan Tenure</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 block font-mono">
              {formData.tenureMonths} Months
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/60 dark:border-[#2B3566]">
            <span className="text-slate-400 block text-[11px]">Loan Purpose</span>
            <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block truncate">
              {formData.purpose}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/60 dark:border-[#2B3566]">
            <span className="text-slate-400 block text-[11px]">Monthly Income</span>
            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5 block font-mono">
              {formatMoney(formData.monthlyIncome)}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Section 2: Personal & Identity Profile */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2B3566]">
          <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" />
            <span>Personal & Residential Profile</span>
          </h3>
          <button
            type="button"
            onClick={() => onEditSection('personal')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Full Legal Name</span>
            <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
              {formData.firstName} {formData.middleName ? formData.middleName + ' ' : ''}{formData.lastName}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Permanent Account Number (PAN)</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white mt-0.5 block tracking-wider">
              {formData.pan}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Mobile Phone</span>
            <span className="font-mono text-slate-900 dark:text-white mt-0.5 block">
              +91 {formData.mobile}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Email Address</span>
            <span className="font-mono text-slate-900 dark:text-white mt-0.5 block truncate">
              {formData.email}
            </span>
          </div>

          <div className="sm:col-span-2">
            <span className="text-slate-400 block text-[11px]">Residential Address</span>
            <span className="text-slate-900 dark:text-white mt-0.5 block">
              {formData.addressLine1}
              {formData.addressLine2 ? `, ${formData.addressLine2}` : ''}, {formData.city},{' '}
              {formData.state} - {formData.pincode}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Section 3: Disbursal Bank Account */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2B3566]">
          <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            <span>Destination Disbursal Bank</span>
          </h3>
          <button
            type="button"
            onClick={() => onEditSection('bank')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Bank Name</span>
            <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
              {formData.bankName}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Account Number</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white mt-0.5 block tracking-wider">
              {formData.accountNumber ? `•••• •••• ${formData.accountNumber.slice(-4)}` : 'Recorded'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">IFSC Code</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
              {formData.ifscCode}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Section 4: Attached Documents */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2B3566]">
          <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <span>Uploaded KYC & Financial Documents</span>
          </h3>
          <button
            type="button"
            onClick={() => onEditSection('documents')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {uploadedDocs.length > 0 ? (
            uploadedDocs.map((doc, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/60 dark:border-[#2B3566] flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {doc.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
                  {doc.fileName || 'Attached'}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 sm:col-span-2">
              No additional files uploaded. Documents can also be submitted later or provided to your assigned loan officer.
            </p>
          )}
        </div>
      </div>

      {/* Mandatory Legal Consents Grid */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#2B3566]">
          <Lock className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300">
            Mandatory Regulatory Declarations & Consents
          </h3>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Consent 1 */}
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl border border-slate-200/60 dark:border-[#2B3566] hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
            <input
              type="checkbox"
              checked={formData.consentTerms}
              onChange={(e) => updateField('consentTerms', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-500"
            />
            <span className="text-slate-700 dark:text-slate-300">
              <strong>General Terms & Loan Facility Agreement:</strong> I confirm that the information provided is accurate and true. I understand that false statements may lead to application rejection or cancellation under the Indian Penal Code.
            </span>
          </label>

          {/* Consent 2 */}
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl border border-slate-200/60 dark:border-[#2B3566] hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
            <input
              type="checkbox"
              checked={formData.consentPrivacy}
              onChange={(e) => updateField('consentPrivacy', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-500"
            />
            <span className="text-slate-700 dark:text-slate-300">
              <strong>Data Privacy & DPDP Act Mandate:</strong> I voluntarily consent to Adyapan LMS processing my personal and financial details electronically for underwriting, credit bureau evaluation, and loan servicing.
            </span>
          </label>

          {/* Consent 3 */}
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl border border-slate-200/60 dark:border-[#2B3566] hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
            <input
              type="checkbox"
              checked={formData.consentBureauCheck}
              onChange={(e) => updateField('consentBureauCheck', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-500"
            />
            <span className="text-slate-700 dark:text-slate-300">
              <strong>Credit Bureau Enquiry Authorization:</strong> I authorize Adyapan LMS to submit credit inquiries and retrieve my detailed credit report from TransUnion CIBIL, Experian, Equifax, or CRIF High Mark.
            </span>
          </label>
        </div>

        {consentError && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{consentError}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full sm:w-auto text-xs flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back: Documents</span>
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs px-10 py-4 rounded-xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting Application to Underwriting...</span>
            </>
          ) : (
            <>
              <span>Submit Loan Application For Sanction</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
