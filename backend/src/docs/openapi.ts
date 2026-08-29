// Minimal OpenAPI document. Expand as modules grow.
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Adyapan Loan Management System API',
    version: '1.0.0',
    description: 'REST API for the Adyapan LMS. Demo/reference implementation.',
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email/employee ID and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['identifier', 'password'],
                properties: {
                  identifier: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Access token and user profile' } },
      },
    },
    '/finance/emi': {
      post: {
        tags: ['Finance'],
        summary: 'Calculate EMI and amortization schedule',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['principal', 'interestRate', 'tenureMonths'],
                properties: {
                  principal: { type: 'number' },
                  interestRate: { type: 'number' },
                  tenureMonths: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'EMI result' } },
      },
    },
    '/customers': {
      get: { tags: ['Customers'], summary: 'List customers', security: [{ bearerAuth: [] }], responses: { '200': { description: 'OK' } } },
      post: { tags: ['Customers'], summary: 'Create customer', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Created' } } },
    },
    '/loan-products': {
      get: { tags: ['Products'], summary: 'List loan products', security: [{ bearerAuth: [] }], responses: { '200': { description: 'OK' } } },
    },
    '/applications': {
      get: { tags: ['Applications'], summary: 'List applications', security: [{ bearerAuth: [] }], responses: { '200': { description: 'OK' } } },
      post: { tags: ['Applications'], summary: 'Create application', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Created' } } },
    },
  },
} as const;
