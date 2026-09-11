'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useOffers } from '../hooks/useOffers';
import { OfferSimulatorModal } from './OfferSimulatorModal';
import type { LoanOffer, OfferStatus } from '../types';
import {
  Sparkles,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  FileCheck2,
  Calculator,
  RefreshCw,
  IndianRupee,
  Calendar,
} from 'lucide-react';

export const OfferManagementList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

  const { data: offers = [], isLoading, refetch } = useOffers({
    status: activeTab === 'ALL' ? undefined : activeTab,
    search: searchTerm || undefined,
  });

  // Calculate Metrics
  const totalOffers = offers.length;
  const pendingCount = offers.filter((o) => o.status === 'PENDING_ACCEPTANCE').length;
  const acceptedCount = offers.filter((o) => o.status === 'ACCEPTED').length;
  const totalSanctionValue = offers
    .filter((o) => o.status === 'ACCEPTED' || o.status === 'PENDING_ACCEPTANCE')
    .reduce((acc, o) => acc + o.offeredAmount, 0);

  const getStatusBadge = (status: OfferStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Accepted
          </span>
        );
      case 'PENDING_ACCEPTANCE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
            <Clock className="h-3 w-3" />
            Pending Customer
          </span>
        );
      case 'DECLINED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" />
            Declined
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            Expired
          </span>
        );
      case 'SUPERSEDED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/20">
            <RefreshCw className="h-3 w-3" />
            Superseded
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/20">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Loan Offer & Pricing Management</h1>
          <p className="text-sm text-slate-400">
            Generate, simulate, track, and manage RBI-compliant versioned loan offers and KFS agreements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-600/10 px-4 py-2.5 text-sm font-semibold text-indigo-400 hover:bg-indigo-600/20 transition shadow-sm"
          >
            <Calculator className="h-4 w-4" />
            Offer Simulator
          </button>
          <Link
            href="/pricing-policies"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            Pricing Policies
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Generated Offers</span>
            <Sparkles className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{totalOffers}</p>
          <p className="mt-1 text-xs text-slate-500">Across active loan products</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Customer Action</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-400">{pendingCount}</p>
          <p className="mt-1 text-xs text-slate-500">Active validity window (48h)</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Accepted & KFS Signed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{acceptedCount}</p>
          <p className="mt-1 text-xs text-slate-500">Ready for digital agreement</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Sanction Portfolio Value</span>
            <IndianRupee className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">₹{totalSanctionValue.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-xs text-slate-500">Pending + Accepted volume</p>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 md:flex-row md:items-center">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ALL', label: 'All Offers' },
            { id: 'PENDING_ACCEPTANCE', label: 'Pending Acceptance' },
            { id: 'ACCEPTED', label: 'Accepted' },
            { id: 'DECLINED', label: 'Declined' },
            { id: 'EXPIRED', label: 'Expired' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[280px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by offer no, customer, application..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Offers Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Offer & App No</th>
                <th className="px-5 py-3.5">Applicant Name</th>
                <th className="px-5 py-3.5">Product & Risk</th>
                <th className="px-5 py-3.5">Sanctioned Amount</th>
                <th className="px-5 py-3.5">Tenure & Rate</th>
                <th className="px-5 py-3.5">Monthly EMI</th>
                <th className="px-5 py-3.5">Statutory APR</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-500" />
                    <p className="mt-2 text-xs">Loading loan offers...</p>
                  </td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Sparkles className="mx-auto h-8 w-8 stroke-[1.2] text-slate-700" />
                    <p className="mt-2 text-sm font-medium text-slate-400">No loan offers found</p>
                    <p className="text-xs text-slate-600">Offers will appear here once applications are approved</p>
                  </td>
                </tr>
              ) : (
                offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{offer.offerNo}</div>
                      <div className="text-[11px] text-slate-500">App: {offer.applicationNo}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-200">{offer.customerName}</div>
                      <div className="text-[11px] text-slate-500">{offer.customerMobile || 'Verified Borrower'}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-300">{offer.productName}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="rounded bg-indigo-500/10 px-1.5 py-0.2 text-[10px] font-bold text-indigo-400">
                          Grade {offer.riskGrade}
                        </span>
                        <span className="text-[10px] text-slate-500">Score: {offer.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-white">
                      ₹{offer.offeredAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-200">{offer.tenureMonths} Months</div>
                      <div className="text-[11px] text-indigo-400">{offer.annualInterestRatePct.toFixed(2)}% p.a.</div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-emerald-400">
                      ₹{offer.monthlyEmi.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-amber-400">
                      {offer.annualPercentageRateApr.toFixed(2)}%
                    </td>
                    <td className="px-5 py-3.5">{getStatusBadge(offer.status)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/offers/${offer.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-indigo-600 hover:text-white transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulator Modal */}
      <OfferSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
};
