import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { parsePagination } from '../../common/pagination';
import { success } from '../../common/response';
import { authenticate } from '../../middleware/auth';
import { listLoans, getLoanDetail } from './loan.service';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = parsePagination(req.query);
    const status = req.query.status ? String(req.query.status) : undefined;
    const branchId = req.query.branchId ? String(req.query.branchId) : undefined;
    const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
    const result = await listLoans(params, status, branchId, customerId);
    res.json(success(result.data, result.pagination));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const loan = await getLoanDetail(req.params.id);
    res.json(success(loan));
  })
);

export default router;
