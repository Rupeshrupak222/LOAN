import { z } from 'zod';

export const creditRecommendationSchema = z.object({
  body: z.object({
    recommendation: z.enum(['RECOMMEND', 'RECOMMEND_WITH_CONDITIONS', 'SEND_BACK']),
    notes: z.string().min(3, 'Detailed justification note is required (minimum 3 characters)'),
    conditions: z.string().optional(),
    proposedAmount: z.number().positive().optional(),
    proposedTenure: z.number().int().positive().optional(),
    proposedRate: z.number().positive().optional(),
  }),
});

export type CreditRecommendationInput = z.infer<typeof creditRecommendationSchema>['body'];

export const forwardUnderwritingSchema = z.object({
  body: z.object({
    reason: z.string().optional(),
  }),
});

export type ForwardUnderwritingInput = z.infer<typeof forwardUnderwritingSchema>['body'];
