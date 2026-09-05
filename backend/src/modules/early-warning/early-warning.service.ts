import { prisma } from '../../config/prisma';
import { logAudit } from '../audit/audit.service';
import { integrationHub } from '../integrations/integration-hub.service';
import { generateGeminiContent } from '../ai/gemini.service';
import { ForbiddenError, NotFoundError, BadRequestError } from '../../common/errors';
import {
  EarlyWarningAlert,
  EarlyWarningStats,
  SystemEvent,
  WarningDomain,
  WarningPriority,
  WarningRuleCode,
  WarningStatus,
} from './early-warning.types';
import { eventBus } from './event-bus.service';
import { WarningRulesRegistry } from './warning-rules.registry';

export class EarlyWarningService {
  private static instance: EarlyWarningService;

  // In-memory alert store: warningId -> EarlyWarningAlert
  private readonly alerts = new Map<string, EarlyWarningAlert>();

  // Deduplication & cooldown index: fingerprint (ruleCode + entityId) -> { warningId, lastTriggeredAt, priority }
  private readonly cooldownIndex = new Map<string, { warningId: string; lastTriggeredAt: number; priority: WarningPriority }>();
  private readonly cooldownWindowMs = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    this.registerEventBusSubscribers();
  }

  public static getInstance(): EarlyWarningService {
    if (!EarlyWarningService.instance) {
      EarlyWarningService.instance = new EarlyWarningService();
    }
    return EarlyWarningService.instance;
  }

  /**
   * Registers listener on the event bus to automatically evaluate all system events against early warning rules.
   */
  private registerEventBusSubscribers() {
    eventBus.subscribe('*', async (event: SystemEvent) => {
      for (const rule of WarningRulesRegistry.getAllRules()) {
        if (!rule.evaluateEvent) continue;
        const evaluation = rule.evaluateEvent(event);
        if (evaluation && evaluation.triggered) {
          await this.createOrEscalateAlert({
            ruleCode: rule.code,
            domain: rule.domain,
            title: rule.title,
            priority: evaluation.severityOverride || rule.defaultPriority,
            entityType: event.entityType,
            entityId: event.entityId,
            customerId: event.customerId,
            applicationId: event.applicationId,
            loanId: event.loanId,
            whatHappened: event.metadata?.whatHappened || rule.title,
            whyItMatters: event.metadata?.whyItMatters || `Elevated operational / credit risk detected in ${rule.domain.toLowerCase()} domain.`,
            source: event.source,
            evidence: evaluation.evidence || 'Deterministic event threshold matched.',
            recommendedHumanAction: rule.recommendedAction,
            correlationId: event.correlationId,
          });
        }
      }
    });
  }

  /**
   * Creates a new warning alert or escalates an existing alert if the condition has worsened materially.
   */
  public async createOrEscalateAlert(params: {
    ruleCode: WarningRuleCode;
    domain: WarningDomain;
    title: string;
    priority: WarningPriority;
    entityType: any;
    entityId: string;
    customerId?: string;
    customerCode?: string;
    customerName?: string;
    applicationId?: string;
    applicationNo?: string;
    loanId?: string;
    loanNo?: string;
    whatHappened: string;
    whyItMatters: string;
    source: string;
    evidence: string;
    recommendedHumanAction: string;
    correlationId?: string;
  }): Promise<{ alert: EarlyWarningAlert; action: 'CREATED' | 'ESCALATED' | 'THROTTLED' }> {
    const fingerprint = `${params.ruleCode}:${params.entityId}`;
    const existing = this.cooldownIndex.get(fingerprint);
    const now = Date.now();

    // Check if within cooldown window
    if (existing && now - existing.lastTriggeredAt < this.cooldownWindowMs) {
      const activeAlert = this.alerts.get(existing.warningId);
      if (activeAlert && activeAlert.status !== 'RESOLVED' && activeAlert.status !== 'DISMISSED') {
        // Escalate if new priority is strictly higher
        const priorityWeight = { INFO: 1, LOW: 2, MEDIUM: 3, HIGH: 4, CRITICAL: 5 };
        if (priorityWeight[params.priority] > priorityWeight[activeAlert.priority]) {
          activeAlert.priority = params.priority;
          activeAlert.lastEscalatedAt = new Date().toISOString();
          activeAlert.triggerCount += 1;
          activeAlert.evidence = `${params.evidence} (Escalated to ${params.priority})`;

          existing.priority = params.priority;
          existing.lastTriggeredAt = now;

          await logAudit({
            action: 'EARLY_WARNING_ESCALATED',
            entity: 'EarlyWarningAlert',
            entityId: activeAlert.warningId,
            newValue: { ruleCode: params.ruleCode, priority: params.priority },
            correlationId: params.correlationId,
          }).catch(() => {});

          return { alert: activeAlert, action: 'ESCALATED' };
        }

        // Otherwise throttle duplicate
        activeAlert.triggerCount += 1;
        return { alert: activeAlert, action: 'THROTTLED' };
      }
    }

    // Generate new Early Warning Alert
    const warningId = `EWA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const detectedAt = new Date().toISOString();

    const alert: EarlyWarningAlert = {
      warningId,
      ruleCode: params.ruleCode,
      domain: params.domain,
      title: params.title,
      priority: params.priority,
      status: 'OPEN',
      entityType: params.entityType,
      entityId: params.entityId,
      customerId: params.customerId,
      customerCode: params.customerCode,
      customerName: params.customerName,
      applicationId: params.applicationId,
      applicationNo: params.applicationNo,
      loanId: params.loanId,
      loanNo: params.loanNo,
      whatHappened: params.whatHappened,
      whyItMatters: params.whyItMatters,
      source: params.source,
      evidence: params.evidence,
      detectedAt,
      triggerCount: 1,
      recommendedHumanAction: params.recommendedHumanAction,
    };

    this.alerts.set(warningId, alert);
    this.cooldownIndex.set(fingerprint, {
      warningId,
      lastTriggeredAt: now,
      priority: params.priority,
    });

    await logAudit({
      action: 'EARLY_WARNING_GENERATED',
      entity: 'EarlyWarningAlert',
      entityId: warningId,
      newValue: {
        ruleCode: params.ruleCode,
        priority: params.priority,
        domain: params.domain,
        entityId: params.entityId,
      },
      correlationId: params.correlationId,
    }).catch(() => {});

    return { alert, action: 'CREATED' };
  }

  /**
   * Retrieves alerts matching query filters with RBAC enforcement.
   */
  public listAlerts(
    filters: {
      domain?: WarningDomain;
      priority?: WarningPriority;
      status?: WarningStatus;
      customerId?: string;
      applicationId?: string;
      loanId?: string;
    },
    actor: { id: string; roles: string[] }
  ): EarlyWarningAlert[] {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot access early warning alerts.');
    }

    let items = Array.from(this.alerts.values());

    if (filters.domain) items = items.filter((a) => a.domain === filters.domain);
    if (filters.priority) items = items.filter((a) => a.priority === filters.priority);
    if (filters.status) items = items.filter((a) => a.status === filters.status);
    if (filters.customerId) items = items.filter((a) => a.customerId === filters.customerId);
    if (filters.applicationId) items = items.filter((a) => a.applicationId === filters.applicationId);
    if (filters.loanId) items = items.filter((a) => a.loanId === filters.loanId);

    // Sort by priority weight desc, then detectedAt desc
    const priorityWeight: Record<WarningPriority, number> = {
      CRITICAL: 5,
      HIGH: 4,
      MEDIUM: 3,
      LOW: 2,
      INFO: 1,
    };

    return items.sort((a, b) => {
      const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
    });
  }

  /**
   * Computes early warning metrics for dashboard displays.
   */
  public getStats(actor: { id: string; roles: string[] }): EarlyWarningStats {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot access early warning stats.');
    }

    const items = Array.from(this.alerts.values());
    const openItems = items.filter((a) => a.status === 'OPEN' || a.status === 'ACKNOWLEDGED' || a.status === 'IN_REVIEW');

    const byDomain: Record<WarningDomain, number> = {
      APPLICATION: 0,
      FINANCIAL: 0,
      CREDIT: 0,
      FRAUD: 0,
      COLLECTIONS: 0,
    };

    const byStatus: Record<WarningStatus, number> = {
      OPEN: 0,
      ACKNOWLEDGED: 0,
      IN_REVIEW: 0,
      RESOLVED: 0,
      DISMISSED: 0,
    };

    for (const a of items) {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      if (a.status !== 'RESOLVED' && a.status !== 'DISMISSED') {
        byDomain[a.domain] = (byDomain[a.domain] || 0) + 1;
      }
    }

    return {
      totalActiveWarnings: openItems.length,
      criticalCount: openItems.filter((a) => a.priority === 'CRITICAL').length,
      highCount: openItems.filter((a) => a.priority === 'HIGH').length,
      mediumCount: openItems.filter((a) => a.priority === 'MEDIUM').length,
      lowCount: openItems.filter((a) => a.priority === 'LOW').length,
      byDomain,
      byStatus,
    };
  }

  /**
   * Retrieves alert by ID and lazily generates Gemini advisory explanation if not present.
   */
  public async getAlertById(warningId: string, actor: { id: string; roles: string[] }): Promise<EarlyWarningAlert> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot view early warning alerts.');
    }

    const alert = this.alerts.get(warningId);
    if (!alert) {
      throw new NotFoundError(`Early warning alert '${warningId}' not found.`);
    }

    if (!alert.aiAdvisory) {
      alert.aiAdvisory = await this.synthesizeAlertAdvisory(alert);
    }

    return alert;
  }

  /**
   * Alert Lifecycle: Acknowledge Warning
   */
  public async acknowledgeAlert(warningId: string, actor: { id: string; email: string; roles: string[] }): Promise<EarlyWarningAlert> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot update early warning alerts.');
    }

    const alert = this.alerts.get(warningId);
    if (!alert) throw new NotFoundError(`Alert '${warningId}' not found.`);

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedBy = actor.email;
    alert.acknowledgedAt = new Date().toISOString();

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'EARLY_WARNING_ACKNOWLEDGED',
      entity: 'EarlyWarningAlert',
      entityId: warningId,
    }).catch(() => {});

    return alert;
  }

  /**
   * Alert Lifecycle: Resolve Warning
   */
  public async resolveAlert(
    warningId: string,
    actor: { id: string; email: string; roles: string[] },
    resolutionNotes: string
  ): Promise<EarlyWarningAlert> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot update early warning alerts.');
    }

    if (!resolutionNotes || resolutionNotes.trim().length < 5) {
      throw new BadRequestError('Resolution notes are mandatory to resolve an early warning.');
    }

    const alert = this.alerts.get(warningId);
    if (!alert) throw new NotFoundError(`Alert '${warningId}' not found.`);

    alert.status = 'RESOLVED';
    alert.resolvedBy = actor.email;
    alert.resolvedAt = new Date().toISOString();
    alert.resolutionNotes = resolutionNotes.trim();

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'EARLY_WARNING_RESOLVED',
      entity: 'EarlyWarningAlert',
      entityId: warningId,
      newValue: { resolutionNotes: alert.resolutionNotes },
    }).catch(() => {});

    return alert;
  }

  /**
   * Alert Lifecycle: Dismiss Warning
   */
  public async dismissAlert(
    warningId: string,
    actor: { id: string; email: string; roles: string[] },
    dismissalReason: string
  ): Promise<EarlyWarningAlert> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot update early warning alerts.');
    }

    if (!dismissalReason || dismissalReason.trim().length < 5) {
      throw new BadRequestError('Dismissal reason is mandatory to dismiss an early warning.');
    }

    const alert = this.alerts.get(warningId);
    if (!alert) throw new NotFoundError(`Alert '${warningId}' not found.`);

    alert.status = 'DISMISSED';
    alert.dismissedBy = actor.email;
    alert.dismissedAt = new Date().toISOString();
    alert.dismissalReason = dismissalReason.trim();

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'EARLY_WARNING_DISMISSED',
      entity: 'EarlyWarningAlert',
      entityId: warningId,
      newValue: { dismissalReason: alert.dismissalReason },
    }).catch(() => {});

    return alert;
  }

  /**
   * Runs a proactive portfolio-wide state scan across applications, collection cases, and bank anomalies.
   */
  public async runSystemScan(): Promise<{ scannedEntities: number; alertsCreated: number }> {
    const correlationId = integrationHub.generateCorrelationId();
    let alertsCreated = 0;

    // 1. Scan SLA Breached Applications
    const applications = await prisma.loanApplication.findMany({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING'] } },
      include: { customer: { select: { customerCode: true, firstName: true, lastName: true } } },
    });

    const now = Date.now();
    for (const app of applications) {
      const ageDays = Math.round((now - app.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (ageDays >= 7) {
        const { action } = await this.createOrEscalateAlert({
          ruleCode: 'APP_SLA_BREACH',
          domain: 'APPLICATION',
          title: 'Application Underwriting SLA Breached (>7 Days)',
          priority: ageDays >= 14 ? 'CRITICAL' : 'HIGH',
          entityType: 'APPLICATION',
          entityId: app.id,
          customerId: app.customerId,
          customerCode: app.customer?.customerCode,
          customerName: `${app.customer?.firstName} ${app.customer?.lastName}`,
          applicationId: app.id,
          applicationNo: app.applicationNo,
          whatHappened: `Application has been pending adjudication for ${ageDays} days.`,
          whyItMatters: 'Turnaround delay breaches customer service SLA and increases origination churn risk.',
          source: 'System Batch Scanner',
          evidence: `Creation date: ${app.createdAt.toISOString().slice(0, 10)} (${ageDays} days elapsed).`,
          recommendedHumanAction: 'Reassign application to priority underwriter queue or escalate to Branch Credit Head.',
          correlationId,
        });
        if (action === 'CREATED') alertsCreated++;
      }
    }

    // 2. Scan Delinquency Collection Cases (DPD >= 30)
    const collectionCases = await prisma.collectionCase.findMany({
      where: { dpd: { gte: 30 }, status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED', 'PROMISED'] } },
      include: {
        customer: { select: { customerCode: true, firstName: true, lastName: true } },
        loan: { select: { loanNo: true } },
      },
    });

    for (const cc of collectionCases) {
      const ruleCode = cc.dpd >= 60 ? 'CRED_DPD_THRESHOLD_60' : 'CRED_DPD_THRESHOLD_30';
      const priority = cc.dpd >= 60 ? 'CRITICAL' : 'HIGH';

      const { action } = await this.createOrEscalateAlert({
        ruleCode,
        domain: 'CREDIT',
        title: cc.dpd >= 60 ? 'Critical Delinquency Reached 60 DPD (SMA-2)' : 'Delinquency Reached 30 DPD (SMA-1)',
        priority,
        entityType: 'COLLECTION_CASE',
        entityId: cc.id,
        customerId: cc.customerId,
        customerCode: cc.customer?.customerCode,
        customerName: `${cc.customer?.firstName} ${cc.customer?.lastName}`,
        loanId: cc.loanId,
        loanNo: cc.loan?.loanNo,
        whatHappened: `Loan has remained overdue for ${cc.dpd} days with unpaid balance INR ${Number(cc.overdueAmount).toLocaleString('en-IN')}.`,
        whyItMatters: cc.dpd >= 60 ? 'Imminent risk of NPA classification.' : 'Early default migration requires proactive outreach.',
        source: 'System Batch Scanner',
        evidence: `DPD: ${cc.dpd}, Aging Bucket: ${cc.agingBucket}, Overdue: INR ${Number(cc.overdueAmount).toLocaleString('en-IN')}`,
        recommendedHumanAction:
          cc.dpd >= 60
            ? 'Issue statutory loan recall demand notice and schedule urgent recovery visit.'
            : 'Assign dedicated recovery officer and establish direct borrower contact.',
        correlationId,
      });
      if (action === 'CREATED') alertsCreated++;
    }

    return {
      scannedEntities: applications.length + collectionCases.length,
      alertsCreated,
    };
  }

  /**
   * Generates advisory explanation for an alert using Gemini with deterministic fallback.
   */
  private async synthesizeAlertAdvisory(alert: EarlyWarningAlert) {
    const prompt = `
ALERT DETAILS:
Rule: ${alert.ruleCode} (${alert.title})
Domain: ${alert.domain}
Priority: ${alert.priority}
Entity: ${alert.entityType} (${alert.entityId})
Customer: ${alert.customerName || 'N/A'}
What Happened: ${alert.whatHappened}
Why It Matters: ${alert.whyItMatters}
Evidence: ${alert.evidence}
Recommended Action: ${alert.recommendedHumanAction}
`;

    const systemInstruction = `
You are the Chief Risk Officer AI for Adyapan Loan Management System.
Analyze this operational early warning alert.
Provide an objective advisory breakdown containing:
1. Root Cause Analysis (why this risk pattern emerges).
2. Benign vs Risk Hypotheses (balanced view).
3. 3 targeted investigation questions for the credit/collection officer.

Return ONLY a valid JSON object matching:
{
  "rootCauseAnalysis": "1-2 sentence explanation of the underlying driver.",
  "benignVsRiskHypothesis": "Contrast legitimate benign causes versus credit risk hypothesis.",
  "investigationQuestions": ["Question 1", "Question 2", "Question 3"]
}
`;

    try {
      const response = await generateGeminiContent({
        prompt,
        systemInstruction,
        temperature: 0.1,
      });
      const cleaned = response.text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        rootCauseAnalysis: parsed.rootCauseAnalysis || alert.whyItMatters,
        benignVsRiskHypothesis: parsed.benignVsRiskHypothesis || 'Evaluate whether temporary operational friction or structural repayment distress is present.',
        investigationQuestions: Array.isArray(parsed.investigationQuestions)
          ? parsed.investigationQuestions
          : ['Verify source of delay with assigned officer.', 'Confirm contactability and current cash flow position.'],
      };
    } catch {
      return {
        rootCauseAnalysis: alert.whyItMatters,
        benignVsRiskHypothesis: 'Evaluate whether temporary borrower friction or structural servicing distress is present.',
        investigationQuestions: [
          'Verify latest communication logs with borrower or assigned staff.',
          'Confirm account mandate status and operational bank credits.',
          'Review whether policy conditions require supervisory override.',
        ],
      };
    }
  }

  public clearForTesting(): void {
    this.alerts.clear();
    this.cooldownIndex.clear();
  }
}

export const earlyWarningService = EarlyWarningService.getInstance();
