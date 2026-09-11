'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, ShieldCheck, ChevronLeft } from 'lucide-react';
import { usePartnerDetail } from '@/features/partners';

export default function PartnerSettingsPage() {
  const { partner } = usePartnerDetail('part-demo-001');

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Link
          href="/partner"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Partner Hub
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Partner Organization Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review your institution configuration, regulatory compliance agreements, and contact details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground">Company Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Entity Name</span>
              <span className="font-semibold text-foreground">{partner?.name || 'Nexus Embedded Pay'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Partner Code</span>
              <span className="font-mono font-bold text-foreground">{partner?.code || 'FINTECH_NEXUS'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">PAN</span>
              <span className="font-mono font-bold text-foreground">{partner?.pan || 'AAACN1234F'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Contact Email</span>
              <span className="font-medium text-foreground">{partner?.email || 'integrations@nexuspay.in'}</span>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground">Regulatory & Compliance</h3>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              RBI Digital Lending Compliance (DLA) Active
            </div>
            <p className="text-xs text-muted-foreground">
              Direct Sourcing Agreement (DLA) and KFS standardization confirmed under RBI Master Directions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
