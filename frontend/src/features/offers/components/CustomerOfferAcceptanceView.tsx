'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useOffers, useAcceptOffer, useDeclineOffer } from '../hooks/useOffers';
import type { LoanOffer } from '../types';
import {
  Sparkles,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Calendar,
  IndianRupee,
  Percent,
  Receipt,
  XCircle,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export const CustomerOfferAcceptanceView: React.FC = () => {
  const { data: offers = [], isLoading } = useOffers();
  const acceptMutation = useAcceptOffer();
  const declineMutation = useDeclineOffer();

  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [kfsAccepted, setKfsAccepted] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);

  // Active Pending Offer
  const pendingOffer = offers.find((o) => o.status === 'PENDING_ACCEPTANCE');
  const acceptedOffer = offers.find((o) => o.status === 'ACCEPTED');
  const activeOffer = pendingOffer || acceptedOffer || offers[0];

  const handleAccept = async () => {
    if (!activeOffer || !kfsAccepted || !termsAccepted) return;

    await acceptMutation.mutateAsync({
      offerId: activeOffer.id,
      data: {
        kfsAccepted: true,
        termsAccepted: true,
        acceptanceMethod: 'CUSTOMER_PORTAL_OTP',
      },
    });

    setIsSuccessModalOpen(true);
  };

  const handleDecline = async () => {
    if (!activeOffer) return;
    const reason = prompt('Please let us know why you are declining this offer (optional):');
    await declineMutation.mutateAsync({
      offerId: activeOffer.id,
      data: { reason: reason || 'Customer declined via borrower portal' },
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-slate-500">
        <Sparkles className="h-8 w-8 animate-pulse text-indigo-500" />
        <p className="mt-3 text-sm font-medium text-slate-400">Loading your loan offer...</p>
      </div>
    );
  }

  if (!activeOffer) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center max-w-2xl mx-auto shadow-2xl">
        <Sparkles className="mx-auto h-12 w-12 text-slate-700 stroke-[1.2]" />
        <h2 className="mt-4 text-xl font-bold text-white">No Active Loan Offers</h2>
        <p className="mt-2 text-sm text-slate-400">
          Once your loan application completes underwriting review and institutional approval, your customized loan offer will appear here.
        </p>
        <Link
          href="/customer/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Borrower Step Journey Stepper */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 font-bold text-[11px]">✓</span>
            <span className="font-semibold">1. Application</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 font-bold text-[11px]">✓</span>
            <span className="font-semibold">2. Credit Sanction</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-400">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[11px]">3</span>
            <span className="font-bold">3. Loan Offer</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 opacity-60">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 font-bold text-[11px]">4</span>
            <span>4. Agreement & eSign</span>
          </div>
        </div>
      </div>

      {/* Hero Offer Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              Pre-Approved Sanction Offer
            </div>
            <h1 className="mt-3 text-3xl font-extrabold text-white tracking-tight">
              You are eligible for ₹{activeOffer.offeredAmount.toLocaleString('en-IN')}
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              {activeOffer.productName} • Offer #{activeOffer.offerNo}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end">
            <span className="text-xs text-slate-400 font-medium">Monthly Installment (EMI)</span>
            <span className="text-3xl font-black text-emerald-400">₹{activeOffer.monthlyEmi.toLocaleString('en-IN')}</span>
            <span className="text-xs text-slate-400">for {activeOffer.tenureMonths} Months</span>
          </div>
        </div>

        {/* Highlight Stats Row */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-6 sm:grid-cols-4 text-xs">
          <div>
            <span className="text-slate-400">Interest Rate</span>
            <p className="mt-1 text-base font-bold text-indigo-300">{activeOffer.annualInterestRatePct.toFixed(2)}% p.a.</p>
            <span className="text-[10px] text-slate-500">Reducing Balance</span>
          </div>
          <div>
            <span className="text-slate-400">Net Cash in Bank</span>
            <p className="mt-1 text-base font-bold text-emerald-400">₹{activeOffer.netDisbursedAmount.toLocaleString('en-IN')}</p>
            <span className="text-[10px] text-slate-500">Instant IMPS Transfer</span>
          </div>
          <div>
            <span className="text-slate-400">Statutory APR</span>
            <p className="mt-1 text-base font-bold text-amber-400">{activeOffer.annualPercentageRateApr.toFixed(2)}%</p>
            <span className="text-[10px] text-slate-500">RBI Regulated True Cost</span>
          </div>
          <div>
            <span className="text-slate-400">Offer Validity</span>
            <p className="mt-1 text-base font-bold text-slate-200">{new Date(activeOffer.validUntil).toLocaleDateString()}</p>
            <span className="text-[10px] text-amber-400 font-medium">Valid for 48 Hours</span>
          </div>
        </div>
      </div>

      {/* Transparent Fee & Deduction Breakdown */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Receipt className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Transparent Fee & Disbursement Breakdown</h2>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1 text-slate-300">
            <span>Approved Loan Facility</span>
            <span className="font-bold text-white">₹{activeOffer.offeredAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between py-1 text-slate-400">
            <span>One-Time Processing Fee (incl. 18% GST)</span>
            <span className="text-rose-400">- ₹{(activeOffer.processingFee + activeOffer.processingFeeGst).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between py-1 text-slate-400">
            <span>Documentation & Electronic Agreement Charges (incl. 18% GST)</span>
            <span className="text-rose-400">- ₹{(activeOffer.documentationCharges + activeOffer.documentationChargesGst).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between border-t border-slate-800 pt-3 text-sm font-bold text-emerald-400">
            <span>Net Disbursed Cash to Your Bank Account</span>
            <span>₹{activeOffer.netDisbursedAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950 p-4 text-xs space-y-2 border border-slate-800/80">
          <div className="flex justify-between text-slate-400">
            <span>Total Interest Payable ({activeOffer.tenureMonths} Months)</span>
            <span className="text-indigo-300 font-semibold">₹{activeOffer.totalInterest.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-bold text-white">
            <span>Total Repayment Over Full Tenure</span>
            <span>₹{activeOffer.totalRepayment.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Key Fact Statement (KFS) & Regulatory Acceptance Box */}
      {activeOffer.status === 'PENDING_ACCEPTANCE' ? (
        <div className="rounded-3xl border border-indigo-500/30 bg-slate-900 p-6 shadow-2xl space-y-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Review & Confirm Loan Acceptance</h2>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Under Reserve Bank of India (RBI) digital lending guidelines, you are provided with full transparency of all charges, interest rates, and loan terms prior to signing.
          </p>

          <div className="space-y-3 rounded-2xl bg-slate-950 p-4 border border-slate-800">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={kfsAccepted}
                onChange={(e) => setKfsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-300">
                I have read and understood the <strong className="text-white">Key Fact Statement (KFS)</strong>, including the statutory APR of {activeOffer.annualPercentageRateApr.toFixed(2)}% and monthly EMI of ₹{activeOffer.monthlyEmi.toLocaleString('en-IN')}.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-300">
                I agree to the loan terms and understand that accepting this offer will generate my Digital Loan Agreement for Aadhaar OTP eSign.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleAccept}
              disabled={!kfsAccepted || !termsAccepted || acceptMutation.isPending}
              className="flex w-full sm:flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/25 hover:bg-indigo-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-5 w-5" />
              {acceptMutation.isPending ? 'Processing Acceptance...' : 'Accept Offer & Continue'}
            </button>
            <button
              onClick={handleDecline}
              disabled={declineMutation.isPending}
              className="w-full sm:w-auto rounded-2xl border border-slate-700 bg-slate-800 px-6 py-3.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              Decline Offer
            </button>
          </div>
        </div>
      ) : activeOffer.status === 'ACCEPTED' ? (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
            <div>
              <h2 className="text-base font-bold text-white">Offer Accepted Successfully</h2>
              <p className="text-xs text-slate-400">Accepted on {new Date(activeOffer.acceptedAt!).toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            Your loan facility of ₹{activeOffer.offeredAmount.toLocaleString('en-IN')} is accepted. Proceed to Aadhaar eSign to complete your loan documentation.
          </p>
          <Link
            href="/customer/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition"
          >
            Go to Digital Agreement <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-slate-900 p-8 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Loan Offer Accepted!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Congratulations! Your sanction of <strong>₹{activeOffer.offeredAmount.toLocaleString('en-IN')}</strong> is locked in. Your digital agreement is now unlocked for Aadhaar OTP eSign.
            </p>
            <div className="pt-4">
              <Link
                href="/customer/dashboard"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition"
              >
                Continue to Agreement eSign <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
