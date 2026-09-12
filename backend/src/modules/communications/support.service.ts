import {
  GrievanceComplaint,
  SupportDashboardMetrics,
  SupportCategory,
  SupportPriority,
} from './communication.types';
import { defaultTicketService, TicketService } from './ticket.service';

export class SupportService {
  private complaints: Map<string, GrievanceComplaint> = new Map();
  private complaintSequence: number = 500;

  constructor(private ticketService: TicketService = defaultTicketService) {
    this.seedSampleComplaints();
  }

  private generateComplaintNumber(): string {
    this.complaintSequence++;
    const year = new Date().getFullYear();
    return `GRV-${year}-${this.complaintSequence}`;
  }

  /**
   * Register a formal grievance complaint (Regulatory Compliance)
   */
  public registerComplaint(params: {
    tenantId: string;
    customerId: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    ticketId?: string;
    loanId?: string;
    applicationId?: string;
    complaintType: string;
    rootCauseCategory?: string;
    details: string;
    demandedRemedy?: string;
    registeredBy: string;
  }): GrievanceComplaint {
    const id = `GRV_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const complaintNumber = this.generateComplaintNumber();
    const now = new Date().toISOString();

    // 7 days target resolution per RBI Grievance Redressal norms
    const targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const complaint: GrievanceComplaint = {
      id,
      complaintNumber,
      tenantId: params.tenantId,
      customerId: params.customerId,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      ticketId: params.ticketId,
      loanId: params.loanId,
      applicationId: params.applicationId,
      complaintType: params.complaintType,
      rootCauseCategory: params.rootCauseCategory || 'SERVICING_DELAY',
      status: 'INVESTIGATING',
      escalationTier: 'NODAL_OFFICER',
      details: params.details,
      demandedRemedy: params.demandedRemedy,
      targetResolutionDate: targetDate,
      registeredAt: now,
      updatedAt: now,
    };

    this.complaints.set(id, complaint);
    return complaint;
  }

  /**
   * Resolve a formal grievance complaint with audit decision and compensation records
   */
  public resolveComplaint(params: {
    complaintId: string;
    status: 'RESOLVED_SATISFIED' | 'RESOLVED_REJECTED' | 'SETTLED_WITH_CONCESSION';
    resolutionDetails: string;
    resolutionDecision: 'UPHELD' | 'PARTIALLY_UPHELD' | 'REJECTED' | 'SETTLED';
    compensationAmount?: number;
    resolvedBy: string;
  }): GrievanceComplaint {
    const complaint = this.complaints.get(params.complaintId);
    if (!complaint) {
      throw new Error(`Complaint with id '${params.complaintId}' not found`);
    }

    const now = new Date().toISOString();
    complaint.status = params.status;
    complaint.resolutionDetails = params.resolutionDetails;
    complaint.resolutionDecision = params.resolutionDecision;
    complaint.compensationAmount = params.compensationAmount;
    complaint.resolvedAt = now;
    complaint.updatedAt = now;

    this.complaints.set(complaint.id, complaint);
    return complaint;
  }

  public getComplaintById(id: string): GrievanceComplaint | undefined {
    return this.complaints.get(id);
  }

  public listComplaints(params?: {
    tenantId?: string;
    customerId?: string;
    status?: string;
  }): GrievanceComplaint[] {
    let list = Array.from(this.complaints.values());

    if (params?.tenantId && params.tenantId !== 'ALL') {
      list = list.filter((c) => c.tenantId === params.tenantId || c.tenantId === 'DEFAULT');
    }
    if (params?.customerId) {
      list = list.filter((c) => c.customerId === params.customerId);
    }
    if (params?.status) {
      list = list.filter((c) => c.status === params.status);
    }

    return list.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
  }

  /**
   * Aggregates real-time support operations metrics
   */
  public getDashboardMetrics(tenantId: string = 'DEFAULT'): SupportDashboardMetrics {
    const allTickets = this.ticketService.listTickets({ tenantId });
    const allComplaints = this.listComplaints({ tenantId });

    let openTickets = 0;
    let inProgressTickets = 0;
    let resolvedTickets = 0;
    let closedTickets = 0;
    let escalatedTickets = 0;
    let breachedTickets = 0;

    let totalResponseTimeHours = 0;
    let responseTimeCount = 0;
    let totalResolutionTimeHours = 0;
    let resolutionTimeCount = 0;

    let csatTotal = 0;
    let csatCount = 0;

    const ticketsByCategory: Record<SupportCategory, number> = {
      LOAN_INQUIRY: 0,
      PAYMENT_DISPUTE: 0,
      KYC_ISSUE: 0,
      DISBURSEMENT_QUERY: 0,
      APP_TECHNICAL_ERROR: 0,
      FORECLOSURE_REQUEST: 0,
      FRAUD_REPORT: 0,
      GRIEVANCE_COMPLAINT: 0,
      GENERAL_INQUIRY: 0,
    };

    const ticketsByPriority: Record<SupportPriority, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };

    for (const t of allTickets) {
      if (t.status === 'OPEN') openTickets++;
      else if (t.status === 'IN_PROGRESS' || t.status === 'WAITING_FOR_CUSTOMER') inProgressTickets++;
      else if (t.status === 'RESOLVED') resolvedTickets++;
      else if (t.status === 'CLOSED') closedTickets++;
      else if (t.status === 'ESCALATED') escalatedTickets++;

      if (t.sla.isResponseBreached || t.sla.isResolutionBreached) {
        breachedTickets++;
      }

      if (ticketsByCategory[t.category] !== undefined) {
        ticketsByCategory[t.category]++;
      }
      if (ticketsByPriority[t.priority] !== undefined) {
        ticketsByPriority[t.priority]++;
      }

      if (t.firstResponseAt) {
        const diffMs = new Date(t.firstResponseAt).getTime() - new Date(t.createdAt).getTime();
        totalResponseTimeHours += Math.max(0.1, diffMs / (1000 * 60 * 60));
        responseTimeCount++;
      }

      if (t.resolvedAt) {
        const diffMs = new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
        totalResolutionTimeHours += Math.max(0.1, diffMs / (1000 * 60 * 60));
        resolutionTimeCount++;
      }

      if (t.csatScore) {
        csatTotal += t.csatScore;
        csatCount++;
      }
    }

    const openComplaints = allComplaints.filter(
      (c) => c.status === 'REGISTERED' || c.status === 'INVESTIGATING' || c.status === 'ESCALATED_TO_RBI'
    ).length;

    return {
      totalTickets: allTickets.length,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      escalatedTickets,
      breachedTickets,
      avgFirstResponseTimeHours: responseTimeCount > 0 ? Number((totalResponseTimeHours / responseTimeCount).toFixed(1)) : 1.2,
      avgResolutionTimeHours: resolutionTimeCount > 0 ? Number((totalResolutionTimeHours / resolutionTimeCount).toFixed(1)) : 8.4,
      csatScore: csatCount > 0 ? Number((csatTotal / csatCount).toFixed(1)) : 4.6,
      openComplaints,
      ticketsByCategory,
      ticketsByPriority,
    };
  }

  private seedSampleComplaints(): void {
    this.registerComplaint({
      tenantId: 'DEFAULT',
      customerId: 'CUST-DEMO-002',
      customerName: 'Meera Patel',
      customerEmail: 'meera.p@example.com',
      customerPhone: '+919876543211',
      loanId: 'LOAN-2026-8812',
      complaintType: 'Double Debit During Auto-Pay Mandate',
      rootCauseCategory: 'PAYMENT_GATEWAY_DOUBLE_PULL',
      details: 'My account was debited twice for EMI on 5th September. Bank Ref: RAZ_91823 and RAZ_91824.',
      demandedRemedy: 'Refund duplicate debit of INR 4,250 with reversal of penalty fees.',
      registeredBy: 'Grievance Desk Officer',
    });
  }
}

export const defaultSupportService = new SupportService();
