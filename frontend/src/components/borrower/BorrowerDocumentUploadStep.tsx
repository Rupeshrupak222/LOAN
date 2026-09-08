'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Camera,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { UploadedDocItem } from './BorrowerTypes';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Props {
  documents: UploadedDocItem[];
  onUploadDocument: (type: UploadedDocItem['type'], file: File) => Promise<boolean>;
  onNext: () => void;
  onBack: () => void;
  isDark: boolean;
}

const REQUIRED_DOCS: {
  type: UploadedDocItem['type'];
  title: string;
  desc: string;
  required: boolean;
  icon: any;
}[] = [
  {
    type: 'PAN_CARD',
    title: 'PAN Card Copy',
    desc: 'Clear image or PDF of physical or e-PAN card',
    required: true,
    icon: FileText,
  },
  {
    type: 'AADHAAR_FRONT',
    title: 'Aadhaar / Address Proof',
    desc: 'Front and back side of Aadhaar, Passport, or Voter ID',
    required: true,
    icon: ShieldCheck,
  },
  {
    type: 'BANK_STATEMENT',
    title: 'Bank Statement (Last 3-6 Months)',
    desc: 'Official e-statement PDF showing salary/turnover credits',
    required: true,
    icon: FileCheck,
  },
  {
    type: 'SALARY_SLIP',
    title: 'Salary Slip / Income ITR',
    desc: 'Latest 1-3 months pay slip or business ITR acknowledgement',
    required: false,
    icon: FileText,
  },
  {
    type: 'CUSTOMER_SELFIE_PHOTO',
    title: 'Applicant Photo / Selfie',
    desc: 'Recent passport photo or front camera selfie',
    required: false,
    icon: Camera,
  },
];

export const BorrowerDocumentUploadStep: React.FC<Props> = ({
  documents,
  onUploadDocument,
  onNext,
  onBack,
  isDark,
}) => {
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const cardBgClass = isDark
    ? 'border-[#2B3566] bg-[#1E2445] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  const getDocStatus = (type: UploadedDocItem['type']) => {
    return documents.find((d) => d.type === type) || { type, fileName: '', status: 'NOT_UPLOADED' };
  };

  const handleFileChange = async (
    type: UploadedDocItem['type'],
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit. Please choose a smaller file.');
      return;
    }

    setUploadError(null);
    setUploadingType(type);
    try {
      await onUploadDocument(type, file);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploadingType(null);
    }
  };

  const uploadedCount = documents.filter(
    (d) => d.status === 'UPLOADED' || d.status === 'VERIFIED'
  ).length;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Step Header */}
      <div className={cn('p-6 rounded-3xl border space-y-2', cardBgClass)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Step 8: Document Verification Center</h2>
              <p className="text-xs text-slate-400">
                Upload your digital documents to fast-track automated underwriting and credit sanction
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            {uploadedCount} / {REQUIRED_DOCS.length} Uploaded
          </span>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Document Upload Cards Grid */}
      <div className="space-y-3.5">
        {REQUIRED_DOCS.map((docDef) => {
          const docState = getDocStatus(docDef.type);
          const isUploaded = docState.status === 'UPLOADED' || docState.status === 'VERIFIED';
          const isBusy = uploadingType === docDef.type;
          const Icon = docDef.icon;

          return (
            <div
              key={docDef.type}
              className={cn(
                'p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                isUploaded
                  ? 'border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : cardBgClass
              )}
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                    isUploaded
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {docDef.title}
                    </h4>
                    {docDef.required && (
                      <span className="text-[10px] font-semibold text-rose-500">* Required</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{docDef.desc}</p>
                  {isUploaded && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{docState.fileName || 'Uploaded and Attached to File'}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Upload Action */}
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {isUploaded ? (
                  <label className="cursor-pointer">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                      Replace File
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      disabled={isBusy}
                      onChange={(e) => handleFileChange(docDef.type, e)}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <label className="cursor-pointer">
                    <div
                      className={cn(
                        'px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm',
                        isBusy
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                          : 'bg-[#2563EB] hover:bg-blue-700 text-white'
                      )}
                    >
                      {isBusy ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Choose File</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      disabled={isBusy}
                      onChange={(e) => handleFileChange(docDef.type, e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Instructions Callout */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/80 dark:border-[#2B3566] text-xs text-slate-500 dark:text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <span>
          <strong>Encrypted 256-bit Vault Storage:</strong> All uploaded files are stored in our secure document vault and processed strictly in accordance with RBI Data Privacy & Security Mandates.
        </span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="text-xs flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back: Loan Scheme</span>
        </Button>

        <Button
          type="submit"
          className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-8 py-3 rounded-xl shadow-md flex items-center gap-2"
        >
          <span>Next: Final Review & Legal Consents</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};
