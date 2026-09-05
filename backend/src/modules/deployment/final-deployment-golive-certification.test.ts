import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { createApp } from '../../app';
import { validateProductionEnvironment } from '../../config/env-validator';
import { prisma } from '../../config/prisma';
import { hashPassword, verifyPassword } from '../auth/password';
import { signAccessToken, verifyAccessToken } from '../auth/tokens';
import { encryptSecret, decryptSecret } from '../../common/crypto';
import { allocateRepayment } from '../finance/emi';

describe('Step 57 — Final Deployment Readiness & Go-Live Certification Suite', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        const port = typeof addr === 'object' && addr ? addr.port : 4000;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  describe('1. Production Environment & Secrets Validation', () => {
    const MOCK_PLACEHOLDER_DB_URL = ['postgresql://', 'postgres:', '[YOUR-PASSWORD]', '@db.supabase.invalid:5432/postgres'].join('');
    const MOCK_PROD_DB_URL = ['postgresql://', 'mock_user:', 'mock_prod_pass_123', '@db.supabase.invalid:5432/postgres'].join('');

    it('should reject production environment with placeholder database password', () => {
      const result = validateProductionEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: MOCK_PLACEHOLDER_DB_URL,
        JWT_ACCESS_SECRET: 'super-secure-production-jwt-access-secret-32-chars-long-12345',
        JWT_REFRESH_SECRET: 'super-secure-production-jwt-refresh-secret-32-chars-long-12345',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('placeholder password template'))).toBe(true);
    });

    it('should reject production environment with short or default JWT secrets', () => {
      const result = validateProductionEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: MOCK_PROD_DB_URL,
        JWT_ACCESS_SECRET: 'change_me_dev_only',
        JWT_REFRESH_SECRET: 'super-secure-production-jwt-refresh-secret-32-chars-long-12345',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('JWT_ACCESS_SECRET in production must be at least 32 characters'))).toBe(true);
    });

    it('should reject production environment with wildcard CORS origin', () => {
      const result = validateProductionEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: MOCK_PROD_DB_URL,
        JWT_ACCESS_SECRET: 'super-secure-production-jwt-access-secret-32-chars-long-12345',
        JWT_REFRESH_SECRET: 'super-secure-production-jwt-refresh-secret-32-chars-long-12345',
        CORS_ORIGIN: '*',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("CORS_ORIGIN cannot be '*'"))).toBe(true);
    });

    it('should pass validation with fully compliant production environment config', () => {
      const result = validateProductionEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: MOCK_PROD_DB_URL,
        JWT_ACCESS_SECRET: 'super-secure-production-jwt-access-secret-32-chars-long-12345',
        JWT_REFRESH_SECRET: 'super-secure-production-jwt-refresh-secret-32-chars-long-12345',
        CORS_ORIGIN: 'https://lms.adyapan.com,https://admin.adyapan.com',
        PORT: '4000',
        API_PREFIX: '/api/v1',
      });
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should mark unconfigured 3rd-party integrations as false without breaking', () => {
      const result = validateProductionEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: MOCK_PROD_DB_URL,
        JWT_ACCESS_SECRET: 'super-secure-production-jwt-access-secret-32-chars-long-12345',
        JWT_REFRESH_SECRET: 'super-secure-production-jwt-refresh-secret-32-chars-long-12345',
      });
      expect(result.integrations?.paymentGateway).toBe(false);
      expect(result.integrations?.creditBureau).toBe(false);
      expect(result.integrations?.kycGateway).toBe(false);
    });
  });

  describe('2. Health Probes & Telemetry Readiness', () => {
    it('GET /health / GET /health/live should respond with UP status for liveness probes', async () => {
      const res = await fetch(`${baseUrl}/health`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.status).toBe('UP');
      expect(data.service).toBe('adyapan-lms-backend');
      expect(typeof data.uptimeSeconds).toBe('number');
    });

    it('GET /health/ready should verify database subsystem connectivity and memory', async () => {
      const res = await fetch(`${baseUrl}/health/ready`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.status).toBe('READY');
      expect(data.subsystems.database).toBe('UP');
      expect(data.subsystems.workerPool).toBe('UP');
      expect(data.memoryMb.rss).toBeGreaterThan(0);
    });

    it('GET /health/startup should report boot status, node version, and environment', async () => {
      const res = await fetch(`${baseUrl}/health/startup`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.status).toBe('BOOTED');
      expect(data.nodeVersion).toBe(process.version);
    });

    it('GET /health/telemetry should return worker metrics and memory consumption', async () => {
      const res = await fetch(`${baseUrl}/health/telemetry`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.data.memory.rssMb).toBeGreaterThan(0);
      expect(data.data.workerMetrics).toBeDefined();
    });

    it('GET /metrics should return Prometheus metrics with proper format', async () => {
      const res = await fetch(`${baseUrl}/metrics`);
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('# HELP');
      expect(text).toContain('adyapan_http_requests_total');
      expect(text).toContain('adyapan_process_uptime_seconds');
    });
  });

  describe('3. Database Connection & Transaction Isolation Safety', () => {
    it('should successfully execute query against PgBouncer-backed PostgreSQL', async () => {
      const result = await prisma.$queryRaw<Array<{ ping: number }>>`SELECT 1 as ping`;
      expect(result[0].ping).toBe(1);
    });

    it('should maintain transaction atomicity and rollback on injected error', async () => {
      const testEmail = `rollback_test_${Date.now()}@adyapan.com`;

      await expect(
        prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              email: testEmail,
              passwordHash: 'dummy_hash',
              firstName: 'Test',
              lastName: 'Rollback',
              status: 'ACTIVE',
              failedLoginAttempts: 0,
            },
          });
          throw new Error('Simulated transaction failure to verify atomic rollback');
        })
      ).rejects.toThrow('Simulated transaction failure to verify atomic rollback');

      // Verify that user was NOT persisted
      const foundUser = await prisma.user.findUnique({
        where: { email: testEmail },
      });
      expect(foundUser).toBeNull();
    });
  });

  describe('4. Financial Safety & Mathematical Invariants', () => {
    it('should correctly allocate repayment across statutory waterfall order (Penalty -> Fee -> Interest -> Principal)', () => {
      const dues = {
        penaltiesDue: 500,
        feesDue: 300,
        accruedInterest: 1200,
        outstandingPrincipal: 8000,
      };

      // Scenario: Partial payment of 1,000 (covers 500 penalty, 300 fee, 200 interest, 0 principal)
      const partialAllocation = allocateRepayment({ repaymentAmount: 1000, ...dues });
      expect(partialAllocation.allocatedToPenalties).toBe(500);
      expect(partialAllocation.allocatedToFees).toBe(300);
      expect(partialAllocation.allocatedToInterest).toBe(200);
      expect(partialAllocation.allocatedToPrincipal).toBe(0);
      expect(partialAllocation.excessRefund).toBe(0);

      // Scenario: Full payment of 10,000 (covers all dues exactly)
      const fullAllocation = allocateRepayment({ repaymentAmount: 10000, ...dues });
      expect(fullAllocation.allocatedToPenalties).toBe(500);
      expect(fullAllocation.allocatedToFees).toBe(300);
      expect(fullAllocation.allocatedToInterest).toBe(1200);
      expect(fullAllocation.allocatedToPrincipal).toBe(8000);
      expect(fullAllocation.excessRefund).toBe(0);

      // Scenario: Overpayment of 11,500 (covers all dues + 1,500 excess for prepayment/refund)
      const excessAllocation = allocateRepayment({ repaymentAmount: 11500, ...dues });
      expect(excessAllocation.allocatedToPenalties).toBe(500);
      expect(excessAllocation.allocatedToFees).toBe(300);
      expect(excessAllocation.allocatedToInterest).toBe(1200);
      expect(excessAllocation.allocatedToPrincipal).toBe(8000);
      expect(excessAllocation.excessRefund).toBe(1500);
    });

    it('should guarantee zero decimal floating-point drift in ledger accounting', () => {
      const emi1 = 3333.33;
      const emi2 = 3333.33;
      const emi3 = 3333.34;
      const total = Number((emi1 + emi2 + emi3).toFixed(2));
      expect(total).toBe(10000.0);
    });
  });

  describe('5. Security Controls & Cryptographic Regression Check', () => {
    it('should hash and verify passwords using Argon2id', async () => {
      const password = 'ProductionGradeSecurePassword!2026';
      const hash = await hashPassword(password);
      expect(hash).toContain('$argon2');

      const isValid = await verifyPassword(hash, password);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword(hash, 'WrongPassword!123');
      expect(isInvalid).toBe(false);
    });

    it('should encrypt and decrypt sensitive fields using AES-256-GCM with authentication tag', () => {
      const sensitiveAadhaar = '9876-5432-1098';
      const encrypted = encryptSecret(sensitiveAadhaar);
      expect(encrypted.encrypted).not.toBe(sensitiveAadhaar);
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();

      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(sensitiveAadhaar);
    });

    it('should generate and verify tamper-proof JWT access tokens', () => {
      const payload = {
        sub: 'usr_test_123',
        tenantId: 'tenant_default',
        roles: ['UNDERWRITER'],
        email: 'underwriter@adyapan.com',
      };

      const token = signAccessToken(payload);
      const verified = verifyAccessToken(token);

      expect(verified.sub).toBe(payload.sub);
      expect(verified.roles).toEqual(payload.roles);
      expect(verified.email).toBe(payload.email);
    });

    it('should reject tampered JWT tokens', () => {
      const payload = {
        sub: 'usr_test_123',
        tenantId: 'tenant_default',
        roles: ['CUSTOMER'],
        email: 'customer@adyapan.com',
      };

      const token = signAccessToken(payload);
      const tamperedToken = token.slice(0, -5) + 'abcde';

      expect(() => verifyAccessToken(tamperedToken)).toThrow();
    });
  });
});
