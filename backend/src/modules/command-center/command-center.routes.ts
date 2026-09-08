import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { BadRequestError } from '../../common/errors';
import { authenticate, authorize } from '../../middleware/auth';
import { commandCenterService } from './command-center.service';

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR', 'BRANCH_MANAGER'));

/**
 * GET /api/v1/command-center/health
 * Aggregates operational telemetry across all 6 core system pillars.
 */
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const health = await commandCenterService.getOperationalHealth({
      roles: req.user!.roles,
    });
    res.json(success(health));
  })
);

/**
 * POST /api/v1/command-center/query
 * Executes natural language queries for executive leadership.
 */
router.post(
  '/query',
  asyncHandler(async (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim() === '') {
      throw new BadRequestError('Query string cannot be empty.');
    }

    const response = await commandCenterService.executeExecutiveQuery(query, {
      id: req.user!.id,
      roles: req.user!.roles,
    });

    res.json(success(response));
  })
);

/**
 * GET /api/v1/command-center/anomalies
 * Lists autonomous policy anomaly alerts requiring human oversight.
 */
router.get(
  '/anomalies',
  asyncHandler(async (req, res) => {
    const anomalies = commandCenterService.listAnomalies({
      roles: req.user!.roles,
    });
    res.json(success(anomalies));
  })
);

/**
 * POST /api/v1/command-center/anomalies/:id/action
 * Records human oversight action (ACKNOWLEDGE, INVESTIGATE, RESOLVE, DISMISS).
 */
router.post(
  '/anomalies/:id/action',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const result = await commandCenterService.handleHumanOversightAction(
      req.params.id,
      req.body,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
      }
    );
    res.json(success(result));
  })
);

/**
 * POST /api/v1/command-center/scan
 * Triggers an on-demand autonomous policy anomaly scan.
 */
router.post(
  '/scan',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const results = await commandCenterService.runAutonomousScan({
      roles: req.user!.roles,
    });
    res.json(success(results));
  })
);

export const commandCenterRoutes = router;
