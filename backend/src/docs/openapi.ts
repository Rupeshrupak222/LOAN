// OpenAPI 3.0 specification for Adyapan Loan Management System
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Adyapan Loan Management System API',
    version: '1.0.0',
    description: 'Enterprise REST API specification for Adyapan LMS. Comprehensive loan lifecycle, underwriting, servicing, payments, and risk management.',
  },
  servers: [{ url: '/api/v1', description: 'Primary API Gateway' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Staff & Borrower Login',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['identifier', 'password'],
                properties: {
                  identifier: { type: 'string', example: 'admin@adyapan.dev' },
                  password: { type: 'string', example: 'Passw0rd!123' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'JWT Access & Refresh Token' } },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Rotate Refresh Token',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'New token pair' } },
      },
    },
    '/auth/me': {
      get: { tags: ['Authentication'], summary: 'Active User Profile & Permissions', responses: { '200': { description: 'User Profile' } } },
    },
    '/auth/logout': {
      post: { tags: ['Authentication'], summary: 'Revoke Current Session', responses: { '200': { description: 'Logged out' } } },
    },
    '/customers': {
      get: { tags: ['Customers'], summary: 'Search & List Customers', responses: { '200': { description: 'Paginated customer records' } } },
      post: {
        tags: ['Customers'],
        summary: 'Create / Onboard New Customer',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'mobile'],
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  mobile: { type: 'string' },
                  email: { type: 'string' },
                  panNumber: { type: 'string' },
                  aadhaarNumber: { type: 'string' },
                  monthlyIncome: { type: 'number' },
                  employmentType: { type: 'string', enum: ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'OTHER'] },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Customer created' } },
      },
    },
    '/customers/{id}': {
      get: { tags: ['Customers'], summary: 'Get Customer 360 Profile', responses: { '200': { description: 'Full customer details' } } },
      patch: { tags: ['Customers'], summary: 'Update Customer Profile', responses: { '200': { description: 'Updated customer' } } },
    },
    '/customers/{id}/kyc': {
      patch: {
        tags: ['Customers'],
        summary: 'Update KYC Verification Status',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['kycStatus'],
                properties: {
                  kycStatus: { type: 'string', enum: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'] },
                  riskCategory: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
                  remarks: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'KYC status updated' } },
      },
    },
    '/documents': {
      post: {
        tags: ['Documents'],
        summary: 'Upload / Register Customer Document',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customerId', 'category', 'documentType', 'fileName', 'fileUrl'],
                properties: {
                  customerId: { type: 'string' },
                  category: { type: 'string' },
                  documentType: { type: 'string' },
                  fileName: { type: 'string' },
                  fileUrl: { type: 'string' },
                  expiryDate: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Document registered' } },
      },
    },
    '/documents/{id}/verify': {
      patch: {
        tags: ['Documents'],
        summary: 'Verify or Reject Document',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['verified'],
                properties: {
                  verified: { type: 'boolean' },
                  remarks: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Document verification updated' } },
      },
    },
    '/loan-products': {
      get: { tags: ['Loan Products'], summary: 'List Active Loan Products', responses: { '200': { description: 'Array of loan products' } } },
      post: { tags: ['Loan Products'], summary: 'Create Loan Product', responses: { '201': { description: 'Product created' } } },
    },
    '/applications': {
      get: { tags: ['Loan Applications'], summary: 'List Applications Queue', responses: { '200': { description: 'Paginated loan applications' } } },
      post: {
        tags: ['Loan Applications'],
        summary: 'Submit Loan Application Proposal',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customerId', 'productId', 'requestedAmount', 'tenureMonths'],
                properties: {
                  customerId: { type: 'string' },
                  productId: { type: 'string' },
                  requestedAmount: { type: 'number' },
                  tenureMonths: { type: 'integer' },
                  purpose: { type: 'string' },
                  branchId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Application created' } },
      },
    },
    '/applications/{id}': {
      get: { tags: ['Loan Applications'], summary: 'Get Application Details & Analysis', responses: { '200': { description: 'Application details' } } },
    },
    '/eligibility/evaluate/{applicationId}': {
      post: { tags: ['Policy Engine'], summary: 'Run Automated Eligibility & DTI Evaluation', responses: { '200': { description: 'Eligibility Assessment' } } },
    },
    '/risk/evaluate/{applicationId}': {
      post: { tags: ['Risk Engine'], summary: 'Run 4-Pillar Credit Risk Model', responses: { '200': { description: 'Credit Risk Score' } } },
    },
    '/underwriting/queue': {
      get: { tags: ['Underwriting'], summary: 'Get Credit Decision Queue', responses: { '200': { description: 'Pending underwriting applications' } } },
    },
    '/underwriting/{applicationId}/decision': {
      post: {
        tags: ['Underwriting'],
        summary: 'Submit Credit Committee / Sanction Decision',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['decision'],
                properties: {
                  decision: { type: 'string', enum: ['APPROVE', 'APPROVE_WITH_CONDITIONS', 'SEND_BACK', 'REJECT'] },
                  reason: { type: 'string' },
                  conditions: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Decision recorded' } },
      },
    },
    '/disbursements/queue': {
      get: { tags: ['Disbursements'], summary: 'Get Ready-for-Disbursement Queue', responses: { '200': { description: 'Sanctioned applications awaiting payout' } } },
    },
    '/disbursements/execute': {
      post: {
        tags: ['Disbursements'],
        summary: 'Execute Atomic Electronic Fund Disbursement',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['applicationId', 'disbursementMethod', 'referenceNumber'],
                properties: {
                  applicationId: { type: 'string' },
                  disbursementMethod: { type: 'string', enum: ['NEFT_BANK_TRANSFER', 'RTGS', 'IMPS', 'CHEQUE', 'UPI'] },
                  referenceNumber: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Loan account active and schedule generated' } },
      },
    },
    '/loans': {
      get: { tags: ['Loan Accounts'], summary: 'List Servicing Loan Accounts', responses: { '200': { description: 'Paginated loan accounts' } } },
    },
    '/loans/{id}': {
      get: { tags: ['Loan Accounts'], summary: 'Get Loan Details, Amortization Schedule & Ledgers', responses: { '200': { description: 'Loan 360 view' } } },
    },
    '/payments': {
      get: { tags: ['Payments'], summary: 'List Payment Transactions', responses: { '200': { description: 'Paginated payments ledger' } } },
      post: {
        tags: ['Payments'],
        summary: 'Process Repayment via Waterfall Allocation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['loanId', 'amount', 'method'],
                properties: {
                  loanId: { type: 'string' },
                  amount: { type: 'number' },
                  method: { type: 'string', enum: ['UPI', 'NET_BANKING', 'DEBIT_CARD', 'NACH_AUTODEBIT', 'CASH', 'CHEQUE'] },
                  reference: { type: 'string' },
                  idempotencyKey: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Payment recorded and applied' } },
      },
    },
    '/collections/dashboard': {
      get: { tags: ['Collections'], summary: 'Collections KPI Dashboard & DPD Aging Breakdown', responses: { '200': { description: 'Portfolio delinquency metrics' } } },
    },
    '/collections/cases': {
      get: { tags: ['Collections'], summary: 'List Overdue Delinquency Cases', responses: { '200': { description: 'Collection case queue' } } },
    },
    '/collections/activities': {
      post: {
        tags: ['Collections'],
        summary: 'Log Collection Activity (Call / Field Visit)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['caseId', 'activityType', 'outcome'],
                properties: {
                  caseId: { type: 'string' },
                  activityType: { type: 'string', enum: ['CALL', 'SMS', 'EMAIL', 'FIELD_VISIT', 'LEGAL_NOTICE'] },
                  outcome: { type: 'string', enum: ['PROMISE_TO_PAY', 'PAID', 'DISPUTED', 'UNREACHABLE', 'REFUSED_TO_PAY', 'CALL_BACK_REQUESTED'] },
                  notes: { type: 'string' },
                  nextFollowUpDate: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Activity logged' } },
      },
    },
    '/collections/ptp': {
      post: {
        tags: ['Collections'],
        summary: 'Record Promise to Pay (PTP)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['caseId', 'promisedAmount', 'promisedDate'],
                properties: {
                  caseId: { type: 'string' },
                  promisedAmount: { type: 'number' },
                  promisedDate: { type: 'string', format: 'date' },
                  paymentMode: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'PTP recorded' } },
      },
    },
    '/restructuring/restructure': {
      post: {
        tags: ['Restructuring & Settlement'],
        summary: 'Propose & Execute Loan Restructure',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['loanId', 'newTenureMonths', 'newInterestRate'],
                properties: {
                  loanId: { type: 'string' },
                  newTenureMonths: { type: 'integer' },
                  newInterestRate: { type: 'number' },
                  moratoriumMonths: { type: 'integer' },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Loan restructured with new schedule' } },
      },
    },
    '/restructuring/settlement': {
      post: {
        tags: ['Restructuring & Settlement'],
        summary: 'Execute One-Time Settlement (OTS)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['loanId', 'settlementAmount', 'reason'],
                properties: {
                  loanId: { type: 'string' },
                  settlementAmount: { type: 'number' },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Settlement executed and loan marked SETTLED' } },
      },
    },
    '/restructuring/close': {
      post: {
        tags: ['Restructuring & Settlement'],
        summary: 'Close Account & Generate Digital NOC',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['loanId', 'closureType'],
                properties: {
                  loanId: { type: 'string' },
                  closureType: { type: 'string', enum: ['MATURITY', 'FORECLOSURE', 'SETTLEMENT', 'WRITE_OFF'] },
                  remarks: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Loan closed and NOC number issued' } },
      },
    },
    '/finance/emi': {
      post: {
        tags: ['Financial Tools'],
        summary: 'Calculate Reducing Balance EMI and Amortization Schedule',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['principal', 'interestRate', 'tenureMonths'],
                properties: {
                  principal: { type: 'number', example: 100000 },
                  interestRate: { type: 'number', example: 12.0 },
                  tenureMonths: { type: 'integer', example: 12 },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Computed EMI and schedule breakdown' } },
      },
    },
    '/reports/portfolio': {
      get: { tags: ['Reports & Analytics'], summary: 'Portfolio Summary & KPI Metrics', responses: { '200': { description: 'Portfolio metrics' } } },
    },
    '/reports/export/{type}': {
      get: { tags: ['Reports & Analytics'], summary: 'Export Module Data as CSV/Excel', responses: { '200': { description: 'CSV file download' } } },
    },
    '/branches': {
      get: { tags: ['Branches'], summary: 'List Regional Branches', responses: { '200': { description: 'Branches list' } } },
      post: { tags: ['Branches'], summary: 'Create Branch', responses: { '201': { description: 'Branch created' } } },
    },
    '/users': {
      get: { tags: ['User Management'], summary: 'List Staff Users & Roles', responses: { '200': { description: 'Users list' } } },
      post: { tags: ['User Management'], summary: 'Create Staff User', responses: { '201': { description: 'User created' } } },
    },
    '/settings': {
      get: { tags: ['System Settings'], summary: 'List Business Configuration Parameters', responses: { '200': { description: 'Settings parameters' } } },
    },
    '/settings/{key}': {
      get: { tags: ['System Settings'], summary: 'Get Setting Value by Key', responses: { '200': { description: 'Setting value' } } },
      put: { tags: ['System Settings'], summary: 'Update Dynamic Setting Parameter', responses: { '200': { description: 'Setting updated' } } },
    },
    '/notifications': {
      get: { tags: ['Notifications'], summary: 'List User Notifications', responses: { '200': { description: 'Notifications' } } },
    },
    '/notifications/{id}/read': {
      patch: { tags: ['Notifications'], summary: 'Mark Notification as Read', responses: { '200': { description: 'Marked read' } } },
    },
    '/audit': {
      get: { tags: ['Audit Logs'], summary: 'Query Immutable Audit Trail', responses: { '200': { description: 'Audit log entries' } } },
    },
    '/health': {
      get: { tags: ['System Health'], summary: 'Liveness Probe', security: [], responses: { '200': { description: 'Service is alive' } } },
    },
    '/ready': {
      get: { tags: ['System Health'], summary: 'Readiness Probe (DB Ping)', security: [], responses: { '200': { description: 'Database connected' } } },
    },
  },
} as const;
