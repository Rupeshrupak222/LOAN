'use client';

import React, { useState } from 'react';
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
  Award,
  Layers,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner, Card, Badge } from '@/components/ui';

export default function BorrowerLoansHubPage() {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['borrower-loans'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>('/borrower/loans');
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

  const filteredLoans = loans.filter((loan: any) => {
    const isClosed = loan.status === 'CLOSED' || loan.status === 'SETTLED' || loan.isNocAvailable;
    if (filter === 'ACTIVE') return !isClosed;
    if (filter === 'CLOSED') return isClosed;
    return true;
  });

  const activeCount = loans.filter((l: any) => l.status !== 'CLOSED' && l.status !== 'SETTLED' && !l.isNocAvailable).length;
  const closedCount = loans.filter((l: any) => l.status === 'CLOSED' || l.status === 'SETTLED' || l.isNocAvailable).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/borrower"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              My Loan Accounts & Facilities
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your active loan facilities, repayment amortization schedules, and NOC certificates
            </p>
          </div>
        </div>

        <Link href="/borrower/apply">
          <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Apply New Loan
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      {loans.length > 0 && (
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 w-fit">
          <button
            onClick={() => setFilter('ALL')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
              filter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Loans ({loans.length})
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
              filter === 'ACTIVE'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('CLOSED')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
              filter === 'CLOSED'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Closed & Settled ({closedCount})
          </button>
        </div>
      )}

      {/* Loans Grid / List */}
      {filteredLoans.length > 0 ? (
        <div className="space-y-4">
          {filteredLoans.map((loan: any) => {
            const isClosed = loan.status === 'CLOSED' || loan.status === 'SETTLED' || loan.isNocAvailable;
            const progress = Math.min(100, Math.round((loan.paidEmis / (loan.totalEmis || 1)) * 100));

            return (
              <div
                key={loan.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        {loan.loanAccountNumber}
                      </span>
                      <Badge
                        variant={isClosed ? 'default' : 'success'}
                        className={`text-[10px] ${
                          isClosed
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {loan.status}
                      </Badge>
                      {isClosed && (
                        <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          NOC Ready
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{loan.productName}</h3>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Sanctioned Amount</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      ₹{loan.principal?.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {loan.paidEmis} of {loan.totalEmis} EMIs Paid ({progress}%)
                    </span>
                    <span>
                      Outstanding: <strong className={isClosed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}>
                        ₹{loan.outstandingPrincipal?.toLocaleString('en-IN')}
                      </strong>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isClosed ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-emerald-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Card Footer Details & Action Button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="text-slate-500 dark:text-slate-400">
                    {!isClosed && loan.nextEmiDueDate ? (
                      <span>
                        Next EMI: <strong className="text-emerald-600 dark:text-emerald-400">₹{loan.nextEmiAmount?.toLocaleString('en-IN')}</strong> due on{' '}
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{loan.nextEmiDueDate}</span>
                      </span>
                    ) : isClosed ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Loan fully paid and settled.
                      </span>
                    ) : (
                      <span className="text-slate-500">As per repayment schedule</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link href={`/borrower/loans/${loan.id}`} className="w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5" /> Servicing & SOA
                      </Button>
                    </Link>
                    {isClosed ? (
                      <Link href={`/borrower/loans/${loan.id}`} className="w-full sm:w-auto">
                        <Button
                          size="sm"
                          className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm"
                        >
                          <Award className="w-3.5 h-3.5 mr-1" /> View NOC
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/borrower/payments" className="w-full sm:w-auto">
                        <Button
                          size="sm"
                          className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm"
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
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <CreditCard className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {filter === 'ALL' ? 'No Loan Accounts Found' : filter === 'ACTIVE' ? 'No Active Loans' : 'No Closed Loans'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              {filter === 'CLOSED'
                ? 'You do not have any closed loans yet. Settled loans with NOC certificates will appear here.'
                : 'Apply today to get instant digital credit with flexible tenures.'}
            </p>
          </div>
          {filter !== 'CLOSED' && (
            <Link href="/borrower/apply">
              <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Start Instant Application
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
