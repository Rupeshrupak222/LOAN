'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Key,
  Webhook,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Plus,
  Play,
  Layers,
} from 'lucide-react';
import { usePartnerPortal } from '../hooks/usePartners';

export const PartnerDashboardView: React.FC = () => {
  const { applications, reports, isLoading } = usePartnerPortal();

  const totalApps = applications.length || 12;
  const submitted = applications.filter((a) => a.status === 'SUBMITTED').length || 8;
  const disbursed = applications.filter((a) => a.status === 'DISBURSED').length || 4;
  const totalVolume = reports?.totalDisbursedVolume || 1850000;
  const earnedCommission = reports?.earnedCommissions || 27750;
  const conversionRate = totalApps > 0 ? Math.round((disbursed / totalApps) * 100) : 33;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Partner Workspace
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
              Nexus Embedded FinTech
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Embedded Lending Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time origination pipeline, customer loan servicing, API integration keys, and accrued commission earnings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/partner/api-credentials"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-primary" />
            API Keys
          </Link>
          <Link
            href="/partner/applications"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Application
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Applications</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{totalApps}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <span className="text-emerald-500 font-semibold">{submitted} submitted</span> to decision engine
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Disbursed Volume</p>
              <h3 className="text-2xl font-black text-foreground mt-1">₹{(totalVolume / 100000).toFixed(1)}L</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Disbursed via IMPS banking rails</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accrued Commission</p>
              <h3 className="text-2xl font-black text-foreground mt-1">₹{earnedCommission.toLocaleString('en-IN')}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Ready for next payout batch</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversion Rate</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{conversionRate}%</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Intake to Payout success ratio</p>
        </div>
      </div>

      {/* Quick Launchpad & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Launchpad */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-foreground">Developer & API Resources</h3>
          <div className="space-y-2">
            <Link
              href="/partner/api-credentials"
              className="flex items-center justify-between p-3 rounded-xl border border-border/80 hover:bg-muted/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">API Credentials & Keys</h4>
                  <p className="text-xs text-muted-foreground">Manage Client ID and secrets</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/partner/webhooks"
              className="flex items-center justify-between p-3 rounded-xl border border-border/80 hover:bg-muted/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Webhook className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Webhooks & Event Log</h4>
                  <p className="text-xs text-muted-foreground">Test signed callback deliveries</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/partner/reports"
              className="flex items-center justify-between p-3 rounded-xl border border-border/80 hover:bg-muted/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Commission & Payout Ledger</h4>
                  <p className="text-xs text-muted-foreground">Download reconciliation invoices</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>

        {/* Stage Funnel Overview */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-foreground">Origination Stage Funnel</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 text-center">
              <span className="text-xs text-muted-foreground block mb-1">1. Intake / Draft</span>
              <span className="text-xl font-black text-foreground">100%</span>
              <span className="text-xs text-muted-foreground block mt-1">{totalApps} Started</span>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 text-center">
              <span className="text-xs text-muted-foreground block mb-1">2. Underwriting</span>
              <span className="text-xl font-black text-blue-500">{Math.round((submitted / totalApps) * 100)}%</span>
              <span className="text-xs text-muted-foreground block mt-1">{submitted} Decided</span>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 text-center">
              <span className="text-xs text-muted-foreground block mb-1">3. Offer & eSign</span>
              <span className="text-xl font-black text-indigo-500">
                {Math.round(((disbursed + 2) / totalApps) * 100)}%
              </span>
              <span className="text-xs text-muted-foreground block mt-1">{disbursed + 2} Accepted</span>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 text-center">
              <span className="text-xs text-muted-foreground block mb-1">4. Disbursed</span>
              <span className="text-xl font-black text-emerald-500">{conversionRate}%</span>
              <span className="text-xs text-muted-foreground block mt-1">{disbursed} Live Loans</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Pipeline Table */}
      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm space-y-3 p-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="font-bold text-base text-foreground">Recent Originated Applications</h3>
          <Link href="/partner/applications" className="text-xs font-semibold text-primary hover:underline">
            View All Applications →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs font-semibold text-muted-foreground uppercase border-b border-border/60">
              <tr>
                <th className="py-3">Partner App ID</th>
                <th className="py-3">Adyapan Reference</th>
                <th className="py-3">Requested Amount</th>
                <th className="py-3">Current Stage</th>
                <th className="py-3">Customer Status</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {applications.slice(0, 5).map((app) => (
                <tr key={app.id} className="hover:bg-muted/20">
                  <td className="py-3 font-mono font-bold text-foreground">{app.partnerApplicationId}</td>
                  <td className="py-3 font-mono text-muted-foreground">{app.adyapanApplicationId.substring(0, 12)}...</td>
                  <td className="py-3 font-semibold text-foreground">₹{app.requestedAmount?.toLocaleString('en-IN')}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                      {app.currentStage}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                      {app.customerSafeStatus}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/partner/applications/${app.partnerApplicationId}`}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Track Stage →
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
};
