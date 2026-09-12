// Phase 14: Analytics, MIS & Enterprise Command Center Types

export type DateRangePreset =
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_QUARTER'
  | 'LAST_QUARTER'
  | 'THIS_FINANCIAL_YEAR'
  | 'CUSTOM';

export interface AnalyticsActorContext {
  id: string;
  userId?: string;
  roles: string[];
  tenantId?: string;
  branchId?: string;
  partnerId?: string;
}

export interface AnalyticsQueryFilters {
  preset?: DateRangePreset;
  startDate?: string;
  endDate?: string;
  tenantId?: string;
  branchId?: string;
  productId?: string;
  partnerId?: string;
  channel?: string;
  riskGrade?: string;
  fraudTier?: string;
  dpdBucket?: string;
  collectorId?: string;
  officerId?: string;
}

export interface DataFreshnessInfo {
  calculatedAt: string;
  freshnessSec: number;
  dataFreshnessText: string;
  isRealtime: boolean;
  snapshotId?: string;
}

// 1. Origination & Funnel
export interface FunnelStageMetric {
  stage: string;
  count: number;
  conversionRatePct: number;
  dropOffRatePct: number;
  avgDurationHours: number;
  slaBreachPct: number;
}

export interface OriginationFunnelAnalytics {
  freshness: DataFreshnessInfo;
  totalApplications: number;
  todayApplications: number;
  thisMonthApplications: number;
  momGrowthPct: number;
  approvalRatePct: number;
  rejectionRatePct: number;
  referralRatePct: number;
  avgRequestedAmount: number;
  avgApprovedAmount: number;
  avgSanctionedAmount: number;
  avgTimeToDecisionHours: number;
  avgTimeToApprovalHours: number;
  avgTimeToDisbursementHours: number;
  funnelStages: FunnelStageMetric[];
  channelDistribution: Array<{ channel: string; count: number; volume: number; conversionPct: number }>;
}

// 2. Credit & BRE Analytics
export interface DecisionDistribution {
  outcome: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'REFER' | 'REJECT';
  count: number;
  percentage: number;
  totalAmount: number;
}

export interface CreditBREAnalytics {
  freshness: DataFreshnessInfo;
  totalDecisions: number;
  decisionBreakdown: DecisionDistribution[];
  topRejectionReasons: Array<{ reason: string; count: number; percentage: number }>;
  topReferralReasons: Array<{ reason: string; count: number; percentage: number }>;
  approvalByRiskGrade: Array<{ grade: string; approved: number; rejected: number; total: number; approvalRatePct: number }>;
  requestedVsEligibleRatio: number;
  conditionFrequency: Array<{ condition: string; count: number }>;
  decisionByProduct: Array<{ productCode: string; productName: string; approved: number; rejected: number; referred: number }>;
}

// 3. Risk & Fraud Analytics
export interface RiskFraudAnalytics {
  freshness: DataFreshnessInfo;
  riskGradeDistribution: Array<{ grade: string; count: number; volume: number; delinquencyRatePct: number }>;
  fraudTierDistribution: Array<{ tier: string; count: number; percentage: number }>;
  riskVsFraudMatrix: Array<{
    riskGrade: string;
    clear: number;
    lowRisk: number;
    review: number;
    highRisk: number;
    block: number;
  }>;
  riskTrendMonthly: Array<{ month: string; avgRiskScore: number; highRiskRatio: number }>;
  fraudInvestigationVolume: {
    totalFlagged: number;
    underReview: number;
    confirmedFraud: number;
    falsePositiveCleared: number;
    avgResolutionTimeHours: number;
  };
}

// 4. Disbursement Analytics
export interface DisbursementAnalytics {
  freshness: DataFreshnessInfo;
  totalDisbursedVolume: number;
  totalDisbursementsCount: number;
  avgDisbursementTicket: number;
  failedPayoutsCount: number;
  failedPayoutsVolume: number;
  pendingPayoutsCount: number;
  pendingPayoutsVolume: number;
  avgPayoutTurnaroundMinutes: number;
  disbursementTrendMonthly: Array<{ month: string; volume: number; count: number }>;
  disbursementByProduct: Array<{ productId: string; productName: string; volume: number; count: number }>;
  disbursementByBranch: Array<{ branchId: string; branchName: string; volume: number; count: number }>;
  disbursementByChannel: Array<{ channel: string; volume: number; count: number }>;
}

// 5. Portfolio Analytics
export interface PortfolioAnalytics {
  freshness: DataFreshnessInfo;
  activeLoansCount: number;
  activeFacilitiesCount: number;
  totalPrincipalOutstanding: number;
  totalInterestOutstanding: number;
  totalOverdueAmount: number;
  totalExposure: number;
  portfolioWeightedAvgRate: number;
  portfolioWeightedAvgTenureMonths: number;
  avgTicketSize: number;
  portfolioByProduct: Array<{ productCode: string; name: string; outstanding: number; count: number; sharePct: number }>;
  portfolioByBranch: Array<{ branchCode: string; name: string; outstanding: number; count: number; sharePct: number }>;
  portfolioByRiskGrade: Array<{ grade: string; outstanding: number; sharePct: number }>;
  portfolioTrend: Array<{ date: string; outstandingPrincipal: number; overdueAmount: number }>;
}

// 6. Delinquency & DPD Analytics
export interface DpdBucketSummary {
  bucket: 'CURRENT' | '1_30' | '31_60' | '61_90' | '91_180' | '180_PLUS' | 'SMA_1' | 'SMA_2' | 'NPA';
  label: string;
  accountsCount: number;
  overdueAmount: number;
  outstandingPrincipal: number;
  parPercentage: number;
}

export interface DelinquencyAnalytics {
  freshness: DataFreshnessInfo;
  par30Pct: number;
  par90Pct: number;
  npaRatePct: number;
  totalOverdueAmount: number;
  dpdBuckets: DpdBucketSummary[];
  bucketRollRates: {
    rollForwardToNpaPct: number;
    rollBackCurePct: number;
    stablePct: number;
  };
  vintageCohorts: Array<{
    disbursementCohort: string;
    disbursedVolume: number;
    mob3Par30Pct: number;
    mob6Par30Pct: number;
    mob12Par90Pct: number;
  }>;
}

// 7. Collection Analytics
export interface CollectorScorecardItem {
  collectorId: string;
  collectorName: string;
  assignedCases: number;
  contactedCases: number;
  contactRatePct: number;
  ptpCreated: number;
  ptpKept: number;
  ptpBroken: number;
  ptpFulfillmentPct: number;
  amountCollected: number;
  recoveryEfficiencyPct: number;
}

export interface CollectionAnalytics {
  freshness: DataFreshnessInfo;
  totalCollectionCases: number;
  assignedCasesCount: number;
  unassignedCasesCount: number;
  totalPtpCreated: number;
  totalPtpKept: number;
  totalPtpBroken: number;
  ptpFulfillmentRatePct: number;
  totalAmountCollected: number;
  overallCollectionEfficiencyPct: number;
  settlementsVolume: number;
  settlementsCount: number;
  writeOffsVolume: number;
  writeOffsCount: number;
  collectorScorecards: CollectorScorecardItem[];
}

// 8. Financial & Accounting Analytics
export interface FinancialAnalytics {
  freshness: DataFreshnessInfo;
  disbursementOutflow: number;
  repaymentInflow: number;
  netCashFlow: number;
  interestIncome: number;
  processingFeeIncome: number;
  penaltyIncome: number;
  documentationFeeIncome: number;
  totalOperatingRevenue: number;
  partnerCommissionsPaid: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  suspenseBalance: number;
  unreconciledExceptionsCount: number;
  trialBalanceBalanced: boolean;
  revenueByMonth: Array<{ month: string; interest: number; fees: number; penalties: number; total: number }>;
}

// 9. Partner / LSP Analytics
export interface PartnerPerformanceItem {
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  applicationsSourced: number;
  approvedCount: number;
  approvalRatePct: number;
  disbursedLoansCount: number;
  disbursedVolume: number;
  disbursementRatePct: number;
  outstandingPortfolio: number;
  delinquencyPar30Pct: number;
  commissionEarned: number;
  commissionPaid: number;
  settlementStatus: 'UP_TO_DATE' | 'PENDING_SETTLEMENT' | 'ON_HOLD';
}

export interface PartnerAnalytics {
  freshness: DataFreshnessInfo;
  totalActivePartners: number;
  totalPartnerSourcedVolume: number;
  partnerSourcedSharePct: number;
  totalCommissionsEarned: number;
  partnerLeaderboard: PartnerPerformanceItem[];
}

// 10. Product Analytics
export interface ProductPerformanceItem {
  productId: string;
  productCode: string;
  productName: string;
  activeVersion: string;
  applicationsCount: number;
  approvalRatePct: number;
  avgRequestedAmount: number;
  avgTenureMonths: number;
  disbursementVolume: number;
  outstandingPortfolio: number;
  interestRevenue: number;
  delinquencyRatePct: number;
  writeOffVolume: number;
}

export interface ProductAnalytics {
  freshness: DataFreshnessInfo;
  products: ProductPerformanceItem[];
}

// 11. Branch Analytics
export interface BranchPerformanceItem {
  branchId: string;
  branchCode: string;
  branchName: string;
  city: string;
  applicationsCount: number;
  approvalCount: number;
  approvalRatePct: number;
  disbursedVolume: number;
  avgTurnaroundHours: number;
  activeOutstandingPortfolio: number;
  overdueAmount: number;
  collectionEfficiencyPct: number;
  staffProductivityAppsPerOfficer: number;
}

export interface BranchAnalytics {
  freshness: DataFreshnessInfo;
  branches: BranchPerformanceItem[];
}

// 12. Operational SLA Analytics
export interface WorkflowStageSla {
  stageName: string;
  assignedTeam: string;
  targetSlaHours: number;
  avgActualTatHours: number;
  medianTatHours: number;
  slaComplianceRatePct: number;
  totalCasesProcessed: number;
  breachedCasesCount: number;
  currentPendingAgingHours: number;
  isBottleneck: boolean;
}

export interface OperationalSlaAnalytics {
  freshness: DataFreshnessInfo;
  overallSlaCompliancePct: number;
  totalBreachedTasks: number;
  currentBottleneckStage: string;
  recommendedAction: string;
  stageSlas: WorkflowStageSla[];
}

// 13. Customer Support Analytics
export interface SupportAnalytics {
  freshness: DataFreshnessInfo;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  slaBreachesCount: number;
  avgResolutionTimeHours: number;
  categoryDistribution: Array<{ category: string; count: number; percentage: number }>;
  grievancesSummary: {
    totalGrievances: number;
    pendingGrievances: number;
    escalatedToNodal: number;
    concessionAmountAwarded: number;
    avgGrievanceAgingDays: number;
  };
}

// 14. Executive Command Center Overview
export interface EnterpriseCommandCenterOverview {
  freshness: DataFreshnessInfo;
  enterpriseSnapshot: {
    totalAum: number;
    todayApplications: number;
    approvalRatePct: number;
    todayDisbursementVolume: number;
    collectionEfficiencyPct: number;
    totalOverdueAmount: number;
    activeLoansCount: number;
    portfolioRiskStatus: 'HEALTHY' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  };
  growthVelocity: {
    weeklyApplicationsTrend: Array<{ day: string; count: number }>;
    weeklyDisbursementsTrend: Array<{ day: string; volume: number }>;
  };
  creditSummary: {
    totalSanctionedMonth: number;
    avgDecisionTatHours: number;
    autoApprovedPct: number;
  };
  riskSummary: {
    highRiskPortfolioSharePct: number;
    unresolvedFraudSignalsCount: number;
  };
  collectionsSummary: {
    monthCollectedVolume: number;
    activePtpCommitmentsCount: number;
  };
  financeSummary: {
    monthRevenue: number;
    suspenseDiscrepancyVolume: number;
  };
  operationsAlerts: Array<{
    id: string;
    title: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
    drilldownPath: string;
  }>;
}

// 15. Dynamic Report Builder & Saved Reports
export type ReportDimension =
  | 'TENANT'
  | 'BRANCH'
  | 'PRODUCT'
  | 'CHANNEL'
  | 'PARTNER'
  | 'RISK_GRADE'
  | 'LOAN_STATUS'
  | 'DPD_BUCKET'
  | 'MONTH'
  | 'STAFF';

export type ReportMetric =
  | 'APPLICATION_COUNT'
  | 'APPROVAL_RATE'
  | 'REQUESTED_AMOUNT'
  | 'APPROVED_AMOUNT'
  | 'DISBURSED_AMOUNT'
  | 'OUTSTANDING_PRINCIPAL'
  | 'OVERDUE_AMOUNT'
  | 'COLLECTED_AMOUNT'
  | 'COLLECTION_EFFICIENCY'
  | 'INTEREST_INCOME'
  | 'FEE_INCOME'
  | 'COMMISSION_AMOUNT'
  | 'PTP_FULFILLMENT_RATE';

export interface ReportBuilderQuery {
  title?: string;
  dimensions: ReportDimension[];
  metrics: ReportMetric[];
  filters?: AnalyticsQueryFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ReportBuilderResult {
  title: string;
  freshness: DataFreshnessInfo;
  dimensions: ReportDimension[];
  metrics: ReportMetric[];
  totalRecords: number;
  page: number;
  limit: number;
  rows: Array<Record<string, any>>;
  summaryTotals: Record<string, number>;
}

export interface SavedReportRecord {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  tenantId: string;
  visibility: 'PRIVATE' | 'TEAM' | 'TENANT';
  queryConfig: ReportBuilderQuery;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportingSnapshotRecord {
  id: string;
  snapshotDate: string; // YYYY-MM-DD
  snapshotType: 'DAILY' | 'MONTHLY' | 'QUARTERLY';
  tenantId: string;
  totalAum: number;
  activeLoansCount: number;
  totalDisbursedMonth: number;
  totalCollectedMonth: number;
  totalOverdue: number;
  par30Amount: number;
  par90Amount: number;
  totalRevenueMonth: number;
  isImmutable: boolean;
  generatedAt: string;
  metadata?: Record<string, any>;
}
