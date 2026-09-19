import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';

export class VerificationService {
  /**
   * Simulates calling a third-party verification provider (Sandbox/Decentro)
   * Real flow: Document -> Verification Service -> Sandbox/Decentro -> Result -> DB -> Audit Log
   */
  async verifyDocumentWithProvider(documentId: string, actorId: string, actorEmail: string) {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new NotFoundError('Document not found');
    }

    if (doc.status === 'VERIFIED') {
      throw new BadRequestError('Document is already verified.');
    }

    // SIMULATED PROVIDER CALL
    // In a real implementation, we would extract text using OCR/Vision API
    // and match it against the Sandbox / Decentro verification APIs.
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const isSuccess = Math.random() > 0.1; // 90% success rate for simulation

    let newStatus = isSuccess ? 'VERIFIED' : 'REJECTED';
    let rejectionReason = isSuccess ? null : 'Automated Verification Failed: Document details did not match public registries or were illegible.';

    const updatedDoc = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: newStatus,
        verified: isSuccess,
        verifiedBy: isSuccess ? 'SYSTEM_PROVIDER' : null,
        verifiedAt: isSuccess ? new Date() : null,
        rejectionReason,
      },
    });

    // Verification Audit Logging (Crucial step from requirements)
    await logAudit({
      userId: actorId,
      role: 'SYSTEM',
      action: 'PROVIDER_VERIFICATION_COMPLETED',
      entity: 'Document',
      entityId: documentId,
      previousValue: { status: doc.status, verified: doc.verified },
      newValue: {
        status: newStatus,
        verified: isSuccess,
        verifiedBy: 'SYSTEM_PROVIDER',
        rejectionReason,
        provider: 'Sandbox',
        confidenceScore: isSuccess ? 0.98 : 0.45,
      },
    });

    return {
      success: isSuccess,
      document: updatedDoc,
      message: isSuccess ? 'Document verified successfully via provider.' : 'Document verification failed.',
    };
  }

  /**
   * Simulates a KYC match against NSDL/UIDAI
   */
  async verifyCustomerKyc(customerId: string, actorId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    if (customer.kycStatus === 'VERIFIED') {
      throw new BadRequestError('Customer KYC is already verified.');
    }

    // SIMULATED PROVIDER CALL
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const isSuccess = true; // Always succeed for test purposes

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        kycStatus: isSuccess ? 'VERIFIED' : 'REJECTED',
        riskCategory: isSuccess ? 'LOW' : 'HIGH',
      },
    });

    await logAudit({
      userId: actorId,
      role: 'SYSTEM',
      action: 'KYC_VERIFICATION_COMPLETED',
      entity: 'Customer',
      entityId: customerId,
      previousValue: { kycStatus: customer.kycStatus },
      newValue: {
        kycStatus: updatedCustomer.kycStatus,
        provider: 'Sandbox KYC',
      },
    });

    return {
      success: isSuccess,
      customer: updatedCustomer,
      message: 'KYC verification complete',
    };
  }
}

export const verificationService = new VerificationService();
