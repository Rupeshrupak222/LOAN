import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { otpService } from './otp.service';

const router = Router();

const sendOtpSchema = z.object({
  target: z.string().min(1, 'Target is required'),
  type: z.enum(['MOBILE', 'EMAIL']),
  purpose: z.string().optional(),
});

const verifyOtpSchema = z.object({
  target: z.string().min(1, 'Target is required'),
  type: z.enum(['MOBILE', 'EMAIL']),
  otp: z.string().min(4, 'OTP code is required'),
});

router.post('/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = sendOtpSchema.parse(req.body);
    const result = await otpService.sendOtp(data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/verify', (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = verifyOtpSchema.parse(req.body);
    const result = otpService.verifyOtp(data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { target, type } = req.body;
    if (!target || !type) {
      return res.json({ success: true, verified: false });
    }
    const verified = otpService.isVerified(target, type);
    res.json({ success: true, verified });
  } catch (err) {
    next(err);
  }
});

export default router;
