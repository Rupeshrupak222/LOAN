'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  User,
  ArrowLeft,
  ShieldCheck,
  Building2,
  MapPin,
  CreditCard,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner, Card, Badge } from '@/components/ui';

export default function BorrowerProfilePage() {
  const { data: homeData, isLoading } = useQuery({
    queryKey: ['borrower-profile'],
    queryFn: async () => {
      const res = await api.get<{ data: any }>('/api/v1/borrower/home');
      return res.data?.data || res.data;
    },
  });

  const borrower = homeData?.borrower;

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Spinner />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Loading borrower profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/borrower"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Borrower Profile & Identity
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified KYC, linked disbursement bank accounts, and digital consents
            </p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> DigiLocker Verified
        </span>
      </div>

      {/* Primary Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Personal Details */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Personal Details
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Full Legal Name:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {[borrower?.firstName, borrower?.lastName].filter(Boolean).join(' ') || '—'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Customer ID:</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{borrower?.customerCode || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Mobile Number:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{borrower?.mobile || '—'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 dark:text-slate-400">Registered Email:</span>
              <span className="text-slate-800 dark:text-slate-200">{borrower?.email || '—'}</span>
            </div>
          </div>
        </div>

        {/* KYC & Identity */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            KYC & Regulatory Compliance
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">KYC Status:</span>
              <span className={`font-bold flex items-center gap-1 ${borrower?.kycStatus === 'VERIFIED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> {borrower?.kycStatus ? borrower.kycStatus.replace(/_/g, ' ') : 'NOT STARTED'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">PAN Card:</span>
              <span className={`font-mono font-semibold ${borrower?.panNumberMasked ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>
                {borrower?.panNumberMasked || 'Not Linked'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Aadhaar Token:</span>
              <span className={`font-mono ${borrower?.aadhaarMasked ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 italic'}`}>
                {borrower?.aadhaarMasked || 'Not Linked'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 dark:text-slate-400">Verification Status:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {borrower?.kycStatus === 'VERIFIED' ? 'DigiLocker / Direct Match' : 'Pending Verification'}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Bank Account */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Disbursement & Mandate Bank Account
          </h3>

          {borrower?.bankLinked ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Bank Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{borrower?.bankName || 'Linked Bank'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Account Number:</span>
                <span className="font-mono text-slate-700 dark:text-slate-200">{borrower?.bankAccountNoMasked || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">IFSC Code:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{borrower?.bankIfsc || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Verification Status:</span>
                <span className={`font-semibold ${borrower?.isBankVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {borrower?.isBankVerified ? 'VERIFIED / SUCCESS' : 'PENDING'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-center py-6 text-slate-500 dark:text-slate-400">
              No bank account linked yet. Link your bank account during loan application or mandate setup.
            </div>
          )}
        </div>

        {/* Communication Address */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Primary Address
          </h3>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
            <div className="font-bold text-slate-900 dark:text-white">Registered Residence</div>
            <div>{borrower?.address || 'No registered communication address on file.'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
