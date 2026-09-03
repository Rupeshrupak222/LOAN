export type TransactionType = 'CREDIT' | 'DEBIT';

export type TransactionCategory =
  | 'SALARY'
  | 'BUSINESS_INCOME'
  | 'INVESTMENT_INCOME'
  | 'OTHER_INCOME'
  | 'RENT'
  | 'UTILITIES'
  | 'GROCERIES'
  | 'EDUCATION'
  | 'HEALTHCARE'
  | 'INSURANCE'
  | 'TRAVEL'
  | 'LIFESTYLE'
  | 'GENERAL_EXPENSE'
  | 'LOAN_EMI'
  | 'CREDIT_CARD'
  | 'BNPL'
  | 'INSURANCE_PREMIUM'
  | 'CASH_WITHDRAWAL'
  | 'CASH_DEPOSIT'
  | 'BANK_TRANSFER'
  | 'UPI_OUT'
  | 'UPI_IN'
  | 'BANK_CHARGES'
  | 'REFUND'
  | 'REVERSAL'
  | 'UNCATEGORIZED';

export interface NormalizedBankTransaction {
  transactionId: string;
  accountId: string;
  customerId: string;
  transactionDate: string; // YYYY-MM-DD
  valueDate?: string;
  description: string;
  reference?: string;
  transactionType: TransactionType;
  amount: number;
  balanceAfterTransaction: number;
  currency: string;
  counterpartyName?: string;
  counterpartyAccount?: string;
  category: TransactionCategory;
  categoryConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  classificationSource: 'DETERMINISTIC_RULES' | 'PROVIDER' | 'HEURISTIC';
  classificationReason: string;
  sourceProvider: string;
  correlationId: string;
}

export interface MonthlyCashFlow {
  month: string; // YYYY-MM
  inflow: number;
  outflow: number;
  netFlow: number;
  avgBalance: number;
  minBalance: number;
  maxBalance: number;
  transactionCount: number;
}

export interface IncomeIntelligence {
  totalCredits: number;
  totalCreditsCount: number;
  detectedSalaryCreditsCount: number;
  salaryFrequency: 'MONTHLY' | 'BI_WEEKLY' | 'IRREGULAR' | 'NONE_DETECTED';
  averageMonthlyIncome: number;
  medianMonthlyIncome: number;
  estimatedRecurringSalary: number;
  incomeStabilityScore: number; // 0 to 100
  incomeVolatilityCoV: number; // coefficient of variation (std dev / mean)
  incomeTrajectory: 'GROWING' | 'STABLE' | 'DECLINING' | 'VOLATILE';
  isPrimaryEmployerIdentified: boolean;
  primaryEmployerName?: string;
  salaryDatesWindow: string; // e.g. "28th - 2nd of each month"
  observations: string[];
}

export interface CashFlowIntelligence {
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
  averageBankBalance: number; // ABB
  minimumBalanceRecorded: number;
  maximumBalanceRecorded: number;
  lowBalanceDaysCount: number; // balance < 1000 INR
  cashBurnVelocityRatio: number; // outflows / inflows
  liquidityRiskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  surplusMonthsCount: number;
  deficitMonthsCount: number;
  monthlyBreakdown: MonthlyCashFlow[];
  observations: string[];
}

export interface DetectedEmi {
  lenderOrMerchant: string;
  estimatedMonthlyAmount: number;
  frequency: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  transactionsCount: number;
  lastDebitDate: string;
  supportingTransactionIds: string[];
}

export interface ObligationIntelligence {
  detectedEmis: DetectedEmi[];
  estimatedTotalMonthlyObligations: number;
  declaredObligationsComparison: {
    declaredMonthlyObligation: number;
    estimatedBankObligations: number;
    variance: number;
    possibleUndisclosedDebt: boolean;
    explanation: string;
  };
  nachMandatesCount: number;
  observations: string[];
}

export interface BankAnomalySignal {
  signalId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  title: string;
  fact: string;
  anomaly: string;
  interpretation: string;
  possibleExplanations: string[];
  recommendedHumanAction: string[];
  supportingTransactionIds: string[];
}

export interface AdvisoryAiSummary {
  executiveSummary: string;
  incomeStabilityAssessment: string;
  cashFlowAssessment: string;
  debtBurdenAssessment: string;
  underwriterQuestions: string[];
}

export interface BankStatementAnalysisResult {
  analysisId: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  bankName: string;
  accountNumberMasked: string;
  statementPeriod: {
    fromDate: string;
    toDate: string;
    totalMonths: number;
  };
  source: 'ACCOUNT_AGGREGATOR' | 'VERIFIED_E_STATEMENT' | 'IMPORT';
  transactionsCount: number;
  incomeIntelligence: IncomeIntelligence;
  cashFlowIntelligence: CashFlowIntelligence;
  obligationIntelligence: ObligationIntelligence;
  anomalySignals: BankAnomalySignal[];
  advisoryAiSummary: AdvisoryAiSummary;
  analyzedAt: string;
  dataAsOf: string;
  model: string;
  isCached: boolean;
}

export interface IngestBankStatementInput {
  bankName: string;
  accountNumber: string;
  ifscCode?: string;
  source?: 'ACCOUNT_AGGREGATOR' | 'VERIFIED_E_STATEMENT' | 'IMPORT';
  transactions: Array<{
    transactionDate: string;
    description: string;
    amount: number;
    transactionType: 'CREDIT' | 'DEBIT';
    balanceAfterTransaction?: number;
    reference?: string;
    counterpartyName?: string;
  }>;
}
