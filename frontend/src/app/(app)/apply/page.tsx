'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useBorrowerProfile, useBorrowerProducts } from '@/features/borrower/hooks/useBorrower';
import { ApplicationWizard } from '@/features/borrower/components/ApplicationWizard';
import { Spinner } from '@/components/ui';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BorrowerApplyPage() {
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading } = useBorrowerProfile();
  const { data: products = [], isLoading: isProductsLoading } = useBorrowerProducts();

  if (isProfileLoading || isProductsLoading) {
    return (
      <div className="py-24 text-center">
        <Spinner />
        <p className="text-xs text-slate-400 mt-2">Loading application portal...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center">
        <h3 className="text-lg font-bold text-white mb-2">Customer Profile Inactive</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
          Please register or log in with an active borrower account to apply for financing.
        </p>
        <Link href="/dashboard" className="text-xs text-blue-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
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
              <Sparkles className="w-5 h-5 text-blue-400" />
              Digital Loan Application
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant AI Underwriting & Automated Offer Generation
            </p>
          </div>
        </div>
      </div>

      <ApplicationWizard
        products={products}
        profile={profile}
        onApplicationCompleted={(appId) => {
          router.push('/dashboard');
        }}
        onCancel={() => router.push('/dashboard')}
      />
    </div>
  );
}
