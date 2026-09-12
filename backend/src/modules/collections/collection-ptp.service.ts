import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { Money } from '../finance/money';
import type { PtpRecord, PtpStatus } from './collection.types';

export interface CreatePtpInput {
  caseId: string;
  promisedAmount: number;
  promisedDate: string | Date;
  paymentMode?: string;
  notes?: string;
}

export interface UpdatePtpInput {
  promisedAmount?: number;
  promisedDate?: string;
  notes?: string;
  status?: PtpStatus;
}

export class CollectionPtpService {
  /**
   * Record a new Promise to Pay (PTP)
   */
  public async createPtp(
    input: CreatePtpInput,
    actor: { id?: string; email?: string; roles?: string[]; tenantId?: string; branchId?: string }
  ): Promise<PtpRecord> {
    const colCase = await prisma.collectionCase.findUnique({
      where: { id: input.caseId },
      include: { loan: true },
    });

    if (!colCase) {
      throw new NotFoundError(`Collection case ${input.caseId} not found.`);
    }

    if (input.promisedAmount <= 0) {
      throw new BadRequestError('Promised amount must be greater than zero.');
    }

    const promisedDate = new Date(input.promisedDate);
    if (isNaN(promisedDate.getTime())) {
      throw new BadRequestError('Invalid promised date format.');
    }

    // Anti-IDOR Check
    if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
      if (colCase.loan.tenantId && actor.tenantId && colCase.loan.tenantId !== actor.tenantId) {
        throw new ForbiddenError('Access forbidden: Case belongs to another institution.');
      }
      if (actor.roles?.includes('BRANCH_MANAGER') && actor.branchId && colCase.loan.branchId && colCase.loan.branchId !== actor.branchId) {
        throw new ForbiddenError('Access forbidden: Case belongs to a different branch.');
      }
    }

    const ptp = await prisma.$transaction(async (tx) => {
      // Cancel any existing pending PTPs for this case
      await tx.promiseToPay.updateMany({
        where: { caseId: input.caseId, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });

      const record = await tx.promiseToPay.create({
        data: {
          caseId: input.caseId,
          promisedAmount: Money.toDb(input.promisedAmount),
          promisedDate: promisedDate,
          paymentMode: input.paymentMode || 'UPI',
          status: 'PENDING',
          recordedBy: actor.email || 'system',
        },
      });

      await tx.collectionCase.update({
        where: { id: input.caseId },
        data: { status: 'PROMISED' },
      });

      await tx.collectionActivity.create({
        data: {
          caseId: input.caseId,
          activityType: 'CALL',
          outcome: 'PROMISE_TO_PAY',
          notes: `Promise To Pay recorded for ₹${input.promisedAmount} by ${promisedDate.toLocaleDateString()}.${input.notes ? ' Notes: ' + input.notes : ''}`,
          nextFollowUpDate: promisedDate,
          performedBy: actor.email || 'system',
        },
      });

      return record;
    });

    await logAudit({
      userId: actor.id,
      action: 'COLLECTION_PTP_CREATED',
      entity: 'PromiseToPay',
      entityId: ptp.id,
      newValue: {
        amount: input.promisedAmount,
        date: input.promisedDate,
        tenantId: colCase.loan.tenantId,
        branchId: colCase.loan.branchId,
        recordedBy: actor.email,
      },
    });

    return {
      id: ptp.id,
      caseId: ptp.caseId,
      loanId: colCase.loanId,
      promisedAmount: Number(ptp.promisedAmount),
      promisedDate: ptp.promisedDate.toISOString(),
      paymentMode: ptp.paymentMode || 'UPI',
      status: ptp.status as PtpStatus,
      recordedBy: ptp.recordedBy,
      createdAt: ptp.createdAt.toISOString(),
      updatedAt: ptp.createdAt.toISOString(),
    };
  }

  /**
   * Automatically evaluate active PTPs when a successful payment is recorded via Phase 10 Payment Engine
   */
  public async evaluatePtpOnPayment(params: {
    loanId: string;
    paymentAmount: number;
    paymentReference?: string;
  }): Promise<{ evaluatedCount: number; fulfilledPtps: string[] }> {
    const activePtps = await prisma.promiseToPay.findMany({
      where: {
        status: 'PENDING',
        collectionCase: { loanId: params.loanId },
      },
      include: { collectionCase: true },
    });

    if (activePtps.length === 0) {
      return { evaluatedCount: 0, fulfilledPtps: [] };
    }

    const fulfilledIds: string[] = [];
    const paymentDecimal = new Decimal(params.paymentAmount);

    for (const ptp of activePtps) {
      const promisedDecimal = new Decimal(ptp.promisedAmount);

      if (paymentDecimal.greaterThanOrEqualTo(promisedDecimal)) {
        // Full fulfillment
        await prisma.promiseToPay.update({
          where: { id: ptp.id },
          data: { status: 'KEPT' },
        });
        fulfilledIds.push(ptp.id);
      } else if (paymentDecimal.greaterThan(0)) {
        // Partial fulfillment
        await prisma.promiseToPay.update({
          where: { id: ptp.id },
          data: { status: 'PARTIALLY_FULFILLED' },
        });
        fulfilledIds.push(ptp.id);
      }
    }

    return {
      evaluatedCount: activePtps.length,
      fulfilledPtps: fulfilledIds,
    };
  }

  /**
   * Synchronize overdue PTPs and mark expired ones as BROKEN
   */
  public async syncOverduePtps(tenantId?: string, branchId?: string): Promise<{ brokenCount: number }> {
    const now = new Date();
    const where: any = {
      status: 'PENDING',
      promisedDate: { lt: now },
    };

    if (tenantId) {
      where.collectionCase = { loan: { tenantId } };
      if (branchId) {
        where.collectionCase.loan.branchId = branchId;
      }
    }

    const expiredPtps = await prisma.promiseToPay.findMany({
      where,
      select: { id: true, caseId: true },
    });

    if (expiredPtps.length === 0) return { brokenCount: 0 };

    await prisma.promiseToPay.updateMany({
      where: { id: { in: expiredPtps.map((p) => p.id) } },
      data: { status: 'BROKEN' },
    });

    // Update parent cases from PROMISED to IN_PROGRESS and bump priority
    for (const ptp of expiredPtps) {
      const remainingPending = await prisma.promiseToPay.count({
        where: { caseId: ptp.caseId, status: 'PENDING' },
      });
      if (remainingPending === 0) {
        await prisma.collectionCase.update({
          where: { id: ptp.caseId },
          data: { status: 'IN_PROGRESS', priority: 'HIGH' },
        });
      }
    }

    return { brokenCount: expiredPtps.length };
  }

  /**
   * List PTPs for a case
   */
  public async listCasePtps(caseId: string): Promise<PtpRecord[]> {
    const rows = await prisma.promiseToPay.findMany({
      where: { caseId },
      include: { collectionCase: true },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((p) => ({
      id: p.id,
      caseId: p.caseId,
      loanId: p.collectionCase.loanId,
      promisedAmount: Number(p.promisedAmount),
      promisedDate: p.promisedDate.toISOString(),
      paymentMode: p.paymentMode || 'UPI',
      status: p.status as PtpStatus,
      recordedBy: p.recordedBy,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.createdAt.toISOString(),
    }));
  }
}

export const collectionPtpService = new CollectionPtpService();
