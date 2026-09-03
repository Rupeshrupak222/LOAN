import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { workerService } from './worker.service';
import { BadRequestError, NotFoundError } from '../../common/errors';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/jobs/metrics
 * Returns worker pool metrics.
 */
router.get('/metrics', authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR'), (req: Request, res: Response) => {
  const metrics = workerService.getMetrics();
  res.json({
    success: true,
    data: metrics,
  });
});

/**
 * GET /api/v1/jobs/dead-letter
 * Lists jobs that failed all retry attempts.
 */
router.get('/dead-letter', authorize('SUPER_ADMIN', 'ADMIN'), (req: Request, res: Response) => {
  const tenantId = req.user?.roles.includes('SUPER_ADMIN') ? undefined : req.tenant?.tenantId;
  const dlq = workerService.listDeadLetterJobs(tenantId);

  res.json({
    success: true,
    data: dlq,
    total: dlq.length,
  });
});

/**
 * POST /api/v1/jobs/dead-letter/:jobId/retry
 * Requeues a dead-letter job for execution.
 */
router.post(
  '/dead-letter/:jobId/retry',
  authorize('SUPER_ADMIN', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await workerService.retryDeadLetterJob(req.params.jobId);
      res.json({
        success: true,
        message: `Job '${job.id}' successfully requeued from Dead Letter status.`,
        data: job,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/jobs/enqueue
 * Manually enqueues a background job.
 */
router.post(
  '/enqueue',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, payload, priority, idempotencyKey } = req.body;
      if (!type) {
        throw new BadRequestError('Job type is required.');
      }

      const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
      const job = await workerService.enqueueJob({
        tenantId,
        type,
        payload: payload || {},
        priority,
        idempotencyKey,
      });

      res.status(202).json({
        success: true,
        message: `Job '${job.id}' enqueued successfully.`,
        data: job,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const workerRoutes = router;
