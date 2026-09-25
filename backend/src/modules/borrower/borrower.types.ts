/**
 * Phase 15: Consumer Digital Lending App & Borrower Journey - Type Definitions
 */

export interface BorrowerHomeSummary {
  borrower: {
    id: string;
    customerCode: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    kycStatus: string;
    panNumberMasked: string | null;
    aadhaarMasked?: string | null;
    bankLinked: boolean;
    bankName: string | null;
    bankAccountNoMasked: string | null;
    bankIfsc: string | null;
    isBankVerified: boolean;
    mandateStatus: 'ACTIVE' | 'PENDING' | 'NOT_CONFIGURED';
    address?: string | null;
    profileDetails?: {
      dob?: string | null;
      gender?: string | null;
      addressLine1?: string | null;
      addressLine2?: string | null;
      city?: string | null;
      state?: string | null;
      pincode?: string | null;
      employmentType?: string | null;
      employerName?: string | null;
      designation?: string | null;
      monthlyIncome?: number | null;
      existingEmiObligations?: number | null;
      workExperienceYears?: number | null;
      panNumber?: string | null;
      bankName?: string | null;
      accountNumber?: string | null;
      ifscCode?: string | null;
      accountHolderName?: string | null;
    };
  };
  creditLimit: {
    preApprovedLimit: number;
    availableLimit: number;
    utilizedLimit: number;
    currency: string;
    isEligible: boolean;
  };
  activeLoan?: {
    id: string;
    loanAccountNumber: string;
    productName: string;
    sanctionedPrincipal: number;
    outstandingPrincipal: number;
    outstandingInterest: number;
    totalOutstanding: number;
    nextEmiAmount: number;
    nextEmiDueDate: string | null;
    totalEmis: number;
    paidEmis: number;
    dpd: number;
    status: string;
    coolingOffEndsAt?: string;
  };
  activeApplication?: {
    id: string;
    applicationNumber: string;
    productName: string;
    requestedAmount: number;
    status: string;
    currentStage: string;
    progressPercent: number;
    nextRequiredAction: string;
    actionUrl: string;
    createdAt: string;
  };
  recentTransactions: Array<{
    id: string;
    amount: number;
    type: string;
    status: string;
    paymentDate: string;
    paymentMethod: string;
    reference: string;
  }>;
  notificationsCount: number;
  unreadSupportTickets: number;
}

export interface BorrowerEligibilityInput {
  productId?: string;
  requestedAmount: number;
  requestedTenureMonths: number;
  monthlyIncome: number;
  existingMonthlyEmi?: number;
  employmentType: 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS' | 'PROFESSIONAL';
}

export interface BorrowerEligibilityResult {
  isEligible: boolean;
  maxEligibleAmount: number;
  minEligibleAmount: number;
  recommendedTenureMonths: number;
  indicativeInterestRateApr: number;
  indicativeEmiAmount: number;
  productName: string;
  productCode: string;
  safeMessage: string;
  keyHighlights: string[];
}

export interface BorrowerApplicationInput {
  productId: string;
  // Step 1: Requirement
  requestedAmount: number;
  tenureMonths: number;
  purpose: string;
  // Step 2: Personal
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  // Step 3: Employment & Role Details
  employmentType: 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS' | 'PROFESSIONAL' | 'STUDENT' | 'FREELANCER' | 'FARMER' | 'OTHER';
  employerName?: string;
  designation?: string;
  workExperienceYears?: number;
  businessName?: string;
  businessRegistrationType?: string;
  gstin?: string;
  annualTurnover?: number;
  professionType?: string;
  institutionName?: string;
  courseName?: string;
  coApplicantName?: string;
  coApplicantRelation?: string;
  coApplicantIncome?: number;
  landAreaAcres?: number;
  cropType?: string;
  kccLimit?: number;
  farmLocation?: string;
  clientRemittanceType?: string;
  monthlyIncome: number;
  existingEmiObligations?: number;
  // Step 4: KYC & Identity
  panNumber: string;
  aadhaarNumberMasked: string;
  kycConsentGiven: boolean;
  documentIds?: string[];
  // Step 5: Bank details
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountType: 'SAVINGS' | 'CURRENT';
  // Step 6: Consents & Declarations
  creditBureauConsent: boolean;
  termsAccepted: boolean;
}

export interface BorrowerDraftApplicationInput {
  applicationId?: string;
  productId?: string;
  requestedAmount?: number;
  tenureMonths?: number;
  purpose?: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  employmentType?: 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS' | 'PROFESSIONAL' | 'STUDENT' | 'FREELANCER' | 'FARMER' | 'OTHER';
  employerName?: string;
  designation?: string;
  workExperienceYears?: number;
  businessName?: string;
  businessRegistrationType?: string;
  gstin?: string;
  annualTurnover?: number;
  professionType?: string;
  institutionName?: string;
  courseName?: string;
  coApplicantName?: string;
  coApplicantRelation?: string;
  coApplicantIncome?: number;
  monthlyIncome?: number;
  existingEmiObligations?: number;
  panNumber?: string;
  aadhaarNumberMasked?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  accountType?: 'SAVINGS' | 'CURRENT';
  documentIds?: string[];
}

export interface BorrowerApplicationDetail {
  id: string;
  applicationNumber: string;
  status: string;
  stage: string | null;
  requestedAmount: number;
  tenureMonths: number;
  purpose: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    code: string;
    name: string;
    minAmount: number;
    maxAmount: number;
    minTenureMonths: number;
    maxTenureMonths: number;
    interestRateAnnual: number;
    processingFeePercent: number;
  };
  borrower: {
    id: string;
    customerCode: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email: string | null;
    kycStatus: string;
    panNumberMasked: string | null;
    aadhaarMasked: string | null;
  };
  address?: {
    addressLine: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
  } | null;
  employment?: {
    employmentType: string | null;
    employerName: string | null;
    designation: string | null;
    monthlyIncome: number | null;
    institutionName?: string | null;
    courseName?: string | null;
    businessName?: string | null;
  } | null;
  bank?: {
    bankName: string | null;
    accountNumberMasked: string | null;
    ifscCode: string | null;
    accountHolderName: string | null;
    accountType: string | null;
    isVerified: boolean;
  } | null;
}

export interface BorrowerKfsData {
  kfsId: string;
  offerId: string;
  loanAmount: number;
  annualPercentageRateApr: number;
  nominalInterestRate: number;
  interestType: string;
  tenureMonths: number;
  emiAmount: number;
  processingFee: number;
  gstAmount: number;
  documentationCharges: number;
  totalUpfrontDeductions: number;
  netDisbursementAmount: number;
  totalRepaymentAmount: number;
  totalInterestPayable: number;
  coolingOffDays: number;
  coolingOffEndDate: string;
  foreclosureCharges: string;
  penalInterestRate: string;
  grievanceRedressalOfficer: {
    name: string;
    designation: string;
    email: string;
    phone: string;
    address: string;
  };
  repaymentScheduleSummary: Array<{
    installmentNumber: number;
    dueDate: string;
    principal: number;
    interest: number;
    emi: number;
    outstandingBalance: number;
  }>;
}

export interface BorrowerRepaymentInput {
  loanId: string;
  amount: number;
  paymentMethod: 'UPI' | 'NET_BANKING' | 'DEBIT_CARD';
  upiVpa?: string;
  emiNumber?: number;
  installmentNumber?: number;
  paymentReference?: string;
}

export interface BorrowerNocCertificate {
  certificateNumber: string;
  issueDate: string;
  borrowerName: string;
  customerCode: string;
  panMasked: string;
  loanAccountNumber: string;
  sanctionedAmount: number;
  closureDate: string;
  closureType: string;
  status: 'CLOSED_FULLY_SETTLED';
  digitalSignatureHash: string;
  issuerLenderName: string;
  complianceStatement: string;
}

export type BorrowerJourneyStage =
  | 'PROFILE_INCOMPLETE'
  | 'KYC_PENDING'
  | 'KYC_VERIFICATION'
  | 'DOCUMENTS_PENDING'
  | 'APPLICATION_SUBMITTED'
  | 'CREDIT_ASSESSMENT'
  | 'UNDERWRITING'
  | 'OFFER_READY'
  | 'OFFER_ACCEPTED'
  | 'AGREEMENT_PENDING'
  | 'ESIGN_PENDING'
  | 'FINANCE_PROCESSING'
  | 'DISBURSEMENT_PROCESSING'
  | 'ACTIVE_LOAN'
  | 'PAYMENT_DUE'
  | 'OVERDUE'
  | 'LOAN_CLOSED';

export interface BorrowerJourneyState {
  currentStage: BorrowerJourneyStage;
  stageLabel: string;
  stageDescription: string;
  progressPercentage: number;
  activeApplicationId?: string;
  activeOfferId?: string;
  activeAgreementId?: string;
  activeLoanId?: string;
  actionRequired: boolean;
  actionLabel?: string;
  actionUrl?: string;
  customerCode: string;
  borrowerName: string;
  kycStatus: string;
}

export interface BorrowerConsentRecord {
  id: string;
  consentType: string;
  purpose: string;
  version: string;
  grantedAt: string;
  ipAddress?: string;
  status: 'ACTIVE' | 'REVOKED';
}

export interface BorrowerDocumentSummary {
  id: string;
  documentType: string;
  category: string;
  title: string;
  fileName: string;
  status: string;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface ProfileSectionStatus {
  sectionKey: 'personal' | 'address' | 'employment' | 'kyc' | 'bank';
  title: string;
  isComplete: boolean;
  missingFields: string[];
}

export interface BorrowerDetailedProfile {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  dateOfBirth: string | null;
  gender: string | null;
  kycStatus: string;
  riskCategory: string | null;
  status: string;
  panNumberMasked: string | null;
  aadhaarMasked: string | null;
  monthlyIncome?: number | null;
  employmentType?: string | null;
  primaryAddress: {
    addressLine: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    addressType: string;
  } | null;
  primaryEmployment: {
    employmentType: string | null;
    employerName: string | null;
    designation: string | null;
    monthlyIncome: number | null;
    existingObligations: number | null;
    workExperienceYears: number | null;
    institutionName: string | null;
    courseName: string | null;
    rollNumber: string | null;
    graduationYear: number | null;
    businessName: string | null;
    annualTurnover: number | null;
  } | null;
  primaryBank: {
    bankName: string | null;
    accountNumberMasked: string | null;
    ifscCode: string | null;
    accountHolderName: string | null;
    accountType: string | null;
    isVerified: boolean;
  } | null;
  completion: {
    percentage: number;
    isComplete: boolean;
    sections: ProfileSectionStatus[];
    missingFields: string[];
  };
  consentsCount: number;
}

export interface UpdateBorrowerProfileInput {
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  addressType?: 'CURRENT' | 'PERMANENT' | 'OFFICE';
  employmentType?: 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS' | 'PROFESSIONAL' | 'STUDENT' | 'FREELANCER' | 'FARMER' | 'OTHER';
  employerName?: string;
  designation?: string;
  monthlyIncome?: number;
  existingEmiObligations?: number;
  workExperienceYears?: number;
  institutionName?: string;
  courseName?: string;
  rollNumber?: string;
  graduationYear?: number;
  businessName?: string;
  annualTurnover?: number;
  professionType?: string;
}

export interface BorrowerOverdueInstallment {
  emiNumber: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  feeDue: number;
  totalDue: number;
  outstanding: number;
  status: string;
}

export interface BorrowerOverdueLoanItem {
  loanId: string;
  loanAccountNumber: string;
  productName: string;
  totalOutstanding: number;
  overdueAmount: number;
  dpd: number;
  agingBucket: string;
  oldestOverdueDate: string | null;
  overdueInstallmentsCount: number;
  affectedInstallments: BorrowerOverdueInstallment[];
  activePtp: {
    id: string;
    promisedDate: string;
    promisedAmount: number;
    paymentMode?: string;
    status: string;
    createdAt: string;
  } | null;
  borrowerMessage: string;
}

export interface BorrowerOverdueSummary {
  hasOverdue: boolean;
  totalOverdueAmount: number;
  maxDpd: number;
  overdueLoansCount: number;
  overdueLoans: BorrowerOverdueLoanItem[];
}

export interface BorrowerPtpInput {
  loanId: string;
  promisedDate: string;
  promisedAmount: number;
  paymentMode?: string;
  notes?: string;
}

export interface BorrowerPtpRecord {
  id: string;
  caseId: string;
  loanId: string;
  loanAccountNumber: string;
  promisedAmount: number;
  promisedDate: string;
  paymentMode?: string;
  status: string;
  createdAt: string;
}

export interface BorrowerStatementTransaction {
  id: string;
  transactionDate: string;
  referenceNumber: string;
  transactionType: 'DISBURSEMENT' | 'REPAYMENT' | 'WAIVER' | 'FEE' | 'PENALTY' | string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  runningPrincipalBalance: number;
  paymentMethod?: string;
  status: string;
  allocations?: Array<{
    component: string;
    amount: number;
  }>;
}

export interface BorrowerLoanStatement {
  statementId: string;
  generatedAt: string;
  asOfDate: string;
  lenderInfo: {
    name: string;
    entityType: string;
    cinNumber?: string;
    rbiRegistrationNo?: string;
    contactEmail: string;
    supportPhone?: string;
  };
  borrowerInfo: {
    customerCode: string;
    borrowerName: string;
    mobile: string;
    email: string | null;
    panMasked: string | null;
  };
  loanSummary: {
    loanId: string;
    loanAccountNumber: string;
    productName: string;
    productCode?: string;
    sanctionedPrincipal: number;
    interestRate: number;
    tenureMonths: number;
    emiAmount: number;
    disbursementDate: string | null;
    maturityDate: string | null;
    closedAt: string | null;
    status: string;
    totalRepaymentExpected: number;
    totalPaid: number;
    totalPrincipalPaid: number;
    totalInterestPaid: number;
    totalFeesPaid: number;
    outstandingPrincipal: number;
    outstandingInterest: number;
    outstandingFees: number;
    totalOutstanding: number;
    isNocAvailable: boolean;
    nocNumber: string | null;
  };
  transactions: BorrowerStatementTransaction[];
  repaymentSchedule: Array<{
    emiNumber: number;
    dueDate: string;
    principalDue: number;
    interestDue: number;
    totalDue: number;
    outstanding: number;
    status: string;
    paidAt: string | null;
  }>;
}

