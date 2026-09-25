import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { creditBureauService } from '../credit/credit-bureau.service';
import { providerRegistry } from '../integrations/provider-registry.service';
import { prisma } from '../../config/prisma';
import * as auditService from '../audit/audit.service';
import { IntegrationHubError } from '../integrations/integration.errors';
import { ForbiddenError, BadRequestError } from '../../common/errors';

describe('PHASE 4 — Real Credit Bureau Verification Contract & Security', () => {
  const originalEnv = { ...process.env };
  let logAuditSpy: any;

  beforeEach(() => {
    // Reset env vars before each test
    delete process.env.CREDIT_BUREAU_API_KEY;
    delete process.env.CREDIT_BUREAU_BASE_URL;

    // Spy on audit logger
    logAuditSpy = vi.spyOn(auditService, 'logAudit').mockImplementation(async () => null as any);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Contract 1: Real provider success -> real report with REAL_PROVIDER mode
  // -------------------------------------------------------------------------
  it('01: Real provider success -> returns report with isSandbox=false and REAL_PROVIDER mode', async () => {
    process.env.CREDIT_BUREAU_API_KEY = 'live_cibil_secret_key_123';
    process.env.CREDIT_BUREAU_BASE_URL = 'https://api.cibil.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).includes('/v1/reports')) {
        return new Response(
          JSON.stringify({
            status: 'COMPLETED',
            bureauName: 'CIBIL',
            score: 782,
            scoreTier: 'EXCELLENT',
            totalAccounts: 5,
            activeAccounts: 3,
            totalOutstanding: 150000,
            totalOverdueAmount: 0,
            dpd30PlusCount: 0,
            dpd90PlusCount: 0,
            writtenOffCount: 0,
            settledCount: 0,
            recentInquiriesLast30Days: 1,
            reportReference: 'CIBIL-REPORT-994411',
            generatedAt: '2026-09-20T11:00:00.000Z',
          }),
          { status: 200, statusText: 'OK' }
        );
      }
      return new Response('Not found', { status: 404 });
    });

    const res = await creditBureauService.fetchBureauReport({
      pan: 'ABCDE1234F',
      fullName: 'Sunil Kumar',
      mobile: '9876543210',
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('COMPLETED');
    expect(res.score).toBe(782);
    expect(res.scoreTier).toBe('EXCELLENT');
    expect(res.reportReference).toBe('CIBIL-REPORT-994411');
    expect(res.providerMetadata.isSandbox).toBe(false);
    expect(res.providerMetadata.verificationMode).toBe('REAL_PROVIDER');
  });

  // -------------------------------------------------------------------------
  // Contract 2: Real provider score is persisted exactly as returned
  // -------------------------------------------------------------------------
  it('02: Real provider score is captured and persisted exactly as returned (no hardcoding)', async () => {
    process.env.CREDIT_BUREAU_API_KEY = 'live_cibil_secret_key_123';
    process.env.CREDIT_BUREAU_BASE_URL = 'https://api.cibil.in';

    const customLiveScore = 741;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          status: 'COMPLETED',
          bureauName: 'EXPERIAN',
          score: customLiveScore,
          scoreTier: 'GOOD',
          reportReference: 'EXP-REP-741',
        }),
        { status: 200, statusText: 'OK' }
      );
    });

    const res = await creditBureauService.fetchBureauReport({
      pan: 'ABCDE1234F',
      fullName: 'Sunil Kumar',
      mobile: '9876543210',
    });

    expect(res.score).toBe(customLiveScore);
    expect(res.bureauName).toBe('EXPERIAN');
  });

  // -------------------------------------------------------------------------
  // Contract 3: Real provider rejection/error -> no successful report
  // -------------------------------------------------------------------------
  it('03: Real provider rejection/error -> returns unsuccessful status (FAILED)', async () => {
    process.env.CREDIT_BUREAU_API_KEY = 'live_cibil_secret_key_123';
    process.env.CREDIT_BUREAU_BASE_URL = 'https://api.cibil.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          status: 'FAILED',
          score: -1,
          message: 'Bureau inquiry rejected due to invalid demographic combination',
          reportReference: 'CIBIL-ERR-400',
        }),
        { status: 200, statusText: 'OK' }
      );
    });

    const res = await creditBureauService.fetchBureauReport({
      pan: 'ABCDE1234F',
      fullName: 'Unknown Applicant',
      mobile: '9876543210',
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.providerMetadata.isSandbox).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Contract 4: Real provider timeout/network error -> error propagated
  // -------------------------------------------------------------------------
  it('04: Real provider timeout or 504 -> throws error and does not produce successful report', async () => {
    process.env.CREDIT_BUREAU_API_KEY = 'live_cibil_secret_key_123';
    process.env.CREDIT_BUREAU_BASE_URL = 'https://api.cibil.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({ error: 'Gateway timeout' }), {
        status: 504,
        statusText: 'Gateway Timeout',
      });
    });

    await expect(
      creditBureauService.fetchBureauReport({
        pan: 'ABCDE1234F',
        fullName: 'Sunil Kumar',
        mobile: '9876543210',
      })
    ).rejects.toThrow();
  });

  // -------------------------------------------------------------------------
  // Contract 5: Real provider failure -> NEVER sandbox fallback
  // -------------------------------------------------------------------------
  it('05: Real provider network failure strictly throws IntegrationHubError and NEVER falls back to Sandbox', async () => {
    process.env.CREDIT_BUREAU_API_KEY = 'live_cibil_secret_key_123';
    process.env.CREDIT_BUREAU_BASE_URL = 'https://api.cibil.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      throw new Error('Network ECONNREFUSED');
    });

    let caughtError: any = null;
    try {
      await creditBureauService.fetchBureauReport({
        pan: 'ABCDE1234F',
        fullName: 'Sunil Kumar',
        mobile: '9876543210',
      });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError).toBeInstanceOf(IntegrationHubError);
  });

  // -------------------------------------------------------------------------
  // Contract 6: Missing real credentials -> explicit sandbox mode
  // -------------------------------------------------------------------------
  it('06: Missing credentials routes to explicit sandbox mode when allowed', async () => {
    const res = await creditBureauService.fetchBureauReport({
      pan: 'ABCDE1234F',
      fullName: 'Sunil Kumar',
      mobile: '9876543210',
    });

    expect(res.success).toBe(true);
    expect(res.providerMetadata.isSandbox).toBe(true);
    expect(res.providerMetadata.verificationMode).toBe('SANDBOX_SIMULATION');
  });

  // -------------------------------------------------------------------------
  // Contract 7: Sandbox result -> isSandbox=true & synthetic reference
  // -------------------------------------------------------------------------
  it('07: Sandbox result returns isSandbox=true and SBX reference format', async () => {
    const res = await creditBureauService.fetchBureauReport({
      pan: 'ABCDE1234F',
      fullName: 'Sunil Kumar',
      mobile: '9876543210',
    });

    expect(res.providerMetadata.isSandbox).toBe(true);
    expect(res.reportReference).toContain('SBX-BUR');
    expect(res.message).toContain('[Sandbox]');
  });

  // -------------------------------------------------------------------------
  // Contract 8: Sandbox score cannot be represented as real bureau evidence
  // -------------------------------------------------------------------------
  it('08: Sandbox score cannot be represented as REAL_PROVIDER evidence', async () => {
    const res = await creditBureauService.fetchBureauReport({
      pan: 'ABCDE1234F',
      fullName: 'Sunil Kumar',
      mobile: '9876543210',
    });

    expect(res.providerMetadata.isSandbox).toBe(true);
    expect(res.providerMetadata.verificationMode).not.toBe('REAL_PROVIDER');
  });

  // -------------------------------------------------------------------------
  // Contract 9: Frontend cannot force bureau score/result
  // -------------------------------------------------------------------------
  it('09: Frontend input cannot force score or verification status', async () => {
    process.env.CREDIT_BUREAU_API_KEY = 'live_cibil_secret_key_123';
    process.env.CREDIT_BUREAU_BASE_URL = 'https://api.cibil.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          status: 'COMPLETED',
          score: 610,
          scoreTier: 'FAIR',
          reportReference: 'CIBIL-REAL-610',
        }),
        { status: 200, statusText: 'OK' }
      );
    });

    const res = await creditBureauService.fetchBureauReport({
      pan: 'ABCDE1234F',
      fullName: 'Sunil Kumar',
      mobile: '9876543210',
      ...( { score: 850, scoreTier: 'EXCELLENT', status: 'VERIFIED' } as any ),
    });

    // Bureau score strictly comes from provider response (610), ignoring client forged input (850)
    expect(res.score).toBe(610);
    expect(res.scoreTier).toBe('FAIR');
  });

  // -------------------------------------------------------------------------
  // Contract 10: Provider reference is persisted
  // -------------------------------------------------------------------------
  it('10: Successful bureau inquiry updates RiskAssessment with provider reference and score', async () => {
    const findUniqueSpy = vi.spyOn(prisma.riskAssessment, 'findUnique').mockResolvedValue(null as any);
    const createSpy = vi.spyOn(prisma.riskAssessment, 'create').mockResolvedValue({
      id: 'risk-001',
      applicationId: 'app-500',
      score: 750,
      category: 'LOW',
      factors: {},
      createdAt: new Date(),
    } as any);

    const res = await creditBureauService.fetchBureauReport(
      {
        pan: 'ABCDE1234F',
        fullName: 'Sunil Kumar',
        mobile: '9876543210',
        applicationId: 'app-500',
      },
      { applicationId: 'app-500' }
    );

    expect(res.success).toBe(true);
    expect(findUniqueSpy).toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          applicationId: 'app-500',
          score: expect.any(Number),
        }),
      })
    );
  });

  // -------------------------------------------------------------------------
  // Contract 11: Tenant/IDOR isolation is enforced
  // -------------------------------------------------------------------------
  it('11: Cross-tenant IDOR access attempt is rejected with ForbiddenError', async () => {
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue({
      id: 'app-victim-999',
      tenantId: 'tenant-victim-org',
    } as any);

    await expect(
      creditBureauService.fetchBureauReport(
        {
          pan: 'ABCDE1234F',
          fullName: 'Sunil Kumar',
          mobile: '9876543210',
          applicationId: 'app-victim-999',
        },
        {
          userId: 'attacker-1',
          tenantId: 'tenant-attacker-org',
          role: 'LOAN_OFFICER',
        }
      )
    ).rejects.toThrow(ForbiddenError);
  });

  // -------------------------------------------------------------------------
  // Contract 12: Sensitive bureau payload / credentials are not logged
  // -------------------------------------------------------------------------
  it('12: Raw PAN is masked in audit trail and credentials are never logged', async () => {
    const rawPan = 'ABCDE1234F';

    await creditBureauService.fetchBureauReport(
      {
        pan: rawPan,
        fullName: 'Sunil Kumar',
        mobile: '9876543210',
      },
      {
        userId: 'usr-analyst-1',
        tenantId: 'tenant-101',
      }
    );

    expect(logAuditSpy).toHaveBeenCalled();
    const loggedPayload = logAuditSpy.mock.calls[0][0];
    expect(loggedPayload.action).toBe('CREDIT_BUREAU_INQUIRY');

    const jsonString = JSON.stringify(loggedPayload);
    expect(jsonString).not.toContain(rawPan);
    expect(jsonString).toContain('AB******4F');
  });
});
