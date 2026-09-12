// Underwriting & Committee Decision Domain
export type UnderwritingDecisionType = 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'SEND_BACK' | 'REJECT';

export interface UnderwritingSubmissionDto {
  applicationId: string;
  decision: UnderwritingDecisionType;
  sanctionAmount?: number;
  approvedInterestRate?: number;
  approvedTenureMonths?: number;
  decisionRemarks: string;
  conditions?: string[];
}
