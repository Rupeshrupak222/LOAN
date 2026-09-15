import { z } from 'zod';

export const underwritingDecisionSchema = z.object({
  decision: z.enum(['APPROVE', 'APPROVE_WITH_CONDITIONS', 'SEND_BACK', 'REJECT', 'HOLD', 'ESCALATE']),
  reason: z.string().min(1, 'Reason or rationale is required'),
  conditions: z.string().optional(),
  approvedAmount: z.number().positive().optional(),
  approvedTenure: z.number().int().positive().optional(),
  approvedRate: z.number().positive().optional(),
  escalationTarget: z.string().optional(),
});

export const resolveDeviationSchema = z.object({
  status: z.enum(['RESOLVED', 'WAIVED', 'REJECTED']),
  reason: z.string().min(1, 'Resolution reason or remarks is required'),
});

export type UnderwritingDecisionInput = z.infer<typeof underwritingDecisionSchema>;
export type ResolveDeviationInput = z.infer<typeof resolveDeviationSchema>;
