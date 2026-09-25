import { api } from './api';

export interface ProviderMetadata {
  providerName: string;
  isSandbox: boolean;
  verificationMode: 'REAL_PROVIDER' | 'SANDBOX_SIMULATION' | 'MANUAL_REVIEW';
  disclaimer: string;
}

export interface PanVerifyResult {
  success: boolean;
  isPanValid: boolean;
  panNumber: string;
  nameOnCard: string;
  nameMatchScore: number;
  isOperative: boolean;
  category: 'INDIVIDUAL' | 'COMPANY';
  status: 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
  message: string;
  providerReference: string;
  verifiedAt: string;
  providerMetadata?: ProviderMetadata;
}

export interface AadhaarVerifyResult {
  success: boolean;
  verified: boolean;
  aadhaarLast4: string;
  maskedAadhaar: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  address?: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  status: 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
  message: string;
  providerReference: string;
  verifiedAt: string;
  providerMetadata?: ProviderMetadata;
}

export interface BankVerifyResult {
  success: boolean;
  isAccountValid: boolean;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  city: string;
  state: string;
  nameAtBank: string;
  nameMatchScore: number;
  status: 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
  message: string;
  referenceId: string;
  verifiedAt: string;
  providerMetadata?: ProviderMetadata;
}

export interface IfscLookupResult {
  success: boolean;
  ifsc: string;
  bankName: string;
  branchName: string;
  city: string;
  state: string;
}

export const kycApi = {
  async verifyPan(panNumber: string, fullName?: string): Promise<PanVerifyResult> {
    const res = await api.post('/kyc/verify-pan', {
      panNumber: panNumber.trim().toUpperCase(),
      fullName: fullName?.trim(),
    });
    return res.data;
  },

  async verifyAadhaar(aadhaarNumber: string, fullName?: string): Promise<AadhaarVerifyResult> {
    const res = await api.post('/kyc/verify-aadhaar', {
      aadhaarNumber: aadhaarNumber.replace(/\D/g, ''),
      fullName: fullName?.trim(),
    });
    return res.data;
  },

  async verifyBankAccount(
    accountNumber: string,
    ifscCode: string,
    accountHolderName?: string
  ): Promise<BankVerifyResult> {
    const res = await api.post('/kyc/verify-bank-account', {
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      accountHolderName: accountHolderName?.trim(),
    });
    return res.data;
  },

  async lookupIfsc(ifsc: string): Promise<IfscLookupResult> {
    const res = await api.get(`/kyc/ifsc-lookup/${ifsc.trim().toUpperCase()}`);
    return res.data;
  },
};
