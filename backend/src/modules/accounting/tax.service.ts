import Decimal from 'decimal.js';
import { v4 as uuid } from 'uuid';
import {
  TaxEntryRecord,
  TaxPeriodSummaryReport,
  TaxType,
} from './accounting.types';
import { BadRequestError } from '../../common/errors';
import { generalLedgerService } from '../finance/gl.service';
import { accountingPeriodService } from './accounting-period.service';
import { logAudit } from '../audit/audit.service';
import { JournalEntryLine } from '../finance/gl.types';

export class TaxService {
  private taxEntries: Map<string, TaxEntryRecord> = new Map();

  /**
   * Calculate GST Breakdown (Intra-state CGST+SGST vs Inter-state IGST)
   */
  public calculateGst(taxableAmount: number, isInterstate: boolean = false, ratePct: number = 18): {
    taxableAmount: number;
    taxRatePct: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalTaxAmount: number;
  } {
    const base = new Decimal(taxableAmount);
    const rate = new Decimal(ratePct).dividedBy(100);
    const totalTax = base.times(rate);

    if (isInterstate) {
      return {
        taxableAmount: base.toNumber(),
        taxRatePct: ratePct,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: totalTax.toNumber(),
        totalTaxAmount: totalTax.toNumber(),
      };
    } else {
      const halfRate = new Decimal(ratePct).dividedBy(200);
      const halfTax = base.times(halfRate);
      return {
        taxableAmount: base.toNumber(),
        taxRatePct: ratePct,
        cgstAmount: halfTax.toNumber(),
        sgstAmount: halfTax.toNumber(),
        igstAmount: 0,
        totalTaxAmount: totalTax.toNumber(),
      };
    }
  }

  /**
   * Record Output GST Liability on fee / platform revenues
   */
  public async recordOutputGst(params: {
    tenantId: string;
    referenceType: string;
    referenceId: string;
    taxableAmount: number;
    isInterstate?: boolean;
    taxRatePct?: number;
    transactionDate?: string;
    userId?: string;
  }): Promise<TaxEntryRecord> {
    if (params.taxableAmount <= 0) {
      throw new BadRequestError('Taxable amount must be strictly positive.');
    }

    const txDate = params.transactionDate || new Date().toISOString();
    accountingPeriodService.assertPeriodOpenForDate(txDate, params.tenantId);

    const taxPeriod = txDate.slice(0, 7);
    const gst = this.calculateGst(params.taxableAmount, params.isInterstate, params.taxRatePct || 18);

    const id = `TAX-${uuid().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    const record: TaxEntryRecord = {
      id,
      tenantId: params.tenantId,
      taxPeriod,
      taxType: 'GST_OUTPUT_FEE',
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      taxableAmount: gst.taxableAmount,
      taxRatePct: gst.taxRatePct,
      cgstAmount: gst.cgstAmount,
      sgstAmount: gst.sgstAmount,
      igstAmount: gst.igstAmount,
      totalTaxAmount: gst.totalTaxAmount,
      transactionDate: txDate,
      createdAt: now,
    };

    this.taxEntries.set(id, record);

    logAudit({
      tenantId: params.tenantId,
      userId: params.userId || 'SYSTEM_TAX_ENGINE',
      action: 'TAX_OUTPUT_RECORDED',
      entity: 'TaxEntry',
      entityId: id,
      newValue: { taxPeriod, taxableAmount: gst.taxableAmount, totalTaxAmount: gst.totalTaxAmount },
    });

    return record;
  }

  /**
   * Record Input GST on vendor expense invoices
   */
  public async recordInputGst(params: {
    tenantId: string;
    referenceType: string;
    referenceId: string;
    taxableAmount: number;
    isInterstate?: boolean;
    taxRatePct?: number;
    transactionDate?: string;
    userId?: string;
  }): Promise<TaxEntryRecord> {
    if (params.taxableAmount <= 0) {
      throw new BadRequestError('Taxable amount must be strictly positive.');
    }

    const txDate = params.transactionDate || new Date().toISOString();
    const taxPeriod = txDate.slice(0, 7);
    const gst = this.calculateGst(params.taxableAmount, params.isInterstate, params.taxRatePct || 18);

    const id = `TAX-IN-${uuid().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    const record: TaxEntryRecord = {
      id,
      tenantId: params.tenantId,
      taxPeriod,
      taxType: 'GST_INPUT_VENDOR',
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      taxableAmount: gst.taxableAmount,
      taxRatePct: gst.taxRatePct,
      cgstAmount: gst.cgstAmount,
      sgstAmount: gst.sgstAmount,
      igstAmount: gst.igstAmount,
      totalTaxAmount: gst.totalTaxAmount,
      transactionDate: txDate,
      createdAt: now,
    };

    this.taxEntries.set(id, record);
    return record;
  }

  /**
   * Generate GSTR-style Tax Period Summary (Output GST, Input ITC, and Net Payable)
   */
  public getTaxPeriodSummary(params: {
    tenantId?: string;
    taxPeriod: string;
  }): TaxPeriodSummaryReport {
    const tenantId = params.tenantId || 'tenant-adyapan-default';
    const entries = Array.from(this.taxEntries.values()).filter(
      (t) => (!t.tenantId || t.tenantId === tenantId) && t.taxPeriod === params.taxPeriod
    );

    let totalTaxableVolume = new Decimal(0);
    let outputCgst = new Decimal(0);
    let outputSgst = new Decimal(0);
    let outputIgst = new Decimal(0);
    let outputTotal = new Decimal(0);

    let inputCgst = new Decimal(0);
    let inputSgst = new Decimal(0);
    let inputIgst = new Decimal(0);
    let inputTotal = new Decimal(0);

    for (const e of entries) {
      if (e.taxType === 'GST_OUTPUT_FEE') {
        totalTaxableVolume = totalTaxableVolume.plus(e.taxableAmount);
        outputCgst = outputCgst.plus(e.cgstAmount);
        outputSgst = outputSgst.plus(e.sgstAmount);
        outputIgst = outputIgst.plus(e.igstAmount);
        outputTotal = outputTotal.plus(e.totalTaxAmount);
      } else if (e.taxType === 'GST_INPUT_VENDOR') {
        inputCgst = inputCgst.plus(e.cgstAmount);
        inputSgst = inputSgst.plus(e.sgstAmount);
        inputIgst = inputIgst.plus(e.igstAmount);
        inputTotal = inputTotal.plus(e.totalTaxAmount);
      }
    }

    const netGstPayable = Decimal.max(0, outputTotal.minus(inputTotal)).toNumber();

    return {
      tenantId,
      taxPeriod: params.taxPeriod,
      totalTaxableFeeVolume: totalTaxableVolume.toNumber(),
      outputGstCollected: {
        cgst: outputCgst.toNumber(),
        sgst: outputSgst.toNumber(),
        igst: outputIgst.toNumber(),
        total: outputTotal.toNumber(),
      },
      inputGstEligible: {
        cgst: inputCgst.toNumber(),
        sgst: inputSgst.toNumber(),
        igst: inputIgst.toNumber(),
        total: inputTotal.toNumber(),
      },
      netGstPayable,
    };
  }

  /**
   * List tax transaction records
   */
  public listTaxEntries(params?: {
    tenantId?: string;
    taxPeriod?: string;
    taxType?: TaxType;
    limit?: number;
  }): TaxEntryRecord[] {
    let list = Array.from(this.taxEntries.values());

    if (params?.tenantId) {
      list = list.filter((t) => t.tenantId === params.tenantId);
    }
    if (params?.taxPeriod) {
      list = list.filter((t) => t.taxPeriod === params.taxPeriod);
    }
    if (params?.taxType) {
      list = list.filter((t) => t.taxType === params.taxType);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list.slice(0, params?.limit || 100);
  }
}

export const taxService = new TaxService();
