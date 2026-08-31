import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { parsePagination } from '../../common/pagination';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { recordPaymentSchema } from './payment.schema';
import { listPayments, getPaymentDetail, processPayment } from './payment.service';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = parsePagination(req.query);
    const loanId = req.query.loanId ? String(req.query.loanId) : undefined;
    const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
    const result = await listPayments(params, loanId, customerId);
    res.json(success(result.data, result.pagination));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const payment = await getPaymentDetail(req.params.id);
    res.json(success(payment));
  })
);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'COLLECTION_OFFICER', 'LOAN_OFFICER', 'BRANCH_MANAGER'),
  validate(recordPaymentSchema),
  asyncHandler(async (req, res) => {
    const payment = await processPayment(req.body, req.user?.id);
    res.status(201).json(success(payment));
  })
);

export default router;
