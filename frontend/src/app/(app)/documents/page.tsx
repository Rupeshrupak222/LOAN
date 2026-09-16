'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Download,
  RefreshCw,
  ExternalLink,
  Filter,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  User,
  Phone,
  FileCheck,
  ShieldCheck,
  X
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { Card, Button } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatDate, formatMoney, cn } from '@/lib/utils';
import { evaluateDocumentFulfillment } from '@/lib/documentRules';

export default function DocumentsWorkspacePage() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const isCreditAnalyst =
    user?.roles?.includes('CREDIT_ANALYST') &&
    !user?.roles?.some((r) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER'].includes(r));

  // Active Borrower Case Selection (null = list of all borrowers, string = view specific borrower's documents page)
  const initialAppId = searchParams.get('applicationId');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(initialAppId);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'MISSING' | 'PENDING' | 'COMPLETED'>('ALL');
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [kycRemarksInput, setKycRemarksInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 1. Fetch all documents from live database
  const { data: docs = [], isLoading: docsLoading, refetch: refetchDocs, isRefetching } = useQuery({
    queryKey: ['documents-workspace'],
    queryFn: async () => {
      const res = await api.get('/documents');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
    refetchInterval: 10000,
  });

  // 2. Fetch applications to map loan proposals
  const { data: apps = [] } = useQuery({
    queryKey: ['documents-apps-mapping'],
    queryFn: async () => {
      const res = await api.get('/applications', { params: { pageSize: 100 } });
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
    refetchInterval: 15000,
  });

  // Build a map of customerId -> application
  const customerAppMap = useMemo(() => {
    const map = new Map<string, any>();
    apps.forEach((a: any) => {
      const cId = a.customerId || a.customer?.id;
      if (cId && !map.has(cId)) {
        map.set(cId, a);
      }
    });
    return map;
  }, [apps]);

  // Verification Mutation (calls PATCH /documents/:id/verify)
  const verifyDocMutation = useMutation({
    mutationFn: async ({ docId, status, remarks }: { docId: string; status: 'VERIFIED' | 'REJECTED'; remarks?: string }) => {
      return api.patch(`/documents/${docId}/verify`, { status, rejectionReason: remarks });
    },
    onSuccess: (_, variables) => {
      toast.success(`Document marked as ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ['documents-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['documents-apps-mapping'] });
      queryClient.invalidateQueries({ queryKey: ['credit-assessment'] });
      queryClient.invalidateQueries({ queryKey: ['credit-assessment-queue'] });
      queryClient.invalidateQueries({ queryKey: ['credit-assessment-detail'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-360'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      if (previewDoc && previewDoc.id === variables.docId) {
        setPreviewDoc((prev: any) => prev ? { ...prev, status: variables.status, verified: variables.status === 'VERIFIED' } : null);
      }
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err));
    },
  });

  // Finalize Customer KYC Mutation
  const finalizeKycMutation = useMutation({
    mutationFn: async ({ customerId, remarks }: { customerId: string; remarks: string }) => {
      const res = await api.patch(`/customers/${customerId}/kyc`, {
        kycStatus: 'VERIFIED',
        remarks: remarks || 'All mandatory borrower documents verified and approved',
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Borrower KYC compliance status has been officially updated to VERIFIED.');
      queryClient.invalidateQueries({ queryKey: ['documents-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['customer-360'] });
    },
    onError: (err: any) => {
      toast.error('KYC Verification Failed', apiErrorMessage(err));
    },
  });

  // Group all documents by Borrower Proposal Case
  // Group all documents by Borrower Proposal Case
  const borrowerCases = useMemo(() => {
    const caseMap = new Map<string, {
      id: string;
      application?: any;
      customer: any;
      docs: any[];
      checklist: Array<{
        key: string;
        label: string;
        description: string;
        status: 'VERIFIED' | 'PENDING' | 'MISSING';
        matchingDoc?: any;
      }>;
      missingCount: number;
      missingNames: string[];
      checklistPendingCount: number;
      checklistVerifiedCount: number;
      docsCount: number;
      docsVerifiedCount: number;
      docsPendingCount: number;
    }>();

    // 1. Initialize from applications (Filtered for Credit Analyst to only show forwarded/active proposals)
    const targetApps = isCreditAnalyst
      ? apps.filter((a: any) =>
          [
            'SUBMITTED',
            'CREDIT_ASSESSMENT',
            'UNDER_REVIEW',
            'UNDERWRITING',
            'APPROVED',
            'DISBURSED',
            'AGREEMENT_PENDING',
            'READY_FOR_DISBURSEMENT',
            'RETURNED',
          ].includes(a.status)
        )
      : apps;

    targetApps.forEach((app: any) => {
      const caseId = app.id;
      const appCustomerId = app.customerId || app.customer?.id;

      // Match all docs for this application or borrower profile in the database
      const matchingDocs = docs.filter((d: any) => {
        if (d.applicationId && d.applicationId === app.id) return true;
        if (d.application?.id && d.application.id === app.id) return true;
        if (appCustomerId && (d.customerId === appCustomerId || d.customer?.id === appCustomerId)) return true;
        return false;
      });

      // Deduplicate docs by ID
      const docMap = new Map<string, any>();
      matchingDocs.forEach((d: any) => docMap.set(d.id, d));

      caseMap.set(caseId, {
        id: caseId,
        application: app,
        customer: app.customer || { firstName: 'Valued', lastName: 'Borrower', customerCode: 'KYC Vault' },
        docs: Array.from(docMap.values()),
        checklist: [],
        missingCount: 0,
        missingNames: [],
        checklistPendingCount: 0,
        checklistVerifiedCount: 0,
        docsCount: 0,
        docsVerifiedCount: 0,
        docsPendingCount: 0,
      });
    });

    // 2. For non-Credit Analysts, also add standalone documents not tied to any target application
    if (!isCreditAnalyst) {
      docs.forEach((doc: any) => {
        const customerId = doc.customerId || doc.customer?.id;
        const caseId = doc.applicationId || doc.application?.id || customerId || doc.id;
        if (!caseMap.has(caseId)) {
          caseMap.set(caseId, {
            id: caseId,
            application: doc.application,
            customer: doc.customer || { firstName: 'Valued', lastName: 'Borrower', customerCode: 'KYC Vault' },
            docs: [doc],
            checklist: [],
            missingCount: 0,
            missingNames: [],
            checklistPendingCount: 0,
            checklistVerifiedCount: 0,
            docsCount: 0,
            docsVerifiedCount: 0,
            docsPendingCount: 0,
          });
        }
      });
    }

    // 3. Compute dynamic checklist per borrower case using authoritative rules engine
    caseMap.forEach((c) => {
      const empType =
        c.customer?.employmentType ||
        c.customer?.employmentDetails?.[0]?.employmentType ||
        'SALARIED';
      const prodType =
        (c.application?.product as any)?.productType ||
        c.application?.product?.name ||
        'PERSONAL';
      const reqAmt = Number(c.application?.requestedAmount || 0);
      const mIncome = Number(c.customer?.monthlyIncome || 0);

      const docEval = evaluateDocumentFulfillment(c.docs, empType, prodType, {
        monthlyIncome: mIncome,
        requestedAmount: reqAmt,
      });

      let pending = 0;
      let verified = 0;

      c.checklist = docEval.checklistStatus.map((item) => {
        const matchingDoc = item.matchingDocs?.[0];
        if (!item.isSatisfied || !matchingDoc) {
          return {
            key: item.rule.code,
            label: item.rule.name,
            description: item.rule.description || 'Mandatory underwriting document',
            status: 'MISSING' as const,
          };
        }
        const isVer = matchingDoc.verified || matchingDoc.status === 'VERIFIED';
        if (isVer) {
          verified++;
          return {
            key: item.rule.code,
            label: item.rule.name,
            description: item.rule.description || 'Mandatory underwriting document',
            status: 'VERIFIED' as const,
            matchingDoc,
          };
        } else {
          pending++;
          return {
            key: item.rule.code,
            label: item.rule.name,
            description: item.rule.description || 'Mandatory underwriting document',
            status: 'PENDING' as const,
            matchingDoc,
          };
        }
      });

      const totalDocs = c.docs.length;
      const verifiedDocs = c.docs.filter((d: any) => d.verified === true || d.status === 'VERIFIED').length;
      const pendingDocs = totalDocs - verifiedDocs;

      c.docsCount = totalDocs;
      c.docsVerifiedCount = verifiedDocs;
      c.docsPendingCount = pendingDocs;
      c.missingCount = docEval.missingCodes.length;
      c.missingNames = docEval.missingNames;
      c.checklistPendingCount = pending;
      c.checklistVerifiedCount = verified;
    });

    return Array.from(caseMap.values());
  }, [apps, docs, customerAppMap, isCreditAnalyst]);

  // Filtered borrower cases for the main list view
  const filteredCases = useMemo(() => {
    return borrowerCases.filter((c) => {
      const term = searchTerm.toLowerCase().trim();
      const name = `${c.customer?.firstName || ''} ${c.customer?.lastName || ''}`.toLowerCase();
      const code = (c.customer?.customerCode || '').toLowerCase();
      const mobile = (c.customer?.mobile || '').toLowerCase();
      const appNo = (c.application?.applicationNo || '').toLowerCase();

      const matchesSearch = !term || name.includes(term) || code.includes(term) || mobile.includes(term) || appNo.includes(term);

      if (!matchesSearch) return false;

      if (filterMode === 'MISSING') return c.missingCount > 0;
      if (filterMode === 'PENDING') return c.docsPendingCount > 0;
      if (filterMode === 'COMPLETED') return c.missingCount === 0 && c.docsPendingCount === 0;

      return true;
    });
  }, [borrowerCases, searchTerm, filterMode]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));
  const paginatedCases = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCases.slice(start, start + pageSize);
  }, [filteredCases, page, pageSize]);

  // Active case for dedicated single-page view
  const activeCase = useMemo(() => {
    if (!selectedCaseId) return null;
    return borrowerCases.find((c) => c.id === selectedCaseId || c.application?.id === selectedCaseId) || null;
  }, [selectedCaseId, borrowerCases]);

  // Handler to open a borrower's document page
  const openBorrowerDocumentsPage = (caseId: string) => {
    setSelectedCaseId(caseId);
    setPreviewDoc(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler to return to main borrowers list
  const closeBorrowerDocumentsPage = () => {
    setSelectedCaseId(null);
    setPreviewDoc(null);
  };

  // =========================================================================
  // VIEW 2: DEDICATED FULL PAGE FOR BORROWER DOCUMENTS & REQUIRED CHECKLIST
  // (Zero Popups! Opens directly on the page as requested by user)
  // =========================================================================
  if (activeCase) {
    const customer = activeCase.customer;
    const app = activeCase.application;
    const customerName = `${customer?.firstName || 'Borrower'} ${customer?.lastName || ''}`.trim();

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Back Navigation Button */}
        <div>
          <button
            onClick={closeBorrowerDocumentsPage}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Borrowers</span>
          </button>
        </div>

        {/* Borrower Overview Banner */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
              {customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">{customerName}</h1>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {customer?.customerCode || 'KYC Vault'}
                </span>
                {app?.status && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                    {app.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Application #{app?.applicationNo || 'Direct KYC'}</span>
                {customer?.mobile && <span>· Phone: {customer.mobile}</span>}
                {app?.requestedAmount && <span>· Loan: <strong className="text-slate-800 dark:text-slate-200">{formatMoney(app.requestedAmount)}</strong></span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {app && (
              <Link href={`/credit-assessment?applicationId=${app.id}`}>
                <Button size="sm" className="gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer h-9">
                  <span>Start Credit Assessment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* SECTION 1: REQUIRED DOCUMENTS CHECKLIST & GAP ANALYSIS */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-500" />
                <span>Required Underwriting Documents Checklist</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Mandatory document checks required for credit policy sanction
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-emerald-600 dark:text-emerald-400">{activeCase.checklistVerifiedCount} Verified</span>
              <span>·</span>
              <span className="text-amber-500">{activeCase.checklistPendingCount} Pending</span>
              <span>·</span>
              <span className="text-rose-600 dark:text-rose-400">{activeCase.missingCount} Missing</span>
            </div>
          </div>

          {/* Dynamic Profile-Aware Underwriting Checklist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {activeCase.checklist.map((item) => {
              const isMissing = item.status === 'MISSING';
              const isVerified = item.status === 'VERIFIED';
              const isPending = item.status === 'PENDING';

              return (
                <div
                  key={item.key}
                  className={cn(
                    'p-3.5 rounded-xl border flex flex-col justify-between space-y-2.5 transition',
                    isVerified
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : isPending
                      ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20'
                      : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5">
                      <p className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                        {item.label}
                      </p>
                      {isVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : isPending ? (
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {item.description}
                    </p>
                  </div>

                  <div>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200">
                        ✓ Uploaded &amp; Verified
                      </span>
                    ) : isPending ? (
                      <div className="flex items-center justify-between gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200">
                          ⏳ Pending Review
                        </span>
                        {item.matchingDoc && (
                          <button
                            onClick={() => verifyDocMutation.mutate({ docId: item.matchingDoc.id, status: 'VERIFIED' })}
                            className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/80 dark:text-rose-200">
                        ✕ Missing Document
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: ALL UPLOADED DOCUMENTS TABLE */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Uploaded Borrower Documents ({activeCase.docsCount})</span>
              </h2>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                ({activeCase.docsVerifiedCount} Verified · {activeCase.docsPendingCount} Pending Verification)
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Click &quot;Preview&quot; to review file artifacts in-page
            </span>
          </div>

          {activeCase.docs.length === 0 ? (
            <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
              <p className="font-bold text-xs text-slate-800 dark:text-slate-200">No documents uploaded yet</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                The loan officer has not yet uploaded files for this borrower proposal.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-[#1E2445] rounded-xl">
              <table className="min-w-[720px] w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#2B3566] bg-slate-50 dark:bg-[#1E2445]/50 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-3 px-3 min-w-[180px]">File Name</th>
                    <th className="py-3 px-3 min-w-[120px]">Category</th>
                    <th className="py-3 px-3 min-w-[110px]">Uploaded Date</th>
                    <th className="py-3 px-3 min-w-[130px]">Verification Status</th>
                    <th className="py-3 px-3 text-right min-w-[180px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2B3566]">
                  {activeCase.docs.map((doc: any) => {
                    const isVerified = doc.verified || doc.status === 'VERIFIED';
                    const isRejected = doc.status === 'REJECTED';
                    const isSelected = previewDoc?.id === doc.id;

                    return (
                      <tr
                        key={doc.id}
                        className={cn(
                          'transition-colors',
                          isSelected
                            ? 'bg-blue-50/70 dark:bg-blue-950/40'
                            : 'hover:bg-slate-50 dark:hover:bg-[#1E2445]/50'
                        )}
                      >
                        {/* File Name */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-xs">
                                {doc.fileName || doc.documentType || 'Uploaded Document'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {doc.documentType || doc.id?.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {doc.category || 'GENERAL'}
                          </span>
                        </td>

                        {/* Upload Date */}
                        <td className="py-3 px-3 text-slate-500 text-xs">
                          {doc.createdAt ? formatDate(doc.createdAt) : '-'}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 text-rose-500 font-bold text-xs">
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-500 font-bold text-xs">
                              <Clock className="w-3.5 h-3.5" /> Pending Review
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right whitespace-nowrap min-w-[180px]">
                          <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                            <Button
                              size="sm"
                              variant={isSelected ? 'primary' : 'secondary'}
                              onClick={() => setPreviewDoc(doc)}
                              className="text-xs px-2.5 cursor-pointer font-semibold whitespace-nowrap shrink-0"
                            >
                              <Eye className="w-3 h-3 mr-1 shrink-0" />
                              {isSelected ? 'Viewing' : 'Preview'}
                            </Button>
                            {!isVerified && (
                              <Button
                                size="sm"
                                onClick={() => verifyDocMutation.mutate({ docId: doc.id, status: 'VERIFIED' })}
                                className="text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer font-semibold whitespace-nowrap shrink-0"
                              >
                                Verify
                              </Button>
                            )}
                            {!isRejected && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => verifyDocMutation.mutate({ docId: doc.id, status: 'REJECTED', remarks: 'Deficient document artifact' })}
                                className="text-xs px-2 border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer font-semibold whitespace-nowrap shrink-0"
                              >
                                Reject
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* SECTION 3: BORROWER KYC VERIFICATION FINALIZATION & REMARKS */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Borrower KYC Compliance &amp; Verification Finalization</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verify all required borrower documents above, record audit remarks, and finalize customer KYC compliance
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Customer KYC Status:</span>
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                    activeCase.customer?.kycStatus === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  )}
                >
                  {activeCase.customer?.kycStatus || 'NOT_STARTED'}
                </span>
              </div>
            </div>

            {/* Validation Feedback & Missing Alert Section */}
            {(() => {
              const unverifiedDocs = (activeCase.docs || []).filter((d: any) => !d.verified && d.status !== 'VERIFIED');
              const missingItems = (activeCase.checklist || []).filter((item: any) => item.status === 'MISSING');
              const isAllClear = unverifiedDocs.length === 0 && missingItems.length === 0 && (activeCase.docs || []).length > 0;

              if (isAllClear) {
                return (
                  <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                      <strong className="font-bold">Ready for Final KYC Verification!</strong> All {activeCase.docsCount} uploaded documents are verified and mandatory checklist criteria are fulfilled.
                    </div>
                  </div>
                );
              }

              return (
                <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Incomplete Document Verification ({unverifiedDocs.length} pending, {missingItems.length} missing)</span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pl-6">
                    {unverifiedDocs.length > 0 && (
                      <p>
                        <strong className="text-rose-600 dark:text-rose-400 font-bold">Unverified Documents:</strong>{' '}
                        {unverifiedDocs.map((d: any) => d.fileName || d.documentType).join(', ')}
                      </p>
                    )}
                    {missingItems.length > 0 && (
                      <p>
                        <strong className="text-rose-600 dark:text-rose-400 font-bold">Missing Required Artifacts:</strong>{' '}
                        {missingItems.map((item: any) => item.label).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Remarks Box & Action Controls */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Verification Remarks / Compliance Notes *
              </label>
              <textarea
                rows={2}
                value={kycRemarksInput}
                onChange={(e) => setKycRemarksInput(e.target.value)}
                placeholder="e.g. All 6 mandatory borrower documents inspected, cross-verified with official credentials, and verified for credit assessment."
                className="w-full rounded-xl border border-slate-300 dark:border-[#2B3566] bg-white dark:bg-[#0C152B] p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                <p className="text-[11px] text-slate-400">
                  ⚠️ Validation checks ensure that all documents are strictly verified before customer KYC status is updated to <strong className="text-emerald-500 font-semibold">VERIFIED</strong>.
                </p>
                <Button
                  onClick={() => {
                    if (!activeCase?.customer?.id) return;
                    const unverifiedDocs = (activeCase.docs || []).filter((d: any) => !d.verified && d.status !== 'VERIFIED');
                    const missingItems = (activeCase.checklist || []).filter((item: any) => item.status === 'MISSING');

                    if (unverifiedDocs.length > 0) {
                      const docNames = unverifiedDocs.map((d: any) => d.fileName || d.documentType || 'Document').join(', ');
                      toast.error(
                        'Document Verification Incomplete!',
                        `Aapne abhi sabhi documents verify nahi kiye! Pending document(s): "${docNames}". Pehle sabhi documents verify karein tabhi customer verify hoga.`
                      );
                      return;
                    }

                    if (missingItems.length > 0) {
                      const missingNames = missingItems.map((item: any) => item.label).join(', ');
                      toast.error(
                        'Mandatory Documents Missing!',
                        `Ye zaroori documents abhi missing hain: "${missingNames}". Sabhi zaroori documents ke bina customer verify nahi ho sakta.`
                      );
                      return;
                    }

                    finalizeKycMutation.mutate({
                      customerId: activeCase.customer.id,
                      remarks: kycRemarksInput.trim() || 'All borrower identity, income, and bank documents thoroughly verified and approved.',
                    });
                  }}
                  disabled={finalizeKycMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{finalizeKycMutation.isPending ? 'Verifying Customer...' : 'Verify Customer &amp; Finalize KYC'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* SECTION 4: MODAL OVERLAY PREVIEW (Opens as a page/modal on top of the screen) */}
          {previewDoc && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setPreviewDoc(null)}
            >
              <div
                className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0C152B] shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E2445]/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {previewDoc.fileName || previewDoc.documentType}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                          {previewDoc.category || 'GENERAL'}
                        </span>
                        <span className="text-[11px] text-slate-400">·</span>
                        <span
                          className={cn(
                            'text-xs font-bold',
                            previewDoc.verified || previewDoc.status === 'VERIFIED'
                              ? 'text-emerald-500'
                              : previewDoc.status === 'REJECTED'
                              ? 'text-rose-500'
                              : 'text-amber-500'
                          )}
                        >
                          {previewDoc.verified || previewDoc.status === 'VERIFIED'
                            ? 'Verified'
                            : previewDoc.status === 'REJECTED'
                            ? 'Rejected'
                            : 'Pending Review'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="Close Preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body / Document Preview */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-100/50 dark:bg-black/30 min-h-[350px]">
                  {(() => {
                    const getDocUrl = (doc: any) => {
                      if (!doc) return '';
                      const raw = doc.storageKey || doc.fileUrl || doc.url || '';
                      if (!raw) return '';
                      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
                        return raw;
                      }
                      if (raw.startsWith('/uploads')) {
                        const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') || 'http://localhost:4000';
                        return `${backendBase}${raw}`;
                      }
                      return raw;
                    };

                    const fileUrl = getDocUrl(previewDoc);
                    const isImage = Boolean(
                      fileUrl.toLowerCase().match(/\.(jpeg|jpg|png|webp|gif|svg)/i) ||
                      previewDoc.fileName?.toLowerCase().match(/\.(jpeg|jpg|png|webp|gif|svg)/i) ||
                      fileUrl.includes('res.cloudinary.com') ||
                      fileUrl.startsWith('data:image/')
                    );
                    const isPdf = Boolean(
                      fileUrl.toLowerCase().endsWith('.pdf') ||
                      previewDoc.fileName?.toLowerCase().endsWith('.pdf')
                    );

                    if (!fileUrl) {
                      return (
                        <div className="py-12 text-center text-slate-400 text-sm">
                          Document binary preview is not available for this record.
                        </div>
                      );
                    }

                    if (isImage) {
                      return (
                        <div className="max-h-[60vh] max-w-full overflow-hidden rounded-xl flex items-center justify-center bg-black/5 dark:bg-black/40 p-2 shadow-inner">
                          <img
                            src={fileUrl}
                            alt={previewDoc.fileName || 'Document Artifact'}
                            className="max-h-[58vh] max-w-full object-contain rounded-lg shadow-md"
                          />
                        </div>
                      );
                    }

                    if (isPdf) {
                      return (
                        <div className="w-full h-[60vh] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                          <iframe
                            src={fileUrl}
                            title={previewDoc.fileName || 'PDF Document'}
                            className="w-full h-full"
                          />
                        </div>
                      );
                    }

                    return (
                      <div className="py-12 text-center space-y-3">
                        <FileText className="w-16 h-16 mx-auto text-blue-500" />
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {previewDoc.fileName || 'Document Artifact'}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {fileUrl}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E2445]/50">
                  {(() => {
                    const getDocUrl = (doc: any) => {
                      if (!doc) return '';
                      const raw = doc.storageKey || doc.fileUrl || doc.url || '';
                      if (!raw) return '';
                      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
                        return raw;
                      }
                      if (raw.startsWith('/uploads')) {
                        const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') || 'http://localhost:4000';
                        return `${backendBase}${raw}`;
                      }
                      return raw;
                    };
                    const fileUrl = getDocUrl(previewDoc);
                    return fileUrl ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" /> Open in New Tab / Download
                      </a>
                    ) : <div />;
                  })()}

                  <div className="flex items-center gap-2">
                    {!previewDoc.verified && previewDoc.status !== 'VERIFIED' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          verifyDocMutation.mutate({ docId: previewDoc.id, status: 'VERIFIED' });
                          setPreviewDoc((prev: any) => prev ? { ...prev, status: 'VERIFIED', verified: true } : null);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer text-xs font-semibold px-4"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve &amp; Verify
                      </Button>
                    )}
                    {previewDoc.status !== 'REJECTED' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          verifyDocMutation.mutate({ docId: previewDoc.id, status: 'REJECTED', remarks: 'Deficient document' });
                          setPreviewDoc((prev: any) => prev ? { ...prev, status: 'REJECTED', verified: false } : null);
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer text-xs font-semibold px-4"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" /> Reject Document
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewDoc(null)}
                      className="cursor-pointer text-xs font-semibold px-4"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: MAIN BORROWERS LIST (Clean, Simple, Uncluttered)
  // =========================================================================
  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        breadcrumb="Lending / Document Vault"
        title="Borrower Document Dossiers"
        subtitle="Select a borrower to review uploaded files, identify missing required documents, and complete verification"
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                refetchDocs();
                toast.info('Refreshed', 'Borrower documents synchronized with database.');
              }}
              disabled={isRefetching}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isRefetching && 'animate-spin')} />
              Sync Database
            </Button>
          </div>
        }
      />

      {/* Filter Tabs & Search Bar */}
      <Card noPadding className="p-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#1E2445] text-xs font-bold w-fit flex-wrap">
            <button
              onClick={() => setFilterMode('ALL')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                filterMode === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              All Borrowers ({borrowerCases.length})
            </button>
            <button
              onClick={() => setFilterMode('MISSING')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                filterMode === 'MISSING'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Missing Documents ({borrowerCases.filter((c) => c.missingCount > 0).length})
            </button>
            <button
              onClick={() => setFilterMode('PENDING')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                filterMode === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Pending Verification ({borrowerCases.filter((c) => c.docsPendingCount > 0).length})
            </button>
            <button
              onClick={() => setFilterMode('COMPLETED')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                filterMode === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Fully Complete ({borrowerCases.filter((c) => c.missingCount === 0 && c.docsPendingCount === 0).length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by borrower, app #, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 border border-slate-200 dark:border-[#1E2445] rounded-xl text-xs bg-slate-50 dark:bg-[#0C152B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Main Borrowers List Table */}
      <Card noPadding className="p-4">
        {docsLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : filteredCases.length === 0 ? (
          <div className="py-16 text-center space-y-2.5">
            <User className="w-10 h-10 mx-auto text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Borrower Cases Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No borrower cases matched your current search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#2B3566] text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-3 min-w-[180px]">Borrower / Applicant</th>
                  <th className="py-3 px-3 min-w-[140px]">Application #</th>
                  <th className="py-3 px-3 min-w-[120px]">Requested Loan</th>
                  <th className="py-3 px-3 min-w-[130px]">Uploaded Files</th>
                  <th className="py-3 px-3 min-w-[160px]">Checklist Status</th>
                  <th className="py-3 px-3 text-right min-w-[160px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2B3566]">
                {paginatedCases.map((c) => {
                  const customerName = `${c.customer?.firstName || 'Borrower'} ${c.customer?.lastName || ''}`.trim();
                  const appNo = c.application?.applicationNo;
                  const requestedAmount = c.application?.requestedAmount;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#1E2445]/50 transition-colors">
                      {/* Borrower Info */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{customerName}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                              <span>{c.customer?.customerCode || 'KYC Vault'}</span>
                              {c.customer?.mobile && (
                                <>
                                  <span>·</span>
                                  <span>{c.customer.mobile}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Application # */}
                      <td className="py-3.5 px-3">
                        {appNo ? (
                          <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-xs">
                            #{appNo}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">Direct Customer Vault</span>
                        )}
                      </td>

                      {/* Loan Amount */}
                      <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white text-xs">
                        {requestedAmount ? formatMoney(requestedAmount) : 'N/A'}
                      </td>

                      {/* Uploaded Files Count */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {c.docsCount} Uploaded
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {c.docsVerifiedCount} Verified · {c.docsPendingCount} Pending
                        </p>
                      </td>

                      {/* Checklist Gap Status */}
                      <td className="py-3.5 px-3">
                        {c.missingCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            {c.missingCount} Missing Required
                          </span>
                        ) : c.docsPendingCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            {c.docsPendingCount} Pending Verification
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            All Documents Verified
                          </span>
                        )}
                      </td>

                      {/* View Documents Action Button */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap min-w-[160px]">
                        <Button
                          size="sm"
                          onClick={() => openBorrowerDocumentsPage(c.id)}
                          className="gap-1.5 text-xs font-semibold bg-[#2563EB] hover:bg-blue-700 text-white px-3 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                        >
                          <span>View Documents</span>
                          <ArrowRight className="w-3 h-3 shrink-0" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {filteredCases.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-1 border-t border-slate-100 dark:border-[#2B3566] text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span>
                    Showing {Math.min((page - 1) * pageSize + 1, filteredCases.length)} to{' '}
                    {Math.min(page * pageSize, filteredCases.length)} of {filteredCases.length} dossiers
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="ml-2 px-2 py-1 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Previous Page"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Next Page"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
