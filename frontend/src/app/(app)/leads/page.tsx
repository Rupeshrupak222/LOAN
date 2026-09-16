'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  PhoneCall,
  Mail,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  Send,
  Building,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { Button, Input, Card, Badge, Spinner } from '@/components/ui';

interface Lead {
  id: string;
  leadCode: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  employmentType: string;
  employerName?: string;
  monthlyIncome?: number;
  requestedAmount?: number;
  productId?: string;
  source: 'DIGITAL' | 'BRANCH' | 'REFERRAL' | 'DIRECT' | 'PARTNER';
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  notes?: string;
  nextFollowUpDate?: string;
  convertedCustomerId?: string;
  convertedApplicationId?: string;
  createdAt: string;
}

export default function LeadsPage() {
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Create Lead Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    employmentType: 'SALARIED',
    employerName: '',
    monthlyIncome: '',
    requestedAmount: '',
    source: 'BRANCH',
    notes: '',
  });

  // Convert Lead Modal
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<Lead | null>(null);
  const [convertData, setConvertData] = useState({
    productId: '',
    requestedAmount: '',
    tenureMonths: '24',
    purpose: '',
  });

  // Fetch products for conversion
  const { data: productsData } = useQuery({
    queryKey: ['loan-products-dropdown'],
    queryFn: async () => {
      const res = await api.get('/loan-products');
      return res.data?.data || [];
    },
  });

  // Fetch leads with pagination
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['leads', search, sourceFilter, statusFilter, page, pageSize],
    queryFn: async () => {
      const res = await api.get('/leads', {
        params: {
          search: search || undefined,
          source: sourceFilter || undefined,
          status: statusFilter || undefined,
          page,
          pageSize,
        },
      });
      const rows = res.data?.data;
      const pagination = res.data?.pagination || {
        page,
        pageSize,
        total: Array.isArray(rows) ? rows.length : 0,
        totalPages: Math.max(1, Math.ceil((Array.isArray(rows) ? rows.length : 0) / pageSize)),
      };
      return {
        leads: (Array.isArray(rows) ? rows : []) as Lead[],
        pagination,
      };
    },
  });

  const leads = responseData?.leads || [];
  const pagination = responseData?.pagination || { page, pageSize, total: leads.length, totalPages: 1 };
  const products = productsData || [];

  // Create Lead Mutation
  const createLeadMutation = useMutation({
    mutationFn: async () => {
      return api.post('/leads', {
        ...formData,
        monthlyIncome: formData.monthlyIncome ? Number(formData.monthlyIncome) : undefined,
        requestedAmount: formData.requestedAmount ? Number(formData.requestedAmount) : undefined,
      });
    },
    onSuccess: () => {
      toast.success('Origination lead captured successfully.');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['loan-officer-dashboard-leads'] });
      setCreateModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        mobile: '',
        email: '',
        employmentType: 'SALARIED',
        employerName: '',
        monthlyIncome: '',
        requestedAmount: '',
        source: 'BRANCH',
        notes: '',
      });
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err), { title: 'Failed to create lead' });
    },
  });

  // Convert Lead Mutation
  const convertLeadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLeadForConvert) return;
      return api.post(`/leads/${selectedLeadForConvert.id}/convert`, {
        productId: convertData.productId || undefined,
        requestedAmount: convertData.requestedAmount ? Number(convertData.requestedAmount) : undefined,
        tenureMonths: Number(convertData.tenureMonths) || 24,
        purpose: convertData.purpose || undefined,
      });
    },
    onSuccess: (res: any) => {
      const result = res.data?.data;
      toast.success('Lead converted into Customer and Application successfully!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['loan-officer-dashboard-leads'] });
      queryClient.invalidateQueries({ queryKey: ['loan-officer-dashboard-apps'] });
      setConvertModalOpen(false);
      setSelectedLeadForConvert(null);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err), { title: 'Failed to convert lead' });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              Origination Pipeline
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-1">
            Lead Sourcing Desk
          </h1>
          <p className="text-xs text-slate-500">
            Capture prospective borrowers across digital, branch, and referral channels and convert them directly into loan applications.
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Capture New Lead
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 space-y-3 border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Search by name, phone, email, lead code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs"
            />
          </div>

          <div>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200"
            >
              <option value="">All Sourcing Channels</option>
              <option value="DIGITAL">Digital / Web Inquiries</option>
              <option value="BRANCH">Branch Assisted</option>
              <option value="REFERRAL">Customer Referral</option>
              <option value="DIRECT">Direct Outreach</option>
              <option value="PARTNER">DSA / Partner Sourced</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New (Uncontacted)</option>
              <option value="CONTACTED">Contacted / Follow-Up</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="CONVERTED">Converted to Application</option>
              <option value="LOST">Lost / Dropped</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Leads Table */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        {isLoading ? (
          <div className="py-16 flex justify-center items-center">
            <Spinner />
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <Sparkles className="w-8 h-8 text-blue-500 mx-auto opacity-50" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No origination leads found</p>
            <p className="text-[11px] text-slate-400">Capture a new lead to begin borrower onboarding.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="py-3 px-4">Lead ID & Date</th>
                  <th className="py-3 px-4">Prospect Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Employment & Income</th>
                  <th className="py-3 px-4">Loan Requirement</th>
                  <th className="py-3 px-4">Source Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">{lead.leadCode}</span>
                      <p className="text-[10px] text-slate-400">{formatDate(lead.createdAt)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{lead.firstName} {lead.lastName}</p>
                      {lead.employerName && <p className="text-[10px] text-slate-400">{lead.employerName}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{lead.mobile}</p>
                      {lead.email && <p className="text-[10px] text-slate-400 truncate max-w-xs">{lead.email}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {lead.employmentType}
                      </span>
                      {lead.monthlyIncome && (
                        <p className="text-[10px] text-slate-400 mt-0.5">₹{formatMoney(lead.monthlyIncome)}/mo</p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-200">
                      {lead.requestedAmount ? `₹${formatMoney(lead.requestedAmount)}` : 'Flexible'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold",
                        lead.source === 'DIGITAL' ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" :
                        lead.source === 'BRANCH' ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" :
                        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      )}>
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                        lead.status === 'NEW' ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" :
                        lead.status === 'QUALIFIED' ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" :
                        lead.status === 'CONVERTED' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" :
                        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      )}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {lead.status === 'CONVERTED' && lead.convertedApplicationId ? (
                        <Link href={`/applications/${lead.convertedApplicationId}`}>
                          <Button size="sm" variant="outline" className="gap-1 text-[11px] font-semibold">
                            View Application →
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedLeadForConvert(lead);
                            setConvertData({
                              productId: lead.productId || (products[0]?.id || ''),
                              requestedAmount: String(lead.requestedAmount || 200000),
                              tenureMonths: '24',
                              purpose: `Converted from Lead ${lead.leadCode}`,
                            });
                            setConvertModalOpen(true);
                          }}
                          className="gap-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Convert to Application
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {leads.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>
                Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{leads.length}</span> of{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{pagination.total}</span> leads
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <div className="flex items-center gap-1.5">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="font-medium text-slate-700 dark:text-slate-300 px-1">
                Page {page} of {pagination.totalPages || 1}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
                disabled={page >= (pagination.totalPages || 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Lead Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Capture New Origination Lead</h3>
                <p className="text-xs text-slate-400">Record prospective borrower details for sourcing pipeline.</p>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">First Name *</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Rahul"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Last Name *</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Sharma"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">10-Digit Mobile *</label>
                <Input
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email (Optional)</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="prospect@example.com"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Customer / Employment Type</label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2"
                >
                  <option value="SALARIED">Salaried Employee</option>
                  <option value="SELF_EMPLOYED">Self-Employed / Business</option>
                  <option value="STUDENT">Student</option>
                  <option value="PROFESSIONAL">Independent Professional</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Monthly Income (₹)</label>
                <Input
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                  placeholder="e.g. 65000"
                  type="number"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Requested Loan Amount (₹)</label>
                <Input
                  value={formData.requestedAmount}
                  onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
                  placeholder="e.g. 500000"
                  type="number"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Sourcing Channel</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2"
                >
                  <option value="BRANCH">Branch Walk-In / Assisted</option>
                  <option value="DIGITAL">Digital Website Lead</option>
                  <option value="REFERRAL">Customer Referral</option>
                  <option value="DIRECT">Direct Sourcing</option>
                  <option value="PARTNER">DSA / Partner Referral</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Employer / Institution Name</label>
                <Input
                  value={formData.employerName}
                  onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                  placeholder="Company or College name"
                />
              </div>
              <div className="col-span-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Follow-Up Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Notes from initial customer interaction..."
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button size="sm" variant="ghost" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createLeadMutation.mutate()}
                disabled={!formData.firstName || !formData.lastName || !formData.mobile || createLeadMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
              >
                {createLeadMutation.isPending ? <Spinner size="sm" /> : 'Save Lead'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Lead Modal */}
      {convertModalOpen && selectedLeadForConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Convert Lead to Loan Application</h3>
                <p className="text-xs text-slate-400">Prospect: {selectedLeadForConvert.firstName} {selectedLeadForConvert.lastName} ({selectedLeadForConvert.mobile})</p>
              </div>
              <button onClick={() => setConvertModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Target Loan Product *</label>
                <select
                  value={convertData.productId}
                  onChange={(e) => setConvertData({ ...convertData, productId: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200"
                >
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) — {p.interestRate}% p.a.
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Requested Loan Amount (₹) *</label>
                <Input
                  value={convertData.requestedAmount}
                  onChange={(e) => setConvertData({ ...convertData, requestedAmount: e.target.value })}
                  type="number"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Tenure (Months) *</label>
                <Input
                  value={convertData.tenureMonths}
                  onChange={(e) => setConvertData({ ...convertData, tenureMonths: e.target.value })}
                  type="number"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Loan Purpose / Remarks</label>
                <Input
                  value={convertData.purpose}
                  onChange={(e) => setConvertData({ ...convertData, purpose: e.target.value })}
                  placeholder="e.g. Higher education, business expansion"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button size="sm" variant="ghost" onClick={() => setConvertModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => convertLeadMutation.mutate()}
                disabled={convertLeadMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
              >
                {convertLeadMutation.isPending ? <Spinner size="sm" /> : 'Convert & Create Application'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
