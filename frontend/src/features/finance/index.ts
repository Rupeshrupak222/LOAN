// Financial Core, Double-Entry GL & Accruals Domain
export interface TrialBalanceSummary {
  tenantId: string;
  asOfDate: string;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

export interface PortfolioNpaMetrics {
  totalActiveLoans: number;
  totalBookOutstanding: number;
  grossNpaPct: number;
  netNpaPct: number;
  provisionCoverageRatioPct: number;
  totalProvisionRequired: number;
}
