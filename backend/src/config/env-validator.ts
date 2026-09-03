import { logger } from './logger';

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProductionEnvironment(envVars: Record<string, string | undefined> = process.env): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const isProd = envVars.NODE_ENV === 'production';

  // 1. Mandatory Database URL
  if (!envVars.DATABASE_URL) {
    errors.push('DATABASE_URL is required.');
  } else if (isProd && (envVars.DATABASE_URL.includes('localhost') || envVars.DATABASE_URL.includes('127.0.0.1'))) {
    warnings.push('DATABASE_URL points to localhost in production mode.');
  }

  // 2. JWT Access Secret
  if (!envVars.JWT_ACCESS_SECRET) {
    errors.push('JWT_ACCESS_SECRET is required.');
  } else if (isProd && (envVars.JWT_ACCESS_SECRET.includes('change_me') || envVars.JWT_ACCESS_SECRET.length < 32)) {
    errors.push('JWT_ACCESS_SECRET in production must be at least 32 characters and cannot use default placeholders.');
  }

  // 3. JWT Refresh Secret
  if (!envVars.JWT_REFRESH_SECRET) {
    errors.push('JWT_REFRESH_SECRET is required.');
  } else if (isProd && (envVars.JWT_REFRESH_SECRET.includes('change_me') || envVars.JWT_REFRESH_SECRET.length < 32)) {
    errors.push('JWT_REFRESH_SECRET in production must be at least 32 characters and cannot use default placeholders.');
  }

  // 4. Redis URL Warning
  if (!envVars.REDIS_URL && isProd) {
    warnings.push('REDIS_URL not configured. Async jobs and caching will operate in localized in-memory fallback mode.');
  }

  // 5. Port Validation
  if (envVars.PORT && isNaN(Number(envVars.PORT))) {
    errors.push(`PORT must be a valid integer, received '${envVars.PORT}'.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
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
