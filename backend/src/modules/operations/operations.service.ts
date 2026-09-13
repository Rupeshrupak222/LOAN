import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../../common/errors';
import { generateApplicationNo } from '../shared/codes';
import { Decimal } from '@prisma/client/runtime/library';
import { logAudit } from '../audit/audit.service';
import { lifecycleService } from '../core-lending/lifecycle.service';
import { queueService } from '../core-lending/queue.service';
import { assignmentService } from '../core-lending/assignment.service';
import { activityService } from '../core-lending/activity.service';
import {
  OperationsOverviewMetrics,
  ListApplicationsQuery,
  CreateApplicationDto,
  Customer360Dto,
  DocumentVerificationDto,
} from './operations.types';
import { ApplicationStage, TaskPriority, STAGE_LIFECYCLE, QueueKey } from '../core-lending/core-lending.types';

export class OperationsService {
  /**
   * Aggregated live operational metrics for Operations Overview
   */
  async getOperationsOverview(userId: string, tenantId?: string): Promise<OperationsOverviewMetrics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const baseWhere: any = {};
    if (tenantId) baseWhere.tenantId = tenantId;

    const [
      applicationsToday,
      pendingApplications,
      assignedToMe,
      overdueTasks,
      pendingDocuments,
      requiresAction,
      applicationsByStage,
      applicationsByPriority,
    ] = await Promise.all([
      // 1. Applications created today
      prisma.loanApplication.count({
        where: {
          ...baseWhere,
          createdAt: { gte: today },
        },
      }),

      // 2. Pending applications (in operational pipeline)
      prisma.loanApplication.count({
        where: {
          ...baseWhere,
          stage: {
            in: [
              'APPLICATION_STARTED',
              'APPLICATION_SUBMITTED',
              'DOCUMENT_VERIFICATION',
              'CREDIT_ASSESSMENT',
              'UNDERWRITING',
              'APPROVAL',
              'SANCTION',
              'DISBURSEMENT',
            ],
          },
          status: { notIn: ['DISBURSED', 'REJECTED', 'CANCELLED'] },
        },
      }),

      // 3. Assigned to current user
      prisma.loanApplication.count({
        where: {
          ...baseWhere,
          assignedToUserId: userId,
          status: { notIn: ['DISBURSED', 'REJECTED', 'CANCELLED'] },
        },
      }),

      // 4. Overdue tasks in tenant
      prisma.task.count({
        where: {
          ...baseWhere,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          dueAt: { lt: new Date() },
        },
      }),

      // 5. Pending documents waiting for verification
      prisma.document.count({
        where: {
          application: baseWhere.tenantId ? { tenantId: baseWhere.tenantId } : undefined,
          status: { in: ['PENDING', 'UNDER_REVIEW'] },
        },
      }),

      // 6. Requires Action (High/Urgent priority or unassigned in queue)
      prisma.loanApplication.count({
        where: {
          ...baseWhere,
          status: { notIn: ['DISBURSED', 'REJECTED', 'CANCELLED'] },
          OR: [
            { priority: { in: ['HIGH', 'URGENT'] } },
            { assignedToUserId: null, queueId: { not: null } },
          ],
        },
      }),

      // 7. Stage distribution breakdown
      prisma.loanApplication.groupBy({
        by: ['stage'],
        where: {
          ...baseWhere,
          status: { notIn: ['CANCELLED', 'REJECTED'] },
        },
        _count: { _all: true },
      }),

      // 8. Priority distribution breakdown
      prisma.loanApplication.groupBy({
        by: ['priority'],
        where: {
          ...baseWhere,
          status: { notIn: ['CANCELLED', 'REJECTED'] },
        },
        _count: { _all: true },
      }),
    ]);

    const stageDistribution: Record<string, number> = {};
    for (const item of applicationsByStage) {
      if (item.stage) stageDistribution[item.stage] = item._count._all;
    }

    const priorityDistribution: Record<string, number> = {};
    for (const item of applicationsByPriority) {
      if (item.priority) priorityDistribution[item.priority] = item._count._all;
    }

    return {
      applicationsToday,
      pendingApplications,
      assignedToMe,
      overdueTasks,
      pendingDocuments,
      requiresAction,
      stageDistribution,
      priorityDistribution,
    };
  }

  /**
   * Server-side paginated, searchable, multi-filtered applications directory
   */
  async listApplications(query: ListApplicationsQuery, tenantId?: string) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    if (query.stage) {
      where.stage = query.stage;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.assignedToUserId) {
      where.assignedToUserId = query.assignedToUserId;
    }

    if (query.queueId) {
      where.queueId = query.queueId;
    }

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.branchId) {
      where.branchId = query.branchId;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { applicationNo: { contains: s, mode: 'insensitive' } },
        { customer: { firstName: { contains: s, mode: 'insensitive' } } },
        { customer: { lastName: { contains: s, mode: 'insensitive' } } },
        { customer: { customerCode: { contains: s, mode: 'insensitive' } } },
        { customer: { mobile: { contains: s, mode: 'insensitive' } } },
        { loan: { loanNo: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = {};
    const sortField = query.sortBy || 'createdAt';
    const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
    orderBy[sortField] = sortDir;

    const [data, total] = await Promise.all([
      prisma.loanApplication.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          customer: {
            select: {
              id: true,
              customerCode: true,
              firstName: true,
              lastName: true,
              email: true,
              mobile: true,
              city: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              interestRate: true,
              minTenureMonths: true,
              maxTenureMonths: true,
            },
          },
          loan: {
            select: {
              id: true,
              loanNo: true,
              status: true,
            },
          },
          _count: {
            select: {
              documents: true,
              tasks: true,
            },
          },
        },
      }),
      prisma.loanApplication.count({ where }),
    ]);

    // Populate assignedToUser and queue details
    const userIds = Array.from(new Set(data.map((d) => d.assignedToUserId).filter(Boolean))) as string[];
    const queueIds = Array.from(new Set(data.map((d) => d.queueId).filter(Boolean))) as string[];

    let userMap: Record<string, { id: string; firstName: string; lastName: string; email: string }> = {};
    let queueMap: Record<string, any> = {};

    const [users, queues] = await Promise.all([
      userIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true, email: true },
          })
        : [],
      queueIds.length > 0
        ? prisma.workQueue.findMany({
            where: { id: { in: queueIds } },
          })
        : [],
    ]);

    for (const u of users) userMap[u.id] = u;
    for (const q of queues) queueMap[q.id] = q;

    const enrichedData = data.map((item) => ({
      ...item,
      assignedToUser: item.assignedToUserId ? userMap[item.assignedToUserId] || null : null,
      queue: item.queueId ? queueMap[item.queueId] || null : null,
    }));

    return {
      data: enrichedData,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Complete Application 360 Detail with graphs and next valid transitions
   */
  async getApplicationDetails(applicationId: string, tenantId?: string) {
    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: {
          include: {
            identifiers: {
              select: {
                id: true,
                idType: true,
                maskedValue: true,
                verificationStatus: true,
                verifiedAt: true,
                verifiedBy: true,
              },
            },
          },
        },
        product: true,
        branch: true,
        loan: {
          include: {
            schedule: {
              orderBy: { emiNumber: 'asc' },
              take: 12,
            },
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        creditReviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        approvalRecords: {
          orderBy: { createdAt: 'desc' },
          include: {
            history: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        assignments: {
          orderBy: { assignedAt: 'desc' },
          take: 10,
          include: {
            queue: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundError(`Application ${applicationId} not found`);
    }

    if (tenantId && application.tenantId && tenantId !== application.tenantId) {
      throw new ForbiddenError('Cannot access application from another organization');
    }

    // Fetch related users & activity logs
    const [assignedToUser, queue, activityLogs] = await Promise.all([
      application.assignedToUserId
        ? prisma.user.findUnique({
            where: { id: application.assignedToUserId },
            select: { id: true, firstName: true, lastName: true, email: true },
          })
        : null,
      application.queueId
        ? prisma.workQueue.findUnique({ where: { id: application.queueId } })
        : null,
      prisma.activityLog.findMany({
        where: {
          entityType: 'APPLICATION',
          entityId: applicationId,
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    // Determine next allowed stages according to state machine
    const currentStage = (application.stage || 'LEAD') as ApplicationStage;
    const stageDef = STAGE_LIFECYCLE[currentStage];
    const allowedNextStages = stageDef ? stageDef.allowedNextStages : [];

    return {
      ...application,
      assignedToUser,
      queue,
      activityLogs,
      allowedNextStages,
    };
  }

  /**
   * Controlled application origination flow
   */
  async createApplication(data: CreateApplicationDto, actorId: string, tenantId?: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });
    if (!customer) {
      throw new NotFoundError(`Customer ${data.customerId} not found`);
    }
    if (tenantId && customer.tenantId && tenantId !== customer.tenantId) {
      throw new ForbiddenError('Customer belongs to another organization');
    }

    const product = await prisma.loanProduct.findUnique({
      where: { id: data.productId },
    });
    if (!product) {
      throw new NotFoundError(`Loan product ${data.productId} not found`);
    }

    const requestedAmount = new Decimal(data.requestedAmount);
    if (requestedAmount.lessThanOrEqualTo(0)) {
      throw new BadRequestError('Requested amount must be greater than zero');
    }

    if (product.minAmount && requestedAmount.lessThan(product.minAmount)) {
      throw new BadRequestError(`Requested amount is below product minimum (₹${product.minAmount})`);
    }
    if (product.maxAmount && requestedAmount.greaterThan(product.maxAmount)) {
      throw new BadRequestError(`Requested amount exceeds product maximum (₹${product.maxAmount})`);
    }

    const tenureMonths = data.tenureMonths;
    if (product.minTenureMonths && tenureMonths < product.minTenureMonths) {
      throw new BadRequestError(`Tenure is below product minimum (${product.minTenureMonths} months)`);
    }
    if (product.maxTenureMonths && tenureMonths > product.maxTenureMonths) {
      throw new BadRequestError(`Tenure exceeds product maximum (${product.maxTenureMonths} months)`);
    }

    const initialStage: ApplicationStage = data.autoSubmit ? 'APPLICATION_SUBMITTED' : 'LEAD';
    const initialStatus = data.autoSubmit ? 'SUBMITTED' : 'DRAFT';
    const applicationNo = generateApplicationNo();

    const application = await prisma.$transaction(async (tx) => {
      const createdApp = await tx.loanApplication.create({
        data: {
          applicationNo,
          tenantId: tenantId || customer.tenantId,
          customerId: data.customerId,
          productId: data.productId,
          branchId: data.branchId || customer.branchId,
          requestedAmount,
          tenureMonths,
          purpose: data.purpose || 'Personal / General',
          stage: initialStage,
          status: initialStatus,
          priority: data.priority || 'MEDIUM',
          submittedAt: data.autoSubmit ? new Date() : null,
        },
      });

      // Initial Status History
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: createdApp.id,
          toStage: initialStage,
          toStatus: initialStatus,
          changedBy: actorId,
          reason: data.autoSubmit ? 'Direct submission upon creation' : 'Initial application lead creation',
        },
      });

      // Initial Activity Log
      await tx.activityLog.create({
        data: {
          tenantId: tenantId || customer.tenantId,
          entityType: 'APPLICATION',
          entityId: createdApp.id,
          activityType: 'SYSTEM_EVENT',
          title: `Application ${applicationNo} Created`,
          message: `Created for customer ${customer.firstName} ${customer.lastName} (${requestedAmount.toString()} for ${tenureMonths}m)`,
          createdByUserId: actorId,
        },
      });

      return createdApp;
    });

    // If auto-submit is enabled, route to Operations queue
    if (data.autoSubmit) {
      await queueService.routeApplicationToQueue(application.id, 'OPERATIONS_QUEUE', actorId, tenantId);
    }

    await logAudit({
      userId: actorId,
      tenantId: tenantId || customer.tenantId || undefined,
      action: 'APPLICATION_CREATED',
      entity: 'LoanApplication',
      entityId: application.id,
      newValue: { applicationNo, customerId: data.customerId, requestedAmount: requestedAmount.toNumber() },
    });

    return application;
  }

  /**
   * Submit application into operational pipeline
   */
  async submitApplication(applicationId: string, actorId: string, tenantId?: string) {
    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      throw new NotFoundError(`Application ${applicationId} not found`);
    }

    if (application.stage !== 'LEAD' && application.stage !== 'APPLICATION_STARTED') {
      throw new BadRequestError(`Cannot submit application in stage ${application.stage}`);
    }

    const updated = await lifecycleService.transitionStage(
      applicationId,
      'APPLICATION_SUBMITTED',
      'SUBMITTED',
      { id: actorId, roles: ['LOAN_OFFICER'], tenantId },
      'Submitted to Operations Verification Queue'
    );

    // Route to Operations Queue
    await queueService.routeApplicationToQueue(applicationId, 'OPERATIONS_QUEUE', actorId, tenantId);

    return updated;
  }

  /**
   * Team Queue items listing
   */
  async getTeamQueue(query: { queueKey?: QueueKey; priority?: string; page?: number; pageSize?: number }, userId: string, tenantId?: string) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {
      status: { notIn: ['DISBURSED', 'REJECTED', 'CANCELLED'] },
    };
    if (tenantId) where.tenantId = tenantId;

    if (query.queueKey) {
      const q = await prisma.workQueue.findFirst({ where: { key: query.queueKey, tenantId } });
      if (q) where.queueId = q.id;
    } else {
      where.queueId = { not: null };
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    const [data, total, queues] = await Promise.all([
      prisma.loanApplication.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        include: {
          customer: {
            select: {
              id: true,
              customerCode: true,
              firstName: true,
              lastName: true,
              mobile: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      prisma.loanApplication.count({ where }),
      queueService.listQueues(tenantId),
    ]);

    // Populate assigned user and queue info
    const userIds = Array.from(new Set(data.map((d) => d.assignedToUserId).filter(Boolean))) as string[];
    const queueIds = Array.from(new Set(data.map((d) => d.queueId).filter(Boolean))) as string[];

    let userMap: Record<string, { id: string; firstName: string; lastName: string }> = {};
    let queueMap: Record<string, any> = {};

    const [users, foundQueues] = await Promise.all([
      userIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true },
          })
        : [],
      queueIds.length > 0
        ? prisma.workQueue.findMany({
            where: { id: { in: queueIds } },
          })
        : [],
    ]);

    for (const u of users) userMap[u.id] = u;
    for (const q of foundQueues) queueMap[q.id] = q;

    const enriched = data.map((d) => ({
      ...d,
      assignedToUser: d.assignedToUserId ? userMap[d.assignedToUserId] || null : null,
      queue: d.queueId ? queueMap[d.queueId] || null : null,
    }));

    return {
      data: enriched,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      queues,
    };
  }

  /**
   * Claim queue item by agent
   */
  async claimQueueItem(applicationId: string, userId: string, tenantId?: string) {
    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      throw new NotFoundError(`Application ${applicationId} not found`);
    }

    if (application.assignedToUserId && application.assignedToUserId !== userId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: application.assignedToUserId },
        select: { firstName: true, lastName: true },
      });
      throw new ConflictError(
        `Application is already claimed by ${existingUser?.firstName || 'another user'} ${existingUser?.lastName || ''}`
      );
    }

    return assignmentService.assignToUser(
      applicationId,
      userId,
      'OPERATIONS',
      'OPERATIONS_LENDING',
      userId,
      'Self-claimed from operational team queue',
      tenantId
    );
  }

  /**
   * Update application priority
   */
  async updatePriority(applicationId: string, priority: TaskPriority, actorId: string, tenantId?: string) {
    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      throw new NotFoundError(`Application ${applicationId} not found`);
    }

    const prevPriority = application.priority;
    const updated = await prisma.loanApplication.update({
      where: { id: applicationId },
      data: {
        priority,
        updatedAt: new Date(),
      },
    });

    await activityService.logActivity(
      {
        entityType: 'APPLICATION',
        entityId: applicationId,
        activityType: 'STATUS_CHANGE',
        title: `Priority Updated: ${priority}`,
        message: `Priority changed from ${prevPriority} to ${priority}`,
        metadata: { from: prevPriority, to: priority },
      },
      actorId,
      tenantId
    );

    return updated;
  }

  /**
   * Verify document
   */
  async verifyDocument(documentId: string, dto: DocumentVerificationDto, actorId: string, tenantId?: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { application: true },
    });
    if (!document) {
      throw new NotFoundError(`Document ${documentId} not found`);
    }

    const isVerified = dto.status === 'VERIFIED';
    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: dto.status,
        verified: isVerified,
        verifiedBy: actorId,
        verifiedAt: new Date(),
        rejectionReason: dto.status === 'REJECTED' ? dto.rejectionReason : null,
      },
    });

    if (document.applicationId) {
      await activityService.logActivity(
        {
          entityType: 'APPLICATION',
          entityId: document.applicationId,
          activityType: 'SYSTEM_EVENT',
          title: `Document ${dto.status}: ${document.fileName || document.category}`,
          message: isVerified
            ? `Document ${document.category} verified successfully.`
            : `Document ${document.category} rejected. Reason: ${dto.rejectionReason || 'Incomplete / illegible'}`,
          metadata: { documentId, status: dto.status, notes: dto.notes },
        },
        actorId,
        tenantId
      );
    }

    return updated;
  }

  /**
   * Server-side paginated Customer Directory
   */
  async listCustomers(query: { search?: string; page?: number; pageSize?: number }, tenantId?: string) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { customerCode: { contains: s, mode: 'insensitive' } },
        { mobile: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              applications: true,
              loans: true,
              documents: true,
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Customer 360 Full Profile Aggregation
   */
  async getCustomer360(customerId: string, tenantId?: string): Promise<Customer360Dto> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        branch: true,
        identifiers: {
          select: {
            id: true,
            idType: true,
            maskedValue: true,
            verificationStatus: true,
            verifiedAt: true,
            verifiedBy: true,
          },
        },
        applications: {
          orderBy: { createdAt: 'desc' },
          include: {
            product: { select: { name: true, code: true } },
          },
        },
        loans: {
          orderBy: { createdAt: 'desc' },
          include: {
            product: { select: { name: true, code: true } },
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError(`Customer ${customerId} not found`);
    }

    if (tenantId && customer.tenantId && tenantId !== customer.tenantId) {
      throw new ForbiddenError('Customer belongs to another organization');
    }

    // Get open tasks and activity logs for this customer
    const appIds = customer.applications.map((a: any) => a.id);
    const [tasks, activities] = await Promise.all([
      prisma.task.findMany({
        where: {
          tenantId: tenantId || customer.tenantId || undefined,
          OR: [
            { entityType: 'CUSTOMER', entityId: customerId },
            { entityType: 'APPLICATION', entityId: { in: appIds } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.activityLog.findMany({
        where: {
          tenantId: tenantId || customer.tenantId || undefined,
          OR: [
            { entityType: 'CUSTOMER', entityId: customerId },
            { entityType: 'APPLICATION', entityId: { in: appIds } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    const activeLoans = customer.loans.filter((l: any) => l.status === 'ACTIVE');
    const totalSanctionedAmount = customer.loans.reduce((acc: number, l: any) => acc + Number(l.principal), 0);
    const totalOutstandingAmount = activeLoans.reduce((acc: number, l: any) => acc + Number(l.outstandingPrincipal), 0);
    const kycVerified = customer.identifiers.some((i: any) => i.verificationStatus === 'VERIFIED');

    return {
      customer,
      identifiers: customer.identifiers,
      applications: customer.applications,
      loans: customer.loans,
      documents: customer.documents,
      tasks,
      activities,
      stats: {
        totalApplications: customer.applications.length,
        activeLoansCount: activeLoans.length,
        totalSanctionedAmount,
        totalOutstandingAmount,
        kycVerified,
      },
    };
  }

  /**
   * Concurrency / Stale state check
   */
  async checkConcurrency(applicationId: string, clientUpdatedAt: string) {
    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      select: { updatedAt: true },
    });
    if (!app) throw new NotFoundError('Application not found');

    const serverTime = new Date(app.updatedAt).getTime();
    const clientTime = new Date(clientUpdatedAt).getTime();

    if (Math.abs(serverTime - clientTime) > 1000) {
      throw new ConflictError(
        'This application was updated by another user. Please refresh the page before taking action.'
      );
    }
  }
}

export const operationsService = new OperationsService();
