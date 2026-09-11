'use client';

import React from 'react';
import Link from 'next/link';
import { Tag, ChevronLeft } from 'lucide-react';

export default function PartnerOffersPage() {
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
          Sourced Loan Offers & KFS Statements
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review statutory Key Fact Statements (KFS), annual percentage rates (APR), and legal acceptance timestamps.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground uppercase border-b border-border/60">
              <tr>
                <th className="py-3 font-semibold">Offer No</th>
                <th className="py-3 font-semibold">Product</th>
                <th className="py-3 font-semibold">Sanction Amount</th>
                <th className="py-3 font-semibold">Monthly EMI</th>
                <th className="py-3 font-semibold">APR Rate</th>
                <th className="py-3 font-semibold">Offer Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              <tr className="hover:bg-muted/20">
                <td className="py-3.5 font-bold text-foreground">OFF-2026-0042</td>
                <td className="py-3.5 font-sans">Prime Salaried Personal</td>
                <td className="py-3.5 font-sans font-bold text-foreground">₹1,50,000</td>
                <td className="py-3.5 font-sans text-primary font-bold">₹9,285/mo</td>
                <td className="py-3.5 font-sans font-semibold">15.22%</td>
                <td className="py-3.5 font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                    ACCEPTED
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
