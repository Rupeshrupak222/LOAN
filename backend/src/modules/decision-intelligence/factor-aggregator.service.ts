import { DecisionContext, DecisionFactor } from './decision-intelligence.types';

export class FactorAggregatorService {
  /**
   * Translates multi-dimensional decision context into an explainable decision factors matrix.
   */
  public static aggregate(context: DecisionContext): DecisionFactor[] {
    const factors: DecisionFactor[] = [];
    const { identity, application, financial, credit, risk, fraudAndAnomalies, underwriting, disbursementReadiness } = context;

    // 1. IDENTITY & KYC FACTORS
    if (identity.kycStatus === 'VERIFIED') {
      factors.push({
        factorId: 'FACT-KYC-VERIFIED',
        category: 'IDENTITY',
        title: 'Statutory KYC Verified',
        status: 'POSITIVE',
        severity: 'LOW',
        source: 'KYC & Compliance Engine',
        evidence: `KYC status is VERIFIED with ${identity.verifiedDocumentsCount} validated documents.`,
        confidence: 'HIGH',
        impact: 'MEDIUM',
      });
    } else if (identity.kycStatus === 'REJECTED') {
      factors.push({
        factorId: 'FACT-KYC-REJECTED',
        category: 'IDENTITY',
        title: 'KYC Verification Rejected',
        status: 'BLOCKING',
        severity: 'CRITICAL',
        source: 'KYC & Compliance Engine',
        evidence: 'Mandatory KYC documentation was formally rejected by compliance.',
        confidence: 'HIGH',
        impact: 'CRITICAL',
      });
    } else {
      factors.push({
        factorId: 'FACT-KYC-PENDING',
        category: 'IDENTITY',
        title: 'KYC Verification Pending',
        status: 'ATTENTION',
        severity: 'MEDIUM',
        source: 'KYC & Compliance Engine',
        evidence: `Current KYC status is '${identity.kycStatus}'. Missing categories: ${identity.missingMandatoryCategories.join(', ') || 'None'}.`,
        confidence: 'HIGH',
        impact: 'HIGH',
      });
    }

    // 2. FINANCIAL & INCOME FACTORS
    if (financial.salaryFrequency === 'MONTHLY' && (financial.incomeStabilityScore || 0) >= 70) {
      factors.push({
        factorId: 'FACT-SALARY-CONSISTENT',
        category: 'FINANCIAL',
        title: 'Consistent Monthly Payroll Inflows',
        status: 'POSITIVE',
        severity: 'LOW',
        source: 'Bank Statement Intelligence',
        evidence: `Verified regular monthly payroll credits (~INR ${(financial.observedBankIncome || 0).toLocaleString('en-IN')}) with stability score ${financial.incomeStabilityScore}/100.`,
        confidence: 'HIGH',
        impact: 'HIGH',
      });
    }

    if (financial.foirPercent !== undefined) {
      if (financial.foirPercent <= 40) {
        factors.push({
          factorId: 'FACT-FOIR-HEALTHY',
          category: 'FINANCIAL',
          title: 'Conservative Debt-to-Income / FOIR Ratio',
          status: 'POSITIVE',
          severity: 'LOW',
          source: 'Eligibility Engine',
          evidence: `Calculated FOIR is ${financial.foirPercent}%, well within standard 50% policy threshold.`,
          confidence: 'HIGH',
          impact: 'HIGH',
        });
      } else if (financial.foirPercent > 60) {
        factors.push({
          factorId: 'FACT-FOIR-ELEVATED',
          category: 'FINANCIAL',
          title: 'High Debt Obligation Burden (FOIR > 60%)',
          status: 'HIGH_RISK',
          severity: 'HIGH',
          source: 'Eligibility Engine',
          evidence: `Calculated FOIR is ${financial.foirPercent}%, exceeding safe servicing guidelines.`,
          confidence: 'HIGH',
          impact: 'HIGH',
        });
      }
    }

    if ((financial.netMonthlyCashFlow || 0) > 0) {
      factors.push({
        factorId: 'FACT-CASHFLOW-SURPLUS',
        category: 'FINANCIAL',
        title: 'Positive Net Monthly Cash Flow',
        status: 'POSITIVE',
        severity: 'LOW',
        source: 'Bank Statement Intelligence',
        evidence: `Net monthly cash surplus of INR ${(financial.netMonthlyCashFlow || 0).toLocaleString('en-IN')} with Average Bank Balance of INR ${(financial.averageBankBalance || 0).toLocaleString('en-IN')}.`,
        confidence: 'HIGH',
        impact: 'MEDIUM',
      });
    } else if ((financial.netMonthlyCashFlow || 0) < 0) {
      factors.push({
        factorId: 'FACT-CASHFLOW-DEFICIT',
        category: 'FINANCIAL',
        title: 'Net Monthly Cash Flow Deficit',
        status: 'ATTENTION',
        severity: 'MEDIUM',
        source: 'Bank Statement Intelligence',
        evidence: `Outflows exceed inflows by INR ${Math.abs(financial.netMonthlyCashFlow || 0).toLocaleString('en-IN')} across statement period.`,
        confidence: 'HIGH',
        impact: 'MEDIUM',
      });
    }

    // 3. CREDIT & REPAYMENT FACTORS
    if (credit.maxDpdHistorical === 0 && credit.totalOverdueAmount === 0) {
      factors.push({
        factorId: 'FACT-CLEAN-CREDIT',
        category: 'CREDIT',
        title: 'Flawless Historical Repayment Track Record',
        status: 'POSITIVE',
        severity: 'LOW',
        source: 'Credit Intelligence / Loan Ledger',
        evidence: 'Zero historical DPD and zero overdue balance across all active and historical loan accounts.',
        confidence: 'HIGH',
        impact: 'HIGH',
      });
    } else if (credit.maxDpdHistorical > 30 || credit.totalOverdueAmount > 0) {
      factors.push({
        factorId: 'FACT-CREDIT-DELINQUENCY',
        category: 'CREDIT',
        title: 'Historical Delinquency / Overdue Obligations',
        status: 'HIGH_RISK',
        severity: 'HIGH',
        source: 'Credit Intelligence / Loan Ledger',
        evidence: `Recorded max DPD of ${credit.maxDpdHistorical} days with active overdue balance of INR ${credit.totalOverdueAmount.toLocaleString('en-IN')}.`,
        confidence: 'HIGH',
        impact: 'HIGH',
      });
    }

    // 4. RISK ASSESSMENT FACTORS
    if (risk.category === 'LOW') {
      factors.push({
        factorId: 'FACT-RISK-LOW',
        category: 'RISK',
        title: 'Low Credit Risk Tier',
        status: 'POSITIVE',
        severity: 'LOW',
        source: '4-Pillar Risk Engine',
        evidence: `Assessed risk score of ${risk.score}/100 placed in LOW risk category.`,
        confidence: 'HIGH',
        impact: 'HIGH',
      });
    } else if (risk.category === 'HIGH') {
      factors.push({
        factorId: 'FACT-RISK-HIGH',
        category: 'RISK',
        title: 'High Credit Risk Tier',
        status: 'HIGH_RISK',
        severity: 'HIGH',
        source: '4-Pillar Risk Engine',
        evidence: `Risk score of ${risk.score}/100 placed in HIGH risk category. Review risk pillars.`,
        confidence: 'HIGH',
        impact: 'HIGH',
      });
    }

    // 5. FRAUD & ANOMALY FACTORS
    if (fraudAndAnomalies.highRiskFraudSignalsCount > 0) {
      factors.push({
        factorId: 'FACT-FRAUD-HIGH-RISK',
        category: 'FRAUD',
        title: 'High-Risk Fraud / Anomaly Signals Detected',
        status: 'HIGH_RISK',
        severity: 'CRITICAL',
        source: 'Fraud & Anomaly Intelligence',
        evidence: `${fraudAndAnomalies.highRiskFraudSignalsCount} high-risk fraud/anomaly signals detected. Manual investigation required.`,
        confidence: 'HIGH',
        impact: 'CRITICAL',
      });
    } else if (fraudAndAnomalies.fraudSignalsCount === 0 && fraudAndAnomalies.bankAnomaliesCount === 0) {
      factors.push({
        factorId: 'FACT-FRAUD-CLEAN',
        category: 'FRAUD',
        title: 'Zero Fraud or Identity Anomalies',
        status: 'POSITIVE',
        severity: 'LOW',
        source: 'Fraud & Anomaly Intelligence',
        evidence: 'Clean fraud scan: Zero duplicate identities, network clustering, or transaction anomalies.',
        confidence: 'HIGH',
        impact: 'MEDIUM',
      });
    }

    // 6. UNDERWRITING & WORKFLOW
    if (underwriting.conditions.length > 0) {
      factors.push({
        factorId: 'FACT-UND-CONDITIONS',
        category: 'UNDERWRITING',
        title: 'Pending Underwriting Approval Conditions',
        status: 'ATTENTION',
        severity: 'MEDIUM',
        source: 'Underwriting Engine',
        evidence: `${underwriting.conditions.length} sanction conditions stipulated (e.g., '${underwriting.conditions[0]}').`,
        confidence: 'HIGH',
        impact: 'MEDIUM',
      });
    }

    // 7. DISBURSEMENT READINESS
    if (!disbursementReadiness.isBankVerified) {
      factors.push({
        factorId: 'FACT-DISB-UNVERIFIED-BANK',
        category: 'DISBURSEMENT',
        title: 'Disbursement Bank Account Not Verified',
        status: 'ATTENTION',
        severity: 'MEDIUM',
        source: 'Disbursement Engine',
        evidence: 'Borrower bank account penny-drop or penny-less verification has not been completed.',
        confidence: 'HIGH',
        impact: 'HIGH',
      });
    }

    return factors;
  }
}
