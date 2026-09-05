import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { complianceService } from './compliance.service';
import { ComplianceExceptionStatus, ComplianceCategory } from './compliance.types';
import { BadRequestError, ForbiddenError } from '../../common/errors';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

// Strict Staff Authorization: Borrowers (CUSTOMER) are strictly forbidden from viewing internal compliance intelligence
const checkStaffAccess = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.roles.includes('CUSTOMER')) {
    throw new ForbiddenError('Access forbidden: Borrowers cannot view or manage compliance controls.');
  }
  next();
};

router.use(checkStaffAccess);

/**
 * GET /api/v1/compliance/overview
 * Returns executive compliance dashboard overview for the active tenant.
 */
router.get(
  '/overview',
  authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR', 'BRANCH_MANAGER', 'UNDERWRITER', 'RISK_OFFICER'),
  (req: Request, res: Response) => {
    const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
    const overview = complianceService.getComplianceOverview(tenantId);

    res.json({
      success: true,
      data: overview,
    });
  }
);

/**
 * GET /api/v1/compliance/rules
 * Lists active compliance rules applicable to the tenant.
 */
router.get(
  '/rules',
  authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR', 'BRANCH_MANAGER', 'UNDERWRITER', 'RISK_OFFICER'),
  (req: Request, res: Response) => {
    const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
    const rules = complianceService.listRules(tenantId);

    res.json({
      success: true,
      data: rules,
      total: rules.length,
    });
  }
);

/**
 * POST /api/v1/compliance/rules
 * Creates or updates a compliance rule for the tenant.
 */
router.post(
  '/rules',
  authorize('SUPER_ADMIN', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
      const rule = await complianceService.upsertRule(tenantId, req.body, req.user as any);

      res.status(201).json({
        success: true,
        message: `Compliance rule '${rule.id}' successfully configured.`,
        data: rule,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/compliance/exceptions
 * Lists compliance exceptions for the tenant.
 */
router.get(
  '/exceptions',
  authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR', 'BRANCH_MANAGER', 'UNDERWRITER', 'RISK_OFFICER'),
  (req: Request, res: Response) => {
    const tenantId = req.user?.roles.includes('SUPER_ADMIN') ? '*' : req.tenant?.tenantId || 'tenant-adyapan-default';
    const status = req.query.status as ComplianceExceptionStatus | undefined;
    const category = req.query.category as ComplianceCategory | undefined;

    const exceptions = complianceService.listExceptions(tenantId, { status, category });

    res.json({
      success: true,
      data: exceptions,
      total: exceptions.length,
    });
  }
);

/**
 * GET /api/v1/compliance/exceptions/:id
 * Gets exception details.
 */
router.get(
  '/exceptions/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR', 'BRANCH_MANAGER', 'UNDERWRITER', 'RISK_OFFICER'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const exception = complianceService.getException(req.params.id);
      if (!exception) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Compliance exception not found' } });
        return;
      }

      res.json({
        success: true,
        data: exception,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/compliance/exceptions/:id/transition
 * Transitions a compliance exception state (e.g. ACKNOWLEDGED, RESOLVED, CLOSED).
 */
router.post(
  '/exceptions/:id/transition',
  authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR', 'BRANCH_MANAGER', 'UNDERWRITER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, remediationPlan, remediationNotes } = req.body;
      if (!status) {
        throw new BadRequestError('Target exception status is required.');
      }

      const updated = await complianceService.transitionException(
        req.params.id,
        status,
        req.user as any,
        { remediationPlan, remediationNotes }
      );

      res.json({
        success: true,
        message: `Compliance exception '${updated.id}' transitioned to '${updated.status}'.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/compliance/evaluate/application
 * Dispatches deterministic compliance evaluation against an application.
 */
router.post(
  '/evaluate/application',
  authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR', 'BRANCH_MANAGER', 'UNDERWRITER', 'LOAN_OFFICER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
      const result = await complianceService.evaluateApplicationCompliance(tenantId, req.body);

      res.json({
        success: true,
        message: `Evaluation completed with score ${result.complianceScore}% (${result.overallStatus}).`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const complianceRoutes = router;
