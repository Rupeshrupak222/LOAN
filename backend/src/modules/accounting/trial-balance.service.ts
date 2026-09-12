import Decimal from 'decimal.js';
import {
  PeriodTrialBalanceReport,
  PeriodTrialBalanceItem,
  AccountGeneralLedgerReport,
  GeneralLedgerTransactionRow,
} from './accounting.types';
import { chartOfAccountsService } from './chart-of-accounts.service';
import { generalLedgerService } from '../finance/gl.service';
import { NotFoundError } from '../../common/errors';

export class TrialBalanceService {
  /**
   * Calculate a dynamic, period-aware Trial Balance with Opening, Period Movement, and Closing balances
   */
  public getPeriodTrialBalance(params: {
    tenantId?: string;
    periodCode?: string;
    startDate?: string;
    endDate?: string;
  }): PeriodTrialBalanceReport {
    const tenantId = params.tenantId || 'tenant-adyapan-default';
    const allAccounts = chartOfAccountsService.listAccounts({ tenantId });
    const allJournals = generalLedgerService.listJournalEntries({ tenantId, limit: 10000 });

    const startDate = params.startDate || '1970-01-01T00:00:00.000Z';
    const endDate = params.endDate || new Date().toISOString();

    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();

    // Map: accountCode -> { openingDebit, openingCredit, periodDebit, periodCredit }
    const accountStats = new Map<
      string,
      {
        openingDebit: Decimal;
        openingCredit: Decimal;
        periodDebit: Decimal;
        periodCredit: Decimal;
      }
    >();

    for (const acc of allAccounts) {
      accountStats.set(acc.code, {
        openingDebit: new Decimal(0),
        openingCredit: new Decimal(0),
        periodDebit: new Decimal(0),
        periodCredit: new Decimal(0),
      });
    }

    for (const journal of allJournals) {
      const txTime = new Date(journal.transactionDate).getTime();
      const isOpening = txTime < startTimestamp;
      const isPeriod = txTime >= startTimestamp && txTime <= endTimestamp;

      if (!isOpening && !isPeriod) {
        continue;
      }

      for (const line of journal.lines) {
        let stat = accountStats.get(line.accountCode);
        if (!stat) {
          stat = {
            openingDebit: new Decimal(0),
            openingCredit: new Decimal(0),
            periodDebit: new Decimal(0),
            periodCredit: new Decimal(0),
          };
          accountStats.set(line.accountCode, stat);
        }

        const amt = new Decimal(line.amount || 0);

        if (isOpening) {
          if (line.direction === 'DEBIT') {
            stat.openingDebit = stat.openingDebit.plus(amt);
          } else {
            stat.openingCredit = stat.openingCredit.plus(amt);
          }
        } else if (isPeriod) {
          if (line.direction === 'DEBIT') {
            stat.periodDebit = stat.periodDebit.plus(amt);
          } else {
            stat.periodCredit = stat.periodCredit.plus(amt);
          }
        }
      }
    }

    let totalOpeningDebits = new Decimal(0);
    let totalOpeningCredits = new Decimal(0);
    let totalPeriodDebits = new Decimal(0);
    let totalPeriodCredits = new Decimal(0);
    let totalClosingDebits = new Decimal(0);
    let totalClosingCredits = new Decimal(0);

    const items: PeriodTrialBalanceItem[] = [];

    for (const acc of allAccounts) {
      const stat = accountStats.get(acc.code) || {
        openingDebit: new Decimal(0),
        openingCredit: new Decimal(0),
        periodDebit: new Decimal(0),
        periodCredit: new Decimal(0),
      };

      totalOpeningDebits = totalOpeningDebits.plus(stat.openingDebit);
      totalOpeningCredits = totalOpeningCredits.plus(stat.openingCredit);
      totalPeriodDebits = totalPeriodDebits.plus(stat.periodDebit);
      totalPeriodCredits = totalPeriodCredits.plus(stat.periodCredit);

      // Compute cumulative closing debits & credits
      const cumDebit = stat.openingDebit.plus(stat.periodDebit);
      const cumCredit = stat.openingCredit.plus(stat.periodCredit);

      let closingDebit = new Decimal(0);
      let closingCredit = new Decimal(0);
      let netBalance = new Decimal(0);

      if (acc.normalBalance === 'DEBIT') {
        netBalance = cumDebit.minus(cumCredit);
        if (netBalance.greaterThanOrEqualTo(0)) {
          closingDebit = netBalance;
        } else {
          closingCredit = netBalance.abs();
        }
      } else {
        netBalance = cumCredit.minus(cumDebit);
        if (netBalance.greaterThanOrEqualTo(0)) {
          closingCredit = netBalance;
        } else {
          closingDebit = netBalance.abs();
        }
      }

      totalClosingDebits = totalClosingDebits.plus(closingDebit);
      totalClosingCredits = totalClosingCredits.plus(closingCredit);

      items.push({
        accountCode: acc.code,
        accountName: acc.name,
        category: acc.category,
        subCategory: acc.subCategory,
        openingDebit: stat.openingDebit.toNumber(),
        openingCredit: stat.openingCredit.toNumber(),
        periodDebit: stat.periodDebit.toNumber(),
        periodCredit: stat.periodCredit.toNumber(),
        closingDebit: closingDebit.toNumber(),
        closingCredit: closingCredit.toNumber(),
        netBalance: netBalance.toNumber(),
      });
    }

    const isBalanced = totalClosingDebits.minus(totalClosingCredits).abs().lessThanOrEqualTo(0.01);

    return {
      tenantId,
      periodCode: params.periodCode,
      startDate,
      endDate,
      accounts: items,
      totalOpeningDebits: totalOpeningDebits.toNumber(),
      totalOpeningCredits: totalOpeningCredits.toNumber(),
      totalPeriodDebits: totalPeriodDebits.toNumber(),
      totalPeriodCredits: totalPeriodCredits.toNumber(),
      totalClosingDebits: totalClosingDebits.toNumber(),
      totalClosingCredits: totalClosingCredits.toNumber(),
      isBalanced,
    };
  }

  /**
   * Drill-down into a specific account's General Ledger ledger with running balances
   */
  public getAccountGeneralLedger(params: {
    accountCode: string;
    tenantId?: string;
    startDate?: string;
    endDate?: string;
  }): AccountGeneralLedgerReport {
    const acc = chartOfAccountsService.getAccount(params.accountCode);
    if (!acc) {
      throw new NotFoundError(`Account code "${params.accountCode}" not found.`);
    }

    const tenantId = params.tenantId || 'tenant-adyapan-default';
    const allJournals = generalLedgerService.listJournalEntries({ tenantId, limit: 10000 });

    const startDate = params.startDate || '1970-01-01T00:00:00.000Z';
    const endDate = params.endDate || new Date().toISOString();

    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();

    let openingBalance = new Decimal(0);
    let totalDebits = new Decimal(0);
    let totalCredits = new Decimal(0);
    const transactions: GeneralLedgerTransactionRow[] = [];

    // Sort chronologically ascending
    allJournals.sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

    let runningBalance = new Decimal(0);

    for (const journal of allJournals) {
      const txTime = new Date(journal.transactionDate).getTime();
      const matchingLines = journal.lines.filter((l) => l.accountCode === params.accountCode);

      for (const line of matchingLines) {
        const amt = new Decimal(line.amount || 0);
        const isDebit = line.direction === 'DEBIT';

        if (txTime < startTimestamp) {
          if (acc.normalBalance === 'DEBIT') {
            openingBalance = isDebit ? openingBalance.plus(amt) : openingBalance.minus(amt);
          } else {
            openingBalance = isDebit ? openingBalance.minus(amt) : openingBalance.plus(amt);
          }
          runningBalance = openingBalance;
        } else if (txTime >= startTimestamp && txTime <= endTimestamp) {
          if (isDebit) {
            totalDebits = totalDebits.plus(amt);
            runningBalance =
              acc.normalBalance === 'DEBIT' ? runningBalance.plus(amt) : runningBalance.minus(amt);
          } else {
            totalCredits = totalCredits.plus(amt);
            runningBalance =
              acc.normalBalance === 'DEBIT' ? runningBalance.minus(amt) : runningBalance.plus(amt);
          }

          transactions.push({
            transactionDate: journal.transactionDate,
            journalId: journal.id,
            entryNumber: journal.entryNumber,
            referenceType: journal.referenceType,
            referenceId: journal.referenceId,
            description: line.description || journal.description,
            debit: isDebit ? amt.toNumber() : 0,
            credit: !isDebit ? amt.toNumber() : 0,
            runningBalance: runningBalance.toNumber(),
            postedBy: journal.postedBy,
          });
        }
      }
    }

    const closingBalance = runningBalance;

    return {
      accountCode: acc.code,
      accountName: acc.name,
      category: acc.category,
      normalBalance: acc.normalBalance,
      openingBalance: openingBalance.toNumber(),
      closingBalance: closingBalance.toNumber(),
      totalDebits: totalDebits.toNumber(),
      totalCredits: totalCredits.toNumber(),
      transactions,
    };
  }
}

export const trialBalanceService = new TrialBalanceService();
