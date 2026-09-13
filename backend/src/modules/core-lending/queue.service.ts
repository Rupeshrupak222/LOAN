import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { QueueKey } from './core-lending.types';
import { logAudit } from '../audit/audit.service';

export const DEFAULT_QUEUES: Array<{
  key: QueueKey;
  name: string;
  department: string;
  workspace: string;
  description: string;
}> = [
  {
    key: 'OPERATIONS_QUEUE',
    name: 'Origination & Processing Queue',
    department: 'OPERATIONS',
    workspace: 'OPERATIONS_DESK',
    description: 'Initial intake, document verification, and customer servicing queue',
  },
  {
    key: 'CREDIT_REVIEW_QUEUE',
    name: 'Credit Assessment Queue',
    department: 'CREDIT',
    workspace: 'CREDIT_ASSESSMENT',
    description: 'Credit scoring, bank statement analysis, and underwriter review queue',
  },
  {
    key: 'RISK_QUEUE',
    name: 'Fraud & Risk Investigation Queue',
    department: 'CREDIT',
    workspace: 'RISK_FRAUD_DESK',
    description: 'High risk and fraud rule trigger investigation queue',
  },
  {
    key: 'APPROVAL_QUEUE',
    name: 'Sanction Approval Committee Queue',
    department: 'CREDIT',
    workspace: 'CREDIT_UNDERWRITING',
    description: 'Tiered credit committee and senior underwriter sanction approvals',
  },
  {
    key: 'COLLECTIONS_QUEUE',
    name: 'Delinquency & Recovery Queue',
    department: 'COLLECTIONS',
    workspace: 'DELINQUENCY_DPD',
    description: 'Early and late bucket delinquency collection case management',
  },
  {
    key: 'FINANCE_QUEUE',
    name: 'Treasury & Disbursement Queue',
    department: 'FINANCE',
    workspace: 'FINANCE_TREASURY',
    description: 'Payout verification, banking mandate checks, and disbursement queue',
  },
];

export class QueueService {
  /**
   * Ensure default departmental work queues exist for a tenant
   */
  async ensureDefaultQueues(tenantId?: string) {
    if (!tenantId) return [];

    const existing = await prisma.workQueue.findMany({
      where: { tenantId },
    });

    const existingKeys = new Set(existing.map((q) => q.key));
    const toCreate = DEFAULT_QUEUES.filter((q) => !existingKeys.has(q.key));

    for (const q of toCreate) {
      await prisma.workQueue.create({
        data: {
          tenantId,
          key: q.key,
          name: q.name,
          department: q.department,
          workspace: q.workspace,
          description: q.description,
          isActive: true,
        },
      });
    }

    return prisma.workQueue.findMany({ where: { tenantId } });
  }

  /**
   * List queues scoped to tenant and optional department
   */
  async listQueues(tenantId?: string, department?: string) {
    const where: any = { isActive: true };
    if (tenantId) where.tenantId = tenantId;
    if (department) where.department = department;

    const queues = await prisma.workQueue.findMany({
      where,
      include: {
        _count: {
          select: {
            assignments: { where: { status: 'ACTIVE' } },
            tasks: { where: { status: { in: ['OPEN', 'IN_PROGRESS', 'OVERDUE'] } } },
          },
        },
      },
    });

    return queues.map((q) => ({
      id: q.id,
      key: q.key,
      name: q.name,
      department: q.department,
      workspace: q.workspace,
      description: q.description,
      activeAssignmentsCount: q._count.assignments,
      activeTasksCount: q._count.tasks,
      createdAt: q.createdAt,
    }));
  }

  /**
   * Route an application into a work queue
   */
  async routeApplicationToQueue(
    applicationId: string,
    queueKey: QueueKey,
    actorId?: string,
    tenantId?: string,
    notes?: string
  ) {
    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundError(`Application ${applicationId} not found`);
    }

    const effectiveTenantId = tenantId || application.tenantId;

    let queue = await prisma.workQueue.findFirst({
      where: {
        key: queueKey,
        ...(effectiveTenantId ? { tenantId: effectiveTenantId } : {}),
      },
    });

    if (!queue) {
      const defaultQ = DEFAULT_QUEUES.find((d) => d.key === queueKey);
      if (defaultQ) {
        queue = await prisma.workQueue.create({
          data: {
            tenantId: effectiveTenantId || null,
            key: defaultQ.key,
            name: defaultQ.name,
            department: defaultQ.department,
            workspace: defaultQ.workspace,
            description: defaultQ.description,
          },
        });
      } else {
        throw new NotFoundError(`Queue ${queueKey} not found`);
      }
    }

    // Atomic assignment & application update
    return prisma.$transaction(async (tx) => {
      // 1. Release previous active assignments
      await tx.applicationAssignment.updateMany({
        where: { applicationId, status: 'ACTIVE' },
        data: { status: 'RELEASED', unassignedAt: new Date() },
      });

      // 2. Create new queue assignment
      const assignment = await tx.applicationAssignment.create({
        data: {
          applicationId,
          queueId: queue!.id,
          department: queue!.department,
          workspace: queue!.workspace,
          assignmentType: 'QUEUE',
          assignedByUserId: actorId,
          status: 'ACTIVE',
          notes: notes || `Application routed to ${queue!.name}`,
        },
      });

      // 3. Update application pointer
      await tx.loanApplication.update({
        where: { id: applicationId },
        data: {
          queueId: queue!.id,
          assignedToUserId: null,
          updatedAt: new Date(),
        },
      });

      // 4. Log activity
      await tx.activityLog.create({
        data: {
          tenantId: effectiveTenantId || null,
          entityType: 'APPLICATION',
          entityId: applicationId,
          activityType: 'ASSIGNMENT',
          title: `Routed to ${queue!.name}`,
          message: notes || `Application placed into queue ${queue!.name} (${queueKey})`,
          createdByUserId: actorId,
          metadata: { queueId: queue!.id, queueKey },
        },
      });

      return assignment;
    });
  }
}

export const queueService = new QueueService();
