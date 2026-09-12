'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, ChevronLeft } from 'lucide-react';

export default function PartnerCreditLinesPage() {
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
          Revolving Credit Facilities & Drawdowns
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor revolving limit utilization, available drawing power, and real-time drawdown dispatches.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-muted-foreground uppercase border-b border-border/60">
              <tr>
                <th className="py-3 font-sans font-semibold">Facility No</th>
                <th className="py-3 font-sans font-semibold">Borrower</th>
                <th className="py-3 font-sans font-semibold">Approved Limit</th>
                <th className="py-3 font-sans font-semibold">Available Drawing Power</th>
                <th className="py-3 font-sans font-semibold">Utilized</th>
                <th className="py-3 font-sans font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr className="hover:bg-muted/20">
                <td className="py-3.5 font-bold text-foreground">FAC-2026-0001</td>
                <td className="py-3.5 font-sans font-semibold text-foreground">Aarav Sharma</td>
                <td className="py-3.5 font-sans font-bold text-foreground">₹2,00,000</td>
                <td className="py-3.5 font-sans text-emerald-500 font-bold">₹1,40,000</td>
                <td className="py-3.5 font-sans text-muted-foreground">₹60,000</td>
                <td className="py-3.5 font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                    ACTIVE
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
