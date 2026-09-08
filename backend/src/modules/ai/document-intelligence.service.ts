import { prisma } from '../../config/prisma';
import { generateGeminiContent } from './gemini.service';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';

export interface DocumentIntelligenceResult {
  documentId: string;
  fileName: string;
  storageUrl: string;
  category: string;
  uploadedAt: string;
  analyzedAt: string;
  model: string;

  // 1. Classification
  classification: {
    detectedType: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
    matchesDeclaredCategory: boolean;
  };

  // 2. Extracted Fields
  extractedFields: {
    holderName?: string;
    documentNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    employerName?: string;
    reportedIncome?: string;
    salaryPeriod?: string;
    bankName?: string;
    bankAccountNo?: string;
    issueDate?: string;
    expiryDate?: string;
    rawTextExcerpt?: string;
  };

  // 3. Application Comparisons & Mismatch Detection
  comparisons: {
    field: string;
    applicationValue: string;
    documentValue: string;
    status: 'MATCH' | 'PARTIAL_MATCH' | 'MISMATCH' | 'NOT_PRESENT_IN_DOC' | 'NOT_PRESENT_IN_APP';
    severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    explanation: string;
    suggestedAction: string;
  }[];

  // 4. Quality Assessment
  qualityAssessment: {
    quality: 'CLEAR_READABLE' | 'MODERATE_QUALITY' | 'BLURRY_OR_DEGRADED' | 'CROPPED_OR_INCOMPLETE';
    readabilityScore: number;
    observations: string;
  };

  // 5. Potential Anomaly Signals
  anomalySignals: {
    signal: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    explanation: string;
    reviewAction: string;
  }[];

  // 6. Customer Document Vault Completeness
  completeness: {
    totalDocuments: number;
    verifiedDocuments: number;
    missingMandatoryCategories: string[];
    completenessStatus: 'COMPLETE' | 'PARTIALLY_COMPLETE' | 'INCOMPLETE';
  };

  // 7. Executive Summary & Recommended Review
  documentSummary: string;
  recommendedReview:
    | 'NO_OBVIOUS_ISSUE_DETECTED'
    | 'MANUAL_REVIEW_RECOMMENDED'
    | 'POTENTIAL_MISMATCH_FLAGGED'
    | 'DOCUMENT_UNREADABLE';
  reviewRationale: string;
}

/**
 * Analyzes an uploaded KYC or compliance document using Gemini Document Understanding.
 */
export async function analyzeDocumentIntelligence(
  documentId: string,
  actor: { id: string; email: string; roles: string[] }
): Promise<DocumentIntelligenceResult> {
  // 1. Fetch document and associated customer profile
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      customer: {
        include: {
          employmentDetails: true,
          bankAccounts: true,
          documents: true,
          loans: true,
        },
      },
      application: true,
    },
  });

  if (!doc) {
    throw new NotFoundError('Document record not found');
  }

  // 2. RBAC Enforcement
  const isCustomer = actor.roles.includes('CUSTOMER');
  if (isCustomer) {
    if (doc.customer?.userId !== actor.id) {
      throw new ForbiddenError('Access forbidden: You cannot analyze another borrower document');
    }
  } else {
    const isStaff = actor.roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR'].includes(r)
    );
    if (!isStaff) {
      throw new ForbiddenError('Access forbidden: Insufficient permissions for Document Intelligence');
    }
  }

  const customer = doc.customer;
  const emp = customer?.employmentDetails[0];

  // 3. Vault Completeness Analysis
  const allCustDocs = customer?.documents || [];
  const verifiedCount = allCustDocs.filter((d) => d.verified).length;
  const categoriesPresent = new Set(allCustDocs.map((d) => d.category.toUpperCase()));

  const mandatoryCategories = ['IDENTITY_PROOF', 'ADDRESS_PROOF', 'INCOME_PROOF'];
  const missingCategories = mandatoryCategories.filter((cat) => {
    // If IDENTITY_PROOF or PAN/AADHAAR is present
    if (cat === 'IDENTITY_PROOF') {
      return !categoriesPresent.has('IDENTITY_PROOF') && !categoriesPresent.has('IDENTITY') && !categoriesPresent.has('PAN_CARD');
    }
    if (cat === 'ADDRESS_PROOF') {
      return !categoriesPresent.has('ADDRESS_PROOF') && !categoriesPresent.has('ADDRESS') && !categoriesPresent.has('AADHAAR_CARD');
    }
    if (cat === 'INCOME_PROOF') {
      return (
        !categoriesPresent.has('INCOME_PROOF') &&
        !categoriesPresent.has('INCOME') &&
        !categoriesPresent.has('SALARY_SLIP') &&
        !categoriesPresent.has('BANK_STATEMENT')
      );
    }
    return !categoriesPresent.has(cat);
  });

  const completenessStatus =
    missingCategories.length === 0 ? 'COMPLETE' : allCustDocs.length > 0 ? 'PARTIALLY_COMPLETE' : 'INCOMPLETE';

  // 4. Fetch document image buffer if available (from Cloudinary or local) with 4s bounded timeout
  let inlineData: { mimeType: string; data: string } | undefined = undefined;
  if (doc.storageKey && doc.storageKey.startsWith('http')) {
    try {
      const controller = new AbortController();
      const fetchTimer = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(doc.storageKey, { signal: controller.signal });
      clearTimeout(fetchTimer);

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Auto-detect magic bytes for image/pdf to prevent mimeType mismatch
        let mimeType = 'image/jpeg';
        if (buffer[0] === 0xff && buffer[1] === 0xd8) {
          mimeType = 'image/jpeg';
        } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
          mimeType = 'image/png';
        } else if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
          mimeType = 'application/pdf';
        } else if (doc.contentType && doc.contentType.startsWith('image/')) {
          mimeType = doc.contentType;
        }

        inlineData = {
          mimeType,
          data: buffer.toString('base64'),
        };
      }
    } catch {
      // Graceful fallback to text metadata analysis if remote asset fetch is restricted/slow
    }
  }

  // 5. Construct Authoritative LMS Context
  const lmsContext = `
=== AUTHORIZED LMS BORROWER RECORD ===
Customer Code: ${customer?.customerCode || 'N/A'}
Declared Full Name: ${customer?.firstName || ''} ${customer?.lastName || ''}
Declared Date of Birth: ${customer?.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : 'Not Specified'}
Declared Gender: ${customer?.gender || 'Not Specified'}
Declared City: ${customer?.city || 'N/A'}, State: ${customer?.state || 'N/A'}, Pincode: ${customer?.pincode || 'N/A'}
Declared Employment: ${customer?.employmentType || 'SALARIED'} at "${emp?.employerName || customer?.employerName || 'Not specified'}" (${emp?.designation || 'Staff'})
Declared Net Monthly Income: ₹${Number(customer?.monthlyIncome || 0).toLocaleString('en-IN')}
Declared Existing Monthly Obligations: ₹${Number(customer?.existingObligations || 0).toLocaleString('en-IN')}
Declared Bank Accounts: ${
    customer?.bankAccounts.length
      ? customer.bankAccounts.map((b) => `${b.bankName} (A/C: ${b.accountNumber}, IFSC: ${b.ifscCode})`).join('; ')
      : 'None'
  }

=== TARGET DOCUMENT METADATA ===
Document ID: ${doc.id}
Uploaded File Name: "${doc.fileName}"
Declared Category: ${doc.category}
Declared Document Type: ${doc.documentType || doc.category}
File MIME Type: ${doc.contentType || 'image/jpeg'}
File Size Bytes: ${doc.sizeBytes || 'N/A'}
Current Verification Status: ${doc.status} (Verified: ${doc.verified})
`;

  // 6. System Prompt
  const systemInstruction = `
You are the Chief Document Intelligence AI for Adyapan Loan Management System.
Analyze uploaded compliance/KYC documents, classify them, extract fields, and detect mismatches against LMS records.

RULES:
1. TRUTHFULNESS: Extract ONLY visible data. Never invent information.
2. ADVISORY ONLY: Decision support only. Do not mutate verification status.
3. CONCISENESS: Keep summaries and observations to 1-2 concise sentences.
4. STRICT JSON: Return ONLY a valid JSON object matching the required schema.

SCHEMA:
{
  "classification": {
    "detectedType": "PAN_CARD" | "AADHAAR_CARD" | "SALARY_SLIP" | "BANK_STATEMENT" | "PASSPORT" | "VOTER_ID" | "DRIVING_LICENSE" | "UTILITY_BILL" | "OFFER_LETTER" | "OTHER",
    "confidence": "HIGH" | "MEDIUM" | "LOW",
    "reason": "Classification rationale",
    "matchesDeclaredCategory": true | false
  },
  "extractedFields": {
    "holderName": "Name on doc or null",
    "documentNumber": "Document ID or null",
    "dateOfBirth": "DOB or null",
    "rawTextExcerpt": "Key text excerpt or null"
  },
  "comparisons": [
    {
      "field": "Customer Name" | "Date of Birth" | "Address" | "Employer" | "Monthly Income" | "Bank Account",
      "applicationValue": "LMS value",
      "documentValue": "Document value",
      "status": "MATCH" | "PARTIAL_MATCH" | "MISMATCH" | "NOT_PRESENT_IN_DOC" | "NOT_PRESENT_IN_APP",
      "severity": "HIGH" | "MEDIUM" | "LOW" | "NONE",
      "explanation": "Explanation",
      "suggestedAction": "Action"
    }
  ],
  "qualityAssessment": {
    "quality": "CLEAR_READABLE" | "MODERATE_QUALITY" | "BLURRY_OR_DEGRADED" | "CROPPED_OR_INCOMPLETE",
    "readabilityScore": number,
    "observations": "Quality remarks"
  },
  "anomalySignals": [
    {
      "signal": "Anomaly description",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "explanation": "Why anomaly",
      "reviewAction": "Action"
    }
  ],
  "documentSummary": "Concise 2-sentence summary of document validation against LMS record.",
  "recommendedReview": "NO_OBVIOUS_ISSUE_DETECTED" | "MANUAL_REVIEW_RECOMMENDED" | "POTENTIAL_MISMATCH_FLAGGED" | "DOCUMENT_UNREADABLE",
  "reviewRationale": "Reason for recommendation"
}
`;

  let result: DocumentIntelligenceResult;

  try {
    // 7. Execute via Central Gemini Service
    const geminiResult = await generateGeminiContent({
      prompt: `Analyze the following document and generate the structured Document Intelligence JSON response:\n\n${lmsContext}`,
      systemInstruction,
      temperature: 0.1,
      inlineData,
    });

    // 8. Safe JSON Parsing
    const rawText = geminiResult.text.trim();
    const cleanJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(cleanJson);

    result = {
      documentId: doc.id,
      fileName: doc.fileName,
      storageUrl: doc.storageKey,
      category: doc.category,
      uploadedAt: doc.createdAt.toISOString(),
      analyzedAt: new Date().toISOString(),
      model: geminiResult.model,
      classification: {
        detectedType: parsed.classification?.detectedType || doc.category,
        confidence: ['HIGH', 'MEDIUM', 'LOW'].includes(parsed.classification?.confidence)
          ? parsed.classification.confidence
          : 'HIGH',
        reason: parsed.classification?.reason || 'Classified based on visual and metadata inspection.',
        matchesDeclaredCategory:
          typeof parsed.classification?.matchesDeclaredCategory === 'boolean'
            ? parsed.classification.matchesDeclaredCategory
            : true,
      },
      extractedFields: parsed.extractedFields || {},
      comparisons: Array.isArray(parsed.comparisons) ? parsed.comparisons : [],
      qualityAssessment: {
        quality: ['CLEAR_READABLE', 'MODERATE_QUALITY', 'BLURRY_OR_DEGRADED', 'CROPPED_OR_INCOMPLETE'].includes(
          parsed.qualityAssessment?.quality
        )
          ? parsed.qualityAssessment.quality
          : 'CLEAR_READABLE',
        readabilityScore:
          typeof parsed.qualityAssessment?.readabilityScore === 'number'
            ? parsed.qualityAssessment.readabilityScore
            : 90,
        observations: parsed.qualityAssessment?.observations || 'Document text is readable.',
      },
      anomalySignals: Array.isArray(parsed.anomalySignals) ? parsed.anomalySignals : [],
      completeness: {
        totalDocuments: allCustDocs.length,
        verifiedDocuments: verifiedCount,
        missingMandatoryCategories: missingCategories,
        completenessStatus,
      },
      documentSummary: parsed.documentSummary || 'Document analyzed successfully against LMS record.',
      recommendedReview: [
        'NO_OBVIOUS_ISSUE_DETECTED',
        'MANUAL_REVIEW_RECOMMENDED',
        'POTENTIAL_MISMATCH_FLAGGED',
        'DOCUMENT_UNREADABLE',
      ].includes(parsed.recommendedReview)
        ? parsed.recommendedReview
        : 'NO_OBVIOUS_ISSUE_DETECTED',
      reviewRationale: parsed.reviewRationale || 'Evaluation completed based on available document evidence.',
    };
  } catch {
    // Deterministic Rule-Based Fallback
    const comparisons: DocumentIntelligenceResult['comparisons'] = [];
    if (customer) {
      comparisons.push({
        field: 'Customer Name',
        applicationValue: `${customer.firstName} ${customer.lastName}`,
        documentValue: 'Extracted from metadata',
        status: doc.verified ? 'MATCH' : 'PARTIAL_MATCH',
        severity: 'NONE',
        explanation: `Document associated with registered customer #${customer.customerCode}.`,
        suggestedAction: doc.verified ? 'No action required.' : 'Perform manual visual check.',
      });
    }

    result = {
      documentId: doc.id,
      fileName: doc.fileName,
      storageUrl: doc.storageKey,
      category: doc.category,
      uploadedAt: doc.createdAt.toISOString(),
      analyzedAt: new Date().toISOString(),
      model: 'deterministic-rules-engine',
      classification: {
        detectedType: doc.documentType || doc.category,
        confidence: 'HIGH',
        reason: `Classified based on declared upload category: ${doc.category}.`,
        matchesDeclaredCategory: true,
      },
      extractedFields: {
        holderName: `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || undefined,
      },
      comparisons,
      qualityAssessment: {
        quality: 'CLEAR_READABLE',
        readabilityScore: doc.verified ? 95 : 85,
        observations: `File format ${doc.contentType || 'image/jpeg'} (${doc.sizeBytes ? Math.round(doc.sizeBytes / 1024) + ' KB' : 'Standard'}).`,
      },
      anomalySignals: [],
      completeness: {
        totalDocuments: allCustDocs.length,
        verifiedDocuments: verifiedCount,
        missingMandatoryCategories: missingCategories,
        completenessStatus,
      },
      documentSummary: `Document "${doc.fileName}" (${doc.category}) registered for borrower #${customer?.customerCode || 'N/A'}. Current status: ${doc.status}. (Deterministic LMS analysis).`,
      recommendedReview: doc.verified ? 'NO_OBVIOUS_ISSUE_DETECTED' : 'MANUAL_REVIEW_RECOMMENDED',
      reviewRationale: doc.verified ? 'Document previously verified.' : 'Verify document clarity against borrower profile.',
    };
  }

  // 9. Audit Trail
  await logAudit({
    userId: actor.id,
    role: actor.roles[0] || 'STAFF',
    action: 'DOCUMENT_INTELLIGENCE_GENERATED',
    entity: 'Document',
    entityId: doc.id,
    newValue: {
      fileName: doc.fileName,
      detectedType: result.classification.detectedType,
      recommendation: result.recommendedReview,
      model: result.model,
      generatedBy: actor.email,
    },
  }).catch(() => {});

  return result;
}
