'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CreditCard,
  Zap,
  FolderArchive,
  ShieldCheck,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  FileText,
  Building,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import {
  useBorrowerProfile,
  useBorrowerProducts,
  useBorrowerCreditFacilities,
} from '../hooks/useBorrower';
import { StageGatedJourney } from './StageGatedJourney';
import { ProductDiscovery } from './ProductDiscovery';
import { ActiveLoanManager } from './ActiveLoanManager';
import { CreditLineManager } from './CreditLineManager';
import { DocumentUploadCenter } from './DocumentUploadCenter';
import { KycVerificationView } from './KycVerificationView';
import { BorrowerOfferModal } from './BorrowerOfferModal';
import { AgreementAndEsignView } from './AgreementAndEsignView';
import { MandateSetupView } from './MandateSetupView';
import { ApplicationWizard } from './ApplicationWizard';
import type { BorrowerApplicationSummary } from '../types';

export const BorrowerDashboardView: React.FC = () => {
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useBorrowerProfile();
  const { data: products = [], isLoading: isProductsLoading, refetch: refetchProducts } = useBorrowerProducts();
  const { data: creditFacilities = [], refetch: refetchFacilities } = useBorrowerCreditFacilities();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'APPLY' | 'LOANS' | 'CREDIT_LINE' | 'DOCUMENTS' | 'KYC'>('OVERVIEW');
  const [selectedProductIdForApply, setSelectedProductIdForApply] = useState<string | undefined>();
  const [selectedOfferApp, setSelectedOfferApp] = useState<BorrowerApplicationSummary | null>(null);
  const [selectedAgreementApp, setSelectedAgreementApp] = useState<BorrowerApplicationSummary | null>(null);
  const [selectedMandateApp, setSelectedMandateApp] = useState<BorrowerApplicationSummary | null>(null);

  const handleRefresh = () => {
    refetchProfile();
    refetchProducts();
    refetchFacilities();
  };

  if (isProfileLoading || isProductsLoading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-400">Loading your digital borrower dashboard...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">Borrower Profile Inactive</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
          Your customer registration is pending activation. Please contact customer support.
        </p>
      </div>
    );
  }

  // Find most recent in-flight or active application
  const inFlightApp = profile.applications?.[0] || null;
  const activeLoans = profile.loans || [];
  const facilities = creditFacilities.length > 0 ? creditFacilities : profile.creditFacilities || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                Customer Account #{profile.customerCode}
              </span>
              {profile.kycStatus === 'VERIFIED' ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" />
                  e-KYC Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5" />
                  KYC Pending
                </span>
              )}
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold text-white mt-2">
              Welcome, {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-xs lg:text-sm text-slate-400 mt-1 max-w-xl">
              Manage your sanctioned loans, instant credit line drawdowns, digital contracts, and automated repayments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              Refresh
            </button>
            <button
              onClick={() => {
                setSelectedProductIdForApply(undefined);
                setActiveTab('APPLY');
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Loan Application
            </button>
          </div>
        </div>

        {/* Quick Nav Chips */}
        <div className="flex gap-2 overflow-x-auto pt-6 border-t border-slate-800/80 mt-6">
          {[
            { id: 'OVERVIEW', label: 'My Hub & Active Journey', icon: Sparkles },
            { id: 'APPLY', label: 'Loan Schemes & Apply', icon: Plus },
            { id: 'LOANS', label: `Active Loans (${activeLoans.length})`, icon: CreditCard },
            { id: 'CREDIT_LINE', label: `Revolving Line (${facilities.length})`, icon: Zap },
            { id: 'DOCUMENTS', label: `Document Vault (${profile.documents?.length || 0})`, icon: FolderArchive },
            { id: 'KYC', label: 'e-KYC Compliance', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & ACTIVE JOURNEY */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          {/* Active Application Journey Tracker */}
          {inFlightApp && (
            <div>
              <StageGatedJourney
                currentStage={inFlightApp.status}
                onActionClick={(stepId) => {
                  if (stepId === 'offer') setSelectedOfferApp(inFlightApp);
                  else if (stepId === 'agreement') setSelectedAgreementApp(inFlightApp);
                  else if (stepId === 'mandate') setSelectedMandateApp(inFlightApp);
                }}
              />
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Active Loans Sanctioned</span>
                <CreditCard className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-extrabold text-white">
                {activeLoans.length} {activeLoans.length === 1 ? 'Loan' : 'Loans'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Total Outstanding: ₹
                {activeLoans
                  .reduce((sum, l) => sum + (l.outstandingPrincipal || 0), 0)
                  .toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Credit Line Available</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-400">
                ₹
                {facilities
                  .reduce((sum, f) => sum + (f.availableLimit || 0), 0)
                  .toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-400 mt-1">Instant 2-minute bank withdrawal</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Compliance & KYC</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-white">
                {profile.kycStatus === 'VERIFIED' ? '100% Complete' : 'Verification Needed'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {profile.documents?.length || 0} Documents securely archived
              </div>
            </div>
          </div>

          {/* Active Loans Section */}
          {activeLoans.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Active Loan Facilities</h3>
                <button
                  onClick={() => setActiveTab('LOANS')}
                  className="text-xs text-blue-400 hover:underline font-semibold"
                >
                  View Full Schedule & Pay →
                </button>
              </div>
              <ActiveLoanManager loans={activeLoans} onRefresh={handleRefresh} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Explore Loan Products</h3>
              </div>
              <ProductDiscovery
                onSelectProduct={(prod, amt, ten) => {
                  setSelectedProductIdForApply(prod.id);
                  setActiveTab('APPLY');
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPLY FOR LOAN WIZARD */}
      {activeTab === 'APPLY' && (
        <div className="space-y-6">
          <ApplicationWizard
            products={products}
            profile={profile}
            initialProductId={selectedProductIdForApply}
            onApplicationCompleted={() => {
              handleRefresh();
              setActiveTab('OVERVIEW');
            }}
            onCancel={() => setActiveTab('OVERVIEW')}
          />
        </div>
      )}

      {/* TAB 3: ACTIVE LOANS & SCHEDULE */}
      {activeTab === 'LOANS' && (
        <div>
          <ActiveLoanManager loans={activeLoans} onRefresh={handleRefresh} />
        </div>
      )}

      {/* TAB 4: REVOLVING CREDIT LINE */}
      {activeTab === 'CREDIT_LINE' && (
        <div>
          <CreditLineManager facilities={facilities} onRefresh={handleRefresh} />
        </div>
      )}

      {/* TAB 5: DOCUMENTS VAULT */}
      {activeTab === 'DOCUMENTS' && (
        <div>
          <DocumentUploadCenter documents={profile.documents || []} onUploadSuccess={handleRefresh} />
        </div>
      )}

      {/* TAB 6: KYC COMPLIANCE */}
      {activeTab === 'KYC' && (
        <div>
          <KycVerificationView profile={profile} onKycUpdated={handleRefresh} />
        </div>
      )}

      {/* MODALS */}
      {/* 1. Borrower Offer & Statutory KFS Modal */}
      {selectedOfferApp && selectedOfferApp.offer && (
        <BorrowerOfferModal
          isOpen={Boolean(selectedOfferApp)}
          offer={selectedOfferApp.offer}
          onClose={() => setSelectedOfferApp(null)}
          onOfferAccepted={() => {
            setSelectedOfferApp(null);
            handleRefresh();
          }}
        />
      )}

      {/* 2. Digital Agreement & eSign Modal */}
      {selectedAgreementApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 lg:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <AgreementAndEsignView
              applicationId={selectedAgreementApp.id}
              onEsignCompleted={() => {
                setSelectedAgreementApp(null);
                handleRefresh();
              }}
            />
            <div className="mt-4 text-right">
              <button
                onClick={() => setSelectedAgreementApp(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Mandate Setup Modal */}
      {selectedMandateApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 lg:p-8 shadow-2xl relative">
            <MandateSetupView
              applicationId={selectedMandateApp.id}
              bankAccount={profile.bankAccounts?.[0] || null}
              onMandateCompleted={() => {
                setSelectedMandateApp(null);
                handleRefresh();
              }}
            />
            <div className="mt-4 text-right">
              <button
                onClick={() => setSelectedMandateApp(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
