'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';
import { AlertCircle, AlertTriangle, Briefcase, Calendar, DollarSign, Activity, Users, CheckSquare } from 'lucide-react';

export default function CollectionsDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Collections / Dashboard"
        title="Collection Operations Command Center"
        subtitle="Overview of assigned collection accounts, delinquency status, and today's priorities."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Assigned Accounts</p>
              <h3 className="text-2xl font-bold text-white mt-1">1,245</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Accounts Due Today</p>
              <h3 className="text-2xl font-bold text-white mt-1">42</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">PTP Due Today</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">18</h3>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Broken Promises</p>
              <h3 className="text-2xl font-bold text-red-400 mt-1">5</h3>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <h3 className="text-lg font-medium text-white mb-4">High Priority Delinquencies (DPD &gt; 90)</h3>
          <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
            [High Priority Accounts List]
          </div>
        </Card>

        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <h3 className="text-lg font-medium text-white mb-4">Today's Collection Tasks</h3>
          <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
            [Assigned Tasks List]
          </div>
        </Card>
      </div>
    </div>
  );
}
