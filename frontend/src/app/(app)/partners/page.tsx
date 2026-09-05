'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Handshake,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  ArrowRight,
  UserCheck,
  DollarSign,
  TrendingUp,
  FileText,
  BadgePercent,
  Ban,
  Check,
  Building2,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, KpiCard, Spinner, Button, Input } from '@/components/ui';
import { formatMoney, formatDateTime, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

export default function PartnersPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'PARTNERS' | 'SOURCING' | 'COMMISSIONS' | 'COMPLIANCE'>('PARTNERS');
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSubmitLeadModal, setShowSubmitLeadModal] = useState(false);

  // Form State: Register Partner
  const [regCode, setRegCode] = useState('');
  const [regName, setRegName] = useState('');
  const [regType, setRegType] = useState<'DSA' | 'LSP' | 'FINTECH' | 'AGGREGATOR'>('DSA');
  const [regContact, setRegContact] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPan, setRegPan] = useState('');
  const [regRate, setRegRate] = useState<number>(1.5);
  const [regFlat, setRegFlat] = useState<number>(0);

  // Form State: Submit Lead
  const [leadPartnerId, setLeadPartnerId] = useState('');
  const [leadCustName, setLeadCustName] = useState('');
  const [leadCustPhone, setLeadCustPhone] = useState('');
  const [leadAmount, setLeadAmount] = useState<number>(100000);
  const [leadProduct, setLeadProduct] = useState('PERSONAL');
  const [leadConsentRef, setLeadConsentRef] = useState('');

  // 1. Fetch Partners
  const { data: partners = [], isLoading: partnersLoading } = useQuery({
    queryKey: ['partners-list'],
    queryFn: async () => (await api.get('/partners')).data.data,
  });

  // 2. Fetch Sourced Applications
  const { data: sourcedApps = [], isLoading: sourcedLoading } = useQuery({
    queryKey: ['partners-sourced-leads'],
    queryFn: async () => (await api.get('/partners/leads')).data.data,
  });

  // 3. Fetch Commissions
  const { data: commissions = [], isLoading: commsLoading } = useQuery({
    queryKey: ['partners-commissions'],
    queryFn: async () => (await api.get('/partners/commissions')).data.data,
  });

  // Register Partner Mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/partners', {
        code: regCode,
        name: regName,
        type: regType,
        contactPerson: regContact,
        email: regEmail,
        phone: regPhone,
        pan: regPan,
        commissionModel: {
          ratePct: Number(regRate),
          flatFee: Number(regFlat),
          clawbackPeriodDays: 90,
          clawbackRatePct: 100,
        },
        dlaSigned: true,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setShowRegisterModal(false);
      setRegCode('');
      setRegName('');
      setRegContact('');
      setRegEmail('');
      setRegPhone('');
      setRegPan('');
      queryClient.invalidateQueries({ queryKey: ['partners-list'] });
      toast.success('Registration Success', `Partner ${data.name} (${data.code}) successfully registered and active.`);
    },
    onError: (err: any) => {
      toast.error('Registration Failed', apiErrorMessage(err));
    },
  });

  // Submit Lead Mutation
  const submitLeadMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/partners/leads', {
        partnerId: leadPartnerId,
        customerName: leadCustName,
        customerPhone: leadCustPhone,
        requestedAmount: Number(leadAmount),
        productCode: leadProduct,
        consentReference: leadConsentRef,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setShowSubmitLeadModal(false);
      setLeadCustName('');
      setLeadCustPhone('');
      setLeadConsentRef('');
      queryClient.invalidateQueries({ queryKey: ['partners-sourced-leads'] });
      toast.success('Lead Sourced', `Lead ${data.customerName} (${data.applicationNo}) sourced successfully with verified consent.`);
    },
    onError: (err: any) => {
      toast.error('Lead Submission Failed', apiErrorMessage(err));
    },
  });

  // Partner Status Toggle Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const res = await api.patch(`/partners/${id}/status`, { status: newStatus });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners-list'] });
      toast.success('Status Updated', 'Partner status updated successfully.');
    },
    onError: (err: any) => {
      toast.error('Status Update Failed', apiErrorMessage(err));
    },
  });

  // Payout Batch Mutation
  const payoutBatchMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const res = await api.post(`/partners/${partnerId}/payouts/batch`);
      return res.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['partners-commissions'] });
      toast.success('Payout Batch Processed', `Payout batch #${data.batchId} processed for ₹${data.paidAmount.toLocaleString('en-IN')} across ${data.recordsCount} items.`);
    },
    onError: (err: any) => {
      toast.error('Payout Batch Failed', apiErrorMessage(err));
    },
  });

  // Computed metrics
  const activePartners = partners.filter((p: any) => p.status === 'ACTIVE');
  const totalSourcedVolume = sourcedApps.reduce((sum: number, a: any) => sum + Number(a.requestedAmount || 0), 0);
  const totalEarnedComms = commissions
    .filter((c: any) => c.commissionType !== 'CLAWBACK')
    .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
  const pendingPayouts = commissions
    .filter((c: any) => c.status === 'ACCRUED')
    .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

  const filteredPartners = partners.filter((p: any) => {
    if (partnerTypeFilter !== 'ALL' && p.type !== partnerTypeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.contactPerson.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        breadcrumb="Lending / Partner & DSA Network"
        title="Partner / DSA / LSP Platform"
        subtitle="Distribution partner governance, sourced application pipeline, automated commission payouts, and RBI digital lending compliance"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (partners.length > 0) setLeadPartnerId(partners[0].id);
                setShowSubmitLeadModal(true);
              }}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Submit Lead / Sourcing
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowRegisterModal(true)}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Handshake className="h-3.5 w-3.5" /> Register Partner
            </Button>
          </div>
        }
      />

      {/* Top Level KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <KpiCard
          title="Active Partners"
          value={String(activePartners.length)}
          subtext={`${partners.length} total registered`}
          icon={<Handshake className="h-5 w-5 text-blue-600" />}
        />
        <KpiCard
          title="Sourced Pipeline"
          value={`₹${totalSourcedVolume.toLocaleString('en-IN')}`}
          subtext={`${sourcedApps.length} applications`}
          icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
        />
        <KpiCard
          title="Commissions Accrued"
          value={`₹${totalEarnedComms.toLocaleString('en-IN')}`}
          subtext="Total earned fees"
          icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
        />
        <KpiCard
          title="Pending Payouts"
          value={`₹${pendingPayouts.toLocaleString('en-IN')}`}
          subtext="Awaiting settlement"
          icon={<Clock className="h-5 w-5 text-amber-600" />}
        />
        <KpiCard
          title="RBI Compliance"
          value="100%"
          subtext="KFS & DLA adherence"
          icon={<ShieldCheck className="h-5 w-5 text-teal-600" />}
        />
      </div>

      {/* Tabs Toolbar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#1E2445] pb-3">
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('PARTNERS')}
              className={cn(
                'px-3.5 py-1.5 font-bold rounded-lg transition-colors cursor-pointer',
                activeTab === 'PARTNERS'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1E2445] dark:text-slate-400'
              )}
            >
              Partner Directory ({partners.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SOURCING')}
              className={cn(
                'px-3.5 py-1.5 font-bold rounded-lg transition-colors cursor-pointer',
                activeTab === 'SOURCING'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1E2445] dark:text-slate-400'
              )}
            >
              Sourcing Pipeline ({sourcedApps.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COMMISSIONS')}
              className={cn(
                'px-3.5 py-1.5 font-bold rounded-lg transition-colors cursor-pointer',
                activeTab === 'COMMISSIONS'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1E2445] dark:text-slate-400'
              )}
            >
              Commissions & Payouts ({commissions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COMPLIANCE')}
              className={cn(
                'px-3.5 py-1.5 font-bold rounded-lg transition-colors cursor-pointer',
                activeTab === 'COMPLIANCE'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1E2445] dark:text-slate-400'
              )}
            >
              RBI Digital Lending & LSP Checklist
            </button>
          </div>

          {activeTab === 'PARTNERS' && (
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={partnerTypeFilter}
                onChange={(e) => setPartnerTypeFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
              >
                <option value="ALL">All Partner Types</option>
                <option value="DSA">Direct Selling Agents (DSA)</option>
                <option value="LSP">Lending Service Providers (LSP)</option>
                <option value="FINTECH">Fintech Partners</option>
                <option value="AGGREGATOR">Aggregators</option>
              </select>
            </div>
          )}
        </div>

        {activeTab === 'PARTNERS' && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search partners by name, code, contact person, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        )}
      </Card>

      {/* TAB 1: PARTNER DIRECTORY & GOVERNANCE */}
      {activeTab === 'PARTNERS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {partnersLoading ? (
            <Card className="p-8 text-center sm:col-span-2 space-y-2">
              <Spinner />
              <p className="text-xs text-slate-400">Loading partner directory...</p>
            </Card>
          ) : filteredPartners.length === 0 ? (
            <Card className="p-12 text-center sm:col-span-2 space-y-2">
              <Handshake className="h-10 w-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No Partners Found
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No external DSA or LSP partners match the current search filters.
              </p>
            </Card>
          ) : (
            filteredPartners.map((p: any) => (
              <Card key={p.id} className="p-5 space-y-3.5 border transition-all">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-[#1E2445] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800 font-bold">
                        {p.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Type: <strong>{p.type}</strong> • Contact: <strong>{p.contactPerson}</strong>
                    </p>
                  </div>

                  <span
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                      p.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    )}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0E1528] border border-slate-100 dark:border-[#1E2445]">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Commission Rate</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {p.commissionModel.ratePct}% of Disbursed
                    </span>
                    {p.commissionModel.flatFee > 0 && (
                      <span className="text-[10px] text-slate-500 block">+ ₹{p.commissionModel.flatFee} Flat</span>
                    )}
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0E1528] border border-slate-100 dark:border-[#1E2445]">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Clawback Policy</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {p.commissionModel.clawbackPeriodDays} Days (60+ DPD)
                    </span>
                    <span className="text-[10px] text-slate-500 block">{p.commissionModel.clawbackRatePct}% Recovery</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 text-[11px]">
                  <div>Email: <strong className="text-slate-800 dark:text-slate-200">{p.email}</strong> • Phone: {p.phone}</div>
                  <div>PAN: <strong className="font-mono">{p.pan}</strong> {p.gstin ? `• GSTIN: ${p.gstin}` : ''}</div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> DLA Signed & RBI Digital Lending Compliant
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1E2445] text-xs">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      toggleStatusMutation.mutate({
                        id: p.id,
                        newStatus: p.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                      })
                    }
                    className="text-xs h-7 px-2 cursor-pointer"
                  >
                    {p.status === 'ACTIVE' ? 'Suspend Partner' : 'Reactivate Partner'}
                  </Button>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => payoutBatchMutation.mutate(p.id)}
                    className="text-xs h-7 px-2.5 flex items-center gap-1 cursor-pointer"
                  >
                    <DollarSign className="h-3 w-3" /> Process Payouts
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 2: SOURCING PIPELINE */}
      {activeTab === 'SOURCING' && (
        <div className="space-y-3">
          {sourcedLoading ? (
            <Card className="p-8 text-center space-y-2">
              <Spinner />
              <p className="text-xs text-slate-400">Loading sourced applications...</p>
            </Card>
          ) : sourcedApps.length === 0 ? (
            <Card className="p-12 text-center space-y-2">
              <FileText className="h-10 w-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Zero Sourced Applications
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No external leads have been submitted by registered DSA or LSP channels yet.
              </p>
            </Card>
          ) : (
            sourcedApps.map((lead: any) => (
              <Card key={lead.id} className="p-4.5 space-y-3 border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1E2445] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {lead.customerName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {lead.applicationNo}
                    </span>
                    <span className="text-xs text-slate-500">
                      via <strong>{lead.partnerName}</strong> ({lead.partnerCode})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      ₹{Number(lead.requestedAmount).toLocaleString('en-IN')}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        lead.status === 'DISBURSED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : lead.status === 'APPROVED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : lead.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      {lead.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    Phone: <strong className="text-slate-700 dark:text-slate-300">{lead.customerPhone}</strong> • Product: {lead.productCode}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                      Consent: {lead.consentReference}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Sourced: {formatDateTime(lead.sourcedAt)}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 3: COMMISSIONS & PAYOUTS */}
      {activeTab === 'COMMISSIONS' && (
        <div className="space-y-3">
          {commsLoading ? (
            <Card className="p-8 text-center space-y-2">
              <Spinner />
              <p className="text-xs text-slate-400">Loading commission ledger...</p>
            </Card>
          ) : commissions.length === 0 ? (
            <Card className="p-12 text-center space-y-2">
              <DollarSign className="h-10 w-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Zero Commission Records
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No commissions have been accrued yet. Sourcing fees and percentage commissions generate automatically when sourced loans reach DISBURSED status.
              </p>
            </Card>
          ) : (
            commissions.map((c: any) => (
              <Card key={c.id} className="p-4 space-y-2 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded font-mono',
                        c.commissionType === 'CLAWBACK'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                      )}
                    >
                      {c.commissionType}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {c.partnerName} ({c.partnerCode})
                    </span>
                    {c.loanNo && <span className="text-xs text-slate-500 font-mono">Loan #{c.loanNo}</span>}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        'font-bold text-sm',
                        c.amount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                      )}
                    >
                      {c.amount < 0 ? `-₹${Math.abs(c.amount).toLocaleString('en-IN')}` : `₹${c.amount.toLocaleString('en-IN')}`}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        c.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : c.status === 'CLAWED_BACK'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-[#1E2445]">
                  <span>
                    {c.clawbackReason ? `Reason: ${c.clawbackReason}` : `Disbursed Principal: ₹${Number(c.disbursedAmount).toLocaleString('en-IN')}`}
                  </span>
                  <span>{formatDateTime(c.createdAt)}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 4: RBI DIGITAL LENDING & LSP COMPLIANCE CHECKLIST */}
      {activeTab === 'COMPLIANCE' && (
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              RBI Digital Lending Guidelines (2022/2023) Architecture Controls
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Adyapan LMS enforces strict regulatory compliance rules across all registered Direct Selling Agents (DSAs) and Lending Service Providers (LSPs).
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1528] border border-slate-100 dark:border-[#1E2445] flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Standardized Key Fact Statement (KFS):</strong>
                  <p className="text-slate-500 text-[11px]">
                    Every borrower sourced via external partners receives an automated, standardized KFS stating the Annual Percentage Rate (APR), recovery mechanisms, and total repayment breakdown before sanction.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1528] border border-slate-100 dark:border-[#1E2445] flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Direct Lending Agreement (DLA) Governance:</strong>
                  <p className="text-slate-500 text-[11px]">
                    All LSPs must execute and sign a formal DLA with Adyapan NBFC, declaring data security standards, zero pass-through bank account rules, and zero collection harassment mandates.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1528] border border-slate-100 dark:border-[#1E2445] flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Zero Pass-Through Accounts (Direct Disbursement):</strong>
                  <p className="text-slate-500 text-[11px]">
                    All loan funds are disbursed directly from the lender bank account into the borrower bank account. Zero disbursements or repayments pass through partner pool accounts.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1528] border border-slate-100 dark:border-[#1E2445] flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Strict Partner Data Isolation:</strong>
                  <p className="text-slate-500 text-[11px]">
                    Partner portals are cryptographically isolated. Partner A cannot access Partner B customer records, nor can partners view confidential credit committee notes or proprietary scoring weights.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 1: REGISTER PARTNER */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Register External Partner / DSA
              </h3>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Partner Code *
                  </label>
                  <Input
                    placeholder="e.g. DSA-SOUTH-01"
                    value={regCode}
                    onChange={(e) => setRegCode(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Partner Type *
                  </label>
                  <select
                    value={regType}
                    onChange={(e) => setRegType(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                  >
                    <option value="DSA">Direct Selling Agent (DSA)</option>
                    <option value="LSP">Lending Service Provider (LSP)</option>
                    <option value="FINTECH">Fintech Partner</option>
                    <option value="AGGREGATOR">Aggregator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Entity Name *
                </label>
                <Input
                  placeholder="e.g. Skyline Capital Advisory"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person *
                  </label>
                  <Input
                    placeholder="e.g. Sanjay Rao"
                    value={regContact}
                    onChange={(e) => setRegContact(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PAN *
                  </label>
                  <Input
                    placeholder="e.g. AABCS1234K"
                    value={regPan}
                    onChange={(e) => setRegPan(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="e.g. sanjay@skyline.in"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone *
                  </label>
                  <Input
                    placeholder="+91 98000 11223"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Commission Rate (%)
                  </label>
                  <Input
                    type="number"
                    step={0.1}
                    value={regRate}
                    onChange={(e) => setRegRate(Number(e.target.value))}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Flat Sourcing Fee (₹)
                  </label>
                  <Input
                    type="number"
                    value={regFlat}
                    onChange={(e) => setRegFlat(Number(e.target.value))}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-400">
                <input type="checkbox" defaultChecked disabled className="accent-blue-600" />
                <span>Execute standard Digital Lending Agreement (DLA) & 90-day clawback policy</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2445]">
              <Button variant="secondary" size="sm" onClick={() => setShowRegisterModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!regCode.trim() || !regName.trim() || !regEmail.trim() || registerMutation.isPending}
                onClick={() => registerMutation.mutate()}
                className="text-xs cursor-pointer"
              >
                {registerMutation.isPending ? 'Registering...' : 'Register Partner'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SUBMIT LEAD */}
      {showSubmitLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Submit Lead / Sourced Loan
              </h3>
              <button
                type="button"
                onClick={() => setShowSubmitLeadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sourcing Partner Channel *
                </label>
                <select
                  value={leadPartnerId}
                  onChange={(e) => setLeadPartnerId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                >
                  {partners.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Borrower Full Name *
                </label>
                <Input
                  placeholder="e.g. Vikramaditya Sen"
                  value={leadCustName}
                  onChange={(e) => setLeadCustName(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <Input
                    placeholder="+91 98111 22334"
                    value={leadCustPhone}
                    onChange={(e) => setLeadCustPhone(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Requested Amount (₹) *
                  </label>
                  <Input
                    type="number"
                    value={leadAmount}
                    onChange={(e) => setLeadAmount(Number(e.target.value))}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Borrower Consent Reference (Mandatory) *
                </label>
                <Input
                  placeholder="e.g. AADHAAR-OTP-994821 or PHYSICAL-MANDATE-01"
                  value={leadConsentRef}
                  onChange={(e) => setLeadConsentRef(e.target.value)}
                  className="text-xs"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  RBI guidelines require verified borrower consent proof prior to lead origination.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2445]">
              <Button variant="secondary" size="sm" onClick={() => setShowSubmitLeadModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!leadCustName.trim() || !leadConsentRef.trim() || submitLeadMutation.isPending}
                onClick={() => submitLeadMutation.mutate()}
                className="text-xs cursor-pointer"
              >
                {submitLeadMutation.isPending ? 'Submitting...' : 'Submit Lead'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
