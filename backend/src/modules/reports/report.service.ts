import { Decimal } from 'decimal.js';
import { prisma } from '../../config/prisma';
import { Money } from '../finance/money';

export async function getPortfolioOverview() {
  const [loans, payments, disbursements, products, branches, collectionCases] = await Promise.all([
    prisma.loan.findMany({
      include: {
        product: { select: { name: true, code: true } },
        branch: { select: { name: true, code: true } },
      },
    }),
    prisma.payment.findMany({ where: { status: 'SUCCESS' } }),
    prisma.disbursement.findMany({ where: { status: 'COMPLETED' } }),
    prisma.loanProduct.findMany({ select: { id: true, name: true, code: true } }),
    prisma.branch.findMany({ select: { id: true, name: true, code: true } }),
    prisma.collectionCase.findMany({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'PROMISED'] } } }),
  ]);

  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
  const overdueLoans = loans.filter((l) => l.status === 'OVERDUE');
  const closedLoans = loans.filter((l) => l.status === 'CLOSED' || l.status === 'SETTLED');

  const totalPrincipalDisbursed = disbursements.reduce(
    (acc, d) => acc.plus(d.amount),
    new Decimal(0)
  );

  const totalPrincipalOutstanding = activeLoans.reduce(
    (acc, l) => acc.plus(l.outstandingPrincipal),
    new Decimal(0)
  );

  const totalCollections = payments.reduce((acc, p) => acc.plus(p.amount), new Decimal(0));

  const totalOverdue = collectionCases.reduce(
    (acc, c) => acc.plus(c.overdueAmount),
    new Decimal(0)
  );

  // Product-wise distribution
  const productDistribution = products.map((p) => {
    const prodLoans = loans.filter((l) => l.productId === p.id);
    const amount = prodLoans.reduce((acc, l) => acc.plus(l.principal), new Decimal(0));
    return {
      code: p.code,
      name: p.name,
      count: prodLoans.length,
      amount: Money.toDb(amount),
    };
  });

  // Branch-wise distribution
  const branchDistribution = branches.map((b) => {
    const branchLoans = loans.filter((l) => l.branchId === b.id);
    const amount = branchLoans.reduce((acc, l) => acc.plus(l.principal), new Decimal(0));
    return {
      code: b.code,
      name: b.name,
      count: branchLoans.length,
      amount: Money.toDb(amount),
    };
  });

  // Delinquency Buckets
  const delinquencyBuckets = [
    {
      bucket: '0-30 DPD',
      count: collectionCases.filter((c) => c.agingBucket === '0-30').length,
      amount: Money.toDb(
        collectionCases
          .filter((c) => c.agingBucket === '0-30')
          .reduce((acc, c) => acc.plus(c.overdueAmount), new Decimal(0))
      ),
    },
    {
      bucket: '31-60 DPD',
      count: collectionCases.filter((c) => c.agingBucket === '31-60').length,
      amount: Money.toDb(
        collectionCases
          .filter((c) => c.agingBucket === '31-60')
          .reduce((acc, c) => acc.plus(c.overdueAmount), new Decimal(0))
      ),
    },
    {
      bucket: '61-90 DPD',
      count: collectionCases.filter((c) => c.agingBucket === '61-90').length,
      amount: Money.toDb(
        collectionCases
          .filter((c) => c.agingBucket === '61-90')
          .reduce((acc, c) => acc.plus(c.overdueAmount), new Decimal(0))
      ),
    },
    {
      bucket: '90+ DPD (NPA Risk)',
      count: collectionCases.filter((c) => c.agingBucket === '91-180' || c.agingBucket === '180+').length,
      amount: Money.toDb(
        collectionCases
          .filter((c) => c.agingBucket === '91-180' || c.agingBucket === '180+')
          .reduce((acc, c) => acc.plus(c.overdueAmount), new Decimal(0))
      ),
    },
  ];

  return {
    kpis: {
      totalLoans: loans.length,
      activeLoansCount: activeLoans.length,
      overdueLoansCount: overdueLoans.length,
      closedLoansCount: closedLoans.length,
      totalDisbursed: Money.toDb(totalPrincipalDisbursed),
      totalOutstanding: Money.toDb(totalPrincipalOutstanding),
      totalCollected: Money.toDb(totalCollections),
      totalOverdue: Money.toDb(totalOverdue),
      parRatio: totalPrincipalOutstanding.greaterThan(0)
        ? (totalOverdue.dividedBy(totalPrincipalOutstanding).toNumber() * 100).toFixed(2)
        : '0.00',
    },
    totalLoans: loans.length,
    activeLoans: activeLoans.length,
    activeLoansCount: activeLoans.length,
    overdueLoans: overdueLoans.length,
    overdueLoansCount: overdueLoans.length,
    closedLoans: closedLoans.length,
    closedLoansCount: closedLoans.length,
    totalPrincipalDisbursed: Money.toDb(totalPrincipalDisbursed),
    totalDisbursed: Money.toDb(totalPrincipalDisbursed),
    totalPrincipalOutstanding: Money.toDb(totalPrincipalOutstanding),
    totalOutstanding: Money.toDb(totalPrincipalOutstanding),
    totalCollections: Money.toDb(totalCollections),
    totalCollected: Money.toDb(totalCollections),
    totalOverdue: Money.toDb(totalOverdue),
    productDistribution,
    branchDistribution,
    delinquencyBuckets,
  };
}

export async function generateCsvReport(type: 'loans' | 'disbursements' | 'payments' | 'collections' | 'applications') {
  const BOM = '\uFEFF'; // Excel UTF-8 BOM

  if (type === 'loans') {
    const loans = await prisma.loan.findMany({
      include: {
        customer: { select: { firstName: true, lastName: true, customerCode: true, mobile: true, email: true } },
        product: { select: { name: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Loan Account #',
      'Customer ID',
      'Borrower Name',
      'Mobile Number',
      'Email',
      'Loan Product',
      'Branch',
      'Sanctioned Principal (INR)',
      'Interest Rate (% p.a.)',
      'Tenure (Months)',
      'Monthly EMI (INR)',
      'Outstanding Balance (INR)',
      'Account Status',
      'Disbursement Date',
      'Next Due Date',
    ];

    const rows = loans.map((l) => [
      l.loanNo,
      l.customer.customerCode,
      `"${l.customer.firstName} ${l.customer.lastName}"`,
      `"${l.customer.mobile}"`,
      `"${l.customer.email || ''}"`,
      `"${l.product.name}"`,
      `"${l.branch?.name || 'Headquarters'}"`,
      l.principal.toFixed(2),
      l.interestRate.toFixed(2),
      l.tenureMonths,
      l.emiAmount.toFixed(2),
      l.outstandingPrincipal.toFixed(2),
      l.status,
      l.disbursementDate ? l.disbursementDate.toISOString().split('T')[0] : '',
      l.nextDueDate ? l.nextDueDate.toISOString().split('T')[0] : '',
    ]);

    return BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  if (type === 'disbursements') {
    const disbursements = await prisma.disbursement.findMany({
      include: {
        loan: {
          include: {
            customer: { select: { firstName: true, lastName: true, customerCode: true, mobile: true } },
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Disbursement ID',
      'Loan Account #',
      'Customer ID',
      'Borrower Name',
      'Loan Product',
      'Disbursed Amount (INR)',
      'Payment Method',
      'Reference / UTR #',
      'Disbursement Status',
      'Disbursed Date',
    ];

    const rows = disbursements.map((d) => [
      d.id,
      d.loan?.loanNo || '-',
      d.loan?.customer?.customerCode || '-',
      `"${d.loan?.customer?.firstName || ''} ${d.loan?.customer?.lastName || ''}"`,
      `"${d.loan?.product?.name || ''}"`,
      d.amount.toFixed(2),
      d.method,
      `"${d.reference || ''}"`,
      d.status,
      d.createdAt.toISOString().split('T')[0],
    ]);

    return BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  if (type === 'payments') {
    const payments = await prisma.payment.findMany({
      include: {
        customer: { select: { firstName: true, lastName: true, customerCode: true } },
        loan: { select: { loanNo: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Payment Receipt #',
      'Loan Account #',
      'Customer ID',
      'Customer Name',
      'Amount Collected (INR)',
      'Payment Method',
      'Transaction Ref / UTR',
      'Status',
      'Payment Date',
    ];

    const rows = payments.map((p) => [
      p.paymentNo,
      p.loan?.loanNo || '-',
      p.customer?.customerCode || '-',
      `"${p.customer?.firstName || ''} ${p.customer?.lastName || ''}"`,
      p.amount.toFixed(2),
      p.method,
      `"${p.reference || ''}"`,
      p.status,
      p.paidAt.toISOString().split('T')[0],
    ]);

    return BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  if (type === 'collections') {
    const cases = await prisma.collectionCase.findMany({
      include: {
        customer: { select: { firstName: true, lastName: true, customerCode: true, mobile: true } },
        loan: { select: { loanNo: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Collection Case #',
      'Loan Account #',
      'Customer ID',
      'Borrower Name',
      'Mobile',
      'Overdue Amount (INR)',
      'DPD (Days Past Due)',
      'Aging Bucket',
      'Priority',
      'Case Status',
      'Last Updated',
    ];

    const rows = cases.map((c) => [
      c.caseNo,
      c.loan?.loanNo || '-',
      c.customer?.customerCode || '-',
      `"${c.customer?.firstName || ''} ${c.customer?.lastName || ''}"`,
      `"${c.customer?.mobile || ''}"`,
      c.overdueAmount.toFixed(2),
      c.dpd,
      c.agingBucket,
      c.priority,
      c.status,
      c.updatedAt.toISOString().split('T')[0],
    ]);

    return BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  return BOM + 'No report data';
}
