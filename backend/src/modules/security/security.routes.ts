import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { securityService } from './security.service';
import { SecurityEventType, SecuritySeverity } from './security.types';
import { BadRequestError } from '../../common/errors';
import { asyncHandler } from '../../common/asyncHandler';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/security/events
 * Returns security audit events for the active tenant.
 */
router.get(
  '/events',
  authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR'),
  asyncHandler(async (req: Request, res: Response) => {
    const isSuperAdmin = req.user?.roles.includes('SUPER_ADMIN');
    const tenantId = isSuperAdmin ? (req.query.tenantId as string) : req.tenant?.tenantId;
    const type = req.query.type as SecurityEventType | undefined;
    const severity = req.query.severity as SecuritySeverity | undefined;

    const events = securityService.listSecurityEvents(tenantId, { type, severity });

    res.json({
      success: true,
      data: events,
      total: events.length,
    });
  })
);

/**
 * POST /api/v1/security/revoke-session
 * Revokes current or specified access token.
 */
router.post(
  '/revoke-session',
  asyncHandler(async (req: Request, res: Response) => {
    const header = req.headers.authorization;
    const token = req.body?.token || (header?.startsWith('Bearer ') ? header.slice(7) : undefined);

    if (!token) {
      throw new BadRequestError('Token is required for revocation.');
    }

    securityService.revokeToken(token, req.user!.id, req.body?.reason || 'User initiated session signout');

    res.json({
      success: true,
      message: 'Session token successfully revoked. Subsequent requests with this token will be rejected.',
    });
  })
);

/**
 * POST /api/v1/security/mask-pii
 * Utility to test / preview PII masking transformations.
 */
router.post(
  '/mask-pii',
  asyncHandler(async (req: Request, res: Response) => {
    const { pan, aadhaar, bankAccount, phone, email } = req.body;

    res.json({
      success: true,
      data: {
        maskedPan: pan ? securityService.maskPan(pan) : undefined,
        maskedAadhaar: aadhaar ? securityService.maskAadhaar(aadhaar) : undefined,
        maskedBankAccount: bankAccount ? securityService.maskBankAccount(bankAccount) : undefined,
        maskedPhone: phone ? securityService.maskPhone(phone) : undefined,
        maskedEmail: email ? securityService.maskEmail(email) : undefined,
      },
    });
  })
);

export const securityRoutes = router;
