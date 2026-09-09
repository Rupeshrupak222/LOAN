import { v4 as uuid } from 'uuid';
import {
  ConsentPurpose,
  ConsentRecord,
  ConsentType,
  ConsentStatus,
  ConsentChannel,
  CustomerPrivacyPreference,
  ConsentEnforcementCheck,
  PrivacyOverview,
} from './consent.types';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { securityService } from '../security/security.service';

export class PrivacyConsentService {
  private static instance: PrivacyConsentService;

  // Purpose templates: Map<purposeCode, ConsentPurpose>
  private readonly purposes = new Map<string, ConsentPurpose>();

  // Consent records: ConsentRecord[]
  private readonly consents: ConsentRecord[] = [];

  // Customer Privacy Preferences: Map<customerId, CustomerPrivacyPreference>
  private readonly preferences = new Map<string, CustomerPrivacyPreference>();

  private constructor() {
    this.seedDefaultPurposes();
  }

  public static getInstance(): PrivacyConsentService {
    if (!PrivacyConsentService.instance) {
      PrivacyConsentService.instance = new PrivacyConsentService();
    }
    return PrivacyConsentService.instance;
  }

  private seedDefaultPurposes(): void {
    const now = new Date().toISOString();

    const initialPurposes: ConsentPurpose[] = [
      {
        purposeCode: 'PURPOSE-KYC-01',
        tenantId: '*',
        title: 'Identity Verification & Digilocker eKYC Consent',
        description: 'Consent to fetch and verify Aadhaar/PAN details from authorized statutory repositories.',
        category: 'KYC_VERIFICATION',
        isMandatory: true,
        activeVersion: 'v1.0',
        wordingText: 'I hereby provide my explicit consent to Adyapan and its lending partners to access my Aadhaar and PAN data for identity verification under RBI KYC Master Directions.',
        updatedAt: now,
      },
      {
        purposeCode: 'PURPOSE-BUREAU-02',
        tenantId: '*',
        title: 'Credit Information Bureau Pull Authorization',
        description: 'Authorization to pull credit report and credit history from CIBIL, Experian, CRIF High Mark, or Equifax.',
        category: 'CREDIT_ASSESSMENT',
        isMandatory: true,
        activeVersion: 'v1.0',
        wordingText: 'I authorize the lender to pull my credit information report from registered Credit Information Companies (CIBIL/Experian/CRIF) for credit assessment.',
        updatedAt: now,
      },
      {
        purposeCode: 'PURPOSE-AA-BANK-03',
        tenantId: '*',
        title: 'Account Aggregator & Bank Statement Consent',
        description: 'Consent to access bank statement analytics via RBI Account Aggregator framework or uploaded statements.',
        category: 'BANK_ACCOUNT_ACCESS',
        isMandatory: true,
        activeVersion: 'v1.0',
        wordingText: 'I consent to sharing my financial transaction history from my designated bank accounts via Account Aggregator for cash flow evaluation.',
        updatedAt: now,
      },
      {
        purposeCode: 'PURPOSE-AI-ASSIST-04',
        tenantId: '*',
        title: 'AI-Assisted Underwriting & Predictive Profiling',
        description: 'Consent to process anonymized loan application attributes through automated decision intelligence copilot.',
        category: 'AI_ASSISTED_ANALYSIS',
        isMandatory: false,
        activeVersion: 'v1.0',
        wordingText: 'I agree to the automated analysis of my application details by assistive AI decision models to accelerate loan processing.',
        updatedAt: now,
      },
      {
        purposeCode: 'PURPOSE-MKTG-05',
        tenantId: '*',
        title: 'Personalized Offers & Financial Communications',
        description: 'Consent to receive curated loan offers, interest rate reductions, and promotional messages.',
        category: 'MARKETING_PROMOTIONS',
        isMandatory: false,
        activeVersion: 'v1.0',
        wordingText: 'I agree to receive communications regarding personalized loan top-ups, partner promotions, and pre-approved credit lines.',
        updatedAt: now,
      },
    ];

    for (const p of initialPurposes) {
      this.purposes.set(p.purposeCode, p);
    }
  }

  // --- 1. PURPOSE CATALOG & VERSIONING ---

  public listPurposes(tenantId: string): ConsentPurpose[] {
    return Array.from(this.purposes.values()).filter((p) => p.tenantId === '*' || p.tenantId === tenantId);
  }

  public async upsertPurpose(
    tenantId: string,
    dto: {
      purposeCode: string;
      title: string;
      description: string;
      category: ConsentType;
      isMandatory: boolean;
      wordingText: string;
    },
    actor: { id: string; email: string; roles: string[] }
  ): Promise<ConsentPurpose> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Borrowers cannot manage consent templates.');
    }

    const existing = this.purposes.get(dto.purposeCode);
    const now = new Date().toISOString();

    // If existing and wording changed, bump version (v1.0 -> v2.0)
    let version = 'v1.0';
    if (existing) {
      const currentVerNum = parseFloat(existing.activeVersion.replace('v', '')) || 1.0;
      version = `v${(currentVerNum + 1.0).toFixed(1)}`;
    }

    const purpose: ConsentPurpose = {
      ...dto,
      tenantId: tenantId || '*',
      activeVersion: version,
      updatedAt: now,
    };

    this.purposes.set(dto.purposeCode, purpose);

    await logAudit({
      userId: actor.id?.startsWith('usr-') ? actor.id : undefined,
      role: actor.roles[0],
      action: 'CONSENT_PURPOSE_VERSION_UPDATED',
      entity: 'ConsentPurpose',
      entityId: dto.purposeCode,
      previousValue: existing ? { version: existing.activeVersion } : undefined,
      newValue: { version, title: purpose.title, actorEmail: actor.email },
    }).catch(() => {});

    return purpose;
  }

  // --- 2. CONSENT GRANTING & LIFECYCLE ---

  public async grantConsent(
    dto: {
      tenantId: string;
      customerId: string;
      purposeCode: string;
      channel: ConsentChannel;
      ipAddress?: string;
      userAgent?: string;
      evidenceRef?: string;
      metadata?: Record<string, any>;
    },
    actor: { id: string; email: string; roles: string[] }
  ): Promise<ConsentRecord> {
    const purpose = this.purposes.get(dto.purposeCode);
    if (!purpose) {
      throw new NotFoundError(`Consent purpose '${dto.purposeCode}' not found.`);
    }

    const now = new Date().toISOString();

    // 1. Supersede any existing active GRANTED consent for same (customerId, purposeCode)
    for (const record of this.consents) {
      if (
        record.customerId === dto.customerId &&
        record.purposeCode === dto.purposeCode &&
        record.status === 'GRANTED'
      ) {
        record.status = 'SUPERSEDED';
      }
    }

    // 2. Create new immutable ConsentRecord locking the active purpose version
    const record: ConsentRecord = {
      id: `cst-${uuid().slice(0, 8)}`,
      tenantId: dto.tenantId || 'tenant-adyapan-default',
      customerId: dto.customerId,
      consentType: purpose.category,
      purposeCode: purpose.purposeCode,
      version: purpose.activeVersion,
      status: 'GRANTED',
      grantedAt: now,
      channel: dto.channel,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      evidenceRef: dto.evidenceRef,
      metadata: dto.metadata,
    };

    this.consents.unshift(record);

    await logAudit({
      userId: actor.id?.startsWith('usr-') ? actor.id : undefined,
      role: actor.roles[0],
      action: 'CONSENT_GRANTED',
      entity: 'ConsentRecord',
      entityId: record.id,
      newValue: {
        customerId: dto.customerId,
        purposeCode: purpose.purposeCode,
        version: record.version,
        channel: dto.channel,
        actorEmail: actor.email,
      },
    }).catch(() => {});

    return record;
  }

  public async withdrawConsent(
    consentId: string,
    reason: string,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<ConsentRecord> {
    const record = this.consents.find((c) => c.id === consentId);
    if (!record) {
      throw new NotFoundError(`Consent record '${consentId}' not found.`);
    }

    if (record.status !== 'GRANTED') {
      throw new BadRequestError(`Cannot withdraw consent with status '${record.status}'.`);
    }

    const now = new Date().toISOString();
    record.status = 'WITHDRAWN';
    record.withdrawnAt = now;
    record.withdrawnReason = reason || 'Customer requested withdrawal';

    await logAudit({
      userId: actor.id?.startsWith('usr-') ? actor.id : undefined,
      role: actor.roles[0],
      action: 'CONSENT_WITHDRAWN',
      entity: 'ConsentRecord',
      entityId: consentId,
      newValue: {
        customerId: record.customerId,
        purposeCode: record.purposeCode,
        withdrawnAt: now,
        reason: record.withdrawnReason,
        actorEmail: actor.email,
      },
    }).catch(() => {});

    return record;
  }

  public listConsents(
    tenantId: string,
    filter?: { customerId?: string; consentType?: ConsentType; status?: ConsentStatus }
  ): ConsentRecord[] {
    return this.consents.filter((c) => {
      if (tenantId !== '*' && c.tenantId !== tenantId) return false;
      if (filter?.customerId && c.customerId !== filter.customerId) return false;
      if (filter?.consentType && c.consentType !== filter.consentType) return false;
      if (filter?.status && c.status !== filter.status) return false;
      return true;
    });
  }

  // --- 3. CONSENT ENFORCEMENT ENGINE ---

  public checkEnforcement(
    tenantId: string,
    customerId: string,
    requiredType: ConsentType,
    purposeCode?: string
  ): ConsentEnforcementCheck {
    const active = this.consents.find(
      (c) =>
        (c.tenantId === tenantId || c.tenantId === 'tenant-adyapan-default') &&
        c.customerId === customerId &&
        c.consentType === requiredType &&
        (!purposeCode || c.purposeCode === purposeCode) &&
        c.status === 'GRANTED'
    );

    if (!active) {
      return {
        granted: false,
        requiredType,
        purposeCode,
        reason: `Active consent for '${requiredType}' not recorded for customer '${customerId}'.`,
      };
    }

    return {
      granted: true,
      requiredType,
      purposeCode: active.purposeCode,
      consentRecord: active,
    };
  }

  // --- 4. PRIVACY PREFERENCES ---

  public getPreferences(customerId: string, tenantId: string): CustomerPrivacyPreference {
    const existing = this.preferences.get(customerId);
    if (existing) return existing;

    const defaultPref: CustomerPrivacyPreference = {
      customerId,
      tenantId,
      allowMarketing: false,
      allowAiAnalysis: true,
      allowThirdPartySharing: false,
      preferredChannel: 'EMAIL',
      updatedAt: new Date().toISOString(),
    };

    this.preferences.set(customerId, defaultPref);
    return defaultPref;
  }

  public async updatePreferences(
    customerId: string,
    tenantId: string,
    updates: Partial<Omit<CustomerPrivacyPreference, 'customerId' | 'tenantId' | 'updatedAt'>>,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<CustomerPrivacyPreference> {
    const current = this.getPreferences(customerId, tenantId);
    const updated: CustomerPrivacyPreference = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.preferences.set(customerId, updated);

    await logAudit({
      userId: actor.id?.startsWith('usr-') ? actor.id : undefined,
      role: actor.roles[0],
      action: 'PRIVACY_PREFERENCES_UPDATED',
      entity: 'CustomerPrivacyPreference',
      entityId: customerId,
      previousValue: current,
      newValue: { ...updated, actorEmail: actor.email },
    }).catch(() => {});

    return updated;
  }

  // --- 5. AI PRIVACY & DATA MINIMIZATION SANITIZER ---

  public sanitizeForAiPrompt(
    tenantId: string,
    customerData: {
      id: string;
      name: string;
      pan?: string;
      aadhaar?: string;
      bankAccount?: string;
      phone?: string;
      income: number;
      creditScore?: number;
      loanAmount: number;
    }
  ): Record<string, any> {
    // 1. Enforce AI consent check
    const enforcement = this.checkEnforcement(tenantId, customerData.id, 'AI_ASSISTED_ANALYSIS');

    return {
      customerId: customerData.id,
      nameMasked: customerData.name?.split(' ')[0] + ' ***',
      panMasked: customerData.pan ? securityService.maskPan(customerData.pan) : undefined,
      aadhaarMasked: customerData.aadhaar ? securityService.maskAadhaar(customerData.aadhaar) : undefined,
      bankAccountMasked: customerData.bankAccount ? securityService.maskBankAccount(customerData.bankAccount) : undefined,
      phoneMasked: customerData.phone ? securityService.maskPhone(customerData.phone) : undefined,
      financialSummary: {
        monthlyIncome: customerData.income,
        creditScore: customerData.creditScore,
        requestedAmount: customerData.loanAmount,
      },
      aiConsentGranted: enforcement.granted,
      purposeScope: enforcement.granted ? 'FULL_ADVISORY_ASSESSMENT' : 'MINIMAL_RULES_ONLY',
    };
  }

  // --- 6. OVERVIEW & TELEMETRY ---

  public getPrivacyOverview(tenantId: string): PrivacyOverview {
    const all = this.consents.filter((c) => tenantId === '*' || c.tenantId === tenantId);
    const active = all.filter((c) => c.status === 'GRANTED');
    const withdrawn = all.filter((c) => c.status === 'WITHDRAWN');

    const mktgGranted = active.filter((c) => c.consentType === 'MARKETING_PROMOTIONS').length;
    const aiGranted = active.filter((c) => c.consentType === 'AI_ASSISTED_ANALYSIS').length;
    const totalCustomers = new Set(all.map((c) => c.customerId)).size || 1;

    return {
      tenantId,
      totalConsentsRecorded: all.length,
      activeGrantedConsentsCount: active.length,
      withdrawnConsentsCount: withdrawn.length,
      purposesCount: this.purposes.size,
      marketingOptInRate: Math.round((mktgGranted / totalCustomers) * 100),
      aiAnalysisOptInRate: Math.round((aiGranted / totalCustomers) * 100),
      recentConsents: all.slice(0, 10),
      updatedAt: new Date().toISOString(),
    };
  }

  public clearForTesting(): void {
    this.consents.length = 0;
    this.preferences.clear();
    this.purposes.clear();
    this.seedDefaultPurposes();
  }
}

export const privacyConsentService = PrivacyConsentService.getInstance();
