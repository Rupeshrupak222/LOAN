'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  MessageSquare,
  Phone,
  Bell,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Send,
  Eye,
  Lock,
  FileText,
  UserCheck,
  Ban,
  Activity,
  ChevronRight,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
  RotateCcw,
  Sliders,
  Check,
  X,
  Building,
  User,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, KpiCard, Spinner, Button, Input } from '@/components/ui';
import { formatDateTime, formatDate, formatMoney, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { useTheme } from '@/lib/theme';

export default function CommunicationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<
    'DASHBOARD' | 'SEND' | 'HISTORY' | 'TEMPLATES' | 'MONITORING' | 'PREFERENCES' | 'PROVIDERS'
  >('DASHBOARD');

  // History & Filters
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  // Selected Log Detail Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Send Communication Form State
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<'WHATSAPP' | 'SMS' | 'EMAIL' | 'IN_APP'>('WHATSAPP');
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>('UPCOMING_EMI_REMINDER');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('ALL');
  const [recipient, setRecipient] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [loanNo, setLoanNo] = useState('');
  const [amount, setAmount] = useState('16607');
  const [rawBankAccount, setRawBankAccount] = useState('987654321098');
  const [dueDate, setDueDate] = useState('10-Oct-2026');
  const [dpd, setDpd] = useState('15');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [previewData, setPreviewData] = useState<any | null>(null);

  // Customer Preferences State
  const [prefCustomerSearch, setPrefCustomerSearch] = useState('');
  const [prefCustomer, setPrefCustomer] = useState<any | null>(null);
  const [prefWhatsapp, setPrefWhatsapp] = useState(true);
  const [prefSms, setPrefSms] = useState(true);
  const [prefEmail, setPrefEmail] = useState(true);
  const [prefDnd, setPrefDnd] = useState(false);
  const [prefMarketing, setPrefMarketing] = useState(false);

  // 1. Fetch Dashboard Metrics
  const { data: dashboardMetrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['communications-dashboard'],
    queryFn: async () => (await api.get('/communications/dashboard')).data.data,
  });

  // 2. Fetch Templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['communications-templates'],
    queryFn: async () => (await api.get('/communications/templates')).data.data,
  });

  // 3. Fetch Provider Health
  const { data: providerHealth = [], isLoading: providersLoading, refetch: refetchProviders } = useQuery({
    queryKey: ['communications-providers'],
    queryFn: async () => (await api.get('/communications/providers')).data.data,
  });

  // 4. Fetch Logs with Pagination & Filters
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['communications-logs', channelFilter, statusFilter, categoryFilter, searchQuery, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (channelFilter !== 'ALL') params.set('channel', channelFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      const res = await api.get(`/communications/logs?${params.toString()}`);
      return res.data?.data || { items: [], pagination: { total: 0, page: 1, pageSize: 15, totalPages: 1 } };
    },
  });

  // 5. Customer Search Query
  const { data: customerSearchResults = [] } = useQuery({
    queryKey: ['customer-search', customerSearch],
    queryFn: async () => {
      if (!customerSearch.trim() || customerSearch.trim().length < 2) return [];
      const res = await api.get('/customers', { params: { search: customerSearch.trim(), pageSize: 5 } });
      const data = res.data?.data;
      return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    },
    enabled: customerSearch.trim().length >= 2,
  });

  // 6. Preferences Customer Search Query
  const { data: prefSearchResults = [] } = useQuery({
    queryKey: ['pref-customer-search', prefCustomerSearch],
    queryFn: async () => {
      if (!prefCustomerSearch.trim() || prefCustomerSearch.trim().length < 2) return [];
      const res = await api.get('/customers', { params: { search: prefCustomerSearch.trim(), pageSize: 5 } });
      const data = res.data?.data;
      return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    },
    enabled: prefCustomerSearch.trim().length >= 2,
  });

  // Mutations
  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/communications/send', {
        templateCode: selectedTemplateCode,
        channel: selectedChannel,
        recipient,
        recipientName,
        customerId: selectedCustomer?.id,
        loanId: loanNo,
        variables: {
          customerName: recipientName || selectedCustomer?.firstName || 'Borrower',
          customerCode: selectedCustomer?.customerCode || 'CUST-101',
          loanNo: loanNo || 'LN-2609001',
          applicationNo: 'APP-2609-01',
          sanctionedAmount: amount,
          netDisbursedAmount: amount,
          paidAmount: amount,
          emiAmount: amount,
          overdueAmount: amount,
          bankAccount: rawBankAccount,
          utrNumber: `UTR-LIVE-${Date.now().toString().slice(-6)}`,
          firstDueDate: dueDate,
          dueDate: dueDate,
          dpd: dpd,
          lateCharges: '250',
          trackingUrl: 'https://adyapan.dev/customer/applications',
          paymentUrl: 'https://adyapan.dev/customer/repayments',
          uploadUrl: 'https://adyapan.dev/customer/kyc',
          portalUrl: 'https://adyapan.dev/customer/dashboard',
          missingDocuments: 'Aadhaar & PAN Card',
          documentList: 'Income Proof / Bank Statement',
          rejectionReason: 'FOIR ceiling policy limit reached',
          coolingPeriodMonths: '3',
          closureDate: '01-Sep-2026',
          nocReference: `NOC-${Date.now().toString().slice(-4)}`,
          officerName: user?.firstName || 'Rahul Verma',
          officerPhone: '+91 98000 12345',
          receiptNo: `RCP-${Date.now().toString().slice(-4)}`,
          outstandingPrincipal: '45000',
        },
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['communications-logs'] });
      queryClient.invalidateQueries({ queryKey: ['communications-dashboard'] });
      toast.success(
        'Communication Dispatched',
        `Message #${data.id} dispatched via ${data.channel} (Status: ${data.deliveryStatus}).`
      );
      setActiveTab('HISTORY');
    },
    onError: (err: any) => {
      toast.error('Dispatch Failed', apiErrorMessage(err));
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/communications/retry/${id}`);
      return res.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['communications-logs'] });
      queryClient.invalidateQueries({ queryKey: ['communications-dashboard'] });
      toast.success('Retry Dispatched', `Communication #${data.id} retried successfully.`);
    },
    onError: (err: any) => {
      toast.error('Retry Failed', apiErrorMessage(err));
    },
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/communications/preview', {
        templateCode: selectedTemplateCode,
        channel: selectedChannel,
        variables: {
          customerName: recipientName || selectedCustomer?.firstName || 'Vikramaditya Sen',
          customerCode: selectedCustomer?.customerCode || 'CUST-101',
          loanNo: loanNo || 'LN-2609001',
          applicationNo: 'APP-2609-01',
          sanctionedAmount: amount,
          netDisbursedAmount: amount,
          bankAccount: rawBankAccount,
          utrNumber: 'UTR-HDFC-998811',
          firstDueDate: dueDate,
          dueDate: dueDate,
          emiAmount: amount,
          overdueAmount: amount,
          dpd: dpd,
        },
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setPreviewData(data);
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async () => {
      if (!prefCustomer?.id) return;
      const res = await api.put(`/communications/preferences/${prefCustomer.id}`, {
        whatsappOptIn: prefWhatsapp,
        smsOptIn: prefSms,
        emailOptIn: prefEmail,
        isDndOpted: prefDnd,
        allowMarketing: prefMarketing,
      });
      return res.data?.data;
    },
    onSuccess: () => {
      toast.success('Preferences Updated', 'Customer communication consent saved.');
    },
    onError: (err: any) => {
      toast.error('Update Failed', apiErrorMessage(err));
    },
  });

  // Helper when selecting customer in Send tab
  const handleSelectCustomer = (c: any) => {
    setSelectedCustomer(c);
    setRecipientName(`${c.firstName || ''} ${c.lastName || ''}`.trim());
    if (selectedChannel === 'EMAIL') {
      setRecipient(c.email || '');
    } else {
      setRecipient(c.mobile || '');
    }
    if (c.loans && c.loans.length > 0) {
      setLoanNo(c.loans[0].loanNo || '');
      setAmount(String(c.loans[0].emiAmount || c.loans[0].principal || '16607'));
    }
    setCustomerSearch('');
  };

  // Channel Provider Map
  const providerMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const p of providerHealth) {
      map[p.channel] = p;
    }
    return map;
  }, [providerHealth]);

  const isChannelConnected = (ch: string) => {
    if (ch === 'IN_APP') return true;
    return providerMap[ch]?.isConfigured ?? false;
  };

  const getChannelIcon = (ch: string, className = 'h-4 w-4') => {
    switch (ch) {
      case 'WHATSAPP':
        return <MessageSquare className={cn(className, 'text-emerald-500')} />;
      case 'SMS':
        return <Phone className={cn(className, 'text-sky-500')} />;
      case 'EMAIL':
        return <Mail className={cn(className, 'text-blue-500')} />;
      default:
        return <Bell className={cn(className, 'text-purple-500')} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'READ':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40';
      case 'SENT':
      case 'MOCKED':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40';
      case 'PENDING':
      case 'QUEUED':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40';
      case 'BLOCKED_WINDOW':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40';
      case 'BLOCKED_DND':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40';
    }
  };

  const filteredTemplates = useMemo(() => {
    if (templateCategoryFilter === 'ALL') return templates;
    return templates.filter((t: any) => t.category === templateCategoryFilter);
  }, [templates, templateCategoryFilter]);

  const failedOrPendingLogs = useMemo(() => {
    const items = logsData?.items || [];
    return items.filter((l: any) => ['FAILED', 'BLOCKED_WINDOW', 'BLOCKED_DND', 'PENDING', 'QUEUED'].includes(l.deliveryStatus));
  }, [logsData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        breadcrumb="Servicing / Communications Hub"
        title="Omnichannel Customer Communication Center"
        subtitle="Centralized communication hub for WhatsApp, SMS, Email, and In-App delivery with automated PII masking, RBI collection windows, and audit logging"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                refetchMetrics();
                refetchLogs();
                refetchProviders();
              }}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('SEND')}
              className="text-xs flex items-center gap-1.5 cursor-pointer bg-[#2563EB] hover:bg-blue-700 text-white"
            >
              <Send className="h-3.5 w-3.5" /> Send Communication
            </Button>
          </div>
        }
      />

      {/* 7-Tab Internal Navigation Bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-[#1E2445] pb-2 text-xs font-bold scrollbar-thin">
        {[
          { id: 'DASHBOARD', label: 'Dashboard Overview', icon: Activity },
          { id: 'SEND', label: 'Send Communication', icon: Send },
          { id: 'HISTORY', label: `Communication History (${logsData?.pagination?.total ?? 0})`, icon: FileText },
          { id: 'TEMPLATES', label: `Templates Library (${templates.length})`, icon: Layers },
          { id: 'MONITORING', label: `Delivery Monitoring (${dashboardMetrics?.totalFailed ?? 0})`, icon: AlertTriangle },
          { id: 'PREFERENCES', label: 'Consent & Preferences', icon: ShieldCheck },
          { id: 'PROVIDERS', label: 'Provider Health', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap',
                active
                  ? 'bg-[#2563EB] text-white shadow-sm font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-[#1E2445]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB A: COMMUNICATION DASHBOARD                                            */}
      {/* ========================================================================= */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <KpiCard
              label="TOTAL MESSAGES"
              value={String(dashboardMetrics?.totalMessages ?? 0)}
              hint="All logged dispatches"
              icon={<Send className="h-4 w-4 text-blue-500" />}
            />
            <KpiCard
              label="DELIVERED / SENT"
              value={String((dashboardMetrics?.totalSent ?? 0) + (dashboardMetrics?.totalDelivered ?? 0))}
              hint={`${dashboardMetrics?.deliveryRatePercent ?? 100}% delivery rate`}
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            />
            <KpiCard
              label="PENDING / QUEUED"
              value={String(dashboardMetrics?.totalPending ?? 0)}
              hint="Awaiting network release"
              icon={<Clock className="h-4 w-4 text-amber-500" />}
            />
            <KpiCard
              label="FAILED / BLOCKED"
              value={String(dashboardMetrics?.totalFailed ?? 0)}
              hint="Review delivery issues"
              icon={<AlertTriangle className="h-4 w-4 text-rose-500" />}
            />
            <KpiCard
              label="READ / ACKNOWLEDGED"
              value={String(dashboardMetrics?.totalRead ?? 0)}
              hint="Customer opened"
              icon={<Eye className="h-4 w-4 text-purple-500" />}
            />
            <KpiCard
              label="RBI COLLECTION WINDOW"
              value={dashboardMetrics?.collectionWindowActive ? 'ACTIVE' : 'CLOSED'}
              hint="8:00 AM – 7:00 PM IST"
              icon={<Clock className="h-4 w-4 text-amber-500" />}
            />
          </div>

          {/* Multi-Channel Distribution & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Channel Breakdown */}
            <div className={cn("p-5 rounded-2xl border space-y-4", isDark ? "bg-[#171B36] border-[#2B3566]" : "bg-white border-slate-200")}>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-500" />
                Active Channel Distribution
              </h3>
              <p className="text-xs text-slate-400">Live breakdown across communication networks</p>

              <div className="space-y-3 pt-2 text-xs">
                {[
                  { key: 'WHATSAPP', name: 'WhatsApp Business Cloud', count: dashboardMetrics?.byChannel?.WHATSAPP ?? 0, icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-500' },
                  { key: 'SMS', name: 'SMS Gateway / Twilio', count: dashboardMetrics?.byChannel?.SMS ?? 0, icon: Phone, color: 'text-sky-500', bg: 'bg-sky-500' },
                  { key: 'EMAIL', name: 'Email (SendGrid / SMTP)', count: dashboardMetrics?.byChannel?.EMAIL ?? 0, icon: Mail, color: 'text-blue-500', bg: 'bg-blue-500' },
                  { key: 'IN_APP', name: 'In-App Notification Ledger', count: dashboardMetrics?.byChannel?.IN_APP ?? 0, icon: Bell, color: 'text-purple-500', bg: 'bg-purple-500' },
                ].map((ch) => {
                  const Icon = ch.icon;
                  const total = dashboardMetrics?.totalMessages || 1;
                  const pct = Math.round(((ch.count || 0) / total) * 100);
                  const connected = isChannelConnected(ch.key);

                  return (
                    <div key={ch.key} className="space-y-1.5 p-2.5 rounded-xl border border-slate-100 dark:border-[#2B3566]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", ch.color)} />
                          <span className="font-semibold">{ch.name}</span>
                        </div>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", connected ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400")}>
                          {connected ? 'Connected' : 'Not Configured'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>{ch.count} messages sent</span>
                        <span className="font-bold font-mono">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <Button size="sm" variant="secondary" onClick={() => setActiveTab('PROVIDERS')} className="w-full text-xs">
                  Inspect Provider Configurations →
                </Button>
              </div>
            </div>

            {/* Recent Activity Stream */}
            <div className={cn("lg:col-span-2 p-5 rounded-2xl border space-y-4", isDark ? "bg-[#171B36] border-[#2B3566]" : "bg-white border-slate-200")}>
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#2B3566]">
                <div>
                  <h3 className="text-sm font-bold">Recent Communications Activity</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Chronological stream of dispatched notices</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('HISTORY')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  View All History →
                </button>
              </div>

              {dashboardMetrics?.recentActivity?.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No communication notices logged yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dashboardMetrics?.recentActivity?.map((act: any) => (
                    <div
                      key={act.id}
                      onClick={() => setSelectedLog(act)}
                      className="p-3 rounded-xl border border-slate-100 dark:border-[#2B3566] hover:bg-slate-50/60 dark:hover:bg-[#1E2445]/60 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                          {getChannelIcon(act.channel)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{act.subject}</p>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            To: {act.recipient} {act.recipientName ? `(${act.recipientName})` : ''} • Template: {act.templateCode}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border", getStatusBadge(act.deliveryStatus))}>
                          {act.deliveryStatus}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDateTime(act.sentAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB B: SEND COMMUNICATION                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'SEND' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Customer & Channel & Template Configuration */}
          <div className={cn("lg:col-span-7 p-6 rounded-2xl border space-y-5", isDark ? "bg-[#171B36] border-[#2B3566]" : "bg-white border-slate-200")}>
            <div>
              <h3 className="text-base font-bold">Compose & Dispatch Customer Notice</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Select customer, choose verified channel, and preview rendered notice before sending
              </p>
            </div>

            {/* 1. Customer Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                1. Select Recipient Customer (Tenant & Branch Scoped) *
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search customer by name, code (CUST-..), mobile, or email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              {/* Customer search dropdown results */}
              {customerSearchResults.length > 0 && (
                <div className={cn("rounded-xl border shadow-lg max-h-48 overflow-y-auto p-1 text-xs space-y-0.5", isDark ? "bg-[#1E2445] border-[#2B3566]" : "bg-white border-slate-200")}>
                  {customerSearchResults.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold">{c.firstName} {c.lastName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{c.customerCode} • {c.mobile} • {c.email}</p>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Select →</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Customer Context Card */}
              {selectedCustomer && (
                <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {selectedCustomer.firstName} {selectedCustomer.lastName} ({selectedCustomer.customerCode})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                    <div>Mobile: <strong className="font-mono">{selectedCustomer.mobile || 'On record'}</strong></div>
                    <div>Email: <strong className="font-mono">{selectedCustomer.email || 'On record'}</strong></div>
                    <div>KYC Status: <Badge status={selectedCustomer.kycStatus || 'PENDING'} /></div>
                    <div>Branch: <strong>{selectedCustomer.branchName || 'Main Branch'}</strong></div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Channel Selection Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                2. Select Transmission Channel *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { key: 'WHATSAPP', name: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-500' },
                  { key: 'SMS', name: 'SMS Gateway', icon: Phone, color: 'text-sky-500' },
                  { key: 'EMAIL', name: 'Email (SMTP)', icon: Mail, color: 'text-blue-500' },
                  { key: 'IN_APP', name: 'In-App Alert', icon: Bell, color: 'text-purple-500' },
                ].map((ch) => {
                  const Icon = ch.icon;
                  const active = selectedChannel === ch.key;
                  const connected = isChannelConnected(ch.key);

                  return (
                    <button
                      key={ch.key}
                      type="button"
                      onClick={() => {
                        setSelectedChannel(ch.key as any);
                        if (selectedCustomer) {
                          if (ch.key === 'EMAIL') {
                            setRecipient(selectedCustomer.email || '');
                          } else {
                            setRecipient(selectedCustomer.mobile || '');
                          }
                        }
                      }}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1',
                        active
                          ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/50 ring-2 ring-[#2563EB]/20'
                          : isDark
                          ? 'border-[#2B3566] bg-[#1E2445] hover:bg-[#2B3566]'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={cn('h-4 w-4', ch.color)} />
                        {active && <Check className="h-3.5 w-3.5 text-blue-600" />}
                      </div>
                      <p className="font-bold text-xs leading-tight mt-1">{ch.name}</p>
                      <span className={cn("text-[9px] font-bold block", connected ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                        {connected ? '● Ready' : '● Mock Mode'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Template Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                3. Choose Standardized Lifecycle Template *
              </label>
              <select
                value={selectedTemplateCode}
                onChange={(e) => {
                  setSelectedTemplateCode(e.target.value);
                  setPreviewData(null);
                }}
                className={cn(
                  "w-full h-9 rounded-xl border px-3 text-xs font-semibold focus:border-[#2563EB] focus:outline-none",
                  isDark ? "border-[#2B3566] bg-[#1E2445] text-slate-200" : "border-slate-200 bg-white text-slate-700"
                )}
              >
                {templates.map((t: any) => (
                  <option key={t.code} value={t.code}>
                    [{t.category}] {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Dynamic Variables & Recipient Inputs */}
            <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-[#2B3566]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Recipient Address / Mobile *
                  </label>
                  <Input
                    placeholder={selectedChannel === 'EMAIL' ? 'borrower@adyapan.dev' : '+91 98200 12345'}
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Recipient Name</label>
                  <Input
                    placeholder="Vikramaditya Sen"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Loan / App Number</label>
                  <Input placeholder="LN-2609001" value={loanNo} onChange={(e) => setLoanNo(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Amount (₹)</label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Due Date</label>
                  <Input value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Bank Account (Will Be Auto-Masked by Engine)
                </label>
                <Input
                  value={rawBankAccount}
                  onChange={(e) => setRawBankAccount(e.target.value)}
                  placeholder="987654321098"
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Engine will mask to <code>XXXX-XXXX-{rawBankAccount.slice(-4) || '1098'}</code> before dispatch.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#2B3566]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => previewMutation.mutate()}
                disabled={previewMutation.isPending}
                className="text-xs flex items-center gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" />
                {previewMutation.isPending ? 'Rendering...' : 'Preview Rendered Notice'}
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={!recipient.trim() || sendMutation.isPending}
                onClick={() => sendMutation.mutate()}
                className="text-xs flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold"
              >
                <Send className="h-3.5 w-3.5" />
                {sendMutation.isPending ? 'Dispatching Notice...' : 'Authorize & Dispatch Notice'}
              </Button>
            </div>
          </div>

          {/* Right Panel: Live PII-Masked Preview & Channel Spec */}
          <div className="lg:col-span-5 space-y-4">
            <div className={cn("p-5 rounded-2xl border space-y-4", isDark ? "bg-[#171B36] border-[#2B3566]" : "bg-white border-slate-200")}>
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#2B3566]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Live Message Preview
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                  {selectedChannel}
                </span>
              </div>

              {/* Mock Device / Envelope Rendering */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#060F1B] border border-slate-200/80 dark:border-[#2B3566] text-xs space-y-3 font-sans">
                <div className="border-b border-slate-200/60 dark:border-[#2B3566] pb-2 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Channel: <strong>{selectedChannel}</strong></span>
                    <span>To: <strong>{recipient || '+91 XXXXX XXXXX'}</strong></span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    Subject: {previewData?.subject || `Notice regarding Loan #${loanNo || 'LN-2609001'}`}
                  </p>
                </div>

                <div className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap">
                  {previewData?.body ||
                    `Dear ${recipientName || 'Customer'},\nYour EMI of ₹${amount} for Loan #${loanNo || 'LN-2609001'} is scheduled for ${dueDate}. Maintain sufficient account balance to prevent late charges.`}
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-[#2B3566] text-[10px] text-slate-400 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-emerald-500" />
                  <span>Automated PII encryption & RBI fair practice compliance verified</span>
                </div>
              </div>

              {/* Channel Availability Notice */}
              {!isChannelConnected(selectedChannel) && (
                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Provider Unconfigured Notice</span>
                  </div>
                  <p className="text-[11px]">
                    {selectedChannel} provider environment keys are not configured. Messages will be safely dispatched in simulated MOCKED test mode.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB C: COMMUNICATION HISTORY & LOGS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 max-w-sm relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search history by recipient, template, subject, loan #..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={channelFilter}
                onChange={(e) => {
                  setChannelFilter(e.target.value);
                  setPage(1);
                }}
                className={cn(
                  "h-9 rounded-xl border px-3 text-xs font-semibold focus:border-[#2563EB] focus:outline-none",
                  isDark ? "border-[#2B3566] bg-[#1E2445] text-slate-200" : "border-slate-200 bg-white text-slate-700"
                )}
              >
                <option value="ALL">All Channels</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="IN_APP">In-App</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className={cn(
                  "h-9 rounded-xl border px-3 text-xs font-semibold focus:border-[#2563EB] focus:outline-none",
                  isDark ? "border-[#2B3566] bg-[#1E2445] text-slate-200" : "border-slate-200 bg-white text-slate-700"
                )}
              >
                <option value="ALL">All Statuses</option>
                <option value="DELIVERED">Delivered</option>
                <option value="READ">Read</option>
                <option value="SENT">Sent</option>
                <option value="PENDING">Pending / Queued</option>
                <option value="BLOCKED_WINDOW">Blocked (RBI Window)</option>
                <option value="BLOCKED_DND">Blocked (DND)</option>
                <option value="FAILED">Failed</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className={cn(
                  "h-9 rounded-xl border px-3 text-xs font-semibold focus:border-[#2563EB] focus:outline-none",
                  isDark ? "border-[#2B3566] bg-[#1E2445] text-slate-200" : "border-slate-200 bg-white text-slate-700"
                )}
              >
                <option value="ALL">All Categories</option>
                <option value="TRANSACTIONAL">Transactional</option>
                <option value="COLLECTION">Collection</option>
                <option value="REGULATORY">Regulatory</option>
                <option value="MARKETING">Marketing</option>
              </select>
            </div>
          </div>

          {/* History Data Table */}
          <div className={cn("rounded-2xl border overflow-hidden", isDark ? "border-[#2B3566]" : "border-slate-200")}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={cn("border-b text-[11px] font-bold uppercase", isDark ? "border-[#2B3566] bg-[#1E2445] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600")}>
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Template & Category</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E2445]">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <Spinner />
                        <p className="text-xs text-slate-400 mt-2">Loading communication history...</p>
                      </td>
                    </tr>
                  ) : logsData?.items?.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No communication records match the search and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    logsData?.items?.map((log: any) => (
                      <tr
                        key={log.id}
                        className={cn("hover:bg-slate-50/70 dark:hover:bg-[#1E2445]/50 transition-colors", isDark ? "text-slate-200" : "text-slate-800")}
                      >
                        <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                          {formatDateTime(log.sentAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {getChannelIcon(log.channel)}
                            <span className="font-semibold text-[11px]">{log.channel}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-bold text-[11px] leading-tight">{log.templateCode}</p>
                            <span className="text-[10px] text-slate-400 font-medium">{log.category}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-mono font-semibold text-[11px] leading-tight">{log.recipient}</p>
                            {log.recipientName && (
                              <p className="text-[10px] text-slate-400">{log.recipientName}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate font-medium text-[11px]">
                          {log.subject}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", getStatusBadge(log.deliveryStatus))}>
                            {log.deliveryStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                          {log.provider}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedLog(log)}
                            className="text-xs font-semibold cursor-pointer"
                          >
                            Details →
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Toolbar */}
            <div className={cn("p-3 border-t flex items-center justify-between text-xs", isDark ? "border-[#2B3566] bg-[#171B36]" : "border-slate-200 bg-slate-50")}>
              <span className="text-slate-400">
                Showing {logsData?.items?.length || 0} of {logsData?.pagination?.total || 0} records
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="text-xs"
                >
                  Previous
                </Button>
                <span className="font-bold px-2">
                  Page {page} of {logsData?.pagination?.totalPages || 1}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page >= (logsData?.pagination?.totalPages || 1)}
                  onClick={() => setPage(page + 1)}
                  className="text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB D: TEMPLATES LIBRARY                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            {['ALL', 'TRANSACTIONAL', 'COLLECTION', 'REGULATORY', 'MARKETING'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setTemplateCategoryFilter(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer',
                  templateCategoryFilter === cat
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : isDark
                    ? 'bg-[#1E2445] text-slate-300 hover:bg-[#2B3566]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((tpl: any) => (
              <div
                key={tpl.code}
                className={cn("p-5 rounded-2xl border space-y-3 flex flex-col justify-between transition-all hover:shadow-md", isDark ? "bg-[#171B36] border-[#2B3566]" : "bg-white border-slate-200")}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold leading-tight">{tpl.name}</h4>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{tpl.code}</p>
                    </div>
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border", tpl.category === 'COLLECTION' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' : tpl.category === 'REGULATORY' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400' : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400')}>
                      {tpl.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">{tpl.description}</p>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#060F1B] border border-slate-100 dark:border-[#2B3566] text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subject Format</span>
                    <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200">{tpl.subjectTemplate}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">Supported Channels:</span>
                    <div className="flex flex-wrap gap-1">
                      {tpl.supportedChannels?.map((c: string) => (
                        <span key={c} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#2B3566] flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {tpl.requiredVariables?.length || 0} variables
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTemplateCode(tpl.code);
                      setActiveTab('SEND');
                    }}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Use in Send Notice <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB E: DELIVERY MONITORING & SAFE RETRY                                   */}
      {/* ========================================================================= */}
      {activeTab === 'MONITORING' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <KpiCard
              label="TOTAL FAILED / REJECTED"
              value={String(dashboardMetrics?.totalFailed ?? 0)}
              hint="Requires operator review"
              icon={<AlertTriangle className="h-4 w-4 text-rose-500" />}
            />
            <KpiCard
              label="PENDING / HELD IN QUEUE"
              value={String(dashboardMetrics?.totalPending ?? 0)}
              hint="Awaiting transmission"
              icon={<Clock className="h-4 w-4 text-amber-500" />}
            />
            <KpiCard
              label="BLOCKED (RBI WINDOW)"
              value={String(dashboardMetrics?.byStatus?.BLOCKED_WINDOW ?? 0)}
              hint="Held outside 8 AM – 7 PM"
              icon={<Lock className="h-4 w-4 text-blue-500" />}
            />
          </div>

          <div className={cn("p-5 rounded-2xl border space-y-4", isDark ? "bg-[#171B36] border-[#2B3566]" : "bg-white border-slate-200")}>
            <div>
              <h3 className="text-sm font-bold">Failed & Pending Communications Queue</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review transmission errors, investigate carrier rejection reasons, and execute safe idempotent retries
              </p>
            </div>

            {failedOrPendingLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                No failed or pending communication alerts at this time. All networks operational.
              </div>
            ) : (
              <div className="space-y-3">
                {failedOrPendingLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl border border-rose-100 dark:border-rose-950/40 bg-rose-50/30 dark:bg-rose-950/10 space-y-2 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100/60 dark:border-rose-900/40 pb-2">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(log.channel)}
                        <span className="font-bold">{log.subject}</span>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", getStatusBadge(log.deliveryStatus))}>
                          {log.deliveryStatus}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{formatDateTime(log.sentAt)}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        Recipient: <strong className="font-mono">{log.recipient}</strong> • Provider: <strong>{log.provider}</strong>
                        {log.retryCount ? ` • Retry count: ${log.retryCount}` : ''}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedLog(log)}
                          className="text-xs"
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={retryMutation.isPending}
                          onClick={() => retryMutation.mutate(log.id)}
                          className="text-xs flex items-center gap-1 bg-[#2563EB] text-white"
                        >
                          <RotateCcw className="h-3 w-3" /> Retry Dispatch
                        </Button>
                      </div>
                    </div>

                    {log.errorMessage && (
                      <div className="p-2 rounded bg-rose-100/60 dark:bg-rose-900/30 text-[11px] text-rose-700 dark:text-rose-300 font-mono">
                        Error Reason: {log.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB F: CUSTOMER PREFERENCES & CONSENT                                      */}
      {/* ========================================================================= */}
      {activeTab === 'PREFERENCES' && (
        <div className={cn("max-w-2xl p-6 rounded-2xl border space-y-5", isDark ? "bg-[#171B36] border-[#2B3566]" : "bg-white border-slate-200")}>
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Customer Communication Channels & Consent Governance
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage borrower opt-in channels, DND (Do-Not-Disturb) status, and marketing vs transactional permissions
            </p>
          </div>

          {/* Search Borrower */}
          <div className="space-y-2">
            <label className="block text-xs font-bold">Select Customer to Inspect Consent</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search borrower by name or code..."
                value={prefCustomerSearch}
                onChange={(e) => setPrefCustomerSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {prefSearchResults.length > 0 && (
              <div className={cn("rounded-xl border shadow-lg max-h-48 overflow-y-auto p-1 text-xs space-y-0.5", isDark ? "bg-[#1E2445] border-[#2B3566]" : "bg-white border-slate-200")}>
                {prefSearchResults.map((c: any) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setPrefCustomer(c);
                      setPrefCustomerSearch('');
                    }}
                    className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold">{c.firstName} {c.lastName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{c.customerCode}</p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600">Select →</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {prefCustomer ? (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-[#2B3566] text-xs">
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                <p className="font-bold text-blue-700 dark:text-blue-300">
                  {prefCustomer.firstName} {prefCustomer.lastName} ({prefCustomer.customerCode})
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{prefCustomer.mobile} • {prefCustomer.email}</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-[#2B3566] cursor-pointer">
                  <div>
                    <p className="font-bold">WhatsApp Channel Consent</p>
                    <p className="text-[11px] text-slate-400">Receive transactional updates via WhatsApp</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefWhatsapp}
                    onChange={(e) => setPrefWhatsapp(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-[#2B3566] cursor-pointer">
                  <div>
                    <p className="font-bold">SMS Channel Consent</p>
                    <p className="text-[11px] text-slate-400">Receive SMS notifications for EMI & disbursement</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefSms}
                    onChange={(e) => setPrefSms(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-[#2B3566] cursor-pointer">
                  <div>
                    <p className="font-bold">Email Channel Consent</p>
                    <p className="text-[11px] text-slate-400">Receive formal sanction letters & NOC certificates</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefEmail}
                    onChange={(e) => setPrefEmail(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 cursor-pointer">
                  <div>
                    <p className="font-bold text-amber-800 dark:text-amber-300">Do-Not-Disturb (DND) Registry</p>
                    <p className="text-[11px] text-slate-400">Block non-regulatory collection reminders</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefDnd}
                    onChange={(e) => setPrefDnd(e.target.checked)}
                    className="h-4 w-4 rounded text-amber-600 cursor-pointer"
                  />
                </label>
              </div>

              <div className="pt-2">
                <Button
                  size="sm"
                  disabled={updatePreferencesMutation.isPending}
                  onClick={() => updatePreferencesMutation.mutate()}
                  className="w-full bg-[#2563EB] text-white font-semibold"
                >
                  {updatePreferencesMutation.isPending ? 'Saving Preferences...' : 'Save Customer Consent Preferences'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Search and select a customer above to view or modify their communication preferences.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB G: PROVIDER / INTEGRATION HEALTH                                      */}
      {/* ========================================================================= */}
      {activeTab === 'PROVIDERS' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold">Communication Provider Integrations</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status monitoring for SMS, WhatsApp, and Email transmission gateways with secret masking
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {providerHealth.map((p: any) => {
              const connected = p.isConfigured;

              return (
                <div
                  key={p.channel}
                  className={cn("p-5 rounded-2xl border space-y-3 flex flex-col justify-between", isDark ? "bg-[#171B36] border-[#2B3566]" : "bg-white border-slate-200")}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                        {getChannelIcon(p.channel, 'h-5 w-5')}
                      </div>
                      <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border", connected ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400")}>
                        {connected ? 'CONNECTED' : 'NOT CONFIGURED'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm">{p.providerName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Channel: {p.channel}</p>
                    </div>

                    <div className="space-y-1 text-xs text-slate-500 pt-1">
                      <div className="flex justify-between">
                        <span>Failure Rate:</span>
                        <span className="font-bold font-mono">{p.failureRatePercent || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processed:</span>
                        <span className="font-mono">{p.totalProcessed || 0} notices</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Check:</span>
                        <span className="font-mono text-[10px]">{formatDateTime(p.lastHealthCheck)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[#2B3566] text-[11px] text-slate-400">
                    {connected ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> API Gateway Active
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[10px]">
                        Mock simulation fallback active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Configuration & Environment Guide Card */}
          <div className={cn("p-5 rounded-2xl border space-y-3", isDark ? "bg-[#171B36] border-[#2B3566]" : "bg-white border-slate-200")}>
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-500" />
              Gateway Environment Variables (Zero Secret Exposure)
            </h4>
            <p className="text-xs text-slate-500">
              Provider credentials are encrypted in production and never displayed in console logs or API responses.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060F1B] border border-slate-100 dark:border-[#2B3566]">
                <p className="font-bold text-slate-700 dark:text-slate-300">WhatsApp Cloud API</p>
                <code className="text-[10px] text-blue-600 block mt-1">WHATSAPP_CLOUD_API_KEY</code>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060F1B] border border-slate-100 dark:border-[#2B3566]">
                <p className="font-bold text-slate-700 dark:text-slate-300">Twilio / SMS Gateway</p>
                <code className="text-[10px] text-sky-600 block mt-1">TWILIO_AUTH_TOKEN</code>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060F1B] border border-slate-100 dark:border-[#2B3566]">
                <p className="font-bold text-slate-700 dark:text-slate-300">SendGrid / SMTP Email</p>
                <code className="text-[10px] text-emerald-600 block mt-1">SENDGRID_API_KEY</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMMUNICATION DETAIL MODAL                                                */}
      {/* ========================================================================= */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className={cn("w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-4 border", isDark ? "bg-[#171B36] border-[#2B3566] text-white" : "bg-white border-slate-200 text-slate-900")}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2B3566]">
              <div className="flex items-center gap-2">
                {getChannelIcon(selectedLog.channel, 'h-5 w-5')}
                <div>
                  <h3 className="text-sm font-bold">Communication #{selectedLog.id}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Template: {selectedLog.templateCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#060F1B] border border-slate-100 dark:border-[#2B3566] text-[11px]">
                <div>Recipient: <strong className="font-mono">{selectedLog.recipient}</strong></div>
                <div>Category: <strong>{selectedLog.category}</strong></div>
                <div>Provider: <strong>{selectedLog.provider}</strong></div>
                <div>Status: <span className={cn("px-2 py-0.5 rounded font-bold", getStatusBadge(selectedLog.deliveryStatus))}>{selectedLog.deliveryStatus}</span></div>
                <div>Sent At: <span className="font-mono">{formatDateTime(selectedLog.sentAt)}</span></div>
                <div>Delivered At: <span className="font-mono">{selectedLog.deliveredAt ? formatDateTime(selectedLog.deliveredAt) : '-'}</span></div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Subject</label>
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-[#2B3566] font-semibold text-xs">
                  {selectedLog.subject}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Rendered Message Body</label>
                <div className="p-3 rounded-xl border border-slate-100 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#060F1B] font-mono text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {selectedLog.renderedBody}
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-[11px]">
                  <strong>Failure Reason:</strong> {selectedLog.errorMessage}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#2B3566]">
              {['FAILED', 'BLOCKED_WINDOW', 'BLOCKED_DND', 'PENDING'].includes(selectedLog.deliveryStatus) ? (
                <Button
                  size="sm"
                  onClick={() => {
                    retryMutation.mutate(selectedLog.id);
                    setSelectedLog(null);
                  }}
                  className="bg-[#2563EB] text-white text-xs flex items-center gap-1.5 font-semibold"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Retry Communication
                </Button>
              ) : <div />}

              <Button size="sm" variant="secondary" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
