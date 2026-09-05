import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { PageParams, buildPagination } from '../../common/pagination';

export interface RecordAuditInput {
  userId?: string;
  role?: string;
  action: string;
  entity: string;
  entityId?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  correlationId?: string;
}

export async function logAudit(input: RecordAuditInput) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: input.userId,
        role: input.role,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        previousValue: input.previousValue ?? Prisma.DbNull,
        newValue: input.newValue ?? Prisma.DbNull,
        ipAddress: input.ipAddress,
        correlationId: input.correlationId,
      },
    });
  } catch (err: any) {
    if (err?.code === 'P2003' && input.userId) {
      try {
        return await prisma.auditLog.create({
          data: {
            userId: undefined,
            role: input.role,
            action: input.action,
            entity: input.entity,
            entityId: input.entityId,
            previousValue: input.previousValue ?? Prisma.DbNull,
            newValue: input.newValue ?? Prisma.DbNull,
            ipAddress: input.ipAddress,
            correlationId: input.correlationId,
          },
        });
      } catch {
        return null;
      }
    }
    // Non-blocking fallback so business flow is not interrupted if logging fails
    console.error('Audit logging failed:', err);
    return null;
  }
}

export async function listAuditLogs(params: PageParams, entity?: string, entityId?: string) {
  const where: Prisma.AuditLogWhereInput = {};
  if (entity) where.entity = entity;
  if (entityId) where.entityId = entityId;
  if (params.search) {
    where.OR = [
      { action: { contains: params.search, mode: 'insensitive' } },
      { entity: { contains: params.search, mode: 'insensitive' } },
      { role: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: params.sortDir },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: rows.map((r) => ({
      id: r.id,
      user: r.user ? `${r.user.firstName} ${r.user.lastName}` : 'System',
      userEmail: r.user?.email,
      role: r.role,
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      previousValue: r.previousValue,
      newValue: r.newValue,
      ipAddress: r.ipAddress,
      createdAt: r.createdAt,
    })),
    pagination: buildPagination(params.page, params.pageSize, total),
  };
}
