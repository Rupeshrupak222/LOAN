import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { listSettings, getSettingByKey, updateSetting } from './settings.service';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'AUDITOR'),
  asyncHandler(async (_req, res) => {
    const settings = await listSettings();
    res.json(success(settings));
  })
);

router.get(
  '/:key',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const setting = await getSettingByKey(req.params.key);
    res.json(success(setting));
  })
);

router.put(
  '/:key',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  validate(z.object({ value: z.any() })),
  asyncHandler(async (req, res) => {
    const updated = await updateSetting(req.params.key, req.body.value, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
    });
    res.json(success(updated));
  })
);

export default router;
