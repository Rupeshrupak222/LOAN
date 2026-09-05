import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../common/asyncHandler';
import { parsePagination } from '../../common/pagination';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { listUsers, createUser } from './user.service';

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = parsePagination(req.query);
    const role = req.query.role ? String(req.query.role) : undefined;
    const result = await listUsers(params, role);
    res.json(success(result.data, result.pagination));
  })
);

router.post(
  '/',
  validate(
    z.object({
      email: z.string().email(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      roleName: z.string().min(1),
      branchId: z.string().uuid().optional(),
      employeeId: z.string().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const user = await createUser(req.body, req.user as any);
    res.status(201).json(success(user));
  })
);

export default router;
