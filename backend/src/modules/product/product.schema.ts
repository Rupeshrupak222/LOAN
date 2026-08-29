import { z } from 'zod';

export const createProductSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  productType: z.string().min(2),
  minAmount: z.coerce.number().positive(),
  maxAmount: z.coerce.number().positive(),
  minTenureMonths: z.coerce.number().int().positive(),
  maxTenureMonths: z.coerce.number().int().positive(),
  interestRate: z.coerce.number().nonnegative(),
  interestMethod: z.enum(['FLAT', 'REDUCING']).default('REDUCING'),
  processingFeePct: z.coerce.number().nonnegative().default(0),
  lateFeePct: z.coerce.number().nonnegative().default(0),
  gracePeriodDays: z.coerce.number().int().nonnegative().default(0),
  eligibilityRules: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();
export type CreateProductInput = z.infer<typeof createProductSchema>;
