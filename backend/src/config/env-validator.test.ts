import { describe, it, expect } from 'vitest';
import { validateProductionEnvironment } from './env-validator';

describe('Step 26: Production Environment Validation', () => {
  it('passes when all required variables are present and valid', () => {
    const validEnv = {
      NODE_ENV: 'production',
      PORT: '4000',
      DATABASE_URL: 'postgresql://postgres:pass@db.prod.internal:5432/adyapan',
      JWT_ACCESS_SECRET: 'a_very_long_secure_production_jwt_access_secret_32chars',
      JWT_REFRESH_SECRET: 'a_very_long_secure_production_jwt_refresh_secret_32chars',
      REDIS_URL: 'redis://redis.prod.internal:6379',
    };

    const result = validateProductionEnvironment(validEnv);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('fails when DATABASE_URL is missing', () => {
    const invalidEnv = {
      NODE_ENV: 'production',
      JWT_ACCESS_SECRET: 'a_very_long_secure_production_jwt_access_secret_32chars',
      JWT_REFRESH_SECRET: 'a_very_long_secure_production_jwt_refresh_secret_32chars',
    };

    const result = validateProductionEnvironment(invalidEnv);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('DATABASE_URL is required.');
  });

  it('fails when production uses insecure placeholder secrets', () => {
    const devSecretsInProd = {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://postgres:pass@db.prod.internal:5432/adyapan',
      JWT_ACCESS_SECRET: 'change_me_access_secret_dev_only',
      JWT_REFRESH_SECRET: 'change_me_refresh_secret_dev_only',
    };

    const result = validateProductionEnvironment(devSecretsInProd);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('JWT_ACCESS_SECRET in production'))).toBe(true);
    expect(result.errors.some((e) => e.includes('JWT_REFRESH_SECRET in production'))).toBe(true);
  });

  it('fails when PORT is not a valid integer', () => {
    const invalidPort = {
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/adyapan',
      JWT_ACCESS_SECRET: 'secret',
      JWT_REFRESH_SECRET: 'secret',
      PORT: 'not-a-number',
    };

    const result = validateProductionEnvironment(invalidPort);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('PORT must be a valid integer'))).toBe(true);
  });
});
