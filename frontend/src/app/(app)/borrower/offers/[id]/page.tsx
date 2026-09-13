'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
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
  ArrowRight,
  Receipt,
  CreditCard,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner, Card, Badge, Input } from '@/components/ui';
import { useToast } from '@/lib/toast';

export default function BorrowerOfferKfsPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error, info } = useToast();
  const offerId = String(params.id);

  const [isEsignModalOpen, setIsEsignModalOpen] = useState(false);
  const [otp, setOtp] = useState('123456');

  // Fetch KFS
  const { data: kfs, isLoading } = useQuery({
    queryKey: ['borrower-kfs', offerId],
    queryFn: async () => {
      const res = await api.get<{ data: any }>(`/api/v1/borrower/offers/${offerId}/kfs`);
      return res.data?.data || res.data;
    },
  });

  // Accept & eSign Flow Mutation
  const acceptAndEsignMutation = useMutation({
    mutationFn: async () => {
      // 1. Accept offer
      await api.post(`/api/v1/borrower/offers/${offerId}/accept`);

      // 2. eSign agreement
      const appId = kfs?.applicationId || offerId.replace('off-', '');
      await api.post(`/api/v1/borrower/applications/${appId}/esign`, { otp });

      // 3. Set up mandate & disburse
      const disburseRes = await api.post(`/api/v1/borrower/applications/${appId}/mandate`, {
        mandateType: 'ENACH',
      });
      return disburseRes.data?.data || disburseRes.data;
    },
    onSuccess: (data) => {
      setIsEsignModalOpen(false);
      success('Loan Disbursed Successfully!', 'Contract eSigned and ₹' + (kfs?.netDisbursementAmount?.toLocaleString('en-IN') || '') + ' transferred via IMPS.');
      router.push('/borrower/loans');
    },
    onError: (err: any) => {
      error('eSign Verification Failed', err.response?.data?.message || err.message || 'Error processing signature');
    },
  });

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Spinner />
        <p className="text-xs text-slate-400 mt-2">Loading Key Fact Statement & Sanction Offer...</p>
      </div>
    );
  }

  if (!kfs) {
    return (
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center max-w-lg mx-auto mt-12">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <h3 className="text-base font-bold text-white mb-1">Offer Not Found</h3>
        <p className="text-xs text-slate-400 mb-4">The requested loan offer or KFS could not be found.</p>
        <Link href="/borrower">
          <Button size="sm" variant="outline" className="text-xs rounded-xl">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/borrower"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Offer Sanctioned
              </span>
              <span className="text-xs text-slate-400 font-mono">Ref: {kfs.kfsId}</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">
              Key Fact Statement (KFS) & Sanction Terms
            </h1>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            info('KFS Downloaded', 'Key Fact Statement saved as statutory PDF.');
          }}
          className="rounded-xl border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" /> Download KFS
        </Button>
      </div>

      {/* Statutory RBI Cooling-off Callout */}
      <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-3 text-xs text-blue-300">
        <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-white">RBI Digital Lending Borrower Protection Active</div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            You are entitled to a mandatory <strong className="text-white">3-day cooling-off period</strong> (until {kfs.coolingOffEndDate}) to exit this loan with zero prepayment penalties by repaying only the principal and proportionate APR.
          </p>
        </div>
      </div>

      {/* Primary Financial Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Sanctioned Loan Amount
          </span>
          <div className="text-2xl font-black text-white">
            ₹{kfs.loanAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400">{kfs.tenureMonths} Months Tenure</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Annual Percentage Rate (APR)
          </span>
          <div className="text-2xl font-black text-emerald-400">
            {kfs.annualPercentageRateApr}%
          </div>
          <div className="text-xs text-slate-400">Nominal Rate: {kfs.nominalInterestRate}% p.a.</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-blue-500/30 bg-blue-950/20 space-y-1">
          <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
            Monthly EMI Due
          </span>
          <div className="text-2xl font-black text-white">
            ₹{kfs.emiAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-blue-300 font-medium">1st of every calendar month</div>
        </div>
      </div>

      {/* Detailed Charges & Cashflow Breakdown Table */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Receipt className="w-4 h-4 text-blue-400" />
          Statutory Cost of Credit Breakdown (No Hidden Fees)
        </h3>

        <div className="divide-y divide-slate-800/80 text-xs">
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400">Gross Sanction Amount:</span>
            <span className="font-semibold text-white">₹{kfs.loanAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400">Processing Fee:</span>
            <span className="text-slate-200">₹{kfs.processingFee.toLocaleString('en-IN')}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400">Goods & Services Tax (18% GST):</span>
            <span className="text-slate-200">₹{kfs.gstAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400">Digital Documentation & eSign Stamp Charges:</span>
            <span className="text-slate-200">₹{kfs.documentationCharges}</span>
          </div>
          <div className="py-2.5 flex justify-between font-bold bg-slate-950/40 px-3 rounded-xl">
            <span className="text-blue-400">Net Disbursement Credited to Bank Account:</span>
            <span className="text-emerald-400 text-sm">₹{kfs.netDisbursementAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-400">Total Interest Payable over {kfs.tenureMonths} months:</span>
            <span className="text-slate-200">₹{kfs.totalInterestPayable.toLocaleString('en-IN')}</span>
          </div>
          <div className="py-2.5 flex justify-between font-bold">
            <span className="text-white">Total Repayment Amount ({kfs.tenureMonths} × ₹{kfs.emiAmount}):</span>
            <span className="text-white text-sm">₹{kfs.totalRepaymentAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Repayment Schedule Preview */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-400" />
          Amortization Repayment Schedule Preview
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">EMI #</th>
                <th className="pb-2">Due Date</th>
                <th className="pb-2">Principal</th>
                <th className="pb-2">Interest</th>
                <th className="pb-2">Total EMI</th>
                <th className="pb-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {kfs.repaymentScheduleSummary?.map((row: any) => (
                <tr key={row.installmentNumber} className="hover:bg-slate-800/30">
                  <td className="py-2 font-medium text-white">{row.installmentNumber}</td>
                  <td className="py-2 text-slate-400">{row.dueDate}</td>
                  <td className="py-2 text-slate-200">₹{row.principal?.toLocaleString('en-IN')}</td>
                  <td className="py-2 text-slate-400">₹{row.interest?.toLocaleString('en-IN')}</td>
                  <td className="py-2 font-bold text-white">₹{row.emi?.toLocaleString('en-IN')}</td>
                  <td className="py-2 text-right font-mono text-slate-400">
                    ₹{row.outstandingBalance?.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grievance Redressal Officer (GRO) Information */}
      <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
        <div className="font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          RBI Nodal Grievance Redressal Officer (GRO) Details
        </div>
        <p className="text-slate-400 leading-relaxed">
          {kfs.grievanceRedressalOfficer?.name} ({kfs.grievanceRedressalOfficer?.designation}) • Email:{' '}
          <a href={`mailto:${kfs.grievanceRedressalOfficer?.email}`} className="text-blue-400 underline">
            {kfs.grievanceRedressalOfficer?.email}
          </a>{' '}
          • Helpline: {kfs.grievanceRedressalOfficer?.phone}
        </p>
      </div>

      {/* Action Footer */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/borrower" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto rounded-xl border-slate-800 text-xs text-slate-400">
            Decline Offer
          </Button>
        </Link>

        <Button
          onClick={() => setIsEsignModalOpen(true)}
          className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-8 shadow-xl shadow-emerald-500/20"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Accept Terms & eSign Agreement
        </Button>
      </div>

      {/* Simulated Aadhaar OTP Modal */}
      {isEsignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Aadhaar OTP eSign Verification</h3>
                  <p className="text-[11px] text-slate-400">UIDAI Digital Signature Rails</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Enter the 6-digit OTP sent to your Aadhaar-linked mobile number to legally sign the loan agreement.
              </p>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">One-Time Password (OTP)</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full text-center tracking-widest text-lg font-mono font-bold py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-blue-500 outline-none"
                  maxLength={6}
                />
                <p className="text-[10px] text-slate-500 text-center mt-1">
                  Simulation code: <strong className="text-blue-400 font-mono">123456</strong>
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEsignModalOpen(false)}
                className="rounded-xl border-slate-800 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => acceptAndEsignMutation.mutate()}
                disabled={acceptAndEsignMutation.isPending || otp.length !== 6}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                {acceptAndEsignMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Disbursing Loan...
                  </span>
                ) : (
                  'Confirm & Disburse'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
