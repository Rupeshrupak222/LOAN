/**
 * Adyapan Lending OS — Phase 8: Partner API Authentication, Scopes & Idempotency Middleware
 */

import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
  ConflictError,
} from '../common/errors';
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

// In-memory idempotency cache: key -> { status: 'PROCESSING' | 'COMPLETED', statusCode: number, body: any, payloadHash: string, timestamp: number }
const idempotencyStore = new Map<
  string,
  { status: 'PROCESSING' | 'COMPLETED'; statusCode: number; body: any; payloadHash: string; timestamp: number }
>();

/**
 * Authenticates Partner API requests via x-api-key & x-api-secret, Bearer API key, or verified JWT session.
 * Never trusts unauthenticated partnerId or tenantId from request parameters.
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

    if (cred.status === 'REVOKED') {
      throw new ForbiddenError('Partner API credential has been REVOKED. Access permanently disabled.');
    }

    if (cred.status === 'EXPIRED') {
      throw new UnauthorizedError('Partner API credential has EXPIRED. Please rotate or generate new credentials.');
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

  // 3. Fallback: Authenticated session via JWT (req.user)
  if (req.user) {
    const userRoles = (req.user.roles || []).map((r) => r.toUpperCase());
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
    const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('COMPANY_ADMIN');
    const isPartnerRole = userRoles.some((r) =>
      ['PARTNER_ADMIN', 'PARTNER_OPERATIONS', 'PARTNER_AGENT', 'PARTNER_FINANCE', 'PARTNER_SUPPORT', 'PARTNER_API_CLIENT'].includes(r)
    );

    const tenantId = req.user.tenantId || req.tenantId || 'tenant-adyapan-default';

    // Partner users MUST use their bound partnerId. Never trust query or body override.
    let partnerId = req.user.partnerId;

    if (!partnerId) {
      if (isSuperAdmin || isAdmin) {
        // Internal staff acting on partner workspace
        partnerId = (req.query.partnerId as string) || (req.headers['x-partner-id'] as string) || 'part-demo-001';
      } else {
        throw new ForbiddenError('Authenticated user is not associated with a partner organization.');
      }
    } else if (req.query.partnerId && req.query.partnerId !== partnerId) {
      // Prevent cross-partner IDOR
      throw new ForbiddenError(`[IDOR_BLOCKED] Partner user cannot access partner '${req.query.partnerId}'.`);
    }

    const partner = partnerService.getPartner(partnerId);
    if (!partner) {
      throw new NotFoundError(`Partner organization '${partnerId}' not found.`);
    }

    if (partner.tenantId !== tenantId && !isSuperAdmin) {
      throw new ForbiddenError(`[IDOR_BLOCKED] Cross-tenant partner access denied.`);
    }

    if (partner.status === 'SUSPENDED') {
      throw new ForbiddenError('Partner account is currently SUSPENDED.');
    }

    // Derive permitted scopes based on partner user role
    const scopes: PartnerScope[] = [];
    if (isSuperAdmin || isAdmin || userRoles.includes('PARTNER_ADMIN')) {
      scopes.push(
        'partner.customer.read',
        'partner.customer.create',
        'partner.application.create',
        'partner.application.read',
        'partner.application.update',
        'partner.application.submit',
        'partner.document.read',
        'partner.document.upload',
        'partner.offer.read',
        'partner.offer.accept',
        'partner.loan.read',
        'partner.repayment.read',
        'partner.credit_limit.read',
        'partner.drawdown.create',
        'partner.webhook.manage',
        'partner.reporting.read'
      );
    } else if (userRoles.includes('PARTNER_OPERATIONS') || userRoles.includes('PARTNER_AGENT')) {
      scopes.push(
        'partner.customer.read',
        'partner.customer.create',
        'partner.application.create',
        'partner.application.read',
        'partner.application.update',
        'partner.application.submit',
        'partner.document.read',
        'partner.document.upload',
        'partner.offer.read',
        'partner.offer.accept',
        'partner.loan.read'
      );
    } else if (userRoles.includes('PARTNER_FINANCE')) {
      scopes.push(
        'partner.loan.read',
        'partner.repayment.read',
        'partner.reporting.read'
      );
    } else if (userRoles.includes('PARTNER_SUPPORT')) {
      scopes.push(
        'partner.customer.read',
        'partner.application.read',
        'partner.loan.read'
      );
    } else {
      // Default minimal read
      scopes.push('partner.application.read');
    }

    req.partnerContext = {
      partnerId: partner.id,
      partnerCode: partner.code,
      partnerName: partner.name,
      tenantId: partner.tenantId,
      environment: partner.environment,
      scopes,
      allowedProducts: partner.allowedProducts.filter((p) => p.isActive).map((p) => p.productId),
    };
    req.partnerId = partner.id;
    req.tenantId = partner.tenantId;
    return next();
  }

  throw new UnauthorizedError('Partner authentication required. Provide valid x-api-key credentials or partner session.');
}

/**
 * Enforces granular partner API scopes. Hard authorization failure if scope missing.
 */
export function requirePartnerScope(scope: PartnerScope) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.partnerContext) {
      throw new UnauthorizedError('Partner context missing.');
    }

    if (!req.partnerContext.scopes || !req.partnerContext.scopes.includes(scope)) {
      throw new ForbiddenError(`Insufficient permissions: Partner credential lacks required '${scope}' scope.`);
    }

    next();
  };
}

/**
 * Enforces idempotency on state-changing API endpoints via x-idempotency-key header.
 * Key is strictly scoped to tenant + partner + operation + idempotencyKey.
 * Reusing a key with a materially different payload triggers a ConflictError.
 */
export function partnerIdempotency(req: Request, res: Response, next: NextFunction): void {
  const idempotencyKey = (req.headers['x-idempotency-key'] || req.headers['idempotency-key']) as string | undefined;

  if (!idempotencyKey || req.method === 'GET' || req.method === 'HEAD') {
    return next();
  }

  const partnerId = req.partnerContext?.partnerId || 'anonymous';
  const tenantId = req.partnerContext?.tenantId || req.tenantId || 'global';
  const scopedKey = `${tenantId}:${partnerId}:${req.method}:${req.path}:${idempotencyKey}`;
  const currentPayloadHash = crypto.createHash('sha256').update(JSON.stringify(req.body || {})).digest('hex');
  const now = Date.now();

  const cached = idempotencyStore.get(scopedKey);
  if (cached) {
    if (cached.status === 'PROCESSING') {
      throw new ConflictError('Concurrent request with identical idempotency key is currently processing');
    }
    if (cached.payloadHash && cached.payloadHash !== currentPayloadHash) {
      throw new ConflictError('Idempotency key reused with materially different request payload parameters.');
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
    payloadHash: currentPayloadHash,
    timestamp: now,
  });

  // Intercept json response
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    idempotencyStore.set(scopedKey, {
      status: 'COMPLETED',
      statusCode: res.statusCode || 200,
      body,
      payloadHash: currentPayloadHash,
      timestamp: Date.now(),
    });
    return originalJson(body);
  };

  next();
}
