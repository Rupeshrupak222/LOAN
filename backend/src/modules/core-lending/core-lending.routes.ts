import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { getPageParams } from '../../common/pagination';
import { lifecycleService } from './lifecycle.service';
import { queueService } from './queue.service';
import { assignmentService } from './assignment.service';
import { taskService } from './task.service';
import { activityService } from './activity.service';
import { creditReviewService } from './credit-review.service';
import { approvalService } from './approval.service';
import { loanConversionService } from './loan-conversion.service';

const router = Router();
router.use(authenticate);
router.use(tenantContext);

// ==========================================
// Application Lifecycle & Stage Transitions
// ==========================================

router.post(
  '/applications/:id/transition',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stage, status, reason, metadata } = req.body;
      const actor = {
        id: req.user!.id,
        roles: req.user!.roles,
        tenantId: req.user!.tenantId || undefined,
      };

      const result = await lifecycleService.transitionStage(
        req.params.id,
        stage,
        status,
        actor,
        reason,
        metadata
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/applications/:id/history',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const history = await lifecycleService.getStageHistory(
        req.params.id,
        req.user!.tenantId || undefined
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// Queues & Routing
// ==========================================

router.get(
  '/queues',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const department = req.query.department as string;
      const queues = await queueService.listQueues(
        req.user!.tenantId || undefined,
        department
      );

      res.json({
        success: true,
        data: queues,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/applications/:id/route-queue',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { queueKey, notes } = req.body;
      const result = await queueService.routeApplicationToQueue(
        req.params.id,
        queueKey,
        req.user!.id,
        req.user!.tenantId || undefined,
        notes
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// Assignment Engine
// ==========================================

router.post(
  '/applications/:id/assign',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetUserId, department, workspace, notes } = req.body;
      const result = await assignmentService.assignToUser(
        req.params.id,
        targetUserId,
        department || 'OPERATIONS',
        workspace,
        req.user!.id,
        notes,
        req.user!.tenantId || undefined
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/applications/:id/unassign',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { notes } = req.body;
      const result = await assignmentService.unassign(
        req.params.id,
        req.user!.id,
        notes,
        req.user!.tenantId || undefined
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/applications/:id/assignments',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const history = await assignmentService.getAssignmentHistory(req.params.id);
      res.json({
        success: true,
        data: history,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// Tasks Engine
// ==========================================

router.post(
  '/tasks',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.createTask(
        req.body,
        req.user!.id,
        req.user!.tenantId || undefined
      );

      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/tasks',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pagination = getPageParams(req);
      const filters = {
        status: req.query.status as any,
        priority: req.query.priority as any,
        taskType: req.query.taskType as any,
        entityType: req.query.entityType as string,
        entityId: req.query.entityId as string,
        assignedToUserId: req.query.assignedToUserId as string,
        queueId: req.query.queueId as string,
        isOverdue: req.query.isOverdue === 'true',
      };

      const result = await taskService.listTasks(
        pagination,
        filters,
        req.user!.tenantId || undefined
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/tasks/:id/status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      const updated = await taskService.updateTaskStatus(
        req.params.id,
        status,
        req.user!.id,
        req.user!.tenantId || undefined
      );

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/tasks/:id/assign',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetUserId } = req.body;
      const updated = await taskService.assignTask(
        req.params.id,
        targetUserId,
        req.user!.id,
        req.user!.tenantId || undefined
      );

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// Activities & Notes
// ==========================================

router.post(
  '/activities',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const activity = await activityService.logActivity(
        req.body,
        req.user!.id,
        req.user!.tenantId || undefined
      );

      res.status(201).json({
        success: true,
        data: activity,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/activities',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pagination = getPageParams(req);
      const entityType = req.query.entityType as string;
      const entityId = req.query.entityId as string;

      const result = await activityService.listActivities(
        entityType,
        entityId,
        pagination,
        req.user!.tenantId || undefined
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// Credit Review & Approvals
// ==========================================

router.post(
  '/applications/:id/credit-review',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const review = await creditReviewService.createCreditReview(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.tenantId || undefined
      );

      res.status(201).json({
        success: true,
        data: review,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/applications/:id/credit-reviews',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviews = await creditReviewService.getCreditReviews(req.params.id);
      res.json({
        success: true,
        data: reviews,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/approvals',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const approval = await approvalService.requestApproval(
        req.body,
        req.user!.id,
        req.user!.tenantId || undefined
      );

      res.status(201).json({
        success: true,
        data: approval,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/approvals/:id/decide',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { decision, comments } = req.body;
      const result = await approvalService.decideApproval(
        req.params.id,
        decision,
        comments,
        req.user!.id,
        req.user!.tenantId || undefined
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/approvals',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pagination = getPageParams(req);
      const filters = {
        status: req.query.status as any,
        approvalType: req.query.approvalType as any,
        entityId: req.query.entityId as string,
      };

      const result = await approvalService.listApprovals(
        pagination,
        filters,
        req.user!.tenantId || undefined
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// Application -> Active Loan Conversion
// ==========================================

router.post(
  '/applications/:id/convert-to-loan',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { disbursedAmount, disbursementMethod } = req.body;
      const loan = await loanConversionService.convertApplicationToLoan(
        req.params.id,
        req.user!.id,
        req.user!.tenantId || undefined,
        disbursedAmount,
        disbursementMethod
      );

      res.status(201).json({
        success: true,
        data: loan,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
