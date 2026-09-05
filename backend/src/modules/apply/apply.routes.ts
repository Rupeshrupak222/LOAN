import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success, created } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimiter';
import { sendOtpSchema, verifyOtpSchema, publicApplySchema } from './apply.schema';
import * as applyService from './apply.service';

const router = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

/**
 * POST /api/v1/apply/send-otp
 * Sends SMS OTP to applicant's mobile number.
 */
router.post(
  '/send-otp',
  authLimiter,
  validate(sendOtpSchema),
  asyncHandler(async (req, res) => {
    const result = await applyService.sendOtp(req.body.mobile);
    res.json(success(result));
  })
);

/**
 * POST /api/v1/apply/verify-otp
 * Verifies mobile verification OTP.
 */
router.post(
  '/verify-otp',
  authLimiter,
  validate(verifyOtpSchema),
  asyncHandler(async (req, res) => {
    const result = await applyService.verifyOtp(req.body.mobile, req.body.otp);
    res.json(success(result));
  })
);

/**
 * GET /api/v1/apply/products
 * Public list of active loan schemes and interest parameters.
 */
router.get(
  '/products',
  asyncHandler(async (_req, res) => {
    const products = await applyService.getPublicLoanProducts();
    res.json(success(products));
  })
);

/**
 * POST /api/v1/apply/submit
 * Atomic end-to-end borrower onboarding and loan origination submission.
 */
router.post(
  '/submit',
  authLimiter,
  validate(publicApplySchema),
  asyncHandler(async (req, res) => {
    const result = await applyService.submitPublicApplication(req.body);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    res.status(201).json(created(res, result));
  })
);

export default router;
