import {
  NormalizedBankTransaction,
  ObligationIntelligence,
  DetectedEmi,
} from './bank-intelligence.types';
import { EMI_PATTERNS, LENDING_ENTITIES_MAP } from './bank-intelligence.constants';

export class ObligationIntelligenceService {
  /**
   * Identifies recurring EMI repayments, mandate debits, and undisclosed debt signals.
   */
  public static analyze(
    transactions: NormalizedBankTransaction[],
    declaredMonthlyObligation: number = 0
  ): ObligationIntelligence {
    const debits = transactions.filter((t) => t.transactionType === 'DEBIT');
    let nachMandatesCount = 0;

    // Map: entityKey -> Array of matching transactions
    const obligationClusters = new Map<string, NormalizedBankTransaction[]>();

    for (const d of debits) {
      const text = `${d.description} ${d.counterpartyName || ''}`.toUpperCase();

      if (text.includes('NACH') || text.includes('ACH DR') || text.includes('ECS')) {
        nachMandatesCount++;
      }

      let isEmiCandidate = d.category === 'LOAN_EMI';
      let resolvedLender: string | undefined;

      // Match against known lending entities
      for (const [key, lenderName] of Object.entries(LENDING_ENTITIES_MAP)) {
        if (text.includes(key)) {
          isEmiCandidate = true;
          resolvedLender = lenderName;
          break;
        }
      }

      if (!resolvedLender) {
        for (const p of EMI_PATTERNS) {
          if (p.test(text)) {
            isEmiCandidate = true;
            // Clean up description
            resolvedLender = d.description
              .replace(/^(ACH DR|NACH|ECS|DEBIT|CMS\/|AUTO DEBIT)[\s\/:_-]*/i, '')
              .split(/[\/\-_]/)[0]
              .trim();
            break;
          }
        }
      }

      if (isEmiCandidate) {
        const clusterKey = resolvedLender || 'Unspecified Financial Entity';
        if (!obligationClusters.has(clusterKey)) {
          obligationClusters.set(clusterKey, []);
        }
        obligationClusters.get(clusterKey)!.push(d);
      }
    }

    // Process clusters into DetectedEmi list
    const detectedEmis: DetectedEmi[] = [];
    let estimatedTotalMonthlyObligations = 0;

    for (const [lender, clusterTxns] of obligationClusters.entries()) {
      if (clusterTxns.length === 0) continue;

      const totalAmount = clusterTxns.reduce((sum, t) => sum + t.amount, 0);
      const avgAmount = Math.round(totalAmount / clusterTxns.length);
      const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
        clusterTxns.length >= 3 ? 'HIGH' : clusterTxns.length >= 2 ? 'MEDIUM' : 'LOW';

      // Estimate monthly impact
      estimatedTotalMonthlyObligations += avgAmount;

      detectedEmis.push({
        lenderOrMerchant: lender,
        estimatedMonthlyAmount: avgAmount,
        frequency: clusterTxns.length >= 2 ? 'MONTHLY' : 'PERIODIC',
        confidence,
        transactionsCount: clusterTxns.length,
        lastDebitDate: clusterTxns[clusterTxns.length - 1].transactionDate,
        supportingTransactionIds: clusterTxns.map((t) => t.transactionId),
      });
    }

    // Compare with declared obligations
    const variance = estimatedTotalMonthlyObligations - declaredMonthlyObligation;
    const possibleUndisclosedDebt = variance > 3000;
    const explanation = possibleUndisclosedDebt
      ? `Estimated bank statement obligations (INR ${estimatedTotalMonthlyObligations.toLocaleString(
          'en-IN'
        )}) exceed borrower-declared obligations (INR ${declaredMonthlyObligation.toLocaleString(
          'en-IN'
        )}) by INR ${variance.toLocaleString('en-IN')}. Potential undisclosed loan commitments detected.`
      : `Bank statement obligations (INR ${estimatedTotalMonthlyObligations.toLocaleString(
          'en-IN'
        )}) align with or are within acceptable variance of declared commitments (INR ${declaredMonthlyObligation.toLocaleString(
          'en-IN'
        )}).`;

    // Structured Observations
    const observations: string[] = [];
    observations.push(
      `[FACT] Detected ${detectedEmis.length} recurring obligation line(s) totaling ~INR ${estimatedTotalMonthlyObligations.toLocaleString(
        'en-IN'
      )}/month with ${nachMandatesCount} NACH/ECS mandate debits.`
    );

    for (const emi of detectedEmis) {
      observations.push(
        `[FACT] Mandate debit '${emi.lenderOrMerchant}': ~INR ${emi.estimatedMonthlyAmount.toLocaleString(
          'en-IN'
        )}/month (${emi.transactionsCount} instance(s), confidence: ${emi.confidence}).`
      );
    }

    if (possibleUndisclosedDebt) {
      observations.push(`[INFERENCE] ⚠️ Potential undisclosed debt signal: ${explanation}`);
    }

    return {
      detectedEmis,
      estimatedTotalMonthlyObligations,
      declaredObligationsComparison: {
        declaredMonthlyObligation,
        estimatedBankObligations: estimatedTotalMonthlyObligations,
        variance,
        possibleUndisclosedDebt,
        explanation,
      },
      nachMandatesCount,
      observations,
    };
  }
}
