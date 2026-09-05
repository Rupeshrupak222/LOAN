import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate } from '../../middleware/auth';
import { decisionIntelligenceService } from './decision-intelligence.service';

const router = Router();

// Require authentication for all decision intelligence routes
router.use(authenticate);

/**
 * GET /api/v1/decision-intelligence/applications/:applicationId
 * Retrieves unified Advanced Decision Intelligence for an application.
 */
router.get(
  '/applications/:applicationId',
  asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const forceRefresh = req.query.forceRefresh === 'true';

    const result = await decisionIntelligenceService.getApplicationDecisionIntelligence(
      applicationId,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        branchId: (req.user as any)?.branchId,
      },
      { forceRefresh }
    );

    res.json(success(result));
  })
);

/**
 * POST /api/v1/decision-intelligence/applications/:applicationId/refresh
 * Forces re-evaluation and synthesis of decision intelligence.
 */
router.post(
  '/applications/:applicationId/refresh',
  asyncHandler(async (req, res) => {
    const { applicationId } = req.params;

    const result = await decisionIntelligenceService.getApplicationDecisionIntelligence(
      applicationId,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        branchId: (req.user as any)?.branchId,
      },
      { forceRefresh: true }
    );

    res.json(success(result));
  })
);

/**
 * GET /api/v1/decision-intelligence/applications/:applicationId/conflicts
 * Returns data conflicts and discrepancy evidence for an application.
 */
router.get(
  '/applications/:applicationId/conflicts',
  asyncHandler(async (req, res) => {
    const { applicationId } = req.params;

    const result = await decisionIntelligenceService.getApplicationDecisionIntelligence(
      applicationId,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        branchId: (req.user as any)?.branchId,
      }
    );

    res.json(
      success({
        applicationId,
        conflicts: result.conflicts,
        conflictsExplanation: result.narrative.conflictsExplanation,
      })
    );
  })
);

/**
 * GET /api/v1/decision-intelligence/applications/:applicationId/factors
 * Returns weighted decision factors matrix for an application.
 */
router.get(
  '/applications/:applicationId/factors',
  asyncHandler(async (req, res) => {
    const { applicationId } = req.params;

    const result = await decisionIntelligenceService.getApplicationDecisionIntelligence(
      applicationId,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        branchId: (req.user as any)?.branchId,
      }
    );

    res.json(
      success({
        applicationId,
        readinessState: result.readinessState,
        reviewPriority: result.reviewPriority,
        factors: result.factors,
      })
    );
  })
);

/**
 * GET /api/v1/decision-intelligence/portfolio
 * Aggregates portfolio-level decision intelligence, blockers, and common conflict trends.
 */
router.get(
  '/portfolio',
  asyncHandler(async (req, res) => {
    const result = await decisionIntelligenceService.getPortfolioDecisionIntelligence({
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      branchId: (req.user as any)?.branchId,
    });

    res.json(success(result));
  })
);

export const decisionIntelligenceRoutes = router;
