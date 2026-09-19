import { api } from './api';

export interface SendOtpResponse {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  debugOtp?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  verified: boolean;
  message: string;
}

export const otpApi = {
  send: async (target: string, type: 'MOBILE' | 'EMAIL', purpose?: string): Promise<SendOtpResponse> => {
    const res = await api.post('/otp/send', { target, type, purpose });
    return res.data;
  },

  verify: async (target: string, type: 'MOBILE' | 'EMAIL', otp: string): Promise<VerifyOtpResponse> => {
    const res = await api.post('/otp/verify', { target, type, otp });
    return res.data;
  },

  checkStatus: async (target: string, type: 'MOBILE' | 'EMAIL'): Promise<{ success: boolean; verified: boolean }> => {
    const res = await api.post('/otp/status', { target, type });
    return res.data;
  },
};
