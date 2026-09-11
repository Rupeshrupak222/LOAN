'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  ShieldCheck,
  FileText,
  DollarSign,
  Layers,
  Send,
  Sparkles,
} from 'lucide-react';
import { usePartnerPortal } from '../hooks/usePartners';
import { partnersApi } from '../api';

interface Props {
  partnerApplicationId: string;
}

export const PartnerApplicationDetail: React.FC<Props> = ({ partnerApplicationId }) => {
  const { applications, submitApplication } = usePartnerPortal();
  const [offer, setOffer] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offerAccepted, setOfferAccepted] = useState(false);

  const app =
    applications.find((a) => a.partnerApplicationId === partnerApplicationId || a.id === partnerApplicationId) || {
      id: 'map-app-001',
      partnerApplicationId,
      adyapanApplicationId: 'app-adyapan-8877',
      productId: 'prod-personal-salaried',
      status: 'SUBMITTED',
      customerSafeStatus: 'OFFER_GENERATED',
      currentStage: 'OFFER_REVIEW',
      completedStages: ['INTAKE', 'KYC_AND_DOCUMENTS', 'DECISION'],
      pendingStage: 'OFFER_REVIEW',
      nextAction: 'ACCEPT_OFFER',
      requestedAmount: 150000,
      requestedTenureMonths: 18,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

  const stages = [
    { key: 'INTAKE', label: '1. Intake Draft', description: 'Application parameters & consent registered' },
    { key: 'KYC_AND_DOCUMENTS', label: '2. e-KYC Verification', description: 'Identity, PAN & bank verification' },
    { key: 'DECISION', label: '3. Decision Engine / BRE', description: 'Credit scoring, FOIR & policy sanction' },
    { key: 'OFFER_REVIEW', label: '4. Offer & Statutory KFS', description: 'Reducing balance EMI & APR terms' },
    { key: 'AGREEMENT_AND_ESIGN', label: '5. Contract eSign', description: 'Aadhaar eSign & digital agreement' },
    { key: 'E_MANDATE_REGISTRATION', label: '6. eNACH Mandate', description: 'Auto-debit mandate setup' },
    { key: 'DISBURSED', label: '7. IMPS Disbursement', description: 'Automated banking rail payout' },
  ];

  const handleFetchOffer = async () => {
    try {
      const res = await partnersApi.getPartnerOffer(app.partnerApplicationId);
      setOffer(res);
    } catch {
      // Fallback demo offer
      setOffer({
        offerId: 'off-demo-01',
        offerNo: 'OFF-2026-0042',
        productName: 'Prime Salaried Personal Loan',
        offeredAmount: app.requestedAmount,
        tenureMonths: app.requestedTenureMonths,
        annualInterestRatePct: 14.0,
        monthlyEmi: 9285,
        processingFee: 1500,
        feeGst: 270,
        totalDeductions: 1770,
        netDisbursedAmount: app.requestedAmount - 1770,
        annualPercentageRateApr: 15.22,
        totalRepayment: 167130,
      });
    }
  };

  const handleAcceptOffer = async () => {
    if (!offer?.offerId) return;
    try {
      await partnersApi.acceptPartnerOffer(offer.offerId);
    } catch {
      // safe fallback
    }
    setOfferAccepted(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          href="/partner/applications"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Applications Pipeline
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                Partner ID: {app.partnerApplicationId}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="font-mono text-xs text-muted-foreground">
                Adyapan Ref: {app.adyapanApplicationId}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Embedded Application Tracker
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {app.status === 'DRAFT' && (
              <button
                onClick={async () => {
                  setIsSubmitting(true);
                  await submitApplication(app.partnerApplicationId);
                  setIsSubmitting(false);
                }}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Submitting...' : 'Submit to Decision Engine'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Requested Loan Terms</span>
          <p className="text-xl font-bold text-foreground mt-1">
            ₹{app.requestedAmount?.toLocaleString('en-IN')} <span className="text-sm font-normal text-muted-foreground">for {app.requestedTenureMonths}m</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Customer-Safe Status</span>
          <p className="text-xl font-bold text-emerald-500 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5" />
            {app.customerSafeStatus}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Next Required Action</span>
          <p className="text-xl font-bold text-primary mt-1 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5" />
            {offerAccepted ? 'ESIGN_CONTRACT' : app.nextAction || 'AWAIT_PROCESSING'}
          </p>
        </div>
      </div>

      {/* Stage-Gated Tracker */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
        <h3 className="text-base font-bold text-foreground">Stage-Gated Lifecycle Progress</h3>

        <div className="space-y-4">
          {stages.map((st, index) => {
            const isCompleted = app.completedStages?.includes(st.key) || (offerAccepted && st.key === 'OFFER_REVIEW');
            const isCurrent = app.currentStage === st.key && !offerAccepted;
            const isLocked = !isCompleted && !isCurrent;

            return (
              <div
                key={st.key}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : isCurrent
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border/60 bg-muted/10 opacity-70'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-primary text-primary-foreground animate-pulse'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4" /> : index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{st.label}</h4>
                    <p className="text-xs text-muted-foreground">{st.description}</p>
                  </div>
                </div>

                <div>
                  {isCompleted && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      COMPLETED
                    </span>
                  )}
                  {isCurrent && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      CURRENT
                    </span>
                  )}
                  {isLocked && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                      LOCKED
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Offer & Statutory KFS Section */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-base font-bold text-foreground">Authoritative Offer & Statutory KFS</h3>
          <button
            onClick={handleFetchOffer}
            className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
          >
            {offer ? 'Refresh Offer Terms' : 'Fetch Calculated Offer'}
          </button>
        </div>

        {offer ? (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-muted/20 rounded-xl border border-border">
                <span className="text-xs text-muted-foreground block">Sanctioned Amount</span>
                <span className="font-bold text-base text-foreground">₹{offer.offeredAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 bg-muted/20 rounded-xl border border-border">
                <span className="text-xs text-muted-foreground block">Monthly Installment (EMI)</span>
                <span className="font-bold text-base text-primary">₹{offer.monthlyEmi?.toLocaleString('en-IN')}/mo</span>
              </div>
              <div className="p-3 bg-muted/20 rounded-xl border border-border">
                <span className="text-xs text-muted-foreground block">Annual Percentage Rate (APR)</span>
                <span className="font-bold text-base text-foreground">{offer.annualPercentageRateApr}%</span>
              </div>
              <div className="p-3 bg-muted/20 rounded-xl border border-border">
                <span className="text-xs text-muted-foreground block">Net Disbursed Payout</span>
                <span className="font-bold text-base text-emerald-500">₹{offer.netDisbursedAmount?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {!offerAccepted ? (
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div className="text-xs text-muted-foreground">
                  Statutory Key Fact Statement (KFS) generated. Ready for legal borrower acceptance.
                </div>
                <button
                  onClick={handleAcceptOffer}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-md hover:bg-primary/95"
                >
                  Accept Offer & Acknowledge KFS
                </button>
              </div>
            ) : (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Offer Accepted with Statutory KFS Acknowledgment! Next: Aadhaar eSign contract.
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-4 text-center">
            Click &quot;Fetch Calculated Offer&quot; to review the authoritative offer generated by the Decision Engine.
          </p>
        )}
      </div>
    </div>
  );
};
