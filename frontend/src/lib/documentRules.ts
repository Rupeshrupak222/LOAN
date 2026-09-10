/**
 * Client-side Dynamic Document Rules Engine
 * 
 * Provides dynamic document checklists, requirement calculation, and fulfillment validation
 * matching the LMS business policy rules.
 */

export type EmploymentType =
  | 'SALARIED'
  | 'SELF_EMPLOYED'
  | 'BUSINESS_OWNER'
  | 'BUSINESS'
  | 'PROFESSIONAL'
  | 'FREELANCER'
  | 'FARMER'
  | 'RETIRED'
  | 'HOMEMAKER'
  | 'STUDENT'
  | 'OTHER';

export type ProductType =
  | 'PERSONAL'
  | 'BUSINESS'
  | 'SECURED'
  | 'HOME_LOAN'
  | 'LAP'
  | 'VEHICLE'
  | 'EDUCATION'
  | 'GOLD'
  | string;

export type RequirementStatus = 'MANDATORY' | 'CONDITIONAL' | 'OPTIONAL' | 'NOT_APPLICABLE';

export interface DocumentRuleDefinition {
  code: string;
  category: string;
  defaultDocumentType: string;
  acceptedDocumentTypes: string[];
  name: string;
  description: string;
  status: RequirementStatus;
  conditionReason?: string;
  allowMultiple?: boolean;
}

export interface DynamicDocumentChecklist {
  employmentType: EmploymentType;
  productType: string;
  mandatory: DocumentRuleDefinition[];
  conditional: DocumentRuleDefinition[];
  optional: DocumentRuleDefinition[];
  notApplicable: DocumentRuleDefinition[];
  summary: {
    mandatoryCount: number;
    conditionalCount: number;
    optionalCount: number;
    notApplicableCount: number;
  };
}

export interface UploadedDocItem {
  id: string;
  category: string;
  documentType: string;
  documentName: string;
  description?: string;
  file: File;
  previewUrl?: string;
  ruleCode?: string;
}

export function normalizeEmploymentType(raw?: string | null): EmploymentType {
  if (!raw) return 'SALARIED';
  const clean = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (['SALARIED', 'SALARIED_EMPLOYEE', 'EMPLOYEE'].includes(clean)) return 'SALARIED';
  if (['SELF_EMPLOYED', 'SELFEMPLOYED', 'SELF_EMPLOYED_NON_PROFESSIONAL'].includes(clean)) return 'SELF_EMPLOYED';
  if (['BUSINESS', 'BUSINESS_OWNER', 'TRADER', 'MERCHANT', 'DIRECTOR', 'PARTNER'].includes(clean)) return 'BUSINESS_OWNER';
  if (['PROFESSIONAL', 'DOCTOR', 'LAWYER', 'CHARTERED_ACCOUNTANT', 'CA', 'ARCHITECT', 'CONSULTANT'].includes(clean)) return 'PROFESSIONAL';
  if (['FREELANCER', 'CONTRACTOR', 'GIG_WORKER', 'CONSULTING'].includes(clean)) return 'FREELANCER';
  if (['FARMER', 'AGRICULTURIST', 'AGRICULTURE'].includes(clean)) return 'FARMER';
  if (['RETIRED', 'PENSIONER'].includes(clean)) return 'RETIRED';
  if (['HOMEMAKER', 'HOUSEWIFE'].includes(clean)) return 'HOMEMAKER';
  if (['STUDENT'].includes(clean)) return 'STUDENT';
  return 'OTHER';
}

export function normalizeProductType(raw?: string | null): ProductType {
  if (!raw) return 'PERSONAL';
  const clean = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (['SECURED', 'HOME', 'HOME_LOAN', 'HOUSING', 'LAP', 'PROPERTY', 'MORTGAGE'].includes(clean)) return 'SECURED';
  if (['BUSINESS', 'MSME', 'COMMERCIAL', 'SME'].includes(clean)) return 'BUSINESS';
  if (['VEHICLE', 'AUTO', 'CAR', 'TWO_WHEELER'].includes(clean)) return 'VEHICLE';
  if (['EDUCATION', 'STUDENT_LOAN'].includes(clean)) return 'EDUCATION';
  if (['GOLD', 'JEWELLERY'].includes(clean)) return 'GOLD';
  return 'PERSONAL';
}

export function calculateApplicableDocuments(
  employmentTypeRaw?: string | null,
  productTypeRaw?: string | null,
  context: { monthlyIncome?: number; requestedAmount?: number } = {}
): DynamicDocumentChecklist {
  const empType = normalizeEmploymentType(employmentTypeRaw);
  const prodType = normalizeProductType(productTypeRaw);

  const mandatory: DocumentRuleDefinition[] = [];
  const conditional: DocumentRuleDefinition[] = [];
  const optional: DocumentRuleDefinition[] = [];
  const notApplicable: DocumentRuleDefinition[] = [];

  // 1. BASE IDENTITY & ADDRESS PROOF (Universal)
  mandatory.push({
    code: 'IDENTITY_PROOF',
    category: 'IDENTITY_PROOF',
    defaultDocumentType: 'PAN_CARD',
    acceptedDocumentTypes: ['PAN_CARD', 'AADHAAR', 'AADHAAR_FRONT', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE'],
    name: 'Proof of Identity (PoI)',
    description: 'Government issued photo ID (PAN Card, Aadhaar, Passport, Voter ID, Driving License)',
    status: 'MANDATORY',
    allowMultiple: true,
  });

  mandatory.push({
    code: 'ADDRESS_PROOF',
    category: 'ADDRESS_PROOF',
    defaultDocumentType: 'AADHAAR',
    acceptedDocumentTypes: ['AADHAAR', 'ELECTRICITY_BILL', 'RENT_AGREEMENT', 'UTILITY_BILL', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE'],
    name: 'Proof of Address (PoA)',
    description: 'Current residential address proof (Aadhaar, Electricity Bill, Rent Agreement, Passport)',
    status: 'MANDATORY',
    allowMultiple: true,
  });

  mandatory.push({
    code: 'APPLICANT_PHOTO',
    category: 'APPLICANT_PHOTO',
    defaultDocumentType: 'CUSTOMER_SELFIE_PHOTO',
    acceptedDocumentTypes: ['CUSTOMER_SELFIE_PHOTO', 'APPLICANT_PHOTO', 'PASSPORT_PHOTO'],
    name: 'Applicant Photograph / Live Selfie',
    description: 'Recent passport-size photograph or live verified portrait selfie',
    status: 'MANDATORY',
    allowMultiple: false,
  });

  // 2. EMPLOYMENT & INCOME PROOFS
  switch (empType) {
    case 'SALARIED': {
      mandatory.push({
        code: 'SALARY_SLIPS',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'SALARY_SLIP',
        acceptedDocumentTypes: ['SALARY_SLIP', 'SALARY_CERTIFICATE', 'PAY_SLIP'],
        name: 'Salary Slips (Last 3 Months)',
        description: 'Official monthly payslips issued by employer with earnings & deductions breakdown',
        status: 'MANDATORY',
        allowMultiple: true,
      });

      mandatory.push({
        code: 'BANK_STATEMENTS',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'BANK_STATEMENT',
        acceptedDocumentTypes: ['BANK_STATEMENT', 'SALARY_BANK_STATEMENT', 'SAVINGS_BANK_STATEMENT'],
        name: 'Salary Bank Account Statement (Last 3–6 Months)',
        description: 'Bank statements showing recurring salary credit entries from employer',
        status: 'MANDATORY',
        allowMultiple: true,
      });

      conditional.push({
        code: 'FORM_16',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'FORM_16',
        acceptedDocumentTypes: ['FORM_16', 'FORM_16A', 'TDS_CERTIFICATE', 'TAX_CERTIFICATE'],
        name: 'Form 16 / TDS Certificate',
        description: 'Employer Form 16 Part A & B for latest financial year',
        status: 'CONDITIONAL',
        conditionReason: (context.monthlyIncome && context.monthlyIncome >= 50000) || (context.requestedAmount && context.requestedAmount >= 500000)
          ? 'Required: Monthly income exceeds ₹50,000 or loan amount exceeds ₹5,00,000'
          : 'Conditional: Recommended for higher credit sanction or fast-track underwriting',
        allowMultiple: true,
      });

      optional.push({
        code: 'EMPLOYMENT_PROOF',
        category: 'EMPLOYMENT_PROOF',
        defaultDocumentType: 'EMPLOYER_ID_CARD',
        acceptedDocumentTypes: ['EMPLOYER_ID_CARD', 'OFFER_LETTER', 'APPOINTMENT_LETTER', 'EXPERIENCE_LETTER'],
        name: 'Employee ID Card / Appointment Letter',
        description: 'Corporate employee badge or official appointment letter',
        status: 'OPTIONAL',
        allowMultiple: true,
      });

      notApplicable.push(
        {
          code: 'BUSINESS_ITR',
          category: 'INCOME_PROOF',
          defaultDocumentType: 'ITR',
          acceptedDocumentTypes: ['ITR'],
          name: 'Business ITR with Computation',
          description: 'Not applicable for Salaried applicants',
          status: 'NOT_APPLICABLE',
        },
        {
          code: 'BUSINESS_REGISTRATION',
          category: 'BUSINESS_PROOF',
          defaultDocumentType: 'GST_CERTIFICATE',
          acceptedDocumentTypes: ['GST_CERTIFICATE'],
          name: 'Business Registration / GST',
          description: 'Not applicable for Salaried applicants',
          status: 'NOT_APPLICABLE',
        },
        {
          code: 'PL_STATEMENT',
          category: 'INCOME_PROOF',
          defaultDocumentType: 'AUDITED_FINANCIALS',
          acceptedDocumentTypes: ['AUDITED_FINANCIALS'],
          name: 'Profit & Loss Statement / Balance Sheet',
          description: 'Not applicable for Salaried applicants',
          status: 'NOT_APPLICABLE',
        }
      );
      break;
    }

    case 'SELF_EMPLOYED':
    case 'BUSINESS_OWNER':
    case 'BUSINESS': {
      mandatory.push({
        code: 'BUSINESS_ITR',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'ITR',
        acceptedDocumentTypes: ['ITR', 'ITR_ACKNOWLEDGEMENT', 'ITR_COMPUTATION'],
        name: 'ITR with Computation of Income (Last 2 Years)',
        description: 'Income Tax Return acknowledgements with computation schedules for previous 2 Assessment Years',
        status: 'MANDATORY',
        allowMultiple: true,
      });

      mandatory.push({
        code: 'BUSINESS_BANK_STATEMENTS',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'BANK_STATEMENT',
        acceptedDocumentTypes: ['BUSINESS_BANK_STATEMENT', 'BANK_STATEMENT', 'CURRENT_ACCOUNT_STATEMENT'],
        name: 'Business Current / Operating Bank Statement (Last 6–12 Months)',
        description: 'Operating bank statements showing business turnover and customer credits',
        status: 'MANDATORY',
        allowMultiple: true,
      });

      conditional.push({
        code: 'BUSINESS_REGISTRATION',
        category: 'BUSINESS_PROOF',
        defaultDocumentType: 'GST_CERTIFICATE',
        acceptedDocumentTypes: ['GST_CERTIFICATE', 'SHOP_ACT', 'UDYAM_REGISTRATION', 'INCORPORATION_CERTIFICATE', 'PARTNERSHIP_DEED', 'TRADE_LICENSE'],
        name: 'Business Registration / GST Certificate',
        description: 'GST Certificate, Udyam MSME, Shop & Establishment Act, or Certificate of Incorporation',
        status: 'CONDITIONAL',
        conditionReason: 'Required for business entity verification and turnover validation',
        allowMultiple: true,
      });

      conditional.push({
        code: 'PL_STATEMENT',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'AUDITED_FINANCIALS',
        acceptedDocumentTypes: ['AUDITED_FINANCIALS', 'PL_STATEMENT', 'BALANCE_SHEET', 'CA_AUDIT_REPORT'],
        name: 'Audited Financials / P&L & Balance Sheet',
        description: 'CA-certified Profit & Loss statements and Balance Sheets',
        status: 'CONDITIONAL',
        conditionReason: (context.requestedAmount && context.requestedAmount >= 1000000)
          ? 'Required: Requested loan exceeds ₹10,00,000'
          : 'Conditional: Required for high-ticket business credit lines',
        allowMultiple: true,
      });

      notApplicable.push(
        {
          code: 'SALARY_SLIPS',
          category: 'INCOME_PROOF',
          defaultDocumentType: 'SALARY_SLIP',
          acceptedDocumentTypes: ['SALARY_SLIP'],
          name: 'Salary Slips',
          description: 'Not applicable for Self-Employed / Business Owners',
          status: 'NOT_APPLICABLE',
        },
        {
          code: 'FORM_16',
          category: 'INCOME_PROOF',
          defaultDocumentType: 'FORM_16',
          acceptedDocumentTypes: ['FORM_16'],
          name: 'Form 16',
          description: 'Not applicable for Self-Employed / Business Owners',
          status: 'NOT_APPLICABLE',
        }
      );
      break;
    }

    case 'PROFESSIONAL': {
      mandatory.push({
        code: 'PROFESSIONAL_DEGREE',
        category: 'EMPLOYMENT_PROOF',
        defaultDocumentType: 'PROFESSIONAL_CERTIFICATE',
        acceptedDocumentTypes: ['PROFESSIONAL_CERTIFICATE', 'DEGREE_CERTIFICATE', 'COP_CERTIFICATE', 'BAR_COUNCIL_ID', 'MEDICAL_REGISTRATION', 'ICAI_COP'],
        name: 'Professional Degree / Certificate of Practice',
        description: 'Medical Council, Bar Council, ICAI COP, or Professional Degree Certificate',
        status: 'MANDATORY',
        allowMultiple: true,
      });

      mandatory.push({
        code: 'BANK_STATEMENTS',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'BANK_STATEMENT',
        acceptedDocumentTypes: ['BANK_STATEMENT', 'SAVINGS_BANK_STATEMENT', 'CURRENT_ACCOUNT_STATEMENT'],
        name: 'Professional Bank Statement (Last 6 Months)',
        description: 'Bank statements showing professional practice consultation fees or earnings',
        status: 'MANDATORY',
        allowMultiple: true,
      });

      mandatory.push({
        code: 'BUSINESS_ITR',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'ITR',
        acceptedDocumentTypes: ['ITR', 'ITR_ACKNOWLEDGEMENT', 'ITR_COMPUTATION'],
        name: 'ITR with Computation (Last 2 Years)',
        description: 'Income Tax Return with professional income schedules',
        status: 'MANDATORY',
        allowMultiple: true,
      });

      conditional.push({
        code: 'FORM_26AS',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'FORM_26AS',
        acceptedDocumentTypes: ['FORM_26AS', 'AIS_TIS', 'TDS_CERTIFICATE'],
        name: 'Form 26AS / Annual Information Statement (AIS)',
        description: 'Tax deducted at source (TDS 194J) on professional consultation fees',
        status: 'CONDITIONAL',
        allowMultiple: true,
      });

      notApplicable.push(
        {
          code: 'SALARY_SLIPS',
          category: 'INCOME_PROOF',
          defaultDocumentType: 'SALARY_SLIP',
          acceptedDocumentTypes: ['SALARY_SLIP'],
          name: 'Salary Slips',
          description: 'Not applicable for Independent Professionals',
          status: 'NOT_APPLICABLE',
        },
        {
          code: 'FORM_16',
          category: 'INCOME_PROOF',
          defaultDocumentType: 'FORM_16',
          acceptedDocumentTypes: ['FORM_16'],
          name: 'Form 16',
          description: 'Not applicable for Independent Professionals',
          status: 'NOT_APPLICABLE',
        }
      );
      break;
    }

    case 'FREELANCER': {
      mandatory.push({
        code: 'BANK_STATEMENTS',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'BANK_STATEMENT',
        acceptedDocumentTypes: ['BANK_STATEMENT', 'SAVINGS_BANK_STATEMENT'],
        name: 'Bank Statements (Last 6 Months)',
        description: 'Bank statements demonstrating recurring client remittances, wire transfers, or freelance payouts',
        status: 'MANDATORY',
        allowMultiple: true,
      });

      conditional.push({
        code: 'BUSINESS_ITR',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'ITR',
        acceptedDocumentTypes: ['ITR', 'ITR_ACKNOWLEDGEMENT', 'ITR_COMPUTATION'],
        name: 'ITR (Last 1–2 Years)',
        description: 'Income Tax Return filed under 44ADA or regular business schedule',
        status: 'CONDITIONAL',
        conditionReason: 'Recommended for validating annual freelance gross turnover',
        allowMultiple: true,
      });

      conditional.push({
        code: 'CLIENT_CONTRACTS',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'CONTRACT_AGREEMENT',
        acceptedDocumentTypes: ['CONTRACT_AGREEMENT', 'CLIENT_INVOICES', 'SERVICE_AGREEMENT', 'WORK_ORDER'],
        name: 'Active Client Contracts / Invoices',
        description: 'Current retainer agreements, purchase orders, or invoice receipts',
        status: 'CONDITIONAL',
        allowMultiple: true,
      });

      notApplicable.push(
        {
          code: 'SALARY_SLIPS',
          category: 'INCOME_PROOF',
          defaultDocumentType: 'SALARY_SLIP',
          acceptedDocumentTypes: ['SALARY_SLIP'],
          name: 'Salary Slips',
          description: 'Not applicable for Freelancers / Gig Workers',
          status: 'NOT_APPLICABLE',
        },
        {
          code: 'FORM_16',
          category: 'INCOME_PROOF',
          defaultDocumentType: 'FORM_16',
          acceptedDocumentTypes: ['FORM_16'],
          name: 'Form 16',
          description: 'Not applicable for Freelancers',
          status: 'NOT_APPLICABLE',
        }
      );
      break;
    }

    case 'FARMER': {
      mandatory.push({
        code: 'LAND_OWNERSHIP',
        category: 'PROPERTY_PROOF',
        defaultDocumentType: '7_12_EXTRACT',
        acceptedDocumentTypes: ['7_12_EXTRACT', 'KHASRA_KHATAUNI', 'PATTA_PASSBOOK', 'AGRICULTURAL_LAND_TITLE'],
        name: 'Land Ownership Document (7/12 Extract / Khasra-Khatauni)',
        description: 'Revenue land holding records or Kisan Passbook confirming cultivable acreage',
        status: 'MANDATORY',
        allowMultiple: true,
      });

      mandatory.push({
        code: 'BANK_STATEMENTS',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'BANK_STATEMENT',
        acceptedDocumentTypes: ['BANK_STATEMENT', 'KCC_BANK_STATEMENT', 'SAVINGS_BANK_STATEMENT'],
        name: 'Bank Statement / Kisan Credit Card Account (Last 6–12 Months)',
        description: 'Bank statements reflecting agricultural cash flows and harvest credits',
        status: 'MANDATORY',
        allowMultiple: true,
      });

      conditional.push({
        code: 'MANDI_RECEIPTS',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'MANDI_RECEIPT',
        acceptedDocumentTypes: ['MANDI_RECEIPT', 'J_FORM', 'CROP_SALE_RECEIPT'],
        name: 'Mandi Sale Receipts / J-Forms',
        description: 'Agricultural produce marketing committee receipts from crop sales',
        status: 'CONDITIONAL',
        allowMultiple: true,
      });

      notApplicable.push(
        {
          code: 'SALARY_SLIPS',
          category: 'INCOME_PROOF',
          defaultDocumentType: 'SALARY_SLIP',
          acceptedDocumentTypes: ['SALARY_SLIP'],
          name: 'Salary Slips',
          description: 'Not applicable for Agricultural / Farmer applicants',
          status: 'NOT_APPLICABLE',
        },
        {
          code: 'FORM_16',
          category: 'INCOME_PROOF',
          defaultDocumentType: 'FORM_16',
          acceptedDocumentTypes: ['FORM_16'],
          name: 'Form 16',
          description: 'Not applicable for Agricultural income',
          status: 'NOT_APPLICABLE',
        }
      );
      break;
    }

    case 'RETIRED': {
      mandatory.push({
        code: 'PENSION_PROOF',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'PPO_ORDER',
        acceptedDocumentTypes: ['PPO_ORDER', 'PENSION_BOOK', 'PENSION_CERTIFICATE', 'BANK_STATEMENT'],
        name: 'Pension Payment Order (PPO) / Pension Credit Statement',
        description: 'Official PPO document or bank statement showing monthly pension deposits',
        status: 'MANDATORY',
        allowMultiple: true,
      });

      conditional.push({
        code: 'FORM_16A_INVESTMENTS',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'FORM_16A',
        acceptedDocumentTypes: ['FORM_16A', 'FD_INTEREST_CERTIFICATE', 'ANNUITY_STATEMENT'],
        name: 'Form 16A / Fixed Deposit & Annuity Certificates',
        description: 'Interest and dividend income certificates from bank fixed deposits or annuities',
        status: 'CONDITIONAL',
        allowMultiple: true,
      });

      notApplicable.push(
        {
          code: 'SALARY_SLIPS',
          category: 'INCOME_PROOF',
          defaultDocumentType: 'SALARY_SLIP',
          acceptedDocumentTypes: ['SALARY_SLIP'],
          name: 'Salary Slips',
          description: 'Not applicable for Retired pensioners',
          status: 'NOT_APPLICABLE',
        },
        {
          code: 'BUSINESS_REGISTRATION',
          category: 'BUSINESS_PROOF',
          defaultDocumentType: 'GST_CERTIFICATE',
          acceptedDocumentTypes: ['GST_CERTIFICATE'],
          name: 'Business Registration',
          description: 'Not applicable for Retired individuals',
          status: 'NOT_APPLICABLE',
        }
      );
      break;
    }

    case 'HOMEMAKER':
    case 'STUDENT': {
      conditional.push({
        code: 'CO_APPLICANT_KYC',
        category: 'CO_APPLICANT',
        defaultDocumentType: 'CO_APPLICANT_PAN',
        acceptedDocumentTypes: ['CO_APPLICANT_PAN', 'CO_APPLICANT_AADHAAR', 'CO_APPLICANT_KYC'],
        name: 'Co-Applicant / Guarantor KYC Proof',
        description: 'Primary identity and address proof of earning spouse, parent, or sponsor',
        status: 'CONDITIONAL',
        conditionReason: 'Required: Earning co-applicant or guarantor required to sponsor the credit facility',
        allowMultiple: true,
      });

      conditional.push({
        code: 'CO_APPLICANT_INCOME',
        category: 'CO_APPLICANT',
        defaultDocumentType: 'CO_APPLICANT_BANK_STATEMENT',
        acceptedDocumentTypes: ['CO_APPLICANT_BANK_STATEMENT', 'CO_APPLICANT_SALARY_SLIP', 'CO_APPLICANT_ITR'],
        name: 'Co-Applicant / Sponsor Income Proof',
        description: 'Salary slips, bank statements, or ITR of the earning sponsor/guarantor',
        status: 'CONDITIONAL',
        conditionReason: 'Required: Income proof of the sponsoring family member',
        allowMultiple: true,
      });

      if (empType === 'STUDENT') {
        optional.push({
          code: 'STUDENT_ID_PROOF',
          category: 'EMPLOYMENT_PROOF',
          defaultDocumentType: 'STUDENT_ID',
          acceptedDocumentTypes: ['STUDENT_ID', 'COLLEGE_ID', 'ADMISSION_LETTER'],
          name: 'Student ID / University Admission Letter',
          description: 'Valid college identification card or course admission letter',
          status: 'OPTIONAL',
          allowMultiple: false,
        });
      }

      notApplicable.push(
        {
          code: 'SALARY_SLIPS',
          category: 'INCOME_PROOF',
          defaultDocumentType: 'SALARY_SLIP',
          acceptedDocumentTypes: ['SALARY_SLIP'],
          name: 'Self Salary Slips',
          description: `Not applicable for ${empType === 'STUDENT' ? 'Students' : 'Homemakers'} (Co-applicant income used)`,
          status: 'NOT_APPLICABLE',
        },
        {
          code: 'FORM_16',
          category: 'INCOME_PROOF',
          defaultDocumentType: 'FORM_16',
          acceptedDocumentTypes: ['FORM_16'],
          name: 'Self Form 16',
          description: 'Not applicable',
          status: 'NOT_APPLICABLE',
        },
        {
          code: 'BUSINESS_REGISTRATION',
          category: 'BUSINESS_PROOF',
          defaultDocumentType: 'GST_CERTIFICATE',
          acceptedDocumentTypes: ['GST_CERTIFICATE'],
          name: 'Business Registration',
          description: 'Not applicable',
          status: 'NOT_APPLICABLE',
        }
      );
      break;
    }

    default: {
      mandatory.push({
        code: 'BANK_STATEMENTS',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'BANK_STATEMENT',
        acceptedDocumentTypes: ['BANK_STATEMENT', 'SAVINGS_BANK_STATEMENT'],
        name: 'Bank Account Statements (Last 6 Months)',
        description: 'Bank statements reflecting active banking transactions and verified balance',
        status: 'MANDATORY',
        allowMultiple: true,
      });

      conditional.push({
        code: 'INCOME_AFFIDAVIT',
        category: 'INCOME_PROOF',
        defaultDocumentType: 'INCOME_DECLARATION',
        acceptedDocumentTypes: ['INCOME_DECLARATION', 'AFFIDAVIT', 'PROOF_OF_INCOME'],
        name: 'Income Declaration / Supporting Evidence',
        description: 'Self-declaration affidavit or evidence of alternative earnings',
        status: 'CONDITIONAL',
        allowMultiple: true,
      });
      break;
    }
  }

  // 3. LOAN PRODUCT SPECIFIC REQUIREMENTS
  if (['SECURED', 'HOME_LOAN', 'LAP'].includes(prodType)) {
    mandatory.push({
      code: 'PROPERTY_DEED',
      category: 'COLLATERAL_PROOF',
      defaultDocumentType: 'TITLE_DEED',
      acceptedDocumentTypes: ['TITLE_DEED', 'SALE_DEED', 'CONVEYANCE_DEED', 'REGISTERED_LEASE_DEED', 'PROPERTY_PAPERS'],
      name: 'Property Title Deed / Registered Sale Deed',
      description: 'Chain of title deeds, registered sale deed, or conveyance deed of the mortgaged property',
      status: 'MANDATORY',
      allowMultiple: true,
    });

    conditional.push({
      code: 'PROPERTY_TAX_RECEIPT',
      category: 'COLLATERAL_PROOF',
      defaultDocumentType: 'PROPERTY_TAX_RECEIPT',
      acceptedDocumentTypes: ['PROPERTY_TAX_RECEIPT', 'KHATA_CERTIFICATE', 'ELECTRICITY_BILL_PROPERTY', 'SANCTION_PLAN'],
      name: 'Latest Property Tax Paid Receipt / Khata Extract',
      description: 'Municipal corporation property tax receipt or approved building sanction plan',
      status: 'CONDITIONAL',
      conditionReason: 'Required for title search and technical property valuation',
      allowMultiple: true,
    });
  } else if (prodType === 'VEHICLE') {
    mandatory.push({
      code: 'VEHICLE_QUOTATION_RC',
      category: 'COLLATERAL_PROOF',
      defaultDocumentType: 'VEHICLE_QUOTATION',
      acceptedDocumentTypes: ['VEHICLE_QUOTATION', 'PROFORMA_INVOICE', 'VEHICLE_RC', 'REGISTRATION_CERTIFICATE'],
      name: 'Vehicle Proforma Invoice / Registration Certificate (RC)',
      description: 'Dealer proforma quotation (for new vehicle) or RC book (for pre-owned vehicle)',
      status: 'MANDATORY',
      allowMultiple: true,
    });

    mandatory.push({
      code: 'DRIVING_LICENSE',
      category: 'IDENTITY_PROOF',
      defaultDocumentType: 'DRIVING_LICENSE',
      acceptedDocumentTypes: ['DRIVING_LICENSE'],
      name: 'Valid Driving License',
      description: 'Valid Indian Driving License of the vehicle applicant',
      status: 'MANDATORY',
      allowMultiple: false,
    });
  } else if (prodType === 'GOLD') {
    mandatory.push({
      code: 'GOLD_PURITY_ASSAY',
      category: 'COLLATERAL_PROOF',
      defaultDocumentType: 'GOLD_APPRAISAL_REPORT',
      acceptedDocumentTypes: ['GOLD_APPRAISAL_REPORT', 'PURITY_CERTIFICATE', 'JEWELLERY_INVOICE'],
      name: 'Gold Appraisal / Purity Valuation Certificate',
      description: 'Certified assayer appraisal report detailing gross weight, net weight, and carat purity',
      status: 'MANDATORY',
      allowMultiple: true,
    });
  } else {
    notApplicable.push({
      code: 'COLLATERAL_DOCUMENTS',
      category: 'COLLATERAL_PROOF',
      defaultDocumentType: 'PROPERTY_PAPERS',
      acceptedDocumentTypes: ['PROPERTY_PAPERS', 'TITLE_DEED', 'VEHICLE_RC'],
      name: 'Collateral / Property Papers',
      description: 'Not applicable for Unsecured Personal Loans',
      status: 'NOT_APPLICABLE',
    });
  }

  return {
    employmentType: empType,
    productType: prodType,
    mandatory,
    conditional,
    optional,
    notApplicable,
    summary: {
      mandatoryCount: mandatory.length,
      conditionalCount: conditional.length,
      optionalCount: optional.length,
      notApplicableCount: notApplicable.length,
    },
  };
}

/**
 * Checks which mandatory rules are satisfied by the current uploaded documents
 */
export function evaluateDocumentFulfillment(
  uploadedDocuments: UploadedDocItem[],
  employmentTypeRaw?: string | null,
  productTypeRaw?: string | null,
  context: { monthlyIncome?: number; requestedAmount?: number } = {}
) {
  const rules = calculateApplicableDocuments(employmentTypeRaw, productTypeRaw, context);
  const docs = Array.isArray(uploadedDocuments) ? uploadedDocuments : [];

  const missingCodes: string[] = [];
  const missingNames: string[] = [];

  const checklistStatus = rules.mandatory.map((rule) => {
    const matchingDocs = docs.filter((d) => {
      const docCategory = (d.category || '').toUpperCase().trim();
      const docType = (d.documentType || '').toUpperCase().trim();
      const docName = (d.documentName || '').toUpperCase().trim();

      if (d.ruleCode && d.ruleCode === rule.code) return true;

      const matchesAcceptedType = rule.acceptedDocumentTypes.some((type) => {
        const t = type.toUpperCase();
        return docType === t || docType.includes(t) || docName.includes(t);
      });

      if (matchesAcceptedType) return true;

      if (docType === rule.code || docName === rule.code || docType.includes(rule.code)) {
        return true;
      }

      if (['APPLICANT_PHOTO', 'IDENTITY_PROOF', 'ADDRESS_PROOF', 'PROPERTY_PROOF', 'COLLATERAL_PROOF'].includes(rule.category)) {
        if (docCategory === rule.category.toUpperCase() && !docType.includes('INCOME') && !docType.includes('BANK')) {
          return true;
        }
      }

      return false;
    });

    const isSatisfied = matchingDocs.length > 0;
    if (!isSatisfied) {
      missingCodes.push(rule.code);
      missingNames.push(rule.name);
    }

    return {
      rule,
      isSatisfied,
      matchingDocs,
    };
  });

  const isComplete = missingCodes.length === 0;

  return {
    isComplete,
    mandatoryCount: rules.mandatory.length,
    uploadedCount: rules.mandatory.length - missingCodes.length,
    missingCodes,
    missingNames,
    checklistStatus,
    rules,
  };
}
