export type ResourceCategory =
  | 'ALL'
  | 'BANKING'
  | 'LENDING'
  | 'PAYMENTS'
  | 'RISK'
  | 'TECHNOLOGY';

export type ResourceType =
  | 'INSIGHTS'
  | 'GUIDES'
  | 'EXPLAINERS'
  | 'CASE STUDIES'
  | 'PRODUCT STORIES'
  | 'REPORTS';

export interface ResourceItem {
  id: string;
  title: string;
  category: ResourceCategory;
  type: ResourceType;
  date: string;
  readTime: string;
  excerpt: string;
  keyTakeaway: string;
  author: {
    name: string;
    role: string;
  };
  tags: string[];
  body: string[];
  architecturalNote?: string;
}

export interface TopicCategory {
  id: string;
  title: string;
  category: ResourceCategory;
  description: string;
  articleCount: number;
  highlightMetric: string;
  technicalLabel: string;
  blueprintIcon: string;
}

export interface FintechConcept {
  id: string;
  name: string;
  tagline: string;
  category: string;
  steps: {
    number: string;
    stage: string;
    description: string;
    technicalInvariant: string;
  }[];
  summary: string;
}

export interface SystemUpdate {
  version: string;
  date: string;
  category: string;
  title: string;
  description: string;
  invariantsVerified: string[];
}

export const RESOURCE_TOPICS: TopicCategory[] = [
  {
    id: 'banking',
    title: 'BANKING',
    category: 'BANKING',
    description: 'Autonomous core accounts, multi-currency ledgers, and zero-drift deposit architecture.',
    articleCount: 14,
    highlightMetric: '< 5ms Balance Invariant',
    technicalLabel: 'ACID // LEDGER_STREAM_V2',
    blueprintIcon: 'building',
  },
  {
    id: 'lending',
    title: 'LENDING',
    category: 'LENDING',
    description: 'Next-generation digital loan origination, dynamic DTI policies, and automated collateral rails.',
    articleCount: 22,
    highlightMetric: 'Sub-second Decisioning',
    technicalLabel: 'LOS_LMS // DISBURSAL_FABRIC',
    blueprintIcon: 'coins',
  },
  {
    id: 'payments',
    title: 'PAYMENTS',
    category: 'PAYMENTS',
    description: 'NPCI UPI 2.0 switch engines, recurring e-mandates, and low-latency QR routing cascades.',
    articleCount: 18,
    highlightMetric: '99.995% Network Availability',
    technicalLabel: 'NPCI_SWITCH // MULTI_BANK_MESH',
    blueprintIcon: 'zap',
  },
  {
    id: 'risk',
    title: 'RISK & COMPLIANCE',
    category: 'RISK',
    description: '4-pillar AI underwriting, bank statement cashflow analyzers, and automated RBI compliance audits.',
    articleCount: 16,
    highlightMetric: '0.01% Data Inconsistency',
    technicalLabel: 'SHAP_EXPLAINABLE // ZERO_BIAS',
    blueprintIcon: 'shield-check',
  },
  {
    id: 'technology',
    title: 'FINANCIAL TECHNOLOGY',
    category: 'TECHNOLOGY',
    description: 'Distributed microservices, event-driven payment bridges, and cryptographic audit logs.',
    articleCount: 19,
    highlightMetric: '45,000 TPS Benchmark',
    technicalLabel: 'KAFKA_FABRIC // IMMUTABLE_CHAIN',
    blueprintIcon: 'cpu',
  },
  {
    id: 'digital',
    title: 'DIGITAL EXPERIENCES',
    category: 'BANKING',
    description: 'Embedded neobanking workspaces, merchant soundbox telemetry, and instant paperless journeys.',
    articleCount: 12,
    highlightMetric: '3-Step Onboarding',
    technicalLabel: 'EDGE_SDK // CLIENT_LAYER',
    blueprintIcon: 'layers',
  },
];

export const RESOURCE_ITEMS: ResourceItem[] = [
  {
    id: 'digital-lending-generation',
    title: 'The Next Generation of Digital Lending: Autonomous Rails & Cashflow-First Underwriting',
    category: 'LENDING',
    type: 'INSIGHTS',
    date: 'SEPTEMBER 2026',
    readTime: '5 MIN READ',
    excerpt: 'Traditional Bureau scores are static mirrors of the past. Why real-time GST and banking cashflow streams are reshaping underwriting.',
    keyTakeaway: 'Cashflow telemetry reduces delinquency by 38% while approving 24% more creditworthy MSMEs overlooked by legacy credit scoring.',
    author: {
      name: 'Adyapan Systems Architecture Group',
      role: 'Core Credit Systems Team',
    },
    tags: ['Underwriting', 'Cashflow', 'Credit Rails', 'MSME Lending'],
    architecturalNote: 'Evaluated against 1.2M historical loan records across Tier 2 and Tier 3 Indian commercial clusters.',
    body: [
      'Credit origination in India has crossed an inflection point. For decades, retail and business underwriting depended almost entirely on static credit bureau records—snapshots that are often thirty to sixty days out of date, penalizing nascent businesses that lack multi-year credit files.',
      'The modern credit engine does not merely ask "Did they pay someone back two years ago?" It asks: "What is their current cash velocity? Are their GST returns expanding? Does their operating cycle demonstrate predictable cash collections?"',
      'By decoupling origination from manual document verification and connecting directly to Account Aggregator (AA) and DigiLocker rails, modern institutions compress 48-hour underwriting cycles into sub-30-second automated decision pipelines with zero compromise on credit invariants.',
    ],
  },
  {
    id: 'zero-drift-ledger',
    title: 'Architecting Zero-Drift Double-Entry Ledgers for Million-TPS Modern Banking',
    category: 'BANKING',
    type: 'EXPLAINERS',
    date: 'AUGUST 2026',
    readTime: '7 MIN READ',
    excerpt: 'How immutable append-only event logs eliminate reconciliations and maintain perfect balance parity at peak scale.',
    keyTakeaway: 'By treating account balances as deterministic projections of ledger events rather than mutable column values, drift becomes mathematically impossible.',
    author: {
      name: 'Core Ledger Infrastructure Lab',
      role: 'Banking Engine Group',
    },
    tags: ['Double-Entry', 'Core Banking', 'Event Sourcing', 'PostgreSQL'],
    architecturalNote: 'Tested under simulated 50,000 TPS spike workloads with zero orphaned balances.',
    body: [
      'In traditional core banking systems, an account balance is a single mutable database row: `UPDATE accounts SET balance = balance + 100 WHERE id = 123`. Under extreme concurrency and distributed network splits, this primitive approach creates reconciliation discrepancies.',
      'Adyapan Core Banking separates the immutable movement of money from its transient balance query. Every single transaction writes a balanced debit and credit journal record. Balances are calculated as deterministic projections across time.',
      'If an auditor questions an account balance from nine months ago at 14:02:11 UTC, the system does not need a database backup—it replays the immutable journal up to that millisecond, proving the balance to the exact rupee.',
    ],
  },
  {
    id: 'npci-upi-mesh-routing',
    title: 'NPCI UPI 2.0 Switch Architecture: Multi-Bank Mesh Routing and Failover Invariants',
    category: 'PAYMENTS',
    type: 'GUIDES',
    date: 'AUGUST 2026',
    readTime: '6 MIN READ',
    excerpt: 'Deep dive into low-latency payment packet switches, dynamic bank health metrics, and automated timeout circuit breakers.',
    keyTakeaway: 'Dynamic routing shifts traffic away from degrading remitter banks in under 120 milliseconds, safeguarding merchant transaction success rates.',
    author: {
      name: 'Adyapan Payments Rail Engineering',
      role: 'Payments Gateway Team',
    },
    tags: ['UPI', 'NPCI Switch', 'Auto-Routing', 'High Availability'],
    architecturalNote: 'Compliant with NPCI Procedural Guidelines and RBI Master Directions on Payment Aggregators.',
    body: [
      'The Indian UPI network executes over 15 billion transactions monthly. For high-volume merchants, bank-side latency spikes or planned maintenance windows can plummet customer conversion by up to 18% in minutes.',
      'Multi-bank switch meshes monitor the health of acquiring and issuing banking partners using rolling statistical probes. When a bank node displays abnormal error distributions or response latency above 2,500ms, the router silently diverts subsequent payment traffic to alternate partner switches.',
      'This multi-lane architecture guarantees that the consumer experience remains frictionless, without displaying frustrating "Server Busy" errors at point-of-sale terminals.',
    ],
  },
  {
    id: 'explainable-ai-credit',
    title: 'Explainable AI in Credit Decisioning: Moving Beyond Black-Box Neural Scoring',
    category: 'RISK',
    type: 'REPORTS',
    date: 'JULY 2026',
    readTime: '8 MIN READ',
    excerpt: 'Balancing non-linear machine learning accuracy with strict RBI regulatory explainability and adverse action notifications.',
    keyTakeaway: 'SHAP (Shapley Additive exPlanations) values provide individual mathematical feature attribution for every single approved or rejected application.',
    author: {
      name: 'Quantitative Risk Modeling Unit',
      role: 'Risk & Underwriting Lab',
    },
    tags: ['Risk Modeling', 'Explainable AI', 'SHAP', 'RBI Compliance'],
    architecturalNote: 'Fully aligns with RBI Fair Lending Practices and Data Ethics standards.',
    body: [
      'When credit underwriting models transitioned from simple logistic scorecards to gradient-boosted trees and deep networks, prediction accuracy soared. However, financial regulators rightly demand: "Why was borrower X denied credit, and what precise factors drove that decision?"',
      'A black-box model that cannot produce human-verifiable adverse action reasons cannot be deployed in regulated lending.',
      'Adyapan 4-Pillar Scorecard calculates localized Shapley values in real time during model inference. When an application falls outside acceptable risk thresholds, the system automatically emits the top 3 driving features (e.g., GST filing variance > 18%, operating cashflow coverage < 1.1x).',
    ],
  },
  {
    id: 'digilocker-paperless-trust',
    title: 'DigiLocker & Cryptographic Identity: Eliminating Document Tampering in Digital Onboarding',
    category: 'TECHNOLOGY',
    type: 'PRODUCT STORIES',
    date: 'JULY 2026',
    readTime: '4 MIN READ',
    excerpt: 'How PKI-signed digital credentials from the DigiLocker repository replace insecure scanned PDFs and manual physical checks.',
    keyTakeaway: 'Direct repository ingestion eliminates forgery risks and slashes user KYC drop-off from 32% down to less than 4%.',
    author: {
      name: 'Identity & Trust Systems Group',
      role: 'Verification Engineering',
    },
    tags: ['DigiLocker', 'e-KYC', 'Cryptography', 'Digital Trust'],
    architecturalNote: 'Interoperable with Government of India DigiLocker API v2.0 protocol specifications.',
    body: [
      'Scanned utility bills and photocopied identity documents have historically been a primary vector for identity manipulation and fraudulent loan applications. A photo of an electricity bill can be altered in basic editing software within seconds.',
      'DigiLocker fundamentally alters the trust model. Instead of accepting an uploaded user file, the platform requests direct consent-driven token exchange with the official issuing repository. The document payload is cryptographically signed at the source by the issuing authority.',
      'Verification becomes deterministic: the signature either validates against the public root certificate, or it fails. No human inspector is required to judge if a font appears slightly altered.',
    ],
  },
  {
    id: 'embedded-finance-operating-system',
    title: 'The Embedded Finance Playbook: Turning Vertical SaaS Platforms into Fintech Engines',
    category: 'BANKING',
    type: 'GUIDES',
    date: 'JUNE 2026',
    readTime: '6 MIN READ',
    excerpt: 'How ERPs, hospital management systems, and logistics apps are embedding lending, accounts, and cards directly at the point of workflow.',
    keyTakeaway: 'Contextual lending at the invoice generation point converts 4.2x higher than standalone banking destination portals.',
    author: {
      name: 'Ecosystem Architecture Team',
      role: 'Platform Partnerships',
    },
    tags: ['Embedded Finance', 'SaaS', 'API Gateways', 'B2B Fintech'],
    architecturalNote: 'Derived from live deployment patterns with 8 major B2B supply chain networks.',
    body: [
      'The consumer or business owner does not wake up wanting a "loan" or a "virtual account". They want to purchase raw materials, pay their vendor on time, or reconcile payroll.',
      'Embedded finance moves financial instruments out of bank branch portals and inserts them directly inside the operational software where business activity happens. When an invoice is approved inside a logistics ERP, credit can be drawn with a single click, settled directly to the vendor.',
      'Adyapan Connect API Gateway exposes unified webhook primitives and SDKs that allow non-fintech platforms to embed complete banking, cards, and loan lifecycles in days rather than quarters.',
    ],
  },
];

export const FINTECH_CONCEPTS: FintechConcept[] = [
  {
    id: 'core-banking',
    name: 'CORE BANKING',
    tagline: 'The Master System of Record for Accounts and Balances',
    category: 'BANKING INFRASTRUCTURE',
    steps: [
      {
        number: '01',
        stage: 'CUSTOMER EVENT',
        description: 'User initiates a balance transfer or receives incoming funds.',
        technicalInvariant: 'Request Signed // Idempotency Key Registered',
      },
      {
        number: '02',
        stage: 'FINANCIAL SYSTEM',
        description: 'Core engine validates account state, limits, and authentication token.',
        technicalInvariant: 'Account Active // No Regulatory Freeze',
      },
      {
        number: '03',
        stage: 'TRANSACTION INTENT',
        description: 'Dual reservations placed on source and destination account buffers.',
        technicalInvariant: 'Available Balance >= Transfer Amount + Fees',
      },
      {
        number: '04',
        stage: 'DOUBLE-ENTRY LEDGER',
        description: 'Simultaneous equal-and-opposite debit and credit entries committed atomically.',
        technicalInvariant: 'Sum(Debits) === Sum(Credits) // Zero Drift',
      },
      {
        number: '05',
        stage: 'SETTLEMENT EMISSION',
        description: 'Real-time webhook and notification dispatched to clearing networks.',
        technicalInvariant: 'State Settled // Invariant Snapshot Timestamped',
      },
    ],
    summary: 'A robust core banking engine guarantees that money never appears or vanishes without an immutable audit journal record.',
  },
  {
    id: 'upi',
    name: 'UPI 2.0',
    tagline: 'Interoperable Real-Time Settlement Network',
    category: 'PAYMENTS',
    steps: [
      {
        number: '01',
        stage: 'QR SCAN / INTENT',
        description: 'Consumer scans dynamic merchant QR with encrypted payment payload.',
        technicalInvariant: 'Payload Decoded // VPA Verified with NPCI Switch',
      },
      {
        number: '02',
        stage: 'AUTHENTICATION',
        description: 'User enters MPIN in isolated Common Library (CL) sandbox.',
        technicalInvariant: 'MPIN Hashed with HSM // Never Exposed to App',
      },
      {
        number: '03',
        stage: 'REMITTER DEBIT',
        description: 'Consumer bank reserves and debits funds via NPCI central switch.',
        technicalInvariant: 'IMPS/UPI Core Clearing Protocol Invariant',
      },
      {
        number: '04',
        stage: 'BENEFICIARY CREDIT',
        description: 'Merchant bank receives settlement notification and updates balance.',
        technicalInvariant: 'Account Credited // Immediate Audio / Soundbox Signal',
      },
      {
        number: '05',
        stage: 'RECONCILIATION',
        description: 'End-of-cycle multilateral net settlement conducted across RBI clearing books.',
        technicalInvariant: 'Batch Parity Confirmed // Zero Open Discrepancy',
      },
    ],
    summary: 'UPI combines low-latency packet switching with NPCI central clearing to move funds directly between bank accounts in under two seconds.',
  },
  {
    id: 'underwriting',
    name: 'UNDERWRITING',
    tagline: 'Automated 4-Pillar Algorithmic Risk Decisioning',
    category: 'CREDIT RISK',
    steps: [
      {
        number: '01',
        stage: 'TELEMETRY INGEST',
        description: 'Consent-driven ingestion of banking, GST, Bureau, and operating cashflow data.',
        technicalInvariant: 'Account Aggregator AA Token Verified',
      },
      {
        number: '02',
        stage: 'DATA NORMALIZATION',
        description: 'Raw statement records parsed into normalized transactional categories.',
        technicalInvariant: 'Circular Round-Tripping Filtered Out',
      },
      {
        number: '03',
        stage: '4-PILLAR SCORING',
        description: 'Cashflow, behavioral volatility, alternative footprint, and macro sensitivity evaluated.',
        technicalInvariant: 'Weighted Score Calculated // SHAP Attribution Saved',
      },
      {
        number: '04',
        stage: 'DTI & POLICY CUTOFF',
        description: 'Debt-to-income and loan repayment coverage ratio checked against institution policy.',
        technicalInvariant: 'Fixed Obligations Ratio < Max Policy Threshold',
      },
      {
        number: '05',
        stage: 'DECISION SANCTION',
        description: 'Instant term sheet generated with risk-adjusted pricing and automated sanction letter.',
        technicalInvariant: 'Sanction Token Cryptographically Sealed',
      },
    ],
    summary: 'Modern underwriting replaces static credit bureau score reliance with multidimensional cashflow telemetry to make objective, instant credit decisions.',
  },
  {
    id: 'digilocker-kyc',
    name: 'DIGILOCKER KYC',
    tagline: 'Paperless Cryptographic Identity Verification',
    category: 'COMPLIANCE',
    steps: [
      {
        number: '01',
        stage: 'CONSENT INITIATION',
        description: 'User enters mobile number and approves secure DigiLocker token authorization.',
        technicalInvariant: 'Explicit User Consent Logged with Timestamp',
      },
      {
        number: '02',
        stage: 'OTP VERIFICATION',
        description: 'Direct Aadhaar / DigiLocker 6-digit OTP verification via official gateway.',
        technicalInvariant: 'One-Time Cryptographic Auth Bearer Token Issued',
      },
      {
        number: '03',
        stage: 'ISSUER INGESTION',
        description: 'Official XML / PDF identity payload fetched directly from UIDAI / DigiLocker vault.',
        technicalInvariant: 'Payload Verified Against Government PKI Root Key',
      },
      {
        number: '04',
        stage: 'LIVENESS & BIOMETRIC',
        description: 'Automated facial geometry match against repository ID photograph.',
        technicalInvariant: 'Anti-Spoofing Check Passed // Confidence > 92%',
      },
      {
        number: '05',
        stage: 'AUDIT CERTIFICATION',
        description: 'Full verification record securely archived in immutable compliance log.',
        technicalInvariant: 'Meets RBI Digital KYC Master Direction Requirements',
      },
    ],
    summary: 'DigiLocker verification ensures 100% genuine official documents fetched directly from the issuer with zero risk of photo alteration or counterfeit certificates.',
  },
  {
    id: 'settlement',
    name: 'SETTLEMENT',
    tagline: 'Zero-Drift Interbank Multilateral Clearing',
    category: 'TRANSACTION CLEARING',
    steps: [
      {
        number: '01',
        stage: 'CAPTURE',
        description: 'Transactions collected across cards, UPI, and wires during the settlement window.',
        technicalInvariant: 'Cryptographic Hash of Batch Envelope Calculated',
      },
      {
        number: '02',
        stage: 'NETTING CALCULATION',
        description: 'Gross payments netted down into bilateral net payable and receivable balances.',
        technicalInvariant: 'Net Multilateral Balance Equation Reconciled to 0.00',
      },
      {
        number: '03',
        stage: 'CLEARING SUBMISSION',
        description: 'Final netted positions submitted to central clearing house (RBI / CCIL).',
        technicalInvariant: 'Authorized by Settlement Node Private Keys',
      },
      {
        number: '04',
        stage: 'RESERVE TRANSFER',
        description: 'Central bank liquidity transferred between member nodal accounts.',
        technicalInvariant: 'RBI RTGS Gross Liquidity Transferred',
      },
      {
        number: '05',
        stage: 'FINALITY CONFIRMATION',
        description: 'All participant accounts marked finalized with irrevocable completion status.',
        technicalInvariant: 'Irrevocable Legal Settlement Finality Attained',
      },
    ],
    summary: 'Settlement provides mathematical certainty that transactions executed across disparate banking networks are permanently funded and legally final.',
  },
];

export const SYSTEM_UPDATES: SystemUpdate[] = [
  {
    version: 'v2.8.4',
    date: 'SEPTEMBER 2026',
    category: 'CORE ENGINE',
    title: 'Zero-Drift Double-Entry Micro-Ledger Engine Deployed',
    description: 'Upgraded accounting kernel with partitioned event tables and sub-5ms balance invariant validation under 40,000 TPS.',
    invariantsVerified: ['ACID strict serializability', 'Zero floating-point balance rounding errors', 'PostgreSQL row-level isolation'],
  },
  {
    version: 'v2.8.0',
    date: 'AUGUST 2026',
    category: 'PAYMENTS',
    title: 'NPCI UPI Autopay 2.0 Recurring E-Mandate Gateway',
    description: 'Added support for variable recurring mandate execution, dynamic merchant sub-wallet splits, and instant UPI refund rails.',
    invariantsVerified: ['Multi-bank fallback switch integration', 'Automated mandate retry backoff protocol', 'NPCI compliance validation'],
  },
  {
    version: 'v2.7.5',
    date: 'JULY 2026',
    category: 'RISK & AI',
    title: '4-Pillar Scorecard Model 3.2 Ingest Engine',
    description: 'Enhanced GST reconciliation pipeline with circular revenue filtering and localized SHAP feature attribution generation.',
    invariantsVerified: ['Explainable adverse reason generation', 'Anti-fraud circular flow detection', 'Account Aggregator v2.1 protocol compatibility'],
  },
  {
    version: 'v2.7.0',
    date: 'JUNE 2026',
    category: 'SECURITY & AUDIT',
    title: 'ISO 27001 & SOC 2 Type II Cryptographic Verification Certified',
    description: 'Completed comprehensive third-party information security audit and immutable log verification for all banking APIs.',
    invariantsVerified: ['Hardware Security Module (HSM) key rotation', 'AES-256 GCM encrypted at-rest storage', 'Zero plain-text PII persistence'],
  },
];
