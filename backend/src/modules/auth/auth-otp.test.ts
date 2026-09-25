import { describe, it, expect, vi } from 'vitest';
import { otpService } from '../otp/otp.service';
import * as authService from './auth.service';

describe('Phase M1: Mobile OTP Authentication & Borrower Verification Suite', () => {
  const testMobile = '9876543219';

  it('rejects invalid mobile numbers during OTP dispatch', async () => {
    await expect(
      otpService.sendOtp({ target: '12345', type: 'MOBILE' })
    ).rejects.toThrow();
  });

  it('successfully dispatches OTP to a valid 10-digit mobile number', async () => {
    const res = await otpService.sendOtp({ target: testMobile, type: 'MOBILE', purpose: 'LOGIN' });
    expect(res.success).toBe(true);
    expect(res.cooldownSeconds).toBe(30);
  });

  it('enforces 30-second cooldown on repeated OTP send requests', async () => {
    await expect(
      otpService.sendOtp({ target: testMobile, type: 'MOBILE' })
    ).rejects.toThrow(/cooldown|wait/i);
  });

  it('rejects incorrect OTP verification attempts', async () => {
    await expect(
      otpService.verifyOtp({ target: testMobile, type: 'MOBILE', otp: '000000' })
    ).rejects.toThrow(/Invalid OTP/i);
  });

  it('accepts correct OTP and verifies target', async () => {
    // Development fallback code is accepted
    const verifyRes = await otpService.verifyOtp({
      target: testMobile,
      type: 'MOBILE',
      otp: '123456',
    });
    expect(verifyRes.success).toBe(true);
    expect(verifyRes.verified).toBe(true);
    expect(otpService.isVerified(testMobile, 'MOBILE')).toBe(true);
  });

  it('loginWithOtp validates mobile format before execution', async () => {
    await expect(
      authService.loginWithOtp('invalid_phone', '123456')
    ).rejects.toThrow(/mobile/i);
  });
});
