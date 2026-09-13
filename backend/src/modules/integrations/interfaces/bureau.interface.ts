// Credit Bureau Provider Interface & Normalized Contracts

export type BureauReportStatus = 'COMPLETED' | 'NO_RECORD' | 'FAILED' | 'TIMEOUT';

export interface BureauInquiryRequest {
  pan: string;
  fullName: string;
  mobile: string;
  dateOfBirth?: string;
  address?: string;
  pincode?: string;
  loanAmountRequested?: number;
}

export interface BureauTradelineSummary {
  accountType: string;
  institutionName: string;
  sanctionedAmount: number;
  currentBalance: number;
  overdueAmount: number;
  dpdMax: number;
  status: 'CURRENT' | 'DELINQUENT' | 'SETTLED' | 'WRITTEN_OFF' | 'CLOSED';
  openedDate: string;
  lastPaymentDate?: string;
}

export interface BureauReportResult {
  status: BureauReportStatus;
  bureauName: 'CIBIL' | 'EXPERIAN' | 'EQUIFAX' | 'CRIF' | 'SANDBOX_BUREAU';
  score: number; // 300 - 900, or -1 for NTC
  scoreTier: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'NO_HISTORY';
  totalAccounts: number;
  activeAccounts: number;
  totalOutstanding: number;
  totalOverdueAmount: number;
  dpd30PlusCount: number;
  dpd90PlusCount: number;
  writtenOffCount: number;
  settledCount: number;
  recentInquiriesLast30Days: number;
  tradelines: BureauTradelineSummary[];
  reportReference: string;
  generatedAt: string;
}

export interface BureauProvider {
  readonly providerId: string;
  readonly name: string;
  readonly environment: 'SANDBOX' | 'PRODUCTION';

  fetchCreditReport(req: BureauInquiryRequest, correlationId: string): Promise<BureauReportResult>;
}
