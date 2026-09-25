'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileCheck,
  Calendar,
  CreditCard,
  Building2,
  RefreshCw,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner, Badge } from '@/components/ui';

interface LoanOfferItem {
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
  netDisbursedAmount: number;
  annualPercentageRateApr: number;
  status: 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | string;
  validUntil: string;
  isExpired: boolean;
  conditionsCount: number;
  version: number;
  createdAt: string;
}

interface ActiveApplication {
  id: string;
  applicationNumber: string;
  status: string;
  requestedAmount: number;
  tenureMonths: number;
  purpose: string | null;
  product: {
    id: string;
    code: string;
    name: string;
  };
}

interface JourneyState {
  currentStage: string;
  stageLabel: string;
  stageDescription: string;
  progressPercentage: number;
  actionRequired: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

export default function BorrowerOffersHubPage() {
  // 1. Fetch Authoritative Offers for Borrower
  const {
    data: offers = [],
    isLoading: isOffersLoading,
    isError: isOffersError,
    error: offersError,
    refetch: refetchOffers,
    isFetching: isOffersFetching,
  } = useQuery<LoanOfferItem[]>({
    queryKey: ['borrower-offers'],
    queryFn: async () => {
      const res = await api.get<{ data: LoanOfferItem[] }>('/borrower/offers');
      return res.data?.data || (res.data as any) || [];
    },
  });

  // 2. Fetch In-flight Application for Contextual Pending State
  const { data: activeApp, isLoading: isActiveAppLoading } = useQuery<ActiveApplication | null>({
    queryKey: ['borrower-active-application'],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: ActiveApplication }>('/borrower/applications/active');
        return res.data?.data || (res.data as any) || null;
      } catch {
        return null;
      }
    },
  });

  // 3. Fetch Real-time Journey State
  const { data: journeyState } = useQuery<JourneyState | null>({
    queryKey: ['borrower-journey-state'],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: JourneyState }>('/borrower/journey-state');
        return res.data?.data || (res.data as any) || null;
      } catch {
        return null;
      }
    },
  });

  if (isOffersLoading || isActiveAppLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Spinner />
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading loan offers and decision status...</p>
      </div>
    );
  }

  if (isOffersError) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Unable to Load Loan Offers</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {(offersError as any)?.message || 'There was an error communicating with the Offer Engine. Please retry.'}
        </p>
        <Button onClick={() => refetchOffers()} variant="outline" className="gap-2 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/40 p-6 rounded-3xl border border-blue-100 dark:border-slate-800/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 uppercase tracking-wider">
              Phase M4 • Decision & Offer Hub
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Sanctioned Loan Offers & KFS
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Authoritative offers generated by the risk & pricing engine with statutory Key Fact Statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOffers()}
            disabled={isOffersFetching}
            className="rounded-xl text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isOffersFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/borrower">
            <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Case 1: No Offers Available -> Contextual Backend State */}
      {offers.length === 0 && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-sm max-w-xl mx-auto">
          {activeApp && activeApp.status !== 'CANCELLED' && activeApp.status !== 'REJECTED' ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-800">
                <Clock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="text-2xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  {journeyState?.stageLabel || activeApp.status.replace(/_/g, ' ')}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                  Application Under Evaluation
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {journeyState?.stageDescription ||
                    'Our automated credit assessment and risk engines are evaluating your application. Once your offer is generated, it will be listed here.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Application Number:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {activeApp.applicationNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Product:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {activeApp.product.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Requested Amount:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    ₹{Number(activeApp.requestedAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <p className="text-2xs text-slate-400 dark:text-slate-500">
                No action is required from you at this moment. You will receive an update once underwriting completes.
              </p>
            </>
          ) : activeApp && (activeApp.status === 'REJECTED' || activeApp.status === 'CANCELLED') ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900">
                <XCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="text-2xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                  {activeApp.status}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                  Application Not Eligible for Offer
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Your application #{activeApp.applicationNumber} does not meet current risk or credit policy criteria.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/borrower/apply">
                  <Button size="sm" className="text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                    Start New Application
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <FileCheck className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">No Active Offers Found</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                You do not have any pending or active loan offers. Submit an application to discover personalized credit offers.
              </p>
              <div className="pt-2">
                <Link href="/borrower/apply">
                  <Button size="sm" className="text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> Apply for Loan
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* Case 2: Offers Available */}
      {offers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Available Loan Offers ({offers.length})
            </h2>
            <span className="text-2xs text-slate-500 dark:text-slate-400">
              Select an offer to inspect statutory KFS and proceed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.map((offer) => {
              const isAccepted = offer.status === 'ACCEPTED';
              const isDeclined = offer.status === 'DECLINED';
              const isExpired = offer.isExpired || offer.status === 'EXPIRED';
              const isPending = offer.status === 'PENDING_ACCEPTANCE' || offer.status === 'PENDING';

              return (
                <div
                  key={offer.id}
                  className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all ${
                    isPending
                      ? 'border-blue-200 dark:border-blue-500/40 shadow-sm hover:shadow-md hover:border-blue-400'
                      : isAccepted
                      ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-slate-200/80 dark:border-slate-800 opacity-80'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {offer.productName}
                        </span>
                        <span className="text-2xs font-mono text-slate-400">
                          #{offer.offerNo}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                        ₹{offer.offeredAmount.toLocaleString('en-IN')}
                      </h3>
                    </div>

                    <div>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <Clock className="w-3 h-3" /> READY TO REVIEW
                        </span>
                      )}
                      {isAccepted && (
                        <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> ACCEPTED
                        </span>
                      )}
                      {isDeclined && (
                        <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          <XCircle className="w-3 h-3" /> DECLINED
                        </span>
                      )}
                      {isExpired && (
                        <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                          <AlertCircle className="w-3 h-3" /> EXPIRED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 text-center mb-4">
                    <div>
                      <span className="text-2xs text-slate-500 dark:text-slate-400 block">Monthly EMI</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        ₹{offer.monthlyEmi.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-500 dark:text-slate-400 block">Tenure</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {offer.tenureMonths} Mos
                      </span>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-500 dark:text-slate-400 block">Interest Rate</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {offer.annualInterestRatePct}% p.a.
                      </span>
                    </div>
                  </div>

                  {/* Breakdown details */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Net Disbursed Amount:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        ₹{offer.netDisbursedAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Annual Percentage Rate (APR):</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {offer.annualPercentageRateApr}%
                      </span>
                    </div>
                    {offer.validUntil && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Offer Valid Until:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(offer.validUntil).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex items-center justify-between">
                    <span className="text-2xs text-slate-400 dark:text-slate-500">
                      RBI Fair Practice Code Compliant
                    </span>

                    <Link href={`/borrower/offers/${offer.id}`}>
                      <Button
                        size="sm"
                        className={`text-xs rounded-xl gap-1.5 font-semibold ${
                          isPending
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20'
                            : 'variant-outline text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {isPending ? 'Review Offer & KFS' : 'View KFS Details'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
