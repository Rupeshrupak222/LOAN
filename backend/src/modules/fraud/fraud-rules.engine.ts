import { v4 as uuid } from 'uuid';
import {
  FraudRule,
  CreateFraudRuleDto,
  UpdateFraudRuleDto,
  FraudInputContext,
  FraudSignalItem,
  FraudSignalSeverity,
} from './fraud.types';
import { NotFoundError, BadRequestError } from '../../common/errors';

export class FraudRulesEngine {
  private static instance: FraudRulesEngine;

  // Tenant-scoped rule store: Map<`${tenantId}:${ruleId}`, FraudRule>
  private readonly rules = new Map<string, FraudRule>();

  private constructor() {
    this.seedCanonicalRules('tenant-adyapan-default');
    this.seedCanonicalRules('tenant-apex-nbfc');
  }

  public static getInstance(): FraudRulesEngine {
    if (!FraudRulesEngine.instance) {
      FraudRulesEngine.instance = new FraudRulesEngine();
    }
    return FraudRulesEngine.instance;
  }

  public seedCanonicalRules(tenantId: string): void {
    const now = new Date().toISOString();

    const canonical: Array<Omit<FraudRule, 'tenantId' | 'createdAt' | 'updatedAt'>> = [
      {
        id: 'fraud-rule-pan-dup',
        code: 'FRAUD_RULE_DUPLICATE_PAN',
        name: 'Duplicate PAN Registry Check',
        description: 'Blocks multiple active loan applications originating under identical PAN credentials.',
        category: 'IDENTITY',
        field: 'duplicatePanCount',
        operator: 'GREATER_THAN',
        expectedValue: 0,
        severity: 'CRITICAL',
        scoreImpact: 50,
        reasonCode: 'ERR_DUPLICATE_PAN_RECORD',
        enabled: true,
        isSystemRule: true,
        version: 1,
      },
      {
        id: 'fraud-rule-pan-name-mismatch',
        code: 'FRAUD_RULE_PAN_NAME_MISMATCH',
        name: 'PAN vs Applicant Name Discrepancy',
        description: 'Detects significant lexical divergence between submitted borrower name and PAN database record.',
        category: 'IDENTITY',
        field: 'panNameMismatchScore',
        operator: 'GREATER_THAN',
        expectedValue: 40,
        severity: 'HIGH',
        scoreImpact: 30,
        reasonCode: 'WARN_PAN_NAME_DIVERGENCE',
        enabled: true,
        isSystemRule: true,
        version: 1,
      },
      {
        id: 'fraud-rule-dob-mismatch',
        code: 'FRAUD_RULE_DOB_MISMATCH',
        name: 'Date of Birth Verification Mismatch',
        description: 'Flags discrepancies between borrower declared DOB and officially verified government identity record.',
        category: 'IDENTITY',
        field: 'dobMismatch',
        operator: 'EQUALS',
        expectedValue: true,
        severity: 'HIGH',
        scoreImpact: 25,
        reasonCode: 'ERR_DOB_VERIFICATION_MISMATCH',
        enabled: true,
        isSystemRule: true,
        version: 1,
      },
      {
        id: 'fraud-rule-bank-name-mismatch',
        code: 'FRAUD_RULE_BANK_NAME_MISMATCH',
        name: 'Disbursement Bank Account Holder Mismatch',
        description: 'Flags disbursement accounts whose registered account holder name does not match the approved borrower.',
        category: 'BANK_ACCOUNT',
        field: 'bankNameMismatchPct',
        operator: 'GREATER_THAN',
        expectedValue: 30,
        severity: 'HIGH',
        scoreImpact: 35,
        reasonCode: 'ERR_BANK_HOLDER_MISMATCH',
        enabled: true,
        isSystemRule: true,
        version: 1,
      },
      {
        id: 'fraud-rule-device-multi-cust',
        code: 'FRAUD_RULE_DEVICE_CLUSTER',
        name: 'Hardware Fingerprint Device Sharing',
        description: 'Detects multiple distinct borrower applications originating from a single hardware device ID.',
        category: 'DEVICE',
        field: 'deviceUsedByCustomersCount',
        operator: 'GREATER_THAN',
        expectedValue: 1,
        severity: 'CRITICAL',
        scoreImpact: 45,
        reasonCode: 'ERR_DEVICE_SHARING_CLUSTER',
        enabled: true,
        isSystemRule: true,
        version: 1,
      },
      {
        id: 'fraud-rule-device-rooted',
        code: 'FRAUD_RULE_DEVICE_ROOT_EMULATOR',
        name: 'Rooted / Emulator Device Detection',
        description: 'Identifies applications submitted from rooted smartphones, jailbroken OS, or emulator virtual machines.',
        category: 'DEVICE',
        field: 'isRootedOrJailbroken',
        operator: 'EQUALS',
        expectedValue: true,
        severity: 'HIGH',
        scoreImpact: 30,
        reasonCode: 'WARN_DEVICE_SECURITY_COMPROMISED',
        enabled: true,
        isSystemRule: true,
        version: 1,
      },
      {
        id: 'fraud-rule-network-vpn',
        code: 'FRAUD_RULE_NETWORK_VPN_PROXY',
        name: 'Commercial VPN / Anonymizing Proxy Detection',
        description: 'Detects network traffic routed through anonymous data-center proxy or Tor exit relays.',
        category: 'NETWORK',
        field: 'isVpnOrProxy',
        operator: 'EQUALS',
        expectedValue: true,
        severity: 'MEDIUM',
        scoreImpact: 20,
        reasonCode: 'WARN_ANONYMIZED_IP_TRAFFIC',
        enabled: true,
        isSystemRule: true,
        version: 1,
      },
      {
        id: 'fraud-rule-velocity-burst-24h',
        code: 'FRAUD_RULE_VELOCITY_24H_BURST',
        name: 'High Application Velocity (24 Hours)',
        description: 'Flags loan stacking attempts with multiple application submissions inside a 24-hour origination window.',
        category: 'APPLICATION_VELOCITY',
        field: 'applicationsLast24h',
        operator: 'GREATER_THAN',
        expectedValue: 2,
        severity: 'HIGH',
        scoreImpact: 35,
        reasonCode: 'WARN_LOAN_STACKING_VELOCITY',
        enabled: true,
        isSystemRule: true,
        version: 1,
      },
      {
        id: 'fraud-rule-velocity-multi-partner',
        code: 'FRAUD_RULE_MULTI_PARTNER_BURST',
        name: 'Concurrent Multi-Partner Application Burst',
        description: 'Flags borrower attempting concurrent applications across multiple partner DSAs/LSPs simultaneously.',
        category: 'APPLICATION_VELOCITY',
        field: 'applicationsAcrossDistinctPartners24h',
        operator: 'GREATER_THAN',
        expectedValue: 1,
        severity: 'HIGH',
        scoreImpact: 30,
        reasonCode: 'WARN_MULTI_PARTNER_ORIGINATION_BURST',
        enabled: true,
        isSystemRule: true,
        version: 1,
      },
      {
        id: 'fraud-rule-recent-rejections',
        code: 'FRAUD_RULE_RECENT_REJECTIONS',
        name: 'Repeated Adverse Action Rejections',
        description: 'Detects applications from borrowers with multiple recent underwriting or credit policy rejections.',
        category: 'APPLICATION_VELOCITY',
        field: 'recentRejectedApplicationsCount',
        operator: 'GREATER_THAN',
        expectedValue: 1,
        severity: 'MEDIUM',
        scoreImpact: 25,
        reasonCode: 'WARN_HISTORY_OF_ADVERSE_REJECTIONS',
        enabled: true,
        isSystemRule: true,
        version: 1,
      },
    ];

    canonical.forEach((r) => {
      const fullRule: FraudRule = {
        ...r,
        tenantId,
        createdAt: now,
        updatedAt: now,
      };
      this.rules.set(`${tenantId}:${r.id}`, fullRule);
    });
  }

  public listRules(tenantId: string, filter?: { category?: string; enabled?: boolean }): FraudRule[] {
    const results: FraudRule[] = [];
    for (const [key, rule] of this.rules.entries()) {
      if (rule.tenantId !== tenantId) continue;
      if (filter?.category && rule.category !== filter.category) continue;
      if (filter?.enabled !== undefined && rule.enabled !== filter.enabled) continue;
      results.push(rule);
    }
    return results.sort((a, b) => a.code.localeCompare(b.code));
  }

  public getRuleById(tenantId: string, ruleId: string): FraudRule {
    const rule = this.rules.get(`${tenantId}:${ruleId}`);
    if (!rule) {
      throw new NotFoundError(`Fraud rule with ID '${ruleId}' not found for tenant '${tenantId}'.`);
    }
    return rule;
  }

  public createRule(tenantId: string, dto: CreateFraudRuleDto): FraudRule {
    const id = `fraud-rule-${uuid().slice(0, 8)}`;
    const now = new Date().toISOString();

    const rule: FraudRule = {
      id,
      tenantId,
      productId: dto.productId,
      code: dto.code,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      field: dto.field,
      operator: dto.operator,
      expectedValue: dto.expectedValue,
      severity: dto.severity,
      scoreImpact: dto.scoreImpact,
      reasonCode: dto.reasonCode,
      enabled: dto.enabled !== undefined ? dto.enabled : true,
      isSystemRule: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.rules.set(`${tenantId}:${id}`, rule);
    return rule;
  }

  public updateRule(tenantId: string, ruleId: string, dto: UpdateFraudRuleDto): FraudRule {
    const existing = this.getRuleById(tenantId, ruleId);
    const updated: FraudRule = {
      ...existing,
      ...dto,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    };
    this.rules.set(`${tenantId}:${ruleId}`, updated);
    return updated;
  }

  public evaluateRuleCondition(rule: FraudRule, contextValue: any): boolean {
    const { operator, expectedValue } = rule;
    if (contextValue === undefined || contextValue === null) {
      return false;
    }

    switch (operator) {
      case 'EQUALS':
        return contextValue === expectedValue;
      case 'NOT_EQUALS':
        return contextValue !== expectedValue;
      case 'GREATER_THAN':
        return Number(contextValue) > Number(expectedValue);
      case 'GREATER_THAN_OR_EQUAL':
        return Number(contextValue) >= Number(expectedValue);
      case 'LESS_THAN':
        return Number(contextValue) < Number(expectedValue);
      case 'LESS_THAN_OR_EQUAL':
        return Number(contextValue) <= Number(expectedValue);
      case 'CONTAINS':
        return String(contextValue).toLowerCase().includes(String(expectedValue).toLowerCase());
      case 'IN':
        return Array.isArray(expectedValue) && expectedValue.includes(contextValue);
      case 'EXISTS':
        return Boolean(contextValue);
      case 'FUZZY_MATCH_BELOW':
        return Number(contextValue) < Number(expectedValue);
      default:
        return false;
    }
  }

  public evaluateAllRules(
    tenantId: string,
    context: FraudInputContext
  ): {
    triggeredRules: Array<{ rule: FraudRule; actualValue: any }>;
    signals: FraudSignalItem[];
  } {
    const rules = this.listRules(tenantId, { enabled: true });
    const triggeredRules: Array<{ rule: FraudRule; actualValue: any }> = [];
    const signals: FraudSignalItem[] = [];

    rules.forEach((rule) => {
      const val = (context as any)[rule.field];
      const isTriggered = this.evaluateRuleCondition(rule, val);

      if (isTriggered) {
        triggeredRules.push({ rule, actualValue: val });
        signals.push({
          id: `sig-${rule.code.toLowerCase()}`,
          code: rule.code,
          name: rule.name,
          category: rule.category,
          actualValue: val,
          thresholdValue: rule.expectedValue,
          severity: rule.severity,
          scoreImpact: rule.scoreImpact,
          reason: rule.description,
          recommendedAction: `Rule ${rule.code} triggered (${rule.reasonCode}). Refer to fraud desk for corroborative document proof.`,
        });
      }
    });

    return { triggeredRules, signals };
  }
}

export const fraudRulesEngine = FraudRulesEngine.getInstance();
