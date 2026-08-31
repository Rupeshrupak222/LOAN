import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { registerDocumentSchema, verifyDocumentSchema } from './document.schema';
import { listDocuments, getDocument, registerDocument, verifyDocument } from './document.service';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
    const applicationId = req.query.applicationId ? String(req.query.applicationId) : undefined;
    const docs = await listDocuments(customerId, applicationId);
    res.json(success(docs));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await getDocument(req.params.id);
    res.json(success(doc));
  })
);

router.post(
  '/',
  validate(registerDocumentSchema),
  asyncHandler(async (req, res) => {
    const doc = await registerDocument(req.body, req.user?.id);
    res.status(201).json(success(doc));
  })
);

router.patch(
  '/:id/verify',
  authorize('SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER'),
  validate(verifyDocumentSchema),
  asyncHandler(async (req, res) => {
    const doc = await verifyDocument(req.params.id, req.body, req.user?.email, req.user?.id);
    res.json(success(doc));
  })
);

export default router;
