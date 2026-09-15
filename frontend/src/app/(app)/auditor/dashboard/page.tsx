'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';
import { ShieldCheck, FileText, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

export default function AuditorDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Auditor / Dashboard"
        title="Audit & Governance Command Center"
        subtitle="Tenant-wide independent inspection and read-only governance overview."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Audit Events</p>
              <h3 className="text-2xl font-bold text-white mt-1">124,592</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Applications Inspected</p>
              <h3 className="text-2xl font-bold text-white mt-1">8,941</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Pending Findings</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">14</h3>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Policy Violations</p>
              <h3 className="text-2xl font-bold text-red-400 mt-1">0</h3>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <h3 className="text-lg font-medium text-white mb-4">Recent High-Risk Audit Events</h3>
          <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
            No high-risk policy deviations detected recently.
          </div>
        </Card>

        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <h3 className="text-lg font-medium text-white mb-4">Failed Financial Controls</h3>
          <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
            All general ledger postings successfully reconciled.
          </div>
        </Card>
      </div>
    </div>
  );
}
