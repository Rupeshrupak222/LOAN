import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { generateApplicationNo } from '../shared/codes';
import { Money } from '../finance/money';
import { sendNotification } from '../notifications/notification.service';
import { communicationService } from '../communication/communication.service';
import { validateLoanOfficerOriginationEligibility } from '../customer/customer.service';
import { validateCustomerDocumentFulfillment } from '../documents/document-rules';
import type { CreateApplicationInput } from './application.schema';

export interface ApplicationActorContext {
  id?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}

// Allowed status transitions (guards the loan lifecycle).
const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  DRAFT: ['SUBMITTED', 'KYC_PENDING', 'KYC_VERIFIED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING', 'REJECTED', 'CANCELLED'],
  SUBMITTED: ['SUBMITTED', 'KYC_PENDING', 'KYC_VERIFIED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING', 'REJECTED', 'CANCELLED'],
  KYC_PENDING: ['KYC_VERIFIED', 'SUBMITTED', 'REJECTED', 'CANCELLED'],
  KYC_VERIFIED: ['UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING', 'SUBMITTED', 'REJECTED', 'CANCELLED'],
  UNDER_REVIEW: ['CREDIT_ASSESSMENT', 'UNDERWRITING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'],
  CREDIT_ASSESSMENT: ['SUBMITTED', 'UNDERWRITING', 'APPROVED', 'REJECTED', 'CANCELLED'],
  UNDERWRITING: ['UNDERWRITING', 'APPROVED', 'REJECTED', 'SUBMITTED', 'CREDIT_ASSESSMENT', 'CANCELLED'],
  APPROVED: ['AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'UNDERWRITING', 'SUBMITTED', 'CANCELLED'],
  REJECTED: [],
  AGREEMENT_PENDING: ['READY_FOR_DISBURSEMENT', 'CANCELLED'],
  READY_FOR_DISBURSEMENT: ['DISBURSED', 'CANCELLED'],
  DISBURSED: [],
  CANCELLED: [],
};

export async function listApplications(
  params: PageParams,
  status?: string,
  userId?: string,
  actor?: ApplicationActorContext
) {
  const where: any = {};
  if (status) where.status = status as ApplicationStatus;
  if (userId) where.customer = { userId };

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId && actor.tenantId !== 'ALL') {
      where.OR = [
        { tenantId: actor.tenantId },
        { tenantId: null },
        { tenantId: 'tenant-adyapan-default' },
      ];
    }
    if ((actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) && actor.branchId) {
      where.OR = [
        ...(where.OR || []),
        { branchId: actor.branchId },
        { branchId: null },
        { customer: { branchId: actor.branchId } },
        { customer: { branchId: null } },
      ];
    }
    if (
      actor.roles?.includes('UNDERWRITER') &&
      !actor.roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'LOAN_OFFICER', 'OPERATIONS_MANAGER'].includes(r))
    ) {
      if (!status) {
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { status: { in: ['UNDERWRITING', 'APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED', 'REJECTED'] } },
              { underwriting: { isNot: null } },
              { stage: { contains: 'UNDERWRITING' } },
            ],
          },
        ];
      }
    }
  }

  const [rows, total] = await Promise.all([
    prisma.loanApplication.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: params.sortDir },
      include: {
        customer: { include: { documents: true } },
        product: true,
        eligibility: true,
        riskAssessment: true,
        underwriting: true,
        documents: true,
        approvals: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    }),
    prisma.loanApplication.count({ where }),
  ]);
  return {
    data: rows.map((a) => {
      const docEval = evaluateApplicationMissingDocs(
        a.customer?.documents || [],
        a.documents || [],
        a.customer?.employmentType || undefined,
        (a.product as any)?.productType || a.product?.name,
        Number(a.requestedAmount),
        Number(a.customer?.monthlyIncome || 0)
      );
      const isOnline = Boolean(
        (a as any).channel === 'ONLINE' ||
        (a as any).source === 'ONLINE' ||
        (a as any).sourcingChannel === 'ONLINE' ||
        a.purpose?.toLowerCase().includes('mpokket') ||
        a.purpose?.toLowerCase().includes('digital self') ||
        (a.statusHistory && a.statusHistory.some((h: any) => h.reason?.toLowerCase().includes('digital borrower') || h.reason?.toLowerCase().includes('online self-service')))
      );
      const returnDetails = extractApplicationReturnDetails(a);

      return {
        id: a.id,
        applicationNo: a.applicationNo,
        customerId: a.customerId,
        customer: a.customer,
        customerName: `${a.customer.firstName} ${a.customer.lastName}`,
        kycStatus: a.customer?.kycStatus || 'NOT_STARTED',
        riskCategory: a.customer?.riskCategory || 'PENDING',
        product: a.product.name,
        productDetail: a.product,
        requestedAmount: a.requestedAmount.toFixed(2),
        tenureMonths: a.tenureMonths,
        purpose: a.purpose,
        status: a.status,
        stage: a.stage,
        eligibility: a.eligibility,
        riskAssessment: a.riskAssessment,
        underwriting: a.underwriting,
        documents: a.documents || [],
        customerDocuments: a.customer?.documents || [],
        missingDocs: docEval.missing,
        missingDocLabels: docEval.missingLabels,
        isDocsComplete: docEval.isComplete,
        isOnline,
        returnDetails,
        createdAt: a.createdAt,
        submittedAt: a.submittedAt,
      };
    }),
    pagination: buildPagination(params.page, params.pageSize, total),
  };
}

export function evaluateApplicationMissingDocs(
  customerDocs: any[] = [], 
  appDocs: any[] = [],
  employmentTypeRaw?: string,
  productTypeRaw?: string,
  requestedAmount?: number,
  monthlyIncome?: number
) {
  const allDocs = [...customerDocs, ...appDocs];
  const fulfillment = validateCustomerDocumentFulfillment(allDocs, employmentTypeRaw, productTypeRaw, {
    requestedAmount,
    monthlyIncome,
  });

  const missing = fulfillment.checklistStatus
    .filter((status) => !status.isSatisfied)
    .map((status) => ({
      key: status.rule.code,
      label: status.rule.name,
      defaultDocType: status.rule.defaultDocumentType,
      category: status.rule.category,
    }));

  return {
    missing,
    missingLabels: missing.map((m) => m.label),
    isComplete: fulfillment.isComplete,
    hasIdentity: !missing.some(m => m.category === 'IDENTITY_PROOF'),
    hasPhoto: !missing.some(m => m.category === 'APPLICANT_PHOTO'),
    hasAddress: !missing.some(m => m.category === 'ADDRESS_PROOF'),
    hasIncome: !missing.some(m => m.category === 'INCOME_PROOF'),
    hasBank: !missing.some(m => m.category === 'INCOME_PROOF' || m.category === 'BANK_STATEMENT'),
  };
}

export function extractApplicationReturnDetails(app: any) {
  const isUwReturned = app.underwriting?.decision === 'SEND_BACK';

  const bmSentBack = app.approvals?.find(
    (a: any) => a.approverRole === 'BRANCH_MANAGER' && a.status === 'SENT_BACK'
  );

  const returnHistory = app.statusHistory?.find((h: any) => {
    const r = (h.reason || '').toLowerCase();
    return r.includes('sent back') || r.includes('send back') || r.includes('returned') || r.includes('correction');
  });

  if (isUwReturned) {
    return {
      returnedBy: app.underwriting?.decidedBy || 'Underwriting Officer',
      returnedByRole: 'UNDERWRITER',
      returnStage: 'UNDERWRITING',
      stageLabel: 'Underwriting Desk',
      returnReason: app.underwriting?.reason || 'Application sent back by Underwriter for mandatory corrections',
      returnedAt: app.underwriting?.createdAt || app.updatedAt,
    };
  }

  if (bmSentBack) {
    return {
      returnedBy: bmSentBack.approverUserId || 'Branch Manager',
      returnedByRole: 'BRANCH_MANAGER',
      returnStage: 'BRANCH_MANAGER',
      stageLabel: 'Branch Management Desk',
      returnReason: bmSentBack.decisionReason || 'Returned by Branch Manager for borrower verification & document corrections',
      returnedAt: bmSentBack.actionAt || bmSentBack.createdAt || app.updatedAt,
    };
  }

  if (returnHistory) {
    const r = (returnHistory.reason || '').toLowerCase();
    let stage = 'CREDIT_ASSESSMENT';
    let role = 'CREDIT_ANALYST';
    let stageLabel = 'Credit Appraisal Desk';

    if (r.includes('underwrit')) {
      stage = 'UNDERWRITING';
      role = 'UNDERWRITER';
      stageLabel = 'Underwriting Desk';
    } else if (r.includes('branch')) {
      stage = 'BRANCH_MANAGER';
      role = 'BRANCH_MANAGER';
      stageLabel = 'Branch Management Desk';
    }

    return {
      returnedBy: returnHistory.changedBy || 'Reviewer Desk',
      returnedByRole: role,
      returnStage: stage,
      stageLabel,
      returnReason: returnHistory.reason,
      returnedAt: returnHistory.createdAt || app.updatedAt,
    };
  }

  return {
    returnedBy: 'Credit Committee',
    returnedByRole: 'CREDIT_ANALYST',
    returnStage: 'CREDIT_ASSESSMENT',
    stageLabel: 'Credit Appraisal Desk',
    returnReason: 'Application flagged for document corrections or policy clarifications',
    returnedAt: app.updatedAt,
  };
}

export async function listReturnedApplications(
  params: PageParams,
  actor?: ApplicationActorContext,
  search?: string,
  stageFilter?: string
) {
  // Base query identifying all applications that have experienced a return/send-back event
  const baseWhere: any = {
    OR: [
      { underwriting: { decision: 'SEND_BACK' } },
      { approvals: { some: { status: 'SENT_BACK' } } },
      {
        statusHistory: {
          some: {
            OR: [
              { reason: { contains: 'Sent Back', mode: 'insensitive' } },
              { reason: { contains: 'SEND_BACK', mode: 'insensitive' } },
              { reason: { contains: 'Returned', mode: 'insensitive' } },
              { reason: { contains: 'correction', mode: 'insensitive' } },
            ],
          },
        },
      },
      { customer: { documents: { some: { status: 'REQUIRES_CORRECTION' } } } },
    ],
  };

  // Exclude terminal disbursed / cancelled states if desired, but keep currently active / pending fixes
  baseWhere.status = {
    notIn: ['DISBURSED', 'CANCELLED'],
  };

  // Multi-tenant & Branch Scoping
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId) {
      baseWhere.tenantId = actor.tenantId;
    }
    if ((actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) && actor.branchId) {
      baseWhere.customer = { ...baseWhere.customer, branchId: actor.branchId };
    }
  }

  // Text search
  if (search && search.trim()) {
    const q = search.trim();
    baseWhere.AND = [
      ...(baseWhere.AND || []),
      {
        OR: [
          { applicationNo: { contains: q, mode: 'insensitive' } },
          { customer: { firstName: { contains: q, mode: 'insensitive' } } },
          { customer: { lastName: { contains: q, mode: 'insensitive' } } },
          { customer: { mobile: { contains: q, mode: 'insensitive' } } },
          { customer: { customerCode: { contains: q, mode: 'insensitive' } } },
        ],
      },
    ];
  }

  // Fetch all returned applications matching branch / search to compute live metrics & pagination
  const allReturnedApps = await prisma.loanApplication.findMany({
    where: baseWhere,
    orderBy: { updatedAt: 'desc' },
    include: {
      customer: {
        include: {
          documents: { orderBy: { createdAt: 'desc' } },
          bankAccounts: true,
          employmentDetails: true,
          addresses: true,
        },
      },
      product: true,
      eligibility: true,
      riskAssessment: true,
      underwriting: true,
      approvals: { orderBy: { createdAt: 'desc' } },
      statusHistory: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
    },
  });

  // Enrich each application with return metadata and missing document assessment
  const enrichedApps = allReturnedApps.map((a) => {
    const returnDetails = extractApplicationReturnDetails(a);
    const docAssessment = evaluateApplicationMissingDocs(
      a.customer?.documents || [], 
      a.documents || [],
      a.customer?.employmentDetails?.[0]?.employmentType,
      a.product?.productType,
      Number(a.requestedAmount),
      a.customer?.employmentDetails?.[0]?.monthlyIncome ? Number(a.customer.employmentDetails[0].monthlyIncome) : undefined
    );

    return {
      id: a.id,
      applicationNo: a.applicationNo,
      customerId: a.customerId,
      customer: a.customer,
      customerName: `${a.customer.firstName} ${a.customer.lastName}`,
      customerMobile: a.customer?.mobile,
      customerEmail: a.customer?.email,
      customerCode: a.customer?.customerCode,
      kycStatus: a.customer?.kycStatus || 'NOT_STARTED',
      riskCategory: a.customer?.riskCategory || 'PENDING',
      product: a.product.name,
      productDetail: a.product,
      requestedAmount: a.requestedAmount.toFixed(2),
      tenureMonths: a.tenureMonths,
      purpose: a.purpose,
      status: a.status,
      returnDetails,
      missingDocuments: docAssessment.missing,
      missingLabels: docAssessment.missingLabels,
      isComplete: docAssessment.isComplete,
      documentsList: [...(a.customer?.documents || []), ...(a.documents || [])],
      eligibility: a.eligibility,
      riskAssessment: a.riskAssessment,
      underwriting: a.underwriting,
      approvals: a.approvals,
      statusHistory: a.statusHistory,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  });

  // Compute live metrics across all matching returned apps
  const totalReturned = enrichedApps.length;
  const returnedByUnderwriter = enrichedApps.filter((a) => a.returnDetails.returnStage === 'UNDERWRITING').length;
  const returnedByBranchManager = enrichedApps.filter((a) => a.returnDetails.returnStage === 'BRANCH_MANAGER').length;
  const returnedByCreditAnalyst = enrichedApps.filter((a) => a.returnDetails.returnStage === 'CREDIT_ASSESSMENT').length;
  const missingDocsCount = enrichedApps.filter((a) => !a.isComplete).length;
  const readyToResubmitCount = enrichedApps.filter((a) => a.isComplete).length;

  // Filter by stage if requested
  let filtered = enrichedApps;
  if (stageFilter && stageFilter !== 'ALL') {
    if (stageFilter === 'MISSING_DOCS') {
      filtered = filtered.filter((a) => !a.isComplete);
    } else if (stageFilter === 'READY_TO_RESUBMIT') {
      filtered = filtered.filter((a) => a.isComplete);
    } else {
      filtered = filtered.filter((a) => a.returnDetails.returnStage === stageFilter);
    }
  }

  // Paginate in-memory array
  const total = filtered.length;
  const skip = (params.page - 1) * params.pageSize;
  const paginatedData = filtered.slice(skip, skip + params.pageSize);

  return {
    data: paginatedData,
    metrics: {
      totalReturned,
      returnedByUnderwriter,
      returnedByBranchManager,
      returnedByCreditAnalyst,
      missingDocsCount,
      readyToResubmitCount,
    },
    pagination: buildPagination(params.page, params.pageSize, total),
  };
}


export async function getApplication(id: string, actor?: ApplicationActorContext) {
  const app = await prisma.loanApplication.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          documents: { orderBy: { createdAt: 'desc' } },
          bankAccounts: { orderBy: { createdAt: 'desc' } },
          employmentDetails: { orderBy: { createdAt: 'desc' } },
          addresses: { orderBy: { createdAt: 'desc' } },
        },
      },
      documents: { orderBy: { createdAt: 'desc' } },
      product: true,
      statusHistory: { orderBy: { createdAt: 'desc' } },
      eligibility: true,
      riskAssessment: true,
      underwriting: true,
      approvals: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!app) throw new NotFoundError('Application not found');

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId && app.tenantId && app.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Application belongs to another institution');
    }
    if (
      (actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) &&
      actor.branchId &&
      app.customer?.branchId &&
      app.customer.branchId !== actor.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Application belongs to another branch');
    }
  }

  return app;
}

export async function createApplication(
  input: CreateApplicationInput,
  actor?: ApplicationActorContext
) {
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
  });
  if (!customer) throw new NotFoundError('Customer not found');

  const effectiveTenantId = customer.tenantId || actor?.tenantId;

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId && customer.tenantId && customer.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Customer belongs to another institution');
    }
    if (
      (actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) &&
      actor.branchId &&
      customer.branchId &&
      customer.branchId !== actor.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Customer belongs to another branch');
    }
  }

  let product = input.productId
    ? await prisma.loanProduct.findUnique({ where: { id: input.productId } })
    : null;

  // If custom interest rate or product name provided or product doesn't exist
  if (input.interestRate != null || !product) {
    const rate = input.interestRate != null ? Number(input.interestRate) : (product ? Number(product.interestRate) : 14.5);
    const prodName = input.productName || (product ? product.name : `Custom Loan (${rate}% p.a.)`);
    const prodCode = `CUST-${rate.toString().replace('.', '_')}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    product = await prisma.loanProduct.create({
      data: {
        code: prodCode,
        name: prodName,
        tenantId: effectiveTenantId,
        productType: 'PERSONAL',
        interestRate: Money.round(rate).toFixed(3),
        minAmount: Money.toDb(100),
        maxAmount: Money.toDb(1000000000),
        minTenureMonths: 1,
        maxTenureMonths: 360,
        isActive: true,
      },
    });
  }

  // Prevent duplicate in-flight applications for the same customer profile
  const existingInFlight = await prisma.loanApplication.findFirst({
    where: {
      customerId: input.customerId,
      status: { in: ['DRAFT', 'SUBMITTED', 'KYC_PENDING', 'KYC_VERIFIED', 'CREDIT_ASSESSMENT', 'UNDER_REVIEW', 'UNDERWRITING'] },
    },
    include: { customer: true, product: true },
    orderBy: { createdAt: 'desc' },
  });
  if (existingInFlight) {
    return existingInFlight;
  }

  return prisma.loanApplication.create({
    data: {
      applicationNo: generateApplicationNo(),
      tenantId: effectiveTenantId,
      customerId: input.customerId,
      productId: product.id,
      requestedAmount: Money.toDb(input.requestedAmount),
      tenureMonths: input.tenureMonths,
      purpose: input.purpose,
      status: 'DRAFT',
      statusHistory: { create: { toStatus: 'DRAFT', reason: 'Application created' } },
    },
    include: { customer: true, product: true },
  });
}

export async function updateDraftApplication(
  id: string,
  input: { requestedAmount?: number; tenureMonths?: number; purpose?: string; productId?: string },
  actor?: ApplicationActorContext
) {
  const app = await getApplication(id, actor);
  const data: any = {};
  if (input.requestedAmount != null) data.requestedAmount = Money.toDb(input.requestedAmount);
  if (input.tenureMonths != null) data.tenureMonths = input.tenureMonths;
  if (input.purpose !== undefined) data.purpose = input.purpose;
  if (input.productId) data.productId = input.productId;

  const updated = await prisma.loanApplication.update({
    where: { id: app.id },
    data,
    include: { customer: true, product: true },
  });

  return {
    ...updated,
    requestedAmount: Number(updated.requestedAmount),
  };
}

export async function transition(
  id: string,
  toStatus: ApplicationStatus,
  changedBy?: string,
  reason?: string,
  actor?: ApplicationActorContext
) {
  const app = await prisma.loanApplication.findUnique({
    where: { id },
    include: {
      customer: { include: { documents: true, employmentDetails: true } },
      documents: true,
      product: true,
      riskAssessment: true,
      underwriting: true,
    },
  });
  if (!app) throw new NotFoundError('Application not found');

  // Idempotency safeguard: if application is already in the target status or already in active credit appraisal
  if (app.status === toStatus) {
    return app;
  }
  if (toStatus === 'SUBMITTED' && ['SUBMITTED', 'CREDIT_ASSESSMENT', 'UNDER_REVIEW', 'UNDERWRITING'].includes(app.status)) {
    return app;
  }

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId && app.tenantId && app.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Application belongs to another institution');
    }
    if (
      (actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) &&
      actor.branchId &&
      app.customer?.branchId &&
      app.customer.branchId !== actor.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Application belongs to another branch');
    }
  }

  // Customer self-service transition boundary
  if (actor?.roles?.includes('CUSTOMER') && !actor.roles.some((r) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'UNDERWRITER'].includes(r))) {
    const allowedForCustomer: ApplicationStatus[] = ['SUBMITTED', 'CANCELLED'];
    if (!allowedForCustomer.includes(toStatus)) {
      throw new ForbiddenError(`Access forbidden: Borrowers cannot transition applications to '${toStatus}'.`);
    }
  }

  // Role-state authorization: Loan Officer, Credit Analyst, Underwriter, and Branch Manager transition boundaries
  if (actor?.roles?.includes('AUDITOR')) {
    throw new ForbiddenError('Access forbidden: Auditors have read-only access and cannot transition application statuses');
  }

  // Branch Manager cannot force final credit approval, rejection, agreement pending, or disbursement states
  if (actor?.roles?.includes('BRANCH_MANAGER')) {
    const forbiddenForBranchManager: ApplicationStatus[] = [
      'APPROVED',
      'REJECTED',
      'AGREEMENT_PENDING',
      'READY_FOR_DISBURSEMENT',
      'DISBURSED',
    ];
    if (forbiddenForBranchManager.includes(toStatus)) {
      throw new ForbiddenError(
        `Access forbidden: Branch Manager cannot transition applications to '${toStatus}'. Credit decisions and financial disbursements require Underwriter and Finance Officer authorization.`
      );
    }
  }

  if (actor?.roles?.includes('LOAN_OFFICER') && !actor.roles.some((r) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r))) {
    if (toStatus === 'UNDERWRITING') {
      throw new ForbiddenError(
        'Access forbidden: Loan Officer applications must be forwarded to Credit Analyst first. Direct forwarding to Underwriter is prohibited.'
      );
    }
    const allowedForLoanOfficer: ApplicationStatus[] = ['SUBMITTED', 'CANCELLED'];
    if (!allowedForLoanOfficer.includes(toStatus)) {
      throw new ForbiddenError(
        `Access forbidden: Loan Officer can only forward applications to Credit Analyst ('SUBMITTED') or cancel, not transition to '${toStatus}'.`
      );
    }
    const eligibility = await validateLoanOfficerOriginationEligibility(
      app.customerId,
      app.tenantId || undefined,
      actor as any,
      app.productId || undefined
    );
    if (toStatus === 'SUBMITTED' && !eligibility.eligible) {
      throw new BadRequestError(
        `Cannot forward application to Credit Analyst. Complete all required customer onboarding steps first. Missing: ${eligibility.missing.join(', ')}. ${eligibility.reasons.join(' ')}`
      );
    }
  }

  if (actor?.roles?.includes('CREDIT_ANALYST')) {
    const allowedForCreditAnalyst: ApplicationStatus[] = [
      'UNDER_REVIEW',
      'CREDIT_ASSESSMENT',
      'UNDERWRITING',
      'SUBMITTED',
      'REJECTED',
    ];
    if (!allowedForCreditAnalyst.includes(toStatus)) {
      throw new ForbiddenError(
        `Access forbidden: Credit Analysts cannot approve, reject, sanction, or disburse loans. Allowed transitions: ${allowedForCreditAnalyst.join(', ')}.`
      );
    }
  }

  // ── Document Verification Gate ──────────────────────────────────────────────
  // Every department forwarding step is hard-blocked until all uploaded
  // documents for the borrower are staff-verified (verified = true OR status = 'VERIFIED').
  const allDocs = app.customer?.documents || [];
  if (allDocs.length > 0) {
    const unverifiedDocs = allDocs.filter((d) => !d.verified && d.status !== 'VERIFIED');
    if (unverifiedDocs.length > 0) {
      // Document verification is mandatory when forwarding proposal from Credit Analyst to Underwriting
      const FORWARDING_TO_UNDERWRITING: ApplicationStatus[] = ['UNDERWRITING'];
      if (FORWARDING_TO_UNDERWRITING.includes(toStatus)) {
        const docNames = unverifiedDocs
          .map((d) => d.documentType || d.fileName || 'Document')
          .join(', ');
        throw new BadRequestError(
          `Cannot forward application to Underwriting. ${unverifiedDocs.length} document(s) are pending inspection & verification by Credit Analyst: ${docNames}. All uploaded documents must be verified before Underwriter appraisal.`
        );
      }
    }
  }

  if (toStatus === 'UNDERWRITING') {
    if (!app.riskAssessment || app.riskAssessment.score === null || app.riskAssessment.score === undefined) {
      throw new BadRequestError('Cannot forward application to Underwriting. Credit score evaluation is mandatory before Underwriter handoff.');
    }
  }

  if (actor?.roles?.includes('UNDERWRITER')) {
    const forbiddenForUnderwriter: ApplicationStatus[] = [
      'DISBURSED',
      'READY_FOR_DISBURSEMENT',
      'AGREEMENT_PENDING',
    ];
    if (forbiddenForUnderwriter.includes(toStatus)) {
      throw new ForbiddenError(
        `Access forbidden: Underwriters cannot transition applications to '${toStatus}'. Post-sanction agreement processing and disbursement execution must be conducted by authorized Finance Officers.`
      );
    }
  }

  const isPrivilegedAdmin = actor?.roles?.some((r) =>
    ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r)
  );

  if (
    (actor?.roles?.includes('COLLECTION_OFFICER') || actor?.roles?.includes('FINANCE_OFFICER')) &&
    !isPrivilegedAdmin
  ) {
    throw new ForbiddenError(
      'Access forbidden: Neither Collection Officers nor Finance Officers have authority to transition loan applications or modify credit/underwriting decisions.'
    );
  }

  const allowed = TRANSITIONS[app.status] ?? [];
  if (!allowed.includes(toStatus)) {
    throw new BadRequestError(`Cannot move application from ${app.status} to ${toStatus}`);
  }

  const isResubmittingReturned = toStatus === 'SUBMITTED' && app.underwriting?.decision === 'SEND_BACK';

  if (isResubmittingReturned || toStatus === 'SUBMITTED') {
    const allDocs = [...(app.customer?.documents || []), ...(app.documents || [])];
    const customerEmploymentType =
      app.customer?.employmentType ||
      app.customer?.employmentDetails?.[0]?.employmentType ||
      'SALARIED';
    const customerMonthlyIncome =
      app.customer?.monthlyIncome != null
        ? Number(app.customer.monthlyIncome)
        : app.customer?.employmentDetails?.[0]?.monthlyIncome
        ? Number(app.customer.employmentDetails[0].monthlyIncome)
        : 0;

    const fulfillment = validateCustomerDocumentFulfillment(
      allDocs,
      customerEmploymentType,
      (app.product as any)?.productType || app.product?.name,
      {
        requestedAmount: Number(app.requestedAmount),
        monthlyIncome: customerMonthlyIncome,
      }
    );

    if (!fulfillment.isComplete) {
      throw new BadRequestError(
        `Cannot submit application to Credit Analyst. The application is missing mandatory profile-specific documents: ${fulfillment.missingNames.join(', ')}. Please upload all mandatory documents before submitting.`
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const stageMap: Partial<Record<ApplicationStatus, string>> = {
      DRAFT: 'INTAKE',
      SUBMITTED: 'CREDIT_ASSESSMENT',
      KYC_PENDING: 'KYC',
      KYC_VERIFIED: 'CREDIT_ASSESSMENT',
      UNDER_REVIEW: 'CREDIT_ASSESSMENT',
      CREDIT_ASSESSMENT: 'CREDIT_ASSESSMENT',
      UNDERWRITING: 'UNDERWRITING',
      APPROVED: 'SANCTION',
      AGREEMENT_PENDING: 'AGREEMENT',
      READY_FOR_DISBURSEMENT: 'DISBURSAL',
      DISBURSED: 'DISBURSED',
      REJECTED: 'REJECTED',
      CANCELLED: 'CANCELLED',
    };
    const newStage = stageMap[toStatus] || app.stage;

    const updated = await tx.loanApplication.update({
      where: { id },
      data: { status: toStatus, stage: newStage },
    });
    await tx.applicationStatusHistory.create({
      data: { applicationId: id, fromStatus: app.status, toStatus, changedBy, reason },
    });
    if (isResubmittingReturned) {
      await tx.underwritingDecision.deleteMany({
        where: { applicationId: id, decision: 'SEND_BACK' },
      });
    }
    return updated;
  });

  if (isResubmittingReturned) {
    try {
      void Promise.resolve(
        sendNotification({
          channel: 'IN_APP',
          type: 'INFO',
          title: `Application #${app.applicationNo} Resubmitted by Loan Officer`,
          message: `Proposal for ${app.customer?.firstName || 'Borrower'} ${app.customer?.lastName || ''} has been rectified with mandatory documents and resubmitted for credit assessment.`,
          metadata: {
            targetRoles: ['CREDIT_ANALYST', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
            targetRole: 'CREDIT_ANALYST',
            applicationId: id,
            customerId: app.customerId,
          },
        })
      ).catch(() => {});
    } catch {}
  }

  // Async non-blocking notification to applicant
  try {
    void Promise.resolve(
      sendNotification({
        customerId: app.customerId,
        channel: 'IN_APP',
        type: ['APPROVED', 'DISBURSED'].includes(toStatus)
          ? 'SUCCESS'
          : toStatus === 'REJECTED'
          ? 'ALERT'
          : 'INFO',
        title: `Application ${app.applicationNo} Status: ${toStatus}`,
        message: reason || `Your loan application has progressed to ${toStatus}.`,
        metadata: { applicationId: id, link: `/applications/${id}` },
      })
    ).catch(() => {});
  } catch {}

  if (toStatus === 'SUBMITTED') {
    try {
      void Promise.resolve(
        communicationService.dispatchSystemEvent(
          'APPLICATION_SUBMITTED',
          {
            customerId: app.customerId,
            customerName: `${app.customer?.firstName || 'Borrower'} ${app.customer?.lastName || ''}`.trim(),
            customerEmail: app.customer?.email || undefined,
            customerMobile: app.customer?.mobile || undefined,
            applicationNo: app.applicationNo,
            requestedAmount: String(app.requestedAmount),
          },
          app.tenantId || undefined
        )
      ).catch(() => {});
    } catch {}
  }

  return result;
}

export { transition as transitionApplication };
