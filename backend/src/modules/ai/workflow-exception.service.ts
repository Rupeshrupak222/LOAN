import { prisma } from '../../config/prisma';
import { generateGeminiContent } from './gemini.service';
import { ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';

export interface WorkflowExceptionItem {
  exceptionId: string;
  category: 'KYC' | 'ORIGINATION' | 'UNDERWRITING' | 'DISBURSEMENT' | 'SERVICING' | 'COLLECTIONS';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  title: string;
  summary: string;
  workflowStage: string;
  entityType: 'LoanApplication' | 'Customer' | 'Loan' | 'CollectionCase' | 'Document';
  entityId: string;
  entityCode: string;
  evidence: string[];
  impact: string;
  recommendedAction: string;
  suggestedOwner: string;
  relatedExceptionIds?: string[];
}

export interface WorkflowExceptionCenterResult {
  generatedAt: string;
  dataAsOf: string;
  model: string;
  summary: string;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  exceptions: WorkflowExceptionItem[];
  topPriorityExceptions: {
    priority: number;
    title: string;
    whyItMatters: string;
    recommendedAction: string;
    targetRole: string;
  }[];
  crossModuleChains: {
    rootCause: string;
    affectedDownstreamWorkflows: string[];
    explanation: string;
  }[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Scans deterministic workflow exceptions directly from authoritative LMS models.
 */
async function scanDeterministicExceptions(actor: { id: string; email: string; roles: string[]; branchId?: string }) {
  const isBranchManager = actor.roles.includes('BRANCH_MANAGER') && !actor.roles.includes('SUPER_ADMIN');
  const branchFilter = isBranchManager && actor.branchId ? { branchId: actor.branchId } : {};

  const [
    pendingApps,
    delinquentCases,
    customers,
    activeLoans,
  ] = await Promise.all([
    prisma.loanApplication.findMany({
      where: {
        ...branchFilter,
        status: { in: ['SUBMITTED', 'UNDERWRITING', 'APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT'] },
      },
      include: {
        customer: { include: { bankAccounts: true, documents: true } },
        underwriting: true,
        eligibility: true,
        riskAssessment: true,
        product: true,
      },
      take: 20,
    }),
    prisma.collectionCase.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS', 'PROMISED', 'ESCALATED'] },
        ...(isBranchManager && actor.branchId ? { loan: { branchId: actor.branchId } } : {}),
      },
      include: {
        customer: true,
        loan: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 3 },
        promises: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
      take: 20,
    }),
    prisma.customer.findMany({
      where: {
        ...branchFilter,
        status: 'ACTIVE',
      },
      include: {
        documents: true,
        bankAccounts: true,
      },
      take: 20,
    }),
    prisma.loan.findMany({
      where: {
        ...branchFilter,
        status: 'ACTIVE',
      },
      include: {
        customer: { include: { bankAccounts: true } },
        schedule: true,
        disbursements: true,
      },
      take: 20,
    }),
  ]);

  const rawExceptions: WorkflowExceptionItem[] = [];

  // 1. Scan Application & Underwriting Exceptions
  pendingApps.forEach((app) => {
    if (!app.underwriting && (app.status === 'SUBMITTED' || app.status === 'UNDERWRITING')) {
      rawExceptions.push({
        exceptionId: `EXC-APP-${app.applicationNo}`,
        category: 'UNDERWRITING',
        severity: 'HIGH',
        title: `Underwriting Decision Pending for Proposal #${app.applicationNo}`,
        summary: `Application for ₹${Number(app.requestedAmount).toLocaleString('en-IN')} is awaiting credit sanction.`,
        workflowStage: app.status,
        entityType: 'LoanApplication',
        entityId: app.id,
        entityCode: app.applicationNo,
        evidence: [
          `Application Status: ${app.status}`,
          `Requested Amount: ₹${Number(app.requestedAmount).toLocaleString('en-IN')}`,
          `Borrower: ${app.customer.firstName} ${app.customer.lastName}`,
        ],
        impact: 'Borrower onboarding and loan disbursement are blocked until an Underwriting decision is logged.',
        recommendedAction: 'Underwriter should evaluate eligibility and record sanction approval or rejection.',
        suggestedOwner: 'Underwriter',
      });
    }
  });

  // 2. Scan KYC & Document Inconsistencies
  customers.forEach((c) => {
    const docCategories = new Set(c.documents.map((d) => d.category.toUpperCase()));
    const missingCategories = ['IDENTITY_PROOF', 'ADDRESS_PROOF', 'INCOME_PROOF'].filter(
      (cat) => !docCategories.has(cat) && !docCategories.has(cat.replace('_PROOF', ''))
    );
    if (c.kycStatus === 'VERIFIED' && missingCategories.length > 0) {
      rawExceptions.push({
        exceptionId: `EXC-KYC-${c.customerCode}`,
        category: 'KYC',
        severity: 'MEDIUM',
        title: `KYC Compliance Gap on Verified Profile #${c.customerCode}`,
        summary: `Borrower is marked as 'VERIFIED' but missing mandatory documents: ${missingCategories.join(', ')}.`,
        workflowStage: 'KYC_VERIFICATION',
        entityType: 'Customer',
        entityId: c.id,
        entityCode: c.customerCode,
        evidence: [
          `Customer KYC Status: ${c.kycStatus}`,
          `Uploaded Documents: ${c.documents.length}`,
          `Missing Mandatory Categories: ${missingCategories.join(', ')}`,
        ],
        impact: 'Non-compliant document vault presents regulatory and audit compliance risk.',
        recommendedAction: 'Loan Officer should request missing proofs from borrower.',
        suggestedOwner: 'Loan Officer',
      });
    }
  });

  // 3. Scan Active Loans for Bank Verification & First Payment Default (FPD)
  activeLoans.forEach((l) => {
    const primaryBank = l.customer.bankAccounts.find((b) => b.isPrimary) || l.customer.bankAccounts[0];
    if (primaryBank && !primaryBank.isVerified) {
      rawExceptions.push({
        exceptionId: `EXC-BNK-${l.loanNo}`,
        category: 'DISBURSEMENT',
        severity: 'HIGH',
        title: `Unverified Primary Bank Account on Active Loan #${l.loanNo}`,
        summary: `Disbursed loan account destination bank is not officially verified.`,
        workflowStage: 'SERVICING',
        entityType: 'Loan',
        entityId: l.id,
        entityCode: l.loanNo,
        evidence: [
          `Loan Status: ${l.status}`,
          `Bank Name: ${primaryBank.bankName}`,
          `Account Masked: ••••${primaryBank.accountNumber.slice(-4)}`,
          `Verified Flag: false`,
        ],
        impact: 'High risk of auto-debit (eNACH/mandate) failures and reconciliation discrepancies.',
        recommendedAction: 'Finance Officer should trigger Penny Drop verification.',
        suggestedOwner: 'Finance Officer',
      });
    }

    // Check First Payment Default risk (0 EMIs paid)
    const paidCount = l.schedule.filter((s) => s.status === 'PAID').length;
    if (paidCount === 0 && l.schedule.length > 0) {
      rawExceptions.push({
        exceptionId: `EXC-FPD-${l.loanNo}`,
        category: 'SERVICING',
        severity: 'HIGH',
        title: `First Payment Default Risk on Loan #${l.loanNo}`,
        summary: `Active loan has 0 completed installment payments on record.`,
        workflowStage: 'REPAYMENT',
        entityType: 'Loan',
        entityId: l.id,
        entityCode: l.loanNo,
        evidence: [
          `Total Scheduled EMIs: ${l.schedule.length}`,
          `Paid EMIs: 0`,
          `Outstanding Balance: ₹${Number(l.outstandingPrincipal).toLocaleString('en-IN')}`,
        ],
        impact: 'Critical early-stage credit deterioration risk leading directly to NPL migration.',
        recommendedAction: 'Collection Officer should conduct an immediate Right Party Contact call.',
        suggestedOwner: 'Collection Officer',
      });
    }
  });

  // 4. Scan Delinquency & Collection Exceptions
  delinquentCases.forEach((c) => {
    if (c.dpd > 30 && c.activities.length === 0) {
      rawExceptions.push({
        exceptionId: `EXC-COL-${c.caseNo}`,
        category: 'COLLECTIONS',
        severity: 'CRITICAL',
        title: `Delinquency Stagnation (${c.dpd} DPD) with Zero Activity on Case #${c.caseNo}`,
        summary: `Account is ${c.dpd} days past due with ₹${Number(c.overdueAmount).toLocaleString('en-IN')} overdue, yet zero collection outreach calls have been logged.`,
        workflowStage: 'COLLECTION_QUEUE',
        entityType: 'CollectionCase',
        entityId: c.id,
        entityCode: c.caseNo,
        evidence: [
          `Days Past Due: ${c.dpd} Days`,
          `Aging Bucket: ${c.agingBucket}`,
          `Overdue Amount: ₹${Number(c.overdueAmount).toLocaleString('en-IN')}`,
          `Logged Activities: 0`,
        ],
        impact: 'Severe operational delay increases default severity and unrecoverable loan losses.',
        recommendedAction: 'Branch Manager should assign case for immediate field visit or priority calling.',
        suggestedOwner: 'Collection Officer',
      });
    }

    const brokenPtps = c.promises.filter((p) => p.status === 'BROKEN');
    if (brokenPtps.length > 0) {
      rawExceptions.push({
        exceptionId: `EXC-PTP-${c.caseNo}`,
        category: 'COLLECTIONS',
        severity: 'HIGH',
        title: `Broken Promise-To-Pay on Case #${c.caseNo}`,
        summary: `Borrower missed previously committed repayment date without follow-up resolution.`,
        workflowStage: 'PROMISE_TO_PAY',
        entityType: 'CollectionCase',
        entityId: c.id,
        entityCode: c.caseNo,
        evidence: [
          `Broken PTPs: ${brokenPtps.length}`,
          `Last Promised Amount: ₹${Number(brokenPtps[0].promisedAmount).toLocaleString('en-IN')}`,
        ],
        impact: 'Commitment failure requires immediate escalation to legal or senior recovery desk.',
        recommendedAction: 'Collection Officer should demand immediate settlement or escalate to Branch Manager.',
        suggestedOwner: 'Collection Officer',
      });
    }
  });

  const contextPrompt = `
=== DETERMINISTIC WORKFLOW EXCEPTION CANDIDATES (${rawExceptions.length} Detected) ===
Role Scope: ${actor.roles.join(', ')}

${rawExceptions
  .map(
    (e, idx) =>
      `[${idx + 1}] Exception ID: ${e.exceptionId} | Category: ${e.category} | Severity: ${e.severity} | Stage: ${e.workflowStage}
Title: ${e.title}
Entity: ${e.entityType} (#${e.entityCode})
Evidence: ${e.evidence.join('; ')}
Impact: ${e.impact}
Recommended Action: ${e.recommendedAction}
Owner: ${e.suggestedOwner}`
  )
  .join('\n\n')}
`;

  return { rawExceptions, contextPrompt };
}

/**
 * Generates centralized AI Workflow & Exception Center intelligence using Gemini.
 */
export async function generateWorkflowExceptionIntelligence(
  actor: { id: string; email: string; roles: string[]; branchId?: string }
): Promise<WorkflowExceptionCenterResult> {
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
    throw new ForbiddenError('Access forbidden: Insufficient permissions for Workflow Exception Center');
  }

  // 2. Scan deterministic LMS exception candidates
  const { rawExceptions, contextPrompt } = await scanDeterministicExceptions(actor);

  // 3. System Prompt
  const systemInstruction = `
You are the Chief Operational Workflow & Exception Center AI for Adyapan Loan Management System.
You synthesize cross-module operational exceptions, identify workflow bottlenecks, detect cross-module root-cause chains, and prioritize operational actions for lending staff.

=== STRICT OPERATIONAL & SAFETY RULES ===
1. FINANCIAL TRUTH: Never fabricate exceptions, alter loan statuses, or modify backend values.
2. EVIDENCE GROUNDING: Base all priorities and recommendations strictly on the provided deterministic exceptions.
3. CROSS-MODULE CHAINS: Identify how upstream issues (e.g. KYC gap, unverified bank) directly block downstream workflows (e.g. Disbursement, eNACH repayment).
4. ROLE-AWARE ACTIONABILITY: Assign clear, actionable next steps for the suggested owner role.
5. STRICT JSON: Return ONLY a valid JSON object matching the required schema.

=== REQUIRED JSON SCHEMA ===
{
  "summary": "A concise 2-sentence executive summary of operational exceptions and primary workflow blockers across the LMS.",
  "topPriorityExceptions": [
    {
      "priority": 1,
      "title": "Exception title",
      "whyItMatters": "Clear operational and credit risk consequence",
      "recommendedAction": "Concrete immediate action",
      "targetRole": "Suggested role (e.g. 'Collection Officer', 'Finance Officer', 'Underwriter')"
    }
  ],
  "crossModuleChains": [
    {
      "rootCause": "Upstream root cause (e.g. 'Unverified Primary Bank Account')",
      "affectedDownstreamWorkflows": ["Disbursement", "Repayment eNACH Schedule"],
      "explanation": "Why this upstream gap causes downstream workflow stagnation"
    }
  ],
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}
`;

  const criticalCount = rawExceptions.filter((e) => e.severity === 'CRITICAL').length;
  const highCount = rawExceptions.filter((e) => e.severity === 'HIGH').length;
  const mediumCount = rawExceptions.filter((e) => e.severity === 'MEDIUM').length;
  const lowCount = rawExceptions.filter((e) => e.severity === 'LOW' || e.severity === 'INFORMATIONAL').length;

  let result: WorkflowExceptionCenterResult;

  try {
    // 4. Generate content via Central Gemini Service
    const geminiResult = await generateGeminiContent({
      prompt: `Synthesize the Workflow & Exception Center briefing for the following operational exception candidates:\n\n${contextPrompt}`,
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
      summary: parsed.summary || `${rawExceptions.length} operational exceptions identified across the lending lifecycle.`,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      exceptions: rawExceptions,
      topPriorityExceptions: Array.isArray(parsed.topPriorityExceptions) ? parsed.topPriorityExceptions : [],
      crossModuleChains: Array.isArray(parsed.crossModuleChains) ? parsed.crossModuleChains : [],
      confidence: ['HIGH', 'MEDIUM', 'LOW'].includes(parsed.confidence) ? parsed.confidence : 'HIGH',
    };
  } catch {
    // Deterministic Rule-Based Fallback
    const sorted = [...rawExceptions].sort((a, b) => {
      const rank: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFORMATIONAL: 0 };
      return (rank[b.severity] || 0) - (rank[a.severity] || 0);
    });

    const topPriorityExceptions = sorted.slice(0, 5).map((e, idx) => ({
      priority: idx + 1,
      title: e.title,
      whyItMatters: e.impact,
      recommendedAction: e.recommendedAction,
      targetRole: e.suggestedOwner,
    }));

    result = {
      generatedAt: new Date().toISOString(),
      dataAsOf: new Date().toISOString(),
      model: 'deterministic-rules-engine',
      summary: `${rawExceptions.length} operational exception(s) actively tracked across KYC, Underwriting, Servicing, and Collections. (Deterministic LMS synthesis).`,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      exceptions: rawExceptions,
      topPriorityExceptions,
      crossModuleChains: rawExceptions.some((e) => e.category === 'KYC' || e.category === 'DISBURSEMENT')
        ? [
            {
              rootCause: 'Pending KYC or Bank Account Verification',
              affectedDownstreamWorkflows: ['Underwriting Approval', 'Disbursement Authorization', 'eNACH Activation'],
              explanation: 'Unverified KYC or bank accounts prevent loan application forward progression to disbursement.',
            },
          ]
        : [],
      confidence: 'HIGH',
    };
  }

  // 6. Audit Trail
  await logAudit({
    userId: actor.id,
    role: actor.roles[0] || 'BRANCH_MANAGER',
    action: 'EXCEPTION_CENTER_INTELLIGENCE_GENERATED',
    entity: 'WorkflowExceptionCenter',
    entityId: 'SYSTEM_WIDE',
    newValue: {
      totalExceptions: rawExceptions.length,
      criticalCount,
      highCount,
      confidence: result.confidence,
      model: result.model,
      generatedBy: actor.email,
    },
  });

  return result;
}
