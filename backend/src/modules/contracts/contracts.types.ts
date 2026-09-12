// Enterprise Contract, Key Fact Statement (KFS), eSign & Mandate Types

export interface KfsFeeItem {
  name: string;
  amount: number;
  taxAmount: number; // 18% GST
  totalAmount: number;
  deductedFromDisbursement: boolean;
}

export interface KfsContingentCharge {
  event: string;
  chargeFormula: string;
  exampleCharge: string;
}

export interface KfsDocument {
  kfsNumber: string;
  applicationId: string;
  applicationNo: string;
  tenantId: string;
  lenderName: string;
  lenderCin: string;
  lenderRbiRegNo: string;
  borrowerName: string;
  borrowerMobile: string;
  borrowerEmail?: string;
  borrowerPanMasked?: string;
  
  // Loan Parameters
  sanctionedPrincipalAmount: number;
  netDisbursedAmount: number;
  annualInterestRatePct: number;
  interestType: 'FIXED' | 'FLOATING' | 'REDUCING_BALANCE';
  tenureMonths: number;
  repaymentFrequency: 'MONTHLY' | 'WEEKLY' | 'BULLET';
  numberOfInstallments: number;
  installmentAmountEmi: number;
  totalInterestPayable: number;
  totalAmountPayableByBorrower: number;
  
  // Fee Breakdown
  upfrontFees: KfsFeeItem[];
  totalUpfrontFeesAndTaxes: number;
  
  // Statutory Metrics
  annualPercentageRateAprPct: number;
  coolingOffPeriodDays: number;
  coolingOffTerms: string;
  
  // Contingent / Penalty Charges
  contingentCharges: KfsContingentCharge[];
  
  // Grievance Redressal
  grievanceRedressalOfficer: {
    name: string;
    designation: string;
    email: string;
    phone: string;
    address: string;
  };
  
  generatedAt: string;
  version: number;
}

export interface DigitalAgreementClause {
  clauseNumber: string;
  heading: string;
  body: string;
}

export interface DigitalLoanAgreement {
  agreementId: string;
  agreementNumber: string;
  applicationId: string;
  applicationNo: string;
  tenantId: string;
  lenderLegalEntity: string;
  borrowerFullName: string;
  sanctionAmount: number;
  interestRateAnnual: number;
  tenureMonths: number;
  monthlyEmi: number;
  clauses: DigitalAgreementClause[];
  status: 'DRAFT' | 'READY_FOR_SIGNATURE' | 'EXECUTED' | 'EXPIRED' | 'REVOKED';
  generatedAt: string;
}

export type ESignProviderType =
  | 'MOCK_DIGISIGN'
  | 'NSDL_AADHAAR_ESIGN'
  | 'LEGALITY_ESIGN'
  | 'DIGIO_ESIGN';

export type ESignStatus = 'INITIATED' | 'SENT' | 'VIEWED' | 'SIGNED' | 'REJECTED' | 'EXPIRED';

export interface ESignAuditRecord {
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  event: string;
  certificateThumbprint?: string;
  signerAadhaarLast4?: string;
}

export interface ESignSession {
  sessionId: string;
  agreementId: string;
  applicationId: string;
  provider: ESignProviderType;
  signerName: string;
  signerMobile: string;
  signerEmail?: string;
  status: ESignStatus;
  signingUrl: string;
  expiresAt: string;
  signedDocumentUrl?: string;
  certificateId?: string;
  auditTrail: ESignAuditRecord[];
  createdAt: string;
  updatedAt: string;
}

export type MandateProviderType =
  | 'NPCI_ENACH'
  | 'RAZORPAY_MANDATE'
  | 'CASHFREE_MANDATE'
  | 'DIGIO_NACH';

export type MandateAuthMode = 'NET_BANKING' | 'DEBIT_CARD' | 'AADHAAR_OTP';

export type MandateStatus = 'INITIATED' | 'AUTHENTICATING' | 'ACTIVE' | 'FAILED' | 'REVOKED' | 'EXPIRED';

export interface MandateSession {
  mandateId: string;
  applicationId: string;
  customerId: string;
  provider: MandateProviderType;
  authMode: MandateAuthMode;
  umrn?: string; // Unique Mandate Reference Number assigned by NPCI
  bankName: string;
  accountNumberMasked: string;
  ifscCode: string;
  maxAmountLimit: number;
  recurringFrequency: 'MONTHLY' | 'AS_PRESENTED';
  startDate: string;
  endDate: string;
  status: MandateStatus;
  authUrl: string;
  createdAt: string;
  updatedAt: string;
}
