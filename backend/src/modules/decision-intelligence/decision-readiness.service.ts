import {
  DecisionContext,
  DecisionFactor,
  DataConflict,
  DecisionReadinessState,
  ReviewPriority,
} from './decision-intelligence.types';

export class DecisionReadinessService {
  /**
   * Deterministically evaluates the decision readiness state and review priority.
   */
  public static evaluate(
    context: DecisionContext,
    factors: DecisionFactor[],
    conflicts: DataConflict[]
  ): { readinessState: DecisionReadinessState; readinessReason: string; reviewPriority: ReviewPriority } {
    const { identity, underwriting, risk, fraudAndAnomalies, financial } = context;

    // 1. Check if already decisioned
    if (underwriting.currentDecision) {
      return {
        readinessState: 'DECISIONED',
        readinessReason: `Application has already been formally decisioned as '${underwriting.currentDecision}' by ${underwriting.decidedBy || 'Underwriter'}.`,
        reviewPriority: 'LOW',
      };
    }

    // 2. Check for Blocking Business Blockers
    const blockingFactor = factors.find((f) => f.status === 'BLOCKING');
    if (blockingFactor) {
      return {
        readinessState: 'BLOCKED_BY_EXISTING_POLICY',
        readinessReason: `Hard policy blocker: ${blockingFactor.title} (${blockingFactor.evidence}).`,
        reviewPriority: 'CRITICAL',
      };
    }

    // 3. Check for Missing Mandatory Information
    if (identity.missingMandatoryCategories.length > 0 || identity.kycStatus === 'NOT_STARTED') {
      return {
        readinessState: 'MORE_INFORMATION_REQUIRED',
        readinessReason: `Missing mandatory onboarding documentation: ${identity.missingMandatoryCategories.join(', ') || 'KYC incomplete'}.`,
        reviewPriority: 'MEDIUM',
      };
    }

    // 4. Check for High Risk / Fraud Anomaly Review
    const hasCriticalConflict = conflicts.some((c) => c.severity === 'CRITICAL');
    const hasHighRiskFraud = fraudAndAnomalies.highRiskFraudSignalsCount > 0;
    const isHighRiskTier = risk.category === 'HIGH';

    if (hasCriticalConflict || hasHighRiskFraud || isHighRiskTier) {
      const reasons: string[] = [];
      if (hasHighRiskFraud) reasons.push(`${fraudAndAnomalies.highRiskFraudSignalsCount} fraud/anomaly signal(s)`);
      if (hasCriticalConflict) reasons.push('critical data conflict between declared income and banking turnover');
      if (isHighRiskTier) reasons.push('HIGH credit risk assessment tier');

      return {
        readinessState: 'HIGH_RISK_REVIEW',
        readinessReason: `Elevated underwriting scrutiny required: ${reasons.join('; ')}.`,
        reviewPriority: 'CRITICAL',
      };
    }

    // 5. Check for Policy Exception
    if ((financial.foirPercent || 0) > 60 || conflicts.length > 0) {
      return {
        readinessState: 'POLICY_EXCEPTION_REQUIRES_REVIEW',
        readinessReason: `Contains policy exceptions or data discrepancies requiring supervisory review (${conflicts.length} conflict(s) detected).`,
        reviewPriority: 'HIGH',
      };
    }

    // 6. Default: Ready for Review
    let reviewPriority: ReviewPriority = 'MEDIUM';
    if (risk.category === 'LOW' && conflicts.length === 0 && factors.every((f) => f.status !== 'HIGH_RISK')) {
      reviewPriority = 'LOW';
    }

    return {
      readinessState: 'READY_FOR_REVIEW',
      readinessReason: 'All mandatory KYC, financial, credit, and risk assessments are completed and verified for underwriting adjudication.',
      reviewPriority,
    };
  }
}
