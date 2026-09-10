import { Decimal } from 'decimal.js';
import { prisma } from '../../config/prisma';
import { generateGeminiContent } from './gemini.service';
import { ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { Money } from '../finance/money';
import { reconciliationService } from '../reconciliation/reconciliation.service';

export interface DecisionIntelligenceResult {
  generatedAt: string;
  dataAsOf: string;
  model: string;
  roleScope: string;
  executiveSummary: string;
  kpisInterpretation: {
    kpi: string;
    currentValue: string;
    status: 'HEALTHY' | 'WATCH' | 'CRITICAL';
    interpretation: string;
  }[];
  keyChanges: {
    metric: string;
    trend: 'UP' | 'DOWN' | 'STABLE';
    observation: string;
    possibleDriver: string;
  }[];
  bottlenecks: {
    stage: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    evidence: string;
    impact: string;
    suggestedInvestigation: string;
  }[];
  branchInsights: {
    branchName: string;
    status: 'STRONG' | 'STABLE' | 'NEEDS_ATTENTION';
    observations: string;
  }[];
  collectionInsights: {
    totalOverdue: number;
    parRatio: string;
    delinquencyTrajectory: string;
    observations: string;
  };
  whatShouldILookAt: {
    priority: number;
    area: string;
    reason: string;
    recommendedAction: string;
  }[];
  recommendedActions: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Builds aggregated LMS context strictly scoped to actor role and assigned branch.
 */
async function buildDecisionContext(actor: { id: string; email: string; roles: string[]; branchId?: string }) {
  const isGlobalAdmin = actor.roles.some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r));
  let isBranchScoped = !isGlobalAdmin && Boolean(actor.branchId);
  let branchFilter: any = isBranchScoped && actor.branchId ? { branchId: actor.branchId } : {};

  // Fetch branch information if branch-scoped
  let branchName = 'Enterprise Portfolio';
  if (actor.branchId) {
    const branchRecord = await prisma.branch.findUnique({
      where: { id: actor.branchId },
      select: { name: true, code: true },
    });
    if (branchRecord) {
      if (branchRecord.code === 'HO') {
        // Head Office oversees central institutional portfolio
        isBranchScoped = false;
        branchFilter = {};
        branchName = `${branchRecord.name} (${branchRecord.code})`;
      } else {
        branchName = `${branchRecord.name} (${branchRecord.code})`;
      }
    }
  }

  const [
    loans,
    applications,
    disbursements,
    payments,
    collectionCases,
    branches,
    products,
    customers,
    auditLogsCount,
    paymentSubmissionsCount,
    reconData,
  ] = await Promise.all([
    prisma.loan.findMany({
      where: branchFilter,
      include: {
        product: { select: { name: true, code: true } },
        branch: { select: { name: true, code: true } },
        schedule: { select: { status: true } },
      },
    }),
    prisma.loanApplication.findMany({
      where: branchFilter,
      include: {
        product: { select: { name: true, code: true } },
        branch: { select: { name: true, code: true } },
        underwriting: true,
        riskAssessment: true,
        eligibility: true,
      },
    }),
    prisma.disbursement.findMany({
      where: {
        status: 'COMPLETED',
        ...(branchFilter.branchId ? { loan: { branchId: branchFilter.branchId } } : {}),
      },
      include: { loan: { select: { branchId: true } } },
    }),
    prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        ...(branchFilter.branchId ? { loan: { branchId: branchFilter.branchId } } : {}),
      },
      include: { loan: { select: { branchId: true } } },
    }),
    prisma.collectionCase.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS', 'PROMISED', 'ESCALATED'] },
        ...(branchFilter.branchId ? { loan: { branchId: branchFilter.branchId } } : {}),
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        loan: { select: { loanNo: true, branchId: true } },
        promises: true,
      },
    }),
    prisma.branch.findMany({
      where: branchFilter.branchId ? { id: branchFilter.branchId } : {},
      select: { id: true, name: true, code: true },
    }),
    prisma.loanProduct.findMany({ select: { id: true, name: true, code: true } }),
    prisma.customer.findMany({
      where: branchFilter,
      select: { id: true, kycStatus: true, status: true, riskCategory: true },
    }),
    prisma.auditLog.count(),
    prisma.paymentSubmission.count({
      where: {
        status: 'PENDING_VERIFICATION',
        ...(branchFilter.branchId ? { loan: { branchId: branchFilter.branchId } } : {}),
      },
    }),
    reconciliationService.getDashboardStats(actor).catch(() => ({
      reconciliationHealthPercent: 100,
      totalActiveExceptions: 0,
      criticalExceptionsCount: 0,
      pendingAdjustmentsCount: 0,
      totalDiscrepancyAmount: 0,
    })),
  ]);

  const pendingPaymentSubmissions = paymentSubmissionsCount;
  const reconStats = reconData as any;

  // Scoped disbursements, payments & collections
  const scopedDisbursements = disbursements;
  const scopedPayments = payments;
  const scopedCollections = collectionCases;

  // Loan Metrics
  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
  const overdueLoans = loans.filter((l) => l.status === 'OVERDUE');
  const closedLoans = loans.filter((l) => l.status === 'CLOSED' || l.status === 'SETTLED');

  const totalDisbursed = scopedDisbursements.reduce((sum, d) => sum.plus(d.amount), new Decimal(0));
  const totalOutstanding = activeLoans.reduce((sum, l) => sum.plus(l.outstandingPrincipal), new Decimal(0));
  const totalCollected = scopedPayments.reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
  const totalOverdue = scopedCollections.reduce((sum, c) => sum.plus(c.overdueAmount), new Decimal(0));

  const parRatio = totalOutstanding.greaterThan(0)
    ? (totalOverdue.dividedBy(totalOutstanding).toNumber() * 100).toFixed(2)
    : '0.00';

  // Application Pipeline Metrics
  const totalApps = applications.length;
  const draftApps = applications.filter((a) => a.status === 'DRAFT').length;
  const kycPendingApps = applications.filter(
    (a) => a.status === 'KYC_PENDING' || a.status === 'UNDER_REVIEW' || a.status === 'SUBMITTED'
  ).length;
  const pendingCreditAssessment = applications.filter(
    (a) => a.status === 'CREDIT_ASSESSMENT' || a.status === 'UNDER_REVIEW' || a.status === 'SUBMITTED'
  ).length;
  const pendingUnderwriting = applications.filter(
    (a) => a.status === 'SUBMITTED' || a.status === 'UNDERWRITING'
  ).length;
  const readyForDisbursementApps = applications.filter((a) => a.status === 'READY_FOR_DISBURSEMENT').length;
  const approvedApps = applications.filter(
    (a) => a.status === 'APPROVED' || a.status === 'READY_FOR_DISBURSEMENT' || a.status === 'DISBURSED'
  ).length;
  const rejectedApps = applications.filter((a) => a.status === 'REJECTED').length;
  const approvalRate = totalApps > 0 ? ((approvedApps / totalApps) * 100).toFixed(1) : '0.0';

  // Customer & KYC metrics
  const totalCustomers = customers.length;
  const pendingKycCustomers = customers.filter(
    (c) => c.kycStatus === 'NOT_STARTED' || c.kycStatus === 'PENDING' || c.kycStatus === 'UNDER_REVIEW'
  ).length;
  const verifiedKycCustomers = customers.filter((c) => c.kycStatus === 'VERIFIED').length;
  const kycComplianceRate =
    totalCustomers > 0 ? ((verifiedKycCustomers / totalCustomers) * 100).toFixed(1) : '100.0';

  // Risk distribution
  const highRiskApps = applications.filter((a) => a.riskAssessment?.category === 'HIGH').length;
  const mediumRiskApps = applications.filter((a) => a.riskAssessment?.category === 'MEDIUM').length;
  const lowRiskApps = applications.filter((a) => a.riskAssessment?.category === 'LOW').length;

  // Aging Buckets breakdown
  const bucket030 = scopedCollections.filter((c) => c.agingBucket === '0-30').length;
  const bucket3160 = scopedCollections.filter((c) => c.agingBucket === '31-60').length;
  const bucket6190 = scopedCollections.filter((c) => c.agingBucket === '61-90').length;
  const bucket90Plus = scopedCollections.filter((c) => c.agingBucket === '91-180' || c.agingBucket === '180+').length;

  // Promise-to-Pay (PTP) tracking
  const allPtps = scopedCollections.flatMap((c) => c.promises || []);
  const brokenPtps = allPtps.filter((p: any) => p.status === 'BROKEN').length;
  const pendingPtps = allPtps.filter((p: any) => p.status === 'PENDING').length;
  const keptPtps = allPtps.filter((p: any) => p.status === 'KEPT').length;

  // Branch Performance summary (strictly isolated to allowed branches)
  const branchSummaries = branches.map((b) => {
    const bLoans = loans.filter((l) => l.branchId === b.id);
    const bApps = applications.filter((a) => a.branchId === b.id);
    const bOverdue = scopedCollections
      .filter((c) => c.loan?.branchId === b.id)
      .reduce((sum, c) => sum.plus(c.overdueAmount), new Decimal(0));
    return {
      branchName: b.name,
      totalLoans: bLoans.length,
      totalApplications: bApps.length,
      overdueAmount: Money.toDb(bOverdue),
    };
  });

  const primaryRole = actor.roles[0] || 'BRANCH_MANAGER';
  const roleScopeLabel = `${primaryRole}${isBranchScoped ? ` (${branchName})` : ' (Enterprise Portfolio)'}`;

  const contextPrompt = `
=== OPERATIONAL SCOPE ===
Active Role: ${primaryRole}
Operating Scope: ${roleScopeLabel}
Branch Isolation: ${isBranchScoped ? `Strictly scoped to Branch ${branchName}` : 'Enterprise Multi-Branch Portfolio'}

=== PORTFOLIO & LEDGER TELEMETRY ===
Total Active Loans: ${activeLoans.length} (Closed: ${closedLoans.length}, Overdue: ${overdueLoans.length})
Total Disbursed Volume: ₹${totalDisbursed.toNumber().toLocaleString('en-IN')}
Total Outstanding Principal: ₹${totalOutstanding.toNumber().toLocaleString('en-IN')}
Total Repayments Collected: ₹${totalCollected.toNumber().toLocaleString('en-IN')}
Total Delinquent Overdue: ₹${totalOverdue.toNumber().toLocaleString('en-IN')}
Portfolio at Risk (PAR Ratio): ${parRatio}%

=== BORROWER ONBOARDING & KYC METRICS ===
Total Registered Borrowers: ${totalCustomers}
Borrowers KYC Pending: ${pendingKycCustomers}
Borrowers KYC Verified: ${verifiedKycCustomers}
KYC Compliance Rate: ${kycComplianceRate}%

=== ORIGINATION, CREDIT & UNDERWRITING PIPELINE ===
Total Loan Applications: ${totalApps}
Draft Proposals: ${draftApps}
Pending KYC & Intake Review: ${kycPendingApps}
Pending Credit Assessment: ${pendingCreditAssessment}
Pending Underwriting Queue: ${pendingUnderwriting}
Ready for Disbursement: ${readyForDisbursementApps}
Approved Proposals: ${approvedApps}
Rejected Proposals: ${rejectedApps}
System Approval Rate: ${approvalRate}%

=== RISK ASSESSMENT METRICS ===
High-Risk Proposals: ${highRiskApps}
Medium-Risk Proposals: ${mediumRiskApps}
Low-Risk Proposals: ${lowRiskApps}

=== DELINQUENCY, AGING & RECOVERY ===
Total Active Delinquent Cases: ${scopedCollections.length}
0-30 Days DPD: ${bucket030} Accounts
31-60 Days DPD: ${bucket3160} Accounts
61-90 Days DPD: ${bucket6190} Accounts
90+ Days DPD (NPA Risk): ${bucket90Plus} Accounts
Active Promises to Pay (PTP): ${allPtps.length} (Pending: ${pendingPtps}, Broken: ${brokenPtps}, Kept: ${keptPtps})

=== BRANCH CONTEXT ===
${branchSummaries.map((b) => `- Branch "${b.branchName}": ${b.totalLoans} Loans, ${b.totalApplications} Applications, ₹${b.overdueAmount} Overdue`).join('\n')}
`;

  return {
    primaryRole,
    roleScopeLabel,
    branchName,
    isBranchScoped,
    totalDisbursed: totalDisbursed.toNumber(),
    totalOutstanding: totalOutstanding.toNumber(),
    totalCollected: totalCollected.toNumber(),
    totalOverdue: totalOverdue.toNumber(),
    parRatio,
    activeLoansCount: activeLoans.length,
    closedLoansCount: closedLoans.length,
    overdueLoansCount: overdueLoans.length,
    totalApps,
    draftApps,
    kycPendingApps,
    pendingCreditAssessment,
    pendingUnderwriting,
    readyForDisbursementApps,
    approvedApps,
    rejectedApps,
    approvalRate,
    totalCustomers,
    pendingKycCustomers,
    verifiedKycCustomers,
    kycComplianceRate,
    highRiskApps,
    mediumRiskApps,
    lowRiskApps,
    bucket030,
    bucket3160,
    bucket6190,
    bucket90Plus,
    brokenPtps,
    pendingPtps,
    keptPtps,
    delinquentCasesCount: scopedCollections.length,
    branchSummaries,
    auditLogsCount,
    pendingPaymentSubmissions,
    reconStats,
    contextPrompt,
  };
}

/**
 * Returns role-specific system prompt guidelines for Gemini synthesis.
 */
function getRoleSystemInstruction(primaryRole: string, roleScopeLabel: string): string {
  let roleFocus = '';

  switch (primaryRole) {
    case 'LOAN_OFFICER':
      roleFocus = `
You are the Loan Officer Intelligence Assistant for Adyapan Loan Management System.
Your focus is strictly on borrower intake, KYC document verification velocity, draft proposal conversion, and application origination.
Tailor all insights, KPIs, bottlenecks, and recommendations to the Loan Officer's intake desk and borrower onboarding pipeline.`;
      break;

    case 'CREDIT_ANALYST':
      roleFocus = `
You are the Senior Credit Analyst Intelligence AI for Adyapan Loan Management System.
Your focus is strictly on credit risk assessment, scorecards, borrower debt-to-income (DTI) obligations, risk pillar distributions, and credit evaluation bottlenecks.
Tailor all insights, KPIs, bottlenecks, and recommendations to the Credit Assessment workbench.`;
      break;

    case 'UNDERWRITER':
      roleFocus = `
You are the Chief Underwriting Intelligence AI for Adyapan Loan Management System.
Your focus is strictly on sanction decision queues, policy exception clearances, approval/rejection rates, condition precedents, and sanction exposure limits.
Tailor all insights, KPIs, bottlenecks, and recommendations to the Underwriting workbench.`;
      break;

    case 'FINANCE_OFFICER':
    case 'DISBURSEMENT_OFFICER':
      roleFocus = `
You are the Treasury & Finance Intelligence AI for Adyapan Loan Management System.
Your focus is strictly on ready-for-disbursement queues, fund releases, payment verification submissions, repayment collections, and loan ledger reconciliation.
Tailor all insights, KPIs, bottlenecks, and recommendations to Finance & Treasury operations.`;
      break;

    case 'COLLECTION_OFFICER':
      roleFocus = `
You are the Delinquency & Recovery Intelligence AI for Adyapan Loan Management System.
Your focus is strictly on delinquent accounts, DPD aging buckets (0-30, 31-60, 61-90, 90+ DPD), Promise-to-Pay (PTP) tracking, and debt recovery outreach.
Tailor all insights, KPIs, bottlenecks, and recommendations to Collections & Delinquency management.`;
      break;

    case 'AUDITOR':
      roleFocus = `
You are the Chief Compliance & Internal Audit AI for Adyapan Loan Management System.
Your focus is strictly on institutional governance, KYC compliance adherence, audit trails, status transition integrity, and policy exceptions.
Tailor all insights, KPIs, bottlenecks, and recommendations to Compliance & Audit oversight.`;
      break;

    case 'BRANCH_MANAGER':
      roleFocus = `
You are the Branch Operations Intelligence AI for Adyapan Loan Management System.
Your focus is strictly on end-to-end branch portfolio performance, team origination velocity, branch delinquency, and branch operational bottlenecks.
Tailor all insights, KPIs, bottlenecks, and recommendations to Branch Leadership.`;
      break;

    default: // SUPER_ADMIN, ADMIN
      roleFocus = `
You are the Chief Executive Decision Intelligence AI for Adyapan Loan Management System.
Your focus is enterprise-wide portfolio health, cross-branch performance comparisons, growth trajectory, risk exposures, and strategic institutional decisions.`;
      break;
  }

  return `
${roleFocus}

Current Role Scope: ${roleScopeLabel}

=== STRICT OPERATIONAL & SAFETY RULES ===
1. ROLE & DATA ISOLATION: Evaluate ONLY the operational domain of the user's role and their scoped branch. Never hallucinate access to unauthorized entities.
2. FINANCIAL TRUTH: Never fabricate numbers or override backend KPI values. All calculations provided in context are authoritative.
3. HYPOTHESIS & EVIDENCE: Formulate clear, evidence-based explanations ("Why did this change?").
4. IDENTIFY BOTTLENECKS: Highlight stages where work is accumulating in this role's specific queue.
5. "WHAT SHOULD I LOOK AT?": Provide a ranked, prioritized list of areas needing immediate attention for this role.
6. STRICT JSON: Return ONLY a valid JSON object matching the required schema.

=== REQUIRED JSON SCHEMA ===
{
  "executiveSummary": "A concise 2-3 sentence role-tailored executive briefing on this role's scoped metrics and priority tasks.",
  "kpisInterpretation": [
    {
      "kpi": "Name of KPI (e.g. 'Onboarded Borrowers', 'Credit Assessment Queue', 'PAR Ratio', 'Disbursement Volume')",
      "currentValue": "Formatted value from context",
      "status": "HEALTHY" | "WATCH" | "CRITICAL",
      "interpretation": "Contextual meaning of this value for this role"
    }
  ],
  "keyChanges": [
    {
      "metric": "Metric name",
      "trend": "UP" | "DOWN" | "STABLE",
      "observation": "Observed trend in the data",
      "possibleDriver": "Evidence-backed driver"
    }
  ],
  "bottlenecks": [
    {
      "stage": "Workflow stage (e.g. 'KYC Verification', 'Underwriting Queue', '31-60 Delinquency')",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "evidence": "LMS count/volume",
      "impact": "Operational or credit impact",
      "suggestedInvestigation": "Concrete action for this role"
    }
  ],
  "branchInsights": [
    {
      "branchName": "Branch name",
      "status": "STRONG" | "STABLE" | "NEEDS_ATTENTION",
      "observations": "Branch-level workload and performance evaluation"
    }
  ],
  "collectionInsights": {
    "delinquencyTrajectory": "IMPROVING" | "STABLE" | "DETERIORATING",
    "observations": "Synthesis of aging bucket distribution and recovery volume"
  },
  "whatShouldILookAt": [
    {
      "priority": 1,
      "area": "Specific operational focus area for this role",
      "reason": "Why this is critical right now",
      "recommendedAction": "Actionable step for today"
    }
  ],
  "recommendedActions": [
    "Numbered strategic actions tailored specifically for this role"
  ],
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}
`;
}

/**
 * Generates structured AI Decision Intelligence for LMS dashboards with strict role and branch isolation.
 */
export async function generateDecisionIntelligence(
  actor: { id: string; email: string; roles: string[]; branchId?: string }
): Promise<DecisionIntelligenceResult> {
  // 1. RBAC Guard - only authenticated staff roles
  const isStaff = actor.roles.some((r) =>
    [
      'SUPER_ADMIN',
      'ADMIN',
      'BRANCH_MANAGER',
      'LOAN_OFFICER',
      'CREDIT_ANALYST',
      'UNDERWRITER',
      'FINANCE_OFFICER',
      'DISBURSEMENT_OFFICER',
      'COLLECTION_OFFICER',
      'AUDITOR',
    ].includes(r)
  );
  if (!isStaff) {
    throw new ForbiddenError('Access forbidden: Insufficient permissions for Decision Intelligence');
  }

  // 2. Build verified LMS dashboard context
  const context = await buildDecisionContext(actor);
  const {
    primaryRole,
    roleScopeLabel,
    totalDisbursed,
    totalOutstanding,
    totalCollected,
    totalOverdue,
    parRatio,
    activeLoansCount,
    totalApps,
    draftApps,
    kycPendingApps,
    pendingCreditAssessment,
    pendingUnderwriting,
    readyForDisbursementApps,
    approvedApps,
    rejectedApps,
    approvalRate,
    totalCustomers,
    pendingKycCustomers,
    kycComplianceRate,
    highRiskApps,
    bucket030,
    bucket3160,
    bucket6190,
    bucket90Plus,
    brokenPtps,
    pendingPtps,
    delinquentCasesCount,
    branchSummaries,
    pendingPaymentSubmissions,
    reconStats,
    contextPrompt,
  } = context;

  // 3. System Prompt
  const systemInstruction = getRoleSystemInstruction(primaryRole, roleScopeLabel);

  let result: DecisionIntelligenceResult;

  try {
    // 4. Generate content via Central Gemini Service
    const geminiResult = await generateGeminiContent({
      prompt: `Analyze the following LMS metrics and generate the role-tailored Decision Intelligence JSON briefing:\n\n${contextPrompt}`,
      systemInstruction,
      temperature: 0.1,
    });

    // 5. Safe JSON Parsing
    const rawText = geminiResult.text.trim();
    const cleanJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(cleanJson);

    result = {
      generatedAt: new Date().toISOString(),
      dataAsOf: new Date().toISOString(),
      model: geminiResult.model,
      roleScope: roleScopeLabel,
      executiveSummary:
        parsed.executiveSummary ||
        `${roleScopeLabel} briefing: ${totalApps} applications in pipeline, ₹${totalDisbursed.toLocaleString('en-IN')} disbursed across ${activeLoansCount} active loans with a PAR ratio of ${parRatio}%.`,
      kpisInterpretation: Array.isArray(parsed.kpisInterpretation)
        ? parsed.kpisInterpretation
        : [
            {
              kpi: 'Pipeline Throughput',
              currentValue: `${approvedApps}/${totalApps} Approved`,
              status: 'HEALTHY',
              interpretation: 'Active origination conversion.',
            },
            {
              kpi: 'PAR Ratio',
              currentValue: `${parRatio}%`,
              status: Number(parRatio) > 5 ? 'CRITICAL' : 'HEALTHY',
              interpretation: 'Portfolio at risk.',
            },
          ],
      keyChanges: Array.isArray(parsed.keyChanges) ? parsed.keyChanges : [],
      bottlenecks: Array.isArray(parsed.bottlenecks) ? parsed.bottlenecks : [],
      branchInsights: Array.isArray(parsed.branchInsights)
        ? parsed.branchInsights
        : branchSummaries.map((b) => ({
            branchName: b.branchName,
            status: 'STABLE',
            observations: `${b.totalLoans} loans and ${b.totalApplications} applications managed.`,
          })),
      collectionInsights: {
        totalOverdue,
        parRatio,
        delinquencyTrajectory:
          parsed.collectionInsights?.delinquencyTrajectory || (totalOverdue > 0 ? 'DETERIORATING' : 'STABLE'),
        observations:
          parsed.collectionInsights?.observations || 'Delinquency evaluated across active collection cases.',
      },
      whatShouldILookAt: Array.isArray(parsed.whatShouldILookAt) ? parsed.whatShouldILookAt : [],
      recommendedActions: Array.isArray(parsed.recommendedActions)
        ? parsed.recommendedActions
        : ['Review prioritized workbench items and operational queues.'],
      confidence: ['HIGH', 'MEDIUM', 'LOW'].includes(parsed.confidence) ? parsed.confidence : 'HIGH',
    };
  } catch {
    // 6. Role-Scoped Deterministic Rule-Based Fallback
    const isParHigh = Number(parRatio) > 5;
    const bottlenecks: DecisionIntelligenceResult['bottlenecks'] = [];
    const whatShouldILookAt: DecisionIntelligenceResult['whatShouldILookAt'] = [];
    let kpisInterpretation: DecisionIntelligenceResult['kpisInterpretation'] = [];
    let executiveSummary = '';
    let recommendedActions: string[] = [];

    switch (primaryRole) {
      case 'LOAN_OFFICER':
        executiveSummary = `Loan Officer Briefing (${roleScopeLabel}): Managing ${totalCustomers} registered borrower(s) and ${totalApps} intake application(s). ${pendingKycCustomers} borrower(s) require KYC document collection. ${draftApps} proposal(s) are in draft.`;
        kpisInterpretation = [
          {
            kpi: 'Registered Borrowers',
            currentValue: `${totalCustomers}`,
            status: 'HEALTHY',
            interpretation: 'Total borrowers onboarded in assigned scope.',
          },
          {
            kpi: 'KYC Verification Pending',
            currentValue: `${pendingKycCustomers}`,
            status: pendingKycCustomers > 5 ? 'WATCH' : 'HEALTHY',
            interpretation: 'Borrowers requiring identity & income verification.',
          },
          {
            kpi: 'Draft Proposals',
            currentValue: `${draftApps}`,
            status: draftApps > 3 ? 'WATCH' : 'HEALTHY',
            interpretation: 'Applications ready for document completion & submission.',
          },
          {
            kpi: 'Sanctioned Proposals',
            currentValue: `${approvedApps}`,
            status: 'HEALTHY',
            interpretation: 'Successfully sanctioned loans converted from your pipeline.',
          },
        ];
        if (pendingKycCustomers > 0) {
          bottlenecks.push({
            stage: 'Borrower KYC Verification',
            severity: pendingKycCustomers > 5 ? 'HIGH' : 'MEDIUM',
            evidence: `${pendingKycCustomers} customer(s) pending KYC document submission`,
            impact: 'Delays application submission and underwriting readiness',
            suggestedInvestigation: 'Reach out to borrowers with pending documents to complete onboarding.',
          });
          whatShouldILookAt.push({
            priority: 1,
            area: 'Pending KYC Documents',
            reason: `${pendingKycCustomers} borrower(s) are awaiting KYC verification.`,
            recommendedAction: 'Verify pending identity and bank documentation in Customer management.',
          });
        }
        if (draftApps > 0) {
          whatShouldILookAt.push({
            priority: 2,
            area: 'Draft Loan Applications',
            reason: `${draftApps} application(s) are currently in draft status.`,
            recommendedAction: 'Finalize loan parameters and submit proposals for credit assessment.',
          });
        }
        recommendedActions = [
          'Contact borrowers with pending KYC to expedite documentation.',
          'Review draft loan proposals and submit completed files for underwriting.',
        ];
        break;

      case 'CREDIT_ANALYST':
        executiveSummary = `Credit Risk Briefing (${roleScopeLabel}): ${pendingCreditAssessment} application(s) in credit assessment queue. High-risk proposals count: ${highRiskApps}. System approval conversion is ${approvalRate}%.`;
        kpisInterpretation = [
          {
            kpi: 'Credit Assessment Queue',
            currentValue: `${pendingCreditAssessment}`,
            status: pendingCreditAssessment > 5 ? 'WATCH' : 'HEALTHY',
            interpretation: 'Applications awaiting risk scorecards and obligation analysis.',
          },
          {
            kpi: 'High-Risk Applications',
            currentValue: `${highRiskApps}`,
            status: highRiskApps > 0 ? 'CRITICAL' : 'HEALTHY',
            interpretation: 'Applications flagged with elevated risk scores or high DTI.',
          },
          {
            kpi: 'System Approval Rate',
            currentValue: `${approvalRate}%`,
            status: 'HEALTHY',
            interpretation: 'Proportion of evaluated applications sanctioned.',
          },
        ];
        if (pendingCreditAssessment > 0) {
          bottlenecks.push({
            stage: 'Credit Assessment Queue',
            severity: pendingCreditAssessment > 5 ? 'HIGH' : 'MEDIUM',
            evidence: `${pendingCreditAssessment} application(s) awaiting credit evaluation`,
            impact: 'Turnaround time elongation for loan sanctioning',
            suggestedInvestigation: 'Evaluate credit eligibility factors and risk scorecards.',
          });
          whatShouldILookAt.push({
            priority: 1,
            area: 'Credit Review Queue',
            reason: `${pendingCreditAssessment} application(s) require credit risk assessment.`,
            recommendedAction: 'Process applications in credit assessment workbench.',
          });
        }
        recommendedActions = [
          'Evaluate high-risk applicant scorecards and debt obligations.',
          'Pass eligible proposals forward to the underwriting queue.',
        ];
        break;

      case 'UNDERWRITER':
        executiveSummary = `Underwriting Sanction Briefing (${roleScopeLabel}): ${pendingUnderwriting} proposal(s) awaiting sanction decision. Sanction approval rate is ${approvalRate}% across ${totalApps} total applications.`;
        kpisInterpretation = [
          {
            kpi: 'Pending Underwriting Queue',
            currentValue: `${pendingUnderwriting}`,
            status: pendingUnderwriting > 5 ? 'WATCH' : 'HEALTHY',
            interpretation: 'Proposals awaiting sanction decision or condition stipulations.',
          },
          {
            kpi: 'Approval Rate',
            currentValue: `${approvalRate}%`,
            status: 'HEALTHY',
            interpretation: 'Sanctions issued relative to total evaluated applications.',
          },
          {
            kpi: 'Sanctioned Proposals',
            currentValue: `${approvedApps}`,
            status: 'HEALTHY',
            interpretation: 'Applications approved and moved toward disbursement.',
          },
        ];
        if (pendingUnderwriting > 0) {
          bottlenecks.push({
            stage: 'Underwriting Sanctions Queue',
            severity: pendingUnderwriting > 10 ? 'HIGH' : 'MEDIUM',
            evidence: `${pendingUnderwriting} proposals awaiting underwriter decision`,
            impact: 'Increased origination turnaround time',
            suggestedInvestigation: 'Review pending sanction files and policy condition clearances.',
          });
          whatShouldILookAt.push({
            priority: 1,
            area: 'Underwriting Sanction Queue',
            reason: `${pendingUnderwriting} proposal(s) are awaiting underwriting sanction.`,
            recommendedAction: 'Execute sanction decisions or request condition clearances in Underwriting.',
          });
        }
        recommendedActions = [
          'Review prioritized applications in the Underwriting workbench.',
          'Verify policy exception thresholds before issuing conditional sanctions.',
        ];
        break;

      case 'FINANCE_OFFICER':
      case 'DISBURSEMENT_OFFICER':
        executiveSummary = `Treasury & Finance Briefing (${roleScopeLabel}): ${readyForDisbursementApps} application(s) ready for disbursement, ${pendingPaymentSubmissions} repayment submission(s) awaiting verification. Reconciliation health at ${reconStats.reconciliationHealthPercent}% with ${reconStats.totalActiveExceptions} active exception(s). ₹${totalDisbursed.toLocaleString('en-IN')} disbursed, ₹${totalCollected.toLocaleString('en-IN')} collected.`;
        kpisInterpretation = [
          {
            kpi: 'Ready for Disbursement',
            currentValue: `${readyForDisbursementApps}`,
            status: readyForDisbursementApps > 3 ? 'WATCH' : 'HEALTHY',
            interpretation: 'Approved proposals awaiting UTR & payout execution.',
          },
          {
            kpi: 'Payment Intimations',
            currentValue: `${pendingPaymentSubmissions}`,
            status: pendingPaymentSubmissions > 0 ? 'WATCH' : 'HEALTHY',
            interpretation: 'Borrower payment proofs awaiting verification and ledger settlement.',
          },
          {
            kpi: 'Reconciliation Health',
            currentValue: `${reconStats.reconciliationHealthPercent}%`,
            status: reconStats.reconciliationHealthPercent < 95 ? 'CRITICAL' : reconStats.reconciliationHealthPercent < 99 ? 'WATCH' : 'HEALTHY',
            interpretation: `${reconStats.totalActiveExceptions} open accounting exception(s) across 5 financial pillars.`,
          },
          {
            kpi: 'Total Disbursed Volume',
            currentValue: `₹${totalDisbursed.toLocaleString('en-IN')}`,
            status: 'HEALTHY',
            interpretation: 'Net cumulative funds released to active borrowers.',
          },
          {
            kpi: 'Total Repayments Collected',
            currentValue: `₹${totalCollected.toLocaleString('en-IN')}`,
            status: 'HEALTHY',
            interpretation: 'Net cumulative repayments settled into double-entry accounting ledger.',
          },
        ];
        if (readyForDisbursementApps > 0) {
          bottlenecks.push({
            stage: 'Disbursement Execution Queue',
            severity: readyForDisbursementApps > 5 ? 'HIGH' : 'MEDIUM',
            evidence: `${readyForDisbursementApps} loans ready for fund transfer`,
            impact: 'Borrower disbursement wait-time increase',
            suggestedInvestigation: 'Validate beneficiary bank accounts and issue disbursement payouts.',
          });
          whatShouldILookAt.push({
            priority: 1,
            area: 'Ready for Disbursement Queue',
            reason: `${readyForDisbursementApps} application(s) are ready for immediate disbursement payout.`,
            recommendedAction: 'Execute payouts and attach UTR references in Disbursements.',
          });
        }
        if (pendingPaymentSubmissions > 0) {
          whatShouldILookAt.push({
            priority: 2,
            area: 'Payment Submissions Verification',
            reason: `${pendingPaymentSubmissions} payment proof(s) recorded in field require verification.`,
            recommendedAction: 'Verify UTR against bank account and apply waterfall ledger settlement.',
          });
        }
        recommendedActions = [
          'Execute NEFT/RTGS payouts for approved loan applications awaiting release.',
          'Verify pending payment submissions and validate UTRs against bank statements.',
          'Inspect reconciliation dashboard and resolve any open accounting discrepancies.',
        ];
        break;

      case 'COLLECTION_OFFICER':
        executiveSummary = `Collections & Delinquency Briefing (${roleScopeLabel}): Managing ${delinquentCasesCount} active delinquent case(s) with ₹${totalOverdue.toLocaleString('en-IN')} in overdue debt. Current PAR ratio is ${parRatio}%. Broken PTPs: ${brokenPtps}.`;
        kpisInterpretation = [
          {
            kpi: 'Total Delinquent Overdue',
            currentValue: `₹${totalOverdue.toLocaleString('en-IN')}`,
            status: totalOverdue > 0 ? 'CRITICAL' : 'HEALTHY',
            interpretation: 'Active overdue debt across delinquent accounts.',
          },
          {
            kpi: 'Portfolio at Risk (PAR)',
            currentValue: `${parRatio}%`,
            status: isParHigh ? 'CRITICAL' : Number(parRatio) > 2 ? 'WATCH' : 'HEALTHY',
            interpretation: isParHigh ? 'Elevated delinquency requiring targeted recovery.' : 'Within institutional recovery thresholds.',
          },
          {
            kpi: 'Early Delinquency (0-30 DPD)',
            currentValue: `${bucket030} Accounts`,
            status: bucket030 > 5 ? 'WATCH' : 'HEALTHY',
            interpretation: 'Immediate intervention accounts to prevent roll-rate deterioration.',
          },
          {
            kpi: 'Broken PTP Commitments',
            currentValue: `${brokenPtps}`,
            status: brokenPtps > 0 ? 'CRITICAL' : 'HEALTHY',
            interpretation: 'Borrowers who failed to honor promised payment dates.',
          },
        ];
        if (totalOverdue > 0) {
          bottlenecks.push({
            stage: 'Delinquency Recovery',
            severity: isParHigh ? 'HIGH' : 'MEDIUM',
            evidence: `₹${totalOverdue.toLocaleString('en-IN')} overdue across ${delinquentCasesCount} accounts`,
            impact: 'Elevated credit provisioning and NPA risk',
            suggestedInvestigation: 'Conduct borrower outreach and follow up on broken payment promises.',
          });
          whatShouldILookAt.push({
            priority: 1,
            area: 'Broken Promise-to-Pay (PTP) Accounts',
            reason: `${brokenPtps} borrower(s) defaulted on their agreed payment dates.`,
            recommendedAction: 'Initiate prioritized collection follow-ups in Collections workbench.',
          });
        }
        recommendedActions = [
          'Prioritize borrower contact on 0-30 DPD accounts to prevent bucket migration.',
          'Follow up urgently on broken PTP commitments.',
        ];
        break;

      case 'AUDITOR':
        executiveSummary = `Internal Audit & Compliance Briefing (${roleScopeLabel}): ${context.auditLogsCount} audit logs recorded. Overall KYC verification compliance is ${kycComplianceRate}%. Active portfolio PAR stands at ${parRatio}%.`;
        kpisInterpretation = [
          {
            kpi: 'KYC Compliance Rate',
            currentValue: `${kycComplianceRate}%`,
            status: Number(kycComplianceRate) < 90 ? 'WATCH' : 'HEALTHY',
            interpretation: 'Percentage of verified borrowers in portfolio.',
          },
          {
            kpi: 'Audit Trail Coverage',
            currentValue: `${context.auditLogsCount} events`,
            status: 'HEALTHY',
            interpretation: 'Immutable ledger events tracked for institutional governance.',
          },
          {
            kpi: 'Portfolio at Risk (PAR)',
            currentValue: `${parRatio}%`,
            status: isParHigh ? 'CRITICAL' : 'HEALTHY',
            interpretation: 'Audit risk flag based on active delinquency.',
          },
        ];
        whatShouldILookAt.push({
          priority: 1,
          area: 'KYC Compliance Verification',
          reason: `${pendingKycCustomers} borrower(s) have unverified KYC status.`,
          recommendedAction: 'Audit unverified customer document uploads against regulatory norms.',
        });
        recommendedActions = [
          'Review underwriting sanction condition logs and exception approvals.',
          'Audit high-DPD accounts for documentation completeness.',
        ];
        break;

      default: // BRANCH_MANAGER, SUPER_ADMIN, ADMIN
        executiveSummary = `Executive Portfolio Briefing (${roleScopeLabel}): ₹${totalDisbursed.toLocaleString('en-IN')} disbursed across ${activeLoansCount} active loans with ₹${totalOutstanding.toLocaleString('en-IN')} outstanding. PAR ratio is ${parRatio}% and approval rate is ${approvalRate}%.`;
        kpisInterpretation = [
          {
            kpi: 'Disbursement Volume',
            currentValue: `₹${totalDisbursed.toLocaleString('en-IN')}`,
            status: 'HEALTHY',
            interpretation: `Cumulative capital deployed across ${activeLoansCount} active accounts.`,
          },
          {
            kpi: 'PAR Ratio',
            currentValue: `${parRatio}%`,
            status: isParHigh ? 'CRITICAL' : Number(parRatio) > 2 ? 'WATCH' : 'HEALTHY',
            interpretation: isParHigh ? 'Elevated delinquency requiring operational intervention.' : 'Delinquency is within institutional limits.',
          },
          {
            kpi: 'Approval Rate',
            currentValue: `${approvalRate}%`,
            status: 'HEALTHY',
            interpretation: `${approvedApps} approvals out of ${totalApps} applications.`,
          },
        ];
        if (totalOverdue > 0) {
          bottlenecks.push({
            stage: 'Delinquency & Collections',
            severity: isParHigh ? 'HIGH' : 'MEDIUM',
            evidence: `₹${totalOverdue.toLocaleString('en-IN')} total overdue across portfolio`,
            impact: 'Elevated portfolio risk and provisioning requirements',
            suggestedInvestigation: 'Audit active Promise-to-Pay commitments in Collections workbench.',
          });
          whatShouldILookAt.push({
            priority: 1,
            area: 'Delinquency & Overdue Balances',
            reason: `PAR ratio is currently ${parRatio}% with ₹${totalOverdue.toLocaleString('en-IN')} in overdue debt.`,
            recommendedAction: 'Engage with collection officers on high-DPD accounts.',
          });
        }
        if (pendingUnderwriting > 0) {
          whatShouldILookAt.push({
            priority: 2,
            area: 'Origination Pipeline',
            reason: `${pendingUnderwriting} application(s) awaiting underwriting decision.`,
            recommendedAction: 'Review prioritized applications in the Underwriting workbench.',
          });
        }
        recommendedActions = [
          'Review underwriting queue to clear pending origination backlogs.',
          'Follow up on active collection cases with broken PTP commitments.',
        ];
        break;
    }

    result = {
      generatedAt: new Date().toISOString(),
      dataAsOf: new Date().toISOString(),
      model: 'deterministic-rules-engine',
      roleScope: roleScopeLabel,
      executiveSummary,
      kpisInterpretation,
      keyChanges: [
        {
          metric: 'Delinquent Overdue',
          trend: totalOverdue > 0 ? 'UP' : 'STABLE',
          observation: `₹${totalOverdue.toLocaleString('en-IN')} in active overdue debt.`,
          possibleDriver: 'Delinquency aging progression across active loan accounts.',
        },
      ],
      bottlenecks,
      branchInsights: branchSummaries.map((b) => ({
        branchName: b.branchName,
        status: Number(b.overdueAmount) > 50000 ? 'NEEDS_ATTENTION' : 'STABLE',
        observations: `${b.totalLoans} loan(s) and ${b.totalApplications} application(s) managed. Overdue: ₹${Number(b.overdueAmount).toLocaleString('en-IN')}.`,
      })),
      collectionInsights: {
        totalOverdue,
        parRatio,
        delinquencyTrajectory: totalOverdue > 0 ? 'DETERIORATING' : 'STABLE',
        observations: `Delinquency rate stands at ${parRatio}% with ₹${totalOverdue.toLocaleString('en-IN')} total overdue.`,
      },
      whatShouldILookAt,
      recommendedActions,
      confidence: 'HIGH',
    };
  }

  // 7. Audit Trail
  await logAudit({
    userId: actor.id,
    role: primaryRole,
    action: 'DECISION_INTELLIGENCE_GENERATED',
    entity: 'Dashboard',
    entityId: context.isBranchScoped && actor.branchId ? actor.branchId : 'PORTFOLIO_OVERVIEW',
    newValue: {
      roleScope: result.roleScope,
      parRatio,
      confidence: result.confidence,
      model: result.model,
      generatedBy: actor.email,
    },
  });

  return result;
}
