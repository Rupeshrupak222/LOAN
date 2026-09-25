import { z } from 'zod';
import { env } from './env';

/**
 * Zod schemas for typed configuration validation across all 8 configuration domains.
 */

// 1. Application Configuration
export const ApplicationConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  port: z.number().int().min(1000).max(65535).default(4000),
  apiPrefix: z.string().startsWith('/').default('/api/v1'),
  corsOrigins: z.array(z.string()).min(1).default(['http://localhost:3000']),
});

// 2. Secret & Security Configuration
export const SecurityConfigSchema = z.object({
  jwtAccessSecret: z.string().min(16, 'JWT Access Secret must be at least 16 characters in production'),
  jwtRefreshSecret: z.string().min(16, 'JWT Refresh Secret must be at least 16 characters in production'),
  jwtAccessExpires: z.string().default('15m'),
  jwtRefreshExpires: z.string().default('7d'),
  loginMaxAttempts: z.number().int().min(3).max(10).default(5),
  loginLockMinutes: z.number().int().min(1).max(60).default(15),
  rateLimitWindowMs: z.number().int().min(1000).default(900000),
  rateLimitMax: z.number().int().min(10).default(300),
});

// 3. Database Configuration
export const DatabaseConfigSchema = z.object({
  databaseUrl: z.string().min(1, 'DATABASE_URL is required'),
  directUrl: z.string().optional(),
  redisUrl: z.string().default('redis://localhost:6379'),
});

// 4. Tenant Configuration (Defaults & System Invariants)
export const TenantPolicyConfigSchema = z.object({
  defaultCurrency: z.string().length(3).default('INR'),
  defaultCountry: z.string().length(2).default('IN'),
  defaultTimezone: z.string().default('Asia/Kolkata'),
  enforceTenantIsolation: z.boolean().default(true),
  allowCrossTenantAudit: z.boolean().default(false),
});

// 5. Product & Financial Invariant Configuration
export const ProductPolicyConfigSchema = z.object({
  minLoanAmount: z.number().positive().default(5000),
  maxLoanAmount: z.number().positive().default(5000000),
  minTenureMonths: z.number().int().positive().default(3),
  maxTenureMonths: z.number().int().positive().default(84),
  defaultGstRatePercentage: z.number().min(0).max(100).default(18.0),
  coolingOffPeriodDays: z.number().int().min(1).max(14).default(3),
  defaultEmiGracePeriodDays: z.number().int().min(0).max(15).default(3),
});

// 6. Workflow & Orchestration Configuration
export const WorkflowConfigSchema = z.object({
  enforceMakerChecker: z.boolean().default(true),
  enforceSegregationOfDuties: z.boolean().default(true),
  stuckWorkflowThresholdHours: z.number().int().min(1).default(48),
  outboxMaxRetries: z.number().int().min(1).default(5),
  outboxBatchSize: z.number().int().min(1).default(50),
});

// 7. Approval Authority Matrix System Thresholds
export const ApprovalAuthorityConfigSchema = z.object({
  level1MaxLimit: z.number().positive().default(500000), // Branch Manager default limit
  level2MaxLimit: z.number().positive().default(2500000), // Underwriter default limit
  level3MaxLimit: z.number().positive().default(5000000), // Credit Head default limit
  requireFourEyesAbove: z.number().positive().default(1000000),
});

// 8. Integration & Provider Configuration
export const ProviderConfigSchema = z.object({
  allowSandboxFallback: z.boolean().default(true),
  outboundTimeoutMs: z.number().int().min(1000).default(15000),
  maxProviderRetries: z.number().int().min(0).max(3).default(2),
});

export interface ValidatedPlatformConfig {
  application: z.infer<typeof ApplicationConfigSchema>;
  security: z.infer<typeof SecurityConfigSchema>;
  database: z.infer<typeof DatabaseConfigSchema>;
  tenant: z.infer<typeof TenantPolicyConfigSchema>;
  product: z.infer<typeof ProductPolicyConfigSchema>;
  workflow: z.infer<typeof WorkflowConfigSchema>;
  authority: z.infer<typeof ApprovalAuthorityConfigSchema>;
  provider: z.infer<typeof ProviderConfigSchema>;
}

export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: ValidatedPlatformConfig;

  private constructor() {
    this.config = this.loadAndValidate();
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  public loadAndValidate(): ValidatedPlatformConfig {
    const isProduction = process.env.NODE_ENV === 'production';

    const rawApp = {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: Number(process.env.PORT || 4000),
      apiPrefix: process.env.API_PREFIX || '/api/v1',
      corsOrigins: env.corsOrigins,
    };

    const rawSecurity = {
      jwtAccessSecret: env.jwt.accessSecret || (isProduction ? '' : 'dev_jwt_access_secret_12345678'),
      jwtRefreshSecret: env.jwt.refreshSecret || (isProduction ? '' : 'dev_jwt_refresh_secret_12345678'),
      jwtAccessExpires: env.jwt.accessExpires,
      jwtRefreshExpires: env.jwt.refreshExpires,
      loginMaxAttempts: env.security.loginMaxAttempts,
      loginLockMinutes: env.security.loginLockMinutes,
      rateLimitWindowMs: env.security.rateLimitWindowMs,
      rateLimitMax: env.security.rateLimitMax,
    };

    const rawDb = {
      databaseUrl: env.databaseUrl || (isProduction ? '' : 'postgresql://postgres:postgres@localhost:5432/adyapan_lms'),
      directUrl: env.directUrl,
      redisUrl: env.redisUrl,
    };

    const rawTenant = {
      defaultCurrency: 'INR',
      defaultCountry: 'IN',
      defaultTimezone: 'Asia/Kolkata',
      enforceTenantIsolation: true,
      allowCrossTenantAudit: false,
    };

    const rawProduct = {
      minLoanAmount: 5000,
      maxLoanAmount: 5000000,
      minTenureMonths: 3,
      maxTenureMonths: 84,
      defaultGstRatePercentage: 18.0,
      coolingOffPeriodDays: 3,
      defaultEmiGracePeriodDays: 3,
    };

    const rawWorkflow = {
      enforceMakerChecker: true,
      enforceSegregationOfDuties: true,
      stuckWorkflowThresholdHours: 48,
      outboxMaxRetries: 5,
      outboxBatchSize: 50,
    };

    const rawAuthority = {
      level1MaxLimit: 500000,
      level2MaxLimit: 2500000,
      level3MaxLimit: 5000000,
      requireFourEyesAbove: 1000000,
    };

    const rawProvider = {
      allowSandboxFallback: !isProduction,
      outboundTimeoutMs: 15000,
      maxProviderRetries: 2,
    };

    const appParsed = ApplicationConfigSchema.parse(rawApp);
    const secParsed = SecurityConfigSchema.parse(rawSecurity);
    const dbParsed = DatabaseConfigSchema.parse(rawDb);
    const tenantParsed = TenantPolicyConfigSchema.parse(rawTenant);
    const prodParsed = ProductPolicyConfigSchema.parse(rawProduct);
    const wfParsed = WorkflowConfigSchema.parse(rawWorkflow);
    const authParsed = ApprovalAuthorityConfigSchema.parse(rawAuthority);
    const provParsed = ProviderConfigSchema.parse(rawProvider);

    return {
      application: appParsed,
      security: secParsed,
      database: dbParsed,
      tenant: tenantParsed,
      product: prodParsed,
      workflow: wfParsed,
      authority: authParsed,
      provider: provParsed,
    };
  }

  public getConfig(): ValidatedPlatformConfig {
    return this.config;
  }

  public validateStartupSafety(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
      if (!process.env.DATABASE_URL) {
        errors.push('CRITICAL: DATABASE_URL is missing in production environment');
      }
      if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 16) {
        errors.push('CRITICAL: JWT_ACCESS_SECRET must be at least 16 characters long in production');
      }
      if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 16) {
        errors.push('CRITICAL: JWT_REFRESH_SECRET must be at least 16 characters long in production');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const platformConfig = ConfigurationManager.getInstance();
