import { v4 as uuid } from 'uuid';
import {
  DecisionContext,
  DecisionPolicy,
  DecisionRule,
  DecisionRuleGroup,
  DecisionResult,
  DecisionOutcome,
  RiskGrade,
  RuleEvaluationItem,
  DecisionSnapshotRecord,
  DecisionSimulationInput,
  DecisionOverrideData,
  CreateDecisionPolicyDto,
  UpdateDecisionPolicyDto,
} from './decision-engine.types';
import { financialMetricsService } from './financial-metrics.service';
import { prisma } from '../../config/prisma';
import { logAudit } from '../audit/audit.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { productEngineService } from '../product/product-engine.service';
import { workflowService } from '../workflows/workflow.service';

export interface DecisionActorContext {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}

export class DecisionEngineService {
  private static instance: DecisionEngineService;

  // Active Policies: Map<`${tenantId}:${policyId}`, DecisionPolicy>
  private readonly policies = new Map<string, DecisionPolicy>();

  // Historical Policy Snapshots: Map<`${tenantId}:${policyId}:v${version}`, DecisionPolicy>
  private readonly historicalPolicySnapshots = new Map<string, DecisionPolicy>();

  // Decision Evaluation Snapshots: Map<`${tenantId}:${applicationId}`, DecisionSnapshotRecord[]>
  private readonly decisionSnapshots = new Map<string, DecisionSnapshotRecord[]>();

  private constructor() {
    this.seedCanonicalPolicies('tenant-adyapan-default');
    this.seedCanonicalPolicies('tenant-apex-nbfc');
  }

  public static getInstance(): DecisionEngineService {
    if (!DecisionEngineService.instance) {
      DecisionEngineService.instance = new DecisionEngineService();
    }
    return DecisionEngineService.instance;
  }

  // ---------------------------------------------------------------------------
  // 1. CANONICAL POLICY SEEDING
  // ---------------------------------------------------------------------------

  public seedCanonicalPolicies(tenantId: string): void {
    const now = new Date().toISOString();

    const standardRules: DecisionRule[] = [
      {
        id: 'rule-elig-age-min',
        code: 'ELIG_AGE_MIN',
        name: 'Minimum Applicant Age',
        description: 'Applicant must be at least 21 years of age at origination.',
        category: 'ELIGIBILITY',
        field: 'applicantAge',
        operator: 'GREATER_THAN_OR_EQUAL',
        expectedValue: 21,
        severity: 'HARD_STOP',
        actionOnPass: 'PASS',
        actionOnFail: 'FAIL',
        reasonCode: 'ERR_AGE_BELOW_MINIMUM',
        customerReason: 'Applicant age is below the minimum required age of 21 years.',
        weight: 10,
        enabled: true,
        priority: 1,
      },
      {
        id: 'rule-elig-age-max',
        code: 'ELIG_AGE_MAX',
        name: 'Maximum Applicant Age at Maturity',
        description: 'Applicant must not exceed 60 years of age for retail term facilities.',
        category: 'ELIGIBILITY',
        field: 'applicantAge',
        operator: 'LESS_THAN_OR_EQUAL',
        expectedValue: 60,
        severity: 'MEDIUM',
        actionOnPass: 'PASS',
        actionOnFail: 'REFER',
        reasonCode: 'WARN_AGE_ABOVE_BENCHMARK',
        customerReason: 'Applicant age requires manual tenure review by an underwriter.',
        weight: 10,
        enabled: true,
        priority: 2,
      },
      {
        id: 'rule-fin-income-min',
        code: 'FIN_INCOME_MIN',
        name: 'Minimum Verified Monthly Income',
        description: 'Applicant monthly income must meet or exceed policy baseline of ₹25,000.',
        category: 'FINANCIAL',
        field: 'monthlyIncome',
        operator: 'GREATER_THAN_OR_EQUAL',
        expectedValue: 25000,
        severity: 'HARD_STOP',
        actionOnPass: 'PASS',
        actionOnFail: 'FAIL',
        reasonCode: 'ERR_INCOME_BELOW_FLOOR',
        customerReason: 'Monthly income does not meet the minimum requirement for this product.',
        weight: 20,
        enabled: true,
        priority: 3,
      },
      {
        id: 'rule-fin-foir-max',
        code: 'FIN_FOIR_MAX_CAP',
        name: 'Maximum Permissible Debt Burden (FOIR)',
        description: 'Projected Fixed Obligation to Income Ratio must not exceed 55%.',
        category: 'FINANCIAL',
        field: 'derived.foirPct',
        operator: 'LESS_THAN_OR_EQUAL',
        expectedValue: 55,
        severity: 'HIGH',
        actionOnPass: 'PASS',
        actionOnFail: 'REFER',
        reasonCode: 'ERR_FOIR_EXCEEDS_POLICY_CAP',
        customerReason: 'Existing monthly debt obligations exceed the permissible affordability threshold.',
        weight: 25,
        enabled: true,
        priority: 4,
      },
      {
        id: 'rule-credit-cibil-floor',
        code: 'CREDIT_CIBIL_SCORE_FLOOR',
        name: 'Minimum Bureau CIBIL Score',
        description: 'Bureau score must meet or exceed 650 for retail credit sanction.',
        category: 'CREDIT',
        field: 'cibilScore',
        operator: 'GREATER_THAN_OR_EQUAL',
        expectedValue: 650,
        severity: 'HARD_STOP',
        actionOnPass: 'PASS',
        actionOnFail: 'FAIL',
        reasonCode: 'ERR_CIBIL_BELOW_CUTOFF',
        customerReason: 'Credit bureau score is below the minimum threshold required for this loan product.',
        weight: 30,
        enabled: true,
        priority: 5,
      },
      {
        id: 'rule-credit-dpd-check',
        code: 'CREDIT_ZERO_DPD_LAST_12M',
        name: 'Delinquency History (DPD 30+ in 12m)',
        description: 'No more than 0 instances of 30+ DPD in the preceding 12 months.',
        category: 'CREDIT',
        field: 'cibilDPD30Last12m',
        operator: 'LESS_THAN_OR_EQUAL',
        expectedValue: 0,
        severity: 'MEDIUM',
        actionOnPass: 'PASS',
        actionOnFail: 'REFER',
        reasonCode: 'WARN_RECENT_DELINQUENCY_DETECTED',
        customerReason: 'Recent loan payment delays detected on bureau tradelines.',
        weight: 15,
        enabled: true,
        priority: 6,
      },
      {
        id: 'rule-fraud-score-max',
        code: 'FRAUD_RISK_SCORE_CAP',
        name: 'Maximum Automated Fraud Risk Index',
        description: 'Fraud & anomaly detection score must not exceed 35.',
        category: 'FRAUD_RISK',
        field: 'fraudRiskScore',
        operator: 'LESS_THAN_OR_EQUAL',
        expectedValue: 35,
        severity: 'HARD_STOP',
        actionOnPass: 'PASS',
        actionOnFail: 'FAIL',
        reasonCode: 'ERR_FRAUD_RISK_ELEVATED',
        customerReason: 'Application risk validation check could not be completed.',
        weight: 25,
        enabled: true,
        priority: 7,
      },
      {
        id: 'rule-kyc-pan-verified',
        code: 'KYC_PAN_VERIFICATION',
        name: 'Statutory PAN Verification',
        description: 'Permanent Account Number record must be validated active with NSDL / Income Tax.',
        category: 'KYC_DOCS',
        field: 'panVerified',
        operator: 'EQUALS',
        expectedValue: true,
        severity: 'HARD_STOP',
        actionOnPass: 'PASS',
        actionOnFail: 'FAIL',
        reasonCode: 'ERR_PAN_NOT_VERIFIED',
        customerReason: 'PAN verification could not be validated with statutory databases.',
        weight: 15,
        enabled: true,
        priority: 8,
      },
      {
        id: 'rule-kyc-aadhaar-verified',
        code: 'KYC_AADHAAR_VERIFICATION',
        name: 'Statutory Aadhaar eKYC Verification',
        description: 'Aadhaar identity must be authenticated via OTP eKYC or DigiLocker XML.',
        category: 'KYC_DOCS',
        field: 'aadhaarVerified',
        operator: 'EQUALS',
        expectedValue: true,
        severity: 'HARD_STOP',
        actionOnPass: 'PASS',
        actionOnFail: 'FAIL',
        reasonCode: 'ERR_AADHAAR_NOT_VERIFIED',
        customerReason: 'Aadhaar eKYC authentication is required.',
        weight: 15,
        enabled: true,
        priority: 9,
      },
      {
        id: 'rule-banking-bounces-max',
        code: 'BANKING_MAX_BOUNCES_90D',
        name: 'Maximum Inward Mandate / Cheque Returns',
        description: 'Bank statement must reflect no more than 1 return in preceding 90 days.',
        category: 'BANKING',
        field: 'bankBounces90d',
        operator: 'LESS_THAN_OR_EQUAL',
        expectedValue: 1,
        severity: 'MEDIUM',
        actionOnPass: 'PASS',
        actionOnFail: 'WARNING',
        reasonCode: 'WARN_BANK_RETURNS_OBSERVED',
        customerReason: 'Inward return entries observed in recent bank statements.',
        weight: 10,
        enabled: true,
        priority: 10,
      },
    ];

    const standardPolicy: DecisionPolicy = {
      id: `policy-standard-${tenantId.replace('tenant-', '')}`,
      tenantId,
      code: 'POLICY_RETAIL_UNSECURED_STANDARD',
      name: 'Standard Retail Unsecured Credit Policy',
      description: 'Authoritative underwriting and credit policy for personal and salaried retail term facilities.',
      version: 1,
      status: 'ACTIVE',
      ruleGroups: [
        {
          id: 'rg-eligibility',
          code: 'GRP_ELIGIBILITY',
          name: 'Borrower Eligibility Criteria',
          description: 'Basic applicant demographic and employment eligibility rules',
          category: 'ELIGIBILITY',
          logicalOperator: 'AND',
          enabled: true,
          rules: standardRules.filter((r) => r.category === 'ELIGIBILITY'),
        },
        {
          id: 'rg-financial',
          code: 'GRP_FINANCIAL',
          name: 'Income & Affordability Rules',
          description: 'Debt serviceability and FOIR threshold limits',
          category: 'FINANCIAL',
          logicalOperator: 'AND',
          enabled: true,
          rules: standardRules.filter((r) => r.category === 'FINANCIAL'),
        },
        {
          id: 'rg-credit',
          code: 'GRP_CREDIT',
          name: 'Bureau & Credit History Rules',
          description: 'CIBIL score floor, overdue tradelines, and delinquency benchmarks',
          category: 'CREDIT',
          logicalOperator: 'AND',
          enabled: true,
          rules: standardRules.filter((r) => r.category === 'CREDIT'),
        },
        {
          id: 'rg-fraud-kyc',
          code: 'GRP_FRAUD_KYC',
          name: 'Fraud & KYC Verification Gates',
          description: 'Statutory identity validation and fraud risk index thresholds',
          category: 'FRAUD_RISK',
          logicalOperator: 'AND',
          enabled: true,
          rules: standardRules.filter((r) => r.category === 'FRAUD_RISK' || r.category === 'KYC_DOCS'),
        },
        {
          id: 'rg-banking',
          code: 'GRP_BANKING',
          name: 'Banking & Statement Analysis Rules',
          description: 'Inward return benchmarks and cash flow consistency',
          category: 'BANKING',
          logicalOperator: 'AND',
          enabled: true,
          rules: standardRules.filter((r) => r.category === 'BANKING'),
        },
      ],
      scoringWeights: {
        creditScoreWeight: 30,
        incomeStabilityWeight: 20,
        foirWeight: 20,
        bankingWeight: 15,
        employmentWeight: 10,
        fraudPenaltyWeight: -50,
      },
      effectiveFrom: now,
      createdAt: now,
      updatedAt: now,
    };

    this.policies.set(`${tenantId}:${standardPolicy.id}`, standardPolicy);
    this.historicalPolicySnapshots.set(`${tenantId}:${standardPolicy.id}:v1`, { ...standardPolicy });
  }

  // ---------------------------------------------------------------------------
  // 2. POLICY MANAGEMENT
  // ---------------------------------------------------------------------------

  public listPolicies(tenantId: string, options?: { status?: string; search?: string }): DecisionPolicy[] {
    const list: DecisionPolicy[] = [];
    for (const [key, p] of this.policies.entries()) {
      if (p.tenantId === tenantId || key.startsWith(`${tenantId}:`)) {
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

  public getPolicyById(tenantId: string, id: string): DecisionPolicy {
    const policy = this.policies.get(`${tenantId}:${id}`);
    if (!policy) {
      throw new NotFoundError(`Decision Policy '${id}' not found`);
    }
    return policy;
  }

  public getActivePolicyForProduct(tenantId: string, productId?: string): DecisionPolicy {
    // If productId is provided, search for product-bound policy
    if (productId) {
      for (const p of this.policies.values()) {
        if (p.tenantId === tenantId && p.status === 'ACTIVE' && p.productId === productId) {
          return p;
        }
      }
    }

    // Default to the active standard policy for the tenant
    for (const p of this.policies.values()) {
      if (p.tenantId === tenantId && p.status === 'ACTIVE') {
        return p;
      }
    }

    // Seed if missing
    this.seedCanonicalPolicies(tenantId);
    return Array.from(this.policies.values()).find(
      (p) => p.tenantId === tenantId && p.status === 'ACTIVE'
    )!;
  }

  public async createPolicy(
    tenantId: string,
    dto: CreateDecisionPolicyDto,
    actor?: DecisionActorContext
  ): Promise<DecisionPolicy> {
    const existing = this.listPolicies(tenantId).find((p) => p.code === dto.code);
    if (existing) {
      throw new BadRequestError(`Decision Policy with code '${dto.code}' already exists.`);
    }

    const id = `policy-${dto.code.toLowerCase().replace(/_/g, '-')}-${uuid().slice(0, 8)}`;
    const now = new Date().toISOString();

    const policy: DecisionPolicy = {
      id,
      tenantId,
      productId: dto.productId,
      productCode: dto.productCode,
      code: dto.code.trim().toUpperCase(),
      name: dto.name.trim(),
      description: dto.description.trim(),
      version: 1,
      status: 'DRAFT',
      ruleGroups: dto.ruleGroups || [],
      scoringWeights: dto.scoringWeights || {
        creditScoreWeight: 30,
        incomeStabilityWeight: 20,
        foirWeight: 20,
        bankingWeight: 15,
        employmentWeight: 10,
        fraudPenaltyWeight: -50,
      },
      effectiveFrom: now,
      createdAt: now,
      updatedAt: now,
    };

    this.policies.set(`${tenantId}:${id}`, policy);
    this.historicalPolicySnapshots.set(`${tenantId}:${id}:v1`, { ...policy });

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: 'DECISION_POLICY_CREATED',
      entity: 'DecisionPolicy',
      entityId: policy.id,
      newValue: { code: policy.code, name: policy.name, version: 1, status: policy.status },
    });

    return policy;
  }

  public async updatePolicyWithVersioning(
    tenantId: string,
    id: string,
    dto: UpdateDecisionPolicyDto,
    actor?: DecisionActorContext
  ): Promise<DecisionPolicy> {
    const existing = this.getPolicyById(tenantId, id);
    const now = new Date().toISOString();

    const isDraft = existing.status === 'DRAFT';
    const newVersion = isDraft ? existing.version : existing.version + 1;

    const updated: DecisionPolicy = {
      ...existing,
      ...dto,
      ruleGroups: dto.ruleGroups || existing.ruleGroups,
      scoringWeights: dto.scoringWeights ? { ...existing.scoringWeights, ...dto.scoringWeights } : existing.scoringWeights,
      version: newVersion,
      updatedAt: now,
    };

    this.policies.set(`${tenantId}:${id}`, updated);
    this.historicalPolicySnapshots.set(`${tenantId}:${id}:v${newVersion}`, { ...updated });

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: isDraft ? 'DECISION_POLICY_UPDATED' : 'DECISION_POLICY_VERSIONED',
      entity: 'DecisionPolicy',
      entityId: id,
      previousValue: { version: existing.version, status: existing.status },
      newValue: { version: newVersion, status: updated.status },
    });

    return updated;
  }

  public async createPolicyVersion(
    tenantId: string,
    id: string,
    actor?: DecisionActorContext
  ): Promise<DecisionPolicy> {
    const existing = this.getPolicyById(tenantId, id);
    const now = new Date().toISOString();
    const newVersion = existing.version + 1;
    const newId = `policy-${existing.code.toLowerCase().replace(/_/g, '-')}-v${newVersion}-${uuid().slice(0, 6)}`;

    const versioned: DecisionPolicy = {
      ...existing,
      id: newId,
      version: newVersion,
      status: 'DRAFT',
      effectiveFrom: now,
      createdAt: now,
      updatedAt: now,
    };

    this.policies.set(`${tenantId}:${newId}`, versioned);
    this.historicalPolicySnapshots.set(`${tenantId}:${newId}:v${newVersion}`, { ...versioned });

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: 'DECISION_POLICY_VERSIONED',
      entity: 'DecisionPolicy',
      entityId: newId,
      newValue: { code: versioned.code, version: newVersion, status: versioned.status },
    });

    return versioned;
  }

  public async activatePolicy(
    tenantId: string,
    id: string,
    actor?: DecisionActorContext
  ): Promise<DecisionPolicy> {
    const policy = this.getPolicyById(tenantId, id);

    if (!policy.ruleGroups || policy.ruleGroups.length === 0) {
      throw new BadRequestError('Cannot activate policy: At least one rule group must be defined.');
    }

    const updated: DecisionPolicy = {
      ...policy,
      status: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    };

    this.policies.set(`${tenantId}:${id}`, updated);
    this.historicalPolicySnapshots.set(`${tenantId}:${id}:v${updated.version}`, { ...updated });

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: 'DECISION_POLICY_ACTIVATED',
      entity: 'DecisionPolicy',
      entityId: id,
      newValue: { status: 'ACTIVE', version: updated.version },
    });

    return updated;
  }

  public async archivePolicy(
    tenantId: string,
    id: string,
    actor?: DecisionActorContext
  ): Promise<DecisionPolicy> {
    const policy = this.getPolicyById(tenantId, id);

    const updated: DecisionPolicy = {
      ...policy,
      status: 'ARCHIVED',
      updatedAt: new Date().toISOString(),
    };

    this.policies.set(`${tenantId}:${id}`, updated);
    this.historicalPolicySnapshots.set(`${tenantId}:${id}:v${updated.version}`, { ...updated });

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: 'DECISION_POLICY_ARCHIVED',
      entity: 'DecisionPolicy',
      entityId: id,
      newValue: { status: 'ARCHIVED' },
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // 3. DECISION CONTEXT BUILDER (From Live Database)
  // ---------------------------------------------------------------------------

  public async buildDecisionContext(applicationId: string, tenantId: string): Promise<DecisionContext> {
    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: {
          include: {
            employmentDetails: true,
            documents: true,
            bankAccounts: true,
          },
        },
        product: true,
        documents: true,
        riskAssessment: true,
      },
    });

    if (!app) {
      // Resilient fallback context for demonstration or standalone evaluations
      const activeProducts = productEngineService.listProducts(tenantId, { status: 'ACTIVE' });
      const product = activeProducts[0] || productEngineService.listProducts(tenantId)[0];
      return {
        applicationId,
        applicationNo: `APP-DEMO-${applicationId.slice(-4).toUpperCase()}`,
        customerId: `cust-demo-${tenantId.replace('tenant-', '')}`,
        customerCode: 'CUST-DEMO-001',
        tenantId,
        applicantAge: 29,
        employmentType: 'SALARIED',
        monthlyIncome: 65000,
        existingObligations: 10000,
        workExperienceMonths: 36,
        kycStatus: 'VERIFIED',
        requestedAmount: 300000,
        tenureMonths: 36,
        productId: product?.id || 'prod-standard',
        productCode: product?.code || 'STANDARD_LOAN',
        productName: product?.name || 'Standard Retail Loan',
        productType: product?.productType || 'PERSONAL_LOAN',
        productVersion: product?.version || 1,
        interestModel: product?.interestModel || 'REDUCING_BALANCE',
        baseInterestRateAnnualPct: product?.baseInterestRateAnnualPct || 12.5,
        minAmount: product?.minAmount || 10000,
        maxAmount: product?.maxAmount || 1000000,
        minTenureMonths: product?.minTenureMonths || 6,
        maxTenureMonths: product?.maxTenureMonths || 60,
        cibilScore: 745,
        cibilOverdueAccounts: 0,
        cibilDPD30Last12m: 0,
        recentEnquiries6m: 1,
        hasWriteOffs: false,
        hasSettlements: false,
        creditUtilizationPct: 22,
        averageBankBalance: 24000,
        bankBounces90d: 0,
        salaryCreditDetected: true,
        negativeBalanceDays90d: 0,
        panVerified: true,
        aadhaarVerified: true,
        allMandatoryDocsVerified: true,
        missingMandatoryDocs: [],
        fraudRiskScore: 12,
        deviceRiskDetected: false,
        identityMismatchDetected: false,
        duplicateApplicationDetected: false,
      };
    }

    if (app.tenantId && app.tenantId !== tenantId) {
      throw new ForbiddenError('Access Denied: Application belongs to another lender organization.');
    }

    const customer = app.customer;
    const employment = customer.employmentDetails?.[0];
    const risk = app.riskAssessment;

    // Resolve age from DOB
    let applicantAge = 28;
    if (customer.dateOfBirth) {
      const diffMs = Date.now() - new Date(customer.dateOfBirth).getTime();
      applicantAge = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    }

    const monthlyIncome = employment?.monthlyIncome ? Number(employment.monthlyIncome) : customer.monthlyIncome ? Number(customer.monthlyIncome) : 45000;
    const existingObligations = customer.existingObligations ? Number(customer.existingObligations) : 0;
    const requestedAmount = Number(app.requestedAmount);
    const tenureMonths = app.tenureMonths || 24;

    // Document verification checks
    const allDocs = [...(customer.documents || []), ...(app.documents || [])];
    const panVerified = allDocs.some((d) => (d.documentType === 'PAN' || d.category === 'IDENTITY') && d.verified);
    const aadhaarVerified = allDocs.some((d) => (d.documentType === 'AADHAAR' || d.category === 'IDENTITY') && d.verified);
    const incomeVerified = allDocs.some((d) => d.category === 'INCOME' && d.verified);
    const bankVerified = allDocs.some((d) => d.category === 'BANK_STATEMENT' && d.verified);
    const allMandatoryDocsVerified = panVerified && aadhaarVerified && (monthlyIncome < 50000 || incomeVerified);

    const missingMandatoryDocs: string[] = [];
    if (!panVerified) missingMandatoryDocs.push('PAN');
    if (!aadhaarVerified) missingMandatoryDocs.push('AADHAAR');
    if (!incomeVerified && monthlyIncome >= 50000) missingMandatoryDocs.push('INCOME_PROOF');

    // Bureau score signals
    const cibilScore = risk?.score || 740;
    const fraudRiskScore = (risk?.factors as any)?.fraudScore || 15;

    // Load bound Product details from Product Engine
    const product = productEngineService.getProductById(tenantId, app.productId);

    const context: DecisionContext = {
      applicationId: app.id,
      applicationNo: app.applicationNo,
      customerId: customer.id,
      customerCode: customer.customerCode,
      tenantId: app.tenantId || tenantId,
      branchId: app.branchId || undefined,

      applicantAge,
      employmentType: (employment?.employmentType as any) || 'SALARIED',
      employerName: employment?.employerName,
      monthlyIncome,
      existingObligations,
      workExperienceMonths: (employment?.workExperienceYears || 2) * 12,
      kycStatus: customer.kycStatus,

      requestedAmount,
      tenureMonths,
      purpose: app.purpose || undefined,

      productId: product.id,
      productCode: product.code,
      productName: product.name,
      productType: product.productType,
      productVersion: product.version,
      interestModel: product.interestModel,
      baseInterestRateAnnualPct: product.baseInterestRateAnnualPct,
      minAmount: product.minAmount,
      maxAmount: product.maxAmount,
      minTenureMonths: product.minTenureMonths,
      maxTenureMonths: product.maxTenureMonths,

      cibilScore,
      cibilOverdueAccounts: 0,
      cibilDPD30Last12m: 0,
      recentEnquiries6m: 1,
      hasWriteOffs: false,
      hasSettlements: false,
      creditUtilizationPct: 22,

      averageBankBalance: customer.bankAccounts?.[0] ? 35000 : 15000,
      bankBounces90d: 0,
      salaryCreditDetected: true,
      negativeBalanceDays90d: 0,

      panVerified,
      aadhaarVerified,
      allMandatoryDocsVerified,
      missingMandatoryDocs,

      fraudRiskScore,
      deviceRiskDetected: false,
      identityMismatchDetected: false,
      duplicateApplicationDetected: false,
    };

    return context;
  }

  // ---------------------------------------------------------------------------
  // 4. RULE EVALUATION ENGINE
  // ---------------------------------------------------------------------------

  private extractFieldValue(context: DecisionContext, fieldPath: string): any {
    if (fieldPath.startsWith('derived.')) {
      const sub = fieldPath.replace('derived.', '');
      return (context.derived as any)?.[sub];
    }
    return (context as any)[fieldPath];
  }

  public evaluateRule(rule: DecisionRule, context: DecisionContext): RuleEvaluationItem {
    const actualValue = this.extractFieldValue(context, rule.field);
    let passed = false;

    if (actualValue === undefined || actualValue === null) {
      if (rule.operator === 'NOT_EXISTS') passed = true;
      else if (rule.operator === 'EQUALS' && rule.expectedValue === null) passed = true;
      else passed = false;
    } else {
      switch (rule.operator) {
        case 'EQUALS':
          passed = actualValue === rule.expectedValue;
          break;
        case 'NOT_EQUALS':
          passed = actualValue !== rule.expectedValue;
          break;
        case 'GREATER_THAN':
          passed = Number(actualValue) > Number(rule.expectedValue);
          break;
        case 'GREATER_THAN_OR_EQUAL':
          passed = Number(actualValue) >= Number(rule.expectedValue);
          break;
        case 'LESS_THAN':
          passed = Number(actualValue) < Number(rule.expectedValue);
          break;
        case 'LESS_THAN_OR_EQUAL':
          passed = Number(actualValue) <= Number(rule.expectedValue);
          break;
        case 'BETWEEN':
          if (Array.isArray(rule.expectedValue) && rule.expectedValue.length === 2) {
            const num = Number(actualValue);
            passed = num >= Number(rule.expectedValue[0]) && num <= Number(rule.expectedValue[1]);
          }
          break;
        case 'IN':
          if (Array.isArray(rule.expectedValue)) {
            passed = rule.expectedValue.includes(actualValue);
          }
          break;
        case 'NOT_IN':
          if (Array.isArray(rule.expectedValue)) {
            passed = !rule.expectedValue.includes(actualValue);
          }
          break;
        case 'EXISTS':
          passed = actualValue !== undefined && actualValue !== null && actualValue !== '';
          break;
        case 'NOT_EXISTS':
          passed = actualValue === undefined || actualValue === null || actualValue === '';
          break;
        case 'CONTAINS':
          passed = String(actualValue).toLowerCase().includes(String(rule.expectedValue).toLowerCase());
          break;
        case 'NOT_CONTAINS':
          passed = !String(actualValue).toLowerCase().includes(String(rule.expectedValue).toLowerCase());
          break;
      }
    }

    const action = passed ? rule.actionOnPass : rule.actionOnFail;

    return {
      ruleId: rule.id,
      ruleCode: rule.code,
      ruleName: rule.name,
      category: rule.category,
      field: rule.field,
      operator: rule.operator,
      expectedValue: rule.expectedValue,
      actualValue,
      passed,
      action,
      severity: rule.severity,
      reasonCode: rule.reasonCode,
      customerReason: rule.customerReason,
      weight: rule.weight || 10,
    };
  }

  // ---------------------------------------------------------------------------
  // 5. DECISION EVALUATION & AGGREGATION
  // ---------------------------------------------------------------------------

  public evaluate(context: DecisionContext, policy: DecisionPolicy): DecisionResult {
    const startTime = Date.now();

    // 1. Compute Derived Financial Metrics
    const fin = financialMetricsService.calculateAllMetrics(
      context.requestedAmount,
      context.tenureMonths,
      context.monthlyIncome,
      context.existingObligations,
      context.baseInterestRateAnnualPct,
      55, // 55% max FOIR cap
      context.minAmount,
      context.maxAmount,
      context.cibilScore >= 750 ? 1.0 : context.cibilScore >= 680 ? 0.85 : 0.65,
      context.interestModel
    );

    context.derived = fin;

    // 2. Evaluate all Rule Groups
    const passedRules: RuleEvaluationItem[] = [];
    const failedRules: RuleEvaluationItem[] = [];
    const referredRules: RuleEvaluationItem[] = [];

    const reasons: string[] = [];
    const customerReasons: string[] = [];
    const conditions: string[] = [];
    const warnings: string[] = [];

    let hasHardStopFailure = false;
    let hasHighFailure = false;
    let hasReferFailure = false;
    let hasCondition = false;

    for (const group of policy.ruleGroups) {
      if (!group.enabled) continue;

      for (const rule of group.rules) {
        if (!rule.enabled) continue;

        const res = this.evaluateRule(rule, context);

        if (res.passed) {
          passedRules.push(res);
          if (res.action === 'CONDITION') {
            hasCondition = true;
            conditions.push(rule.description);
          }
        } else {
          // Failed rule
          if (res.action === 'FAIL') {
            failedRules.push(res);
            if (res.severity === 'HARD_STOP') hasHardStopFailure = true;
            if (res.severity === 'HIGH') hasHighFailure = true;
            reasons.push(`[${res.ruleCode}] ${rule.description} (Actual: ${res.actualValue}, Expected: ${res.operator} ${res.expectedValue})`);
            if (res.customerReason) customerReasons.push(res.customerReason);
          } else if (res.action === 'REFER') {
            referredRules.push(res);
            hasReferFailure = true;
            reasons.push(`[${res.ruleCode}] Underwriter review required: ${rule.description}`);
          } else if (res.action === 'WARNING') {
            warnings.push(`[${res.ruleCode}] ${rule.description}`);
          } else if (res.action === 'CONDITION') {
            hasCondition = true;
            conditions.push(`Condition Required: ${rule.description}`);
          }
        }
      }
    }

    // 3. Compute Risk Score & Risk Grade
    let riskScore = 50; // Neutral baseline
    if (context.cibilScore >= 780) riskScore += 30;
    else if (context.cibilScore >= 720) riskScore += 20;
    else if (context.cibilScore >= 680) riskScore += 10;
    else if (context.cibilScore < 650) riskScore -= 25;

    if (fin.foirPct <= 35) riskScore += 20;
    else if (fin.foirPct <= 45) riskScore += 10;
    else if (fin.foirPct > 55) riskScore -= 15;

    if (context.monthlyIncome >= 75000) riskScore += 15;
    else if (context.monthlyIncome >= 40000) riskScore += 10;

    if (context.bankBounces90d === 0) riskScore += 10;
    else riskScore -= 15;

    if (context.fraudRiskScore <= 20) riskScore += 10;
    else if (context.fraudRiskScore > 40) riskScore -= 30;

    riskScore = Math.max(0, Math.min(100, riskScore));

    let riskGrade: RiskGrade = 'C';
    if (riskScore >= 85) riskGrade = 'A';
    else if (riskScore >= 70) riskGrade = 'B';
    else if (riskScore >= 55) riskGrade = 'C';
    else if (riskScore >= 40) riskGrade = 'D';
    else riskGrade = 'E';

    // 4. Determine Authoritative Decision Outcome
    let decision: DecisionOutcome = 'APPROVE';
    let statusText = 'Application approved by automated decision engine.';

    if (hasHardStopFailure || hasHighFailure || riskGrade === 'E') {
      decision = 'REJECT';
      statusText = 'Application rejected due to policy knockout rule breaches.';
    } else if (hasReferFailure || fin.foirPct > 50 || riskGrade === 'D') {
      decision = 'REFER';
      statusText = 'Application routed to Credit Underwriter queue for manual assessment.';
    } else if (hasCondition || fin.finalEligibleAmount < context.requestedAmount) {
      decision = 'APPROVE_WITH_CONDITIONS';
      statusText = 'Application approved with special sanction conditions / revised limit.';
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      decision,
      status: statusText,
      riskGrade,
      riskScore,
      requestedAmount: context.requestedAmount,
      eligibleAmount: fin.finalEligibleAmount,
      recommendedAmount: Math.min(context.requestedAmount, fin.finalEligibleAmount),
      proposedEmi: fin.proposedEmi,
      foirPct: fin.foirPct,
      dtiPct: fin.dtiPct,
      disposableIncome: fin.disposableIncome,

      reasons,
      customerReasons,
      conditions,
      warnings,

      rulesEvaluatedCount: passedRules.length + failedRules.length + referredRules.length,
      passedCount: passedRules.length,
      failedCount: failedRules.length,
      referredCount: referredRules.length,

      passedRules,
      failedRules,
      referredRules,

      policyId: policy.id,
      policyCode: policy.code,
      policyVersion: policy.version,
      productId: context.productId,
      productVersion: context.productVersion,

      evaluatedAt: new Date().toISOString(),
      executionTimeMs,
    };
  }

  // ---------------------------------------------------------------------------
  // 6. APPLICATION EVALUATION & SNAPSHOT PERSISTENCE
  // ---------------------------------------------------------------------------

  public async evaluateApplication(
    applicationId: string,
    actor?: DecisionActorContext
  ): Promise<DecisionSnapshotRecord> {
    const tenantId = actor?.tenantId || 'tenant-adyapan-default';

    // 1. Build Decision Context
    const context = await this.buildDecisionContext(applicationId, tenantId);

    // 2. Resolve Active Policy for Product
    const policy = this.getActivePolicyForProduct(tenantId, context.productId);

    // 3. Execute BRE Decision Engine
    const decisionResult = this.evaluate(context, policy);

    // 4. Fetch existing decision history for version increment
    const historyKey = `${tenantId}:${applicationId}`;
    const history = this.decisionSnapshots.get(historyKey) || [];
    const decisionVersion = history.length + 1;

    const snapshotId = `dec-${uuid()}`;
    const now = new Date().toISOString();

    const snapshotRecord: DecisionSnapshotRecord = {
      id: snapshotId,
      decisionVersion,
      applicationId,
      tenantId,
      systemDecision: decisionResult.decision,
      finalDecision: decisionResult.decision,
      override: null,
      decisionResult,
      contextSnapshot: context,
      policyVersion: policy.version,
      productVersion: context.productVersion,
      createdAt: now,
      evaluatedBy: actor?.email || actor?.id || 'SYSTEM_BRE',
    };

    history.push(snapshotRecord);
    this.decisionSnapshots.set(historyKey, history);

    // 5. Update Prisma Database (EligibilityAssessment & Application Status)
    try {
      await prisma.eligibilityAssessment.upsert({
        where: { applicationId },
        update: {
          result: decisionResult.decision,
          factors: {
            riskGrade: decisionResult.riskGrade,
            riskScore: decisionResult.riskScore,
            foirPct: decisionResult.foirPct,
            eligibleAmount: decisionResult.eligibleAmount,
            recommendedAmount: decisionResult.recommendedAmount,
            policyVersion: policy.version,
            decisionVersion,
            reasons: decisionResult.reasons,
          } as any,
        },
        create: {
          applicationId,
          result: decisionResult.decision,
          factors: {
            riskGrade: decisionResult.riskGrade,
            riskScore: decisionResult.riskScore,
            foirPct: decisionResult.foirPct,
            eligibleAmount: decisionResult.eligibleAmount,
            recommendedAmount: decisionResult.recommendedAmount,
            policyVersion: policy.version,
            decisionVersion,
            reasons: decisionResult.reasons,
          } as any,
        },
      });

      // Map to Application Status
      let nextStatus = 'UNDER_REVIEW';
      if (decisionResult.decision === 'APPROVE') nextStatus = 'APPROVED';
      else if (decisionResult.decision === 'REJECT') nextStatus = 'REJECTED';
      else if (decisionResult.decision === 'REFER') nextStatus = 'UNDERWRITING';

      await prisma.loanApplication.update({
        where: { id: applicationId },
        data: {
          status: nextStatus as any,
        },
      });
    } catch {
      // safe fallback
    }

    // 6. Audit Logging
    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'SYSTEM',
      action: decisionVersion === 1 ? 'DECISION_EVALUATED' : 'DECISION_REEVALUATED',
      entity: 'DecisionEvaluation',
      entityId: applicationId,
      newValue: {
        decisionVersion,
        decision: decisionResult.decision,
        riskGrade: decisionResult.riskGrade,
        riskScore: decisionResult.riskScore,
        eligibleAmount: decisionResult.eligibleAmount,
        policyVersion: policy.version,
      },
    });

    return snapshotRecord;
  }

  // ---------------------------------------------------------------------------
  // 7. STATELESS SIMULATION
  // ---------------------------------------------------------------------------

  public simulate(
    tenantId: string,
    input: DecisionSimulationInput,
    actor?: DecisionActorContext
  ): DecisionResult {
    let product: any;
    try {
      product = input.productId ? productEngineService.getProductById(tenantId, input.productId) : null;
    } catch {
      // fallback
    }
    if (!product) {
      const activeProducts = productEngineService.listProducts(tenantId, { status: 'ACTIVE' });
      product = activeProducts[0] || productEngineService.listProducts(tenantId)[0];
    }
    const policy = this.getActivePolicyForProduct(tenantId, product?.id);

    const context: DecisionContext = {
      tenantId,
      applicantAge: input.applicantAge || 28,
      employmentType: input.employmentType || 'SALARIED',
      monthlyIncome: input.monthlyIncome || 50000,
      existingObligations: input.existingObligations || 0,
      kycStatus: input.kycVerified ? 'VERIFIED' : 'PENDING',

      requestedAmount: input.loanAmount,
      tenureMonths: input.tenureMonths,

      productId: product.id,
      productCode: product.code,
      productName: product.name,
      productType: product.productType,
      productVersion: product.version,
      interestModel: product.interestModel,
      baseInterestRateAnnualPct: product.baseInterestRateAnnualPct,
      minAmount: product.minAmount,
      maxAmount: product.maxAmount,
      minTenureMonths: product.minTenureMonths,
      maxTenureMonths: product.maxTenureMonths,

      cibilScore: input.cibilScore || 740,
      cibilOverdueAccounts: input.cibilOverdueAccounts || 0,
      cibilDPD30Last12m: input.cibilDPD30Last12m || 0,
      recentEnquiries6m: 1,
      hasWriteOffs: false,
      hasSettlements: false,
      creditUtilizationPct: 25,

      averageBankBalance: input.averageBankBalance || 30000,
      bankBounces90d: input.bankBounces90d || 0,
      salaryCreditDetected: true,
      negativeBalanceDays90d: 0,

      panVerified: input.kycVerified !== false,
      aadhaarVerified: input.kycVerified !== false,
      allMandatoryDocsVerified: input.kycVerified !== false,
      missingMandatoryDocs: input.kycVerified === false ? ['PAN', 'AADHAAR'] : [],

      fraudRiskScore: input.fraudRiskScore || 15,
      deviceRiskDetected: false,
      identityMismatchDetected: false,
      duplicateApplicationDetected: false,
    };

    return this.evaluate(context, policy);
  }

  // ---------------------------------------------------------------------------
  // 8. MANUAL OVERRIDE (Underwriter / Committee)
  // ---------------------------------------------------------------------------

  public async overrideDecision(
    tenantId: string,
    decisionId: string,
    input: { newDecision: DecisionOutcome; reason: string; comments: string },
    actor: DecisionActorContext
  ): Promise<DecisionSnapshotRecord> {
    if (!actor?.roles?.some((r) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER', 'BRANCH_MANAGER'].includes(r))) {
      throw new ForbiddenError('Access Denied: You do not possess authority to manually override credit decisions.');
    }

    if (!input.reason || input.reason.trim().length < 5) {
      throw new BadRequestError('Mandatory override justification reason is required (minimum 5 characters).');
    }

    let targetRecord: DecisionSnapshotRecord | null = null;
    let targetHistory: DecisionSnapshotRecord[] | null = null;

    for (const [key, history] of this.decisionSnapshots.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        const found = history.find((r) => r.id === decisionId);
        if (found) {
          targetRecord = found;
          targetHistory = history;
          break;
        }
      }
    }

    if (!targetRecord || !targetHistory) {
      throw new NotFoundError(`Decision evaluation '${decisionId}' not found.`);
    }

    const now = new Date().toISOString();
    const overrideData: DecisionOverrideData = {
      overriddenBy: actor.email || actor.id || 'UNDERWRITER',
      overrideRole: actor.roles?.[0] || 'UNDERWRITER',
      originalDecision: targetRecord.systemDecision,
      finalDecision: input.newDecision,
      reason: input.reason.trim(),
      comments: input.comments?.trim() || '',
      timestamp: now,
    };

    targetRecord.finalDecision = input.newDecision;
    targetRecord.override = overrideData;

    // Sync to Prisma
    try {
      await prisma.underwritingDecision.upsert({
        where: { applicationId: targetRecord.applicationId },
        update: {
          decision: input.newDecision,
          reason: `OVERRIDE: ${input.reason} (${overrideData.comments})`,
          decidedBy: overrideData.overriddenBy,
        },
        create: {
          applicationId: targetRecord.applicationId,
          decision: input.newDecision,
          reason: `OVERRIDE: ${input.reason}`,
          decidedBy: overrideData.overriddenBy,
        },
      });

      let nextStatus = 'UNDER_REVIEW';
      if (input.newDecision === 'APPROVE') nextStatus = 'APPROVED';
      else if (input.newDecision === 'REJECT') nextStatus = 'REJECTED';
      else if (input.newDecision === 'REFER') nextStatus = 'UNDERWRITING';

      await prisma.loanApplication.update({
        where: { id: targetRecord.applicationId },
        data: { status: nextStatus as any },
      });
    } catch {
      // safe fallback
    }

    await logAudit({
      userId: actor.id,
      tenantId,
      role: actor.roles?.[0] || 'UNDERWRITER',
      action: 'DECISION_OVERRIDDEN',
      entity: 'DecisionEvaluation',
      entityId: targetRecord.applicationId,
      previousValue: { systemDecision: targetRecord.systemDecision },
      newValue: {
        finalDecision: input.newDecision,
        reason: input.reason,
        overriddenBy: overrideData.overriddenBy,
      },
    });

    return targetRecord;
  }

  // ---------------------------------------------------------------------------
  // 9. QUERY METHODS
  // ---------------------------------------------------------------------------

  public getApplicationDecisions(applicationId: string, tenantId: string): DecisionSnapshotRecord[] {
    const history = this.decisionSnapshots.get(`${tenantId}:${applicationId}`) || [];
    return history.sort((a, b) => b.decisionVersion - a.decisionVersion);
  }

  public getDecisionById(decisionId: string, tenantId: string): DecisionSnapshotRecord {
    for (const [key, history] of this.decisionSnapshots.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        const found = history.find((r) => r.id === decisionId);
        if (found) return found;
      }
    }
    throw new NotFoundError(`Decision record '${decisionId}' not found.`);
  }
}

export const decisionEngineService = DecisionEngineService.getInstance();
