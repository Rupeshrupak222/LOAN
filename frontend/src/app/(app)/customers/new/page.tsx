'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  MapPin,
  Cloud,
  UploadCloud,
  Briefcase,
  Landmark,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Lock,
  Trash2,
  Plus,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Check,
  Building2,
  Info,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Input } from '@/components/ui';
import { CustomerOnboardingStepper, StepItem } from '@/components/CustomerOnboardingStepper';
import {
  EmploymentType,
  ProductType,
  DocumentRuleDefinition,
  UploadedDocItem,
  calculateApplicableDocuments,
  evaluateDocumentFulfillment,
  normalizeEmploymentType,
  normalizeProductType,
} from '@/lib/documentRules';
import { cn } from '@/lib/utils';

const STEPS: StepItem[] = [
  {
    id: 1,
    shortLabel: '1. Personal',
    label: 'Personal & Profile',
    icon: User,
    description: 'Basic personal details, employment classification & portal password',
  },
  {
    id: 2,
    shortLabel: '2. Location',
    label: 'Geographic Location',
    icon: MapPin,
    description: 'Residential address and pin code',
  },
  {
    id: 3,
    shortLabel: '3. Documents',
    label: 'Dynamic Document Vault',
    icon: Cloud,
    description: 'Employment & product-specific mandatory KYC and income proofs',
  },
  {
    id: 4,
    shortLabel: '4. Employment',
    label: 'Employment & Income',
    icon: Briefcase,
    description: 'Employment details, organization, income, and liabilities',
  },
  {
    id: 5,
    shortLabel: '5. Bank Details',
    label: 'Bank Account Payout',
    icon: Landmark,
    description: 'Primary disbursement bank account and IFSC',
  },
  {
    id: 6,
    shortLabel: '6. Review & Save',
    label: 'Audit & Open 360',
    icon: ShieldCheck,
    description: 'Review intake data and open Customer 360 onboarding profile',
  },
];

const POPULAR_BANKS = [
  'HDFC Bank',
  'State Bank of India (SBI)',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank (PNB)',
  'Bank of Baroda',
  'IndusInd Bank',
  'Canara Bank',
  'Union Bank of India',
];

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi NCR',
  'Chandigarh',
  'Puducherry',
  'Jammu & Kashmir',
  'Ladakh',
];

const EMPLOYMENT_TYPES_CONFIG: { id: EmploymentType; label: string; badge: string; desc: string }[] = [
  { id: 'SALARIED', label: 'Salaried Employee', badge: 'Salary Slips & Bank Stmts', desc: 'Private sector, MNC, Govt, PSU employee' },
  { id: 'SELF_EMPLOYED', label: 'Self-Employed / Sole Prop', badge: 'ITR & Operating Stmts', desc: 'Sole proprietor, trader, shop owner, contractor' },
  { id: 'BUSINESS_OWNER', label: 'Business Owner / MSME', badge: 'ITR & GST Registration', desc: 'Registered enterprise, Pvt Ltd, LLP, Partnership' },
  { id: 'PROFESSIONAL', label: 'Self-Employed Professional', badge: 'Practice Cert & ITR', desc: 'Doctor, Chartered Accountant, Lawyer, Architect' },
  { id: 'FREELANCER', label: 'Freelancer / Gig Worker', badge: 'Bank Stmts & Contracts', desc: 'Independent consultant, digital creator, gig worker' },
  { id: 'FARMER', label: 'Farmer / Agriculturalist', badge: '7/12 Land Proof & Bank', desc: 'Agricultural income, crop cultivator, dairy/poultry' },
  { id: 'RETIRED', label: 'Retired / Pensioner', badge: 'Pension PPO & Stmts', desc: 'Govt / Defense / Corporate retired pensioner' },
  { id: 'HOMEMAKER', label: 'Homemaker', badge: 'Co-Applicant KYC & Income', desc: 'Household dependent backed by family co-applicant' },
  { id: 'STUDENT', label: 'Student', badge: 'College ID & Sponsor', desc: 'Full-time student sponsored by parent/guarantor' },
  { id: 'OTHER', label: 'Other Verified Income', badge: 'Bank Stmts & Affidavit', desc: 'Rental income, investments, or alternative earnings' },
];

const LOAN_PRODUCT_TYPES: { id: ProductType; label: string; desc: string }[] = [
  { id: 'PERSONAL', label: 'Unsecured Personal Loan', desc: 'No collateral required' },
  { id: 'BUSINESS', label: 'MSME Business Loan', desc: 'Working capital / equipment' },
  { id: 'SECURED', label: 'Home Loan / Property LAP', desc: 'Requires property title deed' },
  { id: 'VEHICLE', label: 'Vehicle / Auto Loan', desc: 'Requires vehicle quotation/RC' },
  { id: 'EDUCATION', label: 'Education Loan', desc: 'College / university fee financing' },
  { id: 'GOLD', label: 'Gold Loan', desc: 'Jewellery appraisal backed' },
];

export default function NewCustomerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const isBranchManagerOnly =
    user?.roles?.includes('BRANCH_MANAGER') &&
    !user?.roles?.some((r: string) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r));

  const isFinanceOfficerOnly =
    user?.roles?.includes('FINANCE_OFFICER') &&
    !user?.roles?.some((r: string) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER'].includes(r));

  const isCollectionOfficerOnly =
    user?.roles?.includes('COLLECTION_OFFICER') &&
    !user?.roles?.some((r: string) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER'].includes(r));

  useEffect(() => {
    if (isBranchManagerOnly) {
      router.replace('/branch-review');
    } else if (isFinanceOfficerOnly || isCollectionOfficerOnly) {
      router.replace('/dashboard');
    }
  }, [isBranchManagerOnly, isFinanceOfficerOnly, isCollectionOfficerOnly, router]);

  const isLoanOfficer = Boolean(
    user?.roles?.some((r: string) => ['LOAN_OFFICER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r))
  );

  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [form, setForm] = useState({
    // Step 1: Personal & Classification
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    password: '',
    dateOfBirth: '',
    gender: 'MALE',
    employmentType: 'SALARIED' as EmploymentType,
    intendedProductType: 'PERSONAL' as ProductType,

    // Step 2: Location
    addressLine: '',
    city: '',
    state: '',
    pincode: '',

    // Step 4: Employment Details
    employerName: '',
    designation: '',
    experienceYears: '',
    monthlyIncome: '',
    existingObligations: '',

    // Step 5: Bank Details
    bankName: '',
    accountHolderName: '',
    bankAccountNo: '',
    confirmBankAccountNo: '',
    bankIfsc: '',
    accountType: 'SAVINGS' as 'SAVINGS' | 'CURRENT' | 'SALARY',
  });

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showNotApplicableDocs, setShowNotApplicableDocs] = useState(false);

  // Unified Document Queue (Preserves all uploaded files across employment type changes!)
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocItem[]>([]);

  // "+ Add Other Document" modal state
  const [showOtherDocModal, setShowOtherDocModal] = useState(false);
  const [otherDocName, setOtherDocName] = useState('');
  const [otherDocCategory, setOtherDocCategory] = useState('OTHER');
  const [otherDocDesc, setOtherDocDesc] = useState('');
  const [otherDocFile, setOtherDocFile] = useState<File | null>(null);
  const [otherDocError, setOtherDocError] = useState<string | null>(null);

  // Errors & Navigation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState<string>('');

  // Refs for auto-focusing on invalid fields
  const fieldRefs = {
    firstName: useRef<HTMLInputElement>(null),
    lastName: useRef<HTMLInputElement>(null),
    mobile: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    dateOfBirth: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    addressLine: useRef<HTMLInputElement>(null),
    city: useRef<HTMLInputElement>(null),
    state: useRef<HTMLSelectElement>(null),
    pincode: useRef<HTMLInputElement>(null),
    employerName: useRef<HTMLInputElement>(null),
    designation: useRef<HTMLInputElement>(null),
    monthlyIncome: useRef<HTMLInputElement>(null),
    bankName: useRef<HTMLInputElement>(null),
    accountHolderName: useRef<HTMLInputElement>(null),
    bankAccountNo: useRef<HTMLInputElement>(null),
    confirmBankAccountNo: useRef<HTMLInputElement>(null),
    bankIfsc: useRef<HTMLInputElement>(null),
  };

  // Field change handler with validation clearance
  function update(key: keyof typeof form, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  }

  // Sanitized Mobile Input Handler (Strict 10 Digits)
  function handleMobileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    update('mobile', raw);
  }

  // Sanitized Pincode Input Handler (Strict 6 Digits)
  function handlePincodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
    update('pincode', raw);
  }

  // Sanitized Bank Account Handler (Digits Only, max 20)
  function handleBankAccountChange(key: 'bankAccountNo' | 'confirmBankAccountNo', val: string) {
    const raw = val.replace(/\D/g, '').slice(0, 20);
    update(key, raw);
  }

  // Sanitized IFSC Code Handler (11 chars uppercase alphanumeric)
  function handleIfscChange(val: string) {
    const raw = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    update('bankIfsc', raw);
  }

  // Automatically sync account holder name when customer first/last name changes
  useEffect(() => {
    if (!form.accountHolderName && (form.firstName || form.lastName)) {
      setForm((prev) => ({
        ...prev,
        accountHolderName: `${prev.firstName} ${prev.lastName}`.trim(),
      }));
    }
  }, [form.firstName, form.lastName, form.accountHolderName]);

  // Dynamic Document Fulfillment Evaluation (Recalculates instantly when employmentType or product changes)
  const docEvaluation = useMemo(() => {
    return evaluateDocumentFulfillment(uploadedDocs, form.employmentType, form.intendedProductType, {
      monthlyIncome: Number(form.monthlyIncome) || undefined,
    });
  }, [uploadedDocs, form.employmentType, form.intendedProductType, form.monthlyIncome]);

  const { mandatory, conditional, optional, notApplicable } = docEvaluation.rules;
  const isStep3DocsComplete = docEvaluation.isComplete;

  // Add / Attach File to a Specific Rule Slot
  function handleAttachFileToRule(rule: DocumentRuleDefinition, file: File) {
    const newDoc: UploadedDocItem = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      category: rule.category,
      documentType: rule.defaultDocumentType,
      documentName: rule.name,
      ruleCode: rule.code,
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    };

    if (!rule.allowMultiple) {
      // Replace existing file for single-file slot (like photo)
      setUploadedDocs((prev) => [
        ...prev.filter((d) => d.ruleCode !== rule.code && d.category !== rule.category),
        newDoc,
      ]);
    } else {
      setUploadedDocs((prev) => [...prev, newDoc]);
    }
  }

  // Remove File from Queue
  function handleRemoveDoc(id: string) {
    setUploadedDocs((prev) => prev.filter((d) => d.id !== id));
  }

  // Add Custom Document Handler
  function handleAddOtherDoc() {
    setOtherDocError(null);
    if (!otherDocName.trim()) {
      setOtherDocError('Document title / name is required');
      return;
    }
    if (!otherDocFile) {
      setOtherDocError('Please select a file to upload');
      return;
    }

    const newDoc: UploadedDocItem = {
      id: `other_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      category: otherDocCategory,
      documentType: 'OTHER_SUPPORTING_DOC',
      documentName: otherDocName.trim(),
      description: otherDocDesc.trim() || undefined,
      file: otherDocFile,
      previewUrl: otherDocFile.type.startsWith('image/') ? URL.createObjectURL(otherDocFile) : undefined,
    };

    setUploadedDocs((prev) => [...prev, newDoc]);
    setOtherDocName('');
    setOtherDocDesc('');
    setOtherDocFile(null);
    setShowOtherDocModal(false);
  }

  // Step Completion Validation Checks
  const isStep1Done =
    Boolean(form.firstName.trim()) &&
    Boolean(form.lastName.trim()) &&
    /^[6-9]\d{9}$/.test(form.mobile.trim()) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    Boolean(form.dateOfBirth) &&
    Boolean(form.employmentType) &&
    form.password.trim().length >= 6;

  const isStep2Done =
    isStep1Done &&
    Boolean(form.addressLine.trim()) &&
    Boolean(form.city.trim()) &&
    Boolean(form.state.trim()) &&
    /^\d{6}$/.test(form.pincode.trim());

  const isStep3Done = isStep2Done && isStep3DocsComplete;

  const isStep4Done =
    isStep3Done &&
    Boolean(form.employmentType) &&
    (Boolean(form.employerName.trim()) || ['HOMEMAKER', 'STUDENT', 'RETIRED'].includes(form.employmentType)) &&
    (Number(form.monthlyIncome) > 0 || ['HOMEMAKER', 'STUDENT'].includes(form.employmentType));

  const isStep5Done =
    isStep4Done &&
    Boolean(form.bankName.trim()) &&
    Boolean(form.accountHolderName.trim()) &&
    /^\d{8,20}$/.test(form.bankAccountNo.trim()) &&
    form.bankAccountNo.trim() === form.confirmBankAccountNo.trim() &&
    /^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.bankIfsc.trim());

  const completedSteps: number[] = [];
  if (isStep1Done) completedSteps.push(1);
  if (isStep2Done) completedSteps.push(2);
  if (isStep3Done) completedSteps.push(3);
  if (isStep4Done) completedSteps.push(4);
  if (isStep5Done) completedSteps.push(5);

  // Field Validation for Current Step
  function validateCurrentStep(step: number): boolean {
    const stepErrors: Record<string, string> = {};
    let firstInvalidField: keyof typeof fieldRefs | null = null;

    if (step === 1) {
      if (!form.firstName.trim()) {
        stepErrors.firstName = 'First name is required';
        if (!firstInvalidField) firstInvalidField = 'firstName';
      }
      if (!form.lastName.trim()) {
        stepErrors.lastName = 'Last name is required';
        if (!firstInvalidField) firstInvalidField = 'lastName';
      }
      if (!form.mobile.trim()) {
        stepErrors.mobile = 'Mobile phone number is required';
        if (!firstInvalidField) firstInvalidField = 'mobile';
      } else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) {
        stepErrors.mobile = 'Mobile number must be a valid 10-digit number starting with 6-9';
        if (!firstInvalidField) firstInvalidField = 'mobile';
      }
      if (!form.email.trim()) {
        stepErrors.email = 'Email address (portal username) is required';
        if (!firstInvalidField) firstInvalidField = 'email';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        stepErrors.email = 'Please enter a valid email address';
        if (!firstInvalidField) firstInvalidField = 'email';
      }
      if (!form.dateOfBirth) {
        stepErrors.dateOfBirth = 'Date of birth is required';
        if (!firstInvalidField) firstInvalidField = 'dateOfBirth';
      } else {
        const birthDate = new Date(form.dateOfBirth);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        if (age < 18) {
          stepErrors.dateOfBirth = 'Borrower must be at least 18 years of age';
          if (!firstInvalidField) firstInvalidField = 'dateOfBirth';
        }
      }
      if (!form.password.trim()) {
        stepErrors.password = 'Portal login password is required';
        if (!firstInvalidField) firstInvalidField = 'password';
      } else if (form.password.trim().length < 6) {
        stepErrors.password = 'Password must be at least 6 characters';
        if (!firstInvalidField) firstInvalidField = 'password';
      }
    } else if (step === 2) {
      if (!form.addressLine.trim()) {
        stepErrors.addressLine = 'Street address / House No is required';
        if (!firstInvalidField) firstInvalidField = 'addressLine';
      }
      if (!form.city.trim()) {
        stepErrors.city = 'City / District is required';
        if (!firstInvalidField) firstInvalidField = 'city';
      }
      if (!form.state.trim()) {
        stepErrors.state = 'State is required';
        if (!firstInvalidField) firstInvalidField = 'state';
      }
      if (!form.pincode.trim()) {
        stepErrors.pincode = 'Pincode is required';
        if (!firstInvalidField) firstInvalidField = 'pincode';
      } else if (!/^\d{6}$/.test(form.pincode.trim())) {
        stepErrors.pincode = 'Pincode must be exactly 6 digits';
        if (!firstInvalidField) firstInvalidField = 'pincode';
      }
    } else if (step === 3) {
      if (!docEvaluation.isComplete) {
        setGeneralError(
          `Please upload all mandatory documents for ${normalizeEmploymentType(form.employmentType)} applicant before continuing:\n• ${docEvaluation.missingNames.join('\n• ')}`
        );
        return false;
      }
    } else if (step === 4) {
      if (!['HOMEMAKER', 'STUDENT', 'RETIRED'].includes(form.employmentType) && !form.employerName.trim()) {
        stepErrors.employerName = 'Employer / Company / Business name is required';
        if (!firstInvalidField) firstInvalidField = 'employerName';
      }
      if (!['HOMEMAKER', 'STUDENT'].includes(form.employmentType) && (!form.monthlyIncome || Number(form.monthlyIncome) <= 0)) {
        stepErrors.monthlyIncome = 'Monthly gross income must be greater than ₹0';
        if (!firstInvalidField) firstInvalidField = 'monthlyIncome';
      }
    } else if (step === 5) {
      if (!form.bankName.trim()) {
        stepErrors.bankName = 'Bank name is required';
        if (!firstInvalidField) firstInvalidField = 'bankName';
      }
      if (!form.accountHolderName.trim()) {
        stepErrors.accountHolderName = 'Account holder name is required';
        if (!firstInvalidField) firstInvalidField = 'accountHolderName';
      }
      if (!form.bankAccountNo.trim()) {
        stepErrors.bankAccountNo = 'Bank account number is required';
        if (!firstInvalidField) firstInvalidField = 'bankAccountNo';
      } else if (!/^\d{8,20}$/.test(form.bankAccountNo.trim())) {
        stepErrors.bankAccountNo = 'Account number must be between 8 and 20 numeric digits';
        if (!firstInvalidField) firstInvalidField = 'bankAccountNo';
      }
      if (!form.confirmBankAccountNo.trim()) {
        stepErrors.confirmBankAccountNo = 'Please confirm account number';
        if (!firstInvalidField) firstInvalidField = 'confirmBankAccountNo';
      } else if (form.confirmBankAccountNo.trim() !== form.bankAccountNo.trim()) {
        stepErrors.confirmBankAccountNo = 'Account numbers do not match';
        if (!firstInvalidField) firstInvalidField = 'confirmBankAccountNo';
      }
      if (!form.bankIfsc.trim()) {
        stepErrors.bankIfsc = 'IFSC code is required';
        if (!firstInvalidField) firstInvalidField = 'bankIfsc';
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.bankIfsc.trim())) {
        stepErrors.bankIfsc = 'Invalid IFSC code (Format: 4 letters, 0, 6 alphanumeric characters e.g. HDFC0001234)';
        if (!firstInvalidField) firstInvalidField = 'bankIfsc';
      }
    }

    setErrors(stepErrors);

    if (firstInvalidField && fieldRefs[firstInvalidField]?.current) {
      fieldRefs[firstInvalidField].current?.focus();
      fieldRefs[firstInvalidField].current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return Object.keys(stepErrors).length === 0;
  }

  function nextStep() {
    setGeneralError(null);
    if (validateCurrentStep(currentStep)) {
      if (currentStep < 6) {
        setCurrentStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  // Final Submit & Open Customer 360
  async function handleSaveCustomer() {
    setGeneralError(null);

    // Pre-flight validation across all steps
    if (!isStep1Done) {
      setCurrentStep(1);
      validateCurrentStep(1);
      setGeneralError('Please complete all required fields in Step 1.');
      return;
    }
    if (!isStep2Done) {
      setCurrentStep(2);
      validateCurrentStep(2);
      setGeneralError('Please complete all required fields in Step 2.');
      return;
    }
    if (!docEvaluation.isComplete) {
      setCurrentStep(3);
      validateCurrentStep(3);
      return;
    }
    if (!isStep4Done) {
      setCurrentStep(4);
      validateCurrentStep(4);
      setGeneralError('Please complete all required fields in Step 4.');
      return;
    }
    if (!isStep5Done) {
      setCurrentStep(5);
      validateCurrentStep(5);
      setGeneralError('Please complete all required fields in Step 5.');
      return;
    }

    setSaving(true);
    setSavingProgress('Creating customer profile in LMS core...');

    try {
      // 1. Create Customer
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        addressLine: form.addressLine.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        employmentType: form.employmentType,
        employerName: form.employerName.trim() || undefined,
        designation: form.designation.trim() || undefined,
        monthlyIncome: form.monthlyIncome ? Number(form.monthlyIncome) : undefined,
        existingObligations: form.existingObligations ? Number(form.existingObligations) : undefined,
        bankName: form.bankName.trim(),
        bankAccountNo: form.bankAccountNo.trim(),
        bankIfsc: form.bankIfsc.trim(),
      };

      const res = await api.post('/customers', payload);
      const newCustomerId = res.data?.data?.id;

      if (!newCustomerId) {
        throw new Error('Failed to retrieve new customer ID from response.');
      }

      // 2. Upload all queued documents to Cloudinary & DB
      for (let i = 0; i < uploadedDocs.length; i++) {
        const item = uploadedDocs[i];
        setSavingProgress(`Uploading document ${i + 1} of ${uploadedDocs.length}: ${item.documentName}...`);

        const docFormData = new FormData();
        docFormData.append('file', item.file);
        docFormData.append('customerId', newCustomerId);
        docFormData.append('category', item.category);
        docFormData.append('documentType', item.documentType);
        if (item.documentName) docFormData.append('documentName', item.documentName);
        if (item.description) docFormData.append('description', item.description);

        await api.post('/documents/upload', docFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).catch((err) => {
          console.warn(`Upload warning for ${item.documentName}:`, err);
        });
      }

      // 3. Register Primary Bank Account explicitly
      if (form.bankName.trim() && form.bankAccountNo.trim() && form.bankIfsc.trim()) {
        setSavingProgress('Registering disbursement bank account...');
        await api.post(`/customers/${newCustomerId}/bank-accounts`, {
          bankName: form.bankName.trim(),
          accountNumber: form.bankAccountNo.trim(),
          ifscCode: form.bankIfsc.toUpperCase().trim(),
          accountHolderName: form.accountHolderName.trim() || `${form.firstName} ${form.lastName}`.trim(),
          accountType: form.accountType,
          isPrimary: true,
        }).catch((err) => console.warn('Bank account registration warning:', err));
      }

      // 4. Redirect to Customer 360
      setSavingProgress('Finalizing Customer 360 dossier...');
      router.push(`/customers/${newCustomerId}`);
    } catch (err) {
      setGeneralError(apiErrorMessage(err));
      setSaving(false);
    }
  }

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 flex items-center justify-center text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-brand-600" />
        Loading authorization profile...
      </div>
    );
  }

  if (!isLoanOfficer) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6">
        <div>
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white transition-colors group"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E2445] shadow-2xs group-hover:border-brand-500 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/50 transition-all">
              <ArrowLeft className="h-4 w-4" />
            </span>
            <span>Back to Customers Directory</span>
          </Link>
        </div>

        <Card className="p-8 text-center space-y-4 border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
            <Lock className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Access Restricted to Loan Officers
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Only certified Loan Officers (<span className="font-mono font-bold text-amber-700 dark:text-amber-400">LOAN_OFFICER</span>) have authorization to register and onboard new borrowers into the LMS.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/customers">
              <Button variant="secondary" size="sm">
                Return to Borrower Directory
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Header Navigation Link */}
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white transition-colors group"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E2445] shadow-2xs group-hover:border-brand-500 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/50 transition-all">
            <ArrowLeft className="h-4 w-4" />
          </span>
          <span>Back to Customers Directory</span>
        </Link>
      </div>

      {/* Main Page Title */}
      <PageHeader
        breadcrumb="Customers / Dynamic Step-by-Step Onboarding"
        title="Add Customer Profile & Dynamic Onboarding"
        subtitle="Dynamic, employment-aware and product-aware document vault with real-time rule calculation and direct Customer 360 dossier handoff"
      />

      {/* Stepper Navigation Bar */}
      <CustomerOnboardingStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        steps={STEPS}
        onStepClick={(stepId) => {
          if (stepId < currentStep) {
            setCurrentStep(stepId);
          } else {
            if (validateCurrentStep(currentStep)) {
              setCurrentStep(stepId);
            }
          }
        }}
      />

      {/* General Error Banner */}
      {generalError && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-4 text-xs font-medium text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-none mt-0.5" />
          <div className="space-y-1 whitespace-pre-line">
            <p className="font-bold text-rose-900 dark:text-rose-100">Action Required Before Continuing</p>
            <p className="text-rose-700 dark:text-rose-300">{generalError}</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: Personal Information, Employment Type & Intended Product */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4 text-brand-600" />
                Step 1: Personal Information, Employment Classification & Scheme
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Selecting Employment Type and Loan Scheme will dynamically configure your KYC and Income document checklist in Step 3
              </p>
            </div>
            {isStep1Done ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Completed ✓
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
                * All Fields Mandatory
              </span>
            )}
          </div>

          {/* Dynamic Employment Type Selector (Drives Document Rules) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              1. Select Borrower Employment Type <span className="text-rose-500 font-bold">*</span>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Document requirements automatically adjust according to the applicant&apos;s income source.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {EMPLOYMENT_TYPES_CONFIG.map((emp) => {
                const isSelected = form.employmentType === emp.id;
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => update('employmentType', emp.id)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2',
                      isSelected
                        ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/50 shadow-xs ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E2445] hover:border-slate-300 dark:hover:border-slate-700'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{emp.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-brand-600 flex-none" />}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{emp.desc}</p>
                    </div>
                    <span
                      className={cn(
                        'text-[9px] font-bold px-2 py-0.5 rounded-full inline-block self-start',
                        isSelected
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      )}
                    >
                      {emp.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intended Loan Scheme / Product Selector */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              2. Target Loan Product Scheme (Optional / Configurable)
            </label>
            <div className="flex flex-wrap gap-2">
              {LOAN_PRODUCT_TYPES.map((prod) => {
                const isSelected = form.intendedProductType === prod.id;
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => update('intendedProductType', prod.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5',
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300 font-bold shadow-2xs'
                        : 'bg-white dark:bg-[#1E2445] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>{prod.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personal Information Inputs */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              3. Borrower Identity & Login Credentials
            </h4>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* First Name */}
              <div>
                <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>First Name <span className="text-rose-500 font-bold">*</span></span>
                  <span className="text-[10px] text-slate-400">As on PAN / Aadhaar</span>
                </label>
                <Input
                  ref={fieldRefs.firstName}
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  placeholder="e.g. Rajesh"
                  className={cn(errors.firstName && 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500')}
                  required
                />
                {errors.firstName && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Last Name <span className="text-rose-500 font-bold">*</span></span>
                  <span className="text-[10px] text-slate-400">Legal Surname</span>
                </label>
                <Input
                  ref={fieldRefs.lastName}
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  placeholder="e.g. Kumar"
                  className={cn(errors.lastName && 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500')}
                  required
                />
                {errors.lastName && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.lastName}
                  </p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Mobile Phone Number <span className="text-rose-500 font-bold">*</span></span>
                  <span className="text-[10px] font-mono font-medium text-slate-400">{form.mobile.length}/10 digits</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 border-r border-slate-200 dark:border-slate-700 pr-2">
                    +91
                  </span>
                  <Input
                    ref={fieldRefs.mobile}
                    type="tel"
                    maxLength={10}
                    value={form.mobile}
                    onChange={handleMobileChange}
                    placeholder="9876543210"
                    className={cn(
                      'pl-14 font-mono font-medium tracking-wider',
                      errors.mobile && 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500'
                    )}
                    required
                  />
                </div>
                {errors.mobile ? (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.mobile}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">Must be exactly 10 digits starting with 6-9</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Email Address (Portal Username) <span className="text-rose-500 font-bold">*</span></span>
                  <span className="text-[10px] text-slate-400">For Login & Notices</span>
                </label>
                <Input
                  ref={fieldRefs.email}
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="e.g. rajesh.kumar@example.com"
                  className={cn(errors.email && 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500')}
                  required
                />
                {errors.email && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Date of Birth <span className="text-rose-500 font-bold">*</span></span>
                  <span className="text-[10px] text-slate-400">Min 18 Years</span>
                </label>
                <Input
                  ref={fieldRefs.dateOfBirth}
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => update('dateOfBirth', e.target.value)}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  className={cn(errors.dateOfBirth && 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500')}
                  required
                />
                {errors.dateOfBirth && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.dateOfBirth}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Gender <span className="text-rose-500 font-bold">*</span>
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => update('gender', e.target.value)}
                  required
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E2445] px-3 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs focus:border-brand-600 focus:outline-hidden"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Portal Password */}
              <div className="sm:col-span-2">
                <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Portal Password (For Borrower Login) <span className="text-rose-500 font-bold">*</span></span>
                  <span className="text-[10px] text-slate-400">Min 6 characters</span>
                </label>
                <div className="relative">
                  <Input
                    ref={fieldRefs.password}
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="Set customer portal login password (min 6 chars)"
                    minLength={6}
                    required
                    className={cn('pr-10', errors.password && 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.password}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Geographic Location & Residential Address */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-600" />
                Step 2: Geographic Location & Residential Address
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Record current place of residence and 6-digit postal code for credit verification
              </p>
            </div>
            {isStep2Done ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Completed ✓
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
                * All Fields Mandatory
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Street Address Line */}
            <div className="sm:col-span-2">
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Address Line (Flat / Building / Street / Area) <span className="text-rose-500 font-bold">*</span></span>
                <span className="text-[10px] text-slate-400">Complete Residential Address</span>
              </label>
              <Input
                ref={fieldRefs.addressLine}
                value={form.addressLine}
                onChange={(e) => update('addressLine', e.target.value)}
                placeholder="e.g. Flat 402, Green Meadows, MG Road, Shivaji Nagar"
                className={cn(errors.addressLine && 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500')}
                required
              />
              {errors.addressLine && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.addressLine}
                </p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>City / District <span className="text-rose-500 font-bold">*</span></span>
              </label>
              <Input
                ref={fieldRefs.city}
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                placeholder="e.g. Pune / Mumbai / Bengaluru"
                className={cn(errors.city && 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500')}
                required
              />
              {errors.city && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.city}
                </p>
              )}
            </div>

            {/* State */}
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>State / Province <span className="text-rose-500 font-bold">*</span></span>
              </label>
              <select
                ref={fieldRefs.state}
                value={form.state}
                onChange={(e) => update('state', e.target.value)}
                className={cn(
                  'w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E2445] px-3 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs focus:border-brand-600 focus:outline-hidden',
                  errors.state && 'border-rose-500 ring-1 ring-rose-500'
                )}
                required
              >
                <option value="">-- Select State --</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.state}
                </p>
              )}
            </div>

            {/* Pincode */}
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Pincode / Postal Code <span className="text-rose-500 font-bold">*</span></span>
                <span className="text-[10px] font-mono text-slate-400">{form.pincode.length}/6 digits</span>
              </label>
              <Input
                ref={fieldRefs.pincode}
                type="tel"
                maxLength={6}
                value={form.pincode}
                onChange={handlePincodeChange}
                placeholder="e.g. 411001"
                className={cn(
                  'font-mono font-medium tracking-wider',
                  errors.pincode && 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500'
                )}
                required
              />
              {errors.pincode ? (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.pincode}
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">Must be exactly 6 numeric digits</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: Dynamic Document Checklist Vault */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Dynamic Tracker Banner */}
          <div className="rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-gradient-to-r from-sky-50 to-indigo-50/60 dark:from-sky-950/30 dark:to-indigo-950/20 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Step 3: Document Vault for {EMPLOYMENT_TYPES_CONFIG.find((e) => e.id === form.employmentType)?.label || form.employmentType}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Target Product: <strong className="text-sky-800 dark:text-sky-200">{LOAN_PRODUCT_TYPES.find((p) => p.id === form.intendedProductType)?.label}</strong>. Requirements are dynamically calculated based on business policy.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Mandatory Checklist</span>
                  <span className="text-xs font-bold text-sky-700 dark:text-sky-300">
                    {docEvaluation.uploadedCount} of {docEvaluation.mandatoryCount} Uploaded
                  </span>
                </div>
                <div className="w-24 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      isStep3DocsComplete ? 'bg-emerald-500' : 'bg-sky-500'
                    )}
                    style={{
                      width: `${docEvaluation.mandatoryCount > 0 ? (docEvaluation.uploadedCount / docEvaluation.mandatoryCount) * 100 : 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Missing Required Items Alert */}
            {!isStep3DocsComplete && (
              <div className="mt-4 pt-3 border-t border-sky-200/80 dark:border-sky-800/50 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Pending Required Uploads:
                </span>
                {docEvaluation.missingNames.map((name, idx) => (
                  <span
                    key={idx}
                    className="bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md font-semibold text-[11px]"
                  >
                    • {name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 1. MANDATORY DOCUMENTS SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
                Mandatory Documents ({docEvaluation.uploadedCount}/{docEvaluation.mandatoryCount} Satisfied)
              </h4>
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/50">
                Strict Onboarding Requirement
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {docEvaluation.checklistStatus.map((item) => {
                const { rule, isSatisfied, matchingDocs } = item;
                const isPhotoSlot = rule.code === 'APPLICANT_PHOTO';

                return (
                  <Card key={rule.code} className="p-5 space-y-3.5 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-lg font-bold',
                            isSatisfied
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          )}
                        >
                          {isPhotoSlot ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">{rule.name}</h5>
                          <span className="text-[10px] text-slate-400">{rule.description}</span>
                        </div>
                      </div>

                      {isSatisfied ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex-none">
                          ✓ {matchingDocs.length} Attached
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full flex-none">
                          * Required
                        </span>
                      )}
                    </div>

                    {/* Uploader Box */}
                    <div className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 text-center space-y-2">
                      {isPhotoSlot && matchingDocs.length > 0 && matchingDocs[0].previewUrl ? (
                        <div className="relative group">
                          <img
                            src={matchingDocs[0].previewUrl}
                            alt="Photo Preview"
                            className="h-24 w-24 object-cover rounded-2xl border-2 border-emerald-400 shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(matchingDocs[0].id)}
                            className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full h-5 w-5 text-xs font-bold flex items-center justify-center shadow-md transition cursor-pointer"
                            title="Remove photo"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#1E2445] border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 transition">
                          <UploadCloud className="h-4 w-4 text-brand-600" />
                          <span>Select {rule.name.split('(')[0].trim()}</span>
                          <input
                            type="file"
                            accept={isPhotoSlot ? 'image/jpeg,image/png,image/webp' : 'image/*,application/pdf'}
                            multiple={rule.allowMultiple}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) {
                                Array.from(e.target.files).forEach((f) => handleAttachFileToRule(rule, f));
                              }
                            }}
                          />
                        </label>
                      )}

                      {/* Attached Documents List */}
                      {matchingDocs.length > 0 && !isPhotoSlot && (
                        <div className="w-full space-y-1 pt-1 text-left">
                          {matchingDocs.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between text-xs p-1.5 px-2 rounded-lg bg-white dark:bg-[#1E2445] border border-slate-200 dark:border-slate-700"
                            >
                              <span className="truncate max-w-[180px] font-medium text-slate-700 dark:text-slate-200">
                                {doc.file.name} ({(doc.file.size / 1024).toFixed(0)} KB)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveDoc(doc.id)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* 2. CONDITIONAL DOCUMENTS SECTION */}
          {conditional.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                  Conditional Documents ({conditional.length} Applicable)
                </h4>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/50">
                  Applies on specific policy triggers
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conditional.map((rule) => {
                  const matchingDocs = uploadedDocs.filter(
                    (d) => d.ruleCode === rule.code || rule.acceptedDocumentTypes.includes(d.documentType)
                  );
                  const isAttached = matchingDocs.length > 0;

                  return (
                    <Card key={rule.code} className="p-4 space-y-2.5 border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">{rule.name}</h5>
                          {rule.conditionReason && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block">
                              {rule.conditionReason}
                            </span>
                          )}
                        </div>
                        {isAttached ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            ✓ {matchingDocs.length} Attached
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            Conditional
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-[#1E2445] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition">
                          <UploadCloud className="h-3.5 w-3.5 text-amber-600" /> Upload File
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            multiple={rule.allowMultiple}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) {
                                Array.from(e.target.files).forEach((f) => handleAttachFileToRule(rule, f));
                              }
                            }}
                          />
                        </label>

                        {matchingDocs.length > 0 && (
                          <span className="text-[11px] text-emerald-600 font-bold truncate max-w-[160px]">
                            {matchingDocs[0].file.name}
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. OPTIONAL & CUSTOM DOCUMENTS SECTION */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Optional & Custom Supporting Documents
                </h4>
                <p className="text-[11px] text-slate-500">
                  Add additional files, employer confirmations, or ad-hoc custom documents
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowOtherDocModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Other Document
              </Button>
            </div>

            {uploadedDocs.filter((d) => !d.ruleCode || d.ruleCode === 'OTHER').length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {uploadedDocs
                  .filter((d) => !d.ruleCode || d.ruleCode === 'OTHER')
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E2445] flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex-none">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{doc.documentName}</p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {doc.category} · {doc.file.name} ({(doc.file.size / 1024).toFixed(0)} KB)
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 text-center text-xs text-slate-400">
                Click <strong>+ Add Other Document</strong> to upload any custom supporting files.
              </div>
            )}
          </div>

          {/* 4. NOT APPLICABLE DOCUMENTS (Collapsible) */}
          {notApplicable.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowNotApplicableDocs(!showNotApplicableDocs)}
                className="w-full p-3 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-slate-400" />
                  <span>
                    Waived / Not Applicable for {normalizeEmploymentType(form.employmentType)} ({notApplicable.length} Documents)
                  </span>
                </div>
                {showNotApplicableDocs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showNotApplicableDocs && (
                <div className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 border-t border-slate-200 dark:border-slate-800">
                  {notApplicable.map((rule) => (
                    <div
                      key={rule.code}
                      className="p-2 rounded-lg bg-white dark:bg-[#1E2445] border border-slate-200 dark:border-slate-800 text-[11px]"
                    >
                      <p className="font-semibold text-slate-500 dark:text-slate-400 line-through">{rule.name}</p>
                      <p className="text-[10px] text-slate-400">{rule.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal: + Add Other Document */}
          {showOtherDocModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1A1F37] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Plus className="h-4 w-4 text-brand-600" /> Add Custom / Supporting Document
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowOtherDocModal(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">
                      Document Title / Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <Input
                      value={otherDocName}
                      onChange={(e) => setOtherDocName(e.target.value)}
                      placeholder="e.g. Employer Confirmation Letter / Rent Deed"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">
                      Document Category
                    </label>
                    <select
                      value={otherDocCategory}
                      onChange={(e) => setOtherDocCategory(e.target.value)}
                      className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E2445] px-3 font-medium text-slate-700 dark:text-slate-200"
                    >
                      <option value="COLLATERAL">Property / Collateral Document</option>
                      <option value="BUSINESS_REGISTRATION">Business Registration / GST</option>
                      <option value="EMPLOYMENT_PROOF">Employment Letter / ID</option>
                      <option value="CO_APPLICANT">Co-Applicant KYC / Income</option>
                      <option value="OTHER">Other Miscellaneous Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">
                      Description / Remarks (Optional)
                    </label>
                    <Input
                      value={otherDocDesc}
                      onChange={(e) => setOtherDocDesc(e.target.value)}
                      placeholder="e.g. Registration details or additional notes"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">
                      Select File <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <label className="cursor-pointer flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 transition">
                      <UploadCloud className="h-4 w-4 text-slate-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {otherDocFile ? otherDocFile.name : 'Choose PDF or Image file'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setOtherDocFile(f);
                        }}
                      />
                    </label>
                  </div>

                  {otherDocError && (
                    <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {otherDocError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowOtherDocModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddOtherDoc}
                    className="bg-brand-600 hover:bg-brand-700 text-white"
                  >
                    Add to Document Queue
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: Employment & Financial Income Profile */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-brand-600" />
                Step 4: Employment & Financial Assessment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Record organization, role, monthly income, and existing liabilities for debt-to-income (DTI) evaluation
              </p>
            </div>
            {isStep4Done ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Completed ✓
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
                * Required Fields Marked
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Employment Type Selector (Synced with Step 1) */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Employment Type <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                value={form.employmentType}
                onChange={(e) => update('employmentType', e.target.value as EmploymentType)}
                required
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E2445] px-3 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs focus:border-brand-600 focus:outline-hidden"
              >
                {EMPLOYMENT_TYPES_CONFIG.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Employer / Organization Name */}
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>
                  {['SALARIED'].includes(form.employmentType)
                    ? 'Employer / Company Name'
                    : ['SELF_EMPLOYED', 'BUSINESS_OWNER', 'BUSINESS'].includes(form.employmentType)
                    ? 'Business Enterprise Name'
                    : ['PROFESSIONAL'].includes(form.employmentType)
                    ? 'Practice / Clinic / Firm Name'
                    : 'Organization / Details'}
                  {!['HOMEMAKER', 'STUDENT', 'RETIRED'].includes(form.employmentType) && (
                    <span className="text-rose-500 font-bold"> *</span>
                  )}
                </span>
              </label>
              <Input
                ref={fieldRefs.employerName}
                value={form.employerName}
                onChange={(e) => update('employerName', e.target.value)}
                placeholder="e.g. Tata Consultancy Services Ltd / Zenith Enterprises"
                className={cn(errors.employerName && 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500')}
                required={!['HOMEMAKER', 'STUDENT', 'RETIRED'].includes(form.employmentType)}
              />
              {errors.employerName && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.employerName}
                </p>
              )}
            </div>

            {/* Designation */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Designation / Position
              </label>
              <Input
                ref={fieldRefs.designation}
                value={form.designation}
                onChange={(e) => update('designation', e.target.value)}
                placeholder="e.g. Senior Software Engineer / Proprietor"
              />
            </div>

            {/* Monthly Gross Income */}
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>
                  Monthly Gross Income (₹)
                  {!['HOMEMAKER', 'STUDENT'].includes(form.employmentType) && (
                    <span className="text-rose-500 font-bold"> *</span>
                  )}
                </span>
                <span className="text-[10px] font-bold text-emerald-600">
                  {Number(form.monthlyIncome) > 0 ? `₹${Number(form.monthlyIncome).toLocaleString('en-IN')}/mo` : ''}
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                <Input
                  ref={fieldRefs.monthlyIncome}
                  type="number"
                  min={1}
                  value={form.monthlyIncome}
                  onChange={(e) => update('monthlyIncome', e.target.value)}
                  placeholder="e.g. 75000"
                  className={cn(
                    'pl-8 font-mono font-medium',
                    errors.monthlyIncome && 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500'
                  )}
                  required={!['HOMEMAKER', 'STUDENT'].includes(form.employmentType)}
                />
              </div>
              {errors.monthlyIncome ? (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.monthlyIncome}
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">Verified against income proofs in Step 3</p>
              )}
            </div>

            {/* Existing Monthly Obligations */}
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Existing Monthly EMIs / Liabilities (₹)</span>
                <span className="text-[10px] text-slate-400">Total active loans</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                <Input
                  type="number"
                  min={0}
                  value={form.existingObligations}
                  onChange={(e) => update('existingObligations', e.target.value)}
                  placeholder="e.g. 15000 (0 if none)"
                  className="pl-8 font-mono font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Leave 0 if borrower has no active external loan EMIs</p>
            </div>

            {/* Total Work Experience */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Total Work Experience (Years)
              </label>
              <Input
                type="number"
                min={0}
                max={50}
                value={form.experienceYears}
                onChange={(e) => update('experienceYears', e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: Primary Bank Account Details for Payout */}
      {/* ========================================================================= */}
      {currentStep === 5 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Landmark className="h-4 w-4 text-blue-600" />
                Step 5: Bank Account Details for Loan Disbursement
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Disbursement payout account number and IFSC code for electronic funds transfer (NEFT/RTGS/IMPS)
              </p>
            </div>
            {isStep5Done ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Completed ✓
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
                * All Fields Mandatory
              </span>
            )}
          </div>

          {/* Quick Bank Selection Chips */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Quick Select Popular Bank:
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_BANKS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => update('bankName', b)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer',
                    form.bankName === b
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Bank Name */}
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Bank Name <span className="text-rose-500 font-bold">*</span></span>
              </label>
              <Input
                ref={fieldRefs.bankName}
                value={form.bankName}
                onChange={(e) => update('bankName', e.target.value)}
                placeholder="e.g. HDFC Bank / State Bank of India"
                className={cn(errors.bankName && 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500')}
                required
              />
              {errors.bankName && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.bankName}
                </p>
              )}
            </div>

            {/* Account Holder Name */}
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Account Holder Legal Name <span className="text-rose-500 font-bold">*</span></span>
              </label>
              <Input
                ref={fieldRefs.accountHolderName}
                value={form.accountHolderName}
                onChange={(e) => update('accountHolderName', e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className={cn(errors.accountHolderName && 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500')}
                required
              />
              {errors.accountHolderName && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.accountHolderName}
                </p>
              )}
            </div>

            {/* Bank Account Number */}
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Bank Account Number <span className="text-rose-500 font-bold">*</span></span>
                <span className="text-[10px] text-slate-400">8 to 20 digits</span>
              </label>
              <Input
                ref={fieldRefs.bankAccountNo}
                type="password"
                value={form.bankAccountNo}
                onChange={(e) => handleBankAccountChange('bankAccountNo', e.target.value)}
                placeholder="Enter account number (digits only)"
                className={cn('font-mono font-medium', errors.bankAccountNo && 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500')}
                required
              />
              {errors.bankAccountNo && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.bankAccountNo}
                </p>
              )}
            </div>

            {/* Confirm Bank Account Number */}
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Confirm Bank Account Number <span className="text-rose-500 font-bold">*</span></span>
                <span className="text-[10px] text-slate-400">Re-enter for match</span>
              </label>
              <Input
                ref={fieldRefs.confirmBankAccountNo}
                type="text"
                value={form.confirmBankAccountNo}
                onChange={(e) => handleBankAccountChange('confirmBankAccountNo', e.target.value)}
                placeholder="Re-enter account number"
                className={cn('font-mono font-medium', errors.confirmBankAccountNo && 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500')}
                required
              />
              {errors.confirmBankAccountNo && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.confirmBankAccountNo}
                </p>
              )}
            </div>

            {/* IFSC Code */}
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>IFSC Code <span className="text-rose-500 font-bold">*</span></span>
                <span className="text-[10px] font-mono text-slate-400">{form.bankIfsc.length}/11 chars</span>
              </label>
              <Input
                ref={fieldRefs.bankIfsc}
                maxLength={11}
                value={form.bankIfsc}
                onChange={(e) => handleIfscChange(e.target.value)}
                placeholder="e.g. HDFC0001234"
                className={cn('font-mono font-bold uppercase tracking-wider', errors.bankIfsc && 'border-rose-500 focus:border-rose-600 ring-1 ring-rose-500')}
                required
              />
              {errors.bankIfsc ? (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.bankIfsc}
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">11-character Indian Financial System Code</p>
              )}
            </div>

            {/* Account Type */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Account Type <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                value={form.accountType}
                onChange={(e) => update('accountType', e.target.value as any)}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E2445] px-3 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs focus:border-brand-600 focus:outline-hidden"
              >
                <option value="SAVINGS">Savings Account</option>
                <option value="SALARY">Salary Account</option>
                <option value="CURRENT">Current Account (Business)</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: Comprehensive Review & Save Customer 360 */}
      {/* ========================================================================= */}
      {currentStep === 6 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Step 6: Intake Audit & Save Customer 360 Dossier
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review all captured customer data, verified dynamic documents, and confirm creation
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
              Ready for Creation
            </span>
          </div>

          {/* Audit Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* 1. Personal & Contact */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-brand-600" /> 1. Personal & Classification
                </span>
                <span className="text-[10px] font-bold text-emerald-600">✓ Completed</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 block">Full Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{form.firstName} {form.lastName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Mobile Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">+91 {form.mobile}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Employment Type</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">
                    {EMPLOYMENT_TYPES_CONFIG.find((e) => e.id === form.employmentType)?.label || form.employmentType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Target Scheme</span>
                  <span className="font-semibold text-sky-700 dark:text-sky-300">
                    {LOAN_PRODUCT_TYPES.find((p) => p.id === form.intendedProductType)?.label || form.intendedProductType}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Location */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand-600" /> 2. Residential Location
                </span>
                <span className="text-[10px] font-bold text-emerald-600">✓ Completed</span>
              </div>
              <div className="space-y-1 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 block">Address</span>
                  <span className="font-medium">{form.addressLine}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">City & State</span>
                    <span className="font-bold text-slate-900 dark:text-white">{form.city}, {form.state}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Postal Pincode</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{form.pincode}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Document Vault Queue */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Cloud className="h-3.5 w-3.5 text-sky-600" /> 3. Document Vault ({uploadedDocs.length} Files Ready)
                </span>
                <span className="text-[10px] font-bold text-emerald-600">✓ {docEvaluation.uploadedCount}/{docEvaluation.mandatoryCount} Mandatory</span>
              </div>
              <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                {uploadedDocs.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between text-[11px]">
                    <span className="truncate max-w-[220px]">• {doc.documentName}: {doc.file.name}</span>
                    <span className="text-emerald-600 font-bold flex-none">✓ Attached</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. Employment & Income */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-amber-600" /> 4. Employment & Income
                </span>
                <span className="text-[10px] font-bold text-emerald-600">✓ Completed</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 block">Employer / Business</span>
                  <span className="font-semibold truncate block">{form.employerName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Monthly Income</span>
                  <span className="font-bold text-emerald-600">
                    ₹{Number(form.monthlyIncome || 0).toLocaleString('en-IN')}/mo
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Monthly Liabilities</span>
                  <span className="font-semibold">
                    ₹{Number(form.existingObligations || 0).toLocaleString('en-IN')}/mo
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Experience</span>
                  <span className="font-semibold">{form.experienceYears ? `${form.experienceYears} Years` : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* 5. Bank Details (Span 2) */}
            <div className="md:col-span-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Landmark className="h-3.5 w-3.5 text-blue-600" /> 5. Primary Disbursement Bank Account
                </span>
                <span className="text-[10px] font-bold text-emerald-600">✓ Linked</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 block">Bank Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{form.bankName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Account Number</span>
                  <span className="font-mono font-bold text-brand-700 dark:text-brand-300">
                    ••••••••{form.bankAccountNo.slice(-4)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">IFSC Code</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{form.bankIfsc}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Account Type</span>
                  <span className="font-semibold">{form.accountType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Action Banner */}
          <div className="rounded-2xl border border-brand-300 bg-gradient-to-r from-brand-50 to-indigo-50/70 dark:from-brand-950/60 dark:to-indigo-950/40 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <p className="font-bold text-brand-950 dark:text-brand-100 text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Ready to Save Profile & Open Customer 360
              </p>
              <p className="text-xs text-brand-800 dark:text-brand-300">
                Saving will create the borrower profile in LMS, upload all {uploadedDocs.length} documents to the Cloudinary Vault, link the primary bank account, and transition directly to the full Customer 360 dossier.
              </p>
            </div>

            <Button
              type="button"
              disabled={saving}
              onClick={handleSaveCustomer}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg flex-none cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {savingProgress || 'Saving...'}
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" /> Save & Open Customer 360 →
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Stepper Footer Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800">
        <Button
          type="button"
          variant="secondary"
          disabled={currentStep === 1 || saving}
          onClick={() => {
            setGeneralError(null);
            setCurrentStep((s) => Math.max(1, s - 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="cursor-pointer"
        >
          ← Previous Step
        </Button>

        {currentStep < 6 ? (
          <Button
            type="button"
            disabled={saving}
            onClick={nextStep}
            className="flex items-center gap-1.5 font-bold cursor-pointer"
          >
            Continue to Step {currentStep + 1} <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
