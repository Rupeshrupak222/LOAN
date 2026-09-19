import { prisma } from '../../config/prisma';
import { BadRequestError } from '../../common/errors';
import { validateCustomerDocumentFulfillment } from '../documents/document-rules';

export class VerificationIncompleteError extends BadRequestError {
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = 'VerificationIncompleteError';
    Object.setPrototypeOf(this, VerificationIncompleteError.prototype);
  }
}

export class VerificationGateService {
  /**
   * Retrieves a comprehensive summary of verification status for a given application
   */
  async getVerificationSummary(applicationId: string) {
    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: {
          include: {
            documents: true,
          }
        },
        documents: true,
        product: true,
      },
    });

    if (!app) {
      throw new Error(`Application ${applicationId} not found`);
    }

    const allDocs = [...(app.customer.documents || []), ...(app.documents || [])];
    const uniqueDocs = Array.from(new Map(allDocs.map((d) => [d.id, d])).values());

    const docFulfillment = validateCustomerDocumentFulfillment(
      uniqueDocs,
      app.customer.employmentType || 'SALARIED',
      app.product.productType || 'PERSONAL',
      {
        monthlyIncome: Number(app.customer.monthlyIncome || 0),
        requestedAmount: Number(app.requestedAmount || 0),
      }
    );

    const isKycVerified = app.customer.kycStatus === 'VERIFIED';
    const areDocumentsComplete = docFulfillment.isComplete;
    
    // Evaluate if all mandatory requirements for Verification are complete
    const isComplete = isKycVerified && areDocumentsComplete;

    return {
      isComplete,
      kyc: {
        status: app.customer.kycStatus,
        isVerified: isKycVerified,
      },
      documents: {
        isComplete: areDocumentsComplete,
        missingMandatory: docFulfillment.missingNames,
      },
      customer: {
        id: app.customerId,
        employmentType: app.customer.employmentType,
      }
    };
  }

  /**
   * Boolean check if verification is completely verified
   */
  async isVerificationComplete(applicationId: string): Promise<boolean> {
    const summary = await this.getVerificationSummary(applicationId);
    return summary.isComplete;
  }

  /**
   * Asserts that credit assessment is allowed, throwing an error if verification is incomplete.
   */
  async assertCreditAssessmentAllowed(applicationId: string): Promise<void> {
    const summary = await this.getVerificationSummary(applicationId);
    
    if (!summary.isComplete) {
      const reasons = [];
      if (!summary.kyc.isVerified) reasons.push(`KYC is ${summary.kyc.status} (must be VERIFIED)`);
      if (!summary.documents.isComplete) reasons.push(`Missing mandatory documents: ${summary.documents.missingMandatory.join(', ')}`);
      
      throw new VerificationIncompleteError(
        `VERIFICATION_INCOMPLETE: Cannot proceed to Credit Assessment. ${reasons.join('; ')}`,
        { summary }
      );
    }
  }
}

export const verificationGateService = new VerificationGateService();
