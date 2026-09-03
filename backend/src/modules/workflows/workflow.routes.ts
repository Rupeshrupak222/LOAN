import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { workflowService } from './workflow.service';
import { WorkflowType } from './workflow.types';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/workflows
 * Lists active workflows for current tenant.
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const list = workflowService.listWorkflows(tenantId);
    res.json({
      success: true,
      data: list,
      total: list.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/workflows/evaluate-transition
 * Evaluates candidate application transition against gates and branching.
 */
router.post('/evaluate-transition', (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const result = workflowService.evaluateWorkflowTransition(tenantId, req.body, req.user as any);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/workflows/:type
 * Returns active workflow definition by type.
 */
router.get('/:type', (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const wf = workflowService.getWorkflowByType(tenantId, req.params.type as WorkflowType);
    res.json({
      success: true,
      data: wf,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/workflows
 * Creates custom workflow.
 */
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
      const wf = await workflowService.createWorkflow(tenantId, req.body, req.user as any);
      res.status(201).json({
        success: true,
        message: `Workflow '${wf.name}' (${wf.code}) created successfully.`,
        data: wf,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/v1/workflows/:id/stages
 * Updates workflow stages, gates, and branching rules.
 */
router.put(
  '/:id/stages',
  authorize('SUPER_ADMIN', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
      const wf = await workflowService.updateWorkflowStages(
        tenantId,
        req.params.id,
        req.body.stages,
        req.user as any
      );
      res.json({
        success: true,
        message: `Workflow stages for '${wf.name}' updated successfully.`,
        data: wf,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const workflowRoutes = router;
