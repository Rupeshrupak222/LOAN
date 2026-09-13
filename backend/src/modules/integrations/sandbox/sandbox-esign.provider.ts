// Deterministic Digital eSign Sandbox Provider
import {
  EsignProvider,
  EsignSessionRequest,
  EsignSessionResult,
  EsignVerificationResult,
} from '../interfaces/esign.interface';

export class SandboxEsignProvider implements EsignProvider {
  readonly providerId = 'sandbox_esign';
  readonly name = 'Deterministic In-Memory eSign Provider';
  readonly environment = 'SANDBOX' as const;

  private sessionStates = new Map<string, 'SIGN_PENDING' | 'SIGNED' | 'FAILED' | 'EXPIRED'>();

  public setSessionState(sessionId: string, state: 'SIGN_PENDING' | 'SIGNED' | 'FAILED' | 'EXPIRED') {
    this.sessionStates.set(sessionId, state);
  }

  public async createSigningSession(
    req: EsignSessionRequest,
    correlationId: string
  ): Promise<EsignSessionResult> {
    const sessionId = `ESIGN-SES-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Default status is SIGNED in sandbox STP mode
    this.sessionStates.set(sessionId, 'SIGNED');

    return {
      sessionId,
      status: 'SESSION_CREATED',
      signingUrl: `https://sandbox.esign.adyapan.io/sign/${sessionId}`,
      expiresAt,
      providerReference: `SBX-ESIGN-REQ-${Date.now()}`,
    };
  }

  public async checkSigningStatus(
    sessionId: string,
    correlationId: string
  ): Promise<EsignVerificationResult> {
    const state = this.sessionStates.get(sessionId) || 'SIGNED';

    if (state === 'FAILED') {
      return {
        sessionId,
        status: 'FAILED',
        isSigned: false,
      };
    }

    if (state === 'EXPIRED') {
      return {
        sessionId,
        status: 'EXPIRED',
        isSigned: false,
      };
    }

    if (state === 'SIGN_PENDING') {
      return {
        sessionId,
        status: 'SIGN_PENDING',
        isSigned: false,
      };
    }

    return {
      sessionId,
      status: 'SIGNED',
      isSigned: true,
      signerAadhaarLast4: '8842',
      signedAt: new Date().toISOString(),
      certificateThumbprint: `SHA256:7B:${sessionId.slice(-6)}:CERT:SIMULATED`,
      auditTrailUrl: `https://sandbox.esign.adyapan.io/audit/${sessionId}`,
      signedDocumentUrl: `https://sandbox.esign.adyapan.io/docs/${sessionId}.pdf`,
    };
  }
}
