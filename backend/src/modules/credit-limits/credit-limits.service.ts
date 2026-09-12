/**
 * Adyapan Lending OS — Phase 5: Credit Limit Engine Core Service
 */

import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { Money } from '../finance/money';
import { calculateEmi } from '../finance/emi';
import { logAudit } from '../audit/audit.service';
import { sendNotification } from '../notifications/notification.service';
import { offerEngineService } from '../offers/offers.service';
import { productEngineService } from '../product/product-engine.service';
import { RiskGrade } from '../bre/decision-engine.types';
import {
  CreditFacility,
  CreditLimitPolicy,
  CreditFacilityTransaction,
  Drawdown,
  LimitAdjustmentRecord,
  CustomerExposureSummary,
  CreateCreditLimitPolicyDto,
  RequestDrawdownDto,
  LimitAdjustmentDto,
  CreditLimitSimulationInput,
  CreditLimitSimulationResult,
  CreditActorContext,
  FacilityType,
  CreditFacilityStatus,
  DrawdownStatus,
} from './credit-limits.types';

function toNum(val: number | Decimal | string): number {
  return Money.round(val).toNumber();
}

function matchesTenant(entityTenantId?: string | null, actorTenantId?: string | null): boolean {
  if (!entityTenantId || !actorTenantId) return true;
  if (entityTenantId === actorTenantId) return true;
  const aliases = ['tenant-adyapan-default', 'cl_tenant_apex_001'];
  return aliases.includes(entityTenantId) && aliases.includes(actorTenantId);
}

export class CreditLimitsService {
  private static instance: CreditLimitsService;

  // In-memory persistent stores with seeded defaults
  private policies: Map<string, CreditLimitPolicy> = new Map();
  private facilities: Map<string, CreditFacility> = new Map();
  private drawdowns: Map<string, Drawdown> = new Map();
  private transactions: Map<string, CreditFacilityTransaction> = new Map();
  private adjustments: Map<string, LimitAdjustmentRecord> = new Map();

  private facilityCounter = 100;
  private drawdownCounter = 200;
  private txCounter = 500;
  private adjCounter = 50;

  private constructor() {
    this.seedDefaultPolicies();
    this.seedDemoFacilities();
  }

  public static getInstance(): CreditLimitsService {
    if (!CreditLimitsService.instance) {
      CreditLimitsService.instance = new CreditLimitsService();
    }
    return CreditLimitsService.instance;
  }

  // ---------------------------------------------------------------------------
  // 1. SEEDING DEFAULT POLICIES & FACILITIES
  // ---------------------------------------------------------------------------

  private seedDefaultPolicies(): void {
    const defaultPolicy: CreditLimitPolicy = {
      id: 'pol-limit-default',
      tenantId: 'tenant-adyapan-default',
      code: 'POL-LIMIT-GEN-001',
      name: 'Standard Revolving Credit & Exposure Policy',
      description: 'Default institutional credit line and customer exposure bounds under M2P-Grade framework',
      version: 1,
      status: 'ACTIVE',
      maxCustomerExposure: 1000000, // ₹10,00,000 max total exposure
      maxActiveFacilitiesPerCustomer: 3,
      maxConcurrentDrawdowns: 5,
      riskLimitCaps: [
        { riskGrade: 'A', maxLimitCap: 500000, allowRevolving: true, minCibilScore: 750 },
        { riskGrade: 'B', maxLimitCap: 300000, allowRevolving: true, minCibilScore: 700 },
        { riskGrade: 'C', maxLimitCap: 150000, allowRevolving: true, minCibilScore: 650 },
        { riskGrade: 'D', maxLimitCap: 50000, allowRevolving: true, minCibilScore: 600 },
        { riskGrade: 'E', maxLimitCap: 0, allowRevolving: false, minCibilScore: 0 },
      ],
      minDrawdownAmount: 1000,
      maxDrawdownAmount: 500000,
      drawdownFeePct: 0.5, // 0.5% drawdown platform fee
      drawdownFeeMinInr: 100,
      gstRatePct: 18.0,
      repaymentRestoresLimit: true,
      excessExposurePolicy: 'BLOCK_DRAWDOWN',
      validityMonths: 24,
      effectiveFrom: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.policies.set(defaultPolicy.id, defaultPolicy);
  }

  private seedDemoFacilities(): void {
    const demoFacility: CreditFacility = {
      id: 'fac-revolving-001',
      facilityNo: 'FAC-2026-0001',
      tenantId: 'tenant-adyapan-default',
      branchId: 'branch-south-01',
      customerId: 'cust-demo-001',
      customerName: 'Aarav Sharma',
      customerCode: 'CUST-2026-001',
      customerEmail: 'aarav.sharma@example.com',
      customerMobile: '+91 98765 43210',
      productId: 'prod-credit-line-001',
      productCode: 'PRD-CL-001',
      productName: 'Flexi Revolving Credit Line',
      productVersion: 1,
      facilityType: 'REVOLVING_CREDIT',
      approvedLimit: 200000,
      currentLimit: 200000,
      utilizedAmount: 60000,
      availableAmount: 140000,
      excessExposure: 0,
      status: 'ACTIVE',
      riskGrade: 'A',
      riskScore: 82,
      policyId: 'pol-limit-default',
      policyVersion: 1,
      limitVersion: 1,
      minDrawdownAmount: 1000,
      maxDrawdownAmount: 140000,
      annualInterestRatePct: 14.5,
      effectiveFrom: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 700 * 24 * 3600 * 1000).toISOString(),
      isExpired: false,
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.facilities.set(demoFacility.id, demoFacility);

    // Initial assignment transaction
    const tx1: CreditFacilityTransaction = {
      id: 'tx-fac-001',
      facilityId: demoFacility.id,
      facilityNo: demoFacility.facilityNo,
      tenantId: demoFacility.tenantId,
      type: 'LIMIT_ASSIGNED',
      amount: 200000,
      previousApprovedLimit: 0,
      newApprovedLimit: 200000,
      previousUtilized: 0,
      newUtilized: 0,
      previousAvailable: 0,
      newAvailable: 200000,
      description: 'Initial revolving credit line sanctioned and activated',
      actorEmail: 'system@adyapan.internal',
      actorRole: 'UNDERWRITER',
      createdAt: demoFacility.createdAt,
    };
    this.transactions.set(tx1.id, tx1);

    // Initial drawdown
    const dd1: Drawdown = {
      id: 'dd-2026-0001',
      drawdownNo: 'DD-2026-0001',
      facilityId: demoFacility.id,
      facilityNo: demoFacility.facilityNo,
      tenantId: demoFacility.tenantId,
      branchId: demoFacility.branchId,
      customerId: demoFacility.customerId,
      customerName: demoFacility.customerName,
      productId: demoFacility.productId,
      productCode: demoFacility.productCode,
      productName: demoFacility.productName,
      requestedAmount: 60000,
      feeAmount: 300,
      feeGst: 54,
      totalDeductions: 354,
      netDisbursedAmount: 59646,
      tenureMonths: 12,
      interestRatePct: 14.5,
      monthlyEmi: 5402.15,
      totalInterest: 4825.80,
      totalRepayment: 64825.80,
      status: 'DISBURSED',
      purpose: 'Home equipment and renovations',
      requestedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      approvedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      approvedBy: 'underwriter@adyapan.internal',
      disbursedAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.drawdowns.set(dd1.id, dd1);

    const tx2: CreditFacilityTransaction = {
      id: 'tx-fac-002',
      facilityId: demoFacility.id,
      facilityNo: demoFacility.facilityNo,
      tenantId: demoFacility.tenantId,
      type: 'DRAWDOWN',
      amount: 60000,
      previousApprovedLimit: 200000,
      newApprovedLimit: 200000,
      previousUtilized: 0,
      newUtilized: 60000,
      previousAvailable: 200000,
      newAvailable: 140000,
      drawdownId: dd1.id,
      reference: dd1.drawdownNo,
      description: `Drawdown #${dd1.drawdownNo} of ₹60,000 disbursed`,
      actorEmail: 'aarav.sharma@example.com',
      actorRole: 'CUSTOMER',
      createdAt: dd1.createdAt,
    };
    this.transactions.set(tx2.id, tx2);
  }

  // ---------------------------------------------------------------------------
  // 2. CREDIT LIMIT POLICIES
  // ---------------------------------------------------------------------------

  public listPolicies(tenantId?: string, actor?: CreditActorContext): CreditLimitPolicy[] {
    let result = Array.from(this.policies.values());
    if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
      const effectiveTenant = actor.tenantId || tenantId;
      if (effectiveTenant) {
        result = result.filter((p) => matchesTenant(p.tenantId, effectiveTenant));
      }
    } else if (tenantId) {
      result = result.filter((p) => matchesTenant(p.tenantId, tenantId));
    }
    return result;
  }

  public getPolicy(id: string, actor?: CreditActorContext): CreditLimitPolicy {
    const policy = this.policies.get(id);
    if (!policy) throw new NotFoundError(`Credit Limit Policy with ID ${id} not found`);
    if (actor && !actor.roles?.includes('SUPER_ADMIN') && actor.tenantId) {
      if (!matchesTenant(policy.tenantId, actor.tenantId)) {
        throw new ForbiddenError('Access forbidden: Policy belongs to another institution');
      }
    }
    return policy;
  }

  public createPolicy(dto: CreateCreditLimitPolicyDto, actor?: CreditActorContext): CreditLimitPolicy {
    const tenantId = actor?.tenantId || 'tenant-adyapan-default';
    const policyId = `pol-limit-${Date.now()}`;
    const newPolicy: CreditLimitPolicy = {
      id: policyId,
      tenantId,
      productId: dto.productId,
      productCode: dto.productCode,
      code: dto.code || `POL-LIMIT-${Date.now()}`,
      name: dto.name,
      description: dto.description,
      version: 1,
      status: 'ACTIVE',
      maxCustomerExposure: dto.maxCustomerExposure || 1000000,
      maxActiveFacilitiesPerCustomer: dto.maxActiveFacilitiesPerCustomer ?? 2,
      maxConcurrentDrawdowns: dto.maxConcurrentDrawdowns ?? 5,
      riskLimitCaps: dto.riskLimitCaps || [
        { riskGrade: 'A', maxLimitCap: 500000, allowRevolving: true, minCibilScore: 750 },
        { riskGrade: 'B', maxLimitCap: 300000, allowRevolving: true, minCibilScore: 700 },
        { riskGrade: 'C', maxLimitCap: 150000, allowRevolving: true, minCibilScore: 650 },
        { riskGrade: 'D', maxLimitCap: 50000, allowRevolving: true, minCibilScore: 600 },
        { riskGrade: 'E', maxLimitCap: 0, allowRevolving: false, minCibilScore: 0 },
      ],
      minDrawdownAmount: dto.minDrawdownAmount ?? 1000,
      maxDrawdownAmount: dto.maxDrawdownAmount,
      drawdownFeePct: dto.drawdownFeePct ?? 0.5,
      drawdownFeeMinInr: dto.drawdownFeeMinInr ?? 100,
      gstRatePct: dto.gstRatePct ?? 18.0,
      repaymentRestoresLimit: dto.repaymentRestoresLimit ?? true,
      excessExposurePolicy: dto.excessExposurePolicy || 'BLOCK_DRAWDOWN',
      validityMonths: dto.validityMonths ?? 24,
      effectiveFrom: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.policies.set(newPolicy.id, newPolicy);

    void logAudit({
      userId: actor?.id,
      action: 'CREDIT_LIMIT_POLICY_CREATED',
      entity: 'CreditLimitPolicy',
      entityId: newPolicy.id,
      newValue: newPolicy,
    }).catch(() => {});

    return newPolicy;
  }

  public resolvePolicy(tenantId?: string, productId?: string): CreditLimitPolicy {
    const list = Array.from(this.policies.values()).filter((p) => p.status === 'ACTIVE');
    if (productId) {
      const prodMatch = list.find((p) => p.productId === productId && matchesTenant(p.tenantId, tenantId));
      if (prodMatch) return prodMatch;
    }
    const tenantMatch = list.find((p) => matchesTenant(p.tenantId, tenantId));
    if (tenantMatch) return tenantMatch;

    return list[0] || this.policies.get('pol-limit-default')!;
  }

  // ---------------------------------------------------------------------------
  // 3. CREDIT FACILITY LIFECYCLE & RETRIEVAL
  // ---------------------------------------------------------------------------

  public listFacilities(
    params?: { search?: string; status?: string; customerId?: string },
    actor?: CreditActorContext
  ): CreditFacility[] {
    let list = Array.from(this.facilities.values());

    if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
      if (actor.roles?.includes('CUSTOMER')) {
        list = list.filter((f) => f.customerId === actor.id || f.customerEmail === actor.email);
      } else {
        if (actor.tenantId) {
          list = list.filter((f) => matchesTenant(f.tenantId, actor.tenantId));
        }
        if (actor.branchId && (actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER'))) {
          list = list.filter((f) => !f.branchId || f.branchId === actor.branchId);
        }
      }
    }

    if (params?.status) {
      list = list.filter((f) => f.status === params.status);
    }
    if (params?.customerId) {
      list = list.filter((f) => f.customerId === params.customerId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (f) =>
          f.facilityNo.toLowerCase().includes(q) ||
          f.customerName.toLowerCase().includes(q) ||
          f.customerCode.toLowerCase().includes(q) ||
          f.productName.toLowerCase().includes(q)
      );
    }

    return list.map((f) => this.enrichFacility(f));
  }

  public getFacility(id: string, actor?: CreditActorContext): CreditFacility {
    const facility = this.facilities.get(id);
    if (!facility) throw new NotFoundError(`Credit Facility #${id} not found`);

    if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
      if (actor.roles?.includes('CUSTOMER')) {
        if (facility.customerId !== actor.id && facility.customerEmail !== actor.email) {
          throw new ForbiddenError('Access forbidden: You cannot view another borrower’s credit facility');
        }
      } else {
        if (actor.tenantId && !matchesTenant(facility.tenantId, actor.tenantId)) {
          throw new ForbiddenError('Access forbidden: Facility belongs to another institution');
        }
        if (
          actor.branchId &&
          (actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) &&
          facility.branchId &&
          facility.branchId !== actor.branchId
        ) {
          throw new ForbiddenError('Access forbidden: Facility belongs to a different branch');
        }
      }
    }

    return this.enrichFacility(facility);
  }

  private enrichFacility(f: CreditFacility): CreditFacility {
    const facilityDrawdowns = Array.from(this.drawdowns.values()).filter((d) => d.facilityId === f.id);
    const facilityTxs = Array.from(this.transactions.values())
      .filter((t) => t.facilityId === f.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const facilityAdjustments = Array.from(this.adjustments.values())
      .filter((a) => a.facilityId === f.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const isExpired = new Date(f.expiresAt).getTime() < Date.now();

    return {
      ...f,
      isExpired,
      status: isExpired && f.status === 'ACTIVE' ? 'EXPIRED' : f.status,
      drawdowns: facilityDrawdowns,
      transactions: facilityTxs,
      adjustments: facilityAdjustments,
    };
  }

  // ---------------------------------------------------------------------------
  // 4. CREATING / ACTIVATING FACILITY FROM ACCEPTED OFFER
  // ---------------------------------------------------------------------------

  public createFacilityFromOffer(offerId: string, actor?: CreditActorContext): CreditFacility {
    const tenantId = actor?.tenantId || 'tenant-adyapan-default';
    const offer = offerEngineService.getOfferById(tenantId, offerId);
    if (offer.status !== 'ACCEPTED') {
      throw new BadRequestError(`Cannot activate credit facility: Offer #${offer.offerNo} is in ${offer.status} status. It must be ACCEPTED first.`);
    }

    const existing = Array.from(this.facilities.values()).find((f) => f.offerId === offer.id);
    if (existing) {
      return this.enrichFacility(existing);
    }

    const policy = this.resolvePolicy(offer.tenantId, offer.productId);
    this.facilityCounter += 1;
    const facilityNo = `FAC-2026-${String(this.facilityCounter).padStart(4, '0')}`;
    const facilityId = `fac-${Date.now()}`;

    const effectiveFrom = new Date().toISOString();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + policy.validityMonths);
    const expiresAt = expiryDate.toISOString();

    const newFacility: CreditFacility = {
      id: facilityId,
      facilityNo,
      tenantId: offer.tenantId,
      branchId: offer.branchId,
      customerId: offer.customerId,
      customerName: offer.customerName,
      customerCode: `CUST-${offer.customerId.substring(0, 8)}`,
      customerEmail: offer.customerEmail,
      customerMobile: offer.customerMobile,
      productId: offer.productId,
      productCode: offer.productCode,
      productName: offer.productName,
      productVersion: offer.productVersion,
      facilityType: 'REVOLVING_CREDIT',
      approvedLimit: offer.offeredAmount,
      currentLimit: offer.offeredAmount,
      utilizedAmount: 0,
      availableAmount: offer.offeredAmount,
      excessExposure: 0,
      status: 'ACTIVE',
      riskGrade: offer.riskGrade,
      riskScore: offer.riskScore,
      decisionId: offer.decisionId,
      decisionVersion: offer.decisionVersion,
      approvalTaskId: offer.approvalTaskId,
      approvalPolicyVersion: offer.approvalPolicyVersion,
      offerId: offer.id,
      offerVersion: offer.version,
      policyId: policy.id,
      policyVersion: policy.version,
      limitVersion: 1,
      minDrawdownAmount: policy.minDrawdownAmount,
      maxDrawdownAmount: offer.offeredAmount,
      annualInterestRatePct: offer.annualInterestRatePct,
      effectiveFrom,
      expiresAt,
      isExpired: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.facilities.set(newFacility.id, newFacility);

    this.txCounter += 1;
    const tx: CreditFacilityTransaction = {
      id: `tx-fac-${this.txCounter}`,
      facilityId: newFacility.id,
      facilityNo: newFacility.facilityNo,
      tenantId: newFacility.tenantId,
      type: 'LIMIT_ASSIGNED',
      amount: newFacility.approvedLimit,
      previousApprovedLimit: 0,
      newApprovedLimit: newFacility.approvedLimit,
      previousUtilized: 0,
      newUtilized: 0,
      previousAvailable: 0,
      newAvailable: newFacility.approvedLimit,
      description: `Credit Facility activated for ₹${newFacility.approvedLimit.toLocaleString('en-IN')} via Offer #${offer.offerNo}`,
      actorId: actor?.id,
      actorEmail: actor?.email || 'system@adyapan.internal',
      actorRole: actor?.roles?.[0] || 'SYSTEM',
      createdAt: new Date().toISOString(),
    };
    this.transactions.set(tx.id, tx);

    void logAudit({
      userId: actor?.id,
      action: 'CREDIT_FACILITY_ACTIVATED',
      entity: 'CreditFacility',
      entityId: newFacility.id,
      newValue: newFacility,
    }).catch(() => {});

    return this.enrichFacility(newFacility);
  }

  // ---------------------------------------------------------------------------
  // 5. CUSTOMER TOTAL EXPOSURE CALCULATION
  // ---------------------------------------------------------------------------

  public async getCustomerExposure(customerId: string, actor?: CreditActorContext): Promise<CustomerExposureSummary> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        loans: {
          where: { status: { in: ['ACTIVE', 'OVERDUE', 'RESTRUCTURED'] } },
        },
      },
    });

    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Valued Borrower';
    const customerCode = customer?.customerCode || `CUST-${customerId.substring(0, 8)}`;
    const tenantId = customer?.tenantId || actor?.tenantId || 'tenant-adyapan-default';

    let termLoansOutstanding = new Decimal(0);
    if (customer?.loans) {
      for (const loan of customer.loans) {
        termLoansOutstanding = termLoansOutstanding.plus(new Decimal(loan.outstandingPrincipal));
      }
    }

    const customerFacilities = Array.from(this.facilities.values()).filter(
      (f) => f.customerId === customerId && f.status !== 'CANCELLED' && f.status !== 'CLOSED'
    );

    let creditLinesSanctioned = new Decimal(0);
    let creditLinesUtilized = new Decimal(0);
    let creditLinesAvailable = new Decimal(0);

    const facilitiesSummary = customerFacilities.map((f) => {
      creditLinesSanctioned = creditLinesSanctioned.plus(new Decimal(f.approvedLimit));
      creditLinesUtilized = creditLinesUtilized.plus(new Decimal(f.utilizedAmount));
      creditLinesAvailable = creditLinesAvailable.plus(new Decimal(f.availableAmount));
      return {
        facilityId: f.id,
        facilityNo: f.facilityNo,
        productName: f.productName,
        facilityType: f.facilityType,
        approvedLimit: f.approvedLimit,
        utilizedAmount: f.utilizedAmount,
        availableAmount: f.availableAmount,
        status: f.status,
      };
    });

    const totalExposure = termLoansOutstanding.plus(creditLinesUtilized);
    const policy = this.resolvePolicy(tenantId);
    const maxExposureCap = new Decimal(policy.maxCustomerExposure);
    const remainingExposureCapacity = Decimal.max(0, maxExposureCap.minus(totalExposure));
    const utilizationPct = maxExposureCap.isZero()
      ? 0
      : Math.round(totalExposure.dividedBy(maxExposureCap).times(100).toNumber());

    return {
      customerId,
      customerName,
      customerCode,
      tenantId,
      termLoansOutstanding: toNum(termLoansOutstanding),
      activeFacilitiesCount: customerFacilities.length,
      creditLinesSanctioned: toNum(creditLinesSanctioned),
      creditLinesUtilized: toNum(creditLinesUtilized),
      creditLinesAvailable: toNum(creditLinesAvailable),
      totalExposure: toNum(totalExposure),
      maxExposureCap: toNum(maxExposureCap),
      remainingExposureCapacity: toNum(remainingExposureCapacity),
      utilizationPct,
      facilities: facilitiesSummary,
    };
  }

  // ---------------------------------------------------------------------------
  // 6. DRAWDOWN ENGINE
  // ---------------------------------------------------------------------------

  public async requestDrawdown(
    facilityId: string,
    dto: RequestDrawdownDto,
    actor?: CreditActorContext
  ): Promise<Drawdown> {
    const facility = this.facilities.get(facilityId);
    if (!facility) throw new NotFoundError(`Credit Facility #${facilityId} not found`);

    if (facility.status !== 'ACTIVE') {
      throw new BadRequestError(`Drawdown blocked: Credit facility #${facility.facilityNo} is in ${facility.status} status. Drawdowns are only allowed on ACTIVE facilities.`);
    }

    if (new Date(facility.expiresAt).getTime() < Date.now()) {
      facility.status = 'EXPIRED';
      throw new BadRequestError(`Drawdown blocked: Credit facility #${facility.facilityNo} has expired on ${new Date(facility.expiresAt).toLocaleDateString()}.`);
    }

    const rawAmount = dto.amount ?? dto.requestedAmount ?? 0;
    const requested = new Decimal(rawAmount);
    if (requested.lessThanOrEqualTo(0)) {
      throw new BadRequestError('Drawdown amount must be strictly greater than 0');
    }

    if (requested.lessThan(facility.minDrawdownAmount)) {
      throw new BadRequestError(`Drawdown amount ₹${rawAmount.toLocaleString('en-IN')} is below the minimum allowed drawdown of ₹${facility.minDrawdownAmount.toLocaleString('en-IN')}`);
    }

    const currentAvailable = new Decimal(facility.availableAmount);
    if (requested.greaterThan(currentAvailable)) {
      throw new BadRequestError(`Requested amount ₹${rawAmount.toLocaleString('en-IN')} exceeds available credit limit of ₹${currentAvailable.toNumber().toLocaleString('en-IN')}`);
    }

    const exposure = await this.getCustomerExposure(facility.customerId, actor);
    if (exposure.remainingExposureCapacity < rawAmount) {
      throw new BadRequestError(`Drawdown exceeds customer maximum total exposure capacity. Remaining capacity: ₹${exposure.remainingExposureCapacity.toLocaleString('en-IN')}`);
    }

    const policy = this.resolvePolicy(facility.tenantId, facility.productId);
    const feePct = new Decimal(policy.drawdownFeePct).dividedBy(100);
    const calculatedFee = requested.times(feePct);
    const minFee = new Decimal(policy.drawdownFeeMinInr);
    const feeAmount = Decimal.max(calculatedFee, minFee);
    const gstRate = new Decimal(policy.gstRatePct).dividedBy(100);
    const feeGst = feeAmount.times(gstRate);
    const totalDeductions = feeAmount.plus(feeGst);
    const netDisbursedAmount = requested.minus(totalDeductions);

    const tenureMonths = dto.tenureMonths || 12;
    const annualRate = new Decimal(facility.annualInterestRatePct);
    const monthlyRate = annualRate.dividedBy(12).dividedBy(100);

    let monthlyEmi = new Decimal(0);
    if (monthlyRate.isZero()) {
      monthlyEmi = requested.dividedBy(tenureMonths);
    } else {
      const factor = monthlyRate.plus(1).pow(tenureMonths);
      monthlyEmi = requested.times(monthlyRate).times(factor).dividedBy(factor.minus(1));
    }
    const totalRepayment = monthlyEmi.times(tenureMonths);
    const totalInterest = totalRepayment.minus(requested);

    const previousApproved = facility.approvedLimit;
    const previousUtilized = facility.utilizedAmount;
    const previousAvailable = facility.availableAmount;

    const newUtilized = new Decimal(previousUtilized).plus(requested);
    const newAvailable = new Decimal(previousApproved).minus(newUtilized);

    facility.utilizedAmount = toNum(newUtilized);
    facility.availableAmount = toNum(newAvailable);
    facility.updatedAt = new Date().toISOString();

    this.drawdownCounter += 1;
    const drawdownNo = `DD-2026-${String(this.drawdownCounter).padStart(4, '0')}`;
    const drawdownId = `dd-${Date.now()}`;

    const newDrawdown: Drawdown = {
      id: drawdownId,
      drawdownNo,
      facilityId: facility.id,
      facilityNo: facility.facilityNo,
      tenantId: facility.tenantId,
      branchId: facility.branchId,
      customerId: facility.customerId,
      customerName: facility.customerName,
      customerMobile: facility.customerMobile,
      productId: facility.productId,
      productCode: facility.productCode,
      productName: facility.productName,
      requestedAmount: toNum(requested),
      feeAmount: toNum(feeAmount),
      feeGst: toNum(feeGst),
      totalDeductions: toNum(totalDeductions),
      netDisbursedAmount: toNum(netDisbursedAmount),
      tenureMonths,
      interestRatePct: facility.annualInterestRatePct,
      monthlyEmi: toNum(monthlyEmi),
      totalInterest: toNum(totalInterest),
      totalRepayment: toNum(totalRepayment),
      status: 'DISBURSED',
      purpose: dto.purpose || 'Credit line drawdown',
      requestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: actor?.email || 'borrower-self-service',
      disbursedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.drawdowns.set(newDrawdown.id, newDrawdown);

    this.txCounter += 1;
    const tx: CreditFacilityTransaction = {
      id: `tx-fac-${this.txCounter}`,
      facilityId: facility.id,
      facilityNo: facility.facilityNo,
      tenantId: facility.tenantId,
      type: 'DRAWDOWN',
      amount: newDrawdown.requestedAmount,
      previousApprovedLimit: previousApproved,
      newApprovedLimit: previousApproved,
      previousUtilized,
      newUtilized: facility.utilizedAmount,
      previousAvailable,
      newAvailable: facility.availableAmount,
      drawdownId: newDrawdown.id,
      reference: newDrawdown.drawdownNo,
      description: `Drawdown #${newDrawdown.drawdownNo} of ₹${newDrawdown.requestedAmount.toLocaleString('en-IN')} approved and disbursed. Net Payout: ₹${newDrawdown.netDisbursedAmount.toLocaleString('en-IN')}`,
      actorId: actor?.id,
      actorEmail: actor?.email || 'borrower',
      actorRole: actor?.roles?.[0] || 'CUSTOMER',
      createdAt: new Date().toISOString(),
    };
    this.transactions.set(tx.id, tx);

    void logAudit({
      userId: actor?.id,
      action: 'DRAWDOWN_REQUESTED',
      entity: 'Drawdown',
      entityId: newDrawdown.id,
      newValue: newDrawdown,
    }).catch(() => {});

    return newDrawdown;
  }

  // ---------------------------------------------------------------------------
  // 7. REPAYMENT LIMIT RESTORATION & REVERSALS
  // ---------------------------------------------------------------------------

  public applyRepaymentLimitRestoration(
    customerId: string,
    principalPaid: number,
    reference?: string,
    paymentId?: string
  ): void {
    if (principalPaid <= 0) return;

    const facility = Array.from(this.facilities.values()).find(
      (f) => f.customerId === customerId && f.status === 'ACTIVE' && f.utilizedAmount > 0
    );

    if (!facility) return;

    const previousApproved = facility.approvedLimit;
    const previousUtilized = facility.utilizedAmount;
    const previousAvailable = facility.availableAmount;

    const principalDec = new Decimal(principalPaid);
    const newUtilized = Decimal.max(0, new Decimal(previousUtilized).minus(principalDec));
    const newAvailable = Decimal.max(0, new Decimal(previousApproved).minus(newUtilized));
    const newExcess = Decimal.max(0, newUtilized.minus(new Decimal(previousApproved)));

    facility.utilizedAmount = toNum(newUtilized);
    facility.availableAmount = toNum(newAvailable);
    facility.excessExposure = toNum(newExcess);
    facility.updatedAt = new Date().toISOString();

    this.txCounter += 1;
    const tx: CreditFacilityTransaction = {
      id: `tx-fac-${this.txCounter}`,
      facilityId: facility.id,
      facilityNo: facility.facilityNo,
      tenantId: facility.tenantId,
      type: 'REPAYMENT_CREDIT',
      amount: principalPaid,
      previousApprovedLimit: previousApproved,
      newApprovedLimit: previousApproved,
      previousUtilized,
      newUtilized: facility.utilizedAmount,
      previousAvailable,
      newAvailable: facility.availableAmount,
      paymentId,
      reference,
      description: `Principal repayment of ₹${principalPaid.toLocaleString('en-IN')} restored available credit. New Available: ₹${facility.availableAmount.toLocaleString('en-IN')}`,
      actorRole: 'FINANCE_SYSTEM',
      createdAt: new Date().toISOString(),
    };
    this.transactions.set(tx.id, tx);
  }

  public reverseRepaymentLimitRestoration(
    customerId: string,
    principalReversed: number,
    reference?: string,
    paymentId?: string
  ): void {
    if (principalReversed <= 0) return;

    const facility = Array.from(this.facilities.values()).find(
      (f) => f.customerId === customerId && (f.status === 'ACTIVE' || f.status === 'SUSPENDED')
    );

    if (!facility) return;

    const previousApproved = facility.approvedLimit;
    const previousUtilized = facility.utilizedAmount;
    const previousAvailable = facility.availableAmount;

    const principalDec = new Decimal(principalReversed);
    const newUtilized = new Decimal(previousUtilized).plus(principalDec);
    const newAvailable = Decimal.max(0, new Decimal(previousApproved).minus(newUtilized));
    const newExcess = Decimal.max(0, newUtilized.minus(new Decimal(previousApproved)));

    facility.utilizedAmount = toNum(newUtilized);
    facility.availableAmount = toNum(newAvailable);
    facility.excessExposure = toNum(newExcess);
    facility.updatedAt = new Date().toISOString();

    this.txCounter += 1;
    const tx: CreditFacilityTransaction = {
      id: `tx-fac-${this.txCounter}`,
      facilityId: facility.id,
      facilityNo: facility.facilityNo,
      tenantId: facility.tenantId,
      type: 'REPAYMENT_REVERSED',
      amount: principalReversed,
      previousApprovedLimit: previousApproved,
      newApprovedLimit: previousApproved,
      previousUtilized,
      newUtilized: facility.utilizedAmount,
      previousAvailable,
      newAvailable: facility.availableAmount,
      paymentId,
      reference,
      description: `Payment reversal of ₹${principalReversed.toLocaleString('en-IN')} re-utilized credit limit. New Available: ₹${facility.availableAmount.toLocaleString('en-IN')}`,
      actorRole: 'FINANCE_SYSTEM',
      createdAt: new Date().toISOString(),
    };
    this.transactions.set(tx.id, tx);
  }

  // ---------------------------------------------------------------------------
  // 8. CONTROLLED LIMIT ADJUSTMENT (INCREASE, DECREASE, OVERRIDE)
  // ---------------------------------------------------------------------------

  public adjustLimit(
    facilityId: string,
    dto: LimitAdjustmentDto,
    actor?: CreditActorContext
  ): CreditFacility {
    const facility = this.facilities.get(facilityId);
    if (!facility) throw new NotFoundError(`Credit Facility #${facilityId} not found`);

    if (actor && !actor.roles?.includes('SUPER_ADMIN') && !actor.roles?.includes('ADMIN') && !actor.roles?.includes('UNDERWRITER')) {
      throw new ForbiddenError('Access forbidden: Only Underwriters or Administrators can adjust credit limits');
    }

    if (!dto.reasonCode || !dto.comments) {
      throw new BadRequestError('Reason code and mandatory explanation comments are required for all limit adjustments');
    }

    const oldLimit = facility.approvedLimit;
    const newLimit = dto.newLimit;
    if (newLimit <= 0) {
      throw new BadRequestError('New limit must be strictly greater than 0');
    }

    const previousApproved = facility.approvedLimit;
    const previousUtilized = facility.utilizedAmount;
    const previousAvailable = facility.availableAmount;

    facility.limitVersion += 1;
    facility.approvedLimit = newLimit;
    facility.currentLimit = newLimit;

    if (newLimit < previousUtilized) {
      facility.availableAmount = 0;
      facility.excessExposure = toNum(new Decimal(previousUtilized).minus(newLimit));
    } else {
      facility.availableAmount = toNum(new Decimal(newLimit).minus(previousUtilized));
      facility.excessExposure = 0;
    }
    facility.updatedAt = new Date().toISOString();

    const isIncrease = newLimit > oldLimit;
    const txType = dto.isManualOverride
      ? 'LIMIT_OVERRIDDEN'
      : isIncrease
      ? 'LIMIT_INCREASED'
      : 'LIMIT_DECREASED';

    this.adjCounter += 1;
    const adjRecord: LimitAdjustmentRecord = {
      id: `adj-${this.adjCounter}`,
      facilityId: facility.id,
      version: facility.limitVersion,
      adjustmentType: dto.adjustmentType || (isIncrease ? 'INCREASE' : 'DECREASE'),
      oldLimit,
      newLimit,
      reasonCode: dto.reasonCode,
      comments: dto.comments,
      approvedBy: actor?.email || 'underwriter',
      approvedByRole: actor?.roles?.[0] || 'UNDERWRITER',
      createdAt: new Date().toISOString(),
    };
    this.adjustments.set(adjRecord.id, adjRecord);

    this.txCounter += 1;
    const tx: CreditFacilityTransaction = {
      id: `tx-fac-${this.txCounter}`,
      facilityId: facility.id,
      facilityNo: facility.facilityNo,
      tenantId: facility.tenantId,
      type: txType,
      amount: Math.abs(newLimit - oldLimit),
      previousApprovedLimit: previousApproved,
      newApprovedLimit: newLimit,
      previousUtilized,
      newUtilized: facility.utilizedAmount,
      previousAvailable,
      newAvailable: facility.availableAmount,
      description: `Limit ${isIncrease ? 'increased' : 'decreased'} from ₹${oldLimit.toLocaleString('en-IN')} to ₹${newLimit.toLocaleString('en-IN')} (v${facility.limitVersion}). Reason: ${dto.reasonCode}`,
      actorId: actor?.id,
      actorEmail: actor?.email || 'underwriter',
      actorRole: actor?.roles?.[0] || 'UNDERWRITER',
      createdAt: new Date().toISOString(),
    };
    this.transactions.set(tx.id, tx);

    void logAudit({
      userId: actor?.id,
      action: isIncrease ? 'CREDIT_LIMIT_INCREASED' : 'CREDIT_LIMIT_DECREASED',
      entity: 'CreditFacility',
      entityId: facility.id,
      newValue: { oldLimit, newLimit, version: facility.limitVersion, reason: dto.reasonCode },
    }).catch(() => {});

    return this.enrichFacility(facility);
  }

  // ---------------------------------------------------------------------------
  // 9. OPERATIONAL RISK CONTROLS (SUSPEND, FREEZE, RESUME, CLOSE)
  // ---------------------------------------------------------------------------

  public suspendFacility(facilityId: string, reason: string, actor?: CreditActorContext): CreditFacility {
    const facility = this.facilities.get(facilityId);
    if (!facility) throw new NotFoundError(`Credit Facility #${facilityId} not found`);
    if (!reason) throw new BadRequestError('Reason is mandatory for facility suspension');

    facility.status = 'SUSPENDED';
    facility.statusReason = reason;
    facility.updatedAt = new Date().toISOString();

    this.txCounter += 1;
    this.transactions.set(`tx-fac-${this.txCounter}`, {
      id: `tx-fac-${this.txCounter}`,
      facilityId: facility.id,
      facilityNo: facility.facilityNo,
      tenantId: facility.tenantId,
      type: 'SUSPENSION',
      amount: 0,
      previousApprovedLimit: facility.approvedLimit,
      newApprovedLimit: facility.approvedLimit,
      previousUtilized: facility.utilizedAmount,
      newUtilized: facility.utilizedAmount,
      previousAvailable: facility.availableAmount,
      newAvailable: facility.availableAmount,
      description: `Facility SUSPENDED. Reason: ${reason}`,
      actorId: actor?.id,
      actorEmail: actor?.email || 'staff',
      actorRole: actor?.roles?.[0] || 'RISK_OFFICER',
      createdAt: new Date().toISOString(),
    });

    void logAudit({
      userId: actor?.id,
      action: 'CREDIT_FACILITY_SUSPENDED',
      entity: 'CreditFacility',
      entityId: facility.id,
      newValue: { reason },
    }).catch(() => {});

    return this.enrichFacility(facility);
  }

  public freezeFacility(facilityId: string, reason: string, actor?: CreditActorContext): CreditFacility {
    const facility = this.facilities.get(facilityId);
    if (!facility) throw new NotFoundError(`Credit Facility #${facilityId} not found`);
    if (!reason) throw new BadRequestError('Reason is mandatory for facility freeze');

    facility.status = 'FROZEN';
    facility.statusReason = reason;
    facility.updatedAt = new Date().toISOString();

    this.txCounter += 1;
    this.transactions.set(`tx-fac-${this.txCounter}`, {
      id: `tx-fac-${this.txCounter}`,
      facilityId: facility.id,
      facilityNo: facility.facilityNo,
      tenantId: facility.tenantId,
      type: 'SUSPENSION',
      amount: 0,
      previousApprovedLimit: facility.approvedLimit,
      newApprovedLimit: facility.approvedLimit,
      previousUtilized: facility.utilizedAmount,
      newUtilized: facility.utilizedAmount,
      previousAvailable: facility.availableAmount,
      newAvailable: facility.availableAmount,
      description: `Facility FROZEN by Underwriter / Risk Committee. Reason: ${reason}`,
      actorId: actor?.id,
      actorEmail: actor?.email || 'staff',
      actorRole: actor?.roles?.[0] || 'UNDERWRITER',
      createdAt: new Date().toISOString(),
    });

    void logAudit({
      userId: actor?.id,
      action: 'CREDIT_FACILITY_FROZEN',
      entity: 'CreditFacility',
      entityId: facility.id,
      newValue: { reason },
    }).catch(() => {});

    return this.enrichFacility(facility);
  }

  public resumeFacility(facilityId: string, reason: string, actor?: CreditActorContext): CreditFacility {
    const facility = this.facilities.get(facilityId);
    if (!facility) throw new NotFoundError(`Credit Facility #${facilityId} not found`);

    facility.status = 'ACTIVE';
    facility.statusReason = reason || 'Resumed by authorized operator';
    facility.updatedAt = new Date().toISOString();

    this.txCounter += 1;
    this.transactions.set(`tx-fac-${this.txCounter}`, {
      id: `tx-fac-${this.txCounter}`,
      facilityId: facility.id,
      facilityNo: facility.facilityNo,
      tenantId: facility.tenantId,
      type: 'RESUMPTION',
      amount: 0,
      previousApprovedLimit: facility.approvedLimit,
      newApprovedLimit: facility.approvedLimit,
      previousUtilized: facility.utilizedAmount,
      newUtilized: facility.utilizedAmount,
      previousAvailable: facility.availableAmount,
      newAvailable: facility.availableAmount,
      description: `Facility RESUMED to ACTIVE status. Reason: ${facility.statusReason}`,
      actorId: actor?.id,
      actorEmail: actor?.email || 'staff',
      actorRole: actor?.roles?.[0] || 'UNDERWRITER',
      createdAt: new Date().toISOString(),
    });

    void logAudit({
      userId: actor?.id,
      action: 'CREDIT_FACILITY_RESUMED',
      entity: 'CreditFacility',
      entityId: facility.id,
      newValue: { reason },
    }).catch(() => {});

    return this.enrichFacility(facility);
  }

  public closeFacility(facilityId: string, reason: string, actor?: CreditActorContext): CreditFacility {
    const facility = this.facilities.get(facilityId);
    if (!facility) throw new NotFoundError(`Credit Facility #${facilityId} not found`);

    if (facility.utilizedAmount > 0) {
      throw new BadRequestError(`Cannot close facility: Outstanding utilized balance of ₹${facility.utilizedAmount.toLocaleString('en-IN')} must be settled first`);
    }

    facility.status = 'CLOSED';
    facility.statusReason = reason || 'Closed upon borrower request';
    facility.availableAmount = 0;
    facility.updatedAt = new Date().toISOString();

    this.txCounter += 1;
    this.transactions.set(`tx-fac-${this.txCounter}`, {
      id: `tx-fac-${this.txCounter}`,
      facilityId: facility.id,
      facilityNo: facility.facilityNo,
      tenantId: facility.tenantId,
      type: 'CLOSURE',
      amount: 0,
      previousApprovedLimit: facility.approvedLimit,
      newApprovedLimit: facility.approvedLimit,
      previousUtilized: 0,
      newUtilized: 0,
      previousAvailable: facility.availableAmount,
      newAvailable: 0,
      description: `Facility CLOSED. Reason: ${facility.statusReason}`,
      actorId: actor?.id,
      actorEmail: actor?.email || 'staff',
      actorRole: actor?.roles?.[0] || 'UNDERWRITER',
      createdAt: new Date().toISOString(),
    });

    void logAudit({
      userId: actor?.id,
      action: 'CREDIT_FACILITY_CLOSED',
      entity: 'CreditFacility',
      entityId: facility.id,
      newValue: { reason },
    }).catch(() => {});

    return this.enrichFacility(facility);
  }

  // ---------------------------------------------------------------------------
  // 10. STATELESS CREDIT LIMIT SIMULATOR
  // ---------------------------------------------------------------------------

  public simulateLimit(input: CreditLimitSimulationInput): CreditLimitSimulationResult {
    const declaredIncome = new Decimal(input.declaredMonthlyIncome || 50000);
    const obligations = new Decimal(input.existingMonthlyObligations || 0);
    const existingExposure = new Decimal(input.existingExposure || 0);
    const requested = new Decimal(input.requestedLimit || 100000);
    const riskGrade: RiskGrade = input.riskGrade || (input.cibilScore && input.cibilScore >= 750 ? 'A' : input.cibilScore && input.cibilScore >= 700 ? 'B' : 'C');

    const maxFoirAllowedPct = riskGrade === 'A' ? 60 : riskGrade === 'B' ? 55 : riskGrade === 'C' ? 50 : 40;
    const maxMonthlyCapacity = declaredIncome.times(maxFoirAllowedPct / 100);
    const disposableMonthly = Decimal.max(0, maxMonthlyCapacity.minus(obligations));

    const maxAffordabilityLimit = disposableMonthly.times(18);

    const policy = this.resolvePolicy();
    const productMaxCap = new Decimal(500000);
    const riskCapObj = policy.riskLimitCaps.find((r) => r.riskGrade === riskGrade);
    const riskGradeCap = new Decimal(riskCapObj ? riskCapObj.maxLimitCap : 100000);
    const customerExposureCap = new Decimal(policy.maxCustomerExposure);
    const remainingExposureCapacity = Decimal.max(0, customerExposureCap.minus(existingExposure));

    const eligibleLimit = Decimal.min(
      requested,
      maxAffordabilityLimit,
      productMaxCap,
      riskGradeCap,
      remainingExposureCapacity
    );

    const isApproved = eligibleLimit.greaterThan(0) && (riskCapObj ? riskCapObj.allowRevolving : true);
    const approvedLimit = isApproved ? toNum(eligibleLimit) : 0;

    const sampleDrawdownAmount = Math.min(approvedLimit, 50000);
    const drawdownFee = sampleDrawdownAmount * (policy.drawdownFeePct / 100);
    const drawdownFeeGst = drawdownFee * (policy.gstRatePct / 100);
    const netDisbursed = sampleDrawdownAmount - (drawdownFee + drawdownFeeGst);

    const sampleRate = riskGrade === 'A' ? 13.5 : riskGrade === 'B' ? 14.5 : 16.0;
    const monthlyRate = sampleRate / 12 / 100;
    const factor = Math.pow(1 + monthlyRate, 12);
    const estimatedMonthlyEmi = sampleDrawdownAmount * (monthlyRate * factor) / (factor - 1);

    const constraintsApplied = [
      { constraint: 'Requested Limit', value: toNum(requested), isBinding: eligibleLimit.equals(requested) },
      { constraint: 'Max Affordability Limit (FOIR)', value: toNum(maxAffordabilityLimit), isBinding: eligibleLimit.equals(maxAffordabilityLimit) },
      { constraint: 'Product Maximum Cap', value: toNum(productMaxCap), isBinding: eligibleLimit.equals(productMaxCap) },
      { constraint: `Risk Grade Cap (${riskGrade})`, value: toNum(riskGradeCap), isBinding: eligibleLimit.equals(riskGradeCap) },
      { constraint: 'Remaining Exposure Capacity', value: toNum(remainingExposureCapacity), isBinding: eligibleLimit.equals(remainingExposureCapacity) },
    ];

    const notes: string[] = [];
    if (!isApproved) {
      notes.push(`Borrower does not qualify for revolving credit line due to Risk Grade ${riskGrade}`);
    } else {
      notes.push(`Eligible limit ₹${approvedLimit.toLocaleString('en-IN')} approved within exposure capacity`);
    }

    return {
      requestedLimit: toNum(requested),
      eligibleLimit: toNum(eligibleLimit),
      approvedLimit,
      availableLimit: approvedLimit,
      riskGrade,
      facilityType: input.facilityType || 'REVOLVING_CREDIT',
      monthlyDisposableIncome: toNum(disposableMonthly),
      maxFoirAllowedPct,
      maxAffordabilityLimit: toNum(maxAffordabilityLimit),
      productMaxCap: toNum(productMaxCap),
      riskGradeCap: toNum(riskGradeCap),
      customerExposureCap: toNum(customerExposureCap),
      existingExposure: toNum(existingExposure),
      remainingExposureCapacity: toNum(remainingExposureCapacity),
      drawdownSimulation: {
        sampleDrawdownAmount,
        drawdownFee: Math.round(drawdownFee * 100) / 100,
        drawdownFeeGst: Math.round(drawdownFeeGst * 100) / 100,
        netDisbursed: Math.round(netDisbursed * 100) / 100,
        sampleTenureMonths: 12,
        annualInterestRatePct: sampleRate,
        estimatedMonthlyEmi: Math.round(estimatedMonthlyEmi * 100) / 100,
      },
      constraintsApplied,
      isApproved,
      notes,
    };
  }

  // ---------------------------------------------------------------------------
  // 11. SUB-RECORDS (TRANSACTIONS & ADJUSTMENTS)
  // ---------------------------------------------------------------------------

  public getTransactions(facilityId: string, actor?: CreditActorContext): CreditFacilityTransaction[] {
    this.getFacility(facilityId, actor);
    return Array.from(this.transactions.values())
      .filter((t) => t.facilityId === facilityId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAdjustments(facilityId: string, actor?: CreditActorContext): LimitAdjustmentRecord[] {
    this.getFacility(facilityId, actor);
    return Array.from(this.adjustments.values())
      .filter((a) => a.facilityId === facilityId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const creditLimitsService = CreditLimitsService.getInstance();
