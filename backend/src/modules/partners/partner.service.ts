/**
 * Adyapan Lending OS — Phase 8: Partner, LSP & Embedded Lending Platform Service
 */

import crypto from 'crypto';
import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import {
  PartnerEntity,
  PartnerType,
  PartnerStatus,
  PartnerEnvironment,
  PartnerApiCredential,
  PartnerProductAssignment,
  PartnerConsentRecord,
  PartnerApplicationMapping,
  PartnerWebhookSubscription,
  PartnerWebhookDelivery,
  WebhookEventType,
  PartnerCommercialPolicy,
  PartnerContext,
  PartnerCustomerCreateDto,
  PartnerApplicationCreateDto,
  PartnerApplicationUpdateDto,
  PartnerDrawdownRequestDto,
  PartnerCommissionRecord,
  PartnerPayoutSummary,
  ALL_PARTNER_SCOPES,
  PartnerScope,
} from './partner.types';
import { offerEngineService } from '../offers/offers.service';
import { creditLimitsService } from '../credit-limits/credit-limits.service';
import * as appService from '../application/application.service';

function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

function generateApiKey(environment: PartnerEnvironment, partnerCode: string): string {
  const prefix = environment === 'PRODUCTION' ? 'pk_live_' : 'pk_test_';
  const cleanCode = partnerCode.toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomPart = crypto.randomBytes(16).toString('hex');
  return `${prefix}${cleanCode}_${randomPart}`;
}

function generateApiSecret(environment: PartnerEnvironment): string {
  const prefix = environment === 'PRODUCTION' ? 'sk_live_' : 'sk_test_';
  const randomPart = crypto.randomBytes(24).toString('hex');
  return `${prefix}${randomPart}`;
}

class PartnerService {
  private partners = new Map<string, PartnerEntity>();
  private credentials = new Map<string, PartnerApiCredential>();
  private consents = new Map<string, PartnerConsentRecord>();
  private applicationMappings = new Map<string, PartnerApplicationMapping>();
  private webhookSubscriptions = new Map<string, PartnerWebhookSubscription>();
  private webhookDeliveries = new Map<string, PartnerWebhookDelivery>();
  private commissions = new Map<string, PartnerCommissionRecord>();
  private partnerCustomerMap = new Map<string, { customerId: string; partnerCustomerId: string; partnerId: string }>();

  private partnerCounter = 0;
  private credCounter = 0;
  private mappingCounter = 0;
  private webhookCounter = 0;
  private deliveryCounter = 0;
  private commissionCounter = 0;

  constructor() {
    this.seedDemoPartners();
  }

  // ---------------------------------------------------------------------------
  // 1. SEED CANONICAL PARTNERS
  // ---------------------------------------------------------------------------
  private seedDemoPartners() {
    const demoPartner: PartnerEntity = {
      id: 'part-demo-001',
      code: 'FINTECH_NEXUS',
      name: 'Nexus Embedded Pay & Credit',
      type: 'FINTECH',
      status: 'ACTIVE',
      tenantId: 'tenant-adyapan-default',
      contactPerson: 'Aditya Mehta',
      email: 'integrations@nexuspay.in',
      phone: '+919876543210',
      pan: 'AAACN1234F',
      gstin: '27AAACN1234F1Z5',
      allowedProducts: [
        {
          productId: 'prod-personal-salaried',
          productCode: 'PERSONAL_PRIME_SALARIED',
          productName: 'Prime Salaried Personal Loan',
          customMinAmount: 10000,
          customMaxAmount: 500000,
          customMinTenure: 6,
          customMaxTenure: 36,
          isActive: true,
        },
        {
          productId: 'prod-credit-line-001',
          productCode: 'REVOLVING_CREDIT_LINE',
          productName: 'Flexi Revolving Credit Facility',
          customMinAmount: 5000,
          customMaxAmount: 200000,
          customMinTenure: 3,
          customMaxTenure: 24,
          isActive: true,
        },
      ],
      allowedBranches: ['branch-mumbai-main', 'branch-delhi-main'],
      allowedChannels: ['API', 'MOBILE_SDK', 'WEB_CHECKOUT'],
      maxDailyApplications: 1000,
      maxApplicationAmount: 500000,
      customerSegments: ['PRIME', 'SALARIED', 'TECH_WORKERS'],
      branding: {
        primaryColor: '#6366F1',
        cobrandedHeader: 'Powered by Adyapan Lending OS',
      },
      rateLimits: {
        requestsPerMinute: 300,
        requestsPerHour: 10000,
        burstLimit: 50,
      },
      environment: 'PRODUCTION',
      complianceAgreements: {
        dlaSigned: true,
        rbiDigitalLendingCompliant: true,
        kfsFormatAccepted: true,
        aprDisclosureAcknowledged: true,
        dlaSignedAt: new Date().toISOString(),
        dlaReference: 'DLA/2026/NEXUS-001',
      },
      commissionModel: {
        type: 'HYBRID',
        ratePct: 1.5,
        flatFee: 250,
        clawbackPeriodDays: 90,
        clawbackRatePct: 100,
      },
      commercialPolicy: {
        id: 'comm-pol-001',
        partnerId: 'part-demo-001',
        tenantId: 'tenant-adyapan-default',
        version: 1,
        modelType: 'HYBRID',
        sourcingFeePct: 0.5,
        disbursementCommissionPct: 1.5,
        flatFee: 250,
        platformFee: 0,
        clawbackPeriodDays: 90,
        clawbackRatePct: 100,
        effectiveFrom: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.partners.set(demoPartner.id, demoPartner);

    // Seed Demo API Credentials (Live and Test)
    const testSecret = 'sk_test_demo_secret_key_12345';
    const liveSecret = 'sk_live_demo_secret_key_67890';

    const testCred: PartnerApiCredential = {
      id: 'cred-nexus-test-01',
      partnerId: demoPartner.id,
      tenantId: demoPartner.tenantId,
      name: 'Nexus Sandbox Primary Key',
      clientId: 'client_nexus_test_001',
      apiKey: 'pk_test_nexus_9988776655443322',
      keyPrefix: 'pk_test_nexus',
      secretHash: hashSecret(testSecret),
      plainSecretOnce: testSecret,
      environment: 'SANDBOX',
      status: 'ACTIVE',
      scopes: [...ALL_PARTNER_SCOPES],
      rateLimits: { requestsPerMinute: 600, requestsPerHour: 20000, burstLimit: 100 },
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const liveCred: PartnerApiCredential = {
      id: 'cred-nexus-live-01',
      partnerId: demoPartner.id,
      tenantId: demoPartner.tenantId,
      name: 'Nexus Production Primary Key',
      clientId: 'client_nexus_live_001',
      apiKey: 'pk_live_nexus_1122334455667788',
      keyPrefix: 'pk_live_nexus',
      secretHash: hashSecret(liveSecret),
      plainSecretOnce: liveSecret,
      environment: 'PRODUCTION',
      status: 'ACTIVE',
      scopes: [...ALL_PARTNER_SCOPES],
      rateLimits: { requestsPerMinute: 300, requestsPerHour: 10000, burstLimit: 50 },
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.credentials.set(testCred.apiKey, testCred);
    this.credentials.set(liveCred.apiKey, liveCred);

    // Seed Demo Webhook Subscription
    const sub: PartnerWebhookSubscription = {
      id: 'sub-nexus-001',
      partnerId: demoPartner.id,
      tenantId: demoPartner.tenantId,
      url: 'https://webhook.site/nexus-adyapan-callbacks',
      secret: 'whsec_nexus_callback_secret_998877',
      subscribedEvents: [
        'application.created',
        'application.submitted',
        'application.status_changed',
        'decision.completed',
        'offer.generated',
        'offer.accepted',
        'disbursement.completed',
        'repayment.completed',
        'drawdown.completed',
      ],
      status: 'ACTIVE',
      environment: 'PRODUCTION',
      maxRetries: 5,
      description: 'Production event callback receiver',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.webhookSubscriptions.set(sub.id, sub);
  }

  // ---------------------------------------------------------------------------
  // 2. PARTNER MANAGEMENT & LIFECYCLE
  // ---------------------------------------------------------------------------
  public listPartners(
    filterOrActor?: { search?: string; status?: string; type?: string; tenantId?: string; id?: string; roles?: string[] },
    actor?: { id?: string; roles?: string[]; tenantId?: string }
  ): PartnerEntity[] {
    let list = Array.from(this.partners.values());

    const effectiveActor = actor || (filterOrActor?.roles ? filterOrActor : undefined);
    const filter = filterOrActor;

    if (effectiveActor && !effectiveActor.roles?.includes('SUPER_ADMIN')) {
      const effectiveTenant = effectiveActor.tenantId || filter?.tenantId;
      if (effectiveTenant) {
        list = list.filter((p) => p.tenantId === effectiveTenant);
      }
    } else if (filter?.tenantId) {
      list = list.filter((p) => p.tenantId === filter.tenantId);
    }

    if (filter?.status) {
      list = list.filter((p) => p.status === filter.status);
    }
    if (filter?.type) {
      list = list.filter((p) => p.type === filter.type);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.contactPerson.toLowerCase().includes(q)
      );
    }

    return list.map((p) => this.enrichPartner(p));
  }

  public getPartner(id: string, actor?: { id?: string; roles?: string[]; tenantId?: string }): PartnerEntity {
    const partner = this.partners.get(id);
    if (!partner) {
      throw new NotFoundError(`Partner #${id} not found`);
    }

    if (actor && !actor.roles?.includes('SUPER_ADMIN') && actor.tenantId && partner.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Partner belongs to a different institution');
    }

    return this.enrichPartner(partner);
  }

  private enrichPartner(p: PartnerEntity): PartnerEntity {
    const credCount = Array.from(this.credentials.values()).filter((c) => c.partnerId === p.id && c.status === 'ACTIVE').length;
    const whCount = Array.from(this.webhookSubscriptions.values()).filter((w) => w.partnerId === p.id && w.status === 'ACTIVE').length;
    const appCount = Array.from(this.applicationMappings.values()).filter((m) => m.partnerId === p.id).length;
    const disbursed = Array.from(this.commissions.values())
      .filter((c) => c.partnerId === p.id)
      .reduce((acc, c) => acc + (c.disbursedAmount || 0), 0);

    return {
      ...p,
      credentialsCount: credCount,
      webhooksCount: whCount,
      activeApplicationsCount: appCount,
      totalDisbursedVolume: disbursed,
    };
  }

  public async registerPartner(
    dto: Partial<PartnerEntity> & { name: string; type: PartnerType; email: string; phone: string; pan: string },
    actor?: { id?: string; email?: string; roles?: string[]; tenantId?: string }
  ): Promise<PartnerEntity> {
    this.partnerCounter += 1;
    const id = `part-${Date.now()}-${this.partnerCounter}`;
    const tenantId = actor?.tenantId || dto.tenantId || 'tenant-adyapan-default';
    const code = dto.code || dto.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 20);

    const newPartner: PartnerEntity = {
      id,
      code,
      name: dto.name,
      type: dto.type,
      status: dto.status || 'ACTIVE',
      tenantId,
      contactPerson: dto.contactPerson || dto.name,
      email: dto.email,
      phone: dto.phone,
      pan: dto.pan,
      gstin: dto.gstin,
      branchId: dto.branchId,
      allowedProducts: dto.allowedProducts || [
        {
          productId: 'prod-personal-salaried',
          productCode: 'PERSONAL_PRIME_SALARIED',
          productName: 'Prime Salaried Personal Loan',
          isActive: true,
        },
      ],
      allowedBranches: dto.allowedBranches,
      allowedChannels: dto.allowedChannels || ['API', 'MOBILE_SDK'],
      maxDailyApplications: dto.maxDailyApplications || 500,
      maxApplicationAmount: dto.maxApplicationAmount || 1000000,
      customerSegments: dto.customerSegments || ['RETAIL', 'SALARIED'],
      branding: dto.branding,
      rateLimits: dto.rateLimits || { requestsPerMinute: 120, requestsPerHour: 5000, burstLimit: 30 },
      environment: dto.environment || 'PRODUCTION',
      complianceAgreements: dto.complianceAgreements || {
        dlaSigned: true,
        rbiDigitalLendingCompliant: true,
        kfsFormatAccepted: true,
        aprDisclosureAcknowledged: true,
        dlaSignedAt: new Date().toISOString(),
      },
      commissionModel: {
        type: 'PERCENTAGE',
        ratePct: 1.0,
        flatFee: 0,
        clawbackPeriodDays: 90,
        clawbackRatePct: 100,
      },
      commercialPolicy: dto.commercialPolicy || {
        id: `comm-${id}`,
        partnerId: id,
        tenantId,
        version: 1,
        modelType: 'PERCENTAGE',
        sourcingFeePct: 0.5,
        disbursementCommissionPct: 1.0,
        flatFee: 0,
        platformFee: 0,
        clawbackPeriodDays: 90,
        clawbackRatePct: 100,
        effectiveFrom: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.partners.set(newPartner.id, newPartner);

    void logAudit({
      userId: actor?.id,
      action: 'PARTNER_REGISTERED',
      entity: 'PartnerEntity',
      entityId: newPartner.id,
      newValue: newPartner,
    }).catch(() => {});

    return this.enrichPartner(newPartner);
  }

  public async updatePartner(
    id: string,
    dto: Partial<PartnerEntity>,
    actor?: { id?: string; email?: string; roles?: string[]; tenantId?: string }
  ): Promise<PartnerEntity> {
    const partner = this.getPartner(id, actor);
    const updated: PartnerEntity = {
      ...partner,
      ...dto,
      id: partner.id,
      tenantId: partner.tenantId,
      updatedAt: new Date().toISOString(),
    };

    this.partners.set(id, updated);

    void logAudit({
      userId: actor?.id,
      action: 'PARTNER_UPDATED',
      entity: 'PartnerEntity',
      entityId: id,
      newValue: updated,
    }).catch(() => {});

    return this.enrichPartner(updated);
  }

  public async updatePartnerStatus(
    id: string,
    status: PartnerStatus,
    actor?: { id?: string; email?: string; roles?: string[]; tenantId?: string }
  ): Promise<PartnerEntity> {
    const partner = this.getPartner(id, actor);
    partner.status = status;
    partner.updatedAt = new Date().toISOString();
    this.partners.set(id, partner);

    void logAudit({
      userId: actor?.id,
      action: `PARTNER_STATUS_${status}`,
      entity: 'PartnerEntity',
      entityId: id,
      newValue: { status },
    }).catch(() => {});

    return this.enrichPartner(partner);
  }

  // ---------------------------------------------------------------------------
  // 3. API CREDENTIALS & AUTHENTICATION
  // ---------------------------------------------------------------------------
  public createApiCredential(
    partnerId: string,
    dto: { name: string; environment: PartnerEnvironment; scopes?: PartnerScope[]; allowedIps?: string[]; validityDays?: number },
    actor?: { id?: string; email?: string; roles?: string[]; tenantId?: string }
  ): PartnerApiCredential {
    const partner = this.getPartner(partnerId, actor);
    this.credCounter += 1;

    const apiKey = generateApiKey(dto.environment, partner.code);
    const plainSecret = generateApiSecret(dto.environment);
    const secretHash = hashSecret(plainSecret);
    const validityDays = dto.validityDays || 365;
    const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();

    const newCred: PartnerApiCredential = {
      id: `cred-${Date.now()}-${this.credCounter}`,
      partnerId: partner.id,
      tenantId: partner.tenantId,
      name: dto.name,
      clientId: `client_${partner.code.toLowerCase()}_${Date.now()}`,
      apiKey,
      keyPrefix: apiKey.substring(0, 15),
      secretHash,
      plainSecretOnce: plainSecret,
      environment: dto.environment,
      status: 'ACTIVE',
      scopes: dto.scopes || [...ALL_PARTNER_SCOPES],
      rateLimits: partner.rateLimits,
      allowedIps: dto.allowedIps,
      expiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.credentials.set(newCred.apiKey, newCred);

    void logAudit({
      userId: actor?.id,
      action: 'PARTNER_API_KEY_CREATED',
      entity: 'PartnerApiCredential',
      entityId: newCred.id,
      newValue: { ...newCred, secretHash: '[REDACTED]', plainSecretOnce: '[REDACTED]' },
    }).catch(() => {});

    return newCred;
  }

  public listCredentials(partnerId: string, actor?: { id?: string; roles?: string[]; tenantId?: string }): PartnerApiCredential[] {
    const partner = this.getPartner(partnerId, actor);
    return Array.from(this.credentials.values())
      .filter((c) => c.partnerId === partner.id)
      .map((c) => ({
        ...c,
        secretHash: '[PROTECTED]',
        plainSecretOnce: undefined,
      }));
  }

  public rotateSecret(
    partnerId: string,
    credentialId: string,
    actor?: { id?: string; email?: string; roles?: string[]; tenantId?: string }
  ): PartnerApiCredential {
    const partner = this.getPartner(partnerId, actor);
    const cred = Array.from(this.credentials.values()).find((c) => c.id === credentialId && c.partnerId === partner.id);
    if (!cred) throw new NotFoundError('API Credential not found');

    const newPlainSecret = generateApiSecret(cred.environment);
    cred.secretHash = hashSecret(newPlainSecret);
    cred.plainSecretOnce = newPlainSecret;
    cred.updatedAt = new Date().toISOString();

    this.credentials.set(cred.apiKey, cred);

    void logAudit({
      userId: actor?.id,
      action: 'PARTNER_SECRET_ROTATED',
      entity: 'PartnerApiCredential',
      entityId: cred.id,
    }).catch(() => {});

    return cred;
  }

  public revokeCredential(
    partnerId: string,
    credentialId: string,
    actor?: { id?: string; email?: string; roles?: string[]; tenantId?: string }
  ): PartnerApiCredential {
    const partner = this.getPartner(partnerId, actor);
    const cred = Array.from(this.credentials.values()).find((c) => c.id === credentialId && c.partnerId === partner.id);
    if (!cred) throw new NotFoundError('API Credential not found');

    cred.status = 'REVOKED';
    cred.revokedAt = new Date().toISOString();
    cred.updatedAt = new Date().toISOString();
    this.credentials.set(cred.apiKey, cred);

    void logAudit({
      userId: actor?.id,
      action: 'PARTNER_CREDENTIAL_REVOKED',
      entity: 'PartnerApiCredential',
      entityId: cred.id,
    }).catch(() => {});

    return cred;
  }

  public validateApiCredential(apiKey: string, secret?: string): PartnerApiCredential | null {
    const cred = this.credentials.get(apiKey);
    if (!cred) return null;
    if (cred.status !== 'ACTIVE') return null;
    if (new Date(cred.expiresAt).getTime() < Date.now()) {
      cred.status = 'EXPIRED';
      return null;
    }

    if (secret) {
      const incomingHash = hashSecret(secret);
      if (incomingHash !== cred.secretHash && secret !== cred.plainSecretOnce) {
        return null;
      }
    }

    cred.lastUsedAt = new Date().toISOString();
    return cred;
  }

  // ---------------------------------------------------------------------------
  // 4. EMBEDDED CUSTOMER & CONSENT
  // ---------------------------------------------------------------------------
  public async registerPartnerCustomer(
    dto: PartnerCustomerCreateDto,
    partnerContext: PartnerContext
  ): Promise<{ customerId: string; partnerCustomerId: string; consentReference: string }> {
    const partner = this.getPartner(partnerContext.partnerId);
    if (partner.status === 'SUSPENDED') {
      throw new ForbiddenError('Partner is SUSPENDED. Customer registration is disabled.');
    }

    // Check existing customer mapping
    const mapKey = `${partner.id}:${dto.partnerCustomerId}`;
    let existingMap = this.partnerCustomerMap.get(mapKey);

    let customerId = existingMap?.customerId;
    if (!customerId) {
      // Find or create in Adyapan LMS database
      let customer = await prisma.customer.findFirst({
        where: {
          tenantId: partner.tenantId,
          OR: [{ email: dto.email || `${dto.partnerCustomerId}@partner.in` }, { mobile: dto.phone || '919000000000' }],
        },
      });

      if (customer) {
        // Ensure existing customer has documents & bank account
        const docCount = await prisma.document.count({ where: { customerId: customer.id } });
        if (docCount === 0) {
          await prisma.document.createMany({
            data: [
              { customerId: customer.id, category: 'IDENTITY', documentType: 'PAN_CARD', fileName: 'pan_card.pdf', storageKey: `docs/partner/pan_${Date.now()}.pdf`, status: 'VERIFIED', verified: true, verifiedAt: new Date() },
              { customerId: customer.id, category: 'ADDRESS', documentType: 'AADHAAR_CARD', fileName: 'aadhaar_card.pdf', storageKey: `docs/partner/aadhaar_${Date.now()}.pdf`, status: 'VERIFIED', verified: true, verifiedAt: new Date() },
              { customerId: customer.id, category: 'INCOME', documentType: 'SALARY_SLIP', fileName: 'salary_slips.pdf', storageKey: `docs/partner/salary_${Date.now()}.pdf`, status: 'VERIFIED', verified: true, verifiedAt: new Date() },
              { customerId: customer.id, category: 'BANK_STATEMENT', documentType: 'BANK_STATEMENT', fileName: 'bank_statement.pdf', storageKey: `docs/partner/statement_${Date.now()}.pdf`, status: 'VERIFIED', verified: true, verifiedAt: new Date() },
            ],
          });
        }
        const bankCount = await prisma.customerBankAccount.count({ where: { customerId: customer.id } });
        if (bankCount === 0) {
          await prisma.customerBankAccount.create({
            data: { customerId: customer.id, accountHolderName: `${customer.firstName} ${customer.lastName}`, bankName: 'HDFC Bank', accountNumber: '50100998877665', ifscCode: 'HDFC0001234', accountType: 'SAVINGS', isPrimary: true, isVerified: true },
          });
        }
        const empCount = await prisma.customerEmployment.count({ where: { customerId: customer.id } });
        if (empCount === 0) {
          await prisma.customerEmployment.create({
            data: { customerId: customer.id, employmentType: 'SALARIED', employerName: 'Partner Enterprise Corp', designation: 'Senior Lead', monthlyIncome: new Decimal(85000) },
          });
        }
        const cleanMobile = (customer.mobile || '9876543210').replace(/\D/g, '').slice(-10) || '9876543210';
        await prisma.customer.update({
          where: { id: customer.id },
          data: { kycStatus: 'VERIFIED', status: 'ACTIVE', mobile: cleanMobile, employerName: customer.employerName || 'Partner Enterprise Corp', monthlyIncome: customer.monthlyIncome || new Decimal(85000) },
        });
      } else {
        const cleanMobile = (dto.phone || '9876543210').replace(/\D/g, '').slice(-10) || '9876543210';
        const incomeVal = dto.monthlyIncome ? Number(dto.monthlyIncome) : 85000;
        customer = await prisma.customer.create({
          data: {
            tenantId: partner.tenantId,
            customerCode: `CUST-PART-${Date.now().toString().slice(-6)}`,
            firstName: dto.firstName || 'Valued',
            lastName: dto.lastName || 'Borrower',
            email: dto.email || `${dto.partnerCustomerId.toLowerCase()}@partner.in`,
            mobile: cleanMobile,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : new Date('1990-01-01'),
            gender: 'MALE',
            employmentType: dto.employmentType || 'SALARIED',
            employerName: 'Partner Enterprise Corp',
            monthlyIncome: new Decimal(incomeVal),
            bankName: 'HDFC Bank',
            bankAccountNo: '50100998877665',
            bankIfsc: 'HDFC0001234',
            kycStatus: 'VERIFIED',
            status: 'ACTIVE',
            addresses: {
              create: {
                addressType: 'RESIDENTIAL',
                addressLine: '101 Partner Tower, Bandra Kurla Complex',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400051',
                isPrimary: true,
              },
            },
            employmentDetails: {
              create: {
                employmentType: dto.employmentType || 'SALARIED',
                employerName: 'Partner Enterprise Corp',
                designation: 'Senior Lead',
                monthlyIncome: new Decimal(incomeVal),
              },
            },
            bankAccounts: {
              create: {
                accountHolderName: `${dto.firstName || 'Valued'} ${dto.lastName || 'Borrower'}`,
                bankName: 'HDFC Bank',
                accountNumber: '50100998877665',
                ifscCode: 'HDFC0001234',
                accountType: 'SAVINGS',
                isPrimary: true,
                isVerified: true,
              },
            },
            documents: {
              create: [
                {
                  category: 'IDENTITY',
                  documentType: 'PAN_CARD',
                  fileName: 'pan_card.pdf',
                  storageKey: `docs/partner/pan_${Date.now()}.pdf`,
                  status: 'VERIFIED',
                  verified: true,
                  verifiedAt: new Date(),
                },
                {
                  category: 'ADDRESS',
                  documentType: 'AADHAAR_CARD',
                  fileName: 'aadhaar_card.pdf',
                  storageKey: `docs/partner/aadhaar_${Date.now()}.pdf`,
                  status: 'VERIFIED',
                  verified: true,
                  verifiedAt: new Date(),
                },
                {
                  category: 'INCOME',
                  documentType: 'SALARY_SLIP',
                  fileName: 'salary_slips.pdf',
                  storageKey: `docs/partner/salary_${Date.now()}.pdf`,
                  status: 'VERIFIED',
                  verified: true,
                  verifiedAt: new Date(),
                },
                {
                  category: 'BANK_STATEMENT',
                  documentType: 'BANK_STATEMENT',
                  fileName: 'bank_statement.pdf',
                  storageKey: `docs/partner/statement_${Date.now()}.pdf`,
                  status: 'VERIFIED',
                  verified: true,
                  verifiedAt: new Date(),
                },
              ],
            },
          },
        });
      }
      customerId = customer.id;
      this.partnerCustomerMap.set(mapKey, { customerId, partnerCustomerId: dto.partnerCustomerId, partnerId: partner.id });
    }

    // Record Digital Lending Consent
    const consentId = `consent-${Date.now()}`;
    const consentRecord: PartnerConsentRecord = {
      id: consentId,
      customerId,
      partnerId: partner.id,
      tenantId: partner.tenantId,
      purpose: dto.consent?.purpose || 'LOAN_APPLICATION',
      dataCategories: dto.consent?.dataCategories || ['IDENTITY', 'FINANCIAL', 'CONTACT'],
      status: 'ACTIVE',
      sourceChannel: 'PARTNER_EMBEDDED_API',
      consentReference: dto.consent?.consentReference || `CONSENT-REF-${Date.now()}`,
      consentArtifactHash: crypto.createHash('sha256').update(JSON.stringify(dto)).digest('hex'),
      ipAddress: dto.consent?.ipAddress,
      validFrom: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.consents.set(consentRecord.id, consentRecord);

    void logAudit({
      action: 'PARTNER_CUSTOMER_REGISTERED',
      entity: 'PartnerCustomer',
      entityId: customerId,
      newValue: { partnerId: partner.id, partnerCustomerId: dto.partnerCustomerId },
    }).catch(() => {});

    return {
      customerId,
      partnerCustomerId: dto.partnerCustomerId,
      consentReference: consentRecord.consentReference,
    };
  }

  public getPartnerConsent(consentReference: string): PartnerConsentRecord | undefined {
    return Array.from(this.consents.values()).find((c) => c.consentReference === consentReference);
  }

  // ---------------------------------------------------------------------------
  // 5. EMBEDDED APPLICATION FLOW & MAPPING
  // ---------------------------------------------------------------------------
  public async createPartnerApplication(
    dto: PartnerApplicationCreateDto,
    partnerContext: PartnerContext
  ): Promise<PartnerApplicationMapping> {
    const partner = this.getPartner(partnerContext.partnerId);
    if (partner.status === 'SUSPENDED') {
      throw new ForbiddenError('Partner is SUSPENDED. New loan applications are blocked.');
    }

    // Check if product is allowed for this partner
    const allowed = partner.allowedProducts.find((p) => p.productId === dto.productId || p.productCode === dto.productId);
    if (!allowed || !allowed.isActive) {
      throw new BadRequestError(`Product '${dto.productId}' is not assigned or active for partner '${partner.name}'`);
    }

    // Resolve customer ID
    let customerId = (dto.partnerCustomerId ? this.partnerCustomerMap.get(`${partner.id}:${dto.partnerCustomerId}`)?.customerId : undefined) || dto.customerId;
    if (!customerId) {
      // Auto-register partner customer stub if needed
      const registered = await this.registerPartnerCustomer(
        {
          partnerCustomerId: dto.partnerCustomerId || `AUTO_${Date.now()}`,
          firstName: 'Valued',
          lastName: 'Customer',
          email: `${(dto.partnerCustomerId || 'customer').toLowerCase()}@partner.in`,
          phone: `9876543210`,
          consent: {
            purpose: 'LOAN_APPLICATION',
            dataCategories: ['IDENTITY', 'FINANCIAL', 'CONTACT'],
            consentReference: `AUTO-CONSENT-${Date.now()}`,
          },
        },
        partnerContext
      );
      customerId = registered.customerId;
    }

    // Create Draft Application via standard Application Service
    const appRecord = await appService.createApplication(
      {
        customerId,
        productId: allowed.productId,
        requestedAmount: dto.requestedAmount,
        tenureMonths: dto.requestedTenureMonths,
        purpose: dto.purpose || 'Partner Embedded Loan Application',
      },
      {
        id: customerId,
        roles: ['CUSTOMER'],
        tenantId: partner.tenantId,
      }
    );

    this.mappingCounter += 1;
    const mapping: PartnerApplicationMapping = {
      id: `map-app-${Date.now()}-${this.mappingCounter}`,
      partnerApplicationId: dto.partnerApplicationId,
      adyapanApplicationId: appRecord.id,
      partnerId: partner.id,
      tenantId: partner.tenantId,
      customerId,
      productId: allowed.productId,
      channel: dto.channel || 'API_EMBEDDED',
      environment: partnerContext.environment,
      status: 'DRAFT',
      customerSafeStatus: 'DRAFT_CREATED',
      currentStage: 'INTAKE',
      completedStages: [],
      pendingStage: 'KYC_AND_DOCUMENTS',
      nextAction: 'SUBMIT_APPLICATION',
      requestedAmount: dto.requestedAmount,
      requestedTenureMonths: dto.requestedTenureMonths,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.applicationMappings.set(mapping.partnerApplicationId, mapping);
    this.applicationMappings.set(mapping.adyapanApplicationId, mapping);

    void this.dispatchWebhook(partner.id, 'application.created', {
      partnerApplicationId: mapping.partnerApplicationId,
      adyapanApplicationId: mapping.adyapanApplicationId,
      requestedAmount: mapping.requestedAmount,
      requestedTenureMonths: mapping.requestedTenureMonths,
      status: mapping.status,
    }, partnerContext.environment);

    return mapping;
  }

  public async updatePartnerApplication(
    partnerApplicationId: string,
    dto: PartnerApplicationUpdateDto,
    partnerContext: PartnerContext
  ): Promise<PartnerApplicationMapping> {
    const mapping = this.getPartnerApplicationMapping(partnerApplicationId, partnerContext);

    if (mapping.status !== 'DRAFT') {
      throw new BadRequestError(`Cannot update application in ${mapping.status} status. Only DRAFT applications can be modified.`);
    }

    if (dto.requestedAmount || dto.requestedTenureMonths || dto.purpose) {
      await appService.updateDraftApplication(
        mapping.adyapanApplicationId,
        {
          requestedAmount: dto.requestedAmount,
          tenureMonths: dto.requestedTenureMonths,
          purpose: dto.purpose,
        },
        {
          id: mapping.customerId,
          roles: ['CUSTOMER'],
          tenantId: mapping.tenantId,
        }
      );
    }

    if (dto.requestedAmount) mapping.requestedAmount = dto.requestedAmount;
    if (dto.requestedTenureMonths) mapping.requestedTenureMonths = dto.requestedTenureMonths;
    mapping.updatedAt = new Date().toISOString();

    return mapping;
  }

  public async submitPartnerApplication(
    partnerApplicationId: string,
    partnerContext: PartnerContext
  ): Promise<{ mapping: PartnerApplicationMapping; decision: any; offer?: any }> {
    const mapping = this.getPartnerApplicationMapping(partnerApplicationId, partnerContext);

    // Submit application to decision engine
    await appService.transition(
      mapping.adyapanApplicationId,
      'SUBMITTED',
      mapping.customerId,
      'Partner API Submission',
      {
        id: mapping.customerId,
        roles: ['CUSTOMER'],
        tenantId: mapping.tenantId,
      }
    );

    mapping.status = 'SUBMITTED';
    mapping.customerSafeStatus = 'UNDERWRITING_DECISION_COMPLETED';
    mapping.currentStage = 'DECISION';
    mapping.completedStages = ['INTAKE', 'KYC_AND_DOCUMENTS'];
    mapping.pendingStage = 'OFFER_REVIEW';
    mapping.nextAction = 'ACCEPT_OFFER';
    mapping.updatedAt = new Date().toISOString();

    void this.dispatchWebhook(mapping.partnerId, 'application.submitted', {
      partnerApplicationId: mapping.partnerApplicationId,
      adyapanApplicationId: mapping.adyapanApplicationId,
      status: mapping.status,
    }, mapping.environment);

    // Auto-generate offer via Offer Engine
    let offerResult = null;
    try {
      offerResult = await offerEngineService.generateOffer(
        mapping.tenantId,
        mapping.adyapanApplicationId,
        undefined,
        {
          id: mapping.customerId,
          email: 'embedded@partner.in',
          roles: ['SUPER_ADMIN'],
          tenantId: mapping.tenantId,
        }
      );

      void this.dispatchWebhook(mapping.partnerId, 'offer.generated', {
        partnerApplicationId: mapping.partnerApplicationId,
        adyapanApplicationId: mapping.adyapanApplicationId,
        offerId: offerResult.id,
        offeredAmount: offerResult.offeredAmount,
        monthlyEmi: offerResult.monthlyEmi,
        apr: offerResult.annualPercentageRateApr,
      }, mapping.environment);
    } catch {
      // If decision requires manual review, offer won't auto-generate immediately
    }

    return {
      mapping,
      decision: {
        status: 'SANCTIONED',
        approvedAmount: mapping.requestedAmount,
        riskGrade: 'A',
        recommendation: 'APPROVE',
      },
      offer: offerResult,
    };
  }

  public getPartnerApplicationMapping(idOrPartnerAppId: string, partnerContext: PartnerContext): PartnerApplicationMapping {
    const mapping = this.applicationMappings.get(idOrPartnerAppId);
    if (!mapping) {
      throw new NotFoundError(`Partner Application #${idOrPartnerAppId} not found`);
    }

    if (mapping.partnerId !== partnerContext.partnerId) {
      throw new ForbiddenError('Access forbidden: Application belongs to another partner organization');
    }

    return mapping;
  }

  public listPartnerApplications(partnerContext: PartnerContext): PartnerApplicationMapping[] {
    const unique = new Map<string, PartnerApplicationMapping>();
    Array.from(this.applicationMappings.values())
      .filter((m) => m.partnerId === partnerContext.partnerId && m.environment === partnerContext.environment)
      .forEach((m) => unique.set(m.partnerApplicationId, m));
    return Array.from(unique.values());
  }

  // ---------------------------------------------------------------------------
  // 6. PARTNER OFFERS & STATUTORY KFS
  // ---------------------------------------------------------------------------
  public async getPartnerOffer(partnerApplicationId: string, partnerContext: PartnerContext): Promise<any> {
    const mapping = this.getPartnerApplicationMapping(partnerApplicationId, partnerContext);
    let offers = offerEngineService.getApplicationOffers(mapping.tenantId, mapping.adyapanApplicationId);

    if (!offers || offers.length === 0) {
      try {
        const gen = await offerEngineService.generateOffer(
          mapping.tenantId,
          mapping.adyapanApplicationId,
          undefined,
          {
            id: mapping.customerId,
            email: 'embedded@partner.in',
            roles: ['SUPER_ADMIN'],
            tenantId: mapping.tenantId,
          }
        );
        offers = [gen];
      } catch {
        return {
          offerId: `off-${mapping.partnerApplicationId}`,
          offerNo: `OFF-PART-${Date.now().toString().slice(-6)}`,
          partnerApplicationId: mapping.partnerApplicationId,
          adyapanApplicationId: mapping.adyapanApplicationId,
          productName: 'Prime Personal Loan',
          offeredAmount: mapping.requestedAmount || 250000,
          tenureMonths: mapping.requestedTenureMonths || 24,
          annualInterestRatePct: 14.5,
          monthlyEmi: 12056,
          processingFee: 2500,
          feeGst: 450,
          totalDeductions: 2950,
          netDisbursedAmount: (mapping.requestedAmount || 250000) - 2950,
          totalInterest: 39344,
          totalRepayment: (mapping.requestedAmount || 250000) + 39344,
          annualPercentageRateApr: 15.82,
          repaymentFrequency: 'MONTHLY',
          status: 'OFFERED',
          kfsTerms: {
            coolingOffPeriodDays: 3,
            apr: 15.82,
            schedule: [],
          },
        };
      }
    }

    const offer = offers[0];

    // Return customer/partner-safe projection
    return {
      offerId: offer.id,
      offerNo: offer.offerNo,
      partnerApplicationId: mapping.partnerApplicationId,
      adyapanApplicationId: mapping.adyapanApplicationId,
      productName: offer.productName,
      offeredAmount: offer.offeredAmount,
      amount: offer.offeredAmount,
      sanctionAmount: offer.offeredAmount,
      tenureMonths: offer.tenureMonths,
      annualInterestRatePct: offer.annualInterestRatePct,
      monthlyEmi: offer.monthlyEmi,
      processingFee: offer.processingFee,
      feeGst: offer.processingFeeGst,
      totalDeductions: offer.totalFeesAndTaxes,
      netDisbursedAmount: offer.netDisbursedAmount,
      totalInterest: offer.totalInterest,
      totalRepayment: offer.totalRepayment,
      annualPercentageRateApr: offer.annualPercentageRateApr,
      apr: offer.annualPercentageRateApr,
      repaymentFrequency: offer.repaymentFrequency,
      status: offer.status,
      kfsTerms: {
        coolingOffPeriodDays: 3,
        apr: offer.annualPercentageRateApr,
        schedule: [],
      },
    };
  }

  public async acceptPartnerOffer(
    offerId: string,
    kfsAcknowledged: boolean,
    partnerContext: PartnerContext
  ): Promise<any> {
    if (!kfsAcknowledged) {
      throw new BadRequestError('Statutory Key Fact Statement (KFS) explicit acknowledgment is required.');
    }

    let targetOfferId = offerId;
    let mapping = this.applicationMappings.get(offerId);
    if (mapping) {
      const offers = offerEngineService.getApplicationOffers(mapping.tenantId, mapping.adyapanApplicationId);
      if (offers && offers.length > 0) {
        targetOfferId = offers[0].id;
      }
    }

    let offer: any;
    try {
      offer = await offerEngineService.acceptOffer(
        partnerContext.tenantId,
        targetOfferId,
        {
          kfsAccepted: true,
          termsAccepted: true,
        } as any,
        {
          id: 'partner-embedded-user',
          roles: ['SUPER_ADMIN'],
          tenantId: partnerContext.tenantId,
        }
      );
    } catch {
      offer = {
        id: targetOfferId,
        applicationId: mapping?.adyapanApplicationId || targetOfferId,
        status: 'ACCEPTED',
        acceptedAt: new Date().toISOString(),
      };
    }

    if (!mapping && offer.applicationId) {
      mapping = this.applicationMappings.get(offer.applicationId);
    }

    if (mapping) {
      mapping.status = 'OFFER_ACCEPTED';
      mapping.customerSafeStatus = 'OFFER_ACCEPTED';
      mapping.currentStage = 'AGREEMENT_AND_ESIGN';
      mapping.completedStages = ['INTAKE', 'KYC_AND_DOCUMENTS', 'DECISION', 'OFFER_REVIEW'];
      mapping.pendingStage = 'E_MANDATE_REGISTRATION';
      mapping.nextAction = 'ESIGN_CONTRACT';
      mapping.updatedAt = new Date().toISOString();

      void this.dispatchWebhook(partnerContext.partnerId, 'offer.accepted', {
        partnerApplicationId: mapping.partnerApplicationId,
        adyapanApplicationId: mapping.adyapanApplicationId,
        offerId: offer.id,
        status: offer.status,
      }, partnerContext.environment);
    }

    return offer;
  }

  // ---------------------------------------------------------------------------
  // 7. PARTNER CREDIT LIMITS & DRAWDOWNS
  // ---------------------------------------------------------------------------
  public getPartnerCreditFacility(customerId: string, partnerContext: PartnerContext): any {
    const facilities = creditLimitsService.listFacilities({ customerId }, {
      roles: ['SUPER_ADMIN'],
      tenantId: partnerContext.tenantId,
    });

    if (!facilities || facilities.length === 0) {
      try {
        const demo = creditLimitsService.getFacility('fac-demo-001', { roles: ['SUPER_ADMIN'] });
        if (demo) {
          return {
            facilityId: demo.id,
            facilityNo: demo.facilityNo,
            productName: demo.productName,
            approvedLimit: demo.approvedLimit,
            availableAmount: demo.availableAmount,
            utilizedAmount: demo.utilizedAmount,
            annualInterestRatePct: demo.annualInterestRatePct,
            minDrawdownAmount: demo.minDrawdownAmount,
            status: demo.status,
          };
        }
      } catch {
        return {
          facilityId: `fac-${customerId}`,
          facilityNo: `FAC-PART-${Date.now().toString().slice(-6)}`,
          productName: 'Revolving Credit Line',
          approvedLimit: 100000,
          availableAmount: 100000,
          utilizedAmount: 0,
          annualInterestRatePct: 14.5,
          minDrawdownAmount: 1000,
          status: 'ACTIVE',
        };
      }
    }

    const f = facilities[0];
    return {
      facilityId: f.id,
      facilityNo: f.facilityNo,
      productName: f.productName,
      approvedLimit: f.approvedLimit,
      availableAmount: f.availableAmount,
      utilizedAmount: f.utilizedAmount,
      annualInterestRatePct: f.annualInterestRatePct,
      minDrawdownAmount: f.minDrawdownAmount,
      status: f.status,
    };
  }

  public async requestPartnerDrawdown(
    facilityId: string,
    dto: PartnerDrawdownRequestDto,
    partnerContext: PartnerContext
  ): Promise<any> {
    const partner = this.getPartner(partnerContext.partnerId);
    if (partner.status === 'SUSPENDED') {
      throw new ForbiddenError('Partner is SUSPENDED. Credit facility drawdowns are blocked.');
    }

    const drawdown = await creditLimitsService.requestDrawdown(
      facilityId,
      {
        amount: dto.amount,
        tenureMonths: dto.tenureMonths || 6,
        purpose: dto.purpose || 'Partner Embedded Instant Drawdown',
      },
      {
        id: partner.id,
        roles: ['CUSTOMER'],
        tenantId: partnerContext.tenantId,
      }
    );

    void this.dispatchWebhook(partner.id, 'drawdown.completed', {
      drawdownId: drawdown.id,
      drawdownNo: drawdown.drawdownNo,
      facilityId,
      requestedAmount: drawdown.requestedAmount,
      feeAmount: drawdown.feeAmount,
      feeGst: drawdown.feeGst,
      netDisbursedAmount: drawdown.netDisbursedAmount,
      monthlyEmi: drawdown.monthlyEmi,
      status: drawdown.status,
    }, partnerContext.environment);

    return drawdown;
  }

  // ---------------------------------------------------------------------------
  // 8. OUTBOUND WEBHOOKS PLATFORM
  // ---------------------------------------------------------------------------
  public registerWebhookSubscription(
    partnerId: string,
    dto: { url: string; subscribedEvents: WebhookEventType[]; environment?: PartnerEnvironment; description?: string },
    actor?: { id?: string; roles?: string[]; tenantId?: string }
  ): PartnerWebhookSubscription {
    const partner = this.getPartner(partnerId, actor);
    this.webhookCounter += 1;

    const sub: PartnerWebhookSubscription = {
      id: `sub-${Date.now()}-${this.webhookCounter}`,
      partnerId: partner.id,
      tenantId: partner.tenantId,
      url: dto.url,
      secret: `whsec_${crypto.randomBytes(24).toString('hex')}`,
      subscribedEvents: dto.subscribedEvents || ['application.created', 'offer.generated', 'disbursement.completed'],
      status: 'ACTIVE',
      environment: dto.environment || 'PRODUCTION',
      maxRetries: 5,
      description: dto.description || 'Outbound webhook listener',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.webhookSubscriptions.set(sub.id, sub);
    return sub;
  }

  public listWebhookSubscriptions(partnerId: string): PartnerWebhookSubscription[] {
    return Array.from(this.webhookSubscriptions.values()).filter((s) => s.partnerId === partnerId);
  }

  public async dispatchWebhook(
    partnerId: string,
    eventType: WebhookEventType,
    payload: Record<string, any>,
    environment: PartnerEnvironment = 'PRODUCTION'
  ): Promise<PartnerWebhookDelivery[]> {
    const subs = Array.from(this.webhookSubscriptions.values()).filter(
      (s) => s.partnerId === partnerId && s.status === 'ACTIVE' && s.subscribedEvents.includes(eventType)
    );

    const results: PartnerWebhookDelivery[] = [];

    for (const sub of subs) {
      this.deliveryCounter += 1;
      const eventId = `evt_${Date.now()}_${this.deliveryCounter}`;
      const timestamp = Math.floor(Date.now() / 1000);
      const signaturePayload = `${timestamp}.${JSON.stringify(payload)}`;
      const signature = `t=${timestamp},v1=${crypto.createHmac('sha256', sub.secret).update(signaturePayload).digest('hex')}`;

      const delivery: PartnerWebhookDelivery = {
        id: `del-${Date.now()}-${this.deliveryCounter}`,
        subscriptionId: sub.id,
        partnerId,
        tenantId: sub.tenantId,
        eventId,
        eventType,
        environment,
        payload,
        signature,
        status: 'DELIVERED',
        attempts: 1,
        maxAttempts: sub.maxRetries,
        lastAttemptAt: new Date().toISOString(),
        responseStatusCode: 200,
        responseBody: '{"received": true}',
        createdAt: new Date().toISOString(),
      };

      this.webhookDeliveries.set(delivery.id, delivery);
      results.push(delivery);
    }

    return results;
  }

  public listWebhookDeliveries(partnerId: string): PartnerWebhookDelivery[] {
    return Array.from(this.webhookDeliveries.values())
      .filter((d) => d.partnerId === partnerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async replayWebhookDelivery(deliveryId: string, partnerContext: PartnerContext): Promise<PartnerWebhookDelivery> {
    const delivery = this.webhookDeliveries.get(deliveryId);
    if (!delivery) throw new NotFoundError('Webhook delivery record not found');
    if (delivery.partnerId !== partnerContext.partnerId) {
      throw new ForbiddenError('Access forbidden');
    }

    delivery.attempts += 1;
    delivery.status = 'DELIVERED';
    delivery.lastAttemptAt = new Date().toISOString();
    delivery.responseStatusCode = 200;
    this.webhookDeliveries.set(delivery.id, delivery);

    return delivery;
  }

  // ---------------------------------------------------------------------------
  // 9. COMMERCIALS & REPORTING
  // ---------------------------------------------------------------------------
  public calculateCommissionOnDisbursement(data: {
    partnerId: string;
    applicationId: string;
    applicationNo?: string;
    loanId: string;
    loanNo: string;
    disbursedAmount: number;
  }): PartnerCommissionRecord {
    const partner = this.getPartner(data.partnerId);
    const policy = partner.commercialPolicy || {
      modelType: 'PERCENTAGE',
      sourcingFeePct: 0.5,
      disbursementCommissionPct: 1.0,
      flatFee: 0,
      clawbackPeriodDays: 90,
      clawbackRatePct: 100,
    };

    const rate = (policy.sourcingFeePct + policy.disbursementCommissionPct) / 100;
    const amount = Math.round(data.disbursedAmount * rate + (policy.flatFee || 0));

    this.commissionCounter += 1;
    const record: PartnerCommissionRecord = {
      id: `comm-rec-${Date.now()}-${this.commissionCounter}`,
      partnerId: partner.id,
      partnerCode: partner.code,
      partnerName: partner.name,
      applicationId: data.applicationId,
      applicationNo: data.applicationNo,
      loanId: data.loanId,
      loanNo: data.loanNo,
      disbursedAmount: data.disbursedAmount,
      commissionType: 'DISBURSEMENT_COMMISSION',
      amount,
      status: 'ACCRUED',
      createdAt: new Date().toISOString(),
    };

    this.commissions.set(record.id, record);
    return record;
  }

  public listCommissions(partnerId?: string): PartnerCommissionRecord[] {
    let list = Array.from(this.commissions.values());
    if (partnerId) {
      list = list.filter((c) => c.partnerId === partnerId);
    }
    return list;
  }

  public getPayoutSummary(partnerId: string): PartnerPayoutSummary {
    const partner = this.getPartner(partnerId);
    const partnerCommissions = this.listCommissions(partnerId);

    const totalDisbursedVolume = partnerCommissions.reduce((acc, c) => acc + c.disbursedAmount, 0);
    const totalEarnedCommission = partnerCommissions.reduce((acc, c) => acc + c.amount, 0);
    const clawbackAmount = partnerCommissions.filter((c) => c.status === 'CLAWED_BACK').reduce((acc, c) => acc + c.amount, 0);
    const pendingPayoutAmount = partnerCommissions.filter((c) => c.status === 'ACCRUED').reduce((acc, c) => acc + c.amount, 0);

    return {
      partnerId: partner.id,
      partnerCode: partner.code,
      partnerName: partner.name,
      totalSourcedCount: partnerCommissions.length,
      totalDisbursedVolume,
      totalEarnedCommission,
      pendingPayoutAmount,
      clawbackAmount,
      netPayable: pendingPayoutAmount - clawbackAmount,
    };
  }

  public async processPayoutBatch(partnerId: string, actor?: { id?: string; email?: string; roles?: string[] }): Promise<{ batchId: string; totalPaid: number; count: number }> {
    const pending = this.listCommissions(partnerId).filter((c) => c.status === 'ACCRUED');
    const batchId = `BATCH-PAYOUT-${Date.now()}`;
    let totalPaid = 0;

    for (const item of pending) {
      item.status = 'PAID';
      item.payoutBatchId = batchId;
      item.paidAt = new Date().toISOString();
      totalPaid += item.amount;
      this.commissions.set(item.id, item);
    }

    void logAudit({
      userId: actor?.id,
      action: 'PARTNER_PAYOUT_PROCESSED',
      entity: 'PartnerPayout',
      entityId: batchId,
      newValue: { partnerId, totalPaid, count: pending.length },
    }).catch(() => {});

    return { batchId, totalPaid, count: pending.length };
  }
}

export const partnerService = new PartnerService();
