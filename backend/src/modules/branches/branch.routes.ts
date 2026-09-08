import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { listBranches, createBranch, updateBranch } from './branch.service';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.get(
  '/',
  authorize(
    'SUPER_ADMIN',
    'COMPANY_ADMIN',
    'ADMIN',
    'BRANCH_MANAGER',
    'LOAN_OFFICER',
    'CREDIT_ANALYST',
    'UNDERWRITER',
    'FINANCE_OFFICER',
    'COLLECTION_OFFICER',
    'AUDITOR'
  ),
  asyncHandler(async (req, res) => {
    const branches = await listBranches({
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(branches));
  })
);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  validate(
    z.object({
      code: z.string().min(2),
      name: z.string().min(2),
      city: z.string().optional(),
      state: z.string().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const branch = await createBranch(req.body, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.status(201).json(success(branch));
  })
);

router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const branch = await updateBranch(req.params.id, req.body, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(branch));
  })
);

export default router;
