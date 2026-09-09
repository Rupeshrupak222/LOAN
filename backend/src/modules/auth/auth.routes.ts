import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ok } from '../../common/response';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimiter';
import * as authService from './auth.service';
import { changePasswordSchema, loginSchema, refreshSchema, registerSchema } from './auth.schema';

const router = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;
    const result = await authService.login(identifier, password);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    return ok(res, { accessToken: result.accessToken, user: result.user });
  }),
);

router.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    return ok(res, { accessToken: result.accessToken, user: result.user }, 201);
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken ?? req.body?.refreshToken;
    const parsed = refreshSchema.safeParse({ refreshToken: token });
    if (!parsed.success) return ok(res, null, 401);
    const tokens = await authService.refresh(parsed.data.refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, cookieOptions);
    return ok(res, { accessToken: tokens.accessToken });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken ?? req.body?.refreshToken;
    await authService.logout(token);
    res.clearCookie('refreshToken', { path: '/' });
    return ok(res, { message: 'Logged out' });
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => ok(res, await authService.getProfile(req.user!.id))),
);

router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  asyncHandler(async (req, res) => {
    await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    return ok(res, { message: 'Password changed. Please log in again.' });
  }),
);

export default router;
