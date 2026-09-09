import { describe, it, expect, beforeEach } from 'vitest';
import { slaSupportService } from './sla-support.service';

describe('Step 44: SLA Management, Support Ticketing & Incident Platform', () => {
  const superAdmin = {
    id: 'usr-sa-01',
    email: 'superadmin@adyapan.dev',
    roles: ['SUPER_ADMIN'],
    tenantId: 'tenant-adyapan-default',
  };

  const supportAgent = {
    id: 'usr-sup-01',
    email: 'support@adyapan.dev',
    roles: ['ADMIN'],
    tenantId: 'tenant-adyapan-default',
  };

  beforeEach(() => {
    slaSupportService.clearForTesting();
  });

  // =========================================================================
  // 1. TICKET CREATION & DYNAMIC SLA DEADLINES
  // =========================================================================
  describe('1. Support Ticketing & Severity-Based SLA Target Allocation', () => {
    it('creates a P1_CRITICAL ticket with 15-minute response target and 120-minute resolution target', () => {
      const ticket = slaSupportService.createTicket(
        {
          title: 'Core Payout Gateway IMPS Service Unavailable',
          description: 'All outbound disbursement transfers failing with connection refused.',
          category: 'DISBURSEMENT_FAILURE',
          severity: 'P1_CRITICAL',
          customerEmail: 'finance@kotakprime.com',
        },
        supportAgent
      );

      expect(ticket.id).toMatch(/^tkt-/);
      expect(ticket.severity).toBe('P1_CRITICAL');
      expect(ticket.status).toBe('OPEN');
      expect(ticket.assignedTeam).toBe('ENGINEERING');

      const createdTime = new Date(ticket.createdAt).getTime();
      const responseDeadline = new Date(ticket.responseDeadline).getTime();
      const resolutionDeadline = new Date(ticket.resolutionDeadline).getTime();

      // 15 min response window
      expect(Math.round((responseDeadline - createdTime) / 60000)).toBe(15);
      // 120 min resolution window
      expect(Math.round((resolutionDeadline - createdTime) / 60000)).toBe(120);
    });

    it('creates a P3_MEDIUM ticket with 240-minute response target and 1440-minute resolution target', () => {
      const ticket = slaSupportService.createTicket(
        {
          title: 'Update Branch Working Hours Configuration',
          description: 'Requesting update to Pune branch Saturday operational window.',
          category: 'GENERAL_INQUIRY',
          severity: 'P3_MEDIUM',
          customerEmail: 'branchmgr@adyapan.dev',
        },
        supportAgent
      );

      const createdTime = new Date(ticket.createdAt).getTime();
      const responseDeadline = new Date(ticket.responseDeadline).getTime();
      const resolutionDeadline = new Date(ticket.resolutionDeadline).getTime();

      expect(Math.round((responseDeadline - createdTime) / 60000)).toBe(240);
      expect(Math.round((resolutionDeadline - createdTime) / 60000)).toBe(1440);
    });
  });

  // =========================================================================
  // 2. TICKET STATUS UPDATES, ESCALATION & BREACH DETECTION
  // =========================================================================
  describe('2. Ticket Acknowledgment, Resolution & Escalation', () => {
    it('acknowledges and resolves a ticket while recording resolution notes', () => {
      const ticket = slaSupportService.createTicket(
        {
          title: 'Bank Statement OCR Parser Anomaly on Axis Bank format',
          description: 'UPI transactions from Axis Bank statement showing reversed debit flags.',
          category: 'UNDERWRITING_EXCEPTION',
          severity: 'P2_HIGH',
          customerEmail: 'underwriter@adyapan.dev',
        },
        supportAgent
      );

      // Acknowledge (In Progress)
      const inProg = slaSupportService.updateTicketStatus(ticket.id, 'IN_PROGRESS', undefined, supportAgent);
      expect(inProg.status).toBe('IN_PROGRESS');
      expect(inProg.acknowledgedAt).toBeDefined();
      expect(inProg.isResponseBreached).toBe(false);

      // Resolve
      const resolved = slaSupportService.updateTicketStatus(
        ticket.id,
        'RESOLVED',
        'Axis Bank OCR regex rule updated in statement parser engine.',
        supportAgent
      );
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolvedAt).toBeDefined();
      expect(resolved.isResolutionBreached).toBe(false);
      expect(resolved.resolutionNotes).toContain('Axis Bank OCR regex rule updated');
    });

    it('escalates ticket to specialized Security team with audit trail entry', () => {
      const ticket = slaSupportService.createTicket(
        {
          title: 'Suspicious repetitive login attempts detected from unrecognized ASN',
          description: 'Multiple failed password attempts on Underwriter admin accounts.',
          category: 'ACCESS_CONTROL',
          severity: 'P2_HIGH',
          customerEmail: 'secops@adyapan.dev',
        },
        supportAgent
      );

      const escalated = slaSupportService.escalateTicket(
        ticket.id,
        'SECURITY',
        'Potential credential stuffing attack across IP range 194.26.29.0/24.',
        supportAgent
      );

      expect(escalated.assignedTeam).toBe('SECURITY');
      expect(escalated.comments.length).toBe(1);
      expect(escalated.comments[0].text).toContain('Potential credential stuffing attack');
    });
  });

  // =========================================================================
  // 3. ENTERPRISE INCIDENT LIFECYCLE & SLA REPORTING
  // =========================================================================
  describe('3. Enterprise Incident Management & SLA Metrics Reporting', () => {
    it('declares and manages full 7-stage enterprise incident lifecycle', () => {
      const incident = slaSupportService.createIncident(
        {
          title: 'Account Aggregator Setu Sandbox API Timeout',
          impactedService: 'INTEGRATION_HUB_AA',
          severity: 'P2_HIGH',
          impactSummary: 'Bank statement fetch failed for 6 applicant profiles.',
        },
        superAdmin
      );

      expect(incident.id).toMatch(/^inc-/);
      expect(incident.stage).toBe('DETECTED');

      // Advance to INVESTIGATING
      const step1 = slaSupportService.updateIncidentStage(
        incident.id,
        'INVESTIGATING',
        'Vendor SSL certificate expiry on AA staging endpoint',
        undefined,
        superAdmin
      );
      expect(step1.stage).toBe('INVESTIGATING');
      expect(step1.rootCause).toContain('Vendor SSL certificate expiry');

      // Resolve
      const resolved = slaSupportService.updateIncidentStage(
        incident.id,
        'RESOLVED',
        undefined,
        'Setu renewed cert and flushed gateway cache',
        superAdmin
      );
      expect(resolved.stage).toBe('RESOLVED');
      expect(resolved.resolvedAt).toBeDefined();
    });

    it('generates SLA compliance metrics report with MTTA and MTTR', () => {
      const report = slaSupportService.generateSlaMetricsReport('tenant-adyapan-default');

      expect(report.tenantId).toBe('tenant-adyapan-default');
      expect(report.totalTickets).toBeGreaterThanOrEqual(1);
      expect(report.slaCompliancePercentage).toBeGreaterThanOrEqual(0);
      expect(report.meanTimeToAcknowledgeMinutes).toBe(12);
      expect(report.meanTimeToResolveMinutes).toBe(68);
      expect(report.incidentsSummary.totalIncidents).toBeGreaterThanOrEqual(1);
    });
  });
});
