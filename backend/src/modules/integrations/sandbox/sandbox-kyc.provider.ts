// Deterministic In-Memory KYC Sandbox Provider
import {
  AadhaarDigilockerRequest,
  AadhaarDigilockerResult,
  DocumentOcrRequest,
  DocumentOcrResult,
  FaceVerificationRequest,
  FaceVerificationResult,
  KycProvider,
  PanVerificationRequest,
  PanVerificationResult,
} from '../interfaces/kyc.interface';

export class SandboxKycProvider implements KycProvider {
  readonly providerId = 'sandbox_kyc';
  readonly name = 'Deterministic In-Memory KYC Gateway';
  readonly environment = 'SANDBOX' as const;

  // Custom scenario overrides for repeatable tests
  private forcedScenario?: 'SUCCESS' | 'FAILED' | 'PENDING' | 'TIMEOUT' | 'NAME_MISMATCH';

  public setForcedScenario(scenario?: 'SUCCESS' | 'FAILED' | 'PENDING' | 'TIMEOUT' | 'NAME_MISMATCH') {
    this.forcedScenario = scenario;
  }

  public async verifyPan(
    req: PanVerificationRequest,
    correlationId: string
  ): Promise<PanVerificationResult> {
    const pan = req.panNumber.trim().toUpperCase();

    // Check forced scenario or deterministic triggers
    if (this.forcedScenario === 'TIMEOUT' || pan.endsWith('0000T')) {
      throw new Error(`[PROVIDER_TIMEOUT] KYC Provider timed out after 10000ms (Correlation: ${correlationId})`);
    }

    if (this.forcedScenario === 'PENDING' || pan.endsWith('0000P')) {
      return {
        status: 'PENDING',
        panNumber: pan,
        nameOnCard: req.fullName,
        nameMatchScore: 0,
        isPanValid: true,
        isOperative: true,
        category: 'INDIVIDUAL',
        providerReference: `SBX-PAN-${Date.now()}`,
        verifiedAt: new Date().toISOString(),
      };
    }

    if (this.forcedScenario === 'FAILED' || pan.endsWith('9999F') || pan.length !== 10) {
      return {
        status: 'FAILED',
        panNumber: pan,
        nameOnCard: 'INVALID RECORD',
        nameMatchScore: 0,
        isPanValid: false,
        isOperative: false,
        category: 'INDIVIDUAL',
        providerReference: `SBX-PAN-ERR-${Date.now()}`,
        verifiedAt: new Date().toISOString(),
      };
    }

    if (!req.fullName || !req.fullName.trim()) {
      return {
        status: 'FAILED',
        panNumber: pan,
        nameOnCard: '',
        nameMatchScore: 0,
        isPanValid: true,
        isOperative: false,
        category: 'INDIVIDUAL',
        providerReference: `SBX-PAN-FAIL-${Date.now()}`,
        verifiedAt: new Date().toISOString(),
      };
    }

    const isMismatch = this.forcedScenario === 'NAME_MISMATCH' || pan.endsWith('8888M');
    const returnedName = isMismatch ? 'UNMATCHED NAME TEST' : req.fullName.trim().toUpperCase();
    const matchScore = isMismatch ? 35 : 98;

    return {
      status: 'VERIFIED',
      panNumber: pan,
      nameOnCard: returnedName,
      nameMatchScore: matchScore,
      isPanValid: true,
      isOperative: true,
      category: pan[3] === 'C' ? 'COMPANY' : 'INDIVIDUAL',
      providerReference: `SBX-PAN-OK-${Date.now()}`,
      verifiedAt: new Date().toISOString(),
    };
  }

  public async verifyAadhaarDigilocker(
    req: AadhaarDigilockerRequest,
    correlationId: string
  ): Promise<AadhaarDigilockerResult> {
    if (this.forcedScenario === 'FAILED' || req.consentId === 'CONSENT_FAIL') {
      return {
        status: 'FAILED',
        aadhaarLast4: '0000',
        name: '',
        gender: 'OTHER',
        dateOfBirth: '',
        address: {
          line1: '',
          city: '',
          district: '',
          state: '',
          pincode: '',
          country: 'India',
        },
        isMasked: true,
        providerReference: `SBX-UIDAI-FAIL-${Date.now()}`,
        verifiedAt: new Date().toISOString(),
      };
    }

    const last4 = req.aadhaarNumber ? req.aadhaarNumber.slice(-4) : '8842';

    if (!req.fullName || !req.fullName.trim()) {
      return {
        status: 'FAILED',
        aadhaarLast4: last4,
        name: '',
        gender: 'OTHER',
        dateOfBirth: '',
        address: {
          line1: '',
          city: '',
          district: '',
          state: '',
          pincode: '',
          country: 'India',
        },
        isMasked: true,
        providerReference: `SBX-UIDAI-FAIL-${Date.now()}`,
        verifiedAt: new Date().toISOString(),
      };
    }

    const isMismatch = this.forcedScenario === 'NAME_MISMATCH' || (req.aadhaarNumber && req.aadhaarNumber.endsWith('8888'));
    const returnedName = isMismatch ? 'UNMATCHED CITIZEN' : req.fullName.trim().toUpperCase();

    return {
      status: 'VERIFIED',
      aadhaarLast4: last4,
      name: returnedName,
      gender: 'MALE',
      dateOfBirth: '1992-06-15',
      address: {
        line1: 'Flat 402, Sunshine Residency, Outer Ring Road',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        pincode: '560103',
        country: 'India',
      },
      isMasked: true,
      providerReference: `SBX-UIDAI-OK-${Date.now()}`,
      verifiedAt: new Date().toISOString(),
    };
  }

  public async verifyFace(
    req: FaceVerificationRequest,
    correlationId: string
  ): Promise<FaceVerificationResult> {
    if (this.forcedScenario === 'FAILED') {
      return {
        status: 'FAILED',
        faceMatchScore: 22,
        isLivenessDetected: false,
        spoofRisk: 'HIGH',
        providerReference: `SBX-FACE-FAIL-${Date.now()}`,
        verifiedAt: new Date().toISOString(),
      };
    }

    return {
      status: 'VERIFIED',
      faceMatchScore: 96,
      isLivenessDetected: true,
      spoofRisk: 'LOW',
      providerReference: `SBX-FACE-OK-${Date.now()}`,
      verifiedAt: new Date().toISOString(),
    };
  }

  public async extractDocumentOcr(
    req: DocumentOcrRequest,
    correlationId: string
  ): Promise<DocumentOcrResult> {
    return {
      status: 'VERIFIED',
      documentType: req.documentType,
      extractedNumber: 'ABCDE1234F',
      extractedName: 'Adyapan Verified Borrower',
      extractedDob: '1992-06-15',
      confidenceScore: 98,
      isTampered: false,
      providerReference: `SBX-OCR-OK-${Date.now()}`,
      verifiedAt: new Date().toISOString(),
    };
  }
}
