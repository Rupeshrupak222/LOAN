import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { ForbiddenError, NotFoundError } from '../../common/errors';
import { prisma } from '../../config/prisma';
import { bankIntelligenceService } from './bank-intelligence.service';

const router = Router();

/**
 * 1. Trigger live Bank Statement fetch via Step 12 Integration Hub
 * Staff only. Borrowers strictly barred.
 */
router.post(
  '/customers/:customerId/fetch',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_ANALYST', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const result = await bankIntelligenceService.fetchViaIntegrationHub(req.params.customerId, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
    });
    res.json(success(result));
  })
);

/**
 * 2. Ingest authorized statement transactions
 * Staff only.
 */
router.post(
  '/customers/:customerId/ingest',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_ANALYST', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const result = await bankIntelligenceService.ingestStatement(
      req.params.customerId,
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
 * 3. Analyze customer statement (force refresh)
 * Staff only.
 */
router.post(
  '/customers/:customerId/analyze',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_ANALYST', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const result = await bankIntelligenceService.analyzeCustomerStatement(
      req.params.customerId,
      { forceRefresh: true },
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
 * 4. Get customer Bank Statement Intelligence
 * Staff can view any; Borrower can only view their own sanitized intelligence.
 */
router.get(
  '/customers/:customerId',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await bankIntelligenceService.analyzeCustomerStatement(
      req.params.customerId,
      { forceRefresh: false },
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
 * 5. Get Bank Statement Intelligence for loan application decision support
 * Staff only.
 */
router.get(
  '/applications/:applicationId',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_ANALYST', 'LOAN_OFFICER', 'BRANCH_MANAGER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const app = await prisma.loanApplication.findUnique({
      where: { id: req.params.applicationId },
      select: { customerId: true },
    });

    if (!app) {
      throw new NotFoundError(`Loan application with ID '${req.params.applicationId}' not found.`);
    }

    const result = await bankIntelligenceService.analyzeCustomerStatement(
      app.customerId,
      { forceRefresh: false },
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
      }
    );
    res.json(success(result));
  })
);

export default router;
