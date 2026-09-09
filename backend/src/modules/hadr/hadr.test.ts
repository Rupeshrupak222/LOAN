import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hadrService } from './hadr.service';

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({}),
}));

describe('Step 27: High Availability & Disaster Recovery', () => {
  beforeEach(() => {
    hadrService.clearForTesting();
  });

  describe('1. Circuit Breaker State Transitions & Tripping', () => {
    it('trips circuit breaker from CLOSED to OPEN after 3 consecutive failures', () => {
      const cb = hadrService.getCircuitBreaker('AI_GEMINI_GATEWAY');
      expect(cb.state).toBe('CLOSED');
      expect(cb.failureCount).toBe(0);

      hadrService.recordFailure('AI_GEMINI_GATEWAY', 'HTTP 503 Service Unavailable');
      expect(hadrService.getCircuitBreaker('AI_GEMINI_GATEWAY').state).toBe('CLOSED');

      hadrService.recordFailure('AI_GEMINI_GATEWAY', 'HTTP 504 Gateway Timeout');
      expect(hadrService.getCircuitBreaker('AI_GEMINI_GATEWAY').state).toBe('CLOSED');

      hadrService.recordFailure('AI_GEMINI_GATEWAY', 'Connection Refused');
      expect(hadrService.getCircuitBreaker('AI_GEMINI_GATEWAY').state).toBe('OPEN');
    });

    it('bypasses primary call and executes fallback directly when OPEN', async () => {
      hadrService.tripCircuitBreaker('AI_GEMINI_GATEWAY', 'Upstream outage');

      const primaryFn = vi.fn().mockResolvedValue({ aiDecision: 'APPROVE' });
      const fallbackFn = vi.fn().mockResolvedValue({ deterministicDecision: 'MANUAL_REVIEW_DETERMINISTIC' });

      const res = await hadrService.executeWithFallback('AI_GEMINI_GATEWAY', primaryFn, fallbackFn);

      expect(res.usedFallback).toBe(true);
      expect(res.circuitBreakerState).toBe('OPEN');
      expect(res.result).toEqual({ deterministicDecision: 'MANUAL_REVIEW_DETERMINISTIC' });
      expect(primaryFn).not.toHaveBeenCalled();
    });

    it('resets circuit breaker to CLOSED upon successful probe or reset command', () => {
      hadrService.tripCircuitBreaker('PAYMENT_GATEWAY');
      expect(hadrService.getCircuitBreaker('PAYMENT_GATEWAY').state).toBe('OPEN');

      hadrService.resetCircuitBreaker('PAYMENT_GATEWAY');
      expect(hadrService.getCircuitBreaker('PAYMENT_GATEWAY').state).toBe('CLOSED');
      expect(hadrService.getCircuitBreaker('PAYMENT_GATEWAY').failureCount).toBe(0);
    });
  });

  describe('2. Graceful Degradation: AI Gateway Outage Fallback', () => {
    it('seamlessly executes deterministic underwriting rules without failing loan flow', async () => {
      const failingPrimaryAi = async () => {
        throw new Error('Gemini API 500 Internal Error');
      };

      const deterministicRulesFallback = async () => {
        return {
          approved: true,
          mode: 'DETERMINISTIC_FALLBACK_RULE',
          maxLoanAmount: 250000,
          interestRate: 14.5,
        };
      };

      const execution = await hadrService.executeWithFallback(
        'AI_GEMINI_GATEWAY',
        failingPrimaryAi,
        deterministicRulesFallback
      );

      expect(execution.usedFallback).toBe(true);
      expect(execution.result.approved).toBe(true);
      expect(execution.result.mode).toBe('DETERMINISTIC_FALLBACK_RULE');
    });
  });

  describe('3. Graceful Degradation: Payment Gateway Failover', () => {
    it('seamlessly falls back to secondary payment gateway when primary is failing', async () => {
      const failingRazorpay = async () => {
        throw new Error('Razorpay Gateway 502 Bad Gateway');
      };

      const cashfreeFallback = async () => {
        return {
          gateway: 'CASHFREE_SECONDARY',
          paymentId: 'cf_pay_99212',
          status: 'SUCCESS',
        };
      };

      const execution = await hadrService.executeWithFallback(
        'PAYMENT_GATEWAY',
        failingRazorpay,
        cashfreeFallback
      );

      expect(execution.usedFallback).toBe(true);
      expect(execution.result.gateway).toBe('CASHFREE_SECONDARY');
      expect(execution.result.status).toBe('SUCCESS');
    });
  });

  describe('4. Disaster Recovery Simulation Drill', () => {
    it('executes full 5-step DR drill achieving RTO <= 15s and RPO = 0s data loss', async () => {
      const actor = { id: 'usr-admin-1', email: 'admin@adyapan.dev', roles: ['SUPER_ADMIN'] };
      const drill = await hadrService.executeDRDrill(actor);

      expect(drill.drillId).toBeDefined();
      expect(drill.status).toBe('SUCCESS');
      expect(drill.dataLossDetected).toBe(false);
      expect(drill.achievedRtoSeconds).toBeLessThanOrEqual(15);
      expect(drill.backupIntegrityChecksum).toBeDefined();
      expect(drill.steps.length).toBe(5);

      const history = hadrService.getDrillHistory();
      expect(history.length).toBe(1);
      expect(history[0].drillId).toBe(drill.drillId);
    });
  });
});
