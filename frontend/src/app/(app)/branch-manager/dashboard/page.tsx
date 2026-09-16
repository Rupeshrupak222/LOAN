'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';
import { Users, FileText, CheckSquare, CreditCard, Activity } from 'lucide-react';

export default function BranchManagerDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Branch Manager / Dashboard"
        title="Branch Operations Desk"
        subtitle="Operational overview of branch applications, team tasks, and collection performance."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Pipeline</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">42</h3>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">New Apps (Today)</p>
              <h3 className="text-2xl font-bold text-teal-400 mt-1">12</h3>
            </div>
            <div className="p-2 bg-teal-500/10 rounded-lg">
              <Users className="w-5 h-5 text-teal-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">SLA Breaches</p>
              <h3 className="text-2xl font-bold text-rose-400 mt-1">3</h3>
            </div>
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-rose-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Tasks</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">18</h3>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <CheckSquare className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Collection DPD</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">4.2%</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Pipeline Status</h3>
          <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center border border-dashed border-slate-200 dark:border-slate-700/50 rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
            [Branch Pipeline Summary Mini Component]
          </div>
        </Card>

        <Card className="p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Team Workload</h3>
          <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center border border-dashed border-slate-200 dark:border-slate-700/50 rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
            [Team Workload Mini Component]
          </div>
        </Card>
      </div>
    </div>
  );
}
