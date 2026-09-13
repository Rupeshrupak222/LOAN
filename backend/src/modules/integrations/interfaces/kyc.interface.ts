// KYC Provider Interface & Normalized Contracts

export type KycVerificationStatus = 'VERIFIED' | 'FAILED' | 'PENDING' | 'REQUIRES_ACTION' | 'RETRYABLE_ERROR';

export type KycDocumentType = 'PAN' | 'AADHAAR' | 'PASSPORT' | 'VOTER_ID' | 'DRIVING_LICENSE';

export interface PanVerificationRequest {
  panNumber: string;
  fullName: string;
  dateOfBirth?: string;
}

export interface PanVerificationResult {
  status: KycVerificationStatus;
  panNumber: string;
  nameOnCard: string;
  nameMatchScore: number;
  isPanValid: boolean;
  isOperative: boolean;
  category: 'INDIVIDUAL' | 'COMPANY' | 'HUF' | 'FIRM' | 'OTHER';
  providerReference: string;
  verifiedAt: string;
}

export interface AadhaarDigilockerRequest {
  aadhaarNumber?: string;
  otp?: string;
  consentId: string;
  redirectUrl?: string;
}

export interface AadhaarDigilockerResult {
  status: KycVerificationStatus;
  aadhaarLast4: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    country: string;
  };
  photoBase64?: string;
  isMasked: boolean;
  providerReference: string;
  verifiedAt: string;
}

export interface FaceVerificationRequest {
  selfieImageBase64: string;
  documentPhotoBase64?: string;
  livenessCheckRequired?: boolean;
}

export interface FaceVerificationResult {
  status: KycVerificationStatus;
  faceMatchScore: number; // 0 to 100
  isLivenessDetected: boolean;
  spoofRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  providerReference: string;
  verifiedAt: string;
}

export interface DocumentOcrRequest {
  documentType: KycDocumentType;
  imageBase64: string;
  fileMimeType: string;
}

export interface DocumentOcrResult {
  status: KycVerificationStatus;
  documentType: KycDocumentType;
  extractedNumber: string;
  extractedName?: string;
  extractedDob?: string;
  extractedAddress?: string;
  confidenceScore: number; // 0 to 100
  isTampered: boolean;
  providerReference: string;
  verifiedAt: string;
}

export interface KycProvider {
  readonly providerId: string;
  readonly name: string;
  readonly environment: 'SANDBOX' | 'PRODUCTION';

  verifyPan(req: PanVerificationRequest, correlationId: string): Promise<PanVerificationResult>;
  verifyAadhaarDigilocker(req: AadhaarDigilockerRequest, correlationId: string): Promise<AadhaarDigilockerResult>;
  verifyFace(req: FaceVerificationRequest, correlationId: string): Promise<FaceVerificationResult>;
  extractDocumentOcr(req: DocumentOcrRequest, correlationId: string): Promise<DocumentOcrResult>;
}
