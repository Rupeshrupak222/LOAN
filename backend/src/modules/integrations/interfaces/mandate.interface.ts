// e-NACH / UPI Autopay Mandate Provider Interface & Normalized Contracts

export type MandateStatus =
  | 'MANDATE_CREATED'
  | 'MANDATE_PENDING'
  | 'MANDATE_ACTIVE'
  | 'MANDATE_FAILED'
  | 'MANDATE_CANCELLED';

export interface MandateCreationRequest {
  customerId: string;
  loanId?: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  authMode: 'NET_BANKING' | 'DEBIT_CARD' | 'AADHAAR' | 'UPI_AUTOPAY';
  maxAmount: number;
  frequency: 'MONTHLY' | 'AS_PRESENTED' | 'ADHOC';
  startDate: string;
  endDate: string;
}

export interface MandateCreationResult {
  mandateId: string;
  status: MandateStatus;
  authUrl?: string;
  umrn?: string;
  providerReference: string;
  createdAt: string;
}

export interface MandateVerificationResult {
  mandateId: string;
  status: MandateStatus;
  umrn?: string;
  bankName?: string;
  accountNumberMasked?: string;
  activatedAt?: string;
  failureReason?: string;
}

export interface MandateProvider {
  readonly providerId: string;
  readonly name: string;
  readonly environment: 'SANDBOX' | 'PRODUCTION';

  createMandate(req: MandateCreationRequest, correlationId: string): Promise<MandateCreationResult>;
  verifyMandate(mandateId: string, correlationId: string): Promise<MandateVerificationResult>;
  cancelMandate(mandateId: string, reason: string, correlationId: string): Promise<{ success: boolean; status: MandateStatus }>;
}
