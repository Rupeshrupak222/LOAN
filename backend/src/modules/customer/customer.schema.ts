import { z } from 'zod';

export const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.string().optional(),
  mobile: z.string().min(6).max(20).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  addressLine: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  address: z
    .object({
      addressLine: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
    })
    .optional(),
  employmentType: z.string().optional(),
  employerName: z.string().optional(),
  designation: z.string().optional(),
  monthlyIncome: z.coerce.number().nonnegative().optional(),
  existingObligations: z.coerce.number().nonnegative().optional(),
  bankName: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankIfsc: z.string().optional(),
  bankAccount: z
    .object({
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      bankAccountNo: z.string().optional(),
      ifscCode: z.string().optional(),
      bankIfsc: z.string().optional(),
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
  addressLine: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
  isPrimary: z.boolean().default(true),
});

export const createBankAccountSchema = z.object({
  accountHolderName: z.string().min(1),
  bankName: z.string().min(1),
  accountNumber: z.string().min(1),
  ifscCode: z.string().min(1),
  accountType: z.enum(['SAVINGS', 'CURRENT', 'SALARY']).default('SAVINGS'),
  isPrimary: z.boolean().default(true),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateKycStatusInput = z.infer<typeof updateKycStatusSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
