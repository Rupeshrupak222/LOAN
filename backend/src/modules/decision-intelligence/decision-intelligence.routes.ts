import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate, authorize } from '../../middleware/auth';
import { decisionIntelligenceService } from './decision-intelligence.service';

const router = Router();

// Require authentication and authorized roles for all decision intelligence routes
router.use(authenticate);
router.use(
  authorize(
    'SUPER_ADMIN',
    'ADMIN',
    'BRANCH_MANAGER',
    'LOAN_OFFICER',
    'CREDIT_ANALYST',
    'UNDERWRITER',
    'FINANCE_OFFICER',
    'COLLECTION_OFFICER',
    'AUDITOR'
  )
);

async function resolveActor(req: any) {
  let branchId = (req.user as any)?.branchId;
  if (!branchId && req.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { branchId: true },
    });
    branchId = dbUser?.branchId || undefined;
  }
  return {
    id: req.user!.id,
    email: req.user!.email,
    roles: req.user!.roles,
    branchId,
  };
}

/**
 * GET /api/v1/decision-intelligence/applications/:applicationId
 * Retrieves unified Advanced Decision Intelligence for an application.
 */
router.get(
  '/applications/:applicationId',
  asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const forceRefresh = req.query.forceRefresh === 'true';
    const actor = await resolveActor(req);

    const result = await decisionIntelligenceService.getApplicationDecisionIntelligence(
      applicationId,
      actor,
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
    const actor = await resolveActor(req);

    const result = await decisionIntelligenceService.getApplicationDecisionIntelligence(
      applicationId,
      actor,
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
    const actor = await resolveActor(req);

    const result = await decisionIntelligenceService.getApplicationDecisionIntelligence(
      applicationId,
      actor
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
    const actor = await resolveActor(req);

    const result = await decisionIntelligenceService.getApplicationDecisionIntelligence(
      applicationId,
      actor
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
    const actor = await resolveActor(req);
    const result = await decisionIntelligenceService.getPortfolioDecisionIntelligence(actor);

    res.json(success(result));
  })
);

export const decisionIntelligenceRoutes = router;
