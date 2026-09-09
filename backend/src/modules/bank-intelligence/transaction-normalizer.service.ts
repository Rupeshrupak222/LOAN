import { v4 as uuid } from 'uuid';
import { NormalizedBankTransaction, TransactionType } from './bank-intelligence.types';
import { CategorizationService } from './categorization.service';

export class TransactionNormalizerService {
  /**
   * Normalizes raw transaction objects into the standard LMS NormalizedBankTransaction contract.
   */
  public static normalize(
    rawTransactions: any[],
    context: {
      customerId: string;
      accountId: string;
      sourceProvider: string;
      correlationId: string;
    }
  ): NormalizedBankTransaction[] {
    if (!Array.isArray(rawTransactions)) {
      return [];
    }

    const normalized: NormalizedBankTransaction[] = [];

    for (let i = 0; i < rawTransactions.length; i++) {
      const raw = rawTransactions[i];
      if (!raw) continue;

      // Extract & validate amount
      const amount = Math.abs(Number(raw.amount || raw.txnAmount || raw.transactionAmount || 0));
      if (isNaN(amount) || amount === 0) continue;

      // Extract & validate transaction type
      let type: TransactionType = 'DEBIT';
      const rawType = String(raw.transactionType || raw.type || raw.txnType || '').toUpperCase();
      if (rawType.includes('CR') || rawType === 'CREDIT' || rawType === 'DEPOSIT') {
        type = 'CREDIT';
      } else if (rawType.includes('DR') || rawType === 'DEBIT' || rawType === 'WITHDRAWAL') {
        type = 'DEBIT';
      } else if (raw.credit && Number(raw.credit) > 0) {
        type = 'CREDIT';
      } else if (raw.debit && Number(raw.debit) > 0) {
        type = 'DEBIT';
      }

      // Extract date
      let dateStr = raw.transactionDate || raw.date || raw.txnDate || new Date().toISOString().split('T')[0];
      if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().split('T')[0];
      } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0];
      } else if (typeof dateStr === 'string' && dateStr.includes('/')) {
        // DD/MM/YYYY or MM/DD/YYYY convert to YYYY-MM-DD
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }

      // Description & Narration
      const description = String(
        raw.description || raw.narration || raw.remarks || raw.particulars || 'Transaction'
      ).trim();

      // Balance
      const balanceAfter = Number(
        raw.balanceAfterTransaction !== undefined
          ? raw.balanceAfterTransaction
          : raw.balance !== undefined
          ? raw.balance
          : raw.closingBalance || 0
      );

      // Categorization
      const categorization = CategorizationService.categorize(
        description,
        type,
        amount,
        raw.counterpartyName || raw.merchant
      );

      normalized.push({
        transactionId: raw.transactionId || raw.id || `txn_${context.customerId.slice(0, 8)}_${i}_${Date.now()}`,
        accountId: context.accountId,
        customerId: context.customerId,
        transactionDate: dateStr,
        valueDate: raw.valueDate ? String(raw.valueDate).split('T')[0] : undefined,
        description,
        reference: raw.reference || raw.refNo || raw.chequeNo || raw.utr,
        transactionType: type,
        amount,
        balanceAfterTransaction: isNaN(balanceAfter) ? 0 : balanceAfter,
        currency: raw.currency || 'INR',
        counterpartyName: raw.counterpartyName || raw.merchant,
        counterpartyAccount: raw.counterpartyAccount,
        category: categorization.category,
        categoryConfidence: categorization.confidence,
        classificationSource: categorization.source,
        classificationReason: categorization.reason,
        sourceProvider: context.sourceProvider,
        correlationId: context.correlationId,
      });
    }

    // Sort chronologically ascending
    return normalized.sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
  }
}
