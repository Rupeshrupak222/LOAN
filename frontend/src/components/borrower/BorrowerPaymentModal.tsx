'use client';

import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { Button, Input, Spinner } from '@/components/ui';
import { api, apiErrorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { formatMoney, cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  loan: any;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onSuccess?: () => void;
}

export const BorrowerPaymentModal: React.FC<Props> = ({
  loan,
  isOpen,
  onClose,
  isDark,
  onSuccess,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const emiAmount = Number(loan?.emiAmount || 0);
  const [amount, setAmount] = useState<string>(emiAmount > 0 ? String(emiAmount) : '10000');
  const [method, setMethod] = useState<'UPI' | 'NEFT' | 'IMPS' | 'NET_BANKING'>('UPI');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !loan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmt = Number(amount);
    if (!numAmt || numAmt <= 0) {
      setError('Please enter a valid repayment amount');
      return;
    }

    if (!reference.trim()) {
      setError('Please enter your transaction reference number (e.g. UPI Ref / UTR number)');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/payments/submissions', {
        loanId: loan.id,
        amount: numAmt,
        method,
        reference: reference.trim().toUpperCase(),
        payerMobile: loan.customer?.mobile || undefined,
        notes: notes.trim() || undefined,
      });

      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['borrower-profile-me'] });
      queryClient.invalidateQueries({ queryKey: ['loan', loan.id] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-submissions'] });
      toast.success('Repayment Submitted', 'Your payment proof has been queued for verification.');

      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={cn(
          'relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all',
          isDark ? 'bg-[#0B1528] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900'
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2 text-xs text-blue-200 font-medium">
            <span>Loan #{loan.loanNo}</span>
            <span>•</span>
            <span>{loan.product?.name || 'Personal Loan'}</span>
          </div>
          <h2 className="text-xl font-black tracking-tight mt-1">Make Repayment / Submit Proof</h2>
          <p className="text-xs text-blue-100/80 mt-0.5">Pay via official UPI ID or RTGS/NEFT Virtual Account</p>
        </div>

        {/* Content */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold">Repayment Proof Submitted!</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Your reference <span className="font-mono font-bold text-slate-200">{reference}</span> has been
              received and will be reconciled against banking records shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Virtual Account / Bank Details Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-blue-900/40 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Official Repayment Account
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">UPI VPA</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 select-all">
                    adyapan.repay@icici
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Virtual IFSC</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white select-all">
                    ICIC0000001
                  </span>
                </div>
              </div>
            </div>

            {/* Amount Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Repayment Amount (₹) <span className="text-rose-500">*</span>
                </label>
                {emiAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(emiAmount))}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-semibold cursor-pointer"
                  >
                    Exact EMI: {formatMoney(emiAmount)}
                  </button>
                )}
              </div>
              <Input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
                className="font-mono text-base font-bold"
              />
            </div>

            {/* Payment Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Payment Channel <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['UPI', 'NEFT', 'IMPS', 'NET_BANKING'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={cn(
                      'py-2 px-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center',
                      method === m
                        ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    )}
                  >
                    {m.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference / UTR */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Bank UTR / Transaction Reference <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g., 424151294812 or UPI-912841"
                required
                className="font-mono uppercase text-xs"
              />
              <span className="text-[10px] text-slate-400 block">
                Found on your GPay / PhonePe / Banking app payment confirmation screen
              </span>
            </div>

            {/* Notes / Remarks */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Optional Notes
              </label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. October EMI installment"
                className="text-xs"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-[#2563EB] hover:bg-blue-700 text-white flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Spinner />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Payment Proof</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
