import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { ForbiddenError } from '../../common/errors';
import { integrationHub } from './integration-hub.service';
import { webhookService } from './webhook.service';
import { tenantIntegrationRoutes } from './tenant-integrations.routes';

const router = Router();

/**
 * 1. List all integration providers and health metrics
 * Restricted to staff roles; Borrowers (CUSTOMER) strictly rejected.
 */
router.get(
  '/providers',
  authenticate,
  asyncHandler(async (req, res) => {
    const isBorrower = req.user?.roles.includes('CUSTOMER');
    if (isBorrower) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot view Integration Hub configurations.');
    }

    const providers = await integrationHub.listProviders();
    res.json(success(providers));
  })
);

/**
 * 2. Get single provider details
 */
router.get(
  '/providers/:providerId',
  authenticate,
  asyncHandler(async (req, res) => {
    const isBorrower = req.user?.roles.includes('CUSTOMER');
    if (isBorrower) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot view Integration Hub configurations.');
    }

    const provider = await integrationHub.getProvider(req.params.providerId);
    if (!provider) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Provider not found' } });
      return;
    }
    res.json(success(provider));
  })
);

/**
 * 3. Test provider connectivity
 * Restricted to SUPER_ADMIN and ADMIN
 */
router.post(
  '/providers/:providerId/test',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const result = await integrationHub.testProvider(req.params.providerId, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
    });
    res.json(success(result));
  })
);

/**
 * 4. Inbound generic webhook receiver
 * Authenticated via provider HMAC signature.
 */
router.post(
  '/webhooks/:providerId',
  asyncHandler(async (req, res) => {
    const providerId = req.params.providerId;
    const signature =
      (req.headers['x-webhook-signature'] as string) ||
      (req.headers['x-razorpay-signature'] as string) ||
      (req.headers['x-signature'] as string);

    const eventId =
      (req.headers['x-event-id'] as string) ||
      req.body?.id ||
      req.body?.event_id ||
      req.body?.eventId ||
      `evt_${Date.now()}`;

    const eventType = req.body?.event || req.body?.type || 'webhook.received';
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});

    const result = await webhookService.handleWebhook({
      providerId,
      eventId,
      eventType,
      rawBody,
      signature,
      headers: req.headers,
      parsedData: req.body || {},
      receivedAt: new Date().toISOString(),
    });

    res.json(success(result));
  })
);

// Mount Tenant-Specific Integration Routing Endpoints (/integrations/tenant...)
router.use(tenantIntegrationRoutes);

// Mount Step 32 External Integration Certification Endpoints (/integrations/certification...)
import { certificationRoutes } from './certification.routes';
router.use('/certification', certificationRoutes);

export default router;
