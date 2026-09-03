import {
  EarlyWarningAlert,
  SystemEvent,
  WarningRuleCode,
  WarningDomain,
  WarningPriority,
} from './early-warning.types';

export interface WarningRuleDefinition {
  code: WarningRuleCode;
  domain: WarningDomain;
  title: string;
  defaultPriority: WarningPriority;
  recommendedAction: string;
  evaluateEvent?: (event: SystemEvent) => { triggered: boolean; evidence?: string; severityOverride?: WarningPriority } | null;
}

export class WarningRulesRegistry {
  private static readonly rules: Map<WarningRuleCode, WarningRuleDefinition> = new Map([
    // 1. Application Rules
    [
      'APP_SLA_BREACH',
      {
        code: 'APP_SLA_BREACH',
        domain: 'APPLICATION',
        title: 'Application Underwriting SLA Breached (>7 Days)',
        defaultPriority: 'HIGH',
        recommendedAction: 'Reassign application to priority underwriter queue or escalate to Branch Credit Head.',
        evaluateEvent: (event) => {
          if (event.eventType === 'APPLICATION_SLA_CHECK') {
            const ageDays = Number(event.metadata?.ageDays || 0);
            if (ageDays >= 7) {
              return {
                triggered: true,
                evidence: `Application has remained in '${event.metadata?.stage || 'REVIEW'}' stage for ${ageDays} days without adjudication.`,
                severityOverride: ageDays >= 14 ? 'CRITICAL' : 'HIGH',
              };
            }
          }
          return null;
        },
      },
    ],
    [
      'APP_REPEATED_SEND_BACK',
      {
        code: 'APP_REPEATED_SEND_BACK',
        domain: 'APPLICATION',
        title: 'Repeated Application Send-Backs (>=2 Iterations)',
        defaultPriority: 'MEDIUM',
        recommendedAction: 'Initiate supervisor review with loan officer to resolve recurring documentation defects.',
        evaluateEvent: (event) => {
          if (event.eventType === 'APPLICATION_SEND_BACK') {
            const sendBackCount = Number(event.metadata?.sendBackCount || 1);
            if (sendBackCount >= 2) {
              return {
                triggered: true,
                evidence: `Application has been sent back ${sendBackCount} times. Latest rationale: '${event.metadata?.reason || 'Document deficiencies'}'.`,
              };
            }
          }
          return null;
        },
      },
    ],
    [
      'APP_CRITICAL_DATA_MUTATED',
      {
        code: 'APP_CRITICAL_DATA_MUTATED',
        domain: 'APPLICATION',
        title: 'Decision-Critical Financial Parameter Mutated Post-Assessment',
        defaultPriority: 'HIGH',
        recommendedAction: 'Re-run automated rule eligibility and 4-pillar risk assessment against updated parameters.',
        evaluateEvent: (event) => {
          if (event.eventType === 'APPLICATION_DATA_MUTATED') {
            const field = String(event.metadata?.field || '');
            return {
              triggered: true,
              evidence: `Parameter '${field}' changed from '${event.previousValue}' to '${event.currentValue}'. Impact: ${event.metadata?.impact || 'Alters servicing capacity'}.`,
            };
          }
          return null;
        },
      },
    ],

    // 2. Financial & Banking Rules
    [
      'FIN_INCOME_DROP',
      {
        code: 'FIN_INCOME_DROP',
        domain: 'FINANCIAL',
        title: 'Material Income Degradation Detected (>25% Inflow Shortfall)',
        defaultPriority: 'HIGH',
        recommendedAction: 'Request latest 3 months salary slips or secondary bank account statement to verify employment continuity.',
        evaluateEvent: (event) => {
          if (event.eventType === 'BANK_INTELLIGENCE_REFRESHED' || event.eventType === 'INCOME_EVALUATED') {
            const dropPct = Number(event.metadata?.dropPercentage || 0);
            if (dropPct >= 25) {
              return {
                triggered: true,
                evidence: `Observed recurring salary credits dropped by ${Math.round(dropPct)}% compared to established profile baseline.`,
                severityOverride: dropPct >= 45 ? 'CRITICAL' : 'HIGH',
              };
            }
          }
          return null;
        },
      },
    ],
    [
      'FIN_LIQUIDITY_STRESS',
      {
        code: 'FIN_LIQUIDITY_STRESS',
        domain: 'FINANCIAL',
        title: 'Account Liquidity Stress (>5 Low-Balance Days)',
        defaultPriority: 'MEDIUM',
        recommendedAction: 'Inspect borrower cash buffer and ensure mandate debit date aligns with actual salary deposit date.',
        evaluateEvent: (event) => {
          if (event.eventType === 'BANK_STATEMENT_ANALYZED') {
            const lowBalDays = Number(event.metadata?.lowBalanceDaysCount || 0);
            if (lowBalDays >= 5) {
              return {
                triggered: true,
                evidence: `Account recorded ${lowBalDays} days with closing balance below INR 1,000 during statement period.`,
              };
            }
          }
          return null;
        },
      },
    ],
    [
      'FIN_CASH_BURN_VELOCITY',
      {
        code: 'FIN_CASH_BURN_VELOCITY',
        domain: 'FINANCIAL',
        title: 'Elevated Cash Burn Velocity (>1.25x Outflows/Inflows)',
        defaultPriority: 'HIGH',
        recommendedAction: 'Evaluate living expenditure stability and check for undisclosed personal loans or fintech lines.',
        evaluateEvent: (event) => {
          if (event.eventType === 'BANK_STATEMENT_ANALYZED') {
            const burnRatio = Number(event.metadata?.cashBurnVelocityRatio || 0);
            if (burnRatio >= 1.25) {
              return {
                triggered: true,
                evidence: `Cash burn velocity ratio is ${burnRatio}x (monthly outflows consistently outstrip inflows).`,
              };
            }
          }
          return null;
        },
      },
    ],

    // 3. Credit & Delinquency Rules
    [
      'CRED_RISK_SCORE_DROP',
      {
        code: 'CRED_RISK_SCORE_DROP',
        domain: 'CREDIT',
        title: 'Credit Risk Category Deteriorated to HIGH Risk Tier',
        defaultPriority: 'HIGH',
        recommendedAction: 'Conduct comprehensive underwriting review and evaluate credit enhancement or guarantor requirement.',
        evaluateEvent: (event) => {
          if (event.eventType === 'RISK_SCORE_UPDATED') {
            const newTier = String(event.currentValue || '').toUpperCase();
            if (newTier === 'HIGH') {
              return {
                triggered: true,
                evidence: `Risk assessment score dropped to ${event.metadata?.score || '<45'}/100, reclassifying account into HIGH risk tier.`,
              };
            }
          }
          return null;
        },
      },
    ],
    [
      'CRED_DPD_THRESHOLD_30',
      {
        code: 'CRED_DPD_THRESHOLD_30',
        domain: 'CREDIT',
        title: 'Delinquency Reached 30 DPD Threshold (SMA-1)',
        defaultPriority: 'HIGH',
        recommendedAction: 'Assign dedicated recovery officer and establish direct telephonic contact with borrower.',
        evaluateEvent: (event) => {
          if (event.eventType === 'DPD_THRESHOLD_CROSSED') {
            const dpd = Number(event.currentValue || 0);
            if (dpd >= 30 && dpd < 60) {
              return {
                triggered: true,
                evidence: `Account delinquency reached ${dpd} DPD with overdue balance of INR ${Number(event.metadata?.overdueAmount || 0).toLocaleString('en-IN')}.`,
              };
            }
          }
          return null;
        },
      },
    ],
    [
      'CRED_DPD_THRESHOLD_60',
      {
        code: 'CRED_DPD_THRESHOLD_60',
        domain: 'CREDIT',
        title: 'Critical Delinquency Reached 60 DPD Threshold (SMA-2)',
        defaultPriority: 'CRITICAL',
        recommendedAction: 'Issue formal statutory loan recall / demand notice and schedule urgent field visit.',
        evaluateEvent: (event) => {
          if (event.eventType === 'DPD_THRESHOLD_CROSSED') {
            const dpd = Number(event.currentValue || 0);
            if (dpd >= 60) {
              return {
                triggered: true,
                evidence: `Account entered severe delinquency at ${dpd} DPD. Imminent risk of NPA classification.`,
                severityOverride: 'CRITICAL',
              };
            }
          }
          return null;
        },
      },
    ],
    [
      'CRED_REPEATED_BOUNCE',
      {
        code: 'CRED_REPEATED_BOUNCE',
        domain: 'CREDIT',
        title: 'Repeated NACH / Autodebit Transaction Failures (>=2 Consecutive)',
        defaultPriority: 'HIGH',
        recommendedAction: 'Verify bank account status, mandate validity, and collect payment via alternate digital link.',
        evaluateEvent: (event) => {
          if (event.eventType === 'PAYMENT_FAILED') {
            const consecutiveFails = Number(event.metadata?.consecutiveFailures || 1);
            if (consecutiveFails >= 2) {
              return {
                triggered: true,
                evidence: `NACH/eNACH debit bounced ${consecutiveFails} consecutive times. Reason: '${event.metadata?.failureReason || 'Insufficient Funds'}'.`,
              };
            }
          }
          return null;
        },
      },
    ],

    // 4. Fraud & Anomaly Rules
    [
      'FRAUD_NEW_HIGH_RISK',
      {
        code: 'FRAUD_NEW_HIGH_RISK',
        domain: 'FRAUD',
        title: 'High-Risk Identity / Network Anomaly Signal Detected',
        defaultPriority: 'CRITICAL',
        recommendedAction: 'Immediately halt underwriting approval and initiate field verification / compliance inspection.',
        evaluateEvent: (event) => {
          if (event.eventType === 'FRAUD_SIGNAL_DETECTED') {
            const sev = String(event.severity || '').toUpperCase();
            if (sev === 'CRITICAL' || sev === 'HIGH') {
              return {
                triggered: true,
                evidence: `Fraud scan identified: ${event.metadata?.signalTitle || 'High-risk syndicated identity anomaly'}.`,
                severityOverride: 'CRITICAL',
              };
            }
          }
          return null;
        },
      },
    ],

    // 5. Collections Rules
    [
      'COLL_BROKEN_PTP',
      {
        code: 'COLL_BROKEN_PTP',
        domain: 'COLLECTIONS',
        title: 'Promise-to-Pay (PTP) Commitment Broken with Zero Remittance',
        defaultPriority: 'HIGH',
        recommendedAction: 'Escalate collection case from soft-calling to field recovery visit within 24 hours.',
        evaluateEvent: (event) => {
          if (event.eventType === 'PTP_BROKEN') {
            return {
              triggered: true,
              evidence: `Borrower failed to honor PTP commitment of INR ${Number(event.metadata?.promisedAmount || 0).toLocaleString('en-IN')} due on ${event.metadata?.promisedDate || 'agreed date'}.`,
            };
          }
          return null;
        },
      },
    ],
  ]);

  public static getRule(code: WarningRuleCode): WarningRuleDefinition | undefined {
    return this.rules.get(code);
  }

  public static getAllRules(): WarningRuleDefinition[] {
    return Array.from(this.rules.values());
  }
}
