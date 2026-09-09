import { z } from 'zod';

export const creditRecommendationSchema = z.object({
  recommendation: z.enum(['RECOMMEND', 'RECOMMEND_WITH_CONDITIONS', 'SEND_BACK']),
  notes: z.string().min(3, 'Detailed justification note is required (minimum 3 characters)'),
  conditions: z.string().optional().nullable(),
  proposedAmount: z.number().positive().optional().nullable(),
  proposedTenure: z.number().int().positive().optional().nullable(),
  proposedRate: z.number().positive().optional().nullable(),
});

export type CreditRecommendationInput = z.infer<typeof creditRecommendationSchema>;

export const forwardUnderwritingSchema = z.object({
  reason: z.string().optional().nullable(),
});

export type ForwardUnderwritingInput = z.infer<typeof forwardUnderwritingSchema>;

