import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate } from '../../middleware/auth';
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  deleteNotification,
} from './notification.service';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    let customerId = req.query.customerId ? String(req.query.customerId) : undefined;
    const roles = req.user?.roles || [];
    const isStaff = roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    if (!isStaff && !customerId) {
      const cust = await prisma.customer.findUnique({ where: { userId: req.user?.id } });
      customerId = cust?.id;
    }
    const result = await listNotifications(req.user?.id, customerId, roles);
    res.json(success(result));
  })
);

router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    let customerId = req.query.customerId ? String(req.query.customerId) : undefined;
    const roles = req.user?.roles || [];
    const isStaff = roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    if (!isStaff && !customerId) {
      const cust = await prisma.customer.findUnique({ where: { userId: req.user?.id } });
      customerId = cust?.id;
    }
    const result = await markAllAsRead(req.user?.id, customerId, roles);
    res.json(success(result));
  })
);

router.delete(
  '/clear-all',
  asyncHandler(async (req, res) => {
    let customerId = req.query.customerId ? String(req.query.customerId) : undefined;
    const roles = req.user?.roles || [];
    const isStaff = roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    if (!isStaff && !customerId) {
      const cust = await prisma.customer.findUnique({ where: { userId: req.user?.id } });
      customerId = cust?.id;
    }
    const result = await clearAllNotifications(req.user?.id, customerId, roles);
    res.json(success(result));
  })
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const notification = await markAsRead(req.params.id);
    res.json(success(notification));
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const notification = await deleteNotification(req.params.id);
    res.json(success(notification));
  })
);

export default router;
