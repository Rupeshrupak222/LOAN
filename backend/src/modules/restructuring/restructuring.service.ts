import { Decimal } from 'decimal.js';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { calculateEmi } from '../finance/emi';
import { Money } from '../finance/money';
import { generateNocNo, generatePaymentNo } from '../shared/codes';
import { logAudit } from '../audit/audit.service';
import type {
  ProposeRestructureInput,
  ProposeSettlementInput,
  ExecuteClosureInput,
} from './restructuring.schema';

export async function restructureLoan(
  input: ProposeRestructureInput,
  actor: { email: string; id: string; roles: string[] }
) {
  const loan = await prisma.loan.findUnique({
    where: { id: input.loanId },
    include: {
      schedule: {
        where: { status: 'PAID' },
        orderBy: { emiNumber: 'desc' },
      },
    },
  });
  if (!loan) throw new NotFoundError('Loan account not found');

  if (loan.status === 'CLOSED' || loan.status === 'SETTLED') {
    throw new BadRequestError(`Cannot restructure loan in status ${loan.status}`);
  }

  const outstandingPrincipalNum = Number(loan.outstandingPrincipal);
  const newRateNum = Number(input.newInterestRate);
  const remainingTenure = input.newTenureMonths;

  // Calculate new EMI for the remaining principal
  const emiCalc = calculateEmi(outstandingPrincipalNum, newRateNum, remainingTenure);
  const newEmi = emiCalc.emi;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Record restructuring audit row
    const record = await tx.loanRestructure.create({
      data: {
        loanId: loan.id,
        oldTenureMonths: loan.tenureMonths,
        newTenureMonths: input.newTenureMonths,
        oldInterestRate: loan.interestRate,
        newInterestRate: Money.toDb(input.newInterestRate),
        oldEmi: loan.emiAmount,
        newEmi,
        moratoriumMonths: input.moratoriumMonths,
        reason: input.reason,
        approvedBy: actor.email,
      },
    });

    // 2. Delete remaining unpaid schedule items (preserves all historically paid ones!)
    await tx.repaymentScheduleItem.deleteMany({
      where: { loanId: loan.id, status: { not: 'PAID' } },
    });

    // 3. Generate new schedule items starting after last paid installment
    const lastPaidEmiNumber = loan.schedule[0]?.emiNumber || 0;
    const newItems = emiCalc.schedule.map((row, idx) => {
      const emiNum = lastPaidEmiNumber + row.emiNumber;
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + input.moratoriumMonths + idx + 1);

      return {
        loanId: loan.id,
        emiNumber: emiNum,
        dueDate,
        principal: row.principal,
        interest: row.interest,
        fees: '0.00',
        totalDue: row.emi,
        paidAmount: '0.00',
        outstanding: row.emi,
        status: 'UPCOMING' as const,
      };
    });

    await tx.repaymentScheduleItem.createMany({ data: newItems });

    // 4. Update Loan Account
    const newMaturityDate = new Date();
    newMaturityDate.setMonth(newMaturityDate.getMonth() + input.moratoriumMonths + remainingTenure);

    await tx.loan.update({
      where: { id: loan.id },
      data: {
        tenureMonths: lastPaidEmiNumber + remainingTenure,
        interestRate: Money.toDb(input.newInterestRate),
        emiAmount: newEmi,
        maturityDate: newMaturityDate,
        status: 'RESTRUCTURED',
      },
    });

    return record;
  });

  await logAudit({
    userId: actor.id,
    action: 'LOAN_RESTRUCTURED',
    entity: 'Loan',
    entityId: loan.id,
    newValue: {
      newTenure: input.newTenureMonths,
      newRate: input.newInterestRate,
      newEmi,
      reason: input.reason,
    },
  });

  return result;
}

export async function executeSettlement(
  input: ProposeSettlementInput,
  actor: { email: string; id: string; roles: string[] }
) {
  const loan = await prisma.loan.findUnique({ where: { id: input.loanId } });
  if (!loan) throw new NotFoundError('Loan account not found');

  const totalOutstanding = new Decimal(loan.outstandingPrincipal)
    .plus(loan.outstandingInterest)
    .plus(loan.outstandingFees);

  const settlementNum = new Decimal(input.settlementAmount);
  if (settlementNum.greaterThan(totalOutstanding)) {
    throw new BadRequestError('Settlement amount cannot exceed total outstanding balance');
  }

  const waivedAmount = totalOutstanding.minus(settlementNum);

  const settlement = await prisma.$transaction(async (tx) => {
    const rec = await tx.settlement.create({
      data: {
        loanId: loan.id,
        totalOutstanding: Money.toDb(totalOutstanding),
        settlementAmount: Money.toDb(settlementNum),
        waivedAmount: Money.toDb(waivedAmount),
        reason: input.reason,
        status: 'COMPLETED',
        approvedBy: actor.email,
        paidDate: new Date(),
      },
    });

    // Record settlement payment
    const paymentNo = generatePaymentNo();
    const pmt = await tx.payment.create({
      data: {
        paymentNo,
        loanId: loan.id,
        customerId: loan.customerId,
        amount: Money.toDb(settlementNum),
        method: 'BANK_TRANSFER',
        reference: `ONE-TIME-SETTLEMENT-${loan.loanNo}`,
        status: 'SUCCESS',
      },
    });

    await tx.paymentAllocation.create({
      data: {
        paymentId: pmt.id,
        bucket: 'PRINCIPAL',
        amount: Money.toDb(settlementNum),
      },
    });

    // Ledger adjustment for waiver
    await tx.transaction.create({
      data: {
        loanId: loan.id,
        type: 'SETTLEMENT',
        direction: 'CREDIT',
        amount: Money.toDb(settlementNum),
        reference: rec.id,
        description: `Settlement payoff received. ₹${Money.toDb(waivedAmount)} waived.`,
      },
    });

    // Mark remaining schedule items waived
    await tx.repaymentScheduleItem.updateMany({
      where: { loanId: loan.id, status: { not: 'PAID' } },
      data: { status: 'WAIVED', outstanding: '0.00' },
    });

    // Mark loan settled
    await tx.loan.update({
      where: { id: loan.id },
      data: {
        outstandingPrincipal: '0.00',
        outstandingInterest: '0.00',
        outstandingFees: '0.00',
        status: 'SETTLED',
        closedAt: new Date(),
      },
    });

    return rec;
  });

  await logAudit({
    userId: actor.id,
    action: 'LOAN_SETTLED',
    entity: 'Loan',
    entityId: loan.id,
    newValue: {
      settlementAmount: input.settlementAmount,
      waivedAmount: Money.toDb(waivedAmount),
    },
  });

  return settlement;
}

export async function closeLoanAndIssueNoc(
  input: ExecuteClosureInput,
  actor: { email: string; id: string; roles: string[] }
) {
  const loan = await prisma.loan.findUnique({
    where: { id: input.loanId },
    include: {
      customer: true,
      product: true,
      payments: true,
    },
  });
  if (!loan) throw new NotFoundError('Loan account not found');

  const totalOutstanding = new Decimal(loan.outstandingPrincipal)
    .plus(loan.outstandingInterest)
    .plus(loan.outstandingFees);

  if (!totalOutstanding.isZero() && input.closureType !== 'SETTLEMENT' && input.closureType !== 'WRITE_OFF') {
    throw new BadRequestError(
      `Cannot issue closure NOC. Outstanding balance remains ₹${totalOutstanding.toFixed(2)}`
    );
  }

  const nocNumber = generateNocNo();

  const totalPrincipalPaid = loan.payments.reduce(
    (acc, p) => (p.status === 'SUCCESS' ? acc.plus(p.amount) : acc),
    new Decimal(0)
  );

  const closure = await prisma.$transaction(async (tx) => {
    const cl = await tx.loanClosure.upsert({
      where: { loanId: loan.id },
      update: {
        nocNumber,
        closureType: input.closureType,
        closedBy: actor.email,
        remarks: input.remarks,
      },
      create: {
        loanId: loan.id,
        nocNumber,
        closureType: input.closureType,
        principalPaid: Money.toDb(loan.principal),
        interestPaid: Money.toDb(totalPrincipalPaid.minus(loan.principal).greaterThan(0) ? totalPrincipalPaid.minus(loan.principal) : 0),
        feesPaid: '0.00',
        closedBy: actor.email,
        remarks: input.remarks,
      },
    });

    await tx.loan.update({
      where: { id: loan.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        outstandingPrincipal: '0.00',
        outstandingInterest: '0.00',
        outstandingFees: '0.00',
      },
    });

    return cl;
  });

  await logAudit({
    userId: actor.id,
    action: 'LOAN_CLOSED_NOC_ISSUED',
    entity: 'LoanClosure',
    entityId: closure.id,
    newValue: { nocNumber, closureType: input.closureType },
  });

  return closure;
}
