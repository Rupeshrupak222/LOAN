export type FinancialExceptionType =
  | 'ALLOCATION_MISMATCH'
  | 'OUTSTANDING_BALANCE_MISMATCH'
  | 'MISSING_TRANSACTION'
  | 'DUPLICATE_TRANSACTION'
  | 'DISBURSEMENT_STATUS_MISMATCH'
  | 'ORPHAN_TRANSACTION';

export type ExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ExceptionStatus = 'OPEN' | 'INVESTIGATING' | 'ADJUSTED' | 'DISMISSED';

export interface FinancialException {
  exceptionId: string;
  type: FinancialExceptionType;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  loanId?: string;
  loanNo?: string;
  paymentId?: string;
  reference?: string;
  discrepancyAmount: number;
  whatHappened: string;
  evidence: string;
  source: string;
  recommendedAction: string;
  detectedAt: string;
  assignedTo?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type AdjustmentType = 'REVERSAL' | 'REALLOCATION' | 'WAIVER' | 'LEDGER_CORRECTION';
export type AdjustmentStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface LedgerAdjustment {
  adjustmentId: string;
  type: AdjustmentType;
  loanId: string;
  loanNo: string;
  exceptionId?: string;
  amount: number;
  reason: string;
  proposedBy: string;
  proposedAt: string;
  status: AdjustmentStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  requiresApproval: boolean;
}

export interface ReconciliationDashboardStats {
  totalReconciledVolume: number;
  reconciliationHealthPercent: number;
  totalActiveExceptions: number;
  criticalExceptionsCount: number;
  pendingAdjustmentsCount: number;
  totalDiscrepancyAmount: number;
  byType: Record<FinancialExceptionType, number>;
  bySeverity: Record<ExceptionSeverity, number>;
  lastRunAt: string;
}
