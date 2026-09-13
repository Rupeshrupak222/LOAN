import { prisma } from '../../config/prisma';
import { BadRequestError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { ActivityType } from './core-lending.types';

export interface CreateActivityDto {
  entityType: string;
  entityId: string;
  activityType: ActivityType;
  title?: string;
  message: string;
  metadata?: Record<string, any>;
}

export class ActivityService {
  /**
   * Post an activity / operational note
   */
  async logActivity(dto: CreateActivityDto, actorId?: string, tenantId?: string) {
    if (!dto.entityType || !dto.entityId || !dto.message) {
      throw new BadRequestError('entityType, entityId, and message are required');
    }

    return prisma.activityLog.create({
      data: {
        tenantId: tenantId || null,
        entityType: dto.entityType,
        entityId: dto.entityId,
        activityType: dto.activityType || 'NOTE',
        title: dto.title || null,
        message: dto.message,
        metadata: dto.metadata || undefined,
        createdByUserId: actorId || null,
      },
    });
  }

  /**
   * Retrieve timeline notes/activities for any core entity
   */
  async listActivities(
    entityType: string,
    entityId: string,
    params: PageParams,
    tenantId?: string
  ) {
    const where: any = { entityType, entityId };
    if (tenantId) where.tenantId = tenantId;

    const [rows, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      data: rows,
      pagination: buildPagination(params.page, params.pageSize, total),
    };
  }
}

export const activityService = new ActivityService();
