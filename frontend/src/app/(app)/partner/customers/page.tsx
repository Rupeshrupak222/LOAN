'use client';

import React from 'react';
import Link from 'next/link';
import { Users, ShieldCheck, ChevronLeft } from 'lucide-react';

export default function PartnerCustomersPage() {
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
          Partner Customer & Consent Ledger
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registered embedded borrower identities, DPDP consent records, and KYC verification statuses.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-muted-foreground uppercase border-b border-border/60">
              <tr>
                <th className="py-3 font-sans font-semibold">Partner Customer ID</th>
                <th className="py-3 font-sans font-semibold">Borrower Name</th>
                <th className="py-3 font-sans font-semibold">Consent Reference</th>
                <th className="py-3 font-sans font-semibold">Consent Status</th>
                <th className="py-3 font-sans font-semibold">Registered At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-muted/20">
                <td className="py-3.5 font-bold text-foreground">CUST-NEXUS-8899</td>
                <td className="py-3.5 font-sans font-semibold text-foreground">Aarav Sharma</td>
                <td className="py-3.5 text-muted-foreground">CONSENT-REF-998811</td>
                <td className="py-3.5 font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                    ACTIVE
                  </span>
                </td>
                <td className="py-3.5 text-muted-foreground font-sans">2026-09-11 14:20</td>
              </tr>
              <tr className="hover:bg-muted/20">
                <td className="py-3.5 font-bold text-foreground">CUST-NEXUS-8842</td>
                <td className="py-3.5 font-sans font-semibold text-foreground">Pooja Verma</td>
                <td className="py-3.5 text-muted-foreground">CONSENT-REF-998812</td>
                <td className="py-3.5 font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                    ACTIVE
                  </span>
                </td>
                <td className="py-3.5 text-muted-foreground font-sans">2026-09-10 11:05</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
