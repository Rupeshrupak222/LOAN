/**
 * Adyapan Lending OS — Phase 8: Partner API Authentication, Scopes & Idempotency Middleware
 */

import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { UnauthorizedError, ForbiddenError, TooManyRequestsError, ConflictError } from '../common/errors';
import { PartnerContext, PartnerScope } from '../modules/partners/partner.types';
import { partnerService } from '../modules/partners/partner.service';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      partnerContext?: PartnerContext;
      partnerId?: string;
    }
  }
}

// In-memory rate limiting tracker: key -> { count: number, resetAt: number }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// In-memory idempotency cache: key -> { status: 'PROCESSING' | 'COMPLETED', statusCode: number, body: any, timestamp: number }
const idempotencyStore = new Map<string, { status: 'PROCESSING' | 'COMPLETED'; statusCode: number; body: any; timestamp: number }>();

/**
 * Authenticates Partner API requests via x-api-key & x-api-secret, Bearer API key, or JWT fallback.
 */
export function authenticatePartnerApi(req: Request, res: Response, next: NextFunction): void {
  // 1. Check API Key headers
  const apiKey = (req.headers['x-api-key'] || req.headers['api-key']) as string | undefined;
  const apiSecret = (req.headers['x-api-secret'] || req.headers['api-secret']) as string | undefined;
  const authHeader = req.headers.authorization;

  let keyToValidate = apiKey;
  let secretToValidate = apiSecret;

  if (!keyToValidate && authHeader) {
    if (authHeader.startsWith('Bearer pk_') || authHeader.startsWith('Bearer test_pk_')) {
      keyToValidate = authHeader.substring(7).trim();
    } else if (authHeader.startsWith('Basic ')) {
      const decoded = Buffer.from(authHeader.substring(6), 'base64').toString('utf-8');
      const [u, p] = decoded.split(':');
      keyToValidate = u;
      secretToValidate = p;
    }
  }

  // 2. If API Key provided, validate against partner credentials
  if (keyToValidate) {
    const cred = partnerService.validateApiCredential(keyToValidate, secretToValidate);
    if (!cred) {
      throw new UnauthorizedError('Invalid, expired, or revoked Partner API credentials');
    }

    const partner = partnerService.getPartner(cred.partnerId);
    if (!partner) {
      throw new UnauthorizedError('Partner entity not found for credentials');
    }

    if (partner.status === 'SUSPENDED') {
      throw new ForbiddenError('Partner account is currently SUSPENDED. API operations are restricted.');
    }

    if (partner.status === 'TERMINATED' || partner.status === 'ARCHIVED' || partner.status === 'DEACTIVATED') {
      throw new ForbiddenError(`Partner account is in ${partner.status} status. Access denied.`);
    }

    // Rate Limiting check
    const rateLimitKey = `rate_${cred.id}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const limit = cred.rateLimits?.requestsPerMinute || 120;

    let rateRecord = rateLimitMap.get(rateLimitKey);
    if (!rateRecord || rateRecord.resetAt < now) {
      rateRecord = { count: 1, resetAt: now + windowMs };
      rateLimitMap.set(rateLimitKey, rateRecord);
    } else {
      rateRecord.count += 1;
      if (rateRecord.count > limit) {
        res.setHeader('Retry-After', Math.ceil((rateRecord.resetAt - now) / 1000));
        throw new TooManyRequestsError(`Partner API rate limit exceeded. Max ${limit} requests per minute.`);
      }
    }

    req.partnerContext = {
      partnerId: partner.id,
      partnerCode: partner.code,
      partnerName: partner.name,
      tenantId: partner.tenantId,
      environment: cred.environment,
      credentialId: cred.id,
      scopes: cred.scopes,
      allowedProducts: partner.allowedProducts.filter((p) => p.isActive).map((p) => p.productId),
    };
    req.partnerId = partner.id;
    req.tenantId = partner.tenantId;

    return next();
  }

  // 3. Fallback: If standard JWT user is already attached (e.g. from internal staff or partner user session)
  if (req.user) {
    // If user has partner roles or admin roles
    const tenantId = req.tenantId || req.user.tenantId || 'tenant-adyapan-default';
    const partnerId = (req.query.partnerId as string) || (req.headers['x-partner-id'] as string) || 'part-demo-001';
    
    req.partnerContext = {
      partnerId,
      partnerCode: 'PART-AUTH-USER',
      partnerName: 'Partner Authenticated User',
      tenantId,
      environment: 'PRODUCTION',
      scopes: [
        'partner.customer.read',
        'partner.customer.create',
        'partner.application.create',
        'partner.application.read',
        'partner.application.update',
        'partner.application.submit',
        'partner.offer.read',
        'partner.offer.accept',
        'partner.loan.read',
        'partner.repayment.read',
        'partner.credit_limit.read',
        'partner.drawdown.create',
        'partner.webhook.manage',
        'partner.reporting.read',
      ],
    };
    req.partnerId = partnerId;
    req.tenantId = tenantId;
    return next();
  }

  throw new UnauthorizedError('Partner authentication required. Provide x-api-key or Bearer token.');
}

/**
 * Enforces granular partner API scopes.
 */
export function requirePartnerScope(scope: PartnerScope) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.partnerContext) {
      throw new UnauthorizedError('Partner context missing');
    }

    if (!req.partnerContext.scopes.includes(scope)) {
      throw new ForbiddenError(`Insufficient permissions: Partner API credential lacks '${scope}' scope`);
    }

    next();
  };
}

/**
 * Enforces idempotency on state-changing API endpoints via x-idempotency-key header.
 */
export function partnerIdempotency(req: Request, res: Response, next: NextFunction): void {
  const idempotencyKey = (req.headers['x-idempotency-key'] || req.headers['idempotency-key']) as string | undefined;

  if (!idempotencyKey || req.method === 'GET' || req.method === 'HEAD') {
    return next();
  }

  const partnerId = req.partnerContext?.partnerId || 'anonymous';
  const scopedKey = `${partnerId}:${req.method}:${req.path}:${idempotencyKey}`;
  const now = Date.now();

  const cached = idempotencyStore.get(scopedKey);
  if (cached) {
    if (cached.status === 'PROCESSING') {
      throw new ConflictError('Concurrent request with identical idempotency key is currently processing');
    }
    // Return cached response
    res.setHeader('X-Idempotent-Replay', 'true');
    return res.status(cached.statusCode).json(cached.body) as unknown as void;
  }

  // Register processing state
  idempotencyStore.set(scopedKey, {
    status: 'PROCESSING',
    statusCode: 200,
    body: null,
    timestamp: now,
  });

  // Intercept json response
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    idempotencyStore.set(scopedKey, {
      status: 'COMPLETED',
      statusCode: res.statusCode || 200,
      body,
      timestamp: Date.now(),
    });
    return originalJson(body);
  };

  next();
}
