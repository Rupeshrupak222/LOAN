import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateCreditReviewDto {
  decision: 'PENDING' | 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'REJECT' | 'REFER';
  score?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  maxSanctionAmount?: number;
  recommendedTenure?: number;
  recommendedRate?: number;
  remarks?: string;
  conditions?: Record<string, any>;
  factors?: Record<string, any>;
}

export class CreditReviewService {
  /**
   * Submit or update a formal Credit Review decision
   */
  async createCreditReview(
    applicationId: string,
    dto: CreateCreditReviewDto,
    reviewerId?: string,
    tenantId?: string
  ) {
    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundError(`Application ${applicationId} not found`);
    }

    if (tenantId && application.tenantId && tenantId !== application.tenantId) {
      throw new ForbiddenError('Cannot review application from another tenant');
    }

    const review = await prisma.creditReview.create({
      data: {
        applicationId,
        reviewerId: reviewerId || null,
        decision: dto.decision,
        score: dto.score || null,
        riskLevel: dto.riskLevel || 'MEDIUM',
        maxSanctionAmount: dto.maxSanctionAmount ? new Decimal(dto.maxSanctionAmount) : null,
        recommendedTenure: dto.recommendedTenure || null,
        recommendedRate: dto.recommendedRate ? new Decimal(dto.recommendedRate) : null,
        remarks: dto.remarks || null,
        conditions: dto.conditions || undefined,
        factors: dto.factors || undefined,
      },
    });

    // Post timeline note
    await prisma.activityLog.create({
      data: {
        tenantId: application.tenantId,
        entityType: 'APPLICATION',
        entityId: applicationId,
        activityType: 'NOTE',
        title: `Credit Assessment Decision: ${dto.decision}`,
        message: dto.remarks || `Credit review submitted with decision ${dto.decision} (Risk: ${dto.riskLevel})`,
        createdByUserId: reviewerId,
        metadata: {
          creditReviewId: review.id,
          decision: dto.decision,
          score: dto.score,
        },
      },
    });

    return review;
  }

  /**
   * Get all credit reviews for an application
   */
  async getCreditReviews(applicationId: string) {
    return prisma.creditReview.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const creditReviewService = new CreditReviewService();
