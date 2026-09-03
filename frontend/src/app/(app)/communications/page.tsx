'use client';

import { useState } from 'react';
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
  Plus,
  Send,
  Eye,
  Lock,
  FileText,
  UserCheck,
  Ban,
  Calendar,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, KpiCard, Spinner, Button, Input } from '@/components/ui';
import { formatDateTime, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

export default function CommunicationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'LOGS' | 'TEMPLATES' | 'COMPLIANCE'>('LOGS');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Send Notice Modal state
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('DISBURSEMENT_NOTICE');
  const [selectedChannel, setSelectedChannel] = useState<'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP'>('EMAIL');
  const [recipient, setRecipient] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [loanNo, setLoanNo] = useState('');
  const [amount, setAmount] = useState('50000');
  const [rawBankAccount, setRawBankAccount] = useState('112233445566');
  const [previewContent, setPreviewContent] = useState<any | null>(null);

  // 1. Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['communications-stats'],
    queryFn: async () => (await api.get('/communications/stats')).data.data,
  });

  // 2. Fetch Templates
  const { data: templates = [] } = useQuery({
    queryKey: ['communications-templates'],
    queryFn: async () => (await api.get('/communications/templates')).data.data,
  });

  // 3. Fetch Delivery Logs
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['communications-logs', channelFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (channelFilter !== 'ALL') params.set('channel', channelFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      return (await api.get(`/communications/logs?${params.toString()}`)).data.data;
    },
  });

  // Send Communication Mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/communications/send', {
        templateCode: selectedTemplate,
        channel: selectedChannel,
        recipient,
        recipientName,
        variables: {
          customerName: recipientName || 'Customer',
          loanNo: loanNo || 'LN-2609999',
          applicationNo: 'APP-SRC-101',
          requestedAmount: amount,
          sanctionedAmount: amount,
          netDisbursedAmount: amount,
          bankAccount: rawBankAccount, // Sensitive PII
          utrNumber: `UTR-LIVE-${Date.now().toString().slice(-6)}`,
          firstDueDate: '05-Oct-2026',
          dueDate: '05-Oct-2026',
          emiAmount: '4730',
          overdueAmount: amount,
          dpd: '22',
          lateCharges: '250',
          productName: 'Personal Express',
          trackingUrl: 'https://adyapan.dev/track',
          paymentUrl: 'https://adyapan.dev/pay',
          officerName: 'Rahul Verma',
          officerPhone: '+91 98000 12345',
          receiptNo: `RCP-${Date.now().toString().slice(-4)}`,
          paidAmount: amount,
          outstandingPrincipal: '45000',
          closureDate: '03-Sep-2026',
          nocReference: `NOC-${Date.now().toString().slice(-4)}`,
          missingDocuments: 'Aadhaar / Income Proof',
          rejectionReason: 'FOIR threshold exceeded',
        },
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setShowSendModal(false);
      queryClient.invalidateQueries({ queryKey: ['communications-logs'] });
      queryClient.invalidateQueries({ queryKey: ['communications-stats'] });
      alert(`Communication record #${data.id} dispatched via ${data.channel} (Status: ${data.deliveryStatus}).`);
    },
    onError: (err: any) => {
      alert(`Dispatch failed: ${apiErrorMessage(err)}`);
    },
  });

  // Preview Template Mutation
  const previewMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/communications/preview', {
        templateCode: selectedTemplate,
        channel: selectedChannel,
        variables: {
          customerName: recipientName || 'Vikramaditya Sen',
          loanNo: loanNo || 'LN-2609999',
          netDisbursedAmount: amount,
          bankAccount: rawBankAccount,
          utrNumber: 'UTR-HDFC-998811',
          firstDueDate: '05-Oct-2026',
          emiAmount: '4730',
        },
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setPreviewContent(data);
    },
  });

  const filteredLogs = logs.filter((log: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.recipient.toLowerCase().includes(q) ||
      log.templateCode.toLowerCase().includes(q) ||
      log.subject.toLowerCase().includes(q)
    );
  });

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case 'EMAIL':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'SMS':
        return <Phone className="h-4 w-4 text-emerald-500" />;
      case 'WHATSAPP':
        return <MessageSquare className="h-4 w-4 text-teal-500" />;
      default:
        return <Bell className="h-4 w-4 text-purple-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
      case 'MOCKED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'BLOCKED_WINDOW':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'BLOCKED_DND':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        breadcrumb="Servicing / Communications Hub"
        title="Omnichannel Communication & Privacy"
        subtitle="Standardized borrower and staff notifications across Email, SMS, WhatsApp, and In-App with automated PII masking and RBI compliance"
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowSendModal(true)}
            className="text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" /> Send Manual Notice
          </Button>
        }
      />

      {/* Top Level KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <KpiCard
          title="Delivery Health"
          value={`${stats?.deliveryRatePercent ?? 100}%`}
          subtext="Successful transmission rate"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        />
        <KpiCard
          title="Total Dispatched"
          value={String(stats?.totalDispatched ?? 0)}
          subtext="Audited communication events"
          icon={<Send className="h-5 w-5 text-blue-600" />}
        />
        <KpiCard
          title="Active Channels"
          value="4 / 4"
          subtext="Email, SMS, WhatsApp, In-App"
          icon={<MessageSquare className="h-5 w-5 text-purple-600" />}
        />
        <KpiCard
          title="Collection Window"
          value={stats?.collectionWindowActive ? 'ACTIVE (8 AM - 7 PM)' : 'CLOSED (RESTRICTED)'}
          subtext="RBI compliance enforced"
          icon={<Clock className="h-5 w-5 text-amber-600" />}
        />
      </div>

      {/* Tabs Toolbar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#1E2445] pb-3">
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('LOGS')}
              className={cn(
                'px-3.5 py-1.5 font-bold rounded-lg transition-colors cursor-pointer',
                activeTab === 'LOGS'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1E2445] dark:text-slate-400'
              )}
            >
              Dispatch Logs ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('TEMPLATES')}
              className={cn(
                'px-3.5 py-1.5 font-bold rounded-lg transition-colors cursor-pointer',
                activeTab === 'TEMPLATES'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1E2445] dark:text-slate-400'
              )}
            >
              Standardized Templates ({templates.length})
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
              RBI Compliance & Privacy Controls
            </button>
          </div>

          {activeTab === 'LOGS' && (
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
              >
                <option value="ALL">All Channels</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="IN_APP">In-App</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="SENT">Sent / Delivered</option>
                <option value="BLOCKED_WINDOW">Blocked (Window)</option>
                <option value="BLOCKED_DND">Blocked (DND)</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          )}
        </div>

        {activeTab === 'LOGS' && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search delivery logs by recipient, template code, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        )}
      </Card>

      {/* TAB 1: COMMUNICATION DISPATCH LOGS */}
      {activeTab === 'LOGS' && (
        <div className="space-y-3">
          {logsLoading ? (
            <Card className="p-8 text-center space-y-2">
              <Spinner />
              <p className="text-xs text-slate-400">Loading communication logs...</p>
            </Card>
          ) : filteredLogs.length === 0 ? (
            <Card className="p-12 text-center space-y-2">
              <Mail className="h-10 w-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No Communication Logs Found
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No notices match the selected channel or search criteria.
              </p>
            </Card>
          ) : (
            filteredLogs.map((log: any) => (
              <Card key={log.id} className="p-4 space-y-2.5 border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1E2445] pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {getChannelIcon(log.channel)}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800 font-bold">
                      {log.templateCode}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        log.category === 'COLLECTION'
                          ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      )}
                    >
                      {log.category}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {log.subject}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className={cn('text-[10px] font-bold px-2.5 py-0.5 rounded-full border', getStatusBadge(log.deliveryStatus))}>
                      {log.deliveryStatus}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDateTime(log.sentAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <div>
                    Recipient: <strong className="text-slate-900 dark:text-white font-mono">{log.recipient}</strong>
                    {log.recipientName ? ` (${log.recipientName})` : ''} • Provider: <strong>{log.provider}</strong>
                  </div>
                  {log.errorMessage && (
                    <span className="text-rose-600 dark:text-rose-400 text-[11px] font-medium">
                      Note: {log.errorMessage}
                    </span>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 2: STANDARDIZED TEMPLATE LIBRARY */}
      {activeTab === 'TEMPLATES' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templates.map((tpl: any) => (
            <Card key={tpl.code} className="p-5 space-y-3 border">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-[#1E2445] pb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {tpl.name}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    Code: {tpl.code}
                  </span>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                    tpl.category === 'COLLECTION'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : tpl.category === 'REGULATORY'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                  )}
                >
                  {tpl.category}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                {tpl.description}
              </p>

              <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-[#0E1528] border border-slate-100 dark:border-[#1E2445] text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Subject Template
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                  {tpl.subjectTemplate}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-[#1E2445]">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400">Channels:</span>
                  {tpl.supportedChannels.map((c: string) => (
                    <span key={c} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {c}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(tpl.code);
                    setShowSendModal(true);
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                >
                  Use Template <Send className="h-3 w-3" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 3: REGULATORY COMPLIANCE & PRIVACY CONTROLS */}
      {activeTab === 'COMPLIANCE' && (
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              RBI Digital Lending & Fair Practice Communication Governance
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every message dispatched via the Adyapan Omnichannel Engine undergoes automated compliance filtering prior to network transmission.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1528] border border-slate-100 dark:border-[#1E2445] flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Strict 8:00 AM – 7:00 PM Collection Window:</strong>
                  <p className="text-slate-500 text-[11px]">
                    Per Reserve Bank of India fair collection practice guidelines, recovery reminders and overdue notices are blocked outside 8 AM to 7 PM IST. Any automated queue triggering outside this window is halted with status <code>BLOCKED_WINDOW</code>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1528] border border-slate-100 dark:border-[#1E2445] flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Automated PII Masking:</strong>
                  <p className="text-slate-500 text-[11px]">
                    All disbursement notices and receipts automatically mask bank accounts (<code>XXXX-XXXX-1234</code>), PAN cards (<code>XXXXX1234X</code>), and Aadhaar tokens to prevent snooping over insecure SMS or WhatsApp channels.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1528] border border-slate-100 dark:border-[#1E2445] flex items-start gap-2.5">
                <Ban className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Zero Marketing Spam Guarantee:</strong>
                  <p className="text-slate-500 text-[11px]">
                    This communication infrastructure only handles transactional notices, sanction letters, and regulatory disclosures. Marketing communications cannot be sent through transactional templates.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* SEND NOTICE MODAL */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Dispatch Standardized Communication Notice
              </h3>
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Template Event *
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                  >
                    {templates.map((t: any) => (
                      <option key={t.code} value={t.code}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Channel *
                  </label>
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="IN_APP">In-App Notification</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Address / Mobile *
                  </label>
                  <Input
                    placeholder="e.g. borrower@adyapan.dev or +91 98200 12345"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Full Name
                  </label>
                  <Input
                    placeholder="e.g. Vikramaditya Sen"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Loan / Application No
                  </label>
                  <Input
                    placeholder="e.g. LN-2609100"
                    value={loanNo}
                    onChange={(e) => setLoanNo(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount (₹)
                  </label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Account Number (Will be auto-masked)
                </label>
                <Input
                  value={rawBankAccount}
                  onChange={(e) => setRawBankAccount(e.target.value)}
                  placeholder="e.g. 987654321098"
                  className="text-xs font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Automated PII masker will convert to <code>XXXX-XXXX-{rawBankAccount.slice(-4)}</code>
                </p>
              </div>

              {previewContent && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">PII-Masked Preview</span>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {previewContent.subject}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                    {previewContent.body?.slice(0, 150)}...
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1E2445]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => previewMutation.mutate()}
                className="text-xs cursor-pointer flex items-center gap-1"
              >
                <Eye className="h-3 w-3" /> Preview Sanitized
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowSendModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!recipient.trim() || sendMutation.isPending}
                  onClick={() => sendMutation.mutate()}
                  className="text-xs cursor-pointer"
                >
                  {sendMutation.isPending ? 'Dispatching...' : 'Dispatch Notice'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
