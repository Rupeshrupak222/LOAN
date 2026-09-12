import {
  SupportCategory,
  SupportMessage,
  SupportPriority,
  SupportTicket,
  TicketMessageType,
  TicketStatus,
} from './communication.types';
import { defaultSlaService, SlaService } from './sla.service';

export class TicketService {
  private tickets: Map<string, SupportTicket> = new Map();
  private messages: Map<string, SupportMessage[]> = new Map();
  private ticketSequence: number = 1000;

  constructor(private slaService: SlaService = defaultSlaService) {
    this.seedSampleTickets();
  }

  /**
   * Generates a sequential, professional ticket identifier
   */
  private generateTicketNumber(): string {
    this.ticketSequence++;
    const year = new Date().getFullYear();
    return `TKT-${year}-${this.ticketSequence}`;
  }

  /**
   * Create a new support ticket
   */
  public createTicket(params: {
    tenantId: string;
    customerId: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    subject: string;
    description: string;
    category: SupportCategory;
    priority?: SupportPriority;
    applicationId?: string;
    loanId?: string;
    tags?: string[];
    sourceChannel?: 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PORTAL' | 'PHONE';
    createdBy?: string;
  }): { ticket: SupportTicket; initialMessage: SupportMessage } {
    const ticketId = `TKT_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const ticketNumber = this.generateTicketNumber();
    const now = new Date().toISOString();
    const priority = params.priority || 'MEDIUM';

    // Calculate SLAs
    const slaDates = this.slaService.calculateDueDates(
      params.tenantId,
      params.category,
      priority,
      new Date()
    );

    const ticket: SupportTicket = {
      id: ticketId,
      ticketNumber,
      tenantId: params.tenantId,
      customerId: params.customerId,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      subject: params.subject,
      category: params.category,
      priority,
      status: 'OPEN',
      escalationLevel: 0,
      applicationId: params.applicationId,
      loanId: params.loanId,
      tags: params.tags || [],
      sla: {
        firstResponseDueAt: slaDates.firstResponseDueAt,
        resolutionDueAt: slaDates.resolutionDueAt,
        firstResponseTargetHours: slaDates.firstResponseTargetHours,
        resolutionTargetHours: slaDates.resolutionTargetHours,
        isResponseBreached: false,
        isResolutionBreached: false,
      },
      sourceChannel: params.sourceChannel || 'PORTAL',
      messageCount: 1,
      createdAt: now,
      updatedAt: now,
    };

    // Create the initial customer message
    const initialMsgId = `MSG_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const initialMessage: SupportMessage = {
      id: initialMsgId,
      ticketId,
      tenantId: params.tenantId,
      senderType: 'CUSTOMER',
      senderId: params.customerId,
      senderName: params.customerName,
      messageType: 'CUSTOMER_MESSAGE',
      body: params.description,
      isInternalOnly: false,
      createdAt: now,
    };

    this.tickets.set(ticketId, ticket);
    this.messages.set(ticketId, [initialMessage]);

    return { ticket, initialMessage };
  }

  /**
   * Add a message to a ticket conversation (distinguishing customer message vs internal staff note)
   */
  public addMessage(params: {
    ticketId: string;
    senderType: 'CUSTOMER' | 'AGENT' | 'SYSTEM';
    senderId: string;
    senderName: string;
    messageType: TicketMessageType;
    body: string;
    isInternalOnly?: boolean;
    attachments?: Array<{ name: string; url: string; sizeBytes: number }>;
  }): { message: SupportMessage; updatedTicket: SupportTicket } {
    const ticket = this.tickets.get(params.ticketId);
    if (!ticket) {
      throw new Error(`Ticket with id '${params.ticketId}' not found`);
    }

    const now = new Date().toISOString();
    const msgId = `MSG_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Internal notes are strictly internal
    const isInternal = params.messageType === 'INTERNAL_NOTE' || !!params.isInternalOnly;

    const message: SupportMessage = {
      id: msgId,
      ticketId: ticket.id,
      tenantId: ticket.tenantId,
      senderType: params.senderType,
      senderId: params.senderId,
      senderName: params.senderName,
      messageType: params.messageType,
      body: params.body,
      attachments: params.attachments,
      isInternalOnly: isInternal,
      createdAt: now,
    };

    const thread = this.messages.get(ticket.id) || [];
    thread.push(message);
    this.messages.set(ticket.id, thread);

    // Update ticket state
    ticket.messageCount = thread.length;
    ticket.updatedAt = now;

    // If agent sent a public message, update firstResponseAt if not already recorded
    if (params.senderType === 'AGENT' && !isInternal) {
      if (!ticket.firstResponseAt) {
        ticket.firstResponseAt = now;
      }
      if (ticket.status === 'OPEN') {
        ticket.status = 'IN_PROGRESS';
      }
    } else if (params.senderType === 'CUSTOMER') {
      if (ticket.status === 'WAITING_FOR_CUSTOMER') {
        ticket.status = 'IN_PROGRESS';
      }
    }

    // Recalculate SLA state
    const slaStatus = this.slaService.evaluateTicketSla(ticket);
    ticket.sla.isResponseBreached = slaStatus.isResponseBreached;
    ticket.sla.isResolutionBreached = slaStatus.isResolutionBreached;

    this.tickets.set(ticket.id, ticket);
    return { message, updatedTicket: ticket };
  }

  /**
   * Assign a support ticket to an agent or team
   */
  public assignTicket(params: {
    ticketId: string;
    agentId?: string;
    agentName?: string;
    team?: string;
    assignedBy: string;
  }): SupportTicket {
    const ticket = this.tickets.get(params.ticketId);
    if (!ticket) {
      throw new Error(`Ticket '${params.ticketId}' not found`);
    }

    const now = new Date().toISOString();
    ticket.assignedAgentId = params.agentId || ticket.assignedAgentId;
    ticket.assignedAgentName = params.agentName || ticket.assignedAgentName;
    ticket.assignedTeam = params.team || ticket.assignedTeam;
    ticket.updatedAt = now;

    if (ticket.status === 'OPEN') {
      ticket.status = 'IN_PROGRESS';
    }

    // Add internal note about assignment
    this.addMessage({
      ticketId: ticket.id,
      senderType: 'SYSTEM',
      senderId: params.assignedBy,
      senderName: 'System Router',
      messageType: 'INTERNAL_NOTE',
      body: `Ticket assigned to ${params.agentName || params.agentId || 'team'} (${params.team || 'General'}) by ${params.assignedBy}`,
      isInternalOnly: true,
    });

    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  /**
   * Escalate ticket to higher tier or grievance officer
   */
  public escalateTicket(params: {
    ticketId: string;
    reason: string;
    escalatedBy: string;
    targetLevel?: number;
  }): SupportTicket {
    const ticket = this.tickets.get(params.ticketId);
    if (!ticket) {
      throw new Error(`Ticket '${params.ticketId}' not found`);
    }

    const now = new Date().toISOString();
    ticket.escalationLevel = params.targetLevel !== undefined ? params.targetLevel : (ticket.escalationLevel || 0) + 1;
    ticket.escalatedAt = now;
    ticket.escalationReason = params.reason;
    ticket.status = 'ESCALATED';
    ticket.priority = 'URGENT';
    ticket.updatedAt = now;

    this.addMessage({
      ticketId: ticket.id,
      senderType: 'SYSTEM',
      senderId: params.escalatedBy,
      senderName: 'Escalation Engine',
      messageType: 'INTERNAL_NOTE',
      body: `⚠️ TICKET ESCALATED to Level ${ticket.escalationLevel}. Reason: ${params.reason}`,
      isInternalOnly: true,
    });

    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  /**
   * Resolve or Close a ticket
   */
  public updateStatus(params: {
    ticketId: string;
    status: TicketStatus;
    resolutionNote?: string;
    updatedBy: string;
    csatScore?: number;
    csatFeedback?: string;
  }): SupportTicket {
    const ticket = this.tickets.get(params.ticketId);
    if (!ticket) {
      throw new Error(`Ticket '${params.ticketId}' not found`);
    }

    const now = new Date().toISOString();
    ticket.status = params.status;
    ticket.updatedAt = now;

    if (params.status === 'RESOLVED' || params.status === 'CLOSED') {
      ticket.resolvedAt = now;
      ticket.resolutionNote = params.resolutionNote || ticket.resolutionNote;
      if (params.csatScore) {
        ticket.csatScore = params.csatScore;
        ticket.csatFeedback = params.csatFeedback;
      }
    }

    if (params.resolutionNote) {
      this.addMessage({
        ticketId: ticket.id,
        senderType: 'AGENT',
        senderId: params.updatedBy,
        senderName: 'Support Agent',
        messageType: 'CUSTOMER_MESSAGE',
        body: `Resolution: ${params.resolutionNote}`,
        isInternalOnly: false,
      });
    }

    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  /**
   * Get ticket details and conversation thread.
   * If isCustomerView is true, STRICTLY OMIT all INTERNAL_NOTES.
   */
  public getTicketWithThread(
    ticketId: string,
    isCustomerView: boolean = false
  ): { ticket: SupportTicket; messages: SupportMessage[] } | undefined {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return undefined;

    // Refresh SLA breach calculation on access
    const slaStatus = this.slaService.evaluateTicketSla(ticket);
    ticket.sla.isResponseBreached = slaStatus.isResponseBreached;
    ticket.sla.isResolutionBreached = slaStatus.isResolutionBreached;

    let thread = this.messages.get(ticketId) || [];

    if (isCustomerView) {
      thread = thread.filter((m) => !m.isInternalOnly && m.messageType !== 'INTERNAL_NOTE');
    }

    return {
      ticket,
      messages: thread,
    };
  }

  public listTickets(params?: {
    tenantId?: string;
    customerId?: string;
    status?: TicketStatus;
    priority?: SupportPriority;
    category?: SupportCategory;
    assignedAgentId?: string;
    isBreached?: boolean;
  }): SupportTicket[] {
    let list = Array.from(this.tickets.values());

    if (params?.tenantId && params.tenantId !== 'ALL') {
      list = list.filter((t) => t.tenantId === params.tenantId || t.tenantId === 'DEFAULT');
    }
    if (params?.customerId) {
      list = list.filter((t) => t.customerId === params.customerId);
    }
    if (params?.status) {
      list = list.filter((t) => t.status === params.status);
    }
    if (params?.priority) {
      list = list.filter((t) => t.priority === params.priority);
    }
    if (params?.category) {
      list = list.filter((t) => t.category === params.category);
    }
    if (params?.assignedAgentId) {
      list = list.filter((t) => t.assignedAgentId === params.assignedAgentId);
    }
    if (params?.isBreached !== undefined) {
      list = list.filter(
        (t) =>
          t.sla.isResponseBreached === params.isBreached ||
          t.sla.isResolutionBreached === params.isBreached
      );
    }

    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private seedSampleTickets(): void {
    const sample = this.createTicket({
      tenantId: 'DEFAULT',
      customerId: 'CUST-DEMO-001',
      customerName: 'Aarav Sharma',
      customerEmail: 'aarav.sharma@example.com',
      customerPhone: '+919876543210',
      subject: 'Disbursement not reflecting in HDFC bank account',
      description: 'My loan #LOAN-2026-9182 was approved 2 hours ago, but funds have not credited yet. Please check the UTR status.',
      category: 'DISBURSEMENT_QUERY',
      priority: 'HIGH',
      loanId: 'LOAN-2026-9182',
      sourceChannel: 'PORTAL',
    });

    this.addMessage({
      ticketId: sample.ticket.id,
      senderType: 'AGENT',
      senderId: 'USR_OPS_001',
      senderName: 'Priya Verma (Ops Support)',
      messageType: 'CUSTOMER_MESSAGE',
      body: 'Dear Aarav, we checked with our banking partner. The UTR is pending banking settlement window and will reflect by 3:00 PM today.',
      isInternalOnly: false,
    });

    this.addMessage({
      ticketId: sample.ticket.id,
      senderType: 'AGENT',
      senderId: 'USR_OPS_001',
      senderName: 'Priya Verma (Ops Support)',
      messageType: 'INTERNAL_NOTE',
      body: 'ICICI payout gateway reported queue congestion. UTR batch #4819 scheduled for 14:45 IST.',
      isInternalOnly: true,
    });
  }
}

export const defaultTicketService = new TicketService();
