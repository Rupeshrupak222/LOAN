import { z } from 'zod';

export const executeDisbursementSchema = z.object({
  applicationId: z.string().uuid(),
  disbursementMethod: z.enum(['NEFT_BANK_TRANSFER', 'RTGS', 'IMPS', 'UPI', 'CHEQUE', 'DIRECT_CREDIT']),
  referenceNumber: z.string().min(1, 'Payment reference / UTR is required'),
  bankAccountId: z.string().uuid().optional(),
  remarks: z.string().optional(),
});

export type ExecuteDisbursementInput = z.infer<typeof executeDisbursementSchema>;
