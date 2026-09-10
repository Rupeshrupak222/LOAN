import { z } from 'zod';

export const submitCreditDecisionSchema = z.object({
  decision: z.enum(['ELIGIBLE', 'NOT_ELIGIBLE', 'FURTHER_REVIEW', 'REQUEST_ADDITIONAL_DOCS']),
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
  rejectionReason: z.string().optional(),
  riskConcern: z.string().optional(),
  requiredAction: z.string().optional(),
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

export const verifyKycStepSchema = z.object({
  kycStatus: z.enum(['VERIFIED', 'FAILED', 'PENDING']),
  riskCategory: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  remarks: z.string().optional(),
});

export const verifyDocumentStepSchema = z.object({
  documentId: z.string(),
  status: z.enum(['VERIFIED', 'REJECTED', 'PENDING']),
  remarks: z.string().optional(),
});

export const batchVerifyDocumentsStepSchema = z.object({
  documentIds: z.array(z.string()),
  status: z.enum(['VERIFIED', 'REJECTED', 'PENDING']),
  remarks: z.string().optional(),
});

export const evaluateFinancialStepSchema = z.object({
  verifiedIncome: z.number().nonnegative().optional(),
  remarks: z.string().optional(),
});

export const recordRiskStepSchema = z.object({
  riskGrade: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  remarks: z.string().optional(),
});

export type SubmitCreditDecisionInput = z.infer<typeof submitCreditDecisionSchema>;
export type VerifyFinancialsInput = z.infer<typeof verifyFinancialsSchema>;
export type VerifyKycStepInput = z.infer<typeof verifyKycStepSchema>;
export type VerifyDocumentStepInput = z.infer<typeof verifyDocumentStepSchema>;
export type BatchVerifyDocumentsStepInput = z.infer<typeof batchVerifyDocumentsStepSchema>;
export type EvaluateFinancialStepInput = z.infer<typeof evaluateFinancialStepSchema>;
export type RecordRiskStepInput = z.infer<typeof recordRiskStepSchema>;

