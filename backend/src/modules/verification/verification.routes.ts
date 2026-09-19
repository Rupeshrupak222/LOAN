import { Router } from 'express';
import { verificationService } from './verification.service';
import { verificationGateService } from './verification-gate.service';
import { authenticate, authorize } from '../../middleware/auth';
import { asyncHandler } from '../../common/asyncHandler';

export const verificationRoutes = Router();

// Get Verification Summary
verificationRoutes.get(
  '/application/:applicationId/summary',
  authenticate,
  authorize('CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const summary = await verificationGateService.getVerificationSummary(req.params.applicationId);
    res.json({ success: true, summary });
  })
);

// Trigger Document Verification
verificationRoutes.post(
  '/document/:documentId/verify',
  authenticate,
  authorize('CREDIT_ANALYST', 'SUPER_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const actor = req.user as any;
    const result = await verificationService.verifyDocumentWithProvider(
      req.params.documentId,
      actor.id,
      actor.email
    );
    res.json(result);
  })
);

// Trigger KYC Verification
verificationRoutes.post(
  '/customer/:customerId/kyc',
  authenticate,
  authorize('CREDIT_ANALYST', 'SUPER_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const actor = req.user as any;
    const result = await verificationService.verifyCustomerKyc(
      req.params.customerId,
      actor.id
    );
    res.json(result);
  })
);
