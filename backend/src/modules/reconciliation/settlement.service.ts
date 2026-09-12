import Decimal from 'decimal.js';
import { v4 as uuid } from 'uuid';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { generalLedgerService } from '../finance/gl.service';
import { logAudit } from '../audit/audit.service';

export interface SettlementBatch {
  id: string;
  batchNo: string;
  tenantId: string;
  providerCode: string;
  settlementDate: string;
  transactionCount: number;
  grossAmount: number;
  feeAmount: number;
  gstAmount: number;
  netSettledAmount: number;
  contractedMdrPct: number;
  calculatedMdrAmount: number;
  feeVariance: number;
  status: 'PENDING' | 'SETTLED' | 'DISCREPANCY';
  utrNumber?: string;
  journalEntryId?: string;
  createdAt: string;
  settledAt?: string;
  settledBy?: string;
}

export interface CreateSettlementBatchInput {
  tenantId?: string;
  providerCode: string;
  settlementDate?: string;
  transactionCount: number;
  grossAmount: number;
  deductedFees?: number;
  contractedMdrPct?: number; // e.g. 1.8%
  utrNumber?: string;
}

export interface ActorContext {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
}

const inMemoryBatches: SettlementBatch[] = [];

export class SettlementService {
  /**
   * Create and compute a settlement batch with automated fee variance checking
   */
  public async createSettlementBatch(
    input: CreateSettlementBatchInput,
    actor?: ActorContext
  ): Promise<SettlementBatch> {
    if (input.grossAmount <= 0) {
      throw new BadRequestError('Gross settlement amount must be strictly greater than zero.');
    }

    const gross = new Decimal(input.grossAmount);
    const mdrPct = new Decimal(input.contractedMdrPct ?? 1.75); // 1.75% default MDR
    const gstRate = new Decimal(0.18); // 18% statutory GST

    // Calculate expected fees
    const expectedBaseFee = gross.times(mdrPct).dividedBy(100);
    const expectedGst = expectedBaseFee.times(gstRate);
    const totalExpectedDeductions = expectedBaseFee.plus(expectedGst);

    // Actual deducted fees from gateway report
    const actualFeeAndGst = input.deductedFees !== undefined
      ? new Decimal(input.deductedFees)
      : totalExpectedDeductions;

    // Separate actual base fee and GST (18%)
    const actualBaseFee = actualFeeAndGst.dividedBy(1.18);
    const actualGst = actualFeeAndGst.minus(actualBaseFee);

    const netAmount = gross.minus(actualFeeAndGst);
    const feeVariance = actualFeeAndGst.minus(totalExpectedDeductions).toNumber();

    const batchNo = `SB-${Date.now().toString().slice(-8)}`;
    const batchId = `BATCH-${uuid().slice(0, 8).toUpperCase()}`;

    const batch: SettlementBatch = {
      id: batchId,
      batchNo,
      tenantId: input.tenantId || actor?.tenantId || 'tenant-adyapan-default',
      providerCode: input.providerCode || 'RAZORPAY',
      settlementDate: input.settlementDate || new Date().toISOString(),
      transactionCount: input.transactionCount || 1,
      grossAmount: gross.toNumber(),
      feeAmount: Number(actualBaseFee.toFixed(2)),
      gstAmount: Number(actualGst.toFixed(2)),
      netSettledAmount: Number(netAmount.toFixed(2)),
      contractedMdrPct: mdrPct.toNumber(),
      calculatedMdrAmount: Number(expectedBaseFee.toFixed(2)),
      feeVariance: Number(feeVariance.toFixed(2)),
      status: Math.abs(feeVariance) > 5.0 ? 'DISCREPANCY' : 'PENDING',
      utrNumber: input.utrNumber,
      createdAt: new Date().toISOString(),
    };

    inMemoryBatches.push(batch);

    await logAudit({
      userId: actor?.id,
      action: 'SETTLEMENT_BATCH_CREATED',
      entity: 'SettlementBatch',
      entityId: batch.id,
      newValue: batch,
    });

    return batch;
  }

  /**
   * Confirm settlement receipt and post automated Double-Entry GL Journal
   */
  public async confirmSettlement(
    batchId: string,
    params: { utrNumber?: string },
    actor?: ActorContext
  ): Promise<SettlementBatch> {
    const batch = this.getSettlementBatch(batchId, actor);

    if (batch.status === 'SETTLED') {
      return batch;
    }

    // Post double-entry settlement journal
    const journal = await generalLedgerService.postSettlementJournal({
      batchId: batch.batchNo,
      providerCode: batch.providerCode,
      tenantId: batch.tenantId,
      grossAmount: batch.grossAmount,
      feeAmount: batch.feeAmount,
      gstAmount: batch.gstAmount,
      netSettledAmount: batch.netSettledAmount,
      postedBy: actor?.email || 'SETTLEMENT_OFFICER',
    });

    batch.status = 'SETTLED';
    batch.utrNumber = params.utrNumber || batch.utrNumber || `UTR-SETTLE-${Date.now()}`;
    batch.journalEntryId = journal.id;
    batch.settledAt = new Date().toISOString();
    batch.settledBy = actor?.email || 'FINANCE_ENGINE';

    await logAudit({
      userId: actor?.id,
      action: 'SETTLEMENT_BATCH_CONFIRMED',
      entity: 'SettlementBatch',
      entityId: batch.id,
      newValue: {
        status: batch.status,
        utrNumber: batch.utrNumber,
        journalEntryId: journal.id,
      },
    });

    return batch;
  }

  /**
   * List settlement batches
   */
  public listSettlementBatches(params?: {
    tenantId?: string;
    providerCode?: string;
    status?: string;
  }): SettlementBatch[] {
    let list = [...inMemoryBatches];

    if (params?.tenantId) {
      list = list.filter((b) => b.tenantId === params.tenantId);
    }
    if (params?.providerCode) {
      list = list.filter((b) => b.providerCode === params.providerCode);
    }
    if (params?.status) {
      list = list.filter((b) => b.status === params.status);
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get single settlement batch by ID
   */
  public getSettlementBatch(id: string, actor?: ActorContext): SettlementBatch {
    const batch = inMemoryBatches.find((b) => b.id === id || b.batchNo === id);
    if (!batch) throw new NotFoundError(`Settlement batch not found: ${id}`);

    if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
      if (actor.tenantId && batch.tenantId && batch.tenantId !== actor.tenantId) {
        throw new ForbiddenError('Access forbidden: Settlement batch belongs to another institution');
      }
    }

    return batch;
  }
}

export const settlementService = new SettlementService();
