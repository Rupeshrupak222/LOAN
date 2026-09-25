import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verificationGateService, VerificationIncompleteError } from './verification-gate.service';
import { prisma } from '../../config/prisma';
import * as documentRules from '../documents/document-rules';

// Mock Prisma
vi.mock('../../config/prisma', () => ({
  prisma: {
    loanApplication: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock Document Rules
vi.mock('../documents/document-rules', () => ({
  validateCustomerDocumentFulfillment: vi.fn(),
}));

describe('VerificationGateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockApp = {
    id: 'app-1',
    customerId: 'cust-1',
    requestedAmount: 500000,
    customer: {
      kycStatus: 'VERIFIED',
      employmentType: 'SALARIED',
      monthlyIncome: 50000,
      documents: [],
    },
    documents: [],
    product: {
      productType: 'PERSONAL',
    },
  };

  it('should return complete summary when KYC is VERIFIED and documents are complete', async () => {
    vi.mocked(prisma.loanApplication.findUnique).mockResolvedValue(mockApp as any);
    vi.mocked(documentRules.validateCustomerDocumentFulfillment).mockReturnValue({
      isComplete: true,
      missingNames: [],
      checklistStatus: [],
    });

    const summary = await verificationGateService.getVerificationSummary('app-1');

    expect(summary.isComplete).toBe(true);
    expect(summary.kyc.isVerified).toBe(true);
    expect(summary.documents.isComplete).toBe(true);
  });

  it('should return incomplete summary when KYC is not VERIFIED', async () => {
    vi.mocked(prisma.loanApplication.findUnique).mockResolvedValue({
      ...mockApp,
      customer: { ...mockApp.customer, kycStatus: 'PENDING' },
    } as any);
    
    vi.mocked(documentRules.validateCustomerDocumentFulfillment).mockReturnValue({
      isComplete: true,
      missingNames: [],
      checklistStatus: [],
    });

    const summary = await verificationGateService.getVerificationSummary('app-1');

    expect(summary.isComplete).toBe(false);
    expect(summary.kyc.isVerified).toBe(false);
    expect(summary.documents.isComplete).toBe(true);
  });

  it('should return incomplete summary when mandatory documents are missing', async () => {
    vi.mocked(prisma.loanApplication.findUnique).mockResolvedValue(mockApp as any);
    
    vi.mocked(documentRules.validateCustomerDocumentFulfillment).mockReturnValue({
      isComplete: false,
      missingNames: ['PAN Card', 'Bank Statement'],
      checklistStatus: [],
    });

    const summary = await verificationGateService.getVerificationSummary('app-1');

    expect(summary.isComplete).toBe(false);
    expect(summary.kyc.isVerified).toBe(true);
    expect(summary.documents.isComplete).toBe(false);
    expect(summary.documents.missingMandatory).toEqual(['PAN Card', 'Bank Statement']);
  });

  it('should throw VerificationIncompleteError if assertCreditAssessmentAllowed is called and incomplete', async () => {
    vi.mocked(prisma.loanApplication.findUnique).mockResolvedValue(mockApp as any);
    vi.mocked(documentRules.validateCustomerDocumentFulfillment).mockReturnValue({
      isComplete: false,
      missingNames: ['PAN Card'],
      checklistStatus: [],
    });

    await expect(verificationGateService.assertCreditAssessmentAllowed('app-1'))
      .rejects.toThrow(VerificationIncompleteError);
  });

  it('should resolve if assertCreditAssessmentAllowed is called and complete', async () => {
    vi.mocked(prisma.loanApplication.findUnique).mockResolvedValue(mockApp as any);
    vi.mocked(documentRules.validateCustomerDocumentFulfillment).mockReturnValue({
      isComplete: true,
      missingNames: [],
      checklistStatus: [],
    });

    await expect(verificationGateService.assertCreditAssessmentAllowed('app-1')).resolves.not.toThrow();
  });
});
