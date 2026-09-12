import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import { Money } from './money';
import { generalLedgerService } from './gl.service';
import { logAudit } from '../audit/audit.service';

export interface AccrualRunResult {
  runId: string;
  runDate: string;
  tenantId?: string;
  totalLoansProcessed: number;
  totalInterestAccruedInr: number;
  journalEntryId?: string;
  loanUpdates: Array<{
    loanId: string;
    loanNo: string;
    principal: number;
    interestRate: number;
    dailyAccrualInr: number;
    newOutstandingInterest: number;
  }>;
  executionDurationMs: number;
}

export class DailyAccrualService {
  /**
   * Run End-Of-Day (EOD) interest accrual across all active performing loans.
   * Daily Interest = Principal * (InterestRate / 365 / 100)
   */
  public async runEodAccrual(tenantId?: string, runDateStr?: string): Promise<AccrualRunResult> {
    const startTime = Date.now();
    const runDate = runDateStr || new Date().toISOString().split('T')[0];

    const whereClause: any = { status: 'ACTIVE' };
    if (tenantId) whereClause.tenantId = tenantId;

    const activeLoans = await prisma.loan.findMany({
      where: whereClause,
      include: {
        customer: true,
      },
    });

    let totalAccrued = new Decimal(0);
    const loanUpdates: AccrualRunResult['loanUpdates'] = [];

    for (const loan of activeLoans) {
      const principal = new Decimal(loan.outstandingPrincipal.toString());
      if (principal.lessThanOrEqualTo(0)) continue;

      const annualRate = new Decimal(loan.interestRate.toString());
      const dailyRate = annualRate.dividedBy(365).dividedBy(100);
      const dailyAccrual = Money.round(principal.times(dailyRate));

      if (dailyAccrual.greaterThan(0)) {
        totalAccrued = totalAccrued.plus(dailyAccrual);

        const currentOutstandingInterest = new Decimal(loan.outstandingInterest?.toString() || '0');
        const newOutstandingInterest = currentOutstandingInterest.plus(dailyAccrual);

        await prisma.loan.update({
          where: { id: loan.id },
          data: {
            outstandingInterest: Money.toDb(newOutstandingInterest),
          },
        });

        loanUpdates.push({
          loanId: loan.id,
          loanNo: loan.loanNo,
          principal: principal.toNumber(),
          interestRate: annualRate.toNumber(),
          dailyAccrualInr: dailyAccrual.toNumber(),
          newOutstandingInterest: newOutstandingInterest.toNumber(),
        });
      }
    }

    let journalEntryId: string | undefined;

    if (totalAccrued.greaterThan(0)) {
      const je = await generalLedgerService.postDailyAccrualJournal({
        tenantId: tenantId || 'tenant-adyapan-default',
        totalDailyAccruedInterest: totalAccrued.toNumber(),
        loansCount: loanUpdates.length,
        asOfDate: runDate,
      });
      journalEntryId = je.id;
    }

    const durationMs = Date.now() - startTime;

    await logAudit({
      action: 'RUN_EOD_DAILY_ACCRUAL',
      entity: 'FINANCE_ENGINE',
      entityId: `EOD-${runDate}`,
      newValue: {
        totalLoans: loanUpdates.length,
        totalAccrued: totalAccrued.toNumber(),
        journalEntryId,
      },
    });

    return {
      runId: `ACCRUAL-${Date.now()}`,
      runDate,
      tenantId,
      totalLoansProcessed: loanUpdates.length,
      totalInterestAccruedInr: totalAccrued.toNumber(),
      journalEntryId,
      loanUpdates,
      executionDurationMs: durationMs,
    };
  }
}

export const dailyAccrualService = new DailyAccrualService();
