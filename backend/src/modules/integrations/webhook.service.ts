import { v4 as uuid } from 'uuid';
import { integrationHub } from './integration-hub.service';
import { IntegrationHubError } from './integration.errors';
import { WebhookEventPayload } from './integration.types';
import { logAudit } from '../audit/audit.service';

export class WebhookService {
  private static instance: WebhookService;
  // Deduplication cache: eventId -> timestamp
  private readonly processedEvents = new Map<string, number>();
  private readonly eventTtlMs = 7 * 24 * 60 * 60 * 1000; // 7 days

  private constructor() {
    setInterval(() => this.cleanup(), 60 * 60 * 1000).unref();
  }

  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  /**
   * Process inbound webhook event from external provider.
   */
  public async handleWebhook(payload: WebhookEventPayload): Promise<{
    acknowledged: boolean;
    status: 'PROCESSED' | 'DUPLICATE' | 'REJECTED';
    eventId: string;
    correlationId: string;
    message?: string;
  }> {
    const correlationId = integrationHub.generateCorrelationId();

    // 1. Resolve Provider Adapter
    const adapter = integrationHub.getAdapter(payload.providerId);
    if (!adapter) {
      throw new IntegrationHubError(
        404,
        'PROVIDER_NOT_CONFIGURED',
        `No registered provider found for webhook '${payload.providerId}'`,
        { correlationId }
      );
    }

    // 2. Signature Verification
    if (adapter.verifyWebhookSignature) {
      const isValid = adapter.verifyWebhookSignature(payload.rawBody, payload.signature);
      if (!isValid) {
        await logAudit({
          action: 'INTEGRATION_WEBHOOK_REJECTED',
          entity: 'IntegrationWebhook',
          entityId: payload.providerId,
          newValue: {
            reason: 'SIGNATURE_INVALID',
            eventId: payload.eventId,
          },
          correlationId,
        }).catch(() => {});

        throw new IntegrationHubError(
          401,
          'WEBHOOK_SIGNATURE_INVALID',
          `Webhook HMAC signature validation failed for provider '${payload.providerId}'`,
          { correlationId, isRetryable: false }
        );
      }
    }

    // 3. Deduplication Check (Replay Protection)
    const eventKey = `${payload.providerId}:${payload.eventId}`;
    const now = Date.now();

    if (this.processedEvents.has(eventKey)) {
      return {
        acknowledged: true,
        status: 'DUPLICATE',
        eventId: payload.eventId,
        correlationId,
        message: 'Webhook event previously received and processed. Ignored duplicate.',
      };
    }

    // 4. Record event as processed
    this.processedEvents.set(eventKey, now);

    // 5. Audit Logging (Zero secrets)
    await logAudit({
      action: 'INTEGRATION_WEBHOOK_RECEIVED',
      entity: 'IntegrationWebhook',
      entityId: payload.providerId,
      newValue: {
        eventType: payload.eventType,
        eventId: payload.eventId,
        receivedAt: payload.receivedAt,
      },
      correlationId,
    }).catch(() => {});

    // NOTE: Financial safety invariant:
    // Webhook does NOT directly alter the loan or ledger.
    // The core LMS services perform authoritative business verification.
    return {
      acknowledged: true,
      status: 'PROCESSED',
      eventId: payload.eventId,
      correlationId,
      message: 'Webhook acknowledged and logged for authoritative LMS processing.',
    };
  }

  private cleanup() {
    const cutoff = Date.now() - this.eventTtlMs;
    for (const [key, ts] of this.processedEvents.entries()) {
      if (ts < cutoff) {
        this.processedEvents.delete(key);
      }
    }
  }

  public clearForTesting() {
    this.processedEvents.clear();
  }
}

export const webhookService = WebhookService.getInstance();
