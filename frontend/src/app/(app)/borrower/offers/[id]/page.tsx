'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Download,
  AlertCircle,
  FileText,
  Clock,
  Building2,
  Phone,
  Mail,
  Lock,
  Receipt,
  CreditCard,
  XCircle,
  ChevronRight,
  RefreshCw,
  HelpCircle,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner, Badge, Input } from '@/components/ui';

const formatINR = (val: any) => {
  const n = Number(val);
  return isNaN(n) ? '0' : n.toLocaleString('en-IN');
};

interface OfferDetails {
  id: string;
  offerNo: string;
  applicationId: string;
  applicationNo: string;
  productName: string;
  productCode: string;
  offeredAmount: number;
  tenureMonths: number;
  annualInterestRatePct: number;
  monthlyEmi: number;
  totalInterest: number;
  totalRepayment: number;
  processingFee: number;
  processingFeeGst: number;
  documentationCharges: number;
  documentationChargesGst: number;
  totalFeesAndTaxes: number;
  netDisbursedAmount: number;
  annualPercentageRateApr: number;
  status: 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | string;
  validUntil: string;
  isExpired: boolean;
  conditions: Array<{
    id: string;
    code: string;
    title: string;
    description: string;
    isMandatory: boolean;
    category: string;
    status: string;
  }>;
  version: number;
  createdAt: string;
}

interface ScheduleRow {
  installmentNumber: number;
  dueDate: string;
  principal: number;
  interest: number;
  emi: number;
  outstandingBalance: number;
}

interface KfsDetails {
  kfsId: string;
  offerId: string;
  loanAmount: number;
  annualPercentageRateApr: number;
  nominalInterestRate: number;
  interestType: string;
  tenureMonths: number;
  emiAmount: number;
  processingFee: number;
  gstAmount: number;
  documentationCharges: number;
  totalUpfrontDeductions: number;
  netDisbursementAmount: number;
  totalRepaymentAmount: number;
  totalInterestPayable: number;
  coolingOffDays: number;
  coolingOffEndDate: string;
  foreclosureCharges: string;
  penalInterestRate: string;
  grievanceRedressalOfficer: {
    name: string;
    designation: string;
    email: string;
    phone: string;
    address: string;
  };
  repaymentScheduleSummary: ScheduleRow[];
}

export default function BorrowerOfferKfsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const offerId = String(params.id);

  const [activeTab, setActiveTab] = useState<'offer' | 'kfs' | 'decision'>('offer');
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('Terms did not match expectation');
  const [kfsAccepted, setKfsAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successAction, setSuccessAction] = useState<{ type: 'ACCEPTED' | 'DECLINED'; message: string } | null>(null);

  // 1. Fetch Authoritative Offer Details
  const {
    data: offer,
    isLoading: isOfferLoading,
    isError: isOfferError,
    error: offerError,
    refetch: refetchOffer,
  } = useQuery<OfferDetails>({
    queryKey: ['borrower-offer-detail', offerId],
    queryFn: async () => {
      const res = await api.get<{ data: OfferDetails }>(`/borrower/offers/${offerId}`);
      return res.data?.data || (res.data as any);
    },
  });

  // 2. Fetch Statutory Key Fact Statement (KFS)
  const {
    data: kfs,
    isLoading: isKfsLoading,
    isError: isKfsError,
    error: kfsError,
    refetch: refetchKfs,
  } = useQuery<KfsDetails>({
    queryKey: ['borrower-kfs', offerId],
    queryFn: async () => {
      const res = await api.get<{ data: KfsDetails }>(`/borrower/offers/${offerId}/kfs`);
      return res.data?.data || (res.data as any);
    },
  });

  // Accept Offer Mutation
  const acceptMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      const res = await api.post(`/borrower/offers/${offerId}/accept`, {
        acceptanceMethod: 'CUSTOMER_PORTAL_OTP',
        kfsAccepted: true,
      });
      return res.data?.data || (res.data as any);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['borrower-offers'] });
      queryClient.invalidateQueries({ queryKey: ['borrower-offer-detail', offerId] });
      queryClient.invalidateQueries({ queryKey: ['borrower-home'] });
      queryClient.invalidateQueries({ queryKey: ['borrower-journey-state'] });
      setSuccessAction({
        type: 'ACCEPTED',
        message: data?.message || 'Loan offer accepted successfully. Your loan agreement is being generated for digital execution.',
      });
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to accept loan offer.');
    },
  });

  // Decline Offer Mutation
  const declineMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      const res = await api.post(`/borrower/offers/${offerId}/decline`, {
        reason: declineReason,
      });
      return res.data?.data || (res.data as any);
    },
    onSuccess: (data) => {
      setIsDeclineModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['borrower-offers'] });
      queryClient.invalidateQueries({ queryKey: ['borrower-offer-detail', offerId] });
      queryClient.invalidateQueries({ queryKey: ['borrower-home'] });
      queryClient.invalidateQueries({ queryKey: ['borrower-journey-state'] });
      setSuccessAction({
        type: 'DECLINED',
        message: data?.message || 'Loan offer has been declined.',
      });
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to decline loan offer.');
    },
  });

  if (isOfferLoading || isKfsLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Spinner />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Loading loan offer terms and Key Fact Statement...
        </p>
      </div>
    );
  }

  if (isOfferError || !offer) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Unable to Load Offer Details</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {(offerError as any)?.message || 'The requested loan offer could not be found or you do not have permission to view it.'}
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => refetchOffer()} variant="outline" className="gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </Button>
          <Link href="/borrower/offers">
            <Button variant="outline" className="gap-2 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Offers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isAccepted = offer.status === 'ACCEPTED' || successAction?.type === 'ACCEPTED';
  const isDeclined = offer.status === 'DECLINED' || successAction?.type === 'DECLINED';
  const isExpired = offer.isExpired || offer.status === 'EXPIRED';
  const isPending = !isAccepted && !isDeclined && !isExpired;

  // Post-Acceptance / Post-Decline Banner
  if (successAction) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
              successAction.type === 'ACCEPTED'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {successAction.type === 'ACCEPTED' ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>

          <div className="space-y-1">
            <span
              className={`text-2xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                successAction.type === 'ACCEPTED'
                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {successAction.type}
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
              {successAction.type === 'ACCEPTED' ? 'Offer & KFS Accepted Successfully' : 'Loan Offer Declined'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {successAction.message}
            </p>
          </div>

          {successAction.type === 'ACCEPTED' && (
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold">
                <ShieldCheck className="w-4 h-4" /> Next Step: Loan Agreement & Aadhaar eSign
              </div>
              <p className="text-2xs text-slate-600 dark:text-slate-400">
                Your digital loan agreement is ready. Complete your 1-minute Aadhaar OTP eSign to finalize execution and release funds directly to your verified bank account.
              </p>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            {successAction.type === 'ACCEPTED' ? (
              <>
                <Link href={`/borrower/agreements/${offer.applicationId}`}>
                  <Button className="w-full sm:w-auto text-xs px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5">
                    Review & Sign Agreement <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/borrower">
                  <Button variant="outline" className="w-full sm:w-auto text-xs px-4 py-2.5 rounded-xl">
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/borrower">
                  <Button className="text-xs px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    Go to Borrower Dashboard
                  </Button>
                </Link>
                <Link href="/borrower/offers">
                  <Button variant="outline" className="text-xs px-4 py-2.5 rounded-xl">
                    View All Offers
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/borrower/offers"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {offer.productName}
              </span>
              <span className="text-2xs font-mono text-slate-400">
                #{offer.offerNo}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Sanction Offer & Statutory KFS
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPending && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Clock className="w-3.5 h-3.5" /> Awaiting Borrower Decision
            </span>
          )}
          {isAccepted && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
            </span>
          )}
          {isDeclined && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <XCircle className="w-3.5 h-3.5" /> Declined
            </span>
          )}
          {isExpired && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-3.5 h-3.5" /> Expired
            </span>
          )}
        </div>
      </div>

      {/* Expiry / Validity Alert (Authoritative backend timestamp) */}
      {offer.validUntil && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs border ${
            isExpired
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
              : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              {isExpired ? 'This offer expired on ' : 'This binding sanction offer is valid until '}
              <strong className="font-semibold">
                {new Date(offer.validUntil).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </strong>
            </span>
          </div>
          <span className="text-2xs font-mono opacity-80 shrink-0">
            RBI Digital Lending Regulations
          </span>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-2xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('offer')}
          className={`pb-3 px-3 text-xs font-semibold transition-all relative flex items-center gap-2 ${
            activeTab === 'offer'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          1. Sanction Offer Summary
        </button>
        <button
          onClick={() => setActiveTab('kfs')}
          className={`pb-3 px-3 text-xs font-semibold transition-all relative flex items-center gap-2 ${
            activeTab === 'kfs'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          2. Statutory KFS (RBI)
        </button>
        <button
          onClick={() => setActiveTab('decision')}
          className={`pb-3 px-3 text-xs font-semibold transition-all relative flex items-center gap-2 ${
            activeTab === 'decision'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          3. Review & Accept / Decline
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SANCTION OFFER SUMMARY */}
      {/* ========================================================================= */}
      {activeTab === 'offer' && (
        <div className="space-y-6">
          {/* Main Hero Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/40 border border-blue-200 dark:border-blue-500/30 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-2xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Approved Sanction Amount
                </span>
                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                  ₹{formatINR(offer.offeredAmount)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Product: {offer.productName} ({offer.productCode})
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-1.5 min-w-[200px]">
                <div className="text-2xs text-slate-400 uppercase tracking-wider">Net Disbursed</div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ₹{formatINR(offer.netDisbursedAmount)}
                </div>
                <div className="text-2xs text-slate-500 dark:text-slate-400">
                  After upfront fees & statutory taxes
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-2xs text-slate-500 dark:text-slate-400 block">Monthly EMI</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  ₹{formatINR(offer.monthlyEmi)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-2xs text-slate-500 dark:text-slate-400 block">Tenure</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {offer.tenureMonths} Months
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-2xs text-slate-500 dark:text-slate-400 block">Nominal Rate</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {offer.annualInterestRatePct}% p.a.
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-2xs text-slate-500 dark:text-slate-400 block">Annual Rate (APR)</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {offer.annualPercentageRateApr}%
                </span>
              </div>
            </div>
          </div>

          {/* Upfront Fees & Repayment Obligations Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Upfront Deductions & Fees
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Processing Fee:</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    ₹{formatINR(offer.processingFee)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Statutory GST (18%):</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    ₹{formatINR(offer.processingFeeGst)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Documentation Charges + GST:</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    ₹{formatINR((Number(offer.documentationCharges || 0) + Number(offer.documentationChargesGst || 0)))}
                  </span>
                </div>
                <div className="flex justify-between pt-1 font-semibold text-slate-900 dark:text-white">
                  <span>Total Deductions:</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    - ₹{formatINR(offer.totalFeesAndTaxes)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Total Repayment Obligation
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Sanctioned Principal:</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    ₹{formatINR(offer.offeredAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Total Interest Payable:</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    ₹{formatINR(offer.totalInterest)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Repayment Mode:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Monthly Equated (Reducing Balance)
                  </span>
                </div>
                <div className="flex justify-between pt-1 font-semibold text-slate-900 dark:text-white">
                  <span>Total Payable:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    ₹{formatINR(offer.totalRepayment)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setActiveTab('kfs')}
              className="gap-2 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Continue to Statutory KFS <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STATUTORY KEY FACT STATEMENT (KFS) */}
      {/* ========================================================================= */}
      {activeTab === 'kfs' && kfs && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  RBI/2022-23/111 Statutory Standard
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  Key Fact Statement (KFS)
                </h2>
                <p className="text-2xs text-slate-400 font-mono">
                  Statement ID: {kfs.kfsId} • Offer #{offer.offerNo}
                </p>
              </div>

              <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                Lender: <strong className="text-slate-800 dark:text-slate-200">Adyapan Lending Partner NBFC</strong>
              </div>
            </div>

            {/* Standard RBI Disclosure Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800 text-2xs uppercase text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold w-12">#</th>
                    <th className="py-2.5 px-4 font-semibold">Parameter / Disclosure Field</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Details / Statutory Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-slate-400">1</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">Loan Amount (Sanctioned Principal)</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">₹{formatINR(kfs.loanAmount)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-slate-400">2</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">Total Upfront Fees & Deductions</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-600 dark:text-rose-400">₹{formatINR(kfs.totalUpfrontDeductions)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-slate-400">3</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">Net Disbursed Amount (Proceeds transferred to borrower)</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{formatINR(kfs.netDisbursementAmount)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-slate-400">4</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">Total Repayment Amount (Principal + Interest)</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">₹{formatINR(kfs.totalRepaymentAmount)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-slate-400">5</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">Total Interest Payable over loan tenure</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-800 dark:text-slate-200">₹{formatINR(kfs.totalInterestPayable)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-slate-400">6</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">Annual Percentage Rate (APR)</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">{kfs.annualPercentageRateApr}%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-slate-400">7</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">Nominal Interest Rate & Computation Type</td>
                    <td className="py-2.5 px-4 text-right text-slate-800 dark:text-slate-200">{kfs.nominalInterestRate}% p.a. ({kfs.interestType})</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-slate-400">8</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">Loan Tenure</td>
                    <td className="py-2.5 px-4 text-right font-medium text-slate-800 dark:text-slate-200">{kfs.tenureMonths} Months</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-slate-400">9</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">Equated Monthly Installment (EMI)</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">₹{formatINR(kfs.emiAmount)} / Month</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-slate-400">10</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">Statutory Cooling-Off / Look-Up Period</td>
                    <td className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{kfs.coolingOffDays} Days (Until {kfs.coolingOffEndDate})</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-slate-400">11</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">Pre-payment / Foreclosure Charges</td>
                    <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-300">{kfs.foreclosureCharges}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-slate-400">12</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">Penal Interest Rate</td>
                    <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-300">{kfs.penalInterestRate}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Grievance Redressal Officer Info */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                RBI Nodal Grievance Redressal Officer
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 pt-1">
                <div>
                  <strong>Name:</strong> {kfs.grievanceRedressalOfficer.name} ({kfs.grievanceRedressalOfficer.designation})
                </div>
                <div>
                  <strong>Email:</strong> {kfs.grievanceRedressalOfficer.email}
                </div>
                <div>
                  <strong>Toll-Free Phone:</strong> {kfs.grievanceRedressalOfficer.phone}
                </div>
                <div>
                  <strong>Address:</strong> {kfs.grievanceRedressalOfficer.address}
                </div>
              </div>
            </div>

            {/* Repayment Schedule Preview */}
            {kfs.repaymentScheduleSummary && kfs.repaymentScheduleSummary.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Amortization & Installment Schedule ({kfs.repaymentScheduleSummary.length} Installments)
                </h3>
                <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-2xs text-left">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800">
                      <tr>
                        <th className="py-2 px-3 font-semibold">#</th>
                        <th className="py-2 px-3 font-semibold">Due Date</th>
                        <th className="py-2 px-3 font-semibold text-right">Principal</th>
                        <th className="py-2 px-3 font-semibold text-right">Interest</th>
                        <th className="py-2 px-3 font-semibold text-right">Monthly EMI</th>
                        <th className="py-2 px-3 font-semibold text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {kfs.repaymentScheduleSummary.map((row) => (
                        <tr key={row.installmentNumber} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                          <td className="py-2 px-3 text-slate-400">{row.installmentNumber}</td>
                          <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300">{row.dueDate}</td>
                          <td className="py-2 px-3 text-right">₹{formatINR(row.principal)}</td>
                          <td className="py-2 px-3 text-right text-slate-500">₹{formatINR(row.interest)}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">₹{formatINR(row.emi)}</td>
                          <td className="py-2 px-3 text-right text-slate-500">₹{formatINR(row.outstandingBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              variant="outline"
              onClick={() => setActiveTab('offer')}
              className="text-xs rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Offer Summary
            </Button>
            <Button
              onClick={() => setActiveTab('decision')}
              className="gap-2 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Proceed to Decision <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REVIEW & DECISION (ACCEPT / DECLINE) */}
      {/* ========================================================================= */}
      {activeTab === 'decision' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                Final Step • Borrower Decision
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                Offer Acceptance & Statutory Agreement Consent
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please verify the authoritative offer parameters below before executing your acceptance or opting out.
              </p>
            </div>

            {/* Comparison Panel: Lending System Terms vs Borrower Request */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs space-y-3">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Sanctioned Facility Parameters (Lending Engine Authoritative)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-2xs text-slate-400 block">Sanctioned Amount</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹{formatINR(offer.offeredAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-2xs text-slate-400 block">Net In-Bank Disbursement</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{formatINR(offer.netDisbursedAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-2xs text-slate-400 block">Monthly Repayment (EMI)</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹{formatINR(offer.monthlyEmi)}
                  </span>
                </div>
                <div>
                  <span className="text-2xs text-slate-400 block">Approved Tenure</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {offer.tenureMonths} Months
                  </span>
                </div>
                <div>
                  <span className="text-2xs text-slate-400 block">Annual Rate (APR)</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {offer.annualPercentageRateApr}%
                  </span>
                </div>
                <div>
                  <span className="text-2xs text-slate-400 block">Upfront Deductions (Inc. GST)</span>
                  <span className="font-mono font-medium text-rose-600 dark:text-rose-400">
                    ₹{formatINR(offer.totalFeesAndTaxes)}
                  </span>
                </div>
              </div>
            </div>

            {/* Mandatory Regulatory Checkbox */}
            {isPending && (
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/60 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kfsAccepted}
                    onChange={(e) => setKfsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    I confirm that I have read, reviewed, and understood the <strong>Statutory Key Fact Statement (KFS)</strong>,
                    annualized percentage rate (APR) of <strong>{offer.annualPercentageRateApr}%</strong>, monthly EMI of{' '}
                    <strong>₹{formatINR(offer.monthlyEmi)}</strong>, and total upfront deductions of{' '}
                    <strong>₹{formatINR(offer.totalFeesAndTaxes)}</strong>. I formally give my consent to accept this sanctioned credit facility.
                  </span>
                </label>
              </div>
            )}

            {/* Action Bar */}
            {isPending ? (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDeclineModalOpen(true)}
                  disabled={declineMutation.isPending || acceptMutation.isPending}
                  className="w-full sm:w-auto text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" /> Decline Offer
                </Button>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <Button
                    onClick={() => acceptMutation.mutate()}
                    disabled={!kfsAccepted || acceptMutation.isPending || declineMutation.isPending}
                    className="w-full sm:w-auto text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {acceptMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Spinner /> Processing Acceptance...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Accept Offer & Confirm KFS
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            ) : isAccepted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>This offer has already been accepted. The digital agreement is ready for eSign in Phase M5.</span>
                </div>
                <Link href="/borrower">
                  <Button size="sm" variant="outline" className="text-2xs rounded-xl">
                    Dashboard
                  </Button>
                </Link>
              </div>
            ) : isDeclined ? (
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>This loan offer was declined by the borrower.</span>
                </div>
                <Link href="/borrower/apply">
                  <Button size="sm" className="text-2xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                    Apply Again
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>This offer has expired. Contact customer support or re-apply.</span>
                </div>
                <Link href="/borrower/apply">
                  <Button size="sm" className="text-2xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                    Re-Apply
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decline Confirmation Modal */}
      {isDeclineModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-bold text-sm">
              <XCircle className="w-5 h-5" /> Decline Sanction Offer
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to decline this loan offer? If you decline, this application will be cancelled and you will need to re-apply if you require funds in the future.
            </p>

            <div className="space-y-1.5">
              <label className="text-2xs font-semibold text-slate-700 dark:text-slate-300">
                Reason for declining (Optional)
              </label>
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="Terms did not match expectation">Terms did not match expectation</option>
                <option value="Interest rate is higher than anticipated">Interest rate is higher than anticipated</option>
                <option value="Sanctioned amount is insufficient">Sanctioned amount is insufficient</option>
                <option value="Arranged funds through alternate channel">Arranged funds through alternate channel</option>
                <option value="No longer requiring credit facility">No longer requiring credit facility</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeclineModalOpen(false)}
                disabled={declineMutation.isPending}
                className="text-xs rounded-xl"
              >
                Keep Offer
              </Button>
              <Button
                size="sm"
                onClick={() => declineMutation.mutate()}
                disabled={declineMutation.isPending}
                className="text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {declineMutation.isPending ? <Spinner /> : 'Confirm Decline'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
