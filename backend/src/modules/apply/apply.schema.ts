import { z } from 'zod';

export const sendOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
});

export const verifyOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const publicApplySchema = z.object({
  // 1. Account & Personal Demographics
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email address is required'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile number required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  dateOfBirth: z.coerce.date(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('MALE'),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),

  // 2. Employment & Income (Support both naming variants)
  employmentType: z.enum([
    'SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'PROFESSIONAL', 'STUDENT', 'HOMEMAKER', 'OTHER'
  ]).default('SALARIED'),
  employerName: z.string().optional(),
  companyName: z.string().optional(),
  designation: z.string().optional(),
  monthlyIncome: z.coerce.number().positive('Monthly income must be greater than 0'),
  existingObligations: z.coerce.number().nonnegative().optional().default(0),
  existingEmi: z.coerce.number().nonnegative().optional(),

  // 3. KYC & Identity
  panNumber: z.string().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)').optional().or(z.literal('')),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits').optional().or(z.literal('')),
  kycDocType: z.string().optional().default('PAN_CARD'),
  kycDocUrl: z.string().optional(),

  // 4. Address Details (Support both addressLine and addressLine1)
  addressLine: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  residenceType: z.enum(['OWNED', 'RENTED', 'PARENTAL']).optional(),

  // 5. Bank Account for Fund Disbursement
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(5, 'Valid bank account number required'),
  ifscCode: z.string().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code (e.g. HDFC0001234)'),
  accountHolderName: z.string().optional(),
  accountType: z.enum(['SAVINGS', 'CURRENT', 'SALARY']).default('SAVINGS'),

  // 6. Selected Loan Terms & Scheme
  productId: z.string().optional(),
  productName: z.string().optional().default('Personal Loan Express'),
  requestedAmount: z.coerce.number().positive('Requested loan amount must be greater than 0'),
  interestRate: z.coerce.number().optional().default(12.0),
  tenureMonths: z.coerce.number().int().positive('Tenure must be at least 1 month'),
  purpose: z.string().min(1, 'Loan purpose is required'),

  // 7. Consents & Declarations (Support both bureauConsent and consentBureau)
  bureauConsent: z.boolean().optional(),
  consentBureau: z.boolean().optional(),
  termsConsent: z.boolean().optional(),
  consentTerms: z.boolean().optional(),
}).refine(
  (data) => (data.bureauConsent === true || data.consentBureau === true),
  { message: 'Credit bureau authorization is required', path: ['bureauConsent'] }
).refine(
  (data) => (data.termsConsent === true || data.consentTerms === true),
  { message: 'Acceptance of terms & conditions is required', path: ['termsConsent'] }
).refine(
  (data) => Boolean(data.employerName || data.companyName),
  { message: 'Employer or business name is required', path: ['employerName'] }
).refine(
  (data) => Boolean(data.addressLine || data.addressLine1),
  { message: 'Address line is required', path: ['addressLine'] }
);

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type PublicApplyInput = z.infer<typeof publicApplySchema>;
