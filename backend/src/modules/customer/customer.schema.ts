import { z } from 'zod';

export const createCustomerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  dateOfBirth: z.coerce.date({ invalid_type_error: 'Valid date of birth is required' }).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Mobile number must be a valid 10-digit Indian number (e.g. 9876543210)'),
  phone: z.string().optional(),
  email: z.string().trim().email('Valid email address is required').optional().or(z.literal('')),
  password: z.string().trim().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  addressLine: z.string().trim().optional().or(z.literal('')),
  city: z.string().trim().optional().or(z.literal('')),
  state: z.string().trim().optional().or(z.literal('')),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Pincode must be a 6-digit numeric code')
    .optional()
    .or(z.literal('')),
  address: z
    .object({
      addressLine: z.string().trim().optional().or(z.literal('')),
      city: z.string().trim().optional().or(z.literal('')),
      state: z.string().trim().optional().or(z.literal('')),
      pincode: z
        .string()
        .trim()
        .regex(/^\d{6}$/, 'Pincode must be a 6-digit numeric code')
        .optional()
        .or(z.literal('')),
    })
    .optional(),
  employmentType: z
    .enum([
      'SALARIED',
      'SELF_EMPLOYED',
      'BUSINESS_OWNER',
      'BUSINESS',
      'PROFESSIONAL',
      'FREELANCER',
      'FARMER',
      'RETIRED',
      'HOMEMAKER',
      'STUDENT',
      'OTHER',
    ])
    .optional(),
  employerName: z.string().trim().optional().or(z.literal('')),
  designation: z.string().trim().optional().or(z.literal('')),
  monthlyIncome: z.coerce.number().positive('Monthly income must be greater than 0').optional(),
  existingObligations: z.coerce.number().nonnegative('Obligations cannot be negative').optional(),
  bankName: z.string().trim().optional().or(z.literal('')),
  bankAccountNo: z
    .string()
    .trim()
    .regex(/^\d{8,20}$/, 'Bank account number must be 8-20 numeric digits')
    .optional()
    .or(z.literal('')),
  bankIfsc: z
    .string()
    .trim()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'IFSC must be a valid 11-character code (e.g. HDFC0001234)')
    .optional()
    .or(z.literal('')),
  bankAccount: z
    .object({
      bankName: z.string().trim().optional().or(z.literal('')),
      accountNumber: z
        .string()
        .trim()
        .regex(/^\d{8,20}$/, 'Bank account number must be 8-20 numeric digits')
        .optional()
        .or(z.literal('')),
      bankAccountNo: z
        .string()
        .trim()
        .regex(/^\d{8,20}$/, 'Bank account number must be 8-20 numeric digits')
        .optional()
        .or(z.literal('')),
      ifscCode: z
        .string()
        .trim()
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'IFSC must be a valid 11-character code')
        .optional()
        .or(z.literal('')),
      bankIfsc: z
        .string()
        .trim()
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'IFSC must be a valid 11-character code')
        .optional()
        .or(z.literal('')),
    })
    .optional(),
  branchId: z.string().uuid().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const updateKycStatusSchema = z.object({
  kycStatus: z.enum(['NOT_STARTED', 'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED']),
  riskCategory: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  remarks: z.string().optional(),
});

export const createAddressSchema = z.object({
  addressType: z.enum(['CURRENT', 'PERMANENT', 'OFFICE']).default('CURRENT'),
  addressLine: z.string().trim().min(1, 'Address line is required'),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required'),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Pincode must be a 6-digit numeric code'),
  isPrimary: z.boolean().default(true),
});

export const createBankAccountSchema = z.object({
  accountHolderName: z.string().trim().min(1, 'Account holder name is required'),
  bankName: z.string().trim().min(1, 'Bank name is required'),
  accountNumber: z.string().trim().regex(/^\d{8,20}$/, 'Account number must be 8-20 numeric digits'),
  ifscCode: z.string().trim().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'IFSC must be a valid 11-character code (e.g. HDFC0001234)'),
  accountType: z.enum(['SAVINGS', 'CURRENT', 'SALARY']).default('SAVINGS'),
  isPrimary: z.boolean().default(true),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateKycStatusInput = z.infer<typeof updateKycStatusSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
