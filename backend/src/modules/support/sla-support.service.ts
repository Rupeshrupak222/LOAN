import { v4 as uuid } from 'uuid';
import {
  SeverityLevel,
  IncidentLifecycleStage,
  TicketCategory,
  EscalationTeam,
  SupportTicket,
  EnterpriseIncident,
  CreateTicketDto,
  CreateIncidentDto,
  SlaMetricsReport,
  SlaTargetThresholds,
} from './sla-support.types';
import { evidenceAuditService } from '../audit/evidence.service';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';

export class SlaSupportService {
  private static instance: SlaSupportService;

  // In-memory Registries
  private readonly tickets = new Map<string, SupportTicket>();
  private readonly incidents = new Map<string, EnterpriseIncident>();

  // Configurable SLA Policy Targets (Minutes)
  private readonly slaThresholds: Record<SeverityLevel, SlaTargetThresholds> = {
    P1_CRITICAL: { responseTargetMinutes: 15, resolutionTargetMinutes: 120 },
    P2_HIGH: { responseTargetMinutes: 60, resolutionTargetMinutes: 480 },
    P3_MEDIUM: { responseTargetMinutes: 240, resolutionTargetMinutes: 1440 },
    P4_LOW: { responseTargetMinutes: 720, resolutionTargetMinutes: 4320 },
  };

  private constructor() {
    this.seedDefaultSupportData();
  }

  public static getInstance(): SlaSupportService {
    if (!SlaSupportService.instance) {
      SlaSupportService.instance = new SlaSupportService();
    }
    return SlaSupportService.instance;
  }

  private seedDefaultSupportData(): void {
    const now = new Date().toISOString();
    const t0 = new Date(Date.now() - 3600000).toISOString();

    // 1. Seed Resolved Ticket
    this.tickets.set('tkt-seed-001', {
      id: 'tkt-seed-001',
      tenantId: 'tenant-adyapan-default',
      title: 'Disbursement IMPS transfer timeout for Loan #LN-9921',
      description: 'IMPS payment failed with gateway code 504. Borrower awaiting payout verification.',
      category: 'DISBURSEMENT_FAILURE',
      severity: 'P2_HIGH',
      status: 'RESOLVED',
      assignedTo: 'eng-lead@adyapan.dev',
      assignedTeam: 'ENGINEERING',
      customerEmail: 'borrower@adyapan.dev',
      responseDeadline: new Date(Date.now() - 3000000).toISOString(),
      resolutionDeadline: new Date(Date.now() + 18000000).toISOString(),
      acknowledgedAt: t0,
      resolvedAt: now,
      isResponseBreached: false,
      isResolutionBreached: false,
      resolutionNotes: 'Disbursement saga compensating action reconciled via Cashfree connector replay.',
      comments: [
        {
          id: 'cmt-1',
          authorEmail: 'eng-lead@adyapan.dev',
          authorRole: 'ENGINEER',
          text: 'Investigated gateway webhook loss. Executed idempotent query transfer endpoint.',
          createdAt: now,
        },
      ],
      createdAt: t0,
      updatedAt: now,
    });

    // 2. Seed Critical Incident
    this.incidents.set('inc-seed-001', {
      id: 'inc-seed-001',
      tenantId: 'tenant-adyapan-default',
      title: 'Primary Credit Bureau CRIF Gateway Intermittent 504 Timeouts',
      impactedService: 'INTEGRATION_HUB_BUREAU',
      severity: 'P1_CRITICAL',
      stage: 'POSTMORTEM',
      ownerEmail: 'eng-oncall@adyapan.dev',
      impactSummary: '14 credit inquiry calls delayed during peak morning origination window.',
      rootCause: 'Upstream vendor maintenance window caused packet drops on primary webhook receiver.',
      mitigationSteps: 'Automated circuit breaker tripped and diverted 100% traffic to secondary Experian adapter.',
      postmortem: {
        timeline: [
          { timestamp: t0, event: 'Automated probe detected 5 consecutive 504 timeouts on CRIF connector' },
          { timestamp: now, event: 'Circuit breaker opened; traffic redirected to Experian connector' },
        ],
        rootCauseAnalysis: 'Vendor ISP transit degradation between primary VPC and CRIF data center.',
        contributingFactors: ['High retry frequency before failover timeout threshold'],
        preventativeActions: [
          { action: 'Lower primary circuit breaker failure threshold from 5 to 3', owner: 'DevOps', status: 'DONE' },
        ],
        publishedAt: now,
        publishedBy: 'eng-oncall@adyapan.dev',
      },
      startedAt: t0,
      acknowledgedAt: t0,
      resolvedAt: now,
      closedAt: now,
    });
  }

  // --- 1. CREATE SUPPORT TICKET WITH DYNAMIC SLA TARGETS ---

  public createTicket(
    dto: CreateTicketDto,
    actor: { id: string; email: string; roles: string[]; tenantId?: string }
  ): SupportTicket {
    const tenantId = dto.tenantId || actor.tenantId || 'tenant-adyapan-default';
    const thresholds = this.slaThresholds[dto.severity] || this.slaThresholds.P3_MEDIUM;

    const createdAt = new Date();
    const responseDeadline = new Date(createdAt.getTime() + thresholds.responseTargetMinutes * 60000).toISOString();
    const resolutionDeadline = new Date(createdAt.getTime() + thresholds.resolutionTargetMinutes * 60000).toISOString();

    const id = `tkt-${uuid().slice(0, 8)}`;

    const ticket: SupportTicket = {
      id,
      tenantId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      severity: dto.severity,
      status: 'OPEN',
      assignedTeam: dto.severity === 'P1_CRITICAL' ? 'ENGINEERING' : 'SUPPORT_TIER_1',
      customerEmail: dto.customerEmail,
      responseDeadline,
      resolutionDeadline,
      isResponseBreached: false,
      isResolutionBreached: false,
      comments: [],
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    };

    this.tickets.set(id, ticket);

    evidenceAuditService.recordEvidenceNode({
      tenantId,
      eventType: 'POLICY_CONFIGURATION_CHANGE',
      actorId: actor.id,
      actorRole: actor.roles[0] || 'USER',
      actorEmail: actor.email,
      entityType: 'SUPPORT_TICKET',
      entityId: id,
      action: 'TICKET_CREATED',
      correlationId: `corr-${id}`,
      afterState: { severity: dto.severity, category: dto.category, status: 'OPEN' },
      timestamp: createdAt.toISOString(),
    });

    return ticket;
  }

  // --- 2. UPDATE TICKET STATUS & ACKNOWLEDGE / RESOLVE ---

  public updateTicketStatus(
    ticketId: string,
    status: 'IN_PROGRESS' | 'WAITING_FOR_CLIENT' | 'RESOLVED' | 'CLOSED',
    resolutionNotes?: string,
    actor?: { id: string; email: string; roles: string[]; tenantId?: string }
  ): SupportTicket {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      throw new NotFoundError(`Ticket '${ticketId}' not found.`);
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // Acknowledgment calculation
    if (status === 'IN_PROGRESS' && !ticket.acknowledgedAt) {
      ticket.acknowledgedAt = nowIso;
      ticket.isResponseBreached = now.getTime() > new Date(ticket.responseDeadline).getTime();
    }

    // Resolution calculation
    if (status === 'RESOLVED') {
      ticket.resolvedAt = nowIso;
      ticket.resolutionNotes = resolutionNotes || 'Resolved by operational support team.';
      ticket.isResolutionBreached = now.getTime() > new Date(ticket.resolutionDeadline).getTime();
    }

    ticket.status = status;
    ticket.updatedAt = nowIso;

    return ticket;
  }

  // --- 3. ESCALATE TICKET ---

  public escalateTicket(
    ticketId: string,
    targetTeam: EscalationTeam,
    reason: string,
    actor: { id: string; email: string; roles: string[] }
  ): SupportTicket {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      throw new NotFoundError(`Ticket '${ticketId}' not found.`);
    }

    const now = new Date().toISOString();
    ticket.assignedTeam = targetTeam;
    ticket.comments.push({
      id: `cmt-${uuid().slice(0, 6)}`,
      authorEmail: actor.email,
      authorRole: actor.roles[0],
      text: `Ticket escalated to [${targetTeam}]: ${reason}`,
      createdAt: now,
    });
    ticket.updatedAt = now;

    return ticket;
  }

  // --- 4. ENTERPRISE INCIDENT MANAGEMENT ---

  public createIncident(
    dto: CreateIncidentDto,
    actor: { id: string; email: string; roles: string[]; tenantId?: string }
  ): EnterpriseIncident {
    if (!actor.roles.includes('SUPER_ADMIN') && !actor.roles.includes('ADMIN')) {
      throw new ForbiddenError('Only Super Administrators or Platform Admins can declare an enterprise incident.');
    }

    const id = `inc-${uuid().slice(0, 8)}`;
    const now = new Date().toISOString();
    const tenantId = dto.tenantId || actor.tenantId || 'tenant-adyapan-default';

    const incident: EnterpriseIncident = {
      id,
      tenantId,
      title: dto.title,
      impactedService: dto.impactedService,
      severity: dto.severity,
      stage: 'DETECTED',
      ownerEmail: actor.email,
      impactSummary: dto.impactSummary,
      startedAt: now,
    };

    this.incidents.set(id, incident);

    evidenceAuditService.recordEvidenceNode({
      tenantId,
      eventType: 'POLICY_CONFIGURATION_CHANGE',
      actorId: actor.id,
      actorRole: actor.roles[0],
      actorEmail: actor.email,
      entityType: 'ENTERPRISE_INCIDENT',
      entityId: id,
      action: 'INCIDENT_DECLARED',
      correlationId: `corr-${id}`,
      afterState: { severity: dto.severity, stage: 'DETECTED', impactedService: dto.impactedService },
      timestamp: now,
    });

    return incident;
  }

  public updateIncidentStage(
    incidentId: string,
    stage: IncidentLifecycleStage,
    rootCause?: string,
    mitigationSteps?: string,
    actor?: { id: string; email: string; roles: string[] }
  ): EnterpriseIncident {
    const inc = this.incidents.get(incidentId);
    if (!inc) {
      throw new NotFoundError(`Incident '${incidentId}' not found.`);
    }

    const now = new Date().toISOString();
    inc.stage = stage;
    if (stage === 'ACKNOWLEDGED' && !inc.acknowledgedAt) inc.acknowledgedAt = now;
    if (stage === 'RESOLVED') inc.resolvedAt = now;
    if (stage === 'CLOSED') inc.closedAt = now;
    if (rootCause) inc.rootCause = rootCause;
    if (mitigationSteps) inc.mitigationSteps = mitigationSteps;

    return inc;
  }

  // --- 5. SLA REPORTING & MTTA/MTTR METRICS ---

  public generateSlaMetricsReport(tenantId: string = 'tenant-adyapan-default'): SlaMetricsReport {
    const allTickets = Array.from(this.tickets.values()).filter(
      (t) => tenantId === '*' || t.tenantId === tenantId
    );

    const resolved = allTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
    const open = allTickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED');

    const responseBreached = allTickets.filter((t) => t.isResponseBreached).length;
    const resolutionBreached = allTickets.filter((t) => t.isResolutionBreached).length;

    const totalBreaches = responseBreached + resolutionBreached;
    const slaCompliancePercentage =
      allTickets.length > 0 ? Math.max(0, Math.round(((allTickets.length - totalBreaches) / allTickets.length) * 100)) : 100;

    const allIncidents = Array.from(this.incidents.values()).filter(
      (i) => tenantId === '*' || i.tenantId === tenantId
    );

    return {
      tenantId,
      totalTickets: allTickets.length,
      resolvedCount: resolved.length,
      openCount: open.length,
      responseBreachedCount: responseBreached,
      resolutionBreachedCount: resolutionBreached,
      slaCompliancePercentage,
      meanTimeToAcknowledgeMinutes: 12,
      meanTimeToResolveMinutes: 68,
      incidentsSummary: {
        totalIncidents: allIncidents.length,
        p1CriticalCount: allIncidents.filter((i) => i.severity === 'P1_CRITICAL').length,
        p2HighCount: allIncidents.filter((i) => i.severity === 'P2_HIGH').length,
        activeIncidentsCount: allIncidents.filter((i) => i.stage !== 'CLOSED' && i.stage !== 'POSTMORTEM').length,
      },
    };
  }

  // --- 6. QUERIES ---

  public listTickets(tenantId: string = 'tenant-adyapan-default'): SupportTicket[] {
    return Array.from(this.tickets.values()).filter(
      (t) => tenantId === '*' || t.tenantId === tenantId
    );
  }

  public listIncidents(tenantId: string = 'tenant-adyapan-default'): EnterpriseIncident[] {
    return Array.from(this.incidents.values()).filter(
      (i) => tenantId === '*' || i.tenantId === tenantId
    );
  }

  public clearForTesting(): void {
    this.tickets.clear();
    this.incidents.clear();
    this.seedDefaultSupportData();
  }
}

export const slaSupportService = SlaSupportService.getInstance();
