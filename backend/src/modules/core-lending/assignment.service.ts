import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';

export class AssignmentService {
  /**
   * Assign an application directly to a user/officer
   */
  async assignToUser(
    applicationId: string,
    targetUserId: string,
    department: string,
    workspace?: string,
    actorId?: string,
    notes?: string,
    tenantId?: string
  ) {
    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: { customer: true },
    });

    if (!application) {
      throw new NotFoundError(`Application ${applicationId} not found`);
    }

    if (tenantId && application.tenantId && tenantId !== application.tenantId) {
      throw new ForbiddenError('Cannot assign application from another organization');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundError(`User ${targetUserId} not found`);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Release previous active assignments
      await tx.applicationAssignment.updateMany({
        where: { applicationId, status: 'ACTIVE' },
        data: { status: 'REASSIGNED', unassignedAt: new Date() },
      });

      // 2. Create new assignment
      const assignment = await tx.applicationAssignment.create({
        data: {
          applicationId,
          assignedToUserId: targetUserId,
          assignedByUserId: actorId,
          department,
          workspace: workspace || null,
          assignmentType: 'INDIVIDUAL',
          status: 'ACTIVE',
          notes: notes || `Assigned to ${targetUser.firstName} ${targetUser.lastName}`,
        },
      });

      // 3. Update application pointer
      await tx.loanApplication.update({
        where: { id: applicationId },
        data: {
          assignedToUserId: targetUserId,
          updatedAt: new Date(),
        },
      });

      // 4. Log activity
      await tx.activityLog.create({
        data: {
          tenantId: application.tenantId,
          entityType: 'APPLICATION',
          entityId: applicationId,
          activityType: 'ASSIGNMENT',
          title: 'Application Assigned',
          message: notes || `Application assigned to ${targetUser.firstName} ${targetUser.lastName} (${targetUser.email})`,
          createdByUserId: actorId,
          metadata: {
            assignedToUserId: targetUserId,
            assignedByUserId: actorId,
            department,
          },
        },
      });

      return assignment;
    });

    try {
      await logAudit({
        userId: actorId,
        tenantId: application.tenantId || undefined,
        action: 'APPLICATION_ASSIGNED',
        entity: 'LoanApplication',
        entityId: applicationId,
        newValue: { assignedToUserId: targetUserId, department },
      });
    } catch {
      // Non-blocking audit
    }

    return result;
  }

  /**
   * Unassign an application back to general queue
   */
  async unassign(applicationId: string, actorId?: string, notes?: string, tenantId?: string) {
    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundError(`Application ${applicationId} not found`);
    }

    return prisma.$transaction(async (tx) => {
      await tx.applicationAssignment.updateMany({
        where: { applicationId, status: 'ACTIVE' },
        data: { status: 'RELEASED', unassignedAt: new Date(), notes: notes || 'Released from individual assignment' },
      });

      const updated = await tx.loanApplication.update({
        where: { id: applicationId },
        data: { assignedToUserId: null, updatedAt: new Date() },
      });

      await tx.activityLog.create({
        data: {
          tenantId: application.tenantId,
          entityType: 'APPLICATION',
          entityId: applicationId,
          activityType: 'ASSIGNMENT',
          title: 'Application Unassigned',
          message: notes || 'Application released from individual assignee',
          createdByUserId: actorId,
        },
      });

      return updated;
    });
  }

  /**
   * Retrieve assignment history for an application
   */
  async getAssignmentHistory(applicationId: string) {
    return prisma.applicationAssignment.findMany({
      where: { applicationId },
      orderBy: { assignedAt: 'desc' },
      include: {
        queue: true,
      },
    });
  }
}

export const assignmentService = new AssignmentService();
