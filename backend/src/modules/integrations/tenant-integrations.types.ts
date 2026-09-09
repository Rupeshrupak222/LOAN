import { IntegrationCategory } from './integration.types';
import { EncryptedPayload } from '../../common/crypto';

export type SupportedProvider =
  // Credit
  | 'EXPERIAN'
  | 'CIBIL'
  | 'CRIF'
  | 'EQUIFAX'
  // Payments
  | 'RAZORPAY'
  | 'CASHFREE'
  | 'PAYU'
  | 'PINELABS'
  // KYC & ID
  | 'NSDL'
  | 'UIDAI_GSP'
  | 'DIGILOCKER'
  | 'KARZA'
  // Banking & AA
  | 'FINVU'
  | 'SETU'
  | 'ANUMATI'
  | 'PERFIOS'
  // Communication
  | 'SENDGRID'
  | 'AWS_SES'
  | 'TWILIO'
  | 'GUPSHUP'
  | 'MSG91';

export interface TenantProviderRouting {
  tenantId: string;
  category: IntegrationCategory;
  primaryProvider: SupportedProvider;
  secondaryProvider?: SupportedProvider;
  enabled: boolean;
  credentialsEncrypted: {
    apiKey?: EncryptedPayload;
    clientSecret?: EncryptedPayload;
    webhookSecret?: EncryptedPayload;
  };
  maskedCredentials: {
    apiKey?: string;
    clientSecret?: string;
    webhookSecret?: string;
  };
  customBaseUrl?: string;
  customTimeoutMs?: number;
  updatedAt: string;
}

export interface UpsertTenantIntegrationDto {
  primaryProvider: SupportedProvider;
  secondaryProvider?: SupportedProvider;
  enabled?: boolean;
  apiKey?: string;
  clientSecret?: string;
  webhookSecret?: string;
  customBaseUrl?: string;
  customTimeoutMs?: number;
}
