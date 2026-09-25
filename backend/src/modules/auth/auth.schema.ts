import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or Employee ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1).optional().default('Borrower'),
  lastName: z.string().min(1).optional().default('User'),
  mobile: z.string().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const otpLoginSchema = z.object({
  mobile: z.string().min(10, 'Valid 10-digit mobile number is required'),
  otp: z.string().min(4, 'OTP code is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type OtpLoginInput = z.infer<typeof otpLoginSchema>;
