'use client';

import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  User, 
  Building,
  RefreshCw,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

interface CreditQueueItem {
  id: string;
  applicationNumber: string;
  applicantName: string;
  customerType: 'SALARIED' | 'SELF_EMPLOYED' | 'STUDENT';
  productName: string;
  requestedAmount: number;
  workflowStage: string;
  status: string;
  slaRemainingHours: number;
  documentsStatus: 'COMPLETE' | 'PENDING' | 'DISCREPANCY';
  kycStatus: 'VERIFIED' | 'PENDING' | 'FAILED';
  financialStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  bureauScore?: number;
  assignedTo?: string;
  submittedAt: string;
}

export default function CreditQueuePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('ALL');

  const [queueItems, setQueueItems] = useState<CreditQueueItem[]>([
    {
      id: 'app-salaried-01',
      applicationNumber: 'APP-2026-9001',
      applicantName: 'Vikramaditya Singhania',
      customerType: 'SALARIED',
      productName: 'Personal Express Loan',
      requestedAmount: 500000,
      workflowStage: 'CREDIT_ASSESSMENT',
      status: 'UNDER_REVIEW',
      slaRemainingHours: 4.5,
      documentsStatus: 'COMPLETE',
      kycStatus: 'VERIFIED',
      financialStatus: 'IN_PROGRESS',
      bureauScore: 780,
      submittedAt: '2026-09-13T08:30:00Z'
    },
    {
      id: 'app-selfemp-02',
      applicationNumber: 'APP-2026-9002',
      applicantName: 'Priya Sharma & Co',
      customerType: 'SELF_EMPLOYED',
      productName: 'SME Working Capital',
      requestedAmount: 1500000,
      workflowStage: 'CREDIT_ASSESSMENT',
      status: 'UNDER_REVIEW',
      slaRemainingHours: 1.2,
      documentsStatus: 'PENDING',
      kycStatus: 'VERIFIED',
      financialStatus: 'NOT_STARTED',
      bureauScore: 710,
      submittedAt: '2026-09-13T09:15:00Z'
    },
    {
      id: 'app-student-03',
      applicationNumber: 'APP-2026-9003',
      applicantName: 'Aarav Mehta',
      customerType: 'STUDENT',
      productName: 'Higher Education Loan',
      requestedAmount: 850000,
      workflowStage: 'CREDIT_ASSESSMENT',
      status: 'UNDER_REVIEW',
      slaRemainingHours: 6.0,
      documentsStatus: 'COMPLETE',
      kycStatus: 'VERIFIED',
      financialStatus: 'NOT_STARTED',
      bureauScore: undefined,
      submittedAt: '2026-09-13T10:00:00Z'
    }
  ]);

  useEffect(() => {
    // In production, sync with /api/credit/queue or /api/applications?stage=CREDIT_ASSESSMENT
    setLoading(false);
  }, []);

  const filtered = queueItems.filter((item) => {
    const matchesSearch = 
      item.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesType = customerTypeFilter === 'ALL' || item.customerType === customerTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Credit Queue</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {filtered.length} Applications Actionable
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Assigned applications awaiting sequential credit assessment, KYC verification, and recommendation handoff.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.info('Refreshed', 'Credit queue updated with latest loan applications.')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Queue Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Awaiting Step 1 Review</span>
            <Inbox className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">1</div>
          <p className="text-xs text-gray-400 mt-1">Application &amp; Eligibility</p>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Assessment In Progress</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">2</div>
          <p className="text-xs text-gray-400 mt-1">Steps 2 to 5 Active</p>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">SLA Urgent (&lt; 2h)</span>
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600">1</div>
          <p className="text-xs text-red-400 mt-1">Requires immediate attention</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search queue by applicant or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={customerTypeFilter}
            onChange={(e) => setCustomerTypeFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Borrower Types</option>
            <option value="SALARIED">Salaried</option>
            <option value="SELF_EMPLOYED">Self Employed</option>
            <option value="STUDENT">Student</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="PENDING">Pending Documents</option>
            <option value="DISCREPANCY">Discrepancy</option>
          </select>
        </div>
      </div>

      {/* Applications Queue Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/75 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">Application</th>
              <th className="py-3 px-4">Applicant &amp; Type</th>
              <th className="py-3 px-4">Product &amp; Amount</th>
              <th className="py-3 px-4">KYC / Docs</th>
              <th className="py-3 px-4">Bureau</th>
              <th className="py-3 px-4">SLA</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/60 transition">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-gray-900">{item.applicationNumber}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(item.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-gray-900">{item.applicantName}</div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {item.customerType.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="text-gray-900 font-medium">₹{item.requestedAmount.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-gray-500">{item.productName}</div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      item.kycStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      KYC: {item.kycStatus}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      item.documentsStatus === 'COMPLETE' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      Docs: {item.documentsStatus}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  {item.bureauScore ? (
                    <span className="font-semibold text-gray-900">
                      {item.bureauScore} <span className="text-xs text-emerald-600 font-normal">(CIBIL)</span>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">NTC / Excluded</span>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    item.slaRemainingHours < 2 ? 'text-red-600' : 'text-gray-700'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    {item.slaRemainingHours}h remaining
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Link
                    href={`/credit-assessment?applicationId=${item.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition"
                  >
                    Start Assessment
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
