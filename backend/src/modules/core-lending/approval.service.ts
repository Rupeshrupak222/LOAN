import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { ApprovalType, ApprovalStatus } from './core-lending.types';
import { logAudit } from '../audit/audit.service';

export interface RequestApprovalDto {
  entityType?: 'APPLICATION' | 'LOAN' | 'DISBURSEMENT' | 'RESTRUCTURE' | 'SETTLEMENT' | 'WAIVER';
  entityId: string;
  applicationId?: string;
  approvalType: ApprovalType;
  level?: number;
  approverRole?: string;
  assignedToUserId?: string;
  comments?: string;
}

export class ApprovalService {
  /**
   * Request a tiered sanction / committee approval
   */
  async requestApproval(dto: RequestApprovalDto, actorId?: string, tenantId?: string) {
    if (!dto.entityId || !dto.approvalType) {
      throw new BadRequestError('entityId and approvalType are required');
    }

    const approval = await prisma.approval.create({
      data: {
        tenantId: tenantId || null,
        entityType: dto.entityType || 'APPLICATION',
        entityId: dto.entityId,
        applicationId: dto.applicationId || (dto.entityType === 'APPLICATION' || !dto.entityType ? dto.entityId : null),
        approvalType: dto.approvalType,
        level: dto.level || 1,
        approverRole: dto.approverRole || 'UNDERWRITER',
        requestedByUserId: actorId || null,
        assignedToUserId: dto.assignedToUserId || null,
        status: 'PENDING',
        comments: dto.comments || null,
      },
    });

    // Create initial history item
    await prisma.approvalHistory.create({
      data: {
        approvalId: approval.id,
        actorId: actorId || null,
        fromStatus: 'NONE',
        toStatus: 'PENDING',
        comments: dto.comments || 'Approval requested',
      },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        tenantId: tenantId || null,
        entityType: dto.entityType || 'APPLICATION',
        entityId: dto.entityId,
        activityType: 'NOTE',
        title: `Approval Requested: ${dto.approvalType}`,
        message: dto.comments || `Tier ${dto.level || 1} ${dto.approvalType} approval requested`,
        createdByUserId: actorId,
        metadata: { approvalId: approval.id, approvalType: dto.approvalType },
      },
    });

    return approval;
  }

  /**
   * Record a decision on an approval request (APPROVED / REJECTED / CANCELLED)
   */
  async decideApproval(
    approvalId: string,
    decision: 'APPROVED' | 'REJECTED' | 'CANCELLED',
    comments?: string,
    actorId?: string,
    tenantId?: string
  ) {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
    });

    if (!approval) throw new NotFoundError(`Approval ${approvalId} not found`);

    if (tenantId && approval.tenantId && tenantId !== approval.tenantId) {
      throw new ForbiddenError('Cannot decide approval belonging to another tenant');
    }

    if (approval.status !== 'PENDING') {
      throw new BadRequestError(`Approval ${approvalId} is already in state '${approval.status}'`);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.approval.update({
        where: { id: approvalId },
        data: {
          status: decision,
          decisionReason: comments || `Approval ${decision.toLowerCase()}`,
          decidedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await tx.approvalHistory.create({
        data: {
          approvalId,
          actorId,
          fromStatus: approval.status,
          toStatus: decision,
          decision,
          comments: comments || null,
        },
      });

      await tx.activityLog.create({
        data: {
          tenantId: approval.tenantId,
          entityType: approval.entityType,
          entityId: approval.entityId,
          activityType: 'STATUS_CHANGE',
          title: `Approval ${decision}: ${approval.approvalType}`,
          message: comments || `${approval.approvalType} approval was ${decision.toLowerCase()}`,
          createdByUserId: actorId,
          metadata: { approvalId, decision },
        },
      });

      return updated;
    });

    try {
      await logAudit({
        userId: actorId,
        tenantId: approval.tenantId || undefined,
        action: `APPROVAL_${decision}`,
        entity: 'Approval',
        entityId: approvalId,
        newValue: { status: decision, decisionReason: comments },
      });
    } catch {
      // Non-blocking audit
    }

    return result;
  }

  /**
   * List approval requests with pagination
   */
  async listApprovals(
    params: PageParams,
    filters: { status?: ApprovalStatus; approvalType?: ApprovalType; entityId?: string } = {},
    tenantId?: string
  ) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (filters.status) where.status = filters.status;
    if (filters.approvalType) where.approvalType = filters.approvalType;
    if (filters.entityId) where.entityId = filters.entityId;

    const [rows, total] = await Promise.all([
      prisma.approval.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: params.sortDir },
        include: {
          history: { orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.approval.count({ where }),
    ]);

    return {
      data: rows,
      pagination: buildPagination(params.page, params.pageSize, total),
    };
  }
}

export const approvalService = new ApprovalService();
