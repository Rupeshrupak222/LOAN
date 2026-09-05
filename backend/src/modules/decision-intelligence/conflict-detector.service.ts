import { DataConflict, DecisionContext } from './decision-intelligence.types';

export class ConflictDetectorService {
  /**
   * Deterministically identifies factual discrepancies between disparate data sources.
   */
  public static detect(context: DecisionContext, extraData?: {
    employerNameDeclared?: string;
    primaryEmployerBank?: string;
    reportedIncomeDoc?: number;
    detectedEmisCount?: number;
  }): DataConflict[] {
    const conflicts: DataConflict[] = [];

    const { financial, credit } = context;

    // 1. Income Discrepancy (Declared vs Bank Observed)
    if (
      financial.declaredMonthlyIncome > 0 &&
      financial.observedBankIncome !== undefined &&
      financial.observedBankIncome > 0
    ) {
      const variance = financial.declaredMonthlyIncome - financial.observedBankIncome;
      const ratio = financial.declaredMonthlyIncome / financial.observedBankIncome;

      if (ratio >= 1.35 && variance >= 15000) {
        conflicts.push({
          conflictId: 'CONF-INCOME-DISCREPANCY',
          type: 'INCOME_DISCREPANCY',
          title: 'Declared Income Exceeds Bank Observed Income',
          severity: ratio >= 1.8 ? 'CRITICAL' : 'HIGH',
          sourceA: {
            module: 'Customer Profile / Application',
            field: 'declaredMonthlyIncome',
            value: financial.declaredMonthlyIncome,
          },
          sourceB: {
            module: 'Bank Statement Intelligence',
            field: 'averageMonthlyIncome',
            value: financial.observedBankIncome,
          },
          fact: `Customer declared INR ${financial.declaredMonthlyIncome.toLocaleString(
            'en-IN'
          )}/mo on application, but bank statement shows average monthly inflows of INR ${financial.observedBankIncome.toLocaleString(
            'en-IN'
          )}/mo (variance: INR ${variance.toLocaleString('en-IN')}, ratio: ${Math.round(ratio * 10) / 10}x).`,
          discrepancy: `Turnover shortfall: Factual bank inflows represent only ${Math.round(
            (financial.observedBankIncome / financial.declaredMonthlyIncome) * 100
          )}% of stated income.`,
          possibleExplanations: [
            'Applicant receives income across multiple unsubmitted bank accounts.',
            'Cash compensation, variable incentives, or unbilled business turnover.',
            'Stated gross income compared against net take-home bank credits.',
          ],
          recommendedHumanVerification:
            'Request 3 months of salary slips, Form 16 / ITR, or statements for all secondary operational bank accounts.',
        });
      }
    }

    // 2. Undisclosed Obligations Conflict
    if (
      financial.detectedMonthlyObligations !== undefined &&
      financial.detectedMonthlyObligations > financial.declaredMonthlyObligations + 3000
    ) {
      const variance = financial.detectedMonthlyObligations - financial.declaredMonthlyObligations;
      conflicts.push({
        conflictId: 'CONF-UNDISCLOSED-OBLIGATION',
        type: 'UNDISCLOSED_OBLIGATION',
        title: 'Bank Statement Detects Undisclosed Recurring Loan Obligations',
        severity: 'HIGH',
        sourceA: {
          module: 'Customer Profile / Application',
          field: 'declaredMonthlyObligations',
          value: financial.declaredMonthlyObligations,
        },
        sourceB: {
          module: 'Bank Statement Intelligence',
          field: 'detectedMonthlyObligations',
          value: financial.detectedMonthlyObligations,
        },
        fact: `Declared obligations: INR ${financial.declaredMonthlyObligations.toLocaleString(
          'en-IN'
        )}/mo. Documented bank statement EMI/mandate debits: INR ${financial.detectedMonthlyObligations.toLocaleString(
          'en-IN'
        )}/mo (unreported obligation: ~INR ${variance.toLocaleString('en-IN')}/mo).`,
        discrepancy: `Under-reported debt commitments artificially deflate calculated FOIR/DTI ratio.`,
        possibleExplanations: [
          'Recently sanctioned loans not yet indexed on credit bureau report.',
          'Borrower serves as co-applicant / servicing EMI for family member loan.',
          'Informal or short-term fintech credit line repayments.',
        ],
        recommendedHumanVerification:
          'Clarify recurring debits with borrower and obtain loan sanctions / loan account statements for detected lines.',
      });
    }

    // 3. Employer Name Mismatch
    const declaredEmp = (extraData?.employerNameDeclared || '').trim().toUpperCase();
    const bankEmp = (extraData?.primaryEmployerBank || '').trim().toUpperCase();

    if (declaredEmp && bankEmp && declaredEmp.length > 3 && bankEmp.length > 3) {
      const hasOverlap =
        declaredEmp.includes(bankEmp) ||
        bankEmp.includes(declaredEmp) ||
        declaredEmp.split(' ')[0] === bankEmp.split(' ')[0];

      if (!hasOverlap) {
        conflicts.push({
          conflictId: 'CONF-EMPLOYMENT-MISMATCH',
          type: 'EMPLOYMENT_MISMATCH',
          title: 'Declared Employer Differs from Bank Salary Remitter',
          severity: 'MEDIUM',
          sourceA: {
            module: 'Application Employment Details',
            field: 'employerName',
            value: declaredEmp,
          },
          sourceB: {
            module: 'Bank Statement Intelligence',
            field: 'primaryEmployerName',
            value: bankEmp,
          },
          fact: `Declared employer '${declaredEmp}' does not match primary payroll remitter identified on bank statement: '${bankEmp}'.`,
          discrepancy: 'Corporate identity mismatch between employment record and banking narration.',
          possibleExplanations: [
            'Parent company or third-party payroll processor (e.g. ADP, Quess, TeamLease) remits salary.',
            'Recent employer transition not updated on initial profile.',
            'Applicant is an external contractor / consultant for declared entity.',
          ],
          recommendedHumanVerification:
            'Obtain appointment letter, official corporate email verification, or employer ID card.',
        });
      }
    }

    // 4. Bureau vs Statement Debt Conflict
    if (credit.activeLoansCount === 0 && (extraData?.detectedEmisCount || 0) > 0) {
      conflicts.push({
        conflictId: 'CONF-BUREAU-DEBT-CONFLICT',
        type: 'BUREAU_DEBT_CONFLICT',
        title: 'Zero Bureau Active Loans but Recurring EMIs Detected in Banking',
        severity: 'HIGH',
        sourceA: {
          module: 'Credit Assessment / Bureau',
          field: 'activeLoansCount',
          value: 0,
        },
        sourceB: {
          module: 'Bank Statement Intelligence',
          field: 'detectedEmisCount',
          value: extraData!.detectedEmisCount!,
        },
        fact: `Credit history records zero active loan trade lines, yet bank statement shows ${extraData!.detectedEmisCount} recurring EMI debit lines.`,
        discrepancy: 'Bureau and cash ledger show divergent indebtedness.',
        possibleExplanations: [
          'Recent loan originated within last 30-45 days, pending bureau cycle update.',
          'Borrower paying third-party loan on behalf of guarantor or relative.',
        ],
        recommendedHumanVerification:
          'Request updated bureau refresh or bank debit justification from applicant.',
      });
    }

    return conflicts;
  }
}
