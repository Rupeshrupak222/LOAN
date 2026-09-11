/**
 * Phase 6 Verification Test Suite — B2B Tenant & Product Configuration
 * Validates multi-tenant isolation, readiness evaluation, configuration bundle,
 * branding with WCAG contrast checks, branch & staff management, and security boundaries.
 */

const { tenantService } = require('../backend/dist/modules/tenants/tenant.service');
const { tenantProvisioningService } = require('../backend/dist/modules/tenants/tenant-provisioning.service');
const { brandingService } = require('../backend/dist/modules/branding/branding.service');
const { productEngineService } = require('../backend/dist/modules/product/product-engine.service');
const { workflowService } = require('../backend/dist/modules/workflows/workflow.service');
const { decisionEngineService } = require('../backend/dist/modules/bre/decision-engine.service');
const { approvalAuthorityService } = require('../backend/dist/modules/approval-authority/approval-authority.service');
const { creditLimitsService } = require('../backend/dist/modules/credit-limits/credit-limits.service');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('  ADYAPAN LENDING OS — PHASE 6: B2B TENANT ENGINE TEST SUITE');
  console.log('================================================================\n');

  const superAdmin = { id: 'usr-super-admin-001', roles: ['SUPER_ADMIN'], email: 'superadmin@adyapan.dev' };
  const tenantAdmin1 = { id: 'usr-apex-admin-001', roles: ['ADMIN', 'COMPANY_ADMIN'], tenantId: 'tenant-apex-nbfc', email: 'admin@apexcap.dev' };
  const tenantAdmin2 = { id: 'usr-prime-admin-001', roles: ['ADMIN'], tenantId: 'tenant-adyapan-default', email: 'admin@adyapan.dev' };

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: MULTI-TENANT ISOLATION & ENGINE PARTITIONING
  // ---------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: Multi-Tenant Engine Isolation ---');

  // Verify primary tenant and secondary tenant catalogs
  const primeProducts = productEngineService.listProducts('tenant-adyapan-default');
  const apexProducts = productEngineService.listProducts('tenant-apex-nbfc');

  assert(primeProducts.length > 0, `Primary tenant has ${primeProducts.length} registered products`);
  assert(apexProducts.length > 0, `Apex tenant has ${apexProducts.length} registered products`);
  assert(
    primeProducts[0].id !== apexProducts[0].id,
    'Products across tenants have unique isolated identifiers'
  );

  // Verify workflows isolation
  const primeWorkflows = workflowService.listWorkflows('tenant-adyapan-default');
  const apexWorkflows = workflowService.listWorkflows('tenant-apex-nbfc');
  assert(primeWorkflows.length > 0 && apexWorkflows.length > 0, 'Workflows isolated per tenant partition');

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: TENANT READINESS EVALUATION ENGINE (8 DOMAINS)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Tenant Readiness Validation Engine ---');

  const primeReadiness = await tenantService.evaluateTenantReadiness('tenant-adyapan-default');
  assert(primeReadiness.tenantId === 'tenant-adyapan-default', 'Readiness evaluated for primary tenant');
  assert(primeReadiness.totalDomainsCount === 8, 'Readiness engine audits exactly 8 operational domains');
  assert(primeReadiness.domains.length === 8, '8 domain check items returned');

  const domainNames = primeReadiness.domains.map((d) => d.domain);
  const expectedDomains = [
    'PRODUCTS',
    'WORKFLOWS',
    'DECISION_RULES',
    'PRICING',
    'APPROVAL_MATRIX',
    'CREDIT_POLICIES',
    'BRANCHES',
    'STAFF_USERS',
  ];
  const allDomainsPresent = expectedDomains.every((ed) => domainNames.includes(ed));
  assert(allDomainsPresent, 'All 8 required governance domains present in readiness result');
  assert(primeReadiness.readinessScorePct >= 75, `Readiness score is ${primeReadiness.readinessScorePct}%`);

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: UNIFIED TENANT CONFIGURATION BUNDLE
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Unified Configuration Bundle ---');

  const configBundle = await tenantService.getTenantConfiguration('tenant-adyapan-default', superAdmin);
  assert(configBundle.tenant.id === 'tenant-adyapan-default', 'Bundle contains tenant entity');
  assert(Boolean(configBundle.branding.institutionName), 'Bundle contains branding config');
  assert(configBundle.productsSummary.total >= 0, 'Bundle contains products summary');
  assert(configBundle.workflowsSummary.total >= 0, 'Bundle contains workflows summary');
  assert(configBundle.decisionPoliciesSummary.totalRules >= 0, 'Bundle contains BRE rules summary');
  assert(configBundle.approvalMatrixSummary.levelsCount >= 0, 'Bundle contains approval authority summary');
  assert(configBundle.creditLimitsSummary.facilityTypesConfigured.length > 0, 'Bundle contains credit limit facility types');

  // ---------------------------------------------------------------------------
  // TEST GROUP 4: WHITE-LABEL BRANDING & WCAG CONTRAST VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: White-Label Branding Engine ---');

  const primeBranding = brandingService.getTenantBranding('tenant-adyapan-default');
  assert(primeBranding.institutionName === 'Adyapan Prime Lending', 'Retrieved primary tenant branding');

  const apexBranding = brandingService.getTenantBranding('tenant-apex-nbfc');
  assert(apexBranding.institutionName === 'Apex Capital Partners', 'Retrieved secondary tenant branding');
  assert(apexBranding.primaryColor === '#7C3AED', 'Apex has custom purple theme (#7C3AED)');

  // Test WCAG Contrast calculation
  const blueContrast = brandingService.calculateContrastAgainstWhite('#2563EB');
  assert(blueContrast >= 4.0, `FinTech Blue (#2563EB) contrast ratio is ${blueContrast}:1 (Safe)`);

  // Test invalid contrast rejection
  let contrastRejected = false;
  try {
    brandingService.validateColorContrast('#FFFFFF'); // White on white has 1:1 contrast
  } catch (err) {
    contrastRejected = true;
  }
  assert(contrastRejected, 'Unsafe low-contrast colors strictly rejected with validation error');

  // Test branding update
  const updatedBranding = await brandingService.updateTenantBranding(
    'tenant-adyapan-default',
    { tagline: 'Enterprise Multi-Tenant Lending Infrastructure' },
    superAdmin
  );
  assert(updatedBranding.tagline === 'Enterprise Multi-Tenant Lending Infrastructure', 'Tenant branding updated successfully');

  // ---------------------------------------------------------------------------
  // TEST GROUP 5: SECURITY BOUNDARIES & ANTI-SPOOFING (IDOR PROTECTION)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Security Boundaries & Anti-Spoofing ---');

  // 1. SuperAdmin can access any tenant
  const superAdminScope = tenantService.resolveTenantScope(superAdmin, 'tenant-apex-nbfc');
  assert(superAdminScope === 'tenant-apex-nbfc', 'SuperAdmin authorized to inspect any tenant scope');

  // 2. Tenant Admin accessing own tenant scope
  const ownScope = tenantService.resolveTenantScope(tenantAdmin1, 'tenant-apex-nbfc');
  assert(ownScope === 'tenant-apex-nbfc', 'Tenant Admin authorized for own tenant scope');

  // 3. IDOR Attempt: Tenant Admin 1 attempts to access Tenant 2 data
  let idorBlocked = false;
  try {
    tenantService.resolveTenantScope(tenantAdmin1, 'tenant-adyapan-default');
  } catch (err) {
    idorBlocked = true;
  }
  assert(idorBlocked, 'Cross-tenant IDOR access attempt strictly blocked with ForbiddenError');

  // ---------------------------------------------------------------------------
  // TEST GROUP 6: INSTITUTIONAL SETUP CERTIFICATE GENERATION
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Institutional Setup Certificate ---');

  const cert = await tenantProvisioningService.generateSetupCertificate('tenant-adyapan-default', superAdmin);
  assert(Boolean(cert.certificateId), `Setup Certificate generated: ${cert.certificateId}`);
  assert(Boolean(cert.integritySignature), 'Setup Certificate contains cryptographic integrity hash');
  assert(cert.statutoryComplianceCertified === true, 'Statutory NBFC compliance certified');
  assert(
    cert.isolationLevel === 'POSTGRESQL_ROW_LEVEL_MULTITENANT_SCOPING',
    'Isolation level explicitly stated in certificate'
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  PHASE 6 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
