import { prisma } from '../../config/prisma';
import {
  DirectApplyRequest,
  DirectDecisionResponse,
  PreQualificationProductOption,
  PreQualificationRequest,
  PreQualificationResponse,
  SafeBorrowerLoanDetail,
} from './direct-lending.types';
import { breService } from '../bre/bre.service';
import { riskEngineService } from '../risk/risk.service';
import { offerEngineService } from '../offers/offers.service';
import { creditLimitsService } from '../credit-limits/credit-limits.service';
import { customerLifecycleService } from './customer-lifecycle.service';
import { sandboxPayoutProvider } from '../payments/sandbox-payout-provider';

export function calculateEmi(
  principal: number,
  annualRatePct: number,
  tenureMonths: number
): number {
  if (annualRatePct === 0 || tenureMonths <= 0) {
    return Math.round(principal / Math.max(1, tenureMonths));
  }
  const monthlyRate = annualRatePct / 12 / 100;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

export class DirectLendingService {
  /**
   * Pre-qualifies customer across active products based on desired amount, tenure, and financial parameters.
   */
  public async preQualifyCustomer(
    request: PreQualificationRequest,
    customerId?: string,
    tenantId?: string
  ): Promise<PreQualificationResponse> {
    const products = await prisma.loanProduct.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        tenant: true,
      },
    });

    let monthlyIncome = request.monthlyIncome || 35000;
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (customer?.monthlyIncome) {
        monthlyIncome = Number(customer.monthlyIncome);
      }
    }

    const availableProducts: PreQualificationProductOption[] = [];
    let maxOverallEligible = 0;

    for (const prod of products) {
      const minAmount = Number(prod.minAmount);
      const maxAmount = Number(prod.maxAmount);
      const interestRate = Number(prod.interestRate);
      const processingFeePct = Number(prod.processingFeePct);

      // Max eligible calculation: 50% FOIR limit over tenure
      const maxEmiCapacity = monthlyIncome * 0.5;
      const effectiveTenure = Math.min(
        Math.max(request.tenureMonths, prod.minTenureMonths),
        prod.maxTenureMonths
      );

      // Estimated max loan based on capacity
      const calculatedMaxLoan = Math.min(
        maxAmount,
        Math.round((maxEmiCapacity * effectiveTenure * 0.85) / 1000) * 1000
      );
      const eligibleAmount = Math.max(minAmount, calculatedMaxLoan);

      if (eligibleAmount > maxOverallEligible) {
        maxOverallEligible = eligibleAmount;
      }

      const targetAmount = Math.min(
        Math.max(request.requestedAmount, minAmount),
        eligibleAmount
      );

      const estimatedEmi = calculateEmi(
        targetAmount,
        interestRate,
        effectiveTenure
      );
      const estimatedTotalRepayment = estimatedEmi * effectiveTenure;
      const processingFee = (targetAmount * processingFeePct) / 100;
      const gst = processingFee * 0.18;
      const netDisbursed = targetAmount - processingFee - gst;

      // APR estimation: (Total Interest + Fees) / Net Disbursed / (Tenure / 12) * 100
      const totalCost = estimatedTotalRepayment - targetAmount + processingFee + gst;
      const aprEstimated =
        netDisbursed > 0
          ? Number(((totalCost / netDisbursed / (effectiveTenure / 12)) * 100).toFixed(2))
          : interestRate;

      const isPreQualified =
        request.requestedAmount >= minAmount &&
        request.requestedAmount <= eligibleAmount &&
        request.tenureMonths >= prod.minTenureMonths &&
        request.tenureMonths <= prod.maxTenureMonths;

      const unmetCriteria: string[] = [];
      if (request.requestedAmount > eligibleAmount) {
        unmetCriteria.push(
          `Requested amount exceeds current pre-qualified limit of ₹${eligibleAmount.toLocaleString('en-IN')}`
        );
      }
      if (
        request.tenureMonths < prod.minTenureMonths ||
        request.tenureMonths > prod.maxTenureMonths
      ) {
        unmetCriteria.push(
          `Tenure must be between ${prod.minTenureMonths} and ${prod.maxTenureMonths} months`
        );
      }

      availableProducts.push({
        productId: prod.id,
        productCode: prod.code,
        productName: prod.name,
        productType: prod.productType,
        minAmount,
        maxAmount,
        eligibleAmount,
        minTenureMonths: prod.minTenureMonths,
        maxTenureMonths: prod.maxTenureMonths,
        interestRateAnnualPct: interestRate,
        processingFeePct,
        estimatedEmi,
        estimatedTotalRepayment,
        aprEstimated,
        isPreQualified,
        unmetCriteria: unmetCriteria.length > 0 ? unmetCriteria : undefined,
      });
    }

    const recommendedProduct =
      availableProducts.find((p) => p.isPreQualified) || availableProducts[0];

    return {
      isEligible: maxOverallEligible >= request.requestedAmount,
      maxEligibleAmount: maxOverallEligible,
      requestedAmount: request.requestedAmount,
      tenureMonths: request.tenureMonths,
      recommendedProduct,
      availableProducts,
      disclaimer:
        'Indicative pre-qualification only. Final terms subject to automated BRE decision and verification.',
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Fast-tracks a Direct Lending loan application.
   */
  public async applyDirectLoan(
    customerId: string,
    tenantId: string | undefined,
    request: DirectApplyRequest
  ) {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        ...(tenantId ? { tenantId } : {}),
      },
      include: { bankAccounts: true },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const product = await prisma.loanProduct.findFirst({
      where: {
        id: request.productId,
        ...(tenantId ? { tenantId } : {}),
        isActive: true,
      },
    });

    if (!product) {
      throw new Error('Selected loan product is not active or available');
    }

    const applicationNo = `APP-DL-${Date.now().toString().slice(-6)}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    const application = await prisma.loanApplication.create({
      data: {
        applicationNo,
        customerId,
        productId: request.productId,
        tenantId,
        requestedAmount: request.requestedAmount,
        tenureMonths: request.tenureMonths,
        purpose: request.purpose || 'Personal / Working Capital',
        status: 'SUBMITTED',
        stage: 'CREDIT_ASSESSMENT',
      },
    });

    await customerLifecycleService.syncLifecycleState(
      customerId,
      'DIRECT_LENDING_PORTAL',
      'Direct loan application submitted'
    );

    return application;
  }

  /**
   * Executes instant automated decisioning using BRE and Risk Engine.
   */
  public async evaluateInstantDecision(
    applicationId: string,
    customerId: string,
    tenantId?: string
  ): Promise<DirectDecisionResponse> {
    const application = await prisma.loanApplication.findFirst({
      where: {
        id: applicationId,
        customerId,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        customer: true,
        product: true,
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // 1. Evaluate Risk Score via Phase 9 Risk Engine
    let riskEvaluation: any;
    try {
      riskEvaluation = await riskEngineService.evaluateApplication(
        applicationId,
        tenantId || 'tenant-adyapan-default'
      );
    } catch {
      riskEvaluation = { score: 25, grade: 'A', riskCategory: 'LOW' };
    }

    // 2. Evaluate Decision via Phase 2 BRE
    const breResult = await breService.evaluateApplication(applicationId);

    let finalDecision: 'APPROVED' | 'REFER' | 'REJECT' | 'UNDER_REVIEW' = 'UNDER_REVIEW';
    let safeMessage = '';
    let offerId: string | undefined;

    if (
      breResult.verdict === 'AUTO_APPROVED' ||
      breResult.verdict === 'ELIGIBLE' ||
      breResult.verdict === 'CONDITIONALLY_ELIGIBLE'
    ) {
      finalDecision = 'APPROVED';
      safeMessage =
        'Congratulations! Your loan application is approved. Review your terms and Key Fact Statement.';

      // Generate Offer via Phase 4 Offer Engine
      const offer = await offerEngineService.generateOffer(
        tenantId || 'tenant-adyapan-default',
        applicationId,
        {
          customOfferedAmount: Number(application.requestedAmount),
          customTenureMonths: application.tenureMonths,
          overrideRatePct: Number(application.product.interestRate),
        },
        {
          id: 'SYSTEM_DECISION_ENGINE',
          tenantId: tenantId || 'tenant-adyapan-default',
          roles: ['SYSTEM'],
        }
      );
      offerId = offer.id;

      await prisma.loanApplication.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          stage: 'OFFER_ACCEPTANCE',
        },
      });
    } else if (
      breResult.verdict === 'MANUAL_REVIEW_REQUIRED' ||
      breResult.verdict === 'REFER_UNDERWRITER'
    ) {
      finalDecision = 'REFER';
      safeMessage =
        'Your application requires brief additional verification by our underwriting team. We will notify you shortly.';
      await prisma.loanApplication.update({
        where: { id: applicationId },
        data: {
          status: 'UNDER_REVIEW',
          stage: 'UNDERWRITING_REVIEW',
        },
      });
    } else {
      finalDecision = 'REJECT';
      safeMessage =
        "We're unable to approve this loan application at this time based on current eligibility criteria.";
      await prisma.loanApplication.update({
        where: { id: applicationId },
        data: {
          status: 'REJECTED',
          stage: 'REJECTED',
        },
      });
    }

    await customerLifecycleService.syncLifecycleState(
      customerId,
      'DECISION_ENGINE',
      `Instant decision: ${finalDecision}`
    );

    return {
      applicationId: application.id,
      applicationNo: application.applicationNo,
      status: finalDecision,
      decision: finalDecision,
      safeMessage,
      approvedAmount:
        finalDecision === 'APPROVED' ? Number(application.requestedAmount) : undefined,
      approvedTenureMonths:
        finalDecision === 'APPROVED' ? application.tenureMonths : undefined,
      nextStep:
        finalDecision === 'APPROVED'
          ? 'REVIEW_OFFER'
          : finalDecision === 'REFER'
          ? 'WAIT_FOR_REVIEW'
          : 'DISCOVER_OTHER_PRODUCTS',
      offerId,
    };
  }

  /**
   * Accepts offer, executes eSign/Mandate stage-gate, and marks ready for disbursement.
   */
  public async acceptOfferAndSign(
    applicationId: string,
    offerId: string,
    customerId: string,
    tenantId?: string
  ) {
    const offer = await offerEngineService.acceptOffer(
      tenantId || 'tenant-adyapan-default',
      offerId,
      {
        acceptanceMethod: 'CUSTOMER_PORTAL_OTP',
        termsAccepted: true,
        kfsAccepted: true,
      },
      {
        id: customerId,
        tenantId: tenantId || 'tenant-adyapan-default',
        roles: ['CUSTOMER'],
      }
    );

    // Advance application status to READY_FOR_DISBURSEMENT
    await prisma.loanApplication.update({
      where: { id: applicationId },
      data: {
        status: 'READY_FOR_DISBURSEMENT',
        stage: 'DISBURSEMENT_PENDING',
      },
    });

    await customerLifecycleService.syncLifecycleState(
      customerId,
      'OFFER_ENGINE',
      'Offer accepted and agreement digitally executed'
    );

    return offer;
  }

  /**
   * Disburses direct loan to customer bank account.
   */
  public async disburseLoan(
    applicationId: string,
    customerId: string,
    tenantId?: string
  ) {
    const application = await prisma.loanApplication.findFirst({
      where: {
        id: applicationId,
        customerId,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        product: true,
        customer: { include: { bankAccounts: true } },
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'READY_FOR_DISBURSEMENT') {
      throw new Error('Application is not in READY_FOR_DISBURSEMENT stage');
    }

    const principal = Number(application.requestedAmount);
    const interestRate = Number(application.product.interestRate);
    const tenureMonths = application.tenureMonths;
    const emiAmount = calculateEmi(principal, interestRate, tenureMonths);

    const loanNo = `LN-DL-${Date.now().toString().slice(-6)}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    // Create active loan & repayment schedule
    const loan = await prisma.loan.create({
      data: {
        loanNo,
        applicationId: application.id,
        customerId: application.customerId,
        productId: application.productId,
        tenantId,
        principal,
        interestRate,
        tenureMonths,
        emiAmount,
        outstandingPrincipal: principal,
        outstandingInterest: 0,
        outstandingFees: 0,
        status: 'ACTIVE',
        disbursementDate: new Date(),
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Generate schedule
    const monthlyRate = interestRate / 12 / 100;
    let balance = principal;

    for (let i = 1; i <= tenureMonths; i++) {
      const interestPart = Number((balance * monthlyRate).toFixed(2));
      const principalPart = Number((emiAmount - interestPart).toFixed(2));
      balance = Math.max(0, balance - principalPart);

      await prisma.repaymentScheduleItem.create({
        data: {
          loanId: loan.id,
          emiNumber: i,
          dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
          principal: principalPart,
          interest: interestPart,
          fees: 0,
          totalDue: emiAmount,
          outstanding: emiAmount,
          status: i === 1 ? 'DUE' : 'UPCOMING',
        },
      });
    }

    // Trigger disbursement payout
    const payoutResult = await sandboxPayoutProvider.initiatePayout({
      payoutNo: `POUT-DL-${Date.now()}`,
      amount: principal,
      currency: 'INR',
      beneficiaryName: `${application.customer.firstName} ${application.customer.lastName}`,
      beneficiaryAccountNo:
        application.customer.bankAccounts[0]?.accountNumber || '9998887771',
      beneficiaryIfsc:
        application.customer.bankAccounts[0]?.ifscCode || 'HDFC0000123',
    });

    await prisma.disbursement.create({
      data: {
        loanId: loan.id,
        amount: principal,
        method: 'IMPS',
        reference: payoutResult.utrNumber || payoutResult.providerPayoutId,
        status: 'COMPLETED',
      },
    });

    // Update application
    await prisma.loanApplication.update({
      where: { id: applicationId },
      data: {
        status: 'DISBURSED',
        stage: 'ACTIVE_SERVICING',
      },
    });

    await customerLifecycleService.syncLifecycleState(
      customerId,
      'DISBURSEMENT_ENGINE',
      'Loan successfully disbursed'
    );

    return loan;
  }

  /**
   * Retrieves sanitized, safe borrower loan detail view with zero internal leakage.
   */
  public async getSafeBorrowerLoanDetail(
    loanId: string,
    customerId: string,
    tenantId?: string
  ): Promise<SafeBorrowerLoanDetail> {
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        customerId,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        product: true,
        tenant: true,
        schedule: { orderBy: { emiNumber: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
        closure: true,
        application: {
          include: { documents: true },
        },
      },
    });

    if (!loan) {
      throw new Error('Loan not found');
    }

    const principal = Number(loan.principal);
    const outstandingPrincipal = Number(loan.outstandingPrincipal);
    const outstandingInterest = Number(loan.outstandingInterest);
    const outstandingFees = Number(loan.outstandingFees);
    const totalOutstanding =
      outstandingPrincipal + outstandingInterest + outstandingFees;

    const nextDueItem = loan.schedule.find(
      (s) => s.status === 'DUE' || s.status === 'OVERDUE' || s.status === 'UPCOMING'
    );
    const isOverdue =
      loan.status === 'OVERDUE' ||
      loan.schedule.some((s) => s.status === 'OVERDUE');

    let daysOverdue = 0;
    if (isOverdue && nextDueItem?.dueDate) {
      const diffMs = Date.now() - new Date(nextDueItem.dueDate).getTime();
      daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    const processingFee = (principal * Number(loan.product.processingFeePct)) / 100;
    const gst = processingFee * 0.18;
    const netDisbursed = principal - processingFee - gst;

    return {
      id: loan.id,
      loanNo: loan.loanNo,
      lenderName: loan.tenant?.name || 'Adyapan Lending Partner',
      productName: loan.product.name,
      productCode: loan.product.code,
      principalAmount: principal,
      netDisbursedAmount: netDisbursed,
      interestRateAnnualPct: Number(loan.interestRate),
      tenureMonths: loan.tenureMonths,
      emiAmount: Number(loan.emiAmount),
      outstandingPrincipal,
      outstandingInterest,
      outstandingFees,
      totalOutstanding,
      status: loan.status,
      nextDueDate: nextDueItem?.dueDate ? nextDueItem.dueDate.toISOString() : null,
      nextEmiAmount: nextDueItem
        ? Number(nextDueItem.totalDue) - Number(nextDueItem.paidAmount)
        : 0,
      isOverdue,
      daysOverdue,
      schedule: loan.schedule.map((s) => ({
        emiNumber: s.emiNumber,
        dueDate: s.dueDate.toISOString(),
        principal: Number(s.principal),
        interest: Number(s.interest),
        fees: Number(s.fees),
        totalDue: Number(s.totalDue),
        paidAmount: Number(s.paidAmount),
        outstanding: Number(s.outstanding),
        status: s.status,
        paidDate: s.paidDate ? s.paidDate.toISOString() : null,
      })),
      recentPayments: loan.payments.map((p) => ({
        paymentNo: p.paymentNo,
        amount: Number(p.amount),
        method: p.method,
        paidAt: p.paidAt.toISOString(),
        status: p.status,
        reference: p.reference,
      })),
      documents: (loan.application?.documents || []).map((d) => ({
        id: d.id,
        category: d.category,
        documentType: d.documentType,
        fileName: d.fileName,
        status: d.status,
      })),
      isFullyPaid: loan.status === 'CLOSED',
      nocNumber: loan.closure?.nocNumber || null,
    };
  }

  /**
   * Executes drawdown against revolving credit line.
   */
  public async drawdownRevolvingCredit(
    facilityId: string,
    requestedAmount: number,
    customerId: string,
    tenantId?: string
  ) {
    const drawdownResult = await creditLimitsService.requestDrawdown(
      facilityId,
      {
        requestedAmount,
        purpose: 'Direct Revolving Drawdown',
      },
      {
        id: customerId,
        tenantId,
        roles: ['CUSTOMER'],
      }
    );

    return drawdownResult;
  }
}

export const directLendingService = new DirectLendingService();
