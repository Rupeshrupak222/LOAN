'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  CreditCard,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner, Card, Badge } from '@/components/ui';

export default function BorrowerLoansHubPage() {
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['borrower-loans'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>('/api/v1/borrower/loans');
      return res.data?.data || res.data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Spinner />
        <p className="text-xs text-slate-400 mt-2">Loading your loan accounts...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/borrower"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              My Loan Accounts & Facilities
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage your active loan facilities, repayment amortization schedules, and NOCs
            </p>
          </div>
        </div>

        <Link href="/borrower/apply">
          <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Apply New Loan
          </Button>
        </Link>
      </div>

      {/* Loans Grid / List */}
      {loans.length > 0 ? (
        <div className="space-y-4">
          {loans.map((loan: any) => {
            const isClosed = loan.status === 'CLOSED';
            const progress = Math.min(100, Math.round((loan.paidEmis / (loan.totalEmis || 1)) * 100));

            return (
              <div
                key={loan.id}
                className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all shadow-xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-400">
                        {loan.loanAccountNumber}
                      </span>
                      <Badge
                        variant={isClosed ? 'default' : 'success'}
                        className={`text-[10px] ${
                          isClosed
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {loan.status}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-white">{loan.productName}</h3>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xs text-slate-400">Sanctioned Amount</div>
                    <div className="text-lg font-black text-white">
                      ₹{loan.principal?.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>
                      {loan.paidEmis} of {loan.totalEmis} EMIs Paid ({progress}%)
                    </span>
                    <span>
                      Outstanding: <strong className="text-white">₹{loan.outstandingPrincipal?.toLocaleString('en-IN')}</strong>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isClosed ? 'bg-slate-600' : 'bg-gradient-to-r from-blue-500 to-emerald-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Card Footer Details & Action Button */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="text-slate-400">
                    {!isClosed && loan.nextEmiDueDate ? (
                      <span>
                        Next EMI: <strong className="text-emerald-400">₹{loan.nextEmiAmount?.toLocaleString('en-IN')}</strong> due on{' '}
                        <span className="text-slate-200">{loan.nextEmiDueDate}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Loan fully paid and settled.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link href={`/borrower/loans/${loan.id}`} className="w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto rounded-xl border-slate-800 bg-slate-950 text-xs text-slate-300 hover:text-white"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5" /> Servicing & Statement
                      </Button>
                    </Link>
                    {!isClosed && (
                      <Link href="/borrower/payments" className="w-full sm:w-auto">
                        <Button
                          size="sm"
                          className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
                        >
                          Pay EMI
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">No Loan Accounts Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              You do not have any active or past loans. Apply today to get instant digital credit up to ₹1,50,000.
            </p>
          </div>
          <Link href="/borrower/apply">
            <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Start Instant Application
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
