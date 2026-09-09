'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Send,
  Smartphone,
  Mail,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Eye,
  Sliders,
  Bell,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Badge, Card, Button, Input } from '@/components/ui';
import { formatDateTime, cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';

interface CustomerCommunicationsCardProps {
  customer: {
    id: string;
    customerCode?: string;
    firstName: string;
    lastName: string;
    mobile?: string;
    email?: string;
    status?: string;
    kycStatus?: string;
  };
}

export function CustomerCommunicationsCard({ customer }: CustomerCommunicationsCardProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Send Notice Modal state
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendChannel, setSendChannel] = useState<'WHATSAPP' | 'SMS' | 'EMAIL' | 'IN_APP'>('WHATSAPP');
  const [sendCategory, setSendCategory] = useState('APPLICATION');
  const [selectedTemplateCode, setSelectedTemplateCode] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [customVars, setCustomVars] = useState<Record<string, string>>({
    customerName: `${customer.firstName} ${customer.lastName}`.trim(),
    mobile: customer.mobile || '',
  });

  // Consent & Preferences state
  const [consentModalOpen, setConsentModalOpen] = useState(false);

  // 1. Fetch Customer Communications Logs
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['customer-communications', customer.id, channelFilter, statusFilter],
    queryFn: async () => {
      const params: any = {
        customerId: customer.id,
        limit: 50,
      };
      if (channelFilter !== 'ALL') params.channel = channelFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get('/communications/logs', { params });
      return res.data;
    },
  });

  // 2. Fetch Templates
  const { data: templates = [] } = useQuery({
    queryKey: ['communication-templates'],
    queryFn: async () => {
      const res = await api.get('/communications/templates');
      return res.data?.data || [];
    },
  });

  // 3. Fetch Customer Preferences
  const { data: preferencesData, refetch: refetchPrefs } = useQuery({
    queryKey: ['customer-communication-preferences', customer.id],
    queryFn: async () => {
      const res = await api.get(`/communications/preferences/${customer.id}`);
      return res.data?.data || null;
    },
  });

  // 4. Send Communication Mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      return api.post('/communications/send', {
        customerId: customer.id,
        channel: sendChannel,
        category: sendCategory,
        templateCode: selectedTemplateCode || undefined,
        subject: customSubject || undefined,
        message: customMessage || undefined,
        variables: customVars,
      });
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Notice dispatched successfully.');
      setSendModalOpen(false);
      setSelectedTemplateCode('');
      setCustomSubject('');
      setCustomMessage('');
      queryClient.invalidateQueries({ queryKey: ['customer-communications', customer.id] });
      queryClient.invalidateQueries({ queryKey: ['communications-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Communication Dispatch Error' });
    },
  });

  // 5. Retry Mutation
  const retryMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/communications/retry/${id}`);
    },
    onSuccess: () => {
      toast.success('Retry dispatched through active gateway.');
      queryClient.invalidateQueries({ queryKey: ['customer-communications', customer.id] });
      queryClient.invalidateQueries({ queryKey: ['communications-delivery-queue'] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Retry Failed' });
    },
  });

  // 6. Update Preferences Mutation
  const updatePrefsMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.put(`/communications/preferences/${customer.id}`, payload);
    },
    onSuccess: () => {
      toast.success('Communication preferences & DND updated.');
      setConsentModalOpen(false);
      refetchPrefs();
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Preferences Error' });
    },
  });

  const logs = logsData?.data || [];
  const filteredTemplates = templates.filter((t: any) => {
    const matchCategory = !sendCategory || t.category === sendCategory;
    const matchChannel = !sendChannel || t.channel === sendChannel;
    return matchCategory && matchChannel;
  });

  const handleTemplateSelect = (code: string) => {
    setSelectedTemplateCode(code);
    const tmpl = templates.find((t: any) => t.code === code);
    if (tmpl) {
      setCustomSubject(tmpl.subject || '');
      setCustomMessage(tmpl.body || '');
      // populate default vars
      const vars: Record<string, string> = {
        customerName: `${customer.firstName} ${customer.lastName}`.trim(),
        mobile: customer.mobile || '',
        email: customer.email || '',
        lenderName: 'Adyapan Finance',
      };
      tmpl.variables?.forEach((v: string) => {
        if (!vars[v]) vars[v] = '';
      });
      setCustomVars(vars);
    }
  };

  // Compute live statistics
  const totalSent = logs.length;
  const deliveredCount = logs.filter((l: any) => ['DELIVERED', 'READ', 'SENT', 'MOCKED'].includes(l.status)).length;
  const failedCount = logs.filter((l: any) => l.status === 'FAILED').length;
  const blockedCount = logs.filter((l: any) => ['BLOCKED_DND', 'BLOCKED_WINDOW'].includes(l.status)).length;

  return (
    <div className="space-y-4">
      {/* Top Banner & Fast Actions */}
      <Card className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border-indigo-900/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Customer Omnichannel Communications
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-semibold">
                    RBI & DND Compliant
                  </span>
                </h3>
                <p className="text-xs text-indigo-200/70">
                  Registered Mobile: <span className="font-mono text-white font-semibold">{customer.mobile || 'N/A'}</span> · Email: <span className="font-mono text-white font-semibold">{customer.email || 'N/A'}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setConsentModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <Sliders className="h-3.5 w-3.5 text-indigo-300" /> Channels & Consent
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSendModalOpen(true);
                if (templates.length > 0 && !selectedTemplateCode) {
                  const first = templates.find((t: any) => t.channel === 'WHATSAPP') || templates[0];
                  if (first) {
                    setSendChannel(first.channel);
                    setSendCategory(first.category);
                    handleTemplateSelect(first.code);
                  }
                }
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer text-xs"
            >
              <Send className="h-3.5 w-3.5" /> Dispatch Direct Notice
            </Button>
          </div>
        </div>

        {/* Mini Stats Line */}
        <div className="mt-4 pt-3 border-t border-indigo-800/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-800/30">
            <span className="text-indigo-300 text-[11px] block">Total Dispatches</span>
            <span className="text-base font-bold text-white">{totalSent}</span>
          </div>
          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/30">
            <span className="text-emerald-300 text-[11px] block">Delivered / Read</span>
            <span className="text-base font-bold text-emerald-400">{deliveredCount}</span>
          </div>
          <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/30">
            <span className="text-rose-300 text-[11px] block">Failed / Undelivered</span>
            <span className="text-base font-bold text-rose-400">{failedCount}</span>
          </div>
          <div className="bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/30">
            <span className="text-amber-300 text-[11px] block">DND / Timed Blocked</span>
            <span className="text-base font-bold text-amber-400">{blockedCount}</span>
          </div>
        </div>
      </Card>

      {/* Communications Log Table */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Communication History Feed ({logs.length})
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Channel filter */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Channels</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="SMS">SMS</option>
              <option value="EMAIL">Email</option>
              <option value="IN_APP">In-App</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="READ">Read</option>
              <option value="FAILED">Failed</option>
              <option value="BLOCKED_DND">Blocked (DND)</option>
              <option value="BLOCKED_WINDOW">Blocked (Window)</option>
            </select>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => refetchLogs()}
              className="flex items-center gap-1 text-xs"
            >
              <RefreshCw className={cn('h-3 w-3', logsLoading && 'animate-spin')} /> Refresh
            </Button>
          </div>
        </div>

        {logsLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading communication logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              No communication logs found for this customer.
            </p>
            <p className="text-[11px] text-slate-400">
              Dispatches triggered by loan events, KYC changes, payment receipts, or manual notices will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Category / Template</th>
                  <th className="py-2.5 px-3">Message Subject & Body</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Sent At</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {log.channel === 'WHATSAPP' && (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold">
                            <MessageSquare className="h-3.5 w-3.5" /> WA
                          </span>
                        )}
                        {log.channel === 'SMS' && (
                          <span className="flex items-center gap-1 text-blue-600 font-bold">
                            <Smartphone className="h-3.5 w-3.5" /> SMS
                          </span>
                        )}
                        {log.channel === 'EMAIL' && (
                          <span className="flex items-center gap-1 text-amber-600 font-bold">
                            <Mail className="h-3.5 w-3.5" /> Mail
                          </span>
                        )}
                        {log.channel === 'IN_APP' && (
                          <span className="flex items-center gap-1 text-purple-600 font-bold">
                            <Bell className="h-3.5 w-3.5" /> App
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {log.category || 'GENERAL'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[140px]">
                        {log.templateCode || 'CUSTOM_MESSAGE'}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-[280px]">
                      {log.subject && (
                        <span className="font-bold text-slate-900 dark:text-white block truncate text-[11px]">
                          {log.subject}
                        </span>
                      )}
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] truncate">
                        {log.message || log.body || 'No message content stored'}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <Badge status={log.status} />
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                      {log.sentAt ? formatDateTime(log.sentAt) : formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 cursor-pointer"
                          title="View Delivery Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {log.status === 'FAILED' && (
                          <button
                            type="button"
                            onClick={() => retryMutation.mutate(log.id)}
                            disabled={retryMutation.isPending}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-700 cursor-pointer"
                            title="Retry Message"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Dispatch Direct Notice Modal */}
      {sendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Send Direct Notice / Communication
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Recipient: {customer.firstName} {customer.lastName} ({customer.mobile || customer.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSendModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMutation.mutate();
              }}
              className="space-y-4 text-xs"
            >
              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Channel *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-600' },
                    { id: 'SMS', label: 'SMS', icon: Smartphone, color: 'text-blue-600' },
                    { id: 'EMAIL', label: 'Email', icon: Mail, color: 'text-amber-600' },
                    { id: 'IN_APP', label: 'In-App Notice', icon: Bell, color: 'text-purple-600' },
                  ].map((c) => {
                    const Icon = c.icon;
                    const active = sendChannel === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSendChannel(c.id as any);
                          setSelectedTemplateCode('');
                        }}
                        className={cn(
                          'p-2.5 rounded-xl border flex flex-col items-center gap-1 font-semibold transition-all cursor-pointer',
                          active
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-500 shadow-2xs'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        )}
                      >
                        <Icon className={cn('h-4 w-4', c.color)} />
                        <span className="text-[11px]">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Template Category & Template Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Event / Category
                  </label>
                  <select
                    value={sendCategory}
                    onChange={(e) => {
                      setSendCategory(e.target.value);
                      setSelectedTemplateCode('');
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs"
                  >
                    <option value="ONBOARDING">Customer Onboarding</option>
                    <option value="APPLICATION">Loan Application</option>
                    <option value="DISBURSEMENT">Disbursement & Agreement</option>
                    <option value="PAYMENT">Payment & Receipts</option>
                    <option value="COLLECTIONS">Collections & Delinquency</option>
                    <option value="CLOSURE">Closure & NOC</option>
                    <option value="GENERAL">General Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Template
                  </label>
                  <select
                    value={selectedTemplateCode}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs"
                  >
                    <option value="">-- Custom Message (No Template) --</option>
                    {filteredTemplates.map((t: any) => (
                      <option key={t.code} value={t.code}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject (for Email / In-App) */}
              {(sendChannel === 'EMAIL' || sendChannel === 'IN_APP') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Notice Subject *
                  </label>
                  <Input
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Enter email / notice subject line"
                    required={sendChannel === 'EMAIL'}
                  />
                </div>
              )}

              {/* Message Body */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Message Content *
                </label>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter message body or let template populate standard tokens..."
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              {/* Variables preview & dynamic editor */}
              {selectedTemplateCode && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    Template Token Values:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.keys(customVars).map((k) => (
                      <div key={k}>
                        <label className="block text-[10px] text-slate-500 font-mono">
                          {`{{${k}}}`}
                        </label>
                        <input
                          type="text"
                          value={customVars[k] || ''}
                          onChange={(e) => setCustomVars({ ...customVars, [k]: e.target.value })}
                          className="w-full text-[11px] p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sendMutation.isError && (
                <p className="text-xs text-rose-600">{apiErrorMessage(sendMutation.error)}</p>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setSendModalOpen(false)}
                  disabled={sendMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sendMutation.isPending || !customMessage.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5"
                >
                  {sendMutation.isPending ? 'Dispatching...' : <><Send className="h-3.5 w-3.5" /> Dispatch Notice</>}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Customer Preferences & Consent Modal */}
      {consentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customer Consent & DND</h3>
                  <p className="text-[11px] text-slate-500">RBI Communication & Privacy Enforcement</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConsentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <Info className="h-3.5 w-3.5" />
                  <span>Statutory Compliance Note</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Transactional messages (sanctions, receipts, default alerts) are permitted under regulatory mandate. Marketing & promotional notices require opt-in consent.
                </p>
              </div>

              <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                  Opt-In Communication Channels:
                </span>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={preferencesData?.channels?.includes('WHATSAPP') ?? true}
                      id="opt_wa"
                      className="rounded text-indigo-600"
                    />
                    <span>WhatsApp Updates & Document Notices</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={preferencesData?.channels?.includes('SMS') ?? true}
                      id="opt_sms"
                      className="rounded text-indigo-600"
                    />
                    <span>SMS Alerts (Transactional & Security OTP)</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={preferencesData?.channels?.includes('EMAIL') ?? true}
                      id="opt_email"
                      className="rounded text-indigo-600"
                    />
                    <span>Email Statements, Sanction Letters & NOC</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Do Not Disturb (DND)</span>
                  <span className="text-[11px] text-slate-500">Block all promotional dispatches</span>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={preferencesData?.dndEnabled ?? false}
                  id="opt_dnd"
                  className="rounded text-rose-600 h-4 w-4 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setConsentModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const wa = (document.getElementById('opt_wa') as HTMLInputElement)?.checked;
                    const sms = (document.getElementById('opt_sms') as HTMLInputElement)?.checked;
                    const email = (document.getElementById('opt_email') as HTMLInputElement)?.checked;
                    const dnd = (document.getElementById('opt_dnd') as HTMLInputElement)?.checked;
                    const channels = [];
                    if (wa) channels.push('WHATSAPP');
                    if (sms) channels.push('SMS');
                    if (email) channels.push('EMAIL');
                    updatePrefsMutation.mutate({
                      channels,
                      dndEnabled: dnd,
                      optIn: !dnd,
                    });
                  }}
                  disabled={updatePrefsMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {updatePrefsMutation.isPending ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Communication Dispatch Details
                </h3>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">{selectedLog.id}</p>
              </div>
              <Badge status={selectedLog.status} />
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Channel</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.channel}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Category</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.category || 'GENERAL'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Recipient</span>
                  <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{selectedLog.recipient || customer.mobile || customer.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Provider Message ID</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400 text-[10px] truncate block">
                    {selectedLog.providerMessageId || selectedLog.providerRef || 'N/A'}
                  </span>
                </div>
              </div>

              {selectedLog.subject && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Subject</span>
                  <p className="font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                    {selectedLog.subject}
                  </p>
                </div>
              )}

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Dispatched Message Body</span>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto whitespace-pre-wrap text-slate-800 dark:text-slate-200 font-mono text-[11px] leading-relaxed">
                  {selectedLog.message || selectedLog.body || 'No text payload'}
                </div>
              </div>

              {selectedLog.error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase block">
                    Delivery Failure Diagnostic
                  </span>
                  <p className="text-rose-700 dark:text-rose-400 font-mono text-[11px]">{selectedLog.error}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {selectedLog.status === 'FAILED' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      retryMutation.mutate(selectedLog.id);
                      setSelectedLog(null);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1 text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Retry Delivery
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
