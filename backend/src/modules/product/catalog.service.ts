import { v4 as uuid } from 'uuid';
import {
  DynamicLoanProduct,
  CreateDynamicProductDto,
  UpdateDynamicProductDto,
  ProductPricingSimulationInput,
  ProductPricingSimulationResult,
  KeyFactStatement,
} from './catalog.types';
import { evidenceAuditService } from '../audit/evidence.service';
import { logAudit } from '../audit/audit.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';

export class ProductCatalogService {
  private static instance: ProductCatalogService;

  // Active products: Map<`${tenantId}:${productId}`, DynamicLoanProduct>
  private readonly products = new Map<string, DynamicLoanProduct>();

  // Historical snapshots: Map<`${tenantId}:${productId}:v${version}`, DynamicLoanProduct>
  private readonly historicalSnapshots = new Map<string, DynamicLoanProduct>();

  private constructor() {
    this.seedCanonicalCatalog('tenant-adyapan-default');
    this.seedCanonicalCatalog('tenant-apex-nbfc');
  }

  public static getInstance(): ProductCatalogService {
    if (!ProductCatalogService.instance) {
      ProductCatalogService.instance = new ProductCatalogService();
    }
    return ProductCatalogService.instance;
  }

  public seedCanonicalCatalog(tenantId: string): void {
    const now = new Date().toISOString();

    const seeds: Array<CreateDynamicProductDto & { id: string }> = [
      {
        id: `prod-personal-prime-${tenantId.replace('tenant-', '')}`,
        code: 'PERSONAL_PRIME_SALARIED',
        name: 'Prime Salaried Personal Loan',
        description: 'Unsecured personal loan for salaried professionals with instant digital approval',
        category: 'PERSONAL',
        interestModel: 'REDUCING_BALANCE',
        baseInterestRateAnnualPct: 12.5,
        minLoanAmountInr: 25000,
        maxLoanAmountInr: 1500000,
        minTenureMonths: 6,
        maxTenureMonths: 48,
        feeSchedule: {
          processingFeePct: 2.0,
          processingFeeMinInr: 1000,
          documentationChargesInr: 500,
          foreclosurePenaltyPct: 3.0,
          lockInMonths: 6,
          latePaymentPenaltyMonthlyPct: 2.0,
          gracePeriodDays: 3,
        },
        policyOverrides: {
          maxFoirPct: 50,
          minCibilScore: 680,
          minMonthlyIncome: 30000,
          requiredKycDocs: ['PAN', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT'],
        },
      },
      {
        id: `prod-sme-growth-${tenantId.replace('tenant-', '')}`,
        code: 'SME_GROWTH_BUSINESS',
        name: 'SME Working Capital Line',
        description: 'Working capital and term loan for GST-registered micro, small, and medium enterprises',
        category: 'SME_BUSINESS',
        interestModel: 'REDUCING_BALANCE',
        baseInterestRateAnnualPct: 15.0,
        minLoanAmountInr: 100000,
        maxLoanAmountInr: 5000000,
        minTenureMonths: 12,
        maxTenureMonths: 60,
        feeSchedule: {
          processingFeePct: 2.5,
          processingFeeMinInr: 2500,
          documentationChargesInr: 1500,
          foreclosurePenaltyPct: 4.0,
          lockInMonths: 12,
          latePaymentPenaltyMonthlyPct: 2.5,
          gracePeriodDays: 5,
        },
        policyOverrides: {
          maxFoirPct: 60,
          minCibilScore: 650,
          minMonthlyIncome: 75000,
          requiredKycDocs: ['PAN', 'GST_CERTIFICATE', 'BANK_STATEMENT_12M', 'ITR_COMPUTATION'],
        },
      },
      {
        id: `prod-bnpl-instant-${tenantId.replace('tenant-', '')}`,
        code: 'BNPL_INSTANT_CHECKOUT',
        name: 'BNPL Point-of-Sale Line',
        description: 'Zero-cost promotional BNPL with instant merchant checkout and flexible installments',
        category: 'BNPL_LINE',
        interestModel: 'FIXED_FLAT',
        baseInterestRateAnnualPct: 18.0,
        minLoanAmountInr: 5000,
        maxLoanAmountInr: 100000,
        minTenureMonths: 1,
        maxTenureMonths: 12,
        feeSchedule: {
          processingFeePct: 1.0,
          processingFeeMinInr: 100,
          documentationChargesInr: 0,
          foreclosurePenaltyPct: 0.0,
          lockInMonths: 0,
          latePaymentPenaltyMonthlyPct: 3.0,
          gracePeriodDays: 3,
        },
        policyOverrides: {
          maxFoirPct: 45,
          minCibilScore: 620,
          minMonthlyIncome: 15000,
        },
      },
      {
        id: `prod-floating-mclr-${tenantId.replace('tenant-', '')}`,
        code: 'COMMERCIAL_MCLR_LINKED',
        name: 'Floating MCLR Commercial Facility',
        description: 'High-value commercial credit linked to 1-year RBI Benchmark MCLR spread',
        category: 'SME_BUSINESS',
        interestModel: 'FLOATING_MCLR_LINKED',
        baseInterestRateAnnualPct: 8.5, // 1-year Base MCLR
        mclrSpreadAnnualPct: 4.5, // Spread 4.5% -> Total 13.0% APR
        minLoanAmountInr: 1000000,
        maxLoanAmountInr: 10000000,
        minTenureMonths: 12,
        maxTenureMonths: 84,
        feeSchedule: {
          processingFeePct: 1.5,
          processingFeeMinInr: 15000,
          documentationChargesInr: 5000,
          foreclosurePenaltyPct: 2.0,
          lockInMonths: 12,
          latePaymentPenaltyMonthlyPct: 2.0,
          gracePeriodDays: 5,
        },
        policyOverrides: {
          maxFoirPct: 55,
          minCibilScore: 700,
        },
      },
    ];

    for (const seed of seeds) {
      const p: DynamicLoanProduct = {
        ...seed,
        policyOverrides: seed.policyOverrides || {},
        tenantId,
        version: 1,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      };
      this.products.set(`${tenantId}:${p.id}`, p);
      this.historicalSnapshots.set(`${tenantId}:${p.id}:v1`, { ...p });
    }
  }

  // --- 1. PRODUCT CATALOG CRUD & IMMUTABLE VERSIONING ---

  public listProducts(tenantId: string): DynamicLoanProduct[] {
    const result: DynamicLoanProduct[] = [];
    for (const p of this.products.values()) {
      if (p.tenantId === tenantId) {
        result.push(p);
      }
    }
    return result;
  }

  public getProductById(tenantId: string, productId: string): DynamicLoanProduct {
    let p = this.products.get(`${tenantId}:${productId}`);
    if (!p) {
      p = this.products.get(`tenant-adyapan-default:${productId}`);
    }
    if (!p) {
      // Try searching by code
      for (const item of this.products.values()) {
        if ((item.tenantId === tenantId || item.tenantId === 'tenant-adyapan-default') && item.code === productId) {
          p = item;
          break;
        }
      }
    }
    if (!p) {
      throw new NotFoundError(`Loan product '${productId}' not found for tenant '${tenantId}'.`);
    }
    return p;
  }

  public getProductVersionSnapshot(tenantId: string, productId: string, version: number): DynamicLoanProduct {
    const snapshotKey = `${tenantId}:${productId}:v${version}`;
    const snap = this.historicalSnapshots.get(snapshotKey) || this.historicalSnapshots.get(`tenant-adyapan-default:${productId}:v${version}`);
    if (!snap) {
      return this.getProductById(tenantId, productId);
    }
    return snap;
  }

  public async createProduct(
    tenantId: string,
    dto: CreateDynamicProductDto,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<DynamicLoanProduct> {
    if (!actor.roles.includes('SUPER_ADMIN') && !actor.roles.includes('ADMIN')) {
      throw new ForbiddenError('Only Administrators can launch new loan products.');
    }

    if (dto.minLoanAmountInr >= dto.maxLoanAmountInr) {
      throw new BadRequestError('minLoanAmountInr must be less than maxLoanAmountInr.');
    }
    if (dto.minTenureMonths >= dto.maxTenureMonths) {
      throw new BadRequestError('minTenureMonths must be less than maxTenureMonths.');
    }

    const cleanCode = dto.code.toUpperCase().replace(/\s+/g, '_');
    const now = new Date().toISOString();
    const productId = `prod-${cleanCode.toLowerCase()}-${uuid().slice(0, 6)}`;

    const product: DynamicLoanProduct = {
      id: productId,
      tenantId,
      code: cleanCode,
      name: dto.name.trim(),
      description: dto.description.trim(),
      category: dto.category,
      version: 1,
      status: 'ACTIVE',
      interestModel: dto.interestModel,
      baseInterestRateAnnualPct: dto.baseInterestRateAnnualPct,
      mclrSpreadAnnualPct: dto.mclrSpreadAnnualPct,
      minLoanAmountInr: dto.minLoanAmountInr,
      maxLoanAmountInr: dto.maxLoanAmountInr,
      minTenureMonths: dto.minTenureMonths,
      maxTenureMonths: dto.maxTenureMonths,
      feeSchedule: dto.feeSchedule,
      policyOverrides: dto.policyOverrides || {},
      createdAt: now,
      updatedAt: now,
    };

    this.products.set(`${tenantId}:${productId}`, product);
    this.historicalSnapshots.set(`${tenantId}:${productId}:v1`, { ...product });

    evidenceAuditService.recordEvidenceNode({
      tenantId,
      eventType: 'POLICY_CONFIGURATION_CHANGE',
      actorId: actor.id,
      actorRole: actor.roles[0],
      actorEmail: actor.email,
      entityType: 'LOAN_PRODUCT',
      entityId: productId,
      action: 'PRODUCT_VERSION_CREATED',
      correlationId: `corr-prod-${productId}`,
      beforeState: {},
      afterState: { code: cleanCode, version: 1, apr: dto.baseInterestRateAnnualPct },
      timestamp: now,
    });

    await logAudit({
      userId: actor.id?.startsWith('usr-') ? actor.id : undefined,
      role: actor.roles[0],
      action: 'LOAN_PRODUCT_CREATED',
      entity: 'LoanProduct',
      entityId: productId,
      newValue: { code: cleanCode, category: dto.category },
    }).catch(() => {});

    return product;
  }

  public async updateProductWithVersioning(
    tenantId: string,
    productId: string,
    dto: UpdateDynamicProductDto,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<DynamicLoanProduct> {
    if (!actor.roles.includes('SUPER_ADMIN') && !actor.roles.includes('ADMIN')) {
      throw new ForbiddenError('Only Administrators can modify loan products.');
    }

    const current = this.getProductById(tenantId, productId);
    const now = new Date().toISOString();
    const nextVersion = current.version + 1;

    // Snapshot existing version before modifying
    this.historicalSnapshots.set(`${tenantId}:${productId}:v${current.version}`, { ...current });

    const updated: DynamicLoanProduct = {
      ...current,
      name: dto.name || current.name,
      description: dto.description || current.description,
      status: dto.status || current.status,
      baseInterestRateAnnualPct: dto.baseInterestRateAnnualPct ?? current.baseInterestRateAnnualPct,
      mclrSpreadAnnualPct: dto.mclrSpreadAnnualPct ?? current.mclrSpreadAnnualPct,
      minLoanAmountInr: dto.minLoanAmountInr ?? current.minLoanAmountInr,
      maxLoanAmountInr: dto.maxLoanAmountInr ?? current.maxLoanAmountInr,
      minTenureMonths: dto.minTenureMonths ?? current.minTenureMonths,
      maxTenureMonths: dto.maxTenureMonths ?? current.maxTenureMonths,
      feeSchedule: {
        ...current.feeSchedule,
        ...(dto.feeSchedule || {}),
      },
      policyOverrides: {
        ...current.policyOverrides,
        ...(dto.policyOverrides || {}),
      },
      version: nextVersion,
      updatedAt: now,
    };

    this.products.set(`${tenantId}:${productId}`, updated);
    this.historicalSnapshots.set(`${tenantId}:${productId}:v${nextVersion}`, { ...updated });

    evidenceAuditService.recordEvidenceNode({
      tenantId,
      eventType: 'POLICY_CONFIGURATION_CHANGE',
      actorId: actor.id,
      actorRole: actor.roles[0],
      actorEmail: actor.email,
      entityType: 'LOAN_PRODUCT',
      entityId: productId,
      action: 'PRODUCT_VERSION_INCREMENTED',
      correlationId: `corr-prod-v${nextVersion}-${productId}`,
      beforeState: { version: current.version },
      afterState: { version: nextVersion, apr: updated.baseInterestRateAnnualPct },
      timestamp: now,
    });

    return updated;
  }

  // --- 2. PRICING SIMULATION & STATUTORY KFS ENGINE ---

  public simulateProductPricing(
    tenantId: string,
    input: ProductPricingSimulationInput
  ): ProductPricingSimulationResult {
    const product = this.getProductById(tenantId, input.productId);
    const { loanAmount, tenureMonths, applicantProfile } = input;

    if (loanAmount < product.minLoanAmountInr || loanAmount > product.maxLoanAmountInr) {
      throw new BadRequestError(
        `Loan amount ₹${loanAmount.toLocaleString('en-IN')} is outside allowed bounds for ${product.name} (₹${product.minLoanAmountInr.toLocaleString('en-IN')} - ₹${product.maxLoanAmountInr.toLocaleString('en-IN')}).`
      );
    }
    if (tenureMonths < product.minTenureMonths || tenureMonths > product.maxTenureMonths) {
      throw new BadRequestError(
        `Tenure ${tenureMonths} months is outside allowed bounds for ${product.name} (${product.minTenureMonths} - ${product.maxTenureMonths} months).`
      );
    }

    // Determine effective annual interest rate
    let effectiveRate = product.baseInterestRateAnnualPct;
    if (product.interestModel === 'FLOATING_MCLR_LINKED' && product.mclrSpreadAnnualPct) {
      effectiveRate = product.baseInterestRateAnnualPct + product.mclrSpreadAnnualPct;
    }

    // Monthly EMI computation
    let monthlyEmi = 0;
    let totalInterest = 0;

    if (product.interestModel === 'FIXED_FLAT') {
      totalInterest = (loanAmount * (effectiveRate / 100) * tenureMonths) / 12;
      monthlyEmi = (loanAmount + totalInterest) / tenureMonths;
    } else {
      // Reducing balance amortization: P * r * (1+r)^n / ((1+r)^n - 1)
      const monthlyRate = effectiveRate / 12 / 100;
      if (monthlyRate === 0) {
        monthlyEmi = loanAmount / tenureMonths;
        totalInterest = 0;
      } else {
        const factor = Math.pow(1 + monthlyRate, tenureMonths);
        monthlyEmi = (loanAmount * monthlyRate * factor) / (factor - 1);
        totalInterest = monthlyEmi * tenureMonths - loanAmount;
      }
    }

    // Fee Schedule & Processing Fee calculation
    const rawProcessingFee = (loanAmount * product.feeSchedule.processingFeePct) / 100;
    const processingFee = Math.max(rawProcessingFee, product.feeSchedule.processingFeeMinInr);
    const documentationCharges = product.feeSchedule.documentationChargesInr;
    const totalFees = processingFee + documentationCharges;
    const netDisbursedAmount = loanAmount - totalFees;
    const totalRepaymentAmount = loanAmount + totalInterest;

    // Statutory Annual Percentage Rate (APR) under RBI KFS Guidelines
    // APR = Effective Annual Nominal Rate + ((Total Fees / Net Disbursed Amount) * (12 / Tenure) * 100)
    const feeAprImpact = ((totalFees / (netDisbursedAmount || loanAmount)) * (12 / tenureMonths)) * 100;
    const annualPercentageRateApr = Math.round((effectiveRate + feeAprImpact) * 100) / 100;

    // Statutory Key Fact Statement (KFS)
    const keyFactStatement: KeyFactStatement = {
      sanctionAmount: loanAmount,
      rateOfInterestType: product.interestModel,
      rateOfInterestPct: effectiveRate,
      tenureMonths,
      installmentAmount: Math.round(monthlyEmi),
      totalPayableAmount: Math.round(totalRepaymentAmount),
      processingFeeWithGst: Math.round(processingFee * 1.18), // 18% GST
      documentationFee: documentationCharges,
      foreclosureCharges: `${product.feeSchedule.foreclosurePenaltyPct}% before ${product.feeSchedule.lockInMonths} months, 0% thereafter`,
      overdueCharges: `${product.feeSchedule.latePaymentPenaltyMonthlyPct}% per month after ${product.feeSchedule.gracePeriodDays} days grace period`,
      coolingOffPeriodDays: 3,
    };

    // Eligibility check against product policy overrides
    const eligibilityReasons: string[] = [];
    let eligible = true;
    let computedFoirPct: number | undefined;

    if (applicantProfile) {
      if (product.policyOverrides.minCibilScore && applicantProfile.cibilScore !== undefined) {
        if (applicantProfile.cibilScore < product.policyOverrides.minCibilScore) {
          eligible = false;
          eligibilityReasons.push(
            `CIBIL bureau score ${applicantProfile.cibilScore} is below minimum product threshold of ${product.policyOverrides.minCibilScore}.`
          );
        }
      }

      if (product.policyOverrides.minMonthlyIncome && applicantProfile.monthlyIncome !== undefined) {
        if (applicantProfile.monthlyIncome < product.policyOverrides.minMonthlyIncome) {
          eligible = false;
          eligibilityReasons.push(
            `Monthly income ₹${applicantProfile.monthlyIncome.toLocaleString('en-IN')} is below required minimum of ₹${product.policyOverrides.minMonthlyIncome.toLocaleString('en-IN')}.`
          );
        }
      }

      if (product.policyOverrides.maxFoirPct && applicantProfile.monthlyIncome && applicantProfile.monthlyIncome > 0) {
        const totalObligations = (applicantProfile.existingEmis || 0) + monthlyEmi;
        computedFoirPct = Math.round((totalObligations / applicantProfile.monthlyIncome) * 100);
        if (computedFoirPct > product.policyOverrides.maxFoirPct) {
          eligible = false;
          eligibilityReasons.push(
            `Projected FOIR ${computedFoirPct}% exceeds maximum allowed limit of ${product.policyOverrides.maxFoirPct}%.`
          );
        }
      }
    }

    return {
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      version: product.version,
      loanAmount,
      tenureMonths,
      interestModel: product.interestModel,
      appliedInterestRateAnnualPct: effectiveRate,
      monthlyEmi: Math.round(monthlyEmi),
      totalInterest: Math.round(totalInterest),
      processingFee: Math.round(processingFee),
      documentationCharges: Math.round(documentationCharges),
      totalFees: Math.round(totalFees),
      netDisbursedAmount: Math.round(netDisbursedAmount),
      totalRepaymentAmount: Math.round(totalRepaymentAmount),
      annualPercentageRateApr,
      keyFactStatement,
      eligibilityCheck: {
        eligible,
        reasons: eligibilityReasons,
        computedFoirPct,
      },
    };
  }

  public clearForTesting(): void {
    this.products.clear();
    this.historicalSnapshots.clear();
    this.seedCanonicalCatalog('tenant-adyapan-default');
    this.seedCanonicalCatalog('tenant-apex-nbfc');
  }
}

export const productCatalogService = ProductCatalogService.getInstance();
