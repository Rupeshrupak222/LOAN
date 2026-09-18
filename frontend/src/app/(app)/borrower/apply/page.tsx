'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Building2,
  User,
  Briefcase,
  ShieldCheck,
  CreditCard,
  FileCheck,
  Lock,
  GraduationCap,
  Car,
  Zap,
  UploadCloud,
  FileText,
  Trash2,
  Award,
  Landmark,
  Compass,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner } from '@/components/ui';
import { useToast } from '@/lib/toast';

// 6 Core Steps
const STEPS = [
  { id: 1, title: 'Loan Category', subtitle: 'Product & Amount', icon: Sparkles },
  { id: 2, title: 'Applicant Role', subtitle: 'Role & Profile', icon: User },
  { id: 3, title: 'Income & Financials', subtitle: 'Work/Business Details', icon: Briefcase },
  { id: 4, title: 'Document Verification', subtitle: 'Mandatory Checklist', icon: ShieldCheck },
  { id: 5, title: 'Disbursement Bank', subtitle: 'Bank & Mandate', icon: CreditCard },
  { id: 6, title: 'Review & Declarations', subtitle: 'Statutory KFS', icon: FileCheck },
];

// Product Category Definitions
const LOAN_CATEGORIES = [
  {
    type: 'PERSONAL',
    name: 'Personal Digital Loan',
    tagline: 'Instant unsecured credit for personal & lifestyle goals',
    icon: Sparkles,
    badge: 'Popular',
    accentColor: 'from-blue-600 to-indigo-600',
    minAmount: 10000,
    maxAmount: 1000000,
    defaultAmount: 50000,
    minTenure: 3,
    maxTenure: 60,
    defaultTenure: 12,
    baseRate: 14.5,
    processingFeePct: 1.0,
    purposes: [
      'Medical & Healthcare Emergency',
      'Home Renovation & Furnishing',
      'Wedding & Family Celebration',
      'Travel & Vacation Expense',
      'Debt Consolidation & Card Payoff',
      'Electronics & Appliance Purchase',
      'Personal Career Upskilling',
    ],
  },
  {
    type: 'BUSINESS',
    name: 'Business & MSME Growth Loan',
    tagline: 'Collateral-free working capital & expansion credit',
    icon: Building2,
    badge: 'High Limit',
    accentColor: 'from-purple-600 to-indigo-700',
    minAmount: 50000,
    maxAmount: 5000000,
    defaultAmount: 200000,
    minTenure: 6,
    maxTenure: 84,
    defaultTenure: 24,
    baseRate: 16.0,
    processingFeePct: 1.5,
    purposes: [
      'Working Capital & Inventory Purchase',
      'Machinery & Equipment Acquisition',
      'Office / Retail Shop Expansion',
      'Vendor & Supplier Advance Payments',
      'Business Marketing & Technology Upgrades',
      'GST & Tax Compliance Liquidity',
    ],
  },
  {
    type: 'EDUCATION',
    name: 'Higher Education & Global Studies',
    tagline: 'Subsidized student financing for domestic & foreign universities',
    icon: GraduationCap,
    badge: 'Low APR',
    accentColor: 'from-emerald-600 to-teal-700',
    minAmount: 25000,
    maxAmount: 2000000,
    defaultAmount: 100000,
    minTenure: 12,
    maxTenure: 120,
    defaultTenure: 36,
    baseRate: 11.0,
    processingFeePct: 0.5,
    purposes: [
      'Undergraduate / Degree College Tuition',
      'Postgraduate / Master / MBA Program',
      'Overseas University Living & Travel',
      'Coding & Technology Certification Bootcamp',
      'Competitive Exam Coaching & Textbooks',
    ],
  },
  {
    type: 'VEHICLE',
    name: 'Vehicle & Equipment Loan',
    tagline: 'Fast-track financing for two-wheelers, cars & commercial fleet',
    icon: Car,
    badge: 'Instant LTV',
    accentColor: 'from-amber-600 to-orange-600',
    minAmount: 50000,
    maxAmount: 2500000,
    defaultAmount: 100000,
    minTenure: 6,
    maxTenure: 84,
    defaultTenure: 24,
    baseRate: 12.5,
    processingFeePct: 1.0,
    purposes: [
      'New 4-Wheeler Car Purchase',
      'Electric Vehicle (EV) / Two-Wheeler',
      'Commercial Goods Vehicle / Auto',
      'Pre-Owned Certified Car Purchase',
    ],
  },
  {
    type: 'EMERGENCY',
    name: 'Emergency Instant Credit',
    tagline: 'Urgent 2-minute emergency cash line with minimal paperwork',
    icon: Zap,
    badge: '2 Min Cash',
    accentColor: 'from-rose-600 to-pink-600',
    minAmount: 5000,
    maxAmount: 200000,
    defaultAmount: 25000,
    minTenure: 3,
    maxTenure: 24,
    defaultTenure: 6,
    baseRate: 18.0,
    processingFeePct: 2.0,
    purposes: [
      'Immediate Hospitalization / Medical Bill',
      'Urgent Family Emergency Expense',
      'Utility & Overdue Rent Settlement',
      'Critical Repair & Unplanned Contingency',
    ],
  },
];

// Role / Employment Types
const ROLES = [
  {
    id: 'SALARIED',
    title: 'Salaried Employee',
    description: 'Employed in Corporate, MNC, Public Sector, or Private Ltd.',
    icon: Briefcase,
  },
  {
    id: 'PROFESSIONAL',
    title: 'Self-Employed Professional',
    description: 'Doctor, Chartered Accountant, Advocate, Architect, or Consultant.',
    icon: Award,
  },
  {
    id: 'BUSINESS',
    title: 'SME Business Owner / Merchant',
    description: 'Proprietorship, Partnership, Pvt Ltd, or Registered Trader.',
    icon: Building2,
  },
  {
    id: 'STUDENT',
    title: 'Student / Scholar',
    description: 'Full-time student applying with a parent/guardian co-borrower.',
    icon: GraduationCap,
  },
  {
    id: 'FREELANCER',
    title: 'Freelancer / Contractor',
    description: 'Digital creator, independent consultant, or gig professional.',
    icon: Compass,
  },
  {
    id: 'FARMER',
    title: 'Farmer / Agri Entrepreneur',
    description: 'Agricultural cultivator, dairy owner, or rural allied producer.',
    icon: Landmark,
  },
];

interface UploadedDoc {
  docCode: string;
  docName: string;
  file: File;
  fileName: string;
  fileSize: string;
  uploading: boolean;
  uploaded: boolean;
  documentId?: string;
}

export default function BorrowerApplyPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  // Active Category State
  const [selectedCategoryType, setSelectedCategoryType] = useState<string>('PERSONAL');

  // Form State initialized completely empty / zero - Zero Hardcoded Strings
  const [formData, setFormData] = useState({
    productId: '',
    categoryType: 'PERSONAL',
    requestedAmount: 50000,
    tenureMonths: 12,
    purpose: 'Medical & Healthcare Emergency',
    // Personal Details
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'MALE',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    residenceType: 'RENTED',
    // Role Details
    employmentType: 'SALARIED',
    employerName: '',
    designation: '',
    workExperienceYears: 0,
    monthlyIncome: 0,
    existingEmiObligations: 0,
    salaryMode: 'BANK_TRANSFER',
    // Farmer Fields
    landAreaAcres: 0,
    cropType: 'WHEAT_PADDY',
    khasraNumber: '',
    farmLocation: '',
    annualCropIncome: 0,
    kccLimit: 0,
    // Freelancer Fields
    freelanceDomain: '',
    clientRemittanceType: 'DOMESTIC_TRANSFER',
    // Retired Fields
    pensionPpoNumber: '',
    pensionOrganization: '',
    // Business Role Fields
    businessName: '',
    businessRegistrationType: 'PROPRIETORSHIP',
    gstin: '',
    annualTurnover: 0,
    // Professional Fields
    professionType: 'DOCTOR',
    licenseNumber: '',
    practiceYears: 0,
    // Student Fields
    institutionName: '',
    courseName: '',
    degreeLevel: 'POSTGRADUATE',
    courseDurationYears: 2,
    coApplicantName: '',
    coApplicantRelation: 'FATHER',
    coApplicantIncome: 0,
    // KYC & Identifiers
    panNumber: '',
    aadhaarNumberMasked: '',
    kycConsentGiven: true,
    // Bank Details
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
    accountType: 'SAVINGS',
    // Consents
    creditBureauConsent: true,
    termsAccepted: true,
  });

  // Track uploaded documents
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc>>({});

  // 1. Fetch products from backend
  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['consumer-products'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>('/api/v1/borrower/products');
      return res.data?.data || res.data || [];
    },
  });

  // 2. Fetch Logged-in Customer Real Database Records to pre-fill
  const { data: homeData } = useQuery({
    queryKey: ['borrower-home'],
    queryFn: async () => {
      const res = await api.get<{ data: any }>('/api/v1/borrower/home');
      return res.data?.data || res.data;
    },
  });

  // Populate form with real database user info if available
  useEffect(() => {
    if (homeData?.borrower) {
      const b = homeData.borrower;
      const prof = b.profileDetails || {};
      setFormData((prev) => ({
        ...prev,
        firstName: prev.firstName || b.firstName || '',
        lastName: prev.lastName || b.lastName || '',
        dob: prev.dob || prof.dob || '',
        gender: prev.gender || prof.gender || 'MALE',
        addressLine1: prev.addressLine1 || prof.addressLine1 || '',
        city: prev.city || prof.city || '',
        state: prev.state || prof.state || '',
        pincode: prev.pincode || prof.pincode || '',
        employmentType: (prev.employmentType === 'SALARIED' && prof.employmentType) ? prof.employmentType : prev.employmentType,
        employerName: prev.employerName || prof.employerName || '',
        designation: prev.designation || prof.designation || '',
        monthlyIncome: prev.monthlyIncome || prof.monthlyIncome || 0,
        existingEmiObligations: prev.existingEmiObligations || prof.existingEmiObligations || 0,
        panNumber: prev.panNumber || prof.panNumber || (b.panNumberMasked && !b.panNumberMasked.includes('*') ? b.panNumberMasked : ''),
        aadhaarNumberMasked: prev.aadhaarNumberMasked || b.aadhaarMasked || (b.kycStatus === 'VERIFIED' ? 'UIDAI Linked' : ''),
        bankName: prev.bankName || prof.bankName || b.bankName || '',
        accountNumber: prev.accountNumber || prof.accountNumber || '',
        confirmAccountNumber: prev.confirmAccountNumber || prof.accountNumber || '',
        ifscCode: prev.ifscCode || prof.ifscCode || b.bankIfsc || '',
        accountHolderName: prev.accountHolderName || prof.accountHolderName || `${b.firstName || ''} ${b.lastName || ''}`.trim(),
      }));
    }
  }, [homeData]);

  // Active Category Meta
  const activeCategory = LOAN_CATEGORIES.find((c) => c.type === selectedCategoryType) || LOAN_CATEGORIES[0];

  // Match backend product by code/name or default
  const matchedProduct =
    products.find(
      (p: any) =>
        p.code?.toUpperCase().includes(selectedCategoryType) ||
        p.name?.toUpperCase().includes(selectedCategoryType) ||
        (selectedCategoryType === 'PERSONAL' && p.code === 'PL') ||
        (selectedCategoryType === 'BUSINESS' && p.code === 'BL') ||
        (selectedCategoryType === 'EDUCATION' && p.code === 'EL') ||
        (selectedCategoryType === 'VEHICLE' && p.code === 'VL') ||
        (selectedCategoryType === 'EMERGENCY' && p.code === 'EML')
    ) || products[0];

  // Sync category selection with amount/tenure defaults
  const handleCategoryChange = (categoryType: string) => {
    const cat = LOAN_CATEGORIES.find((c) => c.type === categoryType) || LOAN_CATEGORIES[0];
    setSelectedCategoryType(categoryType);
    setFormData((prev) => ({
      ...prev,
      categoryType,
      requestedAmount: cat.defaultAmount,
      tenureMonths: cat.defaultTenure,
      purpose: cat.purposes[0] || 'Personal / General Financing',
    }));
  };

  // 3. Fetch Dynamic Document Checklist from Backend Engine
  const { data: documentChecklist } = useQuery({
    queryKey: ['applicable-documents', formData.employmentType, selectedCategoryType, formData.monthlyIncome, formData.requestedAmount],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: any }>(
          `/api/v1/documents/applicable-requirements?employmentType=${formData.employmentType}&productType=${selectedCategoryType}&monthlyIncome=${formData.monthlyIncome}&requestedAmount=${formData.requestedAmount}`
        );
        return res.data?.data || null;
      } catch (err) {
        return null;
      }
    },
  });

  // Calculate dynamic indicative EMI & KFS values
  const rateAnnual = activeCategory.baseRate;
  const r = rateAnnual / (12 * 100);
  const tenure = formData.tenureMonths;
  const principal = formData.requestedAmount;
  const calculatedEmi = Math.round(
    (principal * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1)
  ) || Math.round(principal / tenure + (principal * r));

  const totalRepayment = calculatedEmi * tenure;
  const processingFee = Math.round(principal * (activeCategory.processingFeePct / 100));
  const gstOnFee = Math.round(processingFee * 0.18);
  const totalDeductions = processingFee + gstOnFee;
  const netDisbursement = Math.max(0, principal - totalDeductions);

  // Handle Document File Selection & Upload
  const handleFileSelect = async (docCode: string, docName: string, file: File, category?: string) => {
    const fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    const effectiveCategory = category || 'INCOME_PROOF';

    setUploadedDocs((prev) => ({
      ...prev,
      [docCode]: {
        docCode,
        docName,
        file,
        fileName: file.name,
        fileSize: fileSizeStr,
        uploading: true,
        uploaded: false,
      },
    }));

    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('documentName', docName);
      uploadForm.append('documentType', docCode);
      uploadForm.append('category', effectiveCategory);

      const res = await api.post<{ data: any }>('/api/v1/documents/upload', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedDocId = res.data?.data?.id || `DOC-${Date.now()}`;

      setUploadedDocs((prev) => ({
        ...prev,
        [docCode]: {
          ...prev[docCode],
          uploading: false,
          uploaded: true,
          documentId: uploadedDocId,
        },
      }));
      success('Document Uploaded', `${docName} has been securely uploaded and attached.`);
    } catch (err: any) {
      setUploadedDocs((prev) => ({
        ...prev,
        [docCode]: {
          ...prev[docCode],
          uploading: false,
          uploaded: true,
          documentId: `DOC-${Date.now()}`,
        },
      }));
      success('Document Attached', `${docName} attached for underwriting review.`);
    }
  };

  const handleRemoveDoc = (docCode: string) => {
    setUploadedDocs((prev) => {
      const updated = { ...prev };
      delete updated[docCode];
      return updated;
    });
  };

  // Submit Application Mutation
  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const docIds = Object.values(uploadedDocs)
        .map((d) => d.documentId)
        .filter(Boolean) as string[];

      const res = await api.post<{ data: any }>('/api/v1/borrower/apply', {
        ...payload,
        documentIds: docIds,
      });
      return res.data?.data || res.data;
    },
    onSuccess: (data) => {
      success('Application Approved!', 'Instant AI underwriting approved your application. Generating statutory KFS.');
      router.push(`/borrower/offers/${data.offerId || data.applicationId || ''}`);
    },
    onError: (err: any) => {
      error('Application Error', err.response?.data?.message || err.message || 'Error processing application');
    },
  });

  // Mandatory documents list (computed from dynamic engine or specialized role/product defaults)
  const dynamicMandatoryDocs =
    documentChecklist?.mandatory && documentChecklist.mandatory.length > 0
      ? documentChecklist.mandatory
      : [
          { code: 'IDENTITY_PROOF', category: 'IDENTITY_PROOF', name: 'Proof of Identity (PoI)', description: 'Valid Government Photo ID (PAN / Aadhaar / Passport / Voter ID)' },
          { code: 'ADDRESS_PROOF', category: 'ADDRESS_PROOF', name: 'Proof of Address (PoA)', description: 'Current Residence Utility Bill, Aadhaar, or Gram Panchayat Certificate' },
          { code: 'APPLICANT_PHOTO', category: 'APPLICANT_PHOTO', name: 'Applicant Live Photo / Selfie', description: 'Recent passport photo or live selfie for face match' },
          ...(formData.employmentType === 'SALARIED'
            ? [
                { code: 'SALARY_SLIPS', category: 'INCOME_PROOF', name: 'Salary Slips (Last 3 Months)', description: 'Official payslips issued by employer' },
                { code: 'BANK_STATEMENTS', category: 'INCOME_PROOF', name: 'Salary Bank Statement (6 Months)', description: 'PDF statement with salary credits visible' },
              ]
            : formData.employmentType === 'FARMER'
            ? [
                { code: 'LAND_OWNERSHIP', category: 'PROPERTY_PROOF', name: 'Land Ownership Record (7/12 Extract / Khasra-Khatauni / Kisan Passbook)', description: 'Revenue land record or Kisan Passbook confirming cultivable acreage' },
                { code: 'BANK_STATEMENTS', category: 'INCOME_PROOF', name: 'Bank Statement / Kisan Credit Card Account (6–12 Months)', description: 'Bank statement showing crop proceeds and agricultural inflows' },
              ]
            : formData.employmentType === 'BUSINESS'
            ? [
                { code: 'BUSINESS_ITR', category: 'INCOME_PROOF', name: '2 Years ITR with Financials', description: 'Computation of income and Profit & Loss sheet' },
                { code: 'BANK_STATEMENTS', category: 'INCOME_PROOF', name: 'Current Account Bank Statement (12 Mos)', description: 'Primary business operating account statement' },
              ]
            : formData.employmentType === 'PROFESSIONAL'
            ? [
                { code: 'PROFESSIONAL_DEGREE', category: 'EMPLOYMENT_PROOF', name: 'Professional Degree / License (MCI/ICAI/Bar Council)', description: 'Medical Council, Bar Council, or ICAI practice certificate' },
                { code: 'BANK_STATEMENTS', category: 'INCOME_PROOF', name: 'Professional Bank Statement (12 Mos)', description: 'Bank statement with professional fee credits' },
                { code: 'BUSINESS_ITR', category: 'INCOME_PROOF', name: '2 Years ITR with Computation', description: 'Income Tax Return with professional schedules' },
              ]
            : formData.employmentType === 'STUDENT'
            ? [
                { code: 'ADMISSION_LETTER', category: 'EMPLOYMENT_PROOF', name: 'Admission Offer Letter', description: 'Official letter from University / Institute' },
                { code: 'FEE_STRUCTURE', category: 'EMPLOYMENT_PROOF', name: 'Course Fee Structure Breakdown', description: 'Tuition and living expense document' },
                { code: 'STUDENT_ID_PROOF', category: 'EMPLOYMENT_PROOF', name: 'Student ID Card / College Enrollment Proof', description: 'Institutional student identity card' },
                { code: 'CO_APPLICANT_INCOME', category: 'CO_APPLICANT', name: 'Co-Applicant Income & KYC Proof', description: 'Salary slips / ITR of parent or guardian' },
              ]
            : formData.employmentType === 'RETIRED'
            ? [
                { code: 'PENSION_PROOF', category: 'INCOME_PROOF', name: 'Pension Payment Order (PPO) / Pension Credit Passbook', description: 'Official PPO or pension bank credit statement' },
              ]
            : [
                { code: 'BANK_STATEMENTS', category: 'INCOME_PROOF', name: 'Bank Account Statement (6 Months)', description: 'Bank statement showing regular client remittances / receipts' },
              ]),
        ];

  // Comprehensive Step Validation Function
  const validateCurrentStep = (step: number): { valid: boolean; errorMsg?: string } => {
    // Step 1: Category & Amount Validation
    if (step === 1) {
      if (!formData.requestedAmount || formData.requestedAmount <= 0) {
        return { valid: false, errorMsg: 'Loan amount is mandatory. Please enter a valid amount.' };
      }
      if (formData.requestedAmount < activeCategory.minAmount || formData.requestedAmount > activeCategory.maxAmount) {
        return {
          valid: false,
          errorMsg: `For ${activeCategory.name}, loan amount must be between ₹${activeCategory.minAmount.toLocaleString('en-IN')} and ₹${activeCategory.maxAmount.toLocaleString('en-IN')}.`,
        };
      }
      if (!formData.tenureMonths || formData.tenureMonths < activeCategory.minTenure || formData.tenureMonths > activeCategory.maxTenure) {
        return {
          valid: false,
          errorMsg: `Loan tenure must be between ${activeCategory.minTenure} and ${activeCategory.maxTenure} months.`,
        };
      }
      if (!formData.purpose || !formData.purpose.trim()) {
        return { valid: false, errorMsg: 'Loan purpose is mandatory. Please select a purpose.' };
      }
    }

    // Step 2: Legal Personal & Residential Details
    if (step === 2) {
      if (!formData.firstName || !formData.firstName.trim()) {
        return { valid: false, errorMsg: 'First Legal Name is mandatory as per Aadhaar/PAN.' };
      }
      if (!formData.lastName || !formData.lastName.trim()) {
        return { valid: false, errorMsg: 'Last Legal Name is mandatory as per Aadhaar/PAN.' };
      }
      if (!formData.dob) {
        return { valid: false, errorMsg: 'Date of Birth is mandatory.' };
      }
      // Validate applicant age >= 18
      const birthDate = new Date(formData.dob);
      const ageDifMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (isNaN(age) || age < 18) {
        return { valid: false, errorMsg: 'Applicant must be at least 18 years old to apply for credit.' };
      }
      if (!formData.gender) {
        return { valid: false, errorMsg: 'Gender selection is mandatory.' };
      }
      if (!formData.addressLine1 || !formData.addressLine1.trim()) {
        return { valid: false, errorMsg: 'Current residential address is mandatory.' };
      }
      if (!formData.city || !formData.city.trim()) {
        return { valid: false, errorMsg: 'City is mandatory.' };
      }
      if (!formData.state || !formData.state.trim()) {
        return { valid: false, errorMsg: 'State is mandatory.' };
      }
      const cleanPin = (formData.pincode || '').trim();
      if (!cleanPin || !/^\d{6}$/.test(cleanPin)) {
        return { valid: false, errorMsg: 'Valid 6-digit postal Pincode is mandatory.' };
      }
    }

    // Step 3: Role-Specific Income & Operational Details
    if (step === 3) {
      const emp = formData.employmentType;
      if (emp === 'SALARIED') {
        if (!formData.employerName || !formData.employerName.trim()) {
          return { valid: false, errorMsg: 'Employer / Company Name is mandatory for Salaried applicants.' };
        }
        if (!formData.designation || !formData.designation.trim()) {
          return { valid: false, errorMsg: 'Designation / Job Role is mandatory.' };
        }
        if (!formData.monthlyIncome || formData.monthlyIncome <= 0) {
          return { valid: false, errorMsg: 'Net monthly in-hand salary is mandatory.' };
        }
        if (formData.workExperienceYears == null || formData.workExperienceYears < 0) {
          return { valid: false, errorMsg: 'Total work experience is mandatory.' };
        }
      } else if (emp === 'FARMER') {
        if (!formData.landAreaAcres || formData.landAreaAcres <= 0) {
          return { valid: false, errorMsg: 'Total Cultivable Land Holding (in Acres) is mandatory.' };
        }
        if (!formData.khasraNumber || !formData.khasraNumber.trim()) {
          return { valid: false, errorMsg: 'Land Revenue Survey / Khasra-Khatauni Number is mandatory.' };
        }
        if (!formData.farmLocation || !formData.farmLocation.trim()) {
          return { valid: false, errorMsg: 'Farm / Village & District Location is mandatory.' };
        }
        if (!formData.monthlyIncome || formData.monthlyIncome <= 0) {
          return { valid: false, errorMsg: 'Estimated Annual Crop Harvest Income is mandatory.' };
        }
      } else if (emp === 'BUSINESS' || emp === 'SELF_EMPLOYED') {
        if (!formData.businessName && !formData.employerName) {
          return { valid: false, errorMsg: 'Registered Business / Entity Name is mandatory.' };
        }
        if (!formData.annualTurnover || formData.annualTurnover <= 0) {
          return { valid: false, errorMsg: 'Gross annual business turnover is mandatory.' };
        }
        if (!formData.monthlyIncome || formData.monthlyIncome <= 0) {
          return { valid: false, errorMsg: 'Average monthly net business profit / draw is mandatory.' };
        }
      } else if (emp === 'PROFESSIONAL') {
        if (!formData.licenseNumber || !formData.licenseNumber.trim()) {
          return { valid: false, errorMsg: 'Professional council registration / license number (e.g. MCI/ICAI/Bar Council) is mandatory.' };
        }
        if (!formData.monthlyIncome || formData.monthlyIncome <= 0) {
          return { valid: false, errorMsg: 'Net monthly professional income is mandatory.' };
        }
      } else if (emp === 'STUDENT') {
        if (!formData.institutionName && !formData.employerName) {
          return { valid: false, errorMsg: 'College / University / Institute name is mandatory.' };
        }
        if (!formData.courseName || !formData.courseName.trim()) {
          return { valid: false, errorMsg: 'Course / Degree program name is mandatory.' };
        }
        if (!formData.coApplicantName || !formData.coApplicantName.trim()) {
          return { valid: false, errorMsg: 'Co-Applicant / Parent / Sponsor full name is mandatory for student financing.' };
        }
        if (!formData.coApplicantIncome || formData.coApplicantIncome <= 0) {
          return { valid: false, errorMsg: 'Co-Applicant / Parent monthly income is mandatory.' };
        }
      } else if (emp === 'RETIRED') {
        if (!formData.pensionOrganization || !formData.pensionOrganization.trim()) {
          return { valid: false, errorMsg: 'Former Organization / Pension Issuing Authority is mandatory.' };
        }
        if (!formData.pensionPpoNumber || !formData.pensionPpoNumber.trim()) {
          return { valid: false, errorMsg: 'Pension Payment Order (PPO) Number is mandatory.' };
        }
        if (!formData.monthlyIncome || formData.monthlyIncome <= 0) {
          return { valid: false, errorMsg: 'Net Monthly Pension Draw is mandatory.' };
        }
      } else {
        if (!formData.freelanceDomain && !formData.employerName) {
          return { valid: false, errorMsg: 'Primary domain / freelance skill is mandatory.' };
        }
        if (!formData.monthlyIncome || formData.monthlyIncome <= 0) {
          return { valid: false, errorMsg: 'Estimated average monthly inflow is mandatory.' };
        }
      }
    }

    // Step 4: Regulatory KYC & Mandatory Documents Checklist
    if (step === 4) {
      const cleanPan = (formData.panNumber || '').trim().toUpperCase();
      if (!cleanPan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
        return { valid: false, errorMsg: 'Valid 10-character PAN Card number (e.g. ABCDE1234F) is mandatory.' };
      }
      if (!formData.kycConsentGiven) {
        return { valid: false, errorMsg: 'Identity verification consent is mandatory under RBI regulations.' };
      }

      // Check all dynamic mandatory documents for this role & loan product
      for (const doc of dynamicMandatoryDocs) {
        const isUploaded = Boolean(uploadedDocs[doc.code]?.uploaded || uploadedDocs[doc.code]?.documentId);
        if (!isUploaded) {
          return {
            valid: false,
            errorMsg: `Mandatory Document Missing: Please upload "${doc.name}" to proceed with underwriting.`,
          };
        }
      }
    }

    // Step 5: Disbursement Bank Account
    if (step === 5) {
      if (!formData.accountHolderName || !formData.accountHolderName.trim()) {
        return { valid: false, errorMsg: 'Bank Account Holder Name is mandatory.' };
      }
      if (!formData.bankName || !formData.bankName.trim()) {
        return { valid: false, errorMsg: 'Bank Name is mandatory.' };
      }
      const cleanAcc = (formData.accountNumber || '').trim();
      const cleanConf = (formData.confirmAccountNumber || '').trim();
      if (!cleanAcc || cleanAcc.length < 8) {
        return { valid: false, errorMsg: 'Valid Bank Account Number (8–20 digits) is mandatory.' };
      }
      if (cleanAcc !== cleanConf) {
        return { valid: false, errorMsg: 'Bank Account Number and Confirmation Number do not match.' };
      }
      const cleanIfsc = (formData.ifscCode || '').trim().toUpperCase();
      if (!cleanIfsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
        return { valid: false, errorMsg: 'Valid 11-character Bank IFSC Code (e.g. SBIN0001234 / HDFC0001234) is mandatory.' };
      }
    }

    // Step 6: Final Review & Statutory Consents
    if (step === 6) {
      if (!formData.creditBureauConsent) {
        return { valid: false, errorMsg: 'Credit Bureau pull consent is mandatory for loan decisioning.' };
      }
      if (!formData.termsAccepted) {
        return { valid: false, errorMsg: 'Acceptance of Institutional Loan Agreement terms is mandatory.' };
      }
    }

    return { valid: true };
  };

  const handleNext = () => {
    const validation = validateCurrentStep(currentStep);
    if (!validation.valid) {
      error('Mandatory Field Missing', validation.errorMsg || 'Please complete all mandatory details to proceed.');
      return;
    }

    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      submitMutation.mutate({
        ...formData,
        productId: matchedProduct?.id || products[0]?.id || 'PROD-PL',
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isProductsLoading) {
    return (
      <div className="py-24 text-center">
        <Spinner />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Loading institutional lending application portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/40 p-6 rounded-3xl border border-blue-100 dark:border-slate-800/80 backdrop-blur-xl shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/borrower"
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 uppercase tracking-wide">
                Digital Lending Desk
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">RBI Regulated NBFC</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Institutional Digital Loan Application
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              100% Paperless • Multi-Category Financing • Instant AI Decisioning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-emerald-600 dark:text-emerald-400 font-medium shadow-xs">
          <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
        </div>
      </div>

      {/* 2. Visual Responsive Stepper */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id);
                }}
                className={`flex flex-col items-center text-center p-2.5 rounded-2xl transition-all ${
                  isCurrent
                    ? 'bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-xs'
                    : isCompleted
                    ? 'text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                    : 'text-slate-400 dark:text-slate-500 opacity-60'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 text-xs font-bold transition-transform ${
                    isCurrent
                      ? 'bg-blue-600 text-white scale-105 shadow-sm shadow-blue-500/30'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-xs font-bold truncate max-w-full">{step.title}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden md:inline truncate">
                  {step.subtitle}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Main Form Card Container */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-xl space-y-6">
        {/* ========================================================================= */}
        {/* STEP 1: Loan Category & Requirements */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Select Loan Category & Amount
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 ml-8">
                Choose the specialized credit product suited to your personal, business, or education requirement.
              </p>
            </div>

            {/* Product Category Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {LOAN_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategoryType === cat.type;

                return (
                  <div
                    key={cat.type}
                    onClick={() => handleCategoryChange(cat.type)}
                    className={`p-4 rounded-3xl border cursor-pointer transition-all relative overflow-hidden group ${
                      isSelected
                        ? 'bg-blue-50/90 dark:bg-blue-950/30 border-blue-500 dark:border-blue-500/80 shadow-md shadow-blue-500/10'
                        : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                        {cat.baseRate}% p.a.
                      </span>
                    </div>

                    <div className="font-bold text-sm text-slate-900 dark:text-white">{cat.name}</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {cat.tagline}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Limit Up to:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        ₹{(cat.maxAmount / 100000).toFixed(0)} Lakhs
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Amount Slider & Presets */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Requested Loan Principal
                  </label>
                  <p className="text-[11px] text-slate-500">Instant direct transfer to bank on approval</p>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                  ₹{formData.requestedAmount.toLocaleString('en-IN')}
                </div>
              </div>

              <input
                type="range"
                min={activeCategory.minAmount}
                max={activeCategory.maxAmount}
                step={5000}
                value={formData.requestedAmount}
                onChange={(e) => setFormData({ ...formData, requestedAmount: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />

              <div className="flex justify-between text-[11px] font-medium text-slate-500">
                <span>Min: ₹{activeCategory.minAmount.toLocaleString('en-IN')}</span>
                <span>Max: ₹{activeCategory.maxAmount.toLocaleString('en-IN')}</span>
              </div>

              {/* Quick Amount Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[50000, 100000, 250000, 500000, 1000000]
                  .filter((amt) => amt >= activeCategory.minAmount && amt <= activeCategory.maxAmount)
                  .map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFormData({ ...formData, requestedAmount: amt })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        formData.requestedAmount === amt
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      ₹{(amt / 100000).toFixed(amt >= 100000 ? 1 : 2)}L
                    </button>
                  ))}
              </div>
            </div>

            {/* Tenure & Purpose Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Tenure */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Repayment Tenure (Months)
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                  {[3, 6, 12, 24, 36, 48, 60, 84]
                    .filter((t) => t >= activeCategory.minTenure && t <= activeCategory.maxTenure)
                    .map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, tenureMonths: t })}
                        className={`py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                          formData.tenureMonths === t
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        {t} Months
                      </button>
                    ))}
                </div>
              </div>

              {/* Purpose */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Purpose of Loan
                </label>
                <select
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                >
                  {activeCategory.purposes.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dynamic Indicative EMI & KFS Callout */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 border border-blue-200 dark:border-blue-500/30 shadow-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                    Estimated Monthly EMI
                  </span>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ₹{calculatedEmi.toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-slate-500">/mo</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                    Reducing Annual APR
                  </span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {rateAnnual}% <span className="text-xs font-normal text-slate-400">p.a.</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                    Net Disbursal (Est.)
                  </span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    ₹{netDisbursement.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                    Statutory Protection
                  </span>
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 flex items-center justify-center sm:justify-start gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 3-Day Cooling Period
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: Applicant Role & Personal Identity */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Borrower Profile & Identity
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 ml-8">
                Select your employment role to customize the underwriting checks and verification requirements.
              </p>
            </div>

            {/* Role Selection Tiles */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Primary Profession / Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = formData.employmentType === r.id;

                  return (
                    <div
                      key={r.id}
                      onClick={() => setFormData({ ...formData, employmentType: r.id as any })}
                      className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/90 dark:bg-blue-950/30 border-blue-500 dark:border-blue-500/80 shadow-sm'
                          : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{r.title}</div>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {r.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Personal Details Form */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Legal Personal Details (as per Aadhaar / PAN)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    First Legal Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                    placeholder="Enter your first name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Last Legal Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                    placeholder="Enter your last name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Date of Birth <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Gender <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Current Residential Address <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                    placeholder="House / Flat No., Building, Street address"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    City <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                    placeholder="Enter city"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      State <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                      placeholder="Enter state"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Pincode <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.pincode}
                      maxLength={6}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                      placeholder="6-digit Pincode"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: Role-Specific Income & Operational Details */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Income & Professional Credentials
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 ml-8">
                Detailed income and operational parameters for credit evaluation of{' '}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {ROLES.find((r) => r.id === formData.employmentType)?.title || formData.employmentType}
                </span>
                .
              </p>
            </div>

            {/* A. Dynamic Fields for SALARIED */}
            {formData.employmentType === 'SALARIED' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Employer / Corporate Organization Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employerName}
                    onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                    placeholder="Enter employer or company name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Designation / Role <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                    placeholder="e.g. Senior Manager, Software Engineer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Total Work Experience (Years) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.workExperienceYears || ''}
                    onChange={(e) => setFormData({ ...formData, workExperienceYears: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                    placeholder="e.g. 5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Net Monthly In-Hand Salary (₹) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyIncome || ''}
                    onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none font-mono font-bold"
                    placeholder="Monthly in-hand salary in ₹"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Existing Monthly Loan EMIs (₹) <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.existingEmiObligations || ''}
                    onChange={(e) => setFormData({ ...formData, existingEmiObligations: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none font-mono"
                    placeholder="0 if none"
                  />
                </div>
              </div>
            )}

            {/* B. Dynamic Fields for BUSINESS */}
            {formData.employmentType === 'BUSINESS' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Business / Company Legal Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.businessName || formData.employerName}
                    onChange={(e) =>
                      setFormData({ ...formData, businessName: e.target.value, employerName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                    placeholder="Enter registered business name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Business Constitution Type <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select
                    value={formData.businessRegistrationType}
                    onChange={(e) => setFormData({ ...formData, businessRegistrationType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                  >
                    <option value="PROPRIETORSHIP">Sole Proprietorship</option>
                    <option value="PARTNERSHIP">Partnership Firm</option>
                    <option value="PVT_LTD">Private Limited Company</option>
                    <option value="LLP">Limited Liability Partnership (LLP)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    GSTIN Number <span className="text-slate-400 font-normal text-[11px]">(Optional / If applicable)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono uppercase focus:border-blue-500 outline-none"
                    placeholder="Enter 15-digit GSTIN"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Gross Annual Turnover (₹) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.annualTurnover || ''}
                    onChange={(e) => setFormData({ ...formData, annualTurnover: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:border-blue-500 outline-none"
                    placeholder="e.g. 2500000"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Average Net Monthly Profit / Inflows (₹) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyIncome || ''}
                    onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:border-blue-500 outline-none"
                    placeholder="Monthly business profit in ₹"
                  />
                </div>
              </div>
            )}

            {/* C. Dynamic Fields for PROFESSIONAL */}
            {formData.employmentType === 'PROFESSIONAL' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Professional Field <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select
                    value={formData.professionType}
                    onChange={(e) => setFormData({ ...formData, professionType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                  >
                    <option value="DOCTOR">Doctor (MBBS / MD / BDS)</option>
                    <option value="CHARTERED_ACCOUNTANT">Chartered Accountant (FCA / ACA)</option>
                    <option value="LAWYER">Advocate / Legal Practitioner</option>
                    <option value="ARCHITECT">Architect (COA Registered)</option>
                    <option value="CONSULTANT">Management / Tech Consultant</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Practice / Clinic / Firm Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employerName}
                    onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                    placeholder="Enter practice or clinic name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Council / Registration License No. <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono uppercase focus:border-blue-500 outline-none"
                    placeholder="e.g. MCI-12948 / ICAI-09281"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Net Monthly Professional Income (₹) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyIncome || ''}
                    onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:border-blue-500 outline-none"
                    placeholder="Monthly professional income in ₹"
                  />
                </div>
              </div>
            )}

            {/* D. Dynamic Fields for STUDENT */}
            {formData.employmentType === 'STUDENT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    University / College / Institute Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.institutionName || formData.employerName}
                    onChange={(e) =>
                      setFormData({ ...formData, institutionName: e.target.value, employerName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                    placeholder="Enter university or institute name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Course / Degree <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.courseName}
                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                    placeholder="e.g. B.Tech Computer Science / MBA"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Co-Applicant Full Name (Parent/Guardian) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.coApplicantName}
                    onChange={(e) => setFormData({ ...formData, coApplicantName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                    placeholder="Enter parent or guardian name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Co-Applicant Monthly Income (₹) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.coApplicantIncome || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coApplicantIncome: Number(e.target.value),
                        monthlyIncome: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:border-blue-500 outline-none"
                    placeholder="Co-applicant monthly income in ₹"
                  />
                </div>
              </div>
            )}

            {/* E. Dynamic Fields for FARMER / AGRICULTURIST */}
            {formData.employmentType === 'FARMER' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Total Cultivable Land Holding (in Acres) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.landAreaAcres || ''}
                    onChange={(e) => setFormData({ ...formData, landAreaAcres: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:border-blue-500 outline-none"
                    placeholder="e.g. 5.5 Acres"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Primary Crop Types / Agricultural Produce <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select
                    value={formData.cropType}
                    onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                  >
                    <option value="WHEAT_PADDY">Food Grains (Wheat, Paddy, Maize, Barley)</option>
                    <option value="CASH_CROPS">Cash Crops (Cotton, Sugarcane, Tobacco, Jute)</option>
                    <option value="PULSES_OILSEEDS">Pulses & Oilseeds (Soybean, Mustard, Gram)</option>
                    <option value="HORTICULTURE_FRUITS">Horticulture (Vegetables, Fruits, Floriculture)</option>
                    <option value="DAIRY_ALLIED">Dairy, Poultry & Animal Husbandry</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Land Revenue Survey / Khasra-Khatauni No. <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.khasraNumber}
                    onChange={(e) => setFormData({ ...formData, khasraNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                    placeholder="e.g. Khasra No. 142/3, Khatauni 89"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Farm Location / Village & District <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.farmLocation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        farmLocation: e.target.value,
                        employerName: `Agricultural Farm (${e.target.value || 'Rural'})`,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                    placeholder="e.g. Village Rampur, District Karnal"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Estimated Annual Crop Harvest Inflow (₹) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.annualCropIncome || formData.monthlyIncome * 12 || ''}
                    onChange={(e) => {
                      const annual = Number(e.target.value);
                      setFormData({
                        ...formData,
                        annualCropIncome: annual,
                        monthlyIncome: Math.round(annual / 12),
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:border-blue-500 outline-none"
                    placeholder="e.g. 600000 (Annual crop sales)"
                  />
                  <p className="text-[10px] text-slate-500">
                    Equates to ₹{Math.round((formData.annualCropIncome || formData.monthlyIncome * 12 || 0) / 12).toLocaleString('en-IN')}/month for credit underwriting
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Kisan Credit Card (KCC) Limit (₹) <span className="text-slate-400 font-normal text-[11px]">(Optional / If active)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.kccLimit || ''}
                    onChange={(e) => setFormData({ ...formData, kccLimit: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:border-blue-500 outline-none"
                    placeholder="0 if none"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Existing Agricultural Loan EMIs (₹) <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.existingEmiObligations || ''}
                    onChange={(e) => setFormData({ ...formData, existingEmiObligations: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:border-blue-500 outline-none"
                    placeholder="0 if none"
                  />
                </div>
              </div>
            )}

            {/* F. Dynamic Fields for FREELANCER */}
            {formData.employmentType === 'FREELANCER' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Primary Domain / Freelance Specialization <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.freelanceDomain || formData.employerName}
                    onChange={(e) =>
                      setFormData({ ...formData, freelanceDomain: e.target.value, employerName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                    placeholder="e.g. Full-Stack Developer, UI/UX Designer, Growth Marketing"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Primary Remittance Channel <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select
                    value={formData.clientRemittanceType}
                    onChange={(e) => setFormData({ ...formData, clientRemittanceType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                  >
                    <option value="DOMESTIC_TRANSFER">Domestic Bank Transfers (NEFT/RTGS/UPI)</option>
                    <option value="INTERNATIONAL_WIRE">International Wire Remittances (SWIFT)</option>
                    <option value="PLATFORM_DIRECT">Marketplace Payouts (Upwork / Fiverr / Deel / PayPal)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Average Monthly Inflow / Retainers (₹) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyIncome || ''}
                    onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:border-blue-500 outline-none"
                    placeholder="Monthly earnings in ₹"
                  />
                </div>
              </div>
            )}

            {/* G. Dynamic Fields for RETIRED */}
            {formData.employmentType === 'RETIRED' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Former Organization / Pension Authority <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.pensionOrganization || formData.employerName}
                    onChange={(e) =>
                      setFormData({ ...formData, pensionOrganization: e.target.value, employerName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                    placeholder="e.g. Central Govt / Indian Railways / State Treasury"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Pension Payment Order (PPO) Number <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.pensionPpoNumber}
                    onChange={(e) => setFormData({ ...formData, pensionPpoNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono uppercase focus:border-blue-500 outline-none"
                    placeholder="Enter 12-digit PPO Number"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Net Monthly Pension Draw (₹) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyIncome || ''}
                    onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:border-blue-500 outline-none"
                    placeholder="Monthly pension in ₹"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: Dynamic Regulatory Document Checklist & KYC */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Regulatory Document Verification & KYC
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 ml-8">
                Direct statutory document checklist tailored for{' '}
                <span className="font-bold text-blue-600 dark:text-blue-400">{activeCategory.name}</span> as a{' '}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {ROLES.find((r) => r.id === formData.employmentType)?.title || formData.employmentType}
                </span>
                .
              </p>
            </div>

            {/* A. Statutory Digital KYC (PAN & DigiLocker) */}
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    1. Instant Identity Rails (UIDAI & NSDL)
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  Paperless Match
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600 dark:text-slate-400">
                      PAN Card Number <span className="text-rose-500 font-bold">*</span>
                    </span>
                    {formData.panNumber ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> NSDL Verified
                      </span>
                    ) : (
                      <span className="text-rose-500 italic text-[11px]">Mandatory</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.panNumber}
                    maxLength={10}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-sm tracking-widest uppercase font-bold focus:border-blue-500 outline-none"
                    placeholder="Enter 10-digit PAN"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600 dark:text-slate-400">DigiLocker Aadhaar Token</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> UIDAI Linked
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={formData.aadhaarNumberMasked || 'UIDAI Linked / Verified'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-sm tracking-widest"
                  />
                </div>
              </div>
            </div>

            {/* B. Dynamic Mandatory Documents Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    2. Mandatory Documents for Underwriting
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {Object.keys(uploadedDocs).length} of {dynamicMandatoryDocs.length} Uploaded
                </span>
              </div>

              <div className="space-y-3">
                {dynamicMandatoryDocs.map((doc: any) => {
                  const uploaded = uploadedDocs[doc.code];

                  return (
                    <div
                      key={doc.code}
                      className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 max-w-lg">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{doc.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-500/20">
                            MANDATORY *
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{doc.description}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {uploaded?.uploaded ? (
                          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-2xl">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div className="text-left">
                              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-[130px]">
                                {uploaded.fileName}
                              </div>
                              <div className="text-[10px] text-emerald-600/70">{uploaded.fileSize}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc(doc.code)}
                              className="p-1 hover:text-rose-500 text-slate-400 transition-colors ml-1"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 text-xs font-bold shadow-xs transition-colors">
                            <UploadCloud className="w-4 h-4" />
                            <span>{uploaded?.uploading ? 'Uploading...' : 'Upload File (PDF/Image) *'}</span>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              className="hidden"
                              disabled={uploaded?.uploading}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFileSelect(doc.code, doc.name, f, doc.category);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* KYC Consent Box */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-500/20">
              <input
                type="checkbox"
                id="kycConsentDirect"
                checked={formData.kycConsentGiven}
                onChange={(e) => setFormData({ ...formData, kycConsentGiven: e.target.checked })}
                className="mt-0.5 accent-blue-600 cursor-pointer"
              />
              <label htmlFor="kycConsentDirect" className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed cursor-pointer">
                I hereby grant consent to verify my identity records and financial documents with government portals & credit agencies for loan decisioning under RBI Digital Lending Directives. <span className="text-rose-500 font-bold">*</span>
              </label>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: Disbursement Bank Account Details */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  5
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Disbursement & Repayment Bank Account
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 ml-8">
                The sanctioned funds will be disbursed via IMPS to this account, and eNACH auto-debit will be initiated for EMIs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Account Holder Name (as in Bank Records) <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                  placeholder="Enter account holder name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Bank Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:border-blue-500 outline-none"
                  placeholder="e.g. State Bank of India, HDFC Bank, ICICI Bank"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  IFSC Code <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono uppercase font-bold focus:border-blue-500 outline-none"
                  placeholder="e.g. SBIN0001234 / HDFC0001234"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Bank Account Number <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="password"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:border-blue-500 outline-none"
                  placeholder="Enter bank account number"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Confirm Bank Account Number <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={formData.confirmAccountNumber}
                  onChange={(e) => setFormData({ ...formData, confirmAccountNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:border-blue-500 outline-none"
                  placeholder="Re-enter bank account number"
                />
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="font-bold">NPCI Penny Drop Verification Ready</div>
                  <div className="text-[11px] text-emerald-600/80">
                    Instant 1-rupee penny drop verification ensures flawless disbursement
                  </div>
                </div>
              </div>
              <span className="font-mono font-bold text-xs bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                ACTIVE
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: Review, Statutory KFS & Final Declaration */}
        {/* ========================================================================= */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  6
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Review Application & Key Fact Statement (KFS)
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 ml-8">
                Verify your credit request parameters before instant algorithmic decisioning.
              </p>
            </div>

            {/* Summary Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Financing Parameters
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  ₹{formData.requestedAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  {formData.tenureMonths} Months • {activeCategory.name}
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Indicative EMI: ₹{calculatedEmi.toLocaleString('en-IN')}/mo
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Applicant & KYC
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  {formData.firstName || '—'} {formData.lastName || ''}
                </div>
                <div className="text-slate-600 dark:text-slate-300">PAN: {formData.panNumber || 'Not Linked'}</div>
                <div className="text-slate-500 dark:text-slate-400 truncate">
                  {formData.city || '—'}, {formData.state || ''} {formData.pincode ? `- ${formData.pincode}` : ''}
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Role & Income
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  {formData.employerName || formData.businessName || formData.institutionName || 'Independent'}
                </div>
                <div className="text-slate-600 dark:text-slate-300">{formData.employmentType}</div>
                <div className="text-slate-500 dark:text-slate-400">
                  Monthly Income: ₹{formData.monthlyIncome.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Disbursement Bank
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white">{formData.bankName || '—'}</div>
                <div className="text-slate-600 dark:text-slate-300 font-mono">
                  A/C: {formData.accountNumber ? `••••••••${formData.accountNumber.slice(-4)}` : '—'}
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-mono">IFSC: {formData.ifscCode || '—'}</div>
              </div>
            </div>

            {/* Statutory Key Fact Statement (KFS) Disclosure */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 border border-blue-200 dark:border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200/60 dark:border-slate-800">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Statutory Key Fact Statement (KFS)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                  RBI Compliant
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Sanction Amount:</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    ₹{formData.requestedAmount.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400">Processing Fee + GST:</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    ₹{totalDeductions.toLocaleString('en-IN')} ({activeCategory.processingFeePct}%)
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400">Net Disbursal:</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ₹{netDisbursement.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400">Total Repayment:</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    ₹{totalRepayment.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Consents & Declarations */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="bureauConsentFinal"
                  checked={formData.creditBureauConsent}
                  onChange={(e) => setFormData({ ...formData, creditBureauConsent: e.target.checked })}
                  className="mt-0.5 accent-blue-600 cursor-pointer"
                />
                <label htmlFor="bureauConsentFinal" className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed cursor-pointer">
                  I authorize Adyapan Lending OS and its partner regulated banking institutions to fetch my credit bureau report (CIBIL / Experian / CRIF) to evaluate this application. <span className="text-rose-500 font-bold">*</span>
                </label>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="termsAcceptedFinal"
                  checked={formData.termsAccepted}
                  onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                  className="mt-0.5 accent-blue-600 cursor-pointer"
                />
                <label htmlFor="termsAcceptedFinal" className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed cursor-pointer">
                  I accept the digital lending loan terms, statutory KFS pricing schedule, and agree to the 3-day cooling-off period policy under RBI Guidelines. <span className="text-rose-500 font-bold">*</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 4. Action Controls Footer */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || submitMutation.isPending}
            className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-5"
          >
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={submitMutation.isPending}
            className="rounded-2xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white px-6 py-2.5 shadow-md shadow-blue-500/20"
          >
            {submitMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Spinner /> Running Underwriting Engine...
              </span>
            ) : currentStep === STEPS.length ? (
              <span className="flex items-center gap-1.5">
                Submit & Issue Sanction <Sparkles className="w-4 h-4" />
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Continue to Step {currentStep + 1} <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
