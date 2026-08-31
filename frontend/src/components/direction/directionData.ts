import {
  Briefcase,
  Home,
  GraduationCap,
  HeartPulse,
  Sparkles,
  LucideIcon,
} from 'lucide-react';

export type DirectionId = 'business' | 'home' | 'study' | 'emergency' | 'create';

export interface DirectionData {
  id: DirectionId;
  label: string;
  shortTitle: string;
  tagline: string;
  themeColor: string;
  accentHex: string;
  badgeBg: string;
  badgeText: string;
  cardBorder: string;
  gradient: string;
  bgGlow: string;
  imageSrc: string;
  icon: LucideIcon;
  defaultAmount: number;
  minAmount: number;
  maxAmount: number;
  defaultTenure: number;
  minTenure: number;
  maxTenure: number;
  interestRate: number; // annual percentage
  zeroPercentSplitEligible: boolean;
  speedBadge: string;
  story: {
    hero: string;
    personaName: string;
    personaRole: string;
    personaLocation: string;
    personaQuote: string;
    actionTaken: string;
    amountFunded: string;
    impactMetric: string;
  };
  features: string[];
  recommendedFor: string[];
  transparentTerms: {
    foreclosureFee: string;
    processingFee: string;
    hiddenCharges: string;
    disbursalMethod: string;
  };
}

export const DIRECTIONS: Record<DirectionId, DirectionData> = {
  business: {
    id: 'business',
    label: 'START A BUSINESS',
    shortTitle: 'Business & Merchant Growth',
    tagline: 'From inventory to new outlets — fuel your enterprise without pledge or pause.',
    themeColor: 'amber',
    accentHex: '#d97706',
    badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
    badgeText: 'text-amber-800',
    cardBorder: 'border-amber-200 hover:border-amber-400',
    gradient: 'from-amber-500 via-orange-500 to-amber-600',
    bgGlow: 'rgba(245, 158, 11, 0.12)',
    imageSrc: '/images/business_sketch.jpg',
    icon: Briefcase,
    defaultAmount: 350000,
    minAmount: 50000,
    maxAmount: 2500000,
    defaultTenure: 18,
    minTenure: 3,
    maxTenure: 36,
    interestRate: 11.25,
    zeroPercentSplitEligible: true,
    speedBadge: '⚡ 4-Hour Express Commercial Verification',
    story: {
      hero: 'The moment before the second kitchen opened.',
      personaName: 'Aarav Mehta',
      personaRole: 'Founder, CloudBites Kitchens',
      personaLocation: 'Indiranagar, Bengaluru',
      personaQuote: 'We had the customer demand but lacked ₹3.5 Lakhs for commercial blast chillers. Adyapan disbursed before our Monday launch with zero collateral.',
      actionTaken: 'Expanded kitchen capacity by 200%',
      amountFunded: '₹3,50,000',
      impactMetric: '+140% Monthly Revenue',
    },
    features: [
      'Reusable revolving credit line for working capital',
      'Pay interest only on funds drawn, not the full sanctioned limit',
      'Direct GST & Current Account invoice financing enabled',
      '₹0 early prepayment penalty after first 30 days',
    ],
    recommendedFor: [
      'Inventory stocking ahead of festive seasons',
      'Point-of-sale hardware & machinery upgrades',
      'Marketing & digital store expansion',
      'Bridging B2B client payment cycles',
    ],
    transparentTerms: {
      foreclosureFee: '₹0 (Zero Foreclosure Penalty)',
      processingFee: '0.99% flat (Transparent Cap)',
      hiddenCharges: 'None. Documented in Key Fact Statement (KFS)',
      disbursalMethod: 'Direct to Current / Savings Bank via RTGS/IMPS',
    },
  },
  home: {
    id: 'home',
    label: 'BUILD YOUR HOME',
    shortTitle: 'Home Improvement & Living Space',
    tagline: 'Modernize your kitchen, furnish your sanctuary, or cover lease deposits with poise.',
    themeColor: 'emerald',
    accentHex: '#059669',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    badgeText: 'text-emerald-800',
    cardBorder: 'border-emerald-200 hover:border-emerald-400',
    gradient: 'from-emerald-500 via-teal-500 to-emerald-600',
    bgGlow: 'rgba(16, 185, 129, 0.12)',
    imageSrc: '/images/home_sketch.jpg',
    icon: Home,
    defaultAmount: 200000,
    minAmount: 30000,
    maxAmount: 1500000,
    defaultTenure: 12,
    minTenure: 3,
    maxTenure: 24,
    interestRate: 10.5,
    zeroPercentSplitEligible: true,
    speedBadge: '⚡ Instant 90-Second Paperless Approval',
    story: {
      hero: 'The moment before keys met the lock.',
      personaName: 'Sneha & Rohan Kulkarni',
      personaRole: 'Design Architect & Product Lead',
      personaLocation: 'Baner, Pune',
      personaQuote: 'Our apartment landlord required a ₹2 Lakh security deposit and we needed modular interiors. Adyapan structured it in 3 interest-free split payments without disturbing our savings.',
      actionTaken: 'Complete eco-friendly interior renovation',
      amountFunded: '₹2,00,000',
      impactMetric: 'Saved ₹18,400 in interest vs credit cards',
    },
    features: [
      'Split in 3 months at 0% extra interest option available',
      'Flexible tenures tailored for modular kitchen and furniture vendors',
      'Zero physical home inspection or verification hassle',
      'Digital auto-mandate via e-NACH / UPI Autopay',
    ],
    recommendedFor: [
      'Modular kitchen & interior carpentry upgrades',
      'Rooftop solar panel installation',
      'Rental security deposit & brokerage funding',
      'Smart home automation and appliances',
    ],
    transparentTerms: {
      foreclosureFee: '₹0 (Zero Foreclosure Penalty)',
      processingFee: '0.75% one-time onboarding',
      hiddenCharges: 'Zero surprise insurance markups',
      disbursalMethod: 'Instant UPI to vendor or account credit',
    },
  },
  study: {
    id: 'study',
    label: 'STUDY FURTHER',
    shortTitle: 'Education, Degrees & Upskilling',
    tagline: 'Invest in your intellect. Pay semester tuition, AI bootcamps, or foreign exams effortlessly.',
    themeColor: 'sky',
    accentHex: '#0284c7',
    badgeBg: 'bg-sky-50 border-sky-200 text-sky-800',
    badgeText: 'text-sky-800',
    cardBorder: 'border-sky-200 hover:border-sky-400',
    gradient: 'from-sky-500 via-indigo-500 to-blue-600',
    bgGlow: 'rgba(2, 132, 199, 0.12)',
    imageSrc: '/images/study_sketch.jpg',
    icon: GraduationCap,
    defaultAmount: 120000,
    minAmount: 15000,
    maxAmount: 1000000,
    defaultTenure: 9,
    minTenure: 2,
    maxTenure: 24,
    interestRate: 9.75,
    zeroPercentSplitEligible: true,
    speedBadge: '⚡ 60-Second Student & Professional Sanction',
    story: {
      hero: 'The moment before the acceptance letter was signed.',
      personaName: 'Devika Nair',
      personaRole: 'Data Scientist & AI Fellow',
      personaLocation: 'HSR Layout, Bengaluru',
      personaQuote: 'Getting into the Advanced Generative AI Certification meant a ₹1.2L fee deadline within 48 hours. Adyapan approved my profile with zero collateral and a 9-month student-friendly tenure.',
      actionTaken: 'Enrolled in Global Machine Learning Fellowship',
      amountFunded: '₹1,20,000',
      impactMetric: 'Transitioned to Senior AI Engineer (+85% CTC)',
    },
    features: [
      'Subsidized 9.75% starting rate for accredited technical & degree programs',
      'Moratorium option: Pay interest-only while finishing your coursework',
      'Co-borrower flexibility (Parents, Siblings, or Self-Financed)',
      'Direct institutional fee transfer with instant fee receipt',
    ],
    recommendedFor: [
      'Tech bootcamps, cloud certifications & AI diplomas',
      'Executive MBA & part-time master degrees',
      'IELTS, GRE, GMAT application & visa processing fees',
      'High-performance laptop & research workstation financing',
    ],
    transparentTerms: {
      foreclosureFee: '₹0 (Prepay anytime when bonus/stipend arrives)',
      processingFee: '₹0 for accredited university programs',
      hiddenCharges: '100% transparent fee schedule upfront',
      disbursalMethod: 'Direct to Institute or Student Bank Account',
    },
  },
  emergency: {
    id: 'emergency',
    label: 'HANDLE AN EMERGENCY',
    shortTitle: 'Instant Medical & Emergency Buffer',
    tagline: 'When life happens fast, money moves faster. Zero-friction disbursal in under 90 seconds.',
    themeColor: 'rose',
    accentHex: '#e11d48',
    badgeBg: 'bg-rose-50 border-rose-200 text-rose-800',
    badgeText: 'text-rose-800',
    cardBorder: 'border-rose-200 hover:border-rose-400',
    gradient: 'from-rose-500 via-red-500 to-rose-600',
    bgGlow: 'rgba(244, 63, 94, 0.12)',
    imageSrc: '/images/emergency_sketch.jpg',
    icon: HeartPulse,
    defaultAmount: 75000,
    minAmount: 10000,
    maxAmount: 500000,
    defaultTenure: 6,
    minTenure: 1,
    maxTenure: 18,
    interestRate: 11.5,
    zeroPercentSplitEligible: true,
    speedBadge: '⚡ 90-Second Instant UPI Cash Disbursal',
    story: {
      hero: 'The moment before everything got back on track.',
      personaName: 'Vikram Joshi',
      personaRole: 'Operations Manager',
      personaLocation: 'Cyber City, Gurugram',
      personaQuote: 'My father needed unexpected cardiac diagnostics and hospital admission deposit. In 90 seconds, ₹75,000 landed directly in my Google Pay account at 2 AM without calling a single person.',
      actionTaken: 'Immediate hospital admission & care cleared',
      amountFunded: '₹75,000',
      impactMetric: 'Funded in 84 seconds at 2:14 AM',
    },
    features: [
      '24/7/365 Automated algorithmic disbursal — works at midnight and on bank holidays',
      'Instant UPI payout to PhonePe, Google Pay, Paytm, or BHIM',
      'Zero paperwork — 100% Aadhaar DigiLocker e-KYC',
      '30-day interest holiday on urgent medical hospital bills',
    ],
    recommendedFor: [
      'Unplanned medical diagnostics, dental & hospital admission deposits',
      'Emergency vehicle repairs and transit maintenance',
      'Urgent family travel and unforeseen logistics',
      'Temporary cash-flow buffer between salary credit dates',
    ],
    transparentTerms: {
      foreclosureFee: '₹0 (Close the loan the moment salary hits)',
      processingFee: '₹0 on medical emergency loans under ₹50,000',
      hiddenCharges: 'Zero hidden insurance or cancellation deductions',
      disbursalMethod: 'Direct 24/7 UPI VPA or IMPS Bank Credit',
    },
  },
  create: {
    id: 'create',
    label: 'MAKE SOMETHING HAPPEN',
    shortTitle: 'Gear, Travel & Life Upgrades',
    tagline: 'Don’t postpone your dream project. Studio cameras, expeditions, or creative gear ready now.',
    themeColor: 'purple',
    accentHex: '#9333ea',
    badgeBg: 'bg-purple-50 border-purple-200 text-purple-800',
    badgeText: 'text-purple-800',
    cardBorder: 'border-purple-200 hover:border-purple-400',
    gradient: 'from-purple-500 via-fuchsia-500 to-indigo-600',
    bgGlow: 'rgba(168, 85, 247, 0.12)',
    imageSrc: '/images/create_sketch.jpg',
    icon: Sparkles,
    defaultAmount: 90000,
    minAmount: 10000,
    maxAmount: 750000,
    defaultTenure: 6,
    minTenure: 2,
    maxTenure: 18,
    interestRate: 10.9,
    zeroPercentSplitEligible: true,
    speedBadge: '⚡ 2-Minute Pre-Approved Digital Sanction',
    story: {
      hero: 'The moment before the first frame was captured.',
      personaName: 'Tanya Sengupta',
      personaRole: 'Cinematographer & Content Creator',
      personaLocation: 'Bandra West, Mumbai',
      personaQuote: 'I landed a documentary commission in Ladakh but needed high-altitude cinema lenses. Adyapan’s 3-month split gave me the gear right away with 0% extra interest.',
      actionTaken: 'Procured 4K Cinema Gear & Production Kit',
      amountFunded: '₹90,000',
      impactMetric: 'Delivered 8 Episode OTT Documentary Series',
    },
    features: [
      'Slice-inspired "Split in 3" @ 0% extra interest or easy monthly installments',
      'Seamless integration with offline electronics merchants and e-commerce checkouts',
      'Boost your credit limit dynamically as you repay on time',
      'Instant virtual card credentials for digital payments',
    ],
    recommendedFor: [
      'Cinema cameras, drones, podcast microphones and studio gear',
      'Solo expeditions, Himalayan treks and international travel tickets',
      'Professional certification workstations and Apple/Dell hardware',
      'Milestone life celebrations and creative project releases',
    ],
    transparentTerms: {
      foreclosureFee: '₹0 at all times',
      processingFee: '₹0 on 3-month split plans',
      hiddenCharges: 'No card maintenance or annual charges',
      disbursalMethod: 'Instant UPI / Virtual Card / Direct Bank Transfer',
    },
  },
};
