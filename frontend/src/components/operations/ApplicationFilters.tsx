'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { ListApplicationsQuery } from '@/lib/api/operations';

interface Props {
  filters: ListApplicationsQuery;
  onFilterChange: (newFilters: Partial<ListApplicationsQuery>) => void;
  onReset: () => void;
}

export function ApplicationFilters({ filters, onFilterChange, onReset }: Props) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== (filters.search || '')) {
        onFilterChange({ search: searchTerm });
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, filters.search, onFilterChange]);

  const stages = [
    { value: '', label: 'All Stages' },
    { value: 'LEAD', label: 'Lead' },
    { value: 'APPLICATION_STARTED', label: 'Application Started' },
    { value: 'APPLICATION_SUBMITTED', label: 'Application Submitted' },
    { value: 'DOCUMENT_VERIFICATION', label: 'Document Verification' },
    { value: 'CREDIT_ASSESSMENT', label: 'Credit Assessment' },
    { value: 'UNDERWRITING', label: 'Underwriting' },
    { value: 'APPROVAL', label: 'Approval' },
    { value: 'SANCTION', label: 'Sanction' },
    { value: 'DISBURSEMENT', label: 'Disbursement' },
    { value: 'DISBURSED', label: 'Disbursed' },
    { value: 'ACTIVE', label: 'Active Loan' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'CLOSED', label: 'Closed' },
  ];

  const priorities = [
    { value: '', label: 'All Priorities' },
    { value: 'URGENT', label: 'Urgent' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
  ];

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'page' && k !== 'pageSize' && v !== undefined && v !== ''
  ).length;

  return (
    <div className="space-y-3">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Application No, Customer, Phone, or Loan No..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Quick Inline Dropdowns for Desktop */}
        <div className="hidden lg:flex items-center gap-2">
          <select
            value={filters.stage || ''}
            onChange={(e) => onFilterChange({ stage: e.target.value })}
            className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
          >
            {stages.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={filters.priority || ''}
            onChange={(e) => onFilterChange({ priority: e.target.value })}
            className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
          >
            {priorities.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Toggle / Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all shadow-sm ${
              activeFilterCount > 0
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setSearchTerm('');
                onReset();
              }}
              title="Reset Filters"
              className="p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {drawerOpen && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Workflow Stage</label>
            <select
              value={filters.stage || ''}
              onChange={(e) => onFilterChange({ stage: e.target.value })}
              className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              {stages.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Operational Priority</label>
            <select
              value={filters.priority || ''}
              onChange={(e) => onFilterChange({ priority: e.target.value })}
              className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Created From</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Created To</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}
