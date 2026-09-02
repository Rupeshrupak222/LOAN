export interface ProductWorkflowStep {
  step: string;
  title: string;
  description: string;
  techNode: string;
}

export interface ProductFeature {
  title: string;
  description: string;
  iconName: string;
}

export interface ProductSpec {
  label: string;
  value: string;
  badge: string;
}

export interface RelatedProduct {
  slug: string;
  title: string;
  category: string;
  description: string;
}

export interface ProductDetailData {
  slug: string;
  category: 'Banking & Core' | 'Lending Solutions' | 'Payments & Settlement' | 'AI Risk & Compliance';
  name: string;
  tagline: string;
  headline: string;
  highlightText: string;
  subheadline: string;
  heroMetrics: { value: string; label: string; sub?: string }[];
  simulatorType:
    | 'core-ledger'
    | 'card-customizer'
    | 'neobank-vault'
    | 'api-sandbox'
    | 'personal-loan-calc'
    | 'sme-revolving-line'
    | 'mortgage-schedule'
    | 'bnpl-split'
    | 'upi-pulse'
    | 'cross-border-fx'
    | 'qr-soundbox'
    | 'credit-line-upi'
    | 'digilocker-wizard'
    | 'ai-scorecard'
    | 'immutable-ledger'
    | 'dti-gauge';
  problemSolved: {
    challenge: string;
    solution: string;
    impact: string;
  };
  workflowTitle: string;
  workflowSubtitle: string;
  workflowSteps: ProductWorkflowStep[];
  features: ProductFeature[];
  specs: ProductSpec[];
  relatedProducts: RelatedProduct[];
}

export const ALL_PRODUCTS: Record<string, ProductDetailData> = {
  // ── 1. Core Banking Engine ──
  'core-banking-engine': {
    slug: 'core-banking-engine',
    category: 'Banking & Core',
    name: 'Core Banking Engine',
    tagline: 'Multi-Tenant Double-Entry Financial Core',
    headline: 'The Engine Behind Every',
    highlightText: 'Real-Time Financial Transaction',
    subheadline:
      'Adyapan Core Banking Engine unifies account ledgers, atomic balance commits, automated clearing, and multi-tenant reconciliation into one ultra-low latency core.',
    heroMetrics: [
      { value: '< 8ms', label: 'Ledger Commit Latency' },
      { value: '100% ACID', label: 'PostgreSQL Precision' },
      { value: 'Zero', label: 'Reconciliation Drift' },
      { value: 'Multi-Tenant', label: 'Bank & FinTech Partitioning' },
    ],
    simulatorType: 'core-ledger',
    problemSolved: {
      challenge: 'Legacy core banking systems suffer from batch settlement delays, balance drift, and single-point database locking.',
      solution: 'Event-sourced double-entry transactional architecture enforcing immutable ledger records before any balance update.',
      impact: 'Instant sub-10ms transactional commits with zero floating-point rounding error across millions of ledger entries.',
    },
    workflowTitle: 'Transaction Lifecycle & Ledger Commit Path',
    workflowSubtitle: 'How a transaction moves from API request to immutable double-entry ledger finality in sub-10 milliseconds.',
    workflowSteps: [
      { step: '01', title: 'Transaction Ingest & 2FA Auth', description: 'API payload received, signature verified, and idempotency key locked.', techNode: 'mTLS API Gateway' },
      { step: '02', title: 'Double-Entry Ledger Reservation', description: 'Simultaneous credit & debit entries prepared in strict transactional isolation.', techNode: 'ACID Balance Lock' },
      { step: '03', title: 'Policy & Balance Availability Check', description: 'Real-time DTI, minimum reserve, and anti-overdraft policies validated.', techNode: 'Rule Policy Engine' },
      { step: '04', title: 'Atomic Balance Commit', description: 'PostgreSQL NUMERIC(14,2) state transition committed with zero rounding variance.', techNode: 'Ledger DB Engine' },
      { step: '05', title: 'Settlement & Webhook Dispatch', description: 'Immediate downstream webhook notification sent to borrower & banking partners.', techNode: 'Event Streaming' },
    ],
    features: [
      { title: 'Sub-10ms Atomic Commit', description: 'Ultra-low latency double-entry journal operations with guaranteed sub-10ms finality.', iconName: 'Zap' },
      { title: 'Multi-Tenant Isolation', description: 'Logical and cryptographic partitioning for banks, NBFCs, and digital co-lenders.', iconName: 'Layers' },
      { title: 'Zero Roundoff NUMERIC Precision', description: 'Exact 14-integer, 2-decimal point precision eliminating float calculation drift.', iconName: 'Calculator' },
      { title: 'Automated Day-End Settlement', description: 'Instant automated EOD batch clearing, interest accrual, and trial balance generation.', iconName: 'Clock' },
      { title: 'Append-Only Ledger Trail', description: 'Every ledger state mutation is cryptographically timestamped and immutable.', iconName: 'Lock' },
      { title: 'Configurable Chart of Accounts', description: 'Dynamic account hierarchies for assets, liabilities, equities, income, and expense pots.', iconName: 'Building2' },
    ],
    specs: [
      { label: 'Latency SLA', value: '< 8ms p99', badge: 'Ultra Fast' },
      { label: 'Data Model', value: 'Double-Entry Journal', badge: 'ACID Standard' },
      { label: 'Precision Standard', value: 'NUMERIC(14,2)', badge: 'Zero Float Drift' },
      { label: 'Compliance Protocol', value: 'RBI Core Spec Aligned', badge: 'Regulatory' },
    ],
    relatedProducts: [
      { slug: 'debit-prepaid-cards', title: 'Debit & Prepaid Cards', category: 'Banking & Core', description: 'Card issuance linked to core banking accounts.' },
      { slug: 'neobanking-portal', title: 'Neobanking Portal', category: 'Banking & Core', description: 'Full-stack SME digital banking front door.' },
      { slug: 'connect-api-gateway', title: 'Connect API Gateway', category: 'Banking & Core', description: 'REST and gRPC interfaces for financial workflows.' },
    ],
  },

  // ── 2. Debit & Prepaid Cards ──
  'debit-prepaid-cards': {
    slug: 'debit-prepaid-cards',
    category: 'Banking & Core',
    name: 'Debit & Prepaid Cards',
    tagline: 'Modern Virtual & Physical Card Issuance Engine',
    headline: 'Turning Bank Accounts Into',
    highlightText: 'Everyday Payment Experiences',
    subheadline:
      'Issue physical, virtual, and tokenized cards in seconds with dynamic MCC spending limits, instant freeze controls, and 3DS 2.0 security.',
    heroMetrics: [
      { value: '< 400ms', label: 'Auth Decision Latency' },
      { value: '3DS 2.0', label: 'Frictionless Security' },
      { value: 'Dynamic BIN', label: 'Multi-Network Issuance' },
      { value: 'Apple/G-Pay', label: 'Tokenized In-App Push' },
    ],
    simulatorType: 'card-customizer',
    problemSolved: {
      challenge: 'Traditional card issuance takes weeks with static limits, manual fraud interventions, and zero real-time developer control.',
      solution: 'Programmatic card API with instant virtual provisioning, dynamic category-level spend limits, and zero-latency authorization hooks.',
      impact: 'Issue cards in under 3 seconds with customizable limits that reduce unauthorized spend by up to 92%.',
    },
    workflowTitle: 'Instant Card Tokenization & POS Authorization Flow',
    workflowSubtitle: 'How a payment authorization is validated against programmable rules in under 400ms.',
    workflowSteps: [
      { step: '01', title: 'Programmatic Issuance', description: 'Virtual card PAN, CVV, and expiry generated with 256-bit encryption.', techNode: 'Card API Switch' },
      { step: '02', title: 'Token Push to Mobile Wallet', description: 'Direct in-app push provisioning to Apple Wallet and Google Pay.', techNode: 'Tokenization Engine' },
      { step: '03', title: 'POS / Online Terminal Swipe', description: 'Card authorization request routed from Visa/Mastercard/RuPay switch.', techNode: 'Payment Gateway' },
      { step: '04', title: 'Real-Time MCC Rule Evaluation', description: 'Merchant Category Code (MCC) and daily spend limits evaluated instantly.', techNode: 'Rule Policy Engine' },
      { step: '05', title: 'Balance Debit & Push Receipt', description: 'Linked core banking ledger debited and real-time SMS/push receipt triggered.', techNode: 'Core Banking API' },
    ],
    features: [
      { title: 'Dynamic Merchant Limits', description: 'Restrict cards to specific MCCs (e.g. Travel, Fuel, Dining) or time-bounded windows.', iconName: 'ShieldCheck' },
      { title: 'Instant 1-Tap Card Freeze', description: 'Borrowers and admins can freeze, unfreeze, or regenerate virtual cards instantly.', iconName: 'Lock' },
      { title: 'Sub-400ms Auth Webhooks', description: 'Receive real-time auth webhooks to approve or decline transactions programmatically.', iconName: 'Zap' },
      { title: 'Physical Card Dispatch Integration', description: 'Automated physical card embossing, EMV chip personalization, and postal tracking.', iconName: 'CreditCard' },
      { title: '3DS 2.0 Risk-Based Auth', description: 'Contextual fraud scoring enabling one-click seamless checkout without SMS OTP friction.', iconName: 'Sparkles' },
      { title: 'Multi-Currency Settlement', description: 'Support for cross-border merchant spending with dynamic wholesale FX conversion.', iconName: 'Globe' },
    ],
    specs: [
      { label: 'Authorization SLA', value: '< 400ms', badge: 'Ultra Low' },
      { label: 'Card Networks', value: 'RuPay / Visa / Mastercard', badge: 'Certified' },
      { label: 'Tokenization', value: 'Apple / Google / Samsung Pay', badge: 'In-App Push' },
      { label: 'Security Level', value: 'PCI-DSS Level 1 Aligned', badge: 'Bank Grade' },
    ],
    relatedProducts: [
      { slug: 'core-banking-engine', title: 'Core Banking Engine', category: 'Banking & Core', description: 'Real-time double-entry ledger account core.' },
      { slug: 'neobanking-portal', title: 'Neobanking Portal', category: 'Banking & Core', description: 'Digital SME account interface with card management.' },
      { slug: 'bnpl', title: '0% 3-Month BNPL', category: 'Lending Solutions', description: 'Split purchases across card installments.' },
    ],
  },

  // ── 3. Neobanking Portal ──
  'neobanking-portal': {
    slug: 'neobanking-portal',
    category: 'Banking & Core',
    name: 'Neobanking Portal',
    tagline: 'Full-Stack Digital SME & Consumer Front Door',
    headline: 'Building a Digital Financial',
    highlightText: 'Front Door for Modern Enterprises',
    subheadline:
      'Empower SMEs and consumers with multi-currency current accounts, automated tax savings vaults, corporate expense tracking, and native ERP ledger sync.',
    heroMetrics: [
      { value: '100%', label: 'Digital Onboarding' },
      { value: 'Auto-Tax', label: 'GST Vault Splitting' },
      { value: 'Tally & ERP', label: '2-Way Ledger Sync' },
      { value: 'Sub-2s', label: 'Payout Execution' },
    ],
    simulatorType: 'neobank-vault',
    problemSolved: {
      challenge: 'SMEs waste 15+ hours weekly managing manual bank statements, tax reconciliations, and messy employee reimbursement spreadsheets.',
      solution: 'Integrated digital neobanking workspace combining smart business accounts, auto-segregated tax pots, and real-time vendor payouts.',
      impact: 'Eliminate manual bookkeeping with automated tax compliance and one-click bulk payroll execution.',
    },
    workflowTitle: 'SME Smart Account & Automated Vault Architecture',
    workflowSubtitle: 'How funds entering a business account are automatically partitioned into tax, payroll, and operating capital.',
    workflowSteps: [
      { step: '01', title: 'Paperless Digital Onboarding', description: 'KYC, PAN, and GSTIN verification completed digitally in under 3 minutes.', techNode: 'e-KYC Engine' },
      { step: '02', title: 'Virtual Account Allocation', description: 'Dedicated collection virtual account generated for incoming client payments.', techNode: 'Virtual IBAN Core' },
      { step: '03', title: 'Automated Tax & GST Vault Split', description: 'Configurable 18% GST and 10% TDS automatically diverted into locked vaults.', techNode: 'Smart Vault Engine' },
      { step: '04', title: 'Bulk Vendor & Salary Payouts', description: 'Execute multi-party payouts via IMPS, NEFT, and UPI with maker-checker approvals.', techNode: 'Payout Gateway' },
      { step: '05', title: 'Real-Time ERP Reconciliation', description: 'Automatic 2-way sync with Tally, Zoho Books, and SAP accounting systems.', techNode: 'ERP Connector' },
    ],
    features: [
      { title: 'Automated Tax & GST Vaults', description: 'Automatically sweep percentages of every revenue payment into dedicated tax sub-accounts.', iconName: 'ShieldCheck' },
      { title: 'Maker-Checker Approval Workflows', description: 'Granular corporate governance requiring dual sign-offs for transactions exceeding thresholds.', iconName: 'Users' },
      { title: 'Integrated Vendor Payouts', description: 'Upload spreadsheets or trigger API payouts to thousands of vendor bank accounts in seconds.', iconName: 'Zap' },
      { title: 'Real-Time Cash Flow Analytics', description: 'AI-driven forecasting predicting 30-day working capital needs and runway burn.', iconName: 'TrendingUp' },
      { title: 'Corporate Expense Cards', description: 'Assign smart physical and virtual cards to department heads with custom monthly caps.', iconName: 'CreditCard' },
      { title: 'Instant Invoicing & Payment Links', description: 'Send GST-compliant invoices with embedded UPI and card payment collection rails.', iconName: 'FileCheck' },
    ],
    specs: [
      { label: 'Onboarding Time', value: '< 3 Minutes', badge: 'Paperless' },
      { label: 'Payout Rails', value: 'IMPS / NEFT / RTGS / UPI', badge: 'Instant 24/7' },
      { label: 'Accounting Sync', value: 'Tally / Zoho / QuickBooks', badge: 'Auto Sync' },
      { label: 'Security Standard', value: '256-Bit SSL + mTLS', badge: 'Bank Grade' },
    ],
    relatedProducts: [
      { slug: 'core-banking-engine', title: 'Core Banking Engine', category: 'Banking & Core', description: 'Underlying transaction ledger and balance commit engine.' },
      { slug: 'sme-business-credit', title: 'SME Business Credit', category: 'Lending Solutions', description: 'Working capital credit line linked to neobanking cash flow.' },
      { slug: 'connect-api-gateway', title: 'Connect API Gateway', category: 'Banking & Core', description: 'API connectors for automated payroll and vendor settlement.' },
    ],
  },

  // ── 4. Connect API Gateway ──
  'connect-api-gateway': {
    slug: 'connect-api-gateway',
    category: 'Banking & Core',
    name: 'Connect API Gateway',
    tagline: 'Unified REST & gRPC Financial Integration Gateway',
    headline: 'One Single Connection to',
    highlightText: 'Multiple Financial Capabilities',
    subheadline:
      'Accelerate FinTech development with high-throughput REST and gRPC gateways unifying banking, credit underwriting, KYC verification, and settlement.',
    heroMetrics: [
      { value: '99.99%', label: 'Gateway Uptime' },
      { value: '< 15ms', label: 'Average Proxy Latency' },
      { value: 'gRPC + REST', label: 'Dual Protocol Support' },
      { value: 'mTLS', label: 'Zero-Trust Encryption' },
    ],
    simulatorType: 'api-sandbox',
    problemSolved: {
      challenge: 'FinTech engineering teams spend months writing fragmented integrations across dozens of disparate legacy banking APIs.',
      solution: 'A unified developer gateway offering standardized schemas, sandbox mocking, idempotent webhooks, and automatic retry backoffs.',
      impact: 'Reduce integration time from 6 months to 3 days with production-ready SDKs and sandbox test harnesses.',
    },
    workflowTitle: 'API Gateway Request Lifecycle & Signature Auth',
    workflowSubtitle: 'How an external API payload is authenticated, rate-limited, routed, and returned in under 15ms.',
    workflowSteps: [
      { step: '01', title: 'Client Request & HMAC Signature', description: 'Developer app sends signed JSON payload with API key and timestamp nonce.', techNode: 'Client SDK' },
      { step: '02', title: 'mTLS Handshake & Rate Limiting', description: 'Mutual TLS verified and token bucket rate limits enforced per partner tier.', techNode: 'WAF & Gateway' },
      { step: '03', title: 'Schema Validation & Idempotency', description: 'Zod/JSON schema validated and duplicate idempotency headers checked.', techNode: 'Validation Layer' },
      { step: '04', title: 'Microservice Routing', description: 'Payload proxied to targeted internal banking or risk scoring microservice.', techNode: 'Internal Mesh' },
      { step: '05', title: 'Encrypted Response & Webhook Fire', description: 'Structured response returned and asynchronous event webhook queued.', techNode: 'Webhook Dispatch' },
    ],
    features: [
      { title: 'Dual REST & gRPC Endpoints', description: 'High-speed protobuf gRPC for core transactions with clean JSON REST for web clients.', iconName: 'Layers' },
      { title: 'Interactive Developer Sandbox', description: 'Instant mock responses, simulated failure testing, and auto-generated code snippets.', iconName: 'Zap' },
      { title: 'Guaranteed Idempotent Webhooks', description: 'Never process double charges with automatic deduplication and exponential retry queues.', iconName: 'ShieldCheck' },
      { title: 'Zero-Trust mTLS Security', description: 'Mutual TLS certificate exchange ensuring only authorized partner servers communicate.', iconName: 'Lock' },
      { title: 'Real-Time Telemetry & Tracing', description: 'OpenTelemetry tracing tracking every API call latency down to the database query.', iconName: 'Activity' },
      { title: 'Automated OpenAPI 3.0 Specs', description: 'Always up-to-date Swagger/Postman collections with interactive documentation.', iconName: 'FileCheck' },
    ],
    specs: [
      { label: 'Uptime SLA', value: '99.99%', badge: 'High Availability' },
      { label: 'Protocol Support', value: 'REST / gRPC / WebSockets', badge: 'Multi-Rail' },
      { label: 'Auth Standard', value: 'OAuth 2.0 / HMAC / mTLS', badge: 'Zero Trust' },
      { label: 'Rate Limiting', value: 'Token Bucket per Tenant', badge: 'DDoS Protected' },
    ],
    relatedProducts: [
      { slug: 'core-banking-engine', title: 'Core Banking Engine', category: 'Banking & Core', description: 'Core double-entry accounting services.' },
      { slug: 'npci-upi-network', title: 'NPCI UPI Network', category: 'Payments & Settlement', description: 'Instant UPI payout and collection endpoints.' },
      { slug: 'ai-underwriting', title: 'AI Underwriting Scorecard', category: 'AI Risk & Compliance', description: 'Credit scoring API endpoints.' },
    ],
  },

  // ── 5. Personal Loans ──
  'personal-loans': {
    slug: 'personal-loans',
    category: 'Lending Solutions',
    name: 'Personal Loans',
    tagline: 'Instant 60-Second Paperless Credit Disbursal',
    headline: 'From Need to Account Credit in',
    highlightText: '60 Seconds of Paperless Simplicity',
    subheadline:
      'Deliver personalized unsecured personal loans with AI eligibility scoring, instant Aadhaar e-KYC, reducing-balance EMI schedules, and direct bank disbursal.',
    heroMetrics: [
      { value: '60s', label: 'Sanction Decision' },
      { value: 'from 10.5%', label: 'Interest Rate p.a.' },
      { value: '100%', label: 'Paperless Application' },
      { value: 'Up to ₹10L', label: 'Maximum Sanction' },
    ],
    simulatorType: 'personal-loan-calc',
    problemSolved: {
      challenge: 'Traditional personal loan applications require 3-5 days of branch visits, physical document submissions, and opaque underwriting delays.',
      solution: '100% digital loan origination engine powered by automated bank statement parsing, bureau XML ingestion, and instant e-mandate setup.',
      impact: 'Reduce origination cost by 78% and achieve a 60-second sanction turnaround with sub-1% fraud rates.',
    },
    workflowTitle: 'End-to-End Personal Loan Application Journey',
    workflowSubtitle: 'From borrower intake to instant bank account disbursal in 5 seamless automated stages.',
    workflowSteps: [
      { step: '01', title: 'Eligibility & Identity Check', description: 'Borrower enters PAN and mobile number; DigiLocker pulls verified identity.', techNode: 'e-KYC Suite' },
      { step: '02', title: 'Bank Statement Analysis', description: 'Account Aggregator fetches 6-month statement for automated cash-flow scoring.', techNode: 'AA Gateway' },
      { step: '03', title: 'Algorithmic Risk Underwriting', description: 'Bureau history, DTI, and income stability evaluated by policy scorecard.', techNode: 'AI Underwriter' },
      { step: '04', title: 'Instant Sanction & e-Sign', description: 'Loan agreement generated and digitally signed via Aadhaar e-Sign OTP.', techNode: 'Legal e-Sign' },
      { step: '05', title: 'Auto-Debit & Fund Disbursal', description: 'NPCI e-NACH mandate registered and funds disbursed directly via IMPS/NEFT.', techNode: 'Disbursal Engine' },
    ],
    features: [
      { title: '60-Second Approval Engine', description: 'Real-time policy validation providing immediate sanction decisions without human review.', iconName: 'Zap' },
      { title: 'Dynamic Reducing Balance EMI', description: 'Transparent interest calculation where interest is computed solely on outstanding principal.', iconName: 'Calculator' },
      { title: 'Automated e-NACH Repayments', description: 'Set up automated monthly mandate debits directly on borrower bank accounts.', iconName: 'Clock' },
      { title: 'Zero Physical Documentation', description: '100% digital verification utilizing DigiLocker, PAN NSDL, and Bank Statement Aggregators.', iconName: 'ShieldCheck' },
      { title: 'Waterfall Repayment Allocation', description: 'Compliant allocation hierarchy: Overdue Fees → Penalty → Interest → Principal Balance.', iconName: 'Layers' },
      { title: 'Automated Digital NOC on Closure', description: 'Instant tamper-proof No Objection Certificate generated upon final installment clearance.', iconName: 'FileCheck' },
    ],
    specs: [
      { label: 'Starting Rate', value: '10.5% p.a.', badge: 'Competitive' },
      { label: 'Tenure Range', value: '3 to 60 Months', badge: 'Flexible' },
      { label: 'Loan Boundaries', value: '₹25,000 to ₹10,00,000', badge: 'Scalable' },
      { label: 'Disbursal Speed', value: 'Instant via IMPS/RTGS', badge: 'Real-Time' },
    ],
    relatedProducts: [
      { slug: 'bnpl', title: '0% 3-Month BNPL', category: 'Lending Solutions', description: 'Short-term zero-cost installment split credit.' },
      { slug: 'digilocker-ekyc', title: 'DigiLocker e-KYC', category: 'AI Risk & Compliance', description: 'Instant Aadhaar and PAN digital identity verification.' },
      { slug: 'ai-underwriting', title: 'AI Underwriting Scorecard', category: 'AI Risk & Compliance', description: 'Intelligent multi-bureau credit scoring engine.' },
    ],
  },

  // ── 6. SME Business Credit ──
  'sme-business-credit': {
    slug: 'sme-business-credit',
    category: 'Lending Solutions',
    name: 'SME Business Credit',
    tagline: 'Revolving Working Capital & Growth Line of Credit',
    headline: 'Capital That Moves In Rhythm',
    highlightText: 'With Your Business Cash Flow',
    subheadline:
      'Uncap enterprise growth with revolving credit lines up to ₹50 Lakhs. Pay interest only on what you draw down with automated GST cash-flow underwriting.',
    heroMetrics: [
      { value: 'from 13.5%', label: 'Revolving Interest p.a.' },
      { value: 'Up to ₹50L', label: 'Credit Line Sanction' },
      { value: 'T+0', label: 'Drawdown Settlement' },
      { value: 'Pay per Draw', label: 'Zero Idle Interest' },
    ],
    simulatorType: 'sme-revolving-line',
    problemSolved: {
      challenge: 'SMEs face unpredictable cash flow cycles and cannot afford to pay high interest on large lump-sum term loans.',
      solution: 'A flexible revolving line of credit where businesses draw down funds on-demand to pay suppliers and repay anytime.',
      impact: 'Save up to 45% on interest costs compared to traditional fixed-term debt while maintaining 24/7 working capital liquidity.',
    },
    workflowTitle: 'GST Ingest & Revolving Line Lifecycle',
    workflowSubtitle: 'How business cash flow is converted into an active revolving credit facility.',
    workflowSteps: [
      { step: '01', title: 'GST & Bank Statement Fetch', description: 'GSTR-1, GSTR-3B, and bank statements ingested via Account Aggregator.', techNode: 'GST Data Engine' },
      { step: '02', title: 'Cash Flow Velocity Scoring', description: 'B2B receivable cycles, customer concentration, and seasonal trends evaluated.', techNode: 'SME Risk Model' },
      { step: '03', title: 'Approved Revolving Sanction', description: 'Revolving credit facility sanctioned with predefined interest rate and drawing power.', techNode: 'Sanction Core' },
      { step: '04', title: 'On-Demand Supplier Drawdown', description: 'Business requests partial drawdown; funds disbursed directly to supplier account.', techNode: 'Disbursal Engine' },
      { step: '05', title: 'Flexible Working Capital Repay', description: 'Principal repaid upon customer invoice realization; drawing limit restored instantly.', techNode: 'Revolving Ledger' },
    ],
    features: [
      { title: 'Pay Interest Only on Utilized Funds', description: 'Zero interest charged on unutilized credit limit, optimizing working capital efficiency.', iconName: 'Percent' },
      { title: 'Automated GST & Invoice Parser', description: 'AI extracts supplier details, tax authenticity, and invoice aging in seconds.', iconName: 'FileCheck' },
      { title: 'Direct-to-Supplier Vendor Payouts', description: 'Disburse funds directly to verified vendor bank accounts with 2-click authorization.', iconName: 'Zap' },
      { title: 'Instant Drawing Power Restoration', description: 'Repay anytime without prepayment penalties to instantly replenish available limit.', iconName: 'TrendingUp' },
      { title: 'Multi-Director Corporate Governance', description: 'Configurable approval matrices for companies requiring CFO and Managing Director sign-offs.', iconName: 'Users' },
      { title: 'Automated Account Aggregator Ingest', description: 'Continuous financial health monitoring without asking for updated paper PDFs.', iconName: 'ShieldCheck' },
    ],
    specs: [
      { label: 'Facility Type', value: 'Revolving Line of Credit', badge: 'Flexible' },
      { label: 'Interest Rate', value: 'from 13.5% p.a. on Draw', badge: 'Usage Based' },
      { label: 'Credit Limit Bound', value: '₹5,00,000 to ₹50,00,000', badge: 'Enterprise' },
      { label: 'Prepayment Fee', value: '0% Nil Preclosure Penalty', badge: 'Zero Hidden' },
    ],
    relatedProducts: [
      { slug: 'neobanking-portal', title: 'Neobanking Portal', category: 'Banking & Core', description: 'Smart SME account interface with integrated credit line.' },
      { slug: 'personal-loans', title: 'Personal Loans', category: 'Lending Solutions', description: 'Unsecured individual loan offerings.' },
      { slug: 'automated-dti-policy', title: 'Automated DTI Policy', category: 'AI Risk & Compliance', description: 'Business debt service and FOIR limit validation.' },
    ],
  },

  // ── 7. Home Mortgages ──
  'home-mortgages': {
    slug: 'home-mortgages',
    category: 'Lending Solutions',
    name: 'Home Mortgages',
    tagline: 'High-Ticket Long-Tenure Secured Housing Finance',
    headline: 'Long-Term Property Finance Made',
    highlightText: 'Completely Transparent & Secure',
    subheadline:
      'Originate and service high-ticket housing loans with automated property legal title checks, milestone-based construction disbursals, and 30-year reducing EMI schedules.',
    heroMetrics: [
      { value: 'from 8.5%', label: 'Starting Rate p.a.' },
      { value: 'Up to 30 Yrs', label: 'Tenure Horizon' },
      { value: 'Up to 85%', label: 'Property LTV Bound' },
      { value: 'Digital NOC', label: 'Transparent Closure' },
    ],
    simulatorType: 'mortgage-schedule',
    problemSolved: {
      challenge: 'Mortgage origination involves months of manual property title verifications, construction milestone inspections, and opaque fee schedules.',
      solution: 'Automated housing loan management engine with digital collateral recording, automated LTV computation, and scheduled tranche releases.',
      impact: 'Cut mortgage processing time from 45 days to 7 days while ensuring 100% legal title compliance.',
    },
    workflowTitle: 'Secured Housing Loan & Collateral Lifecycle',
    workflowSubtitle: 'From title appraisal to milestone-based construction fund releases.',
    workflowSteps: [
      { step: '01', title: 'Borrower Eligibility & KYC', description: 'Income stability, co-applicant profiles, and bureau track records evaluated.', techNode: 'Underwrite Engine' },
      { step: '02', title: 'Digital Property Title Scan', description: 'Land registry records and encumbrance certificates verified against public databases.', techNode: 'Property Registry' },
      { step: '03', title: 'Valuation & LTV Calculation', description: 'Independent property appraisal ingested to establish Loan-to-Value boundary.', techNode: 'LTV Calculator' },
      { step: '04', title: 'Digital CERSAI Collateral Registry', description: 'Property mortgage charge registered in Central Security Interest registry.', techNode: 'CERSAI Gateway' },
      { step: '05', title: 'Milestone Tranche Disbursal', description: 'Funds released directly to builder/seller based on construction completion stages.', techNode: 'Tranche Core' },
    ],
    features: [
      { title: '30-Year Reducing EMI Schedule', description: 'High-precision amortization schedules clearly showing principal vs interest progression.', iconName: 'Calculator' },
      { title: 'Construction Milestone Tranches', description: 'Trigger staged disbursals linked to verified civil engineering milestone audits.', iconName: 'Building2' },
      { title: 'Automated CERSAI Charge Filing', description: 'Instant API integration for filing and tracking security interests in real property.', iconName: 'Lock' },
      { title: 'Co-Applicant Income Aggregation', description: 'Combine spouse/parent incomes to maximize total loan eligibility boundaries.', iconName: 'Users' },
      { title: 'Part-Prepayment Interest Recalculator', description: 'Instant recalculation of remaining tenure or monthly EMI upon lump-sum prepayments.', iconName: 'Percent' },
      { title: 'Transparent Property Document Custody', description: 'Tamper-proof digital tracking of physical original title deed custody in vaults.', iconName: 'ShieldCheck' },
    ],
    specs: [
      { label: 'Mortgage Base Rate', value: '8.5% p.a. Floating/Fixed', badge: 'Lowest EMI' },
      { label: 'Tenure Horizon', value: 'Up to 360 Months (30 Yrs)', badge: 'Long Term' },
      { label: 'Loan-to-Value (LTV)', value: 'Up to 85% of Valuation', badge: 'RBI Compliant' },
      { label: 'Prepayment Charges', value: '0% for Individual Borrowers', badge: 'Fair Lending' },
    ],
    relatedProducts: [
      { slug: 'personal-loans', title: 'Personal Loans', category: 'Lending Solutions', description: 'Unsecured top-up loans for interior renovation.' },
      { slug: 'immutable-audit-trail', title: 'Immutable Audit Trail', category: 'AI Risk & Compliance', description: 'Tamper-proof log of collateral lien registrations.' },
      { slug: 'automated-dti-policy', title: 'Automated DTI Policy', category: 'AI Risk & Compliance', description: 'Long-term FOIR affordability evaluation.' },
    ],
  },

  // ── 8. 0% 3-Month BNPL ──
  'bnpl': {
    slug: 'bnpl',
    category: 'Lending Solutions',
    name: '0% 3-Month BNPL',
    tagline: 'Instant 1-Click Split Checkout Installment Rail',
    headline: 'Split the Purchase at Checkout,',
    highlightText: 'Simplify the Repayment at Zero Cost',
    subheadline:
      'Boost merchant checkout conversion by 34% with zero-cost 3-month split installment credit. Sub-second credit approval and automated UPI mandate auto-debits.',
    heroMetrics: [
      { value: '0%', label: 'Interest for 3 Months' },
      { value: '< 800ms', label: 'Checkout Approval' },
      { value: '+34%', label: 'Average Order Value' },
      { value: '3 Lines', label: 'Merchant SDK Embed' },
    ],
    simulatorType: 'bnpl-split',
    problemSolved: {
      challenge: 'E-commerce cart abandonment exceeds 70% due to high upfront purchase costs and complex checkout financing forms.',
      solution: 'Embedded 3-part split payment widget that approves micro-credit inside the merchant modal in under 800ms.',
      impact: 'Increase merchant conversion by 28% and Average Order Value (AOV) by 34% with 0% interest terms for consumers.',
    },
    workflowTitle: '1-Click BNPL Checkout & Settlement Path',
    workflowSubtitle: 'How a consumer purchase is split into 3 installments while the merchant receives 100% upfront settlement.',
    workflowSteps: [
      { step: '01', title: 'Cart Checkout & Widget Load', description: 'Consumer selects "Adyapan 0% Split Pay" on e-commerce checkout page.', techNode: 'Merchant SDK' },
      { step: '02', title: 'Sub-Second Credit Scoring', description: 'Micro-credit eligibility evaluated via phone number OTP and bureau signal.', techNode: 'Risk Micro-Engine' },
      { step: '03', title: 'First Installment Paid (33%)', description: 'Consumer pays 1/3rd upfront via UPI, debit card, or net banking.', techNode: 'Payment Gateway' },
      { step: '04', title: 'Merchant 100% Upfront Settlement', description: 'Merchant receives full order amount minus standard discount fee on T+1.', techNode: 'Settlement Core' },
      { step: '05', title: 'Automated Month 2 & 3 Auto-Debit', description: 'Remaining two installments debited automatically on due dates via UPI mandate.', techNode: 'e-NACH Mandate' },
    ],
    features: [
      { title: 'Zero Interest for 3 Months', description: '100% zero-cost financing when installments are cleared on schedule.', iconName: 'Percent' },
      { title: '3-Line Merchant JavaScript SDK', description: 'Drop-in embeddable widget compatible with Shopify, WooCommerce, and custom web apps.', iconName: 'ShoppingBag' },
      { title: 'Sub-800ms Instant Approval', description: 'Zero multi-page forms; instant credit evaluation completed inside the checkout modal.', iconName: 'Zap' },
      { title: 'Automated UPI Auto-Debit Repay', description: 'Pre-authorized UPI autopay mandates eliminate missed installment deadlines.', iconName: 'Clock' },
      { title: 'Merchant Fraud Indemnity', description: 'Adyapan absorbs underwriting default risk while guaranteeing 100% merchant settlement.', iconName: 'ShieldCheck' },
      { title: 'Real-Time Borrower Spending Pass', description: 'Borrowers manage active installment schedules inside the unified Adyapan portal.', iconName: 'CreditCard' },
    ],
    specs: [
      { label: 'Consumer Interest', value: '0% Interest (3 Equal Months)', badge: 'Zero Cost' },
      { label: 'Approval Latency', value: '< 800ms', badge: 'Instant' },
      { label: 'Merchant Settlement', value: 'T+1 Instant Bank Credit', badge: 'Guaranteed' },
      { label: 'Repayment Rail', value: 'NPCI UPI Auto-Debit', badge: 'Automated' },
    ],
    relatedProducts: [
      { slug: 'credit-line-upi', title: 'Credit Line on UPI', category: 'Payments & Settlement', description: 'Revolving line of credit drawn on UPI QR scans.' },
      { slug: 'personal-loans', title: 'Personal Loans', category: 'Lending Solutions', description: 'Larger ticket term loans for major expenditures.' },
      { slug: 'debit-prepaid-cards', title: 'Debit & Prepaid Cards', category: 'Banking & Core', description: 'Card-based installment programs.' },
    ],
  },

  // ── 9. NPCI UPI Network ──
  'npci-upi-network': {
    slug: 'npci-upi-network',
    category: 'Payments & Settlement',
    name: 'NPCI UPI Network',
    tagline: 'High-Throughput UPI 2.0 Auto-Debit & Collection Switch',
    headline: 'Moving Financial Value at',
    highlightText: "India's Blazing Digital Speed",
    subheadline:
      'Direct switch integration for UPI 2.0, recurring e-mandates, Credit on UPI, and instant sub-second peer-to-merchant settlements with 99.98% uptime.',
    heroMetrics: [
      { value: '< 650ms', label: 'Average Turnaround' },
      { value: '99.98%', label: 'Switch Uptime' },
      { value: 'T+0', label: 'Instant Settlement' },
      { value: 'UPI 2.0', label: 'e-Mandates & Overdraft' },
    ],
    simulatorType: 'upi-pulse',
    problemSolved: {
      challenge: 'High transaction failure rates, slow reconciliation cycles, and recurring mandate drop-offs on legacy payment gateways.',
      solution: 'Direct NPCI certified switch architecture with active-active bank failover, sub-second routing, and native recurring autopay mandates.',
      impact: 'Boost payment success rates to 99.98% while achieving real-time T+0 merchant bank settlement.',
    },
    workflowTitle: 'UPI Transaction Lifecycle & Switch Routing',
    workflowSubtitle: 'How a payment travels from user handle through NPCI switch to instant merchant credit.',
    workflowSteps: [
      { step: '01', title: 'VPA Handle Lookup', description: 'Virtual Payment Address (e.g. user@adyapan) resolved against central NPCI directory.', techNode: 'VPA Directory' },
      { step: '02', title: 'Encrypted UPI MPIN 2FA', description: 'Payer authorizes transaction via bank-grade MPIN in secure NPCI common library.', techNode: 'NPCI MPIN Auth' },
      { step: '03', title: 'Debit Remitter Bank Core', description: 'Remitter bank account debited through core banking API rail.', techNode: 'Remitter Core' },
      { step: '04', title: 'NPCI Central Switch Clearing', description: 'Dual-side confirmation verified and routed to beneficiary acquiring node.', techNode: 'NPCI Central Switch' },
      { step: '05', title: 'Beneficiary Credit & Webhook', description: 'Merchant account credited instantly and real-time webhook callback dispatched.', techNode: 'Settlement Webhook' },
    ],
    features: [
      { title: 'Sub-650ms Settlement Latency', description: 'Direct switch connections minimizing hop delays for blazing fast checkout speeds.', iconName: 'Zap' },
      { title: 'Recurring UPI Autopay Mandates', description: 'Set up recurring auto-debit mandates for EMI collections, insurance, and subscriptions.', iconName: 'Clock' },
      { title: 'Dynamic Merchant QR Generator', description: 'Generate invoice-specific QR codes with pre-filled payment amounts and transaction IDs.', iconName: 'QrCode' },
      { title: 'Credit on UPI Architecture', description: 'Support for linking approved pre-sanctioned bank credit lines directly to UPI handles.', iconName: 'Sparkles' },
      { title: 'Active-Active Multi-Bank Switch', description: 'Automatic real-time routing to backup partner banks when primary nodes experience latency.', iconName: 'ShieldCheck' },
      { title: 'Automated Dispute & Chargeback Engine', description: 'Instant auto-refund triggers and standardized dispute tracking aligned with NPCI guidelines.', iconName: 'CheckCircle2' },
    ],
    specs: [
      { label: 'Turnaround Latency', value: '< 650ms', badge: 'Ultra Fast' },
      { label: 'Settlement Speed', value: 'T+0 Real-Time Gross', badge: 'Instant' },
      { label: 'Supported Mandates', value: 'UPI Autopay (Single / Recurring)', badge: 'NPCI 2.0' },
      { label: 'Switch Reliability', value: '99.98% Active-Active Mesh', badge: 'Zero Downtime' },
    ],
    relatedProducts: [
      { slug: 'credit-line-upi', title: 'Credit Line on UPI', category: 'Payments & Settlement', description: 'Bank credit line linked to UPI VPAs.' },
      { slug: 'merchant-qr-soundbox', title: 'Merchant QR Soundbox', category: 'Payments & Settlement', description: '4G IoT audio payment notification speaker.' },
      { slug: 'core-banking-engine', title: 'Core Banking Engine', category: 'Banking & Core', description: 'Real-time double-entry settlement engine.' },
    ],
  },

  // ── 10. Cross-Border Wire ──
  'cross-border-wire': {
    slug: 'cross-border-wire',
    category: 'Payments & Settlement',
    name: 'Cross-Border Wire',
    tagline: 'Real-Time Multi-Currency FX Remittance & Trade Settlement',
    headline: 'Moving Financial Value Seamlessly',
    highlightText: 'Across Global Borders & Currencies',
    subheadline:
      'Execute international cross-border payments with guaranteed wholesale FX rate locks, SWIFT GPI tracking, automated FEMA compliance, and local clearing rails.',
    heroMetrics: [
      { value: 'Wholesale FX', label: 'Real-Time Spreads' },
      { value: 'SWIFT GPI', label: 'End-to-End Tracking' },
      { value: 'FEMA Ready', label: 'Automated Regulatory Log' },
      { value: '50+ Corridors', label: 'Global Currency Support' },
    ],
    simulatorType: 'cross-border-fx',
    problemSolved: {
      challenge: 'International wire transfers take 3-5 days with hidden FX markups, lost intermediary bank fees, and complex manual FEMA compliance filings.',
      solution: 'Direct bilateral clearing corridors with guaranteed FX rate locking, automated Purpose Code tagging, and SWIFT GPI tracking.',
      impact: 'Save up to 80% on FX spreads while settling international business payments in under 4 hours.',
    },
    workflowTitle: 'Global Remittance & FX Settlement Path',
    workflowSubtitle: 'How international funds are converted, verified for compliance, and disbursed to local bank accounts.',
    workflowSteps: [
      { step: '01', title: 'FX Rate Lock & Ingest', description: 'Wholesale live market FX spread locked for a 30-minute execution window.', techNode: 'FX Pricing Engine' },
      { step: '02', title: 'FEMA & Purpose Code Check', description: 'Regulatory Purpose Code and invoice documentation verified for RBI compliance.', techNode: 'Compliance Guard' },
      { step: '03', title: 'Global Inbound Rail Clearance', description: 'Funds received via local clearing in USA, UK, EU, or SWIFT network.', techNode: 'Global Inbound Node' },
      { step: '04', title: 'Real-Time SWIFT GPI Ingest', description: 'Status milestones broadcast to tracking dashboard with unique UETR code.', techNode: 'SWIFT GPI Tracker' },
      { step: '05', title: 'Domestic Disbursal via RTGS/NEFT', description: 'Converted INR credited to beneficiary bank account in under 20 minutes.', techNode: 'Domestic Rail' },
    ],
    features: [
      { title: 'Guaranteed Wholesale FX Rate Lock', description: 'Lock live interbank exchange rates with zero hidden markups or unexpected fees.', iconName: 'DollarSign' },
      { title: 'Real-Time SWIFT GPI UETR Tracking', description: 'Track payments across every intermediary bank node with minute-by-minute status timestamps.', iconName: 'Globe' },
      { title: 'Automated FEMA Regulatory Filing', description: 'Automated generation of Electronic Bank Realization Certificates (e-BRC) and FIRC.', iconName: 'FileCheck' },
      { title: 'Local In-Country Clearing Accounts', description: 'Provide international clients with local virtual IBANs in USD, EUR, GBP, and SGD.', iconName: 'Building2' },
      { title: 'Sanctions & AML Screening', description: 'Automated real-time OFAC, UN, and PEP blacklist screening before wire release.', iconName: 'ShieldCheck' },
      { title: 'Batch Cross-Border Vendor Payouts', description: 'Disburse payroll and software vendor invoices globally with a single file upload.', iconName: 'Zap' },
    ],
    specs: [
      { label: 'Settlement Time', value: '< 4 Hours (Major Corridors)', badge: 'Fast Track' },
      { label: 'Supported Currencies', value: 'USD, EUR, GBP, SGD, AED, INR', badge: '50+ Corridors' },
      { label: 'Tracking Standard', value: 'SWIFT GPI UETR Protocol', badge: 'Real-Time' },
      { label: 'Regulatory Filings', value: 'Automated e-BRC / FIRC', badge: 'FEMA Compliant' },
    ],
    relatedProducts: [
      { slug: 'neobanking-portal', title: 'Neobanking Portal', category: 'Banking & Core', description: 'Multi-currency business accounts for export/import.' },
      { slug: 'connect-api-gateway', title: 'Connect API Gateway', category: 'Banking & Core', description: 'API interfaces for global treasury settlement.' },
      { slug: 'immutable-audit-trail', title: 'Immutable Audit Trail', category: 'AI Risk & Compliance', description: 'Cryptographic log of international FX filings.' },
    ],
  },

  // ── 11. Merchant QR Soundbox ──
  'merchant-qr-soundbox': {
    slug: 'merchant-qr-soundbox',
    category: 'Payments & Settlement',
    name: 'Merchant QR Soundbox',
    tagline: '4G IoT Voice Audio Alerts & Dynamic QR Acquiring',
    headline: 'Making Every Retail Payment',
    highlightText: 'Instantly Audible, Verified & Secure',
    subheadline:
      'Empower physical retailers with dynamic QR acquiring and instant 4G IoT voice soundbox alerts in 10+ regional languages with zero MDR transaction fees.',
    heroMetrics: [
      { value: '< 1.2s', label: 'Audio Alert Speed' },
      { value: 'Dual 4G/2G', label: 'IoT SIM Connectivity' },
      { value: '10+ Languages', label: 'Regional Voice Audio' },
      { value: '0% MDR', label: 'Direct UPI Routing' },
    ],
    simulatorType: 'qr-soundbox',
    problemSolved: {
      challenge: 'Retailers lose money to fake payment screenshots, SMS notification delays, and noisy shop environments during peak hours.',
      solution: 'Ruggedized 4G IoT audio speaker that broadcasts instant crystal-clear voice confirmation the moment payment clears on the switch.',
      impact: 'Eliminate fraud from fake payment apps and reduce checkout queue times by 40% with instant audio verification.',
    },
    workflowTitle: 'QR Scan to 4G IoT Voice Alert Sequence',
    workflowSubtitle: 'How an in-store customer payment triggers a loud voice confirmation in under 1.2 seconds.',
    workflowSteps: [
      { step: '01', title: 'Customer Scans Dynamic QR', description: 'Customer scans Adyapan UPI QR on merchant counter using any UPI app.', techNode: 'Dynamic QR Core' },
      { step: '02', title: 'Payment Authorized on NPCI', description: 'Customer enters UPI PIN; payment clears through NPCI switch.', techNode: 'NPCI Switch' },
      { step: '03', title: 'Adyapan Cloud Event Trigger', description: 'Acquiring switch registers success and dispatches MQTT IoT event payload.', techNode: 'MQTT Cloud Server' },
      { step: '04', title: '4G Cellular OTA Transmission', description: 'Payload pushed to encrypted Soundbox hardware over 4G VoLTE SIM connection.', techNode: '4G IoT Module' },
      { step: '05', title: 'Crystal-Clear Audio Broadcast', description: '"Payment of ₹500 received on Adyapan UPI" broadcast in selected language.', techNode: 'Dual-Speaker DSP' },
    ],
    features: [
      { title: 'Sub-1.2s Audio Notification', description: 'Blazing fast MQTT protocol delivers audio alert the second transaction commits.', iconName: 'Zap' },
      { title: '10+ Regional Voice Languages', description: 'Broadcast in Hindi, Tamil, Telugu, Kannada, Marathi, Bengali, Gujarati, English, etc.', iconName: 'Smartphone' },
      { title: 'Long-Life 7-Day Battery Standby', description: 'High-capacity 2600mAh rechargeable lithium battery engineered for all-day street stalls.', iconName: 'Clock' },
      { title: 'Anti-Tamper Firmware Security', description: 'Hardware-level encryption preventing unauthorized device cloning or SIM extraction.', iconName: 'Lock' },
      { title: 'Integrated OLED Payment Screen', description: 'Dual confirmation showing exact rupee amount and battery percentage on display.', iconName: 'QrCode' },
      { title: 'Daily Voice Business Summary', description: 'Press replay button to hear total daily collection volume and transaction count.', iconName: 'TrendingUp' },
    ],
    specs: [
      { label: 'Voice Alert SLA', value: '< 1.2 Seconds', badge: 'Instant Audio' },
      { label: 'Cellular Module', value: '4G LTE CAT-1 with 2G Fallback', badge: 'Dual Sim' },
      { label: 'Audio Speaker', value: '3W High-Output Neodymium', badge: 'Shop Proof' },
      { label: 'Battery Capacity', value: '2600mAh (7 Days Standby)', badge: 'Rechargeable' },
    ],
    relatedProducts: [
      { slug: 'npci-upi-network', title: 'NPCI UPI Network', category: 'Payments & Settlement', description: 'Underlying UPI clearing and settlement switch.' },
      { slug: 'credit-line-upi', title: 'Credit Line on UPI', category: 'Payments & Settlement', description: 'Accept credit line payments on merchant soundboxes.' },
      { slug: 'sme-business-credit', title: 'SME Business Credit', category: 'Lending Solutions', description: 'Merchant cash-advance loans based on QR volume.' },
    ],
  },

  // ── 12. Credit Line on UPI ──
  'credit-line-upi': {
    slug: 'credit-line-upi',
    category: 'Payments & Settlement',
    name: 'Credit Line on UPI',
    tagline: 'Pre-Approved Revolving Credit Linked to UPI VPAs',
    headline: 'Pre-Approved Credit Where The',
    highlightText: 'Everyday Transaction Actually Happens',
    subheadline:
      'Link pre-approved bank credit lines directly to UPI handles. Enable consumers to scan any merchant QR and pay on credit without physical plastic cards.',
    heroMetrics: [
      { value: 'Zero Cards', label: 'Pure Digital Credit' },
      { value: '30-Day', label: 'Interest-Free Grace' },
      { value: '< 900ms', label: 'Drawdown Auth' },
      { value: 'Any QR', label: 'Universal In-Store Pay' },
    ],
    simulatorType: 'credit-line-upi',
    problemSolved: {
      challenge: 'Credit card penetration in India is under 6% due to high annual fees, physical plastic requirements, and merchant swipe machine limits.',
      solution: 'Pre-sanctioned bank credit lines attached directly to existing UPI VPAs, enabling scan-and-pay on 50M+ standard QR codes.',
      impact: 'Expand credit accessibility tenfold by transforming every merchant QR into an instant credit checkout point.',
    },
    workflowTitle: 'Credit Line on UPI Drawdown & Repayment Flow',
    workflowSubtitle: 'How a consumer scans a merchant QR and pays from their credit facility.',
    workflowSteps: [
      { step: '01', title: 'QR Scan on PhonePe/GPay', description: 'Consumer scans merchant QR code using any UPI application.', techNode: 'Merchant POS' },
      { step: '02', title: 'Select Pre-Approved Credit Line', description: 'Borrower selects "Adyapan Credit Line" as the payment source instead of bank balance.', techNode: 'UPI App Selector' },
      { step: '03', title: 'Sub-900ms Credit Check', description: 'Available credit boundary verified and transaction authorized via UPI MPIN.', techNode: 'Risk Core' },
      { step: '04', title: 'Merchant Instant T+0 Credit', description: 'Merchant receives instant cash settlement into their current account.', techNode: 'NPCI Switch' },
      { step: '05', title: 'Consolidated Monthly Bill', description: 'Drawdowns consolidated into a single monthly statement with flexible EMI conversion.', techNode: 'Billing Engine' },
    ],
    features: [
      { title: 'Universal QR Compatibility', description: 'Works across all 50M+ merchant QR codes in India without requiring special swipe machines.', iconName: 'QrCode' },
      { title: '30-Day Interest-Free Period', description: 'Zero interest charged on retail purchases when monthly statement balance is cleared on time.', iconName: 'Percent' },
      { title: '1-Click EMI Conversion', description: 'Convert transactions above ₹2,500 into 3, 6, or 12-month low-interest EMI plans.', iconName: 'Calculator' },
      { title: 'Real-Time Limit Restoration', description: 'Instant restoration of available drawing limit the second repayment is credited.', iconName: 'TrendingUp' },
      { title: 'Dynamic Merchant Category Caps', description: 'Bank partners can set custom daily spending caps on high-risk merchant categories.', iconName: 'ShieldCheck' },
      { title: 'Automated Repayment Autopay', description: 'Auto-debit linked bank accounts on bill due dates to avoid late payment markups.', iconName: 'Clock' },
    ],
    specs: [
      { label: 'Drawdown Speed', value: '< 900ms', badge: 'Ultra Fast' },
      { label: 'Interest Grace', value: 'Up to 30 Days 0% Interest', badge: 'Zero Cost' },
      { label: 'Acceptance Network', value: '50M+ RuPay & UPI Merchant QRs', badge: 'Universal' },
      { label: 'Repayment Rail', value: 'UPI Autopay / e-NACH', badge: 'Automated' },
    ],
    relatedProducts: [
      { slug: 'npci-upi-network', title: 'NPCI UPI Network', category: 'Payments & Settlement', description: 'UPI switch infrastructure.' },
      { slug: 'bnpl', title: '0% 3-Month BNPL', category: 'Lending Solutions', description: 'E-commerce split checkout financing.' },
      { slug: 'personal-loans', title: 'Personal Loans', category: 'Lending Solutions', description: 'Larger ticket term loans.' },
    ],
  },

  // ── 13. DigiLocker e-KYC ──
  'digilocker-ekyc': {
    slug: 'digilocker-ekyc',
    category: 'AI Risk & Compliance',
    name: 'DigiLocker e-KYC',
    tagline: 'Government-Certified Instant Identity & Document Verification',
    headline: 'Identity Verification Without',
    highlightText: 'A Single Sheet of Physical Paperwork',
    subheadline:
      'Instantly fetch and verify Aadhaar, PAN, driving license, and bank accounts through government-certified DigiLocker APIs with AI 3D face liveness matching.',
    heroMetrics: [
      { value: '< 45s', label: 'Complete KYC Flow' },
      { value: '100%', label: 'Paperless Verification' },
      { value: '256-Bit', label: 'Bank-Grade Encryption' },
      { value: 'Aadhaar + PAN', label: 'Direct UIDAI/NSDL Fetch' },
    ],
    simulatorType: 'digilocker-wizard',
    problemSolved: {
      challenge: 'Manual document verification causes 40% customer drop-off, high operational costs, and vulnerabilities to forged physical photocopy documents.',
      solution: 'Direct integration with DigiLocker ecosystem fetching cryptographically signed XML documents directly from issuing government authorities.',
      impact: 'Complete customer onboarding in under 45 seconds with 100% counterfeit document elimination.',
    },
    workflowTitle: 'Government-Certified DigiLocker e-KYC Journey',
    workflowSubtitle: 'How borrower identity is validated directly against central government databases.',
    workflowSteps: [
      { step: '01', title: 'Borrower Digital Consent', description: 'Borrower provides explicit OTP consent to access DigiLocker repository.', techNode: 'Consent Gateway' },
      { step: '02', title: 'Encrypted XML Document Fetch', description: 'Aadhaar and PAN fetched as cryptographically signed XML from UIDAI/NSDL.', techNode: 'DigiLocker Switch' },
      { step: '03', title: 'AI 3D Face Liveness Match', description: 'Borrower takes selfie; 3D depth camera matches face against Aadhaar photo.', techNode: 'Vision AI Engine' },
      { step: '04', title: 'Penny-Drop Bank Account Match', description: '₹1 transferred to verify account holder name match against PAN name.', techNode: 'Penny Drop Core' },
      { step: '05', title: 'Verified Customer 360 Profile', description: 'Tamper-proof compliance profile generated and stored in immutable vault.', techNode: 'Vault Core' },
    ],
    features: [
      { title: 'Direct UIDAI & NSDL Integration', description: 'Fetch authentic identity records directly from government servers without manual uploads.', iconName: 'ShieldCheck' },
      { title: 'AI 3D Face Liveness Detection', description: 'Detect spoofing, screen replays, and silicone masks with sub-second neural liveness check.', iconName: 'Sparkles' },
      { title: 'Automated Penny-Drop Verification', description: 'Validate bank account ownership and name matching instantly before loan disbursal.', iconName: 'Zap' },
      { title: 'PAN-Aadhaar Name Match Fuzzy AI', description: 'Resolve minor spelling differences across government databases using smart Levenshtein AI.', iconName: 'FileCheck' },
      { title: 'Cryptographically Signed Records', description: 'All fetched documents contain valid PKI signatures from authorized issuers.', iconName: 'Lock' },
      { title: 'RBI Video KYC (v-KYC) Fallback', description: 'Seamless failover to live geo-tagged video KYC session when biometric discrepancies arise.', iconName: 'CheckCircle2' },
    ],
    specs: [
      { label: 'Verification Latency', value: '< 45 Seconds', badge: 'Ultra Fast' },
      { label: 'Document Issuers', value: 'UIDAI / NSDL / MoRTH / DigiLocker', badge: 'Govt Certified' },
      { label: 'Face Match Accuracy', value: '99.7% 3D Depth Neural Model', badge: 'Anti-Spoof' },
      { label: 'Data Encryption', value: 'AES-256 at Rest & TLS 1.3 in Flight', badge: 'Zero Trust' },
    ],
    relatedProducts: [
      { slug: 'ai-underwriting', title: 'AI Underwriting Scorecard', category: 'AI Risk & Compliance', description: 'Credit decisioning engine utilizing KYC data.' },
      { slug: 'personal-loans', title: 'Personal Loans', category: 'Lending Solutions', description: 'Instant loan origination powered by e-KYC.' },
      { slug: 'immutable-audit-trail', title: 'Immutable Audit Trail', category: 'AI Risk & Compliance', description: 'Audit trail for regulatory compliance logs.' },
    ],
  },

  // ── 14. AI Underwriting Scorecard ──
  'ai-underwriting': {
    slug: 'ai-underwriting',
    category: 'AI Risk & Compliance',
    name: 'AI Underwriting Scorecard',
    tagline: 'Multi-Pillar Credit Risk & Alternative Data Decision Engine',
    headline: 'Turning Thousands of Signals',
    highlightText: 'Into Smarter, Safer Credit Decisions',
    subheadline:
      'Evaluate borrower creditworthiness across 4 core pillars: Income Stability, Debt Obligations, Bureau Track Record, and Alternative Cash Flow signals.',
    heroMetrics: [
      { value: '38% Lower', label: 'Portfolio NPA Rate' },
      { value: '4 Pillars', label: 'Holistic Risk Matrix' },
      { value: 'Multi-Bureau', label: 'CIBIL / Experian / CRIF XML' },
      { value: '< 3s', label: 'Scorecard Decisioning' },
    ],
    simulatorType: 'ai-scorecard',
    problemSolved: {
      challenge: 'Traditional underwriting relies purely on outdated credit bureau scores, unfairly rejecting creditworthy new-to-credit borrowers.',
      solution: 'Multi-dimensional machine learning scorecard combining banking transaction velocity, SMS cash flows, and traditional bureau XML.',
      impact: 'Increase loan approval rates by 32% while reducing 90+ Day Past Due (DPD) non-performing assets by 38%.',
    },
    workflowTitle: 'Multi-Pillar AI Underwriting Decision Pipeline',
    workflowSubtitle: 'How raw financial signals are converted into an automated credit sanction boundary.',
    workflowSteps: [
      { step: '01', title: 'Alternative Data & Statement Ingest', description: 'Bank statements, GST returns, and utility payments ingested via Account Aggregator.', techNode: 'Data Aggregator' },
      { step: '02', title: 'Multi-Bureau XML Normalization', description: 'Credit reports from CIBIL, Experian, and CRIF parsed into unified risk features.', techNode: 'Bureau Parser' },
      { step: '03', title: '4-Pillar Neural Risk Scoring', description: 'Income, debt burden, repayment track, and behavioral signals scored on 300-900 scale.', techNode: 'ML Risk Core' },
      { step: '04', title: 'Policy Rule Matrix & DTI Bound', description: 'Hard regulatory policy gates (age, minimum income, maximum DTI) evaluated.', techNode: 'Policy Engine' },
      { step: '05', title: 'Sanction Tier & Pricing Recommendation', description: 'Final approved loan limit, customized interest rate, and tenure bounds emitted.', techNode: 'Sanction Decision' },
    ],
    features: [
      { title: '4-Pillar Credit Risk Architecture', description: 'Balance analysis across Income Stability, Debt Capacity, Bureau History, and Behavioral Flow.', iconName: 'Cpu' },
      { title: '38% Reduction in Portfolio NPAs', description: 'Machine learning algorithms detect early delinquency patterns before default occurs.', iconName: 'TrendingUp' },
      { title: 'Account Aggregator Real-Time Ingest', description: 'Zero PDF forgery risk by streaming verified bank transactions directly from partner banks.', iconName: 'ShieldCheck' },
      { title: 'Explainable AI Decision Audit', description: 'Clear reason codes generated for every approval or adverse rejection for compliance.', iconName: 'FileCheck' },
      { title: 'Dynamic Risk-Based Pricing', description: 'Automatically offer lower interest rates to prime borrowers while pricing risk accurately.', iconName: 'Percent' },
      { title: 'Automated Fraud & Circular Fund Ring Scan', description: 'Detect artificial round-tripping deposits and fabricated salary credits instantly.', iconName: 'Lock' },
    ],
    specs: [
      { label: 'Decision Latency', value: '< 3 Seconds', badge: 'Real-Time' },
      { label: 'Bureau Support', value: 'CIBIL / Experian / CRIF / Equifax', badge: 'Universal' },
      { label: 'NPA Reduction', value: '38% vs Traditional Rule Sets', badge: 'Proven Lift' },
      { label: 'Explainability', value: 'SHAP Reason Codes for RBI Compliance', badge: 'Transparent' },
    ],
    relatedProducts: [
      { slug: 'automated-dti-policy', title: 'Automated DTI Policy', category: 'AI Risk & Compliance', description: 'Debt-to-income and FOIR boundary rules.' },
      { slug: 'personal-loans', title: 'Personal Loans', category: 'Lending Solutions', description: 'Consumer lending powered by AI underwriting.' },
      { slug: 'sme-business-credit', title: 'SME Business Credit', category: 'Lending Solutions', description: 'Business credit limits calculated via cash-flow models.' },
    ],
  },

  // ── 15. Immutable Audit Trail ──
  'immutable-audit-trail': {
    slug: 'immutable-audit-trail',
    category: 'AI Risk & Compliance',
    name: 'Immutable Audit Trail',
    tagline: 'Cryptographically Signed SHA-256 WORM Event Ledger',
    headline: 'Every Financial Action Leaves An',
    highlightText: 'Unbreakable, Tamper-Proof Audit Trace',
    subheadline:
      'Enforce regulatory governance with append-only WORM event logs. Cryptographic SHA-256 hash chains ensure zero retrospective record tampering and instant RBI inspection reports.',
    heroMetrics: [
      { value: 'SHA-256', label: 'Cryptographic Hash' },
      { value: '7+ Years', label: 'WORM Compliant Retention' },
      { value: 'Zero', label: 'Tamper Tolerance' },
      { value: 'RBI Ready', label: '1-Click Audit Export' },
    ],
    simulatorType: 'immutable-ledger',
    problemSolved: {
      challenge: 'Internal fraud, unauthorized balance edits, and difficult regulatory compliance audits cost financial institutions millions annually.',
      solution: 'Append-only event store where every loan approval, disbursal, and repayment is signed and linked to previous block hashes.',
      impact: 'Guarantee 100% tamper-evident security and generate instant compliance audit reports in seconds.',
    },
    workflowTitle: 'Event Serialization & Cryptographic Hash Chain Flow',
    workflowSubtitle: 'How financial mutations are serialized, hashed, and committed to immutable WORM storage.',
    workflowSteps: [
      { step: '01', title: 'Action Ingest & State Diff Capture', description: 'User ID, IP address, timestamp, and before/after state diff captured.', techNode: 'Audit Interceptor' },
      { step: '02', title: 'Payload Canonical Serialization', description: 'Event payload serialized into deterministic JSON string structure.', techNode: 'Canonicalizer' },
      { step: '03', title: 'SHA-256 Hash Chaining', description: 'Current block hash computed using payload data and previous event block hash.', techNode: 'Crypto Hash Core' },
      { step: '04', title: 'WORM Vault Storage Commit', description: 'Log record written to Write-Once-Read-Many cloud storage vault.', techNode: 'WORM Storage Vault' },
      { step: '05', title: 'Instant Regulatory Export Generation', description: 'Audit trails formatted into RBI-compliant PDF and JSON packages.', techNode: 'Export Generator' },
    ],
    features: [
      { title: 'Cryptographic SHA-256 Hash Chains', description: 'Any unauthorized database mutation immediately invalidates subsequent block hashes.', iconName: 'Lock' },
      { title: 'Tamper-Evident WORM Cloud Vault', description: 'Write-Once-Read-Many storage prevents deletion or modification even by database superadmins.', iconName: 'ShieldCheck' },
      { title: 'Granular Role-Based Diff Tracking', description: 'Track exact user identity, IP address, timestamp, and field-level diff for every approval.', iconName: 'Database' },
      { title: '1-Click RBI Inspection Reports', description: 'Generate comprehensive audit exports formatted specifically for banking regulator reviews.', iconName: 'FileCheck' },
      { title: 'Real-Time Anomaly & Tamper Alerts', description: 'Automated alert triggers when unusual bulk loan approvals or permission changes occur.', iconName: 'Zap' },
      { title: '7-Year Retention Compliance', description: 'Compliant long-term cold storage retention preserving historical financial records.', iconName: 'Clock' },
    ],
    specs: [
      { label: 'Digest Algorithm', value: 'SHA-256 Hash Chain', badge: 'Crypto Safe' },
      { label: 'Storage Standard', value: 'WORM Immutable Vault', badge: 'Tamper Proof' },
      { label: 'Retention Period', value: '7+ Years Regulatory Compliant', badge: 'RBI Spec' },
      { label: 'Export Formats', value: 'Encrypted JSON / Signed PDF', badge: 'Audit Ready' },
    ],
    relatedProducts: [
      { slug: 'core-banking-engine', title: 'Core Banking Engine', category: 'Banking & Core', description: 'Underlying ledger events recorded to audit trail.' },
      { slug: 'ai-underwriting', title: 'AI Underwriting Scorecard', category: 'AI Risk & Compliance', description: 'Credit decision reason codes and approvals logged.' },
      { slug: 'automated-dti-policy', title: 'Automated DTI Policy', category: 'AI Risk & Compliance', description: 'Policy overrides and boundary exceptions logged.' },
    ],
  },

  // ── 16. Automated DTI Policy ──
  'automated-dti-policy': {
    slug: 'automated-dti-policy',
    category: 'AI Risk & Compliance',
    name: 'Automated DTI Policy',
    tagline: 'Real-Time Debt-to-Income & FOIR Affordability Policy Engine',
    headline: 'Keeping Borrower Affordability',
    highlightText: 'Crystal Clear, Responsible & Compliant',
    subheadline:
      'Enforce responsible lending standards with dynamic Debt-to-Income (DTI) and Fixed Obligation to Income Ratio (FOIR) computation directly linked to bureau liabilities.',
    heroMetrics: [
      { value: '50% Bound', label: 'Standard FOIR Ceiling' },
      { value: 'Auto-Bureau', label: 'Live Active Loan Scan' },
      { value: 'Zero Over-Leverage', label: 'Responsible Lending' },
      { value: '< 1.5s', label: 'Policy Calculation' },
    ],
    simulatorType: 'dti-gauge',
    problemSolved: {
      challenge: 'Borrowers concealing existing debt obligations leads to over-leveraging and subsequent loan default.',
      solution: 'Automated DTI policy engine that scans active bureau debt obligations and calculates true disposable income limits.',
      impact: 'Eliminate over-leveraged defaults and ensure 100% adherence to RBI responsible lending directives.',
    },
    workflowTitle: 'Automated DTI & FOIR Calculation Pipeline',
    workflowSubtitle: 'How gross income and active obligations are evaluated to determine safe loan capacity.',
    workflowSteps: [
      { step: '01', title: 'Verified Income Intake', description: 'Salary slips, bank credits, and tax returns validated to establish gross monthly income.', techNode: 'Income Normalizer' },
      { step: '02', title: 'Active Bureau Liabilities Scan', description: 'Active EMIs, credit card minimum dues, and co-signed loans aggregated from bureau XML.', techNode: 'Liability Aggregator' },
      { step: '03', title: 'FOIR & Disposable Income Calculation', description: 'Existing obligations compared against gross income to determine FOIR percentage.', techNode: 'FOIR Calculator' },
      { step: '04', title: 'Max Allowable EMI Boundary', description: 'Maximum safe monthly EMI capacity calculated under 50% regulatory ceiling.', techNode: 'Policy Bounds' },
      { step: '05', title: 'Sanction Cap Emission', description: 'Maximum approved loan tenure and principal amount sent to loan origination wizard.', techNode: 'Sanction Output' },
    ],
    features: [
      { title: 'Dynamic Multi-Tier FOIR Ceilings', description: 'Configurable FOIR thresholds (40% for entry-level, up to 60% for high-net-worth borrowers).', iconName: 'Percent' },
      { title: 'Live Bureau Liability Ingestion', description: 'Automatically detects undisclosed active personal loans and credit card outstanding balances.', iconName: 'ShieldCheck' },
      { title: 'Co-Borrower Income & Debt Aggregation', description: 'Calculate combined household FOIR when adding spouse or parent co-applicants.', iconName: 'Users' },
      { title: 'Disposable Income Cushion Guarantee', description: 'Ensures borrower retains sufficient post-EMI monthly cash for essential living expenses.', iconName: 'TrendingUp' },
      { title: 'Configurable Credit Policy Matrix', description: 'Custom rule builder allowing risk managers to update DTI thresholds without code deploys.', iconName: 'Layers' },
      { title: 'Automated Adverse Action Notice', description: 'Generates transparent reason letters if applicant exceeds safe debt capacity limits.', iconName: 'FileCheck' },
    ],
    specs: [
      { label: 'Calculation Latency', value: '< 1.5 Seconds', badge: 'Instant' },
      { label: 'Bureau Sync Rail', value: 'Live CIBIL / Experian / CRIF XML', badge: 'Automated' },
      { label: 'Policy Standard', value: 'RBI Fair Practice Code Compliant', badge: 'Regulatory' },
      { label: 'Override Control', value: 'Senior Credit Officer 2FA Override', badge: 'Governance' },
    ],
    relatedProducts: [
      { slug: 'ai-underwriting', title: 'AI Underwriting Scorecard', category: 'AI Risk & Compliance', description: 'Holistic risk scoring engine.' },
      { slug: 'personal-loans', title: 'Personal Loans', category: 'Lending Solutions', description: 'Personal loan origination with DTI checks.' },
      { slug: 'home-mortgages', title: 'Home Mortgages', category: 'Lending Solutions', description: 'Long-term mortgage affordability assessment.' },
    ],
  },
};
