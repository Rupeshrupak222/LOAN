import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ForbiddenError } from '../../common/errors';
import { parsePagination } from '../../common/pagination';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import {
  createCustomerSchema,
  updateCustomerSchema,
  updateKycStatusSchema,
  createAddressSchema,
  createBankAccountSchema,
} from './customer.schema';
import {
  listCustomers,
  getCustomer,
  getCustomerByUserId,
  createCustomer,
  updateCustomer,
  updateKycStatus,
  addCustomerAddress,
  addCustomerBankAccount,
  deleteCustomerBankAccount,
  deleteCustomer,
} from './customer.service';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const customer = await getCustomerByUserId(req.user?.id!, req.user as any);
    res.json(success(customer));
  })
);

router.get(
  '/',
  authorize(
    'SUPER_ADMIN',
    'COMPANY_ADMIN',
    'ADMIN',
    'LOAN_OFFICER',
    'CREDIT_ANALYST',
    'UNDERWRITER',
    'BRANCH_MANAGER',
    'AUDITOR',
    'COLLECTION_OFFICER',
    'FINANCE_OFFICER'
  ),
  asyncHandler(async (req, res) => {
    const params = parsePagination(req.query);
    const status = req.query.status ? String(req.query.status) : undefined;
    const kycStatus = req.query.kycStatus ? String(req.query.kycStatus) : undefined;
    const result = await listCustomers(params, status, kycStatus, req.user as any);
    res.json(success(result.data, result.pagination));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    const customer = await getCustomer(req.params.id, req.user as any);

    if (!isStaff && customer.userId !== req.user?.id) {
      throw new ForbiddenError('Access forbidden: You cannot view another borrower profile');
    }

    res.json(success(customer));
  })
);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER'),
  validate(createCustomerSchema),
  asyncHandler(async (req, res) => {
    const customer = await createCustomer(req.body, req.user?.id, req.user?.tenantId);
    res.status(201).json(success(customer));
  })
);

router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER'),
  validate(updateCustomerSchema),
  asyncHandler(async (req, res) => {
    const customer = await updateCustomer(req.params.id, req.body, req.user?.id, req.user as any);
    res.json(success(customer));
  })
);

router.patch(
  '/:id/kyc',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER'),
  validate(updateKycStatusSchema),
  asyncHandler(async (req, res) => {
    const customer = await updateKycStatus(req.params.id, req.body, req.user?.id, req.user as any);
    res.json(success(customer));
  })
);

router.post(
  '/:id/addresses',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER'),
  validate(createAddressSchema),
  asyncHandler(async (req, res) => {
    const address = await addCustomerAddress(req.params.id, req.body, req.user?.id, req.user as any);
    res.status(201).json(success(address));
  })
);

router.post(
  '/:id/bank-accounts',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER', 'FINANCE_OFFICER'),
  validate(createBankAccountSchema),
  asyncHandler(async (req, res) => {
    const account = await addCustomerBankAccount(req.params.id, req.body, req.user?.id, req.user as any);
    res.status(201).json(success(account));
  })
);

router.delete(
  '/:id/bank-accounts/:bankAccountId',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER', 'FINANCE_OFFICER'),
  asyncHandler(async (req, res) => {
    const result = await deleteCustomerBankAccount(req.params.id, req.params.bankAccountId, req.user?.id, req.user as any);
    res.json(success(result));
  })
);

router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const result = await deleteCustomer(req.params.id, req.user?.id, req.user as any);
    res.json(success(result));
  })
);

export default router;
