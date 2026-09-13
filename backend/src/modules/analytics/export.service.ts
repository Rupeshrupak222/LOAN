// Phase 14: Server-Side Export Engine

import { prisma } from '../../config/prisma';
import { ForbiddenError, BadRequestError } from '../../common/errors';
import { analyticsService } from './analytics.service';
import { AnalyticsActorContext, ExportReportRequest } from './analytics.types';
import { logAudit } from '../audit/audit.service';

export class ExportService {
  private static instance: ExportService;

  private constructor() {}

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Helper to mask PII (e.g., mobile numbers and email addresses).
   */
  private maskMobile(mobile?: string | null): string {
    if (!mobile || mobile.length < 5) return 'XXXXX-XXXXX';
    return `${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}`;
  }

  private maskEmail(email?: string | null): string {
    if (!email || !email.includes('@')) return 'xxx@domain.com';
    const [name, domain] = email.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  }

  /**
   * Converts array of objects to CSV string.
   */
  private convertToCsv(rows: Record<string, any>[], defaultHeaders: string[] = []): string {
    if (rows.length === 0) {
      return defaultHeaders.length > 0 ? defaultHeaders.join(',') + '\n' : 'No records found\n';
    }
    const headers = Object.keys(rows[0]);
    const headerLine = headers.join(',');
    const dataLines = rows.map((r) =>
      headers
        .map((h) => {
          const val = r[h] !== undefined && r[h] !== null ? String(r[h]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    return [headerLine, ...dataLines].join('\n');
  }

  /**
   * Executes and exports report dataset to CSV string with audit and PII masking.
   */
  public async exportToCsv(actor: AnalyticsActorContext, req: ExportReportRequest): Promise<{ csv: string; filename: string; rowCount: number }> {
    const roles = actor.roles || [];
    if (roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access Forbidden: Borrowers are not permitted to export institutional reporting data.');
    }

    const isAuditorOrAdmin = roles.includes('SUPER_ADMIN') || roles.includes('COMPANY_ADMIN') || roles.includes('AUDITOR');
    const shouldMaskPii = req.maskPii !== false && !isAuditorOrAdmin;

    const { tenantFilter, branchFilter, partnerFilter } = analyticsService.buildSecurityScope(actor, req.filters);
    const { from, to } = analyticsService.resolveDateRange(req.filters);
    const dateFilter = from && to ? { createdAt: { gte: from, lte: to } } : {};

    const MAX_EXPORT_ROWS = 5000;
    let exportRows: Record<string, any>[] = [];
    const reportType = req.reportType.toUpperCase();

    switch (reportType) {
      case 'LOANS': {
        const loans = await prisma.loan.findMany({
          where: {
            ...tenantFilter,
            ...branchFilter,
            ...partnerFilter,
            ...(req.filters?.loanStatus ? { status: req.filters.loanStatus as any } : {}),
          },
          take: MAX_EXPORT_ROWS,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { firstName: true, lastName: true, mobile: true, email: true } },
            product: { select: { name: true, code: true } },
            branch: { select: { name: true } },
          },
        });

        exportRows = loans.map((l) => ({
          'Loan Account No': l.loanNo,
          'Borrower Name': l.customer ? `${l.customer.firstName} ${l.customer.lastName}` : 'Direct Customer',
          'Borrower Mobile': shouldMaskPii ? this.maskMobile(l.customer?.mobile) : l.customer?.mobile || '',
          'Borrower Email': shouldMaskPii ? this.maskEmail(l.customer?.email) : l.customer?.email || '',
          'Product Name': l.product?.name || 'Standard Loan',
          'Branch Name': l.branch?.name || 'Main Branch',
          'Sanctioned Principal': Number(l.principal || 0),
          'Outstanding Principal': Number(l.outstandingPrincipal || 0),
          'Interest Rate (%)': Number(l.interestRate || 0),
          'Loan Status': l.status,
          'Created Date': new Date(l.createdAt).toISOString().split('T')[0],
        }));
        break;
      }

      case 'DISBURSEMENTS': {
        const disbursements = await prisma.disbursement.findMany({
          where: {
            ...dateFilter,
            ...(tenantFilter.tenantId ? { loan: { tenantId: tenantFilter.tenantId } } : {}),
            ...(branchFilter.branchId ? { loan: { branchId: branchFilter.branchId } } : {}),
          },
          take: MAX_EXPORT_ROWS,
          orderBy: { createdAt: 'desc' },
          include: {
            loan: {
              select: {
                loanNo: true,
                customer: { select: { firstName: true, lastName: true, mobile: true } },
                product: { select: { name: true } },
              },
            },
          },
        });

        exportRows = disbursements.map((d) => ({
          'Disbursement Ref': d.reference || d.id,
          'Loan Account No': d.loan?.loanNo || '—',
          'Beneficiary Name': d.loan?.customer ? `${d.loan.customer.firstName} ${d.loan.customer.lastName}` : 'Beneficiary',
          'Beneficiary Mobile': shouldMaskPii ? this.maskMobile(d.loan?.customer?.mobile) : d.loan?.customer?.mobile || '',
          'Product': d.loan?.product?.name || 'Loan',
          'Disbursed Amount': Number(d.amount || 0),
          'Transfer Method': d.method,
          'Status': d.status,
          'Disbursed At': new Date(d.createdAt).toISOString(),
        }));
        break;
      }

      case 'PAYMENTS':
      case 'REPAYMENTS': {
        const payments = await prisma.payment.findMany({
          where: {
            ...dateFilter,
            ...(tenantFilter.tenantId ? { tenantId: tenantFilter.tenantId } : {}),
            ...(branchFilter.branchId ? { loan: { branchId: branchFilter.branchId } } : {}),
          },
          take: MAX_EXPORT_ROWS,
          orderBy: { createdAt: 'desc' },
          include: {
            loan: {
              select: {
                loanNo: true,
                customer: { select: { firstName: true, lastName: true } },
              },
            },
          },
        });

        exportRows = payments.map((p) => ({
          'Payment Ref': p.reference || p.paymentNo || p.id,
          'Loan Account No': p.loan?.loanNo || '—',
          'Borrower Name': p.loan?.customer ? `${p.loan.customer.firstName} ${p.loan.customer.lastName}` : 'Customer',
          'Total Amount Paid': Number(p.amount || 0),
          'Payment Method': p.method,
          'Payment Status': p.status,
          'Paid At': p.paidAt ? new Date(p.paidAt).toISOString() : new Date(p.createdAt).toISOString(),
        }));
        break;
      }

      case 'APPLICATIONS': {
        const applications = await prisma.loanApplication.findMany({
          where: {
            ...tenantFilter,
            ...branchFilter,
            ...partnerFilter,
            ...dateFilter,
          },
          take: MAX_EXPORT_ROWS,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { firstName: true, lastName: true, mobile: true, email: true } },
            product: { select: { name: true } },
            branch: { select: { name: true } },
            riskAssessment: { select: { category: true, score: true } },
          },
        });

        exportRows = applications.map((a) => ({
          'Application No': a.applicationNo,
          'Applicant Name': a.customer ? `${a.customer.firstName} ${a.customer.lastName}` : 'Applicant',
          'Applicant Mobile': shouldMaskPii ? this.maskMobile(a.customer?.mobile) : a.customer?.mobile || '',
          'Product': a.product?.name || 'Loan',
          'Branch': a.branch?.name || 'Main Branch',
          'Requested Amount': Number(a.requestedAmount || 0),
          'Status': a.status,
          'Risk Grade': a.riskAssessment?.category || 'B',
          'Risk Score': a.riskAssessment?.score || 700,
          'Applied Date': new Date(a.createdAt).toISOString().split('T')[0],
        }));
        break;
      }

      case 'COLLECTIONS': {
        const cases = await prisma.collectionCase.findMany({
          where: {
            ...(tenantFilter.tenantId ? { loan: { tenantId: tenantFilter.tenantId } } : {}),
            ...(branchFilter.branchId ? { loan: { branchId: branchFilter.branchId } } : {}),
          },
          take: MAX_EXPORT_ROWS,
          include: {
            customer: { select: { firstName: true, lastName: true } },
          },
        });

        exportRows = cases.map((c) => ({
          'Case ID': c.id,
          'Case No': c.caseNo,
          'Loan ID': c.loanId,
          'Borrower': c.customer ? `${c.customer.firstName} ${c.customer.lastName}` : 'Borrower',
          'DPD': c.dpd || 0,
          'Aging Bucket': c.agingBucket || 'CURRENT',
          'Total Overdue': Number(c.overdueAmount || 0),
          'Case Status': c.status,
          'Assigned Officer': c.assignedOfficerId || 'Unassigned',
        }));
        break;
      }

      default:
        throw new BadRequestError(`Unsupported export report type '${reportType}'. Supported types: LOANS, DISBURSEMENTS, REPAYMENTS, APPLICATIONS, COLLECTIONS.`);
    }

    const csv = this.convertToCsv(exportRows, ['Loan Account No', 'Borrower Name', 'Product Name', 'Status', 'Date']);
    const filename = `Adyapan_${reportType}_Export_${new Date().toISOString().split('T')[0]}.csv`;

    await logAudit({
      userId: actor.id,
      role: actor.roles?.[0] || 'USER',
      tenantId: actor.tenantId,
      action: 'REPORT_EXPORTED',
      entity: 'AnalyticsExport',
      newValue: { reportType, rowCount: exportRows.length, masked: shouldMaskPii },
    }).catch(() => {});

    return {
      csv,
      filename,
      rowCount: exportRows.length,
    };
  }
}

export const exportService = ExportService.getInstance();
