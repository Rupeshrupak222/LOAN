import Decimal from 'decimal.js';
import { prisma } from '../config/prisma';
import { chartOfAccountsService } from '../modules/accounting/chart-of-accounts.service';
import { accountingPeriodService } from '../modules/accounting/accounting-period.service';
import { journalService } from '../modules/accounting/journal.service';
import { trialBalanceService } from '../modules/accounting/trial-balance.service';
import { financialStatementsService } from '../modules/accounting/financial-statements.service';
import { receivablesService } from '../modules/accounting/receivables.service';
import { payablesService } from '../modules/accounting/payables.service';
import { accrualService } from '../modules/accounting/accrual.service';
import { taxService } from '../modules/accounting/tax.service';
import { suspenseService } from '../modules/accounting/suspense.service';
import { accountingService } from '../modules/accounting/accounting.service';
import { generalLedgerService } from '../modules/finance/gl.service';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✅ ${message}`);
}

async function runTestSuite() {
  console.log('====================================================================');
  console.log('🧪 PHASE 12: ACCOUNTING & FINANCIAL OPERATIONS ENGINE TEST SUITE');
  console.log('====================================================================\n');

  let passedSuites = 0;
  const totalSuites = 12;

  // 1. Setup Mock Tenant & Branch
  const tenant = await prisma.tenant.create({
    data: {
      code: `TNT-ACC-${Date.now().toString().slice(-6)}`,
      name: 'Adyapan Test NBFC (Accounting)',
      contactEmail: `finance_${Date.now()}@adyapan.io`,
      status: 'ACTIVE',
      baseCurrency: 'INR',
    },
  });

  const branch = await prisma.branch.create({
    data: {
      code: `BR-ACC-${Date.now().toString().slice(-4)}`,
      name: 'Central Treasury Desk',
      tenantId: tenant.id,
      city: 'Mumbai',
      state: 'Maharashtra',
    },
  });

  // Create Users for Maker-Checker Segregation of Duties
  const makerUser = await prisma.user.create({
    data: {
      email: `maker_${Date.now()}@adyapan.io`,
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      firstName: 'Rahul',
      lastName: 'Maker (Accountant)',
      tenantId: tenant.id,
      branchId: branch.id,
      status: 'ACTIVE',
    },
  });

  const checkerUser = await prisma.user.create({
    data: {
      email: `checker_${Date.now()}@adyapan.io`,
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      firstName: 'Ananya',
      lastName: 'Checker (Controller)',
      tenantId: tenant.id,
      branchId: branch.id,
      status: 'ACTIVE',
    },
  });

  console.log(`Initialized Test Context with Tenant: ${tenant.code}, Maker: ${makerUser.firstName}, Checker: ${checkerUser.firstName}\n`);

  try {
    // =======================================================================
    // SUITE 1: Chart of Accounts Governance & System Protection
    // =======================================================================
    console.log('--- [SUITE 1/12] Chart of Accounts Governance & System Protection ---');
    {
      const coaList = chartOfAccountsService.listAccounts({ tenantId: tenant.id });
      assert(coaList.length >= 17, `Standard Chart of Accounts initialized with ${coaList.length} accounts`);

      // Verify key standard accounts
      const cashAcct = chartOfAccountsService.getAccount('1010');
      assert(cashAcct?.name === 'Disbursement & Settlement Bank Account', 'Account 1010 is Disbursement & Settlement Bank Account');
      assert(cashAcct?.isSystemAccount === true, 'Account 1010 is system account');

      const suspenseAcct = chartOfAccountsService.getAccount('1099');
      assert(suspenseAcct?.name.includes('Suspense Clearing') === true, 'Account 1099 is Suspense Clearing');
      assert(suspenseAcct?.isSystemAccount === true, 'Account 1099 is system account');

      // Create Custom Account
      const customAcct = chartOfAccountsService.createAccount({
        code: '5090',
        name: 'Cloud Infrastructure Hosting Expense',
        category: 'EXPENSE',
        subCategory: 'Operating & Admin Expense',
        normalBalance: 'DEBIT',
        parentCode: '5070',
        description: 'Server and cloud computing costs',
        tenantId: tenant.id,
        userId: makerUser.id,
      });
      assert(customAcct.code === '5090' && customAcct.isSystemAccount === false, 'Created custom expense account 5090');

      // Attempt to deactivate system-protected account -> must fail
      let protectedBlocked = false;
      try {
        chartOfAccountsService.updateAccount('1010', { isActive: false, userId: makerUser.id });
      } catch (err: any) {
        protectedBlocked = true;
        assert(err.message.includes('System-controlled account'), 'System protected account deactivation safely blocked');
      }
      assert(protectedBlocked, 'System protection barrier actively defended Account 1010');

      passedSuites++;
      console.log('✅ Suite 1 Passed!\n');
    }

    // =======================================================================
    // SUITE 2: Accounting Period Lifecycle & Pre-Flight Close Checklist
    // =======================================================================
    console.log('--- [SUITE 2/12] Accounting Period Lifecycle & Pre-Flight Close Checklist ---');
    let testPeriodId: string;
    {
      const period = accountingPeriodService.createPeriod({
        tenantId: tenant.id,
        name: 'September 2026 Monthly Fiscal Period',
        periodCode: '2026-09',
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-09-30T23:59:59.999Z',
        userId: makerUser.id,
      });
      testPeriodId = period.id;
      assert(period.status === 'OPEN', `Period ${period.name} created with status OPEN`);

      // Verify active period lookup
      const activePeriod = accountingPeriodService.getPeriod('2026-09', tenant.id);
      assert(activePeriod?.id === testPeriodId, 'Active period lookup for 2026-09 correctly matched test period');

      // Run close checklist
      const checklist = await accountingPeriodService.runCloseChecklist(testPeriodId, tenant.id);
      assert(checklist.length >= 5, `Close checklist computed with ${checklist.length} checks`);
      assert(checklist.every((c) => c.passed !== undefined), 'Checklist evaluates pass/fail status');

      // Soft Close Period
      const softClosed = accountingPeriodService.softClosePeriod(testPeriodId, checkerUser.id, tenant.id);
      assert(softClosed.status === 'SOFT_CLOSED', 'Period transitioned to SOFT_CLOSED');

      passedSuites++;
      console.log('✅ Suite 2 Passed!\n');
    }

    // =======================================================================
    // SUITE 3: Closed-Period Posting Restriction Guard
    // =======================================================================
    console.log('--- [SUITE 3/12] Closed-Period Posting Restriction Guard ---');
    {
      // Hard close period
      const closed = await accountingPeriodService.closePeriod(testPeriodId, checkerUser.id, tenant.id);
      assert(closed.status === 'CLOSED', 'Period transitioned to CLOSED');

      // Verify posting guard rejects postings
      let postingBlocked = false;
      try {
        accountingPeriodService.assertPeriodOpenForDate('2026-09-15T00:00:00.000Z', tenant.id);
      } catch (err: any) {
        postingBlocked = true;
        assert(err.message.includes('is CLOSED for transaction date'), 'assertPeriodOpenForDate threw error for closed period');
      }
      assert(postingBlocked, 'Posting guard successfully blocked transactions in CLOSED period');

      passedSuites++;
      console.log('✅ Suite 3 Passed!\n');
    }

    // =======================================================================
    // SUITE 4: Audited Period Reopening Governance
    // =======================================================================
    console.log('--- [SUITE 4/12] Audited Period Reopening Governance ---');
    {
      // Attempt reopening without reason -> must fail
      let reopenWithoutReasonBlocked = false;
      try {
        accountingPeriodService.reopenPeriod(testPeriodId, checkerUser.id, '', tenant.id);
      } catch (err: any) {
        reopenWithoutReasonBlocked = true;
        assert(err.message.includes('audit reason'), 'Reopening without mandatory audit reason was rejected');
      }
      assert(reopenWithoutReasonBlocked, 'Validation enforced mandatory audit justification for reopening');

      // Reopen with authorized reason
      const reopened = accountingPeriodService.reopenPeriod(
        testPeriodId,
        checkerUser.id,
        'Authorized late GST input tax adjustment by Statutory Auditor',
        tenant.id
      );
      assert(reopened.status === 'REOPENED', 'Period successfully transitioned to REOPENED with audit trail');

      // Verify postings are now permitted again
      accountingPeriodService.assertPeriodOpenForDate('2026-09-15T00:00:00.000Z', tenant.id);
      assert(true, 'Postings are permitted after audited period reopening');

      passedSuites++;
      console.log('✅ Suite 4 Passed!\n');
    }

    // =======================================================================
    // SUITE 5: Manual Journal Balancing & Double-Entry Invariant
    // =======================================================================
    console.log('--- [SUITE 5/12] Manual Journal Balancing & Double-Entry Invariant ---');
    let journalDraftId: string;
    {
      // Attempt unbalanced journal -> must fail
      let unbalancedBlocked = false;
      try {
        journalService.createJournal({
          tenantId: tenant.id,
          transactionDate: '2026-09-15T00:00:00.000Z',
          description: 'Unbalanced Journal Test',
          userId: makerUser.id,
          lines: [
            { accountCode: '1010', direction: 'DEBIT', amount: 50000, description: 'Debit 50k' },
            { accountCode: '4010', direction: 'CREDIT', amount: 40000, description: 'Credit 40k' },
          ],
        });
      } catch (err: any) {
        unbalancedBlocked = true;
        assert(err.message.includes('out of balance'), 'Unbalanced journal rejected with exact imbalance details');
      }
      assert(unbalancedBlocked, 'Double-entry invariant strictly enforced: Debits != Credits rejected');

      // Create balanced 3-line manual journal
      const balancedJournal = journalService.createJournal({
        tenantId: tenant.id,
        transactionDate: '2026-09-15T00:00:00.000Z',
        description: 'Monthly Office Cloud & Tech Infrastructure Allocation',
        userId: makerUser.id,
        lines: [
          { accountCode: '5090', direction: 'DEBIT', amount: 35000, description: 'AWS Hosting' },
          { accountCode: '5070', direction: 'DEBIT', amount: 15000, description: 'General Ops' },
          { accountCode: '1010', direction: 'CREDIT', amount: 50000, description: 'Bank transfer payment' },
        ],
      });
      journalDraftId = balancedJournal.id;
      assert(balancedJournal.status === 'DRAFT', `Balanced journal created with status DRAFT: ${balancedJournal.journalNumber}`);
      assert(balancedJournal.totalDebit === 50000 && balancedJournal.totalCredit === 50000, 'Debits strictly equal Credits (₹50,000)');

      // Submit for Checker Review
      const submitted = journalService.submitJournal(journalDraftId, makerUser.id);
      assert(submitted.status === 'SUBMITTED', 'Journal transitioned to SUBMITTED');

      passedSuites++;
      console.log('✅ Suite 5 Passed!\n');
    }

    // =======================================================================
    // SUITE 6: Maker-Checker Segregation of Duties (SoD)
    // =======================================================================
    console.log('--- [SUITE 6/12] Maker-Checker Segregation of Duties (SoD) ---');
    {
      // Maker attempts to approve their own journal -> must fail
      let selfApprovalBlocked = false;
      try {
        journalService.approveJournal(journalDraftId, makerUser.id);
      } catch (err: any) {
        selfApprovalBlocked = true;
        assert(err.message.includes('Segregation of Duties Violation'), 'Self-approval strictly rejected');
      }
      assert(selfApprovalBlocked, 'Maker-Checker Segregation of Duties enforced on Approval');

      // Maker attempts to post their own journal -> must fail
      let selfPostBlocked = false;
      try {
        await journalService.postJournal(journalDraftId, makerUser.id);
      } catch (err: any) {
        selfPostBlocked = true;
        assert(err.message.includes('Segregation of Duties Violation'), 'Self-posting strictly rejected');
      }
      assert(selfPostBlocked, 'Maker-Checker Segregation of Duties enforced on Posting');

      // Independent Checker approves
      const approved = journalService.approveJournal(journalDraftId, checkerUser.id);
      assert(approved.status === 'APPROVED', 'Independent Checker successfully approved journal');
      assert(approved.approvedByUserId === checkerUser.id, 'Checker User ID accurately stamped on approval');

      passedSuites++;
      console.log('✅ Suite 6 Passed!\n');
    }

    // =======================================================================
    // SUITE 7: Journal Posting to Phase 10 GL
    // =======================================================================
    console.log('--- [SUITE 7/12] Journal Posting to Phase 10 GL ---');
    let postedJournalId: string;
    {
      const posted = await journalService.postJournal(journalDraftId, checkerUser.id);
      postedJournalId = posted.id;
      assert(posted.status === 'POSTED', 'Journal posted successfully');
      assert(posted.glJournalId !== undefined, 'Posting linked to GL Journal ID');

      // Verify that GL entries exist in Phase 10 generalLedgerService
      const glJournals = generalLedgerService.listJournalEntries({
        tenantId: tenant.id,
        referenceType: 'MANUAL_JOURNAL',
      });
      assert(glJournals.length >= 1, `Phase 10 GL contains ${glJournals.length} posted entries for manual journal`);

      const matchingGL = glJournals.find((g) => g.id === posted.glJournalId || g.referenceId === posted.journalNumber);
      assert(matchingGL !== undefined, 'Matching GL entry found for posted manual journal');
      assert(matchingGL?.totalDebit === matchingGL?.totalCredit, `GL Debits (₹${matchingGL?.totalDebit}) === Credits (₹${matchingGL?.totalCredit})`);

      passedSuites++;
      console.log('✅ Suite 7 Passed!\n');
    }

    // =======================================================================
    // SUITE 8: Compensating Journal Reversal with Audited Traceability
    // =======================================================================
    console.log('--- [SUITE 8/12] Compensating Journal Reversal with Audited Traceability ---');
    {
      const reversalResult = await journalService.reverseJournal(
        postedJournalId,
        'Booking error: Expense allocated to wrong cost center, correcting allocation',
        checkerUser.id
      );
      assert(reversalResult.reversalJournal.status === 'POSTED', 'Compensating reversal journal automatically posted to GL');
      assert(
        reversalResult.originalJournal.reversalJournalId === reversalResult.reversalJournal.id,
        'Original journal links forward to reversal journal ID'
      );

      // Verify debits and credits were inverted
      const original = journalService.getJournal(postedJournalId);
      assert(original?.status === 'REVERSED', 'Original journal marked REVERSED');
      assert(
        reversalResult.reversalJournal.lines[0].accountCode === original?.lines[0].accountCode &&
          reversalResult.reversalJournal.lines[0].direction === (original?.lines[0].direction === 'DEBIT' ? 'CREDIT' : 'DEBIT'),
        'Reversal line direction cleanly inverted'
      );

      passedSuites++;
      console.log('✅ Suite 8 Passed!\n');
    }

    // =======================================================================
    // SUITE 9: Period-Aware Trial Balance & GL Ledger Drilldown
    // =======================================================================
    console.log('--- [SUITE 9/12] Period-Aware Trial Balance & GL Ledger Drilldown ---');
    {
      // Post a clean revenue journal first to have diverse GL movements
      const revJournal = journalService.createJournal({
        tenantId: tenant.id,
        transactionDate: '2026-09-18T00:00:00.000Z',
        description: 'Direct Loan Origination Fee Processing Income',
        userId: makerUser.id,
        lines: [
          { accountCode: '1010', direction: 'DEBIT', amount: 250000, description: 'Fees received in bank' },
          { accountCode: '4020', direction: 'CREDIT', amount: 250000, description: 'Origination fees earned' },
        ],
      });
      journalService.submitJournal(revJournal.id, makerUser.id);
      journalService.approveJournal(revJournal.id, checkerUser.id);
      await journalService.postJournal(revJournal.id, checkerUser.id);

      // Compute Trial Balance
      const tb = trialBalanceService.getPeriodTrialBalance({
        tenantId: tenant.id,
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-09-30T23:59:59.999Z',
      });
      assert(tb.isBalanced === true, 'Trial Balance isBalanced === true');
      assert(
        tb.totalClosingDebits === tb.totalClosingCredits,
        `Trial Balance Total Debits (₹${tb.totalClosingDebits}) === Credits (₹${tb.totalClosingCredits})`
      );
      assert(tb.accounts.length > 0, `Trial balance accounts populated (${tb.accounts.length} accounts)`);

      // GL Account Drilldown
      const drilldown = trialBalanceService.getAccountGeneralLedger({
        tenantId: tenant.id,
        accountCode: '1010',
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-09-30T23:59:59.999Z',
      });
      assert(drilldown.accountCode === '1010', 'Drilldown retrieved for Cash and Bank Balances');
      assert(drilldown.transactions.length >= 1, `Drilldown contains ${drilldown.transactions.length} transactions`);
      assert(drilldown.closingBalance !== undefined, `Drilldown running closing balance: ₹${drilldown.closingBalance}`);

      passedSuites++;
      console.log('✅ Suite 9 Passed!\n');
    }

    // =======================================================================
    // SUITE 10: Dynamic Financial Statements (P&L, Balance Sheet, Cash Flow)
    // =======================================================================
    console.log('--- [SUITE 10/12] Dynamic Financial Statements (P&L, Balance Sheet, Cash Flow) ---');
    {
      // 1. Profit & Loss Statement
      const pnl = financialStatementsService.getProfitAndLoss({
        tenantId: tenant.id,
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-09-30T23:59:59.999Z',
      });
      assert(pnl.operatingRevenue.totalRevenue >= 0, `P&L Total Revenue: ₹${pnl.operatingRevenue.totalRevenue}`);
      assert(pnl.operatingExpenses.totalExpenses >= 0, `P&L Total Expenses: ₹${pnl.operatingExpenses.totalExpenses}`);
      assert(
        pnl.netOperatingProfit === pnl.operatingRevenue.totalRevenue - pnl.operatingExpenses.totalExpenses,
        'Net Operating Profit === Total Revenue - Total Expenses'
      );

      // 2. Balance Sheet
      const bs = financialStatementsService.getBalanceSheet({
        tenantId: tenant.id,
        asOfDate: '2026-09-30T23:59:59.999Z',
      });
      assert(bs.isBalanced === true, 'Balance Sheet isBalanced === true');
      assert(
        bs.assets.totalAssets === bs.totalLiabilitiesAndEquity,
        `Double-Entry Invariant: Total Assets (₹${bs.assets.totalAssets}) === Total Liabilities + Equity (₹${bs.totalLiabilitiesAndEquity})`
      );

      // 3. Cash Flow Statement
      const cf = financialStatementsService.getCashFlowStatement({
        tenantId: tenant.id,
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-09-30T23:59:59.999Z',
      });
      assert(cf.operatingActivities !== undefined, 'Operating Cash Flows computed');
      assert(cf.financingActivities !== undefined, 'Financing Cash Flows computed');
      assert(
        cf.closingCashBalance === cf.openingCashBalance + cf.netCashFlow,
        `Cash Flow Reconciliation: Closing Cash (₹${cf.closingCashBalance}) === Opening (₹${cf.openingCashBalance}) + Net (₹${cf.netCashFlow})`
      );

      passedSuites++;
      console.log('✅ Suite 10 Passed!\n');
    }

    // =======================================================================
    // SUITE 11: Loan Portfolio Receivables & DPD Aging Matrix
    // =======================================================================
    console.log('--- [SUITE 11/12] Loan Portfolio Receivables & DPD Aging Matrix ---');
    {
      const rec = await receivablesService.getReceivablesSummary({
        tenantId: tenant.id,
        asOfDate: '2026-09-30T23:59:59.999Z',
      });
      assert(rec.totalReceivables >= 0, `Total Portfolio Receivables calculated: ₹${rec.totalReceivables}`);
      assert(rec.agingBuckets.length === 6, 'All 6 standard DPD aging tiers populated');

      const currentBucket = rec.agingBuckets.find((b) => b.bucket === 'CURRENT');
      assert(currentBucket !== undefined, 'Current 0 DPD bucket exists in matrix');

      passedSuites++;
      console.log('✅ Suite 11 Passed!\n');
    }

    // =======================================================================
    // SUITE 12: Payables, Accruals, GST Tax & Suspense Clearing Desk
    // =======================================================================
    console.log('--- [SUITE 12/12] Payables, Accruals, GST Tax & Suspense Clearing Desk ---');
    {
      // 1. Accounts Payable Workflow
      const payable = payablesService.createPayable({
        tenantId: tenant.id,
        vendorOrPartnerName: 'AWS Cloud Services India Pvt Ltd',
        payableType: 'OPERATIONAL_EXPENSE',
        invoiceNumber: `INV-AWS-${Date.now().toString().slice(-4)}`,
        dueDate: '2026-09-25T00:00:00.000Z',
        amount: 59000,
        description: 'Production infrastructure monthly cloud usage invoice',
        userId: makerUser.id,
        autoSubmit: true,
      });
      assert(payable.status === 'SUBMITTED', `Payable ${payable.id} submitted`);

      const approvedPayable = await payablesService.approvePayable(payable.id, checkerUser.id);
      assert(approvedPayable.status === 'APPROVED', 'Payable approved by checker');

      const paidPayable = await payablesService.recordPayment(payable.id, {
        payoutUtr: 'UTR-HDFC-98234710',
        userId: checkerUser.id,
        accountPaidFromCode: '1010',
      });
      assert(paidPayable.status === 'PAID', 'Payable payout settled and recorded against bank account 1010');

      // 2. Accrual Run & Reversal
      const accrual = accrualService.createAccrual({
        tenantId: tenant.id,
        accrualType: 'INTEREST_ACCRUAL',
        amount: 145000,
        description: 'Month-end loan portfolio interest accrual recognition',
        userId: makerUser.id,
      });
      assert(accrual.status === 'DRAFT', `Accrual ${accrual.id} created as DRAFT`);

      const postedAccrual = await accrualService.approveAndPostAccrual(accrual.id, checkerUser.id);
      assert(postedAccrual.status === 'POSTED', 'Accrual approved and posted to GL');

      const reversedAccrual = await accrualService.reverseAccrual(
        accrual.id,
        checkerUser.id,
        'Automated Day-1 reversal of month-end interest accrual',
        tenant.id
      );
      assert(reversedAccrual.status === 'REVERSED', 'Accrual successfully reversed for new fiscal period');

      // 3. GST Tax Accounting Entry & Summary
      const taxCalc = taxService.calculateGst(100000, false, 18);
      assert(taxCalc.totalTaxAmount === 18000, `Output GST 18% calculated: ₹${taxCalc.totalTaxAmount} (CGST ₹9k + SGST ₹9k)`);

      const taxEntry = await taxService.recordOutputGst({
        tenantId: tenant.id,
        referenceType: 'LOAN_PROCESSING_FEE',
        referenceId: `FEE-${Date.now().toString().slice(-4)}`,
        taxableAmount: 100000,
        taxRatePct: 18,
        isInterstate: false,
        transactionDate: '2026-09-20T00:00:00.000Z',
      });
      assert(taxEntry.totalTaxAmount === 18000, `Tax entry recorded with total tax: ₹${taxEntry.totalTaxAmount}`);

      const gstr = taxService.getTaxPeriodSummary({
        tenantId: tenant.id,
        taxPeriod: '2026-09',
      });
      assert(gstr.outputGstCollected.total >= 18000, `GSTR summary output GST: ₹${gstr.outputGstCollected.total}`);

      // 4. Suspense Clearing Desk (Account 1099)
      const suspenseEntry = await suspenseService.createSuspenseEntry({
        tenantId: tenant.id,
        reference: `NEFT-UNIDENTIFIED-${Date.now().toString().slice(-4)}`,
        amount: 75000,
        direction: 'CREDIT',
        reason: 'Unidentified NEFT deposit from customer without reference loan number',
        postGl: true,
      });
      assert(suspenseEntry.status === 'OPEN', `Suspense entry ${suspenseEntry.id} logged in Account 1099`);

      const resolvedSuspense = await suspenseService.resolveSuspenseEntry(suspenseEntry.id, {
        targetAccountCode: '1020', // Reallocate to Loans and Advances Asset
        resolutionNotes: 'Identified borrower customer Vikram Sharma for Loan EMI installment settlement',
        userId: checkerUser.id,
      });
      assert(resolvedSuspense.status === 'RESOLVED', 'Suspense entry resolved and balanced journal generated');

      // 5. Finance Control Center Aggregator Dashboard
      const dashboard = await accountingService.getDashboardSummary(tenant.id);
      assert(dashboard.accountingHealth.unbalancedJournalsCount === 0, 'Dashboard reports 0 unbalanced journals');
      assert(dashboard.portfolioFinance.totalPrincipalOutstanding >= 0, 'Dashboard includes portfolio principal');

      passedSuites++;
      console.log('✅ Suite 12 Passed!\n');
    }

    console.log('====================================================================');
    console.log(`🎉 ALL ${passedSuites}/${totalSuites} PHASE 12 TEST SUITES PASSED PERFECTLY!`);
    console.log('====================================================================');
  } catch (error) {
    console.error('❌ Phase 12 Test Suite Failed:', error);
    process.exit(1);
  } finally {
    // Cleanup mock data
    try {
      await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.branch.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.tenant.deleteMany({ where: { id: tenant.id } });
    } catch (cleanupErr) {
      // ignore
    }
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});
