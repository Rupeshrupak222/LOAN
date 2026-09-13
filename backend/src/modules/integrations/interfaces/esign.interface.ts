// Digital eSign Provider Interface & Normalized Contracts

export type EsignStatus =
  | 'SESSION_CREATED'
  | 'SIGN_PENDING'
  | 'SIGNED'
  | 'FAILED'
  | 'EXPIRED';

export interface EsignSessionRequest {
  documentId: string;
  documentTitle: string;
  signerName: string;
  signerEmail: string;
  signerMobile: string;
  signType: 'AADHAAR_OTP' | 'ELECTRONIC_SIGNATURE' | 'DSC';
  callbackUrl?: string;
  expiryMinutes?: number;
}

export interface EsignSessionResult {
  sessionId: string;
  status: EsignStatus;
  signingUrl: string;
  expiresAt: string;
  providerReference: string;
}

export interface EsignVerificationResult {
  sessionId: string;
  status: EsignStatus;
  isSigned: boolean;
  signerAadhaarLast4?: string;
  signedAt?: string;
  certificateThumbprint?: string;
  auditTrailUrl?: string;
  signedDocumentUrl?: string;
}

export interface EsignProvider {
  readonly providerId: string;
  readonly name: string;
  readonly environment: 'SANDBOX' | 'PRODUCTION';

  createSigningSession(req: EsignSessionRequest, correlationId: string): Promise<EsignSessionResult>;
  checkSigningStatus(sessionId: string, correlationId: string): Promise<EsignVerificationResult>;
}
