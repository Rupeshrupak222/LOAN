import {
  TransactionCategory,
  TransactionType,
} from './bank-intelligence.types';
import {
  SALARY_PATTERNS,
  EMI_PATTERNS,
  CREDIT_CARD_PATTERNS,
  RENT_PATTERNS,
  UTILITY_PATTERNS,
  CASH_PATTERNS,
  INVESTMENT_PATTERNS,
} from './bank-intelligence.constants';

export interface CategorizationResult {
  category: TransactionCategory;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  source: 'DETERMINISTIC_RULES' | 'PROVIDER' | 'HEURISTIC';
  reason: string;
}

export class CategorizationService {
  /**
   * Deterministically classifies a bank transaction based on narration, type, and amount.
   */
  public static categorize(
    description: string,
    type: TransactionType,
    amount: number,
    counterpartyName?: string
  ): CategorizationResult {
    const text = `${description} ${counterpartyName || ''}`.toUpperCase().trim();

    // 1. Reversals and Refunds
    if (text.includes('REVERSAL') || text.includes('REV:') || text.includes('FAILED TXN REV')) {
      return {
        category: 'REVERSAL',
        confidence: 'HIGH',
        source: 'DETERMINISTIC_RULES',
        reason: 'Matched transaction reversal keywords',
      };
    }

    if (text.includes('REFUND') || text.includes('CASHBACK')) {
      return {
        category: 'REFUND',
        confidence: 'HIGH',
        source: 'DETERMINISTIC_RULES',
        reason: 'Matched refund or cashback keywords',
      };
    }

    // 2. Credits (Inflows)
    if (type === 'CREDIT') {
      // Check Salary patterns
      for (const pattern of SALARY_PATTERNS) {
        if (pattern.test(text)) {
          return {
            category: 'SALARY',
            confidence: 'HIGH',
            source: 'DETERMINISTIC_RULES',
            reason: `Matched salary/payroll narration pattern: ${pattern.source}`,
          };
        }
      }

      // Cash Deposit
      if (text.includes('CASH DEP') || text.includes('CDM DEP') || text.includes('BY CASH')) {
        return {
          category: 'CASH_DEPOSIT',
          confidence: 'HIGH',
          source: 'DETERMINISTIC_RULES',
          reason: 'Identified physical cash / CDM branch deposit',
        };
      }

      // Investment / Interest
      for (const pattern of INVESTMENT_PATTERNS) {
        if (pattern.test(text)) {
          return {
            category: 'INVESTMENT_INCOME',
            confidence: 'HIGH',
            source: 'DETERMINISTIC_RULES',
            reason: 'Identified interest, dividend, or investment liquidation credit',
          };
        }
      }

      // UPI Inflow
      if (text.includes('UPI/') || text.includes('/UPI/') || text.includes('@')) {
        return {
          category: 'UPI_IN',
          confidence: 'HIGH',
          source: 'DETERMINISTIC_RULES',
          reason: 'Identified inbound UPI fund transfer',
        };
      }

      // Default Credit
      return {
        category: 'OTHER_INCOME',
        confidence: 'MEDIUM',
        source: 'HEURISTIC',
        reason: 'General inbound credit transfer without explicit payroll markers',
      };
    }

    // 3. Debits (Outflows)
    if (type === 'DEBIT') {
      // Loan / EMI Debits (Highest Priority)
      for (const pattern of EMI_PATTERNS) {
        if (pattern.test(text)) {
          return {
            category: 'LOAN_EMI',
            confidence: 'HIGH',
            source: 'DETERMINISTIC_RULES',
            reason: 'Matched recognized lender entity, NACH mandate, or loan repayment keyword',
          };
        }
      }

      // Credit Card Payment
      for (const pattern of CREDIT_CARD_PATTERNS) {
        if (pattern.test(text)) {
          return {
            category: 'CREDIT_CARD',
            confidence: 'HIGH',
            source: 'DETERMINISTIC_RULES',
            reason: 'Identified credit card bill settlement',
          };
        }
      }

      // Rent
      for (const pattern of RENT_PATTERNS) {
        if (pattern.test(text)) {
          return {
            category: 'RENT',
            confidence: 'HIGH',
            source: 'DETERMINISTIC_RULES',
            reason: 'Identified residential or commercial rent debit',
          };
        }
      }

      // Utilities
      for (const pattern of UTILITY_PATTERNS) {
        if (pattern.test(text)) {
          return {
            category: 'UTILITIES',
            confidence: 'HIGH',
            source: 'DETERMINISTIC_RULES',
            reason: 'Identified utility, telecom, electricity, or gas bill payment',
          };
        }
      }

      // Cash Withdrawal (ATM)
      for (const pattern of CASH_PATTERNS) {
        if (pattern.test(text)) {
          return {
            category: 'CASH_WITHDRAWAL',
            confidence: 'HIGH',
            source: 'DETERMINISTIC_RULES',
            reason: 'Identified ATM or teller cash withdrawal',
          };
        }
      }

      // Bank Charges / Penalties
      if (
        text.includes('CHG') ||
        text.includes('FEE') ||
        text.includes('PENALTY') ||
        text.includes('AMB CHG') ||
        text.includes('SMS CHG')
      ) {
        return {
          category: 'BANK_CHARGES',
          confidence: 'HIGH',
          source: 'DETERMINISTIC_RULES',
          reason: 'Identified bank service fee, minimum balance charge, or SMS alert fee',
        };
      }

      // UPI Outflow
      if (text.includes('UPI/') || text.includes('/UPI/') || text.includes('@')) {
        return {
          category: 'UPI_OUT',
          confidence: 'HIGH',
          source: 'DETERMINISTIC_RULES',
          reason: 'Identified outbound UPI merchant or P2P transfer',
        };
      }

      // General Outflow
      return {
        category: 'GENERAL_EXPENSE',
        confidence: 'LOW',
        source: 'HEURISTIC',
        reason: 'General debit outflow without specific classification pattern',
      };
    }

    return {
      category: 'UNCATEGORIZED',
      confidence: 'LOW',
      source: 'HEURISTIC',
      reason: 'Transaction type or narration ambiguous',
    };
  }
}
