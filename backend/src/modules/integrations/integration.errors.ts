import { AppError } from '../../common/errors';
import { IntegrationErrorCode, NormalizedIntegrationError } from './integration.types';

export class IntegrationHubError extends AppError {
  public readonly correlationId: string;
  public readonly isRetryable: boolean;
  public readonly providerId?: string;

  constructor(
    statusCode: number,
    code: IntegrationErrorCode,
    message: string,
    options?: {
      correlationId?: string;
      isRetryable?: boolean;
      providerId?: string;
      details?: unknown;
    }
  ) {
    super(statusCode, code, message, options?.details);
    this.correlationId = options?.correlationId || `INT-ERR-${Date.now()}`;
    this.isRetryable = options?.isRetryable ?? false;
    this.providerId = options?.providerId;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toNormalizedError(): NormalizedIntegrationError {
    return {
      code: this.code as IntegrationErrorCode,
      message: this.message,
      httpStatus: this.statusCode,
      isRetryable: this.isRetryable,
      correlationId: this.correlationId,
    };
  }
}

export function sanitizeErrorDetails(details: any): any {
  if (!details) return undefined;
  if (typeof details === 'string') {
    return details
      .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
      .replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=[REDACTED]')
      .replace(/secret=[a-zA-Z0-9_\-]+/gi, 'secret=[REDACTED]');
  }
  if (typeof details === 'object') {
    const copy = Array.isArray(details) ? [...details] : { ...details };
    for (const key of Object.keys(copy)) {
      if (
        /token|secret|password|key|auth|credential/i.test(key) &&
        typeof copy[key] === 'string'
      ) {
        copy[key] = '[REDACTED]';
      } else if (typeof copy[key] === 'object') {
        copy[key] = sanitizeErrorDetails(copy[key]);
      }
    }
    return copy;
  }
  return details;
}

export function mapToNormalizedError(
  err: any,
  correlationId: string,
  providerId?: string
): NormalizedIntegrationError {
  if (err instanceof IntegrationHubError) {
    return err.toNormalizedError();
  }

  // Network timeouts
  if (err.name === 'AbortError' || err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
    return {
      code: 'PROVIDER_TIMEOUT',
      message: `External provider request timed out`,
      httpStatus: 504,
      isRetryable: true,
      correlationId,
    };
  }

  // Connection refused / unreachable
  if (
    err.code === 'ECONNREFUSED' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'EHOSTUNREACH' ||
    err.message?.includes('fetch failed')
  ) {
    return {
      code: 'PROVIDER_UNAVAILABLE',
      message: `External provider service is temporarily unreachable or offline`,
      httpStatus: 503,
      isRetryable: true,
      correlationId,
    };
  }

  // HTTP status codes if from an axios/fetch error response
  const status = err.response?.status || err.status || err.statusCode;
  if (status === 401 || status === 403) {
    return {
      code: 'PROVIDER_AUTH_FAILED',
      message: `Provider authentication or authorization failed`,
      httpStatus: status,
      isRetryable: false,
      correlationId,
    };
  }

  if (status === 429) {
    return {
      code: 'PROVIDER_RATE_LIMITED',
      message: `Provider rate limit exceeded. Retry later.`,
      httpStatus: 429,
      isRetryable: true,
      correlationId,
    };
  }

  if (status >= 400 && status < 500) {
    return {
      code: 'PROVIDER_BAD_REQUEST',
      message: `Provider rejected request as invalid: ${err.message || 'Client error'}`,
      httpStatus: status,
      isRetryable: false,
      correlationId,
    };
  }

  if (status >= 500) {
    return {
      code: 'PROVIDER_SERVER_ERROR',
      message: `Provider returned an internal upstream error`,
      httpStatus: 502,
      isRetryable: true,
      correlationId,
    };
  }

  return {
    code: 'PROVIDER_UNKNOWN_ERROR',
    message: err.message || 'An unexpected integration error occurred',
    httpStatus: 500,
    isRetryable: false,
    correlationId,
  };
}
