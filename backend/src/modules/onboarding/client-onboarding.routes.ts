import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { clientOnboardingService } from './client-onboarding.service';
import { ChecklistItemCode } from './client-onboarding.types';
import { BadRequestError, ForbiddenError } from '../../common/errors';

const router = Router();

router.use(authenticate);
router.use(tenantContext);
router.use(authorize('SUPER_ADMIN', 'ADMIN'));

/**
 * GET /api/v1/client-onboarding
 * Lists all commercial onboarding dossiers.
 */
router.get('/', (req: Request, res: Response) => {
  const list = clientOnboardingService.listOnboardings();
  res.json({
    success: true,
    data: list,
    total: list.length,
  });
});

/**
 * GET /api/v1/client-onboarding/:id
 * Gets detailed commercial onboarding record with 16-point checklist.
 */
router.get('/:id', (req: Request, res: Response) => {
  const record = clientOnboardingService.getOnboardingById(req.params.id);
  res.json({
    success: true,
    data: record,
  });
});

/**
 * POST /api/v1/client-onboarding/initiate
 * Initiates new commercial client onboarding.
 */
router.post('/initiate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await clientOnboardingService.initiateOnboarding(req.body, req.user as any);
    res.status(201).json({
      success: true,
      message: `Commercial onboarding initiated for '${record.name}' (${record.code}).`,
      data: record,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/client-onboarding/:id/checklist
 * Updates progress on a specific checklist task.
 */
router.put('/:id/checklist', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemCode, status, blockerReason } = req.body;
    if (!itemCode || !status) {
      throw new BadRequestError('itemCode and status are required.');
    }

    const updated = clientOnboardingService.updateChecklistItem(
      req.params.id,
      itemCode as ChecklistItemCode,
      status,
      blockerReason,
      req.user as any
    );

    res.json({
      success: true,
      message: `Checklist task '${itemCode}' updated to '${status}'.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/client-onboarding/:id/validate
 * Runs automated go-live validation checks.
 */
router.get('/:id/validate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = clientOnboardingService.validateGoLiveReadiness(req.params.id);
    res.json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/client-onboarding/:id/approve-provision
 * Super Admin approval and idempotent provisioning.
 */
router.post(
  '/:id/approve-provision',
  authorize('SUPER_ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notes = req.body.notes || 'Executive go-live sign-off approved.';
      const activated = await clientOnboardingService.approveAndProvisionTenant(
        req.params.id,
        notes,
        req.user as any
      );

      res.json({
        success: true,
        message: `Institution '${activated.name}' successfully provisioned and activated!`,
        data: activated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/client-onboarding/:id/deactivate
 * Super Admin controlled offboarding with statutory 8-year financial data retention.
 */
router.post(
  '/:id/deactivate',
  authorize('SUPER_ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reason = req.body.reason || 'Commercial institution offboarding requested.';
      const deactivated = await clientOnboardingService.deactivateTenantWithRetention(
        req.params.id,
        reason,
        req.user as any
      );

      res.json({
        success: true,
        message: `Institution '${deactivated.name}' deactivated with statutory 8-year financial data retention lock.`,
        data: deactivated,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const clientOnboardingRoutes = router;
