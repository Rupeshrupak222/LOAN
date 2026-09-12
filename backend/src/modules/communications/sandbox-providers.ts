import {
  ICommunicationProvider,
  ProviderSendPayload,
  ProviderSendResult,
} from './provider.interface';
import { CommunicationChannel } from './communication.types';

export class SandboxSmsProvider implements ICommunicationProvider {
  readonly channel: CommunicationChannel = 'SMS';
  readonly providerName: string = 'Sandbox-SMS-Gateway (DLT Enabled)';
  readonly isSandbox: boolean = true;

  async send(payload: ProviderSendPayload): Promise<ProviderSendResult> {
    const timestamp = new Date().toISOString();
    const externalMessageId = `SMS_SBX_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Deterministic simulation: invalid phone numbers fail
    const phone = payload.recipient.phone || payload.recipient.identifier;
    if (!phone || phone.length < 10) {
      return {
        success: false,
        externalMessageId,
        status: 'FAILED',
        sentAt: timestamp,
        errorCode: 'INVALID_DESTINATION_PHONE',
        errorMessage: `Phone number '${phone}' is invalid or missing required country code format.`,
        rawResponse: { provider: this.providerName, error: 'INVALID_PHONE', timestamp },
      };
    }

    return {
      success: true,
      externalMessageId,
      status: 'DELIVERED',
      sentAt: timestamp,
      deliveredAt: timestamp,
      rawResponse: {
        provider: this.providerName,
        carrier: 'Airtel / Jio DLT Gateway',
        status: 'DELIVRD',
        dltEntityId: '100148291048',
        senderHeader: 'ADYAPN',
        recipientPhone: phone,
        simulatedLatencyMs: 42,
      },
    };
  }
}

export class SandboxEmailProvider implements ICommunicationProvider {
  readonly channel: CommunicationChannel = 'EMAIL';
  readonly providerName: string = 'Sandbox-Email-MTA (SES/SendGrid Simulation)';
  readonly isSandbox: boolean = true;

  async send(payload: ProviderSendPayload): Promise<ProviderSendResult> {
    const timestamp = new Date().toISOString();
    const externalMessageId = `EMAIL_SBX_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const email = payload.recipient.email || payload.recipient.identifier;
    if (!email || !email.includes('@')) {
      return {
        success: false,
        externalMessageId,
        status: 'FAILED',
        sentAt: timestamp,
        errorCode: 'INVALID_DESTINATION_EMAIL',
        errorMessage: `Email address '${email}' is not properly formatted.`,
        rawResponse: { provider: this.providerName, error: 'BAD_SYNTAX', timestamp },
      };
    }

    return {
      success: true,
      externalMessageId,
      status: 'DELIVERED',
      sentAt: timestamp,
      deliveredAt: timestamp,
      rawResponse: {
        provider: this.providerName,
        mta: 'Postman-Inbound-SES',
        dkimSignature: 'v=1; a=rsa-sha256; d=adyapan.finance; s=2026',
        spfCheck: 'PASS',
        subject: payload.content.subject || '(No Subject)',
        recipientEmail: email,
        simulatedLatencyMs: 68,
      },
    };
  }
}

export class SandboxWhatsAppProvider implements ICommunicationProvider {
  readonly channel: CommunicationChannel = 'WHATSAPP';
  readonly providerName: string = 'Sandbox-WhatsApp-Cloud-API (Meta Simulation)';
  readonly isSandbox: boolean = true;

  async send(payload: ProviderSendPayload): Promise<ProviderSendResult> {
    const timestamp = new Date().toISOString();
    const externalMessageId = `WA_SBX_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const phone = payload.recipient.phone || payload.recipient.identifier;
    if (!phone || phone.length < 10) {
      return {
        success: false,
        externalMessageId,
        status: 'FAILED',
        sentAt: timestamp,
        errorCode: 'INVALID_WHATSAPP_PHONE',
        errorMessage: `WhatsApp phone number '${phone}' is invalid.`,
        rawResponse: { provider: this.providerName, error: 'NOT_A_WHATSAPP_USER', timestamp },
      };
    }

    return {
      success: true,
      externalMessageId,
      status: 'DELIVERED',
      sentAt: timestamp,
      deliveredAt: timestamp,
      rawResponse: {
        provider: this.providerName,
        wamid: externalMessageId,
        hsmStatus: 'APPROVED_HSM',
        recipientPhone: phone,
        simulatedLatencyMs: 95,
      },
    };
  }
}

export class SandboxPushProvider implements ICommunicationProvider {
  readonly channel: CommunicationChannel = 'PUSH';
  readonly providerName: string = 'Sandbox-Push-FCM-APNS (Firebase Simulation)';
  readonly isSandbox: boolean = true;

  async send(payload: ProviderSendPayload): Promise<ProviderSendResult> {
    const timestamp = new Date().toISOString();
    const externalMessageId = `PUSH_SBX_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return {
      success: true,
      externalMessageId,
      status: 'DELIVERED',
      sentAt: timestamp,
      deliveredAt: timestamp,
      rawResponse: {
        provider: this.providerName,
        fcmMulticastId: externalMessageId,
        recipientIdentifier: payload.recipient.identifier,
        simulatedLatencyMs: 30,
      },
    };
  }
}

export class SandboxInAppProvider implements ICommunicationProvider {
  readonly channel: CommunicationChannel = 'IN_APP';
  readonly providerName: string = 'Sandbox-InApp-Notification-Hub';
  readonly isSandbox: boolean = true;

  async send(payload: ProviderSendPayload): Promise<ProviderSendResult> {
    const timestamp = new Date().toISOString();
    const externalMessageId = `INAPP_SBX_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return {
      success: true,
      externalMessageId,
      status: 'DELIVERED',
      sentAt: timestamp,
      deliveredAt: timestamp,
      rawResponse: {
        provider: this.providerName,
        inboxDelivered: true,
        customerId: payload.recipient.customerId || payload.recipient.identifier,
      },
    };
  }
}

export class SandboxInternalNotificationProvider implements ICommunicationProvider {
  readonly channel: CommunicationChannel = 'INTERNAL_NOTIFICATION';
  readonly providerName: string = 'Sandbox-Internal-Staff-Notification-Router';
  readonly isSandbox: boolean = true;

  async send(payload: ProviderSendPayload): Promise<ProviderSendResult> {
    const timestamp = new Date().toISOString();
    const externalMessageId = `STAFF_NOTIF_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return {
      success: true,
      externalMessageId,
      status: 'DELIVERED',
      sentAt: timestamp,
      deliveredAt: timestamp,
      rawResponse: {
        provider: this.providerName,
        staffFeedBroadcast: true,
        recipientId: payload.recipient.userId || payload.recipient.identifier,
      },
    };
  }
}

export class CommunicationProviderRegistry {
  private providers: Map<CommunicationChannel, ICommunicationProvider[]> = new Map();

  constructor() {
    this.registerProvider(new SandboxSmsProvider());
    this.registerProvider(new SandboxEmailProvider());
    this.registerProvider(new SandboxWhatsAppProvider());
    this.registerProvider(new SandboxPushProvider());
    this.registerProvider(new SandboxInAppProvider());
    this.registerProvider(new SandboxInternalNotificationProvider());
  }

  public registerProvider(provider: ICommunicationProvider): void {
    const list = this.providers.get(provider.channel) || [];
    list.push(provider);
    this.providers.set(provider.channel, list);
  }

  public getPrimaryProvider(channel: CommunicationChannel): ICommunicationProvider | undefined {
    const list = this.providers.get(channel);
    return list && list.length > 0 ? list[0] : undefined;
  }

  public getAllProviders(): ICommunicationProvider[] {
    const all: ICommunicationProvider[] = [];
    for (const list of this.providers.values()) {
      all.push(...list);
    }
    return all;
  }
}

export const defaultProviderRegistry = new CommunicationProviderRegistry();
