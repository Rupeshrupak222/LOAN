import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { kycService } from './kyc.service';
import { optionalAuthenticate } from '../../middleware/auth';

const router = Router();
router.use(optionalAuthenticate);

const verifyPanSchema = z.object({
  panNumber: z.string().min(10, 'PAN must be 10 characters').max(10, 'PAN must be 10 characters'),
  fullName: z.string().min(2, 'Borrower legal full name is required for identity verification'),
  customerId: z.string().optional(),
});

const verifyAadhaarSchema = z.object({
  aadhaarNumber: z.string().min(12, 'Aadhaar must be 12 digits'),
  otp: z.string().optional(),
  fullName: z.string().min(2, 'Borrower legal full name is required for identity verification'),
  customerId: z.string().optional(),
});

const verifyBankSchema = z.object({
  accountNumber: z.string().min(8, 'Account number must be at least 8 digits'),
  ifscCode: z.string().min(11, 'IFSC code must be 11 characters').max(11, 'IFSC code must be 11 characters'),
  accountHolderName: z.string().optional(),
  customerId: z.string().optional(),
  bankAccountId: z.string().optional(),
});

// 1. PAN Verification Endpoint
router.post('/verify-pan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = verifyPanSchema.parse(req.body);
    const user = (req as any).user;
    const result = await kycService.verifyPan(data, {
      userId: user?.id,
      tenantId: user?.tenantId,
      role: user?.role,
      ipAddress: req.ip,
      customerId: data.customerId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 2. Aadhaar Verification Endpoint
router.post('/verify-aadhaar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = verifyAadhaarSchema.parse(req.body);
    const user = (req as any).user;
    const result = await kycService.verifyAadhaar(data, {
      userId: user?.id,
      tenantId: user?.tenantId,
      role: user?.role,
      ipAddress: req.ip,
      customerId: data.customerId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 3. Bank Account Penny Drop Verification Endpoint
router.post('/verify-bank-account', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = verifyBankSchema.parse(req.body);
    const user = (req as any).user;
    const result = await kycService.verifyBankAccount(data, {
      userId: user?.id,
      tenantId: user?.tenantId,
      role: user?.role,
      ipAddress: req.ip,
      customerId: data.customerId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 4. IFSC Code Lookup Endpoint
router.get('/ifsc-lookup/:ifsc', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ifsc = req.params.ifsc;
    const result = await kycService.lookupIfsc(ifsc);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
