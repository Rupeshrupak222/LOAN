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

export const createCaseSchema = z.object({
  loanId: z.string().uuid(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  notes: z.string().optional(),
});

export const resolveCaseSchema = z.object({
  resolutionReason: z.enum([
    'DUES_CLEARED',
    'PAYMENT_PLAN_COMPLETED',
    'CUSTOMER_REGULARIZED',
    'ADMINISTRATIVE_RESOLUTION',
    'SETTLEMENT_HONORED',
    'OTHER',
  ]),
  notes: z.string().min(1, 'Resolution notes are required'),
});

export const closeCaseSchema = z.object({
  closureReason: z.string().min(1, 'Closure reason is required'),
  notes: z.string().optional(),
});

export const updateCaseStatusSchema = z.object({
  status: z.enum([
    'OPEN',
    'IN_PROGRESS',
    'PROMISED',
    'ON_HOLD',
    'ESCALATED',
    'RESOLVED',
    'CLOSED',
  ]),
  notes: z.string().min(1, 'Transition notes are required'),
});

export type LogActivityInput = z.infer<typeof logActivitySchema>;
export type RecordPtpInput = z.infer<typeof recordPtpSchema>;
export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type ResolveCaseInput = z.infer<typeof resolveCaseSchema>;
export type CloseCaseInput = z.infer<typeof closeCaseSchema>;
export type UpdateCaseStatusInput = z.infer<typeof updateCaseStatusSchema>;
