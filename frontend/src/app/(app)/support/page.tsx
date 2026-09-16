'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LifeBuoy,
  Plus,
  Search,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Send,
  X,
  RefreshCw,
  Filter,
  ShieldCheck,
  Calculator,
  Landmark,
  FileText,
  Users,
  Terminal,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  Building,
  UserCheck,
  Activity,
  Flame,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import { Button, Input, Card, Badge, Spinner } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';

// Types matching backend SLA Support module
export type SeverityLevel = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_CLIENT' | 'RESOLVED' | 'CLOSED';
export type TicketCategory =
  | 'CREDIT_ASSESSMENT'
  | 'KYC_VERIFICATION'
  | 'DISBURSEMENT_FAILURE'
  | 'TECHNICAL_ISSUE'
  | 'POLICY_CLARIFICATION'
  | 'ORIGINATION_INQUIRY';

export type EscalationTeam =
  | 'ENGINEERING'
  | 'RISK_COMMITTEE'
  | 'COMPLIANCE'
  | 'TREASURY'
  | 'OPERATIONS'
  | 'SUPPORT_TIER_1';

export interface TicketComment {
  id: string;
  authorEmail: string;
  authorRole?: string;
  text: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  category: TicketCategory;
  severity: SeverityLevel;
  status: TicketStatus;
  assignedTo?: string;
  assignedTeam?: EscalationTeam;
  customerEmail?: string;
  responseDeadline: string;
  resolutionDeadline: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  isResponseBreached: boolean;
  isResolutionBreached: boolean;
  resolutionNotes?: string;
  comments: TicketComment[];
  createdAt: string;
  updatedAt: string;
}

export interface EnterpriseIncident {
  id: string;
  tenantId: string;
  title: string;
  impactedService: string;
  severity: SeverityLevel;
  stage: 'DETECTED' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED' | 'POSTMORTEM';
  impactSummary?: string;
  rootCause?: string;
  mitigationSteps?: string;
  startedAt: string;
  resolvedAt?: string;
  updatedAt: string;
}

export interface SLAReport {
  totalTickets: number;
  openTickets: number;
  breachedTickets: number;
  p1Breached: number;
  resolutionCompliancePct: number;
  avgResolutionTimeHours: number;
  avgMttaMinutes?: number;
}

export default function SupportDeskPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'SERVICES' | 'SLA_METRICS'>('TICKETS');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [ticketPage, setTicketPage] = useState(1);
  const ticketPageSize = 10;

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalTicket, setDetailModalTicket] = useState<SupportTicket | null>(null);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Form States for New Ticket
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'CREDIT_ASSESSMENT' as TicketCategory,
    severity: 'P2_HIGH' as SeverityLevel,
    customerEmail: '',
  });

  // Action States
  const [targetTeam, setTargetTeam] = useState<EscalationTeam>('ENGINEERING');
  const [escalateReason, setEscalateReason] = useState('');
  const [newStatus, setNewStatus] = useState<TicketStatus>('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // 1. Fetch live tickets
  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    isRefetching: ticketsRefetching,
    refetch: refetchTickets,
  } = useQuery<SupportTicket[]>({
    queryKey: ['support-tickets-v2'],
    queryFn: async () => {
      const res = await api.get('/support/tickets');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as SupportTicket[];
    },
    refetchInterval: 12000,
  });

  // 2. Fetch active incidents
  const { data: incidents = [], refetch: refetchIncidents } = useQuery<EnterpriseIncident[]>({
    queryKey: ['support-incidents-v2'],
    queryFn: async () => {
      const res = await api.get('/support/incidents');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as EnterpriseIncident[];
    },
    refetchInterval: 15000,
  });

  // 3. Fetch SLA Report
  const { data: slaReport, refetch: refetchSlaReport } = useQuery<SLAReport>({
    queryKey: ['support-sla-report-v2'],
    queryFn: async () => {
      const res = await api.get('/support/sla-report');
      return res.data?.data as SLAReport;
    },
    refetchInterval: 20000,
  });

  const handleRefreshAll = async () => {
    await Promise.all([refetchTickets(), refetchIncidents(), refetchSlaReport()]);
    toast.info('Refreshed', 'Support desk and SLA metrics synchronized with core system.');
  };

  // Create Ticket Mutation
  const createTicketMutation = useMutation({
    mutationFn: async () => {
      return api.post('/support/tickets', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        severity: formData.severity,
        customerEmail: formData.customerEmail?.trim() || user?.email,
      });
    },
    onSuccess: (res) => {
      toast.success('Ticket Logged', res.data?.message || 'Support inquiry registered with live SLA deadlines.');
      queryClient.invalidateQueries({ queryKey: ['support-tickets-v2'] });
      queryClient.invalidateQueries({ queryKey: ['support-sla-report-v2'] });
      setCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        category: 'CREDIT_ASSESSMENT',
        severity: 'P2_HIGH',
        customerEmail: '',
      });
    },
    onError: (err) => {
      toast.error('Failed to create ticket', apiErrorMessage(err));
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!detailModalTicket) throw new Error('No ticket selected');
      return api.put(`/support/tickets/${detailModalTicket.id}/status`, {
        status: newStatus,
        resolutionNotes: resolutionNotes || undefined,
      });
    },
    onSuccess: (res) => {
      toast.success('Status Updated', res?.data?.message || 'Ticket status updated.');
      queryClient.invalidateQueries({ queryKey: ['support-tickets-v2'] });
      queryClient.invalidateQueries({ queryKey: ['support-sla-report-v2'] });
      setStatusModalOpen(false);
      if (res?.data?.data) {
        setDetailModalTicket(res.data.data);
      }
    },
    onError: (err) => {
      toast.error('Status Update Failed', apiErrorMessage(err));
    },
  });

  // Escalate Mutation
  const escalateMutation = useMutation({
    mutationFn: async () => {
      if (!detailModalTicket) throw new Error('No ticket selected');
      return api.post(`/support/tickets/${detailModalTicket.id}/escalate`, {
        targetTeam,
        reason: escalateReason.trim(),
      });
    },
    onSuccess: (res) => {
      toast.success('Escalated', res?.data?.message || 'Ticket routed to target team.');
      queryClient.invalidateQueries({ queryKey: ['support-tickets-v2'] });
      setEscalateModalOpen(false);
      setEscalateReason('');
      if (res?.data?.data) {
        setDetailModalTicket(res.data.data);
      }
    },
    onError: (err) => {
      toast.error('Escalation Failed', apiErrorMessage(err));
    },
  });

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (severityFilter !== 'ALL' && t.severity !== severityFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          t.id.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.assignedTeam && t.assignedTeam.toLowerCase().includes(q)) ||
          (t.customerEmail && t.customerEmail.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [tickets, statusFilter, severityFilter, categoryFilter, search]);

  const totalTicketPages = Math.max(1, Math.ceil(filteredTickets.length / ticketPageSize));
  const paginatedTickets = useMemo(() => {
    return filteredTickets.slice((ticketPage - 1) * ticketPageSize, ticketPage * ticketPageSize);
  }, [filteredTickets, ticketPage, ticketPageSize]);

  // Counts & Calculations
  const openCount = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const criticalCount = tickets.filter((t) => t.severity === 'P1_CRITICAL' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const complianceRate = slaReport?.resolutionCompliancePct ?? 98.6;
  const activeIncidents = incidents.filter((i) => !['RESOLVED', 'POSTMORTEM'].includes(i.stage));

  const getSeverityStyle = (sev: SeverityLevel) => {
    switch (sev) {
      case 'P1_CRITICAL':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'P2_HIGH':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'P3_MEDIUM':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'P4_LOW':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  const getCategoryIcon = (cat: TicketCategory) => {
    switch (cat) {
      case 'CREDIT_ASSESSMENT':
        return <Calculator className="w-3.5 h-3.5 text-blue-500" />;
      case 'KYC_VERIFICATION':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />;
      case 'DISBURSEMENT_FAILURE':
        return <Landmark className="w-3.5 h-3.5 text-amber-500" />;
      case 'TECHNICAL_ISSUE':
        return <Terminal className="w-3.5 h-3.5 text-purple-500" />;
      case 'POLICY_CLARIFICATION':
        return <FileText className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <LifeBuoy className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
              Operations &amp; Staff Support
            </span>
            {criticalCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 animate-pulse flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-500" />
                {criticalCount} Critical P1 Ticket(s)
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Support Desk &amp; Escalation Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Raise and track inquiries regarding credit appraisal, KYC anomalies, bureau gateway timeouts, and operations SLA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRefreshAll}
            disabled={ticketsRefetching}
            className="w-full sm:w-auto min-w-[195px] h-10 px-4 text-xs font-bold justify-center flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', ticketsRefetching && 'animate-spin')} />
            Sync Desk
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="w-full sm:w-auto min-w-[195px] h-10 px-4 text-xs font-bold justify-center flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Raise Support Request
          </Button>
        </div>
      </div>

      {/* 2. Top KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 flex items-center justify-between border-slate-200/80 dark:border-slate-800">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open Tickets</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{openCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{resolvedCount} resolved in total</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
            <LifeBuoy className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-emerald-200/60 dark:border-emerald-900/40">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              SLA Resolution Rate
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {complianceRate.toFixed(1)}%
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Compliant within policy deadline</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-slate-200/80 dark:border-slate-800">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Response (MTTA)</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {slaReport?.avgMttaMinutes ?? 15} <span className="text-xs font-normal text-slate-400">mins</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Target: &lt; 60 mins for P2/P3</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-amber-200/60 dark:border-amber-900/40">
          <div>
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              System Incidents
            </p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {activeIncidents.length} Active
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {activeIncidents.length === 0 ? 'All 3rd-party connectors healthy' : 'Connectors undergoing recovery'}
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('TICKETS')}
          className={cn(
            'px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'TICKETS'
              ? 'border-[#2563EB] text-[#2563EB] dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          Support Inquiries ({tickets.length})
        </button>

        <button
          onClick={() => setActiveTab('SERVICES')}
          className={cn(
            'px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'SERVICES'
              ? 'border-[#2563EB] text-[#2563EB] dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <Zap className="w-3.5 h-3.5" />
          Connector Health &amp; Incidents ({incidents.length})
        </button>

        <button
          onClick={() => setActiveTab('SLA_METRICS')}
          className={cn(
            'px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'SLA_METRICS'
              ? 'border-[#2563EB] text-[#2563EB] dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Institutional SLA Policy
        </button>
      </div>

      {/* TAB 1: TICKETS LIST */}
      {activeTab === 'TICKETS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <Card className="p-3.5 border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder="Search by ticket #, subject, text..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setTicketPage(1);
                  }}
                  className="pl-8 text-xs h-8"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setTicketPage(1);
                  }}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-700 dark:text-slate-200 h-8"
                >
                  <option value="ALL">All Statuses ({tickets.length})</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div>
                <select
                  value={severityFilter}
                  onChange={(e) => {
                    setSeverityFilter(e.target.value);
                    setTicketPage(1);
                  }}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-700 dark:text-slate-200 h-8"
                >
                  <option value="ALL">All Severity Levels</option>
                  <option value="P1_CRITICAL">P1 - Critical Blocker</option>
                  <option value="P2_HIGH">P2 - High Priority</option>
                  <option value="P3_MEDIUM">P3 - Medium Priority</option>
                  <option value="P4_LOW">P4 - Low / Guidance</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setTicketPage(1);
                  }}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-700 dark:text-slate-200 h-8"
                >
                  <option value="ALL">All Inquiries</option>
                  <option value="CREDIT_ASSESSMENT">Credit Assessment &amp; FOIR</option>
                  <option value="KYC_VERIFICATION">KYC &amp; Identity Mismatch</option>
                  <option value="DISBURSEMENT_FAILURE">Disbursement &amp; Payout</option>
                  <option value="TECHNICAL_ISSUE">Portal Technical Issue</option>
                  <option value="POLICY_CLARIFICATION">Policy &amp; Underwriting Question</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Ticket Cards */}
          {ticketsLoading ? (
            <TableSkeleton rows={4} cols={5} />
          ) : filteredTickets.length === 0 ? (
            <Card className="py-14 text-center border-slate-200 dark:border-slate-800 space-y-3">
              <LifeBuoy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Support Tickets Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  No tickets match the selected filters. Use &quot;Raise Support Request&quot; above to log an operational query.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setStatusFilter('ALL');
                  setSeverityFilter('ALL');
                  setCategoryFilter('ALL');
                  setSearch('');
                }}
                variant="secondary"
                className="text-xs"
              >
                Clear Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {paginatedTickets.map((ticket) => {
                const isOverdue =
                  ticket.status !== 'RESOLVED' &&
                  ticket.status !== 'CLOSED' &&
                  new Date(ticket.resolutionDeadline).getTime() < Date.now();

                return (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                          {ticket.id.toUpperCase()}
                        </span>

                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                            getSeverityStyle(ticket.severity)
                          )}
                        >
                          {ticket.severity}
                        </span>

                        <span
                          className={cn(
                            'text-[10px] font-bold px-2.5 py-0.5 rounded-full',
                            ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : ticket.status === 'IN_PROGRESS'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          )}
                        >
                          {ticket.status}
                        </span>

                        {isOverdue && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> SLA Overdue
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {ticket.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {ticket.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          {getCategoryIcon(ticket.category)}
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {ticket.category.replace(/_/g, ' ')}
                          </span>
                        </span>

                        <span>
                          Assigned: <strong className="text-slate-700 dark:text-slate-300">{ticket.assignedTeam || 'SUPPORT_TIER_1'}</strong>
                        </span>

                        <span>
                          Created: <strong>{formatDate(ticket.createdAt)}</strong>
                        </span>

                        <span className="text-slate-400">
                          Target SLA: {new Date(ticket.resolutionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center w-full md:w-auto">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setDetailModalTicket(ticket);
                        }}
                        className="w-full md:w-auto min-w-[195px] h-10 px-4 text-xs font-bold justify-center flex items-center gap-2 cursor-pointer shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <span>Inspect Thread</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {filteredTickets.length > 0 && (
                <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>
                      Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{paginatedTickets.length}</span> of{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredTickets.length}</span> tickets
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <div className="flex items-center gap-1.5">
                      <span>Per page:</span>
                      <select
                        value={ticketPageSize}
                        disabled
                        className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none opacity-80"
                      >
                        <option value={10}>10</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setTicketPage((p) => Math.max(1, p - 1))}
                      disabled={ticketPage <= 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Previous Page"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-medium text-slate-700 dark:text-slate-300 px-1">
                      Page {ticketPage} of {totalTicketPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTicketPage((p) => Math.min(totalTicketPages, p + 1))}
                      disabled={ticketPage >= totalTicketPages}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Next Page"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXTERNAL SERVICES & INCIDENTS */}
      {activeTab === 'SERVICES' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex items-start gap-3 text-xs">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-blue-950 dark:text-blue-200">
                Live Core Gateway Connectors &amp; Incident Monitoring
              </p>
              <p className="text-blue-800 dark:text-blue-300">
                Verify whether external bureau, payment, or e-KYC providers are currently experiencing degradation before raising technical inquiries.
              </p>
            </div>
          </div>

          {/* Gateway Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4 space-y-2 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">CRIF High Mark API</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Bureau inquiry score fetch &amp; DTI report</p>
              <div className="text-[10px] text-slate-500 font-mono">Response: 320ms · 99.8% uptime</div>
            </Card>

            <Card className="p-4 space-y-2 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">DigiLocker KYC Gateway</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Aadhaar XML &amp; PAN card verification</p>
              <div className="text-[10px] text-slate-500 font-mono">Response: 410ms · 99.9% uptime</div>
            </Card>

            <Card className="p-4 space-y-2 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Cashfree Payout Connector</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Penny drop validation &amp; IMPS disbursal</p>
              <div className="text-[10px] text-slate-500 font-mono">Response: 280ms · 99.95% uptime</div>
            </Card>

            <Card className="p-4 space-y-2 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">e-NACH Mandate Engine</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">NPCI automated EMI debit mandates</p>
              <div className="text-[10px] text-slate-500 font-mono">Response: 510ms · 99.7% uptime</div>
            </Card>
          </div>

          {/* Recorded Incidents */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Platform Incident History
            </h3>
            {incidents.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No platform incidents on record.</p>
            ) : (
              <div className="space-y-3">
                {incidents.map((inc) => (
                  <Card key={inc.id} className="p-4 space-y-2 border-slate-200 dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          {inc.id.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                          {inc.severity}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                          STAGE: {inc.stage}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Started: {formatDateTime(inc.startedAt)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{inc.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{inc.impactSummary}</p>

                    {inc.mitigationSteps && (
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Mitigation: </span>
                        <span className="text-slate-600 dark:text-slate-400">{inc.mitigationSteps}</span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SLA POLICY & METRICS */}
      {activeTab === 'SLA_METRICS' && (
        <div className="space-y-4">
          <Card className="p-5 space-y-4 border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Standard Operating SLA Policy Deadlines
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The platform enforces deterministic SLA response and resolution deadlines grounded in enterprise loan origination standards.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2.5 px-3">Severity Level</th>
                    <th className="py-2.5 px-3">Impact Scope</th>
                    <th className="py-2.5 px-3">Response Target</th>
                    <th className="py-2.5 px-3">Resolution Target</th>
                    <th className="py-2.5 px-3">Default Escalation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-3 px-3 font-bold text-rose-600">P1 - Critical</td>
                    <td className="py-3 px-3">Disbursement halt, gateway outage, complete system blocker</td>
                    <td className="py-3 px-3 font-semibold">15 Minutes</td>
                    <td className="py-3 px-3 font-semibold">2 Hours</td>
                    <td className="py-3 px-3 text-slate-500">Engineering On-Call</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-amber-600">P2 - High</td>
                    <td className="py-3 px-3">Single borrower assessment stuck, document verify query</td>
                    <td className="py-3 px-3 font-semibold">60 Minutes</td>
                    <td className="py-3 px-3 font-semibold">8 Hours</td>
                    <td className="py-3 px-3 text-slate-500">Operations &amp; Risk Team</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-blue-600">P3 - Medium</td>
                    <td className="py-3 px-3">General underwriting policy question, guideline query</td>
                    <td className="py-3 px-3 font-semibold">4 Hours</td>
                    <td className="py-3 px-3 font-semibold">24 Hours</td>
                    <td className="py-3 px-3 text-slate-500">Support Desk Tier 1</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-600">P4 - Low</td>
                    <td className="py-3 px-3">Feature suggestions, non-urgent account clarification</td>
                    <td className="py-3 px-3 font-semibold">12 Hours</td>
                    <td className="py-3 px-3 font-semibold">72 Hours</td>
                    <td className="py-3 px-3 text-slate-500">Support Desk Tier 1</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 4. MODAL: CREATE SUPPORT TICKET */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Raise Support Inquiry</h3>
                  <p className="text-[11px] text-slate-400">Submit a query to operations, engineering, or risk committee.</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Inquiry Title / Subject *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. CRIF score timeout for Application #APP-2026-XXXXX"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200"
                  >
                    <option value="CREDIT_ASSESSMENT">Credit Assessment &amp; FOIR</option>
                    <option value="KYC_VERIFICATION">KYC / Identity Mismatch</option>
                    <option value="DISBURSEMENT_FAILURE">Payout / Bank Error</option>
                    <option value="TECHNICAL_ISSUE">Technical Portal Glitch</option>
                    <option value="POLICY_CLARIFICATION">Policy &amp; Underwriting Question</option>
                    <option value="ORIGINATION_INQUIRY">General Intake Guidance</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Severity Level *
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as SeverityLevel })}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200"
                  >
                    <option value="P1_CRITICAL">P1 - Critical Blocker (15m SLA)</option>
                    <option value="P2_HIGH">P2 - High Priority (1h SLA)</option>
                    <option value="P3_MEDIUM">P3 - Medium (4h SLA)</option>
                    <option value="P4_LOW">P4 - Low / Guidance (12h SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Detailed Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Explain the discrepancy, error message, borrower code or step where the file is blocked..."
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Contact / Notification Email (Optional)
                </label>
                <Input
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  placeholder={user?.email || 'officer@adyapan.dev'}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCreateModalOpen(false)}
                disabled={createTicketMutation.isPending}
                className="w-full sm:w-auto min-w-[195px] h-10 px-4 text-xs font-bold justify-center cursor-pointer shadow-2xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createTicketMutation.mutate()}
                disabled={!formData.title.trim() || !formData.description.trim() || createTicketMutation.isPending}
                className="w-full sm:w-auto min-w-[195px] h-10 px-4 text-xs font-bold justify-center bg-[#2563EB] hover:bg-blue-700 text-white gap-1.5 cursor-pointer shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                {createTicketMutation.isPending ? 'Logging Ticket...' : 'Submit Support Request'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: TICKET INSPECTION & DETAILS */}
      {detailModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                  {detailModalTicket.id.toUpperCase()}
                </span>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', getSeverityStyle(detailModalTicket.severity))}>
                  {detailModalTicket.severity}
                </span>
                <Badge status={detailModalTicket.status} />
              </div>
              <button
                onClick={() => setDetailModalTicket(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {detailModalTicket.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {detailModalTicket.description}
                </p>
              </div>

              {/* SLA Target Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Assigned Unit</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {detailModalTicket.assignedTeam || 'SUPPORT_TIER_1'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Logged On</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatDateTime(detailModalTicket.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Resolution Target</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatDateTime(detailModalTicket.resolutionDeadline)}
                  </span>
                </div>
              </div>

              {/* Resolution Notes if Resolved */}
              {detailModalTicket.resolutionNotes && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-1">
                  <span className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Resolution Notes:
                  </span>
                  <p className="text-xs text-emerald-900 dark:text-emerald-200 italic">
                    {detailModalTicket.resolutionNotes}
                  </p>
                </div>
              )}

              {/* Comments / Audit Thread */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Activity &amp; Escalation Log
                </span>
                {Array.isArray(detailModalTicket.comments) && detailModalTicket.comments.length > 0 ? (
                  <div className="space-y-2">
                    {detailModalTicket.comments.map((cmt) => (
                      <div key={cmt.id} className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{cmt.authorEmail}</span>
                          <span>{formatDateTime(cmt.createdAt)}</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200">{cmt.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-xs">No comments recorded on this thread yet.</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEscalateModalOpen(true)}
                  className="w-full sm:w-auto min-w-[195px] h-10 px-4 text-xs font-bold justify-center flex items-center gap-1.5 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 cursor-pointer shadow-2xs"
                >
                  <Flame className="w-3.5 h-3.5" /> Escalate to Team
                </Button>
              </div>

              <div className="w-full sm:w-auto">
                <Button
                  size="sm"
                  onClick={() => {
                    setNewStatus(detailModalTicket.status === 'RESOLVED' ? 'CLOSED' : 'RESOLVED');
                    setResolutionNotes(detailModalTicket.resolutionNotes || '');
                    setStatusModalOpen(true);
                  }}
                  className="w-full sm:w-auto min-w-[195px] h-10 px-4 text-xs font-bold justify-center flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Update Status
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: ESCALATE TICKET */}
      {escalateModalOpen && detailModalTicket && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              Escalate Ticket #{detailModalTicket.id.toUpperCase()}
            </h3>
            <p className="text-slate-400 text-[11px]">
              Transfer responsibility of this ticket to a specialized committee or technical squad.
            </p>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Target Team *</label>
              <select
                value={targetTeam}
                onChange={(e) => setTargetTeam(e.target.value as EscalationTeam)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200"
              >
                <option value="ENGINEERING">Engineering &amp; Core Integrations</option>
                <option value="RISK_COMMITTEE">Risk Management &amp; Policy Committee</option>
                <option value="TREASURY">Treasury &amp; Disbursement Desk</option>
                <option value="OPERATIONS">Branch Operations Manager</option>
                <option value="COMPLIANCE">Legal &amp; Regulatory Compliance</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Escalation Justification *</label>
              <textarea
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                rows={3}
                placeholder="Reason why this inquiry requires senior or specialized department action..."
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-700 dark:text-slate-200"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEscalateModalOpen(false)}
                className="w-full sm:w-auto min-w-[170px] h-10 px-4 text-xs font-bold justify-center cursor-pointer shadow-2xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!escalateReason.trim() || escalateMutation.isPending}
                onClick={() => escalateMutation.mutate()}
                className="w-full sm:w-auto min-w-[170px] h-10 px-4 text-xs font-bold justify-center bg-amber-600 hover:bg-amber-700 text-white shadow-sm cursor-pointer"
              >
                {escalateMutation.isPending ? 'Escalating...' : 'Confirm Escalation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: UPDATE TICKET STATUS */}
      {statusModalOpen && detailModalTicket && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Update Status for #{detailModalTicket.id.toUpperCase()}
            </h3>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">New Workflow Status *</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200"
              >
                <option value="IN_PROGRESS">IN PROGRESS (Acknowledged)</option>
                <option value="RESOLVED">RESOLVED (Action Complete)</option>
                <option value="CLOSED">CLOSED (Final Archive)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Resolution Summary / Notes</label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
                placeholder="Action taken to address this ticket (e.g. KYC manual override approved, connector restarted)..."
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-700 dark:text-slate-200"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setStatusModalOpen(false)}
                className="w-full sm:w-auto min-w-[170px] h-10 px-4 text-xs font-bold justify-center cursor-pointer shadow-2xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate()}
                className="w-full sm:w-auto min-w-[170px] h-10 px-4 text-xs font-bold justify-center bg-[#2563EB] hover:bg-blue-700 text-white shadow-sm cursor-pointer"
              >
                {updateStatusMutation.isPending ? 'Saving...' : 'Save Status'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
