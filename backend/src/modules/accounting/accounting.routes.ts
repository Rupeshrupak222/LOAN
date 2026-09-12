import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ok, created } from '../../common/response';
import { authenticate } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { requirePermission } from '../../middleware/rbac-permission';
import { chartOfAccountsService } from './chart-of-accounts.service';
import { accountingPeriodService } from './accounting-period.service';
import { journalService } from './journal.service';
import { trialBalanceService } from './trial-balance.service';
import { financialStatementsService } from './financial-statements.service';
import { receivablesService } from './receivables.service';
import { payablesService } from './payables.service';
import { accrualService } from './accrual.service';
import { taxService } from './tax.service';
import { suspenseService } from './suspense.service';
import { accountingService } from './accounting.service';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

// ===========================================================================
// 1. Finance & Accounting Control Dashboard
// ===========================================================================

router.get(
  '/dashboard',
  requirePermission('FINANCE_CONTROLS_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const summary = await accountingService.getDashboardSummary(tenantId);
    return ok(res, summary);
  })
);

// ===========================================================================
// 2. Chart of Accounts (COA)
// ===========================================================================

router.get(
  '/coa',
  requirePermission('COA_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const category = req.query.category as any;
    const subCategory = req.query.subCategory as any;
    const activeOnly = req.query.activeOnly === 'true';

    const accounts = chartOfAccountsService.listAccounts({
      tenantId,
      category,
      subCategory,
      activeOnly,
    });
    return ok(res, accounts);
  })
);

router.get(
  '/coa/:code',
  requirePermission('COA_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const account = chartOfAccountsService.getAccount(req.params.code);
    return ok(res, account);
  })
);

router.post(
  '/coa',
  requirePermission('COA_CREATE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const item = chartOfAccountsService.createAccount({
      ...req.body,
      tenantId,
      userId: req.user?.id,
    });
    return created(res, item);
  })
);

router.patch(
  '/coa/:code',
  requirePermission('COA_EDIT'),
  asyncHandler(async (req: Request, res: Response) => {
    const updated = chartOfAccountsService.updateAccount(req.params.code, {
      ...req.body,
      userId: req.user?.id,
    });
    return ok(res, updated);
  })
);

router.delete(
  '/coa/:code',
  requirePermission('COA_ARCHIVE'),
  asyncHandler(async (req: Request, res: Response) => {
    chartOfAccountsService.deleteAccount(req.params.code, req.user?.id);
    return ok(res, { deleted: true, code: req.params.code });
  })
);

// ===========================================================================
// 3. Accounting Periods
// ===========================================================================

router.get(
  '/periods',
  requirePermission('PERIOD_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const periods = accountingPeriodService.listPeriods(tenantId);
    return ok(res, periods);
  })
);

router.get(
  '/periods/:id',
  requirePermission('PERIOD_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const period = accountingPeriodService.getPeriod(req.params.id, tenantId);
    return ok(res, period);
  })
);

router.post(
  '/periods',
  requirePermission('PERIOD_OPEN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const item = accountingPeriodService.createPeriod({
      ...req.body,
      tenantId,
      userId: req.user?.id,
    });
    return created(res, item);
  })
);

router.post(
  '/periods/:id/checklist',
  requirePermission('PERIOD_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const checklist = await accountingPeriodService.runCloseChecklist(req.params.id, tenantId);
    return ok(res, checklist);
  })
);

router.post(
  '/periods/:id/soft-close',
  requirePermission('PERIOD_SOFT_CLOSE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const closed = accountingPeriodService.softClosePeriod(
      req.params.id,
      req.user?.id || 'SYSTEM',
      tenantId
    );
    return ok(res, closed);
  })
);

router.post(
  '/periods/:id/close',
  requirePermission('PERIOD_CLOSE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const closed = await accountingPeriodService.closePeriod(
      req.params.id,
      req.user?.id || 'SYSTEM',
      tenantId
    );
    return ok(res, closed);
  })
);

router.post(
  '/periods/:id/reopen',
  requirePermission('PERIOD_REOPEN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const reopened = accountingPeriodService.reopenPeriod(
      req.params.id,
      req.user?.id || 'SYSTEM',
      req.body.reason,
      tenantId
    );
    return ok(res, reopened);
  })
);

// ===========================================================================
// 4. Manual Journals & Maker-Checker
// ===========================================================================

router.get(
  '/journals',
  requirePermission('JOURNAL_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const status = req.query.status as any;
    const periodCode = req.query.periodCode as string;
    const source = req.query.source as any;

    const journals = journalService.listJournals({
      tenantId,
      status,
      periodCode,
      source,
    });
    return ok(res, journals);
  })
);

router.get(
  '/journals/:id',
  requirePermission('JOURNAL_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const journal = journalService.getJournal(req.params.id);
    return ok(res, journal);
  })
);

router.post(
  '/journals',
  requirePermission('JOURNAL_CREATE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const journal = journalService.createJournal({
      ...req.body,
      tenantId,
      branchId: req.user?.branchId,
      userId: req.user?.id || 'SYSTEM_MAKER',
      userName: req.user?.email,
      submitImmediately: req.body.submitImmediately,
    });
    return created(res, journal);
  })
);

router.post(
  '/journals/:id/submit',
  requirePermission('JOURNAL_SUBMIT'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const journal = journalService.submitJournal(
      req.params.id,
      req.user?.id || 'SYSTEM',
      tenantId
    );
    return ok(res, journal);
  })
);

router.post(
  '/journals/:id/approve',
  requirePermission('JOURNAL_APPROVE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const journal = journalService.approveJournal(
      req.params.id,
      req.user?.id || 'SYSTEM_CHECKER',
      req.user?.email,
      tenantId
    );
    return ok(res, journal);
  })
);

router.post(
  '/journals/:id/post',
  requirePermission('JOURNAL_POST'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const journal = await journalService.postJournal(
      req.params.id,
      req.user?.id || 'SYSTEM_CHECKER',
      tenantId
    );
    return ok(res, journal);
  })
);

router.post(
  '/journals/:id/reject',
  requirePermission('JOURNAL_REJECT'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const journal = journalService.rejectJournal(
      req.params.id,
      req.user?.id || 'SYSTEM_CHECKER',
      req.body.reason,
      tenantId
    );
    return ok(res, journal);
  })
);

router.post(
  '/journals/:id/reverse',
  requirePermission('JOURNAL_REVERSE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const result = await journalService.reverseJournal(
      req.params.id,
      req.user?.id || 'SYSTEM_CHECKER',
      req.body.reason,
      tenantId
    );
    return ok(res, result);
  })
);

// ===========================================================================
// 5. Live Financial Reports (Trial Balance, P&L, Balance Sheet, Cash Flow, GL)
// ===========================================================================

router.get(
  '/reports/trial-balance',
  requirePermission('TRIAL_BALANCE_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const periodCode = req.query.periodCode as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const report = trialBalanceService.getPeriodTrialBalance({
      tenantId,
      periodCode,
      startDate,
      endDate,
    });
    return ok(res, report);
  })
);

router.get(
  '/reports/general-ledger/:accountCode',
  requirePermission('TRIAL_BALANCE_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const report = trialBalanceService.getAccountGeneralLedger({
      accountCode: req.params.accountCode,
      tenantId,
      startDate,
      endDate,
    });
    return ok(res, report);
  })
);

router.get(
  '/reports/profit-and-loss',
  requirePermission('FINANCIAL_STATEMENTS_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const periodCode = req.query.periodCode as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const report = financialStatementsService.getProfitAndLoss({
      tenantId,
      periodCode,
      startDate,
      endDate,
    });
    return ok(res, report);
  })
);

router.get(
  '/reports/balance-sheet',
  requirePermission('FINANCIAL_STATEMENTS_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const asOfDate = req.query.asOfDate as string;

    const report = financialStatementsService.getBalanceSheet({
      tenantId,
      asOfDate,
    });
    return ok(res, report);
  })
);

router.get(
  '/reports/cash-flow',
  requirePermission('CASH_FLOW_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const report = financialStatementsService.getCashFlowStatement({
      tenantId,
      startDate,
      endDate,
    });
    return ok(res, report);
  })
);

// ===========================================================================
// 6. Receivables & Payables
// ===========================================================================

router.get(
  '/receivables/summary',
  requirePermission('RECEIVABLES_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const asOfDate = req.query.asOfDate as string;

    const summary = await receivablesService.getReceivablesSummary({
      tenantId,
      asOfDate,
    });
    return ok(res, summary);
  })
);

router.get(
  '/payables',
  requirePermission('PAYABLES_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const status = req.query.status as any;
    const payableType = req.query.payableType as any;

    const payables = payablesService.listPayables({
      tenantId,
      status,
      payableType,
    });
    return ok(res, payables);
  })
);

router.get(
  '/payables/:id',
  requirePermission('PAYABLES_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const payable = payablesService.getPayable(req.params.id);
    return ok(res, payable);
  })
);

router.post(
  '/payables',
  requirePermission('PAYABLES_CREATE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const payable = payablesService.createPayable({
      ...req.body,
      tenantId,
      userId: req.user?.id || 'SYSTEM_MAKER',
    });
    return created(res, payable);
  })
);

router.post(
  '/payables/:id/approve',
  requirePermission('PAYABLES_APPROVE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const approved = await payablesService.approvePayable(
      req.params.id,
      req.user?.id || 'SYSTEM_CHECKER',
      tenantId
    );
    return ok(res, approved);
  })
);

router.post(
  '/payables/:id/record-payment',
  requirePermission('PAYABLES_PAY'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const paid = await payablesService.recordPayment(req.params.id, {
      ...req.body,
      userId: req.user?.id || 'SYSTEM',
      tenantId,
    });
    return ok(res, paid);
  })
);

// ===========================================================================
// 7. Accruals
// ===========================================================================

router.get(
  '/accruals',
  requirePermission('ACCRUAL_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const status = req.query.status as any;
    const accrualType = req.query.accrualType as any;

    const accruals = accrualService.listAccruals({
      tenantId,
      status,
      accrualType,
    });
    return ok(res, accruals);
  })
);

router.post(
  '/accruals',
  requirePermission('ACCRUAL_CREATE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const item = accrualService.createAccrual({
      ...req.body,
      tenantId,
      userId: req.user?.id || 'SYSTEM_MAKER',
    });
    return created(res, item);
  })
);

router.post(
  '/accruals/:id/approve-and-post',
  requirePermission('ACCRUAL_APPROVE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const posted = await accrualService.approveAndPostAccrual(
      req.params.id,
      req.user?.id || 'SYSTEM_CHECKER',
      tenantId
    );
    return ok(res, posted);
  })
);

router.post(
  '/accruals/:id/reverse',
  requirePermission('ACCRUAL_REVERSE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const reversed = await accrualService.reverseAccrual(
      req.params.id,
      req.user?.id || 'SYSTEM_CHECKER',
      req.body.reason,
      tenantId
    );
    return ok(res, reversed);
  })
);

// ===========================================================================
// 8. Tax Accounting & GST
// ===========================================================================

router.get(
  '/tax/entries',
  requirePermission('TAX_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const taxPeriod = req.query.taxPeriod as string;
    const taxType = req.query.taxType as any;

    const entries = taxService.listTaxEntries({
      tenantId,
      taxPeriod,
      taxType,
    });
    return ok(res, entries);
  })
);

router.get(
  '/tax/period-summary',
  requirePermission('TAX_REPORT'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const taxPeriod = (req.query.taxPeriod as string) || new Date().toISOString().slice(0, 7);

    const summary = taxService.getTaxPeriodSummary({
      tenantId,
      taxPeriod,
    });
    return ok(res, summary);
  })
);

router.post(
  '/tax/output',
  requirePermission('TAX_MANAGE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const entry = await taxService.recordOutputGst({
      ...req.body,
      tenantId,
      userId: req.user?.id,
    });
    return created(res, entry);
  })
);

router.post(
  '/tax/input',
  requirePermission('TAX_MANAGE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const entry = await taxService.recordInputGst({
      ...req.body,
      tenantId,
      userId: req.user?.id,
    });
    return created(res, entry);
  })
);

// ===========================================================================
// 9. Suspense Clearing
// ===========================================================================

router.get(
  '/suspense',
  requirePermission('SUSPENSE_MANAGE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const status = req.query.status as any;

    const entries = suspenseService.listSuspenseEntries({
      tenantId,
      status,
    });
    return ok(res, entries);
  })
);

router.post(
  '/suspense',
  requirePermission('SUSPENSE_MANAGE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const entry = await suspenseService.createSuspenseEntry({
      ...req.body,
      tenantId,
      userId: req.user?.id,
    });
    return created(res, entry);
  })
);

router.post(
  '/suspense/:id/resolve',
  requirePermission('SUSPENSE_MANAGE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    const resolved = await suspenseService.resolveSuspenseEntry(req.params.id, {
      ...req.body,
      userId: req.user?.id || 'SYSTEM',
      tenantId,
    });
    return ok(res, resolved);
  })
);

export default router;
