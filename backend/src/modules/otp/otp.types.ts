export type OtpChannelType = 'MOBILE' | 'EMAIL';

export interface SendOtpDto {
  target: string;
  type: OtpChannelType;
  purpose?: string;
}

export interface VerifyOtpDto {
  target: string;
  type: OtpChannelType;
  otp: string;
}

export interface OtpRecord {
  target: string;
  type: OtpChannelType;
  code: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  verified: boolean;
  verifiedAt?: number;
}
