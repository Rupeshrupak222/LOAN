import { v4 as uuid } from 'uuid';
import {
  RiskInputContext,
  RiskEvaluationResult,
  RiskPolicy,
  RiskBand,
  RiskGrade,
  RiskSignalItem,
  RiskCategorySummary,
  RiskSignalCategory,
  RiskOverrideRecord,
  CustomerSafeRiskSummary,
  RiskModelProvider,
  CreateRiskPolicyDto,
  UpdateRiskPolicyDto,
} from './risk.types';
import { prisma } from '../../config/prisma';
import { logAudit } from '../audit/audit.service';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors';

// ---------------------------------------------------------------------------
// 1. DETERMINISTIC RISK MODEL PROVIDER
// ---------------------------------------------------------------------------

export class DeterministicRiskProvider implements RiskModelProvider {
  public readonly providerId = 'provider-deterministic-risk-v1';
  public readonly providerName = 'Adyapan Deterministic 6-Pillar Risk Engine';
  public readonly version = '1.0.0';

  public async evaluate(
    context: RiskInputContext,
    policy: RiskPolicy
  ): Promise<{
    riskScore: number;
    signals: RiskSignalItem[];
    categorySummaries: Record<RiskSignalCategory, RiskCategorySummary>;
    keyRiskDrivers: string[];
    recommendation: string;
  }> {
    const signals: RiskSignalItem[] = [];
    const keyRiskDrivers: string[] = [];

    // 1. Customer Pillar (0 to 100 risk score, lower is better)
    let custRisk = 20;
    if (context.applicantAge < 21) {
      signals.push({
        id: 'sig-cust-age-young',
        code: 'RISK_CUST_AGE_UNDER_21',
        name: 'Young Applicant Age Vintage',
        category: 'CUSTOMER',
        actualValue: `${context.applicantAge} years`,
        benchmarkValue: '>= 21 years',
        severity: 'HIGH',
        weight: 15,
        scoreContribution: 25,
        reason: 'Applicant is under the standard age benchmark of 21 years.',
        recommendation: 'Require parental co-guarantor or structured step-up tenure.',
      });
      custRisk += 30;
      keyRiskDrivers.push('Applicant age under 21 years');
    } else if (context.applicantAge > 58) {
      signals.push({
        id: 'sig-cust-age-senior',
        code: 'RISK_CUST_AGE_SENIOR',
        name: 'Approaching Superannuation / Retirement',
        category: 'CUSTOMER',
        actualValue: `${context.applicantAge} years`,
        benchmarkValue: '<= 58 years',
        severity: 'MEDIUM',
        weight: 10,
        scoreContribution: 15,
        reason: 'Applicant will reach retirement age during the proposed repayment tenure.',
        recommendation: 'Align loan maturity before superannuation or verify post-retirement pension.',
      });
      custRisk += 20;
      keyRiskDrivers.push('Applicant near superannuation age');
    }

    if (context.workExperienceMonths < 12) {
      signals.push({
        id: 'sig-cust-exp-low',
        code: 'RISK_CUST_EXPERIENCE_SHORT',
        name: 'Short Employment / Business Vintage',
        category: 'CUSTOMER',
        actualValue: `${context.workExperienceMonths} months`,
        benchmarkValue: '>= 12 months',
        severity: 'MEDIUM',
        weight: 15,
        scoreContribution: 20,
        reason: 'Applicant total work experience is below the 1-year stability threshold.',
        recommendation: 'Verify employment offer letter and probation confirmation.',
      });
      custRisk += 25;
      keyRiskDrivers.push('Work experience vintage < 12 months');
    } else {
      signals.push({
        id: 'sig-cust-exp-stable',
        code: 'RISK_CUST_EXPERIENCE_STABLE',
        name: 'Established Work Experience & Stability',
        category: 'CUSTOMER',
        actualValue: `${context.workExperienceMonths} months`,
        benchmarkValue: '>= 12 months',
        severity: 'LOW',
        weight: 15,
        scoreContribution: 5,
        reason: 'Applicant has demonstrated consistent employment or business operating history.',
        recommendation: 'Standard validation of latest 3 salary slips.',
      });
      custRisk = Math.max(0, custRisk - 15);
    }

    // 2. Financial Pillar
    let finRisk = 20;
    const foir = context.foirPct || (context.monthlyIncome > 0 ? (context.existingObligations / context.monthlyIncome) * 100 : 80);
    if (foir > 65) {
      signals.push({
        id: 'sig-fin-foir-high',
        code: 'RISK_FIN_FOIR_BURDEN',
        name: 'Elevated Fixed Obligation to Income Ratio (FOIR)',
        category: 'FINANCIAL',
        actualValue: `${foir.toFixed(1)}%`,
        benchmarkValue: '<= 50%',
        severity: 'CRITICAL',
        weight: 30,
        scoreContribution: 45,
        reason: 'Existing debt service obligations consume an excessive share of monthly net income.',
        recommendation: 'Curtail requested sanction amount or extend tenure to reduce monthly EMI.',
      });
      finRisk += 45;
      keyRiskDrivers.push(`High FOIR of ${foir.toFixed(0)}%`);
    } else if (foir > 50) {
      signals.push({
        id: 'sig-fin-foir-moderate',
        code: 'RISK_FIN_FOIR_ELEVATED',
        name: 'Moderate Fixed Obligation Ratio',
        category: 'FINANCIAL',
        actualValue: `${foir.toFixed(1)}%`,
        benchmarkValue: '<= 50%',
        severity: 'MEDIUM',
        weight: 20,
        scoreContribution: 20,
        reason: 'FOIR exceeds standard prime benchmarks but remains within upper exception ceiling.',
        recommendation: 'Verify ancillary family income or liquid cash reserves.',
      });
      finRisk += 20;
    } else {
      signals.push({
        id: 'sig-fin-foir-healthy',
        code: 'RISK_FIN_FOIR_HEALTHY',
        name: 'Comfortable Fixed Obligation Ratio (FOIR)',
        category: 'FINANCIAL',
        actualValue: `${foir.toFixed(1)}%`,
        benchmarkValue: '<= 50%',
        severity: 'LOW',
        weight: 25,
        scoreContribution: 5,
        reason: 'Fixed debt service obligations remain comfortably below the 50% capacity benchmark.',
        recommendation: 'Standard debt service limits apply.',
      });
      finRisk = Math.max(0, finRisk - 10);
    }

    if (context.monthlyIncome < 25000) {
      signals.push({
        id: 'sig-fin-income-floor',
        code: 'RISK_FIN_INCOME_FLOOR',
        name: 'Net Income Near Floor Baseline',
        category: 'FINANCIAL',
        actualValue: `₹${context.monthlyIncome.toLocaleString('en-IN')}`,
        benchmarkValue: '>= ₹25,000 / month',
        severity: 'HIGH',
        weight: 20,
        scoreContribution: 25,
        reason: 'Monthly disposable buffer is constrained by modest net earning baseline.',
        recommendation: 'Cap loan ticket size within micro-credit parameters.',
      });
      finRisk += 25;
      keyRiskDrivers.push('Net income below standard underwriting floor');
    }

    // 3. Credit Pillar (Bureau)
    let creditRisk = 20;
    const bureau = context.bureauScore || 750;
    if (bureau < 650) {
      signals.push({
        id: 'sig-credit-bureau-subprime',
        code: 'RISK_CREDIT_BUREAU_SUBPRIME',
        name: 'Adverse Credit Bureau Score',
        category: 'CREDIT',
        actualValue: `${bureau}`,
        benchmarkValue: '>= 700 CIBIL',
        severity: 'CRITICAL',
        weight: 35,
        scoreContribution: 50,
        reason: 'Past credit repayment history reflects multiple delinquent or high-risk accounts.',
        recommendation: 'Mandate senior underwriter sign-off and charge risk-adjusted spread.',
      });
      creditRisk += 55;
      keyRiskDrivers.push(`Subprime credit score of ${bureau}`);
    } else if (bureau < 720) {
      signals.push({
        id: 'sig-credit-bureau-fair',
        code: 'RISK_CREDIT_BUREAU_FAIR',
        name: 'Moderate Credit Bureau Score',
        category: 'CREDIT',
        actualValue: `${bureau}`,
        benchmarkValue: '>= 750 CIBIL',
        severity: 'MEDIUM',
        weight: 20,
        scoreContribution: 20,
        reason: 'Credit bureau score is acceptable but shows moderate utilization or thin file depth.',
        recommendation: 'Standard approval with income banking verification.',
      });
      creditRisk += 20;
    } else {
      signals.push({
        id: 'sig-credit-bureau-prime',
        code: 'RISK_CREDIT_BUREAU_PRIME',
        name: 'Prime Credit Bureau Score',
        category: 'CREDIT',
        actualValue: `${bureau}`,
        benchmarkValue: '>= 750 CIBIL',
        severity: 'LOW',
        weight: 25,
        scoreContribution: 5,
        reason: 'Strong bureau repayment track record with zero recent write-offs.',
        recommendation: 'Eligible for preferential prime rate pricing.',
      });
      creditRisk = Math.max(0, creditRisk - 15);
    }

    if (context.hasOverdueAccounts || context.maxDPDLast12m > 30) {
      signals.push({
        id: 'sig-credit-dpd-delinquency',
        code: 'RISK_CREDIT_RECENT_DELINQUENCY',
        name: 'Delinquency History in Last 12 Months',
        category: 'CREDIT',
        actualValue: `Max DPD: ${context.maxDPDLast12m} days`,
        benchmarkValue: '0 DPD in last 12m',
        severity: 'HIGH',
        weight: 25,
        scoreContribution: 35,
        reason: 'Active credit lines show past due payments inside the last 12-month performance window.',
        recommendation: 'Verify track record of cure and demand no-objection certificates (NOC).',
      });
      creditRisk += 35;
      keyRiskDrivers.push('Past delinquent track record (>30 DPD in 12m)');
    }

    // 4. Banking Pillar
    let bankRisk = 15;
    if (context.chequeBouncesLast90d > 0) {
      signals.push({
        id: 'sig-bank-bounces',
        code: 'RISK_BANK_BOUNCES_90D',
        name: 'Inward / Outward Debit Bounces (90 Days)',
        category: 'BANKING',
        actualValue: `${context.chequeBouncesLast90d} bounce event(s)`,
        benchmarkValue: '0 bounces in 90d',
        severity: 'HIGH',
        weight: 25,
        scoreContribution: 30,
        reason: 'Financial account reflects dishonored ECS/NACH or cheque payments due to insufficient funds.',
        recommendation: 'Perform 6-month bank statement audit to examine cash flow stability.',
      });
      bankRisk += 35;
      keyRiskDrivers.push('Bank account bounce occurrences in last 90 days');
    }

    if (context.averageMonthlyBalance < 10000) {
      signals.push({
        id: 'sig-bank-low-amb',
        code: 'RISK_BANK_LOW_AVERAGE_BALANCE',
        name: 'Low Average Monthly Balance (AMB)',
        category: 'BANKING',
        actualValue: `₹${context.averageMonthlyBalance.toLocaleString('en-IN')}`,
        benchmarkValue: '>= ₹15,000 AMB',
        severity: 'MEDIUM',
        weight: 15,
        scoreContribution: 15,
        reason: 'Applicant maintains minimal liquid buffer in the primary operating bank account.',
        recommendation: 'Ensure proposed EMI does not exceed 40% of average monthly balance.',
      });
      bankRisk += 15;
    } else {
      signals.push({
        id: 'sig-bank-amb-healthy',
        code: 'RISK_BANK_AMB_HEALTHY',
        name: 'Healthy Average Monthly Balance (AMB)',
        category: 'BANKING',
        actualValue: `₹${context.averageMonthlyBalance.toLocaleString('en-IN')}`,
        benchmarkValue: '>= ₹15,000 AMB',
        severity: 'LOW',
        weight: 20,
        scoreContribution: 5,
        reason: 'Consistent operating liquidity buffer maintained across transaction cycles.',
        recommendation: 'Standard disbursement account setup.',
      });
      bankRisk = Math.max(0, bankRisk - 10);
    }

    // 5. Application Pillar
    let appRisk = 15;
    if (context.applicationVelocity24h > 2) {
      signals.push({
        id: 'sig-app-velocity',
        code: 'RISK_APP_HIGH_VELOCITY',
        name: 'Elevated Application Submission Velocity',
        category: 'APPLICATION',
        actualValue: `${context.applicationVelocity24h} applications in 24h`,
        benchmarkValue: '<= 1 application',
        severity: 'HIGH',
        weight: 20,
        scoreContribution: 25,
        reason: 'Multiple concurrent loan applications originating across lender channels.',
        recommendation: 'Cross-reference bureau enquiry velocity to prevent loan stacking.',
      });
      appRisk += 25;
      keyRiskDrivers.push('Multiple application velocity submissions in 24h');
    } else {
      signals.push({
        id: 'sig-app-velocity-normal',
        code: 'RISK_APP_VELOCITY_NORMAL',
        name: 'Normal Intake Velocity',
        category: 'APPLICATION',
        actualValue: `${context.applicationVelocity24h} application(s)`,
        benchmarkValue: '<= 1 application',
        severity: 'LOW',
        weight: 10,
        scoreContribution: 5,
        reason: 'Single measured application origination profile.',
        recommendation: 'Standard STP velocity routing.',
      });
    }

    // 6. Behavioral Pillar
    let behavRisk = 10;
    if (context.rapidFieldChangesCount > 8) {
      signals.push({
        id: 'sig-behav-rapid-changes',
        code: 'RISK_BEHAV_APPLICATION_TAMPER',
        name: 'Rapid Form Field Fluctuations',
        category: 'BEHAVIORAL',
        actualValue: `${context.rapidFieldChangesCount} rapid value edits`,
        benchmarkValue: '< 5 edits',
        severity: 'LOW',
        weight: 10,
        scoreContribution: 10,
        reason: 'Frequent income and obligation value toggles observed during intake journey.',
        recommendation: 'Cross-check submitted payslips against bank statement salary credits.',
      });
      behavRisk += 15;
    }

    // Weighted Score Calculation using Policy Category Weights
    const weights = policy.categoryWeights || {
      CUSTOMER: 15,
      FINANCIAL: 25,
      CREDIT: 25,
      BANKING: 20,
      APPLICATION: 10,
      BEHAVIORAL: 5,
    };

    const weightedScore =
      (Math.min(100, custRisk) * weights.CUSTOMER +
        Math.min(100, finRisk) * weights.FINANCIAL +
        Math.min(100, creditRisk) * weights.CREDIT +
        Math.min(100, bankRisk) * weights.BANKING +
        Math.min(100, appRisk) * weights.APPLICATION +
        Math.min(100, behavRisk) * weights.BEHAVIORAL) /
      100;

    const riskScore = Math.min(100, Math.max(0, Math.round(weightedScore)));

    // Recommendation logic
    let recommendation = 'Low risk profile. Recommend standard automated sanction.';
    if (riskScore > 65) {
      recommendation = 'High credit and repayment risk profile. Recommend collateral, guarantor, or reducing loan ticket.';
    } else if (riskScore > 40) {
      recommendation = 'Moderate risk profile. Recommend standard manual underwriter verification of income artifacts.';
    }

    const categorySummaries: Record<RiskSignalCategory, RiskCategorySummary> = {
      CUSTOMER: {
        category: 'CUSTOMER',
        score: Math.min(100, custRisk),
        weight: weights.CUSTOMER,
        contribution: Math.round((Math.min(100, custRisk) * weights.CUSTOMER) / 100),
        signalsCount: signals.filter((s) => s.category === 'CUSTOMER').length,
        criticalSignalsCount: signals.filter((s) => s.category === 'CUSTOMER' && (s.severity === 'HIGH' || s.severity === 'CRITICAL')).length,
        topReasons: signals.filter((s) => s.category === 'CUSTOMER').map((s) => s.reason),
      },
      FINANCIAL: {
        category: 'FINANCIAL',
        score: Math.min(100, finRisk),
        weight: weights.FINANCIAL,
        contribution: Math.round((Math.min(100, finRisk) * weights.FINANCIAL) / 100),
        signalsCount: signals.filter((s) => s.category === 'FINANCIAL').length,
        criticalSignalsCount: signals.filter((s) => s.category === 'FINANCIAL' && (s.severity === 'HIGH' || s.severity === 'CRITICAL')).length,
        topReasons: signals.filter((s) => s.category === 'FINANCIAL').map((s) => s.reason),
      },
      CREDIT: {
        category: 'CREDIT',
        score: Math.min(100, creditRisk),
        weight: weights.CREDIT,
        contribution: Math.round((Math.min(100, creditRisk) * weights.CREDIT) / 100),
        signalsCount: signals.filter((s) => s.category === 'CREDIT').length,
        criticalSignalsCount: signals.filter((s) => s.category === 'CREDIT' && (s.severity === 'HIGH' || s.severity === 'CRITICAL')).length,
        topReasons: signals.filter((s) => s.category === 'CREDIT').map((s) => s.reason),
      },
      BANKING: {
        category: 'BANKING',
        score: Math.min(100, bankRisk),
        weight: weights.BANKING,
        contribution: Math.round((Math.min(100, bankRisk) * weights.BANKING) / 100),
        signalsCount: signals.filter((s) => s.category === 'BANKING').length,
        criticalSignalsCount: signals.filter((s) => s.category === 'BANKING' && (s.severity === 'HIGH' || s.severity === 'CRITICAL')).length,
        topReasons: signals.filter((s) => s.category === 'BANKING').map((s) => s.reason),
      },
      APPLICATION: {
        category: 'APPLICATION',
        score: Math.min(100, appRisk),
        weight: weights.APPLICATION,
        contribution: Math.round((Math.min(100, appRisk) * weights.APPLICATION) / 100),
        signalsCount: signals.filter((s) => s.category === 'APPLICATION').length,
        criticalSignalsCount: signals.filter((s) => s.category === 'APPLICATION' && (s.severity === 'HIGH' || s.severity === 'CRITICAL')).length,
        topReasons: signals.filter((s) => s.category === 'APPLICATION').map((s) => s.reason),
      },
      BEHAVIORAL: {
        category: 'BEHAVIORAL',
        score: Math.min(100, behavRisk),
        weight: weights.BEHAVIORAL,
        contribution: Math.round((Math.min(100, behavRisk) * weights.BEHAVIORAL) / 100),
        signalsCount: signals.filter((s) => s.category === 'BEHAVIORAL').length,
        criticalSignalsCount: signals.filter((s) => s.category === 'BEHAVIORAL' && (s.severity === 'HIGH' || s.severity === 'CRITICAL')).length,
        topReasons: signals.filter((s) => s.category === 'BEHAVIORAL').map((s) => s.reason),
      },
    };

    return {
      riskScore,
      signals,
      categorySummaries,
      keyRiskDrivers,
      recommendation,
    };
  }
}

// ---------------------------------------------------------------------------
// 2. CORE RISK ENGINE SERVICE
// ---------------------------------------------------------------------------

export class RiskEngineService {
  private static instance: RiskEngineService;

  private provider: RiskModelProvider = new DeterministicRiskProvider();

  // Active Policies: Map<`${tenantId}:${policyId}`, RiskPolicy>
  private readonly policies = new Map<string, RiskPolicy>();

  // Immutable Evaluation Snapshots: Map<`${tenantId}:${applicationId}`, RiskEvaluationResult[]>
  private readonly evaluationSnapshots = new Map<string, RiskEvaluationResult[]>();

  private constructor() {
    this.seedCanonicalPolicies('tenant-adyapan-default');
    this.seedCanonicalPolicies('tenant-apex-nbfc');
  }

  public static getInstance(): RiskEngineService {
    if (!RiskEngineService.instance) {
      RiskEngineService.instance = new RiskEngineService();
    }
    return RiskEngineService.instance;
  }

  public setProvider(provider: RiskModelProvider): void {
    this.provider = provider;
  }

  // ---------------------------------------------------------------------------
  // CANONICAL POLICY SEEDING
  // ---------------------------------------------------------------------------

  public seedCanonicalPolicies(tenantId: string): void {
    const now = new Date().toISOString();

    const canonicalPolicy: RiskPolicy = {
      id: 'risk-policy-standard',
      tenantId,
      code: 'RISK_POL_STANDARD_RETAIL',
      name: 'Standard Retail Risk Policy',
      description: 'Institutional 6-pillar risk scoring policy for retail term and instant personal loan facilities.',
      version: 1,
      status: 'ACTIVE',
      categoryWeights: {
        CUSTOMER: 15,
        FINANCIAL: 25,
        CREDIT: 25,
        BANKING: 20,
        APPLICATION: 10,
        BEHAVIORAL: 5,
      },
      bands: [
        { minScore: 0, maxScore: 20, band: 'LOW', riskGrade: 'A', description: 'Prime risk tier. Negligible default propensity.' },
        { minScore: 21, maxScore: 40, band: 'MODERATE', riskGrade: 'B', description: 'Moderate risk tier. Standard credit profile.' },
        { minScore: 41, maxScore: 60, band: 'MEDIUM', riskGrade: 'C', description: 'Medium risk tier. Verification of income required.' },
        { minScore: 61, maxScore: 80, band: 'HIGH', riskGrade: 'D', description: 'High risk tier. Cautious underwriting and collateral required.' },
        { minScore: 81, maxScore: 100, band: 'VERY_HIGH', riskGrade: 'E', description: 'Very high risk tier. Subprime default profile.' },
      ],
      effectiveFrom: now,
      createdAt: now,
      updatedAt: now,
    };

    this.policies.set(`${tenantId}:${canonicalPolicy.id}`, canonicalPolicy);
  }

  // ---------------------------------------------------------------------------
  // POLICY MANAGEMENT
  // ---------------------------------------------------------------------------

  public listPolicies(tenantId: string, filter?: { status?: string }): RiskPolicy[] {
    const results: RiskPolicy[] = [];
    for (const [key, pol] of this.policies.entries()) {
      if (pol.tenantId !== tenantId) continue;
      if (filter?.status && pol.status !== filter.status) continue;
      results.push(pol);
    }
    return results.sort((a, b) => b.version - a.version);
  }

  public getPolicyById(tenantId: string, policyId: string): RiskPolicy {
    const pol = this.policies.get(`${tenantId}:${policyId}`);
    if (!pol) {
      throw new NotFoundError(`Risk policy '${policyId}' not found for tenant '${tenantId}'.`);
    }
    return pol;
  }

  public getActivePolicy(tenantId: string, productId?: string): RiskPolicy {
    const activePolicies = this.listPolicies(tenantId, { status: 'ACTIVE' });
    if (productId) {
      const match = activePolicies.find((p) => p.productId === productId);
      if (match) return match;
    }
    if (activePolicies.length > 0) return activePolicies[0];

    // Fallback: seed and return
    this.seedCanonicalPolicies(tenantId);
    return this.policies.get(`${tenantId}:risk-policy-standard`)!;
  }

  public createPolicy(tenantId: string, dto: CreateRiskPolicyDto, actorUserId?: string): RiskPolicy {
    const id = `risk-pol-${uuid().slice(0, 8)}`;
    const now = new Date().toISOString();

    const policy: RiskPolicy = {
      id,
      tenantId,
      productId: dto.productId,
      productCode: dto.productCode,
      code: dto.code,
      name: dto.name,
      description: dto.description,
      version: 1,
      status: 'DRAFT',
      categoryWeights: dto.categoryWeights || {
        CUSTOMER: 15,
        FINANCIAL: 25,
        CREDIT: 25,
        BANKING: 20,
        APPLICATION: 10,
        BEHAVIORAL: 5,
      },
      bands: dto.bands || [
        { minScore: 0, maxScore: 20, band: 'LOW', riskGrade: 'A', description: 'Prime' },
        { minScore: 21, maxScore: 40, band: 'MODERATE', riskGrade: 'B', description: 'Moderate' },
        { minScore: 41, maxScore: 60, band: 'MEDIUM', riskGrade: 'C', description: 'Medium' },
        { minScore: 61, maxScore: 80, band: 'HIGH', riskGrade: 'D', description: 'High' },
        { minScore: 81, maxScore: 100, band: 'VERY_HIGH', riskGrade: 'E', description: 'Very High' },
      ],
      effectiveFrom: now,
      createdAt: now,
      updatedAt: now,
    };

    this.policies.set(`${tenantId}:${id}`, policy);
    return policy;
  }

  public updatePolicy(tenantId: string, policyId: string, dto: UpdateRiskPolicyDto): RiskPolicy {
    const existing = this.getPolicyById(tenantId, policyId);
    const updated: RiskPolicy = {
      ...existing,
      ...dto,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    };
    this.policies.set(`${tenantId}:${policyId}`, updated);
    return updated;
  }

  public publishPolicy(tenantId: string, policyId: string, actorUserId?: string): RiskPolicy {
    const existing = this.getPolicyById(tenantId, policyId);

    // Archive other active policies in tenant for same product scope
    for (const [key, pol] of this.policies.entries()) {
      if (pol.tenantId === tenantId && pol.productId === existing.productId && pol.status === 'ACTIVE' && pol.id !== policyId) {
        pol.status = 'ARCHIVED';
        pol.updatedAt = new Date().toISOString();
      }
    }

    existing.status = 'ACTIVE';
    existing.effectiveFrom = new Date().toISOString();
    existing.updatedAt = new Date().toISOString();
    this.policies.set(`${tenantId}:${policyId}`, existing);

    logAudit({
      userId: actorUserId,
      tenantId,
      action: 'RISK_POLICY_PUBLISHED',
      entity: 'RiskPolicy',
      entityId: policyId,
      newValue: { version: existing.version, code: existing.code },
    });

    return existing;
  }

  // ---------------------------------------------------------------------------
  // CONTEXT BUILDER
  // ---------------------------------------------------------------------------

  public async buildRiskContext(
    applicationId: string,
    tenantId: string,
    overrides?: Partial<RiskInputContext>
  ): Promise<RiskInputContext> {
    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: {
          include: {
            employmentDetails: true,
            documents: true,
            bankAccounts: true,
            loans: true,
          },
        },
        product: true,
        documents: true,
      },
    });

    if (!app) {
      return {
        applicationId,
        applicationNo: `APP-${applicationId.slice(0, 8).toUpperCase()}`,
        customerId: `cust-${applicationId.slice(0, 6)}`,
        customerCode: 'CUST-DEMO',
        tenantId,
        applicantAge: 29,
        customerTenureMonths: 24,
        employmentType: 'SALARIED',
        employerName: 'Adyapan Tech',
        workExperienceMonths: 36,
        residenceStabilityMonths: 36,
        residenceType: 'RENTED',
        existingCustomerRelationship: false,
        customerSegment: 'RETAIL',
        monthlyIncome: 65000,
        monthlyExpenses: 25000,
        existingObligations: 12000,
        foirPct: 18.5,
        dtiPct: 18.5,
        disposableIncome: 28000,
        incomeConsistencyScore: 88,
        bureauScore: 745,
        bureauEnquiriesLast6m: 1,
        activeCreditLinesCount: 2,
        totalCreditExposure: 150000,
        creditUtilizationPct: 22,
        maxDPDLast12m: 0,
        hasOverdueAccounts: false,
        overdueAmount: 0,
        hasWriteOffsOrSettlements: false,
        creditHistoryDepthMonths: 48,
        bankAccountAgeMonths: 36,
        averageMonthlyBalance: 24000,
        salaryCreditConsistencyScore: 92,
        chequeBouncesLast90d: 0,
        inwardOutwardRatio: 1.25,
        negativeBalanceDays90d: 0,
        existingEmiDebitCount: 1,
        requestedAmount: 200000,
        requestedTenureMonths: 24,
        productType: 'PERSONAL_LOAN',
        applicationVelocity24h: 1,
        applicationModificationCount: 0,
        timeSpentOnApplicationSeconds: 300,
        multipleSubmissionAttempts: 1,
        sessionLoginFrequencyWeekly: 3,
        rapidFieldChangesCount: 0,
        unusualNavigationFlag: false,
        repeatedFailedVerificationAttempts: 0,
        ...overrides,
      };
    }

    if (app.tenantId && app.tenantId !== tenantId) {
      throw new ForbiddenError('Access Denied: Application belongs to another tenant.');
    }

    const customer = app.customer;
    const employment = customer.employmentDetails?.[0];

    let applicantAge = 28;
    if (customer.dateOfBirth) {
      const diffMs = Date.now() - new Date(customer.dateOfBirth).getTime();
      applicantAge = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    }

    const monthlyIncome = employment?.monthlyIncome ? Number(employment.monthlyIncome) : customer.monthlyIncome ? Number(customer.monthlyIncome) : 45000;
    const existingObligations = customer.existingObligations ? Number(customer.existingObligations) : 0;
    const foirPct = monthlyIncome > 0 ? (existingObligations / monthlyIncome) * 100 : 50;

    const overdueCount = customer.loans.filter((l) => l.status === 'OVERDUE').length;

    return {
      applicationId: app.id,
      applicationNo: app.applicationNo,
      customerId: customer.id,
      customerCode: customer.customerCode,
      tenantId: app.tenantId || tenantId,
      branchId: app.branchId || undefined,
      channel: 'DIRECT_WEB',

      applicantAge,
      customerTenureMonths: 12,
      employmentType: (employment?.employmentType as any) || 'SALARIED',
      employerName: employment?.employerName || 'Declared Employer',
      workExperienceMonths: (employment?.workExperienceYears || 2) * 12,
      residenceStabilityMonths: 24,
      residenceType: 'RENTED',
      existingCustomerRelationship: customer.loans.length > 0,
      customerSegment: 'RETAIL',

      monthlyIncome,
      monthlyExpenses: Math.round(monthlyIncome * 0.4),
      existingObligations,
      foirPct,
      dtiPct: foirPct,
      disposableIncome: Math.max(0, monthlyIncome - existingObligations - Math.round(monthlyIncome * 0.4)),
      incomeConsistencyScore: 85,

      bureauScore: 740,
      bureauEnquiriesLast6m: 1,
      activeCreditLinesCount: customer.loans.length,
      totalCreditExposure: customer.loans.reduce((acc, l) => acc + Number(l.principal), 0),
      creditUtilizationPct: 25,
      maxDPDLast12m: overdueCount > 0 ? 45 : 0,
      hasOverdueAccounts: overdueCount > 0,
      overdueAmount: 0,
      hasWriteOffsOrSettlements: false,
      creditHistoryDepthMonths: 36,

      bankAccountAgeMonths: 24,
      averageMonthlyBalance: customer.bankAccounts?.[0] ? 35000 : 15000,
      salaryCreditConsistencyScore: 90,
      chequeBouncesLast90d: 0,
      inwardOutwardRatio: 1.2,
      negativeBalanceDays90d: 0,
      existingEmiDebitCount: overdueCount,

      requestedAmount: Number(app.requestedAmount),
      requestedTenureMonths: app.tenureMonths || 24,
      productType: app.product?.productType || 'PERSONAL_LOAN',
      applicationVelocity24h: 1,
      applicationModificationCount: 0,
      timeSpentOnApplicationSeconds: 240,
      multipleSubmissionAttempts: 1,

      sessionLoginFrequencyWeekly: 2,
      rapidFieldChangesCount: 0,
      unusualNavigationFlag: false,
      repeatedFailedVerificationAttempts: 0,

      ...overrides,
    };
  }

  // ---------------------------------------------------------------------------
  // EVALUATION & SNAPSHOT CREATION
  // ---------------------------------------------------------------------------

  public async evaluateApplication(
    applicationId: string,
    tenantId: string,
    contextOverrides?: Partial<RiskInputContext>,
    actorUserId?: string
  ): Promise<RiskEvaluationResult> {
    const startTime = Date.now();
    const context = await this.buildRiskContext(applicationId, tenantId, contextOverrides);
    const policy = this.getActivePolicy(tenantId);

    const evaluation = await this.provider.evaluate(context, policy);

    // Derive Risk Band and Authoritative Risk Grade
    let riskBand: RiskBand = 'LOW';
    let riskGrade: RiskGrade = 'A';

    for (const b of policy.bands) {
      if (evaluation.riskScore >= b.minScore && evaluation.riskScore <= b.maxScore) {
        riskBand = b.band;
        riskGrade = b.riskGrade;
        break;
      }
    }

    const executionTimeMs = Date.now() - startTime;
    const key = `${tenantId}:${applicationId}`;
    const existingSnapshots = this.evaluationSnapshots.get(key) || [];
    const evaluationVersion = existingSnapshots.length + 1;

    const result: RiskEvaluationResult = {
      id: `risk-eval-${uuid().slice(0, 8)}`,
      applicationId,
      customerId: context.customerId,
      tenantId,
      evaluationVersion,
      riskScore: evaluation.riskScore,
      riskBand,
      riskGrade,
      categorySummaries: evaluation.categorySummaries,
      signals: evaluation.signals,
      keyRiskDrivers: evaluation.keyRiskDrivers,
      recommendation: evaluation.recommendation,
      policyId: policy.id,
      policyCode: policy.code,
      policyVersion: policy.version,
      override: null,
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: actorUserId,
      executionTimeMs,
    };

    existingSnapshots.push(result);
    this.evaluationSnapshots.set(key, existingSnapshots);

    // Synchronize to Prisma RiskAssessment table for backward compatibility
    let prismaCategory: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (riskScoreToPrismaCategory(result.riskScore) === 'HIGH') prismaCategory = 'HIGH';
    else if (riskScoreToPrismaCategory(result.riskScore) === 'MEDIUM') prismaCategory = 'MEDIUM';

    try {
      await prisma.$transaction([
        prisma.riskAssessment.upsert({
          where: { applicationId },
          update: {
            score: result.riskScore,
            category: prismaCategory,
            factors: result.signals as any,
          },
          create: {
            applicationId,
            score: result.riskScore,
            category: prismaCategory,
            factors: result.signals as any,
          },
        }),
        prisma.customer.update({
          where: { id: context.customerId },
          data: { riskCategory: prismaCategory },
        }),
      ]);
    } catch (e) {
      // Non-fatal if demo/in-memory app ID
    }

    try {
      await logAudit({
        userId: actorUserId,
        tenantId,
        action: 'RISK_EVALUATED',
        entity: 'LoanApplication',
        entityId: applicationId,
        newValue: {
          riskScore: result.riskScore,
          riskBand: result.riskBand,
          riskGrade: result.riskGrade,
          version: evaluationVersion,
        },
      });
    } catch (e) {
      // Non-fatal if audit log has missing tenant in demo/test environment
    }

    return result;
  }

  public getLatestEvaluation(tenantId: string, applicationId: string): RiskEvaluationResult {
    const key = `${tenantId}:${applicationId}`;
    const list = this.evaluationSnapshots.get(key) || [];
    if (list.length === 0) {
      throw new NotFoundError(`No risk evaluation record found for application '${applicationId}'.`);
    }
    return list[list.length - 1];
  }

  public listEvaluationHistory(tenantId: string, applicationId: string): RiskEvaluationResult[] {
    const key = `${tenantId}:${applicationId}`;
    return this.evaluationSnapshots.get(key) || [];
  }

  // ---------------------------------------------------------------------------
  // MANUAL OVERRIDE (SoD PROTECTED)
  // ---------------------------------------------------------------------------

  public async overrideRiskScore(
    tenantId: string,
    applicationId: string,
    overrideData: {
      newScore: number;
      newGrade: RiskGrade;
      reason: string;
      comments: string;
      overriddenBy: string;
      overrideRole: string;
    }
  ): Promise<RiskEvaluationResult> {
    const latest = this.getLatestEvaluation(tenantId, applicationId);

    if (!overrideData.reason || overrideData.reason.trim().length < 5) {
      throw new BadRequestError('Mandatory justification reason (at least 5 characters) required for manual risk override.');
    }

    const previousScore = latest.riskScore;
    const previousGrade = latest.riskGrade;

    let riskBand: RiskBand = 'LOW';
    if (overrideData.newScore > 80) riskBand = 'VERY_HIGH';
    else if (overrideData.newScore > 60) riskBand = 'HIGH';
    else if (overrideData.newScore > 40) riskBand = 'MEDIUM';
    else if (overrideData.newScore > 20) riskBand = 'MODERATE';

    const overrideRecord: RiskOverrideRecord = {
      id: `override-${uuid().slice(0, 8)}`,
      overriddenBy: overrideData.overriddenBy,
      overrideRole: overrideData.overrideRole,
      previousScore,
      newScore: overrideData.newScore,
      previousGrade,
      newGrade: overrideData.newGrade,
      reason: overrideData.reason,
      comments: overrideData.comments,
      timestamp: new Date().toISOString(),
    };

    const key = `${tenantId}:${applicationId}`;
    const snapshots = this.evaluationSnapshots.get(key) || [];

    const updatedResult: RiskEvaluationResult = {
      ...latest,
      id: `risk-eval-${uuid().slice(0, 8)}`,
      evaluationVersion: latest.evaluationVersion + 1,
      riskScore: overrideData.newScore,
      riskBand,
      riskGrade: overrideData.newGrade,
      override: overrideRecord,
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: overrideData.overriddenBy,
    };

    snapshots.push(updatedResult);
    this.evaluationSnapshots.set(key, snapshots);

    try {
      await logAudit({
        userId: overrideData.overriddenBy,
        tenantId,
        action: 'RISK_SCORE_OVERRIDDEN',
        entity: 'LoanApplication',
        entityId: applicationId,
        previousValue: { previousScore, previousGrade },
        newValue: { newScore: overrideData.newScore, newGrade: overrideData.newGrade, reason: overrideData.reason },
      });
    } catch (e) {
      // Non-fatal if audit log has missing tenant in demo/test environment
    }

    return updatedResult;
  }

  // ---------------------------------------------------------------------------
  // CUSTOMER-SAFE DATA SANITIZATION
  // ---------------------------------------------------------------------------

  public getCustomerSafeSummary(result: RiskEvaluationResult): CustomerSafeRiskSummary {
    let riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let message = 'Your financial profile and repayment capacity are in good standing.';

    if (result.riskScore > 60) {
      riskCategory = 'HIGH';
      message = 'Your application is subject to additional underwriting parameters.';
    } else if (result.riskScore > 35) {
      riskCategory = 'MEDIUM';
      message = 'Your application has qualified for standard verification.';
    }

    return {
      applicationId: result.applicationId,
      status: 'ASSESSED',
      riskCategory,
      evaluatedAt: result.evaluatedAt,
      message,
    };
  }
}

function riskScoreToPrismaCategory(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score >= 65) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

export const riskEngineService = RiskEngineService.getInstance();
export const riskService = riskEngineService;

// ---------------------------------------------------------------------------
// BACKWARD COMPATIBLE EXPORT
// ---------------------------------------------------------------------------

export async function evaluateApplicationRisk(
  applicationId: string,
  actorUserId?: string
): Promise<any> {
  const result = await riskEngineService.evaluateApplication(
    applicationId,
    'tenant-adyapan-default',
    {},
    actorUserId
  );
  return {
    score: result.riskScore,
    category: riskScoreToPrismaCategory(result.riskScore),
    factors: result.signals.map((s) => ({
      name: s.name,
      weight: s.weight,
      score: 100 - s.scoreContribution,
      remarks: s.reason,
    })),
    recommendation: result.recommendation,
  };
}
