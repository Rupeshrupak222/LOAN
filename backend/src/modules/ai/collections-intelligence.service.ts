import { prisma } from '../../config/prisma';
import { generateGeminiContent } from './gemini.service';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';

export interface CollectionIntelligenceResult {
  caseId: string;
  caseNo: string;
  loanNo: string;
  borrowerName: string;
  generatedAt: string;
  model: string;
  collectionPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'REVIEW_REQUIRED';
  priorityReasons: string[];
  accountSummary: string;
  delinquencySignals: {
    signal: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    evidence: string;
    whyItMatters: string;
    suggestedAction: string;
  }[];
  observedTrends: string[];
  paymentBehaviorSummary: string;
  collectionActivitySummary: string;
  ptpSummary: {
    activePtpStatus: string;
    brokenPtpCount: number;
    totalPtpCount: number;
    observations: string;
  };
  exceptions: {
    exception: string;
    impact: string;
    evidence: string;
    recommendedAction: string;
  }[];
  recommendedActions: string[];
  escalationRecommendation: {
    escalate: boolean;
    targetRole?: string;
    rationale?: string;
  };
  dataGaps: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Builds authoritative LMS context specifically tailored for Collections Intelligence.
 */
async function buildCollectionContext(caseId: string) {
  const colCase = await prisma.collectionCase.findUnique({
    where: { id: caseId },
    include: {
      customer: {
        include: {
          employmentDetails: true,
          addresses: true,
        },
      },
      loan: {
        include: {
          product: true,
          schedule: {
            orderBy: { emiNumber: 'asc' },
          },
          transactions: {
            where: { type: 'REPAYMENT' },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      promises: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!colCase) {
    throw new NotFoundError('Collection case record not found');
  }

  const { customer, loan, activities, promises } = colCase;
  const overdueAmount = Number(colCase.overdueAmount);
  const dpd = colCase.dpd;
  const agingBucket = colCase.agingBucket;

  // Repayment metrics
  const totalScheduleItems = loan.schedule.length;
  const overdueScheduleItems = loan.schedule.filter((s) => s.status === 'OVERDUE' || s.status === 'DUE');
  const paidScheduleItems = loan.schedule.filter((s) => s.status === 'PAID');
  const repaymentCompliancePct =
    totalScheduleItems > 0 ? ((paidScheduleItems.length / totalScheduleItems) * 100).toFixed(1) : '100.0';

  // PTP metrics
  const pendingPtp = promises.find((p) => p.status === 'PENDING');
  const brokenPtps = promises.filter((p) => p.status === 'BROKEN');
  const fulfilledPtps = promises.filter((p) => p.status === 'FULFILLED');

  // Contact attempt metrics
  const callActivities = activities.filter((a) => a.activityType === 'CALL');
  const unreachedCalls = callActivities.filter((a) => ['UNREACHABLE', 'WRONG_NUMBER', 'NO_ANSWER'].includes(a.outcome));
  const contactFailureRate =
    callActivities.length > 0 ? ((unreachedCalls.length / callActivities.length) * 100).toFixed(0) : '0';

  const emp = customer.employmentDetails[0];

  const activitiesSummary =
    activities.length > 0
      ? activities
          .map(
            (a) =>
              `- [${new Date(a.createdAt).toLocaleDateString()}] ${a.activityType} -> Outcome: ${a.outcome}. Notes: "${a.notes || 'None'}" (Next Follow-up: ${a.nextFollowUpDate ? new Date(a.nextFollowUpDate).toLocaleDateString() : 'None'})`
          )
          .join('\n')
      : '- Zero previous collection activities recorded.';

  const promisesSummary =
    promises.length > 0
      ? promises
          .map(
            (p) =>
              `- PTP: ₹${Number(p.promisedAmount).toLocaleString('en-IN')} due on ${new Date(p.promisedDate).toLocaleDateString()} (Status: ${p.status}, Mode: ${p.paymentMode || 'UPI'})`
          )
          .join('\n')
      : '- Zero previous Promise-to-Pay commitments recorded.';

  const contextPrompt = `
=== DELINQUENT CASE PROFILE ===
Case Number: ${colCase.caseNo}
Case Status: ${colCase.status}
Assigned System Priority: ${colCase.priority || 'MEDIUM'}
Days Past Due (DPD): ${dpd} Days
Aging Bucket: ${agingBucket}
Total Overdue Amount: ₹${overdueAmount.toLocaleString('en-IN')}
Loan Account Number: ${loan.loanNo}
Loan Principal: ₹${Number(loan.principal).toLocaleString('en-IN')}
Outstanding Principal: ₹${Number(loan.outstandingPrincipal).toLocaleString('en-IN')}
Monthly Installment (EMI): ₹${Number(loan.emiAmount).toLocaleString('en-IN')}
Loan Product: ${loan.product?.name || 'General Loan'} (${loan.product?.code || 'GEN'})

=== BORROWER DEMOGRAPHICS & PROFILE ===
Customer Code: ${customer.customerCode}
Borrower Name: ${customer.firstName} ${customer.lastName}
Contact Mobile: ${customer.mobile || 'N/A'}
City: ${customer.city || 'N/A'}, State: ${customer.state || 'N/A'}
Employment: ${customer.employmentType || 'SALARIED'} at "${emp?.employerName || customer.employerName || 'Not specified'}" (${emp?.designation || 'Staff'})
Declared Monthly Net Income: ₹${Number(customer.monthlyIncome || 0).toLocaleString('en-IN')}
Risk Classification: ${customer.riskCategory || 'MEDIUM'}

=== REPAYMENT WATERFALL & SCHEDULE AUDIT ===
Total Loan Tenor EMIs: ${totalScheduleItems}
Paid EMIs: ${paidScheduleItems.length}
Currently Overdue/Unpaid EMIs: ${overdueScheduleItems.length}
Repayment Compliance Rate: ${repaymentCompliancePct}%

=== PROMISE-TO-PAY (PTP) TRACK RECORD ===
Active Pending PTP: ${pendingPtp ? `₹${Number(pendingPtp.promisedAmount).toLocaleString('en-IN')} due ${new Date(pendingPtp.promisedDate).toLocaleDateString()}` : 'None'}
Total PTPs Recorded: ${promises.length} (Fulfilled: ${fulfilledPtps.length}, Broken: ${brokenPtps.length})
${promisesSummary}

=== COLLECTION ACTIVITY HISTORY & FOLLOW-UPS (${activities.length} Recorded) ===
Total Call Attempts: ${callActivities.length} (Contact Failure Rate: ${contactFailureRate}%)
${activitiesSummary}
`;

  return { colCase, customer, loan, overdueAmount, dpd, agingBucket, pendingPtp, brokenPtps, activities, contextPrompt };
}

/**
 * Generates structured Predictive Collections & Recovery Intelligence using Gemini.
 */
export async function generateCollectionIntelligence(
  caseId: string,
  actor: { id: string; email: string; roles: string[] }
): Promise<CollectionIntelligenceResult> {
  // 1. RBAC Guard - only authorized Collection Officers and Staff roles
  const isAuthorized = actor.roles.some((r) =>
    ['SUPER_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'BRANCH_MANAGER', 'AUDITOR'].includes(r)
  );
  if (!isAuthorized) {
    throw new ForbiddenError(
      'Access forbidden: Only Collection Officers and authorized Managers can access Collections Intelligence'
    );
  }

  // 2. Build verified LMS context
  const { colCase, customer, loan, overdueAmount, dpd, pendingPtp, brokenPtps, contextPrompt } =
    await buildCollectionContext(caseId);

  // 3. System Prompt
  const systemInstruction = `
You are the Chief Collections & Recovery Intelligence AI for Adyapan Loan Management System.
You assist Collection Officers by analyzing delinquent accounts, explaining repayment deterioration signals, auditing Promise-To-Pay commitments, and recommending evidence-based recovery actions.

=== STRICT OPERATIONAL & SAFETY RULES ===
1. FINANCIAL TRUTH & FACT GROUNDING: Treat existing backend values (DPD, Overdue Amount, Outstanding Principal, Schedule status, PTP outcomes) as authoritative truth. Never fabricate payment amounts or change DPD.
2. ADVISORY DECISION-SUPPORT ONLY: You NEVER initiate calls, send messages, create PTPs, waive penalties, or alter loan status autonomously.
3. PRIORITY DETERMINATION:
   - 'CRITICAL': High DPD (60+), multiple broken PTPs, high overdue amount, or severe contact failure.
   - 'HIGH': DPD 30-60, broken PTP, or consecutive missed payments.
   - 'MEDIUM': DPD 1-30 with active engagement or pending PTP.
   - 'LOW': Minor overdue with strong past repayment compliance.
4. EXPLAINABILITY: Clearly separate FACT (actual LMS data), INTERPRETATION (behavioral risk pattern), and RECOMMENDATION (next action for officer).
5. STRICT JSON: Return ONLY a valid JSON object matching the required schema.

=== REQUIRED JSON SCHEMA ===
{
  "collectionPriority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "REVIEW_REQUIRED",
  "priorityReasons": [
    "List of exact evidence points explaining why this priority was assigned (e.g. 'DPD is 47 days', '2 broken PTPs on record')"
  ],
  "accountSummary": "A concise 2-sentence briefing on the borrower's delinquency status, overdue amount, and recent contact responsiveness.",
  "delinquencySignals": [
    {
      "signal": "Specific warning signal title",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "evidence": "Authoritative LMS data point",
      "whyItMatters": "Credit and recovery risk impact",
      "suggestedAction": "Specific follow-up step for officer"
    }
  ],
  "observedTrends": [
    "List of observed behavioral trends (e.g. 'Payment compliance dropped from 80% to 50%', 'Unreachable during morning call attempts')"
  ],
  "paymentBehaviorSummary": "Analysis of historical installment payment consistency versus recent missed cycles.",
  "collectionActivitySummary": "Synthesis of recent collection calls, notes, and borrower responsiveness.",
  "ptpSummary": {
    "activePtpStatus": "Status of any current active PTP or 'NO_ACTIVE_PTP'",
    "brokenPtpCount": number,
    "totalPtpCount": number,
    "observations": "Assessment of borrower commitment reliability"
  },
  "exceptions": [
    {
      "exception": "Specific collection exception (e.g. 'High DPD with zero activity in last 14 days')",
      "impact": "Why this represents an operational gap",
      "evidence": "LMS activity timestamps",
      "recommendedAction": "Immediate corrective operational action"
    }
  ],
  "recommendedActions": [
    "Numbered operational next-best actions for the Collection Officer"
  ],
  "escalationRecommendation": {
    "escalate": boolean,
    "targetRole": "Role to escalate to (e.g. 'Branch Manager', 'Legal Recovery Officer', 'Underwriter')",
    "rationale": "Why escalation or restructuring/OTS consideration is appropriate"
  },
  "dataGaps": [
    "Missing information (e.g. 'No updated employer contact number')"
  ],
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}
`;

  // 4. Generate content via Central Gemini Service
  const geminiResult = await generateGeminiContent({
    prompt: `Analyze the following delinquent loan collection case and generate the structured Collections Intelligence JSON assessment:\n\n${contextPrompt}`,
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
    throw new BadRequestError(`Failed to parse AI Collections Intelligence response: ${err.message}`);
  }

  const result: CollectionIntelligenceResult = {
    caseId: colCase.id,
    caseNo: colCase.caseNo,
    loanNo: loan.loanNo,
    borrowerName: `${customer.firstName} ${customer.lastName}`,
    generatedAt: new Date().toISOString(),
    model: geminiResult.model,
    collectionPriority: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'REVIEW_REQUIRED'].includes(parsed.collectionPriority)
      ? parsed.collectionPriority
      : dpd > 60 || brokenPtps.length > 1
      ? 'CRITICAL'
      : dpd > 30
      ? 'HIGH'
      : 'MEDIUM',
    priorityReasons: Array.isArray(parsed.priorityReasons) ? parsed.priorityReasons : [`DPD is ${dpd} days with ₹${overdueAmount} overdue.`],
    accountSummary: parsed.accountSummary || `Account #${loan.loanNo} is ${dpd} days overdue for ₹${overdueAmount.toLocaleString('en-IN')}.`,
    delinquencySignals: Array.isArray(parsed.delinquencySignals) ? parsed.delinquencySignals : [],
    observedTrends: Array.isArray(parsed.observedTrends) ? parsed.observedTrends : [],
    paymentBehaviorSummary: parsed.paymentBehaviorSummary || 'Payment behavior assessed from repayment schedule.',
    collectionActivitySummary: parsed.collectionActivitySummary || 'Collection activity evaluated from call logs.',
    ptpSummary: {
      activePtpStatus: parsed.ptpSummary?.activePtpStatus || (pendingPtp ? 'ACTIVE_PENDING' : 'NO_ACTIVE_PTP'),
      brokenPtpCount: typeof parsed.ptpSummary?.brokenPtpCount === 'number' ? parsed.ptpSummary.brokenPtpCount : brokenPtps.length,
      totalPtpCount: typeof parsed.ptpSummary?.totalPtpCount === 'number' ? parsed.ptpSummary.totalPtpCount : colCase.promises.length,
      observations: parsed.ptpSummary?.observations || 'Commitment history assessed from PTP records.',
    },
    exceptions: Array.isArray(parsed.exceptions) ? parsed.exceptions : [],
    recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : ['Initiate follow-up call with borrower.'],
    escalationRecommendation: {
      escalate: Boolean(parsed.escalationRecommendation?.escalate),
      targetRole: parsed.escalationRecommendation?.targetRole || 'Branch Manager',
      rationale: parsed.escalationRecommendation?.rationale || 'Standard case management.',
    },
    dataGaps: Array.isArray(parsed.dataGaps) ? parsed.dataGaps : [],
    confidence: ['HIGH', 'MEDIUM', 'LOW'].includes(parsed.confidence) ? parsed.confidence : 'HIGH',
  };

  // 6. Audit Trail
  await logAudit({
    userId: actor.id,
    action: 'COLLECTIONS_INTELLIGENCE_GENERATED',
    entity: 'CollectionCase',
    entityId: colCase.id,
    newValue: {
      caseNo: colCase.caseNo,
      dpd: colCase.dpd,
      recommendedPriority: result.collectionPriority,
      model: result.model,
      generatedBy: actor.email,
    },
  });

  return result;
}
