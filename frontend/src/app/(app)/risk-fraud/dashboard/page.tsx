'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';
import { ShieldAlert, AlertTriangle, AlertCircle, FileText, CheckSquare, Users } from 'lucide-react';

export default function RiskFraudDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Risk & Fraud / Dashboard"
        title="Risk & Fraud Control Center"
        subtitle="Real-time monitoring of fraud alerts, risk cases, and control exceptions."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Risk Alerts</p>
              <h3 className="text-2xl font-bold text-white mt-1">45</h3>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Open Fraud Cases</p>
              <h3 className="text-2xl font-bold text-red-400 mt-1">12</h3>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Active Fraud Holds</p>
              <h3 className="text-2xl font-bold text-white mt-1">8</h3>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">KYC Anomalies</p>
              <h3 className="text-2xl font-bold text-orange-400 mt-1">3</h3>
            </div>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Users className="w-5 h-5 text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <h3 className="text-lg font-medium text-white mb-4">Critical Fraud Alerts</h3>
          <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
            [Fraud Alerts Table]
          </div>
        </Card>

        <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
          <h3 className="text-lg font-medium text-white mb-4">Applications Under Investigation</h3>
          <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
            [Applications Table]
          </div>
        </Card>
      </div>
    </div>
  );
}
