import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import {
  CommissionModel,
  PartnerCommissionRecord,
  PartnerEntity,
  PartnerPayoutSummary,
  PartnerStatus,
  PartnerType,
  SourcedApplication,
} from './partner.types';

export class PartnerService {
  private static instance: PartnerService;

  private readonly partners = new Map<string, PartnerEntity>();
  private readonly sourcedApplications = new Map<string, SourcedApplication>();
  private readonly commissions = new Map<string, PartnerCommissionRecord>();

  private constructor() {
    // Seed initial production-grade partner entities
    const seedDsa: PartnerEntity = {
      id: 'partner-apex-dsa-1',
      code: 'DSA-APEX-01',
      name: 'Apex Finserv Direct',
      type: 'DSA',
      contactPerson: 'Rajiv Mehra',
      email: 'rajiv.mehra@apexfinserv.in',
      phone: '+91 98200 12345',
      status: 'ACTIVE',
      pan: 'AABCA1234F',
      gstin: '27AABCA1234F1Z5',
      commissionModel: {
        type: 'PERCENTAGE',
        ratePct: 1.75, // 1.75% of disbursed loan
        flatFee: 500,  // ₹500 upfront lead fee
        clawbackPeriodDays: 90,
        clawbackRatePct: 100,
      },
      complianceAgreements: {
        dlaSigned: true,
        rbiDigitalLendingCompliant: true,
        kfsFormatAccepted: true,
        aprDisclosureAcknowledged: true,
        dlaSignedAt: new Date().toISOString(),
        dlaReference: 'DLA-2026-APEX-0091',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const seedLsp: PartnerEntity = {
      id: 'partner-creditpulse-lsp-2',
      code: 'LSP-CPULSE-02',
      name: 'CreditPulse Digital Technologies',
      type: 'LSP',
      contactPerson: 'Ananya Deshmukh',
      email: 'partnerships@creditpulse.in',
      phone: '+91 98110 54321',
      status: 'ACTIVE',
      pan: 'AACCP5678K',
      gstin: '27AACCP5678K1Z2',
      commissionModel: {
        type: 'PERCENTAGE',
        ratePct: 2.0,
        flatFee: 0,
        clawbackPeriodDays: 90,
        clawbackRatePct: 100,
      },
      complianceAgreements: {
        dlaSigned: true,
        rbiDigitalLendingCompliant: true,
        kfsFormatAccepted: true,
        aprDisclosureAcknowledged: true,
        dlaSignedAt: new Date().toISOString(),
        dlaReference: 'DLA-2026-CPULSE-0044',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.partners.set(seedDsa.id, seedDsa);
    this.partners.set(seedLsp.id, seedLsp);
  }

  public static getInstance(): PartnerService {
    if (!PartnerService.instance) {
      PartnerService.instance = new PartnerService();
    }
    return PartnerService.instance;
  }

  // =========================================================================
  // 1. Partner Onboarding & Governance
  // =========================================================================

  public async registerPartner(
    input: {
      code: string;
      name: string;
      type: PartnerType;
      contactPerson: string;
      email: string;
      phone: string;
      pan: string;
      gstin?: string;
      branchId?: string;
      commissionModel?: Partial<CommissionModel>;
      dlaSigned?: boolean;
    },
    actor: { id: string; email: string; roles: string[] }
  ): Promise<PartnerEntity> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot manage partner entities.');
    }

    if (!input.name || !input.email || !input.pan) {
      throw new BadRequestError('Partner name, email, and PAN are mandatory for registration.');
    }

    // Check code uniqueness
    const existing = Array.from(this.partners.values()).find(
      (p) => p.code.toLowerCase() === input.code.toLowerCase() || p.email.toLowerCase() === input.email.toLowerCase()
    );
    if (existing) {
      throw new BadRequestError(`Partner with code '${input.code}' or email '${input.email}' already registered.`);
    }

    const partnerId = `partner-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newPartner: PartnerEntity = {
      id: partnerId,
      code: input.code.toUpperCase(),
      name: input.name,
      type: input.type,
      contactPerson: input.contactPerson,
      email: input.email.toLowerCase(),
      phone: input.phone,
      status: 'ACTIVE',
      pan: input.pan.toUpperCase(),
      gstin: input.gstin?.toUpperCase(),
      branchId: input.branchId,
      commissionModel: {
        type: input.commissionModel?.type || 'PERCENTAGE',
        ratePct: input.commissionModel?.ratePct ?? 1.5,
        flatFee: input.commissionModel?.flatFee ?? 0,
        clawbackPeriodDays: input.commissionModel?.clawbackPeriodDays ?? 90,
        clawbackRatePct: input.commissionModel?.clawbackRatePct ?? 100,
      },
      complianceAgreements: {
        dlaSigned: Boolean(input.dlaSigned ?? true),
        rbiDigitalLendingCompliant: true,
        kfsFormatAccepted: true,
        aprDisclosureAcknowledged: true,
        dlaSignedAt: new Date().toISOString(),
        dlaReference: `DLA-${new Date().getFullYear()}-${input.code.toUpperCase()}`,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.partners.set(partnerId, newPartner);

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'PARTNER_REGISTERED',
      entity: 'PartnerEntity',
      entityId: partnerId,
      newValue: { code: newPartner.code, name: newPartner.name, type: newPartner.type },
    }).catch(() => {});

    return newPartner;
  }

  public async updatePartnerStatus(
    partnerId: string,
    status: PartnerStatus,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<PartnerEntity> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot alter partner governance.');
    }

    const partner = this.partners.get(partnerId);
    if (!partner) {
      throw new NotFoundError(`Partner '${partnerId}' not found.`);
    }

    partner.status = status;
    partner.updatedAt = new Date().toISOString();

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'PARTNER_STATUS_UPDATED',
      entity: 'PartnerEntity',
      entityId: partnerId,
      newValue: { status },
    }).catch(() => {});

    return partner;
  }

  public listPartners(actor: { id: string; roles: string[] }): PartnerEntity[] {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot list partner entities.');
    }
    return Array.from(this.partners.values());
  }

  public getPartner(partnerId: string, actor: { id: string; roles: string[] }): PartnerEntity {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot view partner profiles.');
    }
    const partner = this.partners.get(partnerId);
    if (!partner) {
      throw new NotFoundError(`Partner '${partnerId}' not found.`);
    }
    return partner;
  }

  // =========================================================================
  // 2. Sourcing Pipeline with Strict Isolation
  // =========================================================================

  public async submitLead(
    input: {
      partnerId: string;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      requestedAmount: number;
      productCode: string;
      consentReference: string;
      notes?: string;
    },
    actor: { id: string; email: string; roles: string[] }
  ): Promise<SourcedApplication> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot submit partner leads.');
    }

    const partner = this.partners.get(input.partnerId);
    if (!partner) {
      throw new NotFoundError(`Partner '${input.partnerId}' not found.`);
    }

    if (partner.status !== 'ACTIVE') {
      throw new BadRequestError(`Partner '${partner.name}' is currently '${partner.status}' and cannot source new leads.`);
    }

    if (!input.consentReference || input.consentReference.trim().length < 3) {
      throw new BadRequestError('Mandatory borrower consent proof (OTP ref or signed mandate) is required by RBI guidelines.');
    }

    const sourcedId = `source-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const appNo = `APP-SRC-${Math.floor(100000 + Math.random() * 900000)}`;

    const sourcedApp: SourcedApplication = {
      id: sourcedId,
      partnerId: partner.id,
      partnerCode: partner.code,
      partnerName: partner.name,
      applicationNo: appNo,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      requestedAmount: Number(input.requestedAmount),
      productCode: input.productCode || 'PERSONAL',
      status: 'SUBMITTED',
      consentReference: input.consentReference,
      consentVerifiedAt: new Date().toISOString(),
      sourcedAt: new Date().toISOString(),
      notes: input.notes,
    };

    this.sourcedApplications.set(sourcedId, sourcedApp);

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'PARTNER_LEAD_SOURCED',
      entity: 'SourcedApplication',
      entityId: sourcedId,
      newValue: {
        partnerId: partner.id,
        applicationNo: appNo,
        requestedAmount: input.requestedAmount,
        consentReference: input.consentReference,
      },
    }).catch(() => {});

    return sourcedApp;
  }

  /**
   * Lists sourced applications enforcing strict partner isolation.
   */
  public listSourcedApplications(
    partnerIdFilter: string | undefined,
    actor: { id: string; email: string; roles: string[] }
  ): SourcedApplication[] {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot view partner sourcing pipeline.');
    }

    let items = Array.from(this.sourcedApplications.values());

    // Strict Partner Isolation: If actor is a partner user, scope strictly to their partner ID
    const partnerByEmail = Array.from(this.partners.values()).find((p) => p.email.toLowerCase() === actor.email.toLowerCase());
    if (partnerByEmail) {
      items = items.filter((a) => a.partnerId === partnerByEmail.id);
    } else if (partnerIdFilter) {
      items = items.filter((a) => a.partnerId === partnerIdFilter);
    }

    return items.sort((a, b) => new Date(b.sourcedAt).getTime() - new Date(a.sourcedAt).getTime());
  }

  /**
   * Retrieves single sourced application, verifying partner isolation.
   */
  public getSourcedApplication(
    sourcedId: string,
    actor: { id: string; email: string; roles: string[] }
  ): SourcedApplication {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot view partner applications.');
    }

    const app = this.sourcedApplications.get(sourcedId);
    if (!app) {
      throw new NotFoundError(`Sourced application '${sourcedId}' not found.`);
    }

    // Strict Isolation check
    const partnerByEmail = Array.from(this.partners.values()).find((p) => p.email.toLowerCase() === actor.email.toLowerCase());
    if (partnerByEmail && app.partnerId !== partnerByEmail.id) {
      throw new ForbiddenError('Partner Isolation Violation: You cannot access applications sourced by other partners.');
    }

    return app;
  }

  // =========================================================================
  // 3. Commissions & Payouts Engine
  // =========================================================================

  public calculateCommissionOnDisbursement(params: {
    partnerId: string;
    applicationId?: string;
    applicationNo?: string;
    loanId?: string;
    loanNo?: string;
    disbursedAmount: number;
  }): PartnerCommissionRecord[] {
    const partner = this.partners.get(params.partnerId);
    if (!partner) {
      throw new NotFoundError(`Partner '${params.partnerId}' not found.`);
    }

    const { ratePct, flatFee } = partner.commissionModel;
    const records: PartnerCommissionRecord[] = [];
    const now = new Date().toISOString();

    // 1. Upfront Sourcing Fee (if configured)
    if (flatFee > 0) {
      const flatRec: PartnerCommissionRecord = {
        id: `comm-flat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        partnerId: partner.id,
        partnerCode: partner.code,
        partnerName: partner.name,
        applicationId: params.applicationId,
        applicationNo: params.applicationNo,
        loanId: params.loanId,
        loanNo: params.loanNo,
        disbursedAmount: params.disbursedAmount,
        commissionType: 'SOURCING_FEE',
        amount: flatFee,
        status: 'ACCRUED',
        createdAt: now,
      };
      this.commissions.set(flatRec.id, flatRec);
      records.push(flatRec);
    }

    // 2. Disbursement-linked Percentage Commission
    if (ratePct > 0) {
      const percentageCommission = Number(((params.disbursedAmount * ratePct) / 100).toFixed(2));
      const disbRec: PartnerCommissionRecord = {
        id: `comm-disb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        partnerId: partner.id,
        partnerCode: partner.code,
        partnerName: partner.name,
        applicationId: params.applicationId,
        applicationNo: params.applicationNo,
        loanId: params.loanId,
        loanNo: params.loanNo,
        disbursedAmount: params.disbursedAmount,
        commissionType: 'DISBURSEMENT_COMMISSION',
        amount: percentageCommission,
        status: 'ACCRUED',
        createdAt: now,
      };
      this.commissions.set(disbRec.id, disbRec);
      records.push(disbRec);
    }

    // Update sourced application status to DISBURSED
    const sourced = Array.from(this.sourcedApplications.values()).find(
      (s) => s.applicationNo === params.applicationNo || s.applicationId === params.applicationId
    );
    if (sourced) {
      sourced.status = 'DISBURSED';
      sourced.disbursedAmount = params.disbursedAmount;
    }

    return records;
  }

  /**
   * Evaluates early delinquency clawback (e.g. loan enters 60+ DPD within 90-day clawback window).
   */
  public evaluateClawback(params: {
    partnerId: string;
    loanId: string;
    loanNo?: string;
    daysSinceDisbursement: number;
    dpd: number;
    reason: string;
  }): PartnerCommissionRecord | null {
    const partner = this.partners.get(params.partnerId);
    if (!partner) return null;

    const { clawbackPeriodDays, clawbackRatePct } = partner.commissionModel;

    // Check if within clawback window and delinquent
    if (params.daysSinceDisbursement <= clawbackPeriodDays && params.dpd >= 60) {
      // Find original accrued commission for this loan
      const originalComms = Array.from(this.commissions.values()).filter(
        (c) => c.loanId === params.loanId && c.commissionType === 'DISBURSEMENT_COMMISSION'
      );
      const totalOriginal = originalComms.reduce((sum, c) => sum + c.amount, 0);

      if (totalOriginal > 0) {
        const clawbackAmount = Number(((totalOriginal * clawbackRatePct) / 100).toFixed(2));
        const clawbackId = `comm-claw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        const clawbackRecord: PartnerCommissionRecord = {
          id: clawbackId,
          partnerId: partner.id,
          partnerCode: partner.code,
          partnerName: partner.name,
          loanId: params.loanId,
          loanNo: params.loanNo,
          disbursedAmount: 0,
          commissionType: 'CLAWBACK',
          amount: -clawbackAmount, // negative deduction
          status: 'CLAWED_BACK',
          clawbackReason: params.reason,
          createdAt: new Date().toISOString(),
        };

        this.commissions.set(clawbackId, clawbackRecord);
        return clawbackRecord;
      }
    }
    return null;
  }

  /**
   * Computes partner payout summary and net payable balances.
   */
  public getPayoutSummary(partnerId: string, actor: { id: string; roles: string[] }): PartnerPayoutSummary {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot view commission payouts.');
    }

    const partner = this.partners.get(partnerId);
    if (!partner) {
      throw new NotFoundError(`Partner '${partnerId}' not found.`);
    }

    const sourcedList = Array.from(this.sourcedApplications.values()).filter((s) => s.partnerId === partnerId);
    const commList = Array.from(this.commissions.values()).filter((c) => c.partnerId === partnerId);

    const totalDisbursedVolume = sourcedList.reduce((sum, s) => sum + (s.disbursedAmount || 0), 0);
    const totalEarnedCommission = commList
      .filter((c) => c.commissionType !== 'CLAWBACK')
      .reduce((sum, c) => sum + c.amount, 0);

    const clawbackAmount = Math.abs(
      commList
        .filter((c) => c.commissionType === 'CLAWBACK')
        .reduce((sum, c) => sum + c.amount, 0)
    );

    const pendingPayoutAmount = commList
      .filter((c) => c.status === 'ACCRUED')
      .reduce((sum, c) => sum + c.amount, 0);

    const netPayable = Math.max(0, pendingPayoutAmount - clawbackAmount);

    return {
      partnerId: partner.id,
      partnerCode: partner.code,
      partnerName: partner.name,
      totalSourcedCount: sourcedList.length,
      totalDisbursedVolume,
      totalEarnedCommission,
      pendingPayoutAmount,
      clawbackAmount,
      netPayable,
    };
  }

  /**
   * Processes a commission payout batch, marking accrued records as PAID.
   */
  public async processPayoutBatch(
    partnerId: string,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<{ batchId: string; paidAmount: number; recordsCount: number }> {
    const isAuthorized =
      actor.roles.includes('SUPER_ADMIN') ||
      actor.roles.includes('ADMIN') ||
      actor.roles.includes('FINANCE_OFFICER');

    if (!isAuthorized) {
      throw new ForbiddenError('Unauthorized: Only Finance Officers and Administrators can process partner payout batches.');
    }

    const commList = Array.from(this.commissions.values()).filter(
      (c) => c.partnerId === partnerId && c.status === 'ACCRUED'
    );

    const batchId = `PAYOUT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    let paidAmount = 0;

    for (const c of commList) {
      c.status = 'PAID';
      c.payoutBatchId = batchId;
      c.paidAt = new Date().toISOString();
      paidAmount += c.amount;
    }

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'PARTNER_PAYOUT_PROCESSED',
      entity: 'PartnerPayout',
      entityId: batchId,
      newValue: { partnerId, batchId, paidAmount, count: commList.length },
    }).catch(() => {});

    return {
      batchId,
      paidAmount,
      recordsCount: commList.length,
    };
  }

  public listCommissions(partnerIdFilter?: string): PartnerCommissionRecord[] {
    let list = Array.from(this.commissions.values());
    if (partnerIdFilter) {
      list = list.filter((c) => c.partnerId === partnerIdFilter);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public clearForTesting(): void {
    this.partners.clear();
    this.sourcedApplications.clear();
    this.commissions.clear();
  }
}

export const partnerService = PartnerService.getInstance();
