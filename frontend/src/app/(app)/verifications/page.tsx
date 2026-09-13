'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Building2,
  FileCheck,
  CreditCard,
  UserCheck,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/lib/toast';
import Link from 'next/link';

interface VerificationItem {
  id: string;
  applicationId: string;
  applicantName: string;
  verificationType: 'KYC_IDENTITY' | 'BANK_STATEMENT' | 'BUREAU' | 'EMPLOYMENT' | 'RESIDENCE';
  status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'DISCREPANCY' | 'MANUAL_REVIEW';
  evidenceRef?: string;
  scoreOrResult?: string;
  updatedAt: string;
  source: 'DIGILOCKER' | 'NSDL' | 'ACCOUNT_AGGREGATOR' | 'CIBIL' | 'FIELD_AGENT' | 'MANUAL';
  discrepancyReason?: string;
}

export default function VerificationsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [verifications] = useState<VerificationItem[]>([
    {
      id: 'VER-001',
      applicationId: 'APP-10029',
      applicantName: 'Rohan Sharma',
      verificationType: 'KYC_IDENTITY',
      status: 'VERIFIED',
      evidenceRef: 'Aadhaar XML & PAN NSDL Match (100%)',
      scoreOrResult: 'Matched',
      updatedAt: '2026-09-13T10:15:00Z',
      source: 'DIGILOCKER'
    },
    {
      id: 'VER-002',
      applicationId: 'APP-10029',
      applicantName: 'Rohan Sharma',
      verificationType: 'BANK_STATEMENT',
      status: 'VERIFIED',
      evidenceRef: 'HDFC Bank - 6 Months AA Consent verified',
      scoreOrResult: 'Avg Balance: ₹42,000/mo',
      updatedAt: '2026-09-13T10:30:00Z',
      source: 'ACCOUNT_AGGREGATOR'
    },
    {
      id: 'VER-003',
      applicationId: 'APP-10029',
      applicantName: 'Rohan Sharma',
      verificationType: 'BUREAU',
      status: 'VERIFIED',
      evidenceRef: 'CIBIL Pull Ref: CIB-892109',
      scoreOrResult: 'Score: 765 (0 Overdue)',
      updatedAt: '2026-09-13T11:00:00Z',
      source: 'CIBIL'
    },
    {
      id: 'VER-004',
      applicationId: 'APP-10034',
      applicantName: 'Ananya Deshmukh',
      verificationType: 'EMPLOYMENT',
      status: 'DISCREPANCY',
      evidenceRef: 'Salary slip employer name mismatch with EPFO',
      scoreOrResult: 'EPFO Inactive',
      updatedAt: '2026-09-13T09:45:00Z',
      source: 'MANUAL',
      discrepancyReason: 'Employer registered as "TechCorp Ltd" vs "TechCorp India Pvt Ltd"'
    },
    {
      id: 'VER-005',
      applicationId: 'APP-10038',
      applicantName: 'Vikram Patel',
      verificationType: 'KYC_IDENTITY',
      status: 'PENDING',
      evidenceRef: 'PAN verification pending NSDL API callback',
      scoreOrResult: 'Processing',
      updatedAt: '2026-09-13T11:10:00Z',
      source: 'NSDL'
    }
  ]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const filtered = verifications.filter((v) => {
    const matchesSearch = 
      v.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || v.verificationType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: VerificationItem['status']) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      case 'DISCREPANCY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" /> Discrepancy
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
      case 'MANUAL_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <UserCheck className="w-3.5 h-3.5" /> Manual Review
          </span>
        );
    }
  };

  const getTypeIcon = (type: VerificationItem['verificationType']) => {
    switch (type) {
      case 'KYC_IDENTITY':
        return <UserCheck className="w-4 h-4 text-indigo-600" />;
      case 'BANK_STATEMENT':
        return <Building2 className="w-4 h-4 text-emerald-600" />;
      case 'BUREAU':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'EMPLOYMENT':
        return <FileCheck className="w-4 h-4 text-amber-600" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Verifications Workspace</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
              Credit Assessment
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Authoritative, evidence-backed KYC, Bureau, Bank Account &amp; Employment checks for Credit Analysts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              toast.info('Refreshed', 'Verification queues synchronized.');
            }}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Sync Feeds
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Identity &amp; KYC</span>
            <UserCheck className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">98.2%</span>
            <span className="text-xs text-emerald-600 font-medium">Pass rate</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Aadhaar XML / NSDL PAN validation</p>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Banking &amp; AA</span>
            <Building2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">12 Pending</span>
            <span className="text-xs text-blue-600 font-medium">Active sync</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Account Aggregator &amp; Fraud checks</p>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bureau Feeds</span>
            <CreditCard className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">Authoritative</span>
            <span className="text-xs text-gray-500">CIBIL / Experian</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Zero manual score override allowed</p>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Discrepancies</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">3 Open</span>
            <span className="text-xs text-amber-700 font-medium">Requires Rework</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Blocks Step 4/5 progression</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, Applicant, or Ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Types</option>
              <option value="KYC_IDENTITY">KYC / Identity</option>
              <option value="BANK_STATEMENT">Bank Statement</option>
              <option value="BUREAU">Credit Bureau</option>
              <option value="EMPLOYMENT">Employment</option>
            </select>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="DISCREPANCY">Discrepancy</option>
            <option value="FAILED">Failed</option>
            <option value="MANUAL_REVIEW">Manual Review</option>
          </select>
        </div>
      </div>

      {/* Verifications Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Verification ID</th>
                <th className="py-3 px-4">Application &amp; Applicant</th>
                <th className="py-3 px-4">Verification Type</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Evidence / Result</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No verification records found matching the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-gray-700">
                      {item.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-gray-900">{item.applicantName}</div>
                      <div className="text-xs font-mono text-indigo-600">{item.applicationId}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.verificationType)}
                        <span className="text-xs font-medium text-gray-700">
                          {item.verificationType.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {item.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-medium text-gray-800">{item.scoreOrResult}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{item.evidenceRef}</div>
                      {item.discrepancyReason && (
                        <div className="mt-1 text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {item.discrepancyReason}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/credit-assessment?applicationId=${item.applicationId}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Inspect in Assessment
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
