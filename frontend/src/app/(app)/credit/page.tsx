'use client';

import React from 'react';
import { useBorrowerProfile, useBorrowerCreditFacilities } from '@/features/borrower/hooks/useBorrower';
import { CreditLineManager } from '@/features/borrower/components/CreditLineManager';
import { Spinner } from '@/components/ui';
import { Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BorrowerCreditPage() {
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useBorrowerProfile();
  const { data: facilities = [], isLoading: isFacilitiesLoading, refetch: refetchFacilities } = useBorrowerCreditFacilities();

  if (isProfileLoading || isFacilitiesLoading) {
    return (
      <div className="py-24 text-center">
        <Spinner />
        <p className="text-xs text-slate-400 mt-2">Loading credit facilities...</p>
      </div>
    );
  }

  const handleRefresh = () => {
    refetchProfile();
    refetchFacilities();
  };

  const allFacilities = facilities.length > 0 ? facilities : profile?.creditFacilities || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Revolving Credit Line & Facilities
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Sanctioned limit capacity, instant drawdowns, and limit restoration
            </p>
          </div>
        </div>
      </div>

      <CreditLineManager facilities={allFacilities} onRefresh={handleRefresh} />
    </div>
  );
}
