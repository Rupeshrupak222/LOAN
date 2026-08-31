import { z } from 'zod';

export const recordPaymentSchema = z.object({
  loanId: z.string().uuid(),
  amount: z.coerce.number().positive('Payment amount must be greater than 0'),
  method: z.enum(['UPI', 'BANK_TRANSFER', 'NEFT', 'IMPS', 'RTGS', 'CASH', 'CHEQUE', 'GATEWAY']),
  reference: z.string().min(1, 'Payment reference / UTR / receipt number is required'),
  idempotencyKey: z.string().optional(),
  paidAt: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
