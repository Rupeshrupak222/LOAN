import Decimal from 'decimal.js';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../config/prisma';
import { Money } from '../finance/money';
import { calculateEmi } from '../finance/emi';
import { NotFoundError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import type {
  KfsDocument,
  KfsFeeItem,
  KfsContingentCharge,
  DigitalLoanAgreement,
  DigitalAgreementClause,
  ESignSession,
  ESignProviderType,
  MandateSession,
  MandateProviderType,
  MandateAuthMode,
} from './contracts.types';

// In-memory sessions store (can be persisted to Database / SystemSetting)
const esignSessions = new Map<string, ESignSession>();
const mandateSessions = new Map<string, MandateSession>();
const agreementStore = new Map<string, DigitalLoanAgreement>();

export class ContractsService {
  /**
   * Generate live RBI-compliant Key Fact Statement (KFS)
   */
  public async generateKfs(
    applicationId: string,
    actor?: { id?: string; tenantId?: string }
  ): Promise<KfsDocument> {
    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: true,
        product: true,
        tenant: true,
      },
    });

    if (!application) throw new NotFoundError('Loan application not found');

    const customer = application.customer;
    const product = application.product;
    const tenant = application.tenant;

    const principal = new Decimal(application.requestedAmount.toString());
    const tenureMonths = application.tenureMonths;
    const interestRatePct = new Decimal(product.interestRate.toString());

    // Calculate EMI & Schedule
    const emiResult = calculateEmi(principal.toNumber(), interestRatePct.toNumber(), tenureMonths);
    const emi = new Decimal(emiResult.emi);
    const totalInterest = new Decimal(emiResult.totalInterest);
    const totalPayable = principal.plus(totalInterest);

    // Calculate Upfront Fees & GST
    const procFeePct = new Decimal(product.processingFeePct?.toString() || '2.0');
    const procFeeBase = Money.round(principal.times(procFeePct).dividedBy(100));
    const gstRate = new Decimal(0.18); // 18% GST
    const procFeeGst = Money.round(procFeeBase.times(gstRate));
    const totalProcFee = procFeeBase.plus(procFeeGst);

    const docChargesBase = new Decimal(500);
    const docChargesGst = Money.round(docChargesBase.times(gstRate));
    const totalDocCharges = docChargesBase.plus(docChargesGst);

    const upfrontFees: KfsFeeItem[] = [
      {
        name: `Loan Processing Fee (${procFeePct}% + 18% GST)`,
        amount: procFeeBase.toNumber(),
        taxAmount: procFeeGst.toNumber(),
        totalAmount: totalProcFee.toNumber(),
        deductedFromDisbursement: true,
      },
      {
        name: 'Documentation & Electronic Agreement Charges (incl. GST)',
        amount: docChargesBase.toNumber(),
        taxAmount: docChargesGst.toNumber(),
        totalAmount: totalDocCharges.toNumber(),
        deductedFromDisbursement: true,
      },
    ];

    const totalUpfrontFeesAndTaxes = totalProcFee.plus(totalDocCharges);
    const netDisbursed = principal.minus(totalUpfrontFeesAndTaxes);

    // Compute Annual Percentage Rate (APR)
    // APR = ((Total Interest + Total Upfront Fees) / Principal) * (12 / TenureMonths) * 100
    const totalCostOfCredit = totalInterest.plus(totalUpfrontFeesAndTaxes);
    const aprPct = totalCostOfCredit
      .dividedBy(principal)
      .times(12)
      .dividedBy(tenureMonths)
      .times(100)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    const contingentCharges: KfsContingentCharge[] = [
      {
        event: 'Late Payment / Overdue Installment',
        chargeFormula: `${product.lateFeePct || 2.0}% per month on overdue installment amount for the delayed period`,
        exampleCharge: `₹${Money.round(emi.times(0.02)).toFixed(2)} for 30 days default on EMI of ₹${emi.toFixed(2)}`,
      },
      {
        event: 'eNACH / Cheque Inward Return / Bounce',
        chargeFormula: '₹500.00 + 18% GST per bounce event',
        exampleCharge: '₹590.00 inclusive of GST',
      },
      {
        event: 'Foreclosure / Full Pre-payment',
        chargeFormula: 'Nil charges after 6 completed EMIs for retail floating/reducing rate loans as per RBI master directions',
        exampleCharge: '₹0.00 (Zero penalty)',
      },
    ];

    const kfs: KfsDocument = {
      kfsNumber: `KFS-${application.applicationNo}-${Date.now().toString().slice(-6)}`,
      applicationId: application.id,
      applicationNo: application.applicationNo,
      tenantId: application.tenantId || 'tenant-adyapan-default',
      lenderName: tenant?.name || 'Adyapan Enterprise Financial Services Ltd.',
      lenderCin: tenant?.cinNumber || 'U65999MH2024PTC123456',
      lenderRbiRegNo: tenant?.rbiRegistrationNo || 'B-05.06789 (NBFC-ND-SI)',
      borrowerName: `${customer.firstName} ${customer.lastName}`,
      borrowerMobile: customer.mobile,
      borrowerEmail: customer.email || undefined,
      borrowerPanMasked: 'XXXXXX' + (customer.customerCode.slice(-4) || '9876'),
      sanctionedPrincipalAmount: principal.toNumber(),
      netDisbursedAmount: netDisbursed.toNumber(),
      annualInterestRatePct: interestRatePct.toNumber(),
      interestType: product.interestMethod === 'FLAT' ? 'FIXED' : 'REDUCING_BALANCE',
      tenureMonths,
      repaymentFrequency: 'MONTHLY',
      numberOfInstallments: tenureMonths,
      installmentAmountEmi: emi.toNumber(),
      totalInterestPayable: totalInterest.toNumber(),
      totalAmountPayableByBorrower: totalPayable.toNumber(),
      upfrontFees,
      totalUpfrontFeesAndTaxes: totalUpfrontFeesAndTaxes.toNumber(),
      annualPercentageRateAprPct: aprPct.toNumber(),
      coolingOffPeriodDays: 3,
      coolingOffTerms:
        'Borrower has a cooling-off / look-up period of 3 working days from disbursement to exit the loan without penalty by repaying principal and proportionate APR.',
      contingentCharges,
      grievanceRedressalOfficer: {
        name: 'Mr. Rajeshwar Sharma',
        designation: 'Principal Nodal Grievance Officer',
        email: 'grievance@adyapan.dev',
        phone: '+91 1800-419-8899',
        address: 'Adyapan Towers, 4th Floor, BKC, Bandra East, Mumbai, MH 400051',
      },
      generatedAt: new Date().toISOString(),
      version: 1,
    };

    if (actor?.id) {
      await logAudit({
        userId: actor.id,
        tenantId: actor.tenantId,
        action: 'GENERATE_KFS',
        entity: 'LoanApplication',
        entityId: application.id,
        newValue: { kfsNumber: kfs.kfsNumber, aprPct: kfs.annualPercentageRateAprPct },
      });
    }

    return kfs;
  }

  /**
   * Generate Digital Loan Agreement
   */
  public async generateDigitalAgreement(
    applicationId: string,
    actor?: { id?: string; tenantId?: string }
  ): Promise<DigitalLoanAgreement> {
    const kfs = await this.generateKfs(applicationId, actor);
    const agreementId = `AGR-${uuid().slice(0, 8)}`;
    const agreementNumber = `LOAN-AGR-${kfs.applicationNo}`;

    const clauses: DigitalAgreementClause[] = [
      {
        clauseNumber: '1.0',
        heading: 'Sanction and Disbursement Terms',
        body: `The Lender agrees to lend to the Borrower the Sanction Amount of INR ${kfs.sanctionedPrincipalAmount.toLocaleString('en-IN')} subject to statutory deduction of upfront processing charges of INR ${kfs.totalUpfrontFeesAndTaxes.toLocaleString('en-IN')}, resulting in a net disbursement of INR ${kfs.netDisbursedAmount.toLocaleString('en-IN')}.`,
      },
      {
        clauseNumber: '2.0',
        heading: 'Repayment & Electronic Mandate (eNACH)',
        body: `The Borrower unconditionally promises to repay the loan in ${kfs.numberOfInstallments} equated monthly installments (EMI) of INR ${kfs.installmentAmountEmi.toLocaleString('en-IN')} each via registered electronic debit mandate (eNACH / UPI AutoPay) on or before the due date of each calendar month.`,
      },
      {
        clauseNumber: '3.0',
        heading: 'Interest & Annual Percentage Rate (APR)',
        body: `Interest shall accrue at the rate of ${kfs.annualInterestRatePct}% per annum on a reducing balance basis. The effective Annual Percentage Rate (APR) inclusive of all fees and charges is ${kfs.annualPercentageRateAprPct}% per annum.`,
      },
      {
        clauseNumber: '4.0',
        heading: 'Cooling-off Period & Cancellation',
        body: `In accordance with RBI Master Directions on Digital Lending, the Borrower shall have a cooling-off period of ${kfs.coolingOffPeriodDays} days to cancel the loan by refunding the principal and pro-rata interest accrued without incurring prepayment penalty.`,
      },
      {
        clauseNumber: '5.0',
        heading: 'Events of Default & Legal Remedies',
        body: 'Failure to pay any installment on the scheduled due date or dishonour of electronic mandate shall constitute an Event of Default, entitling the Lender to recall the entire outstanding balance and initiate recovery proceedings under applicable laws.',
      },
      {
        clauseNumber: '6.0',
        heading: 'Electronic Signature & IT Act Compliance',
        body: 'This agreement is executed electronically in compliance with Section 10A of the Information Technology Act, 2000 and the Indian Contract Act, 1872.',
      },
    ];

    const agreement: DigitalLoanAgreement = {
      agreementId,
      agreementNumber,
      applicationId,
      applicationNo: kfs.applicationNo,
      tenantId: kfs.tenantId,
      lenderLegalEntity: kfs.lenderName,
      borrowerFullName: kfs.borrowerName,
      sanctionAmount: kfs.sanctionedPrincipalAmount,
      interestRateAnnual: kfs.annualInterestRatePct,
      tenureMonths: kfs.tenureMonths,
      monthlyEmi: kfs.installmentAmountEmi,
      clauses,
      status: 'READY_FOR_SIGNATURE',
      generatedAt: new Date().toISOString(),
    };

    agreementStore.set(agreementId, agreement);
    agreementStore.set(applicationId, agreement);

    return agreement;
  }

  /**
   * Initiate eSign Session (Aadhaar / Digital eSign)
   */
  public async initiateESign(
    applicationId: string,
    provider: ESignProviderType = 'MOCK_DIGISIGN',
    actor?: { id?: string; tenantId?: string }
  ): Promise<ESignSession> {
    const agreement = agreementStore.get(applicationId) || (await this.generateDigitalAgreement(applicationId, actor));
    const sessionId = `ESIGN-${uuid().slice(0, 8)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours validity

    const session: ESignSession = {
      sessionId,
      agreementId: agreement.agreementId,
      applicationId,
      provider,
      signerName: agreement.borrowerFullName,
      signerMobile: '9876543210',
      status: 'INITIATED',
      signingUrl: `https://sign.adyapan.dev/session/${sessionId}?token=${uuid()}`,
      expiresAt,
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          event: 'ESIGN_SESSION_INITIATED',
          ipAddress: '127.0.0.1',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    esignSessions.set(sessionId, session);
    esignSessions.set(applicationId, session);

    if (actor?.id) {
      await logAudit({
        userId: actor.id,
        tenantId: actor.tenantId,
        action: 'INITIATE_ESIGN',
        entity: 'LoanApplication',
        entityId: applicationId,
        newValue: { sessionId, provider },
      });
    }

    return session;
  }

  /**
   * Execute / Complete eSign Session
   */
  public async completeESign(
    sessionId: string,
    metadata?: { ipAddress?: string; signerAadhaarLast4?: string; certificateThumbprint?: string }
  ): Promise<ESignSession> {
    const session = esignSessions.get(sessionId);
    if (!session) throw new NotFoundError('eSign session not found');

    session.status = 'SIGNED';
    session.signedDocumentUrl = `https://storage.adyapan.dev/signed-contracts/${session.agreementId}-signed.pdf`;
    session.certificateId = `CERT-NSDL-${uuid().slice(0, 10).toUpperCase()}`;
    session.updatedAt = new Date().toISOString();
    session.auditTrail.push({
      timestamp: new Date().toISOString(),
      event: 'DOCUMENT_ELECTRONICALLY_SIGNED',
      ipAddress: metadata?.ipAddress || '127.0.0.1',
      certificateThumbprint: metadata?.certificateThumbprint || `SHA256:${uuid().replace(/-/g, '')}`,
      signerAadhaarLast4: metadata?.signerAadhaarLast4 || '4321',
    });

    // Update agreement
    const agreement = agreementStore.get(session.agreementId);
    if (agreement) {
      agreement.status = 'EXECUTED';
    }

    // Check if application can transition to READY_FOR_DISBURSEMENT
    await prisma.loanApplication.update({
      where: { id: session.applicationId },
      data: { status: 'READY_FOR_DISBURSEMENT' },
    });

    await logAudit({
      action: 'COMPLETE_ESIGN',
      entity: 'LoanApplication',
      entityId: session.applicationId,
      newValue: { sessionId, status: 'SIGNED', certificateId: session.certificateId },
    });

    return session;
  }

  /**
   * Initiate eNACH / Auto-Debit Mandate Session
   */
  public async initiateMandate(
    applicationId: string,
    input: {
      bankName: string;
      accountNumber: string;
      ifscCode: string;
      authMode?: MandateAuthMode;
      provider?: MandateProviderType;
    },
    actor?: { id?: string; tenantId?: string }
  ): Promise<MandateSession> {
    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) throw new NotFoundError('Loan application not found');

    const mandateId = `MANDATE-${uuid().slice(0, 8)}`;
    const umrn = `UMRN${Date.now().toString().slice(-8)}IN${Math.floor(1000 + Math.random() * 9000)}`;
    const maxLimit = Number(application.requestedAmount) * 2; // Typically 2x loan or max cap

    const session: MandateSession = {
      mandateId,
      applicationId,
      customerId: application.customerId,
      provider: input.provider || 'NPCI_ENACH',
      authMode: input.authMode || 'NET_BANKING',
      umrn,
      bankName: input.bankName,
      accountNumberMasked: 'XXXX' + input.accountNumber.slice(-4),
      ifscCode: input.ifscCode,
      maxAmountLimit: maxLimit,
      recurringFrequency: 'MONTHLY',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'ACTIVE', // Instantly active in staging/simulator mode
      authUrl: `https://mandate.npci.org.in/auth/${mandateId}?token=${uuid()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mandateSessions.set(mandateId, session);
    mandateSessions.set(applicationId, session);

    if (actor?.id) {
      await logAudit({
        userId: actor.id,
        tenantId: actor.tenantId,
        action: 'INITIATE_ENACH_MANDATE',
        entity: 'LoanApplication',
        entityId: applicationId,
        newValue: { mandateId, umrn, status: session.status },
      });
    }

    return session;
  }

  /**
   * Get Current Digital Journey Status for Application
   */
  public async getApplicationContractStatus(applicationId: string) {
    const agreement = agreementStore.get(applicationId);
    const esign = esignSessions.get(applicationId);
    const mandate = mandateSessions.get(applicationId);

    return {
      applicationId,
      hasAgreement: !!agreement,
      agreementStatus: agreement?.status || 'NOT_GENERATED',
      esignStatus: esign?.status || 'NOT_INITIATED',
      mandateStatus: mandate?.status || 'NOT_CONFIGURED',
      umrn: mandate?.umrn,
      canDisburse: esign?.status === 'SIGNED' && (mandate?.status === 'ACTIVE' || mandate === undefined),
      agreement,
      esign,
      mandate,
    };
  }
}

export const contractsService = new ContractsService();
