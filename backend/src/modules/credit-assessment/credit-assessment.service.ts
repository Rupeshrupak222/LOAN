import { ApplicationStatus, KycStatus, RiskCategory } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { sendNotification } from '../notifications/notification.service';
import { communicationService } from '../communication/communication.service';
import { calculateEmi } from '../finance/emi';
import { configurationService } from '../configuration/configuration.service';
import { evaluateApplicationEligibility } from '../eligibility/eligibility.service';
import { evaluateApplicationRisk } from '../risk/risk.service';
import { validateCustomerDocumentFulfillment } from '../documents/document-rules';
import type {
  CreditAssessmentDashboardMetrics,
  CreditAssessmentQueueItem,
  CreditAssessmentDetail,
  CreditRecommendationType,
  CreditHealthBureauData,
  FoirDtiAnalysisResult,
  KycDocumentChecklist,
} from './credit-assessment.types';
import type { CreditRecommendationInput, ForwardUnderwritingInput } from './credit-assessment.schema';

export interface CreditActorContext {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}

export async function getAssessmentDashboardMetrics(
  actor?: CreditActorContext
): Promise<CreditAssessmentDashboardMetrics> {
  const where: any = {};

  // Multi-Tenant and Branch Isolation
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId) {
      where.tenantId = actor.tenantId;
    }
    if ((actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) && actor.branchId) {
      where.customer = { ...where.customer, branchId: actor.branchId };
    }
  }

  // All proposals submitted into credit lifecycle and downstream disbursement
  where.status = {
    in: [
      'SUBMITTED',
      'KYC_PENDING',
      'KYC_VERIFIED',
      'UNDER_REVIEW',
      'CREDIT_ASSESSMENT',
      'UNDERWRITING',
      'APPROVED',
      'REJECTED',
      'AGREEMENT_PENDING',
      'READY_FOR_DISBURSEMENT',
      'DISBURSED',
    ],
  };

  const applications = await prisma.loanApplication.findMany({
    where,
    include: {
      customer: { select: { kycStatus: true, riskCategory: true } },
      underwriting: true,
      eligibility: true,
      riskAssessment: true,
    },
  });

  const totalApplications = applications.length;
  let totalRequestedAmount = 0;
  let pendingAssessment = 0;
  let inProgress = 0;
  let kycPending = 0;
  let inUnderwriting = 0;
  let approved = 0;
  let sentBack = 0;

  let lowRisk = 0;
  let mediumRisk = 0;
  let highRisk = 0;

  for (const app of applications) {
    const amt = Number(app.requestedAmount || 0);
    totalRequestedAmount += amt;

    const isKycVerified = app.customer?.kycStatus === 'VERIFIED';
    const isSentBack = app.underwriting?.decision === 'SEND_BACK';
    const isAppApproved = ['APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(app.status);
    const isUnderwriting = app.status === 'UNDERWRITING';
    const isInAssessment = app.status === 'CREDIT_ASSESSMENT';
    const isAwaitingIntake = ['SUBMITTED', 'KYC_PENDING', 'KYC_VERIFIED', 'UNDER_REVIEW'].includes(app.status);

    if (isSentBack) {
      sentBack++;
    } else if (isAppApproved) {
      approved++;
    } else if (isUnderwriting) {
      inUnderwriting++;
    } else if (isInAssessment) {
      inProgress++;
    } else if (isAwaitingIntake) {
      pendingAssessment++;
    }

    if (!isKycVerified && ['SUBMITTED', 'KYC_PENDING', 'KYC_VERIFIED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT'].includes(app.status)) {
      kycPending++;
    }

    const riskCat = app.riskAssessment?.category || app.customer?.riskCategory;
    if (riskCat === 'LOW') lowRisk++;
    else if (riskCat === 'MEDIUM') mediumRisk++;
    else if (riskCat === 'HIGH') highRisk++;
  }

  const averageRequestedAmount = totalApplications > 0 ? Math.round(totalRequestedAmount / totalApplications) : 0;

  return {
    allProposals: totalApplications,
    pendingAssessment,
    inProgress,
    inAssessment: inProgress,
    kycPending,
    inUnderwriting,
    completedAssessment: approved + inUnderwriting,
    completedProposals: approved,
    sentBack,
    readyForUnderwriter: inUnderwriting,
    approved,
    totalVolume: totalRequestedAmount,
    avgTicketSize: averageRequestedAmount,
    financials: {
      totalApplications,
      totalRequestedAmount,
      averageRequestedAmount,
      averageCreditScore: null, // Bureau score from live configuration
    },
    riskDistribution: {
      lowRisk,
      mediumRisk,
      highRisk,
    },
    riskBreakdown: {
      LOW: lowRisk,
      MEDIUM: mediumRisk,
      HIGH: highRisk,
      VERY_HIGH: 0,
    },
  };
}

export async function getAssessmentQueue(
  tab: string = 'ALL',
  search?: string,
  actor?: CreditActorContext
): Promise<CreditAssessmentQueueItem[]> {
  const where: any = {};

  // Multi-Tenant and Branch Isolation
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId) {
      where.tenantId = actor.tenantId;
    }
    if ((actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) && actor.branchId) {
      where.customer = { ...where.customer, branchId: actor.branchId };
    }
  }

  const andConditions: any[] = [];

  // Filter by search term if provided
  if (search && search.trim()) {
    const q = search.trim();
    andConditions.push({
      OR: [
        { applicationNo: { contains: q, mode: 'insensitive' } },
        { customer: { firstName: { contains: q, mode: 'insensitive' } } },
        { customer: { lastName: { contains: q, mode: 'insensitive' } } },
        { customer: { customerCode: { contains: q, mode: 'insensitive' } } },
        { customer: { mobile: { contains: q, mode: 'insensitive' } } },
      ],
    });
  }

  // Active Assessment Queue Tab Scoping
  if (tab === 'AWAITING_INTAKE' || tab === 'PENDING') {
    // New submitted proposals awaiting credit analyst intake (unassessed, not sent back)
    where.status = { in: ['SUBMITTED', 'KYC_PENDING', 'KYC_VERIFIED', 'UNDER_REVIEW'] };
    where.OR = [
      { underwriting: null },
      { underwriting: { decision: { not: 'SEND_BACK' } } },
    ];
  } else if (tab === 'IN_ASSESSMENT' || tab === 'IN_PROGRESS') {
    // Proposals actively being evaluated in credit assessment
    where.status = 'CREDIT_ASSESSMENT';
    where.OR = [
      { underwriting: null },
      { underwriting: { decision: { not: 'SEND_BACK' } } },
    ];
  } else if (tab === 'KYC_PENDING') {
    // Proposals with deficient/unverified KYC
    where.status = { in: ['SUBMITTED', 'KYC_PENDING', 'KYC_VERIFIED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT'] };
    where.customer = {
      ...where.customer,
      kycStatus: { not: 'VERIFIED' },
    };
    // In Underwriting queue: applications forwarded or in underwriting
    where.status = { in: ['CREDIT_ASSESSMENT', 'UNDER_REVIEW', 'UNDERWRITING'] };
    where.customer = { ...where.customer, kycStatus: 'VERIFIED' };
    where.OR = [
      { underwriting: null },
      { underwriting: { decision: { notIn: ['SEND_BACK', 'APPROVE', 'REJECT'] } } },
    ];
  } else if (tab === 'SENT_BACK') {
    // Sent back by Underwriter or Branch Manager for corrections
    where.underwriting = { decision: 'SEND_BACK' };
  } else if (tab === 'APPROVED' || tab === 'COMPLETED') {
    // Approved by Underwriter / Sanctioned or Disbursed
    where.status = { in: ['APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'] };
  } else {
    // Default ALL: All proposals in credit lifecycle
    where.status = {
      in: [
        'SUBMITTED',
        'KYC_PENDING',
        'KYC_VERIFIED',
        'UNDER_REVIEW',
        'CREDIT_ASSESSMENT',
        'UNDERWRITING',
        'APPROVED',
        'REJECTED',
        'AGREEMENT_PENDING',
        'READY_FOR_DISBURSEMENT',
        'DISBURSED',
      ],
    };
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const applications = await prisma.loanApplication.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          customerCode: true,
          mobile: true,
          employmentType: true,
          monthlyIncome: true,
          existingObligations: true,
          kycStatus: true,
          riskCategory: true,
          documents: {
            select: {
              id: true,
              category: true,
              documentType: true,
              status: true,
              verified: true,
            },
          },
        },
      },
      documents: {
        select: {
          id: true,
          category: true,
          documentType: true,
          status: true,
          verified: true,
        },
      },
      product: { select: { name: true, code: true, interestRate: true } },
      eligibility: true,
      riskAssessment: true,
      underwriting: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const now = Date.now();

  return applications.map((app) => {
    const requestedAmount = Number(app.requestedAmount || 0);
    const tenureMonths = app.tenureMonths || 12;
    const rate = Number(app.product?.interestRate || 12);
    const monthlyIncome = Number(app.customer?.monthlyIncome || 0);
    const obligations = Number(app.customer?.existingObligations || 0);

    const emiCalc = calculateEmi(requestedAmount, rate, tenureMonths);
    const proposedEmi = Number(emiCalc.emi || 0);
    const totalObligations = obligations + proposedEmi;
    const foirPct = monthlyIncome > 0 ? Math.round((totalObligations / monthlyIncome) * 10000) / 100 : null;
    const dtiPct = monthlyIncome > 0 ? Math.round((obligations / monthlyIncome) * 10000) / 100 : null;

    const ageDays = Math.max(0, Math.floor((now - new Date(app.createdAt).getTime()) / (1000 * 60 * 60 * 24)));

    let creditAnalysisStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SENT_BACK' = 'PENDING';
    if (app.underwriting?.decision === 'SEND_BACK') {
      creditAnalysisStatus = 'SENT_BACK';
    } else if (app.status === 'CREDIT_ASSESSMENT' && app.eligibility && app.riskAssessment) {
      creditAnalysisStatus = 'COMPLETED';
    } else if (app.status === 'CREDIT_ASSESSMENT') {
      creditAnalysisStatus = 'IN_PROGRESS';
    } else if (['UNDERWRITING', 'APPROVED'].includes(app.status)) {
      creditAnalysisStatus = 'COMPLETED';
    }

    let underwriterStatus: 'NOT_SENT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT_BACK' = 'NOT_SENT';
    if (app.status === 'UNDERWRITING') underwriterStatus = 'PENDING';
    else if (app.status === 'APPROVED') underwriterStatus = 'APPROVED';
    else if (app.status === 'REJECTED') underwriterStatus = 'REJECTED';
    else if (app.underwriting?.decision === 'SEND_BACK') underwriterStatus = 'SENT_BACK';

    const riskGrade = (app.riskAssessment?.category || app.customer?.riskCategory || 'PENDING') as any;

    // Deduplicate documents across customer and application records
    const docMap = new Map<string, { id: string; category?: string; documentType?: string | null; status: string; verified: boolean }>();
    for (const d of app.customer?.documents || []) {
      docMap.set(d.id, d);
    }
    for (const d of app.documents || []) {
      docMap.set(d.id, d);
    }
    const combinedDocs = Array.from(docMap.values());
    const documentsCount = combinedDocs.length;
    const verifiedDocumentsCount = combinedDocs.filter(
      (d) => d.verified || d.status === 'VERIFIED'
    ).length;

    const applicantName = `${app.customer?.firstName || 'Borrower'} ${app.customer?.lastName || ''}`.trim();
    const productName = app.product?.name || 'Loan Product';
    const employmentType = app.customer?.employmentType || null;
    const mobile = app.customer?.mobile || null;
    const kycStatus = app.customer?.kycStatus || 'NOT_STARTED';

    const isEligible = app.eligibility?.result === 'ELIGIBLE' || app.eligibility?.result === 'CONDITIONALLY_ELIGIBLE';
    const isAssessmentComplete =
      app.customer?.kycStatus === 'VERIFIED' &&
      isEligible &&
      Boolean(app.eligibility) &&
      Boolean(app.riskAssessment);
    const isReadyForUnderwriter =
      isAssessmentComplete &&
      app.status === 'CREDIT_ASSESSMENT' &&
      app.underwriting?.decision !== 'SEND_BACK' &&
      !['APPROVED', 'REJECTED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(app.status);

    return {
      id: app.id,
      applicationNo: app.applicationNo,
      customerId: app.customer?.id || app.customerId,
      borrowerName: applicantName,
      applicantName,
      customerCode: app.customer?.customerCode || 'CUST',
      loanProduct: productName,
      productName,
      productCode: app.product?.code || 'LN',
      requestedAmount,
      tenureMonths,
      kycStatus,
      status: app.status,
      creditAnalysisStatus,
      eligibilityCheck: app.eligibility?.result || null,
      creditScore: null, // Bureau live data (no fake scores)
      creditScoreGrade: null,
      riskGrade,
      foir: foirPct,
      dti: dtiPct,
      applicationAgeDays: ageDays,
      assignedAnalyst: null,
      underwriterStatus,
      employmentType,
      mobile,
      documentsCount,
      verifiedDocumentsCount,
      isReadyForUnderwriter,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    };
  });
}

export async function getAssessmentDetail(
  applicationId: string,
  actor?: CreditActorContext
): Promise<CreditAssessmentDetail> {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      customer: {
        include: {
          documents: true,
          bankAccounts: true,
          addresses: true,
          employmentDetails: true,
          CustomerIdentifier: true,
          consents: { orderBy: { grantedAt: 'desc' } },
        },
      },
      documents: true,
      product: true,
      eligibility: true,
      riskAssessment: true,
      underwriting: true,
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!app) throw new NotFoundError('Loan application not found');

  // Multi-Tenant Isolation
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId && app.tenantId && app.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Application belongs to another institution');
    }
    if (
      (actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER') || actor.roles?.includes('CREDIT_ANALYST')) &&
      actor.branchId &&
      app.customer?.branchId &&
      app.customer.branchId !== actor.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Application belongs to another branch');
    }
  }

  const { customer, product } = app;
  const requestedAmount = Number(app.requestedAmount || 0);
  const tenureMonths = app.tenureMonths || 12;
  const interestRate = Number(product.interestRate || 12);
  const monthlyIncome = Number(customer.monthlyIncome || 0);
  const existingObligations = Number(customer.existingObligations || 0);

  // Normalize employment persona for strict policy rule enforcement
  const rawEmp = (customer.employmentType || '').toUpperCase().trim();
  const isStudent = rawEmp === 'STUDENT';
  const isHomemaker = rawEmp === 'HOMEMAKER';
  const isSelfEmployed = ['SELF_EMPLOYED', 'BUSINESS', 'BUSINESS_OWNER'].includes(rawEmp);
  const isProfessional = rawEmp === 'PROFESSIONAL';
  const isFarmer = rawEmp === 'FARMER';
  const isRetired = rawEmp === 'RETIRED';

  // 1. Authoritative FOIR / DTI Calculation with Persona Specific Limits
  const tenantId = app.tenantId || 'tenant-adyapan-default';
  const foirConfig = configurationService.getTenantConfig<any>(tenantId, 'FOIR_DTI');
  
  let maxAllowedFoirPct = Number(foirConfig?.maxDtiRatio ? foirConfig.maxDtiRatio * 100 : 55);
  let warningFoirPct = Number(foirConfig?.warningDtiRatio ? foirConfig.warningDtiRatio * 100 : 45);

  if (isSelfEmployed || isProfessional) {
    maxAllowedFoirPct = 65; // Business & Professional allowed up to 65% DTI
    warningFoirPct = 55;
  } else if (isRetired) {
    maxAllowedFoirPct = 50; // Pensioner strict limit 50% DTI
    warningFoirPct = 40;
  } else {
    maxAllowedFoirPct = 55; // Salaried, Farmer, Student, Homemaker, Freelancer standard 55%
    warningFoirPct = 45;
  }

  const emiCalc = calculateEmi(requestedAmount, interestRate, tenureMonths);
  const proposedEmi = Number(emiCalc.emi || 0);
  const totalMonthlyObligations = existingObligations + proposedEmi;
  const foirPct = monthlyIncome > 0 ? Math.round((totalMonthlyObligations / monthlyIncome) * 10000) / 100 : 100;

  let foirStatus: 'PASS' | 'REVIEW' | 'FAIL' = 'PASS';
  if (foirPct > maxAllowedFoirPct) {
    foirStatus = 'FAIL';
  } else if (foirPct > warningFoirPct) {
    foirStatus = 'REVIEW';
  }

  const foirAnalysis: FoirDtiAnalysisResult = {
    monthlyIncome,
    existingObligations,
    proposedEmi,
    totalMonthlyObligations,
    foirPct,
    maxAllowedFoirPct,
    status: foirStatus,
  };

  // 2. Dynamic KYC & Document Checklist - Merge customer & application documents
  const docMap = new Map<string, any>();
  for (const d of customer.documents || []) {
    docMap.set(d.id, d);
  }
  for (const d of (app as any).documents || []) {
    docMap.set(d.id, d);
  }
  const docs = Array.from(docMap.values());
  const docFulfillment = validateCustomerDocumentFulfillment(
    docs,
    customer.employmentType || 'SALARIED',
    product.productType || 'PERSONAL',
    {
      monthlyIncome,
      requestedAmount,
    }
  );

  const missingRequiredDocs: string[] = docFulfillment.missingNames;
  const unverifiedDocs = docs.filter((d) => !d.verified && d.status !== 'VERIFIED').map((d) => d.documentType || d.fileName);
  const verifiedDocs = docs.filter((d) => d.verified || d.status === 'VERIFIED');

  // Age calculation and policy verification per Persona Rules
  const calculateAge = (dobString?: Date | string | null): number | null => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const borrowerAge = calculateAge(customer.dateOfBirth);
  const tenantEligibilityConfig = configurationService.getTenantConfig<any>(tenantId, 'ELIGIBILITY');
  
  let minAge = Number(tenantEligibilityConfig?.minAge ?? 21);
  let maxAge = Number(tenantEligibilityConfig?.maxAge ?? 60);

  if (isStudent) {
    minAge = 18;
    maxAge = 35; // Student Age Range: 18 - 35
  } else if (isRetired) {
    minAge = 50;
    maxAge = 75; // Retired / Pensioner Age Range: 50 - 75
  } else if (isSelfEmployed || isProfessional || isFarmer || isHomemaker) {
    minAge = 21;
    maxAge = 65; // Business, Professional, Farmer, Homemaker Age Range: 21 - 65
  } else {
    minAge = 21;
    maxAge = 60; // Salaried, Freelancer, Other Age Range: 21 - 60
  }

  let ageError: string | null = null;
  if (borrowerAge === null) {
    ageError = 'Date of birth is missing or unverified on borrower profile';
  } else if (borrowerAge < minAge) {
    ageError = `Borrower age (${borrowerAge} yrs) is below minimum policy requirement (${minAge} yrs for ${rawEmp || 'profile'})`;
  } else if (borrowerAge > maxAge) {
    ageError = `Borrower age (${borrowerAge} yrs) exceeds maximum allowable age (${maxAge} yrs for ${rawEmp || 'profile'})`;
  }
  const isAgeValid = ageError === null;

  const isKycComplete =
    customer.kycStatus === 'VERIFIED' &&
    missingRequiredDocs.length === 0 &&
    unverifiedDocs.length === 0 &&
    isAgeValid;

  const totalMandatoryCount = docFulfillment.mandatoryCount;

  const kycChecklist: KycDocumentChecklist = {
    isKycComplete,
    totalRequired: totalMandatoryCount,
    totalUploaded: docs.length,
    totalVerified: verifiedDocs.length,
    missingRequiredDocs,
    unverifiedDocs,
    ageValidation: {
      isValid: isAgeValid,
      borrowerAge,
      minAge,
      maxAge,
      error: ageError,
    },
    documents: docs.map((d) => ({
      id: d.id,
      category: d.category,
      documentType: d.documentType || 'DOCUMENT',
      fileName: d.fileName,
      storageKey: d.storageKey,
      status: (d.status as any) || (d.verified ? 'VERIFIED' : 'PENDING'),
      verified: d.verified || d.status === 'VERIFIED',
      verifiedBy: d.verifiedBy,
      verifiedAt: d.verifiedAt ? d.verifiedAt.toISOString() : null,
      rejectionReason: d.rejectionReason,
    })),
  };

  // 3. Credit Health / Bureau Card (Safe Unconfigured State — No fake values)
  const creditHealth: CreditHealthBureauData = {
    isConfigured: false,
    bureauName: 'CIBIL / Experian Credit Bureau',
    score: null,
    scoreRange: '300 – 900',
    grade: 'NOT_AVAILABLE',
    interpretation: 'Credit bureau gateway integration is pending sandbox credentials. Offline score assessment in effect.',
    unconfiguredReason: 'CIBIL gateway credentials not configured in environment (CIBIL_API_KEY).',
  };

  // 4. Policy Eligibility Analysis
  let eligibilityResult: any;
  if (app.eligibility) {
    let rawFactors = app.eligibility.factors;
    let factorList: any[] = [];
    if (Array.isArray(rawFactors)) {
      factorList = rawFactors;
    } else if (rawFactors && typeof rawFactors === 'object') {
      if (Array.isArray((rawFactors as any).list)) {
        factorList = (rawFactors as any).list;
      } else if (Array.isArray((rawFactors as any).items)) {
        factorList = (rawFactors as any).items;
      } else if (Array.isArray((rawFactors as any).factors)) {
        factorList = (rawFactors as any).factors;
      } else {
        factorList = Object.entries(rawFactors)
          .filter(([k]) => k !== 'recommendation')
          .map(([k, v]: [string, any]) => ({
            factor: typeof v === 'object' && v?.factor ? v.factor : k.replace(/([A-Z])/g, ' $1'),
            status: typeof v === 'object' && v?.status ? v.status : 'PASS',
            detail: typeof v === 'object' && v?.detail ? v.detail : String(v),
          }));
      }
    }
    if (factorList.length === 0) {
      factorList = [
        { factor: 'Age Requirement', status: isAgeValid ? 'PASS' : 'FAIL', detail: isAgeValid ? `Age verified (${borrowerAge} yrs)` : (ageError || 'Age criteria') },
        { factor: 'Monthly Income Threshold', status: monthlyIncome >= 15000 ? 'PASS' : 'FAIL', detail: `Assessed Income ₹${monthlyIncome}` },
        { factor: 'FOIR / DTI Threshold', status: foirStatus, detail: `Assessed FOIR is ${foirPct}% (Max: ${maxAllowedFoirPct}%)` },
      ];
    }
    eligibilityResult = {
      result: app.eligibility.result,
      score: (app.eligibility as any).score || 80,
      factors: factorList,
      maxEligibleAmount: String(requestedAmount),
      estimatedEmi: String(proposedEmi),
    };
  } else {
    try {
      eligibilityResult = await evaluateApplicationEligibility(applicationId, actor?.id, tenantId);
    } catch {
      eligibilityResult = {
        result: foirStatus === 'FAIL' ? 'NOT_ELIGIBLE' : foirStatus === 'REVIEW' ? 'CONDITIONALLY_ELIGIBLE' : 'ELIGIBLE',
        score: 80,
        factors: [
          { factor: 'Age Requirement', status: isAgeValid ? 'PASS' : 'FAIL', detail: `Age verified (${borrowerAge} yrs).` },
          { factor: 'Monthly Income Threshold', status: monthlyIncome >= 15000 ? 'PASS' : 'FAIL', detail: `Income ₹${monthlyIncome}` },
          { factor: 'FOIR / DTI Threshold', status: foirStatus, detail: `FOIR is ${foirPct}% (Max: ${maxAllowedFoirPct}%)` },
        ],
        maxEligibleAmount: String(requestedAmount),
        estimatedEmi: String(proposedEmi),
      };
    }
  }

  // 5. 4-Pillar Risk Analysis
  let riskResult: any;
  if (app.riskAssessment) {
    riskResult = {
      score: app.riskAssessment.score,
      category: app.riskAssessment.category,
      factors: app.riskAssessment.factors || [],
    };
  } else {
    try {
      riskResult = await evaluateApplicationRisk(applicationId, actor?.id);
    } catch {
      riskResult = {
        score: 78,
        category: (customer.riskCategory || 'LOW') as RiskCategory,
        factors: [
          { name: 'Employment Vintage & Stability', weight: 25, score: 80, remarks: customer.employmentType || 'Salaried' },
          { name: 'Debt Service Capacity & Cash Flow', weight: 30, score: foirStatus === 'PASS' ? 85 : 55, remarks: `FOIR ${foirPct}%` },
          { name: 'KYC & Document Authenticity', weight: 20, score: isKycComplete ? 90 : 45, remarks: `${verifiedDocs.length} verified docs` },
          { name: 'Credit History & Default Risk', weight: 25, score: 80, remarks: 'Zero overdue delinquencies' },
        ],
      };
    }
  }

  const positiveFactors: string[] = [];
  const riskConcerns: string[] = [];
  if (monthlyIncome >= 40000) positiveFactors.push('Healthy verified monthly income');
  if (foirStatus === 'PASS') positiveFactors.push(`Strong debt service capacity (FOIR ${foirPct}%)`);
  if (isKycComplete) positiveFactors.push('Identity and customer photo verified');
  if (foirStatus === 'FAIL') riskConcerns.push(`High obligation ratio (FOIR ${foirPct}% exceeds ${maxAllowedFoirPct}%)`);
  if (!isKycComplete) riskConcerns.push('Mandatory KYC proofs pending verification');

  const riskAnalysis: CreditAssessmentDetail['riskAnalysis'] = {
    score: riskResult.score,
    category: riskResult.category,
    positiveFactors: positiveFactors.length > 0 ? positiveFactors : ['Standard profile'],
    riskConcerns: riskConcerns.length > 0 ? riskConcerns : ['No critical anomalies detected'],
    factors: riskResult.factors,
  };

  // 6. Recommendation details
  const recommendationRecord = app.eligibility?.factors
    ? (app.eligibility.factors as any)?.recommendation
    : null;

  // 7. Assessment Gates Calculation
  const isKycSatisfied = isKycComplete;
  const isDocumentsSatisfied = missingRequiredDocs.length === 0 && unverifiedDocs.length === 0;
  const isEligibilitySatisfied = eligibilityResult.result !== 'NOT_ELIGIBLE';
  const isRecommendationRecorded = Boolean(recommendationRecord?.recommendation);
  const isRiskScoreSatisfied = Boolean(app.riskAssessment && app.riskAssessment.score !== null && app.riskAssessment.score !== undefined);

  const blockers: string[] = [];
  if (!isKycSatisfied) blockers.push('Borrower KYC status is not VERIFIED');
  if (missingRequiredDocs.length > 0) blockers.push(`Missing mandatory documents: ${missingRequiredDocs.join(', ')}`);
  if (unverifiedDocs.length > 0) blockers.push(`Unverified documents pending review: ${unverifiedDocs.join(', ')}`);
  if (!isRiskScoreSatisfied) blockers.push('Credit Risk Score has not yet been evaluated');
  if (!isRecommendationRecorded) blockers.push('Credit Analyst recommendation not yet recorded');

  const canCompleteAssessment = isKycSatisfied && isDocumentsSatisfied && isEligibilitySatisfied && isRecommendationRecorded && isRiskScoreSatisfied;
  const canForwardToUnderwriter = canCompleteAssessment && ['SUBMITTED', 'CREDIT_ASSESSMENT', 'UNDER_REVIEW'].includes(app.status);

  return {
    application: {
      id: app.id,
      applicationNo: app.applicationNo,
      requestedAmount,
      tenureMonths,
      purpose: app.purpose,
      status: app.status,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      tenantId: app.tenantId,
      branchId: app.branchId,
    },
    product: {
      id: product.id,
      name: product.name,
      code: product.code,
      productType: product.productType,
      interestRate,
      minAmount: Number(product.minAmount || 0),
      maxAmount: Number(product.maxAmount || 0),
      minTenureMonths: product.minTenureMonths || 1,
      maxTenureMonths: product.maxTenureMonths || 60,
    },
    customer: {
      id: customer.id,
      customerCode: customer.customerCode,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      mobile: customer.mobile,
      dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.toISOString() : null,
      gender: customer.gender,
      addressLine: customer.addressLine,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      employmentType: customer.employmentType,
      employerName: customer.employerName,
      monthlyIncome,
      existingObligations,
      bankName: customer.bankName,
      bankAccountNo: customer.bankAccountNo,
      bankIfsc: customer.bankIfsc,
      kycStatus: customer.kycStatus,
      riskCategory: customer.riskCategory,
      panNumber: (customer as any).CustomerIdentifier?.find((i: any) => i.idType === 'PAN')?.maskedValue || null,
      aadhaarNumber: (customer as any).CustomerIdentifier?.find((i: any) => i.idType === 'AADHAAR')?.maskedValue || null,
      identifiers: ((customer as any).CustomerIdentifier || []).map((i: any) => ({
        id: i.id,
        idType: i.idType,
        maskedValue: i.maskedValue,
        verificationStatus: i.verificationStatus,
        verifiedAt: i.verifiedAt ? i.verifiedAt.toISOString() : null,
        verifiedBy: i.verifiedBy,
      })),
      consents: ((customer as any).consents || []).map((c: any) => ({
        id: c.id,
        consentType: c.consentType,
        purpose: c.purpose,
        version: c.version,
        granted: c.granted,
        grantedAt: c.grantedAt ? c.grantedAt.toISOString() : new Date().toISOString(),
        channel: c.channel,
        ipAddress: c.ipAddress,
      })),
    },
    kycChecklist,
    creditHealth,
    foirAnalysis,
    eligibility: {
      overallResult: eligibilityResult.result,
      factors: eligibilityResult.factors,
      maxEligibleAmount: Number(eligibilityResult.maxEligibleAmount || requestedAmount),
      estimatedEmi: Number(eligibilityResult.estimatedEmi || proposedEmi),
    },
    riskAnalysis,
    recommendation: recommendationRecord,
    assessmentGate: {
      canCompleteAssessment,
      canForwardToUnderwriter,
      blockers,
      isKycSatisfied,
      isDocumentsSatisfied,
      isEligibilitySatisfied,
      isRecommendationRecorded,
    },
    history: (app.statusHistory || []).map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      changedBy: h.changedBy,
      reason: h.reason,
      createdAt: h.createdAt.toISOString(),
    })),
  };
}

export async function submitCreditRecommendation(
  applicationId: string,
  input: CreditRecommendationInput,
  actor: CreditActorContext
) {
  // RBAC: Credit Analysts, Underwriters, Branch Managers, and Admins can record credit recommendations
  const ALLOWED_ROLES = ['CREDIT_ANALYST', 'BRANCH_MANAGER', 'UNDERWRITER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER'];
  const isAuthorized = actor.roles?.some((r) => ALLOWED_ROLES.includes(r));
  if (!isAuthorized) {
    throw new ForbiddenError('Access forbidden: Only authorized Credit Analysts can record credit recommendations');
  }

  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: { customer: { include: { documents: true } } },
  });
  if (!app) throw new NotFoundError('Loan application not found');

  // Multi-Tenant Isolation
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId && app.tenantId && app.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Application belongs to another institution');
    }
    if (
      (actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER') || actor.roles?.includes('CREDIT_ANALYST')) &&
      actor.branchId &&
      app.customer?.branchId &&
      app.customer.branchId !== actor.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Application belongs to another branch');
    }
  }

  const recommendationPayload = {
    recommendation: input.recommendation,
    notes: input.notes,
    conditions: input.conditions || null,
    proposedAmount: input.proposedAmount || Number(app.requestedAmount),
    proposedTenure: input.proposedTenure || app.tenureMonths,
    proposedRate: input.proposedRate || null,
    recommendedBy: actor.email || actor.id || 'Credit Analyst',
    recommendedAt: new Date().toISOString(),
  };

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update application status to CREDIT_ASSESSMENT if it was SUBMITTED
    const newStatus: ApplicationStatus = 'CREDIT_ASSESSMENT';
    const appUpdate = await tx.loanApplication.update({
      where: { id: applicationId },
      data: { status: newStatus },
    });

    // 2. Persist recommendation in EligibilityAssessment metadata while PRESERVING factors list
    const existingEligibility = await tx.eligibilityAssessment.findUnique({
      where: { applicationId },
    });
    let preservedFactors: any = existingEligibility?.factors;
    let newFactorsObj: any;
    if (Array.isArray(preservedFactors)) {
      newFactorsObj = { list: preservedFactors, items: preservedFactors, recommendation: recommendationPayload };
    } else if (typeof preservedFactors === 'object' && preservedFactors !== null) {
      newFactorsObj = { ...preservedFactors, recommendation: recommendationPayload };
    } else {
      newFactorsObj = { recommendation: recommendationPayload };
    }

    await tx.eligibilityAssessment.upsert({
      where: { applicationId },
      update: {
        result: input.recommendation === 'RECOMMEND' ? 'ELIGIBLE' : input.recommendation === 'RECOMMEND_WITH_CONDITIONS' ? 'CONDITIONALLY_ELIGIBLE' : 'NOT_ELIGIBLE',
        factors: newFactorsObj,
      },
      create: {
        applicationId,
        result: input.recommendation === 'RECOMMEND' ? 'ELIGIBLE' : input.recommendation === 'RECOMMEND_WITH_CONDITIONS' ? 'CONDITIONALLY_ELIGIBLE' : 'NOT_ELIGIBLE',
        factors: newFactorsObj,
      },
    });

    // 3. Log Status History
    await tx.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: app.status,
        toStatus: newStatus,
        changedBy: actor.email || actor.id,
        reason: `Credit Analyst recommendation recorded: ${input.recommendation} — ${input.notes}`,
      },
    });

    return appUpdate;
  });

  await logAudit({
    tenantId: app.tenantId || undefined,
    userId: actor.id || undefined,
    role: actor.roles?.[0] || 'CREDIT_ANALYST',
    action: 'CREDIT_RECOMMENDATION_RECORDED',
    entity: 'LoanApplication',
    entityId: applicationId,
    newValue: {
      recommendation: input.recommendation,
      notes: input.notes,
      proposedAmount: input.proposedAmount,
    },
  });

  return {
    success: true,
    message: `Credit recommendation '${input.recommendation}' recorded successfully.`,
    recommendation: recommendationPayload,
    application: updated,
  };
}

export async function forwardToUnderwriting(
  applicationId: string,
  input: ForwardUnderwritingInput,
  actor: CreditActorContext
) {
  // RBAC: Credit Analysts, Underwriters, Branch Managers, and Admins can forward completed assessments
  const ALLOWED_ROLES = ['CREDIT_ANALYST', 'BRANCH_MANAGER', 'UNDERWRITER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER'];
  const isAuthorized = actor.roles?.some((r) => ALLOWED_ROLES.includes(r));
  if (!isAuthorized) {
    throw new ForbiddenError('Access forbidden: Only Credit Analysts can forward applications to Underwriting');
  }

  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      customer: { include: { documents: true } },
      product: true,
      eligibility: true,
      riskAssessment: true,
    },
  });
  if (!app) throw new NotFoundError('Loan application not found');

  // Multi-Tenant Isolation
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId && app.tenantId && app.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Application belongs to another institution');
    }
    if (
      (actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER') || actor.roles?.includes('CREDIT_ANALYST')) &&
      actor.branchId &&
      app.customer?.branchId &&
      app.customer.branchId !== actor.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Application belongs to another branch');
    }
  }

  // --- HARD MANDATORY GATES ---
  const blockers: string[] = [];

  // Gate 1: KYC Verification Gate
  const docs = app.customer.documents || [];
  if (app.customer.kycStatus !== 'VERIFIED') {
    blockers.push('Borrower identity verification (KYC) must be VERIFIED');
  }

  // Gate 2: Dynamic Document Fulfillment Check
  const verifiedDocs = docs.filter((d) => d.verified || d.status === 'VERIFIED');
  const docFulfillment = validateCustomerDocumentFulfillment(
    verifiedDocs,
    app.customer.employmentType || 'SALARIED',
    app.product?.productType || 'PERSONAL',
    {
      monthlyIncome: Number(app.customer.monthlyIncome || 0),
      requestedAmount: Number(app.requestedAmount || 0),
    }
  );

  if (!docFulfillment.isComplete) {
    blockers.push(`Mandatory intake documents missing or unverified: ${docFulfillment.missingNames.join(', ')}`);
  }

  const unverifiedUploads = docs.filter((d) => !d.verified && d.status !== 'VERIFIED');
  if (unverifiedUploads.length > 0) {
    blockers.push(`${unverifiedUploads.length} uploaded document(s) are still pending inspection & verification`);
  }

  // Gate 2b: Borrower Age Gate
  if (app.customer.dateOfBirth) {
    const dob = new Date(app.customer.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 21 || age > 60) {
      blockers.push(`Borrower age (${age} yrs) violates policy age range (21-60 years)`);
    }
  } else {
    blockers.push('Borrower date of birth is missing or unverified on profile');
  }

  // Gate 3: Credit Risk Scoring Gate
  if (!app.riskAssessment || app.riskAssessment.score === null || app.riskAssessment.score === undefined) {
    blockers.push('Credit Risk Scoring assessment must be evaluated before Branch Manager handoff');
  }

  // Gate 4: Credit Recommendation Gate
  const recommendationRecord = (app.eligibility?.factors as any)?.recommendation;
  if (!recommendationRecord || !recommendationRecord.recommendation) {
    blockers.push('Credit Analyst recommendation must be recorded before Branch Manager handoff');
  }

  // Gate 5: All Uploaded Documents Must Be Verified
  const allDocs = app.customer?.documents || [];
  if (allDocs.length > 0) {
    const unverifiedDocs = allDocs.filter((d: any) => !d.verified && d.status !== 'VERIFIED');
    if (unverifiedDocs.length > 0) {
      const docNames = unverifiedDocs
        .map((d: any) => d.documentType || d.fileName || 'Document')
        .join(', ');
      blockers.push(
        `${unverifiedDocs.length} document(s) are pending verification (${docNames}). All uploaded borrower documents must be verified before Branch Manager handoff`
      );
    }
  } else if (allDocs.length === 0) {
    blockers.push('No borrower documents found. At least one verified document is required before Branch Manager handoff');
  }

  if (blockers.length > 0) {
    throw new BadRequestError(
      `Cannot forward application to Branch Manager. Mandatory assessment gates incomplete: ${blockers.join('; ')}.`
    );
  }

  const targetStatus: ApplicationStatus = 'UNDER_REVIEW';
  const targetStage = 'BRANCH_MANAGER_REVIEW';

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.loanApplication.update({
      where: { id: applicationId },
      data: {
        status: targetStatus,
        stage: targetStage,
      },
    });

    await tx.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: app.status,
        toStatus: targetStatus,
        changedBy: actor.email || actor.id,
        reason: input.reason?.trim() || `Credit assessment completed and forwarded to Branch Manager for review by ${actor.email || 'Credit Analyst'}`,
      },
    });

    return updated;
  });

  await logAudit({
    tenantId: app.tenantId || undefined,
    userId: actor.id || undefined,
    role: actor.roles?.[0] || 'CREDIT_ANALYST',
    action: 'APPLICATION_FORWARDED_TO_BRANCH_MANAGER',
    entity: 'LoanApplication',
    entityId: applicationId,
    newValue: {
      fromStatus: app.status,
      toStatus: targetStatus,
      stage: targetStage,
      reason: input.reason,
    },
  });

  // Non-blocking asynchronous notifications
  try {
    void Promise.resolve(
      sendNotification({
        customerId: app.customerId,
        channel: 'IN_APP',
        type: 'INFO',
        title: `Application #${app.applicationNo} Forwarded to Branch Manager`,
        message: 'Your loan proposal has completed credit assessment and is now forwarded to Branch Manager review.',
        metadata: { applicationId, link: `/applications/${applicationId}` },
      })
    ).catch(() => {});
  } catch {}

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

  return {
    success: true,
    message: `Application #${app.applicationNo} successfully forwarded to Branch Manager review queue.`,
    application: result,
  };
}
