import { describe, it, expect, vi } from 'vitest';
import { DataReadinessService } from './data-readiness.service';
import { PrismaClient } from '@prisma/client';

describe('Step 53: Production Database & Data Readiness Audit', () => {
  it('successfully executes read-only database readiness audit with valid records', async () => {
    // Mock healthy Prisma client
    const mockPrisma: any = {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      user: {
        count: vi.fn().mockResolvedValue(10),
        findMany: vi.fn().mockResolvedValue([
          { id: 'u-1', email: 'admin@adyapan.dev', passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$mockhash1' },
          { id: 'u-2', email: 'officer@adyapan.dev', passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$mockhash2' },
        ]),
      },
      role: { count: vi.fn().mockResolvedValue(10) },
      permission: { count: vi.fn().mockResolvedValue(17) },
      userRole: { count: vi.fn().mockResolvedValue(10) },
      rolePermission: { count: vi.fn().mockResolvedValue(17) },
      refreshToken: { count: vi.fn().mockResolvedValue(5) },
      branch: { count: vi.fn().mockResolvedValue(4) },
      customer: {
        count: vi.fn().mockResolvedValue(3),
        findMany: vi.fn().mockResolvedValue([
          { id: 'c-1', customerCode: 'CUST-001' },
          { id: 'c-2', customerCode: 'CUST-002' },
        ]),
      },
      customerAddress: { count: vi.fn().mockResolvedValue(3) },
      customerEmployment: { count: vi.fn().mockResolvedValue(3) },
      customerBankAccount: {
        count: vi.fn().mockResolvedValue(3),
        findMany: vi.fn().mockResolvedValue([{ id: 'b-1', customerId: 'c-1' }]),
      },
      loanProduct: { count: vi.fn().mockResolvedValue(5) },
      loanApplication: {
        count: vi.fn().mockResolvedValue(4),
        findMany: vi.fn().mockResolvedValue([
          { id: 'app-1', applicationNo: 'APP-001', status: 'DISBURSED', loan: { id: 'l-1' } },
        ]),
      },
      applicationStatusHistory: { count: vi.fn().mockResolvedValue(12) },
      eligibilityAssessment: { count: vi.fn().mockResolvedValue(4) },
      riskAssessment: { count: vi.fn().mockResolvedValue(4) },
      underwritingDecision: { count: vi.fn().mockResolvedValue(4) },
      approvalRequest: { count: vi.fn().mockResolvedValue(4) },
      loan: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'l-1',
            loanNo: 'LN-001',
            principal: '100000.00',
            outstandingPrincipal: '80000.00',
            outstandingInterest: '500.00',
            outstandingFees: '0.00',
            status: 'ACTIVE',
            schedule: [
              { id: 's-1', emiNumber: 1, principal: '50000.00', outstanding: '0.00' },
              { id: 's-2', emiNumber: 2, principal: '50000.00', outstanding: '50000.00' },
            ],
            payments: [],
            closure: null,
          },
        ]),
      },
      repaymentScheduleItem: {
        count: vi.fn().mockResolvedValue(24),
        findMany: vi.fn().mockResolvedValue([{ id: 's-1', loanId: 'l-1' }]),
      },
      disbursement: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi.fn().mockResolvedValue([{ id: 'd-1', loanId: 'l-1' }]),
      },
      payment: {
        count: vi.fn().mockResolvedValue(5),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'p-1',
            paymentNo: 'PAY-001',
            loanId: 'l-1',
            customerId: 'c-1',
            amount: '5000.00',
            status: 'SUCCESS',
            allocations: [{ id: 'pa-1', amount: '5000.00' }],
          },
        ]),
      },
      paymentAllocation: {
        count: vi.fn().mockResolvedValue(5),
        findMany: vi.fn().mockResolvedValue([{ id: 'pa-1', paymentId: 'p-1' }]),
      },
      paymentSubmission: { count: vi.fn().mockResolvedValue(2) },
      transaction: { count: vi.fn().mockResolvedValue(10) },
      collectionCase: { count: vi.fn().mockResolvedValue(1) },
      collectionActivity: { count: vi.fn().mockResolvedValue(2) },
      promiseToPay: { count: vi.fn().mockResolvedValue(1) },
      loanRestructure: { count: vi.fn().mockResolvedValue(0) },
      settlement: { count: vi.fn().mockResolvedValue(0) },
      loanClosure: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([{ id: 'lc-1', loanId: 'l-1', nocNumber: 'NOC-001' }]),
      },
      document: { count: vi.fn().mockResolvedValue(8) },
      notification: { count: vi.fn().mockResolvedValue(15) },
      notificationTemplate: { count: vi.fn().mockResolvedValue(6) },
      auditLog: { count: vi.fn().mockResolvedValue(50) },
      systemSetting: { count: vi.fn().mockResolvedValue(5) },
    };

    const service = new DataReadinessService(mockPrisma as unknown as PrismaClient);
    const result = await service.runProductionDatabaseAudit();

    expect(result.readOnly).toBe(true);
    expect(result.connectionStatus).toBe('HEALTHY');
    expect(result.tableStats).toHaveLength(36);
    expect(result.checksSummary.referentialIntegrity).toBe('PASS');
    expect(result.checksSummary.orphanDetection).toBe('PASS');
    expect(result.checksSummary.duplicateIdentifiers).toBe('PASS');
    expect(result.checksSummary.financialConsistency).toBe('PASS');
    expect(result.checksSummary.stateConsistency).toBe('PASS');
    expect(result.checksSummary.requiredRelationships).toBe('PASS');
    expect(result.checksSummary.securityProtections).toBe('PASS');
    expect(result.verdict).toBe('PRODUCTION DATABASE READY');
  });

  it('detects orphaned payment and customer bank account records', async () => {
    const mockPrisma: any = {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      user: { count: vi.fn().mockResolvedValue(1), findMany: vi.fn().mockResolvedValue([]) },
      role: { count: vi.fn().mockResolvedValue(1) },
      permission: { count: vi.fn().mockResolvedValue(1) },
      userRole: { count: vi.fn().mockResolvedValue(1) },
      rolePermission: { count: vi.fn().mockResolvedValue(1) },
      refreshToken: { count: vi.fn().mockResolvedValue(1) },
      branch: { count: vi.fn().mockResolvedValue(1) },
      customer: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([{ id: 'c-existing', customerCode: 'CUST-100' }]),
      },
      customerAddress: { count: vi.fn().mockResolvedValue(1) },
      customerEmployment: { count: vi.fn().mockResolvedValue(1) },
      customerBankAccount: {
        count: vi.fn().mockResolvedValue(1),
        // Bank account referencing deleted customer
        findMany: vi.fn().mockResolvedValue([{ id: 'b-orphan', customerId: 'c-deleted-999' }]),
      },
      loanProduct: { count: vi.fn().mockResolvedValue(1) },
      loanApplication: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      applicationStatusHistory: { count: vi.fn().mockResolvedValue(0) },
      eligibilityAssessment: { count: vi.fn().mockResolvedValue(0) },
      riskAssessment: { count: vi.fn().mockResolvedValue(0) },
      underwritingDecision: { count: vi.fn().mockResolvedValue(0) },
      approvalRequest: { count: vi.fn().mockResolvedValue(0) },
      loan: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      repaymentScheduleItem: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      disbursement: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      payment: {
        count: vi.fn().mockResolvedValue(1),
        // Payment referencing non-existent loan
        findMany: vi.fn().mockResolvedValue([
          { id: 'p-orphan', paymentNo: 'PAY-ORPHAN', loanId: 'l-nonexistent', customerId: 'c-existing' },
        ]),
      },
      paymentAllocation: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      paymentSubmission: { count: vi.fn().mockResolvedValue(0) },
      transaction: { count: vi.fn().mockResolvedValue(0) },
      collectionCase: { count: vi.fn().mockResolvedValue(0) },
      collectionActivity: { count: vi.fn().mockResolvedValue(0) },
      promiseToPay: { count: vi.fn().mockResolvedValue(0) },
      loanRestructure: { count: vi.fn().mockResolvedValue(0) },
      settlement: { count: vi.fn().mockResolvedValue(0) },
      loanClosure: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      document: { count: vi.fn().mockResolvedValue(0) },
      notification: { count: vi.fn().mockResolvedValue(0) },
      notificationTemplate: { count: vi.fn().mockResolvedValue(0) },
      auditLog: { count: vi.fn().mockResolvedValue(0) },
      systemSetting: { count: vi.fn().mockResolvedValue(0) },
    };

    const service = new DataReadinessService(mockPrisma as unknown as PrismaClient);
    const result = await service.runProductionDatabaseAudit();

    expect(result.checksSummary.orphanDetection).toBe('FAIL');
    const paymentOrphan = result.anomalies.find((a) => a.entity === 'Payment');
    expect(paymentOrphan).toBeDefined();
    expect(paymentOrphan?.classification).toBe('Orphaned');

    const bankAccountOrphan = result.anomalies.find((a) => a.entity === 'CustomerBankAccount');
    expect(bankAccountOrphan).toBeDefined();
    expect(bankAccountOrphan?.classification).toBe('Orphaned');
    expect(result.verdict).toBe('NOT READY');
  });

  it('detects duplicate customer codes and payment identifiers', async () => {
    const mockPrisma: any = {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      user: { count: vi.fn().mockResolvedValue(1), findMany: vi.fn().mockResolvedValue([]) },
      role: { count: vi.fn().mockResolvedValue(1) },
      permission: { count: vi.fn().mockResolvedValue(1) },
      userRole: { count: vi.fn().mockResolvedValue(1) },
      rolePermission: { count: vi.fn().mockResolvedValue(1) },
      refreshToken: { count: vi.fn().mockResolvedValue(1) },
      branch: { count: vi.fn().mockResolvedValue(1) },
      customer: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi.fn().mockResolvedValue([
          { id: 'c-1', customerCode: 'CUST-DUPLICATE' },
          { id: 'c-2', customerCode: 'CUST-DUPLICATE' },
        ]),
      },
      customerAddress: { count: vi.fn().mockResolvedValue(0) },
      customerEmployment: { count: vi.fn().mockResolvedValue(0) },
      customerBankAccount: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      loanProduct: { count: vi.fn().mockResolvedValue(1) },
      loanApplication: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      applicationStatusHistory: { count: vi.fn().mockResolvedValue(0) },
      eligibilityAssessment: { count: vi.fn().mockResolvedValue(0) },
      riskAssessment: { count: vi.fn().mockResolvedValue(0) },
      underwritingDecision: { count: vi.fn().mockResolvedValue(0) },
      approvalRequest: { count: vi.fn().mockResolvedValue(0) },
      loan: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      repaymentScheduleItem: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      disbursement: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      payment: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi.fn().mockResolvedValue([
          { id: 'p-1', paymentNo: 'PAY-DUP', loanId: 'l-1', customerId: 'c-1', status: 'PENDING' },
          { id: 'p-2', paymentNo: 'PAY-DUP', loanId: 'l-1', customerId: 'c-1', status: 'PENDING' },
        ]),
      },
      paymentAllocation: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      paymentSubmission: { count: vi.fn().mockResolvedValue(0) },
      transaction: { count: vi.fn().mockResolvedValue(0) },
      collectionCase: { count: vi.fn().mockResolvedValue(0) },
      collectionActivity: { count: vi.fn().mockResolvedValue(0) },
      promiseToPay: { count: vi.fn().mockResolvedValue(0) },
      loanRestructure: { count: vi.fn().mockResolvedValue(0) },
      settlement: { count: vi.fn().mockResolvedValue(0) },
      loanClosure: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      document: { count: vi.fn().mockResolvedValue(0) },
      notification: { count: vi.fn().mockResolvedValue(0) },
      notificationTemplate: { count: vi.fn().mockResolvedValue(0) },
      auditLog: { count: vi.fn().mockResolvedValue(0) },
      systemSetting: { count: vi.fn().mockResolvedValue(0) },
    };

    const service = new DataReadinessService(mockPrisma as unknown as PrismaClient);
    const result = await service.runProductionDatabaseAudit();

    expect(result.checksSummary.duplicateIdentifiers).toBe('FAIL');
    const dupCust = result.anomalies.find((a) => a.entity === 'Customer.customerCode');
    expect(dupCust).toBeDefined();

    const dupPay = result.anomalies.find((a) => a.entity === 'Payment.paymentNo');
    expect(dupPay).toBeDefined();
    expect(result.verdict).toBe('NOT READY');
  });

  it('detects negative loan balance and schedule reconciliation mismatch', async () => {
    const mockPrisma: any = {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      user: { count: vi.fn().mockResolvedValue(1), findMany: vi.fn().mockResolvedValue([]) },
      role: { count: vi.fn().mockResolvedValue(1) },
      permission: { count: vi.fn().mockResolvedValue(1) },
      userRole: { count: vi.fn().mockResolvedValue(1) },
      rolePermission: { count: vi.fn().mockResolvedValue(1) },
      refreshToken: { count: vi.fn().mockResolvedValue(1) },
      branch: { count: vi.fn().mockResolvedValue(1) },
      customer: { count: vi.fn().mockResolvedValue(1), findMany: vi.fn().mockResolvedValue([{ id: 'c-1' }]) },
      customerAddress: { count: vi.fn().mockResolvedValue(0) },
      customerEmployment: { count: vi.fn().mockResolvedValue(0) },
      customerBankAccount: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      loanProduct: { count: vi.fn().mockResolvedValue(1) },
      loanApplication: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      applicationStatusHistory: { count: vi.fn().mockResolvedValue(0) },
      eligibilityAssessment: { count: vi.fn().mockResolvedValue(0) },
      riskAssessment: { count: vi.fn().mockResolvedValue(0) },
      underwritingDecision: { count: vi.fn().mockResolvedValue(0) },
      approvalRequest: { count: vi.fn().mockResolvedValue(0) },
      loan: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'l-bad',
            loanNo: 'LN-BAD',
            principal: '50000.00',
            outstandingPrincipal: '-500.00', // Negative principal!
            outstandingInterest: '0.00',
            outstandingFees: '0.00',
            status: 'ACTIVE',
            schedule: [
              // Schedule sums to 40,000 instead of 50,000
              { id: 's-1', emiNumber: 1, principal: '40000.00', outstanding: '40000.00' },
            ],
            payments: [],
            closure: null,
          },
        ]),
      },
      repaymentScheduleItem: { count: vi.fn().mockResolvedValue(1), findMany: vi.fn().mockResolvedValue([{ id: 's-1', loanId: 'l-bad' }]) },
      disbursement: { count: vi.fn().mockResolvedValue(1), findMany: vi.fn().mockResolvedValue([{ id: 'd-1', loanId: 'l-bad' }]) },
      payment: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      paymentAllocation: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      paymentSubmission: { count: vi.fn().mockResolvedValue(0) },
      transaction: { count: vi.fn().mockResolvedValue(0) },
      collectionCase: { count: vi.fn().mockResolvedValue(0) },
      collectionActivity: { count: vi.fn().mockResolvedValue(0) },
      promiseToPay: { count: vi.fn().mockResolvedValue(0) },
      loanRestructure: { count: vi.fn().mockResolvedValue(0) },
      settlement: { count: vi.fn().mockResolvedValue(0) },
      loanClosure: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      document: { count: vi.fn().mockResolvedValue(0) },
      notification: { count: vi.fn().mockResolvedValue(0) },
      notificationTemplate: { count: vi.fn().mockResolvedValue(0) },
      auditLog: { count: vi.fn().mockResolvedValue(0) },
      systemSetting: { count: vi.fn().mockResolvedValue(0) },
    };

    const service = new DataReadinessService(mockPrisma as unknown as PrismaClient);
    const result = await service.runProductionDatabaseAudit();

    expect(result.checksSummary.financialConsistency).toBe('WARN');
    expect(result.financialSummary.discrepanciesCount).toBeGreaterThan(0);
    const negBal = result.anomalies.find((a) => a.entity === 'Loan');
    expect(negBal).toBeDefined();
    expect(negBal?.description).toContain('negative balance');
  });

  it('detects unhashed or non-Argon2 user passwords', async () => {
    const mockPrisma: any = {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      user: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([
          { id: 'u-bad', email: 'plaintext@adyapan.dev', passwordHash: 'plain_secret_password' },
        ]),
      },
      role: { count: vi.fn().mockResolvedValue(1) },
      permission: { count: vi.fn().mockResolvedValue(1) },
      userRole: { count: vi.fn().mockResolvedValue(1) },
      rolePermission: { count: vi.fn().mockResolvedValue(1) },
      refreshToken: { count: vi.fn().mockResolvedValue(1) },
      branch: { count: vi.fn().mockResolvedValue(1) },
      customer: { count: vi.fn().mockResolvedValue(1), findMany: vi.fn().mockResolvedValue([{ id: 'c-1' }]) },
      customerAddress: { count: vi.fn().mockResolvedValue(0) },
      customerEmployment: { count: vi.fn().mockResolvedValue(0) },
      customerBankAccount: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      loanProduct: { count: vi.fn().mockResolvedValue(1) },
      loanApplication: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      applicationStatusHistory: { count: vi.fn().mockResolvedValue(0) },
      eligibilityAssessment: { count: vi.fn().mockResolvedValue(0) },
      riskAssessment: { count: vi.fn().mockResolvedValue(0) },
      underwritingDecision: { count: vi.fn().mockResolvedValue(0) },
      approvalRequest: { count: vi.fn().mockResolvedValue(0) },
      loan: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      repaymentScheduleItem: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      disbursement: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      payment: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      paymentAllocation: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      paymentSubmission: { count: vi.fn().mockResolvedValue(0) },
      transaction: { count: vi.fn().mockResolvedValue(0) },
      collectionCase: { count: vi.fn().mockResolvedValue(0) },
      collectionActivity: { count: vi.fn().mockResolvedValue(0) },
      promiseToPay: { count: vi.fn().mockResolvedValue(0) },
      loanRestructure: { count: vi.fn().mockResolvedValue(0) },
      settlement: { count: vi.fn().mockResolvedValue(0) },
      loanClosure: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
      document: { count: vi.fn().mockResolvedValue(0) },
      notification: { count: vi.fn().mockResolvedValue(0) },
      notificationTemplate: { count: vi.fn().mockResolvedValue(0) },
      auditLog: { count: vi.fn().mockResolvedValue(0) },
      systemSetting: { count: vi.fn().mockResolvedValue(0) },
    };

    const service = new DataReadinessService(mockPrisma as unknown as PrismaClient);
    const result = await service.runProductionDatabaseAudit();

    expect(result.checksSummary.securityProtections).toBe('FAIL');
    const secAnomaly = result.anomalies.find((a) => a.entity === 'User.passwordHash');
    expect(secAnomaly).toBeDefined();
    expect(result.verdict).toBe('NOT READY');
  });
});
