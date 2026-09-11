'use client';

import React from 'react';
import Link from 'next/link';
import { usePartnerPortal } from '@/features/partners';
import { FileText, Plus, Search, ChevronRight, ChevronLeft } from 'lucide-react';

export default function PartnerApplicationsPage() {
  const { applications } = usePartnerPortal();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <Link
            href="/partner"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Partner Hub
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Originated Applications Pipeline
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track stage-gated progress for all borrower loans originated via embedded channels and APIs.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs font-semibold text-muted-foreground uppercase border-b border-border/60">
              <tr>
                <th className="py-3">Partner Application ID</th>
                <th className="py-3">Adyapan Reference</th>
                <th className="py-3">Requested Amount</th>
                <th className="py-3">Current Stage</th>
                <th className="py-3">Customer-Safe Status</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs font-mono">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-muted/20">
                  <td className="py-3.5 font-bold text-foreground">{app.partnerApplicationId}</td>
                  <td className="py-3.5 text-muted-foreground">{app.adyapanApplicationId}</td>
                  <td className="py-3.5 font-sans font-bold text-foreground">
                    ₹{app.requestedAmount?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 font-sans">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
                      {app.currentStage}
                    </span>
                  </td>
                  <td className="py-3.5 font-sans">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-500">
                      {app.customerSafeStatus}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-sans">
                    <Link
                      href={`/partner/applications/${app.partnerApplicationId}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      Track & Action
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
