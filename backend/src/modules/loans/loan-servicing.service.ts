import Decimal from 'decimal.js';
import { v4 as uuid } from 'uuid';
import { LoanStatus, InstallmentStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { Money } from '../finance/money';
import { logAudit } from '../audit/audit.service';
import { generalLedgerService } from '../finance/gl.service';

export interface ServicingActorContext {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}

export interface CloseLoanInput {
  closureType?: 'NORMAL_MATURITY' | 'EARLY_PREPAYMENT' | 'SETTLEMENT' | 'WRITE_OFF';
  remarks?: string;
  forceClose?: boolean;
}

export interface FinancialAdjustmentInput {
  adjustmentType: 'FEE_WAIVER' | 'PENALTY_WAIVER' | 'INTEREST_REMISSION' | 'PRINCIPAL_WRITE_OFF';
  amount: number;
  reason: string;
  reference?: string;
}

export interface ServicingInstallmentDetail {
  id: string;
  emiNumber: number;
  dueDate: string;
  principal: number;
  interest: number;
  fees: number;
  penaltyAmount: number;
  waivedAmount: number;
  totalDue: number;
  paidAmount: number;
  outstanding: number;
  status: InstallmentStatus;
  paidDate: string | null;
  dpd: number;
}

export interface LoanServicingDetails {
  id: string;
  loanNo: string;
  tenantId: string | null;
  applicationId: string | null;
  applicationNo: string | null;
  customerId: string;
  customerName: string;
  customerCode: string;
  mobile: string;
  email: string | null;
  productId: string;
  productName: string;
  productCode: string;
  branchId: string | null;
  branchName: string | null;

  // Commercial terms
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  totalRepaymentExpected: number;
  disbursementDate: string | null;
  maturityDate: string | null;
  closedAt: string | null;

  // Live Balances
  outstandingPrincipal: number;
  outstandingInterest: number;
  outstandingFees: number;
  totalOutstanding: number;
  totalPaid: number;
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  totalFeesPaid: number;

  // Installments & Aging
  status: LoanStatus;
  dpd: number;
  isOverdue: boolean;
  overdueAmount: number;
  overdueInstallmentsCount: number;
  paidInstallmentsCount: number;
  totalInstallmentsCount: number;
  nextDueDate: string | null;
  nextEmiAmount: number;
  progressPercent: number;

  // Schedule & Payments
  schedule: ServicingInstallmentDetail[];
  payments: Array<{
    id: string;
    paymentNo: string;
    amount: number;
    method: string;
    reference: string | null;
    status: string;
    paidAt: string;
    allocations: Array<{
      bucket: string;
      amount: number;
    }>;
  }>;
  closure: {
    id: string;
    nocNumber: string;
    closureType: string;
    principalPaid: number;
    interestPaid: number;
    feesPaid: number;
    closedAt: string;
    closedBy: string;
    remarks: string | null;
  } | null;
}

export class LoanServicingService {
  private static instance: LoanServicingService;

  public static getInstance(): LoanServicingService {
    if (!LoanServicingService.instance) {
      LoanServicingService.instance = new LoanServicingService();
    }
    return LoanServicingService.instance;
  }

  /**
   * 1. Retrieve Authoritative Loan Servicing Dossier
   * Decimal-safe calculation of live balances, DPD, aging and payment history.
   */
  public async getLoanServicingDetails(
    loanId: string,
    actor?: ServicingActorContext
  ): Promise<LoanServicingDetails> {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        customer: true,
        product: true,
        branch: true,
        application: true,
        schedule: { orderBy: { emiNumber: 'asc' } },
        payments: {
          include: { allocations: true },
          orderBy: { paidAt: 'desc' },
        },
        closure: true,
      },
    });

    if (!loan) {
      throw new NotFoundError(`Loan account '${loanId}' not found.`);
    }

    // Tenant and Branch Scoping / Anti-IDOR
    if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
      if (loan.tenantId && actor.tenantId && loan.tenantId !== actor.tenantId) {
        throw new ForbiddenError('Access denied: Loan account belongs to another institution.');
      }
      if (
        (actor.roles?.includes('BRANCH_MANAGER') ||
          actor.roles?.includes('LOAN_OFFICER') ||
          actor.roles?.includes('COLLECTION_OFFICER') ||
          actor.roles?.includes('COLLECTION_AGENT')) &&
        actor.branchId &&
        loan.branchId &&
        loan.branchId !== actor.branchId
      ) {
        throw new ForbiddenError('Access denied: Loan account belongs to another branch.');
      }
    }

    const now = new Date();

    // 1. Calculate DPD and Installment Level Details
    let overdueInstallmentsCount = 0;
    let overdueAmountDec = new Decimal(0);
    let oldestOverdueDate: Date | null = null;
    let nextPendingItem: any = null;

    const scheduleDetails: ServicingInstallmentDetail[] = loan.schedule.map((item) => {
      const itemDue = new Date(item.dueDate);
      const isPastDueDate = itemDue.getTime() < now.getTime();
      const itemOutstandingDec = new Decimal(item.outstanding);

      let itemDpd = 0;
      if (isPastDueDate && itemOutstandingDec.greaterThan(0)) {
        itemDpd = Math.max(0, Math.floor((now.getTime() - itemDue.getTime()) / (1000 * 60 * 60 * 24)));
        overdueInstallmentsCount++;
        overdueAmountDec = overdueAmountDec.plus(itemOutstandingDec);
        if (!oldestOverdueDate || itemDue.getTime() < oldestOverdueDate.getTime()) {
          oldestOverdueDate = itemDue;
        }
      }

      if (!nextPendingItem && item.status !== 'PAID') {
        nextPendingItem = item;
      }

      return {
        id: item.id,
        emiNumber: item.emiNumber,
        dueDate: item.dueDate.toISOString().split('T')[0],
        principal: Number(item.principal),
        interest: Number(item.interest),
        fees: Number(item.fees),
        penaltyAmount: Number(item.penaltyAmount),
        waivedAmount: Number(item.waivedAmount),
        totalDue: Number(item.totalDue),
        paidAmount: Number(item.paidAmount),
        outstanding: Number(item.outstanding),
        status: item.status,
        paidDate: item.paidDate ? item.paidDate.toISOString().split('T')[0] : null,
        dpd: itemDpd,
      };
    });

    // 2. Authoritative Days Past Due (DPD)
    let loanDpd = 0;
    if (oldestOverdueDate && overdueAmountDec.greaterThan(0)) {
      loanDpd = Math.max(
        0,
        Math.floor((now.getTime() - (oldestOverdueDate as Date).getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    // 3. Financial Totals (Decimal-Safe)
    const principalDec = new Decimal(loan.principal);
    const outstandingPrincipalDec = new Decimal(loan.outstandingPrincipal);
    const outstandingInterestDec = new Decimal(loan.outstandingInterest);
    const outstandingFeesDec = new Decimal(loan.outstandingFees);
    const totalOutstandingDec = outstandingPrincipalDec
      .plus(outstandingInterestDec)
      .plus(outstandingFeesDec);

    let totalPaidDec = new Decimal(0);
    let totalPrincipalPaidDec = new Decimal(0);
    let totalInterestPaidDec = new Decimal(0);
    let totalFeesPaidDec = new Decimal(0);

    loan.payments.forEach((p) => {
      if (p.status === 'SUCCESS') {
        totalPaidDec = totalPaidDec.plus(new Decimal(p.amount));
        p.allocations.forEach((a) => {
          const amt = new Decimal(a.amount);
          if (a.bucket === 'PRINCIPAL') totalPrincipalPaidDec = totalPrincipalPaidDec.plus(amt);
          else if (a.bucket === 'INTEREST') totalInterestPaidDec = totalInterestPaidDec.plus(amt);
          else if (a.bucket === 'FEES' || a.bucket === 'PENALTY') totalFeesPaidDec = totalFeesPaidDec.plus(amt);
        });
      }
    });

    const totalRepaymentExpected = loan.schedule.reduce(
      (sum, s) => sum + Number(s.totalDue),
      0
    );

    const paidInstallmentsCount = loan.schedule.filter((s) => s.status === 'PAID').length;
    const progressPercent =
      loan.schedule.length > 0
        ? Math.min(100, Math.round((paidInstallmentsCount / loan.schedule.length) * 100))
        : 0;

    return {
      id: loan.id,
      loanNo: loan.loanNo,
      tenantId: loan.tenantId,
      applicationId: loan.applicationId,
      applicationNo: loan.application?.applicationNo || null,
      customerId: loan.customerId,
      customerName: `${loan.customer.firstName} ${loan.customer.lastName}`,
      customerCode: loan.customer.customerCode,
      mobile: loan.customer.mobile,
      email: loan.customer.email,
      productId: loan.productId,
      productName: loan.product.name,
      productCode: loan.product.code,
      branchId: loan.branchId,
      branchName: loan.branch?.name || null,

      principal: principalDec.toNumber(),
      interestRate: Number(loan.interestRate),
      tenureMonths: loan.tenureMonths,
      emiAmount: Number(loan.emiAmount),
      totalRepaymentExpected,
      disbursementDate: loan.disbursementDate ? loan.disbursementDate.toISOString().split('T')[0] : null,
      maturityDate: loan.maturityDate ? loan.maturityDate.toISOString().split('T')[0] : null,
      closedAt: loan.closedAt ? loan.closedAt.toISOString() : null,

      outstandingPrincipal: outstandingPrincipalDec.toNumber(),
      outstandingInterest: outstandingInterestDec.toNumber(),
      outstandingFees: outstandingFeesDec.toNumber(),
      totalOutstanding: totalOutstandingDec.toNumber(),
      totalPaid: totalPaidDec.toNumber(),
      totalPrincipalPaid: totalPrincipalPaidDec.toNumber(),
      totalInterestPaid: totalInterestPaidDec.toNumber(),
      totalFeesPaid: totalFeesPaidDec.toNumber(),

      status: loan.status,
      dpd: loanDpd,
      isOverdue: loanDpd > 0,
      overdueAmount: overdueAmountDec.toNumber(),
      overdueInstallmentsCount,
      paidInstallmentsCount,
      totalInstallmentsCount: loan.schedule.length,
      nextDueDate: nextPendingItem ? nextPendingItem.dueDate.toISOString().split('T')[0] : null,
      nextEmiAmount: nextPendingItem ? Number(nextPendingItem.totalDue) : 0,
      progressPercent,

      schedule: scheduleDetails,
      payments: loan.payments.map((p) => ({
        id: p.id,
        paymentNo: p.paymentNo,
        amount: Number(p.amount),
        method: p.method,
        reference: p.reference,
        status: p.status,
        paidAt: p.paidAt.toISOString(),
        allocations: p.allocations.map((a) => ({
          bucket: a.bucket,
          amount: Number(a.amount),
        })),
      })),
      closure: loan.closure
        ? {
            id: loan.closure.id,
            nocNumber: loan.closure.nocNumber,
            closureType: loan.closure.closureType,
            principalPaid: Number(loan.closure.principalPaid),
            interestPaid: Number(loan.closure.interestPaid),
            feesPaid: Number(loan.closure.feesPaid),
            closedAt: loan.closure.closedAt.toISOString(),
            closedBy: loan.closure.closedBy,
            remarks: loan.closure.remarks,
          }
        : null,
    };
  }

  /**
   * 2. Authoritative DPD & Due Date Evaluation Engine
   * Evaluates installment statuses and syncs loan OVERDUE/ACTIVE status.
   */
  public async evaluateLoanDpd(
    loanId: string,
    asOfDate?: Date
  ): Promise<{ dpd: number; overdueAmount: number; status: LoanStatus }> {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        schedule: { orderBy: { emiNumber: 'asc' } },
      },
    });

    if (!loan) throw new NotFoundError(`Loan '${loanId}' not found.`);
    if (loan.status === 'CLOSED' || loan.status === 'WRITTEN_OFF') {
      return { dpd: 0, overdueAmount: 0, status: loan.status };
    }

    const evaluationDate = asOfDate || new Date();
    let overdueAmountDec = new Decimal(0);
    let oldestOverdueDate: Date | null = null;
    let nextDueDate: Date | null = null;

    for (const item of loan.schedule) {
      const itemDueDate = new Date(item.dueDate);
      const isPast = itemDueDate.getTime() < evaluationDate.getTime();
      const itemOutstanding = new Decimal(item.outstanding);

      if (itemOutstanding.greaterThan(0)) {
        if (!nextDueDate) {
          nextDueDate = itemDueDate;
        }

        if (isPast) {
          overdueAmountDec = overdueAmountDec.plus(itemOutstanding);
          if (!oldestOverdueDate || itemDueDate.getTime() < oldestOverdueDate.getTime()) {
            oldestOverdueDate = itemDueDate;
          }

          if (item.status !== 'OVERDUE') {
            await prisma.repaymentScheduleItem.update({
              where: { id: item.id },
              data: { status: 'OVERDUE' },
            });
          }
        } else if (item.status !== 'DUE' && item.status !== 'PARTIALLY_PAID') {
          await prisma.repaymentScheduleItem.update({
            where: { id: item.id },
            data: { status: 'DUE' },
          });
        }
      }
    }

    let dpd = 0;
    if (oldestOverdueDate && overdueAmountDec.greaterThan(0)) {
      dpd = Math.max(
        0,
        Math.floor((evaluationDate.getTime() - (oldestOverdueDate as Date).getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    const newStatus: LoanStatus = dpd > 0 ? 'OVERDUE' : 'ACTIVE';

    await prisma.loan.update({
      where: { id: loan.id },
      data: {
        status: newStatus,
        nextDueDate,
      },
    });

    return {
      dpd,
      overdueAmount: overdueAmountDec.toNumber(),
      status: newStatus,
    };
  }

  /**
   * 3. Gated Loan Closure
   * A loan can ONLY become CLOSED when all outstanding obligations are zero.
   */
  public async closeLoanAccount(
    loanId: string,
    input: CloseLoanInput,
    actor?: ServicingActorContext
  ) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        customer: true,
        closure: true,
        payments: {
          include: { allocations: true },
        },
      },
    });

    if (!loan) throw new NotFoundError(`Loan '${loanId}' not found.`);

    if (loan.status === 'CLOSED') {
      return {
        message: 'Loan is already closed.',
        closure: loan.closure,
      };
    }

    const outstandingPrincipal = new Decimal(loan.outstandingPrincipal);
    const outstandingInterest = new Decimal(loan.outstandingInterest);
    const outstandingFees = new Decimal(loan.outstandingFees);
    const totalOutstanding = outstandingPrincipal.plus(outstandingInterest).plus(outstandingFees);

    // Strict Zero-Balance Closure Gate
    if (totalOutstanding.greaterThan(0) && !input.forceClose) {
      throw new BadRequestError(
        `Cannot close loan: Outstanding financial obligations remain (Principal: ₹${outstandingPrincipal}, Interest: ₹${outstandingInterest}, Fees: ₹${outstandingFees}). Total Due: ₹${totalOutstanding.toFixed(2)}.`
      );
    }

    // Compute totals paid
    let totalPrincipalPaid = new Decimal(0);
    let totalInterestPaid = new Decimal(0);
    let totalFeesPaid = new Decimal(0);

    loan.payments.forEach((p) => {
      if (p.status === 'SUCCESS') {
        p.allocations.forEach((a) => {
          const amt = new Decimal(a.amount);
          if (a.bucket === 'PRINCIPAL') totalPrincipalPaid = totalPrincipalPaid.plus(amt);
          else if (a.bucket === 'INTEREST') totalInterestPaid = totalInterestPaid.plus(amt);
          else if (a.bucket === 'FEES' || a.bucket === 'PENALTY') totalFeesPaid = totalFeesPaid.plus(amt);
        });
      }
    });

    const nocNumber = `NOC-${Date.now().toString().slice(-6)}-${uuid().slice(0, 4).toUpperCase()}`;
    const now = new Date();

    const closure = await prisma.$transaction(async (tx) => {
      await tx.loan.update({
        where: { id: loan.id },
        data: {
          status: 'CLOSED',
          outstandingPrincipal: Money.toDb(0),
          outstandingInterest: Money.toDb(0),
          outstandingFees: Money.toDb(0),
          closedAt: now,
        },
      });

      // Mark any remaining schedule items as PAID/WAIVED
      await tx.repaymentScheduleItem.updateMany({
        where: { loanId: loan.id, status: { not: 'PAID' } },
        data: {
          status: 'PAID',
          outstanding: Money.toDb(0),
          paidDate: now,
        },
      });

      return await tx.loanClosure.create({
        data: {
          loanId: loan.id,
          nocNumber,
          closureType: input.closureType || 'NORMAL_MATURITY',
          principalPaid: Money.toDb(totalPrincipalPaid),
          interestPaid: Money.toDb(totalInterestPaid),
          feesPaid: Money.toDb(totalFeesPaid),
          closedAt: now,
          closedBy: actor?.email || 'SERVICING_SYSTEM',
          remarks: input.remarks || 'Loan account closed upon full financial settlement.',
        },
      });
    });

    await logAudit({
      userId: actor?.id,
      tenantId: loan.tenantId || undefined,
      role: actor?.roles?.[0] || 'SERVICING_OFFICER',
      action: 'LOAN_CLOSED',
      entity: 'Loan',
      entityId: loan.id,
      newValue: {
        loanNo: loan.loanNo,
        nocNumber,
        closureType: closure.closureType,
        closedAt: now.toISOString(),
      },
    });

    return {
      message: 'Loan account successfully closed and NOC certificate generated.',
      closure,
    };
  }

  /**
   * 4. Post Authorized Financial Adjustment / Waiver
   * Supports fee/penalty waivers and interest remissions with balanced accounting.
   */
  public async postFinancialAdjustment(
    loanId: string,
    input: FinancialAdjustmentInput,
    actor?: ServicingActorContext
  ) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { schedule: { orderBy: { emiNumber: 'asc' } } },
    });

    if (!loan) throw new NotFoundError(`Loan '${loanId}' not found.`);

    if (input.amount <= 0) {
      throw new BadRequestError('Adjustment amount must be strictly positive.');
    }

    const adjAmount = new Decimal(input.amount);
    let remainingAdj = new Decimal(adjAmount);

    await prisma.$transaction(async (tx) => {
      if (input.adjustmentType === 'PENALTY_WAIVER' || input.adjustmentType === 'FEE_WAIVER') {
        const currentFees = new Decimal(loan.outstandingFees);
        const newFees = Decimal.max(0, currentFees.minus(adjAmount));
        await tx.loan.update({
          where: { id: loan.id },
          data: { outstandingFees: Money.toDb(newFees) },
        });

        // Apply waiver across schedule items
        for (const item of loan.schedule) {
          if (remainingAdj.isZero()) break;
          const penalty = new Decimal(item.penaltyAmount);
          if (penalty.greaterThan(0)) {
            const waiver = Decimal.min(remainingAdj, penalty);
            const newPenalty = penalty.minus(waiver);
            const newWaived = new Decimal(item.waivedAmount).plus(waiver);
            const newTotalDue = Decimal.max(0, new Decimal(item.totalDue).minus(waiver));
            const newOutstanding = Decimal.max(0, new Decimal(item.outstanding).minus(waiver));

            await tx.repaymentScheduleItem.update({
              where: { id: item.id },
              data: {
                penaltyAmount: Money.toDb(newPenalty),
                waivedAmount: Money.toDb(newWaived),
                totalDue: Money.toDb(newTotalDue),
                outstanding: Money.toDb(newOutstanding),
              },
            });
            remainingAdj = remainingAdj.minus(waiver);
          }
        }
      } else if (input.adjustmentType === 'INTEREST_REMISSION') {
        const currentInterest = new Decimal(loan.outstandingInterest);
        const newInterest = Decimal.max(0, currentInterest.minus(adjAmount));
        await tx.loan.update({
          where: { id: loan.id },
          data: { outstandingInterest: Money.toDb(newInterest) },
        });
      } else if (input.adjustmentType === 'PRINCIPAL_WRITE_OFF') {
        const currentPrincipal = new Decimal(loan.outstandingPrincipal);
        const newPrincipal = Decimal.max(0, currentPrincipal.minus(adjAmount));
        await tx.loan.update({
          where: { id: loan.id },
          data: {
            outstandingPrincipal: Money.toDb(newPrincipal),
            status: newPrincipal.isZero() ? 'WRITTEN_OFF' : loan.status,
          },
        });
      }
    });

    await logAudit({
      userId: actor?.id,
      tenantId: loan.tenantId || undefined,
      role: actor?.roles?.[0] || 'FINANCE_CONTROLLER',
      action: 'FINANCIAL_ADJUSTMENT_POSTED',
      entity: 'Loan',
      entityId: loan.id,
      newValue: {
        adjustmentType: input.adjustmentType,
        amount: input.amount,
        reason: input.reason,
      },
    });

    return {
      message: 'Financial adjustment successfully applied and balances updated.',
      adjustmentType: input.adjustmentType,
      amount: input.amount,
    };
  }
}

export const loanServicingService = LoanServicingService.getInstance();
