import { z } from 'zod';

export const submitCreditDecisionSchema = z.object({
  decision: z.enum(['ELIGIBLE', 'NOT_ELIGIBLE', 'FURTHER_REVIEW']),
  reason: z
    .string()
    .min(10, 'A meaningful decision reason is required (at least 10 characters)'),
  verifiedIncome: z.number().nonnegative().optional(),
  employmentVerificationStatus: z
    .enum(['PENDING', 'VERIFIED', 'FAILED', 'REQUIRES_CLARIFICATION'])
    .optional(),
  documentVerificationStatus: z
    .enum(['PENDING', 'VERIFIED', 'REJECTED', 'REQUIRES_CORRECTION'])
    .optional(),
  riskGrade: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('LOW'),
  positiveFactors: z.array(z.string()).optional(),
  riskFactors: z.array(z.string()).optional(),
  analystRemarks: z.string().optional(),
  requestedDocuments: z.string().optional(),
});

export const verifyFinancialsSchema = z.object({
  verifiedIncome: z.number().nonnegative().optional(),
  employmentVerificationStatus: z
    .enum(['PENDING', 'VERIFIED', 'FAILED', 'REQUIRES_CLARIFICATION'])
    .optional(),
  employerName: z.string().optional(),
  vintageYears: z.number().nonnegative().optional(),
  remarks: z.string().optional(),
});

export type SubmitCreditDecisionInput = z.infer<typeof submitCreditDecisionSchema>;
export type VerifyFinancialsInput = z.infer<typeof verifyFinancialsSchema>;
