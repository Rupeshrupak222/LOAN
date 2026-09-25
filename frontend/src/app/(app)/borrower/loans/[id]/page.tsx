'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  CreditCard,
  ArrowLeft,
  Download,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Receipt,
  ShieldCheck,
  Building2,
  Sparkles,
  Smartphone,
  Wallet,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Info,
  Printer,
  Lock,
  Award,
  Calendar,
  Layers,
  FileCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner, Card, Badge, Input } from '@/components/ui';
import { useToast } from '@/lib/toast';

interface ScheduleRow {
  emiNumber: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  outstanding?: number;
  status: 'PAID' | 'DUE' | 'UPCOMING' | 'OVERDUE' | 'PARTIALLY_PAID' | string;
  paidAt?: string | null;
}

interface PaymentRecord {
  id: string;
  paymentNo?: string;
  amount: number;
  status: string;
  paymentType?: string;
  paymentMethod: string;
  paidAt: string;
  referenceNumber: string;
}

interface LoanAccountDetail {
  id: string;
  loanAccountNumber: string;
  productName: string;
  productCode?: string;
  sanctionedPrincipal: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  outstandingFees?: number;
  totalOutstanding: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  status: 'ACTIVE' | 'OVERDUE' | 'CLOSED' | 'SETTLED' | string;
  paidEmis: number;
  totalEmis: number;
  progressPercent: number;
  disbursementDate?: string | null;
  closedAt?: string | null;
  nextEmiDueDate?: string | null;
  nextEmiAmount: number;
  isOverdue?: boolean;
  overdueAmount?: number;
  dpd?: number;
  isNocAvailable?: boolean;
  nocNumber?: string | null;
  closure?: {
    id: string;
    nocNumber: string;
    closureType: string;
    principalPaid: number;
    interestPaid: number;
    feesPaid: number;
    closedAt: string;
    closedBy: string;
    remarks?: string | null;
  } | null;
  repaymentSchedule: ScheduleRow[];
  paymentHistory: PaymentRecord[];
}

interface StatementTransaction {
  id: string;
  transactionDate: string;
  referenceNumber: string;
  transactionType: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  runningPrincipalBalance: number;
  paymentMethod?: string;
  status: string;
  allocations?: Array<{ component: string; amount: number }>;
}

interface LoanStatementData {
  statementId: string;
  generatedAt: string;
  asOfDate: string;
  lenderInfo: {
    name: string;
    entityType: string;
    cinNumber?: string;
    rbiRegistrationNo?: string;
    contactEmail: string;
    supportPhone?: string;
  };
  borrowerInfo: {
    customerCode: string;
    borrowerName: string;
    mobile: string;
    email: string | null;
    panMasked: string | null;
  };
  loanSummary: {
    loanId: string;
    loanAccountNumber: string;
    productName: string;
    productCode?: string;
    sanctionedPrincipal: number;
    interestRate: number;
    tenureMonths: number;
    emiAmount: number;
    disbursementDate: string | null;
    maturityDate: string | null;
    closedAt: string | null;
    status: string;
    totalRepaymentExpected: number;
    totalPaid: number;
    totalPrincipalPaid: number;
    totalInterestPaid: number;
    totalFeesPaid: number;
    outstandingPrincipal: number;
    outstandingInterest: number;
    outstandingFees: number;
    totalOutstanding: number;
    isNocAvailable: boolean;
    nocNumber: string | null;
  };
  transactions: StatementTransaction[];
  repaymentSchedule: ScheduleRow[];
}

interface NocCertificateData {
  certificateNumber: string;
  issueDate: string;
  borrowerName: string;
  customerCode: string;
  panMasked: string;
  loanAccountNumber: string;
  sanctionedAmount: number;
  closureDate: string;
  closureType: string;
  status: string;
  digitalSignatureHash: string;
  issuerLenderName: string;
  complianceStatement: string;
}

export default function BorrowerLoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const loanId = String(params.id);

  const [activeTab, setActiveTab] = useState<'servicing' | 'statement' | 'noc'>('servicing');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NET_BANKING' | 'DEBIT_CARD'>('UPI');
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch Authoritative Loan Servicing Details
  const {
    data: loan,
    isLoading,
    isError,
    error: fetchError,
    refetch,
    isFetching,
  } = useQuery<LoanAccountDetail>({
    queryKey: ['borrower-loan-detail', loanId],
    queryFn: async () => {
      const res = await api.get<{ data: LoanAccountDetail }>(`/borrower/loans/${loanId}`);
      const data = res.data?.data || (res.data as any);
      if (data && (!repayAmount || repayAmount === 0)) {
        setRepayAmount(data.nextEmiAmount > 0 ? data.nextEmiAmount : data.emiAmount);
      }
      return data;
    },
  });

  // 2. Fetch Authoritative Statement of Account (SOA)
  const {
    data: statement,
    isLoading: isStatementLoading,
    refetch: refetchStatement,
  } = useQuery<LoanStatementData>({
    queryKey: ['borrower-loan-statement', loanId],
    queryFn: async () => {
      const res = await api.get<{ data: LoanStatementData }>(`/borrower/loans/${loanId}/statement`);
      return res.data?.data || (res.data as any);
    },
    enabled: activeTab === 'statement',
  });

  // 3. Fetch Authoritative No-Objection Certificate (NOC)
  const isEligibleForNoc =
    loan?.status === 'CLOSED' ||
    loan?.status === 'SETTLED' ||
    loan?.isNocAvailable === true ||
    (loan && loan.outstandingPrincipal === 0 && loan.outstandingInterest === 0);

  const {
    data: noc,
    isLoading: isNocLoading,
    error: nocError,
    refetch: refetchNoc,
  } = useQuery<NocCertificateData>({
    queryKey: ['borrower-loan-noc', loanId],
    queryFn: async () => {
      const res = await api.get<{ data: NocCertificateData }>(`/borrower/loans/${loanId}/noc`);
      return res.data?.data || (res.data as any);
    },
    enabled: activeTab === 'noc' && !!isEligibleForNoc,
  });

  // 4. Repayment Mutation
  const payMutation = useMutation({
    mutationFn: async (payload: { loanId: string; amount: number; paymentMethod: string }) => {
      setErrorMessage(null);
      const res = await api.post(`/borrower/loans/${payload.loanId}/pay`, payload);
      return res.data?.data || (res.data as any);
    },
    onSuccess: (data) => {
      setPaymentSuccessData(data);
      success('Repayment Processed', data.message || `Payment of ₹${repayAmount.toLocaleString('en-IN')} posted successfully.`);
      queryClient.invalidateQueries({ queryKey: ['borrower-loan-detail', loanId] });
      queryClient.invalidateQueries({ queryKey: ['borrower-loan-statement', loanId] });
      queryClient.invalidateQueries({ queryKey: ['borrower-loan-noc', loanId] });
      queryClient.invalidateQueries({ queryKey: ['borrower-loans'] });
      queryClient.invalidateQueries({ queryKey: ['borrower-home'] });
      queryClient.invalidateQueries({ queryKey: ['borrower-journey-state'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Error processing repayment.';
      setErrorMessage(msg);
      error('Payment Failed', msg);
    },
  });

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Spinner />
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading loan account details & records...</p>
      </div>
    );
  }

  if (isError || !loan) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl text-center max-w-lg mx-auto mt-12 shadow-xs space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Loan Account Not Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {(fetchError as any)?.message || 'The requested loan details could not be loaded.'}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button onClick={() => refetch()} variant="outline" size="sm" className="text-xs rounded-xl">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
          </Button>
          <Link href="/borrower/loans">
            <Button size="sm" variant="outline" className="text-xs rounded-xl">Back to Loans Hub</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = loan.status === 'CLOSED' || loan.status === 'SETTLED' || loan.isNocAvailable;
  const isOverdue = loan.isOverdue || loan.status === 'OVERDUE' || (loan.dpd ?? 0) > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/borrower/loans"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                {loan.loanAccountNumber}
              </span>
              <Badge
                variant={isClosed ? 'default' : isOverdue ? 'danger' : 'success'}
                className="text-2xs font-mono font-bold"
              >
                {loan.status}
              </Badge>
              {isClosed && (
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Zero Outstanding
                </span>
              )}
              {isOverdue && !isClosed && (loan.dpd ?? 0) > 0 && (
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                  {loan.dpd} DPD
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
              {loan.productName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              if (activeTab === 'statement') refetchStatement();
              if (activeTab === 'noc') refetchNoc();
            }}
            disabled={isFetching}
            className="rounded-xl text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          {!isClosed && (
            <Button
              size="sm"
              onClick={() => {
                setPaymentSuccessData(null);
                setErrorMessage(null);
                setRepayAmount(loan.nextEmiAmount > 0 ? loan.nextEmiAmount : loan.emiAmount);
                setIsPayModalOpen(true);
              }}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-500/20 gap-1.5 px-4"
            >
              <CreditCard className="w-3.5 h-3.5" /> Pay EMI ₹{(loan.nextEmiAmount > 0 ? loan.nextEmiAmount : loan.emiAmount).toLocaleString('en-IN')}
            </Button>
          )}
          {isClosed && (
            <Button
              size="sm"
              onClick={() => setActiveTab('noc')}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-500/20 gap-1.5"
            >
              <Award className="w-3.5 h-3.5" /> View NOC Certificate
            </Button>
          )}
        </div>
      </div>

      {/* Closed Loan Zero-Outstanding Confirmation Card */}
      {isClosed && (
        <div className="p-5 rounded-3xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                  Loan Account Fully Settled & Closed
                </h3>
                <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                  {loan.closedAt ? `Closed on ${loan.closedAt}` : 'Fully Settled'}
                </span>
              </div>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300 mt-1">
                Your loan has ₹0.00 outstanding balance. All financial liabilities have been fully remitted. Your statutory No-Objection Certificate (NOC) and final Statement of Account are available below.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={() => setActiveTab('noc')}
              className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white px-4 shadow-sm"
            >
              <Award className="w-3.5 h-3.5 mr-1.5" /> Download NOC
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab('statement')}
              className="w-full sm:w-auto rounded-xl text-xs font-medium"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" /> View SOA
            </Button>
          </div>
        </div>
      )}

      {/* Overdue Delinquency Alert Banner */}
      {isOverdue && !isClosed && (
        <div className="p-5 rounded-3xl bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                Immediate Action Required: Payment Overdue
              </h3>
              <p className="text-xs text-rose-800/80 dark:text-rose-300 mt-0.5">
                Your loan has an overdue balance of <strong className="font-bold">₹{(loan.overdueAmount || loan.nextEmiAmount).toLocaleString('en-IN')}</strong> ({loan.dpd || 0} days past due). Please settle immediately to prevent credit bureau reporting and late charges.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setPaymentSuccessData(null);
              setErrorMessage(null);
              setRepayAmount(loan.overdueAmount || loan.nextEmiAmount);
              setIsPayModalOpen(true);
            }}
            className="w-full sm:w-auto rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white px-5 shadow-md shadow-rose-500/20 shrink-0"
          >
            Settle Overdue Amount
          </Button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('servicing')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'servicing'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Servicing & Waterfall
        </button>

        <button
          onClick={() => setActiveTab('statement')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'statement'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Statement of Account (SOA)
        </button>

        <button
          onClick={() => setActiveTab('noc')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'noc'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isClosed ? <Award className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
          NOC Certificate
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SERVICING & WATERFALL */}
      {/* ========================================================================= */}
      {activeTab === 'servicing' && (
        <div className="space-y-6">
          {/* Summary KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Sanctioned Principal</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                ₹{loan.sanctionedPrincipal?.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500">{loan.tenureMonths} Mo @ {loan.interestRate}% p.a.</div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Total Outstanding</span>
              <div className={`text-xl font-bold ${isClosed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                ₹{loan.totalOutstanding?.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500">
                {isClosed ? 'Zero Balance Confirmed' : `Principal: ₹${loan.outstandingPrincipal?.toLocaleString('en-IN')} • Int: ₹${loan.outstandingInterest?.toLocaleString('en-IN')}`}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Monthly Installment</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                ₹{loan.emiAmount?.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500">
                {loan.paidEmis} of {loan.totalEmis} EMIs Settled ({loan.progressPercent}%)
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Next Due Date</span>
              <div className={`text-xl font-bold ${isOverdue && !isClosed ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                {loan.nextEmiDueDate || (isClosed ? 'Fully Settled' : 'As per schedule')}
              </div>
              <div className="text-[11px] text-slate-500">
                {isClosed ? 'No upcoming dues' : `Due: ₹${(loan.nextEmiAmount || 0).toLocaleString('en-IN')}`}
              </div>
            </div>
          </div>

          {/* Repayment Schedule Waterfall Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Repayment Amortization Schedule Waterfall
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Authoritative breakdown of monthly principal, interest, and payment status
                </p>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold">
                {loan.paidEmis} / {loan.totalEmis} EMIs Paid
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="pb-2.5">EMI #</th>
                    <th className="pb-2.5">Due Date</th>
                    <th className="pb-2.5">Principal</th>
                    <th className="pb-2.5">Interest</th>
                    <th className="pb-2.5">Total Installment</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right">Settlement Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {loan.repaymentSchedule?.map((row) => {
                    const isPaid = row.status === 'PAID';
                    const isOverdueRow = row.status === 'OVERDUE';
                    return (
                      <tr key={row.emiNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 font-medium text-slate-900 dark:text-white font-mono">
                          #{row.emiNumber}
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-400">{row.dueDate}</td>
                        <td className="py-3 text-slate-700 dark:text-slate-300">₹{row.principalDue?.toLocaleString('en-IN')}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400">₹{row.interestDue?.toLocaleString('en-IN')}</td>
                        <td className="py-3 font-bold text-slate-900 dark:text-white">₹{row.totalDue?.toLocaleString('en-IN')}</td>
                        <td className="py-3">
                          <span
                            className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                : isOverdueRow
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono text-slate-500 dark:text-slate-400">
                          {row.paidAt || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Repayment History & Settlement Receipts
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Verified double-entry transaction records posted to the general ledger
                </p>
              </div>
            </div>

            {loan.paymentHistory && loan.paymentHistory.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {loan.paymentHistory.map((p) => (
                  <div key={p.id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Repayment via {p.paymentMethod}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-2xs font-mono">
                          Ref: {p.referenceNumber} • {new Date(p.paidAt).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{p.amount?.toLocaleString('en-IN')}
                      </div>
                      <span className="text-2xs text-emerald-600 dark:text-emerald-400 uppercase font-semibold">
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="font-medium">No repayments recorded yet.</p>
                <p className="text-2xs text-slate-400">Payments will appear here immediately upon settlement.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STATEMENT OF ACCOUNT (SOA) */}
      {/* ========================================================================= */}
      {activeTab === 'statement' && (
        <div className="space-y-6">
          {isStatementLoading ? (
            <div className="py-16 text-center space-y-2">
              <Spinner />
              <p className="text-xs text-slate-500">Generating authoritative Statement of Account...</p>
            </div>
          ) : statement ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-sm">
              {/* SOA Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
                <div>
                  <span className="text-2xs font-mono uppercase tracking-widest text-slate-400 font-bold">
                    Official Statutory Document
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    Statement of Account (SOA)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Statement Ref: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{statement.statementId}</span> • Generated on {new Date(statement.generatedAt).toLocaleDateString('en-IN')}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </Button>
              </div>

              {/* Lender & Borrower Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-2xs tracking-wider">
                    Lender Details
                  </span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {statement.lenderInfo.name}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {statement.lenderInfo.entityType}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-mono text-2xs">
                    CIN: {statement.lenderInfo.cinNumber || '—'} • RBI Reg: {statement.lenderInfo.rbiRegistrationNo || '—'}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 pt-1">
                    Contact: {statement.lenderInfo.contactEmail} • {statement.lenderInfo.supportPhone}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-2xs tracking-wider">
                    Borrower Dossier
                  </span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {statement.borrowerInfo.borrowerName}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-mono text-2xs">
                    Customer ID: {statement.borrowerInfo.customerCode} • PAN: {statement.borrowerInfo.panMasked || '—'}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    Mobile: {statement.borrowerInfo.mobile} {statement.borrowerInfo.email ? `• ${statement.borrowerInfo.email}` : ''}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 pt-1">
                    Facility: {statement.loanSummary.productName} ({statement.loanSummary.tenureMonths} Months @ {statement.loanSummary.interestRate}% p.a.)
                  </div>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Sanctioned</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    ₹{statement.loanSummary.sanctionedPrincipal?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Principal Repaid</span>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{statement.loanSummary.totalPrincipalPaid?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Interest Repaid</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    ₹{statement.loanSummary.totalInterestPaid?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Outstanding Balance</span>
                  <div className={`text-sm font-bold ${statement.loanSummary.isNocAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                    ₹{statement.loanSummary.totalOutstanding?.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Chronological Transaction Ledger */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Chronological Transaction Ledger
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                        <th className="pb-2.5">Date</th>
                        <th className="pb-2.5">Reference #</th>
                        <th className="pb-2.5">Description</th>
                        <th className="pb-2.5 text-right">Debit (₹)</th>
                        <th className="pb-2.5 text-right">Credit (₹)</th>
                        <th className="pb-2.5 text-right">Running Principal (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                      {statement.transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 font-mono text-slate-600 dark:text-slate-400">{t.transactionDate}</td>
                          <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">{t.referenceNumber}</td>
                          <td className="py-3">
                            <div className="font-semibold text-slate-900 dark:text-white">{t.description}</div>
                            {t.paymentMethod && (
                              <div className="text-2xs text-slate-400 font-mono">Mode: {t.paymentMethod}</div>
                            )}
                          </td>
                          <td className="py-3 text-right font-mono font-medium text-slate-900 dark:text-white">
                            {t.debitAmount > 0 ? `₹${t.debitAmount.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {t.creditAmount > 0 ? `₹${t.creditAmount.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ₹{t.runningPrincipalBalance.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No statement data available for this facility.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: NO-OBJECTION CERTIFICATE (NOC) */}
      {/* ========================================================================= */}
      {activeTab === 'noc' && (
        <div className="space-y-6">
          {!isEligibleForNoc ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center max-w-md mx-auto space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  NOC Certificate Locked
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  A statutory No-Objection Certificate (NOC) is only generated once the loan facility is 100% repaid with zero outstanding balance.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Outstanding:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{loan.totalOutstanding.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Required Condition:</span>
                  <span className="font-bold text-emerald-600">₹0.00 Balance</span>
                </div>
              </div>
              <Button
                onClick={() => {
                  setPaymentSuccessData(null);
                  setErrorMessage(null);
                  setRepayAmount(loan.totalOutstanding);
                  setIsPayModalOpen(true);
                }}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm"
              >
                Pay Outstanding Balance (₹{loan.totalOutstanding.toLocaleString('en-IN')})
              </Button>
            </div>
          ) : isNocLoading ? (
            <div className="py-16 text-center space-y-2">
              <Spinner />
              <p className="text-xs text-slate-500">Retrieving authentic signed NOC certificate...</p>
            </div>
          ) : noc ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-xl space-y-8 max-w-3xl mx-auto">
              {/* NOC Certificate Header */}
              <div className="text-center space-y-2 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800 shadow-xs">
                  <Award className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  Statutory No-Objection Certificate (NOC)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Issued by <strong className="text-slate-800 dark:text-slate-200">{noc.issuerLenderName}</strong>
                </p>
                <div className="pt-1">
                  <span className="text-2xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                    Cert No: {noc.certificateNumber}
                  </span>
                </div>
              </div>

              {/* Certificate Body */}
              <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  This is to certify that borrower <strong className="font-bold text-slate-900 dark:text-white">{noc.borrowerName}</strong> (Customer ID: <span className="font-mono font-semibold">{noc.customerCode}</span>, PAN: <span className="font-mono font-semibold">{noc.panMasked}</span>) has fully liquidated all outstanding obligations towards loan account <strong className="font-mono font-bold text-slate-900 dark:text-white">{noc.loanAccountNumber}</strong>.
                </p>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 text-2xs uppercase">Sanctioned Amount</span>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      ₹{noc.sanctionedAmount?.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-2xs uppercase">Closure Date</span>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {noc.closureDate}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-2xs uppercase">Account Status</span>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {noc.status}
                    </div>
                  </div>
                </div>

                <p className="italic text-slate-600 dark:text-slate-400 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                  &ldquo;{noc.complianceStatement}&rdquo;
                </p>
              </div>

              {/* Digital Signature & Verification Hash */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-2xs text-slate-500">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Digitally Signed & Authenticated
                  </div>
                  <div className="font-mono text-2xs text-slate-400 break-all max-w-sm">
                    SHA256: {noc.digitalSignatureHash}
                  </div>
                </div>

                <Button
                  onClick={() => window.print()}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 shadow-sm gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download / Print NOC
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-rose-500">
              Failed to load NOC certificate. Please retry.
            </div>
          )}
        </div>
      )}

      {/* In-Page Repayment Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
            {paymentSuccessData ? (
              <div className="text-center space-y-4 py-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-2xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 uppercase">
                    Payment Settled
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    ₹{repayAmount.toLocaleString('en-IN')} Paid Successfully
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {paymentSuccessData.message}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction Ref:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {paymentSuccessData.referenceNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Principal Allocation:</span>
                    <span className="font-bold text-emerald-600">
                      ₹{(paymentSuccessData.allocationSummary?.allocatedPrincipal || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Interest Allocation:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{(paymentSuccessData.allocationSummary?.allocatedInterest || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Remaining Balance:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{(paymentSuccessData.newOutstandingPrincipal || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {paymentSuccessData.isFullyPaid && (
                    <Button
                      onClick={() => {
                        setIsPayModalOpen(false);
                        setActiveTab('noc');
                      }}
                      className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white py-2.5"
                    >
                      View NOC Certificate
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsPayModalOpen(false)}
                    variant="outline"
                    className="flex-1 rounded-xl text-xs font-bold py-2.5"
                  >
                    Done & Close
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Make Loan Repayment
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsPayModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Amount Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <label className="font-semibold">Enter Amount (₹)</label>
                      <span>
                        Total Due: <strong className="text-slate-900 dark:text-white">₹{loan.totalOutstanding.toLocaleString('en-IN')}</strong>
                      </span>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      max={loan.totalOutstanding}
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(Number(e.target.value))}
                      className="text-lg font-bold font-mono rounded-xl"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setRepayAmount(loan.nextEmiAmount > 0 ? loan.nextEmiAmount : loan.emiAmount)}
                        className="text-2xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                      >
                        EMI (₹{(loan.nextEmiAmount > 0 ? loan.nextEmiAmount : loan.emiAmount).toLocaleString('en-IN')})
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepayAmount(loan.totalOutstanding)}
                        className="text-2xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                      >
                        Full Balance (₹{loan.totalOutstanding.toLocaleString('en-IN')})
                      </button>
                    </div>
                  </div>

                  {/* Payment Modes */}
                  <div className="space-y-2">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Select Payment Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'UPI', label: 'UPI Rail', icon: Smartphone },
                        { id: 'NET_BANKING', label: 'Net Banking', icon: Building2 },
                        { id: 'DEBIT_CARD', label: 'Debit Card', icon: CreditCard },
                      ].map((m) => {
                        const Icon = m.icon;
                        const isSel = paymentMethod === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setPaymentMethod(m.id as any)}
                            className={`p-3 rounded-2xl border text-center cursor-pointer transition-all ${
                              isSel
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <Icon className="w-4 h-4 mx-auto mb-1" />
                            <div className="text-2xs">{m.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPayModalOpen(false)}
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={repayAmount <= 0 || payMutation.isPending}
                    onClick={() =>
                      payMutation.mutate({
                        loanId: loan.id,
                        amount: repayAmount,
                        paymentMethod,
                      })
                    }
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5"
                  >
                    {payMutation.isPending ? 'Processing Payment...' : `Authorize ₹${repayAmount.toLocaleString('en-IN')}`}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
