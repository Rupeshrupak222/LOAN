import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../common/asyncHandler';
import { parsePagination } from '../../common/pagination';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import {
  listUsers,
  createUser,
  updateUserStatus,
  updateUser,
  resetUserPassword,
} from './user.service';

const router = Router();

router.use(authenticate);
router.use(tenantContext);
const STAFF_ADMIN = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'BRANCH_MANAGER'];

router.get(
  '/',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const params = parsePagination(req.query);
    const role = req.query.role ? String(req.query.role) : undefined;
    const result = await listUsers(params, role, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(result.data, result.pagination));
  })
);

router.post(
  '/',
  authorize(...STAFF_ADMIN),
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
    const user = await createUser(req.body, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.status(201).json(success(user));
  })
);

router.patch(
  '/:id/status',
  authorize(...STAFF_ADMIN),
  validate(
    z.object({
      status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED', 'BLOCKED']),
      reason: z.string().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const updated = await updateUserStatus(
      req.params.id,
      req.body.status,
      req.body.reason,
      {
        id: req.user?.id,
        roles: req.user?.roles,
        tenantId: req.tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      }
    );
    res.json(success(updated));
  })
);

router.put(
  '/:id',
  authorize(...STAFF_ADMIN),
  validate(
    z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      employeeId: z.string().optional(),
      branchId: z.string().uuid().optional(),
      roleName: z.string().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const updated = await updateUser(
      req.params.id,
      req.body,
      {
        id: req.user?.id,
        roles: req.user?.roles,
        tenantId: req.tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      }
    );
    res.json(success(updated));
  })
);

router.post(
  '/:id/reset-password',
  authorize(...STAFF_ADMIN),
  validate(
    z.object({
      newPassword: z.string().min(6).optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const result = await resetUserPassword(
      req.params.id,
      req.body.newPassword,
      {
        id: req.user?.id,
        roles: req.user?.roles,
        tenantId: req.tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      }
    );
    res.json(success(result));
  })
);

export default router;
