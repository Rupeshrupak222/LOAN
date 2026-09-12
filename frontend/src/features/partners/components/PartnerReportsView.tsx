'use client';

import React from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronLeft,
} from 'lucide-react';
import { usePartnerDetail, usePartnerPortal } from '../hooks/usePartners';

export const PartnerReportsView: React.FC = () => {
  const { payout } = usePartnerDetail('part-demo-001');
  const { reports } = usePartnerPortal();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
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
            Sourcing Analytics & Commissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reconciliation ledger, disbursement metrics, accrued commissions, and settlement summaries.
          </p>
        </div>

        <button
          onClick={() => {
            const csv = 'Date,ApplicationNo,LoanNo,DisbursedAmount,CommissionType,CommissionAmount,Status\n2026-09-11,APP-NEXUS-01,LN-2026-0042,150000,DISBURSEMENT_COMMISSION,2250,ACCRUED\n';
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `partner_commission_report_${Date.now()}.csv`;
            a.click();
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/95 transition-all"
        >
          <Download className="w-4 h-4" />
          Export Settlement CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Total Sourced Disbursals</span>
          <p className="text-2xl font-black text-foreground mt-1">
            ₹{(payout?.totalDisbursedVolume || 1850000).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Across 12 originated loans</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Total Earned Commission</span>
          <p className="text-2xl font-black text-emerald-500 mt-1">
            ₹{(payout?.totalEarnedCommission || 27750).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-foreground mt-2">1.5% average commercial rate</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Pending Net Settlement</span>
          <p className="text-2xl font-black text-primary mt-1">
            ₹{(payout?.pendingPayoutAmount || 27750).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Scheduled for next batch payout</p>
        </div>
      </div>

      {/* Commission Ledger Table */}
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground">Commission Transaction History</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground uppercase border-b border-border/60">
              <tr>
                <th className="py-2.5">Loan / App Reference</th>
                <th className="py-2.5">Disbursed Volume</th>
                <th className="py-2.5">Commission Type</th>
                <th className="py-2.5">Earned Amount</th>
                <th className="py-2.5">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              <tr className="hover:bg-muted/20">
                <td className="py-3">
                  <div className="font-bold text-foreground">LN-2026-0042</div>
                  <div className="text-muted-foreground font-normal">APP-NEXUS-01</div>
                </td>
                <td className="py-3 font-semibold text-foreground">₹1,50,000</td>
                <td className="py-3 text-muted-foreground">DISBURSEMENT (1.5%)</td>
                <td className="py-3 font-bold text-emerald-500">₹2,250</td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500">
                    ACCRUED
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-muted/20">
                <td className="py-3">
                  <div className="font-bold text-foreground">LN-2026-0038</div>
                  <div className="text-muted-foreground font-normal">APP-NEXUS-02</div>
                </td>
                <td className="py-3 font-semibold text-foreground">₹3,00,000</td>
                <td className="py-3 text-muted-foreground">DISBURSEMENT (1.5%)</td>
                <td className="py-3 font-bold text-emerald-500">₹4,500</td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                    PAID
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
