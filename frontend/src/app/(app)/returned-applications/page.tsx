'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RotateCcw,
  Search,
  Send,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  Building2,
  Calendar,
  AlertCircle,
  FileCheck,
  ArrowRight,
  RefreshCw,
  X,
  FileUp,
  ShieldAlert,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, Input } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';

type StageFilter = 'ALL' | 'UNDERWRITING' | 'BRANCH_MANAGER' | 'CREDIT_ASSESSMENT' | 'MISSING_DOCS' | 'READY_TO_RESUBMIT';

interface ReturnedAppRow {
  id: string;
  applicationNo: string;
  customerId: string;
  customer: any;
  customerName: string;
  customerMobile?: string;
  customerEmail?: string;
  customerCode?: string;
  kycStatus: string;
  riskCategory: string;
  product: string;
  productDetail?: any;
  requestedAmount: string;
  tenureMonths: number;
  purpose?: string;
  status: string;
  returnDetails: {
    returnedBy: string;
    returnedByRole: string;
    returnStage: string;
    stageLabel: string;
    returnReason: string;
    returnedAt: string;
  };
  missingDocuments: { key: string; label: string; defaultDocType: string }[];
  missingLabels: string[];
  isComplete: boolean;
  documentsList: any[];
  createdAt: string;
  updatedAt: string;
}

const DOCUMENT_CATEGORIES = [
  { key: 'IDENTITY_PROOF', label: 'Identity Proof (PAN / Aadhaar)', defaultType: 'PAN_CARD' },
  { key: 'APPLICANT_PHOTO', label: 'Applicant Photo / Selfie', defaultType: 'CUSTOMER_SELFIE_PHOTO' },
  { key: 'ADDRESS_PROOF', label: 'Address Proof (Electricity / Passport / Rent)', defaultType: 'ELECTRICITY_BILL' },
  { key: 'INCOME_PROOF', label: 'Income Proof (Salary Slip / 3M Pay Slip / ITR)', defaultType: 'SALARY_SLIP' },
  { key: 'BANK_STATEMENT', label: 'Bank Statement (Latest 6 Months)', defaultType: 'BANK_STATEMENT' },
];

export default function ReturnedApplicationsPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('ALL');

  // Quick Document Upload Modal State
  const [uploadModalApp, setUploadModalApp] = useState<ReturnedAppRow | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('IDENTITY_PROOF');
  const [selectedDocType, setSelectedDocType] = useState<string>('PAN_CARD');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Resubmit Proposal Modal State
  const [resubmitModalApp, setResubmitModalApp] = useState<ReturnedAppRow | null>(null);
  const [resubmitReason, setResubmitReason] = useState(
    'Borrower documents and verification deficiencies rectified by Loan Officer. Resubmitting for credit assessment.'
  );

  // Fetch Returned Applications & Summary Metrics
  const { data: responseData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['returned-applications', search, stageFilter],
    queryFn: async () => {
      const res = await api.get('/applications/returned', {
        params: {
          search: search.trim() || undefined,
          stage: stageFilter !== 'ALL' ? stageFilter : undefined,
        },
      });
      return res.data?.data;
    },
  });

  const apps: ReturnedAppRow[] = Array.isArray(responseData?.data) ? responseData.data : [];
  const metrics = responseData?.metrics || {
    totalReturned: 0,
    returnedByUnderwriter: 0,
    returnedByBranchManager: 0,
    returnedByCreditAnalyst: 0,
    missingDocsCount: 0,
    readyToResubmitCount: 0,
  };

  // Upload Document Handler
  const handleUploadDocument = async () => {
    if (!uploadModalApp || !selectedFile) {
      toast.error('Please select a valid document file to upload.');
      return;
    }
    const custId = uploadModalApp.customerId || uploadModalApp.customer?.id;
    if (!custId) {
      toast.error('Customer ID missing for this application.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('customerId', custId);
      formData.append('applicationId', uploadModalApp.id);
      formData.append('category', selectedCategory);
      formData.append('documentType', selectedDocType);

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`${selectedFile.name} uploaded successfully! Deficiencies updated.`);
      queryClient.invalidateQueries({ queryKey: ['returned-applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application', uploadModalApp.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Reset modal state
      setUploadModalApp(null);
      setSelectedFile(null);
    } catch (err: any) {
      toast.error(apiErrorMessage(err), { title: 'Upload Failed' });
    } finally {
      setIsUploading(false);
    }
  };

  // Resubmit Application Mutation
  const resubmitMutation = useMutation({
    mutationFn: async ({ appId, reason }: { appId: string; reason: string }) => {
      return api.post(`/applications/${appId}/transition`, {
        toStatus: 'SUBMITTED',
        reason: reason.trim() || 'Application resubmitted to Credit Analyst queue by Loan Officer',
      });
    },
    onSuccess: () => {
      toast.success('Proposal successfully resubmitted to Credit Appraisal queue.');
      queryClient.invalidateQueries({ queryKey: ['returned-applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['credit-assessment-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      setResubmitModalApp(null);
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Resubmission Notice' });
    },
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <PageHeader
        breadcrumb="Lending / Returned Applications"
        title="Returned Applications Desk"
        subtitle="Review proposals sent back by Underwriters, Branch Managers, or Credit Analysts. Rectify borrower document deficiencies and resubmit for credit appraisal."
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-xs shadow-2xs cursor-pointer"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin text-blue-500')} />
              Refresh Desk
            </Button>
            <Link href="/applications/new">
              <Button size="sm" className="text-white flex items-center gap-1.5 text-xs shadow-2xs">
                + Originate Application
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Returned */}
        <div
          onClick={() => setStageFilter('ALL')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:border-amber-500/50',
            stageFilter === 'ALL'
              ? (isDark ? 'border-amber-500 bg-[#1E2445] ring-1 ring-amber-500/40' : 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500/30')
              : (isDark ? 'border-[#2B3566] bg-[#171B36]' : 'border-slate-200 bg-white')
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
              Total Returned
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <RotateCcw className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black">{metrics.totalReturned}</span>
            <span className="text-[11px] text-slate-400">Applications</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requiring Loan Officer action</p>
        </div>

        {/* 2. Returned from Underwriting */}
        <div
          onClick={() => setStageFilter('UNDERWRITING')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:border-blue-500/50',
            stageFilter === 'UNDERWRITING'
              ? (isDark ? 'border-blue-500 bg-[#1E2445] ring-1 ring-blue-500/40' : 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/30')
              : (isDark ? 'border-[#2B3566] bg-[#171B36]' : 'border-slate-200 bg-white')
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
              Underwriter Send-Backs
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black">{metrics.returnedByUnderwriter}</span>
            <span className="text-[11px] text-slate-400">Proposals</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Returned from sanction review</p>
        </div>

        {/* 3. Returned from Branch Desk */}
        <div
          onClick={() => setStageFilter('BRANCH_MANAGER')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:border-purple-500/50',
            stageFilter === 'BRANCH_MANAGER'
              ? (isDark ? 'border-purple-500 bg-[#1E2445] ring-1 ring-purple-500/40' : 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500/30')
              : (isDark ? 'border-[#2B3566] bg-[#171B36]' : 'border-slate-200 bg-white')
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-500">
              Branch Manager Returns
            </span>
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black">{metrics.returnedByBranchManager}</span>
            <span className="text-[11px] text-slate-400">Proposals</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sent back by local branch manager</p>
        </div>

        {/* 4. Deficient / Missing Documents */}
        <div
          onClick={() => setStageFilter('MISSING_DOCS')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:border-rose-500/50',
            stageFilter === 'MISSING_DOCS'
              ? (isDark ? 'border-rose-500 bg-[#1E2445] ring-1 ring-rose-500/40' : 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-500/30')
              : (isDark ? 'border-[#2B3566] bg-[#171B36]' : 'border-slate-200 bg-white')
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
              Missing Documents
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <FileUp className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-500">{metrics.missingDocsCount}</span>
            <span className="text-[11px] text-slate-400">Needs Upload</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Mandatory KYC / Income missing</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        {/* Stage Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {[
            { key: 'ALL', label: 'All Returns', count: metrics.totalReturned },
            { key: 'UNDERWRITING', label: 'Underwriter', count: metrics.returnedByUnderwriter },
            { key: 'BRANCH_MANAGER', label: 'Branch Manager', count: metrics.returnedByBranchManager },
            { key: 'CREDIT_ASSESSMENT', label: 'Credit Appraisal', count: metrics.returnedByCreditAnalyst },
            { key: 'MISSING_DOCS', label: 'Pending Docs', count: metrics.missingDocsCount },
            { key: 'READY_TO_RESUBMIT', label: 'Ready to Resubmit', count: metrics.readyToResubmitCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStageFilter(tab.key as StageFilter)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer',
                stageFilter === tab.key
                  ? 'bg-[#2563EB] text-white shadow-sm shadow-[#2563EB]/30'
                  : isDark
                  ? 'bg-[#171B36] border border-[#2B3566] text-slate-300 hover:bg-[#1E2445]'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-md text-[10px] font-mono',
                  stageFilter === tab.key
                    ? 'bg-white/20 text-white'
                    : isDark
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search borrower, app #, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Main Applications List */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : apps.length === 0 ? (
        <div
          className={cn(
            'flex flex-col items-center justify-center p-12 text-center rounded-2xl border',
            isDark ? 'border-[#2B3566] bg-[#171B36]' : 'border-slate-200 bg-white'
          )}
        >
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3 border border-emerald-500/20">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Returned Applications
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
            {stageFilter !== 'ALL'
              ? `No returned applications found under the '${stageFilter.replace(/_/g, ' ')}' filter.`
              : 'Great job! There are currently no loan applications sent back for corrections in your queue.'}
          </p>
          {stageFilter !== 'ALL' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setStageFilter('ALL')}
              className="text-xs"
            >
              Clear Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => {
            const hasMissing = !app.isComplete;
            const returnStage = app.returnDetails.returnStage;

            return (
              <div
                key={app.id}
                className={cn(
                  'rounded-2xl border transition-all p-5 relative overflow-hidden',
                  isDark
                    ? 'border-[#2B3566] bg-[#171B36] hover:border-slate-600'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                )}
              >
                {/* Left decorative color bar */}
                <div
                  className={cn(
                    'absolute left-0 top-0 bottom-0 w-1.5',
                    returnStage === 'UNDERWRITING'
                      ? 'bg-blue-500'
                      : returnStage === 'BRANCH_MANAGER'
                      ? 'bg-purple-500'
                      : 'bg-amber-500'
                  )}
                />

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Application Header & Borrower Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/applications/${app.id}`}
                        className="text-sm font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline font-mono tracking-wide"
                      >
                        {app.applicationNo}
                      </Link>

                      {/* Return Stage Badge */}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          returnStage === 'UNDERWRITING'
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            : returnStage === 'BRANCH_MANAGER'
                            ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        )}
                      >
                        <RotateCcw className="h-3 w-3" />
                        {app.returnDetails.stageLabel || 'Returned for Correction'}
                      </span>

                      {/* Current Status Badge */}
                      <Badge status={app.status} />

                      {/* Document Completeness Indicator */}
                      {hasMissing ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          <AlertTriangle className="h-3 w-3" /> {app.missingDocuments.length} Document(s) Missing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Documents Ready
                        </span>
                      )}
                    </div>

                    {/* Borrower Info Row */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {app.customerName}
                        </span>
                        {app.customerCode && (
                          <span className="font-mono text-[10px] text-slate-400">
                            ({app.customerCode})
                          </span>
                        )}
                      </div>

                      {app.customerMobile && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{app.customerMobile}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400">KYC:</span>
                        <Badge status={app.kycStatus || 'NOT_STARTED'} />
                      </div>
                    </div>

                    {/* Product & Sanction Amount */}
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-200/60 dark:border-[#2B3566] space-y-0.5">
                        <p className="text-[10px] font-medium text-slate-400 uppercase">Product & Amount</p>
                        <p className="font-bold text-slate-800 dark:text-white">
                          {app.product} — <span className="text-[#2563EB] dark:text-[#60A5FA]">{formatMoney(app.requestedAmount)}</span>
                          <span className="text-[11px] font-normal text-slate-400 ml-1.5">({app.tenureMonths} mos)</span>
                        </p>
                      </div>

                      {/* Return Metadata */}
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#1E2445] border border-slate-200/60 dark:border-[#2B3566] space-y-0.5">
                        <p className="text-[10px] font-medium text-slate-400 uppercase">Returned By & Date</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-200">
                          {app.returnDetails.returnedBy}
                          <span className="text-[10px] text-slate-400 ml-2">
                            ({formatDate(app.returnDetails.returnedAt || app.updatedAt)})
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Prominent Return Reason Quote Box */}
                    <div
                      className={cn(
                        'p-3.5 rounded-xl border text-xs space-y-1',
                        returnStage === 'UNDERWRITING'
                          ? 'border-blue-200 bg-blue-50/70 text-blue-900 dark:border-blue-900/50 dark:bg-[#131B38] dark:text-blue-200'
                          : returnStage === 'BRANCH_MANAGER'
                          ? 'border-purple-200 bg-purple-50/70 text-purple-900 dark:border-purple-900/50 dark:bg-[#201533] dark:text-purple-200'
                          : 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900/50 dark:bg-[#2B2012] dark:text-amber-200'
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>Decider Return Reason & Deficiency Notes:</span>
                      </div>
                      <p className="leading-relaxed pl-5 italic font-medium">
                        "{app.returnDetails.returnReason}"
                      </p>
                    </div>

                    {/* Missing Document Tags */}
                    {hasMissing && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Action Required: Upload Missing Mandatory Documents
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {app.missingDocuments.map((m) => (
                            <span
                              key={m.key}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300"
                            >
                              <X className="h-3 w-3 text-rose-500" />
                              {m.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Quick Actions */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-end gap-2 lg:w-48 shrink-0 pt-2 lg:pt-0">
                    {/* 1. Review Full Application */}
                    <Link href={`/applications/${app.id}`} className="w-full">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs font-bold justify-center cursor-pointer"
                      >
                        Review Application
                      </Button>
                    </Link>

                    {/* 2. Quick Upload Missing Document */}
                    {hasMissing && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setUploadModalApp(app);
                          if (app.missingDocuments[0]) {
                            setSelectedCategory(app.missingDocuments[0].key);
                            setSelectedDocType(app.missingDocuments[0].defaultDocType);
                          }
                          setSelectedFile(null);
                        }}
                        className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Upload className="h-3.5 w-3.5" /> Quick Upload Doc
                      </Button>
                    )}

                    {/* 3. Resubmit to Credit Analyst */}
                    <Button
                      size="sm"
                      onClick={() => {
                        setResubmitModalApp(app);
                        setResubmitReason(
                          'Borrower documents and verification deficiencies rectified by Loan Officer. Resubmitting for credit assessment.'
                        );
                      }}
                      className="w-full text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Send className="h-3.5 w-3.5" /> Resubmit Proposal
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK DOCUMENT UPLOAD MODAL */}
      {uploadModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-lg rounded-2xl border shadow-2xl p-6 relative transition-all',
              isDark ? 'bg-[#171B36] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B3566]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Quick Document Upload</h3>
                  <p className="text-xs text-slate-400">
                    Upload missing or rectified files for proposal #{uploadModalApp.applicationNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadModalApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              {/* App Summary */}
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-[#1E2445] text-xs space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Borrower: <span className="font-bold">{uploadModalApp.customerName}</span> ({uploadModalApp.customerCode})
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Application: <span className="font-mono font-bold text-amber-600">{uploadModalApp.applicationNo}</span> — {uploadModalApp.product}
                </p>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Document Category *
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setSelectedCategory(cat);
                    const def = DOCUMENT_CATEGORIES.find((d) => d.key === cat)?.defaultType || 'PAN_CARD';
                    setSelectedDocType(def);
                  }}
                  className={cn(
                    'w-full text-xs rounded-xl border p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500',
                    isDark ? 'bg-[#101326] border-[#2B3566] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  )}
                >
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Type Selector */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Document Type Label *
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className={cn(
                    'w-full text-xs rounded-xl border p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500',
                    isDark ? 'bg-[#101326] border-[#2B3566] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  )}
                >
                  {selectedCategory === 'IDENTITY_PROOF' && (
                    <>
                      <option value="PAN_CARD">PAN Card</option>
                      <option value="AADHAAR">Aadhaar Card</option>
                      <option value="PASSPORT">Passport</option>
                      <option value="VOTER_ID">Voter ID</option>
                      <option value="DRIVING_LICENSE">Driving License</option>
                    </>
                  )}
                  {selectedCategory === 'APPLICANT_PHOTO' && (
                    <>
                      <option value="CUSTOMER_SELFIE_PHOTO">Customer Selfie / Photo</option>
                      <option value="APPLICANT_PHOTO">Applicant Photograph</option>
                    </>
                  )}
                  {selectedCategory === 'ADDRESS_PROOF' && (
                    <>
                      <option value="ELECTRICITY_BILL">Electricity Bill</option>
                      <option value="WATER_BILL">Water Bill</option>
                      <option value="RENTAL_AGREEMENT">Rental Agreement</option>
                      <option value="PASSPORT">Passport Address</option>
                      <option value="VOTER_ID">Voter ID Card</option>
                    </>
                  )}
                  {selectedCategory === 'INCOME_PROOF' && (
                    <>
                      <option value="SALARY_SLIP">Salary Slip (Recent 3 Months)</option>
                      <option value="ITR">Income Tax Return (ITR V)</option>
                      <option value="FORM_16">Form 16</option>
                      <option value="PAYSLIP">Pay Slip</option>
                    </>
                  )}
                  {selectedCategory === 'BANK_STATEMENT' && (
                    <>
                      <option value="BANK_STATEMENT">Bank Statement (Last 6 Months)</option>
                      <option value="BANK_PASSBOOK">Bank Passbook Copy</option>
                    </>
                  )}
                </select>
              </div>

              {/* File Picker */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Select File (PDF, JPG, PNG) *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className={cn(
                    'w-full text-xs rounded-xl border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100',
                    isDark ? 'bg-[#101326] border-[#2B3566] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  )}
                />
                {selectedFile && (
                  <p className="text-[11px] text-emerald-500 mt-1 font-semibold">
                    Ready to upload: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#2B3566]">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setUploadModalApp(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!selectedFile || isUploading}
                  onClick={handleUploadDocument}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    'Uploading...'
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" /> Upload Document
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESUBMIT TO CREDIT ANALYST MODAL */}
      {resubmitModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-lg rounded-2xl border shadow-2xl p-6 relative transition-all',
              isDark ? 'bg-[#171B36] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B3566]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Resubmit Proposal</h3>
                  <p className="text-xs text-slate-400">
                    Forward proposal #{resubmitModalApp.applicationNo} back to Credit Appraisal Queue
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResubmitModalApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              {/* Application Details */}
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-[#1E2445] text-xs space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Borrower: <span className="font-bold">{resubmitModalApp.customerName}</span> ({resubmitModalApp.customerCode})
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Requested Sanction: <span className="font-bold text-blue-600">{formatMoney(resubmitModalApp.requestedAmount)}</span> ({resubmitModalApp.product})
                </p>
              </div>

              {/* Previous Return Reason Reference */}
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-[#2B2012] border border-amber-200 dark:border-amber-900/40 text-xs space-y-1 text-amber-900 dark:text-amber-200">
                <p className="font-bold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Previous Reviewer Remarks:
                </p>
                <p className="italic pl-4">"{resubmitModalApp.returnDetails.returnReason}"</p>
              </div>

              {/* Missing Documents Warning (if any) */}
              {!resubmitModalApp.isComplete && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Warning: Missing Mandatory Documents
                  </p>
                  <p className="pl-4">
                    The following documents are missing: {resubmitModalApp.missingLabels.join(', ')}. Please upload them before resubmitting.
                  </p>
                </div>
              )}

              {/* Loan Officer Rectification Notes */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Loan Officer Rectification Remarks *
                </label>
                <textarea
                  rows={3}
                  value={resubmitReason}
                  onChange={(e) => setResubmitReason(e.target.value)}
                  placeholder="Describe the corrections made, document re-uploads, or borrower clarifications..."
                  className={cn(
                    'w-full text-xs rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500',
                    isDark ? 'bg-[#101326] border-[#2B3566] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  )}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#2B3566]">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setResubmitModalApp(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!resubmitReason.trim() || resubmitMutation.isPending}
                  onClick={() =>
                    resubmitMutation.mutate({
                      appId: resubmitModalApp.id,
                      reason: resubmitReason,
                    })
                  }
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {resubmitMutation.isPending ? (
                    'Resubmitting...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Confirm & Resubmit Proposal
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
