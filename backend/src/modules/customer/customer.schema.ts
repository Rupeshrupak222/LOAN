import { z } from 'zod';

export const createCustomerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.string().optional(),
  mobile: z.string().min(6).max(20),
  email: z.string().email().optional(),
  addressLine: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  employmentType: z.string().optional(),
  employerName: z.string().optional(),
  monthlyIncome: z.coerce.number().nonnegative().optional(),
  existingObligations: z.coerce.number().nonnegative().optional(),
  bankName: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankIfsc: z.string().optional(),
  branchId: z.string().uuid().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
