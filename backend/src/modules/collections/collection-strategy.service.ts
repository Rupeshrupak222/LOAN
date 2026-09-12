import { v4 as uuid } from 'uuid';
import { BadRequestError, NotFoundError } from '../../common/errors';
import type {
  CollectionPriorityBand,
  CollectionPriorityScore,
  CollectionStrategyDefinition,
  CollectionStrategyPhase,
  StrategyRule,
  StrategyStatus,
} from './collection.types';
import { DEFAULT_AGING_BUCKETS } from './dpd.service';

export const DEFAULT_COLLECTION_RULES: StrategyRule[] = [
  {
    id: 'rule-early-reminder',
    name: 'Early Delinquency Digital Reminder',
    minDpd: 1,
    maxDpd: 7,
    action: 'REMINDER',
    priorityBand: 'LOW',
    autoAssign: false,
    slaHours: 48,
  },
  {
    id: 'rule-soft-queue',
    name: 'Soft Outreach & Queue Routing',
    minDpd: 8,
    maxDpd: 30,
    action: 'REMINDER_AND_QUEUE',
    priorityBand: 'MEDIUM',
    autoAssign: true,
    slaHours: 24,
  },
  {
    id: 'rule-collector-assignment',
    name: 'Collector Direct Engagement (SMA-1)',
    minDpd: 31,
    maxDpd: 60,
    action: 'COLLECTOR_ASSIGNMENT',
    priorityBand: 'HIGH',
    autoAssign: true,
    slaHours: 12,
  },
  {
    id: 'rule-supervisor-escalation',
    name: 'Escalated Collection & Field Scheduling (SMA-2)',
    minDpd: 61,
    maxDpd: 90,
    action: 'ESCALATED_COLLECTION',
    priorityBand: 'CRITICAL',
    autoAssign: true,
    slaHours: 6,
  },
  {
    id: 'rule-legal-recovery',
    name: 'NPA Specialized Legal & Debt Recovery',
    minDpd: 91,
    maxDpd: 99999,
    action: 'RECOVERY_LEGAL_REVIEW',
    priorityBand: 'CRITICAL',
    autoAssign: true,
    slaHours: 4,
  },
];

export class CollectionStrategyService {
  private strategies: Map<string, CollectionStrategyDefinition> = new Map();

  constructor() {
    this.seedDefaultStrategies();
  }

  private seedDefaultStrategies(): void {
    const defaultStrategy: CollectionStrategyDefinition = {
      id: 'strat-default-global',
      tenantId: 'tenant-adyapan-default',
      name: 'Standard Retail & Digital Lending Collection Strategy',
      description: 'Default 5-tier risk-calibrated delinquency outreach and recovery policy.',
      version: 1,
      status: 'ACTIVE',
      effectiveDate: new Date().toISOString(),
      buckets: [...DEFAULT_AGING_BUCKETS],
      rules: [...DEFAULT_COLLECTION_RULES],
      priorityWeights: {
        dpdWeight: 0.35,
        overdueAmountWeight: 0.25,
        riskGradeWeight: 0.15,
        brokenPtpWeight: 0.15,
        contactabilityWeight: 0.10,
      },
      escalationThresholds: {
        brokenPtpCount: 2,
        maxDpdBeforeLegal: 90,
        slaBreachHours: 24,
      },
      createdBy: 'SYSTEM_SEEDED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.strategies.set(defaultStrategy.id, defaultStrategy);
  }

  /**
   * Calculate a deterministic 0-100 Collection Priority Score
   */
  public calculatePriorityScore(input: {
    dpd: number;
    overdueAmount: number;
    riskGrade?: string; // 'A' | 'B' | 'C' | 'D' | 'E'
    riskScore?: number; // 0 - 100
    fraudOutcome?: string; // 'CLEAR' | 'LOW_RISK' | 'REVIEW' | 'HIGH_RISK' | 'BLOCK'
    brokenPtpCount?: number;
    failedContactsCount?: number;
    strategyId?: string;
  }): CollectionPriorityScore {
    const strategy = input.strategyId ? this.strategies.get(input.strategyId) : undefined;
    const weights = strategy?.priorityWeights || {
      dpdWeight: 0.35,
      overdueAmountWeight: 0.25,
      riskGradeWeight: 0.15,
      brokenPtpWeight: 0.15,
      contactabilityWeight: 0.10,
    };

    // 1. DPD Factor (0 - 100)
    // 0 DPD -> 0 score, 90+ DPD -> 100 score
    const dpdScore = Math.min(100, Math.round((input.dpd / 90) * 100));

    // 2. Overdue Amount Factor (0 - 100)
    // Scale: <= 5,000 -> 20, 25,000 -> 50, 100,000+ -> 100
    let overdueAmountScore = 20;
    if (input.overdueAmount >= 100000) overdueAmountScore = 100;
    else if (input.overdueAmount >= 50000) overdueAmountScore = 80;
    else if (input.overdueAmount >= 25000) overdueAmountScore = 60;
    else if (input.overdueAmount >= 10000) overdueAmountScore = 40;

    // 3. Risk Grade & Score Factor (0 - 100)
    let riskGradeScore = 20;
    const grade = (input.riskGrade || 'C').toUpperCase();
    if (grade === 'E') riskGradeScore = 100;
    else if (grade === 'D') riskGradeScore = 80;
    else if (grade === 'C') riskGradeScore = 50;
    else if (grade === 'B') riskGradeScore = 30;
    else if (grade === 'A') riskGradeScore = 10;

    // If fraud flag elevated, boost risk grade score
    if (input.fraudOutcome === 'BLOCK' || input.fraudOutcome === 'HIGH_RISK') {
      riskGradeScore = 100;
    }

    // 4. Broken PTP Factor (0 - 100)
    const brokenPtp = input.brokenPtpCount || 0;
    let brokenPtpScore = 0;
    if (brokenPtp >= 3) brokenPtpScore = 100;
    else if (brokenPtp === 2) brokenPtpScore = 75;
    else if (brokenPtp === 1) brokenPtpScore = 50;

    // 5. Contactability Factor (0 - 100)
    const failedContacts = input.failedContactsCount || 0;
    let contactabilityScore = 20;
    if (failedContacts >= 5) contactabilityScore = 100;
    else if (failedContacts >= 3) contactabilityScore = 70;
    else if (failedContacts >= 1) contactabilityScore = 40;

    // Compute composite weighted score
    const compositeScore = Math.min(
      100,
      Math.round(
        dpdScore * weights.dpdWeight +
        overdueAmountScore * weights.overdueAmountWeight +
        riskGradeScore * weights.riskGradeWeight +
        brokenPtpScore * weights.brokenPtpWeight +
        contactabilityScore * weights.contactabilityWeight
      )
    );

    let band: CollectionPriorityBand = 'LOW';
    if (compositeScore >= 80 || input.dpd > 60 || brokenPtp >= 2) {
      band = 'CRITICAL';
    } else if (compositeScore >= 60 || input.dpd > 30) {
      band = 'HIGH';
    } else if (compositeScore >= 35 || input.dpd > 10) {
      band = 'MEDIUM';
    }

    // Determine strategy phase
    let strategyPhase: CollectionStrategyPhase = 'REMINDER';
    let recommendedAction = 'Automated SMS / Push repayment reminder';

    if (input.dpd > 90 || band === 'CRITICAL' && input.dpd > 60) {
      strategyPhase = 'RECOVERY_LEGAL_REVIEW';
      recommendedAction = 'Initiate specialized legal recovery / debt settlement evaluation';
    } else if (input.dpd > 60 || band === 'CRITICAL') {
      strategyPhase = 'ESCALATED_COLLECTION';
      recommendedAction = 'Supervisor escalation & field recovery visit scheduling';
    } else if (input.dpd > 30 || band === 'HIGH') {
      strategyPhase = 'COLLECTOR_ASSIGNMENT';
      recommendedAction = 'Assign to dedicated collection officer for phone engagement';
    } else if (input.dpd > 7 || band === 'MEDIUM') {
      strategyPhase = 'REMINDER_AND_QUEUE';
      recommendedAction = 'Route to early collection work queue with soft outreach';
    }

    return {
      score: compositeScore,
      band,
      factors: {
        dpdScore,
        overdueAmountScore,
        riskGradeScore,
        brokenPtpScore,
        contactabilityScore,
      },
      recommendedAction,
      strategyPhase,
    };
  }

  /**
   * Get Active Strategy for a tenant/product
   */
  public getActiveStrategy(tenantId?: string, productCode?: string): CollectionStrategyDefinition {
    const list = Array.from(this.strategies.values());
    const matched = list.find((s) =>
      s.status === 'ACTIVE' &&
      (!tenantId || s.tenantId === tenantId) &&
      (!productCode || !s.productScope?.length || s.productScope.includes(productCode))
    );

    if (matched) return matched;
    // Return first active or seed default
    const fallback = list.find((s) => s.status === 'ACTIVE');
    if (fallback) return fallback;

    this.seedDefaultStrategies();
    return this.strategies.get('strat-default-global')!;
  }

  /**
   * Create a new draft collection strategy
   */
  public createStrategy(input: {
    tenantId: string;
    name: string;
    description: string;
    productScope?: string[];
    buckets?: any[];
    rules?: StrategyRule[];
    priorityWeights?: any;
    escalationThresholds?: any;
    createdBy: string;
  }): CollectionStrategyDefinition {
    const strategy: CollectionStrategyDefinition = {
      id: `strat-${uuid().slice(0, 8)}`,
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      version: 1,
      status: 'DRAFT',
      effectiveDate: new Date().toISOString(),
      productScope: input.productScope || [],
      buckets: input.buckets || [...DEFAULT_AGING_BUCKETS],
      rules: input.rules || [...DEFAULT_COLLECTION_RULES],
      priorityWeights: input.priorityWeights || {
        dpdWeight: 0.35,
        overdueAmountWeight: 0.25,
        riskGradeWeight: 0.15,
        brokenPtpWeight: 0.15,
        contactabilityWeight: 0.10,
      },
      escalationThresholds: input.escalationThresholds || {
        brokenPtpCount: 2,
        maxDpdBeforeLegal: 90,
        slaBreachHours: 24,
      },
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.strategies.set(strategy.id, strategy);
    return strategy;
  }

  /**
   * Activate a collection strategy version
   */
  public activateStrategy(id: string): CollectionStrategyDefinition {
    const strategy = this.strategies.get(id);
    if (!strategy) throw new NotFoundError(`Strategy ${id} not found.`);

    // Archive previous active strategies for the same tenant & product scope
    for (const [key, item] of this.strategies.entries()) {
      if (item.tenantId === strategy.tenantId && item.status === 'ACTIVE' && item.id !== id) {
        this.strategies.set(key, { ...item, status: 'ARCHIVED', updatedAt: new Date().toISOString() });
      }
    }

    const updated: CollectionStrategyDefinition = {
      ...strategy,
      status: 'ACTIVE',
      effectiveDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.strategies.set(id, updated);
    return updated;
  }

  /**
   * List all strategy versions
   */
  public listStrategies(tenantId?: string): CollectionStrategyDefinition[] {
    let list = Array.from(this.strategies.values());
    if (tenantId) {
      list = list.filter((s) => s.tenantId === tenantId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const collectionStrategyService = new CollectionStrategyService();
