import { logger } from './logger';

export interface OptionalIntegrationStatus {
  redis: boolean;
  gemini: boolean;
  cloudinary: boolean;
  smtp: boolean;
  paymentGateway: boolean;
  creditBureau: boolean;
  kycGateway: boolean;
}

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  integrations?: OptionalIntegrationStatus;
}

export function validateProductionEnvironment(
  envVars: Record<string, string | undefined> = process.env
): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const isProd = envVars.NODE_ENV === 'production';

  // 1. Mandatory Database URL
  if (!envVars.DATABASE_URL || envVars.DATABASE_URL.trim() === '') {
    errors.push('DATABASE_URL is required.');
  } else {
    if (envVars.DATABASE_URL.includes('[YOUR-PASSWORD]') || envVars.DATABASE_URL.includes('[PASSWORD]')) {
      errors.push('DATABASE_URL contains unconfigured placeholder password template.');
    }
    if (isProd && (envVars.DATABASE_URL.includes('localhost') || envVars.DATABASE_URL.includes('127.0.0.1'))) {
      if (envVars.ALLOW_LOCAL_PROD_DB !== 'true') {
        warnings.push('DATABASE_URL points to localhost in production mode.');
      }
    }
  }

  // 2. JWT Access Secret
  if (!envVars.JWT_ACCESS_SECRET || envVars.JWT_ACCESS_SECRET.trim() === '') {
    errors.push('JWT_ACCESS_SECRET is required.');
  } else if (isProd) {
    if (
      envVars.JWT_ACCESS_SECRET.includes('change_me') ||
      envVars.JWT_ACCESS_SECRET.includes('dev_only') ||
      envVars.JWT_ACCESS_SECRET.length < 32
    ) {
      errors.push('JWT_ACCESS_SECRET in production must be at least 32 characters and cannot use default placeholders.');
    }
  }

  // 3. JWT Refresh Secret
  if (!envVars.JWT_REFRESH_SECRET || envVars.JWT_REFRESH_SECRET.trim() === '') {
    errors.push('JWT_REFRESH_SECRET is required.');
  } else if (isProd) {
    if (
      envVars.JWT_REFRESH_SECRET.includes('change_me') ||
      envVars.JWT_REFRESH_SECRET.includes('dev_only') ||
      envVars.JWT_REFRESH_SECRET.length < 32
    ) {
      errors.push('JWT_REFRESH_SECRET in production must be at least 32 characters and cannot use default placeholders.');
    }
  }

  // 4. CORS Origin Security Validation
  if (isProd && envVars.CORS_ORIGIN) {
    if (envVars.CORS_ORIGIN.trim() === '*') {
      errors.push("CORS_ORIGIN cannot be '*' in production when credentials are enabled. Specify exact allowed frontend origins.");
    } else if (envVars.CORS_ORIGIN.includes('localhost') && envVars.ALLOW_LOCAL_CORS !== 'true') {
      warnings.push("CORS_ORIGIN contains 'localhost' in production mode.");
    }
  }

  // 5. Port Validation
  if (envVars.PORT && isNaN(Number(envVars.PORT))) {
    errors.push(`PORT must be a valid integer, received '${envVars.PORT}'.`);
  }

  // 6. Audit Optional Integrations (Intentionally non-blocking)
  const integrations: OptionalIntegrationStatus = {
    redis: Boolean(envVars.REDIS_URL && !envVars.REDIS_URL.includes('localhost:6379')),
    gemini: Boolean(envVars.GEMINI_API_KEY && envVars.GEMINI_API_KEY.trim() !== ''),
    cloudinary: Boolean(envVars.CLOUDINARY_API_KEY && envVars.CLOUDINARY_CLOUD_NAME),
    smtp: Boolean(envVars.SENDGRID_API_KEY || envVars.SMTP_HOST),
    paymentGateway: Boolean(envVars.PAYMENT_GATEWAY_KEY_ID && envVars.PAYMENT_GATEWAY_KEY_SECRET),
    creditBureau: Boolean(envVars.CREDIT_BUREAU_API_KEY && envVars.CREDIT_BUREAU_BASE_URL),
    kycGateway: Boolean(envVars.KYC_GATEWAY_API_KEY && envVars.KYC_GATEWAY_BASE_URL),
  };

  if (isProd && !envVars.REDIS_URL) {
    warnings.push('REDIS_URL not configured. Async jobs and caching will operate in localized in-memory fallback mode.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    integrations,
  };
}

export function enforceProductionEnvironmentValidation(): void {
  const result = validateProductionEnvironment();

  if (result.warnings.length > 0) {
    result.warnings.forEach((w) => logger.warn(`[ENV_WARNING] ${w}`));
  }

  if (!result.valid) {
    result.errors.forEach((e) => logger.error(`[ENV_FATAL] ${e}`));
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Production environment startup aborted due to configuration errors: ${result.errors.join('; ')}`);
    }
  }
}

