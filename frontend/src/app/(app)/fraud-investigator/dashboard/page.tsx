'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';
import { List, AlertTriangle, Folder, Search, FileText, CheckSquare, Users } from 'lucide-react';

export default function FraudInvestigatorDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Fraud Investigator / Dashboard"
        title="Fraud Investigation Desk"
        subtitle="Operational overview of assigned cases, alerts, and investigations."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">My Open Cases</p>
              <h3 className="text-2xl font-bold text-white mt-1">7</h3>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Folder className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Assigned Alerts</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">15</h3>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Critical / SLA Breach</p>
              <h3 className="text-2xl font-bold text-red-400 mt-1">2</h3>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Pending Tasks</p>
              <h3 className="text-2xl font-bold text-teal-400 mt-1">12</h3>
            </div>
            <div className="p-2 bg-teal-500/10 rounded-lg">
              <CheckSquare className="w-5 h-5 text-teal-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <h3 className="text-lg font-medium text-white mb-4">Assigned Investigation Queue</h3>
          <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
            [Investigation Queue Preview]
          </div>
        </Card>

        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <h3 className="text-lg font-medium text-white mb-4">Recent Evidence & Notes</h3>
          <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
            [Recent Activity Feed]
          </div>
        </Card>
      </div>
    </div>
  );
}
