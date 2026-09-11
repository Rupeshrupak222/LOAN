// Adyapan Lending OS — Phase 7: Digital Lending & Borrower Experience Types

export type BorrowerJourneyStage =
  | 'DISCOVERY'
  | 'APPLICATION'
  | 'KYC'
  | 'DOCUMENTS'
  | 'UNDERWRITING_REVIEW'
  | 'OFFER_READY'
  | 'OFFER_ACCEPTED'
  | 'AGREEMENT_READY'
  | 'MANDATE_SETUP'
  | 'DISBURSEMENT_PROCESSING'
  | 'ACTIVE_LOAN'
  | 'REJECTED'
  | 'CLOSED';

export interface BorrowerProfile {
  id: string;
  customerCode: string;
  userId?: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  mobile: string;
  email?: string | null;
  kycStatus: 'NOT_STARTED' | 'PENDING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  riskCategory?: 'LOW' | 'MEDIUM' | 'HIGH' | 'PENDING' | null;
  status: 'DRAFT' | 'ACTIVE' | 'KYC_PENDING' | 'KYC_VERIFIED' | 'BLOCKED' | 'INACTIVE';
  addresses: BorrowerAddress[];
  employmentDetails: BorrowerEmployment[];
  bankAccounts: BorrowerBankAccount[];
  applications: BorrowerApplicationSummary[];
  loans: BorrowerLoanSummary[];
  documents: BorrowerDocumentItem[];
  creditFacilities?: BorrowerCreditFacility[];
}

export interface BorrowerAddress {
  id: string;
  addressType: 'CURRENT' | 'PERMANENT' | 'OFFICE';
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isPrimary: boolean;
}

export interface BorrowerEmployment {
  id: string;
  employmentType: 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS';
  employerName: string;
  designation?: string | null;
  monthlyIncome: number;
  workExperienceYears?: number | null;
}

export interface BorrowerBankAccount {
  id: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: 'SAVINGS' | 'CURRENT';
  isPrimary: boolean;
  isVerified: boolean;
}

export interface BorrowerApplicationSummary {
  id: string;
  applicationNo: string;
  productId: string;
  productName: string;
  productCode: string;
  requestedAmount: number;
  tenureMonths: number;
  purpose?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  eligibility?: any;
  riskAssessment?: any;
  underwriting?: any;
  offer?: BorrowerLoanOffer;
}

export interface BorrowerLoanOffer {
  id: string;
  offerNo: string;
  applicationId: string;
  status: 'GENERATED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';
  approvedAmount: number;
  offeredAmount: number;
  interestRate: number;
  tenureMonths: number;
  monthlyEmi: number;
  processingFee: number;
  feeGst: number;
  totalDeductions: number;
  netDisbursedAmount: number;
  totalRepayableAmount: number;
  apr: number;
  conditions: string[];
  expiresAt: string;
  kfsAcknowledged: boolean;
  acceptedAt?: string | null;
}

export interface BorrowerContractAgreement {
  id: string;
  applicationId: string;
  agreementNo: string;
  documentUrl?: string;
  isGenerated: boolean;
  esignStatus: 'NOT_STARTED' | 'PENDING' | 'COMPLETED' | 'FAILED';
  esignSessionId?: string;
  signedAt?: string | null;
  mandateStatus: 'NOT_STARTED' | 'PENDING' | 'ACTIVE' | 'FAILED';
  mandateId?: string;
  mandateVerifiedAt?: string | null;
}

export interface BorrowerLoanSummary {
  id: string;
  loanNo: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  nextDueDate?: string | null;
  status: 'ACTIVE' | 'OVERDUE' | 'RESTRUCTURED' | 'SETTLED' | 'CLOSED' | 'WRITTEN_OFF';
  disbursementDate?: string | null;
  product: { name: string; code: string; productType: string };
  schedule: BorrowerRepaymentScheduleItem[];
  payments: BorrowerPaymentRecord[];
  closure?: { nocNumber: string; closedAt: string } | null;
}

export interface BorrowerRepaymentScheduleItem {
  id: string;
  emiNumber: number;
  dueDate: string;
  principal: number;
  interest: number;
  fees: number;
  totalDue: number;
  paidAmount: number;
  outstanding: number;
  status: 'UPCOMING' | 'DUE' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'WAIVED';
  paidDate?: string | null;
}

export interface BorrowerPaymentRecord {
  id: string;
  paymentNo: string;
  amount: number;
  method: string;
  reference?: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
  paidAt: string;
}

export interface BorrowerCreditFacility {
  id: string;
  facilityNo: string;
  facilityType: 'REVOLVING_LINE' | 'TERM_LOAN' | 'BNPL' | 'OVERDRAFT';
  approvedLimit: number;
  utilizedAmount: number;
  availableLimit: number;
  excessExposure: number;
  interestRatePct: number;
  status: 'ACTIVE' | 'FROZEN' | 'SUSPENDED' | 'EXPIRED' | 'CLOSED';
  drawdowns: BorrowerDrawdownItem[];
}

export interface BorrowerDrawdownItem {
  id: string;
  drawdownNo: string;
  requestedAmount: number;
  feeAmount: number;
  feeGst: number;
  netDisbursedAmount: number;
  tenureMonths: number;
  monthlyEmi: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  disbursedAt?: string | null;
  createdAt: string;
}

export interface BorrowerDocumentItem {
  id: string;
  category: string;
  documentType?: string | null;
  fileName: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  verified: boolean;
  rejectionReason?: string | null;
  createdAt: string;
}

export interface BorrowerLendingProduct {
  id: string;
  code: string;
  name: string;
  description?: string;
  productType: string;
  minAmount: number;
  maxAmount: number;
  defaultAmount?: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  interestRate: number;
  interestMethod: 'REDUCING' | 'FLAT';
  processingFeePct: number;
  isActive: boolean;
}

export interface CreateBorrowerApplicationDto {
  customerId: string;
  productId: string;
  requestedAmount: number;
  tenureMonths: number;
  purpose?: string;
  personalDetails?: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
    mobile: string;
    email?: string;
  };
  employmentDetails?: {
    employmentType: 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS';
    employerName: string;
    monthlyIncome: number;
    existingObligations?: number;
  };
  bankDetails?: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
}
