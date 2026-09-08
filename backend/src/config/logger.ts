import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.isProduction ? 'info' : 'debug',
  transport: env.isProduction
    ? undefined
    : {
        target: 'pino/file',
        options: { destination: 1 },
      },
  // Never log secrets, credentials, tokens, or sensitive PII
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.refreshToken',
      '*.tokenHash',
      '*.secret',
      '*.apiKey',
      '*.apiSecret',
      '*.serviceRoleKey',
      '*.pan',
      '*.aadhaar',
      '*.bankAccountNo',
      '*.accountNumber',
      '*.cvv',
      '*.otp',
    ],
    remove: true,
  },
});

