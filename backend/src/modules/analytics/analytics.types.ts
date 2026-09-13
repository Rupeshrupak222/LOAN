// Phase 14: Analytics, MIS & Enterprise Command Center - Type Definitions

export interface AnalyticsActorContext {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
  partnerId?: string;
}

export type TimeRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_financial_year'
  | 'custom'
  | 'all_time';

export interface AnalyticsFilterOptions {
  timeRange?: TimeRangePreset;
  startDate?: string;
  endDate?: string;
  tenantId?: string;
  branchId?: string;
  productId?: string;
  channel?: string;
  partnerId?: string;
  riskGrade?: string;
  dpdBucket?: string;
  loanStatus?: string;
  limit?: number;
  offset?: number;
}

export interface FunnelStageMetric {
  stage: string;
  label: string;
  count: number;
  conversionPct: number;
  dropOffPct: number;
  avgDurationHours: number;
  slaBreachPct: number;
  targetDrilldown: string;
}

export interface DecisionEngineBreAnalytics {
  totalDecisions: number;
  approveCount: number;
  approveWithConditionsCount: number;
  referCount: number;
  rejectCount: number;
  approvalRatePct: number;
  rejectionRatePct: number;
  referralRatePct: number;
  topRejectionReasons: Array<{ reason: string; count: number; percentage: number }>;
  topReferralReasons: Array<{ reason: string; count: number; percentage: number }>;
  approvalByRiskGrade: Array<{ grade: string; total: number; approved: number; ratePct: number }>;
  avgRequestedVsEligible: { avgRequested: number; avgEligible: number };
  conditionFrequency: Array<{ condition: string; count: number }>;
}

export interface RiskFraudAnalytics {
  riskDistribution: Array<{ grade: string; label: string; count: number; percentage: number; par30Pct: number }>;
  fraudDistribution: Array<{ category: string; count: number; percentage: number; actionRate: number }>;
  riskByProduct: Array<{ product: string; gradeA: number; gradeB: number; gradeC: number; gradeD: number; gradeE: number }>;
  fraudByChannel: Array<{ channel: string; totalEvaluated: number; highRiskCount: number; blockedCount: number }>;
  fraudInvestigationStats: {
    totalCases: number;
    openCases: number;
    investigatingCases: number;
    confirmedFraudCases: number;
    falsePositiveCases: number;
    resolutionRatePct: number;
  };
}

export interface DisbursementAnalytics {
  totalDisbursedAmount: number;
  disbursementCount: number;
  averageDisbursement: number;
  disbursementTrend: Array<{ date: string; amount: number; count: number }>;
  disbursementByProduct: Array<{ product: string; amount: number; count: number }>;
  disbursementByBranch: Array<{ branch: string; amount: number; count: number }>;
  disbursementByChannel: Array<{ channel: string; amount: number; count: number }>;
  payoutStatus: {
    completedCount: number;
    completedAmount: number;
    pendingCount: number;
    pendingAmount: number;
    failedCount: number;
    failedAmount: number;
    avgTatMinutes: number;
  };
}

export interface PortfolioAnalyticsData {
  totalActiveLoans: number;
  totalFacilities: number;
  totalPrincipalOutstanding: number;
  totalInterestOutstanding: number;
  totalOverdueAmount: number;
  totalExposure: number;
  avgTicketSize: number;
  portfolioByProduct: Array<{ product: string; activeLoans: number; outstanding: number; sharePct: number }>;
  portfolioByBranch: Array<{ branch: string; activeLoans: number; outstanding: number }>;
  portfolioByRiskGrade: Array<{ grade: string; outstanding: number; loanCount: number }>;
  portfolioTrend: Array<{ date: string; outstanding: number; activeLoans: number }>;
}

export interface DelinquencyAnalyticsData {
  delinquencyRatePct: number;
  par30Amount: number;
  par30RatePct: number;
  par60Amount: number;
  par60RatePct: number;
  par90Amount: number;
  par90RatePct: number;
  buckets: Array<{
    bucket: string;
    label: string;
    loanCount: number;
    outstandingAmount: number;
    overdueAmount: number;
    percentageOfPortfolio: number;
  }>;
  smaNpaClassification: {
    standard: { count: number; amount: number };
    sma0: { count: number; amount: number };
    sma1: { count: number; amount: number };
    sma2: { count: number; amount: number };
    npaSubStandard: { count: number; amount: number };
    npaDoubtful: { count: number; amount: number };
    npaLoss: { count: number; amount: number };
  };
  rollForwardMatrix: Array<{
    fromBucket: string;
    toBucket: string;
    migrationCount: number;
    migrationPct: number;
  }>;
  cureRatePct: number;
  recoveryRatePct: number;
}

export interface CollectionAnalyticsData {
  totalCases: number;
  assignedCases: number;
  unassignedCases: number;
  ptpCreatedCount: number;
  ptpKeptCount: number;
  ptpBrokenCount: number;
  ptpFulfillmentRatePct: number;
  totalAmountCollected: number;
  collectionEfficiencyPct: number;
  settlementAmount: number;
  writeOffAmount: number;
  collectorScorecard: Array<{
    collectorId: string;
    collectorName: string;
    assignedCases: number;
    contactedCount: number;
    ptpCount: number;
    keptPtpCount: number;
    recoveryAmount: number;
    efficiencyPct: number;
  }>;
}

export interface FinanceAnalyticsData {
  disbursementOutflow: number;
  repaymentInflow: number;
  principalCollected: number;
  interestIncome: number;
  feeIncome: number;
  penaltyIncome: number;
  partnerCommissions: number;
  refundsIssued: number;
  writeOffs: number;
  netCashFlow: number;
  receivablesSummary: {
    current: number;
    overdue30: number;
    overdue60: number;
    overdue90Plus: number;
    totalReceivables: number;
  };
  glBalancesSummary: Array<{
    accountCategory: string;
    accountName: string;
    code: string;
    balance: number;
    type: 'DEBIT' | 'CREDIT';
  }>;
}

export interface PartnerAnalyticsData {
  partners: Array<{
    partnerId: string;
    partnerName: string;
    partnerCode: string;
    channelType: string;
    applicationsSourced: number;
    kycCompleted: number;
    approvedCount: number;
    approvalRatePct: number;
    disbursedCount: number;
    disbursedAmount: number;
    avgTicket: number;
    activePortfolio: number;
    par30RatePct: number;
    commissionEarned: number;
    commissionPaid: number;
    settlementStatus: string;
  }>;
}

export interface ProductAnalyticsData {
  products: Array<{
    productId: string;
    productName: string;
    productCode: string;
    applications: number;
    approvalRatePct: number;
    disbursementVolume: number;
    disbursementAmount: number;
    avgLoanAmount: number;
    avgTenureMonths: number;
    revenue: number;
    activePortfolio: number;
    delinquencyRatePct: number;
    defaultRatePct: number;
  }>;
}

export interface BranchAnalyticsData {
  branches: Array<{
    branchId: string;
    branchName: string;
    branchCode: string;
    city: string;
    applications: number;
    approvals: number;
    approvalRatePct: number;
    disbursements: number;
    disbursedAmount: number;
    avgTicket: number;
    avgTatHours: number;
    activePortfolio: number;
    overdueAmount: number;
    collectionEfficiencyPct: number;
    activeStaffCount: number;
  }>;
}

export interface OperationsSlaAnalyticsData {
  overallSlaCompliancePct: number;
  totalSlaBreaches: number;
  currentBottleneckStage: string;
  nextRecommendedAction: string;
  stageCycleTimes: Array<{
    stage: string;
    stageName: string;
    avgTatHours: number;
    medianTatHours: number;
    slaTargetHours: number;
    slaCompliancePct: number;
    breachCount: number;
    activeQueueCount: number;
    responsibleRole: string;
  }>;
}

export interface SupportAnalyticsData {
  openTickets: number;
  closedTickets: number;
  totalTickets: number;
  avgResolutionTimeHours: number;
  slaCompliancePct: number;
  slaBreachesCount: number;
  ticketCategoryDistribution: Array<{ category: string; count: number; percentage: number }>;
  grievanceCount: number;
  openGrievances: number;
  avgGrievanceAgingDays: number;
  totalWaiversGranted: number;
}

export interface ExecutiveCommandCenterTelemetry {
  timestamp: string;
  dataFreshnessIndicator: string;
  enterpriseSnapshot: {
    totalAum: number;
    activeLoans: number;
    todayApplications: number;
    todayDisbursement: number;
    approvalRatePct: number;
    collectionEfficiencyPct: number;
    overdueAmount: number;
    portfolioRiskIndicator: 'OPTIMAL' | 'MODERATE' | 'ELEVATED' | 'HIGH';
  };
  originationsAndGrowth: {
    trend: Array<{ date: string; applications: number; disbursements: number }>;
    growthRatePct: number;
  };
  creditDecisioning: {
    approvalRatePct: number;
    rejectionRatePct: number;
    referralRatePct: number;
    topRejectionReason: string;
  };
  riskAndFraud: {
    riskGradeBreakdown: Array<{ grade: string; count: number }>;
    openFraudAlerts: number;
  };
  portfolioHealth: {
    totalPrincipalOutstanding: number;
    par30RatePct: number;
    par90RatePct: number;
  };
  collectionsPerformance: {
    ptpFulfillmentPct: number;
    recoveredAmountThisMonth: number;
    recoveryRatePct: number;
  };
  financialControls: {
    netCashFlow: number;
    unresolvedReconciliationExceptions: number;
    pendingAdjustmentApprovals: number;
  };
  operationsAndSla: {
    slaCompliancePct: number;
    currentBottleneck: string;
    staleApplicationsCount: number;
  };
  partnerContribution: {
    activePartners: number;
    partnerSourcedVolumePct: number;
  };
}

export interface DrilldownQueryRequest {
  dimension:
    | 'APPLICATIONS'
    | 'LOANS'
    | 'DISBURSEMENTS'
    | 'PAYMENTS'
    | 'COLLECTIONS'
    | 'SUPPORT_TICKETS'
    | 'RECONCILIATION_EXCEPTIONS'
    | 'FRAUD_CASES';
  filters: AnalyticsFilterOptions & {
    stage?: string;
    reason?: string;
    riskGrade?: string;
    fraudCategory?: string;
    dpdBucket?: string;
    collectorId?: string;
    partnerId?: string;
    branchId?: string;
    productId?: string;
  };
  page?: number;
  pageSize?: number;
}

export interface DrilldownResult {
  dimension: string;
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  records: any[];
}

export interface ReportDefinitionDto {
  name: string;
  description?: string;
  reportType: string;
  metricKeys: string[];
  dimensions?: string[];
  filters?: Record<string, any>;
  chartType?: 'KPI' | 'LINE' | 'BAR' | 'STACKED_BAR' | 'DONUT' | 'FUNNEL' | 'TABLE';
  visibility?: 'PRIVATE' | 'TEAM' | 'TENANT';
}

export interface ExportReportRequest {
  reportType: string;
  format: 'CSV' | 'EXCEL';
  filters?: AnalyticsFilterOptions;
  selectedColumns?: string[];
  maskPii?: boolean;
}
