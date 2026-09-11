'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOfferDetail, useCancelOffer, useGenerateOffer } from '../hooks/useOffers';
import type { LoanOffer } from '../types';
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileCheck2,
  Calendar,
  IndianRupee,
  Percent,
  AlertTriangle,
  RefreshCw,
  XCircle,
  FileSpreadsheet,
  Download,
  Receipt,
  UserCheck,
} from 'lucide-react';

interface OfferDetailViewProps {
  offerId: string;
}

export const OfferDetailView: React.FC<OfferDetailViewProps> = ({ offerId }) => {
  const router = useRouter();
  const { data: offer, isLoading, error } = useOfferDetail(offerId);
  const cancelMutation = useCancelOffer();
  const regenerateMutation = useGenerateOffer();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [customTenure, setCustomTenure] = useState<string>('');
  const [customRate, setCustomRate] = useState<string>('');
  const [showAllSchedule, setShowAllSchedule] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="mt-3 text-sm font-medium text-slate-400">Loading loan offer details...</p>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-rose-400" />
        <h3 className="mt-3 text-base font-semibold text-white">Offer Not Found</h3>
        <p className="mt-1 text-xs text-slate-400">The requested loan offer could not be retrieved.</p>
        <Link
          href="/offers"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Offers
        </Link>
      </div>
    );
  }

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason) return;
    await cancelMutation.mutateAsync({ offerId: offer.id, reason: cancelReason });
    setIsCancelModalOpen(false);
  };

  const handleRegenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const regenerated = await regenerateMutation.mutateAsync({
      applicationId: offer.applicationId,
      data: {
        customOfferedAmount: customAmount ? Number(customAmount) : undefined,
        customTenureMonths: customTenure ? Number(customTenure) : undefined,
        overrideRatePct: customRate ? Number(customRate) : undefined,
      },
    });
    setIsRegenerateModalOpen(false);
    if (regenerated?.id) {
      router.push(`/offers/${regenerated.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation & Breadcrumb */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Link
            href="/offers"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{offer.offerNo}</h1>
              <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20">
                Version {offer.version}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Application {offer.applicationNo} • {offer.customerName} ({offer.productName})
            </p>
          </div>
        </div>

        {/* Action Desk Buttons */}
        <div className="flex items-center gap-3">
          {offer.status === 'PENDING_ACCEPTANCE' && (
            <>
              <button
                onClick={() => {
                  setCustomAmount(offer.offeredAmount.toString());
                  setCustomTenure(offer.tenureMonths.toString());
                  setCustomRate(offer.annualInterestRatePct.toString());
                  setIsRegenerateModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-600/10 px-4 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-600/20 transition"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate / Counter-Offer
              </button>
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
              >
                <XCircle className="h-4 w-4" />
                Cancel Offer
              </button>
            </>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <Download className="h-4 w-4" />
            Export KFS
          </button>
        </div>
      </div>

      {/* Step-by-Step UI Stepper */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
              ✓
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Stage 1: Credit & BRE</p>
              <p className="text-[11px] text-emerald-400 font-medium">Approved (Grade {offer.riskGrade})</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
              ✓
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Stage 2: Authority Sanction</p>
              <p className="text-[11px] text-emerald-400 font-medium">Sanctioned ₹{offer.approvedAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs animate-pulse">
              ●
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Stage 3: Offer Presented</p>
              <p className="text-[11px] text-indigo-400 font-medium">
                {offer.status === 'ACCEPTED' ? 'Accepted by Borrower' : 'Pending Borrower Sign-off'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 opacity-60">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 font-bold text-xs">
              4
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">Stage 4: Agreement & Payout</p>
              <p className="text-[11px] text-slate-500">
                {offer.status === 'ACCEPTED' ? 'Unlocked for eSign' : 'Locked until acceptance'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Highlight Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Sanctioned Principal</p>
          <p className="mt-2 text-2xl font-bold text-white">₹{offer.offeredAmount.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-xs text-slate-500">Tenure: {offer.tenureMonths} Months</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Monthly EMI</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">₹{offer.monthlyEmi.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-xs text-slate-500">Annuity Reducing</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Interest Rate</p>
          <p className="mt-2 text-2xl font-bold text-indigo-400">{offer.annualInterestRatePct.toFixed(2)}%</p>
          <p className="mt-1 text-xs text-slate-500">Base {offer.baseInterestRatePct}% + Risk {offer.riskSpreadPct >= 0 ? `+${offer.riskSpreadPct}%` : `${offer.riskSpreadPct}%`}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Statutory APR</p>
          <p className="mt-2 text-2xl font-bold text-amber-400">{offer.annualPercentageRateApr.toFixed(2)}%</p>
          <p className="mt-1 text-xs text-slate-500">RBI Regulated True Cost</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Net Disbursement</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">₹{offer.netDisbursedAmount.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-xs text-slate-500">Deductions: ₹{offer.totalFeesAndTaxes.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Main Grid: Transparent Fees vs Conditions & Acceptance Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Transparent Fee & Statutory Tax Breakdown */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Transparent Upfront Deduction Breakdown</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">18% GST Compliant</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 text-slate-300">
                <span>Sanctioned Principal Amount</span>
                <span className="font-bold text-white">₹{offer.offeredAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-400">
                <span>Processing Fee (Base: ₹{offer.processingFee.toLocaleString('en-IN')} + 18% GST: ₹{offer.processingFeeGst})</span>
                <span className="text-rose-400">- ₹{(offer.processingFee + offer.processingFeeGst).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-400">
                <span>Documentation Charges (Base: ₹{offer.documentationCharges.toLocaleString('en-IN')} + 18% GST: ₹{offer.documentationChargesGst})</span>
                <span className="text-rose-400">- ₹{(offer.documentationCharges + offer.documentationChargesGst).toLocaleString('en-IN')}</span>
              </div>
              {offer.platformFee > 0 && (
                <div className="flex justify-between py-1 text-slate-400">
                  <span>Platform Fee (Base: ₹{offer.platformFee.toLocaleString('en-IN')} + 18% GST: ₹{offer.platformFeeGst})</span>
                  <span className="text-rose-400">- ₹{(offer.platformFee + offer.platformFeeGst).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-800 pt-3 text-sm font-bold text-emerald-400">
                <span>Net Disbursed Cash to Borrower</span>
                <span>₹{offer.netDisbursedAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Total Interest Payable over {offer.tenureMonths} Months</span>
                <span className="text-indigo-300">₹{offer.totalInterest.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-semibold text-white">
                <span>Total Repayment by Borrower</span>
                <span>₹{offer.totalRepayment.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Amortization Schedule Preview */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Amortization Schedule Preview</h3>
              </div>
              <button
                onClick={() => setShowAllSchedule(!showAllSchedule)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                {showAllSchedule ? 'Show First 6 Months' : `View All ${offer.tenureMonths} Months`}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400">
                  <tr>
                    <th className="px-3 py-2">EMI #</th>
                    <th className="px-3 py-2">Principal</th>
                    <th className="px-3 py-2">Interest</th>
                    <th className="px-3 py-2">Total EMI</th>
                    <th className="px-3 py-2">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {(showAllSchedule ? offer.schedulePreview : offer.schedulePreview.slice(0, 6)).map((row) => (
                    <tr key={row.emiNumber} className="hover:bg-slate-800/40">
                      <td className="px-3 py-2 font-semibold text-white">Month {row.emiNumber}</td>
                      <td className="px-3 py-2">₹{parseFloat(row.principal).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2">₹{parseFloat(row.interest).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 font-bold text-emerald-400">₹{parseFloat(row.emi).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-slate-400">₹{parseFloat(row.balance).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Conditions, Acceptance & Validity */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* Validity & Acceptance Status Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white">Offer Lifecycle & Acceptance</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Current Status</span>
                <span className="font-bold text-indigo-400">{offer.status}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Offer Generated On</span>
                <span>{new Date(offer.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Valid Until</span>
                <span className="text-amber-400 font-semibold">{new Date(offer.validUntil).toLocaleString()}</span>
              </div>

              {offer.acceptedAt && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 mt-3 space-y-1 text-emerald-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <UserCheck className="h-4 w-4" />
                    Offer Accepted by Borrower
                  </div>
                  <p className="text-[11px] text-slate-300">Accepted by: {offer.acceptedByName || offer.customerName}</p>
                  <p className="text-[11px] text-slate-300">Time: {new Date(offer.acceptedAt).toLocaleString()}</p>
                  <p className="text-[11px] text-slate-300">Method: {offer.acceptanceMethod}</p>
                </div>
              )}

              {offer.declinedAt && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 mt-3 space-y-1 text-rose-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <XCircle className="h-4 w-4" />
                    Offer Declined by Borrower
                  </div>
                  <p className="text-[11px] text-slate-300">Reason: {offer.declineReason}</p>
                  <p className="text-[11px] text-slate-300">Time: {new Date(offer.declinedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Structured Offer Conditions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Pre-Disbursement Conditions</h3>
              <span className="text-xs text-slate-400">{offer.conditions.length} Total</span>
            </div>

            <div className="space-y-3">
              {offer.conditions.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{c.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        c.status === 'SATISFIED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{c.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Cancel Loan Offer</h3>
            <p className="text-xs text-slate-400">Please provide a reason for cancelling this loan offer.</p>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter cancellation reason..."
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-xs text-white focus:border-rose-500 focus:outline-none"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={cancelMutation.isPending}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                >
                  {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regenerate Modal */}
      {isRegenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Regenerate Loan Offer (Version {offer.version + 1})</h3>
            <p className="text-xs text-slate-400">Adjust sanction terms to generate a revised offer.</p>
            <form onSubmit={handleRegenerateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium">Offered Amount (₹)</label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium">Tenure (Months)</label>
                <input
                  type="number"
                  value={customTenure}
                  onChange={(e) => setCustomTenure(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium">Interest Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegenerateModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regenerateMutation.isPending}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {regenerateMutation.isPending ? 'Generating...' : 'Generate New Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
