'use client';

import React from 'react';
import { useBorrowerProfile } from '@/features/borrower/hooks/useBorrower';
import { DocumentUploadCenter } from '@/features/borrower/components/DocumentUploadCenter';
import { KycVerificationView } from '@/features/borrower/components/KycVerificationView';
import { Spinner } from '@/components/ui';
import { FolderArchive, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BorrowerDocumentsPage() {
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useBorrowerProfile();

  if (isProfileLoading) {
    return (
      <div className="py-24 text-center">
        <Spinner />
        <p className="text-xs text-slate-400 mt-2">Loading documents & compliance records...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center">
        <h3 className="text-lg font-bold text-white mb-2">Customer Profile Inactive</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
          Please register or log in with an active borrower account.
        </p>
        <Link href="/dashboard" className="text-xs text-blue-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4 animate-in fade-in duration-300">
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
              <FolderArchive className="w-5 h-5 text-blue-400" />
              Document Vault & Compliance
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Securely stored KYC verification records and regulatory documents
            </p>
          </div>
        </div>
      </div>

      <KycVerificationView profile={profile} onKycUpdated={refetchProfile} />

      <DocumentUploadCenter
        documents={profile.documents || []}
        onUploadSuccess={refetchProfile}
      />
    </div>
  );
}
