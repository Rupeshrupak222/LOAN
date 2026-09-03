import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { slaSupportService } from './sla-support.service';
import { BadRequestError } from '../../common/errors';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/support/tickets
 * Lists support tickets within tenant scope.
 */
router.get('/tickets', (req: Request, res: Response) => {
  const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
  const list = slaSupportService.listTickets(tenantId);
  res.json({
    success: true,
    data: list,
    total: list.length,
  });
});

/**
 * POST /api/v1/support/tickets
 * Creates a new support ticket with dynamic SLA deadlines.
 */
router.post('/tickets', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, category, severity, customerEmail } = req.body;
    if (!title || !description || !category || !severity) {
      throw new BadRequestError('title, description, category, and severity are required.');
    }

    const ticket = slaSupportService.createTicket(
      {
        title,
        description,
        category,
        severity,
        customerEmail: customerEmail || (req.user as any)?.email,
      },
      req.user as any
    );

    res.status(201).json({
      success: true,
      message: `Support ticket '${ticket.id}' created with severity '${ticket.severity}'.`,
      data: ticket,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/support/tickets/:id/status
 * Updates ticket progress and calculates SLA acknowledgment/resolution.
 */
router.put('/tickets/:id/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, resolutionNotes } = req.body;
    if (!status) {
      throw new BadRequestError('status is required.');
    }

    const updated = slaSupportService.updateTicketStatus(
      req.params.id,
      status,
      resolutionNotes,
      req.user as any
    );

    res.json({
      success: true,
      message: `Ticket '${req.params.id}' status updated to '${status}'.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/support/tickets/:id/escalate
 * Escalates ticket to a specialized engineering/security team.
 */
router.post('/tickets/:id/escalate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetTeam, reason } = req.body;
    if (!targetTeam || !reason) {
      throw new BadRequestError('targetTeam and reason are required.');
    }

    const updated = slaSupportService.escalateTicket(
      req.params.id,
      targetTeam,
      reason,
      req.user as any
    );

    res.json({
      success: true,
      message: `Ticket '${req.params.id}' successfully escalated to '${targetTeam}'.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/support/incidents
 * Lists active and resolved enterprise incidents.
 */
router.get('/incidents', (req: Request, res: Response) => {
  const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
  const list = slaSupportService.listIncidents(tenantId);
  res.json({
    success: true,
    data: list,
    total: list.length,
  });
});

/**
 * POST /api/v1/support/incidents
 * Declares a new enterprise incident (Super Admin / Admin only).
 */
router.post(
  '/incidents',
  authorize('SUPER_ADMIN', 'ADMIN'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, impactedService, severity, impactSummary } = req.body;
      if (!title || !impactedService || !severity) {
        throw new BadRequestError('title, impactedService, and severity are required.');
      }

      const incident = slaSupportService.createIncident(
        {
          title,
          impactedService,
          severity,
          impactSummary: impactSummary || 'Enterprise incident declared.',
        },
        req.user as any
      );

      res.status(201).json({
        success: true,
        message: `Enterprise incident '${incident.id}' declared.`,
        data: incident,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/v1/support/incidents/:id/stage
 * Advances incident lifecycle stage.
 */
router.put(
  '/incidents/:id/stage',
  authorize('SUPER_ADMIN', 'ADMIN'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stage, rootCause, mitigationSteps } = req.body;
      if (!stage) {
        throw new BadRequestError('stage is required.');
      }

      const updated = slaSupportService.updateIncidentStage(
        req.params.id,
        stage,
        rootCause,
        mitigationSteps,
        req.user as any
      );

      res.json({
        success: true,
        message: `Incident '${req.params.id}' stage advanced to '${stage}'.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/support/sla-report
 * Retrieves SLA metrics, MTTA/MTTR, and compliance percentage.
 */
router.get('/sla-report', (req: Request, res: Response) => {
  const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
  const report = slaSupportService.generateSlaMetricsReport(tenantId);
  res.json({
    success: true,
    data: report,
  });
});

export const slaSupportRoutes = router;
