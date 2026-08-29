import { z } from 'zod';

export const createApplicationSchema = z.object({
  customerId: z.string().uuid(),
  productId: z.string().uuid(),
  requestedAmount: z.coerce.number().positive(),
  tenureMonths: z.coerce.number().int().positive(),
  purpose: z.string().optional(),
});

export const transitionSchema = z.object({
  toStatus: z.enum([
    'DRAFT',
    'SUBMITTED',
    'KYC_PENDING',
    'KYC_VERIFIED',
    'UNDER_REVIEW',
    'CREDIT_ASSESSMENT',
    'UNDERWRITING',
    'APPROVED',
    'REJECTED',
    'AGREEMENT_PENDING',
    'READY_FOR_DISBURSEMENT',
    'DISBURSED',
    'CANCELLED',
  ]),
  reason: z.string().optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
