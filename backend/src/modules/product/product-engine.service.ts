import { v4 as uuid } from 'uuid';
import {
  LendingProduct,
  CreateProductDto,
  UpdateProductDto,
  ProductPricingSimulationInput,
  ProductPricingSimulationResult,
  KeyFactStatement,
} from './product.types';
import { prisma } from '../../config/prisma';
import { logAudit } from '../audit/audit.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { WorkflowService } from '../workflows/workflow.service';

export interface ProductActorContext {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}

export class ProductEngineService {
  private static instance: ProductEngineService;

  // Active products: Map<`${tenantId}:${productId}`, LendingProduct>
  private readonly products = new Map<string, LendingProduct>();

  // Historical snapshots: Map<`${tenantId}:${productId}:v${version}`, LendingProduct>
  private readonly historicalSnapshots = new Map<string, LendingProduct>();

  private constructor() {
    this.seedCanonicalCatalog('tenant-adyapan-default');
    this.seedCanonicalCatalog('tenant-apex-nbfc');
  }

  public static getInstance(): ProductEngineService {
    if (!ProductEngineService.instance) {
      ProductEngineService.instance = new ProductEngineService();
    }
    return ProductEngineService.instance;
  }

  public seedCanonicalCatalog(tenantId: string): void {
    const now = new Date().toISOString();

    const seeds: Array<CreateProductDto & { id: string; status: 'ACTIVE' | 'DRAFT' }> = [
      {
        id: `prod-personal-prime-${tenantId.replace('tenant-', '')}`,
        code: 'PERSONAL_PRIME_SALARIED',
        name: 'Prime Salaried Personal Loan',
        description: 'Unsecured personal loan for salaried corporate professionals with competitive pricing and automated decisioning',
        productType: 'PERSONAL_LOAN',
        status: 'ACTIVE',
        minAmount: 25000,
        maxAmount: 1500000,
        defaultAmount: 300000,
        amountIncrement: 5000,
        minTenureMonths: 6,
        maxTenureMonths: 48,
        allowedTenures: [6, 12, 18, 24, 36, 48],
        interestModel: 'REDUCING_BALANCE',
        baseInterestRateAnnualPct: 12.5,
        feeSchedule: {
          processingFeePct: 2.0,
          processingFeeMinInr: 1000,
          documentationChargesInr: 500,
          platformFeeInr: 250,
          foreclosurePenaltyPct: 3.0,
          lockInMonths: 6,
          latePaymentPenaltyMonthlyPct: 2.0,
          gracePeriodDays: 3,
          bounceChargeInr: 500,
        },
        eligibility: {
          minAge: 21,
          maxAge: 58,
          minMonthlyIncome: 30000,
          allowedEmploymentTypes: ['SALARIED', 'PROFESSIONAL'],
          allowedSegments: ['PRIME_CORPORATE', 'GOVERNMENT', 'MNC'],
          residenceRequirement: 'INDIAN_RESIDENT',
        },
        documents: [
          { category: 'IDENTITY', documentType: 'PAN', mandatory: true, description: 'Permanent Account Number Card' },
          { category: 'IDENTITY', documentType: 'AADHAAR', mandatory: true, description: 'Aadhaar Card (eKYC / DigiLocker)' },
          { category: 'INCOME', documentType: 'SALARY_SLIP', mandatory: true, description: 'Latest 3 Months Salary Slips' },
          { category: 'BANK_STATEMENT', documentType: 'BANK_STATEMENT_6M', mandatory: true, description: 'Latest 6 Months Salary Account Statement' },
        ],
        creditPolicy: {
          minCibilScore: 680,
          maxFoirPct: 50,
          maxDtiPct: 45,
          bureauProvider: 'CIBIL',
        },
        riskPolicy: {
          riskGrade: 'LOW',
          maxFraudScore: 40,
          manualReviewThresholdScore: 60,
          pennyDropRequired: true,
          livenessCheckRequired: true,
        },
        approvalConfig: {
          branchManagerLimitInr: 500000,
          creditAnalystLimitInr: 1500000,
          underwriterLimitInr: 2500000,
          requiresCommitteeApprovalAboveInr: 2500000,
        },
        workflowId: `wf-orig-standard-${tenantId.replace('tenant-', '')}`,
        allowedChannels: ['DIRECT_BORROWER', 'LOAN_OFFICER', 'BRANCH', 'PARTNER', 'API'],
        isDefault: true,
      },
      {
        id: `prod-instant-digital-${tenantId.replace('tenant-', '')}`,
        code: 'INSTANT_DIGITAL_EXPRESS',
        name: 'Instant Express Digital Loan',
        description: 'End-to-end digital paperless personal loan with straight-through-processing (STP) in under 10 minutes',
        productType: 'INSTANT_PERSONAL_LOAN',
        status: 'ACTIVE',
        minAmount: 5000,
        maxAmount: 200000,
        defaultAmount: 50000,
        amountIncrement: 1000,
        minTenureMonths: 3,
        maxTenureMonths: 18,
        allowedTenures: [3, 6, 9, 12, 18],
        interestModel: 'REDUCING_BALANCE',
        baseInterestRateAnnualPct: 16.5,
        feeSchedule: {
          processingFeePct: 2.5,
          processingFeeMinInr: 500,
          documentationChargesInr: 200,
          platformFeeInr: 150,
          foreclosurePenaltyPct: 2.0,
          lockInMonths: 3,
          latePaymentPenaltyMonthlyPct: 2.5,
          gracePeriodDays: 3,
          bounceChargeInr: 350,
        },
        eligibility: {
          minAge: 21,
          maxAge: 55,
          minMonthlyIncome: 20000,
          allowedEmploymentTypes: ['SALARIED', 'SELF_EMPLOYED'],
          residenceRequirement: 'INDIAN_RESIDENT',
        },
        documents: [
          { category: 'IDENTITY', documentType: 'PAN', mandatory: true, description: 'PAN verification via NSDL API' },
          { category: 'IDENTITY', documentType: 'AADHAAR', mandatory: true, description: 'Aadhaar OTP eKYC verification' },
          { category: 'BANK_STATEMENT', documentType: 'AA_CONSENT', mandatory: true, description: 'Account Aggregator bank statement fetch' },
        ],
        creditPolicy: {
          minCibilScore: 650,
          maxFoirPct: 55,
          maxDtiPct: 50,
          bureauProvider: 'EXPERIAN',
        },
        riskPolicy: {
          riskGrade: 'MEDIUM',
          maxFraudScore: 35,
          manualReviewThresholdScore: 50,
          pennyDropRequired: true,
          livenessCheckRequired: true,
        },
        approvalConfig: {
          branchManagerLimitInr: 100000,
          creditAnalystLimitInr: 200000,
          underwriterLimitInr: 200000,
          requiresCommitteeApprovalAboveInr: 200000,
        },
        workflowId: `wf-orig-digital-${tenantId.replace('tenant-', '')}`,
        allowedChannels: ['DIRECT_BORROWER', 'API', 'PARTNER'],
        isDefault: false,
      },
      {
        id: `prod-sme-growth-${tenantId.replace('tenant-', '')}`,
        code: 'SME_GROWTH_BUSINESS',
        name: 'SME Working Capital Business Loan',
        description: 'Working capital and term facility for GST-registered micro, small, and medium enterprises (MSMEs)',
        productType: 'BUSINESS_LOAN',
        status: 'ACTIVE',
        minAmount: 100000,
        maxAmount: 5000000,
        defaultAmount: 1000000,
        amountIncrement: 25000,
        minTenureMonths: 12,
        maxTenureMonths: 60,
        allowedTenures: [12, 24, 36, 48, 60],
        interestModel: 'REDUCING_BALANCE',
        baseInterestRateAnnualPct: 15.0,
        feeSchedule: {
          processingFeePct: 2.5,
          processingFeeMinInr: 2500,
          documentationChargesInr: 1500,
          platformFeeInr: 500,
          foreclosurePenaltyPct: 4.0,
          lockInMonths: 12,
          latePaymentPenaltyMonthlyPct: 2.5,
          gracePeriodDays: 5,
          bounceChargeInr: 750,
        },
        eligibility: {
          minAge: 25,
          maxAge: 65,
          minMonthlyIncome: 75000,
          allowedEmploymentTypes: ['BUSINESS', 'SELF_EMPLOYED'],
          residenceRequirement: 'INDIAN_RESIDENT',
        },
        documents: [
          { category: 'IDENTITY', documentType: 'PAN', mandatory: true, description: 'Entity & Promoter PAN' },
          { category: 'BUSINESS', documentType: 'GST_CERTIFICATE', mandatory: true, description: 'GST Registration Certificate' },
          { category: 'BANK_STATEMENT', documentType: 'BANK_STATEMENT_12M', mandatory: true, description: '12 Months Current Account Statement' },
          { category: 'INCOME', documentType: 'ITR_COMPUTATION_2Y', mandatory: true, description: 'Last 2 Years ITR and Financial Statements' },
        ],
        creditPolicy: {
          minCibilScore: 650,
          maxFoirPct: 60,
          maxDtiPct: 55,
          bureauProvider: 'CRIF',
        },
        riskPolicy: {
          riskGrade: 'MEDIUM',
          maxFraudScore: 45,
          manualReviewThresholdScore: 55,
          pennyDropRequired: true,
          livenessCheckRequired: true,
        },
        approvalConfig: {
          branchManagerLimitInr: 1000000,
          creditAnalystLimitInr: 2500000,
          underwriterLimitInr: 5000000,
          requiresCommitteeApprovalAboveInr: 5000000,
        },
        workflowId: `wf-orig-standard-${tenantId.replace('tenant-', '')}`,
        allowedChannels: ['LOAN_OFFICER', 'BRANCH', 'PARTNER'],
        isDefault: false,
      },
      {
        id: `prod-merchant-line-${tenantId.replace('tenant-', '')}`,
        code: 'MERCHANT_CASH_ADVANCE',
        name: 'Merchant Daily POS Line',
        description: 'Flexible daily repayment credit line against credit card and UPI POS machine transaction flow',
        productType: 'MERCHANT_LOAN',
        status: 'DRAFT',
        minAmount: 50000,
        maxAmount: 1000000,
        defaultAmount: 250000,
        amountIncrement: 10000,
        minTenureMonths: 3,
        maxTenureMonths: 12,
        allowedTenures: [3, 6, 9, 12],
        interestModel: 'FIXED_FLAT',
        baseInterestRateAnnualPct: 18.0,
        feeSchedule: {
          processingFeePct: 2.0,
          processingFeeMinInr: 1000,
          documentationChargesInr: 500,
          foreclosurePenaltyPct: 2.0,
          lockInMonths: 2,
          latePaymentPenaltyMonthlyPct: 2.0,
          gracePeriodDays: 2,
          bounceChargeInr: 500,
        },
        eligibility: {
          minAge: 21,
          maxAge: 60,
          minMonthlyIncome: 50000,
          allowedEmploymentTypes: ['BUSINESS', 'SELF_EMPLOYED'],
        },
        documents: [
          { category: 'IDENTITY', documentType: 'PAN', mandatory: true, description: 'Merchant PAN' },
          { category: 'BUSINESS', documentType: 'POS_STATEMENT_6M', mandatory: true, description: '6 Months POS Settlement Report' },
        ],
        creditPolicy: {
          minCibilScore: 620,
          maxFoirPct: 65,
        },
        riskPolicy: {
          riskGrade: 'HIGH',
          maxFraudScore: 50,
          pennyDropRequired: true,
          livenessCheckRequired: true,
        },
        workflowId: `wf-orig-standard-${tenantId.replace('tenant-', '')}`,
        allowedChannels: ['PARTNER', 'API', 'LOAN_OFFICER'],
        isDefault: false,
      },
    ];

    for (const seed of seeds) {
      const product: LendingProduct = {
        ...seed,
        isDefault: seed.isDefault ?? false,
        documents: seed.documents || [],
        workflowId: seed.workflowId || `wf-orig-standard-${tenantId.replace('tenant-', '')}`,
        allowedChannels: seed.allowedChannels || ['DIRECT_BORROWER', 'LOAN_OFFICER', 'BRANCH'],
        tenantId,
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      this.products.set(`${tenantId}:${product.id}`, product);
      this.historicalSnapshots.set(`${tenantId}:${product.id}:v1`, { ...product });
    }
  }

  public listProducts(
    tenantId: string,
    options?: {
      status?: string;
      productType?: string;
      channel?: string;
      search?: string;
      activeOnly?: boolean;
    }
  ): LendingProduct[] {
    const list: LendingProduct[] = [];
    for (const [key, prod] of this.products.entries()) {
      if (prod.tenantId === tenantId || key.startsWith(`${tenantId}:`)) {
        if (options?.activeOnly && prod.status !== 'ACTIVE') continue;
        if (options?.status && options.status !== 'ALL' && prod.status !== options.status) continue;
        if (options?.productType && options.productType !== 'ALL' && prod.productType !== options.productType) continue;
        if (options?.channel && options.channel !== 'ALL' && !prod.allowedChannels.includes(options.channel as any)) continue;
        if (options?.search) {
          const q = options.search.toLowerCase();
          const match =
            prod.name.toLowerCase().includes(q) ||
            prod.code.toLowerCase().includes(q) ||
            prod.description.toLowerCase().includes(q);
          if (!match) continue;
        }
        list.push(prod);
      }
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public getProductById(tenantId: string, id: string): LendingProduct {
    let product = this.products.get(`${tenantId}:${id}`);
    if (!product) {
      // Fallback: search across tenant map by ID or Code
      for (const [key, p] of this.products.entries()) {
        if (p.id === id || p.code === id || p.code.toLowerCase() === id.toLowerCase()) {
          if (p.tenantId !== tenantId) {
            throw new ForbiddenError('Access Denied: Product belongs to another tenant organization');
          }
          product = p;
          break;
        }
      }
    }
    if (!product) {
      const fallback = Array.from(this.products.values()).find(
        (p) => p.tenantId === tenantId && p.status === 'ACTIVE'
      );
      if (fallback) return fallback;
      throw new NotFoundError(`Loan Product ${id} not found`);
    }
    return product;
  }

  public async createProduct(
    tenantId: string,
    dto: CreateProductDto,
    actor?: ProductActorContext
  ): Promise<LendingProduct> {
    const existing = this.listProducts(tenantId).find((p) => p.code === dto.code);
    if (existing) {
      throw new BadRequestError(`A product with unique code '${dto.code}' already exists for this tenant.`);
    }

    const id = `prod-${dto.productType.toLowerCase().replace(/_/g, '-')}-${uuid().slice(0, 8)}`;
    const now = new Date().toISOString();

    const product: LendingProduct = {
      id,
      tenantId,
      code: dto.code.trim().toUpperCase(),
      name: dto.name.trim(),
      description: dto.description.trim(),
      productType: dto.productType,
      status: 'DRAFT', // Always initially created as DRAFT
      version: 1,
      isDefault: dto.isDefault ?? false,
      minAmount: dto.minAmount,
      maxAmount: dto.maxAmount,
      defaultAmount: dto.defaultAmount || dto.minAmount,
      amountIncrement: dto.amountIncrement || 1000,
      minTenureMonths: dto.minTenureMonths,
      maxTenureMonths: dto.maxTenureMonths,
      allowedTenures: dto.allowedTenures || [dto.minTenureMonths, dto.maxTenureMonths],
      interestModel: dto.interestModel || 'REDUCING_BALANCE',
      baseInterestRateAnnualPct: dto.baseInterestRateAnnualPct,
      mclrSpreadAnnualPct: dto.mclrSpreadAnnualPct || 0,
      feeSchedule: dto.feeSchedule,
      eligibility: dto.eligibility,
      documents: dto.documents || [
        { category: 'IDENTITY', documentType: 'PAN', mandatory: true, description: 'PAN Card' },
        { category: 'IDENTITY', documentType: 'AADHAAR', mandatory: true, description: 'Aadhaar Card' },
      ],
      creditPolicy: dto.creditPolicy,
      riskPolicy: dto.riskPolicy,
      approvalConfig: dto.approvalConfig,
      workflowId: dto.workflowId || `wf-orig-standard-${tenantId.replace('tenant-', '')}`,
      allowedChannels: dto.allowedChannels || ['DIRECT_BORROWER', 'LOAN_OFFICER', 'BRANCH'],
      createdAt: now,
      updatedAt: now,
    };

    this.products.set(`${tenantId}:${id}`, product);
    this.historicalSnapshots.set(`${tenantId}:${id}:v1`, { ...product });

    // Sync to Prisma database safely
    try {
      await prisma.loanProduct.create({
        data: {
          id: product.id,
          code: product.code,
          name: product.name,
          productType: product.productType,
          tenantId: product.tenantId,
          minAmount: product.minAmount,
          maxAmount: product.maxAmount,
          minTenureMonths: product.minTenureMonths,
          maxTenureMonths: product.maxTenureMonths,
          interestRate: product.baseInterestRateAnnualPct.toFixed(3),
          interestMethod: product.interestModel === 'FIXED_FLAT' ? 'FLAT' : 'REDUCING',
          processingFeePct: (product.feeSchedule.processingFeePct || 0).toFixed(3),
          lateFeePct: (product.feeSchedule.latePaymentPenaltyMonthlyPct || 0).toFixed(3),
          gracePeriodDays: product.feeSchedule.gracePeriodDays || 0,
          eligibilityRules: {
            eligibility: product.eligibility,
            documents: product.documents,
            creditPolicy: product.creditPolicy,
            riskPolicy: product.riskPolicy,
            feeSchedule: product.feeSchedule,
            status: product.status,
            version: product.version,
            workflowId: product.workflowId,
          } as any,
          isActive: false, // DRAFT is inactive initially
        },
      });
    } catch {
      // Ignore transient db constraints if in memory dev mode
    }

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: 'PRODUCT_CREATED',
      entity: 'LoanProduct',
      entityId: product.id,
      newValue: { code: product.code, name: product.name, status: product.status, version: 1 },
    });

    return product;
  }

  public async updateProductWithVersioning(
    tenantId: string,
    id: string,
    dto: UpdateProductDto,
    actor?: ProductActorContext
  ): Promise<LendingProduct> {
    const existing = this.getProductById(tenantId, id);
    const now = new Date().toISOString();

    const isDraft = existing.status === 'DRAFT';
    const newVersion = isDraft ? existing.version : existing.version + 1;

    const updated: LendingProduct = {
      ...existing,
      ...dto,
      feeSchedule: dto.feeSchedule ? { ...existing.feeSchedule, ...dto.feeSchedule } : existing.feeSchedule,
      eligibility: dto.eligibility ? { ...existing.eligibility, ...dto.eligibility } : existing.eligibility,
      documents: dto.documents || existing.documents,
      creditPolicy: dto.creditPolicy ? { ...existing.creditPolicy, ...dto.creditPolicy } : existing.creditPolicy,
      riskPolicy: dto.riskPolicy ? { ...existing.riskPolicy, ...dto.riskPolicy } : existing.riskPolicy,
      approvalConfig: dto.approvalConfig ? { ...existing.approvalConfig, ...dto.approvalConfig } : existing.approvalConfig,
      allowedChannels: dto.allowedChannels || existing.allowedChannels,
      workflowId: dto.workflowId || existing.workflowId,
      version: newVersion,
      updatedAt: now,
    };

    this.products.set(`${tenantId}:${id}`, updated);
    this.historicalSnapshots.set(`${tenantId}:${id}:v${newVersion}`, { ...updated });

    // Sync to Prisma DB
    try {
      await prisma.loanProduct.updateMany({
        where: { id, tenantId },
        data: {
          name: updated.name,
          minAmount: updated.minAmount,
          maxAmount: updated.maxAmount,
          minTenureMonths: updated.minTenureMonths,
          maxTenureMonths: updated.maxTenureMonths,
          interestRate: updated.baseInterestRateAnnualPct.toFixed(3),
          interestMethod: updated.interestModel === 'FIXED_FLAT' ? 'FLAT' : 'REDUCING',
          processingFeePct: (updated.feeSchedule.processingFeePct || 0).toFixed(3),
          lateFeePct: (updated.feeSchedule.latePaymentPenaltyMonthlyPct || 0).toFixed(3),
          gracePeriodDays: updated.feeSchedule.gracePeriodDays || 0,
          eligibilityRules: {
            eligibility: updated.eligibility,
            documents: updated.documents,
            creditPolicy: updated.creditPolicy,
            riskPolicy: updated.riskPolicy,
            feeSchedule: updated.feeSchedule,
            status: updated.status,
            version: updated.version,
            workflowId: updated.workflowId,
          } as any,
          isActive: updated.status === 'ACTIVE',
        },
      });
    } catch {
      // safe fallback
    }

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: isDraft ? 'PRODUCT_UPDATED' : 'PRODUCT_CONFIGURATION_VERSIONED',
      entity: 'LoanProduct',
      entityId: id,
      previousValue: { version: existing.version, status: existing.status },
      newValue: { version: newVersion, status: updated.status, changes: Object.keys(dto) },
    });

    return updated;
  }

  public async activateProduct(
    tenantId: string,
    id: string,
    actor?: ProductActorContext
  ): Promise<LendingProduct> {
    const product = this.getProductById(tenantId, id);

    // Validation Rules for Product Activation
    const validationErrors: string[] = [];

    if (!product.name || product.name.trim().length < 3) {
      validationErrors.push('Product name must be at least 3 characters.');
    }
    if (!product.code || product.code.trim().length < 2) {
      validationErrors.push('Product code must be specified.');
    }
    if (product.minAmount <= 0 || product.maxAmount <= 0 || product.minAmount > product.maxAmount) {
      validationErrors.push('Valid minimum and maximum loan amounts must be configured (min <= max).');
    }
    if (product.minTenureMonths <= 0 || product.maxTenureMonths <= 0 || product.minTenureMonths > product.maxTenureMonths) {
      validationErrors.push('Valid tenure range in months must be configured (min <= max).');
    }
    if (product.baseInterestRateAnnualPct == null || product.baseInterestRateAnnualPct < 0) {
      validationErrors.push('Annual base interest rate must be specified.');
    }
    if (!product.feeSchedule) {
      validationErrors.push('Fee schedule configuration is missing.');
    }
    if (!product.eligibility || product.eligibility.minMonthlyIncome <= 0) {
      validationErrors.push('Eligibility configuration must define minimum applicant monthly income.');
    }
    if (!product.documents || product.documents.filter((d) => d.mandatory).length === 0) {
      validationErrors.push('At least one mandatory KYC/income document requirement must be assigned.');
    }
    if (!product.creditPolicy || product.creditPolicy.minCibilScore < 300) {
      validationErrors.push('Credit policy with valid minimum bureau score must be specified.');
    }

    if (validationErrors.length > 0) {
      throw new BadRequestError(`Product activation failed validation: ${validationErrors.join(' | ')}`);
    }

    const updated: LendingProduct = {
      ...product,
      status: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    };

    this.products.set(`${tenantId}:${id}`, updated);
    this.historicalSnapshots.set(`${tenantId}:${id}:v${updated.version}`, { ...updated });

    try {
      await prisma.loanProduct.updateMany({
        where: { id, tenantId },
        data: { isActive: true },
      });
    } catch {
      // safe fallback
    }

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: 'PRODUCT_ACTIVATED',
      entity: 'LoanProduct',
      entityId: id,
      previousValue: { status: product.status },
      newValue: { status: 'ACTIVE', version: updated.version },
    });

    return updated;
  }

  public async deactivateProduct(
    tenantId: string,
    id: string,
    actor?: ProductActorContext
  ): Promise<LendingProduct> {
    const product = this.getProductById(tenantId, id);

    const updated: LendingProduct = {
      ...product,
      status: 'INACTIVE',
      updatedAt: new Date().toISOString(),
    };

    this.products.set(`${tenantId}:${id}`, updated);
    this.historicalSnapshots.set(`${tenantId}:${id}:v${updated.version}`, { ...updated });

    try {
      await prisma.loanProduct.updateMany({
        where: { id, tenantId },
        data: { isActive: false },
      });
    } catch {
      // safe fallback
    }

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: 'PRODUCT_DEACTIVATED',
      entity: 'LoanProduct',
      entityId: id,
      previousValue: { status: product.status },
      newValue: { status: 'INACTIVE' },
    });

    return updated;
  }

  public async archiveProduct(
    tenantId: string,
    id: string,
    actor?: ProductActorContext
  ): Promise<LendingProduct> {
    const product = this.getProductById(tenantId, id);

    const updated: LendingProduct = {
      ...product,
      status: 'ARCHIVED',
      updatedAt: new Date().toISOString(),
    };

    this.products.set(`${tenantId}:${id}`, updated);
    this.historicalSnapshots.set(`${tenantId}:${id}:v${updated.version}`, { ...updated });

    try {
      await prisma.loanProduct.updateMany({
        where: { id, tenantId },
        data: { isActive: false },
      });
    } catch {
      // safe fallback
    }

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: 'PRODUCT_ARCHIVED',
      entity: 'LoanProduct',
      entityId: id,
      previousValue: { status: product.status },
      newValue: { status: 'ARCHIVED' },
    });

    return updated;
  }

  public getHistoricalSnapshot(
    tenantId: string,
    productId: string,
    version: number
  ): LendingProduct {
    const snapshot = this.historicalSnapshots.get(`${tenantId}:${productId}:v${version}`);
    if (!snapshot) {
      return this.getProductById(tenantId, productId);
    }
    return snapshot;
  }

  /**
   * Simulates full loan pricing, statutory APR, monthly EMI, and Key Fact Statement (KFS)
   * under RBI regulatory guidelines.
   */
  public simulateProductPricing(
    tenantId: string,
    input: ProductPricingSimulationInput
  ): ProductPricingSimulationResult {
    const product = this.getProductById(tenantId, input.productId);

    // Bounds checking
    const amount = Math.min(Math.max(input.loanAmount, product.minAmount), product.maxAmount);
    const tenure = Math.min(Math.max(input.tenureMonths, product.minTenureMonths), product.maxTenureMonths);

    const annualRate = product.baseInterestRateAnnualPct + (product.mclrSpreadAnnualPct || 0);
    const monthlyRate = annualRate / 12 / 100;

    // Monthly EMI Calculation
    let monthlyEmi = 0;
    let totalInterest = 0;

    if (product.interestModel === 'FIXED_FLAT') {
      totalInterest = (amount * annualRate * (tenure / 12)) / 100;
      monthlyEmi = (amount + totalInterest) / tenure;
    } else {
      // Standard Reducing Balance Annuity: P * r * (1+r)^n / ((1+r)^n - 1)
      if (monthlyRate === 0) {
        monthlyEmi = amount / tenure;
      } else {
        const factor = Math.pow(1 + monthlyRate, tenure);
        monthlyEmi = (amount * monthlyRate * factor) / (factor - 1);
      }
      totalInterest = monthlyEmi * tenure - amount;
    }

    // Fee breakdown
    const processingFeeCalc = (amount * product.feeSchedule.processingFeePct) / 100;
    const processingFee = Math.max(processingFeeCalc, product.feeSchedule.processingFeeMinInr);
    const documentationCharges = product.feeSchedule.documentationChargesInr;
    const platformFee = product.feeSchedule.platformFeeInr || 0;
    const totalFeesBeforeTax = processingFee + documentationCharges + platformFee;
    const gstOnFees = totalFeesBeforeTax * 0.18; // 18% GST under Indian tax rules
    const totalFees = Math.round(totalFeesBeforeTax + gstOnFees);

    const netDisbursedAmount = Math.round(amount - totalFees);
    const totalRepaymentAmount = Math.round(monthlyEmi * tenure);

    // Statutory Annual Percentage Rate (APR) approximation
    const monthlyNetDisbursed = netDisbursedAmount;
    let apr = annualRate;
    if (monthlyNetDisbursed > 0) {
      let r = monthlyRate;
      for (let i = 0; i < 20; i++) {
        let f = -monthlyNetDisbursed;
        let fPrime = 0;
        for (let t = 1; t <= tenure; t++) {
          const discount = Math.pow(1 + r, -t);
          f += monthlyEmi * discount;
          fPrime -= t * monthlyEmi * Math.pow(1 + r, -t - 1);
        }
        if (Math.abs(f) < 0.001 || fPrime === 0) break;
        r = r - f / fPrime;
      }
      apr = +(r * 12 * 100).toFixed(2);
    }

    // Key Fact Statement (KFS)
    const keyFactStatement: KeyFactStatement = {
      sanctionAmount: amount,
      rateOfInterestType: product.interestModel === 'FIXED_FLAT' ? 'Fixed Flat Rate' : 'Reducing Balance Rate',
      rateOfInterestPct: annualRate,
      tenureMonths: tenure,
      installmentAmount: Math.round(monthlyEmi),
      totalPayableAmount: totalRepaymentAmount,
      processingFeeWithGst: Math.round(processingFee * 1.18),
      documentationFee: documentationCharges,
      foreclosureCharges: `${product.feeSchedule.foreclosurePenaltyPct}% before ${product.feeSchedule.lockInMonths} months lock-in`,
      overdueCharges: `${product.feeSchedule.latePaymentPenaltyMonthlyPct}% monthly on overdue EMI after ${product.feeSchedule.gracePeriodDays} days grace`,
      coolingOffPeriodDays: 3,
    };

    // Eligibility check
    const reasons: string[] = [];
    let eligible = true;
    let computedFoirPct: number | undefined;

    if (input.applicantProfile) {
      const { cibilScore, monthlyIncome, existingEmis } = input.applicantProfile;
      if (cibilScore != null && cibilScore < product.creditPolicy.minCibilScore) {
        eligible = false;
        reasons.push(
          `CIBIL bureau score ${cibilScore} is below minimum requirement of ${product.creditPolicy.minCibilScore}`
        );
      }
      if (monthlyIncome != null) {
        if (monthlyIncome < product.eligibility.minMonthlyIncome) {
          eligible = false;
          reasons.push(
            `Monthly income ₹${monthlyIncome.toLocaleString('en-IN')} is below requirement of ₹${product.eligibility.minMonthlyIncome.toLocaleString('en-IN')}`
          );
        }
        const totalObligations = (existingEmis || 0) + monthlyEmi;
        computedFoirPct = +((totalObligations / monthlyIncome) * 100).toFixed(1);
        if (computedFoirPct > product.creditPolicy.maxFoirPct) {
          eligible = false;
          reasons.push(
            `Projected FOIR of ${computedFoirPct}% exceeds maximum policy cap of ${product.creditPolicy.maxFoirPct}%`
          );
        }
      }
    }

    return {
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      version: product.version,
      loanAmount: amount,
      tenureMonths: tenure,
      interestModel: product.interestModel,
      appliedInterestRateAnnualPct: annualRate,
      monthlyEmi: Math.round(monthlyEmi),
      totalInterest: Math.round(totalInterest),
      processingFee: Math.round(processingFee),
      documentationCharges,
      totalFees,
      netDisbursedAmount,
      totalRepaymentAmount,
      annualPercentageRateApr: apr,
      keyFactStatement,
      eligibilityCheck: {
        eligible,
        reasons,
        computedFoirPct,
      },
    };
  }
}

export const productEngineService = ProductEngineService.getInstance();
