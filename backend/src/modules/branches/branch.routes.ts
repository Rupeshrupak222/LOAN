import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { listBranches, createBranch, updateBranch } from './branch.service';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const branches = await listBranches();
    res.json(success(branches));
  })
);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate(
    z.object({
      code: z.string().min(2),
      name: z.string().min(2),
      city: z.string().optional(),
      state: z.string().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const branch = await createBranch(req.body);
    res.status(201).json(success(branch));
  })
);

router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const branch = await updateBranch(req.params.id, req.body);
    res.json(success(branch));
  })
);

export default router;
