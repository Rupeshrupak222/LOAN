import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../common/asyncHandler';
import { BadRequestError, ForbiddenError } from '../../common/errors';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { upload } from '../../middleware/upload';
import { registerDocumentSchema, verifyDocumentSchema } from './document.schema';
import {
  listDocuments,
  getDocument,
  registerDocument,
  verifyDocument,
  uploadAndRegisterDocument,
  deleteDocument,
} from './document.service';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
    const applicationId = req.query.applicationId ? String(req.query.applicationId) : undefined;
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    const userIdFilter = isStaff ? undefined : req.user?.id;
    const docs = await listDocuments(customerId, applicationId, userIdFilter);
    res.json(success(docs));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await getDocument(req.params.id);
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    if (!isStaff && (doc.customer as any)?.userId !== req.user?.id) {
      throw new ForbiddenError('Access forbidden: You cannot access another borrower document');
    }
    res.json(success(doc));
  })
);

/**
 * Direct Multipart/Form-Data File Upload to Cloudinary Cloud
 */
router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new BadRequestError('Please provide a file to upload in the "file" field');
    }

    let customerId = req.body.customerId;
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );

    if (!customerId) {
      if (!isStaff && req.user?.id) {
        let cust = await prisma.customer.findFirst({ where: { userId: req.user.id } });
        if (!cust) {
          const userRec = await prisma.user.findUnique({ where: { id: req.user.id } });
          const count = await prisma.customer.count();
          const code = `CUST-${String(count + 1).padStart(4, '0')}`;
          cust = await prisma.customer.create({
            data: {
              userId: req.user.id,
              customerCode: code,
              firstName: userRec?.firstName || 'Borrower',
              lastName: userRec?.lastName || 'User',
              email: req.user.email,
              mobile: '9876543210',
              kycStatus: 'PENDING',
            },
          });
        }
        customerId = cust.id;
      } else {
        throw new BadRequestError('customerId is required for document upload');
      }
    } else if (!isStaff) {
      const cust = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!cust || cust.userId !== req.user?.id) {
        throw new ForbiddenError('Access forbidden: You can only upload documents for your own account');
      }
    }

    const doc = await uploadAndRegisterDocument(
      req.file,
      {
        customerId,
        applicationId: req.body.applicationId || undefined,
        category: req.body.category || 'IDENTITY_PROOF',
        documentType: req.body.documentType || 'DOCUMENT',
        expiryDate: req.body.expiryDate || undefined,
      },
      req.user?.id
    );

    res.status(201).json(success(doc));
  })
);

router.post(
  '/',
  validate(registerDocumentSchema),
  asyncHandler(async (req, res) => {
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    if (!isStaff) {
      const cust = await prisma.customer.findUnique({ where: { id: req.body.customerId } });
      if (!cust || cust.userId !== req.user?.id) {
        throw new ForbiddenError('Access forbidden: You can only upload documents for your own account');
      }
    }
    const doc = await registerDocument(req.body, req.user?.id);
    res.status(201).json(success(doc));
  })
);

router.patch(
  '/:id/verify',
  authorize('SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER'),
  validate(verifyDocumentSchema),
  asyncHandler(async (req, res) => {
    const doc = await verifyDocument(req.params.id, req.body, req.user?.email, req.user?.id);
    res.json(success(doc));
  })
);

router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER', 'UNDERWRITER'),
  asyncHandler(async (req, res) => {
    const result = await deleteDocument(req.params.id, req.user?.id);
    res.json(success(result));
  })
);

export default router;
