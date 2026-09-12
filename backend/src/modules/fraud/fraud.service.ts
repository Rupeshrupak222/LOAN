import { v4 as uuid } from 'uuid';
import {
  FraudInputContext,
  FraudEvaluationResult,
  FraudScoreBand,
  FraudOutcome,
  FraudSignalItem,
  FraudCategorySummary,
  FraudSignalCategory,
  FraudOverrideRecord,
  CustomerSafeFraudSummary,
  FraudModelProvider,
  FraudCase,
  FraudCaseStatus,
  CreateFraudCaseDto,
  ResolveFraudCaseDto,
  FraudEvidenceItem,
  FraudCaseNote,
} from './fraud.types';
import { identityGraphService } from './identity-graph.service';
import { fraudRulesEngine } from './fraud-rules.engine';
import { prisma } from '../../config/prisma';
import { logAudit } from '../audit/audit.service';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors';

// ---------------------------------------------------------------------------
// 1. DETERMINISTIC FRAUD PROVIDER
// ---------------------------------------------------------------------------

export class DeterministicFraudProvider implements FraudModelProvider {
  public readonly providerId = 'provider-deterministic-fraud-v1';
  public readonly providerName = 'Adyapan Deterministic Fraud Intelligence Engine';
  public readonly version = '1.0.0';

  public async evaluate(
    context: FraudInputContext,
    rules: any[]
  ): Promise<{
    fraudScore: number;
    outcome: FraudOutcome;
    signals: FraudSignalItem[];
    categorySummaries: Record<FraudSignalCategory, FraudCategorySummary>;
    rulesTriggered: Array<{ ruleCode: string; ruleName: string; severity: any; scoreImpact: number }>;
    keyFraudFlags: string[];
    recommendation: string;
  }> {
    const signals: FraudSignalItem[] = [];
    const keyFraudFlags: string[] = [];

    // 1. Identity Pillar Signals
    let identityScore = 0;
    if (context.duplicatePanCount > 0) {
      signals.push({
        id: 'fraud-sig-dup-pan',
        code: 'FRAUD_IDENTITY_DUPLICATE_PAN',
        name: 'Duplicate PAN Profile Exists',
        category: 'IDENTITY',
        actualValue: `${context.duplicatePanCount} matching profile(s)`,
        thresholdValue: '0 duplicates',
        severity: 'CRITICAL',
        scoreImpact: 50,
        reason: 'The applicant PAN is registered to an existing customer record.',
        recommendedAction: 'Mandate identity verification and de-duplicate customer records.',
      });
      identityScore += 50;
      keyFraudFlags.push('Duplicate PAN across borrower profiles');
    }

    if (context.panNameMismatchScore > 40) {
      signals.push({
        id: 'fraud-sig-name-mismatch',
        code: 'FRAUD_IDENTITY_NAME_MISMATCH',
        name: 'Applicant Name vs PAN Lexical Divergence',
        category: 'IDENTITY',
        actualValue: `Divergence index: ${context.panNameMismatchScore}%`,
        thresholdValue: '< 40% divergence',
        severity: 'HIGH',
        scoreImpact: 30,
        reason: 'Applicant submitted name does not closely match the identity repository record.',
        recommendedAction: 'Require official gazette notification or secondary photo ID.',
      });
      identityScore += 30;
      keyFraudFlags.push('Significant applicant name discrepancy against PAN');
    }

    if (context.dobMismatch) {
      signals.push({
        id: 'fraud-sig-dob-mismatch',
        code: 'FRAUD_IDENTITY_DOB_MISMATCH',
        name: 'Date of Birth Verification Discrepancy',
        category: 'IDENTITY',
        actualValue: 'Declared DOB does not match identity registry',
        thresholdValue: 'Exact match',
        severity: 'HIGH',
        scoreImpact: 25,
        reason: 'Date of birth declared on application conflicts with validated KYC document.',
        recommendedAction: 'Verify original birth certificate or Aadhaar QR payload.',
      });
      identityScore += 25;
      keyFraudFlags.push('Declared DOB mismatch with official KYC document');
    }

    // 2. Bank Account Pillar Signals
    let bankScore = 0;
    if (context.bankNameMismatchPct > 30) {
      signals.push({
        id: 'fraud-sig-bank-name-mismatch',
        code: 'FRAUD_BANK_NAME_MISMATCH',
        name: 'Disbursement Bank Holder Name Mismatch',
        category: 'BANK_ACCOUNT',
        actualValue: `${context.bankNameMismatchPct}% divergence`,
        thresholdValue: '< 30% divergence',
        severity: 'HIGH',
        scoreImpact: 35,
        reason: 'Bank account holder name returned by penny-drop verification differs from applicant.',
        recommendedAction: 'Mandate applicant own-account bank statement with cancelled cheque.',
      });
      bankScore += 35;
      keyFraudFlags.push('Bank account holder name differs from borrower');
    }

    if (context.bankAccountLinkedToOtherCustomersCount > 0) {
      signals.push({
        id: 'fraud-sig-bank-account-reuse',
        code: 'FRAUD_BANK_ACCOUNT_REUSE',
        name: 'Bank Account Linked to Multiple Customers',
        category: 'BANK_ACCOUNT',
        actualValue: `${context.bankAccountLinkedToOtherCustomersCount} distinct borrower(s)`,
        thresholdValue: '1 customer per account',
        severity: 'HIGH',
        scoreImpact: 35,
        reason: 'Disbursement bank account is reused across multiple customer records.',
        recommendedAction: 'Escalate to fraud officer to verify third-party beneficiary collusion.',
      });
      bankScore += 35;
      keyFraudFlags.push('Shared disbursement bank account across multiple applicants');
    }

    // 3. Device Pillar Signals
    let deviceScore = 0;
    if (context.deviceUsedByCustomersCount > 1) {
      signals.push({
        id: 'fraud-sig-device-clustering',
        code: 'FRAUD_DEVICE_MULTI_CUSTOMER',
        name: 'Hardware Fingerprint Shared by Multiple Borrowers',
        category: 'DEVICE',
        actualValue: `${context.deviceUsedByCustomersCount} customers on same hardware`,
        thresholdValue: '1 customer per device',
        severity: 'CRITICAL',
        scoreImpact: 45,
        reason: 'Multiple applications originating from the exact same hardware identifier.',
        recommendedAction: 'Initiate mandatory fraud review and verify field sourcing officer.',
      });
      deviceScore += 45;
      keyFraudFlags.push('Device sharing cluster detected');
    }

    if (context.isRootedOrJailbroken || context.isEmulator) {
      signals.push({
        id: 'fraud-sig-device-tamper',
        code: 'FRAUD_DEVICE_TAMPER_EMULATOR',
        name: 'Rooted / Emulator Device Environment',
        category: 'DEVICE',
        actualValue: context.isEmulator ? 'Android/iOS Emulator' : 'Rooted / Jailbroken OS',
        thresholdValue: 'Clean production mobile OS',
        severity: 'HIGH',
        scoreImpact: 30,
        reason: 'Application submitted from a modified OS or automated virtual machine emulator.',
        recommendedAction: 'Block automated submissions and enforce biometric app verification.',
      });
      deviceScore += 30;
      keyFraudFlags.push('Application submitted from emulator or rooted mobile device');
    }

    // 4. Network Pillar Signals
    let networkScore = 0;
    if (context.isVpnOrProxy || context.isTorExitNode) {
      signals.push({
        id: 'fraud-sig-network-vpn',
        code: 'FRAUD_NETWORK_ANONYMIZED_IP',
        name: 'Anonymizing VPN / Tor Relay Detected',
        category: 'NETWORK',
        actualValue: context.isTorExitNode ? 'Tor Exit Node' : 'Commercial VPN Subnet',
        thresholdValue: 'Residential / Mobile ISP',
        severity: 'MEDIUM',
        scoreImpact: 20,
        reason: 'Origination network traffic routed through anonymous data-center proxy.',
        recommendedAction: 'Request borrower submit application from direct mobile data connection.',
      });
      networkScore += 20;
      keyFraudFlags.push('Anonymized VPN/Proxy traffic detected');
    }

    if (context.geoDistanceKmBetweenIpAndCustomerAddress > 1000) {
      signals.push({
        id: 'fraud-sig-geo-anomaly',
        code: 'FRAUD_GEO_DISTANCE_ANOMALY',
        name: 'Geographical IP vs Residence Distance Anomaly',
        category: 'NETWORK',
        actualValue: `${context.geoDistanceKmBetweenIpAndCustomerAddress.toFixed(0)} km difference`,
        thresholdValue: '< 500 km radius',
        severity: 'MEDIUM',
        scoreImpact: 15,
        reason: 'Origination IP geolocation is unusually distant from borrower declared address.',
        recommendedAction: 'Verify current location and roaming status.',
      });
      networkScore += 15;
    }

    // 5. Application Velocity Pillar Signals
    let velocityScore = 0;
    if (context.applicationsLast24h > 2) {
      signals.push({
        id: 'fraud-sig-vel-24h',
        code: 'FRAUD_VELOCITY_24H_BURST',
        name: 'High Application Velocity (24 Hours)',
        category: 'APPLICATION_VELOCITY',
        actualValue: `${context.applicationsLast24h} applications submitted in 24h`,
        thresholdValue: '1 application per 24h',
        severity: 'HIGH',
        scoreImpact: 35,
        reason: 'Rapid loan application submissions indicating loan stacking or bot automation.',
        recommendedAction: 'Enforce cooling-off window or underwriting velocity check.',
      });
      velocityScore += 35;
      keyFraudFlags.push('Application velocity burst (>2 applications in 24h)');
    }

    if (context.applicationsAcrossDistinctPartners24h > 1) {
      signals.push({
        id: 'fraud-sig-multi-partner',
        code: 'FRAUD_MULTI_PARTNER_BURST',
        name: 'Concurrent Multi-Partner Origination',
        category: 'APPLICATION_VELOCITY',
        actualValue: `${context.applicationsAcrossDistinctPartners24h} distinct LSP partners`,
        thresholdValue: '1 partner channel',
        severity: 'HIGH',
        scoreImpact: 30,
        reason: 'Applicant simultaneously applying through multiple co-lending / DSA partners.',
        recommendedAction: 'Check for multi-origination loan stacking and consolidate limits.',
      });
      velocityScore += 30;
      keyFraudFlags.push('Concurrent application across multiple partner channels');
    }

    // Baseline clean signals if no anomaly was triggered in that category
    if (!signals.some((s) => s.category === 'IDENTITY')) {
      signals.push({
        id: 'fraud-sig-id-verified',
        code: 'FRAUD_IDENTITY_VERIFIED',
        name: 'Identity KYC Consistency Verified',
        category: 'IDENTITY',
        actualValue: 'Exact match',
        thresholdValue: 'Verified',
        severity: 'LOW',
        scoreImpact: 0,
        reason: 'National ID and declared demographic particulars are consistent.',
        recommendedAction: 'Proceed with standard workflow.',
      });
    }
    if (!signals.some((s) => s.category === 'BANK_ACCOUNT')) {
      signals.push({
        id: 'fraud-sig-bank-verified',
        code: 'FRAUD_BANK_ACCOUNT_VERIFIED',
        name: 'Disbursement Bank Account Verified',
        category: 'BANK_ACCOUNT',
        actualValue: 'Single profile binding',
        thresholdValue: 'Single profile binding',
        severity: 'LOW',
        scoreImpact: 0,
        reason: 'Account holder name verified via electronic penny-drop with single customer binding.',
        recommendedAction: 'Proceed with standard disbursement setup.',
      });
    }
    if (!signals.some((s) => s.category === 'DEVICE')) {
      signals.push({
        id: 'fraud-sig-device-clean',
        code: 'FRAUD_DEVICE_VERIFIED',
        name: 'Clean Hardware Fingerprint',
        category: 'DEVICE',
        actualValue: 'Non-rooted production OS',
        thresholdValue: 'Non-rooted production OS',
        severity: 'LOW',
        scoreImpact: 0,
        reason: 'Application originating from untampered mobile or desktop environment.',
        recommendedAction: 'Standard device session approved.',
      });
    }
    if (!signals.some((s) => s.category === 'NETWORK')) {
      signals.push({
        id: 'fraud-sig-network-clean',
        code: 'FRAUD_NETWORK_VERIFIED',
        name: 'Domestic ISP Network Verified',
        category: 'NETWORK',
        actualValue: 'Standard ISP IP',
        thresholdValue: 'Non-proxy IP',
        severity: 'LOW',
        scoreImpact: 0,
        reason: 'Origination IP originates from trusted consumer ISP with zero proxy / VPN flags.',
        recommendedAction: 'Standard network session approved.',
      });
    }
    if (!signals.some((s) => s.category === 'APPLICATION_VELOCITY')) {
      signals.push({
        id: 'fraud-sig-velocity-clean',
        code: 'FRAUD_VELOCITY_NORMAL',
        name: 'Normal Application Velocity',
        category: 'APPLICATION_VELOCITY',
        actualValue: 'Single application',
        thresholdValue: '<= 1 application',
        severity: 'LOW',
        scoreImpact: 0,
        reason: 'Measured intake velocity with no automated script submission bursts.',
        recommendedAction: 'Standard STP velocity routing.',
      });
    }

    // Evaluate dynamic rules from rule engine
    const { triggeredRules, signals: dynamicRuleSignals } = fraudRulesEngine.evaluateAllRules(
      context.tenantId,
      context
    );

    // Merge dynamic rule signals if not already present
    dynamicRuleSignals.forEach((ds) => {
      if (!signals.some((s) => s.code === ds.code)) {
        signals.push(ds);
      }
    });

    const rulesTriggered = triggeredRules.map((tr) => ({
      ruleCode: tr.rule.code,
      ruleName: tr.rule.name,
      severity: tr.rule.severity,
      scoreImpact: tr.rule.scoreImpact,
    }));

    // Calculate normalized Fraud Score (0 - 100)
    const rawScore =
      identityScore * 0.3 +
      bankScore * 0.25 +
      deviceScore * 0.25 +
      networkScore * 0.1 +
      velocityScore * 0.1;

    // Highest impact signal boosts score
    const maxSignalImpact = signals.reduce((max, s) => Math.max(max, s.scoreImpact), 0);
    const fraudScore = Math.min(100, Math.max(0, Math.round(Math.max(rawScore, maxSignalImpact))));

    // Determine Outcome based on bands
    let outcome: FraudOutcome = 'CLEAR';
    let recommendation = 'Low fraud risk profile. Clean identity verification and application behavior.';

    if (fraudScore >= 80 || signals.some((s) => s.severity === 'CRITICAL')) {
      outcome = 'BLOCK';
      recommendation = 'Critical fraud risk detected. Hard stop triggered due to duplicate identity, syndicate device cluster, or high anomaly signals.';
    } else if (fraudScore >= 60 || signals.filter((s) => s.severity === 'HIGH').length >= 2) {
      outcome = 'HIGH_RISK';
      recommendation = 'High fraud indicators detected. Mandate comprehensive fraud desk investigation before credit decisioning.';
    } else if (fraudScore >= 40 || signals.some((s) => s.severity === 'HIGH')) {
      outcome = 'REVIEW';
      recommendation = 'Elevated fraud risk. Secondary verification of bank account ownership and identity documents required.';
    } else if (fraudScore >= 20) {
      outcome = 'LOW_RISK';
      recommendation = 'Moderate signals detected. Proceed with standard digital origination and automated sanity checks.';
    }

    // Build category summaries
    const categorySummaries: Record<FraudSignalCategory, FraudCategorySummary> = {
      IDENTITY: {
        category: 'IDENTITY',
        score: Math.min(100, identityScore),
        signalsCount: signals.filter((s) => s.category === 'IDENTITY').length,
        criticalSignalsCount: signals.filter((s) => s.category === 'IDENTITY' && s.severity === 'CRITICAL').length,
        topReasons: signals.filter((s) => s.category === 'IDENTITY').map((s) => s.reason),
      },
      BANK_ACCOUNT: {
        category: 'BANK_ACCOUNT',
        score: Math.min(100, bankScore),
        signalsCount: signals.filter((s) => s.category === 'BANK_ACCOUNT').length,
        criticalSignalsCount: signals.filter((s) => s.category === 'BANK_ACCOUNT' && s.severity === 'CRITICAL').length,
        topReasons: signals.filter((s) => s.category === 'BANK_ACCOUNT').map((s) => s.reason),
      },
      DEVICE: {
        category: 'DEVICE',
        score: Math.min(100, deviceScore),
        signalsCount: signals.filter((s) => s.category === 'DEVICE').length,
        criticalSignalsCount: signals.filter((s) => s.category === 'DEVICE' && s.severity === 'CRITICAL').length,
        topReasons: signals.filter((s) => s.category === 'DEVICE').map((s) => s.reason),
      },
      NETWORK: {
        category: 'NETWORK',
        score: Math.min(100, networkScore),
        signalsCount: signals.filter((s) => s.category === 'NETWORK').length,
        criticalSignalsCount: signals.filter((s) => s.category === 'NETWORK' && s.severity === 'CRITICAL').length,
        topReasons: signals.filter((s) => s.category === 'NETWORK').map((s) => s.reason),
      },
      APPLICATION_VELOCITY: {
        category: 'APPLICATION_VELOCITY',
        score: Math.min(100, velocityScore),
        signalsCount: signals.filter((s) => s.category === 'APPLICATION_VELOCITY').length,
        criticalSignalsCount: signals.filter((s) => s.category === 'APPLICATION_VELOCITY' && s.severity === 'CRITICAL').length,
        topReasons: signals.filter((s) => s.category === 'APPLICATION_VELOCITY').map((s) => s.reason),
      },
    };

    return {
      fraudScore,
      outcome,
      signals,
      categorySummaries,
      rulesTriggered,
      keyFraudFlags,
      recommendation,
    };
  }
}

// ---------------------------------------------------------------------------
// 2. CORE FRAUD SERVICE
// ---------------------------------------------------------------------------

export class FraudService {
  private static instance: FraudService;

  private provider: FraudModelProvider = new DeterministicFraudProvider();

  // Immutable Evaluation Snapshots: Map<`${tenantId}:${applicationId}`, FraudEvaluationResult[]>
  private readonly evaluationSnapshots = new Map<string, FraudEvaluationResult[]>();

  // Fraud Investigation Cases: Map<`${tenantId}:${caseId}`, FraudCase>
  private readonly cases = new Map<string, FraudCase>();

  private constructor() {
    this.seedCanonicalCases('tenant-adyapan-default');
    this.seedCanonicalCases('tenant-apex-nbfc');
  }

  public static getInstance(): FraudService {
    if (!FraudService.instance) {
      FraudService.instance = new FraudService();
    }
    return FraudService.instance;
  }

  public setProvider(provider: FraudModelProvider): void {
    this.provider = provider;
  }

  // ---------------------------------------------------------------------------
  // CANONICAL SEEDING
  // ---------------------------------------------------------------------------

  public seedCanonicalCases(tenantId: string): void {
    const now = new Date().toISOString();

    const seedCase: FraudCase = {
      id: 'FC-2026-001',
      caseNo: 'FC-2026-001',
      tenantId,
      applicationId: 'app-seed-001',
      applicationNo: 'APP-2026-001',
      customerId: 'cust-demo-002',
      customerCode: 'CUST-002',
      customerName: 'Rohan Verma',
      riskScore: 35,
      fraudScore: 65,
      outcome: 'HIGH_RISK',
      status: 'IN_REVIEW',
      triggeringSignals: [
        {
          id: 'sig-bank-reuse',
          code: 'FRAUD_BANK_ACCOUNT_REUSE',
          name: 'Shared Bank Account Reuse',
          category: 'BANK_ACCOUNT',
          actualValue: 'Disbursement account HDFC0001928374 linked to 2 borrowers',
          thresholdValue: '1 customer per account',
          severity: 'HIGH',
          scoreImpact: 35,
          reason: 'Disbursement bank account matches Aarav Sharma (CUST-001).',
          recommendedAction: 'Conduct physical verification of cancelled cheque.',
        },
      ],
      evidence: [
        {
          id: 'ev-01',
          type: 'BANK_STATEMENT',
          title: 'Penny Drop Verification Log',
          description: 'Penny drop completed with account holder name Aarav Sharma instead of Rohan Verma',
          uri: 'https://docs.adyapan.dev/evidence/penny-drop-001.pdf',
          addedBy: 'SYSTEM',
          addedAt: now,
        },
      ],
      notes: [
        {
          id: 'note-01',
          userId: 'user-fraud-analyst-1',
          userName: 'Fraud Desk Officer',
          userRole: 'FRAUD_ANALYST',
          note: 'Assigned case for investigation. Contacted branch manager to verify relationship between CUST-001 and CUST-002.',
          timestamp: now,
        },
      ],
      assignedToUserId: 'user-fraud-analyst-1',
      assignedToName: 'Fraud Desk Officer',
      createdAt: now,
      updatedAt: now,
    };

    this.cases.set(`${tenantId}:${seedCase.id}`, seedCase);
  }

  // ---------------------------------------------------------------------------
  // CONTEXT BUILDER
  // ---------------------------------------------------------------------------

  public async buildFraudContext(
    applicationId: string,
    tenantId: string,
    overrides?: Partial<FraudInputContext>
  ): Promise<FraudInputContext> {
    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: {
          include: {
            bankAccounts: true,
            documents: true,
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
        panNameMismatchScore: 0,
        aadhaarKycMismatch: false,
        dobMismatch: false,
        duplicatePanCount: 0,
        duplicateMobileCount: 0,
        duplicateEmailCount: 0,
        syntheticIdentityIndicator: false,
        bankNameMismatchPct: 0,
        bankAccountLinkedToOtherCustomersCount: 0,
        bankAccountReusePatternDetected: false,
        highRiskBeneficiaryDetected: false,
        deviceUsedByCustomersCount: 1,
        deviceApplicationsLast24h: 1,
        deviceApplicationsLast7d: 1,
        isRootedOrJailbroken: false,
        isEmulator: false,
        ipApplicationsLast24h: 1,
        isVpnOrProxy: false,
        isTorExitNode: false,
        geoDistanceKmBetweenIpAndCustomerAddress: 12,
        applicationsLast24h: 1,
        applicationsLast7d: 1,
        applicationsAcrossDistinctPartners24h: 0,
        recentRejectedApplicationsCount: 0,
        amountModificationCount: 0,
        timeSpentFillingSeconds: 180,
        ...overrides,
      };
    }

    if (app.tenantId && app.tenantId !== tenantId) {
      throw new ForbiddenError('Access Denied: Application belongs to another tenant.');
    }

    const customer = app.customer;
    const bankAccount = customer.bankAccounts?.[0]?.accountNumber;

    // Register into identity graph for live clustering
    identityGraphService.registerEntity({
      customerId: customer.id,
      customerCode: customer.customerCode,
      customerName: `${customer.firstName} ${customer.lastName}`,
      tenantId,
      mobile: customer.mobile,
      email: customer.email || undefined,
      bankAccount: bankAccount || undefined,
      deviceId: overrides?.deviceId,
      ipAddress: overrides?.ipAddress,
      partnerId: overrides?.partnerId,
    });

    const cluster = identityGraphService.buildCluster(tenantId, customer.id);

    return {
      applicationId: app.id,
      applicationNo: app.applicationNo,
      customerId: customer.id,
      customerCode: customer.customerCode,
      tenantId: app.tenantId || tenantId,
      branchId: app.branchId || undefined,
      channel: overrides?.channel || 'DIRECT_WEB',

      panNameMismatchScore: overrides?.panNameMismatchScore ?? 0,
      aadhaarKycMismatch: overrides?.aadhaarKycMismatch ?? false,
      dobMismatch: overrides?.dobMismatch ?? false,
      duplicatePanCount: cluster.linkedCustomersCount > 0 && cluster.maxSeverity === 'CRITICAL' ? 1 : 0,
      duplicateMobileCount: 0,
      duplicateEmailCount: 0,
      syntheticIdentityIndicator: overrides?.syntheticIdentityIndicator ?? false,

      bankAccountNumber: bankAccount,
      bankAccountHolderName: customer.bankAccounts?.[0]?.accountHolderName,
      bankNameMismatchPct: overrides?.bankNameMismatchPct ?? 0,
      bankAccountLinkedToOtherCustomersCount: cluster.linkedAccountsCount,
      bankAccountReusePatternDetected: cluster.linkedAccountsCount > 0,
      highRiskBeneficiaryDetected: false,

      deviceId: overrides?.deviceId || 'dev-default-session',
      deviceUsedByCustomersCount: cluster.linkedDevicesCount > 0 ? cluster.linkedDevicesCount + 1 : 1,
      deviceApplicationsLast24h: overrides?.deviceApplicationsLast24h ?? 1,
      deviceApplicationsLast7d: overrides?.deviceApplicationsLast7d ?? 1,
      isRootedOrJailbroken: overrides?.isRootedOrJailbroken ?? false,
      isEmulator: overrides?.isEmulator ?? false,

      ipAddress: overrides?.ipAddress || '127.0.0.1',
      ipApplicationsLast24h: cluster.linkedIpsCount > 0 ? cluster.linkedIpsCount : 1,
      isVpnOrProxy: overrides?.isVpnOrProxy ?? false,
      isTorExitNode: overrides?.isTorExitNode ?? false,
      geoDistanceKmBetweenIpAndCustomerAddress: overrides?.geoDistanceKmBetweenIpAndCustomerAddress ?? 15,

      applicationsLast24h: overrides?.applicationsLast24h ?? 1,
      applicationsLast7d: overrides?.applicationsLast7d ?? 1,
      applicationsAcrossDistinctPartners24h: overrides?.applicationsAcrossDistinctPartners24h ?? 0,
      recentRejectedApplicationsCount: overrides?.recentRejectedApplicationsCount ?? 0,
      amountModificationCount: overrides?.amountModificationCount ?? 0,
      timeSpentFillingSeconds: overrides?.timeSpentFillingSeconds ?? 240,

      ...overrides,
    };
  }

  // ---------------------------------------------------------------------------
  // EVALUATION & SNAPSHOT CREATION
  // ---------------------------------------------------------------------------

  public async evaluateApplication(
    applicationId: string,
    tenantId: string,
    contextOverrides?: Partial<FraudInputContext>,
    actorUserId?: string
  ): Promise<FraudEvaluationResult> {
    const startTime = Date.now();
    const context = await this.buildFraudContext(applicationId, tenantId, contextOverrides);

    const cluster = identityGraphService.buildCluster(tenantId, context.customerId);
    const graphSignals = identityGraphService.extractGraphFraudSignals(cluster);

    const evaluation = await this.provider.evaluate(context, []);

    // Merge graph signals
    graphSignals.forEach((gs) => {
      if (!evaluation.signals.some((s) => s.code === gs.code)) {
        evaluation.signals.push(gs);
      }
    });

    const executionTimeMs = Date.now() - startTime;
    const key = `${tenantId}:${applicationId}`;
    const existingSnapshots = this.evaluationSnapshots.get(key) || [];
    const evaluationVersion = existingSnapshots.length + 1;

    let fraudBand: FraudScoreBand = 'LOW';
    if (evaluation.fraudScore >= 80) fraudBand = 'CRITICAL';
    else if (evaluation.fraudScore >= 60) fraudBand = 'HIGH';
    else if (evaluation.fraudScore >= 40) fraudBand = 'ELEVATED';
    else if (evaluation.fraudScore >= 20) fraudBand = 'MODERATE';

    const result: FraudEvaluationResult = {
      id: `fraud-eval-${uuid().slice(0, 8)}`,
      applicationId,
      customerId: context.customerId,
      tenantId,
      evaluationVersion,
      fraudScore: evaluation.fraudScore,
      fraudBand,
      outcome: evaluation.outcome,
      categorySummaries: evaluation.categorySummaries,
      signals: evaluation.signals,
      rulesTriggered: evaluation.rulesTriggered,
      identityClusterSummary: cluster,
      keyFraudFlags: evaluation.keyFraudFlags,
      recommendation: evaluation.recommendation,
      override: null,
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: actorUserId,
      executionTimeMs,
    };

    existingSnapshots.push(result);
    this.evaluationSnapshots.set(key, existingSnapshots);

    // Auto-create fraud case if review/high_risk/block
    if (result.outcome === 'REVIEW' || result.outcome === 'HIGH_RISK' || result.outcome === 'BLOCK') {
      this.ensureFraudCaseForApplication(result, context, actorUserId);
    }

    try {
      await logAudit({
        userId: actorUserId,
        tenantId,
        action: 'FRAUD_EVALUATED',
        entity: 'LoanApplication',
        entityId: applicationId,
        newValue: {
          fraudScore: result.fraudScore,
          outcome: result.outcome,
          signalsCount: result.signals.length,
          version: evaluationVersion,
        },
      });
    } catch (e) {
      // Non-fatal if audit log has missing tenant in demo/test environment
    }

    return result;
  }

  public getLatestEvaluation(tenantId: string, applicationId: string): FraudEvaluationResult {
    const key = `${tenantId}:${applicationId}`;
    const list = this.evaluationSnapshots.get(key) || [];
    if (list.length === 0) {
      throw new NotFoundError(`No fraud evaluation record found for application '${applicationId}'.`);
    }
    return list[list.length - 1];
  }

  public listEvaluationHistory(tenantId: string, applicationId: string): FraudEvaluationResult[] {
    const key = `${tenantId}:${applicationId}`;
    return this.evaluationSnapshots.get(key) || [];
  }

  // ---------------------------------------------------------------------------
  // MANUAL OVERRIDE (SoD PROTECTED)
  // ---------------------------------------------------------------------------

  public async overrideFraudOutcome(
    tenantId: string,
    applicationId: string,
    overrideData: {
      newOutcome: FraudOutcome;
      newScore?: number;
      reason: string;
      comments: string;
      overriddenBy: string;
      overrideRole: string;
    }
  ): Promise<FraudEvaluationResult> {
    const latest = this.getLatestEvaluation(tenantId, applicationId);

    if (!overrideData.reason || overrideData.reason.trim().length < 5) {
      throw new BadRequestError('Mandatory justification reason (at least 5 characters) required for fraud override.');
    }

    const previousOutcome = latest.outcome;
    const previousScore = latest.fraudScore;
    const newScore = overrideData.newScore !== undefined ? overrideData.newScore : latest.fraudScore;

    const overrideRecord: FraudOverrideRecord = {
      id: `override-${uuid().slice(0, 8)}`,
      overriddenBy: overrideData.overriddenBy,
      overrideRole: overrideData.overrideRole,
      previousScore,
      newScore,
      previousOutcome,
      newOutcome: overrideData.newOutcome,
      reason: overrideData.reason,
      comments: overrideData.comments,
      timestamp: new Date().toISOString(),
    };

    const key = `${tenantId}:${applicationId}`;
    const snapshots = this.evaluationSnapshots.get(key) || [];

    const updatedResult: FraudEvaluationResult = {
      ...latest,
      id: `fraud-eval-${uuid().slice(0, 8)}`,
      evaluationVersion: latest.evaluationVersion + 1,
      fraudScore: newScore,
      outcome: overrideData.newOutcome,
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
        action: 'FRAUD_OUTCOME_OVERRIDDEN',
        entity: 'LoanApplication',
        entityId: applicationId,
        previousValue: { outcome: previousOutcome, score: previousScore },
        newValue: { outcome: overrideData.newOutcome, score: newScore, reason: overrideData.reason },
      });
    } catch (e) {
      // Non-fatal if audit log has missing tenant in demo/test environment
    }

    return updatedResult;
  }

  // ---------------------------------------------------------------------------
  // FRAUD CASE MANAGEMENT
  // ---------------------------------------------------------------------------

  private ensureFraudCaseForApplication(
    evalResult: FraudEvaluationResult,
    context: FraudInputContext,
    actorUserId?: string
  ): FraudCase {
    const existingCase = Array.from(this.cases.values()).find(
      (c) => c.tenantId === evalResult.tenantId && c.applicationId === evalResult.applicationId
    );

    if (existingCase) {
      existingCase.fraudScore = evalResult.fraudScore;
      existingCase.outcome = evalResult.outcome;
      existingCase.triggeringSignals = evalResult.signals;
      existingCase.updatedAt = new Date().toISOString();
      return existingCase;
    }

    const caseId = `FC-${new Date().getFullYear()}-${String(this.cases.size + 1).padStart(3, '0')}`;
    const newCase: FraudCase = {
      id: caseId,
      caseNo: caseId,
      tenantId: evalResult.tenantId,
      applicationId: evalResult.applicationId,
      applicationNo: context.applicationNo,
      customerId: context.customerId,
      customerCode: context.customerCode,
      customerName: `Customer ${context.customerCode}`,
      riskScore: 50,
      fraudScore: evalResult.fraudScore,
      outcome: evalResult.outcome,
      status: 'OPEN',
      triggeringSignals: evalResult.signals,
      evidence: [],
      notes: [
        {
          id: `note-${uuid().slice(0, 6)}`,
          userId: actorUserId || 'SYSTEM',
          userName: 'Risk & Fraud Orchestrator',
          userRole: 'SYSTEM',
          note: `Case automatically created following ${evalResult.outcome} fraud evaluation (Score: ${evalResult.fraudScore}).`,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.cases.set(`${evalResult.tenantId}:${caseId}`, newCase);
    return newCase;
  }

  public listCases(
    tenantId: string,
    filter?: { status?: FraudCaseStatus; assignedToUserId?: string; outcome?: FraudOutcome }
  ): FraudCase[] {
    const results: FraudCase[] = [];
    for (const [key, fraudCase] of this.cases.entries()) {
      if (fraudCase.tenantId !== tenantId) continue;
      if (filter?.status && fraudCase.status !== filter.status) continue;
      if (filter?.assignedToUserId && fraudCase.assignedToUserId !== filter.assignedToUserId) continue;
      if (filter?.outcome && fraudCase.outcome !== filter.outcome) continue;
      results.push(fraudCase);
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getCaseById(tenantId: string, caseId: string): FraudCase {
    const c = this.cases.get(`${tenantId}:${caseId}`);
    if (!c) {
      throw new NotFoundError(`Fraud case with ID '${caseId}' not found.`);
    }
    return c;
  }

  public createCase(tenantId: string, dto: CreateFraudCaseDto, actorUserId?: string): FraudCase {
    const caseId = `FC-${new Date().getFullYear()}-${String(this.cases.size + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const c: FraudCase = {
      id: caseId,
      caseNo: caseId,
      tenantId,
      applicationId: dto.applicationId,
      applicationNo: `APP-${dto.applicationId.slice(0, 8).toUpperCase()}`,
      customerId: `cust-${dto.applicationId.slice(0, 6)}`,
      customerCode: 'CUST-MANUAL',
      customerName: 'Investigated Applicant',
      riskScore: 50,
      fraudScore: 50,
      outcome: 'REVIEW',
      status: 'OPEN',
      triggeringSignals: [],
      evidence: [],
      notes: dto.notes
        ? [
            {
              id: `note-${uuid().slice(0, 6)}`,
              userId: actorUserId || 'SYSTEM',
              userName: 'Fraud Investigator',
              userRole: 'FRAUD_ANALYST',
              note: dto.notes,
              timestamp: now,
            },
          ]
        : [],
      assignedToUserId: dto.assignedToUserId,
      createdAt: now,
      updatedAt: now,
    };

    this.cases.set(`${tenantId}:${caseId}`, c);
    return c;
  }

  public assignCase(
    tenantId: string,
    caseId: string,
    assignedToUserId: string,
    assignedToName: string,
    actorUserId?: string
  ): FraudCase {
    const c = this.getCaseById(tenantId, caseId);
    c.assignedToUserId = assignedToUserId;
    c.assignedToName = assignedToName;
    if (c.status === 'OPEN') {
      c.status = 'IN_REVIEW';
    }
    c.updatedAt = new Date().toISOString();
    c.notes.push({
      id: `note-${uuid().slice(0, 6)}`,
      userId: actorUserId || assignedToUserId,
      userName: assignedToName,
      userRole: 'FRAUD_ANALYST',
      note: `Case assigned to ${assignedToName} for investigation.`,
      timestamp: new Date().toISOString(),
    });

    this.cases.set(`${tenantId}:${caseId}`, c);
    return c;
  }

  public addCaseEvidence(
    tenantId: string,
    caseId: string,
    evidence: Omit<FraudEvidenceItem, 'id' | 'addedAt'>
  ): FraudCase {
    const c = this.getCaseById(tenantId, caseId);
    c.evidence.push({
      id: `ev-${uuid().slice(0, 6)}`,
      ...evidence,
      addedAt: new Date().toISOString(),
    });
    c.updatedAt = new Date().toISOString();
    this.cases.set(`${tenantId}:${caseId}`, c);
    return c;
  }

  public addCaseNote(
    tenantId: string,
    caseId: string,
    noteText: string,
    user: { id: string; name: string; role: string }
  ): FraudCase {
    const c = this.getCaseById(tenantId, caseId);
    c.notes.push({
      id: `note-${uuid().slice(0, 6)}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      note: noteText,
      timestamp: new Date().toISOString(),
    });
    c.updatedAt = new Date().toISOString();
    this.cases.set(`${tenantId}:${caseId}`, c);
    return c;
  }

  public resolveCase(
    tenantId: string,
    caseId: string,
    dto: ResolveFraudCaseDto,
    actorUserId: string
  ): FraudCase {
    const c = this.getCaseById(tenantId, caseId);

    if (!dto.reason || dto.reason.trim().length < 5) {
      throw new BadRequestError('Mandatory resolution reason required to close a fraud case.');
    }

    c.resolution = dto.resolution;
    c.resolutionReason = dto.reason;
    c.resolvedByUserId = actorUserId;
    c.resolvedAt = new Date().toISOString();
    c.status = dto.resolution === 'CONFIRMED_FRAUD' ? 'CONFIRMED_FRAUD' : 'CLEARED';
    c.closedAt = new Date().toISOString();
    c.updatedAt = new Date().toISOString();

    c.notes.push({
      id: `note-${uuid().slice(0, 6)}`,
      userId: actorUserId,
      userName: 'Fraud Investigator',
      userRole: 'FRAUD_ANALYST',
      note: `Case formally resolved with outcome '${dto.resolution}'. Reason: ${dto.reason}`,
      timestamp: new Date().toISOString(),
    });

    this.cases.set(`${tenantId}:${caseId}`, c);
    return c;
  }

  // ---------------------------------------------------------------------------
  // CUSTOMER-SAFE DATA SANITIZATION
  // ---------------------------------------------------------------------------

  public getCustomerSafeSummary(result: FraudEvaluationResult): CustomerSafeFraudSummary {
    let status: 'VERIFIED' | 'UNDER_REVIEW' | 'REQUIRES_INFO' = 'VERIFIED';
    let message = 'Your application details and identity verification are in good standing.';

    if (result.outcome === 'BLOCK' || result.outcome === 'HIGH_RISK') {
      status = 'UNDER_REVIEW';
      message = 'Your application requires standard administrative verification. Our representative will contact you if needed.';
    } else if (result.outcome === 'REVIEW') {
      status = 'REQUIRES_INFO';
      message = 'Please ensure your submitted bank details and documents match your official identity profile.';
    }

    return {
      applicationId: result.applicationId,
      status,
      evaluatedAt: result.evaluatedAt,
      message,
    };
  }
}

export const fraudService = FraudService.getInstance();
