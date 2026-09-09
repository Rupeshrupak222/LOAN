// Step 30: Privacy & Consent Management Types

export type ConsentType =
  | 'KYC_VERIFICATION'
  | 'CREDIT_ASSESSMENT'
  | 'BANK_ACCOUNT_ACCESS'
  | 'COMMUNICATION_CHANNELS'
  | 'MARKETING_PROMOTIONS'
  | 'DOCUMENT_PROCESSING'
  | 'THIRD_PARTY_DATA_SHARING'
  | 'AI_ASSISTED_ANALYSIS';

export type ConsentStatus = 'GRANTED' | 'WITHDRAWN' | 'EXPIRED' | 'REVOKED' | 'SUPERSEDED';

export type ConsentChannel = 'WEB_PORTAL' | 'MOBILE_APP' | 'SMS_OTP' | 'BRANCH_PHYSICAL' | 'WHATSAPP';

export interface ConsentPurpose {
  purposeCode: string;
  tenantId: string; // Tenant specific or '*'
  title: string;
  description: string;
  category: ConsentType;
  isMandatory: boolean;
  activeVersion: string;
  wordingText: string;
  updatedAt: string;
}

export interface ConsentRecord {
  id: string;
  tenantId: string;
  customerId: string;
  consentType: ConsentType;
  purposeCode: string;
  version: string;
  status: ConsentStatus;
  grantedAt: string;
  withdrawnAt?: string;
  withdrawnReason?: string;
  expiresAt?: string;
  channel: ConsentChannel;
  ipAddress?: string;
  userAgent?: string;
  evidenceRef?: string;
  metadata?: Record<string, any>;
}

export interface CustomerPrivacyPreference {
  customerId: string;
  tenantId: string;
  allowMarketing: boolean;
  allowAiAnalysis: boolean;
  allowThirdPartySharing: boolean;
  preferredChannel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  updatedAt: string;
}

export interface ConsentEnforcementCheck {
  granted: boolean;
  requiredType: ConsentType;
  purposeCode?: string;
  consentRecord?: ConsentRecord;
  reason?: string;
}

export interface PrivacyOverview {
  tenantId: string;
  totalConsentsRecorded: number;
  activeGrantedConsentsCount: number;
  withdrawnConsentsCount: number;
  purposesCount: number;
  marketingOptInRate: number;
  aiAnalysisOptInRate: number;
  recentConsents: ConsentRecord[];
  updatedAt: string;
}
