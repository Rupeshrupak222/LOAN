import { ApplicationStatus, KycStatus, RiskCategory } from '@prisma/client';

export type CreditRecommendationType = 'RECOMMEND' | 'RECOMMEND_WITH_CONDITIONS' | 'SEND_BACK';

export interface CreditAssessmentDashboardMetrics {
  pendingAssessment: number;
  inProgress: number;
  inAssessment?: number;
  kycPending: number;
  completedAssessment: number;
  completedProposals?: number;
  totalVolume?: number;
  avgTicketSize?: number;
  sentBack: number;
  readyForUnderwriter: number;
  financials: {
    totalApplications: number;
    totalRequestedAmount: number;
    averageRequestedAmount: number;
    averageCreditScore: number | null;
  };
  riskDistribution: {
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
  };
  riskBreakdown?: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    VERY_HIGH: number;
  };
}

export interface CreditAssessmentQueueItem {
  id: string;
  applicationNo: string;
  customerId: string;
  borrowerName: string;
  customerCode: string;
  loanProduct: string;
  productCode: string;
  requestedAmount: number;
  tenureMonths: number;
  kycStatus: KycStatus;
  status: ApplicationStatus;
  creditAnalysisStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SENT_BACK';
  creditScore: number | null;
  creditScoreGrade: string | null;
  riskGrade: RiskCategory | 'PENDING';
  foir: number | null; // e.g. 36.61
  dti: number | null;
  applicationAgeDays: number;
  assignedAnalyst: string | null;
  underwriterStatus: 'NOT_SENT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT_BACK';
  createdAt: string;
  updatedAt: string;
}

export interface CreditHealthBureauData {
  isConfigured: boolean;
  bureauName: string;
  score: number | null;
  scoreRange: string;
  grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'WEAK' | 'HIGH_RISK' | 'NOT_AVAILABLE';
  interpretation: string;
  unconfiguredReason?: string;
  paymentHistoryTrack?: string;
  creditUtilizationPct?: number;
  activeAccounts?: number;
  overdueAccounts?: number;
  recentEnquiriesCount?: number;
}

export interface FoirDtiAnalysisResult {
  monthlyIncome: number;
  existingObligations: number;
  proposedEmi: number;
  totalMonthlyObligations: number;
  foirPct: number;
  maxAllowedFoirPct: number;
  status: 'PASS' | 'REVIEW' | 'FAIL';
  ltvPct?: number;
  maxAllowedLtvPct?: number;
  ltvStatus?: 'PASS' | 'REVIEW' | 'FAIL';
}

export interface EligibilityFactor {
  factor: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  detail: string;
}

export interface EligibilityChecklistResult {
  overallResult: 'ELIGIBLE' | 'CONDITIONALLY_ELIGIBLE' | 'NOT_ELIGIBLE';
  factors: EligibilityFactor[];
  maxEligibleAmount: number;
  estimatedEmi: number;
}

export interface RiskPillarAnalysis {
  score: number;
  category: RiskCategory;
  positiveFactors: string[];
  riskConcerns: string[];
  factors: {
    name: string;
    weight: number;
    score: number;
    remarks: string;
  }[];
}

export interface KycDocumentChecklist {
  isKycComplete: boolean;
  totalRequired: number;
  totalUploaded: number;
  totalVerified: number;
  missingRequiredDocs: string[];
  unverifiedDocs: string[];
  ageValidation?: {
    isValid: boolean;
    borrowerAge: number | null;
    minAge: number;
    maxAge: number;
    error: string | null;
  };
  documents: {
    id: string;
    category: string;
    documentType: string;
    fileName: string;
    storageKey?: string;
    status: 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW' | 'PENDING';
    verified: boolean;
    verifiedBy?: string | null;
    verifiedAt?: string | null;
    rejectionReason?: string | null;
  }[];
}

export interface CreditAssessmentDetail {
  application: {
    id: string;
    applicationNo: string;
    requestedAmount: number;
    tenureMonths: number;
    purpose?: string | null;
    status: ApplicationStatus;
    createdAt: string;
    updatedAt: string;
    tenantId?: string | null;
    branchId?: string | null;
  };
  product: {
    id: string;
    name: string;
    code: string;
    productType: string;
    interestRate: number;
    minAmount: number;
    maxAmount: number;
    minTenureMonths: number;
    maxTenureMonths: number;
  };
  customer: {
    id: string;
    customerCode: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    mobile: string;
    dateOfBirth?: string | null;
    gender?: string | null;
    addressLine?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    employmentType?: string | null;
    employerName?: string | null;
    monthlyIncome?: number | null;
    existingObligations?: number | null;
    bankName?: string | null;
    bankAccountNo?: string | null;
    bankIfsc?: string | null;
    kycStatus: KycStatus;
    riskCategory?: RiskCategory | null;
  };
  kycChecklist: KycDocumentChecklist;
  creditHealth: CreditHealthBureauData;
  foirAnalysis: FoirDtiAnalysisResult;
  eligibility: EligibilityChecklistResult;
  riskAnalysis: RiskPillarAnalysis;
  recommendation: {
    recommendation?: CreditRecommendationType | null;
    notes?: string | null;
    conditions?: string | null;
    proposedAmount?: number | null;
    proposedTenure?: number | null;
    proposedRate?: number | null;
    recommendedBy?: string | null;
    recommendedAt?: string | null;
  } | null;
  assessmentGate: {
    canCompleteAssessment: boolean;
    canForwardToUnderwriter: boolean;
    blockers: string[];
    isKycSatisfied: boolean;
    isDocumentsSatisfied: boolean;
    isEligibilitySatisfied: boolean;
    isRecommendationRecorded: boolean;
  };
  history: {
    id: string;
    fromStatus: ApplicationStatus | null;
    toStatus: ApplicationStatus;
    changedBy?: string | null;
    reason?: string | null;
    createdAt: string;
  }[];
}
