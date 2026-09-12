import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { TaskPriority, TaskStatus, TaskType } from './core-lending.types';
import { logAudit } from '../audit/audit.service';

export interface CreateTaskDto {
  title: string;
  description?: string;
  taskType: TaskType;
  entityType: 'APPLICATION' | 'CUSTOMER' | 'LOAN' | 'COLLECTION_CASE' | 'DOCUMENT' | 'APPROVAL';
  entityId: string;
  applicationId?: string;
  assignedToUserId?: string;
  assignedTeam?: string;
  queueId?: string;
  priority?: TaskPriority;
  dueAt?: Date;
  metadata?: Record<string, any>;
}

export interface TaskFilterParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  taskType?: TaskType;
  entityType?: string;
  entityId?: string;
  assignedToUserId?: string;
  queueId?: string;
  isOverdue?: boolean;
}

export class TaskService {
  /**
   * Create an operational task
   */
  async createTask(dto: CreateTaskDto, actorId?: string, tenantId?: string) {
    if (!dto.title || !dto.taskType || !dto.entityType || !dto.entityId) {
      throw new BadRequestError('Missing required fields for task creation');
    }

    const task = await prisma.task.create({
      data: {
        tenantId: tenantId || null,
        title: dto.title,
        description: dto.description || null,
        taskType: dto.taskType,
        entityType: dto.entityType,
        entityId: dto.entityId,
        applicationId: dto.applicationId || (dto.entityType === 'APPLICATION' ? dto.entityId : null),
        assignedToUserId: dto.assignedToUserId || null,
        assignedTeam: dto.assignedTeam || null,
        queueId: dto.queueId || null,
        priority: dto.priority || 'MEDIUM',
        status: 'OPEN',
        dueAt: dto.dueAt || null,
        metadata: dto.metadata || undefined,
        createdByUserId: actorId || null,
      },
    });

    // Record activity note
    await prisma.activityLog.create({
      data: {
        tenantId: tenantId || null,
        entityType: dto.entityType,
        entityId: dto.entityId,
        activityType: 'NOTE',
        title: `Task Created: ${dto.title}`,
        message: dto.description || `New task ${dto.title} [${dto.taskType}] assigned`,
        createdByUserId: actorId,
        metadata: { taskId: task.id, priority: task.priority },
      },
    });

    return task;
  }

  /**
   * List tasks with server-side filtering & pagination
   */
  async listTasks(params: PageParams, filters: TaskFilterParams = {}, tenantId?: string) {
    const where: any = {};

    if (tenantId) where.tenantId = tenantId;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.taskType) where.taskType = filters.taskType;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.assignedToUserId) where.assignedToUserId = filters.assignedToUserId;
    if (filters.queueId) where.queueId = filters.queueId;

    if (filters.isOverdue) {
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
      where.dueAt = { lt: new Date() };
    }

    const [rows, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: params.sortDir },
        include: {
          queue: true,
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      data: rows.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        taskType: t.taskType,
        entityType: t.entityType,
        entityId: t.entityId,
        applicationId: t.applicationId,
        assignedToUserId: t.assignedToUserId,
        assignedTeam: t.assignedTeam,
        queue: t.queue ? { id: t.queue.id, name: t.queue.name, department: t.queue.department } : null,
        priority: t.priority,
        status: t.status,
        dueAt: t.dueAt,
        isOverdue: t.dueAt ? new Date(t.dueAt) < new Date() && !['COMPLETED', 'CANCELLED'].includes(t.status) : false,
        completedAt: t.completedAt,
        createdByUserId: t.createdByUserId,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      pagination: buildPagination(params.page, params.pageSize, total),
    };
  }

  /**
   * Update task status (e.g. OPEN -> IN_PROGRESS -> COMPLETED)
   */
  async updateTaskStatus(taskId: string, status: TaskStatus, actorId?: string, tenantId?: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundError(`Task ${taskId} not found`);

    if (tenantId && task.tenantId && tenantId !== task.tenantId) {
      throw new ForbiddenError('Cannot update task belonging to another tenant');
    }

    const isCompleting = status === 'COMPLETED';

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: isCompleting ? new Date() : undefined,
        completedByUserId: isCompleting ? actorId : undefined,
        updatedAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        tenantId: task.tenantId,
        entityType: task.entityType,
        entityId: task.entityId,
        activityType: 'STATUS_CHANGE',
        title: `Task Status: ${status}`,
        message: `Task "${task.title}" marked as ${status}`,
        createdByUserId: actorId,
        metadata: { taskId, previousStatus: task.status, newStatus: status },
      },
    });

    return updated;
  }

  /**
   * Reassign a task to another user
   */
  async assignTask(taskId: string, targetUserId: string, actorId?: string, tenantId?: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundError(`Task ${taskId} not found`);

    if (tenantId && task.tenantId && tenantId !== task.tenantId) {
      throw new ForbiddenError('Cannot reassign task belonging to another tenant');
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToUserId: targetUserId,
        updatedAt: new Date(),
      },
    });

    return updated;
  }
}

export const taskService = new TaskService();
