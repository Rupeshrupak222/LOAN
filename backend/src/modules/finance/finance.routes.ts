import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../common/asyncHandler';
import { ok } from '../../common/response';
import { validate } from '../../middleware/validate';
import { calculateEmi } from './emi';

const router = Router();

const emiSchema = z.object({
  principal: z.coerce.number().positive(),
  interestRate: z.coerce.number().nonnegative(),
  tenureMonths: z.coerce.number().int().positive().max(600),
});

// Public EMI calculator - no auth required.
router.post(
  '/emi',
  validate({ body: emiSchema }),
  asyncHandler(async (req, res) => {
    const { principal, interestRate, tenureMonths } = req.body;
    return ok(res, calculateEmi(principal, interestRate, tenureMonths));
  }),
);

export default router;
