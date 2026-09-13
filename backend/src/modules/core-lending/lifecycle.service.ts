import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { ApplicationStage, ApplicationOperationalStatus, STAGE_LIFECYCLE } from './core-lending.types';
import { logAudit } from '../audit/audit.service';

export interface StageTransitionActor {
  id: string;
  roles?: string[];
  tenantId?: string;
}

export class LifecycleService {
  /**
   * Transition an application's stage & status through the controlled state machine
   */
  async transitionStage(
    applicationId: string,
    targetStage: ApplicationStage,
    targetStatus?: ApplicationOperationalStatus,
    actor?: StageTransitionActor,
    reason?: string,
    metadata?: Record<string, any>
  ) {
    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: { customer: true, product: true },
    });

    if (!application) {
      throw new NotFoundError(`Loan application with ID ${applicationId} not found`);
    }

    // Tenant Isolation
    if (actor && actor.tenantId && application.tenantId && actor.tenantId !== application.tenantId) {
      if (!actor.roles?.includes('SUPER_ADMIN')) {
        throw new ForbiddenError('Access denied: Cannot mutate application from another organization');
      }
    }

    const currentStage = (application.stage as ApplicationStage) || 'LEAD';
    const stageDef = STAGE_LIFECYCLE[currentStage];

    // Validate Transition
    if (currentStage !== targetStage && !stageDef.allowedNextStages.includes(targetStage)) {
      if (!actor?.roles?.includes('SUPER_ADMIN') && !actor?.roles?.includes('COMPANY_ADMIN')) {
        throw new BadRequestError(
          `Invalid stage transition: Cannot transition application from stage '${currentStage}' to '${targetStage}'. Allowed: [${stageDef.allowedNextStages.join(', ')}]`
        );
      }
    }

    const nextStageDef = STAGE_LIFECYCLE[targetStage];
    const resolvedStatus = targetStatus || nextStageDef.defaultStatus;

    // Map to legacy ApplicationStatus enum for backward compatibility
    let legacyStatus: ApplicationStatus = 'UNDER_REVIEW';
    if (targetStage === 'LEAD' || targetStage === 'APPLICATION_STARTED') legacyStatus = 'DRAFT';
    else if (targetStage === 'APPLICATION_SUBMITTED') legacyStatus = 'SUBMITTED';
    else if (targetStage === 'DOCUMENT_VERIFICATION') legacyStatus = 'KYC_PENDING';
    else if (targetStage === 'CREDIT_ASSESSMENT') legacyStatus = 'CREDIT_ASSESSMENT';
    else if (targetStage === 'UNDERWRITING') legacyStatus = 'UNDERWRITING';
    else if (targetStage === 'APPROVAL') legacyStatus = 'UNDERWRITING';
    else if (targetStage === 'SANCTION') legacyStatus = 'APPROVED';
    else if (targetStage === 'DISBURSEMENT') legacyStatus = 'READY_FOR_DISBURSEMENT';
    else if (targetStage === 'DISBURSED' || targetStage === 'ACTIVE') legacyStatus = 'DISBURSED';
    else if (targetStage === 'REJECTED') legacyStatus = 'REJECTED';
    else if (targetStage === 'CANCELLED' || targetStage === 'WITHDRAWN') legacyStatus = 'CANCELLED';

    // Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update application
      const updated = await tx.loanApplication.update({
        where: { id: applicationId },
        data: {
          stage: targetStage,
          status: legacyStatus,
          submittedAt: targetStage === 'APPLICATION_SUBMITTED' ? new Date() : undefined,
          closedAt: ['CLOSED', 'REJECTED', 'CANCELLED', 'WITHDRAWN'].includes(targetStage) ? new Date() : undefined,
          updatedAt: new Date(),
        },
      });

      // 2. Insert Status History
      await tx.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStage: currentStage,
          fromStatus: application.status,
          toStage: targetStage,
          toStatus: legacyStatus,
          changedBy: actor?.id || 'SYSTEM',
          reason: reason || `Transitioned stage from ${currentStage} to ${targetStage}`,
          metadata: metadata || undefined,
        },
      });

      // 3. Log Activity Note
      await tx.activityLog.create({
        data: {
          tenantId: application.tenantId,
          entityType: 'APPLICATION',
          entityId: applicationId,
          activityType: 'STAGE_TRANSITION',
          title: `Stage changed to ${targetStage}`,
          message: reason || `Application transitioned to stage ${targetStage} (${resolvedStatus})`,
          createdByUserId: actor?.id,
          metadata: {
            fromStage: currentStage,
            toStage: targetStage,
            status: resolvedStatus,
            ...metadata,
          },
        },
      });

      return updated;
    });

    // 4. Audit Log
    try {
      await logAudit({
        userId: actor?.id,
        tenantId: application.tenantId || undefined,
        action: 'APPLICATION_STAGE_TRANSITION',
        entity: 'LoanApplication',
        entityId: applicationId,
        previousValue: { stage: currentStage, status: application.status },
        newValue: { stage: targetStage, status: legacyStatus },
      });
    } catch {
      // Audit log non-blocking
    }

    return result;
  }

  /**
   * Get application stage transition history
   */
  async getStageHistory(applicationId: string, tenantId?: string) {
    const where: any = { applicationId };
    const history = await prisma.applicationStatusHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return history;
  }
}

export const lifecycleService = new LifecycleService();
