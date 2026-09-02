import { Decimal } from 'decimal.js';
import { prisma } from '../../config/prisma';
import { generateGeminiContent } from './gemini.service';
import { ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { Money } from '../finance/money';

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
 * Builds aggregated LMS portfolio context for Decision Intelligence.
 */
async function buildDecisionContext(actor: { id: string; email: string; roles: string[]; branchId?: string }) {
  const isBranchManager = actor.roles.includes('BRANCH_MANAGER') && !actor.roles.includes('SUPER_ADMIN');
  const branchFilter = isBranchManager && actor.branchId ? { branchId: actor.branchId } : {};

  const [
    loans,
    applications,
    disbursements,
    payments,
    collectionCases,
    branches,
    products,
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
      },
    }),
    prisma.disbursement.findMany({
      where: { status: 'COMPLETED' },
      include: { loan: { select: { branchId: true } } },
    }),
    prisma.payment.findMany({
      where: { status: 'SUCCESS' },
      include: { loan: { select: { branchId: true } } },
    }),
    prisma.collectionCase.findMany({
      where: { status: { in: ['OPEN', 'IN_PROGRESS', 'PROMISED', 'ESCALATED'] } },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        loan: { select: { loanNo: true, branchId: true } },
      },
    }),
    prisma.branch.findMany({ select: { id: true, name: true, code: true } }),
    prisma.loanProduct.findMany({ select: { id: true, name: true, code: true } }),
  ]);

  // Filter scoped disbursements & payments if branch-scoped
  const scopedDisbursements = isBranchManager && actor.branchId
    ? disbursements.filter((d) => d.loan?.branchId === actor.branchId)
    : disbursements;
  const scopedPayments = isBranchManager && actor.branchId
    ? payments.filter((p) => p.loan?.branchId === actor.branchId)
    : payments;
  const scopedCollections = isBranchManager && actor.branchId
    ? collectionCases.filter((c) => c.loan?.branchId === actor.branchId)
    : collectionCases;

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
  const pendingUnderwriting = applications.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDERWRITING').length;
  const approvedApps = applications.filter((a) => a.status === 'APPROVED' || a.status === 'READY_FOR_DISBURSEMENT' || a.status === 'DISBURSED').length;
  const rejectedApps = applications.filter((a) => a.status === 'REJECTED').length;
  const approvalRate = totalApps > 0 ? ((approvedApps / totalApps) * 100).toFixed(1) : '0.0';

  // Aging Buckets breakdown
  const bucket030 = scopedCollections.filter((c) => c.agingBucket === '0-30').length;
  const bucket3160 = scopedCollections.filter((c) => c.agingBucket === '31-60').length;
  const bucket6190 = scopedCollections.filter((c) => c.agingBucket === '61-90').length;
  const bucket90Plus = scopedCollections.filter((c) => c.agingBucket === '91-180' || c.agingBucket === '180+').length;

  // Branch Performance summary
  const branchSummaries = branches.map((b) => {
    const bLoans = loans.filter((l) => l.branchId === b.id);
    const bApps = applications.filter((a) => a.branchId === b.id);
    const bOverdue = scopedCollections.filter((c) => c.loan?.branchId === b.id).reduce((sum, c) => sum.plus(c.overdueAmount), new Decimal(0));
    return {
      branchName: b.name,
      totalLoans: bLoans.length,
      totalApplications: bApps.length,
      overdueAmount: Money.toDb(bOverdue),
    };
  });

  const contextPrompt = `
=== AUTHORITATIVE PORTFOLIO KPIS ===
Role Scope: ${actor.roles.join(', ')} (${isBranchManager ? 'Branch Scoped' : 'Enterprise Level'})
Total Active Loans: ${activeLoans.length} (Closed: ${closedLoans.length}, Overdue: ${overdueLoans.length})
Total Disbursed Volume: ₹${totalDisbursed.toNumber().toLocaleString('en-IN')}
Total Outstanding Principal: ₹${totalOutstanding.toNumber().toLocaleString('en-IN')}
Total Repayments Collected: ₹${totalCollected.toNumber().toLocaleString('en-IN')}
Total Delinquent Overdue: ₹${totalOverdue.toNumber().toLocaleString('en-IN')}
Portfolio at Risk (PAR Ratio): ${parRatio}%

=== ORIGINATION & UNDERWRITING PIPELINE ===
Total Loan Applications: ${totalApps}
Pending Underwriting Queue: ${pendingUnderwriting}
Approved / Disbursed: ${approvedApps}
Rejected: ${rejectedApps}
System Approval Rate: ${approvalRate}%

=== DELINQUENCY & AGING DISTRIBUTION ===
Total Active Delinquent Cases: ${scopedCollections.length}
0-30 Days DPD: ${bucket030} Accounts
31-60 Days DPD: ${bucket3160} Accounts
61-90 Days DPD: ${bucket6190} Accounts
90+ Days DPD (NPA Risk): ${bucket90Plus} Accounts

=== BRANCH BREAKDOWN ===
${branchSummaries.map((b) => `- Branch "${b.branchName}": ${b.totalLoans} Loans, ${b.totalApplications} Applications, ₹${b.overdueAmount} Overdue`).join('\n')}
`;

  return {
    totalDisbursed: totalDisbursed.toNumber(),
    totalOutstanding: totalOutstanding.toNumber(),
    totalCollected: totalCollected.toNumber(),
    totalOverdue: totalOverdue.toNumber(),
    parRatio,
    activeLoansCount: activeLoans.length,
    pendingUnderwriting,
    approvedApps,
    rejectedApps,
    approvalRate,
    bucket030,
    bucket3160,
    bucket6190,
    bucket90Plus,
    branchSummaries,
    contextPrompt,
  };
}

/**
 * Generates structured AI Decision Intelligence for LMS dashboards.
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
      'COLLECTION_OFFICER',
      'AUDITOR',
    ].includes(r)
  );
  if (!isStaff) {
    throw new ForbiddenError('Access forbidden: Insufficient permissions for Decision Intelligence');
  }

  // 2. Build verified LMS dashboard context
  const {
    totalDisbursed,
    totalOutstanding,
    totalCollected,
    totalOverdue,
    parRatio,
    activeLoansCount,
    pendingUnderwriting,
    approvedApps,
    rejectedApps,
    approvalRate,
    branchSummaries,
    contextPrompt,
  } = await buildDecisionContext(actor);

  // 3. System Prompt
  const systemInstruction = `
You are the Chief Decision Intelligence AI for Adyapan Loan Management System.
You transform dashboard reports into actionable decision-support insights for executive management and branch managers.

=== STRICT OPERATIONAL & SAFETY RULES ===
1. FINANCIAL TRUTH: Never fabricate numbers or override backend KPI values. All calculations provided in context are authoritative.
2. HYPOTHESIS & EVIDENCE: Formulate clear, evidence-based explanations ("Why did this change?"). Do not make unsupported causal claims.
3. IDENTIFY BOTTLENECKS: Highlight stages where work is accumulating (e.g. pending underwriting, uncontacted overdue accounts).
4. "WHAT SHOULD I LOOK AT?": Provide a ranked, prioritized list of areas needing immediate management review.
5. STRICT JSON: Return ONLY a valid JSON object matching the required schema.

=== REQUIRED JSON SCHEMA ===
{
  "executiveSummary": "A concise 2-3 sentence executive briefing on overall portfolio growth, origination pipeline health, and delinquency movement.",
  "kpisInterpretation": [
    {
      "kpi": "Name of KPI (e.g. 'PAR Ratio', 'Approval Rate', 'Disbursement Volume')",
      "currentValue": "Formatted value from context",
      "status": "HEALTHY" | "WATCH" | "CRITICAL",
      "interpretation": "Contextual meaning of this value"
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
      "stage": "Workflow stage (e.g. 'Underwriting Queue', '31-60 Delinquency')",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "evidence": "LMS count/volume",
      "impact": "Operational or credit impact",
      "suggestedInvestigation": "Concrete action for manager"
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
      "area": "Specific operational focus area",
      "reason": "Why this is critical right now",
      "recommendedAction": "Actionable step for today"
    }
  ],
  "recommendedActions": [
    "Numbered strategic actions for executive leadership"
  ],
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}
`;

  // 4. Generate content via Central Gemini Service
  const geminiResult = await generateGeminiContent({
    prompt: `Analyze the following LMS dashboard metrics and generate the Decision Intelligence JSON briefing:\n\n${contextPrompt}`,
    systemInstruction,
    temperature: 0.1,
  });

  // 5. Safe JSON Parsing
  let parsed: any;
  try {
    const rawText = geminiResult.text.trim();
    const cleanJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    parsed = JSON.parse(cleanJson);
  } catch (err: any) {
    throw new BadRequestError(`Failed to parse AI Decision Intelligence response: ${err.message}`);
  }

  const result: DecisionIntelligenceResult = {
    generatedAt: new Date().toISOString(),
    dataAsOf: new Date().toISOString(),
    model: geminiResult.model,
    roleScope: actor.roles.join(', '),
    executiveSummary: parsed.executiveSummary || 'Portfolio performance briefing synthesized from active LMS accounts.',
    kpisInterpretation: Array.isArray(parsed.kpisInterpretation) ? parsed.kpisInterpretation : [
      { kpi: 'Disbursed Volume', currentValue: `₹${totalDisbursed.toLocaleString('en-IN')}`, status: 'HEALTHY', interpretation: 'Active fund deployment.' },
      { kpi: 'PAR Ratio', currentValue: `${parRatio}%`, status: Number(parRatio) > 5 ? 'CRITICAL' : 'HEALTHY', interpretation: 'Portfolio at risk.' }
    ],
    keyChanges: Array.isArray(parsed.keyChanges) ? parsed.keyChanges : [],
    bottlenecks: Array.isArray(parsed.bottlenecks) ? parsed.bottlenecks : [],
    branchInsights: Array.isArray(parsed.branchInsights) ? parsed.branchInsights : branchSummaries.map((b) => ({ branchName: b.branchName, status: 'STABLE', observations: `${b.totalLoans} loans managed.` })),
    collectionInsights: {
      totalOverdue,
      parRatio,
      delinquencyTrajectory: parsed.collectionInsights?.delinquencyTrajectory || (totalOverdue > 0 ? 'DETERIORATING' : 'STABLE'),
      observations: parsed.collectionInsights?.observations || 'Delinquency evaluated across active collection cases.',
    },
    whatShouldILookAt: Array.isArray(parsed.whatShouldILookAt) ? parsed.whatShouldILookAt : [],
    recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : ['Review pipeline throughput and collection follow-ups.'],
    confidence: ['HIGH', 'MEDIUM', 'LOW'].includes(parsed.confidence) ? parsed.confidence : 'HIGH',
  };

  // 6. Audit Trail
  await logAudit({
    userId: actor.id,
    action: 'DECISION_INTELLIGENCE_GENERATED',
    entity: 'Dashboard',
    entityId: 'PORTFOLIO_OVERVIEW',
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
