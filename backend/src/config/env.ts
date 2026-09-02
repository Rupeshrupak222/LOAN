import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 4000),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',

  databaseUrl: required(
    'DATABASE_URL',
    'postgresql://postgres:[YOUR-PASSWORD]@db.kbwfydhyfjgnplmcrupq.supabase.co:5432/postgres'
  ),
  directUrl: process.env.DIRECT_URL,
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',

  supabase: {
    url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://kbwfydhyfjgnplmcrupq.supabase.co',
    anonKey:
      process.env.SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      'sb_publishable_rU-FweQxTdJeyH6hxXVzYQ_jt3E9WwM',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'change_me_access_secret_dev_only'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'change_me_refresh_secret_dev_only'),
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  },

  security: {
    loginMaxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS ?? 5),
    loginLockMinutes: Number(process.env.LOGIN_LOCK_MINUTES ?? 15),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 300),
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? 'smsoui35',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '571474773638931',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? 'YPeOcsA_i8gKr8Gq0MP13s9Ba0I',
    url: process.env.CLOUDINARY_URL ?? 'cloudinary://571474773638931:YPeOcsA_i8gKr8Gq0MP13s9Ba0I@smsoui35',
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    model: process.env.GEMINI_MODEL ?? 'gemma-4-31b-it',
  },
} as const;

