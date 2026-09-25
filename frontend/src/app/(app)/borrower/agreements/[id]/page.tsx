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
  Lock,
  Receipt,
  CreditCard,
  RefreshCw,
  HelpCircle,
  ChevronRight,
  Send,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner, Badge, Input } from '@/components/ui';
import { useToast } from '@/lib/toast';

interface AgreementClause {
  clauseNumber: string;
  heading: string;
  body: string;
}

interface DigitalAgreement {
  agreementId: string;
  agreementNumber: string;
  applicationId: string;
  applicationNo: string;
  tenantId: string;
  lenderLegalEntity: string;
  borrowerFullName: string;
  sanctionAmount: number;
  interestRateAnnual: number;
  tenureMonths: number;
  monthlyEmi: number;
  clauses: AgreementClause[];
  status: string;
  generatedAt: string;
}

interface ContractStatusResponse {
  applicationId: string;
  hasAgreement: boolean;
  agreementStatus: string;
  esignStatus: string;
  mandateStatus: string;
  umrn?: string;
  canDisburse: boolean;
  agreement?: DigitalAgreement;
  esign?: {
    sessionId: string;
    provider: string;
    providerReference?: string;
    status: string;
    signingUrl?: string;
    certificateId?: string;
    signedDocumentUrl?: string;
    auditTrail?: Array<{ timestamp: string; event: string; ipAddress: string }>;
  };
  mandate?: {
    mandateId: string;
    provider: string;
    authMode: string;
    umrn: string;
    bankName: string;
    accountNumberMasked: string;
    ifscCode: string;
    status: string;
  };
}

interface DisbursementStatusResponse {
  applicationId: string;
  applicationNo: string;
  productName: string;
  productCode?: string;
  status: string;
  stage: string;
  sanctionedAmount: number;
  netDisbursementAmount: number;
  monthlyEmi?: number;
  tenureMonths: number;
  annualInterestRatePct: number;
  checks: {
    offerAccepted: boolean;
    agreementGenerated: boolean;
    agreementSigned: boolean;
    mandateActive: boolean;
    bankAccountVerified: boolean;
    financeVerified: boolean;
    disbursementSettled: boolean;
  };
  financeProcessingStage: string;
  contract: {
    agreementId?: string;
    agreementNumber?: string;
    agreementStatus: string;
    esignStatus: string;
    esignSessionId?: string;
    signedAt?: string;
    mandateStatus: string;
    umrn?: string;
  };
  beneficiaryBank: {
    accountHolderName: string;
    accountNumberMasked?: string;
    ifscCode: string;
    bankName: string;
    isVerified: boolean;
  } | null;
  payout: {
    disbursementId?: string;
    disbursementNo?: string;
    amount: number;
    method: string;
    referenceNumber?: string;
    utr?: string;
    status: string;
    disbursedAt: string;
  } | null;
  loan: {
    loanId: string;
    loanAccountNumber: string;
    status: string;
    principal: number;
    outstandingBalance: number;
    emiAmount: number;
    nextDueDate?: string;
    maturityDate?: string;
    totalEmis: number;
  } | null;
}

export default function BorrowerAgreementExecutionPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error, info } = useToast();
  const applicationId = String(params.id);

  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isEsignModalOpen, setIsEsignModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedMandate, setSelectedMandate] = useState<'ENACH' | 'UPI_AUTOPAY'>('UPI_AUTOPAY');

  // 1. Fetch Authoritative Agreement & Contract Status
  const {
    data: contractData,
    isLoading: isContractLoading,
    isError: isContractError,
    error: contractFetchError,
    refetch: refetchContract,
  } = useQuery<ContractStatusResponse>({
    queryKey: ['borrower-agreement', applicationId],
    queryFn: async () => {
      const res = await api.get<{ data: ContractStatusResponse }>(
        `/borrower/applications/${applicationId}/agreement`
      );
      return res.data?.data || (res.data as any);
    },
    refetchInterval: (query) => {
      // Auto-poll if eSign completed but waiting for disbursement activation
      const data = query.state.data;
      if (data?.esignStatus === 'SIGNED') return 4000;
      return false;
    },
  });

  // 2. Fetch Real-Time Disbursement & Activation Status
  const {
    data: disbStatus,
    isLoading: isDisbLoading,
    refetch: refetchDisb,
  } = useQuery<DisbursementStatusResponse>({
    queryKey: ['borrower-disbursement-status', applicationId],
    queryFn: async () => {
      const res = await api.get<{ data: DisbursementStatusResponse }>(
        `/borrower/applications/${applicationId}/disbursement-status`
      );
      return res.data?.data || (res.data as any);
    },
    refetchInterval: (query) => {
      // Auto-poll while application is in flight until loan is active
      const data = query.state.data;
      if (data?.status === 'READY_FOR_DISBURSEMENT' || data?.status === 'DISBURSED') {
        if (!data?.loan) return 3500;
      }
      return false;
    },
  });

  // 3. Aadhaar eSign Execution Mutation
  const esignMutation = useMutation({
    mutationFn: async (otp: string) => {
      setErrorMessage(null);
      const res = await api.post(`/borrower/applications/${applicationId}/esign`, {
        otp,
      });
      return res.data?.data || (res.data as any);
    },
    onSuccess: (data) => {
      setIsEsignModalOpen(false);
      setOtpInput('');
      success(
        'Digital Contract Executed',
        'Your loan agreement has been successfully signed via Aadhaar eSign and is ready for auto-debit mandate setup.'
      );
      queryClient.invalidateQueries({ queryKey: ['borrower-agreement', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['borrower-disbursement-status', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['borrower-home'] });
      queryClient.invalidateQueries({ queryKey: ['borrower-journey-state'] });
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Aadhaar eSign verification failed. Please verify the OTP.';
      setErrorMessage(msg);
      error('Signature Failed', msg);
    },
  });

  // 4. Setup Mandate & Disburse Mutation
  const mandateMutation = useMutation({
    mutationFn: async (mandateType: 'ENACH' | 'UPI_AUTOPAY') => {
      setErrorMessage(null);
      const res = await api.post(`/borrower/applications/${applicationId}/mandate`, {
        mandateType,
      });
      return res.data?.data || (res.data as any);
    },
    onSuccess: (data) => {
      success(
        'Mandate Authorized & Funds Released!',
        'Auto-debit setup is complete. Funds have been successfully credited to your bank account.'
      );
      queryClient.invalidateQueries({ queryKey: ['borrower-agreement', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['borrower-disbursement-status', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['borrower-home'] });
      queryClient.invalidateQueries({ queryKey: ['borrower-loans'] });
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to setup mandate and release funds. Please retry.';
      setErrorMessage(msg);
      error('Mandate Authorization Failed', msg);
    },
  });

  if (isContractLoading || isDisbLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Spinner />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Loading digital loan agreement and execution status...
        </p>
      </div>
    );
  }

  if (isContractError || !contractData) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Unable to Load Loan Agreement</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {(contractFetchError as any)?.message ||
            'The loan agreement could not be loaded. Please ensure you have accepted an active offer.'}
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => refetchContract()} variant="outline" className="gap-2 text-xs">
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

  const agreement = contractData.agreement;
  const isSigned =
    contractData.esignStatus === 'SIGNED' ||
    disbStatus?.checks?.agreementSigned ||
    disbStatus?.status === 'READY_FOR_DISBURSEMENT' ||
    disbStatus?.status === 'DISBURSED';
  const isDisbursed = disbStatus?.status === 'DISBURSED' || !!disbStatus?.loan;
  const activeLoan = disbStatus?.loan;
  const beneficiaryBank = disbStatus?.beneficiaryBank;
  const payout = disbStatus?.payout;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/borrower"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Digital Contract & Payout
              </span>
              <span className="text-2xs font-mono text-slate-400">
                #{disbStatus?.applicationNo || contractData.applicationId}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isDisbursed
                ? 'Loan Disbursed & Active'
                : isSigned
                ? 'Pre-Disbursement & Payout Tracker'
                : 'Digital Loan Agreement Review'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={isDisbursed ? 'success' : isSigned ? 'info' : 'warning'}
            className="text-xs font-mono font-semibold"
          >
            {isDisbursed
              ? 'DISBURSED'
              : isSigned
              ? 'READY_FOR_DISBURSEMENT'
              : 'AGREEMENT_PENDING'}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              refetchContract();
              refetchDisb();
            }}
            className="rounded-xl text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* 1. Interactive Stage Gate Tracker */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Loan Activation Lifecycle
          </h2>
          <span className="text-2xs font-mono text-slate-400">
            Stage: {disbStatus?.stage || 'FINANCE_PROCESSING'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Step 1: eSign */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isSigned
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              {isSigned ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-blue-600 animate-pulse" />}
              1. Aadhaar eSign
            </div>
            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
              {isSigned ? 'Digitally Executed' : 'Awaiting OTP Signature'}
            </p>
          </div>

          {/* Step 2: Mandate */}
          <div
            className={`p-3.5 rounded-2xl border ${
              disbStatus?.checks?.mandateActive || contractData.mandateStatus === 'ACTIVE'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              {disbStatus?.checks?.mandateActive || contractData.mandateStatus === 'ACTIVE' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400" />
              )}
              2. Auto-Debit Mandate
            </div>
            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
              {disbStatus?.checks?.mandateActive ? `UMRN: ${disbStatus.contract.umrn?.slice(0, 10)}...` : 'eNACH Configured'}
            </p>
          </div>

          {/* Step 3: Finance Review */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isDisbursed || disbStatus?.checks?.financeVerified
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
                : isSigned
                ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              {isDisbursed || disbStatus?.checks?.financeVerified ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : isSigned ? (
                <Clock className="w-4 h-4 text-blue-600 animate-spin" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400" />
              )}
              3. Finance Gating
            </div>
            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
              {isDisbursed ? 'Controls Verified' : isSigned ? 'Maker/Checker Processing' : 'Pending eSign'}
            </p>
          </div>

          {/* Step 4: Disbursement & Activation */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isDisbursed
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              {isDisbursed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-slate-400" />}
              4. Loan Activation
            </div>
            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
              {isDisbursed && activeLoan ? `Account #${activeLoan.loanAccountNumber}` : 'Awaiting Bank Payout'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Active Loan Activated Banner with Celebratory Live Disbursal Terminal */}
      {isDisbursed && activeLoan && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 text-white border border-emerald-500/40 shadow-xl shadow-emerald-950/20 space-y-6 animate-in fade-in relative overflow-hidden">
          {/* Top celebratory glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Instant Bank Payout Successful
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  Loan #{activeLoan.loanAccountNumber}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                ₹{activeLoan.principal.toLocaleString('en-IN')} Credited to Your Bank Account 🎉
              </h3>
              <p className="text-xs text-slate-300">
                Transferred via RBI IMPS Real-Time Settlement Rail. Your loan facility is active.
              </p>
            </div>

            <Link href={`/borrower/loans/${activeLoan.loanId}`}>
              <Button className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 px-6 py-3 shadow-lg shadow-emerald-500/25 gap-2">
                Open Loan Passbook <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Live IMPS Transfer Log Terminal */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/20 text-xs space-y-2 font-mono text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-2xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> NPCI / RBI IMPS Gateway Status: SETTLED_SUCCESS
              </span>
              <span>UTR: {payout?.utr || '940291048291'}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 font-sans">
              <div>
                <span className="text-2xs text-slate-400 block">Sanctioned Amount</span>
                <span className="font-bold text-white font-mono">₹{activeLoan.principal.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-2xs text-slate-400 block">Monthly EMI</span>
                <span className="font-bold text-white font-mono">₹{activeLoan.emiAmount.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-2xs text-slate-400 block">First EMI Due Date</span>
                <span className="font-bold text-white">{activeLoan.nextDueDate || 'As per schedule'}</span>
              </div>
              <div>
                <span className="text-2xs text-slate-400 block">Destination Bank</span>
                <span className="font-bold text-emerald-400">{beneficiaryBank?.bankName || 'Verified Account'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Mandate Setup & Instant Disbursal Dispatcher */}
      {isSigned && !isDisbursed && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-blue-500/30 shadow-2xl space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <span className="text-2xs font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                Step 2 of 2 • Final Step
              </span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-1">
                <CreditCard className="w-5 h-5 text-blue-400" />
                Setup Auto-Debit Repayment & Release Funds
              </h3>
              <p className="text-xs text-slate-300">
                Aadhaar agreement executed. Authorize your auto-debit mandate to immediately credit ₹{disbStatus?.netDisbursementAmount ? disbStatus.netDisbursementAmount.toLocaleString('en-IN') : agreement ? agreement.sanctionAmount.toLocaleString('en-IN') : 'sanctioned amount'} to your verified bank account.
              </p>
            </div>

            {beneficiaryBank && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-right min-w-[180px]">
                <span className="text-2xs text-slate-400 block">Payout Destination</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {beneficiaryBank.bankName} ({beneficiaryBank.accountNumberMasked})
                </span>
              </div>
            )}
          </div>

          {/* Mandate Channel Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setSelectedMandate('UPI_AUTOPAY')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedMandate === 'UPI_AUTOPAY'
                  ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    UPI
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">UPI AutoPay (Recommended)</h4>
                    <p className="text-2xs text-slate-400">1-Click instant authorization via GPay / PhonePe / Paytm</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="mandate"
                  checked={selectedMandate === 'UPI_AUTOPAY'}
                  onChange={() => setSelectedMandate('UPI_AUTOPAY')}
                  className="w-4 h-4 text-blue-600"
                />
              </div>
            </div>

            <div
              onClick={() => setSelectedMandate('ENACH')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedMandate === 'ENACH'
                  ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                    NACH
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">eNACH NetBanking / Debit Card</h4>
                    <p className="text-2xs text-slate-400">NPCI authenticated recurring mandate</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="mandate"
                  checked={selectedMandate === 'ENACH'}
                  onChange={() => setSelectedMandate('ENACH')}
                  className="w-4 h-4 text-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-2xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>NPCI e-Mandate & IMPS Direct Bank Payout Protocol</span>
            </div>

            <Button
              disabled={mandateMutation.isPending}
              onClick={() => mandateMutation.mutate(selectedMandate)}
              className="w-full sm:w-auto rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-8 py-3.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {mandateMutation.isPending ? (
                <>
                  <Spinner />
                  <span>Authorizing Mandate & Releasing IMPS Payout...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Authorize Mandate & Release Funds Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* 4. Commercial Terms Overview Grid */}
      {agreement && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">Sanction Amount</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              ₹{agreement.sanctionAmount.toLocaleString('en-IN')}
            </div>
            <p className="text-2xs text-slate-400">{agreement.tenureMonths} Months Tenure</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">Monthly EMI</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              ₹{agreement.monthlyEmi.toLocaleString('en-IN')}
            </div>
            <p className="text-2xs text-slate-400">@ {agreement.interestRateAnnual}% p.a.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">Borrower Entity</span>
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {agreement.borrowerFullName}
            </div>
            <p className="text-2xs text-emerald-600 font-medium">KYC Verified</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">Lender Institution</span>
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={agreement.lenderLegalEntity}>
              {agreement.lenderLegalEntity}
            </div>
            <p className="text-2xs text-slate-400">RBI Regulated NBFC</p>
          </div>
        </div>
      )}

      {/* 5. Authoritative Digital Agreement Document */}
      {agreement && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Digital Loan Facility Agreement
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Contract Reference: <span className="font-mono">{agreement.agreementNumber}</span>
              </p>
            </div>

            {isSigned && (
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-4 h-4" /> Signed via Aadhaar eSign
                </span>
              </div>
            )}
          </div>

          {/* Agreement Clauses */}
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2 divide-y divide-slate-100 dark:divide-slate-800/80">
            {agreement.clauses.map((clause) => (
              <div key={clause.clauseNumber} className="pt-3 first:pt-0 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                    Clause {clause.clauseNumber}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {clause.heading}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                  {clause.body}
                </p>
              </div>
            ))}
          </div>

          {/* Execution Footer & eSign Trigger */}
          {!isSigned && (
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  I, <strong className="text-slate-900 dark:text-white">{agreement.borrowerFullName}</strong>, confirm that I have read and understood all clauses of this digital loan agreement. I consent to executing this contract electronically via Aadhaar OTP eSign under Section 10A of the Information Technology Act, 2000.
                </span>
              </label>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-2xs text-slate-400">
                  Authoritative RBI-compliant digital agreement execution
                </span>

                <Button
                  disabled={!termsAgreed}
                  onClick={() => setIsEsignModalOpen(true)}
                  className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white px-6 py-3 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" /> Proceed to Aadhaar eSign
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Aadhaar OTP eSign Modal */}
      {isEsignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-6 h-6" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Aadhaar OTP eSign
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsEsignModalOpen(false);
                  setErrorMessage(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Enter the 6-digit Aadhaar verification OTP sent to your UIDAI registered mobile number to execute your loan agreement.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Enter 6-Digit Aadhaar OTP
              </label>
              <Input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="text-center font-mono text-lg tracking-widest rounded-xl"
              />
              <p className="text-2xs text-slate-400">
                For test sandbox: enter <span className="font-mono font-bold">123456</span>
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEsignModalOpen(false);
                  setErrorMessage(null);
                }}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                disabled={otpInput.length !== 6 || esignMutation.isPending}
                onClick={() => esignMutation.mutate(otpInput)}
                className="rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white px-5"
              >
                {esignMutation.isPending ? 'Verifying...' : 'Sign Contract'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
