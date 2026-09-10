import { z } from 'zod';

export const registerDocumentSchema = z.object({
  customerId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  category: z.string().min(1, 'Document category is required'),
  documentType: z.string().min(1),
  documentName: z.string().optional(),
  description: z.string().optional(),
  fileName: z.string().min(1),
  storageKey: z.string().min(1),
  contentType: z.string().optional(),
  sizeBytes: z.number().int().positive().optional(),
  expiryDate: z.coerce.date().optional(),
});

export const verifyDocumentSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED', 'UNDER_REVIEW', 'REQUIRES_CORRECTION']),
  rejectionReason: z.string().optional(),
});

export type RegisterDocumentInput = z.infer<typeof registerDocumentSchema>;
export type VerifyDocumentInput = z.infer<typeof verifyDocumentSchema>;
