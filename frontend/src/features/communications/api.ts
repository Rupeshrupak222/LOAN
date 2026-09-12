import { api } from '@/lib/api';
import type {
  BorrowerNotification,
  CommunicationChannel,
  CommunicationDashboardMetrics,
  CommunicationEventCode,
  CommunicationMessage,
  CommunicationPolicy,
  CommunicationTemplate,
  CustomerCommunicationPreference,
  DeliveryStatus,
  GrievanceComplaint,
  LanguageCode,
  MessageCategory,
  StaffTaskNotification,
  SupportCategory,
  SupportDashboardMetrics,
  SupportMessage,
  SupportPriority,
  SupportTicket,
  TemplateStatus,
  TicketMessageType,
  TicketStatus,
} from './types';

export const communicationApi = {
  // 1. Dashboard & Operations Overview
  getDashboard: async (): Promise<{
    communications: CommunicationDashboardMetrics;
    support: SupportDashboardMetrics;
    recentMessages: CommunicationMessage[];
  }> => {
    const res = await api.get('/communications/dashboard');
    return res.data?.data;
  },

  // 2. Template Studio
  getTemplates: async (params?: {
    channel?: CommunicationChannel;
    eventCode?: CommunicationEventCode;
    status?: TemplateStatus;
    language?: LanguageCode;
  }): Promise<CommunicationTemplate[]> => {
    const res = await api.get('/communications/templates', { params });
    return res.data?.data || [];
  },

  getTemplateById: async (id: string): Promise<CommunicationTemplate> => {
    const res = await api.get(`/communications/templates/${id}`);
    return res.data?.data;
  },

  createTemplate: async (payload: {
    name: string;
    code: string;
    eventCode: CommunicationEventCode;
    channel: CommunicationChannel;
    language?: LanguageCode;
    category?: MessageCategory;
    subject?: string;
    body: string;
    dltTemplateId?: string;
    dltSenderId?: string;
    ctaUrl?: string;
  }): Promise<CommunicationTemplate> => {
    const res = await api.post('/communications/templates', payload);
    return res.data?.data;
  },

  updateTemplate: async (
    id: string,
    payload: Partial<{
      name: string;
      subject: string;
      body: string;
      language: LanguageCode;
      category: MessageCategory;
      dltTemplateId: string;
      dltSenderId: string;
      ctaUrl: string;
      status: TemplateStatus;
    }>
  ): Promise<CommunicationTemplate> => {
    const res = await api.put(`/communications/templates/${id}`, payload);
    return res.data?.data;
  },

  previewTemplate: async (payload: {
    templateId?: string;
    rawBody?: string;
    rawSubject?: string;
    data?: Record<string, any>;
  }): Promise<{ subject?: string; body: string; missingPlaceholders: string[] }> => {
    const res = await api.post('/communications/templates/preview', payload);
    return res.data?.data;
  },

  // 3. Message Outbox & Delivery History
  getMessages: async (params?: {
    customerId?: string;
    channel?: CommunicationChannel;
    status?: DeliveryStatus;
    eventCode?: CommunicationEventCode;
  }): Promise<CommunicationMessage[]> => {
    const res = await api.get('/communications/messages', { params });
    return res.data?.data || [];
  },

  getMessageById: async (id: string): Promise<CommunicationMessage> => {
    const res = await api.get(`/communications/messages/${id}`);
    return res.data?.data;
  },

  retryMessage: async (id: string): Promise<CommunicationMessage> => {
    const res = await api.post(`/communications/messages/${id}/retry`);
    return res.data?.data;
  },

  dispatchDirectMessage: async (payload: {
    customerId: string;
    recipientIdentifier: string;
    recipientName?: string;
    channel: CommunicationChannel;
    eventCode: CommunicationEventCode;
    category?: MessageCategory;
    priority?: string;
    subject?: string;
    body: string;
    actionUrl?: string;
  }): Promise<CommunicationMessage> => {
    const res = await api.post('/communications/dispatch', payload);
    return res.data?.data;
  },

  triggerEvent: async (payload: {
    customerId: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    eventCode: CommunicationEventCode;
    sourceEntityType?: string;
    sourceEntityId: string;
    preferredLanguage?: LanguageCode;
    data: Record<string, any>;
  }): Promise<any> => {
    const res = await api.post('/communications/events/trigger', payload);
    return res.data?.data;
  },

  // 4. Communication Policies
  getPolicies: async (): Promise<CommunicationPolicy[]> => {
    const res = await api.get('/communications/policies');
    return res.data?.data || [];
  },

  savePolicy: async (payload: Partial<CommunicationPolicy>): Promise<CommunicationPolicy> => {
    const res = await api.post('/communications/policies', payload);
    return res.data?.data;
  },

  // 5. Customer Preferences
  getCustomerPreference: async (customerId: string): Promise<CustomerCommunicationPreference> => {
    const res = await api.get(`/communications/preferences/${customerId}`);
    return res.data?.data;
  },

  updateCustomerPreference: async (
    customerId: string,
    payload: Partial<{
      preferredLanguage: LanguageCode;
      channels: Partial<Record<CommunicationChannel, boolean>>;
      categories: Partial<Record<MessageCategory, boolean>>;
      optedOutChannels: CommunicationChannel[];
      quietHoursCustom?: { enabled: boolean; start: string; end: string };
    }>
  ): Promise<CustomerCommunicationPreference> => {
    const res = await api.put(`/communications/preferences/${customerId}`, payload);
    return res.data?.data;
  },

  listPreferences: async (): Promise<CustomerCommunicationPreference[]> => {
    const res = await api.get('/communications/preferences');
    return res.data?.data || [];
  },

  // 6. Borrower & Staff Notifications
  getBorrowerNotifications: async (
    customerId: string,
    params?: { isRead?: boolean; limit?: number }
  ): Promise<{ notifications: BorrowerNotification[]; unreadCount: number; totalCount: number }> => {
    const res = await api.get(`/communications/notifications/borrower/${customerId}`, { params });
    return res.data?.data;
  },

  markBorrowerNotificationRead: async (
    customerId: string,
    notificationId: string
  ): Promise<BorrowerNotification> => {
    const res = await api.post(`/communications/notifications/borrower/${customerId}/read/${notificationId}`);
    return res.data?.data;
  },

  markAllBorrowerNotificationsRead: async (customerId: string): Promise<{ markedReadCount: number }> => {
    const res = await api.post(`/communications/notifications/borrower/${customerId}/read-all`);
    return res.data?.data;
  },

  getStaffNotifications: async (params?: { isActioned?: boolean }): Promise<{
    notifications: StaffTaskNotification[];
    pendingCount: number;
    totalCount: number;
  }> => {
    const res = await api.get('/communications/notifications/staff', { params });
    return res.data?.data;
  },

  markStaffNotificationActioned: async (id: string): Promise<StaffTaskNotification> => {
    const res = await api.post(`/communications/notifications/staff/${id}/action`);
    return res.data?.data;
  },

  // 7. Support Tickets & Conversations
  getSupportTickets: async (params?: {
    customerId?: string;
    status?: TicketStatus;
    priority?: SupportPriority;
    category?: SupportCategory;
    assignedAgentId?: string;
    isBreached?: boolean;
  }): Promise<SupportTicket[]> => {
    const res = await api.get('/communications/support/tickets', { params });
    return res.data?.data || [];
  },

  getSupportTicketById: async (
    id: string,
    isCustomerView?: boolean
  ): Promise<{ ticket: SupportTicket; messages: SupportMessage[] }> => {
    const res = await api.get(`/communications/support/tickets/${id}`, {
      params: { customerView: isCustomerView },
    });
    return res.data?.data;
  },

  createSupportTicket: async (payload: {
    customerId: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    subject: string;
    description: string;
    category: SupportCategory;
    priority?: SupportPriority;
    loanId?: string;
    applicationId?: string;
  }): Promise<{ ticket: SupportTicket; initialMessage: SupportMessage }> => {
    const res = await api.post('/communications/support/tickets', payload);
    return res.data?.data;
  },

  addTicketMessage: async (
    ticketId: string,
    payload: {
      messageType: TicketMessageType;
      body: string;
      isInternalOnly?: boolean;
      attachments?: Array<{ name: string; url: string; sizeBytes: number }>;
    }
  ): Promise<{ message: SupportMessage; updatedTicket: SupportTicket }> => {
    const res = await api.post(`/communications/support/tickets/${ticketId}/messages`, payload);
    return res.data?.data;
  },

  assignTicket: async (
    ticketId: string,
    payload: { agentId?: string; agentName?: string; team?: string }
  ): Promise<SupportTicket> => {
    const res = await api.post(`/communications/support/tickets/${ticketId}/assign`, payload);
    return res.data?.data;
  },

  escalateTicket: async (
    ticketId: string,
    payload: { reason: string; targetLevel?: number }
  ): Promise<SupportTicket> => {
    const res = await api.post(`/communications/support/tickets/${ticketId}/escalate`, payload);
    return res.data?.data;
  },

  updateTicketStatus: async (
    ticketId: string,
    payload: {
      status: TicketStatus;
      resolutionNote?: string;
      csatScore?: number;
      csatFeedback?: string;
    }
  ): Promise<SupportTicket> => {
    const res = await api.post(`/communications/support/tickets/${ticketId}/status`, payload);
    return res.data?.data;
  },

  // 8. Complaints & Grievance Redressal
  getComplaints: async (params?: { customerId?: string; status?: string }): Promise<GrievanceComplaint[]> => {
    const res = await api.get('/communications/support/complaints', { params });
    return res.data?.data || [];
  },

  getComplaintById: async (id: string): Promise<GrievanceComplaint> => {
    const res = await api.get(`/communications/support/complaints/${id}`);
    return res.data?.data;
  },

  registerComplaint: async (payload: {
    customerId: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    complaintType: string;
    rootCauseCategory?: string;
    details: string;
    demandedRemedy?: string;
    loanId?: string;
    applicationId?: string;
  }): Promise<GrievanceComplaint> => {
    const res = await api.post('/communications/support/complaints', payload);
    return res.data?.data;
  },

  resolveComplaint: async (
    id: string,
    payload: {
      status?: 'RESOLVED_SATISFIED' | 'RESOLVED_REJECTED' | 'SETTLED_WITH_CONCESSION';
      resolutionDetails: string;
      resolutionDecision: 'UPHELD' | 'PARTIALLY_UPHELD' | 'REJECTED' | 'SETTLED';
      compensationAmount?: number;
    }
  ): Promise<GrievanceComplaint> => {
    const res = await api.post(`/communications/support/complaints/${id}/resolve`, payload);
    return res.data?.data;
  },
};
