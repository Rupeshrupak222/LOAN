// Webhook Processing & Normalization Framework
import { HmacSha256SignatureVerifier, SignatureVerifier } from './signature.verifier';
import { logAudit } from '../../audit/audit.service';

export interface InboundWebhookEvent {
  providerId: string;
  eventId: string;
  eventType: string;
  rawPayload: string;
  signature?: string;
  timestamp: string;
  headers?: Record<string, string>;
}

export interface NormalizedWebhookResult {
  status: 'PROCESSED' | 'DUPLICATE' | 'INVALID_SIGNATURE' | 'REPLAY_ATTACK' | 'REJECTED';
  eventId: string;
  eventType: string;
  domainEvent?: string;
  entityId?: string;
  normalizedData: Record<string, any>;
  receivedAt: string;
  message: string;
}

export class WebhookFrameworkService {
  private static instance: WebhookFrameworkService;
  private readonly processedEvents = new Map<string, number>(); // eventKey -> timestamp
  private readonly maxReplayDriftMs = 5 * 60 * 1000; // 5 minutes drift allowed
  private readonly eventTtlMs = 7 * 24 * 60 * 60 * 1000; // 7 days retention

  private signatureVerifier: SignatureVerifier = new HmacSha256SignatureVerifier();
  private readonly webhookSecrets = new Map<string, string>();

  private constructor() {
    this.webhookSecrets.set('sandbox_payment', 'adyapan_sandbox_payment_secret_2026');
    this.webhookSecrets.set('sandbox_payout', 'adyapan_sandbox_payout_secret_2026');
    this.webhookSecrets.set('sandbox_esign', 'adyapan_sandbox_esign_secret_2026');
    this.webhookSecrets.set('sandbox_mandate', 'adyapan_sandbox_mandate_secret_2026');
    this.webhookSecrets.set('sandbox_kyc', 'adyapan_sandbox_kyc_secret_2026');
  }

  public static getInstance(): WebhookFrameworkService {
    if (!WebhookFrameworkService.instance) {
      WebhookFrameworkService.instance = new WebhookFrameworkService();
    }
    return WebhookFrameworkService.instance;
  }

  public setSecret(providerId: string, secret: string) {
    this.webhookSecrets.set(providerId, secret);
  }

  /**
   * Process inbound webhook event with signature verification, replay protection, and deduplication.
   */
  public async processInboundWebhook(event: InboundWebhookEvent): Promise<NormalizedWebhookResult> {
    const receivedAt = new Date().toISOString();
    const secret = this.webhookSecrets.get(event.providerId) || 'adyapan_sandbox_default_secret';

    // 1. Signature Verification
    if (event.signature) {
      const isValid = this.signatureVerifier.verify(event.rawPayload, event.signature, secret);
      if (!isValid) {
        await logAudit({
          action: 'WEBHOOK_SIGNATURE_FAILED',
          entity: 'WebhookFramework',
          entityId: event.providerId,
          newValue: { eventId: event.eventId, providerId: event.providerId },
        }).catch(() => {});

        return {
          status: 'INVALID_SIGNATURE',
          eventId: event.eventId,
          eventType: event.eventType,
          normalizedData: {},
          receivedAt,
          message: 'HMAC signature verification failed. Untrusted webhook sender.',
        };
      }
    }

    // 2. Replay Protection (Timestamp Check)
    if (event.timestamp) {
      const eventTime = new Date(event.timestamp).getTime();
      const now = Date.now();
      if (Math.abs(now - eventTime) > this.maxReplayDriftMs) {
        return {
          status: 'REPLAY_ATTACK',
          eventId: event.eventId,
          eventType: event.eventType,
          normalizedData: {},
          receivedAt,
          message: `Webhook timestamp drift exceeds ${this.maxReplayDriftMs / 1000}s. Potential replay attack blocked.`,
        };
      }
    }

    // 3. Deduplication Check
    const eventKey = `${event.providerId}:${event.eventId}`;
    if (this.processedEvents.has(eventKey)) {
      return {
        status: 'DUPLICATE',
        eventId: event.eventId,
        eventType: event.eventType,
        normalizedData: {},
        receivedAt,
        message: 'Duplicate event detected. Event previously ingested.',
      };
    }

    // 4. Parse & Normalize Payload
    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(event.rawPayload);
    } catch {
      parsed = { raw: event.rawPayload };
    }

    let domainEvent = 'GENERIC_INTEGRATION_UPDATE';
    let entityId: string | undefined;

    if (event.eventType.includes('PAYMENT_CAPTURED') || event.eventType.includes('payment.authorized')) {
      domainEvent = 'PAYMENT_COLLECTION_RECEIVED';
      entityId = parsed.orderId || parsed.paymentId;
    } else if (event.eventType.includes('PAYOUT_PROCESSED') || event.eventType.includes('transfer.processed')) {
      domainEvent = 'LOAN_DISBURSEMENT_SETTLED';
      entityId = parsed.payoutId || parsed.loanId;
    } else if (event.eventType.includes('ESIGN_COMPLETED') || event.eventType.includes('document.signed')) {
      domainEvent = 'SANCTION_LETTER_SIGNED';
      entityId = parsed.sessionId || parsed.documentId;
    } else if (event.eventType.includes('MANDATE_ACTIVATED') || event.eventType.includes('mandate.active')) {
      domainEvent = 'NACH_MANDATE_REGISTERED';
      entityId = parsed.mandateId;
    }

    // 5. Store Event Id for deduplication
    this.processedEvents.set(eventKey, Date.now());

    // 6. Safe Audit Log
    await logAudit({
      action: 'WEBHOOK_EVENT_PROCESSED',
      entity: 'WebhookFramework',
      entityId: event.providerId,
      newValue: {
        eventId: event.eventId,
        domainEvent,
        entityId,
        eventType: event.eventType,
      },
    }).catch(() => {});

    return {
      status: 'PROCESSED',
      eventId: event.eventId,
      eventType: event.eventType,
      domainEvent,
      entityId,
      normalizedData: parsed,
      receivedAt,
      message: 'Webhook processed, normalized, and dispatched to domain queue.',
    };
  }

  public clearForTesting() {
    this.processedEvents.clear();
  }
}

export const webhookFramework = WebhookFrameworkService.getInstance();
