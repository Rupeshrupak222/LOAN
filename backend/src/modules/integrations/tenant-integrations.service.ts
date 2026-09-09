import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { encryptSecret, decryptSecret } from '../../common/crypto';
import { maskSecret, validateOutboundUrl } from './integration.config';
import { logAudit } from '../audit/audit.service';
import { IntegrationCategory } from './integration.types';
import { TenantProviderRouting, UpsertTenantIntegrationDto, SupportedProvider } from './tenant-integrations.types';

export class TenantIntegrationService {
  private static instance: TenantIntegrationService;

  // Store: Map<`${tenantId}:${category}`, TenantProviderRouting>
  private readonly routings = new Map<string, TenantProviderRouting>();

  private constructor() {
    this.seedDefaultTenantRoutings();
  }

  public static getInstance(): TenantIntegrationService {
    if (!TenantIntegrationService.instance) {
      TenantIntegrationService.instance = new TenantIntegrationService();
    }
    return TenantIntegrationService.instance;
  }

  private seedDefaultTenantRoutings(): void {
    const testCred = (provider: string, type: string) => `test-${provider.toLowerCase()}-${type.toLowerCase()}-credential`;

    // 1. Seed Tenant A: Adyapan Prime Lending (Experian, Razorpay, SendGrid, Setu, NSDL)
    this.saveEncryptedSeed('tenant-adyapan-default', 'CREDIT', {
      primaryProvider: 'EXPERIAN',
      secondaryProvider: 'CIBIL',
      apiKey: testCred('experian', 'key'),
      clientSecret: testCred('experian', 'secret'),
      customBaseUrl: 'https://api.experian.in/credit/v2',
      customTimeoutMs: 8000,
    });

    this.saveEncryptedSeed('tenant-adyapan-default', 'PAYMENT', {
      primaryProvider: 'RAZORPAY',
      secondaryProvider: 'CASHFREE',
      apiKey: testCred('razorpay', 'key'),
      clientSecret: testCred('razorpay', 'secret'),
      customBaseUrl: 'https://api.razorpay.com/v1',
      customTimeoutMs: 10000,
    });

    this.saveEncryptedSeed('tenant-adyapan-default', 'COMMUNICATION', {
      primaryProvider: 'SENDGRID',
      secondaryProvider: 'TWILIO',
      apiKey: testCred('sendgrid', 'token'),
      customBaseUrl: 'https://api.sendgrid.com/v3',
    });

    this.saveEncryptedSeed('tenant-adyapan-default', 'KYC', {
      primaryProvider: 'NSDL',
      secondaryProvider: 'UIDAI_GSP',
      apiKey: testCred('nsdl', 'token'),
    });

    this.saveEncryptedSeed('tenant-adyapan-default', 'BANKING', {
      primaryProvider: 'SETU',
      secondaryProvider: 'FINVU',
      apiKey: testCred('setu', 'key'),
    });

    // 2. Seed Tenant B: Apex Capital Partners (CRIF, Cashfree, AWS SES, Anumati, DigiLocker)
    this.saveEncryptedSeed('tenant-apex-nbfc', 'CREDIT', {
      primaryProvider: 'CRIF',
      secondaryProvider: 'EXPERIAN',
      apiKey: testCred('crif', 'key'),
      clientSecret: testCred('crif', 'secret'),
      customBaseUrl: 'https://api.crifhighmark.com/v1',
      customTimeoutMs: 7000,
    });

    this.saveEncryptedSeed('tenant-apex-nbfc', 'PAYMENT', {
      primaryProvider: 'CASHFREE',
      secondaryProvider: 'RAZORPAY',
      apiKey: testCred('cashfree', 'key'),
      clientSecret: testCred('cashfree', 'secret'),
      customBaseUrl: 'https://api.cashfree.com/pg',
      customTimeoutMs: 10000,
    });

    this.saveEncryptedSeed('tenant-apex-nbfc', 'COMMUNICATION', {
      primaryProvider: 'AWS_SES',
      secondaryProvider: 'GUPSHUP',
      apiKey: testCred('aws_ses', 'key'),
      clientSecret: testCred('aws_ses', 'secret'),
      customBaseUrl: 'https://email.ap-south-1.amazonaws.com',
    });

    this.saveEncryptedSeed('tenant-apex-nbfc', 'KYC', {
      primaryProvider: 'DIGILOCKER',
      secondaryProvider: 'KARZA',
      apiKey: testCred('digilocker', 'key'),
    });

    this.saveEncryptedSeed('tenant-apex-nbfc', 'BANKING', {
      primaryProvider: 'ANUMATI',
      secondaryProvider: 'PERFIOS',
      apiKey: testCred('anumati', 'token'),
    });
  }

  private saveEncryptedSeed(
    tenantId: string,
    category: IntegrationCategory,
    details: {
      primaryProvider: SupportedProvider;
      secondaryProvider?: SupportedProvider;
      apiKey?: string;
      clientSecret?: string;
      webhookSecret?: string;
      customBaseUrl?: string;
      customTimeoutMs?: number;
    }
  ): void {
    const key = `${tenantId}:${category}`;
    const now = new Date().toISOString();

    this.routings.set(key, {
      tenantId,
      category,
      primaryProvider: details.primaryProvider,
      secondaryProvider: details.secondaryProvider,
      enabled: true,
      credentialsEncrypted: {
        apiKey: details.apiKey ? encryptSecret(details.apiKey) : undefined,
        clientSecret: details.clientSecret ? encryptSecret(details.clientSecret) : undefined,
        webhookSecret: details.webhookSecret ? encryptSecret(details.webhookSecret) : undefined,
      },
      maskedCredentials: {
        apiKey: details.apiKey ? maskSecret(details.apiKey) : undefined,
        clientSecret: details.clientSecret ? maskSecret(details.clientSecret) : undefined,
        webhookSecret: details.webhookSecret ? maskSecret(details.webhookSecret) : undefined,
      },
      customBaseUrl: details.customBaseUrl,
      customTimeoutMs: details.customTimeoutMs || 8000,
      updatedAt: now,
    });
  }

  /**
   * Returns all configured integration routings for a tenant with masked credentials.
   * Plaintext credentials and ciphertexts are never returned over API.
   */
  public getTenantRoutings(tenantId: string): Omit<TenantProviderRouting, 'credentialsEncrypted'>[] {
    const result: Omit<TenantProviderRouting, 'credentialsEncrypted'>[] = [];

    for (const routing of this.routings.values()) {
      if (routing.tenantId === tenantId) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { credentialsEncrypted, ...safe } = routing;
        result.push(safe);
      }
    }

    return result;
  }

  public getTenantRoutingForCategory(
    tenantId: string,
    category: IntegrationCategory
  ): Omit<TenantProviderRouting, 'credentialsEncrypted'> | undefined {
    const key = `${tenantId}:${category}`;
    const routing = this.routings.get(key);
    if (!routing) return undefined;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { credentialsEncrypted, ...safe } = routing;
    return safe;
  }

  /**
   * Decrypts credentials in-memory strictly for provider execution.
   */
  public getDecryptedCredentials(
    tenantId: string,
    category: IntegrationCategory
  ): {
    primaryProvider: SupportedProvider;
    secondaryProvider?: SupportedProvider;
    apiKey?: string;
    clientSecret?: string;
    webhookSecret?: string;
    customBaseUrl?: string;
    customTimeoutMs: number;
  } {
    const key = `${tenantId}:${category}`;
    const routing = this.routings.get(key);

    if (!routing || !routing.enabled) {
      throw new NotFoundError(
        `Integration routing for category '${category}' is not configured or disabled for tenant '${tenantId}'.`
      );
    }

    return {
      primaryProvider: routing.primaryProvider,
      secondaryProvider: routing.secondaryProvider,
      apiKey: routing.credentialsEncrypted.apiKey ? decryptSecret(routing.credentialsEncrypted.apiKey) : undefined,
      clientSecret: routing.credentialsEncrypted.clientSecret
        ? decryptSecret(routing.credentialsEncrypted.clientSecret)
        : undefined,
      webhookSecret: routing.credentialsEncrypted.webhookSecret
        ? decryptSecret(routing.credentialsEncrypted.webhookSecret)
        : undefined,
      customBaseUrl: routing.customBaseUrl,
      customTimeoutMs: routing.customTimeoutMs || 8000,
    };
  }

  /**
   * Updates integration routing & credentials with AES-256-GCM encryption and audit logging.
   */
  public async upsertTenantRouting(
    tenantId: string,
    category: IntegrationCategory,
    dto: UpsertTenantIntegrationDto,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<Omit<TenantProviderRouting, 'credentialsEncrypted'>> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot manage integration configurations.');
    }

    if (dto.customBaseUrl) {
      validateOutboundUrl(dto.customBaseUrl, false);
    }

    const key = `${tenantId}:${category}`;
    const existing = this.routings.get(key);
    const now = new Date().toISOString();

    // Encrypt new credentials if provided, or retain existing encrypted payloads
    const apiKeyEncrypted = dto.apiKey ? encryptSecret(dto.apiKey) : existing?.credentialsEncrypted.apiKey;
    const clientSecretEncrypted = dto.clientSecret
      ? encryptSecret(dto.clientSecret)
      : existing?.credentialsEncrypted.clientSecret;
    const webhookSecretEncrypted = dto.webhookSecret
      ? encryptSecret(dto.webhookSecret)
      : existing?.credentialsEncrypted.webhookSecret;

    const maskedApiKey = dto.apiKey
      ? maskSecret(dto.apiKey)
      : existing?.maskedCredentials.apiKey || (apiKeyEncrypted ? '******' : undefined);
    const maskedClientSecret = dto.clientSecret
      ? maskSecret(dto.clientSecret)
      : existing?.maskedCredentials.clientSecret || (clientSecretEncrypted ? '******' : undefined);
    const maskedWebhookSecret = dto.webhookSecret
      ? maskSecret(dto.webhookSecret)
      : existing?.maskedCredentials.webhookSecret || (webhookSecretEncrypted ? '******' : undefined);

    const updated: TenantProviderRouting = {
      tenantId,
      category,
      primaryProvider: dto.primaryProvider || existing?.primaryProvider || 'EXPERIAN',
      secondaryProvider: dto.secondaryProvider !== undefined ? dto.secondaryProvider : existing?.secondaryProvider,
      enabled: dto.enabled !== undefined ? dto.enabled : existing?.enabled ?? true,
      credentialsEncrypted: {
        apiKey: apiKeyEncrypted,
        clientSecret: clientSecretEncrypted,
        webhookSecret: webhookSecretEncrypted,
      },
      maskedCredentials: {
        apiKey: maskedApiKey,
        clientSecret: maskedClientSecret,
        webhookSecret: maskedWebhookSecret,
      },
      customBaseUrl: dto.customBaseUrl !== undefined ? dto.customBaseUrl : existing?.customBaseUrl,
      customTimeoutMs: dto.customTimeoutMs !== undefined ? dto.customTimeoutMs : existing?.customTimeoutMs || 8000,
      updatedAt: now,
    };

    this.routings.set(key, updated);

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'TENANT_INTEGRATION_ROUTING_UPDATED',
      entity: 'TenantProviderRouting',
      entityId: key,
      newValue: {
        category,
        primaryProvider: updated.primaryProvider,
        secondaryProvider: updated.secondaryProvider,
        enabled: updated.enabled,
        maskedApiKey: updated.maskedCredentials.apiKey,
      },
    }).catch(() => {});

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { credentialsEncrypted, ...safe } = updated;
    return safe;
  }

  /**
   * Executes a tenant-routed integration operation with automatic fallback support.
   */
  public async dispatchTenantOperation<T = any>(
    tenantId: string,
    category: IntegrationCategory,
    operationName: string,
    payload: Record<string, any>
  ): Promise<{ providerUsed: SupportedProvider; isFallback: boolean; result: T }> {
    const creds = this.getDecryptedCredentials(tenantId, category);

    try {
      // Execute primary provider
      const result = await this.mockProviderExecution(creds.primaryProvider, operationName, payload, creds.apiKey);
      return {
        providerUsed: creds.primaryProvider,
        isFallback: false,
        result: result as T,
      };
    } catch (primaryErr: any) {
      // If primary fails and secondary fallback exists, attempt secondary
      if (creds.secondaryProvider) {
        const fallbackResult = await this.mockProviderExecution(
          creds.secondaryProvider,
          operationName,
          payload,
          creds.apiKey
        );
        return {
          providerUsed: creds.secondaryProvider,
          isFallback: true,
          result: fallbackResult as T,
        };
      }
      throw primaryErr;
    }
  }

  private async mockProviderExecution(
    provider: SupportedProvider,
    operation: string,
    payload: Record<string, any>,
    apiKey?: string
  ): Promise<any> {
    return {
      provider,
      operation,
      status: 'SUCCESS',
      authenticated: Boolean(apiKey),
      timestamp: new Date().toISOString(),
      payloadSummary: Object.keys(payload),
    };
  }

  public clearForTesting(): void {
    this.routings.clear();
    this.seedDefaultTenantRoutings();
  }
}

export const tenantIntegrationService = TenantIntegrationService.getInstance();
