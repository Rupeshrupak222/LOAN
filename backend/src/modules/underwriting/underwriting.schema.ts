import { z } from 'zod';

export const underwritingDecisionSchema = z.object({
  decision: z.enum(['APPROVE', 'APPROVE_WITH_CONDITIONS', 'SEND_BACK', 'REJECT']),
  reason: z.string().min(1, 'Reason or rationale is required'),
  conditions: z.string().optional(),
});

export type UnderwritingDecisionInput = z.infer<typeof underwritingDecisionSchema>;
