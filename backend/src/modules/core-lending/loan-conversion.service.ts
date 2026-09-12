import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '../../common/errors';
import { generateLoanNo } from '../shared/codes';
import { calculateEmi } from '../finance/emi';
import { Decimal } from '@prisma/client/runtime/library';
import { logAudit } from '../audit/audit.service';
import { lifecycleService } from './lifecycle.service';

export class LoanConversionService {
  /**
   * Controlled workflow: Application -> Sanction/Disbursement -> Active Loan Account
   */
  async convertApplicationToLoan(
    applicationId: string,
    actorId?: string,
    tenantId?: string,
    disbursedAmount?: number,
    disbursementMethod: string = 'BANK_TRANSFER'
  ) {
    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: true,
        product: true,
        loan: true,
      },
    });

    if (!application) {
      throw new NotFoundError(`Application ${applicationId} not found`);
    }

    if (tenantId && application.tenantId && tenantId !== application.tenantId) {
      throw new ForbiddenError('Cannot convert application from another tenant');
    }

    // Guard against duplicate loan creation
    if (application.loan) {
      throw new ConflictError(
        `Loan account already exists for application ${application.applicationNo} (Loan ID: ${application.loan.id}, Loan No: ${application.loan.loanNo})`
      );
    }

    const principal = disbursedAmount ? new Decimal(disbursedAmount) : application.requestedAmount;
    const interestRate = application.product.interestRate;
    const tenureMonths = application.tenureMonths;

    // Calculate EMI & schedule
    const emiResult = calculateEmi(principal.toNumber(), interestRate.toNumber(), tenureMonths);
    const startDate = new Date();

    const scheduleWithDates = emiResult.schedule.map((item, idx) => {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + (idx + 1));
      return {
        ...item,
        dueDate,
      };
    });

    const loanNo = generateLoanNo();
    const emiDecimal = new Decimal(emiResult.emi);

    // Execute atomic transaction with extended timeout for cloud pooler
    const loan = await prisma.$transaction(
      async (tx) => {
        // 1. Create Loan record
        const createdLoan = await tx.loan.create({
          data: {
            loanNo,
            applicationId: application.id,
            customerId: application.customerId,
            productId: application.productId,
            tenantId: application.tenantId,
            branchId: application.branchId,
            principal,
            interestRate,
            tenureMonths,
            emiAmount: emiDecimal,
            disbursementDate: startDate,
            maturityDate: scheduleWithDates[scheduleWithDates.length - 1]?.dueDate || null,
            outstandingPrincipal: principal,
            outstandingInterest: new Decimal(0),
            outstandingFees: new Decimal(0),
            nextDueDate: scheduleWithDates[0]?.dueDate || null,
            status: 'ACTIVE',
          },
        });

        // 2. Batch create Repayment Schedule items
        const scheduleBatchData = scheduleWithDates.map((item) => {
          const itemPrincipal = new Decimal(item.principal);
          const itemInterest = new Decimal(item.interest);
          const totalDue = itemPrincipal.plus(itemInterest);
          return {
            loanId: createdLoan.id,
            emiNumber: item.emiNumber,
            dueDate: item.dueDate,
            principal: itemPrincipal,
            interest: itemInterest,
            fees: new Decimal(0),
            totalDue,
            outstanding: totalDue,
            status: 'UPCOMING' as const,
          };
        });

        await tx.repaymentScheduleItem.createMany({
          data: scheduleBatchData,
        });

      // 3. Record Initial Disbursement
      await tx.disbursement.create({
        data: {
          loanId: createdLoan.id,
          amount: principal,
          method: disbursementMethod,
          reference: `DISB-${loanNo}`,
          status: 'COMPLETED',
          disbursedBy: actorId || 'SYSTEM',
        },
      });

      // 4. Record Disbursement Transaction
      await tx.transaction.create({
        data: {
          loanId: createdLoan.id,
          type: 'DISBURSEMENT',
          direction: 'DEBIT',
          amount: principal,
          reference: `TX-${loanNo}`,
          description: `Disbursement for loan ${loanNo} against application ${application.applicationNo}`,
        },
      });

      // 5. Update Application Stage to DISBURSED
      await tx.loanApplication.update({
        where: { id: applicationId },
        data: {
          stage: 'DISBURSED',
          status: 'DISBURSED',
          updatedAt: new Date(),
        },
      });

      // 6. Application Status History
      await tx.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStage: application.stage || 'SANCTION',
          fromStatus: application.status,
          toStage: 'DISBURSED',
          toStatus: 'DISBURSED',
          changedBy: actorId || 'SYSTEM',
          reason: `Converted to active loan ${loanNo}`,
          metadata: { loanId: createdLoan.id, loanNo },
        },
      });

      // 7. Activity Log
      await tx.activityLog.create({
        data: {
          tenantId: application.tenantId,
          entityType: 'APPLICATION',
          entityId: applicationId,
          activityType: 'STAGE_TRANSITION',
          title: `Loan Disbursed: ${loanNo}`,
          message: `Application converted to active loan account ${loanNo} with principal ${principal.toString()}`,
          createdByUserId: actorId,
          metadata: { loanId: createdLoan.id, loanNo, principal: principal.toNumber() },
        },
      });

      return createdLoan;
    }, { timeout: 30000, maxWait: 10000 });

    try {
      await logAudit({
        userId: actorId,
        tenantId: application.tenantId || undefined,
        action: 'APPLICATION_CONVERTED_TO_LOAN',
        entity: 'Loan',
        entityId: loan.id,
        newValue: { loanNo, applicationId, principal: principal.toNumber() },
      });
    } catch {
      // Non-blocking audit
    }

    return loan;
  }
}

export const loanConversionService = new LoanConversionService();
