import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { hadrService } from './hadr.service';
import { ResilientService } from './hadr.types';
import { BadRequestError } from '../../common/errors';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/hadr/status
 * Returns HA region status, circuit breaker states, and replication lag.
 */
router.get(
  '/status',
  authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR'),
  (req: Request, res: Response) => {
    const status = hadrService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  }
);

/**
 * GET /api/v1/hadr/dr-history
 * Returns history of Disaster Recovery drills.
 */
router.get(
  '/dr-history',
  authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR'),
  (req: Request, res: Response) => {
    const history = hadrService.getDrillHistory();
    res.json({
      success: true,
      data: history,
      total: history.length,
    });
  }
);

/**
 * POST /api/v1/hadr/dr-drill
 * Executes an automated Disaster Recovery simulation drill.
 */
router.post(
  '/dr-drill',
  authorize('SUPER_ADMIN', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await hadrService.executeDRDrill(req.user as any);
      res.json({
        success: true,
        message: `Disaster recovery simulation completed in ${result.achievedRtoSeconds}s with 0 data loss.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/hadr/circuit-breakers/:service/trip
 * Manually trips a service circuit breaker for disaster testing.
 */
router.post(
  '/circuit-breakers/:service/trip',
  authorize('SUPER_ADMIN', 'ADMIN'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const service = req.params.service.toUpperCase() as ResilientService;
      const cb = hadrService.tripCircuitBreaker(service, req.body?.reason || 'Manual test trip');

      res.json({
        success: true,
        message: `Circuit breaker for '${service}' tripped to OPEN. Fallback '${cb.fallbackStrategy}' is now active.`,
        data: cb,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/hadr/circuit-breakers/:service/reset
 * Resets a circuit breaker to CLOSED.
 */
router.post(
  '/circuit-breakers/:service/reset',
  authorize('SUPER_ADMIN', 'ADMIN'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const service = req.params.service.toUpperCase() as ResilientService;
      const cb = hadrService.resetCircuitBreaker(service);

      res.json({
        success: true,
        message: `Circuit breaker for '${service}' successfully reset to CLOSED.`,
        data: cb,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const hadrRoutes = router;
