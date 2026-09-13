// Banking & Penny Drop Verification Provider Interface & Normalized Contracts

export type BankVerificationStatus =
  | 'VALID_ACCOUNT'
  | 'INVALID_ACCOUNT'
  | 'NAME_MATCH'
  | 'NAME_MISMATCH'
  | 'PENDING'
  | 'FAILED';

export interface BankVerificationRequest {
  accountNumber: string;
  ifscCode: string;
  beneficiaryName: string;
  mobile?: string;
}

export interface BankVerificationResult {
  status: BankVerificationStatus;
  isValid: boolean;
  registeredName: string;
  beneficiaryNameProvided: string;
  nameMatchPercentage: number;
  bankName: string;
  branchName: string;
  city?: string;
  utrOrReference: string;
  verificationMode: 'PENNY_DROP' | 'REVERSE_PENNY_DROP' | 'SANDBOX_SIMULATED';
  verifiedAt: string;
}

export interface BankVerificationProvider {
  readonly providerId: string;
  readonly name: string;
  readonly environment: 'SANDBOX' | 'PRODUCTION';

  verifyBankAccount(req: BankVerificationRequest, correlationId: string): Promise<BankVerificationResult>;
}
