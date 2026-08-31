import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate } from '../../middleware/auth';
import { listNotifications, markAsRead } from './notification.service';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
    const notifications = await listNotifications(req.user?.id, customerId);
    res.json(success(notifications));
  })
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const notification = await markAsRead(req.params.id);
    res.json(success(notification));
  })
);

export default router;
