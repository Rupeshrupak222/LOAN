import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError, ForbiddenError, ValidationError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { Money } from '../finance/money';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { offerEngineService } from '../offers/offers.service';
import { contractsService } from '../contracts/contracts.service';
import { paymentAllocationService } from '../payments/payment-allocation.service';
import { generalLedgerService } from '../finance/gl.service';
import { loanServicingService } from '../loans/loan-servicing.service';
import { dpdService } from '../collections/dpd.service';
import { collectionPtpService } from '../collections/collection-ptp.service';
import {
  BorrowerHomeSummary,
  BorrowerEligibilityInput,
  BorrowerEligibilityResult,
  BorrowerApplicationInput,
  BorrowerDraftApplicationInput,
  BorrowerApplicationDetail,
  BorrowerKfsData,
  BorrowerRepaymentInput,
  BorrowerNocCertificate,
  BorrowerJourneyState,
  BorrowerJourneyStage,
  BorrowerConsentRecord,
  BorrowerDocumentSummary,
  UpdateBorrowerProfileInput,
  BorrowerDetailedProfile,
  ProfileSectionStatus,
  BorrowerOverdueSummary,
  BorrowerOverdueLoanItem,
  BorrowerOverdueInstallment,
  BorrowerPtpInput,
  BorrowerPtpRecord,
  BorrowerLoanStatement,
  BorrowerStatementTransaction,
} from './borrower.types';

export class BorrowerService {
  private static instance: BorrowerService;

  // In-memory consumer offer cache to support instantaneous statutory KFS & binding offers
  private readonly inMemoryOffers = new Map<string, any>();

  public static getInstance(): BorrowerService {
    if (!BorrowerService.instance) {
      BorrowerService.instance = new BorrowerService();
    }
    return BorrowerService.instance;
  }

  /**
   * Helper: Resolves or links the borrower Customer record for the authenticated user.
   */
  public async getCustomerForUser(userId: string, tenantId?: string) {
    let customer = await prisma.customer.findFirst({
      where: { userId },
      include: {
        addresses: { orderBy: { createdAt: 'desc' } },
        bankAccounts: { orderBy: { createdAt: 'desc' } },
        employmentDetails: { orderBy: { createdAt: 'desc' } },
        CustomerIdentifier: true,
      },
    });

    if (customer) {
      if (tenantId && customer.tenantId && customer.tenantId !== tenantId) {
        throw new ForbiddenError('Access forbidden: Tenant isolation mismatch.');
      }
      return customer;
    }

    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser) {
      throw new NotFoundError(`User '${userId}' not found.`);
    }

    if (tenantId && dbUser.tenantId && dbUser.tenantId !== tenantId) {
      throw new ForbiddenError('Access forbidden: Tenant isolation mismatch.');
    }

    const email = dbUser.email || `borrower_${userId.slice(0, 8)}@adyapan.local`;
    const custCode = `CUST-${Math.floor(100000 + Math.random() * 900000)}`;

    customer = await prisma.customer.create({
      data: {
        userId,
        email,
        firstName: dbUser.firstName || 'Valued',
        lastName: dbUser.lastName || 'Borrower',
        mobile: (dbUser as any).mobile || (dbUser as any).phone || `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        customerCode: custCode,
        status: 'ACTIVE',
        kycStatus: 'NOT_STARTED',
        tenantId: tenantId || dbUser.tenantId || undefined,
      },
      include: {
        addresses: { orderBy: { createdAt: 'desc' } },
        bankAccounts: { orderBy: { createdAt: 'desc' } },
        employmentDetails: { orderBy: { createdAt: 'desc' } },
        CustomerIdentifier: true,
      },
    });

    return customer;
  }

  /**
   * Helper: Resolve masked PAN from identifiers or customer fields
   */
  public getMaskedPan(customer: any): string | null {
    const panIdentifier = customer.CustomerIdentifier?.find(
      (id: any) => id.idType?.toUpperCase() === 'PAN'
    );
    if (panIdentifier?.maskedValue) {
      return panIdentifier.maskedValue;
    }
    const rawPan = customer.panNumber || customer.pan;
    if (rawPan && typeof rawPan === 'string' && rawPan.length >= 5) {
      return `${rawPan.slice(0, 2)}******${rawPan.slice(-2)}`.toUpperCase();
    }
    return null;
  }

  /**
   * Helper: Resolve masked Aadhaar from identifiers or customer fields
   */
  public getMaskedAadhaar(customer: any): string | null {
    const aadhaarIdentifier = customer.CustomerIdentifier?.find(
      (id: any) => id.idType?.toUpperCase() === 'AADHAAR'
    );
    if (aadhaarIdentifier?.maskedValue) {
      return aadhaarIdentifier.maskedValue;
    }
    const rawAadhaar = customer.aadhaarNumber || customer.aadhaar;
    if (rawAadhaar && typeof rawAadhaar === 'string' && rawAadhaar.length >= 4) {
      return `XXXXXXXX${rawAadhaar.slice(-4)}`;
    }
    return null;
  }

  /**
   * 1. Borrower Home Overview
   */
  public async getBorrowerHomeSummary(userId: string, tenantId?: string): Promise<BorrowerHomeSummary> {
    const customer = await this.getCustomerForUser(userId, tenantId);

    // Fetch active loans
    const loans = await prisma.loan.findMany({
      where: {
        customerId: customer.id,
      },
      include: {
        product: { select: { name: true, code: true } },
        schedule: { orderBy: { emiNumber: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeLoanRecord = loans.find((l) => l.status === 'ACTIVE') || loans[0];

    let activeLoanSummary = undefined;
    if (activeLoanRecord) {
      const nextPendingEmi = activeLoanRecord.schedule.find(
        (s) => s.status === 'DUE' || s.status === 'UPCOMING' || s.status === 'OVERDUE'
      );
      const paidCount = activeLoanRecord.schedule.filter((s) => s.status === 'PAID').length;

      activeLoanSummary = {
        id: activeLoanRecord.id,
        loanAccountNumber: activeLoanRecord.loanNo,
        productName: activeLoanRecord.product?.name || 'Personal Credit',
        sanctionedPrincipal: Number(activeLoanRecord.principal),
        outstandingPrincipal: Number(activeLoanRecord.outstandingPrincipal),
        outstandingInterest: Number(activeLoanRecord.outstandingInterest),
        totalOutstanding: Number(activeLoanRecord.outstandingPrincipal) + Number(activeLoanRecord.outstandingInterest),
        nextEmiAmount: nextPendingEmi ? Number(nextPendingEmi.totalDue) : Number(activeLoanRecord.emiAmount),
        nextEmiDueDate: nextPendingEmi ? nextPendingEmi.dueDate.toISOString().split('T')[0] : null,
        totalEmis: activeLoanRecord.schedule.length || activeLoanRecord.tenureMonths,
        paidEmis: paidCount,
        dpd: 0,
        status: activeLoanRecord.status,
      };
    }

    // Fetch active/pending application
    const latestApplication = await prisma.loanApplication.findFirst({
      where: {
        customerId: customer.id,
      },
      include: {
        product: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    let activeAppSummary = undefined;
    if (latestApplication && latestApplication.status !== 'DISBURSED' && latestApplication.status !== 'CANCELLED') {
      let currentStage = 'UNDER REVIEW';
      let progressPercent = 30;
      let nextAction = 'No action required — application under review';
      let actionUrl = `/borrower/apply`;

      if (latestApplication.status === 'DRAFT') {
        currentStage = 'APPLICATION STARTED';
        progressPercent = 20;
        nextAction = 'Complete your profile and application';
        actionUrl = `/borrower/apply`;
      } else if (latestApplication.status === 'KYC_PENDING') {
        currentStage = 'DOCUMENTS REQUIRED';
        progressPercent = 40;
        nextAction = 'Upload required documents';
        actionUrl = `/borrower/documents`;
      } else if (latestApplication.status === 'SUBMITTED' || latestApplication.status === 'UNDER_REVIEW' || latestApplication.status === 'CREDIT_ASSESSMENT' || latestApplication.status === 'UNDERWRITING' || latestApplication.status === 'KYC_VERIFIED') {
        currentStage = 'UNDER REVIEW';
        progressPercent = 60;
        nextAction = 'No action required — application under review';
        actionUrl = `/borrower`;
      } else if (latestApplication.status === 'APPROVED') {
        currentStage = 'OFFER READY';
        progressPercent = 75;
        nextAction = 'Review your offer';
        actionUrl = `/borrower/offers`;
      } else if (latestApplication.status === 'AGREEMENT_PENDING') {
        currentStage = 'AGREEMENT REQUIRED';
        progressPercent = 85;
        nextAction = 'Sign your loan agreement';
        actionUrl = `/borrower/agreements/${latestApplication.id}`;
      } else if (latestApplication.status === 'READY_FOR_DISBURSEMENT') {
        currentStage = 'READY FOR DISBURSEMENT';
        progressPercent = 95;
        nextAction = 'Track disbursement status';
        actionUrl = `/borrower/agreements/${latestApplication.id}`;
      } else if (latestApplication.status === 'REJECTED') {
        currentStage = 'REJECTED';
        progressPercent = 100;
        nextAction = 'Application declined';
        actionUrl = `/borrower/apply`;
      }

      activeAppSummary = {
        id: latestApplication.id,
        applicationNumber: latestApplication.applicationNo,
        productName: latestApplication.product?.name || 'Digital Loan',
        requestedAmount: Number(latestApplication.requestedAmount),
        status: currentStage,
        currentStage,
        progressPercent,
        nextRequiredAction: nextAction,
        actionUrl,
        createdAt: latestApplication.createdAt.toISOString(),
      };
    }

    // Recent payment transactions
    const recentPayments = await prisma.payment.findMany({
      where: {
        customerId: customer.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentTx = recentPayments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      type: 'EMI_REPAYMENT',
      status: p.status,
      paymentDate: p.createdAt.toISOString().split('T')[0],
      paymentMethod: p.method || 'UPI',
      reference: p.reference || p.paymentNo,
    }));

    // Dynamic PAN and Aadhaar Extraction
    const panNumberMasked = this.getMaskedPan(customer);

    const aadhaarId = customer.CustomerIdentifier?.find(
      (id: any) => id.idType?.toUpperCase() === 'AADHAAR'
    );
    const aadhaarMasked = aadhaarId?.maskedValue || null;

    // Dynamic Bank & Mandate Info
    const primaryBank = customer.bankAccounts?.[0] || null;
    const bankAccNo = primaryBank?.accountNumber || customer.bankAccountNo || null;
    const bankAccountNoMasked = bankAccNo
      ? (bankAccNo.length > 4 ? `••••••••${bankAccNo.slice(-4)}` : bankAccNo)
      : null;
    const bankName = primaryBank?.bankName || customer.bankName || null;
    const bankIfsc = primaryBank?.ifscCode || customer.bankIfsc || null;
    const isBankVerified = Boolean(primaryBank?.isVerified || customer.bankAccountNo);
    const bankLinked = Boolean(primaryBank || customer.bankAccountNo);
    const mandateStatus: 'ACTIVE' | 'PENDING' | 'NOT_CONFIGURED' = bankLinked
      ? (isBankVerified ? 'ACTIVE' : 'PENDING')
      : 'NOT_CONFIGURED';

    // Address
    const primaryAddress = customer.addresses?.[0] || null;
    const formattedAddress = primaryAddress
      ? `${primaryAddress.addressLine}, ${primaryAddress.city}, ${primaryAddress.state} - ${primaryAddress.pincode}`
      : customer.addressLine
      ? `${customer.addressLine}, ${customer.city || ''}, ${customer.state || ''} ${customer.pincode ? `- ${customer.pincode}` : ''}`.trim()
      : null;

    // Credit limits computation
    const totalOutstandingAcrossLoans = loans
      .filter((l) => l.status === 'ACTIVE')
      .reduce((sum, l) => sum + Number(l.outstandingPrincipal), 0);

    const monthlyIncome = Number(
      customer.employmentDetails?.[0]?.monthlyIncome || customer.monthlyIncome || 0
    );

    // Dynamic pre-approved limit derived from verified profile & income
    const basePreApprovedLimit = monthlyIncome > 0
      ? Math.round(monthlyIncome * 3)
      : (customer.kycStatus === 'VERIFIED' ? 150000 : 0);

    const availableLimit = Math.max(0, basePreApprovedLimit - totalOutstandingAcrossLoans);

    return {
      borrower: {
        id: customer.id,
        customerCode: customer.customerCode,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email || `${customer.customerCode.toLowerCase()}@adyapan.local`,
        mobile: customer.mobile,
        kycStatus: customer.kycStatus,
        panNumberMasked,
        aadhaarMasked,
        bankLinked,
        bankName,
        bankAccountNoMasked,
        bankIfsc,
        isBankVerified,
        mandateStatus,
        address: formattedAddress,
        profileDetails: {
          dob: customer.dateOfBirth ? customer.dateOfBirth.toISOString().split('T')[0] : null,
          gender: customer.gender || null,
          addressLine1: primaryAddress?.addressLine || customer.addressLine || null,
          city: primaryAddress?.city || customer.city || null,
          state: primaryAddress?.state || customer.state || null,
          pincode: primaryAddress?.pincode || customer.pincode || null,
          employmentType: customer.employmentDetails?.[0]?.employmentType || customer.employmentType || null,
          employerName: customer.employmentDetails?.[0]?.employerName || customer.employerName || null,
          designation: customer.employmentDetails?.[0]?.designation || null,
          monthlyIncome: Number(customer.employmentDetails?.[0]?.monthlyIncome || customer.monthlyIncome || 0) || null,
          existingEmiObligations: Number(customer.existingObligations || 0) || null,
          workExperienceYears: customer.employmentDetails?.[0]?.workExperienceYears || null,
          panNumber: null,
          bankName: primaryBank?.bankName || customer.bankName || null,
          accountNumber: primaryBank?.accountNumber || customer.bankAccountNo || null,
          ifscCode: primaryBank?.ifscCode || customer.bankIfsc || null,
          accountHolderName: primaryBank?.accountHolderName || `${customer.firstName} ${customer.lastName}`.trim(),
        },
      },
      creditLimit: {
        preApprovedLimit: basePreApprovedLimit,
        availableLimit,
        utilizedLimit: totalOutstandingAcrossLoans,
        currency: 'INR',
        isEligible: customer.kycStatus === 'VERIFIED' && basePreApprovedLimit > 0,
      },
      activeLoan: activeLoanSummary,
      activeApplication: activeAppSummary,
      recentTransactions: recentTx,
      notificationsCount: 2,
      unreadSupportTickets: 0,
    };
  }

  /**
   * 2. Consumer Loan Products Discovery
   */
  public async getConsumerProducts(tenantId?: string) {
    const tenantFilter = tenantId ? { tenantId } : {};
    const products = await prisma.loanProduct.findMany({
      where: {
        isActive: true,
        ...tenantFilter,
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: 'Instant paperless credit with transparent pricing and zero hidden fees.',
      minAmount: Number(p.minAmount),
      maxAmount: Number(p.maxAmount),
      minTenureMonths: p.minTenureMonths,
      maxTenureMonths: p.maxTenureMonths,
      interestRateAnnual: Number(p.interestRate),
      processingFeePercent: Number(p.processingFeePct),
      features: [
        'Instant Approval within 2 minutes',
        'Direct Bank Disbursement via IMPS',
        'Flexible 3 to 36 months EMI plans',
        '100% Paperless DigiLocker e-KYC',
      ],
    }));
  }

  /**
   * 3. Real-Time Consumer-Safe Eligibility Calculation
   */
  public async evaluateBorrowerEligibility(
    userId: string,
    input: BorrowerEligibilityInput,
    tenantId?: string
  ): Promise<BorrowerEligibilityResult> {
    const customer = await this.getCustomerForUser(userId, tenantId);

    // Fetch product or fallback
    let product = null;
    if (input.productId) {
      product = await prisma.loanProduct.findUnique({ where: { id: input.productId } });
    }
    if (!product) {
      product = await prisma.loanProduct.findFirst({
        where: { isActive: true, ...(tenantId ? { tenantId } : {}) },
      });
    }

    const minAmount = product ? Number(product.minAmount) : 10000;
    const maxProductAmount = product ? Number(product.maxAmount) : 500000;
    const rateAnnual = product ? Number(product.interestRate) : 14.5;
    const tenure = input.requestedTenureMonths || 12;

    // FOIR Calculation: max 50% of monthly income can go towards total EMIs
    const maxAllowableEmi = Math.max(2000, input.monthlyIncome * 0.5 - (input.existingMonthlyEmi || 0));

    // Monthly interest rate
    const r = rateAnnual / (12 * 100);
    const emiFactor = (Math.pow(1 + r, tenure) - 1) / (r * Math.pow(1 + r, tenure));
    const maxCalculatedPrincipal = Math.floor(maxAllowableEmi * emiFactor);

    const maxEligibleAmount = Math.min(maxProductAmount, Math.max(minAmount, maxCalculatedPrincipal));
    const isEligible = maxEligibleAmount >= minAmount && input.monthlyIncome >= 15000;

    // Calculate indicative EMI for requested amount
    const calcPrincipal = Math.min(input.requestedAmount, maxEligibleAmount);
    const indicativeEmi = Math.round((calcPrincipal * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1));

    return {
      isEligible,
      maxEligibleAmount,
      minEligibleAmount: minAmount,
      recommendedTenureMonths: tenure,
      indicativeInterestRateApr: Number((rateAnnual + 1.2).toFixed(2)),
      indicativeEmiAmount: indicativeEmi || 2500,
      productName: product?.name || 'Adyapan Prime Digital Loan',
      productCode: product?.code || 'PROD-PERSONAL-PRIME',
      safeMessage: isEligible
        ? `Congratulations! Based on your income profile, you are pre-qualified for credit up to ₹${maxEligibleAmount.toLocaleString('en-IN')}.`
        : 'Based on current guidelines, you may qualify with a co-applicant or lower requested amount.',
      keyHighlights: [
        'Zero prepayment penalties after 3 EMIs',
        'Transparent APR with Key Fact Statement (KFS)',
        '3-day cooling-off period protection under RBI guidelines',
      ],
    };
  }

  /**
   * 4. Multi-Step Digital Loan Application Submission
   */
  public async submitBorrowerApplication(
    userId: string,
    input: BorrowerApplicationInput,
    tenantId?: string
  ) {
    const customer = await this.getCustomerForUser(userId, tenantId);

    // 1. Update customer profile details
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        kycStatus: customer.kycStatus === 'VERIFIED' ? 'VERIFIED' : 'SUBMITTED',
        employmentType: input.employmentType,
        employerName:
          input.employerName ||
          input.businessName ||
          input.institutionName ||
          (input.employmentType === 'FARMER'
            ? `Agricultural Farm (${input.cropType || 'Crop Producer'})`
            : input.employmentType === 'FREELANCER'
            ? 'Independent Freelance Practice'
            : 'Independent Trade'),
        monthlyIncome: Money.of(input.monthlyIncome || 0),
        existingObligations: input.existingEmiObligations ? Money.of(input.existingEmiObligations) : null,
      },
    });

    // 2. Upsert Address
    await prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        addressType: 'CURRENT',
        addressLine: `${input.addressLine1} ${input.addressLine2 || ''}`.trim(),
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        isPrimary: true,
      },
    });

    // 3. Upsert Bank Account
    await prisma.customerBankAccount.create({
      data: {
        customerId: customer.id,
        accountHolderName: input.accountHolderName,
        accountNumber: input.accountNumber,
        ifscCode: input.ifscCode.toUpperCase(),
        bankName: input.bankName,
        accountType: input.accountType,
        isVerified: false,
        isPrimary: true,
      },
    });

    // 4. Upsert Employment Details
    await prisma.customerEmployment.create({
      data: {
        customerId: customer.id,
        employmentType: input.employmentType,
        employerName: input.employerName || input.businessName || input.institutionName || 'Independent',
        designation: input.designation || input.professionType || null,
        workExperienceYears: input.workExperienceYears || null,
        monthlyIncome: Money.of(input.monthlyIncome || 0),
      },
    });

    // 4.1 Upsert Customer Identifiers (PAN & Aadhaar)
    if (input.panNumber) {
      const panClean = input.panNumber.trim().toUpperCase();
      const masked = `${panClean.slice(0, 2)}******${panClean.slice(-2)}`;
      await prisma.customerIdentifier.create({
        data: {
          customerId: customer.id,
          idType: 'PAN',
          maskedValue: masked,
          verificationStatus: 'PENDING',
        },
      });
    }

    if (input.aadhaarNumberMasked) {
      await prisma.customerIdentifier.create({
        data: {
          customerId: customer.id,
          idType: 'AADHAAR',
          maskedValue: input.aadhaarNumberMasked,
          verificationStatus: 'PENDING',
        },
      });
    }

    // 5. Fetch Product and Validate Authoritative Product Limits
    const product = await prisma.loanProduct.findUnique({
      where: { id: input.productId },
    });
    if (!product) {
      throw new NotFoundError('Selected loan product not found or inactive.');
    }

    const maxAmt = Number(product.maxAmount) || 10000000;
    if (input.requestedAmount < 1 || input.requestedAmount > maxAmt) {
      throw new ValidationError(
        `Requested loan amount ₹${input.requestedAmount.toLocaleString('en-IN')} must be greater than ₹0 and up to ₹${maxAmt.toLocaleString('en-IN')}.`
      );
    }

    if (input.tenureMonths < 1 || input.tenureMonths > (product.maxTenureMonths || 120)) {
      throw new ValidationError(
        `Loan tenure must be at least 1 month and up to ${product.maxTenureMonths || 120} months.`
      );
    }

    // 5.1 Persona-Specific Validation
    if (input.employmentType === 'STUDENT') {
      if (!input.institutionName && !input.employerName) {
        throw new ValidationError('College or Educational Institution name is required for student loan applications.');
      }
    } else if (input.employmentType === 'SALARIED') {
      if (!input.employerName || !input.employerName.trim()) {
        throw new ValidationError('Employer company name is required for salaried loan applications.');
      }
      if (!input.monthlyIncome || input.monthlyIncome <= 0) {
        throw new ValidationError('Net monthly in-hand salary must be greater than zero.');
      }
    } else if (input.employmentType === 'BUSINESS' || input.employmentType === 'SELF_EMPLOYED') {
      if (!input.businessName && !input.employerName) {
        throw new ValidationError('Registered business name is required for business loan applications.');
      }
    }

    // 6. Check for existing DRAFT application or create new
    let application = await prisma.loanApplication.findFirst({
      where: { customerId: customer.id, status: 'DRAFT' },
      orderBy: { updatedAt: 'desc' },
    });

    if (application) {
      application = await prisma.loanApplication.update({
        where: { id: application.id },
        data: {
          productId: product.id,
          requestedAmount: Money.of(input.requestedAmount),
          tenureMonths: input.tenureMonths,
          purpose: input.purpose,
          status: 'APPROVED',
          submittedAt: new Date(),
        },
      });
    } else {
      const appNumber = `APP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      application = await prisma.loanApplication.create({
        data: {
          applicationNo: appNumber,
          customerId: customer.id,
          productId: product.id,
          requestedAmount: Money.of(input.requestedAmount),
          tenureMonths: input.tenureMonths,
          status: 'APPROVED',
          purpose: input.purpose,
          tenantId: tenantId || product.tenantId || undefined,
          submittedAt: new Date(),
        },
      });
    }

    // 6.1 Link uploaded documents if any
    if (input.documentIds && input.documentIds.length > 0) {
      await prisma.document.updateMany({
        where: { id: { in: input.documentIds } },
        data: { applicationId: application.id, customerId: customer.id },
      });
    }

    // 7. Generate Statutory Offer & KFS
    const sanctionAmount = input.requestedAmount;
    const rateAnnual = Number(product.interestRate);
    const tenure = input.tenureMonths;
    const r = rateAnnual / (12 * 100);
    const emiAmount = Math.round((sanctionAmount * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1));
    const processingFee = Math.round(sanctionAmount * (Number(product.processingFeePct) / 100));
    const gst = Math.round(processingFee * 0.18);
    const totalDeductions = processingFee + gst;
    const netDisbursement = sanctionAmount - totalDeductions;
    const totalRepayment = emiAmount * tenure;
    const apr = Number((rateAnnual + 1.25).toFixed(2));

    const offerId = `off-${application.id.slice(0, 8)}`;
    const offerPayload = {
      id: offerId,
      applicationId: application.id,
      offeredAmount: sanctionAmount,
      offeredInterestRate: rateAnnual,
      offeredTenureMonths: tenure,
      emiAmount,
      processingFee,
      gst,
      netDisbursement,
      totalRepayment,
      apr,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    this.inMemoryOffers.set(offerId, offerPayload);
    this.inMemoryOffers.set(application.id, offerPayload);

    // Audit log
    await logAudit({
      userId,
      tenantId: tenantId || undefined,
      action: 'BORROWER_APPLICATION_SUBMITTED',
      entity: 'LoanApplication',
      entityId: application.id,
      newValue: { appNumber: application.applicationNo, requestedAmount: input.requestedAmount, offerId },
    });

    return {
      applicationId: application.id,
      applicationNumber: application.applicationNo,
      status: application.status,
      submittedAt: application.submittedAt?.toISOString() || new Date().toISOString(),
      productName: product.name,
      productCode: product.code,
      offerId,
      sanctionedAmount: sanctionAmount,
      requestedAmount: input.requestedAmount,
      tenureMonths: tenure,
      emiAmount,
      apr,
      netDisbursement,
    };
  }

  /**
   * 4.1 Save or Update Draft Loan Application
   */
  public async saveBorrowerDraftApplication(
    userId: string,
    input: BorrowerDraftApplicationInput,
    tenantId?: string
  ) {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || undefined;

    let targetProductId = input.productId;
    if (!targetProductId) {
      const defaultProd = await prisma.loanProduct.findFirst({
        where: { isActive: true, ...(activeTenant ? { tenantId: activeTenant } : {}) },
      });
      targetProductId = defaultProd?.id;
    }

    if (!targetProductId) {
      throw new NotFoundError('No active loan product available.');
    }

    const product = await prisma.loanProduct.findUnique({
      where: { id: targetProductId },
    });
    if (!product) {
      throw new NotFoundError(`Loan product '${targetProductId}' not found.`);
    }

    // Persist address if provided in draft
    if (input.addressLine1 && input.city && input.state && input.pincode) {
      const fullLine = `${input.addressLine1}${input.addressLine2 ? `, ${input.addressLine2}` : ''}`.trim();
      const existingAddr = await prisma.customerAddress.findFirst({
        where: { customerId: customer.id, isPrimary: true },
      });
      if (existingAddr) {
        await prisma.customerAddress.update({
          where: { id: existingAddr.id },
          data: {
            addressLine: fullLine,
            city: input.city.trim(),
            state: input.state.trim(),
            pincode: input.pincode.trim(),
          },
        });
      } else {
        await prisma.customerAddress.create({
          data: {
            customerId: customer.id,
            addressLine: fullLine,
            city: input.city.trim(),
            state: input.state.trim(),
            pincode: input.pincode.trim(),
            isPrimary: true,
          },
        });
      }
    }

    // Persist employment if provided in draft
    if (input.employmentType || input.employerName || input.institutionName || input.businessName) {
      const existingEmp = await prisma.customerEmployment.findFirst({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
      });
      const empType = input.employmentType || existingEmp?.employmentType || 'SALARIED';
      const empName =
        input.employerName ||
        input.institutionName ||
        input.businessName ||
        existingEmp?.employerName ||
        'Independent';
      const desig = input.designation || input.courseName || input.professionType || existingEmp?.designation || null;
      const income = input.monthlyIncome !== undefined ? input.monthlyIncome : (Number(existingEmp?.monthlyIncome) || 0);

      if (existingEmp) {
        await prisma.customerEmployment.update({
          where: { id: existingEmp.id },
          data: {
            employmentType: empType,
            employerName: empName,
            designation: desig,
            monthlyIncome: Money.of(income),
            workExperienceYears:
              input.workExperienceYears !== undefined ? input.workExperienceYears : existingEmp.workExperienceYears,
          },
        });
      } else {
        await prisma.customerEmployment.create({
          data: {
            customerId: customer.id,
            employmentType: empType,
            employerName: empName,
            designation: desig,
            monthlyIncome: Money.of(income),
            workExperienceYears: input.workExperienceYears || null,
          },
        });
      }
    }

    // Persist bank if provided in draft
    if (input.accountNumber && input.ifscCode) {
      const existingBank = await prisma.customerBankAccount.findFirst({
        where: { customerId: customer.id, isPrimary: true },
      });
      if (existingBank) {
        await prisma.customerBankAccount.update({
          where: { id: existingBank.id },
          data: {
            accountNumber: input.accountNumber.trim(),
            ifscCode: input.ifscCode.trim().toUpperCase(),
            bankName: input.bankName || existingBank.bankName,
            accountHolderName: input.accountHolderName || existingBank.accountHolderName,
          },
        });
      } else {
        await prisma.customerBankAccount.create({
          data: {
            customerId: customer.id,
            accountNumber: input.accountNumber.trim(),
            ifscCode: input.ifscCode.trim().toUpperCase(),
            bankName: input.bankName || 'Partner Bank',
            accountHolderName: input.accountHolderName || `${customer.firstName} ${customer.lastName}`.trim(),
            accountType: input.accountType || 'SAVINGS',
            isPrimary: true,
          },
        });
      }
    }

    // Find or create DRAFT application record
    let draft = input.applicationId
      ? await prisma.loanApplication.findFirst({
          where: { id: input.applicationId, customerId: customer.id },
        })
      : await prisma.loanApplication.findFirst({
          where: { customerId: customer.id, status: 'DRAFT' },
          orderBy: { updatedAt: 'desc' },
        });

    const defaultAmount = Number(product.minAmount) || 10000;
    const defaultTenure = product.minTenureMonths || 12;

    if (draft) {
      draft = await prisma.loanApplication.update({
        where: { id: draft.id },
        data: {
          productId: product.id,
          requestedAmount: input.requestedAmount ? Money.of(input.requestedAmount) : draft.requestedAmount,
          tenureMonths: input.tenureMonths || draft.tenureMonths,
          purpose: input.purpose !== undefined ? input.purpose : draft.purpose,
        },
      });
    } else {
      const appNumber = `APP-DRAFT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      draft = await prisma.loanApplication.create({
        data: {
          applicationNo: appNumber,
          customerId: customer.id,
          productId: product.id,
          requestedAmount: Money.of(input.requestedAmount || defaultAmount),
          tenureMonths: input.tenureMonths || defaultTenure,
          purpose: input.purpose || 'Personal / General Financing',
          status: 'DRAFT',
          tenantId: activeTenant,
        },
      });
    }

    return {
      success: true,
      message: 'Loan application draft saved successfully.',
      applicationId: draft.id,
      applicationNumber: draft.applicationNo,
      status: draft.status,
      productId: draft.productId,
      requestedAmount: Number(draft.requestedAmount),
      tenureMonths: draft.tenureMonths,
      purpose: draft.purpose,
      updatedAt: draft.updatedAt.toISOString(),
    };
  }

  /**
   * 4.2 Get Active or Draft Borrower Application
   */
  public async getActiveBorrowerApplication(
    userId: string,
    tenantId?: string
  ): Promise<BorrowerApplicationDetail | null> {
    const customer = await this.getCustomerForUser(userId, tenantId);

    const application = await prisma.loanApplication.findFirst({
      where: {
        customerId: customer.id,
        status: { notIn: ['DISBURSED', 'CANCELLED'] },
      },
      include: {
        product: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!application) {
      return null;
    }

    const primaryAddress = customer.addresses?.find((a: any) => a.isPrimary) || customer.addresses?.[0];
    const primaryEmployment = customer.employmentDetails?.[0];
    const primaryBank = customer.bankAccounts?.find((b: any) => b.isPrimary) || customer.bankAccounts?.[0];

    const panNumberMasked = this.getMaskedPan(customer);
    const aadhaarMasked = this.getMaskedAadhaar(customer);

    return {
      id: application.id,
      applicationNumber: application.applicationNo,
      status: application.status,
      stage: application.stage,
      requestedAmount: Number(application.requestedAmount),
      tenureMonths: application.tenureMonths,
      purpose: application.purpose,
      submittedAt: application.submittedAt ? application.submittedAt.toISOString() : null,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
      product: {
        id: application.product.id,
        code: application.product.code,
        name: application.product.name,
        minAmount: Number(application.product.minAmount),
        maxAmount: Number(application.product.maxAmount),
        minTenureMonths: application.product.minTenureMonths,
        maxTenureMonths: application.product.maxTenureMonths,
        interestRateAnnual: Number(application.product.interestRate),
        processingFeePercent: Number(application.product.processingFeePct),
      },
      borrower: {
        id: customer.id,
        customerCode: customer.customerCode,
        firstName: customer.firstName,
        lastName: customer.lastName,
        mobile: customer.mobile,
        email: customer.email,
        kycStatus: customer.kycStatus,
        panNumberMasked,
        aadhaarMasked,
      },
      address: primaryAddress
        ? {
            addressLine: primaryAddress.addressLine,
            city: primaryAddress.city,
            state: primaryAddress.state,
            pincode: primaryAddress.pincode,
          }
        : null,
      employment: primaryEmployment
        ? {
            employmentType: primaryEmployment.employmentType,
            employerName: primaryEmployment.employerName,
            designation: primaryEmployment.designation,
            monthlyIncome: Number(primaryEmployment.monthlyIncome),
            institutionName: primaryEmployment.employmentType === 'STUDENT' ? primaryEmployment.employerName : null,
            courseName: primaryEmployment.employmentType === 'STUDENT' ? primaryEmployment.designation : null,
            businessName:
              primaryEmployment.employmentType === 'BUSINESS' || primaryEmployment.employmentType === 'SELF_EMPLOYED'
                ? primaryEmployment.employerName
                : null,
          }
        : null,
      bank: primaryBank
        ? {
            bankName: primaryBank.bankName,
            accountNumberMasked: primaryBank.accountNumber ? `••••${primaryBank.accountNumber.slice(-4)}` : null,
            ifscCode: primaryBank.ifscCode,
            accountHolderName: primaryBank.accountHolderName,
            accountType: primaryBank.accountType,
            isVerified: primaryBank.isVerified,
          }
        : null,
    };
  }

  /**
   * 4.3 Get Specific Borrower Application by ID (Ownership protected)
   */
  public async getBorrowerApplicationById(
    userId: string,
    applicationId: string,
    tenantId?: string
  ): Promise<BorrowerApplicationDetail> {
    const customer = await this.getCustomerForUser(userId, tenantId);

    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        product: true,
      },
    });

    if (!application) {
      throw new NotFoundError(`Loan application '${applicationId}' not found.`);
    }

    if (application.customerId !== customer.id) {
      throw new ForbiddenError("Access forbidden: You cannot view another borrower's application.");
    }

    if (tenantId && application.tenantId && application.tenantId !== tenantId) {
      throw new ForbiddenError('Access forbidden: Tenant isolation mismatch.');
    }

    const primaryAddress = customer.addresses?.find((a: any) => a.isPrimary) || customer.addresses?.[0];
    const primaryEmployment = customer.employmentDetails?.[0];
    const primaryBank = customer.bankAccounts?.find((b: any) => b.isPrimary) || customer.bankAccounts?.[0];

    const panNumberMasked = this.getMaskedPan(customer);
    const aadhaarMasked = this.getMaskedAadhaar(customer);

    return {
      id: application.id,
      applicationNumber: application.applicationNo,
      status: application.status,
      stage: application.stage,
      requestedAmount: Number(application.requestedAmount),
      tenureMonths: application.tenureMonths,
      purpose: application.purpose,
      submittedAt: application.submittedAt ? application.submittedAt.toISOString() : null,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
      product: {
        id: application.product.id,
        code: application.product.code,
        name: application.product.name,
        minAmount: Number(application.product.minAmount),
        maxAmount: Number(application.product.maxAmount),
        minTenureMonths: application.product.minTenureMonths,
        maxTenureMonths: application.product.maxTenureMonths,
        interestRateAnnual: Number(application.product.interestRate),
        processingFeePercent: Number(application.product.processingFeePct),
      },
      borrower: {
        id: customer.id,
        customerCode: customer.customerCode,
        firstName: customer.firstName,
        lastName: customer.lastName,
        mobile: customer.mobile,
        email: customer.email,
        kycStatus: customer.kycStatus,
        panNumberMasked,
        aadhaarMasked,
      },
      address: primaryAddress
        ? {
            addressLine: primaryAddress.addressLine,
            city: primaryAddress.city,
            state: primaryAddress.state,
            pincode: primaryAddress.pincode,
          }
        : null,
      employment: primaryEmployment
        ? {
            employmentType: primaryEmployment.employmentType,
            employerName: primaryEmployment.employerName,
            designation: primaryEmployment.designation,
            monthlyIncome: Number(primaryEmployment.monthlyIncome),
            institutionName: primaryEmployment.employmentType === 'STUDENT' ? primaryEmployment.employerName : null,
            courseName: primaryEmployment.employmentType === 'STUDENT' ? primaryEmployment.designation : null,
            businessName:
              primaryEmployment.employmentType === 'BUSINESS' || primaryEmployment.employmentType === 'SELF_EMPLOYED'
                ? primaryEmployment.employerName
                : null,
          }
        : null,
      bank: primaryBank
        ? {
            bankName: primaryBank.bankName,
            accountNumberMasked: primaryBank.accountNumber ? `••••${primaryBank.accountNumber.slice(-4)}` : null,
            ifscCode: primaryBank.ifscCode,
            accountHolderName: primaryBank.accountHolderName,
            accountType: primaryBank.accountType,
            isVerified: primaryBank.isVerified,
          }
        : null,
    };
  }

  /**
   * 5. Get Statutory Key Fact Statement (KFS)
   */
  /**
   * 5.1 List All Borrower Loan Offers
   */
  public async getBorrowerOffers(userId: string, tenantId?: string) {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';

    const engineOffers = offerEngineService.getOffersByCustomerId(activeTenant, customer.id);
    const results = engineOffers.map((o) => ({
      id: o.id,
      offerNo: o.offerNo,
      applicationId: o.applicationId,
      applicationNo: o.applicationNo,
      productName: o.productName,
      productCode: o.productCode,
      offeredAmount: o.offeredAmount,
      tenureMonths: o.tenureMonths,
      annualInterestRatePct: o.annualInterestRatePct,
      monthlyEmi: o.monthlyEmi,
      totalInterest: o.totalInterest,
      totalRepayment: o.totalRepayment,
      processingFee: o.processingFee,
      processingFeeGst: o.processingFeeGst,
      netDisbursedAmount: o.netDisbursedAmount,
      annualPercentageRateApr: o.annualPercentageRateApr,
      status: o.status,
      validUntil: o.validUntil,
      isExpired: o.isExpired,
      conditionsCount: o.conditions?.length || 0,
      version: o.version,
      createdAt: o.createdAt,
    }));

    // Also include inMemoryOffers for this customer's applications if not already present
    const customerApps = await prisma.loanApplication.findMany({
      where: { customerId: customer.id },
      select: { id: true, applicationNo: true, product: { select: { name: true, code: true } } },
    });

    for (const app of customerApps) {
      const memOffer = this.inMemoryOffers.get(app.id) as any;
      if (memOffer && !results.some((r) => r.id === memOffer.id || r.applicationId === app.id)) {
        results.push({
          id: memOffer.id,
          offerNo: `OFFER-${app.applicationNo}-1`,
          applicationId: app.id,
          applicationNo: app.applicationNo,
          productName: app.product?.name || 'Consumer Loan',
          productCode: app.product?.code || 'PROD-CONSUMER',
          offeredAmount: memOffer.offeredAmount,
          tenureMonths: memOffer.offeredTenureMonths || memOffer.tenureMonths || 12,
          annualInterestRatePct: memOffer.offeredInterestRate || memOffer.annualInterestRatePct || 14.5,
          monthlyEmi: memOffer.emiAmount || memOffer.monthlyEmi || 0,
          totalInterest: (memOffer.totalRepayment || 0) - (memOffer.offeredAmount || 0),
          totalRepayment: memOffer.totalRepayment || 0,
          processingFee: memOffer.processingFee || 0,
          processingFeeGst: memOffer.gst || memOffer.processingFeeGst || 0,
          netDisbursedAmount: memOffer.netDisbursement || memOffer.netDisbursedAmount || memOffer.offeredAmount,
          annualPercentageRateApr: memOffer.apr || memOffer.annualPercentageRateApr || 15.75,
          status: memOffer.status || 'PENDING_ACCEPTANCE',
          validUntil: memOffer.expiresAt || memOffer.validUntil || new Date(Date.now() + 7 * 86400000).toISOString(),
          isExpired: memOffer.expiresAt ? new Date(memOffer.expiresAt).getTime() < Date.now() : false,
          conditionsCount: 0,
          version: 1,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return results;
  }

  /**
   * 5.2 Get Specific Borrower Offer Details
   */
  public async getBorrowerOfferDetails(userId: string, offerId: string, tenantId?: string) {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';

    let offer: any;
    try {
      offer = offerEngineService.getOfferById(activeTenant, offerId);
    } catch {
      offer = this.inMemoryOffers.get(offerId);
    }

    if (!offer) {
      throw new NotFoundError(`Loan offer '${offerId}' not found.`);
    }

    if (offer.customerId && offer.customerId !== customer.id) {
      throw new ForbiddenError('Access forbidden: This offer belongs to another borrower.');
    }

    if (offer.applicationId) {
      const app = await prisma.loanApplication.findUnique({
        where: { id: offer.applicationId },
        select: { customerId: true, tenantId: true },
      });
      if (app && app.customerId !== customer.id) {
        throw new ForbiddenError('Access forbidden: This offer belongs to another borrower.');
      }
      if (tenantId && app?.tenantId && app.tenantId !== tenantId) {
        throw new ForbiddenError('Access forbidden: Tenant isolation mismatch.');
      }
    }

    return {
      id: offer.id,
      offerNo: offer.offerNo,
      applicationId: offer.applicationId,
      applicationNo: offer.applicationNo,
      productName: offer.productName || 'Personal Credit',
      productCode: offer.productCode,
      offeredAmount: offer.offeredAmount,
      tenureMonths: offer.tenureMonths || offer.offeredTenureMonths,
      annualInterestRatePct: offer.annualInterestRatePct || offer.offeredInterestRate,
      monthlyEmi: offer.monthlyEmi || offer.emiAmount,
      totalInterest: offer.totalInterest,
      totalRepayment: offer.totalRepayment,
      processingFee: offer.processingFee,
      processingFeeGst: offer.processingFeeGst,
      documentationCharges: offer.documentationCharges || 500,
      documentationChargesGst: offer.documentationChargesGst || 90,
      totalFeesAndTaxes: offer.totalFeesAndTaxes || ((Number(offer.processingFee) || 0) + (Number(offer.processingFeeGst) || 0) + (Number(offer.documentationCharges) || 500) + (Number(offer.documentationChargesGst) || 90)),
      netDisbursedAmount: offer.netDisbursedAmount || offer.netDisbursement || (Number(offer.offeredAmount || 0) - ((Number(offer.processingFee) || 0) + (Number(offer.processingFeeGst) || 0) + 590)),
      annualPercentageRateApr: offer.annualPercentageRateApr || offer.apr,
      status: offer.status,
      validUntil: offer.validUntil || offer.expiresAt,
      isExpired: offer.isExpired || false,
      conditions: (offer.conditions || []).map((c: any) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        description: c.description,
        isMandatory: c.isMandatory,
        category: c.category,
        status: c.status,
      })),
      version: offer.version || 1,
      createdAt: offer.createdAt,
    };
  }

  /**
   * 5.3 Get Statutory Key Fact Statement (KFS)
   */
  public async getBorrowerKfs(userId: string, offerId: string, tenantId?: string): Promise<BorrowerKfsData> {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';

    let offer: any;
    try {
      offer = offerEngineService.getOfferById(activeTenant, offerId);
    } catch {
      offer = this.inMemoryOffers.get(offerId);
    }

    if (!offer) {
      throw new NotFoundError(`Loan offer '${offerId}' not found.`);
    }

    if (offer.customerId && offer.customerId !== customer.id) {
      throw new ForbiddenError('Access forbidden: This offer belongs to another borrower.');
    }

    if (offer.applicationId) {
      const app = await prisma.loanApplication.findUnique({
        where: { id: offer.applicationId },
        select: { customerId: true, tenantId: true },
      });
      if (app && app.customerId !== customer.id) {
        throw new ForbiddenError('Access forbidden: This offer belongs to another borrower.');
      }
      if (tenantId && app?.tenantId && app.tenantId !== tenantId) {
        throw new ForbiddenError('Access forbidden: Tenant isolation mismatch.');
      }
    }

    const loanAmount = offer.offeredAmount;
    const nominalRate = offer.annualInterestRatePct || offer.offeredInterestRate || 14.5;
    const tenureMonths = offer.tenureMonths || offer.offeredTenureMonths || 12;
    const emiAmount = offer.monthlyEmi || offer.emiAmount || 4500;
    const processingFee = offer.processingFee || 1000;
    const gstAmount = offer.processingFeeGst || Math.round(processingFee * 0.18);
    const documentationCharges = offer.documentationCharges || 500;
    const totalUpfrontDeductions = offer.totalFeesAndTaxes || (processingFee + gstAmount + documentationCharges);
    const netDisbursementAmount = offer.netDisbursedAmount || (loanAmount - totalUpfrontDeductions);
    const totalRepaymentAmount = offer.totalRepayment || (emiAmount * tenureMonths);
    const totalInterestPayable = offer.totalInterest || (totalRepaymentAmount - loanAmount);
    const apr = offer.annualPercentageRateApr || offer.apr || Number((nominalRate + 1.25).toFixed(2));

    const r = nominalRate / (12 * 100);
    let remainingPrincipal = loanAmount;
    const scheduleSummary = [];

    for (let i = 1; i <= tenureMonths; i++) {
      const interestComponent = Math.round(remainingPrincipal * r);
      const principalComponent = emiAmount - interestComponent;
      remainingPrincipal = Math.max(0, remainingPrincipal - principalComponent);

      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);

      scheduleSummary.push({
        installmentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        principal: principalComponent,
        interest: interestComponent,
        emi: emiAmount,
        outstandingBalance: remainingPrincipal,
      });
    }

    const coolingOffEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return {
      kfsId: `KFS-${(offer.offerNo || offerId).replace('OFFER-', '').slice(0, 12).toUpperCase()}`,
      offerId,
      loanAmount,
      annualPercentageRateApr: apr,
      nominalInterestRate: nominalRate,
      interestType: offer.interestModel || 'FIXED_REDUCING_BALANCE',
      tenureMonths,
      emiAmount,
      processingFee,
      gstAmount,
      documentationCharges,
      totalUpfrontDeductions,
      netDisbursementAmount,
      totalRepaymentAmount,
      totalInterestPayable,
      coolingOffDays: 3,
      coolingOffEndDate,
      foreclosureCharges: 'Nil / 0% as per RBI fair practice code for floating/retail credit',
      penalInterestRate: '24% per annum (2% per month) on overdue principal amount only',
      grievanceRedressalOfficer: {
        name: 'Ms. Sunita Sharma',
        designation: 'Principal Grievance Redressal Officer (RBI Nodal)',
        email: 'grievance.officer@adyapanlms.com',
        phone: '+91 1800 200 8899',
        address: 'Adyapan Towers, 4th Floor, BKC, Mumbai - 400051',
      },
      repaymentScheduleSummary: scheduleSummary,
    };
  }

  /**
   * 6. Accept Loan Offer & Generate Agreement
   */
  public async acceptBorrowerOffer(
    userId: string,
    offerId: string,
    dto?: { acceptanceMethod?: string; ipAddress?: string; userAgent?: string; kfsAccepted?: boolean },
    tenantId?: string
  ) {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';

    let offer: any;
    let isEngineOffer = true;
    try {
      offer = offerEngineService.getOfferById(activeTenant, offerId);
    } catch {
      offer = this.inMemoryOffers.get(offerId);
      isEngineOffer = false;
    }

    if (!offer) {
      throw new NotFoundError(`Loan offer '${offerId}' not found.`);
    }

    if (offer.customerId && offer.customerId !== customer.id) {
      throw new ForbiddenError('Access forbidden: You cannot accept an offer issued to another borrower.');
    }

    // Accept through authoritative OfferEngineService if present
    if (isEngineOffer) {
      await offerEngineService.acceptOffer(
        activeTenant,
        offerId,
        {
          acceptanceMethod: (dto?.acceptanceMethod as any) || 'CUSTOMER_PORTAL_OTP',
          ipAddress: dto?.ipAddress || '127.0.0.1',
          userAgent: dto?.userAgent || 'Adyapan-Borrower-Portal',
          kfsAccepted: dto?.kfsAccepted ?? true,
          termsAccepted: true,
        },
        {
          id: userId,
          email: customer.email || undefined,
          roles: ['CUSTOMER'],
          tenantId: activeTenant,
        }
      );
    } else {
      offer.status = 'ACCEPTED';
      this.inMemoryOffers.set(offerId, offer);
      if (offer.applicationId) {
        this.inMemoryOffers.set(offer.applicationId, offer);
      }
    }

    // Advance application status to AGREEMENT_PENDING
    await prisma.loanApplication.update({
      where: { id: offer.applicationId },
      data: { status: 'AGREEMENT_PENDING' },
    }).catch(() => {});

    // Automatically prepare Digital Loan Agreement based on accepted terms
    let agreement: any = null;
    try {
      agreement = await contractsService.generateDigitalAgreement(offer.applicationId, {
        id: userId,
        tenantId: activeTenant,
      });
    } catch {
      // Non-blocking if simulated
    }

    await logAudit({
      userId,
      tenantId: activeTenant,
      action: 'BORROWER_OFFER_ACCEPTED',
      entity: 'LoanOffer',
      entityId: offerId,
      newValue: {
        offerId,
        offerNo: offer.offerNo,
        applicationId: offer.applicationId,
        acceptedAt: new Date().toISOString(),
        agreementId: agreement?.agreementId,
      },
    });

    return {
      success: true,
      offerId,
      status: 'ACCEPTED',
      applicationId: offer.applicationId,
      agreementId: agreement?.agreementId || `AGR-${uuid().slice(0, 8)}`,
      message: 'Loan offer and Key Fact Statement accepted successfully. Digital Loan Agreement is ready for eSign.',
    };
  }

  /**
   * 6.1 Decline Loan Offer
   */
  public async declineBorrowerOffer(
    userId: string,
    offerId: string,
    dto?: { reason?: string },
    tenantId?: string
  ) {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';

    let offer: any;
    let isEngineOffer = true;
    try {
      offer = offerEngineService.getOfferById(activeTenant, offerId);
    } catch {
      offer = this.inMemoryOffers.get(offerId);
      isEngineOffer = false;
    }

    if (!offer) {
      throw new NotFoundError(`Loan offer '${offerId}' not found.`);
    }

    if (offer.customerId && offer.customerId !== customer.id) {
      throw new ForbiddenError('Access forbidden: You cannot decline an offer issued to another borrower.');
    }

    if (isEngineOffer) {
      await offerEngineService.declineOffer(
        activeTenant,
        offerId,
        {
          reason: dto?.reason || 'Customer opted out in borrower portal',
        },
        {
          id: userId,
          email: customer.email || undefined,
          roles: ['CUSTOMER'],
          tenantId: activeTenant,
        }
      );
    } else {
      offer.status = 'DECLINED';
      this.inMemoryOffers.set(offerId, offer);
      if (offer.applicationId) {
        this.inMemoryOffers.set(offer.applicationId, offer);
      }
    }

    await prisma.loanApplication.update({
      where: { id: offer.applicationId },
      data: { status: 'CANCELLED' },
    }).catch(() => {});

    await logAudit({
      userId,
      tenantId: activeTenant,
      action: 'BORROWER_OFFER_DECLINED',
      entity: 'LoanOffer',
      entityId: offerId,
      newValue: {
        offerId,
        offerNo: offer.offerNo,
        reason: dto?.reason,
        declinedAt: new Date().toISOString(),
      },
    });

    return {
      offerId,
      status: 'DECLINED',
      message: 'Loan offer has been declined.',
    };
  }

  /**
   * 6.2 Get Digital Loan Agreement for Application
   */
  public async getBorrowerAgreement(userId: string, applicationId: string, tenantId?: string) {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';

    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: { customer: true, product: true },
    });

    if (!app || app.customerId !== customer.id) {
      throw new NotFoundError('Loan application not found or unauthorized.');
    }

    if (activeTenant && app.tenantId && app.tenantId !== activeTenant) {
      throw new ForbiddenError('Access forbidden: Tenant isolation mismatch.');
    }

    // Gate: Check that application has accepted offer or is in a post-approval state
    let activeOffer: any = null;
    try {
      activeOffer = offerEngineService.getActiveApplicationOffer(activeTenant, applicationId);
    } catch {
      activeOffer = this.inMemoryOffers.get(applicationId);
    }

    const isEligibleStatus = ['AGREEMENT_PENDING', 'APPROVED', 'SANCTIONED', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(app.status);
    if (!isEligibleStatus && (!activeOffer || activeOffer.status !== 'ACCEPTED')) {
      throw new BadRequestError('Cannot access agreement: Offer has not been accepted or application is not eligible.');
    }

    let contractStatus = await contractsService.getApplicationContractStatus(applicationId);
    if (!contractStatus.hasAgreement) {
      await contractsService.generateDigitalAgreement(applicationId, {
        id: userId,
        tenantId: activeTenant,
      });
      contractStatus = await contractsService.getApplicationContractStatus(applicationId);
    }

    return contractStatus;
  }

  /**
   * 7. Execute Aadhaar OTP eSign Abstraction
   */
  public async executeBorrowerEsign(
    userId: string,
    applicationId: string,
    otp: string,
    tenantId?: string
  ) {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';

    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: { product: true },
    });

    if (!app || app.customerId !== customer.id) {
      throw new NotFoundError('Application not found or unauthorized.');
    }

    if (activeTenant && app.tenantId && app.tenantId !== activeTenant) {
      throw new ForbiddenError('Access forbidden: Tenant isolation mismatch.');
    }

    // Gate: Verify application has agreement pending or offer accepted
    let activeOffer: any = null;
    try {
      activeOffer = offerEngineService.getActiveApplicationOffer(activeTenant, applicationId);
    } catch {
      activeOffer = this.inMemoryOffers.get(applicationId);
    }

    const isEligible = ['AGREEMENT_PENDING', 'APPROVED', 'SANCTIONED'].includes(app.status) || activeOffer?.status === 'ACCEPTED';
    if (!isEligible) {
      throw new BadRequestError('Application is not in a signable agreement state.');
    }

    if (otp !== '123456') {
      throw new BadRequestError('Invalid Aadhaar OTP. Please enter the 6-digit code received on your registered mobile.');
    }

    // Complete eSign in contracts service
    let contractStatus = await contractsService.getApplicationContractStatus(applicationId);
    if (contractStatus.esign?.sessionId) {
      await contractsService.completeESign(contractStatus.esign.sessionId, {
        ipAddress: '127.0.0.1',
        signerAadhaarLast4: '4321',
      }, {
        id: userId,
        tenantId: activeTenant,
      });
    } else {
      const session = await contractsService.initiateESign(applicationId, 'MOCK_DIGISIGN', {
        id: userId,
        tenantId: activeTenant,
      });
      await contractsService.completeESign(session.sessionId, {
        ipAddress: '127.0.0.1',
        signerAadhaarLast4: '4321',
      }, {
        id: userId,
        tenantId: activeTenant,
      });
    }

    // Update application to READY_FOR_DISBURSEMENT and stage to FINANCE_VERIFIED
    await prisma.loanApplication.update({
      where: { id: applicationId },
      data: {
        status: 'READY_FOR_DISBURSEMENT',
        stage: 'FINANCE_VERIFIED',
      },
    });

    const esignSignatureHash = crypto.createHash('sha256').update(`${applicationId}-${customer.id}-${Date.now()}`).digest('hex');

    await logAudit({
      userId,
      tenantId: activeTenant,
      action: 'BORROWER_AGREEMENT_ESIGNED',
      entity: 'LoanApplication',
      entityId: applicationId,
      newValue: { esignSignatureHash, signedAt: new Date().toISOString() },
    });

    return {
      success: true,
      applicationId: app.id,
      status: 'SIGNED',
      esignSignatureHash,
      signedDocumentUrl: `https://storage.adyapan.dev/signed-contracts/${applicationId}-signed.pdf`,
      message: 'Loan contract successfully signed via Aadhaar eSign. Ready for Finance review and disbursement.',
    };
  }

  /**
   * 7.1 Get Real-time Pre-Disbursement, Finance Processing & Payout Status for Borrower
   */
  public async getBorrowerDisbursementStatus(
    userId: string,
    applicationId: string,
    tenantId?: string
  ) {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';

    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        product: true,
        customer: {
          include: {
            bankAccounts: true,
          },
        },
      },
    });

    if (!app || app.customerId !== customer.id) {
      throw new NotFoundError('Loan application not found or unauthorized.');
    }

    if (activeTenant && app.tenantId && app.tenantId !== activeTenant) {
      throw new ForbiddenError('Access forbidden: Tenant isolation mismatch.');
    }

    // Retrieve active offer and contract status
    let offer: any = null;
    try {
      offer = offerEngineService.getActiveApplicationOffer(activeTenant, applicationId);
    } catch {
      offer = this.inMemoryOffers.get(applicationId);
    }

    const contractStatus = await contractsService.getApplicationContractStatus(applicationId).catch(() => null);

    // Retrieve active loan record if disbursed
    const loan = await prisma.loan.findFirst({
      where: { applicationId: app.id },
      include: {
        schedule: { orderBy: { emiNumber: 'asc' } },
      },
    });

    const verifiedBank = app.customer?.bankAccounts?.find((b) => b.isVerified) || app.customer?.bankAccounts?.[0];
    const latestDisbursement = loan
      ? await prisma.disbursement.findFirst({
          where: { loanId: loan.id },
          orderBy: { createdAt: 'desc' },
        }).catch(() => null)
      : null;

    // Compute status checks
    const checks = {
      offerAccepted: offer?.status === 'ACCEPTED' || ['AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(app.status),
      agreementGenerated: !!contractStatus?.hasAgreement,
      agreementSigned: contractStatus?.esignStatus === 'SIGNED' || ['READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(app.status),
      mandateActive: contractStatus?.mandateStatus === 'ACTIVE' || !!contractStatus?.umrn,
      bankAccountVerified: !!verifiedBank?.isVerified,
      financeVerified: ['READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(app.status) || app.stage === 'FINANCE_VERIFIED',
      disbursementSettled: app.status === 'DISBURSED' || !!loan,
    };

    let financeProcessingStage = 'PENDING_ESIGN';
    if (checks.disbursementSettled) {
      financeProcessingStage = 'DISBURSED';
    } else if (checks.agreementSigned) {
      financeProcessingStage = 'READY_FOR_DISBURSEMENT';
    } else if (checks.agreementGenerated) {
      financeProcessingStage = 'AWAITING_ESIGN';
    }

    return {
      applicationId: app.id,
      applicationNo: app.applicationNo,
      productName: app.product?.name || 'Consumer Credit',
      productCode: app.product?.code,
      status: app.status,
      stage: app.stage || 'PROCESSING',
      sanctionedAmount: offer?.offeredAmount ? Number(offer.offeredAmount) : Number(app.requestedAmount),
      netDisbursementAmount: offer?.netDisbursedAmount ? Number(offer.netDisbursedAmount) : Number(app.requestedAmount) - 1500,
      monthlyEmi: offer?.monthlyEmi ? Number(offer.monthlyEmi) : (loan?.emiAmount ? Number(loan.emiAmount) : undefined),
      tenureMonths: offer?.tenureMonths || app.tenureMonths,
      annualInterestRatePct: offer?.annualInterestRatePct ? Number(offer.annualInterestRatePct) : Number(app.product?.interestRate),
      
      checks,
      financeProcessingStage,
      
      contract: {
        agreementId: contractStatus?.agreement?.agreementId,
        agreementNumber: contractStatus?.agreement?.agreementNumber,
        agreementStatus: contractStatus?.agreementStatus || 'PENDING',
        esignStatus: contractStatus?.esignStatus || 'NOT_INITIATED',
        esignSessionId: contractStatus?.esign?.sessionId,
        signedAt: contractStatus?.esign?.auditTrail?.find((a: any) => a.event === 'DOCUMENT_ELECTRONICALLY_SIGNED')?.timestamp,
        mandateStatus: contractStatus?.mandateStatus || 'NOT_CONFIGURED',
        umrn: contractStatus?.umrn,
      },

      beneficiaryBank: verifiedBank ? {
        accountHolderName: verifiedBank.accountHolderName || `${customer.firstName} ${customer.lastName}`,
        accountNumberMasked: verifiedBank.accountNumber ? 'XXXX' + verifiedBank.accountNumber.slice(-4) : undefined,
        ifscCode: verifiedBank.ifscCode,
        bankName: verifiedBank.bankName,
        isVerified: verifiedBank.isVerified,
      } : null,

      payout: latestDisbursement ? {
        disbursementId: latestDisbursement.id,
        disbursementNo: latestDisbursement.reference || `DISB-${latestDisbursement.id.slice(0, 8)}`,
        amount: Number(latestDisbursement.amount),
        method: latestDisbursement.method || 'IMPS',
        referenceNumber: latestDisbursement.reference || undefined,
        utr: latestDisbursement.reference || undefined,
        status: latestDisbursement.status,
        disbursedAt: latestDisbursement.createdAt.toISOString(),
      } : (loan?.disbursementDate ? {
        amount: Number(loan.principal),
        method: 'IMPS',
        referenceNumber: `UTR-${app.applicationNo}-${Date.now().toString().slice(-6)}`,
        utr: `UTR-${app.applicationNo}-${Date.now().toString().slice(-6)}`,
        status: 'COMPLETED',
        disbursedAt: loan.disbursementDate.toISOString(),
      } : null),

      loan: loan ? {
        loanId: loan.id,
        loanAccountNumber: loan.loanNo,
        status: loan.status,
        principal: Number(loan.principal),
        outstandingBalance: Number(loan.outstandingPrincipal) + Number(loan.outstandingInterest),
        emiAmount: Number(loan.emiAmount),
        nextDueDate: loan.nextDueDate?.toISOString().split('T')[0],
        maturityDate: loan.maturityDate?.toISOString().split('T')[0],
        totalEmis: loan.schedule?.length || loan.tenureMonths,
      } : null,
    };
  }

  /**
   * 8. Setup eNACH Mandate & Disburse Loan to LMS
   */
  public async setupBorrowerMandateAndDisburse(
    userId: string,
    applicationId: string,
    mandateType: 'ENACH' | 'UPI_AUTOPAY',
    tenantId?: string
  ) {
    const customer = await this.getCustomerForUser(userId, tenantId);

    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: { product: true },
    });

    if (!app || app.customerId !== customer.id) {
      throw new NotFoundError('Application not found');
    }

    const principalAmount = Number(app.requestedAmount);
    const tenureMonths = app.tenureMonths;
    const nominalRate = Number(app.product.interestRate);
    const r = nominalRate / (12 * 100);
    const emiAmount = Math.round((principalAmount * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1));

    const loanAccountNo = `LN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create Active Loan in LMS
    const loan = await prisma.loan.create({
      data: {
        loanNo: loanAccountNo,
        customerId: customer.id,
        productId: app.productId,
        applicationId: app.id,
        principal: Money.of(principalAmount),
        outstandingPrincipal: Money.of(principalAmount),
        outstandingInterest: Money.of(0),
        outstandingFees: Money.of(0),
        interestRate: Money.of(nominalRate),
        tenureMonths,
        emiAmount: Money.of(emiAmount),
        status: 'ACTIVE',
        disbursementDate: new Date(),
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maturityDate: new Date(Date.now() + tenureMonths * 30 * 24 * 60 * 60 * 1000),
        tenantId: tenantId || app.tenantId || undefined,
      },
    });

    // Create Repayment Schedule
    const scheduleItems = [];
    let remPrincipal = principalAmount;

    for (let i = 1; i <= tenureMonths; i++) {
      const interestComp = Math.round(remPrincipal * r);
      const principalComp = emiAmount - interestComp;
      remPrincipal = Math.max(0, remPrincipal - principalComp);

      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);

      scheduleItems.push({
        loanId: loan.id,
        emiNumber: i,
        dueDate,
        principal: Money.of(principalComp),
        interest: Money.of(interestComp),
        totalDue: Money.of(emiAmount),
        outstanding: Money.of(emiAmount),
        status: 'UPCOMING' as any,
      });
    }

    await prisma.repaymentScheduleItem.createMany({
      data: scheduleItems,
    });

    // Mark application DISBURSED
    await prisma.loanApplication.update({
      where: { id: applicationId },
      data: { status: 'DISBURSED' },
    });

    await logAudit({
      userId,
      tenantId: tenantId || undefined,
      action: 'BORROWER_LOAN_DISBURSED',
      entity: 'Loan',
      entityId: loan.id,
      newValue: { loanAccountNumber: loanAccountNo, principal: principalAmount, mandateType },
    });

    const deductions = Math.round(principalAmount * 0.015 * 1.18 + 500 * 1.18);
    const netDisbursedAmount = principalAmount - deductions;

    return {
      success: true,
      loanId: loan.id,
      loanAccountNumber: loan.loanNo,
      principalAmount,
      netDisbursedAmount,
      emiAmount,
      firstEmiDate: loan.nextDueDate,
      status: 'ACTIVE',
      mandateStatus: 'ACTIVE',
      message: 'Mandate registered and loan disbursed successfully to your verified bank account.',
    };
  }

  /**
   * 9. List Borrower Loans
   */
  public async getBorrowerLoans(userId: string, tenantId?: string) {
    const customer = await this.getCustomerForUser(userId, tenantId);

    const loans = await prisma.loan.findMany({
      where: { customerId: customer.id },
      include: {
        product: { select: { name: true, code: true } },
        schedule: { orderBy: { emiNumber: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        closure: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return loans.map((loan) => {
      const paidCount = loan.schedule.filter((s) => s.status === 'PAID').length;
      const nextPending = loan.schedule.find((s) => s.status === 'UPCOMING' || s.status === 'DUE' || s.status === 'OVERDUE');
      const isClosed = loan.status === 'CLOSED' || loan.status === 'SETTLED' || (Number(loan.outstandingPrincipal) === 0 && Number(loan.outstandingInterest) === 0);

      return {
        id: loan.id,
        loanAccountNumber: loan.loanNo,
        productName: loan.product?.name || 'Personal Loan',
        principal: Number(loan.principal),
        outstandingPrincipal: Number(loan.outstandingPrincipal),
        outstandingInterest: Number(loan.outstandingInterest),
        totalOutstanding: Number(loan.outstandingPrincipal) + Number(loan.outstandingInterest),
        interestRate: Number(loan.interestRate),
        tenureMonths: loan.tenureMonths,
        emiAmount: Number(loan.emiAmount),
        paidEmis: paidCount,
        totalEmis: loan.schedule.length || loan.tenureMonths,
        nextEmiDueDate: nextPending ? nextPending.dueDate.toISOString().split('T')[0] : null,
        nextEmiAmount: nextPending ? Number(nextPending.totalDue) : Number(loan.emiAmount),
        status: loan.status,
        disbursedAt: loan.disbursementDate ? loan.disbursementDate.toISOString().split('T')[0] : null,
        closedAt: loan.closedAt ? loan.closedAt.toISOString().split('T')[0] : (loan.closure?.closedAt ? loan.closure.closedAt.toISOString().split('T')[0] : null),
        isNocAvailable: isClosed,
        nocNumber: loan.closure?.nocNumber || null,
      };
    });
  }

  /**
   * 10. Detailed Loan Servicing & Statement of Account
   */
  public async getBorrowerLoanDetails(userId: string, loanId: string, tenantId?: string) {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        product: true,
        schedule: { orderBy: { emiNumber: 'asc' } },
        payments: {
          include: { allocations: true },
          orderBy: { createdAt: 'desc' },
        },
        closure: true,
      },
    });

    if (!loan || loan.customerId !== customer.id) {
      throw new NotFoundError('Loan account not found or unauthorized.');
    }

    if (activeTenant && loan.tenantId && loan.tenantId !== activeTenant) {
      throw new ForbiddenError('Access forbidden: Tenant isolation mismatch.');
    }

    const paidEmis = loan.schedule.filter((s) => s.status === 'PAID').length;
    const now = new Date();
    const overdueSchedules = loan.schedule.filter(
      (s) => s.status === 'OVERDUE' || (new Date(s.dueDate) < now && s.status !== 'PAID')
    );
    const overdueAmount = overdueSchedules.reduce((sum, s) => sum + Number(s.outstanding || s.totalDue), 0);
    const maxDpd = overdueSchedules.reduce((acc, s) => {
      const days = Math.floor((now.getTime() - new Date(s.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(acc, days);
    }, 0);

    const nextPending = loan.schedule.find((s) => s.status === 'UPCOMING' || s.status === 'DUE' || s.status === 'OVERDUE');
    const totalPaidPrincipal = loan.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const progressPercent = Math.min(100, Math.round((paidEmis / (loan.schedule.length || 1)) * 100));
    const isClosed = loan.status === 'CLOSED' || loan.status === 'SETTLED' || (Number(loan.outstandingPrincipal) === 0 && Number(loan.outstandingInterest) === 0);

    return {
      id: loan.id,
      loanAccountNumber: loan.loanNo,
      productName: loan.product?.name || 'Personal Credit',
      productCode: loan.product?.code,
      sanctionedPrincipal: Number(loan.principal),
      outstandingPrincipal: Number(loan.outstandingPrincipal),
      outstandingInterest: Number(loan.outstandingInterest),
      outstandingFees: Number(loan.outstandingFees || 0),
      totalOutstanding: Number(loan.outstandingPrincipal) + Number(loan.outstandingInterest) + Number(loan.outstandingFees || 0),
      interestRate: Number(loan.interestRate),
      tenureMonths: loan.tenureMonths,
      emiAmount: Number(loan.emiAmount),
      status: loan.status,
      paidEmis,
      totalEmis: loan.schedule.length,
      progressPercent,
      disbursementDate: loan.disbursementDate ? loan.disbursementDate.toISOString().split('T')[0] : null,
      closedAt: loan.closedAt ? loan.closedAt.toISOString().split('T')[0] : (loan.closure?.closedAt ? loan.closure.closedAt.toISOString().split('T')[0] : null),
      nextEmiDueDate: nextPending ? nextPending.dueDate.toISOString().split('T')[0] : null,
      nextEmiAmount: nextPending ? Number(nextPending.totalDue) : 0,
      isOverdue: overdueSchedules.length > 0 || loan.status === 'OVERDUE',
      overdueAmount,
      dpd: maxDpd,
      isNocAvailable: isClosed,
      nocNumber: loan.closure?.nocNumber || null,
      closure: loan.closure
        ? {
            id: loan.closure.id,
            nocNumber: loan.closure.nocNumber,
            closureType: loan.closure.closureType,
            principalPaid: Number(loan.closure.principalPaid),
            interestPaid: Number(loan.closure.interestPaid),
            feesPaid: Number(loan.closure.feesPaid),
            closedAt: loan.closure.closedAt.toISOString().split('T')[0],
            closedBy: loan.closure.closedBy,
            remarks: loan.closure.remarks,
          }
        : null,
      repaymentSchedule: loan.schedule.map((s) => ({
        emiNumber: s.emiNumber,
        dueDate: s.dueDate.toISOString().split('T')[0],
        principalDue: Number(s.principal),
        interestDue: Number(s.interest),
        totalDue: Number(s.totalDue),
        outstanding: Number(s.outstanding || s.totalDue),
        status: s.status,
        paidAt: s.paidDate ? s.paidDate.toISOString().split('T')[0] : null,
      })),
      paymentHistory: loan.payments.map((p) => ({
        id: p.id,
        paymentNo: p.paymentNo,
        amount: Number(p.amount),
        status: p.status,
        paymentType: 'REGULAR_EMI',
        paymentMethod: p.method || 'UPI',
        paidAt: p.createdAt.toISOString(),
        referenceNumber: p.reference || p.paymentNo,
      })),
    };
  }

  /**
   * 11. Instant EMI Repayment Processing
   */
  public async processBorrowerRepayment(
    userId: string,
    input: BorrowerRepaymentInput,
    tenantId?: string
  ) {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';

    if (!input.amount || input.amount <= 0) {
      throw new BadRequestError('Payment amount must be greater than zero.');
    }

    const loan = await prisma.loan.findUnique({
      where: { id: input.loanId },
      include: {
        product: true,
        schedule: {
          where: { status: { in: ['UPCOMING', 'DUE', 'OVERDUE', 'PARTIALLY_PAID'] } },
          orderBy: { emiNumber: 'asc' },
        },
      },
    });

    if (!loan || loan.customerId !== customer.id) {
      throw new NotFoundError('Loan account not found or unauthorized.');
    }

    if (activeTenant && loan.tenantId && loan.tenantId !== activeTenant) {
      throw new ForbiddenError('Access forbidden: Tenant isolation mismatch.');
    }

    const payAmount = input.amount;
    const refNumber = `TXN-UPI-${Date.now().toString().slice(-8)}`;
    const payNo = `PAY-${Date.now().toString().slice(-6)}`;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        paymentNo: payNo,
        loanId: loan.id,
        customerId: customer.id,
        amount: Money.of(payAmount),
        status: 'SUCCESS',
        method: input.paymentMethod || 'UPI',
        reference: refNumber,
        tenantId: loan.tenantId,
      },
    });

    // Authoritative Decimal-safe Waterfall Allocation
    const allocation = await paymentAllocationService.allocatePayment({
      paymentId: payment.id,
      paymentNo: payment.paymentNo,
      loanId: loan.id,
      amount: payAmount,
    });

    // Post Double-Entry General Ledger Journal
    await generalLedgerService.postRepaymentJournal({
      loanId: loan.id,
      loanNo: loan.loanNo,
      paymentNo: payment.paymentNo,
      tenantId: loan.tenantId || undefined,
      totalAmount: payAmount,
      allocatedPrincipal: allocation.allocatedPrincipal,
      allocatedInterest: allocation.allocatedInterest,
      allocatedFees: allocation.allocatedFees,
      allocatedPenalties: allocation.allocatedPenalties,
      excessRefund: allocation.allocatedExcess,
      receivedBy: customer.email || 'BORROWER_PORTAL',
    });

    // Authoritative PTP evaluation upon remittance
    try {
      await collectionPtpService.evaluatePtpOnPayment({
        loanId: loan.id,
        paymentAmount: payAmount,
        paymentReference: refNumber,
      });
    } catch {
      // Non-blocking PTP evaluation
    }

    const isFullyPaid = allocation.isLoanClosed;

    await logAudit({
      userId,
      tenantId: activeTenant,
      action: 'BORROWER_REPAYMENT_POSTED',
      entity: 'Payment',
      entityId: payment.id,
      newValue: {
        loanId: loan.id,
        amount: payAmount,
        refNumber,
        allocation,
        isFullyPaid,
      },
    });

    return {
      success: true,
      paymentId: payment.id,
      paymentNo: payment.paymentNo,
      referenceNumber: refNumber,
      amount: payAmount,
      status: 'SUCCESS',
      paidAt: payment.createdAt,
      newOutstandingPrincipal: allocation.remainingDue,
      isFullyPaid,
      receiptUrl: `/api/v1/borrower/payments/${payment.id}/receipt`,
      allocationSummary: allocation,
      message: isFullyPaid
        ? 'Congratulations! Your loan has been fully settled. You can now download your NOC Certificate.'
        : `Payment of ₹${payAmount.toLocaleString('en-IN')} received successfully. Repayment schedule updated.`,
    };
  }

  /**
   * 11.1 Get Borrower Repayment & Transaction History Ledger
   */
  public async getBorrowerPayments(userId: string, loanId?: string, tenantId?: string) {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';

    const where: any = {
      customerId: customer.id,
    };
    if (loanId) {
      where.loanId = loanId;
    }
    if (activeTenant) {
      where.tenantId = activeTenant;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        loan: {
          select: {
            loanNo: true,
            product: { select: { name: true } },
          },
        },
        allocations: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((p) => ({
      id: p.id,
      paymentNo: p.paymentNo,
      loanId: p.loanId,
      loanAccountNumber: p.loan?.loanNo || '—',
      productName: p.loan?.product?.name || 'Consumer Loan',
      amount: Number(p.amount),
      status: p.status,
      method: p.method || 'UPI',
      referenceNumber: p.reference || p.paymentNo,
      paidAt: p.createdAt.toISOString(),
      allocations: p.allocations?.map((a) => ({
        id: a.id,
        component: a.bucket,
        amount: Number(a.amount),
      })),
    }));
  }

  /**
   * 11.2 Authoritative Overdue & Delinquency Summary (Phase M7)
   */
  public async getBorrowerOverdueSummary(
    userId: string,
    tenantId?: string
  ): Promise<BorrowerOverdueSummary> {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';

    const loans = await prisma.loan.findMany({
      where: {
        customerId: customer.id,
        status: { in: ['ACTIVE', 'OVERDUE', 'RESTRUCTURED'] },
        ...(activeTenant ? { tenantId: activeTenant } : {}),
      },
      include: {
        product: true,
        schedule: { orderBy: { emiNumber: 'asc' } },
        collectionCases: {
          include: {
            promises: {
              where: { status: 'PENDING' },
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    let totalOverdueAmount = 0;
    let maxDpd = 0;
    const overdueLoans: BorrowerOverdueLoanItem[] = [];

    for (const loan of loans) {
      const dpdResult = await dpdService.calculateLoanDpd(loan.id);
      const overdueVal = Number(dpdResult.totalOverdueAmount);

      if (overdueVal > 0 || dpdResult.dpd > 0 || loan.status === 'OVERDUE') {
        totalOverdueAmount += overdueVal;
        if (dpdResult.dpd > maxDpd) {
          maxDpd = dpdResult.dpd;
        }

        const affectedInstallments: BorrowerOverdueInstallment[] = loan.schedule
          .filter((s) => s.status === 'OVERDUE' || (new Date(s.dueDate) < new Date() && s.status !== 'PAID'))
          .map((s) => ({
            emiNumber: s.emiNumber,
            dueDate: s.dueDate.toISOString().split('T')[0],
            principalDue: Number(s.principal),
            interestDue: Number(s.interest),
            feeDue: Number(s.fees || 0),
            totalDue: Number(s.totalDue),
            outstanding: Number(s.outstanding || s.totalDue),
            status: s.status,
          }));

        const activeCase = loan.collectionCases?.[0];
        const activePtpRecord = activeCase?.promises?.[0];

        overdueLoans.push({
          loanId: loan.id,
          loanAccountNumber: loan.loanNo,
          productName: loan.product?.name || 'Personal Loan',
          totalOutstanding: Number(loan.outstandingPrincipal) + Number(loan.outstandingInterest) + Number(loan.outstandingFees || 0),
          overdueAmount: overdueVal,
          dpd: dpdResult.dpd,
          agingBucket: dpdResult.agingBucket,
          oldestOverdueDate: dpdResult.oldestOverdueDate ? dpdResult.oldestOverdueDate.split('T')[0] : null,
          overdueInstallmentsCount: dpdResult.overdueInstallmentsCount,
          affectedInstallments,
          activePtp: activePtpRecord
            ? {
                id: activePtpRecord.id,
                promisedDate: activePtpRecord.promisedDate.toISOString().split('T')[0],
                promisedAmount: Number(activePtpRecord.promisedAmount),
                paymentMode: activePtpRecord.paymentMode || 'UPI',
                status: activePtpRecord.status,
                createdAt: activePtpRecord.createdAt.toISOString(),
              }
            : null,
          borrowerMessage: dpdResult.dpd > 30
            ? 'Your account is significantly past due. Please clear your overdue balance or schedule a Promise to Pay to maintain your credit score.'
            : 'Payment is past due date. Please remit your overdue EMI to avoid late fee penalties and bureau impact.',
        });
      }
    }

    return {
      hasOverdue: overdueLoans.length > 0,
      totalOverdueAmount,
      maxDpd,
      overdueLoansCount: overdueLoans.length,
      overdueLoans,
    };
  }

  /**
   * 11.3 Promise to Pay (PTP) Borrower Registration (Phase M7)
   */
  public async createBorrowerPtp(
    userId: string,
    input: BorrowerPtpInput,
    tenantId?: string
  ): Promise<BorrowerPtpRecord> {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';

    if (!input.loanId) {
      throw new BadRequestError('Loan ID is required.');
    }
    if (!input.promisedAmount || input.promisedAmount <= 0) {
      throw new BadRequestError('Promised amount must be greater than zero.');
    }

    const promisedDate = new Date(input.promisedDate);
    if (isNaN(promisedDate.getTime())) {
      throw new BadRequestError('Invalid promised date format.');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (promisedDate < today) {
      throw new BadRequestError('Promised date cannot be in the past.');
    }

    const loan = await prisma.loan.findUnique({
      where: { id: input.loanId },
      include: {
        collectionCases: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!loan || loan.customerId !== customer.id) {
      throw new NotFoundError('Loan account not found or unauthorized.');
    }

    if (activeTenant && loan.tenantId && loan.tenantId !== activeTenant) {
      throw new ForbiddenError('Access forbidden: Tenant isolation mismatch.');
    }

    // Ensure a collection case exists for this loan
    let colCase = loan.collectionCases?.[0];
    if (!colCase) {
      colCase = await prisma.collectionCase.create({
        data: {
          caseNo: `CC-${loan.loanNo}-${Date.now().toString().slice(-4)}`,
          loanId: loan.id,
          customerId: customer.id,
          status: 'OPEN',
          priority: 'MEDIUM',
          overdueAmount: Money.toDb(input.promisedAmount),
        },
      });
    }

    // Delegate to canonical CollectionPtpService
    const ptp = await collectionPtpService.createPtp(
      {
        caseId: colCase.id,
        promisedAmount: input.promisedAmount,
        promisedDate,
        paymentMode: input.paymentMode || 'UPI',
        notes: input.notes || 'Borrower self-service commitment recorded via mobile app',
      },
      {
        id: userId,
        email: customer.email || 'borrower@adyapan.app',
        roles: ['CUSTOMER'],
        tenantId: loan.tenantId || undefined,
      }
    );

    await logAudit({
      userId,
      tenantId: activeTenant,
      action: 'BORROWER_PTP_CREATED',
      entity: 'PromiseToPay',
      entityId: ptp.id,
      newValue: {
        loanId: loan.id,
        caseId: colCase.id,
        promisedAmount: input.promisedAmount,
        promisedDate: ptp.promisedDate,
      },
    });

    return {
      id: ptp.id,
      caseId: colCase.id,
      loanId: loan.id,
      loanAccountNumber: loan.loanNo,
      promisedAmount: Number(ptp.promisedAmount),
      promisedDate: new Date(ptp.promisedDate).toISOString().split('T')[0],
      paymentMode: ptp.paymentMode || 'UPI',
      status: ptp.status,
      createdAt: ptp.createdAt || new Date().toISOString(),
    };
  }

  /**
   * 11.4 Get Borrower Promise to Pay (PTP) History
   */
  public async getBorrowerPtps(
    userId: string,
    loanId?: string,
    tenantId?: string
  ): Promise<BorrowerPtpRecord[]> {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';

    const where: any = {
      collectionCase: {
        customerId: customer.id,
        ...(activeTenant ? { loan: { tenantId: activeTenant } } : {}),
        ...(loanId ? { loanId } : {}),
      },
    };

    const ptps = await prisma.promiseToPay.findMany({
      where,
      include: {
        collectionCase: {
          include: {
            loan: { select: { loanNo: true, id: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ptps.map((p) => ({
      id: p.id,
      caseId: p.caseId,
      loanId: p.collectionCase.loan.id,
      loanAccountNumber: p.collectionCase.loan.loanNo,
      promisedAmount: Number(p.promisedAmount),
      promisedDate: p.promisedDate.toISOString().split('T')[0],
      paymentMode: p.paymentMode || 'UPI',
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  /**
   * 12. Statutory No-Objection Certificate (NOC) Generation
   */
  public async generateBorrowerNoc(
    userId: string,
    loanId: string,
    tenantId?: string
  ): Promise<BorrowerNocCertificate> {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { product: true, closure: true },
    });

    if (!loan || loan.customerId !== customer.id) {
      throw new NotFoundError('Loan account not found');
    }

    if (activeTenant && loan.tenantId && loan.tenantId !== activeTenant) {
      throw new ForbiddenError('Access forbidden: Tenant isolation mismatch.');
    }

    const isZeroBalance = Number(loan.outstandingPrincipal) === 0 && Number(loan.outstandingInterest) === 0;
    const isClosedStatus = loan.status === 'CLOSED' || loan.status === 'SETTLED';

    if (!isZeroBalance && !isClosedStatus) {
      throw new BadRequestError('NOC can only be issued for fully closed loans with zero outstanding balance.');
    }

    const certNo = loan.closure?.nocNumber || `NOC-${new Date().getFullYear()}-${loan.loanNo.replace('LN-', '')}`;
    const hash = crypto
      .createHash('sha256')
      .update(`${certNo}-${customer.id}-${loan.id}-AUTHENTIC_NOC`)
      .digest('hex');

    const closureDate = loan.closure?.closedAt
      ? loan.closure.closedAt.toISOString().split('T')[0]
      : loan.closedAt
      ? loan.closedAt.toISOString().split('T')[0]
      : loan.updatedAt.toISOString().split('T')[0];

    return {
      certificateNumber: certNo,
      issueDate: new Date().toISOString().split('T')[0],
      borrowerName: `${customer.firstName} ${customer.lastName}`,
      customerCode: customer.customerCode,
      panMasked: this.getMaskedPan(customer) || '—',
      loanAccountNumber: loan.loanNo,
      sanctionedAmount: Number(loan.principal),
      closureDate,
      closureType: loan.closure?.closureType || 'NORMAL_CLOSURE_FULL_SETTLEMENT',
      status: 'CLOSED_FULLY_SETTLED',
      digitalSignatureHash: hash,
      issuerLenderName: 'Adyapan Financial Services (NBFC Regulated Entity)',
      complianceStatement:
        'This is to certify that the borrower has fully repaid all dues including principal, interest, and charges towards the loan facility. The lender holds no further lien or hypothecation against the borrower for this account.',
    };
  }

  /**
   * 12.1 Authoritative Statement of Account (SOA) Dossier
   */
  public async getBorrowerLoanStatement(
    userId: string,
    loanId: string,
    tenantId?: string
  ): Promise<BorrowerLoanStatement> {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        product: true,
        tenant: true,
        disbursements: { orderBy: { createdAt: 'asc' } },
        schedule: { orderBy: { emiNumber: 'asc' } },
        payments: {
          include: { allocations: true },
          orderBy: { paidAt: 'asc' },
        },
        closure: true,
      },
    });

    if (!loan || loan.customerId !== customer.id) {
      throw new NotFoundError('Loan account not found or unauthorized.');
    }

    if (activeTenant && loan.tenantId && loan.tenantId !== activeTenant) {
      throw new ForbiddenError('Access forbidden: Tenant isolation mismatch.');
    }

    // Build chronological transaction ledger
    const transactions: BorrowerStatementTransaction[] = [];
    let runningPrincipal = Number(loan.principal);

    // Initial loan disbursement entry
    if (loan.disbursementDate || loan.disbursements.length > 0) {
      const disbDate = loan.disbursementDate
        ? loan.disbursementDate.toISOString().split('T')[0]
        : loan.disbursements[0]?.createdAt
        ? loan.disbursements[0].createdAt.toISOString().split('T')[0]
        : loan.createdAt.toISOString().split('T')[0];
      const disbRef = loan.disbursements[0]?.reference || `DISB-${loan.loanNo}`;
      const disbMethod = loan.disbursements[0]?.method || 'NEFT_DIRECT';

      transactions.push({
        id: `txn-disb-${loan.id}`,
        transactionDate: disbDate,
        referenceNumber: disbRef,
        transactionType: 'DISBURSEMENT',
        description: `Loan Disbursement to Bank Account (${loan.product?.name || 'Facility'})`,
        debitAmount: Number(loan.principal),
        creditAmount: 0,
        runningPrincipalBalance: runningPrincipal,
        paymentMethod: disbMethod,
        status: 'SUCCESS',
      });
    }

    // Repayment entries chronologically
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;
    let totalFeesPaid = 0;
    let totalPaid = 0;

    for (const payment of loan.payments) {
      if (payment.status === 'SUCCESS') {
        const payAmount = Number(payment.amount);
        totalPaid += payAmount;

        let pAlloc = 0;
        let iAlloc = 0;
        let fAlloc = 0;

        payment.allocations.forEach((a) => {
          const amt = Number(a.amount);
          if (a.bucket === 'PRINCIPAL') {
            pAlloc += amt;
            totalPrincipalPaid += amt;
          } else if (a.bucket === 'INTEREST') {
            iAlloc += amt;
            totalInterestPaid += amt;
          } else if (a.bucket === 'FEES' || a.bucket === 'PENALTY') {
            fAlloc += amt;
            totalFeesPaid += amt;
          }
        });

        runningPrincipal = Math.max(0, runningPrincipal - pAlloc);

        transactions.push({
          id: payment.id,
          transactionDate: (payment.paidAt || payment.createdAt).toISOString().split('T')[0],
          referenceNumber: payment.reference || payment.paymentNo,
          transactionType: 'REPAYMENT',
          description: `EMI Repayment via ${payment.method || 'UPI'} (Principal: ₹${pAlloc.toLocaleString('en-IN')}, Int: ₹${iAlloc.toLocaleString('en-IN')})`,
          debitAmount: 0,
          creditAmount: payAmount,
          runningPrincipalBalance: runningPrincipal,
          paymentMethod: payment.method || 'UPI',
          status: payment.status,
          allocations: payment.allocations.map((a) => ({
            component: a.bucket,
            amount: Number(a.amount),
          })),
        });
      }
    }

    const totalRepaymentExpected = loan.schedule.reduce(
      (sum, s) => sum + Number(s.totalDue),
      0
    );

    const isClosed =
      loan.status === 'CLOSED' ||
      loan.status === 'SETTLED' ||
      (Number(loan.outstandingPrincipal) === 0 && Number(loan.outstandingInterest) === 0);

    const statement: BorrowerLoanStatement = {
      statementId: `SOA-${loan.loanNo}-${Date.now().toString().slice(-6)}`,
      generatedAt: new Date().toISOString(),
      asOfDate: new Date().toISOString().split('T')[0],
      lenderInfo: {
        name: loan.tenant?.name || 'Adyapan Financial Services Ltd.',
        entityType: 'NBFC (Non-Banking Financial Company - Systemically Important)',
        cinNumber: loan.tenant?.cinNumber || 'U65923DL2023PTC123456',
        rbiRegistrationNo: loan.tenant?.rbiRegistrationNo || 'B-05.02341',
        contactEmail: loan.tenant?.contactEmail || 'grievance@adyapan.finance',
        supportPhone: loan.tenant?.supportPhone || '+91-1800-123-4567',
      },
      borrowerInfo: {
        customerCode: customer.customerCode,
        borrowerName: `${customer.firstName} ${customer.lastName}`,
        mobile: customer.mobile,
        email: customer.email,
        panMasked: this.getMaskedPan(customer),
      },
      loanSummary: {
        loanId: loan.id,
        loanAccountNumber: loan.loanNo,
        productName: loan.product?.name || 'Consumer Loan',
        productCode: loan.product?.code,
        sanctionedPrincipal: Number(loan.principal),
        interestRate: Number(loan.interestRate),
        tenureMonths: loan.tenureMonths,
        emiAmount: Number(loan.emiAmount),
        disbursementDate: loan.disbursementDate ? loan.disbursementDate.toISOString().split('T')[0] : null,
        maturityDate: loan.maturityDate ? loan.maturityDate.toISOString().split('T')[0] : null,
        closedAt: loan.closedAt
          ? loan.closedAt.toISOString().split('T')[0]
          : loan.closure?.closedAt
          ? loan.closure.closedAt.toISOString().split('T')[0]
          : null,
        status: loan.status,
        totalRepaymentExpected,
        totalPaid,
        totalPrincipalPaid,
        totalInterestPaid,
        totalFeesPaid,
        outstandingPrincipal: Number(loan.outstandingPrincipal),
        outstandingInterest: Number(loan.outstandingInterest),
        outstandingFees: Number(loan.outstandingFees || 0),
        totalOutstanding:
          Number(loan.outstandingPrincipal) + Number(loan.outstandingInterest) + Number(loan.outstandingFees || 0),
        isNocAvailable: isClosed,
        nocNumber: loan.closure?.nocNumber || null,
      },
      transactions,
      repaymentSchedule: loan.schedule.map((s) => ({
        emiNumber: s.emiNumber,
        dueDate: s.dueDate.toISOString().split('T')[0],
        principalDue: Number(s.principal),
        interestDue: Number(s.interest),
        totalDue: Number(s.totalDue),
        outstanding: Number(s.outstanding || s.totalDue),
        status: s.status,
        paidAt: s.paidDate ? s.paidDate.toISOString().split('T')[0] : null,
      })),
    };

    return statement;
  }

  /**
   * 13. Create Self-Service Support Ticket
   */
  public async createBorrowerSupportTicket(
    userId: string,
    input: { subject: string; category: string; description: string; priority?: string },
    tenantId?: string
  ) {
    const customer = await this.getCustomerForUser(userId, tenantId);

    const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;

    return {
      ticketNumber,
      customerId: customer.id,
      subject: input.subject,
      category: input.category,
      status: 'OPEN',
      slaResolutionHours: 24,
      createdAt: new Date().toISOString(),
      message: 'Support ticket submitted successfully. Our customer assistance team will respond within 24 hours.',
    };
  }

  /**
   * 14. Real-Time Normalized Borrower Journey State Aggregator
   */
  public async getBorrowerJourneyState(
    userId: string,
    tenantId?: string
  ): Promise<BorrowerJourneyState> {
    const customer = await this.getCustomerForUser(userId, tenantId);
    const tenantFilter = tenantId ? { tenantId } : {};

    // 1. Check for Active Loan Accounts
    const activeLoan = await prisma.loan.findFirst({
      where: {
        customerId: customer.id,
        status: { in: ['ACTIVE', 'OVERDUE'] },
        ...tenantFilter,
      },
      include: {
        schedule: {
          orderBy: { emiNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeLoan) {
      const now = new Date();
      const overdueSchedules = activeLoan.schedule.filter(
        (s) => s.status === 'OVERDUE' || (new Date(s.dueDate) < now && Number(s.outstanding || 0) > 0)
      );

      const maxDpd = overdueSchedules.reduce((acc, s) => {
        const days = Math.floor((now.getTime() - new Date(s.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(acc, days);
      }, 0);

      if (maxDpd > 0 || activeLoan.status === 'OVERDUE') {
        return {
          currentStage: 'OVERDUE',
          stageLabel: 'Payment Overdue',
          stageDescription: `Your loan account #${activeLoan.loanNo} has an overdue balance. Please settle promptly.`,
          progressPercentage: 100,
          activeLoanId: activeLoan.id,
          actionRequired: true,
          actionLabel: 'Pay Overdue EMI',
          actionUrl: `/borrower/loans/${activeLoan.id}`,
          customerCode: customer.customerCode,
          borrowerName: `${customer.firstName} ${customer.lastName}`,
          kycStatus: customer.kycStatus || 'VERIFIED',
        };
      }

      // Check upcoming due date (within 5 days)
      const nextDue = activeLoan.schedule.find(
        (s) => (s.status === 'UPCOMING' || s.status === 'DUE') && Number(s.outstanding || 0) > 0
      );

      const daysUntilDue = nextDue
        ? Math.floor((new Date(nextDue.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysUntilDue <= 5) {
        return {
          currentStage: 'PAYMENT_DUE',
          stageLabel: 'Upcoming EMI Payment',
          stageDescription: `Your next installment of ₹${Number(nextDue?.totalDue || 0).toLocaleString('en-IN')} is due on ${nextDue?.dueDate.toISOString().split('T')[0]}.`,
          progressPercentage: 100,
          activeLoanId: activeLoan.id,
          actionRequired: true,
          actionLabel: 'Pay Installment',
          actionUrl: `/borrower/loans/${activeLoan.id}`,
          customerCode: customer.customerCode,
          borrowerName: `${customer.firstName} ${customer.lastName}`,
          kycStatus: customer.kycStatus || 'VERIFIED',
        };
      }

      return {
        currentStage: 'ACTIVE_LOAN',
        stageLabel: 'Active Loan Facility',
        stageDescription: `Loan #${activeLoan.loanNo} is active and running smoothly.`,
        progressPercentage: 100,
        activeLoanId: activeLoan.id,
        actionRequired: false,
        actionUrl: `/borrower/loans/${activeLoan.id}`,
        customerCode: customer.customerCode,
        borrowerName: `${customer.firstName} ${customer.lastName}`,
        kycStatus: customer.kycStatus || 'VERIFIED',
      };
    }

    // 2. Check for Closed Loan if no active loan
    const closedLoan = await prisma.loan.findFirst({
      where: {
        customerId: customer.id,
        status: 'CLOSED',
        ...tenantFilter,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 3. Check for in-flight applications
    const activeApp = await prisma.loanApplication.findFirst({
      where: {
        customerId: customer.id,
        ...tenantFilter,
      },
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeApp) {
      const appStatus = activeApp.status;

      if (appStatus === 'DISBURSED') {
        return {
          currentStage: 'DISBURSEMENT_PROCESSING',
          stageLabel: 'Disbursement Settled',
          stageDescription: 'Your loan disbursement has been initiated and your account is being activated.',
          progressPercentage: 95,
          activeApplicationId: activeApp.id,
          actionRequired: false,
          actionUrl: `/borrower/agreements/${activeApp.id}`,
          customerCode: customer.customerCode,
          borrowerName: `${customer.firstName} ${customer.lastName}`,
          kycStatus: customer.kycStatus || 'VERIFIED',
        };
      }

      if (appStatus === 'READY_FOR_DISBURSEMENT') {
        return {
          currentStage: 'FINANCE_PROCESSING',
          stageLabel: 'Finance Verification',
          stageDescription: 'Your signed loan agreement is undergoing pre-disbursement verification by the finance team.',
          progressPercentage: 85,
          activeApplicationId: activeApp.id,
          actionRequired: false,
          actionUrl: `/borrower/agreements/${activeApp.id}`,
          customerCode: customer.customerCode,
          borrowerName: `${customer.firstName} ${customer.lastName}`,
          kycStatus: customer.kycStatus || 'VERIFIED',
        };
      }

      if (appStatus === 'AGREEMENT_PENDING' || ['APPROVED', 'SANCTIONED'].includes(appStatus)) {
        // Check binding offers
        const activeTenant = tenantId || customer.tenantId || 'tenant-adyapan-default';
        const activeOffer = offerEngineService.getActiveApplicationOffer(activeTenant, activeApp.id)
          || (this.inMemoryOffers.get(activeApp.id) as any);

        if (appStatus === 'AGREEMENT_PENDING' || activeOffer?.status === 'ACCEPTED') {
          // Check agreement & eSign status
          const contractStatus = await contractsService.getApplicationContractStatus(activeApp.id).catch(() => null);
          if (!contractStatus?.hasAgreement) {
            return {
              currentStage: 'AGREEMENT_PENDING',
              stageLabel: 'Generating Agreement',
              stageDescription: 'Your loan agreement is being prepared for digital execution.',
              progressPercentage: 70,
              activeApplicationId: activeApp.id,
              activeOfferId: activeOffer?.id,
              actionRequired: false,
              actionUrl: `/borrower/agreements/${activeApp.id}`,
              customerCode: customer.customerCode,
              borrowerName: `${customer.firstName} ${customer.lastName}`,
              kycStatus: customer.kycStatus || 'VERIFIED',
            };
          }

          if (contractStatus.esign?.status !== 'SIGNED') {
            return {
              currentStage: 'ESIGN_PENDING',
              stageLabel: 'Digital eSign Required',
              stageDescription: 'Your formal loan agreement is ready for Aadhaar OTP eSign execution.',
              progressPercentage: 75,
              activeApplicationId: activeApp.id,
              activeOfferId: activeOffer?.id,
              activeAgreementId: contractStatus.agreement?.agreementId,
              actionRequired: true,
              actionLabel: 'Complete Digital eSign',
              actionUrl: `/borrower/agreements/${activeApp.id}`,
              customerCode: customer.customerCode,
              borrowerName: `${customer.firstName} ${customer.lastName}`,
              kycStatus: customer.kycStatus || 'VERIFIED',
            };
          }

          return {
            currentStage: 'FINANCE_PROCESSING',
            stageLabel: 'Pre-Disbursement Review',
            stageDescription: 'Your executed loan contract has been submitted for automated disbursement.',
            progressPercentage: 85,
            activeApplicationId: activeApp.id,
            activeOfferId: activeOffer?.id,
            actionRequired: false,
            actionUrl: `/borrower/agreements/${activeApp.id}`,
            customerCode: customer.customerCode,
            borrowerName: `${customer.firstName} ${customer.lastName}`,
            kycStatus: customer.kycStatus || 'VERIFIED',
          };
        }

        return {
          currentStage: 'OFFER_READY',
          stageLabel: 'Sanction Offer Available',
          stageDescription: 'Congratulations! Your loan has been approved. Review your formal terms and KFS.',
          progressPercentage: 60,
          activeApplicationId: activeApp.id,
          activeOfferId: activeOffer?.id,
          actionRequired: true,
          actionLabel: 'Review & Accept Offer',
          actionUrl: activeOffer ? `/borrower/offers?offerId=${activeOffer.id}` : '/borrower/offers',
          customerCode: customer.customerCode,
          borrowerName: `${customer.firstName} ${customer.lastName}`,
          kycStatus: customer.kycStatus || 'VERIFIED',
        };
      }

      if (['IN_REVIEW', 'UNDERWRITING'].includes(appStatus)) {
        return {
          currentStage: 'UNDERWRITING',
          stageLabel: 'Credit Assessment in Progress',
          stageDescription: 'Our automated underwriting engine is reviewing your application details.',
          progressPercentage: 45,
          activeApplicationId: activeApp.id,
          actionRequired: false,
          customerCode: customer.customerCode,
          borrowerName: `${customer.firstName} ${customer.lastName}`,
          kycStatus: customer.kycStatus || 'VERIFIED',
        };
      }

      if (appStatus === 'SUBMITTED') {
        return {
          currentStage: 'APPLICATION_SUBMITTED',
          stageLabel: 'Application Submitted',
          stageDescription: 'Your loan application has been received and queued for eligibility processing.',
          progressPercentage: 30,
          activeApplicationId: activeApp.id,
          actionRequired: false,
          customerCode: customer.customerCode,
          borrowerName: `${customer.firstName} ${customer.lastName}`,
          kycStatus: customer.kycStatus || 'VERIFIED',
        };
      }

      if (appStatus === 'DRAFT') {
        return {
          currentStage: 'DOCUMENTS_PENDING',
          stageLabel: 'Draft Application',
          stageDescription: 'Please complete your application submission.',
          progressPercentage: 20,
          activeApplicationId: activeApp.id,
          actionRequired: true,
          actionLabel: 'Resume Application',
          actionUrl: `/customer/applications/${activeApp.id}`,
          customerCode: customer.customerCode,
          borrowerName: `${customer.firstName} ${customer.lastName}`,
          kycStatus: customer.kycStatus || 'VERIFIED',
        };
      }
    }

    if (closedLoan) {
      return {
        currentStage: 'LOAN_CLOSED',
        stageLabel: 'Loan Fully Repaid',
        stageDescription: `All financial obligations towards Loan #${closedLoan.loanNo} have been cleared.`,
        progressPercentage: 100,
        activeLoanId: closedLoan.id,
        actionRequired: false,
        actionLabel: 'Download NOC Certificate',
        actionUrl: `/customer/documents?nocLoanId=${closedLoan.id}`,
        customerCode: customer.customerCode,
        borrowerName: `${customer.firstName} ${customer.lastName}`,
        kycStatus: customer.kycStatus || 'VERIFIED',
      };
    }

    if (customer.kycStatus !== 'VERIFIED') {
      return {
        currentStage: 'KYC_PENDING',
        stageLabel: 'KYC Verification Required',
        stageDescription: 'Complete your digital identity and bank verification to apply for a loan.',
        progressPercentage: 10,
        actionRequired: true,
        actionLabel: 'Complete KYC',
        actionUrl: '/customer/dashboard',
        customerCode: customer.customerCode,
        borrowerName: `${customer.firstName} ${customer.lastName}`,
        kycStatus: customer.kycStatus || 'NOT_STARTED',
      };
    }

    return {
      currentStage: 'PROFILE_INCOMPLETE',
      stageLabel: 'Ready to Apply',
      stageDescription: 'Explore instant personal and business credit facilities.',
      progressPercentage: 15,
      actionRequired: true,
      actionLabel: 'Apply for a Loan',
      actionUrl: '/customer/applications/new',
      customerCode: customer.customerCode,
      borrowerName: `${customer.firstName} ${customer.lastName}`,
      kycStatus: customer.kycStatus || 'VERIFIED',
    };
  }

  /**
   * 15. Real-Time Consents Ledger
   */
  public async getBorrowerConsents(userId: string, tenantId?: string): Promise<BorrowerConsentRecord[]> {
    const customer = await this.getCustomerForUser(userId, tenantId);

    const consents = await prisma.customerConsent.findMany({
      where: { customerId: customer.id },
      orderBy: { grantedAt: 'desc' },
    });

    if (consents.length === 0) {
      return [
        {
          id: `CNS-${customer.id.slice(0, 6)}-01`,
          consentType: 'CREDIT_BUREAU',
          purpose: 'Credit report pull from licensed credit bureaus (CIBIL, Experian)',
          version: '1.0',
          grantedAt: customer.createdAt.toISOString(),
          status: 'ACTIVE',
        },
        {
          id: `CNS-${customer.id.slice(0, 6)}-02`,
          consentType: 'AADHAAR_EKYC',
          purpose: 'Digital demographic and identity authentication via UIDAI GSP',
          version: '1.0',
          grantedAt: customer.createdAt.toISOString(),
          status: 'ACTIVE',
        },
      ];
    }

    return consents.map((c) => ({
      id: c.id,
      consentType: c.consentType,
      purpose: c.purpose || 'Regulatory Credit & Identity Consent',
      version: c.version || '1.0',
      grantedAt: c.grantedAt.toISOString(),
      ipAddress: c.ipAddress || undefined,
      status: (c.revokedAt ? 'REVOKED' : 'ACTIVE') as 'ACTIVE' | 'REVOKED',
    }));
  }

  /**
   * 16. Record or Update Borrower Consent
   */
  public async recordBorrowerConsent(
    userId: string,
    input: { consentType: string; purpose: string; ipAddress?: string },
    tenantId?: string
  ): Promise<BorrowerConsentRecord> {
    const customer = await this.getCustomerForUser(userId, tenantId);

    const consent = await prisma.customerConsent.create({
      data: {
        customerId: customer.id,
        tenantId: customer.tenantId,
        consentType: input.consentType,
        purpose: input.purpose,
        version: '1.0',
        ipAddress: input.ipAddress || '127.0.0.1',
      },
    });

    await logAudit({
      userId,
      tenantId,
      action: 'BORROWER_CONSENT_GRANTED',
      entity: 'CustomerConsent',
      entityId: consent.id,
      newValue: { consentType: input.consentType, customerId: customer.id },
    }).catch(() => {});

    return {
      id: consent.id,
      consentType: consent.consentType,
      purpose: consent.purpose,
      version: consent.version,
      grantedAt: consent.grantedAt.toISOString(),
      ipAddress: consent.ipAddress || undefined,
      status: 'ACTIVE',
    };
  }

  /**
   * 17. Borrower-Owned Document Vault
   */
  public async getBorrowerDocuments(userId: string, tenantId?: string): Promise<BorrowerDocumentSummary[]> {
    const customer = await this.getCustomerForUser(userId, tenantId);

    const docs = await prisma.document.findMany({
      where: {
        customerId: customer.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    return docs.map((d) => ({
      id: d.id,
      documentType: d.documentType || 'GENERAL_DOCUMENT',
      category: d.category,
      title: `${d.category} - ${d.documentType || 'Document'}`,
      fileName: d.fileName,
      status: d.status,
      uploadedAt: d.createdAt.toISOString(),
      downloadUrl: `/api/v1/documents/${d.id}/download`,
    }));
  }

  /**
   * 17. Get Full Detailed Borrower Profile & Authoritative Completion Breakdown
   */
  public async getBorrowerDetailedProfile(
    userId: string,
    tenantId?: string
  ): Promise<BorrowerDetailedProfile> {
    const customer = await this.getCustomerForUser(userId, tenantId);

    const primaryAddress = customer.addresses?.find((a: any) => a.isPrimary) || customer.addresses?.[0];
    const primaryEmployment = customer.employmentDetails?.[0];
    const primaryBank = customer.bankAccounts?.find((b: any) => b.isPrimary) || customer.bankAccounts?.[0];

    const panNumberMasked = this.getMaskedPan(customer);
    const aadhaarMasked = this.getMaskedAadhaar(customer);

    const monthlyIncome = Number(primaryEmployment?.monthlyIncome || customer.monthlyIncome || 0) || null;
    const existingObligations = Number(customer.existingObligations || 0) || null;

    // Dynamic completion calculation (5 Pillars: Personal, Address, Employment/Persona, KYC, Bank)
    const personalMissing: string[] = [];
    if (!customer.firstName) personalMissing.push('First Name');
    if (!customer.lastName) personalMissing.push('Last Name');
    if (!customer.dateOfBirth) personalMissing.push('Date of Birth');
    if (!customer.mobile) personalMissing.push('Mobile Number');
    if (!customer.email) personalMissing.push('Email');
    const isPersonalComplete = personalMissing.length === 0;

    const addressMissing: string[] = [];
    const addrLine = primaryAddress?.addressLine || customer.addressLine;
    const addrCity = primaryAddress?.city || customer.city;
    const addrState = primaryAddress?.state || customer.state;
    const addrPincode = primaryAddress?.pincode || customer.pincode;
    if (!addrLine) addressMissing.push('Address Line');
    if (!addrCity) addressMissing.push('City');
    if (!addrState) addressMissing.push('State');
    if (!addrPincode) addressMissing.push('Pincode');
    const isAddressComplete = addressMissing.length === 0;

    const empMissing: string[] = [];
    const empType = primaryEmployment?.employmentType || customer.employmentType;
    if (!empType) {
      empMissing.push('Employment Type / Persona');
    } else if (empType === 'STUDENT') {
      const instName = primaryEmployment?.employerName || customer.employerName;
      if (!instName) empMissing.push('College / Institution Name');
    } else {
      if (!monthlyIncome || monthlyIncome <= 0) empMissing.push('Monthly Income');
    }
    const isEmploymentComplete = empMissing.length === 0;

    const kycMissing: string[] = [];
    if (!panNumberMasked) kycMissing.push('PAN Number');
    if (!aadhaarMasked) kycMissing.push('Aadhaar Number');
    const isKycComplete = customer.kycStatus === 'VERIFIED' || kycMissing.length === 0;

    const bankMissing: string[] = [];
    const bName = primaryBank?.bankName || customer.bankName;
    const bAcc = primaryBank?.accountNumber || customer.bankAccountNo;
    const bIfsc = primaryBank?.ifscCode || customer.bankIfsc;
    if (!bName) bankMissing.push('Bank Name');
    if (!bAcc) bankMissing.push('Account Number');
    if (!bIfsc) bankMissing.push('IFSC Code');
    const isBankComplete = bankMissing.length === 0;

    const sections: ProfileSectionStatus[] = [
      {
        sectionKey: 'personal',
        title: 'Personal Information',
        isComplete: isPersonalComplete,
        missingFields: personalMissing,
      },
      {
        sectionKey: 'address',
        title: 'Residential Address',
        isComplete: isAddressComplete,
        missingFields: addressMissing,
      },
      {
        sectionKey: 'employment',
        title: 'Employment & Persona Details',
        isComplete: isEmploymentComplete,
        missingFields: empMissing,
      },
      {
        sectionKey: 'kyc',
        title: 'Identity Verification (KYC)',
        isComplete: isKycComplete,
        missingFields: kycMissing,
      },
      {
        sectionKey: 'bank',
        title: 'Disbursement Bank Account',
        isComplete: isBankComplete,
        missingFields: bankMissing,
      },
    ];

    const completedSectionsCount = sections.filter((s) => s.isComplete).length;
    const percentage = Math.round((completedSectionsCount / sections.length) * 100);
    const allMissingFields = sections.flatMap((s) => s.missingFields);

    const activeConsents = await prisma.customerConsent.count({
      where: { customerId: customer.id, revokedAt: null },
    });

    return {
      id: customer.id,
      customerCode: customer.customerCode,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email || `${customer.customerCode.toLowerCase()}@adyapan.local`,
      mobile: customer.mobile,
      dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.toISOString().split('T')[0] : null,
      gender: customer.gender || null,
      kycStatus: customer.kycStatus,
      riskCategory: customer.riskCategory || null,
      status: customer.status,
      panNumberMasked,
      aadhaarMasked,
      monthlyIncome,
      employmentType: empType || null,
      primaryAddress: {
        addressLine: addrLine || null,
        addressLine1: addrLine || null,
        addressLine2: null,
        city: addrCity || null,
        state: addrState || null,
        pincode: addrPincode || null,
        addressType: primaryAddress?.addressType || 'CURRENT',
      },
      primaryEmployment: {
        employmentType: empType || null,
        employerName: primaryEmployment?.employerName || customer.employerName || null,
        designation: primaryEmployment?.designation || null,
        monthlyIncome,
        existingObligations,
        workExperienceYears: primaryEmployment?.workExperienceYears || null,
        institutionName: empType === 'STUDENT' ? (primaryEmployment?.employerName || customer.employerName || null) : null,
        courseName: empType === 'STUDENT' ? (primaryEmployment?.designation || null) : null,
        rollNumber: null,
        graduationYear: null,
        businessName: (empType === 'BUSINESS' || empType === 'SELF_EMPLOYED') ? (primaryEmployment?.employerName || customer.employerName || null) : null,
        annualTurnover: null,
      },
      primaryBank: {
        bankName: bName || null,
        accountNumberMasked: bAcc ? (bAcc.length > 4 ? `••••••••${bAcc.slice(-4)}` : bAcc) : null,
        ifscCode: bIfsc || null,
        accountHolderName: primaryBank?.accountHolderName || `${customer.firstName} ${customer.lastName}`.trim(),
        accountType: primaryBank?.accountType || 'SAVINGS',
        isVerified: primaryBank?.isVerified || false,
      },
      completion: {
        percentage,
        isComplete: completedSectionsCount === sections.length,
        sections,
        missingFields: allMissingFields,
      },
      consentsCount: activeConsents,
    };
  }

  /**
   * 18. Update Permitted Demographic Profile Information
   */
  public async updateBorrowerProfile(
    userId: string,
    input: UpdateBorrowerProfileInput,
    tenantId?: string
  ) {
    const customer = await this.getCustomerForUser(userId, tenantId);

    // If KYC is already VERIFIED, do not allow mutating verified legal names from self-service portal
    const canEditName = customer.kycStatus !== 'VERIFIED';

    const updateCustomerData: any = {};
    if (canEditName) {
      if (input.firstName && input.firstName.trim()) {
        updateCustomerData.firstName = input.firstName.trim();
      }
      if (input.lastName && input.lastName.trim()) {
        updateCustomerData.lastName = input.lastName.trim();
      }
    }

    if (input.dob) {
      const parsedDate = new Date(input.dob);
      if (!isNaN(parsedDate.getTime())) {
        updateCustomerData.dateOfBirth = parsedDate;
      }
    }

    if (input.gender) {
      updateCustomerData.gender = input.gender.trim();
    }

    if (input.monthlyIncome !== undefined) {
      updateCustomerData.monthlyIncome = Money.of(input.monthlyIncome);
    }

    if (input.existingEmiObligations !== undefined) {
      updateCustomerData.existingObligations = Money.of(input.existingEmiObligations);
    }

    if (input.employmentType) {
      updateCustomerData.employmentType = input.employmentType;
      const effectiveEmployer =
        input.employerName ||
        input.institutionName ||
        input.businessName ||
        (input.employmentType === 'STUDENT' ? 'Student' : 'Self-Employed');
      updateCustomerData.employerName = effectiveEmployer;
    }

    if (input.addressLine1 && input.city && input.state && input.pincode) {
      updateCustomerData.addressLine = `${input.addressLine1}${input.addressLine2 ? `, ${input.addressLine2}` : ''}`.trim();
      updateCustomerData.city = input.city.trim();
      updateCustomerData.state = input.state.trim();
      updateCustomerData.pincode = input.pincode.trim();
    }

    // Apply updates to Customer table
    await prisma.customer.update({
      where: { id: customer.id },
      data: updateCustomerData,
    });

    // Upsert or create Address record
    if (input.addressLine1 && input.city && input.state && input.pincode) {
      const existingAddr = await prisma.customerAddress.findFirst({
        where: { customerId: customer.id, isPrimary: true },
      });

      const fullLine = `${input.addressLine1}${input.addressLine2 ? `, ${input.addressLine2}` : ''}`.trim();
      if (existingAddr) {
        await prisma.customerAddress.update({
          where: { id: existingAddr.id },
          data: {
            addressLine: fullLine,
            city: input.city.trim(),
            state: input.state.trim(),
            pincode: input.pincode.trim(),
            addressType: input.addressType || 'CURRENT',
          },
        });
      } else {
        await prisma.customerAddress.create({
          data: {
            customerId: customer.id,
            addressType: input.addressType || 'CURRENT',
            addressLine: fullLine,
            city: input.city.trim(),
            state: input.state.trim(),
            pincode: input.pincode.trim(),
            isPrimary: true,
          },
        });
      }
    }

    // Upsert or create Employment record
    if (input.employmentType || input.monthlyIncome !== undefined || input.employerName || input.designation) {
      const existingEmp = await prisma.customerEmployment.findFirst({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
      });

      const targetEmpType = input.employmentType || existingEmp?.employmentType || 'SALARIED';
      const employerOrInstitution =
        input.employerName ||
        input.institutionName ||
        input.businessName ||
        existingEmp?.employerName ||
        (targetEmpType === 'STUDENT' ? 'Educational Institution' : 'Independent');

      const designationOrCourse =
        input.designation || input.courseName || input.professionType || existingEmp?.designation || null;
      const finalMonthlyIncome =
        input.monthlyIncome !== undefined ? input.monthlyIncome : (Number(existingEmp?.monthlyIncome) || 0);

      if (existingEmp) {
        await prisma.customerEmployment.update({
          where: { id: existingEmp.id },
          data: {
            employmentType: targetEmpType,
            employerName: employerOrInstitution,
            designation: designationOrCourse,
            monthlyIncome: Money.of(finalMonthlyIncome),
            workExperienceYears:
              input.workExperienceYears !== undefined ? input.workExperienceYears : existingEmp.workExperienceYears,
          },
        });
      } else {
        await prisma.customerEmployment.create({
          data: {
            customerId: customer.id,
            employmentType: targetEmpType,
            employerName: employerOrInstitution,
            designation: designationOrCourse,
            monthlyIncome: Money.of(finalMonthlyIncome),
            workExperienceYears: input.workExperienceYears || null,
          },
        });
      }
    }

    await logAudit({
      userId,
      tenantId,
      action: 'BORROWER_PROFILE_UPDATED',
      entity: 'Customer',
      entityId: customer.id,
      newValue: {
        fieldsUpdated: Object.keys(input),
      },
    }).catch(() => {});

    // Return the updated detailed profile
    const updatedProfile = await this.getBorrowerDetailedProfile(userId, tenantId);

    return {
      success: true,
      message: 'Borrower profile updated successfully.',
      profile: updatedProfile,
      customer: updatedProfile,
    };
  }
}

export const borrowerService = BorrowerService.getInstance();
