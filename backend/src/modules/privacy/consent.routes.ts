import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { privacyConsentService } from './consent.service';
import { ConsentType, ConsentStatus } from './consent.types';
import { BadRequestError } from '../../common/errors';
import { asyncHandler } from '../../common/asyncHandler';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/privacy/overview
 * Executive overview of consent metrics and opt-in rates.
 */
router.get(
  '/overview',
  authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR', 'BRANCH_MANAGER'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
    const overview = privacyConsentService.getPrivacyOverview(tenantId);

    res.json({
      success: true,
      data: overview,
    });
  })
);

/**
 * GET /api/v1/privacy/purposes
 * Lists active configurable consent purposes.
 */
router.get(
  '/purposes',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
    const purposes = privacyConsentService.listPurposes(tenantId);

    res.json({
      success: true,
      data: purposes,
      total: purposes.length,
    });
  })
);

/**
 * POST /api/v1/privacy/purposes
 * Creates or updates purpose template (bumping active version).
 */
router.post(
  '/purposes',
  authorize('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
    const purpose = await privacyConsentService.upsertPurpose(tenantId, req.body, req.user as any);

    res.status(201).json({
      success: true,
      message: `Purpose '${purpose.purposeCode}' updated to version ${purpose.activeVersion}.`,
      data: purpose,
    });
  })
);

/**
 * GET /api/v1/privacy/consents
 * Lists consent records with tenant and customer scoping.
 */
router.get(
  '/consents',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.roles.includes('SUPER_ADMIN') ? '*' : req.tenant?.tenantId || 'tenant-adyapan-default';
    let customerId = req.query.customerId as string | undefined;

    // Borrower scoping: borrowers can ONLY query their own consent records
    if (req.user?.roles.includes('CUSTOMER')) {
      customerId = req.user.id;
    }

    const consentType = req.query.consentType as ConsentType | undefined;
    const status = req.query.status as ConsentStatus | undefined;

    const records = privacyConsentService.listConsents(tenantId, { customerId, consentType, status });

    res.json({
      success: true,
      data: records,
      total: records.length,
    });
  })
);

/**
 * POST /api/v1/privacy/consents/grant
 * Records explicit customer consent.
 */
router.post(
  '/consents/grant',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
    let customerId = req.body.customerId;

    // Borrower self-scoping
    if (req.user?.roles.includes('CUSTOMER')) {
      customerId = req.user.id;
    }

    if (!customerId || !req.body.purposeCode || !req.body.channel) {
      throw new BadRequestError('customerId, purposeCode, and channel are required.');
    }

    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
    const userAgent = req.headers['user-agent'];

    const record = await privacyConsentService.grantConsent(
      {
        tenantId,
        customerId,
        purposeCode: req.body.purposeCode,
        channel: req.body.channel,
        ipAddress,
        userAgent,
        evidenceRef: req.body.evidenceRef,
        metadata: req.body.metadata,
      },
      req.user as any
    );

    res.status(201).json({
      success: true,
      message: `Consent granted for purpose '${record.purposeCode}' (version ${record.version}).`,
      data: record,
    });
  })
);

/**
 * POST /api/v1/privacy/consents/:id/withdraw
 * Withdraws active customer consent.
 */
router.post(
  '/consents/:id/withdraw',
  asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;
    const record = await privacyConsentService.withdrawConsent(req.params.id, reason, req.user as any);

    res.json({
      success: true,
      message: `Consent '${record.id}' successfully withdrawn.`,
      data: record,
    });
  })
);

/**
 * POST /api/v1/privacy/enforce
 * Evaluates whether required consent is actively granted for an operation.
 */
router.post(
  '/enforce',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
    const { customerId, requiredType, purposeCode } = req.body;

    if (!customerId || !requiredType) {
      throw new BadRequestError('customerId and requiredType are required.');
    }

    const result = privacyConsentService.checkEnforcement(tenantId, customerId, requiredType, purposeCode);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/v1/privacy/preferences
 * Returns customer privacy preferences.
 */
router.get(
  '/preferences',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
    const customerId = req.user?.roles.includes('CUSTOMER') ? req.user.id : (req.query.customerId as string);

    if (!customerId) {
      throw new BadRequestError('customerId is required.');
    }

    const prefs = privacyConsentService.getPreferences(customerId, tenantId);

    res.json({
      success: true,
      data: prefs,
    });
  })
);

/**
 * PUT /api/v1/privacy/preferences
 * Updates customer privacy preferences.
 */
router.put(
  '/preferences',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
    const customerId = req.user?.roles.includes('CUSTOMER') ? req.user.id : req.body.customerId;

    if (!customerId) {
      throw new BadRequestError('customerId is required.');
    }

    const updated = await privacyConsentService.updatePreferences(customerId, tenantId, req.body, req.user as any);

    res.json({
      success: true,
      message: 'Privacy preferences updated.',
      data: updated,
    });
  })
);

/**
 * POST /api/v1/privacy/ai-sanitize
 * Demonstrates AI prompt data minimization and consent checking.
 */
router.post(
  '/ai-sanitize',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
    const sanitized = privacyConsentService.sanitizeForAiPrompt(tenantId, req.body);

    res.json({
      success: true,
      data: sanitized,
    });
  })
);

export const privacyRoutes = router;
