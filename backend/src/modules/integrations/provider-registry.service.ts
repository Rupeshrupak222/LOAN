// Centralized Provider Registry — All Active Modes: SANDBOX
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

export interface ProviderHealthSummary {
  domain: string;
  providerId: string;
  name: string;
  mode: 'SANDBOX' | 'PRODUCTION';
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  isExternalApiConnected: boolean;
  activeSince: string;
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
   * Health status for all 12 institutional integration domains.
   */
  public async getHealthSummary(): Promise<ProviderHealthSummary[]> {
    const now = new Date().toISOString();
    return [
      {
        domain: 'KYC & Identity',
        providerId: this.kyc.providerId,
        name: this.kyc.name,
        mode: 'SANDBOX',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
      },
      {
        domain: 'Credit Bureau',
        providerId: this.bureau.providerId,
        name: this.bureau.name,
        mode: 'SANDBOX',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
      },
      {
        domain: 'Bank Verification',
        providerId: this.bank.providerId,
        name: this.bank.name,
        mode: 'SANDBOX',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
      },
      {
        domain: 'Account Aggregator',
        providerId: this.aa.providerId,
        name: this.aa.name,
        mode: 'SANDBOX',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
      },
      {
        domain: 'Digital eSign',
        providerId: this.esign.providerId,
        name: this.esign.name,
        mode: 'SANDBOX',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
      },
      {
        domain: 'e-NACH Mandate',
        providerId: this.mandate.providerId,
        name: this.mandate.name,
        mode: 'SANDBOX',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
      },
      {
        domain: 'Payment Gateway',
        providerId: this.payment.code,
        name: this.payment.name,
        mode: 'SANDBOX',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
      },
      {
        domain: 'Payouts & Disbursement',
        providerId: this.payout.code,
        name: this.payout.name,
        mode: 'SANDBOX',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
      },
      {
        domain: 'SMS Communication',
        providerId: 'sandbox_sms',
        name: 'Sandbox SMS Gateway',
        mode: 'SANDBOX',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
      },
      {
        domain: 'Email Communication',
        providerId: 'sandbox_email',
        name: 'Sandbox Email Gateway',
        mode: 'SANDBOX',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
      },
      {
        domain: 'WhatsApp Communication',
        providerId: 'sandbox_whatsapp',
        name: 'Sandbox WhatsApp Gateway',
        mode: 'SANDBOX',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
      },
      {
        domain: 'Push Notifications',
        providerId: 'sandbox_push',
        name: 'Sandbox Push Notification Hub',
        mode: 'SANDBOX',
        status: 'HEALTHY',
        isExternalApiConnected: false,
        activeSince: now,
      },
    ];
  }
}

export const providerRegistry = ProviderRegistryService.getInstance();
