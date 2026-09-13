'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  FileText,
  Filter,
  Download,
  Building2,
  User,
  ShieldCheck,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { Card, Button, Badge, Spinner, Input } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatDate, cn } from '@/lib/utils';

export default function DocumentsWorkspacePage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'REJECTED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const isBorrower = user?.roles?.length === 1 && user.roles[0] === 'CUSTOMER';

  const { data: docs = [], isLoading, refetch } = useQuery({
    queryKey: ['documents-workspace'],
    queryFn: async () => {
      const res = await api.get('/documents');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
  });

  const verifyDocMutation = useMutation({
    mutationFn: async ({ docId, status, remarks }: { docId: string; status: 'VERIFIED' | 'REJECTED'; remarks?: string }) => {
      return api.post(`/documents/${docId}/verify`, { status, rejectionReason: remarks });
    },
    onSuccess: (_, variables) => {
      toast.success(`Document marked as ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ['documents-workspace'] });
      queryClient.invalidateQueries({ queryKey: ['credit-assessment'] });
      setSelectedDoc(null);
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err));
    },
  });

  if (isLoading) return <TableSkeleton rows={8} cols={7} />;

  const filteredDocs = docs.filter((doc: any) => {
    const term = searchTerm.toLowerCase();
    const docName = (doc.fileName || doc.documentType || doc.name || '').toLowerCase();
    const customerName = `${doc.customer?.firstName || ''} ${doc.customer?.lastName || ''}`.toLowerCase();
    const customerCode = (doc.customer?.customerCode || '').toLowerCase();
    const matchesSearch = !term || docName.includes(term) || customerName.includes(term) || customerCode.includes(term);

    const isDocVerified = doc.verified || doc.status === 'VERIFIED';
    const isDocRejected = doc.status === 'REJECTED';
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'VERIFIED' && isDocVerified) ||
      (statusFilter === 'REJECTED' && isDocRejected) ||
      (statusFilter === 'PENDING' && !isDocVerified && !isDocRejected);

    const docCategory = (doc.category || '').toUpperCase();
    const matchesCategory = categoryFilter === 'ALL' || docCategory === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const verifiedCount = docs.filter((d: any) => d.verified || d.status === 'VERIFIED').length;
  const pendingCount = docs.filter((d: any) => !d.verified && d.status !== 'VERIFIED' && d.status !== 'REJECTED').length;
  const rejectedCount = docs.filter((d: any) => d.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Lending / Documents Review Desk"
        title="Document Review & Verification Workspace"
        subtitle="Review, inspect, validate, and audit borrower intake and KYC compliance documents across loan applications"
      />

      {/* KPI Counters */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Documents</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{docs.length}</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified Documents</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{verifiedCount}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Review</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">{pendingCount}</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rejected / Anomalies</p>
            <p className="text-2xl font-bold text-rose-500 mt-1">{rejectedCount}</p>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card noPadding className="p-5 space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4 border-slate-100 dark:border-[#2B3566]">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search document, applicant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-transparent text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-transparent text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Categories</option>
              <option value="IDENTITY_PROOF">Identity Proof (PoI)</option>
              <option value="ADDRESS_PROOF">Address Proof (PoA)</option>
              <option value="APPLICANT_PHOTO">Applicant Photo</option>
              <option value="INCOME_PROOF">Income Proof</option>
              <option value="BANK_STATEMENT">Bank Statement</option>
              <option value="BUSINESS_PROOF">Business Proof</option>
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#1E2445] text-xs font-semibold">
            {(['ALL', 'VERIFIED', 'PENDING', 'REJECTED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all',
                  statusFilter === st
                    ? isDark
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#2B3566] text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Document Name / Type</th>
                <th className="py-3 px-3">Applicant / Customer</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Uploaded Date</th>
                <th className="py-3 px-3">Verification Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2B3566]">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No documents found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc: any) => {
                  const isVerified = doc.verified || doc.status === 'VERIFIED';
                  const isRejected = doc.status === 'REJECTED';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-[#1E2445]/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500 flex-none" />
                          <div>
                            <p className="font-bold leading-tight">{doc.fileName || doc.documentType || 'Uploaded Document'}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{doc.documentType || doc.code || 'ID: ' + doc.id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {doc.customer ? `${doc.customer.firstName} ${doc.customer.lastName || ''}` : 'Borrower'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">{doc.customer?.customerCode || '-'}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {doc.category || 'GENERAL'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {doc.createdAt ? formatDate(doc.createdAt) : '-'}
                      </td>
                      <td className="py-3 px-3">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 text-rose-500 font-bold text-[11px]">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-500 font-bold text-[11px]">
                            <Clock className="w-3.5 h-3.5" /> Pending Review
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedDoc(doc)}
                            className="text-xs h-7 px-2"
                          >
                            <Eye className="w-3 h-3 mr-1" /> Inspect
                          </Button>
                          {!isVerified && (
                            <Button
                              size="sm"
                              onClick={() => verifyDocMutation.mutate({ docId: doc.id, status: 'VERIFIED' })}
                              className="text-xs h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Verify
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Document Inspection Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-500" />
                Inspect Document Dossier
              </h3>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <p className="text-slate-400 font-medium">Document Name</p>
                  <p className="font-bold text-slate-800 dark:text-white">{selectedDoc.fileName || selectedDoc.documentType}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Document Category</p>
                  <p className="font-bold text-slate-800 dark:text-white">{selectedDoc.category || 'GENERAL'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Applicant</p>
                  <p className="font-bold text-slate-800 dark:text-white">
                    {selectedDoc.customer?.firstName} {selectedDoc.customer?.lastName || ''}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Status</p>
                  <p className="font-bold text-slate-800 dark:text-white">{selectedDoc.status || 'UPLOADED'}</p>
                </div>
              </div>

              {selectedDoc.fileUrl && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <p className="text-slate-400 text-xs">Storage Key: {selectedDoc.storageKey || selectedDoc.id}</p>
                  <a
                    href={selectedDoc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:underline font-bold"
                  >
                    <Download className="w-3.5 h-3.5" /> Open / Download Original Artifact
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <Button size="sm" variant="secondary" onClick={() => setSelectedDoc(null)}>
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => verifyDocMutation.mutate({ docId: selectedDoc.id, status: 'REJECTED', remarks: 'Failed authenticity verification' })}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Reject Document
              </Button>
              <Button
                size="sm"
                onClick={() => verifyDocMutation.mutate({ docId: selectedDoc.id, status: 'VERIFIED' })}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Approve & Mark Verified
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
