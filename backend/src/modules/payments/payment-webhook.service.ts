import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { SandboxPaymentProvider } from './sandbox-payment-provider';
import { paymentAllocationService } from './payment-allocation.service';
import { generalLedgerService } from '../finance/gl.service';
import { paymentDisputeService } from './payment-dispute.service';
import { Money } from '../finance/money';
import type { PaymentTransaction } from './payment.types';

export interface IngestedWebhookEvent {
  id: string;
  eventId: string;
  eventType: string;
  provider: string;
  payload: any;
  status: 'PROCESSED' | 'DUPLICATE' | 'FAILED' | 'IGNORED';
  responseSummary?: string;
  receivedAt: string;
  processedAt?: string;
}

const processedEventRegistry = new Map<string, IngestedWebhookEvent>();

export class PaymentWebhookService {
  private sandboxProvider = new SandboxPaymentProvider();

  /**
   * Verify HMAC-SHA256 signature for incoming webhooks
   */
  public verifySignature(
    rawPayload: string | Buffer,
    signature: string,
    secret?: string
  ): boolean {
    const payloadStr = typeof rawPayload === 'string' ? rawPayload : rawPayload.toString('utf-8');
    return this.sandboxProvider.verifyWebhookSignature(payloadStr, signature, secret);
  }

  /**
   * Ingest and process an incoming provider webhook with idempotency de-duplication
   */
  public async ingestWebhook(input: {
    eventId?: string;
    eventType: string;
    provider?: string;
    signature?: string;
    timestamp?: string | number;
    rawBody?: string;
    payload: Record<string, any>;
  }): Promise<{ success: boolean; eventId: string; status: string; message: string }> {
    const eventId =
      input.eventId ||
      input.payload.id ||
      input.payload.event_id ||
      `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const eventType = input.eventType || input.payload.event || input.payload.type || 'unknown';
    const provider = input.provider || 'SANDBOX';

    // Signature verification check if signature provided
    if (input.signature && input.rawBody) {
      const isValid = this.verifySignature(input.rawBody, input.signature);
      if (!isValid) {
        throw new BadRequestError('Invalid payment webhook signature');
      }
    }

    // Timestamp replay protection (300 seconds)
    if (input.timestamp) {
      const ts = typeof input.timestamp === 'string' ? Number(input.timestamp) : input.timestamp;
      const now = Date.now();
      const eventTimeMs = ts < 10000000000 ? ts * 1000 : ts;
      if (Math.abs(now - eventTimeMs) > 300 * 1000) {
        throw new BadRequestError('Payment webhook timestamp outside valid 300s replay window');
      }
    }

    // 1. Idempotency check: If already processed, return idempotent ACK immediately
    if (processedEventRegistry.has(eventId)) {
      const existing = processedEventRegistry.get(eventId)!;
      return {
        success: true,
        eventId,
        status: 'DUPLICATE',
        message: `Event ${eventId} has already been processed previously with status ${existing.status}.`,
      };
    }

    const eventRecord: IngestedWebhookEvent = {
      id: `WH-${uuid().slice(0, 8)}`,
      eventId,
      eventType,
      provider,
      payload: input.payload,
      status: 'PROCESSED',
      receivedAt: new Date().toISOString(),
    };

    try {
      // 2. Dispatch to specific event handlers
      let responseSummary = 'Event acknowledged';

      switch (eventType) {
        case 'payment.authorized': {
          responseSummary = await this.handlePaymentAuthorized(input.payload);
          break;
        }

        case 'payment.captured':
        case 'payment.succeeded': {
          responseSummary = await this.handlePaymentCaptured(input.payload);
          break;
        }

        case 'payment.failed': {
          responseSummary = await this.handlePaymentFailed(input.payload);
          break;
        }

        case 'refund.processed':
        case 'refund.succeeded': {
          responseSummary = await this.handleRefundProcessed(input.payload);
          break;
        }

        case 'payout.processed':
        case 'payout.succeeded': {
          responseSummary = await this.handlePayoutSucceeded(input.payload);
          break;
        }

        case 'payout.failed':
        case 'payout.reversed': {
          responseSummary = await this.handlePayoutFailed(input.payload);
          break;
        }

        case 'dispute.created': {
          responseSummary = await this.handleDisputeCreated(input.payload);
          break;
        }

        default: {
          responseSummary = `Event type ${eventType} registered and stored without active handler.`;
          eventRecord.status = 'IGNORED';
          break;
        }
      }

      eventRecord.responseSummary = responseSummary;
      eventRecord.processedAt = new Date().toISOString();
      processedEventRegistry.set(eventId, eventRecord);

      await logAudit({
        action: 'PAYMENT_WEBHOOK_PROCESSED',
        entity: 'PaymentWebhook',
        entityId: eventId,
        newValue: { eventType, provider, summary: responseSummary },
      });

      return {
        success: true,
        eventId,
        status: eventRecord.status,
        message: responseSummary,
      };
    } catch (err: any) {
      eventRecord.status = 'FAILED';
      eventRecord.responseSummary = err.message || 'Webhook processing failed';
      eventRecord.processedAt = new Date().toISOString();
      processedEventRegistry.set(eventId, eventRecord);

      return {
        success: false,
        eventId,
        status: 'FAILED',
        message: err.message || 'Error processing webhook event',
      };
    }
  }

  /**
   * List recorded webhook events
   */
  public listWebhookEvents(): IngestedWebhookEvent[] {
    return Array.from(processedEventRegistry.values()).sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
  }

  // --- PRIVATE EVENT HANDLERS ---

  private async handlePaymentAuthorized(payload: any): Promise<string> {
    const paymentId = payload.paymentId || payload.payment_id || payload.orderId;
    return `Payment ${paymentId} authorized in gateway.`;
  }

  private async handlePaymentCaptured(payload: any): Promise<string> {
    const paymentId = payload.paymentId || payload.id;
    const loanId = payload.loanId;
    const amount = Number(payload.amount || payload.captured_amount || 0);

    // If payment record in DB exists, check if already SUCCESS
    if (paymentId) {
      const dbPayment = await prisma.payment.findFirst({
        where: { OR: [{ id: paymentId }, { reference: paymentId }, { paymentNo: payload.paymentNo }] },
        include: { loan: true },
      });
      if (dbPayment) {
        if (dbPayment.status === 'SUCCESS') {
          return `Payment ${dbPayment.paymentNo} already allocated and completed.`;
        }
        const payAmount = amount > 0 ? amount : dbPayment.amount.toNumber();
        const allocation = await paymentAllocationService.allocatePayment({
          paymentId: dbPayment.id,
          paymentNo: dbPayment.paymentNo,
          loanId: dbPayment.loanId,
          amount: payAmount,
        });

        await generalLedgerService.postRepaymentJournal({
          loanId: dbPayment.loanId,
          loanNo: dbPayment.loan.loanNo,
          paymentNo: dbPayment.paymentNo,
          tenantId: dbPayment.tenantId || undefined,
          totalAmount: payAmount,
          allocatedPrincipal: allocation.allocatedPrincipal,
          allocatedInterest: allocation.allocatedInterest,
          allocatedFees: allocation.allocatedFees,
          allocatedPenalties: allocation.allocatedPenalties,
          excessRefund: allocation.allocatedExcess,
          receivedBy: 'WEBHOOK_PAYMENT_GATEWAY',
        });

        await prisma.payment.update({
          where: { id: dbPayment.id },
          data: {
            status: 'SUCCESS',
            paidAt: new Date(),
            reference: payload.utr || payload.reference || dbPayment.reference,
          },
        });

        return `Payment ${dbPayment.paymentNo} captured and allocated: ₹${payAmount} allocated to loan ${dbPayment.loanId}.`;
      }
    }

    if (loanId && amount > 0) {
      const loan = await prisma.loan.findUnique({ where: { id: loanId } });
      if (loan) {
        const paymentNo = payload.paymentNo || payload.reference || `PN-${Date.now()}`;
        const newPayment = await prisma.payment.create({
          data: {
            paymentNo,
            loanId: loan.id,
            customerId: loan.customerId,
            tenantId: loan.tenantId,
            amount: Money.toDb(amount),
            method: 'GATEWAY',
            reference: payload.utr || payload.reference || payload.id || `WH-${Date.now()}`,
            status: 'SUCCESS',
            paidAt: new Date(),
          },
        });

        const allocation = await paymentAllocationService.allocatePayment({
          paymentId: newPayment.id,
          paymentNo,
          loanId,
          amount,
        });

        await generalLedgerService.postRepaymentJournal({
          loanId,
          loanNo: loan.loanNo,
          paymentNo,
          tenantId: loan.tenantId || undefined,
          totalAmount: amount,
          allocatedPrincipal: allocation.allocatedPrincipal,
          allocatedInterest: allocation.allocatedInterest,
          allocatedFees: allocation.allocatedFees,
          allocatedPenalties: allocation.allocatedPenalties,
          excessRefund: allocation.allocatedExcess,
          receivedBy: 'WEBHOOK_PAYMENT_GATEWAY',
        });

        return `Payment captured and allocated: ₹${amount} allocated to loan ${loanId} (Schedule items updated: ${allocation.scheduleItemsUpdatedCount}).`;
      }
    }

    return `Payment ${paymentId} captured.`;
  }

  private async handlePaymentFailed(payload: any): Promise<string> {
    const paymentId = payload.paymentId || payload.id;
    const reason = payload.failureReason || payload.error_description || 'Payment failed at gateway';
    return `Payment ${paymentId} marked as failed: ${reason}`;
  }

  private async handleRefundProcessed(payload: any): Promise<string> {
    const refundId = payload.refundId || payload.id;
    const amount = Number(payload.amount || 0);
    const paymentId = payload.paymentId;

    if (paymentId && amount > 0) {
      await generalLedgerService.postRefundJournal({
        paymentId,
        refundId,
        refundAmount: amount,
        reason: payload.reason || 'Webhook triggered refund confirmation',
        postedBy: 'WEBHOOK_REFUND_ENGINE',
      });
    }

    return `Refund ${refundId} confirmed for payment ${paymentId}.`;
  }

  private async handlePayoutSucceeded(payload: any): Promise<string> {
    const payoutId = payload.payoutId || payload.id;
    const utr = payload.utrNumber || payload.utr;
    return `Payout ${payoutId} succeeded with UTR ${utr}.`;
  }

  private async handlePayoutFailed(payload: any): Promise<string> {
    const payoutId = payload.payoutId || payload.id;
    const reason = payload.failureReason || 'Payout routing failed';
    return `Payout ${payoutId} failed: ${reason}`;
  }

  private async handleDisputeCreated(payload: any): Promise<string> {
    const dispute = await paymentDisputeService.createDispute({
      paymentId: payload.paymentId || payload.id,
      paymentNo: payload.paymentNo || 'PN-UNKNOWN',
      type: 'CHARGEBACK',
      amount: Number(payload.amount || 0),
      reason: payload.reason || 'Customer raised dispute via bank',
    });

    return `Dispute ${dispute.disputeNo} created for payment ${dispute.paymentId}.`;
  }
}

export const paymentWebhookService = new PaymentWebhookService();
