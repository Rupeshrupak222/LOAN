/**
 * Adyapan Lending OS — Phase P7: Partner & Co-Lending Fortification Service
 * Authoritative Partner-Safe Projection Layer, Zero-Trust Scoping, Decimal.js Commissions & SoD Controls
 */

import Decimal from 'decimal.js';
import crypto from 'crypto';
import { ForbiddenError, BadRequestError, NotFoundError } from '../../common/errors';
import { PartnerContext, PartnerScope, WebhookEventType } from './partner.types';
import { financialControlService } from '../finance/financial-control.service';
import { logAudit } from '../audit/audit.service';

// -----------------------------------------------------------------------------
// 1. PII MASKING UTILITIES
// -----------------------------------------------------------------------------

export function maskPan(pan?: string): string {
  if (!pan || pan.length < 5) return 'XXXXX0000X';
  const clean = pan.trim().toUpperCase();
  return `${clean.slice(0, 2)}XXXXXX${clean.slice(-2)}`;
}

export function maskAadhaar(aadhaar?: string): string {
  if (!aadhaar) return 'XXXXXXXX0000';
  const clean = aadhaar.replace(/\D/g, '');
  return `XXXXXXXX${clean.slice(-4) || '0000'}`;
}

export function maskPhone(phone?: string): string {
  if (!phone) return '******0000';
  const clean = phone.replace(/\D/g, '');
  return `******${clean.slice(-4) || '0000'}`;
}

export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return 'u***@partner.in';
  const [local, domain] = email.split('@');
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visible}***@${domain}`;
}

export function maskBankAccount(accountNo?: string): string {
  if (!accountNo) return '********0000';
  const clean = accountNo.replace(/\s/g, '');
  return `********${clean.slice(-4) || '0000'}`;
}

// -----------------------------------------------------------------------------
// 2. PARTNER-SAFE DATA PROJECTION DTOs
// -----------------------------------------------------------------------------

export type PartnerSafeStatus =
  | 'APPLICATION_RECEIVED'
  | 'VERIFICATION_IN_PROGRESS'
  | 'DOCUMENTS_REQUIRED'
  | 'APPLICATION_UNDER_REVIEW'
  | 'ADDITIONAL_INFO_REQUIRED'
  | 'APPROVED'
  | 'OFFER_AVAILABLE'
  | 'OFFER_ACCEPTED'
  | 'AGREEMENT_PENDING'
  | 'DISBURSEMENT_PROCESSING'
  | 'DISBURSED'
  | 'REPAYMENT_ACTIVE'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface PartnerSafeApplicationDto {
  partnerApplicationId: string;
  adyapanApplicationId: string;
  partnerId: string;
  productId: string;
  productName?: string;
  channel: string;
  partnerSafeStatus: PartnerSafeStatus;
  currentStage: string;
  completedStages: string[];
  pendingStage?: string;
  nextAllowedAction: string;
  requestedAmount: number;
  requestedTenureMonths: number;
  applicant: {
    name: string;
    maskedPhone: string;
    maskedEmail: string;
    maskedPan: string;
    employmentType?: string;
  };
  offer?: PartnerSafeOfferDto;
  disbursementStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerSafeCustomerDto {
  partnerCustomerId: string;
  adyapanCustomerId: string;
  partnerId: string;
  fullName: string;
  maskedPhone: string;
  maskedEmail: string;
  maskedPan: string;
  maskedAadhaar: string;
  maskedBankAccount: string;
  bankName: string;
  employmentType: string;
  kycSafeStatus: 'VERIFIED' | 'PENDING' | 'DOCUMENTS_REQUIRED';
  createdAt: string;
}

export interface PartnerSafeOfferDto {
  offerId: string;
  offerNo: string;
  partnerApplicationId: string;
  productName: string;
  offeredAmount: number;
  tenureMonths: number;
  annualInterestRatePct: number;
  monthlyEmi: number;
  processingFee: number;
  feeGst: number;
  totalDeductions: number;
  netDisbursedAmount: number;
  totalInterest: number;
  totalRepayment: number;
  annualPercentageRateApr: number;
  repaymentFrequency: string;
  status: 'OFFERED' | 'ACCEPTED' | 'EXPIRED' | 'REJECTED';
  kfsSnapshot: {
    coolingOffPeriodDays: number;
    apr: number;
    statutoryNotice: string;
  };
}

export interface PartnerSafeDocumentDto {
  id: string;
  partnerApplicationId: string;
  category: string;
  documentType: string;
  fileName: string;
  status: 'REQUIRED' | 'UPLOADED' | 'ACCEPTED' | 'REJECTED';
  rejectionReasonSafe?: string;
  uploadedAt?: string;
}

export interface PartnerSafeCommissionDto {
  id: string;
  partnerId: string;
  partnerCode: string;
  applicationId?: string;
  loanNo?: string;
  disbursedAmount: number;
  commissionType: 'SOURCING_FEE' | 'DISBURSEMENT_COMMISSION' | 'CLAWBACK';
  ratePct: number;
  calculatedAmount: number;
  taxAmount: number;
  netPayableAmount: number;
  status: 'ELIGIBLE' | 'CALCULATED' | 'PENDING' | 'APPROVED' | 'PAYABLE' | 'PAID' | 'REVERSED';
  payoutBatchId?: string;
  createdAt: string;
  paidAt?: string;
}

export interface CoLendingAllocationDto {
  coLendingModel: 'CLM_1_JOINT_SANCTION' | 'CLM_2_DIRECT_ASSIGNMENT';
  lenderName: string;
  lenderSharePct: number; // e.g. 80%
  partnerSharePct: number; // e.g. 20%
  sanctionedAmount: number;
  lenderSanctionedShare: number;
  partnerSanctionedShare: number;
  lenderDisbursedShare: number;
  partnerDisbursedShare: number;
  repaymentRatioNotice: string;
}

// -----------------------------------------------------------------------------
// 3. PROJECTION SANITIZATION FUNCTIONS
// -----------------------------------------------------------------------------

export class PartnerFortificationService {
  private static instance: PartnerFortificationService;

  public static getInstance(): PartnerFortificationService {
    if (!PartnerFortificationService.instance) {
      PartnerFortificationService.instance = new PartnerFortificationService();
    }
    return PartnerFortificationService.instance;
  }

  /**
   * Translates internal raw status into a clean, normalized partner-safe status.
   */
  public mapToPartnerSafeStatus(rawStatus: string, currentStage?: string): PartnerSafeStatus {
    const s = (rawStatus || '').toUpperCase();
    const st = (currentStage || '').toUpperCase();

    if (s === 'REJECTED' || s === 'DECLINED') return 'REJECTED';
    if (s === 'CANCELLED' || s === 'WITHDRAWN') return 'CANCELLED';
    if (s === 'DISBURSED' || s === 'ACTIVE') return 'DISBURSED';
    if (s === 'DISBURSEMENT_PROCESSING' || s === 'PAYOUT_INITIATED') return 'DISBURSEMENT_PROCESSING';
    if (s === 'OFFER_ACCEPTED' || st === 'AGREEMENT_AND_ESIGN') return 'AGREEMENT_PENDING';
    if (s === 'APPROVED' || s === 'SANCTIONED' || st === 'OFFER_REVIEW') return 'OFFER_AVAILABLE';
    if (st === 'DECISION' || s === 'UNDER_REVIEW' || s === 'SUBMITTED') return 'APPLICATION_UNDER_REVIEW';
    if (st === 'KYC_AND_DOCUMENTS' || s === 'DOCUMENTS_PENDING') return 'DOCUMENTS_REQUIRED';
    if (st === 'INTAKE' || s === 'DRAFT') return 'APPLICATION_RECEIVED';

    return 'APPLICATION_UNDER_REVIEW';
  }

  /**
   * Sanitizes application entity for partner view.
   * GUARANTEE: Never exposes internal BRE rule IDs, internal credit/fraud scores,
   * maker-checker IDs, underwriter comments, GL accounts, or raw bureau reports.
   */
  public sanitizeApplicationForPartner(
    rawApp: any,
    partnerContext: PartnerContext,
    customerData?: any
  ): PartnerSafeApplicationDto {
    // 1. Verify Partner Ownership
    if (rawApp.partnerId && rawApp.partnerId !== partnerContext.partnerId) {
      throw new ForbiddenError('[IDOR_BLOCKED] Access forbidden: Application belongs to another partner organization.');
    }

    const partnerSafeStatus = this.mapToPartnerSafeStatus(rawApp.status, rawApp.currentStage);

    // 2. Next allowed partner action resolution
    let nextAllowedAction = 'WAIT_FOR_REVIEW';
    if (rawApp.status === 'DRAFT' || partnerSafeStatus === 'APPLICATION_RECEIVED') {
      nextAllowedAction = 'SUBMIT_APPLICATION';
    } else if (partnerSafeStatus === 'DOCUMENTS_REQUIRED') {
      nextAllowedAction = 'UPLOAD_REQUIRED_DOCUMENTS';
    } else if (partnerSafeStatus === 'OFFER_AVAILABLE') {
      nextAllowedAction = 'REVIEW_AND_ACCEPT_OFFER';
    } else if (partnerSafeStatus === 'AGREEMENT_PENDING') {
      nextAllowedAction = 'ASSIST_BORROWER_ESIGN';
    } else if (partnerSafeStatus === 'DISBURSED') {
      nextAllowedAction = 'TRACK_LOAN_SERVICING';
    } else if (partnerSafeStatus === 'REJECTED' || partnerSafeStatus === 'CANCELLED') {
      nextAllowedAction = 'NONE_FINAL_STATE';
    }

    // 3. Format Masked Applicant
    const applicantName = customerData
      ? `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim() || 'Valued Customer'
      : rawApp.customerName || 'Valued Customer';

    const maskedPhone = maskPhone(customerData?.mobile || rawApp.customerPhone || '9876543210');
    const maskedEmail = maskEmail(customerData?.email || rawApp.customerEmail || 'applicant@partner.in');
    const maskedPan = maskPan(customerData?.pan || rawApp.pan || 'ABCDE1234F');

    return {
      partnerApplicationId: rawApp.partnerApplicationId || rawApp.id,
      adyapanApplicationId: rawApp.adyapanApplicationId || rawApp.id,
      partnerId: partnerContext.partnerId,
      productId: rawApp.productId,
      productName: rawApp.productName || 'Prime Salaried Personal Loan',
      channel: rawApp.channel || 'API_EMBEDDED',
      partnerSafeStatus,
      currentStage: rawApp.currentStage || 'INTAKE',
      completedStages: rawApp.completedStages || [],
      pendingStage: rawApp.pendingStage,
      nextAllowedAction,
      requestedAmount: Number(rawApp.requestedAmount || 0),
      requestedTenureMonths: Number(rawApp.requestedTenureMonths || rawApp.tenureMonths || 12),
      applicant: {
        name: applicantName,
        maskedPhone,
        maskedEmail,
        maskedPan,
        employmentType: customerData?.employmentType || 'SALARIED',
      },
      createdAt: rawApp.createdAt || new Date().toISOString(),
      updatedAt: rawApp.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Sanitizes customer record for partner view with strict PII masking.
   */
  public sanitizeCustomerForPartner(
    rawCustomer: any,
    partnerContext: PartnerContext,
    partnerCustomerId?: string
  ): PartnerSafeCustomerDto {
    return {
      partnerCustomerId: partnerCustomerId || `PART_CUST_${rawCustomer.id.slice(-6)}`,
      adyapanCustomerId: rawCustomer.id,
      partnerId: partnerContext.partnerId,
      fullName: `${rawCustomer.firstName || ''} ${rawCustomer.lastName || ''}`.trim() || 'Valued Borrower',
      maskedPhone: maskPhone(rawCustomer.mobile),
      maskedEmail: maskEmail(rawCustomer.email),
      maskedPan: maskPan(rawCustomer.pan),
      maskedAadhaar: maskAadhaar(rawCustomer.aadhaarLast4 || '1234'),
      maskedBankAccount: maskBankAccount(rawCustomer.bankAccountNo || '1122334455'),
      bankName: rawCustomer.bankName || 'Partner Settlement Bank',
      employmentType: rawCustomer.employmentType || 'SALARIED',
      kycSafeStatus: rawCustomer.kycStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
      createdAt: rawCustomer.createdAt ? new Date(rawCustomer.createdAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Sanitizes approved offer and Key Fact Statement for partner viewing.
   */
  public sanitizeOfferForPartner(offer: any, partnerApplicationId: string): PartnerSafeOfferDto {
    const offeredAmount = new Decimal(offer.offeredAmount || offer.amount || 100000);
    const deductions = new Decimal(offer.totalFeesAndTaxes || offer.totalDeductions || 2360);
    const netDisbursed = offeredAmount.minus(deductions);

    return {
      offerId: offer.id || `off-${partnerApplicationId}`,
      offerNo: offer.offerNo || `OFF-${Date.now().toString().slice(-6)}`,
      partnerApplicationId,
      productName: offer.productName || 'Prime Personal Loan',
      offeredAmount: offeredAmount.toNumber(),
      tenureMonths: Number(offer.tenureMonths || 12),
      annualInterestRatePct: Number(offer.annualInterestRatePct || 14.5),
      monthlyEmi: Number(offer.monthlyEmi || 9000),
      processingFee: Number(offer.processingFee || 2000),
      feeGst: Number(offer.feeGst || offer.processingFeeGst || 360),
      totalDeductions: deductions.toNumber(),
      netDisbursedAmount: netDisbursed.toNumber(),
      totalInterest: Number(offer.totalInterest || 8000),
      totalRepayment: Number(offer.totalRepayment || offeredAmount.plus(8000).toNumber()),
      annualPercentageRateApr: Number(offer.annualPercentageRateApr || 15.82),
      repaymentFrequency: 'MONTHLY',
      status: offer.status === 'ACCEPTED' ? 'ACCEPTED' : 'OFFERED',
      kfsSnapshot: {
        coolingOffPeriodDays: 3,
        apr: Number(offer.annualPercentageRateApr || 15.82),
        statutoryNotice: 'RBI Digital Lending Direction 2022 compliant. Key Fact Statement (KFS) provided prior to contract execution.',
      },
    };
  }

  /**
   * Calculates partner commission using Decimal.js to prevent floating-point inaccuracies.
   * Lifecycle: ELIGIBLE -> CALCULATED -> PENDING -> APPROVED -> PAYABLE -> PAID.
   */
  public calculateCommissionWithDecimal(
    disbursedAmount: number,
    sourcingFeePct: number = 0.5,
    disbursementCommissionPct: number = 1.0,
    flatFee: number = 0,
    gstRatePct: number = 18.0
  ): {
    calculatedAmount: number;
    taxAmount: number;
    netPayableAmount: number;
    effectiveRatePct: number;
  } {
    const principal = new Decimal(disbursedAmount);
    const combinedRatePct = new Decimal(sourcingFeePct).plus(disbursementCommissionPct);
    const rateMultiplier = combinedRatePct.dividedBy(100);

    // Commission = (Principal * combinedRatePct / 100) + flatFee
    const grossCommission = principal.times(rateMultiplier).plus(flatFee).toDecimalPlaces(2);
    // GST = Gross Commission * (gstRatePct / 100)
    const gstAmount = grossCommission.times(new Decimal(gstRatePct).dividedBy(100)).toDecimalPlaces(2);
    // Net Payable = Gross Commission + GST
    const netPayable = grossCommission.plus(gstAmount).toDecimalPlaces(2);

    return {
      calculatedAmount: grossCommission.toNumber(),
      taxAmount: gstAmount.toNumber(),
      netPayableAmount: netPayable.toNumber(),
      effectiveRatePct: combinedRatePct.toNumber(),
    };
  }

  /**
   * Calculates Co-Lending risk and capital sharing ratios (e.g. 80:20 NBFC:Bank structure).
   */
  public calculateCoLendingAllocation(
    sanctionedAmount: number,
    lenderSharePct: number = 80
  ): CoLendingAllocationDto {
    const total = new Decimal(sanctionedAmount);
    const lPct = new Decimal(lenderSharePct);
    const pPct = new Decimal(100).minus(lPct);

    const lenderSanctionedShare = total.times(lPct.dividedBy(100)).toDecimalPlaces(2);
    const partnerSanctionedShare = total.times(pPct.dividedBy(100)).toDecimalPlaces(2);

    return {
      coLendingModel: 'CLM_2_DIRECT_ASSIGNMENT',
      lenderName: 'Apex Banking Partner',
      lenderSharePct: lPct.toNumber(),
      partnerSharePct: pPct.toNumber(),
      sanctionedAmount: total.toNumber(),
      lenderSanctionedShare: lenderSanctionedShare.toNumber(),
      partnerSanctionedShare: partnerSanctionedShare.toNumber(),
      lenderDisbursedShare: lenderSanctionedShare.toNumber(),
      partnerDisbursedShare: partnerSanctionedShare.toNumber(),
      repaymentRatioNotice: `Repayment collections allocated ${lPct}% to institutional lender and ${pPct}% to sourcing partner under RBI CLM framework.`,
    };
  }

  /**
   * Enforces stage-gating rules: Partner users CANNOT trigger operations reserved for internal roles.
   */
  public validatePartnerAllowedStageTransition(
    currentStage: string,
    requestedAction: string
  ): void {
    const prohibitedActions = [
      'MANUALLY_VERIFY_KYC',
      'APPROVE_CREDIT',
      'BYPASS_UNDERWRITING',
      'OVERRIDE_FRAUD_SCORE',
      'SIGN_AGREEMENT_ON_BEHALF_OF_BORROWER',
      'ACTIVATE_MANDATE_WITHOUT_CUSTOMER',
      'EXECUTE_DISBURSEMENT',
      'POST_GL_JOURNAL',
    ];

    if (prohibitedActions.includes(requestedAction.toUpperCase())) {
      throw new ForbiddenError(
        `Action '${requestedAction}' is strictly prohibited for partner users. Reserved for authoritative lender and borrower operations.`
      );
    }

    if (currentStage === 'INTAKE' && requestedAction === 'EXECUTE_DISBURSEMENT') {
      throw new BadRequestError('Workflow violation: Application is in INTAKE stage. Disbursement is locked.');
    }
  }

  /**
   * Bridges partner commission payout to P5 maker-checker dual-control.
   * Ensures partner payouts CANNOT be self-approved or executed directly by partner users.
   */
  public async submitPartnerPayoutForMakerChecker(
    partnerId: string,
    batchId: string,
    totalAmount: number,
    beneficiaryAccount: string,
    actor: { id: string; email: string; roles: string[]; tenantId: string }
  ): Promise<{ taskId: string; status: string }> {
    // 1. Assert actor has finance maker permissions
    if (!actor.roles.includes('SUPER_ADMIN') && !actor.roles.includes('ADMIN') && !actor.roles.includes('FINANCE_OFFICER')) {
      throw new ForbiddenError('Partner payout batch proposals can only be drafted by authorized finance officers.');
    }

    // 2. Submit to P5 Financial Control Maker-Checker Queue
    const task = await financialControlService.createFinancialTask(
      {
        tenantId: actor.tenantId,
        resourceType: 'PARTNER_PAYOUT',
        resourceId: batchId,
        operation: 'PAYOUT',
        amount: totalAmount,
        currency: 'INR',
        beneficiary: {
          accountNumber: beneficiaryAccount,
          ifsc: 'HDFC0001234',
          accountHolderName: `Partner Settlement: ${partnerId}`,
        },
        notes: `Partner commission settlement batch ${batchId}`,
        metadata: { partnerId, batchId },
      },
      actor
    );

    return {
      taskId: task.id,
      status: task.status, // PENDING_CHECKER
    };
  }

  /**
   * Generates verifiable HMAC-SHA256 signature for outbound partner webhooks.
   */
  public signWebhookPayload(payload: Record<string, any>, secret: string): { timestamp: number; signature: string } {
    const timestamp = Math.floor(Date.now() / 1000);
    const signaturePayload = `${timestamp}.${JSON.stringify(payload)}`;
    const hash = crypto.createHmac('sha256', secret).update(signaturePayload).digest('hex');
    return {
      timestamp,
      signature: `t=${timestamp},v1=${hash}`,
    };
  }

  /**
   * Verifies partner webhook cryptographic signature and rejects replay beyond tolerance (300s).
   */
  public verifyWebhookSignature(
    rawBody: string | Record<string, any>,
    signatureHeader: string,
    secret: string,
    toleranceSeconds: number = 300
  ): boolean {
    const parts = signatureHeader.split(',');
    const tPart = parts.find((p) => p.startsWith('t='));
    const v1Part = parts.find((p) => p.startsWith('v1='));

    if (!tPart || !v1Part) return false;

    const timestamp = parseInt(tPart.slice(2), 10);
    const expectedHash = v1Part.slice(3);

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) {
      return false; // Replay attack protection window exceeded
    }

    const payloadString = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    const calculatedHash = crypto.createHmac('sha256', secret).update(`${timestamp}.${payloadString}`).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(calculatedHash));
  }
}

export const partnerFortificationService = PartnerFortificationService.getInstance();
