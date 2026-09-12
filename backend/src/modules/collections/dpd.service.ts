import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../common/errors';
import type {
  CollectionAgingBucket,
  CollectionBucketDefinition,
  CollectionCaseStatus,
  DpdCalculationResult,
} from './collection.types';

export const DEFAULT_AGING_BUCKETS: CollectionBucketDefinition[] = [
  { code: '0-30', name: 'Standard / Early Overdue', minDpd: 1, maxDpd: 30, severity: 'LOW', description: 'Early delinquency bucket requiring automated SMS/app reminders.' },
  { code: '31-60', name: 'SMA-1 / Mid Delinquency', minDpd: 31, maxDpd: 60, severity: 'MEDIUM', description: 'Special Mention Account 1 requiring direct collector engagement.' },
  { code: '61-90', name: 'SMA-2 / Severe Delinquency', minDpd: 61, maxDpd: 90, severity: 'HIGH', description: 'Special Mention Account 2 nearing non-performing asset classification.' },
  { code: '91-180', name: 'NPA Substandard / Recovery', minDpd: 91, maxDpd: 180, severity: 'CRITICAL', description: 'Substandard non-performing asset undergoing specialized recovery.' },
  { code: '180+', name: 'Doubtful & Loss Recovery', minDpd: 181, maxDpd: 99999, severity: 'CRITICAL', description: 'Doubtful asset evaluated for legal action, settlement, or write-off.' },
];

export class DpdService {
  /**
   * Determine the active aging bucket from calculated DPD
   */
  public calculateAgingBucket(
    dpd: number,
    customBuckets?: CollectionBucketDefinition[]
  ): CollectionAgingBucket {
    if (dpd <= 0) return '0-30';
    const buckets = customBuckets || DEFAULT_AGING_BUCKETS;

    for (const b of buckets) {
      if (dpd >= b.minDpd && dpd <= b.maxDpd) {
        return b.code;
      }
    }

    if (dpd > 180) return '180+';
    return '0-30';
  }

  /**
   * Authoritative calculation of Days Past Due (DPD) for a loan from its repayment schedule
   */
  public async calculateLoanDpd(
    loanId: string,
    asOfDate: Date = new Date(),
    customBuckets?: CollectionBucketDefinition[]
  ): Promise<DpdCalculationResult> {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        schedule: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!loan) {
      throw new NotFoundError(`Loan with ID ${loanId} not found.`);
    }

    const now = asOfDate;
    let totalScheduled = new Decimal(0);
    let totalPaid = new Decimal(0);
    let totalOverdue = new Decimal(0);
    let oldestOverdueDate: Date | null = null;
    let oldestInstallmentNumber: number | null = null;
    let overdueCount = 0;

    for (const item of loan.schedule) {
      totalScheduled = totalScheduled.plus(new Decimal(item.totalDue));
      totalPaid = totalPaid.plus(new Decimal(item.paidAmount || 0));

      const isDue = new Date(item.dueDate) < now;
      const outstanding = new Decimal(item.outstanding || 0);

      if (isDue && outstanding.greaterThan(0)) {
        totalOverdue = totalOverdue.plus(outstanding);
        overdueCount++;
        if (!oldestOverdueDate) {
          oldestOverdueDate = new Date(item.dueDate);
          oldestInstallmentNumber = item.emiNumber;
        }
      }
    }

    let dpd = 0;
    if (oldestOverdueDate && totalOverdue.greaterThan(0)) {
      const diffMs = now.getTime() - oldestOverdueDate.getTime();
      dpd = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    const agingBucket = this.calculateAgingBucket(dpd, customBuckets);

    let status: CollectionCaseStatus = 'CURRENT';
    if (dpd > 90) {
      status = 'LEGAL_REVIEW';
    } else if (dpd > 60) {
      status = 'ESCALATED';
    } else if (dpd > 30) {
      status = 'IN_PROGRESS';
    } else if (dpd > 0) {
      status = 'OVERDUE';
    }

    return {
      loanId: loan.id,
      loanNo: loan.loanNo,
      totalScheduledAmount: totalScheduled.toNumber(),
      totalPaidAmount: totalPaid.toNumber(),
      totalOverdueAmount: totalOverdue.toNumber(),
      oldestOverdueDate: oldestOverdueDate ? oldestOverdueDate.toISOString() : null,
      oldestInstallmentNumber,
      dpd,
      agingBucket,
      status,
      isDelinquent: dpd > 0 && totalOverdue.greaterThan(0),
      overdueInstallmentsCount: overdueCount,
    };
  }

  /**
   * Batch calculate DPD for multiple loans
   */
  public async calculateBatchDpd(
    loanIds: string[],
    asOfDate: Date = new Date()
  ): Promise<Map<string, DpdCalculationResult>> {
    const results = new Map<string, DpdCalculationResult>();
    for (const id of loanIds) {
      const res = await this.calculateLoanDpd(id, asOfDate);
      results.set(id, res);
    }
    return results;
  }
}

export const dpdService = new DpdService();
