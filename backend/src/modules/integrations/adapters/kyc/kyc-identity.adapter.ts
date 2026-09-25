import { BaseAdapter } from '../base.adapter';
import { IntegrationCategory, ProviderConfig } from '../../integration.types';
import { getProviderConfigurations } from '../../integration.config';
import { IntegrationHubError } from '../../integration.errors';
import {
  AadhaarDigilockerRequest,
  AadhaarDigilockerResult,
  DocumentOcrRequest,
  DocumentOcrResult,
  FaceVerificationRequest,
  FaceVerificationResult,
  KycProvider,
  KycVerificationStatus,
  PanVerificationRequest,
  PanVerificationResult,
} from '../../interfaces/kyc.interface';
import { computeNameMatchScore } from '../../../kyc/kyc.service';

export class KycIdentityAdapter extends BaseAdapter implements KycProvider {
  readonly providerId = 'kyc_identity';
  readonly name = 'Identity & KYC Verification (NSDL / UIDAI GSP)';
  readonly category: IntegrationCategory = 'KYC';
  readonly environment = 'PRODUCTION' as const;
  config: ProviderConfig;

  constructor(customConfig?: Partial<ProviderConfig>) {
    super();
    this.config = {
      ...getProviderConfigurations().kyc_identity,
      ...customConfig,
    };
  }

  public async verifyPan(req: PanVerificationRequest, correlationId: string): Promise<PanVerificationResult> {
    const result = await this.execute<any>('VERIFY_PAN', req, correlationId);
    if (!result.success || !result.data) {
      throw new IntegrationHubError(
        result.error?.httpStatus || 502,
        result.error?.code || 'PROVIDER_EXECUTION_FAILED',
        result.error?.message || 'Real KYC provider PAN verification failed.',
        { correlationId }
      );
    }

    const raw = result.data;

    // Determine validity and verification status strictly from provider payload
    const isPanValid = Boolean(
      raw.isPanValid === true ||
      raw.isValid === true ||
      raw.status === 'VERIFIED' ||
      raw.status === 'VALID' ||
      raw.status === 'SUCCESS' ||
      raw.panStatus === 'VALID'
    );

    const isExplicitlyFailed =
      raw.status === 'FAILED' ||
      raw.status === 'INVALID' ||
      raw.status === 'REJECTED' ||
      raw.isPanValid === false ||
      raw.isValid === false;

    const registeredName = String(raw.nameOnCard || raw.registeredName || raw.name || raw.fullName || '').trim().toUpperCase();
    const panNumber = String(raw.panNumber || raw.pan || req.panNumber).trim().toUpperCase();
    const isOperative = raw.isOperative !== undefined ? Boolean(raw.isOperative) : isPanValid;
    const category = (raw.category || (panNumber[3] === 'C' ? 'COMPANY' : 'INDIVIDUAL')) as any;
    const providerReference = String(raw.providerReference || raw.verificationId || raw.requestId || raw.referenceId || result.providerRequestId || `REAL-PAN-${Date.now()}`);

    let nameMatchScore = raw.nameMatchScore !== undefined ? Number(raw.nameMatchScore) : 0;
    if (req.fullName && registeredName && raw.nameMatchScore === undefined) {
      nameMatchScore = computeNameMatchScore(req.fullName, registeredName);
    } else if (!req.fullName && isPanValid) {
      nameMatchScore = 100;
    }

    const isNameMatched = !req.fullName || nameMatchScore >= 60;
    const finalStatus = (isPanValid && !isExplicitlyFailed && isNameMatched) ? 'VERIFIED' : 'FAILED';

    return {
      status: finalStatus,
      panNumber,
      nameOnCard: registeredName,
      nameMatchScore,
      isPanValid: isPanValid && !isExplicitlyFailed,
      isOperative,
      category,
      providerReference,
      verifiedAt: raw.verifiedAt || new Date().toISOString(),
    };
  }

  public async verifyAadhaarDigilocker(req: AadhaarDigilockerRequest, correlationId: string): Promise<AadhaarDigilockerResult> {
    const result = await this.execute<any>('VERIFY_AADHAAR', req, correlationId);
    if (!result.success || !result.data) {
      throw new IntegrationHubError(
        result.error?.httpStatus || 502,
        result.error?.code || 'PROVIDER_EXECUTION_FAILED',
        result.error?.message || 'Real KYC provider Aadhaar verification failed.',
        { correlationId }
      );
    }

    const raw = result.data;

    const isAadhaarValid = Boolean(
      raw.status === 'VERIFIED' ||
      raw.status === 'VALID' ||
      raw.status === 'SUCCESS' ||
      raw.verified === true ||
      raw.isAadhaarValid === true
    );

    const isExplicitlyFailed =
      raw.status === 'FAILED' ||
      raw.status === 'INVALID' ||
      raw.status === 'REJECTED' ||
      raw.verified === false ||
      raw.isAadhaarValid === false;

    const aadhaarLast4 = String(
      raw.aadhaarLast4 ||
      raw.last4 ||
      (raw.aadhaarNumber ? String(raw.aadhaarNumber).slice(-4) : '') ||
      (req.aadhaarNumber ? String(req.aadhaarNumber).slice(-4) : '0000')
    );

    const name = String(raw.name || raw.fullName || raw.careOf || '').trim();
    const gender = ((raw.gender || 'OTHER').toUpperCase()) as 'MALE' | 'FEMALE' | 'OTHER';
    const dateOfBirth = String(raw.dateOfBirth || raw.dob || '1990-01-01');
    const address = raw.address || {
      line1: raw.addressLine1 || 'Main Road',
      line2: raw.addressLine2,
      city: raw.city || 'Central',
      district: raw.district || 'Central',
      state: raw.state || 'India',
      pincode: raw.pincode || '100001',
      country: 'India',
    };

    const providerReference = String(
      raw.providerReference ||
      raw.verificationId ||
      raw.requestId ||
      raw.referenceId ||
      raw.digilockerTxnId ||
      result.providerRequestId ||
      `REAL-AADHAAR-${Date.now()}`
    );

    const finalStatus: KycVerificationStatus = (isAadhaarValid && !isExplicitlyFailed) ? 'VERIFIED' : 'FAILED';

    return {
      status: finalStatus,
      aadhaarLast4,
      name,
      gender,
      dateOfBirth,
      address,
      photoBase64: raw.photoBase64,
      isMasked: true,
      providerReference,
      verifiedAt: raw.verifiedAt || new Date().toISOString(),
    };
  }

  public async verifyFace(req: FaceVerificationRequest, correlationId: string): Promise<FaceVerificationResult> {
    const result = await this.execute<FaceVerificationResult>('VERIFY_FACE', req, correlationId);
    if (!result.success || !result.data) {
      throw new IntegrationHubError(
        result.error?.httpStatus || 502,
        result.error?.code || 'PROVIDER_EXECUTION_FAILED',
        result.error?.message || 'Real KYC provider Face verification failed.',
        { correlationId }
      );
    }
    return result.data;
  }

  public async extractDocumentOcr(req: DocumentOcrRequest, correlationId: string): Promise<DocumentOcrResult> {
    const result = await this.execute<DocumentOcrResult>('DOCUMENT_OCR', req, correlationId);
    if (!result.success || !result.data) {
      throw new IntegrationHubError(
        result.error?.httpStatus || 502,
        result.error?.code || 'PROVIDER_EXECUTION_FAILED',
        result.error?.message || 'Real KYC provider OCR extraction failed.',
        { correlationId }
      );
    }
    return result.data;
  }

  protected async executeAction<T = any>(
    action: string,
    payload: any,
    correlationId: string,
    signal: AbortSignal
  ): Promise<{ data?: T; providerRequestId?: string; rawStatus?: string }> {
    const apiKey = process.env.KYC_GATEWAY_API_KEY;
    const baseUrl = this.config.baseUrl;

    if (!baseUrl || !apiKey) {
      throw new IntegrationHubError(
        503,
        'PROVIDER_NOT_CONFIGURED',
        'KYC Identity Gateway API credentials (KYC_GATEWAY_API_KEY, KYC_GATEWAY_BASE_URL) are not configured.',
        { correlationId }
      );
    }

    let endpoint = `${baseUrl}/v1/verify/pan`;
    if (action === 'VERIFY_AADHAAR') {
      endpoint = `${baseUrl}/v1/verify/aadhaar`;
    } else if (action === 'VERIFY_PHONE') {
      endpoint = `${baseUrl}/v1/verify/phone`;
    } else if (action === 'VERIFY_FACE') {
      endpoint = `${baseUrl}/v1/verify/face`;
    } else if (action === 'DOCUMENT_OCR') {
      endpoint = `${baseUrl}/v1/ocr`;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-Correlation-Id': correlationId,
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new IntegrationHubError(
        res.status,
        res.status === 401 ? 'PROVIDER_AUTH_FAILED' : res.status === 429 ? 'PROVIDER_RATE_LIMITED' : 'PROVIDER_SERVER_ERROR',
        `KYC Identity verification failed: ${res.statusText} (${errorText.slice(0, 100)})`,
        { correlationId, isRetryable: res.status >= 500 || res.status === 429 }
      );
    }

    const json: any = await res.json();
    return {
      data: json as T,
      providerRequestId: json?.verificationId || json?.requestId,
      rawStatus: res.statusText,
    };
  }
}
