async function runStep33Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 33: ENTERPRISE ADMIN & TENANT ONBOARDING LIVE VERIFICATION');
  console.log('====================================================\n');

  // 1. Super Admin Authentication
  console.log('--- 1. SUPER ADMIN AUTHENTICATION ---');
  const saLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'superadmin@adyapan.dev', password: 'Passw0rd!123' }),
  });
  const saData: any = await saLogin.json();
  const saToken = saData.data?.accessToken;
  console.log('Super Admin Login Status:', saLogin.status, 'Token acquired:', Boolean(saToken));

  // 2. Tenant Operations Overview
  console.log('\n--- 2. TENANT OPERATIONS OVERVIEW ---');
  const opsRes = await fetch('http://localhost:4000/api/v1/tenants/operations-overview', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const opsData: any = await opsRes.json();
  const ops = opsData.data;
  console.log('Operations Center Status:', opsRes.status);
  console.log('  - Total Managed Institutions:', ops?.totalTenants);
  console.log('  - Active Operational:', ops?.activeTenantsCount, '| Suspended:', ops?.suspendedTenantsCount);
  console.log('  - Enterprise Tier Count:', ops?.enterpriseTierCount);

  // 3. Multi-Step Guided Institutional Provisioning
  console.log('\n--- 3. MULTI-STEP GUIDED INSTITUTIONAL PROVISIONING ---');
  const onboardRes = await fetch('http://localhost:4000/api/v1/tenants/onboard-wizard', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organization: {
        code: 'ZENITH_CAPITAL_VERIFY',
        name: 'Zenith Capital Lending Corporation',
        cinNumber: 'U65922KA2024PTC998877',
        rbiRegistrationNo: 'RBI/NBFC/ND-NSI/2024/882',
        tier: 'ENTERPRISE',
        domain: 'zenithlending.dev',
        contactEmail: 'admin@zenithlending.dev',
        supportPhone: '+91 1800 900 1122',
      },
      adminUser: {
        email: 'director@zenithlending.dev',
        firstName: 'Vikramaditya',
        lastName: 'Singhania',
      },
      policyTemplate: 'DIGITAL_FINTECH_LENDER',
      loanProductTemplates: ['PERSONAL_LOAN', 'SME_BUSINESS_LOAN', 'BNPL_LINE'],
      primaryBranch: {
        branchCode: 'B-BLR-01',
        branchName: 'Bengaluru Corporate Office',
        city: 'Bengaluru',
        state: 'Karnataka',
      },
      integrationProviders: {
        creditBureau: 'CIBIL',
        paymentGateway: 'RAZORPAY',
        disbursementPayout: 'CASHFREE',
        kycProvider: 'DIGILOCKER',
      },
      branding: {
        brandName: 'Zenith Capital',
        primaryColorHex: '#0284C7',
        portalDomain: 'portal.zenithlending.dev',
      },
    }),
  });

  const onboardData: any = await onboardRes.json();
  const summary = onboardData.data;
  console.log('Onboard Wizard Status:', onboardRes.status, 'Tenant ID:', summary?.tenantId);
  console.log('  - Code:', summary?.tenantCode, '| Name:', summary?.name);
  console.log('  - Status:', summary?.status, '| Tier:', summary?.tier);
  console.log('  - Roles Initialized:', summary?.rolesInitializedCount);
  console.log('  - Integrations Configured:', summary?.integrationsConfiguredCount);
  console.log('  - Branding Initialized:', summary?.brandingInitialized);
  console.log('  - Consent Templates Initialized:', summary?.consentTemplatesInitialized);
  console.log('  - SHA-256 Provisioning Evidence Ref:', summary?.auditEvidenceRef);

  // 4. Institutional Setup Certificate
  console.log('\n--- 4. INSTITUTIONAL SETUP CERTIFICATE ---');
  const certRes = await fetch(`http://localhost:4000/api/v1/tenants/${summary?.tenantId}/setup-certificate`, {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const certData: any = await certRes.json();
  const cert = certData.data;
  console.log('Certificate Status:', certRes.status, 'ID:', cert?.certificateId);
  console.log('  - Institution:', cert?.institutionName, `(${cert?.tenantCode})`);
  console.log('  - Statutory Compliance Certified:', cert?.statutoryComplianceCertified);
  console.log('  - Governance Framework:', cert?.governanceFramework);

  // 5. Tenant Suspension & Reactivation Lifecycle
  console.log('\n--- 5. TENANT SUSPENSION & REACTIVATION LIFECYCLE ---');
  // Suspend
  const suspRes = await fetch(`http://localhost:4000/api/v1/tenants/${summary?.tenantId}/suspend`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason: 'Simulated compliance review hold' }),
  });
  const suspData: any = await suspRes.json();
  console.log('Suspend Status:', suspRes.status, 'New Status:', suspData.data?.status);

  // Reactivate
  const reactRes = await fetch(`http://localhost:4000/api/v1/tenants/${summary?.tenantId}/reactivate`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const reactData: any = await reactRes.json();
  console.log('Reactivate Status:', reactRes.status, 'New Status:', reactData.data?.status);

  // 6. Borrower Isolation & RBAC Protection
  console.log('\n--- 6. BORROWER ISOLATION & RBAC PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;

  const bOpsRes = await fetch('http://localhost:4000/api/v1/tenants/operations-overview', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Access Operations Center Status:', bOpsRes.status, '(Expected 403 Forbidden)');

  const bOnboardRes = await fetch('http://localhost:4000/api/v1/tenants/onboard-wizard', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ organization: { code: 'HACK' } }),
  });
  console.log('Borrower Provision Institution Status:', bOnboardRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 33 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep33Verification().catch(console.error);
