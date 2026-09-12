import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import { Money } from './money';
import type {
  LoanAssetClassification,
  PortfolioNpaSummary,
  AssetClassificationType,
} from './gl.types';

export class NpaClassificationService {
  /**
   * Classify an individual loan by DPD and compute provision requirements.
   */
  public classifyLoan(loan: {
    id: string;
    loanNo: string;
    customer: { firstName: string; lastName: string };
    outstandingPrincipal: any;
    outstandingInterest: any;
    nextDueDate?: Date | null;
    status: string;
  }): LoanAssetClassification {
    const principal = new Decimal(loan.outstandingPrincipal?.toString() || '0');
    const interest = new Decimal(loan.outstandingInterest?.toString() || '0');

    let dpd = 0;
    if (loan.nextDueDate) {
      const now = new Date();
      const due = new Date(loan.nextDueDate);
      if (now > due) {
        const diffMs = now.getTime() - due.getTime();
        dpd = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }
    }

    let classification: AssetClassificationType = 'STANDARD_REGULAR';
    let provisionPct = 0.4; // 0.4% standard asset provision
    let isNpa = false;

    if (dpd === 0) {
      classification = 'STANDARD_REGULAR';
      provisionPct = 0.4;
    } else if (dpd <= 30) {
      classification = 'SMA_0';
      provisionPct = 0.4;
    } else if (dpd <= 60) {
      classification = 'SMA_1';
      provisionPct = 5.0;
    } else if (dpd <= 90) {
      classification = 'SMA_2';
      provisionPct = 10.0;
    } else if (dpd <= 180) {
      classification = 'SUB_STANDARD_NPA';
      provisionPct = 15.0;
      isNpa = true;
    } else if (dpd <= 365) {
      classification = 'DOUBTFUL_NPA';
      provisionPct = 25.0;
      isNpa = true;
    } else {
      classification = 'LOSS_ASSET';
      provisionPct = 100.0;
      isNpa = true;
    }

    const provisionRequired = Money.round(principal.times(provisionPct).dividedBy(100));

    return {
      loanId: loan.id,
      loanNo: loan.loanNo,
      borrowerName: `${loan.customer.firstName} ${loan.customer.lastName}`,
      principalOutstanding: principal.toNumber(),
      interestOutstanding: interest.toNumber(),
      dpd,
      classification,
      provisionPct,
      provisionRequired: provisionRequired.toNumber(),
      isNpa,
    };
  }

  /**
   * Generate Full Portfolio NPA Summary & Classification Matrix
   */
  public async getPortfolioNpaSummary(tenantId?: string): Promise<{
    summary: PortfolioNpaSummary;
    loanClassifications: LoanAssetClassification[];
  }> {
    const whereClause: any = {
      status: { in: ['ACTIVE', 'OVERDUE'] },
    };
    if (tenantId) whereClause.tenantId = tenantId;

    const loans = await prisma.loan.findMany({
      where: whereClause,
      include: { customer: true },
    });

    const classifications = loans.map((l) => this.classifyLoan(l));

    let totalBook = new Decimal(0);
    let standardBook = new Decimal(0);
    let smaBook = new Decimal(0);
    let npaBook = new Decimal(0);
    let totalProvision = new Decimal(0);

    let standardCount = 0;
    let smaCount = 0;
    let npaCount = 0;

    for (const item of classifications) {
      const p = new Decimal(item.principalOutstanding);
      totalBook = totalBook.plus(p);
      totalProvision = totalProvision.plus(item.provisionRequired);

      if (item.classification === 'STANDARD_REGULAR') {
        standardCount++;
        standardBook = standardBook.plus(p);
      } else if (item.classification.startsWith('SMA')) {
        smaCount++;
        smaBook = smaBook.plus(p);
      } else {
        npaCount++;
        npaBook = npaBook.plus(p);
      }
    }

    const grossNpaPct = totalBook.greaterThan(0)
      ? npaBook.dividedBy(totalBook).times(100).toDecimalPlaces(2).toNumber()
      : 0;

    const netNpaBook = Decimal.max(0, npaBook.minus(totalProvision));
    const netNpaPct = totalBook.greaterThan(0)
      ? netNpaBook.dividedBy(totalBook).times(100).toDecimalPlaces(2).toNumber()
      : 0;

    const pcrPct = npaBook.greaterThan(0)
      ? totalProvision.dividedBy(npaBook).times(100).toDecimalPlaces(2).toNumber()
      : 100;

    const summary: PortfolioNpaSummary = {
      tenantId: tenantId || 'GLOBAL',
      totalActiveLoans: loans.length,
      totalBookOutstanding: totalBook.toNumber(),
      standardLoansCount: standardCount,
      standardLoansBook: standardBook.toNumber(),
      smaLoansCount: smaCount,
      smaLoansBook: smaBook.toNumber(),
      npaLoansCount: npaCount,
      npaLoansBook: npaBook.toNumber(),
      grossNpaPct,
      netNpaPct,
      totalProvisionRequired: totalProvision.toNumber(),
      provisionCoverageRatioPct: Math.min(100, pcrPct),
      generatedAt: new Date().toISOString(),
    };

    return {
      summary,
      loanClassifications: classifications,
    };
  }
}

export const npaClassificationService = new NpaClassificationService();
