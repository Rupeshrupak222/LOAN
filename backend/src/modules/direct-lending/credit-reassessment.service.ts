import { prisma } from '../../config/prisma';
import {
  CreditReassessmentRequest,
  CreditReassessmentResult,
} from './direct-lending.types';
import { creditLimitsService } from '../credit-limits/credit-limits.service';
import { repeatBorrowingService } from './repeat-borrowing.service';

export class CreditReassessmentService {
  /**
   * Evaluates customer credit limit enhancement request or periodic trigger.
   */
  public async requestLimitReassessment(
    customerId: string,
    tenantId: string | undefined,
    request: CreditReassessmentRequest
  ): Promise<CreditReassessmentResult> {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        loans: {
          include: { schedule: true },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get current facility if exists
    const facilities = creditLimitsService.listFacilities(
      { customerId },
      { tenantId }
    );
    const primaryFacility = facilities[0];
    const currentLimit = primaryFacility
      ? primaryFacility.currentLimit
      : Number(customer.monthlyIncome || 25000) * 1.5;

    // Run repeat borrowing evaluation for credit signals
    const repeatEval = await repeatBorrowingService.evaluateRepeatBorrower(
      customerId,
      tenantId
    );

    let evaluationScore = 60;
    const factors: string[] = [];

    if (repeatEval.currentDpd === 0) {
      evaluationScore += 15;
      factors.push('Clean zero-DPD repayment record');
    } else {
      evaluationScore -= 30;
      factors.push(`Delinquency recorded (DPD: ${repeatEval.currentDpd})`);
    }

    if (repeatEval.historicalOnTimePaymentCount >= 6) {
      evaluationScore += 20;
      factors.push('6+ consecutive on-time installment payments');
    } else if (repeatEval.historicalOnTimePaymentCount >= 3) {
      evaluationScore += 10;
      factors.push('3+ on-time installment payments');
    }

    const proposedLimit = request.requestedLimit
      ? Math.min(request.requestedLimit, currentLimit * 1.8)
      : Math.round((currentLimit * 1.35) / 1000) * 1000;

    let status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' = 'PENDING_APPROVAL';
    let message = 'Credit limit reassessment is under review.';

    if (evaluationScore >= 80 && repeatEval.currentDpd === 0) {
      status = 'APPROVED';
      message = `Congratulations! Your credit limit has been automatically enhanced to ₹${proposedLimit.toLocaleString(
        'en-IN'
      )}.`;

      // If credit facility exists, update it
      if (primaryFacility && proposedLimit > currentLimit) {
        creditLimitsService.adjustLimit(
          primaryFacility.id,
          {
            newLimit: proposedLimit,
            adjustmentType: 'INCREASE',
            reasonCode: 'POLICY_REASSESSMENT',
            comments: 'AUTOMATIC_POLICY_REASSESSMENT',
          },
          {
            id: 'SYSTEM',
            tenantId,
            roles: ['SYSTEM'],
          }
        );
      }
    } else if (evaluationScore < 50 || repeatEval.currentDpd > 0) {
      status = 'REJECTED';
      message =
        'Credit limit enhancement is currently unavailable due to active dues or insufficient repayment tenure.';
    }

    const record = await prisma.creditReassessment.create({
      data: {
        customerId,
        tenantId,
        currentLimit,
        proposedLimit,
        approvedLimit: status === 'APPROVED' ? proposedLimit : null,
        reassessmentType: request.reassessmentType || 'PERIODIC_PERFORMANCE',
        evaluationScore,
        status,
        appliedAt: status === 'APPROVED' ? new Date() : null,
        rejectionReason: status === 'REJECTED' ? factors.join(', ') : null,
      },
    });

    return {
      reassessmentId: record.id,
      customerId,
      currentLimit,
      proposedLimit,
      status,
      evaluationScore,
      factors,
      message,
    };
  }

  /**
   * Approves a pending limit reassessment (Maker-Checker).
   */
  public async approveReassessment(
    reassessmentId: string,
    approvedLimit: number,
    reviewerId: string,
    tenantId?: string
  ) {
    const reassessment = await prisma.creditReassessment.findFirst({
      where: {
        id: reassessmentId,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    if (!reassessment || reassessment.status !== 'PENDING_APPROVAL') {
      throw new Error('Valid pending reassessment not found');
    }

    const updated = await prisma.creditReassessment.update({
      where: { id: reassessmentId },
      data: {
        approvedLimit,
        status: 'APPROVED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        appliedAt: new Date(),
      },
    });

    // Update facility
    const facilities = creditLimitsService.listFacilities(
      { customerId: reassessment.customerId },
      { tenantId }
    );
    if (facilities[0]) {
      const diff = approvedLimit - facilities[0].currentLimit;
      if (diff !== 0) {
        creditLimitsService.adjustLimit(
          facilities[0].id,
          {
            newLimit: approvedLimit,
            adjustmentType: diff > 0 ? 'INCREASE' : 'DECREASE',
            reasonCode: 'MANUAL_REASSESSMENT',
            comments: 'MANUAL_REASSESSMENT_APPROVAL',
          },
          {
            id: reviewerId,
            tenantId,
            roles: ['CREDIT_ANALYST'],
          }
        );
      }
    }

    return updated;
  }
}

export const creditReassessmentService = new CreditReassessmentService();
