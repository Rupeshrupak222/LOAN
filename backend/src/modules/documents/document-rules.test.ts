import { describe, it, expect } from 'vitest';
import {
  calculateApplicableDocuments,
  validateCustomerDocumentFulfillment,
  normalizeEmploymentType,
  normalizeProductType,
} from './document-rules';

describe('Phase 8: Dynamic Document Rules Engine', () => {
  it('should validate salaried customer mandatory and conditional documents', () => {
    const salariedRules = calculateApplicableDocuments('SALARIED', 'PERSONAL');
    expect(salariedRules.mandatory.some((r) => r.code === 'SALARY_SLIPS')).toBe(true);
    expect(salariedRules.mandatory.some((r) => r.code === 'BANK_STATEMENTS')).toBe(true);
    expect(salariedRules.conditional.some((r) => r.code === 'FORM_16')).toBe(true);
    expect(salariedRules.notApplicable.some((r) => r.code === 'BUSINESS_ITR')).toBe(true);

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
    expect(salariedIncomplete.isComplete).toBe(false);
    expect(salariedIncomplete.missingCodes).toContain('SALARY_SLIPS');

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
    expect(salariedComplete.isComplete).toBe(true);
    expect(salariedComplete.missingCodes).toHaveLength(0);
  });

  it('should validate self-employed customer documents', () => {
    const selfEmployedRules = calculateApplicableDocuments('SELF_EMPLOYED', 'BUSINESS');
    expect(selfEmployedRules.mandatory.some((r) => r.code === 'BUSINESS_ITR')).toBe(true);
    expect(selfEmployedRules.mandatory.some((r) => r.code === 'BUSINESS_BANK_STATEMENTS')).toBe(true);
    expect(selfEmployedRules.notApplicable.some((r) => r.code === 'SALARY_SLIPS')).toBe(true);

    const selfEmployedIncomplete = validateCustomerDocumentFulfillment(
      [
        { category: 'IDENTITY_PROOF', documentType: 'PAN_CARD' },
        { category: 'ADDRESS_PROOF', documentType: 'AADHAAR' },
        { category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO' },
        { category: 'INCOME_PROOF', documentType: 'BANK_STATEMENT' },
      ],
      'SELF_EMPLOYED',
      'BUSINESS'
    );
    expect(selfEmployedIncomplete.isComplete).toBe(false);
    expect(selfEmployedIncomplete.missingCodes).toContain('BUSINESS_ITR');

    const selfEmployedComplete = validateCustomerDocumentFulfillment(
      [
        { category: 'IDENTITY_PROOF', documentType: 'PAN_CARD' },
        { category: 'ADDRESS_PROOF', documentType: 'AADHAAR' },
        { category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO' },
        { category: 'INCOME_PROOF', documentType: 'ITR_V' },
        { category: 'INCOME_PROOF', documentType: 'BANK_STATEMENT' },
      ],
      'SELF_EMPLOYED',
      'BUSINESS'
    );
    expect(selfEmployedComplete.isComplete).toBe(true);
    expect(selfEmployedComplete.missingCodes).toHaveLength(0);
  });

  it('should validate occupational document variations', () => {
    const profRules = calculateApplicableDocuments('PROFESSIONAL', 'PERSONAL');
    expect(profRules.mandatory.some((r) => r.code === 'PROFESSIONAL_DEGREE')).toBe(true);
    expect(profRules.mandatory.some((r) => r.code === 'SALARY_SLIPS')).toBe(false);

    const freelancerRules = calculateApplicableDocuments('FREELANCER', 'PERSONAL');
    expect(freelancerRules.mandatory.some((r) => r.code === 'SALARY_SLIPS')).toBe(false);

    const retiredRules = calculateApplicableDocuments('RETIRED', 'PERSONAL');
    expect(retiredRules.mandatory.some((r) => r.code === 'PENSION_PROOF')).toBe(true);

    const homemakerRules = calculateApplicableDocuments('HOMEMAKER', 'PERSONAL');
    expect(homemakerRules.notApplicable.some((r) => r.code === 'SALARY_SLIPS')).toBe(true);
  });
});
