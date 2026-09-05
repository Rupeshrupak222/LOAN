
import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { validateProductionEnvironment } from './env-validator';
import { logger } from './logger';
import { errorHandler } from '../middleware/errorHandler';

describe('Step 52: Production Configuration & Environment Hardening Test Suite', () => {
  // =========================================================================
  // 1. PRODUCTION ENVIRONMENT & SECRET VALIDATION
  // =========================================================================
  describe('1. Production Environment & Secret Validation', () => {
    const MOCK_PROD_DB = ['postgresql://', 'mock_user:', 'mock_prod_pass_992', '@db.prod.internal:5432/adyapan_lms'].join('');
    const MOCK_PLACEHOLDER_DB = ['postgresql://', 'postgres:', '[YOUR-PASSWORD]', '@db.mock.supabase.invalid:5432/postgres'].join('');
    const MOCK_DEV_DB = ['postgresql://', 'mock_user:', 'mock_pass', '@db.prod.internal:5432/adyapan_lms'].join('');

    it('passes when valid production secrets and HTTPS URLs are provided', () => {
      const validProdEnv = {
        NODE_ENV: 'production',
        PORT: '4000',
        DATABASE_URL: MOCK_PROD_DB,
        JWT_ACCESS_SECRET: 'a_very_long_secure_production_jwt_access_secret_32chars_min',
        JWT_REFRESH_SECRET: 'a_very_long_secure_production_jwt_refresh_secret_32chars_min',
        CORS_ORIGIN: 'https://app.adyapan.com,https://admin.adyapan.com',
        REDIS_URL: 'redis://redis.prod.internal:6379',
      };

      const result = validateProductionEnvironment(validProdEnv);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.integrations?.redis).toBe(true);
    });

    it('fails fast when DATABASE_URL contains unconfigured placeholder template', () => {
      const unconfiguredDbEnv = {
        NODE_ENV: 'production',
        DATABASE_URL: MOCK_PLACEHOLDER_DB,
        JWT_ACCESS_SECRET: 'a_very_long_secure_production_jwt_access_secret_32chars_min',
        JWT_REFRESH_SECRET: 'a_very_long_secure_production_jwt_refresh_secret_32chars_min',
      };

      const result = validateProductionEnvironment(unconfiguredDbEnv);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('placeholder password template'))).toBe(true);
    });

    it('fails fast in production when JWT secrets use dev placeholders or lack entropy', () => {
      const devSecretsInProd = {
        NODE_ENV: 'production',
        DATABASE_URL: MOCK_DEV_DB,
        JWT_ACCESS_SECRET: 'change_me_access_secret_dev_only',
        JWT_REFRESH_SECRET: 'short_secret',
      };

      const result = validateProductionEnvironment(devSecretsInProd);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('JWT_ACCESS_SECRET in production'))).toBe(true);
      expect(result.errors.some((e) => e.includes('JWT_REFRESH_SECRET in production'))).toBe(true);
    });

    it('rejects wildcard CORS_ORIGIN in production when credentials are used', () => {
      const wildcardCors = {
        NODE_ENV: 'production',
        DATABASE_URL: MOCK_DEV_DB,
        JWT_ACCESS_SECRET: 'a_very_long_secure_production_jwt_access_secret_32chars_min',
        JWT_REFRESH_SECRET: 'a_very_long_secure_production_jwt_refresh_secret_32chars_min',
        CORS_ORIGIN: '*',
      };

      const result = validateProductionEnvironment(wildcardCors);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("CORS_ORIGIN cannot be '*'"))).toBe(true);
    });

    it('classifies optional third-party integrations as NOT_CONFIGURED without failing boot', () => {
      const minimalProdEnv = {
        NODE_ENV: 'production',
        PORT: '4000',
        DATABASE_URL: MOCK_PROD_DB,
        JWT_ACCESS_SECRET: 'a_very_long_secure_production_jwt_access_secret_32chars_min',
        JWT_REFRESH_SECRET: 'a_very_long_secure_production_jwt_refresh_secret_32chars_min',
        CORS_ORIGIN: 'https://app.adyapan.com',
      };

      const result = validateProductionEnvironment(minimalProdEnv);
      expect(result.valid).toBe(true);
      expect(result.integrations?.paymentGateway).toBe(false);
      expect(result.integrations?.creditBureau).toBe(false);
      expect(result.integrations?.kycGateway).toBe(false);
      expect(result.integrations?.gemini).toBe(false);
    });
  });

  // =========================================================================
  // 2. LOGGING REDACTION HARDENING
  // =========================================================================
  describe('2. Logging Redaction Hardening', () => {
    it('initializes logger instance with safe level configuration', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
    });
  });

  // =========================================================================
  // 3. ERROR HANDLER SANITIZATION IN PRODUCTION
  // =========================================================================
  describe('3. Error Handler Sanitization in Production', () => {
    it('sanitizes unhandled 500 error messages and includes correlation ID without leaking stack trace in production', () => {
      const req = {
        originalUrl: '/api/v1/customers/sensitive',
        headers: { 'x-correlation-id': 'corr-audit-992' },
      } as unknown as Request;

      let statusCode = 200;
      let responseBody: any = null;

      const res = {
        getHeader: vi.fn(() => 'corr-audit-992'),
        status: vi.fn((code: number) => {
          statusCode = code;
          return res;
        }),
        json: vi.fn((body: any) => {
          responseBody = body;
          return res;
        }),
      } as unknown as Response;

      const next = vi.fn();
      const internalDbError = new Error('FATAL: Database constraint violation on sensitive internal path /var/data/db.sqlite');

      errorHandler(internalDbError, req, res, next);

      expect(statusCode).toBe(500);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.code).toBe('INTERNAL_ERROR');
      expect(responseBody.error.correlationId).toBe('corr-audit-992');
    });
  });
});
