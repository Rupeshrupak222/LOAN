import { z } from 'zod';

export const branchManagerDecisionSchema = z.object({
  decision: z.enum(['APPROVE', 'SEND_BACK', 'ESCALATE'], {
    errorMap: () => ({
      message: 'Decision must be one of: APPROVE, SEND_BACK, or ESCALATE.',
    }),
  }),
  reason: z.string().optional(),
  remarks: z.string().optional(),
  managerRemarks: z.string().optional(),
  delegatedAuthorityAmount: z.number().optional(),
}).refine(
  (data) => {
    const text = (data.reason || data.remarks || data.managerRemarks || '').trim();
    return text.length >= 10;
  },
  {
    message: 'A mandatory remark/reason (at least 10 characters) is required to record a Branch Manager decision.',
    path: ['remarks'],
  }
);

export type BranchManagerDecisionInput = z.infer<typeof branchManagerDecisionSchema>;
