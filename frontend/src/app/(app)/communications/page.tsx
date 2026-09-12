'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  Mail,
  FileCode,
  Sliders,
  Users,
  Headphones,
  Scale,
  Bell,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { communicationApi } from '@/features/communications/api';
import type {
  CommunicationTemplate,
  CommunicationPolicy,
  CustomerCommunicationPreference,
  SupportTicket,
  SupportMessage,
} from '@/features/communications/types';
import { CommunicationOverviewView } from '@/features/communications/components/CommunicationOverviewView';
import { MessageHistoryView } from '@/features/communications/components/MessageHistoryView';
import { TemplateStudioView } from '@/features/communications/components/TemplateStudioView';
import { PolicyManagerView } from '@/features/communications/components/PolicyManagerView';
import { CustomerPreferencesView } from '@/features/communications/components/CustomerPreferencesView';
import { SupportTicketsView } from '@/features/communications/components/SupportTicketsView';
import { TicketDetailModal } from '@/features/communications/components/TicketDetailModal';
import { ComplaintsDeskView } from '@/features/communications/components/ComplaintsDeskView';
import { BorrowerNotificationCenter } from '@/features/communications/components/BorrowerNotificationCenter';
import { useToast } from '@/lib/toast';

type TabKey =
  | 'overview'
  | 'messages'
  | 'templates'
  | 'policies'
  | 'preferences'
  | 'support'
  | 'complaints'
  | 'borrower_notifs';

export default function CommunicationsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Active Ticket Drawer State
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Active Borrower Customer State for Notification Center
  const [selectedCustId, setSelectedCustId] = useState<string>('CUST-DEMO-001');

  // =========================================================================
  // Data Queries
  // =========================================================================

  const dashboardQuery = useQuery({
    queryKey: ['communications', 'dashboard'],
    queryFn: () => communicationApi.getDashboard(),
    refetchInterval: 15000,
  });

  const messagesQuery = useQuery({
    queryKey: ['communications', 'messages'],
    queryFn: () => communicationApi.getMessages(),
  });

  const templatesQuery = useQuery({
    queryKey: ['communications', 'templates'],
    queryFn: () => communicationApi.getTemplates(),
  });

  const policiesQuery = useQuery({
    queryKey: ['communications', 'policies'],
    queryFn: () => communicationApi.getPolicies(),
  });

  const preferencesQuery = useQuery({
    queryKey: ['communications', 'preferences'],
    queryFn: () => communicationApi.listPreferences(),
  });

  const ticketsQuery = useQuery({
    queryKey: ['communications', 'tickets'],
    queryFn: () => communicationApi.getSupportTickets(),
  });

  const complaintsQuery = useQuery({
    queryKey: ['communications', 'complaints'],
    queryFn: () => communicationApi.getComplaints(),
  });

  const borrowerNotifsQuery = useQuery({
    queryKey: ['communications', 'notifications', selectedCustId],
    queryFn: () => communicationApi.getBorrowerNotifications(selectedCustId),
  });

  const ticketDetailQuery = useQuery({
    queryKey: ['communications', 'ticket_detail', selectedTicketId],
    queryFn: () => (selectedTicketId ? communicationApi.getSupportTicketById(selectedTicketId) : null),
    enabled: !!selectedTicketId,
  });

  // =========================================================================
  // Mutations
  // =========================================================================

  const triggerEventMutation = useMutation({
    mutationFn: (eventCode: string) =>
      communicationApi.triggerEvent({
        customerId: 'CUST-DEMO-001',
        customerName: 'Aarav Sharma',
        customerPhone: '+919876543210',
        customerEmail: 'aarav.sharma@example.com',
        eventCode: eventCode as any,
        sourceEntityType: 'LOAN',
        sourceEntityId: 'LOAN-2026-9182',
        data: {
          customerName: 'Aarav Sharma',
          amount: '50,000',
          loanId: 'LOAN-2026-9182',
          applicationId: 'APP-84920',
          disbursedAmount: '50,000',
          bankAccountLast4: '4892',
          utrNumber: 'HDFC00192837482',
          firstEmiDate: '15-Oct-2026',
          dueDate: '15-Oct-2026',
          emiAmount: '4,250',
          amountPaid: '4,250',
          paymentRef: 'PAY_9182910',
          remainingPrincipal: '45,750',
          overdueAmount: '4,250',
          dpd: '5',
          payLink: 'https://pay.adyapan.finance/LOAN-2026-9182',
          reason: 'Aadhaar name mismatch',
          ctaUrl: 'https://app.adyapan.finance/offers',
          offeredAmount: '75,000',
          roi: '14.5',
          expiryDate: '18-Sep-2026',
          signingUrl: 'https://esign.adyapan.finance/sign/LOAN-2026-9182',
          complaintNumber: 'GRV-2026-0512',
          officerName: 'Suresh Menon (Principal Nodal Officer)',
          targetDate: '19-Sep-2026',
          applicantName: 'Aarav Sharma',
          approvalLevel: 'Level 2 Sanction Authority',
        },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      toast.success('Domain event processed and dispatched successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to trigger domain event');
    },
  });

  const retryMessageMutation = useMutation({
    mutationFn: (msgId: string) => communicationApi.retryMessage(msgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      toast.success('Message retry executed');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to retry message');
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: (payload: any) => communicationApi.createTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'templates'] });
      toast.success('Template created successfully');
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      communicationApi.updateTemplate(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'templates'] });
      toast.success('Template updated (new immutable version published)');
    },
  });

  const savePolicyMutation = useMutation({
    mutationFn: (payload: Partial<CommunicationPolicy>) => communicationApi.savePolicy(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'policies'] });
      toast.success('Routing policy updated');
    },
  });

  const savePreferenceMutation = useMutation({
    mutationFn: ({ customerId, payload }: { customerId: string; payload: Partial<CustomerCommunicationPreference> }) =>
      communicationApi.updateCustomerPreference(customerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'preferences'] });
      toast.success('Customer communication preferences saved');
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: (payload: any) => communicationApi.createSupportTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'tickets'] });
      toast.success('Support ticket created');
    },
  });

  const sendTicketMessageMutation = useMutation({
    mutationFn: ({ ticketId, payload }: { ticketId: string; payload: any }) =>
      communicationApi.addTicketMessage(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'ticket_detail'] });
      queryClient.invalidateQueries({ queryKey: ['communications', 'tickets'] });
      toast.success('Message sent to ticket conversation');
    },
  });

  const assignTicketMutation = useMutation({
    mutationFn: ({ ticketId, payload }: { ticketId: string; payload: any }) =>
      communicationApi.assignTicket(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      toast.success('Ticket assigned successfully');
    },
  });

  const escalateTicketMutation = useMutation({
    mutationFn: ({ ticketId, payload }: { ticketId: string; payload: any }) =>
      communicationApi.escalateTicket(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      toast.success('Ticket escalated');
    },
  });

  const updateTicketStatusMutation = useMutation({
    mutationFn: ({ ticketId, payload }: { ticketId: string; payload: any }) =>
      communicationApi.updateTicketStatus(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      toast.success('Ticket status updated');
    },
  });

  const registerComplaintMutation = useMutation({
    mutationFn: (payload: any) => communicationApi.registerComplaint(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'complaints'] });
      toast.success('Grievance complaint registered with Grievance Officer');
    },
  });

  const resolveComplaintMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      communicationApi.resolveComplaint(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'complaints'] });
      toast.success('Grievance complaint resolution committed');
    },
  });

  const markBorrowerNotifReadMutation = useMutation({
    mutationFn: (notifId: string) =>
      communicationApi.markBorrowerNotificationRead(selectedCustId, notifId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'notifications', selectedCustId] });
    },
  });

  const markAllBorrowerNotifsReadMutation = useMutation({
    mutationFn: () => communicationApi.markAllBorrowerNotificationsRead(selectedCustId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'notifications', selectedCustId] });
      toast.success('All notifications marked as read');
    },
  });

  // =========================================================================
  // Tabs Definition
  // =========================================================================

  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode; badge?: number }> = [
    { key: 'overview', label: 'Operations Overview', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'messages', label: 'Outbox & Delivery Logs', icon: <Mail className="w-4 h-4" />, badge: messagesQuery.data?.length },
    { key: 'templates', label: 'Template Studio', icon: <FileCode className="w-4 h-4" />, badge: templatesQuery.data?.length },
    { key: 'policies', label: 'Routing Policies & Quiet Hours', icon: <Sliders className="w-4 h-4" /> },
    { key: 'preferences', label: 'Customer Preferences', icon: <Users className="w-4 h-4" /> },
    {
      key: 'support',
      label: 'Support Tickets Desk',
      icon: <Headphones className="w-4 h-4" />,
      badge: ticketsQuery.data?.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
    },
    { key: 'complaints', label: 'Grievance Redressal (RBI)', icon: <Scale className="w-4 h-4" />, badge: complaintsQuery.data?.filter((c) => !c.resolvedAt).length },
    { key: 'borrower_notifs', label: 'Borrower Inbox Hub', icon: <Bell className="w-4 h-4" />, badge: borrowerNotifsQuery.data?.unreadCount },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-6 h-6" />
              </span>
              Communication, Notifications & Support Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Phase 13
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Enterprise multi-channel dispatch (SMS, WhatsApp, Email, Push, In-App), DLT template versioning, regulatory quiet hours guardrails, and customer support desk.
          </p>
        </div>

        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['communications'] })}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Engine
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-semibold whitespace-nowrap transition border-b-2 ${
                isActive
                  ? 'border-indigo-500 text-white bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 ? (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <CommunicationOverviewView
            commMetrics={dashboardQuery.data?.communications}
            supportMetrics={dashboardQuery.data?.support}
            recentMessages={dashboardQuery.data?.recentMessages}
            isLoading={dashboardQuery.isLoading}
            onRefresh={() => dashboardQuery.refetch()}
            onTriggerTestEvent={(eventCode) => triggerEventMutation.mutateAsync(eventCode)}
          />
        )}

        {activeTab === 'messages' && (
          <MessageHistoryView
            messages={messagesQuery.data || []}
            isLoading={messagesQuery.isLoading}
            onRefresh={() => messagesQuery.refetch()}
            onRetry={async (msgId) => { await retryMessageMutation.mutateAsync(msgId); }}
          />
        )}

        {activeTab === 'templates' && (
          <TemplateStudioView
            templates={templatesQuery.data || []}
            isLoading={templatesQuery.isLoading}
            onRefresh={() => templatesQuery.refetch()}
            onCreateTemplate={async (payload) => { await createTemplateMutation.mutateAsync(payload); }}
            onUpdateTemplate={async (id, payload) => { await updateTemplateMutation.mutateAsync({ id, payload }); }}
            onPreviewTemplate={(payload) => communicationApi.previewTemplate(payload)}
          />
        )}

        {activeTab === 'policies' && (
          <PolicyManagerView
            policies={policiesQuery.data || []}
            isLoading={policiesQuery.isLoading}
            onRefresh={() => policiesQuery.refetch()}
            onSavePolicy={async (payload) => { await savePolicyMutation.mutateAsync(payload); }}
          />
        )}

        {activeTab === 'preferences' && (
          <CustomerPreferencesView
            preferences={preferencesQuery.data || []}
            isLoading={preferencesQuery.isLoading}
            onRefresh={() => preferencesQuery.refetch()}
            onSavePreference={async (customerId, payload) => {
              await savePreferenceMutation.mutateAsync({ customerId, payload });
            }}
          />
        )}

        {activeTab === 'support' && (
          <SupportTicketsView
            tickets={ticketsQuery.data || []}
            isLoading={ticketsQuery.isLoading}
            onRefresh={() => ticketsQuery.refetch()}
            onSelectTicket={(ticket) => setSelectedTicketId(ticket.id)}
            onCreateTicket={async (payload) => { await createTicketMutation.mutateAsync(payload); }}
          />
        )}

        {activeTab === 'complaints' && (
          <ComplaintsDeskView
            complaints={complaintsQuery.data || []}
            isLoading={complaintsQuery.isLoading}
            onRefresh={() => complaintsQuery.refetch()}
            onRegisterComplaint={async (payload) => { await registerComplaintMutation.mutateAsync(payload); }}
            onResolveComplaint={async (id, payload) => { await resolveComplaintMutation.mutateAsync({ id, payload }); }}
          />
        )}

        {activeTab === 'borrower_notifs' && (
          <BorrowerNotificationCenter
            notifications={borrowerNotifsQuery.data?.notifications || []}
            unreadCount={borrowerNotifsQuery.data?.unreadCount || 0}
            isLoading={borrowerNotifsQuery.isLoading}
            selectedCustomerId={selectedCustId}
            onChangeCustomer={(id) => setSelectedCustId(id)}
            onMarkRead={async (id) => { await markBorrowerNotifReadMutation.mutateAsync(id); }}
            onMarkAllRead={async () => { await markAllBorrowerNotifsReadMutation.mutateAsync(); }}
          />
        )}
      </div>

      {/* Ticket Conversation Detail Modal */}
      {selectedTicketId && ticketDetailQuery.data && (
        <TicketDetailModal
          ticket={ticketDetailQuery.data.ticket}
          messages={ticketDetailQuery.data.messages}
          isLoading={ticketDetailQuery.isLoading}
          onClose={() => setSelectedTicketId(null)}
          onSendMessage={async (ticketId, payload) => {
            await sendTicketMessageMutation.mutateAsync({ ticketId, payload });
          }}
          onAssignTicket={async (ticketId, payload) => {
            await assignTicketMutation.mutateAsync({ ticketId, payload });
          }}
          onEscalateTicket={async (ticketId, payload) => {
            await escalateTicketMutation.mutateAsync({ ticketId, payload });
          }}
          onUpdateStatus={async (ticketId, payload) => {
            await updateTicketStatusMutation.mutateAsync({ ticketId, payload });
          }}
        />
      )}
    </div>
  );
}
