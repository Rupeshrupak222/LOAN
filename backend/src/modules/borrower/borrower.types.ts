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
    panNumberMasked: string;
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
  // Step 3: Employment
  employmentType: 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS' | 'PROFESSIONAL';
  employerName: string;
  monthlyIncome: number;
  existingEmiObligations?: number;
  // Step 4: KYC & Identity
  panNumber: string;
  aadhaarNumberMasked: string;
  kycConsentGiven: boolean;
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
