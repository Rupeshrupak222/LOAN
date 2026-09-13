// Deterministic e-NACH / UPI Autopay Mandate Sandbox Provider
import {
  MandateCreationRequest,
  MandateCreationResult,
  MandateProvider,
  MandateVerificationResult,
} from '../interfaces/mandate.interface';

export class SandboxMandateProvider implements MandateProvider {
  readonly providerId = 'sandbox_mandate';
  readonly name = 'Deterministic In-Memory Mandate Provider';
  readonly environment = 'SANDBOX' as const;

  private mandateStates = new Map<string, 'MANDATE_PENDING' | 'MANDATE_ACTIVE' | 'MANDATE_FAILED' | 'MANDATE_CANCELLED'>();

  public setMandateState(mandateId: string, state: 'MANDATE_PENDING' | 'MANDATE_ACTIVE' | 'MANDATE_FAILED' | 'MANDATE_CANCELLED') {
    this.mandateStates.set(mandateId, state);
  }

  public async createMandate(
    req: MandateCreationRequest,
    correlationId: string
  ): Promise<MandateCreationResult> {
    const mandateId = `MAND-${Date.now()}`;
    const umrn = `UMRN${Date.now()}SBX`;

    this.mandateStates.set(mandateId, 'MANDATE_ACTIVE');

    return {
      mandateId,
      status: 'MANDATE_CREATED',
      authUrl: `https://sandbox.mandate.adyapan.io/auth/${mandateId}`,
      umrn,
      providerReference: `SBX-MAND-REQ-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
  }

  public async verifyMandate(
    mandateId: string,
    correlationId: string
  ): Promise<MandateVerificationResult> {
    const state = this.mandateStates.get(mandateId) || 'MANDATE_ACTIVE';

    if (state === 'MANDATE_FAILED') {
      return {
        mandateId,
        status: 'MANDATE_FAILED',
        failureReason: 'Customer authorization rejected by bank',
      };
    }

    if (state === 'MANDATE_CANCELLED') {
      return {
        mandateId,
        status: 'MANDATE_CANCELLED',
      };
    }

    if (state === 'MANDATE_PENDING') {
      return {
        mandateId,
        status: 'MANDATE_PENDING',
      };
    }

    return {
      mandateId,
      status: 'MANDATE_ACTIVE',
      umrn: `UMRN${mandateId.replace(/\D/g, '')}SBX`,
      bankName: 'State Bank of India',
      accountNumberMasked: 'XXXXXX4512',
      activatedAt: new Date().toISOString(),
    };
  }

  public async cancelMandate(
    mandateId: string,
    reason: string,
    correlationId: string
  ): Promise<{ success: boolean; status: 'MANDATE_CANCELLED' }> {
    this.mandateStates.set(mandateId, 'MANDATE_CANCELLED');
    return {
      success: true,
      status: 'MANDATE_CANCELLED',
    };
  }
}
