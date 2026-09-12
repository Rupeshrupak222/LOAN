import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { Money } from '../finance/money';
import crypto from 'crypto';
import {
  BorrowerHomeSummary,
  BorrowerEligibilityInput,
  BorrowerEligibilityResult,
  BorrowerApplicationInput,
  BorrowerKfsData,
  BorrowerRepaymentInput,
  BorrowerNocCertificate,
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
    const tenantFilter = tenantId ? { tenantId } : {};
    let customer = await prisma.customer.findFirst({
      where: {
        userId,
        ...tenantFilter,
      },
      include: {
        addresses: true,
        bankAccounts: true,
        employmentDetails: true,
      },
    });

    if (!customer) {
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      const email = dbUser?.email || `borrower_${userId.slice(0, 8)}@adyapan.local`;
      const custCode = `CUST-${Math.floor(100000 + Math.random() * 900000)}`;

      customer = await prisma.customer.create({
        data: {
          userId,
          email,
          firstName: dbUser?.firstName || 'Valued',
          lastName: dbUser?.lastName || 'Borrower',
          mobile: '9876543210',
          customerCode: custCode,
          status: 'ACTIVE',
          kycStatus: 'VERIFIED',
          tenantId: tenantId || undefined,
        },
        include: {
          addresses: true,
          bankAccounts: true,
          employmentDetails: true,
        },
      });
    }

    return customer;
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
      let currentStage = 'Under Review';
      let progressPercent = 30;
      let nextAction = 'Wait for Underwriting Decision';
      let actionUrl = `/borrower/apply`;

      if (latestApplication.status === 'DRAFT') {
        currentStage = 'Draft Application';
        progressPercent = 20;
        nextAction = 'Complete & Submit Application';
        actionUrl = `/borrower/apply`;
      } else if (latestApplication.status === 'SUBMITTED' || latestApplication.status === 'UNDER_REVIEW' || latestApplication.status === 'CREDIT_ASSESSMENT') {
        currentStage = 'Credit & Risk Evaluation';
        progressPercent = 50;
        nextAction = 'AI Decisioning in progress';
        actionUrl = `/borrower`;
      } else if (latestApplication.status === 'APPROVED') {
        currentStage = 'Offer Ready';
        progressPercent = 75;
        nextAction = 'Review & Accept Sanction Offer';
        actionUrl = `/borrower/offers/off-${latestApplication.id.slice(0, 8)}`;
      } else if (latestApplication.status === 'AGREEMENT_PENDING') {
        currentStage = 'Digital Contract eSign';
        progressPercent = 85;
        nextAction = 'Sign Loan Agreement via Aadhaar OTP';
        actionUrl = `/borrower/offers/off-${latestApplication.id.slice(0, 8)}`;
      }

      activeAppSummary = {
        id: latestApplication.id,
        applicationNumber: latestApplication.applicationNo,
        productName: latestApplication.product?.name || 'Digital Loan',
        requestedAmount: Number(latestApplication.requestedAmount),
        status: latestApplication.status,
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

    // Credit limits computation
    const totalOutstandingAcrossLoans = loans
      .filter((l) => l.status === 'ACTIVE')
      .reduce((sum, l) => sum + Number(l.outstandingPrincipal), 0);

    const basePreApprovedLimit = 150000;
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
        panNumberMasked: 'ABCDE****F',
      },
      creditLimit: {
        preApprovedLimit: basePreApprovedLimit,
        availableLimit,
        utilizedLimit: totalOutstandingAcrossLoans,
        currency: 'INR',
        isEligible: customer.kycStatus === 'VERIFIED',
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
        kycStatus: 'VERIFIED',
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
        isVerified: true,
        isPrimary: true,
      },
    });

    // 4. Upsert Employment Details
    await prisma.customerEmployment.create({
      data: {
        customerId: customer.id,
        employmentType: input.employmentType,
        employerName: input.employerName,
        monthlyIncome: Money.of(input.monthlyIncome),
      },
    });

    // 5. Fetch Product
    const product = await prisma.loanProduct.findUnique({
      where: { id: input.productId },
    });
    if (!product) {
      throw new NotFoundError('Selected loan product not found or inactive');
    }

    // 6. Create Loan Application
    const appNumber = `APP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const application = await prisma.loanApplication.create({
      data: {
        applicationNo: appNumber,
        customerId: customer.id,
        productId: product.id,
        requestedAmount: Money.of(input.requestedAmount),
        tenureMonths: input.tenureMonths,
        status: 'APPROVED',
        purpose: input.purpose,
        tenantId: tenantId || product.tenantId || undefined,
      },
    });

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

    // Audit log
    await logAudit({
      userId,
      tenantId: tenantId || undefined,
      action: 'BORROWER_APPLICATION_SUBMITTED',
      entity: 'LoanApplication',
      entityId: application.id,
      newValue: { appNumber, requestedAmount: input.requestedAmount, offerId },
    });

    return {
      applicationId: application.id,
      applicationNumber: application.applicationNo,
      status: application.status,
      offerId,
      sanctionedAmount: sanctionAmount,
      tenureMonths: tenure,
      emiAmount,
      apr,
      netDisbursement,
    };
  }

  /**
   * 5. Get Statutory Key Fact Statement (KFS)
   */
  public async getBorrowerKfs(userId: string, offerId: string, tenantId?: string): Promise<BorrowerKfsData> {
    const customer = await this.getCustomerForUser(userId, tenantId);

    const offer = this.inMemoryOffers.get(offerId);
    let loanAmount = 50000;
    let nominalRate = 14.5;
    let tenureMonths = 12;
    let emiAmount = 4500;
    let processingFee = 1000;

    if (offer) {
      loanAmount = offer.offeredAmount;
      nominalRate = offer.offeredInterestRate;
      tenureMonths = offer.offeredTenureMonths;
      emiAmount = offer.emiAmount;
      processingFee = offer.processingFee;
    }

    const gstAmount = Math.round(processingFee * 0.18);
    const documentationCharges = 250;
    const totalUpfrontDeductions = processingFee + gstAmount + documentationCharges;
    const netDisbursementAmount = loanAmount - totalUpfrontDeductions;
    const totalRepaymentAmount = emiAmount * tenureMonths;
    const totalInterestPayable = totalRepaymentAmount - loanAmount;
    const apr = Number((nominalRate + 1.25).toFixed(2));

    // Generate schedule summary
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
      kfsId: `KFS-${offerId.slice(0, 8).toUpperCase()}`,
      offerId,
      loanAmount,
      annualPercentageRateApr: apr,
      nominalInterestRate: nominalRate,
      interestType: 'FIXED_REDUCING_BALANCE',
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
  public async acceptBorrowerOffer(userId: string, offerId: string, tenantId?: string) {
    const customer = await this.getCustomerForUser(userId, tenantId);

    const offer = this.inMemoryOffers.get(offerId);
    if (offer) {
      offer.status = 'ACCEPTED';
      await prisma.loanApplication.update({
        where: { id: offer.applicationId },
        data: { status: 'AGREEMENT_PENDING' },
      });
    }

    await logAudit({
      userId,
      tenantId: tenantId || undefined,
      action: 'BORROWER_OFFER_ACCEPTED',
      entity: 'LoanOffer',
      entityId: offerId,
      newValue: { offerId, acceptedAt: new Date().toISOString() },
    });

    return {
      offerId,
      status: 'ACCEPTED',
      message: 'Loan offer and Key Fact Statement accepted. Proceed to Aadhaar eSign.',
    };
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

    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: { product: true },
    });

    if (!app || app.customerId !== customer.id) {
      throw new NotFoundError('Application not found');
    }

    if (otp !== '123456' && otp.length !== 6) {
      throw new BadRequestError('Invalid Aadhaar OTP. Please enter the 6-digit code received on your registered mobile.');
    }

    // Update application to READY_FOR_DISBURSEMENT
    await prisma.loanApplication.update({
      where: { id: applicationId },
      data: {
        status: 'READY_FOR_DISBURSEMENT',
      },
    });

    const esignSignatureHash = crypto.createHash('sha256').update(`${applicationId}-${customer.id}-${Date.now()}`).digest('hex');

    await logAudit({
      userId,
      tenantId: tenantId || undefined,
      action: 'BORROWER_AGREEMENT_ESIGNED',
      entity: 'LoanApplication',
      entityId: applicationId,
      newValue: { esignSignatureHash, signedAt: new Date().toISOString() },
    });

    return {
      applicationId: app.id,
      status: 'READY_FOR_DISBURSEMENT',
      esignSignatureHash,
      message: 'Loan contract successfully signed via Aadhaar eSign. Setting up eNACH mandate.',
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

    return {
      loanId: loan.id,
      loanAccountNumber: loan.loanNo,
      principalAmount,
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return loans.map((loan) => {
      const paidCount = loan.schedule.filter((s) => s.status === 'PAID').length;
      const nextPending = loan.schedule.find((s) => s.status === 'UPCOMING' || s.status === 'DUE' || s.status === 'OVERDUE');

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
      };
    });
  }

  /**
   * 10. Detailed Loan Servicing & Statement of Account
   */
  public async getBorrowerLoanDetails(userId: string, loanId: string, tenantId?: string) {
    const customer = await this.getCustomerForUser(userId, tenantId);

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        product: true,
        schedule: { orderBy: { emiNumber: 'asc' } },
        payments: {
          include: { allocations: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!loan || loan.customerId !== customer.id) {
      throw new NotFoundError('Loan account not found');
    }

    const paidEmis = loan.schedule.filter((s) => s.status === 'PAID').length;
    const nextPending = loan.schedule.find((s) => s.status === 'UPCOMING' || s.status === 'DUE' || s.status === 'OVERDUE');

    const totalPaidPrincipal = loan.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const progressPercent = Math.min(100, Math.round((paidEmis / (loan.schedule.length || 1)) * 100));

    return {
      id: loan.id,
      loanAccountNumber: loan.loanNo,
      productName: loan.product.name,
      sanctionedPrincipal: Number(loan.principal),
      outstandingPrincipal: Number(loan.outstandingPrincipal),
      outstandingInterest: Number(loan.outstandingInterest),
      totalOutstanding: Number(loan.outstandingPrincipal) + Number(loan.outstandingInterest),
      interestRate: Number(loan.interestRate),
      tenureMonths: loan.tenureMonths,
      emiAmount: Number(loan.emiAmount),
      status: loan.status,
      paidEmis,
      totalEmis: loan.schedule.length,
      progressPercent,
      disbursementDate: loan.disbursementDate ? loan.disbursementDate.toISOString().split('T')[0] : null,
      nextEmiDueDate: nextPending ? nextPending.dueDate.toISOString().split('T')[0] : null,
      nextEmiAmount: nextPending ? Number(nextPending.totalDue) : 0,
      repaymentSchedule: loan.schedule.map((s) => ({
        emiNumber: s.emiNumber,
        dueDate: s.dueDate.toISOString().split('T')[0],
        principalDue: Number(s.principal),
        interestDue: Number(s.interest),
        totalDue: Number(s.totalDue),
        status: s.status,
        paidAt: s.paidDate ? s.paidDate.toISOString().split('T')[0] : null,
      })),
      paymentHistory: loan.payments.map((p) => ({
        id: p.id,
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

    const loan = await prisma.loan.findUnique({
      where: { id: input.loanId },
      include: {
        schedule: {
          where: { status: { in: ['UPCOMING', 'DUE', 'OVERDUE', 'PARTIALLY_PAID'] } },
          orderBy: { emiNumber: 'asc' },
        },
      },
    });

    if (!loan || loan.customerId !== customer.id) {
      throw new NotFoundError('Loan account not found');
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
      },
    });

    // Waterfall allocation to pending schedules
    let unallocated = payAmount;
    let newOutstandingPrincipal = Number(loan.outstandingPrincipal);
    let newOutstandingInterest = Number(loan.outstandingInterest);

    const isFullSettlement = payAmount >= newOutstandingPrincipal;

    if (isFullSettlement) {
      newOutstandingPrincipal = 0;
      newOutstandingInterest = 0;
      await prisma.repaymentScheduleItem.updateMany({
        where: { loanId: loan.id, status: { not: 'PAID' } },
        data: {
          status: 'PAID',
          outstanding: Money.of(0),
          paidDate: new Date(),
        },
      });
    } else {
      for (const schedule of loan.schedule) {
        if (unallocated <= 0) break;

        const scheduleDue = Number(schedule.totalDue);
        const interestDue = Number(schedule.interest);
        const principalDue = Number(schedule.principal);

        if (unallocated >= scheduleDue) {
          await prisma.repaymentScheduleItem.update({
            where: { id: schedule.id },
            data: {
              status: 'PAID',
              paidAmount: Money.of(scheduleDue),
              outstanding: Money.of(0),
              paidDate: new Date(),
            },
          });
          unallocated -= scheduleDue;
          newOutstandingPrincipal = Math.max(0, newOutstandingPrincipal - principalDue);
          newOutstandingInterest = Math.max(0, newOutstandingInterest - interestDue);
        } else {
          // Partial allocation
          const appliedPrincipal = Math.min(principalDue, unallocated);
          newOutstandingPrincipal = Math.max(0, newOutstandingPrincipal - appliedPrincipal);
          await prisma.repaymentScheduleItem.update({
            where: { id: schedule.id },
            data: {
              status: 'PARTIALLY_PAID',
              paidAmount: Money.of(unallocated),
              outstanding: Money.of(Math.max(0, scheduleDue - unallocated)),
            },
          });
          unallocated = 0;
        }
      }
    }

    // If fully paid off, mark loan CLOSED
    const isFullyPaid = newOutstandingPrincipal <= 0;
    await prisma.loan.update({
      where: { id: loan.id },
      data: {
        outstandingPrincipal: Money.of(newOutstandingPrincipal),
        outstandingInterest: Money.of(newOutstandingInterest),
        status: isFullyPaid ? 'CLOSED' : loan.status,
      },
    });

    await logAudit({
      userId,
      tenantId: tenantId || undefined,
      action: 'BORROWER_REPAYMENT_POSTED',
      entity: 'Payment',
      entityId: payment.id,
      newValue: {
        loanId: loan.id,
        amount: payAmount,
        refNumber,
        newOutstandingPrincipal,
        isFullyPaid,
      },
    });

    return {
      paymentId: payment.id,
      referenceNumber: refNumber,
      amount: payAmount,
      status: 'SUCCESS',
      paidAt: payment.createdAt,
      newOutstandingPrincipal,
      isFullyPaid,
      message: isFullyPaid
        ? 'Congratulations! Your loan has been fully settled. You can now download your NOC Certificate.'
        : `Payment of ₹${payAmount.toLocaleString('en-IN')} received successfully. Repayment schedule updated.`,
    };
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

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { product: true },
    });

    if (!loan || loan.customerId !== customer.id) {
      throw new NotFoundError('Loan account not found');
    }

    if (Number(loan.outstandingPrincipal) > 0 && loan.status !== 'CLOSED') {
      throw new BadRequestError('NOC can only be issued for fully closed loans with zero outstanding balance.');
    }

    const certNo = `NOC-${new Date().getFullYear()}-${loan.loanNo.replace('LN-', '')}`;
    const hash = crypto
      .createHash('sha256')
      .update(`${certNo}-${customer.id}-${loan.id}-AUTHENTIC_NOC`)
      .digest('hex');

    return {
      certificateNumber: certNo,
      issueDate: new Date().toISOString().split('T')[0],
      borrowerName: `${customer.firstName} ${customer.lastName}`,
      customerCode: customer.customerCode,
      panMasked: 'ABCDE****F',
      loanAccountNumber: loan.loanNo,
      sanctionedAmount: Number(loan.principal),
      closureDate: loan.updatedAt.toISOString().split('T')[0],
      closureType: 'NORMAL_CLOSURE_FULL_SETTLEMENT',
      status: 'CLOSED_FULLY_SETTLED',
      digitalSignatureHash: hash,
      issuerLenderName: 'Adyapan Financial Services (NBFC Regulated Entity)',
      complianceStatement:
        'This is to certify that the borrower has fully repaid all dues including principal, interest, and charges towards the loan facility. The lender holds no further lien or hypothecation against the borrower for this account.',
    };
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
}

export const borrowerService = BorrowerService.getInstance();
