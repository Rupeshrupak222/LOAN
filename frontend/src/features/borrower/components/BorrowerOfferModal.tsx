import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Percent,
  ShieldCheck,
  AlertTriangle,
  Download,
  Coins,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { BorrowerLoanOffer } from '../types';
import { useAcceptLoanOffer, useDeclineLoanOffer } from '../hooks/useBorrower';

interface BorrowerOfferModalProps {
  offer: BorrowerLoanOffer;
  isOpen: boolean;
  onClose: () => void;
  onOfferAccepted?: () => void;
}

export const BorrowerOfferModal: React.FC<BorrowerOfferModalProps> = ({
  offer,
  isOpen,
  onClose,
  onOfferAccepted,
}) => {
  const [kfsChecked, setKfsChecked] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  const acceptMutation = useAcceptLoanOffer();
  const declineMutation = useDeclineLoanOffer();

  if (!isOpen || !offer) return null;

  const handleAccept = () => {
    if (!kfsChecked) return;
    acceptMutation.mutate(
      { offerId: offer.id, kfsAcknowledged: true },
      {
        onSuccess: () => {
          onOfferAccepted?.();
          onClose();
        },
      }
    );
  };

  const handleDecline = () => {
    declineMutation.mutate(
      { offerId: offer.id, reason: declineReason },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-900/60 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">Your Sanctioned Loan Offer</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  OFFER READY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Offer Ref: <span className="font-mono text-slate-300">{offer.offerNo}</span> • Valid until {new Date(offer.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Key Numbers Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Sanctioned Amount</span>
              <div className="text-xl font-black text-white mt-1 font-mono">
                ₹{offer.approvedAmount.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Interest Rate</span>
              <div className="text-xl font-black text-emerald-400 mt-1 font-mono">
                {offer.interestRate}% <span className="text-xs font-normal">p.a.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Monthly EMI</span>
              <div className="text-xl font-black text-blue-400 mt-1 font-mono">
                ₹{offer.monthlyEmi.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Tenure</span>
              <div className="text-xl font-black text-white mt-1 font-mono">
                {offer.tenureMonths} <span className="text-xs font-normal">Months</span>
              </div>
            </div>
          </div>

          {/* Fee Breakdown & Net Payout Table */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Percent className="w-4 h-4 text-blue-400" />
              <span>Statutory Fee & Net Disbursement Breakdown</span>
            </h4>

            <div className="space-y-2 text-xs divide-y divide-slate-800/60">
              <div className="flex items-center justify-between pt-2 text-slate-400">
                <span>Sanctioned Principal:</span>
                <span className="font-semibold text-white font-mono">₹{offer.approvedAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex items-center justify-between pt-2 text-slate-400">
                <span>Processing Fee:</span>
                <span className="font-semibold text-rose-400 font-mono">- ₹{offer.processingFee.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex items-center justify-between pt-2 text-slate-400">
                <span>Applicable GST (18%):</span>
                <span className="font-semibold text-rose-400 font-mono">- ₹{offer.feeGst.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex items-center justify-between pt-2 text-slate-300 font-bold bg-blue-950/20 p-2 rounded-xl">
                <span className="text-blue-300">Net Disbursement to Bank Account:</span>
                <span className="text-base text-emerald-400 font-mono">₹{offer.netDisbursedAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex items-center justify-between pt-2 text-slate-400">
                <span>Statutory Annual Percentage Rate (APR):</span>
                <span className="font-bold text-purple-400 font-mono">{offer.apr}%</span>
              </div>

              <div className="flex items-center justify-between pt-2 text-slate-400">
                <span>Total Amount Repayable:</span>
                <span className="font-semibold text-white font-mono">₹{offer.totalRepayableAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Key Fact Statement (KFS) Statutory Card */}
          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h4 className="text-sm font-bold text-white">RBI Statutory Key Fact Statement (KFS)</h4>
              </div>
              <span className="text-[10px] font-mono text-blue-300 uppercase bg-blue-500/20 px-2 py-0.5 rounded-md">
                RBI Compliant
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In accordance with RBI Master Directions on Digital Lending, all fees, APR, cooling-off period (3 days), and recovery policies are detailed in your Key Fact Statement.
            </p>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={kfsChecked}
                  onChange={(e) => setKfsChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-950 border-slate-700"
                />
                <span className="text-xs text-slate-200 font-medium">
                  I confirm that I have reviewed, understood, and accepted the Key Fact Statement (KFS) and detailed repayment schedule.
                </span>
              </label>
            </div>
          </div>

          {/* Decline Form (Optional) */}
          {showDeclineForm && (
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
              <h4 className="text-xs font-bold text-rose-300">Decline Loan Offer</h4>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Please state why you wish to decline this offer (e.g. interest rate, tenure)..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
                rows={2}
              />
              <button
                onClick={handleDecline}
                disabled={declineMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                {declineMutation.isPending ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowDeclineForm(!showDeclineForm)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            {showDeclineForm ? 'Cancel Decline' : 'Decline Offer'}
          </button>

          <button
            type="button"
            disabled={!kfsChecked || acceptMutation.isPending}
            onClick={handleAccept}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
              kfsChecked && !acceptMutation.isPending
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {acceptMutation.isPending ? (
              'Accepting Offer...'
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Loan Offer & Proceed to Agreement</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
