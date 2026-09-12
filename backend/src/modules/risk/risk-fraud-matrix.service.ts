import { RiskBand } from './risk.types';
import { FraudScoreBand, FraudOutcome } from '../fraud/fraud.types';

export type UnifiedMatrixAction =
  | 'NORMAL'
  | 'REVIEW'
  | 'ADDITIONAL_REVIEW'
  | 'CREDIT_REVIEW'
  | 'FRAUD_REVIEW'
  | 'BLOCK';

export interface MatrixDecisionRule {
  riskBand: RiskBand;
  fraudBand: FraudScoreBand;
  action: UnifiedMatrixAction;
  description: string;
}

export interface RiskFraudMatrixResult {
  riskScore: number;
  fraudScore: number;
  riskBand: RiskBand;
  fraudBand: FraudScoreBand;
  action: UnifiedMatrixAction;
  operationalAction: UnifiedMatrixAction;
  description: string;
  recommendedWorkflowStage: string;
  requiresFraudDesk: boolean;
  requiresCreditDesk: boolean;
  autoBlock: boolean;
  hardBlock: boolean;
  allowInstantSanction: boolean;
}

export class RiskFraudMatrixService {
  private static instance: RiskFraudMatrixService;

  // Canonical Matrix Table (Configurable per Tenant)
  private readonly matrixRules: MatrixDecisionRule[] = [
    // Low Risk
    { riskBand: 'LOW', fraudBand: 'LOW', action: 'NORMAL', description: 'Clean fraud profile with prime credit standing. Fast-track automated sanction.' },
    { riskBand: 'LOW', fraudBand: 'MODERATE', action: 'NORMAL', description: 'Prime credit with minor behavioral signals. Standard STP flow.' },
    { riskBand: 'LOW', fraudBand: 'ELEVATED', action: 'FRAUD_REVIEW', description: 'Prime credit borrower with elevated device or network anomalies. Route to Fraud Desk.' },
    { riskBand: 'LOW', fraudBand: 'HIGH', action: 'FRAUD_REVIEW', description: 'High fraud signals despite prime credit. Route to Fraud Desk before approval.' },
    { riskBand: 'LOW', fraudBand: 'CRITICAL', action: 'BLOCK', description: 'Critical fraud indicators (e.g. duplicate PAN or device syndicate). Auto-block.' },

    // Moderate Risk
    { riskBand: 'MODERATE', fraudBand: 'LOW', action: 'NORMAL', description: 'Standard credit profile with pristine fraud standing. Automated BRE processing.' },
    { riskBand: 'MODERATE', fraudBand: 'MODERATE', action: 'NORMAL', description: 'Standard credit and moderate digital signals. Standard approval.' },
    { riskBand: 'MODERATE', fraudBand: 'ELEVATED', action: 'FRAUD_REVIEW', description: 'Standard credit with anomaly signals. Route to Fraud Desk.' },
    { riskBand: 'MODERATE', fraudBand: 'HIGH', action: 'FRAUD_REVIEW', description: 'High fraud risk. Mandate fraud analyst sign-off.' },
    { riskBand: 'MODERATE', fraudBand: 'CRITICAL', action: 'BLOCK', description: 'Critical fraud indicators. Auto-block.' },

    // Medium Risk
    { riskBand: 'MEDIUM', fraudBand: 'LOW', action: 'CREDIT_REVIEW', description: 'Medium credit risk (FOIR ~50%) with zero fraud indicators. Standard underwriting.' },
    { riskBand: 'MEDIUM', fraudBand: 'MODERATE', action: 'CREDIT_REVIEW', description: 'Medium credit risk with moderate signals. Standard credit review.' },
    { riskBand: 'MEDIUM', fraudBand: 'ELEVATED', action: 'ADDITIONAL_REVIEW', description: 'Elevated anomalies and medium credit burden. Manual analyst review.' },
    { riskBand: 'MEDIUM', fraudBand: 'HIGH', action: 'FRAUD_REVIEW', description: 'High fraud signals on medium risk loan. Escalate to Fraud Desk.' },
    { riskBand: 'MEDIUM', fraudBand: 'CRITICAL', action: 'BLOCK', description: 'Critical fraud alert. Block application.' },

    // High Risk
    { riskBand: 'HIGH', fraudBand: 'LOW', action: 'CREDIT_REVIEW', description: 'High repayment risk (subprime bureau or high FOIR) but authentic customer. Credit Review.' },
    { riskBand: 'HIGH', fraudBand: 'MODERATE', action: 'CREDIT_REVIEW', description: 'High repayment risk. Underwriter review with collateral/guarantor requirement.' },
    { riskBand: 'HIGH', fraudBand: 'ELEVATED', action: 'ADDITIONAL_REVIEW', description: 'High credit risk with anomaly signals. Underwriting exception required.' },
    { riskBand: 'HIGH', fraudBand: 'HIGH', action: 'FRAUD_REVIEW', description: 'Severe credit risk combined with high fraud indicators. Formal fraud investigation.' },
    { riskBand: 'HIGH', fraudBand: 'CRITICAL', action: 'BLOCK', description: 'Critical fraud risk on subprime borrower. Auto-block.' },

    // Very High Risk
    { riskBand: 'VERY_HIGH', fraudBand: 'LOW', action: 'BLOCK', description: 'Extreme default risk (>80 score). Rejection under credit policy.' },
    { riskBand: 'VERY_HIGH', fraudBand: 'MODERATE', action: 'BLOCK', description: 'Extreme default risk. Rejection.' },
    { riskBand: 'VERY_HIGH', fraudBand: 'ELEVATED', action: 'BLOCK', description: 'Extreme credit risk and elevated anomalies. Rejection.' },
    { riskBand: 'VERY_HIGH', fraudBand: 'HIGH', action: 'BLOCK', description: 'Severe credit and fraud risk. Rejection.' },
    { riskBand: 'VERY_HIGH', fraudBand: 'CRITICAL', action: 'BLOCK', description: 'Confirmed toxic syndicate or subprime fraud. Total block.' },
  ];

  public static getInstance(): RiskFraudMatrixService {
    if (!RiskFraudMatrixService.instance) {
      RiskFraudMatrixService.instance = new RiskFraudMatrixService();
    }
    return RiskFraudMatrixService.instance;
  }

  public evaluateMatrix(
    risk: number | RiskBand,
    fraud: number | FraudScoreBand | FraudOutcome
  ): RiskFraudMatrixResult {
    let riskScore = 0;
    let riskBand: RiskBand = 'LOW';

    if (typeof risk === 'number') {
      riskScore = risk;
      if (risk > 80) riskBand = 'VERY_HIGH';
      else if (risk > 60) riskBand = 'HIGH';
      else if (risk > 40) riskBand = 'MEDIUM';
      else if (risk > 20) riskBand = 'MODERATE';
      else riskBand = 'LOW';
    } else {
      riskBand = risk;
      riskScore = riskBand === 'VERY_HIGH' ? 85 : riskBand === 'HIGH' ? 65 : riskBand === 'MEDIUM' ? 45 : riskBand === 'MODERATE' ? 25 : 10;
    }

    let fraudScore = 0;
    let fraudBand: FraudScoreBand = 'LOW';

    if (typeof fraud === 'number') {
      fraudScore = fraud;
      if (fraud >= 80) fraudBand = 'CRITICAL';
      else if (fraud >= 60) fraudBand = 'HIGH';
      else if (fraud >= 40) fraudBand = 'ELEVATED';
      else if (fraud >= 20) fraudBand = 'MODERATE';
      else fraudBand = 'LOW';
    } else {
      const fraudStr = String(fraud);
      if (fraudStr === 'BLOCK' || fraudStr === 'CRITICAL') {
        fraudBand = 'CRITICAL';
        fraudScore = 90;
      } else if (fraudStr === 'HIGH_RISK' || fraudStr === 'HIGH') {
        fraudBand = 'HIGH';
        fraudScore = 70;
      } else if (fraudStr === 'REVIEW' || fraudStr === 'ELEVATED') {
        fraudBand = 'ELEVATED';
        fraudScore = 50;
      } else if (fraudStr === 'LOW_RISK' || fraudStr === 'MODERATE') {
        fraudBand = 'MODERATE';
        fraudScore = 30;
      } else {
        fraudBand = 'LOW';
        fraudScore = 10;
      }
    }

    const rule =
      this.matrixRules.find((r) => r.riskBand === riskBand && r.fraudBand === fraudBand) || {
        riskBand,
        fraudBand,
        action: fraudBand === 'CRITICAL' ? 'BLOCK' : riskBand === 'VERY_HIGH' ? 'BLOCK' : 'REVIEW',
        description: 'Composite risk & fraud policy rule evaluation.',
      };

    let recommendedWorkflowStage = 'DECISION_ENGINE';
    let requiresFraudDesk = false;
    let requiresCreditDesk = false;
    let autoBlock = false;

    switch (rule.action) {
      case 'NORMAL':
        recommendedWorkflowStage = 'BRE_SANCTION';
        break;
      case 'REVIEW':
      case 'ADDITIONAL_REVIEW':
        recommendedWorkflowStage = 'CREDIT_ASSESSMENT';
        requiresCreditDesk = true;
        break;
      case 'CREDIT_REVIEW':
        recommendedWorkflowStage = 'UNDERWRITING_COMMITTEE';
        requiresCreditDesk = true;
        break;
      case 'FRAUD_REVIEW':
        recommendedWorkflowStage = 'FRAUD_INVESTIGATION_DESK';
        requiresFraudDesk = true;
        break;
      case 'BLOCK':
        recommendedWorkflowStage = 'REJECTED_BLOCK';
        autoBlock = true;
        break;
    }

    return {
      riskScore,
      fraudScore,
      riskBand,
      fraudBand,
      action: rule.action,
      operationalAction: rule.action,
      description: rule.description,
      recommendedWorkflowStage,
      requiresFraudDesk,
      requiresCreditDesk,
      autoBlock,
      hardBlock: rule.action === 'BLOCK',
      allowInstantSanction: rule.action === 'NORMAL',
    };
  }
}

export const riskFraudMatrixService = RiskFraudMatrixService.getInstance();
