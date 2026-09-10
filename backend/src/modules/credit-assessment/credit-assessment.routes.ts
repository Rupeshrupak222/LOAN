import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { creditRecommendationSchema, forwardUnderwritingSchema } from './credit-assessment.schema';
import {
  getAssessmentDashboardMetrics,
  getAssessmentQueue,
  getAssessmentDetail,
  submitCreditRecommendation,
  forwardToUnderwriting,
} from './credit-assessment.service';
import { startCreditAssessment } from '../credit/credit.service';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

const CREDIT_STAFF = [
  'CREDIT_ANALYST',
  'BRANCH_MANAGER',
  'UNDERWRITER',
  'SUPER_ADMIN',
  'COMPANY_ADMIN',
  'ADMIN',
  'AUDITOR',
  'FINANCE_OFFICER',
  'DISBURSEMENT_OFFICER',
];

// 1. Credit Assessment Dashboard Overview Metrics
router.get(
  '/dashboard',
  authorize(...CREDIT_STAFF),
  asyncHandler(async (req, res) => {
    const metrics = await getAssessmentDashboardMetrics({
      id: req.user?.id,
      email: req.user?.email,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(metrics));
  })
);

// 2. Credit Assessment Active Work Queue
router.get(
  '/queue',
  authorize(...CREDIT_STAFF),
  asyncHandler(async (req, res) => {
    const tab = typeof req.query.tab === 'string' ? req.query.tab : 'ALL';
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const queue = await getAssessmentQueue(tab, search, {
      id: req.user?.id,
      email: req.user?.email,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(queue));
  })
);

// 3. Credit Assessment Detail Workspace Bundle
router.get(
  '/:applicationId',
  authorize(...CREDIT_STAFF),
  asyncHandler(async (req, res) => {
    const detail = await getAssessmentDetail(req.params.applicationId, {
      id: req.user?.id,
      email: req.user?.email,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(detail));
  })
);

// 4. Record Credit Analyst Recommendation
router.post(
  '/:applicationId/recommendation',
  authorize('CREDIT_ANALYST', 'BRANCH_MANAGER', 'UNDERWRITER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  validate(creditRecommendationSchema),
  asyncHandler(async (req, res) => {
    const result = await submitCreditRecommendation(
      req.params.applicationId,
      req.body,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        tenantId: req.tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      }
    );
    res.json(success(result));
  })
);

// 5. Forward Completed Assessment to Underwriting
router.post(
  '/:applicationId/forward-underwriting',
  authorize('CREDIT_ANALYST', 'BRANCH_MANAGER', 'UNDERWRITER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  validate(forwardUnderwritingSchema),
  asyncHandler(async (req, res) => {
    const result = await forwardToUnderwriting(
      req.params.applicationId,
      req.body,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        tenantId: req.tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      }
    );
    res.json(success(result));
  })
);

router.post(
  '/:applicationId/forward',
  authorize('CREDIT_ANALYST', 'BRANCH_MANAGER', 'UNDERWRITER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  validate(forwardUnderwritingSchema),
  asyncHandler(async (req, res) => {
    const result = await forwardToUnderwriting(
      req.params.applicationId,
      req.body,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        tenantId: req.tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      }
    );
    res.json(success(result));
  })
);

export default router;
