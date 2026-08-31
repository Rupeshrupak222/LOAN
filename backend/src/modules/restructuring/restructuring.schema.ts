import { z } from 'zod';

export const proposeRestructureSchema = z.object({
  loanId: z.string().uuid(),
  newTenureMonths: z.number().int().min(1).max(120),
  newInterestRate: z.coerce.number().min(0).max(50),
  moratoriumMonths: z.number().int().min(0).max(12).default(0),
  reason: z.string().min(1, 'Restructure reason is required'),
});

export const proposeSettlementSchema = z.object({
  loanId: z.string().uuid(),
  settlementAmount: z.coerce.number().positive('Settlement amount must be positive'),
  reason: z.string().min(1, 'Settlement rationale is required'),
});

export const executeClosureSchema = z.object({
  loanId: z.string().uuid(),
  closureType: z.enum(['NORMAL_MATURITY', 'EARLY_PREPAYMENT', 'SETTLEMENT', 'WRITE_OFF']).default('NORMAL_MATURITY'),
  remarks: z.string().optional(),
});

export type ProposeRestructureInput = z.infer<typeof proposeRestructureSchema>;
export type ProposeSettlementInput = z.infer<typeof proposeSettlementSchema>;
export type ExecuteClosureInput = z.infer<typeof executeClosureSchema>;
