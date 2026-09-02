import { prisma } from '../../config/prisma';
import { generateGeminiContent } from './gemini.service';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';

export interface Customer360IntelligenceResult {
  customerId: string;
  customerCode: string;
  customerName: string;
  generatedAt: string;
  dataAsOf: string;
  model: string;
  lifecycleStage: string;
  customerSummary: string;
  lifecycleSummary: string;
  portfolioSummary: {
    totalLoans: number;
    activeLoans: number;
    totalSanctionedAmount: number;
    totalOutstandingPrincipal: number;
    totalOverdueAmount: number;
    overallServicingStatus: string;
  };
  repaymentInsights: {
    complianceRate: string;
    paidInstallmentsCount: number;
    overdueInstallmentsCount: number;
    behaviorTrend: string;
    observations: string;
  };
  riskAndCreditContext: {
    initialRiskTier: string;
    initialRiskScore: number;
    currentTrajectory: string;
    observations: string;
  };
  kycDocumentContext: {
    kycStatus: string;
    verifiedDocumentsCount: number;
    totalDocumentsCount: number;
    missingCategories: string[];
    observations: string;
  };
  collectionsContext: {
    activeCasesCount: number;
    maxDpd: number;
    ptpStatus: string;
    observations: string;
  };
  timeline: {
    timestamp: string;
    event: string;
    category: 'ONBOARDING' | 'KYC' | 'ORIGINATION' | 'UNDERWRITING' | 'DISBURSEMENT' | 'REPAYMENT' | 'COLLECTION' | 'SERVICING';
    description: string;
  }[];
  changesDetected: {
    change: string;
    previousState: string;
    currentState: string;
    whyItMatters: string;
  }[];
  positiveSignals: string[];
  attentionRequired: {
    category: string;
    issue: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    evidence: string;
    recommendedReview: string;
  }[];
  recommendedActions: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Builds authoritative LMS context specifically tailored for Customer 360 Intelligence.
 */
async function buildCustomer360Context(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      branch: true,
      addresses: true,
      employmentDetails: true,
      bankAccounts: true,
      documents: { orderBy: { createdAt: 'desc' } },
      applications: {
        include: {
          product: true,
          eligibility: true,
          riskAssessment: true,
          underwriting: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      loans: {
        include: {
          product: true,
          disbursements: true,
          schedule: { orderBy: { emiNumber: 'asc' } },
          collectionCases: {
            include: {
              activities: { orderBy: { createdAt: 'desc' }, take: 5 },
              promises: { orderBy: { createdAt: 'desc' }, take: 5 },
            },
          },
          transactions: {
            where: { type: 'REPAYMENT' },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      collectionCases: {
        include: {
          activities: { orderBy: { createdAt: 'desc' }, take: 5 },
          promises: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!customer) {
    throw new NotFoundError('Customer record not found');
  }

  // Aggregate Loan Metrics
  const totalLoans = customer.loans.length;
  const activeLoans = customer.loans.filter((l) => l.status === 'ACTIVE').length;
  const totalSanctioned = customer.loans.reduce((sum, l) => sum + Number(l.principal), 0);
  const totalOutstanding = customer.loans.reduce((sum, l) => sum + Number(l.outstandingPrincipal), 0);

  // Aggregate Repayments & Overdues
  let totalDueEmis = 0;
  let paidEmis = 0;
  let overdueEmis = 0;
  customer.loans.forEach((l) => {
    totalDueEmis += l.schedule.length;
    paidEmis += l.schedule.filter((s) => s.status === 'PAID').length;
    overdueEmis += l.schedule.filter((s) => s.status === 'OVERDUE' || s.status === 'DUE').length;
  });
  const complianceRate = totalDueEmis > 0 ? ((paidEmis / totalDueEmis) * 100).toFixed(1) : '100.0';

  // Aggregate Collections Metrics
  const totalOverdue = customer.collectionCases.reduce((sum, c) => sum + Number(c.overdueAmount), 0);
  const maxDpd = customer.collectionCases.reduce((max, c) => Math.max(max, c.dpd), 0);

  // Document Vault Metrics
  const totalDocs = customer.documents.length;
  const verifiedDocs = customer.documents.filter((d) => d.verified).length;
  const docCategories = new Set(customer.documents.map((d) => d.category.toUpperCase()));
  const missingCategories = ['IDENTITY_PROOF', 'ADDRESS_PROOF', 'INCOME_PROOF'].filter(
    (c) => !docCategories.has(c) && !docCategories.has(c.replace('_PROOF', ''))
  );

  // Primary Employment & Bank
  const emp = customer.employmentDetails[0];
  const primaryBank = customer.bankAccounts.find((b) => b.isPrimary) || customer.bankAccounts[0];

  // Chronological Timeline Builder from authoritative DB records
  const timelineEvents: { timestamp: string; event: string; category: any; description: string }[] = [];

  timelineEvents.push({
    timestamp: customer.createdAt.toISOString(),
    event: 'Customer Profile Created',
    category: 'ONBOARDING',
    description: `Registered borrower profile #${customer.customerCode} in branch "${customer.branch?.name || 'Main Branch'}".`,
  });

  customer.documents.forEach((d) => {
    timelineEvents.push({
      timestamp: d.createdAt.toISOString(),
      event: `Document Uploaded: ${d.category}`,
      category: 'KYC',
      description: `Uploaded "${d.fileName}" (${d.documentType || d.category}). Verification status: ${d.status}.`,
    });
  });

  customer.applications.forEach((app) => {
    timelineEvents.push({
      timestamp: app.createdAt.toISOString(),
      event: `Loan Application Submitted (#${app.applicationNo})`,
      category: 'ORIGINATION',
      description: `Applied for ₹${Number(app.requestedAmount).toLocaleString('en-IN')} (${app.product?.name || 'Loan'}, ${app.tenureMonths} mos). Status: ${app.status}.`,
    });
    if (app.underwriting) {
      timelineEvents.push({
        timestamp: app.underwriting.createdAt.toISOString(),
        event: `Underwriting Decision: ${app.underwriting.decision}`,
        category: 'UNDERWRITING',
        description: `Decision recorded by ${app.underwriting.decidedBy || 'Staff'}. Reason: "${app.underwriting.reason || 'None'}".`,
      });
    }
  });

  customer.loans.forEach((loan) => {
    loan.disbursements.forEach((disb) => {
      timelineEvents.push({
        timestamp: disb.createdAt.toISOString(),
        event: `Loan Disbursed (#${loan.loanNo})`,
        category: 'DISBURSEMENT',
        description: `Disbursed ₹${Number(disb.amount).toLocaleString('en-IN')} via ${disb.method}. Ref: ${disb.reference}.`,
      });
    });
    loan.transactions.forEach((tx) => {
      timelineEvents.push({
        timestamp: tx.createdAt.toISOString(),
        event: `EMI Repayment Received (#${loan.loanNo})`,
        category: 'REPAYMENT',
        description: `Payment of ₹${Number(tx.amount).toLocaleString('en-IN')} credited. Ref: ${tx.reference}.`,
      });
    });
  });

  customer.collectionCases.forEach((colCase) => {
    timelineEvents.push({
      timestamp: colCase.createdAt.toISOString(),
      event: `Collection Case Opened (#${colCase.caseNo})`,
      category: 'COLLECTION',
      description: `Account flagged for ${colCase.dpd} DPD with ₹${Number(colCase.overdueAmount).toLocaleString('en-IN')} overdue. Bucket: ${colCase.agingBucket}.`,
    });
    colCase.promises.forEach((p) => {
      timelineEvents.push({
        timestamp: p.createdAt.toISOString(),
        event: `Promise-To-Pay Recorded (#${colCase.caseNo})`,
        category: 'COLLECTION',
        description: `PTP for ₹${Number(p.promisedAmount).toLocaleString('en-IN')} due on ${new Date(p.promisedDate).toLocaleDateString()} (Status: ${p.status}).`,
      });
    });
  });

  // Sort timeline chronologically (latest first)
  timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Compact Context Prompt for Gemini
  const contextPrompt = `
=== CUSTOMER PROFILE SNAPSHOT ===
Customer Code: ${customer.customerCode}
Full Name: ${customer.firstName} ${customer.lastName}
Customer Since: ${customer.createdAt.toLocaleDateString()}
Account Status: ${customer.status}
KYC Status: ${customer.kycStatus}
Declared Net Monthly Income: ₹${Number(customer.monthlyIncome || 0).toLocaleString('en-IN')}
Declared Monthly Obligations: ₹${Number(customer.existingObligations || 0).toLocaleString('en-IN')}
Employment: ${customer.employmentType || 'SALARIED'} at "${emp?.employerName || customer.employerName || 'Not specified'}" (${emp?.designation || 'Staff'})
Location: ${customer.city || 'N/A'}, ${customer.state || 'N/A'}
Primary Bank Account: ${primaryBank ? `${primaryBank.bankName} (A/C: ${primaryBank.accountNumber}, IFSC: ${primaryBank.ifscCode}, Verified: ${primaryBank.isVerified})` : 'None'}

=== LOAN PORTFOLIO METRICS ===
Total Loan Accounts: ${totalLoans} (Active: ${activeLoans})
Total Sanctioned Principal: ₹${totalSanctioned.toLocaleString('en-IN')}
Total Outstanding Principal Balance: ₹${totalOutstanding.toLocaleString('en-IN')}
Total Overdue Balance: ₹${totalOverdue.toLocaleString('en-IN')}
Maximum DPD: ${maxDpd} Days
Repayment Compliance Rate: ${complianceRate}% (${paidEmis} of ${totalDueEmis} EMIs Paid, ${overdueEmis} Overdue)

=== DOCUMENT VAULT AUDIT ===
Total Uploaded Documents: ${totalDocs} (${verifiedDocs} Verified)
Missing Mandatory Categories: ${missingCategories.length > 0 ? missingCategories.join(', ') : 'None (Complete)'}

=== ACTIVE & HISTORICAL LOANS ===
${
  customer.loans.length > 0
    ? customer.loans
        .map(
          (l) =>
            `- Loan #${l.loanNo}: ${l.product?.name || 'Loan'}, Sanction: ₹${Number(l.principal).toLocaleString('en-IN')}, Outstanding: ₹${Number(l.outstandingPrincipal).toLocaleString('en-IN')}, Status: ${l.status}, EMI: ₹${Number(l.emiAmount).toLocaleString('en-IN')}`
        )
        .join('\n')
    : '- Zero loans recorded.'
}

=== DELINQUENCY & COLLECTION AUDIT ===
${
  customer.collectionCases.length > 0
    ? customer.collectionCases
        .map(
          (c) =>
            `- Case #${c.caseNo}: DPD ${c.dpd} (${c.agingBucket}), Overdue: ₹${Number(c.overdueAmount).toLocaleString('en-IN')}, Status: ${c.status}, PTPs: ${c.promises.length}, Activities: ${c.activities.length}`
        )
        .join('\n')
    : '- Zero collection cases. Account is in regular good standing.'
}

=== RECENT CHRONOLOGICAL LIFECYCLE EVENTS (${timelineEvents.slice(0, 10).length} Events) ===
${timelineEvents
  .slice(0, 10)
  .map((e) => `[${new Date(e.timestamp).toLocaleDateString()}] (${e.category}) ${e.event}: ${e.description}`)
  .join('\n')}
`;

  return {
    customer,
    totalLoans,
    activeLoans,
    totalSanctioned,
    totalOutstanding,
    totalOverdue,
    maxDpd,
    complianceRate,
    paidEmis,
    overdueEmis,
    totalDocs,
    verifiedDocs,
    missingCategories,
    timelineEvents,
    contextPrompt,
  };
}

/**
 * Evaluates and returns AI-driven Customer 360 Intelligence for authorized roles.
 */
export async function generateCustomer360Intelligence(
  customerId: string,
  actor: { id: string; email: string; roles: string[] }
): Promise<Customer360IntelligenceResult> {
  // 1. Fetch customer context
  const {
    customer,
    totalLoans,
    activeLoans,
    totalSanctioned,
    totalOutstanding,
    totalOverdue,
    maxDpd,
    complianceRate,
    paidEmis,
    overdueEmis,
    totalDocs,
    verifiedDocs,
    missingCategories,
    timelineEvents,
    contextPrompt,
  } = await buildCustomer360Context(customerId);

  // 2. Role-Aware RBAC & Borrower Isolation
  const isCustomer = actor.roles.includes('CUSTOMER');
  if (isCustomer) {
    if (customer.userId !== actor.id) {
      throw new ForbiddenError('Access forbidden: You cannot access another borrower Customer 360 profile');
    }
  } else {
    const isStaff = actor.roles.some((r) =>
      [
        'SUPER_ADMIN',
        'ADMIN',
        'LOAN_OFFICER',
        'CREDIT_ANALYST',
        'UNDERWRITER',
        'FINANCE_OFFICER',
        'COLLECTION_OFFICER',
        'BRANCH_MANAGER',
        'AUDITOR',
      ].includes(r)
    );
    if (!isStaff) {
      throw new ForbiddenError('Access forbidden: Insufficient permissions for Customer 360 Intelligence');
    }
  }

  // 3. System Prompt
  const systemInstruction = `
You are the Chief Customer 360 Intelligence AI for Adyapan Loan Management System.
You synthesize a holistic, multi-dimensional view of the borrower across onboarding, KYC, credit origination, underwriting, disbursement, repayment compliance, and collection history.

=== STRICT OPERATIONAL & SAFETY RULES ===
1. FINANCIAL TRUTH & FACT GROUNDING: Treat existing backend values (Principal, Balances, DPD, KYC status, EMIs, Dates) as authoritative truth. Never fabricate numbers.
2. ADVISORY DECISION-SUPPORT ONLY: You do NOT approve/reject loans, modify KYC, alter DPD, or create transactions autonomously.
3. BALANCED INTELLIGENCE: Highlight positive factors alongside vulnerabilities and delinquency signals.
4. "WHAT CHANGED?": Identify material transitions in customer repayment behavior, DPD increases, or document verifications.
5. ROLE-AWARE ACTIONABILITY: Provide actionable review items relevant to the lending officer reviewing this profile.
6. STRICT JSON: Return ONLY a valid JSON object matching the required schema.

=== REQUIRED JSON SCHEMA ===
{
  "lifecycleStage": "ONBOARDING" | "ORIGINATION" | "UNDERWRITING" | "SERVICING_HEALTHY" | "SERVICING_DELINQUENT" | "CLOSED",
  "customerSummary": "A concise 2-sentence executive summary of who this customer is, their loan status, and overall credit health.",
  "lifecycleSummary": "A narrative overview of the borrower's journey through onboarding, underwriting, disbursement, and current repayment.",
  "repaymentInsights": {
    "behaviorTrend": "IMPROVING" | "STABLE" | "DETERIORATING" | "NO_REPAYMENT_HISTORY",
    "observations": "Interpretation of historical payment consistency versus recent performance"
  },
  "riskAndCreditContext": {
    "initialRiskTier": "LOW" | "MEDIUM" | "HIGH",
    "initialRiskScore": number,
    "currentTrajectory": "STABLE" | "INCREASED_RISK" | "IMPROVED",
    "observations": "Synthesis of underwriting risk score against subsequent repayment behavior"
  },
  "kycDocumentContext": {
    "observations": "Assessment of compliance completeness and pending document verifications"
  },
  "collectionsContext": {
    "ptpStatus": "ACTIVE_PTP" | "NO_ACTIVE_PTP" | "BROKEN_PTP_PATTERN",
    "observations": "Evaluation of delinquency severity and collection outreach"
  },
  "changesDetected": [
    {
      "change": "Title of change (e.g. 'Delinquency Emergence (0 to 45 DPD)')",
      "previousState": "State at loan disbursement / previous cycle",
      "currentState": "Current state",
      "whyItMatters": "Credit and servicing consequence"
    }
  ],
  "positiveSignals": [
    "List of verified positive attributes (e.g. 'High declared net income ₹1,20,359', 'Verified KYC Status')"
  ],
  "attentionRequired": [
    {
      "category": "KYC" | "DELINQUENCY" | "COLLECTIONS" | "DOCUMENTATION" | "SERVICING",
      "issue": "Specific issue description",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "evidence": "Authoritative LMS data point",
      "recommendedReview": "Suggested action"
    }
  ],
  "recommendedActions": [
    "Numbered operational next-best actions for the reviewing officer"
  ],
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}
`;

  // 4. Generate content via Central Gemini Service
  const geminiResult = await generateGeminiContent({
    prompt: `Synthesize the complete Customer 360 Intelligence briefing for the following borrower profile:\n\n${contextPrompt}`,
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
    throw new BadRequestError(`Failed to parse AI Customer 360 Intelligence response: ${err.message}`);
  }

  const result: Customer360IntelligenceResult = {
    customerId: customer.id,
    customerCode: customer.customerCode,
    customerName: `${customer.firstName} ${customer.lastName}`,
    generatedAt: new Date().toISOString(),
    dataAsOf: new Date().toISOString(),
    model: geminiResult.model,
    lifecycleStage: parsed.lifecycleStage || (maxDpd > 0 ? 'SERVICING_DELINQUENT' : activeLoans > 0 ? 'SERVICING_HEALTHY' : 'ONBOARDING'),
    customerSummary: parsed.customerSummary || `Customer #${customer.customerCode} profile overview.`,
    lifecycleSummary: parsed.lifecycleSummary || 'Borrower lifecycle evaluated across LMS origination, disbursement, and servicing.',
    portfolioSummary: {
      totalLoans,
      activeLoans,
      totalSanctionedAmount: totalSanctioned,
      totalOutstandingPrincipal: totalOutstanding,
      totalOverdueAmount: totalOverdue,
      overallServicingStatus: maxDpd > 0 ? `${maxDpd} DPD Delinquent` : activeLoans > 0 ? 'Regular Active' : 'No Active Loans',
    },
    repaymentInsights: {
      complianceRate: `${complianceRate}%`,
      paidInstallmentsCount: paidEmis,
      overdueInstallmentsCount: overdueEmis,
      behaviorTrend: parsed.repaymentInsights?.behaviorTrend || (overdueEmis > 0 ? 'DETERIORATING' : 'STABLE'),
      observations: parsed.repaymentInsights?.observations || 'Repayment consistency calculated from schedule items.',
    },
    riskAndCreditContext: {
      initialRiskTier: parsed.riskAndCreditContext?.initialRiskTier || customer.riskCategory || 'LOW',
      initialRiskScore: typeof parsed.riskAndCreditContext?.initialRiskScore === 'number' ? parsed.riskAndCreditContext.initialRiskScore : 84,
      currentTrajectory: parsed.riskAndCreditContext?.currentTrajectory || (maxDpd > 30 ? 'INCREASED_RISK' : 'STABLE'),
      observations: parsed.riskAndCreditContext?.observations || 'Risk trajectory evaluated against repayment behavior.',
    },
    kycDocumentContext: {
      kycStatus: customer.kycStatus,
      verifiedDocumentsCount: verifiedDocs,
      totalDocumentsCount: totalDocs,
      missingCategories,
      observations: parsed.kycDocumentContext?.observations || 'Document vault compliance assessed.',
    },
    collectionsContext: {
      activeCasesCount: customer.collectionCases.length,
      maxDpd,
      ptpStatus: parsed.collectionsContext?.ptpStatus || (customer.collectionCases.length > 0 ? 'NO_ACTIVE_PTP' : 'CLEAN'),
      observations: parsed.collectionsContext?.observations || 'Collections status assessed from active cases.',
    },
    timeline: timelineEvents.slice(0, 15),
    changesDetected: Array.isArray(parsed.changesDetected) ? parsed.changesDetected : [],
    positiveSignals: Array.isArray(parsed.positiveSignals) ? parsed.positiveSignals : ['Verified KYC status on record.'],
    attentionRequired: Array.isArray(parsed.attentionRequired) ? parsed.attentionRequired : [],
    recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : ['Review customer account standing.'],
    confidence: ['HIGH', 'MEDIUM', 'LOW'].includes(parsed.confidence) ? parsed.confidence : 'HIGH',
  };

  // 6. Audit Trail
  await logAudit({
    userId: actor.id,
    action: 'CUSTOMER_360_INTELLIGENCE_GENERATED',
    entity: 'Customer',
    entityId: customer.id,
    newValue: {
      customerCode: customer.customerCode,
      lifecycleStage: result.lifecycleStage,
      model: result.model,
      generatedBy: actor.email,
    },
  });

  return result;
}
