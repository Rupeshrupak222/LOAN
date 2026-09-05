'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  Info,
  ShieldCheck,
  ShieldAlert,
  Search,
  Eye,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Button, Card, Badge } from './ui';

export interface DocumentIntelligenceData {
  documentId: string;
  fileName: string;
  storageUrl: string;
  category: string;
  uploadedAt: string;
  analyzedAt: string;
  model: string;
  recommendedReview?: string;
  documentSummary?: string;
  reviewRationale?: string;

  classification: {
    detectedType: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
    matchesDeclaredCategory: boolean;
  };

  extractedFields: {
    holderName?: string;
    documentNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    employerName?: string;
    reportedIncome?: string;
    salaryPeriod?: string;
    bankName?: string;
    bankAccountNo?: string;
    issueDate?: string;
    expiryDate?: string;
    rawTextExcerpt?: string;
  };

  comparisons: {
    field: string;
    applicationValue: string;
    documentValue: string;
    status: 'MATCH' | 'PARTIAL_MATCH' | 'MISMATCH' | 'NOT_PRESENT_IN_DOC' | 'NOT_PRESENT_IN_APP';
    severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    explanation: string;
    suggestedAction: string;
  }[];

  qualityAssessment: {
    quality: 'CLEAR_READABLE' | 'MODERATE_QUALITY' | 'BLURRY_OR_DEGRADED' | 'CROPPED_OR_INCOMPLETE';
    readabilityScore: number;
    observations: string;
  };

  anomalySignals: {
    signal: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    explanation: string;
    reviewAction: string;
  }[];

  completeness: {
    totalDocuments: number;
    verifiedDocuments: number;
    missingMandatoryCategories: string[];
    completenessStatus: 'COMPLETE' | 'PARTIALLY_COMPLETE' | 'INCOMPLETE';
  };

  forgeryIndicators: string[];
  crossCheckSummary: string;
  ocrConfidence: number;
  recommendedReviewAction: 'ACCEPT' | 'RE_UPLOAD_REQUEST' | 'MANUAL_VERIFICATION_REQUIRED' | 'FRAUD_ESCALATION';
  summary: string;
}

interface Props {
  document: {
    id: string;
    type: string;
    fileName: string;
    fileUrl?: string;
    customerName?: string;
    category?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentIntelligenceModal({ document, isOpen, onClose }: Props) {
  const { isDark } = useTheme();
  const toast = useToast();
  const [data, setData] = useState<DocumentIntelligenceData | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/ai/documents/${document.id}/analyze`);
      return res.data?.data as DocumentIntelligenceData;
    },
    onSuccess: (result) => {
      setData(result);
      toast.success('Document analysis completed.');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Document Intelligence Notice' });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div
        className={cn(
          'w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all',
          isDark ? 'bg-[#0B1220] border-[#1E2445] text-white' : 'bg-white border-slate-200 text-slate-900'
        )}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-[#1E2445] shrink-0 bg-slate-50/50 dark:bg-[#131E36]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">AI Document Intelligence & Mismatch Audit</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  Gemini Vision
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">
                {document.fileName} · Category: <span className="font-semibold text-slate-300">{document.category}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              className="gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold shadow-xs cursor-pointer"
            >
              {mutation.isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Analyzing Document...</span>
                </>
              ) : data ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Re-Analyze</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Run AI Document Analysis</span>
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {data ? (
            <div className="space-y-4 animate-in fade-in">
              {/* Classification & Summary Banner */}
              <div
                className={cn(
                  'p-4 rounded-xl border space-y-2',
                  isDark ? 'bg-[#0F172A] border-[#1E2445]' : 'bg-slate-50 border-slate-200'
                )}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Classified Document:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                      {data.classification.detectedType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {data.classification.confidence} CONFIDENCE
                    </span>
                  </div>

                  {/* Recommendation Badge */}
                  <span
                    className={cn(
                      'text-[10px] font-extrabold px-2.5 py-1 rounded-md border uppercase',
                      data.recommendedReview === 'NO_OBVIOUS_ISSUE_DETECTED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : data.recommendedReview === 'MANUAL_REVIEW_RECOMMENDED'
                        ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                    )}
                  >
                    {data.recommendedReview ? data.recommendedReview.replace(/_/g, ' ') : 'PENDING REVIEW'}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                  {data.documentSummary}
                </p>

                <p className="text-[11px] text-slate-400 italic">
                  💡 {data.reviewRationale}
                </p>
              </div>

              {/* Document vs LMS Application Comparison Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileCheck2 className="h-4 w-4 text-indigo-500" />
                    <span>LMS Application Record vs Document Cross-Check</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {data.comparisons.filter((c) => c.status === 'MATCH').length} / {data.comparisons.length} Matched
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-[#1E2445] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-[#15203D] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-[#1E2445]">
                      <tr>
                        <th className="py-2 px-3">Field</th>
                        <th className="py-2 px-3">Application Value</th>
                        <th className="py-2 px-3">Extracted from Document</th>
                        <th className="py-2 px-3 text-right">Audit Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1E2445]">
                      {data.comparisons.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-[#16203D]/50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {c.field}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono">
                            {c.applicationValue || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-900 dark:text-slate-100 font-bold font-mono">
                            {c.documentValue || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={cn(
                                'text-[10px] font-extrabold px-2 py-0.5 rounded uppercase border',
                                c.status === 'MATCH'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : c.status === 'PARTIAL_MATCH'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                                  : c.status === 'MISMATCH'
                                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                              )}
                            >
                              {c.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Extracted Fields & Quality Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Extracted Fields Summary */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#121B33] space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>AI Extracted Key Fields</span>
                  </h4>
                  <dl className="space-y-1 text-[11px]">
                    {data.extractedFields.holderName && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Name on File:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{data.extractedFields.holderName}</span>
                      </div>
                    )}
                    {data.extractedFields.documentNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Document No:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{data.extractedFields.documentNumber}</span>
                      </div>
                    )}
                    {data.extractedFields.dateOfBirth && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Date of Birth:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{data.extractedFields.dateOfBirth}</span>
                      </div>
                    )}
                    {data.extractedFields.employerName && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Employer:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{data.extractedFields.employerName}</span>
                      </div>
                    )}
                    {data.extractedFields.reportedIncome && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Reported Salary/Income:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{data.extractedFields.reportedIncome}</span>
                      </div>
                    )}
                    {data.extractedFields.salaryPeriod && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Period:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{data.extractedFields.salaryPeriod}</span>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Quality & Vault Completeness */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#121B33] space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>Quality & KYC Vault Completeness</span>
                  </h4>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Readability Score:</span>
                      <span className="font-bold font-mono text-indigo-500">{data.qualityAssessment.readabilityScore}/100 ({data.qualityAssessment.quality.replace(/_/g, ' ')})</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">KYC Vault Status:</span>
                      <span className="font-bold uppercase text-emerald-600">{data.completeness.completenessStatus}</span>
                    </div>
                    {data.completeness.missingMandatoryCategories.length > 0 && (
                      <div className="pt-1 border-t border-slate-200 dark:border-[#1E2445]">
                        <span className="text-rose-500 font-semibold block">Missing Mandatory Categories:</span>
                        <span className="text-slate-400">{data.completeness.missingMandatoryCategories.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Anomaly Signals Banner (if any) */}
              {data.anomalySignals && data.anomalySignals.length > 0 && (
                <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50/70 dark:bg-rose-950/30 dark:border-rose-900/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Potential Document Anomalies Detected</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-rose-900 dark:text-rose-200 space-y-0.5 pl-1">
                    {data.anomalySignals.map((a, idx) => (
                      <li key={idx}>
                        <strong>{a.signal}:</strong> {a.explanation} <em>(Action: {a.reviewAction})</em>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Advisory Disclaimer */}
              <p className="text-[10px] text-slate-400 italic text-center pt-2 border-t border-slate-100 dark:border-[#1E2445]">
                AI Decision-Support Only — Extracted values are advisory and do not automatically approve or reject documents. Official decisions remain under the authorized reviewer.
              </p>
            </div>
          ) : (
            <div className="p-10 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 mx-auto">
                <Sparkles className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Run AI Document Understanding</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Gemini will inspect this document, extract key fields, cross-check against the borrower application, and highlight any potential discrepancies.
              </p>
              <Button
                size="sm"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
                className="gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold shadow-sm"
              >
                {mutation.isPending ? 'Analyzing with Gemini...' : 'Start Document Analysis'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
