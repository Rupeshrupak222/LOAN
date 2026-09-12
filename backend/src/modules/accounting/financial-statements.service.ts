import Decimal from 'decimal.js';
import {
  ProfitAndLossReport,
  BalanceSheetReport,
  CashFlowReport,
} from './accounting.types';
import { trialBalanceService } from './trial-balance.service';
import { generalLedgerService } from '../finance/gl.service';

export class FinancialStatementsService {
  /**
   * Dynamic Profit & Loss Statement (P&L) generator
   */
  public getProfitAndLoss(params: {
    tenantId?: string;
    periodCode?: string;
    startDate?: string;
    endDate?: string;
  }): ProfitAndLossReport {
    const tenantId = params.tenantId || 'tenant-adyapan-default';
    const tb = trialBalanceService.getPeriodTrialBalance({
      tenantId,
      periodCode: params.periodCode,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    const getNetMovement = (code: string): number => {
      const item = tb.accounts.find((a) => a.accountCode === code);
      if (!item) return 0;
      // In P&L, Revenue accounts have CREDIT normal balance; Expense accounts have DEBIT normal balance
      if (item.category === 'INCOME') {
        return new Decimal(item.periodCredit).minus(item.periodDebit).toNumber();
      } else {
        return new Decimal(item.periodDebit).minus(item.periodCredit).toNumber();
      }
    };

    const interestIncome = Math.max(0, getNetMovement('4010'));
    const processingFeeIncome = Math.max(0, getNetMovement('4020'));
    const penaltyIncome = Math.max(0, getNetMovement('4030'));
    const documentationFeeIncome = Math.max(0, getNetMovement('4040'));
    const platformFeeIncome = 0;
    const foreclosureIncome = Math.max(0, getNetMovement('4050'));

    // Sum other income accounts
    let otherLendingIncome = 0;
    for (const acc of tb.accounts) {
      if (
        acc.category === 'INCOME' &&
        !['4010', '4020', '4030', '4040', '4050'].includes(acc.accountCode)
      ) {
        otherLendingIncome += Math.max(0, getNetMovement(acc.accountCode));
      }
    }

    const totalRevenue = new Decimal(interestIncome)
      .plus(processingFeeIncome)
      .plus(penaltyIncome)
      .plus(documentationFeeIncome)
      .plus(platformFeeIncome)
      .plus(foreclosureIncome)
      .plus(otherLendingIncome)
      .toNumber();

    const partnerCommissionExpense = Math.max(0, getNetMovement('5040'));
    const paymentGatewayExpense = Math.max(0, getNetMovement('5010'));
    const collectionExpense = Math.max(0, getNetMovement('5050'));
    const employeeAndAdminExpense = Math.max(0, getNetMovement('5070'));
    const technologyExpense = Math.max(0, getNetMovement('5060'));
    const badDebtExpense = new Decimal(Math.max(0, getNetMovement('5020')))
      .plus(Math.max(0, getNetMovement('5030')))
      .toNumber();

    let otherOperatingExpenses = 0;
    for (const acc of tb.accounts) {
      if (
        acc.category === 'EXPENSE' &&
        !['5010', '5020', '5030', '5040', '5050', '5060', '5070'].includes(acc.accountCode)
      ) {
        otherOperatingExpenses += Math.max(0, getNetMovement(acc.accountCode));
      }
    }

    const totalExpenses = new Decimal(partnerCommissionExpense)
      .plus(paymentGatewayExpense)
      .plus(collectionExpense)
      .plus(employeeAndAdminExpense)
      .plus(technologyExpense)
      .plus(badDebtExpense)
      .plus(otherOperatingExpenses)
      .toNumber();

    const netOperatingProfit = new Decimal(totalRevenue).minus(totalExpenses).toNumber();

    return {
      tenantId,
      periodCode: params.periodCode,
      startDate: tb.startDate,
      endDate: tb.endDate,
      operatingRevenue: {
        interestIncome,
        processingFeeIncome,
        documentationFeeIncome,
        platformFeeIncome,
        penaltyIncome,
        foreclosureIncome,
        otherLendingIncome,
        totalRevenue,
      },
      operatingExpenses: {
        partnerCommissionExpense,
        paymentGatewayExpense,
        collectionExpense,
        employeeAndAdminExpense,
        technologyExpense,
        otherOperatingExpenses,
        badDebtExpense,
        totalExpenses,
      },
      netOperatingProfit,
    };
  }

  /**
   * Dynamic Balance Sheet Generator enforcing Assets = Liabilities + Equity
   */
  public getBalanceSheet(params: { tenantId?: string; asOfDate?: string }): BalanceSheetReport {
    const tenantId = params.tenantId || 'tenant-adyapan-default';
    const asOfDate = params.asOfDate || new Date().toISOString();

    const tb = trialBalanceService.getPeriodTrialBalance({
      tenantId,
      startDate: '1970-01-01T00:00:00.000Z',
      endDate: asOfDate,
    });

    const getClosingBalance = (code: string): number => {
      const item = tb.accounts.find((a) => a.accountCode === code);
      if (!item) return 0;
      return item.netBalance;
    };

    // Assets
    const cashAndBank = Math.max(0, getClosingBalance('1010'));
    const loanPrincipalReceivable = Math.max(0, getClosingBalance('1020'));
    const interestReceivable = new Decimal(Math.max(0, getClosingBalance('1030')))
      .plus(Math.max(0, getClosingBalance('1040')))
      .toNumber();
    const penaltyReceivable = Math.max(0, getClosingBalance('1050'));
    const feeReceivable = Math.max(0, getClosingBalance('1060'));
    const otherReceivables = Math.max(0, getClosingBalance('1099'));

    const totalAssets = new Decimal(cashAndBank)
      .plus(loanPrincipalReceivable)
      .plus(interestReceivable)
      .plus(penaltyReceivable)
      .plus(feeReceivable)
      .plus(otherReceivables)
      .toNumber();

    // Liabilities
    const borrowingsAndDebtCapital = Math.max(0, getClosingBalance('2040'));
    const accountsPayable = Math.max(0, getClosingBalance('2050'));
    const partnerPayables = Math.max(0, getClosingBalance('2030'));
    const taxPayables = new Decimal(Math.max(0, getClosingBalance('2020')))
      .plus(Math.max(0, getClosingBalance('2021')))
      .plus(Math.max(0, getClosingBalance('2022')))
      .plus(Math.max(0, getClosingBalance('2023')))
      .toNumber();
    const otherLiabilities = Math.max(0, getClosingBalance('2010'));

    const totalLiabilities = new Decimal(borrowingsAndDebtCapital)
      .plus(accountsPayable)
      .plus(partnerPayables)
      .plus(taxPayables)
      .plus(otherLiabilities)
      .toNumber();

    // Calculate dynamic P&L profit/loss for the period
    const pl = this.getProfitAndLoss({
      tenantId,
      startDate: '1970-01-01T00:00:00.000Z',
      endDate: asOfDate,
    });

    const capitalAndReserves = Math.max(0, getClosingBalance('3010'));
    const retainedEarnings = Math.max(0, getClosingBalance('3020'));
    const currentPeriodProfitLoss = pl.netOperatingProfit;

    const totalEquity = new Decimal(capitalAndReserves)
      .plus(retainedEarnings)
      .plus(currentPeriodProfitLoss)
      .toNumber();

    const totalLiabilitiesAndEquity = new Decimal(totalLiabilities).plus(totalEquity).toNumber();
    const diff = new Decimal(totalAssets).minus(totalLiabilitiesAndEquity).abs();
    const isBalanced = diff.lessThanOrEqualTo(0.01);

    return {
      tenantId,
      asOfDate,
      assets: {
        cashAndBank,
        loanPrincipalReceivable,
        interestReceivable,
        feeReceivable,
        penaltyReceivable,
        otherReceivables,
        totalAssets,
      },
      liabilities: {
        borrowingsAndDebtCapital,
        accountsPayable,
        partnerPayables,
        taxPayables,
        otherLiabilities,
        totalLiabilities,
      },
      equity: {
        capitalAndReserves,
        retainedEarnings,
        currentPeriodProfitLoss,
        totalEquity,
      },
      totalLiabilitiesAndEquity,
      isBalanced,
      imbalanceAmount: diff.toNumber(),
    };
  }

  /**
   * Cash Flow Statement Generator (Operating & Financing flows)
   */
  public getCashFlowStatement(params: {
    tenantId?: string;
    startDate?: string;
    endDate?: string;
  }): CashFlowReport {
    const tenantId = params.tenantId || 'tenant-adyapan-default';
    const startDate = params.startDate || '1970-01-01T00:00:00.000Z';
    const endDate = params.endDate || new Date().toISOString();

    const allJournals = generalLedgerService.listJournalEntries({ tenantId, limit: 10000 });
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();

    let openingCash = new Decimal(0);
    let borrowerRepayments = new Decimal(0);
    let loanDisbursements = new Decimal(0);
    let feeCollections = new Decimal(0);
    let partnerCommissionPayments = new Decimal(0);
    let operatingExpensePayments = new Decimal(0);
    let capitalInflows = new Decimal(0);
    let debtBorrowings = new Decimal(0);
    let debtRepayments = new Decimal(0);

    for (const j of allJournals) {
      const txTime = new Date(j.transactionDate).getTime();
      const cashDebit = j.lines
        .filter((l) => l.accountCode === '1010' && l.direction === 'DEBIT')
        .reduce((sum, l) => sum.plus(l.amount || 0), new Decimal(0));
      const cashCredit = j.lines
        .filter((l) => l.accountCode === '1010' && l.direction === 'CREDIT')
        .reduce((sum, l) => sum.plus(l.amount || 0), new Decimal(0));

      if (txTime < startTimestamp) {
        openingCash = openingCash.plus(cashDebit).minus(cashCredit);
      } else if (txTime >= startTimestamp && txTime <= endTimestamp) {
        if (j.referenceType === 'DISBURSEMENT') {
          loanDisbursements = loanDisbursements.plus(cashCredit);
        } else if (j.referenceType === 'REPAYMENT' || j.referenceType === 'SETTLEMENT') {
          borrowerRepayments = borrowerRepayments.plus(cashDebit);
        } else if (j.referenceType === 'PARTNER_COMMISSION') {
          partnerCommissionPayments = partnerCommissionPayments.plus(cashCredit);
        } else if (j.referenceType === 'DAILY_INTEREST_ACCRUAL' || j.referenceType === 'FEE_ACCRUAL') {
          feeCollections = feeCollections.plus(cashDebit);
        } else {
          // Manual journals & adjustments
          if (cashDebit.greaterThan(0)) {
            capitalInflows = capitalInflows.plus(cashDebit);
          }
          if (cashCredit.greaterThan(0)) {
            operatingExpensePayments = operatingExpensePayments.plus(cashCredit);
          }
        }
      }
    }

    const netCashFromOperations = borrowerRepayments
      .plus(feeCollections)
      .minus(loanDisbursements)
      .minus(partnerCommissionPayments)
      .minus(operatingExpensePayments);

    const netCashFromFinancing = capitalInflows.plus(debtBorrowings).minus(debtRepayments);
    const netCashFlow = netCashFromOperations.plus(netCashFromFinancing);
    const closingCashBalance = openingCash.plus(netCashFlow);

    return {
      tenantId,
      startDate,
      endDate,
      operatingActivities: {
        borrowerRepaymentInflows: borrowerRepayments.toNumber(),
        loanDisbursementOutflows: loanDisbursements.toNumber(),
        feeAndPenaltyCollections: feeCollections.toNumber(),
        partnerCommissionPayments: partnerCommissionPayments.toNumber(),
        operatingExpensePayments: operatingExpensePayments.toNumber(),
        netCashFromOperations: netCashFromOperations.toNumber(),
      },
      financingActivities: {
        capitalInflows: capitalInflows.toNumber(),
        debtBorrowings: debtBorrowings.toNumber(),
        debtRepayments: debtRepayments.toNumber(),
        netCashFromFinancing: netCashFromFinancing.toNumber(),
      },
      netCashFlow: netCashFlow.toNumber(),
      openingCashBalance: openingCash.toNumber(),
      closingCashBalance: closingCashBalance.toNumber(),
    };
  }
}

export const financialStatementsService = new FinancialStatementsService();
