import { Decimal } from 'decimal.js';
import { prisma } from '../../config/prisma';
import { Money } from '../finance/money';

export interface ReportActorContext {
  id?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}

export interface ReportFilterOptions {
  dateFilter?: string;
  startDate?: string;
  endDate?: string;
  filter?: string;
  start?: string;
  end?: string;
  range?: string;
}

export function resolveDateRange(
  dateFilter?: string,
  startDate?: string,
  endDate?: string
): { from?: Date; to?: Date } {
  if (startDate && endDate) {
    const from = new Date(startDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(endDate);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  const rawFilter = (dateFilter || '').trim();
  if (!rawFilter || rawFilter.toLowerCase() === 'all' || rawFilter.toLowerCase() === 'all time') {
    return {};
  }

  const now = new Date();
  const f = rawFilter.toLowerCase();

  if (f === 'today') {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { from, to };
  }

  if (f === 'this week') {
    const from = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    from.setHours(0, 0, 0, 0);
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  if (f === 'this month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from, to };
  }

  if (f === 'last month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { from, to };
  }

  if (f === 'this quarter') {
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    const from = new Date(now.getFullYear(), qMonth, 1, 0, 0, 0);
    const to = new Date(now.getFullYear(), qMonth + 3, 0, 23, 59, 59, 999);
    return { from, to };
  }

  if (f === 'this financial year') {
    const fyYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const from = new Date(fyYear, 3, 1, 0, 0, 0);
    const to = new Date(fyYear + 1, 2, 31, 23, 59, 59, 999);
    return { from, to };
  }

  const monthMatch = rawFilter.match(/^([A-Za-z]{3})\s+(\d{4})$/i);
  if (monthMatch) {
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIdx = monthNames.indexOf(monthMatch[1].toLowerCase());
    if (monthIdx !== -1) {
      const year = parseInt(monthMatch[2], 10);
      const from = new Date(year, monthIdx, 1, 0, 0, 0);
      const to = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);
      return { from, to };
    }
  }

  const rangeMatch = rawFilter.match(/^(\d{4}-\d{2}-\d{2})\s+(?:to|-)\s+(\d{4}-\d{2}-\d{2})$/);
  if (rangeMatch) {
    const from = new Date(rangeMatch[1]);
    from.setHours(0, 0, 0, 0);
    const to = new Date(rangeMatch[2]);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  return {};
}

export async function getPortfolioOverview(
  actor?: ReportActorContext,
  options?: ReportFilterOptions
) {
  const isSuperAdmin = actor?.roles?.includes('SUPER_ADMIN');
  const isCompanyAdmin = actor?.roles?.includes('COMPANY_ADMIN') || actor?.roles?.includes('ADMIN');

  const tenantFilter: any = !isSuperAdmin && actor?.tenantId ? { tenantId: actor.tenantId } : {};
  const branchFilter: any = !isSuperAdmin && !isCompanyAdmin && actor?.branchId ? { branchId: actor.branchId } : {};

  const combinedLoanFilter = {
    ...tenantFilter,
    ...branchFilter,
  };

  const { from: startDate, to: endDate } = resolveDateRange(
    options?.dateFilter || options?.filter || options?.range,
    options?.startDate || options?.start,
    options?.endDate || options?.end
  );

  const paymentDateFilter = startDate && endDate
    ? {
        OR: [
          { createdAt: { gte: startDate, lte: endDate } },
          { paidAt: { gte: startDate, lte: endDate } },
        ],
      }
    : {};

  const disbursementDateFilter = startDate && endDate
    ? {
        OR: [
          { createdAt: { gte: startDate, lte: endDate } },
          { disbursedAt: { gte: startDate, lte: endDate } },
        ],
      }
    : {};

  const [loans, payments, disbursements, products, branches, collectionCases] = await Promise.all([
    prisma.loan.findMany({
      where: combinedLoanFilter,
      include: {
        product: { select: { name: true, code: true } },
        branch: { select: { name: true, code: true } },
      },
    }),
    prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        ...paymentDateFilter,
        ...(tenantFilter.tenantId ? { tenantId: tenantFilter.tenantId } : {}),
        ...(branchFilter.branchId ? { loan: { branchId: branchFilter.branchId } } : {}),
      },
    }),
    prisma.disbursement.findMany({
      where: {
        status: 'COMPLETED',
        ...disbursementDateFilter,
        ...(tenantFilter.tenantId ? { loan: { tenantId: tenantFilter.tenantId } } : {}),
        ...(branchFilter.branchId ? { loan: { branchId: branchFilter.branchId } } : {}),
      },
    }),
    prisma.loanProduct.findMany({
      where: tenantFilter.tenantId ? { OR: [{ tenantId: tenantFilter.tenantId }, { tenantId: null }] } : {},
      select: { id: true, name: true, code: true },
    }),
    prisma.branch.findMany({
      where: {
        ...(tenantFilter.tenantId ? { tenantId: tenantFilter.tenantId } : {}),
        ...(branchFilter.branchId ? { id: branchFilter.branchId } : {}),
      },
      select: { id: true, name: true, code: true },
    }),
    prisma.collectionCase.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS', 'PROMISED'] },
        ...(tenantFilter.tenantId ? { loan: { tenantId: tenantFilter.tenantId } } : {}),
        ...(branchFilter.branchId ? { loan: { branchId: branchFilter.branchId } } : {}),
      },
    }),
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

export async function generateCsvReport(
  type: 'loans' | 'disbursements' | 'payments' | 'collections' | 'applications',
  actor?: ReportActorContext,
  options?: ReportFilterOptions
) {
  const BOM = '\uFEFF'; // Excel UTF-8 BOM
  const isSuperAdmin = actor?.roles?.includes('SUPER_ADMIN');
  const isCompanyAdmin = actor?.roles?.includes('COMPANY_ADMIN') || actor?.roles?.includes('ADMIN');

  const tenantFilter: any = !isSuperAdmin && actor?.tenantId ? { tenantId: actor.tenantId } : {};
  const branchFilter: any = !isSuperAdmin && !isCompanyAdmin && actor?.branchId ? { branchId: actor.branchId } : {};

  const { from, to } = resolveDateRange(options?.dateFilter, options?.startDate, options?.endDate);
  const createdDateFilter = from || to ? {
    createdAt: {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    },
  } : {};
  const paymentDateFilter = from || to ? {
    paidAt: {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    },
  } : {};

  if (type === 'loans') {
    const loans = await prisma.loan.findMany({
      where: {
        ...tenantFilter,
        ...branchFilter,
        ...createdDateFilter,
      },
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
      where: {
        ...createdDateFilter,
        ...(tenantFilter.tenantId ? { loan: { tenantId: tenantFilter.tenantId } } : {}),
        ...(branchFilter.branchId ? { loan: { branchId: branchFilter.branchId } } : {}),
      },
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
      where: {
        ...paymentDateFilter,
        ...(tenantFilter.tenantId ? { tenantId: tenantFilter.tenantId } : {}),
        ...(branchFilter.branchId ? { loan: { branchId: branchFilter.branchId } } : {}),
      },
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
    const caseDateFilter = from || to ? {
      OR: [
        { updatedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } },
        { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } },
      ],
    } : {};

    const cases = await prisma.collectionCase.findMany({
      where: {
        ...caseDateFilter,
        ...(tenantFilter.tenantId ? { loan: { tenantId: tenantFilter.tenantId } } : {}),
        ...(branchFilter.branchId ? { loan: { branchId: branchFilter.branchId } } : {}),
      },
      include: {
        customer: { select: { firstName: true, lastName: true, customerCode: true, mobile: true } },
        loan: { select: { loanNo: true, emiAmount: true } },
        promises: { take: 1, orderBy: { createdAt: 'desc' } },
        activities: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { dpd: 'desc' },
    });

    const headers = [
      'Collection Case #',
      'Loan Account #',
      'Customer ID',
      'Borrower Name',
      'Mobile',
      'EMI Amount (INR)',
      'Overdue Amount (INR)',
      'DPD (Days Past Due)',
      'Aging Bucket',
      'Priority',
      'Case Status',
      'PTP Promised Date',
      'PTP Amount (INR)',
      'PTP Status',
      'Last Follow-Up Date',
      'Next Follow-Up Date',
      'Last Updated',
    ];

    const rows = cases.map((c) => [
      c.caseNo,
      c.loan?.loanNo || '-',
      c.customer?.customerCode || '-',
      `"${c.customer?.firstName || ''} ${c.customer?.lastName || ''}"`,
      `"${c.customer?.mobile || ''}"`,
      c.loan?.emiAmount ? Number(c.loan.emiAmount).toFixed(2) : '0.00',
      c.overdueAmount.toFixed(2),
      c.dpd,
      c.agingBucket,
      c.priority,
      c.status,
      c.promises[0]?.promisedDate ? c.promises[0].promisedDate.toISOString().split('T')[0] : 'N/A',
      c.promises[0]?.promisedAmount ? Number(c.promises[0].promisedAmount).toFixed(2) : '0.00',
      c.promises[0]?.status || 'NONE',
      c.activities[0]?.createdAt ? c.activities[0].createdAt.toISOString().split('T')[0] : 'N/A',
      c.activities[0]?.nextFollowUpDate ? c.activities[0].nextFollowUpDate.toISOString().split('T')[0] : 'N/A',
      c.updatedAt.toISOString().split('T')[0],
    ]);

    return BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  return BOM + 'No report data';
}
