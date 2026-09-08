import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../common/asyncHandler';
import { ForbiddenError } from '../../common/errors';
import { parsePagination } from '../../common/pagination';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
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
  createCustomer,
  updateCustomer,
  updateKycStatus,
  addCustomerAddress,
  addCustomerBankAccount,
  deleteCustomer,
} from './customer.service';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(
    'SUPER_ADMIN',
    'ADMIN',
    'LOAN_OFFICER',
    'CREDIT_ANALYST',
    'UNDERWRITER',
    'BRANCH_MANAGER',
    'AUDITOR',
    'COLLECTION_OFFICER'
  ),
  asyncHandler(async (req, res) => {
    const params = parsePagination(req.query);
    const status = req.query.status ? String(req.query.status) : undefined;
    const kycStatus = req.query.kycStatus ? String(req.query.kycStatus) : undefined;
    const result = await listCustomers(params, status, kycStatus);
    res.json(success(result.data, result.pagination));
  })
);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    if (!req.user?.id) {
      throw new ForbiddenError('Not authenticated');
    }
    const loanInclude = {
      product: { select: { name: true, code: true, productType: true } },
      schedule: { orderBy: { emiNumber: 'asc' as const } },
      payments: {
        include: { allocations: true },
        orderBy: { paidAt: 'desc' as const },
      },
      closure: true,
    };

    let customer = await prisma.customer.findFirst({
      where: { userId: req.user.id },
      include: {
        addresses: true,
        employmentDetails: true,
        bankAccounts: true,
        loans: {
          include: loanInclude,
          orderBy: { createdAt: 'desc' },
        },
        applications: {
          include: {
            product: { select: { name: true, code: true, minAmount: true, maxAmount: true } },
            eligibility: true,
            riskAssessment: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!customer && req.user.email) {
      const existingByEmail = await prisma.customer.findFirst({
        where: { email: { equals: req.user.email, mode: 'insensitive' } },
      });
      if (existingByEmail) {
        await prisma.customer.update({
          where: { id: existingByEmail.id },
          data: { userId: req.user.id },
        });
      } else {
        const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
        const custCode = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
        await prisma.customer.create({
          data: {
            userId: req.user.id,
            email: req.user.email,
            firstName: dbUser?.firstName || 'Borrower',
            lastName: dbUser?.lastName || 'User',
            mobile: '9876543210',
            customerCode: custCode,
            status: 'ACTIVE',
            kycStatus: 'VERIFIED',
          },
        });
      }

      customer = await prisma.customer.findFirst({
        where: { userId: req.user.id },
        include: {
          addresses: true,
          employmentDetails: true,
          bankAccounts: true,
          loans: {
            include: loanInclude,
            orderBy: { createdAt: 'desc' },
          },
          applications: {
            include: {
              product: { select: { name: true, code: true, minAmount: true, maxAmount: true } },
              eligibility: true,
              riskAssessment: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          documents: { orderBy: { createdAt: 'desc' } },
        },
      });
    }

    res.json(success(customer));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    const customer = await getCustomer(req.params.id);

    if (!isStaff && customer.userId !== req.user?.id) {
      throw new ForbiddenError('Access forbidden: You cannot view another borrower profile');
    }

    res.json(success(customer));
  })
);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER'),
  validate(createCustomerSchema),
  asyncHandler(async (req, res) => {
    const customer = await createCustomer(req.body, req.user?.id);
    res.status(201).json(success(customer));
  })
);

router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER'),
  validate(updateCustomerSchema),
  asyncHandler(async (req, res) => {
    const customer = await updateCustomer(req.params.id, req.body, req.user?.id);
    res.json(success(customer));
  })
);

router.patch(
  '/:id/kyc',
  authorize('SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER'),
  validate(updateKycStatusSchema),
  asyncHandler(async (req, res) => {
    const customer = await updateKycStatus(req.params.id, req.body, req.user?.id);
    res.json(success(customer));
  })
);

router.post(
  '/:id/addresses',
  authorize('SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER'),
  validate(createAddressSchema),
  asyncHandler(async (req, res) => {
    const address = await addCustomerAddress(req.params.id, req.body, req.user?.id);
    res.status(201).json(success(address));
  })
);

router.post(
  '/:id/bank-accounts',
  authorize('SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER', 'FINANCE_OFFICER'),
  validate(createBankAccountSchema),
  asyncHandler(async (req, res) => {
    const account = await addCustomerBankAccount(req.params.id, req.body, req.user?.id);
    res.status(201).json(success(account));
  })
);

router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER'),
  asyncHandler(async (req, res) => {
    const result = await deleteCustomer(req.params.id, req.user?.id);
    res.json(success(result));
  })
);

export default router;
