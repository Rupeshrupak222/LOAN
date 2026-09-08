export interface LoanProductOption {
  id: string;
  code: string;
  name: string;
  productType: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  interestMethod: string;
  minTenureMonths: number;
  maxTenureMonths: number;
  processingFeePct: number;
}

export interface EligibilityResultData {
  result: 'ELIGIBLE' | 'CONDITIONALLY_ELIGIBLE' | 'NOT_ELIGIBLE';
  score: number;
  factors: { factor: string; status: 'PASS' | 'WARNING' | 'FAIL'; detail: string }[];
  minEligibleAmount: string;
  maxEligibleAmount: string;
  requestedAmount: string;
  tenureMonths: number;
  interestRate: string;
  estimatedEmi: string;
  totalInterest: string;
  totalRepayment: string;
  product?: {
    id: string;
    name: string;
    code: string;
    productType: string;
    interestRate: number;
    processingFeePct: number;
  };
}

export interface UploadedDocItem {
  id?: string;
  type: 'PAN_CARD' | 'AADHAAR_FRONT' | 'BANK_STATEMENT' | 'SALARY_SLIP' | 'CUSTOMER_SELFIE_PHOTO' | 'ADDRESS_PROOF';
  fileName: string;
  fileSize?: number;
  fileUrl?: string;
  status: 'NOT_UPLOADED' | 'UPLOADING' | 'UPLOADED' | 'UNDER_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  errorMessage?: string;
}

export interface BorrowerFormData {
  // Step 1: Target Loan & Purpose
  purpose: string;
  requestedAmount: number;
  tenureMonths: number;

  // Step 2: Eligibility Check Fields
  monthlyIncome: number;
  employmentType: 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS' | 'PROFESSIONAL';
  existingObligations: number;

  // Step 3: Personal Details
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  mobile: string;
  email: string;
  pan: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;

  // Step 4: Employment Details
  employerName: string;
  workExperienceYears: number;
  officeAddress?: string;
  profession?: string;
  businessDurationYears?: number;
  gstin?: string;

  // Step 5: Financial Obligations
  hasExistingLoans: boolean;
  activeLoansCount?: number;
  totalMonthlyEmi?: number;
  totalOutstandingAmount?: number;

  // Step 6: KYC Identity
  kycMode: 'SIMULATED_DEMO' | 'MANUAL_UPLOAD';
  kycConsent: boolean;

  // Step 7: Bank Account for Disbursal
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  accountType: 'SAVINGS' | 'CURRENT';

  // Step 8: Selected Loan Scheme
  selectedProductId: string;

  // Step 9: Documents
  documents: UploadedDocItem[];

  // Step 10: Legal Consents
  consentTerms: boolean;
  consentPrivacy: boolean;
  consentBureauCheck: boolean;
}

export const INITIAL_BORROWER_FORM_DATA: BorrowerFormData = {
  purpose: 'Personal & Medical Expenses',
  requestedAmount: 200000,
  tenureMonths: 24,
  monthlyIncome: 65000,
  employmentType: 'SALARIED',
  existingObligations: 0,
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '1996-06-15',
  gender: 'MALE',
  mobile: '',
  email: '',
  pan: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: 'Maharashtra',
  pincode: '',
  employerName: '',
  workExperienceYears: 3,
  officeAddress: '',
  profession: '',
  businessDurationYears: 3,
  gstin: '',
  hasExistingLoans: false,
  activeLoansCount: 0,
  totalMonthlyEmi: 0,
  totalOutstandingAmount: 0,
  kycMode: 'SIMULATED_DEMO',
  kycConsent: true,
  accountHolderName: '',
  bankName: 'State Bank of India',
  accountNumber: '',
  confirmAccountNumber: '',
  ifscCode: 'SBIN0001234',
  accountType: 'SAVINGS',
  selectedProductId: '',
  documents: [
    { type: 'PAN_CARD', fileName: '', status: 'NOT_UPLOADED' },
    { type: 'AADHAAR_FRONT', fileName: '', status: 'NOT_UPLOADED' },
    { type: 'BANK_STATEMENT', fileName: '', status: 'NOT_UPLOADED' },
    { type: 'SALARY_SLIP', fileName: '', status: 'NOT_UPLOADED' },
    { type: 'CUSTOMER_SELFIE_PHOTO', fileName: '', status: 'NOT_UPLOADED' },
  ],
  consentTerms: false,
  consentPrivacy: false,
  consentBureauCheck: false,
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry'
];

export const LOAN_PURPOSES = [
  { id: 'Personal & Medical Expenses', label: 'Personal & Medical', icon: 'HeartHandshake' },
  { id: 'Home Renovation & Repairs', label: 'Home Renovation', icon: 'Home' },
  { id: 'Business Working Capital', label: 'Business & MSME', icon: 'Briefcase' },
  { id: 'Higher Education Fees', label: 'Higher Education', icon: 'GraduationCap' },
  { id: 'Vehicle / Two-Wheeler', label: 'Vehicle Purchase', icon: 'Car' },
  { id: 'Debt Consolidation', label: 'Debt Consolidation', icon: 'Layers' },
];

export type BorrowerPortalTab = 'OVERVIEW' | 'SCHEDULE' | 'PAYMENTS' | 'LOANS' | 'APPLICATIONS' | 'APPLY';

export interface BorrowerFinancialMetrics {
  totalLoansCount: number;
  activeLoansCount: number;
  closedLoansCount: number;
  totalBorrowed: number;
  totalRepaid: number;
  currentOutstanding: number;
  nextEmiAmount: number;
  nextEmiDueDate: string | null;
  paidInstallmentsCount: number;
  remainingInstallmentsCount: number;
  hasOverdue: boolean;
  overdueAmount: number;
}

export function calculateBorrowerFinancialMetrics(loansList: any[] = []): BorrowerFinancialMetrics {
  const loans = Array.isArray(loansList) ? loansList : [];
  
  let totalBorrowed = 0;
  let totalRepaid = 0;
  let currentOutstanding = 0;
  let activeLoansCount = 0;
  let closedLoansCount = 0;
  let paidInstallmentsCount = 0;
  let remainingInstallmentsCount = 0;
  let nextEmiAmount = 0;
  let nextEmiDueDate: string | null = null;
  let hasOverdue = false;
  let overdueAmount = 0;

  // Track closest future due date
  let earliestUpcomingDateMs: number | null = null;

  loans.forEach((loan) => {
    const principal = Number(loan.principal || 0);
    const outstanding = Number(loan.outstandingPrincipal ?? loan.principal ?? 0);
    const status = String(loan.status || '').toUpperCase();

    totalBorrowed += principal;

    if (['ACTIVE', 'OVERDUE', 'RESTRUCTURED', 'DISBURSED'].includes(status)) {
      activeLoansCount++;
      currentOutstanding += outstanding;
    } else if (['CLOSED', 'SETTLED'].includes(status)) {
      closedLoansCount++;
    }

    if (status === 'OVERDUE') {
      hasOverdue = true;
    }

    // Sum payments made for this loan
    if (Array.isArray(loan.payments)) {
      loan.payments.forEach((p: any) => {
        if (p.status === 'SUCCESS') {
          totalRepaid += Number(p.amount || 0);
        }
      });
    }

    // Inspect schedule installments
    if (Array.isArray(loan.schedule)) {
      loan.schedule.forEach((inst: any) => {
        const instStatus = String(inst.status || '').toUpperCase();
        if (instStatus === 'PAID') {
          paidInstallmentsCount++;
        } else if (['UPCOMING', 'DUE', 'PARTIALLY_PAID', 'OVERDUE'].includes(instStatus)) {
          remainingInstallmentsCount++;
          
          if (instStatus === 'OVERDUE') {
            hasOverdue = true;
            overdueAmount += Number(inst.outstanding || inst.totalDue || 0);
          }

          if (inst.dueDate) {
            const dueMs = new Date(inst.dueDate).getTime();
            if (!isNaN(dueMs)) {
              if (earliestUpcomingDateMs === null || dueMs < earliestUpcomingDateMs) {
                earliestUpcomingDateMs = dueMs;
                nextEmiAmount = Number(inst.totalDue || inst.outstanding || loan.emiAmount || 0);
                nextEmiDueDate = inst.dueDate;
              }
            }
          }
        }
      });
    } else if (['ACTIVE', 'OVERDUE', 'DISBURSED'].includes(status)) {
      // Fallback if schedule is not populated yet
      if (loan.nextDueDate) {
        const dueMs = new Date(loan.nextDueDate).getTime();
        if (!isNaN(dueMs)) {
          if (earliestUpcomingDateMs === null || dueMs < earliestUpcomingDateMs) {
            earliestUpcomingDateMs = dueMs;
            nextEmiAmount = Number(loan.emiAmount || 0);
            nextEmiDueDate = loan.nextDueDate;
          }
        }
      }
    }
  });

  return {
    totalLoansCount: loans.length,
    activeLoansCount,
    closedLoansCount,
    totalBorrowed,
    totalRepaid,
    currentOutstanding,
    nextEmiAmount,
    nextEmiDueDate,
    paidInstallmentsCount,
    remainingInstallmentsCount,
    hasOverdue,
    overdueAmount,
  };
}
