import {
  calculateApplicableDocuments,
  validateCustomerDocumentFulfillment,
  normalizeEmploymentType,
  normalizeProductType,
} from './document-rules';

console.log('--- RUNNING DYNAMIC DOCUMENT RULES ENGINE TESTS ---');

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Salaried Customer
// ---------------------------------------------------------------------------
const salariedRules = calculateApplicableDocuments('SALARIED', 'PERSONAL');
assert(
  salariedRules.mandatory.some((r) => r.code === 'SALARY_SLIPS'),
  'Salaried rules must include SALARY_SLIPS in mandatory'
);
assert(
  salariedRules.mandatory.some((r) => r.code === 'BANK_STATEMENTS'),
  'Salaried rules must include BANK_STATEMENTS in mandatory'
);
assert(
  salariedRules.conditional.some((r) => r.code === 'FORM_16'),
  'Salaried rules must include FORM_16 in conditional'
);
assert(
  salariedRules.notApplicable.some((r) => r.code === 'BUSINESS_ITR'),
  'Salaried rules must mark BUSINESS_ITR as not applicable'
);

// Missing salary slips validation
const salariedIncomplete = validateCustomerDocumentFulfillment(
  [
    { category: 'IDENTITY_PROOF', documentType: 'PAN_CARD' },
    { category: 'ADDRESS_PROOF', documentType: 'AADHAAR' },
    { category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO' },
    { category: 'INCOME_PROOF', documentType: 'BANK_STATEMENT' },
  ],
  'SALARIED',
  'PERSONAL'
);
assert(!salariedIncomplete.isComplete, 'Salaried with missing salary slips must be incomplete');
assert(salariedIncomplete.missingCodes.includes('SALARY_SLIPS'), 'Missing codes must include SALARY_SLIPS');

// Complete salaried documents
const salariedComplete = validateCustomerDocumentFulfillment(
  [
    { category: 'IDENTITY_PROOF', documentType: 'PAN_CARD' },
    { category: 'ADDRESS_PROOF', documentType: 'AADHAAR' },
    { category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO' },
    { category: 'INCOME_PROOF', documentType: 'SALARY_SLIP' },
    { category: 'INCOME_PROOF', documentType: 'BANK_STATEMENT' },
  ],
  'SALARIED',
  'PERSONAL'
);
assert(salariedComplete.isComplete, 'Salaried with all mandatory documents must be complete');

// ---------------------------------------------------------------------------
// TEST 2: Self-Employed Customer
// ---------------------------------------------------------------------------
const selfEmployedRules = calculateApplicableDocuments('SELF_EMPLOYED', 'PERSONAL');
assert(
  !selfEmployedRules.mandatory.some((r) => r.code === 'SALARY_SLIPS'),
  'Self-employed rules must NOT include SALARY_SLIPS in mandatory'
);
assert(
  !selfEmployedRules.mandatory.some((r) => r.code === 'FORM_16'),
  'Self-employed rules must NOT include FORM_16 in mandatory'
);
assert(
  selfEmployedRules.mandatory.some((r) => r.code === 'BUSINESS_ITR'),
  'Self-employed rules must include BUSINESS_ITR in mandatory'
);
assert(
  selfEmployedRules.mandatory.some((r) => r.code === 'BUSINESS_BANK_STATEMENTS'),
  'Self-employed rules must include BUSINESS_BANK_STATEMENTS in mandatory'
);
assert(
  selfEmployedRules.notApplicable.some((r) => r.code === 'SALARY_SLIPS'),
  'Self-employed rules must mark SALARY_SLIPS as not applicable'
);

// Self-employed missing ITR
const selfEmployedIncomplete = validateCustomerDocumentFulfillment(
  [
    { category: 'IDENTITY_PROOF', documentType: 'PAN_CARD' },
    { category: 'ADDRESS_PROOF', documentType: 'AADHAAR' },
    { category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO' },
    { category: 'INCOME_PROOF', documentType: 'BUSINESS_BANK_STATEMENT' },
  ],
  'SELF_EMPLOYED',
  'PERSONAL'
);
assert(!selfEmployedIncomplete.isComplete, 'Self-employed with missing ITR must be incomplete');
assert(selfEmployedIncomplete.missingCodes.includes('BUSINESS_ITR'), 'Missing codes must include BUSINESS_ITR');

// Complete self-employed
const selfEmployedComplete = validateCustomerDocumentFulfillment(
  [
    { category: 'IDENTITY_PROOF', documentType: 'PAN_CARD' },
    { category: 'ADDRESS_PROOF', documentType: 'AADHAAR' },
    { category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO' },
    { category: 'INCOME_PROOF', documentType: 'ITR' },
    { category: 'INCOME_PROOF', documentType: 'BUSINESS_BANK_STATEMENT' },
  ],
  'SELF_EMPLOYED',
  'PERSONAL'
);
assert(selfEmployedComplete.isComplete, 'Self-employed with ITR and Bank Statement must be complete');

// ---------------------------------------------------------------------------
// TEST 3: Professional (Doctor/CA/Lawyer)
// ---------------------------------------------------------------------------
const profRules = calculateApplicableDocuments('PROFESSIONAL', 'PERSONAL');
assert(
  profRules.mandatory.some((r) => r.code === 'PROFESSIONAL_DEGREE'),
  'Professional rules must require PROFESSIONAL_DEGREE'
);
assert(
  !profRules.mandatory.some((r) => r.code === 'SALARY_SLIPS'),
  'Professional rules must NOT require SALARY_SLIPS'
);

// ---------------------------------------------------------------------------
// TEST 4: Freelancer & Retired & Homemaker
// ---------------------------------------------------------------------------
const freelancerRules = calculateApplicableDocuments('FREELANCER', 'PERSONAL');
assert(
  !freelancerRules.mandatory.some((r) => r.code === 'SALARY_SLIPS'),
  'Freelancer rules must NOT require SALARY_SLIPS'
);

const retiredRules = calculateApplicableDocuments('RETIRED', 'PERSONAL');
assert(
  retiredRules.mandatory.some((r) => r.code === 'PENSION_PROOF'),
  'Retired rules must require PENSION_PROOF'
);
assert(
  !retiredRules.mandatory.some((r) => r.code === 'SALARY_SLIPS'),
  'Retired rules must NOT require SALARY_SLIPS'
);

const homemakerRules = calculateApplicableDocuments('HOMEMAKER', 'PERSONAL');
assert(
  homemakerRules.notApplicable.some((r) => r.code === 'SALARY_SLIPS'),
  'Homemaker rules must mark SALARY_SLIPS as not applicable'
);

// ---------------------------------------------------------------------------
// TEST 5: Loan Product (Secured Property vs Unsecured Personal)
// ---------------------------------------------------------------------------
const unsecuredRules = calculateApplicableDocuments('SALARIED', 'PERSONAL');
assert(
  unsecuredRules.notApplicable.some((r) => r.code === 'COLLATERAL_DOCUMENTS'),
  'Unsecured personal loan must mark collateral as not applicable'
);

const securedRules = calculateApplicableDocuments('SALARIED', 'SECURED');
assert(
  securedRules.mandatory.some((r) => r.code === 'PROPERTY_DEED'),
  'Secured home/LAP loan must require PROPERTY_DEED'
);

// ---------------------------------------------------------------------------
// TEST 6: Dynamic Transition (Salaried -> Self-Employed preserves docs)
// ---------------------------------------------------------------------------
const existingDocs = [
  { category: 'IDENTITY_PROOF', documentType: 'PAN_CARD' },
  { category: 'ADDRESS_PROOF', documentType: 'AADHAAR' },
  { category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO' },
  { category: 'INCOME_PROOF', documentType: 'SALARY_SLIP' },
];
// When evaluated as Salaried, missing bank statement
const checkAsSalaried = validateCustomerDocumentFulfillment(existingDocs, 'SALARIED');
assert(checkAsSalaried.missingCodes.includes('BANK_STATEMENTS'), 'Salaried missing bank statements');

// When switched to Self-Employed, does NOT complain about salary slip, but identifies ITR and Business Bank Stmt
const checkAsSelfEmployed = validateCustomerDocumentFulfillment(existingDocs, 'SELF_EMPLOYED');
assert(!checkAsSelfEmployed.missingCodes.includes('SALARY_SLIPS'), 'Switched to Self-Employed does NOT miss salary slips');
assert(checkAsSelfEmployed.missingCodes.includes('BUSINESS_ITR'), 'Switched to Self-Employed identifies missing ITR');
assert(checkAsSelfEmployed.missingCodes.includes('BUSINESS_BANK_STATEMENTS'), 'Switched to Self-Employed identifies missing Business Bank Stmts');

console.log(`\nTEST SUMMARY: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL DYNAMIC DOCUMENT ENGINE TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}
