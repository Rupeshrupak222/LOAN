import { CommunicationChannel, CommunicationTemplate, TemplateCode } from './communication.types';

/**
 * Mask sensitive PII strings per RBI and data privacy requirements.
 */
export function maskBankAccount(accountNumber: string): string {
  if (!accountNumber || accountNumber.length < 4) return 'XXXX-XXXX';
  const clean = accountNumber.replace(/\D/g, '');
  const last4 = clean.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

export function maskPan(pan: string): string {
  if (!pan || pan.length < 5) return 'XXXXX-XXXX';
  const clean = pan.trim().toUpperCase();
  if (clean.length === 10) {
    return `XXXXX${clean.slice(5, 9)}X`;
  }
  return `XXXXX${clean.slice(-4)}`;
}

export function maskAadhaar(aadhaar: string): string {
  if (!aadhaar || aadhaar.length < 4) return 'XXXX-XXXX-XXXX';
  const clean = aadhaar.replace(/\D/g, '');
  const last4 = clean.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

export function sanitizeVariables(vars: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = { ...vars };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      const lk = key.toLowerCase();
      if (lk.includes('account') || lk.includes('bankacc')) {
        sanitized[key] = maskBankAccount(value);
      } else if (lk.includes('pan')) {
        sanitized[key] = maskPan(value);
      } else if (lk.includes('aadhaar')) {
        sanitized[key] = maskAadhaar(value);
      }
    }
  }

  return sanitized;
}

export const TEMPLATE_REGISTRY: Record<TemplateCode, CommunicationTemplate> = {
  // ==========================================
  // 1. CUSTOMER ONBOARDING
  // ==========================================
  WELCOME_MESSAGE: {
    code: 'WELCOME_MESSAGE',
    name: 'Welcome to Adyapan LMS',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'],
    subjectTemplate: 'Welcome to Adyapan Financial Services, {{customerName}}!',
    bodyTemplate:
      'Dear {{customerName}}, welcome to Adyapan Financial Services (Customer ID: {{customerCode}}). Your digital profile has been registered. Explore loan options and track services at: {{portalUrl}}',
    description: 'Welcome notice dispatched upon customer registration.',
    requiredVariables: ['customerName', 'customerCode'],
  },

  PROFILE_CREATED: {
    code: 'PROFILE_CREATED',
    name: 'Customer Profile Created',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'IN_APP'],
    subjectTemplate: 'Customer Profile Created — ID: {{customerCode}}',
    bodyTemplate:
      'Hello {{customerName}}, your borrower account {{customerCode}} has been created at branch {{branchName}}. Please complete your KYC verification to unlock loan eligibility.',
    description: 'Triggered when a loan officer or staff creates a new borrower profile.',
    requiredVariables: ['customerName', 'customerCode'],
  },

  KYC_PENDING: {
    code: 'KYC_PENDING',
    name: 'KYC Verification Pending',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'],
    subjectTemplate: 'Action Required: Complete Your KYC Verification for Adyapan Loan',
    bodyTemplate:
      'Dear {{customerName}}, your KYC document verification is pending. Please upload your Aadhaar and PAN documents using our secure portal: {{uploadUrl}} to expedite your loan application.',
    description: 'Automated reminder for pending KYC documentation.',
    requiredVariables: ['customerName'],
  },

  KYC_REQUESTED: {
    code: 'KYC_REQUESTED',
    name: 'KYC Documents Required',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'WHATSAPP', 'IN_APP'],
    subjectTemplate: 'Action Required: Submit KYC Verification for Application #{{applicationNo}}',
    bodyTemplate:
      'Hello {{customerName}}, please upload your pending KYC documents ({{missingDocuments}}) to expedite underwriting on application #{{applicationNo}}. Please complete verification by {{expiryDate}} using secure link: {{uploadUrl}}',
    description: 'Notifies borrower of specific pending document verification or re-upload.',
    requiredVariables: ['customerName', 'applicationNo', 'missingDocuments'],
  },

  KYC_COMPLETED: {
    code: 'KYC_COMPLETED',
    name: 'KYC Verification Successful',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'],
    subjectTemplate: 'KYC Verified Successfully — Customer ID: {{customerCode}}',
    bodyTemplate:
      'Dear {{customerName}}, your KYC documentation has been fully verified and approved. Your loan application is now progressing to credit assessment.',
    description: 'Confirmation that all KYC criteria and identity checks passed.',
    requiredVariables: ['customerName', 'customerCode'],
  },

  DOCUMENT_REQUIRED: {
    code: 'DOCUMENT_REQUIRED',
    name: 'Additional Supporting Documents Required',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'],
    subjectTemplate: 'Additional Documents Required for Application #{{applicationNo}}',
    bodyTemplate:
      'Hello {{customerName}}, our credit assessment desk requires additional documentation ({{documentList}}) for application #{{applicationNo}}. Please upload via {{uploadUrl}}.',
    description: 'Request for supplementary income, bank statements, or business records.',
    requiredVariables: ['customerName', 'applicationNo', 'documentList'],
  },

  // ==========================================
  // 2. LOAN APPLICATION & DECISIONING
  // ==========================================
  APPLICATION_RECEIVED: {
    code: 'APPLICATION_RECEIVED',
    name: 'Loan Application Received',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'IN_APP'],
    subjectTemplate: 'Application #{{applicationNo}} Received — Adyapan LMS',
    bodyTemplate:
      'Dear {{customerName}}, your loan application #{{applicationNo}} for ₹{{requestedAmount}} has been received and is queued for verification.',
    description: 'Acknowledgment of new application intake.',
    requiredVariables: ['customerName', 'applicationNo', 'requestedAmount'],
  },

  APPLICATION_SUBMITTED: {
    code: 'APPLICATION_SUBMITTED',
    name: 'Loan Application Submitted',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'IN_APP'],
    subjectTemplate: 'Your Adyapan Loan Application #{{applicationNo}} is Submitted',
    bodyTemplate:
      'Dear {{customerName}}, your application #{{applicationNo}} for ₹{{requestedAmount}} ({{productName}}) has been successfully submitted. Our credit team has initiated document review. Track real-time progress at: {{trackingUrl}}',
    description: 'Triggered when borrower or loan officer submits draft loan application.',
    requiredVariables: ['customerName', 'applicationNo', 'requestedAmount', 'productName'],
  },

  CREDIT_ASSESSMENT_STARTED: {
    code: 'CREDIT_ASSESSMENT_STARTED',
    name: 'Credit Appraisal In Progress',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'IN_APP'],
    subjectTemplate: 'Credit Appraisal Started for Application #{{applicationNo}}',
    bodyTemplate:
      'Dear {{customerName}}, credit risk scoring and debt-to-income analysis has commenced for your application #{{applicationNo}}. Estimated evaluation turnaround: 24 hours.',
    description: 'Notifies customer that Credit Analyst has started assessment.',
    requiredVariables: ['customerName', 'applicationNo'],
  },

  APPLICATION_FORWARDED_TO_CREDIT: {
    code: 'APPLICATION_FORWARDED_TO_CREDIT',
    name: 'Application Forwarded to Credit Analyst Desk',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'IN_APP'],
    subjectTemplate: 'Application #{{applicationNo}} Forwarded to Credit Appraisal Desk',
    bodyTemplate:
      'Hello {{customerName}}, your loan proposal #{{applicationNo}} has completed intake review and has been forwarded to our Credit Analyst Desk for policy eligibility and risk assessment.',
    description: 'Sent when Loan Officer forwards application to Credit Analyst.',
    requiredVariables: ['customerName', 'applicationNo'],
  },

  UNDERWRITING_STARTED: {
    code: 'UNDERWRITING_STARTED',
    name: 'Underwriting Committee Review',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'IN_APP'],
    subjectTemplate: 'Underwriting Review Underway for Application #{{applicationNo}}',
    bodyTemplate:
      'Dear {{customerName}}, your proposal #{{applicationNo}} has received positive credit recommendation and is now under final sanction review with the Underwriting Committee.',
    description: 'Triggered when application enters Underwriting sanction queue.',
    requiredVariables: ['customerName', 'applicationNo'],
  },

  APPROVAL_SANCTION_LETTER: {
    code: 'APPROVAL_SANCTION_LETTER',
    name: 'Loan Approval & Sanction Letter',
    category: 'REGULATORY',
    supportedChannels: ['EMAIL', 'IN_APP'],
    subjectTemplate: 'Congratulations! Loan Sanction Letter Issued for #{{loanNo}}',
    bodyTemplate:
      'Dear {{customerName}}, we are pleased to inform you that your loan application has been approved. Sanction Details: Principal: ₹{{sanctionedAmount}}, Tenure: {{tenureMonths}} Months, Interest Rate: {{interestRate}}% p.a., Monthly EMI: ₹{{emiAmount}}. Please review and e-sign your loan agreement.',
    description: 'Mandatory formal sanction terms notice with key figures.',
    requiredVariables: ['customerName', 'loanNo', 'sanctionedAmount', 'tenureMonths', 'interestRate', 'emiAmount'],
  },

  LOAN_APPROVED: {
    code: 'LOAN_APPROVED',
    name: 'Loan Sanction Approved',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'],
    subjectTemplate: 'Loan Approved: ₹{{sanctionedAmount}} Sanctioned for Application #{{applicationNo}}',
    bodyTemplate:
      'Congratulations {{customerName}}! Your loan application #{{applicationNo}} for ₹{{sanctionedAmount}} has been approved. Your sanction letter is ready.',
    description: 'Short multi-channel approval alert for the customer.',
    requiredVariables: ['customerName', 'applicationNo', 'sanctionedAmount'],
  },

  REJECTION_EXPLANATION: {
    code: 'REJECTION_EXPLANATION',
    name: 'Adverse Credit Decision Notice',
    category: 'REGULATORY',
    supportedChannels: ['EMAIL', 'IN_APP'],
    subjectTemplate: 'Update on Your Loan Application #{{applicationNo}}',
    bodyTemplate:
      'Dear {{customerName}}, thank you for applying with Adyapan. After careful credit evaluation, we regret to inform you that we cannot approve application #{{applicationNo}} at this time due to policy criteria: {{rejectionReason}}. You may re-apply after {{coolingPeriodMonths}} months.',
    description: 'Formal adverse decision explanation per regulatory rules.',
    requiredVariables: ['customerName', 'applicationNo', 'rejectionReason'],
  },

  LOAN_REJECTED: {
    code: 'LOAN_REJECTED',
    name: 'Application Status Update: Declined',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'IN_APP'],
    subjectTemplate: 'Application Status: #{{applicationNo}} Not Approved',
    bodyTemplate:
      'Dear {{customerName}}, your application #{{applicationNo}} could not be approved at this time. Please check your registered email for detailed policy evaluation notes.',
    description: 'Summary rejection notification.',
    requiredVariables: ['customerName', 'applicationNo'],
  },

  // ==========================================
  // 3. DISBURSEMENT
  // ==========================================
  DISBURSEMENT_INITIATED: {
    code: 'DISBURSEMENT_INITIATED',
    name: 'Electronic Disbursement Initiated',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'IN_APP'],
    subjectTemplate: 'Disbursement Initiated: ₹{{netDisbursedAmount}} for Loan #{{loanNo}}',
    bodyTemplate:
      'Dear {{customerName}}, electronic fund release of ₹{{netDisbursedAmount}} for Loan #{{loanNo}} has been queued for bank transfer to Account {{bankAccount}}.',
    description: 'Dispatched when treasury queues electronic payout.',
    requiredVariables: ['customerName', 'loanNo', 'netDisbursedAmount', 'bankAccount'],
  },

  DISBURSEMENT_NOTICE: {
    code: 'DISBURSEMENT_NOTICE',
    name: 'Loan Disbursed to Bank Account',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'WHATSAPP'],
    subjectTemplate: 'Funds Disbursed: ₹{{netDisbursedAmount}} credited to your account',
    bodyTemplate:
      'Dear {{customerName}}, ₹{{netDisbursedAmount}} for Loan #{{loanNo}} has been released to your Bank Account {{bankAccount}} via UTR {{utrNumber}}. Your first EMI of ₹{{emiAmount}} is due on {{firstDueDate}}.',
    description: 'Confirmation of electronic fund release with masked account and UTR.',
    requiredVariables: ['customerName', 'loanNo', 'netDisbursedAmount', 'bankAccount', 'utrNumber', 'firstDueDate'],
  },

  DISBURSEMENT_SUCCESSFUL: {
    code: 'DISBURSEMENT_SUCCESSFUL',
    name: 'Disbursement Completed & Schedule Activated',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'],
    subjectTemplate: 'Loan #{{loanNo}} Disbursed — Repayment Schedule Active',
    bodyTemplate:
      'Hello {{customerName}}, funds of ₹{{netDisbursedAmount}} have been successfully transferred to your account (UTR: {{utrNumber}}). View your full amortization schedule on the borrower portal.',
    description: 'Comprehensive disbursement confirmation with active schedule notification.',
    requiredVariables: ['customerName', 'loanNo', 'netDisbursedAmount', 'utrNumber'],
  },

  DISBURSEMENT_FAILED: {
    code: 'DISBURSEMENT_FAILED',
    name: 'Disbursement Processing Issue',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'IN_APP'],
    subjectTemplate: 'Urgent: Payout Processing Issue on Loan #{{loanNo}}',
    bodyTemplate:
      'Dear {{customerName}}, payout for Loan #{{loanNo}} encountered a destination banking error: {{failureReason}}. Our operations desk is re-initiating transfer.',
    description: 'Alert if bank transfer fails during electronic payout.',
    requiredVariables: ['customerName', 'loanNo', 'failureReason'],
  },

  // ==========================================
  // 4. PAYMENTS & REPAYMENTS
  // ==========================================
  UPCOMING_EMI_REMINDER: {
    code: 'UPCOMING_EMI_REMINDER',
    name: 'Upcoming Installment Due Reminder',
    category: 'TRANSACTIONAL',
    supportedChannels: ['SMS', 'WHATSAPP', 'IN_APP'],
    subjectTemplate: 'Reminder: EMI of ₹{{emiAmount}} due on {{dueDate}} for Loan #{{loanNo}}',
    bodyTemplate:
      'Dear {{customerName}}, your monthly EMI of ₹{{emiAmount}} for Loan #{{loanNo}} is due on {{dueDate}}. Maintain sufficient balance or pay directly via UPI: {{paymentUrl}} to avoid late charges.',
    description: 'Pre-due date reminder to prevent delinquency and late penalties.',
    requiredVariables: ['customerName', 'loanNo', 'emiAmount', 'dueDate'],
  },

  EMI_DUE_TODAY: {
    code: 'EMI_DUE_TODAY',
    name: 'EMI Due Today Notification',
    category: 'TRANSACTIONAL',
    supportedChannels: ['SMS', 'WHATSAPP', 'IN_APP'],
    subjectTemplate: 'Due Today: EMI of ₹{{emiAmount}} for Loan #{{loanNo}}',
    bodyTemplate:
      'Dear {{customerName}}, your EMI of ₹{{emiAmount}} for Loan #{{loanNo}} is due today ({{dueDate}}). Pay instantly via UPI/NetBanking: {{paymentUrl}}.',
    description: 'Same-day reminder for installment payment.',
    requiredVariables: ['customerName', 'loanNo', 'emiAmount', 'dueDate'],
  },

  PAYMENT_RECEIPT: {
    code: 'PAYMENT_RECEIPT',
    name: 'Payment Acknowledgment Receipt',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'IN_APP'],
    subjectTemplate: 'Payment Received: ₹{{paidAmount}} for Loan #{{loanNo}}',
    bodyTemplate:
      'Dear {{customerName}}, we have received your payment of ₹{{paidAmount}} (Receipt #{{receiptNo}}) for Loan #{{loanNo}}. Principal allocated: ₹{{principalAllocated}}, Interest: ₹{{interestAllocated}}. Remaining Balance: ₹{{outstandingPrincipal}}.',
    description: 'Post-payment double-entry ledger allocation receipt.',
    requiredVariables: ['customerName', 'loanNo', 'paidAmount', 'receiptNo', 'outstandingPrincipal'],
  },

  PAYMENT_RECEIVED: {
    code: 'PAYMENT_RECEIVED',
    name: 'Payment Confirmation',
    category: 'TRANSACTIONAL',
    supportedChannels: ['SMS', 'WHATSAPP', 'IN_APP'],
    subjectTemplate: 'Payment Confirmed: ₹{{paidAmount}} Received for Loan #{{loanNo}}',
    bodyTemplate:
      'Thank you {{customerName}}! We received your payment of ₹{{paidAmount}} (Ref: {{paymentReference}}) for Loan #{{loanNo}}. Account balance updated.',
    description: 'Instant acknowledgment upon repayment ledger posting.',
    requiredVariables: ['customerName', 'loanNo', 'paidAmount'],
  },

  PAYMENT_FAILED: {
    code: 'PAYMENT_FAILED',
    name: 'Repayment Failed Notification',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'IN_APP'],
    subjectTemplate: 'Payment Failed: Transaction for Loan #{{loanNo}} Unsuccessful',
    bodyTemplate:
      'Dear {{customerName}}, your payment attempt of ₹{{attemptedAmount}} for Loan #{{loanNo}} failed. Reason: {{failureReason}}. Please retry at {{paymentUrl}}.',
    description: 'Alert when auto-debit or online repayment fails.',
    requiredVariables: ['customerName', 'loanNo', 'attemptedAmount'],
  },

  // ==========================================
  // 5. COLLECTIONS & DELINQUENCY (Strict 8 AM - 7 PM Window)
  // ==========================================
  OVERDUE_NOTICE: {
    code: 'OVERDUE_NOTICE',
    name: 'Delinquency & Overdue Notice (Collection)',
    category: 'COLLECTION',
    supportedChannels: ['EMAIL', 'SMS', 'WHATSAPP'],
    subjectTemplate: 'Urgent: Overdue Payment Notice for Loan #{{loanNo}} ({{dpd}} Days Overdue)',
    bodyTemplate:
      'Dear {{customerName}}, your installment of ₹{{overdueAmount}} for Loan #{{loanNo}} is overdue by {{dpd}} days. Accrued late charges: ₹{{lateCharges}}. Please clear immediately at {{paymentUrl}} or contact your resolution officer {{officerName}} at {{officerPhone}}.',
    description: 'Formal collection reminder. Restricted strictly to 8 AM - 7 PM window.',
    requiredVariables: ['customerName', 'loanNo', 'overdueAmount', 'dpd', 'lateCharges'],
  },

  COLLECTION_PAYMENT_REMINDER: {
    code: 'COLLECTION_PAYMENT_REMINDER',
    name: 'Collection Follow-Up Notice',
    category: 'COLLECTION',
    supportedChannels: ['SMS', 'WHATSAPP', 'EMAIL'],
    subjectTemplate: 'Payment Follow-Up: Overdue Balance ₹{{overdueAmount}} for Loan #{{loanNo}}',
    bodyTemplate:
      'Hello {{customerName}}, this is a follow-up regarding your overdue balance of ₹{{overdueAmount}} on Loan #{{loanNo}}. Please settle today at {{paymentUrl}} to prevent adverse credit bureau reporting.',
    description: 'Follow-up message sent by collection officers during recovery window.',
    requiredVariables: ['customerName', 'loanNo', 'overdueAmount'],
  },

  PTP_REMINDER: {
    code: 'PTP_REMINDER',
    name: 'Promise-to-Pay (PTP) Commitment Reminder',
    category: 'COLLECTION',
    supportedChannels: ['SMS', 'WHATSAPP', 'IN_APP'],
    subjectTemplate: 'Reminder: Promised Payment of ₹{{promisedAmount}} Due on {{promisedDate}}',
    bodyTemplate:
      'Dear {{customerName}}, as per your discussion with your recovery officer, your promised payment of ₹{{promisedAmount}} for Loan #{{loanNo}} is due on {{promisedDate}}. Please pay via: {{paymentUrl}}.',
    description: 'Reminder of agreed borrower promise-to-pay date.',
    requiredVariables: ['customerName', 'loanNo', 'promisedAmount', 'promisedDate'],
  },

  PTP_BROKEN: {
    code: 'PTP_BROKEN',
    name: 'Broken Promise-to-Pay (PTP) Alert',
    category: 'COLLECTION',
    supportedChannels: ['EMAIL', 'SMS', 'WHATSAPP'],
    subjectTemplate: 'Urgent: Promise-to-Pay Commitment Missed on Loan #{{loanNo}}',
    bodyTemplate:
      'Dear {{customerName}}, your scheduled payment of ₹{{promisedAmount}} promised for {{promisedDate}} was not received. Please contact branch collection desk at {{officerPhone}} immediately to avoid legal escalation.',
    description: 'Notice dispatched when a PTP commitment date lapses without payment.',
    requiredVariables: ['customerName', 'loanNo', 'promisedAmount', 'promisedDate'],
  },

  RECOVERY_NOTICE: {
    code: 'RECOVERY_NOTICE',
    name: 'Pre-Legal Recovery Notice',
    category: 'COLLECTION',
    supportedChannels: ['EMAIL', 'SMS'],
    subjectTemplate: 'Demand Notice: Total Overdue ₹{{overdueAmount}} on Loan #{{loanNo}}',
    bodyTemplate:
      'Dear {{customerName}}, formal demand notice is hereby issued for outstanding dues of ₹{{overdueAmount}} on Loan #{{loanNo}} ({{dpd}} DPD). You are requested to clear all dues within 7 days.',
    description: 'Pre-legal recovery letter sent per RBI fair collection code.',
    requiredVariables: ['customerName', 'loanNo', 'overdueAmount', 'dpd'],
  },

  // ==========================================
  // 6. LOAN CLOSURE & NOC
  // ==========================================
  LOAN_CLOSED: {
    code: 'LOAN_CLOSED',
    name: 'Loan Account Fully Settled & Closed',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'],
    subjectTemplate: 'Loan Account #{{loanNo}} Closed Successfully',
    bodyTemplate:
      'Dear {{customerName}}, your Loan Account #{{loanNo}} has been fully repaid and closed on {{closureDate}}. Thank you for your partnership with Adyapan.',
    description: 'Notice confirming zero outstanding balance and formal account closure.',
    requiredVariables: ['customerName', 'loanNo', 'closureDate'],
  },

  SETTLEMENT_NOC_LETTER: {
    code: 'SETTLEMENT_NOC_LETTER',
    name: 'No Objection Certificate (NOC) & Closure',
    category: 'REGULATORY',
    supportedChannels: ['EMAIL', 'IN_APP'],
    subjectTemplate: 'Loan Account #{{loanNo}} Closed — No Objection Certificate (NOC)',
    bodyTemplate:
      'Dear {{customerName}}, this is to certify that Loan #{{loanNo}} has been fully settled and closed on {{closureDate}} with NIL outstanding balance. Your official No Objection Certificate (NOC Ref: {{nocReference}}) has been generated and credit bureaus will be updated.',
    description: 'Final closure clearance letter and NOC document declaration.',
    requiredVariables: ['customerName', 'loanNo', 'closureDate', 'nocReference'],
  },

  NOC_GENERATED: {
    code: 'NOC_GENERATED',
    name: 'Digital NOC Document Available for Download',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'],
    subjectTemplate: 'NOC Certificate Generated for Loan #{{loanNo}}',
    bodyTemplate:
      'Hello {{customerName}}, your digital No Objection Certificate (NOC No: {{nocReference}}) for Loan #{{loanNo}} is now available for download from your customer portal: {{nocDownloadUrl}}.',
    description: 'Link to download verified digital NOC PDF.',
    requiredVariables: ['customerName', 'loanNo', 'nocReference'],
  },
};

/**
 * Resolves template with token substitution, sanitization, and channel formatting.
 */
export function renderTemplate(
  templateCode: TemplateCode,
  rawVariables: Record<string, any>,
  channel: CommunicationChannel
): { subject: string; body: string; category: string } {
  const tpl = TEMPLATE_REGISTRY[templateCode];
  if (!tpl) {
    throw new Error(`Template code '${templateCode}' not found in registry.`);
  }

  const safeVars = sanitizeVariables(rawVariables);

  // Map alternative token names for maximum tolerance
  if (safeVars.customer_name && !safeVars.customerName) safeVars.customerName = safeVars.customer_name;
  if (safeVars.customer_id && !safeVars.customerCode) safeVars.customerCode = safeVars.customer_id;
  if (safeVars.loan_number && !safeVars.loanNo) safeVars.loanNo = safeVars.loan_number;
  if (safeVars.emi_amount && !safeVars.emiAmount) safeVars.emiAmount = safeVars.emi_amount;
  if (safeVars.due_date && !safeVars.dueDate) safeVars.dueDate = safeVars.due_date;
  if (safeVars.outstanding_amount && !safeVars.overdueAmount) safeVars.overdueAmount = safeVars.outstanding_amount;
  if (safeVars.payment_reference && !safeVars.paymentReference) safeVars.paymentReference = safeVars.payment_reference;
  if (safeVars.company_name && !safeVars.companyName) safeVars.companyName = safeVars.company_name;

  let subject = tpl.subjectTemplate;
  let body = tpl.bodyTemplate;

  // Substitute all provided variables
  for (const [key, value] of Object.entries(safeVars)) {
    const token = new RegExp(`{{${key}}}`, 'g');
    const valStr = value !== undefined && value !== null ? String(value) : '';
    subject = subject.replace(token, valStr);
    body = body.replace(token, valStr);
  }

  // Provide graceful default fallbacks for un-substituted tokens so raw {{brackets}} don't show to users
  subject = subject.replace(/{{[a-zA-Z0-9_]+}}/g, (match) => {
    const field = match.slice(2, -2);
    return field === 'customerName' ? 'Customer' : field === 'loanNo' ? 'N/A' : '-';
  });
  body = body.replace(/{{[a-zA-Z0-9_]+}}/g, (match) => {
    const field = match.slice(2, -2);
    return field === 'customerName' ? 'Customer' : field === 'loanNo' ? 'N/A' : '-';
  });

  // Format body for email channel
  if (channel === 'EMAIL') {
    body = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: 700;">Adyapan Financial Services</h2>
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Regulated Lending Institution</span>
        </div>
        <div style="font-size: 14px; line-height: 1.6; color: #334155;">
          ${body}
        </div>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center;">
          This is an official transactional notification. We never ask for passwords or OTPs. Per RBI guidelines, all loan servicing terms are strictly governed by your loan agreement.
        </div>
      </div>
    `.trim();
  }

  return { subject, body, category: tpl.category };
}
