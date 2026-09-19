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
    const text = data.reason || data.remarks || data.managerRemarks;
    if (data.decision === 'SEND_BACK' || data.decision === 'ESCALATE') {
      return typeof text === 'string' && text.trim().length >= 10;
    }
    return true;
  },
  {
    message: 'A detailed reason or remarks (at least 10 characters) is mandatory when sending back or escalating an application.',
    path: ['reason'],
  }
);

export type BranchManagerDecisionInput = z.infer<typeof branchManagerDecisionSchema>;
