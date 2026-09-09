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
  APPLICATION_SUBMITTED: {
    code: 'APPLICATION_SUBMITTED',
    name: 'Loan Application Submitted',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'SMS', 'IN_APP'],
    subjectTemplate: 'Your Adyapan Loan Application #{{applicationNo}} is Submitted',
    bodyTemplate:
      'Dear {{customerName}}, your application #{{applicationNo}} for ₹{{requestedAmount}} ({{productName}}) has been successfully submitted. Our credit team has initiated document review. Track real-time progress at: {{trackingUrl}}',
    description: 'Triggered when borrower or partner submits loan application.',
    requiredVariables: ['customerName', 'applicationNo', 'requestedAmount', 'productName'],
  },

  KYC_REQUESTED: {
    code: 'KYC_REQUESTED',
    name: 'KYC Documents Required',
    category: 'TRANSACTIONAL',
    supportedChannels: ['EMAIL', 'WHATSAPP', 'IN_APP'],
    subjectTemplate: 'Action Required: Submit KYC Verification for Application #{{applicationNo}}',
    bodyTemplate:
      'Hello {{customerName}}, please upload your pending KYC documents ({{missingDocuments}}) to expedite underwriting on application #{{applicationNo}}. Please complete verification by {{expiryDate}} using secure link: {{uploadUrl}}',
    description: 'Notifies borrower of pending document verification or re-upload.',
    requiredVariables: ['customerName', 'applicationNo', 'missingDocuments'],
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

  REJECTION_EXPLANATION: {
    code: 'REJECTION_EXPLANATION',
    name: 'Adverse Credit Decision Notice',
    category: 'REGULATORY',
    supportedChannels: ['EMAIL', 'IN_APP'],
    subjectTemplate: 'Update on Your Loan Application #{{applicationNo}}',
    bodyTemplate:
      'Dear {{customerName}}, thank you for applying with Adyapan. After careful credit evaluation, we regret to inform you that we cannot approve application #{{applicationNo}} at this time due to policy criteria: {{rejectionReason}}. You may re-apply after {{coolingPeriodMonths}} months.',
    description: 'Formal, non-discriminatory adverse decision explanation per regulatory rules.',
    requiredVariables: ['customerName', 'applicationNo', 'rejectionReason'],
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

  let subject = tpl.subjectTemplate;
  let body = tpl.bodyTemplate;

  for (const [key, value] of Object.entries(safeVars)) {
    const token = new RegExp(`{{${key}}}`, 'g');
    const valStr = value !== undefined && value !== null ? String(value) : '';
    subject = subject.replace(token, valStr);
    body = body.replace(token, valStr);
  }

  // Format body for channel
  if (channel === 'EMAIL') {
    body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin: 0; font-size: 20px;">Adyapan Financial Services</h2>
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
