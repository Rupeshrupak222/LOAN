import { v4 as uuid } from 'uuid';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { generalLedgerService } from '../finance/gl.service';
import { logAudit } from '../audit/audit.service';
import type { PaymentDispute, DisputeStatus, DisputeType } from './payment.types';

export interface CreateDisputeInput {
  tenantId?: string;
  paymentId: string;
  paymentNo: string;
  type: DisputeType;
  amount: number;
  reason: string;
  loanId?: string;
  loanNo?: string;
}

export interface ResolveDisputeInput {
  status: 'RESOLVED' | 'CLOSED';
  resolutionNotes: string;
  acceptChargeback?: boolean;
}

export interface ActorContext {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
}

const inMemoryDisputes: PaymentDispute[] = [];

export class PaymentDisputeService {
  /**
   * Create new dispute or gateway chargeback
   */
  public async createDispute(input: CreateDisputeInput, actor?: ActorContext): Promise<PaymentDispute> {
    if (input.amount <= 0) {
      throw new BadRequestError('Dispute amount must be greater than zero.');
    }

    const dispute: PaymentDispute = {
      id: `DISP-${uuid().slice(0, 8).toUpperCase()}`,
      disputeNo: `DN-${Date.now().toString().slice(-8)}`,
      tenantId: input.tenantId || actor?.tenantId || 'tenant-adyapan-default',
      paymentId: input.paymentId,
      paymentNo: input.paymentNo,
      type: input.type,
      amount: input.amount,
      reason: input.reason,
      status: 'OPEN',
      evidence: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryDisputes.push(dispute);

    await logAudit({
      userId: actor?.id,
      action: 'PAYMENT_DISPUTE_CREATED',
      entity: 'PaymentDispute',
      entityId: dispute.id,
      newValue: dispute,
    });

    return dispute;
  }

  /**
   * List disputes with optional filters
   */
  public listDisputes(params?: {
    tenantId?: string;
    paymentId?: string;
    status?: DisputeStatus;
    type?: DisputeType;
  }): PaymentDispute[] {
    let list = [...inMemoryDisputes];

    if (params?.tenantId) {
      list = list.filter((d) => d.tenantId === params.tenantId);
    }
    if (params?.paymentId) {
      list = list.filter((d) => d.paymentId === params.paymentId);
    }
    if (params?.status) {
      list = list.filter((d) => d.status === params.status);
    }
    if (params?.type) {
      list = list.filter((d) => d.type === params.type);
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get dispute details by ID
   */
  public getDispute(id: string, actor?: ActorContext): PaymentDispute {
    const dispute = inMemoryDisputes.find((d) => d.id === id);
    if (!dispute) throw new NotFoundError(`Dispute record not found: ${id}`);

    if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
      if (actor.tenantId && dispute.tenantId && dispute.tenantId !== actor.tenantId) {
        throw new ForbiddenError('Access forbidden: Dispute belongs to another institution');
      }
    }

    return dispute;
  }

  /**
   * Add evidence file or document to dispute
   */
  public async addEvidence(
    disputeId: string,
    evidenceItem: { type: string; title: string },
    actor?: ActorContext
  ): Promise<PaymentDispute> {
    const dispute = this.getDispute(disputeId, actor);

    if (dispute.status === 'RESOLVED' || dispute.status === 'CLOSED') {
      throw new BadRequestError('Cannot add evidence to an already closed or resolved dispute.');
    }

    const item = {
      id: `EV-${uuid().slice(0, 6).toUpperCase()}`,
      type: evidenceItem.type,
      title: evidenceItem.title,
      addedBy: actor?.email || 'SYSTEM',
      addedAt: new Date().toISOString(),
    };

    dispute.evidence.push(item);
    dispute.status = 'INVESTIGATING';
    dispute.updatedAt = new Date().toISOString();

    await logAudit({
      userId: actor?.id,
      action: 'PAYMENT_DISPUTE_EVIDENCE_ADDED',
      entity: 'PaymentDispute',
      entityId: dispute.id,
      newValue: item,
    });

    return dispute;
  }

  /**
   * Resolve or close dispute
   */
  public async resolveDispute(
    disputeId: string,
    input: ResolveDisputeInput,
    actor?: ActorContext
  ): Promise<PaymentDispute> {
    const dispute = this.getDispute(disputeId, actor);

    dispute.status = input.status;
    dispute.resolutionNotes = input.resolutionNotes;
    dispute.resolvedBy = actor?.email || 'SYSTEM_FINANCE';
    dispute.resolvedAt = new Date().toISOString();
    dispute.updatedAt = new Date().toISOString();

    // If accepting chargeback, post chargeback journal entry
    if (input.acceptChargeback && dispute.type === 'CHARGEBACK') {
      await generalLedgerService.postChargebackJournal({
        disputeId: dispute.id,
        paymentId: dispute.paymentId,
        tenantId: dispute.tenantId,
        disputeAmount: dispute.amount,
        feeAmount: 500, // Gateway chargeback administrative penalty fee
        reason: input.resolutionNotes,
        postedBy: actor?.email || 'CHARGEBACK_DISPUTE_SERVICE',
      });
    }

    await logAudit({
      userId: actor?.id,
      action: 'PAYMENT_DISPUTE_RESOLVED',
      entity: 'PaymentDispute',
      entityId: dispute.id,
      newValue: {
        status: dispute.status,
        resolutionNotes: dispute.resolutionNotes,
        acceptChargeback: input.acceptChargeback,
      },
    });

    return dispute;
  }
}

export const paymentDisputeService = new PaymentDisputeService();
