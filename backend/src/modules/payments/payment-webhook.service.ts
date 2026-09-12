import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { SandboxPaymentProvider } from './sandbox-payment-provider';
import { paymentAllocationService } from './payment-allocation.service';
import { generalLedgerService } from '../finance/gl.service';
import { paymentDisputeService } from './payment-dispute.service';
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

    if (loanId && amount > 0) {
      const allocation = await paymentAllocationService.allocatePayment({
        paymentId: paymentId || `pay_wh_${Date.now()}`,
        paymentNo: payload.paymentNo || payload.reference || `PN-${Date.now()}`,
        loanId,
        amount,
      });

      return `Payment captured and allocated: ₹${amount} allocated to loan ${loanId} (Schedule items updated: ${allocation.scheduleItemsUpdatedCount}).`;
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
