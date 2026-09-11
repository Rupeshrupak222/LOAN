'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  Sliders,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useCreditFacilities } from '../hooks/useCreditLimits';
import { CreditFacility, CreditFacilityStatus } from '../types';
import { CreditLimitSimulatorModal } from './CreditLimitSimulatorModal';

export function CreditFacilityList() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const { data: facilities = [], isLoading, error } = useCreditFacilities({
    search: search || undefined,
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
  });

  // KPI Calculations
  const activeFacilities = facilities.filter((f) => f.status === 'ACTIVE');
  const totalSanctioned = facilities.reduce((sum, f) => sum + (f.status !== 'CANCELLED' && f.status !== 'CLOSED' ? f.approvedLimit : 0), 0);
  const totalUtilized = facilities.reduce((sum, f) => sum + (f.status !== 'CANCELLED' && f.status !== 'CLOSED' ? f.utilizedAmount : 0), 0);
  const totalAvailable = facilities.reduce((sum, f) => sum + (f.status === 'ACTIVE' ? f.availableAmount : 0), 0);
  const frozenCount = facilities.filter((f) => f.status === 'FROZEN' || f.status === 'SUSPENDED').length;

  const getStatusBadge = (status: CreditFacilityStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ACTIVE
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            SUSPENDED
          </span>
        );
      case 'FROZEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Lock className="w-3 h-3" />
            FROZEN
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            EXPIRED
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            CLOSED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {status}
          </span>
        );
    }
  };

  const getRiskBadge = (grade: string) => {
    const colors: Record<string, string> = {
      A: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      B: 'bg-blue-50 text-blue-700 border-blue-200',
      C: 'bg-amber-50 text-amber-700 border-amber-200',
      D: 'bg-orange-50 text-orange-700 border-orange-200',
      E: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${colors[grade] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        Grade {grade}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            Credit Facilities & Limit Desk
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Revolving credit lines, customer exposure balances, drawdown disbursements, and operational limits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Limit Capacity Simulator
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Facilities</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{activeFacilities.length}</span>
            <span className="text-xs text-slate-500">of {facilities.length} total</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {facilities.length > 0 ? Math.round((activeFacilities.length / facilities.length) * 100) : 0}% Active Rate
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Sanctioned Capacity</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">
              ₹{(totalSanctioned / 100000).toFixed(2)} L
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Max institutional credit sanctioned
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Utilized Line Balance</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">
              ₹{(totalUtilized / 100000).toFixed(2)} L
            </span>
          </div>
          <div className="mt-3 text-xs text-blue-600 font-medium">
            {totalSanctioned > 0 ? Math.round((totalUtilized / totalSanctioned) * 100) : 0}% Overall Utilization
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Capacity</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700">
              ₹{(totalAvailable / 100000).toFixed(2)} L
            </span>
            {frozenCount > 0 && (
              <span className="text-xs px-2 py-0.5 font-bold rounded-full bg-rose-100 text-rose-700">
                {frozenCount} Risk Frozen
              </span>
            )}
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Ready for instant drawdowns
          </div>
        </div>
      </div>

      {/* Filters & Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by facility #, borrower, product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['ALL', 'ACTIVE', 'SUSPENDED', 'FROZEN', 'EXPIRED', 'CLOSED'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedStatus === status
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Facilities Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">Loading credit facilities...</div>
          ) : error ? (
            <div className="py-12 text-center text-rose-500 font-medium">
              Failed to load credit facilities. Please check permissions.
            </div>
          ) : facilities.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No credit facilities found matching your criteria.
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Facility #</th>
                  <th className="py-3 px-4">Borrower Details</th>
                  <th className="py-3 px-4">Product & Type</th>
                  <th className="py-3 px-4 text-right">Approved Limit</th>
                  <th className="py-3 px-4 text-right">Utilized</th>
                  <th className="py-3 px-4 text-right">Available</th>
                  <th className="py-3 px-4 text-center">Risk Grade</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {facilities.map((fac) => {
                  const utilPct = fac.approvedLimit > 0 ? Math.round((fac.utilizedAmount / fac.approvedLimit) * 100) : 0;
                  return (
                    <tr key={fac.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-medium text-indigo-600">
                        <Link href={`/credit-facilities/${fac.id}`} className="hover:underline flex items-center gap-1">
                          {fac.facilityNo}
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <span className="text-xs text-slate-400 block font-sans">
                          v{fac.limitVersion}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{fac.customerName}</div>
                        <div className="text-xs text-slate-500">{fac.customerCode} • {fac.customerMobile || 'No mobile'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{fac.productName}</div>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 mt-0.5">
                          {fac.facilityType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900 font-mono">
                        ₹{fac.approvedLimit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        <span className="text-slate-700">₹{fac.utilizedAmount.toLocaleString('en-IN')}</span>
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full ml-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${utilPct > 80 ? 'bg-rose-500' : utilPct > 50 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                            style={{ width: `${Math.min(utilPct, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-700 font-mono">
                        ₹{fac.availableAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getRiskBadge(fac.riskGrade)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(fac.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/credit-facilities/${fac.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          Manage
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Simulator Modal */}
      {isSimulatorOpen && (
        <CreditLimitSimulatorModal isOpen={isSimulatorOpen} onClose={() => setIsSimulatorOpen(false)} />
      )}
    </div>
  );
}
