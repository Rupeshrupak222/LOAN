import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eventBus } from './event-bus.service';
import { WarningRulesRegistry } from './warning-rules.registry';
import { earlyWarningService } from './early-warning.service';
import { ForbiddenError, BadRequestError } from '../../common/errors';

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({ id: 'audit-1' }),
}));

vi.mock('../ai/gemini.service', () => ({
  generateGeminiContent: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      rootCauseAnalysis: 'Observed drop in customer income reflects reduced hours or seasonal contract transition.',
      benignVsRiskHypothesis: 'May be temporary medical leave vs permanent reduction in primary compensation.',
      investigationQuestions: ['Verify employer confirmation letter.', 'Check recent 2 months salary slip.'],
    }),
    model: 'gemma-4-31b-it',
  }),
}));

describe('Step 15: Real-Time Event & Early Warning Engine', () => {
  beforeEach(() => {
    earlyWarningService.clearForTesting();
  });

  describe('1. Centralized Typed Event Bus', () => {
    it('publishes typed SystemEvents and delivers to specific subscribers', async () => {
      let received: any = null;
      const unsubscribe = eventBus.subscribe('TEST_EVENT_TYPE', (evt) => {
        received = evt;
      });

      const published = await eventBus.publish({
        eventType: 'TEST_EVENT_TYPE',
        entityType: 'APPLICATION',
        entityId: 'app-999',
        source: 'UnitTest',
        correlationId: 'INT-TEST-001',
        severity: 'MEDIUM',
        metadata: { foo: 'bar' },
      });

      expect(published.eventId).toBeDefined();
      expect(received).toBeDefined();
      expect(received?.eventId).toBe(published.eventId);
      expect(received?.metadata?.foo).toBe('bar');

      unsubscribe();
    });

    it('delivers events to wildcard "*" subscribers', async () => {
      let wildcardReceived: any = null;
      const unsubscribe = eventBus.subscribe('*', (evt) => {
        if (evt.eventType === 'WILDCARD_TEST') {
          wildcardReceived = evt;
        }
      });

      await eventBus.publish({
        eventType: 'WILDCARD_TEST',
        entityType: 'LOAN',
        entityId: 'loan-777',
        source: 'UnitTest',
        correlationId: 'INT-TEST-002',
        severity: 'HIGH',
      });

      expect(wildcardReceived).toBeDefined();
      expect(wildcardReceived?.entityId).toBe('loan-777');

      unsubscribe();
    });
  });

  describe('2. Deterministic Early Warning Rules', () => {
    it('evaluates APP_SLA_BREACH when application aging exceeds 7 days', () => {
      const rule = WarningRulesRegistry.getRule('APP_SLA_BREACH');
      expect(rule).toBeDefined();

      const evaluation = rule!.evaluateEvent!({
        eventId: 'evt-1',
        eventType: 'APPLICATION_SLA_CHECK',
        entityType: 'APPLICATION',
        entityId: 'app-1',
        occurredAt: new Date().toISOString(),
        source: 'Scanner',
        correlationId: 'INT-1',
        severity: 'HIGH',
        metadata: { ageDays: 10, stage: 'UNDERWRITING' },
      });

      expect(evaluation).toBeDefined();
      expect(evaluation?.triggered).toBe(true);
      expect(evaluation?.evidence).toContain('10 days');
    });

    it('evaluates FIN_INCOME_DROP when observed salary inflow drops by >= 25%', () => {
      const rule = WarningRulesRegistry.getRule('FIN_INCOME_DROP');
      const evaluation = rule!.evaluateEvent!({
        eventId: 'evt-2',
        eventType: 'BANK_INTELLIGENCE_REFRESHED',
        entityType: 'CUSTOMER',
        entityId: 'cust-1',
        occurredAt: new Date().toISOString(),
        source: 'BankIntel',
        correlationId: 'INT-2',
        severity: 'HIGH',
        metadata: { dropPercentage: 35 },
      });

      expect(evaluation).toBeDefined();
      expect(evaluation?.triggered).toBe(true);
      expect(evaluation?.evidence).toContain('35%');
    });

    it('evaluates CRED_DPD_THRESHOLD_60 and escalates to CRITICAL', () => {
      const rule = WarningRulesRegistry.getRule('CRED_DPD_THRESHOLD_60');
      const evaluation = rule!.evaluateEvent!({
        eventId: 'evt-3',
        eventType: 'DPD_THRESHOLD_CROSSED',
        entityType: 'LOAN',
        entityId: 'loan-1',
        occurredAt: new Date().toISOString(),
        source: 'PaymentLedger',
        correlationId: 'INT-3',
        severity: 'CRITICAL',
        currentValue: 65,
        metadata: { overdueAmount: 15000 },
      });

      expect(evaluation).toBeDefined();
      expect(evaluation?.triggered).toBe(true);
      expect(evaluation?.severityOverride).toBe('CRITICAL');
    });

    it('evaluates COLL_BROKEN_PTP when promise commitment is violated', () => {
      const rule = WarningRulesRegistry.getRule('COLL_BROKEN_PTP');
      const evaluation = rule!.evaluateEvent!({
        eventId: 'evt-4',
        eventType: 'PTP_BROKEN',
        entityType: 'COLLECTION_CASE',
        entityId: 'case-1',
        occurredAt: new Date().toISOString(),
        source: 'Collections',
        correlationId: 'INT-4',
        severity: 'HIGH',
        metadata: { promisedAmount: 12500, promisedDate: '2026-09-01' },
      });

      expect(evaluation).toBeDefined();
      expect(evaluation?.triggered).toBe(true);
      expect(evaluation?.evidence).toContain('12,500');
    });
  });

  describe('3. Deduplication, Cooldown, and Escalation', () => {
    it('throttles duplicate alerts on same entity within 24-hour cooldown window', async () => {
      const first = await earlyWarningService.createOrEscalateAlert({
        ruleCode: 'APP_SLA_BREACH',
        domain: 'APPLICATION',
        title: 'SLA Breach',
        priority: 'HIGH',
        entityType: 'APPLICATION',
        entityId: 'app-dedup-1',
        whatHappened: 'Application SLA exceeded',
        whyItMatters: 'Delayed turnaround',
        source: 'UnitTest',
        evidence: 'Pending for 8 days',
        recommendedHumanAction: 'Assign to underwriter',
      });

      expect(first.action).toBe('CREATED');
      expect(first.alert.triggerCount).toBe(1);

      // Trigger identical alert again immediately
      const second = await earlyWarningService.createOrEscalateAlert({
        ruleCode: 'APP_SLA_BREACH',
        domain: 'APPLICATION',
        title: 'SLA Breach',
        priority: 'HIGH',
        entityType: 'APPLICATION',
        entityId: 'app-dedup-1',
        whatHappened: 'Application SLA exceeded',
        whyItMatters: 'Delayed turnaround',
        source: 'UnitTest',
        evidence: 'Pending for 9 days',
        recommendedHumanAction: 'Assign to underwriter',
      });

      expect(second.action).toBe('THROTTLED');
      expect(second.alert.warningId).toBe(first.alert.warningId);
      expect(second.alert.triggerCount).toBe(2);
    });

    it('escalates alert priority when condition worsens materially', async () => {
      const first = await earlyWarningService.createOrEscalateAlert({
        ruleCode: 'FIN_INCOME_DROP',
        domain: 'FINANCIAL',
        title: 'Income Drop',
        priority: 'MEDIUM',
        entityType: 'CUSTOMER',
        entityId: 'cust-escalate-1',
        whatHappened: 'Income dropped 20%',
        whyItMatters: 'Cash stress',
        source: 'UnitTest',
        evidence: 'Drop 20%',
        recommendedHumanAction: 'Verify salary slip',
      });

      expect(first.action).toBe('CREATED');
      expect(first.alert.priority).toBe('MEDIUM');

      // Now condition worsens to CRITICAL
      const second = await earlyWarningService.createOrEscalateAlert({
        ruleCode: 'FIN_INCOME_DROP',
        domain: 'FINANCIAL',
        title: 'Income Drop',
        priority: 'CRITICAL',
        entityType: 'CUSTOMER',
        entityId: 'cust-escalate-1',
        whatHappened: 'Income dropped 60%',
        whyItMatters: 'Severe cash stress',
        source: 'UnitTest',
        evidence: 'Drop 60%',
        recommendedHumanAction: 'Immediate review',
      });

      expect(second.action).toBe('ESCALATED');
      expect(second.alert.warningId).toBe(first.alert.warningId);
      expect(second.alert.priority).toBe('CRITICAL');
      expect(second.alert.lastEscalatedAt).toBeDefined();
    });
  });

  describe('4. Alert Lifecycle Management', () => {
    it('transitions alert from OPEN -> ACKNOWLEDGED -> RESOLVED with audit rationale', async () => {
      const { alert } = await earlyWarningService.createOrEscalateAlert({
        ruleCode: 'COLL_BROKEN_PTP',
        domain: 'COLLECTIONS',
        title: 'Broken PTP',
        priority: 'HIGH',
        entityType: 'COLLECTION_CASE',
        entityId: 'case-life-1',
        whatHappened: 'Failed to pay promise',
        whyItMatters: 'Risk of non-payment',
        source: 'UnitTest',
        evidence: 'Promise date passed',
        recommendedHumanAction: 'Contact borrower',
      });

      expect(alert.status).toBe('OPEN');

      // Acknowledge
      const acked = await earlyWarningService.acknowledgeAlert(alert.warningId, {
        id: 'staff-1',
        email: 'officer@adyapan.dev',
        roles: ['LOAN_OFFICER'],
      });
      expect(acked.status).toBe('ACKNOWLEDGED');
      expect(acked.acknowledgedBy).toBe('officer@adyapan.dev');

      // Resolve with mandatory notes
      const resolved = await earlyWarningService.resolveAlert(
        alert.warningId,
        { id: 'staff-1', email: 'officer@adyapan.dev', roles: ['LOAN_OFFICER'] },
        'Borrower paid full overdue balance via UPI reference 992819.'
      );
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolutionNotes).toContain('UPI reference 992819');
    });

    it('rejects resolution without mandatory resolution notes', async () => {
      const { alert } = await earlyWarningService.createOrEscalateAlert({
        ruleCode: 'APP_SLA_BREACH',
        domain: 'APPLICATION',
        title: 'SLA Breach',
        priority: 'HIGH',
        entityType: 'APPLICATION',
        entityId: 'app-invalid-res',
        whatHappened: 'SLA breach',
        whyItMatters: 'Delay',
        source: 'UnitTest',
        evidence: '8 days',
        recommendedHumanAction: 'Review',
      });

      await expect(
        earlyWarningService.resolveAlert(
          alert.warningId,
          { id: 'staff-1', email: 'officer@adyapan.dev', roles: ['LOAN_OFFICER'] },
          ''
        )
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('5. RBAC & Strict Borrower Isolation', () => {
    it('strictly forbids borrower role from listing early warnings', () => {
      expect(() =>
        earlyWarningService.listAlerts({}, { id: 'borrower-1', roles: ['CUSTOMER'] })
      ).toThrow(ForbiddenError);
    });

    it('strictly forbids borrower role from accessing early warning stats', () => {
      expect(() =>
        earlyWarningService.getStats({ id: 'borrower-1', roles: ['CUSTOMER'] })
      ).toThrow(ForbiddenError);
    });

    it('strictly forbids borrower role from viewing alert details', async () => {
      await expect(
        earlyWarningService.getAlertById('EWA-TEST-1', { id: 'borrower-1', roles: ['CUSTOMER'] })
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
