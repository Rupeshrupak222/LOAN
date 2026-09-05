import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../../config/prisma';
import { logger } from '../../config/logger';

export interface TableStats {
  tableName: string;
  rowCount: number;
  status: 'AVAILABLE' | 'EMPTY' | 'ERROR';
}

export interface AnomalyReport {
  category: 'REFERENTIAL_INTEGRITY' | 'ORPHAN_RECORD' | 'DUPLICATE_IDENTIFIER' | 'FINANCIAL_INVARIANT' | 'LIFECYCLE_STATE' | 'SECURITY';
  entity: string;
  classification: 'Valid' | 'Suspicious' | 'Orphaned' | 'Requires human review';
  description: string;
  affectedCount: number;
  sampleIds?: string[];
}

export interface FinancialIntegritySummary {
  totalLoansAudited: number;
  totalPrincipalDisbursed: string;
  totalOutstandingPrincipal: string;
  totalPaymentsAudited: number;
  totalAllocationsAudited: number;
  discrepanciesCount: number;
}

export interface DatabaseAuditResult {
  timestamp: string;
  environment: string;
  readOnly: boolean;
  databaseEngine: string;
  connectionStatus: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  tableStats: TableStats[];
  anomalies: AnomalyReport[];
  financialSummary: FinancialIntegritySummary;
  checksSummary: {
    referentialIntegrity: 'PASS' | 'WARN' | 'FAIL';
    orphanDetection: 'PASS' | 'WARN' | 'FAIL';
    duplicateIdentifiers: 'PASS' | 'WARN' | 'FAIL';
    financialConsistency: 'PASS' | 'WARN' | 'FAIL';
    stateConsistency: 'PASS' | 'WARN' | 'FAIL';
    requiredRelationships: 'PASS' | 'WARN' | 'FAIL';
    securityProtections: 'PASS' | 'WARN' | 'FAIL';
  };
  verdict: 'PRODUCTION DATABASE READY' | 'PRODUCTION DATABASE READY WITH WARNINGS' | 'NOT READY';
}

export class DataReadinessService {
  private db: PrismaClient;

  constructor(customPrisma?: PrismaClient) {
    this.db = customPrisma || defaultPrisma;
  }

  /**
   * Safe, READ-ONLY comprehensive production database readiness audit.
   * Performs zero mutations, zero writes, and zero destructive operations.
   */
  public async runProductionDatabaseAudit(): Promise<DatabaseAuditResult> {
    const timestamp = new Date().toISOString();
    const environment = process.env.NODE_ENV || 'development';
    const anomalies: AnomalyReport[] = [];
    const tableStats: TableStats[] = [];

    // 1. Connection & Ping Verification
    let connectionStatus: 'HEALTHY' | 'DEGRADED' | 'FAILED' = 'HEALTHY';
    try {
      await this.db.$queryRaw`SELECT 1`;
    } catch (err: any) {
      connectionStatus = 'FAILED';
      logger.error({ err: err.message }, 'Database connection ping failed during readiness audit');
      return {
        timestamp,
        environment,
        readOnly: true,
        databaseEngine: 'PostgreSQL (Prisma ORM)',
        connectionStatus,
        tableStats: [],
        anomalies: [
          {
            category: 'REFERENTIAL_INTEGRITY',
            entity: 'DatabaseConnection',
            classification: 'Requires human review',
            description: `Database connection probe failed: ${err.message}`,
            affectedCount: 1,
          },
        ],
        financialSummary: {
          totalLoansAudited: 0,
          totalPrincipalDisbursed: '0.00',
          totalOutstandingPrincipal: '0.00',
          totalPaymentsAudited: 0,
          totalAllocationsAudited: 0,
          discrepanciesCount: 1,
        },
        checksSummary: {
          referentialIntegrity: 'FAIL',
          orphanDetection: 'FAIL',
          duplicateIdentifiers: 'FAIL',
          financialConsistency: 'FAIL',
          stateConsistency: 'FAIL',
          requiredRelationships: 'FAIL',
          securityProtections: 'FAIL',
        },
        verdict: 'NOT READY',
      };
    }

    // 2. Table Row Count Audits (All 26 Models)
    const tables: Array<{ name: string; countFn: () => Promise<number> }> = [
      { name: 'User', countFn: () => this.db.user.count() },
      { name: 'Role', countFn: () => this.db.role.count() },
      { name: 'Permission', countFn: () => this.db.permission.count() },
      { name: 'UserRole', countFn: () => this.db.userRole.count() },
      { name: 'RolePermission', countFn: () => this.db.rolePermission.count() },
      { name: 'RefreshToken', countFn: () => this.db.refreshToken.count() },
      { name: 'Branch', countFn: () => this.db.branch.count() },
      { name: 'Customer', countFn: () => this.db.customer.count() },
      { name: 'CustomerAddress', countFn: () => this.db.customerAddress.count() },
      { name: 'CustomerEmployment', countFn: () => this.db.customerEmployment.count() },
      { name: 'CustomerBankAccount', countFn: () => this.db.customerBankAccount.count() },
      { name: 'LoanProduct', countFn: () => this.db.loanProduct.count() },
      { name: 'LoanApplication', countFn: () => this.db.loanApplication.count() },
      { name: 'ApplicationStatusHistory', countFn: () => this.db.applicationStatusHistory.count() },
      { name: 'EligibilityAssessment', countFn: () => this.db.eligibilityAssessment.count() },
      { name: 'RiskAssessment', countFn: () => this.db.riskAssessment.count() },
      { name: 'UnderwritingDecision', countFn: () => this.db.underwritingDecision.count() },
      { name: 'ApprovalRequest', countFn: () => this.db.approvalRequest.count() },
      { name: 'Loan', countFn: () => this.db.loan.count() },
      { name: 'RepaymentScheduleItem', countFn: () => this.db.repaymentScheduleItem.count() },
      { name: 'Disbursement', countFn: () => this.db.disbursement.count() },
      { name: 'Payment', countFn: () => this.db.payment.count() },
      { name: 'PaymentAllocation', countFn: () => this.db.paymentAllocation.count() },
      { name: 'PaymentSubmission', countFn: () => this.db.paymentSubmission.count() },
      { name: 'Transaction', countFn: () => this.db.transaction.count() },
      { name: 'CollectionCase', countFn: () => this.db.collectionCase.count() },
      { name: 'CollectionActivity', countFn: () => this.db.collectionActivity.count() },
      { name: 'PromiseToPay', countFn: () => this.db.promiseToPay.count() },
      { name: 'LoanRestructure', countFn: () => this.db.loanRestructure.count() },
      { name: 'Settlement', countFn: () => this.db.settlement.count() },
      { name: 'LoanClosure', countFn: () => this.db.loanClosure.count() },
      { name: 'Document', countFn: () => this.db.document.count() },
      { name: 'Notification', countFn: () => this.db.notification.count() },
      { name: 'NotificationTemplate', countFn: () => this.db.notificationTemplate.count() },
      { name: 'AuditLog', countFn: () => this.db.auditLog.count() },
      { name: 'SystemSetting', countFn: () => this.db.systemSetting.count() },
    ];

    for (const tbl of tables) {
      try {
        const count = await tbl.countFn();
        tableStats.push({
          tableName: tbl.name,
          rowCount: count,
          status: count > 0 ? 'AVAILABLE' : 'EMPTY',
        });
      } catch (e: any) {
        tableStats.push({
          tableName: tbl.name,
          rowCount: -1,
          status: 'ERROR',
        });
        anomalies.push({
          category: 'REFERENTIAL_INTEGRITY',
          entity: tbl.name,
          classification: 'Requires human review',
          description: `Failed to query table ${tbl.name}: ${e.message}`,
          affectedCount: 1,
        });
      }
    }

    // 3. Referential Integrity & Orphan Record Audits
    // A. Payments without valid loans or customers
    try {
      const allPayments = await this.db.payment.findMany({
        select: { id: true, paymentNo: true, loanId: true, customerId: true },
      });
      const allLoanIds = new Set((await this.db.loan.findMany({ select: { id: true } })).map((l) => l.id));
      const allCustomerIds = new Set((await this.db.customer.findMany({ select: { id: true } })).map((c) => c.id));

      const orphanedPayments = allPayments.filter((p) => !allLoanIds.has(p.loanId) || !allCustomerIds.has(p.customerId));
      if (orphanedPayments.length > 0) {
        anomalies.push({
          category: 'ORPHAN_RECORD',
          entity: 'Payment',
          classification: 'Orphaned',
          description: 'Payments found referencing non-existent Loan or Customer records.',
          affectedCount: orphanedPayments.length,
          sampleIds: orphanedPayments.slice(0, 5).map((p) => p.paymentNo),
        });
      }

      // B. RepaymentScheduleItems without valid loans
      const scheduleItems = await this.db.repaymentScheduleItem.findMany({
        select: { id: true, loanId: true },
      });
      const orphanedSchedules = scheduleItems.filter((s) => !allLoanIds.has(s.loanId));
      if (orphanedSchedules.length > 0) {
        anomalies.push({
          category: 'ORPHAN_RECORD',
          entity: 'RepaymentScheduleItem',
          classification: 'Orphaned',
          description: 'RepaymentScheduleItems found referencing non-existent Loan records.',
          affectedCount: orphanedSchedules.length,
          sampleIds: orphanedSchedules.slice(0, 5).map((s) => s.id),
        });
      }

      // C. Disbursements without valid loans
      const disbursements = await this.db.disbursement.findMany({
        select: { id: true, loanId: true },
      });
      const orphanedDisbursements = disbursements.filter((d) => !allLoanIds.has(d.loanId));
      if (orphanedDisbursements.length > 0) {
        anomalies.push({
          category: 'ORPHAN_RECORD',
          entity: 'Disbursement',
          classification: 'Orphaned',
          description: 'Disbursements found referencing non-existent Loan records.',
          affectedCount: orphanedDisbursements.length,
          sampleIds: orphanedDisbursements.slice(0, 5).map((d) => d.id),
        });
      }

      // D. PaymentAllocations without valid payments
      const paymentIds = new Set(allPayments.map((p) => p.id));
      const allocations = await this.db.paymentAllocation.findMany({
        select: { id: true, paymentId: true },
      });
      const orphanedAllocations = allocations.filter((a) => !paymentIds.has(a.paymentId));
      if (orphanedAllocations.length > 0) {
        anomalies.push({
          category: 'ORPHAN_RECORD',
          entity: 'PaymentAllocation',
          classification: 'Orphaned',
          description: 'PaymentAllocations found referencing non-existent Payment records.',
          affectedCount: orphanedAllocations.length,
          sampleIds: orphanedAllocations.slice(0, 5).map((a) => a.id),
        });
      }

      // E. Customer Bank Accounts without valid customers
      const bankAccounts = await this.db.customerBankAccount.findMany({
        select: { id: true, customerId: true },
      });
      const orphanedBankAccounts = bankAccounts.filter((b) => !allCustomerIds.has(b.customerId));
      if (orphanedBankAccounts.length > 0) {
        anomalies.push({
          category: 'ORPHAN_RECORD',
          entity: 'CustomerBankAccount',
          classification: 'Orphaned',
          description: 'CustomerBankAccounts found referencing non-existent Customer records.',
          affectedCount: orphanedBankAccounts.length,
          sampleIds: orphanedBankAccounts.slice(0, 5).map((b) => b.id),
        });
      }

      // F. Loan Closures without valid loans
      const closures = await this.db.loanClosure.findMany({
        select: { id: true, loanId: true, nocNumber: true },
      });
      const orphanedClosures = closures.filter((c) => !allLoanIds.has(c.loanId));
      if (orphanedClosures.length > 0) {
        anomalies.push({
          category: 'ORPHAN_RECORD',
          entity: 'LoanClosure',
          classification: 'Orphaned',
          description: 'LoanClosure records found referencing non-existent Loan records.',
          affectedCount: orphanedClosures.length,
          sampleIds: orphanedClosures.slice(0, 5).map((c) => c.nocNumber),
        });
      }
    } catch (e: any) {
      anomalies.push({
        category: 'REFERENTIAL_INTEGRITY',
        entity: 'ReferentialCheck',
        classification: 'Requires human review',
        description: `Referential audit execution encountered error: ${e.message}`,
        affectedCount: 1,
      });
    }

    // 4. Unique Constraint & Duplicate Identifier Audits
    try {
      // Check duplicate emails
      const users = await this.db.user.findMany({ select: { email: true } });
      const emailCounts = new Map<string, number>();
      for (const u of users) {
        const emailLower = u.email.trim().toLowerCase();
        emailCounts.set(emailLower, (emailCounts.get(emailLower) || 0) + 1);
      }
      const duplicateEmails = Array.from(emailCounts.entries()).filter(([_, cnt]) => cnt > 1);
      if (duplicateEmails.length > 0) {
        anomalies.push({
          category: 'DUPLICATE_IDENTIFIER',
          entity: 'User.email',
          classification: 'Suspicious',
          description: 'Duplicate email addresses found across user records.',
          affectedCount: duplicateEmails.length,
          sampleIds: duplicateEmails.slice(0, 5).map(([email]) => email),
        });
      }

      // Check duplicate customer codes
      const customers = await this.db.customer.findMany({ select: { customerCode: true } });
      const custCodeCounts = new Map<string, number>();
      for (const c of customers) {
        const code = c.customerCode.trim();
        custCodeCounts.set(code, (custCodeCounts.get(code) || 0) + 1);
      }
      const duplicateCustCodes = Array.from(custCodeCounts.entries()).filter(([_, cnt]) => cnt > 1);
      if (duplicateCustCodes.length > 0) {
        anomalies.push({
          category: 'DUPLICATE_IDENTIFIER',
          entity: 'Customer.customerCode',
          classification: 'Suspicious',
          description: 'Duplicate customer codes found in database.',
          affectedCount: duplicateCustCodes.length,
          sampleIds: duplicateCustCodes.slice(0, 5).map(([code]) => code),
        });
      }

      // Check duplicate loan numbers
      const loans = await this.db.loan.findMany({ select: { loanNo: true } });
      const loanNoCounts = new Map<string, number>();
      for (const l of loans) {
        const no = l.loanNo.trim();
        loanNoCounts.set(no, (loanNoCounts.get(no) || 0) + 1);
      }
      const duplicateLoanNos = Array.from(loanNoCounts.entries()).filter(([_, cnt]) => cnt > 1);
      if (duplicateLoanNos.length > 0) {
        anomalies.push({
          category: 'DUPLICATE_IDENTIFIER',
          entity: 'Loan.loanNo',
          classification: 'Suspicious',
          description: 'Duplicate loan numbers found in database.',
          affectedCount: duplicateLoanNos.length,
          sampleIds: duplicateLoanNos.slice(0, 5).map(([no]) => no),
        });
      }

      // Check duplicate payment numbers
      const payments = await this.db.payment.findMany({ select: { paymentNo: true } });
      const payNoCounts = new Map<string, number>();
      for (const p of payments) {
        const no = p.paymentNo.trim();
        payNoCounts.set(no, (payNoCounts.get(no) || 0) + 1);
      }
      const duplicatePayNos = Array.from(payNoCounts.entries()).filter(([_, cnt]) => cnt > 1);
      if (duplicatePayNos.length > 0) {
        anomalies.push({
          category: 'DUPLICATE_IDENTIFIER',
          entity: 'Payment.paymentNo',
          classification: 'Suspicious',
          description: 'Duplicate payment numbers found in database.',
          affectedCount: duplicatePayNos.length,
          sampleIds: duplicatePayNos.slice(0, 5).map(([no]) => no),
        });
      }
    } catch (e: any) {
      anomalies.push({
        category: 'DUPLICATE_IDENTIFIER',
        entity: 'UniquenessCheck',
        classification: 'Requires human review',
        description: `Uniqueness audit encountered error: ${e.message}`,
        affectedCount: 1,
      });
    }

    // 5. Financial Data Integrity & Invariants
    let totalLoansAudited = 0;
    let totalPrincipalDisbursedNum = 0;
    let totalOutstandingPrincipalNum = 0;
    let totalPaymentsAudited = 0;
    let totalAllocationsAudited = 0;
    let discrepanciesCount = 0;

    try {
      const allLoans = await this.db.loan.findMany({
        include: {
          schedule: true,
          payments: {
            where: { status: 'SUCCESS' },
            include: { allocations: true },
          },
          closure: true,
        },
      });

      totalLoansAudited = allLoans.length;

      for (const loan of allLoans) {
        const principal = Number(loan.principal);
        const outstandingP = Number(loan.outstandingPrincipal);
        const outstandingI = Number(loan.outstandingInterest);
        const outstandingF = Number(loan.outstandingFees);

        totalPrincipalDisbursedNum += principal;
        totalOutstandingPrincipalNum += outstandingP;

        // A. Check negative balances
        if (outstandingP < 0 || outstandingI < 0 || outstandingF < 0 || principal <= 0) {
          discrepanciesCount++;
          anomalies.push({
            category: 'FINANCIAL_INVARIANT',
            entity: 'Loan',
            classification: 'Suspicious',
            description: `Loan ${loan.loanNo} contains invalid/negative balance (P: ${outstandingP}, I: ${outstandingI}, F: ${outstandingF}).`,
            affectedCount: 1,
            sampleIds: [loan.loanNo],
          });
        }

        // B. Check schedule principal sum matches loan principal (tolerance 0.05 for rounding)
        if (loan.schedule.length > 0) {
          const schedulePrincipalSum = loan.schedule.reduce((sum, item) => sum + Number(item.principal), 0);
          const diff = Math.abs(schedulePrincipalSum - principal);
          if (diff > 0.05) {
            discrepanciesCount++;
            anomalies.push({
              category: 'FINANCIAL_INVARIANT',
              entity: 'RepaymentSchedule',
              classification: 'Suspicious',
              description: `Loan ${loan.loanNo} schedule principal sum (₹${schedulePrincipalSum.toFixed(2)}) differs from loan principal (₹${principal.toFixed(2)}).`,
              affectedCount: 1,
              sampleIds: [loan.loanNo],
            });
          }

          // Check schedule item negative balances
          for (const item of loan.schedule) {
            if (Number(item.outstanding) < -0.01) {
              discrepanciesCount++;
              anomalies.push({
                category: 'FINANCIAL_INVARIANT',
                entity: 'RepaymentScheduleItem',
                classification: 'Suspicious',
                description: `Loan ${loan.loanNo} EMI #${item.emiNumber} has negative outstanding balance (₹${item.outstanding}).`,
                affectedCount: 1,
                sampleIds: [item.id],
              });
            }
          }
        }

        // C. Check Closed loan balances
        if (loan.status === 'CLOSED') {
          if (outstandingP > 0.01 || outstandingI > 0.01 || outstandingF > 0.01) {
            discrepanciesCount++;
            anomalies.push({
              category: 'LIFECYCLE_STATE',
              entity: 'Loan.status',
              classification: 'Suspicious',
              description: `Loan ${loan.loanNo} is marked CLOSED but maintains non-zero outstanding balance (P: ${outstandingP}, I: ${outstandingI}, F: ${outstandingF}).`,
              affectedCount: 1,
              sampleIds: [loan.loanNo],
            });
          }
          if (!loan.closure) {
            anomalies.push({
              category: 'LIFECYCLE_STATE',
              entity: 'LoanClosure',
              classification: 'Requires human review',
              description: `Loan ${loan.loanNo} is CLOSED but missing official LoanClosure / NOC certificate record.`,
              affectedCount: 1,
              sampleIds: [loan.loanNo],
            });
          }
        }

        // D. Check Active loan with zero balance
        if (loan.status === 'ACTIVE' && outstandingP === 0 && outstandingI === 0 && outstandingF === 0 && loan.schedule.length > 0) {
          anomalies.push({
            category: 'LIFECYCLE_STATE',
            entity: 'Loan.status',
            classification: 'Valid',
            description: `Loan ${loan.loanNo} has zero outstanding balance and is ready for closure reconciliation.`,
            affectedCount: 1,
            sampleIds: [loan.loanNo],
          });
        }
      }

      // E. Check Payment allocation reconciliation
      const successPayments = await this.db.payment.findMany({
        where: { status: 'SUCCESS' },
        include: { allocations: true },
      });

      totalPaymentsAudited = successPayments.length;

      for (const p of successPayments) {
        totalAllocationsAudited += p.allocations.length;
        const pAmount = Number(p.amount);
        const allocSum = p.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
        const diff = Math.abs(pAmount - allocSum);

        if (diff > 0.01) {
          discrepanciesCount++;
          anomalies.push({
            category: 'FINANCIAL_INVARIANT',
            entity: 'PaymentAllocation',
            classification: 'Suspicious',
            description: `Payment ${p.paymentNo} amount (₹${pAmount.toFixed(2)}) does not equal sum of allocations (₹${allocSum.toFixed(2)}).`,
            affectedCount: 1,
            sampleIds: [p.paymentNo],
          });
        }
      }
    } catch (e: any) {
      discrepanciesCount++;
      anomalies.push({
        category: 'FINANCIAL_INVARIANT',
        entity: 'FinancialAudit',
        classification: 'Requires human review',
        description: `Financial invariant checks encountered error: ${e.message}`,
        affectedCount: 1,
      });
    }

    // 6. State & Lifecycle Consistency Checks
    try {
      // A. Disbursed Applications without Loan records
      const disbursedApps = await this.db.loanApplication.findMany({
        where: { status: 'DISBURSED' },
        include: { loan: true },
      });
      const missingLoanApps = disbursedApps.filter((a) => !a.loan);
      if (missingLoanApps.length > 0) {
        anomalies.push({
          category: 'LIFECYCLE_STATE',
          entity: 'LoanApplication',
          classification: 'Suspicious',
          description: 'Applications marked as DISBURSED without corresponding Loan account.',
          affectedCount: missingLoanApps.length,
          sampleIds: missingLoanApps.slice(0, 5).map((a) => a.applicationNo),
        });
      }

      // B. Active Loans without Repayment Schedules
      const activeLoansWithoutSchedule = await this.db.loan.findMany({
        where: { status: 'ACTIVE' },
        include: { schedule: true },
      });
      const missingScheduleLoans = activeLoansWithoutSchedule.filter((l) => l.schedule.length === 0);
      if (missingScheduleLoans.length > 0) {
        anomalies.push({
          category: 'LIFECYCLE_STATE',
          entity: 'RepaymentScheduleItem',
          classification: 'Suspicious',
          description: 'Active loans found with zero repayment schedule items.',
          affectedCount: missingScheduleLoans.length,
          sampleIds: missingScheduleLoans.slice(0, 5).map((l) => l.loanNo),
        });
      }
    } catch (e: any) {
      anomalies.push({
        category: 'LIFECYCLE_STATE',
        entity: 'LifecycleAudit',
        classification: 'Requires human review',
        description: `Lifecycle state audit encountered error: ${e.message}`,
        affectedCount: 1,
      });
    }

    // 7. Security & Sensitive Data Safeguards Audit
    try {
      const users = await this.db.user.findMany({ select: { id: true, email: true, passwordHash: true } });
      const insecurePasswords = users.filter(
        (u) => !u.passwordHash.startsWith('$argon2') && !u.passwordHash.startsWith('$2a$') && !u.passwordHash.startsWith('$2b$') && !u.passwordHash.startsWith('$2y$')
      );
      if (insecurePasswords.length > 0) {
        anomalies.push({
          category: 'SECURITY',
          entity: 'User.passwordHash',
          classification: 'Suspicious',
          description: 'User records detected with unhashed or insecure password hashes.',
          affectedCount: insecurePasswords.length,
          sampleIds: insecurePasswords.slice(0, 5).map((u) => u.email),
        });
      }
    } catch (e: any) {
      anomalies.push({
        category: 'SECURITY',
        entity: 'SecurityAudit',
        classification: 'Requires human review',
        description: `Security audit check encountered error: ${e.message}`,
        affectedCount: 1,
      });
    }

    // 8. Compute Check Summaries & Final Verdict
    const suspiciousOrOrphans = anomalies.filter(
      (a) => a.classification === 'Suspicious' || a.classification === 'Orphaned'
    );
    const requiresReview = anomalies.filter((a) => a.classification === 'Requires human review');

    const referentialIntegrityStatus = anomalies.some(
      (a) => a.category === 'REFERENTIAL_INTEGRITY' && a.classification !== 'Valid'
    )
      ? 'FAIL'
      : 'PASS';

    const orphanStatus = anomalies.some((a) => a.category === 'ORPHAN_RECORD' && a.classification === 'Orphaned')
      ? 'FAIL'
      : 'PASS';

    const duplicateStatus = anomalies.some(
      (a) => a.category === 'DUPLICATE_IDENTIFIER' && a.classification === 'Suspicious'
    )
      ? 'FAIL'
      : 'PASS';

    const financialStatus = discrepanciesCount > 0 ? 'WARN' : 'PASS';

    const stateStatus = anomalies.some(
      (a) => a.category === 'LIFECYCLE_STATE' && (a.classification === 'Suspicious' || a.classification === 'Orphaned')
    )
      ? 'WARN'
      : 'PASS';

    const requiredRelStatus = tableStats.some((t) => t.status === 'ERROR') ? 'FAIL' : 'PASS';

    const securityStatus = anomalies.some((a) => a.category === 'SECURITY' && a.classification !== 'Valid')
      ? 'FAIL'
      : 'PASS';

    let verdict: 'PRODUCTION DATABASE READY' | 'PRODUCTION DATABASE READY WITH WARNINGS' | 'NOT READY' =
      'PRODUCTION DATABASE READY';

    if (
      referentialIntegrityStatus === 'FAIL' ||
      orphanStatus === 'FAIL' ||
      duplicateStatus === 'FAIL' ||
      securityStatus === 'FAIL'
    ) {
      verdict = 'NOT READY';
    } else if (suspiciousOrOrphans.length > 0 || requiresReview.length > 0 || financialStatus === 'WARN' || stateStatus === 'WARN') {
      verdict = 'PRODUCTION DATABASE READY WITH WARNINGS';
    }

    return {
      timestamp,
      environment,
      readOnly: true,
      databaseEngine: 'PostgreSQL (Prisma ORM)',
      connectionStatus,
      tableStats,
      anomalies,
      financialSummary: {
        totalLoansAudited,
        totalPrincipalDisbursed: totalPrincipalDisbursedNum.toFixed(2),
        totalOutstandingPrincipal: totalOutstandingPrincipalNum.toFixed(2),
        totalPaymentsAudited,
        totalAllocationsAudited,
        discrepanciesCount,
      },
      checksSummary: {
        referentialIntegrity: referentialIntegrityStatus,
        orphanDetection: orphanStatus,
        duplicateIdentifiers: duplicateStatus,
        financialConsistency: financialStatus,
        stateConsistency: stateStatus,
        requiredRelationships: requiredRelStatus,
        securityProtections: securityStatus,
      },
      verdict,
    };
  }
}

export const dataReadinessService = new DataReadinessService();
