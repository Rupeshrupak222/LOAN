import { z } from 'zod';

export const logActivitySchema = z.object({
  caseId: z.string().uuid(),
  activityType: z.enum(['CALL', 'VISIT', 'SMS', 'EMAIL', 'NOTICE', 'LEGAL']),
  outcome: z.enum(['CONTACTED', 'NO_ANSWER', 'WRONG_NUMBER', 'PROMISE_TO_PAY', 'DISPUTE', 'REFUSED', 'SETTLEMENT_REQUESTED']),
  notes: z.string().min(1, 'Notes are required'),
  nextFollowUpDate: z.coerce.date().optional(),
});

export const recordPtpSchema = z.object({
  caseId: z.string().uuid(),
  promisedAmount: z.coerce.number().positive('Promised amount must be positive'),
  promisedDate: z.coerce.date(),
  paymentMode: z.string().optional(),
  notes: z.string().optional(),
});

export type LogActivityInput = z.infer<typeof logActivitySchema>;
export type RecordPtpInput = z.infer<typeof recordPtpSchema>;
