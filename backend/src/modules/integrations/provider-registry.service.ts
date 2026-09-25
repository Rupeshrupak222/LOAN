// Centralized Provider Registry — Provider-Neutral Adapter Resolvers & Health Status
import { SandboxKycProvider } from './sandbox/sandbox-kyc.provider';
import { SandboxBureauProvider } from './sandbox/sandbox-bureau.provider';
import { SandboxBankVerificationProvider } from './sandbox/sandbox-bank.provider';
import { SandboxAccountAggregatorProvider } from './sandbox/sandbox-aa.provider';
import { SandboxEsignProvider } from './sandbox/sandbox-esign.provider';
import { SandboxMandateProvider } from './sandbox/sandbox-mandate.provider';
import { SandboxPaymentProvider } from '../payments/sandbox-payment-provider';
import { SandboxPayoutProvider } from '../payments/sandbox-payout-provider';
import {
  SandboxSmsProvider,
  SandboxEmailProvider,
  SandboxWhatsAppProvider,
  SandboxPushProvider,
} from '../communications/sandbox-providers';
import { KycProvider } from './interfaces/kyc.interface';
import { BureauProvider } from './interfaces/bureau.interface';
import { BankVerificationProvider } from './interfaces/banking.interface';
import { EsignProvider } from './interfaces/esign.interface';
import { PaymentProvider, PayoutProvider } from './interfaces/payments.interface';
import {
  SmsProvider,
  EmailProvider,
  WhatsAppProvider,
  PushProvider,
} from './interfaces/communication.interface';
import { ExecutionMode, IntegrationHealthStatus } from './integration.types';
import { getProviderConfigurations } from './integration.config';
import { IntegrationHubError } from './integration.errors';
import { KycIdentityAdapter } from './adapters/kyc/kyc-identity.adapter';
import { CreditBureauAdapter } from './adapters/credit/credit-bureau.adapter';
import { BankingDataAdapter } from './adapters/banking/banking-data.adapter';
import { DisbursementAdapter } from './adapters/disbursements/disbursement.adapter';
import { PaymentGatewayAdapter } from './adapters/payments/payment-gateway.adapter';
import { DigitalEsignAdapter } from './adapters/esign/digital-esign.adapter';

export interface ResolveProviderOptions {
  forceMode?: ExecutionMode;
  tenantId?: string;
}

export interface ResolvedProvider<T> {
  provider: T;
  mode: ExecutionMode;
  isSandbox: boolean;
}

export interface ProviderHealthSummary {
  domain: string;
  providerId: string;
  name: string;
  mode: ExecutionMode;
  status: IntegrationHealthStatus;
  isExternalApiConnected: boolean;
  activeSince: string;
  credentialConfigured: boolean;
}

export class ProviderRegistryService {
  private static instance: ProviderRegistryService;

  // Registered Sandbox Singletons
  public readonly kyc: SandboxKycProvider;
  public readonly bureau: SandboxBureauProvider;
  public readonly bank: SandboxBankVerificationProvider;
  public readonly aa: SandboxAccountAggregatorProvider;
  public readonly esign: SandboxEsignProvider;
  public readonly mandate: SandboxMandateProvider;
  public readonly payment: SandboxPaymentProvider;
  public readonly payout: SandboxPayoutProvider;
  public readonly sms: SandboxSmsProvider;
  public readonly email: SandboxEmailProvider;
  public readonly whatsapp: SandboxWhatsAppProvider;
  public readonly push: SandboxPushProvider;

  // Custom registered provider adapters (keyed by `${category}:${tenantId || 'DEFAULT'}`)
  private readonly customAdapters = new Map<string, any>();

  private constructor() {
    this.kyc = new SandboxKycProvider();
    this.bureau = new SandboxBureauProvider();
    this.bank = new SandboxBankVerificationProvider();
    this.aa = new SandboxAccountAggregatorProvider();
    this.esign = new SandboxEsignProvider();
    this.mandate = new SandboxMandateProvider();
    this.payment = new SandboxPaymentProvider();
    this.payout = new SandboxPayoutProvider();
    this.sms = new SandboxSmsProvider();
    this.email = new SandboxEmailProvider();
    this.whatsapp = new SandboxWhatsAppProvider();
    this.push = new SandboxPushProvider();
  }

  public static getInstance(): ProviderRegistryService {
    if (!ProviderRegistryService.instance) {
      ProviderRegistryService.instance = new ProviderRegistryService();
    }
    return ProviderRegistryService.instance;
  }

  /**
   * Register or override a provider adapter for a specific category and tenant
   */
  public registerCustomAdapter(category: string, adapter: any, tenantId: string = 'DEFAULT'): void {
    const key = `${category.toUpperCase()}:${tenantId}`;
    this.customAdapters.set(key, adapter);
  }

  /**
   * Central Resolution Rule for all providers:
   * 
   * 1. Custom registered adapter for tenant / default (unless forceMode === 'SANDBOX_PROVIDER')
   * 2. If forceMode === 'REAL_PROVIDER':
   *      If credentials/config present -> REAL adapter (mode: REAL_PROVIDER, isSandbox: false)
   *      If credentials missing -> throw PROVIDER_CONFIGURATION_REQUIRED (no silent fallback)
   * 3. If forceMode === 'SANDBOX_PROVIDER':
   *      -> Sandbox adapter (mode: SANDBOX_PROVIDER, isSandbox: true)
   * 4. Default / Auto:
   *      If credentials/config present -> REAL adapter (mode: REAL_PROVIDER, isSandbox: false)
   *      Else -> Sandbox adapter (mode: SANDBOX_PROVIDER, isSandbox: true)
   */
  public resolveProvider<T>(
    category: string,
    realAdapterFactory: () => T,
    sandboxProvider: T,
    configKey: string,
    options?: string | ResolveProviderOptions
  ): ResolvedProvider<T> {
    const opts: ResolveProviderOptions = typeof options === 'string' ? { tenantId: options } : options || {};
    const tenantId = opts.tenantId;
    const forceMode = opts.forceMode;

    // Check custom registered adapter for tenant / default
    const custom = tenantId ? this.customAdapters.get(`${category}:${tenantId}`) : undefined;
    const defaultCustom = this.customAdapters.get(`${category}:DEFAULT`);
    const registeredCustom = custom || defaultCustom;

    if (registeredCustom) {
      if (forceMode === 'SANDBOX_PROVIDER') {
        return {
          provider: sandboxProvider,
          mode: 'SANDBOX_PROVIDER',
          isSandbox: true,
        };
      }
      const isCustomSandbox = registeredCustom.environment === 'SANDBOX' || Boolean((registeredCustom as any).isSandbox);
      return {
        provider: registeredCustom,
        mode: isCustomSandbox ? 'SANDBOX_PROVIDER' : 'REAL_PROVIDER',
        isSandbox: isCustomSandbox,
      };
    }

    const configs = getProviderConfigurations();
    const config = configs[configKey];
    const isConfigured = Boolean(config?.isConfigured && config?.enabled);

    // If explicit REAL mode requested
    if (forceMode === 'REAL_PROVIDER') {
      if (!isConfigured) {
        throw new IntegrationHubError(
          503,
          'PROVIDER_CONFIGURATION_REQUIRED',
          `[PROVIDER_CONFIGURATION_REQUIRED] Provider '${category}' is explicitly configured for REAL mode, but required credentials/configuration are missing.`
        );
      }
      return {
        provider: realAdapterFactory(),
        mode: 'REAL_PROVIDER',
        isSandbox: false,
      };
    }

    // If explicit SANDBOX mode requested
    if (forceMode === 'SANDBOX_PROVIDER') {
      return {
        provider: sandboxProvider,
        mode: 'SANDBOX_PROVIDER',
        isSandbox: true,
      };
    }

    // Automatic resolution: if credentials present -> REAL, else -> SANDBOX
    if (isConfigured) {
      return {
        provider: realAdapterFactory(),
        mode: 'REAL_PROVIDER',
        isSandbox: false,
      };
    }

    return {
      provider: sandboxProvider,
      mode: 'SANDBOX_PROVIDER',
      isSandbox: true,
    };
  }

  /**
   * Resolve KYC Provider
   */
  public getKycProvider(options?: string | ResolveProviderOptions): ResolvedProvider<KycProvider> {
    return this.resolveProvider<KycProvider>(
      'KYC',
      () => new KycIdentityAdapter(),
      this.kyc,
      'kyc_identity',
      options
    );
  }

  /**
   * Resolve Bureau Provider
   */
  public getBureauProvider(options?: string | ResolveProviderOptions): ResolvedProvider<BureauProvider> {
    return this.resolveProvider<BureauProvider>(
      'CREDIT',
      () => new CreditBureauAdapter(),
      this.bureau,
      'credit_bureau',
      options
    );
  }

  /**
   * Resolve Bank Verification Provider
   */
  public getBankVerificationProvider(options?: string | ResolveProviderOptions): ResolvedProvider<BankVerificationProvider> {
    return this.resolveProvider<BankVerificationProvider>(
      'BANKING',
      () => new BankingDataAdapter(),
      this.bank,
      'banking_data',
      options
    );
  }

  /**
   * Resolve eSign Provider
   */
  public getEsignProvider(options?: string | ResolveProviderOptions): ResolvedProvider<EsignProvider> {
    return this.resolveProvider<EsignProvider>(
      'ESIGN',
      () => new DigitalEsignAdapter(),
      this.esign,
      'esign',
      options
    );
  }

  /**
   * Resolve Payment Provider
   */
  public getPaymentProvider(options?: string | ResolveProviderOptions): ResolvedProvider<PaymentProvider | any> {
    return this.resolveProvider<PaymentProvider | any>(
      'PAYMENT',
      () => new PaymentGatewayAdapter(),
      this.payment,
      'payment_gateway',
      options
    );
  }

  /**
   * Resolve Disbursement / Payout Provider
   */
  public getPayoutProvider(options?: string | ResolveProviderOptions): ResolvedProvider<PayoutProvider | any> {
    return this.resolveProvider<PayoutProvider | any>(
      'DISBURSEMENT',
      () => new DisbursementAdapter(),
      this.payout,
      'disbursement_payout',
      options
    );
  }

  /**
   * Resolve Communication Providers
   */
  public getSmsProvider(options?: string | ResolveProviderOptions): ResolvedProvider<SandboxSmsProvider | any> {
    const configs = getProviderConfigurations();
    const isConfigured = Boolean(configs.communication_gateway?.maskedConfigSummary?.smsProviderConfigured);
    const opts: ResolveProviderOptions = typeof options === 'string' ? { tenantId: options } : options || {};
    
    if (opts.forceMode === 'REAL_PROVIDER' && !isConfigured) {
      throw new IntegrationHubError(
        503,
        'PROVIDER_CONFIGURATION_REQUIRED',
        "Provider 'SMS' is explicitly configured for REAL mode, but required SMS provider credentials are missing."
      );
    }
    if (opts.forceMode === 'SANDBOX_PROVIDER') {
      return { provider: this.sms, mode: 'SANDBOX_PROVIDER', isSandbox: true };
    }
    return {
      provider: this.sms,
      mode: isConfigured ? 'REAL_PROVIDER' : 'SANDBOX_PROVIDER',
      isSandbox: !isConfigured,
    };
  }

  public getEmailProvider(options?: string | ResolveProviderOptions): ResolvedProvider<SandboxEmailProvider | any> {
    const configs = getProviderConfigurations();
    const isConfigured = Boolean(configs.communication_gateway?.maskedConfigSummary?.emailProviderConfigured);
    const opts: ResolveProviderOptions = typeof options === 'string' ? { tenantId: options } : options || {};
    
    if (opts.forceMode === 'REAL_PROVIDER' && !isConfigured) {
      throw new IntegrationHubError(
        503,
        'PROVIDER_CONFIGURATION_REQUIRED',
        "Provider 'EMAIL' is explicitly configured for REAL mode, but required Email provider credentials are missing."
      );
    }
    if (opts.forceMode === 'SANDBOX_PROVIDER') {
      return { provider: this.email, mode: 'SANDBOX_PROVIDER', isSandbox: true };
    }
    return {
      provider: this.email,
      mode: isConfigured ? 'REAL_PROVIDER' : 'SANDBOX_PROVIDER',
      isSandbox: !isConfigured,
    };
  }

  public getWhatsAppProvider(options?: string | ResolveProviderOptions): ResolvedProvider<SandboxWhatsAppProvider | any> {
    const opts: ResolveProviderOptions = typeof options === 'string' ? { tenantId: options } : options || {};
    if (opts.forceMode === 'REAL_PROVIDER') {
      throw new IntegrationHubError(
        503,
        'PROVIDER_CONFIGURATION_REQUIRED',
        "Provider 'WHATSAPP' is explicitly configured for REAL mode, but real WhatsApp gateway is not configured."
      );
    }
    return { provider: this.whatsapp, mode: 'SANDBOX_PROVIDER', isSandbox: true };
  }

  public getPushProvider(options?: string | ResolveProviderOptions): ResolvedProvider<SandboxPushProvider | any> {
    const opts: ResolveProviderOptions = typeof options === 'string' ? { tenantId: options } : options || {};
    if (opts.forceMode === 'REAL_PROVIDER') {
      throw new IntegrationHubError(
        503,
        'PROVIDER_CONFIGURATION_REQUIRED',
        "Provider 'PUSH' is explicitly configured for REAL mode, but real Push notification gateway is not configured."
      );
    }
    return { provider: this.push, mode: 'SANDBOX_PROVIDER', isSandbox: true };
  }

  /**
   * Health status for all institutional integration domains with real configuration checks.
   */
  public async getHealthSummary(): Promise<ProviderHealthSummary[]> {
    const now = new Date().toISOString();
    const configs = getProviderConfigurations();

    return [
      {
        domain: 'KYC & Identity',
        providerId: this.kyc.providerId,
        name: this.kyc.name,
        mode: configs.kyc_identity?.isConfigured ? 'REAL_PROVIDER' : 'SANDBOX_PROVIDER',
        status: configs.kyc_identity?.isConfigured ? 'HEALTHY' : 'NOT_CONFIGURED',
        isExternalApiConnected: Boolean(configs.kyc_identity?.isConfigured),
        activeSince: now,
        credentialConfigured: Boolean(configs.kyc_identity?.isConfigured),
      },
      {
        domain: 'Credit Bureau',
        providerId: this.bureau.providerId,
        name: this.bureau.name,
        mode: configs.credit_bureau?.isConfigured ? 'REAL_PROVIDER' : 'SANDBOX_PROVIDER',
        status: configs.credit_bureau?.isConfigured ? 'HEALTHY' : 'NOT_CONFIGURED',
        isExternalApiConnected: Boolean(configs.credit_bureau?.isConfigured),
        activeSince: now,
        credentialConfigured: Boolean(configs.credit_bureau?.isConfigured),
      },
      {
        domain: 'Bank Verification',
        providerId: this.bank.providerId,
        name: this.bank.name,
        mode: configs.banking_data?.isConfigured ? 'REAL_PROVIDER' : 'SANDBOX_PROVIDER',
        status: configs.banking_data?.isConfigured ? 'HEALTHY' : 'NOT_CONFIGURED',
        isExternalApiConnected: Boolean(configs.banking_data?.isConfigured),
        activeSince: now,
        credentialConfigured: Boolean(configs.banking_data?.isConfigured),
      },
      {
        domain: 'Account Aggregator',
        providerId: this.aa.providerId,
        name: this.aa.name,
        mode: 'SANDBOX_PROVIDER',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
        credentialConfigured: false,
      },
      {
        domain: 'Digital eSign',
        providerId: this.esign.providerId,
        name: this.esign.name,
        mode: 'SANDBOX_PROVIDER',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
        credentialConfigured: false,
      },
      {
        domain: 'e-NACH Mandate',
        providerId: this.mandate.providerId,
        name: this.mandate.name,
        mode: 'SANDBOX_PROVIDER',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
        credentialConfigured: false,
      },
      {
        domain: 'Payment Gateway',
        providerId: this.payment.code,
        name: this.payment.name,
        mode: configs.payment_gateway?.isConfigured ? 'REAL_PROVIDER' : 'SANDBOX_PROVIDER',
        status: configs.payment_gateway?.isConfigured ? 'HEALTHY' : 'NOT_CONFIGURED',
        isExternalApiConnected: Boolean(configs.payment_gateway?.isConfigured),
        activeSince: now,
        credentialConfigured: Boolean(configs.payment_gateway?.isConfigured),
      },
      {
        domain: 'Payouts & Disbursement',
        providerId: this.payout.code,
        name: this.payout.name,
        mode: configs.disbursement_payout?.isConfigured ? 'REAL_PROVIDER' : 'SANDBOX_PROVIDER',
        status: configs.disbursement_payout?.isConfigured ? 'HEALTHY' : 'NOT_CONFIGURED',
        isExternalApiConnected: Boolean(configs.disbursement_payout?.isConfigured),
        activeSince: now,
        credentialConfigured: Boolean(configs.disbursement_payout?.isConfigured),
      },
      {
        domain: 'SMS Communication',
        providerId: 'sms_gateway',
        name: 'SMS Gateway',
        mode: configs.communication_gateway?.maskedConfigSummary?.smsProviderConfigured ? 'REAL_PROVIDER' : 'SANDBOX_PROVIDER',
        status: configs.communication_gateway?.maskedConfigSummary?.smsProviderConfigured ? 'HEALTHY' : 'NOT_CONFIGURED',
        isExternalApiConnected: Boolean(configs.communication_gateway?.maskedConfigSummary?.smsProviderConfigured),
        activeSince: now,
        credentialConfigured: Boolean(configs.communication_gateway?.maskedConfigSummary?.smsProviderConfigured),
      },
      {
        domain: 'Email Communication',
        providerId: 'email_gateway',
        name: 'Email Gateway',
        mode: configs.communication_gateway?.maskedConfigSummary?.emailProviderConfigured ? 'REAL_PROVIDER' : 'SANDBOX_PROVIDER',
        status: configs.communication_gateway?.maskedConfigSummary?.emailProviderConfigured ? 'HEALTHY' : 'NOT_CONFIGURED',
        isExternalApiConnected: Boolean(configs.communication_gateway?.maskedConfigSummary?.emailProviderConfigured),
        activeSince: now,
        credentialConfigured: Boolean(configs.communication_gateway?.maskedConfigSummary?.emailProviderConfigured),
      },
      {
        domain: 'WhatsApp Communication',
        providerId: 'sandbox_whatsapp',
        name: 'Sandbox WhatsApp Gateway',
        mode: 'SANDBOX_PROVIDER',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
        credentialConfigured: false,
      },
      {
        domain: 'Push Notifications',
        providerId: 'sandbox_push',
        name: 'Sandbox Push Notification Hub',
        mode: 'SANDBOX_PROVIDER',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
        credentialConfigured: false,
      },
    ];
  }
}

export const providerRegistry = ProviderRegistryService.getInstance();

