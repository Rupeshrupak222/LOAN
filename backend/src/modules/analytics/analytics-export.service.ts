import { AnalyticsActorContext, ReportBuilderQuery } from './analytics.types';
import { reportBuilderService } from './report-builder.service';
import { logAudit } from '../audit/audit.service';
import { ForbiddenError, BadRequestError } from '../../common/errors';

export class AnalyticsExportService {
  private static instance: AnalyticsExportService;

  private readonly MAX_EXPORT_ROWS = 50000;

  public static getInstance(): AnalyticsExportService {
    if (!AnalyticsExportService.instance) {
      AnalyticsExportService.instance = new AnalyticsExportService();
    }
    return AnalyticsExportService.instance;
  }

  /**
   * Masks sensitive PII fields (PAN, Aadhaar, Phone, Email, Bank A/C)
   */
  public maskPii(value: any, fieldName: string, unmaskAuthorized: boolean): string {
    if (value === null || value === undefined) return '';
    const str = String(value).trim();
    if (unmaskAuthorized || str.length === 0) return str;

    const lowerField = fieldName.toLowerCase();

    // 1. Phone number masking (e.g. +91 9876543210 -> +91 98****3210)
    if (lowerField.includes('phone') || lowerField.includes('mobile') || lowerField.includes('contact')) {
      if (str.startsWith('+91 ') && str.length >= 14) {
        return `+91 ${str.slice(4, 6)}****${str.slice(-4)}`;
      }
      if (str.length >= 10) {
        return `${str.slice(0, 4)}****${str.slice(-4)}`;
      }
      return '****';
    }

    // 2. Email masking (e.g. rahul.sharma@example.com -> r***a@example.com)
    if (lowerField.includes('email')) {
      const parts = str.split('@');
      if (parts.length === 2 && parts[0].length >= 2) {
        const username = parts[0];
        return `${username[0]}***${username[username.length - 1]}@${parts[1]}`;
      }
      return '***@***.com';
    }

    // 3. PAN Card (e.g. ABCDE1234F -> ABCDE****F)
    if (lowerField.includes('pan') || lowerField.includes('taxid')) {
      if (str.length === 10) {
        return `${str.slice(0, 5)}****${str.slice(9)}`;
      }
      return '*****';
    }

    // 4. Aadhaar / National ID (e.g. 123456789012 -> ********9012)
    if (lowerField.includes('aadhaar') || lowerField.includes('nationalid')) {
      if (str.length >= 4) {
        return `********${str.slice(-4)}`;
      }
      return '********';
    }

    // 5. Bank Account Number (e.g. 918237461928 -> *******61928)
    if (lowerField.includes('accountnumber') || lowerField.includes('bankaccount')) {
      if (str.length >= 5) {
        return `*******${str.slice(-5)}`;
      }
      return '*******';
    }

    return str;
  }

  /**
   * Generates a streamed / sanitized CSV file content from dynamic report queries.
   */
  public async exportReportToCsv(
    actor: AnalyticsActorContext,
    query: ReportBuilderQuery,
    options?: { unmaskPii?: boolean }
  ): Promise<{ filename: string; contentType: string; csvContent: string; rowCount: number }> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Customers cannot export internal MIS reports.');
    }

    const unmaskAuthorized = Boolean(
      options?.unmaskPii &&
      actor.roles.some((r) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AUDITOR'].includes(r))
    );

    // Limit execution to max export limit
    const exportQuery: ReportBuilderQuery = {
      ...query,
      page: 1,
      limit: Math.min(query.limit || this.MAX_EXPORT_ROWS, this.MAX_EXPORT_ROWS),
    };

    const result = await reportBuilderService.executeReportQuery(actor, exportQuery);

    if (result.rows.length === 0) {
      throw new BadRequestError('No records found to export for the given report filters.');
    }

    const headers = Object.keys(result.rows[0]);
    const csvLines: string[] = [];

    // Header line
    csvLines.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

    // Data rows with PII masking & CSV escaping
    for (const row of result.rows) {
      const line = headers.map((h) => {
        const val = row[h];
        const masked = this.maskPii(val, h, unmaskAuthorized);
        return `"${masked.replace(/"/g, '""')}"`;
      });
      csvLines.push(line.join(','));
    }

    // Add Summary Row
    if (Object.keys(result.summaryTotals).length > 0) {
      const summaryLine = headers.map((h) => {
        if (result.summaryTotals[h] !== undefined) {
          return `"${result.summaryTotals[h]}"`;
        }
        if (h === headers[0]) return '"TOTAL"';
        return '""';
      });
      csvLines.push(summaryLine.join(','));
    }

    const csvContent = csvLines.join('\r\n');
    const timestamp = new Date().toISOString().slice(0, 10);
    const sanitizedTitle = (result.title || 'report').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `${sanitizedTitle}_${timestamp}.csv`;

    // Audit log the export
    await logAudit({
      userId: actor.id || actor.userId || 'user',
      tenantId: actor.tenantId || 'tenant-adyapan-default',
      action: 'EXPORT_MIS_REPORT_CSV',
      entity: 'MIS_REPORT',
      entityId: result.title,
      newValue: {
        filename,
        rowCount: result.rows.length,
        dimensions: result.dimensions,
        metrics: result.metrics,
        piiMasked: !unmaskAuthorized,
      },
    });

    return {
      filename,
      contentType: 'text/csv; charset=utf-8',
      csvContent,
      rowCount: result.rows.length,
    };
  }
}

export const analyticsExportService = AnalyticsExportService.getInstance();
