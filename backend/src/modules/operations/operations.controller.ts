import { Request, Response } from 'express';
import { operationsService } from './operations.service';
import { lifecycleService } from '../core-lending/lifecycle.service';
import { assignmentService } from '../core-lending/assignment.service';
import { queueService } from '../core-lending/queue.service';
import { taskService } from '../core-lending/task.service';
import { activityService } from '../core-lending/activity.service';
import { BadRequestError } from '../../common/errors';

export class OperationsController {
  async getOverview(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const data = await operationsService.getOperationsOverview(userId, tenantId);
    return res.json({ success: true, data });
  }

  async listApplications(req: Request, res: Response) {
    const tenantId = (req as any).user?.tenantId;
    const result = await operationsService.listApplications(req.query as any, tenantId);
    return res.json({ success: true, data: result.data, meta: result.meta });
  }

  async getApplicationDetails(req: Request, res: Response) {
    const tenantId = (req as any).user?.tenantId;
    const { id } = req.params;
    const data = await operationsService.getApplicationDetails(id, tenantId);
    return res.json({ success: true, data });
  }

  async createApplication(req: Request, res: Response) {
    const actorId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const app = await operationsService.createApplication(req.body, actorId, tenantId);
    return res.status(201).json({ success: true, data: app, message: 'Application created successfully' });
  }

  async submitApplication(req: Request, res: Response) {
    const actorId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const { id } = req.params;
    const updated = await operationsService.submitApplication(id, actorId, tenantId);
    return res.json({ success: true, data: updated, message: 'Application submitted to operational queue' });
  }

  async transitionStage(req: Request, res: Response) {
    const actorId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const roles = (req as any).user.roles || [];
    const { id } = req.params;
    const { stage, status, reason, expectedUpdatedAt } = req.body;

    if (!stage) {
      throw new BadRequestError('Stage is required');
    }

    if (expectedUpdatedAt) {
      await operationsService.checkConcurrency(id, expectedUpdatedAt);
    }

    const updated = await lifecycleService.transitionStage(
      id,
      stage,
      status,
      { id: actorId, roles, tenantId },
      reason
    );
    return res.json({ success: true, data: updated, message: `Application transitioned to ${stage}` });
  }

  async assignApplication(req: Request, res: Response) {
    const actorId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const { id } = req.params;
    const { userId, queueKey, notes, priority, department, workspace } = req.body;

    let result;
    if (userId) {
      result = await assignmentService.assignToUser(
        id,
        userId,
        department || 'OPERATIONS',
        workspace,
        actorId,
        notes,
        tenantId
      );
    } else if (queueKey) {
      result = await queueService.routeApplicationToQueue(id, queueKey, actorId, tenantId, notes);
    } else {
      throw new BadRequestError('Either userId or queueKey must be provided');
    }

    if (priority) {
      await operationsService.updatePriority(id, priority, actorId, tenantId);
    }

    return res.json({ success: true, data: result, message: 'Assignment updated successfully' });
  }

  async updatePriority(req: Request, res: Response) {
    const actorId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const { id } = req.params;
    const { priority } = req.body;
    if (!priority) throw new BadRequestError('Priority is required');
    const updated = await operationsService.updatePriority(id, priority, actorId, tenantId);
    return res.json({ success: true, data: updated, message: 'Priority updated successfully' });
  }

  async getTeamQueue(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const result = await operationsService.getTeamQueue(req.query as any, userId, tenantId);
    return res.json({
      success: true,
      data: result.data,
      meta: result.meta,
      queues: result.queues,
    });
  }

  async claimQueueItem(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const { id } = req.params;
    const result = await operationsService.claimQueueItem(id, userId, tenantId);
    return res.json({ success: true, data: result, message: 'Queue item claimed successfully' });
  }

  async verifyDocument(req: Request, res: Response) {
    const actorId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const { id } = req.params;
    const updated = await operationsService.verifyDocument(id, req.body, actorId, tenantId);
    return res.json({ success: true, data: updated, message: 'Document verification updated' });
  }

  async listCustomers(req: Request, res: Response) {
    const tenantId = (req as any).user?.tenantId;
    const result = await operationsService.listCustomers(req.query as any, tenantId);
    return res.json({ success: true, data: result.data, meta: result.meta });
  }

  async getCustomer360(req: Request, res: Response) {
    const tenantId = (req as any).user?.tenantId;
    const { id } = req.params;
    const data = await operationsService.getCustomer360(id, tenantId);
    return res.json({ success: true, data });
  }

  async listMyTasks(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const { page: p, pageSize: ps, status, priority, taskType, entityType, entityId, isOverdue } = req.query as any;
    const page = Math.max(1, Number(p) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(ps) || 20));
    const skip = (page - 1) * pageSize;

    const result = await taskService.listTasks(
      { page, pageSize, skip, take: pageSize, sortDir: 'desc' },
      {
        status,
        priority,
        taskType,
        entityType,
        entityId,
        isOverdue: isOverdue === 'true',
        assignedToUserId: userId,
      },
      tenantId
    );
    return res.json({ success: true, data: result.data, pagination: result.pagination });
  }

  async createTask(req: Request, res: Response) {
    const actorId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const task = await taskService.createTask(req.body, actorId, tenantId);
    return res.status(201).json({ success: true, data: task, message: 'Task created successfully' });
  }

  async updateTaskStatus(req: Request, res: Response) {
    const actorId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const { id } = req.params;
    const { status } = req.body;
    const updated = await taskService.updateTaskStatus(id, status, actorId, tenantId);
    return res.json({ success: true, data: updated, message: 'Task status updated' });
  }

  async addActivityNote(req: Request, res: Response) {
    const actorId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const { id } = req.params;
    const { title, message } = req.body;
    if (!message) throw new BadRequestError('Message is required');

    const note = await activityService.logActivity(
      {
        entityType: 'APPLICATION',
        entityId: id,
        activityType: 'NOTE',
        title: title || 'Operational Note',
        message,
      },
      actorId,
      tenantId
    );
    return res.status(201).json({ success: true, data: note, message: 'Note recorded' });
  }
}

export const operationsController = new OperationsController();
