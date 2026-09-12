'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Scale,
  TrendingUp,
  Layers,
  CreditCard,
  Receipt,
  CalendarClock,
  ShieldAlert,
  Building,
} from 'lucide-react';
import {
  AccountingDashboardView,
  JournalsView,
  JournalCreateModal,
  PeriodsView,
  TrialBalanceView,
  FinancialStatementsView,
  ReceivablesView,
  PayablesView,
  TaxAccountingView,
  AccrualsView,
  FinanceControlsView,
} from '@/features/accounting';

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isJournalCreateOpen, setIsJournalCreateOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Finance Control Hub', icon: LayoutDashboard },
    { id: 'journals', label: 'Manual Journals', icon: FileText },
    { id: 'periods', label: 'Fiscal Periods', icon: Calendar },
    { id: 'trial-balance', label: 'Trial Balance', icon: Scale },
    { id: 'reports', label: 'Financial Statements', icon: TrendingUp },
    { id: 'receivables', label: 'Receivables & Aging', icon: Layers },
    { id: 'payables', label: 'Accounts Payable', icon: CreditCard },
    { id: 'tax', label: 'GST & Statutory Tax', icon: Receipt },
    { id: 'accruals', label: 'Accruals & Provisions', icon: CalendarClock },
    { id: 'controls', label: 'Suspense & Controls', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Accounting & Financial Operations
              </h1>
              <p className="text-xs text-slate-400">
                Phase 12: Chart of Accounts, Period Governance, Maker-Checker Manual Journals, Dynamic P&L & Balance Sheet, and Statutory GST.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 border border-blue-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content View */}
      <div>
        {activeTab === 'dashboard' && (
          <AccountingDashboardView
            onTabChange={(tab) => setActiveTab(tab)}
            onOpenNewJournal={() => setIsJournalCreateOpen(true)}
            onOpenPeriodClose={() => setActiveTab('periods')}
          />
        )}

        {activeTab === 'journals' && <JournalsView />}

        {activeTab === 'periods' && <PeriodsView />}

        {activeTab === 'trial-balance' && <TrialBalanceView />}

        {activeTab === 'reports' && <FinancialStatementsView />}

        {activeTab === 'receivables' && <ReceivablesView />}

        {activeTab === 'payables' && <PayablesView />}

        {activeTab === 'tax' && <TaxAccountingView />}

        {activeTab === 'accruals' && <AccrualsView />}

        {activeTab === 'controls' && <FinanceControlsView />}
      </div>

      {/* Global Manual Journal Creation Modal */}
      <JournalCreateModal
        isOpen={isJournalCreateOpen}
        onClose={() => setIsJournalCreateOpen(false)}
      />
    </div>
  );
}
