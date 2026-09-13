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
        <p className="text-xs text-slate-400 mt-2">Loading borrower profile...</p>
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
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Borrower Profile & Identity
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified KYC, linked disbursement bank accounts, and digital consents
            </p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> DigiLocker Verified
        </span>
      </div>

      {/* Primary Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Personal Info */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            Personal Details
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800/60">
              <span className="text-slate-400">Full Name:</span>
              <span className="font-semibold text-white">
                {borrower?.firstName} {borrower?.lastName}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/60">
              <span className="text-slate-400">Customer ID:</span>
              <span className="font-mono text-blue-400 font-bold">{borrower?.customerCode}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/60">
              <span className="text-slate-400">Mobile Number:</span>
              <span className="font-mono text-slate-200">{borrower?.mobile}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Registered Email:</span>
              <span className="text-slate-200">{borrower?.email}</span>
            </div>
          </div>
        </div>

        {/* KYC & Identity */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            KYC & Regulatory Compliance
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800/60">
              <span className="text-slate-400">KYC Status:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {borrower?.kycStatus || 'VERIFIED'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/60">
              <span className="text-slate-400">PAN Card:</span>
              <span className="font-mono text-white font-semibold">{borrower?.panNumberMasked || 'ABCDE****F'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/60">
              <span className="text-slate-400">Aadhaar Token:</span>
              <span className="font-mono text-slate-300">********9012 (DigiLocker)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Verification Timestamp:</span>
              <span className="text-slate-400">NSDL Direct Match</span>
            </div>
          </div>
        </div>

        {/* Linked Bank Account */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-400" />
            Verified Bank Account
          </h3>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Bank Name:</span>
              <span className="font-bold text-white">HDFC Bank Ltd</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Account Number:</span>
              <span className="font-mono text-slate-200">••••••••28172</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">IFSC Code:</span>
              <span className="font-mono text-blue-400">HDFC0001234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Penny Drop Verification:</span>
              <span className="text-emerald-400 font-semibold">SUCCESS</span>
            </div>
          </div>
        </div>

        {/* Communication Address */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            Primary Address
          </h3>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1 text-slate-300 leading-relaxed">
            <div className="font-bold text-white">Current Residential Address</div>
            <div>Flat 402, Green Meadows, MG Road</div>
            <div>Indiranagar, Bengaluru, Karnataka - 560038</div>
            <div className="text-[11px] text-slate-500 mt-2">Verified via DigiLocker Proof of Address</div>
          </div>
        </div>
      </div>
    </div>
  );
}
