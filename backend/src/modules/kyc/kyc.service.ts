import pino from 'pino';
import { BadRequestError, ForbiddenError } from '../../common/errors';
import { providerRegistry } from '../integrations/provider-registry.service';
import { ExecutionMode } from '../integrations/integration.types';
import { logAudit } from '../audit/audit.service';
import { PiiMasker } from '../privacy/pii-masker';
import { prisma } from '../../config/prisma';

const logger = pino({ name: 'kyc-service' });

export type VerificationMode = 'REAL_PROVIDER' | 'SANDBOX_SIMULATION' | 'MANUAL_REVIEW';

export interface ProviderMetadata {
  providerName: string;
  isSandbox: boolean;
  verificationMode: VerificationMode;
  disclaimer: string;
}

export interface PanVerifyDto {
  panNumber: string;
  fullName?: string;
  customerId?: string;
}

export interface PanVerifyContext {
  userId?: string;
  tenantId?: string;
  role?: string;
  ipAddress?: string;
  customerId?: string;
  forceMode?: ExecutionMode;
}

export interface PanVerifyResponse {
  success: boolean;
  isPanValid: boolean;
  panNumber: string;
  nameOnCard: string;
  nameMatchScore: number;
  isOperative: boolean;
  category: 'INDIVIDUAL' | 'COMPANY' | 'HUF' | 'FIRM' | 'OTHER';
  status: 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
  message: string;
  providerReference: string;
  verifiedAt: string;
  providerMetadata: ProviderMetadata;
}

export interface AadhaarVerifyDto {
  aadhaarNumber: string;
  otp?: string;
  fullName?: string;
  customerId?: string;
}

export interface AadhaarVerifyContext {
  userId?: string;
  tenantId?: string;
  role?: string;
  ipAddress?: string;
  customerId?: string;
  forceMode?: ExecutionMode;
}

export interface AadhaarVerifyResponse {
  success: boolean;
  verified: boolean;
  aadhaarLast4: string;
  maskedAadhaar: string;
  name: string;
  nameMatchScore?: number;
  gender: string;
  dateOfBirth: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  status: 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
  message: string;
  providerReference: string;
  verifiedAt: string;
  providerMetadata: ProviderMetadata;
}

export interface IfscLookupResponse {
  success: boolean;
  ifsc: string;
  bankName: string;
  branchName: string;
  city: string;
  state: string;
}

export interface BankVerifyDto {
  accountNumber: string;
  ifscCode: string;
  accountHolderName?: string;
  customerId?: string;
  bankAccountId?: string;
}

export interface BankVerifyContext {
  userId?: string;
  tenantId?: string;
  role?: string;
  ipAddress?: string;
  customerId?: string;
  forceMode?: ExecutionMode;
}

export interface BankVerifyResponse {
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
  providerMetadata: ProviderMetadata;
}

export interface IKycProviderAdapter {
  readonly providerName: string;
  readonly isSandbox: boolean;
  readonly verificationMode: VerificationMode;
  readonly disclaimer: string;

  verifyPan(dto: PanVerifyDto): Promise<PanVerifyResponse>;
  verifyAadhaar(dto: AadhaarVerifyDto): Promise<AadhaarVerifyResponse>;
  verifyBankAccount(dto: BankVerifyDto): Promise<BankVerifyResponse>;
  lookupIfsc(ifsc: string): Promise<IfscLookupResponse>;
}

/**
 * Utility to compute string similarity score (0 to 100)
 */
export function computeNameMatchScore(targetName: string, registeredName: string): number {
  const t = targetName.trim().toUpperCase().replace(/[^A-Z]/g, ' ');
  const r = registeredName.trim().toUpperCase().replace(/[^A-Z]/g, ' ');
  if (!t || !r) return 100;
  if (t === r) return 100;

  const tWords = t.split(/\s+/).filter(Boolean);
  const rWords = r.split(/\s+/).filter(Boolean);

  let matched = 0;
  for (const tw of tWords) {
    if (rWords.some((rw) => rw === tw || rw.startsWith(tw) || tw.startsWith(rw))) {
      matched++;
    }
  }

  const score = Math.round((matched / Math.max(tWords.length, rWords.length)) * 100);
  return Math.min(100, Math.max(0, score));
}

/**
 * Sandbox / Development KYC Adapter
 * Clearly tagged as a simulation and distinguishes sandbox testing from government registries.
 */
export class SandboxKycAdapter implements IKycProviderAdapter {
  public readonly providerName = 'Adyapan Sandbox Adapter';
  public readonly isSandbox = true;
  public readonly verificationMode: VerificationMode = 'SANDBOX_SIMULATION';
  public readonly disclaimer =
    'Sandbox simulated verification for development/testing — not an official government or regulatory verification.';

  private getMetadata(): ProviderMetadata {
    return {
      providerName: this.providerName,
      isSandbox: this.isSandbox,
      verificationMode: this.verificationMode,
      disclaimer: this.disclaimer,
    };
  }

  public async verifyPan(dto: PanVerifyDto): Promise<PanVerifyResponse> {
    const cleanPan = dto.panNumber?.trim().toUpperCase();
    if (!cleanPan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      throw new BadRequestError('Invalid PAN format. PAN must be 10 characters (e.g., ABCDE1234F).');
    }

    const nameToMatch = dto.fullName?.trim() || 'VERIFIED BORROWER';
    const isCompany = cleanPan[3] === 'C';
    const category = isCompany ? ('COMPANY' as const) : ('INDIVIDUAL' as const);

    const registeredName = dto.fullName?.trim() ? dto.fullName.trim().toUpperCase() : 'LEGAL RECORD HOLDER';
    const matchScore = computeNameMatchScore(nameToMatch, registeredName);

    return {
      success: true,
      isPanValid: true,
      panNumber: cleanPan,
      nameOnCard: registeredName,
      nameMatchScore: matchScore,
      isOperative: true,
      category,
      status: 'VERIFIED',
      message: `[Sandbox] PAN ${cleanPan} validated in development simulation environment. Status: Active & Operative.`,
      providerReference: `SBX-PAN-${Date.now().toString(36).toUpperCase()}`,
      verifiedAt: new Date().toISOString(),
      providerMetadata: this.getMetadata(),
    };
  }

  public async verifyAadhaar(dto: AadhaarVerifyDto): Promise<AadhaarVerifyResponse> {
    const raw = dto.aadhaarNumber?.replace(/\D/g, '') || '';
    if (raw.length !== 12) {
      throw new BadRequestError('Aadhaar number must be exactly 12 numeric digits.');
    }

    const last4 = raw.slice(-4);
    const masked = `XXXX-XXXX-${last4}`;
    const name = dto.fullName?.trim() || 'Sandbox Verified Citizen';

    return {
      success: true,
      verified: true,
      aadhaarLast4: last4,
      maskedAadhaar: masked,
      name,
      gender: 'MALE',
      dateOfBirth: '1994-08-12',
      address: {
        line1: 'Flat 402, Lotus Towers, Main Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      },
      status: 'VERIFIED',
      message: `[Sandbox] Aadhaar ending in ${last4} validated via demographic sandbox simulator.`,
      providerReference: `SBX-AADHAAR-${Date.now().toString(36).toUpperCase()}`,
      verifiedAt: new Date().toISOString(),
      providerMetadata: this.getMetadata(),
    };
  }

  public async lookupIfsc(ifsc: string): Promise<IfscLookupResponse> {
    const cleanIfsc = ifsc?.trim().toUpperCase();
    if (!cleanIfsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      throw new BadRequestError('Invalid IFSC format. Expected 11 alphanumeric characters (e.g. SBIN0001234).');
    }

    const BANK_PREFIXES: Record<string, string> = {
      SBIN: 'State Bank of India',
      HDFC: 'HDFC Bank',
      ICIC: 'ICICI Bank',
      UTIB: 'Axis Bank',
      KKBK: 'Kotak Mahindra Bank',
      PUNB: 'Punjab National Bank',
      BARB: 'Bank of Baroda',
      CNRB: 'Canara Bank',
      UBIN: 'Union Bank of India',
      INDB: 'IndusInd Bank',
      FDRL: 'Federal Bank',
      IDFB: 'IDFC FIRST Bank',
      YESB: 'Yes Bank',
    };

    const prefix = cleanIfsc.substring(0, 4);
    const defaultBank = BANK_PREFIXES[prefix] || `${prefix} Commercial Bank`;

    try {
      const res = await fetch(`https://ifsc.razorpay.com/${cleanIfsc}`);
      if (res.ok) {
        const data = (await res.json()) as any;
        return {
          success: true,
          ifsc: cleanIfsc,
          bankName: data.BANK || defaultBank,
          branchName: data.BRANCH || 'Main Branch',
          city: data.CITY || data.DISTRICT || 'Central',
          state: data.STATE || 'India',
        };
      }
    } catch {
      // Fallback
    }

    return {
      success: true,
      ifsc: cleanIfsc,
      bankName: defaultBank,
      branchName: 'Main Retail Banking Branch',
      city: 'Mumbai',
      state: 'Maharashtra',
    };
  }

  public async verifyBankAccount(dto: BankVerifyDto): Promise<BankVerifyResponse> {
    const { accountNumber, ifscCode, accountHolderName } = dto;
    const cleanAcct = accountNumber?.trim().replace(/\D/g, '');
    const cleanIfsc = ifscCode?.trim().toUpperCase();

    if (!cleanAcct || cleanAcct.length < 8 || cleanAcct.length > 20) {
      throw new BadRequestError('Bank account number must be between 8 and 20 digits.');
    }
    if (!cleanIfsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      throw new BadRequestError('Invalid IFSC code. (e.g. SBIN0001234)');
    }

    const ifscData = await this.lookupIfsc(cleanIfsc);
    const nameToMatch = accountHolderName?.trim() || 'PRIMARY BORROWER';
    const registeredName = nameToMatch.toUpperCase();
    const matchScore = computeNameMatchScore(nameToMatch, registeredName);

    return {
      success: true,
      isAccountValid: true,
      accountNumber: cleanAcct,
      ifscCode: cleanIfsc,
      bankName: ifscData.bankName,
      branchName: ifscData.branchName,
      city: ifscData.city,
      state: ifscData.state,
      nameAtBank: registeredName,
      nameMatchScore: matchScore,
      status: 'VERIFIED',
      message: `[Sandbox] Bank Account ending in ${cleanAcct.slice(-4)} simulated penny-drop validated. Beneficiary: ${registeredName}.`,
      referenceId: `SBX-PENNY-${Date.now().toString(36).toUpperCase()}`,
      verifiedAt: new Date().toISOString(),
      providerMetadata: this.getMetadata(),
    };
  }
}

/**
 * Manual Review KYC Adapter
 * For workflows where document/data verification is flagged for human manual review.
 */
export class ManualReviewKycAdapter implements IKycProviderAdapter {
  public readonly providerName = 'Internal Operations Manual Review';
  public readonly isSandbox = false;
  public readonly verificationMode: VerificationMode = 'MANUAL_REVIEW';
  public readonly disclaimer =
    'Manual Review mode: Verification is deferred to Credit Analyst or Compliance Officer inspection.';

  private getMetadata(): ProviderMetadata {
    return {
      providerName: this.providerName,
      isSandbox: this.isSandbox,
      verificationMode: this.verificationMode,
      disclaimer: this.disclaimer,
    };
  }

  public async verifyPan(dto: PanVerifyDto): Promise<PanVerifyResponse> {
    const cleanPan = dto.panNumber?.trim().toUpperCase();
    if (!cleanPan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      throw new BadRequestError('Invalid PAN format.');
    }

    return {
      success: true,
      isPanValid: true,
      panNumber: cleanPan,
      nameOnCard: dto.fullName || 'UNVERIFIED',
      nameMatchScore: 0,
      isOperative: false,
      category: cleanPan[3] === 'C' ? 'COMPANY' : 'INDIVIDUAL',
      status: 'MANUAL_REVIEW',
      message: 'PAN captured and queued for Credit Analyst manual verification.',
      providerReference: `MAN-PAN-${Date.now().toString(36).toUpperCase()}`,
      verifiedAt: new Date().toISOString(),
      providerMetadata: this.getMetadata(),
    };
  }

  public async verifyAadhaar(dto: AadhaarVerifyDto): Promise<AadhaarVerifyResponse> {
    const raw = dto.aadhaarNumber?.replace(/\D/g, '') || '';
    if (raw.length !== 12) {
      throw new BadRequestError('Aadhaar number must be 12 digits.');
    }
    const last4 = raw.slice(-4);

    return {
      success: true,
      verified: false,
      aadhaarLast4: last4,
      maskedAadhaar: `XXXX-XXXX-${last4}`,
      name: dto.fullName || 'UNVERIFIED',
      gender: 'OTHER',
      dateOfBirth: '',
      status: 'MANUAL_REVIEW',
      message: 'Aadhaar captured and queued for Credit Analyst manual verification.',
      providerReference: `MAN-AADHAAR-${Date.now().toString(36).toUpperCase()}`,
      verifiedAt: new Date().toISOString(),
      providerMetadata: this.getMetadata(),
    };
  }

  public async lookupIfsc(ifsc: string): Promise<IfscLookupResponse> {
    const sandbox = new SandboxKycAdapter();
    return sandbox.lookupIfsc(ifsc);
  }

  public async verifyBankAccount(dto: BankVerifyDto): Promise<BankVerifyResponse> {
    const cleanAcct = dto.accountNumber?.trim().replace(/\D/g, '');
    const cleanIfsc = dto.ifscCode?.trim().toUpperCase();

    if (!cleanAcct || cleanAcct.length < 8) {
      throw new BadRequestError('Invalid bank account number.');
    }

    const ifscData = await this.lookupIfsc(cleanIfsc);

    return {
      success: true,
      isAccountValid: false,
      accountNumber: cleanAcct,
      ifscCode: cleanIfsc,
      bankName: ifscData.bankName,
      branchName: ifscData.branchName,
      city: ifscData.city,
      state: ifscData.state,
      nameAtBank: dto.accountHolderName || 'UNVERIFIED',
      nameMatchScore: 0,
      status: 'MANUAL_REVIEW',
      message: 'Bank account details recorded and queued for manual penny drop verification.',
      referenceId: `MAN-PENNY-${Date.now().toString(36).toUpperCase()}`,
      verifiedAt: new Date().toISOString(),
      providerMetadata: this.getMetadata(),
    };
  }
}

/**
 * KYC Verification Service (Provider-Neutral Orchestrator)
 */
export class KycService {
  private activeAdapter: IKycProviderAdapter;
  private adapters: Map<string, IKycProviderAdapter> = new Map();

  constructor() {
    const sandboxAdapter = new SandboxKycAdapter();
    const manualAdapter = new ManualReviewKycAdapter();

    this.adapters.set('SANDBOX', sandboxAdapter);
    this.adapters.set('MANUAL_REVIEW', manualAdapter);

    // Default to Sandbox Adapter
    this.activeAdapter = sandboxAdapter;
    logger.info({ msg: 'KycService initialized with provider-neutral architecture', activeAdapter: this.activeAdapter.providerName });
  }

  public setAdapter(adapterName: 'SANDBOX' | 'MANUAL_REVIEW' | string): void {
    const found = this.adapters.get(adapterName);
    if (!found) {
      throw new BadRequestError(`KYC Provider Adapter '${adapterName}' not registered.`);
    }
    this.activeAdapter = found;
  }

  public registerAdapter(name: string, adapter: IKycProviderAdapter): void {
    this.adapters.set(name, adapter);
  }

  public getActiveAdapter(): IKycProviderAdapter {
    return this.activeAdapter;
  }

  /**
   * Authoritative PAN Verification Flow
   */
  public async verifyPan(dto: PanVerifyDto, context?: PanVerifyContext): Promise<PanVerifyResponse> {
    const cleanPan = dto.panNumber?.trim().toUpperCase();
    if (!cleanPan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      throw new BadRequestError('Invalid PAN format. PAN must be 10 characters (e.g., ABCDE1234F).');
    }

    const cleanName = dto.fullName?.trim();
    if (!cleanName || cleanName.length < 2) {
      throw new BadRequestError('Borrower legal full name is required before PAN identity verification can be performed.');
    }

    const correlationId = `PAN-VRF-${Date.now().toString(36).toUpperCase()}`;

    // If an explicit manual review adapter was set via setAdapter, honor it
    if (this.activeAdapter.verificationMode === 'MANUAL_REVIEW') {
      return this.activeAdapter.verifyPan(dto);
    }

    // Resolve provider via centralized Provider Gateway Foundation
    const resolution = providerRegistry.getKycProvider({
      forceMode: context?.forceMode,
      tenantId: context?.tenantId,
    });

    const { provider, mode, isSandbox } = resolution;

    // Execute provider verification (real provider errors will strictly propagate without sandbox fallback)
    const panResult = await provider.verifyPan(
      {
        panNumber: cleanPan,
        fullName: cleanName,
      },
      correlationId
    );

    const isNameMatched = panResult.nameMatchScore >= 60;
    const isSuccess = panResult.status === 'VERIFIED' && panResult.isPanValid && isNameMatched;

    const response: PanVerifyResponse = {
      success: isSuccess,
      isPanValid: panResult.isPanValid,
      panNumber: cleanPan,
      nameOnCard: panResult.nameOnCard || cleanName.toUpperCase(),
      nameMatchScore: panResult.nameMatchScore,
      isOperative: panResult.isOperative,
      category: panResult.category || (cleanPan[3] === 'C' ? 'COMPANY' : 'INDIVIDUAL'),
      status: isSuccess ? 'VERIFIED' : 'FAILED',
      message: isSuccess
        ? (isSandbox ? `[Sandbox] PAN ${cleanPan} validated in development simulation environment.` : `PAN ${cleanPan} successfully verified against authoritative provider.`)
        : (!isNameMatched ? `PAN ${cleanPan} is valid but name '${cleanName}' does not match registered record '${panResult.nameOnCard}' (match score: ${panResult.nameMatchScore}%).` : `PAN verification failed or invalid record.`),
      providerReference: panResult.providerReference,
      verifiedAt: panResult.verifiedAt || new Date().toISOString(),
      providerMetadata: {
        providerName: provider.name,
        isSandbox,
        verificationMode: isSandbox ? 'SANDBOX_SIMULATION' : 'REAL_PROVIDER',
        disclaimer: isSandbox
          ? 'Sandbox simulated verification for development/testing — not an official government or regulatory verification.'
          : 'Authoritative PAN verification via configured provider gateway.',
      },
    };

    // Audit trail (never stores raw PAN)
    await logAudit({
      userId: context?.userId,
      tenantId: context?.tenantId,
      role: context?.role,
      ipAddress: context?.ipAddress,
      action: 'KYC_PAN_VERIFICATION',
      entity: 'CUSTOMER_IDENTIFIER',
      entityId: context?.customerId || dto.customerId,
      correlationId,
      newValue: {
        panMasked: PiiMasker.maskPan(cleanPan),
        status: response.status,
        isPanValid: response.isPanValid,
        nameMatchScore: response.nameMatchScore,
        mode,
        isSandbox,
        providerReference: response.providerReference,
      },
    });

    // DB Persistence for customer identifier if customerId provided
    const targetCustomerId = context?.customerId || dto.customerId;
    if (targetCustomerId && isSuccess) {
      try {
        const existingIdentifier = await prisma.customerIdentifier.findFirst({
          where: { customerId: targetCustomerId, idType: 'PAN' },
        });

        if (existingIdentifier) {
          await prisma.customerIdentifier.update({
            where: { id: existingIdentifier.id },
            data: {
              maskedValue: PiiMasker.maskPan(cleanPan),
              verificationStatus: 'VERIFIED',
              verifiedAt: new Date(),
              verifiedBy: response.providerReference,
            },
          });
        } else {
          await prisma.customerIdentifier.create({
            data: {
              customerId: targetCustomerId,
              idType: 'PAN',
              maskedValue: PiiMasker.maskPan(cleanPan),
              verificationStatus: 'VERIFIED',
              verifiedAt: new Date(),
              verifiedBy: response.providerReference,
            },
          });
        }
      } catch (err) {
        logger.warn({ msg: 'CustomerIdentifier persistence skipped or failed', err });
      }
    }

    return response;
  }

  /**
   * Authoritative Aadhaar / DigiLocker Identity Verification Flow
   */
  public async verifyAadhaar(dto: AadhaarVerifyDto, context?: AadhaarVerifyContext): Promise<AadhaarVerifyResponse> {
    const raw = dto.aadhaarNumber?.replace(/\D/g, '') || '';
    if (raw.length !== 12) {
      throw new BadRequestError('Aadhaar number must be exactly 12 numeric digits.');
    }

    const cleanName = dto.fullName?.trim();
    if (!cleanName || cleanName.length < 2) {
      throw new BadRequestError('Borrower legal full name is required before Aadhaar identity verification can be performed.');
    }

    const last4 = raw.slice(-4);
    const maskedAadhaar = PiiMasker.maskAadhaar(raw);

    // IDOR Protection: Validate tenant boundaries if context tenantId is provided
    if (context?.tenantId) {
      const targetCustId = dto.customerId || context.customerId;
      if (targetCustId) {
        const customerRecord = await prisma.customer.findUnique({
          where: { id: targetCustId },
          select: { id: true, tenantId: true },
        });
        if (customerRecord && customerRecord.tenantId !== context.tenantId) {
          throw new ForbiddenError('Access denied: Customer does not belong to your organization.');
        }
      }
    }

    const correlationId = `ADH-VRF-${Date.now().toString(36).toUpperCase()}`;

    // If an explicit manual review adapter was set via setAdapter, honor it
    if (this.activeAdapter.verificationMode === 'MANUAL_REVIEW') {
      return this.activeAdapter.verifyAadhaar(dto);
    }

    // Resolve provider via centralized Provider Gateway Foundation
    const resolution = providerRegistry.getKycProvider({
      forceMode: context?.forceMode,
      tenantId: context?.tenantId,
    });

    const { provider, mode, isSandbox } = resolution;

    // Execute provider verification (real provider errors will strictly propagate without sandbox fallback)
    const aadhaarResult = await provider.verifyAadhaarDigilocker(
      {
        aadhaarNumber: raw,
        fullName: cleanName,
        otp: dto.otp,
        consentId: correlationId,
      },
      correlationId
    );

    // Name matching against submitted borrower name
    const registeredName = (aadhaarResult.name || '').trim().toUpperCase();
    const nameMatchScore = computeNameMatchScore(cleanName, registeredName || cleanName);
    const isNameMatched = nameMatchScore >= 60;
    const isSuccess = aadhaarResult.status === 'VERIFIED' && isNameMatched;

    const response: AadhaarVerifyResponse = {
      success: isSuccess,
      verified: isSuccess,
      aadhaarLast4: aadhaarResult.aadhaarLast4 || last4,
      maskedAadhaar,
      name: aadhaarResult.name || cleanName,
      nameMatchScore,
      gender: aadhaarResult.gender || 'OTHER',
      dateOfBirth: aadhaarResult.dateOfBirth || '1990-01-01',
      address: aadhaarResult.address,
      status: isSuccess ? 'VERIFIED' : 'FAILED',
      message: isSuccess
        ? (isSandbox
            ? `[Sandbox] Aadhaar ending in ${last4} simulated DigiLocker demographic verification succeeded.`
            : `Aadhaar ending in ${last4} verified successfully against UIDAI/DigiLocker via ${provider.name}.`)
        : (!isNameMatched
            ? `Aadhaar is valid but applicant name '${dto.fullName}' does not match registered record '${registeredName}' (match score: ${nameMatchScore}%).`
            : `Aadhaar verification failed or record rejected by provider.`),
      providerReference: aadhaarResult.providerReference,
      verifiedAt: aadhaarResult.verifiedAt || new Date().toISOString(),
      providerMetadata: {
        providerName: provider.name,
        isSandbox,
        verificationMode: isSandbox ? 'SANDBOX_SIMULATION' : 'REAL_PROVIDER',
        disclaimer: isSandbox
          ? 'Sandbox simulated verification for development/testing — not an official government or regulatory verification.'
          : 'Authoritative Aadhaar verification via configured provider gateway.',
      },
    };

    // Audit trail (never stores raw Aadhaar)
    await logAudit({
      userId: context?.userId,
      tenantId: context?.tenantId,
      role: context?.role,
      ipAddress: context?.ipAddress,
      action: 'KYC_AADHAAR_VERIFICATION',
      entity: 'CUSTOMER_IDENTIFIER',
      entityId: context?.customerId || dto.customerId,
      correlationId,
      newValue: {
        aadhaarMasked: maskedAadhaar,
        name: response.name,
        status: response.status,
        nameMatchScore: response.nameMatchScore,
        mode,
        isSandbox,
        providerReference: response.providerReference,
      },
    });

    // DB Persistence for customer identifier if customerId provided
    const targetCustomerId = context?.customerId || dto.customerId;
    if (targetCustomerId && isSuccess) {
      try {
        const existingIdentifier = await prisma.customerIdentifier.findFirst({
          where: { customerId: targetCustomerId, idType: 'AADHAAR' },
        });

        if (existingIdentifier) {
          await prisma.customerIdentifier.update({
            where: { id: existingIdentifier.id },
            data: {
              maskedValue: maskedAadhaar,
              verificationStatus: 'VERIFIED',
              verifiedAt: new Date(),
              verifiedBy: response.providerReference,
            },
          });
        } else {
          await prisma.customerIdentifier.create({
            data: {
              customerId: targetCustomerId,
              idType: 'AADHAAR',
              maskedValue: maskedAadhaar,
              verificationStatus: 'VERIFIED',
              verifiedAt: new Date(),
              verifiedBy: response.providerReference,
            },
          });
        }
      } catch (err) {
        logger.warn({ msg: 'CustomerIdentifier Aadhaar persistence skipped or failed', err });
      }
    }

    return response;
  }

  public async lookupIfsc(ifsc: string): Promise<IfscLookupResponse> {
    return this.activeAdapter.lookupIfsc(ifsc);
  }

  /**
   * Authoritative Bank Account Penny-Drop Verification Flow
   */
  public async verifyBankAccount(dto: BankVerifyDto, context?: BankVerifyContext): Promise<BankVerifyResponse> {
    const cleanAcct = dto.accountNumber?.trim().replace(/\D/g, '');
    const cleanIfsc = dto.ifscCode?.trim().toUpperCase();

    if (!cleanAcct || cleanAcct.length < 8 || cleanAcct.length > 20) {
      throw new BadRequestError('Bank account number must be between 8 and 20 digits.');
    }
    if (!cleanIfsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      throw new BadRequestError('Invalid IFSC code format (e.g., SBIN0001234).');
    }

    // IDOR Protection: Validate tenant boundaries if context tenantId is provided
    if (context?.tenantId) {
      const targetCustId = dto.customerId || context.customerId;
      if (targetCustId) {
        const customerRecord = await prisma.customer.findUnique({
          where: { id: targetCustId },
          select: { id: true, tenantId: true },
        });
        if (customerRecord && customerRecord.tenantId !== context.tenantId) {
          throw new ForbiddenError('Access denied: Customer does not belong to your organization.');
        }
      }

      if (dto.bankAccountId) {
        const bankRecord = await prisma.customerBankAccount.findUnique({
          where: { id: dto.bankAccountId },
          include: { customer: { select: { tenantId: true } } },
        });
        if (bankRecord && bankRecord.customer?.tenantId !== context.tenantId) {
          throw new ForbiddenError('Access denied: Bank account does not belong to your organization.');
        }
      }
    }

    const correlationId = `BNK-VRF-${Date.now().toString(36).toUpperCase()}`;

    // If an explicit manual review adapter was set via setAdapter, honor it
    if (this.activeAdapter.verificationMode === 'MANUAL_REVIEW') {
      return this.activeAdapter.verifyBankAccount(dto);
    }

    // Resolve provider via centralized Provider Gateway Foundation
    const resolution = providerRegistry.getBankVerificationProvider({
      forceMode: context?.forceMode,
      tenantId: context?.tenantId,
    });

    const { provider, mode, isSandbox } = resolution;

    // Execute provider verification (real provider errors will strictly propagate without sandbox fallback)
    const bankResult = await provider.verifyBankAccount(
      {
        accountNumber: cleanAcct,
        ifscCode: cleanIfsc,
        beneficiaryName: dto.accountHolderName?.trim() || '',
      },
      correlationId
    );

    const isNameMatched = !dto.accountHolderName || bankResult.nameMatchPercentage >= 60;
    const isSuccess = bankResult.isValid && bankResult.status !== 'INVALID_ACCOUNT' && bankResult.status !== 'FAILED' && isNameMatched;

    const response: BankVerifyResponse = {
      success: isSuccess,
      isAccountValid: bankResult.isValid,
      accountNumber: PiiMasker.maskBankAccount(cleanAcct),
      ifscCode: cleanIfsc,
      bankName: bankResult.bankName || 'Verified Scheduled Commercial Bank',
      branchName: bankResult.branchName || 'Main Branch',
      city: bankResult.city || 'Central',
      state: 'India',
      nameAtBank: bankResult.registeredName || dto.accountHolderName?.trim().toUpperCase() || '',
      nameMatchScore: bankResult.nameMatchPercentage,
      status: isSuccess ? 'VERIFIED' : 'FAILED',
      message: isSuccess
        ? (isSandbox
            ? `[Sandbox] Bank Account ending in ${cleanAcct.slice(-4)} simulated penny-drop validated. Beneficiary: ${bankResult.registeredName || dto.accountHolderName}.`
            : `Bank Account ending in ${cleanAcct.slice(-4)} penny-drop verified successfully via ${provider.name}. Beneficiary: ${bankResult.registeredName}.`)
        : (!isNameMatched
            ? `Bank Account is valid but beneficiary name '${dto.accountHolderName}' does not match bank record '${bankResult.registeredName}' (match score: ${bankResult.nameMatchPercentage}%).`
            : `Bank Account verification failed or invalid account.`),
      referenceId: bankResult.utrOrReference,
      verifiedAt: bankResult.verifiedAt || new Date().toISOString(),
      providerMetadata: {
        providerName: provider.name,
        isSandbox,
        verificationMode: isSandbox ? 'SANDBOX_SIMULATION' : 'REAL_PROVIDER',
        disclaimer: isSandbox
          ? 'Sandbox simulated verification for development/testing — not an official government or regulatory verification.'
          : 'Authoritative Bank Account verification via configured provider gateway.',
      },
    };

    // Audit trail (never stores raw account number)
    await logAudit({
      userId: context?.userId,
      tenantId: context?.tenantId,
      role: context?.role,
      ipAddress: context?.ipAddress,
      action: 'KYC_BANK_VERIFICATION',
      entity: 'CUSTOMER_BANK_ACCOUNT',
      entityId: dto.bankAccountId || dto.customerId || context?.customerId,
      correlationId,
      newValue: {
        accountNumberMasked: response.accountNumber,
        ifscCode: cleanIfsc,
        bankName: response.bankName,
        status: response.status,
        isAccountValid: response.isAccountValid,
        nameMatchScore: response.nameMatchScore,
        mode,
        isSandbox,
        referenceId: response.referenceId,
      },
    });

    // DB Persistence for customer bank account
    if (dto.bankAccountId) {
      try {
        await prisma.customerBankAccount.update({
          where: { id: dto.bankAccountId },
          data: {
            isVerified: isSuccess,
          },
        });
      } catch (err) {
        logger.warn({ msg: 'CustomerBankAccount update by id skipped or failed', err });
      }
    } else if (dto.customerId || context?.customerId) {
      const targetCustId = dto.customerId || context?.customerId;
      try {
        const matchingBank = await prisma.customerBankAccount.findFirst({
          where: { customerId: targetCustId, ifscCode: cleanIfsc },
        });
        if (matchingBank) {
          await prisma.customerBankAccount.update({
            where: { id: matchingBank.id },
            data: {
              isVerified: isSuccess,
            },
          });
        }
      } catch (err) {
        logger.warn({ msg: 'CustomerBankAccount update by customerId skipped or failed', err });
      }
    }

    return response;
  }
}

export const kycService = new KycService();

