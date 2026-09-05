import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate } from '../../middleware/auth';
import { communicationService } from './communication.service';
import { TEMPLATE_REGISTRY } from './template.registry';

const router = Router();

router.use(authenticate);

/**
 * POST /api/v1/communications/send
 * Dispatches a communication notice across Email, SMS, WhatsApp, or In-App.
 */
router.post(
  '/send',
  asyncHandler(async (req, res) => {
    const record = await communicationService.sendMessage(req.body, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
    });
    res.json(success(record));
  })
);

/**
 * POST /api/v1/communications/preview
 * Previews rendered template with dynamic tokens and automated PII masking.
 */
router.post(
  '/preview',
  asyncHandler(async (req, res) => {
    const { templateCode, variables, channel } = req.body;
    const preview = communicationService.previewTemplate(templateCode, variables || {}, channel || 'EMAIL');
    res.json(success(preview));
  })
);

/**
 * GET /api/v1/communications/templates
 * Lists all standardized templates with channel and variable schemas.
 */
router.get(
  '/templates',
  asyncHandler(async (_req, res) => {
    const templates = Object.values(TEMPLATE_REGISTRY);
    res.json(success(templates));
  })
);

/**
 * GET /api/v1/communications/logs
 * Queries communication delivery logs with filtering.
 */
router.get(
  '/logs',
  asyncHandler(async (req, res) => {
    const { channel, status, category, recipient, customerId } = req.query;

    const logs = communicationService.listCommunications(
      {
        channel: channel as string,
        status: status as string,
        category: category as string,
        recipient: recipient as string,
        customerId: customerId as string,
      },
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
      }
    );

    res.json(success(logs));
  })
);

/**
 * GET /api/v1/communications/stats
 * Retrieves aggregated delivery rates, channel counts, and RBI window status.
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const stats = communicationService.getStats({
      id: req.user!.id,
      roles: req.user!.roles,
    });
    res.json(success(stats));
  })
);

export const communicationRoutes = router;
