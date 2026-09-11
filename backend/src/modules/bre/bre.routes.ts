import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { breService } from './bre.service';
import { ok, created } from '../../common/response';
import { BadRequestError } from '../../common/errors';

export const breRoutes = Router();

// Authenticate all BRE routes
breRoutes.use(authenticate);

/**
 * GET /api/v1/bre/ruleset
 * Retrieve active ruleset for current tenant/product
 */
breRoutes.get(
  '/ruleset',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const productId = req.query.productId as string | undefined;
      const ruleSet = await breService.getActiveRuleSet(user?.tenantId, productId);
      return ok(res, ruleSet);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/bre/ruleset
 * Update or deploy a ruleset (Requires SUPER_ADMIN, ADMIN, or UNDERWRITER)
 */
breRoutes.post(
  '/ruleset',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'UNDERWRITER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const body = req.body;
      if (!body || !body.rules || !Array.isArray(body.rules)) {
        throw new BadRequestError('Invalid ruleset payload. Must contain rules array.');
      }
      const saved = await breService.saveRuleSet(
        {
          ...body,
          tenantId: user?.tenantId || body.tenantId || 'GLOBAL',
        },
        { id: user?.id, tenantId: user?.tenantId }
      );
      return created(res, saved);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/bre/evaluate
 * Evaluate arbitrary candidate context against active ruleset
 */
breRoutes.post(
  '/evaluate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const context = req.body;
      if (!context) throw new BadRequestError('Context payload is required for BRE evaluation.');
      const ruleSet = await breService.getActiveRuleSet(user?.tenantId, context.productId);
      const result = breService.evaluateRuleSet(ruleSet, context);
      return ok(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/bre/evaluate/:applicationId
 * Evaluate live loan application against BRE and update eligibility assessment
 */
breRoutes.post(
  '/evaluate/:applicationId',
  authorize('SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const { applicationId } = req.params;
      const result = await breService.evaluateApplication(applicationId, {
        id: user?.id,
        tenantId: user?.tenantId,
      });
      return ok(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/bre/simulate
 * Run batch what-if simulation against a candidate ruleset
 */
breRoutes.post(
  '/simulate',
  authorize('SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'RISK_HEAD'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const { ruleSet, sampleContexts } = req.body;
      if (!sampleContexts || !Array.isArray(sampleContexts)) {
        throw new BadRequestError('sampleContexts array is required for simulation.');
      }
      const targetRuleSet = ruleSet || (await breService.getActiveRuleSet(user?.tenantId));
      const simulation = breService.simulate(targetRuleSet, sampleContexts);
      return ok(res, simulation);
    } catch (err) {
      next(err);
    }
  }
);

export default breRoutes;
