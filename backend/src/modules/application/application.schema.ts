import { z } from 'zod';

export const createApplicationSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID format'),
  productId: z.union([z.string().uuid(), z.literal(''), z.null()]).optional().transform((v) => (v ? v : undefined)),
  productName: z.string().optional(),
  requestedAmount: z.coerce.number().positive('Requested loan amount must be greater than 0'),
  interestRate: z.coerce.number().min(0.1).max(100).optional().nullable().transform((v) => (v != null ? Number(v) : undefined)),
  tenureMonths: z.coerce.number().int().positive('Tenure must be at least 1 month'),
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
