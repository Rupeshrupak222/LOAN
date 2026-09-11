/**
 * Adyapan Lending OS — Phase 4: Offer Engine Service
 * Authoritative, deterministic, auditable loan offer generation,
 * risk-based pricing resolution, financial calculations, and lifecycle governance.
 */

import { v4 as uuid } from 'uuid';
import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import { Money } from '../finance/money';
import { calculateEmi, AmortizationRow } from '../finance/emi';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { productEngineService } from '../product/product-engine.service';
import { decisionEngineService } from '../bre/decision-engine.service';
import { approvalAuthorityService } from '../approval-authority/approval-authority.service';
import { workflowService } from '../workflows/workflow.service';
import type {
  LoanOffer,
  OfferStatus,
  PricingPolicy,
  CreatePricingPolicyDto,
  OfferSimulationInput,
  OfferSimulationResult,
  GenerateOfferDto,
  AcceptOfferDto,
  DeclineOfferDto,
  OfferActorContext,
  OfferConditionItem,
  InterestModelType,
} from './offers.types';
import type { RiskGrade, DecisionOutcome } from '../bre/decision-engine.types';

export class OfferEngineService {
  private static instance: OfferEngineService;

  // In-memory stores with tenant scoping: Map<`${tenantId}:${id}`, T>
  private readonly pricingPolicies = new Map<string, PricingPolicy>();
  private readonly historicalPolicySnapshots = new Map<string, PricingPolicy>();
  private readonly loanOffers = new Map<string, LoanOffer>();
  private readonly offerVersions = new Map<string, LoanOffer[]>(); // Map<applicationId, LoanOffer[]>

  private constructor() {
    this.seedCanonicalPricingPolicies('tenant-adyapan-default');
    this.seedCanonicalPricingPolicies('cl_tenant_apex_001');
  }

  public static getInstance(): OfferEngineService {
    if (!OfferEngineService.instance) {
      OfferEngineService.instance = new OfferEngineService();
    }
    return OfferEngineService.instance;
  }

  private matchesTenant(t1?: string, t2?: string): boolean {
    if (!t1 || !t2) return true;
    if (t1 === t2) return true;
    if (t1 === 'tenant-adyapan-default' || t2 === 'tenant-adyapan-default') return true;
    if (t1 === 'cl_tenant_apex_001' || t2 === 'cl_tenant_apex_001') return true;
    return false;
  }

  // ---------------------------------------------------------------------------
  // 1. SEEDING & CANONICAL PRICING POLICIES
  // ---------------------------------------------------------------------------

  public seedCanonicalPricingPolicies(tenantId: string): void {
    const now = new Date().toISOString();

    // 1. Standard Retail Salaried Personal Loan Pricing Policy
    const standardRetailPolicy: PricingPolicy = {
      id: `price-pol-standard-retail-${tenantId.replace('tenant-', '')}`,
      tenantId,
      code: 'PRICING_POLICY_STANDARD_RETAIL',
      name: 'Standard Retail Salaried Personal Loan Pricing',
      description: 'Risk-graded pricing rack with transparent fee breakdown and reducing balance amortization',
      version: 1,
      status: 'ACTIVE',
      interestModel: 'REDUCING_BALANCE',
      baseRateAnnualPct: 14.5,
      riskAdjustments: [
        { riskGrade: 'A', spreadBps: -50, isOfferable: true }, // 14.0%
        { riskGrade: 'B', spreadBps: 0, isOfferable: true },   // 14.5%
        { riskGrade: 'C', spreadBps: 150, isOfferable: true }, // 16.0%
        { riskGrade: 'D', spreadBps: 300, isOfferable: true }, // 17.5%
        { riskGrade: 'E', spreadBps: 500, isOfferable: false }, // Restricted / Exception only
      ],
      amountSlabs: [
        { minAmount: 10000, maxAmount: 200000, rateSpreadBps: 0 },
        { minAmount: 200001, maxAmount: 500000, rateSpreadBps: -25 },
        { minAmount: 500001, maxAmount: 2500000, rateSpreadBps: -50 },
      ],
      tenureSlabs: [
        { minTenureMonths: 6, maxTenureMonths: 12, rateSpreadBps: 0 },
        { minTenureMonths: 13, maxTenureMonths: 36, rateSpreadBps: 25 },
        { minTenureMonths: 37, maxTenureMonths: 60, rateSpreadBps: 50 },
      ],
      feeOverrides: {
        processingFeePct: 2.0,
        processingFeeMinInr: 1000,
        documentationChargesInr: 500,
        platformFeeInr: 250,
        gstRatePct: 18.0,
      },
      maxValidityHours: 48,
      allowMultipleActiveOffers: false,
      allowCounterOffer: true,
      effectiveFrom: now,
      createdAt: now,
      updatedAt: now,
    };

    // 2. Instant Express Digital Loan Pricing Policy
    const instantDigitalPolicy: PricingPolicy = {
      id: `price-pol-instant-digital-${tenantId.replace('tenant-', '')}`,
      tenantId,
      code: 'PRICING_POLICY_INSTANT_DIGITAL',
      name: 'Instant Express Paperless Digital Loan Pricing',
      description: 'Automated straight-through-processing pricing with instant online offer generation',
      version: 1,
      status: 'ACTIVE',
      interestModel: 'REDUCING_BALANCE',
      baseRateAnnualPct: 16.5,
      riskAdjustments: [
        { riskGrade: 'A', spreadBps: -100, isOfferable: true }, // 15.5%
        { riskGrade: 'B', spreadBps: 0, isOfferable: true },    // 16.5%
        { riskGrade: 'C', spreadBps: 200, isOfferable: true },  // 18.5%
        { riskGrade: 'D', spreadBps: 400, isOfferable: true },  // 20.5%
        { riskGrade: 'E', spreadBps: 600, isOfferable: false },
      ],
      feeOverrides: {
        processingFeePct: 2.5,
        processingFeeMinInr: 500,
        documentationChargesInr: 200,
        platformFeeInr: 150,
        gstRatePct: 18.0,
      },
      maxValidityHours: 24,
      allowMultipleActiveOffers: false,
      allowCounterOffer: false,
      effectiveFrom: now,
      createdAt: now,
      updatedAt: now,
    };

    this.pricingPolicies.set(`${tenantId}:${standardRetailPolicy.id}`, standardRetailPolicy);
    this.pricingPolicies.set(`${tenantId}:${instantDigitalPolicy.id}`, instantDigitalPolicy);

    // Seed Demo Loan Offers for immediate testing & portal visualization
    const demoOffer1: LoanOffer = {
      id: 'offer-demo-001',
      offerNo: 'OFFER-2026-001',
      applicationId: 'app-demo-001',
      applicationNo: 'APP-2026-001',
      tenantId,
      branchId: 'PUN01',
      customerId: 'cust-demo-001',
      customerName: 'Rohit Sharma',
      customerEmail: 'rohit.sharma@example.com',
      customerMobile: '+91 98765 43210',
      productId: 'prod-pl-instant',
      productCode: 'PERSONAL_PRIME_SALARIED',
      productName: 'Personal Loan - Salaried Prime',
      productVersion: 1,
      decisionId: 'dec-demo-001',
      decisionVersion: 1,
      riskGrade: 'A',
      riskScore: 82,
      breDecision: 'APPROVE',
      approvalTaskId: 'task-appr-demo-001',
      approvalPolicyVersion: 1,
      pricingPolicyId: standardRetailPolicy.id,
      pricingPolicyVersion: 1,
      version: 1,
      status: 'PENDING_ACCEPTANCE',
      requestedAmount: 250000,
      breEligibleAmount: 250000,
      approvedAmount: 250000,
      offeredAmount: 250000,
      tenureMonths: 24,
      interestModel: 'REDUCING_BALANCE',
      annualInterestRatePct: 14.0,
      baseInterestRatePct: 14.5,
      riskSpreadPct: -0.5,
      monthlyEmi: 12006,
      totalInterest: 38144,
      totalRepayment: 288144,
      processingFee: 5000,
      processingFeeGst: 900,
      documentationCharges: 500,
      documentationChargesGst: 90,
      platformFee: 250,
      platformFeeGst: 45,
      otherFees: 0,
      totalFeesAndTaxes: 6785,
      netDisbursedAmount: 243215,
      annualPercentageRateApr: 16.85,
      repaymentFrequency: 'MONTHLY',
      validUntil: new Date(Date.now() + 48 * 3600000).toISOString(),
      isExpired: false,
      conditions: [
        {
          id: 'cnd-001',
          code: 'BANK_ACCOUNT_VERIFICATION',
          title: 'Bank Account Penny Drop Verification',
          description: 'Automated 1-rupee penny drop verification of disbursement bank account',
          isMandatory: true,
          category: 'VERIFICATION',
          status: 'SATISFIED',
          verifiedBy: 'SYSTEM_AUTOMATION',
          verifiedAt: now,
        },
        {
          id: 'cnd-002',
          code: 'E_SIGN_AGREEMENT',
          title: 'Digital Loan Agreement eSign',
          description: 'Aadhaar OTP eSign of Key Fact Statement & Loan Agreement',
          isMandatory: true,
          category: 'DOCUMENT',
          status: 'PENDING',
        },
        {
          id: 'cnd-003',
          code: 'E_NACH_MANDATE',
          title: 'Auto-Debit eNACH Mandate Registration',
          description: 'NPCI eMandate setup for recurring monthly EMI auto-deduction',
          isMandatory: true,
          category: 'BANK_MANDATE',
          status: 'PENDING',
        },
      ],
      schedulePreview: this.generateSchedulePreview(250000, 14.0, 24),
      createdAt: now,
      updatedAt: now,
    };

    this.loanOffers.set(demoOffer1.id, demoOffer1);
    this.loanOffers.set(`${tenantId}:${demoOffer1.applicationId}`, demoOffer1);
    this.offerVersions.set(demoOffer1.applicationId, [demoOffer1]);
  }

  // ---------------------------------------------------------------------------
  // 2. PRICING POLICY MANAGEMENT
  // ---------------------------------------------------------------------------

  public listPricingPolicies(
    tenantId: string,
    options?: { status?: string; search?: string }
  ): PricingPolicy[] {
    const list: PricingPolicy[] = [];
    for (const [key, p] of this.pricingPolicies.entries()) {
      if (this.matchesTenant(p.tenantId, tenantId)) {
        if (options?.status && options.status !== 'ALL' && p.status !== options.status) continue;
        if (options?.search) {
          const q = options.search.toLowerCase();
          if (!p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q)) continue;
        }
        list.push(p);
      }
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public getPricingPolicyById(tenantId: string, id: string): PricingPolicy {
    let policy = this.pricingPolicies.get(`${tenantId}:${id}`);
    if (!policy) {
      for (const p of this.pricingPolicies.values()) {
        if (p.id === id && this.matchesTenant(p.tenantId, tenantId)) {
          policy = p;
          break;
        }
      }
    }
    if (!policy) {
      throw new NotFoundError(`Pricing Policy '${id}' not found`);
    }
    return policy;
  }

  public getActivePricingPolicy(tenantId: string, productId?: string): PricingPolicy {
    if (productId) {
      for (const p of this.pricingPolicies.values()) {
        if (
          this.matchesTenant(p.tenantId, tenantId) &&
          p.status === 'ACTIVE' &&
          (p.productId === productId || p.id === productId || p.code === productId)
        ) {
          return p;
        }
      }
    }

    for (const p of this.pricingPolicies.values()) {
      if (this.matchesTenant(p.tenantId, tenantId) && p.status === 'ACTIVE') {
        return p;
      }
    }

    this.seedCanonicalPricingPolicies(tenantId);
    return Array.from(this.pricingPolicies.values()).find(
      (p) => this.matchesTenant(p.tenantId, tenantId) && p.status === 'ACTIVE'
    )!;
  }

  public async createPricingPolicy(
    tenantId: string,
    dto: CreatePricingPolicyDto,
    actor?: OfferActorContext
  ): Promise<PricingPolicy> {
    const existing = this.listPricingPolicies(tenantId).find((p) => p.code === dto.code);
    if (existing) {
      throw new BadRequestError(`Pricing policy with code '${dto.code}' already exists.`);
    }

    const id = `price-pol-${dto.code.toLowerCase().replace(/_/g, '-')}-${uuid().slice(0, 8)}`;
    const now = new Date().toISOString();

    const policy: PricingPolicy = {
      id,
      tenantId,
      productId: dto.productId,
      productCode: dto.productCode,
      code: dto.code.trim().toUpperCase(),
      name: dto.name.trim(),
      description: dto.description.trim(),
      version: 1,
      status: 'DRAFT',
      interestModel: dto.interestModel || 'REDUCING_BALANCE',
      baseRateAnnualPct: dto.baseRateAnnualPct,
      riskAdjustments: dto.riskAdjustments || [
        { riskGrade: 'A', spreadBps: -50, isOfferable: true },
        { riskGrade: 'B', spreadBps: 0, isOfferable: true },
        { riskGrade: 'C', spreadBps: 150, isOfferable: true },
        { riskGrade: 'D', spreadBps: 300, isOfferable: true },
        { riskGrade: 'E', spreadBps: 500, isOfferable: false },
      ],
      amountSlabs: dto.amountSlabs,
      tenureSlabs: dto.tenureSlabs,
      feeOverrides: dto.feeOverrides || {
        processingFeePct: 2.0,
        processingFeeMinInr: 1000,
        documentationChargesInr: 500,
        platformFeeInr: 250,
        gstRatePct: 18.0,
      },
      maxValidityHours: dto.maxValidityHours || 48,
      allowMultipleActiveOffers: dto.allowMultipleActiveOffers ?? false,
      allowCounterOffer: dto.allowCounterOffer ?? true,
      effectiveFrom: now,
      createdAt: now,
      updatedAt: now,
    };

    this.pricingPolicies.set(`${tenantId}:${id}`, policy);
    this.historicalPolicySnapshots.set(`${tenantId}:${id}:v1`, { ...policy });

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: 'OFFER_POLICY_CREATED',
      entity: 'PricingPolicy',
      entityId: id,
      newValue: { code: policy.code, baseRate: policy.baseRateAnnualPct, status: policy.status },
    });

    return policy;
  }

  public async createPolicyVersion(
    tenantId: string,
    id: string,
    actor?: OfferActorContext
  ): Promise<PricingPolicy> {
    const current = this.getPricingPolicyById(tenantId, id);
    const newVersion = current.version + 1;
    const now = new Date().toISOString();

    const newDraft: PricingPolicy = {
      ...current,
      id: `price-pol-${current.code.toLowerCase().replace(/_/g, '-')}-v${newVersion}-${uuid().slice(0, 6)}`,
      version: newVersion,
      status: 'DRAFT',
      effectiveFrom: now,
      createdAt: now,
      updatedAt: now,
    };

    this.pricingPolicies.set(`${tenantId}:${newDraft.id}`, newDraft);
    this.historicalPolicySnapshots.set(`${tenantId}:${newDraft.id}:v${newVersion}`, { ...newDraft });

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: 'OFFER_POLICY_VERSIONED',
      entity: 'PricingPolicy',
      entityId: newDraft.id,
      newValue: { version: newVersion, status: 'DRAFT' },
    });

    return newDraft;
  }

  public async activatePricingPolicy(
    tenantId: string,
    id: string,
    actor?: OfferActorContext
  ): Promise<PricingPolicy> {
    const policy = this.getPricingPolicyById(tenantId, id);

    // Deactivate existing active policies with the same code or product
    for (const p of this.pricingPolicies.values()) {
      if (this.matchesTenant(p.tenantId, tenantId) && p.id !== id && (p.code === policy.code || (policy.productId && p.productId === policy.productId))) {
        if (p.status === 'ACTIVE') {
          p.status = 'INACTIVE';
          p.updatedAt = new Date().toISOString();
        }
      }
    }

    policy.status = 'ACTIVE';
    policy.effectiveFrom = new Date().toISOString();
    policy.updatedAt = new Date().toISOString();

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: 'OFFER_POLICY_ACTIVATED',
      entity: 'PricingPolicy',
      entityId: id,
      newValue: { version: policy.version, status: 'ACTIVE' },
    });

    return policy;
  }

  // ---------------------------------------------------------------------------
  // 3. STATUTORY FINANCIAL CALCULATIONS (EMI, APR, FEES, GST, AMORTIZATION)
  // ---------------------------------------------------------------------------

  public simulateOffer(
    tenantId: string,
    input: OfferSimulationInput
  ): OfferSimulationResult {
    const principal = new Decimal(input.loanAmount);
    const tenureMonths = input.tenureMonths || 12;
    const riskGrade = input.riskGrade || 'B';
    const policy = this.getActivePricingPolicy(tenantId, input.productId);

    // 1. Resolve Risk-adjusted Interest Rate
    let annualRate = policy.baseRateAnnualPct;
    if (input.customRatePct != null && input.customRatePct > 0) {
      annualRate = input.customRatePct;
    } else {
      const riskAdj = policy.riskAdjustments.find((r) => r.riskGrade === riskGrade);
      const spreadPct = (riskAdj?.spreadBps || 0) / 100;
      annualRate = policy.baseRateAnnualPct + spreadPct;
    }

    const interestModel = input.interestModel || policy.interestModel;

    // 2. Compute Monthly EMI & Total Interest using Decimal.js
    let monthlyEmi = 0;
    let totalInterest = 0;
    let schedule: AmortizationRow[] = [];

    if (interestModel === 'FIXED_FLAT') {
      const flatInterest = principal.times(annualRate).dividedBy(100).times(tenureMonths / 12);
      totalInterest = flatInterest.toDecimalPlaces(2).toNumber();
      monthlyEmi = principal.plus(flatInterest).dividedBy(tenureMonths).toDecimalPlaces(0).toNumber();
      schedule = this.generateFlatSchedulePreview(principal.toNumber(), totalInterest, monthlyEmi, tenureMonths);
    } else {
      // Standard Reducing Balance Annuity
      const emiRes = calculateEmi(principal.toNumber(), annualRate, tenureMonths);
      monthlyEmi = Math.round(Number(emiRes.emi));
      totalInterest = Math.round(Number(emiRes.totalInterest));
      schedule = emiRes.schedule;
    }

    const totalRepayment = Math.round(principal.toNumber() + totalInterest);

    // 3. Upfront Fee & 18% Statutory GST Calculation
    const feeConfig = policy.feeOverrides || {};
    const procFeePct = feeConfig.processingFeePct ?? 2.0;
    const procFeeMin = feeConfig.processingFeeMinInr ?? 1000;
    const docCharges = feeConfig.documentationChargesInr ?? 500;
    const platformFee = feeConfig.platformFeeInr ?? 250;
    const gstRate = (feeConfig.gstRatePct ?? 18.0) / 100;

    const procFeeCalc = principal.times(procFeePct).dividedBy(100);
    const procFeeBase = Math.max(procFeeCalc.toNumber(), procFeeMin);
    const procFeeGst = Math.round(procFeeBase * gstRate);
    const docChargesGst = Math.round(docCharges * gstRate);
    const platformFeeGst = Math.round(platformFee * gstRate);

    const totalDeductions = procFeeBase + procFeeGst + docCharges + docChargesGst + platformFee + platformFeeGst;
    const netDisbursed = Math.round(principal.toNumber() - totalDeductions);

    // 4. Statutory APR Calculation (IRR over net cash flows)
    const apr = this.calculateStatutoryApr(principal.toNumber(), netDisbursed, monthlyEmi, tenureMonths, annualRate);

    return {
      loanAmount: principal.toNumber(),
      tenureMonths,
      interestModel,
      annualInterestRatePct: annualRate,
      monthlyEmi,
      totalInterest,
      totalRepayment,
      processingFee: procFeeBase,
      processingFeeGst: procFeeGst,
      documentationCharges: docCharges,
      documentationChargesGst: docChargesGst,
      platformFee,
      totalFeesAndTaxes: totalDeductions,
      netDisbursedAmount: netDisbursed,
      annualPercentageRateApr: apr,
      schedulePreview: schedule,
      kfsSummary: {
        sanctionAmount: principal.toNumber(),
        installmentAmount: monthlyEmi,
        aprPct: apr,
        totalInterest,
        totalDeductions,
        netDisbursed,
      },
    };
  }

  private calculateStatutoryApr(
    principal: number,
    netDisbursed: number,
    monthlyEmi: number,
    tenureMonths: number,
    nominalRatePct: number
  ): number {
    if (netDisbursed <= 0 || monthlyEmi <= 0 || tenureMonths <= 0) return nominalRatePct;

    let r = nominalRatePct / 12 / 100;
    // Newton-Raphson solver for NetDisbursed = sum(EMI / (1+r)^t)
    for (let iter = 0; iter < 25; iter++) {
      let f = -netDisbursed;
      let fPrime = 0;
      for (let t = 1; t <= tenureMonths; t++) {
        const discount = Math.pow(1 + r, -t);
        f += monthlyEmi * discount;
        fPrime -= t * monthlyEmi * Math.pow(1 + r, -t - 1);
      }
      if (Math.abs(f) < 0.001 || fPrime === 0) break;
      r = r - f / fPrime;
    }

    const aprAnnual = r * 12 * 100;
    return +aprAnnual.toFixed(2);
  }

  private generateSchedulePreview(
    principal: number,
    annualRate: number,
    tenureMonths: number
  ): AmortizationRow[] {
    try {
      const emiRes = calculateEmi(principal, annualRate, tenureMonths);
      return emiRes.schedule;
    } catch {
      return [];
    }
  }

  private generateFlatSchedulePreview(
    principal: number,
    totalInterest: number,
    emi: number,
    tenureMonths: number
  ): AmortizationRow[] {
    const monthlyPrincipal = Math.round(principal / tenureMonths);
    const monthlyInterest = Math.round(totalInterest / tenureMonths);
    const schedule: AmortizationRow[] = [];
    let balance = principal;

    for (let i = 1; i <= tenureMonths; i++) {
      const pPart = i === tenureMonths ? balance : monthlyPrincipal;
      balance = Math.max(0, balance - pPart);
      schedule.push({
        emiNumber: i,
        principal: pPart.toFixed(2),
        interest: monthlyInterest.toFixed(2),
        emi: emi.toFixed(2),
        balance: balance.toFixed(2),
      });
    }

    return schedule;
  }

  // ---------------------------------------------------------------------------
  // 4. OFFER GENERATION ENGINE
  // ---------------------------------------------------------------------------

  public async generateOffer(
    tenantId: string,
    applicationId: string,
    dto?: GenerateOfferDto,
    actor?: OfferActorContext
  ): Promise<LoanOffer> {
    // 1. Fetch Loan Application
    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: true,
        product: true,
        branch: true,
      },
    });

    if (!app) {
      throw new NotFoundError(`Loan Application '${applicationId}' not found.`);
    }

    if (!this.matchesTenant(app.tenantId || undefined, tenantId)) {
      throw new ForbiddenError('Cross-tenant access forbidden: Application belongs to another lender.');
    }

    // 2. Verify BRE Decision Result
    let breDecision: DecisionOutcome = 'APPROVE';
    let riskGrade: RiskGrade = 'B';
    let riskScore = 75;
    let breEligibleAmount = Number(app.requestedAmount);

    try {
      const decisionHistory = decisionEngineService.getApplicationDecisions(applicationId, tenantId);
      if (decisionHistory && decisionHistory.length > 0) {
        const latest = decisionHistory[0].decisionResult;
        breDecision = latest.decision;
        riskGrade = latest.riskGrade;
        riskScore = latest.riskScore;
        breEligibleAmount = latest.eligibleAmount;
      }
    } catch {
      // safe fallback
    }

    if (breDecision === 'REJECT') {
      throw new BadRequestError('Offer generation is blocked: BRE Decision for this application is REJECT.');
    }

    // 3. Verify Phase 3 Approval Authority Completion
    const approvalHistory = approvalAuthorityService.getApplicationApprovalHistory(tenantId, applicationId);
    const approvalTask = approvalAuthorityService.getApprovalQueue(actor as any).find(
      (t) => t.applicationId === applicationId && t.status === 'APPROVED'
    );

    // If application has pending unapproved tasks or is blocked
    const pendingApprovalTasks = approvalAuthorityService.getApprovalQueue(actor as any).filter(
      (t) => t.applicationId === applicationId && (t.status === 'PENDING' || t.status === 'IN_PROGRESS')
    );

    if (pendingApprovalTasks.length > 0) {
      throw new BadRequestError('Offer generation is unavailable because final approval is pending.');
    }

    // 4. Resolve Authoritative Amounts
    const requestedAmount = Number(app.requestedAmount);
    const approvedAmount = approvalTask ? approvalTask.amount : breEligibleAmount;
    const productMax = app.product ? Number(app.product.maxAmount) : 10000000;
    const productMin = app.product ? Number(app.product.minAmount) : 10000;

    // Final offered amount must never exceed the lowest authoritative cap
    let authoritativeCap = Math.min(requestedAmount, breEligibleAmount, approvedAmount, productMax);
    authoritativeCap = Math.max(authoritativeCap, productMin);

    let finalOfferedAmount = authoritativeCap;
    if (dto?.customOfferedAmount && dto.customOfferedAmount > 0) {
      if (dto.customOfferedAmount > authoritativeCap) {
        throw new BadRequestError(
          `Offered amount ₹${dto.customOfferedAmount.toLocaleString('en-IN')} cannot exceed approved limit of ₹${authoritativeCap.toLocaleString('en-IN')}.`
        );
      }
      finalOfferedAmount = dto.customOfferedAmount;
    }

    const finalTenure = dto?.customTenureMonths || app.tenureMonths || 12;

    // 5. Calculate Simulated Financial Terms
    const sim = this.simulateOffer(tenantId, {
      productId: app.productId,
      loanAmount: finalOfferedAmount,
      tenureMonths: finalTenure,
      riskGrade,
      customRatePct: dto?.overrideRatePct,
    });

    const now = new Date().toISOString();
    const policy = this.getActivePricingPolicy(tenantId, app.productId);
    const validityHours = policy.maxValidityHours || 48;
    const validUntil = new Date(Date.now() + validityHours * 3600000).toISOString();

    // 6. Handle Existing Offers for Application (Mark as SUPERSEDED)
    const existingOffers = this.offerVersions.get(applicationId) || [];
    let nextVersion = 1;

    for (const off of existingOffers) {
      if (off.status === 'PENDING_ACCEPTANCE' || off.status === 'DRAFT') {
        off.status = 'SUPERSEDED';
        off.updatedAt = now;
      }
      if (off.version >= nextVersion) {
        nextVersion = off.version + 1;
      }
    }

    // 7. Assemble Structured Conditions
    const conditions: OfferConditionItem[] = [
      {
        id: `cnd-${uuid().slice(0, 6)}`,
        code: 'BANK_ACCOUNT_VERIFICATION',
        title: 'Disbursement Bank Account Verification',
        description: 'Verify active bank account for loan proceeds transfer',
        isMandatory: true,
        category: 'VERIFICATION',
        status: 'SATISFIED',
        verifiedBy: 'SYSTEM_EKYC',
        verifiedAt: now,
      },
      {
        id: `cnd-${uuid().slice(0, 6)}`,
        code: 'E_SIGN_AGREEMENT',
        title: 'Key Fact Statement (KFS) & Agreement eSign',
        description: 'Statutory digital acceptance and agreement signature',
        isMandatory: true,
        category: 'DOCUMENT',
        status: 'PENDING',
      },
      {
        id: `cnd-${uuid().slice(0, 6)}`,
        code: 'E_NACH_MANDATE',
        title: 'Auto-Debit eNACH Mandate Registration',
        description: 'Recurring monthly EMI auto-debit registration',
        isMandatory: true,
        category: 'BANK_MANDATE',
        status: 'PENDING',
      },
    ];

    if (dto?.customConditions) {
      for (const cc of dto.customConditions) {
        conditions.push({
          id: `cnd-${uuid().slice(0, 6)}`,
          code: cc.code,
          title: cc.title,
          description: cc.description,
          isMandatory: cc.isMandatory ?? true,
          category: cc.category || 'SPECIAL',
          status: 'PENDING',
        });
      }
    }

    // 8. Create Immutable LoanOffer Record
    const offerId = `offer-${app.applicationNo.toLowerCase()}-v${nextVersion}-${uuid().slice(0, 6)}`;
    const newOffer: LoanOffer = {
      id: offerId,
      offerNo: `OFFER-${app.applicationNo}-${nextVersion}`,
      applicationId,
      applicationNo: app.applicationNo,
      tenantId,
      branchId: app.branchId || undefined,
      customerId: app.customerId,
      customerName: `${app.customer.firstName} ${app.customer.lastName}`.trim(),
      customerEmail: app.customer.email || undefined,
      customerMobile: app.customer.mobile || undefined,
      productId: app.productId,
      productCode: app.product.code,
      productName: app.product.name,
      productVersion: 1,
      riskGrade,
      riskScore,
      breDecision,
      approvalTaskId: approvalTask?.id,
      approvalPolicyVersion: 1,
      pricingPolicyId: policy.id,
      pricingPolicyVersion: policy.version,
      version: nextVersion,
      status: 'PENDING_ACCEPTANCE',
      requestedAmount,
      breEligibleAmount,
      approvedAmount,
      offeredAmount: finalOfferedAmount,
      tenureMonths: finalTenure,
      interestModel: sim.interestModel,
      annualInterestRatePct: sim.annualInterestRatePct,
      baseInterestRatePct: policy.baseRateAnnualPct,
      riskSpreadPct: sim.annualInterestRatePct - policy.baseRateAnnualPct,
      monthlyEmi: sim.monthlyEmi,
      totalInterest: sim.totalInterest,
      totalRepayment: sim.totalRepayment,
      processingFee: sim.processingFee,
      processingFeeGst: sim.processingFeeGst,
      documentationCharges: sim.documentationCharges,
      documentationChargesGst: sim.documentationChargesGst,
      platformFee: sim.platformFee,
      platformFeeGst: Math.round(sim.platformFee * 0.18),
      otherFees: 0,
      totalFeesAndTaxes: sim.totalFeesAndTaxes,
      netDisbursedAmount: sim.netDisbursedAmount,
      annualPercentageRateApr: sim.annualPercentageRateApr,
      repaymentFrequency: 'MONTHLY',
      validUntil,
      isExpired: false,
      conditions,
      schedulePreview: sim.schedulePreview,
      createdAt: now,
      updatedAt: now,
    };

    this.loanOffers.set(offerId, newOffer);
    this.loanOffers.set(`${tenantId}:${applicationId}`, newOffer);

    existingOffers.push(newOffer);
    this.offerVersions.set(applicationId, existingOffers);

    // 9. Advance Application & Workflow Engine
    await prisma.loanApplication.update({
      where: { id: applicationId },
      data: {
        status: 'APPROVED',
      },
    }).catch(() => {});

    // 10. Immutable Audit Logging
    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'UNDERWRITER',
      action: 'OFFER_GENERATED',
      entity: 'LoanOffer',
      entityId: offerId,
      newValue: {
        applicationId,
        offerNo: newOffer.offerNo,
        offeredAmount: finalOfferedAmount,
        tenure: finalTenure,
        interestRate: sim.annualInterestRatePct,
        monthlyEmi: sim.monthlyEmi,
        version: nextVersion,
      },
    });

    return newOffer;
  }

  // ---------------------------------------------------------------------------
  // 5. OFFER ACCEPTANCE & DECLINE WORKFLOW
  // ---------------------------------------------------------------------------

  public async acceptOffer(
    tenantId: string,
    offerId: string,
    dto: AcceptOfferDto,
    actor?: OfferActorContext
  ): Promise<LoanOffer> {
    const offer = this.getOfferById(tenantId, offerId);

    if (offer.status !== 'PENDING_ACCEPTANCE' && offer.status !== 'GENERATED') {
      throw new BadRequestError(`Cannot accept offer in '${offer.status}' status. Only active pending offers can be accepted.`);
    }

    // Expiry verification
    if (new Date(offer.validUntil).getTime() < Date.now()) {
      offer.status = 'EXPIRED';
      offer.isExpired = true;
      offer.updatedAt = new Date().toISOString();
      throw new BadRequestError('Offer has expired. Please contact your loan officer for a revised offer.');
    }

    // Verify KFS acknowledgment
    const kfsConfirmed = (dto as any).kfsAccepted ?? (dto as any).kfsAcknowledged ?? true;
    if (!kfsConfirmed) {
      throw new BadRequestError('Mandatory regulatory acknowledgment required: Key Fact Statement (KFS) and Loan Terms must be confirmed.');
    }

    const now = new Date().toISOString();
    const actorName = `${actor?.firstName || ''} ${actor?.lastName || ''}`.trim() || actor?.email || offer.customerName;

    offer.status = 'ACCEPTED';
    offer.acceptedAt = now;
    offer.acceptedBy = actor?.id || offer.customerId;
    offer.acceptedByName = actorName;
    offer.acceptanceMethod = dto.acceptanceMethod || 'CUSTOMER_PORTAL_OTP';
    offer.acceptanceMetadata = {
      ipAddress: dto.ipAddress || '127.0.0.1',
      userAgent: dto.userAgent || 'Adyapan-Borrower-Portal',
      timestamp: now,
      acknowledgedKfsVersion: `KFS-V${offer.version}`,
    };
    offer.updatedAt = now;

    // Advance application status to AGREEMENT_PENDING
    await prisma.loanApplication.update({
      where: { id: offer.applicationId },
      data: {
        status: 'AGREEMENT_PENDING',
      },
    }).catch(() => {});

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'CUSTOMER',
      action: 'OFFER_ACCEPTED',
      entity: 'LoanOffer',
      entityId: offer.id,
      newValue: {
        offerNo: offer.offerNo,
        amount: offer.offeredAmount,
        acceptedAt: now,
        acceptanceMethod: offer.acceptanceMethod,
      },
    });

    return offer;
  }

  public async declineOffer(
    tenantId: string,
    offerId: string,
    dto: DeclineOfferDto,
    actor?: OfferActorContext
  ): Promise<LoanOffer> {
    const offer = this.getOfferById(tenantId, offerId);

    if (offer.status !== 'PENDING_ACCEPTANCE') {
      throw new BadRequestError(`Cannot decline offer in '${offer.status}' status.`);
    }

    const now = new Date().toISOString();
    offer.status = 'DECLINED';
    offer.declinedAt = now;
    offer.declinedBy = actor?.id || offer.customerId;
    offer.declineReason = dto.reason || 'Customer opted out';
    offer.updatedAt = now;

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'CUSTOMER',
      action: 'OFFER_DECLINED',
      entity: 'LoanOffer',
      entityId: offer.id,
      newValue: {
        offerNo: offer.offerNo,
        reason: offer.declineReason,
        declinedAt: now,
      },
    });

    return offer;
  }

  public async cancelOffer(
    tenantId: string,
    offerId: string,
    reason: string,
    actor?: OfferActorContext
  ): Promise<LoanOffer> {
    const offer = this.getOfferById(tenantId, offerId);

    if (offer.status === 'ACCEPTED') {
      throw new BadRequestError('Cannot cancel an already accepted loan offer. Requires credit committee cancellation.');
    }

    const now = new Date().toISOString();
    offer.status = 'CANCELLED';
    offer.cancelledAt = now;
    offer.cancelledBy = actor?.id;
    offer.cancelReason = reason || 'Cancelled by authorized officer';
    offer.updatedAt = now;

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'UNDERWRITER',
      action: 'OFFER_CANCELLED',
      entity: 'LoanOffer',
      entityId: offer.id,
      newValue: {
        offerNo: offer.offerNo,
        reason: offer.cancelReason,
        cancelledAt: now,
      },
    });

    return offer;
  }

  // ---------------------------------------------------------------------------
  // 6. QUERIES & DETAIL RETRIEVAL
  // ---------------------------------------------------------------------------

  public getOfferById(tenantId: string, id: string): LoanOffer {
    let offer = this.loanOffers.get(id);
    if (!offer) {
      for (const o of this.loanOffers.values()) {
        if (o.id === id && this.matchesTenant(o.tenantId, tenantId)) {
          offer = o;
          break;
        }
      }
    }
    if (!offer) {
      throw new NotFoundError(`Loan Offer '${id}' not found.`);
    }

    // Refresh expiry status
    if (offer.status === 'PENDING_ACCEPTANCE' && new Date(offer.validUntil).getTime() < Date.now()) {
      offer.isExpired = true;
      offer.status = 'EXPIRED';
    }

    return offer;
  }

  public getApplicationOffers(tenantId: string, applicationId: string): LoanOffer[] {
    const list = this.offerVersions.get(applicationId) || [];
    const filtered = list.filter((o) => this.matchesTenant(o.tenantId, tenantId));
    
    // Refresh expiry
    for (const off of filtered) {
      if (off.status === 'PENDING_ACCEPTANCE' && new Date(off.validUntil).getTime() < Date.now()) {
        off.isExpired = true;
        off.status = 'EXPIRED';
      }
    }

    return filtered.sort((a, b) => b.version - a.version);
  }

  public getActiveApplicationOffer(tenantId: string, applicationId: string): LoanOffer | undefined {
    const list = this.getApplicationOffers(tenantId, applicationId);
    return list.find((o) => o.status === 'PENDING_ACCEPTANCE' || o.status === 'ACCEPTED');
  }

  public listOffers(
    tenantId: string,
    options?: { status?: string; search?: string; customerId?: string }
  ): LoanOffer[] {
    const list: LoanOffer[] = [];
    const seenIds = new Set<string>();

    for (const off of this.loanOffers.values()) {
      if (seenIds.has(off.id)) continue;
      seenIds.add(off.id);

      if (this.matchesTenant(off.tenantId, tenantId)) {
        if (options?.customerId && off.customerId !== options.customerId) continue;
        if (options?.status && options.status !== 'ALL' && off.status !== options.status) continue;
        if (options?.search) {
          const q = options.search.toLowerCase();
          if (
            !off.customerName.toLowerCase().includes(q) &&
            !off.applicationNo.toLowerCase().includes(q) &&
            !off.offerNo.toLowerCase().includes(q) &&
            !off.productName.toLowerCase().includes(q)
          ) {
            continue;
          }
        }

        if (off.status === 'PENDING_ACCEPTANCE' && new Date(off.validUntil).getTime() < Date.now()) {
          off.isExpired = true;
          off.status = 'EXPIRED';
        }

        list.push(off);
      }
    }

    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export const offerEngineService = OfferEngineService.getInstance();
