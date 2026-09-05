import { prisma } from '../../config/prisma';
import { generateGeminiContent } from './gemini.service';

export type RoleName =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'LOAN_OFFICER'
  | 'CREDIT_ANALYST'
  | 'UNDERWRITER'
  | 'FINANCE_OFFICER'
  | 'COLLECTION_OFFICER'
  | 'BRANCH_MANAGER'
  | 'AUDITOR'
  | 'CUSTOMER';

export interface CopilotMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CopilotChatOptions {
  userId: string;
  userEmail: string;
  roles: string[];
  message: string;
  history?: CopilotMessage[];
  currentPath?: string;
}

export interface CopilotChatResponse {
  answer: string;
  model: string;
  contextSummary?: string;
}

/**
 * Builds authorized, compact LMS context for the LLM based on user question and role.
 */
async function buildAuthorizedContext(
  user: { id: string; email: string; roles: string[] },
  query: string,
  _currentPath?: string
): Promise<{ contextText: string; summary: string }> {
  const isCustomer = user.roles.includes('CUSTOMER');
  const isSuperAdmin = user.roles.includes('SUPER_ADMIN') || user.roles.includes('ADMIN');
  const primaryRole = (user.roles[0] || 'CUSTOMER') as RoleName;

  const lowerQuery = query.toLowerCase();

  // 1. Identify specific entity references in the prompt (e.g. LN-1234, CUST-1234, APP-1234)
  const loanNoMatch = query.match(/LN-?[0-9]+/i);
  const custCodeMatch = query.match(/CUST-?[0-9]+/i);
  const appNoMatch = query.match(/APP-?[0-9]+/i);

  const contextBlocks: string[] = [];
  let summary = '';

  // --- Specific Loan Lookup ---
  if (loanNoMatch) {
    const searchNo = loanNoMatch[0].toUpperCase();
    const loanWhere: any = {
      OR: [
        { loanNo: { contains: searchNo, mode: 'insensitive' } },
        { loanNo: searchNo },
      ],
    };
    if (isCustomer) {
      loanWhere.customer = { userId: user.id };
    }

    const loan = await prisma.loan.findFirst({
      where: loanWhere,
      include: {
        customer: true,
        product: true,
        schedule: {
          where: { status: { not: 'PAID' } },
          orderBy: { emiNumber: 'asc' },
          take: 3,
        },
        collectionCases: { take: 1 },
        disbursements: { take: 1, orderBy: { createdAt: 'desc' } },
        application: {
          include: {
            eligibility: true,
            riskAssessment: true,
            underwriting: true,
          },
        },
      },
    });

    if (loan) {
      const unpaidEmi = loan.schedule[0];
      const riskPillars = loan.application?.riskAssessment?.factors as any[];
      const riskText = Array.isArray(riskPillars)
        ? riskPillars.map((p) => `${p.name}: ${p.score}/100 (${p.remarks || ''})`).join('; ')
        : 'N/A';

      contextBlocks.push(`
=== SPECIFIC LOAN RECORD (#${loan.loanNo}) ===
- Borrower Name: ${loan.customer.firstName} ${loan.customer.lastName} (Customer Code: ${loan.customer.customerCode})
- Product: ${loan.product.name} (Interest Rate: ${loan.interestRate}% p.a.)
- Principal Amount: ₹${Number(loan.principal).toLocaleString('en-IN')}
- Outstanding Principal: ₹${Number(loan.outstandingPrincipal).toLocaleString('en-IN')}
- Monthly EMI: ₹${Number(loan.emiAmount).toLocaleString('en-IN')}
- Status: ${loan.status}
- Next Due Date: ${loan.nextDueDate ? new Date(loan.nextDueDate).toLocaleDateString() : 'None (Closed/Paid)'}
- Next Installment Total Due: ${unpaidEmi ? `₹${Number(unpaidEmi.totalDue).toLocaleString('en-IN')} (EMI #${unpaidEmi.emiNumber})` : 'Fully Paid'}
- Risk Category: ${loan.customer.riskCategory || 'LOW'} (Risk Score: ${loan.application?.riskAssessment?.score || 'N/A'}/100)
- Risk Pillar Breakdown: ${riskText}
- Underwriting Decision: ${loan.application?.underwriting?.decision || 'APPROVED'} (Reason: ${loan.application?.underwriting?.reason || 'Standard'})
- Delinquency Case: ${loan.collectionCases.length > 0 ? `DPD: ${loan.collectionCases[0].dpd} days, Overdue: ₹${loan.collectionCases[0].overdueAmount}, Bucket: ${loan.collectionCases[0].agingBucket}` : 'Zero overdue cases'}
      `);
      summary = `Retrieved details for Loan #${loan.loanNo}`;
    }
  }

  // --- Specific Application Lookup ---
  if (appNoMatch) {
    const searchApp = appNoMatch[0].toUpperCase();
    const appWhere: any = {
      OR: [
        { applicationNo: { contains: searchApp, mode: 'insensitive' } },
        { applicationNo: searchApp },
      ],
    };
    if (isCustomer) {
      appWhere.customer = { userId: user.id };
    }

    const app = await prisma.loanApplication.findFirst({
      where: appWhere,
      include: {
        customer: true,
        product: true,
        eligibility: true,
        riskAssessment: true,
        underwriting: true,
      },
    });

    if (app) {
      contextBlocks.push(`
=== SPECIFIC LOAN APPLICATION (#${app.applicationNo}) ===
- Applicant: ${app.customer.firstName} ${app.customer.lastName} (${app.customer.customerCode})
- Product: ${app.product.name}
- Requested Amount: ₹${Number(app.requestedAmount).toLocaleString('en-IN')}
- Tenure: ${app.tenureMonths} months
- Status: ${app.status}
- Monthly Income: ₹${Number(app.customer.monthlyIncome || 0).toLocaleString('en-IN')}
- KYC Status: ${app.customer.kycStatus}
- Eligibility Result: ${app.eligibility?.result || 'PENDING'}
- Risk Score: ${app.riskAssessment ? `${app.riskAssessment.score}/100 (${app.riskAssessment.category})` : 'PENDING'}
- Underwriting Decision: ${app.underwriting?.decision || 'PENDING'} (Remarks: ${app.underwriting?.reason || 'None'})
      `);
      summary = `Retrieved application #${app.applicationNo}`;
    }
  }

  // --- Specific Customer Lookup ---
  if (custCodeMatch) {
    const searchCust = custCodeMatch[0].toUpperCase();
    const custWhere: any = {
      customerCode: { contains: searchCust, mode: 'insensitive' },
    };
    if (isCustomer) {
      custWhere.userId = user.id;
    }

    const customer = await prisma.customer.findFirst({
      where: custWhere,
      include: {
        loans: true,
        applications: true,
      },
    });

    if (customer) {
      contextBlocks.push(`
=== CUSTOMER PROFILE (#${customer.customerCode}) ===
- Name: ${customer.firstName} ${customer.lastName}
- Mobile: ${customer.mobile}
- City: ${customer.city || 'N/A'}, State: ${customer.state || 'N/A'}
- KYC Status: ${customer.kycStatus}
- Risk Category: ${customer.riskCategory || 'LOW'}
- Monthly Income: ₹${Number(customer.monthlyIncome || 0).toLocaleString('en-IN')}
- Existing Obligations: ₹${Number(customer.existingObligations || 0).toLocaleString('en-IN')}
- Total Loans: ${customer.loans.length} (${customer.loans.filter((l) => l.status === 'ACTIVE').length} Active)
- Applications Count: ${customer.applications.length}
      `);
      summary = `Retrieved customer #${customer.customerCode}`;
    }
  }

  // --- Role-Based Action Items & Queue Intelligence ---
  if (isCustomer) {
    // Borrower sees ONLY their own active loan & payment status
    const customerRecord = await prisma.customer.findUnique({
      where: { userId: user.id },
      include: {
        loans: {
          include: {
            product: true,
            schedule: { where: { status: { not: 'PAID' } }, orderBy: { emiNumber: 'asc' }, take: 1 },
          },
        },
        paymentSubmissions: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    });

    if (customerRecord) {
      const activeLoan = customerRecord.loans.find((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE');
      contextBlocks.push(`
=== BORROWER ACCOUNT OVERVIEW ===
- Customer: ${customerRecord.firstName} ${customerRecord.lastName} (${customerRecord.customerCode})
- KYC Status: ${customerRecord.kycStatus}
${
  activeLoan
    ? `- Active Loan Account: #${activeLoan.loanNo} (${activeLoan.product.name})
- Sanction Principal: ₹${Number(activeLoan.principal).toLocaleString('en-IN')}
- Outstanding Principal Balance: ₹${Number(activeLoan.outstandingPrincipal).toLocaleString('en-IN')}
- Monthly EMI: ₹${Number(activeLoan.emiAmount).toLocaleString('en-IN')}
- Next Due Date: ${activeLoan.nextDueDate ? new Date(activeLoan.nextDueDate).toLocaleDateString() : 'N/A'}
- Loan Status: ${activeLoan.status}`
    : '- Active Loans: None'
}
- Recent Payment Submissions: ${
        customerRecord.paymentSubmissions.length > 0
          ? customerRecord.paymentSubmissions
              .map(
                (p) =>
                  `#${p.submissionNo} (₹${p.amount} via ${p.method}, Ref: ${p.reference}, Status: ${p.status})`
              )
              .join('; ')
          : 'None'
      }
      `);
    }
  } else {
    // Staff roles: Query role-relevant queues and summaries
    const needsAttention =
      lowerQuery.includes('attention') ||
      lowerQuery.includes('pending') ||
      lowerQuery.includes('action') ||
      lowerQuery.includes('today') ||
      lowerQuery.includes('queue') ||
      lowerQuery.includes('overdue') ||
      lowerQuery.includes('risky') ||
      lowerQuery.includes('summary');

    if (needsAttention || isSuperAdmin) {
      // 1. Delinquent / Overdue Loans
      const overdueLoans = await prisma.loan.findMany({
        where: { status: 'OVERDUE' },
        include: { customer: true, product: true, collectionCases: true },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      });

      // 2. Ready for Payout Queue (for Finance / Super Admin)
      const readyForDisbursement = await prisma.loanApplication.findMany({
        where: { status: { in: ['APPROVED', 'READY_FOR_DISBURSEMENT'] } },
        include: { customer: true, product: true },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      });

      // 3. Pending Underwriting Queue
      const pendingUnderwriting = await prisma.loanApplication.findMany({
        where: { status: 'UNDERWRITING' },
        include: { customer: true, product: true, riskAssessment: true, eligibility: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      // 4. Pending Payment Submissions to verify
      const pendingSubmissions = await prisma.paymentSubmission.findMany({
        where: { status: 'PENDING_VERIFICATION' },
        include: { customer: true, loan: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      // 5. Active Collection Cases
      const collectionCases = await prisma.collectionCase.findMany({
        where: { status: { in: ['OPEN', 'IN_PROGRESS', 'PROMISED'] } },
        include: { customer: true, loan: true, promises: { where: { status: 'PENDING' } } },
        take: 5,
        orderBy: { dpd: 'desc' },
      });

      contextBlocks.push(`
=== LMS OPERATIONAL PIPELINE & ATTENTION QUEUES ===
- Overdue Loans Count: ${overdueLoans.length}
${
  overdueLoans.length > 0
    ? overdueLoans
        .map(
          (l) =>
            `  * Loan #${l.loanNo} (${l.customer.firstName} ${l.customer.lastName}): Principal ₹${Number(
              l.principal
            ).toLocaleString('en-IN')}, Outstanding ₹${Number(l.outstandingPrincipal).toLocaleString(
              'en-IN'
            )}, DPD: ${l.collectionCases[0]?.dpd || 'N/A'} days`
        )
        .join('\n')
    : '  * Zero overdue delinquent accounts currently active.'
}

- Pending Underwriting Proposals: ${pendingUnderwriting.length}
${
  pendingUnderwriting.length > 0
    ? pendingUnderwriting
        .map(
          (a) =>
            `  * App #${a.applicationNo} (${a.customer.firstName} ${a.customer.lastName}): ₹${Number(
              a.requestedAmount
            ).toLocaleString('en-IN')}, Risk Score: ${a.riskAssessment?.score || 'N/A'}/100 (${
              a.riskAssessment?.category || 'PENDING'
            })`
        )
        .join('\n')
    : '  * Zero proposals awaiting underwriting.'
}

- Pending Electronic Payouts (Approved Applications): ${readyForDisbursement.length}
${
  readyForDisbursement.length > 0
    ? readyForDisbursement
        .map(
          (d) =>
            `  * App #${d.applicationNo} (${d.customer.firstName} ${d.customer.lastName}): ₹${Number(
              d.requestedAmount
            ).toLocaleString('en-IN')} (${d.product.name})`
        )
        .join('\n')
    : '  * Zero applications waiting in disbursement release queue.'
}

- Unsettled Borrower Payment Proof Submissions: ${pendingSubmissions.length}
${
  pendingSubmissions.length > 0
    ? pendingSubmissions
        .map(
          (p) =>
            `  * Sub #${p.submissionNo} (Loan #${p.loan.loanNo}): ₹${Number(p.amount).toLocaleString(
              'en-IN'
            )} via ${p.method} (Ref: ${p.reference}) by ${p.customer.firstName} ${p.customer.lastName}`
        )
        .join('\n')
    : '  * All borrower payment submissions have been verified and settled.'
}

- Active Delinquency Collection Cases: ${collectionCases.length}
${
  collectionCases.length > 0
    ? collectionCases
        .map(
          (c) =>
            `  * Case #${c.caseNo} (Loan #${c.loan.loanNo}, Borrower: ${c.customer.firstName} ${
              c.customer.lastName
            }, Mobile: ${c.customer.mobile}): DPD ${c.dpd} days (${c.agingBucket} Bucket), Overdue: ₹${Number(
              c.overdueAmount
            ).toLocaleString('en-IN')}, Status: ${c.status}`
        )
        .join('\n')
    : '  * No active collection recovery cases.'
}
      `);

      if (!summary) {
        summary = `Retrieved active attention queues (${primaryRole})`;
      }
    }
  }

  const contextText =
    contextBlocks.length > 0
      ? contextBlocks.join('\n\n')
      : 'No specific records matched the query directly in the LMS database.';

  return { contextText, summary: summary || 'General LMS consultation' };
}

/**
 * Main Copilot Chat Handler.
 * Integrates role-aware context building, conversational memory, and centralized Gemini generation.
 */
export async function handleCopilotChat(options: CopilotChatOptions): Promise<CopilotChatResponse> {
  const { userId, userEmail, roles, message, history = [], currentPath } = options;

  const primaryRole = (roles[0] || 'CUSTOMER') as RoleName;

  // 1. Fetch authorized context from PostgreSQL
  const { contextText, summary } = await buildAuthorizedContext(
    { id: userId, email: userEmail, roles },
    message,
    currentPath
  );

  // 2. Build centralized system instructions
  const systemInstruction = `
You are the official Adyapan LMS AI Copilot, an intelligent, professional banking & credit assistant.
You assist authenticated users with loan servicing, credit underwriting, origination, collections, and financial insights based STRICTLY on authorized data provided in the LMS Context below.

Current User: ${userEmail}
Current User Role: ${primaryRole}

=== STRICT OPERATIONAL RULES ===
1. TRUTHFULNESS & ACCURACY: Base all facts, numbers, statuses, customer names, DPD, risk scores, and amounts SOLELY on the verified LMS Context provided below.
2. NO HALLUCINATION: Never invent fake loan numbers, customer names, payment amounts, or dates. If the required information is not found in the LMS Context, clearly state: "I don't have enough information in the LMS records to answer that."
3. ROLE RESPECT: Answer in a way that helps the user perform their duties as a ${primaryRole}.
   - If user is LOAN_OFFICER: Focus on customer intake, missing KYC documents, and application submissions.
   - If user is CREDIT_ANALYST: Focus on DTI/FOIR, risk score breakdown, and policy eligibility criteria.
   - If user is UNDERWRITER: Focus on sanction decisions, approval limit tiers, conditions, and risk flags.
   - If user is FINANCE_OFFICER: Focus on disbursement release queue, electronic transfers (NEFT/RTGS), payment verifications, and waterfall ledgers.
   - If user is COLLECTION_OFFICER: Focus on DPD aging buckets, overdue balances, customer phone follow-ups, and PTP commitments.
   - If user is CUSTOMER (Borrower): Focus only on their own active loan facility, upcoming EMI due date, and payment submission proof. Never reveal other customers' data.
4. FINANCIAL TRUTH: Do not make up financial calculations. The amounts (Principal, Interest, EMI, Outstanding Balance, DPD) given in the LMS Context are authoritative.
5. FORMATTING: Use clean, concise formatting with bold text and short bullet points. Avoid raw JSON dumps or repeating the user's prompt verbatim.

=== VERIFIED LMS DATABASE CONTEXT ===
${contextText}
`;

  // 3. Format bounded conversation history (last 4 turns = 8 messages max)
  const boundedHistory = history.slice(-6);
  const conversationLines: string[] = [];

  for (const h of boundedHistory) {
    const speaker = h.role === 'user' ? 'User' : 'Copilot';
    conversationLines.push(`${speaker}: ${h.content}`);
  }

  conversationLines.push(`User: ${message}`);
  conversationLines.push(`Copilot:`);

  const fullPrompt = conversationLines.join('\n\n');

  // 4. Execute via Central Gemini Service
  const response = await generateGeminiContent({
    prompt: fullPrompt,
    systemInstruction,
    temperature: 0.2, // Low temperature for high factual accuracy
  });

  return {
    answer: response.text.trim(),
    model: response.model,
    contextSummary: summary,
  };
}
