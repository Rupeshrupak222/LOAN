'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';
import { Shield, List, AlertTriangle, FileText, Users, PieChart, CheckSquare, BarChart2, HelpCircle } from 'lucide-react';

export default function RiskAnalystDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Risk Analyst / Dashboard"
        title="Risk Analyst Desk"
        subtitle="Operational overview of risk assessments, alerts, and portfolio health."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Assessments Pending</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">14</h3>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">High Risk Exceptions</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">5</h3>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Portfolio Alerts</p>
              <h3 className="text-2xl font-bold text-rose-400 mt-1">3</h3>
            </div>
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <PieChart className="w-5 h-5 text-rose-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Tasks</p>
              <h3 className="text-2xl font-bold text-teal-400 mt-1">8</h3>
            </div>
            <div className="p-2 bg-teal-500/10 rounded-lg">
              <CheckSquare className="w-5 h-5 text-teal-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Risk Queue Summary</h3>
          <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center border border-dashed border-slate-200 dark:border-slate-700/50 rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
            [Risk Queue Mini Component]
          </div>
        </Card>

        <Card className="p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Portfolio Risk Indicators</h3>
          <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center border border-dashed border-slate-200 dark:border-slate-700/50 rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
            [Portfolio Risk Mini Component]
          </div>
        </Card>
      </div>
    </div>
  );
}
